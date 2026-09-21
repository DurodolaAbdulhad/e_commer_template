// Admin data layer — Supabase when connected, localStorage sample data in demo mode
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function isReady() {
  return (
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('placeholder') &&
    SUPABASE_KEY.length > 20 &&
    !SUPABASE_KEY.includes('placeholder')
  )
}

function getSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}

// ─── Sample data seeded on first demo load ────────────────────────────────
const SAMPLE_CATEGORIES = [
  { id: 'cat1', name: 'Electronics',  slug: 'electronics',  created_at: new Date().toISOString() },
  { id: 'cat2', name: 'Fashion',      slug: 'fashion',      created_at: new Date().toISOString() },
  { id: 'cat3', name: 'Home & Garden',slug: 'home-garden',  created_at: new Date().toISOString() },
  { id: 'cat4', name: 'Health & Beauty',slug: 'health-beauty',created_at: new Date().toISOString() },
  { id: 'cat5', name: 'Sports',       slug: 'sports',       created_at: new Date().toISOString() },
]

function _flashEnd(hours) { const d = new Date(); d.setHours(d.getHours() + hours); return d.toISOString() }

// Reliable Unsplash images (all confirmed loading)
const IMG = {
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  shirt:      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600',
  lamp:       'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', // repeat headphones for demo slide test
  serum:      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', // repeat headphones for demo slide test
  watch:      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
  yoga:       'https://images.unsplash.com/photo-1601925228847-c0b1b9ac8a1b?w=600',
}

const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'Wireless Bluetooth Headphones', slug: 'wireless-bluetooth-headphones', description: 'Premium sound quality with 30-hour battery life and active noise cancellation.', price: 25000, compare_price: 35000, images: [IMG.headphones], category_id: 'cat1', sku: 'ELEC-001', brand: 'Sony',    stock: 12,  is_active: true,  is_featured: true,  is_flash_deal: true,  flash_deal_end: _flashEnd(8), rating: 4.5, review_count: 128, created_at: new Date().toISOString() },
  { id: 'p2', name: "Men's Classic Polo Shirt",      slug: 'mens-classic-polo-shirt',       description: 'Breathable cotton polo shirt available in multiple colors.',                     price: 8500,  compare_price: 12000, images: [IMG.shirt],      category_id: 'cat2', sku: 'FASH-001', brand: 'Nike',    stock: 120, is_active: true,  is_featured: false, is_flash_deal: true,  flash_deal_end: _flashEnd(8), rating: 4.2, review_count: 54,  created_at: new Date().toISOString() },
  { id: 'p3', name: 'Smart LED Desk Lamp',           slug: 'smart-led-desk-lamp',           description: 'USB-C rechargeable lamp with adjustable brightness and color temperature.',      price: 12000, compare_price: 15000, images: [IMG.lamp],       category_id: 'cat3', sku: 'HOME-001', brand: 'Samsung', stock: 5,   is_active: true,  is_featured: true,  is_flash_deal: true,  flash_deal_end: _flashEnd(8), rating: 4.7, review_count: 89,  created_at: new Date().toISOString() },
  { id: 'p4', name: 'Vitamin C Serum 30ml',          slug: 'vitamin-c-serum-30ml',          description: 'Brightening serum with 20% pure Vitamin C for glowing skin.',                   price: 5000,  compare_price: 6500,  images: [IMG.serum],      category_id: 'cat4', sku: 'HEAL-001', brand: 'Nivea',   stock: 200, is_active: true,  is_featured: false, is_flash_deal: true,  flash_deal_end: _flashEnd(8), rating: 4.8, review_count: 312, created_at: new Date().toISOString() },
  { id: 'p5', name: 'Classic Chronograph Watch',     slug: 'classic-chronograph-watch',     description: 'Elegant stainless steel watch with sapphire crystal glass.',                    price: 45000, compare_price: 60000, images: [IMG.watch],      category_id: 'cat1', sku: 'ELEC-002', brand: 'Casio',   stock: 8,   is_active: true,  is_featured: true,  is_flash_deal: true,  flash_deal_end: _flashEnd(8), rating: 4.6, review_count: 203, created_at: new Date().toISOString() },
  { id: 'p6', name: 'Yoga Mat Premium 6mm',          slug: 'yoga-mat-premium-6mm',          description: 'Non-slip eco-friendly yoga mat with alignment lines.',                           price: 9500,  compare_price: 13000, images: [IMG.yoga],       category_id: 'cat5', sku: 'SPRT-001', brand: 'Nike',    stock: 0,   is_active: false, is_featured: false, is_flash_deal: false, flash_deal_end: null,         rating: 4.3, review_count: 67,  created_at: new Date().toISOString() },
]

