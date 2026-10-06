'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { client } from '@/config/client'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { ChevronRight, RotateCcw, Search, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const REASONS = [
  'Item arrived damaged',
  'Wrong item received',
  'Item does not match description',
  'Changed my mind',
  'Item is defective / not working',
  'Size or fit issue',
  'Other',
]

export default function ReturnsPage() {
  // Step 1: look up order
  const [orderNum, setOrderNum] = useState('')
  const [email,    setEmail]    = useState('')
  const [order,    setOrder]    = useState<any>(null)
  const [looking,  setLooking]  = useState(false)

  // Step 2: fill return details
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [reason,   setReason]   = useState('')
  const [notes,    setNotes]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!orderNum.trim() || !email.trim()) {
      toast.error('Please enter your order number and email')
      return
    }
    setLooking(true)
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNum.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.order) {
        toast.error('No order found with those details')
      } else if (['pending', 'processing'].includes(data.order.status)) {
        toast.error('Your order has not been delivered yet. Returns are accepted after delivery.')
      } else if (data.order.status === 'cancelled') {
        toast.error('This order was cancelled. Please contact us if you need help.')
      } else {
        setOrder(data.order)
      }
    } catch {
      toast.error('Could not reach the server. Please try again.')
    } finally {
      setLooking(false)
    }
  }

  function toggleItem(itemName: string) {
    setSelected(s => ({ ...s, [itemName]: !s[itemName] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const chosenItems = (order.items ?? []).filter((i: any) => selected[i.name])
    if (chosenItems.length === 0) {
      toast.error('Select at least one item to return')
      return
    }
    if (!reason) {
      toast.error('Please select a reason for your return')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.order_number,
          email:       email.trim(),
          items:       chosenItems.map((i: any) => ({ name: i.name, quantity: i.quantity })),
          reason,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to submit')
      }
      setDone(true)
    } catch (e: any) {
      toast.error(e.message || 'Could not submit return request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-6 py-6 max-w-2xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">Returns</span>
          </nav>

          <h1 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Request a Return
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Returns accepted within {client.shipping?.returnDays ?? 7} days of delivery. Items must be unused and in original packaging.
          </p>

          {/* Done state */}
          {done && (
            <div className="flex flex-col items-center py-14 gap-4 text-center">
              <CheckCircle size={48} className="text-green-500" />
              <h2 className="text-lg font-bold text-gray-800">Return Request Submitted</h2>
              <p className="text-sm text-gray-500 max-w-sm">
                We've received your request for order <strong>{order?.order_number}</strong>. We'll review it and get back to you within 1–2 business days.
              </p>
              <Link href="/shop" className="mt-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: ACCENT }}>
                Continue Shopping
              </Link>
            </div>
          )}

          {/* Step 1: look up order */}
          {!done && !order && (
            <form onSubmit={handleLookup} className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Order Number</label>
                <input
                  type="text"
                  value={orderNum}
                  onChange={e => setOrderNum(e.target.value.toUpperCase())}
                  placeholder="e.g. ORD-2026-12345"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 uppercase focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="The email you used at checkout"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 focus:border-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={looking}
                className="w-full py-3 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: ACCENT }}
              >
                {looking
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Search size={15} /> Find My Order</>
                }
              </button>
            </form>
          )}

          {/* Step 2: select items + reason */}
          {!done && order && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Order summary */}
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-800">{order.order_number}</p>
                  <p className="text-[11px] text-green-600 mt-0.5 capitalize">{order.status}</p>
                </div>
                <button type="button" onClick={() => setOrder(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Change order
                </button>
              </div>

              {/* Item selection */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Which items are you returning?</h3>
                </div>
                {(order.items ?? []).map((item: any, i: number) => (
                  <label key={i} className={`flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selected[item.name] ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={!!selected[item.name]}
                      onChange={() => toggleItem(item.name)}
                      className="w-4 h-4 accent-red-500 shrink-0"
                    />
                    {item.image && (
                      <div className="w-10 h-10 rounded border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{item.name}</p>
                      {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                    </div>
                    <p className="text-xs text-gray-500 shrink-0">×{item.quantity}</p>
                  </label>
                ))}
              </div>

              {/* Reason */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Reason for return</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REASONS.map(r => (
                    <label key={r} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${reason === r ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-red-500"
                      />
                      <span className="text-sm text-gray-700">{r}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Additional notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Tell us more about the issue…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 focus:border-gray-400 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: ACCENT }}
              >
                {submitting
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><RotateCcw size={14} /> Submit Return Request</>
                }
              </button>
            </form>
          )}
        </main>
      </PageBox>
      <Footer />
    </>
  )
}
