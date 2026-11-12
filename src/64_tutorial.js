// ===================== a short, skippable tutorial during the first fight =====================
// Runs on a player's first solo game (and from HOW TO PLAY on the menu). Each step ends when the player does the thing.
const TUT = { on: false, pending: false, step: 0, t: 0, moved: 0, last: null, cast: false, dash: false, skipRect: null };
let tutSeen = false; try { tutSeen = localStorage.getItem('cor-tut') === '1'; } catch (e) { }
const TUT_STEPS = [
  { a: 'MOVE', b: () => INPUT.touch ? 'Touch anywhere and drag. The stick is invisible.' : 'Move with WASD or the arrow keys.', done: () => TUT.moved > 60 },
  { a: 'ATTACKS ARE AUTOMATIC', b: () => 'Your basic attack hits the nearest enemy by itself. Get close.', done: s => s.t > 5 },
  { a: 'CAST A SPELL', b: () => INPUT.touch ? 'Enemies near? Tap the glowing spell button.' : 'Enemies near? Press 1.', done: () => TUT.cast, btn: 0 },
  { a: 'DASH', b: () => (INPUT.touch ? 'Tap » to dash.' : 'Press Space to dash.') + ' Nothing can hurt you mid-dash.', done: () => TUT.dash, btn: 'dash' },
  { a: 'GROW STRONGER', b: () => 'Clear a floor to pick a new spell. Your ultimate wakes at level 12.', done: s => s.t > 6.5, btn: 'ult' },
  { a: 'NEED A BREATHER?', b: () => 'MANUAL switches to AUTO-CAST or AUTOPILOT. Good luck down there.', done: s => s.t > 6 },
];
function tutEnd() { TUT.on = false; TUT.pending = false; tutSeen = true; try { localStorage.setItem('cor-tut', '1'); } catch (e) { } }
function tutUpdate(rdt) {
  const me = G.me;
  if (TUT.pending && me && !G.choice && !G.choiceQ.length && !G.card) { TUT.pending = false; Object.assign(TUT, { on: true, step: 0, t: 0, moved: 0, last: null, cast: false, dash: false }); }
  if (TUT.on && (G.floor > 1 || G.autoMode === 2)) { tutEnd(); return; } // watching, or already past floor 1
  if (!TUT.on || !me || G.choice) return;
  if (TUT.last && me.inp && (me.inp.mx || me.inp.my)) TUT.moved += Math.hypot(me.x - TUT.last[0], me.y - TUT.last[1]); TUT.last = [me.x, me.y];
  const s = TUT_STEPS[TUT.step]; TUT.t += rdt;
  if (s.done(TUT)) { TUT.step++; TUT.t = 0; if (SFX.ctx) SFX.choice(); if (TUT.step >= TUT_STEPS.length) { tutEnd(); pushBanner({ a: 'THE CELLAR IS YOURS', b: 'TUTORIAL COMPLETE', col: 'gold', small: true, life: 1.8 }); } }
}
function drawTut(c) {
  TUT.skipRect = null; if (!TUT.on || G.choice || !G.me) return;
  const s = TUT_STEPS[TUT.step], W = VIEW.w, H = VIEW.h, S = VIEW.safe, B = H - Math.max(10, S.b + 8), w = Math.min(450, W - 40), h = 76, x = W / 2 - w / 2 - (W > 700 ? 40 : 0), y = B - h - 14, pulse = 0.6 + 0.4 * Math.sin(performance.now() / 260);
  c.fillStyle = 'rgba(16,11,18,0.9)'; c.fillRect(x, y, w, h); c.strokeStyle = `rgba(255,216,96,${0.5 + 0.3 * pulse})`; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  font(c, 500, 11, F_HUD); spaced(c, 'TUTORIAL · ' + (TUT.step + 1) + ' OF ' + TUT_STEPS.length, x + 12, y + 15, 2, '#a8987e');
  for (let i = 0; i < TUT_STEPS.length; i++) { c.fillStyle = i < TUT.step ? '#ffd860' : i === TUT.step ? `rgba(255,216,96,${pulse})` : 'rgba(255,255,255,0.18)'; c.fillRect(x + 130 + i * 11, y + 9, 7, 4); }
  font(c, 900, 20, F_DISP); label(c, s.a, x + 12, y + 37, '#fff1d0');
  font(c, 500, 15, F_HUD); const lines = wrapText(c, s.b(), w - 110); lines.slice(0, 2).forEach((ln, i) => label(c, ln, x + 12, y + 53 + i * 14 - (lines.length > 1 ? 0 : -2), '#d8c8a8'));
  const bw = 76, bx = x + w - bw - 10, by = y + 10; c.strokeStyle = 'rgba(200,160,80,0.7)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, 24); font(c, 600, 13, F_HUD); spaced(c, 'SKIP', bx + bw / 2, by + 17, 2, '#f0e0c0', 'center'); TUT.skipRect = [bx - 6, by - 6, bw + 12, 36];
  if (s.btn !== undefined) { const b = CTRL.buttons.find(q => q.id === s.btn); if (b) { c.strokeStyle = `rgba(255,216,96,${pulse})`; c.lineWidth = 3; c.shadowColor = '#ffd860'; c.shadowBlur = 18; c.beginPath(); c.arc(b.x, b.y, b.r + 7 + pulse * 4, 0, TAU); c.stroke(); c.shadowBlur = 0; } }
}
