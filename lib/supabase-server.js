import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Returns true only when real credentials are configured
export function isSupabaseReady() {
  return (
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('placeholder') &&
    SUPABASE_KEY.length > 20 &&
    !SUPABASE_KEY.includes('placeholder')
  )
}

export async function createClient() {
  // Skip all network calls when credentials are not yet configured
  if (!isSupabaseReady()) {
    throw new Error('Supabase credentials not configured')
  }

  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
    global: {
      // 5-second hard timeout on all Supabase fetches
      fetch: (url, options) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 5000)
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timer))
      },
    },
  })
}
