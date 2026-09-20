'use client'

import { useState } from 'react'
import { subscribeNewsletter } from '@/lib/admin-db'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  source?: string
  dark?: boolean          // true = dark background (blog sidebar)
  buttonColor?: string    // defaults to green
  className?: string
}

export default function NewsletterForm({ source = 'footer', dark = false, buttonColor = '#4CAF50', className = '' }: Props) {
  const [email,   setEmail]   = useState('')
  const [done,    setDone]    = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await subscribeNewsletter(email, source)
      setDone(true)
      setEmail('')
      toast.success('Subscribed! Thanks for joining.')
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className={`flex items-center gap-2 py-2 ${className}`}>
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <Check size={12} className="text-white" />
        </div>
        <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-green-700'}`}>
          You're subscribed — thank you!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : '#e5e7eb'}` }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email here..."
          required
          style={{
            flex: 1, padding: '10px 12px', fontSize: '13px',
            border: 'none', outline: 'none', minWidth: 0,
            color: dark ? '#fff' : '#333',
            backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#fff',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 18px', backgroundColor: buttonColor, color: '#fff',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : 'Subscribe'}
        </button>
      </div>
    </form>
  )
}
