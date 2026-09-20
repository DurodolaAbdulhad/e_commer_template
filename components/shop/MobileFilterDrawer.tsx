'use client'

import { useEffect, useState } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import ShopSidebar from './ShopSidebar'

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
}

// Global event bridge — toolbar button fires this; drawer listens
const EVENT = 'open-shop-filters'

export function openMobileFilters() {
  document.dispatchEvent(new CustomEvent(EVENT))
}

export default function MobileFilterDrawer(props: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener(EVENT, handler)
    return () => document.removeEventListener(EVENT, handler)
  }, [])

  // Close on route change (any filter link click inside will navigate)
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {}, 0)
    return () => clearTimeout(timer)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] md:hidden flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray-600" />
            <span className="text-sm font-bold text-gray-800">Filters</span>
          </div>
          <button onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Sidebar content — reuse desktop sidebar, force show */}
        <div className="flex-1 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="block">
            <ShopSidebar {...props} forceMobile />
          </div>
        </div>
      </div>
    </div>
  )
}
