'use client'

import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  item: {
    id: string
    name: string
    price: number
    quantity: number
    images: string[]
    variant?: string | null
    slug: string
  }
}

export default function CartItem({ item }: Props) {
  const { dispatch } = useCart()

  function update(qty: number) {
    if (qty < 1) return
    dispatch({ type: 'UPDATE_QUANTITY', id: item.id, variant: item.variant, quantity: qty })
  }

  function remove() {
    dispatch({ type: 'REMOVE_ITEM', id: item.id, variant: item.variant })
    toast.success('Item removed')
  }

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Image */}
      <div className="relative w-20 h-20 shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-100">
        {item.images?.[0] ? (
          <Image src={item.images[0]} alt={item.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
        {item.variant && (
          <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          {/* Qty controls */}
          <div className="flex items-center border border-gray-200 rounded overflow-hidden">
            <button
              onClick={() => update(item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => update(item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Price + remove */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold" style={{ color: 'var(--brand-secondary)' }}>
              {formatPrice(item.price * item.quantity)}
            </span>
            <button onClick={remove} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
