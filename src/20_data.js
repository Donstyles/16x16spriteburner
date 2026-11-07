// ===================== rules data =====================
const STATS = ['mt', 'it', 'pe', 'en', 'ac', 'sp', 'lk'];
const STAT_NAMES = { mt: 'Might', it: 'Intellect', pe: 'Personality', en: 'Endurance', ac: 'Accuracy', sp: 'Speed', lk: 'Luck' };
function statBonus(v) { if (v <= 2) return -5; if (v <= 4) return -3; if (v <= 6) return -2; if (v <= 8) return -1; if (v <= 12) return 0; if (v <= 14) return 1; if (v <= 16) return 2; if (v <= 18) return 3; if (v <= 20) return 4; if (v <= 24) return 5; if (v <= 29) return 6; if (v <= 34) return 7; if (v <= 39) return 8; if (v <= 49) return 9; if (v <= 74) return 10; if (v <= 99) return 11; return 12 + Math.floor((v - 100) / 25); }
const XP_FOR_LEVEL = lv => 1000 * (lv - 1) * lv / 2; // xp needed to be trained to level lv
const TRAIN_COST = lv => 100 * lv;

const SKILLS = {
  Sword: { kind: 'weapon', desc: 'Swords and blades. +1 to hit per level; Expert: +recovery, Master: +1 damage per level.' },
  Axe: { kind: 'weapon', desc: 'Axes. +1 to hit per level; Master: +1 damage per level.' },
  Mace: { kind: 'weapon', desc: 'Maces and clubs. +1 to hit per level; Expert: chance to stun.' },
  Dagger: { kind: 'weapon', desc: 'Daggers. +1 to hit per level; Master: triple damage chance.' },
  Spear: { kind: 'weapon', desc: 'Spears and polearms. +1 to hit per level; Expert: +1 AC.' },
  Bow: { kind: 'weapon', desc: 'Bows. +1 to hit per level; Expert: faster, Master: two arrows.' },
  Staff: { kind: 'weapon', desc: 'Staves and wands. +1 to hit per level; Expert: +2 AC per level.' },
  Leather: { kind: 'armor', desc: 'Leather armor. Reduces armor recovery penalty; Expert: +1 AC per level.' },
  Chain: { kind: 'armor', desc: 'Chain mail. Reduces armor recovery penalty; Expert: +1 AC per level.' },
  Plate: { kind: 'armor', desc: 'Plate armor. Reduces armor recovery penalty; Expert: +1 AC per level.' },
  Shield: { kind: 'armor', desc: 'Shields. +1 AC per level.' },
  Fire: { kind: 'magic', desc: 'Fire magic: bolts and blasts.' }, Air: { kind: 'magic', desc: 'Air magic: sparks, shields, lightning.' },
  Water: { kind: 'magic', desc: 'Water magic: ice, poison, and Town Portal.' }, Earth: { kind: 'magic', desc: 'Earth magic: stone skin, stun, rock blast.' },
  Spirit: { kind: 'magic', desc: 'Spirit magic: blessings, heroism, raising the dead.' }, Mind: { kind: 'magic', desc: 'Mind magic: blasts that ignore armor, fear.' },
  Body: { kind: 'magic', desc: 'Body magic: healing and cures.' },
  BodyBuilding: { kind: 'misc', desc: '+1 hit point per level, every level.' }, Meditation: { kind: 'misc', desc: '+1 spell point per level, every level.' },
  Perception: { kind: 'misc', desc: 'More gold from chests and monsters.' }, Merchant: { kind: 'misc', desc: 'Better prices when buying and selling.' },
  Learning: { kind: 'misc', desc: '+5% experience per level.' }, Disarm: { kind: 'misc', desc: 'Chance to disarm chest traps.' },
};
const RANK = lv => lv >= 8 ? 'Master' : lv >= 4 ? 'Expert' : lv >= 1 ? 'Novice' : '-';

