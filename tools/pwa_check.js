// Checks service worker registration + manifest on the multi-file build, and that the single-file dist build boots.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const url of ['http://127.0.0.1:8787/index.html', 'http://127.0.0.1:8787/dist/index.html']) {
    const ctx = await browser.newContext({ viewport: { width: 932, height: 430 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(async () => {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      const man = document.querySelector('link[rel=manifest]');
      let manifestOk = false; try { const r = await fetch(man.href); const j = await r.json(); manifestOk = j.name === 'Ashen Mandate' && j.icons.length === 2; } catch (e) { manifestOk = 'err ' + e.message; }
      return { sw: !!reg, swActive: !!(reg && (reg.active || reg.installing || reg.waiting)), manifestOk, icon: !!document.querySelector('link[rel=apple-touch-icon]'), title: document.title, w: AM.R.VW, h: AM.R.VH };
    });
    console.log(url, JSON.stringify(info), 'errors', errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  await browser.close();
})();
