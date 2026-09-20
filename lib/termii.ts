const API_KEY  = process.env.TERMII_API_KEY ?? ''
const BASE_URL = 'https://v3.api.termii.com'

export async function sendSMS(to: string, message: string, senderId = 'MyStore') {
  if (!API_KEY) {
    console.warn('[Termii] TERMII_API_KEY not set — SMS not sent')
    return
  }
  const phone = to.replace(/\D/g, '').replace(/^0/, '234')
  const res = await fetch(`${BASE_URL}/api/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: phone, from: senderId, sms: message, type: 'plain', channel: 'generic', api_key: API_KEY }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('[Termii] SMS failed:', body)
  }
}

export async function sendOrderConfirmationSMS(phone: string, orderNumber: string, total: string, storeName: string) {
  const msg = `Hi! Your order ${orderNumber} from ${storeName} has been confirmed. Total: ${total}. We'll update you when it ships. Thank you!`
  await sendSMS(phone, msg, storeName.slice(0, 11))
}

export async function sendAbandonedCartSMS(phone: string, firstName: string, storeName: string, cartUrl: string) {
  const msg = `Hi ${firstName}! You left items in your ${storeName} cart. Complete your order here: ${cartUrl}`
  await sendSMS(phone, msg, storeName.slice(0, 11))
}

export async function sendShippingUpdateSMS(phone: string, orderNumber: string, status: string, storeName: string) {
  const msg = `${storeName}: Your order ${orderNumber} is now ${status}. Track your delivery in your account.`
  await sendSMS(phone, msg, storeName.slice(0, 11))
}
