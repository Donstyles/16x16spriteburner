const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.evaluate(() => { HM.I.press('newgame'); }); await page.waitForTimeout(200); await page.evaluate(() => HM.I.press('begin')); await page.waitForTimeout(500);
  const r = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)); const G = HM.G, out = {};
    // party wipe -> temple recovery
    G.gold = 1000; for (const m of G.party) { m.cond.dead = true; } HM.G.mode = 'dead'; HM.G.deadT = 2; HM.I.press('wake'); await wait(300);
    out.wipe = { mode: G.mode, gold: G.gold, alive: G.party.filter(m => !m.cond.dead).length, map: HM.M.id };
    // main quest chain to the ending
    HM.startQuest('main1'); HM.addInv(HM.makeItem('goblin_signet')); out.m1 = HM.completeQuest('main1');
    HM.addInv(HM.makeItem('barrow_relic')); out.m2 = HM.completeQuest('main2');
    HM.addInv(HM.makeItem('frost_key')); HM.addInv(HM.makeItem('brass_key')); out.m3 = HM.completeQuest('main3');
    HM.addInv(HM.makeItem('scepter')); out.m4 = HM.completeQuest('main4'); await wait(200);
    out.ending = { mode: G.mode, won: G.flags.won, gold: G.gold, lvlxp: G.party[0].xp };
    // sanctum lock check
    G.mode = 'play'; G.inv = []; HM.enterMap('over', 72.5, 78.5); const ent = HM.M.objects.find(o => o.kind === 'entrance' && o.dungeon === 'sanctum'); G.x = ent.x + 0.5; G.y = ent.y + 0.5; HM.doInteract(HM.nearestInteractable()); out.locked = { map: HM.M.id, log: G.log.slice(-1)[0] && G.log.slice(-1)[0].text };
    HM.addInv(HM.makeItem('frost_key')); HM.addInv(HM.makeItem('brass_key')); HM.doInteract(HM.nearestInteractable()); out.unlocked = HM.M.id;
    // town portal from the dungeon
    const m = G.party[3]; m.spells.push('town_portal'); m.skills.Water = 4; m.sp = 50; m.rec = 0; out.portal = { cast: HM.castSpell(m, 'town_portal'), map: HM.M.id, x: G.x | 0, y: G.y | 0 };
    // rest with food and without
    G.food = 1; G.party[0].hp = 5; HM.restParty(8); out.rest = { hp: G.party[0].hp, food: G.food, hour: Math.floor((G.time % 1440) / 60) };
    return out;
  });
  console.log(JSON.stringify(r)); console.log('errors', errors.length, errors.join(' | '));
  await browser.close();
})();
