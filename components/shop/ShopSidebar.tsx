'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronDown, ChevronRight,
  Laptop, ShoppingBag, Shirt, Apple, Sparkles, Dumbbell, BookOpen, Home, Package, Layers,
} from 'lucide-react'
import { client } from '@/config/client'
import { industries } from '@/config/industries'
import { getCollections } from '@/lib/admin-db'

const ACCENT = '#e84c3d'

const categoryIcons: Record<string, React.ReactNode> = {
  electronics: <Laptop size={14} />,  fashion: <Shirt size={14} />,
  clothing:    <Shirt size={14} />,   grocery: <Apple size={14} />,
  food:        <Apple size={14} />,   beauty:  <Sparkles size={14} />,
  sports:      <Dumbbell size={14} />, furniture: <Home size={14} />,
  books:       <BookOpen size={14} />, office:  <BookOpen size={14} />,
  home:        <Home size={14} />,
}

const categoryBadges: Record<string, { label: string; color: string }> = {
  'New Arrivals': { label: 'NEW',      color: '#2563eb' },
  'Sale':         { label: 'SALE',     color: '#dc2626' },
  'Best Sellers': { label: 'HOT',      color: '#dc2626' },
  'Trending':     { label: 'TRENDING', color: '#6b7280' },
}

interface Props {
  categories:      any[]
  activeCategory?: string
  activeMin?:      string
  activeMax?:      string
  activeFeatured?: string
  activeSale?:     string
  activeRating?:   string
  activeBrand?:    string
  activeColor?:    string
  activeSize?:     string
  forceMobile?:    boolean
}

