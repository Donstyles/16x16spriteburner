// ===================== foes: four ways of fighting, and they fight together =====================
// RUSHERS (grunts, skitterers) run straight in and swarm. TANKS (brutes) throw the hero back with a wide shove, every third
// blow a slam; while archers are with them they stand between the hero and the archers and let them do the work. ARCHERS
// keep their distance; with a tank near they spread out in a loose line behind it and loose only along a clear line.
// FLANKERS circle wide round the hero to his back, dart in, stab and get out; if he turns to face them they peel off.
// Senses: a sleeper only hears (a creeping hero wakes it only by bumping into it, a walking one at 32 px, a rolling or
// fighting one at 64). An awake foe sees ahead of it at its full sight range, behind it a third as far, and hears all round
// (walking 48 px, fighting 96). A woken foe cries out and wakes the others in its room who can see it. A foe that loses
// the hero searches where it last saw him; out of sight and far off for long enough, it gives up and goes home.
const FOE_TYPES = {
  grunt: { role: 'rush', hp: 46, poise: 55, spd: 44, dmg: 13, r: 5, sight: 115, cd: [0.45, 1.2], gold: [1, 3], cost: 2,
    atk: { k: 'arc', wind: 0.5, act: 0.1, rec: 0.6, reach: 17, arc: 1.8, lunge: 95, push: 90, poise: 22 } },
  skitter: { role: 'rush', hp: 14, poise: 12, spd: 70, dmg: 6, r: 3.5, sight: 95, cd: [0.3, 0.8], gold: [0, 1], cost: 0.6, sleepy: 0.1,
    atk: { k: 'line', wind: 0.28, act: 0.12, rec: 0.55, reach: 13, w: 8, lunge: 200, push: 40, poise: 6 } },
  brute: { role: 'tank', hp: 170, poise: 200, spd: 26, dmg: 30, r: 6, scale: 1.3, armor: 0.2, sight: 100, cd: [0.9, 1.6], gold: [5, 9], cost: 5,
    atk: { k: 'arc', wind: 0.5, act: 0.12, rec: 0.6, reach: 21, arc: 2.5, lunge: 70, push: 420, poise: 45, dm: 0.4, armored: true, shove: true },
    slam: { k: 'circle', wind: 0.9, act: 0.1, rec: 1.05, reach: 30, at: 12, push: 230, poise: 70, slam: true, armored: true } },
  archer: { role: 'archer', hp: 34, poise: 30, spd: 32, dmg: 11, r: 5, sight: 165, cd: [1.0, 1.8], gold: [2, 4], cost: 2, keep: [62, 130],
    shot: { aim: 0.8, spd: 200, rec: 0.6 } },
  flanker: { role: 'flank', hp: 30, poise: 22, spd: 62, dmg: 16, r: 4.5, sight: 130, cd: [0.5, 1], gold: [2, 4], cost: 2.5,
    atk: { k: 'line', wind: 0.3, act: 0.1, rec: 0.35, reach: 14, w: 8, lunge: 180, push: 60, poise: 20 } },
};
const ZONES = [
  { to: 3, name: 'THE CELLARS', grunt: ['GoblinFighter', 'GoblinFanatic', 'TaintedScoundrel'], brute: ['ScarecrowGolem', 'MawingBeaver'], archer: ['GoblinArcher', 'HalflingSlinger'], skitter: ['InfectedMouse', 'TaintedCockroach', 'FamishedTick'], flanker: ['HalflingRogue', 'GrinningGremlin'] },
  { to: 6, name: 'THE CRYPT', grunt: ['DecrepitBones', 'MutilatedStumbler', 'GraveRevenant'], brute: ['FleshGolem', 'BoundCadaver'], archer: ['BrittleArcher'], skitter: ['SkitteringHand', 'SwoopingBat', 'ForagingMaggot'], flanker: ['SkeweringStalker', 'UnravelingCrawler'] },
  { to: 99, name: 'THE DEEP', grunt: ['LizardfolkGladiator', 'SandGhoul', 'BestialLizardfolk'], brute: ['StoneGolem', 'BestialMinotaur', 'ClayGolem'], archer: ['LizardfolkArcher', 'ElfSharpshooter'], skitter: ['AcidAnt', 'LavaAnt', 'RhinoBeetle'], flanker: ['SneakySatyr', 'LizardfolkScout', 'ToxicHound'] },
];
const BLOOD_OF = { DecrepitBones: 'bone', BrittleArcher: 'bone', GraveRevenant: 'bone', SkitteringHand: 'bone', ScarecrowGolem: 'straw', StoneGolem: 'metal', ClayGolem: 'metal', TaintedCockroach: 'bug', AcidAnt: 'bug', LavaAnt: 'bug', RhinoBeetle: 'bug', FamishedTick: 'bug', ForagingMaggot: 'slime', UnravelingCrawler: 'bone' };
const STONE_SHOT = { HalflingSlinger: true };
const zoneAt = f => ZONES.find(z => f <= z.to) || ZONES[ZONES.length - 1];
function floorName(f) { const z = zoneAt(f), first = ZONES.indexOf(z) ? ZONES[ZONES.indexOf(z) - 1].to + 1 : 1; return z.name + ' · ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][Math.min(5, f - first)]; }
function mkFoe(type, f, x, y) {
  const T = FOE_TYPES[type], z = zoneAt(f), spr = pick(z[type]), mul = 1 + 0.18 * (f - 1);
  const u = mkActor('foe', { ...T, spr, blood: BLOOD_OF[spr] || 'red', name: type }, x, y, mul);
  Object.assign(u, { type, dmgMul: 1 + 0.12 * (f - 1), aware: false, state: 'idle', home: { x, y }, cdT: rand(0.4, 1), tgt: null, wanderT: rand(1, 4), face: chance(0.5) ? 1 : -1, jit: rand(-1, 1), jit2: rand(-1, 1), lostT: 0 });
  u.dir = u.face < 0 ? Math.PI : 0; return u;
}
// a room's foes: groups bought from a budget that grows with depth and the size of the room
const GROUPS = [
  { g: ['grunt', 'grunt'] }, { g: ['grunt', 'grunt', 'grunt'] }, { g: ['skitter', 'skitter', 'skitter', 'skitter'] }, { g: ['skitter', 'skitter', 'skitter', 'grunt'] },
  { g: ['grunt', 'archer'] }, { g: ['grunt', 'grunt', 'archer'] }, { g: ['brute'] }, { g: ['brute', 'archer', 'archer'] }, { g: ['brute', 'archer', 'grunt'] },
  { g: ['flanker', 'grunt', 'grunt'] }, { g: ['flanker', 'skitter', 'skitter', 'skitter'] },
  { g: ['flanker', 'flanker', 'grunt', 'grunt'], min: 3 }, { g: ['brute', 'archer', 'archer', 'flanker'], min: 3 }, { g: ['brute', 'brute', 'archer', 'archer', 'archer'], min: 4 },
];
function populateRoom(A, r, f) {
  const area = r.w * r.h; let budget = (3.5 + f * 1.4) * clamp(area / 150, 0.6, 1.4) * (r.kind === 'end' ? 1.6 : 1);
  const out = [], spots = [], cost = g => g.reduce((a, t) => a + FOE_TYPES[t].cost, 0);
  const ok = (x, y) => !solidAt(x, y) && !A.props.some(p => !p.dead && dist(p.x, p.cy, x, y) < p.r + 8) && !r.doors.some(d => d.cells.some(([cx, cy]) => dist(cx * TS + 8, cy * TS + 8, x, y) < 40)) && !spots.some(s => dist(s.x, s.y, x, y) < 12);
  let guard = 0; while (budget > 1.5 && guard++ < 30) {
    const G0 = pick(GROUPS.filter(G1 => (G1.min || 1) <= f && cost(G1.g) <= budget + 1 && (f > 1 || !G1.g.includes('brute') || chance(0.3))));
    if (!G0) break; const g = G0.g; budget -= cost(g);
    const ax = rand(r.ix0 + 2, r.ix1 - 1) * TS, ay = rand(r.iy0 + 1.5, r.iy1) * TS, sleepy = chance(0.45);
    for (const t of g) { let x, y, n = 0; do { x = ax + rand(-24, 24); y = ay + rand(-16, 16); } while (!ok(x, y) && n++ < 20); if (n > 20) continue; spots.push({ x, y }); const u = mkFoe(t, f, x, y); if (sleepy && chance(1 - (FOE_TYPES[t].sleepy || 0))) u.state = 'sleep'; u.room = r.i; out.push(u); }
  }
  return out;
}
// ---------- senses ----------
function wakeFoe(f, h, why) {
  if (f.aware || f.dead) return; f.aware = true; f.state = 'hunt'; f.tgt = h; f.cdT = Math.max(f.cdT, rand(0.35, 0.7)); f.lostT = 0; f.fl = null;
  if (h) { faceTo(f, angTo(f.x, f.y, h.x, h.y)); f.lastX = h.x; f.lastY = h.y; }
  markPop(f, '!', 'red'); if (why !== 'alarm') f.vz = 60;
  for (const o of G.foes) { if (o === f || o.aware || o.dead) continue; const d = dist(o.x, o.y, f.x, f.y); if ((o.room === f.room ? d < 130 : d < 60) && lineOfSight(o.x, o.y - 4, f.x, f.y - 4)) { o.alarmT = rand(0.25, 0.7); o.alarmBy = h; } }
}
function alertFoe(f, src) { if (!f.aware) wakeFoe(f, src && src.team === 'hero' ? src : nearest(f, G.heroes), 'hit'); else if (src && src.team === 'hero') { if (chance(0.5)) f.tgt = src; f.lostT = 0; f.lastX = src.x; f.lastY = src.y; } }
// a loud blow wakes sleepers close by
function noise(x, y, r) { for (const f of G.foes) if (!f.aware && !f.dead && dist(f.x, f.y, x, y) < r && lineOfSight(f.x, f.y - 4, x, y - 4)) wakeFoe(f, nearest(f, G.heroes), 'noise'); }
function senses(f, dt) {
  if (f.alarmT > 0 && (f.alarmT -= dt) <= 0) { wakeFoe(f, f.alarmBy || nearest(f, G.heroes), 'alarm'); return; }
  for (const h of G.heroes) {
    if (h.dead) continue; const d = dist(f.x, f.y, h.x, h.y), loud = h.noise || 0; let R;
    if (f.state === 'sleep') R = [f.r + h.r + 3, 32, 64][loud]; // a sleeper only hears
    else { const ahead = Math.abs(angDiff(f.dir, angTo(f.x, f.y, h.x, h.y))) < 1.1; R = Math.max(f.def.sight * (ahead ? 1 : 0.33), [16, 48, 96][loud]); } // eyes ahead, ears all round
    if (d < R && lineOfSight(f.x, f.y - 4, h.x, h.y - 4)) { wakeFoe(f, h, 'sight'); return; }
  }
}
// ---------- the mind of a foe ----------
// who is fighting whom this frame (tanks look after the archers that shoot at the same hero)
const AI = { archers: [], tanks: [] };
function aiPrep() { AI.archers = G.foes.filter(o => o.aware && !o.dead && o.def.role === 'archer'); AI.tanks = G.foes.filter(o => o.aware && !o.dead && o.def.role === 'tank'); }
function foeTick(f, dt) {
  if (f.dead) return; if (f.poiseT > 0) f.poiseT -= dt; else f.poise = f.maxPoise; if (f.poiseGuard > 0) f.poiseGuard -= dt;
  if (f.stun > 0) { f.stun -= dt; f.vx = damp(f.vx, 0, 8, dt); f.vy = damp(f.vy, 0, 8, dt); f.moving = false; return; }
  if (!f.aware) { senses(f, dt); if (f.aware) return; idleFoe(f, dt); return; }
  if (f.cdT > 0) f.cdT -= dt;
  if (!f.tgt || f.tgt.dead || (chance(dt * 0.5))) { const n = nearest(f, G.heroes.filter(alive)); if (n) f.tgt = n; }
  const t = f.tgt; if (!t || t.dead) { f.vx = damp(f.vx, 0, 6, dt); f.vy = damp(f.vy, 0, 6, dt); f.moving = false; return; }
  if (f.act) { foeAct(f, t, dt); return; }
  const d = dist(f.x, f.y, t.x, t.y), sees = lineOfSight(f.x, f.y - 4, t.x, t.y - 4);
  if (sees) { f.lastX = t.x; f.lastY = t.y; f.lostT = 0; } else f.lostT += dt;
  if (f.lostT > 7 && d > 140) { f.aware = false; f.state = 'idle'; f.tgt = null; f.fl = null; markPop(f, '?', 'white'); return; } // lost him: back home
  const role = f.def.role;
  if (role === 'archer') archerMind(f, t, dt, d, sees); else if (role === 'tank') tankMind(f, t, dt, d, sees); else if (role === 'flank') flankMind(f, t, dt, d, sees); else rushMind(f, t, dt, d, sees);
}
// after the hero: straight at him while he is seen (or close enough to be heard), else to where he was last seen
function chase(f, t, spd, dt, stopAt) { if (f.lostT < 0.6 || dist(f.x, f.y, t.x, t.y) < 90) return pathTo(f, t.x, t.y, spd, dt, stopAt); return pathTo(f, f.lastX, f.lastY, spd * 0.8, dt, 4); }
function startFoeAtk(f, mv, t) { f.act = { k: 'atk', mv, t: 0, phase: 'wind', dir: angTo(f.x, f.y, t.x, t.y), hit: new Set() }; f.vx = f.vy = 0; f.moving = false; if (mv.wind >= 0.8) SFX.charge && SFX.charge(); }
function holdStill(f, dt) { f.vx = damp(f.vx, 0, 10, dt); f.vy = damp(f.vy, 0, 10, dt); f.moving = false; }
function rushMind(f, t, dt, d, sees) {
  const A = f.def.atk, reach = A.reach + (A.at || 0) + t.r;
  if (d > reach * 0.9 || !sees) { chase(f, t, f.def.spd, dt, reach * 0.6); faceTo(f, angTo(f.x, f.y, t.x, t.y)); }
  else if (f.cdT <= 0) startFoeAtk(f, A, t);
  else { strafe(f, t, f.def.spd * 0.5, dt); faceTo(f, angTo(f.x, f.y, t.x, t.y)); }
}
// a tank shoves, and every third blow slams; with archers about it holds the line between the hero and them
function tankMind(f, t, dt, d, sees) {
  const T = f.def, mv = (f.blows || 0) % 3 === 2 ? T.slam : T.atk, reach = mv.reach + (mv.at || 0) + t.r;
  faceTo(f, angTo(f.x, f.y, t.x, t.y));
  if (sees && d < reach * 0.9 && f.cdT <= 0) { f.blows = (f.blows || 0) + 1; startFoeAtk(f, mv, t); return; }
  const wards = AI.archers.filter(a => a.tgt === t && dist(a.x, a.y, f.x, f.y) < 180);
  if (wards.length) {
    let cx = 0, cy = 0; for (const a of wards) { cx += a.x; cy += a.y; } cx /= wards.length; cy /= wards.length;
    const ad = Math.max(1, dist(t.x, t.y, cx, cy)), ux = (cx - t.x) / ad, uy = (cy - t.y) / ad, g = clamp(ad * 0.45, 24, 52);
    const mates = AI.tanks.filter(o => o.tgt === t && dist(o.x, o.y, f.x, f.y) < 180).sort((a, b) => a.id - b.id), off = (mates.indexOf(f) - (mates.length - 1) / 2) * 20;
    let gx = t.x + ux * g - uy * off, gy = t.y + uy * g + ux * off; if (solidAt(gx, gy)) [gx, gy] = clipToWalls(t.x, t.y, gx, gy, f.r);
    if (dist(f.x, f.y, gx, gy) > 4) pathTo(f, gx, gy, T.spd * 1.2, dt, 2); else holdStill(f, dt);
    return;
  }
  if (d > reach * 0.9 || !sees) chase(f, t, T.spd, dt, reach * 0.6); else strafe(f, t, T.spd * 0.5, dt);
}
// an archer: in a loose line behind its tank if it has one, else at a distance; it looses only along a clear line
function archerMind(f, t, dt, d, sees) {
  const T = f.def, spd = T.spd, myTanks = AI.tanks.filter(o => o.tgt === t), tank = nearest(f, myTanks, 180);
  let gx = null, gy = null;
  if (tank) {
    const mates = AI.archers.filter(o => o.tgt === t && nearest(o, myTanks, 180) === tank).sort((a, b) => a.id - b.id), n = mates.length, i = Math.max(0, mates.indexOf(f));
    const a0 = angTo(t.x, t.y, tank.x, tank.y), ux = Math.cos(a0), uy = Math.sin(a0);
    const back = 38 + f.jit * 7, lat = (i - (n - 1) / 2) * 22 + f.jit2 * 7 + Math.sin(G.time * 0.6 + f.id) * 4 + (f.shift || 0); // never quite a straight line
    gx = tank.x + ux * back - uy * lat; gy = tank.y + uy * back + ux * lat; if (solidAt(gx, gy)) [gx, gy] = clipToWalls(tank.x, tank.y, gx, gy, f.r);
  }
  faceTo(f, angTo(f.x, f.y, t.x, t.y));
  if (d < T.keep[0]) { const a = angTo(t.x, t.y, f.x, f.y), [bx, by] = clipToWalls(f.x, f.y, f.x + Math.cos(a) * 40, f.y + Math.sin(a) * 32, f.r); if (dist(bx, by, f.x, f.y) > 6) steer(f, bx, by, spd * 1.1, dt); else strafe(f, t, spd, dt); return; }
  if (gx !== null && dist(f.x, f.y, gx, gy) > 8) { pathTo(f, gx, gy, spd, dt, 2); return; }
  if (gx === null && (!sees || d > T.keep[1])) { chase(f, t, spd, dt, 6); return; }
  if (f.cdT <= 0 && sees && d < T.keep[1] + 40) {
    if (clearShot(f, t)) { f.act = { k: 'aim', t: 0, dur: T.shot.aim, dir: angTo(f.x, f.y, t.x, t.y) }; holdStill(f, dt); return; }
    f.shift = clamp((f.shift || 0) + (f.id % 2 ? 16 : -16), -44, 44); if (Math.abs(f.shift) >= 44) f.shift = 0; f.cdT = 0.35; // blocked: step aside and try again
  }
  if (gx === null) strafe(f, t, spd * 0.6, dt); else holdStill(f, dt);
}
// a flanker circles wide to the hero's back, darts in, stabs and gets out; if he turns to face it on the way in, it peels off
function flankMind(f, t, dt, d, sees) {
  const T = f.def, A = T.atk, reach = A.reach + t.r, R = 58, F = f.fl || (f.fl = { mode: 'circle', t: 0 }); F.t += dt;
  const th = angTo(t.x, t.y, f.x, f.y), off = angDiff(t.dir + Math.PI, th), facing = Math.abs(angDiff(t.dir, th)) < 0.9;
  faceTo(f, angTo(f.x, f.y, t.x, t.y));
  if (!sees && f.lostT > 0.6) { chase(f, t, T.spd, dt, 6); return; }
  if (F.mode === 'out') { if (F.t > 0.7 || d > R) { F.mode = 'circle'; F.t = 0; } else { const [gx, gy] = clipToWalls(t.x, t.y, t.x + Math.cos(th) * R, t.y + Math.sin(th) * R * 0.85, f.r); pathTo(f, gx, gy, T.spd, dt, 2); return; } }
  if (F.mode === 'circle') {
    if (Math.abs(off) < 0.6 || F.t > 4.5) { F.mode = 'in'; F.t = 0; }
    else { const na = th - Math.sign(off) * 0.8, [gx, gy] = clipToWalls(t.x, t.y, t.x + Math.cos(na) * R, t.y + Math.sin(na) * R * 0.85, f.r); pathTo(f, gx, gy, T.spd, dt, 2); return; }
  }
  if (facing && d > reach + 8 && F.t > 0.15) { F.mode = 'circle'; F.t = 0; return; } // seen coming: peel off
  if (d > reach * 0.9) { pathTo(f, t.x, t.y, T.spd * 1.15, dt, reach * 0.5); return; }
  if (f.cdT <= 0) { startFoeAtk(f, A, t); F.mode = 'out'; F.t = 0; } else strafe(f, t, T.spd * 0.6, dt);
}
// circling a little while waiting for the next swing, so a crowd does not stand in one heap
function strafe(f, t, spd, dt) { const a = angTo(t.x, t.y, f.x, f.y) + (f.id % 2 ? 0.9 : -0.9) * dt * 2, d = dist(f.x, f.y, t.x, t.y); steer(f, t.x + Math.cos(a) * d, t.y + Math.sin(a) * d * 0.85, spd, dt); }
function idleFoe(f, dt) {
  if (f.state === 'sleep') { f.vx = f.vy = 0; f.moving = false; if (chance(dt * 0.6)) snore(f); return; }
  if ((f.wanderT -= dt) <= 0) { f.wanderT = rand(2, 5); const a = rand(TAU); f.wx = f.home.x + Math.cos(a) * rand(0, 22); f.wy = f.home.y + Math.sin(a) * rand(0, 14); }
  if (f.wx !== undefined && dist(f.x, f.y, f.wx, f.wy) > 3 && !solidAt(f.wx, f.wy)) { pathTo(f, f.wx, f.wy, f.def.spd * 0.35, dt, 2); faceTo(f, angTo(f.x, f.y, f.wx, f.wy)); }
  else { holdStill(f, dt); if (chance(dt * 0.3)) faceTo(f, f.dir + rand(-1.8, 1.8)); } // standing about, it looks around
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
  if (a.phase === 'act') { const u = 1 - (a.t - w) / mv.act; const L = mv.lunge || 0; f.vx = Math.cos(a.dir) * L * u; f.vy = Math.sin(a.dir) * L * u * 0.85; foeHits(f, a); if (a.t >= s) a.phase = 'rec'; }
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
    const ka = angTo(src.x, src.y, h.x, h.y); hurt(h, f.def.dmg * f.dmgMul * (mv.dm || 1), f, { poise: mv.poise, kx: Math.cos(ka) * mv.push, ky: Math.sin(ka) * mv.push * 0.8, unblockable: mv.unblockable });
  }
}
// ---------- arrows and stones ----------
// Pillars stop arrows exactly where their stone is drawn: the arrow's drawn pixel against the pillar's own pixels, at the
// pillar's depth (an arrow passing well in front of or behind it flies on).
function pillarAt(x, y, z) {
  const P = PIX.cellar; if (!P || !ARENA) return null; const sx = Math.round(x), sy = Math.round(y - z);
  for (const p of ARENA.props) {
    if (p.kind !== 'pillar' || p.dead || Math.abs(x - p.x) > 9 || y < p.cy - 9 || y > p.cy + 6) continue;
    const lx = sx - (p.x - 8), ly = sy - (p.y - 46); if (lx < 0 || lx >= TS || ly < 0 || ly >= 3 * TS) continue;
    const [tx, ty] = p.tile; if (P.d[((ty * TS + ly) * P.w + tx * TS + lx) * 4 + 3] > 0) return p;
  }
  return null;
}
// an archer's arrow would reach the hero: no wall and no pillar on its flight line
function clearShot(f, t) {
  if (!lineOfSight(f.x, f.y - 4, t.x, t.y - 4)) return false; const a = angTo(f.x, f.y, t.x, t.y), sx = f.x + Math.cos(a) * 6, sy = f.y - 2 + Math.sin(a) * 4, L = dist(f.x, f.y, t.x, t.y);
  for (let s = 0; s < L; s += 3) if (pillarAt(sx + Math.cos(a) * s, sy + Math.sin(a) * s * 0.85, 7)) return false; return true;
}
function shoot(f, dir) {
  const S = f.def.shot, stone = STONE_SHOT[f.spr]; SFX.whoosh(panOf(f.x));
  G.proj.push({ k: stone ? 'stone' : 'arrow', x: f.x + Math.cos(dir) * 6, y: f.y - 2 + Math.sin(dir) * 4, z: 7, vx: Math.cos(dir) * S.spd, vy: Math.sin(dir) * S.spd * 0.85, team: 'foe', dmg: f.def.dmg * f.dmgMul, src: f, life: 1.6, r: 2 });
}
function updateProj(dt) {
  for (const p of G.proj) {
    p.life -= dt; const ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt;
    const pl = pillarAt(p.x, p.y, p.z); if (solidAt(p.x, p.y) || p.life <= 0 || pl) { p.dead = true; sparks(ox, oy, p.z, 3, 'white', 60, 40); if (pl) SFX.clang(panOf(p.x)); continue; }
    const foes = p.team === 'foe' ? G.heroes : G.foes;
    for (const u of foes) {
      if (u.dead || dist(u.x, u.y, p.x, p.y) > u.r + p.r + 2) continue;
      if (u.iframe > 0) continue;
      if (u.team === 'hero' && u.blocking && u.blockT < PARRY_WINDOW && Math.abs(angDiff(u.dir, Math.atan2(-p.vy, -p.vx))) < 1.25) { // a parried arrow flies back where it came from
        const s = p.src && !p.src.dead ? angTo(p.x, p.y, p.src.x, p.src.y) : Math.atan2(-p.vy, -p.vx), v = Math.hypot(p.vx, p.vy) * 1.2; p.vx = Math.cos(s) * v; p.vy = Math.sin(s) * v * 0.85; p.team = 'hero'; p.dmg *= 2.5; p.life = 1.2; p.src = u;
        sparks(p.x, p.y, 7, 12, 'gold', 160, 80); SFX.clang(panOf(p.x)); textPop(u.x, u.y, headZ(u) + 3, 'DEFLECTED', 'gold', false); freeze(u, 0.06); break;
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
    const dd = dist(d.x, d.y, h.x, h.y); if (dd < 6) { d.dead = true; G.gold += d.v; SFX.coin(panOf(d.x)); part({ k: 'glow', x: d.x, y: d.y, z: 6, vz: 30, life: 0.3, s0: 2, s1: 0, col: 'gold' }); }
    else { d.x += (h.x - d.x) / dd * 140 * dt; d.y += (h.y - d.y) / dd * 140 * dt; }
  }
  removeIf(G.drops, d => d.dead);
}
