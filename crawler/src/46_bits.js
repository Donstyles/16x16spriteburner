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
const BIT_PAL = {}; // more colours by letter (the wood's: 47_elements)
const BIT_ROT = {}; // each piece in its four quarter turns, a few of each (the hay in its own colours each time)
function bitRot(name) {
  const L = BIT_ROT[name] || (BIT_ROT[name] = []); if (L.length >= 4) return pick(L);
  const art = BIT_ART[name], w = art[0].length, h = art.length, cv = mkCanvas(w + 2, h + 2), g = cv.getContext('2d'), on = (x, y) => art[y] && art[y][x] && art[y][x] !== '.';
  g.fillStyle = art.some(r => /[LMDK]/.test(r)) ? 'rgba(29,29,28,0.8)' : 'rgba(70,46,22,0.55)'; // the outline: dark round bone, soft brown round hay and wood
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) g.fillRect(x + 1, y + 1, 1, 1);
  art.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = ch === 'h' ? pick(HAY) : ch === 't' ? TWINE : BIT_PAL[ch] || BONE[ch]; g.fillRect(x + 1, y + 1, 1, 1); }));
  const rot = [cv]; for (let r = 1; r < 4; r++) { const s = rot[r - 1], q = mkCanvas(s.height, s.width), og = q.getContext('2d'); og.setTransform(0, 1, -1, 0, s.height, 0); og.drawImage(s, 0, 0); rot.push(q); }
  L.push(rot); return rot;
}
// a piece thrown: it tumbles a quarter turn at a time, bounces, comes to rest and lies a while (see updateRocks)
// o: ang (the way it goes; else anywhere), v, up, z, lie, hay (sheds stalks in flight), tick (clicks when it lands),
// flat (comes to rest lying along the floor), upright (comes to rest the right way up), slow
function tossBit(name, x, y, o = {}) {
  const a = o.ang === undefined || o.ang === null ? rand(TAU) : o.ang + rand(-0.7, 0.7), v = (o.v || rand(40, 90));
  FX.rocks.push({ bit: name, rot: bitRot(name), r: randi(0, 3), x: x + rand(-2, 2), y: y + rand(-1, 1), z: o.z || rand(5, 9), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.75, vz: o.up || rand(60, 120), spin: rand(0.06, 0.12), t: 0, wait: 0, fade: 0, lie: o.lie || rand(6, 9), slow: o.slow || 0, hay: o.hay, tick: o.tick, flat: o.flat, upright: o.upright });
  if (FX.rocks.length > 90) FX.rocks.splice(0, FX.rocks.length - 90);
}
const smallBone = (u, ang, o = {}) => tossBit(pick(['long', 'long', 'short', 'slant', 'rib']), u.x, u.y, { ang, tick: true, flat: true, z: rand(4, 9) * (u.scale || 1), ...o });
// a skeleton has one skull and four small bones (a bigger one proportionally more). A blow that takes a quarter to a half
// of its full health knocks one loose half the time, a blow of half or more always does, a lighter one never; killed, it
// spills all it has left, the skull last. The skittering hand has no skull, only two finger bones.
const hasSkull = u => u.spr !== 'SkitteringHand';
const boneCap = u => (hasSkull(u) ? Math.round(5 * Math.max(1, u.scale || 1)) : 2);
function looseBone(u, ang, o = {}) { if ((u.bones || 0) >= boneCap(u) - (hasSkull(u) ? 1 : 0)) return false; u.bones = (u.bones || 0) + 1; smallBone(u, ang, o); return true; }
function skull(u, o = {}) { if (!hasSkull(u) || u.skull) return; u.skull = true; tossBit('skull', u.x, u.y, { tick: true, upright: true, z: 10 * (u.scale || 1), ...o }); }
const bundle = (u, ang, o = {}) => tossBit(pick(['sheaf', 'tuft', 'clump']), u.x, u.y, { ang, hay: true, z: rand(6, 11) * (u.scale || 1), ...o });

