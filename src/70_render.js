// ===================== renderer: lit pixel world, additive FX with bloom, shake, auto-director camera =====================
const VIEW = { w: 1, h: 1, dpr: 1, safe: { l: 0, r: 0, t: 0, b: 0 } };
const CAM = { x: 0, y: 0, z: 2, kick: 0 };
const SH = { x: 0, y: 0, r: 0 };
let cvs, ctx, fxc, fctx, lc, lctx, b1, b1c, b2, b2c, vign;
const LIGHTTEX = {};
function lightTex(k) { if (LIGHTTEX[k]) return LIGHTTEX[k]; const c = COL[k] || COL.white, s = 64, cv = mkCanvas(s, s), x = cv.getContext('2d'), g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, `rgba(${c},1)`); g.addColorStop(0.35, `rgba(${c},0.55)`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s); return (LIGHTTEX[k] = cv); }
function resize() {
  // phones held upright still get the landscape game: the canvas is turned 90° clockwise, so it reads correctly once the phone is turned (even with rotation lock on)
  const iw = Math.max(1, innerWidth), ih = Math.max(1, innerHeight), rot = ih > iw && matchMedia('(pointer: coarse)').matches;
  VIEW.rot = rot; VIEW.iw = iw; const w = rot ? ih : iw, h = rot ? iw : ih;
  cvs.style.width = w + 'px'; cvs.style.height = h + 'px'; cvs.style.transformOrigin = '0 0'; cvs.style.transform = rot ? `translateX(${iw}px) rotate(90deg)` : '';
  let dpr = Math.min(window.devicePixelRatio || 1, 2) * Q.res;
  if (w * h * dpr * dpr > 2.6e6) dpr = Math.sqrt(2.6e6 / (w * h));
  VIEW.w = w; VIEW.h = h; VIEW.dpr = dpr;
  cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr); fxc.width = cvs.width; fxc.height = cvs.height;
  lc.width = Math.ceil(cvs.width / 4); lc.height = Math.ceil(cvs.height / 4); b1.width = Math.ceil(cvs.width / 8); b1.height = Math.ceil(cvs.height / 8); b2.width = Math.ceil(cvs.width / 24); b2.height = Math.ceil(cvs.height / 24);
  vign = mkCanvas(256, 256); const v = vign.getContext('2d'), g = v.createRadialGradient(128, 128, 60, 128, 128, 182); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.62)'); v.fillStyle = g; v.fillRect(0, 0, 256, 256);
  const pr = document.getElementById('safe'); if (pr) { const cs = getComputedStyle(pr); const sl = parseFloat(cs.paddingLeft) || 0, sr = parseFloat(cs.paddingRight) || 0, st = parseFloat(cs.paddingTop) || 0, sb = parseFloat(cs.paddingBottom) || 0; VIEW.safe = rot ? { l: st, r: sb, t: sr, b: sl } : { l: sl, r: sr, t: st, b: sb }; }
}
function camFitZoom() { return clamp(Math.min(VIEW.w / (ARENA.pw * 0.85), VIEW.h / (ARENA.ph * 0.75)), 1, 6); }
function updateCam(dt) {
  if (!ARENA) return; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0;
  const add = (x, y, w = 1) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); n += w; };
  for (const u of G.units) { if (u.team === 'mon' && (u.dead || u.spawnT > 0.3)) continue; if (u.team === 'hero' && u.dead && G.heroes.some(alive)) continue; add(u.x, u.y - 10 * u.scale); if (u.boss) { add(u.x - 30, u.y - 50); add(u.x + 30, u.y + 10); } }
  if (G.eq || G.phase === 'clear') { add(ARENA.x0, ARENA.y0); add(ARENA.x1, ARENA.y1); }
  if (!n) { add(ARENA.pw / 2, ARENA.ph / 2); }
  const bw = x1 - x0 + 140, bh = y1 - y0 + 110;
  let zMin = Math.min(VIEW.w / ARENA.pw, VIEW.h / ARENA.ph) * 0.96; if (VIEW.h > VIEW.w) zMin = Math.max(zMin, VIEW.w / (ARENA.pw * 0.62)); const zMax = Math.max(zMin * 1.05, Math.min(VIEW.w, VIEW.h) / 115);
  const tz = clamp(Math.min(VIEW.w / bw, VIEW.h / bh), zMin, zMax);
  let fx = (x0 + x1) / 2, fy = (y0 + y1) / 2, fz = tz; if (G.focus && G.focus.t > 0) { G.focus.t -= dt; fx = lerp(fx, G.focus.x, G.focus.w); fy = lerp(fy, G.focus.y, G.focus.w); fz = Math.min(zMax, tz * (1 + G.focus.w * 0.35)); }
  const me = G.heroes.length === 1 && G.heroes[0], follow = me && !me.dead && G.phase !== 'wipe' && !G.eq;
  if (follow) { fx = lerp(me.x + me.vx * 0.3, fx, 0.15); fy = lerp(me.y + me.vy * 0.25 - 8, fy, 0.15); fz = clamp(Math.min(VIEW.w / 330, VIEW.h / 200), zMin, zMax * 1.2); if (G.boss && alive(G.boss)) { fx = lerp(fx, G.boss.x, 0.25); fy = lerp(fy, G.boss.y - 20, 0.25); fz *= 0.85; } if (G.focus && G.focus.t > 0) fz *= 1 + G.focus.w * 0.15; }
  const cr = follow ? 5 : 2.4; CAM.z = damp(CAM.z, fz, 1.5, dt); CAM.x = damp(CAM.x, fx, cr, dt); CAM.y = damp(CAM.y, fy, cr, dt);
  const hw = VIEW.w / (2 * CAM.z), hh = VIEW.h / (2 * CAM.z);
  CAM.x = ARENA.pw <= 2 * hw ? ARENA.pw / 2 : clamp(CAM.x, hw - 10, ARENA.pw - hw + 10);
  CAM.y = ARENA.ph <= 2 * hh ? ARENA.ph / 2 : clamp(CAM.y, hh - 10, ARENA.ph - hh + 10);
  CAM.kick = damp(CAM.kick, 0, 5, dt);
}
function updateShake(rdt) {
  G.trauma = Math.max(0, G.trauma - rdt * 1.25); let q = 0;
  if (G.quakeT > 0) { G.quakeT -= rdt; q = G.quakeP * Math.min(1, G.quakeT * 1.6); if (G.quakeT <= 0) G.quakeP = 0; }
  const tr = Math.min(1.5, G.trauma) ** 2, t = performance.now() / 1000, m = Math.min(VIEW.w, VIEW.h) / 430;
  SH.x = (noise1(t * 30) * 22 * tr + (noise1(t * 11 + 50) * 16 + noise1(t * 43 + 7) * 5) * q) * m;
  SH.y = (noise1(t * 30 + 100) * 22 * tr + (noise1(t * 11 + 150) * 16 + noise1(t * 43 + 77) * 5) * q) * m;
  SH.r = noise1(t * 24 + 300) * 0.05 * tr + noise1(t * 8 + 400) * 0.035 * q;
}
function worldXform(c, k) {
  const s = CAM.z * (1 + CAM.kick) * k, cx = VIEW.w * k / 2 + SH.x * k, cy = VIEW.h * k / 2 + SH.y * k, co = Math.cos(SH.r), si = Math.sin(SH.r);
  c.setTransform(co * s, si * s, -si * s, co * s, cx - (co * s * CAM.x - si * s * CAM.y), cy - (si * s * CAM.x + co * s * CAM.y));
}
function toScreen(x, y) { const s = CAM.z * (1 + CAM.kick); return [(x - CAM.x) * s + VIEW.w / 2 + SH.x, (y - CAM.y) * s + VIEW.h / 2 + SH.y]; }
// ---------- sprites ----------
function drawUnit(c, u) {
  const m = MOBS[u.spr]; if (!m) return; const sy = m[0], fw = m[1], fh = m[2], foot = footOf(u.spr);
  const fr = u.dead ? 0 : ((u.anim * (u.moving ? 9 : 5)) | 0) % 4;
  let sc = u.scale; if (u.spawnT > 0) sc *= 1 - (u.spawnT / 0.35) * 0.85;
  const lx = u.lunge > 0 ? Math.cos(u.la) * u.lunge * 14 : 0, ly = u.lunge > 0 ? Math.sin(u.la) * u.lunge * 10 : 0;
  const bob = u.moving && u.z === 0 && !u.dead ? -Math.abs(Math.sin(u.anim * 11)) * 1.4 : 0, sq = u.squash, stunJit = u.stun > 0 && !u.dead ? Math.sin(u.anim * 50) * 0.6 : 0;
  c.save(); c.translate(u.x + lx + stunJit, u.y + ly - u.z + bob);
  if (u.dead) { c.rotate(1.45 * (u.face < 0 ? -1 : 1)); c.globalAlpha = 0.55; c.translate(0, -2); }
  c.scale(sc * (1 + sq) * (u.face < 0 ? -1 : 1), sc * (1 - sq));
  c.drawImage(IMG.mobs, fr * fw, sy, fw, fh, -fw / 2, -foot - 1, fw, fh);
  if (u.flash > 0) { c.globalAlpha = Math.min(1, u.flash * 9); c.drawImage(IMG.mobsW, fr * fw, sy, fw, fh, -fw / 2, -foot - 1, fw, fh); }
  c.restore(); c.globalAlpha = 1;
  if (u.dead) return;
  const showBar = u.team === 'hero' || (!u.boss && u.hp < u.maxHp && u.maxHp >= 60);
  if (showBar) { const w = u.team === 'hero' ? 14 : 10 * u.scale, x = u.x - w / 2, y = u.y + 3; c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(x - 0.5, y - 0.5, w + 1, 2.5); const f = clamp(u.hp / u.maxHp, 0, 1); c.fillStyle = u.team === 'hero' ? (f > 0.5 ? '#6cf08a' : f > 0.25 ? '#ffd24a' : '#ff4a3a') : '#e8443a'; c.fillRect(x, y, w * f, 1.5); }
}
function drawProp(c, p) {
  if (p.kind === 'pillar') { const [tx, ty] = p.tile; for (let i = 0; i < 3; i++) c.drawImage(IMG.cellar, tx * TS, (ty + i) * TS, TS, TS, p.x - 8, p.y - 14 - 32 + i * TS, TS, TS); }
  else if (p.kind === 'brazier') { const f = ((G.time * 8 + p.f) | 0) % 4; c.drawImage(IMG.cellar, f * TS, 27 * TS, TS, TS, p.x - 8, p.y - 14, TS, TS); }
  else c.drawImage(IMG.cellar, p.tile[0] * TS, p.tile[1] * TS, TS, TS, p.x - 8, p.y - 14, TS, TS);
}
function drawProjBodies(c) {
  for (const p of G.proj) {
    if (p.k === 'glob') { c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(p.x, p.y, 4, 1.6, 0, 0, TAU); c.fill(); if (p.mud) { c.fillStyle = '#5a4028'; c.beginPath(); c.arc(p.x, p.y - p.z, 3, 0, TAU); c.fill(); c.fillStyle = '#8a6a48'; c.fillRect(p.x - 1.5, p.y - p.z - 2, 1.5, 1.5); } }
    if (p.k === 'mshot' && (p.shot === 'arrow' || p.shot === 'stone')) { const a = Math.atan2(p.vy, p.vx); if (p.shot === 'arrow') { c.strokeStyle = p.tint || '#d9c9a2'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x - Math.cos(a) * 7, p.y - p.z - Math.sin(a) * 7); c.lineTo(p.x, p.y - p.z); c.stroke(); c.fillStyle = '#fff'; c.fillRect(p.x - 0.5, p.y - p.z - 0.5, 1.4, 1.4); } else { c.fillStyle = '#8a8076'; c.fillRect(p.x - 1.5, p.y - p.z - 1.5, 3, 3); } }
    else if (p.k === 'meteor' || p.k === 'boulder') {
      const s = (p.k === 'meteor' ? 1.6 * p.big : p.sz) * (1 + p.z / 400), sh = Math.max(2, 10 * s * (1 - p.z / 400));
      c.fillStyle = `rgba(0,0,0,${0.25 + 0.3 * (1 - p.z / 300)})`; c.beginPath(); c.ellipse(p.x, p.y, sh, sh * 0.45, 0, 0, TAU); c.fill();
      c.save(); c.translate(p.x, p.y - p.z); c.rotate(p.t * 7); c.scale(s, s); c.drawImage(ROCKS[p.rk || 0], -10, -10); c.restore();
    }
  }
}
function drawProjGlows(c) {
  for (const p of G.proj) {
    const y = p.y - p.z;
    if (p.k === 'fireball') { const s = 13 * p.big * (0.9 + 0.1 * Math.sin(p.t * 40)); c.drawImage(GLOW.fire, p.x - s, y - s, s * 2, s * 2); c.drawImage(GLOW.hot, p.x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8); }
    else if (p.k === 'ball') { const s = 15 + Math.sin(p.t * 50) * 3; c.drawImage(GLOW.bolt, p.x - s, y - s, s * 2, s * 2); c.drawImage(GLOW.white, p.x - 5, y - 5, 10, 10); }
    else if (p.k === 'meteor') { const s = 24 * p.big; c.drawImage(GLOW.fire, p.x - s, y - s, s * 2, s * 2); c.drawImage(GLOW.hot, p.x - s * 0.35, y - s * 0.35, s * 0.7, s * 0.7); }
    else if (p.k === 'glob' && !p.mud) { c.drawImage(GLOW.fire, p.x - 8, y - 8, 16, 16); c.drawImage(GLOW.hot, p.x - 3, y - 3, 6, 6); }
    else if (p.k === 'mshot' && p.shot !== 'arrow' && p.shot !== 'stone') { c.drawImage(GLOW[p.col] || GLOW.arcane, p.x - 7, y - 7, 14, 14); c.drawImage(GLOW.white, p.x - 2, y - 2, 4, 4); }
  }
}
function drawAuras(c) {
  for (const h of G.heroes) { if (h.dead) continue; const k = h.def.col, ready = h.ult >= 100, s = 9 + Math.min(8, G.lvl * 0.6) + (ready ? 3 * Math.sin(G.time * 8) : 0); c.globalAlpha = ready ? 0.75 : Math.min(0.45, 0.12 + G.lvl * 0.025); c.drawImage(GLOW[k], h.x - s, h.y - s * 0.4, s * 2, s * 0.8); if (ready && chance(0.15)) part({ k: 'glow', x: h.x + rand(-6, 6), y: h.y, z: rand(0, 6), vz: rand(20, 40), life: 0.6, s0: 2, s1: 0, col: k }); }
  for (const t of ARENA.torches) { const f = 0.8 + 0.2 * noise1(G.time * 9 + t.tx); c.globalAlpha = 0.55 * f; c.drawImage(GLOW.torch, t.x - 6, t.y - 13, 12, 12); }
  for (const p of ARENA.props) if (p.kind === 'brazier') { c.globalAlpha = 0.6; c.drawImage(GLOW.torch, p.x - 9, p.y - 22, 18, 16); }
  for (const r of ARENA.runes) if (r.glow > 0.02) { const g = Math.min(1, r.glow), s = 12 + 3 * Math.sin(G.time * 9 + r.x); c.globalAlpha = g * 0.85; c.drawImage(GLOW.arcane, r.x - s, r.y - s * 0.6, s * 2, s * 1.2); if (chance(g * 0.3)) part({ k: 'glow', x: r.x + rand(-6, 6), y: r.y + rand(-4, 4), z: 0, vz: rand(20, 50), life: 0.6, s0: 1.8, s1: 0, col: 'arcane' }); }
  for (const u of G.mons) if (u.rank && u.spawnT <= 0) { const s = 10 * u.scale + 2 * Math.sin(G.time * 7 + u.x); c.globalAlpha = u.rank === 'warlord' ? 0.7 : 0.5; c.drawImage(GLOW.red, u.x - s, u.y - s * 0.4, s * 2, s * 0.8); }
  if (G.boss && alive(G.boss)) { const b = G.boss, s = 34 + 4 * Math.sin(G.time * 5); c.globalAlpha = 0.35; c.drawImage(GLOW[b.def.col || 'red'], b.x - s, b.y - s * 0.5, s * 2, s); }
  c.globalAlpha = 1;
}
function renderLight() {
  const th = ARENA.th.amb, d = clamp(Math.max(G.ambDark, G.phase === 'fight' ? (G.inten || 0) * 0.32 : 0), 0, 1), fl = clamp(G.ambFlash, 0, 0.6), mix = (v, w) => Math.round(clamp(v * (1 - d * 0.8) + w * fl * 0.75, 0, 255));
  lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1; lctx.fillStyle = `rgb(${mix(th[0], 230)},${mix(th[1], 240)},${mix(th[2], 255)})`; lctx.fillRect(0, 0, lc.width, lc.height);
  lctx.globalCompositeOperation = 'lighter'; worldXform(lctx, lc.width / VIEW.w);
  const L = (x, y, r, k, a) => { if (a <= 0.01) return; const t = lightTex(k); for (let i = 0; i < 2 && a > 0.01; i++, a -= 1) { lctx.globalAlpha = Math.min(1, a); lctx.drawImage(t, x - r, y - r * 0.8, r * 2, r * 1.6); } };
  for (const t of ARENA.torches) L(t.x, t.y + 6, 62 + 6 * noise1(G.time * 7 + t.tx), 'torch', 0.85 * (1 - d * 0.5));
  for (const p of ARENA.props) if (p.kind === 'brazier') L(p.x, p.y - 4, 90 + 8 * noise1(G.time * 6 + p.x), 'torch', 0.95 * (1 - d * 0.5));
  for (const h of G.heroes) if (!h.dead) { L(h.x, h.y - 6, 46, 'white', 0.45); L(h.x, h.y, 36, h.def.col, 0.35); }
  if (G.boss && alive(G.boss)) L(G.boss.x, G.boss.y - 20, 110, G.boss.def.col || 'red', 0.8);
  for (const c of FX.circles) L(c.x, c.y, c.r * 4, c.col, 0.9);
  for (const r of ARENA.runes) if (r.glow > 0.02) L(r.x, r.y, 60, 'arcane', Math.min(1, r.glow) * 0.9);
  for (const u of G.mons) if (u.rank) L(u.x, u.y - 8, 50 * u.scale / 1.5, 'red', 0.6);
  for (const c of FX.cracks) { const heat = clamp(1 - (c.t - 0.2) / c.hot, 0, 1); if (heat > 0 && c.segs.length) { const s = c.segs[(c.segs.length / 2) | 0]; L(s.x1, s.y1, 70, c.col === 'bolt' ? 'bolt' : 'magma', heat * 0.8); } }
  const A = FX.lights; for (let i = 0; i < A.length; i += 5) L(A[i], A[i + 1], A[i + 2], A[i + 3], A[i + 4]); A.length = 0;
  for (const f of FX.flights) { const u = f.t / f.life; L(f.x, f.y, f.r * (1 + u * 0.3), f.col, f.a * (1 - u) * (1 - u)); }
  let n = 0; for (const p of FX.P) { if (p.k === 'glow' && p.s0 > 6 && (n++ & 3) === 0) L(p.x, p.y, p.s0 * 4, p.col, 0.5 * (1 - p.t / p.life)); }
  lctx.globalAlpha = 1;
}
function render() {
  const W = cvs.width, H = cvs.height, k = VIEW.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#0b0c0f'; ctx.fillRect(0, 0, W, H);
  if (!ARENA) return;
  ctx.imageSmoothingEnabled = false; worldXform(ctx, k);
  ctx.drawImage(ARENA.ground, 0, 0);
  for (const t of ARENA.torches) { const f = ((G.time * 9 + t.f) | 0) % 4; ctx.drawImage(IMG.cellar, f * TS, 26 * TS, TS, TS, t.x - 8, t.y - 9, TS, TS); }
  drawTele(ctx);
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  for (const u of G.units) { if (u.dead && u.team === 'mon') continue; const s = u.r * 1.3 * (1 - Math.min(0.6, u.z / 160)); ctx.beginPath(); ctx.ellipse(u.x, u.y, s, s * 0.42, 0, 0, TAU); ctx.fill(); }
  const list = G.units.slice(); for (const p of ARENA.props) if (!p.dead) list.push(p); list.sort((a, b) => a.y - b.y);
  for (const o of list) o.team ? drawUnit(ctx, o) : drawProp(ctx, o);
  drawHazardsWorld(ctx); drawProjBodies(ctx); drawWorldParts(ctx);
  renderLight();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(lc, 0, 0, W, H);
  fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.globalCompositeOperation = 'source-over'; fctx.globalAlpha = 1; fctx.clearRect(0, 0, W, H); fctx.globalCompositeOperation = 'lighter'; fctx.imageSmoothingEnabled = true; worldXform(fctx, k);
  drawAuras(fctx); drawHazardsFx(fctx); drawCrackGlow(fctx); drawGhosts(fctx); drawRings(fctx); drawFxParts(fctx); drawProjGlows(fctx); drawBolts(fctx);
  ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fxc, 0, 0);
  if (Q.bloom > 0) { b1c.clearRect(0, 0, b1.width, b1.height); b1c.drawImage(fxc, 0, 0, b1.width, b1.height); b2c.clearRect(0, 0, b2.width, b2.height); b2c.drawImage(b1, 0, 0, b2.width, b2.height); ctx.globalAlpha = 0.6 * Q.bloom; ctx.drawImage(b1, 0, 0, W, H); ctx.globalAlpha = 0.7 * Q.bloom; ctx.drawImage(b2, 0, 0, W, H); ctx.globalAlpha = 1; }
  if (G.flashA > 0.01) { ctx.fillStyle = rgba(G.flashC, Math.min(0.9, G.flashA)); ctx.fillRect(0, 0, W, H); }
  ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(vign, 0, 0, W, H);
  drawHUD();
}
