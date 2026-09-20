'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { subscribeNewsletter } from '@/lib/admin-db'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

const ACCENT = 'var(--brand-primary)'
const DELAY_MS = 8000          // show after 8 seconds
const SESSION_KEY = 'nl_popup' // sessionStorage — shows once per session

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  useEffect(() => {
    // Don't show if already dismissed or subscribed this session
    if (sessionStorage.getItem(SESSION_KEY)) return
    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await subscribeNewsletter(email, 'popup')
      setDone(true)
      sessionStorage.setItem(SESSION_KEY, '1')
      toast.success('Subscribed! Welcome aboard.')
      setTimeout(dismiss, 2500)
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Top strip */}
        <div className="h-2" style={{ backgroundColor: ACCENT }} />

        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div className="px-8 py-8">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                You're in!
              </h3>
              <p className="text-sm text-gray-500">Check your inbox for exclusive deals and updates.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>
                Special offer
              </p>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Get 10% off your first order
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Subscribe to the {client.name} newsletter for exclusive deals, new arrivals, and tips.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-gray-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}
                >
                  {loading ? 'Subscribing…' : 'Claim My 10% Off →'}
                </button>
              </form>

              <button onClick={dismiss} className="block text-center w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                No thanks, I'll pay full price
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
