import { getServiceClient } from '@/lib/supabase-service'

export interface DmSecrets {
  whatsappPhoneNumberId: string
  whatsappAccessToken:   string
  whatsappVerifyToken:   string
  whatsappAppSecret:     string
  instagramPageId:       string
  instagramAccessToken:  string
  instagramVerifyToken:  string
  instagramAppSecret:    string
  claudeApiKey:          string
}

const ALL_KEYS = [
  'whatsapp_phone_number_id', 'whatsapp_access_token', 'whatsapp_verify_token', 'whatsapp_app_secret',
  'instagram_page_id', 'instagram_access_token', 'instagram_verify_token', 'instagram_app_secret',
  'claude_api_key',
]

export async function getDmSecrets(): Promise<DmSecrets> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('integration_secrets')
    .select('id, value')
    .in('id', ALL_KEYS)

  const m: Record<string, string> = {}
  for (const row of data ?? []) m[row.id] = row.value ?? ''

  return {
    whatsappPhoneNumberId: m['whatsapp_phone_number_id'] ?? '',
    whatsappAccessToken:   m['whatsapp_access_token']    ?? '',
    whatsappVerifyToken:   m['whatsapp_verify_token']    ?? '',
    whatsappAppSecret:     m['whatsapp_app_secret']      ?? '',
    instagramPageId:       m['instagram_page_id']        ?? '',
    instagramAccessToken:  m['instagram_access_token']   ?? '',
    instagramVerifyToken:  m['instagram_verify_token']   ?? '',
    instagramAppSecret:    m['instagram_app_secret']     ?? '',
    claudeApiKey:          m['claude_api_key']            ?? '',
  }
}

// Write a single secret — called from admin API route only (never browser)
export async function setDmSecret(key: keyof DmSecrets | string, value: string): Promise<void> {
  const supabase = getServiceClient()
  const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
  await supabase.from('integration_secrets').upsert({ id: dbKey, value })
}
