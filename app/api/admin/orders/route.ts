import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'
import { sendShippingUpdateSMS } from '@/lib/termii'
import { client as storeConfig } from '@/config/client'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Database not configured', orders: [], dbReady: false }, { status: 200 })
  }

  const supabase = getServiceClient()
  const status = req.nextUrl.searchParams.get('status') ?? ''

  let q = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)

  const { data, error } = await q

  if (error) {
    return NextResponse.json({ error: error.message, orders: [], dbReady: true }, { status: 200 })
  }

  return NextResponse.json({ orders: data ?? [], dbReady: true })
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const { id, status, tracking_notes } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (!status && tracking_notes === undefined) return NextResponse.json({ error: 'status or tracking_notes required' }, { status: 400 })

  const supabase = getServiceClient()

  // Save tracking notes only
  if (tracking_notes !== undefined && !status) {
    const { error } = await supabase.from('orders').update({ tracking_notes }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const updatePayload: Record<string, any> = { status }
  if (tracking_notes !== undefined) updatePayload.tracking_notes = tracking_notes

  const { error } = await supabase.from('orders').update(updatePayload).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send status update notifications for key milestones
  if (['shipped', 'delivered', 'cancelled'].includes(status)) {
    try {
      const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
      if (order?.email) {
        await sendStatusEmail(order, status)
      }
      if (['shipped', 'delivered'].includes(status) && order?.phone && process.env.TERMII_API_KEY) {
        const orderRef = order.order_number ?? order.payment_reference ?? order.id
        await sendShippingUpdateSMS(order.phone, orderRef, status, storeConfig.name)
      }
    } catch (e) {
      console.error('[orders PATCH] notification error:', (e as any)?.message?.slice(0, 200))
    }
  }

  return NextResponse.json({ ok: true })
}

const STATUS_SUBJECT: Record<string, string> = {
  shipped:   '📦 Your order has been shipped!',
  delivered: '✅ Your order has been delivered!',
  cancelled: '❌ Your order has been cancelled',
}

const STATUS_COLOR: Record<string, string> = {
  shipped:   '#2563eb',
  delivered: '#16a34a',
  cancelled: '#dc2626',
}

const STATUS_MESSAGE: Record<string, string> = {
  shipped:   'Great news! Your order is on its way. You should receive it within the estimated delivery window.',
  delivered: 'Your order has been delivered. We hope you love it! If you have any issues, please reach out to us.',
  cancelled: 'Your order has been cancelled. If you did not request this, or if you have any questions, please contact us immediately.',
}

async function sendStatusEmail(order: any, status: string) {
  const RESEND_KEY = process.env.RESEND_API_KEY
  const FROM       = process.env.EMAIL_FROM || 'orders@mynnatapparels.com.ng'
  if (!RESEND_KEY) return

  const storeName   = 'Mynnat Luxe Collections'
  const orderNumber = order.order_number || order.payment_reference || order.id
  const customerName = order.shipping_address?.fullName || 'Customer'
  const toEmail     = order.email
  const color       = STATUS_COLOR[status] ?? '#111'
  const message     = STATUS_MESSAGE[status] ?? `Your order status has been updated to: ${status}`
  const subject     = `${STATUS_SUBJECT[status] ?? `Order Update`} — #${orderNumber}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:#111;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">${storeName}</h1>
            <p style="margin:6px 0 0;color:#aaa;font-size:13px;">Order Update</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center;">
            <div style="display:inline-block;background:${color}22;border-radius:999px;padding:10px 24px;margin-bottom:20px;">
              <span style="color:${color};font-weight:800;font-size:15px;text-transform:uppercase;letter-spacing:1px;">${status}</span>
            </div>
            <h2 style="margin:0 0 12px;color:#111;font-size:20px;font-weight:800;">Hi ${customerName},</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">${message}</p>
            <div style="background:#f9f9f9;border-radius:8px;padding:16px;text-align:left;">
              <p style="margin:0;font-size:13px;color:#888;">Order Number</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:800;color:#111;">#${orderNumber}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;">Questions? Contact us: <a href="mailto:${FROM}" style="color:#111;font-weight:600;">${FROM}</a></p>
            <p style="margin:8px 0 0;font-size:11px;color:#bbb;">${storeName} · All rights reserved</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${storeName} <${FROM}>`, to: [toEmail], subject, html }),
  })
}
