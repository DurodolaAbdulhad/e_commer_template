import { createHmac, timingSafeEqual } from 'crypto'
export { checkRateLimit, resetRateLimit } from './rate-limit'

const SECRET = () => process.env.ADMIN_SESSION_SECRET ?? 'change-me-in-production'

/** Generate a 24-hour signed session token */
export function generateAdminToken(): string {
  const ts = Date.now().toString(36)
  const sig = createHmac('sha256', SECRET()).update(ts).digest('hex')
  return `${ts}.${sig}`
}

/** Returns true if the token is structurally valid and not expired */
export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false
  try {
    const [ts, sig] = token.split('.')
    if (!ts || !sig) return false
    if (Date.now() - parseInt(ts, 36) > 24 * 60 * 60 * 1000) return false
    const expected = createHmac('sha256', SECRET()).update(ts).digest('hex')
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch { return false }
}
