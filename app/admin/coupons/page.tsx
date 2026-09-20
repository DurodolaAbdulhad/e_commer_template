'use client'

import { useEffect, useState } from 'react'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/admin-db'
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const EMPTY = {
  code: '', type: 'percent', value: 10, min_order: 0,
  max_uses: '', expires_at: '', is_active: true,
}

function badge(type: string) {
  const map: Record<string, string> = { percent: 'bg-blue-50 text-blue-700', fixed: 'bg-purple-50 text-purple-700', shipping: 'bg-green-50 text-green-700' }
  const label: Record<string, string> = { percent: '% Off', fixed: 'Fixed', shipping: 'Free Ship' }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[type] ?? ''}`}>{label[type] ?? type}</span>
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form,    setForm]    = useState<any>(EMPTY)
  const [saving,  setSaving]  = useState(false)

  async function load() {
    setLoading(true)
    try { setCoupons(await getCoupons()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm(EMPTY); setModal(true) }
  function openEdit(c: any) {
    setEditing(c)
    setForm({ ...c, max_uses: c.max_uses ?? '', expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '' })
    setModal(true)
  }
  function closeModal() { setModal(false); setEditing(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim()) { toast.error('Code is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().replace(/\s/g, ''),
        value: Number(form.value),
        min_order: Number(form.min_order) || 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }
      if (editing) {
        await updateCoupon(editing.id, payload)
        toast.success('Coupon updated')
      } else {
        await createCoupon(payload)
        toast.success('Coupon created')
      }
      closeModal()
      load()
    } catch (e: any) { console.error('createCoupon:', e); toast.error(e?.message ?? 'Failed to save coupon') }
    setSaving(false)
  }

  async function handleToggle(c: any) {
    try {
      await updateCoupon(c.id, { is_active: !c.is_active })
      load()
    } catch { toast.error('Failed to update') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return
    try { await deleteCoupon(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> New Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center">
            <Tag size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No coupons yet.</p>
            <button onClick={openNew} className="mt-3 text-sm font-semibold underline" style={{ color: ACCENT }}>
              Create your first coupon
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_90px_100px_80px_80px_80px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Code</span><span>Type</span><span>Value</span><span>Min Order</span><span>Uses</span><span>Actions</span>
            </div>
            {coupons.map(c => (
              <div key={c.id}
                className={`grid grid-cols-[1fr_90px_100px_80px_80px_80px] gap-4 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${!c.is_active ? 'opacity-50' : ''}`}>
                <div>
                  <span className="font-mono text-sm font-bold text-gray-800">{c.code}</span>
                  {c.expires_at && (
                    <p className="text-[10px] text-gray-400 mt-0.5">Expires {new Date(c.expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  )}
                </div>
                <div>{badge(c.type)}</div>
                <div className="text-sm font-semibold text-gray-700">
                  {c.type === 'percent' ? `${c.value}%` : c.type === 'fixed' ? formatPrice(c.value) : 'Free shipping'}
                </div>
                <div className="text-xs text-gray-500">{c.min_order ? formatPrice(c.min_order) : '—'}</div>
                <div className="text-xs text-gray-500">{c.uses ?? 0}{c.max_uses ? `/${c.max_uses}` : ''}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(c)} className="text-gray-400 hover:text-gray-700 transition-colors">
                    {c.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-gray-700 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Code <span className="text-red-400">*</span></label>
                <input value={form.code} onChange={e => setForm((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-gray-400 uppercase"
                  placeholder="e.g. SAVE20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400">
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="shipping">Free Shipping</option>
                  </select>
                </div>
                {form.type !== 'shipping' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      {form.type === 'percent' ? 'Percentage (%)' : 'Amount (₦)'}
                    </label>
                    <input type="number" value={form.value} onChange={e => setForm((p: any) => ({ ...p, value: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                      min="0" max={form.type === 'percent' ? 100 : undefined} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min. Order (₦)</label>
                  <input type="number" value={form.min_order} onChange={e => setForm((p: any) => ({ ...p, min_order: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="0 = no minimum" min="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm((p: any) => ({ ...p, max_uses: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="Leave blank = unlimited" min="1" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expiry Date</label>
                <input type="date" value={form.expires_at} onChange={e => setForm((p: any) => ({ ...p, expires_at: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm((p: any) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
