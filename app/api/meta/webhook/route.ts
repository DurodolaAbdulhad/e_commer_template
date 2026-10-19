import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getServiceClient } from '@/lib/supabase-service'
import { getDmSecrets } from '@/lib/dm-agent/get-secrets'
import { runDmEngine, type Platform, type ConversationContext } from '@/lib/dm-agent/engine'
import { getStoreSetting } from '@/lib/admin-db'

export const maxDuration = 60

// ── GET: Meta webhook verification ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const secrets = await getDmSecrets()

  // Accept verify token for either platform
  if (mode === 'subscribe' && (token === secrets.whatsappVerifyToken || token === secrets.instagramVerifyToken)) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ── POST: Receive messages ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig     = req.headers.get('x-hub-signature-256') ?? ''

  // Detect platform from object field in payload
  let payload: any
  try { payload = JSON.parse(rawBody) } catch { return new NextResponse('Bad JSON', { status: 400 }) }

  const secrets = await getDmSecrets()
  const platform = detectPlatform(payload)
  if (!platform) return new NextResponse('OK', { status: 200 })  // unknown event type — ack and ignore

  // ── MANDATORY signature verification ─────────────────────────────────────
  const appSecret = platform === 'whatsapp' ? secrets.whatsappAppSecret : secrets.instagramAppSecret
  if (!appSecret) return new NextResponse('Not configured', { status: 200 })

  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
  if (sig !== expected) {
    console.error('[meta-webhook] Signature mismatch — possible spoofed request')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // ── Check platform is enabled ─────────────────────────────────────────────
  const enabledFlag = platform === 'whatsapp' ? 'whatsapp_enabled' : 'instagram_enabled'
  const enabled = await getStoreSetting(enabledFlag)
  if (!enabled || enabled === false || enabled === '0') {
    return new NextResponse('OK', { status: 200 })
  }

  // ── Extract message ───────────────────────────────────────────────────────
  const msg = extractMessage(payload, platform)
  if (!msg) return new NextResponse('OK', { status: 200 })

  const { platformUserId, platformPageId, messageId, text } = msg
  if (!text?.trim()) return new NextResponse('OK', { status: 200 })

  const supabase = getServiceClient()

  // Deduplicate: skip if we've already processed this platform_message_id
  if (messageId) {
    const { count } = await supabase
      .from('dm_messages')
      .select('id', { count: 'exact', head: true })
      .eq('platform_message_id', messageId)
    if ((count ?? 0) > 0) return new NextResponse('OK', { status: 200 })
  }

  // Upsert conversation
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .upsert(
      { platform, platform_user_id: platformUserId, platform_page_id: platformPageId, last_message_at: new Date().toISOString() },
      { onConflict: 'platform,platform_user_id,platform_page_id', ignoreDuplicates: false },
    )
    .select('id, mode')
    .single()

  if (convErr || !conv) {
    console.error('[meta-webhook] Failed to upsert conversation:', convErr)
    return new NextResponse('OK', { status: 200 })
  }

  // Save incoming message
  await supabase.from('dm_messages').insert({
    conversation_id:     conv.id,
    role:                'customer',
    content:             text,
    platform_message_id: messageId ?? null,
  })

  // If human mode: do nothing — staff replies via admin Chats panel
  if (conv.mode === 'human') return new NextResponse('OK', { status: 200 })

  // AI mode: run engine
  const [persona, floorPctRaw] = await Promise.all([
    getStoreSetting('dm_agent_persona'),
    getStoreSetting('dm_agent_floor_pct'),
  ])

  const ctx: ConversationContext = {
    conversationId:  conv.id,
    platform,
    platformUserId,
    platformPageId,
    accessToken:     platform === 'whatsapp' ? secrets.whatsappAccessToken : secrets.instagramAccessToken,
    phoneNumberId:   platform === 'whatsapp' ? secrets.whatsappPhoneNumberId : undefined,
    floorPct:        Number(floorPctRaw ?? 0),
    persona:         String(persona ?? 'friendly and professional'),
    storeBaseUrl:    process.env.NEXT_PUBLIC_SITE_URL ?? '',
  }

  await runDmEngine(text, ctx, secrets.claudeApiKey)

  return new NextResponse('OK', { status: 200 })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectPlatform(payload: any): Platform | null {
  if (payload?.object === 'whatsapp_business_account') return 'whatsapp'
  if (payload?.object === 'instagram' || payload?.object === 'page') return 'instagram'
  return null
}

function extractMessage(payload: any, platform: Platform) {
  try {
    if (platform === 'whatsapp') {
      const entry   = payload.entry?.[0]
      const change  = entry?.changes?.[0]
      const msgData = change?.value?.messages?.[0]
      if (!msgData || msgData.type !== 'text') return null
      return {
        platformUserId: msgData.from,
        platformPageId: change?.value?.metadata?.phone_number_id ?? '',
        messageId:      msgData.id,
        text:           msgData.text?.body ?? '',
      }
    } else {
      const entry    = payload.entry?.[0]
      const pageId   = String(entry?.id ?? '')
      const messaging = entry?.messaging?.[0] ?? entry?.standby?.[0]
      if (!messaging?.message?.text) return null
      return {
        platformUserId: String(messaging.sender?.id ?? ''),
        platformPageId: pageId,
        messageId:      messaging.message?.mid ?? null,
        text:           messaging.message.text,
      }
    }
  } catch { return null }
}
