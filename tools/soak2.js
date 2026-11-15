// Soak test for Cellar of Ruin II: the test pilot plays a run with the given kit at N sim steps per frame.
// usage: node tools/soak2.js <seconds> <turbo> <kit> [url]
const { chromium } = require('playwright');
(async () => {
  const secs = +(process.argv[2] || 60), turbo = +(process.argv[3] || 4), kit = process.argv[4] || 'sellsword', url = process.argv[5] || 'http://127.0.0.1:8787/crawler/index.html';
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const page = await (await b.newContext({ viewport: { width: 932, height: 430 } })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await page.goto(url); await page.waitForFunction(() => window.CR && CR.G.mode === 'menu', null, { timeout: 30000 });
  await page.evaluate(([k, t]) => { window.CR_BOT = true; window.CR_TURBO = t; CR.beginRun(k); window.__f = 0; const tick = () => { window.__f++; requestAnimationFrame(tick); }; requestAnimationFrame(tick); window.__runs = 1;
    setInterval(() => { if (CR.G.mode !== 'play') { window.__runs++; CR.beginRun(k); } }, 500); }, [kit, turbo]);
  const t0 = Date.now(); let lastKey = '', last = null;
  while ((Date.now() - t0) / 1000 < secs) {
    await page.waitForTimeout(3000);
    const st = await page.evaluate(() => { const G = CR.G, h = G.me, f = window.__f; window.__f = 0; return { run: window.__runs, floor: G.floor, phase: G.phase, hp: h ? Math.round(h.hp) + '/' + h.maxHp : '-', flasks: h ? h.flasks : 0, foes: G.foes.length, kills: G.kills, gold: G.gold, fps: (f / 3).toFixed(0), simT: G.time.toFixed(0), err: (window.CR_ERR || []).length }; });
    last = st; const key = st.run + '/' + st.floor + st.phase; if (key !== lastKey || st.err) { console.log(JSON.stringify(st)); lastKey = key; }
  }
  console.log('final', JSON.stringify(last), 'heavies', await page.evaluate(() => (CR.G.me && CR.G.me.bot && CR.G.me.bot.heavies) || 0));
  console.log('errors:', errs.length); errs.slice(0, 6).forEach(e => console.log(e)); const ce = await page.evaluate(() => window.CR_ERR); if (ce) console.log('CR_ERR', ce);
  await b.close();
})();
