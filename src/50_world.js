// ===== World definition: zones, enemies, items, map builder =====
const ENEMY_DEFS = {
  // tier 1 - Undercroft
  ScarecrowGolem: { name: 'Scarecrow Husk', hp: 26, dmg: [4, 8], spd: 1.2, souls: 18, size: 0.9, behav: 'melee', poise: 0, color: '#c9a86b' },
  GoblinFighter: { name: 'Goblin Cutthroat', hp: 34, dmg: [6, 11], spd: 1.9, souls: 32, size: 0.85, behav: 'melee', poise: 0, cd: 1.3 },
  GoblinArcher: { name: 'Goblin Archer', hp: 24, dmg: [6, 10], spd: 1.6, souls: 34, size: 0.85, behav: 'ranged', proj: 'arrow', range: 7, poise: 0 },
  HungryMimic: { name: 'Mimic', hp: 95, dmg: [14, 22], spd: 1.1, souls: 160, size: 0.95, behav: 'melee', poise: 20, mimic: true, cd: 1.1 },
  StoneGolem: { name: 'Crypt Warden', hp: 130, dmg: [12, 18], spd: 0.8, souls: 220, size: 1.15, behav: 'melee', poise: 40, unique: true },
  BestialMinotaur: { name: 'Asterion, Warden of the Undercroft', hp: 620, dmg: [20, 32], spd: 1.7, souls: 1500, size: 1.75, behav: 'melee', poise: 999, boss: true, special: 'charge', cd: 1.6 },
  // tier 2 - Mossgrave
  CorruptedTreant: { name: 'Blighted Treant', hp: 72, dmg: [10, 16], spd: 0.9, souls: 60, size: 1.0, behav: 'melee', poise: 15 },
  SneakySatyr: { name: 'Satyr Trickster', hp: 44, dmg: [8, 13], spd: 2.3, souls: 55, size: 0.9, behav: 'melee', poise: 0, cd: 1.1 },
  GoblinOccultist: { name: 'Goblin Occultist', hp: 40, dmg: [10, 15], spd: 1.5, souls: 70, size: 0.85, behav: 'ranged', proj: 'darkbolt', range: 7, poise: 0 },
  GreenNaga: { name: 'Grave Naga', hp: 115, dmg: [14, 20], spd: 1.3, souls: 125, size: 1.05, behav: 'melee', poise: 25, venom: true },
  GoblinWolfRider: { name: 'Wolf Rider', hp: 62, dmg: [11, 16], spd: 2.6, souls: 85, size: 0.95, behav: 'melee', poise: 5, cd: 1.0 },
  GelatinousCube: { name: 'Gelatinous Cube', hp: 170, dmg: [12, 18], spd: 0.55, souls: 140, size: 1.15, behav: 'melee', poise: 60 },
  NatureElemental: { name: 'Mossheart', hp: 220, dmg: [16, 24], spd: 1.0, souls: 420, size: 1.3, behav: 'melee', poise: 50, unique: true },
  GrizzledTreant: { name: 'The Rotten Elder', hp: 1200, dmg: [24, 36], spd: 0.85, souls: 3200, size: 1.95, behav: 'melee', poise: 999, boss: true, special: 'summon', summon: 'CorruptedTreant', cd: 1.9 },
  // tier 3 - Frozen Reliquary
  IceGolem: { name: 'Rime Golem', hp: 135, dmg: [16, 24], spd: 0.95, souls: 165, size: 1.1, behav: 'melee', poise: 35 },
  CapableCryomancer: { name: 'Cryomancer', hp: 72, dmg: [14, 20], spd: 1.3, souls: 150, size: 0.9, behav: 'ranged', proj: 'icebolt', range: 8, poise: 0, chill: true },
  BlinkDog: { name: 'Blink Hound', hp: 62, dmg: [12, 18], spd: 2.2, souls: 135, size: 0.8, behav: 'melee', poise: 0, blink: true, cd: 1.0 },
  WaterElemental: { name: 'Water Elemental', hp: 115, dmg: [15, 22], spd: 1.4, souls: 175, size: 1.0, behav: 'melee', poise: 20 },
  FrostMagus: { name: 'Frost Magus', hp: 95, dmg: [18, 26], spd: 1.2, souls: 230, size: 0.95, behav: 'ranged', proj: 'icebolt', range: 8, poise: 5, volley: 3, chill: true },
  MithrilConstruct: { name: 'Sentinel of the Reliquary', hp: 2000, dmg: [28, 42], spd: 1.15, souls: 6500, size: 1.95, behav: 'melee', poise: 999, boss: true, special: 'slam', cd: 1.8 },
  // tier 4 - Molten Gallery
  FireElemental: { name: 'Fire Elemental', hp: 150, dmg: [20, 28], spd: 1.5, souls: 240, size: 1.0, behav: 'melee', poise: 15, emissive: true },
  NovicePyromancer: { name: 'Pyromancer', hp: 92, dmg: [20, 30], spd: 1.3, souls: 235, size: 0.9, behav: 'ranged', proj: 'firebolt', range: 8, poise: 0 },
  FlameMagus: { name: 'Flame Magus', hp: 125, dmg: [22, 32], spd: 1.2, souls: 310, size: 0.95, behav: 'ranged', proj: 'firebolt', range: 8, poise: 5, volley: 3 },
  ObsidianGolem: { name: 'Obsidian Golem', hp: 270, dmg: [26, 36], spd: 0.8, souls: 410, size: 1.2, behav: 'melee', poise: 60 },
  BrassGolem: { name: 'Brass Golem', hp: 210, dmg: [22, 32], spd: 1.0, souls: 360, size: 1.15, behav: 'melee', poise: 45 },
  MoltenEfreeti: { name: 'Ifrit of the Brass Gate', hp: 3200, dmg: [34, 50], spd: 1.45, souls: 13000, size: 2.0, behav: 'ranged', proj: 'firebolt', range: 9, volley: 3, poise: 999, boss: true, special: 'charge', emissive: true, cd: 1.5 },
  // tier 5 - Cosmic Sanctum
  ConjuringBeholder: { name: 'Beholder', hp: 250, dmg: [28, 40], spd: 1.0, souls: 620, size: 1.1, behav: 'ranged', proj: 'darkbolt', range: 9, volley: 3, poise: 30, zoff: 0.35 },
  MasterIllusionist: { name: 'Illusionist', hp: 125, dmg: [26, 36], spd: 1.3, souls: 460, size: 0.95, behav: 'ranged', proj: 'darkbolt', range: 8, poise: 0, blink: true },
  GraniteGargoyle: { name: 'Gargoyle', hp: 225, dmg: [26, 36], spd: 1.9, souls: 510, size: 1.05, behav: 'melee', poise: 40 },
  AirElemental: { name: 'Air Elemental', hp: 185, dmg: [24, 34], spd: 2.3, souls: 490, size: 1.0, behav: 'melee', poise: 10, zoff: 0.2 },
  AdeptNecromancer: { name: 'Necromancer', hp: 155, dmg: [24, 34], spd: 1.1, souls: 660, size: 0.95, behav: 'ranged', proj: 'darkbolt', range: 8, poise: 5, summon: 'ScarecrowGolem' },
  VileWitch: { name: 'Vile Witch', hp: 145, dmg: [26, 38], spd: 1.3, souls: 530, size: 0.95, behav: 'ranged', proj: 'venombolt', range: 8, poise: 5, venom: true },
  FleshGolem: { name: 'Flesh Golem', hp: 310, dmg: [28, 40], spd: 1.05, souls: 430, size: 1.2, behav: 'melee', poise: 70 },
  PowerfulDjinn: { name: 'Djinn of the Last Wish', hp: 950, dmg: [30, 42], spd: 1.6, souls: 4000, size: 1.5, behav: 'ranged', proj: 'darkbolt', range: 8, poise: 300, unique: true, blink: true },
  AdamantiumGolem: { name: 'The Ashen King', hp: 5600, dmg: [40, 58], spd: 1.3, souls: 60000, size: 2.2, behav: 'melee', poise: 999, boss: true, special: 'slam', summon: 'FleshGolem', enrage: 0.4, cd: 1.7 },
  // extras
  FluttringPixie: null,
};
delete ENEMY_DEFS.FluttringPixie;

