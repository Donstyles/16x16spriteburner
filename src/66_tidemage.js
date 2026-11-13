// ===================== Nerida, the tidecaller: water that sweeps the horde aside, ice that holds it still =====================
// Waves roll across the floor and carry every foe they catch to the far wall. Frost slows; deeper cold turns foes into
// blocks of ice that cannot act, take extra damage, and shatter when struck hard or slammed into a wall by a wave.
COL.water = [70, 150, 255];
SPARK_PAL.ice = ['#ffffff', '#e8f8ff', '#a8e4ff', '#4aa8e0']; SPARK_PAL.water = ['#ffffff', '#d0ecff', '#6ab8ff', '#2a6ad0'];
HERO_DEFS.tide = { name: 'NERIDA', title: 'TIDECALLER', spr: 'Tidecaller', hp: 320, spd: 47, r: 5, role: 'caster', col: 'ice', dmg: 27 };
HERO_PROG.tide = { titles: [[1, 'ICE ADEPT'], [5, 'TIDECALLER'], [10, 'FROST MAGUS'], [15, 'QUEEN OF THE DEEP']], ult: 'TSUNAMI', evolve: { lvl: 10, spr: 'FrostMagus' } };
DEFAULT_BASIC.tide = 'FROST SHARD'; HERO_CLASS.tide = 'THE TIDECALLER';
HERO_BLURB.tide = ['ICE · WATER · RANGED', 'Waves sweep the horde into the far wall; frost turns it to ice.', ['GREAT WAVE', 'FLASH FREEZE', 'TSUNAMI']];
HERO_QUOTE.tide = '“Hold your breath. The tide is coming.”';
// pixel-art water: Nerida's own palette, drawn in whole world pixels like the creatures, dithered instead of blended
const WATER = { foam: '#e8f6ff', hi: '#5cc8ff', light: '#38a8f0', mid: '#1f5f9e', deep: '#14365e', abyss: '#0a1f3a' };
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], DITHER = new Map();
function dither(c, col, dens) { const k = col + dens; let p = DITHER.get(k); if (!p) { const cv = mkCanvas(4, 4), g = cv.getContext('2d'); g.fillStyle = col; for (let i = 0; i < 16; i++) if (BAYER4[i] < dens * 16) g.fillRect(i % 4, (i / 4) | 0, 1, 1); p = c.createPattern(cv, 'repeat'); DITHER.set(k, p); } return p; }
const hash2 = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
SFX.freeze = function (pan = 0) { if (!this.ok('freeze', 0.08)) return; this.noise(this.white, 0.35, 'highpass', 4000, 9000, 0.8, 0.22, pan); this.tone('sine', 2400, 3600, 0.25, 0.05, pan); this.tone('triangle', 1600, 2100, 0.3, 0.04, pan, 0.04); };
SFX.wave = function (pan = 0, big = 1) { if (!this.ok('wave', 0.3)) return; this.noise(this.white, 1.1 * big, 'lowpass', 500, 2200, 0.7, 0.3 * big, pan, 0, 0.25); this.noise(this.brown, 1.3 * big, 'lowpass', 260, 90, 1, 0.45 * big, pan, 0.05, 0.3); };
SFX.splash = function (pan = 0) { if (!this.ok('splash', 0.05)) return; this.noise(this.white, 0.3, 'bandpass', 1400, 600, 1.1, 0.25, pan); this.noise(this.brown, 0.25, 'lowpass', 500, 120, 1, 0.3, pan); };

// ---------- ice: freezing and shattering ----------
// a frozen foe cannot act, takes 25% more damage (60% when brittle), and a shattering hit deals 2.5x and breaks the ice
function freeze(u, dur, brittle) {
  if (!u || u.dead || u.team !== 'mon' || u.carried) return;
  if (u.boss) { u.slow = Math.max(u.slow, 2.5); u.chill = Math.max(u.chill || 0, 2.5); if (u.state) return; dur = Math.min(1.2, dur * 0.3); }
  else if (u.rank === 'warlord') dur *= 0.5;
  if (!(u.frozen > 0)) HFX.iceLock(u.x, u.y, u.scale);
  u.frozen = Math.max(u.frozen || 0, dur); if (brittle) u.brittle = true; if (!u.boss) u.state = null; u.vx = u.vy = 0; u.moving = false;
}
const chilled = f => f.filter(u => u.chill > 0 || u.frozen > 0);

