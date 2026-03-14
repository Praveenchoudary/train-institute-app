// ══════════════════════════════════════════════════════════════════
//  database.js — PostgreSQL Connection Pool
//
//  Uses pg.Pool (not a single client) so multiple concurrent
//  requests each get their own DB connection from the pool.
//  Pool size: up to 20 simultaneous connections.
// ══════════════════════════════════════════════════════════════════

const { Pool } = require('pg');
const logger   = require('./logger');

const pool = new Pool({
  host:                   process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT)|| 5432,
  database:               process.env.DB_NAME     || 'institute_db',
  user:                   process.env.DB_USER     || 'institute_user',
  password:               process.env.DB_PASSWORD,
  max:                    20,      // max pool size
  idleTimeoutMillis:      30000,   // close idle clients after 30s
  connectionTimeoutMillis: 3000,   // fail if can't connect in 3s
});

pool.on('error', (err) => {
  logger.error('Unexpected PG pool error:', err);
});

// Called at startup to verify connection is working
async function connectDB() {
  const client = await pool.connect();
  logger.info('✅ PostgreSQL connected');
  client.release();
}

// Wrapper — all route files call query() instead of pool.query()
// so we can add logging/tracing in one place
async function query(text, params) {
  const start = Date.now();
  const res   = await pool.query(text, params);
  logger.debug(`query [${Date.now() - start}ms] rows=${res.rowCount}`);
  return res;
}

module.exports = { connectDB, query, pool };
