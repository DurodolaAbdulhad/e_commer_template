-- ============================================================
-- MIGRATION: site_settings table for homepage config
-- Run in BOTH Mynnat and Tracy Boutique Supabase projects
-- ============================================================

create table if not exists site_settings (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table site_settings enable row level security;
create policy "Public read settings"  on site_settings for select using (true);
create policy "Admin write settings"  on site_settings for insert with check (true);
create policy "Admin update settings" on site_settings for update using (true);

-- Default homepage section order
insert into site_settings (id, value) values (
  'homepage_sections',
  '[
    {"id":"hero",        "label":"Hero Banner",        "visible":true},
    {"id":"trust",       "label":"Trust Badges",       "visible":true},
    {"id":"categories",  "label":"Category Grid",      "visible":true},
    {"id":"flash",       "label":"Flash Deals",        "visible":true},
    {"id":"featured",    "label":"Featured Products",  "visible":true},
    {"id":"promo",       "label":"Promo Banner",       "visible":true},
    {"id":"new_arrivals","label":"New Arrivals",       "visible":true},
    {"id":"newsletter",  "label":"Newsletter",         "visible":true}
  ]'::jsonb
) on conflict (id) do nothing;
