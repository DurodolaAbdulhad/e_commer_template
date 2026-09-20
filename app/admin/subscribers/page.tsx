'use client'

import { useEffect, useState } from 'react'
import { Mail, Download } from 'lucide-react'
import { getSubscribers } from '@/lib/admin-db'

const ACCENT = '#e84c3d'

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    getSubscribers().then(data => { setSubscribers(data); setLoading(false) })
  }, [])

  function exportCSV() {
    const csv = ['Email,Date', ...subscribers.map(s => `${s.email},${s.created_at ?? ''}`).join('\n')].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'subscribers.csv'
    a.click()
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}</p>
        {subscribers.length > 0 && (
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
        ) : subscribers.length === 0 ? (
          <div className="py-16 text-center">
            <Mail size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No subscribers yet.</p>
            <p className="text-xs text-gray-400 mt-1">Newsletter signups from the footer will appear here.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_160px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Email</span>
              <span>Subscribed</span>
            </div>
            {subscribers.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_160px] gap-4 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: ACCENT }}>
                    {s.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700">{s.email}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
