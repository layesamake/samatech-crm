/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const puppeteer = require('puppeteer');

const root = path.resolve(__dirname, '..');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startProductionServer(port) {
  const baseUrl = `http://127.0.0.1:${port}`;
  if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) throw new Error('Build de production absent. Exécutez npm.cmd run build.');
  try { const response = await fetch(baseUrl); if (response.ok) throw new Error(`Port ${port} déjà occupé.`); } catch (error) { if (error instanceof Error && error.message.includes('occupé')) throw error; }
  const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', String(port)], { cwd: root, stdio: 'ignore', windowsHide: true });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Serveur arrêté (${server.exitCode}).`);
    try { const response = await fetch(baseUrl); if (response.ok) return { baseUrl, server }; } catch {}
    await delay(250);
  }
  server.kill(); throw new Error('Serveur de production indisponible.');
}

async function stopProductionServer(server) {
  if (server?.exitCode === null) { server.kill(); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(3000)]); }
}

async function launchBrowser(viewport = { width: 390, height: 844 }) {
  const launchOptions = { headless: 'new', args: ['--no-sandbox'] };
  if (process.env.BROWSER_PATH) launchOptions.executablePath = process.env.BROWSER_PATH;
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage(); await page.setViewport({ ...viewport, deviceScaleFactor: 1 }); page.setDefaultTimeout(25000);
  return { browser, page };
}

async function seedMinimal(page) {
  await page.evaluate(async () => {
    const request = indexedDB.open('SamtechCRMDatabase'); const database = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const names = Array.from(database.objectStoreNames); const clear = database.transaction(names, 'readwrite'); names.forEach((name) => clear.objectStore(name).clear()); await new Promise((resolve, reject) => { clear.oncomplete = resolve; clear.onerror = () => reject(clear.error); });
    const now = '2026-07-18T10:00:00.000Z'; const tx = database.transaction(names, 'readwrite'); const put = (table, value) => tx.objectStore(table).put(value);
    put('settings', { key: 'company.profile', value: { name: 'SENCAIILLE', phone: '+221 77 648 17 82', address: 'Quartier Mbambara Thiès', currencyCode: 'XOF', currencySymbol: 'FCFA' }, schemaVersion: 1, updatedAt: now });
    put('sequences', { key: 'invoice:2026', prefix: 'FAC-', nextValue: 2, padding: 4, updatedAt: now }); put('locations', { id: 'loc1', name: 'Thiès', normalizedName: 'thies', level: 'CITY', createdAt: now, updatedAt: now }); put('categories', { id: 'cat1', name: 'Services', normalizedName: 'services', createdAt: now, updatedAt: now });
    put('products', { id: 'prod1', name: 'Conseil fictif', normalizedName: 'conseil fictif', type: 'SERVICE', categoryId: 'cat1', unitPriceMinor: 100000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now }); put('contacts', { id: 'contact1', displayName: 'Awa Démonstration', whatsappPhone: '+221770000001', normalizedWhatsappPhone: '+221770000001', locationId: 'loc1', source: 'REFERRAL', createdAt: now, updatedAt: now });
    put('prospectProfiles', { id: 'prospect1', contactId: 'contact1', status: 'CONVERTI', interestLevel: 'CHAUD', firstContactDate: '2026-07-01', convertedAt: now, lastStatusChangedAt: now, createdAt: now, updatedAt: now }); put('prospectInterests', { id: 'interest1', prospectProfileId: 'prospect1', productId: 'prod1', requestedAt: now, createdAt: now, updatedAt: now }); put('clientProfiles', { id: 'client1', contactId: 'contact1', convertedAt: now, clientNumber: 'CLI-0001', createdAt: now, updatedAt: now });
    put('tags', { id: 'tag1', name: 'Pilote', normalizedName: 'pilote', createdAt: now, updatedAt: now }); put('contactTags', { id: 'ct1', contactId: 'contact1', tagId: 'tag1', createdAt: now }); put('notes', { id: 'note1', contactId: 'contact1', content: 'Donnée strictement fictive.', pinned: false, createdAt: now, updatedAt: now }); put('timelineEvents', { id: 'event1', contactId: 'contact1', type: 'INVOICE_ISSUED', occurredAt: now, title: 'Facture émise', payloadVersion: 1, createdAt: now });
    put('followUps', { id: 'follow1', contactId: 'contact1', channel: 'WHATSAPP', dueAt: now, timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'PLANIFIEE', createdAt: now, updatedAt: now }); put('messageTemplates', { id: 'template1', name: 'Relance fictive', category: 'FOLLOW_UP', content: 'Bonjour', variables: [], isActive: true, createdAt: now, updatedAt: now });
    put('invoices', { id: 'invoice1', number: 'FAC-2026-0001', clientProfileId: 'client1', status: 'PARTIELLEMENT_PAYEE', issueDate: '2026-07-18', dueDate: '2026-07-25', currency: 'XOF', currencyScale: 0, companySnapshot: { displayName: 'SENCAIILLE' }, clientSnapshot: { displayName: 'Awa Démonstration' }, subtotalMinor: 100000, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 100000, paidTotalMinor: 30000, balanceMinor: 70000, createdAt: now, updatedAt: now }); put('invoiceLines', { id: 'line1', invoiceId: 'invoice1', productId: 'prod1', position: 0, designationSnapshot: 'Conseil fictif', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 100000, grossMinor: 100000, discountType: 'NONE', discountValue: 0, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 100000, createdAt: now, updatedAt: now });
    put('payments', { id: 'payment1', invoiceId: 'invoice1', clientProfileId: 'client1', paymentDate: '2026-07-18', amountMinor: 30000, currency: 'XOF', currencyScale: 0, method: 'WAVE', status: 'ACTIVE', createdAt: now, updatedAt: now }); put('campaigns', { id: 'campaign1', name: 'Fidélisation fictive', status: 'EN_COURS', audienceType: 'CLIENTS', criteria: {}, messageSnapshot: 'Bonjour', launchedAt: now, createdAt: now, updatedAt: now }); put('campaignRecipients', { id: 'recipient1', campaignId: 'campaign1', contactId: 'contact1', normalizedPhoneSnapshot: '+221770000001', displayNameSnapshot: 'Awa Démonstration', resolvedMessageSnapshot: 'Bonjour', position: 0, status: 'A_TRAITER', createdAt: now, updatedAt: now });
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); database.close();
  });
}

async function putSecurityPin(page, pin = '2486') {
  await page.evaluate(async (value) => {
    const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(value), 'PBKDF2', false, ['deriveBits']); const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, key, 256));
    const encode = (bytes) => btoa(String.fromCharCode(...bytes)); const request = indexedDB.open('SamtechCRMDatabase'); const database = await new Promise((resolve) => { request.onsuccess = () => resolve(request.result); }); const tx = database.transaction('securitySettings', 'readwrite'); tx.objectStore('securitySettings').put({ id: 'local-security', pinEnabled: true, pinHash: encode(bits), pinSalt: encode(salt), pinAlgorithmVersion: 1, failedAttempts: 0, autoLockMinutes: 5, updatedAt: new Date().toISOString() }); await new Promise((resolve) => { tx.oncomplete = resolve; }); database.close();
  }, pin);
}

module.exports = { delay, launchBrowser, putSecurityPin, root, seedMinimal, startProductionServer, stopProductionServer };
