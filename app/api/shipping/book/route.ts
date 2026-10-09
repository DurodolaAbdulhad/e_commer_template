import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'
import { getShippingKeys } from '@/lib/shipping/get-keys'
import { sendboxBook } from '@/lib/shipping/sendbox'
import { gigBook }     from '@/lib/shipping/gig'
import { kwikBook }    from '@/lib/shipping/kwik'
import type { ShippingAddress, ShippingPackage } from '@/lib/shipping/providers'

// POST /api/shipping/book  — admin only
// Body: { provider, orderId, orderRef, origin, destination, package, meta? }
export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value ?? ''
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { provider, orderId, orderRef, origin, destination, package: pkg, meta = {} } = await req.json() as {
      provider: string
      orderId: string
      orderRef: string
      origin: ShippingAddress
      destination: ShippingAddress
      package: ShippingPackage
      meta?: Record<string, any>
    }

    if (!provider || !orderId || !origin || !destination || !pkg) {
      return NextResponse.json({ error: 'provider, orderId, origin, destination, and package are required' }, { status: 400 })
    }

    const keys = await getShippingKeys()
    let result

    if (provider === 'sendbox') {
      if (!keys.sendboxApiKey) return NextResponse.json({ error: 'Sendbox API key not configured — add it in Admin → Shipping → API Keys' }, { status: 503 })
      result = await sendboxBook(origin, destination, pkg, orderRef || orderId, keys.sendboxApiKey, meta?.rateId)
    } else if (provider === 'gig') {
      if (!keys.gigClientId || !keys.gigClientSecret) return NextResponse.json({ error: 'GIG credentials not configured — add them in Admin → Shipping → API Keys' }, { status: 503 })
      result = await gigBook(origin, destination, pkg, orderRef || orderId, keys.gigClientId, keys.gigClientSecret, keys.gigOriginCode, meta?.serviceCode)
    } else if (provider === 'kwik') {
      if (!keys.kwikSecretKey) return NextResponse.json({ error: 'Kwik API key not configured — add it in Admin → Shipping → API Keys' }, { status: 503 })
      result = await kwikBook(origin, destination, pkg, orderRef || orderId, keys.kwikSecretKey)
    } else {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    // Save waybill to order record
    const supabase = getServiceClient()
    await supabase
      .from('orders')
      .update({
        waybill_number:    result.waybillNumber,
        shipping_provider: provider,
        tracking_url:      result.trackingUrl ?? null,
        status:            'shipped',
      })
      .eq('id', orderId)

    return NextResponse.json({ ok: true, booking: result })
  } catch (err: any) {
    console.error('[shipping/book]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