const CLASSES = {
  Knight: { sprite: 'SkilledBattlemage', hpLv: 8, spLv: 0, spStat: null, baseHp: 40, baseSp: 0, stats: { mt: 15, it: 7, pe: 9, en: 15, ac: 12, sp: 11, lk: 9 },
    start: { Sword: 1, Chain: 1, Shield: 1, BodyBuilding: 1 }, learnable: ['Sword', 'Axe', 'Mace', 'Spear', 'Dagger', 'Leather', 'Chain', 'Plate', 'Shield', 'BodyBuilding', 'Perception', 'Merchant', 'Learning', 'Disarm'],
    schools: [], gear: ['long_sword', 'chain_mail', 'buckler'], spells: [], desc: 'A master of arms. The most hit points, the heaviest armor, no magic.' },
  Paladin: { sprite: 'CapableCryomancer', hpLv: 6, spLv: 2, spStat: 'pe', baseHp: 34, baseSp: 6, stats: { mt: 13, it: 8, pe: 13, en: 13, ac: 11, sp: 10, lk: 10 },
    start: { Mace: 1, Chain: 1, Shield: 1, Spirit: 1 }, learnable: ['Sword', 'Mace', 'Spear', 'Leather', 'Chain', 'Plate', 'Shield', 'Spirit', 'Body', 'BodyBuilding', 'Meditation', 'Merchant', 'Learning'],
    schools: ['Spirit', 'Body'], gear: ['mace', 'chain_mail', 'buckler'], spells: ['bless'], desc: 'A holy warrior. Strong in combat with a little spirit magic.' },
  Archer: { sprite: 'SilentRanger', hpLv: 5, spLv: 2, spStat: 'it', baseHp: 30, baseSp: 6, stats: { mt: 12, it: 12, pe: 8, en: 11, ac: 15, sp: 13, lk: 10 },
    start: { Bow: 2, Leather: 1, Air: 1, Perception: 1 }, learnable: ['Bow', 'Dagger', 'Sword', 'Spear', 'Leather', 'Chain', 'Air', 'Fire', 'Water', 'Earth', 'Perception', 'Learning', 'Disarm', 'Merchant'],
    schools: ['Air', 'Fire', 'Water', 'Earth'], gear: ['short_bow', 'leather_armor', 'dagger'], spells: ['sparks'], desc: 'Deadly at range, with elemental magic to learn.' },
  Cleric: { sprite: 'ExpertDruid', hpLv: 4, spLv: 3, spStat: 'pe', baseHp: 28, baseSp: 10, stats: { mt: 10, it: 10, pe: 15, en: 11, ac: 10, sp: 10, lk: 11 },
    start: { Mace: 1, Leather: 1, Body: 1, Spirit: 1 }, learnable: ['Mace', 'Staff', 'Leather', 'Chain', 'Shield', 'Spirit', 'Mind', 'Body', 'Meditation', 'Merchant', 'Learning', 'Perception'],
    schools: ['Spirit', 'Mind', 'Body'], gear: ['mace', 'leather_armor', 'buckler'], spells: ['cure_wounds', 'bless'], desc: 'Healer and protector. Spirit, Mind and Body magic.' },
  Sorcerer: { sprite: 'FlameMagus', hpLv: 3, spLv: 4, spStat: 'it', baseHp: 24, baseSp: 14, stats: { mt: 8, it: 16, pe: 10, en: 9, ac: 10, sp: 12, lk: 11 },
    start: { Staff: 1, Leather: 1, Fire: 1, Air: 1 }, learnable: ['Staff', 'Dagger', 'Leather', 'Fire', 'Air', 'Water', 'Earth', 'Meditation', 'Learning', 'Merchant', 'Disarm'],
    schools: ['Fire', 'Air', 'Water', 'Earth'], gear: ['staff', 'robe', 'dagger'], spells: ['fire_bolt', 'torch_light'], desc: 'Elemental mage. Fragile, but devastating.' },
  Druid: { sprite: 'VileWitch', hpLv: 4, spLv: 3, spStat: 'it', baseHp: 26, baseSp: 12, stats: { mt: 9, it: 14, pe: 14, en: 10, ac: 10, sp: 11, lk: 12 },
    start: { Dagger: 1, Leather: 1, Earth: 1, Body: 1 }, learnable: ['Dagger', 'Staff', 'Leather', 'Fire', 'Water', 'Earth', 'Body', 'Mind', 'Meditation', 'Learning', 'Perception'],
    schools: ['Earth', 'Water', 'Fire', 'Body', 'Mind'], gear: ['dagger', 'leather_armor', 'staff'], spells: ['stun', 'cure_wounds'], desc: 'Elemental and body magic, nature\'s balance.' },
};
const NAME_POOL = ['Roderick', 'Sable', 'Mira', 'Vesper', 'Aldric', 'Brenna', 'Cedric', 'Dara', 'Edmund', 'Fenna', 'Garrick', 'Hesper', 'Isolde', 'Joren', 'Kael', 'Lysa', 'Marek', 'Nessa', 'Orin', 'Petra', 'Quill', 'Rhoswen', 'Soren', 'Tamsin', 'Ulric', 'Wren'];

