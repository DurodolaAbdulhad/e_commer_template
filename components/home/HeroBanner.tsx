'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { client } from '@/config/client'
import { industries } from '@/config/industries'

const ACCENT = '#e84c3d'
const GREEN  = '#4CAF50'

// Fallback slides — used when no admin banners are configured
const DEFAULT_SLIDES = [
  { id: 'd1', title: 'Big Deals. Real Savings.', subtitle: 'Limited Time Offer', discount: 'Up to 40% Off', link: '/shop?sale=true', cta: 'Shop Now', bg_color: '#EEF2FF', image: null },
  { id: 'd2', title: 'New Arrivals Just Dropped', subtitle: 'Fresh Collection 2026', discount: 'From ₦5,000', link: '/shop?sort=newest', cta: 'Explore Now', bg_color: '#F0FDF4', image: null },
]
const DEFAULT_SIDE = [
  { id: 's1', title: 'Top Deals Today', subtitle: 'Limited stock available', price: '', link: '/shop?sale=true', image: null },
  { id: 's2', title: 'Free Delivery', subtitle: 'On orders over ₦50,000', price: '', link: '/shop', image: null },
]

export default function HeroBanner() {
  const preset = industries[client.industry as keyof typeof industries] ?? industries.general
  const [slides,   setSlides]   = useState<any[]>(DEFAULT_SLIDES)
  const [sideBnrs, setSideBnrs] = useState<any[]>(DEFAULT_SIDE)
  const [current,  setCurrent]  = useState(0)

  useEffect(() => {
    // Load from admin banners (localStorage in demo, Supabase otherwise)
    try {
      const raw = localStorage.getItem('admin_banners')
      if (raw) {
        const all = JSON.parse(raw)
        const heroSlides = all.filter((b: any) => b.type === 'hero_slide' && b.is_active).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        const heroSide   = all.filter((b: any) => b.type === 'hero_side'  && b.is_active).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        if (heroSlides.length) setSlides(heroSlides)
        if (heroSide.length)   setSideBnrs(heroSide.slice(0, 2))
      }
    } catch {}
  }, [])

  // Auto-advance
  const next = useCallback(() => setCurrent(i => (i + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent(i => (i - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(next, 4500)
    return () => clearInterval(t)
  }, [next, slides.length])

  const slide = slides[current] ?? DEFAULT_SLIDES[0]

  return (
    <section className="w-full" style={{ backgroundColor: '#fff' }}>
      <div className="flex" style={{ minHeight: 'min(260px, 60vw)' }}>

        {/* ── LEFT: Main hero slider (70%) ── */}
        <div className="relative overflow-hidden flex-1" style={{ backgroundColor: slide.bg_color ?? '#f9f6f0' }}>
          {/* Background image */}
          {slide.image && (
            <Image src={slide.image} alt={slide.title} fill className="object-cover" sizes="70vw" priority />
          )}
          {/* Gradient overlay on images */}
          {slide.image && (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 55%, transparent 100%)' }} />
          )}
          {/* Static gradient (no image) — uses slide bg_color for a clean, bright look */}
          {!slide.image && (
            <div className="absolute inset-0" style={{ background: slide.bg_color ?? '#EEF2FF' }} />
          )}

          {/* Content — pl-12 ensures text clears the 40px prev-arrow on mobile */}
          <div className="relative flex flex-col justify-center h-full pl-12 pr-6 py-6 sm:px-8 sm:py-8 min-h-[260px] sm:min-h-[320px]">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: ACCENT }}>
              {slide.subtitle || 'Weekend Promotions'}
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-2 text-gray-800 max-w-sm" style={{ fontFamily: 'var(--font-heading)' }}>
              {slide.title || preset.heroTagline}
            </h2>
            {slide.discount && (
              <p className="text-xl font-bold mb-5" style={{ color: GREEN }}>{slide.discount}</p>
            )}
            <Link href={slide.link ?? '/shop'}
              className="inline-flex items-center px-6 py-2 rounded text-white text-sm font-bold transition-opacity hover:opacity-90 w-fit"
              style={{ backgroundColor: ACCENT }}>
              {slide.cta ?? 'Shop Now'}
            </Link>
          </div>

          {/* Prev / Next arrows — only show when there's somewhere to go */}
          {slides.length > 1 && current > 0 && (
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors z-10">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
          )}
          {slides.length > 1 && current < slides.length - 1 && (
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors z-10">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          )}

          {/* Dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className="transition-all rounded-full"
                  style={{
                    width: i === current ? '20px' : '8px',
                    height: '8px',
                    backgroundColor: i === current ? ACCENT : 'rgba(0,0,0,0.2)',
                  }} />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Side promo banners (30%) — hidden on mobile ── */}
        <div className="hidden md:flex flex-col" style={{ width: '280px', flexShrink: 0 }}>
          {sideBnrs.map((b, i) => (
            <Link key={b.id ?? i} href={b.link ?? '/shop'}
              className="relative flex-1 overflow-hidden group"
              style={{
                borderLeft: '1px solid #e5e7eb',
                borderBottom: i < sideBnrs.length - 1 ? '1px solid #e5e7eb' : 'none',
                backgroundColor: '#f8f8f8',
              }}>
              {b.image && (
                <>
                  <Image src={b.image} alt={b.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="280px" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 60%, transparent 100%)' }} />
                </>
              )}
              <div className="relative p-4 h-full flex flex-col justify-center">
                <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">{b.subtitle}</p>
                <p className="text-sm font-bold text-gray-800 leading-snug mb-1">{b.title}</p>
                {b.price && <p className="text-base font-extrabold" style={{ color: ACCENT }}>{b.price}</p>}
                <span className="text-xs font-semibold mt-2 hover:underline" style={{ color: ACCENT }}>
                  {b.cta ?? 'Shop Now'} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