// ---------- one-off effects (each is a single event on the wire; every phone draws the rest itself) ----------
Object.assign(HFX, {
  iceLock(x, y, s) { ring(x, y, 16 * s, 'ice', 0.3, 3); sparks(x, y, 10 * s, 8, 'ice', 90, 70); flashLight(x, y, 50, 'ice', 1, 0.3); SFX.freeze(panOf(x)); },
  iceBreak(x, y, s) {
    for (let i = 0; i < 16 * s; i++) part({ k: 'pix', x: x + rand(-4, 4), y: y + rand(-2, 2), z: rand(2, 16 * s), vx: rand(-110, 110), vy: rand(-60, 60), vz: rand(40, 160), g: 420, bounce: 0.3, drag: 1, life: rand(0.6, 1.3), s0: rand(1, 2.2), col: chance(0.5) ? '#e8f8ff' : chance(0.5) ? '#9fd8ff' : '#5ab0e8' });
    sparks(x, y, 8 * s, 10, 'ice', 150, 110); ring(x, y, 20 * s, 'white', 0.25, 3); flashLight(x, y, 60, 'ice', 1.2, 0.25); SFX.shatter(panOf(x));
  },
  splash(x, y, R) {
    ring(x, y, R, 'water', 0.35, 4); ring(x, y, R * 0.6, 'white', 0.25, 2);
    for (let i = 0; i < 18; i++) { const a = rand(TAU), sp = rand(40, 120) * R / 30; part({ k: 'pix', x, y, z: rand(2, 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: rand(60, 150), g: 420, drag: 0.8, life: rand(0.5, 1), s0: rand(1, 1.8), col: chance(0.5) ? '#bfe4ff' : '#5aa8f0' }); }
    glows(x, y, 6, 6, 'water', 60, 5, 0.5); SFX.splash(panOf(x));
  },
  frostNova(x, y, R) { ring(x, y, R, 'ice', 0.45, 6); ring(x, y, R * 0.6, 'white', 0.3, 3); for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; part({ k: 'spark', x, y, z: 6, vx: Math.cos(a) * R * 3.4, vy: Math.sin(a) * R * 2.4, drag: 3, life: 0.45, col: 'ice' }); } flashLight(x, y, R * 2.2, 'ice', 1.4, 0.4); SFX.freeze(panOf(x)); },
  whip(x, y, a, s) { for (let i = 0; i < 16; i++) { const aa = a + rand(-0.55, 0.55) * s, sp = rand(120, 220) * s; part({ k: 'pix', x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 4, z: rand(4, 10), vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.75, vz: rand(10, 60), g: 300, drag: 2.2, life: rand(0.3, 0.55), s0: rand(1, 1.8), col: chance(0.5) ? '#9fd4ff' : '#e0f4ff' }); } SFX.whoosh(panOf(x)); },
  waveStart(x, y, big) { for (let i = 0; i < 26 * big; i++) part({ k: 'pix', x: x + rand(-4, 4), y: y + rand(-30, 30) * big, z: rand(0, 14), vx: rand(-20, 20), vz: rand(50, 130), g: 360, life: rand(0.5, 1), s0: chance(0.3) ? 2 : 1, col: chance(0.5) ? WATER.foam : WATER.hi }); SFX.wave(panOf(x), big); },
  crash(x, y, h, dir) {
    for (let i = 0; i < Math.min(70, h * 0.5); i++) { const yy = y + rand(-h / 2, h / 2); part({ k: 'pix', x: x + rand(-3, 3), y: yy, z: rand(4, 26), vx: -dir * rand(40, 160), vy: rand(-30, 30), vz: rand(80, 220), g: 420, drag: 0.7, life: rand(0.7, 1.4), s0: rand(1.2, 2.4), col: chance(0.4) ? '#ffffff' : chance(0.5) ? '#9fd4ff' : '#4a98e8' }); }
    for (let k = 0; k < 4; k++) flashLight(x, y + (k - 1.5) * h / 4, 70, 'water', 1, 0.4); SFX.splash(panOf(x)); SFX.hit(panOf(x));
  },
  iceSpike(x, y, s) { part({ k: 'spike', x, y, life: 0.8, s0: rand(6, 9) * s, col: chance(0.5) ? '#cfeeff' : '#9fd8f8' }); sparks(x, y, 4, 3, 'ice', 60, 40); },
  hail(x, y) { part({ k: 'pix', x: x + 30, y, z: 140, vx: -70, vz: -330, life: 0.42, s0: 2.6, col: '#eefaff' }); part({ k: 'glow', x: x + 30, y, z: 140, vx: -70, vz: -330, life: 0.42, s0: 4, s1: 3, col: 'ice' }); },
  hailHit(x, y) { ring(x, y, 12, 'ice', 0.2, 2); sparks(x, y, 2, 6, 'ice', 90, 60); for (let i = 0; i < 5; i++) part({ k: 'pix', x, y, z: 2, vx: rand(-50, 50), vy: rand(-30, 30), vz: rand(40, 100), g: 400, life: 0.5, s0: 1.3, col: '#e8f8ff' }); SFX.pop(panOf(x)); },
  lance(x0, y0, x1, y1) { for (let k = 0; k <= 9; k++) { const f = k / 9; sparks(lerp(x0, x1, f), lerp(y0, y1, f), 8, 2, 'ice', 60, 40); } flashLight(x1, y1, 50, 'ice', 1, 0.2); SFX.freeze(panOf(x0)); },
  tomb(x, y, s) { column(x, y, 'ice', 1, 12 * s); ring(x, y, 30 * s, 'ice', 0.5, 5); sparks(x, y, 10 * s, 16, 'ice', 140, 120); flashLight(x, y, 90, 'ice', 1.4, 0.5); SFX.freeze(panOf(x)); },
  deepFreeze(x, y, R) { ring(x, y, R, 'ice', 0.7, 7); ring(x, y, R * 0.7, 'white', 0.5, 4); flash('white', 0.25); for (let i = 0; i < 40; i++) part({ k: 'glow', x: x + rand(-R, R), y: y + rand(-R, R) * 0.7, z: rand(0, 20), vz: rand(10, 40), life: rand(0.6, 1.2), s0: rand(2, 4), s1: 0, col: 'ice' }); SFX.freeze(panOf(x)); },
});

