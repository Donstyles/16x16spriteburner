// Photograph the opening countdown and the spell choice screen.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp', W = +(process.argv[3] || 932), H = +(process.argv[4] || 430), tag = process.argv[5] || 'l';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => window.CR && window.CR.G.mode === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(4600); await page.screenshot({ path: path.join(out, tag + '_countdown.png') });
  await page.waitForTimeout(2200); await page.screenshot({ path: path.join(out, tag + '_fight.png') });
  await page.evaluate(() => { const G = CR.G; while (G.lvl < 6) CR.gainXp(CR.xpFor(G.lvl + 1) - G.xp); G.choiceQ.length = 0; G.choice = null; G.known.add('HEAT RAY'); G.known.add('CINDER SPRAY'); G.lvl = 6; window.CR_AUTO = 30; CR.gainXp(CR.xpFor(7) - G.xp); });
  await page.waitForTimeout(1200); await page.screenshot({ path: path.join(out, tag + '_choice.png') });
  const r = await page.evaluate(() => { const c = CR.G.choice; return c ? c.rects[1] : null; });
  if (r) { await page.mouse.click(r[0] + r[2] / 2, r[1] + r[3] / 2); await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, tag + '_picked.png') }); }
  console.log('choice opts', JSON.stringify(await page.evaluate(() => CR.G.bq.map(b => b.a).concat(CR.G.banner ? [CR.G.banner.a] : []))));
  console.log('errors', errs.length, errs.slice(0, 3).join('\n'));
  await browser.close();
})();
