// Fast-forward soak test: runs the battle at N sim steps per frame and logs floors, wipes, bosses, errors, frame rate.
const { chromium } = require('playwright');
(async () => {
  const secs = +(process.argv[2] || 60), turbo = +(process.argv[3] || 6);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => window.CR && window.CR.G.mode === 'play', null, { timeout: 30000 });
  await page.evaluate(t => { window.CR_TURBO = t; window.__f = 0; const tick = () => { window.__f++; requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, turbo);
  const t0 = Date.now(); let lastKey = '';
  while ((Date.now() - t0) / 1000 < secs) {
    await page.waitForTimeout(3000);
    const st = await page.evaluate(() => { const G = CR.G, f = window.__f; window.__f = 0; return { simT: G.time.toFixed(0), fps: (f / 3).toFixed(0), floor: G.floor, run: G.run, phase: G.phase, wave: G.wave + '/' + G.waves, mons: G.mons.length, boss: G.boss ? (G.boss.dead ? 'dead' : Math.round(G.boss.hp) + '/' + G.boss.maxHp) : '-', kills: G.kills, heroes: G.heroes.map(h => h.dead ? 'X' : Math.round(h.hp / h.maxHp * 100) + '%').join(' '), parts: CR.FX.P.length, res: CR.Q.res, err: (window.CR_ERR || []).length }; });
    const key = st.floor + st.run + st.phase + st.wave + st.boss; if (key !== lastKey || st.err) { console.log(JSON.stringify(st)); lastKey = key; }
  }
  console.log('errors:', errs.length); errs.slice(0, 8).forEach(e => console.log(e));
  const ce = await page.evaluate(() => window.CR_ERR); if (ce) console.log('CR_ERR', ce);
  await browser.close();
})();
