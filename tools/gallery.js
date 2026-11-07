// Gallery screenshots at iPhone landscape size with touch UI.
const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 932, height: 430 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: devices['iPhone 13 Pro Max'].userAgent });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, '01_title.png') });
  await page.touchscreen.tap(466, 266); await page.waitForTimeout(1900);
  await page.screenshot({ path: path.join(out, '02_awakening.png') });
  const go = async (x, y, a, ms = 500, extra) => { await page.evaluate(([x, y, a, extra]) => { const S = AM.S; S.px = x; S.py = y; S.pa = a; S.pitch = 0; S.center = null; S.fade = null; S.msgs = []; if (extra) eval(extra); }, [x, y, a, extra || '']); await page.waitForTimeout(ms); };
  // hub with bonfire lit and keeper
  await go(13.5, 16.4, -Math.PI / 2, 600, "const b = S.bonfires.find(b => b.id === '13,13'); b.lit = true; S.flags.bonfire[b.id] = 1; const o = S.objects.find(o => o.ref === b); o.spr = AM.getSprite('bonfire'); o.emissive = true; S.enemies.forEach(e => e.state = 'idle');");
  await page.screenshot({ path: path.join(out, '03_hub_bonfire.png') });
  // corridor fight: swing at the scarecrow
  await go(3.6, 9.5, 0, 400);
  await page.evaluate(() => { AM.S.party.forEach(m => m.rec = 0); AM.partyAttack(); });
  await page.waitForTimeout(80);
  await page.screenshot({ path: path.join(out, '04_corridor_fight.png') });
  // mossgrave graveyard
  await go(33.2, 13.5, 0.15, 700, "S.enemies.forEach(e => { e.state = 'idle'; });");
  await page.screenshot({ path: path.join(out, '05_mossgrave.png') });
  // frozen reliquary hall
  await go(3.2, 41.5, 0.1, 700, "S.enemies.forEach(e => { e.state = 'idle'; });");
  await page.screenshot({ path: path.join(out, '06_frozen_reliquary.png') });
  // molten gallery lava lake
  await go(39.5, 36.5, 0.05, 900, "S.enemies.forEach(e => { e.state = 'idle'; });");
  await page.screenshot({ path: path.join(out, '07_molten_gallery.png') });
  // cosmic sanctum star hall
  await go(48.3, 61.5, Math.PI, 700, "S.enemies.forEach(e => { e.state = 'idle'; });");
  await page.screenshot({ path: path.join(out, '08_cosmic_sanctum.png') });
  // boss fight: minotaur mid-charge, boss bar
  await go(22.9, 13.5, 0, 200, "const e = S.enemies.find(e => e.kind === 'BestialMinotaur'); e.x = 25.3; e.y = 13.5; e.hp = 410; AM.wakeEnemy(e); S.party[1].hp = 40; S.party[3].hp = 22;");
  await page.waitForTimeout(1300);
  await page.evaluate(() => { AM.S.party.forEach(m => m.rec = 0); AM.S.stam = 100; AM.partyAttack(); });
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(out, '09_boss_minotaur.png') });
  // final boss arena
  await go(14.5, 69.5, Math.PI, 200, "S.boss = null; const e = S.enemies.find(e => e.kind === 'AdamantiumGolem'); e.x = 11.6; e.y = 69.5; e.hp = 3300; AM.wakeEnemy(e); S.party.forEach(m => { m.hp = m.hpMax; });");
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, '10_ashen_king.png') });
  // bonfire menu
  await go(13.5, 14.6, -Math.PI / 2, 300, "S.boss = null; S.enemies.forEach(e => e.state = 'idle'); S.souls = 2340;");
  await page.evaluate(() => AM.doInteract(AM.findFocus())); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, '11_bonfire_menu.png') });
  await page.evaluate(() => { AM.S.menu = { kind: 'levelup', sel: 0, back: AM.S.menu }; }); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, '12_level_up.png') });
  await page.evaluate(() => { AM.S.menu = null; AM.S.mode = 'play'; });
  // keeper
  await go(14.5, 12.8, -Math.PI / 2, 300);
  await page.evaluate(() => AM.doInteract(AM.findFocus())); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, '13_keeper.png') });
  await page.evaluate(() => { AM.S.menu = null; AM.S.mode = 'play'; });
  // death
  await go(23.5, 13.5, 0, 200, "S.enemies.forEach(e => e.state = 'idle'); S.souls = 1850; AM.dieParty();");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, '14_you_died.png') });
  await browser.close();
})();
