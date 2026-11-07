const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp'; const touch = process.argv[3] !== 'desktop';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: touch ? { width: 932, height: 430 } : { width: 1280, height: 720 }, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch, userAgent: touch ? devices['iPhone 13 Pro Max'].userAgent : undefined });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n'))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.waitForTimeout(800); await page.screenshot({ path: path.join(out, 's_title.png') });
  await page.evaluate(() => { HM.I.press('newgame'); }); await page.waitForTimeout(400); await page.screenshot({ path: path.join(out, 's_create.png') });
  await page.evaluate(() => { HM.I.press('begin'); }); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(out, 's_town.png') });
  // walk north with keys
  await page.keyboard.down('KeyW'); await page.waitForTimeout(1200); await page.keyboard.up('KeyW'); await page.screenshot({ path: path.join(out, 's_walk.png') });
  const st = await page.evaluate(() => ({ x: HM.G.x, y: HM.G.y, map: HM.M.id, gold: HM.G.gold, mon: HM.G.monsters.length, focus: HM.G.focus && (HM.G.focus.type) }));
  console.log(JSON.stringify(st));
  console.log('errors:', errors.length); errors.slice(0, 8).forEach(e => console.log(e));
  await browser.close();
})();
