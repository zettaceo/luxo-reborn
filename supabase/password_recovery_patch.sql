-- ═════════════════════════════════════════════════════════════════════
-- PATCH: Recuperação de senha para contas de cliente
-- Execute este script se você já tinha rodado customer_accounts.sql antes.
-- ═════════════════════════════════════════════════════════════════════

ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_password_token_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_password_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_customers_reset_token
  ON customers(reset_password_token_hash);
