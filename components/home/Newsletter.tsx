'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const { error } = await supabase.from('subscribers').insert({ email })
      if (error && error.code === '23505') {
        toast.error('You are already subscribed!')
      } else if (error) {
        throw error
      } else {
        toast.success('Subscribed! Thanks for joining.')
        setEmail('')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--brand-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Get Exclusive Deals
        </h2>
        <p className="text-white/70 mb-6 text-sm">
          Subscribe to our newsletter and get the best offers directly in your inbox.
        </p>
        <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="flex-1 px-4 py-3 rounded-lg text-sm outline-none bg-white text-gray-800 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60 shrink-0"
            style={{ backgroundColor: 'var(--brand-secondary)' }}
          >
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        <p className="text-white/40 text-xs mt-3">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}
