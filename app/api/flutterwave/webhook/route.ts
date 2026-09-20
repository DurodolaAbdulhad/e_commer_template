import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { verifyPriceSig } from '@/app/api/checkout/initiate/route'
import { isServiceClientReady, getServiceClient } from '@/lib/supabase-service'

export async function POST(req: NextRequest) {
  // Flutterwave verifies webhooks via a secret hash header
  const hash = req.headers.get('verif-hash')
  const secret = process.env.FLW_WEBHOOK_SECRET

  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  if (!hash) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  try {
    if (!timingSafeEqual(Buffer.from(hash), Buffer.from(secret))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: any
  try { event = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event === 'charge.completed' && event.data?.status === 'successful') {
    const reference  = event.data?.tx_ref    as string
    const paidAmount = event.data?.amount     as number   // Flutterwave sends full currency units
    const currency   = event.data?.currency   as string
    const priceSig   = event.data?.meta?.price_sig as string | undefined

    // Verify currency matches store currency
    if (currency !== 'NGN') {
      console.error(`[Flutterwave Webhook] Currency mismatch: expected NGN, got ${currency}`)
      return NextResponse.json({ received: true, status: 'currency_mismatch' })
    }

    // Verify the amount matches the server-signed total
    if (priceSig) {
      const sigValid = verifyPriceSig(paidAmount, reference, priceSig)
      if (!sigValid) {
        console.error(
          `[Flutterwave Webhook] FRAUD ALERT — price mismatch on ref=${reference}: ` +
          `Flutterwave reported ₦${paidAmount}, but signature does not match. Order NOT fulfilled.`
        )
        return NextResponse.json({ received: true, status: 'amount_mismatch' })
      }
    }

    console.log(`[Flutterwave Webhook] Verified charge.completed: ref=${reference} amount=₦${paidAmount}`)

    if (isServiceClientReady()) {
      try {
        const supabase = getServiceClient()
        const { error } = await supabase
          .from('orders')
          .update({ status: 'paid', payment_status: 'paid' })
          .eq('payment_reference', reference)
        if (error) console.error('[Flutterwave Webhook] DB update error:', error.message)
        else console.log(`[Flutterwave Webhook] Order marked paid: ref=${reference}`)
      } catch (err: any) {
        console.error('[Flutterwave Webhook] Could not update order:', err?.message)
      }
    } else {
      console.warn('[Flutterwave Webhook] Supabase service role not configured — order not updated in DB')
    }
  }

  return NextResponse.json({ received: true })
}
