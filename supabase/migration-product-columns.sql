-- ============================================================
-- MIGRATION: Add missing product columns
-- Run this in BOTH Tracy Boutique and Mynnat Supabase projects
-- Supabase → SQL Editor → Run
-- ============================================================

alter table products add column if not exists product_type text default 'physical'
  check (product_type in ('physical', 'digital'));

alter table products add column if not exists file_url text;

alter table products add column if not exists is_flash_deal boolean default false;

alter table products add column if not exists flash_deal_end timestamptz;

-- Verify
select column_name, data_type from information_schema.columns
where table_name = 'products'
order by ordinal_position;
