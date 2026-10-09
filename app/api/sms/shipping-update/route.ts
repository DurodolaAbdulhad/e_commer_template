import { NextRequest, NextResponse } from 'next/server'
import { sendShippingUpdateSMS } from '@/lib/termii'
import { requireInternalSecret, requireSameOrigin } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  const guard = requireInternalSecret(req) ?? requireSameOrigin(req)
  if (guard) return guard

  const { phone, orderNumber, status, storeName } = await req.json()

  if (!phone || !orderNumber || !status) {
    return NextResponse.json({ error: 'phone, orderNumber and status are required' }, { status: 400 })
  }

  if (!process.env.TERMII_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'SMS not configured' })
  }

  try {
    await sendShippingUpdateSMS(phone, orderNumber, status, storeName ?? 'MyStore')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[SMS] shipping-update failed:', (err?.message ?? '').slice(0, 200))
    return NextResponse.json({ ok: false })
  }
}
