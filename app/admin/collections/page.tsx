'use client'

import { useEffect, useState } from 'react'
import { getCollections, createCollection, updateCollection, deleteCollection } from '@/lib/admin-db'
import { Layers, Plus, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const CONDITION_TYPES = [
  { value: 'tag', label: 'Product tag' },
  { value: 'category', label: 'Category' },
  { value: 'vendor', label: 'Brand / Vendor' },
  { value: 'price_lte', label: 'Price ≤' },
  { value: 'price_gte', label: 'Price ≥' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'on_sale', label: 'On sale (has compare price)' },
  { value: 'manual', label: 'Manual (no conditions)' },
]

const EMPTY = { name: '', slug: '', description: '', condition_type: 'tag', condition_value: '', sort_by: 'created_at', is_active: true }

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  async function load() {
    setLoading(true)
    try { setCollections(await getCollections()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm({ ...EMPTY }); setModal(true) }
  function openEdit(c: any) {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', condition_type: c.condition_type, condition_value: c.condition_value ?? '', sort_by: c.sort_by ?? 'created_at', is_active: c.is_active })
    setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const slug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    try {
      if (editing) await updateCollection(editing.id, { ...form, slug })
      else await createCollection({ ...form, slug })
      toast.success(editing ? 'Updated' : 'Collection created')
      setModal(false); load()
    } catch { toast.error('Failed to save') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this collection?')) return
    try { await deleteCollection(id); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  async function toggleActive(c: any) {
    try { await updateCollection(c.id, { is_active: !c.is_active }); load() } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Collections group products automatically by rules — power flash deals, sale pages, and category hubs</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> New Collection
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : collections.length === 0 ? (
          <div className="py-16 text-center">
            <Layers size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No collections yet.</p>
            <p className="text-xs text-gray-400 mt-1">Create a &ldquo;Sale&rdquo; collection with condition &ldquo;on sale&rdquo; to auto-populate your sale page.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_160px_120px_70px_60px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Name</span><span>Slug</span><span>Condition</span><span>Status</span><span></span>
            </div>
            {collections.map(c => (
              <div key={c.id} className="grid grid-cols-[1fr_160px_120px_70px_60px] gap-3 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-400 truncate">{c.description}</p>}
                </div>
                <code className="text-xs font-mono text-gray-500">/{c.slug}</code>
                <div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {CONDITION_TYPES.find(t => t.value === c.condition_type)?.label ?? c.condition_type}
                  </span>
                  {c.condition_value && <p className="text-xs text-gray-400 mt-0.5">= {c.condition_value}</p>}
                </div>
                <button onClick={() => toggleActive(c)} className="flex items-center">
                  {c.is_active
                    ? <ToggleRight size={20} className="text-green-600" />
                    : <ToggleLeft size={20} className="text-gray-300" />}
                </button>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-800">{editing ? 'Edit Collection' : 'New Collection'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Summer Sale" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug (URL)</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated from name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Condition Type</label>
                <select value={form.condition_type} onChange={e => setForm(f => ({ ...f, condition_type: e.target.value, condition_value: '' }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400">
                  {CONDITION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {!['in_stock', 'on_sale', 'manual'].includes(form.condition_type) && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Condition Value</label>
                  <input value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))}
                    placeholder={form.condition_type === 'price_lte' || form.condition_type === 'price_gte' ? '5000' : 'e.g. sale, nike, electronics'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
                <select value={form.sort_by} onChange={e => setForm(f => ({ ...f, sort_by: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400">
                  <option value="created_at">Newest first</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="rating">Best rated</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                {editing ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
