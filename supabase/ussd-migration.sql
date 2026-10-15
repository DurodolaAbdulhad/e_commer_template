-- Task 17: USSD fallback support
-- Run once in Supabase SQL Editor.

-- Track order source (web / ussd / whatsapp / etc.)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source text;

-- USSD settings seed (flip to 'true' to enable)
INSERT INTO site_settings (id, value)
VALUES ('ussd_enabled', false),
       ('ussd_service_code', '*384*XXXXX#')
ON CONFLICT (id) DO NOTHING;
