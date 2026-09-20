'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, TrendingUp, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice, getDiscount } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

function Card({ product, label, onAdd }: { product: any; label?: string; onAdd: () => void }) {
  const discount = getDiscount(product.price, product.compare_price)
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-all group">
      {/* Image */}
      <Link href={`/shop/${product.slug}`} className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-50">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="56px" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
        {discount && (
          <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-extrabold text-white py-0.5"
            style={{ backgroundColor: ACCENT }}>
            -{discount}%
          </span>
        )}
      </Link>
      {/* Info */}
      <div className="flex-1 min-w-0">
        {label && (
          <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5 block" style={{ color: ACCENT }}>
            {label}
          </span>
        )}
        <Link href={`/shop/${product.slug}`}>
          <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
            {product.name}
          </p>
        </Link>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-extrabold" style={{ color: ACCENT }}>{formatPrice(product.price)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-[11px] text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
          )}
        </div>
      </div>
      {/* Add button */}
      <button
        onClick={onAdd}
        disabled={product.stock === 0}
        title="Add to cart"
        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: ACCENT }}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

export default function CheckoutRecommendations() {
  const { items, dispatch } = useCart()
  const [upsells, setUpsells]     = useState<any[]>([])
  const [crossSells, setCrossSells] = useState<any[]>([])

  useEffect(() => {
    if (!items.length) return
    try {
      const raw = localStorage.getItem('admin_products')
      const all: any[] = raw ? JSON.parse(raw) : []
      const active = all.filter(p => p.is_active !== false)

      const cartIds  = new Set(items.map(i => i.id))
      const cartCats = new Set(items.map(i => i.category).filter(Boolean))
      const maxPrice = Math.max(...items.map(i => i.price))

      // Upsell: same category, higher price, not already in cart
      const ups = active
        .filter(p => !cartIds.has(p.id) && cartCats.has(p.category) && p.price > maxPrice)
        .sort((a, b) => a.price - b.price)
        .slice(0, 2)

      // Cross-sell: different category, not in cart
      const cross = active
        .filter(p => !cartIds.has(p.id) && !cartCats.has(p.category))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)

      // If no category-matched upsells, show higher-priced items from any category
      if (!ups.length) {
        const fallbackUps = active
          .filter(p => !cartIds.has(p.id) && p.price > maxPrice)
          .sort((a, b) => a.price - b.price)
          .slice(0, 2)
        setUpsells(fallbackUps)
      } else {
        setUpsells(ups)
      }

      setCrossSells(cross)
    } catch {}
  }, [items])

  function addItem(p: any, type: 'upsell' | 'cross-sell') {
    dispatch({ type: 'ADD_ITEM', item: { ...p, quantity: 1 } })
    toast.success(`${p.name} added to cart`)
  }

  if (!upsells.length && !crossSells.length) return null

  return (
    <div className="space-y-5">
      {/* Upsells */}
      {upsells.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: ACCENT }} />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Upgrade Your Order</span>
          </div>
          <div className="space-y-2.5">
            {upsells.map(p => (
              <Card key={p.id} product={p} label="Upgrade" onAdd={() => addItem(p, 'upsell')} />
            ))}
          </div>
        </div>
      )}

      {/* Cross-sells */}
      {crossSells.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={14} style={{ color: ACCENT }} />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Customers Also Bought</span>
          </div>
          <div className="space-y-2.5">
            {crossSells.map(p => (
              <Card key={p.id} product={p} onAdd={() => addItem(p, 'cross-sell')} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
