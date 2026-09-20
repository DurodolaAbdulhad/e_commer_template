'use client'

import { useEffect, useState } from 'react'
import { getDraftOrders, createDraftOrder, updateDraftOrder, deleteDraftOrder, getProducts } from '@/lib/admin-db'
import { FileText, Plus, Trash2, Send, X } from 'lucide-react'
import { formatPrice, generateOrderNumber } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

export default function DraftOrdersPage() {
  const [drafts, setDrafts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    notes: '', items: [] as { id: string; name: string; price: number; quantity: number }[],
  })
  const [productSearch, setProductSearch] = useState('')
  const [qty, setQty] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [d, p] = await Promise.all([getDraftOrders(), getProducts()])
      setDrafts(d); setProducts(p)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filteredProducts = products.filter(p =>
    p.is_active && p.name.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 6)

  function addItem() {
    if (!selectedProduct) return
    setForm(f => {
      const exists = f.items.findIndex(i => i.id === selectedProduct.id)
      if (exists >= 0) {
        const items = [...f.items]
        items[exists] = { ...items[exists], quantity: items[exists].quantity + qty }
        return { ...f, items }
      }
      return { ...f, items: [...f.items, { id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, quantity: qty }] }
    })
    setSelectedProduct(null); setProductSearch(''); setQty(1)
  }

  function removeItem(id: string) {
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }))
  }

  const subtotal = form.items.reduce((s, i) => s + i.price * i.quantity, 0)

  async function handleCreate() {
    if (!form.customer_name.trim() || !form.customer_email.trim()) {
      toast.error('Customer name and email are required'); return
    }
    if (form.items.length === 0) { toast.error('Add at least one product'); return }
    try {
      await createDraftOrder({ ...form, subtotal, total: subtotal, order_number: generateOrderNumber() })
      toast.success('Draft order created')
      setModal(false)
      setForm({ customer_name: '', customer_email: '', customer_phone: '', notes: '', items: [] })
      load()
    } catch { toast.error('Failed to create') }
  }

  async function convertToOrder(draft: any) {
    if (!confirm('Mark this draft as a confirmed order?')) return
    try {
      await updateDraftOrder(draft.id, { status: 'confirmed', confirmed_at: new Date().toISOString() })
      toast.success('Converted to order')
      load()
    } catch { toast.error('Failed') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this draft?')) return
    try { await deleteDraftOrder(id); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Create orders on behalf of customers — phone orders, WhatsApp orders, in-store pickups</p>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> New Draft Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No draft orders yet.</p>
            <p className="text-xs text-gray-400 mt-1">Use this to record phone or WhatsApp orders.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_160px_100px_90px_80px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Customer</span><span>Order #</span><span>Total</span><span>Status</span><span></span>
            </div>
            {drafts.map(d => (
              <div key={d.id} className="grid grid-cols-[1fr_160px_100px_90px_80px] gap-3 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{d.customer_name}</p>
                  <p className="text-xs text-gray-400">{d.customer_email}</p>
                </div>
                <span className="text-xs font-mono text-gray-600">{d.order_number}</span>
                <span className="text-sm font-semibold text-gray-800">{formatPrice(d.total ?? d.subtotal)}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                  d.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {d.status === 'confirmed' ? 'Confirmed' : 'Draft'}
                </span>
                <div className="flex items-center gap-1.5">
                  {d.status === 'draft' && (
                    <button onClick={() => convertToOrder(d)} title="Convert to order"
                      className="text-blue-400 hover:text-blue-700 transition-colors"><Send size={14} /></button>
                  )}
                  <button onClick={() => handleDelete(d.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">New Draft Order</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Full name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                  placeholder="email@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                  placeholder="+234 800 000 0000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Add Products</label>
              <div className="flex gap-2 mb-2">
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search products…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                <input type="number" value={qty} onChange={e => setQty(Math.max(1, +e.target.value))}
                  min={1} className="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none text-center" />
                <button onClick={addItem} disabled={!selectedProduct}
                  className="px-3 py-2 text-xs font-bold text-white rounded-lg disabled:opacity-40" style={{ backgroundColor: ACCENT }}>
                  Add
                </button>
              </div>
              {productSearch && filteredProducts.length > 0 && (
                <div className="border border-gray-100 rounded-lg overflow-hidden mb-3">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => { setSelectedProduct(p); setProductSearch(p.name) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex justify-between ${selectedProduct?.id === p.id ? 'bg-blue-50' : ''}`}>
                      <span className="font-medium text-gray-800">{p.name}</span>
                      <span className="text-gray-500">{formatPrice(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.items.length > 0 && (
                <div className="space-y-1.5">
                  {form.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-700">{item.name} × {item.quantity}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800">{formatPrice(item.price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500"><X size={13} /></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-2 font-bold text-sm text-gray-800 border-t border-gray-100">
                    <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Delivery instructions, source (phone/WhatsApp)…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
