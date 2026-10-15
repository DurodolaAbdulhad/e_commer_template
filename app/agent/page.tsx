'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'
import { client } from '@/config/client'
import { Copy, LogOut, TrendingUp, ShoppingBag, DollarSign, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = client.colors?.primary ?? '#e84c3d'
const NAVY   = '#1a2638'

interface AgentInfo {
  id: string; name: string; email: string; agent_code: string; commission_rate: number
}
interface Order {
  id: string; order_number: string; total: number; status: string; created_at: string
  customer_name?: string; customer_email?: string; address?: any
}

export default function AgentPortal() {
  const [agentInfo, setAgentInfo]   = useState<AgentInfo | null>(null)
  const [orders,    setOrders]      = useState<Order[]>([])
  const [email,     setEmail]       = useState('')
  const [password,  setPassword]    = useState('')
  const [showPwd,   setShowPwd]     = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agent_session')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.agent_code) { setAgentInfo(parsed); fetchOrders(parsed.agent_code) }
      }
    } catch {}
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    try {
      const res = await fetch('/api/agent/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('agent_session', JSON.stringify(data.agent))
      setAgentInfo(data.agent)
      fetchOrders(data.agent.agent_code)
      toast.success(`Welcome back, ${data.agent.name.split(' ')[0]}!`)
    } catch (e: any) { toast.error(e.message) } finally { setAuthLoading(false) }
  }

  async function fetchOrders(code: string) {
    setDataLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at, address')
        .eq('agent_code', code)
        .order('created_at', { ascending: false })
        .limit(50)
      setOrders(data ?? [])
    } catch {} finally { setDataLoading(false) }
  }

  function logout() {
    localStorage.removeItem('agent_session')
    setAgentInfo(null); setOrders([])
    toast.success('Signed out')
  }

  const totalSales      = orders.reduce((s, o) => s + Number(o.total ?? 0), 0)
  const totalCommission = agentInfo ? (totalSales * agentInfo.commission_rate) / 100 : 0
  const refUrl = typeof window !== 'undefined' && agentInfo
    ? `${window.location.origin}/?ref=${agentInfo.agent_code}` : ''

  if (!agentInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f5f6fa' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-xl font-black"
              style={{ backgroundColor: ACCENT }}>A</div>
            <h1 className="text-xl font-bold text-gray-800">{client.name}</h1>
            <p className="text-sm text-gray-400 mt-1">Agent Portal</p>
          </div>
          <form onSubmit={login} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-700 mb-4">Sign in</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  autoComplete="email" placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': ACCENT } as any} />
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-gray-600 block mb-1">Password</label>
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': ACCENT } as any} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-7 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={authLoading}
              className="w-full mt-5 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: ACCENT }}>
              {authLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {authLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f6fa' }}>
      {/* Top bar */}
      <div className="text-white px-5 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY }}>
        <div>
          <p className="text-xs opacity-60">Agent Portal — {client.name}</p>
          <p className="font-bold">{agentInfo.name}</p>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity">
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Referral link card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 truncate">{refUrl}</code>
            <button onClick={() => { navigator.clipboard.writeText(refUrl); toast.success('Copied!') }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white rounded-lg hover:opacity-90 shrink-0"
              style={{ backgroundColor: ACCENT }}>
              <Copy size={12} /> Copy
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Share this link. Every order placed through it is attributed to you.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Orders',     value: orders.length,              icon: ShoppingBag  },
            { label: 'Sales Volume',      value: formatPrice(totalSales),    icon: TrendingUp   },
            { label: `Commission (${agentInfo.commission_rate}%)`, value: formatPrice(totalCommission), icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <Icon size={18} className="mx-auto mb-1.5" style={{ color: ACCENT }} />
              <p className="text-sm font-bold text-gray-800">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Orders list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700">Orders via your link ({orders.length})</h3>
          </div>
          {dataLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading…</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBag size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No orders yet. Share your link to start earning.</p>
            </div>
          ) : (
            <div>
              {orders.map(order => {
                const commission = (Number(order.total ?? 0) * agentInfo.commission_rate) / 100
                const statusColors: Record<string, string> = {
                  delivered: '#16a34a', processing: '#2563eb', pending: '#ca8a04',
                  cancelled: '#dc2626', refunded: '#9333ea',
                }
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{order.order_number || order.id?.slice(0, 8)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.address?.fullName ?? '—'} ·{' '}
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: ACCENT }}>{formatPrice(order.total ?? 0)}</p>
                      <p className="text-[10px] text-green-600 font-medium mt-0.5">+{formatPrice(commission)}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize mt-0.5 inline-block"
                        style={{ backgroundColor: `${statusColors[order.status] ?? '#6b7280'}18`, color: statusColors[order.status] ?? '#6b7280' }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
