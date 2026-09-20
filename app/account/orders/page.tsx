'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, ChevronRight, Search } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const ACCENT = '#e84c3d'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:    { bg: '#fff5f5', text: ACCENT },
  processing: { bg: '#eff6ff', text: '#2563eb' },
  shipped:    { bg: '#f0fdf4', text: '#16a34a' },
  delivered:  { bg: '#f0fdf4', text: '#16a34a' },
  cancelled:  { bg: '#f9fafb', text: '#6b7280' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('order_'))
    const loaded = keys
      .map(k => { try { return JSON.parse(localStorage.getItem(k) ?? '') } catch { return null } })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setOrders(loaded)
  }, [])

  const filtered = orders.filter(o =>
    !search ||
    (o.reference ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (o.id ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>My Orders</h2>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders…" className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 w-44" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_100px_80px_36px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Order</span>
          <span>Items</span>
          <span>Total</span>
          <span>Status</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ShoppingBag size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{search ? 'No orders match your search.' : "You haven't placed any orders yet."}</p>
            {!search && (
              <Link href="/shop" className="inline-block mt-3 text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
                Start shopping →
              </Link>
            )}
          </div>
        ) : (
          filtered.map(order => {
            const ref = order.reference || order.id || ''
            const status = order.status || 'pending'
            const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending
            const date = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''

            return (
              <Link key={ref} href={`/account/orders/${ref}`}
                className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_80px_36px] gap-1 sm:gap-3 items-center px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{ref}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                </div>
                <p className="text-xs text-gray-500 sm:text-center hidden sm:block">{order.items?.length ?? 0}</p>
                <p className="text-xs font-bold sm:text-center" style={{ color: ACCENT }}>{formatPrice(order.total ?? 0)}</p>
                <div className="sm:text-center">
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: colors.bg, color: colors.text }}>
                    {status}
                  </span>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors hidden sm:block" />
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
