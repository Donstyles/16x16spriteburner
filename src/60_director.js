// ===================== the director: floors, waves, and every mind in the room =====================
const G = {
  mode: 'boot', floor: 1, run: 0, kills: 0, best: 1, units: [], heroes: [], mons: [], proj: [], sched: [], pending: 0, phase: 'fight', phaseT: 0,
  wave: 0, waves: 3, waveT: 0, trauma: 0, quakeT: 0, quakeP: 0, hitstop: 0, ts: 1, slowT: 0, flashA: 0, flashC: 'white', ambDark: 0, ambFlash: 0,
  storm: null, eq: null, ultCd: 3, combo: 0, comboT: 0, burst: 0, burstT: 0, banner: null, card: null, fade: 1, time: 0, boss: null,
  monHp: 1, monDmg: 1, heroDmgTaken: 1,
};
function makeParty() {
  const keys = ['warrior', 'pyro', 'storm', 'druid'];
  G.heroes = keys.map((k, i) => { const h = mkUnit('hero', HERO_DEFS[k], 0, 0); h.key = k; h.strafe = i % 2 ? 1 : -1; return h; });
}
function scaleForFloor() {
  const f = G.floor - 1;
  G.monHp = 1 + 0.26 * f; G.monDmg = 2.1 + 0.2 * f;
  for (const h of G.heroes) { h.mul = 1 + 0.13 * f; const mx = Math.round(h.def.hp * (1 + 0.1 * f)); h.hp = Math.round(h.hp / h.maxHp * mx); h.maxHp = mx; }
}
function startRun() {
  G.run++; G.floor = 1; makeParty(); startFloor(true);
}
function startFloor(first) {
  buildArena(G.floor); G.units = []; G.proj = []; G.sched = []; G.pending = 0; G.storm = null; G.eq = null; G.boss = null;
  for (const k in FX) FX[k].length = 0;
  scaleForFloor();
  const cx = ARENA.pw / 2, cy = ARENA.y1 - 30;
  G.heroes.forEach((h, i) => { h.dead = false; if (h.hp <= 0) h.hp = h.maxHp; h.x = cx + (i - 1.5) * 18; h.y = cy - (i % 2) * 10; h.z = 180 + i * 30; h.vz = 0; h.kx = h.ky = 0; h.state = null; h.stun = 0; h.cd = {}; G.units.push(h); });
  G.bossFloor = G.floor % 4 === 0; G.waves = G.bossFloor ? 2 : Math.min(5, 2 + Math.floor(G.floor / 2)); G.wave = 0; G.waveT = first ? 4.4 : 2.2; G.phase = 'fight'; G.phaseT = 0;
  CAM.x = cx; CAM.y = ARENA.ph / 2; CAM.z = camFitZoom();
  G.card = { t: 0, life: 2.6, a: 'FLOOR ' + G.floor, b: G.bossFloor ? 'SOMETHING WAITS BELOW' : ARENA.name };
  G.fade = 1; SFX.boom(0.7, 0);
}
function spawnWave() {
  G.wave++;
  const last = G.wave === G.waves;
  if (G.bossFloor && last) { spawnBoss(); return; }
  const f = G.floor, maxTier = f <= 2 ? 1 : f <= 4 ? 2 : f <= 7 ? 3 : 4;
  let budget = 8 + f * 3.8 + G.wave * 2.5; const pool = Object.values(MON_DEFS).filter(d => d.tier <= maxTier), list = [];
  while (budget > 0 && list.length < 26) { const d = pick(pool); if (TIER_COST[d.tier] > budget + 2 && list.length) { if (pool.every(x => TIER_COST[x.tier] > budget)) break; continue; } list.push(d); budget -= TIER_COST[d.tier]; }
  list.forEach((d, i) => {
    let x, y, tries = 0; do { const r = chance(0.6) ? pick(ARENA.runes) : null; x = r ? r.x + rand(-10, 10) : rand(ARENA.x0 + 10, ARENA.x1 - 10); y = r ? r.y + rand(-8, 8) : rand(ARENA.y0 + 10, ARENA.y1 - 10); tries++; } while (tries < 12 && (G.heroes.some(h => !h.dead && dist(h.x, h.y, x, y) < 70) || nearestSolid(x, y, 8)));
    summonMon(d, x, y, i * 0.09);
  });
  if (G.wave > 1) textBanner('WAVE ' + G.wave, '');
}
function spawnBoss() {
  const def = BOSS_DEFS[(Math.floor(G.floor / 4) - 1) % BOSS_DEFS.length], x = ARENA.pw / 2, y = ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.38;
  G.ambDark = 1; SFX.braam(); SFX.quake(2.5); quake(2.4, 0.7);
  circleFx(x, y, 44, def.col || 'arcane', 2.4); cracks(x, y, 10, 70, 140, 4, 'magma');
  for (let i = 0; i < 40; i++) after(i * 0.05, () => { part({ k: 'glow', x: x + rand(-40, 40), y: y + rand(-28, 28), z: 0, vz: rand(40, 120), drag: 0.4, life: rand(0.6, 1.2), s0: rand(2, 4), s1: 0, col: def.col || 'arcane' }); });
  G.pending++;
  after(2.2, () => {
    G.pending--; const b = mkUnit('mon', { ...def, ai: 'boss', scale: 3, r: 5, spd: 34, dmg: 30 }, x, y, G.monHp * 2.3); b.boss = true; b.mul = G.monDmg; b.moveT = 1.5; b.mi = 0; b.spawnT = 0.3; G.units.push(b); G.boss = b;
    part({ k: 'glow', x, y, z: 20, life: 0.3, s0: 40, s1: 90, col: 'hot' }); ring(x, y, 140, def.col || 'arcane', 0.7, 8); ring(x, y, 80, 'white', 0.4, 5); flash('white', 0.7); flashLight(x, y, 260, def.col || 'arcane', 2, 0.6);
    smoke(x, y, 16, 'dark', 22, 80, 2.4, 20); debris(x, y, 40, ['#5a5048', '#7d7064', '#3c342e'], 220, 280, 2.4); shake(1); hitstop(0.12); slowmo(0.35, 0.8); SFX.thunder(0, 1.3); buzz([300, 100, 300]);
    textBanner(def.name, def.sub, def.col || 'red');
  });
}
function canUlt(h) { return h.ult >= 100 && G.ultCd <= 0 && !G.storm && !G.eq && (G.mons.length >= 4 || (G.boss && alive(G.boss))); }
function useUlt(h, fn) { h.ult = 0; G.ultCd = 4.2; fn(h); }
function heroAI(h, dt) {
  if (h.dead) { h.deadT += dt; return; }
  for (const k in h.cd) h.cd[k] -= dt;
  h.ult = Math.min(100, h.ult + dt * 2.6);
  if (h.z > 0 && G.phase !== 'fight') return;
  if (h.stun > 0) { h.stun -= dt; h.vx = damp(h.vx, 0, 8, dt); h.vy = damp(h.vy, 0, 8, dt); return; }
  if (h.state) { heroState(h, dt); return; }
  const foes = G.mons.filter(m => m.spawnT <= 0);
  if (!foes.length || G.phase !== 'fight') { const i = G.heroes.indexOf(h), tx = (ARENA.pw / 2) + (i - 1.5) * 20, ty = ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.6 + (i % 2) * 10; steer(h, tx, ty, h.def.spd * 0.7, dt, 4); return; }
  if (h.key === 'warrior') {
    const casters = G.heroes.filter(x => x !== h && !x.dead), cx = casters.length ? casters.reduce((a, c) => a + c.x, 0) / casters.length : h.x, cy = casters.length ? casters.reduce((a, c) => a + c.y, 0) / casters.length : h.y;
    let t = nearest({ x: cx, y: cy }, foes, 70) || nearest(h, foes); if (G.boss && alive(G.boss) && G.boss.spawnT <= 0 && chance(0.02)) t = G.boss; if (h.target && alive(h.target) && dist(h.x, h.y, h.target.x, h.target.y) < 40) t = h.target; h.target = t;
    if (canUlt(h)) { const d = densest(foes, 50, h, 200); if (d && (d.n >= 4 || G.boss)) return useUlt(h, cataclysm); }
    const close = within(h.x, h.y, 30, foes).length;
    if (close >= 3 && !(h.cd.whirl > 0)) { h.cd.whirl = 6.5; return whirlwind(h); }
    const d = steer(h, t.x, t.y, h.def.spd, dt, h.r + t.r + 8);
    if (d < h.r + t.r + 14 && !(h.cd.slash > 0)) { h.cd.slash = 0.55; slash(h, t); }
  } else {
    kite(h, foes, dt, h.key === 'druid' ? 85 : 100);
    if (h.key === 'pyro') {
      if (canUlt(h)) return useUlt(h, meteorStorm);
      if (!(h.cd.nova > 0) && within(h.x, h.y, 40, foes).length >= 3) { h.cd.nova = 7; return flameNova(h); }
      if (!(h.cd.fire > 0)) { const d = densest(foes, 26, h, 170); if (d) { h.cd.fire = 1.35; castFireball(h, d.x, d.y, d.n >= 4 ? 1.25 : 1); } }
    } else if (h.key === 'storm') {
      if (canUlt(h)) return useUlt(h, thunderstorm);
      const t = nearest(h, foes, 160);
      if (t && !(h.cd.ball > 0) && foes.length >= 4) { h.cd.ball = 7.5; return ballLightning(h, t); }
      if (t && !(h.cd.chain > 0)) { h.cd.chain = 1.9; chainLightning(h, t); }
    } else if (h.key === 'druid') {
      if (canUlt(h)) return useUlt(h, earthquake);
      const fallen = G.heroes.find(x => x.dead && x.deadT > 2.5);
      if (fallen && !(h.cd.revive > 0)) { h.cd.revive = 18; h.lunge = 0.3; fallen.dead = false; fallen.hp = Math.round(fallen.maxHp * 0.45); fallen.stun = 0.6; fallen.vz = 90; column(fallen.x, fallen.y, 'heal', 1.6, 18); ring(fallen.x, fallen.y, 60, 'heal', 0.6, 5); flashLight(fallen.x, fallen.y, 150, 'heal', 1.8, 0.7); for (let i = 0; i < 30; i++) part({ k: 'glow', x: fallen.x + rand(-10, 10), y: fallen.y + rand(-5, 5), z: rand(0, 30), vz: rand(30, 90), drag: 0.6, life: rand(0.8, 1.6), s0: rand(2, 4), s1: 0, col: chance(0.5) ? 'heal' : 'gold' }); textBanner(fallen.def.name + ' RISES', 'PULLED FROM THE DARK BY ' + h.def.name, 'heal'); SFX.heal(); slowmo(0.5, 0.4); return; }
      const hurtList = G.heroes.filter(x => !x.dead && x.hp < x.maxHp * 0.7).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      if (hurtList.length && !(h.cd.heal > 0)) { h.cd.heal = 5; h.lunge = 0.2; SFX.heal(); if (hurtList.length >= 2) { for (const x of hurtList) { heal(x, x.maxHp * 0.18 * h.mul); column(x.x, x.y, 'heal', 0.9, 9); } } else { heal(hurtList[0], hurtList[0].maxHp * 0.3 * h.mul); column(hurtList[0].x, hurtList[0].y, 'heal', 1.1, 12); ring(hurtList[0].x, hurtList[0].y, 30, 'heal', 0.4, 3); } return; }
      const t = nearest(h, foes, 140); if (t && !(h.cd.spike > 0)) { h.cd.spike = 2.8; stoneSpikes(h, t); }
    }
  }
}
function kite(h, foes, dt, pref) {
  const n = nearest(h, foes); if (!n) return; const d = dist(h.x, h.y, n.x, n.y); let tx, ty;
  if (d < pref * 0.65) { const a = angTo(n.x, n.y, h.x, h.y); tx = h.x + Math.cos(a) * 50; ty = h.y + Math.sin(a) * 40; }
  else if (d > pref * 1.35) { tx = n.x; ty = n.y; }
  else { const a = angTo(n.x, n.y, h.x, h.y) + 0.5 * h.strafe; tx = n.x + Math.cos(a) * pref; ty = n.y + Math.sin(a) * pref * 0.8; }
  const W = G.heroes.find(x => x.key === 'warrior' && !x.dead); if (W && dist(tx, ty, W.x, W.y) > 110) { tx = (tx + W.x) / 2; ty = (ty + W.y) / 2; }
  tx = clamp(tx, ARENA.x0 + 16, ARENA.x1 - 16); ty = clamp(ty, ARENA.y0 + 14, ARENA.y1 - 10);
  if ((h.flip = (h.flip || 0) - dt) <= 0) { h.flip = rand(2, 5); h.strafe = -h.strafe; }
  steer(h, tx, ty, h.def.spd, dt, 3); h.face = n.x < h.x ? -1 : 1;
}
function heroState(h, dt) {
  const s = h.state; s.t += dt;
  if (s.k === 'whirl') {
    h.vx = damp(h.vx, 0, 6, dt); h.vy = damp(h.vy, 0, 6, dt); s.tick -= dt; h.face = ((s.t * 12) | 0) % 2 ? 1 : -1; light(h.x, h.y, 60, 'gold', 0.8);
    if (s.tick <= 0) { s.tick = 0.11; const a = s.t * 22; arcFx(h.x, h.y - 6, a, 2.6, 24, 'gold', 0.16, 3.5); for (const u of within(h.x, h.y, 30, G.mons)) { const b = angTo(h.x, h.y, u.x, u.y); hurt(u, h.def.dmg * h.mul * 0.55, h, { elem: 'phys', kx: Math.cos(b) * 120, ky: Math.sin(b) * 90, stun: 0.2 }); sparks(u.x, u.y, 8, 4, 'gold', 140, 80); } SFX.slash(panOf(h.x)); }
    if (s.t >= s.dur) h.state = null;
  } else if (s.k === 'leap') {
    const u = Math.min(1, s.t / s.dur); h.x = lerp(s.x0, s.x1, u); h.y = lerp(s.y0, s.y1, u); h.z = Math.sin(u * Math.PI) * 70; h.vz = 0; h.face = s.x1 < s.x0 ? -1 : 1;
    glows(h.x, h.y, h.z + 6, 1, 'gold', 20, 5, 0.3);
    if (u >= 1) { h.z = 0; h.state = null; h.squash = 0.5; slamFx(h.x, h.y, 1.25, 'gold'); flash('white', 0.35); slowmo(0.3, 0.45); for (const m of within(h.x, h.y, 64, G.mons)) { const a = angTo(h.x, h.y, m.x, m.y); hurt(m, h.def.dmg * h.mul * 3.4, h, { elem: 'earth', up: 260, stun: 1.2, kx: Math.cos(a) * 260, ky: Math.sin(a) * 200, crit: true }); } hitProps(h.x, h.y, 40); }
  }
}
function monAI(m, dt, heroes) {
  if (m.spawnT > 0) { m.spawnT -= dt; return; }
  for (const k in m.cd) m.cd[k] -= dt;
  if (m.burn > 0) { m.burn -= dt; if (chance(dt * 14)) glows(m.x, m.y, rand(4, 14) * m.scale, 1, 'fire', 20, 3, 0.4); if ((m.burnT = (m.burnT || 0) - dt) <= 0) { m.burnT = 0.5; hurt(m, 3 * G.floor ** 0.5, null, { quiet: true }); } }
  if (m.shock > 0) { m.shock -= dt; if (chance(dt * 10)) { const a = rand(TAU); bolt(m.x, m.y - 8 * m.scale, m.x + Math.cos(a) * 12, m.y - 8 * m.scale + Math.sin(a) * 10, { life: 0.08, w: 0.4, branches: 0 }); } }
  if (m.state) { monState(m, dt); return; }
  if (m.stun > 0) { m.stun -= dt; m.vx = damp(m.vx, 0, 8, dt); m.vy = damp(m.vy, 0, 8, dt); m.moving = false; return; }
  let t = null, bd = 1e9; for (const h of heroes) { const d = dist(m.x, m.y, h.x, h.y) * (h.key === 'warrior' ? 0.7 : 1); if (d < bd) { bd = d; t = h; } }
  if (!t) { m.vx = damp(m.vx, 0, 5, dt); m.vy = damp(m.vy, 0, 5, dt); return; }
  if (m.boss) return bossAI(m, dt, t);
  const d = dist(m.x, m.y, t.x, t.y), reach = m.r + t.r + (m.def.reach || 3), ai = m.def.ai;
  if (m.atkT > 0) { m.atkT -= dt; m.vx = damp(m.vx, 0, 12, dt); m.vy = damp(m.vy, 0, 12, dt); if (m.atkT <= 0) { m.lunge = 0.3; m.la = angTo(m.x, m.y, t.x, t.y); if (ai === 'heavy') heavySlam(m); else if (dist(m.x, m.y, t.x, t.y) < reach + 6) hurt(t, m.def.dmg * m.mul, m, { kx: Math.cos(m.la) * 60, ky: Math.sin(m.la) * 45 }); } return; }
  if (ai === 'ranged' || ai === 'caster') {
    const pref = ai === 'ranged' ? 85 : 100; if (d < pref * 0.6) { const a = angTo(t.x, t.y, m.x, m.y); steer(m, m.x + Math.cos(a) * 30, m.y + Math.sin(a) * 30, m.def.spd, dt); } else if (d > pref) steer(m, t.x, t.y, m.def.spd, dt); else { m.vx = damp(m.vx, 0, 6, dt); m.vy = damp(m.vy, 0, 6, dt); m.moving = false; }
    m.face = t.x < m.x ? -1 : 1;
    if (!(m.cd.shot > 0) && d < pref * 1.6) { m.cd.shot = rand(1.6, 2.6); monShot(m, t); }
  } else {
    steer(m, t.x, t.y, m.def.spd, dt, reach - 1);
    if (d < reach + 2 && !(m.cd.atk > 0)) { m.cd.atk = ai === 'heavy' ? rand(2.2, 3) : rand(0.9, 1.5); m.atkT = ai === 'heavy' ? 0.5 : 0.28; if (ai === 'heavy') teleg(m.x, m.y, 26 * m.scale, 0.5); }
  }
}
function bossAI(b, dt, t) {
  b.moveT -= dt;
  if (b.moveT <= 0) { const mv = b.def.moves[b.mi++ % b.def.moves.length]; b.moveT = rand(3, 4); bossMove(b, mv, t); return; }
  const d = steer(b, t.x, t.y, b.def.spd || 34, dt, b.r + t.r + 4);
  if (d < b.r + t.r + 10 && !(b.cd.atk > 0)) { b.cd.atk = 1.3; b.lunge = 0.35; b.la = angTo(b.x, b.y, t.x, t.y); arcFx(b.x, b.y - 10, b.la, 2, 30, b.def.col || 'red', 0.22, 5); for (const h of within(b.x, b.y, b.r + 18, G.heroes)) hurt(h, 26 * b.mul, b, { kx: Math.cos(b.la) * 200, ky: Math.sin(b.la) * 150, up: 60 }); shake(0.15); SFX.slash(panOf(b.x)); }
}
function monState(m, dt) {
  const s = m.state; s.t += dt;
  if (s.k === 'windup') { m.vx = damp(m.vx, 0, 12, dt); m.vy = damp(m.vy, 0, 12, dt); m.x += rand(-0.6, 0.6); if (s.t >= s.dur) m.state = s.next; }
  else if (s.k === 'charge') {
    m.vx = Math.cos(s.a) * 240; m.vy = Math.sin(s.a) * 190; m.moving = true; if (chance(0.6)) smoke(m.x, m.y, 1, 'dust', 10, 20, 0.9); if (chance(0.25)) cracks(m.x, m.y, 2, 14, 300, 0.8);
    for (const h of within(m.x, m.y, m.r + 8, G.heroes)) if (!s.hit || !s.hit.has(h)) { (s.hit || (s.hit = new Set())).add(h); hurt(h, 40 * m.mul, m, { kx: Math.cos(s.a) * 300, ky: Math.sin(s.a) * 240, up: 160, stun: 0.6 }); shake(0.3); }
    const wall = m.x <= ARENA.x0 + m.r + 1 || m.x >= ARENA.x1 - m.r - 1 || m.y <= ARENA.y0 + 3 || m.y >= ARENA.y1 - 1;
    if (s.t >= s.dur || wall) { m.state = null; m.vx = m.vy = 0; ring(m.x, m.y, 70, 'earth', 0.4, 5); debris(m.x, m.y, 20, ['#5a5048', '#7d7064'], 160, 200, 2); shake(0.5); SFX.boom(0.9, panOf(m.x)); if (wall) { m.stun = 1; textPop(m.x, m.y, 50, 'STUNNED', 'gold'); } }
  } else if (s.k === 'leap') {
    const u = Math.min(1, s.t / s.dur); m.x = lerp(s.x0, s.x1, u); m.y = lerp(s.y0, s.y1, u); m.z = Math.sin(u * Math.PI) * 90;
    if (u >= 1) { m.z = 0; m.state = null; m.squash = 0.5; slamFx(m.x, m.y, 1.4, m.def.col || 'red'); for (const h of within(m.x, m.y, 50, G.heroes)) { const a = angTo(m.x, m.y, h.x, h.y); hurt(h, 46 * m.mul, m, { kx: Math.cos(a) * 280, ky: Math.sin(a) * 220, up: 200, stun: 0.5 }); } }
  } else if (s.k === 'beam') {
    m.vx = damp(m.vx, 0, 10, dt); m.vy = damp(m.vy, 0, 10, dt);
    const u = Math.min(1, s.t / s.dur), a = lerp(s.a0, s.a1, u), ex = m.x, ey = m.y - 14 * m.scale, L = 320; let x1 = ex + Math.cos(a) * L, y1 = ey + Math.sin(a) * L;
    // clip to the room
    for (let k = 0; k < 64; k++) { const fx = ex + Math.cos(a) * L * k / 64, fy = ey + Math.sin(a) * L * k / 64; if (!inArena(fx, fy)) { x1 = fx; y1 = fy; break; } }
    FX.beams.push({ x0: ex, y0: ey, x1, y1, w: 4, col: m.def.col || 'arcane', t: 0, life: 0.05 }); light(x1, y1, 80, m.def.col || 'arcane', 1.5); light(ex, ey, 60, m.def.col || 'arcane', 1.2);
    for (let k = 0; k < 5; k++) light(lerp(ex, x1, k / 5), lerp(ey, y1, k / 5), 40, m.def.col || 'arcane', 0.8);
    sparks(x1, y1, 2, 3, m.def.col === 'fire' ? 'fire' : 'arcane', 160, 120); if (chance(0.5)) scorch(x1, y1, 6, 0.4); shake(0.04);
    s.tick -= dt; if (s.tick <= 0) { s.tick = 0.1; for (const h of G.heroes) { if (h.dead) continue; const px = h.x - ex, py = h.y - ey, dx = x1 - ex, dy = y1 - ey, tt = clamp((px * dx + py * dy) / (dx * dx + dy * dy), 0, 1), dd = Math.hypot(px - dx * tt, py - dy * tt); if (dd < 9) hurt(h, 7 * m.mul, m, { elem: 'fire' }); } }
    if (s.t >= s.dur) m.state = null;
  }
}
function updateDirector(dt) {
  G.phaseT += dt;
  if (G.phase === 'fight') {
    if (!G.heroes.some(h => !h.dead)) { G.phase = 'wipe'; G.phaseT = 0; slowmo(0.3, 2); textBanner('THE PARTY HAS FALLEN', 'FLOOR ' + G.floor + ' · ' + G.kills.toLocaleString() + ' SLAIN', 'red'); SFX.braam(); return; }
    if (!G.mons.length && !G.pending) {
      if (G.wave < G.waves) { G.waveT -= dt; if (G.waveT <= 0) { spawnWave(); G.waveT = 1.6; } }
      else { G.phase = 'clear'; G.phaseT = 0; }
    }
  } else if (G.phase === 'clear') {
    if (G.phaseT > 0.6 && !G.cleared) { G.cleared = true; textBanner('FLOOR ' + G.floor + ' CLEARED', G.combo > 5 ? 'BEST STREAK ' + G.combo : '', 'gold'); }
    if (G.phaseT > 1.6 && !G.revived) { G.revived = true; for (const h of G.heroes) { if (h.dead) { h.dead = false; h.hp = Math.round(h.maxHp * 0.6); column(h.x, h.y, 'gold', 1.4, 16); ring(h.x, h.y, 40, 'gold', 0.5, 4); flashLight(h.x, h.y, 120, 'gold', 1.6, 0.6); textPop(h.x, h.y, 24, h.def.name + ' RISES', 'gold'); } else heal(h, h.maxHp * 0.5); } SFX.heal(); }
    if (G.phaseT > 3.4 && !G.collapse) { G.collapse = true; collapseFloor(); }
    if (G.phaseT > 5.6) G.fade = Math.min(1, (G.phaseT - 5.6) / 0.6);
    if (G.phaseT > 6.3) { G.cleared = G.revived = G.collapse = false; G.floor++; G.best = Math.max(G.best, G.floor); startFloor(false); }
  } else if (G.phase === 'wipe') {
    if (G.phaseT > 3.6) G.fade = Math.min(1, (G.phaseT - 3.6) / 0.6);
    if (G.phaseT > 4.4) startRun();
  }
}
function collapseFloor() {
  textBanner('THE FLOOR GIVES WAY', '', 'earth'); SFX.quake(3); SFX.braam(); quake(2.6, 1.1); buzz([150, 60, 150, 60, 400]);
  const cx = ARENA.pw / 2, cy = (ARENA.y0 + ARENA.y1) / 2;
  cracks(cx, cy, 12, 160, 220, 3.5);
  for (let i = 0; i < 26; i++) after(i * 0.08, () => { const x = rand(ARENA.x0, ARENA.x1), y = rand(ARENA.y0, ARENA.y1); debris(x, y, 6, ['#5a5048', '#7d7064', '#3c342e'], 80, 140, 2); smoke(x, y, 2, 'dust', 14, 30, 1.6, 10); if (i % 4 === 0) { cracks(x, y, 4, 50, 300, 2.5); SFX.hit(panOf(x)); } });
  for (const h of G.heroes) if (!h.dead) after(1.6, () => { h.vz = 160; });
}
