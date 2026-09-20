'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ProductDetailClient from './ProductDetailClient'

export default function ProductDetailDemo({ slug }: { slug: string }) {
  const [product,       setProduct]       = useState<any>(null)
  const [related,       setRelated]       = useState<any[]>([])
  const [upsells,       setUpsells]       = useState<any[]>([])
  const [specialOffers, setSpecialOffers] = useState<any[]>([])
  const [notFound404,   setNotFound404]   = useState(false)

  useEffect(() => {
    try {
      // Seed if needed (import the seed function inline)
      const SAMPLE_PRODUCTS = [
        { id: 'p1', name: 'Wireless Bluetooth Headphones', slug: 'wireless-bluetooth-headphones', description: 'Premium sound quality with 30-hour battery life and active noise cancellation. Foldable over-ear design. Works with all Bluetooth 5.0 devices.', price: 25000, compare_price: 35000, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600'], category_id: 'cat1', sku: 'ELEC-001', brand: 'Sony', stock: 45, is_active: true, is_featured: true, rating: 4.5, review_count: 128 },
        { id: 'p2', name: "Men's Classic Polo Shirt",      slug: 'mens-classic-polo-shirt',      description: 'Breathable 100% cotton polo shirt. Available in multiple colors. Machine washable.', price: 8500,  compare_price: 12000, images: ['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600'], category_id: 'cat2', sku: 'FASH-001', brand: 'Nike', stock: 120, is_active: true, is_featured: false, rating: 4.2, review_count: 54 },
        { id: 'p3', name: 'Smart LED Desk Lamp',           slug: 'smart-led-desk-lamp',          description: 'USB-C rechargeable LED lamp with 3 brightness levels and 2 color temperatures. Touch control, flexible neck.', price: 12000, compare_price: 15000, images: ['https://images.unsplash.com/photo-1543198126-a4d9b3c5e8b5?w=600'], category_id: 'cat3', sku: 'HOME-001', brand: 'Samsung', stock: 30, is_active: true, is_featured: true, rating: 4.7, review_count: 89 },
        { id: 'p4', name: 'Vitamin C Serum 30ml',          slug: 'vitamin-c-serum-30ml',         description: 'Brightening serum with 20% pure Vitamin C, Hyaluronic Acid & Vitamin E. Reduces dark spots and boosts collagen.', price: 6500, compare_price: null, images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'], category_id: 'cat4', sku: 'HEAL-001', brand: 'Nivea', stock: 200, is_active: true, is_featured: false, rating: 4.8, review_count: 312 },
        { id: 'p5', name: 'Yoga Mat Premium 6mm',          slug: 'yoga-mat-premium-6mm',         description: 'Non-slip eco-friendly yoga mat with alignment lines. Extra thick 6mm for joint support.', price: 9500, compare_price: 13000, images: ['https://images.unsplash.com/photo-1601925228847-c0b1b9ac8a1b?w=600'], category_id: 'cat5', sku: 'SPRT-001', brand: 'Samsung', stock: 0, is_active: false, is_featured: false, rating: 4.3, review_count: 67 },
      ]
      const SAMPLE_CATEGORIES = [
        { id: 'cat1', name: 'Electronics',    slug: 'electronics'   },
        { id: 'cat2', name: 'Fashion',        slug: 'fashion'       },
        { id: 'cat3', name: 'Home & Garden',  slug: 'home-garden'   },
        { id: 'cat4', name: 'Health & Beauty',slug: 'health-beauty' },
        { id: 'cat5', name: 'Sports',         slug: 'sports'        },
      ]

      // Pull from localStorage (may have admin-added products)
      let products: any[] = []
      let categories: any[] = []
      try {
        const raw = localStorage.getItem('admin_products')
        if (raw) products = JSON.parse(raw)
      } catch {}
      if (!products.length) products = SAMPLE_PRODUCTS

      try {
        const raw = localStorage.getItem('admin_categories')
        if (raw) categories = JSON.parse(raw)
      } catch {}
      if (!categories.length) categories = SAMPLE_CATEGORIES

      const found = products.find((p: any) => p.slug === slug || p.id === slug)
      if (!found) { setNotFound404(true); return }

      const cat = categories.find((c: any) => c.id === found.category_id)
      const enriched = { ...found, categories: cat ?? null, product_variants: [] }
      setProduct(enriched)

      const rel = products.filter((p: any) => p.id !== found.id && p.category_id === found.category_id && p.is_active).slice(0, 8)
      setRelated(rel)

      const ups = products
        .filter((p: any) => p.id !== found.id && p.is_active && p.price > found.price)
        .sort((a: any, b: any) => a.price - b.price)
        .slice(0, 6)
      setUpsells(ups)

      const offers = products.filter((p: any) => p.id !== found.id && p.compare_price && p.is_active).slice(0, 3)
      setSpecialOffers(offers)
    } catch {
      setNotFound404(true)
    }
  }, [slug])

  if (notFound404) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-5xl">🔍</p>
        <p className="text-lg font-semibold text-gray-600">Product not found</p>
        <Link href="/shop" className="px-5 py-2 text-sm font-bold text-white rounded"
          style={{ backgroundColor: '#e84c3d' }}>Back to Shop</Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
      </div>
    )
  }

  const category = product.categories

  return (
    <>
      <nav className="flex items-center gap-1 text-xs text-gray-400 mb-5 flex-wrap">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <ChevronRight size={11} />
        {category && (
          <>
            <Link href={`/shop?category=${category.slug}`} className="hover:text-gray-700">{category.name}</Link>
            <ChevronRight size={11} />
          </>
        )}
        <span className="text-gray-600 font-medium line-clamp-1">{product.name}</span>
      </nav>

      <ProductDetailClient
        product={product}
        related={related}
        upsell={upsells}
        specialOffers={specialOffers}
      />
    </>
  )
}
