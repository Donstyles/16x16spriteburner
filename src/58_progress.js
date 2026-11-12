// ===================== progression: levels, titles, ascensions =====================
const XP_TIER = [0, 1, 2.5, 5, 8];
const xpFor = L => Math.round(16 * (L - 1) ** 2.15 * [0.72, 0.9, 1, 1][NP() - 1]); // total xp needed to reach level L
const HERO_PROG = {
  warrior: { titles: [[1, 'SQUIRE'], [4, 'KNIGHT-ERRANT'], [8, 'BATTLEMAGE'], [13, 'BLADEMASTER'], [16, 'WARLORD']], ult: 'CATACLYSM' },
  pyro: { titles: [[1, 'APPRENTICE'], [5, 'PYROMANCER'], [10, 'FLAME MAGUS'], [15, 'ARCHMAGE OF CINDERS']], ult: 'METEOR STORM', evolve: { lvl: 10, spr: 'FlameMagus' } },
  storm: { titles: [[1, 'HEDGE MAGE'], [6, 'STORMCALLER'], [12, 'THUNDERLORD']], ult: 'THUNDERSTORM', evolve: { lvl: 12, spr: 'WiseWizard' } },
  druid: { titles: [[1, 'HERBALIST'], [5, 'DRUID'], [10, 'EARTHSHAPER'], [15, 'WORLDROOT']], ult: 'EARTHQUAKE' },
};
const ultUnlocked = h => h && h.team === 'hero' && sbOf(h).known.has(HERO_PROG[h.key].ult);
function heroTitle(h) { let t = ''; for (const [l, n] of HERO_PROG[h.key].titles) if (G.lvl >= l) t = n; return t; }
function scaleParty() {
  const L = G.lvl;
  const n = NP() - 1;
  for (const h of G.heroes) { h.mul = (1 + 0.21 * (L - 1)) * [1.9, 1.45, 1.2, 1][n]; const mx = Math.round(h.def.hp * (0.65 + 0.095 * (L - 1)) * [2.4, 1.75, 1.3, 1][n]); h.hp = h.dead ? 0 : Math.max(1, Math.round(h.hp / h.maxHp * mx)); h.maxHp = mx; }
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
  const tierNow = TIER_MIN.indexOf(L); if (tierNow > 0) pushBanner({ a: TIER_LABEL[tierNow] + ' MAGIC', b: 'NEW ' + TIER_LABEL[tierNow] + ' SPELLS AWAIT AT THE END OF THIS FLOOR', col: 'gold', keep: true, life: 2.2 });
  else pushBanner({ a: 'LEVEL ' + L, b: 'STRONGER · TOUGHER · HEALED', col: 'gold', small: true, life: 1.5 });
  const asc = G.heroes.find(h => HERO_PROG[h.key].evolve && HERO_PROG[h.key].evolve.lvl === L);
  if (asc) pushBanner({ a: asc.def.name + ' ASCENDS', b: heroTitle(asc), col: asc.def.col, keep: true, life: 2.4 });
  // spells are chosen once per floor (and from boss spoils), not on every level
}
function ascend(h, spr) {
  h.spr = spr; h.flash = 0.6; h.squash = 0.4;
  column(h.x, h.y, h.def.col, 2, 22); ring(h.x, h.y, 70, h.def.col, 0.7, 6); ring(h.x, h.y, 40, 'white', 0.4, 4); flashLight(h.x, h.y, 200, h.def.col, 2, 0.8);
  sparks(h.x, h.y, 10, 40, h.def.col === 'bolt' ? 'bolt' : 'fire', 200, 220); glows(h.x, h.y, 10, 30, h.def.col, 120, 6, 1);
  flash('white', 0.35); shake(0.4); hitstop(0.1); SFX.braam();
}
function nextUnlocks() { const t = TIER_MIN.findIndex((l, i) => i > 0 && l > G.lvl); return t > 0 ? { lvl: TIER_MIN[t], names: [TIER_LABEL[t] + ' SPELLS'] } : null; }
const PWR = {
  fireball: () => Math.min(1.6, 1 + 0.06 * Math.max(0, G.lvl - 10)),
  chain: () => Math.min(9, 4 + (Math.max(0, G.lvl - 10) >> 1)),
  spikes: () => Math.min(12, 6 + (Math.max(0, G.lvl - 10) >> 1)),
  meteors: () => clamp(6 + (G.lvl - 13), 6, 12),
  storm: () => clamp(3 + 0.3 * (G.lvl - 14), 3, 5),
  slam: () => clamp(1 + 0.06 * (G.lvl - 15), 1, 1.6),
  quake: () => clamp(3 + 0.25 * (G.lvl - 15), 3, 5),
};
