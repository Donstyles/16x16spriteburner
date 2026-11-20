// ===================== FX engine: particles, lightning, shockwaves, cracks, light, shake =====================
const Q = { pmax: 2600, bloom: 1, res: 1 };
const FX = { emit: [], wet: [], P: [], bolts: [], rings: [], arcs: [], cracks: [], beams: [], lights: [], flights: [], nums: [], tele: [], columns: [], circles: [], ghosts: [], hz: [], rocks: [], wake: [] };
function part(o) {
  if (FX.P.length >= Q.pmax) return null;
  const p = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, drag: 0, t: 0, life: 1, s0: 2, s1: 0, a0: 1, a1: 0, col: 'white', k: 'glow', bounce: 0, rot: 0, vr: 0 };
  for (const k in o) p[k] = o[k]; FX.P.push(p); return p;
}
// --- small recipes ---
function sparks(x, y, z, n, col = 'fire', spd = 160, up = 120, a0 = 0, spread = TAU) {
  for (let i = 0; i < n; i++) { const a = a0 + rand(-spread / 2, spread / 2), s = rand(0.25, 1) * spd; part({ k: 'spark', x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.8, vz: rand(0.2, 1) * up, g: 380, drag: 1.2, bounce: 0.45, life: rand(0.3, 0.9), col }); }
}
function glows(x, y, z, n, col, spd, s0, life, s1 = 0) { for (let i = 0; i < n; i++) { const a = rand(TAU), s = rand(0.2, 1) * spd; part({ k: 'glow', x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.75, vz: rand(-0.3, 0.6) * s, drag: 3, life: rand(0.5, 1) * life, s0: s0 * rand(0.6, 1.2), s1, col, a0: 0.8, a1: 0 }); } }
function embers(x, y, n, col = 'ember', spd = 50) { for (let i = 0; i < n; i++) part({ k: 'ember', x: x + rand(-6, 6), y: y + rand(-4, 4), z: rand(0, 10), vx: rand(-spd, spd), vy: rand(-spd, spd) * 0.6, vz: rand(30, 110), drag: 1.4, life: rand(0.8, 2.2), s0: rand(1.2, 2.4), s1: 0.4, col }); }
function smoke(x, y, n, col = 'grey', size = 10, spd = 20, life = 1.6, rise = 14) { for (let i = 0; i < n; i++) part({ k: 'smoke', x: x + rand(-4, 4), y: y + rand(-3, 3), z: rand(0, 6), vx: rand(-spd, spd), vy: rand(-spd, spd) * 0.6, vz: rand(0.4, 1) * rise, drag: 1.6, life: rand(0.6, 1) * life, s0: size * rand(0.4, 0.7), s1: size * rand(1, 1.6), col, a0: 0.75, a1: 0 }); }
function debris(x, y, n, cols = ['#5a5048', '#7d7064', '#3c342e'], spd = 120, up = 180, size = 2) { for (let i = 0; i < n; i++) { const a = rand(TAU), s = rand(0.3, 1) * spd; part({ k: 'debris', x, y, z: rand(0, 6), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, vz: rand(0.4, 1) * up, g: 520, drag: 0.8, bounce: 0.35, life: rand(1.2, 2.6), s0: size * rand(0.6, 1.4), col: pick(cols), rot: rand(TAU), vr: rand(-12, 12) }); } }
function ring(x, y, r1, col = 'white', life = 0.35, w = 4, r0 = 2) { FX.rings.push({ x, y, r0, r1, col, life, w, t: 0 }); }
function light(x, y, r, col = 'white', a = 1) { FX.lights.push(x, y, r, col, a); }
function flashLight(x, y, r, col, a, life) { FX.flights.push({ x, y, r, col, a, life, t: 0 }); }
function arcFx(x, y, a, spread, r, col = 'white', life = 0.18, w = 3) { FX.arcs.push({ x, y, a, spread, r, col, life, w, t: 0 }); }
function teleg(x, y, r, life, col = 'red') { FX.tele.push({ x, y, r, life, col, t: 0 }); }
function column(x, y, col = 'gold', life = 1.2, w = 14) { FX.columns.push({ x, y, col, life, w, t: 0 }); }
function circleFx(x, y, r, col, life) { const c = { x, y, r, col, life, t: 0 }; FX.circles.push(c); return c; }
// --- camera kick, shake, hitstop, slowmo, flash ---
function shake(a) { G.trauma = Math.min(1.7, G.trauma + a); }
function quake(dur, pow = 0.8) { G.quakeT = Math.max(G.quakeT, dur); G.quakeP = Math.max(G.quakeP, pow); }
function hitstop(s) { G.hitstop = Math.max(G.hitstop, s); } // the whole game: kept for a parry only
// hit-stop for one unit: the one struck (and the one striking) hold still a moment while the rest of the fight goes on
function freeze(u, s) { if (u && u.team && !u.dead) u.freeze = Math.max(u.freeze || 0, s); }
function slowmo(scale, dur) { G.ts = Math.min(G.ts, scale); G.slowT = Math.max(G.slowT, dur); }
function kick(k) { CAM.kick = Math.min(0.3, CAM.kick + k); }
function flash(col, a) { G.flashC = col; G.flashA = Math.max(G.flashA, a); }
function panOf(x) { return clamp((x - CAM.x) * CAM.z / (VIEW.w * 0.5), -1, 1); }
// --- lightning: midpoint displacement with branches; flickers by regenerating ---
function boltPts(x0, y0, x1, y1, disp, depth) {
  let pts = [x0, y0, x1, y1], d = disp;
  for (let k = 0; k < depth; k++) {
    const n = [pts[0], pts[1]];
    for (let i = 0; i < pts.length - 2; i += 2) { const ax = pts[i], ay = pts[i + 1], bx = pts[i + 2], by = pts[i + 3], nx = ay - by, ny = bx - ax, l = Math.hypot(nx, ny) || 1, o = (Math.random() * 2 - 1) * d; n.push((ax + bx) / 2 + nx / l * o, (ay + by) / 2 + ny / l * o, bx, by); }
    pts = n; d *= 0.55;
  }
  return pts;
}
function boltShape(b) {
  const len = dist(b.x0, b.y0, b.x1, b.y1); b.pts = boltPts(b.x0, b.y0, b.x1, b.y1, len * 0.17 * b.jag, len > 120 ? 6 : 5); b.br = [];
  const nb = b.branches; for (let i = 0; i < nb; i++) {
    const j = 2 * randi(2, (b.pts.length >> 1) - 3), px = b.pts[j], py = b.pts[j + 1], a = angTo(b.x0, b.y0, b.x1, b.y1) + rand(-0.9, 0.9), l = len * rand(0.15, 0.4);
    b.br.push(boltPts(px, py, px + Math.cos(a) * l, py + Math.sin(a) * l, l * 0.25, 4));
  }
}
function bolt(x0, y0, x1, y1, o = {}) {
  const b = { x0, y0, x1, y1, t: 0, life: o.life || 0.28, w: o.w || 1, col: o.col || 'bolt', branches: o.branches === undefined ? 3 : o.branches, jag: o.jag || 1, regen: 0 };
  boltShape(b); FX.bolts.push(b); return b;
}
// --- ground cracks: grow outward over time, get painted into the floor, glow with magma while hot ---
// a crack's stretch painted into the floor in whole pixels: dark, two wide where it opens from the blow and one wide
// along the rest and its branches, a faint pale lip under it
function crackPx(g, s) {
  const k = s.ww || 1, x0 = Math.round(s.x0), y0 = Math.round(s.y0), x1 = Math.round(s.x1), y1 = Math.round(s.y1), n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); g.fillStyle = 'rgba(255,230,190,0.14)'; g.fillRect(x, y + k, k, 1); g.fillStyle = 'rgba(6,4,4,0.85)'; g.fillRect(x, y, k, k); }
}
function cracks(x, y, n, len, speed = 260, hot = 2.5, col = 'magma') {
  const segs = [];
  const grow = (sx, sy, a, l, t, depth) => {
    let px = sx, py = sy; const steps = Math.max(2, (l / 7) | 0);
    for (let i = 0; i < steps; i++) {
      a += rand(-0.55, 0.55); const sl = rand(4, 9), nx = px + Math.cos(a) * sl, ny = py + Math.sin(a) * sl * 0.8; if (!inArena(nx, ny)) break;
      t += sl / speed; segs.push({ x0: px, y0: py, x1: nx, y1: ny, t0: t, w: Math.max(0.7, 2.2 - depth * 0.6 - i * 0.07), ww: depth === 0 && i < 2 ? 2 : 1, p: false }); px = nx; py = ny;
      if (depth < 2 && chance(0.2)) grow(px, py, a + rand(-1.3, 1.3), l * 0.45, t, depth + 1);
    }
  };
  for (let i = 0; i < n; i++) grow(x, y, i / n * TAU + rand(-0.35, 0.35), len * rand(0.6, 1.25), 0, 0);
  FX.cracks.push({ segs, t: 0, hot, life: hot + 2, col });
}
// --- floor decals (painted straight into the arena ground: the room gets wrecked) ---
function scorch(x, y, r, a = 0.6) { groundPaint(x - r, y - r, x + r, y + r, g => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(8,5,4,${a})`); gr.addColorStop(0.55, `rgba(16,10,8,${a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 0.75, 0, 0, TAU); g.fill(); }); }
// blood in whole pixels, painted into the floor: it stays until the floor gives way
function bloodPaint(x, y, pal, n, spread) { if (!ARENA) return; const R = []; for (let i = 0; i < n; i++) { const w = chance(0.25) ? 2 : 1; R.push([rand(0.7, 1), pal[(Math.random() * pal.length) | 0], Math.round(x + rand(-spread, spread)), Math.round(y + rand(-spread, spread) * 0.6), w, chance(0.5) ? 1 : w]); }
  groundPaint(x - spread - 2, y - spread - 2, x + spread + 2, y + spread + 2, g => { for (const r of R) { g.globalAlpha = r[0]; g.fillStyle = r[1]; g.fillRect(r[2], r[3], r[4], r[5]); } g.globalAlpha = 1; }); }
