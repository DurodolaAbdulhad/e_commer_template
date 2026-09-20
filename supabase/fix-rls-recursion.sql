-- ============================================================
-- FIX: Infinite recursion in profiles RLS policy
-- Run in BOTH Mynnat and Tracy Boutique Supabase projects
-- ============================================================

-- 1. Drop the recursive policy (it checks `profiles` from within `profiles`)
drop policy if exists "Admins can view all profiles" on profiles;

-- 2. Create a security definer function — runs with elevated privileges,
--    bypasses RLS so it can safely read profiles without triggering itself
create or replace function is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and is_admin = true
  );
end;
$$;

-- 3. Re-create all admin policies using the function instead of inline subqueries
drop policy if exists "Admins can manage categories"      on categories;
drop policy if exists "Admins can manage products"        on products;
drop policy if exists "Admins can manage variants"        on product_variants;
drop policy if exists "Admins can manage all orders"      on orders;
drop policy if exists "Admins can manage banners"         on banners;
drop policy if exists "Admins can view subscribers"       on subscribers;
drop policy if exists "Admins can manage coupons"         on coupons;
drop policy if exists "Admins can upload product images"  on storage.objects;
drop policy if exists "Admins can upload banners"         on storage.objects;

create policy "Admins can manage categories"   on categories      for all using (is_admin());
create policy "Admins can manage products"     on products        for all using (is_admin());
create policy "Admins can manage variants"     on product_variants for all using (is_admin());
create policy "Admins can manage all orders"   on orders          for all using (is_admin());
create policy "Admins can manage banners"      on banners         for all using (is_admin());
create policy "Admins can view subscribers"    on subscribers     for select using (is_admin());
create policy "Admins can manage coupons"      on coupons         for all using (is_admin());

create policy "Admins can upload product images" on storage.objects
  for insert with check (bucket_id = 'products' and is_admin());
create policy "Admins can upload banners" on storage.objects
  for insert with check (bucket_id = 'banners' and is_admin());

-- 4. Verify — should return a list of policies without errors
select tablename, policyname from pg_policies
where schemaname = 'public'
order by tablename, policyname;
