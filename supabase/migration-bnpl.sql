-- Migration: BNPL / Klump installment plan columns
-- Run after migration-shipping.sql if you need to track per-order Klump plan state.

alter table orders
  add column if not exists bnpl_plan_id text,    -- Klump plan/payment ID from webhook
  add column if not exists bnpl_status  text      -- active | completed | declined | closed
    check (bnpl_status in ('active','completed','declined','closed'));
