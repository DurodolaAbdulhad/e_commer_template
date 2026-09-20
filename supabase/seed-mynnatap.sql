-- ============================================================
-- MYNNAT APPARELS — Custom Seed Data
-- Run AFTER schema.sql in the Mynnat Supabase project
-- ============================================================

-- ── CATEGORIES ────────────────────────────────────────────────
insert into categories (name, slug, description, sort_order, is_active) values
  ('Belts',                  'belts',       'Leather and fashion belts for men and women',         1, true),
  ('Perfumes & Fragrances',  'perfumes',    'Original and designer fragrances',                    2, true),
  ('Eyewear',                'eyewear',     'Sunglasses and fashion glasses',                      3, true),
  ('Skincare & Creams',      'skincare',    'Body creams, lotions, and skincare essentials',       4, true),
  ('Jewellery',              'jewellery',   'Necklaces, bracelets, earrings, and rings',           5, true),
  ('Underwear & Lingerie',   'underwear',   'Comfortable and stylish underwear for men and women', 6, true),
  ('Bags & Purses',          'bags',        'Handbags, shoulder bags, and purses',                 7, true),
  ('Sale',                   'sale',        'Discounted items and clearance deals',                8, true)
on conflict (slug) do nothing;


-- ── PRODUCTS ──────────────────────────────────────────────────
do $$
declare
  belts_id      uuid;
  perfumes_id   uuid;
  eyewear_id    uuid;
  skincare_id   uuid;
  jewellery_id  uuid;
  underwear_id  uuid;
  bags_id       uuid;
  sale_id       uuid;
