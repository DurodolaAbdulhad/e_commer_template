'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice, getDiscount } from '@/lib/utils'

const ACCENT = '#e84c3d'
const STAR_FILLED = '#F5A623'
const STAR_EMPTY = '#e5e7eb'

function Stars({ rating = 0, count = 0 }: { rating?: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={s <= Math.round(rating) ? STAR_FILLED : STAR_EMPTY}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      {count > 0 && <span className="text-[10px] text-gray-400">{count}</span>}
    </div>
  )
}

export default function RelatedCarousel({ products, title }: { products: any[]; title: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!products.length) return null

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' })
  }

  return (
    <section className="mt-8">
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <h2 className="text-sm font-bold text-gray-800 text-center py-3 border-b border-gray-200"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>
          {title}
        </h2>
        <div className="relative px-4 py-4">
          {/* Prev */}
          <button onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors">
            <ChevronLeft size={15} className="text-gray-500" />
          </button>

          {/* Scroll container */}
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {products.map((p: any) => {
              const discount = getDiscount(p.price, p.compare_price)
              return (
                <Link key={p.id} href={`/shop/${p.slug}`}
                  className="shrink-0 group" style={{ width: '160px' }}>
                  <div className="relative bg-white border border-gray-100 rounded overflow-hidden mb-2" style={{ aspectRatio: '1/1' }}>
                    {discount && (
                      <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-white px-1 py-0.5 rounded z-10"
                        style={{ backgroundColor: ACCENT }}>-{discount}%</span>
                    )}
                    {p.images?.[0]
                      ? <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="160px" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-200">{p.name?.charAt(0)}</div>
                    }
                  </div>
                  <p className="text-xs leading-snug line-clamp-2 mb-1 transition-colors group-hover:text-[#e84c3d]" style={{ color: '#2563eb' }}>
                    {p.name}
                  </p>
                  <Stars rating={p.rating} count={p.review_count} />
                  <div className="flex items-center gap-1.5 mt-1">
                    {p.compare_price && p.compare_price > p.price && (
                      <span className="text-[10px] text-gray-400 line-through">{formatPrice(p.compare_price)}</span>
                    )}
                    <span className="text-xs font-bold" style={{ color: ACCENT }}>{formatPrice(p.price)}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Next */}
          <button onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors">
            <ChevronRight size={15} className="text-gray-500" />
          </button>
        </div>
      </div>
    </section>
  )
}
