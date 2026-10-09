'use client'

import { useEffect, useState } from 'react'
import { Bell, Send, Users, ShoppingBag, Package, Truck, Zap, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react'
import { getServiceClient } from '@/lib/supabase-server'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const TEMPLATES = [
  {
    id: 'new_product',
    label: 'New Product',
    icon: Package,
    title: '🛍️ New arrival just dropped!',
    body: 'Check out our latest product — now live in the store.',
    url: '/shop',
  },
  {
    id: 'combo',
    label: 'New Combo Deal',
    icon: Zap,
    title: '🔥 New Combo Deal — save big!',
    body: 'We just added a new combo deal. Buy together and save.',
    url: '/bundles',
  },
  {
    id: 'promo',
    label: 'Promo / Sale',
    icon: ShoppingBag,
    title: '🎉 Special offer — today only!',
    body: 'Exclusive discount available for a limited time. Tap to shop.',
    url: '/shop',
  },
  {
    id: 'order',
    label: 'Order Delivered',
    icon: Truck,
    title: '📦 Your order is on its way!',
    body: 'Your order has been dispatched and will arrive soon.',
    url: '/account/orders',
  },
]

export default function PushPage() {
  const [title,   setTitle]   = useState('')
  const [body,    setBody]    = useState('')
  const [url,     setUrl]     = useState('/')
  const [sending, setSending] = useState(false)
  const [result,  setResult]  = useState<{ sent: number; failed: number; stale: number } | null>(null)
  const [subCount, setSubCount] = useState<number | null>(null)
  const [expandTpl, setExpandTpl] = useState(true)

  useEffect(() => {
    fetch('/api/push/subscriber-count')
      .then(r => r.json())
      .then(d => setSubCount(d.count ?? 0))
      .catch(() => {})
  }, [])

  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    setTitle(tpl.title)
    setBody(tpl.body)
    setUrl(tpl.url)
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) { toast.error('Title and body are required'); return }
    setSending(true); setResult(null)
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setResult(data)
      toast.success(`Sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
            Push Notifications
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Send instant notifications to subscribed customers</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl">
          <Users size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">
            {subCount === null ? '…' : subCount} subscriber{subCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50"
          onClick={() => setExpandTpl(v => !v)}
        >
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Quick Templates</span>
          {expandTpl ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        {expandTpl && (
          <div className="p-4 grid grid-cols-2 gap-3">
            {TEMPLATES.map(tpl => {
              const Icon = tpl.icon
              return (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${ACCENT}15` }}>
                    <Icon size={14} style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{tpl.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{tpl.body}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
            <Bell size={13} /> Compose Notification
          </h3>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={80}
              placeholder="e.g. 🔥 Flash sale — 30% off today only!"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Short message customers will see in the notification…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{body.length}/200</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Link (URL path)</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="/shop or /bundles or /account/orders"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">Where to take the customer when they tap the notification</p>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Preview</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                  <img src="/icons/icon-72.png" alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{title || 'Notification title'}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{body || 'Notification body'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl">
              <Check size={14} />
              Sent to <strong>{result.sent}</strong> subscriber{result.sent !== 1 ? 's' : ''}
              {result.failed > 0 && <span className="text-orange-600 ml-1">({result.failed} failed)</span>}
              {result.stale > 0 && <span className="text-gray-400 ml-1">· {result.stale} expired removed</span>}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: ACCENT }}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending…' : `Send to All Subscribers`}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">How it works</p>
        <p>Customers are asked to allow notifications the first time they visit the store. Subscriptions are stored in Supabase and notifications are sent via the Web Push protocol (works on Android Chrome, Desktop Chrome/Edge/Firefox).</p>
        <p className="text-blue-500 mt-1">iOS Safari requires the site to be added to the Home Screen for push to work.</p>
      </div>
    </div>
  )
}
