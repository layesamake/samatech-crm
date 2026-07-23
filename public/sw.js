const CACHE_NAME = 'samtech-crm-cache-v1-fa6075c3';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/chunks/0-00gv40ti1h3.js',
  '/_next/static/chunks/0-7h4boq0luvn.js',
  '/_next/static/chunks/00t2fx8_tapv3.js',
  '/_next/static/chunks/042gua51ep6cj.js',
  '/_next/static/chunks/051yuskry2njk.js',
  '/_next/static/chunks/05e0jx8u7yez5.js',
  '/_next/static/chunks/0a0kpn9htbm31.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0e14t8730xrct.js',
  '/_next/static/chunks/0gj24n9nfd1zj.js',
  '/_next/static/chunks/0gum_mv_3h3dz.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0iwkc6_q_5nii.js',
  '/_next/static/chunks/0njf5vs8aeqb6.js',
  '/_next/static/chunks/0ob-xdsh3ntv4.js',
  '/_next/static/chunks/0paxexg6-m0de.js',
  '/_next/static/chunks/0rkv3xvp1fq11.js',
  '/_next/static/chunks/0sm6knrhh_n2b.js',
  '/_next/static/chunks/0tlmk4m0w32s1.js',
  '/_next/static/chunks/0vkdber98zl68.js',
  '/_next/static/chunks/0zow-xg3fhlfw.js',
  '/_next/static/chunks/13tq0i4lzah17.js',
  '/_next/static/chunks/14byi0xy97vjd.js',
  '/_next/static/chunks/16hpg91tgkl68.js',
  '/_next/static/chunks/17uhz2cguutdx.js',
  '/_next/static/chunks/1ck68ld_lqxs-.js',
  '/_next/static/chunks/1dymhf-n58m6x.js',
  '/_next/static/chunks/1ecz9b1cp192p.js',
  '/_next/static/chunks/1ff8nsbtplkfk.js',
  '/_next/static/chunks/1m-4mxcmvgbnq.js',
  '/_next/static/chunks/1qcq1_hyzxy5_.js',
  '/_next/static/chunks/1s-cc48q9xdu6.js',
  '/_next/static/chunks/1tiggfm28d2k4.js',
  '/_next/static/chunks/1tlmo9p19uf5h.js',
  '/_next/static/chunks/1ucue_7ltjmb-.js',
  '/_next/static/chunks/1w_w4yo5ii4b1.js',
  '/_next/static/chunks/1x7j5dha91xgy.js',
  '/_next/static/chunks/1zfzoweha3b2g.js',
  '/_next/static/chunks/1_zmgipypuk59.js',
  '/_next/static/chunks/2-ojxncb8j5pj.js',
  '/_next/static/chunks/2-svaddi9q08g.js',
  '/_next/static/chunks/24hcb546f668s.js',
  '/_next/static/chunks/25wgy15uopx2r.js',
  '/_next/static/chunks/27jh65wp39s8i.js',
  '/_next/static/chunks/298piwwqjfxmp.js',
  '/_next/static/chunks/2c6hpp98efkh9.js',
  '/_next/static/chunks/2evcwq9t8k845.js',
  '/_next/static/chunks/2iixzk86z16n6.js',
  '/_next/static/chunks/2m06z3ipx71v9.css',
  '/_next/static/chunks/2nj_xyn5fwk3r.js',
  '/_next/static/chunks/2nx5lowf4y3m9.js',
  '/_next/static/chunks/2osusjntyjiam.js',
  '/_next/static/chunks/2pqfrckzk88bi.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2qfgrh4dgk6wq.js',
  '/_next/static/chunks/2qks67_ta3u70.js',
  '/_next/static/chunks/2sb1_numqkay1.js',
  '/_next/static/chunks/2ssvqv1a00xli.js',
  '/_next/static/chunks/2ud9gu_zgl17r.js',
  '/_next/static/chunks/2uk65dh9zq8p_.js',
  '/_next/static/chunks/2xme89krmlsj6.js',
  '/_next/static/chunks/2y0fy24g-29uz.js',
  '/_next/static/chunks/31o-tif4pgp3a.js',
  '/_next/static/chunks/35g3_4kh07evn.js',
  '/_next/static/chunks/381doy82u94tj.js',
  '/_next/static/chunks/398sz4pxj1h8o.js',
  '/_next/static/chunks/39g7sitcn9t_o.js',
  '/_next/static/chunks/39sark_im95rm.js',
  '/_next/static/chunks/3b27prx9syi3_.js',
  '/_next/static/chunks/3ej3phf1n1e0h.js',
  '/_next/static/chunks/3gltegcggd5cq.js',
  '/_next/static/chunks/3gr5uv_22oqbi.js',
  '/_next/static/chunks/3m4rjsfiiomdm.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3pd7ku678-mft.js',
  '/_next/static/chunks/3s_q7r0o1o3tu.js',
  '/_next/static/chunks/3wkrnyn5exywc.js',
  '/_next/static/chunks/3wzj4yle906o8.js',
  '/_next/static/chunks/3wzlwthqi-7uo.js',
  '/_next/static/chunks/3y-i6oaga3m00.js',
  '/_next/static/chunks/3ypap95i6yats.js',
  '/_next/static/chunks/3zfbwuwh7yu3h.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/turbopack-2u_z41uyvbkog.js',
  '/_next/static/cXU4SCr_uOdRVSBIVqbH5/_buildManifest.js',
  '/_next/static/cXU4SCr_uOdRVSBIVqbH5/_clientMiddlewareManifest.js',
  '/_next/static/cXU4SCr_uOdRVSBIVqbH5/_ssgManifest.js',
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
