// ===================== units: the party, the horde, damage and death =====================
const HERO_DEFS = {
  warrior: { name: 'BRANDT', title: 'BATTLEMAGE', spr: 'SkilledBattlemage', hp: 560, spd: 56, r: 6, role: 'melee', col: 'gold', dmg: 24 },
  pyro: { name: 'IGNIS', title: 'PYROMANCER', spr: 'NovicePyromancer', hp: 270, spd: 46, r: 5, role: 'caster', col: 'fire', dmg: 30 },
  storm: { name: 'VOLTAIRE', title: 'STORMCALLER', spr: 'CapableCryomancer', hp: 270, spd: 46, r: 5, role: 'caster', col: 'bolt', dmg: 26 },
  druid: { name: 'MOSSA', title: 'EARTHSHAPER', spr: 'ExpertDruid', hp: 330, spd: 46, r: 5, role: 'support', col: 'heal', dmg: 22 },
};
const MON_DEFS = {
  goblin: { spr: 'GoblinFighter', hp: 46, spd: 38, dmg: 9, ai: 'melee', tier: 1 },
  fanatic: { spr: 'GoblinFanatic', hp: 38, spd: 50, dmg: 11, ai: 'melee', tier: 1 },
  garcher: { spr: 'GoblinArcher', hp: 32, spd: 34, dmg: 8, ai: 'ranged', tier: 1, shot: 'arrow' },
  dog: { spr: 'BlinkDog', hp: 34, spd: 66, dmg: 7, ai: 'melee', tier: 1 },
  rogue: { spr: 'HalflingRogue', hp: 40, spd: 52, dmg: 10, ai: 'melee', tier: 1 },
  slinger: { spr: 'HalflingSlinger', hp: 30, spd: 36, dmg: 8, ai: 'ranged', tier: 1, shot: 'stone' },
  occultist: { spr: 'GoblinOccultist', hp: 42, spd: 32, dmg: 12, ai: 'caster', tier: 2, shot: 'arcane' },
  gladiator: { spr: 'LizardfolkGladiator', hp: 92, spd: 42, dmg: 14, ai: 'melee', tier: 2 },
  spear: { spr: 'LizardfolkSpearman', hp: 82, spd: 42, dmg: 13, ai: 'melee', tier: 2, reach: 6 },
  larcher: { spr: 'LizardfolkArcher', hp: 62, spd: 38, dmg: 11, ai: 'ranged', tier: 2, shot: 'arrow' },
  satyr: { spr: 'SneakySatyr', hp: 72, spd: 54, dmg: 12, ai: 'melee', tier: 2 },
  scarecrow: { spr: 'ScarecrowGolem', hp: 110, spd: 32, dmg: 14, ai: 'melee', tier: 2, blood: 'straw' },
  witch: { spr: 'VileWitch', hp: 62, spd: 34, dmg: 14, ai: 'caster', tier: 2, shot: 'poison' },
  stone: { spr: 'StoneGolem', hp: 270, spd: 28, dmg: 22, ai: 'heavy', tier: 3, scale: 1.35, blood: 'rock' },
  clay: { spr: 'ClayGolem', hp: 230, spd: 30, dmg: 20, ai: 'heavy', tier: 3, scale: 1.3, blood: 'rock' },
  minotaur: { spr: 'BestialMinotaur', hp: 250, spd: 46, dmg: 24, ai: 'heavy', tier: 3, scale: 1.35 },
  treant: { spr: 'CorruptedTreant', hp: 270, spd: 26, dmg: 20, ai: 'heavy', tier: 3, scale: 1.35, blood: 'wood' },
  firel: { spr: 'FireElemental', hp: 150, spd: 40, dmg: 16, ai: 'caster', tier: 3, shot: 'fire', blood: 'fire' },
  naga: { spr: 'GreenNaga', hp: 140, spd: 38, dmg: 16, ai: 'caster', tier: 3, shot: 'poison', blood: 'slime' },
  necro: { spr: 'AdeptNecromancer', hp: 110, spd: 32, dmg: 16, ai: 'caster', tier: 3, shot: 'arcane' },
  iron: { spr: 'IronGolem', hp: 400, spd: 26, dmg: 28, ai: 'heavy', tier: 4, scale: 1.45, blood: 'metal' },
  obsidian: { spr: 'ObsidianGolem', hp: 430, spd: 26, dmg: 28, ai: 'heavy', tier: 4, scale: 1.45, blood: 'rock' },
  gargoyle: { spr: 'GraniteGargoyle', hp: 220, spd: 58, dmg: 20, ai: 'melee', tier: 4, blood: 'rock' },
  djinn: { spr: 'PowerfulDjinn', hp: 210, spd: 40, dmg: 18, ai: 'caster', tier: 4, shot: 'zap' },
  cube: { spr: 'GelatinousCube', hp: 380, spd: 22, dmg: 24, ai: 'heavy', tier: 4, scale: 1.45, blood: 'slime' },
};
const TIER_COST = [0, 1, 2.5, 6, 10];
const BOSS_DEFS = [
  { spr: 'MithrilConstruct', name: 'THE MITHRIL COLOSSUS', sub: 'IT WAS BUILT TO GUARD THE GRAIN', hp: 2600, moves: ['slam', 'volley', 'charge', 'summon'], blood: 'metal', col: 'bolt' },
  { spr: 'BestialMinotaur', name: 'GORETUSK', sub: 'LORD OF THE LOWER STORES', hp: 2500, moves: ['charge', 'slam', 'charge', 'summon'], col: 'red' },
  { spr: 'ConjuringBeholder', name: 'THE ALL-SEEING', sub: 'IT HAS WATCHED YOU SINCE THE STAIRS', hp: 2300, moves: ['beam', 'volley', 'summon', 'beam'], col: 'arcane' },
  { spr: 'MoltenEfreeti', name: 'THE MOLTEN EFREETI', sub: 'THE KILN NEVER COOLED', hp: 2500, moves: ['volley', 'beam', 'slam', 'summon'], blood: 'fire', col: 'fire' },
  { spr: 'GrizzledTreant', name: 'THE ROTWOOD ANCIENT', sub: 'ROOTS THROUGH EVERY WALL', hp: 3000, moves: ['slam', 'summon', 'volley', 'slam'], blood: 'wood', col: 'heal' },
  { spr: 'AdamantiumGolem', name: 'ADAMANT THE UNBROKEN', sub: 'NOTHING HAS EVER SCRATCHED IT', hp: 3400, moves: ['slam', 'charge', 'volley', 'slam', 'summon'], blood: 'metal', col: 'gold' },
];
const BLOOD = { red: ['#7a0c14', '#a01420', '#5a0810'], rock: ['#6b625a', '#8a8076', '#4a423c'], wood: ['#6a4a2a', '#8a6638', '#4a3018'], metal: ['#9aa4b0', '#c8d0d8', '#6a7480'], fire: ['#ff8a20', '#ffd060', '#c03010'], slime: ['#3a8a30', '#60c040', '#2a5a20'], straw: ['#c8a040', '#e0c060', '#8a6a20'] };
let UID = 0;
function mkUnit(team, def, x, y, hpMul = 1) {
  const sc = def.scale || 1, hp = Math.round(def.hp * hpMul);
  return { id: ++UID, team, def, spr: def.spr, x, y, z: 0, vx: 0, vy: 0, vz: 0, kx: 0, ky: 0, r: (def.r || 5) * sc, scale: sc, hp, maxHp: hp, face: 1, anim: rand(10), cd: {}, target: null,
    flash: 0, stun: 0, shock: 0, burn: 0, atkT: 0, lunge: 0, la: 0, dead: false, deadT: 0, ult: rand(10, 45), state: null, boss: false, spawnT: 0, squash: 0, moving: false, mul: 1, slow: 0 };
}
const alive = u => u && !u.dead;
function foesOf(u) { return u.team === 'hero' ? G.mons : G.heroes.filter(alive); }
function hurt(u, amt, src, o = {}) {
  if (!u || u.dead || u.spawnT > 0 || u.carried === 2) return 0;
  if (u.iframe > 0 && u.team === 'hero') { if (chance(0.2)) textPop(u.x, u.y, 18, 'DODGE', 'gold', false); return 0; }
  let d = amt * rand(0.88, 1.12) * (o.crit ? 2 : 1);
  if (u.air && o.elem === 'bolt') d *= 1.5; // airborne foes are easy prey for lightning
  if (u.frozen > 0 && u.team === 'mon') { d *= o.shatter ? 2.5 : u.brittle ? 1.6 : 1.25; if (o.shatter) { u.frozen = 0; u.brittle = false; HFX.iceBreak(u.x, u.y, u.scale); } } // ice blocks crack
  if (u.team === 'hero') { d *= G.heroDmgTaken * (TUT.on ? 0.4 : 1) * (u.blessT > 0 ? 0.5 : 1); d *= u.def.armor || (u.def.role === 'melee' ? 0.72 : 1); }
  d = Math.max(1, Math.round(d)); u.hp -= d; u.flash = 0.12;
  if (src && src.team === 'hero' && u.team === 'mon' && src.def.leech && !src.dead) src.hp = Math.min(src.maxHp, src.hp + d * src.def.leech * (src.frenzyT > 0 ? (src.leechMul || 2) : 1)); // vampires heal from every wound
  const km = u.boss ? 0.12 : u.scale > 1.2 ? 0.45 : 1; if (o.kx || o.ky) { u.kx += (o.kx || 0) * km; u.ky += (o.ky || 0) * km; }
  if (o.up && !u.boss) u.vz = Math.max(u.vz, o.up * (u.scale > 1.2 ? 0.55 : 1));
  if (o.stun) u.stun = Math.max(u.stun, o.stun * (u.boss ? 0.15 : u.scale > 1.2 ? 0.5 : 1));
  if (o.elem === 'bolt') u.shock = 0.9; if (o.elem === 'fire') u.burn = Math.max(u.burn, 1.6); if (o.elem === 'ice' && u.team === 'mon') { u.slow = Math.max(u.slow, 1.6); u.chill = Math.max(u.chill || 0, 1.6); }
  number(u.x, u.y, u.z + 16 * u.scale, d, u.team === 'hero' ? 'red' : (o.elem || 'white'), o.crit || d > 90);
  if (src && src.team === 'hero' && u.team === 'mon' && ultUnlocked(src)) src.ult = Math.min(100, src.ult + d * 0.05);
  if (u.team === 'hero') { if (ultUnlocked(u)) u.ult = Math.min(100, u.ult + d * 0.08); if (d > 20) shake(0.06); }
  const bl = BLOOD[u.def.blood || 'red'];
  if (!o.quiet) { if (u.def.blood === 'metal' || (u.team === 'hero' && u.def.role === 'melee')) { sparks(u.x, u.y, 8 * u.scale, 6, 'white', 120, 90); SFX.clang(panOf(u.x)); } else { debris(u.x, u.y, 3, bl, 60, 90, 1.4); SFX.hit(panOf(u.x)); } }
  if (u.hp <= 0) kill(u, src, o.elem);
  return d;
}
function heal(u, amt) { if (!alive(u)) return; const h = Math.min(u.maxHp - u.hp, Math.round(amt)); if (h <= 0) return; u.hp += h; number(u.x, u.y, 18, '+' + h, 'heal', h > 60); healFx(u.x, u.y); }
function kill(u, src, elem) {
  u.dead = true; u.hp = 0;
  if (u.team === 'mon') {
    G.kills++; G.combo++; G.comboT = 2.6; G.burst++; G.burstT = 0.7;
    if (src && src.team === 'hero' && ultUnlocked(src)) src.ult = Math.min(100, src.ult + 4);
    gainXp(u.boss ? 80 + 30 * Math.floor(G.floor / 4) : (XP_TIER[u.def.tier] || 1) * (u.rank === 'warlord' ? 12 : u.rank === 'elite' ? 4 : 1));
    if (u.rank === 'warlord') { slowmo(0.25, 1); flash('white', 0.5); ring(u.x, u.y, 120, 'red', 0.7, 7); slamFx(u.x, u.y, 1.3, 'red'); textBanner(u.title + ' IS SLAIN', '', 'gold'); }
    else if (u.rank === 'elite') { ring(u.x, u.y, 60, 'red', 0.45, 5); shake(0.3); hitstop(0.06); }
    deathFx(u, elem);
    if (u.immo && u.burn > 0) { const src = u.immo, R = u.immoR || 34, dm = u.immoD || 1; after(0.05, () => { explode(u.x, u.y, 20 * Math.sqrt(R / 34), src.def.dmg * src.mul * 0.9 * dm, src); for (const m of within(u.x, u.y, R, G.mons)) { m.burn = 3; m.burnDmg = src.def.dmg * src.mul * 0.2; m.immo = src; } }); }
    if (u.boss) bossDeath(u);
  } else { u.deadT = 0; u.vz = 120; smoke(u.x, u.y, 6, 'dark', 10, 20, 1.4); flashLight(u.x, u.y, 60, 'red', 1, 0.6); textPop(u.x, u.y, 26, u.def.name + ' FALLS', 'red'); SFX.boom(0.5, panOf(u.x)); shake(0.3); }
}
// the corpse shatters into its own pixels, flavoured by what killed it
function deathFx(u, elem) {
  if (!MOBS[u.spr] || u.carried === 2) return; // carried off by bats: it dies out of sight
  const px = spritePixels(u.spr), sc = u.scale * (u.boss ? 1 : 1), fl = u.face < 0 ? -1 : 1, bl = BLOOD[u.def.blood || 'red'];
  const mode = elem === 'bolt' ? 'zap' : elem === 'fire' ? 'burn' : elem === 'ice' || u.frozen > 0 ? 'ice' : 'smash', pw = Math.max(1, Math.round(sc));
  const kx = clamp(u.kx * 0.4, -120, 120), ky = clamp(u.ky * 0.4, -120, 120), step = px.length > 200 ? 2 : 1;
  for (let i = 0; i < px.length; i += step) {
    const p = px[i], wx = u.x + p.x * sc * fl, h = -p.y * sc + u.z, a = Math.atan2(-h * 0.3, p.x * fl) + rand(-0.5, 0.5);
    if (mode === 'zap') part({ k: 'pixa', x: wx, y: u.y + rand(-1, 1), z: h, vx: Math.cos(a) * rand(30, 110) + kx, vy: rand(-50, 50) + ky, vz: rand(-20, 80), drag: 2.4, life: rand(0.4, 1), s0: pw, col: 'bolt', c2: chance(0.5) ? '#ffffff' : p.c });
    else if (mode === 'burn') { if (chance(0.55)) part({ k: 'ember', x: wx, y: u.y, z: h, vx: rand(-20, 20) + kx * 0.3, vy: rand(-10, 10), vz: rand(30, 90), drag: 1.5, life: rand(0.6, 1.6), s0: rand(1.2, 2), s1: 0.3, col: chance(0.5) ? 'ember' : 'fire' }); else part({ k: 'pix', x: wx, y: u.y, z: h, vx: rand(-30, 30) + kx, vy: rand(-20, 20) + ky, vz: rand(20, 80), g: 300, bounce: 0.3, drag: 1.4, life: rand(0.8, 1.5), s0: pw, col: '#1a1410' }); }
    else if (mode === 'ice') part({ k: 'pix', x: wx, y: u.y + rand(-1, 1), z: h, vx: Math.cos(a) * rand(40, 160) + kx, vy: rand(-70, 70) + ky, vz: rand(50, 180), g: 440, bounce: 0.3, drag: 1, life: rand(0.8, 1.8), s0: pw, col: chance(0.45) ? p.c : chance(0.5) ? '#dff4ff' : '#8fd0ff' });
    else part({ k: 'pix', x: wx, y: u.y + rand(-1, 1), z: h, vx: Math.cos(a) * rand(30, 140) + kx, vy: rand(-60, 60) + ky, vz: rand(40, 170), g: 420, bounce: 0.35, drag: 1.1, life: rand(1, 2.2), s0: pw, col: p.c });
  }
  if (mode === 'zap') { sparks(u.x, u.y, 8 * sc, 14, 'bolt', 160, 120); flashLight(u.x, u.y, 60 * sc, 'bolt', 1.2, 0.3); scorch(u.x, u.y, 9 * sc, 0.5); SFX.shatter(panOf(u.x)); }
  else if (mode === 'ice') { sparks(u.x, u.y, 8 * sc, 14, 'ice', 160, 120); flashLight(u.x, u.y, 55 * sc, 'ice', 1.1, 0.3); ring(u.x, u.y, 18 * sc, 'ice', 0.3, 3); SFX.shatter(panOf(u.x)); }
  else if (mode === 'burn') { smoke(u.x, u.y, 6, 'dark', 10 * sc, 14, 1.8, 20); glows(u.x, u.y, 8 * sc, 6, 'fire', 40, 6 * sc, 0.6); scorch(u.x, u.y, 10 * sc, 0.55); SFX.pop(panOf(u.x)); }
  else { debris(u.x, u.y, 10, bl, 140, 160, 1.8 * sc); if (!['rock', 'metal', 'fire'].includes(u.def.blood)) splat(u.x, u.y, bl[0], 7 + 4 * sc, 7 * sc); smoke(u.x, u.y, 3, u.def.blood === 'rock' ? 'dust' : 'grey', 8 * sc, 20, 1.2); SFX.pop(panOf(u.x)); }
  ring(u.x, u.y, 14 * sc, elem === 'bolt' ? 'bolt' : elem === 'fire' ? 'fire' : 'white', 0.25, 2);
}
// physics: knockback, knock-up and collisions with walls, pillars and each other
function moveUnit(u, dt) {
  const sl = u.slow > 0 ? 0.5 : 1; if (u.slow > 0) u.slow -= dt; u.x += (u.vx * sl + u.kx) * dt; u.y += (u.vy * sl + u.ky) * dt; const f = Math.exp(-5 * dt); u.kx *= f; u.ky *= f;
  if (u.z > 0 || u.vz > 0) { u.vz -= 560 * dt; u.z += u.vz * dt; if (u.z <= 0) { u.air = 0; if (u.dropDmg) { const dd = u.dropDmg; u.dropDmg = 0; if (!u.dead) { hurt(u, dd, u.dropSrc, { elem: 'wind' }); HFX.thud(u.x, u.y); } } if (u.vz < -150) { u.squash = 0.35; debris(u.x, u.y, 3, ['#5a5048', '#7d7064'], 50, 60, 1.2); smoke(u.x, u.y, 2, 'dust', 6, 14, 0.8); if (u.vz < -260 && !u.dead) hurt(u, 6, null, { quiet: true }); } u.z = 0; u.vz = 0; } }
  const A = ARENA; if (u.windT > 0) { u.windT -= dt; windWall(u, A); } if (u.x < A.x0 + u.r) { u.x = A.x0 + u.r; u.kx = Math.abs(u.kx) * 0.3; } if (u.x > A.x1 - u.r) { u.x = A.x1 - u.r; u.kx = -Math.abs(u.kx) * 0.3; }
  if (u.y < A.y0 + u.r * 0.4) { u.y = A.y0 + u.r * 0.4; u.ky = Math.abs(u.ky) * 0.3; } if (u.y > A.y1) { u.y = A.y1; u.ky = -Math.abs(u.ky) * 0.3; }
  for (const p of A.props) { if (!p.solid || p.dead) continue; const dx = u.x - p.x, dy = u.y - p.cy, d = Math.hypot(dx, dy), m = u.r + p.r; if (d < m) { const nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0; u.x = p.x + nx * m; u.y = p.cy + ny * m; } }
  if (u.squash > 0) u.squash = Math.max(0, u.squash - dt * 2.5);
}
function separate(list, dt) {
  for (let i = 0; i < list.length; i++) { const a = list[i]; if ((a.dead && a.team === 'mon') || a.carried) continue; for (let j = i + 1; j < list.length; j++) { const b = list[j]; if (b.dead || b.carried) continue; const dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r; if (Math.abs(dx) > m || Math.abs(dy) > m) continue; const d = Math.hypot(dx, dy); if (d < m && d > 0.01) { const push = (m - d) * 0.5, nx = dx / d, ny = dy / d, wa = a.boss ? 0.1 : b.boss ? 1.9 : 1, wb = 2 - wa; if (!a.dead) { a.x -= nx * push * wa; a.y -= ny * push * wa; } b.x += nx * push * wb; b.y += ny * push * wb; } } }
}
// steering toward a point with a little obstacle avoidance
function steer(u, tx, ty, spd, dt, stopAt = 0) {
  let dx = tx - u.x, dy = ty - u.y; const d = Math.hypot(dx, dy);
  if (d <= stopAt + 0.5) { u.vx = damp(u.vx, 0, 10, dt); u.vy = damp(u.vy, 0, 10, dt); u.moving = false; return d; }
  dx /= d; dy /= d;
  for (const p of ARENA.props) { if (!p.solid || p.dead) continue; const ox = p.x - u.x, oy = p.cy - u.y, od = Math.hypot(ox, oy); if (od < u.r + p.r + 14 && (ox * dx + oy * dy) > 0) { const side = (ox * dy - oy * dx) > 0 ? 1 : -1, tx = -dy * side, ty = dx * side; dx += tx * 1.2; dy += ty * 1.2; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; } }
  u.vx = damp(u.vx, dx * spd, 9, dt); u.vy = damp(u.vy, dy * spd, 9, dt); u.moving = true; if (Math.abs(dx) > 0.2) u.face = dx < 0 ? -1 : 1; return d;
}
function nearest(u, list, maxD = 1e9) { let best = null, bd = maxD; for (const o of list) { if (o.dead || o.spawnT > 0) continue; const d = dist(u.x, u.y, o.x, o.y); if (d < bd) { bd = d; best = o; } } return best; }
function within(x, y, r, list) { const out = []; for (const o of list) if (!o.dead && o.spawnT <= 0 && dist(x, y, o.x, o.y) < r + o.r) out.push(o); return out; }
function densest(list, r, from, maxD) { let best = null, bn = 0; for (const o of list) { if (o.dead || o.spawnT > 0) continue; if (from && dist(from.x, from.y, o.x, o.y) > maxD) continue; const n = within(o.x, o.y, r, list).length; if (n > bn) { bn = n; best = o; } } return best ? { x: best.x, y: best.y, n: bn, u: best } : null; }
