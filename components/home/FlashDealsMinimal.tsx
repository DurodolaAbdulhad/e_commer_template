'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, ShoppingCart, ChevronRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice, getDiscount } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const FALLBACK = [
  { id: 'f1', name: 'Wireless Bluetooth Headphones', slug: 'wireless-bluetooth-headphones', price: 25000, compare_price: 35000, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'] },
  { id: 'f2', name: "Men's Classic Polo Shirt",      slug: 'mens-classic-polo-shirt',       price: 8500,  compare_price: 12000, images: ['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=300'] },
  { id: 'f3', name: 'Smart LED Desk Lamp',           slug: 'smart-led-desk-lamp',           price: 12000, compare_price: 15000, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'] },
  { id: 'f4', name: 'Classic Chronograph Watch',     slug: 'classic-chronograph-watch',     price: 45000, compare_price: 60000, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'] },
  { id: 'f5', name: 'Vitamin C Serum 30ml',          slug: 'vitamin-c-serum-30ml',          price: 5000,  compare_price: 6500,  images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300'] },
  { id: 'f6', name: 'Premium Yoga Mat 6mm',          slug: 'yoga-mat-premium-6mm',          price: 9500,  compare_price: 13000, images: ['https://images.unsplash.com/photo-1601925228847-c0b1b9ac8a1b?w=300'] },
]

export default function FlashDealsMinimal() {
  const { dispatch } = useCart()
  const [deals, setDeals] = useState<any[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_products')
      const all: any[] = raw ? JSON.parse(raw) : []
      const flash = all.filter(p => p.is_flash_deal && p.is_active)
      setDeals(flash.length ? flash : FALLBACK)
    } catch {
      setDeals(FALLBACK)
    }
  }, [])

  if (!deals.length) return null

  function addToCart(e: React.MouseEvent, p: any) {
    e.preventDefault()
    dispatch({ type: 'ADD_ITEM', item: { ...p, quantity: 1 } })
    toast.success(`${p.name} added to cart`)
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-white fill-white rounded p-0.5" style={{ backgroundColor: ACCENT }} />
          <span className="text-sm font-bold text-gray-800">Flash Deals</span>
          <span className="text-xs text-gray-400 font-normal">· while stocks last</span>
        </div>
        <Link href="/shop?sale=true"
          className="text-xs font-semibold flex items-center gap-0.5 hover:underline"
          style={{ color: ACCENT }}>
          View all <ChevronRight size={11} />
        </Link>
      </div>

      {/* Horizontal scrollable chips */}
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {deals.map(p => {
          const discount = getDiscount(p.price, p.compare_price)
          return (
            <Link key={p.id} href={`/shop/${p.slug}`}
              className="group flex items-center gap-3 shrink-0 bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:shadow-sm hover:border-gray-200 transition-all"
              style={{ minWidth: '220px', maxWidth: '260px' }}>
              {/* Thumb */}
              <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {p.images?.[0] && (
                  <Image src={p.images[0]} alt={p.name} fill unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="48px" />
                )}
                {discount && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-extrabold text-white leading-tight py-0.5"
                    style={{ backgroundColor: ACCENT }}>
                    -{discount}%
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 line-clamp-1 group-hover:text-red-500 transition-colors">
                  {p.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-extrabold" style={{ color: ACCENT }}>{formatPrice(p.price)}</span>
                  {p.compare_price && p.compare_price > p.price && (
                    <span className="text-[11px] text-gray-400 line-through">{formatPrice(p.compare_price)}</span>
                  )}
                </div>
              </div>
              {/* Cart icon */}
              <button
                onClick={e => addToCart(e, p)}
                className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: ACCENT }}
                title="Add to cart">
                <ShoppingCart size={12} />
              </button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
