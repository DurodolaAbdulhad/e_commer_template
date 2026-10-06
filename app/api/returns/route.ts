import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/api-guard'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function POST(req: NextRequest) {
  const guard = requireSameOrigin(req)
  if (guard) return guard

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { orderNumber, email, items, reason, notes } = body
  if (!orderNumber || !email || !reason) {
    return NextResponse.json({ error: 'orderNumber, email and reason are required' }, { status: 400 })
  }

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const supabase = getServiceClient()

  // Verify the order belongs to this email before creating return
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status')
    .eq('order_number', orderNumber.trim().toUpperCase())
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ error: 'No matching order found' }, { status: 404 })
  }

  const { error } = await supabase.from('returns').insert({
    order_number:   order.order_number,
    order_id:       order.id,
    customer_email: email.trim().toLowerCase(),
    items:          items ?? [],
    reason:         reason.trim(),
    notes:          notes?.trim() || null,
    status:         'pending',
  })

  if (error) {
    console.error('[returns] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
