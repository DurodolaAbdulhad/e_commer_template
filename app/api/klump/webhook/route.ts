import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

// POST /api/klump/webhook
// Receives installment payment events from Klump.
// Configure this URL in: Klump dashboard → Settings → Webhooks
// Set KLUMP_SECRET_KEY in .env to verify the signature.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Signature verification — skip if secret not configured
  const secret = process.env.KLUMP_SECRET_KEY
  if (secret) {
    const signature = req.headers.get('klump-hmac-sha512') ?? req.headers.get('x-klump-signature') ?? ''
    const expected  = createHmac('sha512', secret).update(rawBody).digest('hex')
    if (signature !== expected) {
      console.warn('[klump/webhook] signature mismatch — possible replay or spoofed request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: any
  try { payload = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event     = payload?.event as string | undefined
  const data      = payload?.data ?? {}
  const reference = data.merchant_reference as string | undefined
  const status    = data.status as string | undefined

  console.log('[klump/webhook] event:', event, 'ref:', reference, 'status:', status)

  if (!reference) {
    return NextResponse.json({ received: true })
  }

  if (!isServiceClientReady()) {
    console.error('[klump/webhook] DB not configured')
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const supabase = getServiceClient()

  // Map Klump events to order status changes
  // klump.payment.completed  — all installments paid; order fully settled
  // klump.payment.initiated  — first installment paid; plan is active
  // klump.payment.declined   — payment was declined; mark cancelled
  // klump.payment.closed     — plan closed (completed or cancelled by provider)
  let newStatus: string | null = null
  let bnplStatus: string | null = null

  if (event === 'klump.payment.completed') {
    newStatus  = 'processing'
    bnplStatus = 'completed'
  } else if (event === 'klump.payment.initiated' || event === 'klump.payment.successful') {
    newStatus  = 'processing'
    bnplStatus = 'active'
  } else if (event === 'klump.payment.declined') {
    newStatus  = 'cancelled'
    bnplStatus = 'declined'
  } else if (event === 'klump.payment.closed') {
    bnplStatus = status === 'completed' ? 'completed' : 'closed'
    if (status === 'completed') newStatus = 'processing'
  }

  const updatePayload: Record<string, any> = {}
  if (newStatus)   updatePayload.status      = newStatus
  if (bnplStatus)  updatePayload.bnpl_status = bnplStatus
  if (data.id)     updatePayload.bnpl_plan_id = String(data.id)

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('order_number', reference)

    if (error) {
      console.error('[klump/webhook] DB update error:', error.message)
    } else {
      console.log('[klump/webhook] updated order', reference, updatePayload)
    }
  }

  return NextResponse.json({ received: true })
}
