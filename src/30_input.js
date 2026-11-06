// ===== Input: keyboard, mouse, multitouch =====
const Input = {
  keys: {}, mx: 0, my: 0, turn: 0, pitchD: 0, actions: {}, held: {}, buttons: [], touchBtn: new Map(),
  joy: null, look: null, pointerLocked: false, isTouch: false, lastTap: 0, sensT: 0.0045, sensP: 0.9, anyKey: 0,
  init(viewEl) {
    const KEYMAP = { ' ': 'attack', 'Space': 'attack', 'ShiftLeft': 'dodge', 'ShiftRight': 'dodge', 'KeyF': 'flask', 'KeyE': 'interact', 'Enter': 'interact', 'KeyM': 'map', 'Escape': 'menu', 'Digit1': 'ab1', 'Digit2': 'ab2', 'Digit3': 'ab3', 'Digit4': 'ab4', 'KeyR': 'flask', 'Tab': 'menu', 'KeyI': 'menu' };
    window.addEventListener('keydown', e => {
      if (e.repeat) { if (KEYMAP[e.code]) e.preventDefault(); return; }
      this.keys[e.code] = true; this.anyKey++;
      const a = KEYMAP[e.code]; if (a) { this.press(a); e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'Tab' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; const a = KEYMAP[e.code]; if (a) this.held[a] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.held = {}; });
    // mouse
    viewEl.addEventListener('mousedown', e => {
      if (this.isTouch) return;
      const b = this.hitButton(e.clientX, e.clientY);
      if (b) { this.press(b.id); this.mouseBtn = b.id; return; }
      if (!this.pointerLocked) { try { const pr = viewEl.requestPointerLock && viewEl.requestPointerLock(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { } this.anyKey++; return; }
      if (e.button === 0) this.press('attack'); else if (e.button === 2) this.press('dodge');
    });
    viewEl.addEventListener('mouseup', () => { if (this.mouseBtn) { this.held[this.mouseBtn] = false; this.mouseBtn = null; } this.held.attack = false; });
    viewEl.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => { this.pointerLocked = document.pointerLockElement === viewEl; });
    window.addEventListener('mousemove', e => {
      if (this.pointerLocked) { this.turn += e.movementX * 0.0022; this.pitchD -= e.movementY * 0.35; }
      this.mouseX = e.clientX; this.mouseY = e.clientY;
    });
    // touch
    const ts = e => {
      this.isTouch = true; this.anyKey++;
      for (const t of e.changedTouches) {
        const b = this.hitButton(t.clientX, t.clientY);
        if (b) { this.touchBtn.set(t.identifier, b.id); this.press(b.id); continue; }
        if (!this.joy && t.clientX < window.innerWidth * 0.42) { this.joy = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY }; continue; }
        if (!this.look) { this.look = { id: t.identifier, lx: t.clientX, ly: t.clientY, sx: t.clientX, sy: t.clientY, t: performance.now(), moved: 0 }; continue; }
      }
      if (e.cancelable) e.preventDefault();
    };
    const tm = e => {
      for (const t of e.changedTouches) {
        if (this.joy && t.identifier === this.joy.id) { this.joy.x = t.clientX; this.joy.y = t.clientY; }
        else if (this.look && t.identifier === this.look.id) {
          const dx = t.clientX - this.look.lx, dy = t.clientY - this.look.ly;
          this.turn += dx * this.sensT; this.pitchD -= dy * this.sensP; this.look.lx = t.clientX; this.look.ly = t.clientY; this.look.moved += Math.abs(dx) + Math.abs(dy);
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    const te = e => {
      for (const t of e.changedTouches) {
        const bid = this.touchBtn.get(t.identifier);
        if (bid) { this.held[bid] = false; this.touchBtn.delete(t.identifier); this.release(bid); continue; }
        if (this.joy && t.identifier === this.joy.id) this.joy = null;
        else if (this.look && t.identifier === this.look.id) {
          if (this.look.moved < 12 && performance.now() - this.look.t < 250) this.press('tap', { x: t.clientX, y: t.clientY });
          this.look = null;
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener('touchstart', ts, { passive: false });
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', te, { passive: false });
    window.addEventListener('touchcancel', te, { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
  },
  hitButton(x, y) {
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      const b = this.buttons[i];
      if (x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 6) return b;
    }
    return null;
  },
  press(id, data) { this.actions[id] = (this.actions[id] || 0) + 1; this.held[id] = true; this.lastData = data; this.lastPressed = id; },
  release(id) { this.released = this.released || {}; this.released[id] = true; },
  consume(id) { if (this.actions[id]) { this.actions[id]--; return true; } return false; },
  // call once per frame to compute analogue axes
  update() {
    let mx = 0, my = 0;
    const k = this.keys;
    if (k.KeyW || k.ArrowUp) my += 1; if (k.KeyS || k.ArrowDown) my -= 1;
    if (k.KeyA) mx -= 1; if (k.KeyD) mx += 1;
    let turn = 0; if (k.ArrowLeft || k.KeyQ) turn -= 1; if (k.ArrowRight || k.KeyE && false) turn += 1; if (k.ArrowRight) turn += 1;
    this.turnKey = turn;
    if (this.joy) {
      const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy, r = 46;
      const d = Math.hypot(dx, dy), m = Math.min(1, d / r);
      if (d > 4) { mx = dx / d * m; my = -dy / d * m; }
    }
    const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
    this.mx = mx; this.my = my;
  },
  endFrame() { this.actions = {}; this.turn = 0; this.pitchD = 0; this.released = {}; this.lastPressed = null; },
};
