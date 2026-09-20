'use client'

import { useEffect, useState } from 'react'
import { getBundles, createBundle, updateBundle, deleteBundle, getProducts } from '@/lib/admin-db'
import { Package, Plus, Trash2, Edit2, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

export default function BundlesPage() {
  const [bundles, setBundles] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', bundle_price: 0, product_ids: [] as string[], is_active: true })
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [b, p] = await Promise.all([getBundles(), getProducts()])
      setBundles(b); setProducts(p)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm({ name: '', bundle_price: 0, product_ids: [], is_active: true }); setModal(true) }
  function openEdit(b: any) {
    setEditing(b)
    setForm({ name: b.name, bundle_price: b.bundle_price, product_ids: b.product_ids ?? [], is_active: b.is_active })
    setModal(true)
  }

  const bundledProducts = products.filter(p => form.product_ids.includes(p.id))
  const retailTotal = bundledProducts.reduce((s, p) => s + p.price, 0)
  const savings = retailTotal - form.bundle_price

  function toggleProduct(id: string) {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id) ? f.product_ids.filter(x => x !== id) : [...f.product_ids, id],
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (form.product_ids.length < 2) { toast.error('A bundle needs at least 2 products'); return }
    if (form.bundle_price <= 0) { toast.error('Set a bundle price'); return }
    try {
      if (editing) await updateBundle(editing.id, form)
      else await createBundle(form)
      toast.success(editing ? 'Updated' : 'Bundle created')
      setModal(false); load()
    } catch { toast.error('Failed to save') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bundle?')) return
    try { await deleteBundle(id); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  const filtered = products.filter(p => p.is_active && p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Bundle products together at a special price to increase average order value</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> New Bundle
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : bundles.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No bundles yet.</p>
            <p className="text-xs text-gray-400 mt-1">Create a bundle like &ldquo;Phone + Case + Charger&rdquo; at 15% off retail.</p>
          </div>
        ) : (
          <div>
            {bundles.map(b => {
              const pids: string[] = b.product_ids ?? []
              const items = products.filter(p => pids.includes(p.id))
              const retail = items.reduce((s, p) => s + p.price, 0)
              return (
                <div key={b.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-800">{b.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{items.map(p => p.name).join(' + ') || `${pids.length} products`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-800">{formatPrice(b.bundle_price)}</p>
                    {retail > 0 && <p className="text-xs text-green-600">Save {formatPrice(retail - b.bundle_price)}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(b)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(b.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">{editing ? 'Edit Bundle' : 'New Bundle'}</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bundle Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Phone + Case + Charger Bundle"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Select Products (min. 2)</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 mb-2" />
              <div className="border border-gray-100 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {filtered.map(p => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                    <input type="checkbox" checked={form.product_ids.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                    <span className="flex-1 text-sm text-gray-700">{p.name}</span>
                    <span className="text-xs text-gray-500">{formatPrice(p.price)}</span>
                  </label>
                ))}
              </div>
            </div>

            {bundledProducts.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                {bundledProducts.map(p => (
                  <div key={p.id} className="flex justify-between text-xs text-gray-600">
                    <span>{p.name}</span><span>{formatPrice(p.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-semibold text-gray-700 border-t border-gray-200 pt-1.5">
                  <span>Retail total</span><span>{formatPrice(retailTotal)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-green-700">
                    <span>Customer saves</span><span>{formatPrice(savings)} ({Math.round(savings / retailTotal * 100)}%)</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bundle Price (₦) *</label>
              <input type="number" value={form.bundle_price} onChange={e => setForm(f => ({ ...f, bundle_price: +e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span className="text-sm text-gray-700">Active</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                {editing ? 'Save Changes' : 'Create Bundle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
