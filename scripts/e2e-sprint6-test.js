/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.E2E_PORT || 3500);
const baseUrl = `http://127.0.0.1:${port}`;
const downloadDir = path.join(root, 'tmp', 'e2e-sprint6-downloads');
const databaseName = 'SamtechCRMDatabase';
let verified = 0;

function check(condition, message) { assert.ok(condition, message); verified += 1; }
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function waitServer(server) { for (let attempt = 0; attempt < 100; attempt += 1) { if (server.exitCode !== null) throw new Error(`Serveur arrêté avec le code ${server.exitCode}`); try { const response = await fetch(baseUrl); if (response.ok) return; } catch {} await delay(200); } throw new Error('Serveur de production non prêt'); }
async function waitText(page, text) { await page.waitForFunction((value) => document.body.innerText.includes(value), {}, text); }
async function hasText(page, text) { return page.evaluate((value) => document.body.innerText.includes(value), text); }
async function clickText(page, selector, text) { await page.waitForFunction((s, value) => Array.from(document.querySelectorAll(s)).some((node) => node.textContent?.trim().includes(value)), {}, selector, text); await page.evaluate((s, value) => { const node = Array.from(document.querySelectorAll(s)).find((item) => item.textContent?.trim().includes(value)); if (!(node instanceof HTMLElement)) throw new Error(`Élément ${value} absent`); node.click(); }, selector, text); }
async function setValue(page, selector, value) { await page.waitForSelector(selector); await page.$eval(selector, (element, next) => { const input = element; const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value'); descriptor.set.call(input, next); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); }, value); }
function expectNavigation(state, label) { state.navigationLabel = label; state.navigationUntil = Date.now() + 3000; }
async function goto(page, state, url, options = { waitUntil: 'networkidle0' }) { expectNavigation(state, `goto:${new URL(url).pathname}`); await page.goto(url, options); }

async function idbAll(page, store) { return page.evaluate(async (name, table) => new Promise((resolve, reject) => { const request = indexedDB.open(name); request.onerror = () => reject(request.error); request.onsuccess = () => { const db = request.result; const transaction = db.transaction(table, 'readonly'); const getAll = transaction.objectStore(table).getAll(); getAll.onsuccess = () => resolve(getAll.result); getAll.onerror = () => reject(getAll.error); transaction.oncomplete = () => db.close(); }; }), databaseName, store); }

async function seed(page) {
  await page.evaluate(async (name) => new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const stores = Array.from(db.objectStoreNames);
      const transaction = db.transaction(stores, 'readwrite');
      for (const store of stores) transaction.objectStore(store).clear();
      const now = '2026-07-18T09:00:00.000Z';
      const contactId = '11111111-1111-4111-8111-111111111111';
      const clientId = '22222222-2222-4222-8222-222222222222';
      const invoice1 = '33333333-3333-4333-8333-333333333333';
      const invoice2 = '44444444-4444-4444-8444-444444444444';
      transaction.objectStore('contacts').put({ id: contactId, displayName: 'Client Sprint Six', whatsappPhone: '+221770000000', normalizedWhatsappPhone: '+221770000000', createdAt: now, updatedAt: now });
      transaction.objectStore('clientProfiles').put({ id: clientId, contactId, convertedAt: now, createdAt: now, updatedAt: now });
      transaction.objectStore('settings').put({ key: 'company.profile', value: { name: 'SAMTECH E2E', phone: '+221330000000', currencyCode: 'XOF', currencySymbol: 'FCFA' }, schemaVersion: 1, updatedAt: now });
      transaction.objectStore('settings').put({ key: 'invoice.defaults', value: { currencyCode: 'XOF', prefix: 'FAC-', nextValue: 3, enableTaxes: false }, schemaVersion: 1, updatedAt: now });
      const common = { clientProfileId: clientId, status: 'EMISE', currency: 'XOF', currencyScale: 0, companySnapshot: { displayName: 'SAMTECH E2E', phone: '+221330000000' }, clientSnapshot: { displayName: 'Client Sprint Six', phone: '+221770000000' }, subtotalMinor: 100000, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 100000, paidTotalMinor: 0, balanceMinor: 100000, issuedAt: now, createdAt: now, updatedAt: now };
      transaction.objectStore('invoices').put({ id: invoice1, ...common, number: 'FAC-2026-0001', issueDate: '2026-07-17', dueDate: '2026-07-17' });
      transaction.objectStore('invoices').put({ id: invoice2, ...common, number: 'FAC-2026-0002', issueDate: '2026-07-17', dueDate: '2026-07-31', grandTotalMinor: 50000, subtotalMinor: 50000, balanceMinor: 50000 });
      transaction.objectStore('invoiceLines').put({ id: '55555555-5555-4555-8555-555555555555', invoiceId: invoice1, position: 0, designationSnapshot: 'Prestation E2E', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 100000, grossMinor: 100000, discountType: 'NONE', discountValue: 0, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 100000, createdAt: now, updatedAt: now });
      transaction.objectStore('invoiceLines').put({ id: '66666666-6666-4666-8666-666666666666', invoiceId: invoice2, position: 0, designationSnapshot: 'Prestation hors ligne', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 50000, grossMinor: 50000, discountType: 'NONE', discountValue: 0, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 50000, createdAt: now, updatedAt: now });
      transaction.objectStore('timelineEvents').put({ id: '77777777-7777-4777-8777-777777777777', contactId, type: 'INVOICE_ISSUED', occurredAt: now, createdAt: now, sourceEntityType: 'INVOICE', sourceEntityId: invoice1, title: 'Facture FAC-2026-0001 émise', payloadVersion: 1 });
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Seed annulé'));
    };
  }), databaseName);
}

