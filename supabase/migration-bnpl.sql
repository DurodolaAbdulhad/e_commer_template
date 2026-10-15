-- Migration: BNPL / Klump installment plan columns
-- Run once in Supabase SQL editor.

-- Klump plan tracking columns on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS bnpl_plan_id text,
  ADD COLUMN IF NOT EXISTS bnpl_status  text
    CHECK (bnpl_status IN ('active','completed','declined','closed'));

-- site_settings defaults (admin-activate before customers see BNPL at checkout)
INSERT INTO site_settings (id, value) VALUES
  ('bnpl_enabled',     'false'::jsonb),
  ('klump_public_key', '""'::jsonb),
  ('bnpl_min_amount',  '10000'::jsonb)
ON CONFLICT (id) DO NOTHING;
