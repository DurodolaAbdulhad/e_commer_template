'use client'

import { useEffect, useState } from 'react'
import { getAbandonedCarts, markCartRecovered } from '@/lib/admin-db'
import { ShoppingCart, Mail, Check, Download } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try { setCarts(await getAbandonedCarts()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function recover(email: string) {
    try { await markCartRecovered(email); toast.success('Marked as recovered'); load() } catch {}
  }

  async function sendReminder(cart: any) {
    try {
      const res = await fetch('/api/abandoned-cart-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cart.email, items: cart.items, subtotal: cart.subtotal }),
      })
      if (res.ok) toast.success(`Reminder sent to ${cart.email}`)
      else toast.error('Failed to send reminder')
    } catch { toast.error('Failed to send reminder') }
  }

  function exportCSV() {
    const rows = carts.map(c => `"${c.email}","${formatPrice(c.subtotal)}","${c.created_at}"`)
    const csv = ['Email,Subtotal,Date', ...rows].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'abandoned-carts.csv'; a.click()
  }

  const totalValue = carts.reduce((s, c) => s + (c.subtotal ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Abandoned carts', value: carts.length },
          { label: 'Total recoverable value', value: formatPrice(totalValue) },
          { label: 'Avg. cart value', value: carts.length ? formatPrice(Math.round(totalValue / carts.length)) : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        {carts.length > 0 && (
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : carts.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No abandoned carts yet.</p>
            <p className="text-xs text-gray-400 mt-1">Carts are saved when a logged-in customer adds items but doesn&apos;t complete checkout within 30 minutes.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_120px_160px_100px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Customer</span><span>Value</span><span>Abandoned</span><span>Actions</span>
            </div>
            {carts.map((c, i) => (
              <div key={c.id ?? i} className="grid grid-cols-[1fr_120px_160px_100px] gap-3 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{c.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Array.isArray(c.items) ? `${c.items.length} item${c.items.length !== 1 ? 's' : ''}` : '—'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-800">{formatPrice(c.subtotal)}</span>
                <span className="text-xs text-gray-500">
                  {c.created_at ? new Date(c.created_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => sendReminder(c)} title="Send reminder email"
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Mail size={13} />
                  </button>
                  <button onClick={() => recover(c.email)} title="Mark recovered"
                    className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                    <Check size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 mb-1">How abandoned cart recovery works</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          When a logged-in customer adds items to cart and doesn&apos;t checkout, the cart is saved here after 30 minutes. Click the mail icon to send a recovery email. Set up <code className="font-mono bg-amber-100 px-1 rounded">RESEND_API_KEY</code> in <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code> to enable email sending. The <code className="font-mono bg-amber-100 px-1 rounded">/api/abandoned-cart-reminder</code> API route handles the send.
        </p>
      </div>
    </div>
  )
}
