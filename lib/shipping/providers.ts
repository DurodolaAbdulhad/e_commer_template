export interface ShippingAddress {
  name: string
  phone: string
  email?: string
  address: string
  city: string
  state: string
  country?: string
}

export interface ShippingPackage {
  weight: number       // kg
  length?: number      // cm
  width?: number       // cm
  height?: number      // cm
  description?: string
  value?: number       // NGN declared value
}

export interface RateQuote {
  provider: string
  providerLabel: string
  service: string
  price: number        // NGN
  estimatedDays: string
  currency: string
  meta?: Record<string, any>
}

export interface BookingResult {
  provider: string
  waybillNumber: string
  trackingUrl?: string
  estimatedDelivery?: string
  cost: number
  meta?: Record<string, any>
}
