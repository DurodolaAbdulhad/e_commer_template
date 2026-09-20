'use client'

import { usePathname } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'

const ACCENT = '#e84c3d'

const PAGE_TITLES: Record<string, string> = {
  '/admin':               'Dashboard',
  '/admin/products':      'Products',
  '/admin/products/new':  'Add New Product',
  '/admin/orders':        'Orders',
  '/admin/categories':    'Categories',
  '/admin/banners':       'Banners',
  '/admin/subscribers':   'Subscribers',
  '/admin/settings':      'Settings',
}

export default function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const { admin } = useAdmin()

  const title = Object.entries(PAGE_TITLES)
    .reverse() // match most-specific first
    .find(([path]) => pathname === path || pathname.startsWith(path + '/'))?.[1]
    ?? 'Admin'

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 sticky top-0 z-30">
      <button className="md:hidden text-gray-500" onClick={onMenuClick}>
        <Menu size={20} />
      </button>
      <h1 className="text-sm font-bold text-gray-800 flex-1">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative">
          <Bell size={16} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: ACCENT }}>
            A
          </div>
          <span className="text-xs font-medium text-gray-700 hidden sm:block">Admin</span>
        </div>
      </div>
    </header>
  )
}
