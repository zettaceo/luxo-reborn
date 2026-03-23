-- ══════════════════════════════════════════════════════
-- LUXO REBORN — Schema do Banco de Dados
-- Execute no Supabase: Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CATEGORIAS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  emoji       TEXT NOT NULL DEFAULT '🎁',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias iniciais
INSERT INTO categories (name, slug, emoji, description) VALUES
  ('Bebês Reborn',  'bebes-reborn',  '👶🏻', 'Bebês artesanais de alta qualidade'),
  ('Pelúcias',      'pelucias',      '🐻',  'Pelúcias macias para todas as idades'),
  ('Brinquedos',    'brinquedos',    '🎮',  'Brinquedos incríveis'),
  ('Cadernos',      'cadernos',      '📓',  'Cadernos e papelaria'),
  ('Presentes',     'presentes',     '🎁',  'Kits presente especiais')
ON CONFLICT (slug) DO NOTHING;

-- ── PRODUTOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL DEFAULT '',
  price           NUMERIC(10,2) NOT NULL,
  old_price       NUMERIC(10,2),
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock           INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  is_featured     BOOLEAN DEFAULT FALSE,
  badge           TEXT,                          -- "Novo", "Top", "Promoção"
  weight_grams    INTEGER DEFAULT 500,           -- para cálculo de frete
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── IMAGENS DOS PRODUTOS ──────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  position    INTEGER DEFAULT 0,
  is_cover    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── CLIENTES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  phone       TEXT,
  cpf         TEXT,
  password_hash TEXT,
  last_login_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ENDEREÇOS DO CLIENTE ─────────────────────────────────
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

-- ── PAGAMENTOS SALVOS (REFERÊNCIAS SEGURAS) ──────────────
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

-- ── PEDIDOS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number         TEXT NOT NULL UNIQUE,
  customer_id          UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name        TEXT NOT NULL,
  customer_email       TEXT NOT NULL,
  customer_phone       TEXT NOT NULL,
  customer_cpf         TEXT NOT NULL,

  -- Endereço de entrega
  address_zip          TEXT NOT NULL,
  address_street       TEXT NOT NULL,
  address_number       TEXT NOT NULL,
  address_complement   TEXT,
  address_neighborhood TEXT NOT NULL,
  address_city         TEXT NOT NULL,
  address_state        TEXT NOT NULL,

  -- Valores
  subtotal             NUMERIC(10,2) NOT NULL,
  shipping_cost        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount             NUMERIC(10,2) DEFAULT 0,
  total                NUMERIC(10,2) NOT NULL,

  -- Pagamento
  payment_method       TEXT NOT NULL CHECK (payment_method IN ('pix','credit_card','debit_card')),
  payment_status       TEXT NOT NULL DEFAULT 'pending'
                         CHECK (payment_status IN ('pending','approved','rejected','cancelled')),
  payment_id           TEXT,                    -- ID do Mercado Pago
  pix_qr_code          TEXT,
  pix_qr_code_base64   TEXT,
  pix_expiration       TIMESTAMPTZ,

  -- Status do pedido
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  tracking_code        TEXT,
  shipping_service     TEXT,

  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence para order_number legível: LR-00001, LR-00002...
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'LR-' || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ── ITENS DO PEDIDO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name   TEXT NOT NULL,               -- snapshot
  product_image  TEXT,                         -- snapshot
  quantity       INTEGER NOT NULL,
  unit_price     NUMERIC(10,2) NOT NULL,
  total_price    NUMERIC(10,2) NOT NULL
);

-- ── AVALIAÇÕES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  is_approved     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── UPDATED_AT AUTOMÁTICO ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customer_addresses_updated_at BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customer_payment_methods_updated_at BEFORE UPDATE ON customer_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ÍNDICES PARA PERFORMANCE ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active      ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug        ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment       ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_email         ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer      ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product      ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved     ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_addresses_default
  ON customer_addresses(customer_id) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_customer ON customer_payment_methods(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_payment_methods_default
  ON customer_payment_methods(customer_id) WHERE is_default = TRUE;

-- ── ROW LEVEL SECURITY (RLS) ──────────────────────────
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- Leitura pública (anon): produtos ativos e categorias
CREATE POLICY "Produtos ativos visíveis publicamente"
  ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Categorias visíveis publicamente"
  ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Imagens de produtos visíveis publicamente"
  ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "Avaliações aprovadas visíveis publicamente"
  ON reviews FOR SELECT USING (is_approved = TRUE);

-- Escrita pública: criação de pedidos e avaliações
-- Segurança: pedidos NÃO ficam acessíveis via anon/authenticated diretamente.
-- O acesso é feito apenas pelas API routes com service_role.
DROP POLICY IF EXISTS "Clientes podem criar pedidos" ON orders;
DROP POLICY IF EXISTS "Clientes podem ver seus pedidos" ON orders;

CREATE POLICY "Clientes podem criar avaliações"
  ON reviews FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Customers service role only"
  ON customers FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Customer addresses service role only"
  ON customer_addresses FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Customer payment methods service role only"
  ON customer_payment_methods FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Admin (service_role bypassa RLS automaticamente)
-- Todas as operações de admin usam SUPABASE_SERVICE_ROLE_KEY
