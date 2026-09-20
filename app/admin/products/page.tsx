'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus, Search, Edit2, Trash2, Star, Eye, EyeOff,
  Upload, Download, Loader2, X, CheckSquare,
} from 'lucide-react'
import { getProducts, getCategories, deleteProduct, updateProduct, createProduct } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ── CSV helpers ───────────────────────────────────────────────────────────────
const CSV_HEADERS = ['name','description','price','original_price','category','brand','sku','stock','image_1','image_2','image_3','image_4','image_5']

function downloadTemplate() {
  const example = [
    'Classic Leather Belt',
    'Genuine leather belt with silver buckle. Available in black and brown.',
    '7500',
    '12000',
    'Belts',
    'Mynnat Apparels',
    'BELT-001',
    '50',
    'https://example.com/image1.jpg',
    '',
    '',
    '',
    '',
  ]
  const csv = [CSV_HEADERS.join(','), example.map(v => `"${v}"`).join(',')].join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = 'product-upload-template.csv'
  a.click()
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const cols: string[] = []
    let inQ = false, cur = ''
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur); cur = '' }
      else { cur += ch }
    }
    cols.push(cur)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (cols[i] ?? '').trim() })
    return row
  })
}

// ── Bulk Upload Modal ─────────────────────────────────────────────────────────
function BulkUploadModal({
  categories,
  onClose,
  onDone,
}: {
  categories: any[]
  onClose: () => void
  onDone: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows]       = useState<Record<string, string>[]>([])
  const [errors, setErrors]   = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      const errs: string[] = []
      parsed.forEach((r, i) => {
        if (!r.name) errs.push(`Row ${i + 2}: name is required`)
        if (!r.price || isNaN(Number(r.price))) errs.push(`Row ${i + 2}: price must be a number`)
      })
      setErrors(errs)
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  async function upload() {
    if (!rows.length) return
    setUploading(true)
    let done = 0
    const catMap = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c.id]))
    for (const r of rows) {
      if (!r.name || isNaN(Number(r.price))) { done++; setProgress(done); continue }
      const images = [r.image_1, r.image_2, r.image_3, r.image_4, r.image_5].filter(Boolean)
      const catId  = catMap[r.category?.toLowerCase()] ?? null
      try {
        await createProduct({
          name: r.name,
          slug: slugify(r.name) + '-' + Date.now(),
          description: r.description || null,
          price: Number(r.price),
          compare_price: r.original_price ? Number(r.original_price) : null,
          images,
          category_id: catId,
          brand: r.brand || null,
          sku: r.sku || null,
          stock: r.stock ? Number(r.stock) : 0,
          is_active: true,
          is_featured: false,
          product_type: 'physical',
        })
      } catch (e: any) {
        toast.error(`"${r.name}": ${e?.message || 'failed'}`)
      }
      done++
      setProgress(done)
    }
    toast.success(`${done} products uploaded`)
    setUploading(false)
    onDone()
  }

  const validRows = rows.filter(r => r.name && !isNaN(Number(r.price)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Bulk Upload Products</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a CSV file to create multiple products at once</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Step 1: Download template */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">1</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Download the template</p>
              <p className="text-xs text-gray-500 mt-0.5">Fill in your products — name, price, original price, category, images, etc.</p>
            </div>
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0">
              <Download size={13} /> Download Template
            </button>
          </div>

          {/* Step 2: Upload filled CSV */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">2</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Upload your filled CSV</p>
              <p className="text-xs text-gray-500 mt-0.5">
                CSV columns: name, description, price, original_price, category, brand, sku, stock, image_1 … image_5
              </p>
              <button onClick={() => fileRef.current?.click()}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors">
                <Upload size={13} /> Choose CSV File
              </button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }} />
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs font-semibold text-red-600 mb-1">{errors.length} issue{errors.length !== 1 ? 's' : ''} found:</p>
              {errors.map((e, i) => <p key={i} className="text-xs text-red-500">{e}</p>)}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Preview — {validRows.length} valid product{validRows.length !== 1 ? 's' : ''} ready to upload
              </p>
              <div className="rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Category</th>
                      <th className="text-right px-3 py-2">Price</th>
                      <th className="text-right px-3 py-2">Original</th>
                      <th className="text-right px-3 py-2">Stock</th>
                      <th className="text-center px-3 py-2">Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const invalid = !r.name || isNaN(Number(r.price))
                      const imgCount = [r.image_1,r.image_2,r.image_3,r.image_4,r.image_5].filter(Boolean).length
                      return (
                        <tr key={i} className={`border-b border-gray-50 last:border-0 ${invalid ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2 font-medium text-gray-800 max-w-[180px] truncate">{r.name || <span className="text-red-400">MISSING</span>}</td>
                          <td className="px-3 py-2 text-gray-500">{r.category || '—'}</td>
                          <td className="px-3 py-2 text-right font-semibold">{r.price ? `₦${Number(r.price).toLocaleString()}` : <span className="text-red-400">MISSING</span>}</td>
                          <td className="px-3 py-2 text-right text-gray-400">{r.original_price ? `₦${Number(r.original_price).toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-2 text-right">{r.stock || '0'}</td>
                          <td className="px-3 py-2 text-center text-gray-400">{imgCount > 0 ? `${imgCount} 🖼` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Upload progress */}
              {uploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading…</span>
                    <span>{progress}/{rows.length}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ backgroundColor: ACCENT, width: `${(progress / rows.length) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={upload} disabled={uploading || validRows.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ACCENT }}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? `Uploading… (${progress}/${rows.length})` : `Upload ${validRows.length} Product${validRows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Products Page ─────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products,   setProducts]   = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [statusFilter, setStatus]   = useState('')

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  // Modals
  const [showUpload, setShowUpload] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [prods, cats] = await Promise.all([
      getProducts({ search, category: catFilter, status: statusFilter }),
      getCategories(),
    ])
    setProducts(prods)
    setCategories(cats)
    setSelected(new Set())
    setLoading(false)
  }, [search, catFilter, statusFilter])

  useEffect(() => { load() }, [load])

  // ── Selection helpers ──
  const allIds = products.map(p => p.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  // ── Actions ──
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await deleteProduct(id)
    toast.success('Product deleted')
    load()
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} selected product${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setDeleting(true)
    let done = 0
    for (const id of selected) {
      try { await deleteProduct(id); done++ } catch {}
    }
    toast.success(`${done} product${done !== 1 ? 's' : ''} deleted`)
    setDeleting(false)
    load()
  }

  async function toggleActive(p: any) {
    await updateProduct(p.id, { is_active: !p.is_active })
    toast.success(p.is_active ? 'Product hidden' : 'Product published')
    load()
  }

  async function toggleFeatured(p: any) {
    await updateProduct(p.id, { is_featured: !p.is_featured })
    toast.success(p.is_featured ? 'Removed from featured' : 'Marked as featured')
    load()
  }

  return (
    <div className="space-y-4">

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{ backgroundColor: '#fff5f5', borderColor: '#fecaca' }}>
          <CheckSquare size={15} style={{ color: ACCENT }} />
          <span className="font-semibold text-gray-700">{selected.size} product{selected.size !== 1 ? 's' : ''} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              Deselect all
            </button>
            <button onClick={handleBulkDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: ACCENT }}>
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {deleting ? 'Deleting…' : `Delete ${selected.size}`}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-gray-400" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg bg-white outline-none text-gray-600">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg bg-white outline-none text-gray-600">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700">
          <Upload size={14} /> Bulk Upload
        </button>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-[40px_56px_1fr_120px_100px_80px_80px_100px] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {/* Select all */}
          <div className="flex items-center">
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              className="w-4 h-4 rounded cursor-pointer accent-red-500" />
          </div>
          <span />
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Status</span>
          <span className="text-center">Actions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No products found.</p>
            <Link href="/admin/products/new" className="inline-block mt-3 text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
              Add your first product →
            </Link>
          </div>
        ) : (
          products.map(p => (
            <div key={p.id}
              className={`grid grid-cols-1 md:grid-cols-[40px_56px_1fr_120px_100px_80px_80px_100px] gap-3 items-center px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${selected.has(p.id) ? 'bg-red-50/60' : 'hover:bg-gray-50'}`}>
              {/* Checkbox */}
              <div className="flex items-center">
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                  className="w-4 h-4 rounded cursor-pointer accent-red-500" />
              </div>
              {/* Image */}
              <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden relative shrink-0">
                {p.images?.[0]
                  ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="48px" />
                  : <div className="w-full h-full flex items-center justify-center text-base font-bold text-gray-300">{p.name?.charAt(0)}</div>
                }
              </div>
              {/* Name */}
              <div>
                <p className="text-sm font-medium text-gray-700 line-clamp-1">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.sku || '—'}</p>
              </div>
              {/* Category */}
              <p className="text-xs text-gray-500">{p.categories?.name || '—'}</p>
              {/* Price */}
              <div>
                <p className="text-sm font-semibold" style={{ color: ACCENT }}>{formatPrice(p.price)}</p>
                {p.compare_price && <p className="text-xs text-gray-400 line-through">{formatPrice(p.compare_price)}</p>}
              </div>
              {/* Stock */}
              <p className="text-sm font-medium" style={{ color: (p.stock ?? 0) > 0 ? '#16a34a' : '#ef4444' }}>
                {p.stock ?? 0}
              </p>
              {/* Status */}
              <button onClick={() => toggleActive(p)}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-colors"
                style={{
                  backgroundColor: p.is_active ? '#f0fdf4' : '#f9fafb',
                  color: p.is_active ? '#16a34a' : '#9ca3af',
                }}>
                {p.is_active ? <Eye size={11} /> : <EyeOff size={11} />}
                {p.is_active ? 'Active' : 'Hidden'}
              </button>
              {/* Actions */}
              <div className="flex items-center gap-1 justify-end md:justify-center">
                <button onClick={() => toggleFeatured(p)} title={p.is_featured ? 'Remove from featured' : 'Mark as featured'}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
                  <Star size={13} fill={p.is_featured ? '#F5A623' : 'none'} style={{ color: p.is_featured ? '#F5A623' : '#d1d5db' }} />
                </button>
                <Link href={`/admin/products/${p.id}`}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 transition-colors">
                  <Edit2 size={13} className="text-blue-500" />
                </Link>
                <button onClick={() => handleDelete(p.id, p.name)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 transition-colors">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-400">{products.length} product{products.length !== 1 ? 's' : ''} found</p>

      {/* Bulk upload modal */}
      {showUpload && (
        <BulkUploadModal
          categories={categories}
          onClose={() => setShowUpload(false)}
          onDone={() => { setShowUpload(false); load() }}
        />
      )}
    </div>
  )
}
