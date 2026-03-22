-- ══════════════════════════════════════════════════════
-- LUXO REBORN — Security patch (aplicar em bancos existentes)
-- ══════════════════════════════════════════════════════
-- Objetivo:
-- 1) Remover leitura/escrita pública direta em orders
-- 2) Manter pedidos acessíveis apenas via backend (service_role)

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clientes podem criar pedidos" ON orders;
DROP POLICY IF EXISTS "Clientes podem ver seus pedidos" ON orders;
