import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { client } from '@/config/client'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount) {
  return `${client.currencySymbol}${Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text, length = 100) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '…' : text
}

export function getDiscount(price, comparePrice) {
  if (!comparePrice || comparePrice <= price) return null
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export function generateOrderNumber() {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 90000) + 10000
  return `ORD-${year}-${rand}`
}

export function getWhatsAppUrl(message) {
  return `https://wa.me/${client.whatsapp}?text=${encodeURIComponent(message)}`
}

export function getShippingCost(subtotal, overrides, state, area) {
  const flatRate  = overrides?.flatRate  ?? client.shipping.flatRate
  const freeAbove = overrides?.freeAbove ?? client.shipping.freeAbove
  if (freeAbove > 0 && subtotal >= freeAbove) return 0

  if (state && overrides?.zonesEnabled && Array.isArray(overrides?.zones)) {
    // Pass 1: area-specific rate (zone has per-area pricing AND customer area matches)
    if (area) {
      for (const zone of overrides.zones) {
        if (zone.states?.includes(state) && Array.isArray(zone.areaRates) && zone.areaRates.length > 0) {
          const areaRate = zone.areaRates.find(a => a.area === area)
          if (areaRate) return areaRate.rate
        }
      }
    }
    // Pass 2: state-level rate (zone covers this state — with or without area rates defined)
    for (const zone of overrides.zones) {
      if (zone.states?.includes(state)) return zone.rate
    }
  }

  return flatRate
}

// Load dynamic shipping settings from site_settings (browser only)
export async function loadShippingSettings() {
  try {
    const { getStoreSetting } = await import('@/lib/admin-db')
    const [
      flatRate, freeAbove, estDays, processingTime, note,
      pickupEnabled, pickupAddress,
      selfEnabled, selfNote, selfFee, providers,
      zonesEnabled, zones,
    ] = await Promise.all([
      getStoreSetting('shipping_flat_rate'),
      getStoreSetting('shipping_free_above'),
      getStoreSetting('shipping_est_days'),
      getStoreSetting('shipping_processing'),
      getStoreSetting('shipping_note'),
      getStoreSetting('shipping_pickup'),
      getStoreSetting('shipping_pickup_address'),
      getStoreSetting('self_logistics_enabled'),
      getStoreSetting('self_logistics_note'),
      getStoreSetting('self_logistics_fee'),
      getStoreSetting('logistics_providers'),
      getStoreSetting('shipping_zones_enabled'),
      getStoreSetting('shipping_zones'),
    ])
    return {
      flatRate:            flatRate  !== null ? Number(flatRate)  : client.shipping.flatRate,
      freeAbove:           freeAbove !== null ? Number(freeAbove) : client.shipping.freeAbove,
      estimatedDays:       estDays   ?? client.shipping.estimatedDays,
      processingTime:      processingTime ?? '1–2 business days',
      note:                note ?? '',
      pickupEnabled:       Boolean(pickupEnabled),
      pickupAddress:       pickupAddress ?? client.address ?? '',
      selfLogisticsEnabled: Boolean(selfEnabled),
      selfLogisticsNote:   selfNote ?? '',
      selfLogisticsFee:    selfFee !== null ? Number(selfFee) : 0,
      logisticsProviders:  Array.isArray(providers) ? providers : [],
      zonesEnabled:        Boolean(zonesEnabled),
      zones:               Array.isArray(zones) ? zones : [],
    }
  } catch {
    return {
      flatRate:             client.shipping.flatRate,
      freeAbove:            client.shipping.freeAbove,
      estimatedDays:        client.shipping.estimatedDays,
      processingTime:       '1–2 business days',
      note:                 '',
      pickupEnabled:        false,
      pickupAddress:        '',
      selfLogisticsEnabled: false,
      selfLogisticsNote:    '',
      selfLogisticsFee:     0,
      logisticsProviders:   [],
      zonesEnabled:         false,
      zones:                [],
    }
  }
}
