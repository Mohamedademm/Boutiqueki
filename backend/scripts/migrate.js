/**
 * SQL migration runner (CLI). Applies backend/migrations/*.sql once each, tracked in _migrations.
 *   npm run migrate
 */
require('dotenv').config();
const { runMigrations } = require('../src/lib/migrate');
const { db } = require('../src/utils');

(async () => {
  try {
    const applied = await runMigrations();
    console.log(applied.length === 0 ? 'Base à jour, rien à appliquer.' : `Appliqué : ${applied.join(', ')}`);
    await db.closePool();
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
})();
