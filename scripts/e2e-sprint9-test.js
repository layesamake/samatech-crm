/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawn } = require('node:child_process');
const puppeteer = require('puppeteer');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.SPRINT9_PORT || 3700);
const baseUrl = `http://127.0.0.1:${port}`;
let verified = 0;
const check = (condition, message) => { assert.ok(condition, message); verified += 1; };
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stable = (value) => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(stable).join(',')}]` : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;

async function waitServer(server) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Serveur arrêté (${server.exitCode})`);
    try { const response = await fetch(baseUrl); if (response.ok) return; } catch {}
    await delay(250);
  }
  throw new Error('Serveur indisponible');
}
async function bodyText(page) { return page.$eval('body', (body) => body.innerText); }
async function setInput(page, selector, value) {
  await page.$eval(selector, (node, next) => {
    const prototype = node instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, next);
    node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}
async function click(page, selector) { await page.waitForSelector(selector); await page.click(selector); }
async function goto(page, state, pathname) { state.navigationUntil = Date.now() + 3000; await page.goto(`${baseUrl}${pathname}`, { waitUntil: state.offline ? 'domcontentloaded' : 'networkidle0' }); }

async function seed(page) {
  await page.evaluate(async () => {
    const request = indexedDB.open('SamtechCRMDatabase');
    const database = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const names = Array.from(database.objectStoreNames); const clear = database.transaction(names, 'readwrite'); names.forEach((name) => clear.objectStore(name).clear());
    await new Promise((resolve, reject) => { clear.oncomplete = resolve; clear.onerror = () => reject(clear.error); });
    const now = '2026-07-18T10:00:00.000Z'; const tx = database.transaction(names, 'readwrite'); const put = (table, value) => tx.objectStore(table).put(value);
    put('settings', { key: 'company.profile', value: { name: 'SENCAIILLE', phone: '+221 77 648 17 82', address: 'Quartier Mbambara Thiès', currencyCode: 'XOF', currencySymbol: 'FCFA' }, schemaVersion: 1, updatedAt: now });
    put('sequences', { key: 'invoice:2026', prefix: 'FAC-', nextValue: 2, padding: 4, updatedAt: now });
    put('locations', { id: 'loc1', name: 'Thiès', normalizedName: 'thies', level: 'CITY', createdAt: now, updatedAt: now });
    put('categories', { id: 'cat1', name: 'Services', normalizedName: 'services', createdAt: now, updatedAt: now });
    put('products', { id: 'prod1', name: 'Conseil commercial', normalizedName: 'conseil commercial', type: 'SERVICE', categoryId: 'cat1', unitPriceMinor: 100000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now });
    put('contacts', { id: 'contact1', displayName: 'Cliente Sprint 9', whatsappPhone: '+221 77 648 17 82', normalizedWhatsappPhone: '+221776481782', locationId: 'loc1', source: 'REFERRAL', createdAt: now, updatedAt: now });
    put('prospectProfiles', { id: 'prospect1', contactId: 'contact1', status: 'CONVERTI', interestLevel: 'CHAUD', firstContactDate: '2026-07-01', convertedAt: now, lastStatusChangedAt: now, createdAt: now, updatedAt: now });
    put('prospectInterests', { id: 'interest1', prospectProfileId: 'prospect1', productId: 'prod1', requestedAt: now, createdAt: now, updatedAt: now });
    put('clientProfiles', { id: 'client1', contactId: 'contact1', convertedAt: now, clientNumber: 'CLI-0001', createdAt: now, updatedAt: now });
    put('tags', { id: 'tag1', name: 'Fidèle', normalizedName: 'fidele', createdAt: now, updatedAt: now });
    put('contactTags', { id: 'ct1', contactId: 'contact1', tagId: 'tag1', createdAt: now });
    put('notes', { id: 'note1', contactId: 'contact1', content: 'Donnée commerciale Sprint 9', pinned: false, createdAt: now, updatedAt: now });
    put('timelineEvents', { id: 'event1', contactId: 'contact1', type: 'INVOICE_ISSUED', occurredAt: now, title: 'Facture émise', payloadVersion: 1, createdAt: now });
    put('followUps', { id: 'follow1', contactId: 'contact1', channel: 'WHATSAPP', dueAt: now, timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'PLANIFIEE', createdAt: now, updatedAt: now });
    put('messageTemplates', { id: 'template1', name: 'Relance', category: 'FOLLOW_UP', content: 'Bonjour', variables: [], isActive: true, createdAt: now, updatedAt: now });
    put('invoices', { id: 'invoice1', number: 'FAC-2026-0001', clientProfileId: 'client1', status: 'PARTIELLEMENT_PAYEE', issueDate: '2026-07-18', dueDate: '2026-07-25', currency: 'XOF', currencyScale: 0, companySnapshot: { displayName: 'SENCAIILLE' }, clientSnapshot: { displayName: 'Cliente Sprint 9' }, subtotalMinor: 100000, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 100000, paidTotalMinor: 30000, balanceMinor: 70000, createdAt: now, updatedAt: now });
    put('invoiceLines', { id: 'line1', invoiceId: 'invoice1', productId: 'prod1', position: 0, designationSnapshot: 'Conseil commercial', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 100000, grossMinor: 100000, discountType: 'NONE', discountValue: 0, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 100000, createdAt: now, updatedAt: now });
    put('payments', { id: 'payment1', invoiceId: 'invoice1', clientProfileId: 'client1', paymentDate: '2026-07-18', amountMinor: 30000, currency: 'XOF', currencyScale: 0, method: 'WAVE', status: 'ACTIVE', createdAt: now, updatedAt: now });
    put('campaigns', { id: 'campaign1', name: 'Relance Sprint 9', status: 'EN_COURS', audienceType: 'CLIENTS', criteria: {}, messageSnapshot: 'Bonjour', launchedAt: now, createdAt: now, updatedAt: now });
    put('campaignRecipients', { id: 'recipient1', campaignId: 'campaign1', contactId: 'contact1', normalizedPhoneSnapshot: '+221776481782', displayNameSnapshot: 'Cliente Sprint 9', resolvedMessageSnapshot: 'Bonjour', position: 0, status: 'A_TRAITER', createdAt: now, updatedAt: now });
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); database.close();
  });
}

