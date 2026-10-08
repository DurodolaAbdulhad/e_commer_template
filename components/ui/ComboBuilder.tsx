'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useCart } from '@/hooks/useCart'
import { getProducts, getComboTiers } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'
import { client } from '@/config/client'
import toast from 'react-hot-toast'
import {
  X, Search, ShoppingBasket, Plus, Minus, Zap, ChevronRight,
  CheckCircle2, Layers
} from 'lucide-react'

const ACCENT = client.colors.primary
const NAVY   = '#1a2638'

interface Tier { min_spend: number; discount_pct: number }
interface Item  { id: string; name: string; price: number; images?: string[]; slug: string }

function useComboTiers(): Tier[] {
  const [tiers, setTiers] = useState<Tier[]>([])
  useEffect(() => {
    getComboTiers().then(setTiers).catch(() => {})
  }, [])
  return tiers
}

function activeTier(total: number, tiers: Tier[]): Tier | null {
  const sorted = [...tiers].sort((a, b) => b.min_spend - a.min_spend)
  return sorted.find(t => total >= t.min_spend) ?? null
}

function nextTier(total: number, tiers: Tier[]): Tier | null {
  const sorted = [...tiers].sort((a, b) => a.min_spend - b.min_spend)
  return sorted.find(t => total < t.min_spend) ?? null
}

export default function ComboBuilder() {
  const [open,     setOpen]     = useState(false)
  const [products, setProducts] = useState<Item[]>([])
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Map<string, number>>(new Map())
  const tiers   = useComboTiers()
  const { dispatch } = useCart() as any

  // Load products once drawer opens
  useEffect(() => {
    if (!open || products.length) return
    getProducts()
      .then((all: any[]) => setProducts(all.filter((p: any) => p.is_active !== false && p.stock !== 0)))
      .catch(() => {})
  }, [open, products.length])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  function toggle(id: string) {
    setSelected(prev => {
      const m = new Map(prev)
      if (m.has(id)) m.delete(id)
      else           m.set(id, 1)
      return m
    })
  }

  function setQty(id: string, qty: number) {
    setSelected(prev => {
      const m = new Map(prev)
      if (qty < 1) m.delete(id)
      else         m.set(id, qty)
      return m
    })
  }

  const selectedItems = [...selected.entries()]
    .map(([id, qty]) => {
      const p = products.find(x => x.id === id)
      return p ? { ...p, qty } : null
    })
    .filter(Boolean) as (Item & { qty: number })[]

  const subtotal  = selectedItems.reduce((s, p) => s + p.price * p.qty, 0)
  const tier      = activeTier(subtotal, tiers)
  const next      = nextTier(subtotal, tiers)
  const discount  = tier ? Math.round(subtotal * tier.discount_pct / 100) : 0
  const finalTotal = subtotal - discount

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 40)

  function addToCart() {
    if (!selectedItems.length) return
    selectedItems.forEach(p => {
      dispatch({ type: 'ADD_ITEM', item: { ...p, quantity: p.qty } })
    })
    toast.success(
      tier
        ? `Combo added! You saved ${formatPrice(discount)} (${tier.discount_pct}% off)`
        : 'Combo added to cart!',
      { duration: 4000 }
    )
    setSelected(new Map())
    setOpen(false)
  }

  const toNextSpend = next ? next.min_spend - subtotal : 0
  const toNextPct   = subtotal > 0 && next ? subtotal / next.min_spend : 0

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 text-white text-sm font-bold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ backgroundColor: ACCENT }}
        aria-label="Build your own combo"
      >
        <Layers size={16} />
        <span className="hidden sm:inline">Build a Combo</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={16} style={{ color: ACCENT }} />
              <h2 className="text-base font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                Build Your Combo
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Pick any products — the more you spend, the bigger your discount</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Tier progress bar */}
        {tiers.length > 0 && (
          <div className="px-5 pt-3 pb-1">
            {tier ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-xl">
                <CheckCircle2 size={14} />
                <span>{tier.discount_pct}% discount unlocked — keep going for more!</span>
              </div>
            ) : next ? (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Spend {formatPrice(next.min_spend)} to unlock <strong>{next.discount_pct}% off</strong></span>
                  <span>{formatPrice(toNextSpend)} away</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(toNextPct * 100, 100)}%`, backgroundColor: ACCENT }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden gap-0 min-h-0">

          {/* Left — product picker */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
            <div className="px-4 py-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products…"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
              {filtered.map(p => {
                const isSelected = selected.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                    style={{
                      backgroundColor: isSelected ? `${ACCENT}12` : 'transparent',
                      border: isSelected ? `1.5px solid ${ACCENT}40` : '1.5px solid transparent',
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
                      {p.images?.[0]
                        ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="40px" />
                        : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-300">{p.name.charAt(0)}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate leading-snug">{p.name}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: ACCENT }}>{formatPrice(p.price)}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: isSelected ? ACCENT : '#d1d5db', backgroundColor: isSelected ? ACCENT : 'transparent' }}>
                      {isSelected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No products found</p>
              )}
            </div>
          </div>

          {/* Right — selected items + totals */}
          <div className="w-52 sm:w-64 flex flex-col overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Your Combo <span className="font-normal text-gray-400">({selectedItems.length})</span>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {selectedItems.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-8 leading-relaxed">
                  Select products from the left to build your combo
                </p>
              ) : (
                selectedItems.map(p => (
                  <div key={p.id} className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 relative shrink-0 mt-0.5">
                      {p.images?.[0]
                        ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="32px" />
                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">{p.name.charAt(0)}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug line-clamp-2">{p.name}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: ACCENT }}>{formatPrice(p.price * p.qty)}</p>
                      {/* Qty controls */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <button onClick={() => setQty(p.id, p.qty - 1)}
                          className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400">
                          <Minus size={9} />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{p.qty}</span>
                        <button onClick={() => setQty(p.id, p.qty + 1)}
                          className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400">
                          <Plus size={9} />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => toggle(p.id)} className="text-gray-300 hover:text-red-400 mt-0.5">
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Summary footer */}
            <div className="px-4 py-3 border-t border-gray-100 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs font-semibold text-green-600">
                  <span>Discount ({tier?.discount_pct}%)</span>
                  <span>- {formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span>
                <span style={{ color: ACCENT }}>{formatPrice(finalTotal)}</span>
              </div>

              <button
                disabled={selectedItems.length === 0}
                onClick={addToCart}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT }}
              >
                <ShoppingBasket size={15} />
                Add Combo to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
