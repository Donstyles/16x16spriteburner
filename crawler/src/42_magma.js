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
function lavaMark(A, x0, y0, w, h) {
  if (!A.lavaM) { A.lavaM = mkCanvas(A.pw, A.ph); A.lavaG = A.lavaM.getContext('2d'); }
  x0 = Math.max(0, x0); y0 = Math.max(0, y0); w = Math.min(w, A.pw - x0); h = Math.min(h, A.ph - y0); if (w <= 0 || h <= 0) return;
  const s = A.g.getImageData(x0, y0, w, h).data, id = A.lavaG.createImageData(w, h), d = id.data, [r, gg, b] = LAVA.base;
  for (let i = 0; i < s.length; i += 4) if (s[i] === r && s[i + 1] === gg && s[i + 2] === b) { d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = 255; }
  A.lavaG.putImageData(id, x0, y0);
}
function viewRect(A) { const x0 = Math.max(0, PXO.x), y0 = Math.max(0, PXO.y), x1 = Math.min(A.pw, PXO.x + BUF.w), y1 = Math.min(A.ph, PXO.y + BUF.h); return [x0, y0, x1 - x0, y1 - y0]; }
function drawMagma(c, rect) {
  const A = ARENA; if (!isMagma(A)) return; const VR = () => rect ? [Math.max(0, rect[0]), Math.max(0, rect[1]), Math.min(A.pw, rect[0] + rect[2]) - Math.max(0, rect[0]), Math.min(A.ph, rect[1] + rect[3]) - Math.max(0, rect[1])] : viewRect(A);
  if (A.lavaM) { const [x, y, w, h] = VR(); lavaBlit(c, A.lavaM, x, y, w, h, x, y); } if (rect) return;
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
}
function magmaAfter(A) { A.mcr = MFLOOR.cracks; MFLOOR.cracks = []; }