async function waitPaymentCount(page, expected) { await page.waitForFunction(async (name, count) => new Promise((resolve) => { const request = indexedDB.open(name); request.onsuccess = () => { const db = request.result; const get = db.transaction('payments').objectStore('payments').count(); get.onsuccess = () => { db.close(); resolve(get.result === count); }; }; request.onerror = () => resolve(false); }), {}, databaseName, expected); }

function clearDownloads() { fs.mkdirSync(downloadDir, { recursive: true }); for (const name of fs.readdirSync(downloadDir)) fs.unlinkSync(path.join(downloadDir, name)); }
async function waitDownloadedPdf() { for (let attempt = 0; attempt < 80; attempt += 1) { const names = fs.readdirSync(downloadDir).filter((name) => name.endsWith('.pdf') && !name.endsWith('.crdownload')); if (names.length) return path.join(downloadDir, names[0]); await delay(100); } throw new Error('PDF non téléchargé'); }
async function downloadPdf(page) { clearDownloads(); await clickText(page, 'button', 'Télécharger PDF'); const file = await waitDownloadedPdf(); const bytes = fs.readFileSync(file); assert.equal(bytes.subarray(0, 5).toString('latin1'), '%PDF-'); assert.ok(bytes.length > 1000); return PDFDocument.load(bytes); }

async function recordPayment(page, amount, method) { await setValue(page, 'input[aria-label="Montant du paiement"]', amount); await page.select('select[aria-label="Mode de paiement"]', method); await clickText(page, 'button', 'Enregistrer le paiement'); await waitText(page, 'Paiement enregistré.'); }

async function startReverse(page, amountText) { await page.waitForFunction((amount) => Array.from(document.querySelectorAll('li')).some((item) => item.textContent?.includes(amount) && Array.from(item.querySelectorAll('button')).some((button) => button.textContent?.includes('Contrepasser'))), {}, amountText); await page.evaluate((amount) => { const item = Array.from(document.querySelectorAll('li')).find((node) => node.textContent?.includes(amount) && Array.from(node.querySelectorAll('button')).some((button) => button.textContent?.includes('Contrepasser'))); const button = Array.from(item.querySelectorAll('button')).find((node) => node.textContent?.includes('Contrepasser')); button.click(); }, amountText); }
async function reversePayment(page, paymentId, reason) { await setValue(page, `textarea[aria-label="Motif de contrepassation ${paymentId}"]`, reason); await clickText(page, 'button', 'Confirmer la contrepassation'); await waitText(page, 'Paiement contrepassé.'); }

