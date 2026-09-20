import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using the service role key.
 * Bypasses Row Level Security — use ONLY in trusted server contexts
 * (webhooks, cron jobs, internal API routes). Never expose to the client.
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url?.startsWith('https://') || !key || key.length < 20) {
    throw new Error('Supabase service role not configured')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Returns false if the service client is not configured (demo/dev mode) */
export function isServiceClientReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(url?.startsWith('https://') && key && key.length > 20 && !key.includes('placeholder'))
}
