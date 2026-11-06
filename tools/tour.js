// Playwright tour: teleports to spots across the world and screenshots each.
const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const spots = JSON.parse(process.argv[3] || '[]');
  const touch = process.argv[4] !== 'desktop';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 932, height: 430 }, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch, userAgent: touch ? devices['iPhone 13 Pro Max'].userAgent : undefined });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '')));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.evaluate(() => { localStorage.clear(); AM.newGame(); AM.S.fade = null; AM.S.center = null; window.DEBUG_FPS = true; });
  for (const sp of spots) {
    await page.evaluate(sp => { const S = AM.S; S.px = sp[0]; S.py = sp[1]; S.pa = sp[2]; S.pitch = 0; if (sp[4]) eval(sp[4]); }, sp);
    await page.waitForTimeout(sp[5] || 500);
    await page.screenshot({ path: path.join(out, 'tour_' + sp[3] + '.png') });
  }
  console.log('errors:', errors.length); errors.slice(0, 10).forEach(e => console.log(e));
  await browser.close();
})();
