'use client'

import { useEffect, useState } from 'react'
import { Mail, Download, MessageCircle } from 'lucide-react'
import { getSubscribers } from '@/lib/admin-db'

const ACCENT = '#e84c3d'

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  popup:    { label: 'Popup',   color: '#7c3aed' },
  footer:   { label: 'Footer',  color: '#0369a1' },
  checkout: { label: 'Checkout', color: '#b45309' },
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    getSubscribers().then(data => { setSubscribers(data); setLoading(false) })
  }, [])

  function exportCSV() {
    const rows = ['Email,WhatsApp,Source,Date']
    subscribers.forEach(s => {
      rows.push([
        s.email ?? '',
        s.whatsapp ?? '',
        s.source ?? '',
        s.created_at ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    })
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'))
    a.download = 'subscribers.csv'
    a.click()
  }

  return (
    <div className="max-w-3xl space-y-4">
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
            <p className="text-xs text-gray-400 mt-1">Newsletter signups from the popup and footer will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">WhatsApp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s, i) => {
                  const src = SOURCE_LABELS[s.source] ?? { label: s.source ?? '—', color: '#6b7280' }
                  return (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: ACCENT }}>
                            {s.email?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {s.whatsapp ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <MessageCircle size={12} className="text-green-500 shrink-0" />
                            {s.whatsapp}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: src.color }}>
                          {src.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-400">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
