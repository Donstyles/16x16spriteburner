// ===================== THE MAGMA DEPTHS (floors 7 to 9) =====================
// Under the crypt the rock is alive. The floors are built as the cellar's and the crypt's are (30_arena THEMES.magma): the
// grey cellar's pieces in the magma's rock, wood and floor colours (tools/magma_recolor.py), with ElvGames' Magma Dungeon
// sheet drawn over them (crawler/assets/magma.png, tools/magma_sheet.py). What is water above is LAVA here, and so is
// every pit: a hole in a magma floor goes down to lava, not into the dark.
// THE LAVA is the sheet's own lava tile ([2, 18]: sixteen pixels square, a net of bright seams over deep red), alive:
// eight frames in which a slow wave of heat runs through its seams (a seam flares as the wave passes, the red between
// them breathes), the whole drifting a pixel now and then. It is drawn through a mask, pixel for pixel where lava shows:
// a pit's (A.lavaM, kept by 38_pits pitPaint) and each pool's own (p.lm, 36_works). It lights what stands near it and
// glows on the effects' layer, so a room with lava in it is never dark.
const LAVA = { frames: [], N: 8, base: [165, 27, 0], rgb: 'rgb(165,27,0)' };
function magmaSheet(img) {
  const T = TS, c = mkCanvas(T, T), g = c.getContext('2d'); g.drawImage(img, 2 * T, 18 * T, T, T, 0, 0, T, T); const src = g.getImageData(0, 0, T, T).data;
  const HOT = [255, 127, 0], SEAM = [229, 76, 0], DIM = [204, 58, 0], RED = [165, 27, 0], GLOW = [204, 34, 0], DEEP = [142, 20, 0], WHITE = [255, 190, 60];
  for (let f = 0; f < LAVA.N; f++) {
    const cv = mkCanvas(T, T), q = cv.getContext('2d'), id = q.createImageData(T, T), d = id.data;
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const i = (y * T + x) * 4, r = src[i], gg = src[i + 1], seam = gg >= 70, hot = gg >= 120;
      const w = 0.5 + 0.5 * Math.sin(TAU * ((x + 2 * y) / T + f / LAVA.N)), w2 = 0.5 + 0.5 * Math.sin(TAU * ((2 * x - y) / T - f / LAVA.N) + 1.3); // (two waves crossing: both wrap in sixteen pixels)
      let col;
      if (hot) col = w > 0.8 ? WHITE : HOT; else if (seam) col = w > 0.72 ? HOT : w < 0.18 ? DIM : SEAM;
      else col = w2 > 0.86 ? GLOW : w < 0.12 && w2 < 0.3 ? DEEP : r >= 200 ? GLOW : RED;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    q.putImageData(id, 0, 0); LAVA.frames.push(cv);
  }
  // the rim of a pool of lava: the sheet's block of rock ([10..12, 6..8]: a rim of stones round a dark top) with the dark
  // taken out, so the rim stands round whatever lies inside it
  { const R = mkCanvas(3 * T, 3 * T), q = R.getContext('2d'); q.drawImage(img, 10 * T, 6 * T, 3 * T, 3 * T, 0, 0, 3 * T, 3 * T); const id = q.getImageData(0, 0, 3 * T, 3 * T), d = id.data;
    for (let i = 0; i < d.length; i += 4) if (d[i] === 25 && d[i + 1] === 19 && d[i + 2] === 14) d[i + 3] = 0; q.putImageData(id, 0, 0); LAVA.rim = R; }
  return img;
}
// A PIT OF LAVA'S RIM (38_pits pitPaint): along every side of the lava but its north (there the floor's own thickness
// shows, magmaCellar), the sheet's rim of stones, inside the pit's own tile: its west side where floor or wall lies west
// of it, its east side, its south side, the block's own corner pieces where two meet, and a stone in the corner where
// only the floor's corner pokes into the lava
function magmaPitRim(A, g, i) {
  const W = A.w, x = i % W, y = (i / W) | 0, X = x * TS, Y = y * TS, P = j => A.fl[j] === PIT, w = !P(i - 1), e = !P(i + 1), s = !P(i + W), R = LAVA.rim;
  const put = (tx, ty, sx, sy, sw, sh) => g.drawImage(R, tx * TS + sx, ty * TS + sy, sw, sh, X + sx, Y + sy, sw, sh);
  if (s) { if (w) put(0, 2, 0, 0, 8, TS); else put(1, 2, 0, 0, 8, TS); if (e) put(2, 2, 8, 0, 8, TS); else put(1, 2, 8, 0, 8, TS); }
  else { if (w) put(0, 1, 0, 0, 8, TS); if (e) put(2, 1, 8, 0, 8, TS); }
  if (!s && !w && !P(i + W - 1)) put(0, 2, 0, 12, 4, 4); if (!s && !e && !P(i + W + 1)) put(2, 2, 12, 12, 4, 4);
}
// a free block of wall's atlas, as the crypt's (10_assets cryptBlockAtlas): composed on the sheet by tools/magma_sheet.py
function magmaBlockAtlas(img) { const c = mkCanvas(3 * TS, 4 * TS); c.getContext('2d').drawImage(img, 4 * TS, 32 * TS, 3 * TS, 4 * TS, 0, 0, 3 * TS, 4 * TS); return c; }
// the cellar's pieces in the magma's colours, as loaded; its pit faces (the earth under a floor's edge, [10..15, 12]) are
// here the floor's own thickness of rock standing over the lava: the last seven rows of the walls' face, each of the six
// begun at another place along it, and nothing under them (the lava shows)
function magmaCellar(img) {
  const c = mkCanvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0);
  for (let v = 0; v < 6; v++) { const x = (10 + v) * TS, y = 12 * TS, o = (v * 5) % TS; g.clearRect(x, y, TS, TS);
    g.drawImage(IMG.magma, TS + o, 33 * TS + 9, TS - o, 7, x, y, TS - o, 7); if (o) g.drawImage(IMG.magma, TS, 33 * TS + 9, o, 7, x + TS - o, y, o, 7); }
  return c;
}
// THE ROCKS IN THE LAVA (36_works sinkThings: what stands in a pool): the sheet's own, drawn with the lava's glow round
// their feet ([0..7, 22..25]: eight small ones, four spires two tiles tall, four heaps two tiles square). When their
// lava is drained they stand cold: the same rocks from a copy of the sheet with every lava colour gone to dark rock
const LAVA_ROCKS = [[0, 22], [1, 22], [2, 22], [3, 22], [0, 23], [1, 23], [2, 23], [3, 23]].map(t => [t, t, 'stone', 1, 1, 'magma']).concat([4, 5, 6, 7].map(x => [[x, 22], [x, 22], 'stone', 1, 2, 'magma']), [0, 2, 4, 6].map(x => [[x, 24], [x, 24], 'stone', 2, 2, 'magma']));
function magmaCold(img) {
  const c = mkCanvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0); const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] >= 160 && d[i + 2] <= 10 && d[i] > d[i + 1] + 60) { const hot = d[i + 1] >= 100; d[i] = hot ? 56 : 40; d[i + 1] = hot ? 47 : 34; d[i + 2] = hot ? 38 : 28; }
  g.putImageData(id, 0, 0); return c;
}
const MFLOOR = { cracks: [] };
// THE FLOOR: the sheet's pavement ([12..15, 11..15]: twenty tiles on one grid of blocks, so any of them lies beside any
// other), plain, or with lava in its seams. Where the seams burn follows a smooth field over the whole floor (its ridges
// are the veins: long wandering lines of lit tiles, never a scatter), so the cracks read as the lava's own reach under
// the stone. Their light is the lava's (drawMagmaGlow)
function magmaFloor(g, W, H, near, inRoom, rooms, halls) {
  const PL = [[12, 11], [14, 11], [12, 15], [13, 15], [14, 15], [15, 15]], DK = [[12, 13], [13, 13]], CR = [[13, 11], [15, 11], [12, 12], [13, 12], [14, 12], [15, 12], [12, 14], [13, 14], [14, 14], [15, 14]];
  const vein = (x, y) => Math.sin(x * 0.55 + Math.sin(y * 0.37) * 2.1) * Math.cos(y * 0.48 - Math.sin(x * 0.29) * 1.7);
  MFLOOR.cracks = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!near(x, y)) continue; const h = hash2(x, y), h2 = hash2(x + 91, y + 17), v = Math.abs(vein(x, y)), cr = v < 0.07 || (v < 0.13 && h < 0.35);
    const t = cr ? CR[(h2 * CR.length) | 0] : h < 0.14 ? DK[(h2 * 2) | 0] : PL[(h2 * PL.length) | 0];
    g.drawImage(IMG.magma, t[0] * TS, t[1] * TS, TS, TS, x * TS, y * TS, TS, TS); if (cr) MFLOOR.cracks.push(y * W + x);
  }
}
// ---- the lava, drawn
let LVB = null;
function lavaBlit(c, mask, sx, sy, w, h, dx, dy, alpha = 1, add = false) {
  w |= 0; h |= 0; if (w <= 0 || h <= 0 || !LAVA.frames.length) return; if (!LVB) LVB = mkCanvas(64, 64);
  if (LVB.width < w || LVB.height < h) { LVB.width = Math.max(LVB.width, w + 32); LVB.height = Math.max(LVB.height, h + 32); }
  const g = LVB.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, w, h);
  const f = LAVA.frames[((G.time * 5) | 0) % LAVA.N], dr = (G.time * 1.5) | 0, m = v => ((v % TS) + TS) % TS;
  if (!f.pat) f.pat = g.createPattern(f, 'repeat');
  g.save(); g.translate(-m(dx - dr), -m(dy - (dr >> 1))); g.fillStyle = f.pat; g.fillRect(0, 0, w + TS, h + TS); g.restore();
  g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, sx, sy, w, h, 0, 0, w, h); g.globalCompositeOperation = 'source-over';
  c.globalAlpha = alpha; c.drawImage(LVB, 0, 0, w, h, dx, dy, w, h); c.globalAlpha = 1;
}
// a pit's lava: the mask is read off the ground itself (every pixel 38_pits painted in the lava's own red)
function lavaMark(A, g, x0, y0, w, h) {
  if (!A.lavaM) { A.lavaM = mkCanvas(A.pw, A.ph); A.lavaG = A.lavaM.getContext('2d'); }
  // (the ground is one canvas while the floor is built and a grid of chunks after, each drawn in map coordinates: 30_arena groundChunks)
  const k = A.chunks && A.chunks.find(q => q.g === g), bx = k ? k.x : 0, by = k ? k.y : 0, bw = k ? k.w : A.pw, bh = k ? k.h : A.ph;
  const x1 = Math.min(x0 + w, bx + bw), y1 = Math.min(y0 + h, by + bh); x0 = Math.max(bx, x0); y0 = Math.max(by, y0); w = x1 - x0; h = y1 - y0; if (w <= 0 || h <= 0) return;
  const s = g.getImageData(x0 - bx, y0 - by, w, h).data, id = A.lavaG.createImageData(w, h), d = id.data, [r, gg, b] = LAVA.base;
  for (let i = 0; i < s.length; i += 4) if (s[i] === r && s[i + 1] === gg && s[i + 2] === b) { d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = 255; }
  A.lavaG.putImageData(id, x0, y0);
}
function viewRect(A) { const x0 = Math.max(0, PXO.x), y0 = Math.max(0, PXO.y), x1 = Math.min(A.pw, PXO.x + BUF.w), y1 = Math.min(A.ph, PXO.y + BUF.h); return [x0, y0, x1 - x0, y1 - y0]; }
function drawMagma(c, rect) {
  const A = ARENA; if (!isMagma(A)) return; const VR = () => rect ? [Math.max(0, rect[0]), Math.max(0, rect[1]), Math.min(A.pw, rect[0] + rect[2]) - Math.max(0, rect[0]), Math.min(A.ph, rect[1] + rect[3]) - Math.max(0, rect[1])] : viewRect(A);
  if (A.lavaM) { const [x, y, w, h] = VR(); lavaBlit(c, A.lavaM, x, y, w, h, x, y); } if (rect) return; drawLavaDeath(c); drawBombsUnder(c); magmaLights();
  // its light: from every other lava tile in sight (a pit's), and over each pool
  if (A.pitN) { const [x, y, w, h] = viewRect(A), tx0 = Math.floor(x / TS), ty0 = Math.floor(y / TS), tx1 = Math.ceil((x + w) / TS), ty1 = Math.ceil((y + h) / TS);
    for (let ty = ty0 - 2; ty <= ty1 + 2; ty++) for (let tx = tx0 - 2; tx <= tx1 + 2; tx++) { if ((tx & 1) || (ty & 1) || tx < 0 || ty < 0 || tx >= A.w || ty >= A.h || A.fl[ty * A.w + tx] !== PIT) continue; light(tx * TS + 8, ty * TS + 8, 50 + 4 * Math.sin(G.time * 1.7 + tx * 1.3 + ty), 'magma', 0.55); } }
  for (const p of A.pools || []) if (p.level > 0.05) for (const i of p.cells) { const tx = i % A.w, ty = (i / A.w) | 0; if ((tx & 1) || (ty & 1)) continue; light(tx * TS + 8, ty * TS + 8, 50 + 4 * Math.sin(G.time * 1.7 + tx * 1.3 + ty), 'magma', 0.55 * Math.min(1, p.level * 1.5)); }
}
// on the effects' layer (added light): the lava's own glow, breathing, and the floor's burning seams
function drawMagmaGlow(c) {
  const A = ARENA; if (!isMagma(A)) return; const k = 0.26 + 0.07 * Math.sin(G.time * 1.3);
  if (A.lavaM) { const [x, y, w, h] = viewRect(A); lavaBlit(c, A.lavaM, x, y, w, h, x, y, k); }
  for (const p of A.pools || []) if (p.lm && p.level > 0) { const ins = Math.round((1 - p.level) * 6), w = p.cw || p.cv.width, h = p.ch || p.cv.height; lavaBlit(c, p.lm, ins, ins, w - ins * 2, h - ins * 2, p.px0 + ins, p.py0 + ins, k * Math.min(1, p.level * 1.6)); }
  drawBombsGlow(c); drawVentGlow(c); drawVeinGlow(c);
}
function magmaAfter(A) { A.mcr = MFLOOR.cracks; MFLOOR.cracks = []; }

