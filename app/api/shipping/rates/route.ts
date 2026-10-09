import { NextRequest, NextResponse } from 'next/server'
import { sendboxRates } from '@/lib/shipping/sendbox'
import { gigRates }     from '@/lib/shipping/gig'
import { kwikRates }    from '@/lib/shipping/kwik'
import type { ShippingAddress, ShippingPackage } from '@/lib/shipping/providers'

// POST /api/shipping/rates
// Body: { providers: ['sendbox'|'gig'|'kwik'], origin, destination, package }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      providers = [],
      origin,
      destination,
      package: pkg,
    }: {
      providers: string[]
      origin: ShippingAddress
      destination: ShippingAddress
      package: ShippingPackage
    } = body

    if (!origin || !destination || !pkg) {
      return NextResponse.json({ error: 'origin, destination, and package are required' }, { status: 400 })
    }

    const tasks: Promise<any>[] = []
    const requested = providers.length > 0 ? providers : ['sendbox', 'gig', 'kwik']

    if (requested.includes('sendbox') && process.env.SENDBOX_API_KEY) {
      tasks.push(sendboxRates(origin, destination, pkg).catch(e => ({ error: e.message, provider: 'sendbox' })))
    }
    if (requested.includes('gig') && (process.env.GIG_CLIENT_ID || process.env.GIG_API_KEY)) {
      tasks.push(gigRates(origin, destination, pkg).catch(e => ({ error: e.message, provider: 'gig' })))
    }
    if (requested.includes('kwik') && process.env.KWIK_SECRET_KEY) {
      tasks.push(kwikRates(origin, destination, pkg).catch(e => ({ error: e.message, provider: 'kwik' })))
    }

    if (tasks.length === 0) {
      return NextResponse.json({ rates: [], message: 'No shipping providers configured' })
    }

    const results = await Promise.allSettled(tasks)
    const rates: any[] = []
    const errors: any[] = []

    results.forEach(r => {
      if (r.status === 'fulfilled') {
        if (Array.isArray(r.value)) {
          rates.push(...r.value)
        } else if (r.value?.error) {
          errors.push(r.value)
        }
      }
    })

    rates.sort((a, b) => a.price - b.price)
    return NextResponse.json({ rates, errors: errors.length ? errors : undefined })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
