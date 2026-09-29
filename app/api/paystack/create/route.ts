import { NextRequest, NextResponse } from 'next/server'
import { verifyPriceSig } from '@/app/api/checkout/initiate/route'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Paystack not configured' }, { status: 503 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, amount, reference, sig, metadata, callbackUrl, orderData } = body

  if (!email || !amount || !reference) {
    return NextResponse.json({ error: 'email, amount, reference required' }, { status: 400 })
  }

  // Verify the server-signed amount hasn't been tampered with
  if (sig && !verifyPriceSig(amount, reference, sig)) {
    return NextResponse.json({ error: 'Price signature invalid' }, { status: 400 })
  }

  // ── Pre-save order to DB so it always exists, regardless of redirect outcome ──
  if (orderData && isServiceClientReady()) {
    try {
      const supabase = getServiceClient()
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_reference', reference)
        .maybeSingle()

      if (!existing) {
        await supabase.from('orders').insert({
          order_number:      orderData.order_number,
          status:            'pending_payment',
          payment_status:    'pending',
          payment_method:    'paystack',
          payment_reference: reference,
          subtotal:          orderData.subtotal   ?? 0,
          shipping_cost:     orderData.shipping_cost ?? 0,
          discount:          orderData.discount   ?? 0,
          vat:               orderData.vat        ?? 0,
          total:             orderData.total      ?? amount,
          coupon_code:       orderData.coupon_code ?? null,
          delivery_method:   orderData.delivery_method ?? 'store_delivery',
          customer_name:     orderData.address?.fullName ?? '',
          customer_email:    orderData.address?.email   ?? email,
          customer_phone:    orderData.address?.phone   ?? '',
          shipping_address:  orderData.address ?? {},
          items:             orderData.items ?? [],
          notes:             orderData.address?.notes ?? '',
        })
      }
    } catch (e) {
      // Non-fatal — verify route will insert on return if this fails
      console.error('[paystack/create] pre-save failed:', (e as any)?.message)
    }
  }

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),   // kobo
      currency: 'NGN',
      reference,
      callback_url: callbackUrl,
      metadata: metadata ?? {},
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err?.message ?? 'Paystack error' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json({ authorization_url: data.data?.authorization_url })
}