const ZONES = [
  { id: 'under', name: 'The Undercroft', theme: 'stone', floors: 'stone', ambient: 0.05, keyName: 'Undercroft Key' },
  { id: 'moss', name: 'Mossgrave Catacombs', theme: 'moss', floors: 'moss', ambient: 0.04 },
  { id: 'ice', name: 'The Frozen Reliquary', theme: 'ice', floors: 'ice', ambient: 0.08 },
  { id: 'ember', name: 'The Molten Gallery', theme: 'ember', floors: 'ember', ambient: 0.12 },
  { id: 'cosmic', name: 'The Cosmic Sanctum', theme: 'cosmic', floors: 'cosmic', ambient: 0.06 },
  { id: 'cistern', name: 'The Sunken Cistern', theme: 'slime', floors: 'slime', ambient: 0.05 },
  { id: 'crypt', name: 'Chapel of the Hollow Crown', theme: 'crypt', floors: 'crypt', ambient: 0.03 },
  { id: 'cathedral', name: 'Cathedral of Ash', theme: 'grey', floors: 'grey', ambient: 0.05 },
];
const ZONE_BY_ID = {}; ZONES.forEach((z, i) => { z.idx = i; ZONE_BY_ID[z.id] = z; });

const ITEM_DEFS = {
  ember: { name: 'Ember', icon: 'fire', lore: 'A smouldering ember, still warm with the memory of a greater flame. Strengthens the Estus Flask by one draught.', use: 'estus+' },
  key_reliquary: { name: 'Reliquary Key', icon: 'key_silver', lore: 'A key of frosted silver, taken from the roots of the Rotten Elder. Opens the sealed door beneath the Undercroft.' },
  key_brass: { name: 'Brass Gate Key', icon: 'key_gold', lore: 'The Ifrit guarded this key for an age. It opens the Brass Gate to the Sanctum.' },
  soul_small: { name: 'Soul of a Lost Pilgrim', icon: 'soulglow', lore: 'The soul of one who came seeking the Mandate and found only the dark. Use to gain 300 souls.', souls: 300 },
  soul_large: { name: 'Soul of a Nameless Knight', icon: 'soulglow', lore: 'A knight of the old order. He did not kneel. Use to gain 1500 souls.', souls: 1500 },
  soul_huge: { name: 'Soul of the Forsaken Queen', icon: 'soulglow', lore: 'She wore the crown while the king slept. Use to gain 5000 souls.', souls: 5000 },
  heart: { name: 'Humanity', icon: 'heart', lore: 'A warm, beating thing. Raises the maximum health of every living companion by a small measure.', use: 'hp+' },
  gem_red: { name: 'Ruby of Might', icon: 'gem_red', lore: 'Light caught in red stone. Grants +1 Might to every companion.', stat: 'mt' },
  gem_blue: { name: 'Sapphire of Wit', icon: 'gem_blue', lore: 'Cold and clear. Grants +1 Intellect to every companion.', stat: 'it' },
  gem_green: { name: 'Emerald of Vigour', icon: 'gem_green', lore: 'It pulses faintly. Grants +1 Endurance to every companion.', stat: 'en' },
  gem_purple: { name: 'Amethyst of Haste', icon: 'gem_purple', lore: 'Swift as thought. Grants +1 Speed to every companion.', stat: 'sp' },
  titanite: { name: 'Titanite Shard', icon: 'rock', lore: 'A shard of the stone that fell with the first light. Reinforces the party\'s weapons.', use: 'weapon+' },
  crown: { name: 'The Hollow Crown', icon: 'trophy', lore: 'The crown of the Ashen King. It is lighter than it looks, and heavier than it should be.' },
};

