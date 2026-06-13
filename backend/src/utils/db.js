/**
 * @boutiki/utils — Database Module
 * PostgreSQL connection pool singleton using `pg`
 *
 * Usage:
 *   const { db } = require('@boutiki/utils');
 *   const pool = db.getPool();
 *   const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
 */

const { Pool } = require('pg');

let pool = null;

/**
 * Get or create the PostgreSQL connection pool (singleton).
 * Reads DATABASE_URL from environment variables.
 * @returns {Pool} The pg Pool instance
 */
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        '[boutiki-utils] DATABASE_URL is not defined in environment variables.'
      );
    }

    pool = new Pool({
      connectionString,
      // Neon.tech requires SSL
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      max: 20,                   // Max connections in the pool
      idleTimeoutMillis: 30000,  // Close idle connections after 30s
      connectionTimeoutMillis: 20000, // Fail if connection takes > 20s (Neon wakeup)
    });

    // Log pool errors
    pool.on('error', (err) => {
      console.error('[boutiki-utils] Unexpected pool error:', err.message);
    });
  }

  return pool;
}

/**
 * Execute a query using the pool.
 * Convenience wrapper around pool.query().
 * @param {string} text — SQL query string
 * @param {Array} params — Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[SQL] ${duration}ms — ${text.substring(0, 80)}...`);
  }

  return result;
}

/**
 * Get a client from the pool for transactions.
 * IMPORTANT: Always release the client after use!
 *
 * Usage:
 *   const client = await db.getClient();
 *   try {
 *     await client.query('BEGIN');
 *     await client.query('INSERT INTO ...', [...]);
 *     await client.query('COMMIT');
 *   } catch (e) {
 *     await client.query('ROLLBACK');
 *     throw e;
 *   } finally {
 *     client.release();
 *   }
 */
async function getClient() {
  return getPool().connect();
}

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() AS server_time');
    console.log(
      `✅ PostgreSQL Connected — Server time: ${result.rows[0].server_time}`
    );
    return true;
  } catch (error) {
    console.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    return false;
  }
}

/**
 * Gracefully close the pool.
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 PostgreSQL pool closed.');
  }
}

module.exports = {
  getPool,
  query,
  getClient,
  testConnection,
  closePool,
};
