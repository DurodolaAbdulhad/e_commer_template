'use client'

import { useEffect, useState } from 'react'
import { getGiftCards, createGiftCard, deleteGiftCard } from '@/lib/admin-db'
import { Gift, Plus, Trash2, Copy } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

export default function GiftCardsPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ initial_value: 5000, recipient_email: '', note: '' })

  async function load() {
    setLoading(true)
    try { setCards(await getGiftCards()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.initial_value || form.initial_value < 100) { toast.error('Minimum gift card value is ₦100'); return }
    try {
      await createGiftCard(form)
      toast.success('Gift card created')
      setModal(false); setForm({ initial_value: 5000, recipient_email: '', note: '' }); load()
    } catch { toast.error('Failed to create') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this gift card? This cannot be undone.')) return
    try { await deleteGiftCard(id); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.success('Code copied!')).catch(() => {})
  }

  const totalOutstanding = cards.filter(c => c.is_active).reduce((s, c) => s + (c.balance ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total cards', value: cards.length },
          { label: 'Active', value: cards.filter(c => c.is_active).length },
          { label: 'Outstanding value', value: formatPrice(totalOutstanding) },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> Issue Gift Card
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="py-16 text-center">
            <Gift size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No gift cards issued yet.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_130px_100px_100px_90px_36px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Code</span><span>Recipient</span><span>Value</span><span>Balance</span><span>Status</span><span></span>
            </div>
            {cards.map(c => (
              <div key={c.id} className="grid grid-cols-[1fr_130px_100px_100px_90px_36px] gap-3 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-gray-50 border border-gray-100 px-2 py-1 rounded text-gray-700">{c.code}</code>
                  <button onClick={() => copyCode(c.code)} className="text-gray-300 hover:text-gray-600 transition-colors"><Copy size={13} /></button>
                </div>
                <span className="text-xs text-gray-500 truncate">{c.recipient_email || '—'}</span>
                <span className="text-sm text-gray-600">{formatPrice(c.initial_value)}</span>
                <span className="text-sm font-semibold text-gray-800">{formatPrice(c.balance)}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.is_active ? 'Active' : 'Used'}
                </span>
                <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-800">Issue New Gift Card</h2>
            <p className="text-xs text-gray-500">A unique code is generated automatically. Share it with the recipient.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Value (₦)</label>
                <select value={form.initial_value} onChange={e => setForm(f => ({ ...f, initial_value: +e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  {[1000, 2500, 5000, 10000, 20000, 50000].map(v => (
                    <option key={v} value={v}>{formatPrice(v)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Recipient Email (optional)</label>
                <input type="email" value={form.recipient_email} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))}
                  placeholder="customer@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Happy Birthday!"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                Issue Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
