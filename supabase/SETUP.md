# Supabase Setup Guide

Do this once per client deployment. Takes about 10 minutes.

---

## Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it (e.g. `lagos-fresh-foods`)
3. Set a strong database password — save it
4. Choose region: **West US** (closest to Nigeria)
5. Wait ~2 minutes for project to spin up

---

## Step 2 — Run the Schema

1. Go to **SQL Editor** in your Supabase project
2. Click **New Query**
3. Open `supabase/schema.sql` from this project
4. Paste the entire contents → **Run**
5. You should see: `Success. No rows returned`

---

## Step 3 — Add Sample Products (Optional)

1. In **SQL Editor** → New Query
2. Open `supabase/seed.sql`
3. Paste entire contents → **Run**
4. You should see a result row: `categories: 8, products: 20, banners: 2`

---

## Step 4 — Get Your API Keys

1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 5 — Update .env.local

Open `.env.local` and fill in the values from Step 4.

---

## Step 6 — Create First Admin User

1. Go to **Authentication → Users → Invite User**
2. Enter the client's admin email
3. They receive a login link
4. After they log in, go to **Table Editor → profiles**
5. Find their row → set `is_admin = true`

That's it — they can now log in at `/admin`

---

## Step 7 — Add Product Images

1. Go to **Storage → products bucket**
2. Upload product images (JPG/PNG, max 2MB each)
3. Copy the public URL of each image
4. In **Table Editor → products**, paste image URLs into the `images` column (array format)

---

## Database Tables Summary

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extends Supabase auth) |
| `categories` | Product categories and subcategories |
| `products` | All products |
| `product_variants` | Size/color/storage variants per product |
| `addresses` | Saved delivery addresses per user |
| `orders` | All orders with full item snapshots |
| `reviews` | Product reviews and ratings |
| `banners` | Homepage hero and promo banners |
| `subscribers` | Newsletter email list |
| `coupons` | Discount codes |

---

## Managing the Store (For Clients)

Once deployed, clients go to `/admin` to:
- Add and edit products
- Upload product images
- Update order statuses
- Manage categories and banners
- View subscriber list
