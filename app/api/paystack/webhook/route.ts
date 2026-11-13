import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { verifyPriceSig } from '@/app/api/checkout/initiate/route'
import { isServiceClientReady, getServiceClient } from '@/lib/supabase-service'
import { notifyStoreOwner } from '@/lib/notify-store'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-paystack-signature')
  const body      = await req.text()

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  // ── 1. Verify Paystack HMAC-SHA512 ────────────────────────────────────────
  const hash = createHmac('sha512', secret).update(body).digest('hex')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  try {
    if (!timingSafeEqual(Buffer.from(hash), Buffer.from(signature))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: any
  try { event = JSON.parse(body) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event === 'charge.success') {
    const reference  = event.data?.reference as string
    const paidKobo   = event.data?.amount    as number
    const paidAmount = Math.floor(paidKobo / 100)

    // ── 2. Fix C: verify the amount matches the server-signed total ──────────
    // The order metadata carries price_sig set by /api/checkout/initiate.
    // If it doesn't match paidAmount, flag as suspicious and do NOT fulfil.
    const priceSig = event.data?.metadata?.price_sig as string | undefined

    if (priceSig) {
      const sigValid = verifyPriceSig(paidAmount, reference, priceSig)
      if (!sigValid) {
        console.error(
          `[Paystack Webhook] FRAUD ALERT — price mismatch on ref=${reference}: ` +
          `Paystack reported ₦${paidAmount}, but signature does not match. Order NOT fulfilled.`
        )
        // Respond 200 so Paystack doesn't retry, but do NOT mark the order as paid
        return NextResponse.json({ received: true, status: 'amount_mismatch' })
      }
    }

    // Amount verified — safe to fulfil the order
    console.log(`[Paystack Webhook] Verified charge.success: ref=${reference} amount=₦${paidAmount}`)

    if (isServiceClientReady()) {
      try {
        const supabase = getServiceClient()
        // Try update first (order may already exist from confirmation page)
        const { data: existing } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_reference', reference)
          .single()

        if (existing) {
          const { error } = await supabase
            .from('orders')
            .update({ status: 'paid', payment_status: 'paid' })
            .eq('payment_reference', reference)
          if (error) {
            console.error('[Paystack Webhook] DB update error:', error.message)
          } else {
            console.log(`[Paystack Webhook] Order marked paid: ref=${reference}`)
            const { data: order } = await supabase
              .from('orders')
              .select('order_number, customer_name, customer_email, customer_phone, total, items')
              .eq('payment_reference', reference)
              .single()
            notifyStoreOwner({
              orderNumber:   order?.order_number ?? reference,
              customerName:  order?.customer_name ?? event.data?.customer?.first_name ?? 'Customer',
              customerPhone: order?.customer_phone ?? '',
              customerEmail: order?.customer_email ?? event.data?.customer?.email ?? '',
              total:         order?.total ?? paidAmount,
              itemCount:     Array.isArray(order?.items) ? order.items.length : undefined,
              paymentMethod: 'Paystack',
            })
          }
        } else {
          // Order not created yet — insert minimal record so admin can see it
          const { error } = await supabase.from('orders').insert({
            order_number:      reference,
            status:            'processing',
            payment_status:    'paid',
            payment_method:    'paystack',
            payment_reference: reference,
            total:             paidAmount,
            subtotal:          paidAmount,
            customer_email:    event.data?.customer?.email ?? '',
            customer_name:     event.data?.customer?.first_name ?? '',
            shipping_address:  {},
            items:             [],
          })
          if (error) {
            console.error('[Paystack Webhook] DB insert error:', error.message)
          } else {
            console.log(`[Paystack Webhook] Order created from webhook: ref=${reference}`)
            notifyStoreOwner({
              orderNumber:   reference,
              customerName:  event.data?.customer?.first_name ?? 'Customer',
              customerEmail: event.data?.customer?.email ?? '',
              total:         paidAmount,
              paymentMethod: 'Paystack',
            })
          }
        }
      } catch (err: any) {
        console.error('[Paystack Webhook] Could not update order:', err?.message)
      }
    } else {
      console.warn('[Paystack Webhook] Supabase service role not configured — order not updated in DB')
    }
  }

  return NextResponse.json({ received: true })
}
