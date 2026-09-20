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
import { ChevronRight, Package, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

export default function BundlesPage() {
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

  function addBundleToCart(bundle: any) {
    const items: any[] = (bundle.product_ids ?? [])
      .map((pid: string) => products.get(pid))
      .filter(Boolean)

    if (!items.length) {
      toast.error('Bundle products not found')
      return
    }

    items.forEach(product => {
      dispatch({ type: 'ADD_ITEM', payload: { ...product, quantity: 1 } })
    })

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
            <span className="text-gray-700 font-medium">Bundles</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Product Bundles
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Save more when you buy products together.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-24">
              <Package size={40} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">No bundles available right now.</p>
              <Link href="/shop" className="inline-block mt-4 text-sm font-semibold underline" style={{ color: ACCENT }}>
                Browse individual products
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
                const savings = retailTotal - bundlePrice

                return (
                  <div key={bundle.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">

                    {/* Badge */}
                    {savings > 0 && (
                      <div className="px-5 pt-4">
                        <span className="inline-block px-2.5 py-1 text-xs font-bold text-white rounded-full"
                          style={{ backgroundColor: ACCENT }}>
                          Save {formatPrice(savings)}
                        </span>
                      </div>
                    )}

                    {/* Bundle name */}
                    <div className="px-5 pt-3 pb-2">
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                        {bundle.name}
                      </h2>
                      {bundle.description && (
                        <p className="text-xs text-gray-500 mt-1">{bundle.description}</p>
                      )}
                    </div>

                    {/* Products */}
                    <div className="px-5 pb-3 flex-1 space-y-2">
                      {items.map((product, i) => (
                        <div key={product.id} className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden relative shrink-0">
                            {product.images?.[0]
                              ? <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                              : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">
                                  {product.name?.charAt(0)}
                                </div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{product.name}</p>
                            <p className="text-xs text-gray-400">{formatPrice(product.price)}</p>
                          </div>
                          {i < items.length - 1 && (
                            <span className="text-gray-300 text-xs font-bold">+</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Price + CTA */}
                    <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-extrabold" style={{ color: ACCENT }}>
                          {formatPrice(bundlePrice)}
                        </p>
                        {savings > 0 && (
                          <p className="text-xs text-gray-400 line-through">{formatPrice(retailTotal)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => addBundleToCart(bundle)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90"
                        style={{ backgroundColor: ACCENT }}>
                        <ShoppingCart size={15} />
                        Add Bundle
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