// ---------- continuous effects for the new zones (run on every phone) ----------
Object.assign(HAZFX, {
  tide(z, dt) {
    z._x = z._x === undefined ? z.x : damp(z._x + z.dir * z.spd * dt, z.x, 3, dt);
    if (z.crashed) return; const x = z._x, n = Math.max(1, (z.y1 - z.y0) / 24);
    for (let i = 0; i < n; i++) if (chance(dt * 16)) part({ k: 'pix', x: x + z.dir * rand(0, 3), y: rand(z.y0, z.y1), z: rand(4, z.big ? 22 : 12), vx: z.dir * rand(30, 100), vy: rand(-8, 8), vz: rand(30, 100), g: 330, life: rand(0.35, 0.7), s0: chance(0.3) ? 2 : 1, col: chance(0.55) ? WATER.foam : WATER.hi });
    for (let k = 0; k < 3; k++) light(x, z.y0 + (z.y1 - z.y0) * (k + 0.5) / 3, 60, 'water', 0.55);
  },
  bubble(z, dt) { light(z.x, z.y, 22, 'water', 0.5); },
  whirl(z, dt) { light(z.x, z.y, z.r * 1.5, 'water', 0.55); if (chance(dt * 22)) { const a = rand(TAU), r = rand(z.r * 0.5, z.r); part({ k: 'pix', x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r * 0.55, z: rand(1, 4), vx: -Math.sin(a) * 70, vy: Math.cos(a) * 40, vz: rand(10, 40), g: 200, life: rand(0.3, 0.5), s0: 1, col: chance(0.6) ? WATER.foam : WATER.hi }); } },
  frostmist(z, dt) { light(z.x, z.y, z.r * 1.4, 'ice', 0.45); if (chance(dt * 10)) part({ k: 'glow', x: z.x + rand(-z.r, z.r), y: z.y + rand(-z.r, z.r) * 0.6, z: rand(2, 10), vx: rand(-8, 8), vz: rand(4, 12), life: rand(1, 1.6), s0: rand(6, 10), s1: rand(10, 14), col: 'ice', a0: 0.18, a1: 0 }); },
});
Object.assign(HAZDRAW.world, {
  // a wall of water seen from above: a wet sheet trailing behind, the standing crest, and foam along its lip
  tide(c, z) {
    const x = Math.round(z._x === undefined ? z.x : z._x), d = z.dir, y0 = Math.round(z.y0), y1 = Math.round(z.y1), big = !!z.big, H = big ? 24 : 12, W = big ? 30 : 16, T = G.time, fr = Math.floor(T * 12);
    const fade = z.crashed ? clamp((z.life - z.t) / 0.35, 0, 1) : clamp(z.t * 6, 0, 1); if (fade <= 0) return;
    const wob = ry => Math.round(Math.sin(ry * 0.23 + T * 7) * 1.6 + Math.sin(ry * 0.07 - T * 3) * 1.2), span = (a, len, ry, h) => c.fillRect(d > 0 ? a - len : a, ry, len, h);
    c.save(); c.globalAlpha = fade; c.imageSmoothingEnabled = false;
    // the wet floor it leaves behind: dithered water that thins out
    for (let ry = y0; ry <= y1; ry += 2) { const back = x + d * wob(ry) - d * W; c.fillStyle = dither(c, WATER.light, 0.5); span(back, W, ry, 2); c.fillStyle = dither(c, WATER.mid, 0.25); span(back - d * W, W, ry, 2); c.fillStyle = dither(c, WATER.hi, 0.125); span(back - d * 2 * W, W >> 1, ry, 2); }
    // the standing wave: a whitecap on top, then foam, cyan, light and mid blue back from the front
    for (let ry = y0 - H; ry <= y1; ry++) {
      const xf = x + d * wob(ry);
      if (ry < y0 - H + 2) { c.fillStyle = WATER.foam; span(xf, W, ry, 1); continue; }
      c.fillStyle = WATER.foam; span(xf, 2, ry, 1); c.fillStyle = WATER.hi; span(xf - d * 2, 3, ry, 1); c.fillStyle = WATER.light; span(xf - d * 5, 5, ry, 1); c.fillStyle = WATER.mid; span(xf - d * 10, W - 10, ry, 1);
      if (hash2(ry, fr) < 0.14) { c.fillStyle = WATER.foam; span(xf - d * (3 + Math.floor(hash2(fr, ry) * (W - 6))), 2, ry, 1); } // foam flecks
      if (hash2(ry + 7, fr) < 0.06) { c.fillStyle = WATER.foam; span(xf + d * 2, 1, ry, 1); } // spray just ahead of the front
    }
    c.restore();
  },
  bubble(c, z) {
    const r = Math.round(z.R0 || 6), cx = Math.round(z.x), cy = Math.round(z.y - 9 + Math.sin(G.time * 4 + z.id) * 1.5); c.save(); c.imageSmoothingEnabled = false;
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(cx - r + 1, Math.round(z.y), r * 2 - 2, 1);
    c.fillStyle = dither(c, WATER.light, 0.25); for (let dy = -r; dy <= r; dy++) { const hw = Math.round(r * Math.sqrt(1 - (dy / r) ** 2)); if (hw > 0) c.fillRect(cx - hw, cy + dy, hw * 2, 1); }
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; c.fillStyle = a > 3.5 && a < 4.7 ? WATER.foam : WATER.hi; c.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); }
    c.fillStyle = WATER.foam; c.fillRect(cx - Math.round(r * 0.45), cy - Math.round(r * 0.5), 2, 1); c.restore();
  },
  whirl(c, z) {
    const cx = Math.round(z.x), cy = Math.round(z.y), R = Math.round(z.r), ry = Math.max(3, Math.round(z.r * 0.55)), T = G.time, life = Math.min(1, z.t * 3, (z.life - z.t) * 3); if (life <= 0) return;
    c.save(); c.globalAlpha = life; c.imageSmoothingEnabled = false;
    const disc = (rx, rr, fill) => { c.fillStyle = fill; for (let dy = -rr; dy <= rr; dy++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / rr) ** 2))); if (hw > 0) c.fillRect(cx - hw, cy + dy, hw * 2, 1); } };
    // stacked rings of water, darker toward the hole in the middle
    disc(R + 3, ry + 2, dither(c, WATER.mid, 0.5)); disc(R, ry, WATER.mid); disc(Math.round(R * 0.72), Math.round(ry * 0.72), dither(c, WATER.deep, 0.75)); disc(Math.round(R * 0.5), Math.round(ry * 0.5), WATER.deep); disc(Math.round(R * 0.22), Math.round(ry * 0.22), WATER.abyss);
    // three arms of foam spiralling in
    for (let k = 0; k < 3; k++) for (let i = 0; i <= 28; i++) { const s = i / 28, r = R * (0.2 + 0.8 * s), a = -T * 4.5 + k * TAU / 3 + s * 3.4; c.fillStyle = s > 0.6 ? WATER.foam : WATER.hi; c.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.55), s > 0.45 ? 2 : 1, 1); }
    // a broken ring of foam around the rim
    for (let i = 0; i < 32; i++) { if ((i + Math.floor(T * 8)) % 4 === 0) continue; const a = T * 2 + i / 32 * TAU; c.fillStyle = i % 3 ? WATER.hi : WATER.foam; c.fillRect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * ry), i % 2 ? 2 : 1, 1); }
    c.restore();
  },
});
Object.assign(HAZDRAW.fx, {
  frostmist(c, z) { const life = Math.min(1, z.t * 3, (z.life - z.t) * 3); c.globalAlpha = 0.3 * life; c.drawImage(GLOW.ice, z.x - z.r * 1.3, z.y - z.r * 0.8, z.r * 2.6, z.r * 1.6); c.globalAlpha = 1; },
});
// ---------- the zones on the host ----------
Object.assign(HAZSIM, {
  // a wave: foes at its crest are hit once and carried along; at the far wall (or the end of its run) it crashes
  tide(z, dt) {
    if (z.crashed) return; const A = ARENA; z.x += z.dir * z.spd * dt; z.trav += z.spd * dt; const front = z.x;
    for (const u of G.mons) {
      if (u.dead || u.spawnT > 0 || u.carried || u.y < z.y0 - 4 || u.y > z.y1 + 4) continue;
      const rel = (u.x - front) * z.dir; if (rel < -24 || rel > u.r + 4) continue;
      if (!z.hit.has(u)) { z.hit.add(u); hurt(u, z.dmg, z.src, { elem: 'water' }); }
      if (u.boss) { u.kx += z.dir * 60 * dt; continue; } // bosses only stagger
      const tx = front + z.dir * (u.r + 2); u.x = z.dir > 0 ? Math.max(u.x, tx) : Math.min(u.x, tx); u.kx = z.dir * z.spd * 0.25; u.vx = 0; u.vy *= 0.5;
    }
    const atWall = z.dir > 0 ? front >= A.x1 - 6 : front <= A.x0 + 6;
    if (atWall || z.trav >= z.len) {
      z.crashed = true; z.t = Math.max(z.t, z.life - 0.35);
      if (atWall) { for (const u of z.hit) if (!u.dead && Math.abs(u.x - front) < 34) { hurt(u, z.crash, z.src, { elem: 'water', shatter: true }); if (z.freeze) freeze(u, z.freeze); } HFX.crash(front, (z.y0 + z.y1) / 2, z.y1 - z.y0, z.dir); shake(z.big ? 0.6 : 0.35); }
    }
  },
  bubble(z, dt) {
    z.x += z.vx * dt; z.y += z.vy * dt; const hit = G.mons.find(u => !u.dead && u.spawnT <= 0 && u.carried !== 2 && dist(z.x, z.y, u.x, u.y) < u.r + 5);
    if (hit || z.t > z.life - 0.05 || !inArena(z.x, z.y)) { for (const u of within(z.x, z.y, z.R, G.mons)) hurt(u, z.dmg, z.src, { elem: 'water' }); HFX.splash(z.x, z.y, z.R); z.dead = true; }
  },
  whirl(z, dt, tick) {
    for (const u of G.mons) { if (u.dead || u.boss || u.carried || u.spawnT > 0) continue; const d = dist(z.x, z.y, u.x, u.y); if (d > z.r * 1.7 || d < 2) continue; const a = angTo(u.x, u.y, z.x, z.y) + 0.9; u.kx += Math.cos(a) * 260 * dt; u.ky += Math.sin(a) * 180 * dt; }
    if (tick) for (const u of within(z.x, z.y, z.r, G.mons)) hurt(u, z.dmg, z.src, { elem: 'water', quiet: true });
  },
  frostmist(z, dt, tick) { if (!tick) return; for (const u of within(z.x, z.y, z.r, G.mons)) { hurt(u, z.dmg, z.src, { elem: 'ice', quiet: true }); if (z.freeze && chance(0.2)) freeze(u, 1.2); } },
});

