'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { client } from '@/config/client'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const NAVY   = '#1a2638'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isDemoMode } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      router.push('/account')
    } catch (err: any) {
      toast.error(err?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <PageBox>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            {isDemoMode && (
              <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                <strong>Demo mode</strong> — Supabase not connected. Any email/password will work.
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header strip */}
              <div className="px-6 py-5 border-b border-gray-100" style={{ backgroundColor: NAVY }}>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Sign In
                </h1>
                <p className="text-blue-200 text-xs mt-0.5 opacity-75">
                  Welcome back to {client.name}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
                    <a href="#" className="text-xs" style={{ color: ACCENT }}>Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 text-white text-sm font-bold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ backgroundColor: ACCENT }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div className="px-6 pb-5 text-center">
                <p className="text-sm text-gray-500">
                  New customer?{' '}
                  <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: ACCENT }}>
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
