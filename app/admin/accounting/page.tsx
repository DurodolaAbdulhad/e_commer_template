'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'
import { client } from '@/config/client'
import Link from 'next/link'
import {
  TrendingUp, DollarSign, ShoppingBag, Clock, Download,
  AlertCircle, CreditCard, Smartphone, Banknote, MessageCircle, Zap, FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const PM_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  paystack:        { label: 'Online (Paystack)', icon: CreditCard,     color: '#2563eb' },
  pay_on_delivery: { label: 'Pay on Delivery',   icon: Smartphone,     color: '#16a34a' },
  bank_transfer:   { label: 'Bank Transfer',      icon: Banknote,       color: '#d97706' },
  whatsapp:        { label: 'WhatsApp Order',     icon: MessageCircle,  color: '#16a34a' },
  bnpl:            { label: 'Installment (BNPL)', icon: Zap,            color: '#7c3aed' },
}

function startOf(period: 'day' | 'week' | 'month'): Date {
  const d = new Date()
  if (period === 'day') { d.setHours(0, 0, 0, 0); return d }
  if (period === 'week') { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d }
  d.setDate(1); d.setHours(0, 0, 0, 0); return d
}

function revenueIn(orders: any[], from: Date) {
  return orders
    .filter(o => o.status !== 'cancelled' && new Date(o.created_at) >= from)
    .reduce((s, o) => s + (o.total ?? 0), 0)
}

function ordersIn(orders: any[], from: Date) {
  return orders.filter(o => o.status !== 'cancelled' && new Date(o.created_at) >= from).length
}

