// ===================== water, wood and pixie dust =====================
// Three more that do not bleed (see 46_bits). The water elemental is a wet business: every blow throws a splash of
// water the way it went, every step leaves the floor wet, its blows soak the hero (who drips and leaves wet footprints a
// while), its slam floods the floor around it, and it dies in a burst that leaves a wide puddle; all of it dries in time.
// The treant sheds splinters of wood and its leaves, which flutter down like the scarecrow's hay; a good blow breaks off
// a twig, and it falls apart into logs. The pixie leaves a trail of glowing pixie dust that drifts down twinkling, and a
// blow knocks a puff of it out of her.

const WATER = ['#bfe4ff', '#8cc8f0', '#5a9ad0', '#e8f6ff'];
const WOOD = ['#b08a58', '#c8a070', '#7a5230', '#5a3a1e']; // splinters: pale heartwood and bark
const LEAF = ['#4f7a2a', '#6f9a3a', '#3a5a20', '#8ab048'];
const DUSTC = ['#ffd6f5', '#c8f0ff', '#fff4b0', '#e0c8ff', '#ffffff'];
Object.assign(BIT_EDGE, { water: ['#8cc8f0', '#5a9ad0', '#bfe4ff'], wood: ['#5a3a1e', '#3e2814', '#7a5230'], dust: ['#ffd6f5', '#c8f0ff', '#fff4b0'] });
Object.assign(BIT_ART, {
  twig: ['G..G.', '.B.B.', '..BB.', '...BG'],
  log: ['bbbbbW', 'bBBBBW', 'bbbbbW'],
  bark: ['bB.', 'BBb', '.bB'],
});
Object.assign(BIT_PAL, { B: '#5a3a1e', b: '#3e2814', W: '#c8a070', G: '#6f9a3a' });
const twig = (u, ang, o = {}) => tossBit(pick(['twig', 'twig', 'bark']), u.x, u.y, { ang, hay: LEAF, flat: true, z: rand(8, 14) * (u.scale || 1), ...o });

// --- water
// a drop of water in flight: it lands as a wet spot (and splashes a little), or wets the foot of a wall it strikes
function water(x, y, z, vx, vy, vz, slow = 0) { part({ k: 'water', x, y, z, vx, vy, vz, g: 420, life: 4, s0: chance(0.35) ? 2 : 1, col: pick(WATER), slow }); }
function waterStep(p, dt) {
  if (p.slow > G.time) dt *= 0.15;
  const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
  if (solidAt(nx, ny)) { wetSpot(p.x, p.y, rand(8, 12)); p.t = p.life; return; }
  p.x = nx; p.y = ny; p.vz -= p.g * dt; p.z += p.vz * dt;
  if (p.z <= 0 && overWater(p.x, p.y)) { if (chance(0.3)) plip(p.x, p.y); p.t = p.life; return; } // (back into the water)
  if (p.z <= 0) { wetSpot(p.x, p.y, rand(9, 14), false, p.s0 === 2 ? rand(1.4, 2.2) : rand(0.8, 1.3)); if (chance(0.25)) wetSpot(p.x, p.y, rand(6, 10), true); p.t = p.life; }
}
// a puddle: wet spots over an ellipse, a few catching the light; they dry over life seconds
function puddle(x, y, r, life = 16) {
  for (let i = 0, n = Math.round(2 + r * 0.6); i < n; i++) { const a = rand(TAU), d = Math.sqrt(Math.random()) * r * 0.55; wetSpot(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, life * rand(0.8, 1.15), false, r * rand(0.45, 0.75)); }
  for (let i = 0, n = Math.round(r * 0.8); i < n; i++) { const a = rand(TAU), d = Math.sqrt(Math.random()) * r * 0.8; wetSpot(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.55, life * rand(0.5, 0.9), true); } // glints
}
// a splash: drops thrown out (along a way if given), mist, a puddle under it
function splash(x, y, z, n, o = {}) {
  const S = SPRAY[o.style] || SPRAY.slam, a0 = o.ang === undefined ? null : o.ang;
  for (let i = 0; i < n; i++) { const a = a0 === null ? rand(TAU) : a0 + (o.sweep || 1) * S.bias + rand(-S.spread, S.spread) * 1.3, v = rand(S.v[0], S.v[1]) * (o.spd || 1); water(x + rand(-2, 2), y + rand(-1, 1), z + rand(-3, 3), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(S.up[0], S.up[1]) + 20, o.slow); }
  smoke(x, y, o.mist || 1, 'breath', 6, 16, 0.7, 10);
}
// the elemental's slam: a ring of water thrown out from where it lands and the floor flooded round it
function waterSlam(x, y, r) { splash(x, y, 4, 40, { spd: 1.3 }); puddle(x, y, r * 0.8, 14); ring(x, y, r * 1.2, 'white', 0.3, 3); smoke(x, y, 5, 'breath', 10, 30, 1, 12); SFX.splash(panOf(x), true); shake(0.3); }
// soaked by a blow of it: the hero drips for a while and leaves wet footprints
function soak(h) { if (h.team !== 'hero' || h.dead) return; for (let i = 0; i < 5; i++) sweat(h); h.wetT = 6; }
function wetSteps(h, dt) {
  h.wetT -= dt; if (h.z > 1 || h.dead) return; const d = Math.hypot(h.x - (h.wx === undefined ? h.x : h.wx), h.y - (h.wy === undefined ? h.y : h.wy));
  if (h.wx === undefined || d >= 6) { if (h.wx !== undefined) { const s = (h.wsd = -(h.wsd || 1)), a = Math.atan2(h.y - h.wy, h.x - h.wx) + Math.PI / 2; wetSpot(h.x + Math.cos(a) * 1.5 * s, h.y + Math.sin(a) * 1.2 * s, rand(4, 7), false, 1.1); } h.wx = h.x; h.wy = h.y; }
}
// the elemental itself: every few pixels it moves it wets the floor, and it drips as it goes
function waterTrail(u, dt) {
  const d = Math.hypot(u.x - (u.bx === undefined ? u.x : u.bx), u.y - (u.by === undefined ? u.y : u.by)); u.bx = u.x; u.by = u.y;
  u.bd = (u.bd || 0) + d + dt * 4; if (u.bd < 4) return; u.bd = 0; const sc = u.scale || 1;
  wetSpot(u.x + rand(-3, 3) * sc, u.y + rand(-1, 2), rand(6, 10), false, rand(1.5, 2.6) * sc); if (chance(0.3)) wetSpot(u.x + rand(-3, 3) * sc, u.y + rand(-1, 1), rand(4, 7), true);
  if (chance(0.5)) water(u.x + rand(-3, 3) * sc, u.y, rand(5, 12) * sc, rand(-8, 8), rand(-4, 4), rand(-5, 10));
}

