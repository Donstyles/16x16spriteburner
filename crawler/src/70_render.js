// ===================== renderer: a dark pixel world lit by lamps and torches, additive FX, shake, a following camera =====================
const VIEW = { w: 1, h: 1, dpr: 1, safe: { l: 0, r: 0, t: 0, b: 0 } };
const CAM = { x: 0, y: 0, z: 2, kick: 0 };
const SH = { x: 0, y: 0, r: 0 };
let cvs, ctx, fxc, fctx, lc, lctx, b1, b1c, b2, b2c, vign;
const LIGHTTEX = {};
function lightTex(k) { if (LIGHTTEX[k]) return LIGHTTEX[k]; const c = COL[k] || COL.white, s = 256, cv = mkCanvas(s, s), x = cv.getContext('2d'), g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, `rgba(${c},1)`); g.addColorStop(0.35, `rgba(${c},0.55)`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s); posterize(cv, 6); return (LIGHTTEX[k] = cv); }
function resize() {
  // phones held upright still get the landscape game: the canvas is turned 90° clockwise, so it reads correctly once the phone is turned (even with rotation lock on)
  const iw = Math.max(1, innerWidth), ih = Math.max(1, innerHeight), rot = ih > iw && matchMedia('(pointer: coarse)').matches;
  VIEW.rot = rot; VIEW.iw = iw; const w = rot ? ih : iw, h = rot ? iw : ih;
  cvs.style.width = w + 'px'; cvs.style.height = h + 'px'; cvs.style.transformOrigin = '0 0'; cvs.style.transform = rot ? `translateX(${iw}px) rotate(90deg)` : '';
  let dpr = Math.min(window.devicePixelRatio || 1, 2) * Q.res;
  if (w * h * dpr * dpr > 2.6e6) dpr = Math.sqrt(2.6e6 / (w * h));
  VIEW.w = w; VIEW.h = h; VIEW.dpr = dpr;
  cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr); // the world, effect, light and bloom buffers follow the camera in render()
  vign = mkCanvas(256, 256); const v = vign.getContext('2d'), g = v.createRadialGradient(128, 128, 60, 128, 128, 182); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.62)'); v.fillStyle = g; v.fillRect(0, 0, 256, 256);
  const pr = document.getElementById('safe'); if (pr) { const cs = getComputedStyle(pr); const sl = parseFloat(cs.paddingLeft) || 0, sr = parseFloat(cs.paddingRight) || 0, st = parseFloat(cs.paddingTop) || 0, sb = parseFloat(cs.paddingBottom) || 0; VIEW.safe = rot ? { l: st, r: sb, t: sr, b: sl } : { l: sl, r: sr, t: st, b: sb }; }
}
// ---------- camera: follows the local hero, leaning a little toward where it faces ----------
function exploreZoom() { return clamp(Math.min(VIEW.w / 330, VIEW.h / 205), 1, 6); }
function updateCam(dt) {
  if (!ARENA) return; const me = G.me && !G.me.dead ? G.me : G.heroes.find(alive);
  let fx, fy;
  if (G.mode !== 'play') { const t = G.time * 0.12, r = ARENA.start; fx = (r.ix0 + r.ix1 + 1) / 2 * TS + Math.cos(t) * 30; fy = (r.iy0 + r.iy1 + 1) / 2 * TS + Math.sin(t * 0.7) * 16; }
  else if (me) { fx = me.x + Math.cos(me.dir) * 14 + me.vx * 0.15; fy = me.y - 8 + Math.sin(me.dir) * 10 + me.vy * 0.12; }
  else { fx = CAM.x; fy = CAM.y; }
  if (!Number.isFinite(fx + fy)) { fx = Number.isFinite(CAM.x) ? CAM.x : ARENA.spawn.x; fy = Number.isFinite(CAM.y) ? CAM.y : ARENA.spawn.y; }
  CAM.z = damp(CAM.z, exploreZoom(), 2, dt);
  const hw = VIEW.w / (2 * CAM.z), hh = VIEW.h / (2 * CAM.z);
  fx = clamp(fx, hw - 10, ARENA.pw - hw + 10); fy = clamp(fy, hh - 10, ARENA.ph - hh + 10);
  CAM.x = damp(CAM.x, fx, 6, dt); CAM.y = damp(CAM.y, fy, 6, dt); CAM.kick = damp(CAM.kick, 0, 5, dt);
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
let MOBS_RED = null;
function mobsRed() { if (MOBS_RED) return MOBS_RED; const s = IMG.mobsW, c = mkCanvas(s.width, s.height), x = c.getContext('2d'); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ff3a24'; x.fillRect(0, 0, c.width, c.height); return (MOBS_RED = c); }
// A creature drawn bigger than its pixels (a brute at 1.3x) is enlarged once, the RotSprite way (Scale2x three times, then
// sampled at the new size), and then drawn pixel for pixel. Scaling it while drawing dropped and doubled different rows at
// every fraction of a pixel it moved, so its outline shimmered and tore.
const BIG = {}, LIE = {};
// how a creature lies: a quarter turn puts its width on the floor, so it is raised by its half-width below the middle, and
// slid back by half its height so that it lies where it stood
function lieOf(spr, sc) { const k = spr + '@' + sc; if (LIE[k]) return LIE[k]; const P = spritePixels(spr); let mn = 0, mx = 0; for (const p of P) { mn = Math.min(mn, p.x - 0.5); mx = Math.max(mx, p.x + 0.5); } return (LIE[k] = { dy: Math.round((mn + mx) / 2 * sc - 1), half: Math.round((P.foot + 1) / 2 * sc) }); } // a body lying flat sits on its shadow: its middle a pixel above the shadow's
function bigSprite(spr, sc) {
  const key = spr + '@' + sc; if (BIG[key]) return BIG[key];
  const [sy, fw, fh] = MOBS[spr], P = PIX.mobs, W = Math.round(fw * sc), H = Math.round(fh * sc), foot = footOf(spr);
  let img = { w: fw * 4, h: fh, d: new Uint8ClampedArray(fw * 4 * fh * 4) };
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw * 4; x++) { const i = ((sy + y) * P.w + x) * 4, j = (y * fw * 4 + x) * 4; for (let k = 0; k < 4; k++) img.d[j + k] = P.d[i + k]; if (img.d[j + 3] < 128) img.d[j + 3] = 0; else img.d[j + 3] = 255; }
  for (let k = 0; k < 3; k++) img = scale2x(img);
  const cv = mkCanvas(W * 4, H), x = cv.getContext('2d'), o = x.createImageData(W * 4, H);
  for (let f = 0; f < 4; f++) for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const X = Math.floor((f * fw + (xx + 0.5) * fw / W) * 8), Y = Math.floor((y + 0.5) * fh / H * 8), i = (Y * img.w + X) * 4, j = (y * W * 4 + f * W + xx) * 4;
    for (let k = 0; k < 4; k++) o.data[j + k] = img.d[i + k];
  }
  x.putImageData(o, 0, 0);
  const red = mkCanvas(W * 4, H), rx = red.getContext('2d'); rx.drawImage(cv, 0, 0); rx.globalCompositeOperation = 'source-in'; rx.fillStyle = '#ff3a24'; rx.fillRect(0, 0, W * 4, H);
  return (BIG[key] = { cv, white: silhouette(cv), red, W, H, foot: Math.round((foot + 1) * H / fh) });
}
function drawUnit(c, u) {
  const m = MOBS[u.spr]; if (!m) return; if (u.team === 'foe' && !foeShown(u)) return;
  const sy = m[0], fw = m[1], fh = m[2], foot = footOf(u.spr), sleep = u.state === 'sleep' && !u.aware;
  const creep = u.team === 'hero' && u.moving && u.noise === 0 && !u.act;
  const fr = sleep || (u.act && u.act.k === 'roll') ? 0 : ((u.anim * (u.moving ? (creep ? 5 : u.sprint ? 14 : 9) : 5)) | 0) % 4, sc = u.scale, jit = u.freeze > 0 && u.team === 'foe' ? (((G.time * 60) | 0) % 2 ? 1 : -1) : u.stun > 0 ? Math.sin(u.anim * 50) * 0.6 : 0;
  const ra = u.team === 'hero' && u.act && u.act.k === 'roll' ? u.act : null;
  // A pixel sprite cannot be squeezed without dropping rows, so a crouch or a landing lowers the upper body by
  // whole pixels instead: the sprite is cut at the waist and the top part drawn lower, over the legs.
  const dip = u.team === 'hero' && !ra ? Math.min(2, (creep ? 1 : 0) + (u.dipT > 0 ? 1 : 0)) : sleep && FLAT_SLEEPERS.has(u.spr) && sc === 1 ? 1 : 0, cut = Math.max(4, foot - 5);
  // the sellsword swinging: drawn without his sword, and the sword drawn on its own, behind him when it points behind him
  const Wc = u.team === 'hero' && !ra ? WEAPON[u.spr] : null, pose = Wc ? weaponPose(u) : null, back = pose && (pose.behind || (!pose.front && Math.cos(pose.th) * (u.face < 0 ? -1 : 1) < -0.15));
  if (back) drawWeapon(c, u, pose, Wc, fr, fw, foot, dip, cut);
  c.save(); c.translate(u.x + jit, u.y - u.z);
  if (sleep && !FLAT_SLEEPERS.has(u.spr)) { const L = lieOf(u.spr, sc), fs = u.face < 0 ? -1 : 1; c.translate(fs * L.half, L.dy); c.rotate(-fs * Math.PI / 2); } // asleep: lying on its back, its front turned up (a quarter turn, exact to the pixel)
  if (ra) { // a roll: one full turn the way the hero travels, in quarter turns so every pixel stays on the grid
    const p = Math.min(1, ra.t / ra.dur), turn = Math.min(4, Math.floor((p + 0.14) * 4.5)) / 4, cy = Math.round(-6 * sc);
    const way = Math.abs(Math.cos(ra.dir)) > 0.2 ? Math.sign(Math.cos(ra.dir)) : (u.face < 0 ? -1 : 1); // turn with the travel (a backward roll goes back over the head)
    c.translate(0, cy + Math.round(2 * Math.sin(p * Math.PI))); c.rotate(turn * TAU * way); c.translate(0, -cy);
  }
  const B = sc !== 1 ? bigSprite(u.spr, sc) : null;
  c.scale((B ? 1 : sc) * (u.face < 0 ? -1 : 1), B ? 1 : sc);
  const blitB = img => c.drawImage(img, fr * B.W, 0, B.W, B.H, -B.W / 2, -B.foot, B.W, B.H);
  const blit = (img, oy = sy) => { if (!dip) { c.drawImage(img, fr * fw, oy, fw, fh, -fw / 2, -foot - 1, fw, fh); return; }
    c.drawImage(img, fr * fw, oy + cut, fw, fh - cut, -fw / 2, -foot - 1 + cut, fw, fh - cut); c.drawImage(img, fr * fw, oy, fw, cut, -fw / 2, -foot - 1 + dip, fw, cut); };
  if (B) blitB(B.cv); else if (pose) blit(Wc.cut, 0); else blit(IMG.mobs);
  const a = u.act, warn = u.team === 'foe' && a && ((a.k === 'atk' && a.phase === 'wind') || (a.k === 'aim' && a.t > a.dur - 0.25));
  if (warn) { c.globalAlpha = 0.35 + 0.35 * Math.sin(G.time * 40); if (B) blitB(B.red); else blit(mobsRed()); }
  if (u.flash > 0) { c.globalAlpha = Math.min(1, u.flash * 9); if (B) blitB(B.white); else if (pose) blit(Wc.cutW, 0); else blit(IMG.mobsW); }
  c.restore(); c.globalAlpha = 1;
  if (pose && !back) drawWeapon(c, u, pose, Wc, fr, fw, foot, dip, cut);
  if (u.team === 'foe' && u.hp < u.maxHp && !u.dead) { const w = 10 * sc, x = u.x - w / 2, y = u.y - u.z + 3; c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(x - 0.5, y - 0.5, w + 1, 2.5); c.fillStyle = u.stun > 0 ? '#ffd24a' : '#e8443a'; c.fillRect(x, y, w * clamp(u.hp / u.maxHp, 0, 1), 1.5); }
  if (u.team === 'hero' && u.blocking) { const a0 = u.dir; c.strokeStyle = u.blockT < PARRY_WINDOW ? '#ffd860' : '#d8d0c0'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(u.x, u.y + GUARD.dy, GUARD.r, GUARD.r * GUARD.k, 0, a0 - GUARD.half, a0 + GUARD.half); c.stroke(); }
}
function drawProp(c, p) {
  if (p.kind === 'pillar') { const [tx, ty] = p.tile; for (let i = 0; i < 3; i++) c.drawImage(IMG.cellar, tx * TS, (ty + i) * TS, TS, TS, p.x - 8, p.y - 14 - 32 + i * TS, TS, TS); }
  else if (p.kind === 'brazier') { const f = ((G.time * 8 + p.f) | 0) % 4; c.drawImage(IMG.cellar, f * TS, 27 * TS, TS, TS, p.x - 8, p.y - 14, TS, TS); }
  else { const w = (p.tw || 1) * TS; c.drawImage(IMG.cellar, p.tile[0] * TS, p.tile[1] * TS, w, TS, p.x - w / 2, p.y - 14, w, TS); }
}
// arrows and stones in flight, coins on the floor
function drawProjBodies(c) {
  for (const p of G.proj) { const a = Math.atan2(p.vy, p.vx), y = p.y - p.z; if (p.k === 'arrow') { c.strokeStyle = p.team === 'hero' ? '#ffd860' : '#d9c9a2'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x - Math.cos(a) * 7, y - Math.sin(a) * 7); c.lineTo(p.x, y); c.stroke(); c.fillStyle = '#fff'; c.fillRect(p.x - 0.5, y - 0.5, 1.4, 1.4); } else { c.fillStyle = '#8a8076'; c.fillRect(p.x - 1.5, y - 1.5, 3, 3); } c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(p.x - 2, p.y, 4, 1); }
  for (const d of G.drops) { const y = Math.round(d.y - d.z), x = Math.round(d.x), s = ((G.time * 6 + d.x) | 0) % 4; c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x - 1, Math.round(d.y), 3, 1); c.fillStyle = '#7a5a10'; c.fillRect(x - 1, y - 2, 3, 3); c.fillStyle = s ? '#ffd24a' : '#fff4c0'; c.fillRect(x - 1, y - 2, s === 2 ? 1 : 2, 2); }
}
// where a foe's blow will land, painted on the floor while it winds up; an archer's aim is a line
function drawTelegraphs(c) {
  for (const f of G.foes) {
    const a = f.act; if (!a || f.dead || !foeShown(f)) continue;
    if (a.k === 'aim') { const u = clamp(a.t / a.dur, 0, 1), [ex, ey] = clipToWalls(f.x, f.y - 2, f.x + Math.cos(a.dir) * 220, f.y - 2 + Math.sin(a.dir) * 187, 1); c.strokeStyle = `rgba(255,${u > 0.78 ? 220 : 60},40,${0.15 + 0.6 * u})`; c.lineWidth = 1; c.beginPath(); c.moveTo(f.x, f.y - 2); c.lineTo(ex, ey); c.stroke(); continue; }
    if (a.k !== 'atk' || a.phase !== 'wind') continue;
    const mv = a.mv, u = clamp(a.t / mv.wind, 0, 1), fill = `rgba(255,50,30,${0.08 + 0.22 * u})`, edge = `rgba(255,${u > 0.8 ? 200 : 80},50,${0.4 + 0.5 * u})`;
    c.fillStyle = fill; c.strokeStyle = edge; c.lineWidth = 1; c.beginPath();
    if (mv.k === 'arc') { c.moveTo(f.x, f.y); c.ellipse(f.x, f.y, mv.reach + 4, (mv.reach + 4) * 0.85, 0, a.dir - mv.arc / 2, a.dir + mv.arc / 2); c.closePath(); }
    else if (mv.k === 'line') { const L = mv.reach + (mv.lunge || 0) * mv.act * 0.6, w = mv.w / 2, cs = Math.cos(a.dir), sn = Math.sin(a.dir) * 0.85; c.moveTo(f.x - sn * w, f.y + cs * w); c.lineTo(f.x + cs * L - sn * w, f.y + sn * L + cs * w); c.lineTo(f.x + cs * L + sn * w, f.y + sn * L - cs * w); c.lineTo(f.x + sn * w, f.y - cs * w); c.closePath(); }
    else { const cx = f.x + Math.cos(a.dir) * (mv.at || 0), cy = f.y + Math.sin(a.dir) * (mv.at || 0) * 0.85; c.ellipse(cx, cy, mv.reach, mv.reach * 0.75, 0, 0, TAU); c.moveTo(cx + mv.reach * u, cy); c.ellipse(cx, cy, mv.reach * u, mv.reach * 0.75 * u, 0, 0, TAU); }
    c.fill(); c.stroke();
  }
}
function drawGhosts(c) { for (const g of FX.ghosts) { const m = MOBS[g.spr]; if (!m) continue; const foot = footOf(g.spr), u = g.t / g.life; c.globalAlpha = 0.45 * (1 - u); c.save(); c.translate(g.x, g.y - g.z); c.scale(g.sc * (g.face < 0 ? -1 : 1), g.sc); c.drawImage(IMG.mobsW, g.fr * m[1], m[0], m[1], m[2], -m[1] / 2, -foot - 1, m[1], m[2]); c.restore(); } c.globalAlpha = 1; }
function drawAuras(c) {
  for (const t of ARENA.torches) { const f = 0.8 + 0.2 * noise1(G.time * 9 + t.tx); c.globalAlpha = 0.55 * f; c.drawImage(GLOW.torch, t.x - 6, t.y - 13, 12, 12); }
  for (const p of ARENA.props) if (p.kind === 'brazier') { c.globalAlpha = 0.6; c.drawImage(GLOW.torch, p.x - 9, p.y - 22, 18, 16); }
  for (const h of G.heroes) if (!h.dead && h.act && h.act.k === 'charge' && h.act.ready) { c.globalAlpha = 0.5 + 0.2 * Math.sin(G.time * 20); c.drawImage(GLOW.gold, h.x - 10, h.y - 18, 20, 20); }
  c.globalAlpha = 1;
}
// the light map: black, a faint glow on every tile the party remembers, lamps and torches on top, and nothing at all on
// tiles never seen (so no torch, flame or spark ever shows through from a room nobody has entered)
function renderLight() {
  const bw = lc.width, bh = lc.height, menu = G.mode !== 'play';
  lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalAlpha = 1; lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, bw, bh);
  if (menu) { lctx.fillStyle = 'rgb(70,62,74)'; lctx.fillRect(0, 0, bw, bh); } else maskToMemory(lctx, PXO.x, PXO.y, 'source-over');
  lctx.globalCompositeOperation = 'lighter'; lctx.imageSmoothingEnabled = false; lctx.setTransform(1, 0, 0, 1, -PXO.x, -PXO.y);
  const L = (x, y, r, k, a) => { if (a <= 0.01) return; const t = lightTex(k); for (let i = 0; i < 2 && a > 0.01; i++, a -= 1) { lctx.globalAlpha = Math.min(1, a); lctx.drawImage(t, x - r, y - r * 0.8, r * 2, r * 1.6); } };
  for (const h of G.heroes) if (!h.dead) { const hs = h.hush || 1; L(h.x, h.y - 6, h.lightR * 1.35 * hs, 'hot', 1.15 * hs); L(h.x, h.y - 6, h.lightR * 0.7 * hs, 'torch', 0.35); }
  for (const t of ARENA.torches) L(t.x, t.y + 6, 62 + 6 * noise1(G.time * 7 + t.tx), 'torch', 0.85);
  for (const p of ARENA.props) if (p.kind === 'brazier') L(p.x, p.y - 4, 90 + 8 * noise1(G.time * 6 + p.x), 'torch', 0.95);
  const A = FX.lights; for (let i = 0; i < A.length; i += 5) L(A[i], A[i + 1], A[i + 2], A[i + 3], A[i + 4]); A.length = 0;
  for (const f of FX.flights) { const u = f.t / f.life; L(f.x, f.y, f.r * (1 + u * 0.3), f.col, f.a * (1 - u) * (1 - u)); }
  if (!menu) { maskToMemory(lctx, PXO.x, PXO.y, 'destination-in'); }
  lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'destination-over'; lctx.globalAlpha = 1; lctx.fillStyle = '#000'; lctx.fillRect(0, 0, bw, bh); lctx.globalCompositeOperation = 'source-over';
}
// The world, its effects and its light are drawn at the game's own resolution (one canvas pixel per game pixel) and only then
// enlarged to the screen, nearest-neighbour, through the camera. Every shadow, ring, glow and spark comes out in chunky pixels.
let wb = null, wbc = null, PXO = { x: 0, y: 0 };
// The buffers are sized with room to spare and keep their size through shakes and zoom kicks: re-sizing a canvas makes a phone
// throw away and allocate its texture, and doing that every frame of a fight was what made crowds stutter.
const BUF = { w: 0, h: 0, okT: 0 };
function fitBuf(c, w, h) { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } }
function render() {
  const W = cvs.width, H = cvs.height, k = VIEW.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#050406'; ctx.fillRect(0, 0, W, H);
  if (!ARENA) { drawHUD(); return; }
  if (!wb) { wb = mkCanvas(1, 1); wbc = wb.getContext('2d'); }
  const zs = CAM.z * (1 + CAM.kick), hw = VIEW.w / (2 * zs), hh = VIEW.h / (2 * zs), pad = 3 + Math.ceil((Math.abs(SH.x) + Math.abs(SH.y)) / zs + Math.abs(SH.r) * Math.max(hw, hh) * 1.2);
  const needW = Math.ceil(2 * (hw + pad)) + 2, needH = Math.ceil(2 * (hh + pad)) + 2, now = performance.now(), size = () => { BUF.w = Math.ceil((needW + 16) / 32) * 32; BUF.h = Math.ceil((needH + 16) / 32) * 32; BUF.okT = now; };
  if (needW > BUF.w || needH > BUF.h) size(); else if (needW < BUF.w - 96 || needH < BUF.h - 72) { if (now - BUF.okT > 1500) size(); } else BUF.okT = now;
  const bw = BUF.w, bh = BUF.h, ox = Math.floor(CAM.x - bw / 2), oy = Math.floor(CAM.y - bh / 2); PXO.x = ox; PXO.y = oy;
  fitBuf(wb, bw, bh); fitBuf(fxc, bw, bh); fitBuf(lc, bw, bh); fitBuf(b1, Math.ceil(bw / 3), Math.ceil(bh / 3)); fitBuf(b2, Math.ceil(bw / 8), Math.ceil(bh / 8));
  const X = c => c.setTransform(1, 0, 0, 1, -ox, -oy);
  const c = wbc; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#0b0c0f'; c.fillRect(0, 0, bw, bh); c.imageSmoothingEnabled = false; X(c);
  drawGround(c, ox, oy, bw, bh);
  for (const t of ARENA.torches) { const f = ((G.time * 9 + t.f) | 0) % 4; c.drawImage(IMG.cellar, f * TS, 26 * TS, TS, TS, t.x - 8, t.y - 9, TS, TS); }
  drawWet(c); drawDoors(c); drawTele(c); drawTelegraphs(c);
  for (const u of G.units) { if (u.dead && u.team === 'foe') continue; if (u.team === 'foe' && !foeShown(u)) continue; pxShadow(c, u.x, u.y, u.r * 1.3 * (1 - Math.min(0.6, u.z / 160))); }
  const list = G.units.slice(); for (const p of ARENA.props) if (!p.dead) list.push(p); list.sort((a, b) => a.y - b.y);
  for (const o of list) o.team ? drawUnit(c, o) : drawProp(c, o);
  drawProjBodies(c); drawWorldParts(c);
  renderLight();
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'multiply'; c.drawImage(lc, 0, 0);
  fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.globalCompositeOperation = 'source-over'; fctx.globalAlpha = 1; fctx.clearRect(0, 0, bw, bh); fctx.globalCompositeOperation = 'lighter'; fctx.imageSmoothingEnabled = false; X(fctx);
  drawAuras(fctx); drawGhosts(fctx); drawRings(fctx); drawFxParts(fctx); drawBolts(fctx);
  if (G.mode === 'play') maskToMemory(fctx, ox, oy, 'destination-in'); // no glow, spark or flame shows where nobody has looked
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.drawImage(fxc, 0, 0);
  if (Q.bloom > 0) { b1c.imageSmoothingEnabled = b2c.imageSmoothingEnabled = c.imageSmoothingEnabled = true; b1c.clearRect(0, 0, b1.width, b1.height); b1c.drawImage(fxc, 0, 0, b1.width, b1.height); b2c.clearRect(0, 0, b2.width, b2.height); b2c.drawImage(b1, 0, 0, b2.width, b2.height); c.globalAlpha = 0.45 * Q.bloom; c.drawImage(b1, 0, 0, bw, bh); c.globalAlpha = 0.5 * Q.bloom; c.drawImage(b2, 0, 0, bw, bh); c.globalAlpha = 1; c.imageSmoothingEnabled = false; }
  c.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false; worldXform(ctx, k); ctx.drawImage(wb, ox, oy);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.flashA > 0.01) { ctx.fillStyle = rgba(G.flashC, Math.min(0.9, G.flashA)); ctx.fillRect(0, 0, W, H); }
  ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(vign, 0, 0, W, H);
  drawHUD();
}
// a hero's weapon, turned about his hand (screen pixels, so it stays crisp), then his hand drawn over it again
function drawWeapon(c, u, p, Wc, fr, fw, foot, dip, cutRow) {
  const px0 = Math.round(u.x - fw / 2), py0 = Math.round(u.y - u.z - foot - 1), col = k => u.face < 0 ? px0 + fw - 1 - k : px0 + k, row = r => py0 + r + (r < cutRow ? dip : 0);
  const [gx, gy] = Wc.piv[fr]; let x = col(gx), y = row(gy);
  if (p.push) { x += Math.round(Math.cos(p.th) * p.push); y += Math.round(Math.sin(p.th) * p.push); }
  if (p.at) { x = Math.round(lerp(x, p.at[0], p.blend)); y = Math.round(lerp(y, p.at[1], p.blend)); }
  if (p.shake) x += ((G.time * 30) | 0) % 2;
  const n = Wc.rot.length, i = ((Math.round((p.th - Wc.rest) / TAU * n) % n) + n) % n;
  c.drawImage(Wc.rot[i], x - Wc.r, y - Wc.r);
  if (!p.at) for (const [hx, hy, q] of Wc.hands[fr]) { c.fillStyle = `rgb(${q[0]},${q[1]},${q[2]})`; c.fillRect(col(hx), row(hy), 1, 1); }
  u.swTh = p.th;
}
// a unit's shadow: a flat pixel ellipse, row by row, no soft edge
function pxShadow(c, x, y, r) {
  const rx = Math.max(2, Math.round(r)), ry = Math.max(1, Math.round(r * 0.42)), cx = Math.round(x), cy = Math.round(y); c.fillStyle = 'rgba(0,0,0,0.38)';
  for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(1 - (dy / (ry + 0.5)) ** 2)); if (w > 0) c.fillRect(cx - w, cy + dy, w * 2, 1); }
}
