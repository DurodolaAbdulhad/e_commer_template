import type { ShippingAddress, ShippingPackage, RateQuote, BookingResult } from './providers'

const BASE = 'https://api.kwik.delivery/api/v1'

function headers(secretKey: string) {
  return { 'x-api-key': secretKey, 'Content-Type': 'application/json' }
}

const pickDel = (a: ShippingAddress) => ({
  address: a.address, name: a.name, phone: a.phone,
  email: a.email ?? '', city: a.city, state: a.state,
})

export async function kwikRates(
  origin: ShippingAddress,
  destination: ShippingAddress,
  pkg: ShippingPackage,
  secretKey: string,
): Promise<RateQuote[]> {
  const res = await fetch(`${BASE}/order/estimate`, {
    method: 'POST',
    headers: headers(secretKey),
    body: JSON.stringify({
      pickupDetails: [pickDel(origin)],
      deliveryDetails: [pickDel(destination)],
      packageDetails: { weight: pkg.weight, description: pkg.description ?? 'Order', value: pkg.value ?? 0 },
    }),
  })
  if (!res.ok) throw new Error(`Kwik rates error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const price = Number(data?.data?.totalEstimatedPrice ?? data?.data?.price ?? 0)
  if (!price) return []
  return [{
    provider: 'kwik', providerLabel: 'Kwik',
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
  secretKey: string,
): Promise<BookingResult> {
  const res = await fetch(`${BASE}/order`, {
    method: 'POST',
    headers: headers(secretKey),
    body: JSON.stringify({
      pickupDetails: [pickDel(origin)],
      deliveryDetails: [pickDel(destination)],
      packageDetails: { weight: pkg.weight, description: pkg.description ?? 'Order', value: pkg.value ?? 0 },
      externalReference: orderRef,
      paymentMethod: 'PREPAID',
    }),
  })
  if (!res.ok) throw new Error(`Kwik booking error ${res.status}: ${await res.text()}`)
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
