import { NextRequest, NextResponse } from 'next/server'
import { generateAdminToken, checkRateLimit, resetRateLimit, verifyPassword, AdminRole } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

function setCookieAndReturn(role: AdminRole) {
  const token = generateAdminToken(role)
  const res   = NextResponse.json({ ok: true, role })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   24 * 60 * 60,
    path:     '/',
  })
  return res
}

export async function POST(req: NextRequest) {
  const ip   = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rate = await checkRateLimit(ip)

  if (!rate.allowed) {
    const retryMins = Math.ceil((rate.retryAfterMs ?? 0) / 60000)
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryMins} minute${retryMins !== 1 ? 's' : ''}.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.retryAfterMs ?? 0) / 1000)) } }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { email, password } = body

  // ── Per-user login (email + password) ─────────────────────────────────────
  if (email && password && isServiceClientReady()) {
    const supabase = getServiceClient()
    const { data: user } = await supabase
      .from('admin_users')
      .select('id, role, password_hash, is_active')
      .eq('email', email.trim().toLowerCase())
      .single()

    // Constant-time delay regardless of outcome
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200))

    if (!user || !user.is_active || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await resetRateLimit(ip)
    return setCookieAndReturn(user.role as AdminRole)
  }

  // ── Master password login (backward compat) ────────────────────────────────
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD env var not set' }, { status: 503 })
  }

  if (password !== adminPassword) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 200))
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  await resetRateLimit(ip)
  return setCookieAndReturn('admin')
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_token')
  return res
}
