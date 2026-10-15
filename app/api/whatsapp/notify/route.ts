import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/api-guard'
import { notifyStoreOwnerWhatsApp } from '@/lib/termii'
import { getServiceClient } from '@/lib/supabase-service'
import { client } from '@/config/client'
import { formatPrice } from '@/lib/utils'

// Internal endpoint — called server-side after order placement to
// notify the store owner's WhatsApp via Termii WhatsApp channel.
// Requires TERMII_API_KEY and the store phone to be set.
// Fails silently — never block order flow if this errors.

export async function POST(req: NextRequest) {
  const guard = requireSameOrigin(req)
  if (guard) return guard

  const { orderNumber, customerName, customerPhone, total } = await req.json().catch(() => ({}))
  if (!orderNumber) return NextResponse.json({ ok: false, reason: 'orderNumber required' }, { status: 400 })

  if (!process.env.TERMII_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'TERMII_API_KEY not set' })
  }

  // Get store owner's WhatsApp / phone from site_settings or client config
  const db = getServiceClient()
  const { data: row } = await db
    .from('site_settings').select('value').eq('id', 'store_whatsapp').maybeSingle()
  const ownerPhone = String((row as any)?.value ?? '') || (client as any).whatsapp || ''

  if (!ownerPhone) {
    return NextResponse.json({ ok: false, reason: 'No store WhatsApp number configured' })
  }

  try {
    await notifyStoreOwnerWhatsApp(
      ownerPhone,
      orderNumber,
      customerName || 'Customer',
      formatPrice(total ?? 0),
      client.name,
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[WA notify] failed:', (err?.message ?? '').slice(0, 200))
    return NextResponse.json({ ok: false })
  }
}
