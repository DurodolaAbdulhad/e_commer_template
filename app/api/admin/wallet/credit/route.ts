import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, amount, description, order_id } = body
  if (!email || !amount || amount <= 0) {
    return NextResponse.json({ error: 'email and amount required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { error } = await supabase.from('wallet_ledger').insert({
    email: email.trim().toLowerCase(),
    type: 'credit',
    amount: Number(amount),
    description: description || 'Refund credit',
    order_id: order_id ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
