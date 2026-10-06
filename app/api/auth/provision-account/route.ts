import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

// Called from the order confirmation page after Paystack verify succeeds.
// Creates a Supabase auth account for the customer (if they don't have one yet)
// and sends them a login link via email. Never blocks the confirmation page.

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, orderRef, fullName = '', phone = '' } = body
  if (!email || !orderRef) {
    return NextResponse.json({ error: 'email and orderRef required' }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()

  if (!isServiceClientReady()) {
    return NextResponse.json({ provisioned: false, reason: 'db_not_configured' })
  }

  const supabase = getServiceClient()

  // Guard: verify the order actually belongs to this email before provisioning
  const { data: order } = await supabase
    .from('orders')
    .select('id, email, user_id')
    .eq('payment_reference', orderRef)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const orderEmail = (order.email ?? '').trim().toLowerCase()
  if (orderEmail !== normalized) {
    return NextResponse.json({ error: 'Email does not match order' }, { status: 403 })
  }

  try {
    // inviteUserByEmail creates the user (if not exists) and sends a login link email.
    // For existing users it re-sends the invite; they can always use the link to log in.
    const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(normalized, {
      data: { full_name: fullName, phone },
    })

    if (inviteErr) {
      // User may already be confirmed — try a password-reset flow which also acts as "sign in link"
      if (inviteErr.message?.includes('already been registered')) {
        const { error: resetErr } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: normalized,
        })
        if (resetErr) throw resetErr
        return NextResponse.json({ provisioned: true, isNewUser: false })
      }
      throw inviteErr
    }

    // Link the order to this auth user
    const userId = inviteData?.user?.id
    if (userId && order.id && !order.user_id) {
      await supabase.from('orders').update({ user_id: userId }).eq('id', order.id)
    }

    return NextResponse.json({ provisioned: true, isNewUser: !order.user_id })
  } catch (e: any) {
    console.error('[provision-account]', e?.message)
    return NextResponse.json({ provisioned: false, error: e?.message })
  }
}