begin
  select id into belts_id      from categories where slug = 'belts';
  select id into perfumes_id   from categories where slug = 'perfumes';
  select id into eyewear_id    from categories where slug = 'eyewear';
  select id into skincare_id   from categories where slug = 'skincare';
  select id into jewellery_id  from categories where slug = 'jewellery';
  select id into underwear_id  from categories where slug = 'underwear';
  select id into bags_id       from categories where slug = 'bags';
  select id into sale_id       from categories where slug = 'sale';

  -- ── BELTS ──────────────────────────────────────────────────
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Classic Leather Men''s Belt',
    'classic-leather-mens-belt',
    'Genuine leather belt with polished silver buckle. Smooth finish, durable stitching. Available in black and brown. Sizes: 28–46 inches.',
    7500, 12000, belts_id, 'Mynnat Apparels', 50, true, true,
    ARRAY['belt', 'leather', 'men', 'classic', 'accessories']
  ),
  (
    'Women''s Fashion Chain Belt',
    'womens-fashion-chain-belt',
    'Trendy gold-chain statement belt for women. Pairs perfectly with dresses, jeans, and blazers. One size fits most.',
    5500, 8000, belts_id, 'Mynnat Apparels', 35, true, true,
    ARRAY['belt', 'chain', 'women', 'fashion', 'accessories']
  ),
  (
    'Designer Reversible Belt — Black/Brown',
    'designer-reversible-belt',
    'Premium reversible leather belt with designer pin buckle. Two belts in one — flip the strap for black or brown. Men''s sizes 30–44.',
    9500, 15000, belts_id, 'Mynnat Apparels', 30, true, false,
    ARRAY['belt', 'reversible', 'leather', 'men', 'designer']
  ),
  (
    'Woven Canvas Casual Belt',
    'woven-canvas-casual-belt',
    'Lightweight woven canvas belt for casual everyday wear. Adjustable slider buckle — no holes needed. Unisex. Available in khaki, navy, and black.',
    3500, null, belts_id, 'Mynnat Apparels', 60, true, false,
    ARRAY['belt', 'canvas', 'casual', 'unisex', 'accessories']
  )
  on conflict (slug) do nothing;

  -- ── PERFUMES ──────────────────────────────────────────────
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Arabian Oud Eau de Parfum — 100ml',
    'arabian-oud-edp-100ml',
    'Rich oriental oud fragrance with notes of rose, amber, and musk. Long-lasting 12-hour wear. 100ml spray bottle. Unisex.',
    18500, 25000, perfumes_id, 'Mynnat Apparels', 25, true, true,
    ARRAY['perfume', 'oud', 'arabian', 'fragrance', 'unisex']
  ),
  (
    'Fresh Citrus Men''s Cologne — 75ml',
    'fresh-citrus-mens-cologne-75ml',
    'Light, refreshing cologne with top notes of bergamot and lemon, dry-down of cedar and vetiver. Ideal for daytime and office wear.',
    12000, 16000, perfumes_id, 'Mynnat Apparels', 30, true, true,
    ARRAY['cologne', 'citrus', 'men', 'fresh', 'fragrance']
  ),
  (
    'Floral Rose Women''s Perfume — 50ml',
    'floral-rose-womens-perfume-50ml',
    'Romantic floral perfume with rose, jasmine, and soft vanilla base. Feminine and long-lasting. 50ml EDP.',
    11000, 15000, perfumes_id, 'Mynnat Apparels', 28, true, false,
    ARRAY['perfume', 'floral', 'rose', 'women', 'fragrance']
  ),
  (
    'Luxury Gift Set — 3 Mini Perfumes',
    'luxury-gift-set-3-mini-perfumes',
    'Set of 3 x 30ml mini perfumes: Oud, Citrus, and Floral Rose. Perfect gift for any occasion. Presented in a premium gift box.',
    22000, 32000, perfumes_id, 'Mynnat Apparels', 20, true, true,
    ARRAY['perfume', 'gift set', 'mini', 'fragrance', 'luxury']
  )
  on conflict (slug) do nothing;

  -- ── EYEWEAR ──────────────────────────────────────────────
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Aviator Sunglasses — Gold Frame',
    'aviator-sunglasses-gold-frame',
    'Classic aviator sunglasses with UV400 protection lenses. Lightweight gold metal frame. Unisex. Comes with protective case.',
    8500, 13000, eyewear_id, 'Mynnat Apparels', 40, true, true,
    ARRAY['sunglasses', 'aviator', 'gold', 'UV400', 'eyewear']
  ),
  (
    'Oversized Square Sunglasses — Black',
    'oversized-square-sunglasses-black',
    'Bold oversized square frame sunglasses. Polarised UV400 lenses for full eye protection. Women''s statement piece.',
    7000, 10500, eyewear_id, 'Mynnat Apparels', 35, true, true,
    ARRAY['sunglasses', 'oversized', 'square', 'polarised', 'women']
  ),
  (
    'Round Clear-Frame Fashion Glasses',
    'round-clear-frame-fashion-glasses',
    'Non-prescription fashion glasses with round clear acetate frames. Lightweight and stylish. Unisex.',
    5500, null, eyewear_id, 'Mynnat Apparels', 45, true, false,
    ARRAY['glasses', 'fashion', 'clear', 'round', 'eyewear']
  ),
  (
    'Men''s Wayfarer Sunglasses — Tortoise',
    'mens-wayfarer-sunglasses-tortoise',
    'Timeless wayfarer style with tortoise acetate frame and dark brown polarised lenses. UV400 protection. Includes microfibre pouch.',
    9000, 13500, eyewear_id, 'Mynnat Apparels', 30, true, false,
    ARRAY['sunglasses', 'wayfarer', 'men', 'polarised', 'eyewear']
  )
  on conflict (slug) do nothing;

  -- ── SKINCARE & CREAMS ─────────────────────────────────────
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Glow & Even Body Lotion — 500ml',
    'glow-even-body-lotion-500ml',
    'Brightening body lotion with niacinamide, shea butter, and SPF 15. Evens skin tone, moisturises, and protects. Suitable for all skin types.',
    8500, 12000, skincare_id, 'Mynnat Apparels', 50, true, true,
    ARRAY['lotion', 'brightening', 'skincare', 'body', 'SPF']
  ),
  (
    'Shea & Cocoa Body Butter — 250g',
    'shea-cocoa-body-butter-250g',
    'Rich whipped body butter with raw shea and cocoa butter. Deeply moisturises dry and rough skin. Fragrance-free option available. 250g jar.',
    6500, null, skincare_id, 'Mynnat Apparels', 60, true, true,
    ARRAY['body butter', 'shea', 'cocoa', 'moisturiser', 'skincare']
  ),
  (
    'Vitamin C Face Serum — 30ml',
    'vitamin-c-face-serum-30ml',
    '15% Vitamin C brightening serum with hyaluronic acid and ferulic acid. Fades dark spots, boosts radiance. Apply morning and night.',
    11000, 16000, skincare_id, 'Mynnat Apparels', 35, true, true,
    ARRAY['serum', 'vitamin C', 'face', 'brightening', 'skincare']
  ),
  (
    'Anti-Fade Sunscreen SPF 50 — 60ml',
    'anti-fade-sunscreen-spf50-60ml',
    'Lightweight SPF 50 sunscreen with no white cast. Protects against UVA/UVB and prevents hyperpigmentation. Gel texture, absorbs instantly.',
    7500, 10000, skincare_id, 'Mynnat Apparels', 45, true, false,
    ARRAY['sunscreen', 'SPF50', 'face', 'protection', 'skincare']
  )
  on conflict (slug) do nothing;

  -- ── JEWELLERY ─────────────────────────────────────────────
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Gold-Plated Statement Necklace',
    'gold-plated-statement-necklace',
    '18k gold-plated layered chain necklace with pendant. Tarnish-resistant coating. Length: 45cm + 5cm extension. Gift box included.',
    9500, 14000, jewellery_id, 'Mynnat Apparels', 40, true, true,
    ARRAY['necklace', 'gold', 'statement', 'jewellery', 'women']
  ),
  (
    'Sterling Silver Hoop Earrings — 3cm',
    'sterling-silver-hoop-earrings-3cm',
    'Classic 3cm sterling silver hoop earrings. Lightweight and hypoallergenic. Perfect for everyday wear. Pair sold together.',
    6000, 9000, jewellery_id, 'Mynnat Apparels', 50, true, true,
    ARRAY['earrings', 'hoops', 'silver', 'jewellery', 'women']
  ),
  (
    'Men''s Stainless Steel Bracelet',
    'mens-stainless-steel-bracelet',
    'Sleek stainless steel chain bracelet for men. Rust-resistant, waterproof. Available in silver and gold tone. Adjustable 18–22cm.',
    7000, null, jewellery_id, 'Mynnat Apparels', 35, true, false,
    ARRAY['bracelet', 'men', 'stainless steel', 'jewellery', 'accessories']
  ),
  (
    'Crystal Stud Earring Set — 6 Pairs',
    'crystal-stud-earring-set-6pairs',
    'Set of 6 pairs of crystal stud earrings in assorted colours. Hypoallergenic posts. Great everyday rotation or as a gift.',
    5500, 8000, jewellery_id, 'Mynnat Apparels', 55, true, true,
    ARRAY['earrings', 'studs', 'crystal', 'set', 'jewellery']
  ),
  (
    'Adjustable Gold Ring Set — 5 Pieces',
    'adjustable-gold-ring-set-5pieces',
    'Set of 5 dainty adjustable rings: plain band, twist, star, heart, and moon. Gold-plated. One size fits all.',
    6500, 9500, jewellery_id, 'Mynnat Apparels', 45, true, false,
    ARRAY['rings', 'gold', 'set', 'adjustable', 'jewellery']
  )
  on conflict (slug) do nothing;

  -- ── UNDERWEAR & LINGERIE ───────────────────────────────────
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Men''s Cotton Boxers — Pack of 3',
    'mens-cotton-boxers-pack-3',
    'Comfortable breathable cotton boxer shorts for men. Elasticated waistband. Pack of 3 in assorted colours. Sizes: S, M, L, XL, XXL.',
    5500, 7500, underwear_id, 'Mynnat Apparels', 80, true, true,
    ARRAY['boxers', 'men', 'underwear', 'cotton', 'pack']
  ),
  (
    'Women''s Seamless Briefs — Pack of 5',
    'womens-seamless-briefs-pack-5',
    'Soft seamless microfibre briefs. No visible panty lines. Moisture-wicking fabric. Pack of 5 in neutral and pastel tones. Sizes: S–XL.',
    6000, 9000, underwear_id, 'Mynnat Apparels', 70, true, true,
    ARRAY['briefs', 'women', 'underwear', 'seamless', 'pack']
  ),
  (
    'Push-Up Bra — Black Lace',
    'push-up-bra-black-lace',
    'Padded push-up bra with delicate lace overlay. Underwired for shape and support. Available in black and nude. Sizes: 32A–38D.',
    8500, 12000, underwear_id, 'Mynnat Apparels', 45, true, true,
    ARRAY['bra', 'push-up', 'lace', 'women', 'lingerie']
  ),
  (
    'Men''s Fitted Vest Undershirts — Pack of 3',
    'mens-fitted-vest-undershirts-pack-3',
    'Slim-fit crew-neck undershirts in premium cotton-stretch blend. Stays tucked all day. Pack of 3 in white, grey, and black.',
    4500, 6500, underwear_id, 'Mynnat Apparels', 65, true, false,
    ARRAY['vest', 'undershirt', 'men', 'underwear', 'pack']
  ),
  (
    'Lace Lingerie Set — Bra & Panty',
    'lace-lingerie-set-bra-panty',
    'Matching lace bra and panty set. Soft stretch lace, scalloped edge, adjustable straps. Available in black, red, and blush. Sizes: S–XL.',
    9500, 14000, underwear_id, 'Mynnat Apparels', 40, true, false,
    ARRAY['lingerie', 'set', 'lace', 'women', 'bra']
  )
  on conflict (slug) do nothing;

  -- ── BAGS & PURSES ─────────────────────────────────────────
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Mini Crossbody Bag — Tan',
    'mini-crossbody-bag-tan',
    'Compact PU leather crossbody bag with adjustable strap and zip closure. Fits phone, cards, and essentials. Perfect for daily outings.',
    12500, 18000, bags_id, 'Mynnat Apparels', 30, true, true,
    ARRAY['bag', 'crossbody', 'mini', 'women', 'handbag']
  ),
  (
    'Large Tote Bag — Black',
    'large-tote-bag-black',
    'Spacious vegan leather tote bag with inner zip pocket and magnetic snap closure. Fits a laptop (up to 13"). Office or market-ready.',
    16000, 22000, bags_id, 'Mynnat Apparels', 25, true, true,
    ARRAY['bag', 'tote', 'large', 'women', 'office']
  ),
  (
    'Men''s Waist Pouch — Black',
    'mens-waist-pouch-black',
    'Durable canvas waist/bum bag with multiple compartments. Adjustable strap wears around waist or across chest. Unisex.',
    5500, 8000, bags_id, 'Mynnat Apparels', 40, true, false,
    ARRAY['bag', 'waist', 'pouch', 'men', 'bum bag']
  )
  on conflict (slug) do nothing;

  -- ── SALE ──────────────────────────────────────────────────
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Assorted Accessories Bundle — 5 Items',
    'assorted-accessories-bundle-5items',
    'Clearance bundle: 1 belt + 1 pair earrings + 1 pair sunglasses + 1 bracelet + 1 mini perfume. Items may vary. Great value, limited stock.',
    15000, 38000, sale_id, 'Mynnat Apparels', 10, true, true,
    ARRAY['bundle', 'sale', 'accessories', 'clearance', 'value']
  ),
  (
    'End-of-Season Perfume — 30ml Assorted',
    'end-of-season-perfume-30ml',
    'End-of-season stock: 30ml perfume bottle, fragrance assigned randomly from our range. All original, no counterfeits. Final sale.',
    4000, 11000, sale_id, 'Mynnat Apparels', 20, true, false,
    ARRAY['perfume', 'sale', 'clearance', 'fragrance', 'budget']
  )
  on conflict (slug) do nothing;

end $$;


-- ── BANNERS ───────────────────────────────────────────────────
delete from banners where title in ('Look Good, Feel Good', 'Scent the Moment');
insert into banners (title, subtitle, label, discount_text, cta_text, cta_link, bg_color, position, sort_order, is_active) values
(
  'Look Good, Feel Good',
  'Belts, perfumes, jewellery, skincare, eyewear and more — all in one place.',
  'Ogba''s Favourite Fashion Store',
  'Free delivery on orders above ₦50,000',
  'Shop Now',
  '/shop',
  '#f8f8f8',
  'hero',
  1,
  true
),
(
  'Scent the Moment',
  'Original perfumes and fragrances at prices that make sense in Lagos.',
  'New Arrivals',
  'From ₦11,000',
  'Shop Perfumes',
  '/category/perfumes',
  '#f0f7f0',
  'hero',
  2,
  true
);


-- ── VERIFY ────────────────────────────────────────────────────
select
  (select count(*) from categories) as categories,
  (select count(*) from products)   as products,
  (select count(*) from banners)    as banners;