// --- leaves and splinters fall like the hay; pixie dust drifts and twinkles
// a mote of pixie dust: it drifts slowly down, swaying and twinkling, settles, and fades where it lies
function pixieDust(x, y, z, vx, vy, vz) { part({ k: 'pdust', x, y, z, vx, vy, vz, life: rand(1.6, 3), col: pick(DUSTC), ph: rand(TAU), w: rand(4, 8) }); }
function dustStep(p, dt) {
  const f = Math.exp(-2.4 * dt); p.vx *= f; p.vy *= f;
  if (p.z > 0) { p.vz = Math.max(p.vz - 60 * dt, -9); p.x += (p.vx + Math.sin(p.t * p.w + p.ph) * 6) * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); }
}
function drawDust(c, p) { // in the glow layer: a bright point that twinkles, now and then a little cross
  const left = p.life - p.t, tw = 0.5 + 0.5 * Math.sin(p.t * 18 + p.ph), a = Math.min(1, left / 0.8) * (0.35 + 0.65 * tw), x = Math.round(p.x), y = Math.round(p.y - p.z);
  c.globalAlpha = a; c.fillStyle = p.col; c.fillRect(x, y, 1, 1); if (tw > 0.92 && left > 0.5) { c.globalAlpha = a * 0.6; c.fillRect(x - 1, y, 1, 1); c.fillRect(x + 1, y, 1, 1); c.fillRect(x, y - 1, 1, 1); c.fillRect(x, y + 1, 1, 1); }
}
function dustTrail(u, dt) { if ((u.dustT = (u.dustT || 0) - dt) > 0) return; u.dustT = rand(0.09, 0.22); pixieDust(u.x + rand(-3, 3), u.y + rand(-1, 1), (u.z || 0) + rand(4, 9), rand(-6, 6), rand(-4, 4), rand(-4, 4)); }

