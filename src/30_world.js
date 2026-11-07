// ===================== world: terrain, themes, maps =====================
const TR = { VOID: 0, FLOOR: 1, WALL: 2, GRASS: 3, DIRT: 4, ROAD: 5, WATER: 6, SAND: 7, TREE: 8, ROCK: 9, LAVA: 10, DOOR: 11, ROOF: 12, DEEP: 13 };
const PASSABLE = new Set([TR.FLOOR, TR.GRASS, TR.DIRT, TR.ROAD, TR.SAND, TR.DOOR]);
// plus-block (wall rim) themes: origin of the 5x5 block; floor tiles inside; filler is the block corner
const THEMES = {
  cave: { plus: [6, 4], fogColor: '#120c08', ambient: 0.42, torch: 'brazier' },
  moss: { plus: [16, 9], fogColor: '#06100a', ambient: 0.38, torch: 'brazier_green' },
  ice: { plus: [6, 14], fogColor: '#060a18', ambient: 0.42, torch: 'brazier_blue' },
  molten: { plus: [11, 19], fogColor: '#1a0804', ambient: 0.5, torch: 'brazier' },
  cosmic: { plus: [26, 9], fogColor: '#08041a', ambient: 0.4, torch: 'brazier_purple' },
  crypt: { plus: [11, 9], fogColor: '#0a0a0c', ambient: 0.3, torch: 'brazier_purple' },
  town: { plus: [6, 19], fogColor: '#0a0a12', ambient: 1, torch: 'brazier' },
};
// outdoor blob blocks: [c0, r0]
const BLOBS = { grass: [21, 9], road: [31, 24], sand: [36, 24], water: [36, 4] };
const DIRT_TILES = [[14, 2], [15, 2], [14, 3], [15, 3]];
const ROOF_TILES = [[22, 2], [23, 2], [24, 3], [25, 3]];
const LAVA_TILES = [[14, 0], [15, 0], [14, 1], [15, 1]];
const DEEP_TILES = [[37, 5], [38, 6], [39, 5], [38, 7]];
const TREE_TILES = [[4, 20], [5, 20], [4, 20], [4, 22]];
const ROCK_TILES = [[4, 21], [4, 22]];

// map registry: definitions produce maps on demand (deterministic from seed)
const MAPS = {};
function newMap(id, name, w, h, opts) { return Object.assign({ id, name, w, h, t: new Uint8Array(w * h), explored: new Uint8Array(w * h), objects: [], monsters: [], npcs: [], exits: [], lights: [], start: { x: 2, y: 2 }, outdoor: false, theme: 'cave', tier: 1 }, opts); }
const mIdx = (m, x, y) => y * m.w + x;
const mGet = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? TR.VOID : m.t[y * m.w + x];
const mSet = (m, x, y, v) => { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.t[y * m.w + x] = v; };
const mPass = (m, x, y) => PASSABLE.has(mGet(m, x, y));

