const CACHE_NAME = 'samtech-crm-cache-v1-{{HASH}}';
const PRECACHE_URLS = [
  '/',
  '/dev-diagnostic',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  // INJECT_NEXT_STATIC_CHUNKS
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('samtech-crm-cache-')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET, API externes, et le rechargement de webpack
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.includes('/_next/webpack-hmr')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Stratégie Cache-First pour tout
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        // En mode hors ligne, les fetch aux API pourraient échouer
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Ne pas cacher les appels dynamiques API ou les pages dynamiques non pré-cachées par précaution
          // Sauf si nécessaire, mais dans le Sprint 0, on met tout en cache
          cache.put(event.request, responseClone);
        });

        return response;
      }).catch(() => {
        // Si hors ligne et requête de navigation (ex: actualisation d'une route non cachée)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
