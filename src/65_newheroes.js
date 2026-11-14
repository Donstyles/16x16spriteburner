// ===================== two more heroes: Kazimir the vampire and Seraphine the priest =====================
// Kazimir fights up close and heals from every wound he deals: claws, blood whips, bats and, at the end, a crimson moon.
// Seraphine keeps the party standing with healing and blessings, and burns the dark with smites, sanctified ground and angels.
// Sprites are palette swaps made by tools/recolor.py; bats are drawn as pixel art below.
HERO_DEFS.vampire = { name: 'KAZIMIR', title: 'VAMPIRE', spr: 'Vampire', hp: 360, spd: 60, r: 6, role: 'melee', col: 'crimson', dmg: 20, leech: 0.035, armor: 0.9, skirm: true };
HERO_DEFS.priest = { name: 'SERAPHINE', title: 'PRIEST', spr: 'Priest', hp: 310, spd: 46, r: 5, role: 'support', col: 'holy', dmg: 25 };
HERO_PROG.vampire = { titles: [[1, 'FLEDGLING'], [5, 'NIGHTSTALKER'], [10, 'VAMPIRE LORD'], [15, 'ELDER OF THE BLOOD']], ult: 'CRIMSON MOON', evolve: { lvl: 10, spr: 'VampireLord' } };
HERO_PROG.priest = { titles: [[1, 'ACOLYTE'], [5, 'PRIEST'], [10, 'ARCHPRIEST'], [15, 'VOICE OF HEAVEN']], ult: 'JUDGMENT', evolve: { lvl: 10, spr: 'Archpriest' } };
DEFAULT_BASIC.vampire = 'CLAW'; DEFAULT_BASIC.priest = 'SMITE';
HERO_CLASS.vampire = 'THE VAMPIRE'; HERO_CLASS.priest = 'THE PRIEST';
HERO_BLURB.vampire = ['BLOOD · HIT AND RUN', 'Darts in, drinks, darts out. His bats carry foes off into the night.', ['BAT SWARM', 'ABDUCTION', 'CRIMSON MOON']];
HERO_BLURB.priest = ['HOLY · SUPPORT', 'Heals the party, smites the dark and calls down guardian angels.', ['GUARDIAN ANGEL', 'HOLY NOVA', 'JUDGMENT']];
HERO_QUOTE.vampire = '“The night is young. You are not.”'; HERO_QUOTE.priest = '“Kneel and be forgiven. Or don’t.”';
for (const n of ['LAY ON HANDS', 'BLESSING', 'MIRACLE', 'BLOOD MIST']) HEALS.add(n);
// ---------- pixel bats ----------
const BAT_A = ['X.......X', 'XX.X.X.XX', '.XXXXXXX.', '..XXXXX..', '....X....'], BAT_B = ['...X.X...', '..XXXXX..', '.XXXXXXX.', 'XX.....XX', 'X.......X'];
function drawBat(c, x, y, s, t) {
  const F = ((t * 12) | 0) % 2 ? BAT_A : BAT_B; c.fillStyle = '#1a0a12';
  for (let r = 0; r < 5; r++) { const row = F[r]; for (let q = 0; q < 9; q++) if (row[q] === 'X') c.fillRect(x + (q - 4.5) * s, y + (r - 2.5) * s, s, s); }
  const er = F === BAT_A ? 2 : 1; c.fillStyle = '#ff3040'; c.fillRect(x - 1.5 * s, y + (er - 2.5) * s, s, s); c.fillRect(x + 0.5 * s, y + (er - 2.5) * s, s, s);
}
// ---------- one-off bursts: each travels as one event, every phone makes the particles ----------
const HFX = {
  bite(x, y) { sparks(x, y, 8, 5, 'crimson', 90, 80); for (let i = 0; i < 6; i++) part({ k: 'pix', x: x + rand(-2, 2), y, z: rand(6, 12), vx: rand(-40, 40), vy: rand(-20, 20), vz: rand(30, 80), g: 360, life: rand(0.5, 0.9), s0: 1.2, col: chance(0.5) ? '#b0101e' : '#e02436' }); if (chance(0.5)) splat(x, y, '#6a0a14', 3, 4); },
  bloodBurst(x, y, s) { ring(x, y, 30 * s, 'crimson', 0.35, 4); glows(x, y, 8, 10 * s, 'crimson', 90 * s, 6, 0.6); for (let i = 0; i < 18 * s; i++) part({ k: 'pix', x, y, z: rand(4, 14), vx: rand(-110, 110) * s, vy: rand(-70, 70) * s, vz: rand(40, 150), g: 380, bounce: 0.2, life: rand(0.7, 1.4), s0: rand(1, 1.8), col: chance(0.5) ? '#a01420' : '#e02436' }); splat(x, y, '#5a0810', 8, 10 * s); flashLight(x, y, 70 * s, 'crimson', 1.2, 0.35); },
  batBurst(x, y, n) { for (let i = 0; i < n; i++) { const a = rand(TAU), sp = rand(50, 130); part({ k: 'bat', x: x + rand(-4, 4), y: y + rand(-3, 3), z: rand(8, 20), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: rand(10, 60), drag: 0.6, life: rand(0.7, 1.3), s0: rand(0.7, 1), ph: rand(1) }); } SFX.whoosh(panOf(x)); },
  mist(x, y) { smoke(x, y, 8, 'dark', 12, 30, 1.6, 16); glows(x, y, 8, 10, 'crimson', 50, 6, 0.9); HFX.batBurst(x, y, 6); },
  lance(x0, y0, x1, y1, w) { for (let k = 0; k <= 10; k++) { const f = k / 10, x = lerp(x0, x1, f), y = lerp(y0, y1, f); part({ k: 'spike', x, y, life: 0.5, s0: rand(4, 7) * w, col: '#7a0c14' }); if (k % 2 === 0) glows(x, y, 6, 2, 'crimson', 40, 5, 0.4); } splat(x1, y1, '#5a0810', 6, 8); },
  bloodNova(x, y, R) { ring(x, y, R, 'crimson', 0.45, 7); ring(x, y, R * 0.6, 'white', 0.25, 3); for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; part({ k: 'glow', x, y, z: 6, vx: Math.cos(a) * R * 3.4, vy: Math.sin(a) * R * 2.4, drag: 2.6, life: 0.55, s0: 6, s1: 1, col: 'crimson' }); } HFX.bloodBurst(x, y, 1.1); },
  exsang(x, y, R) { ring(x, y, R, 'crimson', 0.6, 6, R * 0.2); ring(x, y, R * 0.5, 'crimson', 0.5, 4); for (let i = 0; i < 36; i++) { const a = rand(TAU), r = R * rand(0.6, 1); part({ k: 'glow', x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.75, z: 8, vx: -Math.cos(a) * r * 2.2, vy: -Math.sin(a) * r * 1.6, life: 0.45, s0: 3, s1: 6, col: 'crimson' }); } flashLight(x, y, R * 2, 'crimson', 2, 0.7); },
  bloodRain(x, y) { column(x, y, 'crimson', 0.5, 7); for (let i = 0; i < 8; i++) part({ k: 'pix', x: x + rand(-4, 4), y, z: rand(30, 70), vx: rand(-15, 15), vy: rand(-8, 8), vz: -rand(60, 140), g: 300, life: 0.8, s0: 1.4, col: '#c0182a' }); splat(x, y, '#5a0810', 5, 6); sparks(x, y, 4, 4, 'crimson', 80, 60); },
  holyPillar(x, y, s) { column(x, y, 'holy', 0.6, 10 * s); ring(x, y, 22 * s, 'holy', 0.3, 3); sparks(x, y, 6, 6 * s, 'holy', 120, 140); glows(x, y, 10, 5 * s, 'holy', 60, 5, 0.5); flashLight(x, y, 60 * s, 'holy', 0.75, 0.25); },
  holyBurst(x, y, R) { ring(x, y, R, 'holy', 0.5, 6); ring(x, y, R * 0.7, 'white', 0.3, 3); for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; part({ k: 'glow', x, y, z: 6, vx: Math.cos(a) * R * 3.2, vy: Math.sin(a) * R * 2.3, drag: 2.6, life: 0.6, s0: 5, s1: 1, col: i % 3 ? 'holy' : 'white' }); } flashLight(x, y, R * 1.6, 'holy', 0.85, 0.45); HFX.feathers(x, y, 6); },
  feathers(x, y, n) { for (let i = 0; i < n; i++) part({ k: 'pix', x: x + rand(-10, 10), y: y + rand(-6, 6), z: rand(20, 40), vx: rand(-20, 20), vy: rand(-8, 8), vz: rand(-10, 10), g: 18, drag: 1.2, life: rand(1.4, 2.4), s0: rand(1, 1.6), col: chance(0.6) ? '#fffaf0' : '#ffe9a8' }); },
  censer(x, y, a, s) { for (let i = 0; i < 8; i++) { const aa = a + rand(-0.4, 0.4) * s, sp = rand(150, 220) * Math.sqrt(s); part({ k: 'glow', x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 4, z: 9, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.8, drag: 3, life: rand(0.25, 0.4), s0: rand(2, 3.5), s1: 5, col: chance(0.5) ? 'holy' : 'white', a0: 0.9, a1: 0 }); } light(x + Math.cos(a) * 24, y + Math.sin(a) * 18, 50, 'holy', 0.9); },
  spear(x0, y0, x1, y1) { for (let k = 0; k <= 8; k++) { const f = k / 8; glows(lerp(x0, x1, f), lerp(y0, y1, f), 8, 2, 'holy', 40, 4, 0.4); } sparks(x1, y1, 8, 10, 'holy', 160, 120); flashLight(x1, y1, 60, 'holy', 1.2, 0.3); },
  bless(x, y) { column(x, y, 'holy', 0.9, 8); ring(x, y, 20, 'holy', 0.4, 3); HFX.feathers(x, y, 4); },
  angelDown(x, y) { column(x, y, 'holy', 1.0, 13); ring(x, y, 50, 'holy', 0.6, 5); ring(x, y, 30, 'white', 0.4, 3); HFX.feathers(x, y, 14); flashLight(x, y, 100, 'holy', 0.9, 0.5); SFX.levelup(); },
  chain(x0, y0, x1, y1) { for (let k = 1; k < 7; k++) { const f = k / 7; part({ k: 'glow', x: lerp(x0, x1, f), y: lerp(y0, y1, f), z: 8, life: 0.5, s0: 2.2, s1: 0, col: 'holy' }); } ring(x1, y1, 14, 'holy', 0.4, 3); },
  swordFall(x, y) { flash('white', 0.55); column(x, y, 'holy', 1.4, 44); ring(x, y, 140, 'white', 0.8, 9); ring(x, y, 100, 'holy', 0.7, 7); slamFx(x, y, 1.7, 'holy'); HFX.feathers(x, y, 24); quake(1.2, 1.1); SFX.thunder(0, 1.4); },
  miracle(x, y) { HFX.angelDown(x, y); for (let i = 0; i < 24; i++) part({ k: 'glow', x: x + rand(-12, 12), y: y + rand(-6, 6), z: rand(0, 30), vz: rand(40, 100), drag: 0.6, life: rand(0.8, 1.6), s0: rand(2, 4), s1: 0, col: chance(0.5) ? 'holy' : 'heal' }); },
};
// ---------- continuous effects of the new zones and emitters (every phone, every frame) ----------
// angels glide: the drawn position eases after the real one, leans into its flight, turns by folding, and floats on two slow waves
function angelGlide(z, dt) {
  if (z._x === undefined) { z._x = z.x; z._y = z.y; z._f = z.face < 0 ? -1 : 1; z._vx = 0; z._ph = rand(TAU); }
  const px = z._x; z._x = damp(z._x, z.x, 5, dt); z._y = damp(z._y, z.y, 5, dt); if (dt > 0) z._vx = damp(z._vx, (z._x - px) / dt, 4, dt); z._f = damp(z._f, z.face < 0 ? -1 : 1, 6, dt);
}
function angelPose(z) {
  const x = z._x === undefined ? z.x : z._x, yb = z._y === undefined ? z.y : z._y, life = Math.min(1, z.t * 3, (z.life - z.t) * 3), ph = z._ph || 0;
  const float = Math.sin(G.time * 1.7 + ph) * 2.6 + Math.sin(G.time * 0.73 + ph * 2) * 1.2;
  return { x, yb, life, y: yb - 18 - (1 - life) * 40 + float, tilt: clamp((z._vx || 0) / 260, -0.22, 0.22), f: z._f === undefined ? (z.face < 0 ? -1 : 1) : z._f };
}
// where an abducted unit is right now (on a guest the zone only knows the unit's id)
function abductee(z) { return z.m || G.units.find(v => v.id === z.uid) || null; }
const HAZFX = {
  // an opened wound: a spurt with every heartbeat, a steady drip, a trail where it walks and a pool where it stands
  bleed(z, dt) {
    const pal = BLOOD[z.bl] || BLOOD.red, hh = 8 * (z.s || 1), moved = z._lx === undefined ? 0 : dist(z.x, z.y, z._lx, z._ly); z._lx = z.x; z._ly = z.y;
    const beat = Math.floor(z.t / 0.42);
    if (beat !== z._b) {
      z._b = beat; const a = rand(TAU), sp = rand(45, 85);
      for (let i = 0; i < 8; i++) { const aa = a + rand(-0.35, 0.35), v = sp * rand(0.7, 1.2); part({ k: 'pix', x: z.x, y: z.y, z: hh, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v * 0.5, vz: rand(30, 80), g: 360, life: rand(0.45, 0.75), s0: chance(0.3) ? 2 : 1, col: pal[i % pal.length] }); }
      bloodPaint(z.x + Math.cos(a) * sp * 0.35, z.y + Math.sin(a) * sp * 0.18, pal, 7, 3); // where the spurt lands
    }
    if (chance(dt * 16)) { part({ k: 'pix', x: z.x + rand(-2, 2), y: z.y, z: hh * rand(0.5, 1), vz: -10, g: 300, life: 0.4, s0: 1, col: pal[1] }); bloodPaint(z.x, z.y, pal, 2, 2.5); }
    z._pool = moved > 0.4 ? 2 : Math.min(10, (z._pool || 2) + dt * 3); if (chance(dt * 8)) bloodPaint(z.x, z.y + 1, pal, 3, z._pool);
  },
  holyflame(z, dt) { if (chance(dt * 18)) part({ k: 'glow', x: z.x + rand(-4, 4), y: z.y + rand(-2, 2), z: rand(2, 12), vz: rand(30, 60), drag: 1, life: rand(0.3, 0.6), s0: rand(2, 3.5), s1: 0.5, col: chance(0.6) ? 'holy' : 'white' }); light(z.x, z.y, 30, 'holy', 0.6); },
  batcloud(z, dt) { light(z.x, z.y, z.r * 1.6, 'crimson', 0.5); },
  abduct(z, dt) {
    if ((z.heavy && z.st) || z.t < (z.delay || 0)) return; const u = abductee(z), x = u ? u.x : z.x, y = u ? u.y : z.y, hh = u ? u.z : z.h;
    light(x, y - hh, 30, 'crimson', 0.45);
    if (chance(dt * (z.heavy ? 14 : 8))) part({ k: 'pix', x: x + rand(-3, 3), y, z: hh + rand(2, 8), vx: rand(-10, 10), vy: rand(-4, 4), vz: rand(-10, 10), g: 300, life: 0.9, s0: 1.2, col: '#b0182c' });
  },
  consecrate(z, dt) { const live2 = 1 - z.t / z.life; if (chance(dt * 14)) { const a = rand(TAU), r = rand(z.r); part({ k: 'glow', x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r * 0.7, z: 0, vz: rand(20, 50), life: rand(0.6, 1.1), s0: rand(1.5, 2.5), s1: 0, col: 'holy' }); } light(z.x, z.y, z.r * 1.8, 'holy', 0.35 * live2 + 0.1); },
  sanct(z, dt) { if (chance(dt * 16)) { const a = rand(TAU), r = rand(z.r * 0.85); part({ k: 'pix', x: Math.round(z.x + Math.cos(a) * r), y: Math.round(z.y + Math.sin(a) * r * 0.7), z: 0, vz: rand(12, 26), g: 0, life: rand(1, 1.8), s0: 1, col: chance(0.6) ? HOLY.pale : HOLY.gold }); } if (chance(dt * 2)) HFX.feathers(z.x, z.y, 1); light(z.x, z.y, z.r * 1.7, 'holy', 0.4); },
  angel(z, dt) { angelGlide(z, dt); const x = z._x, y = z._y; light(x, y - 20, 46, 'holy', 0.55); if (chance(dt * 3)) HFX.feathers(x, y, 1); if (chance(dt * 10)) part({ k: 'glow', x: x + rand(-12, 12), y: y + rand(-4, 4), z: rand(14, 34), vz: rand(-10, 20), life: 0.6, s0: 1.6, s1: 0, col: 'holy' }); },
  skybeam(z, dt) { light(z.x, z.y, z.r * 3, 'holy', 0.8); sparks(z.x, z.y, 4, 2, 'holy', 160, 160); if (chance(0.4)) scorch(z.x, z.y, z.r * 0.6, 0.15); },
  moon(z, dt) { light(z.x, z.y + 60, 260, 'crimson', 0.9); if (chance(dt * 30)) part({ k: 'ember', x: rand(ARENA.x0, ARENA.x1), y: rand(ARENA.y0, ARENA.y1), z: rand(40, 80), vx: rand(-10, 10), vy: 0, vz: -rand(10, 30), life: rand(1.5, 2.5), s0: rand(1, 1.8), s1: 0.3, col: 'crimson' }); },
};
Object.assign(EMIT, {
  drain(e, dt) { const u = e.u, t = e.tg; if (!u || !t || u.dead || t.dead || u.x === undefined || t.x === undefined) { e.t = e.dur; return; } for (let i = 0; i < 2; i++) part({ k: 'glow', x: t.x + rand(-3, 3), y: t.y + rand(-2, 2), z: 8, vx: (u.x - t.x) * 1.7, vy: (u.y - t.y) * 1.7, life: 0.55, s0: 2.4, s1: 1, col: 'crimson' }); light(u.x, u.y, 40, 'crimson', 0.8); },
  frenzy(e, dt) { const u = e.u; if (!u || u.dead || u.x === undefined) { e.t = e.dur; return; } if (chance(dt * 26)) part({ k: 'glow', x: u.x + rand(-8, 8), y: u.y + rand(-4, 4), z: rand(2, 18), vz: rand(20, 50), life: 0.5, s0: 2, s1: 0, col: 'crimson' }); if (chance(dt * 4)) part({ k: 'bat', x: u.x, y: u.y, z: 14, vx: rand(-70, 70), vy: rand(-50, 50), vz: rand(10, 40), drag: 0.6, life: 0.9, s0: 0.7, ph: rand(1) }); light(u.x, u.y, 46, 'crimson', 0.9); },
  battrail(e, dt) { const u = e.u; if (!u || u.x === undefined) { e.t = e.dur; return; } for (let i = 0; i < 2; i++) part({ k: 'bat', x: u.x + rand(-6, 6), y: u.y + rand(-4, 4), z: rand(6, 20), vx: rand(-50, 50), vy: rand(-40, 40), vz: rand(0, 40), drag: 0.8, life: rand(0.5, 0.9), s0: rand(0.7, 1), ph: rand(1) }); },
  batsweep(e, dt) { if (chance(dt * 26)) { const left = chance(0.5); part({ k: 'bat', x: left ? e.x0 - 10 : e.x1 + 10, y: rand(e.y0, e.y1), z: rand(12, 50), vx: (left ? 1 : -1) * rand(150, 230), vy: rand(-25, 25), vz: rand(-5, 5), life: 2.6, s0: rand(0.8, 1.2), ph: rand(1) }); } },
  rise(e, dt) { if (chance(dt * 20)) part({ k: 'glow', x: e.x + rand(-40, 40), y: e.y + rand(-28, 28), z: 0, vz: rand(40, 120), drag: 0.4, life: rand(0.6, 1.2), s0: rand(2, 4), s1: 0, col: e.col }); },
});
// ---------- drawing the new zones ----------
// SANCTUARY: a dome of light in whole pixels. The shell is built once per size: dithered glass that thickens toward the rim,
// a gold outline, the back of the ground ring seen through it, one band of latitude and a glint at the upper left.
const HOLY = { white: '#fffbe8', pale: '#fff0b8', gold: '#ffd860', deep: '#d9a63a' }, DOMES = new Map();
// the camera looks down at the floor at a slant: ground depth shrinks by SA, height lifts by CA (a ground circle is drawn R x 0.7R)
const DSA = 0.7, DCA = Math.sqrt(1 - DSA * DSA), domeG = R => Math.round(R * DSA);
const domeAt = (cx, cy, X, Yd, Z) => [Math.round(cx + X), Math.round(cy + Yd * DSA - Z * DCA)];
function domeImg(R) {
  R = Math.round(R); let cv = DOMES.get(R); if (cv) return cv;
  const G0 = domeG(R), W = 2 * R + 3, HT = R + G0 + 3, cx = R + 1, cy = R + 1;
  cv = mkCanvas(W, HT); cv.glint = []; const g = cv.getContext('2d'), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  // follow the line of sight through each pixel to the hemisphere; glass looks thick where it is seen edge-on
  const hit = (x, y) => { const X = x - cx, Yd = (y - cy) / DSA, b = Yd * DCA, d = b * b - (X * X + Yd * Yd) + R * R; if (d < 0) return null; const t = -b + Math.sqrt(d); if (t < 0) return null; return [X / R, (Yd + t * DCA) / R, t * DSA / R]; };
  const L = [-0.55, -0.35, 0.76], Lc = [L[0], L[1] + DCA, L[2] + DSA], Ln = Math.hypot(...Lc), Hv = Lc.map(v => v / Ln); // the glint's light, upper left
  for (let y = 0; y < HT; y++) for (let x = 0; x < W; x++) {
    const n = hit(x, y); if (!n) continue;
    if (!hit(x + 1, y) || !hit(x - 1, y) || !hit(x, y - 1) || !hit(x, y + 1)) { px(x, y, n[2] < 0.06 ? HOLY.deep : n[0] < -0.2 && n[1] < 0.3 ? HOLY.white : HOLY.gold); continue; }
    const face = n[1] * DCA + n[2] * DSA, f = 1 - Math.max(0, face), spec = n[0] * Hv[0] + n[1] * Hv[1] + n[2] * Hv[2];
    if (spec > 0.9975) { cv.glint.push(x, y); continue; } // drawn on its own, outside the glow pass, so the bloom never smears it
    if (BAYER4[(x & 3) + (y & 3) * 4] / 16 < 0.04 + 0.62 * f ** 3 + (spec > 0.99 ? 0.25 : 0)) px(x, y, f > 0.72 ? HOLY.gold : HOLY.pale);
  }
  const ring = (la, from, to, col, frontOnly) => { const n = Math.max(24, Math.round(R * Math.cos(la) * 5)); for (let i = 0; i <= n; i++) { const t = from + (to - from) * i / n, X = R * Math.cos(la) * Math.cos(t), Yd = R * Math.cos(la) * Math.sin(t), Z = R * Math.sin(la), [x, y] = domeAt(cx, cy, X, Yd, Z); if ((x + y) & 1) continue; if (frontOnly && Math.cos(la) * Math.sin(t) * DCA + Math.sin(la) * DSA < 0.05) continue; px(x, y, col); } };
  ring(0, Math.PI, TAU, HOLY.gold); // the back of the ground ring, seen through the glass
  ring(0.55, 0, Math.PI, HOLY.pale, true); // a band of latitude across the front
  DOMES.set(R, cv); return cv;
}
// the dome rises out of the ground when it is cast
function domeDraw(c, z, a, glint) {
  const img = domeImg(z.r), R = Math.round(z.r), x0 = Math.round(z.x) - R - 1, y0 = Math.round(z.y) - R - 1, rise = clamp(z.t / 0.35, 0, 1), rows = Math.ceil(img.height * rise), sy = img.height - rows;
  if (rows <= 0) return; c.globalAlpha = a; c.drawImage(img, 0, sy, img.width, rows, x0, y0 + sy, img.width, rows);
  if (glint) { c.fillStyle = HOLY.white; const G2 = img.glint; for (let i = 0; i < G2.length; i += 2) if (G2[i + 1] >= sy) c.fillRect(x0 + G2[i], y0 + G2[i + 1], 1, 1); }
}
// a ring of light climbing the dome over and over, and a few twinkles on the shell
function domeShine(c, z, a) {
  if (z.t < 0.35) return; const R = Math.round(z.r), cx = Math.round(z.x), cy = Math.round(z.y), ph = (G.time * 0.55 + (z.id || 0) * 0.37) % 1, la = ph * 1.4, n = Math.max(16, Math.round(R * Math.cos(la) * 5));
  for (let i = 0; i < n; i++) { const t = i / n * TAU, front = Math.cos(la) * Math.sin(t) * DCA + Math.sin(la) * DSA > 0, [x, y] = domeAt(cx, cy, R * Math.cos(la) * Math.cos(t), R * Math.cos(la) * Math.sin(t), R * Math.sin(la)); c.globalAlpha = a * (1 - ph) * (front ? 1 : 0.3); c.fillStyle = front ? HOLY.white : HOLY.gold; c.fillRect(x, y, 1, 1); }
  const fr = Math.floor(G.time * 7); c.fillStyle = HOLY.white;
  for (let k = 0; k < 4; k++) { const id = (z.id || 1), t = 0.3 + hash2(id * 31 + k, fr) * 2.5, e = hash2(fr, id * 17 + k) * 1.3, [x, y] = domeAt(cx, cy, R * Math.cos(e) * Math.cos(t), R * Math.cos(e) * Math.sin(t), R * Math.sin(e)); c.globalAlpha = a * (0.5 + 0.5 * hash2(k, fr + 3)); c.fillRect(x, y, 1, 1); }
}
const HAZDRAW = {
  world: {
    sanct(c, z) { const life = clamp((z.life - z.t) * 2, 0, 1); if (life <= 0) return; c.save(); c.imageSmoothingEnabled = false; domeDraw(c, z, 0.85 * life, true); domeShine(c, z, life); c.restore(); },
    abduct(c, z) {
      const t = (z.t || 0) - (z.delay || 0); if (t < -0.05 || (z.heavy && z.st)) return; const u = abductee(z), x = u ? u.x : z.x, y = u ? u.y : z.y, hh = u ? u.z : z.h, s = z.s || 1;
      const n = z.n || 4, grab = clamp(t / 0.35, 0, 1), strain = !!z.heavy, top = y - hh - 13 * s;
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU + G.time * (strain ? 9 : 5), far = (1 - grab) * 46, rr = (strain ? 9 : 6) * s;
        drawBat(c, x + Math.cos(a) * (rr + far), top + Math.sin(a) * far * 0.5 - Math.abs(Math.sin(a)) * 3 * s - (strain ? Math.abs(Math.sin(G.time * 17 + k)) * 3 : 0), strain ? 1 : 0.85, G.time * (strain ? 2.2 : 1.4) + k);
      }
    },
    batcloud(c, z) { for (const b of z.bats || []) { const a = b[0] + G.time * b[2], r = b[1]; drawBat(c, z.x + Math.cos(a) * r, z.y - 10 + Math.sin(a * 1.3) * r * 0.45, 0.8, G.time + b[0]); } },
    consecrate(c, z) { const live2 = Math.min(1, (1 - z.t / z.life) * 3); c.globalAlpha = 0.16 * live2; c.fillStyle = '#ffe9a8'; c.beginPath(); c.ellipse(z.x, z.y, z.r, z.r * 0.7, 0, 0, TAU); c.fill(); c.globalAlpha = 1; },
    angel(c, z) {
      const nm = MOBS[z.spr] ? z.spr : 'Angel', m = MOBS[nm]; if (!m) return; const P = angelPose(z), sc = (z.big ? 2.8 : 2.2) * (0.85 + 0.15 * P.life), fr = ((G.time * 5) | 0) % 4, foot = footOf(nm), fl = Math.abs(P.f) < 0.15 ? (P.f < 0 ? -0.15 : 0.15) : P.f;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(P.x, P.yb, 8, 3, 0, 0, TAU); c.fill();
      c.save(); c.globalAlpha = P.life; c.translate(P.x, P.y); c.rotate(P.tilt); c.scale(sc * fl, sc); c.drawImage(IMG.mobs, fr * m[1], m[0], m[1], m[2], -m[1] / 2, -foot - 1, m[1], m[2]); c.restore(); c.globalAlpha = 1;
    },
    sword(c, z) { const u = Math.min(1, z.t / z.life), y = z.y - 230 * (1 - u) - 6; c.fillStyle = '#fff6d8'; c.beginPath(); c.moveTo(z.x - 6, y - 90); c.lineTo(z.x + 6, y - 90); c.lineTo(z.x + 4, y - 6); c.lineTo(z.x, y + 6); c.lineTo(z.x - 4, y - 6); c.closePath(); c.fill(); c.fillStyle = '#c9a227'; c.fillRect(z.x - 16, y - 96, 32, 6); c.fillRect(z.x - 3, y - 118, 6, 22); },
  },
  fx: {
    batcloud(c, z) { c.globalAlpha = 0.35; c.drawImage(GLOW.crimson, z.x - z.r * 1.2, z.y - z.r * 0.7, z.r * 2.4, z.r * 1.4); },
    bleed(c, z) { c.globalAlpha = 0.5; c.drawImage(GLOW.crimson, z.x - 8, z.y - 10, 16, 14); },
    holyflame(c, z) { c.globalAlpha = 0.55; c.drawImage(GLOW.holy, z.x - 9, z.y - 14, 18, 18); },
    consecrate(c, z) { const live2 = Math.min(1, (1 - z.t / z.life) * 3); c.globalAlpha = 0.65 * live2; c.strokeStyle = rgba('holy', 0.9); c.lineWidth = 1.4; c.beginPath(); c.ellipse(z.x, z.y, z.r, z.r * 0.7, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(z.x, z.y, z.r * 0.7, z.r * 0.49, 0, 0, TAU); c.stroke(); c.globalAlpha = 0.25 * live2; c.drawImage(GLOW.holy, z.x - z.r, z.y - z.r * 0.7, z.r * 2, z.r * 1.4); },
    sanct(c, z) { const life = clamp((z.life - z.t) * 2, 0, 1); if (life <= 0) return; c.save(); c.imageSmoothingEnabled = false; domeDraw(c, z, (0.28 + 0.07 * Math.sin(G.time * 3)) * life); domeShine(c, z, 0.8 * life); c.restore(); },
    angel(c, z) { const P = angelPose(z), life = P.life, y = P.y, h = (z.big ? 2.8 : 2.2) * 16; c.globalAlpha = 0.3 * life; c.drawImage(GLOW.holy, P.x - h * 0.8, y - h * 1.05, h * 1.6, h * 1.3); c.globalAlpha = 0.9 * life; c.strokeStyle = rgba('holy', 1); c.lineWidth = 1.2; c.beginPath(); c.ellipse(P.x + Math.sin(P.tilt) * h * 0.98, y - h * 0.98 * Math.cos(P.tilt), 5, 1.6, P.tilt, 0, TAU); c.stroke(); },
    skybeam(c, z) { const life = Math.min(1, z.t * 5, (z.life - z.t) * 5), w = z.r * 1.3; c.globalAlpha = 0.85 * life; const g = c.createLinearGradient(0, z.y - 240, 0, z.y); g.addColorStop(0, 'rgba(255,236,170,0)'); g.addColorStop(0.7, 'rgba(255,236,170,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0.9)'); c.fillStyle = g; c.fillRect(z.x - w, z.y - 240, w * 2, 244); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(z.x - w * 0.3, z.y - 240, w * 0.6, 244); c.drawImage(GLOW.holy, z.x - w * 2, z.y - w, w * 4, w * 2); },
    moon(c, z) { const life = Math.min(1, z.t * 1.5, (z.life - z.t) * 2), R = 46; c.globalAlpha = 0.9 * life; c.drawImage(GLOW.crimson, z.x - R * 2.6, z.y - R * 2.6, R * 5.2, R * 5.2); c.fillStyle = `rgba(255,70,90,${0.75 * life})`; c.beginPath(); c.arc(z.x, z.y, R, 0, TAU); c.fill(); c.fillStyle = `rgba(150,10,30,${0.6 * life})`; c.beginPath(); c.arc(z.x - 12, z.y - 8, 10, 0, TAU); c.arc(z.x + 14, z.y + 10, 7, 0, TAU); c.arc(z.x + 6, z.y - 18, 5, 0, TAU); c.fill(); },
    sword(c, z) { const u = Math.min(1, z.t / z.life), y = z.y - 230 * (1 - u) - 50; c.globalAlpha = 0.8; c.drawImage(GLOW.holy, z.x - 30, y - 70, 60, 120); },
  },
};
// ---------- the new zones on the host: damage, healing, following ----------
const HAZSIM = {
  bleed(z, dt, tick) { const m = z.m; if (!m || m.dead) { if (m && !z.burst) { z.burst = true; HFX.bloodBurst(z.x, z.y, z.bloom ? 1.2 : 0.7); if (alive(z.src)) leech(z.src, z.src.maxHp * 0.05); if (z.bloom) for (const u of within(z.x, z.y, 34, G.mons)) hurt(u, z.dmg * 3, z.src, { elem: 'crimson' }); } z.dead = true; return; } z.x = m.x; z.y = m.y; if (tick) hurt(m, z.dmg, z.src, { elem: 'crimson', quiet: true }); },
  holyflame(z, dt, tick) { const m = z.m; if (!m || m.dead) { if (m && (z.jumps || 0) > 0) { const n = nearest(m, live(G.mons), 70); if (n) { hazard({ ...z, m: n, x: n.x, y: n.y, t: 0, tick: 0, hit: new Set(), jumps: z.jumps - 1 }); HFX.chain(z.x, z.y, n.x, n.y); } } z.dead = true; return; } z.x = m.x; z.y = m.y; if (tick) hurt(m, z.dmg, z.src, { elem: 'holy', quiet: true }); },
  // bats carry a foe over the walls; a boss or warlord is too heavy: they strain, lift it, and drop it
  abduct(z, dt) {
    const u = z.m; if (!u || u.dead) { z.dead = true; return; }
    const t = z.t - z.delay; if (t < 0) return;
    if (z.heavy) {
      if (z.st === 0) {
        const f = Math.min(1, t / 1.3); u.z = 30 * (1 - (1 - f) * (1 - f)) + Math.sin(t * 19) * 2 * f; u.x = z.bx + Math.sin(t * 23) * 1.4 * f; u.vx = u.vy = 0;
        if (t > 1.5) { z.st = 1; u.carried = 0; u.state = null; u.vz = 30; HFX.batBurst(u.x, u.y, 8); SFX.whoosh(panOf(u.x)); } // they let go
      } else if (u.z <= 0) {
        hurt(u, z.dmg, z.src, { elem: 'crimson', crit: true }); slamFx(u.x, u.y, 0.9, 'crimson'); shake(0.5); hitstop(0.06);
        for (const v of within(u.x, u.y, 34, G.mons)) if (v !== u) hurt(v, z.dmg * 0.3, z.src, { elem: 'crimson', up: 120 });
        z.dead = true; return;
      }
      if (t > 4) { u.carried = 0; z.dead = true; }
    } else {
      if (t < 0.35) u.z = Math.min(12, u.z + 40 * dt);
      else { z.sp = Math.min(260, z.sp + 480 * dt); u.x += z.dx * z.sp * dt; u.y += z.dy * z.sp * dt * 0.75; u.z += (50 + z.sp * 0.45) * dt; }
      u.vx = u.vy = 0; u.moving = true;
      const A = ARENA; if (u.z > 170 || u.x < A.x0 - 60 || u.x > A.x1 + 60 || u.y < A.y0 - 60 || u.y > A.y1 + 60 || t > 4) { kill(u, z.src, 'crimson'); if (alive(z.src)) leech(z.src, z.src.maxHp * (z.feed ? 0.08 : 0.03)); z.dead = true; return; }
    }
    z.x = u.x; z.y = u.y; z.h = u.z;
  },
  batcloud(z, dt, tick) { if (tick) for (const u of within(z.x, z.y, z.r, G.mons)) { hurt(u, z.dmg, z.src, { elem: 'crimson', quiet: true }); if (chance(0.3)) HFX.bite(u.x, u.y); } },
  consecrate(z, dt, tick) { if (!tick) return; for (const u of within(z.x, z.y, z.r, G.mons)) hurt(u, z.dmg, z.src, { elem: 'holy', quiet: true }); for (const h of G.heroes) if (!h.dead && dist(z.x, z.y, h.x, h.y) < z.r) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.015); },
  sanct(z, dt, tick) { for (const h of G.heroes) if (!h.dead && dist(z.x, z.y, h.x, h.y) < z.r) { h.blessT = Math.max(h.blessT || 0, 0.6); if (tick) heal(h, h.maxHp * 0.03 * (z.heal || 1)); } if (tick) for (const u of within(z.x, z.y, z.r, G.mons)) { hurt(u, z.dmg, z.src, { elem: 'holy', quiet: true }); u.slow = 0.4; } },
  angel(z, dt, tick) {
    const s = z.src; if (z.follow && alive(s)) { const dx = s.x + z.ox - z.x, dy = s.y - 4 - z.y, d = Math.hypot(dx, dy), want = d > 10 ? Math.min(85, (d - 10) * 2) : 0; z.vx = damp(z.vx || 0, d > 0.1 ? dx / d * want : 0, 2.2, dt); z.vy = damp(z.vy || 0, d > 0.1 ? dy / d * want : 0, 2.2, dt); z.x += z.vx * dt; z.y += z.vy * dt; }
    if (!tick || z.t < 0.4 || z.t > z.life - 0.3) return; const t = nearest(z, live(G.mons), z.big ? 220 : 150); if (!t) return; z.face = t.x < z.x ? -1 : 1;
    FX.beams.push({ x0: z.x, y0: z.y - 30, x1: t.x, y1: t.y - 6, w: z.big ? 2.2 : 1.5, col: 'holy', t: 0, life: 0.2, cap: true }); hurt(t, z.dmg, z.src, { elem: 'holy' }); HFX.holyPillar(t.x, t.y, z.big ? 0.8 : 0.5);
  },
  skybeam(z, dt, tick) { z.x += z.vx * dt; z.y += z.vy * dt; if (!inArena(z.x, z.y)) z.t = Math.max(z.t, z.life - 0.2); if (tick) for (const u of within(z.x, z.y, z.r, G.mons)) hurt(u, z.dmg, z.src, { elem: 'holy', quiet: true, stun: 0.2 }); },
  moon(z, dt, tick) { G.ambDark = Math.max(G.ambDark, 0.75); if (!tick || z.t < 0.6) return; const f = live(G.mons); if (!f.length) return; const t = pick(f); hurt(t, z.dmg, z.src, { elem: 'crimson' }); HFX.bloodRain(t.x, t.y); if (z.share) for (const h of G.heroes) if (!h.dead) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.004); },
};
// ---------- Kazimir's spells ----------
function claw(h, t) {
  const m = md('CLAW'), a = angTo(h.x, h.y, t.x, t.y), swipe = k => { h.lunge = 0.25; h.la = a; arcFx(h.x, h.y - 6, a + (k ? 0.4 : 0), 1.8 * m.size, 17 * m.size, 'crimson', 0.16, 3); SFX.slash(panOf(h.x));
    for (const u of within(h.x, h.y, 24 * m.size, G.mons)) if (Math.abs(angDiff(angTo(h.x, h.y, u.x, u.y), a)) < 1.1 * m.size) { hurt(u, D(h) * 0.9 * m.dmg, h, { elem: 'crimson', kx: Math.cos(a) * 80, ky: Math.sin(a) * 60 }); if (chance(0.4)) HFX.bite(u.x, u.y); } };
  swipe(0); for (let k = 1; k <= m.count; k++) after(k * 0.12, () => { if (alive(h)) swipe(k); });
}
function bloodWhip(h) { const m = md('BLOOD WHIP'), ts = live(G.mons).filter(u => dist(h.x, h.y, u.x, u.y) < 72 * m.size).sort((a, b) => dist(h.x, h.y, a.x, a.y) - dist(h.x, h.y, b.x, b.y)).slice(0, 2 + m.count); for (const u of ts) { FX.beams.push({ x0: h.x, y0: h.y - 8, x1: u.x, y1: u.y - 6, w: 1.4, col: 'crimson', t: 0, life: 0.2, cap: true }); hurt(u, D(h) * 0.75 * m.dmg, h, { elem: 'crimson' }); HFX.bite(u.x, u.y); } SFX.slash(panOf(h.x)); }
function batBite(h, t) { const m = md('BAT BITE'); for (let i = 0; i <= m.count; i++) { const a = angTo(h.x, h.y, t.x, t.y) + (i ? rand(-0.8, 0.8) : 0); proj({ k: 'bat', x: h.x, y: h.y, z: 10, vx: Math.cos(a) * 150, vy: Math.sin(a) * 110, home: t, life: 1.6, r: 4, dmg: D(h) * 1.1 * m.dmg, src: h, team: 'hero' }); } SFX.whoosh(panOf(h.x)); }
function batSwarm(h) { const m = md('BAT SWARM'), n = 5 + m.count, ts = live(G.mons).filter(u => dist(h.x, h.y, u.x, u.y) < 170).sort((a, b) => dist(h.x, h.y, a.x, a.y) - dist(h.x, h.y, b.x, b.y)); if (!ts.length) return; HFX.batBurst(h.x, h.y, 8); for (let i = 0; i < n; i++) { const t = ts[i % ts.length], a = rand(TAU); proj({ k: 'bat', x: h.x, y: h.y, z: 12, vx: Math.cos(a) * 120, vy: Math.sin(a) * 90, home: t, life: 2.2, r: 4, dmg: D(h) * 0.9 * m.dmg, src: h, team: 'hero' }); } }
function hemorrhage(h, t) { const m = md('HEMORRHAGE'); hazard({ k: 'bleed', m: t, x: t.x, y: t.y, bl: (t.def && t.def.blood) || 'red', s: t.scale || 1, src: h, life: 4 * m.dur, rate: 0.4, dmg: D(h) * 0.5 * m.dmg, bloom: !!m.f.bloom }); HFX.bloodBurst(t.x, t.y, 0.6); SFX.hit(panOf(t.x)); }
function shadowStep(h, t) { const m = md('SHADOW STEP'), a = angTo(h.x, h.y, t.x, t.y); HFX.batBurst(h.x, h.y, 10); h.x = clamp(t.x + Math.cos(a) * 12, ARENA.x0 + 6, ARENA.x1 - 6); h.y = clamp(t.y + Math.sin(a) * 9, ARENA.y0 + 4, ARENA.y1 - 2); h.face = Math.cos(a) < 0 ? 1 : -1; HFX.batBurst(h.x, h.y, 10); hurt(t, D(h) * 1.8 * m.dmg, h, { elem: 'crimson', crit: true, kx: Math.cos(a) * 120, ky: Math.sin(a) * 90 }); HFX.bloodBurst(t.x, t.y, 0.7); h.iframe = Math.max(h.iframe || 0, m.f.mist ? 1 : 0.3); }
function bloodMist(h) { const m = md('BLOOD MIST'); h.iframe = Math.max(h.iframe || 0, 1.2 * m.dur); h.regen = { t: 3 * m.dur, per: h.maxHp * 0.03 * m.dmg, tick: 0 }; HFX.mist(h.x, h.y); }
function crimsonLance(h, t) {
  const m = md('CRIMSON LANCE'), a0 = angTo(h.x, h.y, t.x, t.y); SFX.whoosh(panOf(h.x)); h.lunge = 0.3; h.la = a0;
  for (let k = 0; k <= m.count; k++) { const a = a0 + (k ? (k % 2 ? 0.35 : -0.35) * Math.ceil(k / 2) : 0), L = 130 * m.size, [x1, y1] = rayEnd(h.x, h.y - 6, a, L);
    FX.beams.push({ x0: h.x, y0: h.y - 6, x1, y1, w: 3 * m.size, col: 'crimson', t: 0, life: 0.35, cap: true }); HFX.lance(h.x, h.y, x1, y1 + 6, m.size);
    for (const u of live(G.mons)) if (segDist(u.x, u.y - 6, h.x, h.y - 6, x1, y1) < 10 * m.size + u.r) hurt(u, D(h) * 1.6 * m.dmg, h, { elem: 'crimson', kx: Math.cos(a) * 160, ky: Math.sin(a) * 120, stun: m.f.stun ? 1 : 0 }); }
  shake(0.25);
}
function bloodNova(h) { const m = md('BLOOD NOVA'), R = 50 * m.size, pulse = () => { let n = 0; for (const u of within(h.x, h.y, R, G.mons)) { const a = angTo(h.x, h.y, u.x, u.y); hurt(u, D(h) * 1.6 * m.dmg, h, { elem: 'crimson', kx: Math.cos(a) * 220, ky: Math.sin(a) * 170, up: 80 }); n++; } leech(h, h.maxHp * 0.03 * Math.min(n, 5) * (m.f.feast ? 2 : 1)); HFX.bloodNova(h.x, h.y, R); shake(0.4); SFX.boom(0.6, panOf(h.x)); }; pulse(); for (let k = 1; k <= m.count; k++) after(k * 0.4, () => { if (alive(h)) pulse(); }); }
function batCloud(h, p) { const m = md('BAT CLOUD'), R = 30 * m.size; hazard({ k: 'batcloud', x: p.x, y: p.y, r: R, life: 4 * m.dur, rate: 0.3, dmg: D(h) * 0.45 * m.dmg, src: h, bats: Array.from({ length: 14 + m.count * 6 }, () => [rand(TAU), rand(6, R), rand(2, 4) * (chance(0.5) ? 1 : -1)]) }); HFX.batBurst(p.x, p.y, 10); }
function drainLife(h, t) {
  const m = md('DRAIN LIFE'), dur = 2.5 * m.dur; SFX.beam(dur, 0.6); emitFx('drain', { u: h, tg: t }, dur);
  h.state = { k: 'channel', t: 0, dur, tick: 0, fn: (h, s, dt) => {
    if (!alive(t)) { s.t = s.dur; return; } h.vx = damp(h.vx, 0, 10, dt); h.vy = damp(h.vy, 0, 10, dt); h.face = t.x < h.x ? -1 : 1;
    if (!s.beam || !FX.beams.includes(s.beam)) { s.beam = { col: 'crimson', steady: true, cap: true }; FX.beams.push(s.beam); } Object.assign(s.beam, { x0: h.x, y0: h.y - 8, x1: t.x, y1: t.y - 6, w: 2.2 * (0.85 + 0.15 * Math.sin(s.t * 40)), t: 0, life: 0.2 });
    s.tick -= dt; if (s.tick <= 0) { s.tick = 0.2; hurt(t, D(h) * 0.5 * m.dmg, h, { elem: 'crimson', quiet: true }); leech(h, D(h) * 0.3 * m.dmg * (m.f.siphon ? 2 : 1)); }
  } };
}
function vampiricFrenzy(h) { const m = md('VAMPIRIC FRENZY'), dur = 5 * m.dur; h.frenzyT = dur; h.leechMul = m.f.gorge ? 3 : 2; emitFx('frenzy', { u: h }, dur); banner('VAMPIRIC FRENZY', h); HFX.bloodBurst(h.x, h.y, 1); SFX.braam(); }
function nightWings(h, t) {
  const m = md('NIGHT WINGS'), a = angTo(h.x, h.y, t.x, t.y), x0 = h.x, y0 = h.y, hit = u => { hurt(u, D(h) * 1.6 * m.dmg, h, { elem: 'crimson', kx: -Math.sin(a) * 160, ky: Math.cos(a) * 120 }); HFX.bite(u.x, u.y); };
  HFX.batBurst(h.x, h.y, 12); emitFx('battrail', { u: h }, m.f.back ? 0.8 : 0.4); h.iframe = Math.max(h.iframe || 0, 0.4);
  dash(h, h.x + Math.cos(a) * 120 * m.size, h.y + Math.sin(a) * 90 * m.size, 0.35, { r: 14 * m.size, col: 'crimson', onHit: hit, onEnd: () => { HFX.batBurst(h.x, h.y, 10); if (m.f.back) dash(h, x0, y0, 0.3, { r: 14 * m.size, col: 'crimson', onHit: hit }); } });
}
function exsanguinate(h) { const m = md('EXSANGUINATE'), R = 90 * m.size, ts = within(h.x, h.y, R, G.mons); banner('EXSANGUINATE', h); let total = 0; for (const u of ts) { FX.beams.push({ x0: u.x, y0: u.y - 6, x1: h.x, y1: h.y - 8, w: 1.6, col: 'crimson', t: 0, life: 0.6, cap: true }); total += hurt(u, D(h) * 2.2 * m.dmg, h, { elem: 'crimson', up: 60 }) || 0; } HFX.exsang(h.x, h.y, R); leech(h, total * 0.2); if (m.f.share) for (const x of G.heroes) if (!x.dead && x !== h) heal(x, total * 0.1); flash('crimson', 0.3); slowmo(0.5, 0.35); shake(0.6); SFX.braam(); }
function crimsonMoon(h) { const m = md('CRIMSON MOON'), dur = 5 * m.dur; banner('CRIMSON MOON', h); SFX.braam(); SFX.quake(1.5); G.ambDark = 1; flash('crimson', 0.5); quake(1.5, 0.6); hazard({ k: 'moon', x: ARENA.pw / 2, y: ARENA.y0 + 6, r: 0, life: dur, rate: 0.12 / Math.max(1, m.count * 0.5 + 1), dmg: D(h) * 1.6 * m.dmg, src: h, share: !!m.f.share }); emitFx('batsweep', { x0: ARENA.x0, x1: ARENA.x1, y0: ARENA.y0, y1: ARENA.y1 }, dur); }
// ---------- Seraphine's spells ----------
function smite(h, t) { const m = md('SMITE'), ts = [t, ...live(G.mons).filter(x => x !== t).sort((a, b) => dist(t.x, t.y, a.x, a.y) - dist(t.x, t.y, b.x, b.y)).slice(0, m.count)]; for (const u of ts) { HFX.holyPillar(u.x, u.y, 0.7); hurt(u, D(h) * 1.2 * m.dmg, h, { elem: 'holy' }); } SFX.zap(panOf(t.x)); }
function holyBolt(h, t) { const m = md('HOLY BOLT'), a0 = angTo(h.x, h.y, t.x, t.y), n = 1 + m.count; for (let i = 0; i < n; i++) { const a = a0 + (n > 1 ? (i / (n - 1) - 0.5) * 0.5 : 0); proj({ k: 'mshot', shot: 'orb', col: 'holy', x: h.x, y: h.y, z: 10, vx: Math.cos(a) * 170, vy: Math.sin(a) * 125, home: m.f.seek ? t : undefined, life: 1.4, r: 3, dmg: D(h) * 0.95 * m.dmg, src: h, team: 'hero' }); } SFX.zap(panOf(h.x)); }
function censer(h, t) { const m = md('CENSER'), a = angTo(h.x, h.y, t.x, t.y), R = 60 * m.size; h.lunge = 0.15; h.la = a; HFX.censer(h.x, h.y, a, m.size); for (const u of within(h.x, h.y, R, G.mons)) if (Math.abs(angDiff(angTo(h.x, h.y, u.x, u.y), a)) < 0.45 * m.size + 0.15) { hurt(u, D(h) * 0.55 * m.dmg, h, { elem: 'holy', quiet: true }); if (m.f.burn) u.burn = Math.max(u.burn, 1.2); } }
function layOnHands(h, t) { const m = md('LAY ON HANDS'), x = t && t.team === 'hero' ? t : h; heal(x, x.maxHp * 0.35 * m.dmg); HFX.holyPillar(x.x, x.y, 0.8); if (m.f.renew) x.regen = { t: 4, per: x.maxHp * 0.03, tick: 0 }; SFX.heal(); }
function blessing(h) { const m = md('BLESSING'); for (const x of G.heroes) if (!x.dead) { x.blessT = 5 * m.dur; HFX.bless(x.x, x.y); if (m.f.heal) heal(x, x.maxHp * 0.1); } SFX.heal(); }
function consecrate(h, p) { const m = md('CONSECRATE'), R = 34 * m.size; hazard({ k: 'consecrate', x: p.x, y: p.y, r: R, life: 4 * m.dur, rate: 0.5, dmg: D(h) * 0.5 * m.dmg, src: h }); HFX.holyBurst(p.x, p.y, R); SFX.charge && SFX.charge(); }
function radiantSpear(h, t) { const m = md('RADIANT SPEAR'), a0 = angTo(h.x, h.y, t.x, t.y), n = 1 + m.count; for (let i = 0; i < n; i++) { const a = a0 + (n > 1 ? (i / (n - 1) - 0.5) * 0.5 : 0), [x1, y1] = rayEnd(h.x, h.y - 8, a, 150 * m.size); FX.beams.push({ x0: h.x, y0: h.y - 8, x1, y1, w: 2.2, col: 'holy', t: 0, life: 0.3, cap: true }); HFX.spear(h.x, h.y, x1, y1 + 8); for (const u of live(G.mons)) if (segDist(u.x, u.y - 6, h.x, h.y - 8, x1, y1) < 8 + u.r) hurt(u, D(h) * 1.4 * m.dmg, h, { elem: 'holy', kx: Math.cos(a) * 120, ky: Math.sin(a) * 90 }); } SFX.zap(panOf(h.x)); }
function holyNova(h) { const m = md('HOLY NOVA'), R = 55 * m.size, pulse = () => { for (const u of within(h.x, h.y, R, G.mons)) { const a = angTo(h.x, h.y, u.x, u.y); hurt(u, D(h) * 1.4 * m.dmg, h, { elem: 'holy', kx: Math.cos(a) * 200, ky: Math.sin(a) * 150 }); } for (const x of G.heroes) if (!x.dead && dist(h.x, h.y, x.x, x.y) < R * 1.4) heal(x, x.maxHp * 0.08 * (m.f.mercy ? 2 : 1)); HFX.holyBurst(h.x, h.y, R); flash('white', 0.12); SFX.boom(0.5, panOf(h.x)); }; pulse(); for (let k = 1; k <= m.count; k++) after(k * 0.45, () => { if (alive(h)) pulse(); }); }
function guardianAngel(h) { const m = md('GUARDIAN ANGEL'); banner('GUARDIAN ANGEL', h); for (let k = 0; k <= m.count; k++) { const ox = (k % 2 ? 1 : -1) * (18 + 8 * k); hazard({ k: 'angel', spr: 'ResoluteAngel', x: h.x + ox, y: h.y - 4, ox, face: ox < 0 ? 1 : -1, src: h, follow: true, life: 8 * m.dur, rate: 0.7, dmg: D(h) * 1.1 * m.dmg }); HFX.angelDown(h.x + ox, h.y); } }
function chainsOfLight(h, p) { const m = md('CHAINS OF LIGHT'), ts = live(G.mons).filter(u => dist(p.x, p.y, u.x, u.y) < 60).slice(0, 4 + m.count); for (const u of ts) { u.stun = Math.max(u.stun, 1.8 * m.dur); FX.beams.push({ x0: h.x, y0: h.y - 8, x1: u.x, y1: u.y - 6, w: 1.2, col: 'holy', t: 0, life: 0.5, cap: true }); HFX.chain(h.x, h.y - 8, u.x, u.y); if (m.f.sear) hurt(u, D(h) * 1.2, h, { elem: 'holy' }); } SFX.clang(panOf(p.x)); }
function sacredFlame(h, t) { const m = md('SACRED FLAME'); hazard({ k: 'holyflame', m: t, x: t.x, y: t.y, src: h, life: 4 * m.dur, rate: 0.4, dmg: D(h) * 0.45 * m.dmg, jumps: 1 + m.count }); HFX.holyPillar(t.x, t.y, 0.6); SFX.fire(panOf(t.x)); }
function divineBeam(h, t) { const m = md('DIVINE BEAM'), a = angTo(h.x, h.y, t.x, t.y); banner('DIVINE BEAM', h); hazard({ k: 'skybeam', x: h.x + Math.cos(a) * 24, y: h.y + Math.sin(a) * 18, vx: Math.cos(a) * 70, vy: Math.sin(a) * 52, r: 16 * m.size, life: 2.2 * m.dur, rate: 0.12, dmg: D(h) * 0.55 * m.dmg, src: h }); flash('holy', 0.12); SFX.beam(2.2 * m.dur, 1); shake(0.3); }
function sanctuary(h) { const m = md('SANCTUARY'); banner('SANCTUARY', h); hazard({ k: 'sanct', x: h.x, y: h.y, r: 60 * m.size, life: 6 * m.dur, rate: 0.5, dmg: D(h) * 0.4 * m.dmg, src: h, heal: m.f.heal ? 2 : 1 }); HFX.holyBurst(h.x, h.y, 60 * m.size); SFX.levelup(); }
function miracle(h) { const m = md('MIRACLE'); banner('MIRACLE', h); for (const x of G.heroes) { if (x.dead) { if (typeof reviveHero === 'function') reviveHero(x, h); x.hp = Math.round(x.maxHp * 0.6); } else heal(x, x.maxHp * 0.4 * m.dmg); if (m.f.halo) x.blessT = 4; HFX.miracle(x.x, x.y); hazard({ k: 'cherub', x: x.x, y: x.y, u: x.id, life: 1.8 }); } flash('white', 0.35); }
function abduction(h, p) {
  const m = md('ABDUCTION'), R = 44 * m.size, ts = live(G.mons).filter(u => dist(p.x, p.y, u.x, u.y) < R).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y)).slice(0, 3 + m.count);
  if (!ts.length && p.team === 'mon' && alive(p)) ts.push(p);
  banner('ABDUCTION', h); HFX.batBurst(h.x, h.y, 10); SFX.whoosh(panOf(p.x));
  ts.forEach((u, i) => {
    const heavy = !!(u.boss || u.rank === 'warlord'), A = ARENA;
    // regular foes fly to the nearest wall (rarely toward the camera); the heavy ones only go up
    const e = [[-1, 0, u.x - A.x0], [1, 0, A.x1 - u.x], [0, -1, (u.y - A.y0) * 1.2], [0, 1, (A.y1 - u.y) * 2.5]].sort((a, b) => a[2] - b[2])[0];
    u.carried = heavy ? 1 : 2; u.state = null; u.vx = u.vy = u.kx = u.ky = u.vz = 0;
    hazard({ k: 'abduct', m: u, uid: u.id, x: u.x, y: u.y, h: u.z, bx: u.x, s: u.scale, dx: e[0], dy: e[1], sp: 0, st: 0, heavy: heavy ? 1 : 0, n: heavy ? 9 : 4 + (i % 2), feed: m.f.feed ? 1 : 0, dmg: D(h) * 3.5 * m.dmg, delay: i * 0.1, life: 6, src: h });
  });
}
function judgment(h) {
  const m = md('JUDGMENT'); banner('JUDGMENT', h); SFX.braam(); flash('white', 0.35); slowmo(0.4, 0.6);
  const n = 3 + m.count; for (let k = 0; k < n; k++) { const a = k / n * TAU - Math.PI / 2, x = ARENA.pw / 2 + Math.cos(a) * ARENA.pw * 0.28, y = (ARENA.y0 + ARENA.y1) / 2 + Math.sin(a) * (ARENA.y1 - ARENA.y0) * 0.28; hazard({ k: 'angel', spr: ['SwordArchon', 'RighteousDeva', 'DivinePlanetar'][k % 3], x, y, ox: 0, face: 1, src: h, big: true, life: 6, rate: 0.35, dmg: D(h) * 1.4 * m.dmg }); HFX.angelDown(x, y); }
  const d = densest(G.mons, 50, h, 400) || { x: h.x, y: h.y }; after(1.7, () => hazard({ k: 'sword', x: d.x, y: d.y, r: 0, life: 0.5 }));
  after(2.2, () => { HFX.swordFall(d.x, d.y); for (const u of within(d.x, d.y, 70, G.mons)) hurt(u, D(h) * 6 * m.dmg, h, { elem: 'holy', up: 260, stun: 1.2, crit: true }); for (const x of G.heroes) if (!x.dead) heal(x, x.maxHp * 0.25 * (m.f.mercy ? 2 : 1)); hitstop(0.12); });
}
// ---------- the spellbooks ----------
SPELLBOOK.vampire = [
  { name: 'CLAW', lvl: 1, tier: 0, basic: true, cd: 0.45, reach: 16, cast: claw },
  { name: 'BLOOD WHIP', lvl: 1, tier: 0, basic: true, cd: 0.9, reach: 60, cast: bloodWhip },
  { name: 'BAT BITE', lvl: 1, tier: 0, basic: true, cd: 1.1, reach: 110, cast: batBite },
  { name: 'BAT SWARM', lvl: 2, tier: 1, cd: 6, wind: 0.2, pick: (h, f) => nearestFoe(h, f, 150), cast: batSwarm },
  { name: 'HEMORRHAGE', lvl: 3, tier: 1, cd: 6, wind: 0.15, pick: (h, f) => toughest(h, f, 110), cast: hemorrhage },
  { name: 'SHADOW STEP', lvl: 3, tier: 1, cd: 5, wind: 0.1, pick: (h, f) => farFoe(h, f, 40, 140), cast: shadowStep },
  { name: 'BLOOD MIST', lvl: 4, tier: 1, free: true, cd: 9, wind: 0.1, pick: h => h.hp < h.maxHp * 0.55 ? h : null, cast: bloodMist },
  { name: 'CRIMSON LANCE', lvl: 5, tier: 2, cd: 7, wind: 0.3, pick: (h, f) => lineTarget(h, f, 130), cast: crimsonLance },
  { name: 'BLOOD NOVA', lvl: 6, tier: 2, cd: 8, wind: 0.25, pick: (h, f) => within(h.x, h.y, 42, f).length >= 3 ? true : null, cast: bloodNova },
  { name: 'BAT CLOUD', lvl: 7, tier: 2, cd: 10, wind: 0.35, pick: (h, f) => cluster(h, f, 28, 3, 170), cast: batCloud },
  { name: 'DRAIN LIFE', lvl: 8, tier: 2, cd: 8, wind: 0.2, pick: (h, f) => toughest(h, f, 130), cast: drainLife },
  { name: 'ABDUCTION', lvl: 10, tier: 3, cd: 14, wind: 0.35, pick: (h, f) => cluster(h, f, 30, 2, 170), cast: abduction },
  { name: 'VAMPIRIC FRENZY', lvl: 10, tier: 3, cd: 14, wind: 0.3, pick: (h, f) => within(h.x, h.y, 50, f).length >= 2 ? true : null, cast: vampiricFrenzy },
  { name: 'NIGHT WINGS', lvl: 11, tier: 3, cd: 9, wind: 0.25, pick: (h, f) => lineTarget(h, f, 150, 3), cast: nightWings },
  { name: 'EXSANGUINATE', lvl: 13, tier: 3, cd: 12, wind: 0.45, pick: (h, f) => within(h.x, h.y, 90, f).length >= 4 ? true : null, cast: exsanguinate },
  { name: 'CRIMSON MOON', lvl: 15, tier: 4, wind: 0.8, pick: (h, f) => f.length >= 4 || G.boss ? true : null, cast: crimsonMoon },
];
SPELLBOOK.priest = [
  { name: 'SMITE', lvl: 1, tier: 0, basic: true, cd: 1.2, pick: (h, f) => nearestFoe(h, f, 160), cast: smite },
  { name: 'HOLY BOLT', lvl: 1, tier: 0, basic: true, cd: 0.9, pick: (h, f) => nearestFoe(h, f, 170), cast: holyBolt },
  { name: 'CENSER', lvl: 1, tier: 0, basic: true, cd: 0.7, range: 55, pick: (h, f) => nearestFoe(h, f, 65 * md('CENSER').size), cast: censer },
  { name: 'LAY ON HANDS', lvl: 1, tier: 1, free: true, cd: 7, wind: 0.25, pick: () => lowestHero(0.6), cast: layOnHands },
  { name: 'BLESSING', lvl: 2, tier: 1, free: true, cd: 12, wind: 0.3, pick: (h, f) => f.length >= 5 || G.heroes.some(x => !x.dead && x.hp < x.maxHp * 0.6) ? true : null, cast: blessing },
  { name: 'CONSECRATE', lvl: 3, tier: 1, cd: 7, wind: 0.3, pick: (h, f) => cluster(h, f, 30, 3, 160), cast: consecrate },
  { name: 'RADIANT SPEAR', lvl: 4, tier: 1, cd: 5, wind: 0.2, pick: (h, f) => lineTarget(h, f, 150), cast: radiantSpear },
  { name: 'HOLY NOVA', lvl: 5, tier: 2, cd: 7, wind: 0.3, pick: (h, f) => within(h.x, h.y, 48, f).length >= 3 ? true : null, cast: holyNova },
  { name: 'GUARDIAN ANGEL', lvl: 6, tier: 2, cd: 14, wind: 0.5, pick: (h, f) => f.length >= 3 ? true : null, cast: guardianAngel },
  { name: 'CHAINS OF LIGHT', lvl: 7, tier: 2, cd: 8, wind: 0.3, pick: (h, f) => cluster(h, f, 30, 3, 160), cast: chainsOfLight },
  { name: 'SACRED FLAME', lvl: 8, tier: 2, cd: 6, wind: 0.25, pick: (h, f) => toughest(h, f, 160), cast: sacredFlame },
  { name: 'DIVINE BEAM', lvl: 10, tier: 3, cd: 9, wind: 0.5, pick: (h, f) => lineTarget(h, f, 170, 3), cast: divineBeam },
  { name: 'SANCTUARY', lvl: 11, tier: 3, cd: 16, wind: 0.6, pick: (h, f) => f.length >= 6 || G.heroes.some(x => !x.dead && x.hp < x.maxHp * 0.5) ? true : null, cast: sanctuary },
  { name: 'MIRACLE', lvl: 13, tier: 3, free: true, cd: 22, wind: 0.8, pick: () => G.heroes.some(x => x.dead) || G.heroes.some(x => !x.dead && x.hp < x.maxHp * 0.35) ? true : null, cast: miracle },
  { name: 'JUDGMENT', lvl: 15, tier: 4, wind: 1, pick: (h, f) => f.length >= 4 || G.boss ? true : null, cast: judgment },
];
Object.assign(SPELL_INFO, {
  'CLAW': 'Rake a crescent of foes; every wound feeds you', 'BLOOD WHIP': 'Lash the two nearest foes with a whip of blood', 'BAT BITE': 'Send a bat to bite and drain a foe',
  'BAT SWARM': 'A cloud of bats seeks out every foe nearby', 'HEMORRHAGE': 'Open a wound that bleeds; it heals you when they fall', 'SHADOW STEP': 'Vanish into bats and strike from behind', 'BLOOD MIST': 'Turn to mist: untouchable, healing',
  'CRIMSON LANCE': 'A spear of blood through everything in a line', 'BLOOD NOVA': 'Blood erupts around you; each foe hit heals you', 'BAT CLOUD': 'A whirling storm of bats over the crowd', 'DRAIN LIFE': 'A thick red beam that drinks a foe dry',
  'ABDUCTION': 'Bats seize a knot of foes and carry them off into the night; the heaviest get dropped', 'VAMPIRIC FRENZY': 'Attack twice as fast and drink twice as deep', 'NIGHT WINGS': 'Fly through the horde as a swarm of bats', 'EXSANGUINATE': 'Tear the blood out of everything around you',
  'CRIMSON MOON': 'A red moon rises: blood rains on every foe and bats fill the sky',
  'SMITE': 'A pillar of light on one foe', 'HOLY BOLT': 'A bolt of golden light', 'CENSER': 'Swing a censer of holy fire',
  'LAY ON HANDS': 'A great heal for the most wounded ally', 'BLESSING': 'All allies take half damage for a while', 'CONSECRATE': 'Sanctify the ground: foes burn, allies mend', 'RADIANT SPEAR': 'A spear of light through a line of foes',
  'HOLY NOVA': 'A burst of light that burns foes and heals allies', 'GUARDIAN ANGEL': 'An angel descends and fights at your side', 'CHAINS OF LIGHT': 'Golden chains bind a crowd in place', 'SACRED FLAME': 'Holy fire that leaps to the next foe',
  'DIVINE BEAM': 'A beam from heaven sweeps across the floor', 'SANCTUARY': 'A dome of light: allies shielded and healed, foes burned', 'MIRACLE': 'Raise the fallen and heal everyone',
  'JUDGMENT': 'Angels descend, then a sword of light falls on the crowd',
});
Object.assign(MODS, {
  'CLAW': [['RAKING CLAWS', 'Wider, longer swipes', { size: 1.3 }], ['TWIN SWIPE', 'A second swipe follows', { count: 1 }], ['SHARPENED', '+40% damage', { dmg: 1.4 }]],
  'BLOOD WHIP': [['LONG LASH', 'Reach +35%', { size: 1.35 }], ['SPLIT WHIP', 'Lashes one more foe', { count: 1 }], ['BARBED', '+45% damage', { dmg: 1.45 }]],
  'BAT BITE': [['PAIR OF BATS', 'Two bats per bite', { count: 1 }], ['VENOM FANGS', '+50% damage', { dmg: 1.5 }], ['RESTLESS', 'Bite 30% more often', { cd: 0.7 }]],
  'BAT SWARM': [['COLONY', '+3 bats', { count: 3 }], ['VAMPIRE BATS', 'Bites +50%', { dmg: 1.5 }], ['SWIFT WINGS', 'Cooldown -35%', { cd: 0.65 }]],
  'HEMORRHAGE': [['DEEP WOUNDS', '+50% damage', { dmg: 1.5 }], ['LINGERING', 'Bleeds 60% longer', { dur: 1.6 }], ['BLOOD BLOOM', 'The fallen burst and hurt those near', { f: 'bloom' }]],
  'SHADOW STEP': [['AMBUSH', '+60% damage', { dmg: 1.6 }], ['MISTFORM', 'Untouchable for a second after', { f: 'mist' }], ['BLINK', 'Cooldown -40%', { cd: 0.6 }]],
  'BLOOD MIST': [['THICK MIST', 'Lasts 50% longer', { dur: 1.5 }], ['SANGUINE', 'Heals 60% more', { dmg: 1.6 }], ['VAPOR', 'Cooldown -40%', { cd: 0.6 }]],
  'CRIMSON LANCE': [['IMPALE', 'Pinned foes are stunned', { f: 'stun' }], ['LONG LANCE', 'Length +50%', { size: 1.5 }], ['TWIN LANCES', 'Throw two', { count: 1 }]],
  'BLOOD NOVA': [['CRIMSON TIDE', 'Radius +40%', { size: 1.4 }], ['FEAST', 'Heals twice as much', { f: 'feast' }], ['ECHO', 'A second nova follows', { count: 1 }]],
  'BAT CLOUD': [['NIGHT SKY', 'Radius +40%, more bats', { size: 1.4, count: 1 }], ['FRENZIED', '+50% damage', { dmg: 1.5 }], ['LONG NIGHT', 'Lasts 60% longer', { dur: 1.6 }]],
  'DRAIN LIFE': [['SIPHON', 'Heals twice as much', { f: 'siphon' }], ['HUNGER', '+50% damage', { dmg: 1.5 }], ['LONG DRAW', 'Lasts 50% longer', { dur: 1.5 }]],
  'ABDUCTION': [['GREATER FLOCK', 'Carries off two more', { count: 2 }], ['FEEDING FLIGHT', 'Each one taken heals you 8%', { f: 'feed' }], ['SWIFT FLOCK', 'Cooldown -35%', { cd: 0.65 }]],
  'VAMPIRIC FRENZY': [['BLOODLUST', 'Lasts 50% longer', { dur: 1.5 }], ['GORGE', 'Drink three times as deep', { f: 'gorge' }], ['REVEL', 'Cooldown -40%', { cd: 0.6 }]],
  'NIGHT WINGS': [['MIDNIGHT', '+60% damage', { dmg: 1.6 }], ['WIDE WINGS', 'Longer, wider flight', { size: 1.4 }], ['RETURN FLIGHT', 'Fly back through them', { f: 'back' }]],
  'EXSANGUINATE': [['TOTAL DRAIN', 'Radius +40%', { size: 1.4 }], ['BLOOD PRICE', '+50% damage', { dmg: 1.5 }], ['TRANSFUSION', 'Allies share the blood', { f: 'share' }]],
  'CRIMSON MOON': [['ENDLESS NIGHT', 'Lasts 50% longer', { dur: 1.5 }], ['BLOODRAIN', 'Strikes twice as often', { count: 2 }], ['MOONLIT FEAST', 'The moon heals every ally', { f: 'share' }]],
  'SMITE': [['RIGHTEOUS', '+50% damage', { dmg: 1.5 }], ['TWIN SMITE', 'Strikes a second foe', { count: 1 }], ['SWIFT JUSTICE', 'Cooldown -40%', { cd: 0.6 }]],
  'HOLY BOLT': [['BRIGHT', '+40% damage', { dmg: 1.4 }], ['TRIPLE', 'Three bolts in a fan', { count: 2 }], ['SEEKING', 'Bolts follow their target', { f: 'seek' }]],
  'CENSER': [['WIDE SWING', 'Wider and longer', { size: 1.35 }], ['INCENSE', 'Sets foes alight', { f: 'burn' }], ['FERVOR', '+40% damage', { dmg: 1.4 }]],
  'LAY ON HANDS': [['BLESSED TOUCH', 'Heals 50% more', { dmg: 1.5 }], ['RENEW', 'Keeps healing after', { f: 'renew' }], ['QUICK PRAYER', 'Cooldown -40%', { cd: 0.6 }]],
  'BLESSING': [['AEGIS', 'Lasts 50% longer', { dur: 1.5 }], ['BENEDICTION', 'Also heals 10%', { f: 'heal' }], ['DEVOTION', 'Cooldown -40%', { cd: 0.6 }]],
  'CONSECRATE': [['HALLOWED GROUND', 'Radius +40%', { size: 1.4 }], ['SEARING LIGHT', '+60% damage', { dmg: 1.6 }], ['VIGIL', 'Lasts 60% longer', { dur: 1.6 }]],
  'RADIANT SPEAR': [['LANCE OF DAWN', 'Length +50%', { size: 1.5 }], ['PIERCING', '+50% damage', { dmg: 1.5 }], ['TRIPLE SPEAR', 'Three spears in a fan', { count: 2 }]],
  'HOLY NOVA': [['RADIANCE', 'Radius +40%', { size: 1.4 }], ['MERCY', 'Heals twice as much', { f: 'mercy' }], ['ECHOING LIGHT', 'A second nova follows', { count: 1 }]],
  'GUARDIAN ANGEL': [['SERAPH', '+60% damage', { dmg: 1.6 }], ['ETERNAL', 'Stays 50% longer', { dur: 1.5 }], ['CHOIR', 'Two angels descend', { count: 1 }]],
  'CHAINS OF LIGHT': [['SHACKLES', 'Bound 50% longer', { dur: 1.5 }], ['MORE CHAINS', 'Binds two more', { count: 2 }], ['SEARING CHAINS', 'The chains burn', { f: 'sear' }]],
  'SACRED FLAME': [['PURGE', '+50% damage', { dmg: 1.5 }], ['WILDFIRE', 'Leaps once more', { count: 1 }], ['EVERBURN', 'Burns 60% longer', { dur: 1.6 }]],
  'DIVINE BEAM': [['WRATH', '+50% damage', { dmg: 1.5 }], ['WIDE HEAVENS', 'Beam +50% wider', { size: 1.5 }], ['LONG LIGHT', 'Lasts 50% longer', { dur: 1.5 }]],
  'SANCTUARY': [['BASTION', 'Radius +40%', { size: 1.4 }], ['HALLOWED', 'Heals twice as much', { f: 'heal' }], ['LASTING', 'Lasts 50% longer', { dur: 1.5 }]],
  'MIRACLE': [['GRACE', 'Heals 50% more', { dmg: 1.5 }], ['SECOND COMING', 'Cooldown -40%', { cd: 0.6 }], ['HALO', 'Everyone takes half damage after', { f: 'halo' }]],
  'JUDGMENT': [['HOST OF HEAVEN', 'Two more angels', { count: 2 }], ['WRATH OF GOD', '+50% damage', { dmg: 1.5 }], ['MERCY OF GOD', 'Heals twice as much', { f: 'mercy' }]],
});
