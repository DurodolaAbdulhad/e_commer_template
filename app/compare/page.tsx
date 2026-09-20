'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Star, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT    = '#e84c3d'
const STAR_FILL = '#F5A623'

function Stars({ n = 0 }: { n: number }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24"
          fill={s <= Math.round(n) ? STAR_FILL : '#e5e7eb'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function CompareContent() {
  const searchParams = useSearchParams()
  const { dispatch } = useCart()
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? []
    if (!ids.length) return
    try {
      const all = JSON.parse(localStorage.getItem('admin_products') || '[]')
      setProducts(ids.map(id => all.find((p: any) => p.id === id)).filter(Boolean))
    } catch {}
  }, [searchParams])

  function addToCart(p: any) {
    dispatch({ type: 'ADD_ITEM', item: { ...p, quantity: 1 } })
    toast.success(`${p.name} added to cart`)
  }

  if (!products.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">No products selected for comparison.</p>
        <Link href="/shop" className="text-sm font-semibold"
          style={{ color: ACCENT }}>← Browse products</Link>
      </div>
    )
  }

  // All rows to compare
  const rows: { label: string; key: string; render?: (val: any, p: any) => React.ReactNode }[] = [
    {
      label: 'Price',
      key: 'price',
      render: (_, p) => (
        <div>
          <span className="font-bold text-base" style={{ color: ACCENT }}>{formatPrice(p.price)}</span>
          {p.compare_price && p.compare_price > p.price && (
            <span className="ml-2 text-xs text-gray-400 line-through">{formatPrice(p.compare_price)}</span>
          )}
        </div>
      ),
    },
    {
      label: 'Rating',
      key: 'rating',
      render: (val, p) => val
        ? <div className="flex items-center gap-1.5"><Stars n={val} /><span className="text-xs text-gray-500">({p.review_count})</span></div>
        : <span className="text-gray-300">—</span>,
    },
    {
      label: 'Brand',
      key: 'brand',
      render: val => val ? <span className="text-sm text-gray-700">{val}</span> : <span className="text-gray-300">—</span>,
    },
    {
      label: 'SKU',
      key: 'sku',
      render: val => val ? <span className="text-xs font-mono text-gray-500">{val}</span> : <span className="text-gray-300">—</span>,
    },
    {
      label: 'Stock',
      key: 'stock',
      render: val => {
        if (val === 0) return <span className="text-red-500 text-sm font-medium flex items-center gap-1"><X size={13}/>Out of stock</span>
        return <span className="text-green-600 text-sm font-medium flex items-center gap-1"><Check size={13}/>{val > 10 ? 'In stock' : `Only ${val} left`}</span>
      },
    },
    {
      label: 'Description',
      key: 'description',
      render: val => val ? <p className="text-xs text-gray-500 leading-relaxed">{val}</p> : <span className="text-gray-300">—</span>,
    },
  ]

  // Find best price
  const minPrice = Math.min(...products.map(p => p.price))
  const maxRating = Math.max(...products.map(p => p.rating ?? 0))

  return (
    <div className="py-6 overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr>
            <th className="w-32 shrink-0" />
            {products.map(p => (
              <th key={p.id} className="pb-4 px-3 align-top text-left">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  {/* Image */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 mb-3">
                    {p.images?.[0]
                      ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="200px" />
                      : <div className="w-full h-full bg-gray-100" />
                    }
                  </div>
                  {/* Name */}
                  <Link href={`/shop/${p.slug}`}
                    className="text-sm font-semibold text-gray-800 leading-snug hover:text-red-500 transition-colors line-clamp-2 block mb-3">
                    {p.name}
                  </Link>
                  {/* Add to cart */}
                  <button onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: ACCENT }}>
                    <ShoppingCart size={12} />
                    Add to Cart
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.key} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
              {/* Row label */}
              <td className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-100">
                {row.label}
              </td>
              {/* Each product's value */}
              {products.map(p => {
                const val = p[row.key]
                const isBest =
                  (row.key === 'price'  && p.price === minPrice) ||
                  (row.key === 'rating' && p.rating === maxRating && maxRating > 0)
                return (
                  <td key={p.id} className="py-3.5 px-4 border-r border-gray-100 last:border-r-0 align-top">
                    {isBest && (
                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 mr-1"
                        style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                        ✓ Best
                      </span>
                    )}
                    {row.render ? row.render(val, p) : (
                      <span className="text-sm text-gray-700">{val ?? '—'}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ComparePage() {
  return (
    <>
      <Header />
      <PageBox>
        <div className="py-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Compare Products
            </h1>
            <Link href="/shop" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              ← Back to Shop
            </Link>
          </div>
          <Suspense fallback={<div className="py-12 text-center text-gray-400">Loading…</div>}>
            <CompareContent />
          </Suspense>
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
