# Ascent E-Commerce Template

A production-ready, white-label e-commerce template built with **Next.js 14 App Router**, **Supabase**, and **Paystack**. Fully functional in demo mode with localStorage — no backend required to get started.

---

## Features

- **Shop** — Product listing with filters, sorting, search, and quick view
- **Product detail** — Image gallery, variants, reviews, back-in-stock alerts, social sharing
- **Cart & Checkout** — Full cart with Paystack payment integration and coupon codes
- **Blog** — Archive and single post with SEO metadata and social sharing
- **Account** — Dashboard, orders, profile, wishlist
- **Admin panel** — Products, categories, orders, coupons, banners, blog posts, subscribers, back-in-stock alerts
- **SEO** — Dynamic metadata, Open Graph, sitemap, robots.txt
- **Newsletter** — Popup, footer form, and blog sidebar — all wired to subscribers table
- **Static pages** — About, Contact, FAQ, Privacy, Terms, Shipping, Returns, Support, Team, Careers, Affiliate, Partnership

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`. The app runs in **demo mode** (localStorage) if Supabase credentials are left as placeholders — no database needed to preview.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Configuration

All client-specific settings live in **`config/client.js`**:

| Field | Description |
|-------|-------------|
| `name` | Store name |
| `tagline` | One-line store description |
| `industry` | Product catalogue type (`electronics`, `fashion`, `grocery`, `beauty`, `furniture`, `general`) |
| `colors` | Brand color palette (primary, secondary, accent) |
| `currency` / `currencySymbol` | e.g. `NGN` / `₦` |
| `phone`, `email`, `address`, `whatsapp` | Contact details used in footer and contact page |
| `shipping.flatRate` | Flat shipping cost in paise/kobo/lowest unit |
| `shipping.freeAbove` | Order total above which shipping is free (0 = always paid) |
| `socials` | Instagram, Facebook, Twitter, YouTube links |
| `seo.title` | Default page `<title>` |
| `seo.description` | Default meta description |
| `features` | Toggle blog, compare, reviews, WhatsApp button, etc. |

---

## Demo Mode vs. Live Mode

| | Demo Mode | Live Mode |
|--|-----------|-----------|
| Data source | `localStorage` | Supabase |
| Products | 5 sample products seeded automatically | Your `products` table |
| Orders | Stored in `localStorage` | `orders` table |
| Trigger | Supabase URL/key are placeholders | Valid Supabase credentials in `.env.local` |

Switch from demo to live by updating `.env.local` with real Supabase credentials. No code changes needed.

---

## Supabase Setup

Create the following tables in your Supabase project:

- `products` — `id, name, slug, description, price, compare_price, images[], category_id, brand, sku, stock, is_active, is_featured, rating, review_count`
- `categories` — `id, name, slug, description, image`
- `orders` — `id, order_number, customer_name, customer_email, customer_phone, items[], subtotal, shipping, discount, total, status, address, city, state, coupon_code`
- `posts` — `id, title, slug, excerpt, content, cover_image, author, category, tags[], read_time, is_published`
- `coupons` — `id, code, type (percent|fixed|shipping), value, min_order, max_uses, uses, is_active, expires_at`
- `subscribers` — `id, email, source, subscribed_at`
- `banners` — `id, title, subtitle, image, link, is_active, position, sort_order`
- `back_in_stock_alerts` — `id, product_id, product_name, email, created_at`

Enable Row Level Security (RLS) and set policies as needed for your use case.

---

## Paystack

Set `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env.local`. The checkout page uses Paystack Popup (loaded via CDN). Test payments use test keys from your Paystack dashboard.

---

## Deployment

Deploy to Vercel in one click:

```bash
npx vercel
```

Set all `.env.local` variables as Vercel environment variables. Set `NEXT_PUBLIC_SITE_URL` to your production domain for correct sitemap and OG image URLs.

---

## Project Structure

```
app/                    # Next.js App Router pages
├── (shop)/             # Home, shop, product detail
├── account/            # Customer account pages
├── admin/              # Admin panel
├── blog/               # Blog archive + posts
├── pages/[slug]/       # Static info pages (about, terms, faq, etc.)
components/
├── layout/             # Header, Footer
├── product/            # Product cards, gallery, reviews, carousel
├── home/               # Hero, flash deals, banners, featured
├── admin/              # Admin sidebar, product form
├── ui/                 # Shared UI (share buttons, newsletter form, popup)
├── pages/              # Reusable page content components
config/
└── client.js           # All client configuration — edit this per deployment
lib/
├── admin-db.js         # Data layer: Supabase + localStorage fallback
├── supabase.ts         # Browser Supabase client
└── supabase-server.ts  # Server Supabase client
```
