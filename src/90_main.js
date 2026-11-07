// ===================== main loop =====================
let viewCvs, hudCvs, lastT = 0, autosaveT = 0;
function readInsets() { const cs = getComputedStyle(document.documentElement); const v = k => parseFloat(cs.getPropertyValue(k)) || 0; return { l: v('--sal'), r: v('--sar'), t: v('--sat'), b: v('--sab') }; }
function resize() {
  const vv = window.visualViewport; const W = Math.round(vv ? vv.width : window.innerWidth), H = Math.round(vv ? vv.height : window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2); const ins = readInsets();
  resizeView(W, H, dpr); resizeUI(W, H, dpr, ins);
  const touchDev = I.isTouch || navigator.maxTouchPoints > 0; document.getElementById('rotate').style.display = (W < H && touchDev) ? 'flex' : 'none';
  G.camSet = false;
}
async function boot() {
  viewCvs = document.getElementById('view'); hudCvs = document.getElementById('hud'); initView(viewCvs); initUI(hudCvs); I.init(document.body);
  const loading = document.getElementById('loading');
  try { await loadAssets(window.ASSET_SRC); } catch (e) { loading.textContent = 'Failed to load: ' + e.message; throw e; }
  loading.style.display = 'none';
  resize(); window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 300)); if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  const first = () => { Snd.init(); Snd.music(G.mode === 'title' || (M && M.outdoor) ? 'town' : 'dungeon'); }; window.addEventListener('touchstart', first, { once: true }); window.addEventListener('mousedown', first, { once: true }); window.addEventListener('keydown', first, { once: true });
  const wake = () => { try { if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume(); } catch (e) { } }; window.addEventListener('touchend', wake); window.addEventListener('mouseup', wake);
  titleSetup();
  requestAnimationFrame(loop);
}
function titleSetup() {
  M = getMap('over'); Object.assign(G, { mode: 'title', party: [], time: 10 * 60, playTime: 0, log: [], fx: [], monsters: [], projs: [], drops: [], trail: [], buffs: {}, screen: null, notice: null, sel: 0, x: M.townSquare.x, y: M.townSquare.y, facing: 1, camSet: false, fadeT: 0, titleT: 0 });
  I.modal = false;
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) M.explored[y * M.w + x] = 1;
}
function startCreate() { G.mode = 'create'; const used = []; G.create = ['Knight', 'Archer', 'Cleric', 'Sorcerer'].map(cls => { let n; do { n = pick(NAME_POOL); } while (used.includes(n)); used.push(n); return { cls, name: n }; }); G.editing = null; I.textTarget = null; }
function goFullscreen() { if (!I.isTouch || navigator.standalone) return; try { const el = document.documentElement; const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null; const lock = () => { try { const l = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (l && l.catch) l.catch(() => { }); } catch (e) { } }; if (p && p.then) p.then(lock, () => { }); else lock(); } catch (e) { } }

