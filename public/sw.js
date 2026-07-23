const CACHE_NAME = 'samtech-crm-cache-v1-e8d290d4';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/1kbIhuK5GmrXEt7MQ_-E1/_buildManifest.js',
  '/_next/static/1kbIhuK5GmrXEt7MQ_-E1/_clientMiddlewareManifest.js',
  '/_next/static/1kbIhuK5GmrXEt7MQ_-E1/_ssgManifest.js',
  '/_next/static/chunks/0-2be8u4uhce1.js',
  '/_next/static/chunks/00t2fx8_tapv3.js',
  '/_next/static/chunks/01q-83euo88fo.js',
  '/_next/static/chunks/051yuskry2njk.js',
  '/_next/static/chunks/05e0jx8u7yez5.js',
  '/_next/static/chunks/077op4tip2lf-.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0e14t8730xrct.js',
  '/_next/static/chunks/0g98eby2lsz03.js',
  '/_next/static/chunks/0ggjawn0ce7zb.js',
  '/_next/static/chunks/0gum_mv_3h3dz.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0lcb34i2ji6i7.js',
  '/_next/static/chunks/0njf5vs8aeqb6.js',
  '/_next/static/chunks/0o9oy3vcbxeo_.js',
  '/_next/static/chunks/0ob-xdsh3ntv4.js',
  '/_next/static/chunks/0q-u0m_9kxd-c.js',
  '/_next/static/chunks/0q3ubecm4h2mw.js',
  '/_next/static/chunks/0rkv3xvp1fq11.js',
  '/_next/static/chunks/0zow-xg3fhlfw.js',
  '/_next/static/chunks/0zx-_cnvs3ia1.js',
  '/_next/static/chunks/11zn3capp88d6.js',
  '/_next/static/chunks/13tq0i4lzah17.js',
  '/_next/static/chunks/14byi0xy97vjd.js',
  '/_next/static/chunks/16fmgno42i5il.js',
  '/_next/static/chunks/16hpg91tgkl68.js',
  '/_next/static/chunks/17uhz2cguutdx.js',
  '/_next/static/chunks/1d86kvmh-4mo7.js',
  '/_next/static/chunks/1ecz9b1cp192p.js',
  '/_next/static/chunks/1kp674-h77lt_.js',
  '/_next/static/chunks/1m-4mxcmvgbnq.js',
  '/_next/static/chunks/1m4dlgf4_m0te.js',
  '/_next/static/chunks/1pzskyhsew7zw.js',
  '/_next/static/chunks/1qcq1_hyzxy5_.js',
  '/_next/static/chunks/1qlysqlypjhpw.js',
  '/_next/static/chunks/1s-cc48q9xdu6.js',
  '/_next/static/chunks/1tiggfm28d2k4.js',
  '/_next/static/chunks/1ucue_7ltjmb-.js',
  '/_next/static/chunks/1v72agtfsy8_y.js',
  '/_next/static/chunks/1zfzoweha3b2g.js',
  '/_next/static/chunks/1zli76d44jm9h.js',
  '/_next/static/chunks/1_0v6exngdege.js',
  '/_next/static/chunks/1_zmgipypuk59.js',
  '/_next/static/chunks/2-h4-4dvr8f53.js',
  '/_next/static/chunks/2-ojxncb8j5pj.js',
  '/_next/static/chunks/24hcb546f668s.js',
  '/_next/static/chunks/2c6fw2htoj1fb.js',
  '/_next/static/chunks/2c6hpp98efkh9.js',
  '/_next/static/chunks/2mh4pa-vilrdv.css',
  '/_next/static/chunks/2osusjntyjiam.js',
  '/_next/static/chunks/2pzf5_oxomr7_.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2qfgrh4dgk6wq.js',
  '/_next/static/chunks/2ueyg33yqhz83.js',
  '/_next/static/chunks/2xfvos4xwi_p7.js',
  '/_next/static/chunks/2y0fy24g-29uz.js',
  '/_next/static/chunks/2__h_a5_bk4-k.js',
  '/_next/static/chunks/32x3ke7eydsia.js',
  '/_next/static/chunks/33tqj3xt6b8by.js',
  '/_next/static/chunks/398sz4pxj1h8o.js',
  '/_next/static/chunks/3aiq89iua0wce.js',
  '/_next/static/chunks/3as4n4g--9_ol.js',
  '/_next/static/chunks/3dtk3t_p6xgpd.js',
  '/_next/static/chunks/3gltegcggd5cq.js',
  '/_next/static/chunks/3l-sop1bzath_.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3r_ac6c83c776.js',
  '/_next/static/chunks/3s_q7r0o1o3tu.js',
  '/_next/static/chunks/3taqrs5i7sv4p.js',
  '/_next/static/chunks/3v5gnyboa3p44.js',
  '/_next/static/chunks/3vu4y8mzy70mz.js',
  '/_next/static/chunks/3wkrnyn5exywc.js',
  '/_next/static/chunks/3wzj4yle906o8.js',
  '/_next/static/chunks/3ypap95i6yats.js',
  '/_next/static/chunks/3zfbwuwh7yu3h.js',
  '/_next/static/chunks/3zqjkz1aky18c.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/44s10_47w7l83.js',
  '/_next/static/chunks/44x5lmyhzoqgy.js',
  '/_next/static/chunks/turbopack-1q7kuydjn3iu7.js',
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
