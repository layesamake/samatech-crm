const CACHE_NAME = 'samtech-crm-cache-v1-e5683c2d';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/chunks/0-2be8u4uhce1.js',
  '/_next/static/chunks/00t2fx8_tapv3.js',
  '/_next/static/chunks/01q-83euo88fo.js',
  '/_next/static/chunks/0381xgx_1_w4z.js',
  '/_next/static/chunks/051yuskry2njk.js',
  '/_next/static/chunks/05e0jx8u7yez5.js',
  '/_next/static/chunks/060kv5h9ouw0q.js',
  '/_next/static/chunks/077op4tip2lf-.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0e14t8730xrct.js',
  '/_next/static/chunks/0g98eby2lsz03.js',
  '/_next/static/chunks/0ggjawn0ce7zb.js',
  '/_next/static/chunks/0gum_mv_3h3dz.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0jfzwh1-otajg.js',
  '/_next/static/chunks/0njf5vs8aeqb6.js',
  '/_next/static/chunks/0ob-xdsh3ntv4.js',
  '/_next/static/chunks/0rkv3xvp1fq11.js',
  '/_next/static/chunks/0tlmk4m0w32s1.js',
  '/_next/static/chunks/0zow-xg3fhlfw.js',
  '/_next/static/chunks/0zx-_cnvs3ia1.js',
  '/_next/static/chunks/11zn3capp88d6.js',
  '/_next/static/chunks/13tq0i4lzah17.js',
  '/_next/static/chunks/14byi0xy97vjd.js',
  '/_next/static/chunks/16hpg91tgkl68.js',
  '/_next/static/chunks/17uhz2cguutdx.js',
  '/_next/static/chunks/18hhz47gapgqg.js',
  '/_next/static/chunks/1ecz9b1cp192p.js',
  '/_next/static/chunks/1m-4mxcmvgbnq.js',
  '/_next/static/chunks/1qcq1_hyzxy5_.js',
  '/_next/static/chunks/1qlysqlypjhpw.js',
  '/_next/static/chunks/1s-cc48q9xdu6.js',
  '/_next/static/chunks/1tiggfm28d2k4.js',
  '/_next/static/chunks/1ucue_7ltjmb-.js',
  '/_next/static/chunks/1zfzoweha3b2g.js',
  '/_next/static/chunks/1_0v6exngdege.js',
  '/_next/static/chunks/1_zmgipypuk59.js',
  '/_next/static/chunks/2-h4-4dvr8f53.js',
  '/_next/static/chunks/2-ojxncb8j5pj.js',
  '/_next/static/chunks/20_ut29ymd7vo.js',
  '/_next/static/chunks/22ziwusec_2gt.js',
  '/_next/static/chunks/24hcb546f668s.js',
  '/_next/static/chunks/28918jtcy-x9v.js',
  '/_next/static/chunks/2c6hpp98efkh9.js',
  '/_next/static/chunks/2cfwxes93mel9.js',
  '/_next/static/chunks/2cfy54t1as9rm.js',
  '/_next/static/chunks/2gs79o1i9u70g.js',
  '/_next/static/chunks/2osusjntyjiam.js',
  '/_next/static/chunks/2pzf5_oxomr7_.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2qfgrh4dgk6wq.js',
  '/_next/static/chunks/2ueyg33yqhz83.js',
  '/_next/static/chunks/2y-2arv1r593x.js',
  '/_next/static/chunks/2y0fy24g-29uz.js',
  '/_next/static/chunks/2__h_a5_bk4-k.js',
  '/_next/static/chunks/31ckoa75c6sqj.css',
  '/_next/static/chunks/31dfosxhdx6lp.js',
  '/_next/static/chunks/32x3ke7eydsia.js',
  '/_next/static/chunks/33tqj3xt6b8by.js',
  '/_next/static/chunks/366t4kiejqku5.js',
  '/_next/static/chunks/398sz4pxj1h8o.js',
  '/_next/static/chunks/39g7sitcn9t_o.js',
  '/_next/static/chunks/39sark_im95rm.js',
  '/_next/static/chunks/3as4n4g--9_ol.js',
  '/_next/static/chunks/3gltegcggd5cq.js',
  '/_next/static/chunks/3l3e2or_h8vw4.js',
  '/_next/static/chunks/3lb-834sb-3l0.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3pv206x87dys2.js',
  '/_next/static/chunks/3r_ac6c83c776.js',
  '/_next/static/chunks/3s_q7r0o1o3tu.js',
  '/_next/static/chunks/3ttzh9bsto-0f.js',
  '/_next/static/chunks/3v5gnyboa3p44.js',
  '/_next/static/chunks/3vkfaduqh_gqe.js',
  '/_next/static/chunks/3wkrnyn5exywc.js',
  '/_next/static/chunks/3wzj4yle906o8.js',
  '/_next/static/chunks/3wzlwthqi-7uo.js',
  '/_next/static/chunks/3ypap95i6yats.js',
  '/_next/static/chunks/3zfbwuwh7yu3h.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/44s10_47w7l83.js',
  '/_next/static/chunks/turbopack-1q7kuydjn3iu7.js',
  '/_next/static/cpQTdTv63uEeTUOT89220/_buildManifest.js',
  '/_next/static/cpQTdTv63uEeTUOT89220/_clientMiddlewareManifest.js',
  '/_next/static/cpQTdTv63uEeTUOT89220/_ssgManifest.js',
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

  // Les navigations de page (HTML) utilisent Network-First
  // pour toujours servir la version la plus fraîche quand le réseau est disponible
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/offline').then((res) => {
            return res || new Response('<html><body>Vous êtes hors ligne</body></html>', {
              status: 200,
              headers: { 'Content-Type': 'text/html;charset=utf-8' }
            });
          });
        });
      })
    );
    return;
  }

  // Les assets statiques (JS, CSS, images) restent en Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      }).catch(() => {
        // Pas de fallback pour les assets non cachés
      });
    })
  );
});
