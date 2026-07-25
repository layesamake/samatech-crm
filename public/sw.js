const CACHE_NAME = 'samtech-crm-cache-v1-07b42aa5';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/chunks/0-7h4boq0luvn.js',
  '/_next/static/chunks/00iwqbwcpi6os.js',
  '/_next/static/chunks/00t2fx8_tapv3.js',
  '/_next/static/chunks/00u_g7s0s0m1g.js',
  '/_next/static/chunks/00wdic6zuunv_.js',
  '/_next/static/chunks/00yrffjv3r7gp.js',
  '/_next/static/chunks/03f-rnwlj_v4n.js',
  '/_next/static/chunks/03re05d79qfgm.js',
  '/_next/static/chunks/042gua51ep6cj.js',
  '/_next/static/chunks/08rtqr0kfyuy1.js',
  '/_next/static/chunks/0bkpkat_6u07n.js',
  '/_next/static/chunks/0c3xw0i_g2xgz.js',
  '/_next/static/chunks/0cz1d0mv5g_q7.js',
  '/_next/static/chunks/0d07fe6wn45kj.js',
  '/_next/static/chunks/0fet5xmvv49ez.js',
  '/_next/static/chunks/0gum_mv_3h3dz.js',
  '/_next/static/chunks/0gzrigsdp5bzw.js',
  '/_next/static/chunks/0h0yby89o4u05.js',
  '/_next/static/chunks/0htdtxlb4qd4_.js',
  '/_next/static/chunks/0ixxrpn_dhprm.js',
  '/_next/static/chunks/0kdugm343i-91.js',
  '/_next/static/chunks/0paxexg6-m0de.js',
  '/_next/static/chunks/0ph22yi94_sgz.js',
  '/_next/static/chunks/0t6-ey22rvmjo.js',
  '/_next/static/chunks/0t88yeq78hn8z.js',
  '/_next/static/chunks/0w69n2_anx9tg.js',
  '/_next/static/chunks/0xr-v9qy1rh1w.js',
  '/_next/static/chunks/0xsmbvl2r12ap.js',
  '/_next/static/chunks/0yra_bccm3b72.js',
  '/_next/static/chunks/0zgbj996y-qwe.js',
  '/_next/static/chunks/1091www6i2ixe.js',
  '/_next/static/chunks/117u2l45cfgtf.js',
  '/_next/static/chunks/13tq0i4lzah17.js',
  '/_next/static/chunks/15sdcsbue1s92.js',
  '/_next/static/chunks/17uhz2cguutdx.js',
  '/_next/static/chunks/1a90uh3n3vuv5.js',
  '/_next/static/chunks/1ad2u1_h_yra9.js',
  '/_next/static/chunks/1dnh1c2288b6-.js',
  '/_next/static/chunks/1i6eqt0betypv.js',
  '/_next/static/chunks/1ikldob12ctj4.js',
  '/_next/static/chunks/1ngxzhn290r2k.js',
  '/_next/static/chunks/1qvf0ey93qwsu.js',
  '/_next/static/chunks/1r6okgadid947.js',
  '/_next/static/chunks/1rq-6k7z2izdd.js',
  '/_next/static/chunks/1s-cc48q9xdu6.js',
  '/_next/static/chunks/1v6bn0jcoh9un.js',
  '/_next/static/chunks/1yy19wbzzh7ul.js',
  '/_next/static/chunks/1_yy_6x1n5g13.js',
  '/_next/static/chunks/1_zmgipypuk59.js',
  '/_next/static/chunks/2-caq7sdqm6a_.js',
  '/_next/static/chunks/215lw56q435tr.js',
  '/_next/static/chunks/22ntjad0zfetw.js',
  '/_next/static/chunks/25-b2ictd1uek.js',
  '/_next/static/chunks/255_2yl127bxy.js',
  '/_next/static/chunks/27-tu-qm77yk0.js',
  '/_next/static/chunks/29e1x_gzh-bc2.js',
  '/_next/static/chunks/2asuoj5xij55j.js',
  '/_next/static/chunks/2dcybu2ngu0jl.js',
  '/_next/static/chunks/2iixzk86z16n6.js',
  '/_next/static/chunks/2k8sh45obiugg.js',
  '/_next/static/chunks/2kizw3k2qsxng.js',
  '/_next/static/chunks/2m-kuirvuu2r1.js',
  '/_next/static/chunks/2nj_xyn5fwk3r.js',
  '/_next/static/chunks/2nq4nowisvfur.js',
  '/_next/static/chunks/2q1t8rstghhqw.js',
  '/_next/static/chunks/2rth1ic64w3bq.js',
  '/_next/static/chunks/2yens0y0ocb8i.js',
  '/_next/static/chunks/2_rfqad9lfjy7.js',
  '/_next/static/chunks/31_qx8hg0grix.css',
  '/_next/static/chunks/34vpuytocdh1y.js',
  '/_next/static/chunks/35pxwtx1uhaas.js',
  '/_next/static/chunks/381doy82u94tj.js',
  '/_next/static/chunks/381ncn4-hzok5.js',
  '/_next/static/chunks/38pndk7uhgx3c.js',
  '/_next/static/chunks/39sark_im95rm.js',
  '/_next/static/chunks/3aydd-iz830l1.js',
  '/_next/static/chunks/3c-lko4uj2wne.js',
  '/_next/static/chunks/3flsu8srnz3mb.js',
  '/_next/static/chunks/3mzsi44ljelka.js',
  '/_next/static/chunks/3oajf4uf-ggl6.js',
  '/_next/static/chunks/3u_612go81w0f.js',
  '/_next/static/chunks/3wzlwthqi-7uo.js',
  '/_next/static/chunks/3zfbwuwh7yu3h.js',
  '/_next/static/chunks/3_ey_1ux9aw3q.js',
  '/_next/static/chunks/42rv3h8hy89h1.js',
  '/_next/static/chunks/43epwococu8b4.js',
  '/_next/static/chunks/turbopack-3snus3mpjpivz.js',
  '/_next/static/LnkuOWS4m_HlpbCHv3dC6/_buildManifest.js',
  '/_next/static/LnkuOWS4m_HlpbCHv3dC6/_clientMiddlewareManifest.js',
  '/_next/static/LnkuOWS4m_HlpbCHv3dC6/_ssgManifest.js',
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
