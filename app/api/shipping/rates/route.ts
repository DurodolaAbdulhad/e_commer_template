import { NextRequest, NextResponse } from 'next/server'
import { getShippingKeys } from '@/lib/shipping/get-keys'
import { sendboxRates } from '@/lib/shipping/sendbox'
import { gigRates }     from '@/lib/shipping/gig'
import { kwikRates }    from '@/lib/shipping/kwik'
import type { ShippingAddress, ShippingPackage } from '@/lib/shipping/providers'

// POST /api/shipping/rates
// Body: { providers?: string[], origin, destination, package }
export async function POST(req: NextRequest) {
  try {
    const { providers = [], origin, destination, package: pkg } = await req.json() as {
      providers?: string[]
      origin: ShippingAddress
      destination: ShippingAddress
      package: ShippingPackage
    }

    if (!origin || !destination || !pkg) {
      return NextResponse.json({ error: 'origin, destination, and package are required' }, { status: 400 })
    }

    const keys = await getShippingKeys()
    const requested = providers.length > 0 ? providers : ['sendbox', 'gig', 'kwik']

    const tasks: Promise<any>[] = []

    if (requested.includes('sendbox') && keys.sendboxApiKey) {
      tasks.push(
        sendboxRates(origin, destination, pkg, keys.sendboxApiKey)
          .catch(e => ({ error: e.message, provider: 'sendbox' }))
      )
    }
    if (requested.includes('gig') && keys.gigClientId && keys.gigClientSecret) {
      tasks.push(
        gigRates(origin, destination, pkg, keys.gigClientId, keys.gigClientSecret, keys.gigOriginCode)
          .catch(e => ({ error: e.message, provider: 'gig' }))
      )
    }
    if (requested.includes('kwik') && keys.kwikSecretKey) {
      tasks.push(
        kwikRates(origin, destination, pkg, keys.kwikSecretKey)
          .catch(e => ({ error: e.message, provider: 'kwik' }))
      )
    }

    if (tasks.length === 0) {
      return NextResponse.json({ rates: [], message: 'No shipping providers configured. Add API keys in Admin → Shipping → API Keys.' })
    }

    const results = await Promise.allSettled(tasks)
    const rates: any[] = []
    const errors: any[] = []

    results.forEach(r => {
      if (r.status === 'fulfilled') {
        if (Array.isArray(r.value)) rates.push(...r.value)
        else if (r.value?.error) errors.push(r.value)
      }
    })

    rates.sort((a, b) => a.price - b.price)
    return NextResponse.json({ rates, errors: errors.length ? errors : undefined })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