function exportCSV(orders: any[], filename: string) {
  const sym = client.currencySymbol
  const header = [
    'Order #', 'Date', 'Customer Name', 'Email', 'Phone',
    'Items', `Subtotal (${sym})`, `Shipping (${sym})`, `Discount (${sym})`, `VAT (${sym})`, `Total (${sym})`,
    'Payment Method', 'Status', 'Delivery Address', 'City', 'State', 'Invoice URL',
  ]
  const rows = orders.map(o => {
    const addr = o.address ?? {}
    const pm = PM_LABELS[o.payment_method]?.label ?? o.payment_method ?? 'Online'
    return [
      o.order_number || o.payment_reference || o.id,
      o.created_at ? new Date(o.created_at).toLocaleDateString('en-NG') : '',
      addr.fullName || [addr.firstName, addr.lastName].filter(Boolean).join(' ') || '',
      addr.email || o.email || '',
      addr.phone || o.phone || '',
      (o.items ?? []).length,
      (o.subtotal ?? 0).toFixed(2),
      (o.shipping_cost ?? o.shipping ?? 0).toFixed(2),
      (o.discount ?? 0).toFixed(2),
      (o.vat ?? 0).toFixed(2),
      (o.total ?? 0).toFixed(2),
      pm,
      o.status || 'pending',
      addr.address || '',
      addr.city || '',
      addr.state || '',
      `${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/${o.order_number || o.payment_reference || o.id}`,
    ]
  })
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

type StatCardProps = { label: string; value: string; sub?: string; icon: React.ElementType; color?: string }
function StatCard({ label, value, sub, icon: Icon, color = ACCENT }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AccountingPage() {
  const [orders,  setOrders]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch('/api/admin/orders')
      const json = await res.json()
      if (json.error && !json.orders) throw new Error(json.error)
      setOrders(json.orders ?? [])
    } catch (e: any) { setError(e.message ?? 'Failed to load orders') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const todayRev  = revenueIn(orders, startOf('day'))
  const weekRev   = revenueIn(orders, startOf('week'))
  const monthRev  = revenueIn(orders, startOf('month'))
  const allRev    = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total ?? 0), 0)
  const todayOrd  = ordersIn(orders, startOf('day'))
  const monthOrd  = ordersIn(orders, startOf('month'))
  const avgOrder  = orders.filter(o => o.status !== 'cancelled').length
    ? allRev / orders.filter(o => o.status !== 'cancelled').length : 0

  // Payment method breakdown
  const pmBreakdown = Object.entries(
    orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc: Record<string, number>, o) => {
        const pm = o.payment_method ?? 'paystack'
        acc[pm] = (acc[pm] ?? 0) + (o.total ?? 0)
        return acc
      }, {})
  ).sort((a, b) => b[1] - a[1])

  // Outstanding payments (bank_transfer pending + whatsapp pending)
  const pendingBank = orders.filter(o => o.payment_method === 'bank_transfer' && o.status === 'pending')
  const pendingWA   = orders.filter(o => o.payment_method === 'whatsapp' && o.status === 'pending')
  const pendingTotal = [...pendingBank, ...pendingWA].reduce((s, o) => s + (o.total ?? 0), 0)

  // VAT collected (from orders with vat > 0)
  const vatTotal     = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.vat ?? 0), 0)
  const vatThisMonth = orders.filter(o => o.status !== 'cancelled' && new Date(o.created_at) >= startOf('month')).reduce((s, o) => s + (o.vat ?? 0), 0)

  // Monthly revenue summary (last 6 months)
  const monthlyRev: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
    monthlyRev[d.toISOString().slice(0, 7)] = 0
  }
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    const key = new Date(o.created_at).toISOString().slice(0, 7)
    if (key in monthlyRev) monthlyRev[key] += o.total ?? 0
  })
  const monthlyData = Object.entries(monthlyRev).map(([month, rev]) => ({ month, rev }))
  const monthlyMax  = Math.max(...monthlyData.map(d => d.rev), 1)

  // Filtered orders for export
  const exportOrders = (() => {
    if (!fromDate && !toDate) return orders
    return orders.filter(o => {
      const d = new Date(o.created_at)
      if (fromDate && d < new Date(fromDate)) return false
      if (toDate   && d > new Date(toDate + 'T23:59:59')) return false
      return true
    })
  })()

  function handleExport() {
    if (exportOrders.length === 0) { toast.error('No orders in selected range'); return }
    setExporting(true)
    try {
      const from = fromDate || 'all'
      const to   = toDate   || 'all'
      exportCSV(exportOrders, `${client.name.replace(/\s+/g, '-')}-orders-${from}-to-${to}.csv`)
      toast.success(`Exported ${exportOrders.length} orders`)
    } catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  // Last 30 days revenue by date for mini chart
  const last30: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    last30[d.toISOString().slice(0, 10)] = 0
  }
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    const key = new Date(o.created_at).toISOString().slice(0, 10)
    if (key in last30) last30[key] += o.total ?? 0
  })
  const chartData = Object.entries(last30).map(([date, rev]) => ({ date, rev }))
  const chartMax  = Math.max(...chartData.map(d => d.rev), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-800">Accounting</h1>
        <p className="text-xs text-gray-400 mt-0.5">Revenue summary, payment breakdown, and CSV export</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Revenue cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Revenue"  value={formatPrice(todayRev)}  sub={`${todayOrd} order${todayOrd !== 1 ? 's' : ''}`}     icon={TrendingUp} />
        <StatCard label="This Week"         value={formatPrice(weekRev)}   sub={`since ${startOf('week').toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}`} icon={DollarSign} color="#2563eb" />
        <StatCard label="This Month"        value={formatPrice(monthRev)}  sub={`${monthOrd} order${monthOrd !== 1 ? 's' : ''}`}    icon={ShoppingBag} color="#16a34a" />
        <StatCard label="Average Order"     value={formatPrice(avgOrder)}  sub="all time, excl. cancelled"                          icon={CreditCard}  color="#7c3aed" />
      </div>

      {/* VAT summary */}
      {(vatTotal > 0 || !loading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">VAT / Tax Collected</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs text-gray-500">This month</span>
                <span className="text-sm font-bold text-gray-800">{formatPrice(vatThisMonth)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-gray-500">All time</span>
                <span className="text-sm font-bold text-gray-800">{formatPrice(vatTotal)}</span>
              </div>
              {vatTotal === 0 && (
                <p className="text-[10px] text-gray-400 pt-1">No VAT recorded. Add a <code className="bg-gray-100 px-1 rounded">vat</code> column to your orders table to track tax here.</p>
              )}
            </div>
          </div>

          {/* Monthly revenue (last 6 months) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-4">Monthly Revenue — Last 6 Months</h3>
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
              </div>
            ) : (
              <div className="flex items-end gap-1.5 h-20">
                {monthlyData.map(({ month, rev }) => {
                  const pct = Math.round((rev / monthlyMax) * 100)
                  const isCurrentMonth = month === new Date().toISOString().slice(0, 7)
                  const label = new Date(month + '-01').toLocaleDateString('en-NG', { month: 'short' })
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${month}: ${formatPrice(rev)}`}>
                      <div className="w-full rounded-t transition-all"
                        style={{ height: `${Math.max(pct, 3)}%`, backgroundColor: isCurrentMonth ? ACCENT : '#cbd5e1', minHeight: '3px' }} />
                      <span className="text-[9px] text-gray-400">{label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outstanding + Payment breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-4">Revenue by Payment Method</h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
            </div>
          ) : pmBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {pmBreakdown.map(([pm, rev]) => {
                const pct = Math.round((rev / allRev) * 100)
                const meta = PM_LABELS[pm] ?? { label: pm, icon: CreditCard, color: '#6b7280' }
                const Icon = meta.icon
                return (
                  <div key={pm}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: meta.color }} />
                        <span className="text-xs text-gray-600">{meta.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{pct}%</span>
                        <span className="text-xs font-semibold text-gray-800">{formatPrice(rev)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Outstanding payments */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-4">Outstanding Collections</h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
            </div>
          ) : pendingTotal === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mb-2">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <p className="text-sm font-medium text-gray-600">All clear</p>
              <p className="text-xs text-gray-400 mt-0.5">No pending bank transfers or WhatsApp orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Total Outstanding</p>
                    <p className="text-[10px] text-amber-600">{pendingBank.length + pendingWA.length} orders awaiting confirmation</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-amber-800">{formatPrice(pendingTotal)}</p>
              </div>
              {pendingBank.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5"><Banknote size={12} /> Bank transfers pending</span>
                  <span className="text-xs font-semibold text-gray-700">{pendingBank.length} orders</span>
                </div>
              )}
              {pendingWA.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5"><MessageCircle size={12} /> WhatsApp orders pending</span>
                  <span className="text-xs font-semibold text-gray-700">{pendingWA.length} orders</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 30-day revenue chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-5">Daily Revenue — Last 30 Days</h3>
        {loading ? (
          <div className="flex items-center justify-center h-28">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : (
          <div className="flex items-end gap-0.5 h-28 overflow-hidden">
            {chartData.map(({ date, rev }) => {
              const pct = Math.round((rev / chartMax) * 100)
              const today = date === new Date().toISOString().slice(0, 10)
              return (
                <div key={date} className="flex-1 flex flex-col items-center justify-end" title={`${date}: ${formatPrice(rev)}`}>
                  <div className="w-full rounded-t transition-all"
                    style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: today ? ACCENT : rev > 0 ? '#cbd5e1' : '#f1f5f9', minHeight: '2px' }} />
                </div>
              )
            })}
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-2">Hover bars for date + amount</p>
      </div>

      {/* CSV Export */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-4">Export Orders to CSV</h3>
        <p className="text-xs text-gray-500 mb-4">
          Download a spreadsheet of orders for your accountant or bookkeeping software. Includes order number, date, customer, items, subtotal, shipping, discount, VAT, total, payment method, status, and delivery address.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={loading || exporting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ACCENT }}
          >
            <Download size={14} />
            {exporting ? 'Exporting…' : `Export ${exportOrders.length} Orders`}
          </button>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate('') }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Recent transactions table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Recent Transactions</h3>
          <span className="text-xs text-gray-400">{orders.slice(0, 20).length} of {orders.length}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No transactions yet.</p>
          </div>
        ) : (
          <div>
            <div className="hidden md:grid grid-cols-[1fr_120px_90px_120px_80px_90px_32px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <span>Order / Date</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Total</span>
              <span>Method</span>
              <span>Status</span>
              <span />
            </div>
            {orders.slice(0, 20).map(o => {
              const addr = o.address ?? {}
              const pm = PM_LABELS[o.payment_method] ?? { label: o.payment_method ?? 'Online', color: '#6b7280' }
              const statusColor = o.status === 'delivered' ? '#16a34a' : o.status === 'cancelled' ? '#6b7280' : o.status === 'shipped' ? '#7c3aed' : o.status === 'processing' ? '#2563eb' : ACCENT
              const invoiceRef = o.order_number || o.payment_reference || o.id
              return (
                <div key={o.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_90px_120px_80px_90px_32px] gap-3 items-center px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                  <div>
                    <p className="text-xs font-mono font-semibold text-gray-700">{invoiceRef}</p>
                    <p className="text-[10px] text-gray-400">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{addr.fullName || [addr.firstName, addr.lastName].filter(Boolean).join(' ') || addr.email || 'Guest'}</p>
                  <p className="text-xs text-gray-500">{(o.items ?? []).length} item{(o.items ?? []).length !== 1 ? 's' : ''}</p>
                  <p className="text-sm font-bold" style={{ color: ACCENT }}>{formatPrice(o.total ?? 0)}</p>
                  <p className="text-[10px] font-semibold" style={{ color: pm.color }}>{pm.label}</p>
                  <p className="text-[10px] font-semibold capitalize" style={{ color: statusColor }}>{o.status || 'pending'}</p>
                  <Link href={`/invoice/${invoiceRef}`} target="_blank" title="View invoice"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FileText size={13} className="text-gray-400 hover:text-gray-700" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
