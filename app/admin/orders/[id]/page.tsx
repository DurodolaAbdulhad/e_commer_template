'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MapPin, Phone, Mail, Package } from 'lucide-react'
import { getOrder, updateOrderStatus } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS: Record<string, string> = {
  pending: ACCENT, processing: '#2563eb', shipped: '#7c3aed', delivered: '#16a34a', cancelled: '#6b7280',
}

export default function AdminOrderDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [order,   setOrder]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    getOrder(id).then(o => {
      setOrder(o)
      setStatus(o?.status || 'pending')
      setLoading(false)
    })
  }, [id])

  async function handleStatusUpdate() {
    setSaving(true)
    try {
      await updateOrderStatus(id, status)
      toast.success(`Order status updated to ${status}`)
    } catch {
      toast.error('Could not update status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" /></div>
  if (!order) return <div className="bg-white rounded-xl border border-gray-100 p-10 text-center"><p className="text-sm text-gray-400">Order not found.</p><button onClick={() => router.back()} className="mt-3 text-xs text-blue-500 hover:underline">Go back</button></div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-50">
            <ArrowLeft size={14} className="text-gray-500" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-gray-800">{order.reference || order.id}</h2>
            <p className="text-xs text-gray-400">
              {order.createdAt ? new Date(order.createdAt).toLocaleString('en-NG') : ''}
            </p>
          </div>
        </div>
        {/* Status updater */}
        <div className="flex items-center gap-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none bg-white font-medium capitalize"
            style={{ color: STATUS_COLORS[status] ?? ACCENT }}>
            {STATUSES.map(s => <option key={s} value={s} className="text-gray-700">{s}</option>)}
          </select>
          <button onClick={handleStatusUpdate} disabled={saving}
            className="px-4 py-2 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: ACCENT }}>
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Order Items ({order.items?.length ?? 0})
              </h3>
            </div>
            {(order.items ?? []).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                <div className="w-14 h-14 bg-gray-50 rounded border border-gray-100 overflow-hidden relative shrink-0">
                  {item.images?.[0]
                    ? <Image src={item.images[0]} alt={item.name} fill className="object-cover" sizes="56px" />
                    : <div className="w-full h-full flex items-center justify-center text-base font-bold text-gray-300">{item.name?.charAt(0)}</div>
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">×{item.quantity}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: ACCENT }}>{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Payment summary */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Payment</h3>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {[
                { label: 'Subtotal', value: formatPrice(order.subtotal ?? 0) },
                { label: 'Shipping', value: order.shipping === 0 ? 'Free' : formatPrice(order.shipping ?? 0) },
                order.discount && { label: 'Discount', value: `-${formatPrice(order.discount)}` },
              ].filter(Boolean).map((row: any) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="text-gray-700">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100">
                <span>Total</span>
                <span style={{ color: ACCENT }}>{formatPrice(order.total ?? 0)}</span>
              </div>
              <p className="text-xs text-gray-400 pt-1">
                Method: {order.paymentMethod || 'Paystack'} · Ref: {order.reference}
              </p>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="space-y-4">
          {order.contact && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Customer</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Mail size={13} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600">{order.contact.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={13} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600">{order.contact.phone}</span>
                </div>
              </div>
            </div>
          )}
          {order.address && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Delivery Address</h3>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-2.5">
                  <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {[order.address.firstName, order.address.lastName].filter(Boolean).join(' ')}<br />
                    {order.address.address}<br />
                    {[order.address.city, order.address.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
          <Link href={`/order/${order.reference || order.id}`} target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Package size={13} />
            View Customer Receipt
          </Link>
        </div>
      </div>
    </div>
  )
}
