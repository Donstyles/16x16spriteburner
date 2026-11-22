// ===================== blood =====================
// Every blow that draws blood throws it the way the weapon was going: a sword's sweep flings an arc of drops along the
// swing, a thrust (spear, a finisher, a dagger's stab) shoots a jet out of the far side, an axe throws heavy clots,
// daggers quick spurts, an overhead slam splashes all round. Drops land as pixels painted into the floor; one that
// reaches the face of a wall splashes there and runs down it. Blood gathers on the hero's blade, drips from its tip and
// wears off (a roll wipes some away); stepping in it leaves footprints; the badly wounded leave a trail. A killing blow
// far beyond what one of the bigger foes (not the trash) had left bursts it into chunks of itself, and the moment
// is held: the hero freezes a little longer and the burst starts slowly, then flies.
// GORE.level: 0 off, 1 blood, 2 full (the bursts too); kept on this device.
const GORE = { level: 2, big: 0.5 }; // big: the least share of spray drops that fly as 2x2 (an axe throws more)
try { const v = localStorage.getItem('cr2-gore'); if (v !== null && v !== '') GORE.level = clamp(Math.round(+v) || 0, 0, 2); } catch (e) { /* storage blocked: the default */ }
function setGore(v) { GORE.level = v; try { localStorage.setItem('cr2-gore', String(v)); } catch (e) { /* not kept */ } }
const GORE_NAMES = ['OFF', 'BLOOD', 'FULL'];
const DRY = new Set(['bone', 'stone', 'straw', 'water', 'wood', 'dust']); // these do not bleed: they shed bits instead (46_bits)
const DUST = ['#5a5048', '#7d7064', '#3c342e'];
const bleeds = u => GORE.level > 0 && !DRY.has(u.def.blood || 'red');
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const GIB_HOLD = 0.22; // how long a burst is held: the hero frozen, the pieces and spray moving slowly

// --- where blood lies: a coarse map (4 px cells) of how much, and of which kind, so feet can pick it up
const BK = ['red', 'slime', 'bug', 'sludge', 'bone', 'stone', 'straw', 'water', 'wood', 'dust'];
const BMAP = { A: null, w: 0, a: null, k: null };
function bmap() {
  const A = ARENA; if (BMAP.A !== A) { BMAP.A = A; BMAP.w = Math.ceil(A.w * TS / 4); const n = BMAP.w * Math.ceil(A.h * TS / 4); BMAP.a = new Uint8Array(n); BMAP.k = new Uint8Array(n); BTR.length = 0; }
  return BMAP;
}
const onStone = (x, y) => { const A = ARENA; if (!A || !A.lum) return true; x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < A.pw && y < A.ph && A.lum[y * A.pw + x] === 1; }; // (drawn ground there: 30_arena groundSeen)
function bloodMark(x, y, amt, kind) { if (!ARENA || !onStone(x, y)) return; const M = bmap(), i = Math.floor(y / 4) * M.w + Math.floor(x / 4); if (i < 0 || i >= M.a.length) return; M.a[i] = Math.min(255, M.a[i] + amt); M.k[i] = Math.max(0, BK.indexOf(kind)); }
function bloodAt(x, y) { if (!ARENA) return [0, 'red']; const M = bmap(), i = Math.floor(y / 4) * M.w + Math.floor(x / 4); return i < 0 || i >= M.a.length ? [0, 'red'] : [M.a[i], BK[M.k[i]]]; }
// a pool: soft overlapping blotches (as the floor blood has always been), a darker one or two where it is deep
function pool(x, y, kind, size) {
  if (!GORE.level || !ARENA) return; const bl = BLOOD[kind], r = size * 1.6;
  splat(x, y, bl[0], 3 + size * 2, r); if (size >= 2) splat(x, y, bl[2], 1 + size * 0.5, r * 0.4);
  for (let dy = -r; dy <= r; dy += 4) for (let dx = -r; dx <= r; dx += 4) bloodMark(x + dx, y + dy * 0.7, 14, kind);
}

