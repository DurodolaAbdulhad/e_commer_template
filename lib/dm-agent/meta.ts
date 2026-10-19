const GRAPH = 'https://graph.facebook.com/v21.0'

// Send a WhatsApp text message via Meta Cloud API
export async function sendWhatsApp(
  phoneNumberId: string,
  accessToken:   string,
  to:            string,
  text:          string,
): Promise<void> {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type:    'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp send failed: ${err}`)
  }
}

// Send an Instagram DM via Meta Graph API
export async function sendInstagram(
  pageId:       string,
  accessToken:  string,
  recipientId:  string,
  text:         string,
): Promise<void> {
  const res = await fetch(`${GRAPH}/${pageId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message:   { text },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Instagram send failed: ${err}`)
  }
}
