// Trigger each set piece on demand and photograph it mid-effect.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp', W = +(process.argv[3] || 932), H = +(process.argv[4] || 430), dsf = +(process.argv[5] || 1);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dsf })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => window.CR && window.CR.G.mode === 'play', null, { timeout: 30000 });
  const setup = async (floor) => page.evaluate(f => { const G = CR.G; G.floor = f; CR.startFloor(false); G.waveT = 0; G.fade = 0; G.card = null; window.CR_TURBO = 1; }, floor);
  const shot = async (name, wait) => { await page.waitForTimeout(wait); await page.screenshot({ path: path.join(out, name + '.png') }); };
  await page.waitForTimeout(800);
  // 1. a wave mid-fight with chain lightning and fireballs
  await setup(5); await page.waitForTimeout(4500); await shot('s1_wave', 600);
  // 2. thunderstorm
  await page.evaluate(() => { const h = CR.G.heroes[2]; CR.G.ultCd = 0; CR.thunderstorm(h); }); await shot('s2_storm', 1500);
  // 3. meteor storm
  await setup(6); await page.waitForTimeout(4200); await page.evaluate(() => CR.meteorStorm(CR.G.heroes[1])); await shot('s3_meteor', 2300);
  // 4. earthquake
  await setup(7); await page.waitForTimeout(4200); await page.evaluate(() => CR.earthquake(CR.G.heroes[3])); await shot('s4_quake', 1800);
  // 5. cataclysm leap slam
  await setup(5); await page.waitForTimeout(4200); await page.evaluate(() => CR.cataclysm(CR.G.heroes[0])); await shot('s5_slam', 750);
  // 6. boss
  await setup(4); await page.evaluate(() => { CR.G.wave = 1; CR.spawnWave(); }); await shot('s6_boss_intro', 2500); await shot('s7_boss_fight', 4000);
  console.log('errors', errs.length, errs.slice(0, 5).join('\n'));
  await browser.close();
})();