function splat(x, y, col, n = 6, spread = 7) { if (!ARENA) return; const R = []; for (let i = 0; i < n; i++) R.push([rand(0.35, 0.75), rand(0.8, 2.6), x + rand(-spread, spread), y + rand(-spread, spread) * 0.7]);
  groundPaint(x - spread - 3, y - spread - 3, x + spread + 3, y + spread + 3, g => { g.fillStyle = col; for (const [a, r, ex, ey] of R) { g.globalAlpha = a; g.beginPath(); g.ellipse(ex, ey, r, r * 0.75, 0, 0, TAU); g.fill(); } g.globalAlpha = 1; }); }
// a wet pixel where a drop of sweat landed: it darkens the stone and dries (on water there is nothing to darken: a ring instead)
// a wet pixel on the floor that dries in time; a glint is one catching the light (a puddle has a few); r: a soft wet
// patch of that size instead of a pixel (water darkens the floor a little, bluish)
function wetSpot(x, y, life = rand(7, 11), glint = false, r = 0) { if (ARENA && ARENA.pitN && pitAt(x, y)) return; if (ARENA && overWater(x, y)) { if (!glint && !r && chance(0.5)) plip(x, y); return; } FX.wet.push({ x: Math.round(x), y: Math.round(y), t: 0, life, glint, r }); if (FX.wet.length > 900) FX.wet.shift(); }
function drawWet(c) {
  for (const w of FX.wet) if (w.r) { const k = Math.min(1, (w.life - w.t) / 4); c.fillStyle = `rgba(${liq() ? liq().wet : '34,62,96'},${(liq() ? 0.3 : 0.17) * k})`; c.beginPath(); c.ellipse(w.x, w.y, w.r, w.r * 0.62, 0, 0, TAU); c.fill(); }
  for (const w of FX.wet) if (!w.r) { const k = Math.min(1, (w.life - w.t) / 3); c.fillStyle = w.glint ? `rgba(${liq() ? liq().glint : '200,232,255'},${0.55 * k})` : `rgba(${liq() ? liq().wet : '6,10,18'},${0.5 * k})`; c.fillRect(w.x, w.y, 1, 1); }
}
// --- floating combat numbers ---
function number(x, y, z, n, col, big, who = null) { FX.nums.push({ x: x + rand(-4, 4), y, z, vz: rand(50, 80), vx: rand(-12, 12), txt: String(n), col, big, t: 0, life: big ? 1.1 : 0.8, who }); if (FX.nums.length > 90) FX.nums.shift(); }
function textPop(x, y, z, txt, col, big = true, who = null) { FX.nums.push({ x, y, z, vz: 40, vx: 0, txt, col, big, t: 0, life: 1.4, who }); }
// how high the top of a unit's head is above the ground (its sprite's top row), so that what it says sits on its head
function headZ(u) { const p = spritePixels(u.spr); return u.z + (p.foot + 1 - p.top) * (u.scale || 1); }
// a mark that sits on a unit's head and goes where it goes ('!' when it notices you)
function markPop(u, txt, col, life = 1) { FX.nums.push({ on: u, dz: headZ(u) - u.z + 1, x: u.x, y: u.y, z: 0, vz: 0, vx: 0, txt, col, big: true, t: 0, life, who: u }); }
// a sleeper's z: out of its face, drifting up and away
function snore(u) { const s = u.scale || 1, lying = u.state === 'sleep' && !u.aware && !FLAT_SLEEPERS.has(u.spr); FX.nums.push({ x: u.x + u.face * (lying ? -spritePixels(u.spr).foot * 0.45 * s : 3 * s), y: u.y, z: lying ? 2 * s : headZ(u) - 4 * s, vz: rand(8, 12), vx: u.face * rand(4, 8), g: 0, txt: 'z', col: 'white', big: false, sz: 9, t: 0, life: 1.5, who: u }); }
// --- update everything ---
function updateFx(dt) {
  const P = FX.P;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
    if (p.k === 'gore') { goreStep(p, dt); continue; }
    if (p.k === 'hay') { hayStep(p, dt); continue; }
    if (p.k === 'chip' || p.k === 'ring' || p.k === 'patch' || p.k === 'arrowbit') { chipStep(p, dt); continue; }
    if (p.k === 'water') { waterStep(p, dt); continue; }
    if (p.k === 'pdust') { dustStep(p, dt); continue; }
    if (p.on) { const u = p.on; if (u.dead || (u.act && u.act.k === 'roll')) { p.on = null; p.g = 320; } else { p.row += p.rate * dt; placeDrop(p, u); if (p.row >= p.rowEnd) { p.on = null; p.g = 320; const out = p.side * (u.face < 0 ? -1 : 1); p.vx = (u.vx || 0) * 0.4 + out * rand(4, 10); p.vy = (u.vy || 0) * 0.4 + rand(2, 6); } continue; } } // a drop still running down the hero's head
    if (p.drag) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; if (!p.g) p.vz *= f; }
    if (p.bounce && p.z < 40 && !solidAt(p.x, p.y)) { // shards, sparks and gibs glance off the walls (a mark already inside a wall is left alone)
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if (solidAt(nx, p.y)) { p.vx = -p.vx * 0.45; p.vr = -p.vr; } else p.x = nx;
      if (solidAt(p.x, ny)) { p.vy = -p.vy * 0.45; p.vr = -p.vr; } else p.y = ny;
    } else { p.x += p.vx * dt; p.y += p.vy * dt; }
    if (p.g || p.vz) { p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 0 && p.g) { if (ARENA && ARENA.pitN && pitAt(p.x, p.y)) p.t = p.life; /* (down the pit) */ else if (p.k === 'drop') { wetSpot(p.x, p.y); p.t = p.life; } else if (p.bounce && p.vz < -25) { p.z = 0; p.vz = -p.vz * p.bounce; p.vx *= 0.55; p.vy *= 0.55; } else { p.z = 0; p.vz = 0; p.g = 0; p.vx *= 0.3; p.vy *= 0.3; } } }
    if (p.vr) p.rot += p.vr * dt;
  }
  for (const b of FX.bolts) { b.t += dt; b.regen -= dt; if (b.regen <= 0) { b.regen = 0.045; boltShape(b); } }
  removeIf(FX.bolts, b => b.t >= b.life);
  for (const L of [FX.rings, FX.arcs, FX.beams, FX.flights, FX.tele, FX.columns, FX.circles]) { for (const o of L) o.t += dt; removeIf(L, o => o.t >= o.life); }
  for (const g of FX.ghosts) g.t += dt; removeIf(FX.ghosts, g => g.t >= g.life); // afterimages fade on every phone, guests included
  for (const n of FX.nums) { n.t += dt; if (n.on) { n.x = n.on.x; n.y = n.on.y; n.z = n.on.z + n.dz; } else { n.z += n.vz * dt; n.vz -= (n.g === undefined ? 90 : n.g) * dt; n.x += n.vx * dt; } }
  removeIf(FX.nums, n => n.t >= n.life);
  for (const w of FX.wet) w.t += dt; removeIf(FX.wet, w => w.t >= w.life);
  for (const c of FX.cracks) {
    c.t += dt;
    if (ARENA) for (const s of c.segs) if (!s.p && c.t >= s.t0) { s.p = true; groundPaint(Math.min(s.x0, s.x1) - 3, Math.min(s.y0, s.y1) - 3, Math.max(s.x0, s.x1) + 3, Math.max(s.y0, s.y1) + 3, g => crackPx(g, s)); crackSlabs(s.x0, s.y0, s.x1, s.y1); if (chance(0.08)) { smoke(s.x1, s.y1, 1, 'dust', 8, 6, 1, 8); } }
  }
  removeIf(FX.cracks, c => c.t >= c.life);
  updateRocks(dt); updateBlood(); updateWake(dt);
}
// --- chunks: a sprite broken into pieces made of its own pixels, flung out, tumbling a quarter turn at a time (so the
// pixels stay whole), bouncing off the floor and the walls. Stone is left on the floor as rubble; flesh bleeds as it
// flies and where it lands, lies a few seconds and fades.
// D: pixel data ({ w, d }); sx,sy,sw,sh: the sprite in it; ox,oy: where its top left is drawn; gy: the floor line it
// stands on; n pieces. o: away (the angle the blow travelled: the pieces fly mostly that way), wait (seconds before they
// appear), spd, flip (drawn mirrored), edge (colours for the broken edges, else they are darkened), bleed (a blood kind),
// lie (seconds to lie before fading, instead of staying), slow (until this time the pieces move slowly), hay (they shed
// hay as they fly), tick (they click as they land)
function breakSprite(D, sx, sy, sw, sh, ox, oy, gy, n, o = {}) {
  const W = D.w, px = [], spd = o.spd || 1, edge = o.edge ? o.edge.map(hexRgb) : null;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const i = ((sy + y) * W + sx + (o.flip ? sw - 1 - x : x)) * 4; if (D.d[i + 3] > 128) px.push([x, y, i]); }
  if (!px.length) return;
  const seeds = [pick(px)]; while (seeds.length < Math.min(n, px.length)) { let best = null, bd = -1; for (let k = 0; k < 24; k++) { const q = pick(px), d = Math.min(...seeds.map(s => Math.hypot(s[0] - q[0], s[1] - q[1]))); if (d > bd) { bd = d; best = q; } } seeds.push(best); }
  // each pixel goes to its nearest seed, the borders a little rough (fixed noise, so not ragged)
  const owner = new Map(), key = (x, y) => y * 4096 + x, parts = seeds.map(() => []);
  for (const q of px) { let b = 0, bd = 1e9; seeds.forEach((s, k) => { const d = Math.hypot(s[0] - q[0], s[1] - q[1]) + NOISE[(q[0] * 7 + q[1] * 13 + k * 31) & 1023] * 0.8; if (d < bd) { bd = d; b = k; } }); owner.set(key(q[0], q[1]), b); parts[b].push(q); }
  const cx0 = sw / 2;
  parts.forEach((P, k) => {
    if (!P.length) return; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, cv = mkCanvas(w, h), g = cv.getContext('2d'), id = g.createImageData(w, h);
    for (const [x, y, i] of P) { // where it broke away from its neighbours it shows a raw edge
      const j = ((y - y0) * w + x - x0) * 4, cut = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const q = owner.get(key(x + a, y + b)); return q !== undefined && q !== k; });
      if (cut && edge) { const c = edge[(x * 3 + y * 5) % edge.length]; id.data[j] = c[0]; id.data[j + 1] = c[1]; id.data[j + 2] = c[2]; }
      else { const m = cut ? 0.62 : 1; id.data[j] = D.d[i] * m; id.data[j + 1] = D.d[i + 1] * m; id.data[j + 2] = D.d[i + 2] * m; }
      id.data[j + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    const rot = [cv]; for (let r = 1; r < 4; r++) { const s = rot[r - 1], q = mkCanvas(s.height, s.width), og = q.getContext('2d'); og.setTransform(0, 1, -1, 0, s.height, 0); og.drawImage(s, 0, 0); rot.push(q); }
    const mx = (x0 + x1 + 1) / 2, ground = gy + rand(-3, 2), dx = (mx - cx0) / cx0, up = 1 - y1 / sh, a = o.away === null || o.away === undefined ? rand(TAU) : o.away, v = rand(35, 75) * spd;
    FX.rocks.push({ rot, r: 0, x: ox + mx, y: ground, z: Math.max(0, ground - (oy + y1)), vx: dx * rand(40, 80) * spd + Math.cos(a) * v, vy: rand(-10, 30) * spd + Math.sin(a) * v * 0.7, vz: rand(50, 110) * spd + up * 60, spin: rand(0.06, 0.12), t: 0, wait: o.wait || 0, fade: 0, bleed: o.bleed, lie: o.lie, slow: o.slow || 0, hay: o.hay, tick: o.tick });
  });
  if (FX.rocks.length > 90) FX.rocks.splice(0, FX.rocks.length - 90);
}
// a chip knocked off a sprite: one small piece of its pixels from somewhere on it
function chipSprite(D, sx, sy, sw, sh, ox, oy, gy, away) {
  let x = 0, y = 0; for (let k = 0; k < 40; k++) { x = randi(1, sw - 5); y = randi(1, sh - 4); if (D.d[((sy + y) * D.w + sx + x) * 4 + 3] > 128) break; }
  breakSprite(D, sx + x, sy + y, randi(3, 4), 3, ox + x, oy + y, gy, 1, { away, spd: 0.8 });
}
function updateRocks(dt) {
  for (const r of FX.rocks) {
    if (r.wait > 0) { r.wait -= dt; continue; } r.t += dt; const sdt = r.slow > G.time ? dt * 0.15 : dt;
    if (r.fade) { r.fade += dt; if (r.fade > 0.5) r.done = true; continue; }
    if (r.lieT) { if (G.time - r.lieT > r.lie) r.fade = 0.001; continue; }
    if (r.sink) { r.sink += dt; if (r.sink > 0.7) r.done = true; continue; } // going down in the water
    const nx = r.x + r.vx * sdt, ny = r.y + r.vy * sdt; if (solidAt(nx, r.y)) r.vx = -r.vx * 0.4; else r.x = nx; if (solidAt(r.x, ny)) r.vy = -r.vy * 0.4; else r.y = ny;
    r.vz -= 480 * sdt; r.z += r.vz * sdt; const turn = () => { r.r = (r.r + (r.vx >= 0 ? 1 : 3)) % 4; };
    if (r.bleed && r.z > 1 && (r.dripT = (r.dripT || 0) + sdt) > 0.05) { r.dripT = 0; drip(r.x, r.y, r.z, r.bleed, r.vx * 0.3, r.vy * 0.3); }
    if (r.hay && r.z > 1 && (r.dripT = (r.dripT || 0) + sdt) > 0.06) { r.dripT = 0; hay(r.x, r.y, r.z, r.vx * 0.3, r.vy * 0.3, rand(0, 30), r.slow, r.hay === true ? null : r.hay, r.hay === true ? 0 : 2); } // a bundle sheds stalks as it flies
    if (r.z <= 0 && ARENA.pitN && pitAt(r.x, r.y)) { r.z = 0; r.sink = 0.001; continue; } // down a pit: it drops away out of sight
    if (r.z <= 0 && overWater(r.x, r.y)) { // into the water: a splash, rings, and it sinks (bleeding a red haze if it is flesh)
      r.z = 0; r.sink = 0.001; plip(r.x, r.y); plip(r.x + rand(-2, 2), r.y + rand(-1, 1)); for (let i = 0; i < 4; i++) water(r.x, r.y, 1, rand(-25, 25), rand(-18, 18), rand(40, 80));
      if (r.bleed) bloodCloud(r.x, r.y, pick(BLOOD[r.bleed]), 1.6); if (G.me && dist(G.me.x, G.me.y, r.x, r.y) < 220) SFX.splash(panOf(r.x), false); continue;
    }
    if (r.z <= 0) { r.z = 0; if (r.vz < -40) { r.vz = -r.vz * 0.3; r.vx *= 0.55; r.vy *= 0.55; turn(); if (r.bleed) bloodMark(r.x, r.y, 6, r.bleed), goreLand(r.x, r.y, { s0: 2, col: pick(BLOOD[r.bleed]), kind: r.bleed }); if (r.clang) SFX.clang(panOf(r.x)); if (r.tick) SFX.tick(panOf(r.x)); } else { r.vz = 0; const f = Math.exp(-9 * sdt); r.vx *= f; r.vy *= f; } }
    else if ((r.spin -= sdt) <= 0) { r.spin = rand(0.07, 0.13); turn(); }
    if ((r.z === 0 && r.vz === 0 && Math.hypot(r.vx, r.vy) < 3) || r.t > 4) { // still
      if ((r.clang || r.flat) && r.rot[r.r].width < r.rot[r.r].height) r.r = (r.r + 1) % 4; // a dropped weapon (or a bone) comes to rest lying flat, not on its point
      if (r.upright) r.r = 0; // a skull rolls to a stop the right way up
      if (r.lie) { r.lieT = G.time; if (r.bleed) pool(r.x, r.y, r.bleed, 1); continue; } // flesh lies a while, then fades
      // stone is left on the floor, unless it would lie across a wall
      const cv = r.rot[r.r], x = Math.round(r.x - cv.width / 2), y = Math.round(r.y - cv.height + 1);
      if ([[x, y], [x + cv.width - 1, y], [x, y + cv.height - 1], [x + cv.width - 1, y + cv.height - 1]].some(([a, b]) => solidAt(a, b))) r.fade = 0.001;
      else { groundPaint(x, y, x + cv.width, y + cv.height, g => g.drawImage(cv, x, y)); r.done = true; }
    }
  }
  removeIf(FX.rocks, r => r.done);
}
function drawRock(c, r) {
  if (r.wait > 0) return; const cv = r.rot[r.r], x = Math.round(r.x - cv.width / 2), y = Math.round(r.y - r.z - cv.height + 1);
  if (r.fade) c.globalAlpha = Math.max(0, 1 - r.fade / 0.5);
  if (r.sink) { const u = Math.min(1, r.sink / 0.7), h = cv.height, cut = Math.round(h * u); c.globalAlpha = 1 - u * 0.6; if (cut < h) c.drawImage(cv, 0, 0, cv.width, h - cut, x, y + cut, cv.width, h - cut); c.globalAlpha = 1; return; } // sinking: less of it above the water each frame
  if (r.z > 1) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(Math.round(r.x - cv.width / 2 + 1), Math.round(r.y), Math.max(1, cv.width - 2), 1); }
  c.drawImage(cv, x, y); c.globalAlpha = 1;
}
// --- drawing ---
const SPARK_PAL = { fire: ['#ffffff', '#fff1a8', '#ffa23a', '#ff4a18'], bolt: ['#ffffff', '#d8e8ff', '#88b0ff', '#4a6cff'], heal: ['#ffffff', '#d8ffe0', '#7cff9c', '#20c060'], arcane: ['#ffffff', '#f0d0ff', '#c070ff', '#7020d0'], white: ['#ffffff', '#ffffff', '#e0e0ff', '#9090c0'], gold: ['#ffffff', '#fff3c0', '#ffd060', '#c08020'], poison: ['#ffffff', '#e8ffc0', '#a0ff50', '#40a020'], crimson: ['#ffffff', '#ffb0bc', '#ff3a5a', '#a00020'], holy: ['#ffffff', '#fffbe0', '#ffe080', '#d0a030'] };
function drawWorldParts(ctx) { // normal blending: smoke, rubble, pixel shards (these get lit by the light map)
  for (const p of FX.P) {
    const k = p.k;
    if (k === 'smoke') { const u = p.t / p.life, s = p.s0 + (p.s1 - p.s0) * u; ctx.globalAlpha = p.a0 + (p.a1 - p.a0) * u; ctx.drawImage(SMOKE[p.col], p.x - s, p.y - p.z - s, s * 2, s * 2); }
    else if (k === 'spike') { const u = p.t / p.life, h = p.s0 * (u < 0.15 ? u / 0.15 : u > 0.7 ? (1 - u) / 0.3 : 1), w = p.s0 * 0.45; ctx.globalAlpha = 1; ctx.fillStyle = '#6b625a'; ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x + w * 0.2, p.y - h * 1.6); ctx.lineTo(p.x + w, p.y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#9a8c7c'; ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x + w * 0.2, p.y - h * 1.6); ctx.lineTo(p.x - w * 0.1, p.y); ctx.closePath(); ctx.fill(); }
    else if (k === 'gore') { ctx.globalAlpha = 1; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.s0, p.s0); }
    else if (k === 'water') { ctx.globalAlpha = 0.9; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.s0, p.s0); }
    else if (k === 'chip') { ctx.globalAlpha = 1; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.s0, 1); }
    else if (k === 'ring') { ctx.globalAlpha = 1; ctx.fillStyle = p.col; ringPx(Math.round(p.x), Math.round(p.y - p.z), (a, b) => ctx.fillRect(a, b, 1, 1)); } // (broken mail: 46_bits)
    else if (k === 'hay') { ctx.globalAlpha = 1; ctx.fillStyle = p.col; hayPx(p, (a, b) => ctx.fillRect(a, b, 1, 1)); }
    else if (k === 'arrowbit') { const cx = Math.cos(p.a), cy = Math.sin(p.a) * 0.6; ctx.globalAlpha = 1; for (let i = 0; i < 6; i++) { ctx.fillStyle = i === 0 ? ARROW_COL.head : i >= 4 ? ARROW_COL.fletch : ARROW_COL.shaft; ctx.fillRect(Math.round(p.x + cx * (2.5 - i)), Math.round(p.y - p.z + cy * (2.5 - i)), 1, 1); } } // (an arrow falling: 47_arrows)
    else if (k === 'vflame') { const u = p.t / p.life, s = u < 0.45 ? 2 : 1; ctx.globalAlpha = 1; ctx.fillStyle = u < 0.07 ? '#f4dcff' : u < 0.4 ? '#b060f0' : u < 0.7 ? '#8a34d6' : '#4c1878'; ctx.fillRect(Math.round(p.x + Math.sin(p.t * 22 + p.ph) * 1.2), Math.round(p.y - p.z), s, s + 1); } // (violet pixel flame: 49_deaths3 hexFlame)
    else if (k === 'patch') { ctx.globalAlpha = 1; patchPx(p, (a, b, col) => { ctx.fillStyle = col; ctx.fillRect(a, b, 1, 1); }); } // (the gambeson's quilted patches: 46_bits)
    else if (k === 'drop') { const left = p.life - p.t; ctx.globalAlpha = left < 0.25 ? left / 0.25 : 1; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y - p.z), 1, 1); } // one whole pixel, never smeared
    else if (k === 'debris' || k === 'pix') { const left = p.life - p.t; ctx.globalAlpha = left < 0.4 ? left / 0.4 : 1; ctx.fillStyle = p.col; const s = p.s0; ctx.fillRect(p.x - s / 2, p.y - p.z - s / 2, s, s * (k === 'debris' ? 0.75 : 1)); }
  }
  ctx.globalAlpha = 1;
}
function drawFxParts(ctx) { // additive: fire, glow, sparks, embers, glowing shards
  const buckets = {};
  for (const p of FX.P) {
    const k = p.k;
    if (k === 'glow' || k === 'ember') { const u = p.t / p.life; let a = p.a0 + (p.a1 - p.a0) * u; if (k === 'ember') a *= 0.55 + 0.45 * Math.sin(p.t * 34 + p.x); const s = p.s0 + (p.s1 - p.s0) * u; if (a < 0.02 || s < 0.1) continue; ctx.globalAlpha = a > 1 ? 1 : a; ctx.drawImage(GLOW[p.col], p.x - s, p.y - p.z - s, s * 2, s * 2); }
    else if (k === 'spark') { const h = Math.min(3, (p.t / p.life * 4) | 0), key = p.col + h; (buckets[key] || (buckets[key] = [])).push(p); }
    else if (k === 'pdust') drawDust(ctx, p);
    else if (k === 'pixa') { const u = p.t / p.life; ctx.globalAlpha = 1 - u; ctx.drawImage(GLOW[p.col], p.x - 2.5, p.y - p.z - 2.5, 5, 5); ctx.fillStyle = p.c2 || '#fff'; ctx.fillRect(p.x - p.s0 / 2, p.y - p.z - p.s0 / 2, p.s0, p.s0); }
  }
  ctx.globalAlpha = 1; ctx.lineCap = 'round';
  for (const key in buckets) {
    const L = buckets[key], h = +key.slice(-1), pal = SPARK_PAL[key.slice(0, -1)] || SPARK_PAL.fire; ctx.strokeStyle = pal[h]; ctx.lineWidth = h < 2 ? 1.1 : 0.8; ctx.beginPath();
    for (const p of L) { const sx = p.x, sy = p.y - p.z; ctx.moveTo(sx - p.vx * 0.03, sy - (p.vy - p.vz) * 0.03); ctx.lineTo(sx, sy); }
    ctx.stroke();
  }
}
function strokePts(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); }
function drawBolts(ctx) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const b of FX.bolts) {
    const u = b.t / b.life, flick = (b.t * 30 | 0) % 3 === 2 ? 0.35 : 1, a = (1 - u * u) * flick, c = COL[b.col] || COL.bolt;
    for (const [w, al, col] of [[7, 0.14, c], [3.4, 0.38, c], [1.3, 1, COL.white]]) {
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${al * a})`; ctx.lineWidth = w * b.w;
      strokePts(ctx, b.pts); ctx.lineWidth = w * b.w * 0.55; for (const br of b.br) strokePts(ctx, br);
    }
  }
}
function drawRings(ctx) {
  for (const r of FX.rings) {
    const u = r.t / r.life, e = 1 - (1 - u) * (1 - u) * (1 - u), R = r.r0 + (r.r1 - r.r0) * e, a = 1 - u;
    ctx.lineWidth = Math.max(0.5, r.w * (1 - u)); ctx.strokeStyle = rgba(r.col, a * 0.9); ctx.beginPath(); ctx.ellipse(r.x, r.y, R, R * 0.72, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = Math.max(0.4, r.w * 0.4 * (1 - u)); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.ellipse(r.x, r.y, R * 0.97, R * 0.7, 0, 0, TAU); ctx.stroke();
  }
  for (const s of FX.arcs) {
    const u = s.t / s.life, sweep = Math.min(1, u * 3), a0 = s.a - s.spread / 2, a1 = a0 + s.spread * sweep, al = 1 - u;
    ctx.lineCap = 'round'; ctx.lineWidth = s.w * (1 - u * 0.5); ctx.strokeStyle = rgba(s.col, al * 0.8); ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * 0.75, 0, a0, a1); ctx.stroke();
    ctx.lineWidth = s.w * 0.35; ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r * 0.94, s.r * 0.7, 0, a0 + s.spread * 0.15 * sweep, a1); ctx.stroke();
  }
  for (const b of FX.beams) {
    const u = b.t / b.life, a = b.steady ? 1 : u < 0.1 ? u / 0.1 : 1 - Math.max(0, (u - 0.85) / 0.15); ctx.lineCap = 'round';
    if (b.cap) { const s0 = b.w * 5, s1 = b.w * 4.5 * (0.85 + 0.15 * Math.sin(b.t * 70 + b.x1)); ctx.globalAlpha = a; ctx.drawImage(GLOW[b.col], b.x0 - s0, b.y0 - s0, s0 * 2, s0 * 2); ctx.drawImage(GLOW.white, b.x0 - s0 * 0.35, b.y0 - s0 * 0.35, s0 * 0.7, s0 * 0.7); ctx.drawImage(GLOW[b.col], b.x1 - s1, b.y1 - s1, s1 * 2, s1 * 2); ctx.drawImage(GLOW.hot, b.x1 - s1 * 0.4, b.y1 - s1 * 0.4, s1 * 0.8, s1 * 0.8); ctx.globalAlpha = 1; }
    for (const [w, al, c] of [[b.w * 3.2, 0.12, b.col], [b.w * 1.6, 0.35, b.col], [b.w * 0.6, 1, 'white']]) { ctx.lineWidth = w * (0.85 + 0.15 * Math.sin(b.t * 60)); ctx.strokeStyle = rgba(c, al * a); ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke(); }
  }
  for (const c of FX.columns) {
    const u = c.t / c.life, a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85, w = c.w * (1 + u * 0.4), gr = ctx.createLinearGradient(c.x - w, 0, c.x + w, 0), cc = COL[c.col];
    gr.addColorStop(0, `rgba(${cc},0)`); gr.addColorStop(0.5, `rgba(${(cc[0] + 255) >> 1},${(cc[1] + 255) >> 1},${(cc[2] + 255) >> 1},${a * 0.55})`); gr.addColorStop(1, `rgba(${cc},0)`);
    ctx.fillStyle = gr; ctx.fillRect(c.x - w, c.y - 260, w * 2, 262);
  }
  for (const c of FX.circles) { // summoning circles
    const u = c.t / c.life, a = Math.sin(Math.min(1, u * 1.2) * Math.PI) , R = c.r * (0.6 + 0.4 * Math.min(1, u * 3));
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1, 0.72); ctx.rotate(c.t * 3);
    ctx.strokeStyle = rgba(c.col, a); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, TAU); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= 5; i++) { const an = i * TAU * 2 / 5; i ? ctx.lineTo(Math.cos(an) * R * 0.7, Math.sin(an) * R * 0.7) : ctx.moveTo(Math.cos(an) * R * 0.7, Math.sin(an) * R * 0.7); } ctx.stroke();
    ctx.restore(); ctx.globalAlpha = a * 0.6; ctx.drawImage(GLOW[c.col], c.x - R * 1.4, c.y - R, R * 2.8, R * 2); ctx.globalAlpha = 1;
  }
}
function drawCrackGlow(ctx) {
  ctx.lineCap = 'round';
  for (const c of FX.cracks) {
    const heat = clamp(1 - (c.t - 0.2) / c.hot, 0, 1); if (heat <= 0) continue;
    for (const [w, al] of [[3, 0.22], [1, 0.9]]) { ctx.lineWidth = w; ctx.strokeStyle = rgba(al > 0.5 ? 'fire2' : c.col, al * heat); ctx.beginPath(); for (const s of c.segs) if (c.t >= s.t0) { ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x1, s.y1); } ctx.stroke(); }
  }
}
function drawTele(ctx) { // danger zones: normal blend, painted on the floor
  for (const t of FX.tele) { const u = t.t / t.life, p = 0.5 + 0.5 * Math.sin(t.t * 18); ctx.fillStyle = rgba(t.col, 0.12 + 0.18 * u); ctx.strokeStyle = rgba(t.col, 0.5 + 0.4 * p); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * 0.72, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * u, t.r * 0.72 * u, 0, 0, TAU); ctx.stroke(); }
}
