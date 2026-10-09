import type { ShippingAddress, ShippingPackage, RateQuote, BookingResult } from './providers'

const BASE = 'https://thegiglogistics.com/api'

async function gigToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`${BASE}/account/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Username: clientId, Password: clientSecret }),
  })
  if (!res.ok) throw new Error(`GIG auth failed: ${res.status}`)
  const data = await res.json()
  return data?.Object?.access_token ?? data?.access_token ?? ''
}

export async function gigRates(
  _origin: ShippingAddress,
  destination: ShippingAddress,
  pkg: ShippingPackage,
  clientId: string,
  clientSecret: string,
  originCode: string,
): Promise<RateQuote[]> {
  const token = await gigToken(clientId, clientSecret)
  const res = await fetch(`${BASE}/shipment/getpricelist`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      DepartureServiceCentreCode: originCode,
      DestinationServiceCentreCode: destination.state?.toUpperCase() ?? destination.city?.toUpperCase(),
      Weight: pkg.weight,
      IsVolumetric: false,
      ShipmentType: 'Regular',
    }),
  })
  if (!res.ok) throw new Error(`GIG rates error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const prices: any[] = Array.isArray(data?.Object) ? data.Object : []
  return prices.map(p => ({
    provider: 'gig',
    providerLabel: 'GIG Logistics',
    service: p.ServiceType ?? 'Standard',
    price: Number(p.Total ?? p.Amount ?? 0),
    estimatedDays: p.DeliveryTime ?? '2–4 business days',
    currency: 'NGN',
    meta: { serviceCode: p.ServiceCode ?? p.ServiceType },
  }))
}

export async function gigBook(
  origin: ShippingAddress,
  destination: ShippingAddress,
  pkg: ShippingPackage,
  orderRef: string,
  clientId: string,
  clientSecret: string,
  originCode: string,
  serviceCode?: string,
): Promise<BookingResult> {
  const token = await gigToken(clientId, clientSecret)
  const res = await fetch(`${BASE}/shipment/addshipment`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      SenderName: origin.name, SenderPhoneNumber: origin.phone,
      ReceiverName: destination.name, ReceiverPhoneNumber: destination.phone,
      ReceiverAddress: destination.address, ReceiverCity: destination.city, ReceiverState: destination.state,
      PaymentType: 'Online', ShipmentType: 'Regular',
      Weight: pkg.weight, Description: pkg.description ?? 'Order', Value: pkg.value ?? 0,
      ReferenceNumber: orderRef, ServiceCode: serviceCode ?? 'STANDARD',
      DepartureServiceCentreCode: originCode,
    }),
  })
  if (!res.ok) throw new Error(`GIG booking error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const waybill = data?.Object?.Waybill ?? data?.Object?.WaybillNumber ?? data?.Object ?? ''
  return {
    provider: 'gig',
    waybillNumber: String(waybill),
    trackingUrl: `https://thegiglogistics.com/tracking?waybill=${waybill}`,
    cost: Number(data?.Object?.Total ?? 0),
    meta: data?.Object,
  }
}
