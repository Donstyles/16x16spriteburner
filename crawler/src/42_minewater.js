// ===================== THE FLOODED WORKINGS (the mines' water: 42_mines) =====================
// The mines' water is not the cellar's (a film three pixels deep nobody may step in, 36_works). It stands in whole
// galleries, over a man's head, and it is gone into: waded, then swum under, on one breath.
//
// A FLOOD is a set of floor tiles with a BED under them: every pixel of it has a height (0 the deepest, 1 the brim),
// low out in the open and rising to every shore (where its tiles meet floor that is not flooded), with slow swells of
// its own, so no bed is flat. The water has one LEVEL (1 full, 0 gone): a pixel is under water where the level stands
// over its bed, by as much as it does; a full flood is FLOOD.DEPTH pixels deep at its deepest. So a flood has shallows
// and deeps, its shore draws back as it drains (from the swells first, the hollows last, where puddles stay), and the
// same rule says how deep anyone stands in it. A wall's face standing over the water is under it as high as the water
// is deep at its foot.
//
// THE LOOK is the sheet's own: everything the sheet draws under water is its dry art under the water's blue
// (47, 127, 204) at half strength (its rocks, pillars and slabs in rows 22 to 31, its pool's floor: pixel for pixel).
// So the water is that blue laid over the floor (thinner in the shallows, a darker band over a man's depth, a pale line
// along the shore), and whatever stands or walks in it is laid over with the same blue from its waterline down, in its
// own pixels (drawWetThing): a wader's legs, a diver whole, a rock's foot. Where water has stood and gone the floor and
// the walls' feet stay dark with wet for a while.
const FLOOD = { DEPTH: 18, HEAD: 12, WADE: 2.5, RAMP: 22, WALL: 0.8, SHOAL: 0.74, LOW: 0.78, TURN: 11, Q: 120, col: [47, 127, 204], breath: 11, wet: 45 };
function minesFloods(A) { return (A && A.floods) || []; }
// a flood over these tiles (cells: a set of tile indices, all floor); o.level: how full it starts; o.drain: [px, py] its
// lowest point (where a drain would be), if any
function mkFlood(A, cells, o = {}) {
  const W = A.w, xs = [...cells].map(i => i % W), ys = [...cells].map(i => (i / W) | 0), tx0 = Math.min(...xs) - 1, ty0 = Math.min(...ys) - 2, tx1 = Math.max(...xs) + 1, ty1 = Math.max(...ys) + 1;
  const px0 = tx0 * TS, py0 = ty0 * TS, bw = (tx1 - tx0 + 1) * TS, bh = (ty1 - ty0 + 1) * TS, N = bw * bh, INF = 1e6;
  const tileOf = (x, y) => (ty0 + (y >> 4)) * W + tx0 + (x >> 4), wet = (x, y) => x >= 0 && y >= 0 && x < bw && y < bh && cells.has(tileOf(x, y));
  // how far each of its pixels is from a shore: floor beside it that is not flooded (a chamfer, two passes)
  const D = new Float32Array(N).fill(INF);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const t = tileOf(x, y); if (!cells.has(t) && FLOOR(A.fl[t])) D[y * bw + x] = 0; }
  const relax = (i, j, w) => { if (D[j] + w < D[i]) D[i] = D[j] + w; };
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const i = y * bw + x; if (!wet(x, y)) continue; if (x > 0) relax(i, i - 1, 1); if (y > 0) { relax(i, i - bw, 1); if (x > 0) relax(i, i - bw - 1, 1.41); if (x < bw - 1) relax(i, i - bw + 1, 1.41); } }
  for (let y = bh - 1; y >= 0; y--) for (let x = bw - 1; x >= 0; x--) { const i = y * bw + x; if (!wet(x, y)) continue; if (x < bw - 1) relax(i, i + 1, 1); if (y < bh - 1) { relax(i, i + bw, 1); if (x < bw - 1) relax(i, i + bw + 1, 1.41); if (x > 0) relax(i, i + bw - 1, 1.41); } }
  // the bed's own swells: smooth noise, a broad one and a finer one over it
  const sd = (Math.random() * 1e6) | 0, lat = (x, y, s) => { const gx = x / s, gy = y / s, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), h = (a, b) => hash2(a * 7 + sd, b * 13 + (sd >> 3)); return (h(ix, iy) * (1 - u) + h(ix + 1, iy) * u) * (1 - v) + (h(ix, iy + 1) * (1 - u) + h(ix + 1, iy + 1) * u) * v; };
  const H = new Uint8Array(N).fill(255), dr = o.drain || null;
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    if (!wet(x, y)) continue; const i = y * bw + x, X = px0 + x, Y = py0 + y, sw = 0.7 * lat(X, Y, 44) + 0.3 * lat(X + 300, Y + 170, 15);
    const ds = D[i] - 2 - 13 * lat(X + 77, Y + 31, 10) * lat(X + 9, Y + 140, 23) - 3 * lat(X + 40, Y + 9, 4); if (ds <= 0) continue; // (the brim: never a straight line along the tiles, a ragged edge a few pixels in)
    let d = Math.min(1, ds / FLOOD.RAMP) * (o.flat ? 0.93 + 0.07 * sw : 0.5 + 0.5 * Math.min(1, sw * 1.35));
    for (const [sx, sy, sr, st = FLOOD.SHOAL] of o.shoals || []) { const q = Math.hypot(X - sx, (Y - sy) * 1.25) / sr * (0.82 + 0.36 * lat(X + 11, Y + 5, 11)); if (q < 1.6) d = Math.min(d, st + (1 - st) * clamp((q - 0.8) / 0.8, 0, 1) + 0.03 * (sw - 0.5)); } // (a shoal: a rise in the bed, its top flat: under a full flood's dark, out of it once the water is down a fifth) // (how deep, of the full depth: nothing at a shore, half to all of it out in the open)
    if (dr && !o.shoals) d = Math.max(d, Math.min(1, ds / 10) * Math.max(0, 1 - Math.hypot(X - dr[0], (Y - dr[1]) * 1.3) / 34)); // (its lowest hollow, round the drain)
    if (D[i] > 2 && !o.flat) { let k = 99; for (let j = 1; j <= 10 && y - j >= 0; j++) if (!wet(x, y - j)) { if (A.fl[tileOf(x, y - j)] === 0) k = j; break; } if (k < 99) d = FLOOD.WALL + (d - FLOOD.WALL) * Math.max(0, (k - 3) / 7); } // (level along a north wall's foot: its waterline runs straight)
    H[i] = Math.round((1 - Math.max(0.02, d)) * 255);
  }
  // the walls' feet: a face over a flooded tile is under water as high as the water is deep at its foot
  for (let x = 0; x < bw; x++) for (let y = 1; y < bh; y++) { if (!wet(x, y) || wet(x, y - 1)) continue; const t = tileOf(x, y - 1); if (A.fl[t] !== 0) continue; const h0 = H[y * bw + x]; for (let k = 1; k <= FLOOD.DEPTH && y - k >= 0; k++) H[(y - k) * bw + x] = Math.min(255, h0 + Math.round(k * 255 / FLOOD.DEPTH)); }
  const f = { cells, px0, py0, bw, bh, H, level: o.level === undefined ? 1 : o.level, to: o.level === undefined ? 1 : o.level, hi: o.level === undefined ? 1 : o.level, rate: 0.14, q: -1, dampA: 0, drain: dr, room: o.room, cv: mkCanvas(bw, bh), wetCv: mkCanvas(bw, bh), i: (A.floods = A.floods || []).length, glintN: Math.max(6, Math.round(cells.size * 0.5)), t: 0 };
  A.floods.push(f); if (!A.floodAt) A.floodAt = new Int16Array(A.w * A.h); for (const i of cells) A.floodAt[i] = f.i + 1;
  return f;
}
// how deep the water stands at a point, in pixels (0: none)
function depthPx(x, y) {
  const A = ARENA; if (!A || !A.floodAt) return 0; const tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return 0; const k = A.floodAt[ty * A.w + tx]; if (!k) return 0;
  const f = A.floods[k - 1], X = Math.floor(x) - f.px0, Y = Math.floor(y) - f.py0; if (X < 0 || Y < 0 || X >= f.bw || Y >= f.bh) return 0; const w = f.level * 255 - f.H[Y * f.bw + X]; return w > 0 ? w / 255 * FLOOD.DEPTH : 0;
}
const floodOf = (x, y) => { const A = ARENA; if (!A || !A.floodAt) return null; const k = A.floodAt[Math.floor(y / TS) * A.w + Math.floor(x / TS)]; return k ? A.floods[k - 1] : null; };
// the water as it stands (its picture, made again whenever the level has moved a step), and the wet it has left
function floodPaint(f) {
  const q = Math.round(f.level * FLOOD.Q); if (q === f.q) return; f.q = q; const L = q / FLOOD.Q * 255, hi = f.hi * 255, N = f.bw * f.bh, H = f.H, [r, g, b] = FLOOD.col;
  const cx = f.cv.getContext('2d'), id = cx.createImageData(f.bw, f.bh), d = id.data, wx = f.wetCv.getContext('2d'), wd = wx.createImageData(f.bw, f.bh), e = wd.data, px = 255 / FLOOD.DEPTH;
  const bw = f.bw, dry = j => j < 0 || j >= N || (H[j] !== 255 && L - H[j] <= 0);
  for (let i = 0; i < N; i++) {
    const h = H[i]; if (h === 255) continue; const w = L - h, o = i * 4;
    if (w <= 0) { if (h < hi) { e[o] = 26; e[o + 1] = 18; e[o + 2] = 14; e[o + 3] = 255; } continue; }
    if (dry(i - 1) || dry(i + 1) || dry(i - bw) || dry(i + bw)) { d[o] = 168; d[o + 1] = 202; d[o + 2] = 228; d[o + 3] = 150; } // the shore: one pale pixel where it meets the dry
    else if (w < px * FLOOD.HEAD) { d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 127; } // the sheet's water: to a man's chin
    else { d[o] = 34; d[o + 1] = 100; d[o + 2] = 176; d[o + 3] = 152; } // over his head: a darker band
  }
  cx.putImageData(id, 0, 0); wx.putImageData(wd, 0, 0);
}
function drawFloods(c, rect) {
  const A = ARENA; if (!A || !A.floods) return; const [vx, vy, vw, vh] = rect || viewRect(A);
  for (const f of A.floods) {
    if (f.px0 > vx + vw || f.px0 + f.bw < vx || f.py0 > vy + vh || f.py0 + f.bh < vy) continue; floodPaint(f);
    if (f.dampA > 0.01) { c.globalAlpha = f.dampA; c.drawImage(f.wetCv, f.px0, f.py0); c.globalAlpha = 1; }
    if (f.level > 0.004) c.drawImage(f.cv, f.px0, f.py0);
    if (rect || f.level <= 0.02) continue;
    // glints: a pixel of light here and there on it, each for a moment
    const L = f.level * 255, T = G.time * 1.6; c.fillStyle = 'rgba(214,234,248,0.75)';
    for (let k = 0; k < f.glintN; k++) { const ph = T + k * 0.618, s = Math.floor(ph), u = ph - s; if (u > 0.3) continue; const x = (hash2(k * 31 + 7, s * 17 + f.i) * f.bw) | 0, y = (hash2(k * 13 + 3, s * 29 + 11) * f.bh) | 0; if (L - f.H[y * f.bw + x] < 30) continue; c.fillRect(f.px0 + x, f.py0 + y, u < 0.15 ? 2 : 1, 1); }
  }
}
// ---- what stands or walks in it, drawn in its own pixels: under the water's blue from its waterline down
let WCV = null;
function drawWetThing(c, x, y, D, draw, full) {
  FLOOD.wn = (FLOOD.wn || 0) + 1; if (!WCV) WCV = mkCanvas(144, 144); const g = WCV.getContext('2d'), ox = Math.round(x) - 72, oy = Math.round(y) - 116;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, 144, 144); g.imageSmoothingEnabled = false; g.setTransform(1, 0, 0, 1, -ox, -oy);
  draw(g);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 1; const foot = Math.round(y) - oy, wl = full ? 0 : Math.max(0, foot - Math.round(D));
  g.fillStyle = full ? 'rgba(42,116,192,0.56)' : 'rgba(47,127,204,0.5)'; g.fillRect(0, wl, 144, foot + 2 - wl);
  if (!full) { g.fillStyle = 'rgba(206,230,246,0.7)'; g.fillRect(0, wl, 144, 1); } // (the waterline across it)
  g.globalCompositeOperation = 'source-over'; c.drawImage(WCV, ox, oy);
}
// a prop standing in the water: it does not move, so its tinted picture is kept (a small canvas of its own) and made again
// only when the water's depth at it changes by a pixel, or it does (struck and flashing, its tile changed, moved)
function drawWetProp(c, p, D) {
  if ((p.flashUntil || 0) > G.time || p.jx || p.candles || p.kind === 'font') { p.wetK = null; drawWetThing(c, p.x, p.y, D, g => drawPropRaw(g, p), false); return; }
  const key = Math.round(D) + '|' + p.x + '|' + p.y + '|' + (p.tile ? p.tile[0] * 64 + p.tile[1] : 0) + '|' + (p.th || 1) + '|' + (p.open ? 1 : 0) + (p.hits || 0) + '|' + (p.hp | 0);
  if (p.wetK !== key) { p.wetK = key; if (!p.wetCv) p.wetCv = mkCanvas(96, 112); const g = p.wetCv.getContext('2d'), ox = Math.round(p.x) - 48, oy = Math.round(p.y) - 96;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, 96, 112); g.imageSmoothingEnabled = false; g.setTransform(1, 0, 0, 1, -ox, -oy); drawPropRaw(g, p);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; const foot = Math.round(p.y) - oy, wl = Math.max(0, foot - Math.round(D));
    g.fillStyle = 'rgba(47,127,204,0.5)'; g.fillRect(0, wl, 96, foot + 2 - wl); g.fillStyle = 'rgba(206,230,246,0.7)'; g.fillRect(0, wl, 96, 1); g.globalCompositeOperation = 'source-over'; }
  c.drawImage(p.wetCv, Math.round(p.x) - 48, Math.round(p.y) - 96);
}
// ---- into the water: everyone's depth, the wading and the going under, the breath
const swims = u => !!(u.def && u.def.swims);
function floodUnits(dt) {
  const A = ARENA; if (!A.floods) return;
  for (const u of G.units) {
    if (u.fall || u.enter) continue; const D = u.fly && !u.dead ? 0 : depthPx(u.x, u.y), was = u.wd || 0, head = FLOOD.HEAD * (u.scale || 1); u.wd = D; const sub = D >= (u.low || head) && (u.z || 0) < 4, /* (low: what lies low in it, the sump's drake) */ wasSub = !!u.sub; u.sub = sub;
    if (u.dead) continue;
    if (D >= 1 && was < 1) { splash(u.x, u.y, 2, 5, { spd: 0.5 }); SFX.splash(panOf(u.x)); }
    if (sub !== wasSub) { ring(u.x, u.y - head, 11, 'bolt', 0.45, 1, 3); splash(u.x, u.y - head, 3, sub ? 8 : 6, { spd: 0.6 }); SFX.splash(panOf(u.x), sub); }
    const mv = Math.hypot(u.vx, u.vy) + Math.hypot(u.kx, u.ky);
    const seen = inView(u.x, u.y, 60);
    if (seen && D >= FLOOD.WADE && !sub && mv > 8) { u.ripT = (u.ripT || 0) - dt; if (u.ripT <= 0) { u.ripT = 0.28; ring(u.x, u.y - D, 6 + u.r, 'bolt', 0.45, 1, u.r * 0.6); if (chance(0.4)) water(u.x + rand(-3, 3), u.y, D + 1, rand(-14, 14), rand(-8, 8), rand(20, 46)); } }
    if (seen && sub && chance(dt * (u.team === 'hero' ? 2.2 : 1.1))) part({ k: 'glow', x: u.x + rand(-2, 2), y: u.y, z: head - 2 + rand(-2, 2), vx: rand(-3, 3), vy: 0, vz: rand(10, 18), drag: 0.6, life: rand(0.5, 0.9), s0: rand(0.5, 0.9), s1: 0.3, col: 'bolt2', a0: 0.5, a1: 0 }); // bubbles
    if (D >= 4 && u.fireT > 0) { u.fireT = 0; smoke(u.x, u.y - D, 3, 'breath', 8, 14, 0.9, 16); SFX.sizzle(panOf(u.x)); } // (the water puts the fire out: 42_magma)
    if (u.team !== 'hero') { if (sub && !swims(u) && !u.boss) { u.cdT = Math.max(u.cdT || 0, 0.6); u.drownT = (u.drownT || 0) + dt; if (u.drownT >= 2.5) { u.drownT = 2; u.hp -= Math.max(1, u.maxHp * 0.04); u.flash = 0.08; for (let i = 0; i < 4; i++) part({ k: 'glow', x: u.x + rand(-3, 3), y: u.y, z: head + rand(-3, 1), vx: rand(-8, 8), vy: 0, vz: rand(14, 26), drag: 0.6, life: rand(0.5, 0.9), s0: rand(0.7, 1.2), s1: 0.3, col: 'bolt2', a0: 0.6, a1: 0 }); if (u.hp <= 0) { ring(u.x, u.y - head, 14, 'white', 0.6, 2, 3); kill(u, null); } } } else u.drownT = 0; continue; } // (out of its depth: it flounders, lands no blow, and drowns)
    // a hero's breath: gone in FLOOD.breath seconds under, back in one and a half above; with none left the water takes his life
    if (u.breath === undefined) u.breath = 1;
    if (sub) { u.breath = Math.max(0, u.breath - dt / FLOOD.breath); if (u.breath <= 0) { u.drownT = (u.drownT || 0) + dt; if (u.drownT >= 0.5) { u.drownT = 0; const d = Math.max(1, Math.round(u.maxHp * 0.04)); if (!godOn()) u.hp -= d; u.flash = 0.1; number(u.x, u.y, headZ(u) + 1, d, 'red', false, u); for (let i = 0; i < 5; i++) part({ k: 'glow', x: u.x + rand(-3, 3), y: u.y, z: head + rand(-3, 1), vx: rand(-8, 8), vy: 0, vz: rand(14, 26), drag: 0.6, life: rand(0.5, 0.9), s0: rand(0.7, 1.2), s1: 0.3, col: 'bolt2', a0: 0.6, a1: 0 }); if (u.hp <= 0) { if (godOn()) u.hp = 1; else kill(u, null); } } } }
    else { if (u.breath < 0.25 && wasSub) { SFX.splash(panOf(u.x)); for (let i = 0; i < 4; i++) sweat(u); } u.breath = Math.min(1, u.breath + dt / 1.5); u.drownT = 0; }
  }
  if (G.me) SFX.muffle(!!G.me.sub && !G.me.dead);
}
// how fast anyone goes in it: waders slower the deeper, divers at six tenths; what swims goes faster in it than out
function waterDrag(u) { const D = u.wd || 0; if (D < FLOOD.WADE || u.fly) return 1; if (swims(u)) return 1.25; return u.sub ? (u.team === 'hero' ? 0.6 : 0.38) : Math.max(0.62, 1 - 0.036 * D); }
// the levels: each flood moving to where it has been sent (floodSend), the wet it leaves drying
function floodsTick(dt) {
  const A = ARENA; if (!A || !A.floods) return;
  for (const f of A.floods) {
    f.t += dt;
    if (f.level !== f.to) { const d = f.rate * dt, up = f.to > f.level; f.level = up ? Math.min(f.to, f.level + d) : Math.max(f.to, f.level - d); if (f.level > f.hi) f.hi = f.level; f.dampA = 0.34; f.dampT = 0; f.moving = true;
      if (f.drain && !up && f.level > 0.03) { const [x, y] = f.drain; if (chance(dt * 5)) ring(x, y, rand(5, 13), 'bolt', 0.7, 1, 2); if (chance(dt * 8)) part({ k: 'glow', x: x + rand(-5, 5), y: y + rand(-3, 3), z: 1, vx: 0, vy: 0, vz: rand(6, 14), life: 0.5, s0: 0.8, s1: 0.2, col: 'bolt2', a0: 0.5, a1: 0 }); }
      if (f.level === f.to) { f.moving = false; if (f.done) { const fn = f.done; f.done = null; fn(f); } } }
    for (const pl of f.valves || []) if (!pl.down && inView(pl.x, pl.y, 40) && depthPx(pl.x, pl.y) > 5 && chance(dt * 7)) part({ k: 'glow', x: pl.x + rand(-2, 2), y: pl.y + rand(-1, 1), z: rand(0, 3), vx: rand(-2, 2), vy: 0, vz: rand(12, 20), drag: 0.4, life: rand(0.7, 1.1), s0: rand(0.5, 1), s1: 0.3, col: 'bolt2', a0: 0.55, a1: 0 }); // (a valve under water: a thread of bubbles)
    if (f.level !== f.to) { /* (moving: above) */ } else if (f.dampA > 0) { f.dampT = (f.dampT || 0) + dt; if (f.dampT > 6) f.dampA = Math.max(0.1, 0.34 - (f.dampT - 6) / FLOOD.wet * 0.24); } // (it dries to a faint stain, which stays)
  }
  floodUnits(dt);
}
function floodSend(f, to, done, rate) { f.to = clamp(to, 0, 1); if (rate) f.rate = rate; f.done = done || null; if (f.to !== f.level) SFX.drain(panOf(f.px0 + f.bw / 2)); }
// over everyone: a hero's breath, a small bar over his head while it is short
function drawFloodsOver(c) {
  const A = ARENA; if (!A || !A.floods) return;
  for (const h of G.heroes) { if (h.dead || h.breath === undefined || h.breath >= 0.999) continue; const w = 14, x = Math.round(h.x - w / 2), y = Math.round(h.y - headZ(h) - 7), low = h.breath < 0.28 && ((G.time * 6) | 0) % 2;
    c.fillStyle = 'rgba(6,10,18,0.8)'; c.fillRect(x - 1, y - 1, w + 2, 4); c.fillStyle = low ? '#ff5a48' : '#9fd8ff'; c.fillRect(x, y, Math.round(w * h.breath), 2); }
}
// a valve stood on: its flood goes where the valve sends it; a door the water held opens when it is gone
function floodValve(pl) { const f = pl.flood; logEv('valve', { at: pl.tx + ',' + pl.ty, to: pl.to || 0 }); shake(0.12); if (f.onValve) f.onValve(f, pl); floodSend(f, pl.to || 0, () => { if (f.gate && !f.gate.going && f.level <= 0.02) startGateCine(pl, f.gate); }, 0.12); }
// a sluice stood on that will not turn against the water over it: it judders, groans and lets a burst of bubbles go
function valveStuck(pl, dt) {
  pl.stuckT = (pl.stuckT || 0) - dt; pl.f = ((G.time * 14) | 0) % 2; if (pl.stuckT > 0) return; pl.stuckT = 0.7; SFX.stone(panOf(pl.x), false); shake(0.05);
  for (let i = 0; i < 9; i++) part({ k: 'glow', x: pl.x + rand(-6, 6), y: pl.y + rand(-3, 3), z: rand(0, 4), vx: rand(-10, 10), vy: 0, vz: rand(16, 30), drag: 0.6, life: rand(0.6, 1), s0: rand(0.7, 1.3), s1: 0.3, col: 'bolt2', a0: 0.6, a1: 0 });
}
