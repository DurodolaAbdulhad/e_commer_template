'use client'

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Save, ArrowLeft, X, Upload, Link2, Plus, Check, Loader2 } from 'lucide-react'
import { getCategories, createCategory, createProduct, updateProduct } from '@/lib/admin-db'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const SQUARE_SIZE = 800
const MAX_IMAGES = 5

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

async function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = SQUARE_SIZE
      canvas.height = SQUARE_SIZE
      const ctx = canvas.getContext('2d')!
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, SQUARE_SIZE, SQUARE_SIZE)
      URL.revokeObjectURL(url)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Crop failed')), 'image/jpeg', 0.92)
    }
    img.onerror = reject
    img.src = url
  })
}

async function uploadImage(file: File): Promise<string> {
  const blob = await cropToSquare(file)
  const form = new FormData()
  form.append('file', new File([blob], file.name, { type: 'image/jpeg' }))
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Upload failed')
  }
  const { url } = await res.json()
  return url
}

// ── Image Slot ────────────────────────────────────────────────────────────────
function ImageSlot({
  value, onChange, onRemove, index, showRemove,
}: {
  value: string
  onChange: (v: string) => void
  onRemove: () => void
  index: number
  showRemove: boolean
}) {
  const [mode, setMode]       = useState<'upload' | 'url'>(value ? 'url' : 'upload')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
      setMode('url')
      toast.success('Image uploaded ✓')
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-200 bg-white">
        <button type="button" onClick={() => setMode('upload')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors"
          style={mode === 'upload' ? { color: ACCENT, borderBottom: `2px solid ${ACCENT}` } : { color: '#9ca3af' }}>
          <Upload size={12} /> Upload
        </button>
        <button type="button" onClick={() => setMode('url')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors"
          style={mode === 'url' ? { color: ACCENT, borderBottom: `2px solid ${ACCENT}` } : { color: '#9ca3af' }}>
          <Link2 size={12} /> URL
        </button>
        {showRemove && (
          <button type="button" onClick={onRemove}
            className="px-3 py-2 text-gray-400 hover:text-red-400 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      <div className="p-3 flex gap-3 items-center">
        {/* Square preview */}
        <div className="w-20 h-20 flex-shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center relative">
          {uploading ? (
            <Loader2 size={20} className="text-gray-300 animate-spin" />
          ) : value ? (
            <Image src={value} alt="" fill className="object-cover" sizes="80px" />
          ) : (
            <span className="text-[10px] text-gray-300 text-center px-1">800×800<br/>preview</span>
          )}
        </div>

        {/* Right side */}
        <div className="flex-1 min-w-0">
          {mode === 'upload' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors"
              style={{ borderColor: dragging ? ACCENT : '#d1d5db', backgroundColor: dragging ? '#fff5f5' : 'transparent' }}>
              <Upload size={16} className="mx-auto mb-1 text-gray-400" />
              <p className="text-[11px] text-gray-500 font-medium">Click or drag image here</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Any size or shape → auto-cropped to 800×800 square</p>
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
            </div>
          ) : (
            <div>
              <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={`Image URL ${index + 1}`}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Paste an image URL, or switch to Upload tab to upload a file
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Inline Category Creator ────────────────────────────────────────────────────
function InlineCategoryCreator({
  onCreated,
  onCancel,
  parentId,
}: {
  onCreated: (cat: any) => void
  onCancel: () => void
  parentId?: string
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const cat = await createCategory({ name: trimmed, slug: slugify(trimmed), parent_id: parentId || null })
      toast.success(`"${trimmed}" created`)
      onCreated(cat)
    } catch (e: any) {
      toast.error(e?.message || 'Could not create category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save() } if (e.key === 'Escape') onCancel() }}
        placeholder="New category name"
        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none focus:border-gray-400 bg-white"
      />
      <button type="button" onClick={save} disabled={saving || !name.trim()}
        className="w-7 h-7 flex items-center justify-center rounded-full text-white disabled:opacity-50"
        style={{ backgroundColor: '#16a34a' }}>
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      </button>
      <button type="button" onClick={onCancel}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300">
        <X size={12} className="text-gray-600" />
      </button>
    </div>
  )
}

// ── Main Form ─────────────────────────────────────────────────────────────────
export default function ProductForm({ product }: { product?: any }) {
  const router = useRouter()
  const isEdit = !!product

  const [allCategories, setAllCategories] = useState<any[]>([])
  const [saving,        setSaving]        = useState(false)

  // Category UI
  const [categoryId,       setCategoryId]       = useState(product?.category_id ?? '')
  const [showNewCat,       setShowNewCat]        = useState(false)
  const [showNewSubCat,    setShowNewSubCat]     = useState(false)

  // Core fields
  const [name,         setName]         = useState(product?.name ?? '')
  const [slug,         setSlug]         = useState(product?.slug ?? '')
  const [description,  setDescription]  = useState(product?.description ?? '')
  const [price,        setPrice]        = useState(product?.price ?? '')
  const [comparePrice, setComparePrice] = useState(product?.compare_price ?? '')
  const [imageUrls,    setImageUrls]    = useState<string[]>(
    product?.images?.length ? product.images : ['', '']
  )
  const [brand,        setBrand]        = useState(product?.brand ?? '')
  const [sku,          setSku]          = useState(product?.sku ?? '')
  const [stock,        setStock]        = useState(product?.stock ?? '')
  const [isActive,     setIsActive]     = useState(product?.is_active ?? true)
  const [isFeatured,   setIsFeatured]   = useState(product?.is_featured ?? false)
  const [isFlashDeal,  setIsFlashDeal]  = useState(product?.is_flash_deal ?? false)
  const [flashDealEnd, setFlashDealEnd] = useState(
    product?.flash_deal_end ? new Date(product.flash_deal_end).toISOString().slice(0, 16) : ''
  )
  const [productType, setProductType] = useState<'physical' | 'digital'>(product?.product_type ?? 'physical')
  const [fileUrl,     setFileUrl]     = useState(product?.file_url ?? '')

  const loadCategories = useCallback(async () => {
    const cats = await getCategories()
    setAllCategories(cats)
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => { if (!isEdit) setSlug(slugify(name)) }, [name, isEdit])

  // Separate parent categories from subcategories
  const parentCategories = allCategories.filter(c => !c.parent_id)
  const selectedParent   = allCategories.find(c => c.id === categoryId)
  const isSelectedParent = selectedParent && !selectedParent.parent_id
  const subCategories    = isSelectedParent
    ? allCategories.filter(c => c.parent_id === categoryId)
    : allCategories.filter(c => c.parent_id === selectedParent?.parent_id)

  const effectiveParentId = selectedParent?.parent_id || (isSelectedParent ? categoryId : null)

  function addImageSlot()             { if (imageUrls.length < MAX_IMAGES) setImageUrls(u => [...u, '']) }
  function removeImageSlot(i: number) { setImageUrls(u => u.filter((_, idx) => idx !== i)) }
  function setImageUrl(i: number, v: string) { setImageUrls(u => u.map((x, idx) => idx === i ? v : x)) }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !price) return toast.error('Name and price are required')
    setSaving(true)
    try {
      const payload = {
        name, slug, description,
        price: Number(price),
        compare_price: comparePrice ? Number(comparePrice) : null,
        images: imageUrls.filter(Boolean),
        category_id: categoryId || null,
        brand: brand || null,
        sku: sku || null,
        stock: stock === '' ? 0 : Number(stock),
        is_active: isActive,
        is_featured: isFeatured,
        is_flash_deal: isFlashDeal,
        flash_deal_end: isFlashDeal && flashDealEnd ? new Date(flashDealEnd).toISOString() : null,
        product_type: productType,
        file_url: productType === 'digital' && fileUrl ? fileUrl : null,
      }
      if (isEdit) {
        await updateProduct(product.id, payload)
        toast.success('Product updated!')
      } else {
        await createProduct(payload)
        toast.success('Product created!')
      }
      router.push('/admin/products')
    } catch (err: any) {
      toast.error(err?.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-50">
          <ArrowLeft size={14} className="text-gray-500" />
        </button>
        <h2 className="text-sm font-bold text-gray-700">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* ── LEFT ── */}
        <div className="space-y-4">

          {/* Basic info */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Basic Information</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Product Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="e.g. Classic Leather Belt"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Slug (URL)</label>
                <input value={slug} onChange={e => setSlug(e.target.value)}
                  placeholder="auto-generated-from-name"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 font-mono text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={4} placeholder="Describe your product…"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Product Images</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Up to {MAX_IMAGES} images — front, back, side, detail · Auto-cropped to 800×800 square
                </p>
              </div>
              {imageUrls.length < MAX_IMAGES && (
                <button type="button" onClick={addImageSlot}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: ACCENT }}>
                  <Plus size={11} /> Add Image ({imageUrls.length}/{MAX_IMAGES})
                </button>
              )}
              {imageUrls.length >= MAX_IMAGES && (
                <span className="text-[10px] text-gray-400 font-medium">{MAX_IMAGES}/{MAX_IMAGES} max reached</span>
              )}
            </div>
            <div className="p-5 space-y-3">
              {imageUrls.map((url, i) => (
                <ImageSlot
                  key={i}
                  index={i}
                  value={url}
                  onChange={v => setImageUrl(i, v)}
                  onRemove={() => removeImageSlot(i)}
                  showRemove={imageUrls.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Pricing</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Selling Price (₦) *
                  </label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0"
                    placeholder="e.g. 30000"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                  <p className="text-[10px] text-gray-400 mt-1">The price customers actually pay</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Original Price (₦) — before discount
                  </label>
                  <input type="number" value={comparePrice} onChange={e => setComparePrice(e.target.value)} min="0"
                    placeholder="e.g. 50000 (optional)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                  <p className="text-[10px] text-gray-400 mt-1">Shown crossed out next to the sale price</p>
                </div>
              </div>

              {/* Live discount preview */}
              {price && comparePrice && Number(comparePrice) > Number(price) && (
                <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-sm">
                    <span className="text-gray-400 line-through mr-2">
                      ₦{Number(comparePrice).toLocaleString()}
                    </span>
                    <span className="font-bold text-gray-900">
                      ₦{Number(price).toLocaleString()}
                    </span>
                  </div>
                  <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: ACCENT }}>
                    {Math.round(((Number(comparePrice) - Number(price)) / Number(comparePrice)) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product type */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Product Type</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(['physical', 'digital'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setProductType(t)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors"
                    style={{
                      borderColor: productType === t ? ACCENT : '#e5e7eb',
                      color: productType === t ? ACCENT : '#6b7280',
                      backgroundColor: productType === t ? '#fff5f5' : '#fff',
                    }}>
                    <span>{t === 'physical' ? '📦' : '💾'}</span>
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
              {productType === 'digital' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Download URL</label>
                  <input value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                    placeholder="https://files.example.com/product.zip"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 font-mono" />
                </div>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Inventory</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Brand / Manufacturer</label>
                <input value={brand} onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Mynnat Apparels"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">SKU</label>
                  <input value={sku} onChange={e => setSku(e.target.value)}
                    placeholder="PROD-001"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Stock Quantity</label>
                  <input type="number" value={stock} onChange={e => setStock(e.target.value)} min="0"
                    placeholder="0"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-4">

          {/* Status toggles */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Status</h3>
            </div>
            <div className="p-4 space-y-3">
              {([
                { label: 'Published', sub: 'Visible in the store', value: isActive, set: setIsActive, color: ACCENT },
                { label: 'Featured',  sub: 'Show on homepage',      value: isFeatured, set: setIsFeatured, color: '#F5A623' },
                { label: 'Flash Deal',sub: 'Show in flash deals',   value: isFlashDeal, set: setIsFlashDeal, color: ACCENT },
              ] as const).map(({ label, sub, value, set, color }) => (
                <label key={label} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <button type="button" onClick={() => (set as any)(v => !v)}
                    className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
                    style={{ backgroundColor: value ? color : '#d1d5db' }}>
                    <span className="absolute top-1 transition-all w-4 h-4 bg-white rounded-full shadow"
                      style={{ left: value ? '26px' : '4px' }} />
                  </button>
                </label>
              ))}
              {isFlashDeal && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Deal Ends At</label>
                  <input type="datetime-local" value={flashDealEnd} onChange={e => setFlashDealEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Category</h3>
              <button type="button" onClick={() => { setShowNewCat(v => !v); setShowNewSubCat(false) }}
                className="w-6 h-6 flex items-center justify-center rounded-full text-white text-xs hover:opacity-80 transition-opacity"
                style={{ backgroundColor: ACCENT }} title="Create new category">
                <Plus size={11} />
              </button>
            </div>
            <div className="p-4 space-y-3">

              {/* Parent category */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Category</label>
                <select value={isSelectedParent ? categoryId : (selectedParent?.parent_id ?? '')}
                  onChange={e => { setCategoryId(e.target.value); setShowNewSubCat(false) }}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white">
                  <option value="">Uncategorized</option>
                  {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Inline new parent category */}
              {showNewCat && (
                <InlineCategoryCreator
                  onCreated={cat => {
                    loadCategories()
                    setCategoryId(cat.id)
                    setShowNewCat(false)
                  }}
                  onCancel={() => setShowNewCat(false)}
                />
              )}

              {/* Subcategory — only show when a parent is selected and has/can have children */}
              {effectiveParentId && !showNewCat && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Subcategory</label>
                    <button type="button" onClick={() => setShowNewSubCat(v => !v)}
                      className="text-[10px] font-semibold hover:underline flex items-center gap-0.5"
                      style={{ color: ACCENT }}>
                      <Plus size={9} /> New
                    </button>
                  </div>
                  {showNewSubCat ? (
                    <InlineCategoryCreator
                      parentId={effectiveParentId}
                      onCreated={cat => {
                        loadCategories()
                        setCategoryId(cat.id)
                        setShowNewSubCat(false)
                      }}
                      onCancel={() => setShowNewSubCat(false)}
                    />
                  ) : (
                    <select
                      value={selectedParent?.parent_id ? categoryId : ''}
                      onChange={e => setCategoryId(e.target.value || effectiveParentId)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white">
                      <option value="">No subcategory</option>
                      {allCategories
                        .filter(c => c.parent_id === effectiveParentId)
                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-bold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: ACCENT }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </form>
  )
}
