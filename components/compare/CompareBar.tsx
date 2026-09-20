'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X, ArrowRight, BarChart2 } from 'lucide-react'
import { useCompare } from '@/hooks/useCompare'
import { formatPrice } from '@/lib/utils'

const ACCENT = '#e84c3d'

export default function CompareBar() {
  const { items, remove, clear, count } = useCompare()
  if (count === 0) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] shadow-2xl border-t border-gray-200"
      style={{ backgroundColor: '#1a2638' }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-4">
        {/* Icon + label */}
        <div className="flex items-center gap-2 shrink-0">
          <BarChart2 size={18} className="text-white/60" />
          <span className="text-white text-sm font-semibold hidden sm:block">
            Compare <span style={{ color: ACCENT }}>({count}/4)</span>
          </span>
        </div>

        {/* Product slots */}
        <div className="flex items-center gap-3 flex-1 overflow-x-auto">
          {items.map(p => (
            <div key={p.id}
              className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1.5 shrink-0">
              {/* Thumb */}
              <div className="w-9 h-9 rounded overflow-hidden bg-white/20 shrink-0">
                {p.images?.[0]
                  ? <Image src={p.images[0]} alt={p.name} width={36} height={36} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/10" />
                }
              </div>
              <div className="max-w-[120px]">
                <p className="text-white text-xs font-medium leading-tight line-clamp-1">{p.name}</p>
                <p className="text-white/60 text-[11px]">{formatPrice(p.price)}</p>
              </div>
              <button onClick={() => remove(p.id)}
                className="text-white/40 hover:text-white transition-colors ml-1">
                <X size={13} />
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - count }).map((_, i) => (
            <div key={i}
              className="w-[120px] h-[56px] shrink-0 rounded-lg border border-dashed border-white/20 flex items-center justify-center">
              <span className="text-white/25 text-xs">+ Add product</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={clear}
            className="text-white/50 hover:text-white text-xs transition-colors hidden sm:block">
            Clear
          </button>
          <Link
            href={`/compare?ids=${items.map(p => p.id).join(',')}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            Compare Now <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}
