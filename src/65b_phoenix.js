// ===================== PHOENIX: Ignis's third High spell =====================
// A firebird bursts out of him, flies a wide loop out through the crowd and back, sets everything it passes alight and
// leaves a trail of fire on the floor. Its flight is a pure function of time, so every phone draws it smoothly.
const PHX = { o: '#4a0c06', r: '#e0402a', O: '#ff7a2a', y: '#ffd860', w: '#fff4c0' };
// seen from above, facing right: wings spread on the upbeat, swept back on the downbeat, a forked tail behind
const PHX_A = ['......oo.......', '.....oOOo......', '.....oOyOo.....', '......oOyOo....', 'o.....ooOyOoo..', 'rOOoooyywwyyOo.', 'o.....ooOyOoo..', '......oOyOo....', '.....oOyOo.....', '.....oOOo......', '......oo.......'];
const PHX_B = ['...............', '...............', '...oo..........', '...oOOo........', 'o...oOyOoo.....', 'rOOoooyywwyyOo.', 'o...oOyOoo.....', '...oOOo........', '...oo..........', '...............', '...............'];
function drawPhoenix(c, x, y, face, fr) {
  const F = fr ? PHX_B : PHX_A, x0 = Math.round(x), y0 = Math.round(y);
  for (let r = 0; r < 11; r++) { const row = F[r]; for (let q = 0; q < 15; q++) { const ch = row[q]; if (ch === '.') continue; c.fillStyle = PHX[ch]; c.fillRect(x0 + (face < 0 ? 7 - q : q - 7), y0 + r - 5, 1, 1); } }
}
// where the bird is at time t: out along its heading and back, swinging wide to one side
function phoenixAt(z, t) {
  const A = ARENA, u = clamp(t / z.D, 0, 1), a = u * TAU, along = (1 - Math.cos(a)) / 2 * z.L, across = Math.sin(a) * z.W / 2 * z.side;
  return { x: clamp(z.x0 + z.dx * along - z.dy * across, A.x0 + 6, A.x1 - 6), y: clamp(z.y0 + z.dy * along + z.dx * across, A.y0 + 4, A.y1 - 2), h: 12 + Math.sin(t * 7) * 2.5 };
}
function phoenix(h, t) {
  const m = md('PHOENIX'), d = Math.max(1, dist(h.x, h.y, t.x, t.y)), dx = (t.x - h.x) / d, dy = (t.y - h.y) / d, L = clamp(d * 1.3, 100, 170) * m.size;
  for (let k = 0; k <= m.count; k++) hazard({ k: 'phoenix', x: h.x, y: h.y, x0: Math.round(h.x), y0: Math.round(h.y), dx: Math.round(dx * 1000) / 1000, dy: Math.round(dy * 1000) / 1000, L: Math.round(L), W: Math.round(L * 0.55), side: k % 2 ? -1 : 1, D: 1.7, delay: 0, fl: 2.4 * m.dur, life: 1.8, dmg: D(h) * 2.4 * m.dmg, src: h });
  HFX.phoenixRise(h.x, h.y);
}
Object.assign(HFX, {
  phoenixRise(x, y) { glows(x, y, 10, 16, 'fire', 120, 7, 0.6, 1); sparks(x, y, 8, 20, 'fire', 180, 160); ring(x, y, 24, 'fire2', 0.3, 3); flashLight(x, y, 90, 'fire', 1.3, 0.3); SFX.fire(panOf(x)); SFX.whoosh(panOf(x)); },
});
Object.assign(HAZSIM, {
  // the host: each foe it passes through is struck once and set burning; fire is left on the floor every few steps
  phoenix(z, dt) {
    const p = phoenixAt(z, z.t); if (z._px !== undefined) z._trail = (z._trail || 0) + dist(p.x, p.y, z._px, z._py); z._px = p.x; z._py = p.y; z.x = p.x; z.y = p.y;
    for (const u of G.mons) if (!u.dead && u.spawnT <= 0 && u.carried !== 2 && !z.hit.has(u) && dist(p.x, p.y, u.x, u.y) < 12 + u.r) { z.hit.add(u); const a = angTo(p.x, p.y, u.x, u.y); hurt(u, z.dmg, z.src, { elem: 'fire', kx: Math.cos(a) * 110, ky: Math.sin(a) * 80, up: 60 }); if (!u.dead) { u.burn = Math.max(u.burn, 3); u.burnDmg = z.dmg * 0.12; u.immo = z.src; } }
    if ((z._trail || 0) > 22 && z.t < z.D) { z._trail = 0; hazard({ k: 'flame', x: p.x, y: p.y, r: 9, life: z.fl, rate: 0.4, dmg: z.dmg * 0.15, src: z.src }); }
    if (z.t >= z.D) z.dead = true;
  },
});
Object.assign(HAZFX, {
  phoenix(z, dt) {
    if (!z.D || z.t >= z.D) return; const p = phoenixAt(z, z.t), q = phoenixAt(z, z.t + 0.03), d = Math.max(0.01, dist(p.x, p.y, q.x, q.y)), bx = p.x - (q.x - p.x) / d * 7, by = p.y - (q.y - p.y) / d * 7; light(p.x, p.y, 55, 'fire', 0.9);
    // behind it: a crisp stream of pixel embers and only a faint soft glow, so the bird itself stays readable
    for (let i = 0; i < 3; i++) part({ k: 'pix', x: bx + rand(-2, 2), y: by + rand(-2, 2), z: p.h + rand(-3, 3), vx: rand(-12, 12), vy: rand(-6, 6), vz: rand(-8, 12), g: 120, life: rand(0.3, 0.7), s0: 1, col: i ? (chance(0.5) ? PHX.y : PHX.O) : PHX.r });
    if (chance(dt * 25)) part({ k: 'glow', x: bx, y: by, z: p.h, drag: 2, life: 0.3, s0: 3, s1: 0.5, col: 'fire2' });
  },
});
Object.assign(HAZDRAW.world, {
  phoenix(c, z) {
    if (!z.D || z.t >= z.D) return; const p = phoenixAt(z, z.t), q = phoenixAt(z, z.t + 0.03), face = q.x - p.x < -0.05 ? -1 : q.x - p.x > 0.05 ? 1 : (z._f || 1); z._f = face;
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(Math.round(p.x) - 4, Math.round(p.y), 9, 1); c.fillRect(Math.round(p.x) - 2, Math.round(p.y) + 1, 5, 1);
    drawPhoenix(c, p.x, p.y - p.h, face, ((z.t * 11) | 0) % 2);
  },
});
Object.assign(HAZDRAW.fx, {
  phoenix(c, z) { if (!z.D || z.t >= z.D) return; const p = phoenixAt(z, z.t), y = p.y - p.h; c.globalAlpha = 0.2; c.drawImage(GLOW.fire, p.x - 14, y - 11, 28, 22); c.globalAlpha = 0.65; drawPhoenix(c, p.x, y, z._f || 1, ((z.t * 11) | 0) % 2); c.globalAlpha = 1; }, // the same pixels again, glowing, and only a faint halo
});
SPELLBOOK.pyro.splice(SPELLBOOK.pyro.findIndex(s => s.name === 'METEOR STORM'), 0, { name: 'PHOENIX', lvl: 12, tier: 3, cd: 9, wind: 0.5, pick: (h, f) => cluster(h, f, 30, 3, 170) || nearestFoe(h, f, 150), cast: phoenix });
SPELL_INFO['PHOENIX'] = 'A firebird loops out through the crowd and back, setting every foe it passes alight and leaving fire behind';
MODS['PHOENIX'] = [['TWIN PHOENIX', 'A second bird loops the other way', { count: 1 }], ['SEARING WINGS', '+60% damage', { dmg: 1.6 }], ['ASHEN TRAIL', 'Its trail of fire burns 80% longer', { dur: 1.8 }]];
