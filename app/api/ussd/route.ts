import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

// Africa's Talking USSD compatible endpoint.
// AT sends a POST with form-encoded body: sessionId, serviceCode, phoneNumber, text
// (text is the full accumulated input, steps separated by *)
// Response must be plain text: "CON <msg>" to continue or "END <msg>" to close session.

export async function POST(req: NextRequest) {
  let sessionId = '', phoneNumber = '', text = ''

  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null)
    sessionId   = (form?.get('sessionId')   as string) ?? ''
    phoneNumber = (form?.get('phoneNumber') as string) ?? ''
    text        = (form?.get('text')        as string) ?? ''
  } else {
    const json  = await req.json().catch(() => ({}))
    sessionId   = json.sessionId   ?? ''
    phoneNumber = json.phoneNumber ?? ''
    text        = json.text        ?? ''
  }

  // Check USSD is enabled
  const db = getServiceClient()
  const { data: enabledRow } = await db
    .from('site_settings').select('value').eq('id', 'ussd_enabled').maybeSingle()
  if (!enabledRow || enabledRow.value === false || enabledRow.value === 'false') {
    return ussdResponse('END This service is currently unavailable.\nPlease visit our website.')
  }

  const steps = text ? text.split('*') : []
  const reply = await handleUssd(db, steps, phoneNumber)
  return ussdResponse(reply)
}

function ussdResponse(text: string) {
  return new NextResponse(text, { headers: { 'Content-Type': 'text/plain' } })
}

// ────────────────────────────────────────────────────────────
// Menu handlers
// ────────────────────────────────────────────────────────────

async function handleUssd(db: ReturnType<typeof getServiceClient>, steps: string[], phone: string): Promise<string> {
  // Fetch store name once
  const { data: titleRow } = await db
    .from('site_settings').select('value').eq('id', 'store_site_title').maybeSingle()
  const store = truncate(String((titleRow as any)?.value || 'Our Store'), 20)

  // ── Main menu ──────────────────────────────────────────────
  if (steps.length === 0 || steps[0] === '') {
    return mainMenu(store)
  }

  // ── SHOP FLOW ─────────────────────────────────────────────
  if (steps[0] === '1') {
    // Level 1 — category list
    if (steps.length === 1) {
      const cats = await getCategories(db)
      if (!cats.length) return 'END No products available.\nCheck back soon!'
      const list = cats.map((c, i) => `${i + 1}. ${truncate(c.name, 22)}`).join('\n')
      return `CON ${store} — Shop:\n${list}\n0. Back`
    }

    if (steps[1] === '0') return mainMenu(store)

    const catIdx = parseInt(steps[1], 10) - 1
    const cats   = await getCategories(db)
    const cat    = cats[catIdx]
    if (!cat) return mainMenu(store)

    // Level 2 — product list
    if (steps.length === 2) {
      const prods = await getProducts(db, cat.id)
      if (!prods.length) return `CON ${truncate(cat.name, 18)} — empty.\n0. Back`
      const list = prods.map((p, i) => `${i + 1}. ${truncate(p.name, 14)} ₦${fmt(p.price)}`).join('\n')
      return `CON ${truncate(cat.name, 18)}:\n${list}\n0. Back`
    }

    if (steps[2] === '0') return handleUssd(db, ['1'], phone)

    const prodIdx = parseInt(steps[2], 10) - 1
    const prods   = await getProducts(db, cat.id)
    const prod    = prods[prodIdx]
    if (!prod) return handleUssd(db, ['1', steps[1]], phone)

    // Level 3 — product detail
    if (steps.length === 3) {
      return `CON ${truncate(prod.name, 26)}\nPrice: ₦${fmt(prod.price)}\n\n1. Order (Pay on Delivery)\n0. Back`
    }

    if (steps[3] === '0') return handleUssd(db, ['1', steps[1]], phone)

    // Level 4 — start order: enter name
    if (steps.length === 4 && steps[3] === '1') {
      return `CON Enter your full name:`
    }

    // Level 5 — got name: enter address
    if (steps.length === 5) {
      if (!steps[4].trim()) return `CON Enter your full name:`
      return `CON Enter delivery address\n(street, area, city):`
    }

    // Level 6 — got address: place order
    if (steps.length === 6) {
      const name    = steps[4].trim()
      const address = steps[5].trim()
      if (!address) return `CON Enter delivery address:`

      const orderNum = 'USSD-' + Date.now().toString(36).toUpperCase().slice(-6)
      const { error } = await db.from('orders').insert({
        order_number:    orderNum,
        customer_phone:  phone,
        total:           prod.price,
        status:          'pending',
        payment_method:  'pod',
        source:          'ussd',
        address:         { fullName: name, phone, addressLine: address },
        items:           [{ product_id: prod.id, name: prod.name, price: prod.price, quantity: 1 }],
      })
      if (error) return `END Something went wrong.\nPlease call us to order.`

      // Best-effort stock decrement
      await db.from('products')
        .rpc('decrement_stock', { p_id: prod.id, qty: 1 })
        .catch(() => {})

      return `END Order confirmed!\nRef: ${orderNum}\n\nWe will call ${phone}\nto arrange delivery.\n\nThank you for shopping\nwith ${store}!`
    }
  }

  // ── TRACK ORDER ───────────────────────────────────────────
  if (steps[0] === '2') {
    if (steps.length === 1) return `CON Enter order number\n(e.g. USSD-ABC123):`

    const ref = steps[1].trim().toUpperCase()
    const { data: order } = await db
      .from('orders')
      .select('order_number, status, total, created_at')
      .ilike('order_number', ref)
      .maybeSingle()

    if (!order) {
      return `END Order "${ref}" not found.\nDouble-check the number\nand try again.`
    }
    const labels: Record<string, string> = {
      pending: 'Pending confirmation', processing: 'Being prepared',
      shipped: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
    }
    const date = new Date((order as any).created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
    return `END Order: ${(order as any).order_number}\nDate: ${date}\nStatus: ${labels[(order as any).status] ?? (order as any).status}\nTotal: ₦${fmt((order as any).total)}`
  }

  // ── CONTACT ───────────────────────────────────────────────
  if (steps[0] === '3') {
    const { data: rows } = await db
      .from('site_settings').select('id, value').in('id', ['store_phone', 'store_whatsapp', 'store_email'])
    const m: Record<string, string> = {}
    ;(rows as any[])?.forEach((r: any) => { m[r.id] = String(r.value ?? '') })
    const parts = [`${store}`]
    if (m['store_phone'])     parts.push(`Call: ${m['store_phone']}`)
    if (m['store_whatsapp'])  parts.push(`WhatsApp: ${m['store_whatsapp']}`)
    if (m['store_email'])     parts.push(`Email: ${m['store_email']}`)
    return `END ${parts.join('\n')}`
  }

  return mainMenu(store)
}

// ────────────────────────────────────────────────────────────
// DB helpers
// ────────────────────────────────────────────────────────────

async function getCategories(db: ReturnType<typeof getServiceClient>) {
  const { data } = await db
    .from('categories').select('id, name').eq('is_active', true).order('sort_order').limit(6)
  return (data as { id: string; name: string }[]) ?? []
}

async function getProducts(db: ReturnType<typeof getServiceClient>, categoryId: string) {
  const { data } = await db
    .from('products')
    .select('id, name, price')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('created_at', { ascending: false })
    .limit(5)
  return (data as { id: string; name: string; price: number }[]) ?? []
}

// ────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────

function mainMenu(store: string) {
  return `CON Welcome to ${store}\n1. Shop Now\n2. Track Order\n3. Contact Us`
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('en-NG')
}
