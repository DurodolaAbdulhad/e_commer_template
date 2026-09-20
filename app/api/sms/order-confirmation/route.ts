import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmationSMS } from '@/lib/termii'
import { requireInternalSecret, requireSameOrigin } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  const guard = requireInternalSecret(req) ?? requireSameOrigin(req)
  if (guard) return guard

  const { phone, orderNumber, total, storeName } = await req.json()

  if (!phone || !orderNumber) {
    return NextResponse.json({ error: 'phone and orderNumber are required' }, { status: 400 })
  }

  if (!process.env.TERMII_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'SMS not configured' })
  }

  try {
    await sendOrderConfirmationSMS(phone, orderNumber, total ?? 0, storeName ?? 'MyStore')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // Fix 14: sanitize log — never log raw API error bodies (may contain keys/tokens)
    console.error('[SMS] order-confirmation failed:', (err?.message ?? '').slice(0, 200))
    return NextResponse.json({ ok: false })
  }
}
