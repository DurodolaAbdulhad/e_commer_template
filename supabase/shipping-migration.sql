-- Task 10: Shipping integration — Kwik, Sendbox, GIG Logistics
-- Run once in Supabase SQL editor

-- Add shipping columns to orders if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waybill_number    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_provider text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url      text;

-- Per-courier enable flags (false by default — admin must activate)
INSERT INTO site_settings (id, value) VALUES
  ('kwik_enabled',    'false'::jsonb),
  ('sendbox_enabled', 'false'::jsonb),
  ('gig_enabled',     'false'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Courier API keys (empty by default)
INSERT INTO site_settings (id, value) VALUES
  ('kwik_secret_key',   '""'::jsonb),
  ('sendbox_api_key',   '""'::jsonb),
  ('gig_client_id',     '""'::jsonb),
  ('gig_client_secret', '""'::jsonb),
  ('gig_origin_code',   '"IKEJA-HQ"'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Store origin address for rate calculation / waybill pickup
INSERT INTO site_settings (id, value) VALUES
  ('shipping_origin', '{"name":"","phone":"","address":"","city":"Lagos","state":"Lagos"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
