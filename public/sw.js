const CACHE_NAME = 'samtech-crm-cache-v1-bea61878';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/chunks/0-7h4boq0luvn.js',
  '/_next/static/chunks/00t2fx8_tapv3.js',
  '/_next/static/chunks/00wdic6zuunv_.js',
  '/_next/static/chunks/02duncs1u2m-6.js',
  '/_next/static/chunks/042gua51ep6cj.js',
  '/_next/static/chunks/06uro5nl_1plb.js',
  '/_next/static/chunks/07d5kosrcttdq.js',
  '/_next/static/chunks/07vhxt-trmmer.js',
  '/_next/static/chunks/09vmo597vrb3w.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0d07fe6wn45kj.js',
  '/_next/static/chunks/0ehw2bvkddnlb.js',
  '/_next/static/chunks/0fet5xmvv49ez.js',
  '/_next/static/chunks/0gum_mv_3h3dz.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0ixxrpn_dhprm.js',
  '/_next/static/chunks/0j-lttthwlqyx.js',
  '/_next/static/chunks/0kdugm343i-91.js',
  '/_next/static/chunks/0paxexg6-m0de.js',
  '/_next/static/chunks/0xb92ggwap1xn.js',
  '/_next/static/chunks/0yra_bccm3b72.js',
  '/_next/static/chunks/1-16bebbbg_gw.js',
  '/_next/static/chunks/1091www6i2ixe.js',
  '/_next/static/chunks/117u2l45cfgtf.js',
  '/_next/static/chunks/11y1gtnaw-2dk.js',
  '/_next/static/chunks/12rln16zbts8j.js',
  '/_next/static/chunks/13tq0i4lzah17.js',
  '/_next/static/chunks/155nwfg6c_1ho.js',
  '/_next/static/chunks/17uhz2cguutdx.js',
  '/_next/static/chunks/194invtmstq95.js',
  '/_next/static/chunks/19_onhx6zf4gq.js',
  '/_next/static/chunks/1i__k6am-gkyo.js',
  '/_next/static/chunks/1msak0nrwiq73.css',
  '/_next/static/chunks/1qvf0ey93qwsu.js',
  '/_next/static/chunks/1s-cc48q9xdu6.js',
  '/_next/static/chunks/1t6xrvzejlexm.js',
  '/_next/static/chunks/1t_e4asjo3k64.js',
  '/_next/static/chunks/1xax20kw013ad.js',
  '/_next/static/chunks/1ymwoph2fw758.js',
  '/_next/static/chunks/1_zmgipypuk59.js',
  '/_next/static/chunks/2-s4ktyqxqv63.js',
  '/_next/static/chunks/2035pkfz5al3i.js',
  '/_next/static/chunks/25586vw79m4hr.js',
  '/_next/static/chunks/262stlol4r_gq.js',
  '/_next/static/chunks/298piwwqjfxmp.js',
  '/_next/static/chunks/2b1p4ubgd8lk-.js',
  '/_next/static/chunks/2cvdfnb9mzy66.js',
  '/_next/static/chunks/2fp2p5uyjv4ba.js',
  '/_next/static/chunks/2fqx05bjhjadc.js',
  '/_next/static/chunks/2gh02dl3dc5zy.js',
  '/_next/static/chunks/2iixzk86z16n6.js',
  '/_next/static/chunks/2nj_xyn5fwk3r.js',
  '/_next/static/chunks/2nq4nowisvfur.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2qfgrh4dgk6wq.js',
  '/_next/static/chunks/2uu35zp84b6tx.js',
  '/_next/static/chunks/2w3zykw2mbczg.js',
  '/_next/static/chunks/2wqqv0_xuyp74.js',
  '/_next/static/chunks/2y0ksr6bzlxxg.js',
  '/_next/static/chunks/2_rfqad9lfjy7.js',
  '/_next/static/chunks/2_tyajau75hu0.js',
  '/_next/static/chunks/32n-wi8i1iia8.js',
  '/_next/static/chunks/36zw3ze1z2-7l.js',
  '/_next/static/chunks/381doy82u94tj.js',
  '/_next/static/chunks/381ncn4-hzok5.js',
  '/_next/static/chunks/38i5gclfaidsx.js',
  '/_next/static/chunks/39sark_im95rm.js',
  '/_next/static/chunks/3c-lko4uj2wne.js',
  '/_next/static/chunks/3dc9lai_zbpw9.js',
  '/_next/static/chunks/3es_je7kh163i.js',
  '/_next/static/chunks/3gv3iz5v_b-e3.js',
  '/_next/static/chunks/3gyws8jz1fe4n.js',
  '/_next/static/chunks/3l1bec-c7ee6o.js',
  '/_next/static/chunks/3lkzwbj02sl8k.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3pz7x0jd-ap-f.js',
  '/_next/static/chunks/3u4xxjrz_ngse.js',
  '/_next/static/chunks/3wzj4yle906o8.js',
  '/_next/static/chunks/3wzlwthqi-7uo.js',
  '/_next/static/chunks/3ypap95i6yats.js',
  '/_next/static/chunks/3yx8hdu-k0dm2.js',
  '/_next/static/chunks/3zfbwuwh7yu3h.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/42trmz6qg8nu6.js',
  '/_next/static/chunks/43204k8821zil.js',
  '/_next/static/chunks/434cnqvrdh4kq.js',
  '/_next/static/chunks/43epwococu8b4.js',
  '/_next/static/chunks/43fdxvkghgt3u.js',
  '/_next/static/chunks/turbopack-3snus3mpjpivz.js',
  '/_next/static/media/favicon.2vob68tjqpejf.ico',
  '/_next/static/vWQINldDYaliKBeUk0B7p/_buildManifest.js',
  '/_next/static/vWQINldDYaliKBeUk0B7p/_clientMiddlewareManifest.js',
  '/_next/static/vWQINldDYaliKBeUk0B7p/_ssgManifest.js'
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
