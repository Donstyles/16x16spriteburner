const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const r = await page.evaluate(async () => {
    const S = AM.Snd; S.init(); const out = { ctx: !!S.ctx, state: S.ctx && S.ctx.state, bad: [] };
    const src = S.sfx.toString(); const names = [...src.matchAll(/case '([a-z]+)'/g)].map(m => m[1]);
    for (const n of names) { try { S.last = {}; S.sfx(n); } catch (e) { out.bad.push(n + ': ' + e.message); } }
    for (const k of ['ambient', 'boss', 'title', 'none']) { try { S.music(k); S.update(10, k === 'boss'); S.update(10, false); } catch (e) { out.bad.push('music ' + k + ': ' + e.message); } }
    out.n = names.length; return out;
  });
  console.log(JSON.stringify(r)); console.log('errors', errors.length, errors.slice(0, 5).join(' | '));
  await browser.close();
})();
