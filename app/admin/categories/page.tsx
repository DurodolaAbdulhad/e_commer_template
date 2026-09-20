'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2, Check, X, Tag, Upload, Loader2 } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/admin-db'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

async function uploadCategoryImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('bucket', 'categories')
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Upload failed')
  }
  const { url } = await res.json()
  return url
}

// ── Image picker (upload OR url) ──────────────────────────────────────────────
function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const url = await uploadCategoryImage(file)
      onChange(url)
      toast.success('Image uploaded')
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Preview */}
      <div className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
        {uploading ? (
          <Loader2 size={14} className="text-gray-300 animate-spin" />
        ) : value ? (
          <Image src={value} alt="" width={36} height={36} className="object-cover w-full h-full" />
        ) : (
          <Tag size={14} className="text-gray-300" />
        )}
      </div>

      {/* URL input */}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Image URL or upload →"
        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 font-mono min-w-0"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap disabled:opacity-50"
        title="Upload image (any format: JPG, PNG, GIF, SVG, WebP…)">
        <Upload size={11} /> Upload
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editName,   setEditName]   = useState('')
  const [editSlug,   setEditSlug]   = useState('')
  const [editImage,  setEditImage]  = useState('')
  const [newName,    setNewName]    = useState('')
  const [newSlug,    setNewSlug]    = useState('')
  const [newImage,   setNewImage]   = useState('')
  const [adding,     setAdding]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setCategories(await getCategories())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!newName.trim()) return toast.error('Category name required')
    try {
      await createCategory({
        name: newName.trim(),
        slug: newSlug || slugify(newName),
        image: newImage || null,
      })
      toast.success('Category added')
      setNewName(''); setNewSlug(''); setNewImage(''); setAdding(false)
      load()
    } catch (err: any) { toast.error(err?.message) }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return toast.error('Name required')
    try {
      await updateCategory(id, {
        name: editName.trim(),
        slug: editSlug || slugify(editName),
        image: editImage || null,
      })
      toast.success('Category updated')
      setEditingId(null)
      load()
    } catch (err: any) { toast.error(err?.message) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? Products in this category won't be deleted.`)) return
    await deleteCategory(id)
    toast.success('Category deleted')
    load()
  }

  function startEdit(cat: any) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditSlug(cat.slug)
    setEditImage(cat.image || '')
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Categories</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Icons accept any image format — JPG, PNG, GIF, SVG, WebP</p>
          </div>
          <button onClick={() => setAdding(a => !a)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ACCENT }}>
            <Plus size={13} /> Add Category
          </button>
        </div>

        {/* Add row */}
        {adding && (
          <div className="px-5 py-4 bg-red-50 border-b border-red-100 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={newName}
                onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)) }}
                placeholder="Category name" autoFocus
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
              <input value={newSlug} onChange={e => setNewSlug(e.target.value)}
                placeholder="slug (auto)"
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 font-mono text-gray-500" />
            </div>
            <ImagePicker value={newImage} onChange={setNewImage} />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setAdding(false); setNewName(''); setNewSlug(''); setNewImage('') }}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">
                Cancel
              </button>
              <button onClick={handleAdd}
                className="px-3 py-1.5 text-xs font-bold rounded-lg text-white hover:opacity-90"
                style={{ backgroundColor: '#16a34a' }}>
                <Check size={13} className="inline mr-1" />Save
              </button>
            </div>
          </div>
        )}

        {/* Column headers */}
        <div className="grid grid-cols-[44px_1fr_150px_72px] gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Icon</span>
          <span>Name</span>
          <span>Slug</span>
          <span className="text-center">Actions</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center">
            <Tag size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No categories yet.</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="border-b border-gray-50 last:border-0">
              {editingId === cat.id ? (
                // ── Edit mode ──────────────────────────────────────────────
                <div className="px-5 py-4 bg-blue-50 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                      className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none" />
                    <input value={editSlug} onChange={e => setEditSlug(e.target.value)}
                      className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none font-mono text-gray-500" />
                  </div>
                  <ImagePicker value={editImage} onChange={setEditImage} />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">
                      Cancel
                    </button>
                    <button onClick={() => handleUpdate(cat.id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg text-white hover:opacity-90"
                      style={{ backgroundColor: '#16a34a' }}>
                      <Check size={13} className="inline mr-1" />Save
                    </button>
                  </div>
                </div>
              ) : (
                // ── View mode ──────────────────────────────────────────────
                <div className="grid grid-cols-[44px_1fr_150px_72px] gap-3 items-center px-5 py-3 hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} width={36} height={36} className="object-cover w-full h-full" />
                    ) : (
                      <Tag size={14} className="text-gray-300" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700">{cat.name}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{cat.slug}</p>
                  <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(cat)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50">
                      <Edit2 size={13} className="text-blue-500" />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.name)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-gray-400">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
    </div>
  )
}
