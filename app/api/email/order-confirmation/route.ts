import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  const guard = requireSameOrigin(req)
  if (guard) return guard

  const RESEND_KEY = process.env.RESEND_API_KEY
  const FROM       = process.env.EMAIL_FROM || 'orders@mynnatapparels.com.ng'

  if (!RESEND_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — order confirmation email not sent')
    return NextResponse.json({ ok: false, reason: 'Email not configured' })
  }

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { order } = body
  if (!order) return NextResponse.json({ error: 'order required' }, { status: 400 })

  const toEmail = order.address?.email
  if (!toEmail) return NextResponse.json({ ok: false, reason: 'No customer email' })

  const storeName      = process.env.NEXT_PUBLIC_STORE_NAME || 'Mynnat Luxe Collections'
  const storeEmail     = FROM
  const orderNumber    = order.order_number ?? '—'
  const customerName   = order.address?.fullName ?? 'Customer'
  const total          = formatNaira(order.total ?? 0)
  const shipping       = order.shipping_cost === 0 ? 'FREE' : formatNaira(order.shipping_cost ?? 0)
  const subtotal       = formatNaira(order.subtotal ?? 0)
  const addr           = order.address ?? {}

  const itemRows = (order.items ?? []).map((item: any) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          <tr>
            ${item.image ? `
            <td style="width:56px;padding-right:12px;vertical-align:top;">
              <img src="${esc(item.image)}" alt="${esc(item.name)}"
                width="56" height="56"
                style="border-radius:8px;object-fit:cover;display:block;border:1px solid #f0f0f0;" />
            </td>` : ''}
            <td style="vertical-align:top;">
              <strong style="display:block;color:#111;font-size:14px;">${esc(item.name)}</strong>
              ${item.variant ? `<span style="color:#888;font-size:12px;display:block;">${esc(item.variant)}</span>` : ''}
              <span style="color:#888;font-size:12px;">Qty: ${item.quantity}</span>
            </td>
            <td style="text-align:right;vertical-align:top;white-space:nowrap;font-weight:700;color:#111;font-size:14px;padding-left:12px;">
              ${formatNaira(item.price * item.quantity)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:#111;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${esc(storeName)}</h1>
            <p style="margin:6px 0 0;color:#aaa;font-size:13px;">Order Confirmation</p>
          </td>
        </tr>

        <!-- Success banner -->
        <tr>
          <td style="background:#f0fdf4;padding:24px 32px;text-align:center;border-bottom:1px solid #e8f5e9;">
            <div style="font-size:36px;margin-bottom:8px;">✅</div>
            <h2 style="margin:0 0 6px;color:#166534;font-size:20px;font-weight:800;">Order Placed Successfully!</h2>
            <p style="margin:0;color:#4b7c59;font-size:14px;">Hi <strong>${esc(customerName)}</strong>, we've received your order and it's being processed.</p>
            <div style="margin-top:14px;">
              <span style="display:inline-block;background:#16a34a;color:#fff;padding:6px 20px;border-radius:999px;font-size:13px;font-weight:700;">
                Order #${esc(orderNumber)}
              </span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">

            <!-- Items -->
            <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#888;font-weight:600;">Items Ordered</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:2px solid #111;padding-top:16px;">
              <tr>
                <td style="color:#666;font-size:13px;padding:4px 0;">Subtotal</td>
                <td style="text-align:right;color:#111;font-size:13px;font-weight:600;">${subtotal}</td>
              </tr>
              <tr>
                <td style="color:#666;font-size:13px;padding:4px 0;">Shipping</td>
                <td style="text-align:right;color:#111;font-size:13px;font-weight:600;">${shipping}</td>
              </tr>
              ${(order.discount ?? 0) > 0 ? `<tr>
                <td style="color:#16a34a;font-size:13px;padding:4px 0;">Discount</td>
                <td style="text-align:right;color:#16a34a;font-size:13px;font-weight:600;">-${formatNaira(order.discount)}</td>
              </tr>` : ''}
              <tr>
                <td style="color:#111;font-size:16px;font-weight:800;padding:12px 0 0;border-top:1px solid #eee;">Total Paid</td>
                <td style="text-align:right;color:#111;font-size:16px;font-weight:800;padding:12px 0 0;border-top:1px solid #eee;">${total}</td>
              </tr>
            </table>

            <!-- Delivery address -->
            <div style="margin-top:24px;background:#f9f9f9;border-radius:8px;padding:16px;">
              <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#888;font-weight:600;">📦 Delivery Address</h3>
              <p style="margin:0;font-size:14px;color:#111;line-height:1.7;">
                <strong>${esc(addr.fullName ?? '')}</strong><br>
                ${esc(addr.address ?? '')}<br>
                ${esc(addr.city ?? '')}${addr.area ? `, ${esc(addr.area)}` : ''}, ${esc(addr.state ?? '')}<br>
                ${esc(addr.country ?? 'Nigeria')}
              </p>
            </div>

            <!-- What's next -->
            <div style="margin-top:24px;">
              <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#888;font-weight:600;">What happens next?</h3>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
                We'll process your order and send you an update when it ships. If you have any questions, reply to this email or WhatsApp us.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0 0 6px;font-size:12px;color:#999;">Questions? Reply to this email or contact us:</p>
            <p style="margin:0;font-size:12px;color:#666;">
              <a href="mailto:${esc(storeEmail)}" style="color:#111;font-weight:600;">${esc(storeEmail)}</a>
            </p>
            <p style="margin:10px 0 0;font-size:11px;color:#bbb;">${esc(storeName)} · All rights reserved</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    `${storeName} <${FROM}>`,
        to:      [toEmail],
        subject: `Order Confirmed ✅ #${orderNumber} — ${storeName}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Email] Resend error:', err.slice(0, 300))
      return NextResponse.json({ ok: false, error: 'Resend API error' })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, id: data.id })
  } catch (e: any) {
    console.error('[Email] Unexpected error:', e?.message?.slice(0, 200))
    return NextResponse.json({ ok: false })
  }
}

function formatNaira(amount: number) {
  return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function esc(str: string) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
