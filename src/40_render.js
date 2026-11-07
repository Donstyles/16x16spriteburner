// ===================== renderer =====================
const V = { cvs: null, ctx: null, W: 0, H: 0, dpr: 1, zoom: 2, camX: 0, camY: 0, viewTop: 0, viewBottom: 0, light: null, lctx: null, fog: null };
function initView(cvs) { V.cvs = cvs; V.ctx = cvs.getContext('2d'); V.light = document.createElement('canvas'); V.lctx = V.light.getContext('2d'); }
function resizeView(w, h, dpr) {
  V.W = w; V.H = h; V.dpr = dpr; V.cvs.width = Math.round(w * dpr); V.cvs.height = Math.round(h * dpr); V.cvs.style.width = w + 'px'; V.cvs.style.height = h + 'px';
  V.zoom = w >= 1500 && h >= 800 ? 4 : (w >= 1000 && h >= 600) ? 3 : 2;
  V.light.width = Math.ceil(w / 4); V.light.height = Math.ceil(h / 4);
}
const worldToScreen = (x, y) => [(x * T - V.camX) * V.zoom, (y * T - V.camY) * V.zoom];
const screenToWorld = (sx, sy) => [(sx / V.zoom + V.camX) / T, (sy / V.zoom + V.camY) / T];

