// Headless accelerated run of the autoplay bot; reports progress until the ending or a timeout.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp'; const turbo = +(process.argv[3] || 10); const maxMin = +(process.argv[4] || 30);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage(); const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.evaluate(t => { window.HM_TURBO = t; HM.I.press('watch'); }, turbo); await page.waitForTimeout(500);
  const t0 = Date.now(); let last = '';
  while (Date.now() - t0 < maxMin * 60000) {
    await page.waitForTimeout(15000);
    const st = await page.evaluate(() => { const G = HM.G, B = HM.BOT; return { say: B.say, why: B.why, goal: B.cur && (B.cur.k + (B.cur.id ? ':' + B.cur.id : '') + (B.cur.si !== undefined ? '#' + B.cur.si : '')), map: HM.M.id, pos: [HM.G.x | 0, HM.G.y | 0], lv: G.party.map(m => m.lvl).join('/'), hp: G.party.map(m => m.hp).join('/'), gold: G.gold, food: G.food, day: Math.floor(G.time / 1440) + 1, kills: G.kills, quests: Object.entries(G.quests).map(([k, v]) => k + ':' + v[0]).join(' '), mode: G.mode, wipes: B.wipes, done: B.done, screen: G.screen && G.screen.kind, pt: (G.playTime / 60).toFixed(1) }; });
    const line = JSON.stringify(st); if (line !== last) { console.log(((Date.now() - t0) / 60000).toFixed(1) + 'm', line); last = line; }
    if (st.mode === 'ending' || st.done) break;
    if (errors.length) { console.log(errors.slice(0, 3).join('\n')); break; }
  }
  await page.screenshot({ path: path.join(out, 'watch_last.png') });
  console.log('errors', errors.length); errors.slice(0, 5).forEach(e => console.log(e));
  console.log('botlog:', JSON.stringify(await page.evaluate(() => HM.BOT.log.slice(-25))));
  await browser.close();
})();