// ---- items ----
const ITEMS = {
  // weapons: dmg [n, sides, bonus], rec = base recovery in ticks (lower is faster)
  dagger: { name: 'Dagger', type: 'weapon', skill: 'Dagger', dmg: [1, 4, 0], rec: 40, value: 20, tier: 1, icon: 'dagger' },
  long_dagger: { name: 'Long Dagger', type: 'weapon', skill: 'Dagger', dmg: [2, 3, 0], rec: 45, value: 90, tier: 2, icon: 'dagger' },
  short_sword: { name: 'Short Sword', type: 'weapon', skill: 'Sword', dmg: [1, 6, 0], rec: 60, value: 40, tier: 1, icon: 'sword' },
  long_sword: { name: 'Long Sword', type: 'weapon', skill: 'Sword', dmg: [2, 4, 0], rec: 70, value: 120, tier: 1, icon: 'sword2' },
  broad_sword: { name: 'Broad Sword', type: 'weapon', skill: 'Sword', dmg: [3, 4, 0], rec: 80, value: 350, tier: 2, icon: 'sword2' },
  great_sword: { name: 'Great Sword', type: 'weapon', skill: 'Sword', dmg: [4, 5, 0], rec: 100, value: 900, tier: 3, icon: 'sword3', twoHand: true },
  hand_axe: { name: 'Hand Axe', type: 'weapon', skill: 'Axe', dmg: [1, 8, 0], rec: 80, value: 45, tier: 1, icon: 'axe' },
  battle_axe: { name: 'Battle Axe', type: 'weapon', skill: 'Axe', dmg: [2, 8, 0], rec: 100, value: 380, tier: 2, icon: 'axe', twoHand: true },
  club: { name: 'Club', type: 'weapon', skill: 'Mace', dmg: [1, 4, 1], rec: 60, value: 15, tier: 1, icon: 'mace' },
  mace: { name: 'Mace', type: 'weapon', skill: 'Mace', dmg: [1, 6, 1], rec: 70, value: 60, tier: 1, icon: 'mace' },
  morning_star: { name: 'Morning Star', type: 'weapon', skill: 'Mace', dmg: [2, 5, 1], rec: 85, value: 320, tier: 2, icon: 'mace' },
  spear: { name: 'Spear', type: 'weapon', skill: 'Spear', dmg: [1, 8, 1], rec: 80, value: 60, tier: 1, icon: 'spear' },
  halberd: { name: 'Halberd', type: 'weapon', skill: 'Spear', dmg: [3, 5, 1], rec: 100, value: 650, tier: 3, icon: 'spear', twoHand: true },
  staff: { name: 'Staff', type: 'weapon', skill: 'Staff', dmg: [1, 6, 0], rec: 80, value: 30, tier: 1, icon: 'staff', twoHand: true },
  wand: { name: 'Wand', type: 'weapon', skill: 'Staff', dmg: [1, 4, 0], rec: 50, value: 90, tier: 2, icon: 'wand', spellPower: 2 },
  short_bow: { name: 'Short Bow', type: 'weapon', skill: 'Bow', dmg: [1, 6, 0], rec: 70, value: 50, tier: 1, icon: 'bow', ranged: true },
  long_bow: { name: 'Long Bow', type: 'weapon', skill: 'Bow', dmg: [2, 4, 0], rec: 80, value: 220, tier: 2, icon: 'bow', ranged: true },
  composite_bow: { name: 'Composite Bow', type: 'weapon', skill: 'Bow', dmg: [3, 4, 1], rec: 85, value: 700, tier: 3, icon: 'bow', ranged: true },
  // armor
  robe: { name: 'Robe', type: 'armor', skill: null, acv: 2, value: 20, tier: 1, icon: 'robe' },
  leather_armor: { name: 'Leather Armor', type: 'armor', skill: 'Leather', acv: 4, recPen: 5, value: 50, tier: 1, icon: 'leather' },
  studded_leather: { name: 'Studded Leather', type: 'armor', skill: 'Leather', acv: 6, recPen: 10, value: 180, tier: 2, icon: 'leather' },
  chain_mail: { name: 'Chain Mail', type: 'armor', skill: 'Chain', acv: 8, recPen: 15, value: 150, tier: 1, icon: 'chain' },
  scale_mail: { name: 'Scale Mail', type: 'armor', skill: 'Chain', acv: 10, recPen: 20, value: 420, tier: 2, icon: 'chain' },
  plate_mail: { name: 'Plate Mail', type: 'armor', skill: 'Plate', acv: 13, recPen: 30, value: 900, tier: 3, icon: 'plate' },
  full_plate: { name: 'Full Plate', type: 'armor', skill: 'Plate', acv: 17, recPen: 40, value: 2200, tier: 4, icon: 'plate' },
  buckler: { name: 'Buckler', type: 'shield', skill: 'Shield', acv: 2, value: 30, tier: 1, icon: 'shield' },
  shield: { name: 'Shield', type: 'shield', skill: 'Shield', acv: 4, value: 110, tier: 2, icon: 'shield' },
  tower_shield: { name: 'Tower Shield', type: 'shield', skill: 'Shield', acv: 6, value: 400, tier: 3, icon: 'shield' },
  cap: { name: 'Leather Cap', type: 'helm', acv: 1, value: 25, tier: 1, icon: 'cap' },
  helm: { name: 'Iron Helm', type: 'helm', acv: 3, value: 140, tier: 2, icon: 'helm' },
  great_helm: { name: 'Great Helm', type: 'helm', acv: 5, value: 520, tier: 3, icon: 'helm' },
  boots: { name: 'Boots', type: 'boots', acv: 1, value: 30, tier: 1, icon: 'boots' },
  iron_boots: { name: 'Iron Boots', type: 'boots', acv: 3, value: 160, tier: 2, icon: 'boots' },
  ring: { name: 'Ring', type: 'ring', value: 100, tier: 2, icon: 'ring' },
  amulet: { name: 'Amulet', type: 'amulet', value: 150, tier: 2, icon: 'amulet' },
  // consumables
  potion_heal: { name: 'Potion of Healing', type: 'potion', use: 'heal', power: 30, value: 40, tier: 1, icon: 'potion_red', stack: true },
  potion_heal2: { name: 'Potion of Restoration', type: 'potion', use: 'heal', power: 90, value: 150, tier: 2, icon: 'potion_red', stack: true },
  potion_mana: { name: 'Potion of Mana', type: 'potion', use: 'mana', power: 25, value: 60, tier: 1, icon: 'potion_blue', stack: true },
  potion_mana2: { name: 'Potion of Insight', type: 'potion', use: 'mana', power: 70, value: 200, tier: 2, icon: 'potion_blue', stack: true },
  potion_cure: { name: 'Antidote', type: 'potion', use: 'cure', value: 35, tier: 1, icon: 'potion_green', stack: true },
  food: { name: 'Rations', type: 'food', value: 5, tier: 1, icon: 'food', stack: true },
  torch: { name: 'Torch', type: 'misc', use: 'torch', value: 8, tier: 1, icon: 'torch', stack: true },
  // quest & misc
  gold_pile: { name: 'Gold', type: 'gold', icon: 'gold' },
  iron_ore: { name: 'Iron Ore', type: 'quest', value: 10, icon: 'ore', stack: true },
  marsh_herb: { name: 'Marsh Herb', type: 'quest', value: 8, icon: 'herb', stack: true },
  goblin_signet: { name: 'Goblin King\'s Signet', type: 'quest', value: 0, icon: 'ring', lore: 'A crude iron ring. The Warrens are leaderless without it.' },
  widow_locket: { name: 'Silver Locket', type: 'quest', value: 0, icon: 'amulet', lore: 'A locket with a faded portrait inside.' },
  pilgrim_letter: { name: 'Pilgrim\'s Letter', type: 'quest', value: 0, icon: 'letter', lore: 'Water-stained. "...we reached the barrow at dusk. The trees moved."' },
  barrow_relic: { name: 'Relic of the Mandate', type: 'quest', value: 0, icon: 'relic', lore: 'A reliquary of old gold. It hums faintly near the Sanctum.' },
  lost_tome: { name: 'Tome of Hollow Stars', type: 'quest', value: 0, icon: 'book', lore: 'The scholar\'s missing spellbook, bound in frost.' },
  frost_key: { name: 'Frost Key', type: 'quest', value: 0, icon: 'key2', lore: 'Cold enough to burn. One of the two keys to the Sanctum.' },
  brass_key: { name: 'Brass Key', type: 'quest', value: 0, icon: 'key', lore: 'Still warm. The second key to the Sanctum.' },
  scepter: { name: 'Scepter of the Mandate', type: 'quest', value: 0, icon: 'scepter', lore: 'The Mandate of Heaven, made solid.' },
};
const SLOT_OF = { weapon: 'weapon', armor: 'armor', shield: 'shield', helm: 'helm', boots: 'boots', ring: 'ring', amulet: 'amulet' };
const ENCHANTS = [
  { id: 'mt', name: 'of Might', stat: 'mt', slots: ['weapon', 'ring', 'amulet', 'helm'], v: [2, 6] }, { id: 'it', name: 'of Thought', stat: 'it', slots: ['ring', 'amulet', 'helm', 'armor'], v: [2, 6] },
  { id: 'pe', name: 'of Charm', stat: 'pe', slots: ['ring', 'amulet', 'helm'], v: [2, 6] }, { id: 'en', name: 'of Vigor', stat: 'en', slots: ['armor', 'ring', 'amulet', 'boots'], v: [2, 6] },
  { id: 'ac_', name: 'of Precision', stat: 'ac', slots: ['weapon', 'ring', 'boots'], v: [2, 6] }, { id: 'sp', name: 'of Speed', stat: 'sp', slots: ['boots', 'ring', 'weapon'], v: [2, 6] },
  { id: 'lk', name: 'of Fortune', stat: 'lk', slots: ['ring', 'amulet'], v: [2, 6] },
  { id: 'fire', name: 'of Fire', elem: 'fire', slots: ['weapon'], v: [2, 6] }, { id: 'cold', name: 'of Frost', elem: 'cold', slots: ['weapon'], v: [2, 6] },
  { id: 'elec', name: 'of Lightning', elem: 'elec', slots: ['weapon'], v: [2, 6] }, { id: 'poison', name: 'of Venom', elem: 'poison', slots: ['weapon'], v: [2, 6] },
  { id: 'rfire', name: 'of Fire Warding', res: 'fire', slots: ['armor', 'shield', 'amulet', 'ring'], v: [10, 25] }, { id: 'rcold', name: 'of Frost Warding', res: 'cold', slots: ['armor', 'shield', 'amulet', 'ring'], v: [10, 25] },
  { id: 'hp', name: 'of Health', hp: 1, slots: ['armor', 'amulet', 'ring', 'helm'], v: [5, 20] }, { id: 'sp_', name: 'of Mana', spts: 1, slots: ['ring', 'amulet', 'helm', 'armor'], v: [5, 20] },
  { id: 'acv', name: 'of Protection', acv: 1, slots: ['armor', 'shield', 'helm', 'boots', 'ring'], v: [2, 6] }, { id: 'dmg', name: 'of Slaying', dmg: 1, slots: ['weapon'], v: [1, 4] },
];
function makeItem(id, ench, power = 1) {
  const base = ITEMS[id]; if (!base) return null;
  const it = { id, qty: 1, ench: null, ev: 0 };
  if (ench) { const e = typeof ench === 'string' ? ENCHANTS.find(x => x.id === ench) : ench; if (e) { it.ench = e.id; it.ev = rint(e.v[0], e.v[1]) + Math.floor(power); } }
  return it;
}
function itemName(it) { const b = ITEMS[it.id]; if (!b) return '?'; const e = it.ench && ENCHANTS.find(x => x.id === it.ench); return (b.name + (e ? ' ' + e.name : '')) + (it.qty > 1 ? ' x' + it.qty : ''); }
function itemValue(it) { const b = ITEMS[it.id]; let v = b.value || 0; if (it.ench) v += 60 + it.ev * 40; return v * (it.qty || 1); }
function itemDesc(it) {
  const b = ITEMS[it.id]; const parts = [];
  if (b.type === 'weapon') parts.push('Damage ' + b.dmg[0] + 'd' + b.dmg[1] + (b.dmg[2] ? '+' + b.dmg[2] : '') + ', ' + (b.ranged ? 'ranged' : 'melee') + ', ' + b.skill + ' skill' + (b.twoHand ? ', two-handed' : ''));
  if (b.acv) parts.push('Armor +' + b.acv + (b.skill ? ' (' + b.skill + ' skill)' : ''));
  if (b.recPen) parts.push('Recovery penalty ' + b.recPen);
  if (b.use === 'heal') parts.push('Restores ' + b.power + ' hit points'); if (b.use === 'mana') parts.push('Restores ' + b.power + ' spell points'); if (b.use === 'cure') parts.push('Cures poison and disease');
  if (b.type === 'food') parts.push('One day of food for the party'); if (b.use === 'torch') parts.push('Light for one hour');
  if (it.ench) { const e = ENCHANTS.find(x => x.id === it.ench); if (e.stat) parts.push('+' + it.ev + ' ' + STAT_NAMES[e.stat]); if (e.elem) parts.push('+' + it.ev + ' ' + e.elem + ' damage'); if (e.res) parts.push('+' + it.ev + ' ' + e.res + ' resistance'); if (e.hp) parts.push('+' + it.ev + ' hit points'); if (e.spts) parts.push('+' + it.ev + ' spell points'); if (e.acv) parts.push('+' + it.ev + ' armor'); if (e.dmg) parts.push('+' + it.ev + ' damage'); }
  if (b.lore) parts.push(b.lore);
  parts.push('Value ' + fmtNum(itemValue(it)) + ' gold');
  return parts.join('. ');
}
// random loot by tier
const LOOT = {
  1: ['dagger', 'short_sword', 'club', 'hand_axe', 'spear', 'short_bow', 'leather_armor', 'cap', 'boots', 'buckler', 'potion_heal', 'potion_heal', 'potion_mana', 'potion_cure', 'food', 'torch', 'staff'],
  2: ['long_sword', 'mace', 'long_dagger', 'spear', 'long_bow', 'studded_leather', 'chain_mail', 'helm', 'boots', 'shield', 'ring', 'amulet', 'potion_heal2', 'potion_mana', 'potion_cure', 'wand'],
  3: ['broad_sword', 'morning_star', 'battle_axe', 'composite_bow', 'scale_mail', 'plate_mail', 'great_helm', 'iron_boots', 'tower_shield', 'ring', 'amulet', 'potion_heal2', 'potion_mana2'],
  4: ['great_sword', 'halberd', 'full_plate', 'plate_mail', 'great_helm', 'ring', 'amulet', 'composite_bow', 'potion_heal2', 'potion_mana2'],
};
function randomLoot(tier, luck = 0) {
  tier = clamp(tier, 1, 4); const id = pick(LOOT[Math.random() < 0.25 && tier < 4 ? tier + 1 : tier]); const b = ITEMS[id];
  let ench = null; if (SLOT_OF[b.type] && Math.random() < 0.18 + tier * 0.08 + luck * 0.01) { const opts = ENCHANTS.filter(e => e.slots.includes(b.type)); ench = pick(opts); }
  const it = makeItem(id, ench, tier - 1); if (b.stack && Math.random() < 0.4) it.qty = rint(1, 3); return it;
}

