// ===================== the director: floors, waves, and every mind in the room =====================
const G = {
  mode: 'boot', floor: 1, run: 0, kills: 0, best: 1, units: [], heroes: [], mons: [], proj: [], sched: [], pending: 0, phase: 'fight', phaseT: 0,
  lvl: 1, xp: 0, bestLvl: 1, castLock: 0, majorLock: 0, focus: null, bq: [], spawnQ: [], inten: 0, champ: null, gapT: 0, waveSize: 0, packT: 0, wave: 0, waves: 3, waveT: 0, trauma: 0, quakeT: 0, quakeP: 0, hitstop: 0, ts: 1, slowT: 0, flashA: 0, flashC: 'white', ambDark: 0, ambFlash: 0,
  storm: null, eq: null, ultCd: 3, ultLock: 0, ultBy: '', combo: 0, comboT: 0, burst: 0, burstT: 0, banner: null, card: null, fade: 1, time: 0, boss: null,
  monHp: 1, monDmg: 1, heroDmgTaken: 1.5, me: null, sb0: null, draftKey: null, moveMode: 0, spellMode: 0,
  // older code and tests speak of one 'auto' level: 0 manual, 1 auto spells, 2 autopilot with auto spells
  get autoMode() { return this.moveMode === 2 ? 2 : this.spellMode ? 1 : 0; }, set autoMode(v) { this.moveMode = v === 2 ? 2 : 0; this.spellMode = v >= 1 ? 1 : 0; },
};
// spell state lives on each hero; G.known etc. read the local player's hero (or the shared profile before a hero is chosen)
const SBP = () => (G.me && G.me.sb) || G.sb0;
const sbOf = h => (h && h.sb) || G.sb0;
[['known', 'known'], ['slots', 'slots'], ['basic', 'basic'], ['modsTaken', 'mods'], ['modv', 'modv']].forEach(([k, f]) => Object.defineProperty(G, k, { get: () => SBP()[f], set: v => { SBP()[f] = v; } }));
Object.defineProperty(G, 'heroKey', { get: () => G.me ? G.me.key : G.draftKey, set: v => { G.draftKey = v; } });
function asHero(h, fn) { const m = G.me; G.me = h; try { return fn(); } finally { G.me = m; } }
const NP = () => Math.max(1, Math.min(4, G.heroes.length)); // heroes in the fight, 1-4
const newInp = () => ({ mx: 0, my: 0, castQ: [], dashQ: false, mv: 0, sp: 0 });
function makeParty() {
  const keys = Object.keys(HERO_DEFS);
  G.heroes = keys.map((k, i) => { const h = mkUnit('hero', HERO_DEFS[k], 0, 0); h.key = k; h.strafe = i % 2 ? 1 : -1; h.ult = 0; return h; });
}
function scaleForFloor() {
  const f = G.floor - 1;
  const pity = Math.pow(0.85, G.floorFalls || 0); G.monHp = (1.4 + 0.32 * f) * pity; G.monDmg = (1 + 0.16 * f) * pity; scaleParty();
}
function startRun(noDraft) {
  G.run++; G.floor = 1; G.lvl = 1; G.xp = 0; resetSpells(); makeParty(); startFloor(true); if (!noDraft) queueDraft();
}
function startFloor(first) {
  buildArena(G.floor); G.units = []; G.proj = []; G.sched = []; G.pending = 0; G.storm = null; G.eq = null; G.boss = null;
  for (const k in FX) FX[k].length = 0;
  scaleForFloor();
  const cx = ARENA.pw / 2, cy = ARENA.y1 - 30;
  G.heroes.forEach((h, i) => { h.dead = false; if (h.hp <= 0) h.hp = h.maxHp; h.x = cx + (i - (G.heroes.length - 1) / 2) * 18; h.y = cy - (i % 2) * 10; h.z = 180 + i * 30; h.vz = 0; h.kx = h.ky = 0; h.state = null; h.stun = 0; h.cd = {}; G.units.push(h); });
  G.bossFloor = G.floor % 4 === 0; G.waves = waveCount(); G.wave = 0; G.waveT = first ? 4 : 3.4; G.cdn = first ? 3 : 0; G.fightT = 0; G.spawnQ = []; G.inten = 0; G.champ = null; G.addT = 8; G.phase = 'fight'; G.phaseT = 0;
  CAM.x = cx; CAM.y = ARENA.ph / 2; CAM.z = camFitZoom();
  G.card = { t: 0, life: 2.6, a: 'FLOOR ' + G.floor, b: G.bossFloor ? 'SOMETHING WAITS BELOW' : ARENA.name, c: floorLine(G.floor) };
  G.fade = 1; SFX.boom(0.7, 0);
}
const WARLORD_NAMES = ['GRIMFANG', 'SKARR', 'VORGATH', 'MULK', 'RAZZIK', 'OLD TUSK', 'BLOODEYE', 'THE BUTCHER', 'GNASH', 'IRONJAW', 'SKULLDRINKER', 'MOTHER ROT'];
const WAVE_CALLS = ['THE RUNES AWAKEN', 'MORE COME', 'THE HORDE GROWS', 'THE WALLS SHAKE', 'THEY KEEP COMING', 'THE CELLAR BLEEDS', 'NO END TO THEM'];
const MON_CAP = 50;
function waveCount() { return G.bossFloor ? 6 : Math.min(9, 5 + Math.floor((G.floor - 1) / 2)); }
// queue a wave: it pours out of the runes in packs, bigger and nastier toward the end of the floor
function startWave() {
  G.wave++; G.gapT = 0; const N = G.waves, i = G.wave - 1, last = G.wave === N, f = G.floor;
  G.inten = G.wave / N;
  if (G.bossFloor && last) { spawnBoss(); return; }
  const maxTier = f <= 2 ? 1 : f <= 4 ? 2 : f <= 7 ? 3 : 4, prog = N > 1 ? i / (N - 1) : 1;
  let budget = (17 + 6.5 * f) * (0.55 + 0.9 * prog) * [0.5, 0.7, 0.85, 1][NP() - 1];
  const pool = Object.values(MON_DEFS).filter(d => d.tier <= (prog < 0.34 && maxTier > 1 ? maxTier - 1 : maxTier)), list = [];
  let guard = 0; while (budget > 0 && guard++ < 400) { const d = pick(pool), c = TIER_COST[d.tier]; if (c > budget + 1.5 && list.length) continue; list.push({ def: d }); budget -= c; }
  const top = Object.values(MON_DEFS).filter(d => d.tier === maxTier);
  const fodder = Object.values(MON_DEFS).filter(d => d.tier <= Math.min(2, maxTier) && d.ai === 'melee'); for (let k = 0; k < Math.round((4 + f * 1.5) * (0.6 + 0.8 * prog) * [0.5, 0.7, 0.85, 1][NP() - 1]); k++) list.push({ def: pick(fodder) });
  if (prog >= 0.5) for (let k = 0; k < 1 + (prog >= 0.8 ? 1 : 0) + Math.floor(f / 6); k++) list.push({ def: pick(top), elite: true });
  if (last) list.push({ def: pick(top.filter(d => d.ai !== 'caster').length ? top.filter(d => d.ai !== 'caster') : top), warlord: true });
  for (let k = list.length - 1; k > 0; k--) { const j = randi(0, k); [list[k], list[j]] = [list[j], list[k]]; }
  if (last) { const w = list.findIndex(o => o.warlord); list.push(list.splice(w, 1)[0]); }
  G.spawnQ = list; G.waveSize = list.length; G.packT = last ? 1.6 : 0.4;
  if (last) { textBanner('FINAL WAVE', G.bossFloor ? '' : 'THE WARLORD OF ' + ARENA.name + ' COMES', 'red'); SFX.braam(); quake(1.2, 0.5); G.ambDark = Math.max(G.ambDark, 0.6); for (const r of ARENA.runes) r.glow = 1.5; }
  else if (G.wave > 1) textBanner('WAVE ' + G.wave + ' OF ' + N, WAVE_CALLS[(G.wave - 2) % WAVE_CALLS.length], prog > 0.6 ? 'red' : 'gold', true);
  else textBanner('WAVE 1 OF ' + N, 'THE RUNES AWAKEN', 'arcane', true);
}
function updateSpawner(dt) {
  if (!G.spawnQ || !G.spawnQ.length) return;
  G.packT -= dt; if (G.packT > 0 || G.mons.length + G.pending >= [32, 40, 46, MON_CAP][NP() - 1]) return;
  const f = G.floor, prog = G.inten || 0, n = Math.min(G.spawnQ.length, randi(4, 7) + Math.floor(f / 2) + Math.round(prog * 4));
  const runes = ARENA.runes.slice().sort((a, b) => minHeroDist(b) - minHeroDist(a)), use = runes.slice(0, chance(0.5) ? 1 : 2);
  for (let k = 0; k < n; k++) {
    const o = G.spawnQ.shift(), r = use[k % use.length]; r.glow = 1.2; let x = r.x + rand(-14, 14), y = r.y + rand(-10, 10);
    if (nearestSolid(x, y, 8)) { x = r.x; y = r.y; }
    summonMon(o.def, x, y, k * 0.12, G.monHp, G.monDmg, o.elite ? 'elite' : o.warlord ? 'warlord' : null);
  }
  G.packT = rand(1.0, 1.8) * (1 - 0.35 * prog);
}
function countTick(n) { SFX.drum(0.9); shake(0.18); kick(0.03); for (const h of G.heroes) if (!h.dead) ring(h.x, h.y, 22, 'gold', 0.4, 3); for (const r of ARENA.runes) r.glow = Math.max(r.glow, 0.5 + (3 - n) * 0.35); }
function minHeroDist(p) { let d = 1e9; for (const h of G.heroes) if (!h.dead) d = Math.min(d, dist(h.x, h.y, p.x, p.y)); return d; }
function spawnBoss() {
  const def = BOSS_DEFS[(Math.floor(G.floor / 4) - 1) % BOSS_DEFS.length], x = ARENA.pw / 2, y = ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.38;
  G.ambDark = 1; SFX.braam(); SFX.quake(2.5); quake(2.4, 0.7);
  circleFx(x, y, 44, def.col || 'arcane', 2.4); cracks(x, y, 10, 70, 140, 4, 'magma');
  emitFx('rise', { x, y, col: def.col || 'arcane' }, 2.0);
  G.pending++;
  after(2.2, () => {
    G.pending--; const b = mkUnit('mon', { ...def, ai: 'boss', scale: 3, r: 5, spd: 34, dmg: 30 }, x, y, G.monHp * 1.6 * (1.3 + 0.15 * Math.floor(G.floor / 4 - 1)) * [0.55, 0.72, 0.87, 1][NP() - 1]); b.boss = true; b.mul = G.monDmg; b.moveT = 1.5; b.mi = 0; b.spawnT = 0.3; G.units.push(b); G.boss = b;
    part({ k: 'glow', x, y, z: 20, life: 0.3, s0: 40, s1: 90, col: 'hot' }); ring(x, y, 140, def.col || 'arcane', 0.7, 8); ring(x, y, 80, 'white', 0.4, 5); flash('white', 0.7); flashLight(x, y, 260, def.col || 'arcane', 2, 0.6);
    smoke(x, y, 16, 'dark', 22, 80, 2.4, 20); debris(x, y, 40, ['#5a5048', '#7d7064', '#3c342e'], 220, 280, 2.4); shake(1); hitstop(0.12); slowmo(0.35, 0.8); SFX.thunder(0, 1.3); buzz([300, 100, 300]);
    textBanner(def.name, def.sub, def.col || 'red');
  });
}
function canUlt(h) { return h.ult >= 100 && !ultBlocked() && (G.mons.length >= 7 || (G.boss && alive(G.boss)) || (G.champ && alive(G.champ) && G.mons.length >= 3)); }
function useUlt(h, fn) { const sp = SPELLBOOK[h.key].find(s => s.name === HERO_PROG[h.key].ult); if (sp) startUlt(h, sp); fn(h); }
function kite(h, foes, dt, pref) {
  const n = nearest(h, foes); if (!n) return; const d = dist(h.x, h.y, n.x, n.y); let tx, ty;
  if (d < pref * 0.65) { const a = angTo(n.x, n.y, h.x, h.y); tx = h.x + Math.cos(a) * 50; ty = h.y + Math.sin(a) * 40; }
  else if (d > pref * 1.35) { tx = n.x; ty = n.y; }
  else { const a = angTo(n.x, n.y, h.x, h.y) + 0.5 * h.strafe; tx = n.x + Math.cos(a) * pref; ty = n.y + Math.sin(a) * pref * 0.8; }
  const W = G.heroes.find(x => x !== h && x.def.role === 'melee' && !x.def.skirm && !x.dead); if (W && dist(tx, ty, W.x, W.y) > 110) { tx = (tx + W.x) / 2; ty = (ty + W.y) / 2; }
  tx = clamp(tx, ARENA.x0 + 16, ARENA.x1 - 16); ty = clamp(ty, ARENA.y0 + 14, ARENA.y1 - 10);
  if ((h.flip = (h.flip || 0) - dt) <= 0) { h.flip = rand(2, 5); h.strafe = -h.strafe; }
  steer(h, tx, ty, h.def.spd, dt, 3); h.face = n.x < h.x ? -1 : 1;
}
function heroState(h, dt) {
  const s = h.state; s.t += dt;
  if (s.k === 'whirl') {
    h.vx = damp(h.vx, 0, 6, dt); h.vy = damp(h.vy, 0, 6, dt); s.tick -= dt; h.face = ((s.t * 12) | 0) % 2 ? 1 : -1; light(h.x, h.y, 60, 'gold', 0.8);
    if (s.pull) for (const u of within(h.x, h.y, (s.R || 30) * 2.2, G.mons)) { u.kx += (h.x - u.x) * 4 * dt * 10; u.ky += (h.y - u.y) * 4 * dt * 10; } if (s.tick <= 0) { s.tick = 0.11; const a = s.t * 22; arcFx(h.x, h.y - 6, a, 2.6, 24 * (s.R || 30) / 30, 'gold', 0.16, 3.5); for (const u of within(h.x, h.y, s.R || 30, G.mons)) { const b = angTo(h.x, h.y, u.x, u.y); hurt(u, h.def.dmg * h.mul * 0.55 * (s.dm || 1), h, { elem: 'phys', kx: Math.cos(b) * 120, ky: Math.sin(b) * 90, stun: 0.2 }); sparks(u.x, u.y, 8, 4, 'gold', 140, 80); } SFX.slash(panOf(h.x)); }
    if (s.t >= s.dur) h.state = null;
  } else if (s.k !== 'leap') { spellState(h, s, dt);
  } else if (s.k === 'leap' && s.pow) {
    const u = Math.min(1, s.t / s.dur); h.z = Math.sin(u * Math.PI) * s.hgt; h.vz = 0;
    if (u >= 1) { h.z = 0; h.state = null; h.squash = 0.45; slamFx(h.x, h.y, s.pow, 'gold'); for (const m of within(h.x, h.y, s.R, G.mons)) { const a = angTo(h.x, h.y, m.x, m.y); hurt(m, h.def.dmg * h.mul * s.dm, h, { elem: 'earth', up: 170, stun: 0.6, kx: Math.cos(a) * 180, ky: Math.sin(a) * 140 }); } }
  } else if (s.k === 'leap') {
    const u = Math.min(1, s.t / s.dur); h.x = lerp(s.x0, s.x1, u); h.y = lerp(s.y0, s.y1, u); h.z = Math.sin(u * Math.PI) * 70; h.vz = 0; h.face = s.x1 < s.x0 ? -1 : 1;
    glows(h.x, h.y, h.z + 6, 1, 'gold', 20, 5, 0.3); if (chance(0.5)) ghost(h, 'gold', 0.3);
    if (u >= 1) { const P = s.P || PWR.slam(); h.z = 0; h.state = null; h.squash = 0.5; slamFx(h.x, h.y, 1.25 * P, 'gold'); flash('white', 0.35); slowmo(0.3, 0.45); if (s.lava) for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; hazard({ k: 'lava', x: h.x + Math.cos(a) * 34 * P, y: h.y + Math.sin(a) * 25 * P, r: 13, life: 4.5, rate: 0.3, dmg: h.def.dmg * h.mul * 0.35, src: h }); } if (s.again > 0) { const n = s.again - 1; after(0.4, () => { if (alive(h) && !h.state) { h.catAgain = n; cataclysm(h); h.catAgain = undefined; } }); } for (const m of within(h.x, h.y, 64 * P, G.mons)) { const a = angTo(h.x, h.y, m.x, m.y); hurt(m, h.def.dmg * h.mul * 3.4 * (s.dm || 1), h, { elem: 'earth', up: 260, stun: 1.2, kx: Math.cos(a) * 260, ky: Math.sin(a) * 200, crit: true }); } hitProps(h.x, h.y, 40); }
  }
}
function monAI(m, dt, heroes) {
  if (m.carried) { m.moving = m.carried === 2; return; } // in the claws of a bat flock
  if (m.chill > 0) m.chill -= dt; if (m.markT > 0) m.markT -= dt;
  if (m.frozen > 0) { if ((m.frozen -= dt) <= 0) { m.frozen = 0; m.brittle = false; } m.vx = damp(m.vx, 0, 10, dt); m.vy = damp(m.vy, 0, 10, dt); m.moving = false; return; } // a block of ice
  if (m.spawnT > 0) { m.spawnT -= dt; return; }
  for (const k in m.cd) m.cd[k] -= dt;
  if (m.burn > 0) { m.burn -= dt; if (chance(dt * 14)) glows(m.x, m.y, rand(4, 14) * m.scale, 1, 'fire', 20, 3, 0.4); if ((m.burnT = (m.burnT || 0) - dt) <= 0) { m.burnT = 0.5; hurt(m, m.burnDmg || 3 * G.floor ** 0.5, m.immo || null, { quiet: true }); } } else m.burnDmg = 0;
  if (m.shock > 0) { m.shock -= dt; if (chance(dt * 10)) { const a = rand(TAU); bolt(m.x, m.y - 8 * m.scale, m.x + Math.cos(a) * 12, m.y - 8 * m.scale + Math.sin(a) * 10, { life: 0.08, w: 0.4, branches: 0 }); } }
  if (m.state) { monState(m, dt); return; }
  if (m.stun > 0) { m.stun -= dt; m.vx = damp(m.vx, 0, 8, dt); m.vy = damp(m.vy, 0, 8, dt); m.moving = false; return; }
  let t = null, bd = 1e9; for (const h of heroes) { const d = dist(m.x, m.y, h.x, h.y) * (h.def.role === 'melee' ? 0.7 : 1); if (d < bd) { bd = d; t = h; } }
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
  if (!b.enraged && b.hp < b.maxHp * 0.5) { b.enraged = true; b.moveT = 0.8; textBanner('ENRAGED', b.def.name, 'red'); flash('red', 0.35); quake(1.4, 0.8); ring(b.x, b.y, 120, 'red', 0.6, 6); flashLight(b.x, b.y, 220, 'red', 2, 0.8); SFX.braam(); SFX.thunder(0, 1); slowmo(0.4, 0.5); }
  if (b.moveT <= 0) { const mv = b.def.moves[b.mi++ % b.def.moves.length]; b.moveT = b.enraged ? rand(2, 2.8) : rand(3, 4); bossMove(b, mv, t); return; }
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
    if (!s.beam || !FX.beams.includes(s.beam)) { s.beam = { col: m.def.col || 'arcane', steady: true, cap: true }; FX.beams.push(s.beam); } Object.assign(s.beam, { x0: ex, y0: ey, x1, y1, w: 4, t: 0, life: 0.15 }); light(x1, y1, 80, m.def.col || 'arcane', 1.5); light(ex, ey, 60, m.def.col || 'arcane', 1.2);
    for (let k = 0; k < 5; k++) light(lerp(ex, x1, k / 5), lerp(ey, y1, k / 5), 40, m.def.col || 'arcane', 0.8);
    sparks(x1, y1, 2, 3, m.def.col === 'fire' ? 'fire' : 'arcane', 160, 120); if (chance(0.5)) scorch(x1, y1, 6, 0.4); shake(0.04);
    s.tick -= dt; if (s.tick <= 0) { s.tick = 0.1; for (const h of G.heroes) { if (h.dead) continue; const px = h.x - ex, py = h.y - ey, dx = x1 - ex, dy = y1 - ey, tt = clamp((px * dx + py * dy) / (dx * dx + dy * dy), 0, 1), dd = Math.hypot(px - dx * tt, py - dy * tt); if (dd < 9) hurt(h, 7 * m.mul, m, { elem: 'fire' }); } }
    if (s.t >= s.dur) m.state = null;
  }
}
function updateDirector(dt) {
  G.phaseT += dt;
  if (G.phase === 'fight') {
    if (!G.heroes.some(h => !h.dead)) { G.phase = 'wipe'; G.phaseT = 0; slowmo(0.3, 2); G.bestLvl = Math.max(G.bestLvl, G.lvl); textBanner(NP() === 1 ? G.heroes[0].def.name + ' HAS FALLEN' : 'THE PARTY HAS FALLEN', 'FLOOR ' + G.floor + '  ·  LEVEL ' + G.lvl + '  ·  ' + G.kills.toLocaleString() + ' SLAIN', 'red'); pushBanner({ a: 'THEY RISE AGAIN', b: 'FLOOR ' + G.floor + ' MUST BE TAKEN', col: 'gold', keep: true, life: 2 }); SFX.braam(); return; }
    updateSpawner(dt);
    if (G.wave === 0) { if (!G.choiceQ.some(q => q.kind === 'draft')) G.waveT -= dt; if (G.waveT < 1.6) for (const r of ARENA.runes) r.glow = Math.max(r.glow, 0.6); if (G.waveT <= 0) { if (G.cdn > 0) { const before = Math.ceil(G.cdn); if (G.cdn === 3) countTick(3); G.cdn -= dt; if (G.cdn > 0 && Math.ceil(G.cdn) !== before) countTick(Math.ceil(G.cdn)); if (G.cdn <= 0) { G.cdn = 0; G.fightT = 1.1; flash('red', 0.25); shake(0.5); SFX.boom(1.2, 0); SFX.braam(); buzz([120]); for (const r of ARENA.runes) { r.glow = 1.6; ring(r.x, r.y, 30, 'arcane', 0.5, 4); } startWave(); } } else startWave(); } }
    else if (!G.spawnQ.length && !G.pending) {
      const nextIsLast = G.wave + 1 === G.waves, left = G.mons.length;
      if (G.wave >= G.waves) { if (!left) { G.phase = 'clear'; G.phaseT = 0; } }
      else if (nextIsLast ? left === 0 : left <= Math.max(3, Math.round(G.waveSize * 0.35))) { G.gapT += dt; if (nextIsLast && G.gapT > 1.2) { G.ambDark = Math.max(G.ambDark, Math.min(0.6, G.gapT * 0.25)); if (chance(dt * 4)) quake(0.3, 0.3); } if (G.gapT > (nextIsLast ? 3.2 : 1.8)) startWave(); }
    }
    if (G.boss && alive(G.boss) && (G.addT = (G.addT || 8) - dt) <= 0) { G.addT = G.boss.enraged ? 7 : 11; if (G.mons.length < 24) { const pool = Object.values(MON_DEFS).filter(d => d.tier <= Math.min(3, 1 + (G.floor >> 2))); for (let k = 0; k < 4 + (G.boss.enraged ? 3 : 0); k++) G.spawnQ.push({ def: pick(pool) }); G.packT = 0; } }
    if (SFX.on && G.wave > 0 && (G.drumT = (G.drumT || 0) - dt) <= 0) { G.drumT = lerp(1.0, 0.4, clamp(G.inten, 0, 1)); SFX.drum(G.inten); }
  } else if (G.phase === 'clear') {
    if (G.phaseT > 0.6 && !G.cleared) { G.cleared = true; textBanner('FLOOR ' + G.floor + ' CLEARED', G.combo > 5 ? 'BEST STREAK ' + G.combo : '', 'gold'); if (!G.bossFloor) queueChoice('floor', 'FLOOR ' + G.floor + ' CLEARED'); }
    if (G.phaseT > 1.6 && !G.revived) { G.revived = true; for (const h of G.heroes) { if (h.dead) { h.dead = false; h.hp = Math.round(h.maxHp * 0.6); column(h.x, h.y, 'gold', 1.4, 16); ring(h.x, h.y, 40, 'gold', 0.5, 4); flashLight(h.x, h.y, 120, 'gold', 1.6, 0.6); textPop(h.x, h.y, 24, h.def.name + ' RISES', 'gold'); } else heal(h, h.maxHp * 0.5); } SFX.heal(); }
    if (G.phaseT > 3.4 && !G.collapse) { G.collapse = true; collapseFloor(); }
    if (G.phaseT > 5.6) G.fade = Math.min(1, (G.phaseT - 5.6) / 0.6);
    if (G.phaseT > 6.3) { G.cleared = G.revived = G.collapse = false; G.floorFalls = 0; G.floor++; G.best = Math.max(G.best, G.floor); saveBest(); startFloor(false); }
  } else if (G.phase === 'wipe') {
    if (G.phaseT > 3.6) G.fade = Math.min(1, (G.phaseT - 3.6) / 0.6);
    if (G.phaseT > 4.4) { const a = xpFor(G.lvl), b = xpFor(G.lvl + 1); G.xp = Math.round(a + (G.xp - a) * 0.5); G.falls = (G.falls || 0) + 1; G.floorFalls = (G.floorFalls || 0) + 1; for (const h of G.heroes) { h.dead = false; h.hp = h.maxHp; h.ult = 0; } startFloor(false); }
  }
}
function collapseFloor() {
  textBanner('THE FLOOR GIVES WAY', '', 'earth'); SFX.quake(3); SFX.braam(); quake(2.6, 1.1); buzz([150, 60, 150, 60, 400]);
  const cx = ARENA.pw / 2, cy = (ARENA.y0 + ARENA.y1) / 2;
  cracks(cx, cy, 12, 160, 220, 3.5);
  for (let i = 0; i < 26; i++) after(i * 0.08, () => { const x = rand(ARENA.x0, ARENA.x1), y = rand(ARENA.y0, ARENA.y1); debris(x, y, 6, ['#5a5048', '#7d7064', '#3c342e'], 80, 140, 2); smoke(x, y, 2, 'dust', 14, 30, 1.6, 10); if (i % 4 === 0) { cracks(x, y, 4, 50, 300, 2.5); SFX.hit(panOf(x)); } });
  for (const h of G.heroes) if (!h.dead) after(1.6, () => { h.vz = 160; });
}
