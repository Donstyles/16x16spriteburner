// ===================== the wall pieces as painted: where feet go, and what is ceiling =====================
// Every wall piece of the cellar sheet is painted pixel by pixel in the Wall & Trim Painter (an artifact; its text goes in
// here with tools/paintwalls.js). Each pixel of a piece is WALL, where no foot ever stands, or else floor; and it may be
// TRIM, the ceiling, drawn over everyone and everything. The camera looks north and down, so the top of a wall is drawn
// north of where the wall stands: a south wall's whole row is floor behind it, under its trim; an east or west wall is
// wall under its trim, with a strip of floor beside the room. Per piece, in the sheet's own facing (a mirrored piece
// mirrors them): [wall, trim], 16 rows of 4 hex digits each, the leftmost bit the left pixel.
const PAINT = {
  '3,0': ['0000000000000000000000000000000000000000000000000000000000000000', '03ff03ff03ff03fffffffffffffffffffffffffffffefffcfff8fff0fff0fff0'],
  '3,2': ['fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0', 'fff0fff0fff0ffffffffffffffffffffffffffffffff03ff03ff03ff01fe00fc'],
  '3,3': ['fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0', '0000000000000000000000000000000000000000000000000000000000000000'],
  '5,0': ['ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffc'],
  '5,1': ['ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0'],
  '5,2': ['fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0', 'fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0'],
  '5,3': ['fff0fff0fff0fff0ffffffffffffffffffffffffffffffffffffffffffffffff', 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'],
  '6,0': ['ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '0000000000000000000000000000000000000000000000000000000000000000'],
  '6,1': ['ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '0000000000000000000000000000000000000000000000000000000000000000'],
  '6,3': ['0000000000000000000000000000000000000000000000000000000000000000', '0000000000000000ffffffffffffffffffffffffffffffffffffffffffffffff'],
  '7,0': ['ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffff7fff3fff'],
  '7,1': ['ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff'],
  '7,2': ['0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff', '0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff0fff'],
  '7,3': ['0fff0fff0fff0fffffffffffffffffffffffffffffffffffffffffffffffffff', 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'],
};
const PAINTED = {};
// a piece's wall and trim rows, as placed (mirrored or not); a piece never painted is wall all over, with no trim
function paintOf(tx, ty, flip) {
  const k = tx + ',' + ty + (flip ? 'm' : ''); if (PAINTED[k]) return PAINTED[k]; const p = PAINT[tx + ',' + ty];
  const rows = h => { const a = new Uint16Array(16); for (let i = 0; i < 16; i++) a[i] = parseInt(h.substr(i * 4, 4), 16); return a; };
  const rev = v => { let r = 0; for (let i = 0; i < 16; i++) if (v & (1 << i)) r |= 1 << (15 - i); return r; };
  let w = p ? rows(p[0]) : new Uint16Array(16).fill(0xffff), t = p ? rows(p[1]) : new Uint16Array(16);
  if (flip) { w = w.map(rev); t = t.map(rev); } return (PAINTED[k] = { w, t, tr: maskRects(t) });
}
// the set bits of 16 rows as rectangles [x, y, w, h]: rows alike run together, each run of bits along them one rectangle
function maskRects(rows) {
  const out = []; let y = 0;
  while (y < 16) {
    const r = rows[y]; let y1 = y + 1; while (y1 < 16 && rows[y1] === r) y1++;
    for (let x = 0; x < 16;) { if (!(r & (0x8000 >>> x))) { x++; continue; } let x1 = x; while (x1 < 16 && (r & (0x8000 >>> x1))) x1++; out.push([x, y, x1 - x, y1 - y]); x = x1; }
    y = y1;
  }
  return out;
}
const pieceAt = (A, i) => A.fl[i] === 0 && A.wt && A.wt[i] > 0; // (a wall tile with a piece drawn on it)
const paintAt = (A, i) => { const c = A.wt[i] - 1; return paintOf((c / 64) | 0, c % 64, A.wf && A.wf[i]); };
// Which of the pieces' floor pixels really are floor: those the floor reaches, pixel by pixel from the floor tiles beside
// them (a south wall's row behind a room is; behind a pit or a pool it is not, nor is a strip with no floor beside it).
// Worked out again whenever the floor changes (a pool drained, a slab fallen into a pit: A.flv). For each wall piece:
// A.fp its floor pixels (16 rows of bits), A.home the floor tile they were reached from (where a foot there counts as
// standing), A.wr the rest of it as the rectangles that stop feet (null when none do).
function openMap(A) {
  const v = A.flv || 0; if (A.fp && A.fpV === v) return A; A.fpV = v;
  const W = A.w, H = A.h, N = W * H, fl = A.fl, fp = A.fp = new Uint16Array(N * 16), can = new Uint16Array(N * 16), home = A.home = new Int32Array(N).fill(-1), wr = A.wr = new Array(N).fill(null);
  for (let i = 0; i < N; i++) if (pieceAt(A, i)) { const w = paintAt(A, i).w; for (let y = 0; y < 16; y++) can[i * 16 + y] = ~w[y] & 0xffff; }
  const q = [], go = (i, x, y, h) => { const r = i * 16 + y, b = 0x8000 >>> x; if (!(can[r] & b) || (fp[r] & b)) return; fp[r] |= b; if (home[i] < 0) home[i] = h; q.push(i * 256 + y * 16 + x); };
  for (let i = 0; i < N; i++) { // (from every edge a piece shares with a floor tile)
    if (!pieceAt(A, i)) continue; const x = i % W, y = (i / W) | 0;
    for (let k = 0; k < 16; k++) { if (y > 0 && FLOOR(fl[i - W])) go(i, k, 0, i - W); if (y < H - 1 && FLOOR(fl[i + W])) go(i, k, 15, i + W); if (x > 0 && FLOOR(fl[i - 1])) go(i, 0, k, i - 1); if (x < W - 1 && FLOOR(fl[i + 1])) go(i, 15, k, i + 1); }
  }
  for (let n = 0; n < q.length; n++) { // (and on, pixel to pixel, across into the pieces next to it)
    const e = q[n], i = e >> 8, y = (e >> 4) & 15, x = e & 15, h = home[i], tx = i % W, ty = (i / W) | 0;
    if (x > 0) go(i, x - 1, y, h); else if (tx > 0 && pieceAt(A, i - 1)) go(i - 1, 15, y, h);
    if (x < 15) go(i, x + 1, y, h); else if (tx < W - 1 && pieceAt(A, i + 1)) go(i + 1, 0, y, h);
    if (y > 0) go(i, x, y - 1, h); else if (ty > 0 && pieceAt(A, i - W)) go(i - W, x, 15, h);
    if (y < 15) go(i, x, y + 1, h); else if (ty < H - 1 && pieceAt(A, i + W)) go(i + W, x, 0, h);
  }
  const s = new Uint16Array(16);
  for (let i = 0; i < N; i++) {
    if (!pieceAt(A, i)) continue; const x0 = (i % W) * TS, y0 = ((i / W) | 0) * TS; for (let y = 0; y < 16; y++) s[y] = ~fp[i * 16 + y] & 0xffff;
    const R = maskRects(s); wr[i] = R.length ? R.map(([x, y, w, h]) => [x0 + x, y0 + y, x0 + x + w, y0 + y + h]) : null;
  }
  return A;
}
// a point on a wall piece's floor that the floor reaches (feet may stand there, and sight and shots pass)
function openAt(x, y) {
  const A = ARENA, tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (!A || !A.fl || tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return false;
  const i = ty * A.w + tx; if (!pieceAt(A, i)) return false; openMap(A); return !!(A.fp[i * 16 + Math.floor(y) - ty * TS] & (0x8000 >>> (Math.floor(x) - tx * TS)));
}
// a point under the ceiling: a piece's trim covers it
function trimAt(x, y) {
  const A = ARENA, tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (!A || !A.wt || tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return false;
  const i = ty * A.w + tx; if (!A.wt[i]) return false; return !!(paintAt(A, i).t[Math.floor(y) - ty * TS] & (0x8000 >>> (Math.floor(x) - tx * TS)));
}
// what of a tile stops feet, as rectangles [x0, y0, x1, y1], or null: nothing of a floor tile; all of rock with no piece, of
// water and of a pit (but not while a blow carries someone over its edge: 38_pits' PITPASS); of a wall piece, its wall
// pixels and whatever of its floor the floor does not reach
function wallBoxes(tx, ty) {
  const A = ARENA, x0 = tx * TS, y0 = ty * TS; if (tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return [[x0, y0, x0 + TS, y0 + TS]];
  const i = ty * A.w + tx, v = A.fl[i]; if (FLOOR(v)) return null; if (PITPASS && v === PIT) return null;
  return pieceAt(A, i) ? openMap(A).wr[i] : [[x0, y0, x0 + TS, y0 + TS]];
}
// the ceiling: every piece's trim, as it is drawn on the ground there (the piece, or the floor through its clear pixels)
function paintCeil(A, cg, ground) {
  for (let i = 0; i < A.w * A.h; i++) {
    if (!A.wt[i]) continue; const x = (i % A.w) * TS, y = ((i / A.w) | 0) * TS;
    for (const [rx, ry, rw, rh] of paintAt(A, i).tr) cg.drawImage(ground, x + rx, y + ry, rw, rh, x + rx, y + ry, rw, rh);
  }
}