const SAMPLE_BANNERS = [
  // Hero slider (left, main carousel)
  { id: 'b1', type: 'hero_slide', title: 'Happy Summer Sale!', subtitle: 'Mega Sale — Don\'t Miss Out', discount: 'Up to 40% Off', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', link: '/shop?sale=true', cta: 'Shop Now', bg_color: '#f9f6f0', position: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'b2', type: 'hero_slide', title: 'New Arrivals Are Here', subtitle: 'Fresh Collection 2026', discount: 'From ₦5,000', image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200', link: '/shop?sort=newest', cta: 'Explore Now', bg_color: '#f0f4f9', position: 2, is_active: true, created_at: new Date().toISOString() },
  // Hero side promos (right of hero, stacked 2)
  { id: 'b3', type: 'hero_side', title: 'Fluence Minimal Speaker', subtitle: 'Price Just', price: '₦15,999', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', link: '/shop', cta: 'Shop Now', position: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'b4', type: 'hero_side', title: 'GoPro Action Camera', subtitle: 'Sale 20% off · Only 2 days', price: '', image: 'https://images.unsplash.com/photo-1615779375581-e3c4a9e0a84d?w=400', link: '/shop?sale=true', cta: 'Buy Now', position: 2, is_active: true, created_at: new Date().toISOString() },
  // Mid-page promo banners (2-column, shown between product sections)
  { id: 'b5', type: 'mid_promo', title: 'Premium Smart TV', subtitle: 'Just ₦129,999', image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800', link: '/shop', cta: 'Shop Now', position: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'b6', type: 'mid_promo', title: 'Wireless Earbuds Pro', subtitle: 'Sale 25% off', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', link: '/shop?sale=true', cta: 'Shop Now', position: 2, is_active: true, created_at: new Date().toISOString() },
]

const SAMPLE_POSTS = [
  {
    id: 'post1', title: '10 Must-Have Gadgets for Your Home Office in 2026',
    slug: '10-must-have-gadgets-home-office-2026',
    excerpt: 'Working from home is here to stay. Here are the top 10 gadgets that will transform your home office setup and boost your productivity.',
    content: `Working from home has become the new normal, and having the right tools makes all the difference. Whether you're a freelancer, startup founder, or remote employee, these gadgets will help you work smarter.

**1. Wireless Noise-Cancelling Headphones**
Eliminate distractions with a quality pair of noise-cancelling headphones. Great for calls, deep focus sessions, and video meetings.

**2. Ergonomic Desk Setup**
Your posture matters. Invest in a proper chair and monitor stand — your back will thank you after long hours.

**3. Smart LED Desk Lamp**
A good lighting setup reduces eye strain and improves video call quality. Look for adjustable color temperature and brightness.

**4. USB-C Hub**
Connect everything — monitor, keyboard, mouse, and storage — through a single hub. Essential for MacBook and laptop users.

**5. Mechanical Keyboard**
Typing comfort matters for productivity. A good mechanical keyboard with the right switches improves typing speed and reduces fatigue.

The right setup isn't an expense — it's an investment in your output.`,
    cover_image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
    category: 'Tech & Productivity',
    author: 'Store Team',
    author_avatar: '',
    tags: ['gadgets', 'home office', 'productivity'],
    read_time: 5,
    is_published: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'post2', title: 'How to Build a Capsule Wardrobe on a Budget',
    slug: 'build-capsule-wardrobe-budget',
    excerpt: 'A capsule wardrobe helps you dress better with fewer clothes. Here\'s how to build one without spending a fortune.',
    content: `A capsule wardrobe is a curated collection of essential, versatile pieces that can be mixed and matched to create multiple outfits. The goal: quality over quantity.

**Start with Neutrals**
Build your foundation with neutral colours — white, black, navy, grey, and beige. These mix with everything and never go out of style.

**Invest in Quality Basics**
A well-fitting polo shirt, classic chinos, and clean white sneakers are timeless. Buy the best quality you can afford for these staples.

**The 10-Item Challenge**
Try to create 20+ outfits from just 10 clothing items. This forces you to think about versatility before every purchase.

**Care for Your Clothes**
Extend the life of your wardrobe by washing clothes properly, storing them correctly, and repairing instead of replacing.

Less is truly more when every piece works hard.`,
    cover_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    category: 'Fashion & Style',
    author: 'Store Team',
    author_avatar: '',
    tags: ['fashion', 'style', 'budget'],
    read_time: 4,
    is_published: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'post3', title: 'The Complete Guide to Skincare for Beginners',
    slug: 'complete-skincare-guide-beginners',
    excerpt: 'Starting a skincare routine can feel overwhelming. This simple guide breaks down exactly what you need and in what order to apply it.',
    content: `Great skin doesn\'t happen by accident — it\'s the result of consistency and the right products. Here\'s your no-nonsense starter guide.

**The Core Three**
Every routine needs just three things: a cleanser, a moisturiser, and SPF (morning only). Master these before adding anything else.

**Morning Routine**
1. Gentle cleanser
2. Vitamin C serum (optional but powerful)
3. Moisturiser
4. SPF 30+ sunscreen

**Night Routine**
1. Oil cleanser (to remove sunscreen/makeup)
2. Water-based cleanser
3. Treatment (retinol, niacinamide, etc.)
4. Night moisturiser

**The Most Important Step**
Sunscreen. Every single morning. Even indoors. Even on cloudy days. UV damage is the number one cause of premature ageing.

Start simple, stay consistent, and be patient — good skin takes 4–6 weeks to show results.`,
    cover_image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
    category: 'Health & Beauty',
    author: 'Store Team',
    author_avatar: '',
    tags: ['skincare', 'beauty', 'health'],
    read_time: 6,
    is_published: true,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
]

function seed() {
  if (!localStorage.getItem('admin_seeded')) {
    localStorage.setItem('admin_categories', JSON.stringify(SAMPLE_CATEGORIES))
    localStorage.setItem('admin_products',   JSON.stringify(SAMPLE_PRODUCTS))
    localStorage.setItem('admin_banners',    JSON.stringify(SAMPLE_BANNERS))
    localStorage.setItem('admin_posts',      JSON.stringify(SAMPLE_POSTS))
    localStorage.setItem('admin_seeded', '1')
  }
}

function ls(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}
function lsSave(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────
export async function getCategories() {
  if (isReady()) {
    const { data } = await getSupabase().from('categories').select('*').order('name')
    return data ?? []
  }
  seed()
  return ls('admin_categories')
}
export async function createCategory(cat) {
  if (isReady()) {
    const { data, error } = await getSupabase().from('categories').insert(cat).select().single()
    if (error) throw error
    return data
  }
  const cats = ls('admin_categories')
  const newCat = { ...cat, id: `cat${Date.now()}`, created_at: new Date().toISOString() }
  lsSave('admin_categories', [...cats, newCat])
  return newCat
}
export async function updateCategory(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('categories').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  const cats = ls('admin_categories').map(c => c.id === id ? { ...c, ...updates } : c)
  lsSave('admin_categories', cats)
}
export async function deleteCategory(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('categories').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_categories', ls('admin_categories').filter(c => c.id !== id))
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────
export async function getProducts({ search = '', category = '', status = '', brand = '' } = {}) {
  if (isReady()) {
    let q = getSupabase().from('products').select('*, categories(name)').order('created_at', { ascending: false })
    if (search)   q = q.ilike('name', `%${search}%`)
    if (category) q = q.eq('category_id', category)
    if (brand)    q = q.eq('brand', brand)
    if (status === 'active')   q = q.eq('is_active', true)
    if (status === 'inactive') q = q.eq('is_active', false)
    const { data } = await q
    return data ?? []
  }
  seed()
  let prods = ls('admin_products')
  const cats = ls('admin_categories')
  prods = prods.map(p => ({ ...p, categories: cats.find(c => c.id === p.category_id) }))
  if (search)   prods = prods.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  if (category) prods = prods.filter(p => p.category_id === category)
  if (brand)    prods = prods.filter(p => (p.brand ?? '').toLowerCase() === brand.toLowerCase())
  if (status === 'active')   prods = prods.filter(p => p.is_active)
  if (status === 'inactive') prods = prods.filter(p => !p.is_active)
  return prods
}
export async function getProduct(id) {
  if (isReady()) {
    const { data } = await getSupabase().from('products').select('*, categories(*), product_variants(*)').eq('id', id).single()
    return data
  }
  seed()
  return ls('admin_products').find(p => p.id === id) ?? null
}
export async function createProduct(prod) {
  if (isReady()) {
    const { data, error } = await getSupabase().from('products').insert(prod).select().single()
    if (error) throw error
    return data
  }
  const prods = ls('admin_products')
  const newProd = { ...prod, id: `p${Date.now()}`, rating: 0, review_count: 0, created_at: new Date().toISOString() }
  lsSave('admin_products', [newProd, ...prods])
  return newProd
}
export async function updateProduct(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('products').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_products', ls('admin_products').map(p => p.id === id ? { ...p, ...updates } : p))
}
export async function deleteProduct(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('products').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_products', ls('admin_products').filter(p => p.id !== id))
}

// ─── ORDERS ──────────────────────────────────────────────────────────────
export async function getOrders({ status = '' } = {}) {
  if (isReady()) {
    let q = getSupabase().from('orders').select('*').order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data } = await q
    return data ?? []
  }
  const keys = Object.keys(localStorage).filter(k => k.startsWith('order_'))
  let orders = keys
    .map(k => { try { return JSON.parse(localStorage.getItem(k) ?? '') } catch { return null } })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  if (status) orders = orders.filter(o => (o.status || 'pending') === status)
  return orders
}
export async function getOrder(id) {
  if (isReady()) {
    const { data } = await getSupabase().from('orders').select('*').eq('id', id).single()
    return data
  }
  const keys = Object.keys(localStorage).filter(k => k.startsWith('order_'))
  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) ?? '')
      if (data && (data.id === id || data.reference === id || key === `order_${id}`)) return data
    } catch {}
  }
  return null
}
export async function updateOrderStatus(id, status) {
  if (isReady()) {
    const { error } = await getSupabase().from('orders').update({ status }).eq('id', id)
    if (error) throw error
    return
  }
  const keys = Object.keys(localStorage).filter(k => k.startsWith('order_'))
  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) ?? '')
      if (data && (data.id === id || data.reference === id || key === `order_${id}`)) {
        localStorage.setItem(key, JSON.stringify({ ...data, status }))
        return
      }
    } catch {}
  }
}

