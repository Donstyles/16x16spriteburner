// ===================== main loop =====================
let last = 0; const PERF = { acc: 0, n: 0, good: 0 };
function update(dt) { G.time += dt; updateRun(dt); updateFx(dt); }
function frame(t) {
  requestAnimationFrame(frame); if (window.CR_HOLD) { last = t; return; } // (a test holds the clock and steps it itself: CR.step)
  const rdt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
  PERF.acc += rdt; PERF.n++; if (PERF.n >= 90) { const avg = PERF.acc / PERF.n; PERF.acc = PERF.n = 0; if (avg > 0.026 && Q.res > 0.55) { Q.res = Math.max(0.55, Q.res - 0.15); Q.pmax = Math.max(1200, Q.pmax - 400); resize(); PERF.good = 0; } else if (avg > 0.034) Q.bloom = 0.5; else if (avg < 0.0175 && ++PERF.good > 3 && Q.res < 1) { Q.res = Math.min(1, Q.res + 0.1); resize(); PERF.good = 0; } }
  tickOnce(rdt);
}
// (tests: n frames of dt seconds each, drawn, with the clock held: window.CR_HOLD)
function stepFrames(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) tickOnce(dt); }
function tickOnce(rdt) {
  try {
    pollPad();
    if (G.mode === 'play' && !UI.paused) {
      readInput(); if (window.CR_BOT) botDrive(G.me, rdt);
      if (G.hitstop > 0) G.hitstop -= rdt;
      else { if (G.slowT > 0) G.slowT -= rdt; else G.ts = damp(G.ts, 1, 3, rdt); const n = window.CR_TURBO || 1; for (let i = 0; i < n; i++) update(rdt * G.ts); }
      if (G.phase === 'play') G.fade = Math.max(0, G.fade - rdt * 1.4);
      if (G.card) { G.card.t += rdt; if (G.card.t >= G.card.life) G.card = null; }
    } else if (G.mode !== 'play') { G.time += rdt; for (const u of G.units) u.anim += rdt; updateFx(rdt); }
    G.flashA = damp(G.flashA, 0, 9, rdt); nextBanner(rdt);
    updateShake(rdt); updateCam(rdt); render();
  } catch (e) { console.error(e); window.CR_ERR = (window.CR_ERR || []).concat(String(e && e.stack || e)).slice(-5); }
}
// the title screen shows a quiet cellar behind it
function menuBackdrop() { buildArena(1); initSight(ARENA); G.heroes = []; G.foes = []; G.units = []; G.proj = []; G.drops = []; G.me = null; const r = ARENA.start; CAM.x = (r.ix0 + r.ix1 + 1) / 2 * TS; CAM.y = (r.iy0 + r.iy1 + 1) / 2 * TS; CAM.z = exploreZoom(); }
async function boot() {
  cvs = document.getElementById('c'); ctx = cvs.getContext('2d', { alpha: false }); fxc = mkCanvas(1, 1); fctx = fxc.getContext('2d'); lc = mkCanvas(1, 1); lctx = lc.getContext('2d'); b1 = mkCanvas(1, 1); b1c = b1.getContext('2d'); b2 = mkCanvas(1, 1); b2c = b2.getContext('2d');
  try { if (document.fonts) await Promise.race([Promise.all([document.fonts.load('900 40px "Grenze Gotisch"'), document.fonts.load('500 16px Teko'), document.fonts.load('600 16px Teko'), TYPE.on ? loadTypeFaces() : null]), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
  await loadAssets(); resize(); addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
  setupInput(); menuBackdrop(); G.mode = 'menu'; MENU.screen = 'title';
  const ld = document.getElementById('loading'); if (ld) ld.hidden = true;
  window.CR = { step: stepFrames, MAGMA, LAKE, MINES, beginMagma, beginMines, startBridgeCine, CHEAT, setOneHit, setGod, G, FX, CAM, spritePixels, Q, SFX, VIEW, MENU, UI, INPUT, KITS, WEAPONS, FOE_TYPES, ARMIES, ARENA: () => ARENA, SHAPES, PUZ, GREAT, ARCH, GALLERY, beginGallery, snapArea, startRun, startFloor, beginRun, beginCrypt, beginCreatureTest, beginWaterTest, beginDoorTest, HIDDEN, beginArmourTest, testDie, hitCrack, replayFloor, buildReport, litAt, pitAt, solidAt, roomAt, penned, doorLandingNear, blockAt, openAt, startDrain, pickLabelY, pickLayout, DEATH_PICK, beginPuzzleFloor, beginPitFloor, beginShopTest, testNext, nextCreature, togglePause, toWorld, btnLayout, hurt, mkFoe, wakeFoe, foeHits, gaitTick, beginTest, cleanBlood, TEST, WEAPON, fx: { headless, debris, cracks, bloodPaint, splat, breakProp, snore, sweat, dropItem, spritePixels, foeShown, waterSlam, drawUnit, bigSprite, mobs: () => MOBS } };
  requestAnimationFrame(frame);
}
boot().catch(e => { const ld = document.getElementById('loading'); if (ld) ld.textContent = 'Failed to start: ' + e.message; console.error(e); });
