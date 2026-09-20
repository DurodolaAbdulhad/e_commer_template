'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, ShoppingBag } from 'lucide-react'
import { getOrders, updateOrderStatus } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const STATUSES = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:    { bg: '#fff5f5', text: ACCENT },
  paid:       { bg: '#eff6ff', text: '#2563eb' }, // legacy — same as processing
  processing: { bg: '#eff6ff', text: '#2563eb' },
  shipped:    { bg: '#f5f3ff', text: '#7c3aed' },
  delivered:  { bg: '#f0fdf4', text: '#16a34a' },
  cancelled:  { bg: '#f9fafb', text: '#6b7280' },
}

export default function AdminOrdersPage() {
  const [orders,  setOrders]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getOrders({ status })
    setOrders(data)
    setLoading(false)
  }, [status])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      await updateOrderStatus(orderId, newStatus)
      toast.success(`Order marked as ${newStatus}`)
      load()
    } catch (e: any) { toast.error(e?.message ?? 'Failed to update order') }
  }

  const filtered = orders.filter(o =>
    !search ||
    (o.order_number ?? o.payment_reference ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (o.customer_email ?? o.contact?.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (o.customer_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-gray-400" />
        </div>
        {/* Status tabs */}
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {STATUSES.map(s => (
            <button key={s || 'all'} onClick={() => setStatus(s)}
              className="px-3 py-2 text-xs font-medium transition-colors capitalize"
              style={{
                backgroundColor: status === s ? ACCENT : 'transparent',
                color: status === s ? '#fff' : '#6b7280',
              }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_150px_80px_120px_120px_36px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Order</span>
          <span>Customer</span>
          <span>Items</span>
          <span>Total</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No orders found.</p>
          </div>
        ) : (
          filtered.map(order => {
            const ref    = order.order_number || order.payment_reference || order.id || ''
            const status = order.status || 'pending'
            const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending
            const dateRaw = order.created_at || order.createdAt
            const date   = dateRaw ? new Date(dateRaw).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

            return (
              <div key={order.id || ref} className="grid grid-cols-1 md:grid-cols-[1fr_150px_80px_120px_120px_36px] gap-3 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{ref}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                </div>
                <p className="text-xs text-gray-600 truncate">{order.customer_email || order.contact?.email || 'Guest'}</p>
                <p className="text-xs text-gray-500">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</p>
                <p className="text-sm font-bold" style={{ color: ACCENT }}>{formatPrice(order.total ?? 0)}</p>
                <select
                  value={status}
                  onChange={e => handleStatusChange(order.id, e.target.value)}
                  className="text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer capitalize"
                  style={{ backgroundColor: colors.bg, color: colors.text }}>
                  {['pending','processing','shipped','delivered','cancelled'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Link href={`/admin/orders/${order.id || ref}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={14} className="text-gray-400" />
                </Link>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
