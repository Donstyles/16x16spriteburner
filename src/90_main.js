// ===================== main loop =====================
let last = 0; const PERF = { acc: 0, n: 0, good: 0 };
function update(dt) {
  G.time += dt;
  for (let i = 0; i < G.sched.length; i++) { const s = G.sched[i]; s.t -= dt; if (s.t <= 0) { G.sched.splice(i--, 1); try { s.fn(); } catch (e) { console.error(e); } } }
  G.mons = G.units.filter(u => u.team === 'mon' && !u.dead);
  const heroes = G.heroes.filter(alive);
  for (const u of G.units) { u.anim += dt; if (u.flash > 0) u.flash -= dt; if (u.lunge > 0) u.lunge -= dt * 1.8; }
  for (const h of G.heroes) heroAI(h, dt);
  for (const m of G.mons) monAI(m, dt, heroes);
  for (const u of G.units) { if (u.state && u.state.k === 'leap') continue; const wasAir = u.z > 0, vz = u.vz; moveUnit(u, dt); if (wasAir && u.z === 0 && u.team === 'hero' && vz < -300) { ring(u.x, u.y, 30, 'white', 0.3, 3); smoke(u.x, u.y, 5, 'dust', 9, 40, 1); debris(u.x, u.y, 8, ['#5a5048', '#7d7064'], 80, 100, 1.6); shake(0.15); SFX.hit(panOf(u.x)); } }
  separate(G.units, dt);
  removeIf(G.units, u => u.dead && u.team === 'mon');
  updateProj(dt); updateHazards(dt); updateStorm(dt); updateQuake(dt); updateFx(dt); updateDirector(dt);
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
    updateChoice(rdt); if (G.fightT > 0) G.fightT -= rdt;
    if (G.choice) { /* the battle holds its breath while the player chooses */ }
    else if (G.hitstop > 0) G.hitstop -= rdt;
    else { if (G.slowT > 0) G.slowT -= rdt; else G.ts = damp(G.ts, 1, 3, rdt); const dt = rdt * G.ts, n = window.CR_TURBO || 1; for (let i = 0; i < n; i++) update(dt); }
    G.flashA = damp(G.flashA, 0, 9, rdt); if (G.phase === 'fight') G.fade = Math.max(0, G.fade - rdt * 1.4);
    nextBanner(rdt);
    if (G.card) { G.card.t += rdt; if (G.card.t >= G.card.life) G.card = null; }
    if (G.callout) G.callout.t += rdt; UI.titleT += rdt;
    updateShake(rdt); updateCam(rdt); render();
  } catch (e) { console.error(e); window.CR_ERR = (window.CR_ERR || []).concat(String(e && e.stack || e)).slice(-5); }
}
function onTap(e) {
  const r = UI.soundRect; const x = e.clientX, y = e.clientY, hadSound = !!SFX.ctx;
  if (G.choice && G.choice.picked < 0) { const i = choiceAt(x, y); if (i >= 0) { if (!hadSound) SFX.init(); pickChoice(i); return; } }
  if (!SFX.ctx) { SFX.init(); try { const el = document.documentElement; if (el.requestFullscreen && !/iPhone|iPad/.test(navigator.userAgent)) el.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { })).catch(() => { }); } catch (err) { } try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => { }); } catch (err) { } return; }
  if (r && x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]) SFX.toggle();
}
async function boot() {
  cvs = document.getElementById('c'); ctx = cvs.getContext('2d', { alpha: false }); fxc = mkCanvas(1, 1); fctx = fxc.getContext('2d'); lc = mkCanvas(1, 1); lctx = lc.getContext('2d'); b1 = mkCanvas(1, 1); b1c = b1.getContext('2d'); b2 = mkCanvas(1, 1); b2c = b2.getContext('2d');
  try { if (document.fonts) await Promise.race([Promise.all([document.fonts.load('900 40px "Grenze Gotisch"'), document.fonts.load('500 16px Teko'), document.fonts.load('600 16px Teko')]), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
  await loadAssets(); resize(); addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
  addEventListener('pointerdown', onTap); addEventListener('pointermove', e => { if (G.choice) G.choice.hover = choiceAt(e.clientX, e.clientY); }); addEventListener('keydown', e => { if (G.choice && G.choice.picked < 0 && /^[1-3]$/.test(e.key)) pickChoice(+e.key - 1); }); document.addEventListener('visibilitychange', () => { if (SFX.ctx) { if (document.hidden) SFX.ctx.suspend(); else if (SFX.on) SFX.ctx.resume(); } });
  startRun(); G.mode = 'play'; const ld = document.getElementById('loading'); if (ld) ld.hidden = true;
  window.CR = { G, FX, CAM, Q, SFX, VIEW, ARENA: () => ARENA, startRun, startFloor, startWave, beginCast, SPELLBOOK, live, pickChoice, md, MODS, gainXp, levelUp, xpFor, spawnBoss, meteorStorm, thunderstorm, earthquake, cataclysm, explode, MON_DEFS, HERO_DEFS };
  requestAnimationFrame(frame);
}
boot().catch(e => { const ld = document.getElementById('loading'); if (ld) ld.textContent = 'Failed to start: ' + e.message; console.error(e); });
