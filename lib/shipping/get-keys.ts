import { getServiceClient } from '@/lib/supabase-service'

export interface ShippingKeys {
  sendboxApiKey:     string
  gigClientId:       string
  gigClientSecret:   string
  gigOriginCode:     string
  kwikSecretKey:     string
}

export async function getShippingKeys(): Promise<ShippingKeys> {
  const supabase = getServiceClient()
  const keys = ['sendbox_api_key', 'gig_client_id', 'gig_client_secret', 'gig_origin_code', 'kwik_secret_key']
  const { data } = await supabase
    .from('site_settings')
    .select('id, value')
    .in('id', keys)

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.id] = typeof row.value === 'string' ? row.value : (row.value?.v ?? '')
  }

  return {
    sendboxApiKey:   map['sendbox_api_key']   ?? '',
    gigClientId:     map['gig_client_id']     ?? '',
    gigClientSecret: map['gig_client_secret'] ?? '',
    gigOriginCode:   map['gig_origin_code']   ?? 'IKEJA-HQ',
    kwikSecretKey:   map['kwik_secret_key']   ?? '',
  }
}
