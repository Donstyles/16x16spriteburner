// ===================== one hero, real controls: thumb-stick, dash, skill buttons, keyboard, gamepad =====================
const INPUT = { keys: new Set(), stick: null, castQ: [], dashQ: false, pad: null, padPrev: [], lastT: -1e9, touch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0 };
const CTRL = { buttons: [], top: [], fx: {} };
const AUTO_LABEL = ['MANUAL', 'AUTO-CAST', 'AUTOPILOT'];
const HEALS = new Set(['MEND', 'REJUVENATE', 'MASS HEAL']);
const HERO_BLURB = {
  warrior: ['STEEL · MELEE', 'Wades into the horde with cleaves, dashes, flurries and floor-splitting slams.', ['WHIRLWIND', 'THOUSAND CUTS', 'CATACLYSM']],
  pyro: ['FIRE · RANGED', 'Burns everything from range: walls of fire, lava, lasers and meteors.', ['HEAT RAY', 'FIREBALL', 'METEOR STORM']],
  storm: ['LIGHTNING · RANGED', 'Chains, stuns and sweeps the room with lightning lasers.', ['LIGHTNING LANCE', 'ARC CANNON', 'THUNDERSTORM']],
  druid: ['EARTH · SUPPORT', 'Self-healing tank: roots, stone fists and rolling boulders grind foes down.', ['STONE FIST', 'BOULDER ROLL', 'EARTHQUAKE']],
};
// screen point → game point (the canvas may be turned 90° on an upright phone)
const ptr = e => VIEW.rot ? [e.clientY, VIEW.iw - e.clientX] : [e.clientX, e.clientY];
function touched() { INPUT.lastT = performance.now(); }
const idle = () => performance.now() - INPUT.lastT > 10000;
function autoLevel() { return G.autoMode === 2 || (idle() && G.phase === 'fight' && G.wave >= 1 && !G.choice) ? 2 : G.autoMode; }
function cycleAuto() { G.autoMode = (G.autoMode + 1) % 3; touched(); textBanner(AUTO_LABEL[G.autoMode], ['YOU MOVE AND CAST', 'YOU MOVE, SKILLS CAST THEMSELVES', 'THE HERO FIGHTS ON THEIR OWN'][G.autoMode], 'gold', true); }
function inputVec() {
  let x = 0, y = 0;
  if (INPUT.stick) { x = INPUT.stick.vx; y = INPUT.stick.vy; }
  else { const k = INPUT.keys; if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1; if (k.has('KeyD') || k.has('ArrowRight')) x += 1; if (k.has('KeyW') || k.has('ArrowUp')) y -= 1; if (k.has('KeyS') || k.has('ArrowDown')) y += 1; if (!x && !y && INPUT.pad) { x = INPUT.pad.x; y = INPUT.pad.y; } }
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } return [x, y];
}
// ---------- input events ----------
function setupControls() {
  const first = () => { if (SFX.ctx) return; SFX.init(); try { const el = document.documentElement; if (el.requestFullscreen && !/iPhone|iPad/.test(navigator.userAgent)) el.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { })).catch(() => { }); } catch (e) { } try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => { }); } catch (e) { } };
  const inRect = (q, x, y) => q && x >= q[0] && x <= q[0] + q[2] && y >= q[1] && y <= q[1] + q[3];
  addEventListener('pointerdown', e => {
    const [x, y] = ptr(e); touched(); first();
    if (UI.bookOpen) { UI.bookOpen = false; return; }
    for (const b of CTRL.top) if (inRect(b.r, x, y)) { b.fn(); return; }
    if (G.choice) { if (G.choice.picked < 0) { if (G.choice.kind === 'draft' && inRect(UI.draftRect, x, y)) { G.acted = true; autoDraft(); return; } const i = choiceAt(x, y); if (i >= 0) pickChoice(i, true); } return; }
    for (const b of CTRL.buttons) if (Math.hypot(x - b.x, y - b.y) <= b.r + 10) { b.press(); (CTRL.fx[b.id] = CTRL.fx[b.id] || {}).flash = 0.15; return; }
    if (inRect(UI.frameRect, x, y)) { UI.bookOpen = true; return; }
    if (x < VIEW.w * 0.55 && !INPUT.stick) INPUT.stick = { id: e.pointerId, ox: x, oy: y, x, y, vx: 0, vy: 0 };
  });
  addEventListener('pointermove', e => {
    if (G.choice) G.choice.hover = choiceAt(...ptr(e));
    const s = INPUT.stick; if (!s || e.pointerId !== s.id) return; touched();
    const R = 48 * ctrlScale(), [px, py] = ptr(e); let dx = px - s.ox, dy = py - s.oy, d = Math.hypot(dx, dy);
    if (d > R * 1.5) { s.ox += dx / d * (d - R * 1.5); s.oy += dy / d * (d - R * 1.5); dx = px - s.ox; dy = py - s.oy; d = Math.hypot(dx, dy); }
    const k = Math.min(d, R) / R; s.vx = d > 5 ? dx / d * k : 0; s.vy = d > 5 ? dy / d * k : 0; s.x = px; s.y = py;
  });
  const up = e => { if (INPUT.stick && e.pointerId === INPUT.stick.id) INPUT.stick = null; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up); addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => {
    const c = e.code; touched(); first();
    if (c === 'KeyB') { UI.bookOpen = !UI.bookOpen; return; } if (c === 'Escape') { UI.bookOpen = false; return; } if (UI.bookOpen) return;
    if (G.choice) { if (G.choice.picked < 0 && /^Digit[1-3]$/.test(c)) pickChoice(+c.slice(5) - 1, true); return; }
    if (c === 'Space' || c === 'ShiftLeft' || c === 'ShiftRight') { INPUT.dashQ = true; e.preventDefault(); }
    if (/^Digit[1-4]$/.test(c)) INPUT.castQ.push(+c.slice(5) - 1);
    if (c === 'KeyR' || c === 'KeyQ') INPUT.castQ.push('ult');
    if (c === 'KeyT') cycleAuto(); if (c === 'KeyM') SFX.toggle();
    if (/^(Key[WASD]|Arrow)/.test(c)) { INPUT.keys.add(c); e.preventDefault(); }
  });
  addEventListener('keyup', e => INPUT.keys.delete(e.code));
  addEventListener('blur', () => { INPUT.keys.clear(); INPUT.stick = null; });
}
function pollPad() {
  if (INPUT.keys.size || INPUT.stick) touched();
  const gps = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null; for (const g of gps || []) if (g) { gp = g; break; }
  if (!gp) { INPUT.pad = null; return; }
  const ax = Math.abs(gp.axes[0]) > 0.2 ? gp.axes[0] : 0, ay = Math.abs(gp.axes[1]) > 0.2 ? gp.axes[1] : 0; INPUT.pad = { x: ax, y: ay };
  const btn = i => gp.buttons[i] && gp.buttons[i].pressed, edge = i => btn(i) && !INPUT.padPrev[i];
  if (ax || ay || gp.buttons.some(b => b.pressed)) touched();
  if (edge(9)) UI.bookOpen = !UI.bookOpen; if (edge(8)) cycleAuto();
  if (G.choice) { if (G.choice.picked < 0) [2, 3, 1].forEach((b, i) => { if (edge(b)) pickChoice(i, true); }); }
  else if (!UI.bookOpen) { if (edge(0)) INPUT.dashQ = true; [2, 3, 1, 5].forEach((b, i) => { if (edge(b)) INPUT.castQ.push(i); }); if (edge(7) || edge(4)) INPUT.castQ.push('ult'); }
  INPUT.padPrev = gp.buttons.map(b => b.pressed);
}
// ---------- the hero, driven by the player ----------
function slotSpell(h, slot) { const name = slot === 'ult' ? HERO_PROG[h.key].ult : G.slots[slot]; if (!name || !G.known.has(name)) return null; return SPELLBOOK[h.key].find(s => s.name === name); }
function setCd(h, name, v) { h.cd[name] = v; (h.cdMax || (h.cdMax = {}))[name] = v; }
function tryCast(h, slot, foes) {
  const sp = slotSpell(h, slot), fail = () => { (CTRL.fx[slot] = CTRL.fx[slot] || {}).shake = 0.3; };
  if (!sp) return fail();
  if (sp.tier === 4) { if (h.ult < 100) return fail(); } else if ((h.cd[sp.name] || 0) > 0) return fail();
  let t = sp.pick(h, foes); if (!t) t = HEALS.has(sp.name) ? h : nearest(h, foes, 260); if (!t) return fail();
  if (sp.tier === 4) { h.ult = 0; G.ultCd = 4; } else setCd(h, sp.name, sp.cd * md(sp.name).cd);
  beginCast(h, { ...sp, wind: (sp.wind || 0) * 0.6, free: true }, t === true ? null : t);
}
function doDash(h, ix, iy) {
  let dx = ix, dy = iy; if (!dx && !dy) { dx = h.face; dy = 0; } const l = Math.hypot(dx, dy); dx /= l; dy /= l;
  h.iframe = 0.35; G.dashCd = 2.2; G.dashMax = 2.2; h.face = dx < 0 ? -1 : 1;
  smoke(h.x, h.y, 4, 'dust', 8, 30, 0.7); ring(h.x, h.y, 16, h.def.col, 0.25, 2); SFX.whoosh(panOf(h.x));
  dash(h, h.x + dx * 62, h.y + dy * 50, 0.17, { r: 0, col: h.def.col });
}
function playerHero(h, dt) {
  if (h.dead) { h.deadT += dt; INPUT.castQ.length = 0; return; }
  for (const k in h.cd) h.cd[k] -= dt; G.dashCd -= dt; if (h.iframe > 0) h.iframe -= dt;
  h.ult = ultUnlocked(h) ? Math.min(100, h.ult + dt * 2.6) : 0;
  if (h.regen && (h.regen.t -= dt) > 0) { if ((h.regen.tick -= dt) <= 0) { h.regen.tick = 0.5; heal(h, h.regen.per); } } else h.regen = null;
  if (h.z > 0 && G.phase !== 'fight') return;
  const [ix, iy] = inputVec(), foes = live(G.mons), st = h.state;
  if (INPUT.dashQ) { INPUT.dashQ = false; if (G.dashCd <= 0 && h.stun <= 0 && !(st && (st.k === 'cuts' || st.k === 'leap' || st.k === 'dash' || (st.k === 'cast' && st.sp.tier >= 4)))) { h.state = null; doDash(h, ix, iy); } }
  if (h.stun > 0) { h.stun -= dt; h.vx = damp(h.vx, 0, 8, dt); h.vy = damp(h.vy, 0, 8, dt); return; }
  if (h.state) { heroState(h, dt); return; }
  const spd = h.def.spd * 1.3; h.vx = damp(h.vx, ix * spd, 12, dt); h.vy = damp(h.vy, iy * spd, 12, dt); h.moving = !!(ix || iy); if (Math.abs(ix) > 0.15) h.face = ix < 0 ? -1 : 1;
  if (G.autoMode === 1 && G.phase === 'fight') heroBrain(h, foes);
  while (INPUT.castQ.length && !h.state) tryCast(h, INPUT.castQ.shift(), foes);
  if (h.state || !foes.length) return;
  const basic = basicOf(h);
  if (h.key === 'warrior') { const t = nearest(h, foes, h.r + (basic.reach || 14) + 10); if (t && !(h.cd.slash > 0)) { h.cd.slash = basic.cd * md(basic.name).cd; basic.cast(h, t); } }
  else if (!(h.cd.basic > 0)) { const t = basic.pick(h, foes); if (t) { h.cd.basic = basic.cd * md(basic.name).cd; basic.cast(h, t); } }
}
// ---------- hero select and skill slots ----------
function selectHero(k) {
  G.heroKey = k; const keep = G.heroes.find(h => h.key === k);
  for (const h of G.heroes) if (h !== keep) { smoke(h.x, h.y, 6, 'dark', 10, 30, 1.2); ring(h.x, h.y, 22, h.def.col, 0.4, 3); glows(h.x, h.y, 8, 8, h.def.col, 60, 4, 0.6); }
  G.heroes = [keep]; removeIf(G.units, u => u.team === 'hero' && u !== keep); keep.ctrl = 'player';
  keep.x = ARENA.pw / 2; keep.y = ARENA.y1 - 34; keep.vx = keep.vy = 0; column(keep.x, keep.y, keep.def.col, 1.4, 14); ring(keep.x, keep.y, 40, keep.def.col, 0.5, 4);
  G.basic = { [k]: DEFAULT_BASIC[k] }; G.known = new Set([DEFAULT_BASIC[k]]); G.slots = [null, null, null, null];
  if (k === 'druid') { G.known.add('MEND'); G.slots[0] = 'MEND'; }
  scaleParty(); keep.hp = keep.maxHp;
}
function weakestSlot() { let best = 0, bs = 1e9; G.slots.forEach((n, i) => { const sp = n && SPELLBOOK[G.heroKey].find(s => s.name === n), s = sp ? sp.tier * 10 + (G.modsTaken[n] || []).length * 3 + i * 0.1 : -1; if (s < bs) { bs = s; best = i; } }); return G.slots[best]; }
function learnSpell(o) {
  const name = o.sp.name; G.known.add(name); if (o.sp.tier >= 4 || o.sp.tier === 0 || !G.slots) return;
  let i = G.slots.indexOf(null); if (i < 0) { i = Math.max(0, G.slots.indexOf(o.replace || weakestSlot())); G.known.delete(G.slots[i]); } G.slots[i] = name;
}
// ---------- HUD for one hero ----------
function ctrlScale() { return clamp(Math.min(VIEW.w, VIEW.h) / 430, 0.85, 1.35); }
const initials = n => n.split(' ').length > 1 ? n.split(' ').map(w => w[0]).join('').slice(0, 3) : n.slice(0, 2);
function drawHeroFrame(c, L, T) {
  const h = G.heroes[0]; if (!h) return; const m = MOBS[h.spr], col = COL[h.def.col], solo = G.heroes.length === 1;
  if (!solo) { font(c, 900, 24, F_DISP); label(c, 'Floor ' + G.floor, L, T + 20, '#ecc878', { stroke: 4 }); font(c, 500, 14, F_HUD); spaced(c, ARENA.name, L, T + 36, 1.6, '#bfae90'); UI.frameRect = null; return; }
  c.fillStyle = 'rgba(10,8,12,0.62)'; c.fillRect(L - 6, T - 6, 204, 58); UI.frameRect = [L - 6, T - 6, 204, 58];
  c.imageSmoothingEnabled = false; c.fillStyle = `rgba(${col},0.18)`; c.fillRect(L - 2, T - 2, 42, 42); c.globalAlpha = h.dead ? 0.4 : 1; c.drawImage(IMG.mobs, 0, m[0], m[1], m[2], L, T, 38, 38 * m[2] / m[1]); c.globalAlpha = 1;
  font(c, 900, 16, F_DISP); label(c, h.def.name, L + 46, T + 11, `rgb(${col})`); const nw = c.measureText(h.def.name).width; font(c, 500, 11, F_HUD); label(c, heroTitle(h), L + 52 + nw, T + 11, '#a89a84');
  const f = h.dead ? 0 : clamp(h.hp / h.maxHp, 0, 1); c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(L + 46, T + 16, 146, 9); c.fillStyle = f > 0.5 ? '#5ee07e' : f > 0.25 ? '#ffd24a' : '#ff4a3a'; c.fillRect(L + 46, T + 16, 146 * f, 9); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(L + 46, T + 16, 146 * f, 2);
  font(c, 600, 11, F_HUD); label(c, Math.max(0, Math.round(h.hp)) + ' / ' + h.maxHp, L + 49, T + 24.5, '#10120e');
  const xa = xpFor(G.lvl), xb = xpFor(G.lvl + 1), xf = clamp((G.xp - xa) / (xb - xa), 0, 1); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(L + 74, T + 31, 118, 4); c.fillStyle = '#ffd860'; c.fillRect(L + 74, T + 31, 118 * xf, 4);
  font(c, 600, 13, F_HUD); label(c, 'LV ' + G.lvl, L + 46, T + 36, '#ffd860');
  font(c, 500, 12, F_HUD); label(c, 'FLOOR ' + G.floor + ' · ' + ARENA.name, L + 46, T + 48, '#bfae90');
  font(c, 500, 12, F_HUD); spaced(c, G.kills.toLocaleString() + ' SLAIN' + (G.falls ? '  ·  FALLEN ' + G.falls + '×' : ''), L, T + 66, 1.1, '#8f8472');
}
function drawTopButtons(c, R, T) {
  CTRL.top = []; const items = [];
  const al = autoLevel(), idleAuto = al === 2 && G.autoMode < 2;
  items.push({ t: idleAuto ? 'AUTOPILOT · IDLE' : AUTO_LABEL[G.autoMode], hot: G.autoMode > 0 || idleAuto, fn: cycleAuto });
  items.push({ t: 'SPELLBOOK', fn: () => { UI.bookOpen = true; } });
  items.push({ t: !SFX.ctx ? 'TAP FOR SOUND' : SFX.on ? 'SOUND ON' : 'SOUND OFF', pulse: !SFX.ctx, fn: () => { if (SFX.ctx) SFX.toggle(); } });
  font(c, 600, 13, F_HUD); let x = R;
  for (const it of items) { const w = c.measureText(it.t).width + it.t.length * 1 + 18; x -= w; c.globalAlpha = it.pulse ? 0.65 + 0.35 * Math.sin(performance.now() / 300) : 0.9; c.fillStyle = 'rgba(10,8,12,0.7)'; c.fillRect(x, T - 4, w, 22); c.strokeStyle = it.hot ? '#ffd860' : 'rgba(200,160,80,0.6)'; c.lineWidth = 1; c.strokeRect(x + 0.5, T - 3.5, w - 1, 21); spaced(c, it.t, x + 9, T + 12, 1, it.hot ? '#ffd860' : '#e8d8b8'); c.globalAlpha = 1; CTRL.top.push({ r: [x - 2, T - 8, w + 4, 30], fn: it.fn }); x -= 6; }
}
function drawSkillBtn(c, b, h) {
  const fx = CTRL.fx[b.id] || {}, sh = fx.shake > 0 ? Math.sin(performance.now() / 20) * 4 * fx.shake / 0.3 : 0, x = b.x + sh, y = b.y, r = b.r, sp = b.sp;
  if (fx.shake > 0) fx.shake -= 1 / 60; if (fx.flash > 0) fx.flash -= 1 / 60;
  c.fillStyle = 'rgba(14,10,18,0.66)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  if (!sp) { c.setLineDash([3, 4]); c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r - 1, 0, TAU); c.stroke(); c.setLineDash([]); font(c, 500, 11 * ctrlScale(), F_HUD); label(c, b.slot === 'ult' ? 'LV ' + TIER_MIN[4] : 'EMPTY', x, y + 4, 'rgba(255,255,255,0.3)', { align: 'center' }); return; }
  const hex = b.id === 'dash' ? '#e8d8b8' : TIER_HEX[sp.tier], cdLeft = b.id === 'dash' ? G.dashCd : sp.tier === 4 ? 0 : (h.cd[sp.name] || 0), cdMax = b.id === 'dash' ? (G.dashMax || 2.2) : (h.cdMax && h.cdMax[sp.name]) || sp.cd || 1;
  const ready = b.slot === 'ult' ? h.ult >= 100 : cdLeft <= 0;
  if (b.slot === 'ult') { c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r - 2, 0, TAU); c.stroke(); c.strokeStyle = hex; c.beginPath(); c.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * h.ult / 100); c.stroke(); if (ready) { c.shadowColor = hex; c.shadowBlur = 18 + 8 * Math.sin(performance.now() / 150); c.stroke(); c.shadowBlur = 0; } }
  else { c.strokeStyle = ready ? hex : 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r - 1, 0, TAU); c.stroke(); }
  if (fx.flash > 0) { c.fillStyle = `rgba(255,255,255,${fx.flash * 3})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  if (!ready && b.slot !== 'ult') {}
  else if (b.id === 'dash') { font(c, 900, 18 * ctrlScale(), F_DISP); label(c, '»', x, y + 6 * ctrlScale(), ready ? '#fff4e0' : 'rgba(255,244,224,0.45)', { align: 'center' }); }
  else { const words = sp.name.split(' '), lines = words.length > 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : words, fs0 = (b.slot === 'ult' ? 13 : 11) * ctrlScale(); let fs = fs0; font(c, 600, fs, F_HUD); const mw = Math.max(...lines.map(l => c.measureText(l).width)); if (mw > r * 1.72) { fs = fs0 * r * 1.72 / mw; font(c, 600, fs, F_HUD); } const y0 = y - (lines.length - 1) * fs * 0.45 + fs * 0.35; lines.forEach((l, k) => label(c, l, x, y0 + k * fs * 0.9, ready ? '#fff4e0' : 'rgba(255,244,224,0.4)', { align: 'center', stroke: 3 })); }
  if (!ready && b.slot !== 'ult') { c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(cdLeft / cdMax, 0, 1)); c.closePath(); c.fill(); font(c, 600, 17 * ctrlScale(), F_HUD); label(c, cdLeft.toFixed(cdLeft < 1 ? 1 : 0), x, y + 6 * ctrlScale(), '#ffffff', { align: 'center', stroke: 3 }); }
  if (!INPUT.touch && b.key) { font(c, 600, 11, F_HUD); label(c, b.key, x + r * 0.72, y - r * 0.62, '#ffd860', { align: 'center', stroke: 3 }); }
}
function drawControls(c) {
  CTRL.buttons = []; const h = G.heroes[0]; if (!h || G.heroes.length !== 1 || !G.slots) return;
  const W = VIEW.w, H = VIEW.h, S = VIEW.safe, sc = ctrlScale(), R = W - Math.max(14, S.r + 10), B = H - Math.max(12, S.b + 8), L = Math.max(14, S.l + 10);
  const ux = R - 38 * sc, uy = B - 38 * sc, rad = 96 * sc, list = [];
  list.push({ id: 'ult', slot: 'ult', x: ux, y: uy, r: 30 * sc, sp: slotSpell(h, 'ult'), key: 'R', press: () => INPUT.castQ.push('ult') });
  [180, 210, 240, 270].forEach((a, i) => { const t = a * Math.PI / 180; list.push({ id: i, slot: i, x: ux + Math.cos(t) * rad, y: uy + Math.sin(t) * rad, r: 23 * sc, sp: slotSpell(h, i), key: String(i + 1), press: () => INPUT.castQ.push(i) }); });
  list.push({ id: 'dash', slot: 'dash', x: ux - rad - 62 * sc, y: uy + 6 * sc, r: 24 * sc, sp: { name: 'DASH', tier: 0 }, key: 'SPACE', press: () => { INPUT.dashQ = true; } });
  const al = autoLevel(); c.globalAlpha = al === 2 ? 0.45 : 1; for (const b of list) drawSkillBtn(c, b, h); c.globalAlpha = 1; CTRL.buttons = list;
  const s = INPUT.stick, JR = 48 * sc;
  if (s) { c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2; c.beginPath(); c.arc(s.ox, s.oy, JR, 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fill(); c.fillStyle = 'rgba(255,240,210,0.45)'; c.beginPath(); c.arc(s.ox + s.vx * JR, s.oy + s.vy * JR, 20 * sc, 0, TAU); c.fill(); }
  else if (INPUT.touch && G.phase === 'fight') { const gx = L + 64 * sc, gy = B - 60 * sc; c.globalAlpha = 0.35 + 0.15 * Math.sin(performance.now() / 500); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(gx, gy, JR, 0, TAU); c.stroke(); font(c, 600, 13, F_HUD); spaced(c, 'MOVE', gx, gy + 4, 2, '#e8d8b8', 'center'); c.globalAlpha = 1; }
  else if (!INPUT.touch && G.phase === 'fight') { font(c, 500, 12, F_HUD); c.globalAlpha = 0.6; spaced(c, 'WASD MOVE  ·  SPACE DASH  ·  1-4 SKILLS  ·  R ULTIMATE  ·  T AUTO  ·  B BOOK', L, B - 4, 1, '#c8b48c'); c.globalAlpha = 1; }
}
