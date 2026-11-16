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
// a pool: whole pixels in a rough flattened disc, dark where it is deep, lighter at its edge
function pool(x, y, kind, size) {
  if (!GORE.level || !ARENA) return; const bl = BLOOD[kind], r = size * 1.6, cx = Math.round(x), cy = Math.round(y), R = Math.ceil(r);
  groundPaint(cx - R - 2, cy - R - 2, cx + R + 2, cy + R + 2, g => {
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const e = Math.hypot(dx, dy / 0.7) / r + NOISE[((cx + dx) * 7 + (cy + dy) * 13) & 1023] * 0.3; if (e > 1) continue;
      g.globalAlpha = e < 0.6 ? 0.92 : 0.7; g.fillStyle = e < 0.45 ? bl[2] : bl[0]; g.fillRect(cx + dx, cy + dy, 1, 1);
    }
    g.globalAlpha = 1;
  });
  for (let dy = -R; dy <= R; dy += 4) for (let dx = -R; dx <= R; dx += 4) bloodMark(x + dx, y + dy * 0.7, 14, kind);
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
  if (!ARENA) return; x = Math.round(x); y = Math.round(y); const s = p.s0, h = s === 2 && chance(0.5) ? 2 : 1, a = rand(0.75, 1);
  groundPaint(x - 1, y - 1, x + 3, y + 3, g => { g.globalAlpha = a; g.fillStyle = p.col; g.fillRect(x, y, s, h); g.globalAlpha = 1; });
  bloodMark(x, y, s === 2 ? 5 : 2, p.kind); if (p.quiet) SFX.drip(panOf(x));
}
// the wall to the north shows its face: a drop that reaches it splashes where it struck and runs down to the floor
const BTR = [];
function goreWall(p, ny) {
  if (p.vy < 0 && solidAt(p.x, ny) && !solidAt(p.x, p.y) && p.z > 1 && p.z < 22) {
    const yb = Math.floor(p.y / TS) * TS, x = Math.round(p.x), y = Math.round(yb - p.z);
    groundPaint(x - 1, y - 1, x + 3, y + 3, g => { g.fillStyle = p.col; g.fillRect(x, y, p.s0, p.s0); });
    if (BTR.length < 60) BTR.push({ x, y: y + p.s0 - 1, end: yb - 1, col: p.col, n: randi(3, 16), next: G.time + rand(0.15, 0.4) });
    return;
  }
  goreLand(p.x, p.y, p); // a side wall: it falls at its foot
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
  groundPaint(Math.min(x, hx) - 2, Math.min(y, hy) - 2, Math.max(x, hx) + 3, Math.max(y, hy) + 3, g => { g.globalAlpha = al; g.fillStyle = bl[1]; g.fillRect(x, y, across ? 2 : 1, across ? 1 : 2); g.fillStyle = bl[0]; g.fillRect(hx, hy, 1, 1); g.globalAlpha = 1; });
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
