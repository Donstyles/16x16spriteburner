// ===================== blood =====================
// Every blow that draws blood throws it the way the weapon was going: a sword's sweep flings an arc of drops along the
// swing, a thrust (spear, a finisher, a dagger's stab) shoots a jet out of the far side, an axe throws heavy clots,
// daggers quick spurts, an overhead slam splashes all round. Drops land as pixels painted into the floor; one that
// reaches the face of a wall splashes there and runs down it. Blood gathers on the hero's blade, drips from its tip and
// wears off (a roll wipes some away); stepping in it leaves footprints; the badly wounded leave a trail. A killing blow
// far beyond what one of the bigger foes (not the trash) had left bursts it into chunks of itself, and the moment
// is held: the hero freezes a little longer and the burst starts slowly, then flies.
// GORE.level: 0 off, 1 blood, 2 full (the bursts too); kept on this device.
const GORE = { level: 2 };
try { const v = localStorage.getItem('cr2-gore'); if (v !== null && v !== '') GORE.level = clamp(Math.round(+v) || 0, 0, 2); } catch (e) { /* storage blocked: the default */ }
function setGore(v) { GORE.level = v; try { localStorage.setItem('cr2-gore', String(v)); } catch (e) { /* not kept */ } }
const GORE_NAMES = ['OFF', 'BLOOD', 'FULL'];
const DRY = new Set(['bone', 'metal', 'straw']); // these do not bleed
const DUST = ['#5a5048', '#7d7064', '#3c342e'];
const bleeds = u => GORE.level > 0 && !DRY.has(u.def.blood || 'red');
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const GIB_HOLD = 0.22; // how long a burst is held: the hero frozen, the pieces and spray moving slowly