// ===================== into the lava =====================
// Lava takes whoever a blow carries over its edge, as a pit does (feet stop at it: 38_pits). A foe sinks burning and is
// gone, a flare and a column of smoke where it went under. A hero goes in to the waist, a fifth of his life burnt off
// him as a fall would cost, and is thrown back out by the heat of it: up in an arc, trailing fire, down where he last
// stood clear, ON FIRE. Fire on someone (ignite) burns for four seconds, a bite every half second (a fiftieth of a
// hero's life, never his last point; a twentieth of a foe's, and it can kill); a roll puts a hero's out.
// A plunge he cannot pay for is his death by lava (below).
const LAVA_T = { sink: 0.5, toss: 0.6, foe: 1.1, depth: 8 };
const lavaAt = (x, y) => isMagma(ARENA) && (pitAt(x, y) || wetAt(x, y));
function lavaSplash(x, y, k = 1, quiet = false) {
  sparks(x, y, 2, Math.round(16 * k), 'fire', 110 * k, 190 * k); embers(x, y, Math.round(10 * k), 'ember', 60); if (!quiet) glows(x, y, 4, Math.round(6 * k), 'magma', 50, 5 * k, 0.6);
  ring(x, y, 18 * k, 'magma', 0.45, quiet ? 1.5 : 3); if (!quiet) { flashLight(x, y - 4, 90 * k, 'magma', 1.1, 0.55); smoke(x, y, 3, 'dark', 8, 14, 1.2, 22); }
  // gouts thrown up that fall back and spatter: drops of lava as round bright pixels
  for (let i = 0; i < Math.round(9 * k); i++) { const a = rand(TAU), v = rand(20, 70) * k; part({ k: 'gore', x: x + rand(-3, 3), y, z: rand(1, 4), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: rand(70, 150) * k, g: 420, life: 1.4, s0: chance(0.4) ? 2 : 1, col: pick(['#ff7f00', '#e54c00', '#ffaa00', '#ffd060']), kind: 'lava' }); }
  SFX.splash(panOf(x), k > 1.2); SFX.sizzle(panOf(x)); SFX.boom(0.25 * k, panOf(x));
}
// where someone going into the lava at a place goes under: carried on into it, six pixels clear of its rim on every side
// that is not lava (so he sinks in the lava, not in the stones round it)
function lavaSpot(x, y) {
  const A = ARENA, tx = Math.floor(x / TS), ty = Math.floor(y / TS), L = (a, b) => a >= 0 && b >= 0 && a < A.w && b < A.h && (A.fl[b * A.w + a] === PIT || A.fl[b * A.w + a] === 2);
  if (!L(tx, ty)) return [x, y]; const x0 = tx * TS + (L(tx - 1, ty) ? 0 : 7), x1 = tx * TS + TS - (L(tx + 1, ty) ? 0 : 7), y0 = ty * TS + (L(tx, ty - 1) ? 0 : 11), y1 = ty * TS + TS - (L(tx, ty + 1) ? 0 : 5);
  return [clamp(x, x0, Math.max(x0, x1)), clamp(y, Math.min(y0, y1), Math.max(y0, y1))];
}
function lavaPlunge(u) {
  const hero = u.team === 'hero', fatal = hero && u.hp - Math.round(u.maxHp * PIT_DMG) <= 0 && !(TEST.on && TEST.god), big = u.scale > 1.2;
  let to = null; if (hero) { to = u.safe || ARENA.spawn; if (penned(ARENA, to)) to = doorLandingNear(ARENA, to) || ARENA.spawn; }
  const [lx, ly] = lavaSpot(u.x, u.y);
  u.fall = { lava: true, t: 0, T: hero ? (fatal ? LAVA_T.sink : LAVA_T.sink + LAVA_T.toss) : LAVA_T.foe * (big ? 1.3 : 1), x: lx, y: ly, x0: u.x, y0: u.y, spin: 0, fatal, to, h: spritePixels(u.spr).foot * (u.scale || 1) + 3 };
  u.vx = u.vy = u.kx = u.ky = 0; u.act = null; u.sprint = false; u.blocking = false; u.stun = 0; u.fireT = 0; removeIf(FX.nums, n => n.on === u);
  lavaSplash(u.x, u.y, big ? 1.5 : 1);
  if (hero) { shake(0.3); G.hurtFlash = 0.35; if (fatal) SFX.scream(panOf(u.x)); }
}
// while it lasts (38_pits pitsTick): sinking, then (a hero who lives) flying out
function lavaFallTick(u, dt) {
  const F = u.fall, hero = u.team === 'hero';
  if (!hero || F.t < LAVA_T.sink || F.fatal) { // going under: to the waist, or (a foe) all of it
    const e = Math.min(1, F.t / (hero ? LAVA_T.sink : F.T)), in_ = Math.min(1, F.t / 0.16); u.x = F.x0 + (F.x - F.x0) * in_; u.y = F.y0 + (F.y - F.y0) * in_; u.z = in_ < 1 ? 5 * Math.sin(in_ * Math.PI) : -(hero ? LAVA_T.depth * ease((e - 0.16 / LAVA_T.sink) / (1 - 0.16 / LAVA_T.sink)) : F.h * e * e); // (carried on in over the rim, then under)
    if (chance(dt * 30)) glows(u.x + rand(-5, 5), u.y, rand(2, 10), 1, pick(['fire', 'fire2', 'ember']), 10, 3.5, 0.4); if (chance(dt * 14)) embers(u.x, u.y - 4, 1, 'ember', 30);
    if (chance(dt * 8)) smoke(u.x, u.y - 6, 1, 'dark', 5, 8, 0.9, 26); if (chance(dt * 5)) SFX.sizzle(panOf(u.x)); light(u.x, u.y - 4, 60, 'fire', 0.9);
    return;
  }
  const e = Math.min(1, (F.t - LAVA_T.sink) / LAVA_T.toss); if (!F.out) { F.out = true; lavaSplash(F.x, F.y, 0.8); SFX.whoosh(panOf(F.x)); }
  u.x = F.x + (F.to.x - F.x) * e; u.y = F.y + (F.to.y - F.y) * e; u.z = (e < 0.08 ? -LAVA_T.depth * (1 - e / 0.08) : 0) + 34 * 4 * e * (1 - e);
  glows(u.x + rand(-3, 3), u.y, u.z + rand(2, 10), 1, pick(['fire', 'fire2']), 12, 4, 0.45); if (chance(dt * 40)) embers(u.x, u.y - u.z * 0.5, 1, 'ember', 40); if (chance(dt * 20)) smoke(u.x, u.y, 1, 'dark', 4, 6, 0.7, 10); light(u.x, u.y - u.z - 4, 70, 'fire', 1);
}
function lavaOut(u, F) {
  u.fall = null;
  if (u.team !== 'hero') { // burnt up: gone, and all it carried
    u.dead = true; u.hp = 0; u.act = null; u.z = 0; if (!u.raisedBy) G.kills++;
    flashLight(F.x, F.y - 4, 80, 'fire', 1, 0.6); embers(F.x, F.y, 12, 'ember', 50); smoke(F.x, F.y - 4, 5, 'dark', 9, 10, 1.8, 30); glows(F.x, F.y, 6, 5, 'fire', 30, 5, 0.7); SFX.sizzle(panOf(F.x)); SFX.pop(panOf(F.x)); return;
  }
  const dmg = Math.round(u.maxHp * PIT_DMG);
  if (F.fatal) { Object.assign(u, { x: F.x, y: F.y, z: -LAVA_T.depth, dead: true, hp: 0, act: null, stun: 0, deadT: 0, gone: false, dropped: true, sway: 0, pale: 0, death: { kind: 'lava', x: F.x, y: F.y } }); lavaDeathStart(u); return; }
  u.hp = Math.max(1, u.hp - dmg); u.x = F.to.x; u.y = F.to.y; u.z = 0; u.vz = 0; u.vx = u.vy = u.kx = u.ky = 0; u.iframe = 0.8; u.penned = false; u.path = null; u.stun = 0.3; u.dipT = 0.25;
  number(u.x, u.y, headZ(u) + 1, dmg, 'red', false, u); G.hurtFlash = 0.35; shake(0.25); smoke(u.x, u.y, 4, 'dust', 8, 14, 0.8); SFX.stone(panOf(u.x), false); ignite(u, 4);
}
// ---- on fire
function ignite(u, dur = 4) { if (!u || u.dead || u.fall || (u.def && u.def.fireproof)) return; const was = u.fireT > 0; u.fireT = Math.max(u.fireT || 0, dur); if (!was) { u.fireTick = 0.5; SFX.fire(panOf(u.x)); if (u.team === 'hero') textPop(u.x, u.y, headZ(u) + 8, 'ON FIRE', 'fire', false, u); } }
function douse(u) { if (!(u.fireT > 0)) return; u.fireT = 0; smoke(u.x, u.y - 4, 5, 'grey', 7, 14, 0.9, 18); SFX.puff(panOf(u.x)); }
function fireTick(dt) {
  for (const u of G.units) {
    if (!(u.fireT > 0)) continue; if (u.dead || u.fall) { u.fireT = 0; continue; }
    if (u.team === 'hero' && u.act && u.act.k === 'roll' && u.act.t > 0.12) { douse(u); continue; } // (a roll beats it out)
    u.fireT -= dt; const s = u.scale || 1, top = headZ(u) - u.z;
    // the flames on him: tongues rising off his body, sparks, a little smoke, and their light
    for (let i = 0; i < 2; i++) if (chance(dt * 34)) part({ k: 'glow', x: u.x + rand(-4, 4) * s, y: u.y + 0.5, z: u.z + rand(1, top), vx: rand(-4, 4), vy: 0, vz: rand(22, 46), drag: 1.5, life: rand(0.25, 0.5), s0: rand(2.4, 4.2) * s, s1: 0.5, col: pick(['fire', 'fire', 'fire2', 'ember']), a0: 0.9, a1: 0 });
    if (chance(dt * 9)) embers(u.x, u.y - 2, 1, 'ember', 22); if (chance(dt * 4)) smoke(u.x, u.y - 2, 1, 'dark', 4, 6, 0.8, 26);
    light(u.x, u.y - 6, 54 + 6 * noise1(G.time * 9 + u.x), 'fire', 0.85); if (chance(dt * 3)) SFX.crackle(panOf(u.x), 0.8);
    if ((u.fireTick -= dt) > 0) continue; u.fireTick = 0.5;
    if (u.team === 'hero') { const d = Math.min(Math.max(1, Math.round(u.maxHp * 0.02)), Math.max(0, Math.ceil(u.hp) - 1)); if (d > 0 && !(TEST.on && TEST.god)) { u.hp -= d; u.flash = 0.08; number(u.x, u.y, headZ(u) + 1, d, 'fire', false, u); G.hurtFlash = Math.max(G.hurtFlash || 0, 0.12); } }
    else { const d = Math.max(1, Math.round(u.maxHp * 0.05)); u.hp -= d; u.flash = 0.08; number(u.x, u.y, headZ(u) + 1, d, 'fire', false, u); if (u.hp <= 0) { u.hp = 1; u.fireT = 0; hurt(u, 3, null, { fire: true }); } }
    if (u.fireT <= 0) smoke(u.x, u.y - 4, 2, 'dark', 5, 8, 0.8, 20);
  }
}
// ---- TAKEN BY THE LAVA: the hero's death in it. The plunge has him to the waist, burning, and he does not come out. He
// thrashes (short hard jerks, the lava slapping round him), sinking all the while, slowly then faster, charring black
// from the waterline up as the fire climbs him; his head goes under. One hand comes back up, reaching, fingers spread;
// it shakes, holds, blackens, and its fingers curl and crumble into ash on the lava. A last great bubble swells and
// bursts where he was. Then only the lava, a little brighter there for a while, and his weapon lying at the edge.
const LAVAD = { thrash: 2.5, under: 3.2, hand0: 3.7, hand1: 5.3, crumble: 6.1, bubble: 6.9 };
function lavaPose(t, u) { return { lie: false, dip: 0, walk: t < LAVAD.thrash && ((G.time * 9) | 0) % 2 === 0, jit: t < LAVAD.thrash && ((G.time * 26) | 0) % 5 === 0 ? (((G.time * 13) | 0) % 2 ? 1 : -1) : 0 }; }
function lavaDeathStart(h) { h.char = 0; SFX.sizzle(panOf(h.x)); }
function lavaDeathTick(h, dt) {
  const t = h.deadT, p = t - dt, D = h.death, x = D.x, y = D.y, at = v => p < v && t >= v, H = spritePixels(h.spr).foot + 4;
  if (t < LAVAD.under) { // sinking, burning, charring
    const e = Math.min(1, t / LAVAD.under); h.z = -(LAVA_T.depth + (H - LAVA_T.depth) * e * e); h.char = Math.min(0.92, t / 2.6);
    if (t < LAVAD.thrash) { if (chance(dt * 5)) { lavaSplash(x + rand(-6, 6), y + rand(-1, 2), 0.35, true); h.face = -h.face; } if (chance(dt * 2)) shake(0.05); }
    const top = Math.max(2, H + h.z); if (chance(dt * 22)) part({ k: 'glow', x: x + pick([-1, 1]) * rand(2, 5), y: y + 0.5, z: rand(0, top), vx: rand(-3, 3), vy: 0, vz: rand(24, 44), drag: 1.5, life: rand(0.2, 0.4), s0: rand(1.6, 2.8), s1: 0.4, col: pick(['fire', 'ember', 'ember']), a0: 0.75, a1: 0 }); // (tongues of flame at his edges: he is still to be seen in them)
    if (chance(dt * 12)) embers(x, y - 3, 1, 'ember', 30); if (chance(dt * 7)) smoke(x, y - top, 1, 'dark', 6, 8, 1.3, 30); if (chance(dt * 4)) SFX.sizzle(panOf(x)); if (chance(dt * 3)) SFX.crackle(panOf(x), 1);
    light(x, y - 5, 50 + 6 * noise1(G.time * 8), 'fire', 0.5);
  }
  if (at(LAVAD.under)) { h.gone = true; lavaSplash(x, y, 0.6); }
  if (at(LAVAD.hand0)) { lavaSplash(x + 2, y, 0.3); SFX.pop(panOf(x)); }
  if (t >= LAVAD.hand0 && t < LAVAD.crumble) { light(x, y - 3, 46, 'fire', 0.7); if (chance(dt * 6)) part({ k: 'glow', x: x + 2 + rand(-1, 1), y: y + 0.5, z: rand(2, 8), vx: 0, vy: 0, vz: rand(14, 26), drag: 1.5, life: 0.4, s0: 2.4, s1: 0.4, col: pick(['fire', 'ember']), a0: 0.8, a1: 0 }); if (chance(dt * 5)) smoke(x + 2, y - 8, 1, 'dark', 3, 4, 1, 22); }
  if (at(LAVAD.hand1)) SFX.crackle(panOf(x), 1);
  if (at(LAVAD.crumble)) { for (let i = 0; i < 9; i++) part({ k: 'gore', x: x + 2 + rand(-2, 2), y, z: rand(2, 8), vx: rand(-14, 14), vy: rand(-4, 4), vz: rand(-5, 20), g: 160, life: 1.2, s0: 1, col: pick(['#1a120d', '#2a1d16', '#3c2a20', '#0c0806']), kind: 'ash' }); smoke(x + 2, y - 5, 2, 'dark', 4, 5, 1.2, 14); SFX.puff(panOf(x)); }
  if (t >= LAVAD.crumble && t < LAVAD.bubble && chance(dt * 9)) plipLava(x + rand(-5, 5), y + rand(-2, 2));
  if (at(LAVAD.bubble)) { lavaSplash(x, y, 1.2); shake(0.12); }
  if (t >= LAVAD.bubble) light(x, y - 2, 60 * Math.max(0, 1 - (t - LAVAD.bubble) / 3), 'magma', 0.8);
}
function plipLava(x, y) { ring(x, y, 4, 'magma', 0.35, 1.5, 1); glows(x, y, 1, 1, 'fire2', 4, 2.5, 0.3); }
// the hand, and the bubble swelling: drawn on the lava, under everyone (drawMagma)
const HAND = ['.x.x.x.', '.x.x.x.', 'xx.x.xx', 'xxxxxxx', '.xxxxx.', '..xxx..', '..xxx..', '..xxx..'], FIST = ['.......', '.......', '..x.x..', '.xxxxx.', '.xxxxx.', '..xxx..', '..xxx..', '..xxx..'];
function drawLavaDeath(c) {
  for (const h of G.heroes) {
    if (!h.dead || !h.death || h.death.kind !== 'lava') continue; const t = h.deadT || 0, D = h.death, x = Math.round(D.x) - 1, y = Math.round(D.y);
    if (t >= LAVAD.hand0 && t < LAVAD.crumble) {
      const up = Math.min(1, (t - LAVAD.hand0) / 0.35), k = Math.min(1, Math.max(0, (t - LAVAD.hand0 - 0.5) / (LAVAD.hand1 - LAVAD.hand0 - 0.5))), curl = t >= LAVAD.hand1, shape = curl ? FIST : HAND, n = Math.round(8 * up) - (curl ? Math.round(3 * (t - LAVAD.hand1) / (LAVAD.crumble - LAVAD.hand1)) : 0);
      const sk = [226, 172, 132], ch = [22, 14, 10], col = sk.map((v, i) => Math.round(v + (ch[i] - v) * k)), jx = !curl && ((G.time * 24) | 0) % 4 === 0 ? 1 : 0;
      for (let r = 0; r < n; r++) { const row = shape[r]; for (let q = 0; q < 7; q++) if (row[q] === 'x') { const hot = r >= n - 2 && k < 0.8; c.fillStyle = hot ? '#ff9a2e' : `rgb(${col[0]},${col[1]},${col[2]})`; c.fillRect(x + q + jx, y - n + r + 1, 1, 1); } }
    }
    if (t >= LAVAD.crumble + 0.3 && t < LAVAD.bubble) { const e = (t - LAVAD.crumble - 0.3) / (LAVAD.bubble - LAVAD.crumble - 0.3), r = Math.round(1 + 4 * e); c.fillStyle = '#ff7f00'; pxEllipse(c, x + 3, y - 1, r, Math.max(1, Math.round(r * 0.6))); c.fillStyle = '#ffd060'; c.fillRect(x + 3 - Math.max(0, r - 2), y - 1 - Math.max(0, Math.round(r * 0.6) - 1), Math.max(1, r - 1), 1); }
  }
}
function magmaTick(dt) { fireTick(dt); bombsTick(dt); magmaAmbient(dt); bossTick(dt); }
// where a thrown drop of lava comes down: back into the lava with a ring, or on the floor, where it burns a black speck
// into the stone and glows a moment as it cools; a flake of ash leaves a grey speck
function magmaLand(x, y, p) {
  if (lavaAt(x, y)) { if (p.kind === 'lava') plipLava(x, y); return; } if (!onStone(x, y)) return; const X = Math.round(x), Y = Math.round(y), s = p.s0 === 2 ? 2 : 1;
  groundPaint(X - 1, Y - 1, X + 3, Y + 3, g => { g.fillStyle = p.kind === 'lava' ? 'rgba(34,20,13,0.5)' : 'rgba(20,14,11,0.45)'; g.fillRect(X, Y, 1, 1); });
  if (p.kind === 'lava') part({ k: 'glow', x: X + 0.5, y: Y + 0.5, z: 0.5, vx: 0, vy: 0, vz: 0, life: rand(0.5, 1.1), s0: 2.2 * s, s1: 0.6, col: 'ember', a0: 0.9, a1: 0 });
}

