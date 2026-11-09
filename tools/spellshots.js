// Force specific spells at a given level and photograph them mid-effect.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => window.CR && window.CR.G.mode === 'play', null, { timeout: 30000 });
  const setup = (floor, lvl) => page.evaluate(([f, l]) => { const G = CR.G; G.floor = f; while (G.lvl < l) CR.gainXp(CR.xpFor(G.lvl + 1) - G.xp); G.banner = null; G.bq.length = 0; CR.startFloor(false); G.waveT = 0; G.fade = 0; G.card = null; }, [floor, lvl]);
  const force = (hero, name) => page.evaluate(([k, n]) => { const G = CR.G, h = G.heroes.find(x => x.key === k), sp = CR.SPELLBOOK[k].find(s => s.name === n), f = CR.live(G.mons); const t = sp.pick(h, f) || f[0]; h.state = null; CR.beginCast(h, sp, t === true ? null : t); return !!t; }, [hero, name]);
  const shot = async (name, ms) => { await page.waitForTimeout(ms); await page.screenshot({ path: path.join(out, name + '.png') }); };
  await setup(2, 4); await shot('a_low_spells', 9000);
  await setup(5, 8); await page.waitForTimeout(6000); await force('pyro', 'HEAT RAY'); await shot('b_heat_ray', 1300);
  await force('storm', 'LIGHTNING LANCE'); await shot('c_lance', 750);
  await force('druid', 'BOULDER ROLL'); await force('storm', 'TESLA COIL'); await shot('d_medium_mix', 1500);
  await setup(7, 13); await page.waitForTimeout(6500); await force('storm', 'ARC CANNON'); await shot('e_arc_cannon', 1900);
  await page.waitForTimeout(1500); await force('warrior', 'THOUSAND CUTS'); await shot('f_cuts_mid', 1100); await shot('g_cuts_end', 1200);
  console.log('errors', errs.length, errs.slice(0, 4).join('\n'));
  await browser.close();
})();
