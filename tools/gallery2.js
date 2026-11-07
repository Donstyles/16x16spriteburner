const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 932, height: 430 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: devices['iPhone 13 Pro Max'].userAgent });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.touchscreen.tap(466, 266); await page.waitForTimeout(600);
  const go = async (x, y, a, ms = 500, extra) => { await page.evaluate(([x, y, a, extra]) => { const S = AM.S; S.px = x; S.py = y; S.pa = a; S.pitch = 0; S.center = null; S.fade = null; S.msgs = []; S.playTime = 30; if (extra) eval(extra); }, [x, y, a, extra || '']); await page.waitForTimeout(ms); };
  // corridor fight, a beat after the hit
  await go(3.6, 9.5, 0, 400, "S.enemies.forEach(e => e.state = 'idle');");
  await page.evaluate(() => { AM.S.party.forEach(m => m.rec = 0); AM.partyAttack(); });
  await page.waitForTimeout(230);
  await page.screenshot({ path: path.join(out, '04_corridor_fight.png') });
  // minotaur: 3.3 tiles away, mid-windup (red telegraph), party wounded, boss damaged
  await go(22.8, 13.5, 0, 150, "S.enemies.forEach(e => e.state = 'idle'); const e = S.enemies.find(e => e.kind === 'BestialMinotaur'); e.x = 25.9; e.y = 13.4; e.hp = 388; e.trail = undefined; AM.wakeEnemy(e); e.state = 'windup'; e.t = 0.72; e.windupDur = 0.75; e.special = 'charge'; S.party[1].hp = 40; S.party[3].hp = 22; S.souls = 412;");
  await page.waitForTimeout(60);
  await page.screenshot({ path: path.join(out, '09_boss_minotaur.png') });
  // ashen king: 3.6 tiles away in the cosmic arena, slam windup
  await go(15.2, 69.5, Math.PI, 150, "S.boss = null; S.enemies.forEach(e => e.state = 'idle'); const e = S.enemies.find(e => e.kind === 'AdamantiumGolem'); e.x = 11.7; e.y = 69.6; e.hp = 3300; e.trail = undefined; AM.wakeEnemy(e); e.state = 'windup'; e.t = 0.95; e.windupDur = 1.0; e.special = 'slam'; S.party.forEach(m => { m.hp = m.hpMax; }); S.party[2].hp = 31; S.souls = 18420; S.party.forEach(m => m.level = 9);");
  await page.waitForTimeout(60);
  await page.screenshot({ path: path.join(out, '10_ashen_king.png') });
  await browser.close();
})();
