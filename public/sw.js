// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'New notification', body: event.data.text() } }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body:  data.body  || '',
      icon:  data.icon  || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-72.png',
      image: data.image || undefined,
      data:  { url: data.url || '/' },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url === url && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})

// ─── Cache ────────────────────────────────────────────────────────────────────
const CACHE_VER    = 'v1'
const STATIC_CACHE = `static-${CACHE_VER}`
const IMAGE_CACHE  = `images-${CACHE_VER}`
const OFFLINE_URL  = '/offline'

// Install: pre-cache offline shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting())
  )
})

// Activate: wipe stale caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== IMAGE_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Never cache admin or API routes
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) return

  // Next.js static chunks — cache first, forever (they're content-hashed)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached
          return fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone())
            return res
          })
        })
      )
    )
    return
  }

  // Images — stale-while-revalidate, max 200 entries
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async cache => {
        const cached = await cache.match(request)
        const fetchPromise = fetch(request).then(res => {
          if (res.ok) {
            cache.put(request, res.clone())
            // Trim cache to 200 entries
            cache.keys().then(keys => {
              if (keys.length > 200) cache.delete(keys[0])
            })
          }
          return res
        }).catch(() => cached ?? new Response('', { status: 408 }))
        return cached ?? fetchPromise
      })
    )
    return
  }

  // Navigation requests — network first, offline page as fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(r => r ?? new Response('You are offline', { status: 503 }))
      )
    )
  }
})
