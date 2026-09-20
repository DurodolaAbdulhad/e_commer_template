'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { formatPrice, getDiscount } from '@/lib/utils'
import toast from 'react-hot-toast'

const ACCENT    = '#e84c3d'
const STAR_FILL = '#F5A623'
const EVENT     = 'open-quick-view'

export function openQuickView(product: any) {
  document.dispatchEvent(new CustomEvent(EVENT, { detail: product }))
}

function Stars({ n = 0, count = 0 }: { n?: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <svg key={s} width="14" height="14" viewBox="0 0 24 24"
            fill={s <= Math.round(n) ? STAR_FILL : '#e5e7eb'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      {count > 0 && <span className="text-xs text-gray-400">({count} reviews)</span>}
    </div>
  )
}

export default function QuickViewModal() {
  const [product,  setProduct]  = useState<any>(null)
  const [imgIdx,   setImgIdx]   = useState(0)
  const [qty,      setQty]      = useState(1)
  const { dispatch }            = useCart()
  const { toggle, isWishlisted } = useWishlist()

  useEffect(() => {
    function handler(e: Event) {
      const p = (e as CustomEvent).detail
      setProduct(p)
      setImgIdx(0)
      setQty(1)
      document.body.style.overflow = 'hidden'
    }
    document.addEventListener(EVENT, handler)
    return () => document.removeEventListener(EVENT, handler)
  }, [])

  function close() {
    setProduct(null)
    document.body.style.overflow = ''
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!product) return null

  const images     = product.images?.filter(Boolean) ?? []
  const discount   = getDiscount(product.price, product.compare_price)
  const outOfStock = (product.stock ?? 1) <= 0
  const wishlisted = isWishlisted(product.id)

  function addToCart() {
    dispatch({ type: 'ADD_ITEM', item: { ...product, quantity: qty } })
    toast.success(`${product.name} added to cart`)
    close()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">

        {/* Close */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <X size={15} className="text-gray-500" />
        </button>

        {/* ── Left: Image gallery ── */}
        <div className="md:w-[45%] shrink-0 bg-gray-50 relative flex flex-col">
          {/* Main image */}
          <div className="relative flex-1" style={{ minHeight: '280px', maxHeight: '400px' }}>
            {discount && (
              <span className="absolute top-3 left-3 z-10 text-xs font-bold text-white px-2 py-1 rounded"
                style={{ backgroundColor: ACCENT }}>-{discount}%</span>
            )}
            {images[imgIdx] ? (
              <Image src={images[imgIdx]} alt={product.name} fill
                className="object-contain p-4" sizes="400px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200">
                <ShoppingCart size={48} />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                  disabled={imgIdx === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center disabled:opacity-30">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                  disabled={imgIdx === images.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center disabled:opacity-30">
                  <ChevronRight size={15} />
                </button>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
              {images.map((src: string, i: number) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className="w-14 h-14 shrink-0 rounded-lg border-2 overflow-hidden bg-white transition-colors"
                  style={{ borderColor: i === imgIdx ? ACCENT : '#e5e7eb' }}>
                  <Image src={src} alt="" width={56} height={56} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Details ── */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{product.brand}</p>
          )}

          {/* Name */}
          <h2 className="text-xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            {product.name}
          </h2>

          {/* Rating */}
          {product.rating && (
            <Stars n={product.rating} count={product.review_count} />
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-extrabold" style={{ color: ACCENT }}>
              {formatPrice(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-base text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
            )}
            {discount && (
              <span className="text-sm font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: '#fef2f2', color: ACCENT }}>
                Save {discount}%
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
              {product.description}
            </p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            {outOfStock ? (
              <span className="text-red-500 font-medium">Out of stock</span>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span className="text-green-700 font-medium">In stock</span>
                {product.stock && product.stock <= 10 && (
                  <span className="text-gray-400">— only {product.stock} left</span>
                )}
              </>
            )}
          </div>

          {/* Qty + CTA */}
          {!outOfStock && (
            <div className="flex items-center gap-3 pt-1">
              {/* Qty stepper */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-light">
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-light">
                  +
                </button>
              </div>

              {/* Add to cart */}
              <button onClick={addToCart}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: ACCENT }}>
                <ShoppingCart size={15} />
                Add to Cart
              </button>

              {/* Wishlist */}
              <button onClick={() => { toggle(product); toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist') }}
                className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
              </button>
            </div>
          )}

          {/* View full details */}
          <Link href={`/shop/${product.slug}`} onClick={close}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors border-t border-gray-100 pt-4"
            style={{ color: ACCENT }}>
            View Full Product Details <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}
