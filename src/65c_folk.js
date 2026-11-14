// ===================== the folk of the farmhouse, and a cherub =====================
// A few villagers come down with the heroes on every cellar floor. Monsters hunt them like heroes; they cannot fight.
// They run from the monsters and hide behind pillars and heroes; when nothing is close they cower where they are.
// Whoever is still standing when the floor is cleared runs for the stairs, and every one saved is worth XP and a heal.
const FOLK_DEFS = [['OverworkedVillager', 'THE FARMHAND'], ['GentleShepard', 'THE SHEPHERD'], ['JovialFriar', 'THE FRIAR'], ['JoyfulKid', 'A CHILD'], ['PlayfulChild', 'A CHILD'], ['BoisterousYouth', 'A FARM BOY'], ['AdventurousAdolescent', 'A FARM GIRL']]
  .map(([spr, name]) => ({ spr, name, hp: 110, spd: 44, r: 4, role: 'folk' }));
const FOLK_THANKS = ['THANK YOU!', 'YOU CAME!', 'BLESS YOU!', 'I KNEW IT!', 'HOME, HOME!', 'THANK YOU, HEROES!'];
const FOLK_N = 3;
function spawnFolk(n = FOLK_N) {
  const A = ARENA, cx = A.pw / 2, cy = A.y1 - 34, used = new Set(); G.folkTotal = n;
  for (let i = 0; i < n; i++) {
    let d; do d = pick(FOLK_DEFS); while (used.has(d.spr) && used.size < FOLK_DEFS.length); used.add(d.spr);
    const x = cx + (i - (n - 1) / 2) * 26 + rand(-4, 4), y = cy + rand(-6, 4), u = mkUnit('folk', d, x, y, 1 + 0.25 * (G.floor - 1));
    u.face = x < cx ? 1 : -1; u.planT = 0; G.units.push(u); column(x, y, 'gold', 0.6, 8);
  }
  textPop(cx, cy, 30, 'HELP US!', 'gold');
}
const folkThreats = (u, r) => G.mons.filter(m => !m.dead && !(m.spawnT > 0) && !m.carried && dist(m.x, m.y, u.x, u.y) < r);
// the host: run, hide, cower; once the floor is cleared, run for the stairs
function folkAI(u, dt) {
  if (u.stun > 0) { u.stun -= dt; u.vx = damp(u.vx, 0, 8, dt); u.vy = damp(u.vy, 0, 8, dt); u.moving = false; return; }
  const A = ARENA;
  if (u.go) { u.cower = false; const d = steer(u, u.ex, u.ey, 72, dt, 3); u.face = u.ex < u.x ? -1 : 1; if (d < 5) { u.dead = true; u.gone = true; } return; }
  const near = folkThreats(u, 130);
  if (!near.length) { // nothing close: keep near a hero, a step behind them, and cower if monsters are about
    const h = nearest(u, G.heroes.filter(alive)); u.cower = G.mons.length > 0;
    if (h && dist(u.x, u.y, h.x, h.y) > 46) { steer(u, h.x + (u.x < h.x ? -16 : 16), h.y + 10, u.def.spd * 0.7, dt, 6); u.cower = false; }
    else { u.vx = damp(u.vx, 0, 8, dt); u.vy = damp(u.vy, 0, 8, dt); u.moving = false; }
    return;
  }
  // plan where to hide: behind a pillar (on the far side from the monsters), behind a hero, or simply further away
  if ((u.planT -= dt) <= 0) {
    u.planT = 0.35; const cx = near.reduce((a, m) => a + m.x, 0) / near.length, cy = near.reduce((a, m) => a + m.y, 0) / near.length, cand = [];
    for (const p of A.props) if (p.kind === 'pillar') { const d = Math.max(1, dist(cx, cy, p.x, p.y)); cand.push([p.x + (p.x - cx) / d * 13, p.y + (p.y - cy) / d * 9]); }
    for (const h of G.heroes) if (alive(h)) { const d = Math.max(1, dist(cx, cy, h.x, h.y)); cand.push([h.x + (h.x - cx) / d * 16, h.y + (h.y - cy) / d * 12]); }
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; cand.push([u.x + Math.cos(a) * 55, u.y + Math.sin(a) * 40]); }
    let best = null, bs = -1e9;
    for (const [x0, y0] of cand) {
      const x = clamp(x0, A.x0 + 6, A.x1 - 6), y = clamp(y0, A.y0 + 6, A.y1 - 4); let md = 1e9; for (const m of near) md = Math.min(md, dist(x, y, m.x, m.y));
      const s = md - 0.45 * dist(u.x, u.y, x, y) - (x0 !== x || y0 !== y ? 25 : 0); if (s > bs) { bs = s; best = [x, y]; }
    }
    u.tx = best[0]; u.ty = best[1];
  }
  const close = Math.min(...near.map(m => dist(m.x, m.y, u.x, u.y))), d = steer(u, u.tx, u.ty, u.def.spd * (close < 40 ? 1.25 : 1), dt, 3);
  u.cower = d < 6 && close > 45; if (Math.abs(u.vx) > 3) u.face = u.vx < 0 ? -1 : 1;
}
// a villager dies: no XP, only a loss
function folkLost(u, elem) { deathFx(u, elem); textPop(u.x, u.y, 26, u.def.name + ' IS LOST', 'red'); SFX.hit(panOf(u.x)); flashLight(u.x, u.y, 50, 'red', 0.8, 0.4); }
// the floor is cleared: survivors cheer and run for the stairs; each one saved is worth XP and heals the party a little
function folkRescue() {
  const alive2 = G.units.filter(u => u.team === 'folk' && !u.dead); if (!G.folkTotal) return;
  for (const u of alive2) { u.go = true; u.ex = Math.round(ARENA.pw / 2 + rand(-10, 10)); u.ey = Math.round(ARENA.y0 + 2); u.vz = 110; textPop(u.x, u.y, 22, pick(FOLK_THANKS), 'heal'); }
  const n = alive2.length, t = G.folkTotal;
  if (n) { gainXp(n * (8 + 4 * G.floor)); for (const h of G.heroes) if (!h.dead) heal(h, h.maxHp * 0.1 * n); SFX.levelup(); }
  textBanner(n === t ? 'EVERYONE SAVED' : n ? n + ' OF ' + t + ' SAVED' : 'NO ONE WAS SAVED', n ? '+' + n * (8 + 4 * G.floor) + ' XP  ·  THE PARTY IS HEALED' : 'THE CELLAR TOOK THEM', n ? 'heal' : 'red', true);
  G.folkTotal = 0;
}
// Miracle sends a cherub down over everyone it heals
Object.assign(HAZSIM, { cherub(z, dt) { const u = G.units.find(v => v.id === z.u); if (u) { z.x = u.x; z.y = u.y; } } });
Object.assign(HAZFX, { cherub(z, dt) { if (chance(dt * 14)) part({ k: 'glow', x: z.x + rand(-6, 6), y: z.y, z: rand(16, 34), vz: rand(-10, 10), life: 0.5, s0: 2, s1: 0, col: 'holy' }); } });
Object.assign(HAZDRAW.world, { cherub(c, z) { const life = Math.min(1, z.t * 3, (z.life - z.t) * 3), y = z.y - 30 - (1 - Math.min(1, z.t * 2)) * 30 + Math.sin(G.time * 4) * 1.5; drawSprite(c, 'FloatingCherub', z.x, y, ((G.time * 8) | 0) % 4, false, life); } });
