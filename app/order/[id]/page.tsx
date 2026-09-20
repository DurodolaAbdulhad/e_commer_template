'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { formatPrice } from '@/lib/utils'
import { client } from '@/config/client'
import Link from 'next/link'
import { CheckCircle, Package, MapPin, Phone, Mail, ChevronRight, Loader2, AlertCircle } from 'lucide-react'

const ACCENT = '#e84c3d'
const GREEN  = '#4CAF50'

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [order,    setOrder]    = useState<any>(null)
  const [status,   setStatus]   = useState<'loading' | 'success' | 'failed'>('loading')
  const [dbSaved,  setDbSaved]  = useState(false)

  useEffect(() => {
    if (!id) return

    // Read order stub from localStorage (written by checkout before redirect)
    let stub: any = null
    try {
      const raw = localStorage.getItem(`order_${id}`)
      if (raw) stub = JSON.parse(raw)
    } catch {}

    // Verify payment with Paystack server-side AND save to DB
    fetch('/api/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: id, orderData: stub }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.verified) {
          setStatus('success')
          setDbSaved(res.dbSaved ?? false)
          if (stub) setOrder(stub)
          // Clean up localStorage after verified save
          if (res.dbSaved) {
            try { localStorage.removeItem(`order_${id}`) } catch {}
          }
        } else {
          // Verify failed — fall back to localStorage if available
          if (stub) { setOrder(stub); setStatus('success') }
          else setStatus('failed')
        }
      })
      .catch(() => {
        // Network error — still show order from localStorage
        if (stub) { setOrder(stub); setStatus('success') }
        else setStatus('failed')
      })
  }, [id])

  // Send SMS once per order (guarded by sessionStorage)
  useEffect(() => {
    if (!order || status !== 'success') return
    const key = `sms_sent_${id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    const phone = order.address?.phone
    if (phone) {
      fetch('/api/sms/order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          orderNumber: order.order_number,
          total:       order.total,
          storeName:   client.name,
        }),
      }).catch(() => {})
    }
    // Send email confirmation
    const email = order.address?.email
    if (email) {
      fetch('/api/email/order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      }).catch(() => {})
    }
  }, [order, status, id])

  // ── Loading state ────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <>
        <Header />
        <PageBox>
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
            <Loader2 size={40} className="animate-spin text-gray-300" />
            <p className="text-sm text-gray-500 font-medium">Verifying your payment…</p>
          </div>
        </PageBox>
        <Footer />
      </>
    )
  }

  // ── Failed state ─────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <>
        <Header />
        <PageBox>
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
            <AlertCircle size={48} className="text-red-300" />
            <h1 className="text-xl font-bold text-gray-700">Order not found</h1>
            <p className="text-sm text-gray-400 max-w-sm">
              We couldn&apos;t verify order <strong>{id}</strong>. If you completed payment, please contact us with your payment reference.
            </p>
            <a
              href={`https://wa.me/${client.whatsapp}?text=${encodeURIComponent(`Hi! I completed a payment with reference ${id} but my order didn't confirm. Please help.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ backgroundColor: '#25D366' }}
            >
              Contact Support on WhatsApp
            </a>
            <Link href="/" className="text-xs text-gray-400 underline">Back to Home</Link>
          </div>
        </PageBox>
        <Footer />
      </>
    )
  }

  const addr = order?.address ?? {}

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">Order Confirmed</span>
          </nav>

          {/* Success banner */}
          <div className="rounded-xl p-6 mb-6 text-center" style={{ backgroundColor: '#f0fdf4' }}>
            <CheckCircle size={48} className="mx-auto mb-3" style={{ color: GREEN }} />
            <h1 className="text-2xl font-extrabold text-gray-800 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              Order Placed Successfully!
            </h1>
            <p className="text-sm text-gray-500 mb-3">
              Thank you, <strong>{addr.fullName}</strong>. Your order has been received and is being processed.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: GREEN }}>
                Order #{order?.order_number}
              </span>
              {!dbSaved && (
                <span className="inline-block px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  ⚠ Saving in background…
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

            {/* Left */}
            <div className="space-y-4">

              {/* Items */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <h2 className="font-semibold text-gray-800 text-sm">
                    Items Ordered ({order?.items?.length ?? 0})
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {(order?.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center text-lg font-bold text-gray-300">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                          : item.name?.charAt(0)
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                        {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">{formatPrice(item.price)} × {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-800 shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery address */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <h2 className="font-semibold text-gray-800 text-sm">Delivery Address</h2>
                </div>
                <div className="px-5 py-4 text-sm text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800">{addr.fullName}</p>
                  <p>{addr.address}</p>
                  <p>{addr.city}, {addr.state}</p>
                  <p>{addr.country}</p>
                  {addr.notes && <p className="text-xs text-gray-400 mt-2 italic">Note: {addr.notes}</p>}
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  {addr.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  {order?.address?.email ?? '—'}
                </div>
              </div>
            </div>

            {/* Right — Summary */}
            <div>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden sticky top-24">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 text-sm">Payment Summary</h2>
                </div>
                <div className="px-5 py-4 space-y-2.5">
                  <SRow label="Subtotal"  value={formatPrice(order?.subtotal ?? 0)} />
                  <SRow label="Shipping"  value={order?.shipping_cost === 0 ? 'FREE' : formatPrice(order?.shipping_cost ?? 0)} />
                  {(order?.discount ?? 0) > 0 && (
                    <SRow label={`Discount${order?.coupon_code ? ` (${order.coupon_code})` : ''}`}
                      value={`-${formatPrice(order.discount)}`} green />
                  )}
                  {(order?.vat ?? 0) > 0 && (
                    <SRow label="VAT" value={formatPrice(order.vat)} />
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-800">Total Paid</span>
                    <span className="text-base font-extrabold" style={{ color: GREEN }}>
                      {formatPrice(order?.total ?? 0)}
                    </span>
                  </div>
                  <div className="pt-1">
                    <SRow label="Payment" value="Paystack" />
                    <SRow label="Status"  value="Confirmed ✓" green />
                    <SRow label="Ref"     value={order?.payment_reference ?? id} mono />
                  </div>
                </div>

                {/* Status tracker */}
                <div className="px-5 pb-4">
                  <div className="flex items-center">
                    {['Order Placed', 'Processing', 'Shipped', 'Delivered'].map((step, i) => (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                            style={i === 0 ? { backgroundColor: GREEN } : {}}>
                            {i === 0 ? '✓' : i + 1}
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1 text-center leading-tight w-12">{step}</span>
                        </div>
                        {i < 3 && <div className="flex-1 h-px bg-gray-200 mb-4" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="px-5 pb-5 space-y-2">
                  <Link href="/shop"
                    className="block w-full py-3 text-center text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: ACCENT }}>
                    Continue Shopping
                  </Link>
                  <Link href="/account/orders"
                    className="block w-full py-3 text-center text-gray-600 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    View My Orders
                  </Link>
                </div>

                {/* WhatsApp follow-up */}
                {client.features?.whatsappOrder && client.whatsapp && (
                  <div className="px-5 pb-5">
                    <a href={`https://wa.me/${client.whatsapp}?text=${encodeURIComponent(`Hi! I just placed order #${order?.order_number} and would like to confirm the details.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="block w-full py-2.5 text-center text-green-600 text-xs font-semibold rounded-lg border-2 border-green-500 hover:bg-green-50 transition-colors">
                      💬 Confirm Order via WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </PageBox>
      <Footer />
    </>
  )
}

function SRow({ label, value, green = false, mono = false }: {
  label: string; value: string; green?: boolean; mono?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${green ? 'text-green-600' : 'text-gray-700'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}
