import type { ShippingAddress, ShippingPackage, RateQuote, BookingResult } from './providers'

const BASE = 'https://api.kwik.delivery/api/v1'

function headers() {
  return {
    'x-api-key': process.env.KWIK_SECRET_KEY ?? '',
    'Content-Type': 'application/json',
  }
}

export async function kwikRates(
  origin: ShippingAddress,
  destination: ShippingAddress,
  pkg: ShippingPackage,
): Promise<RateQuote[]> {
  const res = await fetch(`${BASE}/order/estimate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      pickupDetails: [{
        address: origin.address,
        name: origin.name,
        phone: origin.phone,
        email: origin.email ?? '',
        city: origin.city,
        state: origin.state,
      }],
      deliveryDetails: [{
        address: destination.address,
        name: destination.name,
        phone: destination.phone,
        email: destination.email ?? '',
        city: destination.city,
        state: destination.state,
      }],
      packageDetails: {
        weight: pkg.weight,
        description: pkg.description ?? 'Order',
        value: pkg.value ?? 0,
      },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Kwik rates error ${res.status}: ${err}`)
  }
  const data = await res.json()
  const price = Number(data?.data?.totalEstimatedPrice ?? data?.data?.price ?? data?.totalEstimatedPrice ?? 0)
  if (!price) return []
  return [{
    provider: 'kwik',
    providerLabel: 'Kwik',
    service: 'Same Day / Next Day',
    price,
    estimatedDays: data?.data?.estimatedDeliveryTime ?? '1–2 business days',
    currency: 'NGN',
    meta: data?.data,
  }]
}

export async function kwikBook(
  origin: ShippingAddress,
  destination: ShippingAddress,
  pkg: ShippingPackage,
  orderRef: string,
): Promise<BookingResult> {
  const res = await fetch(`${BASE}/order`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      pickupDetails: [{
        address: origin.address,
        name: origin.name,
        phone: origin.phone,
        email: origin.email ?? '',
        city: origin.city,
        state: origin.state,
      }],
      deliveryDetails: [{
        address: destination.address,
        name: destination.name,
        phone: destination.phone,
        email: destination.email ?? '',
        city: destination.city,
        state: destination.state,
      }],
      packageDetails: {
        weight: pkg.weight,
        description: pkg.description ?? 'Order',
        value: pkg.value ?? 0,
      },
      externalReference: orderRef,
      paymentMethod: 'PREPAID',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Kwik booking error ${res.status}: ${err}`)
  }
  const data = await res.json()
  const order = data?.data ?? data
  return {
    provider: 'kwik',
    waybillNumber: order?.orderId ?? order?.trackingId ?? '',
    trackingUrl: `https://track.kwik.delivery/${order?.orderId ?? ''}`,
    cost: Number(order?.totalEstimatedPrice ?? order?.price ?? 0),
    meta: order,
  }
}