// ===================== THE LAVA SPITS =====================
// Lava throws rocks. In a room with lava in it (a pit's or a pool's), while a hero is there, a bubble swells on the
// lava near him every few seconds (a bright dome growing for six tenths of a second, a rumble), bursts, and throws a
// lump of burning rock in a high arc: one on the seventh floor, one or two on the eighth, two or three on the ninth.
// Three in five are thrown at where he is going, the rest at the floor round the lava. Where each will land is marked
// from the moment it leaves the lava, the way a foe's heavy blow is (a red ring on the floor, closing), for the 1.2
// seconds it flies; its shadow runs under it. It bursts where it lands: whoever stands in the ring, hero or foe, is
// hurt, thrown back and set on fire; the floor is cracked and scorched there and the cracks glow till they cool. No
// guard stops it; a roll through it does. One that comes down in lava only splashes.
const BOMB = { swell: 0.6, fly: 1.2, r: 12, gap: [2.6, 4.6], reach: 150, arc: 52 };
const BOMB_ART = ['..oOOo..', '.oO##Oo.', 'oO#rr#Oo', 'O#rRRr#O', 'O##Rrr#O', 'oO#rr#Oo', '.oO##Oo.', '..oOOo..'], BOMB_COL = { o: '#e54c00', O: '#ff7f00', '#': '#38302a', r: '#5b4d3f', R: '#ffbe3c' };
let BOMB_CV = null;
function bombArt() { if (BOMB_CV) return BOMB_CV; BOMB_CV = [0, 1, 2, 3].map(k => { const cv = mkCanvas(8, 8), g = cv.getContext('2d'); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const [sx, sy] = k === 0 ? [x, y] : k === 1 ? [y, 7 - x] : k === 2 ? [7 - x, 7 - y] : [7 - y, x], ch = BOMB_ART[sy][sx]; if (ch !== '.') { g.fillStyle = BOMB_COL[ch]; g.fillRect(x, y, 1, 1); } } return cv; }); return BOMB_CV; }
function lavaTilesOf(A, r) { if (r.lavaT && r.lavaV === (A.flv || 0)) return r.lavaT; const L = []; for (let y = r.fy0; y <= r.fy1; y++) for (let x = r.fx0; x <= r.fx1; x++) { const v = A.fl[y * A.w + x]; if (v === PIT || v === 2) L.push(y * A.w + x); } r.lavaT = L; r.lavaV = A.flv || 0; return L; }
function bombTarget(A, r, sx, sy, h) {
  for (let k = 0; k < 14; k++) { let tx, ty;
    if (k < 5 && chance(0.6)) { tx = h.x + h.vx * 0.6 + rand(-12, 12); ty = h.y + h.vy * 0.6 + rand(-9, 9); } else { const a = rand(TAU), d = rand(38, 100); tx = sx + Math.cos(a) * d; ty = sy + Math.sin(a) * d * 0.8; }
    if (roomAt(tx, ty) !== r || !FLOOR(A.fl[footTile(tx, ty)]) || Math.hypot(tx - sx, ty - sy) < 26 || solidAt(tx, ty - 4)) continue; return [tx, ty]; }
  return null;
}
function bombsTick(dt) {
  const A = ARENA; if (!isMagma(A)) return; if (!A.bombs) { A.bombs = []; A.erupt = []; } if (G.cine) return; const W = A.w;
  for (const h of G.heroes) {
    if (h.dead || h.fall || h.enter) continue; const r = roomAt(h.x, h.y); if (!r || r.kind === 'shop' || r.noBombs) continue; const L = lavaTilesOf(A, r); if (!L.length) continue;
    if (r.bombT === undefined) r.bombT = rand(1.6, 3); if ((r.bombT -= dt) > 0) continue; r.bombT = rand(BOMB.gap[0], BOMB.gap[1]) * (A.floor >= 9 ? 0.75 : 1);
    const near = L.map(i => [Math.hypot((i % W) * TS + 8 - h.x, ((i / W) | 0) * TS + 9 - h.y), i]).sort((a, b) => a[0] - b[0]).slice(0, 8), [d, i] = pick(near); if (d > BOMB.reach) continue;
    const [sx, sy] = lavaSpot((i % W) * TS + 8, ((i / W) | 0) * TS + 9); A.erupt.push({ x: sx, y: sy, t: 0, n: A.floor >= 9 ? randi(2, 3) : A.floor >= 8 ? randi(1, 2) : 1, r, h }); if (dist(h.x, h.y, sx, sy) < 220) SFX.groan(panOf(sx));
  }
  for (const e of A.erupt) {
    e.t += dt; light(e.x, e.y - 2, 40 + 50 * e.t, 'fire', 0.5 + e.t); if (chance(dt * 16)) plipLava(e.x + rand(-5, 5), e.y + rand(-3, 3));
    if (e.t < BOMB.swell) continue; e.done = true; lavaSplash(e.x, e.y, 0.9); shake(0.08);
    for (let k = 0; k < e.n; k++) { const T = bombTarget(A, e.r, e.x, e.y, e.h); if (!T) continue; A.bombs.push({ x0: e.x, y0: e.y, x1: T[0], y1: T[1], x: e.x, y: e.y, z: 0, t: 0, wait: k * 0.22, T: BOMB.fly, rot: randi(0, 3), spin: 0 }); }
  }
  removeIf(A.erupt, e => e.done);
  for (const b of A.bombs) {
    if (b.wait > 0) { b.wait -= dt; continue; } if (!b.told) { b.told = true; teleg(b.x1, b.y1, BOMB.r, b.T, 'red'); SFX.whoosh(panOf(b.x0)); }
    b.t += dt; const u = Math.min(1, b.t / b.T); b.x = b.x0 + (b.x1 - b.x0) * u; b.y = b.y0 + (b.y1 - b.y0) * u; b.z = 4 * (BOMB.arc + Math.hypot(b.x1 - b.x0, b.y1 - b.y0) * 0.12) * u * (1 - u);
    if ((b.spin -= dt) <= 0) { b.spin = 0.07; b.rot = (b.rot + 1) % 4; }
    if (chance(dt * 34)) part({ k: 'glow', x: b.x + rand(-2, 2), y: b.y, z: b.z + rand(1, 5), vx: rand(-6, 6), vy: 0, vz: rand(-6, 10), drag: 2, life: rand(0.25, 0.5), s0: rand(2.2, 3.6), s1: 0.4, col: pick(['fire', 'fire2', 'ember']), a0: 0.85, a1: 0 });
    if (chance(dt * 14)) smoke(b.x, b.y - b.z * 0.02, 1, 'dark', 3, 3, 0.6, 4); light(b.x, b.y - b.z, 44, 'fire', 0.8);
    if (u >= 1) { b.done = true; bombLand(A, b); }
  }
  removeIf(A.bombs, b => b.done);
}
function bombLand(A, b) {
  const x = b.x1, y = b.y1; if (lavaAt(x, y)) { lavaSplash(x, y, 0.8); return; }
  for (const u of G.units) { if (u.dead || u.fall || u.under || (u.fly && u.team === 'foe')) continue; const dx = u.x - x, dy = (u.y - y) * 1.35, d = Math.hypot(dx, dy); if (d > BOMB.r + u.r * 0.5) continue;
    const a = d > 1 ? Math.atan2(u.y - y, u.x - x) : rand(TAU); if (hurt(u, 12 + A.floor * 1.5, { x, y: y + 2, team: 'trap', def: {} }, { ranged: true, unblockable: true, poise: 40, kx: Math.cos(a) * 210, ky: Math.sin(a) * 160, fire: true, ang: a }) > 0 || u.iframe <= 0) { if (!(u.iframe > 0)) ignite(u, 2.5); } }
  flashLight(x, y - 3, 96, 'fire', 1.2, 0.5); ring(x, y, 20, 'fire', 0.35, 3); sparks(x, y, 3, 16, 'fire', 150, 170); embers(x, y, 8, 'ember', 60); smoke(x, y, 4, 'dark', 9, 16, 1.3, 20);
  debris(x, y, 7, ['#38302a', '#5b4d3f', '#473c31', '#e54c00'], 110, 150, 1.6); cracks(x, y, 4, 6, 220, 3); scorch(x, y, 11, 0.5);
  for (let i = 0; i < 6; i++) { const a = rand(TAU), v = rand(20, 60); part({ k: 'gore', x, y, z: 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: rand(60, 130), g: 420, life: 1.4, s0: 1, col: pick(['#ff7f00', '#e54c00', '#ffaa00']), kind: 'lava' }); }
  SFX.boom(0.45, panOf(x)); SFX.crack(panOf(x)); if (G.me && dist(G.me.x, G.me.y, x, y) < 120) shake(0.16);
}
// under everyone (drawMagma): the bubble swelling on the lava, and each rock's shadow on the floor
function drawBombsUnder(c) {
  const A = ARENA; if (!A.bombs) return;
  for (const e of A.erupt) { const k = Math.min(1, e.t / BOMB.swell), r = Math.round(2 + 5 * k), ry = Math.max(1, Math.round(r * 0.6)), X = Math.round(e.x), Y = Math.round(e.y); c.fillStyle = '#ff7f00'; pxEllipse(c, X, Y - 1, r, ry); c.fillStyle = '#ffbe3c'; pxEllipse(c, X, Y - 1 - Math.round(k * 1.5), Math.max(1, r - 2), Math.max(1, ry - 1)); c.fillStyle = '#fff0b0'; c.fillRect(X - 1, Y - ry - Math.round(k), 2, 1); }
  for (const b of A.bombs) { if (b.wait > 0 || !onStone(b.x, b.y)) continue; const k = 1 - Math.min(1, b.z / 70); c.fillStyle = `rgba(0,0,0,${(0.18 + 0.22 * k).toFixed(2)})`; pxEllipse(c, Math.round(b.x), Math.round(b.y), Math.round(2 + 2 * k), 1); }
}
// over everyone standing (70_render, before the ceiling): the rocks in the air
function drawMagmaOver(c) {
  const A = ARENA; if (!isMagma(A) || !A.bombs) return; const R = bombArt();
  for (const b of A.bombs) if (!(b.wait > 0)) c.drawImage(R[b.rot], Math.round(b.x) - 4, Math.round(b.y - b.z) - 7);
}
function drawBombsGlow(c) { const A = ARENA; if (!A.bombs) return; for (const b of A.bombs) if (!(b.wait > 0)) { c.fillStyle = 'rgba(255,120,20,0.5)'; pxEllipse(c, Math.round(b.x), Math.round(b.y - b.z) - 3, 5, 5); } }
// ---- THE FIRE VENTS: the magma's spike traps (36_works spikeHalls: a field of them across a corridor, on a beat, and
// the gate of spikes a puzzle lowers). Where the cellar has holes with iron in them the magma has vents: each a hole
// in the floor with fire under it. Before they blow the holes glow and spit sparks (the last half second); then a jet of
// flame stands in each for the spikes' beat, and whoever is over one is burnt, thrown off the field and set on fire.
function ventFlame(c, x, y, h, seed) {
  for (let i = -3; i <= 3; i++) { const k = 1 - Math.pow(Math.abs(i) / 3.6, 1.6), hh = Math.max(1, Math.round(h * k * (0.72 + 0.28 * Math.sin(G.time * 23 + i * 1.9 + seed)))), X = x + i;
    c.fillStyle = '#e54c00'; c.fillRect(X, y - hh, 1, hh); const m = Math.round(hh * 0.68); c.fillStyle = '#ff9a2e'; c.fillRect(X, y - m, 1, m); if (Math.abs(i) <= 1) { const w = Math.round(hh * 0.4); c.fillStyle = '#ffe6a0'; c.fillRect(X, y - w, 1, w); } }
}
function drawVent(c, s, f) {
  const t = (G.time + s.ph) % SPIKE_T, warn = !s.gate && t > 1.05 && t < 1.55, X = Math.round(s.x), Y = Math.round(s.y) + 3; sheetTile(c, s.tile, s.x - 8, s.y - 8, 0, 0);
  c.fillStyle = f || warn ? '#ff7f00' : '#7a2408'; c.fillRect(X - 2, Y - 1, 4, 2); c.fillStyle = f || warn ? '#ffbe3c' : '#a8320a'; c.fillRect(X - 1, Y - 1, 2, 1); // (the fire down the hole)
  if (f === 1) { ventFlame(c, X, Y, 19, s.x * 0.37 + s.y); light(s.x, s.y - 8, 56, 'fire', 0.9); }
  else if (f) { ventFlame(c, X, Y, f === 3 ? 6 : 11, s.x * 0.37 + s.y); light(s.x, s.y - 3, 34, 'fire', 0.6); }
  else if (warn) { light(s.x, s.y, 22 + 30 * (t - 1.05), 'fire', 0.5); if (chance(0.25)) part({ k: 'spark', x: s.x + rand(-2, 2), y: s.y + 3, z: 1, vx: rand(-14, 14), vy: rand(-6, 6), vz: rand(40, 90), g: 380, drag: 1.2, bounce: 0.3, life: rand(0.2, 0.45), col: 'fire' }); }
}
function drawVentGlow(c) { const A = ARENA; for (const s of A.spikes || []) { const f = spikeFrame(s); if (!f) continue; c.fillStyle = 'rgba(255,130,30,0.35)'; pxEllipse(c, Math.round(s.x), Math.round(s.y) - (f === 1 ? 6 : 1), 4, f === 1 ? 9 : 4); } }
// ---- the lava's own life: embers rising off it, a bubble bursting now and then (in the rooms the heroes are in)
function magmaAmbient(dt) {
  const A = ARENA; if (!isMagma(A)) return;
  for (const h of G.heroes) { const r = h.dead ? null : roomAt(h.x, h.y); if (!r) continue; const L = lavaTilesOf(A, r); if (!L.length) continue; const n = Math.min(7, L.length * 0.06);
    if (chance(dt * n)) { const i = pick(L); part({ k: 'ember', x: (i % A.w) * TS + rand(2, 14), y: ((i / A.w) | 0) * TS + rand(4, 14), z: 1, vx: rand(-8, 8), vy: rand(-3, 3), vz: rand(18, 60), drag: 1.2, life: rand(1, 2.4), s0: rand(1, 1.8), s1: 0.3, col: 'ember' }); }
    if (chance(dt * n * 0.3)) { const i = pick(L), x = (i % A.w) * TS + rand(3, 13), y = ((i / A.w) | 0) * TS + rand(6, 13); if (lavaAt(x, y)) { plipLava(x, y); if (chance(0.3) && dist(h.x, h.y, x, y) < 110) SFX.pop(panOf(x)); } } }
}

