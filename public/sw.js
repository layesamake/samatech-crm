const CACHE_NAME = 'samtech-crm-cache-v1-1c5a3296';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/chunks/0-7h4boq0luvn.js',
  '/_next/static/chunks/00b2b24u_zuma.js',
  '/_next/static/chunks/00t2fx8_tapv3.js',
  '/_next/static/chunks/00wdic6zuunv_.js',
  '/_next/static/chunks/042gua51ep6cj.js',
  '/_next/static/chunks/07lyh26ujj2d_.js',
  '/_next/static/chunks/0909h8a2veeos.js',
  '/_next/static/chunks/09ipnc5rdf10c.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0d07fe6wn45kj.js',
  '/_next/static/chunks/0eruw_mf-cny5.js',
  '/_next/static/chunks/0fet5xmvv49ez.js',
  '/_next/static/chunks/0gum_mv_3h3dz.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0ixxrpn_dhprm.js',
  '/_next/static/chunks/0j_tkkifd0-r4.js',
  '/_next/static/chunks/0kdugm343i-91.js',
  '/_next/static/chunks/0lk4z6yjjkzs5.js',
  '/_next/static/chunks/0paxexg6-m0de.js',
  '/_next/static/chunks/0y6d_owomgnwd.js',
  '/_next/static/chunks/0yra_bccm3b72.js',
  '/_next/static/chunks/1-16bebbbg_gw.js',
  '/_next/static/chunks/117u2l45cfgtf.js',
  '/_next/static/chunks/11y1gtnaw-2dk.js',
  '/_next/static/chunks/13tq0i4lzah17.js',
  '/_next/static/chunks/14uwk4pgau-oo.js',
  '/_next/static/chunks/17uhz2cguutdx.js',
  '/_next/static/chunks/194invtmstq95.js',
  '/_next/static/chunks/19_onhx6zf4gq.js',
  '/_next/static/chunks/1a2b1d0n_kldw.js',
  '/_next/static/chunks/1ayww2ezk2f1c.js',
  '/_next/static/chunks/1h8ru0t50cy5y.js',
  '/_next/static/chunks/1hbv5trf82uir.js',
  '/_next/static/chunks/1jn21m2cn2hqg.js',
  '/_next/static/chunks/1pb4y4lqcwg9y.js',
  '/_next/static/chunks/1pecrl01kzb8t.css',
  '/_next/static/chunks/1qvf0ey93qwsu.js',
  '/_next/static/chunks/1s-cc48q9xdu6.js',
  '/_next/static/chunks/1t6xrvzejlexm.js',
  '/_next/static/chunks/1_zmgipypuk59.js',
  '/_next/static/chunks/20zlsr4_7k5qh.js',
  '/_next/static/chunks/25586vw79m4hr.js',
  '/_next/static/chunks/298piwwqjfxmp.js',
  '/_next/static/chunks/2e_ptlihxpphq.js',
  '/_next/static/chunks/2fp2p5uyjv4ba.js',
  '/_next/static/chunks/2iixzk86z16n6.js',
  '/_next/static/chunks/2iw1-dh9surjw.js',
  '/_next/static/chunks/2kq11fx1z2hvg.js',
  '/_next/static/chunks/2nj_xyn5fwk3r.js',
  '/_next/static/chunks/2nq4nowisvfur.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2q48o9ewxm55p.js',
  '/_next/static/chunks/2qfgrh4dgk6wq.js',
  '/_next/static/chunks/2ubw3hjf0qxhj.js',
  '/_next/static/chunks/2ygq8ai_b4q25.js',
  '/_next/static/chunks/2_rfqad9lfjy7.js',
  '/_next/static/chunks/32104x4bbfpgy.js',
  '/_next/static/chunks/32n-wi8i1iia8.js',
  '/_next/static/chunks/33tixvb83ex76.js',
  '/_next/static/chunks/36nlveqctv69_.js',
  '/_next/static/chunks/36zw3ze1z2-7l.js',
  '/_next/static/chunks/381doy82u94tj.js',
  '/_next/static/chunks/381ncn4-hzok5.js',
  '/_next/static/chunks/39sark_im95rm.js',
  '/_next/static/chunks/3c-lko4uj2wne.js',
  '/_next/static/chunks/3gyws8jz1fe4n.js',
  '/_next/static/chunks/3hw8_5mh4jyfs.js',
  '/_next/static/chunks/3kfema9xkcsca.js',
  '/_next/static/chunks/3kgj-hot688q6.js',
  '/_next/static/chunks/3lkzwbj02sl8k.js',
  '/_next/static/chunks/3ma-npecxaf12.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3pz7x0jd-ap-f.js',
  '/_next/static/chunks/3qsjf9cm97lbc.js',
  '/_next/static/chunks/3r2bbraymkci7.js',
  '/_next/static/chunks/3wkrnyn5exywc.js',
  '/_next/static/chunks/3wzj4yle906o8.js',
  '/_next/static/chunks/3wzlwthqi-7uo.js',
  '/_next/static/chunks/3xc9b5v77k31y.js',
  '/_next/static/chunks/3ypap95i6yats.js',
  '/_next/static/chunks/3zfbwuwh7yu3h.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/4362a803sc_xt.js',
  '/_next/static/chunks/43epwococu8b4.js',
  '/_next/static/chunks/43fdxvkghgt3u.js',
  '/_next/static/chunks/44pg3x2veghlp.js',
  '/_next/static/chunks/452sacj92xfo8.js',
  '/_next/static/chunks/turbopack-3snus3mpjpivz.js',
  '/_next/static/kfw6V9jcbgOGyYEiowxO7/_buildManifest.js',
  '/_next/static/kfw6V9jcbgOGyYEiowxO7/_clientMiddlewareManifest.js',
  '/_next/static/kfw6V9jcbgOGyYEiowxO7/_ssgManifest.js',
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
