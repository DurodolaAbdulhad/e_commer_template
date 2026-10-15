import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

// GET /api/orders/status?ref=ORDER_NUMBER
// Public: returns minimal order status fields for polling (no sensitive data)
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, status, payment_method, bnpl_status, bnpl_plan_id')
    .eq('order_number', ref)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    order_number: data.order_number,
    status:       data.status,
    bnpl_status:  data.bnpl_status ?? null,
  })
}
