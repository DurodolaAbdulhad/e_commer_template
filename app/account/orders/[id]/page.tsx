'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, Clock, Package, Truck, MapPin, Phone, Mail, RotateCcw, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCustomerOrder, createReturn, getReturns } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

const ACCENT = client.colors.primary
const GREEN  = '#16a34a'

const STEPS = [
  { label: 'Order Placed',  icon: CheckCircle },
  { label: 'Processing',    icon: Clock },
  { label: 'Shipped',       icon: Truck },
  { label: 'Delivered',     icon: Package },
]

function stepIndex(status: string) {
  const map: Record<string, number> = { pending: 0, processing: 1, shipped: 2, delivered: 3 }
  return map[status] ?? 0
}

export default function OrderDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const { user } = useAuth()

  const [order,          setOrder]          = useState<any>(null)
  const [loading,        setLoading]        = useState(true)
  const [existingReturn, setExistingReturn] = useState<any>(null)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnReason,   setReturnReason]   = useState('')
  const [submitting,     setSubmitting]     = useState(false)

  useEffect(() => {
    if (!user?.email || !id) return
    setLoading(true)
    getCustomerOrder(id, user.email)
      .then(data => setOrder(data ?? null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id, user?.email])

  useEffect(() => {
    if (!order) return
    getReturns().then((returns: any[]) => {
      const found = returns.find(r =>
        r.order_id === order.id ||
        r.order_reference === (order.payment_reference || id)
      )
      if (found) setExistingReturn(found)
    }).catch(() => {})
  }, [order, id])

  async function submitReturn() {
    if (!returnReason.trim()) return toast.error('Please describe your reason for the return')
    setSubmitting(true)
    try {
      await createReturn({
        order_id:       order.id,
        order_number:   order.payment_reference || order.id,
        customer_email: order.email || user?.email || '',
        customer_name:  order.contact?.full_name || order.address?.fullName || '',
        items:          order.items ?? order.cart ?? [],
        reason:         returnReason.trim(),
        status:         'requested',
        created_at:     new Date().toISOString(),
      })
      toast.success("Return request submitted! We'll review it and respond within 2 business days.")
      setShowReturnForm(false)
      setExistingReturn({ status: 'requested' })
    } catch (err: any) {
      toast.error(err?.message || 'Could not submit return request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="bg-white rounded-lg border border-gray-100 px-5 py-16 flex items-center justify-center gap-2 text-gray-400">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">Loading order…</span>
    </div>
  )

  if (!order) return (
    <div className="bg-white rounded-lg border border-gray-100 px-5 py-12 text-center">
      <Package size={36} className="text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Order not found.</p>
      <Link href="/account/orders" className="inline-block mt-3 text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
        ← Back to orders
      </Link>
    </div>
  )

  const status = order.status || 'pending'
  const step   = stepIndex(status)
  const ref    = order.payment_reference || order.id
  const date   = (order.created_at || order.createdAt)
    ? new Date(order.created_at || order.createdAt).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const items  = order.items ?? order.cart ?? []

  // Delivery address: support both old (order.address) and new (order.contact + order.address) shapes
  const contactEmail = order.email || order.contact?.email || order.address?.email || ''
  const contactPhone = order.contact?.phone || order.phone || order.address?.phone || ''
  const addrName     = [order.contact?.full_name, order.address?.firstName, order.address?.lastName].filter(Boolean).join(' ')
  const addrStreet   = order.address?.address || order.address?.street || ''
  const addrCity     = order.address?.city || ''
  const addrState    = order.address?.state || ''

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
          <ArrowLeft size={14} className="text-gray-500" />
        </Link>
        <div>
          <h2 className="text-sm font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
            Order {ref}
          </h2>
          <p className="text-xs text-gray-400">{date}</p>
        </div>
      </div>

      {/* Order tracker */}
      <div className="bg-white rounded-lg border border-gray-100 px-5 py-5">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-4">Order Status</h3>
        <div className="flex items-start">
          {STEPS.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex-1 flex flex-col items-center relative">
              {i < STEPS.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 z-0"
                  style={{ backgroundColor: i < step ? GREEN : '#e5e7eb' }} />
              )}
              <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center mb-2"
                style={{
                  backgroundColor: i <= step ? (i < step ? GREEN : ACCENT) : '#f3f4f6',
                  border: `2px solid ${i <= step ? (i < step ? GREEN : ACCENT) : '#e5e7eb'}`,
                }}>
                <Icon size={14} className={i <= step ? 'text-white' : 'text-gray-300'} />
              </div>
              <span className="text-[10px] text-center leading-tight px-1"
                style={{ color: i <= step ? '#333' : '#9ca3af', fontWeight: i === step ? 600 : 400 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide px-5 py-3.5 border-b border-gray-100">
          Items Ordered
        </h3>
        {items.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0">
            <div className="w-14 h-14 bg-gray-50 rounded border border-gray-100 overflow-hidden relative shrink-0">
              {item.images?.[0] || item.image
                ? <Image src={item.images?.[0] ?? item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">{item.name?.charAt(0)}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
              {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
              <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-bold shrink-0" style={{ color: ACCENT }}>
              {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
            </p>
          </div>
        ))}
      </div>

      {/* Return request */}
      {(status === 'delivered' || existingReturn) && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <RotateCcw size={14} className="text-gray-400" />
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Returns</h3>
          </div>
          <div className="px-5 py-4">
            {existingReturn ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: existingReturn.status === 'approved' ? '#16a34a' : existingReturn.status === 'rejected' ? '#dc2626' : '#f59e0b' }} />
                <div>
                  <p className="text-sm font-medium text-gray-700 capitalize">Return {existingReturn.status}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {existingReturn.status === 'requested' && "Under review — we'll respond within 2 business days."}
                    {existingReturn.status === 'approved'  && 'Approved. Please ship the items back.'}
                    {existingReturn.status === 'rejected'  && 'Unfortunately this return was rejected. Contact support for assistance.'}
                    {existingReturn.status === 'refunded'  && 'Refund processed successfully.'}
                  </p>
                </div>
              </div>
            ) : showReturnForm ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Describe why you want to return this order:</p>
                <textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Item arrived damaged, wrong size, not as described..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={submitReturn} disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: ACCENT }}>
                    {submitting ? 'Submitting…' : 'Submit Return Request'}
                  </button>
                  <button onClick={() => setShowReturnForm(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Not happy with your order?</p>
                <button onClick={() => setShowReturnForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                  <RotateCcw size={12} />
                  Request Return
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two columns: Delivery + Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide px-5 py-3.5 border-b border-gray-100">
            Delivery Address
          </h3>
          <div className="px-5 py-4 space-y-2.5">
            {contactEmail && (
              <div className="flex items-start gap-2.5">
                <Mail size={13} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-600">{contactEmail}</span>
              </div>
            )}
            {contactPhone && (
              <div className="flex items-start gap-2.5">
                <Phone size={13} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-600">{contactPhone}</span>
              </div>
            )}
            {(addrName || addrStreet) && (
              <div className="flex items-start gap-2.5">
                <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-600">
                  {addrName && <>{addrName}<br /></>}
                  {addrStreet && <>{addrStreet}<br /></>}
                  {[addrCity, addrState].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide px-5 py-3.5 border-b border-gray-100">
            Payment Summary
          </h3>
          <div className="px-5 py-4 space-y-2.5">
            {[
              { label: 'Subtotal', value: formatPrice(order.subtotal ?? 0) },
              { label: 'Shipping', value: order.shipping === 0 ? 'Free' : formatPrice(order.shipping ?? 0) },
              order.discount ? { label: 'Discount', value: `-${formatPrice(order.discount)}` } : null,
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-gray-500">{row.label}</span>
                <span className="text-gray-700">{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span style={{ color: ACCENT }}>{formatPrice(order.total ?? 0)}</span>
            </div>
            <p className="text-[10px] text-gray-400 pt-1">
              Payment method: {order.payment_method || order.paymentMethod || 'Paystack'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
