-- ============================================================
-- TRACY BOUTIQUE — Custom Seed Data
-- Run AFTER schema.sql in the TracyBriday Supabase project
-- ============================================================

-- ── CATEGORIES ────────────────────────────────────────────────
insert into categories (name, slug, description, sort_order, is_active) values
  ('Bridal Gowns',       'bridal-gowns',      'Wedding dresses and bridal gowns',           1, true),
  ('Bridesmaid Dresses', 'bridesmaid-dresses', 'Coordinated dresses for the bridal party',   2, true),
  ('Evening & Occasion', 'evening-occasion',   'Formal and occasion wear for events',         3, true),
  ('Accessories',        'accessories',        'Veils, tiaras, jewellery, and shoes',         4, true),
  ('Aso-Ebi',            'aso-ebi',            'Fabric and ready-made aso-ebi outfits',       5, true),
  ('Suits & Menswear',   'suits-menswear',     'Groom and groomsmen suits and accessories',  6, true),
  ('Beauty & Glam',      'beauty-glam',        'Bridal makeup, skincare, and accessories',   7, true),
  ('Sale',               'sale',               'Discounted and sample pieces',                8, true)
on conflict (slug) do nothing;


-- ── PRODUCTS ──────────────────────────────────────────────────
do $$
declare
  bridal_id     uuid;
  bridesmaid_id uuid;
  evening_id    uuid;
  accessories_id uuid;
  asoebi_id     uuid;
  suits_id      uuid;
  beauty_id     uuid;
  sale_id       uuid;
