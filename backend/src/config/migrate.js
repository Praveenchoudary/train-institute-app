// ══════════════════════════════════════════════════════════════════
//  migrate.js — Runtime migration runner
//
//  WHY THIS EXISTS:
//  PostgreSQL only runs /docker-entrypoint-initdb.d/ scripts on a
//  FRESH empty volume. If you already had a running database when
//  payment tables were added, they never got created.
//
//  This script runs at every backend startup and creates any
//  missing tables using IF NOT EXISTS — completely safe to re-run.
//  It takes < 50ms and is idempotent (no harm running it 100 times).
// ══════════════════════════════════════════════════════════════════
const { query } = require('./database');

async function runMigrations() {
  console.log('[migrate] Checking schema...');

  // ── Payment: orders table ──────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id          SERIAL PRIMARY KEY,
      student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id   INTEGER NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
      amount      DECIMAL(10,2) NOT NULL,
      currency    VARCHAR(3)   NOT NULL DEFAULT 'USD',
      status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','failed','refunded')),
      created_at  TIMESTAMPTZ  DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status)`);

  // ── Payment: payments table ────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id               SERIAL PRIMARY KEY,
      order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      gateway          VARCHAR(50)  NOT NULL DEFAULT 'dummy',
      transaction_id   VARCHAR(100) NOT NULL UNIQUE,
      amount           DECIMAL(10,2) NOT NULL,
      status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','success','failed','refunded')),
      card_last4       VARCHAR(4),
      card_brand       VARCHAR(20),
      cardholder_name  VARCHAR(255),
      gateway_response JSONB,
      paid_at          TIMESTAMPTZ,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_order  ON payments(order_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_txn    ON payments(transaction_id)`);

  console.log('[migrate] Schema up to date ✓');
}

module.exports = { runMigrations };
