'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import ProductCard from '@/components/product/ProductCard'
import { getCollections, getProducts } from '@/lib/admin-db'
import Link from 'next/link'
import { ChevronRight, Layers } from 'lucide-react'

const ACCENT = '#e84c3d'

function matchesRule(product: any, rule: { type: string; value: string }): boolean {
  const v = rule.value?.toString().toLowerCase()
  switch (rule.type) {
    case 'tag':        return (product.tags ?? []).some((t: string) => t.toLowerCase() === v)
    case 'category':   return product.category_id === rule.value || product.category?.name?.toLowerCase() === v
    case 'vendor':     return product.brand?.toLowerCase() === v
    case 'price_lte':  return product.price <= Number(rule.value)
    case 'price_gte':  return product.price >= Number(rule.value)
    case 'in_stock':   return (product.stock ?? 0) > 0
    case 'on_sale':    return !!(product.compare_price && product.compare_price > product.price)
    case 'manual':     return (rule.value ?? '').split(',').map((s: string) => s.trim()).includes(product.id)
    default:           return false
  }
}

function filterByCollection(products: any[], collection: any): any[] {
  const rules: any[] = collection.rules ?? []
  if (!rules.length) return products

  const matchFn = collection.match_type === 'any'
    ? (p: any) => rules.some(r => matchesRule(p, r))
    : (p: any) => rules.every(r => matchesRule(p, r))

  let result = products.filter(matchFn)

  if (collection.sort_by === 'price_asc')  result.sort((a, b) => a.price - b.price)
  if (collection.sort_by === 'price_desc') result.sort((a, b) => b.price - a.price)
  if (collection.sort_by === 'name_asc')   result.sort((a, b) => a.name.localeCompare(b.name))
  if (collection.sort_by === 'newest')     result.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())

  return result
}

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>()
  const [collection, setCollection] = useState<any>(null)
  const [products, setProducts]     = useState<any[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [collections, allProducts] = await Promise.all([getCollections(), getProducts()])
        const found = collections.find((c: any) => c.slug === slug || c.id === slug)
        if (found) {
          setCollection(found)
          setProducts(filterByCollection(allProducts.filter((p: any) => p.is_active !== false), found))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [slug])

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <Link href="/shop" className="hover:text-gray-600">Shop</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">{collection?.name ?? slug}</span>
          </nav>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ACCENT}15` }}>
              <Layers size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                {collection?.name ?? 'Collection'}
              </h1>
              {collection?.description && (
                <p className="text-sm text-gray-500 mt-0.5">{collection.description}</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : !collection ? (
            <div className="text-center py-24">
              <Layers size={40} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">Collection not found.</p>
              <Link href="/shop" className="inline-block mt-4 text-sm font-semibold underline" style={{ color: ACCENT }}>
                Browse all products
              </Link>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <Layers size={40} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">No products in this collection yet.</p>
              <Link href="/shop" className="inline-block mt-4 text-sm font-semibold underline" style={{ color: ACCENT }}>
                Browse all products
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-4">{products.length} product{products.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </>
          )}
        </main>
      </PageBox>
      <Footer />
    </>
  )
}
