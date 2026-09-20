'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Eye, BarChart2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useCompare } from '@/hooks/useCompare'
import { formatPrice, getDiscount } from '@/lib/utils'
import { client } from '@/config/client'
import { openQuickView } from '@/components/product/QuickViewModal'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const PRICE_COLOR = '#e84c3d'
const TITLE_COLOR = '#333'
const TITLE_HOVER = '#e84c3d'
const STAR_FILLED = '#F5A623'
const STAR_EMPTY  = '#e5e7eb'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number
  images?: string[]
  brand?: string
  rating?: number
  review_count?: number
  stock?: number
}

interface Props {
  product: Product
  listView?: boolean
}

function Stars({ rating = 0, count = 0 }: { rating?: number; count?: number }) {
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= filled ? STAR_FILLED : STAR_EMPTY}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      {count > 0 && <span className="text-xs text-gray-400">{count}</span>}
    </div>
  )
}

export default function ProductCard({ product, listView = false }: Props) {
  const { dispatch } = useCart()
  const { toggle, isWishlisted } = useWishlist()
  const { add: addCompare, remove: removeCompare, has: inCompare } = useCompare()
  const discount    = getDiscount(product.price, product.compare_price)
  const wishlisted  = isWishlisted(product.id)
  const isOutOfStock = (product.stock ?? 1) <= 0

  function addToCart(e: React.MouseEvent) {
    e.preventDefault()
    dispatch({ type: 'ADD_ITEM', item: { ...product, variant: null } })
    toast.success(`${product.name} added to cart`)
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    toggle(product)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  if (listView) {
    return (
      <Link href={`/shop/${product.slug}`}
        className="flex gap-4 bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow group">
        {/* Image */}
        <div className="relative w-32 h-32 shrink-0 bg-gray-50 rounded overflow-hidden">
          {product.images?.[0]
            ? <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="128px" />
            : <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingCart size={28}/></div>
          }
          {discount && (
            <span className="absolute top-1.5 left-1.5 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: ACCENT }}>-{discount}%</span>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0 py-1">
          {product.brand && <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{product.brand}</p>}
          <h3 className="text-sm font-semibold mb-1.5 leading-snug line-clamp-2 transition-colors group-hover:text-[#e84c3d]"
            style={{ color: TITLE_COLOR }}>{product.name}</h3>
          <Stars rating={product.rating} count={product.review_count} />
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-base" style={{ color: PRICE_COLOR }}>{formatPrice(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="flex flex-col items-center gap-2 shrink-0 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isOutOfStock && (
            <button onClick={addToCart}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: ACCENT }}>
              <ShoppingCart size={14} />
            </button>
          )}
          {client.features.wishlist && (
            <button onClick={handleWishlist}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-red-400 transition-colors">
              <Heart size={14} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
            </button>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/shop/${product.slug}`}
      className="group block bg-white border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
      style={{ borderRadius: '4px' }}>

      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          {product.images?.[0]
            ? <Image src={product.images[0]} alt={product.name} fill
                className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw, 25vw" />
            : <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingCart size={36}/></div>
          }
        </div>

        {/* Discount badge */}
        {discount && (
          <span className="absolute top-2 left-2 text-white text-xs font-bold px-1.5 py-0.5"
            style={{ backgroundColor: ACCENT, borderRadius: '2px' }}>
            -{discount}%
          </span>
        )}

        {/* Out of stock */}
        {isOutOfStock && (
          <span className="absolute top-2 right-2 bg-gray-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            Sold Out
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {client.features.wishlist && (
            <button onClick={handleWishlist}
              className="w-8 h-8 bg-white shadow flex items-center justify-center transition-colors hover:bg-red-50"
              style={{ borderRadius: '2px' }}>
              <Heart size={14} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
            </button>
          )}
          <button
            onClick={e => { e.preventDefault(); openQuickView(product) }}
            className="w-8 h-8 bg-white shadow flex items-center justify-center transition-colors hover:bg-blue-50"
            style={{ borderRadius: '2px' }}
            title="Quick View"
          >
            <Eye size={14} className="text-gray-400" />
          </button>
          <button
            onClick={e => {
              e.preventDefault()
              const comparing = inCompare(product.id)
              if (comparing) { removeCompare(product.id); toast('Removed from compare') }
              else { addCompare(product); toast.success('Added to compare') }
            }}
            className="w-8 h-8 bg-white shadow flex items-center justify-center transition-colors hover:bg-green-50"
            style={{ borderRadius: '2px' }}
            title="Compare"
          >
            <BarChart2 size={14} className={inCompare(product.id) ? 'text-green-500' : 'text-gray-400'} />
          </button>
        </div>

        {/* Add to cart — slides up */}
        {!isOutOfStock && (
          <button onClick={addToCart}
            className="absolute bottom-0 left-0 right-0 py-2.5 text-white text-xs font-semibold flex items-center justify-center gap-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
            style={{ backgroundColor: '#1a2638' }}>
            <ShoppingCart size={13} />
            Add to Cart
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {product.brand && (
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{product.brand}</p>
        )}
        <h3 className="text-sm leading-snug line-clamp-2 mb-1.5 transition-colors group-hover:text-[#e84c3d]"
          style={{ color: TITLE_COLOR, fontWeight: 500 }}>
          {product.name}
        </h3>

        <Stars rating={product.rating} count={product.review_count} />

        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-bold text-sm" style={{ color: PRICE_COLOR }}>
            {formatPrice(product.price)}
          </span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
