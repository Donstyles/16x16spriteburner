// ===================== the bestiary: who lives at which depth =====================
// Every stretch of four floors has its own people, ending in a boss floor:
//   1-4 the cellar (vermin, goblins, halflings) · 5-8 the crypts (the dead) · 9-12 the flooded deep (merfolk, elves, drakes)
//   13-16 the seal (the holy order that sealed it, its golems, young dragons) · 17-20 the abyss (demons) · 21+ everything at once
const ZONES = [[4, 'cellar'], [8, 'crypt'], [12, 'deep'], [16, 'seal'], [20, 'abyss']];
const zoneOf = f => { for (const [last, z] of ZONES) if (f <= last) return z; return null; };
Object.assign(BLOOD, { bone: ['#d8d0bc', '#b0a68c', '#8a8270'], ichor: ['#5a1a6a', '#8a2a9a', '#3a0a48'] });
const beast = (spr, hp, spd, dmg, ai, tier, zones, o = {}) => ({ spr, hp, spd, dmg, ai, tier, zones, ...o });
Object.assign(MON_DEFS, {
  // the cellar: what lives under a farmhouse
  mouse: beast('InfectedMouse', 26, 68, 6, 'melee', 1, ['cellar']),
  roach: beast('TaintedCockroach', 30, 62, 7, 'melee', 1, ['cellar'], { blood: 'slime' }),
  ftick: beast('FamishedTick', 28, 56, 7, 'melee', 1, ['cellar']),
  bedbug: beast('BloatedBedbug', 40, 40, 8, 'melee', 1, ['cellar']),
  maggot: beast('ForagingMaggot', 44, 26, 8, 'melee', 1, ['cellar'], { blood: 'slime' }),
  ant: beast('SoldierAnt', 44, 46, 9, 'melee', 1, ['cellar'], { blood: 'slime' }),
  pbat: beast('PlagueBat', 26, 72, 6, 'melee', 1, ['cellar']),
  sbat: beast('SwoopingBat', 28, 76, 7, 'melee', 1, ['cellar']),
  acidant: beast('AcidAnt', 46, 40, 10, 'ranged', 2, ['cellar'], { shot: 'poison', blood: 'slime' }),
  lavaant: beast('LavaAnt', 56, 40, 12, 'caster', 2, ['cellar'], { shot: 'fire', blood: 'fire' }),
  dung: beast('DungBeetle', 96, 34, 12, 'melee', 2, ['cellar'], { blood: 'slime' }),
  mole: beast('TunnelingMole', 84, 42, 12, 'melee', 2, ['cellar']),
  beaver: beast('MawingBeaver', 104, 36, 14, 'melee', 2, ['cellar']),
  etick: beast('EngorgedTick', 140, 26, 16, 'heavy', 2, ['cellar'], { scale: 1.25 }),
  rhino: beast('RhinoBeetle', 150, 32, 16, 'heavy', 2, ['cellar'], { scale: 1.25, blood: 'slime' }),
  // the crypts
  bones: beast('DecrepitBones', 42, 36, 9, 'melee', 1, ['crypt'], { blood: 'bone' }),
  hand: beast('SkitteringHand', 24, 70, 6, 'melee', 1, ['crypt'], { blood: 'bone' }),
  crawler: beast('DismemberedCrawler', 32, 44, 8, 'melee', 1, ['crypt']),
  scarab: beast('RoyalScarab', 32, 56, 7, 'melee', 1, ['crypt'], { blood: 'metal' }),
  vbat: beast('VampireBat', 28, 74, 7, 'melee', 1, ['crypt']),
  barcher: beast('BrittleArcher', 34, 34, 8, 'ranged', 1, ['crypt'], { shot: 'arrow', blood: 'bone' }),
  stumbler: beast('MutilatedStumbler', 60, 28, 11, 'melee', 2, ['crypt']),
  cadaver: beast('BoundCadaver', 100, 30, 14, 'melee', 2, ['crypt'], { blood: 'bone' }),
  ucrawler: beast('UnravelingCrawler', 86, 40, 12, 'melee', 2, ['crypt']),
  feeder: beast('CarcassFeeder', 92, 50, 13, 'melee', 2, ['crypt']),
  ghoul: beast('SandGhoul', 88, 52, 13, 'melee', 2, ['crypt']),
  hound: beast('ToxicHound', 80, 64, 12, 'melee', 2, ['crypt'], { blood: 'slime' }),
  eye: beast('GhastlyEye', 150, 30, 16, 'caster', 3, ['crypt'], { shot: 'arcane' }),
  gscarab: beast('GiantRoyalScarab', 260, 30, 22, 'heavy', 3, ['crypt'], { scale: 1.35, blood: 'metal' }),
  revenant: beast('GraveRevenant', 400, 30, 28, 'heavy', 4, ['crypt'], { scale: 1.45, blood: 'bone' }),
  // the flooded deep
  mscout: beast('MerfolkScout', 48, 52, 10, 'melee', 1, ['deep']),
  pwyvern: beast('PygmyWyvern', 40, 64, 8, 'melee', 1, ['deep']),
  wayfarer: beast('ElfWayfarer', 46, 54, 10, 'melee', 1, ['deep']),
  impaler: beast('MerfolkImpaler', 96, 42, 14, 'melee', 2, ['deep'], { reach: 6 }),
  javelin: beast('MerfolkJavelineer', 66, 38, 11, 'ranged', 2, ['deep'], { shot: 'arrow' }),
  blade: beast('ElfBladedancer', 84, 60, 14, 'melee', 2, ['deep']),
  sharp: beast('ElfSharpshooter', 62, 38, 12, 'ranged', 2, ['deep'], { shot: 'arrow' }),
  mwyvern: beast('MudWyvern', 110, 54, 14, 'melee', 2, ['deep']),
  mystic: beast('MerfolkMystic', 130, 34, 16, 'caster', 3, ['deep'], { shot: 'ice' }),
  aquamancer: beast('MerfolkAquamancer', 140, 34, 16, 'caster', 3, ['deep'], { shot: 'ice' }),
  enchanter: beast('ElfEnchanter', 120, 34, 16, 'caster', 3, ['deep'], { shot: 'arcane' }),
  adrake: beast('AquaDrake', 170, 44, 18, 'caster', 3, ['deep'], { shot: 'ice' }),
  pdrake: beast('PoisonDrake', 170, 44, 18, 'caster', 3, ['deep'], { shot: 'poison' }),
  vdrake: beast('ViridianDrake', 230, 52, 20, 'melee', 4, ['deep']),
  elflord: beast('ElfLord', 240, 48, 22, 'melee', 4, ['deep']),
  // the seal: the holy order that sealed it, and what they keep
  acolyte: beast('DevoutAcolyte', 36, 36, 9, 'ranged', 1, ['seal'], { shot: 'holy' }),
  soldier: beast('DeterminedSoldier', 50, 40, 10, 'melee', 1, ['seal']),
  manatarms: beast('BoldManAtArms', 56, 38, 11, 'melee', 1, ['seal'], { reach: 6 }),
  swordsman: beast('VeteranSwordsman', 96, 42, 14, 'melee', 2, ['seal']),
  bgladiator: beast('BlessedGladiator', 104, 44, 15, 'melee', 2, ['seal']),
  cleric: beast('FavoredCleric', 70, 34, 12, 'caster', 2, ['seal'], { shot: 'holy' }),
  zealot: beast('ZealousPriest', 120, 34, 16, 'caster', 3, ['seal'], { shot: 'holy' }),
  crusader: beast('HolyCrusader', 260, 34, 22, 'heavy', 3, ['seal'], { scale: 1.3, blood: 'metal' }),
  bbrass: beast('BabyBrassDragon', 140, 46, 16, 'caster', 3, ['seal'], { shot: 'fire' }),
  bcopper: beast('BabyCopperDragon', 140, 46, 16, 'caster', 3, ['seal'], { shot: 'poison' }),
  bgreen: beast('BabyGreenDragon', 140, 46, 16, 'caster', 3, ['seal'], { shot: 'poison' }),
  bwhite: beast('BabyWhiteDragon', 140, 46, 16, 'caster', 3, ['seal'], { shot: 'ice' }),
  ybrass: beast('YoungBrassDragon', 320, 40, 24, 'heavy', 4, ['seal'], { scale: 1.4 }),
  jbronze: beast('JuvenileBronzeDragon', 230, 40, 20, 'caster', 4, ['seal'], { shot: 'zap' }),
  // the abyss
  demonling: beast('RascallyDemonling', 28, 64, 7, 'melee', 1, ['abyss'], { blood: 'ichor' }),
  scamp: beast('NefariousScamp', 32, 60, 8, 'melee', 1, ['abyss'], { blood: 'ichor' }),
  imp: beast('CrimsonImp', 40, 56, 10, 'ranged', 1, ['abyss'], { shot: 'fire', blood: 'ichor' }),
  gremlin: beast('GrinningGremlin', 42, 58, 10, 'melee', 1, ['abyss'], { blood: 'ichor' }),
  rascal: beast('AntleredRascal', 70, 54, 12, 'melee', 2, ['abyss'], { blood: 'ichor' }),
  fledgling: beast('FledglingDemon', 80, 50, 13, 'melee', 2, ['abyss'], { blood: 'ichor' }),
  demonspawn: beast('PointedDemonspawn', 90, 46, 14, 'melee', 2, ['abyss'], { blood: 'ichor' }),
  scoundrel: beast('TaintedScoundrel', 76, 40, 12, 'caster', 2, ['abyss'], { shot: 'void', blood: 'ichor' }),
  gouger: beast('FoulGouger', 130, 44, 16, 'melee', 3, ['abyss'], { blood: 'ichor' }),
  stalker: beast('SkeweringStalker', 150, 52, 18, 'melee', 3, ['abyss'], { reach: 6, blood: 'ichor' }),
  feye: beast('FloatingEye', 140, 30, 16, 'caster', 3, ['abyss'], { shot: 'void', blood: 'ichor' }),
  wskull: beast('WarpSkull', 130, 40, 16, 'caster', 3, ['abyss'], { shot: 'void', blood: 'bone' }),
  blackguard: beast('DepravedBlackguard', 260, 40, 24, 'melee', 4, ['abyss'], { blood: 'ichor' }),
  abomination: beast('ClawedAbomination', 400, 30, 28, 'heavy', 4, ['abyss'], { scale: 1.45, blood: 'ichor' }),
});
// the monsters we had move to the depths they suit
const OLD_ZONES = { cellar: ['goblin', 'fanatic', 'garcher', 'dog', 'rogue', 'slinger', 'scarecrow', 'occultist'], crypt: ['witch', 'necro', 'gargoyle'], deep: ['gladiator', 'spear', 'larcher', 'satyr', 'naga', 'cube', 'treant'], seal: ['stone', 'clay', 'iron', 'obsidian', 'minotaur', 'firel', 'djinn'] };
for (const z in OLD_ZONES) for (const k of OLD_ZONES[z]) MON_DEFS[k].zones = [z];
// the monsters of this floor's depth; past floor 20, all of them
function zonePool(f = G.floor) { const z = zoneOf(f), all = Object.values(MON_DEFS); if (!z) return all; const p = all.filter(d => d.zones && d.zones.includes(z)); return p.length ? p : all; }
// bosses, every fourth floor: dragons in the deep and at the seal, and at the bottom the thing under the farmhouse
BOSS_DEFS.splice(0, BOSS_DEFS.length,
  { spr: 'MithrilConstruct', name: 'THE MITHRIL COLOSSUS', sub: 'IT WAS BUILT TO GUARD THE GRAIN', hp: 2600, moves: ['slam', 'volley', 'charge', 'summon'], blood: 'metal', col: 'bolt' },
  { spr: 'ConjuringBeholder', name: 'THE ALL-SEEING', sub: 'IT HAS WATCHED YOU SINCE THE STAIRS', hp: 2300, moves: ['beam', 'volley', 'summon', 'beam'], col: 'arcane' },
  { spr: 'AdultGreenDragon', name: 'THE GREEN WYRM', sub: 'IT HAS SLEPT IN THE FLOODWATER FOR A HUNDRED YEARS', hp: 2700, moves: ['beam', 'charge', 'volley', 'summon'], col: 'poison' },
  { spr: 'MatureBronzeDragon', name: 'THE BRONZE HOARD-KEEPER', sub: 'THE ORDER FED IT EVERY CHALLENGER', hp: 3000, moves: ['charge', 'beam', 'slam', 'summon'], col: 'gold' },
  { spr: 'PitBalor', name: 'THE PIT BALOR', sub: 'THE THING UNDER THE FARMHOUSE', hp: 3400, moves: ['slam', 'beam', 'summon', 'volley', 'charge'], blood: 'ichor', col: 'crimson' },
  { spr: 'BestialMinotaur', name: 'GORETUSK', sub: 'LORD OF THE LOWER STORES', hp: 2500, moves: ['charge', 'slam', 'charge', 'summon'], col: 'red' },
  { spr: 'AdultWhiteDragon', name: 'THE WHITE WYRM', sub: 'THE CELLAR NEVER THAWS AROUND IT', hp: 3000, moves: ['beam', 'volley', 'charge', 'summon'], col: 'ice' },
  { spr: 'MoltenEfreeti', name: 'THE MOLTEN EFREETI', sub: 'THE KILN NEVER COOLED', hp: 2500, moves: ['volley', 'beam', 'slam', 'summon'], blood: 'fire', col: 'fire' },
  { spr: 'YoungRedDragon', name: 'EMBERCLAW', sub: 'YOUNG, HUNGRY, AND ALREADY BURNING', hp: 2800, moves: ['beam', 'charge', 'beam', 'summon'], col: 'fire' },
  { spr: 'GrizzledTreant', name: 'THE ROTWOOD ANCIENT', sub: 'ROOTS THROUGH EVERY WALL', hp: 3000, moves: ['slam', 'summon', 'volley', 'slam'], blood: 'wood', col: 'heal' },
  { spr: 'AdamantiumGolem', name: 'ADAMANT THE UNBROKEN', sub: 'NOTHING HAS EVER SCRATCHED IT', hp: 3400, moves: ['slam', 'charge', 'volley', 'slam', 'summon'], blood: 'metal', col: 'gold' },
);
// each depth has its own rooms and its own whispers; the fourth room of each is the boss's
const ZONE_NAMES = {
  cellar: ['THE ROOT CELLAR', 'THE LAST LARDER', 'THE ROTTED GRANARY', 'THE GRAIN VAULT'],
  crypt: ['THE BONE PANTRY', 'THE WINE CRYPT', 'THE GRAIN TOMB', 'THE SALT VAULT'],
  deep: ['THE HOLLOW CISTERN', 'THE DROWNED STORES', 'THE DEEP MILL', 'THE SUNKEN WELL'],
  seal: ['THE IRON LARDER', 'THE SEALED GATE', 'THE HALL OF VIGILS', 'THE BRONZE HOARD'],
  abyss: ['THE ASHEN KILN', 'THE BLACK BREWERY', 'THE SCREAMING SILO', 'THE ROOT OF THE FARMHOUSE'],
};
const ZONE_LINES = {
  cellar: ['The roots down here drink more than water.', 'Salt keeps meat fresh. It keeps other things too.', 'Old tallies scratched in the stone. All of them stop.'],
  crypt: ['Every bone is labelled. Someone keeps the ledger.', 'The wine went bad. So did the ones who drank it.', 'Listen. The walls are breathing.'],
  deep: ['The water rose once. Something swam in with it.', 'No lantern ever reached this far before.', 'Even the rats have stopped running.'],
  seal: ['The farmhouse is only a lid. You are under it.', 'An order of knights swore that no one would pass.', 'They sealed it in. They never thought to leave.'],
  abyss: ['The kiln sat cold for a hundred years. It is warm now.', 'Deeper still. The dark has a heartbeat.', 'Something below has been waiting for you.'],
};
const floorName = f => { const z = zoneOf(f); return z ? ZONE_NAMES[z][(f - 1) % 4] : FLOOR_NAMES[(f - 1) % FLOOR_NAMES.length]; };
