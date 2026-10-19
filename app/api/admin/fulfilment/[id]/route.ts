import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'

const VALID_STAGES = new Set(['paid', 'packing', 'packed', 'dispatched'])

// PATCH /api/admin/fulfilment/[id] — advance fulfilment stage
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fulfilment_stage } = await req.json()
  if (!VALID_STAGES.has(fulfilment_stage)) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
  }

  const supabase = getServiceClient()
  await supabase.from('orders').update({ fulfilment_stage }).eq('id', params.id)

  return NextResponse.json({ ok: true })
}
