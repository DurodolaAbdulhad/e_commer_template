import Anthropic from '@anthropic-ai/sdk'
import { getServiceClient } from '@/lib/supabase-service'
import { sendWhatsApp, sendInstagram } from './meta'

// ── Types ─────────────────────────────────────────────────────────────────────
export type Platform = 'whatsapp' | 'instagram'

export interface ConversationContext {
  conversationId:    string
  platform:          Platform
  platformUserId:    string
  platformPageId:    string
  accessToken:       string
  phoneNumberId?:    string  // WA only
  floorPct:          number
  persona:           string
  storeBaseUrl:      string
}

// ── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_products',
    description: 'Search the product catalog by name or keyword. Returns matching products with price and stock.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term, e.g. "red dress size 12"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'quote_delivery',
    description: 'Get a delivery fee estimate for a given address.',
    input_schema: {
      type: 'object',
      properties: {
        city:    { type: 'string' },
        state:   { type: 'string' },
      },
      required: ['city'],
    },
  },
  {
    name: 'create_order',
    description: 'Create a draft order for the customer after they confirm items, quantity, and delivery address.',
    input_schema: {
      type: 'object',
      properties: {
        customer_name:  { type: 'string' },
        customer_phone: { type: 'string' },
        customer_email: { type: 'string' },
        address:        { type: 'string' },
        city:           { type: 'string' },
        state:          { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'string' },
              variant_id: { type: 'string' },
              quantity:   { type: 'number' },
              unit_price: { type: 'number', description: 'Agreed price (must be >= floor price)' },
            },
            required: ['product_id', 'quantity', 'unit_price'],
          },
        },
        platform_source: { type: 'string', enum: ['whatsapp_dm', 'instagram_dm'] },
      },
      required: ['customer_name', 'customer_phone', 'address', 'city', 'items', 'platform_source'],
    },
  },
  {
    name: 'create_payment_link',
    description: 'Generate a Paystack payment link for the order and return it to send to the customer.',
    input_schema: {
      type: 'object',
      properties: {
        order_number: { type: 'string' },
        amount_kobo:  { type: 'number', description: 'Amount in kobo (Naira × 100)' },
        email:        { type: 'string' },
      },
      required: ['order_number', 'amount_kobo', 'email'],
    },
  },
  {
    name: 'handoff_to_human',
    description: 'Escalate this conversation to a human agent. Use when customer is upset, has a complaint, or asks for a human.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
      },
      required: ['reason'],
    },
  },
]

// ── Tool handlers ─────────────────────────────────────────────────────────────
async function handleTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ConversationContext,
): Promise<string> {
  const supabase = getServiceClient()

  if (toolName === 'search_products') {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, floor_price, stock_count, variants')
      .ilike('name', `%${input.query}%`)
      .eq('active', true)
      .limit(6)
    if (!data?.length) return 'No products found matching that description.'
    return data.map(p =>
      `• ${p.name} — ₦${Number(p.price).toLocaleString()} (${p.stock_count > 0 ? 'In stock' : 'Out of stock'}) [id:${p.id}]`
    ).join('\n')
  }

  if (toolName === 'quote_delivery') {
    return `Delivery to ${input.city}, ${input.state ?? ''}: ₦1,500 – ₦3,500 depending on weight. Exact fee confirmed at checkout.`
  }

  if (toolName === 'create_order') {
    const items = input.items as Array<{ product_id: string; variant_id?: string; quantity: number; unit_price: number }>

    // Enforce floor price — NEVER skip this check
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('price, floor_price, name')
        .eq('id', item.product_id)
        .single()
      if (!product) return `Error: product ${item.product_id} not found`
      const floor = product.floor_price ?? product.price * (1 - ctx.floorPct / 100)
      if (item.unit_price < floor) {
        item.unit_price = floor  // silently enforce; agent negotiated below floor
      }
    }

    const orderNumber = `DM-${Date.now().toString(36).toUpperCase()}`
    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)

    const { error } = await supabase.from('orders').insert({
      order_number:     orderNumber,
      customer_name:    input.customer_name,
      customer_phone:   input.customer_phone,
      customer_email:   input.customer_email ?? '',
      shipping_address: `${input.address}, ${input.city}, ${input.state ?? ''}`,
      total_amount:     total,
      status:           'pending',
      payment_method:   'bank_transfer',
      source:           input.platform_source,
      fulfilment_stage: 'paid',
      items:            items,
    })
    if (error) return `Error creating order: ${error.message}`

    // Update conversation with customer details
    await supabase.from('conversations').update({
      customer_name:  input.customer_name as string,
      customer_phone: input.customer_phone as string,
    }).eq('id', ctx.conversationId)

    return `Order ${orderNumber} created. Total: ₦${total.toLocaleString()}. Order number: ${orderNumber}`
  }

  if (toolName === 'create_payment_link') {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return 'Payment link unavailable at this time.'
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:     input.email,
        amount:    input.amount_kobo,
        reference: input.order_number,
        metadata:  { order_number: input.order_number, source: ctx.platform },
      }),
    })
    const json = await res.json() as { status: boolean; data?: { authorization_url: string } }
    if (!json.status) return 'Failed to generate payment link. Please try again.'
    return `Payment link: ${json.data!.authorization_url}`
  }

  if (toolName === 'handoff_to_human') {
    await supabase.from('conversations').update({ mode: 'human' }).eq('id', ctx.conversationId)
    return 'HANDOFF_COMPLETE'
  }

  return `Unknown tool: ${toolName}`
}

