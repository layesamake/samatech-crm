/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer-core');

const URL = 'http://localhost:3000';

async function runTest() {
  console.log('🚀 Lancement du test PWA E2E avec Puppeteer (Edge)...');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // =========== 1. Vérification du manifeste ===========
    console.log('--- 1. Vérification du manifeste ---');
    await page.goto(URL, { waitUntil: 'networkidle0' });
    
    const manifestHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.href : null;
    });
    
    if (!manifestHref) throw new Error('Manifest link non trouvé');
    console.log(`✅ Manifest link trouvé: ${manifestHref}`);
    
    const manifestRes = await page.goto(manifestHref);
    const manifest = await manifestRes.json();
    
    if (manifest.name !== 'SAMTECH CRM' || manifest.start_url !== '/' || manifest.scope !== '/' || manifest.display !== 'standalone') {
      throw new Error('Propriétés du manifeste invalides');
    }
    console.log('✅ Propriétés de base du manifeste OK');

    // =========== 2. Vérification du Service Worker ===========
    console.log('--- 2. Vérification du Service Worker ---');
    await page.goto(URL, { waitUntil: 'networkidle0' });
    
    // Attendre que le SW s'installe
    await page.waitForFunction(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length > 0) {
        console.log("SW regs:", regs.map(r => ({ active: !!r.active, waiting: !!r.waiting, installing: !!r.installing })));
      }
      return regs.length > 0 && regs[0].active;
    }, { timeout: 10000 });
    
    const swInfo = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      const controller = navigator.serviceWorker.controller;
      return {
        scope: regs[0]?.scope,
        state: regs[0]?.active?.state || regs[0]?.waiting?.state || regs[0]?.installing?.state,
        hasController: !!controller
      };
    });
    
    if (!swInfo.scope || swInfo.state !== 'activated') throw new Error('SW non activé ou scope invalide');
    console.log(`✅ SW Activé. Scope: ${swInfo.scope}`);
    console.log(`✅ Controller actif: ${swInfo.hasController ? 'Oui' : 'Non (sera actif au prochain chargement)'}`);

    // =========== 3. Inspection du Cache Storage ===========
    console.log('--- 3. Inspection du Cache Storage ---');
    const cachesList = await page.evaluate(async () => {
      const keys = await caches.keys();
      const cacheName = keys[0];
      const cache = await caches.open(cacheName);
      const reqs = await cache.keys();
      return {
        cacheName,
        urls: reqs.map(req => req.url)
      };
    });
    
    console.log(`✅ Cache détecté: ${cachesList.cacheName}`);
    const nextChunks = cachesList.urls.filter(url => url.includes('/_next/static/'));
    const htmlPages = cachesList.urls.filter(url => !url.includes('/_next/') && !url.includes('.png') && !url.includes('.svg'));
    console.log(`✅ Pages et assets racines en cache:`, htmlPages);
    if (nextChunks.length === 0) throw new Error('Aucun chunk Next.js mis en cache !');

    // =========== 4. Test Hors Ligne (Scénario A) ===========
    console.log('--- 4. Test Hors Ligne (Scénario A) ---');
    await page.goto(URL, { waitUntil: 'networkidle0' });
    await page.setOfflineMode(true);
    
    await page.goto(URL, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('SAMTECH CRM'), { timeout: 5000 }).catch(() => {});
    let text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('SAMTECH CRM')) {
      throw new Error('Le rendu de / a échoué hors ligne');
    }
    console.log('✅ Scénario A Réussi: / s\'affiche hors ligne après visite.');

    // =========== 5. Test Hors Ligne (Scénario B) ===========
    console.log('--- 5. Test Hors Ligne (Scénario B) ---');
    // On simule un utilisateur propre (nouveau contexte)
    const context2 = await browser.createBrowserContext();
    const page2 = await context2.newPage();
    
    // Visite uniquement de /
    await page2.goto(URL, { waitUntil: 'networkidle0' });
    
    // Attente du SW
    await page2.waitForFunction(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0 && regs[0].active;
    }, { timeout: 10000 });
    
    // Passage hors ligne
    await page2.setOfflineMode(true);
    
    // Navigation directe vers une route non mise en cache (ex: /offline via un cache non trouvé)
    // On désactive le rechargement forcé
    await page2.goto(`${URL}/offline-test-route`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    
    // Vérification du rendu (page hors ligne de secours)
    await page2.waitForFunction(() => document.body.innerText.includes('Vous êtes hors ligne'), { timeout: 5000 }).catch(() => {});
    const text2 = await page2.evaluate(() => document.body.innerText);
    if (!text2.includes('Vous êtes hors ligne')) {
      throw new Error('Le fallback offline a échoué hors ligne (Scénario B)');
    }
    console.log('✅ Scénario B Réussi: Le fallback hors ligne fonctionne.');

    await context2.close();

    console.log('\n✅✅✅ TOUS LES TESTS NAVIGATEUR SONT RÉUSSIS ✅✅✅\n');

  } catch (error) {
    console.error('\n❌❌❌ ERREUR LORS DU TEST NAVIGATEUR ❌❌❌');
    console.error(error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
