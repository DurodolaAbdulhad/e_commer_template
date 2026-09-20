'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

interface Props {
  productId: string
  productName: string
}

export default function BackInStockAlert({ productId, productName }: Props) {
  const [email,    setEmail]    = useState('')
  const [done,     setDone]     = useState(false)
  const [loading,  setLoading]  = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      const key   = 'back_in_stock_alerts'
      const existing: any[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      const dupe  = existing.find(a => a.productId === productId && a.email === email.toLowerCase())
      if (!dupe) {
        existing.push({ productId, productName, email: email.toLowerCase(), createdAt: new Date().toISOString() })
        localStorage.setItem(key, JSON.stringify(existing))
      }
      setDone(true)
      toast.success('We\'ll notify you when it\'s back!')
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl mt-4">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <Check size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">You're on the list!</p>
          <p className="text-xs text-green-600 mt-0.5">We'll email <strong>{email}</strong> when this item is restocked.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={14} className="text-gray-500" />
        <p className="text-sm font-semibold text-gray-700">Notify me when back in stock</p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white text-xs font-bold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 shrink-0"
          style={{ backgroundColor: ACCENT }}
        >
          {loading ? '…' : 'Alert Me'}
        </button>
      </form>
    </div>
  )
}