// ─── BANNERS ─────────────────────────────────────────────────────────────
export async function getBanners() {
  if (isReady()) {
    const { data } = await getSupabase().from('banners').select('*').order('position')
    return data ?? []
  }
  seed()
  return ls('admin_banners')
}
export async function getBannersByType(type) {
  const all = await getBanners()
  return all.filter(b => b.is_active && b.type === type).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}
export async function createBanner(banner) {
  if (isReady()) {
    const { data, error } = await getSupabase().from('banners').insert(banner).select().single()
    if (error) throw error
    return data
  }
  const banners = ls('admin_banners')
  const newBanner = { ...banner, id: `b${Date.now()}`, created_at: new Date().toISOString() }
  lsSave('admin_banners', [...banners, newBanner])
  return newBanner
}
export async function updateBanner(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('banners').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_banners', ls('admin_banners').map(b => b.id === id ? { ...b, ...updates } : b))
}
export async function deleteBanner(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('banners').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_banners', ls('admin_banners').filter(b => b.id !== id))
}

// ─── SUBSCRIBERS ─────────────────────────────────────────────────────────
export async function getSubscribers() {
  if (isReady()) {
    const { data } = await getSupabase().from('subscribers').select('*').order('created_at', { ascending: false })
    return data ?? []
  }
  return ls('admin_subscribers')
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────
export async function getDashboardStats() {
  const [products, orders, categories] = await Promise.all([
    getProducts(), getOrders(), getCategories(),
  ])
  const revenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const pending = orders.filter(o => (o.status || 'pending') === 'pending').length
  return {
    totalProducts:  products.length,
    activeProducts: products.filter(p => p.is_active).length,
    totalOrders:    orders.length,
    pendingOrders:  pending,
    totalRevenue:   revenue,
    totalCategories: categories.length,
    recentOrders:   orders.slice(0, 5),
    topProducts:    products.filter(p => p.is_featured).slice(0, 4),
  }
}

// ─── BLOG POSTS ───────────────────────────────────────────────────────────
export async function getPosts({ published } = {}) {
  if (isReady()) {
    let q = getSupabase().from('posts').select('*').order('created_at', { ascending: false })
    if (published) q = q.eq('is_published', true)
    const { data } = await q
    return data ?? []
  }
  seed()
  const posts = ls('admin_posts')
  return published ? posts.filter(p => p.is_published) : posts
}

export async function getPostBySlug(slug) {
  if (isReady()) {
    const { data } = await getSupabase().from('posts').select('*').eq('slug', slug).single()
    return data
  }
  seed()
  return ls('admin_posts').find(p => p.slug === slug) ?? null
}

export async function createPost(data) {
  if (isReady()) {
    const { error } = await getSupabase().from('posts').insert(data)
    if (error) throw error
    return
  }
  seed()
  const posts = ls('admin_posts')
  posts.unshift({ ...data, id: 'post_' + Date.now(), created_at: new Date().toISOString() })
  lsSave('admin_posts', posts)
}

export async function updatePost(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('posts').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  const posts = ls('admin_posts').map(p => p.id === id ? { ...p, ...updates } : p)
  lsSave('admin_posts', posts)
}

export async function deletePost(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('posts').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_posts', ls('admin_posts').filter(p => p.id !== id))
}

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

export async function subscribeNewsletter(email, source = 'footer') {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Invalid email address')
  }

  if (isReady()) {
    // Upsert — ignore duplicate by email (unique constraint expected on subscribers.email)
    const { error } = await getSupabase()
      .from('subscribers')
      .upsert({ email: normalized, source, subscribed_at: new Date().toISOString() }, { onConflict: 'email', ignoreDuplicates: true })
    if (error) throw error
    return
  }

  // Demo mode — localStorage
  const subs = ls('newsletter_subscribers')
  const exists = subs.some(s => s.email === normalized)
  if (!exists) {
    subs.push({ id: 'sub_' + Date.now(), email: normalized, source, subscribed_at: new Date().toISOString() })
    lsSave('newsletter_subscribers', subs)
  }
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

const SEED_COUPONS = [
  { id: 'c1', code: 'WELCOME10',  type: 'percent', value: 10,    min_order: 0,     max_uses: null, uses: 0, is_active: true, expires_at: null },
  { id: 'c2', code: 'FREESHIP',   type: 'shipping', value: 0,    min_order: 5000,  max_uses: null, uses: 0, is_active: true, expires_at: null },
  { id: 'c3', code: 'SAVE2000',   type: 'fixed',    value: 2000, min_order: 15000, max_uses: 100,  uses: 0, is_active: true, expires_at: null },
]

export async function getCoupons() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('coupons').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  seed()
  const stored = ls('admin_coupons')
  if (!stored.length) {
    lsSave('admin_coupons', SEED_COUPONS)
    return SEED_COUPONS
  }
  return stored
}