// ---------- the town of Harrowmere ----------
const TOWN_ASCII = `
TTTTTTTTT.TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T
T,,T,,,#####,,,,,,#######,,,,,,,,######,,,,T,,,T
T,,,,,,#AAA#,,,,,,#BBBBB#,,,,,,,,#CCCC#,,,,,,,,T
T,,,,,,#AAA#,,,,,,#BBBBB#,,,,,,,,#CCCC#,,,,,,,,T
T,,,,,,##a##,,,,,,###b###,,,,,,,,##c###,,,T,,,,T
T,,,,,,,,.,,,,,,,,,,.,,,,,,,,,,,,,.,,,,,,,,,,,,T
T,,,,,,,,......................................T
T,,T,,,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,#######,,,,,,,,,,,,,,,,######,,,,.,T
T,,,,,,,,.,,#LLLLL#,,,,,,,,,,,,,,,,#PPPP#,,,,.,T
T,,,,,,,,.,,#LLLLL#,,,,,,,,,,,,,,,,#PPPP#,,,,.,T
T,,,,,,,,.,,#LLLLL#,,,,,,,,,,,,,,,,#PPPP#,,,,.,T
T,,,,,,,,.,,###l###,,,,,,,,,,,,,,,,##p###,,,,.,T
T,,,,,,,,.,,,,,.,,,,,,,,,,,,,,,,,,,,,.,,,,,,,.,T
.,,T,,,,,.......................................
T,,,,,,,,.,,,,,,,,,,,,.,,,,,,,,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,,,,,,,,,,.,,,,,,,,,,,,,,,,,,,,,,.,T
T,,####,,.,,,,,,,,,,,,.,,,,,,,,,,,#####,,,,,,.,T
T,,#HH#,,.,,,,,,,,,,,,@,,,,,,,,,,,#III#,,,,,,.,T
T,,#HH#,,.,,,,,,,,,,,,,,,,,,,,,,,,#III#,,,,,,.,T
T,,##h#,,.,,,,,,,,,,,,,,,,,,,,,,,,##i##,,,,,,.,T
T,,,,.,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,.,,,,,,,,.,T
T,,,,....................................,,,,.,T
T,,,,,,,,.,,,####,,,,,,,,#####,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,#KK#,,,,,,,,#RRR#,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,#KK#,,,,,,,,#RRR#,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,##k#,,,,,,,,##r##,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,,,.,,,,,,,,,,,.,,,,,,,,,,,,,,,,,.,T
T,,,,,,,,......................................T
T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T
TTTTTTTTTTTTTTTTTTT.TTTTTTTTTTTTTTTTTTTTTTTTTTTT`.trim().split('\n');
const BUILDINGS = {
  a: { id: 'weapons', name: 'The Rusty Blade', kind: 'shop', keeper: 'Brom the Smith', spr: 'LizardfolkGladiator', stock: ['dagger', 'short_sword', 'long_sword', 'hand_axe', 'club', 'mace', 'spear', 'short_bow', 'staff', 'long_bow', 'broad_sword', 'morning_star'], buys: ['weapon'], quest: 'ore' },
  b: { id: 'armor', name: 'The Iron Hauberk', kind: 'shop', keeper: 'Marta Hauberk', spr: 'HalflingBard', stock: ['leather_armor', 'studded_leather', 'chain_mail', 'buckler', 'shield', 'cap', 'helm', 'boots', 'robe', 'scale_mail'], buys: ['armor', 'shield', 'helm', 'boots'] },
  c: { id: 'alchemist', name: 'The Gilded Flask', kind: 'shop', keeper: 'Old Ysolde', spr: 'DeftSorceress', stock: ['potion_heal', 'potion_mana', 'potion_cure', 'torch', 'food', 'potion_heal2', 'potion_mana2'], buys: ['potion', 'misc', 'food', 'quest', 'ring', 'amulet'], quest: 'herbs' },
  l: { id: 'hall', name: 'Harrow Hall', kind: 'hall', keeper: 'Lord Edric Harrow', spr: 'WiseWizard' },
  p: { id: 'temple', name: 'Temple of the Dawn', kind: 'temple', keeper: 'Sister Amalie', spr: 'BeginnerEnchanter', quest: 'pilgrims' },
  h: { id: 'widow', name: 'Widow Greer\'s cottage', kind: 'house', keeper: 'Widow Greer', spr: 'HalflingRanger', quest: 'locket' },
  i: { id: 'inn', name: 'The Drowsy Dragon', kind: 'inn', keeper: 'Tobbin the Innkeep', spr: 'HalflingRogue', quest: 'bandits' },
  k: { id: 'scholar', name: 'Scholar Pell\'s study', kind: 'house', keeper: 'Scholar Pell', spr: 'MasterIllusionist', quest: 'tome' },
  r: { id: 'trainer', name: 'Harrowmere Training Hall', kind: 'trainer', keeper: 'Drillmaster Oswin', spr: 'SkilledBattlemage' },
};
const GUILDS = { // guild stalls stand in the square (NPC objects)
  elemental: { name: 'Guild of the Elements', keeper: 'Magister Thane', spr: 'FrostMagus', schools: ['Fire', 'Air', 'Water', 'Earth'] },
  spirit: { name: 'Guild of the Spirit', keeper: 'Mother Ilse', spr: 'ExpertDruid', schools: ['Spirit', 'Mind', 'Body'] },
};
// ---------- quests ----------
const QUESTS = {
  main1: { name: 'The Goblin King', giver: 'Lord Edric Harrow', text: 'Goblins from the Warrens raid the north road. Bring me the signet of their king, Gruk, and Harrowmere will know your names.', item: 'goblin_signet', reward: { gold: 500, xp: 1500 }, next: 'main2' },
  main2: { name: 'The Relic of the Mandate', giver: 'Lord Edric Harrow', text: 'The Relic was taken to the Mossgrave Barrow by those who stole the Scepter. The barrow is older than the town. Bring the Relic back.', item: 'barrow_relic', reward: { gold: 1500, xp: 4000 }, next: 'main3' },
  main3: { name: 'The Two Keys', giver: 'Lord Edric Harrow', text: 'The Sanctum where the Scepter is kept opens only to the Frost Key of the Reliquary and the Brass Key of the Molten Gallery. Bring both.', items: ['frost_key', 'brass_key'], reward: { gold: 4000, xp: 12000 }, next: 'main4' },
  main4: { name: 'The Scepter of the Mandate', giver: 'Lord Edric Harrow', text: 'The Hollow Regent sits in the Sanctum with our Scepter. End it, and bring the Mandate home.', item: 'scepter', reward: { gold: 20000, xp: 50000 }, final: true },
  bandits: { name: 'Bandits on the Road', giver: 'Tobbin the Innkeep', text: 'Halfling bandits waylay my carts on the west road. Put down eight of them and the drinks are on me, plus a purse.', kill: ['bandit', 'bandit_slinger', 'assassin', 'ranger'], count: 8, reward: { gold: 400, xp: 800 } },
  ore: { name: 'Ore for the Forge', giver: 'Brom the Smith', text: 'The goblins dug iron in the Warrens before they stopped digging and started raiding. Bring me three lumps of ore.', item: 'iron_ore', count: 3, reward: { gold: 250, xp: 500, item: 'broad_sword' } },
  herbs: { name: 'Marsh Herbs', giver: 'Old Ysolde', text: 'The marsh east of town grows a bitter herb I need. Four bundles, if the lizardfolk let you.', item: 'marsh_herb', count: 4, reward: { gold: 200, xp: 400, item: 'potion_heal2' } },
  locket: { name: 'The Silver Locket', giver: 'Widow Greer', text: 'The goblins took my husband\'s locket when they took him. If it is anywhere, it is in their Warrens.', item: 'widow_locket', reward: { gold: 100, xp: 600, item: 'amulet' } },
  pilgrims: { name: 'The Lost Pilgrims', giver: 'Sister Amalie', text: 'Pilgrims went to the Mossgrave Barrow to pray and did not return. Find any word of them.', item: 'pilgrim_letter', reward: { gold: 300, xp: 900 } },
  tome: { name: 'The Tome of Hollow Stars', giver: 'Scholar Pell', text: 'My tome was stolen and, I am told, carried into the Frozen Reliquary. Return it and I will teach you what I know.', item: 'lost_tome', reward: { gold: 600, xp: 2000, skillPoints: 3 } },
};
// ---------- dungeons ----------
const DUNGEONS = {
  warrens: { name: 'Goblin Warrens', theme: 'cave', w: 46, h: 38, rooms: 10, tier: 1, seed: 1101, pool: ['goblin', 'goblin', 'goblin', 'goblin_archer', 'goblin_shaman', 'wild_dog'], boss: 'goblin_king', drop: 'goblin_signet', items: ['iron_ore', 'iron_ore', 'iron_ore', 'iron_ore', 'widow_locket'], entrance: 'A cave mouth, reeking of goblin.' },
  barrow: { name: 'Mossgrave Barrow', theme: 'moss', w: 50, h: 42, rooms: 11, tier: 2, seed: 2202, pool: ['treant', 'scarecrow', 'wisp', 'satyr', 'necromancer', 'scarecrow'], boss: 'elder_treant', drop: 'barrow_relic', items: ['pilgrim_letter'], entrance: 'A barrow door of green stone, half swallowed by roots.' },
  reliquary: { name: 'Frozen Reliquary', theme: 'ice', w: 52, h: 44, rooms: 12, tier: 3, seed: 3303, pool: ['ice_golem', 'cryomancer', 'water_elemental', 'stone_golem', 'illusionist', 'wild_dog'], boss: 'mithril_construct', drop: 'frost_key', items: ['lost_tome'], entrance: 'Cold air pours from a doorway of blue ice.' },
  molten: { name: 'Molten Gallery', theme: 'molten', w: 52, h: 44, rooms: 12, tier: 4, seed: 4404, pool: ['fire_elemental', 'pyromancer', 'flame_magus', 'brass_golem', 'earth_elemental', 'obsidian_golem'], boss: 'efreeti', drop: 'brass_key', items: [], lava: true, entrance: 'Heat shimmers over a brass-bound gate in the rock.' },
  sanctum: { name: 'The Sanctum', theme: 'cosmic', w: 56, h: 46, rooms: 13, tier: 4, seed: 5505, pool: ['gargoyle', 'beholder', 'wizard', 'air_elemental', 'flesh_golem', 'venomancer', 'djinn'], boss: 'adamantium_golem', drop: 'scepter', items: [], locked: ['frost_key', 'brass_key'], entrance: 'A door with two keyholes. The stone around it is not from here.' },
};
// where dungeon entrances sit on the overworld, and the town's position
const OVER_W = 110, OVER_H = 86;
const TOWN_POS = { x: 31, y: 44 };
const ENTRANCES = { warrens: [52, 9], barrow: [96, 22], reliquary: [10, 10], molten: [100, 70], sanctum: [72, 77] };
const CAMPS = [ // overworld monster camps: x, y, radius, list, count
  [44, 22, 5, ['goblin', 'goblin', 'goblin_archer', 'wild_dog'], 5], [60, 16, 5, ['goblin', 'goblin_shaman', 'goblin_archer'], 5], [38, 12, 4, ['scarecrow', 'wild_dog', 'goblin'], 4],
  [16, 50, 5, ['bandit', 'bandit', 'bandit_slinger'], 4], [12, 66, 5, ['bandit', 'bandit_slinger', 'assassin'], 4], [22, 30, 5, ['bandit', 'bandit', 'wild_dog', 'bandit_slinger'], 5],
  [84, 44, 6, ['lizard_scout', 'lizard_spear', 'lizard_archer'], 5], [92, 56, 6, ['lizard_spear', 'lizard_gladiator', 'lizard_scout'], 5], [76, 30, 5, ['lizard_scout', 'lizard_archer', 'satyr'], 4],
  [20, 18, 5, ['satyr', 'pixie', 'treant'], 4], [30, 8, 5, ['wisp', 'fairy', 'satyr'], 4], [88, 10, 5, ['treant', 'wolf_rider', 'satyr'], 4],
  [8, 26, 5, ['stone_golem', 'earth_elemental', 'clay_golem'], 3], [100, 40, 5, ['fire_elemental', 'pyromancer'], 3], [92, 68, 5, ['lizard_gladiator', 'bestial_lizard', 'naga'], 4], [6, 56, 5, ['minotaur', 'wolf_rider'], 3],
];