// --- loose bits: hay stalks and chips, each a particle of whole pixels
// a stalk, 2-4 px long, lying one of four ways: along, slanting down, upright, slanting up
const HAY_DIR = [[1, 0], [1, 1], [0, 1], [1, -1]];
function hayPx(p, f) { const [dx, dy] = HAY_DIR[p.o], x0 = Math.round(p.x), y0 = Math.round(p.y - p.z), h = p.len >> 1; for (let i = 0; i < p.len; i++) f(x0 + dx * (i - h), y0 + dy * (i - h)); }
// (cols: other colours, as for the treant's leaves; len: a fixed length)
function hay(x, y, z, vx, vy, vz, slow = 0, cols = null, len = 0) {
  part({ k: 'hay', x, y, z, vx, vy, vz, life: 9, len: len || (chance(0.3) ? 4 : chance(0.6) ? 3 : 2), o: randi(0, 3), ot: rand(0.05, 0.2), ph: rand(TAU), w: rand(5, 9), col: pick(cols || HAY), slow });
}
// light as it is, it soon loses its speed; it sinks slowly, swaying, turning over and over, and settles where it comes down
function hayStep(p, dt) {
  if (p.slow > G.time) dt *= 0.15;
  const f = Math.exp(-2.6 * dt); p.vx *= f; p.vy *= f; p.vz = Math.max(p.vz - 190 * dt, -(p.fall || 24));
  const sway = Math.sin(p.t * p.w + p.ph) * 16 * (p.vz < 0 ? 1 : 0.3), nx = p.x + (p.vx + sway) * dt, ny = p.y + p.vy * dt;
  if (solidAt(nx, p.y)) p.vx = -p.vx * 0.3; else p.x = nx; if (solidAt(p.x, ny)) p.vy = -p.vy * 0.3; else p.y = ny;
  if ((p.ot -= dt) <= 0) { p.ot = rand(0.07, 0.22); p.o = (p.o + (chance(0.5) ? 1 : 3)) % 4; }
  p.z += p.vz * dt; if (p.z <= 0) { p.z = 0; if (ARENA) { const x = Math.round(p.x), y = Math.round(p.y); groundPaint(x - 3, y - 3, x + 3, y + 3, g => { g.fillStyle = p.col; hayPx(p, (a, b) => g.fillRect(a, b, 1, 1)); }); } p.t = p.life; }
}
// a broken ring of mail (53_foes ringSpill): a pixel ring of steel, three pixels across with its middle open; it
// bounces once with a clink, and lies where it stops
function mailRing(x, y, z, vx, vy, vz, col, slow = 0) { part({ k: 'ring', x, y, z, vx, vy, vz, life: 6, s0: 1, col, slow }); }
function ringPx(x, y, f) { f(x, y - 1); f(x - 1, y); f(x + 1, y); f(x, y + 1); } // (a ring seen at this size: four pixels round an open middle)
// a chip: a pixel or two of bone or stone; it bounces once and stays where it stops
function chip(x, y, z, vx, vy, vz, col, slow = 0) { part({ k: 'chip', x, y, z, vx, vy, vz, life: 6, s0: chance(0.45) ? 2 : 1, col, slow }); }
// A patch of the gambeson hacked out of it (53_foes clothSpill): a small torn piece of its quilting, padded and lit from
// the top left in the quilting's own shades (80_hud quiltTex), its edge a shade darker than its middle; no outline (as
// nothing that sprays or drops off a blow has one). Each its own shape, never quite square to the floor: a little
// diamond, a square, a skewed or a lopsided scrap, with a corner or two torn off; mostly three or four pixels across.
// Heavy with its wadding, it goes only a little way with the blow, turning over as it flies (face, half-turned, edge-on,
// its wadded back), drops, bounces once and lies flat where it stops (chipStep).
function patchShape(big) {
  const k = randi(0, 3), P = [];
  if (k === 0) { const r = big && chance(0.5) ? 2 : 1; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (Math.abs(x) + Math.abs(y) <= r) P.push([x, y]); } // a little diamond
  else { const w = randi(2, big ? 4 : 3), h = randi(2, 3), sh = k === 2 ? (chance(0.5) ? 1 : -1) : 0; // a square, a skewed scrap, a lopsided one
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) P.push([x - (w >> 1) + (sh ? Math.round(sh * (y - h / 2) * 0.7) : 0), y - (h >> 1)]);
    if (k === 3) P.push([w - (w >> 1), randi(-1, 0)]); }
  for (let n = randi(0, P.length > 5 ? 2 : 1); n > 0 && P.length > 3; n--) P.splice(randi(0, P.length - 1), 1); // (torn: a pixel or two gone)
  const at = new Set(P.map(([x, y]) => x + ',' + y)), edge = ([x, y]) => !at.has((x - 1) + ',' + y) || !at.has((x + 1) + ',' + y) || !at.has(x + ',' + (y - 1)) || !at.has(x + ',' + (y + 1));
  return P.map(q => [q[0], q[1], Math.sign(q[0] + q[1]) + 1 + (edge(q) ? 1 : 0)]); // [x, y, shade]: 0 the brightest
}
function patch(x, y, z, vx, vy, vz, big, slow = 0) { part({ k: 'patch', x, y, z, vx, vy, vz, life: 6, o: randi(0, 3), ot: rand(0.05, 0.1), shape: patchShape(big), slow }); }
function patchPx(p, f) {
  const x0 = Math.round(p.x), y0 = Math.round(p.y - p.z), o = p.o, S = p.shape;
  if (o === 2) { const xs = S.map(q => q[0]), a = Math.min(...xs), b = Math.max(...xs); for (let x = a; x <= b; x++) f(x0 + x, y0, x < 0 ? QCOL.base : QCOL.low); return; } // (edge-on)
  const seen = new Set(); for (const [x, y, sh] of S) { const yy = o === 1 ? Math.round(y / 2) : y, key = x + ',' + yy; if (o === 1 && seen.has(key)) continue; seen.add(key); // (half-turned: squashed top to bottom)
    f(x0 + x, y0 + yy, o === 3 ? (sh >= 2 ? QCOL.thread : QCOL.wad) : [QCOL.hi, QCOL.base, QCOL.low, QCOL.dip][sh]); }
}
function chipStep(p, dt) {
  if (p.slow > G.time) dt *= 0.15;
  if (p.k === 'arrowbit' && p.z > 0) p.a += p.va * dt; // (an arrow turning as it falls)
  if (p.k === 'patch' && p.z > 0 && (p.ot -= dt) <= 0) { p.ot = rand(0.05, 0.1); p.o = (p.o + 1) % 4; } // (turning over as it flies)
  const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
  if (solidAt(nx, p.y)) p.vx = -p.vx * 0.4; else p.x = nx; if (solidAt(p.x, ny)) p.vy = -p.vy * 0.4; else p.y = ny;
  p.vz -= 420 * dt; p.z += p.vz * dt;
  if (p.z <= 0) {
    if (p.vz < -45) { p.z = 0; p.vz = -p.vz * 0.35; p.vx *= 0.5; p.vy *= 0.5; if ((p.k === 'ring' && chance(0.35)) || p.k === 'arrowbit') SFX.tick(panOf(p.x)); return; }
    if (p.k === 'arrowbit') { floorArrow(p.x, p.y, p.a); p.t = p.life; return; } // (it lies where it stops: 47_arrows)
    if (ARENA) { const x = Math.round(p.x), y = Math.round(p.y); groundPaint(x - 4, y - 4, x + 5, y + 4, g => { g.globalAlpha = 0.8; g.fillStyle = p.col; if (p.k === 'ring') ringPx(x, y, (a, b) => g.fillRect(a, b, 1, 1)); else if (p.k === 'patch') { if (p.o === 1 || p.o === 2) p.o = 0; g.globalAlpha = 1; patchPx(p, (a, b, col) => { g.fillStyle = col; g.fillRect(a, b, 1, 1); }); } /* (it lies flat, face up or its back up) */ else g.fillRect(x, y, p.s0, 1); g.globalAlpha = 1; }); }
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
  if (sc !== 1) { const B = bigSprite(u.spr, sc); B.pd = B.pd || pixelData(B.cv); chipSprite(B.pd, B.fx(fr), 0, B.W, B.H, Math.round(u.x) + B.ox, Math.round(u.y - u.z - B.foot), u.y, away); }
  else chipSprite(PIX.mobs, fr * m[1], m[0], m[1], m[2], Math.round(u.x - m[1] / 2), Math.round(u.y - u.z - footOf(u.spr) - 1), u.y, away);
}

// --- a blow lands: the bits fly the way it went, as the blood does (the same weapon styles: a sweep flings them in an
// arc along the swing, a thrust in a jet out of the far side, a slam all round)
function shed(u, d, o = {}) {
  const kind = u.def.blood, sc = u.scale || 1, S = SPRAY[o.style] || SPRAY.bite, k = clamp(d / 12, 0.5, 3.5) * (o.more || 1), pan = panOf(u.x);
  const a0 = o.ang === undefined ? rand(TAU) : o.ang, way = () => a0 + (o.sweep || 1) * S.bias + rand(-S.spread, S.spread) * 1.3, z0 = (u.z || 0) + 6 * sc;
  if (kind === 'water' || kind === 'wood' || kind === 'dust') { shedElement(u, d, o, k, a0, way, z0, pan); return; }
  if (kind === 'straw') {
    for (let i = 0, n = Math.min(60, Math.round(10 * k)); i < n; i++) { const a = way(), v = rand(S.v[0], S.v[1]) * 0.9; hay(u.x + rand(-2, 2), u.y + rand(-1, 1), z0 + rand(-3, 4), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(40, 130), o.slow); }
    smoke(u.x, u.y, d >= 25 ? 2 : 1, 'dust', 6, 14, 0.8); // chaff
    if (!o.quiet) { if (d >= 18 && chance(0.55)) bundle(u, a0, { slow: o.slow }); SFX.hay(pan, d >= 30); }
  } else if (kind === 'bone') {
    const cols = bitCols(u);
    for (let i = 0, n = Math.min(45, Math.round(9 * k)); i < n; i++) { const a = way(), v = rand(S.v[0], S.v[1]); chip(u.x + rand(-2, 2), u.y + rand(-1, 1), z0 + rand(-3, 3), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(S.up[0], S.up[1]) + 20, pick(cols), o.slow); }
    smoke(u.x, u.y, 1, 'dust', 5, 12, 0.6);
    const share = d / (u.maxHp || 1); // how much of its full health the blow took
    if (!o.quiet) { if (share >= 0.5 || (share >= 0.25 && chance(0.5))) looseBone(u, a0, { slow: o.slow }); SFX.bone(pan, share >= 0.25); }
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
  if (u.def.blood === 'wood') { hay(u.x + rand(-4, 4), u.y + rand(-1, 1), z + 8, rand(-10, 10), rand(-6, 6), rand(0, 20), 0, LEAF, 2); return; }
  if (u.def.blood === 'straw') hay(u.x + rand(-2, 2), u.y + rand(-1, 1), z, rand(-10, 10), rand(-6, 6), rand(0, 20));
  else if (u.def.blood === 'bone') chip(u.x + rand(-2, 2), u.y + rand(-1, 1), z, rand(-15, 15), rand(-10, 10), rand(10, 40), pick(bitCols(u)));
}
// killed: a skeleton collapses into a heap of small bones, the skull rolling off; the scarecrow bursts in a cloud of hay
// and bundles; a golem breaks into pieces of itself
function remains(u) {
  const kind = u.def.blood, sc = u.scale || 1, o = u.lastBlow || {}, a = o.ang, pan = panOf(u.x);
  if (kind === 'water' || kind === 'wood' || kind === 'dust') { remainsElement(u, o, pan); return; }
  if (kind === 'bone') {
    while (looseBone(u, null, { v: rand(15, 60), up: rand(40, 100) })); // all it has left
    skull(u, { ang: a, v: rand(35, 70), up: rand(50, 90) });
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
  if (kind === 'water' || kind === 'wood') { throesElement(f, k); return; }
  if (kind === 'straw') {
    for (let i = 0, n = Math.round((5 + 7 * k) * sc); i < n; i++) { const a = rand(TAU), v = rand(10, 45) * k; hay(f.x + rand(-3, 3), f.y + rand(-1, 1), 11 * sc + rand(-2, 2), Math.cos(a) * v, Math.sin(a) * v * 0.8, rand(30, 110) * k); }
    if (chance(0.3)) bundle(f, null, { v: rand(15, 40), up: rand(40, 80) }); SFX.hay(panOf(f.x), false);
  } else if (kind === 'bone') {
    shed(f, 20, { quiet: true, more: k }); if (chance(0.3)) looseBone(f, null, { v: rand(15, 40) }); SFX.bone(panOf(f.x), false);
  } else {
    shed(f, 20, { quiet: true, more: k }); if (chance(0.4)) ownChip(f, null); smoke(f.x, f.y - 4, 1, 'dust', 8, 16, 1); SFX.stone(panOf(f.x), false);
  }
}
// an overkill on one that does not bleed: it bursts, as the bleeding do, into pieces of itself, and its bits fly (a
// skeleton into its bones: what it has left of them, flung hard, and its skull)
function burstBits(u, o, slow) {
  const kind = u.def.blood, pan = panOf(u.x);
  if (kind === 'water' || kind === 'wood') { burstElement(u, o, slow, pan); return; } shed(u, 70, { ...o, more: 2.2, quiet: true, slow });
  if (kind === 'bone') { while (looseBone(u, o.ang, { v: rand(60, 130), slow })); skull(u, { ang: o.ang, v: rand(80, 130), slow }); SFX.clatter(pan); SFX.bone(pan, true); }
  else if (kind === 'straw') { for (let i = 0; i < 4; i++) bundle(u, o.ang, { v: rand(50, 120), slow }); shed(u, 60, { style: 'slam', quiet: true, slow }); smoke(u.x, u.y, 6, 'dust', 11, 30, 1.4); SFX.hay(pan, true); }
  else { for (let i = 0; i < 3; i++) ownChip(u, o.ang); smoke(u.x, u.y, 6, 'dust', 12, 30, 1.5); SFX.stone(pan, true); }
  shake(0.12); kick(0.03);
}
