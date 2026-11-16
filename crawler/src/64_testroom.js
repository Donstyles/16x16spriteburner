// ===================== the blood test room =====================
// A room to try blows and blood on (from the kit screen): eight foes stand in its four corners and at the middle of each
// wall, and take whatever comes without moving or fighting back; each one is back 1.5 s after it dies, as a creature
// of the same kind from any army, or a chest guard (so every kind of blood turns up). A button at the top wipes all the blood away.
const TEST = { on: false };
const TEST_KINDS = { corner: ['brute', 'archer', 'flanker', 'brute'], wall: ['grunt', 'archer', 'skitter', 'flanker'] };
function beginTest(kit) {
  beginRun(kit); TEST.on = true; const A = ARENA, h = G.me;
  // the roomiest room that still fits in the lamp's reach from its middle
  const rooms = A.rooms.filter(r => r.w <= 14 && r.h <= 10), r = (rooms.length ? rooms : A.rooms).reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
  G.foes.length = 0; G.units = G.heroes.slice(); A.name = 'BLOOD TEST ROOM';
  const cx = Math.round((r.ix0 + r.ix1) / 2), cy = Math.round((r.iy0 + r.iy1) / 2), at = (tx, ty) => ({ x: (tx + 0.5) * TS, y: (ty + 0.5) * TS + 3 });
  const spots = [[r.ix0, r.iy0], [r.ix1, r.iy0], [r.ix0, r.iy1], [r.ix1, r.iy1]].map(([x, y], i) => ({ ...at(x, y), type: TEST_KINDS.corner[i] }))
    .concat([[cx, r.iy0], [r.ix1, cy], [cx, r.iy1], [r.ix0, cy]].map(([x, y], i) => ({ ...at(x, y), type: TEST_KINDS.wall[i] })));
  for (const p of A.props) if (spots.some(s => Math.abs(p.x - s.x) < 18 && Math.abs(p.y - s.y) < 18) || (Math.abs(p.x - (cx + 0.5) * TS) < 20 && Math.abs(p.y - (cy + 0.5) * TS) < 20)) { p.dead = true; p.solid = false; }
  h.x = (cx + 0.5) * TS; h.y = (cy + 0.5) * TS + 4; h.enter = null; h.lightR = 170; CAM.x = h.x; CAM.y = h.y;
  A.lights = A.slit = null; // the fixed lights again, without any brazier just cleared away
  for (const d of A.doors) if (d.room === r.i) shutDoor(A, d); // a closed arena: blood thrown at a doorway splashes on the door
  for (const s of spots) spawnDummy(s, true);
  A.keepClean = true; if (A.chunks) keepClean(A);
  G.card = { t: 0, life: 3.2, a: 'BLOOD TEST ROOM', b: 'THEY STAND AND TAKE IT, AND COME BACK', c: 'THE CLEAN BUTTON AT THE TOP WIPES THE BLOOD' };
}
function spawnDummy(s, quiet) {
  const f = mkFoe(s.type, 1, s.x, s.y, pick(s.type === 'brute' ? troops('brute').concat(GUARDS.flat()) : troops(s.type))); // any army's (and the chest guards)
  Object.assign(f, { dummy: true, spot: s, aware: true, state: 'fight', face: G.me && G.me.x < s.x ? -1 : 1, dir: G.me ? angTo(s.x, s.y, G.me.x, G.me.y) : 0 });
  G.foes.push(f); G.units.push(f); if (!quiet) smoke(s.x, s.y, 3, 'dust', 8, 16, 0.6);
}
// a dummy turns to face the hero, drifts back to its spot after a blow, and does nothing else
function dummyTick(f, dt) {
  const h = G.me; f.act = null; f.aware = true; f.state = 'fight'; if (h) { f.face = h.x < f.x ? -1 : 1; f.dir = angTo(f.x, f.y, h.x, h.y); } // it faces the hero (so a blow is never a backstab)
  f.vx = clamp((f.spot.x - f.x) * 4, -30, 30); f.vy = clamp((f.spot.y - f.y) * 4, -30, 30); f.moving = false;
}
function dummyDied(u) { const A = ARENA; G.sched.push({ t: 1.5, fn: () => { if (TEST.on && ARENA === A) spawnDummy(u.spot); } }); }
// a door shut for good: its cells turn to wall, and a shutter (north and south) is painted into the floor picture, so
// blood lands on it and runs down it like any wall; a side door's portcullis is drawn down in the wall line
function shutDoor(A, d) {
  const th = A.th; for (const [x, y] of d.cells) { A.fl[y * A.w + x] = 0; if (d.side === 'N') A.fl[(y - 1) * A.w + x] = 0; }
  if (d.side === 'E' || d.side === 'W') { d.k = 1; return; }
  for (const [x, y] of d.cells) groundPaint(x * TS, (y - 1) * TS, x * TS + TS, (y + 1) * TS, g => {
    if (d.side === 'N') { g.drawImage(IMG.doors, TS, th.door * TS, TS, TS, x * TS, (y - 1) * TS, TS, TS); g.drawImage(IMG.doors, TS, (th.door + 1) * TS, TS, TS, x * TS, y * TS, TS, TS); }
    else g.drawImage(IMG.doors, TS, (th.door + 1) * TS, TS, TS, x * TS, y * TS - 4, TS, TS);
  });
}
// the clean floor, kept when the room is made, to wipe back to
function keepClean(A) { A.clean = A.chunks.map(k => { const c = mkCanvas(k.w, k.h); c.getContext('2d').drawImage(k.cv, 0, 0); return c; }); }
function cleanBlood() {
  const A = ARENA; if (!A || !A.clean) return;
  groundChunks(A).forEach((k, i) => { k.g.save(); k.g.setTransform(1, 0, 0, 1, 0, 0); k.g.globalCompositeOperation = 'copy'; k.g.drawImage(A.clean[i], 0, 0); k.g.restore(); });
  if (BMAP.a) { BMAP.a.fill(0); BMAP.k.fill(0); } BTR.length = 0; FX.rocks.length = 0; FX.wet.length = 0; removeIf(FX.P, p => p.k === 'gore' || p.k === 'hay' || p.k === 'chip' || p.k === 'water' || p.k === 'pdust');
  for (const h of G.heroes) { h.gore = 0; h.fpN = 0; }
  SFX.whoosh(0); const h = G.me; if (h) textPop(h.x, h.y, headZ(h) + 4, 'CLEANED', 'white', false);
}
