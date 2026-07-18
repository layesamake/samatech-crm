/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process'); const puppeteer = require('puppeteer');
const port = Number(process.env.E2E_PORT || 3200); const baseUrl = `http://127.0.0.1:${port}`; const root = path.resolve(__dirname, '..');
function assert(value, message) { if (!value) throw new Error(message); }
async function waitServer(child) { for (let i = 0; i < 120; i += 1) { if (child.exitCode !== null) throw new Error('Serveur E2E arrêté'); try { if ((await fetch(baseUrl)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error('Serveur E2E non prêt'); }
async function setValue(page, selector, value) { await page.waitForSelector(selector); await page.$eval(selector, (element, next) => { const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, next); element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); }, String(value)); }
async function clickText(page, selector, text) { const ok = await page.$$eval(selector, (elements, expected) => { const found = elements.find((element) => element.textContent.trim().includes(expected)); if (!found) return false; found.click(); return true; }, text); assert(ok, `Élément absent : ${text}`); }
async function waitText(page, text) { try { await page.waitForFunction((expected) => document.body.innerText.includes(expected), {}, text); } catch (error) { const body = await page.evaluate(() => document.body.innerText.slice(0, 2000)); throw new Error(`Texte absent « ${text} » sur ${page.url()}\n${body}`, { cause: error }); } }
async function waitValue(page, selector, value) { await page.waitForFunction((target, expected) => document.querySelector(target)?.value === expected, {}, selector, value); }
async function waitFollowUpDetail(page) { await page.waitForFunction(() => { const parts = location.pathname.split('/').filter(Boolean); return parts.length === 2 && parts[0] === 'follow-ups' && parts[1] !== 'new'; }); }
function expectNavigation(state, label) { state.navigationLabel = label; state.navigationUntil = Date.now() + 3000; }
async function goto(page, state, url, options) { expectNavigation(state, `goto:${new URL(url).pathname}`); await page.goto(url, options); }
function localInput(date) { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
async function idbAll(page, table) { return page.evaluate((name) => new Promise((resolve, reject) => { const open = indexedDB.open('SamtechCRMDatabase'); open.onerror = () => reject(open.error); open.onsuccess = () => { const request = open.result.transaction(name, 'readonly').objectStore(name).getAll(); request.onerror = () => reject(request.error); request.onsuccess = () => resolve(request.result); }; }), table); }
async function waitForIdbCount(page, table, expected) { await page.waitForFunction((name, count) => new Promise((resolve, reject) => { const open = indexedDB.open('SamtechCRMDatabase'); open.onerror = () => reject(open.error); open.onsuccess = () => { const request = open.result.transaction(name, 'readonly').objectStore(name).count(); request.onerror = () => reject(request.error); request.onsuccess = () => resolve(request.result === count); }; }), {}, table, expected); }

async function scenario(page, state) {
  console.log('Préparation locale du prospect et de l’entreprise');
  await goto(page, state, baseUrl, { waitUntil: 'networkidle0' });
  await page.evaluate(() => new Promise((resolve, reject) => { const request = indexedDB.deleteDatabase('SamtechCRMDatabase'); request.onsuccess = resolve; request.onerror = () => reject(request.error); }));
  await goto(page, state, `${baseUrl}/settings`, { waitUntil: 'networkidle0' });
  for (const [name, value] of Object.entries({ name: 'SAMTECH E2E S3', phone: '+221770001111', currencyCode: 'XOF', currencySymbol: 'FCFA' })) await setValue(page, `input[name="${name}"]`, value);
  await clickText(page, 'button[type="submit"]', 'Enregistrer'); await waitText(page, 'succès');
  await goto(page, state, `${baseUrl}/prospects/nouveau`, { waitUntil: 'networkidle0' });
  await setValue(page, 'input[name="displayName"]', 'Awa Ndiaye'); await setValue(page, 'input[name="whatsappPhone"]', '+221771234567'); expectNavigation(state, 'création-prospect'); await clickText(page, 'button[type="submit"]', 'Enregistrer');
  await page.waitForFunction(() => location.pathname.startsWith('/prospects/') && !location.pathname.endsWith('nouveau')); const prospectUrl = page.url(); const contactId = prospectUrl.split('/').pop();

  console.log('1-4 Modèles : création, aperçu, variables manquantes, duplication et modification');
  await goto(page, state, `${baseUrl}/message-templates`, { waitUntil: 'networkidle0' });
  await setValue(page, 'input[aria-label="Nom du modèle"]', 'Relance E2E S3');
  const templateContent = 'Bonjour {{prenom}}, votre intérêt {{produit}} à {{localite}} — {{nom_entreprise}}';
  await setValue(page, 'textarea[aria-label="Contenu du modèle"]', templateContent); await clickText(page, 'button[type="submit"]', 'Créer le modèle'); await waitText(page, 'Modèle créé avec succès');
  assert((await idbAll(page, 'messageTemplates')).length === 1, 'Modèle non persisté');
  await clickText(page, 'button', 'Dupliquer'); await waitForIdbCount(page, 'messageTemplates', 2);
  const cards = await page.$$('article'); assert(cards.length === 2, 'Duplication non affichée');
  await page.$$eval('article', (articles) => { const copy = articles.find((article) => article.innerText.includes('copie')); const button = copy && Array.from(copy.querySelectorAll('button')).find((item) => item.innerText.includes('Modifier')); button.click(); });
  await setValue(page, 'input[aria-label="Nom du modèle"]', 'Relance E2E S3 copie modifiée'); await clickText(page, 'button[type="submit"]', 'Enregistrer les modifications'); await waitText(page, 'Modèle modifié avec succès');

  const future = new Date(Date.now() + 2 * 86400000); const past = new Date(Date.now() - 2 * 86400000);
  console.log('5-10 Relances : création prospect, vues, passé, recherche, filtres et doublon');
  await goto(page, state, `${baseUrl}/follow-ups/new?contactId=${contactId}`, { waitUntil: 'networkidle0' });
  await setValue(page, 'input[name="dueAt"]', localInput(future)); await page.select('select[name="priority"]', 'HIGH'); await setValue(page, 'textarea[name="reason"]', 'Relance future E2E');
  const templateId = await page.$eval('select[name="messageTemplateId"] option:nth-child(2)', (option) => option.value); await page.select('select[name="messageTemplateId"]', templateId); expectNavigation(state, 'création-relance-future'); await clickText(page, 'button[type="submit"]', 'Planifier'); await waitFollowUpDetail(page); const futureUrl = page.url();
  await goto(page, state, `${baseUrl}/follow-ups`, { waitUntil: 'networkidle0' }); await clickText(page, 'button', 'À venir'); await waitText(page, 'Awa Ndiaye');
  await setValue(page, 'input[aria-label="Rechercher une relance"]', 'Awa'); await page.select('select[aria-label="Filtrer par priorité"]', 'HIGH'); await page.select('select[aria-label="Filtrer par canal"]', 'WHATSAPP'); await waitText(page, 'Relance future E2E');
  await goto(page, state, `${baseUrl}/follow-ups/new?contactId=${contactId}`, { waitUntil: 'networkidle0' }); await setValue(page, 'input[name="dueAt"]', localInput(past)); await setValue(page, 'textarea[name="reason"]', 'Relance passée E2E'); await clickText(page, 'button[type="submit"]', 'Planifier'); await waitText(page, 'échéance est passée'); expectNavigation(state, 'confirmation-relance-passée'); await clickText(page, 'button', 'Confirmer quand même'); await waitFollowUpDetail(page); const pastUrl = page.url();
  await goto(page, state, `${baseUrl}/follow-ups`, { waitUntil: 'networkidle0' }); await clickText(page, 'button', 'En retard'); await waitText(page, 'Relance passée E2E');
  await goto(page, state, `${baseUrl}/follow-ups/new?contactId=${contactId}`, { waitUntil: 'networkidle0' }); await setValue(page, 'input[name="dueAt"]', localInput(future)); await setValue(page, 'textarea[name="reason"]', 'Doublon proche E2E'); await clickText(page, 'button[type="submit"]', 'Planifier'); await waitText(page, 'relance proche existe déjà'); expectNavigation(state, 'confirmation-doublon-proche'); await clickText(page, 'button', 'Confirmer quand même'); await waitFollowUpDetail(page); const duplicateUrl = page.url();

  console.log('11-15 WhatsApp : prévisualisation, lien exact, événement et statut inchangé, réalisation manuelle');
  const futureFollowUp = (await idbAll(page, 'followUps')).find((item) => futureUrl.endsWith(item.id)); assert(futureFollowUp?.messageTemplateId === templateId, 'Le modèle choisi n’est pas relié à la relance');
  await goto(page, state, futureUrl, { waitUntil: 'networkidle0' }); await waitText(page, 'Variables sans valeur');
  const finalMessage = 'Bonjour Awa, message final manuel éè ☀️\nÀ bientôt'; await setValue(page, 'textarea[aria-label="Message final WhatsApp"]', finalMessage); await clickText(page, 'button', 'Préparer le lien'); await waitText(page, 'La relance reste planifiée');
  const href = await page.$eval('[data-testid="whatsapp-link"]', (link) => link.href); assert(href === `https://wa.me/221771234567?text=${encodeURIComponent(finalMessage)}`, `Lien WhatsApp incorrect: ${href}`);
  let followUps = await idbAll(page, 'followUps'); const prepared = followUps.find((item) => futureUrl.endsWith(item.id)); assert(prepared.status === 'PLANIFIEE' && prepared.messageSnapshot === finalMessage, 'Ouverture WhatsApp a modifié le statut ou perdu l’instantané');
  assert((await idbAll(page, 'timelineEvents')).some((event) => event.type === 'WHATSAPP_OPENED'), 'Événement WHATSAPP_OPENED absent');
  await setValue(page, 'textarea[aria-label="Note de résultat"]', 'Prospect joint manuellement'); await clickText(page, 'button', 'Marquer comme réalisée'); await waitText(page, 'REALISEE'); assert((await idbAll(page, 'timelineEvents')).some((event) => event.type === 'FOLLOW_UP_COMPLETED'), 'Événement de réalisation absent');

  console.log('16-20 Report, annulation, archivage du modèle et instantané');
  await goto(page, state, duplicateUrl, { waitUntil: 'networkidle0' }); const rescheduledDate = new Date(Date.now() + 4 * 86400000); await setValue(page, 'input[aria-label="Nouvelle échéance"]', localInput(rescheduledDate)); expectNavigation(state, 'report-relance'); await clickText(page, 'button', 'Reporter'); await page.waitForFunction((oldUrl) => location.href !== oldUrl, {}, duplicateUrl); const rescheduledUrl = page.url();
  followUps = await idbAll(page, 'followUps'); const previous = followUps.find((item) => duplicateUrl.endsWith(item.id)); const next = followUps.find((item) => rescheduledUrl.endsWith(item.id)); assert(previous.status === 'REPORTEE' && next.previousFollowUpId === previous.id, 'Report non atomique ou liaison absente');
  page.once('dialog', (dialog) => dialog.accept()); await goto(page, state, pastUrl, { waitUntil: 'networkidle0' }); await clickText(page, 'button', 'Annuler'); await waitText(page, 'ANNULEE');
  await goto(page, state, `${baseUrl}/message-templates`, { waitUntil: 'networkidle0' }); page.once('dialog', (dialog) => dialog.accept()); await page.$$eval('article', (articles) => { const source = articles.find((article) => article.innerText.includes('Relance E2E S3') && !article.innerText.includes('copie')); const button = source && Array.from(source.querySelectorAll('button')).find((item) => item.innerText.includes('Archiver')); button.click(); }); await page.waitForFunction(() => !document.body.innerText.includes('Relance E2E S3\nFOLLOW_UP'));
  await goto(page, state, futureUrl, { waitUntil: 'networkidle0' }); await waitValue(page, 'textarea[aria-label="Message final WhatsApp"]', finalMessage); assert((await idbAll(page, 'followUps')).find((item) => futureUrl.endsWith(item.id)).messageTemplateId === templateId, 'Identité du modèle archivé perdue');

  console.log('21-26 Hors ligne : actualisation, modification, résolution locale, persistance et console');
  await goto(page, state, rescheduledUrl, { waitUntil: 'networkidle0' }); await goto(page, state, `${rescheduledUrl}/edit`, { waitUntil: 'networkidle0' }); state.offline = true; await page.setOfflineMode(true); await page.reload({ waitUntil: 'domcontentloaded' }); await waitText(page, 'Modifier la relance');
  await setValue(page, 'textarea[name="reason"]', 'Relance modifiée hors ligne'); expectNavigation(state, 'modification-relance-hors-ligne'); await clickText(page, 'button[type="submit"]', 'Enregistrer les modifications'); await waitFollowUpDetail(page); await waitText(page, 'Relance modifiée hors ligne');
  followUps = await idbAll(page, 'followUps'); assert(followUps.find((item) => rescheduledUrl.endsWith(item.id)).reason === 'Relance modifiée hors ligne', 'Persistance IndexedDB hors ligne absente');
  await goto(page, state, futureUrl, { waitUntil: 'domcontentloaded' }); await waitValue(page, 'textarea[aria-label="Message final WhatsApp"]', finalMessage);
}

(async () => { let server; let browser; const state = { offline: false, navigationUntil: 0, navigationLabel: '' }; const counts = { consoleErrors: 0, warnings: 0, pageErrors: 0, onlineFailures: 0, offlineFailures: 0, rscAborts: 0, rscNavigations: {} }; try {
  assert(fs.existsSync(path.join(root, '.next', 'BUILD_ID')), 'Build absent'); try { await fetch(baseUrl); throw new Error(`Port ${port} occupé`); } catch (error) { if (error instanceof Error && error.message.includes('occupé')) throw error; }
  server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', String(port)], { cwd: root, stdio: 'ignore' }); await waitServer(server);
  browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] }); const page = await browser.newPage(); let rejectFatal; const fatal = new Promise((_, reject) => { rejectFatal = reject; });
  page.on('console', (message) => { if (message.type() === 'warning') counts.warnings += 1; if (message.type() === 'error') { counts.consoleErrors += 1; rejectFatal(new Error(`console.error: ${message.text()}`)); } });
  page.on('pageerror', (error) => { counts.pageErrors += 1; rejectFatal(error); }); page.on('requestfailed', (request) => { const expectedRscAbort = request.failure()?.errorText === 'net::ERR_ABORTED' && request.url().includes('_rsc=') && Date.now() <= state.navigationUntil; if (state.offline) counts.offlineFailures += 1; else if (expectedRscAbort) { counts.rscAborts += 1; counts.rscNavigations[state.navigationLabel] = (counts.rscNavigations[state.navigationLabel] || 0) + 1; } else { counts.onlineFailures += 1; rejectFatal(new Error(`Requête échouée hors navigation identifiée: ${request.url()} (${request.failure()?.errorText || 'motif inconnu'})`)); } });
  await Promise.race([scenario(page, state), fatal]); console.log(`Erreurs console: ${counts.consoleErrors}; avertissements: ${counts.warnings}; exceptions: ${counts.pageErrors}; échecs réseau en ligne: ${counts.onlineFailures}; RSC annulées pendant navigations identifiées: ${counts.rscAborts}; échecs attendus hors ligne: ${counts.offlineFailures}.`); console.log(`Navigations RSC: ${JSON.stringify(counts.rscNavigations)}.`); console.log('✅ E2E Sprint 3 : 26 scénarios vérifiés.');
} catch (error) { console.error(`❌ E2E Sprint 3: ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; } finally { if (browser) await browser.close(); if (server && server.exitCode === null) { server.kill(); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 3000))]); } } })();
