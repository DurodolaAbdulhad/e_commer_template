'use client'

import { useEffect, useRef, useState } from 'react'
import { getProducts, updateProduct } from '@/lib/admin-db'
import { Save, Download, Upload, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

type Row = {
  id: string
  name: string
  price: number
  compare_price: number
  stock: number
  sku: string
  is_active: boolean
  dirty?: boolean
}

export default function BulkEditPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      const products = await getProducts()
      setRows(products.map((p: any) => ({
        id: p.id, name: p.name, price: p.price, compare_price: p.compare_price ?? 0,
        stock: p.stock ?? 0, sku: p.sku ?? '', is_active: p.is_active ?? true, dirty: false,
      })))
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function update(id: string, field: keyof Row, value: any) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value, dirty: true } : r))
  }

  async function saveAll() {
    const dirty = rows.filter(r => r.dirty)
    if (!dirty.length) { toast('No changes to save'); return }
    setSaving(true)
    let saved = 0
    for (const r of dirty) {
      try {
        await updateProduct(r.id, { price: r.price, compare_price: r.compare_price || null, stock: r.stock, sku: r.sku, is_active: r.is_active })
        saved++
      } catch {}
    }
    toast.success(`Saved ${saved}/${dirty.length} products`)
    setSaving(false)
    load()
  }

  function exportCSV() {
    const header = 'ID,Name,Price,Compare Price,Stock,SKU,Active'
    const csv = [header, ...rows.map(r =>
      `"${r.id}","${r.name.replace(/"/g, '""')}",${r.price},${r.compare_price || ''},${r.stock},"${r.sku}",${r.is_active}`
    )].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'products.csv'; a.click()
  }

  function importCSV(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n').slice(1) // skip header
      let updated = 0
      setRows(prev => {
        const next = [...prev]
        for (const line of lines) {
          const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'))
          const [id, , priceStr, comparePriceStr, stockStr, sku, activeStr] = cols
          const idx = next.findIndex(r => r.id === id)
          if (idx < 0) continue
          next[idx] = {
            ...next[idx],
            price: +priceStr || next[idx].price,
            compare_price: +comparePriceStr || 0,
            stock: stockStr !== undefined && stockStr !== '' ? +stockStr : next[idx].stock,
            sku: sku ?? next[idx].sku,
            is_active: activeStr?.trim().toLowerCase() !== 'false',
            dirty: true,
          }
          updated++
        }
        return next
      })
      toast.success(`Imported ${updated} products — review changes and click Save`)
    }
    reader.readAsText(file)
  }

  const dirtyCount = rows.filter(r => r.dirty).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {dirtyCount > 0
            ? <span className="text-amber-600 font-semibold">{dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}</span>
            : `${rows.length} products`}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
            <Upload size={13} /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => { if (e.target.files?.[0]) importCSV(e.target.files[0]); e.target.value = '' }} />
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw size={13} />
          </button>
          <button onClick={saveAll} disabled={saving || !dirtyCount}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}>
            <Save size={15} /> {saving ? 'Saving…' : `Save${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3 w-28">Price (₦)</th>
                <th className="text-left px-4 py-3 w-28">Compare (₦)</th>
                <th className="text-left px-4 py-3 w-20">Stock</th>
                <th className="text-left px-4 py-3 w-28">SKU</th>
                <th className="text-center px-4 py-3 w-16">Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className={`border-b border-gray-50 last:border-0 ${r.dirty ? 'bg-amber-50/40' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800 truncate max-w-[220px]">{r.name}</p>
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" value={r.price} onChange={e => update(r.id, 'price', +e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-gray-400" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" value={r.compare_price || ''} onChange={e => update(r.id, 'compare_price', +e.target.value)}
                      placeholder="—"
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-gray-400 placeholder-gray-300" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" value={r.stock} onChange={e => update(r.id, 'stock', +e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-gray-400" />
                  </td>
                  <td className="px-4 py-2">
                    <input value={r.sku} onChange={e => update(r.id, 'sku', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-gray-400 font-mono" />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input type="checkbox" checked={r.is_active} onChange={e => update(r.id, 'is_active', e.target.checked)}
                      className="rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        CSV format: ID, Name, Price, Compare Price, Stock, SKU, Active — the Name column is read-only. Changes are highlighted in amber until saved.
      </p>
    </div>
  )
}
