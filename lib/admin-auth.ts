import { createHmac, timingSafeEqual, scryptSync, randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
export { checkRateLimit, resetRateLimit } from './rate-limit'

const SECRET = () => process.env.ADMIN_SESSION_SECRET ?? 'change-me-in-production'

export type AdminRole = 'admin' | 'manager' | 'viewer'

const ROLE_RANK: Record<string, number> = { admin: 3, manager: 2, viewer: 1 }

// ── Token generation ────────────────────────────────────────────────────────
// Format: ts.role.sig  (sig covers ts + ':' + role)

export function generateAdminToken(role: AdminRole = 'admin'): string {
  const ts  = Date.now().toString(36)
  const sig = createHmac('sha256', SECRET()).update(`${ts}:${role}`).digest('hex')
  return `${ts}.${role}.${sig}`
}

/** Returns true if the token is structurally valid and not expired */
export function verifyAdminToken(token: string | undefined): boolean {
  return getAdminRole(token) !== null
}

/** Returns the role from a valid token, or null if invalid / expired */
export function getAdminRole(token: string | undefined): AdminRole | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      // New format: ts.role.sig
      const [ts, role, sig] = parts
      if (Date.now() - parseInt(ts, 36) > 24 * 60 * 60 * 1000) return null
      const expected = createHmac('sha256', SECRET()).update(`${ts}:${role}`).digest('hex')
      if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
      return (role as AdminRole) ?? 'admin'
    }
    if (parts.length === 2) {
      // Legacy format: ts.sig (treat as admin for backward compat)
      const [ts, sig] = parts
      if (Date.now() - parseInt(ts, 36) > 24 * 60 * 60 * 1000) return null
      const expected = createHmac('sha256', SECRET()).update(ts).digest('hex')
      if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
      return 'admin'
    }
    return null
  } catch { return null }
}

// ── Role enforcement ────────────────────────────────────────────────────────

/** Returns a 401/403 response if the token lacks the required role, null if OK */
export function requireMinRole(
  token: string | undefined,
  minRole: AdminRole,
): NextResponse | null {
  const role = getAdminRole(token)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((ROLE_RANK[role] ?? 0) < (ROLE_RANK[minRole] ?? 0)) {
    return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 })
  }
  return null
}

// ── Password hashing ────────────────────────────────────────────────────────
// Uses Node.js built-in scrypt — no external deps needed

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const hashBuf = Buffer.from(hash, 'hex')
    const derived  = scryptSync(password, salt, 64)
    return timingSafeEqual(derived, hashBuf)
  } catch { return false }
}