// ===================== THE MAGMA'S ARMIES =====================
// THE DEMON HORDE (once of the deep below) and THE CINDER COURT hold the magma depths (53_foes ARMIES, ZONES). The court
// is the magma's own: fire elementals for its rank and file (fire that walks: it bleeds sparks, lights its way, and its
// touch sets alight), mages and novices who throw balls of fire (as the demons' crimson imps do now: 55_spells), golems
// of black glass, lava ants underfoot and a brass dragon's whelp on the flank. What is made of fire, or bred in it, does
// not burn and cannot be thrown into the lava.
function emberShed(u, k, way, z0) {
  for (let i = 0, n = Math.min(40, Math.round(9 * k)); i < n; i++) { const a = way(), v = rand(30, 110); part({ k: 'spark', x: u.x + rand(-2, 2), y: u.y, z: z0 + rand(-3, 3), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, vz: rand(30, 120), g: 380, drag: 1.2, bounce: 0.4, life: rand(0.3, 0.8), col: 'fire' }); }
  glows(u.x, u.y, z0, Math.max(1, Math.round(2 * k)), 'fire', 40, 4, 0.45);
}
function emberRemains(u, pan) { // it goes out: a burst of sparks, a gust of smoke, and a scorched place where it stood
  const sc = u.scale || 1; emberShed(u, 5 * sc, () => rand(TAU), 8 * sc); embers(u.x, u.y, Math.round(14 * sc), 'ember', 60); flashLight(u.x, u.y - 5, 70 * sc, 'fire', 1, 0.4); smoke(u.x, u.y - 4, Math.round(5 * sc), 'dark', 9, 14, 1.4, 24); scorch(u.x, u.y, 8 * sc, 0.45); SFX.puff(pan); SFX.sizzle(pan);
}
function emberTrail(u, dt) { // alight as it goes: tongues of flame off it, an ember now and then, and its own light
  if (!foeShown(u)) return; const sc = u.scale || 1; light(u.x, u.y - 6 * sc, 46 * sc + 4 * noise1(G.time * 8 + u.id), 'fire', 0.7);
  if (chance(dt * 16)) part({ k: 'glow', x: u.x + rand(-4, 4) * sc, y: u.y + 0.5, z: (u.z || 0) + rand(3, 13) * sc, vx: rand(-3, 3), vy: 0, vz: rand(16, 34), drag: 1.5, life: rand(0.25, 0.45), s0: rand(1.8, 3) * sc, s1: 0.4, col: pick(['fire', 'fire2', 'ember']), a0: 0.7, a1: 0 });
  if (chance(dt * 2.5)) embers(u.x, u.y - 3, 1, 'ember', 16);
}

