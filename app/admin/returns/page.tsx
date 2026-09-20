'use client'

import { useEffect, useState } from 'react'
import { getReturns, updateReturn } from '@/lib/admin-db'
import { RotateCcw, Check, X, Download } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  refunded: 'bg-blue-50 text-blue-700',
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  async function load() {
    setLoading(true)
    try { setReturns(await getReturns()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function setStatus(id: string, status: string) {
    try {
      await updateReturn(id, { status, updated_at: new Date().toISOString() })
      toast.success(`Return marked as ${status}`)
      load()
    } catch { toast.error('Failed to update') }
  }

  function exportCSV() {
    const rows = returns.map(r =>
      `"${r.order_number}","${r.customer_email}","${r.reason}","${r.status}","${r.created_at}"`
    )
    const csv = ['Order #,Email,Reason,Status,Date', ...rows].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'returns.csv'; a.click()
  }

  const filtered = filter === 'all' ? returns : returns.filter(r => r.status === filter)
  const pending = returns.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected', 'refunded'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors capitalize ${
                filter === s ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={filter === s ? { backgroundColor: ACCENT } : {}}>
              {s}{s === 'pending' && pending > 0 ? ` (${pending})` : ''}
            </button>
          ))}
        </div>
        {returns.length > 0 && (
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <RotateCcw size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No return requests {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[120px_1fr_140px_90px_100px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Order #</span><span>Reason</span><span>Customer</span><span>Status</span><span>Actions</span>
            </div>
            {filtered.map(r => (
              <div key={r.id} className="grid grid-cols-[120px_1fr_140px_90px_100px] gap-3 items-start px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <div>
                  <p className="text-xs font-mono text-gray-800">{r.order_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.reason}</p>
                  {r.items && <p className="text-xs text-gray-400 mt-1">{Array.isArray(r.items) ? r.items.map((i: any) => i.name).join(', ') : r.items}</p>}
                </div>
                <p className="text-xs text-gray-500 truncate">{r.customer_email}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit capitalize ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {r.status}
                </span>
                <div className="flex items-center gap-1.5">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => setStatus(r.id, 'approved')} title="Approve"
                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"><Check size={13} /></button>
                      <button onClick={() => setStatus(r.id, 'rejected')} title="Reject"
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><X size={13} /></button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => setStatus(r.id, 'refunded')}
                      className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                      Mark Refunded
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
