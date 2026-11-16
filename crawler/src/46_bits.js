// ===================== what the bloodless shed =====================
// Skeletons, the scarecrow and the golems do not bleed; a blow knocks bits off them instead, flung the way it went just
// as blood would be. Skeletons shed chips of bone (and of whatever they wear), and a good blow knocks a small bone loose
// to clatter across the floor; killed, they collapse into a heap of small bones, the skull rolling off. The scarecrow
// throws out hay: loose stalks that flutter down slowly, turning over as they fall, and settle on the floor; a good blow
// knocks a bundle out, which tumbles and sheds stalks as it goes; dying, it pours hay. The golems chip: pieces of their
// own stone break off and are left as rubble. The loose bits stay on the floor as the blood does; the bones and the
// bundles lie a while and fade, as the chunks of flesh do (there are no corpses). None of it is gore: it is there
// whatever the gore setting, apart from the overkill burst, which is FULL only, as for the bleeding.

// colours: bone and hay from the sprites themselves (the skeletons' bone, the scarecrow's straw head), the twine that
// ties a bundle from its sack
const BONE = { L: '#dacdc1', M: '#b3a49a', D: '#8f8685', K: '#2a2826' };
const HAY = ['#eedc80', '#dcc060', '#c5c57f', '#b48e3c', '#8e6c2c'], TWINE = '#5c3c22'; // pale to dark, so it shows on any floor
// the edges of a broken body, as the blood is for those who bleed
const BIT_EDGE = { bone: [BONE.M, BONE.D, BONE.L], straw: [HAY[1], HAY[4], HAY[3]], stone: ['#6e6e6e', '#625353', '#4a4444'] };
// small bones and bundles, drawn in pixels: L M D K bone (light, mid, dark, a socket), h hay (any of its colours), t twine;
// each gets an outline, as the creatures have (a soft brown one round the hay)
const BIT_ART = {
  long: ['.L...L.', 'LLMMMLL', '.D...D.'],
  short: ['L...L', 'LMMML', 'D...D'],
  slant: ['.L...', 'LLM..', '.MMM.', '..MDD', '...D.'],
  rib: ['..LLL', '.LM..', 'LM...'],
  skull: ['.LLL.', 'LLLLM', 'LKLKM', '.MMM.', '.M.D.'],
  sheaf: ['hhh.hhh', '.hhthh.', '.hhthh.', 'hhh.hhh'],
  tuft: ['h.hh.', 'hhhhh', '.hh.h'],
  clump: ['.hhh', 'hhhh', 'hhh.'],
};
const BIT_ROT = {}; // each piece in its four quarter turns, a few of each (the hay in its own colours each time)
function bitRot(name) {
  const L = BIT_ROT[name] || (BIT_ROT[name] = []); if (L.length >= 4) return pick(L);
  const art = BIT_ART[name], w = art[0].length, h = art.length, cv = mkCanvas(w + 2, h + 2), g = cv.getContext('2d'), on = (x, y) => art[y] && art[y][x] && art[y][x] !== '.';
  g.fillStyle = art.some(r => r.includes('h')) ? 'rgba(70,46,22,0.55)' : 'rgba(29,29,28,0.8)'; // the outline
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) g.fillRect(x + 1, y + 1, 1, 1);
  art.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = ch === 'h' ? pick(HAY) : ch === 't' ? TWINE : BONE[ch]; g.fillRect(x + 1, y + 1, 1, 1); }));
  const rot = [cv]; for (let r = 1; r < 4; r++) { const s = rot[r - 1], q = mkCanvas(s.height, s.width), og = q.getContext('2d'); og.setTransform(0, 1, -1, 0, s.height, 0); og.drawImage(s, 0, 0); rot.push(q); }
  L.push(rot); return rot;
}
// a piece thrown: it tumbles a quarter turn at a time, bounces, comes to rest and lies a while (see updateRocks)
// o: ang (the way it goes; else anywhere), v, up, z, lie, hay (sheds stalks in flight), tick (clicks when it lands),
// flat (comes to rest lying along the floor), upright (comes to rest the right way up), slow
function tossBit(name, x, y, o = {}) {
  const a = o.ang === undefined || o.ang === null ? rand(TAU) : o.ang + rand(-0.7, 0.7), v = (o.v || rand(40, 90));
  FX.rocks.push({ rot: bitRot(name), r: randi(0, 3), x: x + rand(-2, 2), y: y + rand(-1, 1), z: o.z || rand(5, 9), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.75, vz: o.up || rand(60, 120), spin: rand(0.06, 0.12), t: 0, wait: 0, fade: 0, lie: o.lie || rand(6, 9), slow: o.slow || 0, hay: o.hay, tick: o.tick, flat: o.flat, upright: o.upright });
  if (FX.rocks.length > 90) FX.rocks.splice(0, FX.rocks.length - 90);
}
const smallBone = (u, ang, o = {}) => tossBit(pick(['long', 'long', 'short', 'slant', 'rib']), u.x, u.y, { ang, tick: true, flat: true, z: rand(4, 9) * (u.scale || 1), ...o });
const bundle = (u, ang, o = {}) => tossBit(pick(['sheaf', 'tuft', 'clump']), u.x, u.y, { ang, hay: true, z: rand(6, 11) * (u.scale || 1), ...o });