// ===================== WHAT STANDS IN THE MAGMA'S ROOMS =====================
// LAVA IN THE WALLS: here and there along a north wall, and on the faces of the blocks standing in a room, the rock is
// shot through with lava: the sheet's veined face ([25..30, 10..11]), its burning seams only, laid over the wall's own
// stones two to five tiles at a stretch. They glow (drawMagmaGlow) and light the floor at the wall's foot.
function magmaVeins() {
  if (LAVA.veins) return LAVA.veins; const c = mkCanvas(6 * TS, 2 * TS), g = c.getContext('2d'); g.drawImage(IMG.magma, 25 * TS, 10 * TS, 6 * TS, 2 * TS, 0, 0, 6 * TS, 2 * TS); const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) if (!(d[i] >= 160 && d[i + 2] <= 40 && d[i] > d[i + 1] + 50)) d[i + 3] = 0; g.putImageData(id, 0, 0); return (LAVA.veins = c);
}
// (x, y: the wall's face tile; its top stands in the tile above, the face's first rows in that tile's lower half)
function magmaVein(A, g, x, y, k) {
  const V = magmaVeins(), sx = (((k % 6) + 6) % 6) * TS; g.drawImage(V, sx, 8, TS, 8, x * TS, (y - 1) * TS + 8, TS, 8); g.drawImage(V, sx, TS, TS, TS, x * TS, y * TS, TS, TS);
  (A.veins = A.veins || []).push({ x: x * TS, y: (y - 1) * TS + 8, sx });
}
function magmaWall(A, r, g, used) {
  if (r.kind === 'shop') return;
  for (let x = r.ix0 + 1; x < r.ix1 - 1; x++) {
    if (!chance(0.14)) continue; const n = randi(2, 5), k0 = randi(0, 5); let ok = true; for (let i = 0; i < n; i++) if (x + i >= r.ix1 || used.has(x + i) || !plainWall(A, x + i, r.fy0 + 1)) ok = false; if (!ok) continue;
    for (let i = 0; i < n; i++) { magmaVein(A, g, x + i, r.fy0 + 1, k0 + i); used.add(x + i); } x += n + 1;
  }
}
// THE ROCKS: the sheet's boulders, spires and heaps ([16..23, 11..15]) and their twins veined with lava ([20..31, 11..15]),
// standing where the cellar keeps its crates: a few in each corner with a pot or two among them (the pots break, the
// rocks never), a rank of spires along the north wall of one room in three; and, a free room in five, THE STONE FOREST:
// spires and boulders standing all over the floor in staggered ranks with lanes between, cover from whatever is thrown.
// Pebbles lie about on every floor ([16..23, 9..10], painted in). A veined rock glows.
const MROCK = { one: [[16, 11], [17, 11], [18, 11], [19, 11], [16, 12], [17, 12], [18, 12], [19, 12], [16, 13], [17, 13], [18, 13], [19, 13]], oneV: [[20, 11], [21, 11], [22, 11], [23, 11], [24, 12], [25, 12], [26, 12], [27, 12], [24, 13], [25, 13], [26, 13], [27, 13]],
  spire: [[20, 12], [21, 12], [20, 14], [21, 14]], spireV: [[28, 12], [29, 12], [28, 14], [29, 14]], big: [[22, 12], [22, 14], [16, 14], [18, 14]], bigV: [[30, 12], [30, 14], [24, 14], [26, 14]] };
