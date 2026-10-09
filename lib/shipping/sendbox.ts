import type { ShippingAddress, ShippingPackage, RateQuote, BookingResult } from './providers'

const BASE = 'https://api.sendbox.co'

function headers(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

export async function sendboxRates(
  origin: ShippingAddress,
  destination: ShippingAddress,
  pkg: ShippingPackage,
  apiKey: string,
): Promise<RateQuote[]> {
  const res = await fetch(`${BASE}/shipping/rates`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      origin: {
        name: origin.name, phone: origin.phone,
        address: origin.address, city: origin.city,
        state: origin.state, country: origin.country ?? 'NG',
      },
      destination: {
        name: destination.name, phone: destination.phone,
        address: destination.address, city: destination.city,
        state: destination.state, country: destination.country ?? 'NG',
      },
      package: {
        weight: pkg.weight, length: pkg.length ?? 20,
        width: pkg.width ?? 15, height: pkg.height ?? 10,
        description: pkg.description ?? 'Order', value: pkg.value ?? 0,
      },
    }),
  })
  if (!res.ok) throw new Error(`Sendbox rates error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const rates: any[] = Array.isArray(data?.rates) ? data.rates : Array.isArray(data?.data) ? data.data : []
  return rates.map(r => ({
    provider: 'sendbox',
    providerLabel: 'Sendbox',
    service: r.service_name ?? r.name ?? 'Standard',
    price: Number(r.total ?? r.price ?? 0),
    estimatedDays: r.estimated_delivery ?? r.transit_days ?? '2–5 days',
    currency: 'NGN',
    meta: { rateId: r.id ?? r.rate_id },
  }))
}

export async function sendboxBook(
  origin: ShippingAddress,
  destination: ShippingAddress,
  pkg: ShippingPackage,
  orderRef: string,
  apiKey: string,
  rateId?: string,
): Promise<BookingResult> {
  const body: any = {
    origin: {
      name: origin.name, phone: origin.phone,
      address: origin.address, city: origin.city,
      state: origin.state, country: origin.country ?? 'NG',
    },
    destination: {
      name: destination.name, phone: destination.phone,
      address: destination.address, city: destination.city,
      state: destination.state, country: destination.country ?? 'NG',
    },
    package: {
      weight: pkg.weight, length: pkg.length ?? 20,
      width: pkg.width ?? 15, height: pkg.height ?? 10,
      description: pkg.description ?? 'Order', value: pkg.value ?? 0,
    },
    reference: orderRef,
  }
  if (rateId) body.rate_id = rateId
  const res = await fetch(`${BASE}/shipments`, {
    method: 'POST', headers: headers(apiKey), body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Sendbox booking error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const s = data?.shipment ?? data?.data ?? data
  return {
    provider: 'sendbox',
    waybillNumber: s?.tracking_number ?? s?.waybill_number ?? s?.id ?? '',
    trackingUrl: s?.tracking_url ?? `https://app.sendbox.co/tracking/${s?.tracking_number ?? ''}`,
    estimatedDelivery: s?.estimated_delivery ?? '',
    cost: Number(s?.amount ?? s?.price ?? 0),
    meta: s,
  }
}
