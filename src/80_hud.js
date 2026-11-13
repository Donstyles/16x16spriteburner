// ===================== HUD: spectator overlay, banners, numbers =====================
const F_DISP = '"Grenze Gotisch", "Palatino Linotype", Palatino, "Book Antiqua", serif', F_HUD = 'Teko, "Arial Narrow", "Avenir Next Condensed", sans-serif';
const NUMCOL = { fire: '#ffb04a', bolt: '#b4d0ff', heal: '#7cff9c', red: '#ff5a46', earth: '#ffc27a', white: '#ffffff', phys: '#ffffff', gold: '#ffd860', arcane: '#d49cff', poison: '#a8ff60', crimson: '#ff5a70', holy: '#fff0a0', ice: '#bfeaff', water: '#7ac0ff', wind: '#e8eeff', storm: '#c8b8ff' };
const UI = { soundRect: null, titleT: 0, bookOpen: false, bookFocus: null, bookRect: null, plateRects: [], draftRect: null };
function pushBanner(b) { b.t = 0; b.at = performance.now() / 1000; b.life = b.life || 1.8; if (!G.banner) G.banner = b; else { G.bq.push(b); if (G.bq.length > 6) G.bq.shift(); } }
function banner(title, hero, sub, col) { pushBanner({ a: title, b: hero ? hero.def.name + ' · ' + heroTitle(hero) : (sub || ''), col: col || (hero ? hero.def.col : 'gold'), life: 1.7 }); }
function textBanner(a, b, col = 'gold', small = false) { pushBanner({ a, b, col, life: small ? 1.8 : 2.4, keep: true, small }); }
function nextBanner(rdt) {
  if (G.banner) { G.banner.t += rdt; if (G.banner.t >= G.banner.life || (G.bq.length && G.banner.t > 1.2)) G.banner = null; }
  if (!G.banner) { const now = performance.now() / 1000; while (G.bq.length) { const b = G.bq.shift(); if (b.keep || now - b.at < 1.2) { b.t = 0; G.banner = b; break; } } }
}
function font(c, w, size, fam) { c.font = `${w} ${size}px ${fam}`; }
function label(c, s, x, y, col, o = {}) { c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic'; if (o.stroke) { c.lineWidth = o.stroke; c.strokeStyle = 'rgba(8,6,8,0.9)'; c.lineJoin = 'round'; c.strokeText(s, x, y); } c.fillStyle = col; c.fillText(s, x, y); }
function spaced(c, s, x, y, sp, col, align = 'left') { let w = 0; for (const ch of s) w += c.measureText(ch).width + sp; w -= sp; let px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; c.textAlign = 'left'; c.fillStyle = col; for (const ch of s) { c.fillText(ch, px, y); px += c.measureText(ch).width + sp; } }
function drawHUD() {
  const c = ctx, d = VIEW.dpr, W = VIEW.w, H = VIEW.h, S = VIEW.safe, L = Math.max(12, S.l + 10), R = W - Math.max(12, S.r + 10), T = Math.max(10, S.t + 8), B = H - Math.max(10, S.b + 8);
  c.setTransform(d, 0, 0, d, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  if (G.mode !== 'play') { drawMenus(c); return; }
  const big = Math.min(W, H);
  // floating numbers
  const zf = clamp(CAM.z / 2.4, 0.8, 1.5);
  for (const n of FX.nums) {
    const [sx, sy] = toScreen(n.x, n.y - n.z), u = n.t / n.life, pop = n.t < 0.08 ? 1 + (1 - n.t / 0.08) * 0.8 : 1;
    c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
    if (n.label !== undefined) { const tier = n.label, cc = COL[n.col] || COL.white, sz = [11, 12, 15, 19, 23][tier] * clamp(CAM.z / 2.4, 0.85, 1.3) * pop; if (tier >= 3) { font(c, 900, sz, F_DISP); c.shadowColor = `rgba(${cc},0.95)`; c.shadowBlur = 14; label(c, n.txt, sx, sy, '#fff4e0', { align: 'center' }); c.shadowBlur = 0; } else { font(c, 600, sz, F_HUD); label(c, n.txt, sx, sy, `rgb(${Math.min(255, cc[0] + 60)},${Math.min(255, cc[1] + 60)},${Math.min(255, cc[2] + 60)})`, { align: 'center', stroke: 3 }); } continue; }
    const sz = (n.big ? 19 : 12) * zf * pop; font(c, 600, sz, F_HUD); label(c, n.txt, sx, sy, NUMCOL[n.col] || '#fff', { align: 'center', stroke: n.big ? 4 : 3 });
  }
  c.globalAlpha = 1;
  const narrow = W < 560, crowd = !narrow && CTRL.topLeft < W / 2 + 80, TC = narrow ? T + 98 : crowd ? T + 30 : T, TK = narrow ? T + 76 : T;
  const me = G.me; if (me && !me.dead && me.hp < me.maxHp * 0.25 && G.phase === 'fight' && !G.choice) { // close to death: the edges of the screen pulse red, a heartbeat
    const p = 0.5 + 0.5 * Math.sin(performance.now() / 160), g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.66); g.addColorStop(0, 'rgba(150,0,0,0)'); g.addColorStop(1, `rgba(170,10,10,${0.26 + 0.16 * p})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (performance.now() > (UI.beatT || 0)) { UI.beatT = performance.now() + 900; SFX.heart(); }
  }
  drawHeroFrame(c, L, T);
  // wave pips (top centre)
  if (G.phase === 'fight' && G.wave > 0 && !(G.boss && alive(G.boss))) { const n = G.waves, gap = 13, x0 = W / 2 - (n - 1) * gap / 2, y = TC + 8; for (let k = 0; k < n; k++) { const done = k < G.wave - 1, cur = k === G.wave - 1, s = cur ? 4.5 + Math.sin(G.time * 6) : 3.5; c.save(); c.translate(x0 + k * gap, y); c.rotate(Math.PI / 4); c.fillStyle = done ? '#ffd860' : cur ? '#ff7a4a' : 'rgba(255,255,255,0.18)'; c.fillRect(-s / 2, -s / 2, s, s); c.restore(); } font(c, 500, 13, F_HUD); spaced(c, (G.wave === n ? 'FINAL WAVE' : 'WAVE ' + G.wave + ' OF ' + n) + (G.spawnQ.length ? '  ·  ' + G.spawnQ.length + ' INBOUND' : ''), W / 2, y + 18, 1.6, G.wave === n ? '#ff7a4a' : '#bfae90', 'center'); }
  // warlord bar
  const ch = G.champ; if (ch && alive(ch) && !(G.boss && alive(G.boss))) { const bw = Math.min(W * 0.36, 300), bx = W / 2 - bw / 2, by = TC + 50; font(c, 900, 17, F_DISP); label(c, ch.title, W / 2, by - 5, '#ffb8a0', { align: 'center', stroke: 4 }); c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(bx - 2, by - 2, bw + 4, 8); c.fillStyle = '#c8301e'; c.fillRect(bx, by, bw * clamp(ch.hp / ch.maxHp, 0, 1), 4); }
  // boss bar
  const b = G.boss; if (b && alive(b)) { const bw = Math.min(W * 0.5, 420), bx = W / 2 - bw / 2, by = TC + 26; font(c, 900, 20, F_DISP); label(c, b.def.name, W / 2, by - 6, '#f4d8b0', { align: 'center', stroke: 4 }); c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(bx - 2, by - 2, bw + 4, 9); const f = clamp(b.hp / b.maxHp, 0, 1); c.fillStyle = '#5a0c10'; c.fillRect(bx, by, bw, 5); c.fillStyle = '#e8402e'; c.fillRect(bx, by, bw * f, 5); c.fillStyle = 'rgba(255,220,180,0.5)'; c.fillRect(bx, by, bw * f, 1); }
  // kill streak
  if (G.combo >= 10) { const t = G.combo, lbl = t >= 250 ? 'APOCALYPSE' : t >= 150 ? 'ANNIHILATION' : t >= 80 ? 'MASSACRE' : t >= 35 ? 'RAMPAGE' : 'KILLING SPREE', pul = 1 + Math.max(0, 0.3 - (2.6 - G.comboT)) ; font(c, 900, 30 * pul, F_DISP); label(c, '×' + t, R, TK + 58, '#ffcf6a', { align: 'right', stroke: 5 }); font(c, 500, 15, F_HUD); spaced(c, lbl, R, TK + 74, 2, '#ff8a4a', 'right'); }
  if (G.callout && G.callout.t < 1.4) { const u = G.callout.t / 1.4; c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; font(c, 900, 22 * (G.callout.t < 0.1 ? 1.6 - G.callout.t * 6 : 1), F_DISP); label(c, G.callout.txt, R, TK + 100, '#ffffff', { align: 'right', stroke: 5 }); c.globalAlpha = 1; }
  // ultimate banner
  const bn = G.banner; if (bn) {
    const u = bn.t / bn.life, a = u > 0.8 ? (1 - u) / 0.2 : 1, s = bn.t < 0.14 ? 2.2 - bn.t / 0.14 * 1.2 : 1, sz = clamp(big / 7, 28, 72) * s * (bn.small ? 0.5 : 1), jx = bn.t < 0.5 ? rand(-3, 3) * (1 - bn.t * 2) : 0, y = bn.small ? T + 58 + sz * 0.3 : H * 0.27 + sz * 0.3, cc = COL[bn.col] || COL.gold;
    const grad = c.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(0.5, 'rgba(0,0,0,0.5)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a * (bn.small ? 0.6 : 1); c.fillStyle = grad; c.fillRect(0, y - sz * 0.85, W, sz * (bn.small ? 1.9 : 1.35)); c.globalAlpha = a;
    font(c, 900, sz, F_DISP); c.shadowColor = `rgba(${cc},0.95)`; c.shadowBlur = 24; label(c, bn.a, W / 2 + jx, y, '#fff6e0', { align: 'center' }); c.shadowBlur = 0; label(c, bn.a, W / 2 + jx, y, `rgba(${cc},0.35)`, { align: 'center' });
    if (bn.b) { font(c, 500, clamp(big / 26, 13, 22) * (bn.small ? 0.75 : 1), F_HUD); spaced(c, bn.b, W / 2, y + sz * (bn.small ? 0.6 : 0.42), bn.small ? 2 : 3, `rgb(${cc})`, 'center'); }
    if (bn.c) { font(c, 500, clamp(big / 34, 11, 16), F_HUD); spaced(c, bn.c, W / 2, y - sz * 0.72, 5, 'rgba(255,240,210,0.75)', 'center'); }
    c.globalAlpha = 1;
  }
  // floor card and fades
  if (G.fade > 0.001) { c.fillStyle = `rgba(4,3,5,${G.fade})`; c.fillRect(0, 0, W, H); }
  const cd = G.card; if (cd) { const u = cd.t / cd.life, a = u < 0.15 ? u / 0.15 : u > 0.75 ? (1 - u) / 0.25 : 1; c.globalAlpha = a; font(c, 900, clamp(big / 5, 34, 90), F_DISP); c.shadowColor = 'rgba(255,140,40,0.8)'; c.shadowBlur = 30; label(c, cd.a, W / 2, H / 2, '#f6e2bc', { align: 'center' }); c.shadowBlur = 0; font(c, 500, clamp(big / 24, 14, 24), F_HUD); spaced(c, cd.b, W / 2, H / 2 + clamp(big / 14, 22, 40), 4, '#c8a878', 'center'); if (cd.c) { font(c, 500, clamp(big / 30, 13, 19), F_HUD); label(c, cd.c, W / 2, H / 2 + clamp(big / 14, 22, 40) + clamp(big / 18, 20, 32), '#a8987e', { align: 'center' }); } c.globalAlpha = 1; }
  if (UI.titleT < 3.8) { const u = UI.titleT / 3.8, a = u < 0.1 ? u / 0.1 : u > 0.7 ? (1 - u) / 0.3 : 1; c.globalAlpha = a; c.fillStyle = 'rgba(4,3,5,0.55)'; c.fillRect(0, 0, W, H); font(c, 900, clamp(big / 4.2, 40, 120), F_DISP); c.shadowColor = 'rgba(120,160,255,0.9)'; c.shadowBlur = 36; label(c, 'Cellar of Ruin', W / 2, H * 0.47, '#f8f0e0', { align: 'center' }); c.shadowBlur = 0; font(c, 500, clamp(big / 22, 14, 26), F_HUD); spaced(c, 'THE BATTLE FIGHTS ITSELF  ·  YOU WATCH', W / 2, H * 0.47 + clamp(big / 10, 30, 60), 4, '#c8b48c', 'center'); c.globalAlpha = 1; }
  // countdown before the very first wave
  if (G.cdn > 0 && G.waveT <= 0 && G.phase === 'fight') { const n = Math.ceil(G.cdn), f = n - G.cdn, sz = clamp(big / 2.6, 70, 190) * (f < 0.18 ? 1.45 - f / 0.18 * 0.45 : 1); c.globalAlpha = Math.min(1, (1 - f) * 6); font(c, 900, sz, F_DISP); c.shadowColor = 'rgba(255,170,60,0.95)'; c.shadowBlur = 40; label(c, String(n), W / 2, H / 2 + sz * 0.33, '#fff4dc', { align: 'center' }); c.shadowBlur = 0; c.globalAlpha = 1; }
  if (G.fightT > 0) { const f = 1 - G.fightT / 1.1, sz = clamp(big / 3.4, 60, 150) * (1 + f * 0.3); c.globalAlpha = Math.min(1, G.fightT * 2.5); font(c, 900, sz, F_DISP); c.shadowColor = 'rgba(255,70,40,1)'; c.shadowBlur = 44; label(c, 'FIGHT!', W / 2 + rand(-3, 3) * (1 - f), H / 2 + sz * 0.33, '#ffffff', { align: 'center' }); c.shadowBlur = 0; c.globalAlpha = 1; }
  drawNetHud(c, R, T);
  drawControls(c);
  drawTut(c);
  drawChoice(c);
  drawTopButtons(c, R, narrow ? T + 66 : T);
  drawTrainMeter(c, W, TC + 14);
  drawBook(c);
  drawLoadout(c);
  drawPause(c);
  drawNetPanel(c);
}