// --- the blows, the deaths, the throes of these three (called from 46_bits)
function shedElement(u, d, o, k, a0, way, z0, pan) {
  const kind = u.def.blood, sc = u.scale || 1, S = SPRAY[o.style] || SPRAY.bite;
  if (kind === 'water') {
    splash(u.x, u.y, z0, Math.min(70, Math.round(14 * k)), { ...o, mist: d >= 25 ? 2 : 1 }); puddle(u.x, u.y, 3 + k, 10);
    if (!o.quiet) SFX.splash(pan, d >= 30);
  } else if (kind === 'wood') {
    const cols = WOOD; for (let i = 0, n = Math.min(40, Math.round(7 * k)); i < n; i++) { const a = way(), v = rand(S.v[0], S.v[1]); chip(u.x + rand(-2, 2), u.y + rand(-1, 1), z0 + rand(-3, 4), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(S.up[0], S.up[1]) + 20, pick(cols), o.slow); }
    for (let i = 0, n = Math.min(40, Math.round(6 * k)); i < n; i++) { const a = way(), v = rand(S.v[0], S.v[1]) * 0.7; hay(u.x + rand(-4, 4), u.y + rand(-1, 1), z0 + 8 * sc + rand(-3, 4), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(40, 120), o.slow, LEAF, 2); }
    if (!o.quiet) { if (chance(d >= 18 ? 0.85 : 0.55)) twig(u, a0, { slow: o.slow }); if (d >= 30 && chance(0.5)) twig(u, a0, { slow: o.slow }); SFX.wood(pan, d >= 30); }
  } else { // pixie dust
    for (let i = 0, n = Math.min(45, Math.round(11 * k)); i < n; i++) { const a = way(), v = rand(20, 70); pixieDust(u.x + rand(-2, 2), u.y + rand(-1, 1), z0 + rand(-2, 3), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(10, 50)); }
    if (!o.quiet) SFX.chime(pan);
  }
}
function remainsElement(u, o, pan) {
  const kind = u.def.blood, sc = u.scale || 1;
  if (kind === 'water') { splash(u.x, u.y, 8 * sc, 70, { spd: 1.2, mist: 4 }); puddle(u.x, u.y, 13 * sc, 22); smoke(u.x, u.y, 5, 'breath', 12, 26, 1.2, 14); SFX.splash(pan, true); }
  else if (kind === 'wood') { shedElement(u, 50, { ...o, more: 2, quiet: true }, 4, o.ang, () => rand(TAU), 8 * sc, pan); for (let i = 0; i < 3; i++) tossBit('log', u.x, u.y, { v: rand(20, 60), up: rand(40, 90), z: rand(6, 16) * sc, flat: true, tick: true }); twig(u, null); SFX.wood(pan, true); }
  else { for (let i = 0; i < 50; i++) { const a = rand(TAU), v = rand(10, 80); pixieDust(u.x, u.y, (u.z || 0) + 6, Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(-10, 60)); } flashLight(u.x, u.y, 30, 'arcane', 0.6, 0.3); SFX.chime(pan); SFX.chime(pan); }
}
function throesElement(f, k) {
  const kind = f.def.blood, sc = f.scale || 1;
  if (kind === 'water') { splash(f.x, f.y, 11 * sc, Math.round((10 + 16 * k) * sc), { spd: 0.6 * k + 0.3 }); puddle(f.x, f.y, 4 + (1 - k) * 8, 18); SFX.splash(panOf(f.x), k > 0.6); }
  else { for (let i = 0, n = Math.round((4 + 6 * k) * sc); i < n; i++) { const a = rand(TAU), v = rand(10, 40) * k; hay(f.x + rand(-5, 5), f.y + rand(-1, 1), 18 * sc + rand(-3, 3), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(20, 70) * k, 0, LEAF, 2); } if (chance(0.3)) twig(f, null, { v: rand(10, 35) }); SFX.wood(panOf(f.x), false); }
}
function burstElement(u, o, slow, pan) {
  const kind = u.def.blood, sc = u.scale || 1;
  if (kind === 'water') { splash(u.x, u.y, 10 * sc, 120, { ...o, spd: 1.5, slow, mist: 6 }); splash(u.x, u.y, 10 * sc, 50, { slow, spd: 1.2 }); puddle(u.x, u.y, 18 * sc, 24); SFX.splash(pan, true); SFX.splash(pan, true); }
  else { shedElement(u, 70, { ...o, more: 2.4, quiet: true, slow }, 5, o.ang, () => (o.ang === undefined ? rand(TAU) : o.ang + rand(-0.8, 0.8)), 10 * sc, pan); for (let i = 0; i < 3; i++) tossBit('log', u.x, u.y, { ang: o.ang, v: rand(60, 120), slow, flat: true, tick: true }); SFX.wood(pan, true); }
  shake(0.12); kick(0.03);
}
