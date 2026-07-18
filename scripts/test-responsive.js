/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { launchBrowser, seedMinimal, startProductionServer, stopProductionServer } = require('./v1-beta-helpers');

const widths = [320, 360, 390, 768, 1024, 1440];
const routes = ['/', '/prospects', '/prospects/nouveau', '/prospects/contact1', '/clients', '/clients/client1', '/catalog', '/follow-ups', '/campaigns', '/invoices', '/payments', '/statistics', '/settings/backup', '/settings/security'];

(async () => {
  const startedAt = Date.now(); let server; let browser; let checks = 0; const overflows = [];
  try {
    const running = await startProductionServer(Number(process.env.RESPONSIVE_PORT || 3802)); server = running.server; ({ browser } = await launchBrowser()); const page = (await browser.pages())[1] || await browser.newPage();
    await page.goto(running.baseUrl, { waitUntil: 'networkidle0' }); await seedMinimal(page);
    for (const width of widths) {
      await page.setViewport({ width, height: width === 320 ? 568 : 844, deviceScaleFactor: 1 });
      for (const route of routes) {
        await page.goto(`${running.baseUrl}${route}`, { waitUntil: 'networkidle0' });
        const result = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth, clipped: Array.from(document.querySelectorAll('button,a,input,select,textarea')).filter((node) => { const box = node.getBoundingClientRect(); if (box.width === 0 || (box.right >= 0 && box.left <= innerWidth)) return false; let parent = node.parentElement; while (parent) { const style = getComputedStyle(parent); if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && parent.scrollWidth > parent.clientWidth) return false; parent = parent.parentElement; } return true; }).length }));
        checks += 1; if (result.documentWidth > result.viewportWidth + 1 || result.clipped > 0) overflows.push({ width, route, ...result });
      }
    }
    await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 }); await page.goto(`${running.baseUrl}/settings/security`, { waitUntil: 'networkidle0' }); checks += 1;
    assert.deepEqual(overflows, [], `Débordements: ${JSON.stringify(overflows)}`);
    console.log(`Responsive: ${checks} contrôles, ${widths.join('/')} px + paysage 844x390, ${routes.length} routes, ${overflows.length} débordement, ${Date.now() - startedAt} ms.`);
  } catch (error) { console.error(`Test responsive échoué: ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; }
  finally { if (browser) await browser.close(); await stopProductionServer(server); }
})();
