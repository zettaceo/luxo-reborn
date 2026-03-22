-- ══════════════════════════════════════════════════════
-- LUXO REBORN — Tabela de analytics de funil
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name  TEXT NOT NULL,
  event_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id  TEXT,
  page_path   TEXT,
  referrer    TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name
  ON analytics_events(event_name);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON analytics_events(session_id);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Analytics service role only" ON analytics_events;
CREATE POLICY "Analytics service role only"
  ON analytics_events
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);
