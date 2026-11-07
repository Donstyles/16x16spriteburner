// ===== HUD, menus and screens =====
const H = { cvs: null, ctx: null, W: 0, H: 0, dpr: 1, sl: 0, sr: 0, st: 0, sb: 0, barTop: 0, viewScaleX: 1, viewScaleY: 1, btn: {} };
const SERIF = 'Georgia, "Times New Roman", Times, serif';
function hudInit(cvs) { H.cvs = cvs; H.ctx = cvs.getContext('2d'); }
function hudResize(w, h, dpr, ins) {
  H.W = w; H.H = h; H.dpr = dpr; H.cvs.width = Math.round(w * dpr); H.cvs.height = Math.round(h * dpr);
  H.cvs.style.width = w + 'px'; H.cvs.style.height = h + 'px';
  H.sl = ins.l; H.sr = ins.r; H.st = ins.t; H.sb = ins.b;
  H.barTop = h - 66 - H.sb;
}
function worldToScreen(x, y, z) {
  const dirX = Math.cos(S.pa), dirY = Math.sin(S.pa), planeX = -dirY * R.planeLen, planeY = dirX * R.planeLen;
  const sx = x - S.px, sy = y - S.py, invDet = 1 / (planeX * dirY - dirX * planeY);
  const tx = invDet * (dirY * sx - dirX * sy), ty = invDet * (-planeY * sx + planeX * sy);
  if (ty <= 0.1) return null;
  const ix = (R.VW / 2) * (1 + tx / ty), iy = R.horizon + (R.camZ - z) * R.projV / ty;
  const col = ix | 0; if (col < 0 || col >= R.VW) return null;
  if (R.zbuf[col] < ty) return null;
  return { x: ix * H.viewScaleX, y: iy * H.viewScaleY, d: ty };
}
function serifText(ctx, text, x, y, size, color, align = 'center', spacing = 0, bold = true) {
  ctx.font = (bold ? 'bold ' : '') + size + 'px ' + SERIF; ctx.textBaseline = 'middle';
  if (!spacing) { ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(text, x, y); return; }
  let w = 0; const ws = []; for (const ch of text) { const cw = ctx.measureText(ch).width + spacing; ws.push(cw); w += cw; }
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.textAlign = 'left'; ctx.fillStyle = color;
  [...text].forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i]; });
}
function panel(ctx, x, y, w, h, alpha = 0.82) {
  ctx.fillStyle = 'rgba(8,7,12,' + alpha + ')'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(190,160,100,0.55)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
}
function bar(ctx, x, y, w, h, frac, color, back = '#1a1418', trail) {
  ctx.fillStyle = back; ctx.fillRect(x, y, w, h);
  if (trail !== undefined && trail > frac) { ctx.fillStyle = '#c8a040'; ctx.fillRect(x, y, w * clamp(trail, 0, 1), h); }
  ctx.fillStyle = color; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, y, w * clamp(frac, 0, 1), Math.max(1, h / 3));
  ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function circleBtn(ctx, id, cx, cy, r, label, iconSpr, active, sub, color = 'rgba(20,16,24,0.72)') {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = active ? 'rgba(90,60,30,0.85)' : color; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = active ? '#ffd27a' : 'rgba(210,180,120,0.8)'; ctx.stroke();
  if (iconSpr) { const im = spriteCanvas(getSprite(iconSpr), 0, 2); const s = r * 0.95; ctx.drawImage(im, cx - s / 2, cy - s / 2 - (label ? 4 : 0), s, s); }
  if (label) drawText(ctx, label, cx, cy + r * 0.38, 1, '#e8dcc0', 'center');
  if (sub) drawText(ctx, sub, cx + r * 0.55, cy - r * 0.9, 2, '#ffe9a0', 'center');
  Input.buttons.push({ id, x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
}
function rectBtn(ctx, id, x, y, w, h, label, sel, disabled, sub) {
  ctx.fillStyle = sel ? 'rgba(120,90,40,0.75)' : 'rgba(30,26,34,0.85)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = sel ? '#ffd27a' : 'rgba(170,150,110,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  drawText(ctx, label, x + 12, y + (sub ? 7 : (h - 14) / 2), 2, disabled ? '#6b6560' : '#f0e4c8');
  if (sub) drawText(ctx, sub, x + 12, y + h - 16, 1, disabled ? '#5a5550' : '#b8a888');
  if (!disabled) Input.buttons.push({ id, x, y, w, h });
}

function drawHUD(dt) {
  const ctx = H.ctx, W = H.W, HH = H.H;
  ctx.setTransform(H.dpr, 0, 0, H.dpr, 0, 0);
  ctx.clearRect(0, 0, W, HH);
  ctx.imageSmoothingEnabled = false;
  Input.buttons.length = 0;
  if (S.mode === 'title') { drawTitle(ctx); return; }
  if (S.mode === 'victory') { drawVictory(ctx); return; }
  drawWorldFx(ctx);
  drawOverlays(ctx);
  if (S.mode === 'play' && !Input.hideWeapon) drawWeapon(ctx);
  if (S.mode === 'play' || S.mode === 'menu' || S.mode === 'dead') {
    drawPortraits(ctx);
    if (S.mode === 'play') {
      drawEnemyBars(ctx); drawCrosshair(ctx); drawTarget(ctx); drawMinimap(ctx); drawSouls(ctx); drawStamina(ctx); drawBossBar(ctx); drawButtons(ctx); drawMessages(ctx); drawItemCard(ctx);
    }
  }
  drawCenter(ctx);
  if (S.mode === 'menu') drawMenu(ctx);
  if (S.mode === 'dead') drawDead(ctx);
  if (S.fade) { const a = clamp(S.fade.t / S.fade.dur, 0, 1); ctx.fillStyle = S.fade.color; ctx.globalAlpha = a; ctx.fillRect(0, 0, W, HH); ctx.globalAlpha = 1; }
}
function drawWorldFx(ctx) {
  for (const f of S.fx) {
    if (f.kind === 'text') {
      const k = 1 - f.t / f.dur; const p = worldToScreen(f.x, f.y, f.z + k * 0.5); if (!p) continue;
      const sc = Math.max(1, Math.round(f.scale * Math.min(2.2, 2.2 / Math.sqrt(p.d)))); ctx.globalAlpha = f.t < 0.3 ? f.t / 0.3 : 1;
      drawText(ctx, f.text, p.x, p.y, sc, f.color, 'center'); ctx.globalAlpha = 1;
    } else {
      const p = worldToScreen(f.x, f.y, f.z); if (!p) continue;
      const s = Math.max(1.5, f.size * 2.2 / p.d); ctx.fillStyle = f.color; ctx.globalAlpha = clamp(f.t * 2, 0, 1); ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s); ctx.globalAlpha = 1;
    }
  }
}
function drawWeapon(ctx) {
  // first-person weapon feedback: sword sweep on melee, bow flash on ranged
  const W = H.W, HH = H.H, base = H.barTop;
  const sw = S.swing || 0, k = sw > 0 ? 1 - sw / 0.25 : 1; // 0..1 progress of the swing
  const restX = Input.isTouch ? W - H.sr - 270 : W - H.sr - 150, restY = base + 40;
  const im = spriteCanvas(getSprite('sword_gold'), 0, 4);
  const size = Math.min(150, HH * 0.42);
  ctx.save();
  if (sw > 0) {
    const ang = -0.9 + Math.sin(k * Math.PI) * 1.6, px = restX - Math.sin(k * Math.PI) * size * 0.9, py = restY - Math.sin(k * Math.PI) * size * 0.75;
    ctx.translate(px, py); ctx.rotate(ang);
    ctx.globalAlpha = 0.95; ctx.drawImage(im, -size * 0.1, -size * 0.9, size, size);
  } else if (S.mode === 'play') {
    const bob = Math.sin(S.walkT * 9) * 3, breathe = Math.sin(S.t * 1.5) * 2;
    ctx.translate(restX + 30, restY + 18 + bob + breathe); ctx.rotate(-0.55);
    ctx.globalAlpha = 0.9; ctx.drawImage(im, -size * 0.1, -size * 0.9, size, size);
  }
  ctx.restore();
  if (S.rangedFlash > 0) { const cx = W / 2, cy = H.barTop / 2 + S.pitch * H.viewScaleY; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40); g.addColorStop(0, 'rgba(255,230,160,' + (S.rangedFlash * 1.6) + ')'); g.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 40, cy - 40, 80, 80); }
}
function drawOverlays(ctx) {
  const W = H.W, HH = H.H;
  { const g = ctx.createRadialGradient(W / 2, HH / 2, HH * 0.45, W / 2, HH / 2, HH * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH); }
  if (S.hurtT > 0 || S.party.some(m => !m.dead && m.hp < m.hpMax * 0.25)) {
    const low = S.party.some(m => !m.dead && m.hp < m.hpMax * 0.25) ? 0.25 + Math.sin(S.t * 4) * 0.08 : 0;
    const a = Math.max(low, S.hurtT * 1.2);
    const g = ctx.createRadialGradient(W / 2, HH / 2, HH * 0.35, W / 2, HH / 2, HH * 0.85); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, 'rgba(140,0,0,' + clamp(a, 0, 0.75) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
  }
  if (S.healFx > 0) { ctx.fillStyle = 'rgba(90,255,120,' + (S.healFx * 0.18) + ')'; ctx.fillRect(0, 0, W, HH); }
  if (S.chill > 0) { ctx.fillStyle = 'rgba(120,180,255,' + Math.min(0.18, S.chill * 0.08) + ')'; ctx.fillRect(0, 0, W, HH); }
  if (S.venom > 0) { ctx.fillStyle = 'rgba(80,200,40,' + Math.min(0.14, S.venom * 0.05) + ')'; ctx.fillRect(0, 0, W, HH); }
  if (S.bulwark > 0) { ctx.strokeStyle = 'rgba(216,179,106,' + Math.min(0.8, S.bulwark * 0.4) + ')'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, HH - 6); }
}
function drawCrosshair(ctx) {
  const cx = H.W / 2, cy = H.barTop / 2 + S.pitch * H.viewScaleY; const sw = S.swing > 0 ? 1 + S.swing * 4 : 1;
  ctx.strokeStyle = S.target ? '#ff7a5a' : 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 7 * sw, cy); ctx.lineTo(cx - 3, cy); ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 7 * sw, cy); ctx.moveTo(cx, cy - 7 * sw); ctx.lineTo(cx, cy - 3); ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 7 * sw); ctx.stroke();
  const f = S.focus; const label = focusLabel(f);
  if (label) {
    const y = H.barTop * 0.6 + S.pitch * 0.5;
    const w = textWidth(label, 2) + 28; const x = H.W / 2 - w / 2;
    ctx.fillStyle = 'rgba(10,8,14,0.78)'; ctx.fillRect(x, y, w, 26); ctx.strokeStyle = 'rgba(210,180,120,0.7)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 25);
    drawText(ctx, label, H.W / 2, y + 6, 2, '#ffe9a0', 'center');
    if (!Input.isTouch) drawText(ctx, '[E]', x + w - 6, y - 10, 1, '#b8a888', 'right');
    Input.buttons.push({ id: 'interact', x, y, w, h: 26 });
  }
}
function drawEnemyBars(ctx) {
  for (const e of S.enemies) {
    if (e.dead || e.boss || e.hp >= e.hpMax || (e.state === 'sleep')) continue;
    if (S.t - (e.lastHit || -99) > 6 && e.state !== 'windup') continue;
    const p = worldToScreen(e.x, e.y, e.zoff + e.def.size + 0.12); if (!p || p.d > 9) continue;
    const w = clamp(60 / p.d, 14, 46);
    bar(ctx, p.x - w / 2, p.y - 3, w, 3, e.hp / e.hpMax, e === S.target ? '#ff5a3a' : '#b8282a', 'rgba(20,10,10,0.8)');
  }
}
function drawTarget(ctx) {
  const e = S.target; if (!e || e.boss) return;
  const cx = H.W / 2, y = H.st + 10;
  drawText(ctx, e.name, cx, y, 2, '#f0e4c8', 'center');
  bar(ctx, cx - 70, y + 18, 140, 6, e.hp / e.hpMax, '#c0302a');
}
function drawBossBar(ctx) {
  const b = S.boss; if (!b || b.dead) return;
  const w = Math.min(560, H.W * 0.6), x = H.W / 2 - w / 2, y = H.barTop - 44;
  serifText(ctx, b.name, H.W / 2, y - 10, 15, '#f3e9d2', 'center', 1);
  b.trail = b.trail === undefined ? b.hp / b.hpMax : lerp(b.trail, b.hp / b.hpMax, 0.03);
  bar(ctx, x, y, w, 10, b.hp / b.hpMax, '#b8231d', '#15100f', b.trail);
  drawText(ctx, Math.ceil(b.hp) + '', x + w - 2, y + 12, 1, '#c8b8a0', 'right');
}
function drawSouls(ctx) {
  const x = H.W - H.sr - 12, y = H.st + 10;
  const im = spriteCanvas(getSprite('soulglow'), 0, 1);
  ctx.drawImage(im, x - 18, y - 2, 18, 18);
  drawText(ctx, fmtNum(S.souls), x - 22, y + 2, 2, '#d8f0e0', 'right');
  if (S.soulPop) { S.soulPop.t -= 1 / 60; if (S.soulPop.t <= 0) S.soulPop = null; else { ctx.globalAlpha = Math.min(1, S.soulPop.t); drawText(ctx, '+' + fmtNum(S.soulPop.n), x - 22, y + 20, 1, '#b8ffd0', 'right'); ctx.globalAlpha = 1; } }
  // pause button
  circleBtn(ctx, 'menu', x - 16, y + 48, 14, null, null, false, null); drawText(ctx, '=', x - 16, y + 42, 2, '#e8dcc0', 'center');
}
function drawStamina(ctx) {
  const w = Math.min(300, H.W * 0.3), x = H.W / 2 - w / 2, y = H.barTop - 14;
  bar(ctx, x, y, w, 7, S.stam / S.stamMax, S.stam < 20 ? '#c08a30' : '#5fa84a', '#15181a');
}
function drawMinimap(ctx) {
  const size = 92, x0 = H.sl + 10, y0 = H.st + 10, cs = 4, rad = (size / cs / 2) | 0;
  ctx.fillStyle = 'rgba(6,5,9,0.75)'; ctx.fillRect(x0, y0, size, size);
  const pcx = S.px | 0, pcy = S.py | 0;
  const THEME_COL = { stone: '#8a6a4a', crypt: '#5a4a5a', moss: '#4f7a3a', ice: '#5a88c8', ember: '#c8702a', grey: '#8a8a96', cosmic: '#7a4ab8', violet: '#8a5ad0', slime: '#3aa0a8' };
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, size, size); ctx.clip();
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    const cx = pcx + dx, cy = pcy + dy; if (cx < 0 || cy < 0 || cx >= MW || cy >= MH) continue;
    const i = cy * MW + cx; let seen = false;
    for (let oy = -2; oy <= 2 && !seen; oy++) for (let ox = -2; ox <= 2; ox++) { const nx = cx + ox, ny = cy + oy; if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && MAP.explored[ny * MW + nx]) { seen = true; break; } }
    if (!seen) continue;
    const t = MAP.type[i]; let col;
    if (t === 1) col = THEME_COL[ZONES[MAP.zone[i]].theme] || '#888'; else if (t === 2) { const d = MAP.doors[MAP.doorIdx[i]]; col = d.removed ? '#2a2630' : d.fog ? '#e8e8f8' : '#a06a30'; } else if (t === 3) col = '#ff6a20'; else col = '#2a2630';
    ctx.fillStyle = col; ctx.fillRect(x0 + (dx + rad) * cs - (S.px - pcx - 0.5) * cs, y0 + (dy + rad) * cs - (S.py - pcy - 0.5) * cs, cs, cs);
  }
  for (const b of S.bonfires) { const dx = b.x - S.px, dy = b.y - S.py; if (Math.abs(dx) <= rad && Math.abs(dy) <= rad && MAP.explored[(b.y | 0) * MW + (b.x | 0)]) { ctx.fillStyle = b.lit ? '#ffb040' : '#806040'; ctx.fillRect(x0 + size / 2 + dx * cs - 2, y0 + size / 2 + dy * cs - 2, 4, 4); } }
  for (const e of S.enemies) { if (e.dead || e.state === 'sleep') continue; const dx = e.x - S.px, dy = e.y - S.py; if (Math.abs(dx) <= rad && Math.abs(dy) <= rad && (e.state !== 'idle' || Math.hypot(dx, dy) < 6)) { ctx.fillStyle = e.boss ? '#ff3030' : '#e04040'; ctx.fillRect(x0 + size / 2 + dx * cs - 1.5, y0 + size / 2 + dy * cs - 1.5, 3, 3); } }
  if (S.bloodstain) { const dx = S.bloodstain.x - S.px, dy = S.bloodstain.y - S.py; if (Math.abs(dx) <= rad && Math.abs(dy) <= rad) { ctx.fillStyle = '#60ff90'; ctx.fillRect(x0 + size / 2 + dx * cs - 2, y0 + size / 2 + dy * cs - 2, 4, 4); } }
  // player arrow
  const cx = x0 + size / 2, cy = y0 + size / 2; ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(cx + Math.cos(S.pa) * 5, cy + Math.sin(S.pa) * 5); ctx.lineTo(cx + Math.cos(S.pa + 2.5) * 4, cy + Math.sin(S.pa + 2.5) * 4); ctx.lineTo(cx + Math.cos(S.pa - 2.5) * 4, cy + Math.sin(S.pa - 2.5) * 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(190,160,100,0.6)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, size - 1, size - 1);
  const z = zoneAt(S.px, S.py); drawText(ctx, z.name, x0, y0 + size + 4, 1, '#b8a888');
}
function drawPortraits(ctx) {
  const n = S.party.length, slotW = Math.min(118, (H.W - H.sl - H.sr - 20) / 4), gap = 4, total = n * slotW + (n - 1) * gap, x0 = H.W / 2 - total / 2, y0 = H.barTop + 4, slotH = 58;
  ctx.fillStyle = 'rgba(8,7,12,0.8)'; ctx.fillRect(0, H.barTop, H.W, H.H - H.barTop);
  ctx.fillStyle = 'rgba(190,160,100,0.35)'; ctx.fillRect(0, H.barTop, H.W, 1);
  S.party.forEach((m, i) => {
    const x = x0 + i * (slotW + gap), y = y0;
    const hurtOff = m.hurt > 0 ? Math.sin(S.t * 60) * 2 * m.hurt : 0;
    ctx.fillStyle = m.dead ? 'rgba(20,10,10,0.9)' : 'rgba(26,22,30,0.95)'; ctx.fillRect(x, y, slotW, slotH);
    ctx.strokeStyle = m.cd <= 0 && !m.dead ? m.def.color : 'rgba(110,100,90,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1);
    // portrait
    const spr = getSprite(m.spr); const frame = m.dead ? 0 : ((S.t * 4 + i) | 0) % spr.frames.length;
    const im = spriteCanvas(spr, frame, 3); const bsc = 1 + (m.bounce > 0 ? m.bounce * 0.12 : 0);
    ctx.save(); ctx.translate(x + 26 + hurtOff, y + 29); ctx.scale(bsc, bsc);
    if (m.dead) ctx.globalAlpha = 0.35;
    ctx.drawImage(im, -22, -22, 44, 44); ctx.restore();
    if (m.hurt > 0) { ctx.fillStyle = 'rgba(255,40,30,' + (m.hurt * 0.5) + ')'; ctx.fillRect(x + 2, y + 2, 48, slotH - 4); }
    if (m.heal > 0) { ctx.fillStyle = 'rgba(80,255,120,' + (m.heal * 0.35) + ')'; ctx.fillRect(x + 2, y + 2, 48, slotH - 4); }
    if (m.dead) { const sk = spriteCanvas(getSprite('skull'), 0, 2); ctx.drawImage(sk, x + 10, y + 13, 32, 32); }
    // text & bars
    const tx = x + 54, tw = slotW - 58;
    drawText(ctx, m.name, tx, y + 5, 1, m.dead ? '#8a6a6a' : '#f0e4c8');
    drawText(ctx, 'L' + m.level, x + slotW - 4, y + 5, 1, '#b8a888', 'right');
    bar(ctx, tx, y + 15, tw, 6, m.hp / m.hpMax, m.hp < m.hpMax * 0.25 ? '#ff5030' : '#b8282a');
    drawText(ctx, Math.ceil(m.hp) + '/' + m.hpMax, tx + tw, y + 22, 1, '#c8b8a0', 'right');
    bar(ctx, tx, y + 31, tw, 4, m.spts / m.spMax, '#3a6ac8');
    // ability
    const ab = ABILITIES[m.def.ability]; const ready = !m.dead && m.cd <= 0 && (!ab.sp || m.spts >= ab.sp) && (!ab.stam || S.stam >= ab.stam);
    drawText(ctx, ab.name.toUpperCase(), tx, y + 39, 1, ready ? '#ffe9a0' : '#7a7068');
    if (m.cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(tx, y + 38, tw * (m.cd / ab.cd), 9); drawText(ctx, Math.ceil(m.cd) + 's', tx + tw, y + 48, 1, '#b8a888', 'right'); }
    else drawText(ctx, ab.sp ? ab.sp + ' SP' : ab.stam + ' ST', tx + tw, y + 48, 1, '#8aa0b8', 'right');
    if (!Input.isTouch) drawText(ctx, '[' + (i + 1) + ']', tx, y + 48, 1, '#8a8078');
    if (m.rec > 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x + 4, y + 51, 44 * clamp(m.rec / recoveryTime(m), 0, 1), 3); }
    if (m.dmgPop) { drawText(ctx, '-' + m.dmgPop.n, x + 26, y - 12 - (1 - m.dmgPop.t) * 10, 2, '#ff6a50', 'center'); }
    if (!m.dead && S.mode === 'play') Input.buttons.push({ id: 'ab' + (i + 1), x, y, w: slotW, h: slotH });
  });
}
function drawButtons(ctx) {
  if (!Input.isTouch) {
    drawText(ctx, 'WASD move  mouse look  SPACE attack  SHIFT dodge  F flask  E interact  1-4 abilities', H.W - H.sr - 8, H.barTop - 26, 1, 'rgba(200,180,150,0.5)', 'right');
  }
  const bx = H.W - H.sr - 64, by = H.barTop - 74;
  if (Input.isTouch) {
    circleBtn(ctx, 'attack', bx, by, 38, 'ATTACK', 'sword_gold', Input.held.attack, null, S.stam < 10 ? 'rgba(60,20,20,0.7)' : undefined);
    circleBtn(ctx, 'dodge', bx - 86, by + 30, 27, 'DODGE', null, Input.held.dodge);
    circleBtn(ctx, 'flask', bx - 86, by - 44, 27, 'FLASK', 'potion_red', false, S.estus + '');
    if (S.target && S.target.boss === false) { }
  }
  if (!Input.isTouch) { drawText(ctx, 'FLASK ' + S.estus + '/' + S.estusMax, H.W - H.sr - 8, H.barTop - 40, 1, '#ffb080', 'right'); }
  // joystick
  if (Input.joy) {
    const j = Input.joy; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(j.ox, j.oy, 46, 0, TAU); ctx.stroke();
    const dx = j.x - j.ox, dy = j.y - j.oy, d = Math.hypot(dx, dy), m = Math.min(1, d / 46); const kx = j.ox + (d ? dx / d * m * 46 : 0), ky = j.oy + (d ? dy / d * m * 46 : 0);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(kx, ky, 18, 0, TAU); ctx.fill();
  } else if (Input.isTouch && S.playTime < 14) { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(H.sl + 90, H.barTop - 90, 46, 0, TAU); ctx.stroke(); drawText(ctx, 'MOVE', H.sl + 90, H.barTop - 95, 1, 'rgba(255,255,255,0.4)', 'center'); drawText(ctx, 'DRAG HERE TO LOOK', H.W - H.sr - 300, H.st + 60, 1, 'rgba(255,255,255,0.4)', 'center'); }
}
function drawMessages(ctx) {
  let y = H.barTop - 36;
  for (let i = S.msgs.length - 1; i >= 0; i--) { const m = S.msgs[i]; ctx.globalAlpha = clamp(m.time, 0, 1); drawText(ctx, m.t, H.sl + 10, y, 1, '#e8dcc0'); y -= 11; }
  ctx.globalAlpha = 1;
}
function drawItemCard(ctx) {
  const c = S.itemCard; if (!c) return;
  const def = ITEM_DEFS[c.item]; const w = Math.max(220, textWidth(def.name, 2) + 70), x = H.W / 2 - w / 2, y = H.barTop - 110;
  ctx.globalAlpha = clamp(c.t, 0, 1); panel(ctx, x, y, w, 46, 0.9);
  const im = spriteCanvas(getSprite(def.icon), 0, 2); ctx.drawImage(im, x + 10, y + 7, 32, 32);
  drawText(ctx, def.name, x + 52, y + 9, 2, '#ffe9a0'); drawText(ctx, 'acquired', x + 52, y + 28, 1, '#b8a888');
  ctx.globalAlpha = 1;
  Input.buttons.push({ id: 'itemcard', x, y, w, h: 46 });
}
function drawCenter(ctx) {
  const c = S.center; if (!c) return;
  const k = c.t / c.dur; const a = k > 0.85 ? (1 - k) / 0.15 : k < 0.25 ? k / 0.25 : 1;
  ctx.globalAlpha = clamp(a, 0, 1);
  const y = H.H * 0.38;
  if (c.kind === 'area') {
    serifText(ctx, c.text, H.W / 2, y, Math.min(34, H.W / 18), '#e9e2d0', 'center', 3);
    ctx.fillStyle = 'rgba(233,226,208,0.6)'; ctx.fillRect(H.W / 2 - 140, y + 22, 280, 1);
    if (c.sub) serifText(ctx, c.sub, H.W / 2, y + 40, 14, '#b8a888', 'center', 1, false);
  } else if (c.kind === 'bonfire') {
    serifText(ctx, c.text, H.W / 2, y, Math.min(40, H.W / 16), '#ffb347', 'center', 4);
  } else if (c.kind === 'victory') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y - 34, H.W, 68);
    serifText(ctx, c.text, H.W / 2, y, Math.min(40, H.W / 16), '#e8c060', 'center', 5);
  }
  ctx.globalAlpha = 1;
}
function drawDead(ctx) {
  const t = S.deathT; const a = clamp(t / 1.2, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,' + (a * 0.75) + ')'; ctx.fillRect(0, 0, H.W, H.H);
  const y = H.H * 0.42; ctx.fillStyle = 'rgba(0,0,0,' + (a * 0.5) + ')'; ctx.fillRect(0, y - 40, H.W, 80);
  ctx.globalAlpha = a; const size = Math.min(64, H.W / 10) * (1 + t * 0.012);
  serifText(ctx, 'YOU DIED', H.W / 2, y, size, '#9b1a16', 'center', 6);
  ctx.globalAlpha = 1;
}
// ---- menus ----
function menuItems() {
  const m = S.menu, items = [];
  if (m.kind === 'bonfire') {
    items.push({ label: 'Rest', sub: 'Heal, revive, refill flask. Enemies return.', act: () => { restAtBonfire(m.bonfire); closeMenu(); showCenter('RESTED', null, 1.5, 'bonfire'); } });
    items.push({ label: 'Level up', sub: 'Spend souls to strengthen a companion', act: () => { S.menu = { kind: 'levelup', sel: 0, back: m }; } });
    const lit = S.bonfires.filter(b => b.lit && b !== m.bonfire);
    items.push({ label: 'Travel', sub: lit.length ? 'Warp to another lit bonfire' : 'No other bonfires lit', disabled: !lit.length, act: () => { S.menu = { kind: 'travel', sel: 0, back: m }; } });
    items.push({ label: 'Leave', act: closeMenu });
  } else if (m.kind === 'levelup') {
    if (m.member === undefined) {
      S.party.forEach((p, i) => items.push({ label: p.name + '  L' + p.level + '  ' + p.cls, sub: 'MT ' + p.mt + '  EN ' + p.en + '  IT ' + p.it + '  SP ' + p.sp + '   cost ' + fmtNum(levelCost(p.level)), disabled: S.souls < levelCost(p.level), act: () => { m.member = i; m.sel = 0; } }));
      items.push({ label: 'Back', act: () => { S.menu = m.back || null; if (!S.menu) closeMenu(); } });
    } else {
      const p = S.party[m.member];
      for (const st of ['mt', 'en', 'it', 'sp']) items.push({ label: STAT_NAMES[st] + '  ' + p[st] + ' > ' + (p[st] + (st === 'en' ? 2 : 1)), sub: STAT_DESC[st], act: () => { if (levelUp(p, st)) { message(p.name + ' reaches level ' + p.level + '.'); } m.member = undefined; m.sel = 0; } });
      items.push({ label: 'Back', act: () => { m.member = undefined; m.sel = 0; } });
    }
  } else if (m.kind === 'travel') {
    for (const b of S.bonfires.filter(b => b.lit)) items.push({ label: b.name, act: () => { S.bonfire = b.id; closeMenu(); S.fade = { t: 1, dur: 1, color: '#000' }; respawn(); S.mode = 'play'; } });
    items.push({ label: 'Back', act: () => { S.menu = m.back; } });
  } else if (m.kind === 'keeper') {
    const lines = KEEPER_LINES;
    items.push({ label: 'Talk', sub: 'Hear what the Keeper knows', act: () => { m.line = (m.line + 1) % lines.length; m.said = lines[m.line]; } });
    for (const w of KEEPER_WARES) { const sold = S.flags.item['keeper_' + w.id]; items.push({ label: w.name + (sold ? '  (sold)' : '  ' + fmtNum(w.cost)), sub: w.sub, disabled: sold || S.souls < w.cost, act: () => { S.souls -= w.cost; S.flags.item['keeper_' + w.id] = 1; giveItem(w.item); m.said = 'Spend it well. Souls are the only coin the dark respects.'; saveGame(); } }); }
    items.push({ label: 'Leave', act: closeMenu });
  } else if (m.kind === 'items') {
    const keys = Object.keys(S.items);
    if (!keys.length) items.push({ label: 'The party carries nothing of note.', act: () => { } });
    for (const k of keys.slice(0, 6)) { const d = ITEM_DEFS[k]; items.push({ label: d.name + (S.items[k] > 1 ? '  x' + S.items[k] : ''), sub: d.lore.slice(0, 70), act: () => { S.menu = { kind: 'lore', text: d.name + '. ' + d.lore, back: m }; } }); }
    items.push({ label: 'Back', act: () => { S.menu = m.back; } });
  } else if (m.kind === 'lore') {
    items.push({ label: 'Close', act: () => { if (m.back) S.menu = m.back; else closeMenu(); } });
  } else if (m.kind === 'pause') {
    items.push({ label: 'Resume', act: closeMenu });
    items.push({ label: (Snd.muted ? 'Unmute' : 'Mute') + ' audio', act: () => { Snd.muted = !Snd.muted; if (Snd.master) Snd.master.gain.value = Snd.muted ? 0 : 0.5; } });
    items.push({ label: 'Look sensitivity: ' + (Input.sensT > 0.006 ? 'High' : Input.sensT > 0.0035 ? 'Normal' : 'Low'), act: () => { Input.sensT = Input.sensT > 0.006 ? 0.0028 : Input.sensT > 0.0035 ? 0.0075 : 0.0045; } });
    items.push({ label: 'Items', sub: Object.keys(S.items).length ? Object.keys(S.items).map(k => ITEM_DEFS[k].name).join(', ').slice(0, 60) : 'Nothing yet', act: () => { S.menu = { kind: 'items', sel: 0, back: m }; } });
    items.push({ label: 'Journal', sub: 'Souls ' + fmtNum(S.souls) + '  Deaths ' + S.deaths + '  Kills ' + S.kills + '  Bosses ' + S.bossKills + '  Time ' + fmtTime(S.playTime), act: () => { } });
    items.push({ label: 'Quit to title', sub: 'Progress is saved at bonfires', act: () => { saveGame(); S.mode = 'title'; S.menu = null; Snd.music('title'); } });
  }
  return items;
}
const KEEPER_LINES = [
  'Ah. Four more. The cell always opens for four; it is the only kindness this place still remembers.',
  'The Mandate of Heaven was a promise: a king on the throne, a flame in the Sanctum, the dark kept out. The flame guttered. The king stayed.',
  'Rest at the bonfires. Spend your souls there and grow strong, or hoard them and lose them to the dark. The choice is the whole of the game.',
  'Asterion guards the east gate. Beyond him the Mossgrave, where the Elder holds the Reliquary key in his roots. The sealed door below is his.',
  'Ice, then fire, then the sky that is not a sky. At the end of it sits the King. Relieve him of his crown, and the flame may yet catch.',
  'When one of you falls, the rest carry on. When all of you fall, you return here, lighter by every soul you carried. Try not to carry too many.',
  'I have kept this fire for longer than I had a name. Go on. I will be here when you die.',
];
const KEEPER_WARES = [
  { id: 'ember', name: 'Keeper\'s Ember', cost: 2500, sub: '+1 Estus Flask draught', item: 'ember' },
  { id: 'titanite', name: 'Titanite Shard', cost: 2000, sub: 'Reinforce all weapons', item: 'titanite' },
  { id: 'heart', name: 'Humanity', cost: 1200, sub: 'Raise max HP of all', item: 'heart' },
];
function fmtTime(s) { s |= 0; return ((s / 3600) | 0) + ':' + ('0' + ((s / 60) % 60 | 0)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); }
function closeMenu() { S.menu = null; S.mode = 'play'; Snd.sfx('ui'); }
function drawMenu(ctx) {
  const m = S.menu; if (!m) return;
  const items = menuItems(); m.items = items;
  const w = Math.min(480, H.W - H.sl - H.sr - 40), rowH = 44, titleH = 46;
  let bodyH = items.length * rowH + 16;
  let extraH = 0; if (m.kind === 'lore') extraH = 120; if (m.kind === 'keeper') extraH = 70;
  const h = titleH + bodyH + extraH, x = H.W / 2 - w / 2, y = Math.max(H.st + 6, H.H / 2 - h / 2 - 20);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, H.W, H.H);
  panel(ctx, x, y, w, h, 0.92);
  const title = { items: 'ITEMS', bonfire: 'BONFIRE', levelup: m.member !== undefined ? S.party[m.member].name.toUpperCase() + ' - CHOOSE A STAT' : 'LEVEL UP', travel: 'TRAVEL', keeper: 'THE KEEPER', lore: 'INSCRIPTION', pause: 'PAUSED' }[m.kind];
  serifText(ctx, title, x + w / 2, y + 24, 18, '#e8c060', 'center', 2);
  if (m.kind === 'bonfire' || m.kind === 'levelup' || m.kind === 'keeper') drawText(ctx, fmtNum(S.souls) + ' souls', x + w - 12, y + 10, 1, '#b8ffd0', 'right');
  let cy = y + titleH;
  if (m.kind === 'lore') { const lines = wrapText(m.text, 2, w - 40); lines.forEach((l, i) => drawText(ctx, l, x + 20, cy + 8 + i * 18, 2, '#e8dcc0')); cy += extraH; }
  if (m.kind === 'keeper') { const said = m.said || KEEPER_LINES[0]; const lines = wrapText(said, 1, w - 40); lines.forEach((l, i) => drawText(ctx, l, x + 20, cy + 6 + i * 11, 1, '#e8dcc0')); cy += extraH; }
  items.forEach((it, i) => { rectBtn(ctx, 'menu' + i, x + 12, cy + 8 + i * rowH, w - 24, rowH - 6, it.label, i === m.sel, it.disabled, it.sub); });
  if (!Input.isTouch) drawText(ctx, 'ARROWS / ENTER / ESC', x + w / 2, y + h - 12, 1, '#7a7068', 'center');
}
function menuInput() {
  const m = S.menu; if (!m) return; const items = m.items || menuItems();
  if (Input.consume('menu')) { if (m.kind === 'levelup' && m.member !== undefined) { m.member = undefined; } else if (m.back) S.menu = m.back; else closeMenu(); return; }
  if (Input.keys.ArrowUp && !m._ku) { m.sel = (m.sel - 1 + items.length) % items.length; Snd.sfx('ui'); } m._ku = !!Input.keys.ArrowUp;
  if (Input.keys.ArrowDown && !m._kd) { m.sel = (m.sel + 1) % items.length; Snd.sfx('ui'); } m._kd = !!Input.keys.ArrowDown;
  if (Input.consume('interact') || Input.consume('attack')) { const it = items[m.sel]; if (it && !it.disabled) { Snd.sfx('ui'); it.act(); } }
  for (let i = 0; i < items.length; i++) if (Input.consume('menu' + i)) { m.sel = i; const it = items[i]; if (!it.disabled) { Snd.sfx('ui'); it.act(); } }
}
// ---- title & victory ----
function drawTitle(ctx) {
  const W = H.W, HH = H.H;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, HH);
  const g = ctx.createLinearGradient(0, HH * 0.6, 0, HH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
  const ty = HH * 0.3;
  serifText(ctx, 'ASHEN MANDATE', W / 2, ty, Math.min(58, W / 11), '#e8c060', 'center', 8);
  ctx.fillStyle = 'rgba(232,192,96,0.5)'; ctx.fillRect(W / 2 - 160, ty + 36, 320, 1);
  serifText(ctx, 'a first-person tale of the Hollow Crown', W / 2, ty + 54, 14, '#c8b8a0', 'center', 1, false);
  const by = HH * 0.62, bw = 220;
  const has = hasSave();
  rectBtn(ctx, 'new', W / 2 - bw / 2, by - (has ? 26 : 0), bw, 40, has ? 'NEW GAME' : 'BEGIN', S.titleSel === 0);
  if (has) rectBtn(ctx, 'continue', W / 2 - bw / 2, by + 24, bw, 40, 'CONTINUE', S.titleSel === 1);
  drawText(ctx, 'Dungeon tiles by RunninBlood. Creature sprites from the Basic, Premium and Supporter asset packs.', W / 2, HH - H.sb - 30, 1, '#8a8078', 'center');
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone;
  const hint = ios ? 'iPhone: tap Share, then Add to Home Screen, for full screen play.' : Input.isTouch ? 'Best played in landscape, installed to your Home Screen.' : 'Click the view to capture the mouse. WASD + mouse, SPACE to attack.';
  drawText(ctx, hint, W / 2, HH - H.sb - 18, 1, ios ? '#e8c060' : '#8a8078', 'center');
}
function drawVictory(ctx) {
  const W = H.W, HH = H.H;
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, HH);
  serifText(ctx, 'THE MANDATE IS RELIT', W / 2, HH * 0.26, Math.min(44, W / 14), '#e8c060', 'center', 6);
  const lines = ['The Ashen King is unseated. The flame in the Sanctum catches, coughs, and holds.', 'Four walk back up through ice and fire and moss, past every bonfire they lit,', 'to a cell beneath the Undercroft whose door now, finally, closes behind them.', '', 'Time ' + fmtTime(S.playTime) + '   Deaths ' + S.deaths + '   Kills ' + S.kills + '   Souls ' + fmtNum(S.souls)];
  lines.forEach((l, i) => drawText(ctx, l, W / 2, HH * 0.4 + i * 16, 1, i === 4 ? '#b8ffd0' : '#e8dcc0', 'center'));
  rectBtn(ctx, 'continue', W / 2 - 110, HH * 0.72, 220, 40, 'KEEP EXPLORING', true);
  rectBtn(ctx, 'new', W / 2 - 110, HH * 0.72 + 50, 220, 40, 'TITLE', false);
}
