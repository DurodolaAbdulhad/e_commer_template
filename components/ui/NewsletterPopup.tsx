'use client'

import { useEffect, useState } from 'react'
import { X, MessageCircle, Mail, Gift } from 'lucide-react'
import { subscribeNewsletter, getStoreSetting } from '@/lib/admin-db'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

const ACCENT      = 'var(--brand-primary)'
const SESSION_KEY = 'nl_popup'

type PopupSettings = {
  title:        string
  description:  string
  discountCode: string
  delayMs:      number
}

const DEFAULTS: PopupSettings = {
  title:        'Get 10% off your first order',
  description:  `Subscribe for exclusive deals, new arrivals, and updates from ${client.name}.`,
  discountCode: 'WELCOME10',
  delayMs:      8000,
}

export default function NewsletterPopup() {
  const [settings, setSettings] = useState<PopupSettings | null>(null)
  const [visible,  setVisible]  = useState(false)
  const [email,    setEmail]    = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return

    Promise.all([
      getStoreSetting('popup_enabled'),
      getStoreSetting('popup_title'),
      getStoreSetting('popup_description'),
      getStoreSetting('popup_discount_code'),
      getStoreSetting('popup_delay'),
    ]).then(([enabled, title, desc, code, delay]) => {
      if (enabled === '0' || enabled === false) return

      const s: PopupSettings = {
        title:        String(title || DEFAULTS.title),
        description:  String(desc  || DEFAULTS.description),
        discountCode: String(code  || DEFAULTS.discountCode),
        delayMs:      delay ? Number(delay) * 1000 : DEFAULTS.delayMs,
      }
      setSettings(s)
      setTimeout(() => setVisible(true), s.delayMs)
    }).catch(() => {
      setSettings(DEFAULTS)
      setTimeout(() => setVisible(true), DEFAULTS.delayMs)
    })
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return toast.error('Please enter your email')
    setLoading(true)
    try {
      await subscribeNewsletter(email, 'popup', whatsapp)
      setDone(true)
      sessionStorage.setItem(SESSION_KEY, '1')
      setTimeout(dismiss, 4500)
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!visible || !settings) return null

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
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
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                You&apos;re in!
              </h3>
              <p className="text-sm text-gray-500">Welcome to {client.name}. Here&apos;s your discount code:</p>
              {settings.discountCode && (
                <div className="flex items-center justify-center gap-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-5 py-3">
                  <Gift size={16} className="text-gray-500 shrink-0" />
                  <span className="font-mono text-lg font-extrabold tracking-widest text-gray-900">
                    {settings.discountCode}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-400">Copy this code and use it at checkout</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>
                Special offer
              </p>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                {settings.title}
              </h3>
              <p className="text-sm text-gray-500 mb-6">{settings.description}</p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address *"
                    required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-gray-400"
                  />
                </div>

                <div className="relative">
                  <MessageCircle size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp number (optional)"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}
                >
                  {loading ? 'Subscribing…' : 'Claim My Discount →'}
                </button>
              </form>

              <button onClick={dismiss} className="block text-center w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                No thanks, I&apos;ll pay full price
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
