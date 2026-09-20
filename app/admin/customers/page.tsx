'use client'

import { useEffect, useState } from 'react'
import { getOrders } from '@/lib/admin-db'
import { client } from '@/config/client'
import { Users, Tag, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const STORAGE_KEY = (email: string) => `customer_tags_${email.toLowerCase()}`

function loadTags(email: string): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(email)) ?? '[]') } catch { return [] }
}

function saveTags(email: string, tags: string[]) {
  localStorage.setItem(STORAGE_KEY(email), JSON.stringify(tags))
}

type Customer = {
  email: string
  name: string
  phone: string
  orderCount: number
  totalSpent: number
  tags: string[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [tagInput, setTagInput]   = useState<Record<string, string>>({})
  const wholesaleTag = client.wholesale?.tag ?? 'wholesale'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const orders = await getOrders()
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
              tags:       loadTags(email),
            })
          }
        }
        setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  function addTag(email: string, tag: string) {
    const clean = tag.trim().toLowerCase()
    if (!clean) return
    setCustomers(prev => prev.map(c => {
      if (c.email !== email) return c
      if (c.tags.includes(clean)) return c
      const next = [...c.tags, clean]
      saveTags(email, next)
      return { ...c, tags: next }
    }))
    setTagInput(prev => ({ ...prev, [email]: '' }))
    toast.success(`Tag "${clean}" added`)
  }

  function removeTag(email: string, tag: string) {
    setCustomers(prev => prev.map(c => {
      if (c.email !== email) return c
      const next = c.tags.filter(t => t !== tag)
      saveTags(email, next)
      return { ...c, tags: next }
    }))
  }

  function toggleWholesale(email: string, hasWholesale: boolean) {
    if (hasWholesale) removeTag(email, wholesaleTag)
    else addTag(email, wholesaleTag)
  }

  const filtered = customers.filter(c =>
    !search || c.email.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Customers</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {customers.length} unique customers from orders. Assign tags like &ldquo;{wholesaleTag}&rdquo; to unlock wholesale pricing.
          </p>
        </div>
      </div>

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
                <th className="text-left px-4 py-3">Tags</th>
                {client.wholesale?.enabled && (
                  <th className="text-center px-4 py-3 hidden lg:table-cell">Wholesale</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const hasWholesale = c.tags.includes(wholesaleTag)
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
                      <span className="text-sm font-medium text-gray-700">
                        ₦{c.totalSpent.toLocaleString()}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {c.tags.map(tag => (
                          <span key={tag}
                            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: tag === wholesaleTag ? '#eff6ff' : '#f3f4f6',
                              color: tag === wholesaleTag ? '#2563eb' : '#374151',
                            }}>
                            {tag}
                            <button onClick={() => removeTag(c.email, tag)}
                              className="hover:text-red-500 transition-colors">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                        <div className="flex items-center gap-1">
                          <input
                            value={tagInput[c.email] ?? ''}
                            onChange={e => setTagInput(prev => ({ ...prev, [c.email]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addTag(c.email, tagInput[c.email] ?? '')}
                            placeholder="+ tag"
                            className="w-16 px-1.5 py-0.5 text-xs border border-dashed border-gray-300 rounded outline-none focus:border-gray-400"
                          />
                          {(tagInput[c.email] ?? '').trim() && (
                            <button onClick={() => addTag(c.email, tagInput[c.email] ?? '')}
                              className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: ACCENT }}>
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Wholesale toggle */}
                    {client.wholesale?.enabled && (
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <button
                          onClick={() => toggleWholesale(c.email, hasWholesale)}
                          className="w-11 h-6 rounded-full transition-colors relative"
                          style={{ backgroundColor: hasWholesale ? '#2563eb' : '#d1d5db' }}>
                          <span className="absolute top-1 transition-all w-4 h-4 bg-white rounded-full shadow"
                            style={{ left: hasWholesale ? '26px' : '4px' }} />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Tags are stored locally. When Supabase is connected, tags sync to customer profiles automatically.
      </p>
    </div>
  )
}
