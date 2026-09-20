'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Search, ArrowRight, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const ACCENT = '#e84c3d'

interface Result {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number
  images?: string[]
  category_id?: string
  brand?: string
}

interface Props {
  query: string
  onClose: () => void
  onNavigate: () => void
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export default function SearchDropdown({ query, onClose, onNavigate }: Props) {
  const router = useRouter()
  const [results, setResults]   = useState<Result[]>([])
  const [total,   setTotal]     = useState(0)
  const [loading, setLoading]   = useState(false)
  const [active,  setActive]    = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  const search = useCallback(
    debounce((q: string) => {
      if (!q.trim()) { setResults([]); setTotal(0); return }
      setLoading(true)
      try {
        const raw = localStorage.getItem('admin_products')
        const all: Result[] = raw ? JSON.parse(raw) : []
        const term = q.toLowerCase()
        const matched = all.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term)
        )
        setTotal(matched.length)
        setResults(matched.slice(0, 6))
      } catch {}
      setLoading(false)
    }, 220),
    []
  )

  useEffect(() => { search(query); setActive(-1) }, [query, search])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!results.length) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, -1)) }
      if (e.key === 'Enter' && active >= 0) {
        e.preventDefault()
        router.push(`/shop/${results[active].slug}`)
        onNavigate()
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, active, router, onClose, onNavigate])

  // Scroll active item into view
  useEffect(() => {
    if (active < 0 || !listRef.current) return
    const item = listRef.current.children[active] as HTMLElement
    item?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!query.trim()) return null

  return (
    <div
      className="absolute left-0 right-0 top-full z-[200] bg-white border border-gray-200 shadow-xl overflow-hidden"
      style={{ borderRadius: '0 0 8px 8px', marginTop: '2px' }}
    >
      {loading && (
        <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
          Searching…
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="px-4 py-5 text-center">
          <p className="text-sm text-gray-500">No results for <strong>"{query}"</strong></p>
          <p className="text-xs text-gray-400 mt-1">Try a different keyword or browse categories</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div ref={listRef}>
            {results.map((p, i) => (
              <a
                key={p.id}
                href={`/shop/${p.slug}`}
                onClick={onNavigate}
                className="flex items-center gap-3 px-4 py-3 transition-colors border-b border-gray-50 last:border-b-0"
                style={{ backgroundColor: i === active ? '#fef2f2' : '#fff', textDecoration: 'none' }}
                onMouseEnter={() => setActive(i)}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} width={48} height={48}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Search size={16} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {p.brand && (
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">{p.brand}</p>
                  )}
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold" style={{ color: ACCENT }}>{formatPrice(p.price)}</span>
                    {p.compare_price && p.compare_price > p.price && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(p.compare_price)}</span>
                    )}
                  </div>
                </div>

                <ArrowRight size={14} className="text-gray-300 shrink-0" />
              </a>
            ))}
          </div>

          {/* Footer */}
          <a
            href={`/shop?search=${encodeURIComponent(query)}`}
            onClick={onNavigate}
            className="flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#fafafa', borderTop: '1px solid #f3f4f6', color: ACCENT, textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fafafa')}
          >
            <span>View all {total} result{total !== 1 ? 's' : ''} for "<strong>{query}</strong>"</span>
            <ArrowRight size={14} />
          </a>
        </>
      )}
    </div>
  )
}
