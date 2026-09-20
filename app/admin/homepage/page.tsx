'use client'

import { useEffect, useState, useRef } from 'react'
import { GripVertical, Eye, EyeOff, Save, RotateCcw, CheckCircle2, LayoutList } from 'lucide-react'
import { getHomepageSections, saveHomepageSections } from '@/lib/admin-db'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

type Section = { id: string; label: string; visible: boolean }

const SECTION_ICONS: Record<string, string> = {
  hero:        '🖼',
  trust:       '✅',
  categories:  '🗂',
  flash:       '⚡',
  featured:    '⭐',
  promo:       '📢',
  new_arrivals:'🆕',
  newsletter:  '📧',
}

export default function HomepagePage() {
  const [sections, setSections] = useState<Section[]>([])
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const dragIndex  = useRef<number | null>(null)
  const overIndex  = useRef<number | null>(null)

  useEffect(() => {
    getHomepageSections().then(setSections)
  }, [])

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  function onDragStart(i: number) { dragIndex.current = i }
  function onDragEnter(i: number) { overIndex.current = i }
  function onDragEnd() {
    const from = dragIndex.current
    const to   = overIndex.current
    if (from === null || to === null || from === to) return
    const next = [...sections]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setSections(next)
    setSaved(false)
    dragIndex.current = null
    overIndex.current = null
  }

  function toggleVisible(id: string) {
    setSections(s => s.map(sec => sec.id === id ? { ...sec, visible: !sec.visible } : sec))
    setSaved(false)
  }

  function reset() {
    getHomepageSections().then(data => { setSections(data); setSaved(false) })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveHomepageSections(sections)
      setSaved(true)
      toast.success('Homepage layout saved')
    } catch (err: any) {
      toast.error(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const visibleCount = sections.filter(s => s.visible).length

  return (
    <div className="max-w-xl space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <LayoutList size={13} /> Homepage Layout
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Drag to reorder — {visibleCount} of {sections.length} sections visible
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reset}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium">
              <RotateCcw size={11} /> Reset
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: saved ? '#16a34a' : ACCENT }}>
              {saved
                ? <><CheckCircle2 size={13} /> Saved</>
                : saving ? <><Save size={13} className="animate-pulse" /> Saving…</>
                : <><Save size={13} /> Save Layout</>}
            </button>
          </div>
        </div>

        {/* Section list */}
        {sections.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {sections.map((sec, i) => (
              <li
                key={sec.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                className={`flex items-center gap-3 px-5 py-3.5 select-none transition-colors ${
                  sec.visible ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50 cursor-grab active:cursor-grabbing group`}>

                {/* Drag handle */}
                <GripVertical size={16} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0" />

                {/* Position badge */}
                <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full flex-shrink-0">
                  {i + 1}
                </span>

                {/* Icon + Label */}
                <span className="text-lg leading-none flex-shrink-0">{SECTION_ICONS[sec.id] ?? '📄'}</span>
                <span className={`flex-1 text-sm font-medium ${sec.visible ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                  {sec.label}
                </span>

                {/* Section ID chip */}
                <span className="text-[10px] font-mono text-gray-300 hidden sm:block">{sec.id}</span>

                {/* Visibility toggle */}
                <button
                  onClick={() => toggleVisible(sec.id)}
                  title={sec.visible ? 'Hide section' : 'Show section'}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    sec.visible
                      ? 'text-green-500 hover:bg-green-50'
                      : 'text-gray-300 hover:bg-gray-100'
                  }`}>
                  {sec.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Help text */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-700 font-medium mb-1">How it works</p>
        <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
          <li>Drag any row up or down to reorder sections on the homepage</li>
          <li>Click the eye icon to show or hide a section without deleting it</li>
          <li>Click <strong>Save Layout</strong> — changes go live on the next page load</li>
        </ul>
      </div>
    </div>
  )
}
