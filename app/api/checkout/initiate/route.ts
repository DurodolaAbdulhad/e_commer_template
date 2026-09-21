import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getProducts, validateCoupon } from '@/lib/admin-db'
import { getShippingCost } from '@/lib/utils'
import { client } from '@/config/client'

function getSecret() {
  return process.env.CHECKOUT_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? 'fallback-change-me'
}

/**
 * Sign the server-verified total so the value passed to Paystack cannot be
 * tampered with client-side. The webhook verifies this same signature.
 */
function signTotal(total: number, reference: string): string {
  return createHmac('sha256', getSecret())
    .update(`${total}:${reference}`)
    .digest('hex')
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    items,
    couponCode       = '',
    giftCardDiscount = 0,
    reference,
    state            = '',  // customer's selected state for zone shipping
    area             = '',  // customer's selected area
    shipMethod       = 'store_delivery',
    selfLogisticsFee = 0,
  } = body

  if (!Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }
  if (!reference || typeof reference !== 'string') {
    return NextResponse.json({ error: 'reference required' }, { status: 400 })
  }

  // ── 1. Fetch authoritative prices server-side ───────────────────────────
  let allProducts: any[]
  try { allProducts = await getProducts() } catch {
    return NextResponse.json({ error: 'Could not load products' }, { status: 503 })
  }

  const productMap = new Map(allProducts.map((p: any) => [p.id, p]))

  let subtotal = 0
  for (const item of items) {
    const product = productMap.get(item.id)
    if (!product || product.is_active === false) continue
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
    subtotal += product.price * qty
  }

  // Load shipping overrides from Supabase so admin-saved rates are respected
  let shippingOverrides: any = {}
  try {
    const { isServiceClientReady, getServiceClient } = await import('@/lib/supabase-service')
    if (isServiceClientReady()) {
      const sb = getServiceClient()
      const keys = ['shipping_flat_rate','shipping_free_above','shipping_zones_enabled','shipping_zones']
      const { data: rows } = await sb.from('site_settings').select('id,value').in('id', keys.map(k => `store_${k}`))
      const m: Record<string, any> = {}
      rows?.forEach((r: any) => { m[r.id.replace('store_', '')] = r.value })
      shippingOverrides = {
        flatRate:     m.shipping_flat_rate     != null ? Number(m.shipping_flat_rate)  : undefined,
        freeAbove:    m.shipping_free_above    != null ? Number(m.shipping_free_above) : undefined,
        zonesEnabled: Boolean(m.shipping_zones_enabled),
        zones:        Array.isArray(m.shipping_zones) ? m.shipping_zones : [],
      }
    }
  } catch { /* non-fatal — fall back to client config */ }

  const shipping = shipMethod === 'self'
    ? Math.max(0, Number(selfLogisticsFee) || 0)
    : getShippingCost(subtotal, shippingOverrides, state, area)

  // ── 2. Validate coupon server-side ───────────────────────────────────────
  let couponDiscount = 0
  let couponApplied  = ''

  if (couponCode?.trim()) {
    try {
      const coupon = await validateCoupon(couponCode.trim().toUpperCase())
      if (coupon) {
        if (!coupon.min_order || subtotal >= coupon.min_order) {
          if (coupon.type === 'percent')  couponDiscount = Math.floor(subtotal * coupon.value / 100)
          if (coupon.type === 'fixed')    couponDiscount = Math.min(coupon.value, subtotal)
          if (coupon.type === 'shipping') couponDiscount = shipping
          couponApplied = coupon.code
        }
      }
    } catch { /* coupon validation failure is non-fatal */ }
  }

  // ── 3. Compute final total ───────────────────────────────────────────────
  const vatRate       = client.tax?.enabled && !client.tax?.inclusive ? (client.tax.rate ?? 0) / 100 : 0
  const safeGCDisc    = Math.max(0, Math.min(Number(giftCardDiscount), subtotal + shipping))
  const totalDiscount = couponDiscount + safeGCDisc
  const beforeVat     = Math.max(0, subtotal + shipping - totalDiscount)
  const vatAmount     = Math.floor(beforeVat * vatRate)
  const total         = beforeVat + vatAmount

  // ── 4. Sign the total so the webhook can verify it ───────────────────────
  const sig = signTotal(total, reference)

  return NextResponse.json({
    subtotal,
    shipping,
    couponDiscount,
    couponApplied,
    vatAmount,
    total,
    sig,
  })
}

/** Verify a price signature produced by this route */
export function verifyPriceSig(total: number, reference: string, sig: string): boolean {
  const expected = createHmac('sha256', getSecret())
    .update(`${total}:${reference}`)
    .digest('hex')
  try {
    const { timingSafeEqual } = require('crypto') as typeof import('crypto')
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch { return false }
}
