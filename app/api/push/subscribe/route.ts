import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

export async function POST(req: NextRequest) {
  try {
    const { subscription, userAgent } = await req.json()
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint:    subscription.endpoint,
        p256dh:      subscription.keys?.p256dh ?? '',
        auth:        subscription.keys?.auth ?? '',
        user_agent:  userAgent ?? '',
        subscribed_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: 'No endpoint' }, { status: 400 })
    const supabase = getServiceClient()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
