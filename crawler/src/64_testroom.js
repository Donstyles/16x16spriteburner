// ===================== the blood test room =====================
// A room to try blows and blood on (from the kit screen): eight foes stand in its four corners and at the middle of each
// wall, and take whatever comes without moving or fighting back; each one is back 1.5 s after it dies, as a creature
// of the same kind from any army, or a chest guard (so every kind of blood turns up). A button at the top wipes all the blood away.
const TEST = { on: false };
const TEST_KINDS = { corner: ['brute', 'archer', 'flanker', 'brute'], wall: ['grunt', 'archer', 'skitter', 'flanker'] };
function beginTest(kit) {
  beginRun(kit); TEST.on = true; TEST.mode = 'blood'; TEST.god = false; const A = ARENA, h = G.me;
  // the roomiest room that still fits in the lamp's reach from its middle
  const rooms = A.rooms.filter(r => r.w <= 14 && r.h <= 10 && !r.pool && !r.shrine && !r.set && !r.shape), r = (rooms.length ? rooms : A.rooms).reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
  G.foes.length = 0; G.units = G.heroes.slice(); A.name = 'BLOOD TEST ROOM';
  const cx = Math.round((r.ix0 + r.ix1) / 2), cy = Math.round((r.iy0 + r.iy1) / 2), at = (tx, ty) => ({ x: (tx + 0.5) * TS, y: (ty + 0.5) * TS + 3 });
  const spots = [[r.ix0, r.iy0], [r.ix1, r.iy0], [r.ix0, r.iy1], [r.ix1, r.iy1]].map(([x, y], i) => ({ ...at(x, y), type: TEST_KINDS.corner[i] }))
    .concat([[cx, r.iy0], [r.ix1, cy], [cx, r.iy1], [r.ix0, cy]].map(([x, y], i) => ({ ...at(x, y), type: TEST_KINDS.wall[i] })));
  for (const p of A.props) if (spots.some(s => Math.abs(p.x - s.x) < 18 && Math.abs(p.y - s.y) < 18) || (Math.abs(p.x - (cx + 0.5) * TS) < 20 && Math.abs(p.y - (cy + 0.5) * TS) < 20)) { p.dead = true; p.solid = false; }
  h.x = (cx + 0.5) * TS; h.y = (cy + 0.5) * TS + 4; h.enter = null; h.lightR = 170; CAM.x = h.x; CAM.y = h.y;
  A.lights = A.slit = null; // the fixed lights again, without any brazier just cleared away
  for (const d of A.doors) if (d.room === r.i) shutDoor(A, d, r); // a closed arena
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
function shutDoor(A, d, r) {
  const th = A.th; for (const [x, y] of d.cells) { A.fl[y * A.w + x] = 0; if (d.side === 'N') A.fl[(y - 1) * A.w + x] = 0; }
  // a north doorway gets a blast door, down: the game's own (drawn among the units by depth, its strut over it, 32_crawl)
  if (d.side === 'N') { d.k = 1; d.strut = true; A.flv = (A.flv || 0) + 1; return; }
  // a side doorway is walled up (no portcullis in the game for now: 41_puzzles PORTCULLIS): the room's side wall run on
  // across it, the corridor's first stretch beyond it rock, its wall pieces and their trim made again from the floor as it
  // is now (41_puzzles repaintTiles)
  if (d.side === 'E' || d.side === 'W') {
    const x = d.cells[0][0], ys = d.cells.map(c => c[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), out = x < r.ix0 ? -1 : 1;
    for (let k = 1; k <= 3; k++) for (let y = y0 - 1; y <= y1 + 1; y++) { const i = y * A.w + x + out * k; A.fl[i] = 0; }
    const inside = (px, py) => Math.floor(px / TS) * out >= (x + out) * out && Math.floor(px / TS) * out <= (x + out * 3) * out && py >= (y0 - 1) * TS && py < (y1 + 2) * TS;
    removeIf(A.props, q => inside(q.x, q.y)); if (A.spikes) removeIf(A.spikes, q => inside(q.x, q.y + 6));
    repaintTiles(A, Math.min(x, x + out * 4), y0 - 2, Math.max(x, x + out * 4), y1 + 3); A.flv = (A.flv || 0) + 1; return;
  }
  // a south doorway has no door (the sheet's shutters are blast doors for north walls): it is walled up, the room's own
  // south wall run on across it, and the first stretch of the corridor beyond it painted over as rock
  if (d.side === 'S') {
    const xs = d.cells.map(c => c[0]), y = d.cells[0][1], x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, fr = th.floors[0][1];
    groundPaint(x0 * TS, y * TS, (x1 + 1) * TS, (y + 4) * TS, g => {
      g.fillStyle = rockRGB(); g.fillRect(x0 * TS, (y + 1) * TS, (x1 - x0 + 1) * TS, 3 * TS);
      for (let x = x0; x <= x1; x++) { tileAt(g, 10, fr, x * TS, y * TS); { const [im, sx, sy] = srcOf(6, 3 + th.fy); g.drawImage(im, sx, sy, TS, TS, x * TS, y * TS, TS, TS); } }
    });
    // the corridor's first stretch is rock now, and the wall across the doorway south wall pieces (31_walls: their row is
    // floor behind the wall, as along the rest of it); over the ceiling layer the corridor's posts and corners go, and the
    // south wall's painted trim runs on across
    for (let yy = y + 1; yy <= y + 3; yy++) for (let x = x0; x <= x1; x++) { const i = yy * A.w + x; A.fl[i] = 0; A.wt[i] = 0; }
    const inside = (px, py) => px >= x0 * TS && px < (x1 + 1) * TS && py >= (y + 1) * TS && py < (y + 5) * TS; // (and whatever stood in that stretch goes with it: crates, columns, spikes)
    removeIf(A.props, p => inside(p.x, p.y)); if (A.spikes) removeIf(A.spikes, s => inside(s.x, s.y + 6));
    for (let x = x0; x <= x1; x++) { A.wt[y * A.w + x] = 6 * 64 + 3 + 1; A.wf[y * A.w + x] = 0; } A.flv = (A.flv || 0) + 1;
    const cg = A.ceil.getContext('2d'); cg.clearRect(x0 * TS, y * TS, (x1 - x0 + 1) * TS, 4 * TS); A.ceilN.getContext('2d').clearRect(x0 * TS, y * TS, (x1 - x0 + 1) * TS, 4 * TS);
    for (let x = x0; x <= x1; x++) { const c = mkCanvas(TS, TS), q = c.getContext('2d'); tileAt(q, 10, fr, 0, 0); { const [im, sx, sy] = srcOf(6, 3 + th.fy); q.drawImage(im, sx, sy, TS, TS, 0, 0, TS, TS); } for (const [rx, ry, rw, rh] of paintOf(6, 3, 0).tr) cg.drawImage(c, rx, ry, rw, rh, x * TS + rx, y * TS + ry, rw, rh); }
    return;
  }
  for (const [x, y] of d.cells) groundPaint(x * TS, (y - 1) * TS, x * TS + TS, (y + 1) * TS, g => { const cx = (1 + (d.motif || 0)) * TS; g.drawImage(IMG.doors, cx, th.door * TS, TS, TS, x * TS, (y - 1) * TS, TS, TS); g.drawImage(IMG.doors, cx, (th.door + 1) * TS, TS, TS, x * TS, y * TS, TS, TS); });
}
// the clean floor, kept when the room is made, to wipe back to
function keepClean(A) { A.clean = A.chunks.map(k => { const c = mkCanvas(k.w, k.h); c.getContext('2d').drawImage(k.cv, 0, 0); return c; }); }
function cleanBlood() {
  const A = ARENA; if (!A || !A.clean) return;
  groundChunks(A).forEach((k, i) => { k.g.save(); k.g.setTransform(1, 0, 0, 1, 0, 0); k.g.globalCompositeOperation = 'copy'; k.g.drawImage(A.clean[i], 0, 0); k.g.restore(); });
  for (const p of A.pools || []) if (p.bridge && p.bridge.g) { const B = p.bridge; B.g.save(); B.g.setTransform(1, 0, 0, 1, 0, 0); B.g.clearRect(0, 0, B.w, B.h); B.g.restore(); }
  if (BMAP.a) { BMAP.a.fill(0); BMAP.k.fill(0); } BTR.length = 0; FX.rocks.length = 0; FX.wet.length = 0; removeIf(FX.P, p => p.k === 'gore' || p.k === 'hay' || p.k === 'patch' || p.k === 'ring' || p.k === 'chip' || p.k === 'water' || p.k === 'pdust');
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
function nextCreature() { if (TEST.mode !== 'creatures' && TEST.mode !== 'armour') return; TEST.calm = false; /* (NEXT brings foes on, even with FOES off) */ TEST.i = (TEST.i + 1) % TEST.list.length; creatureSpawn(); SFX.whoosh(0); }
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
  const A = ARENA, r = A.cistern, p = r.pool, h = G.me; let pl = (A.plates || []).find(q => q.pool === p);
  if (pl && pl.remote && p.localAt) Object.assign(pl, { x: p.localAt[0] * TS + 8, y: p.localAt[1] * TS + 8, tx: p.localAt[0], ty: p.localAt[1], remote: false, outlet: null, room: r.i }); // (here the plate is on the cistern's walk)
  TEST.on = true; Object.assign(TEST, { mode: 'water', god: true, label: 'STEP ON THE PLATE TO DRAIN IT' }); A.name = 'WATER TEST ROOM';
  G.foes.length = 0; G.units = G.heroes.slice(); G.sched.length = 0; G.drops.length = 0;
  removeIf(A.props, q => q.sunk === p && q.kind !== 'wetpillar'); const all = SUNK.concat(sunkStone(A)); sinkThings(A, p, all.length, pitShuffle(all.slice())); // one of each, as many as fit
  for (const d of A.doors) if (d.room === r.i) shutDoor(A, d, r);
  const at = pl ? [pl.x + (pl.tx <= p.x0 ? -16 : pl.tx >= p.x1 ? 16 : 0), pl.y + (pl.ty <= p.y0 ? -16 : pl.ty >= p.y1 ? 16 : 0)] : [(p.x0 - 1) * TS + 8, (p.y0 - 1) * TS + 8];
  h.x = at[0]; h.y = at[1] + 2; h.enter = null; h.lightR = 220; CAM.x = h.x; CAM.y = h.y;
  A.keepClean = true; if (A.chunks) keepClean(A);
  G.card = { t: 0, life: 3.2, a: 'WATER TEST ROOM', b: 'STEP ON THE PLATE TO DRAIN THE CISTERN', c: 'REFILL AT THE TOP BRINGS THE WATER BACK' };
}
function waterTick(dt) { const h = G.me; if (h && !h.dead) h.hp = Math.min(h.maxHp, h.hp + 6 * dt); }
// ===================== the door test room =====================
// From the test rooms screen: a room with a doorway in its north wall and one in its south wall (and its side ones, where it
// has them), nobody on the floor but the hero, in its middle. DOORS at the top shuts them all, or opens them: blast doors
// in the north and south doorways (each with its strut), portcullises in the side ones, as a gate goes (41_puzzles), with
// its chains and its thud; none comes down on anyone. MOTIF gives the blast doors the sheet's next motif (the cross, the
// chevron, the emblem); COLOUR builds the room again in the other floor colour (brown or grey).
const DOOR_MOTIFS = ['THE CROSS', 'THE CHEVRON', 'THE EMBLEM'];
function beginDoorTest(kit, tone) {
  beginRun(kit); let r = null; const ok = q => (q.kind === 'room' || q.kind === 'start') && !q.set && !q.pool && !q.puz && !q.shrine && ['N', 'S'].every(s => q.doors.some(d => d.side === s && !d.hall.bent && !d.gate)) && !q.doors.some(d => d.gate);
  for (let n = 0; n < 160 && !r; n++) { G.floor = 1 + (n % 6); if (tone && (G.floor % 2 ? 'brown' : 'grey') !== tone) continue; startFloor(); r = ARENA.rooms.filter(ok).sort((a, b) => b.doors.length - a.doors.length)[0] || null; }
  if (!r) { beginTest(kit); return; }
  const A = ARENA, h = G.me; TEST.on = true; Object.assign(TEST, { mode: 'doors', god: true, kit, motif: 0, shut: false, tone: A.th.tone === 'grey' ? 'grey' : 'brown', gates: [] }); A.name = 'DOOR TEST ROOM';
  G.foes.length = 0; G.units = G.heroes.slice(); G.sched.length = 0; G.drops.length = 0;
  for (const d of r.doors) { if ((d.side === 'E' || d.side === 'W') && !PORTCULLIS) continue; const g = { d, hall: d.hall, k: 0, target: 0, going: false, test: true }; d.gate = g; d.motif = 0; if (d.side === 'S') d.strut = true; (A.gates = A.gates || []).push(g); TEST.gates.push(g); }
  h.x = (r.ix0 + r.ix1 + 1) / 2 * TS; h.y = (r.iy0 + r.iy1 + 1) / 2 * TS + 4; h.enter = null; h.lightR = 220; CAM.x = h.x; CAM.y = h.y;
  for (const p of A.props) if (Math.abs(p.x - h.x) < 18 && Math.abs(p.y - h.y) < 18) { p.dead = true; p.solid = false; }
  doorLabel(); A.keepClean = true; if (A.chunks) keepClean(A);
  G.card = { t: 0, life: 3.2, a: 'DOOR TEST ROOM', b: 'DOORS SHUTS THEM OR OPENS THEM', c: 'MOTIF: THE NEXT BLAST DOOR · COLOUR: BROWN OR GREY' };
}
function doorLabel() { TEST.label = (TEST.shut ? 'SHUT' : 'OPEN') + ' · ' + DOOR_MOTIFS[TEST.motif] + ' · ' + TEST.tone.toUpperCase(); }
function doorToggle() { TEST.shut = !TEST.shut; for (const g of TEST.gates) g.target = TEST.shut ? 1 : 0; doorLabel(); }
function doorMotif() { if (!TEST.on || TEST.mode !== 'doors') return; TEST.motif = (TEST.motif + 1) % 3; for (const g of TEST.gates) g.d.motif = TEST.motif * 5; doorLabel(); SFX.whoosh(0); }
function doorTone() { if (!TEST.on || TEST.mode !== 'doors') return; const m = TEST.motif, shut = TEST.shut; beginDoorTest(TEST.kit, TEST.tone === 'grey' ? 'brown' : 'grey'); if (TEST.mode !== 'doors') return; TEST.motif = m; for (const g of TEST.gates) g.d.motif = m * 5; if (shut) doorToggle(); doorLabel(); G.card = null; }
// the second button at the top: the next creature, or the water back in
function testNext() {
  if (TEST.mode === 'creatures' || TEST.mode === 'armour') nextCreature();
  else if (TEST.mode === 'water' && ARENA.cistern) { refillPool(ARENA.cistern.pool); SFX.whoosh(0); }
  else if (TEST.mode === 'doors') doorToggle();
}
// ===================== the armour and death room =====================
// From the kit screen: the blood test room's room, its doors shut, the hero in a gambeson and a fresh one lying by the
// wall (back two seconds after it is taken). The foes fight for real, one lot at a time (NEXT brings on the next; a lot
// that falls comes back after two seconds), and nothing heals him: the gambeson is hacked away, then he is, and he
// dies. His death plays out in full, then he gets up again in the middle, whole, in a new gambeson, the foes fresh.
const ARMOUR_TESTS = [
  ['GRUNTS · BLOWS ON THE GAMBESON, THEN ON YOU', [['grunt', null, 3]]], ['A BRUTE · ITS SLAM BLOWS YOU APART', [['brute', null, 1]]],
  ['ARCHERS · ARROWS', [['archer', null, 2]]], ['SKITTERERS · A SWARM', [['skitter', null, 6]]], ['FLANKERS · FROM BEHIND', [['flanker', null, 2]]],
  ['ACID ANTS · GREEN SPIT', [['archer', 'AcidAnt', 2]]], ['ALL OF THEM AT ONCE', [['brute', null, 1], ['grunt', null, 2], ['archer', null, 1], ['skitter', null, 3]]],
];
function beginArmourTest(kit) {
  beginTest(kit); G.foes.length = 0; G.units = G.heroes.slice(); G.sched.length = 0;
  Object.assign(TEST, { mode: 'armour', god: false, i: 0, list: ARMOUR_TESTS, gen: 0, rackT: 0, rack2T: 0, di: 0, forceDeath: null, calm: false }); const A = ARENA, h = G.me, r = roomAt(h.x, h.y) || A.start; A.name = 'ARMOUR & DEATH ROOM';
  TEST.home = { x: h.x, y: h.y }; TEST.rack = { x: (r.ix0 + 1.5) * TS, y: h.y }; TEST.rack2 = { x: (r.ix0 + 1.5) * TS, y: h.y + 22 }; // (the spare gambeson lies by the west wall, level with him, a chainmail just south of it)
  digTestPit(A, r); putOnGambeson(h); G.banner = null; G.bq.length = 0; rackGambeson(); rackMail(); TEST.label = ARMOUR_TESTS[0][0];
  G.card = { t: 0, life: 3.4, a: 'ARMOUR & DEATH ROOM', b: 'YOU WEAR A GAMBESON · A CHAINMAIL LIES BY THE WALL · THEY FIGHT FOR REAL · YOU CAN DIE', c: 'YOUR DEATH PLAYS OUT, THEN YOU GET UP AGAIN', d: 'HIT LANDS A BLOW · FOES SENDS THEM AWAY OR BACK · NEXT BRINGS ON OTHER FOES · DIE DIES THE NEXT DEATH · A PIT BY THE EAST WALL' };
  armourFoes(2.6); // (they come on once the card has gone)
}
// the foes go, and the current lot comes on fresh after a delay (unless NEXT has brought on another lot meanwhile)
function armourFoes(delay) {
  const gen = ++TEST.gen; for (const f of G.foes) if (!f.dead) { smoke(f.x, f.y, 3, 'dust', 8, 16, 0.6); f.dead = true; }
  if (TEST.calm) return; // (FOES off: nobody comes)
  G.sched.push({ t: delay, fn: () => { if (TEST.on && TEST.mode === 'armour' && TEST.gen === gen && !TEST.calm && G.phase === 'play') creatureSpawn(); } }); // (never while he is dying)
}
// FOES: they go and stay away, so he can try the deaths and the gambeson in peace; again, and they come back
function testFoes() {
  if (!TEST.on || TEST.mode !== 'armour') return; TEST.calm = !TEST.calm; TEST.waiting = false; const h = G.me;
  if (TEST.calm) { armourFoes(0); if (h) textPop(h.x, h.y, headZ(h) + 4, 'NO FOES', 'white', false); } else { armourFoes(0.4); if (h) textPop(h.x, h.y, headZ(h) + 4, 'FOES', 'white', false); }
  SFX.whoosh(0);
}
// HIT: a blow lands on him out of nowhere, from any side, as a foe's would (the gambeson takes it first), so the
// gambeson and its spill can be tried with no foes about; it never kills him (DIE is for that)
function testHit() {
  const h = G.me; if (!TEST.on || TEST.mode !== 'armour' || !h || h.dead || h.fall) return;
  const a = rand(TAU), d = randi(8, 16), src = { x: h.x - Math.cos(a) * 20, y: h.y - Math.sin(a) * 20, team: 'foe', def: {} };
  h.iframe = 0; h.blocking = false; if (!(h.gamb > 0) && !(h.mail > 0) && h.hp <= d * 1.2) h.hp = h.maxHp; // (no armour left and too little health: he is made whole first)
  hurt(h, d, src, { kx: Math.cos(a) * 110, ky: Math.sin(a) * 80, ang: a, style: pick(['arc', 'line', 'clot', 'bite']) }); shake(0.06);
}
// a pit two by two by the east wall, dug into the finished floor, to fall to his death in
function digTestPit(A, r) {
  const tx = r.ix1 - 2, ty = Math.round((r.iy0 + r.iy1) / 2) - 1, cells = [[tx, ty], [tx + 1, ty], [tx, ty + 1], [tx + 1, ty + 1]];
  for (const p of A.props) if (cells.some(([x, y]) => Math.abs(p.x - (x * TS + 8)) < 14 && Math.abs(p.cy - (y * TS + 8)) < 14)) { p.dead = true; p.solid = false; }
  A.pitSets = A.pitSets || []; A.crumbles = A.crumbles || []; A.crumbleSet = A.crumbleSet || new Set(); A.live = A.live || new Set(); A.plankSet = A.plankSet || new Set(); A.peb = A.peb || []; A.fallers = A.fallers || []; A.pitN = A.pitN || 0;
  for (const [x, y] of cells) { A.fl[y * A.w + x] = PIT; A.pitN++; } A.flv = (A.flv || 0) + 1; A.lights = A.slit = null;
  for (const k of groundChunks(A)) for (const [x, y] of cells) pitPaint(A, k.g, y * A.w + x);
  TEST.pit = { x: (tx + 1) * TS, y: (ty + 1) * TS }; if (A.clean) keepClean(A); // (CLEAN wipes back to the floor with the pit in it)
}
// DIE: he dies the next death on the list, at once (the fall: he is walked into the pit with nothing left to pay for it)
const TEST_DEATHS = ['bleed', 'fall', 'burst', 'acid', 'vermin', 'vermin3', 'behead', 'drag', 'raised', 'bats', 'carried', 'looted', 'ragdoll', 'ticks', 'hexed', 'buried'];
const testDeathName = k => k === 'vermin3' ? 'EATEN BY THREE RATS' : DEATH_NAMES[k]; // (vermin3: the fewest that can bury him)
function testDie() {
  const h = G.me; if (!TEST.on || TEST.mode !== 'armour' || !h) return;
  if (h.dead) { if (G.phase === 'dead') armourRevive(); return; } if (h.fall) return; // (pressed while a death plays: SKIP, the rest of it)
  const kind = TEST_DEATHS[TEST.di % TEST_DEATHS.length]; TEST.di++; TEST.gen++; TEST.waiting = false; /* (gen: a lot of foes on its way is called off) */ h.gamb = 0; h.mail = 0; h.iframe = 0; h.blocking = false; h.act = null;
  if (kind === 'fall') { h.hp = 1; h.x = TEST.pit.x; h.y = TEST.pit.y; return; }
  const near = (spr, type, n, r0, r1) => { const out = []; for (let i = 0; i < n; i++) { const p = spotNear(h, r0, r1), v = mkFoe(type, 1, p.x, p.y, spr); Object.assign(v, { aware: true, state: 'fight', tgt: h, ctest: TEST.gen }); v.def.gold = [0, 0]; G.foes.push(v); G.units.push(v); smoke(p.x, p.y, 2, 'dust', 6, 12, 0.5); out.push(v); } return out; }; // (brought on for the death: 49_deaths2)
  let more = {};
  if (kind === 'drag') near('CarcassFeeder', 'skitter', 2, 26, 40);
  if (kind === 'bats' || kind === 'carried') near('VampireBat', 'skitter', 3, 30, 50);
  if (kind === 'raised') { const [n] = near('AdeptNecromancer', 'archer', 1, 60, 80); more = { spell: 'soul', caster: n }; }
  let by = null;
  if (kind === 'looted') { near('GoblinFighter', 'grunt', 2, 24, 40); near('GoblinArcher', 'archer', 2, 30, 46); near('GoblinFanatic', 'flanker', 2, 30, 46); } // (they take only what he has on him: 49_deaths3)
  if (kind === 'ragdoll') { [by] = near('GoblinWolfRider', 'brute', 1, 12, 16); }
  if (kind === 'hexed') { [by] = near('GoblinOccultist', 'archer', 1, 50, 70); more = { spell: 'hex', caster: by }; }
  if (kind === 'ticks') { near('FamishedTick', 'skitter', 3, 24, 40); near('EngorgedTick', 'skitter', 1, 24, 40); }
  const f = by || G.foes.filter(q => !q.dead).sort((a, b) => dist(a.x, a.y, h.x, h.y) - dist(b.x, b.y, h.x, h.y))[0], src = f || { x: h.x + 20, y: h.y, team: 'foe', def: {} }, a = angTo(src.x, src.y, h.x, h.y);
  if (kind === 'vermin3') for (const [i, sp] of ['GiantRat', 'GiantRat', 'MonstrousRat'].entries()) { const b = i / 3 * TAU + rand(-0.4, 0.4), x = h.x + Math.cos(b) * 34, y = h.y + Math.sin(b) * 22, v = mkFoe('skitter', 1, x, y, sp); Object.assign(v, { aware: true, state: 'fight', tgt: h, ctest: TEST.gen }); v.def.gold = [0, 0]; G.foes.push(v); G.units.push(v); smoke(x, y, 2, 'dust', 6, 12, 0.5); } // (three rats and no more)
  if (kind === 'vermin') for (let i = 0; i < 7; i++) { const b = rand(TAU), x = h.x + Math.cos(b) * rand(26, 40), y = h.y + Math.sin(b) * rand(18, 28), v = mkFoe('skitter', 1, x, y, pick(['GiantRat', 'MonstrousRat', 'TaintedCockroach', 'DungBeetle', 'BloatedBedbug', 'FamishedTick', 'ForagingMaggot'])); Object.assign(v, { aware: true, state: 'fight', tgt: h, ctest: TEST.gen }); v.def.gold = [0, 0]; G.foes.push(v); G.units.push(v); smoke(x, y, 2, 'dust', 6, 12, 0.5); } // (a swarm brought on for it)
  TEST.forceDeath = kind === 'vermin3' ? 'vermin' : kind; hurt(h, Math.ceil((h.hp + 6) / 0.9), src, { kx: Math.cos(a) * 120, ky: Math.sin(a) * 90, ang: a, big: kind === 'burst', acid: kind === 'acid', buried: kind === 'buried', ...more }); TEST.forceDeath = null;
}
function rackMail() { G.drops.push({ k: 'chainmail', x: TEST.rack2.x, y: TEST.rack2.y, z: 0, vx: 0, vy: 0, vz: 0, t: 1, hold: 0 }); smoke(TEST.rack2.x, TEST.rack2.y, 2, 'dust', 6, 12, 0.6); }
function rackGambeson() { G.drops.push({ k: 'gambeson', x: TEST.rack.x, y: TEST.rack.y, z: 0, vx: 0, vy: 0, vz: 0, t: 1, hold: 0 }); smoke(TEST.rack.x, TEST.rack.y, 2, 'dust', 6, 12, 0.6); }
function armourTick(dt) {
  if (!G.drops.some(d => d.k === 'gambeson')) { if (!TEST.rackT) TEST.rackT = G.time + 2; else if (G.time > TEST.rackT) { TEST.rackT = 0; rackGambeson(); } }
  if (!G.drops.some(d => d.k === 'chainmail')) { if (!TEST.rack2T) TEST.rack2T = G.time + 2; else if (G.time > TEST.rack2T) { TEST.rack2T = 0; rackMail(); } } // (and the chainmail)
  if (G.phase === 'play' && !TEST.calm && !TEST.waiting && G.foes.length && G.foes.every(f => f.dead || f.ctest !== TEST.gen)) { TEST.waiting = true; const gen = TEST.gen; G.sched.push({ t: 2, fn: () => { TEST.waiting = false; if (TEST.mode === 'armour' && TEST.gen === gen && G.phase === 'play') creatureSpawn(); } }); }
}
// his death played out: he gets up again, whole, in a new gambeson, where he began; the foes come on fresh
function armourRevive() {
  const h = G.me; if (!h) return;
  if (h.sprWas) { h.spr = h.sprWas; h.sprWas = null; } removeIf(G.hz, z => z.deathPool); // (the skeleton and the acid that took him go)
  Object.assign(h, { dead: false, gone: false, dropped: false, deadT: 0, death: null, sway: 0, fall: null, hidden: false, headless: false, lampAt: null, pale: 0, vanishT: undefined, arrows: [], hp: h.maxHp, stam: h.maxStam, flasks: h.maxFlasks, x: TEST.home.x, y: TEST.home.y, vx: 0, vy: 0, kx: 0, ky: 0, z: 0, act: null, blocking: false, iframe: 1.2, curseT: 0, acidT: 0, gore: 0 });
  G.phase = 'play'; G.phaseT = 0; G.fade = 0; G.banner = null; G.bq.length = 0; G.summary = null; G.hurtFlash = 0;
  putOnGambeson(h); G.banner = null; G.bq.length = 0; textPop(h.x, h.y, headZ(h) + 6, 'AGAIN', 'white', true); SFX.whoosh(0); armourFoes(1.2);
}

// The death picker: the death's name under the buttons opens a list of them all, three across, the next one lit; one
// tapped is died at once (and DIE goes on down the list from there); a tap anywhere else closes it. Picked while a death
// plays, that one is cut short first.
const DEATH_PICK = { open: false };
function pickLabelY() { const L = btnLayout(); return L.next ? L.next.y + L.next.r + 30 : 0; }
function pickHit(x, y) { if (!TEST.on || TEST.mode !== 'armour') return false; const ly = pickLabelY(); return Math.abs(x - VIEW.w / 2) < 170 && y > ly - 20 && y < ly + 10; }
function pickLayout() {
  const n = TEST_DEATHS.length, cols = 3, rows = Math.ceil(n / cols), cw = Math.min(210, (VIEW.w - 60) / cols), ch = Math.min(36, (VIEW.h - 110) / rows);
  return { cols, rows, cw, ch, x0: VIEW.w / 2 - cw * cols / 2, y0: VIEW.h / 2 - ch * rows / 2 + 12 };
}
function pickTap(x, y) {
  const P = pickLayout(), c = Math.floor((x - P.x0) / P.cw), r = Math.floor((y - P.y0) / P.ch), i = r * P.cols + c; DEATH_PICK.open = false;
  if (x < P.x0 || y < P.y0 || c >= P.cols || r >= P.rows || i >= TEST_DEATHS.length) return;
  if (G.me && G.me.dead && G.phase === 'dead') armourRevive(); TEST.di = i; testDie();
}
function drawPicker(c) {
  const P = pickLayout(), n = TEST_DEATHS.length, next = TEST.di % n;
  c.globalAlpha = 0.72; c.fillStyle = '#0a080c'; c.fillRect(0, 0, VIEW.w, VIEW.h); c.globalAlpha = 1;
  font(c, 600, 14, F_HUD); spaced(c, 'PICK A DEATH', VIEW.w / 2, P.y0 - 14, 3, '#e8907a', 'center');
  for (let i = 0; i < n; i++) {
    const x = P.x0 + (i % P.cols) * P.cw, y = P.y0 + Math.floor(i / P.cols) * P.ch, on = i === next;
    c.fillStyle = on ? 'rgba(90,40,30,0.85)' : 'rgba(30,24,28,0.85)'; c.fillRect(x + 3, y + 3, P.cw - 6, P.ch - 6);
    c.strokeStyle = on ? '#e8907a' : 'rgba(232,144,122,0.35)'; c.lineWidth = 1; c.strokeRect(x + 3.5, y + 3.5, P.cw - 7, P.ch - 7);
    font(c, 600, 12, F_HUD); label(c, testDeathName(TEST_DEATHS[i]), x + P.cw / 2, y + P.ch / 2 + 4, on ? '#ffe0d0' : '#f0e0c0', { align: 'center', max: P.cw - 16 });
  }
}