// ---------- value noise ----------
function makeNoise(seed) {
  const rng = seededRng(seed), g = new Float32Array(256 * 256); for (let i = 0; i < g.length; i++) g[i] = rng();
  const at = (x, y) => g[((y & 255) << 8) | (x & 255)];
  const smoothed = (x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return lerp(lerp(at(x0, y0), at(x0 + 1, y0), sx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), sx), sy); };
  return (x, y, oct = 3) => { let v = 0, a = 1, f = 1, n = 0; for (let i = 0; i < oct; i++) { v += smoothed(x * f, y * f) * a; n += a; a *= 0.5; f *= 2; } return v / n; };
}

// ---------- overworld ----------
function buildOverworld() {
  const m = newMap('over', 'Harrowmere Reach', OVER_W, OVER_H, { outdoor: true, theme: 'town', tier: 1 });
  const noise = makeNoise(77), n2 = makeNoise(78), rng = seededRng(79);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const e = noise(x / 14, y / 14, 3), f = n2(x / 7, y / 7, 2);
    let t = TR.GRASS;
    if (y > m.h - 6 - Math.floor(noise(x / 9, 0, 2) * 5)) t = TR.DEEP; // southern sea
    else if (y > m.h - 9 - Math.floor(noise(x / 9, 0, 2) * 5)) t = TR.SAND;
    else if (e < 0.32) t = TR.WATER; else if (e < 0.36) t = TR.SAND;
    else if (f > 0.62) t = TR.TREE; else if (f > 0.58 && rng() < 0.5) t = TR.TREE;
    else if (e > 0.72 && rng() < 0.6) t = TR.ROCK;
    if (x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1) t = TR.TREE;
    mSet(m, x, y, t);
  }
  // clear and stamp the town
  const tw = TOWN_ASCII[0].length, th = TOWN_ASCII.length, tx0 = TOWN_POS.x, ty0 = TOWN_POS.y;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const c = TOWN_ASCII[y][x]; const X = tx0 + x, Y = ty0 + y; let t = TR.GRASS;
    if (c === 'T') t = TR.TREE; else if (c === '#') t = TR.WALL; else if (c === '.') t = TR.ROAD; else if (c === '@') { t = TR.ROAD; m.start = { x: X + 0.5, y: Y + 2.5 }; m.objects.push({ kind: 'well', x: X, y: Y }); }
    else if (/[A-Z]/.test(c)) t = TR.ROOF;
    else if (/[a-z]/.test(c)) { t = TR.DOOR; const b = BUILDINGS[c]; if (b) m.objects.push({ kind: 'door', x: X, y: Y, building: c, name: b.name }); }
    mSet(m, X, Y, t);
  }
  m.town = { x0: tx0, y0: ty0, x1: tx0 + tw - 1, y1: ty0 + th - 1 };
  m.townSquare = { x: tx0 + 22.5, y: ty0 + 15.5 };
  // guild stalls, townsfolk, signs
  m.npcs.push({ id: 'guild_el', name: GUILDS.elemental.keeper, spr: GUILDS.elemental.spr, x: tx0 + 15.5, y: ty0 + 16.5, guild: 'elemental' });
  m.npcs.push({ id: 'guild_sp', name: GUILDS.spirit.keeper, spr: GUILDS.spirit.spr, x: tx0 + 29.5, y: ty0 + 16.5, guild: 'spirit' });
  m.npcs.push({ id: 'guard1', name: 'Town Guard', spr: 'LizardfolkSpearman', x: tx0 + 19.5, y: ty0 + 31.5, lines: ['The south gate leads to the beach. Mind the tide, and mind the lizardfolk in the eastern marsh.', 'Lord Harrow is in the hall, north of the square. He pays well for goblin heads.'], wander: 1 });
  m.npcs.push({ id: 'child', name: 'Pip', spr: 'HalflingSlinger', x: tx0 + 12.5, y: ty0 + 7.5, lines: ['Are you adventurers? My da says the Warrens up north are full of goblins and gold!', 'The scholar by the south road talks to himself. Mum says he lost his book.'], wander: 2 });
  m.npcs.push({ id: 'fisher', name: 'Nell the Fisher', spr: 'HalflingRanger', x: tx0 + 40.5, y: ty0 + 23.5, lines: ['Nothing bites since the Scepter went missing. The sea knows something is wrong.', 'The old barrow east of the marsh glows green at night. I do not fish near it.'], wander: 2 });
  m.npcs.push({ id: 'drunk', name: 'Hob', spr: 'SneakySatyr', x: tx0 + 36.5, y: ty0 + 17.5, lines: ['Tobbin waters the ale, I swear it. But his stew! Buy the stew.', 'Rest at the inn before you go anywhere. The roads are no place to sleep.'], wander: 1 });
  m.objects.push({ kind: 'sign', x: tx0 + 6, y: ty0 + 7, text: 'HARROWMERE. North: the Warrens road. West: the forest road. East: the marsh. Travellers, rest at the Drowsy Dragon.' });
  m.objects.push({ kind: 'sign', x: tx0 + 22, y: ty0 + 14, text: 'The town square. Guilds trade here by day: the Elements to the west, the Spirit to the east.' });
  for (const [x, y] of [[12, 15], [32, 15], [10, 23], [34, 24], [20, 2], [27, 2]]) m.lights.push({ x: tx0 + x + 0.5, y: ty0 + y + 0.5, r: 5, kind: 'lamp' });
  for (const [x, y] of [[12, 15], [32, 15], [10, 23], [34, 24], [20, 2], [27, 2]]) m.objects.push({ kind: 'brazier', x: tx0 + x, y: ty0 + y });
  // roads from the town gates to every entrance (carve road, trees removed)
  const gates = { north: [tx0 + 9, ty0 - 1], west: [tx0 - 1, ty0 + 15], east: [tx0 + tw, ty0 + 15], south: [tx0 + 19, ty0 + th] };
  const carveRoad = (ax, ay, bx, by) => {
    let x = ax, y = ay; const r2 = seededRng(ax * 31 + by);
    while (x !== bx || y !== by) {
      const dx = sign(bx - x), dy = sign(by - y);
      if (dx && dy) { if (r2() < 0.5) x += dx; else y += dy; } else { x += dx; y += dy; }
      for (let oy = 0; oy <= 1; oy++) for (let ox = 0; ox <= 1; ox++) { const t = mGet(m, x + ox, y + oy); if (t !== TR.WALL && t !== TR.ROOF && t !== TR.DOOR && t !== TR.DEEP) mSet(m, x + ox, y + oy, t === TR.WATER ? TR.ROAD : TR.ROAD); }
    }
  };
  // make sure the gates are open
  for (const g of Object.values(gates)) mSet(m, g[0], g[1], TR.ROAD);
  carveRoad(gates.north[0], gates.north[1], ENTRANCES.warrens[0], ENTRANCES.warrens[1] + 1);
  carveRoad(gates.west[0], gates.west[1], ENTRANCES.reliquary[0], ENTRANCES.reliquary[1] + 1);
  carveRoad(gates.east[0], gates.east[1], ENTRANCES.barrow[0], ENTRANCES.barrow[1] + 1);
  carveRoad(gates.east[0], gates.east[1] + 1, ENTRANCES.molten[0], ENTRANCES.molten[1] - 1);
  carveRoad(gates.south[0], gates.south[1], ENTRANCES.sanctum[0], ENTRANCES.sanctum[1] - 1);
  // entrances: a 3x3 stone pad with the door in the middle top
  for (const id in ENTRANCES) {
    const [ex, ey] = ENTRANCES[id];
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) mSet(m, ex + x, ey + y, TR.ROAD);
    for (let x = -1; x <= 1; x++) mSet(m, ex + x, ey - 1, TR.WALL);
    mSet(m, ex, ey, TR.DOOR);
    m.objects.push({ kind: 'entrance', x: ex, y: ey, dungeon: id, name: DUNGEONS[id].name });
    m.exits.push({ x: ex, y: ey, to: id });
  }
  // monster camps
  for (const [cx, cy, r, list, n] of CAMPS) for (let i = 0; i < n; i++) m.monsters.push({ kind: list[i % list.length], x: cx + (rng() - 0.5) * r * 2, y: cy + (rng() - 0.5) * r * 2, group: cx + ',' + cy });
  // marsh herbs (quest) in the east marsh, ore nowhere here
  for (let i = 0; i < 7; i++) m.objects.push({ kind: 'pickup', x: 78 + Math.floor(rng() * 20), y: 36 + Math.floor(rng() * 22), item: 'marsh_herb', id: 'herb' + i });
  // a few treasure chests in the wilds
  for (const [x, y, tier] of [[20, 20, 1], [62, 8, 1], [8, 28, 2], [96, 12, 2], [96, 58, 3], [38, 74, 2], [72, 72, 3], [12, 70, 2]]) m.objects.push({ kind: 'chest', x, y, tier, id: 'oc' + x + ',' + y });
  m.monsters = m.monsters.filter(mo => !(mo.x >= m.town.x0 - 1 && mo.x <= m.town.x1 + 1 && mo.y >= m.town.y0 - 1 && mo.y <= m.town.y1 + 1));
  cleanOverworld(m);
  return m;
}
function cleanOverworld(m) {
  // keep objects and monsters on passable ground; nudge them to nearest passable cell
  const fix = o => { if (mPass(m, o.x | 0, o.y | 0)) return; for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (mPass(m, (o.x | 0) + dx, (o.y | 0) + dy)) { o.x = (o.x | 0) + dx + (o.x % 1 || 0); o.y = (o.y | 0) + dy + (o.y % 1 || 0); return; } };
  m.objects.forEach(o => { if (o.kind !== 'door' && o.kind !== 'entrance') fix(o); }); m.monsters.forEach(fix); m.npcs.forEach(fix);
  for (const o of m.objects) if (o.kind === 'chest' || o.kind === 'pickup') { o.x = (o.x | 0); o.y = (o.y | 0); }
}

