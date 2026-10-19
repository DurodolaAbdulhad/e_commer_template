import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'
import { getDmSecrets } from '@/lib/dm-agent/get-secrets'
import { sendWhatsApp, sendInstagram } from '@/lib/dm-agent/meta'

export async function POST(req: NextRequest) {
  const admin = await verifyAdminToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, text } = await req.json()
  if (!conversationId || !text?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, platform, platform_user_id, platform_page_id')
    .eq('id', conversationId)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const secrets = await getDmSecrets()

  // Send via Meta
  try {
    if (conv.platform === 'whatsapp') {
      await sendWhatsApp(secrets.whatsappPhoneNumberId, secrets.whatsappAccessToken, conv.platform_user_id, text)
    } else {
      await sendInstagram(conv.platform_page_id, secrets.instagramAccessToken, conv.platform_user_id, text)
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  // Save message + ensure mode=human
  await Promise.all([
    supabase.from('dm_messages').insert({ conversation_id: conversationId, role: 'human', content: text }),
    supabase.from('conversations').update({ mode: 'human', last_message_at: new Date().toISOString() }).eq('id', conversationId),
  ])

  return NextResponse.json({ ok: true })
}
