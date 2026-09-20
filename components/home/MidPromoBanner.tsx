'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const DEFAULT_MID = [
  { id: 'm1', title: 'Premium Smart TV', subtitle: 'Just ₦129,999', link: '/shop', cta: 'Shop Now', image: null, bg_color: '#1a2638', accent: '#e84c3d' },
  { id: 'm2', title: 'Wireless Earbuds Pro', subtitle: 'Sale 25% off', link: '/shop?sale=true', cta: 'Shop Now', image: null, bg_color: '#0f3d2e', accent: '#22c55e' },
]

// Fallback accents per banner index when admin data doesn't include accent
const FALLBACK_ACCENTS = ['#e84c3d', '#22c55e']

export default function MidPromoBanner() {
  const [banners, setBanners] = useState<any[]>(DEFAULT_MID)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_banners')
      if (raw) {
        const all = JSON.parse(raw)
        const mid = all.filter((b: any) => b.type === 'mid_promo' && b.is_active)
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .slice(0, 2)
        if (mid.length) setBanners(mid)
      }
    } catch {}
  }, [])

  if (banners.length === 0) return null

  return (
    <section className="px-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {banners.map((b, i) => {
          const btnColor = b.accent ?? FALLBACK_ACCENTS[i] ?? '#e84c3d'
          return (
            <Link key={b.id ?? i} href={b.link ?? '/shop'}
              className="relative overflow-hidden rounded-lg group"
              style={{ minHeight: '130px', backgroundColor: b.bg_color ?? '#1a2638' }}>
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ backgroundColor: btnColor }} />

              {b.image && (
                <Image src={b.image} alt={b.title} fill className="object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300" sizes="(max-width:640px) 100vw, 50vw" />
              )}
              <div className="relative z-10 pl-8 pr-6 py-5 flex flex-col justify-center h-full">
                <p className="text-sm font-bold text-white mb-0.5">{b.title}</p>
                {b.subtitle && <p className="text-xs text-white/70 mb-3">{b.subtitle}</p>}
                <span className="inline-flex items-center px-4 py-1.5 rounded text-xs font-bold text-white w-fit transition-opacity hover:opacity-80"
                  style={{ backgroundColor: btnColor }}>
                  {b.cta ?? 'Shop Now'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
