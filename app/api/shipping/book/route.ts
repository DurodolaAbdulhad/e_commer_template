import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'
import { sendboxBook } from '@/lib/shipping/sendbox'
import { gigBook }     from '@/lib/shipping/gig'
import { kwikBook }    from '@/lib/shipping/kwik'
import type { ShippingAddress, ShippingPackage } from '@/lib/shipping/providers'

// POST /api/shipping/book — admin only
// Body: { provider, orderId, origin, destination, package, meta }
export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value ?? ''
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      provider,
      orderId,
      orderRef,
      origin,
      destination,
      package: pkg,
      meta = {},
    }: {
      provider: string
      orderId: string
      orderRef: string
      origin: ShippingAddress
      destination: ShippingAddress
      package: ShippingPackage
      meta?: Record<string, any>
    } = body

    if (!provider || !orderId || !origin || !destination || !pkg) {
      return NextResponse.json({ error: 'provider, orderId, origin, destination, and package are required' }, { status: 400 })
    }

    let result
    if (provider === 'sendbox') {
      result = await sendboxBook(origin, destination, pkg, orderRef || orderId, meta?.rateId)
    } else if (provider === 'gig') {
      result = await gigBook(origin, destination, pkg, orderRef || orderId, meta?.serviceCode)
    } else if (provider === 'kwik') {
      result = await kwikBook(origin, destination, pkg, orderRef || orderId)
    } else {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    // Save waybill to order record
    const supabase = getServiceClient()
    await supabase
      .from('orders')
      .update({
        waybill_number:   result.waybillNumber,
        shipping_provider: provider,
        tracking_url:     result.trackingUrl ?? null,
        status:           'shipped',
      })
      .eq('id', orderId)

    return NextResponse.json({ ok: true, booking: result })
  } catch (err: any) {
    console.error('[shipping/book]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
