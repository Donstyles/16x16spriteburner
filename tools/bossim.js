// Boss-fight simulator: a party built to level L (shop gear, guild spells, the bot's own combat logic) against each boss.
// usage: node tools/bossim.js [bosses] [levels] [turbo]
const { chromium } = require('playwright');
(async () => {
  const bosses = (process.argv[2] || 'goblin_king,elder_treant,mithril_construct,efreeti,adamantium_golem').split(',');
  const levels = (process.argv[3] || '2,3,4,5,6,7,8,9,10,11,12,13,14,15').split(',').map(Number);
  const turbo = +(process.argv[4] || 40); const trials = +(process.argv[5] || 3); const maxT = +(process.argv[6] || 300);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.evaluate(([t, mt]) => { window.HM_TURBO = t; window.MAXT = mt; }, [turbo, maxT]);
  await page.evaluate(() => {
    const { G, BOT, SKILLS, newGame, defaultParty, giveXp, train, raiseSkill, equipItem, skillUpCost, XP_FOR_LEVEL, canUse, maxHp, maxSp, makeItem, addInv, SPELLS, spawnMonster } = HM;
    const PRI = { Knight: ['Sword', 'Chain', 'BodyBuilding', 'Shield', 'Plate'], Archer: ['Bow', 'Leather', 'Air', 'Fire', 'Perception'], Cleric: ['Body', 'Spirit', 'Mace', 'Meditation', 'Leather'], Sorcerer: ['Fire', 'Water', 'Air', 'Meditation', 'Earth'] };
    const WANT = { Sorcerer: ['fire_bolt', 'ring_of_fire', 'sparks', 'ice_bolt', 'fireball', 'town_portal', 'lightning_bolt', 'acid_burst', 'stone_skin', 'shield', 'torch_light'], Cleric: ['cure_wounds', 'bless', 'power_cure', 'cure_poison', 'spirit_lash', 'mind_blast', 'heroism', 'raise_dead', 'mind_shield'], Archer: ['sparks', 'shield', 'fire_bolt', 'wizard_eye'], Knight: [] };
    const gearFor = (m, L) => {
      if (L < 3) return [];
      const w = { Knight: L >= 6 ? 'broad_sword' : 'long_sword', Archer: 'long_bow', Cleric: L >= 6 ? 'morning_star' : 'mace', Sorcerer: 'staff' }[m.cls];
      const a = { Knight: L >= 6 ? 'scale_mail' : 'chain_mail', Archer: 'studded_leather', Cleric: 'chain_mail', Sorcerer: 'robe' }[m.cls];
      return [w, a, m.cls === 'Knight' || m.cls === 'Cleric' ? 'shield' : null, m.cls === 'Sorcerer' || m.cls === 'Archer' ? 'cap' : 'helm', 'boots'];
    };
    window.buildParty = L => {
      BOT.stop(); newGame(defaultParty()); G.screen = null; G.fadeT = 0; G.notice = null; G.mode = 'play';
      G.gold = 1e6; giveXp(XP_FOR_LEVEL(L));
      for (const m of G.party) {
        let g = 0; while (train(m) && g++ < 40) { }
        if (L >= 4) { if (m.cls === 'Knight') m.skills.Plate = m.skills.Plate || 1; if (m.cls === 'Sorcerer') { m.skills.Meditation = m.skills.Meditation || 1; m.skills.Water = m.skills.Water || 1; m.skills.Earth = m.skills.Earth || 1; } if (m.cls === 'Cleric') m.skills.Mind = m.skills.Mind || 1; if (m.cls === 'Archer') { m.skills.Fire = m.skills.Fire || 1; m.skills.Learning = m.skills.Learning || 1; } }
        m.promo = m.promo || {}; for (const sk in m.skills) m.promo[sk] = L >= 8 ? 8 : L >= 4 ? 4 : 0;
        let guard = 0; while (guard++ < 300) { let did = false; for (const sk of (PRI[m.cls] || []).filter(sk => m.skills[sk])) { const lv = m.skills[sk]; if (lv >= 10) continue; if ((lv === 3 && !(m.promo[sk] >= 4)) || (lv === 7 && !(m.promo[sk] >= 8))) continue; if (m.skillPts >= skillUpCost(lv)) { const before = m.skills[sk]; raiseSkill(m, sk); if (m.skills[sk] > before) { did = true; break; } } } if (!did) break; }
        for (const id of gearFor(m, L)) { if (!id) continue; const it = makeItem(id); if (canUse(m, it)) { addInv(it); equipItem(m, it, true); } }
        for (const id of WANT[m.cls] || []) { const sp = SPELLS[id]; const need = sp.lvl === 1 ? 1 : sp.lvl === 2 ? 2 : sp.lvl === 3 ? 4 : 8; if ((m.skills[sp.school] || 0) >= need && !m.spells.includes(id)) m.spells.push(id); }
        m.hp = maxHp(m); m.sp = maxSp(m); m.rec = 0;
      }
      for (let i = 0; i < 5; i++) addInv(makeItem('potion_heal')); if (L >= 6) for (let i = 0; i < 3; i++) addInv(makeItem('potion_heal2')); for (let i = 0; i < 2; i++) addInv(makeItem('potion_mana'));
      G.gold = 1000;
    };
    window.fight = async (boss, L) => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      buildParty(L);
      G.x = 50.5; G.y = 60.5; G.camSet = false; G.monsters = []; G.drops = []; G.projs = []; G.fx = []; G.buffs = {}; G.trail = []; for (let i = 0; i < 24; i++) G.trail.push([G.x, G.y + i * 0.22]);
      const mo = spawnMonster({ kind: boss, x: 54.5, y: 60.5, boss: true }, 900); mo.aware = true; G.monsters.push(mo);
      BOT.on = true; BOT.goals = [{ k: 'wander' }]; BOT.cur = null; BOT.done = false; BOT.flow = null; BOT.eng = null; BOT.flee = 0; BOT.path = null; BOT.skip = {}; BOT.lastRestT = 1e12; // no camping mid-test
      const t0 = G.playTime; const log0 = G.log.length; const pots = () => G.inv.filter(i => i.id.startsWith('potion_heal')).reduce((a, i) => a + (i.qty || 1), 0); const p0 = pots();
      while (G.playTime - t0 < window.MAXT) { await wait(40); if (mo.dead || G.mode === 'dead' || BOT.flee > G.playTime) break; }
      BOT.on = false; BOT.mx = BOT.my = 0;
      const lines = G.log.slice(log0).map(l => l.text || l); return { boss, L, hits: lines.filter(l => l.includes(mo.name) && /hits|strikes|bites|claws|burns/.test(l)).length, misses: lines.filter(l => l.includes(mo.name) && /miss/.test(l)).length, sample: lines.slice(0, 6), win: mo.dead, dead: G.mode === 'dead', fled: BOT.flee > G.playTime, t: Math.round(G.playTime - t0), bossHp: Math.round(mo.hp / mo.maxHp * 100), hp: G.party.map(m => Math.round(Math.max(0, m.hp) / maxHp(m) * 100)).join('/'), pots: p0 - pots(), party: G.party.map(m => m.cls[0] + m.lvl + ':' + (m.equip.weapon ? m.equip.weapon.id : '-') + '/' + (m.equip.armor ? m.equip.armor.id : '-') + '/' + m.spells.length + 'sp/' + Object.entries(m.skills).filter(([k, v]) => SKILLS[k].kind === 'magic').map(([k, v]) => k.slice(0, 2) + v).join('')).join(' ') };
    };
  });
  for (const boss of bosses) {
    for (const L of levels) {
      const rs = []; for (let k = 0; k < trials; k++) rs.push(await page.evaluate(([b, l]) => fight(b, l), [boss, L]));
      const wins = rs.filter(r => r.win).length; const avgT = Math.round(rs.reduce((a, r) => a + r.t, 0) / rs.length);
      console.log(`${boss.padEnd(18)} L${String(L).padStart(2)}  wins ${wins}/${trials}  avg t=${String(avgT).padStart(3)}s  ` + rs.map(r => `${r.win ? 'W' : r.dead ? 'X' : r.fled ? 'F' : 'T'}:${r.t}s/${r.bossHp}%/${r.hp}/p${r.pots}/h${r.hits}m${r.misses}`).join('  ') + (L === levels[0] ? '\n    ' + rs[0].party + '\n    ' + JSON.stringify(rs[0].sample) : ''));
      if (wins === trials && rs.every(r => r.hp.split('/').every(h => +h > 40))) { console.log('  (comfortable wins; skipping higher levels)'); break; }
    }
  }
  await browser.close();
})();
