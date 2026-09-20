-- ============================================================
-- MIGRATION: categories storage bucket + site_settings table
-- Run in BOTH Mynnat and Tracy Boutique Supabase projects
-- ============================================================

-- 1. Categories image storage bucket
insert into storage.buckets (id, name, public)
values ('categories', 'categories', true)
on conflict (id) do nothing;

-- Storage policies (drop first — CREATE POLICY IF NOT EXISTS is not supported)
drop policy if exists "Public can view category images"  on storage.objects;
drop policy if exists "Admin can upload category images" on storage.objects;
drop policy if exists "Admin can update category images" on storage.objects;
drop policy if exists "Admin can delete category images" on storage.objects;

create policy "Public can view category images"
  on storage.objects for select using (bucket_id = 'categories');

create policy "Admin can upload category images"
  on storage.objects for insert with check (bucket_id = 'categories');

create policy "Admin can update category images"
  on storage.objects for update using (bucket_id = 'categories');

create policy "Admin can delete category images"
  on storage.objects for delete using (bucket_id = 'categories');

-- 2. site_settings table for homepage section order + store logo
create table if not exists site_settings (
  id         text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

alter table site_settings enable row level security;

drop policy if exists "Public read settings"  on site_settings;
drop policy if exists "Admin write settings"  on site_settings;
drop policy if exists "Admin update settings" on site_settings;

create policy "Public read settings"  on site_settings for select using (true);
create policy "Admin write settings"  on site_settings for insert with check (true);
create policy "Admin update settings" on site_settings for update using (true);

-- Default homepage section order
insert into site_settings (id, value) values (
  'homepage_sections',
  '[
    {"id":"hero",        "label":"Hero Banner",       "visible":true},
    {"id":"trust",       "label":"Trust Badges",      "visible":true},
    {"id":"categories",  "label":"Category Grid",     "visible":true},
    {"id":"flash",       "label":"Flash Deals",       "visible":true},
    {"id":"featured",    "label":"Featured Products", "visible":true},
    {"id":"promo",       "label":"Promo Banner",      "visible":true},
    {"id":"new_arrivals","label":"New Arrivals",      "visible":true},
    {"id":"newsletter",  "label":"Newsletter",        "visible":true}
  ]'::jsonb
) on conflict (id) do nothing;
