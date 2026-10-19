-- DM Sales Agent migration
-- Run once in Supabase SQL editor after the main schema.

-- ── 1. Secure secrets store (never readable by anon) ─────────────────────────
CREATE TABLE IF NOT EXISTS integration_secrets (
  id    text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);
ALTER TABLE integration_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "secrets_service_only" ON integration_secrets
  FOR ALL USING (auth.role() = 'service_role');

-- Seed empty rows — admin fills via Settings UI
INSERT INTO integration_secrets (id, value) VALUES
  ('whatsapp_phone_number_id', ''),
  ('whatsapp_access_token',    ''),
  ('whatsapp_verify_token',    ''),
  ('whatsapp_app_secret',      ''),
  ('instagram_page_id',        ''),
  ('instagram_access_token',   ''),
  ('instagram_verify_token',   ''),
  ('instagram_app_secret',     ''),
  ('claude_api_key',           '')
ON CONFLICT (id) DO NOTHING;

-- Non-secret enable flags stay in site_settings (anon-readable is fine)
INSERT INTO site_settings (id, value) VALUES
  ('whatsapp_enabled',  'false'::jsonb),
  ('instagram_enabled', 'false'::jsonb),
  ('dm_agent_persona',  '"friendly and professional"'::jsonb),
  ('dm_agent_floor_pct','0'::jsonb)  -- % below list price agent can go (0 = no discount allowed)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Conversations table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform           text NOT NULL CHECK (platform IN ('whatsapp', 'instagram')),
  platform_user_id   text NOT NULL,
  platform_page_id   text NOT NULL DEFAULT '',
  mode               text NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'human')),
  customer_name      text,
  customer_phone     text,
  last_message_at    timestamptz DEFAULT now(),
  created_at         timestamptz DEFAULT now(),
  UNIQUE (platform, platform_user_id, platform_page_id)
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_service_only" ON conversations
  FOR ALL USING (auth.role() = 'service_role');

-- ── 3. Messages table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dm_messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role                text NOT NULL CHECK (role IN ('customer', 'agent', 'human')),
  content             text NOT NULL,
  platform_message_id text UNIQUE,
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_messages_service_only" ON dm_messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS dm_messages_conv_idx ON dm_messages (conversation_id, created_at);

-- ── 4. Orders additions ───────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source           text DEFAULT 'web',     -- web | whatsapp_dm | instagram_dm
  ADD COLUMN IF NOT EXISTS fulfilment_stage text DEFAULT 'paid';    -- paid | packing | packed | dispatched

-- ── 5. Products: floor price (admin-only, never surfaced in chat UI) ──────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS floor_price numeric(12,2);
