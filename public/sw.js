const CACHE_NAME = 'samtech-crm-cache-v1-76b6683d';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/-62kIzzu_O08aS0xHmudy/_buildManifest.js',
  '/_next/static/-62kIzzu_O08aS0xHmudy/_clientMiddlewareManifest.js',
  '/_next/static/-62kIzzu_O08aS0xHmudy/_ssgManifest.js',
  '/_next/static/chunks/0-7h4boq0luvn.js',
  '/_next/static/chunks/00t2fx8_tapv3.js',
  '/_next/static/chunks/00wdic6zuunv_.js',
  '/_next/static/chunks/042gua51ep6cj.js',
  '/_next/static/chunks/051yuskry2njk.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0e14t8730xrct.js',
  '/_next/static/chunks/0fkbm3bxmgm6m.js',
  '/_next/static/chunks/0gum_mv_3h3dz.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0hnrt6-vnba4k.js',
  '/_next/static/chunks/0ixxrpn_dhprm.js',
  '/_next/static/chunks/0njf5vs8aeqb6.js',
  '/_next/static/chunks/0ob-xdsh3ntv4.js',
  '/_next/static/chunks/0paxexg6-m0de.js',
  '/_next/static/chunks/0rkv3xvp1fq11.js',
  '/_next/static/chunks/0sm6knrhh_n2b.js',
  '/_next/static/chunks/0yra_bccm3b72.js',
  '/_next/static/chunks/0_kbdqru51jn9.css',
  '/_next/static/chunks/1-16bebbbg_gw.js',
  '/_next/static/chunks/117u2l45cfgtf.js',
  '/_next/static/chunks/11y1gtnaw-2dk.js',
  '/_next/static/chunks/13tq0i4lzah17.js',
  '/_next/static/chunks/16hpg91tgkl68.js',
  '/_next/static/chunks/17uhz2cguutdx.js',
  '/_next/static/chunks/1a0ox3fjf4skx.js',
  '/_next/static/chunks/1b1kp44-5n1ee.js',
  '/_next/static/chunks/1bn-r8kyxpq9g.js',
  '/_next/static/chunks/1ck68ld_lqxs-.js',
  '/_next/static/chunks/1ecz9b1cp192p.js',
  '/_next/static/chunks/1ff8nsbtplkfk.js',
  '/_next/static/chunks/1hbv5trf82uir.js',
  '/_next/static/chunks/1i9st35ffwli8.js',
  '/_next/static/chunks/1iw01rhkvymnk.js',
  '/_next/static/chunks/1jk_5klufiard.js',
  '/_next/static/chunks/1jn21m2cn2hqg.js',
  '/_next/static/chunks/1m-4mxcmvgbnq.js',
  '/_next/static/chunks/1qcq1_hyzxy5_.js',
  '/_next/static/chunks/1qvf0ey93qwsu.js',
  '/_next/static/chunks/1s-cc48q9xdu6.js',
  '/_next/static/chunks/1t6xrvzejlexm.js',
  '/_next/static/chunks/1tiggfm28d2k4.js',
  '/_next/static/chunks/1ucue_7ltjmb-.js',
  '/_next/static/chunks/1zfzoweha3b2g.js',
  '/_next/static/chunks/1_zmgipypuk59.js',
  '/_next/static/chunks/2-ojxncb8j5pj.js',
  '/_next/static/chunks/24hcb546f668s.js',
  '/_next/static/chunks/25586vw79m4hr.js',
  '/_next/static/chunks/2909w3wku2gb_.js',
  '/_next/static/chunks/298piwwqjfxmp.js',
  '/_next/static/chunks/2b2y93yd5s1ds.js',
  '/_next/static/chunks/2i87h3_nvwhq7.js',
  '/_next/static/chunks/2iixzk86z16n6.js',
  '/_next/static/chunks/2kq11fx1z2hvg.js',
  '/_next/static/chunks/2nj_xyn5fwk3r.js',
  '/_next/static/chunks/2osusjntyjiam.js',
  '/_next/static/chunks/2pc8js55eftwa.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2q48o9ewxm55p.js',
  '/_next/static/chunks/2qfgrh4dgk6wq.js',
  '/_next/static/chunks/2ssvqv1a00xli.js',
  '/_next/static/chunks/2ubw3hjf0qxhj.js',
  '/_next/static/chunks/2ud9gu_zgl17r.js',
  '/_next/static/chunks/2y0fy24g-29uz.js',
  '/_next/static/chunks/33cop1v29cci-.js',
  '/_next/static/chunks/381doy82u94tj.js',
  '/_next/static/chunks/381ncn4-hzok5.js',
  '/_next/static/chunks/38j0xmdfnr4ng.js',
  '/_next/static/chunks/39sark_im95rm.js',
  '/_next/static/chunks/3ej3phf1n1e0h.js',
  '/_next/static/chunks/3gltegcggd5cq.js',
  '/_next/static/chunks/3gyws8jz1fe4n.js',
  '/_next/static/chunks/3kgj-hot688q6.js',
  '/_next/static/chunks/3m4rjsfiiomdm.js',
  '/_next/static/chunks/3mlpc32lf4va3.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3wkrnyn5exywc.js',
  '/_next/static/chunks/3wzj4yle906o8.js',
  '/_next/static/chunks/3wzlwthqi-7uo.js',
  '/_next/static/chunks/3ypap95i6yats.js',
  '/_next/static/chunks/3zfbwuwh7yu3h.js',
  '/_next/static/chunks/3zrcngvlvrrzi.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/42u_ntv8uoei9.js',
  '/_next/static/chunks/43epwococu8b4.js',
  '/_next/static/chunks/43q72lp0k6oy5.js',
  '/_next/static/chunks/44pg3x2veghlp.js',
  '/_next/static/chunks/turbopack-3snus3mpjpivz.js',
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
