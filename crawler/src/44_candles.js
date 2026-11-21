// ===================== candles: the crypt's light =====================
// A candle is not part of the picture it stands in. Every candle on the crypt sheet (a tomb's, a niche's) is read off its
// tile at load, where it stands and how big (the sheet's three candle colours: the lit top, the wax and its shade), and the
// tile is kept without it (the same tomb without candles where the sheet has one, else the candle painted out with what
// lies beside it). From then on each candle is its own:
//   it stands its own height (as drawn, or a pixel shorter, by its place) and burns down a pixel at a time over minutes
//   its flame flickers, two pixels or one, and leans; wax runs down its side now and then and pools at its foot
//   a blow that passes over it puts it out: a thread of smoke, the wick dark; a blow that only passes near makes it gutter
//   when the hero runs or rolls past it, its flame gutters hard, leaning away from him; so it does when the Shade goes by
//   (43_crypt), though nothing else shows where it is; and near a cracked wall it leans toward the cracks, now and then,
//   pulled by the draught from the hidden way behind them: the flames point at what the walls hide
//   burnt down, it sputters a few breaths and goes out, a stub in its wax
// The niches that light a crypt room hold three candles each (A.torches: the niche gives as much light as its candles
// still burning), and every other lit candle lights a little round itself (70_render). Nothing here is left to chance:
// what differs from candle to candle follows from where it stands (hash2).

