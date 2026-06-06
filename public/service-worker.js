const CACHE = 'luderis-v3';

const PRECACHE = ['/index.html', '/'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // SOLO manejamos peticiones del propio dominio. Las cross-origin (Google
  // Fonts, avatares de Google, Supabase, analytics, etc.) pasan directo a la
  // red: si el SW les hiciera fetch(), esa petición se regiría por connect-src
  // de la CSP (no por style-src/font-src/img-src), y la CSP las bloquearía.
  if (url.origin !== self.location.origin) return;

  // Static assets — cache-first
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    e.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        // Si no hay cache y la red falla, dejamos que el rechazo se propague
        // (error de red normal) en vez de devolver undefined → "Failed to
        // convert value to 'Response'".
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Navigation — network-first, fallback to shell
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
  }
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Luderis', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
      tag: data.tag ?? 'default',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});