begin
  select id into bridal_id      from categories where slug = 'bridal-gowns';
  select id into bridesmaid_id  from categories where slug = 'bridesmaid-dresses';
  select id into evening_id     from categories where slug = 'evening-occasion';
  select id into accessories_id from categories where slug = 'accessories';
  select id into asoebi_id      from categories where slug = 'aso-ebi';
  select id into suits_id       from categories where slug = 'suits-menswear';
  select id into beauty_id      from categories where slug = 'beauty-glam';
  select id into sale_id        from categories where slug = 'sale';

  -- Bridal Gowns
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Celestine A-Line Bridal Gown',
    'celestine-a-line-bridal-gown',
    'Elegant A-line silhouette with delicate lace bodice and sweeping train. Features a deep V-back and cathedral-length veil option. Available in ivory, white, and champagne. Custom sizing available.',
    850000, null, bridal_id, 'Tracy Boutique', 5, true, true,
    ARRAY['bridal', 'gown', 'a-line', 'lace', 'wedding']
  ),
  (
    'Adaeze Ball Gown — Royal Edition',
    'adaeze-ball-gown-royal-edition',
    'Dramatic princess ball gown with corset bodice, tulle skirt, and pearl-encrusted bodice. A statement piece for the bold bride. Available in white and blush pink.',
    1200000, null, bridal_id, 'Tracy Boutique', 3, true, true,
    ARRAY['bridal', 'ball gown', 'princess', 'tulle', 'wedding']
  ),
  (
    'Serenity Mermaid Dress',
    'serenity-mermaid-dress',
    'Figure-hugging mermaid silhouette with chiffon overlay and off-shoulder neckline. Sophisticated and modern. Custom measurements required.',
    680000, null, bridal_id, 'Tracy Boutique', 4, true, false,
    ARRAY['bridal', 'mermaid', 'chiffon', 'modern', 'wedding']
  ),
  (
    'Classic Satin Slip Gown',
    'classic-satin-slip-gown',
    'Minimalist bias-cut satin slip gown with thin straps and subtle cowl neckline. Timeless elegance for the contemporary bride.',
    420000, null, bridal_id, 'Tracy Boutique', 6, true, false,
    ARRAY['bridal', 'satin', 'minimalist', 'slip', 'wedding']
  );

  -- Bridesmaid Dresses
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Harmony Chiffon Bridesmaid Dress',
    'harmony-chiffon-bridesmaid-dress',
    'Flowy chiffon bridesmaid dress with ruched bodice and A-line skirt. Available in 12 colours. Sold per piece, minimum order 4.',
    65000, 85000, bridesmaid_id, 'Tracy Boutique', 40, true, true,
    ARRAY['bridesmaid', 'chiffon', 'party', 'wedding', 'dress']
  ),
  (
    'Velvet Wrap Bridesmaid Dress',
    'velvet-wrap-bridesmaid-dress',
    'Luxurious velvet wrap dress with adjustable tie waist. Flattering on all body types. Perfect for evening weddings.',
    78000, null, bridesmaid_id, 'Tracy Boutique', 25, true, false,
    ARRAY['bridesmaid', 'velvet', 'wrap', 'evening', 'dress']
  );

  -- Evening & Occasion
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Midnight Sequin Maxi Dress',
    'midnight-sequin-maxi-dress',
    'Full-length sequin gown with plunging neckline and open back. Perfect for galas, black-tie events, and birthday dinners.',
    180000, 240000, evening_id, 'Tracy Boutique', 10, true, true,
    ARRAY['evening', 'sequin', 'gala', 'black-tie', 'dress']
  ),
  (
    'Coral Off-Shoulder Midi Dress',
    'coral-off-shoulder-midi-dress',
    'Structured off-shoulder midi dress in rich coral. Perfect for engagement parties, bridal showers, and special occasions.',
    95000, 120000, evening_id, 'Tracy Boutique', 15, true, false,
    ARRAY['occasion', 'off-shoulder', 'midi', 'party', 'dress']
  );

  -- Accessories
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Pearl Drop Bridal Earrings',
    'pearl-drop-bridal-earrings',
    'Freshwater pearl drop earrings set in sterling silver. Elegant and timeless. Perfect for brides and bridesmaids.',
    28000, 38000, accessories_id, 'Tracy Boutique', 30, true, true,
    ARRAY['earrings', 'pearl', 'bridal', 'jewellery', 'accessories']
  ),
  (
    'Crystal Bridal Tiara',
    'crystal-bridal-tiara',
    'Delicate crystal tiara with adjustable band. Catches light beautifully. Pairs perfectly with the Celestine and Adaeze gowns.',
    45000, 60000, accessories_id, 'Tracy Boutique', 12, true, true,
    ARRAY['tiara', 'crystal', 'bridal', 'crown', 'accessories']
  ),
  (
    'Cathedral Lace Veil — 3m',
    'cathedral-lace-veil-3m',
    '3-metre cathedral-length veil with hand-finished lace trim. Adds drama and romance to any bridal look.',
    55000, 70000, accessories_id, 'Tracy Boutique', 8, true, false,
    ARRAY['veil', 'cathedral', 'lace', 'bridal', 'accessories']
  ),
  (
    'Bridal Block-Heel Satin Shoes',
    'bridal-block-heel-satin-shoes',
    'Ivory satin block-heel pumps with delicate bow detail. Comfortable for a full wedding day. Available in sizes 36–42.',
    42000, 55000, accessories_id, 'Tracy Boutique', 20, true, false,
    ARRAY['shoes', 'heels', 'satin', 'bridal', 'accessories']
  );

  -- Aso-Ebi
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Premium Organza Aso-Ebi Fabric — 5 Yards',
    'premium-organza-aso-ebi-5yards',
    'High-quality organza fabric ideal for aso-ebi. Comes in 5-yard sets, minimum order 10 sets. Available in custom colours. Price per set.',
    38000, null, asoebi_id, 'Tracy Boutique', 100, true, true,
    ARRAY['aso-ebi', 'fabric', 'organza', 'wedding', 'nigerian']
  ),
  (
    'Ready-Made Aso-Ebi Blouse & Skirt Set',
    'ready-made-aso-ebi-blouse-skirt-set',
    'Fully tailored aso-ebi set with embellished blouse and flared skirt. Ready to wear, no tailoring needed. Available in all standard sizes.',
    75000, 95000, asoebi_id, 'Tracy Boutique', 20, true, false,
    ARRAY['aso-ebi', 'ready-made', 'blouse', 'skirt', 'nigerian']
  );

  -- Suits & Menswear
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Classic 3-Piece Groom Suit',
    'classic-3-piece-groom-suit',
    'Tailored 3-piece suit in premium wool blend. Includes jacket, trousers, and waistcoat. Custom measurements available. Ships in 3–4 weeks.',
    280000, null, suits_id, 'Tracy Boutique', 5, true, true,
    ARRAY['suit', 'groom', 'menswear', 'wedding', '3-piece']
  ),
  (
    'Agbada Set — Wedding Edition',
    'agbada-set-wedding-edition',
    'Full embroidered agbada set with flowing outer robe, inner shirt, and trousers. Premium fabric with hand-finished embroidery.',
    320000, null, suits_id, 'Tracy Boutique', 4, true, true,
    ARRAY['agbada', 'groom', 'nigerian', 'traditional', 'wedding']
  );

  -- Beauty & Glam
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Bridal Glow Skincare Set',
    'bridal-glow-skincare-set',
    'Complete 4-piece bridal prep skincare routine: cleanser, serum, moisturiser, and SPF. Start 6 weeks before your wedding for best results.',
    85000, 110000, beauty_id, 'GlowUp Bridal', 25, true, true,
    ARRAY['skincare', 'bridal', 'glow', 'beauty', 'set']
  ),
  (
    'Professional Bridal Makeup Kit',
    'professional-bridal-makeup-kit',
    'Curated bridal makeup kit with long-wear foundation, setting powder, highlighter, lip colour, and mascara. Sweat-proof, humidity-resistant formula.',
    120000, 150000, beauty_id, 'GlowUp Bridal', 15, true, false,
    ARRAY['makeup', 'bridal', 'professional', 'beauty', 'kit']
  );

  -- Sale
  insert into products (name, slug, description, price, compare_price, category_id, brand, stock, is_active, is_featured, tags) values
  (
    'Sample Gown — Ivory A-Line (Size 10)',
    'sample-gown-ivory-a-line-size-10',
    'Showroom sample gown in excellent condition. Deep clean before delivery. Final sale — no returns. Size 10 only. Perfect for a budget-conscious bride.',
    185000, 650000, sale_id, 'Tracy Boutique', 1, true, true,
    ARRAY['sale', 'sample', 'bridal', 'gown', 'budget']
  );

end $$;


-- ── BANNERS ───────────────────────────────────────────────────
insert into banners (title, subtitle, label, discount_text, cta_text, cta_link, bg_color, position, sort_order, is_active) values
(
  'Your Dream Look, Delivered',
  'Bridal gowns, bridesmaid dresses, aso-ebi, and everything in between.',
  'New Collection',
  'Book a Free Fitting',
  'Shop Now',
  '/shop',
  '#fdf6f8',
  'hero',
  1,
  true
),
(
  'Aso-Ebi Made Easy',
  'Order your fabric or ready-made sets — minimum 10 sets, delivered to your door.',
  'Group Orders',
  'Starting at ₦38,000 per set',
  'Order Now',
  '/category/aso-ebi',
  '#f5f0fa',
  'hero',
  2,
  true
);


-- ── VERIFY ────────────────────────────────────────────────────
select
  (select count(*) from categories) as categories,
  (select count(*) from products)   as products,
  (select count(*) from banners)    as banners;
