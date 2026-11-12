// ===================== FX engine: particles, lightning, shockwaves, cracks, light, shake =====================
const Q = { pmax: 2600, bloom: 1, res: 1 };
const FX = { emit: [], P: [], bolts: [], rings: [], arcs: [], cracks: [], beams: [], lights: [], flights: [], nums: [], tele: [], columns: [], circles: [], ghosts: [], hz: [] };
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
function hitstop(s) { G.hitstop = Math.max(G.hitstop, s); }
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
function cracks(x, y, n, len, speed = 260, hot = 2.5, col = 'magma') {
  const segs = [];
  const grow = (sx, sy, a, l, t, depth) => {
    let px = sx, py = sy; const steps = Math.max(2, (l / 7) | 0);
    for (let i = 0; i < steps; i++) {
      a += rand(-0.55, 0.55); const sl = rand(4, 9), nx = px + Math.cos(a) * sl, ny = py + Math.sin(a) * sl * 0.8; if (!inArena(nx, ny)) break;
      t += sl / speed; segs.push({ x0: px, y0: py, x1: nx, y1: ny, t0: t, w: Math.max(0.7, 2.2 - depth * 0.6 - i * 0.07), p: false }); px = nx; py = ny;
      if (depth < 2 && chance(0.2)) grow(px, py, a + rand(-1.3, 1.3), l * 0.45, t, depth + 1);
    }
  };
  for (let i = 0; i < n; i++) grow(x, y, i / n * TAU + rand(-0.35, 0.35), len * rand(0.6, 1.25), 0, 0);
  FX.cracks.push({ segs, t: 0, hot, life: hot + 2, col });
}
// --- floor decals (painted straight into the arena ground: the room gets wrecked) ---
function scorch(x, y, r, a = 0.6) { const g = ARENA.g, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(8,5,4,${a})`); gr.addColorStop(0.55, `rgba(16,10,8,${a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 0.75, 0, 0, TAU); g.fill(); }
function splat(x, y, col, n = 6, spread = 7) { const g = ARENA.g; g.fillStyle = col; for (let i = 0; i < n; i++) { g.globalAlpha = rand(0.35, 0.75); const r = rand(0.8, 2.6); g.beginPath(); g.ellipse(x + rand(-spread, spread), y + rand(-spread, spread) * 0.7, r, r * 0.75, 0, 0, TAU); g.fill(); } g.globalAlpha = 1; }
// --- floating combat numbers ---
function number(x, y, z, n, col, big) { FX.nums.push({ x: x + rand(-4, 4), y, z, vz: rand(50, 80), vx: rand(-12, 12), txt: String(n), col, big, t: 0, life: big ? 1.1 : 0.8 }); if (FX.nums.length > 90) FX.nums.shift(); }
function textPop(x, y, z, txt, col, big = true) { FX.nums.push({ x, y, z, vz: 40, vx: 0, txt, col, big, t: 0, life: 1.4 }); }
// --- update everything ---
function updateFx(dt) {
  const P = FX.P;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
    if (p.drag) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; if (!p.g) p.vz *= f; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.g || p.vz) { p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 0 && p.g) { if (p.bounce && p.vz < -25) { p.z = 0; p.vz = -p.vz * p.bounce; p.vx *= 0.55; p.vy *= 0.55; } else { p.z = 0; p.vz = 0; p.g = 0; p.vx *= 0.3; p.vy *= 0.3; } } }
    if (p.vr) p.rot += p.vr * dt;
  }
  for (const b of FX.bolts) { b.t += dt; b.regen -= dt; if (b.regen <= 0) { b.regen = 0.045; boltShape(b); } }
  removeIf(FX.bolts, b => b.t >= b.life);
  for (const L of [FX.rings, FX.arcs, FX.beams, FX.flights, FX.tele, FX.columns, FX.circles]) { for (const o of L) o.t += dt; removeIf(L, o => o.t >= o.life); }
  for (const n of FX.nums) { n.t += dt; n.z += n.vz * dt; n.vz -= 90 * dt; n.x += n.vx * dt; }
  removeIf(FX.nums, n => n.t >= n.life);
  const g = ARENA && ARENA.g;
  for (const c of FX.cracks) {
    c.t += dt;
    if (g) for (const s of c.segs) if (!s.p && c.t >= s.t0) { s.p = true; g.strokeStyle = 'rgba(6,4,4,0.9)'; g.lineWidth = s.w + 0.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(s.x0, s.y0); g.lineTo(s.x1, s.y1); g.stroke(); g.strokeStyle = 'rgba(255,230,190,0.18)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(s.x0 + 0.8, s.y0 + 0.8); g.lineTo(s.x1 + 0.8, s.y1 + 0.8); g.stroke(); if (chance(0.08)) { smoke(s.x1, s.y1, 1, 'dust', 8, 6, 1, 8); } }
  }
  removeIf(FX.cracks, c => c.t >= c.life);
}
// --- drawing ---
const SPARK_PAL = { fire: ['#ffffff', '#fff1a8', '#ffa23a', '#ff4a18'], bolt: ['#ffffff', '#d8e8ff', '#88b0ff', '#4a6cff'], heal: ['#ffffff', '#d8ffe0', '#7cff9c', '#20c060'], arcane: ['#ffffff', '#f0d0ff', '#c070ff', '#7020d0'], white: ['#ffffff', '#ffffff', '#e0e0ff', '#9090c0'], gold: ['#ffffff', '#fff3c0', '#ffd060', '#c08020'], poison: ['#ffffff', '#e8ffc0', '#a0ff50', '#40a020'] };
function drawWorldParts(ctx) { // normal blending: smoke, rubble, pixel shards (these get lit by the light map)
  for (const p of FX.P) {
    const k = p.k;
    if (k === 'smoke') { const u = p.t / p.life, s = p.s0 + (p.s1 - p.s0) * u; ctx.globalAlpha = p.a0 + (p.a1 - p.a0) * u; ctx.drawImage(SMOKE[p.col], p.x - s, p.y - p.z - s, s * 2, s * 2); }
    else if (k === 'spike') { const u = p.t / p.life, h = p.s0 * (u < 0.15 ? u / 0.15 : u > 0.7 ? (1 - u) / 0.3 : 1), w = p.s0 * 0.45; ctx.globalAlpha = 1; ctx.fillStyle = '#6b625a'; ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x + w * 0.2, p.y - h * 1.6); ctx.lineTo(p.x + w, p.y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#9a8c7c'; ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x + w * 0.2, p.y - h * 1.6); ctx.lineTo(p.x - w * 0.1, p.y); ctx.closePath(); ctx.fill(); }
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
    for (const [w, al] of [[4, 0.25], [1.4, 0.9]]) { ctx.lineWidth = w; ctx.strokeStyle = rgba(al > 0.5 ? 'fire2' : c.col, al * heat); ctx.beginPath(); for (const s of c.segs) if (c.t >= s.t0) { ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x1, s.y1); } ctx.stroke(); }
  }
}
function drawTele(ctx) { // danger zones: normal blend, painted on the floor
  for (const t of FX.tele) { const u = t.t / t.life, p = 0.5 + 0.5 * Math.sin(t.t * 18); ctx.fillStyle = rgba(t.col, 0.12 + 0.18 * u); ctx.strokeStyle = rgba(t.col, 0.5 + 0.4 * p); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * 0.72, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * u, t.r * 0.72 * u, 0, 0, TAU); ctx.stroke(); }
}
