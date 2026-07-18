/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { buildVolumeDataset } = require('./v1-beta-fixtures');
const { delay, launchBrowser, root, startProductionServer, stopProductionServer } = require('./v1-beta-helpers');

const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return { runs: values.length, min: +sorted[0].toFixed(1), median: +sorted[Math.floor(sorted.length / 2)].toFixed(1), mean: +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1), max: +sorted.at(-1).toFixed(1) };
};
const stableStringify = (value) => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};
const setInput = (page, selector, value) => page.$eval(selector, (node, next) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(node, next); node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true }));
}, value);

(async () => {
  let server; let browser; let backupPath; const results = {};
  try {
    const running = await startProductionServer(Number(process.env.PERFORMANCE_PORT || 3803)); server = running.server;
    ({ browser } = await launchBrowser()); const page = (await browser.pages())[1] || await browser.newPage(); const dataset = buildVolumeDataset();

    const boot = [];
    for (let run = 0; run < 5; run += 1) { const start = performance.now(); await page.goto(running.baseUrl, { waitUntil: 'networkidle0' }); boot.push(performance.now() - start); }
    results.initialStart = stats(boot);

    const idbTimes = [];
    for (let run = 0; run < 5; run += 1) {
      idbTimes.push(await page.evaluate(async (payload) => {
        const start = performance.now(); const request = indexedDB.open('SamtechCRMDatabase');
        const database = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
        const names = Object.keys(payload); const tx = database.transaction(names, 'readwrite');
        for (const name of names) { const store = tx.objectStore(name); await new Promise((resolve, reject) => { const clear = store.clear(); clear.onsuccess = resolve; clear.onerror = () => reject(clear.error); }); if (payload[name].length) payload[name].forEach((record) => store.put(record)); }
        await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); database.close(); return performance.now() - start;
      }, dataset));
    }
    results.indexedDbAndSeed = stats(idbTimes);

    const scenarios = { dashboard: '/', prospects: '/prospects', longClientTimeline1200Items: '/clients/client-0', followUps: '/follow-ups', invoices: '/invoices', statistics: '/statistics', campaign: '/campaigns/new', backupScreen: '/settings/backup' };
    for (const [name, route] of Object.entries(scenarios)) { const times = []; for (let run = 0; run < 5; run += 1) { const start = performance.now(); await page.goto(`${running.baseUrl}${route}`, { waitUntil: 'networkidle0' }); times.push(performance.now() - start); } results[name] = stats(times); }

    const search = []; await page.goto(`${running.baseUrl}/prospects`, { waitUntil: 'networkidle0' });
    for (let run = 0; run < 5; run += 1) { const start = performance.now(); await page.type('input[aria-label^="Rechercher"]', '0999'); await page.waitForFunction(() => document.body.innerText.includes('Prospect fictif 0999')); search.push(performance.now() - start); await setInput(page, 'input[aria-label^="Rechercher"]', ''); }
    results.search = stats(search);

    const filters = [];
    for (let run = 0; run < 5; run += 1) { await page.goto(`${running.baseUrl}/prospects`, { waitUntil: 'networkidle0' }); const start = performance.now(); await page.select('select[aria-label="Filtrer par statut"]', 'CONTACTE'); await page.select('select[aria-label="Filtrer par localité"]', 'loc-1'); await page.select('select[aria-label="Filtrer par produit"]', 'prod-1'); await page.waitForFunction(() => !document.body.innerText.includes('Chargement...')); filters.push(performance.now() - start); }
    results.combinedFilters = stats(filters);

    const portableDataset = JSON.parse(JSON.stringify(dataset));
    const collections = Object.entries(portableDataset).map(([name, records]) => ({ name, version: 1, count: records.length, records }));
    const envelope = { product: 'samtech-crm', formatVersion: 1, appVersion: '1.0.0-beta.1', sourceSchemaVersion: 10, exportedAt: '2026-07-18T10:00:00.000Z', metadata: { generator: 'SAMTECH CRM', collectionCount: collections.length, recordCount: collections.reduce((sum, item) => sum + item.count, 0) }, collections };
    envelope.integrity = { algorithm: 'SHA-256', digest: createHash('sha256').update(stableStringify(envelope)).digest('hex') };
    backupPath = path.join(os.tmpdir(), `samtech-performance-${process.pid}.json`); fs.writeFileSync(backupPath, JSON.stringify(envelope), 'utf8');

    const backupExport = [];
    for (let run = 0; run < 5; run += 1) { await page.goto(`${running.baseUrl}/settings/backup`, { waitUntil: 'networkidle0' }); const start = performance.now(); await page.click('[data-testid="export-backup"]'); await page.waitForFunction(() => document.querySelector('[data-testid="backup-message"]')?.textContent.includes('Sauvegarde créée')); backupExport.push(performance.now() - start); }
    results.backupExport = stats(backupExport);

    const backupValidation = []; const restoration = [];
    for (let run = 0; run < 5; run += 1) {
      await page.goto(`${running.baseUrl}/settings/backup`, { waitUntil: 'networkidle0' }); const validationStart = performance.now(); const input = await page.$('[data-testid="backup-file"]'); await input.uploadFile(backupPath); await page.waitForSelector('[data-testid="backup-preview"]'); backupValidation.push(performance.now() - validationStart);
      await setInput(page, '[data-testid="restore-confirmation"]', 'REMPLACER MES DONNÉES'); const restoreStart = performance.now(); await page.click('[data-testid="restore-backup"]'); await page.waitForFunction(() => document.querySelector('[data-testid="backup-message"]')?.textContent.includes('Restauration terminée')); restoration.push(performance.now() - restoreStart); await delay(400);
    }
    results.backupValidation = stats(backupValidation); results.restoration = stats(restoration);

    const pdf = [];
    for (let run = 0; run < 5; run += 1) { await page.goto(`${running.baseUrl}/invoices/invoice-1`, { waitUntil: 'networkidle0' }); const start = performance.now(); await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('Télécharger PDF')).click()); await delay(50); await page.waitForFunction(() => !Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('Télécharger PDF')).disabled); pdf.push(performance.now() - start); }
    results.pdfGeneration = stats(pdf);

    const staticDir = path.join(root, '.next', 'static'); const files = [];
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : files.push({ file: path.relative(staticDir, path.join(dir, entry.name)), bytes: fs.statSync(path.join(dir, entry.name)).size }));
    walk(staticDir); results.bundle = { totalBytes: files.reduce((sum, item) => sum + item.bytes, 0), largest: files.sort((a, b) => b.bytes - a.bytes).slice(0, 8) }; results.volume = Object.fromEntries(Object.entries(dataset).map(([name, records]) => [name, records.length])); console.log(JSON.stringify(results, null, 2));
  } catch (error) { console.error(`Test performance échoué: ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; }
  finally { if (backupPath && fs.existsSync(backupPath)) fs.rmSync(backupPath, { force: true }); if (browser) await browser.close(); await stopProductionServer(server); }
})();
