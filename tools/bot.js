// Walkthrough bot: real movement via injected input. Cell -> hub bonfire -> fog gate -> Minotaur fight.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://127.0.0.1:8787/index.html');
  await page.waitForFunction(() => document.getElementById('loading').style.display === 'none', null, { timeout: 30000 });
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  await page.evaluate(() => {
    const S = AM.S, I = AM.Input, M = AM.MAP; S.fade = null;
    window.BOT = { log: [], path: null, target: null, done: false, t0: performance.now() };
    const MW = 64;
    const solidCells = new Set(S.objects.filter(o => o.solid).map(o => ((o.y | 0) * MW + (o.x | 0))));
    const passable = i => M.type[i] !== 1 && M.type[i] !== 3 && !solidCells.has(i);
    window.BOT.bfs = (sx, sy, tx, ty) => {
      const prev = new Int32Array(MW * 80).fill(-1); const q = [sy * MW + sx]; prev[sy * MW + sx] = sy * MW + sx;
      while (q.length) { const i = q.shift(); if (i === ty * MW + tx) break; const x = i % MW, y = (i / MW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; const j = ny * MW + nx; if (nx < 0 || ny < 0 || nx >= MW || ny >= 80 || prev[j] >= 0 || (!passable(j) && j !== ty * MW + tx)) continue; prev[j] = i; q.push(j); } }
      const pth = []; let i = ty * MW + tx; if (prev[i] < 0) return null; while (i !== sy * MW + sx) { pth.push([i % MW + 0.5, ((i / MW) | 0) + 0.5]); i = prev[i]; } return pth.reverse();
    };
    window.BOT.goto = (tx, ty) => { window.BOT.path = window.BOT.bfs(S.px | 0, S.py | 0, tx, ty); window.BOT.log.push('path to ' + tx + ',' + ty + ' len ' + (window.BOT.path ? window.BOT.path.length : 'NONE')); };
    // per-frame steering, runs before the game loop via rAF ordering
    const step = () => {
      requestAnimationFrame(step);
      if (S.mode !== 'play') { I.keys.KeyW = false; return; }
      const B = window.BOT;
      // combat policy: if target, face it and attack; flask when any member < 35%
      const T = S.target;
      if (T && Math.hypot(T.x - S.px, T.y - S.py) < 6) {
        const a = Math.atan2(T.y - S.py, T.x - S.px); S.pa = a;
        AM.partyAttack();
        const low = S.party.some(m => !m.dead && m.hp < m.hpMax * 0.35);
        if (low && S.estus > 0 && !B.flaskT || (B.flaskT && performance.now() - B.flaskT > 4000 && low && S.estus > 0)) { AM.useFlask(); B.flaskT = performance.now(); }
        const d = Math.hypot(T.x - S.px, T.y - S.py);
        I.keys.KeyW = d > 1.3 && T.def.behav !== 'ranged'; I.keys.KeyS = d < 0.9;
        if (T.state === 'windup' && Math.random() < 0.05) AM.Input.press('dodge');
        return;
      }
      I.keys.KeyS = false;
      if (B.path && B.path.length) {
        const [tx, ty] = B.path[0]; const dx = tx - S.px, dy = ty - S.py, d = Math.hypot(dx, dy);
        if (d < 0.25) { B.path.shift(); return; }
        const want = Math.atan2(dy, dx); let da = want - S.pa; da = Math.atan2(Math.sin(da), Math.cos(da));
        S.pa += Math.max(-0.25, Math.min(0.25, da));
        I.keys.KeyW = Math.abs(da) < 0.6;
        B.stuck = (B.stuck || 0) + 1;
      } else I.keys.KeyW = false;
    };
    requestAnimationFrame(step);
  });
  const run = async (tx, ty, ms, label) => {
    await page.evaluate(([tx, ty]) => window.BOT.goto(tx, ty), [tx, ty]);
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { await page.waitForTimeout(250); const d = await page.evaluate(() => !window.BOT.path || window.BOT.path.length === 0); if (d) break; }
    const st = await page.evaluate(() => ({ px: +AM.S.px.toFixed(1), py: +AM.S.py.toFixed(1), left: window.BOT.path ? window.BOT.path.length : null, hp: AM.S.party.map(m => m.hp | 0), souls: AM.S.souls, mode: AM.S.mode, est: AM.S.estus }));
    console.log(label, JSON.stringify(st));
    return st;
  };
  await run(3, 8, 15000, 'leave cell');           // through the door, down the corridor
  await run(13, 14, 20000, 'to hub');
  await page.evaluate(() => { AM.S.pa = Math.atan2(13.5 - AM.S.py, 13.5 - AM.S.px); });
  await page.waitForTimeout(200);
  console.log('focus at hub:', await page.evaluate(() => { const f = AM.findFocus(); return f && f.type; }));
  await page.evaluate(() => AM.doInteract(AM.findFocus()));
  await page.waitForTimeout(500);
  console.log('bonfire lit:', await page.evaluate(() => ({ lit: AM.S.bonfires.find(b => b.id === '13,13').lit, center: AM.S.center && AM.S.center.text })));
  await page.screenshot({ path: path.join(out, 'bot_hub.png') });
  await run(11, 3, 25000, 'north room (loot)');
  await run(20, 13, 30000, 'to fog gate');
  await page.evaluate(() => { AM.S.pa = 0; });
  await page.waitForTimeout(200);
  console.log('focus at fog:', await page.evaluate(() => { const f = AM.findFocus(); return f && f.type + ':' + (f.door && f.door.kind); }));
  await page.evaluate(() => AM.doInteract(AM.findFocus()));
  await page.waitForTimeout(500);
  console.log('boss awake:', await page.evaluate(() => AM.S.boss && AM.S.boss.name));
  // fight until boss dead or party dead (max 90s)
  const t0 = Date.now(); let st;
  while (Date.now() - t0 < 90000) { await page.waitForTimeout(500); st = await page.evaluate(() => ({ mode: AM.S.mode, bhp: AM.S.boss ? AM.S.boss.hp | 0 : null, hp: AM.S.party.map(m => m.hp | 0), est: AM.S.estus, flag: Object.keys(AM.S.flags.boss).length })); if (st.mode === 'dead' || st.bhp === null) break; }
  console.log('fight result', JSON.stringify(st), 'in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await page.screenshot({ path: path.join(out, 'bot_fight.png') });
  console.log('bot log:', await page.evaluate(() => window.BOT.log.join(' | ')));
  console.log('errors:', errors.length); errors.slice(0, 5).forEach(e => console.log(e));
  await browser.close();
})();
