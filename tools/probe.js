const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const r = await page.evaluate(async () => {
    const out = {}; const S = AM.S;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    // 1. death with souls
    S.souls = 777; S.px = 5.5; S.py = 9.5;
    try { AM.dieParty(); } catch (e) { out.dieErr = e.message + ' ' + e.stack.split('\n')[1]; }
    out.afterDie = { mode: S.mode, souls: S.souls, blood: S.bloodstain };
    await wait(4200);
    out.afterRespawn = { mode: S.mode, px: S.px, py: S.py, bonfire: S.bonfire, blood: S.bloodstain };
    // 2. walk over bloodstain
    S.px = 5.5; S.py = 9.5; await wait(100);
    out.pickedBlood = { souls: S.souls, blood: S.bloodstain };
    // 3. chest
    S.px = 13.5; S.py = 3.6; S.pa = -Math.PI / 2; await wait(100);
    const f = AM.findFocus(); out.chestFocus = f && f.type; AM.doInteract(f); out.chestSouls = S.souls;
    // 4. locked door message
    S.px = 13.5; S.py = 24.3; S.pa = Math.PI / 2; await wait(100);
    const f2 = AM.findFocus(); out.lockFocus = f2 && (f2.type + ':' + (f2.door && f2.door.kind)); AM.doInteract(f2); out.lockMsg = S.msgs.map(m => m.t).slice(-1)[0];
    AM.giveItem('key_reliquary'); AM.doInteract(AM.findFocus()); out.unlockMsg = S.msgs.map(m => m.t).slice(-1)[0];
    // 5. door auto-open: stand next to door (3,5)
    S.px = 3.5; S.py = 4.3; await wait(900); const d = AM.MAP.doors.find(d => d.x === 3 && d.y === 5); out.doorOpen = d.open;
    // 6. fog gate traversal
    S.px = 19.5; S.py = 13.5; S.pa = 0; await wait(100); const f3 = AM.findFocus(); out.fogFocus = f3 && f3.type; AM.doInteract(f3); await wait(100);
    out.afterFog = { px: S.px, boss: S.boss && S.boss.name, mode: S.mode };
    // 7. lever + gate
    const lv = S.interact.find(i => i.type === 'lever'); S.px = lv.x; S.py = lv.y; AM.doInteract(lv); const g = AM.MAP.doors.find(d => d.x === lv.gate[0] && d.y === lv.gate[1]); out.gate = { unlocked: g.unlocked, target: g.target };
    // 8. save / load roundtrip
    AM.saveGame(); const ok = AM.loadGame(); out.load = { ok, souls: S.souls, keys: Object.keys(S.items), bonfire: S.bonfire, mode: S.mode, px: S.px, py: S.py };
    // 9. count sprites/entities
    out.counts = { enemies: S.enemies.length, objects: S.objects.length, interact: S.interact.length, pickups: S.pickups.length, doors: AM.MAP.doors.length };
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  console.log('errors:', errors.length); errors.slice(0, 10).forEach(e => console.log(e));
  await browser.close();
})();
