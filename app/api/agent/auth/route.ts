import { NextRequest, NextResponse } from 'next/server'
import { generateAdminToken, verifyPassword } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

// POST — agent login (email + password against admin_users where role = 'agent')
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }
  if (!isServiceClientReady()) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

  const { data: agent } = await getServiceClient()
    .from('admin_users')
    .select('id, name, email, agent_code, commission_rate, is_active, password_hash, role')
    .eq('email', email.trim().toLowerCase())
    .eq('role', 'agent')
    .single()

  if (!agent) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  if (!agent.is_active) return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
  if (!agent.password_hash || !verifyPassword(password, agent.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = generateAdminToken('agent')

  // Update last_login if the column exists
  await getServiceClient().from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', agent.id).catch(() => {})

  const res = NextResponse.json({
    ok: true,
    agent: { id: agent.id, name: agent.name, email: agent.email, agent_code: agent.agent_code, commission_rate: agent.commission_rate },
    token,
  })
  res.cookies.set('agent_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 86400, path: '/' })
  return res
}
