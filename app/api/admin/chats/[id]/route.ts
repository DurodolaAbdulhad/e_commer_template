import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'

// GET /api/admin/chats/[id] — messages for one conversation
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('dm_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json(data ?? [])
}
