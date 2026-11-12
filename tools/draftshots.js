// Pre-game draft, auto-draft, and the spellbook view.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp', W = +(process.argv[3] || 932), H = +(process.argv[4] || 430), tag = process.argv[5] || 'l';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => window.CR && window.CR.G.mode === 'play', null, { timeout: 30000 });
  await page.waitForFunction(() => CR.G.choice && CR.G.choice.kind === 'draft', null, { timeout: 15000 });
  await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, tag + '_draft1.png') });
  const clickCard = async i => { const r = await page.evaluate(i => CR.G.choice && CR.G.choice.rects[i], i); if (r) await page.mouse.click(r[0] + r[2] / 2, r[1] + r[3] / 2); };
  await clickCard(1); await page.waitForTimeout(900); await page.screenshot({ path: path.join(out, tag + '_draft2.png') });
  await clickCard(0); await page.waitForTimeout(900);
  const dr = await page.evaluate(() => CR.UI.draftRect); if (dr) await page.mouse.click(dr[0] + dr[2] / 2, dr[1] + dr[3] / 2);
  await page.waitForTimeout(400);
  const st = await page.evaluate(() => ({ basic: CR.G.basic, known: [...CR.G.known], q: CR.G.choiceQ.length, choice: !!CR.G.choice, waveT: CR.G.waveT.toFixed(2) }));
  console.log('after auto-draft', JSON.stringify(st));
  await page.waitForTimeout(2500); await page.screenshot({ path: path.join(out, tag + '_countdown.png') });
  // a mid-run build to show off in the spellbook
  await page.evaluate(() => { const G = CR.G; for (const n of ['FLAME WALL', 'HEAT RAY', 'LIGHTNING LANCE', 'TESLA COIL', 'STONE FIST', 'BLADE FLURRY', 'SWORD WAVE', 'ENTANGLE']) G.known.add(n); const take = (s, m) => { const mods = CR.MODS[s].find(x => x[0] === m); (G.modsTaken[s] = G.modsTaken[s] || []).push(m); }; take('HEAT RAY', 'WIDER BEAM'); take('HEAT RAY', 'LONG BURN'); take('SWORD WAVE', 'TWIN WAVES'); take(G.basic.pyro, CR.MODS[G.basic.pyro][1][0]); take('TESLA COIL', 'TWIN COILS'); });
  await page.waitForTimeout(1500);
  await page.keyboard.press('b'); await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, tag + '_book.png') });
  const paused1 = await page.evaluate(() => CR.G.time); await page.waitForTimeout(800); const paused2 = await page.evaluate(() => CR.G.time);
  await page.mouse.click(W / 2, H / 2); await page.waitForTimeout(400);
  console.log('book pauses battle:', paused1 === paused2, 'closed:', !(await page.evaluate(() => CR.UI.bookOpen)));
  await page.screenshot({ path: path.join(out, tag + '_plates.png') });
  console.log('errors', errs.length, errs.slice(0, 4).join('\n'));
  await browser.close();
})();