// --- loose bits: hay stalks and chips, each a particle of whole pixels
// a stalk, 2-4 px long, lying one of four ways: along, slanting down, upright, slanting up
const HAY_DIR = [[1, 0], [1, 1], [0, 1], [1, -1]];
function hayPx(p, f) { const [dx, dy] = HAY_DIR[p.o], x0 = Math.round(p.x), y0 = Math.round(p.y - p.z), h = p.len >> 1; for (let i = 0; i < p.len; i++) f(x0 + dx * (i - h), y0 + dy * (i - h)); }
function hay(x, y, z, vx, vy, vz, slow = 0) {
  part({ k: 'hay', x, y, z, vx, vy, vz, life: 9, len: chance(0.3) ? 4 : chance(0.6) ? 3 : 2, o: randi(0, 3), ot: rand(0.05, 0.2), ph: rand(TAU), w: rand(5, 9), col: pick(HAY), slow });
}
// light as it is, it soon loses its speed; it sinks slowly, swaying, turning over and over, and settles where it comes down
function hayStep(p, dt) {
  if (p.slow > G.time) dt *= 0.15;
  const f = Math.exp(-2.6 * dt); p.vx *= f; p.vy *= f; p.vz = Math.max(p.vz - 190 * dt, -24);
  const sway = Math.sin(p.t * p.w + p.ph) * 16 * (p.vz < 0 ? 1 : 0.3), nx = p.x + (p.vx + sway) * dt, ny = p.y + p.vy * dt;
  if (solidAt(nx, p.y)) p.vx = -p.vx * 0.3; else p.x = nx; if (solidAt(p.x, ny)) p.vy = -p.vy * 0.3; else p.y = ny;
  if ((p.ot -= dt) <= 0) { p.ot = rand(0.07, 0.22); p.o = (p.o + (chance(0.5) ? 1 : 3)) % 4; }
  p.z += p.vz * dt; if (p.z <= 0) { p.z = 0; if (ARENA) { const x = Math.round(p.x), y = Math.round(p.y); groundPaint(x - 3, y - 3, x + 3, y + 3, g => { g.fillStyle = p.col; hayPx(p, (a, b) => g.fillRect(a, b, 1, 1)); }); } p.t = p.life; }
}
// a chip: a pixel or two of bone or stone; it bounces once and stays where it stops
function chip(x, y, z, vx, vy, vz, col, slow = 0) { part({ k: 'chip', x, y, z, vx, vy, vz, life: 6, s0: chance(0.45) ? 2 : 1, col, slow }); }
function chipStep(p, dt) {
  if (p.slow > G.time) dt *= 0.15;
  const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
  if (solidAt(nx, p.y)) p.vx = -p.vx * 0.4; else p.x = nx; if (solidAt(p.x, ny)) p.vy = -p.vy * 0.4; else p.y = ny;
  p.vz -= 420 * dt; p.z += p.vz * dt;
  if (p.z <= 0) {
    if (p.vz < -45) { p.z = 0; p.vz = -p.vz * 0.35; p.vx *= 0.5; p.vy *= 0.5; return; }
    if (ARENA) { const x = Math.round(p.x), y = Math.round(p.y); groundPaint(x - 2, y - 2, x + 3, y + 2, g => { g.globalAlpha = 0.8; g.fillStyle = p.col; g.fillRect(x, y, p.s0, 1); g.globalAlpha = 1; }); }
    p.t = p.life;
  }
}
// what a body is made of, for its chips: its own colours, bar the outline and the darkest shades (and for a skeleton,
// only its greys: the wood of a bow would pass for blood)
const BIT_COLS = {};
function bitCols(u) {
  if (BIT_COLS[u.spr]) return BIT_COLS[u.spr]; const grey = u.def.blood === 'bone';
  const c = spritePixels(u.spr).map(q => q.c).filter(c => { const [r, g, b] = c.match(/\d+/g).map(Number), hi = Math.max(r, g, b); return r * 0.3 + g * 0.59 + b * 0.11 > 75 && (!grey || (hi - Math.min(r, g, b)) / hi < 0.3); });
  return (BIT_COLS[u.spr] = c.length ? c : BLOOD.bone);
}
// a piece of the golem's own stone, from somewhere on it, left as rubble
function ownChip(u, away) {
  const m = MOBS[u.spr]; if (!m) return; const sc = u.scale || 1, fr = ((u.anim * 9) | 0) % 4;
  if (sc !== 1) { const B = bigSprite(u.spr, sc); B.pd = B.pd || pixelData(B.cv); chipSprite(B.pd, fr * B.W, 0, B.W, B.H, Math.round(u.x - B.W / 2), Math.round(u.y - u.z - B.foot), u.y, away); }
  else chipSprite(PIX.mobs, fr * m[1], m[0], m[1], m[2], Math.round(u.x - m[1] / 2), Math.round(u.y - u.z - footOf(u.spr) - 1), u.y, away);
}

