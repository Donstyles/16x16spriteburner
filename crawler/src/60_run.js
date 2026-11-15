// ===================== the run: floors, the way down, and the end =====================
// A run starts from nothing but a kit. Each floor is a fresh dungeon; the way down is in the end room's north wall and
// stands open from the start, but the end room is guarded and the rooms between hold what makes the next floor survivable.
// When every hero has fallen the run is over.
const G = {
  mode: 'boot', time: 0, floor: 1, run: 0, kills: 0, gold: 0, units: [], heroes: [], foes: [], proj: [], drops: [], sched: [], me: null,
  phase: 'play', phaseT: 0, trauma: 0, quakeT: 0, quakeP: 0, hitstop: 0, ts: 1, slowT: 0, flashA: 0, flashC: 'white', ambFlash: 0,
  card: null, fade: 1, banner: null, bq: [], hurtFlash: 0, tiredT: 0, kit: 'sellsword', best: 0, summary: null,
};
function after(t, fn) { G.sched.push({ t, fn }); }
function startRun(kit) {
  G.run++; G.floor = 1; G.kills = 0; G.gold = 0; G.kit = kit; G.summary = null; G.time = 0;
  const h = makeHero(kit); G.heroes = [h]; G.me = h;
  startFloor();
  G.mode = 'play';
}
function startFloor() {
  buildArena(G.floor); initSight(ARENA); G.proj = []; G.drops = []; G.sched = []; for (const k in FX) FX[k].length = 0;
  const A = ARENA, sp = A.spawn;
  G.heroes.forEach((h, i) => { h.x = sp.x + (i - (G.heroes.length - 1) / 2) * 16; h.y = sp.y; h.z = 0; h.vx = h.vy = h.kx = h.ky = 0; h.act = null; h.stun = 0; h.iframe = 0; h.dir = -Math.PI / 2; h.path = null; });
  G.foes = []; for (const r of A.rooms) if (r.kind === 'room' || r.kind === 'end') G.foes.push(...populateRoom(A, r, G.floor));
  G.units = G.heroes.concat(G.foes);
  G.phase = 'play'; G.phaseT = 0; G.fade = 1;
  CAM.x = sp.x; CAM.y = sp.y - 16; CAM.z = exploreZoom();
  G.card = { t: 0, life: 2.8, a: 'FLOOR ' + G.floor, b: A.name, c: G.floor === 1 ? 'THE WAY DOWN LIES IN THE FARTHEST ROOM' : '' };
  SFX.boom(0.6, 0);
}
function updateRun(dt) {
  G.phaseT += dt;
  for (let i = 0; i < G.sched.length; i++) { const s = G.sched[i]; if ((s.t -= dt) <= 0) { G.sched.splice(i--, 1); s.fn(); } }
  for (const u of G.units) { u.anim += dt; if (u.flash > 0) u.flash -= dt; }
  for (const h of G.heroes) heroTick(h, dt);
  for (const f of G.foes) foeTick(f, dt);
  for (const u of G.units) if (!u.dead) moveActor(u, dt);
  separate(G.units);
  updateProj(dt); updateDrops(dt); updateSight(dt);
  removeIf(G.foes, f => f.dead); removeIf(G.units, u => u.dead && u.team === 'foe');
  if (G.hurtFlash > 0) G.hurtFlash -= dt; if (G.tiredT > 0) G.tiredT -= dt;
  if (G.phase === 'play') {
    if (!G.heroes.some(alive)) { G.phase = 'dead'; G.phaseT = 0; G.best = Math.max(G.best, G.floor); saveBest(); G.summary = { floor: G.floor, kills: G.kills, gold: G.gold, kit: G.kit, name: ARENA.name }; textBanner('YOU HAVE FALLEN', 'FLOOR ' + G.floor + '  ·  ' + G.kills + ' SLAIN  ·  ' + G.gold + ' GOLD', 'red'); SFX.braam(); return; }
    const s = ARENA.stairs; if (G.heroes.some(h => alive(h) && Math.abs(h.x - s.x) < 18 && h.y < s.y + 6 && h.y > s.y - 20)) { G.phase = 'descend'; G.phaseT = 0; SFX.whoosh(0); }
  } else if (G.phase === 'descend') {
    G.fade = Math.min(1, G.phaseT / 0.7);
    if (G.phaseT > 0.9) { G.floor++; G.best = Math.max(G.best, G.floor); saveBest(); for (const h of G.heroes) { if (h.dead) { h.dead = false; h.hp = Math.round(h.maxHp * 0.3); } } startFloor(); }
  } else if (G.phase === 'dead') {
    if (G.phaseT > 3.2) G.fade = Math.min(1, (G.phaseT - 3.2) / 0.8);
    if (G.phaseT > 4.2) { G.mode = 'menu'; MENU.screen = 'summary'; G.fade = 0; }
  }
}
function saveBest() { try { localStorage.setItem('cor2-best', String(G.best)); } catch (e) { } }
try { G.best = +localStorage.getItem('cor2-best') || 0; } catch (e) { }
// ---------- banners ----------
function pushBanner(b) { b.t = 0; b.life = b.life || 2.2; if (!G.banner) G.banner = b; else { G.bq.push(b); if (G.bq.length > 4) G.bq.shift(); } }
function textBanner(a, b, col = 'gold', small = false) { pushBanner({ a, b, col, small, life: small ? 1.8 : 2.6 }); }
function nextBanner(rdt) { if (G.banner) { G.banner.t += rdt; if (G.banner.t >= G.banner.life) G.banner = null; } if (!G.banner && G.bq.length) { G.banner = G.bq.shift(); G.banner.t = 0; } }
