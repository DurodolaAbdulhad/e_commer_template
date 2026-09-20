-- ============================================================
-- Row Level Security (RLS) — run this in Supabase SQL Editor
-- IMPORTANT: enables RLS on all tables and locks down access
-- ============================================================

-- Enable RLS on every table
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts     ENABLE ROW LEVEL SECURITY;

-- ── PRODUCTS ── (public read, service-role write)
CREATE POLICY "products_public_read"
  ON products FOR SELECT USING (is_active = true);

CREATE POLICY "products_service_write"
  ON products FOR ALL USING (auth.role() = 'service_role');

-- ── CATEGORIES ── (public read, service-role write)
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT USING (true);

CREATE POLICY "categories_service_write"
  ON categories FOR ALL USING (auth.role() = 'service_role');

-- ── ORDERS ── (owner read, service-role full)
CREATE POLICY "orders_owner_read"
  ON orders FOR SELECT
  USING (auth.uid()::text = customer_id OR auth.role() = 'service_role');

CREATE POLICY "orders_authenticated_insert"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

CREATE POLICY "orders_service_update"
  ON orders FOR UPDATE USING (auth.role() = 'service_role');

-- ── COUPONS ── (no public read — validate via API only)
CREATE POLICY "coupons_service_only"
  ON coupons FOR ALL USING (auth.role() = 'service_role');

-- ── GIFT CARDS ── (no public read — validate via API only)
CREATE POLICY "gift_cards_service_only"
  ON gift_cards FOR ALL USING (auth.role() = 'service_role');

-- ── SUBSCRIBERS ── (insert only for anon, service-role full)
CREATE POLICY "subscribers_insert"
  ON subscribers FOR INSERT WITH CHECK (true);

CREATE POLICY "subscribers_service_read"
  ON subscribers FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "subscribers_service_delete"
  ON subscribers FOR DELETE USING (auth.role() = 'service_role');

-- ── RETURNS ── (owner read/insert, service-role full)
CREATE POLICY "returns_owner_read"
  ON returns FOR SELECT
  USING (customer_email = auth.jwt()->>'email' OR auth.role() = 'service_role');

CREATE POLICY "returns_authenticated_insert"
  ON returns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

CREATE POLICY "returns_service_update"
  ON returns FOR UPDATE USING (auth.role() = 'service_role');

-- ── BUNDLES / COLLECTIONS / BANNERS ── (public read, service-role write)
CREATE POLICY "bundles_public_read"   ON bundles     FOR SELECT USING (true);
CREATE POLICY "bundles_service_write" ON bundles     FOR ALL    USING (auth.role() = 'service_role');

CREATE POLICY "collections_public_read"   ON collections FOR SELECT USING (true);
CREATE POLICY "collections_service_write" ON collections FOR ALL    USING (auth.role() = 'service_role');

CREATE POLICY "banners_public_read"   ON banners     FOR SELECT USING (is_active = true);
CREATE POLICY "banners_service_write" ON banners     FOR ALL    USING (auth.role() = 'service_role');

-- ── BLOG POSTS ── (public read published, service-role write)
CREATE POLICY "blog_public_read"
  ON blog_posts FOR SELECT USING (status = 'published');

CREATE POLICY "blog_service_write"
  ON blog_posts FOR ALL USING (auth.role() = 'service_role');
