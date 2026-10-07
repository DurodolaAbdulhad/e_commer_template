'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Mail, CheckCircle, ArrowRight, Loader2, UserX } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { client } from '@/config/client'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'

const ACCENT = client.colors.primary
const NAVY   = '#1a2638'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function isReady() {
  return (
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('placeholder') &&
    SUPABASE_KEY.length > 20 &&
    !SUPABASE_KEY.includes('placeholder')
  )
}

type Step = 'email' | 'sent' | 'not_found'

export default function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [step,    setStep]    = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!normalized) return

    setLoading(true)
    setError('')

    // Demo mode — just confirm link sent
    if (!isReady()) {
      setTimeout(() => { setLoading(false); setStep('sent') }, 800)
      return
    }

    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY)

    // shouldCreateUser: false → only succeeds if the user already has an account
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })

    setLoading(false)

    if (!otpError) {
      setStep('sent')
      return
    }

    // Supabase returns this error when the user doesn't exist
    if (
      otpError.message?.toLowerCase().includes('not found') ||
      otpError.message?.toLowerCase().includes('signups not allowed') ||
      otpError.message?.toLowerCase().includes('email not confirmed') ||
      otpError.status === 422
    ) {
      setStep('not_found')
      return
    }

    setError(otpError.message || 'Something went wrong. Please try again.')
  }

  return (
    <>
      <Header />
      <PageBox>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Header */}
              <div className="px-6 py-5 text-white" style={{ backgroundColor: NAVY }}>
                <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {step === 'sent'      ? 'Check your inbox' :
                   step === 'not_found' ? 'No account found' :
                   'Sign In'}
                </h1>
                <p className="text-blue-200 text-xs mt-0.5 opacity-75">
                  {step === 'sent'      ? `We sent a login link to ${email}` :
                   step === 'not_found' ? `We couldn't find an account for ${email}` :
                   `Welcome back to ${client.name}`}
                </p>
              </div>

              {/* ── Email entry ── */}
              {step === 'email' && (
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" required autoFocus
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button type="submit" disabled={loading || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-bold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: ACCENT }}>
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Checking…</>
                      : <><ArrowRight size={15} /> Continue</>
                    }
                  </button>

                  <p className="text-center text-xs text-gray-400 pt-1">
                    We'll send a one-click login link to your email — no password needed.
                  </p>
                </form>
              )}

              {/* ── Link sent ── */}
              {step === 'sent' && (
                <div className="px-6 py-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: `${ACCENT}15` }}>
                    <CheckCircle size={28} style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Login link sent!</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Click the link in your email to sign in. It expires in 1 hour.
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Didn't get it?{' '}
                    <button onClick={() => { setStep('email'); setError('') }}
                      className="font-semibold hover:underline" style={{ color: ACCENT }}>
                      Try again
                    </button>
                  </p>
                </div>
              )}

              {/* ── Not found ── */}
              {step === 'not_found' && (
                <div className="px-6 py-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <UserX size={26} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">No account found</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      There's no account linked to <strong>{email}</strong>.
                      Have you shopped with us before? Accounts are created automatically after your first purchase.
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <Link href="/shop"
                      className="block w-full py-2.5 text-white text-sm font-bold rounded-lg text-center transition-opacity hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}>
                      Shop &amp; get an account →
                    </Link>
                    <button onClick={() => { setStep('email'); setError('') }}
                      className="block w-full py-2 text-xs text-gray-500 hover:text-gray-700">
                      Try a different email
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Below-card note */}
            {step === 'email' && (
              <p className="text-center text-xs text-gray-400 mt-4">
                First time here?{' '}
                <Link href="/shop" className="font-semibold hover:underline" style={{ color: ACCENT }}>
                  Browse the shop
                </Link>
                {' '}— accounts are created automatically when you purchase.
              </p>
            )}
          </div>
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
