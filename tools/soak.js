// Soak test: fight every enemy kind for a few seconds each; kill bosses; verify victory flow; catch errors.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  await page.evaluate(() => { AM.S.fade = null; window.DEBUG_FPS = true; AM.S.party.forEach(m => { m.hpMax = 9999; m.hp = 9999; }); });
  const kinds = await page.evaluate(() => Object.keys(AM.ENEMY_DEFS));
  const log = [];
  for (const k of (process.env.SKIP_KINDS ? [] : kinds)) {
    const r = await page.evaluate(async (k) => {
      const S = AM.S; const wait = ms => new Promise(r => setTimeout(r, ms));
      const sp = AM.WORLD.spawns.find(s => s.kind === k); if (!sp) return 'no spawn';
      // stand 2.5 units away in open floor: search around the spawn
      let placed = false;
      for (let a = 0; a < 6.3 && !placed; a += 0.4) { const x = sp.x + Math.cos(a) * 2.2, y = sp.y + Math.sin(a) * 2.2; if (AM.MAP.type[(y | 0) * 64 + (x | 0)] === 0) { S.px = x; S.py = y; S.pa = Math.atan2(sp.y - y, sp.x - x); placed = true; } }
      if (!placed) { S.px = sp.x + 1; S.py = sp.y; S.pa = Math.PI; }
      S.party.forEach(m => { m.hp = 9999; m.dead = false; }); S.stam = 100;
      const e = S.enemies.find(e => e.kind === k && !e.dead); if (!e) return 'no enemy';
      AM.damageEnemy(e, 1); // wake it
      const t0 = performance.now(); let hits = 0;
      while (performance.now() - t0 < 2600) { AM.partyAttack(); S.stam = 100; await wait(120); if (e.dead) break; }
      return { hp: e.hp | 0, dead: e.dead, state: e.state, phurt: S.party.map(m => 9999 - m.hp | 0), proj: S.projectiles.length };
    }, k);
    log.push(k + ' ' + JSON.stringify(r));
  }
  console.log(log.join('\n'));
  await page.screenshot({ path: path.join(out, 'soak_last.png') });
  // boss kill to completion: minotaur
  const b = await page.evaluate(async () => {
    const S = AM.S; const wait = ms => new Promise(r => setTimeout(r, ms));
    const e = S.enemies.find(e => e.kind === 'BestialMinotaur'); S.px = 22.6; S.py = 13.5; S.pa = 0; e.hp = 5; await wait(150); AM.partyAttack(); await wait(600);
    const gate = AM.MAP.doors.find(d => d.x === 21 && d.y === 13);
    return { dead: e.dead, flag: !!S.flags.boss[e.id], gateRemoved: gate.removed, center: S.center && S.center.text, boss: S.boss && S.boss.name, souls: S.souls };
  });
  console.log('boss', JSON.stringify(b));
  // final boss -> victory
  const v = await page.evaluate(async () => {
    const S = AM.S; const wait = ms => new Promise(r => setTimeout(r, ms));
    const e = S.enemies.find(e => e.kind === 'AdamantiumGolem'); S.px = e.x + 1.2; S.py = e.y; S.pa = Math.PI; e.hp = 5; S.stam = 100; S.party.forEach(m => { m.rec = 0; }); await wait(150); AM.partyAttack(); await wait(400); if (!e.dead) { S.stam = 100; AM.partyAttack(); await wait(400); }
    const before = { dead: e.dead, center: S.center && S.center.text, ending: S.ending, crown: S.items.crown };
    await wait(6500);
    return { before, mode: S.mode };
  });
  console.log('final', JSON.stringify(v));
  await page.screenshot({ path: path.join(out, 'soak_victory.png') });
  // mimic
  const m = await page.evaluate(async () => {
    const S = AM.S; S.mode = 'play'; const wait = ms => new Promise(r => setTimeout(r, ms));
    const e = S.enemies.find(e => e.kind === 'HungryMimic'); const i = S.interact.find(i => i.mimic === e);
    S.px = e.x - 1; S.py = e.y; S.pa = 0; await wait(100); const f = AM.findFocus(); const ft = f && f.type; AM.doInteract(f); await wait(200);
    return { focus: ft, state: e.state, spr: e.sd.spr.name, msg: S.msgs.slice(-1)[0] && S.msgs.slice(-1)[0].t };
  });
  console.log('mimic', JSON.stringify(m));
  // rest + travel
  const t = await page.evaluate(async () => {
    const S = AM.S; const wait = ms => new Promise(r => setTimeout(r, ms));
    const b1 = S.bonfires[0], b2 = S.bonfires[1]; b1.lit = true; b2.lit = true; S.flags.bonfire[b1.id] = 1; S.flags.bonfire[b2.id] = 1;
    AM.restAtBonfire(b1); const n1 = S.enemies.filter(e => !e.dead).length;
    S.bonfire = b2.id; AM.respawn(); await wait(100);
    return { enemiesAfterRest: n1, px: S.px, py: S.py, b2: [b2.x, b2.y], mode: S.mode };
  });
  console.log('rest/travel', JSON.stringify(t));
  console.log('errors:', errors.length); errors.slice(0, 10).forEach(e => console.log(e));
  await browser.close();
})();
