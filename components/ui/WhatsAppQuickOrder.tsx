'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, MessageCircle, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { client } from '@/config/client'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const WA_GREEN = '#16a34a'

function generateOrderNumber() {
  return 'WA-' + Date.now().toString(36).toUpperCase().slice(-6)
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function WhatsAppQuickOrder({ open, onClose }: Props) {
  const { items, subtotal, dispatch } = useCart()
  const router = useRouter()

  const [name,       setName]       = useState('')
  const [phone,      setPhone]      = useState('')
  const [notes,      setNotes]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const itemCount = (items as any[]).reduce((s: number, i: any) => s + i.quantity, 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!(items as any[]).length) return toast.error('Cart is empty')
    if (!client.whatsapp) return toast.error('WhatsApp ordering is not configured for this store.')

    const trimName  = name.trim()
    const trimPhone = phone.trim().replace(/\s/g, '')
    if (!trimName)  return toast.error('Please enter your name')
    if (!trimPhone) return toast.error('Please enter your phone number')

    setSubmitting(true)
    try {
      const orderNumber = generateOrderNumber()
      const orderItems  = (items as any[]).map((i: any) => ({
        id: i.id, name: i.name, price: i.price, quantity: i.quantity,
        variant: i.variant ?? null, image: i.images?.[0] ?? null,
      }))

      // Save order to DB (best-effort — don't block WA if it fails)
      try {
        const supabase = createClient()
        await supabase.from('orders').insert({
          order_number:   orderNumber,
          customer_phone: trimPhone,
          total:          subtotal,
          status:         'pending',
          payment_method: 'whatsapp',
          source:         'web',
          address:        { fullName: trimName, phone: trimPhone, notes: notes.trim() || null },
          items:          orderItems,
          agent_code:     (() => { try { return localStorage.getItem('agent_ref') || null } catch { return null } })(),
        })
      } catch {}

      // Notify store owner (non-blocking, fails silently)
      fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, customerName: trimName, customerPhone: trimPhone, total: subtotal }),
      }).catch(() => {})

      // Build WhatsApp message
      const itemLines = orderItems
        .map((i: any) => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
        .join('\n')

      const msg = [
        `🛍️ *New Order — ${client.name}*`,
        `📋 Ref: *${orderNumber}*`,
        ``,
        `👤 ${trimName}`,
        `📞 ${trimPhone}`,
        notes.trim() ? `📝 ${notes.trim()}` : null,
        ``,
        `🛒 *Items (${itemCount}):*`,
        itemLines,
        ``,
        `💰 *Total: ${formatPrice(subtotal)}*`,
        ``,
        `Please confirm my order and arrange delivery. Thank you!`,
      ].filter(l => l !== null).join('\n')

      const waNum = client.whatsapp.replace(/\D/g, '')
      dispatch({ type: 'CLEAR_CART' })
      try { localStorage.removeItem('agent_ref'); localStorage.removeItem('agent_ref_ts') } catch {}
      onClose()
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
      router.push(`/order/${orderNumber}`)
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Order via WhatsApp</p>
              <p className="text-xs text-gray-400">{itemCount} item{itemCount !== 1 ? 's' : ''} · {formatPrice(subtotal)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Cart summary */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          {(items as any[]).map((item: any) => (
            <div key={`${item.id}-${item.variant}`} className="flex justify-between text-xs text-gray-600 py-0.5">
              <span className="truncate pr-2">{item.name}{item.variant ? ` · ${item.variant}` : ''} × {item.quantity}</span>
              <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-gray-200 pt-1.5 mt-1.5">
            <span>Total</span>
            <span style={{ color: WA_GREEN }}>{formatPrice(subtotal)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500">
            Just your name and number — we'll confirm delivery details over WhatsApp.
          </p>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              required placeholder="Amaka Johnson" autoComplete="name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">WhatsApp / Phone Number *</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              required placeholder="08012345678" autoComplete="tel"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Delivery Area / Notes (optional)</label>
            <input
              type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Ikeja, Lagos — or any special request"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>

          <button
            type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: WA_GREEN }}>
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
              : <>
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Send to WhatsApp
                </>}
          </button>

          <p className="text-[10px] text-center text-gray-400">
            Your order is saved. WhatsApp will open in a new tab.
          </p>
        </form>
      </div>
    </>
  )
}
