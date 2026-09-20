'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { client } from '@/config/client'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const NAVY   = '#1a2638'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, isDemoMode } = useAuth()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) return toast.error('Please fill in all fields')
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 6)  return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signUp(email, password, name)
      toast.success('Account created! Welcome to ' + client.name)
      router.push('/account')
    } catch (err: any) {
      toast.error(err?.message || 'Could not create account')
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
                <strong>Demo mode</strong> — Supabase not connected. Registration will save locally.
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100" style={{ backgroundColor: NAVY }}>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Create Account
                </h1>
                <p className="text-blue-200 text-xs mt-0.5 opacity-75">Join {client.name} today</p>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                {/* Full name */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="John Doe" required
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters" required
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password" required
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 text-white text-sm font-bold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  style={{ backgroundColor: ACCENT }}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <div className="px-6 pb-5 text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: ACCENT }}>
                    Sign in
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