function magmaRock(prop, kind, tx, ty, hot) {
  const v = hot ? 'V' : '';
  if (kind === 'big') prop('stone', tx + 0.5, ty, { sheet: 'magma', tile: pick(MROCK['big' + v]), tw: 2, th: 2, r: 9, glow: hot, rock: true });
  else if (kind === 'spire') prop('stone', tx, ty, { sheet: 'magma', tile: pick(MROCK['spire' + v]), th: 2, r: 5, glow: hot, rock: true });
  else prop('stone', tx, ty, { sheet: 'magma', tile: pick(MROCK['one' + v]), r: 5, glow: hot, rock: true });
}
function magmaDress(A, r, g, prop, nearDoor, free) {
  const W = A.w, F = (x, y) => FLOOR(A.fl[y * W + x]), hot = () => chance(0.3);
  // pebbles
  for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) if (A.fl[y * W + x] === 1 && hash2(x * 7 + 3, y * 13 + A.floor) < 0.09) { const k = (hash2(x + 40, y + 9) * 16) | 0; g.drawImage(IMG.magma, (16 + (k & 7)) * TS, (9 + (k >> 3)) * TS, TS, TS, x * TS, y * TS, TS, TS); }
  if (r.kind === 'shop') return;
  const corner = (cx, cy) => { for (let i = 0; i < randi(1, 3); i++) { const tx = clamp(cx + randi(-1, 1), r.ix0, r.ix1), ty = clamp(cy + randi(-1, 1), r.iy0, r.iy1); if (nearDoor(tx, ty) || !free(tx * TS + 8, ty * TS + 14) || !F(tx, ty)) continue; const k = Math.random();
    if (k < 0.3) prop('barrel', tx, ty, { tile: pick(FURN.pot), th: 1, hp: 40 }); else magmaRock(prop, k < 0.5 && ty > r.iy0 ? 'spire' : 'one', tx, ty, hot()); } };
  corner(r.ix0, r.iy0); corner(r.ix1, r.iy0); corner(r.ix0, r.iy1); corner(r.ix1, r.iy1);
  const plain = r.kind === 'room' && !r.pool && !r.shrine && !r.set && !r.puz && !r.pit && !r.chest && !r.sluice;
  if (plain && !r.shape && r.w >= 11 && r.h >= 8 && chance(0.2)) { // THE STONE FOREST
    r.forest = true; (A.themes = A.themes || []).push('THE STONE FOREST'); const doorCols = r.doors.filter(d => d.side === 'N' || d.side === 'S').flatMap(d => d.cells.map(c => c[0])), doorRows = r.doors.filter(d => d.side === 'E' || d.side === 'W').flatMap(d => d.cells.map(c => c[1]));
    for (let y = r.iy0 + 2, j = 0; y <= r.iy1 - 1; y += 2, j++) for (let x = r.ix0 + 1 + (j % 2) * 2; x <= r.ix1 - 1; x += 4) {
      if (doorCols.includes(x) || doorRows.includes(y) || nearDoor(x, y, 2) || !F(x, y) || !free(x * TS + 8, y * TS + 14, 14) || chance(0.2)) continue; const k = Math.random();
      if (k < 0.2 && x + 1 <= r.ix1 - 1 && !doorCols.includes(x + 1) && F(x + 1, y)) magmaRock(prop, 'big', x, y, hot()); else magmaRock(prop, k < 0.75 ? 'spire' : 'one', x, y, hot()); }
    return;
  }
  if (r.kind === 'room' && !r.pool && !r.shrine && !r.set && chance(0.33)) for (let x = r.ix0 + 1; x < r.ix1; x++) { // spires along the north wall
    if (!chance(0.4) || nearDoor(x, r.iy0, 2) || (r.stairX !== undefined && x >= r.stairX - 1 && x <= r.stairX + 3) || !free(x * TS + 8, r.iy0 * TS + 14, 14) || !F(x, r.iy0)) continue; magmaRock(prop, chance(0.6) ? 'spire' : 'one', x, r.iy0, hot()); }
}
function magmaLights() { const A = ARENA; if (!isMagma(A)) return; for (const p of A.props) if (p.glow && !p.dead) light(p.x, p.y - 7, 32 + 3 * Math.sin(G.time * 2 + p.x), 'magma', 0.4); for (const v of A.veins || []) light(v.x + 8, v.y + 22, 34 + 3 * Math.sin(G.time * 1.6 + v.x), 'magma', 0.42); }
function drawVeinGlow(c) { const A = ARENA; if (!A.veins) return; const V = magmaVeins(), [vx, vy, vw, vh] = viewRect(A); for (const v of A.veins) { if (v.x + TS < vx || v.x > vx + vw || v.y + 24 < vy || v.y > vy + vh) continue; c.globalAlpha = 0.45 + 0.25 * Math.sin(G.time * 1.9 + v.x * 0.11); c.drawImage(V, v.sx, 8, TS, 24, v.x, v.y, TS, 24); } c.globalAlpha = 1; }
// the lava as a light that shows what it shines on (34_sight): every other tile of it, a pit's or a pool's that is not drained
function lavaLights(A) { const L = []; if (!isMagma(A)) return L; for (let y = 0; y < A.h; y += 2) for (let x = 0; x < A.w; x += 2) { const v = A.fl[y * A.w + x]; if (v === PIT || v === 2) L.push({ x: x * TS + 8, y: y * TS + 8, r: 46 }); } return L; }
