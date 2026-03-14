-- ══════════════════════════════════════════════════════════════════
--  002_payments.sql
--
--  WHY A SEPARATE FILE?
--  Postgres runs files in /docker-entrypoint-initdb.d/ alphabetically
--  on first boot only. Having 002_ separate means:
--    - 001_schema.sql runs first  (core tables + seed data)
--    - 002_payments.sql runs second (payment tables)
--  Both use CREATE TABLE IF NOT EXISTS so they're safe to re-run.
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id       INTEGER NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3)    NOT NULL DEFAULT 'USD',
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','failed','refunded')),
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);

CREATE TABLE IF NOT EXISTS payments (
  id                SERIAL PRIMARY KEY,
  order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gateway           VARCHAR(50)  NOT NULL DEFAULT 'dummy',
  transaction_id    VARCHAR(100) NOT NULL UNIQUE,
  amount            DECIMAL(10,2) NOT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','success','failed','refunded')),
  card_last4        VARCHAR(4),
  card_brand        VARCHAR(20),
  cardholder_name   VARCHAR(255),
  gateway_response  JSONB,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order  ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_txn    ON payments(transaction_id);
