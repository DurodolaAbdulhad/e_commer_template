import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

/**
 * Fix 7: Verify the request carries the internal API secret.
 * All server-to-server calls must include: x-internal-secret: <API_INTERNAL_SECRET>
 * Returns a 401 response if the secret is missing/wrong, or null if valid.
 */
export function requireInternalSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.API_INTERNAL_SECRET
  if (!secret) return null // not configured — allow (warn in dev)

  const provided = req.headers.get('x-internal-secret')
  if (!provided) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    if (!timingSafeEqual(Buffer.from(provided), Buffer.from(secret))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Fix 10: CSRF origin check for browser-initiated POST requests.
 * Rejects requests whose Origin doesn't match the app URL.
 * Returns a 403 response if the origin is invalid, or null if valid.
 */
export function requireSameOrigin(req: NextRequest): NextResponse | null {
  const origin  = req.headers.get('origin')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (!origin || !siteUrl) return null // skip when not configured

  try {
    const allowed = new URL(siteUrl).origin
    if (origin !== allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch { return null }

  return null
}
