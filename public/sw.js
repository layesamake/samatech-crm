const CACHE_NAME = 'samtech-crm-cache-v1-08169423';
const PRECACHE_URLS = [
  '/',
  '/dev-diagnostic',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/chunks/05au18erypouf.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0q8kw3h16fhp6.js',
  '/_next/static/chunks/0rq7k8gnx6ukb.js',
  '/_next/static/chunks/0s1wqc4zowyk6.js',
  '/_next/static/chunks/0sdh970j0a0j2.js',
  '/_next/static/chunks/0t1ze3du207re.js',
  '/_next/static/chunks/11oof8oxnxiv9.js',
  '/_next/static/chunks/14h0i6lvggfsm.js',
  '/_next/static/chunks/14mrh2-p_w84d.js',
  '/_next/static/chunks/166t9_zsa4a-3.js',
  '/_next/static/chunks/16hpg91tgkl68.js',
  '/_next/static/chunks/1fmix9j0cnj6k.js',
  '/_next/static/chunks/1ge67-p-__v50.js',
  '/_next/static/chunks/1jph7awrqpw5f.js',
  '/_next/static/chunks/1pynqcpvze_22.js',
  '/_next/static/chunks/1qs-n_dfd8nwb.js',
  '/_next/static/chunks/1ua5armwfph8o.js',
  '/_next/static/chunks/1xi0il_be34li.js',
  '/_next/static/chunks/1_0v6exngdege.js',
  '/_next/static/chunks/1_48p7g9htzi_.js',
  '/_next/static/chunks/2-3-gwm11j1xi.js',
  '/_next/static/chunks/2-b-ygxe3b4yp.js',
  '/_next/static/chunks/2-wctqg6mu125.js',
  '/_next/static/chunks/221og43chxdtk.js',
  '/_next/static/chunks/2aec4pc8uiao4.js',
  '/_next/static/chunks/2efndndy6mcch.js',
  '/_next/static/chunks/2loj164ghki_a.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2skldwnlo7gp4.js',
  '/_next/static/chunks/2tp1xpcvgm5gq.js',
  '/_next/static/chunks/306wp98o5mq0g.css',
  '/_next/static/chunks/30xvxre5w1iuy.js',
  '/_next/static/chunks/3191lnlwmu-px.js',
  '/_next/static/chunks/39fzl726lnydz.js',
  '/_next/static/chunks/39r69fkm5z38-.js',
  '/_next/static/chunks/3do0--s59xdrl.js',
  '/_next/static/chunks/3dw80ixjtswh3.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3p3fexguyj_mf.js',
  '/_next/static/chunks/3vo-xwamhi7r1.js',
  '/_next/static/chunks/3ypap95i6yats.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/44cm8l_-5r9dv.js',
  '/_next/static/chunks/44nw_-16thmat.js',
  '/_next/static/chunks/turbopack-2nbc2eawgfkk1.js',
  '/_next/static/media/favicon.2vob68tjqpejf.ico',
  '/_next/static/uGVt87w5783-3d0IbAoXu/_buildManifest.js',
  '/_next/static/uGVt87w5783-3d0IbAoXu/_clientMiddlewareManifest.js',
  '/_next/static/uGVt87w5783-3d0IbAoXu/_ssgManifest.js'
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
