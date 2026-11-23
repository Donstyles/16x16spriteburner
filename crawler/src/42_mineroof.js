// ===================== THE ROOF (the mines': 42_mines) =====================
// A mine's roof is not a cellar's vault. A heavy blow on these floors (anything that cracks the floor: 40_fx cracks) may
// shake a fall of rock loose over somebody nearby, foe or hero: a shadow gathers on the floor where it will land, dust
// and grit pour down on it for the better part of a second, then the rock comes. It strikes whoever stands there, hard,
// and leaves its rubble (grit and pebbles, painted in: nothing that bars a way). Under the timbering along a north wall
// nothing falls, nor over water more than ankle deep.
//
// BURIED (a hero killed by the roof: the death the mines add to the game's, 48_deaths). The rock that kills him is the
// first of many: he staggers under it, looks up, goes to his knees as the dust pours, and the roof comes down on him
// rock after rock till he is gone under the heap; one forearm is left out of it on the floor. The hand works at the
// dirt, twice, a third time more weakly, and is still. Dust settles; a last stone rolls down the heap.
const ROOF = { warn: 0.9, r: 13, cool: 0 }, BURY = { knees: 0.9, first: 1.25, last: 2.7, gone: 2.15, hand: 3.3, tw: [4.3, 5.2, 6.5], still: 7.2 };
function roofFall(x, y, o = {}) {
  const A = ARENA; if (!A || solidAt(x, y) || !FLOOR(A.fl[footTile(x, y)]) || depthPx(x, y) > 4) return false; const r = roomAt(x, y); if (r && y < r.iy0 * TS + 34) return false; // (under the timbering)
  (A.rockfalls = A.rockfalls || []).push({ x, y, t: 0, T: o.warn || ROOF.warn, r: o.r || ROOF.r, rocks: [0, 1, 2].map(i => ({ dx: i ? rand(-7, 7) : 0, dy: i ? rand(-4, 4) : 0, tile: pick(MROCK.one), d: i * 0.07 })), src: o.src || null });
  teleg(x, y, o.r || ROOF.r, o.warn || ROOF.warn, 'earth'); SFX.crumble(panOf(x), 0); return true;
}
function roofTick(dt) {
  const A = ARENA; ROOF.cool = Math.max(0, ROOF.cool - dt); if (!A || !A.rockfalls) return;
  for (const f of A.rockfalls) {
    const was = f.t; f.t += dt;
    if (f.t < f.T) { if (chance(dt * 26)) part({ k: 'debris', x: f.x + rand(-f.r, f.r) * 0.8, y: f.y + rand(-f.r, f.r) * 0.5, z: rand(60, 110), vx: rand(-4, 4), vy: 0, vz: rand(-140, -80), g: 300, life: 0.9, s0: 1, col: pick(['#66503a', '#4c3b2a', '#7f6246']) }); if (chance(dt * 6)) smoke(f.x + rand(-6, 6), f.y - 30, 1, 'dust', 6, 6, 0.8, -30); continue; }
    if (was < f.T) { // it lands
      shake(0.32); SFX.boom(0.5, panOf(f.x)); SFX.stone(panOf(f.x), true); smoke(f.x, f.y, 7, 'dust', 12, 30, 1.2, 10); debris(f.x, f.y, 14, ['#66503a', '#4c3b2a', '#7f6246', '#33281e'], 110, 150, 2);
      for (const u of G.units) { if (u.dead || u.fall || u.fly) continue; const d = Math.hypot(u.x - f.x, (u.y - f.y) * 1.3); if (d > f.r + u.r) continue; const a = d > 0.5 ? Math.atan2(u.y - f.y, u.x - f.x) : rand(TAU); hurt(u, 15 + A.floor * 1.6, { x: f.x, y: f.y, team: 'trap', def: {} }, { ranged: true, unblockable: true, poise: 80, kx: Math.cos(a) * 120, ky: Math.sin(a) * 90, buried: true, ang: a }); }
      groundPaint(f.x - 14, f.y - 10, f.x + 14, f.y + 10, g => { for (let i = 0; i < 4; i++) { const t = [16 + randi(0, 7), 9 + randi(0, 1)]; g.drawImage(IMG.mines, t[0] * TS, t[1] * TS, TS, TS, Math.round(f.x - 8 + rand(-7, 7)), Math.round(f.y - 8 + rand(-4, 4)), TS, TS); } }); // (its rubble: the sheet's pebbles)
    }
  }
  removeIf(A.rockfalls, f => f.t > f.T + 0.5);
}
// a heavy blow struck at a place: now and then the roof answers
function roofShake(x, y, n) {
  const A = ARENA; if (!isMines(A) || n < 3 || ROOF.cool > 0 || G.cine || !chance(0.24)) return; ROOF.cool = 2.5;
  const near = G.units.filter(u => !u.dead && !u.fall && !u.fly && Math.hypot(u.x - x, u.y - y) < 70), t = near.length ? pick(near) : null; after(0.3, () => { if (ARENA === A) roofFall(t ? t.x + rand(-6, 6) : x + rand(-30, 30), t ? t.y + rand(-4, 4) : y + rand(-20, 20)); });
}
function drawRock(c, tile, x, y, z) { c.drawImage(IMG.mines, tile[0] * TS, tile[1] * TS, TS, TS, Math.round(x - 8), Math.round(y - 14 - z), TS, TS); }
function drawRoof(c) {
  const A = ARENA; if (!A) return;
  for (const f of A.rockfalls || []) for (const k of f.rocks) { const u = (f.t - (f.T - 0.3) - k.d) / 0.3; if (u < 0 || f.t > f.T + 0.12 + k.d) continue; drawRock(c, k.tile, f.x + k.dx, f.y + k.dy, 150 * (1 - Math.min(1, u) ** 2)); }
  for (const h of G.heroes) { if (!h.dead || !h.death || h.death.kind !== 'buried') continue; const D = h.death, t = h.deadT || 0;
    // the forearm left out of it: a sleeve, a hand, its fingers working at the dirt
    if (t >= BURY.gone) { const fs = D.side, x = Math.round(D.x + fs * 17), y = Math.round(D.y + 5), tw = t >= BURY.hand && t < BURY.still && BURY.tw.some(v => t >= v && t < v + 0.34 && ((t - v) * 12 | 0) % 2 === 0), put = (dx, dy, w, hh, col) => { c.fillStyle = col; c.fillRect(fs > 0 ? x + dx : x - dx - w + 1, y + dy, w, hh); };
      put(0, 0, 4, 2, D.sleeve); put(0, 2, 4, 1, 'rgba(0,0,0,0.35)'); put(4, 0, 2, 2, D.skin); put(6, tw ? -1 : 0, 2, 1, D.skin); put(6, 1, tw ? 1 : 2, 1, D.skin); }
    for (const k of D.rocks.slice().sort((a, b) => a.dy - b.dy)) { const u = (t - k.t0) / 0.32; if (u < 0) continue; const z = 140 * (1 - Math.min(1, u) ** 2); if (k.big) c.drawImage(IMG.mines, k.tile[0] * TS, k.tile[1] * TS, 2 * TS, 2 * TS, Math.round(D.x + k.dx - 16), Math.round(D.y + k.dy - 28 - z), 2 * TS, 2 * TS); else drawRock(c, k.tile, D.x + k.dx, D.y + k.dy, z); }
  }
}
// ---- the death
function buriedPose(t, D) { return { gone: t >= BURY.gone, lie: false, dip: t < 0.35 ? 0 : t < BURY.knees ? 1 : 2, jit: t < BURY.first && ((G.time * 22) | 0) % 4 === 0 ? (((G.time * 11) | 0) % 2 ? 1 : -1) : 0 }; }
function buriedStart(h, o) {
  const px = spritePixels(h.spr), col = (fx, fy, d) => { const P = PIX.mobs, m = MOBS[h.spr], i = ((m[0] + fy) * P.w + fx) * 4; return P.d[i + 3] > 128 ? `rgb(${P.d[i]},${P.d[i + 1]},${P.d[i + 2]})` : d; };
  const m = MOBS[h.spr], fs = h.face < 0 ? -1 : 1, rocks = [];
  // (the heap: big ones first over him, then the small ones round and on them)
  const L = [[0, 2, 1, 0], [-9, 1, 0, 0.22], [8, -1, 0, 0.4], [-3, 6, 0, 0.62], [5, 5, 0, 0.8], [-1, -6, 0, 1.0], [-10, 6, 0, 1.2], [9, 4, 0, 1.38]];
  for (const [dx, dy, big, d] of L) rocks.push({ dx, dy, big: !!big, tile: big ? pick(MROCK.big) : pick(MROCK.one), t0: BURY.first + d });
  h.death = { kind: 'buried', x: h.x, y: h.y, side: -fs, rocks, n: 0, skin: col(Math.floor(m[1] / 2), Math.max(1, px.top + 2), '#e0b090'), sleeve: col(Math.floor(m[1] / 2) - 2, Math.max(2, px.foot - 6), '#5a4a40') };
  h.vx = h.vy = h.kx = h.ky = 0; SFX.quake(2.6); SFX.crumble(panOf(h.x), 0);
}
function buriedTick(h, dt) {
  const t = h.deadT, p = t - dt, D = h.death, at = v => p < v && t >= v; h.x = D.x; h.y = D.y; h.z = 0;
  if (t < BURY.last) { shake(dt * (t < BURY.first ? 0.5 : 0.9)); if (chance(dt * 34)) part({ k: 'debris', x: D.x + rand(-16, 16), y: D.y + rand(-8, 8), z: rand(70, 120), vx: rand(-6, 6), vy: 0, vz: rand(-150, -90), g: 300, life: 0.9, s0: chance(0.3) ? 2 : 1, col: pick(['#66503a', '#4c3b2a', '#7f6246']) }); if (chance(dt * 9)) smoke(D.x + rand(-12, 12), D.y - 34, 1, 'dust', 7, 6, 0.9, -34); }
  if (at(BURY.knees)) { dropWeapon(h, 0.6); SFX.boom(0.12, panOf(h.x)); }
  for (const k of D.rocks) if (at(k.t0 + 0.32)) { shake(k.big ? 0.4 : 0.22); SFX.boom(k.big ? 0.6 : 0.3, panOf(D.x)); SFX.stone(panOf(D.x), k.big); smoke(D.x + k.dx, D.y + k.dy, k.big ? 6 : 3, 'dust', 10, 24, 1.1, 8); debris(D.x + k.dx, D.y + k.dy, k.big ? 10 : 5, ['#66503a', '#4c3b2a', '#7f6246', '#33281e'], 90, 120, 2); if (k.big && !D.blood && bleeds(h) && GORE.level) { D.blood = true; spray(h, 30, { style: 'slam' }); } }
  for (const v of BURY.tw) if (at(v)) { part({ k: 'debris', x: D.x + D.side * 25, y: D.y + 6, z: 1, vx: D.side * rand(8, 20), vy: rand(-4, 4), vz: rand(20, 40), g: 300, life: 0.6, s0: 1, col: '#7f6246' }); SFX.drip(panOf(D.x)); }
  if (at(4.8) && bleeds(h) && GORE.level) pool(D.x - D.side * 2, D.y + 7, h.def.blood || 'red', 2);
  if (at(BURY.still + 0.8)) { part({ k: 'debris', x: D.x - 4, y: D.y - 2, z: 20, vx: -D.side * 16, vy: 6, vz: 10, g: 260, life: 1.1, s0: 2, col: '#4c3b2a' }); smoke(D.x, D.y - 6, 2, 'dust', 8, 6, 1.4, 6); }
  if (t > BURY.last && t < BURY.still + 2 && chance(dt * 2.4)) smoke(D.x + rand(-14, 14), D.y - rand(6, 20), 1, 'dust', 9, 5, 1.6, 5);
}
