-- Task 16: Agent / Field Sales Network migration
-- Run once against your Supabase project (SQL Editor → Run)

-- 1. Add agent_code to admin_users (unique short code each agent shares as a referral link)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS agent_code  text UNIQUE,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) NOT NULL DEFAULT 5.00;

-- 2. Add agent_code to orders (attribution — set at checkout from ?ref= param)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS agent_code text;

-- 3. Index for fast per-agent order lookups
CREATE INDEX IF NOT EXISTS idx_orders_agent_code ON orders (agent_code)
  WHERE agent_code IS NOT NULL;

-- 4. Optional: if you want to see agent commission totals as a DB view
CREATE OR REPLACE VIEW agent_commission_summary AS
SELECT
  au.id          AS agent_id,
  au.name,
  au.email,
  au.agent_code,
  au.commission_rate,
  au.is_active,
  COUNT(o.id)                                         AS total_orders,
  COALESCE(SUM(o.total), 0)                           AS total_sales,
  COALESCE(SUM(o.total * au.commission_rate / 100), 0) AS total_commission
FROM admin_users au
LEFT JOIN orders o ON o.agent_code = au.agent_code
WHERE au.role = 'agent'
GROUP BY au.id, au.name, au.email, au.agent_code, au.commission_rate, au.is_active;
