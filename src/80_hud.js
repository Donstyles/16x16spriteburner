// ===================== HUD: spectator overlay, banners, numbers =====================
const F_DISP = '"Grenze Gotisch", "Palatino Linotype", Palatino, "Book Antiqua", serif', F_HUD = 'Teko, "Arial Narrow", "Avenir Next Condensed", sans-serif';
const NUMCOL = { fire: '#ffb04a', bolt: '#b4d0ff', heal: '#7cff9c', red: '#ff5a46', earth: '#ffc27a', white: '#ffffff', phys: '#ffffff', gold: '#ffd860', arcane: '#d49cff', poison: '#a8ff60' };
const UI = { soundRect: null, titleT: 0 };
function pushBanner(b) { b.t = 0; b.at = performance.now() / 1000; b.life = b.life || 1.8; if (!G.banner) G.banner = b; else { G.bq.push(b); if (G.bq.length > 6) G.bq.shift(); } }
function banner(title, hero, sub, col) { pushBanner({ a: title, b: hero ? hero.def.name + ' · ' + heroTitle(hero) : (sub || ''), col: col || (hero ? hero.def.col : 'gold'), life: 1.7 }); }
function textBanner(a, b, col = 'gold') { pushBanner({ a, b, col, life: 2.4, keep: true }); }
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
  const big = Math.min(W, H);
  // floating numbers
  const zf = clamp(CAM.z / 2.4, 0.8, 1.5);
  for (const n of FX.nums) {
    const [sx, sy] = toScreen(n.x, n.y - n.z), u = n.t / n.life, pop = n.t < 0.08 ? 1 + (1 - n.t / 0.08) * 0.8 : 1, sz = (n.big ? 19 : 12) * zf * pop;
    c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; font(c, 600, sz, F_HUD); label(c, n.txt, sx, sy, NUMCOL[n.col] || '#fff', { align: 'center', stroke: n.big ? 4 : 3 });
  }
  c.globalAlpha = 1;
  // floor and tally
  font(c, 900, 24, F_DISP); label(c, 'Floor ' + G.floor, L, T + 20, '#ecc878', { stroke: 4 });
  font(c, 500, 14, F_HUD); spaced(c, ARENA.name, L, T + 36, 1.6, '#bfae90');
  font(c, 600, 17, F_HUD); spaced(c, 'LEVEL ' + G.lvl, L, T + 55, 1.4, '#ffd860'); const lw = c.measureText('LEVEL ' + G.lvl).width + 8 * 1.4 + 6, xa = xpFor(G.lvl), xb = xpFor(G.lvl + 1), xf = clamp((G.xp - xa) / (xb - xa), 0, 1);
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(L + lw, T + 47, 90, 5); c.fillStyle = '#ffd860'; c.fillRect(L + lw, T + 47, 90 * xf, 5); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(L + lw, T + 47, 90 * xf, 1);
  const nx = nextUnlocks(); font(c, 500, 13, F_HUD); if (nx) spaced(c, 'NEXT AT ' + nx.lvl + ':  ' + nx.names.join(' · '), L, T + 70, 1.1, '#c8a050');
  spaced(c, G.kills.toLocaleString() + ' SLAIN' + (G.falls ? '  ·  FALLEN ' + G.falls + '×' : ''), L, T + (nx ? 84 : 70), 1.1, '#8f8472');
  // party plates
  const pw = 122, rows = W < 560 ? 2 : 1, per = rows === 2 ? 2 : 4;
  G.heroes.forEach((h, i) => {
    const col = i % per, row = (i / per) | 0, x = L + col * (pw + 8), y = B - (rows - row) * 34 + 2, m = MOBS[h.spr];
    c.fillStyle = 'rgba(10,8,12,0.62)'; c.fillRect(x - 4, y - 2, pw, 30);
    c.imageSmoothingEnabled = false; c.globalAlpha = h.dead ? 0.35 : 1; c.drawImage(IMG.mobs, 0, m[0], m[1], m[2], x - 2, y - 2, 28, 28 * m[2] / m[1]); c.globalAlpha = 1;
    font(c, 500, 14, F_HUD); label(c, h.def.name, x + 28, y + 10, h.dead ? '#8a5048' : '#efe4cc'); const nw = c.measureText(h.def.name).width; font(c, 500, 11, F_HUD); label(c, h.dead ? 'FALLEN' : heroTitle(h), x + 32 + nw, y + 10, h.dead ? '#8a5048' : `rgba(${COL[h.def.col]},0.9)`);
    const f = h.dead ? 0 : clamp(h.hp / h.maxHp, 0, 1); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x + 28, y + 14, 58, 5); c.fillStyle = f > 0.5 ? '#6cf08a' : f > 0.25 ? '#ffd24a' : '#ff4a3a'; c.fillRect(x + 28, y + 14, 58 * f, 5);
    const ul = h.ult / 100, ready = ul >= 1; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x + 28, y + 21, 58, 3); if (ultUnlocked(h)) { c.fillStyle = ready ? `rgba(${COL[h.def.col]},${0.7 + 0.3 * Math.sin(G.time * 10)})` : `rgba(${COL[h.def.col]},0.7)`; c.fillRect(x + 28, y + 21, 58 * ul, 3); } else { font(c, 500, 10, F_HUD); label(c, 'ULT ' + HERO_PROG[h.key].ult, x + 90, y + 25, '#6f6658'); }
  });
  // wave pips (top centre)
  if (G.phase === 'fight' && G.wave > 0 && !(G.boss && alive(G.boss))) { const n = G.waves, gap = 13, x0 = W / 2 - (n - 1) * gap / 2, y = T + 8; for (let k = 0; k < n; k++) { const done = k < G.wave - 1, cur = k === G.wave - 1, s = cur ? 4.5 + Math.sin(G.time * 6) : 3.5; c.save(); c.translate(x0 + k * gap, y); c.rotate(Math.PI / 4); c.fillStyle = done ? '#ffd860' : cur ? '#ff7a4a' : 'rgba(255,255,255,0.18)'; c.fillRect(-s / 2, -s / 2, s, s); c.restore(); } font(c, 500, 13, F_HUD); spaced(c, (G.wave === n ? 'FINAL WAVE' : 'WAVE ' + G.wave + ' OF ' + n) + (G.spawnQ.length ? '  ·  ' + G.spawnQ.length + ' INBOUND' : ''), W / 2, y + 18, 1.6, G.wave === n ? '#ff7a4a' : '#bfae90', 'center'); }
  // warlord bar
  const ch = G.champ; if (ch && alive(ch) && !(G.boss && alive(G.boss))) { const bw = Math.min(W * 0.36, 300), bx = W / 2 - bw / 2, by = T + 50; font(c, 900, 17, F_DISP); label(c, ch.title, W / 2, by - 5, '#ffb8a0', { align: 'center', stroke: 4 }); c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(bx - 2, by - 2, bw + 4, 8); c.fillStyle = '#c8301e'; c.fillRect(bx, by, bw * clamp(ch.hp / ch.maxHp, 0, 1), 4); }
  // boss bar
  const b = G.boss; if (b && alive(b)) { const bw = Math.min(W * 0.5, 420), bx = W / 2 - bw / 2, by = T + 26; font(c, 900, 20, F_DISP); label(c, b.def.name, W / 2, by - 6, '#f4d8b0', { align: 'center', stroke: 4 }); c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(bx - 2, by - 2, bw + 4, 9); const f = clamp(b.hp / b.maxHp, 0, 1); c.fillStyle = '#5a0c10'; c.fillRect(bx, by, bw, 5); c.fillStyle = '#e8402e'; c.fillRect(bx, by, bw * f, 5); c.fillStyle = 'rgba(255,220,180,0.5)'; c.fillRect(bx, by, bw * f, 1); }
  // kill streak
  if (G.combo >= 10) { const t = G.combo, lbl = t >= 250 ? 'APOCALYPSE' : t >= 150 ? 'ANNIHILATION' : t >= 80 ? 'MASSACRE' : t >= 35 ? 'RAMPAGE' : 'KILLING SPREE', pul = 1 + Math.max(0, 0.3 - (2.6 - G.comboT)) ; font(c, 900, 30 * pul, F_DISP); label(c, '×' + t, R, T + 26, '#ffcf6a', { align: 'right', stroke: 5 }); font(c, 500, 15, F_HUD); spaced(c, lbl, R, T + 42, 2, '#ff8a4a', 'right'); }
  if (G.callout && G.callout.t < 1.4) { const u = G.callout.t / 1.4; c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; font(c, 900, 22 * (G.callout.t < 0.1 ? 1.6 - G.callout.t * 6 : 1), F_DISP); label(c, G.callout.txt, R, T + 70, '#ffffff', { align: 'right', stroke: 5 }); c.globalAlpha = 1; }
  // ultimate banner
  const bn = G.banner; if (bn) {
    const u = bn.t / bn.life, a = u > 0.8 ? (1 - u) / 0.2 : 1, s = bn.t < 0.14 ? 2.2 - bn.t / 0.14 * 1.2 : 1, sz = clamp(big / 7, 28, 72) * s, jx = bn.t < 0.5 ? rand(-3, 3) * (1 - bn.t * 2) : 0, y = H * 0.27 + sz * 0.3, cc = COL[bn.col] || COL.gold;
    const grad = c.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(0.5, 'rgba(0,0,0,0.5)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a; c.fillStyle = grad; c.fillRect(0, y - sz * 0.85, W, sz * 1.35);
    font(c, 900, sz, F_DISP); c.shadowColor = `rgba(${cc},0.95)`; c.shadowBlur = 24; label(c, bn.a, W / 2 + jx, y, '#fff6e0', { align: 'center' }); c.shadowBlur = 0; label(c, bn.a, W / 2 + jx, y, `rgba(${cc},0.35)`, { align: 'center' });
    if (bn.b) { font(c, 500, clamp(big / 26, 13, 22), F_HUD); spaced(c, bn.b, W / 2, y + sz * 0.42, 3, `rgb(${cc})`, 'center'); }
    c.globalAlpha = 1;
  }
  // floor card and fades
  if (G.fade > 0.001) { c.fillStyle = `rgba(4,3,5,${G.fade})`; c.fillRect(0, 0, W, H); }
  const cd = G.card; if (cd) { const u = cd.t / cd.life, a = u < 0.15 ? u / 0.15 : u > 0.75 ? (1 - u) / 0.25 : 1; c.globalAlpha = a; font(c, 900, clamp(big / 5, 34, 90), F_DISP); c.shadowColor = 'rgba(255,140,40,0.8)'; c.shadowBlur = 30; label(c, cd.a, W / 2, H / 2, '#f6e2bc', { align: 'center' }); c.shadowBlur = 0; font(c, 500, clamp(big / 24, 14, 24), F_HUD); spaced(c, cd.b, W / 2, H / 2 + clamp(big / 14, 22, 40), 4, '#c8a878', 'center'); c.globalAlpha = 1; }
  if (UI.titleT < 4.5) { const u = UI.titleT / 4.5, a = u < 0.1 ? u / 0.1 : u > 0.7 ? (1 - u) / 0.3 : 1; c.globalAlpha = a; c.fillStyle = 'rgba(4,3,5,0.55)'; c.fillRect(0, 0, W, H); font(c, 900, clamp(big / 4.2, 40, 120), F_DISP); c.shadowColor = 'rgba(120,160,255,0.9)'; c.shadowBlur = 36; label(c, 'Cellar of Ruin', W / 2, H * 0.47, '#f8f0e0', { align: 'center' }); c.shadowBlur = 0; font(c, 500, clamp(big / 22, 14, 26), F_HUD); spaced(c, 'THE BATTLE FIGHTS ITSELF  ·  YOU WATCH', W / 2, H * 0.47 + clamp(big / 10, 30, 60), 4, '#c8b48c', 'center'); c.globalAlpha = 1; }
  if (H > W * 1.15) { font(c, 500, 15, F_HUD); c.globalAlpha = 0.7; spaced(c, 'TURN SIDEWAYS FOR THE FULL SHOW', W / 2, H * 0.82, 2, '#c8b48c', 'center'); c.globalAlpha = 1; }
  // sound
  font(c, 500, 15, F_HUD); const st = !SFX.ctx ? 'TAP FOR SOUND' : SFX.on ? 'SOUND ON' : 'SOUND OFF', tw = c.measureText(st).width + 14 * 1.2;
  c.globalAlpha = !SFX.ctx ? 0.6 + 0.4 * Math.sin(performance.now() / 300) : 0.55; spaced(c, st, R, B - 4, 1.2, '#f0e0c0', 'right'); c.globalAlpha = 1;
  UI.soundRect = [R - tw - 12, B - 26, tw + 24, 34];
}
