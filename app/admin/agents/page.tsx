'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, Copy, Check, Loader2, ToggleLeft, ToggleRight, TrendingUp, DollarSign, Link as LinkIcon } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

interface Agent {
  id: string
  name: string
  email: string
  agent_code: string
  commission_rate: number
  is_active: boolean
  created_at: string
  total_orders: number
  total_sales: number
  total_commission: number
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'))
}

export default function AgentsPage() {
  const [agents,    setAgents]    = useState<Agent[]>([])
  const [loading,   setLoading]   = useState(true)
  const [creating,  setCreating]  = useState(false)
  const [showForm,  setShowForm]  = useState(false)

  const [name,           setName]           = useState('')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [commissionRate, setCommissionRate] = useState(5)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/agents', { credentials: 'include' })
      if (res.ok) setAgents((await res.json()).agents ?? [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function createAgent() {
    if (!name.trim() || !email.trim() || !password.trim()) return toast.error('Name, email and password are required')
    setCreating(true)
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, commission_rate: commissionRate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(`Agent created — code: ${data.agent_code}`)
      setName(''); setEmail(''); setPassword(''); setCommissionRate(5); setShowForm(false)
      load()
    } catch (e: any) { toast.error(e.message) } finally { setCreating(false) }
  }

  async function toggleActive(agent: Agent) {
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id, is_active: !agent.is_active }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setAgents(a => a.map(x => x.id === agent.id ? { ...x, is_active: !x.is_active } : x))
    } catch (e: any) { toast.error(e.message) }
  }

  async function deleteAgent(id: string) {
    if (!confirm('Delete this agent? Their order history will be retained for records.')) return
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      toast.success('Agent deleted')
      setAgents(a => a.filter(x => x.id !== id))
    } catch (e: any) { toast.error(e.message) }
  }

  const totalAgentSales = agents.reduce((s, a) => s + a.total_sales, 0)
  const totalCommission = agents.reduce((s, a) => s + a.total_commission, 0)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agents & Field Sales</h1>
          <p className="text-xs text-gray-400 mt-0.5">Create referral codes, track sales and commissions</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={14} /> Add Agent
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active Agents',    value: agents.filter(a => a.is_active).length, icon: Users },
          { label: 'Total Agent Sales', value: formatPrice(totalAgentSales),           icon: TrendingUp },
          { label: 'Commission Owed',   value: formatPrice(totalCommission),           icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} style={{ color: ACCENT }} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="text-lg font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">New Agent</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Amaka Johnson"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1" style={{ '--tw-ring-color': ACCENT } as any} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="amaka@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1" style={{ '--tw-ring-color': ACCENT } as any} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Temporary Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a login password"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1" style={{ '--tw-ring-color': ACCENT } as any} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Commission Rate (%)</label>
              <input type="number" min="0" max="50" step="0.5" value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1" style={{ '--tw-ring-color': ACCENT } as any} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">A unique referral code is auto-generated. The agent logs in at <strong>{siteUrl}/agent</strong>.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-500 px-4 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={createAgent} disabled={creating}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}>
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              {creating ? 'Creating…' : 'Create Agent'}
            </button>
          </div>
        </div>
      )}

      {/* Agent table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700">Agents ({agents.length})</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading…</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No agents yet. Add your first field sales agent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Agent', 'Code / Referral Link', 'Commission', 'Orders', 'Sales', 'Earned', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => {
                  const refUrl = `${siteUrl}/?ref=${agent.agent_code}`
                  return (
                    <tr key={agent.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-700 text-sm">{agent.name}</p>
                        <p className="text-xs text-gray-400">{agent.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono font-bold">{agent.agent_code}</code>
                          <button onClick={() => copyToClipboard(refUrl)} title="Copy referral link"
                            className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Copy size={12} />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[160px]">{refUrl}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{agent.commission_rate}%</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{agent.total_orders}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: ACCENT }}>{formatPrice(agent.total_sales)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatPrice(agent.total_commission)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(agent)} title={agent.is_active ? 'Deactivate' : 'Activate'}>
                          {agent.is_active
                            ? <ToggleRight size={20} className="text-green-500" />
                            : <ToggleLeft  size={20} className="text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteAgent(agent.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setup note */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
        <strong>DB migration required:</strong> Run <code>supabase/agents-migration.sql</code> once in your Supabase SQL Editor to add <code>agent_code</code> and <code>commission_rate</code> columns before using this page.
      </div>
    </div>
  )
}
