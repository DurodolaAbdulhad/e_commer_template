'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { formatPrice } from '@/lib/utils'
import { client } from '@/config/client'
import Link from 'next/link'
import { ChevronRight, Search, Package, Truck, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: Clock },
  { key: 'processing', label: 'Processing',    icon: Package },
  { key: 'shipped',    label: 'Shipped',        icon: Truck },
  { key: 'delivered',  label: 'Delivered',      icon: CheckCircle },
]

const STATUS_INDEX: Record<string, number> = {
  pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1,
}

export default function TrackOrderPage() {
  const [orderNum, setOrderNum] = useState('')
  const [email,    setEmail]    = useState('')
  const [order,    setOrder]    = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!orderNum.trim() || !email.trim()) {
      toast.error('Please enter your order number and email')
      return
    }
    setLoading(true)
    setSearched(false)
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNum.trim(), email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok || !data.order) {
        setOrder(null)
        setSearched(true)
        toast.error('No order found with those details')
      } else {
        setOrder(data.order)
        setSearched(true)
      }
    } catch {
      toast.error('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = order ? (STATUS_INDEX[order.status] ?? 0) : -1
  const isCancelled = order?.status === 'cancelled'

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-6 py-6 max-w-2xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">Track Order</span>
          </nav>

          <h1 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Track Your Order
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your order number and email address to see your order status.
          </p>

          {/* Search form */}
          <form onSubmit={handleTrack} className="bg-white border border-gray-100 rounded-xl p-5 space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Order Number</label>
              <input
                type="text"
                value={orderNum}
                onChange={e => setOrderNum(e.target.value.toUpperCase())}
                placeholder="e.g. ORD-2026-12345"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-400 focus:border-gray-400 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="The email you used at checkout"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-400 focus:border-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search size={15} />
                  Track Order
                </>
              )}
            </button>
          </form>

          {/* Result */}
          {searched && !order && (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <XCircle size={40} className="text-gray-300" />
              <p className="font-semibold text-gray-600">Order not found</p>
              <p className="text-sm text-gray-400">
                Double-check your order number and email, or{' '}
                <Link href={`mailto:${client.contact?.email || ''}`} className="text-red-500 hover:underline">
                  contact us
                </Link>
                .
              </p>
            </div>
          )}

          {order && (
            <div className="space-y-4">
              {/* Order header */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold text-gray-800 text-sm">{order.order_number}</h2>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      isCancelled ? 'bg-gray-100 text-gray-500' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Placed {order.created_at ? new Date(order.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
              </div>

              {/* Status tracker */}
              {!isCancelled && (
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-5">Delivery Status</h3>
                  <div className="relative flex items-start justify-between">
                    {/* Track line */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
                    <div
                      className="absolute top-4 left-4 h-0.5 bg-green-400 transition-all duration-500"
                      style={{ width: stepIndex > 0 ? `${(stepIndex / (STEPS.length - 1)) * 100}%` : '0%' }}
                    />
                    {STEPS.map((step, i) => {
                      const Icon = step.icon
                      const done = i <= stepIndex
                      const active = i === stepIndex
                      return (
                        <div key={step.key} className="relative flex flex-col items-center gap-2 z-10" style={{ flex: 1 }}>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                              done ? 'border-green-400 bg-green-400' : 'border-gray-200 bg-white'
                            } ${active ? 'ring-4 ring-green-100' : ''}`}
                          >
                            <Icon size={15} className={done ? 'text-white' : 'text-gray-300'} />
                          </div>
                          <p className={`text-[10px] font-medium text-center leading-tight ${done ? 'text-gray-700' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <XCircle size={20} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Order Cancelled</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      If you paid, a refund will be processed. Please{' '}
                      <Link href={`mailto:${client.contact?.email || ''}`} className="text-red-500 hover:underline">
                        contact us
                      </Link>{' '}
                      if you have questions.
                    </p>
                  </div>
                </div>
              )}

              {/* Items */}
              {order.items?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Items ({order.items.length})
                    </h3>
                  </div>
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                      {item.image && (
                        <div className="w-12 h-12 rounded border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{item.name}</p>
                        {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: ACCENT }}>
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total</span>
                    <span className="text-sm font-extrabold" style={{ color: ACCENT }}>
                      {formatPrice(order.total ?? 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Delivery address */}
              {order.shipping_address && (
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-1">Delivery Address</p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {[order.shipping_address.firstName, order.shipping_address.lastName,
                          order.shipping_address.fullName].filter(Boolean).join(' ')}<br />
                        {order.shipping_address.address}<br />
                        {[order.shipping_address.city, order.shipping_address.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Help */}
              <p className="text-center text-xs text-gray-400 pb-4">
                Questions about your order?{' '}
                <Link
                  href={`mailto:${client.contact?.email || ''}`}
                  className="font-medium hover:underline"
                  style={{ color: ACCENT }}
                >
                  Contact {client.name}
                </Link>
              </p>
            </div>
          )}
        </main>
      </PageBox>
      <Footer />
    </>
  )
}
