-- Migration: shipping, tracking, and payment columns for orders table
-- Run this in the Supabase SQL editor if you started from schema.sql before these columns existed.

alter table orders
  add column if not exists address           jsonb,          -- customer address flat object from checkout form
  add column if not exists payment_method    text,           -- paystack | pay_on_delivery | bank_transfer | whatsapp | bnpl
  add column if not exists receipt_url       text,           -- bank transfer receipt storage URL
  add column if not exists tracking_notes    text,           -- admin-internal notes on shipment progress
  add column if not exists waybill_number    text,           -- 3PL waybill / AWB number
  add column if not exists tracking_url      text,           -- courier tracking deep-link
  add column if not exists shipping_provider text,           -- sendbox | gig | kwik
  add column if not exists shipping_cost     numeric(12,2) default 0,
  add column if not exists vat               numeric(12,2) default 0;

-- Indexes for waybill lookup
create index if not exists idx_orders_waybill on orders(waybill_number) where waybill_number is not null;