async function idb(page, operation, table, key, value) {
  return page.evaluate(async (op, tableName, recordKey, recordValue) => {
    const request = indexedDB.open('SamtechCRMDatabase'); const database = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const tx = database.transaction(tableName, op === 'get' || op === 'count' ? 'readonly' : 'readwrite'); const store = tx.objectStore(tableName);
    let query; if (op === 'get') query = store.get(recordKey); else if (op === 'count') query = store.count(); else if (op === 'delete') query = store.delete(recordKey); else query = store.put(recordValue);
    const result = await new Promise((resolve, reject) => { query.onsuccess = () => resolve(query.result); query.onerror = () => reject(query.error); });
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); database.close(); return result;
  }, operation, table, key, value);
}

async function upload(page, filePath) {
  const input = await page.waitForSelector('[data-testid="backup-file"]'); await input.uploadFile(filePath); await page.waitForFunction(() => document.querySelector('[data-testid="backup-message"]')?.textContent?.length > 0);
}

async function restore(page, pin) {
  await setInput(page, '[data-testid="restore-confirmation"]', 'REMPLACER MES DONNÉES');
  if (pin) await setInput(page, '[data-testid="restore-pin"]', pin);
  await click(page, '[data-testid="restore-backup"]'); await delay(800); await page.waitForFunction(() => !document.body.innerText.includes('Actualisation de l’application') || document.readyState === 'complete');
}

