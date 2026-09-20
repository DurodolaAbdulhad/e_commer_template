-- ============================================================
-- FIX: Allow admin write operations via anon key
-- Run in BOTH Mynnat and Tracy Boutique Supabase projects.
-- ============================================================

-- ── CATEGORIES ────────────────────────────────────────────────
drop policy if exists "Admins can manage categories" on categories;
drop policy if exists "Admin write categories"       on categories;
drop policy if exists "Admin update categories"      on categories;
drop policy if exists "Admin delete categories"      on categories;
create policy "Admin write categories"  on categories for insert with check (true);
create policy "Admin update categories" on categories for update using (true);
create policy "Admin delete categories" on categories for delete using (true);

-- ── PRODUCTS ─────────────────────────────────────────────────
drop policy if exists "Admins can manage products" on products;
drop policy if exists "Admin write products"       on products;
drop policy if exists "Admin update products"      on products;
drop policy if exists "Admin delete products"      on products;
create policy "Admin write products"  on products for insert with check (true);
create policy "Admin update products" on products for update using (true);
create policy "Admin delete products" on products for delete using (true);

-- ── PRODUCT VARIANTS ──────────────────────────────────────────
drop policy if exists "Admins can manage variants" on product_variants;
drop policy if exists "Admin write variants"       on product_variants;
drop policy if exists "Admin update variants"      on product_variants;
drop policy if exists "Admin delete variants"      on product_variants;
create policy "Admin write variants"  on product_variants for insert with check (true);
create policy "Admin update variants" on product_variants for update using (true);
create policy "Admin delete variants" on product_variants for delete using (true);

-- ── BANNERS ──────────────────────────────────────────────────
drop policy if exists "Admins can manage banners" on banners;
drop policy if exists "Admin write banners"       on banners;
drop policy if exists "Admin update banners"      on banners;
drop policy if exists "Admin delete banners"      on banners;
create policy "Admin write banners"  on banners for insert with check (true);
create policy "Admin update banners" on banners for update using (true);
create policy "Admin delete banners" on banners for delete using (true);

-- ── STORAGE ──────────────────────────────────────────────────
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can upload banners"        on storage.objects;
drop policy if exists "Admin upload product images"      on storage.objects;
drop policy if exists "Admin update storage objects"     on storage.objects;
drop policy if exists "Admin delete storage objects"     on storage.objects;
create policy "Admin upload product images"  on storage.objects for insert with check (bucket_id in ('products','banners','avatars'));
create policy "Admin update storage objects" on storage.objects for update using  (bucket_id in ('products','banners','avatars'));
create policy "Admin delete storage objects" on storage.objects for delete using  (bucket_id in ('products','banners','avatars'));

-- ── VERIFY ───────────────────────────────────────────────────
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
