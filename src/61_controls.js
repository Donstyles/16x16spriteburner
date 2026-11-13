// ===================== one hero, real controls: thumb-stick, dash, skill buttons, keyboard, gamepad =====================
const INPUT = { keys: new Set(), stick: null, castQ: [], dashQ: false, pad: null, padPrev: [], lastT: -1e9, touch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0, dest: null, tapId: null };
// movement schemes: drag anywhere (invisible stick) · tap to move (tap a spot, hold and drag to steer) · fixed stick (bottom left)
const SCHEMES = ['drag', 'tap', 'stick'], SCHEME_LABEL = { drag: 'DRAG ANYWHERE', tap: 'TAP TO MOVE', stick: 'FIXED STICK' };
INPUT.scheme = (() => { try { const v = localStorage.getItem('cor-controls'); return SCHEMES.includes(v) ? v : 'tap'; } catch (e) { return 'tap'; } })(); // new players start with tap to move
function cycleScheme() { INPUT.scheme = SCHEMES[(SCHEMES.indexOf(INPUT.scheme) + 1) % SCHEMES.length]; try { localStorage.setItem('cor-controls', INPUT.scheme); } catch (e) { } INPUT.dest = null; INPUT.stick = null; INPUT.moved = false; netSay('MOVEMENT: ' + SCHEME_LABEL[INPUT.scheme], 3); }
function moveHint() { return !INPUT.touch && INPUT.scheme !== 'tap' ? 'MOVE WITH WASD OR THE ARROW KEYS' : INPUT.scheme === 'tap' ? (INPUT.touch ? 'TAP WHERE YOU WANT TO GO' : 'CLICK WHERE YOU WANT TO GO') : INPUT.scheme === 'stick' ? 'USE THE STICK AT THE BOTTOM LEFT' : 'TOUCH ANYWHERE AND DRAG TO MOVE'; }
function toWorld(px, py) { const s = CAM.z * (1 + CAM.kick); return [(px - VIEW.w / 2 - SH.x) / s + CAM.x, (py - VIEW.h / 2 - SH.y) / s + CAM.y]; }
function setDest(px, py) { if (!ARENA || moveLevel() >= 1) return; const [wx, wy] = toWorld(px, py); INPUT.dest = { x: clamp(wx, ARENA.x0 + 4, ARENA.x1 - 4), y: clamp(wy, ARENA.y0 + 2, ARENA.y1 - 2), at: performance.now() }; INPUT.moved = true; }
function stickBase() { const S = VIEW.safe, sc = ctrlScale(); return [Math.max(14, S.l + 10) + 80 * sc, VIEW.h - Math.max(12, S.b + 8) - 80 * sc, 52 * sc]; }
function stickMove(s, px, py) {
  const R = s.fixed ? stickBase()[2] : 48 * ctrlScale(); let dx = px - s.ox, dy = py - s.oy, d = Math.hypot(dx, dy);
  if (!s.fixed && d > R * 1.5) { s.ox += dx / d * (d - R * 1.5); s.oy += dy / d * (d - R * 1.5); dx = px - s.ox; dy = py - s.oy; d = Math.hypot(dx, dy); }
  const k = Math.min(d, R) / R; s.vx = d > 5 ? dx / d * k : 0; s.vy = d > 5 ? dy / d * k : 0; s.x = px; s.y = py; if (k > 0.4) INPUT.moved = true;
}
const CTRL = { buttons: [], top: [], fx: {}, topLeft: 1e9 };
// three separate switches: who moves the hero, who casts the spells, and how a touch steers
const MOVE_LABEL = ['MANUAL', 'AUTO MOVE', 'AUTOPILOT'], MOVE_SUB = ['YOU STEER AND DODGE', 'YOUR HERO WALKS BY ITSELF · YOU DODGE', 'YOUR HERO WALKS AND DODGES ON ITS OWN'];
const SPELL_LABEL = ['MANUAL', 'AUTO'], SPELL_SUB = ['TAP A SKILL TO CAST IT', 'SKILLS CAST THEMSELVES · TAP ONE TO CAST IT NOW'];
const SCHEME_SHORT = { drag: 'DRAG', tap: 'TAP TO MOVE', stick: 'STICK' };
const DASH_N = 1, DASH_T = 15; // one dodge, then a long wait before the next
const HEALS = new Set(['MEND', 'REJUVENATE', 'MASS HEAL']);
const HERO_BLURB = {
  warrior: ['STEEL · MELEE', 'Wades into the horde with cleaves, flurries and floor-splitting slams.', ['WHIRLWIND', 'THOUSAND CUTS', 'CATACLYSM']],
  pyro: ['FIRE · RANGED', 'Burns everything from range: fire walls, lava, lasers and meteors.', ['HEAT RAY', 'FIREBALL', 'METEOR STORM']],
  storm: ['LIGHTNING · RANGED', 'Chains, stuns and sweeps the room with lightning lasers.', ['LIGHTNING LANCE', 'ARC CANNON', 'THUNDERSTORM']],
  druid: ['EARTH · SUPPORT', 'Self-healing tank: roots, stone fists and rolling boulders.', ['STONE FIST', 'BOULDER ROLL', 'EARTHQUAKE']],
};
// screen point → game point (the canvas may be turned 90° on an upright phone)
const ptr = e => VIEW.rot ? [e.clientY, VIEW.iw - e.clientX] : [e.clientX, e.clientY];
function touched() { INPUT.lastT = performance.now(); }
const idle = () => !INPUT.dest && performance.now() - INPUT.lastT > (INPUT.scheme === 'tap' ? 30000 : 10000); // tap players touch the screen less often
const idleNow = () => idle() && G.phase === 'fight' && G.wave >= 1 && !G.choice; // nobody touching: the hero fights on alone
function moveLevel() { return idleNow() ? 2 : G.moveMode; }
function spellAuto() { return idleNow() ? 1 : G.spellMode; }
function autoLevel() { return moveLevel() === 2 ? 2 : spellAuto() ? 1 : 0; }
function loadModes() { try { const v = (localStorage.getItem('cor-modes') || '').split(','); G.moveMode = clamp(+v[0] || 0, 0, 2); G.spellMode = v[1] === '1' ? 1 : 0; } catch (e) { } }
function saveModes() { try { localStorage.setItem('cor-modes', G.moveMode + ',' + G.spellMode); } catch (e) { } }
function cycleMove() { G.moveMode = (G.moveMode + 1) % 3; touched(); saveModes(); INPUT.dest = null; textBanner(G.moveMode ? MOVE_LABEL[G.moveMode] : 'MANUAL MOVEMENT', MOVE_SUB[G.moveMode], 'gold', true); }
function cycleSpells() { G.spellMode = G.spellMode ? 0 : 1; touched(); saveModes(); textBanner(G.spellMode ? 'AUTO SPELLS' : 'MANUAL SPELLS', SPELL_SUB[G.spellMode], 'gold', true); }
function inputVec() {
  let x = 0, y = 0;
  if (INPUT.stick) { x = INPUT.stick.vx; y = INPUT.stick.vy; INPUT.dest = null; }
  else { const k = INPUT.keys; if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1; if (k.has('KeyD') || k.has('ArrowRight')) x += 1; if (k.has('KeyW') || k.has('ArrowUp')) y -= 1; if (k.has('KeyS') || k.has('ArrowDown')) y += 1; if (!x && !y && INPUT.pad) { x = INPUT.pad.x; y = INPUT.pad.y; } }
  if ((x || y) && INPUT.dest && !INPUT.stick) INPUT.dest = null;
  const me = G.me, D = INPUT.dest; if (!x && !y && D && me) { const dx = D.x - me.x, dy = D.y - me.y, d = Math.hypot(dx, dy); if (d < 3 || me.dead || performance.now() - D.at > 6000) INPUT.dest = null; else { const k = Math.min(1, d / 10); x = dx / d * k; y = dy / d * k; } }
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } return [x, y];
}
// ---------- input events ----------
function setupControls() {
  const first = () => { if (SFX.ctx) return; SFX.init(); try { const el = document.documentElement; if (el.requestFullscreen && !/iPhone|iPad/.test(navigator.userAgent)) el.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { })).catch(() => { }); } catch (e) { } try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => { }); } catch (e) { } };
  const inRect = (q, x, y) => q && x >= q[0] && x <= q[0] + q[2] && y >= q[1] && y <= q[1] + q[3];
  addEventListener('pointerdown', e => {
    const [x, y] = ptr(e); touched(); first();
    if (G.mode !== 'play') { menuTap(x, y); return; }
    if (NET.panel) { netPanelTap(x, y); return; }
    if (UI.menuOpen) { pauseTap(x, y); return; }
    if (TRAIN.open) { trainTap(x, y); return; }
    if (TUT.skipRect && inRect(TUT.skipRect, x, y)) { tutEnd(); return; }
    if (UI.bookOpen) { if (!bookTap(x, y)) UI.bookOpen = false; return; }
    if (NET.indRect && inRect(NET.indRect, x, y)) { NET.detail = !NET.detail; return; }
    for (const b of CTRL.top) if (inRect(b.r, x, y)) { b.fn(); return; }
    if (TRAIN.meterRect && inRect(TRAIN.meterRect, x, y)) { trainReset(); return; }
    if (G.choice) { if (G.choice.picked < 0) { if (G.choice.kind === 'draft' && inRect(UI.draftRect, x, y)) { G.acted = true; autoDraft(); return; } const i = choiceAt(x, y); if (i >= 0) pickChoice(i, true); } return; }
    for (const b of CTRL.buttons) if (Math.hypot(x - b.x, y - b.y) <= b.r + 10) { b.press(); (CTRL.fx[b.id] = CTRL.fx[b.id] || {}).flash = 0.15; return; }
    if (inRect(UI.frameRect, x, y)) { UI.bookOpen = true; return; }
    if (INPUT.scheme === 'tap') { setDest(x, y); INPUT.tapId = e.pointerId; return; }
    if (INPUT.scheme === 'stick') { const [bx, by, R] = stickBase(); if (!INPUT.stick && Math.hypot(x - bx, y - by) < R * 1.9) { INPUT.stick = { id: e.pointerId, ox: bx, oy: by, x, y, vx: 0, vy: 0, fixed: true }; stickMove(INPUT.stick, x, y); } return; }
    if (!INPUT.stick) INPUT.stick = { id: e.pointerId, ox: x, oy: y, x, y, vx: 0, vy: 0 };
  });
  addEventListener('pointermove', e => {
    if (G.choice) G.choice.hover = choiceAt(...ptr(e));
    if (INPUT.tapId !== null && e.pointerId === INPUT.tapId && G.mode === 'play' && !G.choice) { touched(); setDest(...ptr(e)); return; }
    const s = INPUT.stick; if (!s || e.pointerId !== s.id) return; touched(); stickMove(s, ...ptr(e));
  });
  const up = e => { if (INPUT.stick && e.pointerId === INPUT.stick.id) INPUT.stick = null; if (e.pointerId === INPUT.tapId) INPUT.tapId = null; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up); addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => {
    const c = e.code; touched(); first();
    if (G.mode === 'join') { if (/^Key[A-Z]$/.test(c)) codeKey(c.slice(3)); else if (c === 'Backspace') codeKey('DEL'); else if (c === 'Enter' && MENU.code.length === 4) netJoin(MENU.code); else if (c === 'Escape') G.mode = MENU.back; return; }
    if (G.mode === 'menu') { if (c === 'Enter') startSolo(); return; } if (G.mode !== 'play') return;
    if (c === 'KeyB') { UI.bookOpen = !UI.bookOpen; return; } if (c === 'Escape' && TUT.on && !UI.bookOpen) { tutEnd(); return; } if (c === 'Escape') { if (TRAIN.open) TRAIN.open = false; else if (UI.bookOpen) UI.bookOpen = false; else if (NET.panel) NET.panel = false; else UI.menuOpen = !UI.menuOpen; return; } if (c === 'KeyL' && G.training && TRAIN.ready) { TRAIN.open = !TRAIN.open; return; } if (UI.bookOpen || UI.menuOpen || TRAIN.open) return;
    if (G.choice) { if (G.choice.picked < 0 && /^Digit[1-3]$/.test(c)) pickChoice(+c.slice(5) - 1, true); return; }
    if (c === 'Space' || c === 'ShiftLeft' || c === 'ShiftRight') { INPUT.dashQ = true; e.preventDefault(); }
    if (/^Digit[1-3]$/.test(c)) INPUT.castQ.push(+c.slice(5) - 1);
    if (c === 'KeyR' || c === 'KeyQ') INPUT.castQ.push('ult');
    if (c === 'KeyT') cycleMove(); if (c === 'KeyG') cycleSpells(); if (c === 'KeyC') cycleScheme(); if (c === 'KeyM') SFX.toggle();
    if (/^(Key[WASD]|Arrow)/.test(c)) { INPUT.keys.add(c); INPUT.dest = null; e.preventDefault(); }
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
  if (edge(9)) UI.bookOpen = !UI.bookOpen; if (edge(8)) cycleMove(); if (edge(10)) cycleSpells();
  if (G.choice) { if (G.choice.picked < 0) [2, 3, 1].forEach((b, i) => { if (edge(b)) pickChoice(i, true); }); }
  else if (!UI.bookOpen) { if (edge(0)) INPUT.dashQ = true; [2, 3, 1].forEach((b, i) => { if (edge(b)) INPUT.castQ.push(i); }); if (edge(7) || edge(4)) INPUT.castQ.push('ult'); }
  INPUT.padPrev = gp.buttons.map(b => b.pressed);
}
// ---------- the hero, driven by the player ----------
function slotSpell(h, slot) { const sb = sbOf(h), name = slot === 'ult' ? HERO_PROG[h.key].ult : (sb.slots || [])[slot]; if (!name || !sb.known.has(name)) return null; return SPELLBOOK[h.key].find(s => s.name === name); }
function setCd(h, name, v) { h.cd[name] = v; (h.cdMax || (h.cdMax = {}))[name] = v; }
function tryCast(h, slot, foes) {
  const sp = slotSpell(h, slot), fail = () => { if (h === G.me) (CTRL.fx[slot] = CTRL.fx[slot] || {}).shake = 0.3; };
  if (!sp) return fail();
  if (sp.tier === 4) { if (h.ult < 100) return fail(); if (ultBlocked()) { if (h === G.me) netSay('WAIT · ' + (G.ultBy ? G.ultBy + '’S' : 'ANOTHER') + ' ULTIMATE IS STILL GOING', 2); return fail(); } } else if ((h.cd[sp.name] || 0) > 0) return fail();
  let t = sp.pick(h, foes); if (!t) t = HEALS.has(sp.name) ? h : nearest(h, foes, 260); if (!t) return fail();
  if (sp.tier === 4) startUlt(h, sp); else setCd(h, sp.name, sp.cd * md(sp.name).cd);
  beginCast(h, { ...sp, wind: (sp.wind || 0) * 0.6, free: true }, t === true ? null : t); if (h === G.me) TUT.cast = true;
}
// dodging: DASH_N charges, each coming back after DASH_T seconds
function canDash(h) { const st = h.state; return (h.dashN === undefined ? DASH_N : h.dashN) > 0 && !(h.stun > 0) && !(st && (st.k === 'cuts' || st.k === 'leap' || st.k === 'dash' || (st.k === 'cast' && st.sp && st.sp.tier >= 4))); }
function dashTick(h, dt) { if (h.dashN === undefined) { h.dashN = DASH_N; h.dashT = 0; } if (h.dashN < DASH_N && (h.dashT -= dt) <= 0) { h.dashN++; h.dashT = h.dashN < DASH_N ? DASH_T : 0; } }
function dashFail(h) { if (h === G.me) (CTRL.fx.dash = CTRL.fx.dash || {}).shake = 0.3; }
function doDash(h, ix, iy, ai) {
  let dx = ix, dy = iy; if (!dx && !dy) { dx = h.face; dy = 0; } const l = Math.hypot(dx, dy); dx /= l; dy /= l;
  h.iframe = 0.35; h.dashN = (h.dashN === undefined ? DASH_N : h.dashN) - 1; if (!(h.dashT > 0)) h.dashT = DASH_T; h.face = dx < 0 ? -1 : 1;
  smoke(h.x, h.y, 4, 'dust', 8, 30, 0.7); ring(h.x, h.y, 16, h.def.col, 0.25, 2); SFX.whoosh(panOf(h.x));
  dash(h, h.x + dx * 62, h.y + dy * 50, 0.17, { r: 0, col: h.def.col }); if (h === G.me && !ai) TUT.dash = true;
}
// what is about to hurt this hero: telegraphed slams, shots about to land, a crowd closing in while badly hurt
function threatDir(h, foes) {
  let ax = 0, ay = 0, why = 0; const R = h.r + 3;
  for (const t of FX.tele) { if (t.col !== 'red' || t.life - t.t > 0.4) continue; const dx = h.x - t.x, dy = (h.y - t.y) / 0.72, d = Math.hypot(dx, dy); if (d < t.r + R) { const w = 1 / Math.max(4, d); ax += (d > 0.5 ? dx : rand(-1, 1)) * w; ay += (d > 0.5 ? dy * 0.72 : rand(-1, 1)) * w; why = 2; } }
  if ((h.dashN || 0) >= 2 || h.hp < h.maxHp * 0.5) for (const p of G.proj) {
    if (p.team !== 'mon' || p.dead) continue; const v2 = p.vx * p.vx + p.vy * p.vy; if (v2 < 100) continue;
    const tc = ((h.x - p.x) * p.vx + (h.y - p.y) * p.vy) / v2; if (tc < 0 || tc > 0.22) continue;
    const cx = h.x - p.x - p.vx * tc, cy = h.y - p.y - p.vy * tc; if (Math.hypot(cx, cy) > R + (p.r || 3)) continue;
    const l = Math.sqrt(v2), s = cx * -p.vy + cy * p.vx >= 0 ? 1 : -1; ax += -p.vy / l * s; ay += p.vx / l * s; if (!why) why = 1;
  }
  if (h.hp < h.maxHp * 0.35) { const near = within(h.x, h.y, 30, foes); if (near.length >= 4) { let cx = 0, cy = 0; for (const u of near) { cx += u.x; cy += u.y; } ax += (h.x - cx / near.length) * 0.2; ay += (h.y - cy / near.length) * 0.2; why = 3; } }
  return [ax, ay, why];
}
// a dodge direction that stays inside the walls
function fitDash(h, ax, ay) { const l = Math.hypot(ax, ay); if (l < 1e-6) return [0, 0]; ax /= l; ay /= l; const A = ARENA; if (h.x + ax * 62 < A.x0 + 8 || h.x + ax * 62 > A.x1 - 8) ax = -ax * 0.5; if (h.y + ay * 50 < A.y0 + 4 || h.y + ay * 50 > A.y1 - 4) ay = -ay * 0.5; return [ax, ay]; }
// a dodge pressed while the hero walks itself: away from the danger, or away from whoever is closest
function escapeDir(h, foes) { let [ax, ay] = threatDir(h, foes); if (!ax && !ay) for (const u of within(h.x, h.y, 70, foes)) { const d = Math.max(4, dist(h.x, h.y, u.x, u.y)); ax += (h.x - u.x) / d / d; ay += (h.y - u.y) / d / d; } if (!ax && !ay) { ax = h.vx; ay = h.vy; } return fitDash(h, ax, ay); }
// autopilot dodges on its own
function aiDodge(h, foes, dt) {
  if ((h.aiDashT = (h.aiDashT || 0) - dt) > 0 || !canDash(h)) return false;
  const [ax, ay, why] = threatDir(h, foes); if (!why) return false;
  let [dx, dy] = fitDash(h, ax, ay); if (!dx && !dy) { const a = rand(TAU); dx = Math.cos(a); dy = Math.sin(a); }
  doDash(h, dx, dy, true); h.aiDashT = why === 1 ? 0.6 : 0.35; if (why === 3) h.fleeT = 1.4; return true;
}
function playerHero(h, dt) {
  const I = h.inp;
  if (h.dead) { h.deadT += dt; I.castQ.length = 0; return; }
  for (const k in h.cd) h.cd[k] -= dt;
  ultTick(h, dt);
  if (h.regen && (h.regen.t -= dt) > 0) { if ((h.regen.tick -= dt) <= 0) { h.regen.tick = 0.5; heal(h, h.regen.per); } localFx(() => regenFx(h, dt)); } else h.regen = null;
  if (h.z > 0 && G.phase !== 'fight') return;
  const ix = I.mx, iy = I.my, foes = live(G.mons), st = h.state;
  if (I.dashQ) { I.dashQ = false; if (canDash(h)) { h.state = null; doDash(h, ix, iy); } else dashFail(h); } void st;
  if (h.stun > 0) { h.stun -= dt; h.vx = damp(h.vx, 0, 8, dt); h.vy = damp(h.vy, 0, 8, dt); return; }
  if (h.state) { heroState(h, dt); return; }
  const spd = h.def.spd * 1.3; h.vx = damp(h.vx, ix * spd, 12, dt); h.vy = damp(h.vy, iy * spd, 12, dt); h.moving = !!(ix || iy); if (Math.abs(ix) > 0.15) h.face = ix < 0 ? -1 : 1;
  if (I.sp && G.phase === 'fight') heroBrain(h, foes);
  while (I.castQ.length && !h.state) tryCast(h, I.castQ.shift(), foes);
  if (h.state || !foes.length) return;
  const basic = basicOf(h);
  if (h.def.role === 'melee') { const t = nearest(h, foes, h.r + (basic.reach || 14) + 10); if (t && !(h.cd.slash > 0)) { h.cd.slash = basic.cd * md(basic.name).cd * (h.frenzyT > 0 ? 0.5 : 1); basic.cast(h, t); } }
  else if (!(h.cd.basic > 0)) { const t = basic.pick(h, foes); if (t) { h.cd.basic = basic.cd * md(basic.name).cd * (h.frenzyT > 0 ? 0.5 : 1); basic.cast(h, t); } }
}
// ---------- hero select and skill slots ----------
function selectHero(k) {
  const keep = G.heroes.find(h => h.key === k);
  for (const h of G.heroes) if (h !== keep && !(h.pid > 0)) { smoke(h.x, h.y, 6, 'dark', 10, 30, 1.2); ring(h.x, h.y, 22, h.def.col, 0.4, 3); glows(h.x, h.y, 8, 8, h.def.col, 60, 4, 0.6); }
  G.heroes = [keep, ...G.heroes.filter(h => h.pid > 0)]; removeIf(G.units, u => u.team === 'hero' && u !== keep && !(u.pid > 0)); keep.ctrl = 'player';
  keep.x = ARENA.pw / 2; keep.y = ARENA.y1 - 34; keep.vx = keep.vy = 0; column(keep.x, keep.y, keep.def.col, 1.4, 14); ring(keep.x, keep.y, 40, keep.def.col, 0.5, 4);
  keep.pid = 0; keep.pname = 'P1'; keep.inp = newInp(); keep.sb = newSB(k); keep.dashN = DASH_N; keep.dashT = 0; G.me = keep;
  scaleParty(); keep.hp = keep.maxHp;
}
// button 1 holds the Low spell, 2 the Medium, 3 the High; the ultimate has its own button. Nothing is ever replaced.
function learnSpell(o) { const name = o.sp.name, t = o.sp.tier; G.known.add(name); if (t >= 1 && t <= 3 && G.slots) G.slots[t - 1] = name; }
// ---------- HUD for one hero ----------
function ctrlScale() { return clamp(Math.min(VIEW.w, VIEW.h) / 430, 0.85, 1.35); }
const initials = n => n.split(' ').length > 1 ? n.split(' ').map(w => w[0]).join('').slice(0, 3) : n.slice(0, 2);
function hpChip(h) {
  const now = performance.now(), f = h.dead ? 0 : clamp(h.hp / h.maxHp, 0, 1); let s = h.hpc; if (!s) s = h.hpc = { last: f, trail: f, hitAt: 0, healFrom: f, healA: 0, big: 0, t: now };
  const dt = Math.min(0.1, (now - s.t) / 1000); s.t = now;
  if (f < s.last - 1e-4) { if (s.trail < s.last) s.trail = s.last; s.hitAt = now; if (s.last - f > 0.06) s.big = 1; }
  else if (f > s.last + 1e-4) { s.healFrom = s.healA > 0.05 ? Math.min(s.healFrom, s.last) : s.last; s.healA = 1; }
  s.last = f;
  if (s.trail > f && now - s.hitAt > 420) s.trail = Math.max(f, s.trail - dt * Math.max(0.3, (s.trail - f) * 2.5));
  if (s.trail < f) s.trail = f; s.healA = Math.max(0, s.healA - dt * 1.3); s.big = Math.max(0, s.big - dt * 3);
  return s;
}
function drawHeroFrame(c, L, T) {
  const h = G.me; const m = h && MOBS[h.spr], col = h && COL[h.def.col], solo = !!h;
  if (!solo) { font(c, 900, 24, F_DISP); label(c, G.training ? 'Training' : 'Floor ' + G.floor, L, T + 20, '#ecc878', { stroke: 4 }); font(c, 500, 14, F_HUD); spaced(c, G.training ? 'NOTHING HERE COUNTS' : ARENA.name, L, T + 36, 1.6, '#bfae90'); UI.frameRect = null; return; }
  c.fillStyle = 'rgba(10,8,12,0.62)'; c.fillRect(L - 6, T - 6, 204, 58); UI.frameRect = [L - 6, T - 6, 204, 58];
  c.imageSmoothingEnabled = false; c.fillStyle = `rgba(${col},0.18)`; c.fillRect(L - 2, T - 2, 42, 42); c.globalAlpha = h.dead ? 0.4 : 1; c.drawImage(IMG.mobs, 0, m[0], m[1], m[2], L, T, 38, 38 * m[2] / m[1]); c.globalAlpha = 1;
  font(c, 900, 16, F_DISP); label(c, h.def.name, L + 46, T + 11, `rgb(${col})`); const nw = c.measureText(h.def.name).width; font(c, 500, 11, F_HUD); label(c, heroTitle(h), L + 52 + nw, T + 11, '#a89a84');
  const s = hpChip(h), f = s.last, now = performance.now(), bx = L + 46 + (s.big > 0 ? Math.sin(now / 18) * 2 * s.big : 0), by = T + 16, bw = 146, bh = 9;
  c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(bx, by, bw, bh); c.fillStyle = f > 0.5 ? '#5ee07e' : f > 0.25 ? '#ffd24a' : '#ff4a3a'; c.fillRect(bx, by, bw * f, bh);
  if (s.trail > f) { c.globalAlpha = now - s.hitAt < 420 ? 1 : 0.85; c.fillStyle = '#ffffff'; c.fillRect(bx + bw * f, by, bw * (s.trail - f), bh); c.globalAlpha = 1; } // what the last hit took
  if (s.healA > 0 && f > s.healFrom) { c.globalAlpha = s.healA; c.fillStyle = '#d0ffe0'; c.fillRect(bx + bw * s.healFrom, by, bw * (f - s.healFrom), bh); c.globalAlpha = 1; }
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(bx, by, bw * f, 2);
  if (f > 0 && f < 0.25) { c.strokeStyle = `rgba(255,70,50,${0.5 + 0.5 * Math.sin(now / 150)})`; c.lineWidth = 1.5; c.strokeRect(bx - 1, by - 1, bw + 2, bh + 2); }
  font(c, 600, 11, F_HUD); label(c, Math.max(0, Math.round(h.hp)) + ' / ' + h.maxHp, L + 49, T + 24.5, '#10120e');
  const xa = xpFor(G.lvl), xb = xpFor(G.lvl + 1), xf = clamp((G.xp - xa) / (xb - xa), 0, 1); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(L + 74, T + 31, 118, 4); c.fillStyle = '#ffd860'; c.fillRect(L + 74, T + 31, 118 * xf, 4);
  font(c, 600, 13, F_HUD); label(c, 'LV ' + G.lvl, L + 46, T + 36, '#ffd860');
  font(c, 500, 12, F_HUD); label(c, G.training ? 'TRAINING GROUND' : 'FLOOR ' + G.floor + ' · ' + ARENA.name, L + 46, T + 48, '#bfae90');
  font(c, 500, 12, F_HUD); if (!G.training) spaced(c, G.kills.toLocaleString() + ' SLAIN' + (G.falls ? '  ·  FALLEN ' + G.falls + '×' : ''), L, T + 66, 1.1, '#8f8472');
}
function drawTopButtons(c, R, T) {
  // right to left: MENU · SPELLBOOK · CONTROLS · SPELLS · MOVEMENT (· UPDATE)
  CTRL.top = []; const items = [], ml = moveLevel(), sa = spellAuto();
  items.push({ t: 'MENU', fn: () => { UI.menuOpen = true; UI.leaveT = 0; } });
  items.push({ t: 'SPELLBOOK', fn: () => { UI.bookOpen = true; } });
  if (G.choice) { items.length = 1; items.push({ t: 'SPELLBOOK', fn: () => { UI.bookOpen = true; } }); } // while cards are up: just the book and the menu
  else {
  if (G.training && TRAIN.ready) items.push({ t: 'LOADOUT', hot: true, fn: () => { TRAIN.open = true; } });
  items.push({ cap: 'CONTROLS', t: SCHEME_SHORT[INPUT.scheme], fn: cycleScheme });
  items.push({ cap: 'SPELLS', t: sa && !G.spellMode ? 'AUTO · IDLE' : SPELL_LABEL[G.spellMode], hot: !!sa, fn: cycleSpells });
  items.push({ cap: 'MOVEMENT', t: ml === 2 && G.moveMode < 2 ? 'AUTOPILOT · IDLE' : MOVE_LABEL[G.moveMode], hot: ml > 0, fn: cycleMove });
  }
  if (MENU.update) { const sure = MENU.sureT > performance.now(); items.push({ t: sure ? 'TAP AGAIN · ENDS THIS RUN' : 'UPDATE READY', hot: true, pulse: !sure, fn: () => { if (MENU.sureT > performance.now()) location.reload(); else MENU.sureT = performance.now() + 3000; } }); }
  const wOf = s => { let w = 0; for (const ch of s) w += c.measureText(ch).width + 1; return w - 1; };
  let x = R;
  for (const it of items) {
    font(c, 600, 13, F_HUD); let w = wOf(it.t); if (it.cap) { font(c, 500, 10, F_HUD); w = Math.max(w, wOf(it.cap)); } w += 18; x -= w;
    c.globalAlpha = it.pulse ? 0.65 + 0.35 * Math.sin(performance.now() / 300) : 0.92; c.fillStyle = it.hot ? 'rgba(46,32,12,0.78)' : 'rgba(10,8,12,0.72)'; c.fillRect(x, T - 7, w, 29);
    c.strokeStyle = it.hot ? '#ffd860' : 'rgba(200,160,80,0.6)'; c.lineWidth = 1; c.strokeRect(x + 0.5, T - 6.5, w - 1, 28);
    if (it.cap) { font(c, 500, 10, F_HUD); spaced(c, it.cap, x + w / 2, T + 2.5, 1, it.hot ? '#c8a860' : '#9a8c78', 'center'); font(c, 600, 13, F_HUD); spaced(c, it.t, x + w / 2, T + 17, 1, it.hot ? '#ffd860' : '#e8d8b8', 'center'); }
    else { font(c, 600, 13, F_HUD); spaced(c, it.t, x + w / 2, T + 12.5, 1, it.hot ? '#ffd860' : '#e8d8b8', 'center'); }
    c.globalAlpha = 1; CTRL.top.push({ r: [x - 2, T - 10, w + 4, 36], fn: it.fn }); x -= 6;
  }
  CTRL.topLeft = x; // the wave counter moves down when the bar reaches the middle
}
// the dodge button: a gold sweep while it recovers (and pips if there is ever more than one charge)
function drawDashBtn(c, b, h) {
  const fx = CTRL.fx.dash || {}, sc = ctrlScale(), x = b.x + (fx.shake > 0 ? Math.sin(performance.now() / 20) * 4 * fx.shake / 0.3 : 0), y = b.y, r = b.r;
  if (fx.shake > 0) fx.shake -= 1 / 60; if (fx.flash > 0) fx.flash -= 1 / 60;
  const n = h.dashN === undefined ? DASH_N : h.dashN, t = Math.max(0, h.dashT || 0), ready = n > 0;
  c.fillStyle = 'rgba(14,10,18,0.66)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = ready ? '#e8d8b8' : 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r - 1, 0, TAU); c.stroke();
  if (n < DASH_N) { c.strokeStyle = 'rgba(255,216,96,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - t / DASH_T, 0, 1)); c.stroke(); }
  if (fx.flash > 0) { c.fillStyle = `rgba(255,255,255,${fx.flash * 3})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  if (ready) { font(c, 900, 18 * sc, F_DISP); label(c, '»', x, y + 6 * sc, '#fff4e0', { align: 'center' }); }
  else { c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.arc(x, y, r - 2, 0, TAU); c.fill(); font(c, 600, 17 * sc, F_HUD); label(c, t.toFixed(1), x, y + 6 * sc, '#ffffff', { align: 'center', stroke: 3 }); }
  if (DASH_N > 1) for (let i = 0; i < DASH_N; i++) { const px = x + (i - (DASH_N - 1) / 2) * 10 * sc, py = y - r - 8 * sc; c.beginPath(); c.arc(px, py, 3.2 * sc, 0, TAU); if (i < n) { c.fillStyle = '#ffd860'; c.fill(); } else { c.strokeStyle = 'rgba(255,216,96,0.55)'; c.lineWidth = 1.2; c.stroke(); } }
  if (!INPUT.touch && b.key) { font(c, 600, 11, F_HUD); label(c, b.key, x + r * 0.72, y - r * 0.62, '#ffd860', { align: 'center', stroke: 3 }); }
}
function drawSkillBtn(c, b, h) {
  if (b.id === 'dash') return drawDashBtn(c, b, h);
  const fx = CTRL.fx[b.id] || {}, sh = fx.shake > 0 ? Math.sin(performance.now() / 20) * 4 * fx.shake / 0.3 : 0, x = b.x + sh, y = b.y, r = b.r, sp = b.sp;
  if (fx.shake > 0) fx.shake -= 1 / 60; if (fx.flash > 0) fx.flash -= 1 / 60;
  c.fillStyle = 'rgba(14,10,18,0.66)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  if (!sp) { c.setLineDash([3, 4]); c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r - 1, 0, TAU); c.stroke(); c.setLineDash([]); const tt = b.slot === 'ult' ? 4 : b.slot + 1; font(c, 600, 10.5 * ctrlScale(), F_HUD); label(c, TIER_LABEL[tt], x, y - 1, TIER_HEX[tt], { align: 'center' }); font(c, 500, 10.5 * ctrlScale(), F_HUD); label(c, G.lvl >= TIER_MIN[tt] ? 'AFTER FLOOR' : 'LV ' + TIER_MIN[tt], x, y + 10 * ctrlScale(), 'rgba(255,255,255,0.4)', { align: 'center' }); return; }
  const hex = b.id === 'dash' ? '#e8d8b8' : TIER_HEX[sp.tier], cdLeft = b.id === 'dash' ? (h.dashCd || 0) : sp.tier === 4 ? 0 : (h.cd[sp.name] || 0), cdMax = b.id === 'dash' ? (h.dashMax || 2.2) : (h.cdMax && h.cdMax[sp.name]) || sp.cd || 1;
  const ready = b.slot === 'ult' ? h.ult >= 100 : cdLeft <= 0;
  if (b.slot === 'ult') { c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r - 2, 0, TAU); c.stroke(); c.strokeStyle = hex; c.beginPath(); c.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * h.ult / 100); c.stroke(); if (ready) { c.shadowColor = hex; c.shadowBlur = 18 + 8 * Math.sin(performance.now() / 150); c.stroke(); c.shadowBlur = 0; } }
  else { c.strokeStyle = ready ? hex : 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r - 1, 0, TAU); c.stroke(); }
  if (fx.flash > 0) { c.fillStyle = `rgba(255,255,255,${fx.flash * 3})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  if (b.slot === 'ult' && sp && !ready) { const left = Math.ceil((1 - h.ult / 100) * (h.ultMax || ULT_CD)); c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(x, y, r - 4, 0, TAU); c.fill(); font(c, 600, 17 * ctrlScale(), F_HUD); label(c, String(left), x, y + 6 * ctrlScale(), '#ffffff', { align: 'center', stroke: 3 }); return; }
  if (b.slot === 'ult' && sp && ready && ultBlocked()) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.arc(x, y, r - 4, 0, TAU); c.fill(); font(c, 600, 13 * ctrlScale(), F_HUD); label(c, 'WAIT', x, y + 2, '#ffd860', { align: 'center', stroke: 3 }); font(c, 500, 10 * ctrlScale(), F_HUD); label(c, Math.ceil(G.ultLock) + ' S', x, y + 13 * ctrlScale(), '#cbbd9f', { align: 'center', stroke: 3 }); return; }
  else if (b.id === 'dash') { font(c, 900, 18 * ctrlScale(), F_DISP); label(c, '»', x, y + 6 * ctrlScale(), ready ? '#fff4e0' : 'rgba(255,244,224,0.45)', { align: 'center' }); }
  else { const words = sp.name.split(' '), lines = words.length > 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : words, fs0 = (b.slot === 'ult' ? 13 : 11) * ctrlScale(); let fs = fs0; font(c, 600, fs, F_HUD); const mw = Math.max(...lines.map(l => c.measureText(l).width)); if (mw > r * 1.72) { fs = fs0 * r * 1.72 / mw; font(c, 600, fs, F_HUD); } const y0 = y - (lines.length - 1) * fs * 0.45 + fs * 0.35; lines.forEach((l, k) => label(c, l, x, y0 + k * fs * 0.9, ready ? '#fff4e0' : 'rgba(255,244,224,0.4)', { align: 'center', stroke: 3 })); }
  if (!ready && b.slot !== 'ult') { c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(cdLeft / cdMax, 0, 1)); c.closePath(); c.fill(); font(c, 600, 17 * ctrlScale(), F_HUD); label(c, cdLeft.toFixed(cdLeft < 1 ? 1 : 0), x, y + 6 * ctrlScale(), '#ffffff', { align: 'center', stroke: 3 }); }
  if (!INPUT.touch && b.key) { font(c, 600, 11, F_HUD); label(c, b.key, x + r * 0.72, y - r * 0.62, '#ffd860', { align: 'center', stroke: 3 }); }
}
function drawControls(c) {
  CTRL.buttons = []; const h = G.me; if (!h || !G.slots) return;
  const W = VIEW.w, H = VIEW.h, S = VIEW.safe, sc = ctrlScale(), R = W - Math.max(14, S.r + 10), B = H - Math.max(12, S.b + 8), L = Math.max(14, S.l + 10);
  const ux = R - 38 * sc, uy = B - 38 * sc, rad = 96 * sc, list = [];
  list.push({ id: 'ult', slot: 'ult', x: ux, y: uy, r: 30 * sc, sp: slotSpell(h, 'ult'), key: 'R', press: () => { if (G.me && G.me.ult >= 100 && ultBlocked()) { (CTRL.fx.ult = CTRL.fx.ult || {}).shake = 0.3; netSay('WAIT · ' + (G.ultBy ? G.ultBy + '’S' : 'ANOTHER') + ' ULTIMATE IS STILL GOING', 2); } else INPUT.castQ.push('ult'); } });
  [180, 225, 270].forEach((a, i) => { const t = a * Math.PI / 180; list.push({ id: i, slot: i, x: ux + Math.cos(t) * rad, y: uy + Math.sin(t) * rad, r: 25 * sc, sp: slotSpell(h, i), key: String(i + 1), press: () => INPUT.castQ.push(i) }); });
  list.push({ id: 'dash', slot: 'dash', x: ux - rad - 62 * sc, y: uy + 6 * sc, r: 24 * sc, sp: { name: 'DASH', tier: 0 }, key: 'SPACE', press: () => { if (G.me && G.me.dashN === 0) dashFail(G.me); else INPUT.dashQ = true; } });
  for (const b of list) drawSkillBtn(c, b, h); CTRL.buttons = list; // always pressable, whatever MOVEMENT and SPELLS are set to
  // the stick is invisible: touch anywhere that isn't a button and drag; a hint shows until the first real move
  const manual = moveLevel() === 0; if (!manual) INPUT.dest = null;
  if (manual && INPUT.touch && !INPUT.moved && !TUT.on && G.phase === 'fight' && !G.choice) { font(c, 600, 15, F_HUD); c.globalAlpha = 0.45 + 0.25 * Math.sin(performance.now() / 400); spaced(c, moveHint(), VIEW.w / 2, B - 8, 3, '#f0e0c0', 'center'); c.globalAlpha = 1; }
  // tap to move: where the hero is heading
  if (manual && INPUT.dest && G.me && !G.me.dead) { const [dx, dy] = toScreen(INPUT.dest.x, INPUT.dest.y), t = performance.now() / 1000, pr = (6 + 3 * Math.sin(t * 8)) * CAM.z / 2.4; c.strokeStyle = 'rgba(255,216,96,0.85)'; c.lineWidth = 2; c.beginPath(); c.ellipse(dx, dy, pr * 1.6, pr * 0.7, 0, 0, TAU); c.stroke(); c.globalAlpha = 0.5; c.beginPath(); c.ellipse(dx, dy, pr * 2.6, pr * 1.1, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; }
  // fixed stick: always on screen at the bottom left
  if (manual && INPUT.scheme === 'stick') { const [bx, by, R] = stickBase(), s2 = INPUT.stick && INPUT.stick.fixed ? INPUT.stick : null; c.globalAlpha = s2 ? 0.75 : 0.4; c.fillStyle = 'rgba(255,255,255,0.07)'; c.strokeStyle = 'rgba(255,240,210,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, R, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,240,210,0.55)'; c.beginPath(); c.arc(bx + (s2 ? s2.vx * R : 0), by + (s2 ? s2.vy * R : 0), R * 0.42, 0, TAU); c.fill(); c.globalAlpha = 1; }
  else if (!INPUT.touch && G.phase === 'fight') { font(c, 500, 12, F_HUD); c.globalAlpha = 0.6; spaced(c, 'WASD MOVE  ·  SPACE DODGE  ·  1-3 SPELLS  ·  R ULTIMATE  ·  T MOVEMENT  ·  G SPELLS  ·  C CONTROLS  ·  ESC MENU', L, B - 4, 1, '#c8b48c'); c.globalAlpha = 1; }
}
