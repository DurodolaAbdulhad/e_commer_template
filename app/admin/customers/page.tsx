'use client'

import { useEffect, useState } from 'react'
import { getOrders, getCustomerTierMap, setCustomerTier, removeCustomerTier, getPricingTiers } from '@/lib/admin-db'
import { Users, Search, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'

const ACCENT = '#e84c3d'

type PricingTier = { tag: string; label: string; discountPercent: number; color: string; minOrder?: number }

type Customer = {
  email: string
  name: string
  phone: string
  orderCount: number
  totalSpent: number
  tier: string | null
}

export default function CustomersPage() {
  const [customers, setCustomers]     = useState<Customer[]>([])
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState<Record<string, boolean>>({})
  const [search, setSearch]           = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [orders, tierMap, tiers] = await Promise.all([
          getOrders(),
          getCustomerTierMap(),
          getPricingTiers(),
        ])
        setPricingTiers(tiers)
        const map = new Map<string, Customer>()
        for (const order of orders) {
          const email = order.address?.email || order.email || ''
          if (!email) continue
          const existing = map.get(email)
          if (existing) {
            existing.orderCount++
            existing.totalSpent += order.total ?? 0
          } else {
            map.set(email, {
              email,
              name:       order.address?.fullName || order.address?.firstName || '',
              phone:      order.address?.phone || '',
              orderCount: 1,
              totalSpent: order.total ?? 0,
              tier:       (tierMap as Record<string, string>)[email.toLowerCase()] ?? null,
            })
          }
        }
        setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  async function handleTierChange(email: string, tier: string) {
    setSaving(prev => ({ ...prev, [email]: true }))
    try {
      if (tier === '') {
        await removeCustomerTier(email)
        setCustomers(prev => prev.map(c => c.email === email ? { ...c, tier: null } : c))
        toast.success('Tier removed')
      } else {
        await setCustomerTier(email, tier)
        setCustomers(prev => prev.map(c => c.email === email ? { ...c, tier } : c))
        const tierLabel = pricingTiers.find(t => t.tag === tier)?.label ?? tier
        toast.success(`${tierLabel} tier assigned`)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save tier')
    }
    setSaving(prev => ({ ...prev, [email]: false }))
  }

  const filtered = customers.filter(c =>
    !search || c.email.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  )

  const tierColor = (tag: string | null) => {
    if (!tag) return { bg: '#f3f4f6', text: '#6b7280' }
    const t = pricingTiers.find(t => t.tag === tag)
    return t ? { bg: `${t.color}18`, text: t.color } : { bg: '#f3f4f6', text: '#6b7280' }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Customers</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {customers.length} unique customers · assign pricing tiers for reseller / distributor discounts
          </p>
        </div>
      </div>

      {/* Tier legend */}
      {pricingTiers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pricingTiers.map(t => (
            <div key={t.tag}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{ color: t.color, borderColor: `${t.color}40`, backgroundColor: `${t.color}10` }}>
              <span>{t.label}</span>
              <span className="opacity-60">— {t.discountPercent}% off{t.minOrder ? ` on orders ≥ ${formatPrice(t.minOrder)}` : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No customers found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Orders</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Total Spent</th>
                <th className="text-left px-4 py-3">Pricing Tier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const colors = tierColor(c.tier)
                const tierLabel = c.tier ? (pricingTiers.find(t => t.tag === c.tier)?.label ?? c.tier) : null
                return (
                  <tr key={c.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    {/* Customer */}
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 text-sm">{c.name || '—'}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                      {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-600">{c.orderCount}</span>
                    </td>

                    {/* Total spent */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm font-medium text-gray-700">{formatPrice(c.totalSpent)}</span>
                    </td>

                    {/* Tier selector */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tierLabel && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: colors.bg, color: colors.text }}>
                            {tierLabel}
                          </span>
                        )}
                        {pricingTiers.length > 0 ? (
                          <div className="relative">
                            <select
                              value={c.tier ?? ''}
                              onChange={e => handleTierChange(c.email, e.target.value)}
                              disabled={saving[c.email]}
                              className="appearance-none text-xs border border-gray-200 rounded-lg pl-2.5 pr-6 py-1.5 outline-none focus:border-gray-400 bg-white text-gray-600 disabled:opacity-50 cursor-pointer"
                            >
                              <option value="">No tier</option>
                              {pricingTiers.map(t => (
                                <option key={t.tag} value={t.tag}>
                                  {t.label} ({t.discountPercent}% off)
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No tiers configured</span>
                        )}
                        {saving[c.email] && (
                          <div className="w-3 h-3 rounded-full border border-gray-300 border-t-gray-600 animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Tier assignments are stored in the database and applied automatically at checkout when a customer enters their email.
        {pricingTiers.length === 0 && ' Configure pricing tiers in the client config (pricingTiers array).'}
      </p>
    </div>
  )
}
