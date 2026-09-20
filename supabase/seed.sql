-- ============================================================
-- SEED DATA — Run AFTER schema.sql
-- Paste into: Supabase → SQL Editor → Run
-- ============================================================
-- NOTE: Replace image URLs with your own Supabase Storage URLs
--       after uploading product images.
-- ============================================================


-- ── CATEGORIES ────────────────────────────────────────────────
insert into categories (name, slug, description, sort_order, is_active) values
  ('Electronics',       'electronics',     'Phones, laptops, and gadgets',         1, true),
  ('Fashion',           'fashion',         'Clothing, shoes, and accessories',      2, true),
  ('Home & Garden',     'home-garden',     'Furniture, decor, and garden supplies', 3, true),
  ('Sports & Fitness',  'sports-fitness',  'Equipment, clothing, and supplements',  4, true),
  ('Books & Education', 'books-education', 'Books, courses, and stationery',        5, true),
  ('Toys & Games',      'toys-games',      'Toys for kids of all ages',             6, true),
  ('Beauty & Care',     'beauty-care',     'Skincare, makeup, and grooming',        7, true),
  ('Food & Grocery',    'food-grocery',    'Fresh food and everyday essentials',    8, true)
on conflict (slug) do nothing;


-- ── PRODUCTS ──────────────────────────────────────────────────
-- We'll use the category IDs dynamically
do $$
declare
  electronics_id uuid;
  fashion_id uuid;
  home_id uuid;
  sports_id uuid;
  beauty_id uuid;
  food_id uuid;
