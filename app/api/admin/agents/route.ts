import { NextRequest, NextResponse } from 'next/server'
import { requireMinRole, hashPassword } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

function token(req: NextRequest) {
  return req.cookies.get('admin_token')?.value
}

function generateAgentCode(name: string): string {
  const base = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'AGENT'
  const suffix = Math.floor(Math.random() * 900 + 100).toString()
  return `${base}${suffix}`
}

// GET — list all agents with per-agent sales stats
export async function GET(req: NextRequest) {
  const guard = requireMinRole(token(req), 'manager')
  if (guard) return guard
  if (!isServiceClientReady()) return NextResponse.json({ agents: [] })

  const { data: agents, error } = await getServiceClient()
    .from('admin_users')
    .select('id, name, email, agent_code, commission_rate, is_active, created_at')
    .eq('role', 'agent')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch order stats per agent in one query
  const codes = (agents ?? []).map(a => a.agent_code).filter(Boolean)
  let statsMap: Record<string, { total_orders: number; total_sales: number }> = {}

  if (codes.length) {
    const { data: orders } = await getServiceClient()
      .from('orders')
      .select('agent_code, total')
      .in('agent_code', codes)

    for (const o of orders ?? []) {
      if (!o.agent_code) continue
      const s = statsMap[o.agent_code] ?? { total_orders: 0, total_sales: 0 }
      s.total_orders += 1
      s.total_sales  += Number(o.total ?? 0)
      statsMap[o.agent_code] = s
    }
  }

  const enriched = (agents ?? []).map(a => ({
    ...a,
    total_orders:     statsMap[a.agent_code]?.total_orders ?? 0,
    total_sales:      statsMap[a.agent_code]?.total_sales  ?? 0,
    total_commission: ((statsMap[a.agent_code]?.total_sales ?? 0) * (a.commission_rate ?? 5)) / 100,
  }))

  return NextResponse.json({ agents: enriched })
}

// POST — create a new agent
export async function POST(req: NextRequest) {
  const guard = requireMinRole(token(req), 'admin')
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const { name, email, password, commission_rate } = body
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 })
  }
  if (!isServiceClientReady()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const agent_code = generateAgentCode(name)
  const { error } = await getServiceClient()
    .from('admin_users')
    .insert({
      name:            name.trim(),
      email:           email.trim().toLowerCase(),
      role:            'agent',
      agent_code,
      commission_rate: commission_rate ?? 5,
      is_active:       true,
      password_hash:   password ? hashPassword(password) : null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, agent_code })
}

// PATCH — update agent
export async function PATCH(req: NextRequest) {
  const guard = requireMinRole(token(req), 'admin')
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const { id, password, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (!isServiceClientReady()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const patch: Record<string, any> = {}
  if (updates.name            !== undefined) patch.name            = updates.name
  if (updates.commission_rate !== undefined) patch.commission_rate = updates.commission_rate
  if (updates.is_active       !== undefined) patch.is_active       = updates.is_active
  if (password) patch.password_hash = hashPassword(password)

  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const { error } = await getServiceClient().from('admin_users').update(patch).eq('id', id).eq('role', 'agent')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — remove agent
export async function DELETE(req: NextRequest) {
  const guard = requireMinRole(token(req), 'admin')
  if (guard) return guard

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (!isServiceClientReady()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { error } = await getServiceClient().from('admin_users').delete().eq('id', id).eq('role', 'agent')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
