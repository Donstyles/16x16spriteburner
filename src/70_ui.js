// ===================== UI: HUD and widgets =====================
const U = { cvs: null, ctx: null, W: 0, H: 0, dpr: 1, ins: { l: 0, r: 0, t: 0, b: 0 }, barTop: 0, scroll: {} };
const SERIF = 'Georgia, "Times New Roman", serif';
const C = { gold: '#d4a94c', gold2: '#8a6a2a', stone: '#221c18', stone2: '#3a302a', parch: '#e8d8b0', parch2: '#c9b588', ink: '#2a1c10', text: '#ecdfc3', dim: '#9a8c74', red: '#c43a2e', blue: '#3b6fc9', green: '#4ea64a', hl: 'rgba(212,169,76,0.25)' };
function initUI(cvs) { U.cvs = cvs; U.ctx = cvs.getContext('2d'); }
function resizeUI(w, h, dpr, ins) { U.W = w; U.H = h; U.dpr = dpr; U.ins = ins; U.cvs.width = Math.round(w * dpr); U.cvs.height = Math.round(h * dpr); U.cvs.style.width = w + 'px'; U.cvs.style.height = h + 'px'; U.barTop = h - 70 - ins.b; }
function serif(ctx, s, x, y, size, color, align = 'center', spacing = 0) { ctx.font = 'bold ' + size + 'px ' + SERIF; ctx.textBaseline = 'middle'; ctx.fillStyle = color; if (!spacing) { ctx.textAlign = align; ctx.fillText(s, x, y); return; } let w = 0; const ws = [...s].map(ch => { const cw = ctx.measureText(ch).width + spacing; w += cw; return cw; }); let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; ctx.textAlign = 'left'; [...s].forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i]; }); }
function panel(ctx, x, y, w, h, style = 'stone') {
  if (style === 'parch') { ctx.fillStyle = C.parch; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.gold2; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); ctx.strokeStyle = 'rgba(138,106,42,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9); return; }
  ctx.fillStyle = style === 'dark' ? 'rgba(10,8,8,0.88)' : C.stone; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  ctx.fillStyle = C.gold; for (const [cx, cy] of [[x + 3, y + 3], [x + w - 6, y + 3], [x + 3, y + h - 6], [x + w - 6, y + h - 6]]) ctx.fillRect(cx, cy, 3, 3);
}
function bar(ctx, x, y, w, h, frac, color, back = '#1a1210') { ctx.fillStyle = back; ctx.fillRect(x, y, w, h); ctx.fillStyle = color; ctx.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), h); ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
function vbar(ctx, x, y, w, h, frac, color) { ctx.fillStyle = '#120e0c'; ctx.fillRect(x, y, w, h); const hh = Math.round(h * clamp(frac, 0, 1)); ctx.fillStyle = color; ctx.fillRect(x, y + h - hh, w, hh); ctx.strokeStyle = '#000'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
function btn(ctx, id, x, y, w, h, label, o = {}) {
  const on = !!o.on, dis = !!o.disabled;
  ctx.fillStyle = dis ? 'rgba(40,34,30,0.8)' : on ? 'rgba(212,169,76,0.35)' : (o.parch ? '#d8c89c' : 'rgba(58,48,42,0.95)'); ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = dis ? '#5a4e44' : on ? C.gold : (o.parch ? C.gold2 : 'rgba(212,169,76,0.55)'); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const sc = o.scale || 2, col = dis ? '#6a6058' : (o.parch ? C.ink : C.text);
  if (o.icon) { const ic = iconCanvas(o.icon); ctx.drawImage(ic, x + 6, y + (h - 24) / 2, 24, 24); }
  text(ctx, label, o.align === 'left' || o.icon ? x + (o.icon ? 36 : 10) : x + w / 2, y + (h - 7 * sc) / 2 - (o.sub ? 5 : 0), sc, col, o.align === 'left' || o.icon ? 'left' : 'center', !o.parch);
  if (o.sub) text(ctx, o.sub, o.icon ? x + 36 : (o.align === 'left' ? x + 10 : x + w / 2), y + h / 2 + 4, 1, dis ? '#6a6058' : (o.parch ? '#5a4420' : C.dim), o.icon || o.align === 'left' ? 'left' : 'center', !o.parch);
  if (o.right) text(ctx, o.right, x + w - 8, y + (h - 7 * sc) / 2, sc, dis ? '#6a6058' : (o.rightColor || C.gold), 'right', !o.parch);
  if (!dis) I.buttons.push({ id, x, y, w, h });
}
function circle(ctx, id, cx, cy, r, label, o = {}) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = o.on ? 'rgba(120,90,30,0.85)' : (o.dim ? 'rgba(30,24,24,0.55)' : 'rgba(34,28,24,0.78)'); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = o.on ? C.gold : 'rgba(212,169,76,0.75)'; ctx.stroke();
  if (o.icon) { const ic = iconCanvas(o.icon); const s = r * 1.0; ctx.drawImage(ic, cx - s / 2, cy - s / 2 - (label ? 5 : 0), s, s); }
  if (label) text(ctx, label, cx, cy + r * 0.4, 1, C.text, 'center');
  if (o.badge !== undefined) text(ctx, o.badge, cx + r * 0.6, cy - r * 0.95, 2, '#ffe9a0', 'center');
  I.buttons.push({ id, x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
}
function condColor(m) { if (m.cond.dead) return '#ff4040'; if (m.cond.unconscious) return '#9a9a9a'; if (m.cond.poison) return '#60e040'; if (m.cond.weak) return '#d0a040'; return null; }
function condName(m) { if (m.cond.dead) return 'Dead'; if (m.cond.unconscious) return 'Unconscious'; if (m.cond.poison) return 'Poisoned'; if (m.cond.weak) return 'Weak'; return 'Good'; }

function drawHUD() {
  const ctx = U.ctx, W = U.W, H = U.H; ctx.setTransform(U.dpr, 0, 0, U.dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false; I.buttons.length = 0;
  if (G.mode === 'title') { drawTitle(ctx); return; }
  if (G.mode === 'create') { drawCreate(ctx); return; }
  drawWorldFx(ctx);
  drawPortraitBar(ctx);
  if (G.mode === 'play' && !G.screen) { drawTopBar(ctx); drawButtons(ctx); drawLog(ctx); drawPrompt(ctx); drawTargetBar(ctx); }
  if (BOT.on && (G.mode === 'play' || G.mode === 'dead')) drawBotCaption(ctx);
  drawNotice(ctx);
  if (G.screen) drawScreen(ctx);
  if (G.mode === 'dead') drawDead(ctx);
  if (G.mode === 'ending') drawEnding(ctx);
  if (G.fadeT > 0) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, G.fadeT) + ')'; ctx.fillRect(0, 0, W, H); }
}
function drawWorldFx(ctx) {
  // damage pops over party members
  for (const p of memberScreenPositions()) { const m = p.m; if (m.dmgPop) { const [sx, sy] = worldToScreen(p.x, p.y); text(ctx, '-' + m.dmgPop.n, sx, sy - 34 - (1 - m.dmgPop.t) * 14, 2, '#ff6a50', 'center'); } }
  if (G.turnBased) { ctx.strokeStyle = 'rgba(80,140,255,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, U.W - 4, U.barTop - 4); }
  if (G.fearT > 0) { ctx.fillStyle = 'rgba(120,40,160,' + Math.min(0.25, G.fearT * 0.1) + ')'; ctx.fillRect(0, 0, U.W, U.barTop); }
  if (G.chill > 0) { ctx.fillStyle = 'rgba(120,180,255,' + Math.min(0.18, G.chill * 0.08) + ')'; ctx.fillRect(0, 0, U.W, U.barTop); }
  const hurt = Math.max(...G.party.map(m => m.hurt || 0)); if (hurt > 0) { const g = ctx.createRadialGradient(U.W / 2, U.barTop / 2, U.barTop * 0.4, U.W / 2, U.barTop / 2, U.barTop); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, 'rgba(140,0,0,' + hurt * 0.8 + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, U.W, U.barTop); }
}
function drawBotCaption(ctx) {
  const y = U.ins.t + 50, w = Math.min(560, U.W - 240); const x = U.W / 2 - w / 2;
  ctx.fillStyle = 'rgba(8,6,6,0.72)'; ctx.fillRect(x, y, w, 16); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 2, 16);
  text(ctx, 'Claude: ' + (BOT.say || '...'), x + 8, y + 4, 1, '#ffe9a0');
  btn(ctx, 'stopbot', x + w + 6, y - 2, 46, 20, 'STOP', { scale: 1 });
}
function drawTopBar(ctx) {
  const x0 = U.ins.l + 8, y0 = U.ins.t + 6;
  panel(ctx, x0, y0, 232, 40, 'dark');
  text(ctx, M.name, x0 + 10, y0 + 7, 2, C.gold);
  text(ctx, 'Day ' + dayOf() + '  ' + ('0' + hourOf()).slice(-2) + ':' + ('0' + minuteOf()).slice(-2) + (isNight() ? '  night' : ''), x0 + 10, y0 + 25, 1, C.dim);
  const x1 = x0 + 240; panel(ctx, x1, y0, 170, 40, 'dark');
  ctx.drawImage(iconCanvas('gold'), x1 + 8, y0 + 8, 24, 24); text(ctx, fmtNum(G.gold), x1 + 36, y0 + 13, 2, '#ffe9a0');
  ctx.drawImage(iconCanvas('food'), x1 + 108, y0 + 8, 24, 24); text(ctx, G.food, x1 + 136, y0 + 13, 2, G.food > 0 ? C.text : '#ff8060');
  const bx = U.W - U.ins.r - 8;
  btn(ctx, 'menu', bx - 44, y0, 44, 40, '=', { scale: 3 });
  btn(ctx, 'turn', bx - 44 - 50, y0, 46, 40, 'TB', { on: G.turnBased, sub: G.turnBased ? 'turns' : 'real' });
  btn(ctx, 'map', bx - 44 - 50 - 50, y0, 46, 40, 'MAP', { scale: 1 });
  btn(ctx, 'quests', bx - 44 - 50 - 50 - 50, y0, 46, 40, 'LOG', { scale: 1 });
  if (buffOn('bless') || buffOn('shield') || buffOn('stoneskin') || buffOn('heroism') || buffOn('torch') || buffOn('eye') || buffOn('mindshield')) { const names = ['bless', 'shield', 'stoneskin', 'heroism', 'torch', 'eye', 'mindshield'].filter(buffOn); text(ctx, names.join(' '), x0 + 10, y0 + 44, 1, '#9ad0ff'); }
}
function drawPortraitBar(ctx) {
  const y0 = U.barTop, n = 4, slotW = Math.min(150, (U.W - U.ins.l - U.ins.r - 16) / 4), total = slotW * n, x0 = U.W / 2 - total / 2;
  ctx.fillStyle = C.stone; ctx.fillRect(0, y0, U.W, U.H - y0); ctx.fillStyle = C.gold; ctx.fillRect(0, y0, U.W, 2);
  G.party.forEach((m, i) => {
    const x = x0 + i * slotW + 4, y = y0 + 6, w = slotW - 8, h = 60, sel = i === G.sel;
    ctx.fillStyle = sel ? 'rgba(212,169,76,0.18)' : 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = sel ? C.gold : '#4a3e34'; ctx.lineWidth = sel ? 2 : 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const im = creatureCanvas(m.portrait, m.cond.dead || m.cond.unconscious ? 0 : Math.floor(G.playTime * 4 + i) % 4, 3); const bsc = 1 + (m.bounce > 0 ? m.bounce * 0.12 : 0), hx = m.hurt > 0 ? Math.sin(G.playTime * 60) * 2 : 0;
    ctx.save(); ctx.translate(x + 28 + hx, y + 30); ctx.scale(bsc, bsc); if (m.cond.dead) ctx.globalAlpha = 0.35; else if (m.cond.unconscious) ctx.globalAlpha = 0.6; ctx.drawImage(im, -24, -24, 48, 48); ctx.restore();
    if (m.hurt > 0) { ctx.fillStyle = 'rgba(255,40,30,' + m.hurt * 0.5 + ')'; ctx.fillRect(x + 2, y + 2, 52, h - 4); } if (m.heal > 0) { ctx.fillStyle = 'rgba(80,255,120,' + m.heal * 0.35 + ')'; ctx.fillRect(x + 2, y + 2, 52, h - 4); }
    if (m.cond.dead) text(ctx, 'DEAD', x + 28, y + 24, 1, '#ff5050', 'center'); else if (m.cond.unconscious) text(ctx, 'KO', x + 28, y + 24, 2, '#cfcfcf', 'center');
    vbar(ctx, x + 56, y + 4, 7, h - 8, m.hp / maxHp(m), m.hp < maxHp(m) * 0.3 ? '#ff5030' : C.red);
    if (maxSp(m) > 0) vbar(ctx, x + 65, y + 4, 7, h - 8, m.sp / maxSp(m), C.blue);
    const tx = x + 78, tw = w - 82;
    text(ctx, m.name, tx, y + 5, tw > 60 ? 2 : 1, C.text);
    text(ctx, 'L' + m.lvl + ' ' + m.cls, tx, y + 24, 1, C.dim);
    text(ctx, m.hp + '/' + maxHp(m), tx, y + 36, 1, '#f0b0a0'); if (maxSp(m) > 0) text(ctx, m.sp + '/' + maxSp(m), tx + 46, y + 36, 1, '#a0c0ff');
    const cc = condColor(m); if (cc) text(ctx, condName(m), tx, y + 48, 1, cc);
    else if (m.rec > 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(tx, y + 50, tw * clamp(m.rec / recoveryTime(m), 0, 1), 4); } else if (canTrain(m)) text(ctx, 'can train', tx, y + 48, 1, '#ffe060');
    I.buttons.push({ id: 'port' + i, x, y, w, h });
  });
}
function drawButtons(ctx) {
  const bx = U.W - U.ins.r - 62, by = U.barTop - 62;
  if (I.isTouch) {
    circle(ctx, 'attack', bx, by, 36, 'ATTACK', { icon: 'sword2', dim: G.fearT > 0 });
    circle(ctx, 'cast', bx - 84, by + 20, 27, 'CAST', { icon: 'wand' });
    circle(ctx, 'char', bx - 84, by - 48, 27, 'PARTY', { icon: 'helm' });
    circle(ctx, 'rest', bx - 4, by - 80, 24, 'REST', {});
    if (I.joy) { const j = I.joy; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(j.ox, j.oy, 44, 0, TAU); ctx.stroke(); const dx = j.x - j.ox, dy = j.y - j.oy, d = Math.hypot(dx, dy), mm = Math.min(1, d / 44); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(j.ox + (d ? dx / d * mm * 44 : 0), j.oy + (d ? dy / d * mm * 44 : 0), 16, 0, TAU); ctx.fill(); }
    else if (G.playTime < 20) { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(U.ins.l + 90, U.barTop - 90, 44, 0, TAU); ctx.stroke(); text(ctx, 'MOVE', U.ins.l + 90, U.barTop - 94, 1, 'rgba(255,255,255,0.4)', 'center'); }
  } else {
    text(ctx, 'WASD move   SPACE attack   F cast   E interact   C party   I pack   M map   Q quests   R rest   ENTER turn-based   1-4 select', U.W / 2, U.barTop - 12, 1, 'rgba(200,180,150,0.55)', 'center');
  }
}
function drawLog(ctx) { let y = U.barTop - (I.isTouch ? 26 : 26); const n = Math.min(4, G.log.length); for (let i = G.log.length - 1; i >= G.log.length - n; i--) { const l = G.log[i]; ctx.globalAlpha = clamp(1 - (l.t - 6) / 2, 0.15, 1); text(ctx, l.text, U.ins.l + 10, y, 1, C.text); y -= 11; } ctx.globalAlpha = 1; }
function drawPrompt(ctx) {
  const it = G.focus; const label = interactLabel(it); if (!label) return;
  const w = textW(label, 2) + 28, x = U.W / 2 - w / 2, y = U.barTop - 56;
  panel(ctx, x, y, w, 28, 'dark'); text(ctx, label, U.W / 2, y + 7, 2, '#ffe9a0', 'center'); if (!I.isTouch) text(ctx, '[E]', x + w - 2, y - 10, 1, C.dim, 'right');
  I.buttons.push({ id: 'interact', x, y, w, h: 28 });
}
function drawTargetBar(ctx) {
  const t = G.target; if (!t || t.dead) return;
  const w = 220, x = U.W / 2 - w / 2, y = U.ins.t + 52; text(ctx, t.name, U.W / 2, y, 2, C.text, 'center'); bar(ctx, x, y + 16, w, 6, t.hp / t.maxHp, t.boss ? '#ff4040' : C.red);
  text(ctx, Math.ceil(t.hp) + '/' + t.maxHp, x + w, y + 24, 1, C.dim, 'right');
}
function drawNotice(ctx) {
  const n = G.notice; if (!n) return; const k = n.t / n.dur, a = k > 0.85 ? (1 - k) / 0.15 : k < 0.2 ? k / 0.2 : 1; ctx.globalAlpha = clamp(a, 0, 1);
  const y = U.barTop * 0.3; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y - 30, U.W, n.sub ? 70 : 54);
  serif(ctx, n.text, U.W / 2, y, Math.min(32, U.W / 20), C.gold, 'center', 3); if (n.sub) text(ctx, n.sub, U.W / 2, y + 22, 1, C.text, 'center'); ctx.globalAlpha = 1;
}
function drawDead(ctx) {
  const a = clamp(G.deadT / 1.5, 0, 1); ctx.fillStyle = 'rgba(0,0,0,' + a * 0.8 + ')'; ctx.fillRect(0, 0, U.W, U.H); ctx.globalAlpha = a;
  serif(ctx, 'THE PARTY HAS FALLEN', U.W / 2, U.H * 0.38, Math.min(40, U.W / 16), '#9b1a16', 'center', 4);
  text(ctx, 'The priests of the Dawn will find you, for a price.', U.W / 2, U.H * 0.38 + 36, 1, C.text, 'center');
  if (G.deadT > 1.5) btn(ctx, 'wake', U.W / 2 - 110, U.H * 0.6, 220, 40, 'WAKE IN THE TEMPLE'); ctx.globalAlpha = 1;
}
function drawEnding(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, U.W, U.H);
  serif(ctx, 'THE MANDATE RESTORED', U.W / 2, U.H * 0.22, Math.min(40, U.W / 16), C.gold, 'center', 5);
  const lines = ['The Scepter returns to Harrow Hall, and the sea begins to bite again.', 'Lord Harrow names the four of you Wardens of the Reach.', 'The roads are still dangerous, the Warrens still breed goblins, and the old barrow still glows at night.', 'There is always more to do.', '', 'Days ' + dayOf() + '   Kills ' + G.kills + '   Gold ' + fmtNum(G.gold)];
  lines.forEach((l, i) => text(ctx, l, U.W / 2, U.H * 0.38 + i * 16, 1, i === 5 ? '#ffe9a0' : C.text, 'center'));
  btn(ctx, 'keepplaying', U.W / 2 - 110, U.H * 0.72, 220, 40, 'KEEP EXPLORING');
}
