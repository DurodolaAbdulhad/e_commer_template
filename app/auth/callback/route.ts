import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isSupabaseReady } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/account'

  if (code && isSupabaseReady()) {
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
