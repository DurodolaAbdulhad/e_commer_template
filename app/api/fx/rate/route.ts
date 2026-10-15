import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'
import { verifyAdminToken } from '@/lib/admin-auth'

const FX_API_URL = 'https://open.er-api.com/v6/latest/USD'
const RATE_KEY   = 'store_usd_ngn_rate'
const DATE_KEY   = 'store_usd_ngn_updated_at'
const ENABLED_KEY = 'store_usd_enabled'

async function readFromDb() {
  try {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('site_settings')
      .select('id, value')
      .in('id', [RATE_KEY, DATE_KEY, ENABLED_KEY])
    const map: Record<string, any> = {}
    for (const row of data ?? []) map[row.id] = row.value
    return {
      rate:      map[RATE_KEY]    ? Number(map[RATE_KEY])    : null,
      updatedAt: map[DATE_KEY]    ? String(map[DATE_KEY])    : null,
      enabled:   map[ENABLED_KEY] ? Boolean(map[ENABLED_KEY]) : false,
    }
  } catch {
    return { rate: null, updatedAt: null, enabled: false }
  }
}

// GET — storefront fetches this to display USD equivalent prices
export async function GET() {
  const settings = await readFromDb()
  return NextResponse.json(settings)
}

// POST — admin triggers a live rate refresh (requires admin token)
export async function POST(req: Request) {
  try {
    const { token } = await req.json().catch(() => ({}))
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(FX_API_URL, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error('FX API unreachable')
    const json = await res.json()
    const rate: number = json?.rates?.NGN
    if (!rate) throw new Error('NGN rate not found in response')

    const now = new Date().toISOString()
    const supabase = getServiceClient()
    await supabase.from('site_settings').upsert([
      { id: RATE_KEY,  value: rate, updated_at: now },
      { id: DATE_KEY,  value: now,  updated_at: now },
    ])

    return NextResponse.json({ rate, updatedAt: now })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to refresh rate' }, { status: 500 })
  }
}
