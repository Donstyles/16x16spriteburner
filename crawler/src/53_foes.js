// ===================== foes: few, readable, each with its own way of fighting =====================
// Foes wait in the rooms, some asleep. They notice a hero they can see (a sleeper only one right beside it, or a blow),
// cry out and wake the others nearby. Every attack winds up with a mark on the floor before it lands; after it they
// recover, and that is the moment to hit back. Brutes cannot be staggered mid-swing; archers keep their distance and
// draw a line where the arrow will fly; skitterers come in packs and lunge.
const FOE_TYPES = {
  grunt: { hp: 46, poise: 26, spd: 34, dmg: 13, r: 5, sight: 115, cd: [0.5, 1.4], gold: [1, 3], cost: 2,
    atk: { k: 'arc', wind: 0.5, act: 0.1, rec: 0.6, reach: 17, arc: 1.8, lunge: 95, push: 90, poise: 22 } },
  brute: { hp: 170, poise: 120, spd: 22, dmg: 30, r: 6, scale: 1.3, armor: 0.2, sight: 100, cd: [1.1, 2], gold: [5, 9], cost: 5,
    atk: { k: 'circle', wind: 0.9, act: 0.1, rec: 1.05, reach: 30, at: 12, push: 230, poise: 70, slam: true, armored: true } },
  archer: { hp: 34, poise: 14, spd: 30, dmg: 11, r: 5, sight: 160, cd: [0.9, 1.7], gold: [2, 4], cost: 2, keep: [62, 125],
    shot: { aim: 0.8, spd: 200, rec: 0.6 } },
  skitter: { hp: 14, poise: 5, spd: 66, dmg: 6, r: 3.5, sight: 95, cd: [0.3, 0.9], gold: [0, 1], cost: 0.6, sleepy: 0.1,
    atk: { k: 'line', wind: 0.28, act: 0.12, rec: 0.55, reach: 13, w: 8, lunge: 200, push: 40, poise: 6 } },
};
const ZONES = [
  { to: 3, name: 'THE CELLARS', grunt: ['GoblinFighter', 'GoblinFanatic', 'TaintedScoundrel'], brute: ['ScarecrowGolem', 'MawingBeaver'], archer: ['GoblinArcher', 'HalflingSlinger'], skitter: ['InfectedMouse', 'TaintedCockroach', 'FamishedTick'] },
  { to: 6, name: 'THE CRYPT', grunt: ['DecrepitBones', 'MutilatedStumbler', 'GraveRevenant'], brute: ['FleshGolem', 'BoundCadaver'], archer: ['BrittleArcher'], skitter: ['SkitteringHand', 'SwoopingBat', 'ForagingMaggot'] },
  { to: 99, name: 'THE DEEP', grunt: ['LizardfolkGladiator', 'SneakySatyr', 'SandGhoul'], brute: ['StoneGolem', 'BestialMinotaur', 'ClayGolem'], archer: ['LizardfolkArcher', 'ElfSharpshooter'], skitter: ['AcidAnt', 'LavaAnt', 'RhinoBeetle'] },
];
const BLOOD_OF = { DecrepitBones: 'bone', BrittleArcher: 'bone', GraveRevenant: 'bone', SkitteringHand: 'bone', ScarecrowGolem: 'straw', StoneGolem: 'metal', ClayGolem: 'metal', TaintedCockroach: 'bug', AcidAnt: 'bug', LavaAnt: 'bug', RhinoBeetle: 'bug', FamishedTick: 'bug', ForagingMaggot: 'slime' };
const STONE_SHOT = { HalflingSlinger: true };
const zoneAt = f => ZONES.find(z => f <= z.to) || ZONES[ZONES.length - 1];
function floorName(f) { const z = zoneAt(f), first = ZONES.indexOf(z) ? ZONES[ZONES.indexOf(z) - 1].to + 1 : 1; return z.name + ' · ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][Math.min(5, f - first)]; }
function mkFoe(type, f, x, y) {
  const T = FOE_TYPES[type], z = zoneAt(f), spr = pick(z[type]), mul = 1 + 0.18 * (f - 1);
  const u = mkActor('foe', { ...T, spr, blood: BLOOD_OF[spr] || 'red', name: type }, x, y, mul);
  Object.assign(u, { type, dmgMul: 1 + 0.12 * (f - 1), aware: false, state: 'idle', home: { x, y }, cdT: rand(0.4, 1), tgt: null, wanderT: rand(1, 4), face: chance(0.5) ? 1 : -1 });
  u.dir = u.face < 0 ? Math.PI : 0; return u;
}
// a room's foes: groups bought from a budget that grows with depth and the size of the room
const GROUPS = [['grunt', 'grunt'], ['grunt', 'grunt', 'grunt'], ['grunt', 'archer'], ['archer', 'archer', 'grunt'], ['skitter', 'skitter', 'skitter', 'skitter'], ['brute'], ['brute', 'grunt'], ['grunt', 'grunt', 'archer'], ['skitter', 'skitter', 'skitter', 'grunt']];
function populateRoom(A, r, f) {
  const area = r.w * r.h; let budget = (3.5 + f * 1.4) * clamp(area / 150, 0.6, 1.4) * (r.kind === 'end' ? 1.6 : 1);
  const out = [], spots = [];
  const ok = (x, y) => !solidAt(x, y) && !A.props.some(p => !p.dead && dist(p.x, p.cy, x, y) < p.r + 8) && !r.doors.some(d => d.cells.some(([cx, cy]) => dist(cx * TS + 8, cy * TS + 8, x, y) < 40)) && !spots.some(s => dist(s.x, s.y, x, y) < 12);
  let guard = 0; while (budget > 1.5 && guard++ < 30) {
    const g = pick(GROUPS.filter(g => g.reduce((a, t) => a + FOE_TYPES[t].cost, 0) <= budget + 1 && (f > 1 || !g.includes('brute') || chance(0.3))));
    if (!g) break; budget -= g.reduce((a, t) => a + FOE_TYPES[t].cost, 0);
    const ax = rand(r.ix0 + 2, r.ix1 - 1) * TS, ay = rand(r.iy0 + 1.5, r.iy1) * TS, sleepy = chance(0.45);
    for (const t of g) { let x, y, n = 0; do { x = ax + rand(-24, 24); y = ay + rand(-16, 16); } while (!ok(x, y) && n++ < 20); if (n > 20) continue; spots.push({ x, y }); const u = mkFoe(t, f, x, y); if (sleepy && chance(1 - (FOE_TYPES[t].sleepy || 0))) u.state = 'sleep'; u.room = r.i; out.push(u); }
  }
  return out;
}
// ---------- senses ----------
function wakeFoe(f, h, why) {
  if (f.aware || f.dead) return; f.aware = true; f.state = 'hunt'; f.tgt = h; f.cdT = Math.max(f.cdT, rand(0.35, 0.7));
  if (h) faceTo(f, angTo(f.x, f.y, h.x, h.y));
  textPop(f.x, f.y, 22 * f.scale, '!', 'red', true); if (why !== 'alarm') f.vz = 60;
  for (const o of G.foes) if (o !== f && !o.aware && !o.dead && dist(o.x, o.y, f.x, f.y) < 110 && lineOfSight(o.x, o.y - 4, f.x, f.y - 4)) { const oo = o; oo.alarmT = rand(0.25, 0.7); oo.alarmBy = h; }
}
function alertFoe(f, src) { if (!f.aware) wakeFoe(f, src && src.team === 'hero' ? src : nearest(f, G.heroes), 'hit'); else if (src && src.team === 'hero' && chance(0.5)) f.tgt = src; }
// a loud blow wakes sleepers close by
function noise(x, y, r) { for (const f of G.foes) if (!f.aware && !f.dead && dist(f.x, f.y, x, y) < r && lineOfSight(f.x, f.y - 4, x, y - 4)) wakeFoe(f, nearest(f, G.heroes), 'noise'); }
function senses(f, dt) {
  if (f.alarmT > 0 && (f.alarmT -= dt) <= 0) { wakeFoe(f, f.alarmBy || nearest(f, G.heroes), 'alarm'); return; }
  for (const h of G.heroes) {
    if (h.dead) continue; const d = dist(f.x, f.y, h.x, h.y), R = f.state === 'sleep' ? 30 : f.def.sight * (h.blocking ? 1 : 1);
    if (d < R && lineOfSight(f.x, f.y - 4, h.x, h.y - 4)) { wakeFoe(f, h, 'sight'); return; }
  }
}
// ---------- the mind of a foe ----------
function foeTick(f, dt) {
  if (f.dead) return; if (f.poiseT > 0) f.poiseT -= dt; else f.poise = f.maxPoise;
  if (f.stun > 0) { f.stun -= dt; f.vx = damp(f.vx, 0, 8, dt); f.vy = damp(f.vy, 0, 8, dt); f.moving = false; return; }
  if (!f.aware) { senses(f, dt); if (f.aware) return; idleFoe(f, dt); return; }
  if (f.cdT > 0) f.cdT -= dt;
  if (!f.tgt || f.tgt.dead || (chance(dt * 0.5))) { const n = nearest(f, G.heroes); if (n) f.tgt = n; }
  const t = f.tgt; if (!t) { f.vx = damp(f.vx, 0, 6, dt); f.vy = damp(f.vy, 0, 6, dt); f.moving = false; return; }
  if (f.act) { foeAct(f, t, dt); return; }
  const d = dist(f.x, f.y, t.x, t.y), sees = lineOfSight(f.x, f.y - 4, t.x, t.y - 4), T = f.def, spd = T.spd;
  if (T.shot) { // keep a distance, aim, loose
    if (!sees || d > T.keep[1]) pathTo(f, t.x, t.y, spd, dt, 6);
    else if (d < T.keep[0]) { const a = angTo(t.x, t.y, f.x, f.y), [bx, by] = clipToWalls(f.x, f.y, f.x + Math.cos(a) * 40, f.y + Math.sin(a) * 32, f.r); if (dist(bx, by, f.x, f.y) > 6) steer(f, bx, by, spd * 1.1, dt); else strafe(f, t, spd, dt); }
    else if (f.cdT <= 0) { f.act = { k: 'aim', t: 0, dur: T.shot.aim, dir: angTo(f.x, f.y, t.x, t.y) }; f.vx = f.vy = 0; f.moving = false; }
    else strafe(f, t, spd * 0.6, dt);
    faceTo(f, angTo(f.x, f.y, t.x, t.y)); return;
  }
  const A = T.atk, reach = A.reach + (A.at || 0) + t.r;
  if (d > reach * 0.9 || !sees) { pathTo(f, t.x, t.y, spd, dt, reach * 0.6); faceTo(f, angTo(f.x, f.y, t.x, t.y)); }
  else if (f.cdT <= 0) { f.act = { k: 'atk', mv: A, t: 0, phase: 'wind', dir: angTo(f.x, f.y, t.x, t.y), hit: new Set() }; f.vx = f.vy = 0; f.moving = false; if (A.wind >= 0.8) SFX.charge && SFX.charge(); }
  else { strafe(f, t, spd * 0.5, dt); faceTo(f, angTo(f.x, f.y, t.x, t.y)); }
}
// circling a little while waiting for the next swing, so a crowd does not stand in one heap
function strafe(f, t, spd, dt) { const a = angTo(t.x, t.y, f.x, f.y) + (f.id % 2 ? 0.9 : -0.9) * dt * 2, d = dist(f.x, f.y, t.x, t.y); steer(f, t.x + Math.cos(a) * d, t.y + Math.sin(a) * d * 0.85, spd, dt); }
function idleFoe(f, dt) {
  if (f.state === 'sleep') { f.vx = f.vy = 0; f.moving = false; if (chance(dt * 0.6)) textPop(f.x + 4, f.y, 18 * f.scale, 'z', 'white', false); return; }
  if ((f.wanderT -= dt) <= 0) { f.wanderT = rand(2, 5); const a = rand(TAU); f.wx = f.home.x + Math.cos(a) * rand(0, 22); f.wy = f.home.y + Math.sin(a) * rand(0, 14); }
  if (f.wx !== undefined && dist(f.x, f.y, f.wx, f.wy) > 3 && !solidAt(f.wx, f.wy)) { steer(f, f.wx, f.wy, f.def.spd * 0.35, dt, 2); faceTo(f, angTo(f.x, f.y, f.wx, f.wy)); } else { f.vx = damp(f.vx, 0, 8, dt); f.vy = damp(f.vy, 0, 8, dt); f.moving = false; }
}
function foeAct(f, t, dt) {
  const a = f.act; a.t += dt;
  if (a.k === 'aim') {
    f.vx = damp(f.vx, 0, 12, dt); f.vy = damp(f.vy, 0, 12, dt); f.moving = false;
    if (a.t < a.dur - 0.18) { const want = angTo(f.x, f.y, t.x, t.y); a.dir += clamp(angDiff(a.dir, want), -3 * dt, 3 * dt); faceTo(f, a.dir); }
    if (a.t >= a.dur && !a.shot) { a.shot = true; shoot(f, a.dir); }
    if (a.t >= a.dur + f.def.shot.rec) { f.act = null; f.cdT = rand(...f.def.cd); }
    return;
  }
  const mv = a.mv, w = mv.wind, s = w + mv.act, e = s + mv.rec;
  if (a.phase === 'wind') {
    f.vx = damp(f.vx, 0, 14, dt); f.vy = damp(f.vy, 0, 14, dt); f.moving = false;
    if (a.t < w * 0.55) { const want = angTo(f.x, f.y, t.x, t.y); a.dir += clamp(angDiff(a.dir, want), -4 * dt, 4 * dt); faceTo(f, a.dir); }
    if (a.t >= w) { a.phase = 'act'; foeStrike(f, a); }
  }
  if (a.phase === 'act') { const u = 1 - (a.t - w) / mv.act; f.vx = Math.cos(a.dir) * mv.lunge * u; f.vy = Math.sin(a.dir) * mv.lunge * u * 0.85; foeHits(f, a); if (a.t >= s) a.phase = 'rec'; }
  if (a.phase === 'rec') { f.vx = damp(f.vx, 0, 12, dt); f.vy = damp(f.vy, 0, 12, dt); f.moving = false; if (a.t >= e) { f.act = null; f.cdT = rand(...f.def.cd); } }
}
function foeStrike(f, a) {
  const mv = a.mv; SFX.slash(panOf(f.x));
  if (mv.k === 'arc') arcFx(f.x, f.y - 5 * f.scale, a.dir, mv.arc, mv.reach, 'red', 0.15, 3);
  else if (mv.slam) { const cx = f.x + Math.cos(a.dir) * mv.at, cy = f.y + Math.sin(a.dir) * mv.at * 0.85; ring(cx, cy, mv.reach * 1.2, 'white', 0.35, 4); debris(cx, cy, 16, ['#5a5048', '#7d7064'], 130, 170, 1.8); smoke(cx, cy, 6, 'dust', 10, 40, 1); cracks(cx, cy, 3, 16, 200, 1); shake(0.4); SFX.boom(0.8, panOf(cx)); }
}
function foeHits(f, a) {
  const mv = a.mv, ox = mv.at ? Math.cos(a.dir) * mv.at : 0, oy = mv.at ? Math.sin(a.dir) * mv.at * 0.85 : 0, src = { x: f.x + ox, y: f.y + oy };
  for (const h of G.heroes) {
    if (h.dead || a.hit.has(h) || !hitsShape(src, h, mv, a.dir) || !lineOfSight(f.x, f.y - 4, h.x, h.y - 4)) continue; a.hit.add(h);
    const ka = angTo(src.x, src.y, h.x, h.y); hurt(h, f.def.dmg * f.dmgMul, f, { poise: mv.poise, kx: Math.cos(ka) * mv.push, ky: Math.sin(ka) * mv.push * 0.8, unblockable: mv.unblockable });
  }
}
// ---------- arrows and stones ----------
function shoot(f, dir) {
  const S = f.def.shot, stone = STONE_SHOT[f.spr]; SFX.whoosh(panOf(f.x));
  G.proj.push({ k: stone ? 'stone' : 'arrow', x: f.x + Math.cos(dir) * 6, y: f.y - 2 + Math.sin(dir) * 4, z: 7, vx: Math.cos(dir) * S.spd, vy: Math.sin(dir) * S.spd * 0.85, team: 'foe', dmg: f.def.dmg * f.dmgMul, src: f, life: 1.6, r: 2 });
}
function updateProj(dt) {
  for (const p of G.proj) {
    p.life -= dt; const ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt;
    if (solidAt(p.x, p.y) || p.life <= 0) { p.dead = true; sparks(ox, oy, p.z, 3, 'white', 60, 40); continue; }
    const foes = p.team === 'foe' ? G.heroes : G.foes;
    for (const u of foes) {
      if (u.dead || dist(u.x, u.y, p.x, p.y) > u.r + p.r + 2) continue;
      if (u.iframe > 0) continue;
      if (u.team === 'hero' && u.blocking && u.blockT < PARRY_WINDOW && Math.abs(angDiff(u.dir, Math.atan2(-p.vy, -p.vx))) < 1.25) { // a parried arrow flies back where it came from
        const s = p.src && !p.src.dead ? angTo(p.x, p.y, p.src.x, p.src.y) : Math.atan2(-p.vy, -p.vx), v = Math.hypot(p.vx, p.vy) * 1.2; p.vx = Math.cos(s) * v; p.vy = Math.sin(s) * v * 0.85; p.team = 'hero'; p.dmg *= 2.5; p.life = 1.2; p.src = u;
        sparks(p.x, p.y, 7, 12, 'gold', 160, 80); SFX.clang(panOf(p.x)); textPop(u.x, u.y, 24, 'DEFLECTED', 'gold', false); hitstop(0.08); break;
      }
      const from = { x: p.x - p.vx * 0.2, y: p.y - p.vy * 0.2, team: p.team, def: {} };
      hurt(u, p.dmg, u.team === 'hero' ? from : p.src, { ranged: true, poise: 12, kx: p.vx * 0.3, ky: p.vy * 0.3 }); p.dead = true; break;
    }
  }
  removeIf(G.proj, p => p.dead);
}
// ---------- what a foe leaves ----------
function dropLoot(u) { const g = u.def.gold || [0, 1]; const n = randi(g[0], g[1]); if (n > 0) dropGold(u.x, u.y, n); }
function dropGold(x, y, n) { for (let i = 0; i < Math.min(n, 6); i++) G.drops.push({ k: 'gold', v: Math.ceil(n / Math.min(n, 6)), x, y, z: 4, vx: rand(-40, 40), vy: rand(-30, 30), vz: rand(60, 120), t: 0 }); }
function updateDrops(dt) {
  for (const d of G.drops) {
    d.t += dt; d.vz -= 400 * dt; d.z += d.vz * dt; if (d.z < 0) { d.z = 0; d.vz = -d.vz * 0.35; d.vx *= 0.6; d.vy *= 0.6; }
    const f = Math.exp(-3 * dt); d.vx *= f; d.vy *= f; const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt; if (!solidAt(nx, ny)) { d.x = nx; d.y = ny; }
    if (d.t < 0.4) continue; const h = nearest(d, G.heroes.filter(alive), 26); if (!h) continue;
    const dd = dist(d.x, d.y, h.x, h.y); if (dd < 6) { d.dead = true; G.gold += d.v; SFX.pop(panOf(d.x)); part({ k: 'glow', x: d.x, y: d.y, z: 6, vz: 30, life: 0.3, s0: 2, s1: 0, col: 'gold' }); }
    else { d.x += (h.x - d.x) / dd * 140 * dt; d.y += (h.y - d.y) / dd * 140 * dt; }
  }
  removeIf(G.drops, d => d.dead);
}
