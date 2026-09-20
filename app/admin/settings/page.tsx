'use client'

import { useEffect, useState, useRef } from 'react'
import { Upload, Loader2, Check, Save, Image as ImageIcon, Type, RefreshCw, Globe, Smile } from 'lucide-react'
import { getStoreSetting, saveStoreSetting } from '@/lib/admin-db'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const H_BG   = (client as any).headerBg ?? '#1a2638'

async function uploadLogo(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('bucket', 'categories')
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Upload failed') }
  const { url } = await res.json()
  return url
}

export default function SettingsPage() {
  const [mode,       setMode]       = useState<'image' | 'text'>('image')
  // image mode
  const [logoUrl,    setLogoUrl]    = useState((client as any).logo ?? '')
  const [logoHeight, setLogoHeight] = useState<number>((client as any).logoHeight ?? 48)
  const [uploading,  setUploading]  = useState(false)
  // text mode
  const [logoText,   setLogoText]   = useState(client.name)
  const [textSize,   setTextSize]   = useState(26)
  const [textColor,  setTextColor]  = useState('#ffffff')
  const [textWeight, setTextWeight] = useState<'600'|'700'|'800'>('800')
  const [accentWord, setAccentWord] = useState('')
  const [accentColor,setAccentColor]= useState(ACCENT)
  // shared
  // site title & favicon
  const [siteTitle,   setSiteTitle]   = useState(client.name)
  const [siteFavicon, setSiteFavicon] = useState('')
  const [savingMeta,  setSavingMeta]  = useState(false)
  const [savedMeta,   setSavedMeta]   = useState(false)
  // shared
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getStoreSetting('site_title').then(v   => { if (v) setSiteTitle(v) })
    getStoreSetting('site_favicon').then(v => { if (v) setSiteFavicon(v) })
    getStoreSetting('logo_type').then(v    => { if (v) setMode(v as any) })
    getStoreSetting('logo').then(v        => { if (v) setLogoUrl(v) })
    getStoreSetting('logoHeight').then(v  => { if (v) setLogoHeight(Number(v)) })
    getStoreSetting('logo_text').then(v   => { if (v) setLogoText(v) })
    getStoreSetting('logo_text_size').then(v  => { if (v) setTextSize(Number(v)) })
    getStoreSetting('logo_text_color').then(v => { if (v) setTextColor(v) })
    getStoreSetting('logo_text_weight').then(v=> { if (v) setTextWeight(v as any) })
    getStoreSetting('logo_accent_word').then(v => { if (v) setAccentWord(v) })
    getStoreSetting('logo_accent_color').then(v=> { if (v) setAccentColor(v) })
  }, [])

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const url = await uploadLogo(file)
      setLogoUrl(url); setSaved(false)
      toast.success('Uploaded — click Save to apply')
    } catch (e: any) { toast.error(e?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveStoreSetting('logo_type', mode)
      if (mode === 'image') {
        if (!logoUrl.trim()) { setSaving(false); return toast.error('No logo URL') }
        await saveStoreSetting('logo', logoUrl.trim())
        await saveStoreSetting('logoHeight', logoHeight)
      } else {
        await saveStoreSetting('logo_text', logoText)
        await saveStoreSetting('logo_text_size', textSize)
        await saveStoreSetting('logo_text_color', textColor)
        await saveStoreSetting('logo_text_weight', textWeight)
        await saveStoreSetting('logo_accent_word', accentWord)
        await saveStoreSetting('logo_accent_color', accentColor)
      }
      setSaved(true)
      toast.success('Logo saved — reload the storefront to see it')
    } catch (e: any) { toast.error(e?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  // ── Text logo preview renderer ──────────────────────────────
  function TextLogoPreview() {
    if (!accentWord || !logoText.includes(accentWord)) {
      return <span style={{ color: textColor, fontWeight: textWeight, fontSize: `${textSize}px`, lineHeight: 1, letterSpacing: '-0.5px' }}>{logoText}</span>
    }
    const parts = logoText.split(accentWord)
    return (
      <span style={{ fontWeight: textWeight, fontSize: `${textSize}px`, lineHeight: 1, letterSpacing: '-0.5px' }}>
        {parts[0] && <span style={{ color: textColor }}>{parts[0]}</span>}
        <span style={{ color: accentColor }}>{accentWord}</span>
        {parts[1] && <span style={{ color: textColor }}>{parts[1]}</span>}
      </span>
    )
  }

  async function handleSaveMeta() {
    setSavingMeta(true)
    try {
      await saveStoreSetting('site_title', siteTitle.trim())
      await saveStoreSetting('site_favicon', siteFavicon.trim())
      setSavedMeta(true)
      toast.success('Site title & favicon saved — changes apply on next page load')
    } catch (e: any) { toast.error(e?.message || 'Save failed') }
    finally { setSavingMeta(false) }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Store Logo</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Choose image or text — edit live below</p>
          </div>
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
            <button onClick={() => { setMode('image'); setSaved(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 transition-colors"
              style={{ backgroundColor: mode === 'image' ? ACCENT : '#fff', color: mode === 'image' ? '#fff' : '#555' }}>
              <ImageIcon size={12} /> Image
            </button>
            <button onClick={() => { setMode('text'); setSaved(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 transition-colors border-l border-gray-200"
              style={{ backgroundColor: mode === 'text' ? ACCENT : '#fff', color: mode === 'text' ? '#fff' : '#555' }}>
              <Type size={12} /> Text
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">

          {/* ── IMAGE MODE ─────────────────────────────────────── */}
          {mode === 'image' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden"
                  style={{ backgroundColor: H_BG }}>
                  {uploading ? <Loader2 size={18} className="text-gray-400 animate-spin" />
                    : logoUrl ? <img src={logoUrl} alt="" className="object-contain w-full h-full p-1" />
                    : <ImageIcon size={18} className="text-gray-400" />}
                </div>
                {/* URL */}
                <input value={logoUrl} onChange={e => { setLogoUrl(e.target.value); setSaved(false) }}
                  placeholder="Paste image URL or upload →"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-gray-400 font-mono min-w-0" />
                {/* Upload */}
                <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 whitespace-nowrap disabled:opacity-50">
                  <Upload size={12} /> Upload
                </button>
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
              </div>

              {/* Height slider */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-medium text-gray-600 w-28 flex-shrink-0">Logo Height</label>
                <input type="range" min={24} max={80} step={2} value={logoHeight}
                  onChange={e => { setLogoHeight(Number(e.target.value)); setSaved(false) }}
                  className="flex-1 accent-red-500" />
                <span className="text-xs font-mono text-gray-500 w-12 text-right">{logoHeight}px</span>
              </div>
            </div>
          )}

          {/* ── TEXT MODE ──────────────────────────────────────── */}
          {mode === 'text' && (
            <div className="space-y-4">
              {/* Store name */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600 w-28 flex-shrink-0">Store Name</label>
                <input value={logoText} onChange={e => { setLogoText(e.target.value); setSaved(false) }}
                  placeholder="e.g. Mynnat Luxe"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
              </div>

              {/* Accent word */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600 w-28 flex-shrink-0">Accent Word</label>
                <input value={accentWord} onChange={e => { setAccentWord(e.target.value); setSaved(false) }}
                  placeholder="e.g. Luxe (part of name to colour differently)"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
              </div>

              {/* Font size + weight */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">Size</label>
                  <input type="range" min={14} max={48} step={1} value={textSize}
                    onChange={e => { setTextSize(Number(e.target.value)); setSaved(false) }}
                    className="flex-1 accent-red-500" />
                  <span className="text-xs font-mono text-gray-500 w-8">{textSize}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600 w-16 flex-shrink-0">Weight</label>
                  <select value={textWeight} onChange={e => { setTextWeight(e.target.value as any); setSaved(false) }}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none">
                    <option value="600">Semi-Bold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extra-Bold</option>
                  </select>
                </div>
              </div>

              {/* Colours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600 w-28 flex-shrink-0">Main colour</label>
                  <input type="color" value={textColor}
                    onChange={e => { setTextColor(e.target.value); setSaved(false) }}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer" />
                  <span className="text-xs font-mono text-gray-400">{textColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600 w-28 flex-shrink-0">Accent colour</label>
                  <input type="color" value={accentColor}
                    onChange={e => { setAccentColor(e.target.value); setSaved(false) }}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer" />
                  <span className="text-xs font-mono text-gray-400">{accentColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Live header preview (both modes) ───────────────── */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <p className="text-[10px] text-gray-400 px-3 py-1.5 bg-gray-50 border-b border-gray-100 font-medium uppercase tracking-wide">
              Header preview
            </p>
            <div className="flex items-center gap-4 px-5" style={{ backgroundColor: H_BG, minHeight: '64px' }}>
              {mode === 'image' ? (
                logoUrl
                  ? <img src={logoUrl} alt="" style={{ height: `${logoHeight}px`, width: 'auto', objectFit: 'contain' }} />
                  : <span style={{ color: '#fff', fontWeight: 800, fontSize: '22px' }}>{client.name}</span>
              ) : (
                <TextLogoPreview />
              )}
              <div className="flex-1" />
              <div className="flex gap-2.5 opacity-25">
                {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full bg-white" />)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => { setMode('image'); setLogoUrl((client as any).logo ?? ''); setLogoHeight((client as any).logoHeight ?? 48); setLogoText(client.name); setSaved(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600">
              <RefreshCw size={11} /> Reset
            </button>
            <button onClick={handleSave} disabled={saving || uploading}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl text-white hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: saved ? '#16a34a' : ACCENT }}>
              {saved ? <><Check size={13} /> Saved</>
                : saving ? <><Save size={13} className="animate-pulse" /> Saving…</>
                : <><Save size={13} /> Save Logo</>}
            </button>
          </div>
        </div>
      </div>
      {/* ── Site Title & Favicon ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Site Title &amp; Favicon</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Shown in browser tabs and search results</p>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Site Title */}
          <div className="flex items-center gap-3">
            <Globe size={14} className="text-gray-400 flex-shrink-0" />
            <label className="text-xs font-medium text-gray-600 w-24 flex-shrink-0">Site Title</label>
            <input
              value={siteTitle}
              onChange={e => { setSiteTitle(e.target.value); setSavedMeta(false) }}
              placeholder="e.g. Tracy Boutique — Women's Fashion"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400"
            />
          </div>

          {/* Favicon */}
          <div className="flex items-start gap-3">
            <Smile size={14} className="text-gray-400 flex-shrink-0 mt-2" />
            <label className="text-xs font-medium text-gray-600 w-24 flex-shrink-0 mt-2">Favicon</label>
            <div className="flex-1 space-y-2">
              <input
                value={siteFavicon}
                onChange={e => { setSiteFavicon(e.target.value); setSavedMeta(false) }}
                placeholder="Paste emoji or image URL (e.g. 👜 or https://...)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400"
              />
              <p className="text-[10px] text-gray-400">
                Use a single emoji (👜 🛍️ 👠) — it becomes your browser tab icon. Or paste a direct image URL (.png, .ico).
              </p>
              {siteFavicon && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Preview:</span>
                  <span className="text-lg">{siteFavicon.startsWith('http') ? '🔗' : siteFavicon}</span>
                </div>
              )}
            </div>
          </div>

          {/* Browser tab preview */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <p className="text-[10px] text-gray-400 px-3 py-1.5 bg-gray-50 border-b border-gray-100 font-medium uppercase tracking-wide">
              Browser tab preview
            </p>
            <div className="px-4 py-3 flex items-center gap-2 bg-gray-100">
              <div className="flex items-center gap-1.5 bg-white rounded-t-lg px-3 py-1.5 text-xs text-gray-700 shadow-sm max-w-[220px]">
                <span className="text-sm flex-shrink-0">
                  {siteFavicon && !siteFavicon.startsWith('http') ? siteFavicon : '🌐'}
                </span>
                <span className="truncate font-medium">{siteTitle || client.name}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSaveMeta} disabled={savingMeta}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl text-white hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: savedMeta ? '#16a34a' : ACCENT }}>
              {savedMeta ? <><Check size={13} /> Saved</>
                : savingMeta ? <><Save size={13} className="animate-pulse" /> Saving…</>
                : <><Save size={13} /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
