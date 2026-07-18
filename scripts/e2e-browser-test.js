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
      return regs.length > 0 && regs[0].active;
    }, { timeout: 10000 });
    
    const swInfo = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      const controller = navigator.serviceWorker.controller;
      return {
        scope: regs[0]?.scope,
        state: regs[0]?.active?.state,
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
    await page.goto(`${URL}/dev-diagnostic`, { waitUntil: 'networkidle0' });
    await page.setOfflineMode(true);
    
    await page.goto(`${URL}/dev-diagnostic`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('connecté avec succès'), { timeout: 5000 }).catch(() => {});
    let text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('Dexie.js (IndexedDB) connecté avec succès')) {
      console.log('URL de la page rendue:', await page.url());
      console.log('Texte rendu (début):', text.substring(0, 150));
      throw new Error('Le rendu de /dev-diagnostic a échoué hors ligne');
    }
    console.log('✅ Scénario A Réussi: /dev-diagnostic s\'affiche hors ligne après visite.');

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
    
    // Navigation directe vers /dev-diagnostic
    await page2.goto(`${URL}/dev-diagnostic`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    
    // Vérification du rendu
    await page2.waitForFunction(() => document.body.innerText.includes('connecté avec succès'), { timeout: 5000 }).catch(() => {});
    const text2 = await page2.evaluate(() => document.body.innerText);
    if (!text2.includes('Dexie.js (IndexedDB) connecté avec succès')) {
      console.log('Texte rendu:', text2.substring(0, 100) + '...');
      throw new Error('Le rendu de /dev-diagnostic a échoué hors ligne (Scénario B)');
    }
    console.log('✅ Scénario B Réussi: /dev-diagnostic est accessible hors ligne SANS visite préalable.');

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
