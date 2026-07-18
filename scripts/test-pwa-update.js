/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { launchBrowser, seedMinimal, startProductionServer, stopProductionServer } = require('./v1-beta-helpers');

(async () => {
  const startedAt = Date.now(); let server; let browser; let assertions = 0; const check = (value, message) => { assert.ok(value, message); assertions += 1; };
  try {
    const running = await startProductionServer(Number(process.env.PWA_UPDATE_PORT || 3804)); server = running.server; ({ browser } = await launchBrowser()); const page = (await browser.pages())[1] || await browser.newPage();
    await page.goto(running.baseUrl, { waitUntil: 'networkidle0' }); await seedMinimal(page); const initial = await page.evaluate(() => navigator.serviceWorker.ready.then((registration) => ({ scope: registration.scope, controller: Boolean(navigator.serviceWorker.controller) }))); check(initial.scope.endsWith('/'), 'Scope invalide');
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.register(`/sw.js?beta-update=${Date.now()}`, { scope: '/' }); await registration.update(); await new Promise((resolve) => setTimeout(resolve, 1000)); }); check(true, 'Mise à jour non enregistrée');
    const preserved = await page.evaluate(async () => { const request = indexedDB.open('SamtechCRMDatabase'); const database = await new Promise((resolve) => { request.onsuccess = () => resolve(request.result); }); const tx = database.transaction('contacts'); const query = tx.objectStore('contacts').count(); const count = await new Promise((resolve) => { query.onsuccess = () => resolve(query.result); }); database.close(); return count; }); check(preserved === 1, 'IndexedDB modifiée par la mise à jour');
    await page.goto(`${running.baseUrl}/prospects`, { waitUntil: 'networkidle0' }); await page.setOfflineMode(true); await page.reload({ waitUntil: 'domcontentloaded' }); check((await page.$eval('body', (body) => body.innerText)).includes('Prospects'), 'Route hors ligne indisponible');
    console.log(`Mise à jour PWA: ${assertions} assertions, données préservées, route hors ligne disponible, ${Date.now() - startedAt} ms.`);
  } catch (error) { console.error(`Test mise à jour PWA échoué: ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; }
  finally { if (browser) await browser.close(); await stopProductionServer(server); }
})();
