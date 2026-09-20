'use client'

import { useCart } from '@/hooks/useCart'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import CartItem from '@/components/cart/CartItem'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import { formatPrice, getShippingCost, loadShippingSettings } from '@/lib/utils'
import { client } from '@/config/client'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const { items, subtotal, itemCount, loaded: cartLoaded } = useCart()
  const [shippingSettings, setShippingSettings] = useState<any>(null)
  useEffect(() => { loadShippingSettings().then(s => setShippingSettings(s)).catch(() => {}) }, [])
  const shipping = getShippingCost(subtotal, shippingSettings)
  const total = subtotal + shipping

  return (
    <>
      <Header />
      <PageBox>
      <main className="px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Cart</span>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h1>

        {items.length === 0 && cartLoaded ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <ShoppingBag size={56} className="text-gray-200" />
            <div>
              <p className="font-semibold text-gray-700 text-lg">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Looks like you haven't added anything yet.</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-white text-sm font-semibold"
              style={{ backgroundColor: 'var(--brand-secondary)' }}
            >
              <ArrowLeft size={15} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cart items */}
            <div className="flex-1 bg-white border border-gray-100 rounded-lg divide-y divide-gray-50 overflow-hidden">
              {/* Header row */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>

              {/* Items */}
              <div className="px-4">
                {items.map((item) => (
                  <CartItem key={`${item.id}-${item.variant}`} item={item} />
                ))}
              </div>

              {/* Bottom actions */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <Link
                  href="/shop"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-80 shrink-0">
              <div className="bg-white border border-gray-100 rounded-lg p-5 sticky top-24">
                <h2 className="font-bold text-gray-800 text-base mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="font-medium text-gray-800">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span className="font-medium">
                      {shipping === 0
                        ? <span style={{ color: 'var(--brand-secondary)' }}>Free</span>
                        : formatPrice(shipping)
                      }
                    </span>
                  </div>

                  {shipping > 0 && (shippingSettings?.freeAbove ?? client.shipping.freeAbove) > 0 && (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded p-2">
                      Add {formatPrice((shippingSettings?.freeAbove ?? client.shipping.freeAbove) - subtotal)} more to get free shipping
                    </p>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span style={{ color: 'var(--brand-secondary)' }}>{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full text-center mt-5 py-3 rounded text-white font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  Proceed to Checkout
                </Link>

                {/* Trust badges */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                  {['Secure checkout with Paystack', 'Free returns within 7 days', '24/7 customer support'].map((t) => (
                    <p key={t} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-green-500">✓</span> {t}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </PageBox>
      <Footer />
    </>
  )
}
