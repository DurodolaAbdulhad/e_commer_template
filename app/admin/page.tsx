'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ShoppingBag, TrendingUp, Tag, Plus, ChevronRight, ArrowUpRight } from 'lucide-react'
import { getDashboardStats } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'

const ACCENT = '#e84c3d'
const NAVY   = '#1a2638'

const STATUS_COLORS: Record<string, string> = {
  pending:    ACCENT,
  processing: '#2563eb',
  shipped:    '#7c3aed',
  delivered:  '#16a34a',
  cancelled:  '#6b7280',
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(s => { setStats(s); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
    </div>
  )

  const cards = [
    { label: 'Total Products',  value: stats.totalProducts,  sub: `${stats.activeProducts} active`, icon: Package,    color: NAVY,    href: '/admin/products' },
    { label: 'Total Orders',    value: stats.totalOrders,    sub: `${stats.pendingOrders} pending`, icon: ShoppingBag, color: '#2563eb', href: '/admin/orders' },
    { label: 'Total Revenue',   value: formatPrice(stats.totalRevenue), sub: 'All time', icon: TrendingUp, color: '#16a34a', href: '/admin/orders' },
    { label: 'Categories',      value: stats.totalCategories, sub: 'Product groups', icon: Tag, color: '#7c3aed', href: '/admin/categories' },
  ]

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs font-medium hover:underline" style={{ color: ACCENT }}>
              View all
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ShoppingBag size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div>
              {stats.recentOrders.map((order: any) => {
                const ref    = order.reference || order.id || ''
                const status = order.status || 'pending'
                return (
                  <Link key={ref} href={`/admin/orders/${ref}`}
                    className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{ref}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.contact?.email || 'Guest'} · {order.items?.length ?? 0} items
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold" style={{ color: ACCENT }}>{formatPrice(order.total ?? 0)}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize text-white"
                        style={{ backgroundColor: STATUS_COLORS[status] ?? ACCENT }}>
                        {status}
                      </span>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">Quick Actions</h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                { href: '/admin/products/new', label: 'Add New Product',  icon: Package,    bg: '#fff5f5', color: ACCENT },
                { href: '/admin/orders',        label: 'View All Orders',  icon: ShoppingBag, bg: '#eff6ff', color: '#2563eb' },
                { href: '/admin/categories',    label: 'Manage Categories',icon: Tag,         bg: '#f5f3ff', color: '#7c3aed' },
                { href: '/admin/banners',       label: 'Update Banners',   icon: TrendingUp,  bg: '#f0fdf4', color: '#16a34a' },
              ].map(({ href, label, icon: Icon, bg, color }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity group"
                  style={{ backgroundColor: bg }}>
                  <Icon size={15} style={{ color }} />
                  <span className="text-xs font-medium" style={{ color }}>{label}</span>
                  <ChevronRight size={12} className="ml-auto" style={{ color }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Featured products */}
          {stats.topProducts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">Featured Products</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.topProducts.map((p: any) => (
                  <Link key={p.id} href={`/admin/products/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                      {p.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                      <p className="text-[10px]" style={{ color: ACCENT }}>{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