// ---- spells ----
const SPELLS = {
  torch_light: { name: 'Torch Light', school: 'Fire', lvl: 1, sp: 2, kind: 'party', desc: 'Light the darkness around the party for an hour.', price: 100 },
  fire_bolt: { name: 'Fire Bolt', school: 'Fire', lvl: 1, sp: 3, kind: 'bolt', elem: 'fire', dmg: [1, 8, 0], perSkill: 2, range: 8, desc: 'A bolt of flame. 1d8 +2 per skill level fire damage.', price: 150 },
  ring_of_fire: { name: 'Ring of Fire', school: 'Fire', lvl: 2, sp: 6, kind: 'around', elem: 'fire', dmg: [2, 6, 0], perSkill: 2, radius: 3, desc: 'Burns every enemy within 3 tiles for 2d6 +2 per level.', price: 500 },
  fireball: { name: 'Fireball', school: 'Fire', lvl: 3, sp: 9, kind: 'aoe', elem: 'fire', dmg: [3, 6, 0], perSkill: 3, range: 8, radius: 2.2, desc: 'Explodes on the target. 3d6 +3 per level to all nearby.', price: 1200 },
  wizard_eye: { name: 'Wizard Eye', school: 'Air', lvl: 1, sp: 2, kind: 'party', desc: 'Reveals monsters on the map for an hour.', price: 100 },
  sparks: { name: 'Sparks', school: 'Air', lvl: 1, sp: 3, kind: 'multi', elem: 'elec', dmg: [1, 4, 0], perSkill: 1, range: 6, desc: 'Several sparks of 1d4 +1 per level, one per nearby enemy (up to 2 + level/2).', price: 150 },
  shield: { name: 'Shield', school: 'Air', lvl: 2, sp: 5, kind: 'party', buff: 'shield', desc: 'Party armor +8 +1 per level for an hour.', price: 500 },
  lightning_bolt: { name: 'Lightning Bolt', school: 'Air', lvl: 3, sp: 9, kind: 'bolt', elem: 'elec', dmg: [4, 6, 0], perSkill: 3, range: 9, chain: true, desc: '4d6 +3 per level lightning, arcing to a second enemy.', price: 1200 },
  ice_bolt: { name: 'Ice Bolt', school: 'Water', lvl: 1, sp: 3, kind: 'bolt', elem: 'cold', dmg: [1, 8, 0], perSkill: 2, range: 8, slow: true, desc: 'A shard of ice. 1d8 +2 per level cold damage, slows the target.', price: 150 },
  poison_spray: { name: 'Poison Spray', school: 'Water', lvl: 2, sp: 5, kind: 'around', elem: 'poison', dmg: [2, 6, 0], perSkill: 2, radius: 2.5, poison: true, desc: 'Poisons every enemy within 2 tiles.', price: 500 },
  acid_burst: { name: 'Acid Burst', school: 'Water', lvl: 3, sp: 9, kind: 'bolt', elem: 'poison', dmg: [5, 6, 0], perSkill: 3, range: 8, desc: '5d6 +3 per level acid damage.', price: 1200 },
  town_portal: { name: 'Town Portal', school: 'Water', lvl: 3, sp: 12, kind: 'utility', desc: 'Returns the party to the square of Harrowmere.', price: 2000 },
  stun: { name: 'Stun', school: 'Earth', lvl: 1, sp: 3, kind: 'bolt', elem: 'phys', dmg: [1, 4, 0], perSkill: 1, range: 6, stunT: 3, desc: 'Stuns the target for 3 seconds (+0.5 per level).', price: 150 },
  slow: { name: 'Slow', school: 'Earth', lvl: 2, sp: 5, kind: 'around', elem: 'none', radius: 4, slowT: 12, desc: 'Slows every enemy within 4 tiles for 12 seconds (+2 per level).', price: 500 },
  stone_skin: { name: 'Stone Skin', school: 'Earth', lvl: 2, sp: 5, kind: 'party', buff: 'stoneskin', desc: 'Party armor +12 +1 per level for an hour.', price: 500 },
  rock_blast: { name: 'Rock Blast', school: 'Earth', lvl: 3, sp: 9, kind: 'aoe', elem: 'phys', dmg: [3, 8, 0], perSkill: 2, range: 7, radius: 2.2, desc: '3d8 +2 per level crushing damage to all near the target.', price: 1200 },
  bless: { name: 'Bless', school: 'Spirit', lvl: 1, sp: 3, kind: 'party', buff: 'bless', desc: 'Party to-hit +5 +1 per level for an hour.', price: 150 },
  spirit_lash: { name: 'Spirit Lash', school: 'Spirit', lvl: 2, sp: 5, kind: 'bolt', elem: 'spirit', dmg: [2, 8, 0], perSkill: 2, range: 7, desc: '2d8 +2 per level spirit damage.', price: 500 },
  heroism: { name: 'Heroism', school: 'Spirit', lvl: 3, sp: 7, kind: 'party', buff: 'heroism', desc: 'Party damage +3 +1 per level for an hour.', price: 1200 },
  raise_dead: { name: 'Raise Dead', school: 'Spirit', lvl: 4, sp: 18, kind: 'party', desc: 'Returns every dead companion to life with a sliver of health. Expert required.', price: 3000 },
  mind_blast: { name: 'Mind Blast', school: 'Mind', lvl: 1, sp: 3, kind: 'bolt', elem: 'mind', dmg: [1, 6, 0], perSkill: 2, range: 7, desc: '1d6 +2 per level mind damage that ignores armor.', price: 150 },
  mind_shield: { name: 'Mind Shield', school: 'Mind', lvl: 2, sp: 4, kind: 'party', buff: 'mindshield', desc: 'Party immune to fear and stun for an hour.', price: 500 },
  fear: { name: 'Fear', school: 'Mind', lvl: 2, sp: 6, kind: 'around', elem: 'none', radius: 5, fearT: 6, desc: 'Enemies within 5 tiles flee for 6 seconds (+1 per level).', price: 600 },
  psychic_shock: { name: 'Psychic Shock', school: 'Mind', lvl: 3, sp: 10, kind: 'bolt', elem: 'mind', dmg: [6, 6, 0], perSkill: 3, range: 7, desc: '6d6 +3 per level mind damage.', price: 1400 },
  cure_wounds: { name: 'Cure Wounds', school: 'Body', lvl: 1, sp: 3, kind: 'heal', heal: 6, perSkill: 5, desc: 'Heals the most wounded companion 6 +5 per level.', price: 150 },
  cure_poison: { name: 'Cure Poison', school: 'Body', lvl: 1, sp: 2, kind: 'cure', desc: 'Cures poison and disease in the whole party.', price: 120 },
  flying_fist: { name: 'Flying Fist', school: 'Body', lvl: 2, sp: 5, kind: 'bolt', elem: 'phys', dmg: [2, 8, 0], perSkill: 2, range: 6, desc: '2d8 +2 per level crushing damage.', price: 500 },
  power_cure: { name: 'Power Cure', school: 'Body', lvl: 3, sp: 10, kind: 'healall', heal: 10, perSkill: 6, desc: 'Heals every companion 10 +6 per level.', price: 1200 },
};
const SCHOOLS = ['Fire', 'Air', 'Water', 'Earth', 'Spirit', 'Mind', 'Body'];
const SCHOOL_COLOR = { Fire: '#ff7a30', Air: '#9ad8ff', Water: '#4a9aff', Earth: '#c8a060', Spirit: '#f0e0a0', Mind: '#d080ff', Body: '#80e080' };

