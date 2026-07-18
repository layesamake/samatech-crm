/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { launchBrowser, seedMinimal, startProductionServer, stopProductionServer } = require('./v1-beta-helpers');

const port = Number(process.env.LIGHTHOUSE_PORT || 3805);
const percent = (value) => Math.round((value || 0) * 100);

(async () => {
  let server; let browser;
  try {
    const running = await startProductionServer(port); server = running.server;
    ({ browser } = await launchBrowser());
    const seedPage = (await browser.pages())[1] || await browser.newPage();
    await seedPage.goto(running.baseUrl, { waitUntil: 'networkidle0' }); await seedMinimal(seedPage); await seedPage.close();
    const lighthouse = (await import('lighthouse')).default;
    const browserPort = Number(new URL(browser.wsEndpoint()).port);
    const reports = [];
    for (const route of ['/', '/prospects']) {
      const run = await lighthouse(`${running.baseUrl}${route}`, {
        port: browserPort,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: 'simulate',
      });
      assert.ok(run?.lhr, `Rapport Lighthouse absent pour ${route}.`);
      const { categories, audits } = run.lhr;
      reports.push({
        route,
        performance: percent(categories.performance.score),
        accessibility: percent(categories.accessibility.score),
        bestPractices: percent(categories['best-practices'].score),
        seo: percent(categories.seo.score),
        fcpMs: Math.round(audits['first-contentful-paint'].numericValue),
        lcpMs: Math.round(audits['largest-contentful-paint'].numericValue),
        tbtMs: Math.round(audits['total-blocking-time'].numericValue),
        cls: Number(audits['cumulative-layout-shift'].numericValue.toFixed(3)),
      });
    }
    console.log(JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error(`Audit Lighthouse échoué: ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1;
  } finally { if (browser) await browser.close(); await stopProductionServer(server); }
})();
