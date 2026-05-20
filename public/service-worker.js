const CACHE = 'luderis-v1';

const PRECACHE = ['/index.html', '/'];

const SKIP_HOSTS = ['supabase.co', 'google-analytics.com', 'googletagmanager.com', 'analytics.google.com'];

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
  if (SKIP_HOSTS.some((h) => url.hostname.includes(h))) return;

  // Static assets — cache-first
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    e.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        }).catch(() => hit);
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
