// Reproduce: hold the stick into the corner sign for a few seconds, then try to walk back out.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8787/' + (process.env.OLD ? 'index_old.html' : 'index.html') + '');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  await page.evaluate(() => { AM.S.fade = null; });
  const pos = () => page.evaluate(() => [+AM.S.px.toFixed(2), +AM.S.py.toFixed(2)]);
  // face the sign (4.5,4.5) from (3.5,3.5) and push into it for 4s, drifting along it
  await page.evaluate(() => { AM.S.pa = Math.atan2(1, 1); });
  await page.keyboard.down('KeyW'); await page.waitForTimeout(2500); await page.keyboard.up('KeyW');
  console.log('after pushing into sign', await pos());
  // now strafe right (east) into the wall while still pushing on the sign
  await page.evaluate(() => { AM.S.pa = Math.PI / 2; });
  await page.keyboard.down('KeyW'); await page.keyboard.down('KeyD'); await page.waitForTimeout(2500); await page.keyboard.up('KeyW'); await page.keyboard.up('KeyD');
  const p1 = await pos(); console.log('after wedging into corner', p1);
  // walk back north: must be able to move
  await page.keyboard.down('KeyS'); await page.waitForTimeout(800); await page.keyboard.up('KeyS');
  const p2 = await pos(); console.log('after walking back', p2, 'moved', Math.hypot(p2[0] - p1[0], p2[1] - p1[1]).toFixed(2));
  // also walk through the door south and down the corridor
  await page.evaluate(() => { AM.S.px = 3.5; AM.S.py = 3.5; AM.S.pa = Math.PI / 2; });
  await page.keyboard.down('KeyW'); await page.waitForTimeout(2200); await page.keyboard.up('KeyW');
  console.log('through the door', await pos());
  console.log('errors', errors.length, errors.join(' | '));
  await browser.close();
})();
