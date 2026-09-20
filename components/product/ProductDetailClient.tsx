'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Truck, RotateCcw, Shield, Headphones, Heart, ShoppingCart, Download, Share2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { formatPrice, getDiscount, getWhatsAppUrl } from '@/lib/utils'
import { client } from '@/config/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import ProductGallery from './ProductGallery'
import RelatedCarousel from './RelatedCarousel'
import RecentlyViewed from './RecentlyViewed'
import BackInStockAlert from './BackInStockAlert'
import ShareButtons from '@/components/ui/ShareButtons'

const ACCENT  = '#e84c3d'
const GREEN   = '#4CAF50'
const STAR_F  = '#F5A623'
const STAR_E  = '#e5e7eb'

// ── Helpers ────────────────────────────────────────────────────────────────

function Stars({ n = 0, size = 14 }: { n?: number; size?: number }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= n ? STAR_F : STAR_E}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function ClickStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={(hover || value) >= s ? STAR_F : STAR_E}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

const trustBadges = [
  { icon: <Truck size={20} />,      title: 'Free Delivery',  sub: `Over ${client.currencySymbol}${client.shipping.freeAbove.toLocaleString()}` },
  { icon: <RotateCcw size={20} />,  title: '90 Days Return', sub: 'If goods have problems' },
  { icon: <Shield size={20} />,     title: 'Secure Payment', sub: '100% secure payment' },
  { icon: <Headphones size={20} />, title: '24/7 Support',   sub: 'Dedicated support' },
]

// ── Review helpers ─────────────────────────────────────────────────────────

interface Review { id: string; nickname: string; summary: string; body: string; rating: number; date: string }

function loadReviews(productId: string): Review[] {
  try { return JSON.parse(localStorage.getItem(`reviews_${productId}`) ?? '[]') } catch { return [] }
}
function saveReview(productId: string, review: Review) {
  const existing = loadReviews(productId)
  localStorage.setItem(`reviews_${productId}`, JSON.stringify([review, ...existing]))
}

