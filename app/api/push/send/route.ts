import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-server'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@store.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value ?? ''
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, body, url, icon, image } = await req.json()
    if (!title || !body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (!subs?.length) {
      return NextResponse.json({ sent: 0, failed: 0, message: 'No subscribers' })
    }

    const payload = JSON.stringify({ title, body, url: url || '/', icon, image })
    let sent = 0, failed = 0, stale: string[] = []

    await Promise.allSettled(
      subs.map(async sub => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
          sent++
        } catch (err: any) {
          // 404/410 = expired subscription — clean up
          if (err.statusCode === 404 || err.statusCode === 410) {
            stale.push(sub.endpoint)
          }
          failed++
        }
      })
    )

    // Remove expired subscriptions
    if (stale.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', stale)
    }

    return NextResponse.json({ sent, failed, stale: stale.length })
  } catch (err: any) {
    console.error('[push/send]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
