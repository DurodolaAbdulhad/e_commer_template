'use client'

import { useEffect, useState } from 'react'
import { getBackInStockAlerts, deleteBackInStockAlert } from '@/lib/admin-db'
import { Bell, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

const ACCENT = '#e84c3d'

export default function BackInStockPage() {
  const [alerts,  setAlerts]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try { setAlerts(await getBackInStockAlerts()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Remove this alert?')) return
    try { await deleteBackInStockAlert(id); toast.success('Removed'); load() }
    catch { toast.error('Failed to remove') }
  }

  function exportCSV() {
    const csv = [
      'Product,Email,Date',
      ...alerts.map(a => `"${a.productName ?? a.product_name ?? ''}","${a.email}","${a.createdAt ?? a.created_at ?? ''}"`)
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'back-in-stock-alerts.csv'
    link.click()
  }

  // Group by product
  const byProduct: Record<string, any[]> = {}
  alerts.forEach(a => {
    const key = a.productId ?? a.product_id ?? 'unknown'
    if (!byProduct[key]) byProduct[key] = []
    byProduct[key].push(a)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''} across {Object.keys(byProduct).length} product{Object.keys(byProduct).length !== 1 ? 's' : ''}
        </p>
        {alerts.length > 0 && (
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No back-in-stock alerts yet.</p>
            <p className="text-xs text-gray-400 mt-1">Alerts appear here when customers sign up on out-of-stock product pages.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_180px_140px_40px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Product</span><span>Email</span><span>Date</span><span></span>
            </div>
            {alerts.map((a, i) => {
              const productName = a.productName ?? a.product_name ?? a.products?.name ?? 'Unknown product'
              const image = a.products?.images?.[0]
              const date = a.createdAt ?? a.created_at
              return (
                <div key={a.id ?? i}
                  className="grid grid-cols-[1fr_180px_140px_40px] gap-4 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    {image ? (
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <Image src={image} alt={productName} fill unoptimized className="object-cover" sizes="36px" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Bell size={14} className="text-gray-300" />
                      </div>
                    )}
                    <span className="text-sm text-gray-700 font-medium truncate">{productName}</span>
                  </div>
                  <span className="text-sm text-gray-600 truncate">{a.email}</span>
                  <span className="text-xs text-gray-400">
                    {date ? new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                  <button onClick={() => handleDelete(a.id ?? i.toString())}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {Object.keys(byProduct).length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">By Product</p>
          <div className="space-y-2">
            {Object.entries(byProduct)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([key, items]) => {
                const name = items[0]?.productName ?? items[0]?.product_name ?? key
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">{name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 ml-2"
                      style={{ backgroundColor: ACCENT }}>
                      {items.length}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
