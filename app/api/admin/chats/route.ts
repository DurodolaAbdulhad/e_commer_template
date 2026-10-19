import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'

// GET /api/admin/chats — list recent conversations with last message snippet
export async function GET(req: NextRequest) {
  const admin = await verifyAdminToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, platform, platform_user_id, mode, customer_name, last_message_at')
    .order('last_message_at', { ascending: false })
    .limit(50)

  if (!convs) return NextResponse.json([])

  // Attach last message to each conversation
  const ids = convs.map(c => c.id)
  const { data: lastMsgs } = await supabase
    .from('dm_messages')
    .select('conversation_id, content, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false })

  const lastByConv: Record<string, string> = {}
  for (const m of lastMsgs ?? []) {
    if (!lastByConv[m.conversation_id]) lastByConv[m.conversation_id] = m.content
  }

  return NextResponse.json(convs.map(c => ({ ...c, last_message: lastByConv[c.id] ?? null })))
}
