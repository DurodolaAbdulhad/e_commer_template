import { getServiceClient } from '@/lib/supabase-service'
import type { ShippingAddress } from './providers'

export interface ShippingKeys {
  sendboxApiKey:     string
  gigClientId:       string
  gigClientSecret:   string
  gigOriginCode:     string
  kwikSecretKey:     string
  // per-courier enable flags (admin must activate before customers see them)
  kwikEnabled:       boolean
  sendboxEnabled:    boolean
  gigEnabled:        boolean
  // store origin for rate calculation / waybill pickup
  shippingOrigin:    ShippingAddress
}

const ALL_KEYS = [
  'sendbox_api_key', 'gig_client_id', 'gig_client_secret', 'gig_origin_code', 'kwik_secret_key',
  'kwik_enabled', 'sendbox_enabled', 'gig_enabled', 'shipping_origin',
]

function str(v: any): string {
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null && 'v' in v) return String(v.v)
  return ''
}

function bool(v: any): boolean {
  return v === true || v === 'true'
}

export async function getShippingKeys(): Promise<ShippingKeys> {
  const supabase = getServiceClient()
  const { data } = await supabase.from('site_settings').select('id, value').in('id', ALL_KEYS)

  const map: Record<string, any> = {}
  for (const row of data ?? []) map[row.id] = row.value

  const originRaw = map['shipping_origin'] ?? {}
  const origin: ShippingAddress = {
    name:    originRaw.name    ?? '',
    phone:   originRaw.phone   ?? '',
    address: originRaw.address ?? '',
    city:    originRaw.city    ?? 'Lagos',
    state:   originRaw.state   ?? 'Lagos',
    country: originRaw.country ?? 'Nigeria',
  }

  return {
    sendboxApiKey:   str(map['sendbox_api_key']),
    gigClientId:     str(map['gig_client_id']),
    gigClientSecret: str(map['gig_client_secret']),
    gigOriginCode:   str(map['gig_origin_code']) || 'IKEJA-HQ',
    kwikSecretKey:   str(map['kwik_secret_key']),
    kwikEnabled:     bool(map['kwik_enabled']),
    sendboxEnabled:  bool(map['sendbox_enabled']),
    gigEnabled:      bool(map['gig_enabled']),
    shippingOrigin:  origin,
  }
}
