'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn, ShoppingCart } from 'lucide-react'

const ACCENT = '#e84c3d'

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const imgs = images?.length ? images : []
  const [selected,  setSelected]  = useState(0)
  const [lightbox,  setLightbox]  = useState(false)
  const [lbIndex,   setLbIndex]   = useState(0)

  function prev() { setSelected(i => (i - 1 + imgs.length) % imgs.length) }
  function next() { setSelected(i => (i + 1) % imgs.length) }
  function lbPrev() { setLbIndex(i => (i - 1 + imgs.length) % imgs.length) }
  function lbNext() { setLbIndex(i => (i + 1) % imgs.length) }

  function openLightbox(i: number) { setLbIndex(i); setLightbox(true) }
  function closeLightbox() { setLightbox(false) }

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightbox) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  lbPrev()
      if (e.key === 'ArrowRight') lbNext()
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  return (
    <>
      {/* Main image */}
      <div>
        <div
          className="relative bg-gray-50 border border-gray-100 rounded-lg overflow-hidden mb-3 cursor-zoom-in group"
          style={{ aspectRatio: '1 / 1' }}
          onClick={() => imgs[selected] && openLightbox(selected)}>
          {imgs[selected] ? (
            <>
              <Image
                src={imgs[selected]} alt={name} fill
                className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 380px" priority />
              {/* Zoom hint */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                <ZoomIn size={14} className="text-gray-500" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <ShoppingCart size={64} />
            </div>
          )}

          {imgs.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors z-10 opacity-0 group-hover:opacity-100">
                <ChevronLeft size={16} className="text-gray-500" />
              </button>
              <button onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors z-10 opacity-0 group-hover:opacity-100">
                <ChevronRight size={16} className="text-gray-500" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {imgs.map((img, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className="relative w-16 h-16 shrink-0 border-2 rounded-lg overflow-hidden transition-all hover:opacity-90"
                style={{ borderColor: selected === i ? ACCENT : '#e5e7eb' }}>
                <Image src={img} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
          onClick={closeLightbox}>
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-10">
            <X size={20} className="text-white" />
          </button>

          {/* Counter */}
          {imgs.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lbIndex + 1} / {imgs.length}
            </div>
          )}

          {/* Image */}
          <div
            className="relative w-full max-w-3xl mx-4"
            style={{ aspectRatio: '1 / 1' }}
            onClick={e => e.stopPropagation()}>
            {imgs[lbIndex] && (
              <Image
                src={imgs[lbIndex]} alt={name} fill
                className="object-contain"
                sizes="(max-width:768px) 100vw, 800px" />
            )}
          </div>

          {/* Prev / Next */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); lbPrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronLeft size={22} className="text-white" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); lbNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronRight size={22} className="text-white" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {imgs.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {imgs.map((img, i) => (
                <button key={i}
                  onClick={e => { e.stopPropagation(); setLbIndex(i) }}
                  className="relative w-12 h-12 rounded overflow-hidden border-2 transition-all"
                  style={{ borderColor: lbIndex === i ? ACCENT : 'rgba(255,255,255,0.3)' }}>
                  <Image src={img} alt="" fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