// --- a blow lands: the bits fly the way it went, as the blood does (the same weapon styles: a sweep flings them in an
// arc along the swing, a thrust in a jet out of the far side, a slam all round)
function shed(u, d, o = {}) {
  const kind = u.def.blood, sc = u.scale || 1, S = SPRAY[o.style] || SPRAY.bite, k = clamp(d / 12, 0.5, 3.5) * (o.more || 1), pan = panOf(u.x);
  const a0 = o.ang === undefined ? rand(TAU) : o.ang, way = () => a0 + (o.sweep || 1) * S.bias + rand(-S.spread, S.spread) * 1.3, z0 = (u.z || 0) + 6 * sc;
  if (kind === 'straw') {
    for (let i = 0, n = Math.min(60, Math.round(10 * k)); i < n; i++) { const a = way(), v = rand(S.v[0], S.v[1]) * 0.9; hay(u.x + rand(-2, 2), u.y + rand(-1, 1), z0 + rand(-3, 4), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(40, 130), o.slow); }
    smoke(u.x, u.y, d >= 25 ? 2 : 1, 'dust', 6, 14, 0.8); // chaff
    if (!o.quiet) { if (d >= 18 && chance(0.55)) bundle(u, a0, { slow: o.slow }); SFX.hay(pan, d >= 30); }
  } else if (kind === 'bone') {
    const cols = bitCols(u);
    for (let i = 0, n = Math.min(45, Math.round(9 * k)); i < n; i++) { const a = way(), v = rand(S.v[0], S.v[1]); chip(u.x + rand(-2, 2), u.y + rand(-1, 1), z0 + rand(-3, 3), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(S.up[0], S.up[1]) + 20, pick(cols), o.slow); }
    smoke(u.x, u.y, 1, 'dust', 5, 12, 0.6);
    if (!o.quiet) { if (d >= 20 && chance(0.45)) smallBone(u, a0, { slow: o.slow }); SFX.bone(pan, d >= 30); }
  } else { // stone and clay: sparks off it, grit, and now and then a piece of it
    const cols = bitCols(u); sparks(u.x, u.y, 8 * sc, 5, 'white', 110, 80);
    for (let i = 0, n = Math.min(30, Math.round(6 * k)); i < n; i++) { const a = way(), v = rand(S.v[0], S.v[1]) * 0.8; chip(u.x + rand(-2, 2), u.y + rand(-1, 1), z0 + rand(-3, 3), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(30, 90), pick(cols), o.slow); }
    smoke(u.x, u.y, 1, 'dust', 6, 14, 0.7);
    if (!o.quiet) { if (d >= 20 || chance(0.4)) ownChip(u, a0); SFX.stone(pan, false); }
  }
}
// the badly wounded leave a trail of what they are made of: a stalk, a chip
function shedTrail(u) {
  const z = rand(4, 8) * (u.scale || 1);
  if (u.def.blood === 'straw') hay(u.x + rand(-2, 2), u.y + rand(-1, 1), z, rand(-10, 10), rand(-6, 6), rand(0, 20));
  else if (u.def.blood === 'bone') chip(u.x + rand(-2, 2), u.y + rand(-1, 1), z, rand(-15, 15), rand(-10, 10), rand(10, 40), pick(bitCols(u)));
}
// killed: a skeleton collapses into a heap of small bones, the skull rolling off; the scarecrow bursts in a cloud of hay
// and bundles; a golem breaks into pieces of itself
function remains(u) {
  const kind = u.def.blood, sc = u.scale || 1, o = u.lastBlow || {}, a = o.ang, pan = panOf(u.x);
  if (kind === 'bone') {
    for (let i = 0, n = Math.round(randi(3, 5) * sc); i < n; i++) smallBone(u, null, { v: rand(15, 60), up: rand(40, 100) });
    if (u.spr !== 'SkitteringHand') tossBit('skull', u.x, u.y, { ang: a, v: rand(35, 70), up: rand(50, 90), z: 10 * sc, tick: true, upright: true });
    shed(u, 30, { ...o, quiet: true }); SFX.clatter(pan);
  } else if (kind === 'straw') {
    shed(u, 50, { ...o, more: 2, quiet: true }); for (let i = 0, n = randi(2, 3); i < n; i++) bundle(u, null, { v: rand(30, 80) });
    smoke(u.x, u.y, 4, 'dust', 9, 24, 1.2); SFX.hay(pan, true);
  } else {
    shed(u, 40, { ...o, more: 1.5, quiet: true }); for (let i = 0; i < 3; i++) ownChip(u, a); smoke(u.x, u.y, 4, 'dust', 10, 24, 1.3); SFX.stone(pan, true);
  }
}
// a brute's death throes, for those that do not bleed: the scarecrow's hay pours out of it, a golem crumbles
function throesShed(f, k) {
  const kind = f.def.blood, sc = f.scale || 1;
  if (kind === 'straw') {
    for (let i = 0, n = Math.round((5 + 7 * k) * sc); i < n; i++) { const a = rand(TAU), v = rand(10, 45) * k; hay(f.x + rand(-3, 3), f.y + rand(-1, 1), 11 * sc + rand(-2, 2), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(30, 110) * k); }
    if (chance(0.3)) bundle(f, null, { v: rand(15, 40), up: rand(40, 80) }); SFX.hay(panOf(f.x), false);
  } else if (kind === 'bone') {
    shed(f, 20, { quiet: true, more: k }); if (chance(0.3)) smallBone(f, null, { v: rand(15, 40) }); SFX.bone(panOf(f.x), false);
  } else {
    shed(f, 20, { quiet: true, more: k }); if (chance(0.4)) ownChip(f, null); smoke(f.x, f.y - 4, 1, 'dust', 8, 16, 1); SFX.stone(panOf(f.x), false);
  }
}
// an overkill on one that does not bleed: it bursts, as the bleeding do, into pieces of itself, and its bits fly
function burstBits(u, o, slow) {
  const kind = u.def.blood, pan = panOf(u.x); shed(u, 70, { ...o, more: 2.2, quiet: true, slow });
  if (kind === 'bone') { for (let i = 0; i < 6; i++) smallBone(u, o.ang, { v: rand(60, 130), slow }); if (u.spr !== 'SkitteringHand') tossBit('skull', u.x, u.y, { ang: o.ang, v: rand(80, 130), z: 10, tick: true, upright: true, slow }); SFX.clatter(pan); SFX.bone(pan, true); }
  else if (kind === 'straw') { for (let i = 0; i < 4; i++) bundle(u, o.ang, { v: rand(50, 120), slow }); shed(u, 60, { style: 'slam', quiet: true, slow }); smoke(u.x, u.y, 6, 'dust', 11, 30, 1.4); SFX.hay(pan, true); }
  else { for (let i = 0; i < 3; i++) ownChip(u, o.ang); smoke(u.x, u.y, 6, 'dust', 12, 30, 1.5); SFX.stone(pan, true); }
  shake(0.12); kick(0.03);
}
