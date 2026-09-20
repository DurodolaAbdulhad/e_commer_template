import { NextRequest, NextResponse } from 'next/server'
import { generateAdminToken, checkRateLimit, resetRateLimit } from '@/lib/admin-auth'

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

  const { password } = await req.json().catch(() => ({}))
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD env var not set' }, { status: 503 })
  }

  const match = password === adminPassword
  if (!match) {
    // Artificial delay to slow automated guessing
    await new Promise(r => setTimeout(r, 400 + Math.random() * 200))
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  await resetRateLimit(ip)
  const token = generateAdminToken()
  const res   = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   24 * 60 * 60,
    path:     '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_token')
  return res
}