async function scenario(page, state, counts, downloadDir) {
  await goto(page, state, '/'); check((await bodyText(page)).includes('Tableau de bord'), '1. Application non ouverte');
  check(counts.consoleErrors === 0 && counts.pageErrors === 0, '2. Erreur initiale');
  await seed(page); await goto(page, state, '/settings/backup'); check((await bodyText(page)).includes('Sauvegarde et restauration'), '3. Écran sauvegarde absent');
  await click(page, '[data-testid="export-backup"]');
  let downloaded; for (let attempt = 0; attempt < 40; attempt += 1) { downloaded = fs.readdirSync(downloadDir).find((name) => name.endsWith('.json') && !name.endsWith('.crdownload')); if (downloaded) break; await delay(250); }
  check(Boolean(downloaded), '4. Aucun téléchargement réel'); const backupPath = path.join(downloadDir, downloaded); check(fs.statSync(backupPath).size > 0, '5. Fichier téléchargé vide');
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8')); check(backup.product === 'samtech-crm' && backup.formatVersion === 1 && backup.collections.length === 20, '6. Enveloppe invalide');
  const { integrity, ...payload } = backup; const digest = createHash('sha256').update(stable(payload)).digest('hex'); check(integrity.digest === digest, '7. Intégrité invalide');
  check(!JSON.stringify(backup).includes('pinHash') && !JSON.stringify(backup).includes('securitySettings'), '8. PIN exporté');
  await idb(page, 'delete', 'contacts', 'contact1'); check(await idb(page, 'count', 'contacts') === 0, '9. Mutation de préparation absente');
  await upload(page, backupPath); check(Boolean(await page.$('[data-testid="backup-preview"]')), '10. Aperçu absent'); check((await bodyText(page)).includes('Factures') && (await bodyText(page)).includes('Paiements'), '11. Résumé incomplet');
  await restore(page); check(Boolean(await idb(page, 'get', 'contacts', 'contact1')), '12. Contact non restauré'); check((await idb(page, 'get', 'invoiceLines', 'line1')).invoiceId === 'invoice1', '13. Relations non restaurées');
  const corruptPath = path.join(downloadDir, 'corrupt.json'); const corrupt = structuredClone(backup); corrupt.appVersion = 'corrompue'; fs.writeFileSync(corruptPath, JSON.stringify(corrupt));
  await upload(page, corruptPath); check((await bodyText(page)).includes('intégrité'), '14. Corruption non refusée'); check(Boolean(await idb(page, 'get', 'contacts', 'contact1')), '15. Base modifiée après corruption');
  const futurePath = path.join(downloadDir, 'future.json'); const future = structuredClone(backup); future.formatVersion = 999; fs.writeFileSync(futurePath, JSON.stringify(future));
  await upload(page, futurePath); check((await bodyText(page)).includes('incompatible'), '16. Version future non refusée'); check(Boolean(await idb(page, 'get', 'invoices', 'invoice1')), '17. Base modifiée après version future');
  await goto(page, state, '/settings/security'); await setInput(page, '[data-testid="enable-pin"]', '2486'); await setInput(page, '[data-testid="enable-pin-confirm"]', '2486'); await click(page, '[data-testid="enable-pin-submit"]'); await page.waitForFunction(() => document.body.innerText.includes('PIN actif')); check(true, '18. Activation PIN impossible');
  await click(page, '[data-testid="lock-now"]'); check(Boolean(await page.$('[data-testid="locked-screen"]')), '19. Verrouillage manuel absent'); check(!(await bodyText(page)).includes('Cliente Sprint 9'), '20. Données visibles verrouillées');
  await setInput(page, '[data-testid="unlock-pin"]', '1111'); await click(page, '[data-testid="unlock-submit"]'); await page.waitForFunction(() => document.body.innerText.includes('PIN incorrect')); check(true, '21. Mauvais PIN non refusé'); check((await idb(page, 'get', 'securitySettings', 'local-security')).failedAttempts === 1, '22. Compteur non persistant');
  for (let index = 0; index < 4; index += 1) { await setInput(page, '[data-testid="unlock-pin"]', '1111'); await click(page, '[data-testid="unlock-submit"]'); await delay(300); }
  check((await bodyText(page)).includes('Nouvelle tentative'), '23. Délai progressif absent'); const security = await idb(page, 'get', 'securitySettings', 'local-security'); security.lockedUntil = new Date(Date.now() - 1000).toISOString(); await idb(page, 'put', 'securitySettings', null, security); await page.reload({ waitUntil: 'networkidle0' });
  await setInput(page, '[data-testid="unlock-pin"]', '2486'); await click(page, '[data-testid="unlock-submit"]'); await page.waitForFunction(() => document.body.innerText.includes('Sécurité locale')); check(true, '24. Bon PIN refusé');
  await page.select('[data-testid="auto-lock"]', '1'); await page.waitForFunction(() => document.body.innerText.includes('Délai enregistré'));
  await page.evaluate(() => { const realNow = Date.now.bind(Date); Date.now = () => realNow() + 61_000; }); await page.waitForSelector('[data-testid="locked-screen"]', { timeout: 10000 }); check(true, '25. Inactivité non verrouillée');
  await page.reload({ waitUntil: 'networkidle0' }); check(Boolean(await page.$('[data-testid="locked-screen"]')), '26. Rechargement non verrouillé');
  await page.evaluate(async () => { const request = indexedDB.open('SamtechCRMDatabase'); const database = await new Promise((resolve) => { request.onsuccess = () => resolve(request.result); }); const tx = database.transaction('securitySettings', 'readwrite'); const query = tx.objectStore('securitySettings').get('local-security'); const value = await new Promise((resolve) => { query.onsuccess = () => resolve(query.result); }); value.lockedUntil = undefined; tx.objectStore('securitySettings').put(value); await new Promise((resolve) => { tx.oncomplete = resolve; }); database.close(); });
  await page.reload({ waitUntil: 'networkidle0' }); const beforeReset = await idb(page, 'count', 'contacts'); await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('PIN oublié')).click());
  await setInput(page, '[data-testid="forgot-phrase"]', 'EFFACER'); check(await idb(page, 'count', 'contacts') === beforeReset, '27. Mauvaise phrase a effacé'); check(await page.$eval('[data-testid="forgot-confirm"]', (button) => button.disabled), '28. Confirmation faible');
  await setInput(page, '[data-testid="forgot-phrase"]', 'EFFACER MES DONNÉES'); await click(page, '[data-testid="forgot-confirm"]'); await delay(1000); check(await idb(page, 'count', 'contacts') === 0, '29. Données non effacées'); check(await idb(page, 'count', 'securitySettings') === 0, '30. Ancien PIN non effacé');
  await goto(page, state, '/settings/backup'); await upload(page, backupPath); await restore(page); check(Boolean(await idb(page, 'get', 'contacts', 'contact1')), '31. Sauvegarde non restaurable'); check(await idb(page, 'count', 'securitySettings') === 0, '32. Ancien PIN restauré');
  await goto(page, state, '/settings/security'); await setInput(page, '[data-testid="enable-pin"]', '1357'); await setInput(page, '[data-testid="enable-pin-confirm"]', '1357'); await click(page, '[data-testid="enable-pin-submit"]'); await page.waitForFunction(() => document.body.innerText.includes('PIN actif')); check(true, '33. Nouveau PIN impossible');
  await goto(page, state, '/settings/backup'); await setInput(page, '[data-testid="unlock-pin"]', '1357'); await click(page, '[data-testid="unlock-submit"]'); await page.waitForSelector('[data-testid="export-backup"]'); state.offline = true; await page.setOfflineMode(true); await click(page, '[data-testid="export-backup"]'); await page.waitForFunction(() => document.body.innerText.includes('proposée au téléchargement')); check(true, '34. Export hors ligne impossible');
  await upload(page, backupPath); check(Boolean(await page.$('[data-testid="backup-preview"]')), '35. Validation hors ligne impossible'); await restore(page, '1357'); check(Boolean(await idb(page, 'get', 'payments', 'payment1')), '36. Restauration hors ligne impossible');
  assert.equal(verified, 36);
}

