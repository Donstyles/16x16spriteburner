// ===== Boot & main loop =====
let viewCvs, lastT = 0, titleCam = { x: 13.5, y: 15.5, a: -Math.PI / 2, t: 0 }, fpsAcc = 0, fpsN = 0, FPS = 60;
function readInsets() {
  const cs = getComputedStyle(document.documentElement);
  const v = k => parseFloat(cs.getPropertyValue(k)) || 0;
  return { l: v('--sal'), r: v('--sar'), t: v('--sat'), b: v('--sab') };
}
function resize() {
  const vv = window.visualViewport;
  const W = Math.round(vv ? vv.width : window.innerWidth), Hh = Math.round(vv ? vv.height : window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ins = readInsets();
  const VH = clamp(Math.round(Hh / 2.1 * (window.RES_SCALE || 1)), 140, 270), VW = Math.min(620, Math.round(VH * W / Hh));
  R.hfov = VW / VH > 2 ? 1.42 : 1.28;
  R.cvs = viewCvs; initRenderer(VW, VH);
  R.hShift = -Math.round((66 + ins.b) * VH / Hh / 2); // horizon centred on the part of the view the portrait bar leaves visible
  viewCvs.style.width = W + 'px'; viewCvs.style.height = Hh + 'px';
  H.viewScaleX = W / VW; H.viewScaleY = Hh / VH;
  hudResize(W, Hh, dpr, ins);
  const touchDev = Input.isTouch || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  document.getElementById('rotate').style.display = (W < Hh && touchDev) ? 'flex' : 'none';
}
async function boot() {
  viewCvs = document.getElementById('view');
  hudInit(document.getElementById('hud'));
  Input.init(document.body);
  resize();
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 300));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  const loading = document.getElementById('loading');
  try {
    await loadAssets(window.ASSET_SRC);
    buildProceduralSprites();
    compileMap();
  } catch (e) { loading.textContent = 'Failed to load: ' + e.message; throw e; }
  loading.style.display = 'none';
  S.mode = 'title'; S.titleSel = hasSave() ? 1 : 0; S.t = 0; S.msgs = []; S.fx = []; S.party = []; S.px = titleCam.x; S.py = titleCam.y; S.pa = titleCam.a; S.pitch = 0;
  S.objects = []; S.enemies = []; S.projectiles = []; S.pickups = []; S.bonfires = []; S.interact = [];
  // title scene: a lit hub with keeper
  S.flags = { boss: {}, chest: {}, gate: {}, item: {}, bonfire: { '13,13': 1 }, unique: {}, door: {}, lore: {} };
  buildEntities(); S.enemies = [];
  const first = () => { Snd.init(); if (!Snd.musicKind) Snd.music('title'); };
  window.addEventListener('touchstart', first, { once: true }); window.addEventListener('mousedown', first, { once: true }); window.addEventListener('keydown', first, { once: true });
  const wake = () => { try { if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume(); } catch (e) { } };
  window.addEventListener('touchend', wake); window.addEventListener('mouseup', wake); window.addEventListener('keyup', wake);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  requestAnimationFrame(loop);
}
function goFullscreen() {
  if (!Input.isTouch || navigator.standalone) return;
  try { const el = document.documentElement; const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null; const lock = () => { try { const l = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (l && l.catch) l.catch(() => {}); } catch (e) { } }; if (p && p.then) p.then(lock, () => {}); else lock(); } catch (e) { }
}
function startNew() { Snd.init(); goFullscreen(); newGame(); Snd.music('ambient'); S.fade = { t: 1.5, dur: 1.5, color: '#000' }; }
function startContinue() { Snd.init(); goFullscreen(); if (!loadGame()) startNew(); else Snd.music('ambient'); }
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
  fpsAcc += dt; fpsN++; if (fpsAcc >= 1) { FPS = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (S.mode === 'play' && S.playTime > 4 && FPS < 42 && (window.RES_SCALE || 1) > 0.6) { window.RES_SCALE = (window.RES_SCALE || 1) * 0.85; resize(); } }
  Input.update();
  S.t += dt;
  if (S.mode === 'title') {
    titleCam.t += dt; S.px = 13.5 + Math.cos(titleCam.t * 0.15) * 2.2; S.py = 13.5 + Math.sin(titleCam.t * 0.15) * 2.2; S.pa = Math.atan2(13.5 - S.py, 13.5 - S.px);
    if (Input.consume('new')) startNew(); else if (Input.consume('continue')) startContinue();
    if (Input.keys.ArrowUp || Input.keys.ArrowDown) { if (!S._tk) { S.titleSel = hasSave() ? 1 - S.titleSel : 0; Snd.sfx('ui'); } S._tk = true; } else S._tk = false;
    if (Input.consume('interact') || Input.consume('attack')) { if (S.titleSel === 1 && hasSave()) startContinue(); else startNew(); }
    for (const o of S.objects) if (o.anim !== undefined) { o.anim += dt; o.frame = (o.anim * o.spr.fps) | 0; }
  } else if (S.mode === 'play') {
    S.playTime += dt;
    S.focus = findFocus();
    updatePlayer(dt); if (S.mode === 'play') updateEnemies(dt); if (S.mode === 'play') updateProjectiles(dt); if (S.mode === 'play') updateCombat(dt);
    if (S.mode !== 'play') { Input.endFrame(); }
    if (Input.consume('attack') || Input.held.attack) partyAttack();
    if (Input.consume('flask')) useFlask();
    if (Input.consume('interact')) doInteract(S.focus);
    if (Input.consume('tap')) { if (S.focus) doInteract(S.focus); }
    for (let i = 1; i <= 4; i++) if (Input.consume('ab' + i)) useAbility(i - 1);
    if (Input.consume('menu') || Input.consume('map')) { S.menu = { kind: 'pause', sel: 0 }; S.mode = 'menu'; Snd.sfx('ui'); }
    if (Input.consume('itemcard')) S.itemCard = null;
    for (const m of S.msgs) m.time -= dt; S.msgs = S.msgs.filter(m => m.time > 0);
    if (S.center) { S.center.t -= dt; if (S.center.t <= 0) S.center = null; }
    if (S.itemCard) { S.itemCard.t -= dt; if (S.itemCard.t <= 0) S.itemCard = null; }
    if (S.ending > 0) { S.ending -= dt; if (S.ending <= 0) { S.mode = 'victory'; saveGame(); } }
  } else if (S.mode === 'menu') {
    menuInput();
    for (const o of S.objects) if (o.anim !== undefined) { o.anim += dt; o.frame = (o.anim * o.spr.fps) | 0; }
  } else if (S.mode === 'dead') {
    S.deathT += dt;
    for (const e of S.enemies) e.anim += dt;
    if (S.deathT > 3.8) respawn();
  } else if (S.mode === 'victory') {
    if (Input.consume('continue')) { S.mode = 'play'; }
    if (Input.consume('new')) { S.mode = 'title'; Snd.music('title'); }
  }
  if (S.fade) { S.fade.t -= dt; if (S.fade.t <= 0) S.fade = null; }
  Snd.update(dt, S.mode === 'play' && !!S.boss);
  // render
  R.pitch = S.pitch || 0; R.bob = S.mode === 'play' ? S.bob || 0 : 0; R.time = S.t;
  R.flick = 1 + Math.sin(S.t * 13) * 0.025 + Math.sin(S.t * 7.3) * 0.02;
  renderWorld(MAP, { x: S.px, y: S.py, a: S.pa }, gatherSprites());
  presentFrame();
  const sh = S.shake > 0 ? S.shake * 8 : 0;
  viewCvs.style.transform = sh ? 'translate(' + ((Math.random() - 0.5) * sh) + 'px,' + ((Math.random() - 0.5) * sh) + 'px)' : '';
  drawHUD(dt);
  if (window.DEBUG_FPS) { H.ctx.setTransform(H.dpr, 0, 0, H.dpr, 0, 0); drawText(H.ctx, FPS.toFixed(0) + ' fps ' + R.VW + 'x' + R.VH, H.W / 2, H.st + 2, 1, '#8f8', 'center'); }
  Input.endFrame();
}
window.addEventListener('load', boot);
window.AM = { S, R, Input, get MAP() { return MAP; }, newGame, loadGame, saveGame, message, showCenter, giveItem, ENEMY_DEFS, WORLD, Snd, getSprite, spawnEnemies, damageEnemy, useAbility, partyAttack, doInteract, findFocus, hitParty, respawn, dieParty, restAtBonfire, makeEnemy, zoneAt, useFlask, levelUp, openChest, wakeEnemy };
