// ===================== input =====================
const I = {
  keys: {}, mx: 0, my: 0, acts: {}, held: {}, buttons: [], touchBtn: new Map(), joy: null, isTouch: false, tapPos: null, pointer: null, clicked: null, wheel: 0,
  init(el) {
    const KM = { Space: 'attack', Enter: 'turn', KeyE: 'interact', KeyC: 'char', KeyI: 'inventory', KeyB: 'spells', KeyM: 'map', KeyQ: 'quests', KeyR: 'rest', Escape: 'menu', Digit1: 'sel1', Digit2: 'sel2', Digit3: 'sel3', Digit4: 'sel4', KeyF: 'cast', Tab: 'nextchar', KeyJ: 'journal' };
    window.addEventListener('keydown', e => { if (e.repeat) { e.preventDefault(); return; } this.keys[e.code] = true; const a = KM[e.code]; if (a) { this.press(a); e.preventDefault(); } if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault(); if (this.textTarget && e.key.length === 1) this.textTarget(e.key); if (this.textTarget && e.code === 'Backspace') this.textTarget('\b'); });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; const a = KM[e.code]; if (a) this.held[a] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.held = {}; });
    el.addEventListener('mousedown', e => { if (this.isTouch) return; this.pointer = { x: e.clientX, y: e.clientY }; const b = this.hit(e.clientX, e.clientY); if (b) { this.press(b.id); this.mouseBtn = b.id; return; } this.clicked = { x: e.clientX, y: e.clientY, right: e.button === 2 }; });
    el.addEventListener('mouseup', () => { if (this.mouseBtn) { this.held[this.mouseBtn] = false; this.mouseBtn = null; } });
    el.addEventListener('mousemove', e => { this.pointer = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('wheel', e => { this.wheel += Math.sign(e.deltaY); }, { passive: true });
    const ts = e => { this.isTouch = true; for (const t of e.changedTouches) { const b = this.hit(t.clientX, t.clientY); if (b) { this.touchBtn.set(t.identifier, b.id); this.press(b.id); continue; } if (!this.joy && t.clientX < window.innerWidth * 0.45 && !this.modal) { this.joy = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY }; continue; } this.tapStart = { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now() }; } if (e.cancelable) e.preventDefault(); };
    const tm = e => { for (const t of e.changedTouches) { if (this.joy && t.identifier === this.joy.id) { this.joy.x = t.clientX; this.joy.y = t.clientY; } if (this.tapStart && t.identifier === this.tapStart.id) { this.tapStart.mx = t.clientX; this.tapStart.my = t.clientY; } } if (e.cancelable) e.preventDefault(); };
    const te = e => { for (const t of e.changedTouches) { const bid = this.touchBtn.get(t.identifier); if (bid) { this.held[bid] = false; this.touchBtn.delete(t.identifier); continue; } if (this.joy && t.identifier === this.joy.id) { this.joy = null; continue; } if (this.tapStart && t.identifier === this.tapStart.id) { const d = Math.hypot(t.clientX - this.tapStart.x, t.clientY - this.tapStart.y); if (d < 14 && performance.now() - this.tapStart.t < 400) this.clicked = { x: t.clientX, y: t.clientY, touch: true }; else if (d >= 14) this.swipe = { dx: t.clientX - this.tapStart.x, dy: t.clientY - this.tapStart.y }; this.tapStart = null; } } if (e.cancelable) e.preventDefault(); };
    window.addEventListener('touchstart', ts, { passive: false }); window.addEventListener('touchmove', tm, { passive: false }); window.addEventListener('touchend', te, { passive: false }); window.addEventListener('touchcancel', te, { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
  },
  hit(x, y) { for (let i = this.buttons.length - 1; i >= 0; i--) { const b = this.buttons[i]; if (x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 4 && y <= b.y + b.h + 4) return b; } return null; },
  press(id) { this.acts[id] = (this.acts[id] || 0) + 1; this.held[id] = true; },
  take(id) { if (this.acts[id]) { this.acts[id]--; return true; } return false; },
  update() {
    let mx = 0, my = 0; const k = this.keys;
    if (k.KeyW || k.ArrowUp) my -= 1; if (k.KeyS || k.ArrowDown) my += 1; if (k.KeyA && false) mx -= 1; if (k.ArrowLeft) mx -= 1; if (k.ArrowRight || k.KeyD) mx += 1; if (k.KeyA) mx -= 1;
    if (this.joy) { const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy, d = Math.hypot(dx, dy), r = 44; if (d > 5) { const mm = Math.min(1, d / r); mx = dx / d * mm; my = dy / d * mm; } }
    const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
    this.mx = mx; this.my = my;
  },
  endFrame() { this.acts = {}; this.clicked = null; this.swipe = null; this.wheel = 0; },
};
