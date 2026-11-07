const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.evaluate(() => { HM.I.press('newgame'); }); await page.waitForTimeout(200); await page.evaluate(() => HM.I.press('begin')); await page.waitForTimeout(600);
  const r = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)); const G = HM.G, out = {};
    // put a goblin adjacent and fight with real-time ticks
    G.x = 50.5; G.y = 60.5; G.camSet = false; G.monsters = []; G.fadeT = 0; G.notice = null;
    for (let i = 0; i < 3; i++) { const mo = HM.spawnMonster({ kind: 'goblin', x: 51.5 + i * 0.6, y: 60.5 + (i - 1) * 0.6 }, 900 + i); mo.aware = true; G.monsters.push(mo); }
    const logBefore = G.log.length; const t0 = performance.now(); let attacks = 0;
    while (performance.now() - t0 < 12000) { HM.partyAttack(); attacks++; await wait(100); if (!G.monsters.some(m => !m.dead)) break; }
    out.fight1 = { secs: ((performance.now() - t0) / 1000).toFixed(1), kills: G.kills, hp: G.party.map(m => m.hp), xp: G.party[0].xp, drops: G.drops.length, log: G.log.slice(-4).map(l => l.text) };
    // mage test: fire bolt at a goblin 5 tiles away
    G.monsters = []; const far = HM.spawnMonster({ kind: 'scarecrow', x: 55.5, y: 60.5 }, 950); far.aware = false; G.monsters.push(far); G.party[3].sp = 30; G.party[3].rec = 0;
    const c1 = HM.castSpell(G.party[3], 'fire_bolt'); out.castErr = HM.canCast(G.party[3], 'fire_bolt'); await wait(1500); out.bolt = { cast: c1, hp: far.hp, max: far.maxHp, dead: far.dead, projs: G.projs.length };
    // ranged goblin shooting the party
    G.monsters = []; const ga = HM.spawnMonster({ kind: 'goblin_archer', x: 54.5, y: 60.5 }, 951); ga.aware = true; G.monsters.push(ga); const hp0 = G.party.map(m => m.hp).reduce((a, b) => a + b);
    await wait(4000); out.archer = { hpLost: hp0 - G.party.map(m => m.hp).reduce((a, b) => a + b), gaPos: [ga.x.toFixed(1), ga.y.toFixed(1)], projs: G.projs.length };
    // turn-based: enemies frozen until we act
    G.monsters = []; const g2 = HM.spawnMonster({ kind: 'goblin', x: 56.5, y: 60.5 }, 952); g2.aware = true; G.monsters.push(g2); G.turnBased = true; G.tbClock = 0; const px = g2.x; await wait(1200); const moved1 = Math.abs(g2.x - px) > 0.05; HM.partyAttack(); G.tbClock += 1.2; await wait(1500); const moved2 = Math.abs(g2.x - px) > 0.05; out.tb = { frozenBefore: !moved1, movesAfterAction: moved2 }; G.turnBased = false;
    // training & quest completion
    G.monsters = []; HM.giveXp(1200); G.gold = 1000; out.train = { can: HM.G.party[0].xp >= 1000, ok: HM.train(G.party[0]), lvl: G.party[0].lvl, pts: G.party[0].skillPts, hp: G.party[0].hp };
    HM.startQuest('ore'); HM.addInv(HM.makeItem('iron_ore')); HM.G.inv.find(i => i.id === 'iron_ore').qty = 3; out.quest = { ready: HM.G.quests.ore, done: HM.completeQuest('ore'), gold: G.gold, inv: G.inv.map(i => i.id) };
    // party wipe and recovery
    for (const m of G.party) { m.cond.dead = true; } out.deadMode = (G.party.some(m => !m.cond.dead) ? 'alive' : 'all dead');
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  // warrens shot
  await page.evaluate(() => { HM.G.party.forEach(m => { m.cond = {}; m.hp = 30; }); HM.G.mode = 'play'; HM.enterMap('warrens', null, null); HM.G.notice = null; });
  await page.waitForTimeout(500); await page.keyboard.down('KeyS'); await page.waitForTimeout(700); await page.keyboard.up('KeyS'); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'p_warrens3.png') });
  console.log('errors:', errors.length); errors.slice(0, 6).forEach(e => console.log(e));
  await browser.close();
})();
