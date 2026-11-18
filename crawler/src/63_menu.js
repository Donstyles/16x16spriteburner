// ===================== menus: the title, choosing a kit, the end of a run, pause =====================
const UI = { paused: false, titleT: 0 };
const MENU = { screen: 'title', rects: [], sel: 0 };
const KIT_ORDER = ['sellsword', 'lancer', 'gladiator', 'cutthroat'];
// A newer build on the site: a menu simply reloads into it; during a run the HUD says so and the pause menu offers the
// update (it ends the run). Checked every minute and whenever the game comes back to the front.
const BUILD = window.__BUILD || 'dev';
function checkVersion() {
  if (!/^https?:$/.test(location.protocol) || BUILD === 'dev' || /claude/.test(location.hostname)) return;
  fetch('version.txt?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : '').then(v => { v = (v || '').trim(); if (/^[0-9a-f]{8}$/.test(v) && v !== BUILD) { MENU.update = v; if (G.mode !== 'play') location.reload(); } }).catch(() => { });
}
setInterval(checkVersion, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkVersion(); if (SFX.ctx && SFX.ctx.state !== 'running') SFX.ctx.resume().catch(() => {}); } });
function btn(c, x, y, w, h, txt, fn, o = {}) {
  MENU.rects.push({ r: [x, y, w, h], fn });
  c.fillStyle = o.on ? 'rgba(90,64,34,0.85)' : 'rgba(18,14,20,0.78)'; c.fillRect(x, y, w, h);
  c.strokeStyle = o.col || '#c8a870'; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  font(c, 600, o.size || Math.min(26, h * 0.55), F_BTN); label(c, txt, x + w / 2, y + h / 2 + (o.size || Math.min(26, h * 0.55)) * 0.32, o.col || '#f0e0c0', { align: 'center' });
}
function uiTap(x, y) {
  if (G.mode === 'play' && !UI.paused) return;
  for (let i = MENU.rects.length - 1; i >= 0; i--) { const b = MENU.rects[i], [rx, ry, rw, rh] = b.r; if (x >= rx && y >= ry && x <= rx + rw && y <= ry + rh) { SFX.pop(0); b.fn(); return; } }
}
function uiKey(code) {
  if (UI.paused) { if (code === 'Escape' || code === 'Enter') togglePause(); return; }
  if (MENU.screen === 'title') { if (code === 'Enter' || code === 'Space') MENU.screen = 'kits'; }
  else if (MENU.screen === 'kits') { if (code === 'ArrowLeft' || code === 'KeyA') MENU.sel = (MENU.sel + 3) % 4; else if (code === 'ArrowRight' || code === 'KeyD') MENU.sel = (MENU.sel + 1) % 4; else if (code === 'Enter' || code === 'Space') beginRun(KIT_ORDER[MENU.sel]); else if (code === 'Escape') MENU.screen = 'title'; }
  else if (MENU.screen === 'tests') { if (code === 'Escape') MENU.screen = 'kits'; }
  else if (MENU.screen === 'summary') { if (code === 'Enter' || code === 'Space') MENU.screen = 'kits'; else if (code === 'Escape') MENU.screen = 'title'; }
}
function togglePause() { if (G.mode !== 'play') return; UI.paused = !UI.paused; INPUT.btn = {}; INPUT.stick = null; }
function beginRun(kit) { UI.paused = false; startRun(kit); }
function abandonRun() { UI.paused = false; TEST.on = false; G.mode = 'menu'; MENU.screen = 'title'; menuBackdrop(); }
function drawMenu(c) {
  MENU.rects.length = 0; TYPE.menu = true; const W = VIEW.w, H = VIEW.h, big = Math.min(W, H), t = G.time;
  c.fillStyle = 'rgba(4,3,6,0.45)'; c.fillRect(0, 0, W, H);
  if (MENU.screen === 'title') {
    font(c, 900, clamp(big / 4.4, 44, 104), F_LOGO); c.shadowColor = 'rgba(255,140,50,0.8)'; c.shadowBlur = 26 + 8 * Math.sin(t * 1.7); label(c, 'Cellar of Ruin II', W / 2, H * 0.36, '#f8ecd6', { align: 'center' }); c.shadowBlur = 0;
    font(c, 500, clamp(big / 22, 14, 22), F_HUD); spaced(c, 'A DUNGEON CRAWL', W / 2, H * 0.36 + clamp(big / 12, 26, 44), 5, '#c8a870', 'center');
    const bw = Math.min(260, W * 0.4), bh = clamp(big / 9, 40, 54); btn(c, W / 2 - bw / 2, H * 0.6, bw, bh, 'DESCEND', () => { MENU.screen = 'kits'; });
    font(c, 500, 14, F_HUD); spaced(c, (G.best ? 'DEEPEST FLOOR ' + G.best + '   ·   ' : '') + 'SOLO FOR NOW  ·  CO-OP RETURNS IN A LATER BUILD', W / 2, H * 0.6 + bh + 30, 2, 'rgba(240,224,192,0.6)', 'center');
    font(c, 500, 12, F_HUD); c.globalAlpha = 0.55; spaced(c, 'VERSION ' + BUILD.toUpperCase(), W - 14 - VIEW.safe.r, H - 12, 2, '#a8987e', 'right'); c.globalAlpha = 1;
  } else if (MENU.screen === 'kits') {
    font(c, 900, clamp(big / 9, 26, 46), F_DISP); label(c, 'Choose your kit', W / 2, H * 0.15, '#f8ecd6', { align: 'center' });
    const n = 4, gap = 10, cw = Math.min(190, (W - 40 - gap * 3) / n), ch = Math.min(H * 0.62, 250), x0 = W / 2 - (cw * n + gap * 3) / 2, y0 = H * 0.22;
    KIT_ORDER.forEach((k, i) => {
      const K = KITS[k], x = x0 + i * (cw + gap), on = MENU.sel === i, Wp = WEAPONS[K.weapon];
      MENU.rects.push({ r: [x, y0, cw, ch], fn: () => { if (MENU.sel === i) beginRun(k); else MENU.sel = i; } });
      c.fillStyle = on ? 'rgba(70,50,28,0.85)' : 'rgba(16,12,18,0.8)'; c.fillRect(x, y0, cw, ch); c.strokeStyle = on ? '#ffd27a' : '#6a5a44'; c.lineWidth = on ? 2 : 1; c.strokeRect(x + 0.5, y0 + 0.5, cw - 1, ch - 1);
      const m = MOBS[K.spr], s = Math.floor(Math.min(cw * 0.5, ch * 0.4) / m[2]), fr = ((t * 5) | 0) % 4; c.imageSmoothingEnabled = false; c.drawImage(IMG.mobs, fr * m[1], m[0], m[1], m[2], x + cw / 2 - m[1] * s / 2, y0 + 10, m[1] * s, m[2] * s);
      font(c, 900, clamp(cw / 7, 15, 24), F_DISP); label(c, K.name, x + cw / 2, y0 + 18 + m[2] * s + 12, '#f8ecd6', { align: 'center' });
      font(c, 500, clamp(cw / 13, 11, 15), F_HUD); const lines = []; K.blurb.split(' · ').forEach((L, j) => { for (const l of TYPE.on ? wrapTo(c, L, cw - 14) : [L]) lines.push([l, j]); }); lines.forEach(([L, j], i) => label(c, L, x + cw / 2, y0 + 18 + m[2] * s + 34 + i * 16, j ? 'rgba(240,224,192,0.75)' : '#c8a870', { align: 'center', max: cw - 12 }));
      label(c, 'HEALTH ' + K.hp + '  ·  ' + Wp.name, x + cw / 2, y0 + ch - 12, 'rgba(240,224,192,0.6)', { align: 'center', max: cw - 12 });
    });
    const bw = Math.min(240, W * 0.36), bh = 42; btn(c, W / 2 - bw / 2, Math.min(H - bh - 12, y0 + ch + 14), bw, bh, 'BEGIN AS ' + KITS[KIT_ORDER[MENU.sel]].name, () => beginRun(KIT_ORDER[MENU.sel]));
    btn(c, 14 + VIEW.safe.l, 14 + VIEW.safe.t, 70, 32, 'BACK', () => { MENU.screen = 'title'; }, { size: 16 });
    btn(c, W - 14 - VIEW.safe.r - 130, 14 + VIEW.safe.t, 130, 32, 'TEST ROOMS', () => { MENU.screen = 'tests'; }, { size: 15, col: '#a8987e' });
  } else if (MENU.screen === 'tests') {
    // (the test rooms and set-piece floors: off the kit screen, played as the kit chosen there)
    const k = KIT_ORDER[MENU.sel]; font(c, 900, clamp(big / 9, 26, 46), F_DISP); label(c, 'Test rooms', W / 2, H * 0.15, '#f8ecd6', { align: 'center' });
    font(c, 500, 13, F_HUD); spaced(c, 'AS ' + KITS[k].name, W / 2, H * 0.15 + 24, 2, 'rgba(240,224,192,0.6)', 'center');
    const T = [['ARMOUR & DEATH ROOM', () => beginArmourTest(k), '#ecdcae'], ['SHOP', () => beginShopTest(k), '#ffd860'], ['PUZZLE FLOOR', () => beginPuzzleFloor(k), '#e8c87a'], ['PIT FLOOR', () => beginPitFloor(k), '#c8a0e8'], ['BLOOD TEST ROOM', () => beginTest(k), '#e8907a'], ['CREATURE TEST ROOM', () => beginCreatureTest(k), '#9ad0e8'], ['WATER TEST ROOM', () => beginWaterTest(k), '#7ab8f0']];
    const bw = Math.min(260, W * 0.42), y0 = H * 0.15 + 42, bh = clamp((H - y0 - 14 - VIEW.safe.b) / T.length - 8, 30, 40);
    T.forEach(([txt, fn, col], i) => btn(c, W / 2 - bw / 2, y0 + i * (bh + 8), bw, bh, txt, fn, { size: 15, col }));
    btn(c, 14 + VIEW.safe.l, 14 + VIEW.safe.t, 70, 32, 'BACK', () => { MENU.screen = 'kits'; }, { size: 16 });
  } else if (MENU.screen === 'summary') {
    const s = G.summary || {}; font(c, 900, clamp(big / 6, 34, 72), F_DISP); c.shadowColor = 'rgba(255,40,30,0.7)'; c.shadowBlur = 24; label(c, 'You have fallen', W / 2, H * 0.3, '#f8ecd6', { align: 'center' }); c.shadowBlur = 0;
    font(c, 500, clamp(big / 20, 15, 22), F_HUD);
    [(s.kit ? KITS[s.kit].name + '  ·  ' : '') + 'FLOOR ' + s.floor + ', ' + (s.name || ''), s.kills + ' FOES SLAIN  ·  ' + s.gold + ' GOLD', 'DEEPEST FLOOR SO FAR ' + G.best].forEach((L, i) => spaced(c, L, W / 2, H * 0.42 + i * 26, 2.5, i ? 'rgba(240,224,192,0.75)' : '#ffd27a', 'center'));
    const bw = Math.min(200, W * 0.3), bh = 42; btn(c, W / 2 - bw - 8, H * 0.7, bw, bh, 'AGAIN', () => { MENU.screen = 'kits'; }); btn(c, W / 2 + 8, H * 0.7, bw, bh, 'TITLE', () => { MENU.screen = 'title'; });
  }
}
function drawPause(c) {
  if (!UI.paused) return; MENU.rects.length = 0; TYPE.menu = true; const W = VIEW.w, H = VIEW.h, big = Math.min(W, H);
  c.fillStyle = 'rgba(4,3,6,0.72)'; c.fillRect(0, 0, W, H);
  font(c, 900, clamp(big / 8, 30, 56), F_DISP); label(c, 'Paused', W / 2, H * 0.24, '#f8ecd6', { align: 'center' });
  font(c, 500, 14, F_HUD);
  ['TAP ATTACK TO STRIKE, HOLD IT TO CHARGE A HEAVY BLOW', 'ROLL THROUGH BLOWS · HOLD BLOCK, OR RAISE IT JUST AS A BLOW LANDS TO PARRY', 'HIT SLEEPING OR UNAWARE FOES FOR A SNEAK ATTACK · RED MARKS SHOW WHERE A BLOW WILL LAND', 'KEYS: WASD · J ATTACK · SPACE ROLL · SHIFT BLOCK · F FLASK · ESC MENU'].forEach((L, i) => spaced(c, L, W / 2, H * 0.36 + i * 20, 1.5, 'rgba(240,224,192,0.8)', 'center'));
  const bw = Math.min(220, W * 0.32), bh = 42; btn(c, W / 2 - bw / 2, H * 0.66 - 46, bw, 34, 'GORE: ' + GORE_NAMES[GORE.level], () => setGore((GORE.level + 2) % 3), { size: 15 }); btn(c, W / 2 - bw - 8, H * 0.66, bw, bh, 'RESUME', togglePause); btn(c, W / 2 + 8, H * 0.66, bw, bh, 'ABANDON RUN', abandonRun, { col: '#e8907a' });
  if (MENU.update) btn(c, W / 2 - bw - 8, H * 0.66 + bh + 12, bw * 2 + 16, 38, 'NEW VERSION READY  ·  UPDATE NOW (ENDS THIS RUN)', () => location.reload(), { col: '#ffb860', size: 17, on: true });
}