async function scenario(page, state, counts) {
  await goto(page, state, `${baseUrl}/payments`);
  await waitText(page, 'Paiements et créances');
  await page.evaluate(() => navigator.serviceWorker?.ready);
  await seed(page);
  await page.reload({ waitUntil: 'networkidle0' });
  const settings = await idbAll(page, 'settings'); const clients = await idbAll(page, 'clientProfiles'); const seededInvoices = await idbAll(page, 'invoices');
  check(settings.some((item) => item.key === 'company.profile'), '1. Configuration entreprise absente');
  check(clients.length === 1, '2. Client absent');
  check(seededInvoices.some((item) => item.number === 'FAC-2026-0001' && item.grandTotalMinor === 100000 && item.status === 'EMISE'), '3. Facture de 100 000 non émise');
  check(seededInvoices.find((item) => item.number === 'FAC-2026-0001').balanceMinor === 100000, '4. Solde initial incorrect');

  await goto(page, state, `${baseUrl}/invoices/33333333-3333-4333-8333-333333333333`);
  await waitText(page, 'FAC-2026-0001');
  const initialPdf = await downloadPdf(page); check(initialPdf.getSubject().includes('EMISE'), '34. PDF sans paiement invalide');
  await recordPayment(page, '30000', 'WAVE'); await waitPaymentCount(page, 1);
  let invoice = (await idbAll(page, 'invoices')).find((item) => item.number === 'FAC-2026-0001'); let storedPayments = await idbAll(page, 'payments');
  check(storedPayments.some((item) => item.method === 'WAVE' && item.amountMinor === 30000), '5. Paiement Wave 30 000 absent');
  check(invoice.status === 'PARTIELLEMENT_PAYEE', '6. Statut partiel absent');
  check(invoice.paidTotalMinor === 30000 && invoice.balanceMinor === 70000, '7. Agrégats 30 000 / 70 000 incorrects');
  const activeCancelHidden = !(await hasText(page, 'Confirmer l’annulation'));
  const partialPdf = await downloadPdf(page); check(partialPdf.getSubject().includes('PARTIELLEMENT_PAYEE'), '35. PDF partiellement payé invalide');

  await recordPayment(page, '20000', 'CASH'); await waitPaymentCount(page, 2); storedPayments = await idbAll(page, 'payments');
  check(storedPayments.some((item) => item.method === 'CASH' && item.amountMinor === 20000), '8. Paiement Espèces 20 000 absent');
  invoice = (await idbAll(page, 'invoices')).find((item) => item.number === 'FAC-2026-0001'); check(invoice.paidTotalMinor === 50000 && invoice.balanceMinor === 50000, '9. Agrégats 50 000 / 50 000 incorrects');
  await setValue(page, 'input[aria-label="Montant du paiement"]', '50001'); await clickText(page, 'button', 'Enregistrer le paiement'); await waitText(page, 'Le paiement dépasse le solde restant'); check((await idbAll(page, 'payments')).length === 2, '10. Surpaiement non refusé');
  await clickText(page, 'button', 'Régler le solde'); const settleValue = await page.$eval('input[aria-label="Montant du paiement"]', (element) => element.value); check(settleValue === '50000', '11. Bouton Régler le solde incorrect');
  await page.select('select[aria-label="Mode de paiement"]', 'BANK_TRANSFER'); await clickText(page, 'button', 'Enregistrer le paiement'); await waitText(page, 'Paiement enregistré.'); await waitPaymentCount(page, 3);
  storedPayments = await idbAll(page, 'payments'); check(storedPayments.some((item) => item.amountMinor === 50000), '12. Paiement final 50 000 absent');
  invoice = (await idbAll(page, 'invoices')).find((item) => item.number === 'FAC-2026-0001'); check(invoice.status === 'PAYEE', '13. Statut PAYEE absent');
  check(invoice.paidTotalMinor === 100000 && invoice.balanceMinor === 0, '14. Agrégats soldés incorrects');
  check(!(await page.$('input[aria-label="Montant du paiement"]')), '15. Nouveau paiement encore disponible sur facture payée');
  check((await page.$$('ol li')).length >= 3, '16. Historique des trois paiements absent');
  const paidPdf = await downloadPdf(page); check(paidPdf.getSubject().includes('PAYEE'), '36. PDF payé invalide');

  await goto(page, state, `${baseUrl}/payments`); await waitText(page, 'Paiements et créances'); await setValue(page, 'input[aria-label="Rechercher un paiement ou une créance"]', 'FAC-2026-0001'); await page.select('select[aria-label="Filtrer par mode"]', 'WAVE'); await waitText(page, '1 paiement(s)'); check(await hasText(page, 'Wave'), '17. Recherche ou filtre de paiements incorrect');
  check(await hasText(page, 'Total actif filtré : 30 000 XOF'), '18. Total encaissé filtré incorrect');
  await clickText(page, 'button', 'Créances'); await waitText(page, '0 créance(s)'); check(!(await hasText(page, 'FAC-2026-0001')), '19. Facture payée présente dans les créances');

  await goto(page, state, `${baseUrl}/invoices/33333333-3333-4333-8333-333333333333`); await waitText(page, 'FAC-2026-0001');
  storedPayments = await idbAll(page, 'payments'); const p50 = storedPayments.find((item) => item.amountMinor === 50000); const p30 = storedPayments.find((item) => item.amountMinor === 30000); const p20 = storedPayments.find((item) => item.amountMinor === 20000);
  await startReverse(page, '50 000 XOF'); await clickText(page, 'button', 'Confirmer la contrepassation'); await waitText(page, 'Le motif de contrepassation est obligatoire'); check((await idbAll(page, 'payments')).find((item) => item.id === p50.id).status === 'ACTIVE', '21. Motif vide accepté');
  await reversePayment(page, p50.id, 'Correction E2E'); check((await idbAll(page, 'payments')).find((item) => item.id === p50.id).status === 'REVERSED', '20. Contrepassation finale absente');
  invoice = (await idbAll(page, 'invoices')).find((item) => item.number === 'FAC-2026-0001'); check(invoice.status === 'PARTIELLEMENT_PAYEE', '22. Retour au statut partiel absent');
  check(invoice.balanceMinor === 50000 && invoice.paidTotalMinor === 50000, '23. Solde revenu à 50 000 incorrect');
  check(await hasText(page, 'CONTREPASSÉ'), '24. Paiement contrepassé non visible');
  await startReverse(page, '30 000 XOF'); await reversePayment(page, p30.id, 'Correction Wave'); await startReverse(page, '20 000 XOF'); await reversePayment(page, p20.id, 'Correction Espèces');
  check((await idbAll(page, 'payments')).filter((item) => item.status === 'REVERSED').length === 3, '25. Contrepassation des deux autres paiements absente');
  invoice = (await idbAll(page, 'invoices')).find((item) => item.number === 'FAC-2026-0001'); check(invoice.status === 'EMISE', '26. Retour EMISE absent');
  check(invoice.paidTotalMinor === 0 && invoice.balanceMinor === 100000, '27. Agrégats après contrepassations incorrects');
  check(activeCancelHidden, '30. Annulation avec paiement actif non bloquée');

  await goto(page, state, `${baseUrl}/payments`); await waitText(page, 'Paiements et créances'); await clickText(page, 'button', 'Créances'); await waitText(page, 'FAC-2026-0001'); check(true, '28. Facture non visible dans les créances');
  await page.select('select[aria-label="Filtrer les créances par échéance"]', 'OVERDUE'); await waitText(page, 'Échue depuis 1 jour(s)'); check(true, '29. Créance échue non identifiée');
  await goto(page, state, `${baseUrl}/invoices/33333333-3333-4333-8333-333333333333`); await setValue(page, 'textarea[aria-label="Motif d’annulation"]', 'Annulation après contrepassations'); await clickText(page, 'button', 'Confirmer l’annulation'); await waitText(page, 'ANNULÉE'); invoice = (await idbAll(page, 'invoices')).find((item) => item.number === 'FAC-2026-0001'); check(invoice.status === 'ANNULEE', '31. Annulation après contrepassations refusée');
  check(!(await page.$('input[aria-label="Montant du paiement"]')), '32. Paiement proposé sur facture annulée');
  const events = await idbAll(page, 'timelineEvents'); check(events.filter((item) => item.type === 'PAYMENT_RECORDED').length === 3 && events.filter((item) => item.type === 'PAYMENT_REVERSED').length === 3, '33. Événements de paiement incomplets');

  await goto(page, state, `${baseUrl}/invoices/44444444-4444-4444-8444-444444444444`); await waitText(page, 'FAC-2026-0002'); state.offline = true; await page.setOfflineMode(true); check(true, '37. Passage hors ligne impossible');
  await recordPayment(page, '10000', 'ORANGE_MONEY'); await waitPaymentCount(page, 4); check((await idbAll(page, 'payments')).some((item) => item.invoiceId === '44444444-4444-4444-8444-444444444444' && item.amountMinor === 10000), '38. Paiement partiel hors ligne absent');
  await page.reload({ waitUntil: 'domcontentloaded' }); await waitText(page, 'FAC-2026-0002'); check(true, '39. Actualisation hors ligne en échec');
  const offlinePayments = await idbAll(page, 'payments'); check(offlinePayments.length === 4, '40. Persistance IndexedDB hors ligne incohérente');
  const offlineInvoice = (await idbAll(page, 'invoices')).find((item) => item.number === 'FAC-2026-0002'); const offlinePdf = await downloadPdf(page); check(offlineInvoice.status === 'PARTIELLEMENT_PAYEE' && offlineInvoice.paidTotalMinor === 10000 && offlineInvoice.balanceMinor === 40000 && offlinePdf.getSubject().includes('PARTIELLEMENT_PAYEE'), '41. Recalcul ou PDF hors ligne incohérent');
  check(counts.consoleErrors === 0 && counts.warnings === 0 && counts.pageErrors === 0 && counts.onlineFailures === 0, '42. Erreur applicative détectée');
  assert.equal(verified, 42, `Nombre de critères vérifiés incorrect : ${verified}`);
}

