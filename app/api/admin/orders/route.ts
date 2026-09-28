import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Database not configured', orders: [], dbReady: false }, { status: 200 })
  }

  const supabase = getServiceClient()
  const status = req.nextUrl.searchParams.get('status') ?? ''

  let q = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)

  const { data, error } = await q

  if (error) {
    return NextResponse.json({ error: error.message, orders: [], dbReady: true }, { status: 200 })
  }

  return NextResponse.json({ orders: data ?? [], dbReady: true })
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { id, status } = await req.json().catch(() => ({}))
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const supabase = getServiceClient()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
