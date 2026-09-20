'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import CartItem from './CartItem'
import { formatPrice, getShippingCost } from '@/lib/utils'
import { client } from '@/config/client'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, subtotal, itemCount } = useCart()
  const shipping = getShippingCost(subtotal)

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
            My Cart ({itemCount})
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={48} className="text-gray-200" />
              <div>
                <p className="font-medium text-gray-700">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
              </div>
              <button
                onClick={onClose}
                className="text-sm font-semibold underline"
                style={{ color: 'var(--brand-secondary)' }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => <CartItem key={`${item.id}-${item.variant}`} item={item} />)
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-4 space-y-3">
            {/* Shipping */}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : formatPrice(shipping)}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gray-400">
                Add {formatPrice(client.shipping.freeAbove - subtotal)} more for free shipping
              </p>
            )}

            {/* Total */}
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-3">
              <span>Total</span>
              <span style={{ color: 'var(--brand-secondary)' }}>{formatPrice(subtotal + shipping)}</span>
            </div>

            {/* CTAs */}
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full text-center py-3 rounded text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--brand-secondary)' }}
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full text-center py-2.5 rounded font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