(async () => {
  const startedAt = Date.now(); let server; let browser; const state = { offline: false, navigationUntil: 0 };
  const counts = { consoleErrors: 0, warnings: 0, pageErrors: 0, onlineFailures: 0, offlineFailures: 0, rscAborts: 0 };
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'samtech-sprint9-'));
  try {
    assert.ok(fs.existsSync(path.join(root, '.next', 'BUILD_ID')), 'Build de production absent');
    try { await fetch(baseUrl); throw new Error(`Port ${port} déjà occupé`); } catch (error) { if (error instanceof Error && error.message.includes('occupé')) throw error; }
    server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', String(port)], { cwd: root, stdio: 'ignore', windowsHide: true }); await waitServer(server);
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] }); const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); page.setDefaultTimeout(20000);
    const cdp = await page.createCDPSession(); await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });
    page.on('console', (message) => { if (message.type() === 'warning') counts.warnings += 1; if (message.type() === 'error') counts.consoleErrors += 1; }); page.on('pageerror', () => counts.pageErrors += 1);
    page.on('requestfailed', (request) => { const expectedAbort = request.failure()?.errorText === 'net::ERR_ABORTED' && request.url().includes('_rsc=') && Date.now() <= state.navigationUntil; if (state.offline) counts.offlineFailures += 1; else if (expectedAbort) counts.rscAborts += 1; else counts.onlineFailures += 1; });
    await scenario(page, state, counts, downloadDir);
    check(counts.consoleErrors === 0 && counts.pageErrors === 0 && counts.onlineFailures === 0, 'Bilan technique incorrect'); verified -= 1;
    console.log(`Début: ${new Date(startedAt).toISOString()}; fin: ${new Date().toISOString()}; durée: ${Date.now() - startedAt} ms.`);
    console.log(`Console: ${counts.consoleErrors} erreur(s), ${counts.warnings} avertissement(s); page: ${counts.pageErrors}; réseau en ligne: ${counts.onlineFailures}; hors ligne attendu: ${counts.offlineFailures}; RSC annulées: ${counts.rscAborts}.`);
    console.log('✅ E2E Sprint 9 : 36 étapes validées.');
  } catch (error) { console.error(`❌ E2E Sprint 9: ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; }
  finally { if (browser) await browser.close(); if (server && server.exitCode === null) server.kill(); fs.rmSync(downloadDir, { recursive: true, force: true }); }
})();
