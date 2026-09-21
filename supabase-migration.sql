-- ================================================================
-- Ascent E-Commerce — Full Schema Migration
-- Paste this entire file into Supabase SQL Editor and click Run
-- Safe to run more than once (uses CREATE TABLE IF NOT EXISTS)
-- ================================================================

-- Products
CREATE TABLE IF NOT EXISTS products (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          text NOT NULL,
  slug          text UNIQUE,
  description   text,
  price         numeric NOT NULL DEFAULT 0,
  compare_price numeric,
  images        jsonb DEFAULT '[]',
  category_id   text,
  sku           text,
  brand         text,
  stock         int NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  is_featured   boolean NOT NULL DEFAULT false,
  is_flash_deal boolean NOT NULL DEFAULT false,
  flash_deal_end timestamptz,
  rating        numeric DEFAULT 0,
  review_count  int DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       text NOT NULL,
  slug       text UNIQUE,
  image      text,
  icon       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type       text NOT NULL,
  title      text,
  subtitle   text,
  discount   text,
  price      text,
  image      text,
  link       text,
  cta        text,
  bg_color   text,
  position   int DEFAULT 1,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS posts (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title         text NOT NULL,
  slug          text UNIQUE,
  excerpt       text,
  content       text,
  cover_image   text,
  category      text,
  author        text,
  author_avatar text,
  tags          jsonb DEFAULT '[]',
  read_time     int,
  is_published  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         text UNIQUE NOT NULL,
  source        text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Orders  ← fixes "orders not showing in admin"
CREATE TABLE IF NOT EXISTS orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      text,
  status            text NOT NULL DEFAULT 'processing',
  payment_status    text NOT NULL DEFAULT 'pending',
  payment_method    text,
  payment_reference text UNIQUE,
  subtotal          numeric NOT NULL DEFAULT 0,
  shipping_cost     numeric NOT NULL DEFAULT 0,
  discount          numeric NOT NULL DEFAULT 0,
  vat               numeric NOT NULL DEFAULT 0,
  total             numeric NOT NULL DEFAULT 0,
  coupon_code       text,
  delivery_method   text DEFAULT 'store_delivery',
  customer_name     text,
  customer_email    text,
  customer_phone    text,
  shipping_address  jsonb DEFAULT '{}',
  items             jsonb DEFAULT '[]',
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id text,
  name       text NOT NULL,
  price      numeric NOT NULL DEFAULT 0,
  quantity   int NOT NULL DEFAULT 1,
  image      text,
  variant    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Coupons  ← fixes "Failed to save coupon"
CREATE TABLE IF NOT EXISTS coupons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text UNIQUE NOT NULL,
  type       text NOT NULL DEFAULT 'percent',
  value      numeric NOT NULL DEFAULT 0,
  min_order  numeric NOT NULL DEFAULT 0,
  max_uses   int,
  uses       int NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Back-in-Stock Alerts
CREATE TABLE IF NOT EXISTS back_in_stock_alerts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text,
  email      text NOT NULL,
  notified   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-Discounts
CREATE TABLE IF NOT EXISTS auto_discounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL DEFAULT 'percent',
  value      numeric NOT NULL DEFAULT 0,
  min_order  numeric NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Draft Orders
CREATE TABLE IF NOT EXISTS draft_orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status         text NOT NULL DEFAULT 'draft',
  customer_name  text,
  customer_email text,
  customer_phone text,
  items          jsonb DEFAULT '[]',
  subtotal       numeric DEFAULT 0,
  shipping_cost  numeric DEFAULT 0,
  discount       numeric DEFAULT 0,
  total          numeric DEFAULT 0,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Returns
CREATE TABLE IF NOT EXISTS returns (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       text,
  order_number   text,
  customer_name  text,
  customer_email text,
  reason         text,
  status         text NOT NULL DEFAULT 'pending',
  items          jsonb DEFAULT '[]',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Gift Cards
CREATE TABLE IF NOT EXISTS gift_cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE NOT NULL,
  initial_value   numeric NOT NULL DEFAULT 0,
  balance         numeric NOT NULL DEFAULT 0,
  recipient_name  text,
  recipient_email text,
  message         text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Bundles
CREATE TABLE IF NOT EXISTS bundles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  product_ids  jsonb DEFAULT '[]',
  bundle_price numeric DEFAULT 0,
  image        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE,
  description text,
  image       text,
  product_ids jsonb DEFAULT '[]',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  name       text,
  role       text NOT NULL DEFAULT 'staff',
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Abandoned Carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  items         jsonb DEFAULT '[]',
  subtotal      numeric DEFAULT 0,
  status        text NOT NULL DEFAULT 'abandoned',
  reminder_sent int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Site Settings (if not already created)
CREATE TABLE IF NOT EXISTS site_settings (
  id         text PRIMARY KEY,
  value      jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Page Views  ← powers the Analytics dashboard
CREATE TABLE IF NOT EXISTS page_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path       text NOT NULL,
  referrer   text,
  device     text NOT NULL DEFAULT 'desktop',
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Enable RLS on every table ─────────────────────────────────────────────────
DO $$ BEGIN
  EXECUTE 'ALTER TABLE products             ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE categories           ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE banners              ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE posts                ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE subscribers          ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE orders               ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE coupons              ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE back_in_stock_alerts ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE auto_discounts       ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE draft_orders         ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE returns              ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE gift_cards           ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE bundles              ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE collections          ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE admin_users          ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE abandoned_carts      ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE site_settings        ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE page_views           ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── RLS Policies — allow anon full access ─────────────────────────────────────
-- (Admin security is enforced by the custom admin token on each API route,
--  not by Supabase RLS. These permissive policies keep the storefront + admin working.)

-- Helper: drop if exists before creating (prevents "already exists" errors)
DO $$ BEGIN
  DROP POLICY IF EXISTS "anon_all_products"            ON products;
  DROP POLICY IF EXISTS "anon_all_categories"          ON categories;
  DROP POLICY IF EXISTS "anon_all_banners"             ON banners;
  DROP POLICY IF EXISTS "anon_all_posts"               ON posts;
  DROP POLICY IF EXISTS "anon_all_subscribers"         ON subscribers;
  DROP POLICY IF EXISTS "anon_all_orders"              ON orders;
  DROP POLICY IF EXISTS "anon_all_order_items"         ON order_items;
  DROP POLICY IF EXISTS "anon_all_coupons"             ON coupons;
  DROP POLICY IF EXISTS "anon_all_back_in_stock"       ON back_in_stock_alerts;
  DROP POLICY IF EXISTS "anon_all_auto_discounts"      ON auto_discounts;
  DROP POLICY IF EXISTS "anon_all_draft_orders"        ON draft_orders;
  DROP POLICY IF EXISTS "anon_all_returns"             ON returns;
  DROP POLICY IF EXISTS "anon_all_gift_cards"          ON gift_cards;
  DROP POLICY IF EXISTS "anon_all_bundles"             ON bundles;
  DROP POLICY IF EXISTS "anon_all_collections"         ON collections;
  DROP POLICY IF EXISTS "anon_all_admin_users"         ON admin_users;
  DROP POLICY IF EXISTS "anon_all_abandoned_carts"     ON abandoned_carts;
  DROP POLICY IF EXISTS "anon_all_site_settings"       ON site_settings;
  DROP POLICY IF EXISTS "anon_all_page_views"          ON page_views;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "anon_all_products"            ON products            FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_categories"          ON categories          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_banners"             ON banners             FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_posts"               ON posts               FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_subscribers"         ON subscribers         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_orders"              ON orders              FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_order_items"         ON order_items         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_coupons"             ON coupons             FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_back_in_stock"       ON back_in_stock_alerts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_auto_discounts"      ON auto_discounts       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_draft_orders"        ON draft_orders         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_returns"             ON returns              FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_gift_cards"          ON gift_cards           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_bundles"             ON bundles              FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_collections"         ON collections          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_admin_users"         ON admin_users          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_abandoned_carts"     ON abandoned_carts      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_site_settings"       ON site_settings        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_page_views"          ON page_views           FOR ALL TO anon USING (true) WITH CHECK (true);
