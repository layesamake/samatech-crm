/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchBrowser, putSecurityPin, seedMinimal, startProductionServer, stopProductionServer } = require('./v1-beta-helpers');

const port = Number(process.env.ACCESSIBILITY_PORT || 3801);
const routes = ['/', '/prospects', '/prospects/nouveau', '/prospects/contact1', '/prospects/contact1/modifier', '/clients', '/clients/client1', '/catalog', '/settings', '/follow-ups', '/follow-ups/new?contactId=contact1', '/message-templates', '/campaigns', '/campaigns/new', '/campaigns/campaign1', '/campaigns/campaign1/run', '/invoices', '/invoices/new?clientId=client1', '/invoices/invoice1', '/payments', '/statistics', '/settings/backup', '/settings/security'];

(async () => {
  const startedAt = Date.now(); let server; let browser; let serious = 0; let critical = 0; let total = 0; let keyboardChecks = 0;
  try {
    const running = await startProductionServer(port); server = running.server; ({ browser } = await launchBrowser()); const page = (await browser.pages())[1] || await browser.newPage(); page.setDefaultTimeout(25000);
    await page.goto(running.baseUrl, { waitUntil: 'networkidle0' }); await seedMinimal(page);
    await page.evaluate(() => document.body.focus()); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '#contenu-principal', 'Le premier arrêt clavier doit être le lien d’évitement.'); keyboardChecks += 1;
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'contenu-principal', 'Le lien d’évitement doit déplacer le focus vers le contenu principal.'); keyboardChecks += 1;
    const axePath = require.resolve('axe-core/axe.min.js');
    for (const route of routes) {
      await page.goto(`${running.baseUrl}${route}`, { waitUntil: 'networkidle0' }); await page.addScriptTag({ path: path.resolve(axePath) });
      const result = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
      const blocking = result.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious'); critical += blocking.filter((item) => item.impact === 'critical').length; serious += blocking.filter((item) => item.impact === 'serious').length; total += result.violations.length;
      if (blocking.length) console.log(`${route}: ${blocking.map((item) => `${item.impact}:${item.id}(${item.nodes.length})[${item.nodes.map((node) => node.target.join(' ')).join('|')}]`).join(', ')}`);
    }
    await page.goto(`${running.baseUrl}/settings/security`, { waitUntil: 'networkidle0' }); await putSecurityPin(page); await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="unlock-pin"]'); assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-testid')), 'unlock-pin', 'Le champ PIN doit recevoir le focus à l’ouverture.'); keyboardChecks += 1;
    await page.click('button[type="button"]'); await page.waitForSelector('[data-testid="forgot-phrase"]'); assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-testid')), 'forgot-phrase', 'La phrase destructive doit recevoir le focus à l’ouverture.'); keyboardChecks += 1;
    await page.addScriptTag({ path: path.resolve(axePath) }); const locked = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'] })); const lockedBlocking = locked.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious'); critical += lockedBlocking.filter((item) => item.impact === 'critical').length; serious += lockedBlocking.filter((item) => item.impact === 'serious').length; total += locked.violations.length;
    assert.equal(critical, 0, `${critical} violation(s) critique(s).`); assert.equal(serious, 0, `${serious} violation(s) sérieuse(s).`);
    console.log(`Accessibilité: ${routes.length + 1} écrans, ${keyboardChecks} contrôles clavier/focus, ${total} violation(s) totale(s), ${critical} critique(s), ${serious} sérieuse(s), ${Date.now() - startedAt} ms.`);
  } catch (error) { console.error(`Audit accessibilité échoué: ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; }
  finally { if (browser) await browser.close(); await stopProductionServer(server); }
})();
