/**
 * Rate limiting — uses Upstash Redis when configured, falls back to in-memory Map.
 * In-memory fallback is fine for dev/single-instance but NOT for production serverless.
 * Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for production.
 */

const MAX_ATTEMPTS = 5
const WINDOW_SEC   = 15 * 60  // 15-minute window
const LOCKOUT_SEC  = 30 * 60  // 30-minute lockout

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number }

// ── Upstash Redis path ──────────────────────────────────────────────────────
function isRedisConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

async function redisCheckRateLimit(key: string): Promise<RateLimitResult> {
  const { Redis }      = await import('@upstash/redis')
  const { Ratelimit }  = await import('@upstash/ratelimit')

  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, `${WINDOW_SEC} s`),
    analytics: false,
    prefix: 'admin_login',
  })

  const result = await limiter.limit(key)
  if (result.success) return { allowed: true }
  return { allowed: false, retryAfterMs: result.reset - Date.now() }
}

async function redisResetRateLimit(key: string): Promise<void> {
  const { Redis } = await import('@upstash/redis')
  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  await redis.del(`admin_login:${key}`)
}

// ── In-memory fallback (single-process / dev only) ──────────────────────────
const memStore = new Map<string, { count: number; resetAt: number }>()

function memCheckRateLimit(key: string): RateLimitResult {
  const now   = Date.now()
  const entry = memStore.get(key)

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + WINDOW_SEC * 1000 })
    return { allowed: true }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true }
}

function memResetRateLimit(key: string): void {
  memStore.delete(key)
}

// ── Public API ──────────────────────────────────────────────────────────────
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  if (isRedisConfigured()) {
    try { return await redisCheckRateLimit(key) } catch { /* fall through to mem */ }
  }
  return memCheckRateLimit(key)
}

export async function resetRateLimit(key: string): Promise<void> {
  if (isRedisConfigured()) {
    try { await redisResetRateLimit(key); return } catch {}
  }
  memResetRateLimit(key)
}
