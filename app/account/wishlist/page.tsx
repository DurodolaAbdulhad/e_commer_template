'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { useCart } from '@/hooks/useCart'
import { formatPrice, getDiscount } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const STAR_F = '#F5A623'
const STAR_E = '#e5e7eb'

function Stars({ n = 0 }: { n?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={s <= n ? STAR_F : STAR_E}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

export default function WishlistPage() {
  const { items, toggle } = useWishlist()
  const { dispatch } = useCart()

  function moveToCart(product: any) {
    dispatch({ type: 'ADD_ITEM', item: { ...product, quantity: 1 } })
    toggle(product) // remove from wishlist
    toast.success(`${product.name} moved to cart`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
          My Wishlist
          <span className="ml-2 text-sm font-normal text-gray-400">({items.length} items)</span>
        </h2>
        {items.length > 0 && (
          <Link href="/shop" className="text-xs font-medium hover:underline" style={{ color: ACCENT }}>
            Continue shopping
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 px-5 py-14 text-center">
          <Heart size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">Your wishlist is empty</p>
          <p className="text-xs text-gray-400 mb-4">Save items you love by clicking the heart icon on any product.</p>
          <Link href="/shop"
            className="inline-block px-6 py-2.5 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ACCENT }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_120px_80px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Product</span>
            <span className="text-center">Price</span>
            <span className="text-center">Stock</span>
            <span className="text-center">Action</span>
          </div>

          {items.map((product: any) => {
            const discount = getDiscount(product.price, product.compare_price)
            const inStock  = (product.stock ?? 1) > 0

            return (
              <div key={product.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_80px] gap-3 sm:gap-4 items-center px-5 py-4 border-b border-gray-50 last:border-0">
                {/* Product */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-50 rounded border border-gray-100 overflow-hidden relative shrink-0">
                    {discount && (
                      <span className="absolute top-1 left-1 text-[9px] font-bold text-white px-1 py-0.5 rounded z-10"
                        style={{ backgroundColor: ACCENT }}>-{discount}%</span>
                    )}
                    {product.images?.[0]
                      ? <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="64px" />
                      : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-200">{product.name?.charAt(0)}</div>
                    }
                  </div>
                  <div>
                    <Link href={`/shop/${product.slug}`}
                      className="text-sm font-medium text-gray-700 hover:text-red-500 transition-colors line-clamp-2 leading-snug">
                      {product.name}
                    </Link>
                    <Stars n={Math.round(product.rating ?? 0)} />
                  </div>
                </div>

                {/* Price */}
                <div className="sm:text-center">
                  <p className="text-sm font-bold" style={{ color: ACCENT }}>{formatPrice(product.price)}</p>
                  {product.compare_price && product.compare_price > product.price && (
                    <p className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</p>
                  )}
                </div>

                {/* Stock */}
                <div className="sm:text-center">
                  <span className="text-xs font-semibold" style={{ color: inStock ? '#16a34a' : '#ef4444' }}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:justify-center">
                  <button onClick={() => moveToCart(product)}
                    disabled={!inStock}
                    title="Add to cart"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: ACCENT }}>
                    <ShoppingCart size={13} />
                  </button>
                  <button onClick={() => { toggle(product); toast.success('Removed from wishlist') }}
                    title="Remove"
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
