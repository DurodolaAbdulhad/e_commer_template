'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { signIn }   = useAdmin()

  const [mode,     setMode]     = useState<'master' | 'staff'>('master')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(password, mode === 'staff' ? email : undefined)
      toast.success('Welcome back!')
      const from = searchParams.get('from') || '/admin'
      router.replace(from)
    } catch (err: any) {
      toast.error(err?.message || 'Incorrect credentials')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #f5f6fa 0%, #eef0f7 100%)' }}>

      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
            style={{ backgroundColor: client.colors.primary }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Header strip */}
          <div className="px-6 py-4" style={{ backgroundColor: client.colors.primary }}>
            <p className="text-sm font-semibold text-white">Sign in to continue</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Store management access only</p>
          </div>

          {/* Mode toggle */}
          <div className="flex border-b border-gray-100">
            {(['master', 'staff'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className="flex-1 py-2.5 text-xs font-semibold transition-colors capitalize"
                style={{
                  backgroundColor: mode === m ? '#f9fafb' : 'transparent',
                  color: mode === m ? client.colors.primary : '#9ca3af',
                  borderBottom: mode === m ? `2px solid ${client.colors.primary}` : '2px solid transparent',
                }}>
                {m === 'master' ? 'Master Password' : 'Staff Login'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {mode === 'staff' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com" required={mode === 'staff'}
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': client.colors.secondary } as any}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" required
                  autoFocus={mode === 'master'} autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': client.colors.secondary } as any}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit"
              disabled={loading || !password || (mode === 'staff' && !email)}
              className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: client.colors.secondary }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          {client.name} · Secure Admin Access
        </p>
      </div>
    </div>
  )
}
