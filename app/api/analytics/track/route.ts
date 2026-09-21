import { NextRequest, NextResponse } from 'next/server'
import { isServiceClientReady, getServiceClient } from '@/lib/supabase-service'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }) }

  const { path, device, session_id, referrer } = body ?? {}
  if (!path) return NextResponse.json({ ok: false })

  if (!isServiceClientReady()) return NextResponse.json({ ok: false })

  try {
    await getServiceClient()
      .from('page_views')
      .insert({ path, device: device ?? 'desktop', session_id: session_id ?? null, referrer: referrer ?? null })
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true })
}
