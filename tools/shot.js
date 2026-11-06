// Playwright smoke test: loads the game at a phone-like landscape viewport, plays a bit, saves screenshots.
const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const url = process.argv[3] || 'http://127.0.0.1:8787/index.html';
  const touch = process.argv[4] !== 'desktop';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: touch ? { width: 932, height: 430 } : { width: 1280, height: 720 }, deviceScaleFactor: touch ? 3 : 1, hasTouch: touch, isMobile: touch, userAgent: touch ? devices['iPhone 13 Pro Max'].userAgent : undefined });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '')));
  await page.goto(url);
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, 'shot_title.png') });
  // start new game via keyboard (Enter)
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(out, 'shot_start.png') });
  // walk forward out of the cell: turn to face south (door) then move
  await page.evaluate(() => { window.DEBUG_FPS = true; });
  await page.keyboard.down('KeyW'); await page.waitForTimeout(1500); await page.keyboard.up('KeyW');
  await page.screenshot({ path: path.join(out, 'shot_walk.png') });
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(600); await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('KeyW'); await page.waitForTimeout(2500); await page.keyboard.up('KeyW');
  await page.screenshot({ path: path.join(out, 'shot_corridor.png') });
  const info = await page.evaluate(() => ({ fps: typeof FPS !== 'undefined' ? FPS : null }));
  console.log('errors:', errors.length); errors.slice(0, 15).forEach(e => console.log(e));
  await browser.close();
})();
