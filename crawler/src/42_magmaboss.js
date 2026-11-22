// ===================== THE LORD ON THE LAKE (the magma's last floor) =====================
// The ninth floor's way down lies across a lake of lava. Its last room is all lava but for a landing at each door, a
// ledge under the stairway, an island in the middle (nine tiles by five to seven, its corners gone) and causeways of
// stone from every door and from the stairs to the island. Nobody is there. When a hero reaches the island the lava
// north of it heaves and THE LORD of the floor's army rises out of it (the Demon Horde's Pit Balor, the Cinder Court's
// Molten Efreet), roars, and leaps onto the island. He fights in three stages, the room changing between them:
//   I   He fights as a brute does, and calls the lake: every few seconds bubbles swell on the lava and throw burning
//       rocks at the hero (42_magma's, each marked where it will land).
//   II  At two thirds of his life, with every hero on the island, he leaps to its middle and roars: THE BRIDGES FALL.
//       Every causeway breaks up and drops into the lava, from its far end to the island. Nobody leaves now. Three of
//       his small ones climb out of the lava. He calls rocks more often, and now and then a ring of them round the hero
//       (stand still in its middle, or roll out through it).
//   III At one third he slams the island: THE LAKE RISES. The island's outer ring of stone breaks away (whoever stood on
//       it is thrown to the middle first). Rocks fall on what is left without pause.
// When he dies the lake goes quiet and a crust hardens over it from the island to the stairs and to every door: the way
// down, and the way back. His name and life are shown at the top of the screen while he fights.
const LAKE = { force: false, hp: 2.8, s2: 0.66, s3: 0.33 };
const lakeFloor = floor => themeOf(floor).sheet === 'magma' && (floor === 9 || LAKE.force);
const LORDS = { demons: ['PitBalor', 'THE BALOR OF THE PIT'], cinders: ['MoltenEfreeti', 'THE MOLTEN EFREET'] };
function lavaLake(A, g) {
  const r = A.end; if (!r || r.set || r.shape || r.great || r.w < 15 || r.h < 9 || r.stairX === undefined) return false;
  const W = A.w, cx = Math.round((r.ix0 + r.ix1) / 2), I = { x0: cx - 4, x1: cx + 4, y0: r.iy0 + 3, y1: r.iy1 - 2 }, keep = doorLanding(A, r, 1), isl = new Set(), ring = [];
  const inR = (x, y) => x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1, add = (S, x, y) => { if (!inR(x, y)) return; const i = y * W + x; if (isl.has(i)) return; if (S && !keep.has(i)) S.push(i); keep.add(i); };
  for (let y = I.y0; y <= I.y1; y++) for (let x = I.x0; x <= I.x1; x++) { const ex = x === I.x0 || x === I.x1, ey = y === I.y0 || y === I.y1; if (ex && ey) continue; const i = y * W + x; isl.add(i); keep.add(i); if (ex || ey) ring.push(i); }
  const run = (S, x0, y0, x1, y1, wx, wy) => { const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0); let x = x0, y = y0; for (let n = 0; n < 80; n++) { add(S, x, y); add(S, x + wx, y + wy); if (x === x1 && y === y1) break; x += sx; y += sy; } };
  const ways = [], ix = x => clamp(x, I.x0 + 1, I.x1 - 2), iy = y => clamp(y, I.y0 + 1, I.y1 - 2);
  { const S = [], sx = r.stairX; for (let x = sx - 1; x <= sx + 3; x++) add(null, x, r.iy0); // the stairs' ledge, and its way (three wide, as the stairs are)
    const x = clamp(sx, I.x0 + 1, I.x1 - 3); if (x === sx) { run(S, sx, r.iy0 + 1, sx, I.y0 - 1, 1, 0); run(S, sx + 2, r.iy0 + 1, sx + 2, I.y0 - 1, 0, 0); } else { run(S, sx, r.iy0 + 1, sx, r.iy0 + 1, 1, 0); run(S, sx + 2, r.iy0 + 1, sx + 2, r.iy0 + 1, 0, 0); run(S, sx, r.iy0 + 1, sx < I.x0 ? I.x0 - 1 : I.x1 + 1, r.iy0 + 1, 0, 1); const ex = sx < I.x0 ? I.x0 : I.x1; run(S, ex, r.iy0 + 1, ex, I.y0, 0, 0); run(S, ex + (sx < I.x0 ? 1 : -1), r.iy0 + 1, ex + (sx < I.x0 ? 1 : -1), I.y0 - 1, 0, 0); }
    ways.push(S); }
  for (const d of r.doors) { const S = [], [mx, my] = d.cells[1];
    if (d.side === 'N' || d.side === 'S') { const n = d.side === 'N', y0 = n ? r.iy0 : r.iy1, x = ix(mx);
      if (x === mx) run(S, mx, y0, mx, n ? I.y0 - 1 : I.y1 + 1, 1, 0); else { const ym = iy(n ? I.y0 + 1 : I.y1 - 2); run(S, mx, y0, mx, ym, 1, 0); run(S, mx, ym, mx < I.x0 ? I.x0 - 1 : I.x1 + 1, ym, 0, 1); } }
    else { const w = d.side === 'W', x0 = w ? r.ix0 : r.ix1, y = iy(my);
      if (y === my) run(S, x0, my, w ? I.x0 - 1 : I.x1 + 1, my, 0, 1); else { const xm = ix(w ? I.x0 + 1 : I.x1 - 2); run(S, x0, my, xm, my, 0, 1); run(S, xm, my, xm, my < I.y0 ? I.y0 - 1 : I.y1 + 1, 1, 0); } }
    ways.push(S); }
  const cells = new Set(); for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (!keep.has(i) && FLOOR(A.fl[i])) cells.add(i); }
  const R = pitReach(A, r, cells); if (!R || !R.linked || ![...isl].every(i => R.seen.has(i)) || !R.seen.has(r.iy0 * W + r.stairX + 1)) return false;
  for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (FLOOR(A.fl[i]) && !cells.has(i) && !R.seen.has(i)) cells.add(i); }
  for (const i of cells) A.fl[i] = PIT; for (const i of cells) pitPaint(A, g, i); A.pitN = (A.pitN || 0) + cells.size; r.set = 'lake'; r.noBombs = true;
  const cy = (I.y0 + I.y1) / 2, side = r.stairX + 1 <= cx ? 1 : -1; // (he rises in the lava north of the island, on the side away from the stairs' way)
  A.lake = { r, I, isl, ring, ways: ways.map(S => S.filter(i => !isl.has(i))), cx: cx * TS + 8, cy: cy * TS + 10, rise: [(cx + side * 3) * TS + 8, (I.y0 - 1) * TS + 4] };
  return true;
}
function magmaLord(A) {
  const K = A.lake; if (!K) return; removeIf(G.foes, f => f.exitGuard); const [spr, name] = LORDS[A.army] || LORDS.demons; if (!MOBS[spr]) return;
  const L = mkFoe('brute', G.floor, K.rise[0], K.rise[1], spr); L.exitGuard = true; L.room = K.r.i; G.foes.push(L);
  Object.assign(L, { lord: true, boss: true, noFall: true, maxHp: Math.round(L.maxHp * LAKE.hp), dmgMul: (L.dmgMul || 1) * 1.15, hidden: true, iframe: 1e9, aware: false, script: { tick(f) { f.vx = f.vy = 0; f.moving = false; } } }); L.hp = L.maxHp;
  A.boss = { L, name, stage: 0, callT: 4, rainT: 2, q: [], cageN: 0 };
}
const onIsle = (K, u, inner) => { const tx = Math.floor(u.x / TS), ty = Math.floor(u.y / TS), I = K.I, m = inner ? 1 : 0; return tx >= I.x0 + m && tx <= I.x1 - m && ty >= I.y0 + m && ty <= I.y1 - m; };
// a picture of one floor tile as it lies (for a slab falling away), read off the ground's chunks
function tileShot(A, x, y) { const cv = mkCanvas(TS, TS), q = cv.getContext('2d'); for (const k of groundChunks(A)) if (x * TS < k.x + k.w && x * TS + TS > k.x && y * TS < k.y + k.h && y * TS + TS > k.y) q.drawImage(k.cv, x * TS - k.x, y * TS - k.y, TS, TS, 0, 0, TS, TS); return cv; }
// a tile of floor breaks up and drops into the lava (38_pits pitsTick does the rest: it shakes, then falls with whoever is on it)
function lakeBreak(A, i) { if (A.fl[i] !== 1 || A.crumbleSet.has(i)) return; const x = i % A.w, y = (i / A.w) | 0; A.crumbles.push({ i, x, y, cv: tileShot(A, x, y), st: 1, t: 0, ph: 0, room: A.lake.r.i, tell: 0 }); A.crumbleSet.add(i); A.live.add(A.lake.r.i); SFX.crumble(panOf(x * TS + 8), 0); }
// a tile of lava crusts over: floor again, the sheet's cooled plates with the lava still showing in their seams
function lakeCrust(A, i) {
  if (A.fl[i] !== PIT) return; const W = A.w, x = i % W, y = (i / W) | 0; A.fl[i] = 1; A.pitN--; A.flv = (A.flv || 0) + 1;
  for (const k of groundChunks(A)) { if (!(x * TS - TS < k.x + k.w && x * TS + 2 * TS > k.x && y * TS - TS < k.y + k.h && y * TS + 2 * TS > k.y)) continue;
    k.g.drawImage(IMG.magma, (17 + (x + y) % 3) * TS, (18 + (x * 3 + y) % 2) * TS, TS, TS, x * TS, y * TS, TS, TS); for (const j of [i - 1, i + 1, i - W, i + W, i - W - 1, i - W + 1]) if (A.fl[j] === PIT) pitPaint(A, k.g, j); lavaMark(A, k.g, x * TS, y * TS, TS, TS); }
  smoke(x * TS + 8, y * TS + 8, 2, 'grey', 7, 8, 1.2, 16); if (chance(0.4)) SFX.sizzle(panOf(x * TS + 8));
}
function bossCall(B, n, cage) { // the lake answers him: rocks at the hero, or a ring of them round him
  const A = ARENA, K = A.lake, L = B.L, h = G.heroes.filter(u => !u.dead && !u.fall)[0]; if (!h) return; const T = lavaTilesOf(A, K.r); if (!T.length) return; const W = A.w;
  L.flash = 0.2; ring(L.x, L.y - 8, 26, 'magma', 0.4, 3); SFX.groan(panOf(L.x)); SFX.boom(0.3, panOf(L.x));
  const src = () => { const near = T.map(i => [Math.hypot((i % W) * TS + 8 - h.x, ((i / W) | 0) * TS + 9 - h.y), i]).sort((a, b) => a[0] - b[0]).slice(0, 10), i = pick(near)[1]; return lavaSpot((i % W) * TS + 8, ((i / W) | 0) * TS + 9); };
  if (cage) { const [sx, sy] = src(), a0 = rand(TAU), m = 6; lavaSplash(sx, sy, 1.1); for (let k = 0; k < m; k++) { const a = a0 + k / m * TAU, tx = h.x + Math.cos(a) * 30, ty = h.y + Math.sin(a) * 23; if (roomAt(tx, ty) !== K.r || !FLOOR(A.fl[footTile(tx, ty)])) continue; A.bombs.push({ x0: sx, y0: sy, x1: tx, y1: ty, x: sx, y: sy, z: 0, t: 0, wait: 0.06 * k, T: BOMB.fly + 0.15, rot: randi(0, 3), spin: 0 }); } return; }
  for (let k = 0; k < n; k++) { const [sx, sy] = src(); A.erupt.push({ x: sx, y: sy, t: -0.25 * k, n: 1, r: K.r, h }); }
}
function bossTick(dt) {
  const A = ARENA, B = A && A.boss; if (!B || G.cine) return; const K = A.lake, L = B.L, hs = G.heroes.filter(u => !u.dead);
  if (!A.bombs) { A.bombs = []; A.erupt = []; }
  if (B.stage === 0) { if (hs.some(u => !u.fall && onIsle(K, u, true)) || L.hp < L.maxHp) bossCine('intro'); return; }
  if (L.dead) { if (!B.over && (B.deadT = (B.deadT || 0) + dt) > 0.6) { B.over = true; bossCine('end'); } return; }
  for (const u of hs) if (B.stage >= 2 && !u.fall && FLOOR(A.fl[footTile(u.x, u.y)]) && onIsle(K, u, B.stage >= 3)) u.safe = { x: u.x, y: u.y }; // (where the lava throws him back to: the island, what is left of it)
  const k = L.hp / L.maxHp, busy = L.act && L.act.k === 'atk';
  if (B.stage === 1 && k <= LAKE.s2 && hs.length && hs.every(u => !u.fall && onIsle(K, u))) { bossCine('fall'); return; }
  if (B.stage === 2 && k <= LAKE.s3 && hs.every(u => !u.fall)) { bossCine('rise'); return; }
  if ((B.callT -= dt) <= 0 && !busy) { const s = B.stage; B.callT = s === 1 ? rand(5.5, 8) : s === 2 ? rand(4, 6) : rand(3.2, 4.6); const cage = s >= 2 && (B.cageN++ % 3 === 1); bossCall(B, s === 1 ? 2 : s === 2 ? 3 : 4, cage); }
  if (B.stage === 3 && (B.rainT -= dt) <= 0) { B.rainT = rand(1, 1.7); const T = lavaTilesOf(A, K.r), I = K.I; if (T.length) { const i = pick(T), [sx, sy] = lavaSpot((i % A.w) * TS + 8, ((i / A.w) | 0) * TS + 9), tx = rand(I.x0 + 1, I.x1) * TS, ty = rand(I.y0 + 1, I.y1) * TS; if (FLOOR(A.fl[footTile(tx, ty)])) A.bombs.push({ x0: sx, y0: sy, x1: tx, y1: ty, x: sx, y: sy, z: 0, t: 0, wait: 0, T: BOMB.fly, rot: randi(0, 3), spin: 0 }); } }
}
// ---- the cinematics: the game holds still (60_run) but for what each needs
function bossCine(kind) { const A = ARENA, B = A.boss, K = A.lake; G.cine = { boss: B, kind, x: K.cx, y: K.cy - 8, t: 0, q: [] }; for (const h of G.heroes) { h.vx = h.vy = 0; h.act = null; h.blocking = false; } G.proj.length = 0; }
function leapTo(L, x1, y1, T, hgt, C, t0) { const x0 = L.x, y0 = L.y; C.q.push({ t: t0, dur: T, fn(u) { L.x = x0 + (x1 - x0) * u; L.y = y0 + (y1 - y0) * u; L.z = 4 * hgt * u * (1 - u); L.face = x1 < x0 ? -1 : 1; if (u >= 1) { L.z = 0; shake(0.3); ring(L.x, L.y, 30, 'magma', 0.4, 4); smoke(L.x, L.y, 6, 'dust', 10, 26, 1); SFX.boom(0.7, panOf(L.x)); SFX.stone(panOf(L.x), true); } } }); }
function bossCineTick(C, dt) {
  const A = ARENA, B = C.boss, K = A.lake, L = B.L, at = v => C.t - dt < v && C.t >= v, W = A.w;
  pitsTick(dt); fireTick(dt); magmaAmbient(dt); updateSight(dt); for (const u of G.units) u.anim += dt;
  for (const e of C.q) { const u = (C.t - e.t) / e.dur; if (u >= 0 && !e.done) { e.fn(Math.min(1, u)); if (u >= 1) e.done = true; } }
  const done = T => { if (C.t >= T) { G.cine = null; for (const h of G.heroes) h.iframe = Math.max(h.iframe || 0, 0.6); } };
  if (C.kind === 'intro') { // the lava heaves; he rises out of it; he leaps to the island
    const [rx, ry] = K.rise, H = spritePixels(L.spr).foot * L.scale + 4; C.x = lerp(K.cx, rx, 0.6); C.y = lerp(K.cy, ry, 0.6) - 8;
    if (at(0.05)) { SFX.quake(1.6); L.x = rx; L.y = ry; L.z = -H; }
    if (C.t < 1.1) { if (chance(dt * 22)) plipLava(rx + rand(-9, 9), ry + rand(-5, 5)); if (chance(dt * 5)) lavaSplash(rx + rand(-8, 8), ry + rand(-4, 4), 0.4, true); light(rx, ry - 4, 50 + 60 * C.t, 'fire', 0.6 + 0.4 * C.t); shake(dt * 0.5); }
    if (at(1.1)) { L.hidden = false; lavaSplash(rx, ry, 1.6); shake(0.3); SFX.groan(panOf(rx)); }
    if (C.t >= 1.1 && C.t < 2.2) { L.z = -H * (1 - ease((C.t - 1.1) / 1.1)); L.face = G.me && G.me.x < L.x ? -1 : 1; if (chance(dt * 26)) part({ k: 'gore', x: L.x + rand(-6, 6), y: L.y, z: Math.max(1, H + L.z) * rand(0.2, 1), vx: rand(-14, 14), vy: rand(-4, 4), vz: rand(-10, 20), g: 320, life: 1.2, s0: chance(0.3) ? 2 : 1, col: pick(['#ff7f00', '#e54c00', '#ffaa00']), kind: 'lava' }); light(L.x, L.y - 8, 80, 'fire', 1); }
    if (at(2.2)) { L.z = 0; SFX.braam(); shake(0.5); flash('fire', 0.22); pushBanner({ a: B.name, b: 'LORD OF THE LAKE', col: 'magma', life: 3 }); ring(L.x, L.y - 8, 60, 'magma', 0.6, 5); leapTo(L, K.cx, K.cy - TS, 0.55, 30, C, 2.9); }
    if (C.t >= 3.6) { B.stage = 1; L.script = null; L.iframe = 0; L.aware = true; if (G.me) wakeFoe(L, G.me, 'noise'); done(3.6); }
    return;
  }
  if (C.kind === 'fall') { // THE BRIDGES FALL
    if (at(0.05)) { L.script = { tick() { } }; L.act = null; L.vx = L.vy = 0; leapTo(L, K.cx, K.cy, 0.6, 34, C, 0.1); }
    if (at(0.9)) { SFX.braam(); SFX.quake(3); shake(0.6); flash('fire', 0.2); pushBanner({ a: 'THE BRIDGES FALL', col: 'magma', life: 2.6 }); ring(L.x, L.y - 8, 70, 'magma', 0.7, 5);
      let n = 0; for (const S of K.ways) { S.forEach((i, j) => C.q.push({ t: 1.1 + j * 0.05, dur: 0.01, fn() { lakeBreak(A, i); } })); n = Math.max(n, S.length); } C.endT = 1.1 + n * 0.05 + CRUMBLE_T + 0.9; }
    if (C.t > 0.9 && C.endT) { const a = (C.t * 0.5) % TAU; C.x = K.cx + Math.cos(a) * 26; C.y = K.cy - 8 + Math.sin(a) * 14; shake(dt * 0.4); } // (the view drifts round the island as they go)
    if (C.endT && C.t >= C.endT) { B.stage = 2; L.script = null; B.callT = 2.5; bossAdds(A, B); done(C.endT); }
    return;
  }
  if (C.kind === 'rise') { // THE LAKE RISES
    if (at(0.05)) { L.script = { tick() { } }; L.act = null; L.vx = L.vy = 0; leapTo(L, K.cx, K.cy, 0.6, 34, C, 0.1);
      for (const h of G.heroes) if (!h.dead && !onIsle(K, h, true)) { const x0 = h.x, y0 = h.y, I = K.I, x1 = clamp(h.x, (I.x0 + 1) * TS + 6, (I.x1) * TS - 6), y1 = clamp(h.y, (I.y0 + 1) * TS + 8, (I.y1) * TS - 4); C.q.push({ t: 0.75, dur: 0.35, fn(u) { h.x = x0 + (x1 - x0) * u; h.y = y0 + (y1 - y0) * u; h.z = 10 * Math.sin(u * Math.PI); if (u >= 1) { h.z = 0; h.safe = { x: h.x, y: h.y }; } } }); } }
    if (at(0.75)) { SFX.braam(); SFX.quake(2.5); shake(0.7); flash('fire', 0.22); pushBanner({ a: 'THE LAKE RISES', col: 'magma', life: 2.6 }); ring(L.x, L.y - 8, 80, 'magma', 0.7, 6); cracks(L.x, L.y, 7, 9, 240, 3);
      const R = K.ring.slice().sort((a, b) => Math.atan2(((a / W) | 0) * TS - K.cy, (a % W) * TS - K.cx) - Math.atan2(((b / W) | 0) * TS - K.cy, (b % W) * TS - K.cx)); R.forEach((i, j) => C.q.push({ t: 1.2 + j * 0.045, dur: 0.01, fn() { lakeBreak(A, i); } })); C.endT = 1.2 + R.length * 0.045 + CRUMBLE_T + 0.8; }
    if (C.endT && C.t >= C.endT) { B.stage = 3; L.script = null; B.callT = 2; B.rainT = 1; done(C.endT); }
    return;
  }
  // the end: the lake goes quiet and crusts over, from the island out to the stairs and to every door
  if (at(0.05)) { SFX.quake(1.5); pushBanner({ a: 'THE LAKE IS STILL', col: 'gold', life: 3 }); A.bombs.length = 0; A.erupt.length = 0; flash('hot', 0.25);
    let n = 0; const seen = new Set(); for (const S of K.ways) { const P = S.slice().reverse().filter(i => A.fl[i] === PIT && !seen.has(i)); P.forEach(i => seen.add(i)); P.forEach((i, j) => C.q.push({ t: 0.9 + j * 0.06, dur: 0.01, fn() { lakeCrust(A, i); } })); n = Math.max(n, P.length); }
    const R = K.ring.filter(i => A.fl[i] === PIT && !seen.has(i)); R.forEach((i, j) => C.q.push({ t: 0.5 + j * 0.02, dur: 0.01, fn() { lakeCrust(A, i); } })); C.endT = 0.9 + n * 0.06 + 1; }
  if (C.endT && C.t >= C.endT) { for (const h of G.heroes) if (!h.dead) h.safe = { x: h.x, y: h.y }; done(C.endT); }
}
// three of his small ones climb out of the lava onto the island's edge
function bossAdds(A, B) {
  const K = A.lake, I = K.I, type = ARMIES[A.army].skitter.length ? 'skitter' : 'grunt', spots = pitShuffle([[I.x0 + 1, I.y0], [I.x1 - 1, I.y0], [I.x0 + 1, I.y1], [I.x1 - 1, I.y1], [I.x0, I.y0 + 1], [I.x1, I.y1 - 1]]).filter(([x, y]) => FLOOR(A.fl[y * A.w + x])).slice(0, 3);
  for (const [tx, ty] of spots) { const u = mkFoe(type, G.floor, tx * TS + 8, ty * TS + 10); u.room = K.r.i; u.aware = true; u.z = -14; G.foes.push(u); G.units.push(u); lavaSplash(u.x, u.y, 0.5, true);
    u.script = { t: 0, tick(f, dt) { const S = f.script; S.t += dt; f.z = -14 * (1 - Math.min(1, S.t / 0.7)); f.anim += dt; if (S.t >= 0.7) { f.z = 0; f.script = null; if (G.me) wakeFoe(f, G.me, 'noise'); } } }; }
}
// his name and his life, at the top of the screen, a notch at each stage's end
function drawBossBar(c, W, H) {
  const A = ARENA, B = A && A.boss; if (!B || B.stage < 1 || B.over || G.mode !== 'play') return; const L = B.L, w = Math.min(360, W * 0.36), x = Math.round(W / 2 - w / 2), y = 30, k = clamp(L.hp / L.maxHp, 0, 1);
  font(c, 600, 15, F_HUD); label(c, B.name, W / 2, y - 6, '#ffd9a0', { align: 'center', stroke: 3 });
  c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(x - 2, y, w + 4, 11); c.fillStyle = '#3a0c06'; c.fillRect(x, y + 2, w, 7); c.fillStyle = B.stage >= 3 ? '#ffb030' : B.stage === 2 ? '#ff7a1c' : '#e23c18'; c.fillRect(x, y + 2, Math.round(w * k), 7); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y + 2, Math.round(w * k), 2);
  c.fillStyle = 'rgba(0,0,0,0.75)'; for (const s of [LAKE.s2, LAKE.s3]) c.fillRect(x + Math.round(w * s) - 1, y + 1, 2, 9);
}
