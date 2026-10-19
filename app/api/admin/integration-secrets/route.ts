import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'

const ALLOWED_KEYS = new Set([
  'whatsapp_phone_number_id', 'whatsapp_access_token', 'whatsapp_verify_token', 'whatsapp_app_secret',
  'instagram_page_id', 'instagram_access_token', 'instagram_verify_token', 'instagram_app_secret',
  'claude_api_key',
])

// GET — read current secrets (masked for display)
export async function GET(req: NextRequest) {
  const admin = await verifyAdminToken(req)
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('integration_secrets')
    .select('id, value')
    .in('id', Array.from(ALLOWED_KEYS))

  const result: Record<string, string> = {}
  for (const row of data ?? []) {
    result[row.id] = row.value ?? ''
  }
  return NextResponse.json(result)
}

// POST — upsert secrets (admin only)
export async function POST(req: NextRequest) {
  const admin = await verifyAdminToken(req)
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const supabase = getServiceClient()

  const rows: { id: string; value: string }[] = []
  for (const [key, val] of Object.entries(body)) {
    if (ALLOWED_KEYS.has(key) && typeof val === 'string') {
      rows.push({ id: key, value: val })
    }
  }

  if (rows.length) {
    const { error } = await supabase.from('integration_secrets').upsert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
