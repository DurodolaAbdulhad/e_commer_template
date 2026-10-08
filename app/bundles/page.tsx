'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { getBundles, getProducts } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Package, ShoppingCart, Zap } from 'lucide-react'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

const ACCENT = client.colors.primary
const NAVY   = '#1a2638'

export default function CombosPage() {
  const [bundles, setBundles]   = useState<any[]>([])
  const [products, setProducts] = useState<Map<string, any>>(new Map())
  const [loading, setLoading]   = useState(true)
  const { dispatch }            = useCart() as any

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [allBundles, allProducts] = await Promise.all([getBundles(), getProducts()])
        const map = new Map<string, any>(allProducts.map((p: any) => [p.id, p] as [string, any]))
        setProducts(map)
        setBundles(allBundles.filter((b: any) => b.is_active !== false))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  function addToCart(bundle: any) {
    const items: any[] = (bundle.product_ids ?? [])
      .map((pid: string) => products.get(pid))
      .filter(Boolean)
    if (!items.length) { toast.error('Combo products not found'); return }
    items.forEach(product => dispatch({ type: 'ADD_ITEM', item: { ...product, quantity: 1 } }))
    toast.success(`${bundle.name} added to cart!`)
  }

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
            <span className="text-gray-700 font-medium">Combo Deals</span>
          </nav>

          {/* Header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} style={{ color: ACCENT }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Exclusive Combos</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                Combo Deals
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Buy together, save more — curated bundles at special prices.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-24">
              <Package size={40} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">No combo deals right now.</p>
              <Link href="/shop" className="inline-block mt-4 text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
                Browse individual products →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map(bundle => {
                const items: any[] = (bundle.product_ids ?? [])
                  .map((pid: string) => products.get(pid))
                  .filter(Boolean)
                const retailTotal = items.reduce((s, p) => s + (p.price ?? 0), 0)
                const bundlePrice = bundle.bundle_price ?? retailTotal
                const savings     = retailTotal - bundlePrice
                const pct         = retailTotal > 0 ? Math.round((savings / retailTotal) * 100) : 0

                return (
                  <div key={bundle.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">

                    {/* Stacked product images */}
                    <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {/* Background tint */}
                      <div className="absolute inset-0 opacity-5" style={{ backgroundColor: ACCENT }} />

                      {/* Overlapping product thumbnails */}
                      <div className="relative flex items-center">
                        {items.slice(0, 3).map((p, i) => (
                          <div key={p.id}
                            className="w-20 h-20 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white relative"
                            style={{
                              marginLeft: i === 0 ? 0 : '-16px',
                              zIndex: items.length - i,
                              transform: i === 0 ? 'rotate(-6deg)' : i === 1 ? 'rotate(0deg)' : 'rotate(6deg)',
                            }}>
                            {p.images?.[0]
                              ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="80px" />
                              : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-300">{p.name?.charAt(0)}</div>
                            }
                          </div>
                        ))}
                      </div>

                      {/* Discount badge */}
                      {pct > 0 && (
                        <div className="absolute top-3 right-3 w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-extrabold shadow-md"
                          style={{ backgroundColor: ACCENT }}>
                          <span className="text-sm leading-none">{pct}%</span>
                          <span className="text-[9px] leading-none font-semibold opacity-90">OFF</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-5 pt-4 pb-2 flex-1">
                      <h2 className="text-base font-bold text-gray-900 leading-snug" style={{ fontFamily: 'var(--font-heading)' }}>
                        {bundle.name}
                      </h2>
                      {bundle.description && (
                        <p className="text-xs text-gray-500 mt-1">{bundle.description}</p>
                      )}

                      {/* Product list */}
                      <div className="mt-3 space-y-1.5">
                        {items.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{i + 1}.</span>
                            <span className="text-xs text-gray-700 flex-1 truncate">{p.name}</span>
                            <span className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between gap-3 mt-auto">
                      <div>
                        <p className="text-xl font-extrabold" style={{ color: ACCENT }}>
                          {formatPrice(bundlePrice)}
                        </p>
                        {savings > 0 && (
                          <p className="text-xs text-gray-400">
                            <span className="line-through">{formatPrice(retailTotal)}</span>
                            <span className="text-green-600 font-semibold ml-1">Save {formatPrice(savings)}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(bundle)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90 shrink-0"
                        style={{ backgroundColor: ACCENT }}>
                        <ShoppingCart size={14} />
                        Get Combo
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </PageBox>
      <Footer />
    </>
  )
}
