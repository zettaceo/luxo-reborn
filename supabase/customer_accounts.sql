-- ═════════════════════════════════════════════════════════════════════
-- PATCH: Área de cliente (conta própria, endereços e pagamentos salvos)
-- Execute este arquivo no SQL Editor para bancos já existentes.
-- ═════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Novas colunas em customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_password_token_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_password_requested_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Tabela de endereços do cliente
CREATE TABLE IF NOT EXISTS customer_addresses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label          TEXT NOT NULL DEFAULT 'Endereço',
  recipient_name TEXT NOT NULL,
  phone          TEXT,
  zip            TEXT NOT NULL,
  street         TEXT NOT NULL,
  number         TEXT NOT NULL,
  complement     TEXT,
  neighborhood   TEXT NOT NULL,
  city           TEXT NOT NULL,
  state          TEXT NOT NULL,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Tabela de formas de pagamento salvas (somente referência segura)
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('pix','credit_card','debit_card','boleto','wallet')),
  label           TEXT NOT NULL,
  holder_name     TEXT,
  brand           TEXT,
  last4           TEXT,
  token_reference TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Trigger de updated_at reaproveitando função já existente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'customers_updated_at'
  ) THEN
    CREATE TRIGGER customers_updated_at
      BEFORE UPDATE ON customers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'customer_addresses_updated_at'
  ) THEN
    CREATE TRIGGER customer_addresses_updated_at
      BEFORE UPDATE ON customer_addresses
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'customer_payment_methods_updated_at'
  ) THEN
    CREATE TRIGGER customer_payment_methods_updated_at
      BEFORE UPDATE ON customer_payment_methods
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 5) Índices
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_addresses_default
  ON customer_addresses(customer_id) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_customer ON customer_payment_methods(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_payment_methods_default
  ON customer_payment_methods(customer_id) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_customers_reset_token ON customers(reset_password_token_hash);

-- 6) RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- Remove política antiga aberta de criação de cliente
DROP POLICY IF EXISTS "Clientes podem criar conta" ON customers;

-- Garante políticas apenas para service_role
DROP POLICY IF EXISTS "Customers service role only" ON customers;
CREATE POLICY "Customers service role only"
  ON customers FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Customer addresses service role only" ON customer_addresses;
CREATE POLICY "Customer addresses service role only"
  ON customer_addresses FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Customer payment methods service role only" ON customer_payment_methods;
CREATE POLICY "Customer payment methods service role only"
  ON customer_payment_methods FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
