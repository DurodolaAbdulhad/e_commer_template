// Auth helper — wraps Supabase auth with graceful demo-mode fallback
import { isSupabaseReady } from './supabase-server'

export const DEMO_USER_KEY = 'demo_user'

export async function getServerUser() {
  if (!isSupabaseReady()) return null
  try {
    const { createClient } = await import('./supabase-server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user ?? null
  } catch {
    return null
  }
}
