import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'

// GET /api/admin/fulfilment — paid orders with fulfilment_stage
export async function GET(req: NextRequest) {
  const admin = await verifyAdminToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, total_amount, created_at, fulfilment_stage, source')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(200)

  return NextResponse.json(data ?? [])
}
