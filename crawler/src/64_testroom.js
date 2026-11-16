// ===================== the blood test room =====================
// A room to try blows and blood on (from the kit screen): eight foes stand in its four corners and at the middle of each
// wall, and take whatever comes without moving or fighting back; each one is back 1.5 s after it dies, as a creature
// of the same kind from any army, or a chest guard (so every kind of blood turns up). A button at the top wipes all the blood away.
const TEST = { on: false };
const TEST_KINDS = { corner: ['brute', 'archer', 'flanker', 'brute'], wall: ['grunt', 'archer', 'skitter', 'flanker'] };
function beginTest(kit) {
  beginRun(kit); TEST.on = true; TEST.mode = 'blood'; TEST.god = false; const A = ARENA, h = G.me;
  // the roomiest room that still fits in the lamp's reach from its middle
  const rooms = A.rooms.filter(r => r.w <= 14 && r.h <= 10 && !r.pool && !r.shrine), r = (rooms.length ? rooms : A.rooms).reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
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
  if (d.side === 'S') { const xs = d.cells.map(c => c[0]), y = d.cells[0][1]; groundPaint(Math.min(...xs) * TS - 4, y * TS, (Math.max(...xs) + 1) * TS + 4, (y + 1) * TS + 4, g => drawSDoor(g, d.cells, 1, th.door + 1)); return; }
  for (const [x, y] of d.cells) groundPaint(x * TS, (y - 1) * TS, x * TS + TS, (y + 1) * TS, g => { g.drawImage(IMG.doors, TS, th.door * TS, TS, TS, x * TS, (y - 1) * TS, TS, TS); g.drawImage(IMG.doors, TS, (th.door + 1) * TS, TS, TS, x * TS, y * TS, TS, TS); });
}
// the clean floor, kept when the room is made, to wipe back to
function keepClean(A) { A.clean = A.chunks.map(k => { const c = mkCanvas(k.w, k.h); c.getContext('2d').drawImage(k.cv, 0, 0); return c; }); }
function cleanBlood() {
  const A = ARENA; if (!A || !A.clean) return;
  groundChunks(A).forEach((k, i) => { k.g.save(); k.g.setTransform(1, 0, 0, 1, 0, 0); k.g.globalCompositeOperation = 'copy'; k.g.drawImage(A.clean[i], 0, 0); k.g.restore(); });
  for (const p of A.pools || []) if (p.bridge && p.bridge.g) { const B = p.bridge; B.g.save(); B.g.setTransform(1, 0, 0, 1, 0, 0); B.g.clearRect(0, 0, B.w, B.h); B.g.restore(); }
  if (BMAP.a) { BMAP.a.fill(0); BMAP.k.fill(0); } BTR.length = 0; FX.rocks.length = 0; FX.wet.length = 0; removeIf(FX.P, p => p.k === 'gore' || p.k === 'hay' || p.k === 'chip' || p.k === 'water' || p.k === 'pdust');
  for (const h of G.heroes) { h.gore = 0; h.fpN = 0; }
  SFX.whoosh(0); const h = G.me; if (h) textPop(h.x, h.y, headZ(h) + 4, 'CLEANED', 'white', false);
}
// ===================== the creature test room =====================
// From the kit screen: the blood test room's room, its doors shut, with one creature or group at a time in it, awake and
// fighting for real: the new creatures, the casters with their spells, the movers, the chest guards, then each army
// (one of each of its troops). NEXT at the top brings on the next; a group that falls comes back after two seconds.
// The hero cannot die here, and his health comes back on its own.
const CREATURE_TESTS = [
  ['WATER ELEMENTAL', [['brute', 'WaterElemental', 1]]], ['GRIZZLED TREANT', [['brute', 'GrizzledTreant', 1]]], ['FLUTTERING PIXIES', [['skitter', 'FlutteringPixie', 3]]],
  ['LIZARDFOLK SCOUTS · LASER RIFLES', [['archer', 'LizardfolkScout', 2]]], ['MUTILATED STUMBLERS · THE SHUFFLE', [['grunt', 'MutilatedStumbler', 3]]],
  ['DISMEMBERED CRAWLERS · THE SCUTTLE', [['flanker', 'DismemberedCrawler', 2]]], ['TUNNELING MOLES · UNDER THE FLOOR', [['flanker', 'TunnelingMole', 2]]],
  ['GOBLIN OCCULTISTS · THE HEX', [['archer', 'GoblinOccultist', 2]]], ['VILE WITCHES · POISON FLASKS', [['archer', 'VileWitch', 2]]],
  ['MERFOLK AQUAMANCERS · WAVES', [['archer', 'MerfolkAquamancer', 2]]], ['ACID ANTS · GREEN SPIT', [['archer', 'AcidAnt', 2]]], ['ADEPT NECROMANCER · RAISES THE DEAD', [['archer', 'AdeptNecromancer', 1]]],
  ['ELF ENCHANTER · WARDS THE TREANT', [['archer', 'ElfEnchanter', 1], ['brute', 'GrizzledTreant', 1], ['grunt', 'ElfBladedancer', 2]]],
  ['SCARECROW · CHEST GUARD', [['brute', 'ScarecrowGolem', 1]]], ['STONE GOLEM · CHEST GUARD', [['brute', 'StoneGolem', 1]]], ['CLAY GOLEM · CHEST GUARD', [['brute', 'ClayGolem', 1]]],
];
function creatureTests() { // the set pieces, then every army on a floor, then the reserve (named as such)
  const of = (A, k, tag) => [A[k].name + tag, ['grunt', 'brute', 'archer', 'skitter', 'flanker'].flatMap(t => A[k][t].map(s => [t, s, 1]))];
  return CREATURE_TESTS.concat(Object.keys(ARMIES).map(k => of(ARMIES, k, '')), Object.keys(RESERVE).map(k => of(RESERVE, k, ' · RESERVE')));
}
function beginCreatureTest(kit) {
  beginTest(kit); G.foes.length = 0; G.units = G.heroes.slice(); G.sched.length = 0;
  Object.assign(TEST, { mode: 'creatures', god: true, i: 0, list: creatureTests(), gen: 0 }); ARENA.name = 'CREATURE TEST ROOM';
  G.card = { t: 0, life: 3.2, a: 'CREATURE TEST ROOM', b: 'THEY FIGHT FOR REAL · YOU CANNOT DIE HERE', c: 'NEXT AT THE TOP BRINGS ON THE NEXT ONE' };
  creatureSpawn();
}
function creatureSpawn() {
  const h = G.me, gen = ++TEST.gen, [label, group] = TEST.list[TEST.i]; TEST.label = label;
  for (const f of G.foes) if (!f.dead) { smoke(f.x, f.y, 3, 'dust', 8, 16, 0.6); f.dead = true; } // the last lot goes
  G.foes = G.foes.filter(f => !f.dead); G.units = G.heroes.concat(G.foes); G.hz && (G.hz.length = 0); G.proj = G.proj.filter(p => p.team === 'hero');
  const r = roomAt(h.x, h.y) || ARENA.start, n = group.reduce((a, g) => a + g[2], 0); let k = 0;
  for (const [type, spr, cnt] of group) for (let i = 0; i < cnt; i++, k++) {
    const a = -Math.PI / 2 + (k - (n - 1) / 2) * 0.55, R = type === 'archer' ? 70 : 52; let x = h.x + Math.cos(a) * R, y = h.y + Math.sin(a) * R * 0.75;
    x = clamp(x, (r.ix0 + 0.6) * TS, (r.ix1 + 0.4) * TS); y = clamp(y, (r.iy0 + 0.8) * TS, (r.iy1 + 0.6) * TS);
    const f = mkFoe(type, 1, x, y, spr); Object.assign(f, { aware: true, state: 'fight', tgt: h, lastX: h.x, lastY: h.y, ctest: gen }); f.def.gold = [0, 0];
    G.foes.push(f); G.units.push(f); smoke(x, y, 3, 'dust', 8, 16, 0.6);
  }
}
function nextCreature() { if (TEST.mode !== 'creatures') return; TEST.i = (TEST.i + 1) % TEST.list.length; creatureSpawn(); SFX.whoosh(0); }
function creatureTick(dt) {
  const h = G.me; if (h && !h.dead) h.hp = Math.min(h.maxHp, h.hp + 6 * dt);
  if (!TEST.waiting && G.foes.length && G.foes.every(f => f.dead || f.ctest !== TEST.gen)) { TEST.waiting = true; const gen = TEST.gen; G.sched.push({ t: 2, fn: () => { TEST.waiting = false; if (TEST.mode === 'creatures' && TEST.gen === gen) creatureSpawn(); } }); }
}
// ===================== the water test room =====================
// From the kit screen: a floor with a cistern, its doors shut and nobody on the floor but the hero, standing by the drain
// plate. The water holds as many of the things the sheet has standing in water as will fit. Step on the plate and it
// drains; REFILL at the top brings the water back, and everything in it, for another go.
function beginWaterTest(kit) {
  beginRun(kit); for (let n = 0; n < 120 && !ARENA.cistern; n++) { G.floor = 1 + (n % 3); startFloor(); }
  if (!ARENA.cistern) { beginTest(kit); return; }
  const A = ARENA, r = A.cistern, p = r.pool, h = G.me, pl = (A.plates || []).find(q => q.pool === p);
  TEST.on = true; Object.assign(TEST, { mode: 'water', god: true, label: 'STEP ON THE PLATE TO DRAIN IT' }); A.name = 'WATER TEST ROOM';
  G.foes.length = 0; G.units = G.heroes.slice(); G.sched.length = 0; G.drops.length = 0;
  removeIf(A.props, q => q.sunk === p && q.kind !== 'wetpillar'); sinkThings(A, p, SUNK.length, SUNK.slice().sort(() => Math.random() - 0.5)); // one of each, as many as fit
  for (const d of A.doors) if (d.room === r.i) shutDoor(A, d);
  const at = pl ? [pl.x + (pl.tx <= p.x0 ? -16 : pl.tx >= p.x1 ? 16 : 0), pl.y + (pl.ty <= p.y0 ? -16 : pl.ty >= p.y1 ? 16 : 0)] : [(p.x0 - 1) * TS + 8, (p.y0 - 1) * TS + 8];
  h.x = at[0]; h.y = at[1] + 2; h.enter = null; h.lightR = 220; CAM.x = h.x; CAM.y = h.y;
  A.keepClean = true; if (A.chunks) keepClean(A);
  G.card = { t: 0, life: 3.2, a: 'WATER TEST ROOM', b: 'STEP ON THE PLATE TO DRAIN THE CISTERN', c: 'REFILL AT THE TOP BRINGS THE WATER BACK' };
}
function waterTick(dt) { const h = G.me; if (h && !h.dead) h.hp = Math.min(h.maxHp, h.hp + 6 * dt); }
// the second button at the top: the next creature, or the water back in
function testNext() {
  if (TEST.mode === 'creatures') nextCreature();
  else if (TEST.mode === 'water' && ARENA.cistern) { refillPool(ARENA.cistern.pool); SFX.whoosh(0); }
}