// ── Rating summary bar ──────────────────────────────────────────────────────

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-gray-500">{label}</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill={STAR_F}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STAR_F }} />
      </div>
      <span className="w-6 text-gray-400">{count}</span>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ProductDetailClient({
  product, related = [], upsell = [], specialOffers = []
}: {
  product: any; related?: any[]; upsell?: any[]; specialOffers?: any[]
}) {
  const { dispatch }        = useCart()
  const { toggle, isWishlisted } = useWishlist()
  const wishlisted   = isWishlisted(product.id)
  const discount     = getDiscount(product.price, product.compare_price)
  const isDigital    = product.product_type === 'digital'
  const isOutOfStock = (product.stock ?? 1) <= 0
  const images       = product.images ?? []
  const variants     = product.product_variants ?? []

  const [qty,                    setQty]                    = useState(1)
  const [selectedVariant,        setSelectedVariant]        = useState<Record<string, string>>({})
  const [selectedDigitalOptions, setSelectedDigitalOptions] = useState<string[]>([])
  const [activeTab,              setActiveTab]              = useState<'details' | 'info' | 'reviews'>('details')

  // Sticky bar — show when the buy buttons scroll above the viewport
  const buyRef    = useRef<HTMLDivElement>(null)
  const [sticky, setSticky] = useState(false)
  useEffect(() => {
    function onScroll() {
      if (!buyRef.current) return
      const rect = buyRef.current.getBoundingClientRect()
      setSticky(rect.bottom < 80)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reviews
  const [reviews,         setReviews]         = useState<Review[]>([])
  const [reviewRating,    setReviewRating]     = useState(5)
  const [reviewNickname,  setReviewNickname]   = useState('')
  const [reviewSummary,   setReviewSummary]    = useState('')
  const [reviewBody,      setReviewBody]       = useState('')
  const [reviewSubmitted, setReviewSubmitted]  = useState(false)

  useEffect(() => {
    setReviews(loadReviews(product.id))
    // Track recently viewed
    try {
      const all: any[] = JSON.parse(localStorage.getItem('recently_viewed') ?? '[]')
      const filtered   = all.filter((p: any) => p.id !== product.id)
      localStorage.setItem('recently_viewed', JSON.stringify([{
        id: product.id, name: product.name, slug: product.slug,
        price: product.price, compare_price: product.compare_price, images: product.images ?? [],
      }, ...filtered].slice(0, 10)))
    } catch {}
  }, [product.id])

  // Rating breakdown from persisted reviews
  const allRatings  = reviews.map(r => r.rating)
  const avgRating   = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : (product.rating ?? 0)
  const totalCount  = reviews.length || (product.review_count ?? 0)
  const ratingDist  = [5,4,3,2,1].map(r => ({
    label: String(r),
    count: reviews.length ? reviews.filter(rv => rv.rating === r).length : Math.round((totalCount * [0.6, 0.2, 0.1, 0.06, 0.04][5 - r])),
  }))

  function addToCart() {
    const variantStr = Object.entries(selectedVariant).map(([k, v]) => `${k}: ${v}`).join(', ')
    dispatch({ type: 'ADD_ITEM', item: { ...product, variant: variantStr || null, quantity: qty } })
    toast.success(`${product.name} added to cart`)
  }

  function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewNickname.trim()) return toast.error('Please enter your nickname')
    if (!reviewBody.trim())     return toast.error('Please write your review')
    const review: Review = {
      id: Date.now().toString(), nickname: reviewNickname.trim(),
      summary: reviewSummary.trim(), body: reviewBody.trim(),
      rating: reviewRating, date: new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
    saveReview(product.id, review)
    setReviews(prev => [review, ...prev])
    setReviewSubmitted(true)
    toast.success('Review submitted! Thank you.')
    setReviewNickname(''); setReviewSummary(''); setReviewBody(''); setReviewRating(5)
    setTimeout(() => setReviewSubmitted(false), 4000)
  }

  function toggleDigitalOption(opt: string) {
    setSelectedDigitalOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  const totalPrice = isDigital
    ? product.price + selectedDigitalOptions.reduce((sum: number, opt: string) => {
        const found = variants.find((v: any) => v.name === opt)
        return sum + (found?.price_modifier ?? 0)
      }, 0)
    : product.price * qty

  function share() {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  return (
    <div>
      {/* ── Sticky buy bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300"
        style={{ transform: sticky ? 'translateY(0)' : 'translateY(-100%)', backgroundColor: '#1a2638' }}>
        <div className="max-w-[1200px] mx-auto px-4 py-2.5 flex items-center gap-4">
          {images[0] && (
            <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
              <Image src={images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
            </div>
          )}
          <p className="text-sm font-semibold text-white flex-1 line-clamp-1">{product.name}</p>
          <p className="text-sm font-bold shrink-0" style={{ color: ACCENT }}>{formatPrice(product.price)}</p>
          <button onClick={addToCart} disabled={isOutOfStock}
            className="flex items-center gap-2 px-5 py-2 text-white text-xs font-bold rounded transition-opacity hover:opacity-90 disabled:opacity-50 shrink-0"
            style={{ backgroundColor: ACCENT }}>
            <ShoppingCart size={14} />
            Add To Cart
          </button>
        </div>
      </div>

      {/* ── Product header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 leading-snug" style={{ fontFamily: 'var(--font-heading)' }}>
            {product.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <Stars n={Math.round(avgRating)} size={14} />
            <span className="text-xs text-gray-400">{totalCount} {totalCount === 1 ? 'review' : 'reviews'}</span>
            <span className="text-gray-200">|</span>
            {product.brand && <span className="text-xs text-gray-400">Brand: <strong className="text-gray-600">{product.brand}</strong></span>}
            {product.sku   && <span className="text-xs text-gray-400">SKU: <strong className="text-gray-600">{product.sku}</strong></span>}
          </div>
        </div>
        <button onClick={share}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <Share2 size={14} />
          Share
        </button>
      </div>

      {/* ── 3-column grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr_220px] gap-6">

        {/* Col 1: Gallery */}
        <ProductGallery images={images} name={product.name} />

        {/* Col 2: Product info */}
        <div>
          {/* Price */}
          <div className="flex items-baseline gap-3 mb-1">
            {discount && (
              <span className="text-sm font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: ACCENT }}>
                -{discount}%
              </span>
            )}
            <span className="text-2xl font-extrabold" style={{ color: ACCENT }}>
              {formatPrice(isDigital ? totalPrice : product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-base text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
            )}
          </div>

          {/* Stock */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: isOutOfStock ? '#ef4444' : GREEN }}>
                {isOutOfStock ? '✕ Out of stock' : '✓ In stock'}
              </span>
              {!isOutOfStock && product.stock && product.stock <= 10 && (
                <span className="text-xs text-orange-500 font-medium">Only {product.stock} left!</span>
              )}
            </div>
            {isOutOfStock && (
              <BackInStockAlert productId={product.id} productName={product.name} />
            )}
          </div>

          {/* Short description */}
          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 border-b border-gray-100 pb-4">
              {product.description.slice(0, 280)}{product.description.length > 280 ? '…' : ''}
            </p>
          )}

          {/* ── DIGITAL: option checkboxes ── */}
          {isDigital && variants.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                {variants[0]?.label ?? 'Options'} <span style={{ color: ACCENT }}>*</span>
              </p>
              {variants.map((v: any) => (
                <label key={v.name} className="flex items-center gap-3 mb-2 cursor-pointer group">
                  <input type="checkbox" checked={selectedDigitalOptions.includes(v.name)}
                    onChange={() => toggleDigitalOption(v.name)}
                    className="w-4 h-4 rounded border-gray-300" style={{ accentColor: ACCENT }} />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {v.name}
                    {v.price_modifier > 0 && <span className="text-gray-400"> + {formatPrice(v.price_modifier)}</span>}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* ── PHYSICAL: variants ── */}
          {!isDigital && variants.map((v: any) => (
            <div key={v.id ?? v.name} className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                {v.name}
                {selectedVariant[v.name] && <span className="ml-2 text-gray-400 font-normal normal-case">— {selectedVariant[v.name]}</span>}
              </p>
              {v.type === 'color' ? (
                <div className="flex gap-2 flex-wrap">
                  {(v.options ?? []).map((opt: any) => (
                    <button key={opt.value}
                      onClick={() => setSelectedVariant(prev => ({ ...prev, [v.name]: opt.value }))}
                      title={opt.value}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: opt.color ?? opt.value,
                        borderColor: selectedVariant[v.name] === opt.value ? '#333' : '#d1d5db',
                        boxShadow: selectedVariant[v.name] === opt.value ? '0 0 0 2px #fff, 0 0 0 4px #333' : 'none',
                      }} />
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {(v.options ?? []).map((opt: any) => (
                    <button key={opt.value}
                      onClick={() => setSelectedVariant(prev => ({ ...prev, [v.name]: opt.value }))}
                      disabled={opt.stock === 0}
                      className="px-3 py-1 text-xs border rounded transition-all"
                      style={{
                        borderColor: selectedVariant[v.name] === opt.value ? '#333' : '#e5e7eb',
                        backgroundColor: selectedVariant[v.name] === opt.value ? '#333' : '#fff',
                        color: selectedVariant[v.name] === opt.value ? '#fff' : opt.stock === 0 ? '#ccc' : '#444',
                        textDecoration: opt.stock === 0 ? 'line-through' : 'none',
                      }}>
                      {opt.value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Quantity + CTA — anchor for sticky bar */}
          <div ref={buyRef}>
            {!isDigital && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Qty:</span>
                <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg">−</button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock ?? 99, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg">+</button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <button onClick={addToCart} disabled={isOutOfStock}
                className="flex items-center gap-2 px-8 py-2.5 text-white text-sm font-bold rounded transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT }}>
                {isDigital ? <Download size={15} /> : <ShoppingCart size={15} />}
                {isDigital ? 'Buy Now' : 'Add To Cart'}
              </button>

              {client.features.wishlist && (
                <button
                  onClick={() => { toggle(product); toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist') }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded hover:border-red-300 text-sm font-medium text-gray-600 transition-colors">
                  <Heart size={15} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                  {wishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
              )}

              {client.features.whatsappOrder && !isDigital && (
                <a href={getWhatsAppUrl(`Hi! I'd like to order: ${product.name} (Qty: ${qty}) — ${formatPrice(totalPrice)}`)}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2.5 text-xs font-semibold text-green-700 border-2 border-green-500 rounded hover:bg-green-50 transition-colors">
                  WhatsApp Order
                </a>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-1 border-t border-gray-100 pt-3">
            {product.categories && (
              <p>Category: <Link href={`/shop?category=${product.categories.slug}`}
                className="font-medium hover:underline" style={{ color: ACCENT }}>{product.categories.name}</Link></p>
            )}
            {product.brand && <p>Brand: <span className="text-gray-600 font-medium">{product.brand}</span></p>}
            {product.sku   && <p>SKU: <span className="text-gray-600 font-mono">{product.sku}</span></p>}
          </div>

          {/* Share */}
          <div className="border-t border-gray-100 pt-3">
            <ShareButtons title={product.name} description={product.description} />
          </div>
        </div>

        {/* Col 3: Trust + Special Offers */}
        <div className="space-y-4">
          {/* Trust badges */}
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {trustBadges.map((b, i) => (
              <div key={b.title} className={`flex items-center gap-3 px-3 py-2.5 ${i < trustBadges.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span style={{ color: ACCENT }}>{b.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{b.title}</p>
                  <p className="text-[10px] text-gray-400">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Offers */}
          {specialOffers.length > 0 && (
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Special Offers</p>
              </div>
              {specialOffers.slice(0, 3).map((p: any) => (
                <Link key={p.id} href={`/shop/${p.slug}`}
                  className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                  <div className="w-12 h-12 shrink-0 bg-gray-100 rounded overflow-hidden relative">
                    {p.images?.[0]
                      ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="48px" />
                      : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-300">{p.name?.charAt(0)}</div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 group-hover:text-[#e84c3d] transition-colors line-clamp-2">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.compare_price && <span className="text-[10px] text-gray-400 line-through">{formatPrice(p.compare_price)}</span>}
                      <span className="text-xs font-bold" style={{ color: ACCENT }}>{formatPrice(p.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="mt-8 border-t border-gray-200">
        <div className="flex border-b border-gray-200">
          {([
            { key: 'details', label: 'Details' },
            { key: 'info',    label: 'More Info' },
            { key: 'reviews', label: `Reviews (${totalCount})` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-5 py-3 text-sm font-medium transition-colors relative"
              style={{
                color: activeTab === tab.key ? '#333' : '#888',
                borderBottom: activeTab === tab.key ? `2px solid ${ACCENT}` : '2px solid transparent',
                marginBottom: '-1px',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">

          {/* DETAILS */}
          {activeTab === 'details' && (
            <div className="max-w-2xl">
              {product.description
                ? <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                : <p className="text-sm text-gray-400">No additional details available.</p>
              }
            </div>
          )}

          {/* MORE INFO */}
          {activeTab === 'info' && (
            <div className="max-w-lg">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    product.brand        && { label: 'Brand',        value: product.brand },
                    product.sku          && { label: 'SKU',          value: product.sku },
                    isDigital            && { label: 'Type',         value: 'Digital Download' },
                    !isDigital           && { label: 'Type',         value: 'Physical Product' },
                    product.weight       && { label: 'Weight',       value: `${product.weight}kg` },
                    product.manufacturer && { label: 'Manufacturer', value: product.manufacturer },
                    product.country      && { label: 'Country',      value: product.country },
                    product.categories   && { label: 'Category',     value: product.categories.name },
                  ].filter(Boolean).map((row: any) => (
                    <tr key={row.label} className="border-b border-gray-100">
                      <td className="py-2.5 pr-8 text-gray-500 font-medium w-36">{row.label}</td>
                      <td className="py-2.5 text-gray-700">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="max-w-2xl">
              {/* Rating summary */}
              {totalCount > 0 && (
                <div className="flex gap-8 mb-8 pb-6 border-b border-gray-100">
                  {/* Big score */}
                  <div className="flex flex-col items-center shrink-0">
                    <p className="text-5xl font-extrabold text-gray-800">{avgRating.toFixed(1)}</p>
                    <Stars n={Math.round(avgRating)} size={16} />
                    <p className="text-xs text-gray-400 mt-1">{totalCount} {totalCount === 1 ? 'review' : 'reviews'}</p>
                  </div>
                  {/* Breakdown bars */}
                  <div className="flex-1 space-y-1.5 py-1">
                    {ratingDist.map(({ label, count }) => (
                      <RatingBar key={label} label={label} count={count} total={totalCount} />
                    ))}
                  </div>
                </div>
              )}

              {/* Review list */}
              {reviews.length > 0 ? (
                <div className="space-y-5 mb-8">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-gray-100 pb-5">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          {r.summary && <p className="text-sm font-semibold text-gray-800">{r.summary}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">— {r.nickname} · {r.date}</p>
                        </div>
                        <Stars n={r.rating} size={12} />
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.body}</p>
                    </div>
                  ))}
                </div>
              ) : totalCount > 0 ? (
                <div className="space-y-4 mb-8">
                  <div className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">Awesome product!</p>
                      <Stars n={5} size={12} />
                    </div>
                    <p className="text-xs text-gray-400 mb-1">— Happy Customer · Jun 2026</p>
                    <p className="text-sm text-gray-600">Great quality and fast delivery. Highly recommend!</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-6">No reviews yet. Be the first!</p>
              )}

              {/* Review form */}
              {reviewSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 text-sm text-green-700 font-medium">
                  Thank you for your review! It has been submitted successfully.
                </div>
              ) : (
                <form onSubmit={submitReview} className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">Write a Review</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Your Rating *</label>
                      <ClickStars value={reviewRating} onChange={setReviewRating} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Nickname *</label>
                        <input value={reviewNickname} onChange={e => setReviewNickname(e.target.value)} required
                          placeholder="Your name"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Summary</label>
                        <input value={reviewSummary} onChange={e => setReviewSummary(e.target.value)}
                          placeholder="Short headline (optional)"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Your Review *</label>
                      <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} required
                        rows={4} placeholder="Tell others about your experience…"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none bg-white" />
                    </div>
                    <button type="submit"
                      className="px-6 py-2.5 text-white text-sm font-bold rounded-lg transition-opacity hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}>
                      Submit Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Carousels ── */}
      {related.length > 0 && <RelatedCarousel products={related} title="Related Products" />}
      {upsell.length  > 0 && <RelatedCarousel products={upsell}  title="You May Also Like" />}

      {/* ── Recently Viewed ── */}
      <RecentlyViewed currentId={product.id} />
    </div>
  )
}
