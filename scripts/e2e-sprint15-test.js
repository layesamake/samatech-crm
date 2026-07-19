const puppeteer = require('puppeteer');
const assert = require('assert');

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  let passed = 0;
  let failed = 0;

  function print(msg, isError = false) {
    if (isError) {
      console.error('❌ ' + msg);
      failed++;
    } else {
      console.log('✅ ' + msg);
      passed++;
    }
  }

  try {
    console.log('--- DEBUT SPRINT 15 E2E ---');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('body', { timeout: 30000 });
    await page.waitForSelector('aside, nav', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Menu Ventes (Sprint 14) and Reports (Sprint 15) validation
    console.log('Vérification du menu Rapports...');
    const reportsLink = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).some(a => a.href.includes('/reports'));
    });
    
    if (reportsLink) print('Lien vers /reports trouvé dans la navigation.');
    else print('Lien vers /reports introuvable.', true);

    // Validation des pages de rapports
    const pagesToCheck = [
      '/reports',
      '/reports/commercial',
      '/reports/financial',
      '/reports/receivables',
      '/reports/exports',
      '/settings/backup'
    ];

    for (const p of pagesToCheck) {
      console.log(`Navigation vers ${p}...`);
      await page.goto(`http://localhost:3000${p}`);
      await new Promise(r => setTimeout(r, 500)); // laisser le temps à la page de rendre
      
      const content = await page.content();
      if (content.includes('404') && !content.includes('Sauvegarde')) {
        print(`Page ${p} semble introuvable (404).`, true);
      } else {
        print(`Page ${p} chargée avec succès.`);
      }
    }

  } catch (err) {
    console.error('Erreur inattendue:', err);
    failed++;
  } finally {
    await browser.close();
    console.log(`\n--- RESULTATS ---`);
    console.log(`Passés : ${passed}`);
    console.log(`Échoués : ${failed}`);
    if (failed > 0) process.exit(1);
    process.exit(0);
  }
}

run();