const CANDLE_RGB = new Set([0xe5dfa0, 0xc6c076, 0xb2ae7c]);
const WAX = { lit: '#e5dfa0', wax: '#c6c076', shade: '#b2ae7c', wick: '#3a2f20', stub: '#9c9868' };
const CANDLE_SRC = {};
// the candles in the sheet's rect (sx, sy, w, h), and the piece without them (tw: where the sheet has it so, else painted out)
function candleSrc(sx, sy, w, h, tw) {
  const key = [sx, sy, w, h, tw ? tw.join(':') : ''].join(); if (CANDLE_SRC[key]) return CANDLE_SRC[key];
  const P = PIX.crypt, rgb = (x, y) => { const i = (y * P.w + x) * 4; return P.d[i + 3] ? (P.d[i] << 16) | (P.d[i + 1] << 8) | P.d[i + 2] : -1; };
  const m = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (CANDLE_RGB.has(rgb(sx + x, sy + y))) m[y * w + x] = 1;
  const list = [], seen = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!m[i] || seen[i]) continue; let x0 = 99, x1 = -1, y0 = 99, y1 = -1; const q = [i]; seen[i] = 1;
    while (q.length) { const k = q.pop(), x = k % w, y = (k / w) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, n = ny * w + nx; if (nx >= 0 && ny >= 0 && nx < w && ny < h && m[n] && !seen[n]) { seen[n] = 1; q.push(n); } } }
    list.push({ x: x0, y0, y1, w: x1 - x0 + 1 });
  }
  const cv = mkCanvas(w, h), g = cv.getContext('2d');
  if (tw) g.drawImage(IMG.crypt, tw[0], tw[1], w, h, 0, 0, w, h);
  else {
    g.drawImage(IMG.crypt, sx, sy, w, h, 0, 0, w, h); const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { // (painted out: the nearest pixel beside it on its row that is no candle)
      if (!m[y * w + x]) continue; let s = -1;
      for (let k = 1; k < w && s < 0; k++) for (const xx of [x - k, x + k]) if (xx >= 0 && xx < w && !m[y * w + xx] && d[(y * w + xx) * 4 + 3]) { s = (y * w + xx) * 4; break; }
      const o = (y * w + x) * 4; if (s < 0) d[o + 3] = 0; else for (let c = 0; c < 4; c++) d[o + c] = d[s + c];
    }
    g.putImageData(id, 0, 0);
  }
  return (CANDLE_SRC[key] = { cv, list });
}
// the candles of a piece set down with its top left at ox, oy; gy: the floor line a blow must reach to put them out;
// life: about how many seconds they burn (each its own, by its place)
function addCandles(A, src, ox, oy, gy, life, o = {}) { // (o.wall: drawn with the ground; o.torch: a room's light niche, lit as one: 70_render)
  const out = [];
  for (const s of src.list) {
    const x = ox + s.x, yb = oy + s.y1, H = s.y1 - s.y0 + 1, u = hash2(x * 7 + 3, yb * 13 + 1), v = hash2(yb * 5 + 11, x * 3 + 7), h0 = Math.max(2, H - (u < 0.4 ? 1 : 0));
    const c = { x, yb, w: s.w, h0, wax: h0, lit: true, rate: h0 / (60 + 120 * v), drips: [], pool: 0, dripT: 4 + 8 * u, gust: 0, ph: u * 40, gy, sput: 0, smokeT: 0, torch: !!o.torch, started: false }; // (burnt down one to three minutes, by its place, from when the hero first comes into its room: candlesTick)
    out.push(c); (A.candles = A.candles || []).push(c); if (o.wall) (A.wallCandles = A.wallCandles || []).push(c);
  }
  if (out.length) (A.cgroups = A.cgroups || []).push({ list: out, x: ox + (src.cv ? src.cv.width : TS) / 2, y: gy, wall: !!o.wall || !!o.torch }); // (each lot of candles, lit again together: 43_crypt relightTick)
  return out;
}
function snuff(c, quiet) { if (!c.lit) return; c.lit = false; c.smokeT = 1.6; if (ARENA) ARENA.lights = ARENA.slit = null; if (!quiet) { smoke(c.x + c.w / 2, c.yb - c.wax - 1, 1, 'grey', 2, 6, 0.6, 14); if (SFX.puff) SFX.puff(panOf(c.x)); } }
function candlesTick(dt) {
  const A = ARENA; if (!A || !A.candles) return; const h = G.me; if (h && !h.dead) { const hr = roomAt(h.x, h.y); if (hr) hr.entered = true; }
  const rush = h && !h.dead && (h.sprint || (h.act && h.act.k === 'roll'));
  const shades = A.th.sheet === 'crypt' ? G.foes.filter(f => f.shade && !f.dead && Math.hypot(f.vx || 0, f.vy || 0) > 6) : []; // (the Shade's passing: a cold draught the flames show, though nothing else does)
  for (const c of A.candles) {
    c.gust = Math.max(0, c.gust - dt * 1.6); if (c.smokeT > 0) c.smokeT -= dt;
    if (!c.lit) continue;
    if (h && !h.dead) { const d = Math.hypot(h.x - (c.x + c.w / 2), (h.y - c.gy) * 1.4); if (d < 34) c.gust = Math.max(c.gust, rush ? 1 - d / 60 : h.moving ? 0.25 * (1 - d / 34) : 0); c.lean = Math.sign(c.x - h.x) || 1; }
    if (c.draft === undefined) { const k = (A.cracks || []).find(k => Math.abs((k.x + 1.5) * TS - (c.x + c.w / 2)) < 72 && Math.abs((k.y + 1) * TS - c.yb) < 44); c.draft = k ? Math.sign((k.x + 1.5) * TS - (c.x + c.w / 2)) || 1 : 0; c.draftK = k; } // (a cracked wall near: the draught from what lies behind it)
    if (c.draft && !c.draftK.open) { const n = noise1(G.time * 3 + c.ph); if (n > -0.2) { c.gust = Math.max(c.gust, 0.5 + 0.35 * n); c.lean = c.draft; } }
    for (const S of shades) { const d = Math.hypot(S.x - (c.x + c.w / 2), (S.y - c.gy) * 1.4); if (d < 64) { c.gust = Math.max(c.gust, 0.95 * (1 - d / 64) + 0.3); c.lean = Math.sign(c.x - S.x) || 1; } }
    if (!c.started) { if (c.room === undefined) c.room = roomAt(c.x + c.w / 2, c.gy + 2) || null; if (c.room ? c.room.entered : h && Math.hypot(h.x - (c.x + c.w / 2), h.y - c.gy) < 130) c.started = true; } // (a room's candles start to burn down when the hero first comes in; a corridor's as he comes near)
    if (c.wax > 0) { if (c.started && !(c.hold && !c.hold.done)) { c.wax = Math.max(0, c.wax - c.rate * dt); if (c.wax === 0) c.sput = 2.6; } } // (hold: a vigil's niches burn only once its gate is open)
    else if ((c.sput -= dt) <= 0) { snuff(c); continue; } // (burnt down: it sputters a while, then it is out)
    if ((c.dripT -= dt) <= 0 && c.wax >= 2) { c.dripT = 6 + 9 * hash2(c.x + c.drips.length, c.yb + c.pool); c.drips.push({ side: (c.drips.length + c.pool) % 2, y: c.yb - Math.ceil(c.wax) + 1 }); }
    for (const d of c.drips) d.y += dt * 2.5;
    for (const d of c.drips) if (d.y >= c.yb) { c.pool = Math.min(4, c.pool + 1); d.done = true; }
    if (c.drips.length) c.drips = c.drips.filter(d => !d.done);
  }
  for (const t of A.torches) if (t.candles) { const n = t.candles.filter(c => c.lit).length, cf = n / t.candles.length; if (cf !== t.cf) { t.cf = cf; A.lights = A.slit = null; } t.out = !n; }
}
// a blow: every lit candle it passes over goes out; those it only passes near gutter
function candleBlow(src, mv, dir) {
  const A = ARENA; if (!A || !A.candles) return;
  for (const c of A.candles) {
    if (!c.lit) continue; const tgt = { x: c.x + c.w / 2, y: c.gy, r: 4 };
    if (hitsShape(src, tgt, mv, dir)) snuff(c); else if (Math.hypot(src.x - tgt.x, src.y - tgt.y) < (mv.reach || 20) + 14) c.gust = Math.max(c.gust, 0.7);
  }
}
// drawn where the piece is drawn (a niche's with the ground, a tomb's with the tomb)
function drawCandles(c, list, cull) { // (cull: only those near the view; the wall's, drawn each frame from the whole floor's list)
  for (const k of list) { if (cull && (Math.abs(k.x - CAM.x) > 340 || Math.abs(k.yb - CAM.y) > 240)) continue;
    const top = k.yb - Math.ceil(k.wax) + 1; // (the wax's top row)
    for (let i = 0; i < k.pool; i++) { c.fillStyle = WAX.wax; c.fillRect(i % 2 ? k.x + k.w + (i >> 1) : k.x - 1 - (i >> 1), k.yb, 1, 1); } // its pool
    if (k.wax > 0) for (let y = top; y <= k.yb; y++) for (let x = 0; x < k.w; x++) { c.fillStyle = y === top && k.lit ? WAX.lit : x === k.w - 1 && k.w > 1 ? WAX.shade : WAX.wax; c.fillRect(k.x + x, y, 1, 1); }
    else { c.fillStyle = WAX.stub; c.fillRect(k.x, k.yb, k.w, 1); }
    for (const d of k.drips) { c.fillStyle = WAX.lit; c.fillRect(d.side ? k.x + k.w : k.x - 1, Math.min(k.yb, Math.round(d.y)), 1, 1); }
    const fx = k.x + ((k.w - 1) >> 1), fy = (k.wax > 0 ? top : k.yb) - 1;
    if (!k.lit) { c.fillStyle = WAX.wick; c.fillRect(fx, fy + 1, 1, 1); continue; }
    // the flame: a hot core and a tip that comes and goes; leaning and guttering in a draught; sputtering at the end
    const n = noise1(G.time * 11 + k.ph), g = k.gust, sp = k.wax <= 0;
    if (sp && Math.sin(G.time * 31 + k.ph) > 0.2) continue;
    const lean = g > 0.45 ? (k.lean || 1) * (n > 0 ? 1 : 0) : 0, tall = !sp && g < 0.6 && n > -0.35;
    c.fillStyle = g > 0.7 && n > 0.2 ? '#ffb85a' : '#fff4c4'; c.fillRect(fx + (g > 0.8 ? lean : 0), fy, 1, 1);
    if (tall) { c.fillStyle = n > 0.5 ? '#ffd870' : '#ffc456'; c.fillRect(fx + lean, fy - 1, 1, 1); }
  }
}
// a room made dark puts its niches' candles out; lit again (a rite, a puzzle's reward), they burn anew
function torchCandles(t, on) { for (const c of t.candles || []) if (on) { c.lit = true; c.wax = Math.max(c.wax, c.h0 * 0.7); c.sput = 0; } else snuff(c, true); }
// its glow (the glow layer) and its light (the light map)
function drawCandleGlows(c) {
  const A = ARENA; if (!A || !A.candles) return;
  for (const k of A.candles) { if (!k.lit || Math.abs(k.x - CAM.x) > 300 || Math.abs(k.yb - CAM.y) > 200) continue; const f = 0.75 + 0.25 * noise1(G.time * 9 + k.ph) - 0.35 * k.gust; c.globalAlpha = Math.max(0.1, 0.3 * f); c.drawImage(GLOW.torch, k.x + k.w / 2 - 3, k.yb - k.wax - 5, 6, 6); }
  c.globalAlpha = 1;
}
// the green rot of the undead glows faintly where it pools: a slow, sickly breathing light on the liquid itself, seen only
// on tiles already seen (renderLight's memory mask) and not counted as light by the dead (43_crypt litAt), the Shade or the tombs
function rotGlow(g) {
  const A = ARENA; if (!A || A.liq !== 'rot') return;
  for (const p of A.pools || []) {
    if (!(p.level > 0) || !p.cv) continue; const w = p.cw || p.cv.width, h = p.ch || p.cv.height; if (p.px0 > CAM.x + 330 || p.px0 + w < CAM.x - 330 || p.py0 > CAM.y + 230 || p.py0 + h < CAM.y - 230) continue;
    if (!p.glow) { const m = mkCanvas(w, h), c = m.getContext('2d'); c.drawImage(p.cv, 0, 0, w, h, 0, 0, w, h); const D = c.getImageData(0, 0, w, h), d = D.data; for (let k = 0; k < d.length; k += 4) { const on = d[k + 3] > 0 && d[k + 1] - d[k] > 8; d[k] = 130; d[k + 1] = 255; d[k + 2] = 60; d[k + 3] = on ? 255 : 0; } c.putImageData(D, 0, 0); p.glow = m; } // (the liquid's own pixels only: never its rim, the floor or the walls beside it)
    g.globalAlpha = (0.1 + 0.04 * noise1(G.time * 0.6 + p.px0 * 0.01)) * Math.min(1, p.level * 1.5); g.drawImage(p.glow, p.px0, p.py0); g.globalAlpha = 1;
  }
}
function candleLights(L) {
  const A = ARENA; if (!A || !A.candles) return;
  for (const k of A.candles) { if (!k.lit || k.torch || Math.abs(k.x - CAM.x) > 300 || Math.abs(k.yb - CAM.y) > 200) continue; // (only those near enough the view to be seen)
    const f = 1 + 0.12 * noise1(G.time * 8 + k.ph) - 0.3 * k.gust; L(k.x + k.w / 2, k.yb - 2, 30 * f, 'torch', 0.42 * f); }
}
