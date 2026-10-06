'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { client } from '@/config/client'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { ChevronRight, Star, TrendingUp, Gift, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LoyaltyPage() {
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [balance,  setBalance]  = useState<number | null>(null)
  const [history,  setHistory]  = useState<any[] | null>(null)

  const loyalty       = client.loyalty
  const nairaPerPoint = loyalty?.nairaPerPoint ?? 1

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      const [balRes, histRes] = await Promise.all([
        fetch(`/api/loyalty/balance?email=${encodeURIComponent(trimmed)}`),
        fetch(`/api/loyalty/history?email=${encodeURIComponent(trimmed)}`),
      ])
      if (balRes.ok) {
        const { points } = await balRes.json()
        setBalance(points ?? 0)
      }
      if (histRes.ok) {
        const { rows } = await histRes.json()
        setHistory(rows ?? [])
      }
    } catch {
      toast.error('Could not load loyalty data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nairaValue = balance != null ? balance * nairaPerPoint : 0

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-6 py-6 max-w-2xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">Loyalty Points</span>
          </nav>

          <h1 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Your Loyalty Points
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Earn {loyalty?.pointsPerHundredNaira ?? 1} point for every ₦100 spent. Redeem ₦{nairaPerPoint} for each point at checkout.
          </p>

          {/* Lookup form */}
          {balance === null && (
            <form onSubmit={handleLookup} className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="The email you use at checkout"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 focus:border-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: ACCENT }}
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Search size={15} /> Check My Points</>
                }
              </button>
            </form>
          )}

          {/* Balance card */}
          {balance !== null && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-xl p-5 text-white flex items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)' }}>
                <div>
                  <p className="text-xs font-medium opacity-70 mb-0.5">Available Points</p>
                  <p className="text-3xl font-bold tracking-tight">{balance.toLocaleString()}</p>
                  <p className="text-xs opacity-60 mt-1">≈ {formatPrice(nairaValue)} in value</p>
                </div>
                <Star size={40} className="opacity-20 shrink-0" />
              </div>

              {/* How to use */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <Gift size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  {balance >= (loyalty?.minRedeemPoints ?? 100)
                    ? `You can redeem your points at checkout. Toggle "Use Loyalty Points" in the order summary.`
                    : `You need at least ${loyalty?.minRedeemPoints ?? 100} points to redeem. Keep shopping to earn more!`
                  }
                </p>
              </div>

              {/* Change email */}
              <button
                onClick={() => { setBalance(null); setHistory(null) }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Check a different email
              </button>

              {/* History */}
              {history && history.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <TrendingUp size={14} className="text-gray-500" />
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Points History</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {history.map((row: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-sm text-gray-700">{row.description}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(row.created_at)}</p>
                        </div>
                        <span className={`text-sm font-bold ${row.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                          {row.type === 'earn' ? '+' : '−'}{row.points.toLocaleString()} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {history && history.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No points history yet. Start shopping to earn points!</p>
              )}

              <Link
                href="/shop"
                className="w-full py-3 text-white font-bold text-sm rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                style={{ backgroundColor: ACCENT }}
              >
                Shop &amp; Earn More Points
              </Link>
            </div>
          )}
        </main>
      </PageBox>
      <Footer />
    </>
  )
}
