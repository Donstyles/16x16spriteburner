// ===================== foes: four ways of fighting, and they fight together =====================
// RUSHERS (grunts, skitterers) run straight in and swarm. TANKS (brutes) throw the hero back with a wide shove, every third
// blow a slam; while archers are with them they stand between the hero and the archers and let them do the work. ARCHERS
// keep their distance; with a tank near they spread out in a loose line behind it and loose only along a clear line.
// FLANKERS circle wide round the hero to his back, dart in, stab and get out; if he turns to face them they peel off.
// Senses: a sleeper only hears (a creeping hero wakes it only by bumping into it, a walking one at 32 px, a rolling or
// fighting one at 64). An awake foe sees ahead of it at its full sight range, behind it a third as far, and hears all round
// (walking 48 px, fighting 96). A woken foe cries out and wakes the others in its room who can see it. A foe that loses
// the hero searches where it last saw him; out of sight and far off for long enough, it gives up and goes home.
const FOE_TYPES = {
  grunt: { role: 'rush', hp: 46, poise: 55, spd: 44, dmg: 13, r: 5, sight: 115, cd: [0.45, 1.2], gold: [1, 3], cost: 2,
    atk: { k: 'arc', wind: 0.5, act: 0.1, rec: 0.6, reach: 17, arc: 1.8, lunge: 95, push: 90, poise: 22 } },
  skitter: { role: 'rush', hp: 14, poise: 12, spd: 70, dmg: 6, r: 3.5, sight: 95, cd: [0.3, 0.8], gold: [0, 1], cost: 0.6, sleepy: 0.1,
    atk: { k: 'line', wind: 0.28, act: 0.12, rec: 0.55, reach: 13, w: 8, lunge: 200, push: 40, poise: 6 } },
  brute: { role: 'tank', hp: 170, poise: 200, spd: 26, dmg: 30, r: 6, scale: 1.3, armor: 0.2, sight: 100, cd: [0.9, 1.6], gold: [5, 9], cost: 5,
    atk: { k: 'arc', wind: 0.5, act: 0.12, rec: 0.6, reach: 21, arc: 2.5, lunge: 70, push: 420, poise: 45, dm: 0.4, armored: true, shove: true },
    slam: { k: 'circle', wind: 0.9, act: 0.1, rec: 1.05, reach: 30, at: 12, push: 230, poise: 70, slam: true, armored: true } },
  archer: { role: 'archer', hp: 34, poise: 30, spd: 32, dmg: 11, r: 5, sight: 165, cd: [1.0, 1.8], gold: [2, 4], cost: 2, keep: [62, 130],
    shot: { aim: 0.8, spd: 200, rec: 0.6 } },
  flanker: { role: 'flank', hp: 30, poise: 22, spd: 62, dmg: 16, r: 4.5, sight: 130, cd: [0.5, 1], gold: [2, 4], cost: 2.5,
    atk: { k: 'line', wind: 0.3, act: 0.1, rec: 0.35, reach: 14, w: 8, lunge: 180, push: 60, poise: 20 } },
};
// The armies. Each floor is held by one army of its depth, every role from one faction; an army that lacks a role fields
// more of its others (the vermin have no archers, the bone legion no brutes). The rusher is the 'grunt' type.
const ARMIES = {
  goblins: { name: 'THE GOBLIN WARBAND', grunt: ['GoblinFighter'], brute: ['GoblinWolfRider'], archer: ['GoblinArcher', 'GoblinOccultist'], skitter: ['VoraciousMouse'], flanker: ['GoblinFanatic'] },
  vermin: { name: 'THE CELLAR VERMIN', grunt: ['BloatedBedbug', 'TaintedCockroach'], brute: ['MawingBeaver'], archer: [], skitter: ['EngorgedTick', 'FamishedTick'], flanker: ['TunnelingMole'] },
  bones: { name: 'THE BONE LEGION', grunt: ['DecrepitBones', 'GraveRevenant'], brute: ['GrapplerMummy'], archer: ['BrittleArcher', 'AdeptNecromancer'], skitter: ['VampireBat'], flanker: ['UnravelingCrawler', 'SkeweringStalker'] },
  rot: { name: 'THE ROT', grunt: ['MutilatedStumbler', 'SandGhoul'], brute: ['FleshGolem', 'BoundCadaver'], archer: ['VileWitch', 'RottingArcher'], skitter: ['ForagingMaggot', 'CarcassFeeder'], flanker: ['DismemberedCrawler'] },
  lizardfolk: { name: 'THE LIZARDFOLK TRIBE', grunt: ['LizardfolkSpearman', 'MudWyvern'], brute: ['BestialLizardfolk'], archer: ['LizardfolkArcher', 'LizardfolkScout'], skitter: ['PygmyWyvern'], flanker: ['LizardfolkGladiator'] },
  merfolk: { name: 'THE MERFOLK RAIDERS', grunt: ['MerfolkJavelineer', 'MerfolkScout'], brute: ['WaterElemental'], archer: ['MerfolkAquamancer'], skitter: [], flanker: ['MerfolkImpaler'] },
  elves: { name: 'THE ELVEN HOST', grunt: ['ElfBladedancer', 'ElfWayfarer'], brute: ['GrizzledTreant'], archer: ['ElfSharpshooter', 'ElfEnchanter'], skitter: ['FlutteringPixie'], flanker: ['SneakySatyr'] },
  demons: { name: 'THE DEMON HORDE', grunt: ['FledglingDemon', 'PointedDemonspawn'], brute: ['BloodDrinker'], archer: ['CrimsonImp'], skitter: ['RascallyDemonling', 'NefariousScamp'], flanker: ['GrinningGremlin'] },
  ants: { name: 'THE ANT COLONY', grunt: ['SoldierAnt', 'LavaAnt'], brute: ['RhinoBeetle'], archer: ['AcidAnt'], skitter: ['DungBeetle'], flanker: [] },
};
const ZONES = [
  { to: 3, name: 'THE CELLARS', armies: ['goblins', 'vermin', 'ants'] },
  { to: 6, name: 'THE CRYPT', armies: ['bones', 'rot'] },
  { to: 99, name: 'THE DEEP', armies: ['lizardfolk', 'merfolk', 'elves', 'demons'] },
];
// Kept for later, on no floor yet (the army board's reserve): the king's soldiers, the wanderers (the minotaur and the
// toxic hound), the gnolls, the gnomes, the ratkin, the kobolds and the orcs. The creature test room shows them all. The
// scarecrow and the golems guard the treasure rooms (the scarecrow in the cellars, a golem deeper down).
const RESERVE = {
  soldiers: { name: 'THE KING’S SOLDIERS', grunt: ['DeterminedSoldier'], brute: ['Cavalry'], archer: ['Bowman', 'SkilledBattlemage'], skitter: [], flanker: ['SilentRanger'] },
  wanderers: { name: 'WANDERERS', grunt: [], brute: ['BestialMinotaur'], archer: [], skitter: ['ToxicHound'], flanker: [] },
  gnolls: { name: 'THE CACKLING PACK', grunt: ['GnollGrunt', 'GnollPikeman'], brute: ['GnollWarlord', 'GnollBrute'], archer: [], skitter: [], flanker: ['GnollRipper'] },
  gnomes: { name: 'THE TINKERS’ GUILD', grunt: ['GnomeWanderer'], brute: ['MithrilConstruct'], archer: ['GnomeTinkerer', 'GnomeMage', 'GnomeAlchemist', 'Pyro'], skitter: [], flanker: [] },
  ratkin: { name: 'THE PLAGUE NEST', grunt: ['MonstrousRat'], brute: ['RatkinMutant'], archer: ['RatkinCrossbowman', 'RatkinPlaguespreader', 'RatkinPoisoner'], skitter: ['VoraciousMouse', 'GiantRat'], flanker: ['RatkinStabber'] },
  kobolds: { name: 'THE KOBOLD WARREN', grunt: ['KoboldDigger', 'KoboldTrapper'], brute: [], archer: ['KoboldRockthrower', 'KoboldTrickster'], skitter: [], flanker: ['KoboldScavenger'] },
  orcs: { name: 'THE SKULLSPLITTER CLAN', grunt: ['OrcReaver', 'OrcSavage'], brute: ['Brakgul'], archer: ['OrcWarlock'], skitter: ['OrcShaman'], flanker: ['OrcCaptain'] },
};
const GUARDS = [['ScarecrowGolem'], ['StoneGolem', 'ClayGolem'], ['StoneGolem', 'ClayGolem']]; // by depth
// the army holding a floor: one of its depth's, not the one that held the floor above if there is another
function pickArmy(f) { const L = zoneAt(f).armies, prev = G.army && L.length > 1 ? L.filter(a => a !== G.army) : L; return (G.army = pick(prev)); }
const BLOOD_OF = { AcidAnt: 'bug', AdeptNecromancer: 'sludge', BoundCadaver: 'sludge', BrittleArcher: 'bone', CarcassFeeder: 'sludge', ClayGolem: 'stone', DecrepitBones: 'bone', DismemberedCrawler: 'sludge', DungBeetle: 'bug', FamishedTick: 'bug', FleshGolem: 'sludge', FlutteringPixie: 'dust', ForagingMaggot: 'bug', GrapplerMummy: 'bone', GraveRevenant: 'bone', GrizzledTreant: 'wood', LavaAnt: 'bug', MithrilConstruct: 'stone', MutilatedStumbler: 'sludge', RhinoBeetle: 'bug', RottingArcher: 'sludge', SandGhoul: 'sludge', ScarecrowGolem: 'straw', SkitteringHand: 'bone', SoldierAnt: 'bug', StoneGolem: 'stone', TaintedCockroach: 'bug', UnravelingCrawler: 'bone', WaterElemental: 'water' };
const STONE_SHOT = { HalflingSlinger: true, KoboldRockthrower: true };
// Bats fly: they hover over their shadow, rising and sinking gently with their wingbeats and drifting in slow loops; they
// turn in wide arcs, not on the spot (see steer); winding up to strike they climb a little, then dive at their target
// and climb back; asleep they rest on the floor, and woken they take off. Killed, they fall out of the air.
const FLYERS = new Set(['SwoopingBat', 'PlagueBat', 'VampireBat', 'FlutteringPixie']);
function makeFlyer(u) { if (!FLYERS.has(u.spr)) { u.fly = null; return; } u.fly = { alt: rand(10, 14), ph: rand(TAU), t: 0 }; u.z = u.state === 'sleep' ? 0 : u.fly.alt; }
function flyTick(u, dt) {
  const F = u.fly, a = u.act, asleep = u.state === 'sleep' && !u.aware; F.t += dt;
  let alt = asleep ? 0 : F.alt + Math.sin(F.t * 4.5 + F.ph) * 1.2, k = 4;
  if (a && a.k === 'atk' && !asleep) { if (a.phase === 'wind') alt += 4; else if (a.phase === 'act') { alt = 3; k = 18; } }
  if (u.stun > 0) alt *= 0.6; // knocked about
  u.z = damp(u.z, alt, k, dt); u.vz = 0;
  if (!asleep && !(a && a.phase === 'act')) { // the drift: two slow swells each way, so it wanders in loose loops (pushed in through the knock-back, which follows it smoothly)
    const t = F.t, dx = (Math.sin(t * 1.3 + F.ph) * 0.6 + Math.sin(t * 2.1 + F.ph * 2) * 0.4) * 14, dy = (Math.sin(t * 1.1 + F.ph * 3) * 0.6 + Math.sin(t * 1.7 + F.ph) * 0.4) * 10;
    u.kx += dx * 7 * dt; u.ky += dy * 7 * dt;
  }
}
// creatures that already go on all fours (bugs, beasts, crawlers, a bat, a hand): asleep they stay on their feet and settle,
// where the upright ones lie down on their backs
const FLAT_SLEEPERS = new Set(['BloatedBedbug', 'EngorgedTick', 'TunnelingMole', 'CarcassFeeder', 'DismemberedCrawler', 'DungBeetle', 'SoldierAnt', 'PygmyWyvern', 'MudWyvern', 'WaterElemental', 'GrizzledTreant', 'GoblinWolfRider', 'FlutteringPixie', 'InfectedMouse', 'TaintedCockroach', 'FamishedTick', 'SkitteringHand', 'SwoopingBat', 'ForagingMaggot', 'AcidAnt', 'LavaAnt', 'RhinoBeetle', 'MawingBeaver', 'ToxicHound', 'UnravelingCrawler', 'VoraciousMouse', 'GiantRat', 'MonstrousRat']);
const zoneAt = f => ZONES.find(z => f <= z.to) || ZONES[ZONES.length - 1];
function floorName(f) { const z = zoneAt(f), first = ZONES.indexOf(z) ? ZONES[ZONES.indexOf(z) - 1].to + 1 : 1; return z.name + ' · ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][Math.min(5, f - first)]; }
function troops(type, army) { const L = army && ARMIES[army] && ARMIES[army][type]; if (L && L.length) return L; return Object.values(ARMIES).flatMap(a => a[type]); }
function mkFoe(type, f, x, y, spr) {
  const T = FOE_TYPES[type], mul = 1 + 0.18 * (f - 1); spr = spr || pick(troops(type, ARENA && ARENA.army));
  const u = mkActor('foe', { ...T, spr, blood: BLOOD_OF[spr] || 'red', name: type }, x, y, mul);
  Object.assign(u, { type, dmgMul: 1 + 0.12 * (f - 1), aware: false, state: 'idle', home: { x, y }, cdT: rand(0.4, 1), tgt: null, wanderT: rand(1, 4), face: chance(0.5) ? 1 : -1, jit: rand(-1, 1), jit2: rand(-1, 1), lostT: 0 });
  u.dir = u.face < 0 ? Math.PI : 0; makeFlyer(u); return u;
}
// a room's foes: groups bought from a budget that grows with depth and the size of the room
const GROUPS = [
  { g: ['grunt', 'grunt'] }, { g: ['grunt', 'grunt', 'grunt'] }, { g: ['skitter', 'skitter', 'skitter', 'skitter'] }, { g: ['skitter', 'skitter', 'skitter', 'grunt'] },
  { g: ['grunt', 'archer'] }, { g: ['grunt', 'grunt', 'archer'] }, { g: ['brute'] }, { g: ['brute', 'archer', 'archer'] }, { g: ['brute', 'archer', 'grunt'] },
  { g: ['flanker', 'grunt', 'grunt'] }, { g: ['flanker', 'skitter', 'skitter', 'skitter'] },
  { g: ['flanker', 'flanker', 'grunt', 'grunt'], min: 3 }, { g: ['brute', 'archer', 'archer', 'flanker'], min: 3 },
  { g: ['brute', 'archer', 'archer', 'archer'], min: 2 }, { g: ['brute', 'brute', 'archer', 'archer', 'archer', 'archer'], min: 3 }, { g: ['brute', 'brute', 'archer', 'archer', 'archer', 'archer', 'archer', 'archer'], min: 5 },
];
function populateRoom(A, r, f) {
  const area = r.w * r.h; let budget = (3.5 + f * 1.4) * clamp(area / 150, 0.6, 1.4) * (r.kind === 'end' ? 1.6 : 1);
  const out = [], spots = [], cost = g => g.reduce((a, t) => a + FOE_TYPES[t].cost, 0);
  const ok = (x, y) => !blockAt(x, y) && !(A.crumbleSet && A.crumbleSet.has(Math.floor(y / TS) * A.w + Math.floor(x / TS))) && !A.props.some(p => !p.dead && dist(p.x, p.cy, x, y) < p.r + 8) && !r.doors.some(d => d.cells.some(([cx, cy]) => dist(cx * TS + 8, cy * TS + 8, x, y) < 40)) && !spots.some(s => dist(s.x, s.y, x, y) < 12);
  let guard = 0; while (budget > 1.5 && guard++ < 30) {
    const has = t => !A.army || ARMIES[A.army][t].length; // only groups the army can field
    // an army with the mutilated stumblers often sends them as a horde: four to six of them, awake and milling about
    let G0 = null; const n = budget >= 13 ? 6 : budget >= 9 ? 5 : 4;
    if (A.army && ARMIES[A.army].grunt.includes('MutilatedStumbler') && chance(0.45) && cost(Array(n).fill('grunt')) <= budget + 1) G0 = { g: Array(n).fill('grunt'), spr: 'MutilatedStumbler', horde: true };
    if (!G0) G0 = pick(GROUPS.filter(G1 => (G1.min || 1) <= f && cost(G1.g) <= budget + 1 && G1.g.every(has) && (f > 1 || !G1.g.includes('brute') || chance(0.3))));
    if (!G0) break; const g = G0.g, wide = G0.horde ? 1.5 : 1; budget -= cost(g);
    const ax = rand(r.ix0 + 2, r.ix1 - 1) * TS, ay = rand(r.iy0 + 1.5, r.iy1) * TS, sleepy = !G0.horde && chance(0.45);
    for (const t of g) { let x, y, k = 0; do { x = ax + rand(-24, 24) * wide; y = ay + rand(-16, 16) * wide; } while (!ok(x, y) && k++ < 20); if (k > 20) continue; spots.push({ x, y }); const u = mkFoe(t, f, x, y, G0.spr); if (sleepy && chance(1 - (FOE_TYPES[t].sleepy || 0)) && GAIT[u.spr] !== 'shuffle') u.state = 'sleep'; u.room = r.i; out.push(u); }
  }
  return out;
}
// a treasure room's guardian: it stands by the chest, awake, and keeps to the room
function chestGuards(A, f) {
  const out = [], d = ZONES.indexOf(zoneAt(f));
  for (const r of A.rooms) {
    if (!(r.kind === 'treasure' || r.chest)) continue; const ch = A.props.find(p => p.kind === 'tchest' && p.room === r.i); if (!ch) continue;
    let x = ch.x, y = ch.y + 22; if (blockAt(x, y)) y = ch.y + 12;
    const u = mkFoe('brute', f, x, y, pick(GUARDS[Math.min(d, GUARDS.length - 1)])); u.room = r.i; u.guard = true; u.face = chance(0.5) ? 1 : -1; out.push(u);
  }
  return out;
}
// ---------- senses ----------
function wakeFoe(f, h, why) {
  if (f.aware || f.dead) return; const slept = f.state === 'sleep'; f.aware = true; f.state = 'hunt'; if (slept) removeIf(FX.nums, n => n.who === f && n.txt === 'z'); f.tgt = h; f.cdT = Math.max(f.cdT, rand(0.35, 0.7)); f.lostT = 0; f.fl = null;
  if (h) { faceTo(f, angTo(f.x, f.y, h.x, h.y)); f.lastX = h.x; f.lastY = h.y; }
  markPop(f, '!', 'red'); if (why !== 'alarm' || slept) f.vz = 60; // startled: it springs up (a sleeper off the floor)
  for (const o of G.foes) { if (o === f || o.aware || o.dead) continue; const d = dist(o.x, o.y, f.x, f.y); if ((o.room === f.room ? d < 130 : d < 60) && lineOfSight(o.x, o.y - 4, f.x, f.y - 4)) { o.alarmT = rand(0.25, 0.7); o.alarmBy = h; } }
}
function alertFoe(f, src) { if (!f.aware) wakeFoe(f, src && src.team === 'hero' ? src : nearest(f, G.heroes), 'hit'); else if (src && src.team === 'hero') { if (chance(0.5)) f.tgt = src; f.lostT = 0; f.lastX = src.x; f.lastY = src.y; } }
// a loud blow wakes sleepers close by
function noise(x, y, r) { for (const f of G.foes) if (!f.aware && !f.dead && dist(f.x, f.y, x, y) < r && lineOfSight(f.x, f.y - 4, x, y - 4)) wakeFoe(f, nearest(f, G.heroes), 'noise'); }
function senses(f, dt) {
  if (f.alarmT > 0 && (f.alarmT -= dt) <= 0) { wakeFoe(f, f.alarmBy || nearest(f, G.heroes), 'alarm'); return; }
  for (const h of G.heroes) {
    if (h.dead) continue; const d = dist(f.x, f.y, h.x, h.y), loud = h.noise || 0; let R;
    if (f.state === 'sleep') R = [f.r + h.r + 3, 32, 64][loud]; // a sleeper only hears
    else { const ahead = Math.abs(angDiff(f.dir, angTo(f.x, f.y, h.x, h.y))) < 1.1; R = Math.max(f.def.sight * (ahead ? 1 : 0.33), [16, 48, 96][loud]); } // eyes ahead, ears all round
    if (d < R && lineOfSight(f.x, f.y - 4, h.x, h.y - 4)) { wakeFoe(f, h, 'sight'); return; }
  }
}
// ---------- the mind of a foe ----------
// ---------- squads ----------
// Tanks shield archers. Each tank takes up to three of the archers fighting the same hero, shared out evenly and kept from
// frame to frame. Each squad holds a bearing round the hero: the first where its tank stands, the second a quarter turn
// from it (whichever side is nearer), a third the other side, a fourth opposite. The tank stands on that bearing between
// the hero and its archers; the archers keep their distance on it in a loose line and take turns to shoot.
const AI = { archers: [], tanks: [] }, SQUAD = { tank: 42, archer: 100, gap: 22, cover: 3, volley: 0.6 };
function aiPrep(dt) {
  AI.archers = G.foes.filter(o => o.aware && !o.dead && o.def.role === 'archer'); AI.tanks = G.foes.filter(o => o.aware && !o.dead && o.def.role === 'tank');
  for (const o of AI.archers) { o.sq = null; o.duo = null; } for (const o of AI.tanks) o.sq = null;
  for (const t of G.heroes) {
    if (t.dead) continue; const tanks = AI.tanks.filter(o => o.tgt === t).sort((a, b) => a.id - b.id); if (!tanks.length) { pairUp(t, dt); continue; }
    const archers = AI.archers.filter(o => o.tgt === t).sort((a, b) => a.id - b.id), cap = Math.min(SQUAD.cover, Math.ceil(archers.length / tanks.length));
    const groups = tanks.map(k => ({ tank: k, archers: [] })), placed = new Set();
    for (const a of archers) { const g = groups.find(q => q.tank === a.squadTank); if (g && g.archers.length < cap) { g.archers.push(a); placed.add(a); } }
    for (const a of archers) { if (placed.has(a)) continue; const free = groups.filter(q => q.archers.length < cap); if (!free.length) break;
      const g = free.reduce((b, q) => q.archers.length < b.archers.length || (q.archers.length === b.archers.length && dist(a.x, a.y, q.tank.x, q.tank.y) < dist(a.x, a.y, b.tank.x, b.tank.y)) ? q : b); g.archers.push(a); placed.add(a); }
    let side = 1;
    groups.forEach((g, n) => {
      const k = g.tank, here = angTo(t.x, t.y, k.x, k.y); let want = here;
      if (n > 0) { const base = groups[0].tank.bear; if (n === 1) { const a = base + Math.PI / 2, b = base - Math.PI / 2; side = Math.abs(angDiff(here, a)) < Math.abs(angDiff(here, b)) ? 1 : -1; want = base + side * Math.PI / 2; } else want = n === 2 ? base - side * Math.PI / 2 : base + Math.PI; }
      k.bear = k.bear === undefined ? want : angLerp(k.bear, want, Math.min(1, dt * (n ? 2 : 0.8))); // the first squad drifts with its tank; the others swing round to their places
      k.sq = { bear: k.bear, archers: g.archers };
      g.archers.forEach((a, i) => { a.squadTank = k; a.sq = { tank: k, i, n: g.archers.length, bear: k.bear }; });
    });
    pairUp(t, dt);
  }
}
// Archers and casters with no tank to screen them work as a pair: they hold bearings a quarter turn apart round the hero,
// so he cannot face them both at once, and the pair swings round slowly as one to follow where they stand. A third or a
// fourth takes the next quarter round; any more fight on their own.
function pairUp(t, dt) {
  const L = AI.archers.filter(o => o.tgt === t && !o.sq).sort((a, b) => a.id - b.id).slice(0, 4);
  if (L.length < 2) { t.duoBear = undefined; return; }
  const ang = L.map(o => angTo(t.x, t.y, o.x, o.y)), mean = Math.atan2(ang.reduce((s, a) => s + Math.sin(a), 0), ang.reduce((s, a) => s + Math.cos(a), 0));
  t.duoBear = t.duoBear === undefined ? mean : angLerp(t.duoBear, mean, Math.min(1, dt * 0.8));
  L.map((o, i) => ({ o, off: angDiff(t.duoBear, ang[i]) })).sort((a, b) => a.off - b.off).forEach((e, i) => { e.o.duo = { bear: t.duoBear + (i - (L.length - 1) / 2) * Math.PI / 2 }; });
}
// where a squad member stands: on the squad's bearing at its distance from the hero, the archers spread across it
function squadSpot(t, bear, R, lat, from) { const ux = Math.cos(bear), uy = Math.sin(bear); let x = t.x + ux * R - uy * lat, y = t.y + uy * R * 0.85 + ux * lat; if (solidAt(x, y) || !boxFree(x, y, 5)) [x, y] = clipToWalls(from.x, from.y, x, y, 5); return [x, y]; }
// the hero has fallen: those near him lower their weapons, back away a few steps still facing him, and stand watching
// him die; those further off just stop and look
function watchDeath(f, h, dt) {
  const d = dist(f.x, f.y, h.x, h.y); if (f.watchR === undefined) f.watchR = rand(30, 46) * (f.scale || 1);
  f.act = null; faceTo(f, angTo(f.x, f.y, h.x, h.y));
  if (d < f.watchR) { const a = angTo(h.x, h.y, f.x, f.y), v = f.def.spd * 0.4; f.vx = damp(f.vx, Math.cos(a) * v, 6, dt); f.vy = damp(f.vy, Math.sin(a) * v * 0.85, 6, dt); f.moving = true; }
  else { f.vx = damp(f.vx, 0, 6, dt); f.vy = damp(f.vy, 0, 6, dt); f.moving = false; }
}
function foeTick(f, dt) { // (a raised skeleton below the floor climbs out of it: z rises to 0)
  if (f.dead) return; if (f.dying) { throesTick(f, dt); return; } if (f.dormant) { dormantTick(f, dt); return; } if (f.z < 0 && !f.fly) f.z = Math.min(0, f.z + 22 * dt); if (f.poiseT > 0) f.poiseT -= dt; else f.poise = f.maxPoise; if (f.poiseGuard > 0) f.poiseGuard -= dt;
  if (f.stun > 0) { f.stun -= dt; f.vx = damp(f.vx, 0, 8, dt); f.vy = damp(f.vy, 0, 8, dt); f.moving = false; return; }
  if (f.dummy) { dummyTick(f, dt); return; } // the test room's foes only stand there
  if (!f.aware) { senses(f, dt); if (f.aware) return; idleFoe(f, dt); return; }
  if (f.cdT > 0) f.cdT -= dt;
  if (!f.tgt || f.tgt.dead || (chance(dt * 0.5))) { const n = nearest(f, G.heroes.filter(alive)); if (n) f.tgt = n; }
  const t = f.tgt; if (t && t.dead && t.team === 'hero') { watchDeath(f, t, dt); return; }
  if (!t || t.dead) { f.vx = damp(f.vx, 0, 6, dt); f.vy = damp(f.vy, 0, 6, dt); f.moving = false; return; }
  if (f.act) { foeAct(f, t, dt); return; }
  const d = dist(f.x, f.y, t.x, t.y), sees = lineOfSight(f.x, f.y - 4, t.x, t.y - 4);
  if (sees) { f.lastX = t.x; f.lastY = t.y; f.lostT = 0; } else f.lostT += dt;
  if (f.lostT > 7 && d > 140) { f.aware = false; f.state = 'idle'; f.tgt = null; f.fl = null; markPop(f, '?', 'white'); return; } // lost him: back home
  const role = f.def.role;
  if (role === 'archer') archerMind(f, t, dt, d, sees); else if (role === 'tank') tankMind(f, t, dt, d, sees); else if (role === 'flank') flankMind(f, t, dt, d, sees); else rushMind(f, t, dt, d, sees);
}
// after the hero: straight at him while he is seen (or close enough to be heard), else to where he was last seen
function chase(f, t, spd, dt, stopAt) { if (f.lostT < 0.6 || dist(f.x, f.y, t.x, t.y) < 90) return pathTo(f, t.x, t.y, spd, dt, stopAt); return pathTo(f, f.lastX === undefined ? t.x : f.lastX, f.lastY === undefined ? t.y : f.lastY, spd * 0.8, dt, 4); }
function startFoeAtk(f, mv, t) { f.act = { k: 'atk', mv, t: 0, phase: 'wind', dir: angTo(f.x, f.y, t.x, t.y), hit: new Set() }; f.vx = f.vy = 0; f.moving = false; if (mv.wind >= 0.8) SFX.charge && SFX.charge(); }
function holdStill(f, dt) { f.vx = damp(f.vx, 0, 10, dt); f.vy = damp(f.vy, 0, 10, dt); f.moving = false; }
function rushMind(f, t, dt, d, sees) {
  const A = f.def.atk, reach = A.reach + (A.at || 0) + t.r;
  if (d > reach * 0.9 || !sees) { chase(f, t, f.def.spd, dt, reach * 0.6); faceTo(f, angTo(f.x, f.y, t.x, t.y)); }
  else if (f.cdT <= 0) startFoeAtk(f, A, t);
  else { strafe(f, t, f.def.spd * 0.5, dt); faceTo(f, angTo(f.x, f.y, t.x, t.y)); }
}
// a tank shoves, and every third blow slams; with a squad of archers it holds its bearing between them and the hero
function tankMind(f, t, dt, d, sees) {
  const T = f.def, mv = (f.blows || 0) % 3 === 2 ? T.slam : T.atk, reach = mv.reach + (mv.at || 0) + t.r;
  faceTo(f, angTo(f.x, f.y, t.x, t.y));
  if (sees && d < reach * 0.9 && f.cdT <= 0) { f.blows = (f.blows || 0) + 1; startFoeAtk(f, mv, t); return; }
  if (f.sq && f.sq.archers.length) {
    // it stands its ground: it takes its place between the hero and its archers, but gives no ground to him as he comes on
    // (it only steps across to stay in his way, and forward); close, it plants itself in his path to them and shoves
    let [gx, gy] = squadSpot(t, f.sq.bear, SQUAD.tank, 0, t);
    const ar = f.sq.archers.filter(u => !u.dead); if (ar.length && d < SQUAD.tank + 22) {
      const ax = ar.reduce((s, u) => s + u.x, 0) / ar.length, ay = ar.reduce((s, u) => s + u.y, 0) / ar.length, L = Math.hypot(ax - t.x, ay - t.y) || 1, r = clamp(d, 14, 26);
      gx = t.x + (ax - t.x) / L * r; gy = t.y + (ay - t.y) / L * r * 0.85; // on his line to the archers, as close as it is now
    }
    if (dist(gx, gy, t.x, t.y) > d + 2) { const a = angTo(t.x, t.y, gx, gy); gx = t.x + Math.cos(a) * d; gy = t.y + Math.sin(a) * d * 0.85; } // never back away from him
    if (dist(f.x, f.y, gx, gy) > 4) pathTo(f, gx, gy, T.spd * 1.15, dt, 2); else holdStill(f, dt);
    return;
  }
  if (d > reach * 0.9 || !sees) chase(f, t, T.spd, dt, reach * 0.6); else strafe(f, t, T.spd * 0.5, dt);
}
// an archer: with a squad, at its distance on the squad's bearing behind the tank, spread across it; to get to the other
// side of the hero it goes round him, never through his reach. With no tank but another archer, on its quarter of the
// pair (see pairUp), going round him the same way. Alone, at a distance. Too close, it backs off. It shoots
// whenever it has a clear line and it is its squad's turn (one archer of a squad aims at a time, so the arrows come in a
// stream), the others keep moving to their places meanwhile.
function archerMind(f, t, dt, d, sees) {
  if (f.turret && f.turret.drain !== 2) { turretMind(f, t, dt, d, sees); return; } // on an island (37_levels)
  const T = f.def, spd = T.spd, q = f.sq, me = angTo(t.x, t.y, f.x, f.y); let gx = null, gy = null, round = 0;
  if (q) { const lat = (q.i - (q.n - 1) / 2) * SQUAD.gap + f.jit2 * 6 + Math.sin(G.time * 0.6 + f.id) * 3 + (f.shift || 0); [gx, gy] = squadSpot(t, q.bear, SQUAD.archer + f.jit * 8, lat, q.tank); const off = angDiff(me, q.bear); if (Math.abs(off) > 0.7) round = Math.sign(off); }
  else if (f.duo) { [gx, gy] = squadSpot(t, f.duo.bear, (T.keep[0] + T.keep[1]) / 2 + f.jit * 8, Math.sin(G.time * 0.6 + f.id) * 3 + (f.shift || 0), t); const off = angDiff(me, f.duo.bear); if (Math.abs(off) > 0.7) round = Math.sign(off); } // its quarter of the pair
  faceTo(f, angTo(f.x, f.y, t.x, t.y));
  if (castOf(f) && castMind(f, t, dt, d, sees)) return; // raising the dead, tending her own
  const turn = !q || G.time >= (q.tank.volleyT || 0);
  if (f.cdT <= 0 && sees && d >= T.keep[0] * 0.8 && d < T.keep[1] + 40 && turn) {
    if (clearShot(f, t)) { f.act = { k: 'aim', t: 0, dur: T.shot.aim, dir: angTo(f.x, f.y, t.x, t.y) }; if (q) q.tank.volleyT = G.time + SQUAD.volley + T.shot.aim * 0.5; holdStill(f, dt); return; }
    f.shift = clamp((f.shift || 0) + (f.id % 2 ? 16 : -16), -44, 44); if (Math.abs(f.shift) >= 44) f.shift = 0; f.cdT = 0.35; // blocked: step aside and try again
  }
  if (round) { const na = me + round * 0.75, R = clamp(d + 6, 72, 120), [ox, oy] = clipToWalls(t.x, t.y, t.x + Math.cos(na) * R, t.y + Math.sin(na) * R * 0.85, f.r); pathTo(f, ox, oy, spd * 1.15, dt, 2); return; } // round the hero to its side
  if (d < T.keep[0]) { const [bx, by] = clipToWalls(f.x, f.y, f.x + Math.cos(me) * 40, f.y + Math.sin(me) * 32, f.r); if (dist(bx, by, f.x, f.y) > 6) steer(f, bx, by, spd * 1.15, dt); else strafe(f, t, spd, dt); return; }
  if (gx === null) { if (!sees || d > T.keep[1]) chase(f, t, spd, dt, 6); else strafe(f, t, spd * 0.6, dt); return; }
  if (dist(f.x, f.y, gx, gy) > 6) pathTo(f, gx, gy, spd * 1.1, dt, 2); else holdStill(f, dt);
}
// a flanker circles wide to the hero's back, darts in, stabs and gets out; if he turns to face it on the way in, it peels off
function flankMind(f, t, dt, d, sees) {
  const T = f.def, A = T.atk, reach = A.reach + t.r, R = 58, F = f.fl || (f.fl = { mode: 'circle', t: 0 }); F.t += dt;
  const th = angTo(t.x, t.y, f.x, f.y), off = angDiff(t.dir + Math.PI, th), facing = Math.abs(angDiff(t.dir, th)) < 0.9;
  faceTo(f, angTo(f.x, f.y, t.x, t.y));
  if (!sees && f.lostT > 0.6) { chase(f, t, T.spd, dt, 6); return; }
  if (F.mode === 'out') { if (F.t > 0.7 || d > R) { F.mode = 'circle'; F.t = 0; } else { const [gx, gy] = clipToWalls(t.x, t.y, t.x + Math.cos(th) * R, t.y + Math.sin(th) * R * 0.85, f.r); pathTo(f, gx, gy, T.spd, dt, 2); return; } }
  if (F.mode === 'circle') {
    if (Math.abs(off) < 0.6 || F.t > 4.5) { F.mode = 'in'; F.t = 0; }
    else { const na = th - Math.sign(off) * 0.8, [gx, gy] = clipToWalls(t.x, t.y, t.x + Math.cos(na) * R, t.y + Math.sin(na) * R * 0.85, f.r); pathTo(f, gx, gy, T.spd, dt, 2); return; }
  }
  if (facing && d > reach + 8 && F.t > 0.15) { F.mode = 'circle'; F.t = 0; return; } // seen coming: peel off
  if (d > reach * 0.9) { pathTo(f, t.x, t.y, T.spd * 1.15, dt, reach * 0.5); return; }
  if (f.cdT <= 0) { startFoeAtk(f, A, t); F.mode = 'out'; F.t = 0; } else strafe(f, t, T.spd * 0.6, dt);
}
// circling a little while waiting for the next swing, so a crowd does not stand in one heap
function strafe(f, t, spd, dt) { const a = angTo(t.x, t.y, f.x, f.y) + (f.id % 2 ? 0.9 : -0.9) * dt * 2, d = dist(f.x, f.y, t.x, t.y); steer(f, t.x + Math.cos(a) * d, t.y + Math.sin(a) * d * 0.85, spd, dt); }
function idleFoe(f, dt) {
  if (f.state === 'sleep') { f.vx = f.vy = 0; f.moving = false; if (chance(dt * 0.6)) snore(f); return; }
  const aimless = GAIT[f.spr] === 'shuffle'; // the stumblers mill about: barely a pause before they lurch off somewhere else
  if ((f.wanderT -= dt) <= 0) { f.wanderT = aimless ? rand(0.7, 2.2) : rand(2, 5); const a = rand(TAU), R = aimless ? 34 : 22; f.wx = f.home.x + Math.cos(a) * rand(aimless ? 10 : 0, R); f.wy = f.home.y + Math.sin(a) * rand(0, R * 0.64); }
  if (f.wx !== undefined && dist(f.x, f.y, f.wx, f.wy) > 3 && !blockAt(f.wx, f.wy)) { pathTo(f, f.wx, f.wy, f.def.spd * 0.35, dt, 2); faceTo(f, angTo(f.x, f.y, f.wx, f.wy)); }
  else { holdStill(f, dt); if (chance(dt * 0.3)) faceTo(f, f.dir + rand(-1.8, 1.8)); } // standing about, it looks around
}
function foeAct(f, t, dt) {
  const a = f.act; a.t += dt;
  if (a.k === 'cast') { castTick(f, a, dt); return; }
  if (a.k === 'aim') {
    f.vx = damp(f.vx, 0, 12, dt); f.vy = damp(f.vy, 0, 12, dt); f.moving = false;
    // aiming a little ahead of a moving hero
    if (a.t < a.dur - 0.18) { const lead = dist(f.x, f.y, t.x, t.y) / f.def.shot.spd * 0.5, want = angTo(f.x, f.y, t.x + (t.vx || 0) * lead, t.y + (t.vy || 0) * lead); a.dir += clamp(angDiff(a.dir, want), -3 * dt, 3 * dt); faceTo(f, a.dir); }
    if (a.t >= a.dur && !a.shot) { a.shot = true; shoot(f, a.dir); }
    if (a.t >= a.dur + f.def.shot.rec) { f.act = null; f.cdT = rand(...f.def.cd); }
    return;
  }
  const mv = a.mv, w = mv.wind, s = w + mv.act, e = s + mv.rec;
  if (a.phase === 'wind') {
    f.vx = damp(f.vx, 0, 14, dt); f.vy = damp(f.vy, 0, 14, dt); f.moving = false;
    if (a.t < w * 0.55) { const want = angTo(f.x, f.y, t.x, t.y); a.dir += clamp(angDiff(a.dir, want), -4 * dt, 4 * dt); faceTo(f, a.dir); }
    if (a.t >= w) { a.phase = 'act'; foeStrike(f, a); }
  }
  if (a.phase === 'act') { const u = 1 - (a.t - w) / mv.act; const L = mv.lunge || 0; f.vx = Math.cos(a.dir) * L * u; f.vy = Math.sin(a.dir) * L * u * 0.85; foeHits(f, a); if (a.t >= s) a.phase = 'rec'; }
  if (a.phase === 'rec') { f.vx = damp(f.vx, 0, 12, dt); f.vy = damp(f.vy, 0, 12, dt); f.moving = false; if (a.t >= e) { f.act = null; f.cdT = rand(...f.def.cd); } }
}
function foeStrike(f, a) {
  const mv = a.mv; SFX.slash(panOf(f.x));
  if (mv.k === 'arc') arcFx(f.x, f.y - 5 * f.scale, a.dir, mv.arc, mv.reach, 'red', 0.15, 3);
  else if (mv.slam && f.def.blood === 'water') waterSlam(f.x + Math.cos(a.dir) * mv.at, f.y + Math.sin(a.dir) * mv.at * 0.85, mv.reach);
  else if (mv.slam) { const cx = f.x + Math.cos(a.dir) * mv.at, cy = f.y + Math.sin(a.dir) * mv.at * 0.85; ring(cx, cy, mv.reach * 1.2, 'white', 0.35, 4); debris(cx, cy, 16, ['#5a5048', '#7d7064'], 130, 170, 1.8); smoke(cx, cy, 6, 'dust', 10, 40, 1); cracks(cx, cy, 3, 16, 200, 1); shake(0.4); SFX.boom(0.8, panOf(cx)); }
}
function foeHits(f, a) {
  const mv = a.mv, ox = mv.at ? Math.cos(a.dir) * mv.at : 0, oy = mv.at ? Math.sin(a.dir) * mv.at * 0.85 : 0, src = { x: f.x + ox, y: f.y + oy };
  for (const h of G.heroes) {
    if (h.dead || a.hit.has(h) || !hitsShape(src, h, mv, a.dir) || !lineOfSight(f.x, f.y - 4, h.x, h.y - 4)) continue; a.hit.add(h);
    // (straight away from the blow, a brute's too: never bent toward a pit's edge)
    const ka = angTo(src.x, src.y, h.x, h.y); hurt(h, f.def.dmg * f.dmgMul * (mv.dm || 1), f, { poise: mv.poise, kx: Math.cos(ka) * mv.push, ky: Math.sin(ka) * mv.push * 0.8, unblockable: mv.unblockable, ang: ka, style: 'bite', big: !!(mv.slam || (mv.wind || 0) >= 0.8) });
  }
}
// ---------- arrows and stones ----------
// Pillars stop arrows exactly where their stone is drawn: the arrow's drawn pixel against the pillar's own pixels, at the
// pillar's depth (an arrow passing well in front of or behind it flies on).
function pillarAt(x, y, z) {
  const P = PIX.cellar; if (!P || !ARENA) return null; const sx = Math.round(x), sy = Math.round(y - z);
  for (const p of ARENA.props) {
    if (p.kind !== 'pillar' || p.dead || Math.abs(x - p.x) > 9 || y < p.cy - 9 || y > p.cy + 6) continue;
    const lx = sx - (p.x - 8), ly = sy - (p.y - 46); if (lx < 0 || lx >= TS || ly < 0 || ly >= 3 * TS) continue;
    const [tx, ty] = p.tile; if (P.d[((ty * TS + ly) * P.w + tx * TS + lx) * 4 + 3] > 0) return p;
  }
  return null;
}
// an archer's arrow would reach the hero: no wall and no pillar on its flight line
function clearShot(f, t) {
  if (!lineOfSight(f.x, f.y - 4, t.x, t.y - 4)) return false; const a = angTo(f.x, f.y, t.x, t.y), sx = f.x + Math.cos(a) * 6, sy = f.y - 2 + Math.sin(a) * 4, L = dist(f.x, f.y, t.x, t.y);
  for (let s = 0; s < L; s += 3) if (pillarAt(sx + Math.cos(a) * s, sy + Math.sin(a) * s * 0.85, 7)) return false; return true;
}
function shoot(f, dir) {
  if (castShot(f, dir)) return; // a caster's spell, or the scout's rifle (55_spells)
  const S = f.def.shot, stone = STONE_SHOT[f.spr]; SFX.whoosh(panOf(f.x));
  G.proj.push({ k: stone ? 'stone' : 'arrow', x: f.x + Math.cos(dir) * 6, y: f.y - 2 + Math.sin(dir) * 4, z: 7, vx: Math.cos(dir) * S.spd, vy: Math.sin(dir) * S.spd * 0.85, team: 'foe', dmg: f.def.dmg * f.dmgMul, src: f, life: 1.6, r: 2 });
}
function updateProj(dt) {
  for (const p of G.proj) {
    if ((p.spell || p.k === 'flask') && spellStep(p, dt)) continue;
    p.life -= dt; const ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.team === 'foe' && ARENA.shop && inShop(ARENA, p.x, p.y)) { p.dead = true; sparks(ox, oy, p.z || 6, 4, 'gold', 50, 40); continue; } // (an arrow comes no further than the shop's door: 39_shop)
    const pl = pillarAt(p.x, p.y, p.z); if (solidAt(p.x, p.y) || p.life <= 0 || pl) { p.dead = true; if (p.spell) { p.x = ox; p.y = oy; spellEnd(p); } else sparks(ox, oy, p.z, 3, 'white', 60, 40); if (pl) SFX.clang(panOf(p.x)); continue; }
    const foes = p.team === 'foe' ? G.heroes : G.foes;
    for (const u of foes) {
      if (u.dead || dist(u.x, u.y, p.x, p.y) > u.r + p.r + 2) continue;
      if (u.iframe > 0) continue;
      if (p.k === 'wave') { if (p.hit.has(u)) continue; p.hit.add(u); hurt(u, p.dmg, u.team === 'hero' ? { x: p.x - p.vx * 0.2, y: p.y - p.vy * 0.2, team: p.team, def: {} } : p.src, { ranged: true, poise: 30, ang: Math.atan2(p.vy, p.vx), style: 'jet' }); spellHit(p, u); continue; } // a wave rolls on through
      if (u.team === 'hero' && u.blocking && u.blockT < PARRY_WINDOW && !p.nopar && Math.abs(angDiff(u.dir, Math.atan2(-p.vy, -p.vx))) < 1.25) { // a parried arrow flies back where it came from
        const s = p.src && !p.src.dead ? angTo(p.x, p.y, p.src.x, p.src.y) : Math.atan2(-p.vy, -p.vx), v = Math.hypot(p.vx, p.vy) * 1.2; p.vx = Math.cos(s) * v; p.vy = Math.sin(s) * v * 0.85; p.team = 'hero'; p.dmg *= 2.5; p.life = 1.2; p.src = u;
        sparks(p.x, p.y, 7, 12, 'gold', 160, 80); SFX.clang(panOf(p.x)); textPop(u.x, u.y, headZ(u) + 3, 'DEFLECTED', 'gold', false); freeze(u, 0.06); break;
      }
      const from = { x: p.x - p.vx * 0.2, y: p.y - p.vy * 0.2, team: p.team, def: {} };
      hurt(u, p.dmg, u.team === 'hero' ? from : p.src, { ranged: true, poise: 12, kx: p.vx * 0.3, ky: p.vy * 0.3, ang: Math.atan2(p.vy, p.vx), style: 'jet' }); if (p.spell) spellHit(p, u); p.dead = true; break;
    }
  }
  removeIf(G.proj, p => p.dead);
}
// ---------- what a foe leaves ----------
function dropLoot(u) { const g = u.def.gold || [0, 1]; const n = randi(g[0], g[1]); if (n > 0) dropGold(u.x, u.y, n); }
// Pickups from the item sheet: a fish heals on the spot, a flask gives back a flask charge. Either one waits on the floor
// while the hero has no use for it (full health, every flask full).
const ITEM = { fish: [0, 0, 12, 10], flask: [16, 0, 6, 11], map: [64, 0, 14, 15, 'scrolls'] }; // where on the item sheet (or another), how long a shadow it casts, and the row it rests on (the fish's belly; its tail hangs a row lower)
function dropItem(k, x, y) { G.drops.push({ k, x, y, z: 4, vx: rand(-30, 30), vy: rand(-20, 20), vz: rand(70, 110), t: 0 }); }
function takeItem(d, h) {
  if (d.k === 'fish') { if (h.hp >= h.maxHp) return false; const g = Math.min(h.maxHp - h.hp, Math.round(h.maxHp * 0.15)); h.hp += g; number(h.x, h.y, headZ(h) + 1, '+' + g, 'heal', true); healGlow(h.x, h.y); SFX.heal(); return true; }
  if (d.k === 'map') { revealFloor(ARENA); ARENA.mapRead = true; h.shown = { k: 'map', t0: G.time }; textPop(h.x, h.y, headZ(h) + 20, 'AHA!', 'gold', false); SFX.aha(panOf(h.x)); for (let i = 0; i < 10; i++) part({ k: 'glow', x: h.x + rand(-7, 7), y: h.y, z: headZ(h) + rand(6, 16), vz: rand(10, 30), drag: 2, life: rand(0.5, 0.9), s0: rand(1.2, 2), s1: 0, col: 'gold' }); return true; } // the floor's map (52_hero: in a small chest)
  if (d.k === 'flask') { if (h.flasks >= h.maxFlasks) return false; h.flasks++; textPop(h.x, h.y, headZ(h) + 2, '+1 FLASK', 'heal', false); SFX.coin(panOf(d.x)); return true; }
  return false;
}
function dropGold(x, y, n) { for (let i = 0; i < Math.min(n, 6); i++) G.drops.push({ k: 'gold', v: Math.ceil(n / Math.min(n, 6)), x, y, z: 4, vx: rand(-40, 40), vy: rand(-30, 30), vz: rand(60, 120), t: 0 }); }
function updateDrops(dt) {
  for (const d of G.drops) {
    if (d.wait > 0) { d.wait -= dt; if (d.wait <= 0) SFX.toss(panOf(d.x), d.k === 'gold'); continue; }
    d.t += dt; d.vz -= 400 * dt; d.z += d.vz * dt; if (d.z < 0) { d.z = 0; d.vz = -d.vz * 0.35; d.vx *= 0.6; d.vy *= 0.6; }
    const f = Math.exp(-3 * dt); d.vx *= f; d.vy *= f; const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt; if (!blockAt(nx, ny) && !trimAt(nx, ny) && (!propFootAt(nx, ny) || propFootAt(d.x, d.y))) { d.x = nx; d.y = ny; } // (nor slides in under the ceiling, out of sight, nor into a column's plinth or a chest: one tossed out of a chest gets out of it)
    if (d.t < (d.hold || 0.4)) continue;
    if (d.seek) { const h = d.seek, dd = dist(d.x, d.y, h.x, h.y); if (dd < 6) { d.dead = true; takeItem(d, h); } else { d.x += (h.x - d.x) / dd * 110 * dt; d.y += (h.y - d.y) / dd * 110 * dt; } continue; } // (a ware bought: over the counter to him, 39_shop)
    if (d.k !== 'gold') { const h = nearest(d, G.heroes.filter(alive), 8); if (h && d.z < 2 && takeItem(d, h)) d.dead = true; continue; } // stepped on, and of use
    const h = nearest(d, G.heroes.filter(alive), 26); if (!h) continue;
    const dd = dist(d.x, d.y, h.x, h.y); if (dd < 6) { d.dead = true; G.gold += d.v; SFX.coin(panOf(d.x)); part({ k: 'glow', x: d.x, y: d.y, z: 6, vz: 30, life: 0.3, s0: 2, s1: 0, col: 'gold' }); }
    else { d.x += (h.x - d.x) / dd * 140 * dt; d.y += (h.y - d.y) / dd * 140 * dt; }
  }
  removeIf(G.drops, d => d.dead);
}
