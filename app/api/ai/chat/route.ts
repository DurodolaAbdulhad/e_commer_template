import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'
import { client } from '@/config/client'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? []
  if (!messages.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const supabase = getServiceClient()

  // Read API key — never expose to client
  const { data: keyRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('id', 'store_ai_api_key')
    .maybeSingle()

  const apiKey = keyRow?.value ? String(keyRow.value).trim() : ''
  if (!apiKey) return NextResponse.json({ error: 'AI assistant not enabled' }, { status: 503 })

  // Fetch product catalog for context (top 80 active products)
  const { data: products } = await supabase
    .from('products')
    .select('name, price, category, description')
    .eq('status', 'active')
    .limit(80)

  const productList = (products ?? [])
    .map(p => `- ${p.name} | ${client.currencySymbol}${Number(p.price).toLocaleString()}${p.category ? ` | ${p.category}` : ''}`)
    .join('\n')

  const systemPrompt = [
    `You are a friendly shopping assistant for ${client.name}, an online store in Nigeria.`,
    `Currency: ${client.currency} (${client.currencySymbol}).`,
    `Your job: help customers find products, answer questions about the store, and guide them to purchase.`,
    `Be warm, concise (2–4 sentences max), and always suggest relevant products when you can.`,
    `If asked about delivery, mention: ${client.shipping.estimatedDays}, free delivery above ${client.currencySymbol}${client.shipping.freeAbove.toLocaleString()}.`,
    `If asked about returns, mention: easy returns accepted.`,
    `Never make up products not in the catalog. If unsure, suggest the customer browse the shop.`,
    ``,
    `Current product catalog:`,
    productList || '(No products loaded yet)',
  ].join('\n')

  // Keep last 6 messages to avoid token overflow
  const trimmedMessages = messages.slice(-6)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system:     systemPrompt,
        messages:   trimmedMessages,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = (err as any)?.error?.message ?? 'Claude API error'
      console.error('[ai/chat] Anthropic error:', msg)
      return NextResponse.json({ error: 'AI unavailable', detail: msg }, { status: 502 })
    }

    const data = await res.json()
    const reply = data.content?.[0]?.text ?? "Sorry, I couldn't generate a response right now."
    return NextResponse.json({ reply })
  } catch (e: any) {
    console.error('[ai/chat] fetch error:', e?.message)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }
}