// --- where blood lies: a coarse map (4 px cells) of how much, and of which kind, so feet can pick it up
const BK = ['red', 'slime', 'bug', 'sludge', 'bone', 'metal', 'straw'];
const BMAP = { A: null, w: 0, a: null, k: null };
function bmap() {
  const A = ARENA; if (BMAP.A !== A) { BMAP.A = A; BMAP.w = Math.ceil(A.w * TS / 4); const n = BMAP.w * Math.ceil(A.h * TS / 4); BMAP.a = new Uint8Array(n); BMAP.k = new Uint8Array(n); BTR.length = 0; }
  return BMAP;
}
function bloodMark(x, y, amt, kind) { if (!ARENA) return; const M = bmap(), i = Math.floor(y / 4) * M.w + Math.floor(x / 4); if (i < 0 || i >= M.a.length) return; M.a[i] = Math.min(255, M.a[i] + amt); M.k[i] = Math.max(0, BK.indexOf(kind)); }
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
    part({ k: 'gore', x: u.x + rand(-2, 2), y: u.y + rand(-1, 1), z: 6 * sc + rand(-3, 3), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, vz: rand(S.up[0], S.up[1]), g: 420, life: 5, s0: chance(S.clot) ? 2 : 1, col: pick(bl), kind, slow: o.slow || 0 });
  }
}
function drip(x, y, z, kind, vx = 0, vy = 0) { if (GORE.level) part({ k: 'gore', x, y, z, vx: vx + rand(-6, 6), vy: vy + rand(-4, 4), vz: rand(-5, 10), g: 420, life: 5, s0: 1, col: pick(BLOOD[kind]), kind, quiet: true }); }
// a drop in flight: it lands as a pixel on the floor, or splashes on the face of a wall it reaches
function goreStep(p, dt) {
  if (p.slow > G.time) dt *= 0.15;
  const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
  if (solidAt(nx, ny)) { goreWall(p, ny); p.t = p.life; return; }
  p.x = nx; p.y = ny; p.vz -= p.g * dt; p.z += p.vz * dt;
  if (p.z <= 0) { goreLand(p.x, p.y, p); p.t = p.life; }
}
function goreLand(x, y, p) {
  if (!ARENA) return; const r = p.s0 === 2 ? rand(1.2, 2) : rand(0.6, 1.2), a = rand(0.45, 0.8); // a small soft blotch where it lands
  groundPaint(x - 3, y - 3, x + 3, y + 3, g => { g.globalAlpha = a; g.fillStyle = p.col; g.beginPath(); g.ellipse(x, y, r, r * 0.75, 0, 0, TAU); g.fill(); g.globalAlpha = 1; });
  bloodMark(x, y, p.s0 === 2 ? 5 : 2, p.kind); if (p.quiet) SFX.drip(panOf(x));
}
const BTR = []; // blood running down walls, a pixel at a time
// Where a drop meets a wall. The north walls show their face: it splashes where it struck and runs down to the floor.
// The side walls show only a rim along the floor's edge: it splashes on the rim at the height it struck and runs down
// along it to the floor. The south walls show only their top edge: it splashes against it.
function goreWall(p, ny) {
  const x0 = p.x + p.vx * 0.016, side = solidAt(x0, p.y) && !solidAt(p.x, p.y);
  if (p.vy < 0 && solidAt(p.x, ny) && !solidAt(p.x, p.y) && !side && p.z > 1 && p.z < 22) {
    const yb = Math.floor(p.y / TS) * TS, x = Math.round(p.x), y = Math.round(yb - p.z);
    groundPaint(x - 1, y - 1, x + 3, y + 3, g => { g.fillStyle = p.col; g.fillRect(x, y, p.s0, p.s0); });
    if (BTR.length < 60) BTR.push({ x, y: y + p.s0 - 1, end: yb - 1, col: p.col, n: randi(3, 16), next: G.time + rand(0.15, 0.4) });
    return;
  }
  if (side && p.z > 1 && p.z < 30) { // the rim of a side wall (the tileset draws its dark edge 4 px past where the stone stops you)
    const east = p.vx > 0, rim = east ? Math.floor(x0 / TS) * TS + 4 : Math.floor(p.x / TS) * TS - 5, x = rim + (east ? -randi(0, 2) : randi(0, 2)), gy = Math.round(p.y), y = Math.round(p.y - p.z), r = p.s0 === 2 ? rand(1.1, 1.7) : rand(0.6, 1.1);
    groundPaint(x - 3, y - 3, x + 3, y + 3, g => { g.globalAlpha = rand(0.6, 0.9); g.fillStyle = p.col; g.beginPath(); g.ellipse(x + 0.5, y + 0.5, r * 0.8, r, 0, 0, TAU); g.fill(); g.globalAlpha = 1; });
    if (BTR.length < 60 && chance(0.6)) BTR.push({ x, y: y + 1, end: gy, col: p.col, n: randi(2, 6), next: G.time + rand(0.15, 0.4) });
    bloodMark(x, gy, 2, p.kind); return;
  }
  if (p.vy > 0 && solidAt(p.x, ny) && !solidAt(p.x, p.y)) { // the south wall's edge: a splash against it
    const yb = Math.floor(ny / TS) * TS - 1; goreLand(p.x, yb, { ...p, s0: 2 }); return;
  }
  goreLand(p.x, p.y, p); // too high or too low: it falls at the wall's foot
}
function updateBlood() {
  if (!ARENA) return; bmap();
  for (const t of BTR) {
    if (G.time < t.next) continue; t.y++; t.n--;
    const { x, y, col } = t; groundPaint(x - 1, y - 1, x + 2, y + 2, g => { g.globalAlpha = 0.85; g.fillStyle = col; g.fillRect(x, y, 1, 1); g.globalAlpha = 1; });
    t.next = G.time + rand(0.06, 0.16) * (1 + (16 - t.n) * 0.1); if (t.y >= t.end || t.n <= 0) t.done = true;
  }
  removeIf(BTR, t => t.done);
}

