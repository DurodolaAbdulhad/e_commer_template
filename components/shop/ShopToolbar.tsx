'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { openMobileFilters } from './MobileFilterDrawer'

const sortOptions = [
  { value: '',           label: 'Sort By Position' },
  { value: 'newest',    label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
]

const showOptions = [12, 24, 48]

interface Props {
  count: number
  sort: string
  show: string
  view: string
  title: string
}

export default function ShopToolbar({ count, sort, show, view, title }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    router.push(`/shop?${params}`)
  }

  const selectCls = "border border-gray-200 text-sm text-gray-600 px-3 py-1.5 rounded outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors"

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-200">
      {/* Left: count + title */}
      <div className="flex items-baseline gap-3">
        <span className="text-sm text-gray-500 font-medium">
          <strong className="text-gray-800">{count}</strong> Item{count !== 1 ? 's' : ''}
        </span>
        {title && (
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h1>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile filter button */}
        <button
          onClick={openMobileFilters}
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-600 hover:border-gray-400 transition-colors"
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
        {/* Sort */}
        <select value={sort} onChange={e => update('sort', e.target.value)} className={selectCls}>
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Show */}
        <select value={show || '12'} onChange={e => update('show', e.target.value)} className={selectCls}>
          {showOptions.map(n => <option key={n} value={String(n)}>Show {n}</option>)}
        </select>

        {/* Grid / List toggle */}
        <div className="flex items-center border border-gray-200 rounded overflow-hidden">
          <button
            onClick={() => update('view', 'grid')}
            className="px-2.5 py-1.5 transition-colors"
            style={{ backgroundColor: view !== 'list' ? '#e84c3d' : '#fff', color: view !== 'list' ? '#fff' : '#9ca3af' }}
            title="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => update('view', 'list')}
            className="px-2.5 py-1.5 border-l border-gray-200 transition-colors"
            style={{ backgroundColor: view === 'list' ? '#e84c3d' : '#fff', color: view === 'list' ? '#fff' : '#9ca3af' }}
            title="List view"
          >
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