// ---------- dungeon generator ----------
function buildDungeon(id) {
  const d = DUNGEONS[id], rng = seededRng(d.seed);
  const m = newMap(id, d.name, d.w, d.h, { theme: d.theme, tier: d.tier, outdoor: false });
  m.t.fill(TR.WALL);
  const rooms = [];
  for (let tries = 0; tries < 400 && rooms.length < d.rooms; tries++) {
    const rw = 4 + Math.floor(rng() * 7), rh = 4 + Math.floor(rng() * 6), x = 2 + Math.floor(rng() * (m.w - rw - 4)), y = 2 + Math.floor(rng() * (m.h - rh - 4));
    if (rooms.some(r => x < r.x + r.w + 2 && x + rw + 2 > r.x && y < r.y + r.h + 2 && y + rh + 2 > r.y)) continue;
    rooms.push({ x, y, w: rw, h: rh, cx: x + Math.floor(rw / 2), cy: y + Math.floor(rh / 2) });
  }
  rooms.sort((a, b) => a.cx - b.cx);
  const carve = (x, y) => { if (x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1) mSet(m, x, y, TR.FLOOR); };
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y);
  // connect sequential rooms with 2-wide L corridors, plus a few extra links
  const link = (a, b) => { let x = a.cx, y = a.cy; const horizFirst = rng() < 0.5; const go = (tx, ty) => { while (x !== tx) { carve(x, y); carve(x, y + 1); x += sign(tx - x); } while (y !== ty) { carve(x, y); carve(x + 1, y); y += sign(ty - y); } carve(x, y); carve(x + 1, y); carve(x, y + 1); }; if (horizFirst) go(b.cx, b.cy); else { go(x, b.cy); go(b.cx, b.cy); } };
  for (let i = 0; i + 1 < rooms.length; i++) link(rooms[i], rooms[i + 1]);
  for (let i = 0; i < Math.floor(rooms.length / 3); i++) link(rooms[Math.floor(rng() * rooms.length)], rooms[Math.floor(rng() * rooms.length)]);
  // entrance in the first room, boss in the largest room far from it
  const first = rooms[0];
  m.start = { x: first.cx + 0.5, y: first.cy + 0.5 };
  m.objects.push({ kind: 'stairs', x: first.cx, y: first.cy - 1, to: 'over' });
  mSet(m, first.cx, first.cy - 1, TR.FLOOR);
  m.exits.push({ x: first.cx, y: first.cy - 1, to: 'over', tx: ENTRANCES[id][0], ty: ENTRANCES[id][1] + 1 });
  const far = rooms.slice(1).sort((a, b) => (dist(b.cx, b.cy, first.cx, first.cy) * b.w * b.h) - (dist(a.cx, a.cy, first.cx, first.cy) * a.w * a.h))[0];
  far.boss = true;
  // lava pools in the molten gallery
  if (d.lava) for (const r of rooms) if (!r.boss && r !== first && r.w >= 6 && r.h >= 5 && rng() < 0.6) { for (let y = r.y + 1; y < r.y + r.h - 1; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (rng() < 0.5 && !(x === r.cx || y === r.cy)) mSet(m, x, y, TR.LAVA); }
  // monsters, chests, decor
  let itemQueue = d.items.slice();
  rooms.forEach((r, i) => {
    const area = r.w * r.h;
    if (r.boss) {
      m.monsters.push({ kind: d.boss, x: r.cx + 0.5, y: r.cy + 0.5, boss: true, drop: d.drop });
      for (let k = 0; k < 2; k++) m.monsters.push({ kind: d.pool[Math.floor(rng() * d.pool.length)], x: r.x + 1 + rng() * (r.w - 2), y: r.y + 1 + rng() * (r.h - 2) });
      m.objects.push({ kind: 'chest', x: r.x + r.w - 1, y: r.y + r.h - 1, tier: d.tier + 1, id: id + 'boss', big: true });
      for (const [dx, dy] of [[0, 0], [r.w - 1, 0], [0, r.h - 1]]) m.objects.push({ kind: 'brazier', x: r.x + dx, y: r.y + dy });
      for (const [dx, dy] of [[0, 0], [r.w - 1, 0], [0, r.h - 1]]) m.lights.push({ x: r.x + dx + 0.5, y: r.y + dy + 0.5, r: 5 });
      return;
    }
    if (i > 0) { const n = Math.min(5, 1 + Math.floor(area / 14) + (rng() < 0.4 ? 1 : 0)); for (let k = 0; k < n; k++) m.monsters.push({ kind: d.pool[Math.floor(rng() * d.pool.length)], x: r.x + 1 + rng() * Math.max(1, r.w - 2), y: r.y + 1 + rng() * Math.max(1, r.h - 2), group: 'r' + i }); }
    if (rng() < 0.55 || itemQueue.length) { const cx = r.x + Math.floor(rng() * r.w), cy = r.y + Math.floor(rng() * r.h); const ch = { kind: 'chest', x: cx, y: cy, tier: d.tier, id: id + 'c' + i }; if (itemQueue.length && i > 0) ch.item = itemQueue.shift(); m.objects.push(ch); }
    if (rng() < 0.7) { m.objects.push({ kind: 'brazier', x: r.x, y: r.y }); m.lights.push({ x: r.x + 0.5, y: r.y + 0.5, r: 4.5 }); }
    if (rng() < 0.5) m.objects.push({ kind: 'deco', x: r.x + r.w - 1, y: r.y + r.h - 1, spr: pick(['pot', 'bones', 'barrel', 'rock', 'skull', 'crate']) });
    if (rng() < 0.3) m.objects.push({ kind: 'pot', x: r.x + r.w - 1, y: r.y, id: id + 'p' + i });
  });
  // leftover quest items go to the boss chest
  if (itemQueue.length) { const bc = m.objects.find(o => o.id === id + 'boss'); bc.item = itemQueue.shift(); }
  // make sure spawn cells are floor (lava avoidance)
  for (const mo of m.monsters) if (!mPass(m, mo.x | 0, mo.y | 0)) { const r = rooms.find(r => (mo.x | 0) >= r.x && (mo.x | 0) < r.x + r.w && (mo.y | 0) >= r.y && (mo.y | 0) < r.y + r.h); if (r) { mo.x = r.cx + 0.5; mo.y = r.cy + 0.5; } }
  for (const o of m.objects) if (!mPass(m, o.x, o.y) && o.kind !== 'stairs') { mSet(m, o.x, o.y, TR.FLOOR); }
  return m;
}
function getMap(id) { if (!MAPS[id]) MAPS[id] = id === 'over' ? buildOverworld() : buildDungeon(id); return MAPS[id]; }
