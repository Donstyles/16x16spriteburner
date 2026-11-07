const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 932, height: 430 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: devices['iPhone 13 Pro Max'].userAgent });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.touchscreen.tap(466, 268); await page.waitForTimeout(300); await page.evaluate(() => HM.I.press('begin')); await page.waitForTimeout(1500);
  const shot = async n => { await page.evaluate(() => { HM.G.notice = null; HM.G.fadeT = 0; }); await page.waitForTimeout(150); await page.screenshot({ path: path.join(out, 'g_' + n + '.png') }); };
  // touch joystick visible: simulate a touch on the left
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 160, y: 300, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 160, y: 262, id: 1 }] });
  await page.waitForTimeout(700); await shot('town_touch');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  // warrens with a fight
  await page.evaluate(() => { HM.enterMap('warrens', null, null); const G = HM.G; const near = G.monsters.filter(m => Math.hypot(m.x - G.x, m.y - G.y) < 14).slice(0, 3); near.forEach((m, i) => { m.x = G.x + 2 + i; m.y = G.y + (i - 1) * 0.8; m.aware = true; }); });
  await page.waitForTimeout(900); await page.evaluate(() => HM.partyAttack()); await page.waitForTimeout(120); await shot('warrens_fight');
  await page.waitForTimeout(1500); await shot('warrens_fight2');
  // molten gallery
  await page.evaluate(() => { HM.enterMap('molten', null, null); }); await page.waitForTimeout(600); await shot('molten');
  // sanctum
  await page.evaluate(() => { HM.enterMap('sanctum', null, null); }); await page.waitForTimeout(600); await shot('sanctum');
  // reliquary
  await page.evaluate(() => { HM.enterMap('reliquary', null, null); }); await page.waitForTimeout(600); await shot('reliquary');
  // barrow boss room
  await page.evaluate(() => { HM.enterMap('barrow', null, null); const b = HM.G.monsters.find(m => m.boss); HM.G.x = b.x - 3; HM.G.y = b.y; HM.G.camSet = false; b.aware = true; }); await page.waitForTimeout(900); await shot('barrow_boss');
  // dusk overworld near the marsh
  await page.evaluate(() => { HM.enterMap('over', 82, 42); HM.G.time = 19 * 60; }); await page.waitForTimeout(600); await shot('marsh_dusk');
  console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
  await browser.close();
})();
