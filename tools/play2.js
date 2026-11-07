const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 932, height: 430 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: devices['iPhone 13 Pro Max'].userAgent });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n'))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.touchscreen.tap(466, 268); await page.waitForTimeout(300); // NEW GAME
  await page.evaluate(() => HM.I.press('begin')); await page.waitForTimeout(1500);
  const shot = async n => { await page.screenshot({ path: path.join(out, 'p_' + n + '.png') }); };
  const st = () => page.evaluate(() => ({ map: HM.M.id, x: +HM.G.x.toFixed(1), y: +HM.G.y.toFixed(1), gold: HM.G.gold, hp: HM.G.party.map(m => m.hp), mon: HM.G.monsters.filter(m => !m.dead).length, screen: HM.G.screen && HM.G.screen.kind, inv: HM.G.inv.length, q: Object.keys(HM.G.quests).length }));
  await page.evaluate(() => { HM.G.notice = null; HM.G.fadeT = 0; });
  await shot('town');
  // character screen
  await page.evaluate(() => HM.openScreen('char', { tab: 0 })); await page.waitForTimeout(200); await shot('char_stats');
  await page.evaluate(() => { HM.G.screen.tab = 1; }); await page.waitForTimeout(200); await shot('char_skills');
  await page.evaluate(() => { HM.G.screen.tab = 2; HM.G.screen.selItem = 0; }); await page.waitForTimeout(200); await shot('char_items');
  await page.evaluate(() => { HM.G.sel = 3; HM.G.screen.tab = 3; }); await page.waitForTimeout(200); await shot('spellbook');
  await page.evaluate(() => HM.closeScreen());
  // weapon shop: teleport in front of door 'a' and interact
  await page.evaluate(() => { const o = HM.M.objects.find(o => o.kind === 'door' && o.building === 'a'); HM.G.x = o.x + 0.5; HM.G.y = o.y + 1.4; HM.G.focus = HM.nearestInteractable(); HM.doInteract(HM.G.focus); }); await page.waitForTimeout(300); await shot('shop');
  await page.evaluate(() => { HM.I.press('buy0'); }); await page.waitForTimeout(100);
  console.log('after buy', JSON.stringify(await st()));
  await page.evaluate(() => HM.closeScreen());
  // hall quest
  await page.evaluate(() => { const o = HM.M.objects.find(o => o.kind === 'door' && o.building === 'l'); HM.G.x = o.x + 0.5; HM.G.y = o.y + 1.4; HM.doInteract(HM.nearestInteractable()); }); await page.waitForTimeout(300); await shot('hall');
  await page.evaluate(() => HM.I.press('qaccept_main1')); await page.waitForTimeout(200); await shot('quest_text');
  await page.evaluate(() => HM.closeScreen());
  await page.evaluate(() => HM.openScreen('quests', { selQ: 'main1' })); await page.waitForTimeout(200); await shot('quests'); await page.evaluate(() => HM.closeScreen());
  // guild
  await page.evaluate(() => { const n = HM.M.npcs.find(n => n.guild === 'elemental'); HM.G.x = n.x + 0.8; HM.G.y = n.y; HM.G.sel = 3; HM.doInteract(HM.nearestInteractable()); }); await page.waitForTimeout(300); await shot('guild'); await page.evaluate(() => HM.closeScreen());
  // temple & inn & trainer
  for (const [b, n] of [['p', 'temple'], ['i', 'inn'], ['r', 'trainer']]) { await page.evaluate(b => { const o = HM.M.objects.find(o => o.kind === 'door' && o.building === b); HM.G.x = o.x + 0.5; HM.G.y = o.y + 1.4; HM.doInteract(HM.nearestInteractable()); }, b); await page.waitForTimeout(250); await shot(n); await page.evaluate(() => HM.closeScreen()); }
  // map screen
  await page.evaluate(() => HM.openScreen('map')); await page.waitForTimeout(200); await shot('map'); await page.evaluate(() => HM.closeScreen());
  // fight: teleport to the goblin camp north and hold attack
  await page.evaluate(() => { HM.G.x = 44.5; HM.G.y = 24.5; HM.G.camSet = false; HM.G.monsters.forEach(m => { if (Math.hypot(m.x - 44.5, m.y - 24.5) < 8) m.aware = true; }); });
  await page.waitForTimeout(1200); await shot('fight_start');
  for (let i = 0; i < 25; i++) { await page.evaluate(() => { HM.G.target = null; HM.partyAttack(); }); await page.waitForTimeout(240); if (i === 4) await shot('fight'); }
  console.log('after fight', JSON.stringify(await st()));
  await shot('fight_end');
  // cast fire bolt from the sorcerer at anything nearby
  await page.evaluate(() => { HM.G.sel = 3; const m = HM.G.party[3]; m.sp = 20; const r = HM.castSpell(m, 'fire_bolt'); }); await page.waitForTimeout(150); await shot('firebolt');
  // enter the warrens
  await page.evaluate(() => { HM.enterMap('warrens', null, null); }); await page.waitForTimeout(1200); await page.evaluate(() => { HM.G.notice = null; }); await shot('warrens');
  await page.keyboard.down('KeyS'); await page.waitForTimeout(900); await page.keyboard.up('KeyS'); await shot('warrens2');
  console.log('warrens', JSON.stringify(await st()));
  // night in town
  await page.evaluate(() => { HM.enterMap('over', null, null); HM.G.time = 22 * 60; HM.G.notice = null; }); await page.waitForTimeout(600); await shot('night');
  // rest screen, menu, save/load
  await page.evaluate(() => HM.openScreen('rest')); await page.waitForTimeout(200); await shot('rest'); await page.evaluate(() => HM.closeScreen());
  await page.evaluate(() => HM.openScreen('menu')); await page.waitForTimeout(200); await shot('menu');
  const ok = await page.evaluate(() => { const a = HM.saveGame(); HM.closeScreen(); const b = HM.loadGame(); return a && b; }); console.log('save/load', ok, JSON.stringify(await st()));
  console.log('errors:', errors.length); errors.slice(0, 8).forEach(e => console.log(e));
  await browser.close();
})();
