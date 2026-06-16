const fs = require('fs');
const path = require('path');
const { db } = require('../utils');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

/**
 * Apply all pending SQL migrations (in filename order), tracked in _migrations.
 * Idempotent and safe to run repeatedly. Returns the list of newly applied files.
 */
async function runMigrations() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const applied = new Set(
    (await db.query('SELECT filename FROM _migrations')).rows.map((r) => r.filename)
  );

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  const newlyApplied = [];

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      newlyApplied.push(file);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  return newlyApplied;
}

module.exports = { runMigrations };