export async function validateCoupon(code) {
  const coupons = await getCoupons()
  const coupon = coupons.find(c => c.code === code.toUpperCase() && c.is_active)
  if (!coupon) return null
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return null
  if (coupon.max_uses && coupon.uses >= coupon.max_uses) return null
  return coupon
}

export async function createCoupon(data) {
  if (isReady()) {
    const { error } = await getSupabase().from('coupons').insert({ ...data, uses: 0, created_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  const coupons = ls('admin_coupons')
  coupons.unshift({ ...data, id: 'c_' + Date.now(), uses: 0, created_at: new Date().toISOString() })
  lsSave('admin_coupons', coupons)
}

export async function updateCoupon(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('coupons').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_coupons', ls('admin_coupons').map(c => c.id === id ? { ...c, ...updates } : c))
}

export async function deleteCoupon(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('coupons').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_coupons', ls('admin_coupons').filter(c => c.id !== id))
}

// ─── Back In Stock Alerts ─────────────────────────────────────────────────────

export async function getBackInStockAlerts() {
  if (isReady()) {
    const { data, error } = await getSupabase()
      .from('back_in_stock_alerts')
      .select('*, products(name, slug, images)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return (ls('back_in_stock_alerts') ?? []).reverse()
}

export async function deleteBackInStockAlert(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('back_in_stock_alerts').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('back_in_stock_alerts', (ls('back_in_stock_alerts') ?? []).filter(a => a.id !== id))
}

// ─── Auto-Discounts ───────────────────────────────────────────────────────────

const SEED_AUTO_DISCOUNTS = [
  { id: 'ad1', name: 'Spend ₦50k Save 10%', type: 'percent', value: 10, min_order: 50000, is_active: true, created_at: new Date().toISOString() },
  { id: 'ad2', name: 'Spend ₦20k Save ₦2,000', type: 'fixed', value: 2000, min_order: 20000, is_active: false, created_at: new Date().toISOString() },
]

export async function getAutoDiscounts() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('auto_discounts').select('*').order('min_order')
    if (error) throw error
    return data ?? []
  }
  const stored = ls('auto_discounts')
  if (!stored.length) { lsSave('auto_discounts', SEED_AUTO_DISCOUNTS); return SEED_AUTO_DISCOUNTS }
  return stored
}

export async function createAutoDiscount(data) {
  if (isReady()) {
    const { error } = await getSupabase().from('auto_discounts').insert({ ...data, created_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  const list = ls('auto_discounts')
  list.unshift({ ...data, id: 'ad_' + Date.now(), created_at: new Date().toISOString() })
  lsSave('auto_discounts', list)
}

export async function updateAutoDiscount(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('auto_discounts').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('auto_discounts', ls('auto_discounts').map(d => d.id === id ? { ...d, ...updates } : d))
}

export async function deleteAutoDiscount(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('auto_discounts').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('auto_discounts', ls('auto_discounts').filter(d => d.id !== id))
}

export async function evaluateAutoDiscount(subtotal) {
  const rules = await getAutoDiscounts()
  const active = rules.filter(r => r.is_active && subtotal >= r.min_order)
  if (!active.length) return null
  // Best deal wins
  active.sort((a, b) => {
    const valA = a.type === 'percent' ? subtotal * a.value / 100 : a.value
    const valB = b.type === 'percent' ? subtotal * b.value / 100 : b.value
    return valB - valA
  })
  return active[0]
}

// ─── Draft Orders ─────────────────────────────────────────────────────────────

export async function getDraftOrders() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('draft_orders').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return (ls('draft_orders') ?? []).slice().reverse()
}

export async function createDraftOrder(data) {
  const draft = { ...data, id: 'dft_' + Date.now(), status: 'draft', created_at: new Date().toISOString() }
  if (isReady()) {
    const { error } = await getSupabase().from('draft_orders').insert(draft)
    if (error) throw error
    return draft
  }
  const list = ls('draft_orders')
  list.unshift(draft)
  lsSave('draft_orders', list)
  return draft
}

export async function updateDraftOrder(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('draft_orders').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('draft_orders', (ls('draft_orders') ?? []).map(d => d.id === id ? { ...d, ...updates } : d))
}

export async function deleteDraftOrder(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('draft_orders').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('draft_orders', (ls('draft_orders') ?? []).filter(d => d.id !== id))
}

// ─── Returns ──────────────────────────────────────────────────────────────────

export async function getReturns() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('returns').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return (ls('returns') ?? []).slice().reverse()
}

export async function createReturn(data) {
  const ret = { ...data, id: 'ret_' + Date.now(), status: 'pending', created_at: new Date().toISOString() }
  if (isReady()) {
    const { error } = await getSupabase().from('returns').insert(ret)
    if (error) throw error
    return ret
  }
  const list = ls('returns')
  list.unshift(ret)
  lsSave('returns', list)
  return ret
}

export async function updateReturn(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('returns').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('returns', (ls('returns') ?? []).map(r => r.id === id ? { ...r, ...updates } : r))
}

// ─── Gift Cards ───────────────────────────────────────────────────────────────

function generateGiftCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${seg()}-${seg()}-${seg()}-${seg()}`
}

export async function getGiftCards() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('gift_cards').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return (ls('gift_cards') ?? []).slice().reverse()
}

export async function createGiftCard(data) {
  const card = {
    ...data,
    id: 'gc_' + Date.now(),
    code: generateGiftCode(),
    balance: data.initial_value,
    is_active: true,
    created_at: new Date().toISOString(),
  }
  if (isReady()) {
    const { error } = await getSupabase().from('gift_cards').insert(card)
    if (error) throw error
    return card
  }
  const list = ls('gift_cards')
  list.unshift(card)
  lsSave('gift_cards', list)
  return card
}

export async function validateGiftCard(code) {
  const cards = await getGiftCards()
  return cards.find(c => c.code === code.toUpperCase() && c.is_active && c.balance > 0) ?? null
}

export async function redeemGiftCard(code, amount) {
  const card = await validateGiftCard(code)
  if (!card) throw new Error('Invalid or exhausted gift card')
  const deduct = Math.min(amount, card.balance)
  await updateGiftCardBalance(card.id, card.balance - deduct)
  return deduct
}

async function updateGiftCardBalance(id, newBalance) {
  const updates = { balance: newBalance, ...(newBalance <= 0 ? { is_active: false } : {}) }
  if (isReady()) {
    await getSupabase().from('gift_cards').update(updates).eq('id', id)
    return
  }
  lsSave('gift_cards', (ls('gift_cards') ?? []).map(c => c.id === id ? { ...c, ...updates } : c))
}

export async function deleteGiftCard(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('gift_cards').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('gift_cards', (ls('gift_cards') ?? []).filter(c => c.id !== id))
}

// ─── Bundles ──────────────────────────────────────────────────────────────────

export async function getBundles() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('bundles').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return (ls('bundles') ?? []).slice().reverse()
}

export async function createBundle(data) {
  if (isReady()) {
    const { error } = await getSupabase().from('bundles').insert({ ...data, created_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  const list = ls('bundles')
  list.unshift({ ...data, id: 'bun_' + Date.now(), is_active: true, created_at: new Date().toISOString() })
  lsSave('bundles', list)
}

export async function updateBundle(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('bundles').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('bundles', (ls('bundles') ?? []).map(b => b.id === id ? { ...b, ...updates } : b))
}

export async function deleteBundle(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('bundles').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('bundles', (ls('bundles') ?? []).filter(b => b.id !== id))
}

// ─── Collections ─────────────────────────────────────────────────────────────

export async function getCollections() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('collections').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return (ls('collections') ?? []).slice().reverse()
}

export async function createCollection(data) {
  if (isReady()) {
    const { error } = await getSupabase().from('collections').insert({ ...data, created_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  const list = ls('collections')
  list.unshift({ ...data, id: 'col_' + Date.now(), is_active: true, created_at: new Date().toISOString() })
  lsSave('collections', list)
}

export async function updateCollection(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('collections').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('collections', (ls('collections') ?? []).map(c => c.id === id ? { ...c, ...updates } : c))
}

export async function deleteCollection(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('collections').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('collections', (ls('collections') ?? []).filter(c => c.id !== id))
}

// ─── Admin Roles ──────────────────────────────────────────────────────────────

export async function getAdminUsers() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('admin_users').select('*').order('created_at')
    if (error) throw error
    return data ?? []
  }
  const list = ls('admin_users')
  if (!list.length) {
    const seed = [{ id: 'u1', email: 'admin@mystore.com', role: 'admin', name: 'Store Admin', is_active: true, created_at: new Date().toISOString() }]
    lsSave('admin_users', seed)
    return seed
  }
  return list
}

export async function createAdminUser(data) {
  if (isReady()) {
    const { error } = await getSupabase().from('admin_users').insert({ ...data, created_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  const list = ls('admin_users')
  list.push({ ...data, id: 'u_' + Date.now(), created_at: new Date().toISOString() })
  lsSave('admin_users', list)
}

export async function updateAdminUser(id, updates) {
  if (isReady()) {
    const { error } = await getSupabase().from('admin_users').update(updates).eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_users', (ls('admin_users') ?? []).map(u => u.id === id ? { ...u, ...updates } : u))
}

export async function deleteAdminUser(id) {
  if (isReady()) {
    const { error } = await getSupabase().from('admin_users').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSave('admin_users', (ls('admin_users') ?? []).filter(u => u.id !== id))
}

// ─── Abandoned Carts ─────────────────────────────────────────────────────────

export async function saveAbandonedCart(email, items, subtotal) {
  const cart = {
    email,
    items,
    subtotal,
    status: 'abandoned',
    reminder_sent: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (isReady()) {
    await getSupabase()
      .from('abandoned_carts')
      .upsert({ ...cart }, { onConflict: 'email', ignoreDuplicates: false })
    return
  }
  const list = ls('abandoned_carts')
  const idx = list.findIndex(c => c.email === email)
  if (idx >= 0) list[idx] = { ...list[idx], ...cart }
  else list.push({ ...cart, id: 'ac_' + Date.now() })
  lsSave('abandoned_carts', list)
}

export async function getAbandonedCarts() {
  if (isReady()) {
    const { data, error } = await getSupabase().from('abandoned_carts').select('*').eq('status', 'abandoned').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return (ls('abandoned_carts') ?? []).filter(c => c.status === 'abandoned').reverse()
}

export async function markCartRecovered(email) {
  if (isReady()) {
    await getSupabase().from('abandoned_carts').update({ status: 'recovered' }).eq('email', email)
    return
  }
  lsSave('abandoned_carts', (ls('abandoned_carts') ?? []).map(c => c.email === email ? { ...c, status: 'recovered' } : c))
}

// ─── Site Settings ────────────────────────────────────────────────────────────

const DEFAULT_HOMEPAGE_SECTIONS = [
  { id: 'hero',         label: 'Hero Banner',       visible: true },
  { id: 'trust',        label: 'Trust Badges',      visible: true },
  { id: 'categories',   label: 'Category Grid',     visible: true },
  { id: 'flash',        label: 'Flash Deals',       visible: true },
  { id: 'featured',     label: 'Featured Products', visible: true },
  { id: 'promo',        label: 'Promo Banner',      visible: true },
  { id: 'new_arrivals', label: 'New Arrivals',      visible: true },
  { id: 'newsletter',   label: 'Newsletter',        visible: true },
]

export async function getHomepageSections() {
  if (isReady()) {
    const { data } = await getSupabase()
      .from('site_settings')
      .select('value')
      .eq('id', 'homepage_sections')
      .single()
    return data?.value ?? DEFAULT_HOMEPAGE_SECTIONS
  }
  const saved = ls('homepage_sections')
  return saved?.length ? saved : DEFAULT_HOMEPAGE_SECTIONS
}

export async function saveHomepageSections(sections) {
  if (isReady()) {
    const { error } = await getSupabase()
      .from('site_settings')
      .upsert({ id: 'homepage_sections', value: sections, updated_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  lsSave('homepage_sections', sections)
}

// ─── Store Settings (logo, name, etc.) ───────────────────────────────────────

export async function getStoreSetting(key) {
  if (isReady()) {
    const { data } = await getSupabase()
      .from('site_settings')
      .select('value')
      .eq('id', `store_${key}`)
      .single()
    return data?.value ?? null
  }
  try { return JSON.parse(localStorage.getItem(`store_${key}`) ?? 'null') } catch { return null }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics() {
  if (!isReady()) return null
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const week  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString()

  const [todayRows, weekRows, totalRes] = await Promise.all([
    getSupabase().from('page_views').select('session_id').gte('created_at', today),
    getSupabase().from('page_views').select('session_id,path,device,created_at').gte('created_at', week),
    getSupabase().from('page_views').select('*', { count: 'exact', head: true }),
  ])

  const todayVisitors = new Set((todayRows.data ?? []).map(r => r.session_id)).size
  const allWeek       = weekRows.data ?? []
  const weekVisitors  = new Set(allWeek.map(r => r.session_id)).size

  // Daily unique visitors for chart (last 7 days)
  const dailyMap = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    dailyMap[d.toISOString().slice(0, 10)] = new Set()
  }
  for (const row of allWeek) {
    const day = (row.created_at ?? '').slice(0, 10)
    if (dailyMap[day]) dailyMap[day].add(row.session_id)
  }
  const daily = Object.entries(dailyMap).map(([date, sessions]) => ({
    date,
    label: new Date(date + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'short' }),
    visitors: sessions.size,
  }))

  // Top pages
  const pageCounts = {}
  for (const row of allWeek) {
    pageCounts[row.path] = (pageCounts[row.path] ?? 0) + 1
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }))

  // Device breakdown
  const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 }
  for (const row of allWeek) {
    const d = row.device ?? 'desktop'
    deviceCounts[d] = (deviceCounts[d] ?? 0) + 1
  }

  return { todayVisitors, weekVisitors, totalViews: totalRes.count ?? 0, daily, topPages, deviceCounts }
}

export async function saveStoreSetting(key, value) {
  if (isReady()) {
    const { error } = await getSupabase()
      .from('site_settings')
      .upsert({ id: `store_${key}`, value, updated_at: new Date().toISOString() })
    if (error) throw error
  }
  try { localStorage.setItem(`store_${key}`, JSON.stringify(value)) } catch {}
}
