// ===================== progression: the party starts weak and earns every power =====================
const XP_TIER = [0, 1, 2.5, 5, 8];
const xpFor = L => Math.round(12 * (L - 1) ** 1.75); // total xp needed to reach level L
const HERO_PROG = {
  warrior: { titles: [[1, 'SQUIRE'], [3, 'KNIGHT-ERRANT'], [6, 'BATTLEMAGE'], [10, 'WARLORD']], ult: 10 },
  pyro: { titles: [[1, 'APPRENTICE'], [4, 'PYROMANCER'], [7, 'FLAME MAGUS'], [13, 'ARCHMAGE OF CINDERS']], ult: 7, evolve: { lvl: 7, spr: 'FlameMagus' } },
  storm: { titles: [[1, 'HEDGE MAGE'], [4, 'STORMCALLER'], [9, 'THUNDERLORD']], ult: 9, evolve: { lvl: 9, spr: 'WiseWizard' } },
  druid: { titles: [[1, 'HERBALIST'], [3, 'DRUID'], [8, 'EARTHSHAPER'], [12, 'WORLDROOT']], ult: 12 },
};
const UNLOCKS = [
  [2, 'pyro', 'FIREBALL'], [2, 'storm', 'CHAIN LIGHTNING'],
  [3, 'warrior', 'CRUSHING BLOW'], [3, 'druid', 'STONE SPIKES'],
  [4, 'pyro', 'GREATER FIREBALL'], [4, 'storm', 'FORKED CHAINS'],
  [5, 'warrior', 'WHIRLWIND'], [5, 'pyro', 'FLAME NOVA'],
  [6, 'storm', 'BALL LIGHTNING'], [6, 'druid', 'MASS HEAL'],
  [7, 'pyro', 'METEOR STORM'], [8, 'druid', 'RESURRECTION'], [9, 'storm', 'THUNDERSTORM'],
  [10, 'warrior', 'CATACLYSM'], [11, 'warrior', 'SHOCKWAVE BLOWS'], [12, 'druid', 'EARTHQUAKE'],
];
const UNLOCK_LV = {}; for (const [l, , n] of UNLOCKS) UNLOCK_LV[n] = l;
const has = n => G.lvl >= UNLOCK_LV[n];
const ultUnlocked = h => h && h.team === 'hero' && G.lvl >= HERO_PROG[h.key].ult;
function heroTitle(h) { let t = ''; for (const [l, n] of HERO_PROG[h.key].titles) if (G.lvl >= l) t = n; return t; }
function scaleParty() {
  const L = G.lvl;
  for (const h of G.heroes) { h.mul = 1 + 0.17 * (L - 1); const mx = Math.round(h.def.hp * (0.6 + 0.08 * (L - 1))); h.hp = h.dead ? 0 : Math.max(1, Math.round(h.hp / h.maxHp * mx)); h.maxHp = mx; }
}
function gainXp(n) { G.xp += n; let ups = 0; while (G.xp >= xpFor(G.lvl + 1) && ups < 3) { ups++; levelUp(); } }
function levelUp() {
  G.lvl++; scaleParty(); const L = G.lvl;
  for (const h of G.heroes) {
    if (h.dead) continue; heal(h, h.maxHp * 0.35); column(h.x, h.y, 'gold', 1.3, 11); ring(h.x, h.y, 34, 'gold', 0.5, 4); flashLight(h.x, h.y, 90, 'gold', 1.5, 0.6);
    for (let i = 0; i < 14; i++) part({ k: 'glow', x: h.x + rand(-8, 8), y: h.y + rand(-4, 4), z: rand(0, 12), vz: rand(40, 110), drag: 0.8, life: rand(0.7, 1.3), s0: rand(1.5, 3), s1: 0, col: 'gold' });
    const ev = HERO_PROG[h.key].evolve; if (ev && ev.lvl === L) ascend(h, ev.spr);
  }
  flash('gold', 0.22); slowmo(0.45, 0.45); kick(0.05); SFX.levelup();
  const news = UNLOCKS.filter(u => u[0] === L).map(([, k, n]) => HERO_DEFS[k].name + ' LEARNS ' + n);
  const asc = G.heroes.find(h => HERO_PROG[h.key].evolve && HERO_PROG[h.key].evolve.lvl === L);
  pushBanner({ a: 'LEVEL ' + L, b: news.length ? news.join('   ·   ') : 'EVERY POWER GROWS STRONGER', col: 'gold', keep: true, life: 2.6 });
  if (asc) pushBanner({ a: asc.def.name + ' ASCENDS', b: heroTitle(asc), col: asc.def.col, keep: true, life: 2.4 });
}
function ascend(h, spr) {
  h.spr = spr; h.flash = 0.6; h.squash = 0.4;
  column(h.x, h.y, h.def.col, 2, 22); ring(h.x, h.y, 70, h.def.col, 0.7, 6); ring(h.x, h.y, 40, 'white', 0.4, 4); flashLight(h.x, h.y, 200, h.def.col, 2, 0.8);
  sparks(h.x, h.y, 10, 40, h.def.col === 'bolt' ? 'bolt' : 'fire', 200, 220); glows(h.x, h.y, 10, 30, h.def.col, 120, 6, 1);
  flash('white', 0.35); shake(0.4); hitstop(0.1); SFX.braam();
}
// how strong each ability is right now
function nextUnlocks() { const l = UNLOCKS.find(u => u[0] > G.lvl); if (!l) return null; return { lvl: l[0], names: UNLOCKS.filter(u => u[0] === l[0]).map(u => u[2]) }; }
const PWR = {
  fireball: () => G.lvl < 2 ? 0.45 : G.lvl < 4 ? 0.8 : Math.min(1.5, 1 + 0.05 * (G.lvl - 4)),
  chain: () => G.lvl < 2 ? 1 : G.lvl < 4 ? 3 : Math.min(9, 4 + ((G.lvl - 4) >> 1)),
  spikes: () => G.lvl < 3 ? 2 : Math.min(12, 6 + ((G.lvl - 3) >> 1)),
  meteors: () => clamp(3 + Math.floor((G.lvl - 7) * 0.8), 3, 12),
  storm: () => clamp(2.2 + 0.3 * (G.lvl - 9), 2.2, 5),
  slam: () => clamp(1 + 0.06 * (G.lvl - 10), 1, 1.6),
  quake: () => clamp(2.8 + 0.25 * (G.lvl - 12), 2.8, 5),
};
