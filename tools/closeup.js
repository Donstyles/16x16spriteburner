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
  const go = async (x, y, a, extra, ms = 400) => { await page.evaluate(([x, y, a, extra]) => { const S = AM.S; S.px = x; S.py = y; S.pa = a; S.pitch = 0; S.center = null; S.fade = null; S.msgs = []; S.playTime = 30; S.enemies.forEach(e => e.state = 'idle'); if (extra) eval(extra); }, [x, y, a, extra || '']); await page.waitForTimeout(ms); };
  // goblin cutthroat at melee range (1.1), mid wind-up
  await go(2.5, 12.5, 0, "const e = S.enemies.find(e => e.kind === 'GoblinFighter' && Math.abs(e.y - 12.5) < 1); e.x = 3.6; e.y = 12.5; e.state = 'windup'; e.t = 0.5; e.windupDur = 0.55;", 120);
  await page.screenshot({ path: path.join(out, 'close_goblin.png') });
  // minotaur at 2 tiles
  await go(22.6, 13.5, 0, "const e = S.enemies.find(e => e.kind === 'BestialMinotaur'); e.x = 24.7; e.y = 13.5; e.hp = 500; AM.wakeEnemy(e); e.state = 'windup'; e.t = 0.7; e.windupDur = 0.75;", 120);
  await page.screenshot({ path: path.join(out, 'close_minotaur.png') });
  // mossgrave group at 3-4 tiles
  await go(33.0, 13.5, 0.1, "", 500);
  await page.screenshot({ path: path.join(out, 'mid_mossgrave.png') });
  await browser.close();
})();
