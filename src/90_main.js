// ===================== main loop =====================
let last = 0; const PERF = { acc: 0, n: 0, good: 0 };
function reviveHero(h, a) {
  h.dead = false; h.hp = Math.round(h.maxHp * 0.5); h.deadT = 0; h.state = null; h.stun = 0; h.iframe = 2.5; h.x = clamp(a.x + rand(-14, 14), ARENA.x0 + 8, ARENA.x1 - 8); h.y = clamp(a.y + rand(-8, 8), ARENA.y0 + 8, ARENA.y1 - 4); h.z = 140; h.vz = 0;
  column(h.x, h.y, h.def.col, 1.4, 14); ring(h.x, h.y, 34, h.def.col, 0.5, 4); SFX.heal(); pushBanner({ a: h.def.name + ' RETURNS', b: (h.pname || '') + ' IS BACK IN THE FIGHT', col: h.def.col, keep: true, life: 1.6 });
}
function update(dt) {
  if (NET.role === 'host') NET.lightsCur.length = 0;
  G.time += dt;
  for (let i = 0; i < G.sched.length; i++) { const s = G.sched[i]; s.t -= dt; if (s.t <= 0) { G.sched.splice(i--, 1); MDH = s.h || null; try { s.fn(); } catch (e) { console.error(e); } MDH = null; } }
  G.mons = G.units.filter(u => u.team === 'mon' && !u.dead);
  const heroes = G.heroes.filter(alive);
  for (const u of G.units) { u.anim += dt; if (u.flash > 0) u.flash -= dt; if (u.lunge > 0) u.lunge -= dt * 1.8; }
  const me = G.me; if (me && me.inp && !me.remote) { const [x, y] = inputVec(), I = me.inp; I.mx = x; I.my = y; I.auto = autoLevel(); while (INPUT.castQ.length) I.castQ.push(INPUT.castQ.shift()); if (INPUT.dashQ) { I.dashQ = true; INPUT.dashQ = false; } }
  for (const h of G.heroes) { MDH = h; if (h.iframe > 0) h.iframe -= dt; if (h.blessT > 0) h.blessT -= dt; if (h.frenzyT > 0 && (h.frenzyT -= dt) <= 0) h.leechMul = 1; h.dashCd = (h.dashCd || 0) - dt; const auto = h.ctrl !== 'player' || !h.inp || h.inp.auto >= 2; if (auto && h.inp) { h.inp.castQ.length = 0; h.inp.dashQ = false; } (auto ? heroAI : playerHero)(h, dt); } MDH = null;
  if (G.heroes.length > 1 && G.phase === 'fight') for (const h of G.heroes) if (h.dead && h.pid !== undefined && h.deadT > 9) { const a = G.heroes.find(x => !x.dead); if (a) reviveHero(h, a); }
  for (const m of G.mons) monAI(m, dt, heroes);
  for (const u of G.units) { if (u.state && u.state.k === 'leap') continue; const wasAir = u.z > 0, vz = u.vz; moveUnit(u, dt); if (wasAir && u.z === 0 && u.team === 'hero' && vz < -300) { ring(u.x, u.y, 30, 'white', 0.3, 3); smoke(u.x, u.y, 5, 'dust', 9, 40, 1); debris(u.x, u.y, 8, ['#5a5048', '#7d7064'], 80, 100, 1.6); shake(0.15); SFX.hit(panOf(u.x)); } }
  separate(G.units, dt);
  removeIf(G.units, u => u.dead && u.team === 'mon');
  updateProj(dt); updateHazards(dt); localFx(() => updateEmitters(dt)); updateStorm(dt); updateQuake(dt); updateFx(dt); updateDirector(dt);
  G.castLock -= dt; G.majorLock -= dt;
  G.ultCd -= dt; if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
  if (G.burstT > 0) { G.burstT -= dt; if (G.burstT <= 0) { const n = G.burst; G.burst = 0; const t = n >= 30 ? 'GODLIKE' : n >= 20 ? 'MONSTER KILL' : n >= 14 ? 'ULTRA KILL' : n >= 9 ? 'MEGA KILL' : n >= 6 ? 'MULTI KILL' : null; if (t) G.callout = { txt: t + ' ×' + n, t: 0 }; } }
  G.ambDark = damp(G.ambDark, 0, 1.4, dt); G.ambFlash = damp(G.ambFlash, 0, 10, dt);
  if (ARENA) for (const r of ARENA.runes) if (r.glow > 0) r.glow = Math.max(0, r.glow - dt * 0.7);
}
function frame(t) {
  requestAnimationFrame(frame);
  const rdt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
  PERF.acc += rdt; PERF.n++; if (PERF.n >= 90) { const avg = PERF.acc / PERF.n; PERF.acc = PERF.n = 0; if (avg > 0.026 && Q.res > 0.55) { Q.res = Math.max(0.55, Q.res - 0.15); Q.pmax = Math.max(1200, Q.pmax - 400); resize(); PERF.good = 0; } else if (avg > 0.034) Q.bloom = 0.5; else if (avg < 0.0175 && ++PERF.good > 3 && Q.res < 1) { Q.res = Math.min(1, Q.res + 0.1); resize(); PERF.good = 0; } }
  try {
    NET.rec = NET.role === 'host' && NET.conns.size > 0;
    pollPad(); if (!UI.bookOpen) updateChoice(rdt); if (G.mode === 'play' && NET.role !== 'client') tutUpdate(rdt); if (G.fightT > 0) G.fightT -= rdt;
    if (NET.role === 'client') guestFrame(rdt);
    else if (G.mode !== 'play') { G.time += rdt; for (const u of G.units) u.anim += rdt * 0.7; if (ARENA && chance(rdt * 5)) embers(rand(ARENA.x0, ARENA.x1), rand(ARENA.y0, ARENA.y1), 1); updateFx(rdt); }
    else if ((G.choice || UI.bookOpen) && !(NET.role === 'host' && NET.conns.size)) { /* the battle holds its breath while the player chooses or reads */ }
    else if (G.hitstop > 0) G.hitstop -= rdt;
    else { if (G.slowT > 0) G.slowT -= rdt; else G.ts = damp(G.ts, 1, 3, rdt); const dt = rdt * G.ts, n = window.CR_TURBO || 1; for (let i = 0; i < n; i++) update(dt); }
    G.flashA = damp(G.flashA, 0, 9, rdt); if (G.phase === 'fight') G.fade = Math.max(0, G.fade - rdt * 1.4);
    nextBanner(rdt);
    if (G.card) { G.card.t += rdt; if (G.card.t >= G.card.life) G.card = null; }
    if (G.callout) G.callout.t += rdt; UI.titleT += rdt;
    if (NET.role === 'host') hostTick(rdt); NET.rec = false;
    updateShake(rdt); updateCam(rdt); render();
  } catch (e) { console.error(e); window.CR_ERR = (window.CR_ERR || []).concat(String(e && e.stack || e)).slice(-5); }
}
async function boot() {
  cvs = document.getElementById('c'); ctx = cvs.getContext('2d', { alpha: false }); fxc = mkCanvas(1, 1); fctx = fxc.getContext('2d'); lc = mkCanvas(1, 1); lctx = lc.getContext('2d'); b1 = mkCanvas(1, 1); b1c = b1.getContext('2d'); b2 = mkCanvas(1, 1); b2c = b2.getContext('2d');
  try { if (document.fonts) await Promise.race([Promise.all([document.fonts.load('900 40px "Grenze Gotisch"'), document.fonts.load('500 16px Teko'), document.fonts.load('600 16px Teko')]), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
  await loadAssets(); resize(); addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
  setupControls(); netWrap();
  startRun(true); G.mode = 'menu'; G.card = null; UI.titleT = 99; const ld = document.getElementById('loading'); if (ld) ld.hidden = true;
  const rq = new URLSearchParams(location.search).get('room'); if (rq) setTimeout(() => netJoin(rq), 400);
  window.CR = { G, FX, CAM, Q, SFX, VIEW, ARENA: () => ARENA, startRun, startFloor, startWave, beginCast, SPELLBOOK, live, pickChoice, md, MODS, UI, autoDraft, INPUT, CTRL, NET, MENU, startSolo, startWatch, TUT, cycleScheme, toWorld, logText, shareLog, NLOG, startHost, startJoin, lobbyPick, lobbyStart, netJoin, hostOpen, netCloseRoom, tryCast, autoLevel, selectHero, gainXp, levelUp, xpFor, spawnBoss, meteorStorm, thunderstorm, earthquake, cataclysm, explode, MON_DEFS, HERO_DEFS };
  requestAnimationFrame(frame);
}
boot().catch(e => { const ld = document.getElementById('loading'); if (ld) ld.textContent = 'Failed to start: ' + e.message; console.error(e); });