// --- the spray
// n: drops per 12 damage; spread: either side of its line; bias: how far its line turns with the swing; v: speed;
// up: how high it is thrown; clot: the share of heavier 2 px drops
const SPRAY = {
  arc: { n: 6, spread: 0.5, bias: 0.8, v: [50, 130], up: [25, 85], clot: 0.12 }, // a sweep: an arc flung along the swing
  line: { n: 7, spread: 0.15, bias: 0, v: [110, 210], up: [5, 45], clot: 0.05 }, // a thrust: a jet out of the far side
  clot: { n: 4, spread: 0.75, bias: 0.35, v: [40, 105], up: [40, 110], clot: 0.75 }, // an axe: heavy clots
  spurt: { n: 4, spread: 0.4, bias: 0.4, v: [70, 150], up: [15, 50], clot: 0 }, // daggers: quick small spurts
  slam: { n: 8, spread: Math.PI, bias: 0, v: [40, 110], up: [50, 120], clot: 0.35 }, // an overhead slam: all round
  jet: { n: 4, spread: 0.25, bias: 0, v: [80, 150], up: [10, 40], clot: 0 }, // an arrow
  bite: { n: 4, spread: 0.6, bias: 0, v: [40, 100], up: [20, 70], clot: 0.1 }, // a foe's blow
};
// which kind of spray a hero's move throws
function styleOf(h, mv) { return mv.slam ? 'slam' : h.weapon === 'axe' ? 'clot' : mv.k === 'line' ? 'line' : h.weapon === 'daggers' ? 'spurt' : 'arc'; }
function spray(u, d, o = {}) {
  if (!bleeds(u)) return; const kind = u.def.blood || 'red', bl = BLOOD[kind], sc = u.scale || 1, S = SPRAY[o.style] || SPRAY.bite;
  const a0 = o.ang === undefined ? rand(TAU) : o.ang, n = Math.min(44, Math.round(S.n * clamp(d / 12, 0.5, 3.5) * (o.more || 1)));
  for (let i = 0; i < n; i++) {
    const a = a0 + (o.sweep || 1) * S.bias + rand(-S.spread, S.spread), v = rand(S.v[0], S.v[1]) * (o.spd || 1);
    part({ k: 'gore', x: u.x + rand(-2, 2), y: u.y + rand(-1, 1), z: (u.z || 0) + 6 * sc + rand(-3, 3), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, vz: rand(S.up[0], S.up[1]), g: 420, life: 5, s0: chance(Math.max(S.clot, GORE.big)) ? 2 : 1, col: pick(bl), kind, slow: o.slow || 0 });
  }
}
function drip(x, y, z, kind, vx = 0, vy = 0) { if (GORE.level) part({ k: 'gore', x, y, z, vx: vx + rand(-6, 6), vy: vy + rand(-4, 4), vz: rand(-5, 10), g: 420, life: 5, s0: 1, col: pick(BLOOD[kind]), kind }); }
// a drop in flight: it lands as a pixel on the floor, or splashes on the face of a wall it reaches
function goreStep(p, dt) {
  if (p.slow > G.time) dt *= 0.15;
  const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
  if (solidAt(nx, ny)) { if (p.kind !== 'lava' && p.kind !== 'ash') goreWall(p, ny); p.t = p.life; return; }
  p.x = nx; p.y = ny; p.vz -= p.g * dt; p.z += p.vz * dt;
  if (p.z <= 0) { goreLand(p.x, p.y, p); p.t = p.life; }
}
function goreLand(x, y, p) {
  // (into water, open or between a bridge's slats: a ring on it and a little red haze in it instead)
  if (!ARENA) return; if (p.kind === 'lava' || p.kind === 'ash') { magmaLand(x, y, p); return; } /* (a drop of lava, a flake of ash: 42_magma) */ if (holeAt(x, y)) return; /* (down the pit, no mark) */ if (!onStone(x, y)) return; /* (in the black rock, or under a wall's top: no mark) */ if (overWater(x, y)) { plip(x, y); bloodCloud(x, y, p.col, p.s0 === 2 ? 0.6 : 0.2); return; } const r = p.s0 === 2 ? rand(1.2, 2) : rand(0.6, 1.2), a = rand(0.45, 0.8); // a small soft blotch where it lands
  groundPaint(x - 3, y - 3, x + 3, y + 3, g => { g.globalAlpha = a; g.fillStyle = p.col; g.beginPath(); g.ellipse(x, y, r, r * 0.75, 0, 0, TAU); g.fill(); g.globalAlpha = 1; });
  bloodMark(x, y, p.s0 === 2 ? 5 : 2, p.kind);
}
// Blood on the walls, in the floor's soft blotchy style. A drop that strikes a wall leaves a soft splash, a little taller
// than wide as if already sagging; about half of them (nearly every clot) start a run, and one that lands beside a run
// already going feeds it instead of starting another. A run creeps down over 5-7 s, quicker at first and slowing as it
// thins, painted as soft overlapping smudges with a bead of blood at its front; where it reaches the floor it collects
// in a small blotch.
const BTR = []; // the runs going now
function wallSplash(x, y, p) {
  if (!onStone(x, y)) return; // (not on any drawn stone: nothing to splash on)
  const r = p.s0 === 2 ? rand(1.2, 1.9) : rand(0.7, 1.2), a = rand(0.5, 0.85), sat = chance(0.4) ? [x + rand(-2, 2), y + rand(-2, 1), r * 0.5] : null;
  groundPaint(x - 4, y - 4, x + 4, y + 4, g => { g.fillStyle = p.col; g.globalAlpha = a; g.beginPath(); g.ellipse(x + 0.5, y + 0.5, r * 0.85, r * 1.15, 0, 0, TAU); g.fill(); if (sat) { g.globalAlpha = a * 0.7; g.beginPath(); g.ellipse(sat[0], sat[1], sat[2], sat[2] * 1.2, 0, 0, TAU); g.fill(); } g.globalAlpha = 1; });
}
function bloodRun(x, y, end, p, on, T) {
  if (end - y < 2 || !onStone(x, y) || !chance(p.s0 === 2 ? 0.9 : 0.45)) return;
  const near = BTR.find(t => Math.abs(t.x0 - x) <= 1.5 && t.y < end && Math.abs(t.y - y) < 8); if (near) { near.len = Math.min(near.len + 2, near.end - near.y0); return; } // it feeds that run
  if (BTR.length >= 120) return; const len = Math.max(2, Math.round((end - y) * rand(0.55, 1)));
  BTR.push({ x0: x, x, y0: y, y, end, len, k: 0, col: p.col, w: p.s0 === 2 ? 1 : 0.75, T: T * rand(0.85, 1.15), next: G.time + rand(0.2, 0.5), on });
}
// Where a drop meets a wall. The north walls show their face: it splashes where it struck and runs down to the floor.
// The side walls show only a rim along the floor's edge: it splashes on the rim at the height it struck and runs down
// along it. The south walls show only their top edge: it splashes against it.
function goreWall(p, ny) {
  const x0 = p.x + p.vx * 0.016, side = solidAt(x0, p.y) && !solidAt(p.x, p.y);
  if (p.vy < 0 && solidAt(p.x, ny) && !solidAt(p.x, p.y) && !side && p.z > 1 && p.z < 22) {
    const yb = Math.floor(p.y / TS) * TS, x = Math.round(p.x), y = Math.round(yb - p.z);
    wallSplash(x, y, p); bloodRun(x, y + 1, yb - 1, p, null, rand(5, 7)); return;
  }
  if (side && p.z > 1 && p.z < 30) { // the rim of a side wall (the tileset draws its dark edge 4 px past where the stone stops you)
    const east = p.vx > 0, dir = east ? 1 : -1, gy = Math.round(p.y);
    // only where the wall runs beside the floor: struck high near the wall's end, the splash moves down onto it
    // (a wall's end is drawn a few px inside its tile)
    const on = yy => solidAt(x0, yy - 4) && solidAt(x0, yy) && !solidAt(p.x, yy); let y = Math.round(p.y - p.z); while (y < gy && !on(y)) y++;
    if (!on(y)) { goreLand(p.x, p.y, p); return; }
    // on the wall's drawn edge, found from where the stone stops him (a room's wall draws it a few px past that; a
    // corridor's stops him elsewhere in its tile, and a fixed place in the tile put the splash deep in the black rock)
    let xe = Math.round(p.x); for (let k = 0; k < 20 && !solidAt(xe + dir, p.y); k++) xe += dir;
    let x = null; for (let k = 4; k >= 1 && x === null; k--) if (onStone(xe + dir * k, y)) x = xe + dir * k;
    if (x === null) { goreLand(p.x, p.y, p); return; } // (no drawn stone there: it falls at the wall's foot)
    wallSplash(x, y, p); bloodRun(x, y + 1, gy, p, on, rand(3.5, 5)); bloodMark(x, gy, 2, p.kind); return;
  }
  if (p.vy > 0 && solidAt(p.x, ny) && !solidAt(p.x, p.y)) { // the south wall's edge: a splash against it
    const yb = Math.floor(ny / TS) * TS - 1; goreLand(p.x, yb, { ...p, s0: 2 }); return;
  }
  goreLand(p.x, p.y, p); // too high or too low: it falls at the wall's foot
}
function updateBlood() {
  if (!ARENA) return; bmap();
  for (const t of BTR) {
    if (G.time < t.next) continue;
    t.y++; t.k++; if (t.on && !t.on(t.y)) { t.done = true; continue; } // a run stops where its wall does
    if (chance(0.12)) t.x = t.x0 + (t.x === t.x0 ? (chance(0.5) ? 0.5 : -0.5) : 0); // it wanders a little
    const thin = Math.max(0.35, 1 - t.k / (t.len + 4)) * t.w, { x, y, col } = t; if (!onStone(x, y)) { t.done = true; continue; } // (off the drawn stone: it stops)
    groundPaint(x - 2, y - 2, x + 3, y + 3, g => { g.globalAlpha = 0.3 + 0.3 * thin; g.fillStyle = col; g.beginPath(); g.ellipse(x + 0.5, y + 0.5, 0.45 + 0.5 * thin, 0.9, 0, 0, TAU); g.fill(); g.globalAlpha = 1; });
    // quicker at first, slowing as it thins: the steps add up to its T seconds
    t.next = G.time + t.T / t.len * (0.4 + 1.2 * t.k / t.len) * rand(0.7, 1.3);
    if (t.k >= t.len || t.y >= t.end) { // done: what is left collects where it stopped
      t.done = true; const fy = t.y >= t.end ? t.end + 2 : y + 1, r = 0.9 + 0.6 * t.w;
      groundPaint(x - 3, fy - 3, x + 4, fy + 3, g => { g.globalAlpha = 0.55; g.fillStyle = col; g.beginPath(); g.ellipse(x + 0.5, fy, r * 1.2, r * 0.7, 0, 0, TAU); g.fill(); g.globalAlpha = 1; });
    }
  }
  removeIf(BTR, t => t.done);
}
// the bead at the front of each run, drawn live so the run is seen to creep
function drawRuns(c) {
  for (const t of BTR) { c.globalAlpha = 0.9; c.fillStyle = t.col; c.beginPath(); c.ellipse(t.x + 0.5, t.y + 1.2, 0.6 + 0.3 * t.w, 0.9 + 0.2 * t.w, 0, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
}

// --- each frame, for every unit: the badly wounded drip as they go; a hero's blade dries, drips; his feet print
function bloodTick(u, dt) {
  if (u.team === 'hero') { if (u.gore > 0) u.gore = Math.max(0, u.gore - 0.035 * dt); bladeDrip(u, dt); footprints(u); }
  if (u.wetT > 0) wetSteps(u, dt); // soaked by the water elemental
  if (!u.dead && u.def.blood === 'water') waterTrail(u, dt); else if (!u.dead && u.def.blood === 'dust' && u.z > 1) dustTrail(u, dt);
  const dry = u.def.blood === 'straw' || u.def.blood === 'bone' || u.def.blood === 'wood'; // (the badly hurt bloodless leave stalks, chips and leaves)
  if (!(bleeds(u) || dry) || u.hp >= u.maxHp * 0.5 || u.z > 2) { u.bx = u.x; u.by = u.y; return; }
  const d = Math.hypot(u.x - (u.bx === undefined ? u.x : u.bx), u.y - (u.by === undefined ? u.y : u.by)); u.bx = u.x; u.by = u.y;
  u.bd = (u.bd || 0) + d + dt * 3; // still, a wound drips slowly
  if (u.bd > lerp(5, 15, u.hp / (u.maxHp * 0.5)) * (dry ? 1.6 : 1)) { u.bd = 0; if (dry) shedTrail(u); else drip(u.x + rand(-2, 2), u.y + rand(-1, 1), rand(3, 7) * (u.scale || 1), u.def.blood || 'red'); }
}
function bladeDrip(h, dt) {
  if (!GORE.level || !(h.gore > 0.3) || h.dead || !(G.time - (h.tipT || -9) < 0.1)) return;
  h.dripT = (h.dripT || 0) - dt; if (h.dripT > 0) return; h.dripT = lerp(2.4, 0.45, clamp((h.gore - 0.3) / 2.7, 0, 1)) * rand(0.7, 1.3);
  drip(h.tipX, h.y, Math.max(0, h.y - h.tipY), h.goreKind || 'red');
}
function footprints(h) {
  if (!GORE.level || h.dead || h.z > 1) { h.fx = h.x; h.fy = h.y; return; }
  const [amt, kind] = bloodAt(h.x, h.y); if (amt >= 8) { h.fpN = 10; h.fpK = kind; }
  if (h.fx === undefined || !(h.fpN > 0)) { h.fx = h.x; h.fy = h.y; return; }
  if (Math.hypot(h.x - h.fx, h.y - h.fy) < 6) return;
  // a print: the sole (two pixels across the way he walks) and a pixel of heel behind it, fainter with every step
  const a = Math.atan2(h.y - h.fy, h.x - h.fx), side = (h.fpS = -(h.fpS || 1)), x = Math.round(h.x + Math.cos(a + Math.PI / 2) * 1.5 * side), y = Math.round(h.y + Math.sin(a + Math.PI / 2) * 1.2 * side), al = 0.3 + 0.07 * h.fpN, bl = BLOOD[h.fpK];
  const hx = Math.round(x - Math.cos(a) * 2), hy = Math.round(y - Math.sin(a) * 2), across = Math.abs(Math.cos(a)) < 0.7;
  groundPaint(Math.min(x, hx) - 3, Math.min(y, hy) - 3, Math.max(x, hx) + 3, Math.max(y, hy) + 3, g => { g.globalAlpha = al * 0.8; g.fillStyle = bl[0]; g.beginPath(); g.ellipse(x + 0.5, y + 0.5, across ? 1.3 : 0.8, across ? 0.8 : 1.3, 0, 0, TAU); g.fill(); g.globalAlpha = al * 0.6; g.beginPath(); g.ellipse(hx + 0.5, hy + 0.5, 0.7, 0.6, 0, 0, TAU); g.fill(); g.globalAlpha = 1; });
  h.fpN--; h.fx = h.x; h.fy = h.y;
}

// --- blood on a weapon: its blade pixels from the tip down turned the blood's colour (lv 1-3: a third, a half, most of
// the blade), the image then turned just as the clean one is, each turn made when first needed
function bloodyTurn(Wc, kind, lv, a) {
  const key = kind + lv; Wc.bloody = Wc.bloody || {}; let V = Wc.bloody[key];
  if (!V) {
    const I = Wc.img, d = new Uint8ClampedArray(I.d), bl = BLOOD[kind].map(hexRgb), co = Math.cos(Wc.rest), si = Math.sin(Wc.rest), px = [];
    for (let y = 0; y < I.h; y++) for (let x = 0; x < I.w; x++) {
      const i = (y * I.w + x) * 4; if (!d[i + 3] || (d[i] === OUTLINE_RGB[0] && d[i + 1] === OUTLINE_RGB[1] && d[i + 2] === OUTLINE_RGB[2])) continue;
      const s = (x - I.gx) * co + (y - I.gy) * si; if (s < Math.max(2, Wc.tip * 0.35)) continue;
      px.push([i, -s + NOISE[(x * 11 + y * 17) & 1023] * 5, d[i] + d[i + 1] + d[i + 2]]); // from the tip down, in patches
    }
    px.sort((p, q) => p[1] - q[1]);
    for (let k = 0, n = Math.round(px.length * [0, 0.22, 0.42, 0.65][lv]); k < n; k++) { const [i, , lum] = px[k], c = lum > 480 ? bl[1] : lum > 240 ? bl[0] : bl[2]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
    V = Wc.bloody[key] = { I: { w: I.w, h: I.h, d, gx: I.gx, gy: I.gy, R: I.R }, rot: [] };
  }
  return V.rot[a] || (V.rot[a] = turnImg(V.I, a));
}

// --- a bigger foe blown apart: chunks cut from its own pixels, their broken edges raw, bleeding as they fly and where
// they land; they lie a few seconds and fade (no bodies are left)
function gibBurst(u) {
  const m = MOBS[u.spr]; if (!m) return; const kind = u.def.blood || 'red', bl = BLOOD[kind], sc = u.scale || 1, o = u.lastBlow || {}, slow = G.time + GIB_HOLD, dry = DRY.has(kind);
  // the bloodless break into pieces of themselves too, edged with what they are made of; a scarecrow's shed hay as they fly
  const fr = ((u.anim * 9) | 0) % 4, flip = u.face < 0, opt = { away: o.ang === undefined ? null : o.ang, spd: 1.3, flip, edge: dry ? BIT_EDGE[kind] : [bl[1], bl[0], bl[2]], bleed: dry ? null : kind, lie: rand(2.5, 4), slow, hay: kind === 'straw' ? true : kind === 'wood' ? LEAF : null, tick: kind === 'bone' };
  if (kind === 'bone') { shatter(u, 1.5); burstBits(u, o, slow); return; }
  if (kind === 'water') { burstBits(u, o, slow); return; } // water has no pieces: all of it splashes // a skeleton: its bones fly, not chunks of its picture (whose head would be a second skull)
  if (sc !== 1) { const B = bigSprite(u.spr, sc); B.pd = B.pd || pixelData(B.cv); breakSprite(B.pd, B.fx(fr), 0, B.W, B.H, Math.round(u.x) + B.ox, Math.round(u.y - u.z - B.foot), u.y, randi(6, 8), opt); }
  else breakSprite(PIX.mobs, fr * m[1], m[0], m[1], m[2], Math.round(u.x - m[1] / 2), Math.round(u.y - u.z - footOf(u.spr) - 1), u.y, randi(5, 7), opt);
  if (dry) { burstBits(u, o, slow); return; }
  spray(u, 60, { ...o, more: 1.6, slow, spd: 1.2 }); spray(u, 40, { style: 'slam', slow }); pool(u.x, u.y, kind, 2 + sc);
  SFX.gib(panOf(u.x)); shake(0.12); kick(0.03);
}

// --- the hero's death. The killing blow throws a heavy spray; he reels, his weapon flies out of his hand and clatters
// across the floor, he drops to his knees (the upper body a pixel, then two, lower) and falls flat on his back away
// from whoever killed him. Then he bleeds out: a jet of blood with each heartbeat, weaker each time, the beat slowing,
// the pool under him spreading. Killed by a heavy, long-telegraphed blow (a brute's slam; any attack that is a slam or
// winds up 0.8 s or more), with gore at FULL, he is blown apart instead.
function heroFalls(h) {
  const o = h.lastBlow || {}; if (o.ang !== undefined) h.face = Math.cos(o.ang) < 0 ? 1 : -1; // facing his killer, he falls back away
  h.deadT = 0; h.gone = false; h.dropped = false; h.sway = 0; h.vanishT = undefined; h.pale = 0; h.death = { kind: deathKind(h, o) }; // (how he dies: 48_deaths)
  if (bleeds(h) && h.death.kind !== 'acid' && h.death.kind !== 'raised' && h.death.kind !== 'hexed') { spray(h, 60, { ...o, more: 2.2, spd: 1.2 }); SFX.squelch(panOf(h.x), true); }
  if (h.death.kind === 'burst') heroBurst(h, o); else if (h.death.kind === 'acid') acidStart(h); else if (h.death.kind === 'vermin') verminStart(h); else if (h.death.kind === 'behead') beheadStart(h, o); else if (h.death.kind === 'drag') dragStart(h); else if (h.death.kind === 'raised') raisedStart(h, o); else if (h.death.kind === 'bats') batsStart(h); else if (h.death.kind === 'carried') carriedStart(h); else if (h.death.kind === 'looted') lootedStart(h); else if (h.death.kind === 'ragdoll') ragdollStart(h, o); else if (h.death.kind === 'ticks') ticksStart(h); else if (h.death.kind === 'hexed') hexedStart(h, o); // killed by a heavy, long-telegraphed blow (a brute's slam): blown apart
}
function deathPose(u) { // (by the kind of death: 48_deaths)
  if (u.gone) return { gone: true }; const k = u.death ? u.death.kind : 'bleed', t = u.deadT || 0;
  return k === 'lava' ? lavaPose(t, u) : k === 'acid' ? acidPose(t) : k === 'vermin' || k === 'bats' ? verminPose(t) : k === 'behead' ? beheadPose(t) : k === 'drag' ? dragPose(t) : k === 'raised' ? raisedPose(t) : k === 'carried' ? carriedPose(t) : k === 'looted' ? lootedPose(t, u.death) : k === 'ragdoll' ? ragdollPose(t, u.death) : k === 'ticks' ? ticksPose(t) : k === 'hexed' ? hexedPose(t, u.death) : bleedPose(t);
}
function deathTick(h, dt) {
  const k = h.death ? h.death.kind : 'bleed';
  if (k === 'fall') fallTick(h, dt); else if (k === 'lava') lavaDeathTick(h, dt); else if (k === 'bleed') bleedTick(h, dt); else if (k === 'acid') acidTick(h, dt); else if (k === 'vermin') verminTick(h, dt); else if (k === 'behead') beheadTick(h, dt); else if (k === 'drag') dragTick(h, dt); else if (k === 'raised') raisedTick(h, dt); else if (k === 'bats') batsTick(h, dt); else if (k === 'carried') carriedTick(h, dt); else if (k === 'looted') lootedTick(h, dt); else if (k === 'ragdoll') ragdollTick(h, dt); else if (k === 'ticks') ticksTick(h, dt); else if (k === 'hexed') hexedTick(h, dt);
}
// a canvas cropped to its pixels (so a thrown weapon lies on the floor, not above it)
function tight(cv) {
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) return cv; const o = mkCanvas(x1 - x0 + 1, y1 - y0 + 1); o.getContext('2d').drawImage(cv, -x0, -y0); return o;
}
// his weapon out of his hand: it tumbles a quarter turn at a time (bloodied if it was), rings on the stone and lies there
function dropWeapon(h, spd) {
  const Wc = WEAPON[h.spr]; if (!Wc || h.dropped) return; h.dropped = true;
  const gl = h.gore > 0.05 && GORE.level ? Math.min(3, Math.ceil(h.gore)) : 0, turn = a => gl ? bloodyTurn(Wc, h.goreKind || 'red', gl, a) : Wc.rot[a], Q = WEAPON_TURNS / 4;
  const o = h.lastBlow || {}, a = (o.ang === undefined ? rand(TAU) : o.ang) + rand(-0.9, 0.9), v = rand(40, 70) * spd, fs = h.face < 0 ? -1 : 1;
  FX.rocks.push({ rot: [0, Q, 2 * Q, 3 * Q].map(k => tight(turn(k))), r: 0, x: h.x + fs * 4, y: h.y + 1, z: 9, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: rand(60, 90) * spd, spin: 0.08, t: 0, wait: 0, fade: 0, lie: 99, clang: true });
}
// blown apart: chunks of his own body (without the weapon, which flies off on its own), the run's last few seconds
function heroBurst(h, o) {
  const Wc = WEAPON[h.spr], m = MOBS[h.spr]; if (!m) return; const fw = m[1], fh = m[2], slow = G.time + GIB_HOLD;
  const D = Wc ? (Wc.cutPD = Wc.cutPD || pixelData(Wc.cut)) : PIX.mobs;
  dropWeapon(h, 1.6);
  breakSprite(D, 0, Wc ? 0 : m[0], fw, fh, Math.round(h.x - fw / 2), Math.round(h.y - h.z - footOf(h.spr) - 1), h.y, randi(6, 8), { away: o.ang === undefined ? null : o.ang, spd: 1.4, flip: h.face < 0, edge: BLOOD.red, bleed: 'red', lie: 99, slow });
  spray(h, 60, { ...o, more: 1.6, slow, spd: 1.3 }); spray(h, 50, { style: 'slam', slow }); pool(h.x, h.y, 'red', 4);
  h.gone = true; SFX.gib(panOf(h.x)); shake(0.3);
}

// --- a brute's death throes: brought to 0 it does not drop at once. It stops, shaking and lurching, turning this way and
// that; with every beat of its heart blood spurts from its chest, weaker each time, and the pool under it spreads; it
// sinks to its knees and dies. Another blow finishes it at once. Those with no blood shed instead: the scarecrow pours
// hay, a golem crumbles.
function throes(u, src) {
  u.hp = 0; u.act = null; u.tgt = null; u.dying = { t: 0, dur: rand(2.4, 3.2), next: 0.12, lurch: 0.2, src };
  SFX.groan(panOf(u.x)); if (bleeds(u)) spray(u, 40, { ...(u.lastBlow || {}), more: 1.2 }); else if (DRY.has(u.def.blood)) shed(u, 40, { ...(u.lastBlow || {}), more: 1.2, quiet: true });
}
function throesTick(f, dt) {
  const D = f.dying; D.t += dt; f.vx = damp(f.vx, 0, 8, dt); f.vy = damp(f.vy, 0, 8, dt); f.moving = false; f.stun = 0.2; // (shaking)
  if ((D.lurch -= dt) <= 0) { D.lurch = rand(0.25, 0.6); f.kx += rand(-45, 45); f.ky += rand(-25, 25); if (chance(0.45)) f.face = -f.face; }
  if ((D.next -= dt) <= 0) {
    const k = Math.max(0.25, 1 - D.t / D.dur), kind = f.def.blood || 'red', sc = f.scale || 1; D.next = lerp(0.3, 0.65, D.t / D.dur) * rand(0.85, 1.15);
    if (bleeds(f)) {
      for (let i = 0, n = Math.round((8 + 12 * k) * sc); i < n; i++) { const a = rand(TAU), v = rand(15, 55) * k; part({ k: 'gore', x: f.x + rand(-2, 2), y: f.y + rand(-1, 1), z: 11 * sc, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, vz: rand(70, 160) * k, g: 420, life: 5, s0: chance(GORE.big) ? 2 : 1, col: pick(BLOOD[kind]), kind }); }
      pool(f.x + rand(-2, 2), f.y + 1, kind, 1.5 + D.t * 0.9); SFX.squelch(panOf(f.x), k > 0.6);
    } else if (DRY.has(kind)) throesShed(f, k); else debris(f.x, f.y - 6, 5, DUST, 50, 70, 1.4);
  }
  if (D.t >= D.dur) { f.stun = 0; const src = D.src; f.dying = null; kill(f, src); }
}