// ---------- Nerida's spells ----------
function tideWave(h, o) { // o: { dir, x, y0, y1, len, spd, dmg, crash, big, freeze }
  const z = hazard({ k: 'tide', x: o.x, dir: o.dir, spd: o.spd || 190, y0: o.y0, y1: o.y1, len: o.len, trav: 0, dmg: o.dmg, crash: o.crash, big: o.big ? 1 : 0, freeze: o.freeze || 0, life: o.len / (o.spd || 190) + 0.8, src: h });
  HFX.waveStart(o.x, (o.y0 + o.y1) / 2, o.big ? 2 : 1); return z;
}
// the side the horde would rather not be pushed to: away from the hero, toward the far wall
function sweepDir(h, f) { if (!f.length) return h.face || 1; let mx = 0; for (const u of f) mx += u.x; mx /= f.length; return mx >= h.x ? 1 : -1; }
function frostShard(h, t) { const m = md('FROST SHARD'), a0 = angTo(h.x, h.y, t.x, t.y), n = 1 + m.count; for (let i = 0; i < n; i++) { const a = a0 + (n > 1 ? (i / (n - 1) - 0.5) * 0.45 : 0); proj({ k: 'mshot', shot: 'ishard', col: 'ice', BR: 16 * m.size, x: h.x, y: h.y, z: 10, vx: Math.cos(a) * 175, vy: Math.sin(a) * 130, life: 1.3, r: 3, dmg: D(h) * 1.1 * m.dmg, src: h, team: 'hero' }); } SFX.freeze(panOf(h.x)); }
function waterWhip(h, t) { const m = md('WATER WHIP'), a = angTo(h.x, h.y, t.x, t.y), R = 62 * m.size, push = m.f.shove ? 260 : 130; h.lunge = 0.15; h.la = a; HFX.whip(h.x, h.y, a, m.size); for (const u of within(h.x, h.y, R, G.mons)) if (Math.abs(angDiff(angTo(h.x, h.y, u.x, u.y), a)) < 0.5 * m.size + 0.15) hurt(u, D(h) * 0.6 * m.dmg, h, { elem: 'water', kx: Math.cos(a) * push, ky: Math.sin(a) * push * 0.7 }); }
function castBubble(h, t) { const m = md('BUBBLE'); for (let i = 0; i <= m.count; i++) { const a = angTo(h.x, h.y, t.x, t.y) + (i ? rand(-0.5, 0.5) : 0); hazard({ k: 'bubble', x: h.x + Math.cos(a) * 8, y: h.y + Math.sin(a) * 6, vx: Math.cos(a) * 85, vy: Math.sin(a) * 62, R: 26 * m.size, R0: 6 * Math.sqrt(m.size), dmg: D(h) * 1.4 * m.dmg, life: 2.4, src: h }); } SFX.pop(panOf(h.x)); }
function frostNova(h) { const m = md('FROST NOVA'), R = 56 * m.size; HFX.frostNova(h.x, h.y, R); for (const u of within(h.x, h.y, R, G.mons)) { hurt(u, D(h) * 1.4 * m.dmg, h, { elem: 'ice' }); if (m.f.freeze) freeze(u, 1.4); } }
function tidalPush(h, t) { const m = md('TIDAL PUSH'), dir = t.x >= h.x ? 1 : -1, H = 34 * m.size; for (let k = 0; k <= m.count; k++) after(k * 0.35, () => { if (!alive(h)) return; tideWave(h, { dir, x: h.x + dir * 6, y0: h.y - H, y1: h.y + H, len: 150 * m.size, spd: 200, dmg: D(h) * 1.3 * m.dmg, crash: D(h) * 0.8 * m.dmg }); }); }
function iceLance(h, t) { const m = md('ICE LANCE'), a0 = angTo(h.x, h.y, t.x, t.y), n = 1 + m.count; for (let i = 0; i < n; i++) { const a = a0 + (n > 1 ? (i / (n - 1) - 0.5) * 0.4 : 0), [x1, y1] = rayEnd(h.x, h.y - 8, a, 160 * m.size); FX.beams.push({ x0: h.x, y0: h.y - 8, x1, y1, w: 1.8, col: 'ice', t: 0, life: 0.28, cap: true }); HFX.lance(h.x, h.y - 8, x1, y1); for (const u of live(G.mons)) if (segDist(u.x, u.y - 6, h.x, h.y - 8, x1, y1) < 7 + u.r) { hurt(u, D(h) * 2.2 * m.dmg, h, { elem: 'ice', shatter: true }); if (m.f.freeze) freeze(u, 1); } } }
function chillingMist(h, p) { const m = md('CHILLING MIST'); hazard({ k: 'frostmist', x: p.x, y: p.y, r: 38 * m.size, life: 5 * m.dur, rate: 0.5, dmg: D(h) * 0.45, freeze: m.f.freeze ? 1 : 0, src: h }); HFX.frostNova(p.x, p.y, 30 * m.size); }
function flashFreeze(h, p) { const m = md('FLASH FREEZE'), R = 40 * m.size; HFX.deepFreeze(p.x, p.y, R); const ts = live(G.mons).filter(u => dist(p.x, p.y, u.x, u.y) < R + u.r).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y)).slice(0, 4 + m.count); for (const u of ts) { hurt(u, D(h) * 1.0, h, { elem: 'ice', quiet: true }); freeze(u, 2.5 * m.dur, m.f.brittle); } }
function riptide(h, p) { const m = md('RIPTIDE'); hazard({ k: 'whirl', x: p.x, y: p.y, r: 46 * m.size, life: 4 * m.dur, rate: 0.4, dmg: D(h) * 0.5 * m.dmg, src: h }); HFX.splash(p.x, p.y, 30 * m.size); }
function glacialSpikes(h, t) {
  const m = md('GLACIAL SPIKES'), a0 = angTo(h.x, h.y, t.x, t.y), n = 9 + m.count, fz = m.f.freeze ? 1.6 : 0.6; h.lunge = 0.2; h.la = a0; SFX.freeze(panOf(h.x));
  for (const a of m.f.fan ? [a0 - 0.45, a0, a0 + 0.45] : [a0]) for (let i = 0; i < n; i++) after(i * 0.045, () => { const x = h.x + Math.cos(a) * (14 + i * 13), y = h.y + Math.sin(a) * (14 + i * 13) * 0.8; if (!inArena(x, y)) return; HFX.iceSpike(x, y, 1); for (const u of within(x, y, 11, G.mons)) { hurt(u, D(h) * 1.1, h, { elem: 'ice', up: 90 }); freeze(u, fz); } });
}
function castHail(h, p) { const m = md('HAIL'), n = 10 + m.count, R = 42 * m.size; for (let i = 0; i < n; i++) { const x = p.x + rand(-R, R), y = p.y + rand(-R, R) * 0.7; after(i * 0.13, () => { HFX.hail(x, y); after(0.42, () => { HFX.hailHit(x, y); for (const u of within(x, y, 14, G.mons)) hurt(u, D(h) * 0.8 * m.dmg, h, { elem: 'ice', quiet: true }); }); }); } }
function greatWave(h) { const m = md('GREAT WAVE'), A = ARENA, f = live(G.mons), dir = sweepDir(h, f); banner('GREAT WAVE', h); for (let k = 0; k <= m.count; k++) after(k * 0.8, () => tideWave(h, { dir, x: dir > 0 ? A.x0 + 4 : A.x1 - 4, y0: A.y0 + 2, y1: A.y1 - 2, len: A.x1 - A.x0, spd: 190, dmg: D(h) * 2.0 * m.dmg, crash: D(h) * 1.0 * m.dmg, big: true, freeze: m.f.freeze ? 2 : 0 })); }
function deepFreeze(h) { const m = md('DEEP FREEZE'), R = 120 * m.size; HFX.deepFreeze(h.x, h.y, R); banner('DEEP FREEZE', h); for (const u of live(G.mons)) { const d = dist(h.x, h.y, u.x, u.y); if (d < 50 * m.size || (d < R && (u.chill > 0 || u.frozen > 0))) { hurt(u, D(h) * 0.8, h, { elem: 'ice', quiet: true }); freeze(u, 3 * m.dur, m.f.brittle); } } }
function frozenTomb(h, t) {
  const m = md('FROZEN TOMB'), ts = [t, ...live(G.mons).filter(u => u !== t && dist(h.x, h.y, u.x, u.y) < 180).sort((a, b) => b.hp - a.hp).slice(0, m.count)];
  for (const u of ts) { HFX.tomb(u.x, u.y, u.scale); freeze(u, 4 * m.dur, true); if (m.f.burst) { const x = u; after(Math.min(4 * m.dur, u.boss ? 1.2 : 99), () => { if (!alive(x)) return; hurt(x, D(h) * 3, h, { elem: 'ice', shatter: true }); for (const v of within(x.x, x.y, 40, G.mons)) if (v !== x) hurt(v, D(h) * 1.5, h, { elem: 'ice' }); HFX.iceBreak(x.x, x.y, 1.5); }); } }
}
function tsunami(h) {
  const m = md('TSUNAMI'), A = ARENA; banner('TSUNAMI', h); G.ambDark = 1; flash('water', 0.4); SFX.braam(); quake(1.2, 0.5);
  const big = { y0: A.y0 + 2, y1: A.y1 - 2, len: A.x1 - A.x0, spd: 240, dmg: D(h) * 3 * m.dmg, crash: D(h) * 1.5 * m.dmg, big: true };
  for (let k = 0; k < 2 + m.count; k++) after(k * 1.7, () => { const dir = k % 2 ? -1 : 1; tideWave(h, { ...big, dir, x: dir > 0 ? A.x0 + 4 : A.x1 - 4 }); });
  const tF = (2 + m.count) * 1.7 + 0.4;
  after(tF, () => { HFX.deepFreeze(ARENA.pw / 2, (A.y0 + A.y1) / 2, 220); for (const u of live(G.mons)) freeze(u, 3 * m.dur, true); });
  after(tF + 3 * m.dur - 0.2, () => { flash('white', 0.4); shake(0.6); for (const u of live(G.mons)) if (u.frozen > 0) { hurt(u, D(h) * 4 * m.dmg, h, { elem: 'ice', shatter: true }); HFX.iceBreak(u.x, u.y, u.scale); } });
}
SPELLBOOK.tide = [
  { name: 'FROST SHARD', lvl: 1, tier: 0, basic: true, cd: 1.0, pick: (h, f) => nearestFoe(h, f, 170), cast: frostShard },
  { name: 'WATER WHIP', lvl: 1, tier: 0, basic: true, cd: 0.9, range: 55, pick: (h, f) => nearestFoe(h, f, 66 * md('WATER WHIP').size), cast: waterWhip },
  { name: 'BUBBLE', lvl: 1, tier: 0, basic: true, cd: 1.6, pick: (h, f) => nearestFoe(h, f, 160), cast: castBubble },
  { name: 'FROST NOVA', lvl: 2, tier: 1, cd: 6, wind: 0.2, pick: (h, f) => within(h.x, h.y, 60, f).length >= 2 ? true : null, cast: frostNova },
  { name: 'TIDAL PUSH', lvl: 2, tier: 1, cd: 6, wind: 0.25, pick: (h, f) => nearestFoe(h, f, 110), cast: tidalPush },
  { name: 'ICE LANCE', lvl: 3, tier: 1, cd: 5, wind: 0.25, pick: (h, f) => lineTarget(h, f, 150) || toughest(h, f, 150), cast: iceLance },
  { name: 'CHILLING MIST', lvl: 4, tier: 1, cd: 9, wind: 0.3, pick: (h, f) => cluster(h, f, 30, 3, 160), cast: chillingMist },
  { name: 'FLASH FREEZE', lvl: 5, tier: 2, cd: 9, wind: 0.35, pick: (h, f) => cluster(h, f, 30, 3, 170), cast: flashFreeze },
  { name: 'RIPTIDE', lvl: 6, tier: 2, cd: 10, wind: 0.4, pick: (h, f) => cluster(h, f, 34, 4, 170), cast: riptide },
  { name: 'GLACIAL SPIKES', lvl: 7, tier: 2, cd: 8, wind: 0.35, pick: (h, f) => lineTarget(h, f, 160) || nearestFoe(h, f, 140), cast: glacialSpikes },
  { name: 'HAIL', lvl: 8, tier: 2, cd: 9, wind: 0.4, pick: (h, f) => cluster(h, f, 34, 3, 180), cast: castHail },
  { name: 'GREAT WAVE', lvl: 10, tier: 3, cd: 13, wind: 0.6, pick: (h, f) => f.length >= 5 ? true : null, cast: greatWave },
  { name: 'DEEP FREEZE', lvl: 11, tier: 3, cd: 12, wind: 0.5, pick: (h, f) => within(h.x, h.y, 50, f).length + chilled(within(h.x, h.y, 120, f)).length >= 4 ? true : null, cast: deepFreeze },
  { name: 'FROZEN TOMB', lvl: 12, tier: 3, cd: 10, wind: 0.4, pick: (h, f) => toughest(h, f, 180), cast: frozenTomb },
  { name: 'TSUNAMI', lvl: 15, tier: 4, wind: 0.9, pick: (h, f) => f.length >= 4 || G.boss ? true : null, cast: tsunami },
];
Object.assign(SPELL_INFO, {
  'FROST SHARD': 'A shard of ice that bursts on impact and chills what it hits', 'WATER WHIP': 'A lash of water that knocks foes back', 'BUBBLE': 'A drifting bubble that bursts over a crowd',
  'FROST NOVA': 'Cold bursts out around you and slows everything it touches', 'TIDAL PUSH': 'A short wave that shoves a line of foes away', 'ICE LANCE': 'A lance through a line; frozen foes shatter for 2.5x', 'CHILLING MIST': 'A freezing fog that slows and gnaws at a crowd',
  'FLASH FREEZE': 'Freeze a knot of foes into blocks of ice', 'RIPTIDE': 'A whirlpool drags foes into its middle', 'GLACIAL SPIKES': 'A line of ice spikes that freezes what it hits', 'HAIL': 'Hailstones hammer an area',
  'GREAT WAVE': 'A wall of water sweeps the whole floor and slams the horde into the far wall', 'DEEP FREEZE': 'Everything chilled around you turns to ice', 'FROZEN TOMB': 'Entomb the toughest foe in ice; it takes far more damage',
  'TSUNAMI': 'Great waves cross the floor both ways, the flood freezes, and the ice shatters',
});
Object.assign(MODS, {
  'FROST SHARD': [['SPLINTER', 'Three shards in a fan', { count: 2 }], ['SHATTERBURST', 'The burst on impact is 50% wider', { size: 1.5 }], ['BITTER COLD', '+40% damage', { dmg: 1.4 }]],
  'WATER WHIP': [['LONG LASH', 'Reach +35%', { size: 1.35 }], ['UNDERTOW', 'Knocks foes twice as far', { f: 'shove' }], ['HEAVY WATER', '+45% damage', { dmg: 1.45 }]],
  'BUBBLE': [['BIG BUBBLES', 'Bursts 40% wider', { size: 1.4 }], ['TWIN BUBBLES', 'Blow two at once', { count: 1 }], ['FROTH', '+50% damage', { dmg: 1.5 }]],
  'FROST NOVA': [['WIDE NOVA', 'Radius +40%', { size: 1.4 }], ['DEEP COLD', 'Freezes what it hits', { f: 'freeze' }], ['COLD SNAP', 'Cooldown -40%', { cd: 0.6 }]],
  'TIDAL PUSH': [['HIGH WATER', 'Taller and longer wave', { size: 1.4 }], ['CRUSHING SURF', '+60% damage', { dmg: 1.6 }], ['SECOND SWELL', 'A second wave follows', { count: 1 }]],
  'ICE LANCE': [['LONG LANCE', 'Length +50%', { size: 1.5 }], ['TWIN LANCES', 'Throw two', { count: 1 }], ['GLACIER LANCE', 'Freezes what it pierces', { f: 'freeze' }]],
  'CHILLING MIST': [['FREEZING FOG', 'Foes inside may freeze', { f: 'freeze' }], ['WIDE MIST', 'Radius +40%', { size: 1.4 }], ['LINGERING', 'Lasts 60% longer', { dur: 1.6 }]],
  'FLASH FREEZE': [['WIDER FREEZE', 'Bigger area, two more foes', { size: 1.4, count: 2 }], ['LONG FREEZE', 'Ice lasts 50% longer', { dur: 1.5 }], ['BRITTLE', 'Frozen foes take 60% more damage', { f: 'brittle' }]],
  'RIPTIDE': [['MAELSTROM', 'Radius +40%', { size: 1.4 }], ['DEEP CURRENT', '+60% damage', { dmg: 1.6 }], ['LONG SPIN', 'Lasts 50% longer', { dur: 1.5 }]],
  'GLACIAL SPIKES': [['MORE SPIKES', '+5 spikes', { count: 5 }], ['SPIKE FAN', 'Three lines of spikes', { f: 'fan' }], ['FROZEN GROUND', 'Holds foes frozen longer', { f: 'freeze' }]],
  'HAIL': [['STORM OF HAIL', '+6 hailstones', { count: 6 }], ['HAILSTONES', '+50% damage', { dmg: 1.5 }], ['WIDE FRONT', 'Covers 40% more ground', { size: 1.4 }]],
  'GREAT WAVE': [['TIDAL FORCE', '+50% damage', { dmg: 1.5 }], ['SECOND WAVE', 'Another wave follows', { count: 1 }], ['FREEZING SURF', 'Foes slammed into the wall freeze', { f: 'freeze' }]],
  'DEEP FREEZE': [['ABSOLUTE COLD', 'Ice lasts 50% longer', { dur: 1.5 }], ['WIDE FROST', 'Radius +40%', { size: 1.4 }], ['SHATTERPOINT', 'Frozen foes take 60% more damage', { f: 'brittle' }]],
  'FROZEN TOMB': [['ETERNAL ICE', 'Lasts 50% longer', { dur: 1.5 }], ['TWIN TOMBS', 'Entombs a second foe', { count: 1 }], ['BURSTING TOMB', 'The tomb explodes when it ends', { f: 'burst' }]],
  'TSUNAMI': [['HIGHER TIDE', '+50% damage', { dmg: 1.5 }], ['THIRD WAVE', 'One more wave', { count: 1 }], ['LONG WINTER', 'The flood stays frozen 50% longer', { dur: 1.5 }]],
});