function playInput() {
  if (G.screen) { screenInput(); return; }
  if (I.take('attack') || I.held.attack) { if (G.fearT > 0) { if (I.take('attack')) log('The party is too afraid to attack!'); } else partyAttack(); }
  if (I.take('interact')) doInteract(G.focus);
  if (I.take('cast') || I.take('spells')) { if (!G.party[G.sel].spells.length) { const j = G.party.findIndex(m => m.spells.length && alive(m)); if (j >= 0) G.sel = j; } openScreen('spells'); }
  if (I.take('char') || I.take('inventory')) openScreen('char', { tab: I.take('inventory') ? 2 : 0 });
  if (I.take('map')) openScreen('map'); if (I.take('quests') || I.take('journal')) openScreen('quests'); if (I.take('rest')) openScreen('rest'); if (I.take('menu')) openScreen('menu');
  if (I.take('turn')) { G.turnBased = !G.turnBased; G.tbClock = 0; log(G.turnBased ? 'Turn-based mode: enemies act only when you do.' : 'Real-time mode.'); Snd.play('ui'); }
  for (let i = 0; i < 4; i++) { if (I.take('sel' + (i + 1))) G.sel = i; if (I.take('port' + i)) { if (G.sel === i && G.lastPort === i && G.playTime - (G.lastPortT || 0) < 0.6) openScreen('char', { tab: 0 }); G.sel = i; G.lastPort = i; G.lastPortT = G.playTime; } }
  if (I.take('nextchar')) G.sel = (G.sel + 1) % 4;
  if (I.clicked) {
    const [wx, wy] = screenToWorld(I.clicked.x, I.clicked.y);
    let best = null, bd = 1.0; for (const mo of G.monsters) { if (mo.dead || mo.hidden) continue; const d = dist(wx, wy + 0.4, mo.x, mo.y); if (d < bd) { bd = d; best = mo; } }
    if (best) { G.target = best; if (!(G.fearT > 0)) partyAttack(); }
    else { const it = nearestInteractable(); if (it) { const ox = it.o ? it.o.x + 0.5 : it.n.x, oy = it.o ? it.o.y + 0.5 : it.n.y; if (dist(wx, wy, ox, oy) < 1.3) doInteract(it); else if (I.clicked.touch) { } } }
  }
  if (G.target && (G.target.dead || dist(G.target.x, G.target.y, G.x, G.y) > 12)) G.target = null;
}
function updateNpcs(dt) {
  for (const n of M.npcs) {
    n.anim = (n.anim || 0) + dt; if (!n.wander) continue; n.hx = n.hx === undefined ? n.x : n.hx; n.hy = n.hy === undefined ? n.y : n.hy;
    n.wt = (n.wt || 0) - dt; if (n.wt <= 0) { n.wt = 2 + Math.random() * 4; const a = Math.random() * TAU; n.dir = Math.random() < 0.5 ? null : [Math.cos(a), Math.sin(a)]; n.dt = 0.8 + Math.random(); }
    if (n.dir && n.dt > 0) { n.dt -= dt; const nx = n.x + n.dir[0] * dt, ny = n.y + n.dir[1] * dt; if (mPass(M, Math.floor(nx), Math.floor(ny)) && dist(nx, ny, n.hx, n.hy) < n.wander + 1 && dist(nx, ny, G.x, G.y) > 0.8) { n.x = nx; n.y = ny; n.flip = n.dir[0] < 0; } else n.dir = null; }
  }
}
function buildEnts() {
  const ents = [], lights = [], t = G.playTime;
  for (const o of M.objects) {
    if (o.taken) continue; const x = o.x + 0.5, y = o.y + 0.95;
    switch (o.kind) {
      case 'chest': ents.push({ x, y: o.big ? y + 0.05 : y, tile: o.big ? (o.opened ? [4, 27, 2, 2] : [4, 25, 2, 2]) : (o.opened ? [5, 23] : [4, 23]), shadow: false }); break;
      case 'pickup': ents.push({ x, y, icon: ITEMS[o.item].icon, hover: 2 + Math.sin(t * 3 + o.x) * 2, shadow: false }); lights.push({ x, y: y - 0.5, r: 1.5, i: 0.5, color: [255, 240, 200] }); break;
      case 'sign': ents.push({ x, y, tile: [1, 27], shadow: false }); break;
      case 'well': ents.push({ x, y, tile: [0, 16], shadow: false }); break;
      case 'brazier': ents.push({ x, y, tile: TILE_ICONS[THEMES[M.theme].torch] || [0, 12], shadow: false }); lights.push({ x, y: y - 0.6, r: 4.5, i: 0.9 + Math.sin(t * 9 + o.x) * 0.1 + Math.sin(t * 13.7 + o.y) * 0.05, color: M.theme === 'ice' ? [120, 170, 255] : M.theme === 'moss' ? [120, 255, 140] : M.theme === 'cosmic' ? [200, 120, 255] : [255, 180, 100] }); break;
      case 'deco': ents.push({ x, y, icon: o.spr, shadow: false }); break;
      case 'entrance': ents.push({ x, y: y - 0.2, tile: [1, 16], shadow: false, sortOff: -0.5 }); break;
      case 'stairs': ents.push({ x, y: y + 0.3, tile: [10, 28, 1, 2], shadow: false, sortOff: -1 }); break;
      case 'pot': ents.push({ x, y, tile: [4, 19], shadow: false }); break;
    }
  }
  for (const mo of G.monsters) {
    if (mo.dead) { ents.push({ x: mo.x, y: mo.y, spr: mo.d.spr, frame: 0, alpha: clamp(mo.deadT / 0.8, 0, 1), scale: mo.d.size || 1, flip: mo.flip }); continue; }
    if (mo.hidden) { ents.push({ x: mo.x, y: mo.y + 0.45, tile: [4, 23], shadow: false }); continue; }
    const lunge = mo.lunge > 0 ? Math.sin(mo.lunge / 0.25 * Math.PI) * 0.25 : 0; const dx = G.x - mo.x, dy = G.y - mo.y, dd = Math.hypot(dx, dy) || 1;
    ents.push({ x: mo.x + dx / dd * lunge, y: mo.y + dy / dd * lunge, spr: mo.d.spr, frame: Math.floor(mo.anim * (mo.aware ? 6 : 3)) % 4, flip: mo.flip, scale: mo.d.size || 1, hover: mo.d.fly ? 4 + Math.sin(mo.anim * 3) * 2 : 0, hpFrac: mo.aware ? mo.hp / mo.maxHp : 1, tint: mo.hurt > 0 ? 'rgba(255,255,255,0.75)' : mo.stun > 0 ? 'rgba(255,230,80,0.35)' : mo.fear > 0 ? 'rgba(200,80,255,0.3)' : null, selected: G.target === mo, boss: mo.boss });
    if (mo.d.light) lights.push({ x: mo.x, y: mo.y - 0.4, r: 3, i: 0.7, color: mo.kind === 'wisp' ? [150, 220, 255] : [255, 150, 60] });
  }
  for (const n of M.npcs) ents.push({ x: n.x, y: n.y, spr: n.spr, frame: Math.floor((n.anim || 0) * 3) % 4, flip: n.flip });
  const moving = (I.mx || I.my) && G.mode === 'play' && !G.screen;
  for (const p of memberScreenPositions()) { const m = p.m; ents.push({ x: p.x, y: p.y, spr: m.portrait, frame: moving ? Math.floor(G.walkT * 5 + p.i) % 4 : Math.floor(t * 2.5 + p.i) % 4, flip: G.facing < 0, selected: p.i === G.sel && G.mode === 'play', sortOff: 0.02 * p.i, hover: m.bounce > 0 ? m.bounce * 3 : 0, tint: m.hurt > 0 ? 'rgba(255,60,40,0.5)' : m.heal > 0 ? 'rgba(80,255,120,0.4)' : null }); }
  for (const d of G.drops) ents.push({ x: d.x, y: d.y, icon: d.items.length ? ITEMS[d.items[0].id].icon : 'gold', hover: 1 + Math.sin(t * 4 + d.x) * 1.5, shadow: false });
  for (const p of G.projs) { ents.push(p); if (p.proj === 'fire' || p.proj === 'spark') lights.push({ x: p.x, y: p.y, r: 2, i: 0.8, color: p.proj === 'fire' ? [255, 140, 50] : [255, 240, 140] }); }
  for (const f of G.fx) { ents.push(f); if (f.fx === 'glow') lights.push({ x: f.x, y: f.y, r: f.r * 1.5, i: f.life / f.dur, color: [255, 150, 60] }); }
  for (const l of M.lights) lights.push({ x: l.x, y: l.y, r: l.r, i: 0.85 + Math.sin(t * 8 + l.x) * 0.1, color: M.theme === 'ice' ? [120, 170, 255] : M.theme === 'moss' ? [120, 255, 140] : M.theme === 'cosmic' ? [200, 120, 255] : [255, 190, 110] });
  if (G.mode !== 'title') { const torch = buffOn('torch'); const r = torch ? 9 : (M.outdoor ? 5.5 : 5.2); lights.push({ x: G.x, y: G.y - 0.3, r, i: 1, color: torch ? [255, 220, 160] : [255, 200, 150] }); }
  return { ents, lights };
}
function ambientColor() {
  if (M.outdoor) { const d = daylight(); return [lerp(52, 255, d), lerp(62, 255, d), lerp(105, 255, d)]; }
  const a = THEMES[M.theme].ambient; return [a * 200, a * 196, a * 215];
}
function stepPlay(dt) {
  if (BOT.on) { BOT.update(dt); I.mx = BOT.mx; I.my = BOT.my; if (I.take('stopbot')) BOT.stop(); }
  if (G.mode === 'dead') { G.deadT += dt; G.playTime += dt; if (G.deadT > 1.5 && (I.take('wake') || I.take('interact'))) partyWipe(); return; }
  G.playTime += dt; G.mapT = (G.mapT || 0) + dt;
  playInput();
  Snd.music(M.outdoor ? 'town' : 'dungeon');
  if (!G.screen && G.mode === 'play') {
    frameCombatDt(dt); updateParty(dt); updateMonsters(dt); updateProjectiles(dt); updateFx(dt); updatePartyTimers(dt); updateClock(dt); updateNpcs(dt);
    G.focus = nearestInteractable();
    for (const l of G.log) l.t += dt; if (G.log.length && G.log[0].t > 10) G.log.shift();
    if (G.notice) { G.notice.t -= dt; if (G.notice.t <= 0) G.notice = null; }
    autosaveT += dt; if (autosaveT > 90) { autosaveT = 0; saveGame(); }
  }
  if (G.fadeT > 0) G.fadeT -= dt * 1.5;
}
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
  I.update();
  if (G.mode === 'title') {
    G.titleT += dt; G.playTime += dt; updateNpcs(dt); G.x = M.townSquare.x + Math.sin(G.titleT * 0.1) * 6; G.y = M.townSquare.y + Math.cos(G.titleT * 0.13) * 3;
    if (I.take('newgame')) { Snd.init(); goFullscreen(); startCreate(); } if (I.take('continue')) { Snd.init(); goFullscreen(); if (!loadGame()) startCreate(); }
    if (I.take('watch')) { Snd.init(); goFullscreen(); newGame(defaultParty()); G.fadeT = 1; BOT.start(); }
  } else if (G.mode === 'create') {
    G.playTime += dt; const cls = Object.keys(CLASSES);
    G.create.forEach((c, i) => { if (I.take('cls_prev' + i)) c.cls = cls[(cls.indexOf(c.cls) + cls.length - 1) % cls.length]; if (I.take('cls_next' + i)) c.cls = cls[(cls.indexOf(c.cls) + 1) % cls.length]; if (I.take('name' + i)) { if (I.isTouch) c.name = pick(NAME_POOL.filter(n => !G.create.some(x => x.name === n))); else { G.editing = i; I.textTarget = ch => { if (ch === '\b') c.name = c.name.slice(0, -1); else if (c.name.length < 12 && /[a-zA-Z' ]/.test(ch)) c.name += ch; }; } } });
    if (I.take('defparty')) { G.create = [{ cls: 'Knight', name: 'Roderick' }, { cls: 'Archer', name: 'Sable' }, { cls: 'Cleric', name: 'Mira' }, { cls: 'Sorcerer', name: 'Vesper' }]; }
    if (I.take('backtitle')) { G.mode = 'title'; I.textTarget = null; }
    if (I.take('begin') || I.take('interact')) { I.textTarget = null; G.editing = null; newGame(G.create.map(c => makeMember(c.name.trim() || pick(NAME_POOL), c.cls))); G.fadeT = 1; }
  } else if (G.mode === 'play' || G.mode === 'dead') {
    const steps = window.HM_TURBO || 1;
    for (let k = 0; k < steps; k++) { stepPlay(dt); if (k < steps - 1) I.endFrame(); }
  }
  else if (G.mode === 'ending') { G.endT += dt; if (I.take('keepplaying')) G.mode = 'play'; }
  // camera
  const vw = V.W / V.zoom, vh = V.H / V.zoom; const tx = G.x * T - vw / 2, ty = G.y * T - (vh - (U.H - U.barTop) / V.zoom) / 2;
  if (!G.camSet) { V.camX = tx; V.camY = ty; G.camSet = true; } else { const k = Math.min(1, dt * 9); V.camX += (tx - V.camX) * k; V.camY += (ty - V.camY) * k; }
  const { ents, lights } = buildEnts();
  drawWorld(M, ents, { ambient: ambientColor(), lights, time: G.playTime });
  drawHUD();
  I.endFrame();
}
window.addEventListener('load', boot);
window.HM = { G, I, V, BOT, canCast, get M() { return M; }, getMap, newGame, loadGame, saveGame, enterMap, partyAttack, castSpell, openScreen, closeScreen, makeMember, spawnMonster, hurtMonster, MONSTERS, ITEMS, SPELLS, QUESTS, doInteract, nearestInteractable, giveXp, train, addInv, makeItem, restParty, completeQuest, startQuest, defaultParty, raiseSkill, equipItem, skillUpCost, XP_FOR_LEVEL, canUse, maxHp, maxSp, CAMPS, DUNGEONS, mapState, questState, SKILLS };
