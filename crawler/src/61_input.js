// ===================== input: touch, keyboard, mouse, gamepad -> the local hero's input record =====================
// Phones: a floating stick on the left half; on the right a big ATTACK (tap to strike, hold to charge), DODGE, BLOCK (hold)
// and FLASK. Keyboard: WASD/arrows, J or left click attack, Space or K dodge, Shift, L or right click block, F flask,
// Esc menu; the mouse aims. Gamepad: stick, X attack, A dodge, shoulder block, Y flask, Start menu.
const INPUT = { keys: new Set(), stick: null, btn: {}, mouse: { x: 0, y: 0, t: -99, l: false, r: false }, pad: null, touch: false };
const TOUCHES = new Map();
function ctrlScale() { return clamp(Math.min(VIEW.w, VIEW.h) / 430, 0.85, 1.35); }
// where the buttons sit, in screen pixels of the (possibly turned) canvas
function btnLayout() {
  const S = VIEW.safe, sc = ctrlScale(), R = VIEW.w - Math.max(14, S.r + 10), B = VIEW.h - Math.max(12, S.b + 8);
  const atk = { x: R - 62 * sc, y: B - 64 * sc, r: 44 * sc };
  return { atk, dodge: { x: atk.x - 96 * sc, y: atk.y + 20 * sc, r: 30 * sc }, block: { x: atk.x + 6 * sc, y: atk.y - 92 * sc, r: 30 * sc }, flask: { x: atk.x - 88 * sc, y: atk.y - 66 * sc, r: 24 * sc }, menu: { x: R - 22 * sc, y: Math.max(10, S.t + 8) + 18 * sc, r: 18 * sc } };
}
function screenPt(e) { return VIEW.rot ? [e.clientY, VIEW.iw - e.clientX] : [e.clientX, e.clientY]; }
function toWorld(px, py) { const s = CAM.z * (1 + CAM.kick); return [(px - VIEW.w / 2 - SH.x) / s + CAM.x, (py - VIEW.h / 2 - SH.y) / s + CAM.y]; }
function btnAt(x, y) { const L = btnLayout(); for (const k in L) { const b = L[k]; if (dist(x, y, b.x, b.y) < b.r * 1.25) return k; } return null; }
function press(name) { INPUT.btn[name] = true; const I = G.me && G.me.inp; if (!I) return; if (name === 'atk') { I.atkP = true; } if (name === 'dodge') I.dodgeP = true; if (name === 'flask') I.itemP = true; if (name === 'menu') togglePause(); }
function release(name) { INPUT.btn[name] = false; const I = G.me && G.me.inp; if (I && name === 'atk') I.atkR = true; }
function setupInput() {
  const c = cvs;
  c.addEventListener('touchstart', e => {
    e.preventDefault(); INPUT.touch = true; SFX.init && SFX.init();
    for (const t of e.changedTouches) {
      const [x, y] = screenPt(t);
      if (G.mode !== 'play' || UI.paused) { uiTap(x, y); continue; }
      const b = btnAt(x, y);
      if (b) { TOUCHES.set(t.identifier, { k: 'btn', b }); press(b); }
      else if (x < VIEW.w * 0.5 && !INPUT.stick) { INPUT.stick = { id: t.identifier, bx: x, by: y, x, y, vx: 0, vy: 0 }; TOUCHES.set(t.identifier, { k: 'stick' }); }
    }
  }, { passive: false });
  c.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) { const s = INPUT.stick; if (s && s.id === t.identifier) { const [x, y] = screenPt(t), R = 52 * ctrlScale(), dx = x - s.bx, dy = y - s.by, d = Math.hypot(dx, dy); if (d > R) { s.bx = x - dx / d * R; s.by = y - dy / d * R; } s.x = x; s.y = y; const m = Math.min(1, d / R); s.vx = d > 6 ? dx / d * m : 0; s.vy = d > 6 ? dy / d * m : 0; } }
  }, { passive: false });
  const end = e => { e.preventDefault(); for (const t of e.changedTouches) { const T = TOUCHES.get(t.identifier); TOUCHES.delete(t.identifier); if (!T) continue; if (T.k === 'stick') INPUT.stick = null; else release(T.b); } };
  c.addEventListener('touchend', end, { passive: false }); c.addEventListener('touchcancel', end, { passive: false });
  addEventListener('keydown', e => {
    if (e.repeat) return; SFX.init && SFX.init(); INPUT.keys.add(e.code);
    if (G.mode !== 'play' || UI.paused) { uiKey(e.code); return; }
    if (e.code === 'KeyJ' || e.code === 'KeyZ') press('atk'); else if (e.code === 'Space' || e.code === 'KeyK') { press('dodge'); e.preventDefault(); } else if (e.code === 'KeyF' || e.code === 'KeyE') press('flask'); else if (e.code === 'Escape') togglePause();
  });
  addEventListener('keyup', e => { INPUT.keys.delete(e.code); if (e.code === 'KeyJ' || e.code === 'KeyZ') release('atk'); });
  c.addEventListener('mousedown', e => { if (INPUT.touch) return; SFX.init && SFX.init(); const [x, y] = screenPt(e); if (G.mode !== 'play' || UI.paused) { uiTap(x, y); return; } if (dist(x, y, btnLayout().menu.x, btnLayout().menu.y) < 30) { togglePause(); return; } if (e.button === 0) { INPUT.mouse.l = true; press('atk'); } if (e.button === 2) INPUT.mouse.r = true; INPUT.mouse.t = performance.now(); });
  addEventListener('mouseup', e => { if (INPUT.touch) return; if (e.button === 0 && INPUT.mouse.l) { INPUT.mouse.l = false; release('atk'); } if (e.button === 2) INPUT.mouse.r = false; });
  c.addEventListener('mousemove', e => { if (INPUT.touch) return; const [x, y] = screenPt(e); INPUT.mouse.x = x; INPUT.mouse.y = y; INPUT.mouse.t = performance.now(); });
  c.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('blur', () => { INPUT.keys.clear(); INPUT.stick = null; TOUCHES.clear(); INPUT.btn = {}; INPUT.mouse.l = INPUT.mouse.r = false; });
}
const PADB = {};
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; let p = null; for (const q of pads) if (q && q.connected) { p = q; break; }
  if (!p) { INPUT.pad = null; return; }
  const ax = Math.abs(p.axes[0]) > 0.2 ? p.axes[0] : 0, ay = Math.abs(p.axes[1]) > 0.2 ? p.axes[1] : 0, dx = (p.buttons[15] && p.buttons[15].pressed ? 1 : 0) - (p.buttons[14] && p.buttons[14].pressed ? 1 : 0), dy = (p.buttons[13] && p.buttons[13].pressed ? 1 : 0) - (p.buttons[12] && p.buttons[12].pressed ? 1 : 0);
  INPUT.pad = { x: ax || dx, y: ay || dy, block: !!((p.buttons[5] && p.buttons[5].pressed) || (p.buttons[4] && p.buttons[4].pressed)) };
  const edge = (i, name) => { const on = !!(p.buttons[i] && p.buttons[i].pressed); if (on && !PADB[i]) { if (G.mode !== 'play' || UI.paused) uiKey(name === 'dodge' || name === 'atk' ? 'Enter' : name === 'menu' ? 'Escape' : ''); else press(name); } if (!on && PADB[i] && name === 'atk') release('atk'); PADB[i] = on; };
  edge(2, 'atk'); edge(0, 'dodge'); edge(3, 'flask'); edge(9, 'menu');
}
// once per frame: the local player's hands into the hero's input record
function readInput() {
  const h = G.me; if (!h) return; const I = h.inp, k = INPUT.keys;
  let x = 0, y = 0;
  if (INPUT.stick) { x = INPUT.stick.vx; y = INPUT.stick.vy; }
  else { if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1; if (k.has('KeyD') || k.has('ArrowRight')) x += 1; if (k.has('KeyW') || k.has('ArrowUp')) y -= 1; if (k.has('KeyS') || k.has('ArrowDown')) y += 1; if (!x && !y && INPUT.pad) { x = INPUT.pad.x; y = INPUT.pad.y; } }
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } I.mx = x; I.my = y;
  I.atk = !!(INPUT.btn.atk || k.has('KeyJ') || k.has('KeyZ') || INPUT.mouse.l);
  I.block = !!(INPUT.btn.block || k.has('ShiftLeft') || k.has('ShiftRight') || k.has('KeyL') || INPUT.mouse.r || (INPUT.pad && INPUT.pad.block));
  if (!INPUT.touch && performance.now() - INPUT.mouse.t < 2500) { const [wx, wy] = toWorld(INPUT.mouse.x, INPUT.mouse.y); I.aim = angTo(h.x, h.y - 4, wx, wy); } else I.aim = null;
}
// ---------- the buttons ----------
function drawControls(c) {
  if (!G.me || G.mode !== 'play') return; const L = btnLayout(), h = G.me, sc = ctrlScale();
  if (INPUT.touch) {
    const s = INPUT.stick; if (s) { c.globalAlpha = 0.35; c.strokeStyle = '#e8dcc0'; c.lineWidth = 2; c.beginPath(); c.arc(s.bx, s.by, 52 * sc, 0, TAU); c.stroke(); c.globalAlpha = 0.6; c.fillStyle = '#e8dcc0'; c.beginPath(); c.arc(s.bx + s.vx * 52 * sc, s.by + s.vy * 52 * sc, 20 * sc, 0, TAU); c.fill(); c.globalAlpha = 1; }
    const charge = h.act && h.act.k === 'charge' ? clamp(h.act.t / weaponOf(h).heavy.charge, 0, 1) : 0;
    roundBtn(c, L.atk, 'ATTACK', INPUT.btn.atk, '#f0d8a8', charge);
    roundBtn(c, L.dodge, 'ROLL', INPUT.btn.dodge, '#b8d8f0', 0, h.stam <= 0);
    roundBtn(c, L.block, h.off === 'shield' ? 'BLOCK' : 'GUARD', INPUT.btn.block, '#d8d0c0', 0, h.stam <= 0);
    roundBtn(c, L.flask, 'FLASK ' + h.flasks, INPUT.btn.flask, '#9fe8a8', 0, h.flasks <= 0);
  }
  // menu, top right (every device)
  const m = L.menu; c.globalAlpha = 0.8; c.fillStyle = 'rgba(10,8,12,0.55)'; c.beginPath(); c.arc(m.x, m.y, m.r, 0, TAU); c.fill(); c.fillStyle = '#e8dcc0'; for (let i = -1; i <= 1; i++) c.fillRect(m.x - m.r * 0.45, m.y + i * m.r * 0.32 - 1, m.r * 0.9, 2); c.globalAlpha = 1;
}
function roundBtn(c, b, txt, on, col, fill = 0, off = false) {
  c.globalAlpha = off ? 0.35 : on ? 0.95 : 0.7; c.fillStyle = on ? 'rgba(60,46,30,0.75)' : 'rgba(14,11,16,0.55)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
  c.lineWidth = 2; c.strokeStyle = col; c.beginPath(); c.arc(b.x, b.y, b.r - 1, 0, TAU); c.stroke();
  if (fill > 0) { c.lineWidth = 4; c.strokeStyle = fill >= 1 ? '#ffd860' : '#ffffff'; c.beginPath(); c.arc(b.x, b.y, b.r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * fill); c.stroke(); }
  font(c, 600, Math.max(11, b.r * 0.42), F_HUD); label(c, txt, b.x, b.y + b.r * 0.15, col, { align: 'center' }); c.globalAlpha = 1;
}
