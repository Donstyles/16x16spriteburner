// ===================== THE DRAKE IN THE SUMP (the mines' last floor: 42_mines, 42_minewater) =====================
// The way down from the mines lies under their sump: the last gallery, flooded to the roof, and what lives in it. The
// stairs stay sealed while it does. It cannot be hurt while it has its water: lying under more than SUMP.under pixels of
// it, every blow dies in the water over its back. So the fight is for the water, not for its life.
//   I   THE DRAKE OF THE SUMP. The gallery is full. It prowls round whoever is in the water and surges through him
//       along a line it shows first. The first sluice stands on a shoal a breath out from the door.
//  II   THE SUMP FALLS. The water is down a quarter: shoals show, a line of them out to the second sluice, which would
//       not turn before. The drake still has its deeps; it surges oftener, and two of the merfolk come up out of them.
// III   THE SHALLOWS. Down by more than half: nobody need swim, and nothing covers it. It fights on its feet now, as its
//       kind do, and can be hurt. The last sluice is out on the bed, where no shoal is.
//  IV   THE SUMP IS DRY. It lies beached: slow, struck stupid for a moment, and finished where it lies.
// Each sluice turns only under shallow water (36_works: maxDepth), so they are taken in that order by the nature of the
// thing. When it dies the stairs open, as for any floor's last guard.
const SUMP = { force: false, hp: 3.4, L1: 0.72, L2: 0.42, under: 9, surge: 250 };
const sumpFloor = floor => themeOf(floor) === THEMES.mines && (floor === 12 || SUMP.force);
function sumpMark(A) { const r = A.end; if (!r) return; r.set = 'sump'; A.sump = { r }; }
// its gallery flooded and its three sluices set (after the room is furnished: 42_mines minesWater)
function sumpLake(A) {
  const K = A.sump, r = K.r, W = A.w, Wk = wkOf(A), din = r.doors.find(d => !d.hidden); if (!din) { A.sump = null; return; }
  const [ex, ey] = din.cells[1], a0 = [ex * TS + 8, ey * TS + 8];
  // (a sluice stands on open floor, well inside the gallery, clear of whatever stands in it: the nearest such tile to where it is wanted)
  const okT = (x, y) => x > r.ix0 + 1 && x < r.ix1 - 1 && y > r.iy0 + 1 && y < r.iy1 - 1 && A.fl[y * W + x] === 1 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([i, j]) => A.fl[(y + j) * W + x + i] === 1) && !(A.noProp && A.noProp.has(y * W + x)) && !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < 22 && Math.abs(q.cy - (y * TS + 10)) < 20);
  const snap = p => { const tx = Math.floor(p[0] / TS), ty = Math.floor(p[1] / TS); let best = null, bd = 1e9; for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const d = Math.hypot(i, j); if (d < bd && okT(tx + i, ty + j)) { bd = d; best = [(tx + i) * TS + 8, (ty + j) * TS + 8]; } } return best || p; };
  const f = floodRoom(A, r, { flat: true, shoals: at => { const c = [at[0] * TS + 8, at[1] * TS + 8], P = t => [a0[0] + (c[0] - a0[0]) * t, a0[1] + (c[1] - a0[1]) * t]; K.pa = snap(P(0.36)); K.pb = snap(P(0.72)); const m = P(0.54); return [[K.pa[0], K.pa[1], 15, 0.6], [m[0] + 6, m[1] - 8, 12, 0.7], [K.pb[0], K.pb[1], 15, 0.7]]; } });
  if (!f || !f.at) { A.sump = null; r.set = null; return; }
  const tile = p => [Math.floor(p[0] / TS), Math.floor(p[1] / TS)], mk = (t, o) => { const [tx, ty] = t; removeIf(A.props, q => Math.abs(q.x - (tx * TS + 8)) < 14 && Math.abs(q.cy - (ty * TS + 10)) < 14); const pl = Object.assign({ x: tx * TS + 8, y: ty * TS + 8, tx, ty, tile: Wk.plate, f: 0, down: false, pool: null, room: r.i, flood: f }, o); (A.plates = A.plates || []).push(pl); return pl; };
  f.valves = [mk(tile(K.pa), { to: SUMP.L1 }), mk(tile(K.pb), { to: SUMP.L2, maxDepth: FLOOD.TURN }), mk(f.at, { to: 0, maxDepth: FLOOD.TURN })];
  f.onValve = (fl, pl) => sumpStage(fl.valves.indexOf(pl) + 2); K.f = f; K.cx = (r.ix0 + r.ix1 + 1) / 2 * TS; K.cy = (r.iy0 + r.iy1 + 1) / 2 * TS;
}
function sumpLord(A) {
  const K = A.sump; if (!K || !K.f || !MOBS.AquaDrake) return; removeIf(G.foes, f => f.exitGuard || f.room === K.r.i);
  const [x, y] = [K.f.at[0] * TS + 8, K.f.at[1] * TS + 8], L = mkFoe('brute', G.floor, x, y, 'AquaDrake'); L.exitGuard = true; L.room = K.r.i; G.foes.push(L);
  Object.assign(L, { lord: true, boss: true, scale: 1.7, r: L.r * 1.5, low: SUMP.under, maxHp: Math.round(L.maxHp * SUMP.hp), aware: false, state: 'idle' }); L.hp = L.maxHp;
  A.boss = { L, name: 'THE DRAKE OF THE SUMP', stage: 0, marks: false, ai: { mode: 'prowl', t: 3, ang: rand(TAU), dir: 1 }, col: ['#3c8fd8', '#58b0e8', '#9fd8ff'] };
  L.script = drakeScript(A.boss);
}
// under its water: prowling round its prey, then a surge through him along a line shown first
function drakeScript(B) { return { tick(f, dt) {
  const S = B.ai, hs = G.heroes.filter(h => !h.dead), h = hs.length ? hs.reduce((a, b) => (dist(a.x, a.y, f.x, f.y) < dist(b.x, b.y, f.x, f.y) ? a : b)) : null, sp = f.def.spd * 1.25; f.act = S.mode === 'aim' ? f.act : null;
  if (!h || B.stage < 1) { f.vx = f.vy = 0; f.moving = false; return; }
  S.t -= dt;
  if (S.mode === 'prowl') { S.ang += dt * 0.8 * S.dir; const R = 74, tx = h.x + Math.cos(S.ang) * R, ty = h.y + Math.sin(S.ang) * R * 0.75; steer(f, tx, ty, sp, dt, 4); f.moving = true; if (solidAt(tx, ty) && chance(dt * 3)) S.dir = -S.dir; if (S.t <= 0) { S.mode = 'aim'; S.t = 0.85; f.vx = f.vy = 0; f.act = { k: 'aim', t: 0, dur: 0.85, dir: angTo(f.x, f.y, h.x, h.y) }; SFX.groan(panOf(f.x)); } }
  else if (S.mode === 'aim') { f.vx = f.vy = 0; f.moving = false; const a = f.act; a.t += dt; if (a.t < 0.6) a.dir = angTo(f.x, f.y, h.x, h.y); faceTo(f, a.dir); if (S.t <= 0) { S.mode = 'surge'; S.t = 0.62; S.a = a.dir; S.hit = new Set(); f.act = null; SFX.whoosh(panOf(f.x)); SFX.splash(panOf(f.x), true); } }
  else if (S.mode === 'surge') { f.vx = Math.cos(S.a) * SUMP.surge; f.vy = Math.sin(S.a) * SUMP.surge * 0.85; f.moving = true; f.face = f.vx < 0 ? -1 : 1;
    if (chance(dt * 14)) ring(f.x, f.y - Math.min(f.wd || 0, 12), rand(6, 12), 'bolt', 0.4, 1, 3); if (chance(dt * 30)) water(f.x + rand(-6, 6), f.y, (f.wd || 0) + 1, rand(-30, 30), rand(-16, 16), rand(30, 70));
    for (const u of hs) if (!S.hit.has(u) && dist(u.x, u.y, f.x, f.y) < f.r + u.r + 3) { S.hit.add(u); hurt(u, 15 + G.floor * 1.4, f, { kx: Math.cos(S.a) * 260, ky: Math.sin(S.a) * 220, poise: 60, unblockable: false }); }
    if (S.t <= 0) { S.mode = 'rest'; S.t = 0.7; } }
  else { f.vx *= Math.exp(-6 * dt); f.vy *= Math.exp(-6 * dt); f.moving = false; if (S.t <= 0) { S.mode = 'prowl'; S.t = B.stage >= 2 ? rand(1.6, 2.6) : rand(2.6, 3.8); S.dir = chance(0.5) ? 1 : -1; S.ang = angTo(h.x, h.y, f.x, f.y); } }
} }; }
function sumpTick(dt) {
  const A = ARENA, B = A && A.boss, K = A && A.sump; if (!B || !K || G.cine) return; const L = B.L, hs = G.heroes.filter(u => !u.dead);
  if (L.dead) { if (!B.over && (B.deadT = (B.deadT || 0) + dt) > 0.6) { B.over = true; pushBanner({ a: 'THE WORKINGS ARE STILL', col: 'bolt2', life: 3 }); SFX.quake(1.5); } return; }
  // it cannot be hurt under its water: a blow at it there dies in the water over its back
  const D = depthPx(L.x, L.y), under = D >= SUMP.under; L.deep = under; L.iframe = 0; // (deep: no blow lands, 50_actors hurt; not an iframe, which nothing counts down for a foe: it stayed up after the water was gone and the drake could never be hurt)
  if (B.stage === 0) { const r = K.r; if (hs.some(u => u.x > r.ix0 * TS && u.x < (r.ix1 + 1) * TS && u.y > r.iy0 * TS && u.y < (r.iy1 + 1) * TS) || L.hp < L.maxHp) sumpStage(1); return; }
  if (B.stage === 3 && L.script) { L.script = null; L.act = null; L.vx = L.vy = 0; L.aware = true; wakeFoe(L, hs[0] || null, 'noise'); } // (in the shallows: it fights on its feet)
  if (B.stage === 4 && !B.beached && K.f.level <= 0.06) { B.beached = true; L.gaitK = 0.45; stagger(L, 2.6); SFX.groan(panOf(L.x)); shake(0.3); smoke(L.x, L.y, 5, 'breath', 10, 24, 1); }
}
// a stage begun: the game holds a moment (60_run), the view on the sump, and the water does what it does
function sumpStage(n) {
  const A = ARENA, B = A.boss, K = A.sump; if (!B || B.stage >= n) return; B.stage = n; const L = B.L;
  G.cine = { sump: B, n, x: K.cx, y: K.cy - 6, t: 0 }; G.eyes = [{ x: K.cx, y: K.cy, lightR: 150, eyeR: 11, dead: false, hush: 1, dir: 0 }]; for (const h of G.heroes) { h.vx = h.vy = 0; h.act = null; h.blocking = false; } G.proj.length = 0;
  if (n === 1) { SFX.quake(1.8); L.aware = true; } else { SFX.braam(); shake(0.4); }
  if (n === 2) for (let i = 0; i < 2; i++) { const a = rand(TAU), x = L.x + Math.cos(a) * 26, y = L.y + Math.sin(a) * 18; if (solidAt(x, y)) continue; const m = mkFoe(i ? 'flanker' : 'grunt', G.floor, x, y, i ? 'MerfolkImpaler' : 'MerfolkJavelineer'); m.room = K.r.i; m.aware = true; G.foes.push(m); G.units.push(m); splash(x, y, 6, 10, { spd: 0.8 }); }
}
function sumpCineTick(C, dt) {
  const A = ARENA, B = C.sump, K = A.sump, L = B.L, at = v => C.t - dt < v && C.t >= v; floodsTick(dt); updateSight(dt); for (const u of G.units) u.anim += dt;
  if (C.n === 1) { // it comes up, shows itself, and goes under again
    C.x = lerp(K.cx, L.x, 0.7); C.y = lerp(K.cy, L.y, 0.7) - 8;
    if (C.t < 1) { if (chance(dt * 9)) ring(L.x + rand(-10, 10), L.y - 14 + rand(-4, 4), rand(6, 14), 'bolt', 0.5, 1, 2); shake(dt * 0.4); }
    if (at(1)) { L.z = 0; L.vz = 150; splash(L.x, L.y - 12, 8, 26, { spd: 1.2 }); SFX.splash(panOf(L.x), true); SFX.braam(); shake(0.5); pushBanner({ a: 'THE DRAKE OF THE SUMP', b: 'LORD OF THE DROWNED WORKINGS', col: 'bolt2', life: 3 }); }
    if (C.t >= 1 && C.t < 2.2) { L.vz -= 560 * dt; L.z = Math.max(0, L.z + L.vz * dt); if (at(1.75)) { splash(L.x, L.y - 10, 6, 18, { spd: 1 }); SFX.splash(panOf(L.x), true); } }
    if (C.t >= 2.6) { L.z = 0; L.vz = 0; G.cine = null; G.eyes = null; }
    return;
  }
  if (at(0.25)) pushBanner({ a: C.n === 2 ? 'THE SUMP FALLS' : C.n === 3 ? 'THE SHALLOWS' : 'THE SUMP IS DRY', col: 'bolt2', life: 2.6 });
  if (chance(dt * 5)) { const [x, y] = K.f.valves[C.n - 2] ? [K.f.valves[C.n - 2].x, K.f.valves[C.n - 2].y] : [K.cx, K.cy]; ring(x, y, rand(8, 20), 'bolt', 0.6, 1, 2); }
  shake(dt * 0.25); if (C.t >= 1.9) { G.cine = null; G.eyes = null; for (const h of G.heroes) h.iframe = Math.max(h.iframe || 0, 0.5); }
}