begin
  select id into electronics_id from categories where slug = 'electronics';
  select id into fashion_id     from categories where slug = 'fashion';
  select id into home_id        from categories where slug = 'home-garden';
  select id into sports_id      from categories where slug = 'sports-fitness';
  select id into beauty_id      from categories where slug = 'beauty-care';
  select id into food_id        from categories where slug = 'food-grocery';

  -- Electronics
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Wireless Bluetooth Headphones Pro',
    'wireless-bluetooth-headphones-pro',
    'Premium noise-cancelling wireless headphones with 40-hour battery life, deep bass, and crystal-clear sound. Compatible with all Bluetooth devices.',
    45000, 65000, electronics_id, 'SoundMax', 50, true, true,
    ARRAY['headphones', 'wireless', 'bluetooth', 'electronics']
  ),
  (
    'USB-C Fast Charging Cable 2m',
    'usb-c-fast-charging-cable-2m',
    'Durable braided USB-C cable supporting 65W fast charging. Compatible with Android phones, tablets, and laptops.',
    3500, 5000, electronics_id, 'ChargePlus', 200, true, false,
    ARRAY['cable', 'usb-c', 'charging', 'accessories']
  ),
  (
    'Smart LED Desk Lamp',
    'smart-led-desk-lamp',
    'Touch-controlled LED desk lamp with 5 brightness levels, 3 color temperatures, and USB charging port. Energy efficient and eye-friendly.',
    18000, 25000, electronics_id, 'LumiTech', 35, true, true,
    ARRAY['lamp', 'led', 'desk', 'smart']
  ),
  (
    'Portable Power Bank 20000mAh',
    'portable-power-bank-20000mah',
    'High-capacity power bank with dual USB ports and USB-C input/output. Fast charge compatible. Charges a phone up to 5 times.',
    28000, 40000, electronics_id, 'PowerUp', 75, true, false,
    ARRAY['powerbank', 'charging', 'portable', 'travel']
  ),
  (
    'Wireless Earbuds TWS',
    'wireless-earbuds-tws',
    'True wireless stereo earbuds with active noise cancellation, 8-hour playtime + 24 hours with case, IPX5 waterproof.',
    35000, 50000, electronics_id, 'SoundMax', 60, true, true,
    ARRAY['earbuds', 'wireless', 'tws', 'music']
  );

  -- Fashion
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Classic Polo Shirt — Men',
    'classic-polo-shirt-men',
    'Premium cotton polo shirt in a classic fit. Perfect for casual and semi-formal occasions. Available in multiple colors.',
    12500, 18000, fashion_id, 'StyleKing', 100, true, true,
    ARRAY['polo', 'shirt', 'men', 'fashion', 'cotton']
  ),
  (
    'High-Waist Joggers — Women',
    'high-waist-joggers-women',
    'Comfortable high-waist joggers with elastic waistband and side pockets. Perfect for workouts, lounging, or errands.',
    15000, 22000, fashion_id, 'FitWear', 80, true, false,
    ARRAY['joggers', 'women', 'fitness', 'casual']
  ),
  (
    'Leather Sneakers — Unisex',
    'leather-sneakers-unisex',
    'Clean, minimal leather sneakers suitable for men and women. Cushioned insole for all-day comfort. Pairs with any outfit.',
    32000, 45000, fashion_id, 'StepUp', 45, true, true,
    ARRAY['sneakers', 'shoes', 'leather', 'unisex']
  ),
  (
    'Canvas Tote Bag',
    'canvas-tote-bag',
    'Large eco-friendly canvas tote bag with interior zip pocket. Great for shopping, the beach, or daily carry.',
    8500, 12000, fashion_id, 'EcoCarry', 150, true, false,
    ARRAY['bag', 'tote', 'canvas', 'eco']
  );

  -- Home & Garden
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Ceramic Coffee Mug Set (4pcs)',
    'ceramic-coffee-mug-set-4pcs',
    'Set of 4 premium ceramic coffee mugs, 350ml each. Microwave and dishwasher safe. Modern minimalist design.',
    16000, 22000, home_id, 'HomeStyle', 60, true, true,
    ARRAY['mug', 'coffee', 'ceramic', 'kitchen', 'set']
  ),
  (
    'Bedsheet Set — Queen Size',
    'bedsheet-set-queen-size',
    '100% cotton 300 thread count bedsheet set. Includes fitted sheet, flat sheet, and 2 pillowcases. Soft, breathable, and durable.',
    28000, 38000, home_id, 'SleepWell', 40, true, true,
    ARRAY['bedsheet', 'cotton', 'queen', 'bedroom', 'sleep']
  ),
  (
    'Non-Stick Frying Pan 28cm',
    'non-stick-frying-pan-28cm',
    'Heavy-duty non-stick frying pan with heat-resistant handle. PFOA-free coating. Suitable for all hob types including induction.',
    22000, 32000, home_id, 'CookMaster', 55, true, false,
    ARRAY['frying pan', 'non-stick', 'kitchen', 'cooking']
  );

  -- Sports & Fitness
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Yoga Mat 6mm — Non-Slip',
    'yoga-mat-6mm-non-slip',
    'Extra thick 6mm yoga mat with non-slip surface on both sides. Includes carrying strap. Perfect for yoga, pilates, and floor exercises.',
    14000, 20000, sports_id, 'FlexFit', 90, true, true,
    ARRAY['yoga', 'mat', 'fitness', 'exercise']
  ),
  (
    'Adjustable Dumbbell Set 10kg',
    'adjustable-dumbbell-set-10kg',
    'Pair of adjustable dumbbells, 2–10kg each. Quick weight change mechanism. Compact design for home gyms.',
    75000, 95000, sports_id, 'IronPro', 20, true, true,
    ARRAY['dumbbell', 'weights', 'gym', 'fitness']
  ),
  (
    'Water Bottle 1L — BPA Free',
    'water-bottle-1l-bpa-free',
    'Leak-proof 1-litre water bottle made from BPA-free Tritan plastic. Wide mouth for easy cleaning and adding ice.',
    6500, 9000, sports_id, 'HydroMax', 200, true, false,
    ARRAY['water bottle', 'hydration', 'sports', 'gym']
  );

  -- Beauty & Care
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Vitamin C Face Serum 30ml',
    'vitamin-c-face-serum-30ml',
    'Brightening Vitamin C serum with hyaluronic acid and niacinamide. Reduces dark spots, evens skin tone, and boosts collagen. For all skin types.',
    18500, 26000, beauty_id, 'GlowUp', 85, true, true,
    ARRAY['serum', 'vitamin c', 'skincare', 'face', 'brightening']
  ),
  (
    'Natural Shea Butter Body Lotion 500ml',
    'natural-shea-butter-body-lotion-500ml',
    'Rich, non-greasy body lotion with African shea butter and aloe vera. Deeply moisturises and leaves skin glowing.',
    9500, 14000, beauty_id, 'PureGlow', 120, true, false,
    ARRAY['lotion', 'shea butter', 'body', 'moisturiser', 'natural']
  ),
  (
    'Electric Face Cleanser Brush',
    'electric-face-cleanser-brush',
    'Waterproof rechargeable face cleansing brush with 3 speed settings and 2 brush heads. Removes 99% more dirt than hands alone.',
    25000, 36000, beauty_id, 'CleanTech', 45, true, true,
    ARRAY['cleanser', 'face brush', 'electric', 'skincare']
  );

  -- Food & Grocery
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Premium Ground Coffee 500g',
    'premium-ground-coffee-500g',
    'Arabica ground coffee, medium roast. Rich flavour with chocolate and caramel notes. Freshly sealed for maximum freshness.',
    8500, null, food_id, 'BeanBliss', 150, true, false,
    ARRAY['coffee', 'ground', 'arabica', 'beverage']
  ),
  (
    'Raw Honey 1kg — Pure & Natural',
    'raw-honey-1kg',
    '100% raw unfiltered Nigerian honey. No additives, no preservatives. Rich in antioxidants and natural enzymes.',
    12000, 16000, food_id, 'NaturePure', 80, true, true,
    ARRAY['honey', 'raw', 'natural', 'organic', 'food']
  );

end $$;


-- ── BANNERS ───────────────────────────────────────────────────
insert into banners (title, subtitle, label, discount_text, cta_text, cta_link, bg_color, position, sort_order, is_active) values
(
  'Fresh Arrivals Are Here',
  'Shop thousands of products. Fast delivery everywhere.',
  'Weekend Promotions',
  'Up to 30% Off',
  'Shop Now',
  '/shop',
  '#f9f6f0',
  'hero',
  1,
  true
),
(
  'New Electronics Collection',
  'Latest gadgets at the best prices',
  'Hot Deals',
  '20% Off All Electronics',
  'Shop Now',
  '/category/electronics',
  '#eef4fc',
  'hero',
  2,
  true
);


-- ── VERIFY ────────────────────────────────────────────────────
select
  (select count(*) from categories) as categories,
  (select count(*) from products)   as products,
  (select count(*) from banners)    as banners;
