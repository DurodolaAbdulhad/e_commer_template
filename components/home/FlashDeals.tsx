'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ShoppingCart, Zap } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice, getDiscount } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const STAR_F = '#F5A623'

function Stars({ n = 0 }: { n?: number }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={s <= Math.round(n) ? STAR_F : '#e5e7eb'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function pad(n: number) { return String(n).padStart(2, '0') }

function Countdown({ endTime }: { endTime: string }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, expired: false })

  useEffect(() => {
    function tick() {
      const diff = new Date(endTime).getTime() - Date.now()
      if (diff <= 0) { setTime({ h: 0, m: 0, s: 0, expired: true }); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime({ h, m, s, expired: false })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endTime])

  if (time.expired) return <span className="text-xs text-red-300 font-medium">Deal ended</span>

  const unit = (val: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="text-lg font-extrabold leading-none bg-black/30 text-white rounded px-2 py-1 min-w-[38px] text-center tabular-nums">
        {pad(val)}
      </span>
      <span className="text-[9px] text-white/50 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  )

  return (
    <div className="flex items-end gap-1.5">
      {unit(time.h, 'Hrs')}
      <span className="text-white/60 text-xl font-bold mb-4 leading-none">:</span>
      {unit(time.m, 'Min')}
      <span className="text-white/60 text-xl font-bold mb-4 leading-none">:</span>
      {unit(time.s, 'Sec')}
    </div>
  )
}

export default function FlashDeals() {
  const { dispatch } = useCart()
  const scrollRef    = useRef<HTMLDivElement>(null)
  const [deals, setDeals]   = useState<any[]>([])
  const [endTime, setEndTime] = useState<string>('')
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_products')
      const all: any[] = raw ? JSON.parse(raw) : []
      const flash = all.filter(p => p.is_flash_deal && p.is_active)
      if (flash.length) {
        setDeals(flash)
        const times = flash.filter(p => p.flash_deal_end).map(p => new Date(p.flash_deal_end).getTime())
        if (times.length) setEndTime(new Date(Math.min(...times)).toISOString())
      } else {
        // Inline fallback — same image repeated so slides are visible in demo
        const IMG = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'
        setDeals([
          { id: 'f1', name: 'Wireless Bluetooth Headphones', slug: 'wireless-bluetooth-headphones', price: 25000, compare_price: 35000, images: [IMG], rating: 4.5, review_count: 128, stock: 12 },
          { id: 'f2', name: "Men's Classic Polo Shirt",      slug: 'mens-classic-polo-shirt',       price: 8500,  compare_price: 12000, images: [IMG], rating: 4.2, review_count: 54,  stock: 120 },
          { id: 'f3', name: 'Smart LED Desk Lamp',           slug: 'smart-led-desk-lamp',           price: 12000, compare_price: 15000, images: [IMG], rating: 4.7, review_count: 89,  stock: 5 },
          { id: 'f4', name: 'Classic Chronograph Watch',     slug: 'classic-chronograph-watch',     price: 45000, compare_price: 60000, images: [IMG], rating: 4.6, review_count: 203, stock: 8 },
          { id: 'f5', name: 'Vitamin C Serum 30ml',          slug: 'vitamin-c-serum-30ml',          price: 5000,  compare_price: 6500,  images: [IMG], rating: 4.8, review_count: 312, stock: 3 },
          { id: 'f6', name: 'Premium Yoga Mat 6mm',          slug: 'yoga-mat-premium-6mm',          price: 9500,  compare_price: 13000, images: [IMG], rating: 4.3, review_count: 67,  stock: 18 },
        ])
        const end = new Date(); end.setHours(end.getHours() + 8)
        setEndTime(end.toISOString())
      }
    } catch {}
  }, [])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector('[data-card]') as HTMLElement
    const step = card ? card.offsetWidth + 16 : 220
    el.scrollBy({ left: dir === 'left' ? -step * 3 : step * 3, behavior: 'smooth' })
  }

  function addToCart(p: any) {
    dispatch({ type: 'ADD_ITEM', item: { ...p, quantity: 1 } })
    toast.success(`${p.name} added to cart`)
  }

  if (!deals.length || !endTime) return null

  return (
    <section className="py-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-t-xl"
        style={{ backgroundColor: '#1a2638' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: ACCENT }}>
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white leading-none tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}>Flash Deals</h2>
            <p className="text-[11px] text-white/40 mt-0.5 uppercase tracking-widest">Limited time · while stocks last</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Countdown endTime={endTime} />
          <Link href="/shop?sale=true"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
            View All <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── Carousel ── */}
      <div className="relative border border-t-0 border-gray-200 rounded-b-xl bg-white">
        {/* Arrow left */}
        <button
          onClick={() => scroll('left')}
          disabled={!canLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center transition-all disabled:opacity-0"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>

        {/* Arrow right */}
        <button
          onClick={() => scroll('right')}
          disabled={!canRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center transition-all disabled:opacity-0"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto gap-px py-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {deals.map((p: any, idx: number) => {
            const discount = getDiscount(p.price, p.compare_price)
            const isLow    = typeof p.stock === 'number' && p.stock <= 10
            const soldPct  = isLow ? Math.max(30, 100 - Math.round((p.stock / 20) * 100)) : 65
            const isFirst  = idx === 0
            const isLast   = idx === deals.length - 1

            return (
              <div
                key={p.id}
                data-card
                className="shrink-0 flex flex-col group border-r border-gray-100 last:border-r-0"
                style={{ width: 'clamp(160px, 18vw, 220px)', padding: '16px 14px' }}
              >
                {/* Image */}
                <div className="relative bg-gray-50 rounded-lg overflow-hidden mb-3"
                  style={{ aspectRatio: '1/1' }}>
                  {discount && (
                    <span className="absolute top-2 left-2 z-10 text-[11px] font-extrabold text-white px-2 py-0.5 rounded"
                      style={{ backgroundColor: ACCENT }}>-{discount}%</span>
                  )}
                  {p.images?.[0] ? (
                    <Link href={`/shop/${p.slug}`} tabIndex={-1} className="absolute inset-0">
                      <Image src={p.images[0]} alt={p.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:768px) 50vw, 220px" />
                    </Link>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <ShoppingCart size={36} />
                    </div>
                  )}
                </div>

                {/* Name */}
                <Link href={`/shop/${p.slug}`}
                  className="text-[13px] font-medium text-gray-700 line-clamp-2 leading-snug mb-2 hover:text-red-500 transition-colors">
                  {p.name}
                </Link>

                {/* Stars */}
                {p.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <Stars n={p.rating} />
                    <span className="text-[11px] text-gray-400">({p.review_count})</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2.5">
                  <span className="text-[15px] font-extrabold" style={{ color: ACCENT }}>{formatPrice(p.price)}</span>
                  {p.compare_price && p.compare_price > p.price && (
                    <span className="text-[12px] text-gray-400 line-through">{formatPrice(p.compare_price)}</span>
                  )}
                </div>

                {/* Stock bar */}
                {isLow && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                      <span>Only <strong>{p.stock}</strong> left</span>
                      <span className="font-medium">{soldPct}% sold</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${soldPct}%`, backgroundColor: soldPct > 75 ? ACCENT : '#F5A623' }} />
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  className="mt-auto w-full py-2 text-[12px] font-bold rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: ACCENT, color: '#fff' }}>
                  {p.stock === 0 ? 'Sold Out' : 'Add To Cart'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