// map builder --------------------------------------------------------
const MW = 64, MH = 80;
const WORLD = { w: MW, h: MH, grid: null, zoneOf: null, objects: [], spawns: [], lore: {}, bosses: [] };
function buildWorldGrid() {
  const g = new Array(MW * MH).fill(' '), zo = new Uint8Array(MW * MH);
  const at = (x, y) => g[y * MW + x];
  const set = (x, y, c) => { g[y * MW + x] = c; };
  let curZone = 0;
  const zone = id => { curZone = ZONE_BY_ID[id].idx; };
  const carve = (x0, y0, x1, y1, c = '.') => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { set(x, y, c); zo[y * MW + x] = curZone; } };
  const put = (x, y, c) => { set(x, y, c); zo[y * MW + x] = curZone; };
  const puts = (c, ...pts) => pts.forEach(([x, y]) => put(x, y, c));
  const obj = (type, x, y, extra) => WORLD.objects.push(Object.assign({ type, x, y, zone: curZone }, extra));
  const spawn = (kind, x, y, extra) => WORLD.spawns.push(Object.assign({ kind, x, y, zone: curZone }, extra));
  const lore = (x, y, text) => { put(x, y, '?'); WORLD.lore[x + ',' + y] = text; };
  const item = (x, y, id) => obj('item', x, y, { item: id });
  const chest = (x, y, loot, big) => obj('chest', x, y, { loot, big: !!big });

  // ================= THE UNDERCROFT (0-27, 0-27) =================
  zone('under');
  // awakening cell
  carve(2, 2, 4, 4); put(3, 3, 'P'); put(3, 5, 'D');
  obj('deco', 2.5, 2.5, { spr: 'bones' }); obj('deco', 4.5, 2.5, { spr: 'skull' });
  lore(4, 4, 'The cell door hangs open. Someone, or something, wanted you to leave.');
  // corridor down to hub
  carve(3, 6, 3, 9); carve(3, 9, 9, 9);
  obj('torch', 3.5, 7.5, {}); obj('torch', 6.5, 9.5, {});
  spawn('ScarecrowGolem', 5.5, 9.5);
  // hub room with bonfire and keeper
  carve(9, 9, 17, 17);
  put(13, 13, 'b'); obj('npc', 14.5, 11.5, { npc: 'keeper' });
  obj('torch', 9.5, 10.5, {}); obj('torch', 17.5, 10.5, {}); obj('torch', 9.5, 16.5, {}); obj('torch', 17.5, 16.5, {});
  obj('deco', 10.5, 9.5, { spr: 'statue' }); obj('deco', 16.5, 9.5, { spr: 'statue' });
  obj('deco', 10.5, 17.5, { spr: 'pot' }); obj('deco', 16.5, 17.5, { spr: 'pot_dark' });
  lore(13, 10, 'Bonfire of the Undercroft. Rest here, and the dark will forget you for a while.');
  // north treasure room
  carve(11, 7, 11, 8); carve(9, 2, 15, 6);
  spawn('ScarecrowGolem', 10.5, 3.5); spawn('ScarecrowGolem', 14.5, 5.5); spawn('GoblinFighter', 12.5, 3.5, { home: true });
  chest(13.5, 2.5, { souls: 120 }); obj('breakable', 9.5, 5.5, { spr: 'pot' }); obj('breakable', 15.5, 2.5, { spr: 'pot_gold' });
  obj('torch', 12.5, 2.5, {}); obj('deco', 9.5, 2.5, { spr: 'barrel' });
  item(11.5, 5.5, 'soul_small');
  // west wing: goblin warren + mimic
  carve(8, 14, 8, 14); carve(1, 11, 7, 19);
  puts('#', [4, 13], [4, 14], [4, 15], [4, 16]);
  spawn('GoblinFighter', 2.5, 12.5); spawn('GoblinArcher', 6.5, 18.5); spawn('GoblinFighter', 2.5, 18.5); spawn('GoblinArcher', 2.5, 15.5);
  spawn('HungryMimic', 6.5, 12.5);
  chest(1.5, 11.5, { souls: 80 }); obj('deco', 6.5, 11.5, { spr: 'crate' }); obj('deco', 1.5, 18.5, { spr: 'barrel2' });
  obj('torch', 7.5, 15.5, {}); obj('brazier', 1.5, 14.5, { spr: 'brazier_red' });
  lore(7, 19, 'Chests have teeth here. Count their locks before you count their gold.');
  item(5.5, 16.5, 'gem_green');
  // east: fog gate and minotaur arena
  carve(18, 13, 20, 13); put(21, 13, 'F');
  obj('torch', 19.5, 12.5, {});
  carve(22, 8, 26, 18); put(27, 13, 'D');
  spawn('BestialMinotaur', 24.5, 12.5, { boss: true, arena: 'under', gates: [[21, 13]] });
  obj('brazier', 22.5, 8.5, { spr: 'brazier_red' }); obj('brazier', 26.5, 8.5, { spr: 'brazier_red' }); obj('brazier', 22.5, 18.5, { spr: 'brazier_red' }); obj('brazier', 26.5, 18.5, { spr: 'brazier_red' });
  obj('deco', 24.5, 8.5, { spr: 'skull_dark' }); obj('deco', 23.5, 18.5, { spr: 'bones' });
  // south: corridor to locked reliquary door
  carve(13, 18, 13, 24); put(13, 25, 'K'); carve(13, 26, 13, 29);
  obj('torch', 13.5, 20.5, {}); obj('torch', 13.5, 23.5, {});
  spawn('StoneGolem', 13.5, 22.5, { unique: true });
  lore(12, 24, 'Sealed by the Reliquary\'s key. The Elder of Mossgrave holds it in his roots.');
  // shortcut corridor from hub SE to Mossgrave (gate opened from the far side)
  carve(18, 16, 26, 16); carve(26, 17, 26, 20); put(27, 20, 'G');
  obj('torch', 22.5, 15.5, {});
  // crypt chapel (dark side area, Crypt Warden guards a soul)
  zone('crypt');
  carve(19, 2, 25, 6); carve(19, 7, 19, 12); carve(18, 11, 18, 11);
  // link hub NE corner to chapel corridor
  zone('under'); carve(18, 11, 18, 11);
  zone('crypt');
  spawn('GoblinArcher', 20.5, 3.5); spawn('GoblinFighter', 24.5, 5.5); spawn('ScarecrowGolem', 22.5, 2.5);
  obj('deco', 19.5, 2.5, { spr: 'coffin' }); obj('deco', 25.5, 2.5, { spr: 'coffin_dark' }); obj('deco', 22.5, 2.5, { spr: 'altar' });
  obj('brazier', 20.5, 6.5, { spr: 'brazier_purple' }); obj('brazier', 24.5, 6.5, { spr: 'brazier_purple' });
  chest(22.5, 3.5, { item: 'soul_large' }, true);
  lore(20, 12, 'Chapel of the Hollow Crown. They buried the queen standing, so she could keep watching the door.');

  // ================= MOSSGRAVE CATACOMBS (28-63, 0-27) =================
  zone('moss');
  carve(28, 13, 31, 13); carve(32, 9, 41, 18); // graveyard hall
  obj('torch', 29.5, 12.5, {});
  for (const [x, y] of [[33, 10], [35, 10], [37, 10], [39, 10], [33, 17], [35, 17], [37, 17], [39, 17]]) obj('deco', x + 0.5, y + 0.5, { spr: hash2(x, y) > 0.5 ? 'grave' : 'grave2' });
  obj('deco', 36.5, 13.5, { spr: 'coffin_open' }); obj('deco', 34.5, 11.5, { spr: 'bigpot_moss' }); obj('deco', 40.5, 14.5, { spr: 'bush' });
  spawn('CorruptedTreant', 34.5, 12.5); spawn('CorruptedTreant', 39.5, 15.5); spawn('SneakySatyr', 37.5, 11.5); spawn('GoblinOccultist', 40.5, 10.5); spawn('SneakySatyr', 33.5, 16.5);
  obj('brazier', 32.5, 9.5, { spr: 'brazier_green' }); obj('brazier', 41.5, 18.5, { spr: 'brazier_green' });
  obj('breakable', 41.5, 9.5, { spr: 'pot' }); obj('breakable', 32.5, 18.5, { spr: 'pot' });
  lore(32, 16, 'Mossgrave. The dead here were planted, not buried. Mind the roots.');
  // shortcut lever corridor back to Undercroft gate
  carve(29, 18, 31, 18); carve(29, 19, 29, 20); carve(28, 20, 28, 20); obj('lever', 29.5, 20.5, { gate: [27, 20] });
  spawn('GoblinOccultist', 30.5, 18.5);
  // north: to bonfire
  carve(36, 4, 36, 8); carve(42, 3, 47, 7); carve(37, 5, 41, 5);
  put(44, 5, 'b'); obj('torch', 42.5, 3.5, {}); obj('torch', 47.5, 3.5, {});
  obj('deco', 42.5, 7.5, { spr: 'bush' }); obj('deco', 47.5, 7.5, { spr: 'bush_yellow' });
  spawn('SneakySatyr', 38.5, 5.5); spawn('GoblinWolfRider', 36.5, 6.5);
  lore(47, 5, 'A bonfire among the roots. Even the Elder will not come this close to it.');
  // east crypt: naga and cube, items
  carve(48, 5, 49, 5); carve(50, 2, 60, 10);
  puts('#', [54, 4], [55, 4], [56, 4], [54, 8], [55, 8], [56, 8]);
  spawn('GreenNaga', 52.5, 3.5); spawn('GelatinousCube', 58.5, 6.5); spawn('GoblinOccultist', 55.5, 6.5); spawn('GoblinWolfRider', 51.5, 8.5); spawn('CorruptedTreant', 58.5, 2.5);
  chest(59.5, 9.5, { souls: 400 }); item(50.5, 9.5, 'heart'); obj('breakable', 52.5, 9.5, { spr: 'pot_gold' });
  obj('brazier', 50.5, 2.5, { spr: 'brazier_green' }); obj('brazier', 60.5, 2.5, { spr: 'brazier_green' });
  obj('deco', 55.5, 2.5, { spr: 'coffin' }); obj('deco', 55.5, 9.5, { spr: 'bigpot' });
  lore(60, 10, 'The Mossheart sleeps in the deep cistern. Its roots drink from something older than water.');
  // boss approach and arena
  carve(42, 8, 42, 18); carve(42, 19, 48, 19); put(49, 19, 'F'); carve(50, 14, 61, 24); put(50, 25, 'G'); obj('lever', 51.5, 23.5, { gate: [50, 25] }); // south gate leads to cistern
  spawn('CorruptedTreant', 42.5, 15.5); obj('torch', 44.5, 18.5, {}); obj('torch', 47.5, 18.5, {});
  spawn('GrizzledTreant', 56.5, 19.5, { boss: true, arena: 'moss', gates: [[49, 19]] });
  obj('deco', 51.5, 14.5, { spr: 'bush' }); obj('deco', 60.5, 14.5, { spr: 'bush' }); obj('deco', 51.5, 23.5, { spr: 'rock_moss' }); obj('deco', 60.5, 23.5, { spr: 'bush_yellow' });
  obj('brazier', 55.5, 14.5, { spr: 'brazier_green' }); obj('brazier', 57.5, 14.5, { spr: 'brazier_green' });
  chest(60.5, 20.5, { item: 'key_reliquary' }, true);
  item(52.5, 22.5, 'titanite');
  // ---- Sunken Cistern (optional loop under Mossgrave) ----
  zone('cistern');
  carve(50, 26, 50, 26); carve(44, 26, 50, 26); carve(44, 20, 44, 25); // cistern loops back to the boss approach
  puts('w', [46, 26], [47, 26], [48, 26]);
  spawn('GelatinousCube', 47.5, 26.5); spawn('GreenNaga', 44.5, 23.5);
  spawn('NatureElemental', 50.5, 26.5, { unique: true });
  item(44.5, 26.5, 'ember');
  lore(43, 25, 'The Sunken Cistern. What the Mossheart guards, it guards jealously.');

  // ================= FROZEN RELIQUARY (0-27, 28-55) =================
  zone('ice');
  carve(13, 29, 13, 31); carve(6, 31, 13, 31); carve(3, 30, 8, 35); put(5, 33, 'b');
  obj('torch', 3.5, 30.5, {}); obj('torch', 8.5, 30.5, {}); obj('brazier', 3.5, 35.5, { spr: 'brazier_blue' }); obj('brazier', 8.5, 35.5, { spr: 'brazier_blue' });
  lore(7, 34, 'The Frozen Reliquary. The Sentinel does not sleep. It only waits.');
  // ice halls
  carve(5, 36, 5, 40); carve(2, 40, 12, 44); puts('w', [6, 41], [7, 41], [8, 41], [6, 42], [7, 42], [8, 42]);
  spawn('IceGolem', 3.5, 43.5); spawn('CapableCryomancer', 11.5, 41.5); spawn('BlinkDog', 10.5, 43.5); spawn('WaterElemental', 7.5, 40.5);
  obj('deco', 2.5, 40.5, { spr: 'rock' }); obj('deco', 12.5, 44.5, { spr: 'alcove_statue' }); obj('breakable', 2.5, 44.5, { spr: 'pot' });
  obj('brazier', 7.5, 44.5, { spr: 'brazier_blue' });
  chest(11.5, 40.5, { souls: 700 });
  // long gallery east
  carve(13, 42, 13, 42); carve(14, 36, 24, 40);
  puts('#', [18, 38], [19, 38], [20, 38]);
  carve(14, 38, 14, 41);
  spawn('FrostMagus', 22.5, 37.5); spawn('IceGolem', 16.5, 39.5); spawn('BlinkDog', 23.5, 39.5); spawn('CapableCryomancer', 17.5, 36.5);
  obj('torch', 15.5, 35.5, {}); obj('torch', 23.5, 35.5, {}); obj('deco', 24.5, 36.5, { spr: 'coffin_dark' }); obj('deco', 14.5, 36.5, { spr: 'statue' });
  item(24.5, 40.5, 'gem_blue'); obj('breakable', 20.5, 39.5, { spr: 'pot_dark' });
  lore(16, 36, 'Pilgrims froze here mid-prayer. The Sentinel let them finish.');
  // shortcut gate from arena approach back to bonfire halls
  carve(9, 45, 9, 46); put(9, 47, 'G'); carve(9, 48, 13, 48);
  // arena
  carve(14, 47, 14, 47); put(14, 47, 'F'); carve(13, 44, 13, 47);
  carve(24, 41, 24, 43); carve(20, 43, 24, 43); carve(20, 44, 20, 46); // winding approach
  carve(15, 43, 25, 52); // arena
  obj('lever', 10.5, 48.5, { gate: [9, 47] });
  spawn('MithrilConstruct', 20.5, 48.5, { boss: true, arena: 'ice', gates: [[14, 47]] });
  for (const [x, y] of [[15, 43], [25, 43], [15, 52], [25, 52]]) obj('brazier', x + 0.5, y + 0.5, { spr: 'brazier_blue' });
  obj('deco', 20.5, 43.5, { spr: 'alcove_statue' }); obj('deco', 16.5, 51.5, { spr: 'bones' }); obj('deco', 24.5, 51.5, { spr: 'skull' });
  chest(24.5, 45.5, { item: 'soul_large' }, true);
  // exit east to the molten gallery
  carve(26, 48, 27, 48); put(27, 48, 'D');
  spawn('WaterElemental', 22.5, 43.5); spawn('IceGolem', 20.5, 45.5, { sleep: true });

  // ================= MOLTEN GALLERY (28-63, 28-55) =================
  zone('ember');
  carve(28, 48, 30, 48); carve(31, 44, 36, 49); put(33, 46, 'b');
  obj('torch', 31.5, 43.5, {}); obj('torch', 36.5, 43.5, {}); obj('deco', 31.5, 49.5, { spr: 'rock_ember' }); obj('deco', 36.5, 49.5, { spr: 'rock_lava' });
  lore(35, 48, 'The Molten Gallery. The Ifrit forged the Brass Gate, and then forgot what it was for.');
  // lava lake hall (main path)
  carve(33, 36, 33, 43); carve(38, 30, 60, 42);
  carve(33, 36, 37, 36);
  // lava pools
  for (let y = 32; y <= 40; y++) for (let x = 41; x <= 57; x++) if (!((x >= 48 && x <= 50) || y === 36 || (x >= 41 && x <= 43 && y >= 34 && y <= 38) || (x >= 55 && x <= 57 && y >= 34 && y <= 38))) put(x, y, '~');
  puts('.', [45, 33], [46, 33], [52, 39], [53, 39]);
  spawn('FireElemental', 44.5, 36.5); spawn('FireElemental', 54.5, 36.5); spawn('NovicePyromancer', 42.5, 34.5); spawn('NovicePyromancer', 56.5, 38.5); spawn('ObsidianGolem', 49.5, 33.5); spawn('BrassGolem', 49.5, 39.5); spawn('FlameMagus', 59.5, 31.5);
  obj('deco', 38.5, 30.5, { spr: 'rock_lava' }); obj('deco', 60.5, 30.5, { spr: 'rock_ember' }); obj('deco', 38.5, 42.5, { spr: 'bigpot_pattern' });
  chest(59.5, 41.5, { souls: 1500 }); item(38.5, 41.5, 'gem_red'); item(49.5, 36.5, 'soul_large');
  lore(39, 30, 'The lake does not cool. Walk the stone spines, and do not look down for long.');
  // boss approach from lake SE down to arena
  carve(58, 43, 58, 44); carve(45, 44, 58, 44); put(47, 45, 'F'); // arena below
  carve(40, 48, 46, 48); carve(45, 45, 45, 47); put(40, 48, 'G'); carve(37, 48, 39, 48); obj('lever', 41.5, 48.5, { gate: [40, 48] });
  carve(47, 46, 60, 54);
  spawn('MoltenEfreeti', 54.5, 50.5, { boss: true, arena: 'ember', gates: [[47, 45]] });
  for (const [x, y] of [[47, 46], [60, 46], [47, 54], [60, 54], [53, 46], [55, 46]]) obj('brazier', x + 0.5, y + 0.5, { spr: 'brazier_red' });
  chest(59.5, 53.5, { item: 'key_brass' }, true); item(48.5, 53.5, 'ember');
  obj('deco', 50.5, 46.5, { spr: 'skull_dark' }); obj('deco', 58.5, 46.5, { spr: 'bones' });
  // brass gate (locked) south to the sanctum
  carve(54, 55, 54, 55); put(54, 56, 'K'); carve(54, 57, 54, 58);
  lore(55, 54, 'The Brass Gate. Beyond it the ceiling is sky, and the sky is wrong.');

  // ================= COSMIC SANCTUM (0-63, 56-79) =================
  zone('cosmic');
  carve(50, 59, 58, 63); put(54, 61, 'b'); obj('torch', 50.5, 58.5, {}); obj('torch', 58.5, 58.5, {});
  obj('brazier', 50.5, 63.5, { spr: 'brazier_purple' }); obj('brazier', 58.5, 63.5, { spr: 'brazier_purple' });
  lore(57, 62, 'The Cosmic Sanctum. The Mandate of Heaven was written here, and here it was unwritten.');
  // winding way west
  carve(49, 61, 49, 61); carve(40, 58, 48, 64); // star hall
  spawn('ConjuringBeholder', 44.5, 61.5); spawn('GraniteGargoyle', 41.5, 59.5); spawn('AirElemental', 47.5, 63.5); spawn('MasterIllusionist', 41.5, 63.5);
  obj('deco', 40.5, 58.5, { spr: 'statue' }); obj('deco', 48.5, 58.5, { spr: 'statue' }); obj('deco', 44.5, 58.5, { spr: 'altar' });
  chest(40.5, 64.5, { souls: 3000 }); obj('breakable', 48.5, 64.5, { spr: 'pot_gold' });
  carve(32, 61, 39, 61); carve(32, 61, 32, 70); carve(24, 66, 38, 72); // necropolis hall
  spawn('AdeptNecromancer', 30.5, 68.5); spawn('VileWitch', 36.5, 70.5); spawn('FleshGolem', 27.5, 69.5); spawn('GraniteGargoyle', 35.5, 67.5); spawn('AirElemental', 25.5, 71.5);
  for (const [x, y] of [[25, 66], [28, 66], [31, 66], [34, 66], [37, 66]]) obj('deco', x + 0.5, y + 0.5, { spr: hash2(x, y) > 0.5 ? 'coffin_dark' : 'coffin' });
  obj('brazier', 24.5, 72.5, { spr: 'brazier_purple' }); obj('brazier', 38.5, 72.5, { spr: 'brazier_purple' });
  item(24.5, 66.5, 'gem_purple'); item(38.5, 66.5, 'heart'); chest(31.5, 72.5, { item: 'soul_huge' }, true);
  lore(33, 71, 'The King sits beyond the white light. He has been waiting a very long time to be relieved.');
  // djinn side chamber
  carve(36, 73, 36, 75); carve(33, 76, 39, 78); spawn('PowerfulDjinn', 36.5, 77.5, { unique: true }); item(33.5, 77.5, 'ember'); chest(39.5, 77.5, { souls: 5000 });
  obj('brazier', 33.5, 76.5, { spr: 'brazier_purple' }); obj('brazier', 39.5, 76.5, { spr: 'brazier_purple' });
  // final approach and arena
  carve(20, 69, 23, 69); put(19, 69, 'F'); carve(4, 61, 18, 77);
  spawn('AdamantiumGolem', 11.5, 69.5, { boss: true, arena: 'cosmic', gates: [[19, 69]], final: true });
  for (const [x, y] of [[4, 61], [18, 61], [4, 77], [18, 77], [11, 61], [11, 77]]) obj('brazier', x + 0.5, y + 0.5, { spr: 'brazier_purple' });
  obj('deco', 5.5, 69.5, { spr: 'alcove_statue' }); obj('deco', 7.5, 61.5, { spr: 'statue' }); obj('deco', 15.5, 61.5, { spr: 'statue' });
  zone('cathedral');
  // the ash throne at the far west of the arena
  carve(1, 67, 3, 71); obj('deco', 1.5, 69.5, { spr: 'trophy' }); obj('throne', 1.5, 69.5, {});

  // walls: every non-floor cell adjacent to floor becomes a themed wall; void stays wall too
  WORLD.grid = g; WORLD.zoneOf = zo;
  // propagate zone ids to wall cells from neighbouring floor (so themes follow rooms)
  const isFloor = c => c !== ' ' && c !== '#';
  const zo2 = new Uint8Array(zo);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const c = at(x, y); if (isFloor(c)) continue;
    let best = -1, bestD = 9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      if (isFloor(at(nx, ny))) { const d = Math.abs(dx) + Math.abs(dy); if (d < bestD) { bestD = d; best = zo[ny * MW + nx]; } }
    }
    if (best >= 0) zo2[y * MW + x] = best;
  }
  WORLD.zoneOf = zo2;
}
