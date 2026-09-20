import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'
import { verifyPriceSig } from '@/app/api/checkout/initiate/route'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { reference, orderData } = body
  if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Paystack not configured' }, { status: 503 })

  // ── 1. Verify payment with Paystack ──────────────────────────────────────
  let paystackData: any
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const json = await res.json()
    if (!json.status || json.data?.status !== 'success') {
      return NextResponse.json({ error: 'Payment not verified', status: json.data?.status }, { status: 402 })
    }
    paystackData = json.data
  } catch (e: any) {
    return NextResponse.json({ error: 'Paystack verify failed', detail: e?.message }, { status: 502 })
  }

  const paidKobo   = paystackData.amount as number
  const paidAmount = Math.floor(paidKobo / 100)
  const priceSig   = paystackData.metadata?.price_sig as string | undefined

  // ── 2. Verify price signature (anti-tampering) ────────────────────────────
  if (priceSig) {
    const sigValid = verifyPriceSig(paidAmount, reference, priceSig)
    if (!sigValid) {
      console.error(`[verify] FRAUD ALERT — price mismatch ref=${reference} paidAmount=₦${paidAmount}`)
      return NextResponse.json({ error: 'Price mismatch — contact support' }, { status: 400 })
    }
  }

  if (!isServiceClientReady()) {
    // No DB configured — still return success so customer sees confirmation
    return NextResponse.json({ verified: true, dbSaved: false })
  }

  const supabase = getServiceClient()

  // ── 3. Check if order already exists (webhook may have beaten us) ─────────
  const { data: existing } = await supabase
    .from('orders')
    .select('id, status')
    .eq('payment_reference', reference)
    .single()

  if (existing) {
    // Already exists — just return it
    return NextResponse.json({ verified: true, dbSaved: true, orderId: existing.id, alreadyExists: true })
  }

  // ── 4. Create the order in Supabase ───────────────────────────────────────
  if (!orderData) {
    return NextResponse.json({ verified: true, dbSaved: false, reason: 'no orderData provided' })
  }

  try {
    const orderRow = {
      order_number:      orderData.order_number,
      status:            'processing',
      payment_status:    'paid',
      payment_method:    'paystack',
      payment_reference: reference,
      subtotal:          orderData.subtotal   ?? paidAmount,
      shipping_cost:     orderData.shipping_cost ?? 0,
      discount:          orderData.discount   ?? 0,
      vat:               orderData.vat        ?? 0,
      total:             orderData.total      ?? paidAmount,
      coupon_code:       orderData.coupon_code ?? null,
      delivery_method:   orderData.delivery_method ?? 'store_delivery',
      customer_name:     orderData.address?.fullName ?? paystackData.customer?.first_name ?? '',
      customer_email:    orderData.address?.email   ?? paystackData.customer?.email ?? '',
      customer_phone:    orderData.address?.phone   ?? '',
      shipping_address:  orderData.address ?? {},
      items:             orderData.items ?? [],
      notes:             orderData.address?.notes ?? '',
    }

    const { data: inserted, error } = await supabase
      .from('orders')
      .insert(orderRow)
      .select('id')
      .single()

    if (error) {
      console.error('[verify] DB insert error:', error.message)
      return NextResponse.json({ verified: true, dbSaved: false, dbError: error.message })
    }

    // Insert order items into order_items table if it exists
    if (orderData.items?.length && inserted?.id) {
      const orderItems = orderData.items.map((item: any) => ({
        order_id:   inserted.id,
        product_id: item.id ?? null,
        name:       item.name,
        price:      item.price,
        quantity:   item.quantity,
        image:      item.image ?? null,
        variant:    item.variant ?? null,
      }))
      await supabase.from('order_items').insert(orderItems).catch(() => {})
    }

    return NextResponse.json({ verified: true, dbSaved: true, orderId: inserted?.id })
  } catch (e: any) {
    console.error('[verify] Unexpected error:', e?.message)
    return NextResponse.json({ verified: true, dbSaved: false, error: e?.message })
  }
}
