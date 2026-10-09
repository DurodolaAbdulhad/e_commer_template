import { NextRequest, NextResponse } from 'next/server'
import { requireMinRole, hashPassword } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

function token(req: NextRequest) {
  return req.cookies.get('admin_token')?.value
}

// GET — list staff (admin only)
export async function GET(req: NextRequest) {
  const guard = requireMinRole(token(req), 'admin')
  if (guard) return guard
  if (!isServiceClientReady()) return NextResponse.json({ users: [] })

  const { data, error } = await getServiceClient()
    .from('admin_users')
    .select('id, name, email, role, is_active, created_at, last_login')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}

// POST — create staff member (admin only)
export async function POST(req: NextRequest) {
  const guard = requireMinRole(token(req), 'admin')
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const { name, email, role, is_active } = body
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 })
  }

  if (!isServiceClientReady()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { error } = await getServiceClient()
    .from('admin_users')
    .insert({ name: name.trim(), email: email.trim().toLowerCase(), role: role ?? 'manager', is_active: is_active ?? true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH — update staff / set password (admin only)
export async function PATCH(req: NextRequest) {
  const guard = requireMinRole(token(req), 'admin')
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const { id, password, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (!isServiceClientReady()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const patch: Record<string, any> = {}
  if (updates.name     !== undefined) patch.name      = updates.name
  if (updates.role     !== undefined) patch.role      = updates.role
  if (updates.is_active !== undefined) patch.is_active = updates.is_active
  if (password) patch.password_hash = hashPassword(password)

  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const { error } = await getServiceClient()
    .from('admin_users')
    .update(patch)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — remove staff member (admin only)
export async function DELETE(req: NextRequest) {
  const guard = requireMinRole(token(req), 'admin')
  if (guard) return guard

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (!isServiceClientReady()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  // Guard: must not delete last admin
  const { data: admins } = await getServiceClient()
    .from('admin_users')
    .select('id')
    .eq('role', 'admin')

  const { data: target } = await getServiceClient()
    .from('admin_users')
    .select('role')
    .eq('id', id)
    .single()

  if (target?.role === 'admin' && (admins?.length ?? 0) <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last admin account' }, { status: 400 })
  }

  const { error } = await getServiceClient().from('admin_users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
