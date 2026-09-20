'use client'

import { useEffect, useState, useCallback, FormEvent } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { getBanners, createBanner, updateBanner, deleteBanner } from '@/lib/admin-db'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const BANNER_TYPES = [
  { value: 'hero_slide', label: 'Hero Slider',     desc: 'Main carousel — left side of homepage hero' },
  { value: 'hero_side',  label: 'Hero Side Promo',  desc: 'Small promo panels — right side of hero (max 2)' },
  { value: 'mid_promo',  label: 'Mid-Page Promo',   desc: '2-column promotional banners between product sections' },
]

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  hero_slide: { bg: '#dbeafe', text: '#1d4ed8' },
  hero_side:  { bg: '#dcfce7', text: '#15803d' },
  mid_promo:  { bg: '#fef3c7', text: '#b45309' },
}

const EMPTY: any = {
  type: 'hero_slide',
  title: '', subtitle: '', discount: '', price: '',
  image: '', link: '', cta: 'Shop Now',
  bg_color: '#f9f6f0', position: 1, is_active: true,
}

export default function BannersPage() {
  const [banners,   setBanners]   = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<any>(null)
  const [form,      setForm]      = useState<any>(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [typeFilter,setTypeFilter]= useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setBanners(await getBanners())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(b: any) { setEditing(b); setForm({ ...b }); setShowForm(true) }
  function close() { setShowForm(false); setEditing(null); setForm(EMPTY) }

  function set(key: string, val: any) { setForm((f: any) => ({ ...f, [key]: val })) }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title || !form.image) return toast.error('Title and image URL required')
    setSaving(true)
    try {
      if (editing) {
        await updateBanner(editing.id, form)
        toast.success('Banner updated')
      } else {
        await createBanner(form)
        toast.success('Banner added')
      }
      close(); load()
    } catch (err: any) { toast.error(err?.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this banner?')) return
    await deleteBanner(id)
    toast.success('Deleted')
    load()
  }

  async function toggleActive(b: any) {
    await updateBanner(b.id, { is_active: !b.is_active })
    toast.success(b.is_active ? 'Hidden' : 'Published')
    load()
  }

  const filtered = typeFilter === 'all' ? banners : banners.filter(b => b.type === typeFilter)
  const typeLabel = (t: string) => BANNER_TYPES.find(bt => bt.value === t)?.label ?? t

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setTypeFilter('all')}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{ backgroundColor: typeFilter === 'all' ? ACCENT : '#f3f4f6', color: typeFilter === 'all' ? '#fff' : '#374151' }}>
            All ({banners.length})
          </button>
          {BANNER_TYPES.map(t => (
            <button key={t.value} onClick={() => setTypeFilter(t.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{ backgroundColor: typeFilter === t.value ? ACCENT : '#f3f4f6', color: typeFilter === t.value ? '#fff' : '#374151' }}>
              {t.label} ({banners.filter(b => b.type === t.value).length})
            </button>
          ))}
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> Add Banner
        </button>
      </div>

      {/* Placement guide */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wider">Banner Placement Guide</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BANNER_TYPES.map(t => (
            <div key={t.value} className="flex items-start gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: TYPE_COLORS[t.value]?.bg, color: TYPE_COLORS[t.value]?.text }}>
                {t.label}
              </span>
              <p className="text-[11px] text-blue-600">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden my-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">{editing ? 'Edit Banner' : 'Add Banner'}</h3>
              <button onClick={close}><X size={16} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto max-h-[70vh]">

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Banner Type *</label>
                <div className="grid grid-cols-1 gap-2">
                  {BANNER_TYPES.map(t => (
                    <label key={t.value} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                      style={{ borderColor: form.type === t.value ? ACCENT : '#e5e7eb', backgroundColor: form.type === t.value ? '#fff5f5' : '#fff' }}>
                      <input type="radio" name="type" value={t.value} checked={form.type === t.value}
                        onChange={e => set('type', e.target.value)} className="shrink-0" style={{ accentColor: ACCENT }} />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{t.label}</p>
                        <p className="text-[11px] text-gray-400">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Core fields */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required
                  placeholder="e.g. Summer Sale 2026"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Subtitle</label>
                <input value={form.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)}
                  placeholder={form.type === 'hero_slide' ? 'Mega Sale, Don\'t Miss Out!' : form.type === 'hero_side' ? 'Price Just' : 'Up to 50% off'}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
              </div>

              {/* Hero slide specific */}
              {form.type === 'hero_slide' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Discount Badge</label>
                  <input value={form.discount ?? ''} onChange={e => set('discount', e.target.value)}
                    placeholder="e.g. Up to 40% Off"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                </div>
              )}

              {/* Hero side specific */}
              {form.type === 'hero_side' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Price Display</label>
                  <input value={form.price ?? ''} onChange={e => set('price', e.target.value)}
                    placeholder="e.g. ₦15,999"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Image URL *</label>
                <input value={form.image} onChange={e => set('image', e.target.value)} required
                  placeholder="https://images.unsplash.com/photo-…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 font-mono text-xs" />
              </div>
              {form.image && (
                <div className="relative h-24 w-full rounded-lg overflow-hidden bg-gray-100">
                  <Image src={form.image} alt="Preview" fill className="object-cover" sizes="480px" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Link</label>
                  <input value={form.link ?? ''} onChange={e => set('link', e.target.value)}
                    placeholder="/shop?sale=true"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">CTA Text</label>
                  <input value={form.cta ?? ''} onChange={e => set('cta', e.target.value)}
                    placeholder="Shop Now"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Position (sort order)</label>
                  <input type="number" value={form.position ?? 1} onChange={e => set('position', Number(e.target.value))} min="1"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                </div>
                {form.type === 'hero_slide' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.bg_color ?? '#f9f6f0'} onChange={e => set('bg_color', e.target.value)}
                        className="w-10 h-9 rounded border border-gray-200 cursor-pointer" />
                      <input value={form.bg_color ?? '#f9f6f0'} onChange={e => set('bg_color', e.target.value)}
                        placeholder="#f9f6f0"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 font-mono text-xs" />
                    </div>
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
                  className="w-4 h-4 rounded" style={{ accentColor: ACCENT }} />
                <span className="text-sm text-gray-700">Active (visible on site)</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}>
                  <Save size={14} /> {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={close}
                  className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banners grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
              <div className="relative h-32 bg-gray-100">
                {b.image
                  ? <Image src={b.image} alt={b.title} fill className="object-cover" sizes="480px" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
                }
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm"
                    style={{ backgroundColor: TYPE_COLORS[b.type]?.bg ?? '#f3f4f6', color: TYPE_COLORS[b.type]?.text ?? '#374151' }}>
                    {typeLabel(b.type)}
                  </span>
                </div>
                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleActive(b)} title={b.is_active ? 'Hide' : 'Show'}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow">
                    {b.is_active ? <Eye size={13} style={{ color: '#16a34a' }} /> : <EyeOff size={13} className="text-gray-400" />}
                  </button>
                  <button onClick={() => openEdit(b)}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow">
                    <Edit2 size={13} className="text-blue-500" />
                  </button>
                  <button onClick={() => handleDelete(b.id)}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{b.title}</p>
                    {(b.subtitle || b.discount || b.price) && (
                      <p className="text-xs text-gray-500 mt-0.5">{b.discount || b.price || b.subtitle}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">{b.link || '/'}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.is_active ? '#f0fdf4' : '#f9fafb', color: b.is_active ? '#16a34a' : '#9ca3af' }}>
                    {b.is_active ? 'Live' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-16 text-center bg-white rounded-xl border border-gray-100">
              <p className="text-sm text-gray-400">No banners yet. Add your first banner.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
