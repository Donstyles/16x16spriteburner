// ===================== input: touch, keyboard, mouse, gamepad -> the local hero's input record =====================
// Phones: an invisible floating stick on the left half (a small push creeps, silent past sleepers; further runs); on the right a big ATTACK (tap to strike, hold to charge), DODGE, BLOCK (hold)
// and FLASK. Keyboard: WASD/arrows, J or left click attack, Space or K dodge, Shift, L or right click block, F flask,
// C or Ctrl creep, Esc menu; the mouse aims. Gamepad: stick, X attack, A dodge, shoulder block, Y flask, Start menu.
const INPUT = { keys: new Set(), stick: null, btn: {}, mouse: { x: 0, y: 0, t: -1e9, l: false, r: false }, pad: null, touch: false };
const TOUCHES = new Map();
function ctrlScale() { return clamp(Math.min(VIEW.w, VIEW.h) / 430, 0.85, 1.35); }
// where the buttons sit, in screen pixels of the (possibly turned) canvas
function btnLayout() {
  const S = VIEW.safe, sc = ctrlScale(), R = VIEW.w - Math.max(14, S.r + 10), B = VIEW.h - Math.max(12, S.b + 8);
  const atk = { x: R - 62 * sc, y: B - 64 * sc, r: 44 * sc };
  return { atk, dodge: { x: atk.x - 96 * sc, y: atk.y + 20 * sc, r: 30 * sc }, block: { x: atk.x + 6 * sc, y: atk.y - 92 * sc, r: 30 * sc }, flask: { x: atk.x - 88 * sc, y: atk.y - 66 * sc, r: 24 * sc }, menu: { x: R - 22 * sc, y: Math.max(10, S.t + 8) + 18 * sc, r: 18 * sc }, ...(TEST.on ? { clean: { x: VIEW.w / 2 - (TEST.mode !== 'blood' ? 30 * sc : 0), y: Math.max(10, S.t + 8) + 22 * sc, r: 22 * sc } } : {}), ...(TEST.on && TEST.mode !== 'blood' ? { next: { x: VIEW.w / 2 + 30 * sc, y: Math.max(10, S.t + 8) + 22 * sc, r: 22 * sc } } : {}), ...(TEST.on && TEST.mode === 'armour' ? { die: { x: VIEW.w / 2 + 90 * sc, y: Math.max(10, S.t + 8) + 22 * sc, r: 22 * sc }, list: { x: VIEW.w / 2 + 150 * sc, y: Math.max(10, S.t + 8) + 22 * sc, r: 22 * sc }, foes: { x: VIEW.w / 2 - 90 * sc, y: Math.max(10, S.t + 8) + 22 * sc, r: 22 * sc }, hit: { x: VIEW.w / 2, y: B - 24 * sc, r: 22 * sc } } : {}), ...(GAL.on ? { gprev: { x: VIEW.w / 2 - 30 * sc, y: Math.max(10, S.t + 8) + 22 * sc, r: 22 * sc }, gnext: { x: VIEW.w / 2 + 30 * sc, y: Math.max(10, S.t + 8) + 22 * sc, r: 22 * sc } } : {}) };
}
function screenPt(e) { return VIEW.rot ? [e.clientY, VIEW.iw - e.clientX] : [e.clientX, e.clientY]; }
function toWorld(px, py) { const s = CAM.z * (1 + CAM.kick); return [(px - VIEW.w / 2 - SH.x) / s + CAM.x, (py - VIEW.h / 2 - SH.y) / s + CAM.y]; }
function btnAt(x, y) { const L = btnLayout(); for (const k in L) { const b = L[k]; if (dist(x, y, b.x, b.y) < b.r * 1.25) return k; } return null; }
function press(name) { INPUT.btn[name] = true; const I = G.me && G.me.inp; if (!I) return; if (name === 'atk') { I.atkP = true; } if (name === 'dodge') I.dodgeP = true; if (name === 'flask') I.itemP = true; if (name === 'menu') togglePause(); if (name === 'clean') cleanBlood(); if (name === 'next') testNext(); if (name === 'die') testDie(); if (name === 'list') DEATH_PICK.open = true; if (name === 'foes') testFoes(); if (name === 'hit') testHit(); if (name === 'gnext') galleryStep(1); if (name === 'gprev') galleryStep(-1); }
function release(name) { INPUT.btn[name] = false; const I = G.me && G.me.inp; if (I && name === 'atk') I.atkR = true; }
function setupInput() {
  const c = cvs;
  c.addEventListener('touchstart', e => {
    e.preventDefault(); INPUT.touch = true; SFX.init && SFX.init();
    for (const t of e.changedTouches) {
      const [x, y] = screenPt(t);
      if (G.mode !== 'play' || UI.paused) { uiTap(x, y); continue; }
      if (DEATH_PICK.open && TEST.on) { pickTap(x, y); continue; } if (pickHit(x, y)) { DEATH_PICK.open = true; continue; } // (the death picker: 64_testroom)
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
  c.addEventListener('touchend', e => { SFX.init && SFX.init(); end(e); }, { passive: false }); c.addEventListener('touchcancel', end, { passive: false });
  addEventListener('keydown', e => {
    if (e.repeat) return; SFX.init && SFX.init(); INPUT.keys.add(e.code);
    if (G.mode !== 'play' || UI.paused) { uiKey(e.code); return; }
    if (e.code === 'KeyJ' || e.code === 'KeyZ') press('atk'); else if (e.code === 'Space' || e.code === 'KeyK') { press('dodge'); e.preventDefault(); } else if (e.code === 'KeyF' || e.code === 'KeyE') press('flask'); else if (e.code === 'Escape') togglePause();
  });
  addEventListener('keyup', e => { INPUT.keys.delete(e.code); if (e.code === 'KeyJ' || e.code === 'KeyZ') release('atk'); if (e.code === 'Space' || e.code === 'KeyK') release('dodge'); });
  c.addEventListener('mousedown', e => { if (INPUT.touch) return; SFX.init && SFX.init(); const [x, y] = screenPt(e); if (G.mode !== 'play' || UI.paused) { uiTap(x, y); return; } if (DEATH_PICK.open && TEST.on) { pickTap(x, y); return; } if (pickHit(x, y)) { DEATH_PICK.open = true; return; } if (dist(x, y, btnLayout().menu.x, btnLayout().menu.y) < 30) { togglePause(); return; } if (TEST.on && dist(x, y, btnLayout().clean.x, btnLayout().clean.y) < 30) { cleanBlood(); return; } if (btnLayout().next && dist(x, y, btnLayout().next.x, btnLayout().next.y) < 30) { testNext(); return; } for (const k of ['die', 'list', 'foes', 'hit', 'gnext', 'gprev']) { const b = btnLayout()[k]; if (b && dist(x, y, b.x, b.y) < 30) { press(k); release(k); return; } } if (e.button === 0) { INPUT.mouse.l = true; press('atk'); } if (e.button === 2) INPUT.mouse.r = true; INPUT.mouse.t = performance.now(); });
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
  const edge = (i, name) => { const on = !!(p.buttons[i] && p.buttons[i].pressed); if (on && !PADB[i]) { if (G.mode !== 'play' || UI.paused) uiKey(name === 'dodge' || name === 'atk' ? 'Enter' : name === 'menu' ? 'Escape' : ''); else press(name); } if (!on && PADB[i] && (name === 'atk' || name === 'dodge')) release(name); PADB[i] = on; };
  edge(2, 'atk'); edge(0, 'dodge'); edge(3, 'flask'); edge(9, 'menu');
}
// A stick has two gears: pushed up to half way the hero creeps (quiet enough to pass sleepers), further it runs.
const CREEP = 0.35;
function gear(x, y) { const m = Math.hypot(x, y); if (m < 0.01) return [0, 0]; const g = m <= 0.5 ? CREEP : 0.65 + 0.35 * Math.min(1, (m - 0.5) / 0.5); return [x / m * g, y / m * g]; }
// once per frame: the local player's hands into the hero's input record
function readInput() {
  const h = G.me; if (!h) return; const I = h.inp, k = INPUT.keys;
  let x = 0, y = 0;
  if (INPUT.stick) { [x, y] = gear(INPUT.stick.vx, INPUT.stick.vy); }
  else { if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1; if (k.has('KeyD') || k.has('ArrowRight')) x += 1; if (k.has('KeyW') || k.has('ArrowUp')) y -= 1; if (k.has('KeyS') || k.has('ArrowDown')) y += 1; if (!x && !y && INPUT.pad) [x, y] = gear(INPUT.pad.x, INPUT.pad.y); }
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } if (k.has('KeyC') || k.has('ControlLeft') || k.has('ControlRight')) { x *= CREEP; y *= CREEP; } I.mx = x; I.my = y;
  I.atk = !!(INPUT.btn.atk || k.has('KeyJ') || k.has('KeyZ') || INPUT.mouse.l);
  I.dodge = !!(INPUT.btn.dodge || k.has('Space') || k.has('KeyK')); // held on after a roll: a sprint
  I.block = !!(INPUT.btn.block || k.has('ShiftLeft') || k.has('ShiftRight') || k.has('KeyL') || INPUT.mouse.r || (INPUT.pad && INPUT.pad.block));
  if (!INPUT.touch && performance.now() - INPUT.mouse.t < 2500) { const [wx, wy] = toWorld(INPUT.mouse.x, INPUT.mouse.y); I.aim = angTo(h.x, h.y - 4, wx, wy); } else I.aim = null;
}
// ---------- the buttons ----------
function drawControls(c) {
  if (!G.me || G.mode !== 'play') return; const L = btnLayout(), h = G.me, sc = ctrlScale();
  if (INPUT.touch) {
    const charge = h.act && h.act.k === 'charge' ? clamp(h.act.t / weaponOf(h).heavy.charge, 0, 1) : 0;
    roundBtn(c, L.atk, 'ATTACK', INPUT.btn.atk, '#f0d8a8', charge);
    roundBtn(c, L.dodge, 'ROLL', INPUT.btn.dodge, '#b8d8f0', 0, h.stam <= 0);
    roundBtn(c, L.block, h.off === 'shield' ? 'BLOCK' : 'GUARD', INPUT.btn.block, '#d8d0c0', 0, h.stam <= 0);
    roundBtn(c, L.flask, 'FLASK ' + h.flasks, INPUT.btn.flask, '#9fe8a8', 0, h.flasks <= 0);
  }
  if (L.clean) roundBtn(c, L.clean, 'CLEAN', INPUT.btn.clean, '#e8907a'); // the test room's blood wipe (every device)
  if (L.next) { roundBtn(c, L.next, TEST.mode === 'water' ? 'REFILL' : 'NEXT', INPUT.btn.next, '#9ad0e8'); c.globalAlpha = 0.85; font(c, 600, 12, F_HUD); spaced(c, TEST.label || '', VIEW.w / 2, L.next.y + L.next.r + 14, 2, '#f0e0c0', 'center'); c.globalAlpha = 1; } // the creature test room's next lot, and what is on now
  if (L.gnext) { roundBtn(c, L.gprev, 'PREV', INPUT.btn.gprev, '#ffe4a0'); roundBtn(c, L.gnext, 'NEXT', INPUT.btn.gnext, '#ffe4a0'); c.globalAlpha = 0.85; font(c, 600, 12, F_HUD); spaced(c, (GAL.i + 1) + ' / ' + GALLERY.length + '  ·  ' + GALLERY[GAL.i][0], VIEW.w / 2, L.gnext.y + L.gnext.r + 14, 2, '#f0e0c0', 'center'); c.globalAlpha = 1; } // (the night gallery: 65_gallery)
  if (L.list) roundBtn(c, L.list, 'LIST', DEATH_PICK.open, '#e8907a'); // (every death, to pick one: 64_testroom)
  if (L.hit) roundBtn(c, L.hit, 'HIT', INPUT.btn.hit, '#e8c07a'); // (a blow out of nowhere: 64_testroom)
  if (L.foes) { roundBtn(c, L.foes, 'FOES', INPUT.btn.foes, '#9ad0e8', 0, TEST.calm); if (TEST.calm) { c.globalAlpha = 0.8; c.strokeStyle = '#e8907a'; c.lineWidth = 2; c.beginPath(); c.moveTo(L.foes.x - L.foes.r * 0.6, L.foes.y + L.foes.r * 0.6); c.lineTo(L.foes.x + L.foes.r * 0.6, L.foes.y - L.foes.r * 0.6); c.stroke(); c.globalAlpha = 1; } } // (the armour room's foes, on or off: 64_testroom)
  if (L.die) { roundBtn(c, L.die, h && h.dead ? 'SKIP' : 'DIE', INPUT.btn.die, '#e8907a'); c.globalAlpha = 0.85; font(c, 600, 12, F_HUD); spaced(c, 'DIE: ' + testDeathName(TEST_DEATHS[TEST.di % TEST_DEATHS.length]) + '  \u25BE', VIEW.w / 2, L.next.y + L.next.r + 30, 2, '#e8907a', 'center'); c.globalAlpha = 1; } // (the armour and death room's next death; tap the name for the list of them all, 64_testroom)
  if (DEATH_PICK.open && TEST.on) drawPicker(c); // (the death picker, over the room: 64_testroom)
  // menu, top right (every device)
  const m = L.menu; c.globalAlpha = 0.8; c.fillStyle = 'rgba(10,8,12,0.55)'; c.beginPath(); c.arc(m.x, m.y, m.r, 0, TAU); c.fill(); c.fillStyle = '#e8dcc0'; for (let i = -1; i <= 1; i++) c.fillRect(m.x - m.r * 0.45, m.y + i * m.r * 0.32 - 1, m.r * 0.9, 2); c.globalAlpha = 1;
}
function roundBtn(c, b, txt, on, col, fill = 0, off = false) {
  c.globalAlpha = off ? 0.35 : on ? 0.95 : 0.7; c.fillStyle = on ? 'rgba(60,46,30,0.75)' : 'rgba(14,11,16,0.55)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
  c.lineWidth = 2; c.strokeStyle = col; c.beginPath(); c.arc(b.x, b.y, b.r - 1, 0, TAU); c.stroke();
  if (fill > 0) { c.lineWidth = 4; c.strokeStyle = fill >= 1 ? '#ffd860' : '#ffffff'; c.beginPath(); c.arc(b.x, b.y, b.r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * fill); c.stroke(); }
  font(c, 600, Math.max(11, b.r * 0.42), F_HUD); label(c, txt, b.x, b.y + b.r * 0.15, col, { align: 'center' }); c.globalAlpha = 1;
}
