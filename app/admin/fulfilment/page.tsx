'use client'

import { useEffect, useState } from 'react'
import { Package, CheckCircle, Truck, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdmin } from '@/hooks/useAdmin'

const ACCENT = '#e84c3d'

const STAGES = [
  { key: 'paid',       label: 'Paid',       icon: CheckCircle, color: '#6366f1' },
  { key: 'packing',    label: 'Packing',    icon: Package,     color: '#f59e0b' },
  { key: 'packed',     label: 'Packed',     icon: Check,       color: '#10b981' },
  { key: 'dispatched', label: 'Dispatched', icon: Truck,       color: '#3b82f6' },
] as const

type Stage = (typeof STAGES)[number]['key']

interface Order {
  id: string
  order_number: string
  customer_name: string
  total_amount: number
  created_at: string
  fulfilment_stage: Stage
  source: string
}

export default function FulfilmentPage() {
  const { token } = useAdmin()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await fetch('/api/admin/fulfilment', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setOrders(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function moveStage(orderId: string, newStage: Stage) {
    try {
      const res = await fetch(`/api/admin/fulfilment/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fulfilment_stage: newStage }),
      })
      if (!res.ok) throw new Error('Update failed')
      setOrders(o => o.map(x => x.id === orderId ? { ...x, fulfilment_stage: newStage } : x))
      toast.success(`Moved to ${newStage}`)
    } catch (e: any) { toast.error(e.message) }
  }

  function nextStage(current: Stage): Stage | null {
    const idx = STAGES.findIndex(s => s.key === current)
    return idx < STAGES.length - 1 ? STAGES[idx + 1].key : null
  }

  const columns = STAGES.map(s => ({
    ...s,
    orders: orders.filter(o => o.fulfilment_stage === s.key),
  }))

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Truck size={18} style={{ color: ACCENT }} />
        <h1 className="text-lg font-bold text-gray-800">Fulfilment</h1>
        <span className="text-xs text-gray-400 ml-1">Paid orders pipeline</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading orders…</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {columns.map(col => {
            const Icon = col.icon
            return (
              <div key={col.key} className="bg-gray-50 rounded-2xl p-3 min-h-[400px]">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} style={{ color: col.color }} />
                  <span className="text-xs font-bold text-gray-700">{col.label}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: col.color + '20', color: col.color }}>
                    {col.orders.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {col.orders.map(order => {
                    const next = nextStage(order.fulfilment_stage)
                    const nextLabel = next ? STAGES.find(s => s.key === next)?.label : null
                    return (
                      <div key={order.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div>
                            <p className="text-xs font-bold text-gray-800">{order.order_number}</p>
                            <p className="text-[10px] text-gray-500">{order.customer_name}</p>
                          </div>
                          {order.source && order.source !== 'web' && (
                            <span className={`text-[9px] px-1 py-0.5 rounded font-bold flex-shrink-0 ${
                              order.source.startsWith('whatsapp') ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {order.source.startsWith('whatsapp') ? 'WA' : 'IG'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold mb-2" style={{ color: ACCENT }}>
                          ₦{Number(order.total_amount).toLocaleString()}
                        </p>
                        {nextLabel && (
                          <button
                            onClick={() => moveStage(order.id, next!)}
                            className="w-full text-[10px] font-bold py-1 rounded-lg text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: col.color }}>
                            → Mark {nextLabel}
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {col.orders.length === 0 && (
                    <p className="text-[10px] text-gray-300 text-center py-4">No orders</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
