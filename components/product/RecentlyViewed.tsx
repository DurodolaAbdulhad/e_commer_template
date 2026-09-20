'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, getDiscount } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ACCENT = '#e84c3d'

export default function RecentlyViewed({ currentId }: { currentId: string }) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('recently_viewed')
      const all: any[] = raw ? JSON.parse(raw) : []
      setItems(all.filter(p => p.id !== currentId).slice(0, 8))
    } catch {}
  }, [currentId])

  if (items.length === 0) return null

  return (
    <section className="mt-8 border-t border-gray-100 pt-6">
      <h2 className="text-base font-bold text-gray-800 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Recently Viewed Products
      </h2>
      <div className="border border-gray-100 rounded-lg p-4 overflow-x-auto">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {items.map((p: any) => {
            const discount = getDiscount(p.price, p.compare_price)
            return (
              <Link key={p.id} href={`/shop/${p.slug}`}
                className="w-40 shrink-0 group">
                <div className="relative aspect-square bg-gray-50 border border-gray-100 rounded overflow-hidden mb-2">
                  {discount && (
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded z-10"
                      style={{ backgroundColor: ACCENT }}>-{discount}%</span>
                  )}
                  {p.images?.[0]
                    ? <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="160px" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-200">{p.name?.charAt(0)}</div>
                  }
                </div>
                <p className="text-xs font-medium line-clamp-2 leading-snug group-hover:text-[#e84c3d] transition-colors" style={{ color: '#333' }}>
                  {p.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {p.compare_price && p.compare_price > p.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      {formatPrice(p.compare_price)}
                    </span>
                  )}
                  <span className="text-xs font-bold" style={{ color: ACCENT }}>{formatPrice(p.price)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
