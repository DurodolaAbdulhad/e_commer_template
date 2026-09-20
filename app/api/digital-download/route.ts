import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { createHmac, timingSafeEqual } from 'crypto'

const ALLOWED_DOWNLOAD_HOSTS = (process.env.ALLOWED_DOWNLOAD_HOSTS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

function getSecret() {
  return process.env.DOWNLOAD_TOKEN_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? 'fallback-change-me'
}

function verifyToken(token: string): { orderId: string; productId: string; expires: number } | null {
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null

  const encoded = token.slice(0, dot)
  const sig     = token.slice(dot + 1)

  const expected = createHmac('sha256', getSecret()).update(encoded).digest('base64url')
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch { return null }

  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString())
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

  if (Date.now() > payload.expires) {
    return NextResponse.json({ error: 'Download link has expired. Contact support.' }, { status: 410 })
  }

  let supabase: any
  try { supabase = await createServerClient() } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('items')
    .eq('id', payload.orderId)
    .single()

  const orderItems: any[] = order?.items ?? []
  if (!orderItems.some((i: any) => i.id === payload.productId)) {
    return NextResponse.json({ error: 'Product not found in order' }, { status: 403 })
  }

  const { data: product } = await supabase
    .from('products')
    .select('file_url, name')
    .eq('id', payload.productId)
    .single()

  if (!product?.file_url) {
    return NextResponse.json({ error: 'No file attached to this product' }, { status: 404 })
  }

  // Fix 6 — validate file_url is HTTPS and from an allowed host
  let fileUrl: URL
  try { fileUrl = new URL(product.file_url) } catch {
    return NextResponse.json({ error: 'Invalid file URL' }, { status: 500 })
  }

  if (fileUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'File URL must use HTTPS' }, { status: 500 })
  }

  if (ALLOWED_DOWNLOAD_HOSTS.length > 0 && !ALLOWED_DOWNLOAD_HOSTS.includes(fileUrl.hostname)) {
    return NextResponse.json({ error: 'File URL host not permitted' }, { status: 403 })
  }

  return NextResponse.redirect(product.file_url)
}

/** Generate a signed, time-limited download token */
export function generateDownloadToken(orderId: string, productId: string, expiresInHours = 48): string {
  const secret = getSecret()
  const payload = { orderId, productId, expires: Date.now() + expiresInHours * 3_600_000 }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}
