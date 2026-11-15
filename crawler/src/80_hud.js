// ===================== HUD: health, stamina, flasks, gold, the floor, banners =====================
const F_DISP = '"Grenze Gotisch", "Palatino Linotype", Palatino, "Book Antiqua", serif', F_HUD = 'Teko, "Arial Narrow", "Avenir Next Condensed", sans-serif';
const NUMCOL = { red: '#ff5a46', white: '#ffffff', gold: '#ffd860', heal: '#7cff9c' };
function font(c, w, size, fam) { c.font = `${w} ${size}px ${fam}`; }
function label(c, s, x, y, col, o = {}) { c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic'; if (o.stroke) { c.lineWidth = o.stroke; c.strokeStyle = 'rgba(8,6,8,0.9)'; c.lineJoin = 'round'; c.strokeText(s, x, y); } c.fillStyle = col; c.fillText(s, x, y); }
function spaced(c, s, x, y, sp, col, align = 'left') { let w = 0; for (const ch of s) w += c.measureText(ch).width + sp; w -= sp; let px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = col; for (const ch of s) { c.fillText(ch, px, y); px += c.measureText(ch).width + sp; } }
// a bar that shows recent loss as a pale trail
function bar(c, x, y, w, h, f, trailKey, col, back = 'rgba(0,0,0,0.6)') {
  const T = UI[trailKey] = UI[trailKey] === undefined ? f : (UI[trailKey] > f ? Math.max(f, UI[trailKey] - 0.5 / 60) : f);
  c.fillStyle = back; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(x, y, w * T, h); c.fillStyle = col; c.fillRect(x, y, w * f, h);
}
function drawHUD() {
  const c = ctx, d = VIEW.dpr, W = VIEW.w, H = VIEW.h, S = VIEW.safe, L = Math.max(12, S.l + 10), R = W - Math.max(12, S.r + 10), T = Math.max(10, S.t + 8);
  c.setTransform(d, 0, 0, d, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  if (G.mode !== 'play') { drawMenu(c); return; }
  // floating numbers
  const zf = clamp(CAM.z / 2.4, 0.8, 1.5);
  for (const n of FX.nums) { if (n.who && n.who.team === 'foe' && !n.who.dead && !foeShown(n.who)) continue; // nothing gives away a foe you cannot see
    const [sx, sy] = toScreen(n.x, n.y - n.z), u = n.t / n.life, pop = n.t < 0.08 ? 1 + (1 - n.t / 0.08) * 0.8 : 1; c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; font(c, 600, (n.sz || (n.big ? 18 : 12)) * zf * pop, F_HUD); label(c, n.txt, sx, sy, NUMCOL[n.col] || '#fff', { align: 'center', stroke: n.big ? 4 : 3 }); }
  c.globalAlpha = 1;
  // a hit lands: the edges flush red
  if (G.hurtFlash > 0) { const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.66); g.addColorStop(0, 'rgba(150,0,0,0)'); g.addColorStop(1, `rgba(180,10,10,${G.hurtFlash})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  const h = G.me;
  if (h) {
    const bw = clamp(W * 0.26, 140, 240);
    font(c, 900, 18, F_DISP); label(c, KITS[h.kit].name, L, T + 14, '#f8ecd6', { stroke: 3 });
    bar(c, L, T + 22, bw, 7, clamp(h.hp / h.maxHp, 0, 1), 'hpT', h.hp < h.maxHp * 0.3 ? '#ff4a3a' : '#d8443a');
    bar(c, L, T + 33, bw * 0.8, 4, clamp(h.stam / h.maxStam, 0, 1), 'stT', G.tiredT > 0 || h.huff ? (h.huff && h.stamT > 0 && Math.sin(G.time * 12) > 0 ? '#ffc070' : '#ff9a3a') : '#9ad85a');
    font(c, 500, 13, F_HUD); label(c, Math.ceil(h.hp) + ' / ' + h.maxHp, L + bw + 6, T + 29, 'rgba(240,224,192,0.8)', { stroke: 3 });
    for (let i = 0; i < h.maxFlasks; i++) { const x = L + i * 11, y = T + 43, full = i < h.flasks; c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x - 1, y - 1, 9, 12); c.fillStyle = full ? '#3fbf6a' : '#2a2420'; c.fillRect(x + 1, y + 3, 5, 7); c.fillStyle = full ? '#bfffd0' : '#3a3430'; c.fillRect(x + 2, y, 3, 3); }
    if (G.tiredT > 0 || h.huff) { font(c, 600, 13, F_HUD); label(c, h.huff ? 'WINDED' : 'OUT OF STAMINA', L + bw * 0.8 + 6, T + 38, '#ff9a3a', { stroke: 3 }); }
  }
  // gold, the floor, the map (top right, under the menu button)
  const mb = btnLayout().menu, my = mb.y + mb.r + 10;
  font(c, 600, 15, F_HUD); label(c, G.gold + ' GOLD', mb.x - mb.r - 10, T + 14, '#ffd860', { align: 'right', stroke: 3 });
  font(c, 500, 13, F_HUD); label(c, ARENA.name, mb.x - mb.r - 10, T + 30, 'rgba(240,224,192,0.7)', { align: 'right', stroke: 3 });
  if (!UI.paused) drawMinimap(c, R, my);
  if (MENU.update && !UI.paused) { c.globalAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 260); font(c, 600, 14, F_HUD); label(c, 'UPDATE READY · OPEN THE MENU', mb.x - mb.r - 10, T + 46, '#ffb860', { align: 'right', stroke: 3 }); c.globalAlpha = 1; }
  // banners
  const bn = G.banner; if (bn) {
    const u = bn.t / bn.life, a = u > 0.8 ? (1 - u) / 0.2 : Math.min(1, bn.t * 6), sz = clamp(Math.min(W, H) / 8, 26, 60) * (bn.small ? 0.55 : 1), y = bn.small ? H * 0.2 : H * 0.3, cc = COL[bn.col] || COL.gold;
    c.globalAlpha = a; font(c, 900, sz, F_DISP); c.shadowColor = `rgba(${cc},0.9)`; c.shadowBlur = 20; label(c, bn.a, W / 2, y, '#fff6e0', { align: 'center' }); c.shadowBlur = 0;
    if (bn.b) { font(c, 500, clamp(Math.min(W, H) / 26, 13, 20), F_HUD); spaced(c, bn.b, W / 2, y + sz * 0.5, 3, `rgb(${cc})`, 'center'); }
    c.globalAlpha = 1;
  }
  drawControls(c);
  if (G.fade > 0.001) { c.fillStyle = `rgba(4,3,5,${G.fade})`; c.fillRect(0, 0, W, H); }
  const cd = G.card; if (cd) { const u = cd.t / cd.life, a = u < 0.15 ? u / 0.15 : u > 0.75 ? (1 - u) / 0.25 : 1; c.globalAlpha = a; font(c, 900, clamp(Math.min(W, H) / 5, 34, 84), F_DISP); c.shadowColor = 'rgba(255,140,40,0.8)'; c.shadowBlur = 28; label(c, cd.a, W / 2, H * 0.42, '#f8ecd6', { align: 'center' }); c.shadowBlur = 0; font(c, 500, clamp(Math.min(W, H) / 22, 14, 22), F_HUD); spaced(c, cd.b, W / 2, H * 0.42 + 34, 4, '#c8a870', 'center'); if (cd.c) spaced(c, cd.c, W / 2, H * 0.42 + 58, 3, 'rgba(240,224,192,0.6)', 'center'); c.globalAlpha = 1; }
  drawPause(c);
}
