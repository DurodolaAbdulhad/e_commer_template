import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/config/client'
import { formatPrice } from '@/lib/utils'
import { requireInternalSecret, requireSameOrigin } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  const guard = requireInternalSecret(req) ?? requireSameOrigin(req)
  if (guard) return guard

  const { email, items, subtotal } = await req.json()

  if (!email || !items?.length) {
    return NextResponse.json({ error: 'email and items required' }, { status: 400 })
  }

  const RESEND_KEY = process.env.RESEND_API_KEY
  if (!RESEND_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })
  }

  const itemList = items
    .map((i: any) => `<li style="margin:4px 0">${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}</li>`)
    .join('')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#222">You left something behind 🛒</h2>
      <p>Hi there! You added some great items to your ${client.name} cart but didn't complete your purchase.</p>
      <ul>${itemList}</ul>
      <p><strong>Cart total: ${formatPrice(subtotal)}</strong></p>
      <a href="${siteUrl}/cart" style="display:inline-block;background:${client.colors.secondary};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Complete Your Order
      </a>
      <p style="color:#999;font-size:12px">This is a one-time reminder. You can ignore it if you've already placed your order.</p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${client.name} <noreply@${new URL(siteUrl).hostname}>`,
      to: [email],
      subject: `You left something in your cart — ${client.name}`,
      html,
    }),
  })

  if (!res.ok) {
    // Fix 14: never log raw API responses — may contain tokens or PII
    console.error('[AbandonedCart] Resend send failed, status:', res.status)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
