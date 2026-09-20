import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/api-guard'
import { validateGiftCard } from '@/lib/admin-db'

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req)
  if (csrf) return csrf

  const { code } = await req.json().catch(() => ({}))
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'code required' }, { status: 400 })
  }

  try {
    const card = await validateGiftCard(code.trim().toUpperCase())
    if (!card) return NextResponse.json({ error: 'Invalid or already used gift card' }, { status: 404 })
    // Only expose what the client needs — never expose the full card record
    return NextResponse.json({ balance: card.balance, code: card.code })
  } catch {
    return NextResponse.json({ error: 'Could not validate gift card' }, { status: 500 })
  }
}
