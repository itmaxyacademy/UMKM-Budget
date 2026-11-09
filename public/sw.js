const CACHE_NAME = 'maxy-umkm-budget-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './favicon.png',
  './icon.svg',
  './logo-m.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Install Event - Pre-cache essential app shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching app shell assets');
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('[SW] Failed to pre-cache:', url, err);
        }
      }
    })
  );
});

// Activate Event - Clean old caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle offline navigation & asset caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const url = new URL(request.url);

  // Skip non-HTTP(S) schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // 1. Navigation requests (e.g. user opens app or refreshes page, e.g. / or /?tab=plan)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
              cache.put('./', networkResponse.clone());
              cache.put('./index.html', networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Offline mode: serving cached HTML App Shell');
          const cache = await caches.open(CACHE_NAME);
          const cachedHTML =
            (await cache.match(request, { ignoreSearch: true })) ||
            (await cache.match('./')) ||
            (await cache.match('./index.html'));

          if (cachedHTML) {
            return cachedHTML;
          }

          return new Response(
            '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Maxy UMKM Budget - Offline</title><style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px}.card{background:#1e293b;padding:32px;border-radius:16px;max-width:400px;box-shadow:0 10px 25px rgba(0,0,0,0.3)}h1{font-size:20px;margin-bottom:12px;color:#f59e0b}p{font-size:14px;color:#94a3b8;line-height:1.5}</style></head><body><div class="card"><h1>Anda Sedang Offline</h1><p>Aplikasi Maxy UMKM Budget siap digunakan offline. Silakan buka kembali setelah halaman pertama kali dimuat saat ada koneksi internet.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. Asset requests (JS, CSS, Images, Fonts, JSON) - Cache-First with Network Fallback & Auto-Cache
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache if online
        if (navigator.onLine) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                const copy = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              }
            })
            .catch(() => {
              /* ignore background fetch errors when offline */
            });
        }
        return cachedResponse;
      }

      // If not in cache, fetch from network and store in cache
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          console.warn('[SW] Fetch failed offline for asset:', request.url);
          return new Response('', { status: 503, statusText: 'Offline - Asset Not Cached' });
        });
    })
  );
});

// Message listener for immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
