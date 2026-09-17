const CACHE = 'apple-store-malaysia-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.includes('/functions/')) return

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE).then((cache) => cache.put(request, copy))
      return response
    }).catch(() => caches.match('./')))
  )
})
