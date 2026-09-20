-- ============================================================
-- ASCENT E-COMMERCE TEMPLATE — Supabase Schema
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ============================================================


-- ── 1. PROFILES (extends Supabase auth.users) ─────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile when user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ── 2. CATEGORIES ─────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image text,
  parent_id uuid references categories(id) on delete set null,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_categories_slug on categories(slug);
create index if not exists idx_categories_active on categories(is_active);


-- ── 3. PRODUCTS ───────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  compare_price numeric(12,2) check (compare_price >= 0),   -- original/crossed-out price
  images text[] default '{}',                                -- array of Storage URLs
  category_id uuid references categories(id) on delete set null,
  brand text,
  sku text unique,
  stock integer default 0 check (stock >= 0),
  is_active boolean default true,
  is_featured boolean default false,
  tags text[] default '{}',
  meta_title text,
  meta_description text,
  weight_kg numeric(8,3),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_featured on products(is_featured) where is_featured = true;
create index if not exists idx_products_active on products(is_active) where is_active = true;
create index if not exists idx_products_created on products(created_at desc);
create index if not exists idx_products_price on products(price);


-- ── 4. PRODUCT VARIANTS ───────────────────────────────────────
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,       -- e.g. "Color", "Size", "Storage"
  options jsonb not null    -- e.g. [{"value":"Red","stock":5},{"value":"Blue","stock":3}]
);

create index if not exists idx_variants_product on product_variants(product_id);


-- ── 5. ADDRESSES (saved by users) ─────────────────────────────
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text default 'Home',              -- "Home", "Work", "Other"
  first_name text not null,
  last_name text not null,
  phone text,
  street text not null,
  city text not null,
  state text not null,
  zip text,
  country text default 'Nigeria',
  is_default boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_addresses_user on addresses(user_id);


-- ── 6. ORDERS ─────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,  -- null = guest checkout
  email text not null,
  phone text,
  status text not null default 'pending'
    check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  items jsonb not null,             -- snapshot: [{id, name, price, quantity, image, variant}]
  subtotal numeric(12,2) not null,
  shipping numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  total numeric(12,2) not null,
  shipping_address jsonb not null,  -- {first_name, last_name, street, city, state, phone}
  payment_status text default 'unpaid'
    check (payment_status in ('unpaid','paid','refunded')),
  payment_reference text,           -- Paystack transaction reference
  payment_channel text,             -- "card", "bank", "ussd", etc.
  notes text,                       -- customer order notes
  admin_notes text,                 -- internal notes (visible only in admin)
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_email on orders(email);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_number on orders(order_number);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_payment_ref on orders(payment_reference);


-- ── 7. REVIEWS ────────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_verified boolean default false,  -- true if user bought the product
  created_at timestamptz default now(),
  unique(product_id, user_id)         -- one review per product per user
);

create index if not exists idx_reviews_product on reviews(product_id);


-- ── 8. BANNERS (homepage hero/promo) ─────────────────────────
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  label text,               -- e.g. "Weekend Promotions"
  discount_text text,       -- e.g. "Up to 30% Off"
  cta_text text default 'Shop Now',
  cta_link text default '/shop',
  image text,               -- Storage URL
  bg_color text,            -- fallback if no image
  position text default 'hero'
    check (position in ('hero','promo_left','promo_right','sidebar')),
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);


-- ── 9. NEWSLETTER SUBSCRIBERS ─────────────────────────────────
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  is_active boolean default true,
  created_at timestamptz default now()
);


-- ── 10. COUPONS ───────────────────────────────────────────────
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percent','fixed')),
  value numeric(10,2) not null,          -- % or flat amount
  min_order numeric(10,2) default 0,     -- minimum cart value to apply
  max_uses integer,                      -- null = unlimited
  uses integer default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_coupons_code on coupons(code);


-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;
alter table banners enable row level security;
alter table subscribers enable row level security;
alter table coupons enable row level security;


-- Profiles
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles
  for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Categories — public read
create policy "Anyone can view active categories" on categories
  for select using (is_active = true);
create policy "Admins can manage categories" on categories
  for all using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Products — public read
create policy "Anyone can view active products" on products
  for select using (is_active = true);
create policy "Admins can manage products" on products
  for all using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Product variants — public read
create policy "Anyone can view variants" on product_variants
  for select using (true);
create policy "Admins can manage variants" on product_variants
  for all using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Addresses — own only
create policy "Users can manage own addresses" on addresses
  for all using (auth.uid() = user_id);

-- Orders — own only + admins
create policy "Users can view own orders" on orders
  for select using (auth.uid() = user_id or email = auth.jwt()->>'email');
create policy "Anyone can create order" on orders
  for insert with check (true);
create policy "Admins can manage all orders" on orders
  for all using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Reviews — public read, authenticated write
create policy "Anyone can read reviews" on reviews
  for select using (true);
create policy "Authenticated users can write reviews" on reviews
  for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on reviews
  for update using (auth.uid() = user_id);

-- Banners — public read
create policy "Anyone can view active banners" on banners
  for select using (is_active = true);
create policy "Admins can manage banners" on banners
  for all using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Subscribers — insert only (no read by public)
create policy "Anyone can subscribe" on subscribers
  for insert with check (true);
create policy "Admins can view subscribers" on subscribers
  for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Coupons — admins only
create policy "Admins can manage coupons" on coupons
  for all using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "Anyone can read active coupons" on coupons
  for select using (is_active = true);


-- ══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at before update on products
  for each row execute function update_updated_at();

create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();


-- ══════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ══════════════════════════════════════════════════════════════
-- Run these in Supabase → Storage → New Bucket
-- OR paste in SQL editor:

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public can view product images" on storage.objects
  for select using (bucket_id = 'products');
create policy "Admins can upload product images" on storage.objects
  for insert with check (
    bucket_id = 'products' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
create policy "Public can view banners" on storage.objects
  for select using (bucket_id = 'banners');
create policy "Admins can upload banners" on storage.objects
  for insert with check (
    bucket_id = 'banners' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
create policy "Users can manage own avatar" on storage.objects
  for all using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