// ── Main engine ───────────────────────────────────────────────────────────────
export async function runDmEngine(
  customerMessage: string,
  ctx: ConversationContext,
  claudeApiKey: string,
): Promise<void> {
  const supabase = getServiceClient()

  // Load recent conversation history (last 20 messages)
  const { data: history } = await supabase
    .from('dm_messages')
    .select('role, content')
    .eq('conversation_id', ctx.conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  const messages: Anthropic.MessageParam[] = (history ?? []).map(m => ({
    role:    m.role === 'customer' ? 'user' : 'assistant',
    content: m.content,
  }))
  messages.push({ role: 'user', content: customerMessage })

  const systemPrompt = `You are a helpful sales assistant for this store. Your persona: ${ctx.persona}.
You help customers browse products, get delivery quotes, and place orders over ${ctx.platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'}.
Always be friendly and concise. Never mention pricing strategy, cost, margins, or floor prices.
When a customer is ready to buy: collect their full name, phone, and delivery address before calling create_order.
After creating an order, offer to send a payment link.
If you cannot help or the customer is frustrated, use handoff_to_human.`

  const client = new Anthropic({ apiKey: claudeApiKey })

  // Manual tool-use loop
  let response = await client.messages.create({
    model:      'claude-opus-5-5',
    max_tokens: 1024,
    system:     systemPrompt,
    tools:      TOOLS,
    messages,
  })

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of toolUseBlocks) {
      const result = await handleTool(block.name, block.input as Record<string, unknown>, ctx)
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })

      // Handoff: stop the loop, no reply from AI
      if (block.name === 'handoff_to_human' && result === 'HANDOFF_COMPLETE') {
        await saveAndSend('A human agent will be with you shortly. Please hold on.', ctx, supabase)
        return
      }
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user',      content: toolResults })

    response = await client.messages.create({
      model:      'claude-opus-5-5',
      max_tokens: 1024,
      system:     systemPrompt,
      tools:      TOOLS,
      messages,
    })
  }

  // Extract final text reply
  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  if (!textBlock?.text) return

  await saveAndSend(textBlock.text, ctx, supabase)
}

async function saveAndSend(
  text: string,
  ctx: ConversationContext,
  supabase: ReturnType<typeof getServiceClient>,
) {
  await supabase.from('dm_messages').insert({
    conversation_id: ctx.conversationId,
    role:            'agent',
    content:         text,
  })

  if (ctx.platform === 'whatsapp' && ctx.phoneNumberId) {
    await sendWhatsApp(ctx.phoneNumberId, ctx.accessToken, ctx.platformUserId, text)
  } else if (ctx.platform === 'instagram') {
    await sendInstagram(ctx.platformPageId, ctx.accessToken, ctx.platformUserId, text)
  }
}