export default function ShopSidebar({
  categories, activeCategory, activeMin, activeMax,
  activeFeatured, activeSale, activeRating, activeBrand, activeColor, activeSize,
  forceMobile,
}: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const preset       = industries[client.industry as keyof typeof industries] ?? industries.general

  const [collections, setCollections] = useState<any[]>([])
  const [minPrice, setMinPrice] = useState(activeMin ?? '')
  const [maxPrice, setMaxPrice] = useState(activeMax ?? '')
  const [open, setOpen] = useState<Record<string, boolean>>({
    categories: true, collections: true, price: true, manufacturer: true, color: true,
    size: false, style: false, pattern: false, rating: true,
  })

  useEffect(() => {
    getCollections().then((c: any[]) => setCollections(c.filter(x => x.is_active !== false))).catch(() => {})
  }, [])

  function toggle(k: string) { setOpen(prev => ({ ...prev, [k]: !prev[k] })) }

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const current: Record<string, string | undefined> = {
      category: activeCategory, sort: searchParams.get('sort') ?? undefined,
      min: activeMin, max: activeMax, featured: activeFeatured,
      sale: activeSale, rating: activeRating, brand: activeBrand,
      color: activeColor, size: activeSize, ...overrides,
    }
    Object.entries(current).forEach(([k, v]) => { if (v) params.set(k, v) })
    return `/shop?${params}`
  }

  function applyPrice() {
    const params = new URLSearchParams(searchParams.toString())
    if (minPrice) params.set('min', minPrice); else params.delete('min')
    if (maxPrice) params.set('max', maxPrice); else params.delete('max')
    params.delete('page')
    router.push(`/shop?${params}`)
  }

  function getCategoryIcon(name: string) {
    return categoryIcons[name.toLowerCase().split(' ')[0]] ?? <Package size={14} />
  }

  const SectionHeader = ({ label, k }: { label: string; k: string }) => (
    <button onClick={() => toggle(k)}
      className="flex items-center justify-between w-full py-2.5 border-b border-gray-200 mb-3">
      <span className="text-xs font-bold text-gray-800 uppercase tracking-widest">{label}</span>
      <ChevronDown size={14} className="text-gray-400 transition-transform"
        style={{ transform: open[k] ? 'rotate(180deg)' : 'none' }} />
    </button>
  )

  return (
    <aside className={forceMobile ? 'block w-full' : 'hidden md:block w-56 shrink-0'}>
      <div className={forceMobile ? 'space-y-1 px-4 py-2' : 'sticky top-24 space-y-1 max-h-[calc(100vh-100px)] overflow-y-auto pr-1'}>

        {/* ── CATEGORIES ── */}
        <div className="mb-4">
          <SectionHeader label="Categories" k="categories" />
          {open.categories && (
            <ul className="space-y-0.5">
              <li>
                <Link href="/shop"
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors"
                  style={{ color: !activeCategory ? ACCENT : '#555', fontWeight: !activeCategory ? 600 : 400 }}>
                  <Package size={14} className="text-gray-400 shrink-0" />
                  All Products
                </Link>
              </li>
              {categories.map((cat: any) => {
                const isActive = activeCategory === cat.slug
                const badge = Object.entries(categoryBadges).find(([k]) =>
                  cat.name.toLowerCase().includes(k.toLowerCase())
                )
                return (
                  <li key={cat.id}>
                    <Link href={buildHref({ category: cat.slug })}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors group"
                      style={{ color: isActive ? ACCENT : '#555', fontWeight: isActive ? 600 : 400 }}>
                      <span className="text-gray-400 shrink-0">{getCategoryIcon(cat.name)}</span>
                      <span className="flex-1 group-hover:text-gray-800">{cat.name}</span>
                      {badge && (
                        <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-sm"
                          style={{ backgroundColor: badge[1].color }}>{badge[1].label}</span>
                      )}
                      {!isActive && <ChevronRight size={10} className="text-gray-300" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── COLLECTIONS ── */}
        {collections.length > 0 && (
          <div className="mb-4">
            <SectionHeader label="Collections" k="collections" />
            {open.collections && (
              <ul className="space-y-0.5">
                {collections.map((col: any) => (
                  <li key={col.id}>
                    <Link href={`/shop/collections/${col.slug || col.id}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors group"
                      style={{ color: '#555' }}>
                      <Layers size={13} className="text-gray-400 shrink-0" />
                      <span className="flex-1 group-hover:text-gray-800">{col.name}</span>
                      <ChevronRight size={10} className="text-gray-300" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/shop/collections"
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ color: ACCENT }}>
                    View all collections →
                  </Link>
                </li>
              </ul>
            )}
          </div>
        )}

        {/* ── SHOP BY ── */}
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Shop By</p>

          {/* PRICE */}
          <div>
            <SectionHeader label="Price" k="price" />
            {open.price && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 uppercase">Min</label>
                    <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-gray-400" />
                  </div>
                  <span className="text-gray-300 mt-4">—</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 uppercase">Max</label>
                    <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                      placeholder="Any"
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-gray-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); router.push(buildHref({ min: undefined, max: undefined })) }}
                    className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                  <button onClick={applyPrice}
                    className="px-4 py-1.5 text-xs font-bold text-white rounded"
                    style={{ backgroundColor: ACCENT }}>OK</button>
                </div>
              </div>
            )}
          </div>

          {/* MANUFACTURER / BRAND */}
          <div>
            <SectionHeader label="Manufacturer" k="manufacturer" />
            {open.manufacturer && (
              <div className="space-y-1.5">
                {preset.brands?.map((brand: string) => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox"
                      className="rounded border-gray-300"
                      style={{ accentColor: ACCENT }}
                      checked={activeBrand === brand}
                      onChange={() => router.push(buildHref({ brand: activeBrand === brand ? undefined : brand }))}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 flex-1">{brand}</span>
                  </label>
                ))}
                {activeBrand && (
                  <button onClick={() => router.push(buildHref({ brand: undefined }))}
                    className="text-xs mt-1 hover:underline" style={{ color: ACCENT }}>
                    Clear brand
                  </button>
                )}
              </div>
            )}
          </div>

          {/* COLOR */}
          <div>
            <SectionHeader label="Color" k="color" />
            {open.color && (
              <div className="flex flex-wrap gap-2">
                {preset.productColors?.map((hex: string) => (
                  <button key={hex} onClick={() => router.push(buildHref({ color: activeColor === hex ? undefined : hex }))}
                    title={hex}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: hex,
                      border: activeColor === hex ? `2px solid ${ACCENT}` : '2px solid transparent',
                      outline: '1px solid #d1d5db',
                      outlineOffset: activeColor === hex ? '2px' : '1px',
                    }} />
                ))}
                {activeColor && (
                  <button onClick={() => router.push(buildHref({ color: undefined }))}
                    className="text-xs hover:underline w-full mt-1" style={{ color: ACCENT }}>
                    Clear color
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SIZE */}
          <div>
            <SectionHeader label="Size" k="size" />
            {open.size && (
              <div className="flex flex-wrap gap-1.5">
                {preset.sizes?.map((sz: string) => (
                  <button key={sz}
                    onClick={() => router.push(buildHref({ size: activeSize === sz ? undefined : sz }))}
                    className="px-2.5 py-1 text-xs rounded border transition-colors"
                    style={{
                      backgroundColor: activeSize === sz ? ACCENT : '#fff',
                      borderColor:     activeSize === sz ? ACCENT : '#e5e7eb',
                      color:           activeSize === sz ? '#fff' : '#555',
                      fontWeight:      activeSize === sz ? 600 : 400,
                    }}>
                    {sz}
                  </button>
                ))}
                {activeSize && (
                  <button onClick={() => router.push(buildHref({ size: undefined }))}
                    className="text-xs hover:underline w-full mt-1" style={{ color: ACCENT }}>
                    Clear size
                  </button>
                )}
              </div>
            )}
          </div>

          {/* STYLE */}
          <div>
            <SectionHeader label="Style" k="style" />
            {open.style && (
              <div className="space-y-1.5">
                {preset.styles?.map((s: string) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="rounded border-gray-300" style={{ accentColor: ACCENT }}
                      checked={searchParams.get('style') === s}
                      onChange={() => {
                        const params = new URLSearchParams(searchParams.toString())
                        searchParams.get('style') === s ? params.delete('style') : params.set('style', s)
                        router.push(`/shop?${params}`)
                      }} />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800">{s}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* PATTERN */}
          <div>
            <SectionHeader label="Pattern" k="pattern" />
            {open.pattern && (
              <div className="space-y-1.5">
                {preset.patterns?.map((p: string) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="rounded border-gray-300" style={{ accentColor: ACCENT }}
                      checked={searchParams.get('pattern') === p}
                      onChange={() => {
                        const params = new URLSearchParams(searchParams.toString())
                        searchParams.get('pattern') === p ? params.delete('pattern') : params.set('pattern', p)
                        router.push(`/shop?${params}`)
                      }} />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800">{p}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* RATING */}
          <div>
            <SectionHeader label="Rating" k="rating" />
            {open.rating && (
              <div className="space-y-2">
                {[5,4,3,2,1].map(r => (
                  <button key={r}
                    onClick={() => router.push(buildHref({ rating: r === Number(activeRating) ? undefined : String(r) }))}
                    className="flex items-center gap-1.5 w-full group">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= r ? '#F5A623' : '#e5e7eb'}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 group-hover:text-gray-700">& up</span>
                    {activeRating === String(r) && <span className="ml-auto text-[10px]" style={{ color: ACCENT }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