// ---- monsters ----
// hp, acv (armor), atk (to-hit bonus), dmg dice, spd (tiles/s), xp, gold, res {fire,cold,elec,poison,mind,phys}, ranged {type, range}, spell, special, tier
const MONSTERS = {
  // tier 1
  goblin: { name: 'Goblin', spr: 'GoblinFighter', hp: 14, acv: 6, atk: 2, dmg: [1, 6, 0], spd: 2.6, xp: 25, gold: [2, 12], tier: 1 },
  goblin_archer: { name: 'Goblin Archer', spr: 'GoblinArcher', hp: 11, acv: 5, atk: 3, dmg: [1, 6, 0], spd: 2.4, xp: 30, gold: [3, 14], tier: 1, ranged: { type: 'arrow', range: 6 } },
  goblin_shaman: { name: 'Goblin Shaman', spr: 'GoblinOccultist', hp: 12, acv: 5, atk: 2, dmg: [1, 4, 0], spd: 2.2, xp: 45, gold: [8, 20], tier: 1, spell: 'spark' },
  scarecrow: { name: 'Scarecrow', spr: 'ScarecrowGolem', hp: 18, acv: 4, atk: 1, dmg: [1, 6, 0], spd: 1.6, xp: 20, gold: [0, 3], tier: 1, res: { fire: -50, mind: 100, poison: 100 } },
  wild_dog: { name: 'Wild Dog', spr: 'BlinkDog', hp: 10, acv: 7, atk: 3, dmg: [1, 4, 1], spd: 3.4, xp: 18, gold: [0, 0], tier: 1 },
  bandit: { name: 'Halfling Bandit', spr: 'HalflingRogue', hp: 16, acv: 8, atk: 3, dmg: [1, 6, 1], spd: 2.8, xp: 35, gold: [10, 30], tier: 1 },
  bandit_slinger: { name: 'Halfling Slinger', spr: 'HalflingSlinger', hp: 12, acv: 7, atk: 4, dmg: [1, 5, 0], spd: 2.6, xp: 35, gold: [8, 25], tier: 1, ranged: { type: 'rock', range: 6 } },
  goblin_king: { name: 'Gruk, Goblin King', spr: 'GoblinWolfRider', hp: 140, acv: 12, atk: 7, dmg: [2, 8, 2], spd: 2.6, xp: 600, gold: [150, 300], tier: 2, boss: true, size: 1.5, special: 'regen' },
  // tier 2
  lizard_scout: { name: 'Lizardfolk Scout', spr: 'LizardfolkScout', hp: 26, acv: 10, atk: 5, dmg: [1, 8, 1], spd: 3.0, xp: 60, gold: [10, 30], tier: 2 },
  lizard_spear: { name: 'Lizardfolk Spearman', spr: 'LizardfolkSpearman', hp: 34, acv: 12, atk: 6, dmg: [2, 6, 1], spd: 2.4, xp: 80, gold: [12, 35], tier: 2 },
  lizard_archer: { name: 'Lizardfolk Archer', spr: 'LizardfolkArcher', hp: 24, acv: 9, atk: 7, dmg: [1, 8, 0], spd: 2.6, xp: 75, gold: [10, 30], tier: 2, ranged: { type: 'arrow', range: 7 } },
  lizard_gladiator: { name: 'Lizardfolk Gladiator', spr: 'LizardfolkGladiator', hp: 55, acv: 15, atk: 8, dmg: [2, 8, 2], spd: 2.5, xp: 150, gold: [30, 60], tier: 2 },
  bestial_lizard: { name: 'Bestial Lizardfolk', spr: 'BestialLizardfolk', hp: 70, acv: 13, atk: 8, dmg: [3, 6, 2], spd: 3.0, xp: 200, gold: [20, 50], tier: 3, special: 'poison' },
  satyr: { name: 'Satyr', spr: 'SneakySatyr', hp: 28, acv: 11, atk: 6, dmg: [1, 8, 2], spd: 3.4, xp: 70, gold: [15, 40], tier: 2 },
  pixie: { name: 'Pixie', spr: 'FlutteringPixie', hp: 14, acv: 14, atk: 5, dmg: [1, 4, 0], spd: 3.2, xp: 60, gold: [5, 25], tier: 2, spell: 'spark', fly: true },
  wisp: { name: 'Glowing Wisp', spr: 'GlowingWisp', hp: 20, acv: 16, atk: 6, dmg: [1, 6, 0], spd: 2.8, xp: 80, gold: [0, 10], tier: 2, spell: 'spark', fly: true, res: { elec: 100, phys: 50 }, light: true },
  fairy: { name: 'Fairy', spr: 'MagicalFairy', hp: 18, acv: 15, atk: 5, dmg: [1, 4, 0], spd: 3.0, xp: 70, gold: [5, 30], tier: 2, spell: 'heal_ally', fly: true },
  treant: { name: 'Blighted Treant', spr: 'CorruptedTreant', hp: 60, acv: 12, atk: 6, dmg: [2, 8, 1], spd: 1.5, xp: 160, gold: [0, 15], tier: 2, res: { fire: -50, poison: 100, cold: 50 } },
  wolf_rider: { name: 'Goblin Wolf Rider', spr: 'GoblinWolfRider', hp: 40, acv: 12, atk: 7, dmg: [2, 6, 1], spd: 3.6, xp: 120, gold: [15, 40], tier: 2 },
  assassin: { name: 'Halfling Assassin', spr: 'HalflingAssassin', hp: 32, acv: 14, atk: 9, dmg: [2, 6, 2], spd: 3.2, xp: 130, gold: [25, 60], tier: 2, special: 'poison' },
  ranger: { name: 'Halfling Ranger', spr: 'HalflingRanger', hp: 30, acv: 12, atk: 8, dmg: [2, 5, 1], spd: 2.8, xp: 110, gold: [20, 50], tier: 2, ranged: { type: 'arrow', range: 8 } },
  bard: { name: 'Halfling Bard', spr: 'HalflingBard', hp: 26, acv: 10, atk: 5, dmg: [1, 6, 0], spd: 2.8, xp: 100, gold: [30, 70], tier: 2, spell: 'fear_party' },
  // tier 3
  clay_golem: { name: 'Clay Golem', spr: 'ClayGolem', hp: 90, acv: 14, atk: 8, dmg: [2, 10, 2], spd: 1.6, xp: 260, gold: [0, 20], tier: 3, res: { mind: 100, poison: 100, elec: 50 } },
  stone_golem: { name: 'Stone Golem', spr: 'StoneGolem', hp: 130, acv: 18, atk: 9, dmg: [3, 8, 2], spd: 1.5, xp: 380, gold: [0, 30], tier: 3, res: { mind: 100, poison: 100, fire: 50, cold: 50 } },
  iron_golem: { name: 'Iron Golem', spr: 'IronGolem', hp: 170, acv: 22, atk: 11, dmg: [3, 10, 3], spd: 1.5, xp: 550, gold: [0, 40], tier: 4, res: { mind: 100, poison: 100, fire: 50, phys: 25 } },
  ice_golem: { name: 'Ice Golem', spr: 'IceGolem', hp: 110, acv: 16, atk: 9, dmg: [3, 6, 2], spd: 1.7, xp: 340, gold: [0, 30], tier: 3, res: { cold: 100, fire: -50, mind: 100 }, special: 'chill' },
  earth_elemental: { name: 'Earth Elemental', spr: 'EarthElemental', hp: 100, acv: 15, atk: 8, dmg: [2, 10, 2], spd: 1.8, xp: 300, gold: [0, 20], tier: 3, res: { elec: 100, poison: 100, phys: 25 } },
  fire_elemental: { name: 'Fire Elemental', spr: 'FireElemental', hp: 80, acv: 16, atk: 9, dmg: [2, 8, 2], spd: 2.6, xp: 320, gold: [0, 20], tier: 3, res: { fire: 100, cold: -50, poison: 100 }, spell: 'fire_bolt', light: true },
  water_elemental: { name: 'Water Elemental', spr: 'WaterElemental', hp: 95, acv: 15, atk: 8, dmg: [2, 8, 2], spd: 2.2, xp: 310, gold: [0, 20], tier: 3, res: { cold: 100, fire: 50, elec: -50, poison: 100 }, spell: 'ice_bolt' },
  air_elemental: { name: 'Air Elemental', spr: 'AirElemental', hp: 75, acv: 20, atk: 10, dmg: [2, 8, 1], spd: 3.6, xp: 330, gold: [0, 20], tier: 3, res: { elec: 100, poison: 100, phys: 25 }, fly: true, spell: 'spark' },
  naga: { name: 'Green Naga', spr: 'GreenNaga', hp: 85, acv: 16, atk: 9, dmg: [2, 8, 2], spd: 2.4, xp: 300, gold: [40, 90], tier: 3, special: 'poison', spell: 'acid' },
  minotaur: { name: 'Minotaur', spr: 'BestialMinotaur', hp: 120, acv: 15, atk: 10, dmg: [3, 8, 3], spd: 2.8, xp: 400, gold: [30, 80], tier: 3, size: 1.3 },
  cube: { name: 'Gelatinous Cube', spr: 'GelatinousCube', hp: 150, acv: 8, atk: 6, dmg: [2, 8, 0], spd: 1.0, xp: 280, gold: [20, 80], tier: 3, res: { elec: 100, poison: 100, cold: 50 }, special: 'poison' },
  mimic: { name: 'Mimic', spr: 'HungryMimic', hp: 90, acv: 14, atk: 9, dmg: [3, 6, 2], spd: 1.6, xp: 320, gold: [80, 200], tier: 3, mimic: true },
  necromancer: { name: 'Necromancer', spr: 'AdeptNecromancer', hp: 48, acv: 12, atk: 7, dmg: [1, 6, 1], spd: 2.2, xp: 280, gold: [40, 100], tier: 3, spell: 'dark_bolt', special: 'summon:scarecrow' },
  witch: { name: 'Vile Witch', spr: 'VileWitch', hp: 44, acv: 12, atk: 6, dmg: [1, 6, 1], spd: 2.3, xp: 260, gold: [30, 90], tier: 3, spell: 'poison_bolt' },
  sorceress: { name: 'Sorceress', spr: 'DeftSorceress', hp: 42, acv: 13, atk: 7, dmg: [1, 4, 1], spd: 2.4, xp: 270, gold: [40, 100], tier: 3, spell: 'fire_bolt' },
  cryomancer: { name: 'Cryomancer', spr: 'CapableCryomancer', hp: 50, acv: 13, atk: 7, dmg: [1, 6, 1], spd: 2.2, xp: 290, gold: [40, 100], tier: 3, spell: 'ice_bolt', res: { cold: 50 } },
  pyromancer: { name: 'Pyromancer', spr: 'NovicePyromancer', hp: 46, acv: 12, atk: 7, dmg: [1, 6, 1], spd: 2.3, xp: 280, gold: [40, 100], tier: 3, spell: 'fire_bolt', res: { fire: 50 } },
  enchanter: { name: 'Enchanter', spr: 'BeginnerEnchanter', hp: 40, acv: 12, atk: 6, dmg: [1, 4, 1], spd: 2.4, xp: 240, gold: [40, 100], tier: 3, spell: 'spark' },
  illusionist: { name: 'Illusionist', spr: 'MasterIllusionist', hp: 55, acv: 16, atk: 8, dmg: [1, 6, 1], spd: 2.5, xp: 350, gold: [50, 120], tier: 3, spell: 'dark_bolt', special: 'blink' },
  venomancer: { name: 'Venomancer', spr: 'MasterfulVenomancer', hp: 60, acv: 14, atk: 8, dmg: [2, 6, 1], spd: 2.4, xp: 360, gold: [50, 120], tier: 3, spell: 'poison_bolt', special: 'poison' },
  // tier 4
  obsidian_golem: { name: 'Obsidian Golem', spr: 'ObsidianGolem', hp: 220, acv: 24, atk: 12, dmg: [4, 8, 4], spd: 1.6, xp: 800, gold: [0, 60], tier: 4, res: { fire: 100, mind: 100, poison: 100, phys: 25 } },
  brass_golem: { name: 'Brass Golem', spr: 'BrassGolem', hp: 190, acv: 22, atk: 12, dmg: [3, 10, 3], spd: 1.8, xp: 700, gold: [20, 80], tier: 4, res: { fire: 100, elec: -25, mind: 100, poison: 100 } },
  flesh_golem: { name: 'Flesh Golem', spr: 'FleshGolem', hp: 240, acv: 14, atk: 11, dmg: [4, 8, 3], spd: 1.9, xp: 650, gold: [0, 30], tier: 4, res: { mind: 100, poison: 100, elec: -50 }, special: 'regen' },
  flame_magus: { name: 'Flame Magus', spr: 'FlameMagus', hp: 90, acv: 16, atk: 10, dmg: [2, 6, 2], spd: 2.4, xp: 600, gold: [80, 200], tier: 4, spell: 'fireball', res: { fire: 100 } },
  frost_magus: { name: 'Frost Magus', spr: 'FrostMagus', hp: 90, acv: 16, atk: 10, dmg: [2, 6, 2], spd: 2.4, xp: 600, gold: [80, 200], tier: 4, spell: 'ice_bolt', res: { cold: 100 }, special: 'chill' },
  wizard: { name: 'Wizard', spr: 'WiseWizard', hp: 110, acv: 18, atk: 11, dmg: [2, 6, 2], spd: 2.3, xp: 750, gold: [100, 260], tier: 4, spell: 'lightning', special: 'blink' },
  gargoyle: { name: 'Granite Gargoyle', spr: 'GraniteGargoyle', hp: 160, acv: 22, atk: 12, dmg: [3, 8, 3], spd: 3.2, xp: 700, gold: [0, 40], tier: 4, fly: true, res: { phys: 25, poison: 100, mind: 100 } },
  beholder: { name: 'Beholder', spr: 'ConjuringBeholder', hp: 180, acv: 20, atk: 13, dmg: [3, 8, 2], spd: 2.0, xp: 1200, gold: [150, 400], tier: 4, fly: true, spell: 'dark_bolt', special: 'blink' },
  djinn: { name: 'Djinn', spr: 'PowerfulDjinn', hp: 200, acv: 22, atk: 13, dmg: [3, 10, 3], spd: 3.0, xp: 1100, gold: [200, 500], tier: 4, fly: true, spell: 'lightning', res: { elec: 100, fire: 50 } },
  nature_elemental: { name: 'Nature Elemental', spr: 'NatureElemental', hp: 170, acv: 18, atk: 11, dmg: [3, 8, 3], spd: 2.0, xp: 650, gold: [0, 40], tier: 4, res: { poison: 100, fire: -50, elec: 50 }, special: 'regen' },
  mithril_construct: { name: 'Mithril Sentinel', spr: 'MithrilConstruct', hp: 320, acv: 26, atk: 14, dmg: [4, 10, 4], spd: 2.0, xp: 2500, gold: [300, 600], tier: 4, boss: true, size: 1.6, res: { mind: 100, poison: 100, cold: 100, fire: 50 } },
  efreeti: { name: 'Molten Efreeti', spr: 'MoltenEfreeti', hp: 360, acv: 24, atk: 15, dmg: [4, 10, 5], spd: 2.6, xp: 3000, gold: [400, 800], tier: 4, boss: true, size: 1.7, spell: 'fireball', res: { fire: 100, cold: -50, poison: 100 }, light: true },
  elder_treant: { name: 'Elder Barrow Treant', spr: 'GrizzledTreant', hp: 300, acv: 18, atk: 12, dmg: [4, 8, 4], spd: 1.5, xp: 1500, gold: [100, 300], tier: 3, boss: true, size: 1.7, res: { fire: -50, poison: 100, cold: 50 }, special: 'summon:treant', summonMax: 2, summonCount: 1, summonEvery: 25 },
  adamantium_golem: { name: 'The Hollow Regent', spr: 'AdamantiumGolem', hp: 360, acv: 22, atk: 15, dmg: [4, 8, 2], spd: 2.0, xp: 8000, gold: [1000, 2000], tier: 5, boss: true, size: 2.0, res: { mind: 100, poison: 100, fire: 50, cold: 50, elec: -50 }, special: 'summon:gargoyle', summonMax: 1, summonCount: 1, summonEvery: 45 },
};
const MONSTER_SPELLS = {
  spark: { dmg: [1, 6, 0], elem: 'elec', range: 6, proj: 'spark' }, fire_bolt: { dmg: [2, 6, 0], elem: 'fire', range: 7, proj: 'fire' }, ice_bolt: { dmg: [2, 6, 0], elem: 'cold', range: 7, proj: 'ice', slow: true },
  dark_bolt: { dmg: [3, 6, 0], elem: 'mind', range: 7, proj: 'dark' }, poison_bolt: { dmg: [2, 6, 0], elem: 'poison', range: 7, proj: 'poison', poison: true }, acid: { dmg: [2, 8, 0], elem: 'poison', range: 6, proj: 'poison' },
  lightning: { dmg: [4, 6, 0], elem: 'elec', range: 8, proj: 'spark' }, fireball: { dmg: [3, 6, 0], elem: 'fire', range: 7, proj: 'fire', aoe: 2 }, heal_ally: { heal: 20, range: 6 }, fear_party: { fear: 4, range: 6 },
};