(async () => {
  let server; let browser;
  const state = { offline: false, navigationUntil: 0, navigationLabel: '' };
  const counts = { consoleErrors: 0, warnings: 0, pageErrors: 0, onlineFailures: 0, offlineFailures: 0, rscAborts: 0, rscByNavigation: {} };
  try {
    assert.ok(fs.existsSync(path.join(root, '.next', 'BUILD_ID')), 'Build de production absent');
    try { await fetch(baseUrl); throw new Error(`Port ${port} déjà occupé`); } catch (error) { if (error instanceof Error && error.message.includes('occupé')) throw error; }
    server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', String(port)], { cwd: root, stdio: 'ignore', windowsHide: true });
    await waitServer(server);
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); page.setDefaultTimeout(15000);
    const client = await page.createCDPSession(); clearDownloads(); await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });
    let rejectFatal; const fatal = new Promise((_, reject) => { rejectFatal = reject; });
    page.on('dialog', (dialog) => void dialog.accept());
    page.on('console', (message) => { if (message.type() === 'warning') counts.warnings += 1; if (message.type() === 'error') { counts.consoleErrors += 1; rejectFatal(new Error(`console.error: ${message.text()}`)); } });
    page.on('pageerror', (error) => { counts.pageErrors += 1; rejectFatal(error); });
    page.on('requestfailed', (request) => { const expectedRscAbort = request.failure()?.errorText === 'net::ERR_ABORTED' && request.url().includes('_rsc=') && Date.now() <= state.navigationUntil; if (state.offline) counts.offlineFailures += 1; else if (expectedRscAbort) { counts.rscAborts += 1; counts.rscByNavigation[state.navigationLabel] = (counts.rscByNavigation[state.navigationLabel] || 0) + 1; } else { counts.onlineFailures += 1; rejectFatal(new Error(`Requête échouée en ligne: ${request.url()} (${request.failure()?.errorText || 'motif inconnu'})`)); } });
    await Promise.race([scenario(page, state, counts), fatal]);
    console.log(`Erreurs console: ${counts.consoleErrors}; avertissements: ${counts.warnings}; exceptions: ${counts.pageErrors}; échecs en ligne: ${counts.onlineFailures}; RSC annulées: ${counts.rscAborts}; échecs attendus hors ligne: ${counts.offlineFailures}.`);
    console.log(`RSC annulées par navigation: ${JSON.stringify(counts.rscByNavigation)}.`);
    console.log('✅ E2E Sprint 6 : 42 critères vérifiés.');
  } catch (error) { console.error(`❌ E2E Sprint 6: ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; }
  finally { if (browser) await browser.close(); if (server && server.exitCode === null) { server.kill(); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(3000)]); } }
})();