// ---- autotiling ----
function plusTile(theme, x, y, m) {
  const [c0, r0] = THEMES[theme].plus;
  const f = (dx, dy) => { const t = mGet(m, x + dx, y + dy); return t !== TR.WALL && t !== TR.VOID && t !== TR.ROOF; };
  const N = f(0, -1), S = f(0, 1), E = f(1, 0), W = f(-1, 0);
  if (E && S && !N && !W) return [c0 + 1, r0 + 1]; if (W && S && !N && !E) return [c0 + 3, r0 + 1]; if (E && N && !S && !W) return [c0 + 1, r0 + 3]; if (W && N && !S && !E) return [c0 + 3, r0 + 3];
  if (S && !N) return [c0 + 2, r0]; if (N && !S) return [c0 + 2, r0 + 4]; if (E && !W) return [c0, r0 + 2]; if (W && !E) return [c0 + 4, r0 + 2];
  if (N && S) return [c0 + 2, r0]; if (E && W) return [c0, r0 + 2];
  if (f(1, 1)) return [c0 + 1, r0]; if (f(-1, 1)) return [c0 + 3, r0]; if (f(1, -1)) return [c0 + 1, r0 + 4]; if (f(-1, -1)) return [c0 + 3, r0 + 4];
  return [c0, r0];
}
function blobTile(block, same, x, y, m) {
  const [c0, r0] = block; const s = (dx, dy) => same(mGet(m, x + dx, y + dy));
  const N = s(0, -1), S = s(0, 1), E = s(1, 0), W = s(-1, 0);
  if (!N && !W) return [c0 + 1, r0]; if (!N && !E) return [c0 + 3, r0]; if (!S && !W) return [c0 + 1, r0 + 4]; if (!S && !E) return [c0 + 3, r0 + 4];
  if (!N) return [c0 + 2, r0]; if (!S) return [c0 + 2, r0 + 4]; if (!W) return [c0, r0 + 2]; if (!E) return [c0 + 4, r0 + 2];
  const v = hash2(x, y); return [c0 + 1 + Math.floor(v * 3), r0 + 1 + Math.floor(hash2(y, x) * 3)];
}
function renderMapLayer(m) {
  if (m._layer) return m._layer;
  const cvs = document.createElement('canvas'); cvs.width = m.w * T; cvs.height = m.h * T; const c = cvs.getContext('2d'); c.imageSmoothingEnabled = false;
  const theme = THEMES[m.theme], [pc, pr] = theme.plus;
  const floorTiles = [[pc + 2, pr + 1], [pc + 1, pr + 2], [pc + 2, pr + 2], [pc + 3, pr + 2], [pc + 2, pr + 3]];
  const isGrassLike = t => t === TR.GRASS || t === TR.TREE || t === TR.ROCK || t === TR.ROAD || t === TR.SAND || t === TR.DOOR || t === TR.WALL || t === TR.ROOF;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const t = m.t[y * m.w + x], v = hash2(x * 3 + 1, y * 5 + 2), px = x * T, py = y * T;
    if (m.outdoor) {
      // dirt base, grass blob on top for grass-like cells
      const d = DIRT_TILES[Math.floor(v * 4)]; drawTile(c, d[0], d[1], px, py);
      if (isGrassLike(t)) { const g = blobTile(BLOBS.grass, isGrassLike, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.ROAD || t === TR.DOOR) { const g = blobTile(BLOBS.road, q => q === TR.ROAD || q === TR.DOOR || q === TR.WALL || q === TR.ROOF, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.SAND) { const g = blobTile(BLOBS.sand, q => q === TR.SAND || q === TR.WATER || q === TR.DEEP, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.WATER) { const g = blobTile(BLOBS.water, q => q === TR.WATER || q === TR.DEEP, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.DEEP) { const g = DEEP_TILES[Math.floor(v * 4)]; drawTile(c, g[0], g[1], px, py); }
      if (t === TR.TREE) { const g = TREE_TILES[Math.floor(v * 4)]; drawTile(c, g[0], g[1], px, py); }
      if (t === TR.ROCK) { const g = ROCK_TILES[Math.floor(v * 2)]; drawTile(c, g[0], g[1], px, py); }
      if (t === TR.ROOF) { const g = ROOF_TILES[Math.floor(v * 4)]; drawTile(c, g[0], g[1], px, py); }
      if (t === TR.WALL) { const g = plusTile(m.theme, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.DOOR) { const bx = mGet(m, x, y - 1) === TR.ROOF || mGet(m, x, y - 1) === TR.WALL; if (bx) drawTile(c, 1, 15, px, py); }
    } else {
      if (t === TR.WALL || t === TR.VOID) { const g = plusTile(m.theme, x, y, m); drawTile(c, g[0], g[1], px, py); }
      else if (t === TR.LAVA) { const g = LAVA_TILES[Math.floor(v * 4)]; drawTile(c, g[0], g[1], px, py); }
      else { const f = floorTiles[Math.floor(v * 5)]; drawTile(c, f[0], f[1], px, py); }
    }
  }
  m._layer = cvs; return cvs;
}
// ---- frame ----
function drawWorld(m, ents, opts) {
  const ctx = V.ctx, z = V.zoom, dpr = V.dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, V.W, V.H);
  const layer = renderMapLayer(m);
  const vw = V.W / z, vh = V.H / z; // visible world px
  // camera clamp
  V.camX = clamp(V.camX, 0, Math.max(0, m.w * T - vw)); V.camY = clamp(V.camY, 0, Math.max(0, m.h * T - vh));
  const cx = Math.floor(V.camX), cy = Math.floor(V.camY);
  ctx.setTransform(dpr * z, 0, 0, dpr * z, 0, 0);
  ctx.drawImage(layer, cx, cy, Math.ceil(vw) + 1, Math.ceil(vh) + 1, 0, 0, Math.ceil(vw) + 1, Math.ceil(vh) + 1);
  ctx.translate(-cx, -cy);
  // animated water shimmer / lava glow
  const t = opts.time || 0;
  if (!m.outdoor && m.id === 'molten') { ctx.fillStyle = 'rgba(255,120,30,' + (0.08 + Math.sin(t * 3) * 0.05) + ')'; const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T); for (let y = y0; y < y0 + vh / T + 1; y++) for (let x = x0; x < x0 + vw / T + 1; x++) if (mGet(m, x, y) === TR.LAVA) ctx.fillRect(x * T, y * T, T, T); }
  // entities (sorted by y)
  ents.sort((a, b) => (a.y + (a.sortOff || 0)) - (b.y + (b.sortOff || 0)));
  for (const e of ents) {
    const sx = e.x * T, sy = e.y * T;
    if (sx < cx - 48 || sy < cy - 48 || sx > cx + vw + 48 || sy > cy + vh + 48) continue;
    if (e.shadow !== false && e.kind !== 'fx' && e.kind !== 'proj') { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx, sy - 1, 6 * (e.scale || 1), 2.5 * (e.scale || 1), 0, 0, TAU); ctx.fill(); }
    if (e.spr) {
      const sc = e.scale || 1, fw = 16 * sc, fh = 16 * sc; const dx = sx - fw / 2, dy = sy - fh + 2 - (e.hover || 0);
      if (e.alpha !== undefined && e.alpha < 1) ctx.globalAlpha = e.alpha;
      if (sc !== 1) { ctx.save(); ctx.translate(dx, dy); ctx.scale(sc, sc); drawCreature(ctx, e.spr, e.frame || 0, 0, 0, 1, e.flip); ctx.restore(); } else drawCreature(ctx, e.spr, e.frame || 0, dx, dy, 1, e.flip);
      if (e.tint) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = e.tint; ctx.fillRect(dx, dy, fw, fh); ctx.globalCompositeOperation = 'source-over'; }
      ctx.globalAlpha = 1;
      if (e.hpFrac !== undefined && e.hpFrac < 1) { ctx.fillStyle = '#200'; ctx.fillRect(dx, dy - 3, fw, 2); ctx.fillStyle = e.boss ? '#ff4040' : '#d03030'; ctx.fillRect(dx, dy - 3, fw * e.hpFrac, 2); }
      if (e.selected) { ctx.strokeStyle = 'rgba(255,220,120,0.9)'; ctx.lineWidth = 0.5; ctx.strokeRect(dx - 1, dy - 1, fw + 2, fh + 2); }
    } else if (e.tile) { if (e.alpha !== undefined) ctx.globalAlpha = e.alpha; drawTile(ctx, e.tile[0], e.tile[1], sx - 8 * (e.tile[2] || 1), sy - 14 * (e.tile[3] || 1) + (e.yoff || 0), 1, e.tile[2] || 1, e.tile[3] || 1); ctx.globalAlpha = 1; }
    else if (e.icon) { const ic = iconCanvas(e.icon); ctx.drawImage(ic, sx - 8, sy - 12 - (e.hover || 0)); }
    else if (e.kind === 'fx') drawFx(ctx, e, t);
    else if (e.kind === 'proj') drawProj(ctx, e, t);
    if (e.label) { ctx.font = 'bold 6px monospace'; }
  }
  // lighting
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawLighting(m, opts, cx, cy, vw, vh);
  // fog of war (unexplored black, soft)
  if (!m.outdoor || opts.fogOutdoor) drawFog(m, cx, cy, vw, vh);
}
function drawFx(ctx, e, t) {
  const sx = e.x * T, sy = e.y * T, k = e.life / e.dur;
  if (e.fx === 'burst') { const r = (1 - k) * e.r * T + 2; ctx.strokeStyle = e.color; ctx.lineWidth = 1.5; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(sx, sy - 6, r, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  else if (e.fx === 'glow') { const g = ctx.createRadialGradient(sx, sy - 6, 0, sx, sy - 6, e.r * T); g.addColorStop(0, e.color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = k * 0.8; ctx.fillStyle = g; ctx.fillRect(sx - e.r * T, sy - 6 - e.r * T, e.r * T * 2, e.r * T * 2); ctx.globalAlpha = 1; }
  else if (e.fx === 'text') { ctx.globalAlpha = Math.min(1, k * 2); text(ctx, e.text, sx, sy - 18 - (1 - k) * 12, 1, e.color, 'center'); ctx.globalAlpha = 1; }
  else if (e.fx === 'spark') { ctx.fillStyle = e.color; ctx.globalAlpha = k; for (let i = 0; i < 6; i++) { const a = i * 1.05 + e.seed, d = (1 - k) * 10; ctx.fillRect(sx + Math.cos(a) * d - 1, sy - 6 + Math.sin(a) * d - 1, 2, 2); } ctx.globalAlpha = 1; }
  else if (e.fx === 'heal') { ctx.fillStyle = e.color; ctx.globalAlpha = k; for (let i = 0; i < 5; i++) { const a = i * 1.3 + e.seed; ctx.fillRect(sx + Math.cos(a) * 5 - 1, sy - 4 - (1 - k) * 14 - i * 2, 2, 2); } ctx.globalAlpha = 1; }
}
function drawProj(ctx, e, t) {
  const sx = e.x * T, sy = e.y * T - 6;
  if (e.proj === 'arrow' || e.proj === 'rock') { ctx.save(); ctx.translate(sx, sy); ctx.rotate(e.ang); ctx.fillStyle = e.proj === 'arrow' ? '#c9a46a' : '#8a8078'; ctx.fillRect(-4, -0.5, 8, 1); ctx.fillStyle = '#eee'; ctx.fillRect(3, -1, 2, 2); ctx.restore(); return; }
  const col = { fire: '#ff8030', ice: '#80d0ff', spark: '#ffe060', dark: '#c060ff', poison: '#60e040', spirit: '#fff0b0', mind: '#e080ff', phys: '#d8c8a0' }[e.proj] || '#fff';
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5); g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 5, sy - 5, 10, 10);
}
function drawLighting(m, opts, cx, cy, vw, vh) {
  const l = V.lctx, lw = V.light.width, lh = V.light.height, s = lw / vw; // light px per world px
  let amb = opts.ambient; // [r,g,b] 0..255
  l.globalCompositeOperation = 'source-over'; l.fillStyle = `rgb(${amb[0]},${amb[1]},${amb[2]})`; l.fillRect(0, 0, lw, lh);
  l.globalCompositeOperation = 'lighter';
  for (const li of opts.lights) {
    const lx = (li.x * T - cx) * s, ly = (li.y * T - cy) * s, lr = li.r * T * s; if (lx < -lr || ly < -lr || lx > lw + lr || ly > lh + lr) continue;
    const g = l.createRadialGradient(lx, ly, 0, lx, ly, lr); const c = li.color || [255, 200, 120]; const i = li.i === undefined ? 1 : li.i;
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${i})`); g.addColorStop(0.5, `rgba(${c[0]},${c[1]},${c[2]},${i * 0.45})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
  }
  const ctx = V.ctx; ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true; ctx.drawImage(V.light, 0, 0, lw, lh, 0, 0, V.W, V.H); ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
}
function drawFog(m, cx, cy, vw, vh) {
  if (!m._fog) { m._fog = document.createElement('canvas'); m._fog.width = m.w; m._fog.height = m.h; m._fogData = m._fog.getContext('2d').createImageData(m.w, m.h); }
  const d = m._fogData.data; for (let i = 0; i < m.w * m.h; i++) { d[i * 4] = 0; d[i * 4 + 1] = 0; d[i * 4 + 2] = 0; d[i * 4 + 3] = m.explored[i] ? 0 : 255; }
  m._fog.getContext('2d').putImageData(m._fogData, 0, 0);
  const ctx = V.ctx, z = V.zoom; ctx.imageSmoothingEnabled = true;
  // draw the fog scaled so that 1 fog px = 16 world px; offset by half a tile so blur centres on cells
  ctx.setTransform(V.dpr * z, 0, 0, V.dpr * z, 0, 0); ctx.translate(-cx, -cy);
  ctx.drawImage(m._fog, 0, 0, m.w, m.h, 0, 0, m.w * T, m.h * T);
  ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); ctx.imageSmoothingEnabled = false;
}
