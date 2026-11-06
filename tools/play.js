// Scripted gameplay test: fight, bonfire menu, death/respawn, touch buttons.
const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 932, height: 430 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: devices['iPhone 13 Pro Max'].userAgent });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '')));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  // tap BEGIN (touch)
  await page.touchscreen.tap(466, 266);
  await page.waitForTimeout(1800);
  await page.evaluate(() => { AM.S.fade = null; AM.S.center = null; window.DEBUG_FPS = true; });
  await page.screenshot({ path: path.join(out, 'play_touchstart.png') });
  // teleport to face the scarecrow in the corridor and hold ATTACK
  await page.evaluate(() => { const S = AM.S; S.px = 3.6; S.py = 9.5; S.pa = 0; });
  await page.waitForTimeout(400);
  const snap = () => page.evaluate(() => ({ tgt: AM.S.target && AM.S.target.name, thp: AM.S.target && AM.S.target.hp, souls: AM.S.souls, hp: AM.S.party.map(m => m.hp), stam: AM.S.stam | 0, en: AM.S.enemies.filter(e => !e.dead).length, mode: AM.S.mode }));
  console.log('before fight', JSON.stringify(await snap()));
  // hold the attack button (right side) via touch
  const atk = await page.evaluate(() => { const b = AM.Input.buttons.find(b => b.id === 'attack'); return b && { x: b.x + b.w / 2, y: b.y + b.h / 2 }; });
  console.log('attack btn', JSON.stringify(atk));
  for (let i = 0; i < 12; i++) { await page.touchscreen.tap(atk.x, atk.y); await page.waitForTimeout(250); if (i === 2) await page.screenshot({ path: path.join(out, 'play_fight.png') }); }
  console.log('after fight', JSON.stringify(await snap()));
  await page.screenshot({ path: path.join(out, 'play_afterfight.png') });
  // ability: fire bolt via portrait tap
  await page.evaluate(() => { const S = AM.S; S.px = 10.5; S.py = 3.5; S.pa = 0; });
  await page.waitForTimeout(300);
  const ab4 = await page.evaluate(() => { const b = AM.Input.buttons.find(b => b.id === 'ab4'); return b && { x: b.x + b.w / 2, y: b.y + b.h / 2 }; });
  await page.touchscreen.tap(ab4.x, ab4.y); await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(out, 'play_firebolt.png') });
  await page.waitForTimeout(1500);
  console.log('after firebolt', JSON.stringify(await snap()));
  // bonfire menu
  await page.evaluate(() => { const S = AM.S; S.px = 13.5; S.py = 14.6; S.pa = -Math.PI / 2; S.enemies.forEach(e => { e.state = 'idle'; }); });
  await page.waitForTimeout(300);
  await page.evaluate(() => AM.doInteract(AM.findFocus()));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'play_bonfire_lit.png') });
  await page.evaluate(() => AM.doInteract(AM.findFocus()));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'play_bonfire_menu.png') });
  // level up menu
  await page.evaluate(() => { AM.S.souls = 5000; });
  const m1 = await page.evaluate(() => { const b = AM.Input.buttons.find(b => b.id === 'menu1'); return b && { x: b.x + b.w / 2, y: b.y + b.h / 2 }; });
  await page.touchscreen.tap(m1.x, m1.y); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'play_levelup.png') });
  const m0 = await page.evaluate(() => { const b = AM.Input.buttons.find(b => b.id === 'menu0'); return b && { x: b.x + b.w / 2, y: b.y + b.h / 2 }; });
  await page.touchscreen.tap(m0.x, m0.y); await page.waitForTimeout(300);
  await page.touchscreen.tap(m0.x, m0.y); await page.waitForTimeout(300);
  console.log('after levelup', JSON.stringify(await page.evaluate(() => ({ lv: AM.S.party.map(m => m.level), mt: AM.S.party.map(m => m.mt), souls: AM.S.souls, menu: AM.S.menu && AM.S.menu.kind }))));
  await page.evaluate(() => { AM.S.menu = null; AM.S.mode = 'play'; });
  // keeper
  await page.evaluate(() => { const S = AM.S; S.px = 14.5; S.py = 12.8; S.pa = -Math.PI / 2; });
  await page.waitForTimeout(200);
  await page.evaluate(() => AM.doInteract(AM.findFocus()));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'play_keeper.png') });
  await page.evaluate(() => { AM.S.menu = null; AM.S.mode = 'play'; });
  // death: teleport into the minotaur arena with low hp
  await page.evaluate(() => { const S = AM.S; S.px = 23.5; S.py = 13.5; S.pa = 0; S.party.forEach(m => m.hp = 5); });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(out, 'play_dead.png') });
  console.log('death state', JSON.stringify(await snap()));
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(out, 'play_respawn.png') });
  console.log('after respawn', JSON.stringify(await page.evaluate(() => ({ mode: AM.S.mode, px: AM.S.px, py: AM.S.py, blood: AM.S.bloodstain, souls: AM.S.souls, hp: AM.S.party.map(m => m.hp) }))));
  // joystick drag: move forward
  const before = await page.evaluate(() => [AM.S.px, AM.S.py]);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 300, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150, y: 250, id: 1 }] });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, 'play_joystick.png') });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const after = await page.evaluate(() => [AM.S.px, AM.S.py]);
  console.log('joystick moved', before, '->', after);
  // look drag
  const a0 = await page.evaluate(() => AM.S.pa);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 700, y: 200, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 760, y: 200, id: 2 }] });
  await page.waitForTimeout(100);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const a1 = await page.evaluate(() => AM.S.pa);
  console.log('look turned', a0.toFixed(2), '->', a1.toFixed(2));
  console.log('errors:', errors.length); errors.slice(0, 10).forEach(e => console.log(e));
  await browser.close();
})();
