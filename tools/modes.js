const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  // desktop
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  let page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  await page.evaluate(() => { AM.S.fade = null; AM.S.center = null; const S = AM.S; S.px = 13.5; S.py = 16.5; S.pa = -Math.PI / 2; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'mode_desktop.png') });
  await ctx.close();
  // portrait phone
  ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: devices['iPhone 13 Pro Max'].userAgent });
  page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.touchscreen.tap(215, 500); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'mode_portrait.png') });
  const rot = await page.evaluate(() => getComputedStyle(document.getElementById('rotate')).display);
  console.log('portrait rotate overlay:', rot, 'errors', errors.length, errors.join('|'));
  await browser.close();
})();
