// Single-hero flow: hero select, basic, first skill, then steering, dashing and casting by hand.
// usage: node tools/soloshots.js <outdir> [W H tag touch(0|1) heroIndex]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp', W = +(process.argv[3] || 932), H = +(process.argv[4] || 430), tag = process.argv[5] || 'l', touch = process.argv[6] === '1', hi = +(process.argv[7] || 1);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => window.CR && window.CR.G.mode === 'play', null, { timeout: 30000 });
  await page.waitForFunction(() => CR.G.choice && CR.G.choice.kind === 'draft', null, { timeout: 15000 });
  await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, tag + '_hero.png') });
  const V = await page.evaluate(() => ({ rot: CR.VIEW.rot, iw: CR.VIEW.iw, w: CR.VIEW.w, h: CR.VIEW.h })); console.log('view', JSON.stringify(V));
  const scr = (gx, gy) => V.rot ? [V.iw - gy, gx] : [gx, gy];
  const tapCard = async i => { const r = await page.evaluate(i => CR.G.choice && CR.G.choice.rects[i], i); if (!r) return console.log('no card', i); const [x, y] = scr(r[0] + r[2] / 2, r[1] + r[3] / 2); if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
  await tapCard(hi); await page.waitForTimeout(900); await page.screenshot({ path: path.join(out, tag + '_basic.png') });
  await tapCard(0); await page.waitForTimeout(900); await page.screenshot({ path: path.join(out, tag + '_skill.png') });
  await tapCard(0); await page.waitForTimeout(600);
  console.log('after draft', JSON.stringify(await page.evaluate(() => ({ heroes: CR.G.heroes.map(h => h.key + ':' + h.ctrl), basic: CR.G.basic, slots: CR.G.slots, known: [...CR.G.known], hp: CR.G.heroes[0].maxHp }))));
  await page.waitForFunction(() => CR.G.phase === 'fight' && CR.G.wave >= 1, null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  // steer with the keyboard, dash, cast slot 1
  const p0 = await page.evaluate(() => [CR.G.heroes[0].x, CR.G.heroes[0].y]);
  if (!touch) { await page.keyboard.down('KeyA'); await page.waitForTimeout(900); await page.keyboard.up('KeyA'); }
  const p1 = await page.evaluate(() => [CR.G.heroes[0].x, CR.G.heroes[0].y]);
  console.log('moved', (p1[0] - p0[0]).toFixed(1), (p1[1] - p0[1]).toFixed(1));
  if (!touch) { await page.keyboard.press('Space'); await page.waitForTimeout(250); console.log('dash cd', await page.evaluate(() => CR.G.dashCd.toFixed(2))); await page.keyboard.press('Digit1'); }
  else { const b = await page.evaluate(() => CR.CTRL.buttons.find(b => b.slot === 0)); if (b) await page.touchscreen.tap(...scr(b.x, b.y)); }
  await page.waitForTimeout(450); await page.screenshot({ path: path.join(out, tag + '_cast.png') });
  console.log('slot1 cd', await page.evaluate(() => { const h = CR.G.heroes[0], n = CR.G.slots[0]; return n + ' ' + (h.cd[n] || 0).toFixed(2); }));
  // hold a thumb-stick drag on touch to show it
  if (touch) {
    const cdp = await page.context().newCDPSession(page); const gx0 = V.w * 0.2, gy0 = V.h * 0.7; const [sx, sy] = scr(gx0, gy0);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] });
    for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [(([x, y]) => ({ x, y }))(scr(gx0 + k * 6, gy0 - k * 3))] }); await page.waitForTimeout(60); }
    await page.waitForTimeout(500); await page.screenshot({ path: path.join(out, tag + '_stick.png') });
    const p2 = await page.evaluate(() => [CR.G.heroes[0].x, CR.G.heroes[0].y]); console.log('stick moved', (p2[0] - p1[0]).toFixed(1), (p2[1] - p1[1]).toFixed(1));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await page.waitForTimeout(4000); await page.screenshot({ path: path.join(out, tag + '_fight.png') });
  console.log('state', JSON.stringify(await page.evaluate(() => ({ phase: CR.G.phase, wave: CR.G.wave, mons: CR.G.mons.length, hp: Math.round(CR.G.heroes[0].hp) + '/' + CR.G.heroes[0].maxHp, lvl: CR.G.lvl, auto: CR.G.autoMode, kills: CR.G.kills }))));
  console.log('errors', errs.length, errs.slice(0, 4).join('\n'));
  await browser.close();
})();
