'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function getDevice(): string {
  const ua = navigator.userAgent
  if (/mobile|android|iphone/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

function getSession(): string {
  try {
    let id = sessionStorage.getItem('_asv')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('_asv', id)
    }
    return id
  } catch { return 'unknown' }
}

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path:       pathname,
        device:     getDevice(),
        session_id: getSession(),
        referrer:   document.referrer || null,
      }),
    }).catch(() => {})
  }, [pathname])

  return null
}
