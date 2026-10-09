import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { orderNumber, email } = body
  if (!orderNumber || !email) {
    return NextResponse.json({ error: 'orderNumber and email required' }, { status: 400 })
  }

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, created_at, updated_at, items, total, shipping_address, address, payment_method, receipt_url, tracking_notes')
    .eq('order_number', orderNumber.trim().toUpperCase())
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (error) {
    console.error('[track] DB error:', error.message)
    return NextResponse.json({ error: 'Could not look up order' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ order: null }, { status: 404 })
  }

  const shippingAddress = data.shipping_address ?? data.address ?? null

  return NextResponse.json({
    order: {
      id:               data.id,
      order_number:     data.order_number,
      status:           data.status,
      created_at:       data.created_at,
      updated_at:       data.updated_at,
      items:            data.items ?? [],
      total:            data.total,
      shipping_address: shippingAddress,
      payment_method:   data.payment_method ?? 'online',
      receipt_url:      data.receipt_url ?? null,
      tracking_notes:   data.tracking_notes ?? null,
    },
  })
}
