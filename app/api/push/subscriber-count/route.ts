import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value ?? ''
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const supabase = getServiceClient()
    const { count } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
    return NextResponse.json({ count: count ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
