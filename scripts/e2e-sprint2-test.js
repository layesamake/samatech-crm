/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const port = Number(process.env.E2E_PORT || 3100);
const baseUrl = `http://127.0.0.1:${port}`;
const projectRoot = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function portIsOccupied() {
  try { await fetch(baseUrl); return true; } catch { return false; }
}

async function waitForServer(child, output) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Le serveur E2E s'est arrêté (${child.exitCode}).\n${output.join('')}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch { /* le serveur démarre */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Le serveur E2E n'est pas prêt après 30 s.\n${output.join('')}`);
}

async function setValue(page, selector, value) {
  await page.waitForSelector(selector);
  await page.$eval(selector, (element, nextValue) => {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    setter.call(element, nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, String(value));
}

async function clickText(page, selector, text) {
  const clicked = await page.$$eval(selector, (elements, expected) => {
    const element = elements.find((candidate) => candidate.textContent.trim().includes(expected));
    if (!element) return false;
    element.click();
    return true;
  }, text);
  assert(clicked, `Élément introuvable : ${selector} contenant « ${text} »`);
}

async function waitForText(page, text) {
  await page.waitForFunction((expected) => document.body.innerText.includes(expected), {}, text);
}

async function rowAction(page, rowText, action) {
  const clicked = await page.$$eval('tr', (rows, expectedRow, expectedAction) => {
    const row = rows.find((candidate) => candidate.innerText.includes(expectedRow));
    const button = row && Array.from(row.querySelectorAll('button')).find((candidate) => candidate.innerText.includes(expectedAction));
    if (!button) return false;
    button.click();
    return true;
  }, rowText, action);
  assert(clicked, `Action « ${action} » introuvable pour « ${rowText} »`);
}

async function selectedValueByText(page, selector, text) {
  await page.waitForSelector(selector);
  return page.$eval(selector, (select, expected) => {
    const option = Array.from(select.options).find((candidate) => candidate.text.includes(expected));
    if (!option) throw new Error(`Option absente : ${expected}`);
    return option.value;
  }, text);
}

async function runScenario(page, state) {
  console.log('1-4 Paramètres : enregistrement, actualisation et persistance');
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('SamtechCRMDatabase');
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Réinitialisation IndexedDB bloquée'));
    });
  });
  await page.goto(`${baseUrl}/settings`, { waitUntil: 'networkidle0' });
  const settings = {
    name: 'SAMTECH E2E', phone: '+221770000099', email: 'e2e@samtech.test', address: 'Dakar Plateau',
    city: 'Dakar', country: 'Sénégal', currencyCode: 'XOF', currencySymbol: 'FCFA',
  };
  for (const [name, value] of Object.entries(settings)) await setValue(page, `input[name="${name}"]`, value);
  await clickText(page, 'button[type="submit"]', 'Enregistrer');
  await waitForText(page, 'Paramètres enregistrés avec succès');
  await page.reload({ waitUntil: 'networkidle0' });
  for (const [name, value] of Object.entries(settings)) {
    assert(await page.$eval(`input[name="${name}"]`, (input) => input.value) === value, `Paramètre non persisté : ${name}`);
  }

  console.log('5-10 Localités : hiérarchie, recherche, modification, doublon et parent invalide');
  await clickText(page, 'button', 'Localités');
  const addLocation = async (name, level, parentText) => {
    await setValue(page, 'input[name="name"]', name);
    await page.select('select[name="level"]', level);
    let parentValue = '';
    if (parentText) {
      await page.waitForSelector('select[name="parentId"]');
      parentValue = await selectedValueByText(page, 'select[name="parentId"]', parentText);
      await page.select('select[name="parentId"]', parentValue);
    }
    await clickText(page, 'button[type="submit"]', 'Ajouter');
    await waitForText(page, 'Localité ajoutée avec succès');
    await new Promise((resolve) => setTimeout(resolve, 150));
    return parentValue;
  };
  await addLocation('Pays E2E', 'COUNTRY');
  await page.select('select[name="level"]', 'REGION');
  const countryId = await selectedValueByText(page, 'select[name="parentId"]', 'Pays E2E');
  await addLocation('Région E2E', 'REGION', 'Pays E2E');
  await addLocation('Ville E2E', 'CITY', 'Région E2E');
  await setValue(page, 'input[aria-label="Rechercher une localité"]', 'Ville E2E');
  assert((await page.$$('tbody tr')).length === 1, 'La recherche de localité ne filtre pas exactement la liste');
  await rowAction(page, 'Ville E2E', 'Modifier');
  await setValue(page, 'input[name="name"]', 'Ville E2E modifiée');
  await clickText(page, 'button[type="submit"]', 'Enregistrer');
  await waitForText(page, 'Localité modifiée avec succès');
  await page.reload({ waitUntil: 'networkidle0' });
  await clickText(page, 'button', 'Localités');
  await setValue(page, 'input[aria-label="Rechercher une localité"]', 'Ville E2E modifiée');
  await waitForText(page, 'Ville E2E modifiée');
  await setValue(page, 'input[aria-label="Rechercher une localité"]', '');
  await setValue(page, 'input[name="name"]', 'Ville E2E modifiée');
  await page.select('select[name="level"]', 'CITY');
  await page.select('select[name="parentId"]', await selectedValueByText(page, 'select[name="parentId"]', 'Région E2E'));
  await clickText(page, 'button[type="submit"]', 'Ajouter');
  await waitForText(page, 'existe déjà');
  await setValue(page, 'input[name="name"]', 'Quartier invalide E2E');
  await page.select('select[name="level"]', 'DISTRICT');
  await page.$eval('select[name="parentId"]', (select, invalidId) => {
    const option = document.createElement('option'); option.value = invalidId; option.text = 'Parent invalide E2E'; select.append(option); select.value = invalidId; select.dispatchEvent(new Event('change', { bubbles: true }));
  }, countryId);
  await clickText(page, 'button[type="submit"]', 'Ajouter');
  await waitForText(page, 'Parent invalide');

  console.log('11-15 Catégories : création, modification, recherche et doublon');
  await page.goto(`${baseUrl}/catalog`, { waitUntil: 'networkidle0' });
  await clickText(page, 'button', 'Catégories');
  await setValue(page, 'input[name="name"]', 'Catégorie E2E');
  await clickText(page, 'button[type="submit"]', 'Ajouter');
  await waitForText(page, 'Catégorie ajoutée avec succès');
  await rowAction(page, 'Catégorie E2E', 'Modifier');
  await setValue(page, 'input[name="name"]', 'Catégorie E2E modifiée');
  await clickText(page, 'button[type="submit"]', 'Enregistrer');
  await waitForText(page, 'Catégorie modifiée avec succès');
  await setValue(page, 'input[aria-label="Rechercher une catégorie"]', 'modifiée');
  assert((await page.$$('tbody tr')).length === 1, 'La recherche de catégorie modifiée est incorrecte');
  await setValue(page, 'input[aria-label="Rechercher une catégorie"]', '');
  await setValue(page, 'input[name="name"]', 'Catégorie E2E modifiée');
  await clickText(page, 'button[type="submit"]', 'Ajouter');
  await waitForText(page, 'existe déjà');

  console.log('16-24 Catalogue : création, modification, prix exact, recherche, filtres et prix négatif');
  await clickText(page, 'button', 'Produits & Services');
  const categoryId = await selectedValueByText(page, 'select[name="categoryId"]', 'Catégorie E2E modifiée');
  const createProduct = async (name, type, price) => {
    await setValue(page, 'input[name="name"]', name);
    await page.click(`input[type="radio"][value="${type}"]`);
    await setValue(page, 'input[name="unitPriceMinor"]', price);
    await page.select('select[name="categoryId"]', categoryId);
    await clickText(page, 'button[type="submit"]', 'Ajouter');
    await waitForText(page, 'ajouté avec succès');
    await new Promise((resolve) => setTimeout(resolve, 150));
  };
  await createProduct('Produit E2E', 'PRODUCT', 25000);
  await rowAction(page, 'Produit E2E', 'Modifier');
  await setValue(page, 'input[name="name"]', 'Produit E2E modifié');
  await setValue(page, 'input[name="unitPriceMinor"]', 27501);
  await clickText(page, 'button[type="submit"]', 'Enregistrer');
  await waitForText(page, 'modifié avec succès');
  await createProduct('Service E2E', 'SERVICE', 19000);
  await setValue(page, 'input[aria-label="Rechercher dans le catalogue"]', 'Produit E2E modifié');
  await waitForText(page, '27501 FCFA');
  assert((await page.$$('tbody tr')).length === 1, 'Recherche catalogue incorrecte');
  await page.select('select[aria-label="Filtrer par catégorie"]', categoryId);
  assert((await page.$$('tbody tr')).length === 1, 'Filtre catégorie incorrect');
  await setValue(page, 'input[aria-label="Rechercher dans le catalogue"]', '');
  await page.select('select[aria-label="Filtrer par type"]', 'SERVICE');
  assert((await page.$$('tbody tr')).length === 1 && (await page.$eval('tbody', (body) => body.innerText.includes('Service E2E'))), 'Filtre type incorrect');
  await page.select('select[aria-label="Filtrer par type"]', '');
  await page.select('select[aria-label="Filtrer par statut"]', '');
  assert((await page.$$('tbody tr')).length === 2, 'Filtre statut actif incorrect');
  await setValue(page, 'input[name="name"]', 'Prix négatif E2E');
  await setValue(page, 'input[name="unitPriceMinor"]', -1);
  await clickText(page, 'button[type="submit"]', 'Ajouter');
  await waitForText(page, 'Le prix ne peut pas être négatif');

  console.log('25-33 Prospect : associations, filtres, archivage et historique');
  await page.goto(`${baseUrl}/prospects/nouveau`, { waitUntil: 'networkidle0' });
  await setValue(page, 'input[name="displayName"]', 'Prospect Sprint 2 E2E');
  await setValue(page, 'input[name="whatsappPhone"]', '+221771234599');
  const locationId = await selectedValueByText(page, 'select[name="locationId"]', 'Ville E2E modifiée');
  await page.select('select[name="locationId"]', locationId);
  await page.click('input[type="checkbox"][value]:not(:disabled)');
  await page.$$eval('input[name="productIds"]:not(:disabled)', (checkboxes) => checkboxes.forEach((checkbox) => { if (!checkbox.checked) checkbox.click(); }));
  await clickText(page, 'button[type="submit"]', 'Enregistrer');
  await page.waitForFunction(() => location.pathname.startsWith('/prospects/') && !location.pathname.endsWith('/nouveau'));
  const prospectUrl = page.url();
  await waitForText(page, 'Ville E2E modifiée');
  await waitForText(page, 'Produit E2E modifié');
  await waitForText(page, 'Service E2E');
  await page.reload({ waitUntil: 'networkidle0' });
  await waitForText(page, 'Produit E2E modifié');
  await page.goto(`${baseUrl}/prospects`, { waitUntil: 'networkidle0' });
  await page.select('select[aria-label="Filtrer par localité"]', locationId);
  await waitForText(page, 'Prospect Sprint 2 E2E');
  const productFilterValue = await selectedValueByText(page, 'select[aria-label="Filtrer par produit"]', 'Produit E2E modifié');
  await page.select('select[aria-label="Filtrer par produit"]', productFilterValue);
  await waitForText(page, 'Prospect Sprint 2 E2E');
  page.once('dialog', (dialog) => dialog.accept());
  await page.goto(`${baseUrl}/settings`, { waitUntil: 'networkidle0' });
  await clickText(page, 'button', 'Localités');
  await rowAction(page, 'Ville E2E modifiée', 'Archiver');
  await page.waitForFunction((name) => !document.body.innerText.includes(name), {}, 'Ville E2E modifiée');
  page.once('dialog', (dialog) => dialog.accept());
  await page.goto(`${baseUrl}/catalog`, { waitUntil: 'networkidle0' });
  await rowAction(page, 'Produit E2E modifié', 'Archiver');
  await page.waitForFunction((name) => !document.body.innerText.includes(name), {}, 'Produit E2E modifié');
  await page.goto(`${baseUrl}/prospects/nouveau`, { waitUntil: 'networkidle0' });
  assert(!(await page.$eval('select[name="locationId"]', (select) => select.innerText.includes('Ville E2E modifiée'))), 'Localité archivée encore proposée');
  assert(!(await page.$eval('fieldset', (fieldset) => fieldset.innerText.includes('Produit E2E modifié'))), 'Produit archivé encore proposé');
  await page.goto(prospectUrl, { waitUntil: 'networkidle0' });
  await waitForText(page, 'Ville E2E modifiée (Archivée)');
  await waitForText(page, 'Produit E2E modifié (Inactif)');

  console.log('34-39 Hors ligne : navigation, modification, actualisation et IndexedDB réel');
  await page.goto(`${baseUrl}/settings`, { waitUntil: 'networkidle0' });
  await page.goto(`${baseUrl}/catalog`, { waitUntil: 'networkidle0' });
  await page.goto(prospectUrl, { waitUntil: 'networkidle0' });
  state.offline = true;
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Prospect Sprint 2 E2E');
  await page.goto(`${baseUrl}/settings`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="name"]');
  assert(await page.$eval('input[name="name"]', (input) => input.value) === 'SAMTECH E2E', 'Paramètres indisponibles hors ligne');
  await setValue(page, 'input[name="address"]', 'Adresse hors ligne persistée');
  await clickText(page, 'button[type="submit"]', 'Enregistrer');
  await waitForText(page, 'Paramètres enregistrés avec succès');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(await page.$eval('input[name="address"]', (input) => input.value) === 'Adresse hors ligne persistée', 'Modification hors ligne non persistée dans l’interface');
  const persistedAddress = await page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open('SamtechCRMDatabase');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('settings', 'readonly');
      const getRequest = transaction.objectStore('settings').get('company.profile');
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => resolve(getRequest.result?.value?.address);
    };
  }));
  assert(persistedAddress === 'Adresse hors ligne persistée', 'Valeur hors ligne absente du véritable IndexedDB Chromium');
  await page.goto(`${baseUrl}/catalog`, { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Service E2E');
  await page.goto(prospectUrl, { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Produit E2E modifié (Inactif)');
}

(async () => {
  let server;
  let browser;
  const serverOutput = [];
  const state = { offline: false };
  const counts = { consoleErrors: 0, warnings: 0, pageErrors: 0, onlineRequestFailures: 0, offlineRequestFailures: 0, cancelledRscRequests: 0 };
  try {
    assert(fs.existsSync(path.join(projectRoot, '.next', 'BUILD_ID')), 'Build de production absent : exécutez npm run build avant l’E2E.');
    assert(!(await portIsOccupied()), `Le port E2E ${port} est déjà occupé; aucun serveur étranger ne sera réutilisé.`);
    const nextBin = require.resolve('next/dist/bin/next');
    server = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', (chunk) => serverOutput.push(chunk.toString()));
    server.stderr.on('data', (chunk) => serverOutput.push(chunk.toString()));
    await waitForServer(server, serverOutput);

    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    let rejectBrowserError;
    const browserError = new Promise((_, reject) => { rejectBrowserError = reject; });
    page.on('console', (message) => {
      if (message.type() === 'warning') counts.warnings += 1;
      if (message.type() === 'error') { counts.consoleErrors += 1; rejectBrowserError(new Error(`console.error applicative: ${message.text()}`)); }
    });
    page.on('pageerror', (error) => { counts.pageErrors += 1; rejectBrowserError(new Error(`Exception de page: ${error.message}`)); });
    page.on('requestfailed', (request) => {
      if (state.offline) counts.offlineRequestFailures += 1;
      else if (request.failure()?.errorText === 'net::ERR_ABORTED' && request.url().includes('_rsc=')) {
        // Next.js annule normalement une requête RSC devenue obsolète lors d'une redirection client immédiate.
        counts.cancelledRscRequests += 1;
      } else { counts.onlineRequestFailures += 1; rejectBrowserError(new Error(`Requête échouée en ligne: ${request.url()} — ${request.failure()?.errorText || 'raison inconnue'}`)); }
    });
    await Promise.race([runScenario(page, state), browserError]);
    console.log(`Erreurs console: ${counts.consoleErrors}; avertissements: ${counts.warnings}; exceptions page: ${counts.pageErrors}; requêtes échouées en ligne: ${counts.onlineRequestFailures}; requêtes RSC annulées par navigation: ${counts.cancelledRscRequests}; requêtes réseau attendues hors ligne: ${counts.offlineRequestFailures}.`);
    assert(counts.consoleErrors === 0 && counts.pageErrors === 0 && counts.onlineRequestFailures === 0, 'Des erreurs navigateur ont été capturées.');
    console.log('✅ E2E Sprint 2 : 39 assertions fonctionnelles réussies.');
  } catch (error) {
    console.error(`❌ E2E Sprint 2 : ${error instanceof Error ? error.stack || error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      server.kill();
      await Promise.race([new Promise((resolve) => server.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 3000))]);
    }
  }
})();
