/**
 * notify-store.ts
 * Fire-and-forget store-owner alerts on every new order.
 * Sends across all 4 channels in parallel; never throws or blocks order flow.
 */

import webpush from 'web-push'
import { getServiceClient } from '@/lib/supabase-service'
import { sendSMS, sendWhatsAppMessage } from '@/lib/termii'

export interface StoreOrderAlert {
  orderNumber: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  total: number          // in Naira (not kobo)
  itemCount?: number
  paymentMethod?: string
}

// ── helpers ────────────────────────────────────────────────────────────────

function naira(amount: number) {
  return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

/** Resolve store owner contacts from env → site_settings fallback */
async function resolveOwnerContacts(): Promise<{ email: string; phone: string }> {
  const email = process.env.STORE_OWNER_EMAIL ?? ''
  const phone = process.env.STORE_OWNER_PHONE ?? ''

  if (email && phone) return { email, phone }

  try {
    const db = getServiceClient()
    const [{ data: emailRow }, { data: phoneRow }] = await Promise.all([
      db.from('site_settings').select('value').eq('id', 'store_owner_email').maybeSingle(),
      db.from('site_settings').select('value').eq('id', 'store_whatsapp').maybeSingle(),
    ])
    return {
      email: email || String((emailRow as any)?.value ?? ''),
      phone: phone || String((phoneRow as any)?.value ?? ''),
    }
  } catch {
    return { email, phone }
  }
}

// ── channel: email ─────────────────────────────────────────────────────────

async function sendOwnerEmail(alert: StoreOrderAlert, ownerEmail: string) {
  const key = process.env.RESEND_API_KEY
  if (!key || !ownerEmail) return

  const storeName  = process.env.NEXT_PUBLIC_STORE_NAME || 'JFad Collections'
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL   || ''
  const fromEmail  = process.env.EMAIL_FROM             || `orders@jfadcollections.com`
  const { orderNumber, customerName, customerPhone, customerEmail, total, itemCount, paymentMethod } = alert

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#111827;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">${esc(storeName)}</h1>
            <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Store Notification</p>
          </td>
        </tr>

        <tr>
          <td style="background:#ecfdf5;padding:24px 32px;text-align:center;border-bottom:1px solid #d1fae5;">
            <div style="font-size:40px;margin-bottom:8px;">🛍️</div>
            <h2 style="margin:0 0 4px;color:#065f46;font-size:22px;font-weight:800;">New Order!</h2>
            <p style="margin:0;color:#047857;font-size:14px;">A customer just placed an order.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Order Ref</span>
                  <span style="display:block;color:#111;font-size:16px;font-weight:800;margin-top:2px;">#${esc(orderNumber)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Amount</span>
                  <span style="display:block;color:#059669;font-size:22px;font-weight:900;margin-top:2px;">${naira(total)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Customer</span>
                  <span style="display:block;color:#111;font-size:14px;font-weight:600;margin-top:2px;">${esc(customerName)}</span>
                  ${customerPhone ? `<span style="color:#6b7280;font-size:13px;">${esc(customerPhone)}</span>` : ''}
                  ${customerEmail ? `<span style="display:block;color:#6b7280;font-size:13px;">${esc(customerEmail)}</span>` : ''}
                </td>
              </tr>
              ${itemCount ? `<tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Items</span>
                  <span style="display:block;color:#111;font-size:14px;font-weight:600;margin-top:2px;">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
                </td>
              </tr>` : ''}
              ${paymentMethod ? `<tr>
                <td style="padding:10px 0;">
                  <span style="color:#6b7280;font-size:13px;">Payment</span>
                  <span style="display:block;color:#111;font-size:14px;font-weight:600;margin-top:2px;text-transform:capitalize;">${esc(paymentMethod)}</span>
                </td>
              </tr>` : ''}
            </table>

            <div style="text-align:center;margin-top:28px;">
              <a href="${esc(siteUrl)}/admin/orders"
                style="display:inline-block;background:#111827;color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:8px;text-decoration:none;">
                View in Admin Dashboard →
              </a>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">${esc(storeName)} · Store Alert</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    `${storeName} <${fromEmail}>`,
      to:      [ownerEmail],
      subject: `🛍️ New Order #${orderNumber} — ${naira(total)} from ${customerName}`,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[notify-store/email]', err.slice(0, 200))
  }
}

// ── channel: SMS ───────────────────────────────────────────────────────────

async function sendOwnerSMS(alert: StoreOrderAlert, ownerPhone: string) {
  if (!ownerPhone || !process.env.TERMII_API_KEY) return
  const storeName = (process.env.NEXT_PUBLIC_STORE_NAME || 'JFad').slice(0, 11)
  const msg = `New order! #${alert.orderNumber} from ${alert.customerName} — ${naira(alert.total)}. Check your dashboard now.`
  await sendSMS(ownerPhone, msg, storeName)
}

// ── channel: WhatsApp ──────────────────────────────────────────────────────

async function sendOwnerWhatsApp(alert: StoreOrderAlert, ownerPhone: string) {
  if (!ownerPhone || !process.env.TERMII_API_KEY) return
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'JFad Collections'
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL   || ''
  const lines = [
    `🛍️ *New ${storeName} Order!*`,
    ``,
    `Ref: *#${alert.orderNumber}*`,
    `Amount: *${naira(alert.total)}*`,
    `Customer: ${alert.customerName}`,
    alert.customerPhone ? `Phone: ${alert.customerPhone}` : '',
    alert.paymentMethod ? `Payment: ${alert.paymentMethod}` : '',
    ``,
    `${siteUrl}/admin/orders`,
  ].filter(Boolean)
  await sendWhatsAppMessage(ownerPhone, lines.join('\n'))
}

// ── channel: push ──────────────────────────────────────────────────────────

async function sendOwnerPush(alert: StoreOrderAlert) {
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) return

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || `mailto:${process.env.STORE_OWNER_EMAIL || 'admin@store.com'}`,
    vapidPublic,
    vapidPrivate,
  )

  const db = getServiceClient()
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (!subs?.length) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const payload = JSON.stringify({
    title: `🛍️ New Order — ${naira(alert.total)}`,
    body:  `#${alert.orderNumber} from ${alert.customerName}`,
    url:   `${siteUrl}/admin/orders`,
    icon:  `${siteUrl}/icons/icon-192.png`,
  })

  const stale: string[] = []
  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) stale.push(sub.endpoint)
      }
    })
  )

  if (stale.length) {
    await db.from('push_subscriptions').delete().in('endpoint', stale)
  }
}

// ── main export ────────────────────────────────────────────────────────────

/**
 * Call this after a verified payment to alert the store owner across all channels.
 * Runs all 4 channels in parallel. Never throws.
 */
export async function notifyStoreOwner(alert: StoreOrderAlert): Promise<void> {
  try {
    const { email, phone } = await resolveOwnerContacts()

    await Promise.allSettled([
      sendOwnerEmail(alert, email).catch(e => console.error('[notify-store/email]', e?.message)),
      sendOwnerSMS(alert, phone).catch(e => console.error('[notify-store/sms]', e?.message)),
      sendOwnerWhatsApp(alert, phone).catch(e => console.error('[notify-store/wa]', e?.message)),
      sendOwnerPush(alert).catch(e => console.error('[notify-store/push]', e?.message)),
    ])

    console.log(`[notify-store] Alerts fired for order #${alert.orderNumber}`)
  } catch (err: any) {
    console.error('[notify-store] Unexpected error:', err?.message)
  }
}
