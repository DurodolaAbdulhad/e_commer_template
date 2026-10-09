'use client'

import { useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    const existing = await registration.pushManager.getSubscription()
    const sub = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub, userAgent: navigator.userAgent }),
    })
  } catch {}
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async registration => {
        if (Notification.permission === 'granted') {
          subscribeToPush(registration)
          return
        }
        if (Notification.permission === 'denied') return

        // Prompt once per session, after 3s
        const prompted = sessionStorage.getItem('push_prompted')
        if (prompted) return
        sessionStorage.setItem('push_prompted', '1')

        await new Promise(r => setTimeout(r, 3000))
        const permission = await Notification.requestPermission()
        if (permission === 'granted') subscribeToPush(registration)
      })
      .catch(err => console.warn('[SW] Registration failed:', err))
  }, [])

  return null
}