// --- each frame, for every unit: the badly wounded drip as they go; a hero's blade dries, drips; his feet print
function bloodTick(u, dt) {
  if (u.team === 'hero') { if (u.gore > 0) u.gore = Math.max(0, u.gore - 0.035 * dt); bladeDrip(u, dt); footprints(u); }
  if (!bleeds(u) || u.hp >= u.maxHp * 0.5 || u.z > 2) { u.bx = u.x; u.by = u.y; return; }
  const d = Math.hypot(u.x - (u.bx === undefined ? u.x : u.bx), u.y - (u.by === undefined ? u.y : u.by)); u.bx = u.x; u.by = u.y;
  u.bd = (u.bd || 0) + d + dt * 3; // still, a wound drips slowly
  if (u.bd > lerp(5, 15, u.hp / (u.maxHp * 0.5))) { u.bd = 0; drip(u.x + rand(-2, 2), u.y + rand(-1, 1), rand(3, 7) * (u.scale || 1), u.def.blood || 'red'); }
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
  const m = MOBS[u.spr]; if (!m) return; const kind = u.def.blood || 'red', bl = BLOOD[kind], sc = u.scale || 1, o = u.lastBlow || {}, slow = G.time + GIB_HOLD;
  const fr = ((u.anim * 9) | 0) % 4, flip = u.face < 0, opt = { away: o.ang === undefined ? null : o.ang, spd: 1.3, flip, edge: [bl[1], bl[0], bl[2]], bleed: kind, lie: rand(2.5, 4), slow };
  if (sc !== 1) { const B = bigSprite(u.spr, sc); B.pd = B.pd || pixelData(B.cv); breakSprite(B.pd, fr * B.W, 0, B.W, B.H, Math.round(u.x - B.W / 2), Math.round(u.y - u.z - B.foot), u.y, randi(6, 8), opt); }
  else breakSprite(PIX.mobs, fr * m[1], m[0], m[1], m[2], Math.round(u.x - m[1] / 2), Math.round(u.y - u.z - footOf(u.spr) - 1), u.y, randi(5, 7), opt);
  spray(u, 60, { ...o, more: 1.6, slow, spd: 1.2 }); spray(u, 40, { style: 'slam', slow }); pool(u.x, u.y, kind, 2 + sc);
  SFX.gib(panOf(u.x)); shake(0.12); kick(0.03);
}

// --- the hero's death. The killing blow throws a heavy spray; he reels, his weapon flies out of his hand and clatters
// across the floor, he drops to his knees (the upper body a pixel, then two, lower) and falls flat on his back away
// from whoever killed him. Then he bleeds out: a jet of blood with each heartbeat, weaker each time, the beat slowing,
// the pool under him spreading. A killing blow far past what he had left (with gore at FULL) bursts him apart instead.
function heroFalls(h) {
  const o = h.lastBlow || {}; if (o.ang !== undefined) h.face = Math.cos(o.ang) < 0 ? 1 : -1; // facing his killer, he falls back away
  h.deadT = 0; h.gone = false; h.dropped = false;
  if (bleeds(h)) { spray(h, 60, { ...o, more: 2.2, spd: 1.2 }); SFX.squelch(panOf(h.x), true); }
  if (GORE.level === 2 && (h.overkill || 0) >= 0.18 * h.maxHp) heroBurst(h, o);
}
function deathPose(u) {
  if (u.gone) return { gone: true }; const t = u.deadT || 0;
  return { lie: t > 0.55, dip: t > 0.55 ? 0 : t > 0.42 ? 2 : t > 0.3 ? 1 : 0, jit: t < 0.3 ? (((G.time * 40) | 0) % 2 ? 1 : -1) : 0 };
}
function deathTick(h, dt) {
  const t = h.deadT, p = t - dt, at = s => p < s && t >= s; if (h.gone) return;
  if (at(0.15)) dropWeapon(h, 1);
  if (at(0.55)) { SFX.boom(0.25, panOf(h.x)); shake(0.12); smoke(h.x, h.y, 3, 'dust', 8, 18, 0.8); }
  [0.8, 1.4, 2.1, 2.9, 3.8].forEach((s, i) => {
    if (!at(s)) return; const k = 1 - i * 0.17; SFX.heart(0.5 * k); if (!bleeds(h)) return;
    const fs = h.face < 0 ? -1 : 1, x = h.x - fs * 3, y = h.y; // the wound, about his chest as he lies
    for (let j = 0, n = Math.round(12 * k); j < n; j++) part({ k: 'gore', x: x + rand(-1, 1), y: y + rand(-1, 1), z: 3, vx: rand(-22, 22) * k, vy: rand(-12, 12) * k, vz: rand(55, 115) * k, g: 420, life: 5, s0: chance(0.2) ? 2 : 1, col: pick(BLOOD.red), kind: 'red' });
    pool(x, y + 1, 'red', 2.4 + i * 1.3); // the pool spreads out from under him with every beat
  });
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
