const CACHE_NAME = 'samtech-crm-cache-v1-0ed10118';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/chunks/00t2fx8_tapv3.js',
  '/_next/static/chunks/073p7n7n_n5gm.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0g4oslw58f0fq.js',
  '/_next/static/chunks/0gum_mv_3h3dz.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0l9c-30oh5_jf.js',
  '/_next/static/chunks/0ob-xdsh3ntv4.js',
  '/_next/static/chunks/0s0ytgzo_bz0u.js',
  '/_next/static/chunks/0_gxoifeh06d8.js',
  '/_next/static/chunks/11fvyt9hh3l3u.js',
  '/_next/static/chunks/16hpg91tgkl68.js',
  '/_next/static/chunks/17si4k7byj-0_.js',
  '/_next/static/chunks/17uhz2cguutdx.js',
  '/_next/static/chunks/1bb73hzdpa9-k.js',
  '/_next/static/chunks/1ecz9b1cp192p.js',
  '/_next/static/chunks/1fhltkp7do0mv.js',
  '/_next/static/chunks/1jdtxh0khuyqj.js',
  '/_next/static/chunks/1le88r2k-ab-t.js',
  '/_next/static/chunks/1m-4mxcmvgbnq.js',
  '/_next/static/chunks/1m8d5eye454uw.js',
  '/_next/static/chunks/1n5io1nf09n-y.js',
  '/_next/static/chunks/1nj5vwibyac2q.css',
  '/_next/static/chunks/1q-2tiyv0amh3.js',
  '/_next/static/chunks/1qcq1_hyzxy5_.js',
  '/_next/static/chunks/1s-cc48q9xdu6.js',
  '/_next/static/chunks/1_0v6exngdege.js',
  '/_next/static/chunks/1_zmgipypuk59.js',
  '/_next/static/chunks/203-a2r9c_56k.js',
  '/_next/static/chunks/22hu1g1fhiqm0.js',
  '/_next/static/chunks/22pu2_nyg148g.js',
  '/_next/static/chunks/2jgv7wmymg8x0.js',
  '/_next/static/chunks/2nm6m95zxzp4g.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2qtpa7x1m7x9u.js',
  '/_next/static/chunks/2r8k1444ulo1c.js',
  '/_next/static/chunks/2t1wiuypim3wh.js',
  '/_next/static/chunks/2y0fy24g-29uz.js',
  '/_next/static/chunks/2y3ryx9sveiy2.js',
  '/_next/static/chunks/3-lht3lhxeiyx.js',
  '/_next/static/chunks/31rn11ah39t2w.js',
  '/_next/static/chunks/376zrq6ylqapw.js',
  '/_next/static/chunks/39ry8oeu606_-.js',
  '/_next/static/chunks/3djm7d35g4k_m.js',
  '/_next/static/chunks/3ekdryf4h_qh5.js',
  '/_next/static/chunks/3gr7ygyn4cdrv.js',
  '/_next/static/chunks/3gzjfml1ect_9.js',
  '/_next/static/chunks/3h3gkn8sju2ew.js',
  '/_next/static/chunks/3h_tbcx6z7jm8.js',
  '/_next/static/chunks/3l-sop1bzath_.js',
  '/_next/static/chunks/3l3fw4tc7_qeb.js',
  '/_next/static/chunks/3muqe8n930cww.js',
  '/_next/static/chunks/3o5dzbshpka6_.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3tf6wak1h6ghp.js',
  '/_next/static/chunks/3v5gnyboa3p44.js',
  '/_next/static/chunks/3ypap95i6yats.js',
  '/_next/static/chunks/3zfbwuwh7yu3h.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/turbopack-1clz3g9rssa6q.js',
  '/_next/static/GNUoOS_jWF9SeH6L8_msR/_buildManifest.js',
  '/_next/static/GNUoOS_jWF9SeH6L8_msR/_clientMiddlewareManifest.js',
  '/_next/static/GNUoOS_jWF9SeH6L8_msR/_ssgManifest.js',
  '/_next/static/media/favicon.2vob68tjqpejf.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Le skipWaiting automatique est retiré pour éviter de recharger pendant une saisie
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.includes('/_next/webpack-hmr')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Stratégie Cache-First
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // On cache les nouvelles requêtes (lazy-loaded chunks, pages visitées)
          cache.put(event.request, responseClone);
        });

        return response;
      }).catch(() => {
        // En cas d'échec (hors ligne), si c'est une navigation, on affiche la page hors ligne
        if (event.request.mode === 'navigate') {
          return caches.match('/offline').then((res) => {
            return res || new Response('<html><body>Vous êtes hors ligne</body></html>', { 
              status: 200, 
              headers: { 'Content-Type': 'text/html;charset=utf-8' } 
            });
          });
        }
      });
    })
  );
});
