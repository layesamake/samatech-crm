// eslint-disable-next-line @typescript-eslint/no-require-imports
const puppeteer = require('puppeteer-core');

async function runTest() {
  console.log('Démarrage du test E2E Prospects Extrême...');
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    let hasConsoleError = false;
    
    // Intercepter les erreurs console
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
        console.error(`[Browser Error] ${msg.text()}`);
        hasConsoleError = true;
      }
    });
    
    page.on('pageerror', err => {
      console.error(`[Page Error] ${err.toString()}`);
      hasConsoleError = true;
    });

    // Intercepter les boîtes de dialogue (ex: confirm d'archivage)
    page.on('dialog', async dialog => {
      console.log('[PAGE DIALOG]', dialog.message());
      await dialog.accept(); // Accepter la confirmation
    });

    // 1. État vide
    console.log('1. Navigation vers /prospects et vérification de l\'état vide...');
    await page.goto('http://localhost:3000/prospects', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Aucun prospect');
    }, { timeout: 5000 });

    // 2. Validation formulaire (Champs obligatoires)
    console.log('2. Test des erreurs de validation...');
    await page.goto('http://localhost:3000/prospects/nouveau', { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    
    // Attendre que les messages d'erreur apparaissent
    await page.waitForFunction(() => document.body.innerText.includes('Le nom est obligatoire'), { timeout: 3000 });
    await page.waitForFunction(() => document.body.innerText.includes('Le numéro WhatsApp est obligatoire'), { timeout: 3000 });

    // 3. Création de deux prospects
    console.log('3. Création du Prospect A (Zinedine Zidane)...');
    await page.waitForSelector('input[name="displayName"]');
    await page.type('input[name="displayName"]', 'Zinedine Zidane');
    await page.type('input[name="whatsappPhone"]', '+33611223344');
    await page.select('select[name="status"]', 'NOUVEAU');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    
    // Vérifier détail
    try {
      await page.waitForFunction(() => document.body.innerText.includes('Zinedine Zidane'), { timeout: 5000 });
    } catch (error) {
      const text = await page.evaluate(() => document.body.innerText);
      console.error('[PAGE TEXT DUMP]', text);
      throw error;
    }

    console.log('3. Création du Prospect B (Lionel Messi)...');
    await page.goto('http://localhost:3000/prospects/nouveau', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="displayName"]');
    await page.type('input[name="displayName"]', 'Lionel Messi');
    await page.type('input[name="whatsappPhone"]', '+54911223344');
    await page.select('select[name="status"]', 'CONTACTE');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());

    await page.waitForFunction(() => document.body.innerText.includes('Lionel Messi'), { timeout: 5000 });

    // 4. Recherche par nom
    console.log('4. Recherche par nom...');
    await page.goto('http://localhost:3000/prospects', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'zidane');
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Zinedine Zidane') && !text.includes('Lionel Messi');
    }, { timeout: 3000 });

    // 5. Recherche par téléphone
    console.log('5. Recherche par téléphone...');
    // Clear input
    await page.click('input[type="text"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('input[type="text"]', '54911');
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Lionel Messi') && !text.includes('Zinedine Zidane');
    }, { timeout: 3000 });

    // 6. Filtres
    console.log('6. Filtre par statut (CONTACTE)...');
    await page.click('input[type="text"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    await page.select('select', 'CONTACTE');
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Lionel Messi') && !text.includes('Zinedine Zidane');
    }, { timeout: 3000 });

    // Reset filter
    await page.select('select', '');
    
    await page.waitForFunction(() => document.body.innerText.includes('Zinedine Zidane'), { timeout: 3000 });

    // 7. Modification et Doublon
    console.log('7. Modification et tentative de doublon...');
    // Clic sur Zinedine Zidane
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const zidaneLink = links.find(l => l.textContent.includes('Zinedine Zidane'));
      if(zidaneLink) zidaneLink.click();
    });
    await page.waitForSelector('a[href$="/modifier"]'); // Wait for detail page
    await page.evaluate(() => {
      document.querySelector('a[href$="/modifier"]').click();
    });
    
    await page.waitForSelector('input[name="whatsappPhone"]');
    // Change phone to Messi's phone to trigger duplicate
    await page.evaluate(() => {
      const input = document.querySelector('input[name="whatsappPhone"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '+54911223344');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    
    // Wait for warning
    await page.waitForFunction(() => document.body.innerText.includes('existe déjà'), { timeout: 3000 });
    
    // Force duplicate
    console.log('   Doublon détecté. Forçage de la modification...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.innerText.includes('Confirmer quand même'));
      if(confirmBtn) confirmBtn.click();
    });
    
    // Attendre la redirection sur la page de détail (Zinedine Zidane)
    await page.waitForFunction(() => document.body.innerText.includes('+54911223344'), { timeout: 5000 });

    // 8. Archivage
    console.log('8. Archivage de Zinedine Zidane...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const archiveBtn = btns.find(b => b.innerText.includes('Archiver'));
      if(archiveBtn) archiveBtn.click();
    });

    // Attendre retour liste
    await page.waitForFunction(() => document.body.innerText.includes('Prospects'), { timeout: 5000 });
    
    // Vérifier disparition
    console.log('   Vérification disparition...');
    let listText = await page.evaluate(() => document.body.innerText);
    if (listText.includes('Zinedine Zidane')) throw new Error('Zidane devrait être masqué.');

    // Afficher archives
    console.log('   Affichage des archives...');
    await page.evaluate(() => {
      const checkbox = document.querySelector('input[type="checkbox"]');
      if(checkbox) checkbox.click();
    });
    
    await page.waitForFunction(() => document.body.innerText.includes('Zinedine Zidane'), { timeout: 3000 });

    // 9. Passage hors ligne
    console.log('9. Passage hors ligne et vérification persistante...');
    await page.setOfflineMode(true);
    await page.reload({ waitUntil: 'networkidle0' });
    
    listText = await page.evaluate(() => document.body.innerText);
    if (!listText.includes('Lionel Messi')) throw new Error('Messi devrait être visible hors ligne.');

    if (hasConsoleError) {
      throw new Error('Des erreurs JavaScript ont été détectées dans la console.');
    }

    console.log('10. Tests réussis ! Toutes les étapes ont été validées.');

  } catch (error) {
    console.error('❌ Échec du test :', error);
    try { await page.screenshot({ path: 'error.png' }); } catch { }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
