// Headless check: boots the page at phone-landscape size, records errors, takes timed screenshots, reports state.
// usage: node tools/shots.js <outdir> [seconds] [turbo] [width] [height]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp', secs = +(process.argv[3] || 20), turbo = +(process.argv[4] || 1), W = +(process.argv[5] || 932), H = +(process.argv[6] || 430);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => window.CR && window.CR.G.mode === 'play', null, { timeout: 30000 });
  await page.evaluate(t => { window.CR_TURBO = t; }, turbo);
  const t0 = Date.now(); let i = 0;
  while ((Date.now() - t0) / 1000 < secs) {
    await page.waitForTimeout(Math.min(4000, secs * 1000 / 6));
    const st = await page.evaluate(() => { const G = CR.G; return { t: G.time.toFixed(1), floor: G.floor, run: G.run, phase: G.phase, wave: G.wave + '/' + G.waves, mons: G.mons.length, kills: G.kills, heroes: G.heroes.map(h => h.dead ? 'X' : Math.round(h.hp)).join('/'), ult: G.heroes.map(h => Math.round(h.ult)).join('/'), parts: CR.FX.P.length, bolts: CR.FX.bolts.length, res: CR.Q.res, zoom: CR.CAM.z.toFixed(2), err: window.CR_ERR }; });
    console.log(JSON.stringify(st));
    await page.screenshot({ path: path.join(out, `shot_${i++}.png`) });
  }
  console.log('errors:', errs.length); errs.slice(0, 8).forEach(e => console.log(e));
  await browser.close();
})();
