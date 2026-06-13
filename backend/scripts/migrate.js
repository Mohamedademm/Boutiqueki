/**
 * Simple SQL migration runner.
 * Applies backend/migrations/*.sql in filename order, once each, tracked in a _migrations table.
 *
 *   npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db } = require('../src/utils');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const applied = new Set(
    (await db.query('SELECT filename FROM _migrations')).rows.map(r => r.filename)
  );

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭️  ${file} (déjà appliqué)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✅ ${file}`);
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ ${file} — ${err.message}`);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log(count === 0 ? '\nBase à jour, rien à appliquer.' : `\n${count} migration(s) appliquée(s).`);
  await db.closePool();
}

run().catch(err => { console.error(err); process.exit(1); });
