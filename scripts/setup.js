#!/usr/bin/env node
/**
 * First-time setup — run once before deploying:
 *   node scripts/setup.js
 *
 * What it does:
 *   1. Copies .env.local.example → .env.local (if not already present)
 *   2. Auto-generates all required secrets with crypto.randomBytes
 *   3. Prints a checklist of what still needs manual configuration
 */

const { randomBytes } = require('crypto')
const fs   = require('fs')
const path = require('path')

const ROOT    = path.resolve(__dirname, '..')
const EXAMPLE = path.join(ROOT, '.env.local.example')
const TARGET  = path.join(ROOT, '.env.local')

function secret() { return randomBytes(32).toString('hex') }

// ── 1. Read the example file ────────────────────────────────────────────────
if (!fs.existsSync(EXAMPLE)) {
  console.error('❌  .env.local.example not found.')
  process.exit(1)
}

let contents = fs.readFileSync(EXAMPLE, 'utf8')

// ── 2. If .env.local already exists, skip (don't overwrite real secrets) ────
if (fs.existsSync(TARGET)) {
  console.log('⚠️   .env.local already exists — skipping secret generation.')
  console.log('    Delete it and re-run this script to regenerate from scratch.\n')
} else {
  // Replace every placeholder that contains "replace-with-openssl-rand-hex-32"
  const secretFields = [
    'ADMIN_SESSION_SECRET',
    'DOWNLOAD_TOKEN_SECRET',
    'CHECKOUT_SECRET',
    'API_INTERNAL_SECRET',
  ]

  for (const field of secretFields) {
    contents = contents.replace(
      new RegExp(`(${field}=)replace-with-openssl-rand-hex-32`),
      `$1${secret()}`
    )
  }

  // Write .env.local
  fs.writeFileSync(TARGET, contents, 'utf8')
  console.log('✅  .env.local created with auto-generated secrets.\n')
}

// ── 3. Print deployment checklist ───────────────────────────────────────────
console.log('════════════════════════════════════════════════════════')
console.log('  DEPLOYMENT CHECKLIST')
console.log('════════════════════════════════════════════════════════\n')

const env = fs.existsSync(TARGET)
  ? Object.fromEntries(
      fs.readFileSync(TARGET, 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => l.split('=').map(s => s.trim()))
        .map(([k, ...rest]) => [k, rest.join('=')])
    )
  : {}

function check(label, condition, fix) {
  const icon = condition ? '✅' : '❌'
  console.log(`${icon}  ${label}`)
  if (!condition && fix) console.log(`       → ${fix}`)
}

check(
  'Supabase URL configured',
  env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') && !env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project'),
  'Set NEXT_PUBLIC_SUPABASE_URL in .env.local'
)
check(
  'Supabase Anon Key configured',
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length > 50 && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('eyJhbGciO'),
  'Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (get from supabase.com → Settings → API)'
)
check(
  'Supabase RLS applied',
  false,  // always prompt — can't verify remotely
  'Run supabase/rls.sql in Supabase SQL Editor'
)

const usingFlutterwave = env.NEXT_PUBLIC_FLW_PUBLIC_KEY?.startsWith('FLWPUBK')
const usingPaystack    = env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.startsWith('pk_live')

check(
  'Payment gateway configured (Paystack)',
  usingPaystack,
  usingFlutterwave ? 'Flutterwave detected — change paymentGateway to "flutterwave" in config/client.js'
                   : 'Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY'
)
check(
  'Payment gateway configured (Flutterwave)',
  usingFlutterwave,
  usingPaystack ? 'Paystack detected (OK — using Paystack)'
                : 'Optional — set NEXT_PUBLIC_FLW_PUBLIC_KEY and FLW_SECRET_KEY to use Flutterwave'
)
check(
  'Webhook registered (Paystack)',
  usingPaystack,
  'In Paystack dashboard → Settings → Webhooks → add: https://yourdomain.com/api/paystack/webhook'
)
check(
  'Webhook registered (Flutterwave)',
  usingFlutterwave,
  'In Flutterwave dashboard → Settings → Webhooks → add: https://yourdomain.com/api/flutterwave/webhook'
)
check(
  'Admin password set',
  env.ADMIN_PASSWORD && env.ADMIN_PASSWORD !== 'change-me-to-a-strong-password',
  'Set ADMIN_PASSWORD in .env.local — use a strong password (not "admin123")'
)
check(
  'Session secret generated',
  env.ADMIN_SESSION_SECRET?.length === 64,
  'Run: node scripts/setup.js  (auto-generates this)'
)
check(
  'Checkout secret generated',
  env.CHECKOUT_SECRET?.length === 64,
  'Run: node scripts/setup.js  (auto-generates this)'
)
check(
  'Redis configured (production rate limiting)',
  env.UPSTASH_REDIS_REST_URL?.startsWith('https://') && !env.UPSTASH_REDIS_REST_URL?.includes('your-db'),
  'Create a free Redis at console.upstash.com — required for Vercel/serverless deployments'
)
check(
  'Email (Resend) configured',
  env.RESEND_API_KEY?.startsWith('re_'),
  'Optional — set RESEND_API_KEY for order confirmation + abandoned cart emails'
)
check(
  'SMS (Termii) configured',
  env.TERMII_API_KEY?.startsWith('TL'),
  'Optional — set TERMII_API_KEY for order SMS notifications'
)

console.log('\n════════════════════════════════════════════════════════')
const allDone = [
  env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') && !env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project'),
  usingPaystack || usingFlutterwave,
  env.ADMIN_PASSWORD && env.ADMIN_PASSWORD !== 'change-me-to-a-strong-password',
  env.ADMIN_SESSION_SECRET?.length === 64,
  env.CHECKOUT_SECRET?.length === 64,
].every(Boolean)

if (allDone) {
  console.log('🎉  Core setup complete. Ready to deploy!\n')
} else {
  console.log('⚠️   Complete the ❌ items above before deploying to production.\n')
}
