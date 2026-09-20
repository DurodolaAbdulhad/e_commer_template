import { NextRequest, NextResponse } from 'next/server'
import { verifyPriceSig } from '@/app/api/checkout/initiate/route'

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Paystack not configured' }, { status: 503 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, amount, reference, sig, metadata, callbackUrl } = body

  if (!email || !amount || !reference) {
    return NextResponse.json({ error: 'email, amount, reference required' }, { status: 400 })
  }

  // Verify the server-signed amount hasn't been tampered with
  if (sig && !verifyPriceSig(amount, reference, sig)) {
    return NextResponse.json({ error: 'Price signature invalid' }, { status: 400 })
  }

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),   // kobo
      currency: 'NGN',
      reference,
      callback_url: callbackUrl,
      metadata: metadata ?? {},
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err?.message ?? 'Paystack error' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json({ authorization_url: data.data?.authorization_url })
}
