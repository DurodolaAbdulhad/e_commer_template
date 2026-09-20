'use client'

import { useEffect, useState } from 'react'
import { getAutoDiscounts, createAutoDiscount, updateAutoDiscount, deleteAutoDiscount } from '@/lib/admin-db'
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const EMPTY = { name: '', type: 'percent' as 'percent' | 'fixed', value: 10, min_order: 0, is_active: true }

export default function AutoDiscountsPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  async function load() {
    setLoading(true)
    try { setRules(await getAutoDiscounts()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm({ ...EMPTY }); setModal(true) }
  function openEdit(r: any) { setEditing(r); setForm({ name: r.name, type: r.type, value: r.value, min_order: r.min_order, is_active: r.is_active }); setModal(true) }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    try {
      if (editing) await updateAutoDiscount(editing.id, form)
      else await createAutoDiscount(form)
      toast.success(editing ? 'Updated' : 'Rule created')
      setModal(false); load()
    } catch { toast.error('Failed to save') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this rule?')) return
    try { await deleteAutoDiscount(id); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  async function toggleActive(r: any) {
    try { await updateAutoDiscount(r.id, { is_active: !r.is_active }); load() } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{rules.length} rule{rules.length !== 1 ? 's' : ''} — applied automatically at checkout when the order meets the threshold</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> Add Rule
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="py-16 text-center">
            <Zap size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No auto-discount rules yet.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_100px_120px_110px_80px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Rule</span><span>Type</span><span>Min Order</span><span>Discount</span><span></span>
            </div>
            {rules.map(r => (
              <div key={r.id} className="grid grid-cols-[1fr_100px_120px_110px_80px] gap-3 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="text-sm text-gray-600 capitalize">{r.type}</span>
                <span className="text-sm text-gray-600">{formatPrice(r.min_order)}</span>
                <span className="text-sm font-semibold text-green-700">
                  {r.type === 'percent' ? `-${r.value}%` : `-${formatPrice(r.value)}`}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(r)} className="text-gray-400 hover:text-gray-700 transition-colors">
                    {r.is_active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-800">{editing ? 'Edit Rule' : 'New Auto-Discount Rule'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rule Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Spend ₦50k Save 10%" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400">
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{form.type === 'percent' ? 'Discount %' : 'Discount ₦'}</label>
                  <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Order (₦)</label>
                <input type="number" value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: +e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                {editing ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
