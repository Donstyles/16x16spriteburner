// ===================== the dungeon: a floor of rooms and corridors, built from the FG_Cellar tileset =====================
// Rooms sit one to a cell of a coarse grid; neighbouring rooms are joined by straight corridors three tiles wide that run
// along the cells' centre lines, so every corridor meets its rooms square on. Everything that is not floor is wall.
const THEMES = {
  brown: { tone: 'brown', fy: 0, floors: [[10, 1], [10, 1], [10, 1], [10, 1], [10, 3], [11, 1], [12, 1], [13, 3], [14, 1], [15, 3]], pillar: [[21, 5], [23, 5]], stairs: 19, rune: [27, 7], amb: [92, 78, 70], door: 7 },
  grey: { tone: 'grey', fy: 7, floors: [[10, 9], [10, 9], [10, 9], [10, 9], [10, 11], [11, 9], [12, 9], [13, 11], [14, 9], [15, 11]], pillar: [[21, 2], [23, 2]], stairs: 16, rune: [27, 4], amb: [60, 66, 88], door: 1 },
};
// THE CATACOMBS (floors 4 to 6, the crypt zone): the grey cellar underneath (its doors, water, props and every system built
// on its pieces), with the crypt sheet drawn over it. Everything keeps the cellar's piece names (A.wt, the masks' roles);
// only the drawing turns a cellar piece into the crypt's own (map: the grey cellar's sheet tile, x and y, to the crypt's)
THEMES.crypt = Object.assign({}, THEMES.grey, { name: 'crypt', sheet: 'crypt', amb: [44, 46, 58], ceilN: { '6,0': [[0, 0, 16, 8]] }, map: {
  // the walls, as the crypt's room frame (3-5, 2-5) and wall block (0-2, 2-5) draw them
  '6,8': [4, 3], '6,7': [4, 2], '6,10': [4, 5], '5,7': [3, 2], '7,7': [5, 2], '5,8': [3, 3], '7,8': [5, 3], '5,9': [3, 4], '7,9': [5, 4], '5,10': [3, 5], '7,10': [5, 5],
  '3,7': [2, 2], '3,9': [2, 4], '3,10': [2, 5],
  // the floors: the brick pavement (laid quarter by quarter in buildArena1: cryptFloor), a grave slab or a cracked one for
  // the inlays
  '10,9': [10, 0], '10,11': [10, 0], '11,9': [8, 0], '12,9': [9, 0], '13,9': [7, 1], '14,9': [8, 1], '15,9': [6, 0],
} });
const CRYPT = { force: false }; // (a test: the crypt on any floor: 64_testroom)
// the theme a floor is being made or drawn in: tileAt and the wall pieces draw through its map (buildArena1)
let TH = null;
// where a tile of the cellar sheet is drawn from in the theme at hand: the crypt's own tile if it has one ([image, sx, sy])
function srcOf(tx, ty) { const m = TH && TH.map && TH.map[tx + ',' + ty]; return m ? [IMG[TH.sheet], m[0] * TS, m[1] * TS] : [IMG.cellar, tx * TS, ty * TS]; }
const FLOOR_NAMES = ['THE ROOT CELLAR', 'THE SALT VAULT', 'THE DROWNED STORES', 'THE BONE PANTRY', 'THE ASHEN KILN', 'THE WINE CRYPT', 'THE GRAIN TOMB', 'THE IRON LARDER', 'THE HOLLOW CISTERN', 'THE ROTTED GRANARY', 'THE BLACK BREWERY', 'THE DEEP MILL', 'THE SCREAMING SILO', 'THE LAST LARDER'];
let ARENA = null;
// the sheets a floor draws the cellar's own pieces from (props, doors, water, pits, the walls the crypt has none of): the
// crypt's floors take them recoloured in its stone (tools/crypt_recolor.py), so nothing carried over shows the cellar's colours
// (IMG.pool: the sheet a pool's pieces are drawn from to be read off their blue, 36_works waterBody; in the crypt, IMG.cellar
// is that sheet with its water already in the floor's liquid, for the sunken pieces, the wet pillars and the rest)
function themeSheets(th, liq) { const c = th.sheet === 'crypt'; IMG.pool = c ? IMG.cellarCrypt : IMG.cellarBase; IMG.cellar = c ? (IMG.cellarLiq[liq] || (IMG.cellarLiq[liq] = liquidSheet(liq))) : IMG.cellarBase; IMG.doors = c ? IMG.doorsCrypt : IMG.doorsBase; IMG.ends = c ? IMG.endsCrypt : IMG.endsBase; PIX.cellar = c ? PIX.cellarCrypt : PIX.cellarBase; PIT_BLACK = null; }
const CW = 24, CH = 17; // one grid cell, in tiles
const FORCE_SHOP = { on: false }; // (the shop test: 39_shop)
// a short straight corridor between a room's south doorway and the next room's north doorway: three rows of floor or fewer
// between the two walls
const shortHall = h => !!h && h.dir === 'v' && !h.bent && !h.wide && !h.hidden && h.B.fy0 - h.A.fy1 - 1 <= 3;
const HIDDEN = { force: false, nest: null }; // (nest: 'alcove' or 'leg' forces a second cracked wall inside) // (a test: a hidden wing on the floor; 'exit': with the way down in it)
const GREAT = { force: false }; // (a test: a great hall on every floor)
// The tops of the south, east and west walls are at the ceiling: nothing in the room passes over them, so their painted
// trim is drawn into a ceiling layer over everything else (31_walls).
// A north wall is behind whoever stands at its foot: its brick face and the trim along its top (the light top, its south
// face and the dark line under it) stay under the units. That trim goes on a layer of its own, which only keeps the glows
// off the top of the wall, as the ceiling does.
const CEIL_N = { '6,0': [[0, 0, 16, 11]] };
// which wall piece stands on a tile of rock, from the floor round it ([tx, ty, mirrored] of the sheet, or null)
function wallPiece(isF, x, y) {
  if (isF(x, y)) return null; const face = (a, b) => !isF(a, b) && isF(a, b + 1), O = (a, b) => isF(a, b) || face(a, b);
  if (face(x, y)) { const lf = isF(x - 1, y), rf = isF(x + 1, y); return rf && !lf ? [3, 3, false] : lf && !rf ? [3, 3, true] : [6, 1, false]; } // the brick face; where floor runs past its end, the block's end piece
  const n = O(x, y - 1), e = O(x + 1, y), s = O(x, y + 1), w = O(x - 1, y);
  if (n && e) return [3, 0, false]; if (n && w) return [3, 0, true]; // a corner of rock jutting into the floor
  if (s && e) return [3, 2, false]; if (s && w) return [3, 2, true];
  if (s) return [6, 0, false]; if (n) return [6, 3, false];
  if (e) return [5, face(x + 1, y) ? 1 : 2, false]; if (w) return [7, face(x - 1, y) ? 1 : 2, false]; // side walls; beside a brick face the rim runs down past it
  if (O(x + 1, y + 1)) return [5, 0, false]; if (O(x - 1, y + 1)) return [7, 0, false]; // the inside corners of a room
  if (O(x + 1, y - 1)) return [5, 3, false]; if (O(x - 1, y - 1)) return [7, 3, false];
  return null;
}
// THE CRYPT'S FLOOR, laid by rule: nothing in it is left to chance. Two stones: small bricks (four to a tile) and big
// slabs (a whole tile, plain or quartered by grout lines). How a room is paved follows what it is: the way out and the
// great rooms a nave of quartered slabs framed by a row of bricks along the walls, the treasure rooms and the middling
// rooms plain slabs wall to wall, small rooms and the corridors brick. The wear follows the feet: from every doorway
// straight into the room and along to its middle, and down the middle of every corridor, the stone is worn away in a band
// that swells and narrows slowly along the way (a smooth function of the place, so crossing paths agree); bricks go where
// the band reaches, a slab only where the band runs deep over it (it outlasts a brick). Rooms nobody passes through much
// (the treasure rooms, the shop, the secret ones) are worn the less. A slab's corner is broken off where it points out
// into bare earth, and along a band's edge where the band runs deep beside it; never elsewhere. Bare earth is plain but
// for its grit; the grout's print runs only along the stone still down and opens out into the dirt everywhere else.
const hash2 = (x, y) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const CRYPT_CHIP = { plain: { tl: [8, 1], tr: [7, 1], br: [9, 1], bl: [9, 1, 1] }, panel: { tl: [8, 0], tr: [8, 0, 1], br: [9, 0], bl: [9, 0, 1] } };
// a chipped corner: that quarter of the sheet's chipped slab (mirrored for the corners the sheet lacks), its outer grout
// opened into earth on the sides (oh: above or below it, ov: beside it) where bare earth lies beyond, and any grout left
// floating once its edge is gone cleared too
const CHIPQ = {};
function chipQuarter(kind, c, oh, ov) {
  const key = kind + c + (oh ? 1 : 0) + (ov ? 2 : 0); if (CHIPQ[key]) return CHIPQ[key];
  const [tx, ty, m] = CRYPT_CHIP[kind][c], cx = c[1] === 'r' ? 1 : 0, cy = c[0] === 'b' ? 1 : 0, cv = mkCanvas(8, 8), q = cv.getContext('2d');
  if (!m) q.drawImage(IMG.crypt, tx * TS + cx * 8, ty * TS + cy * 8, 8, 8, 0, 0, 8, 8);
  else { q.translate(8, 0); q.scale(-1, 1); q.drawImage(IMG.crypt, tx * TS + (1 - cx) * 8, ty * TS + cy * 8, 8, 8, 0, 0, 8, 8); q.setTransform(1, 0, 0, 1, 0, 0); }
  if (oh || ov) {
    const d = q.getImageData(0, 0, 8, 8), p = d.data, at = (x, y) => (y * 8 + x) * 4, rgb = (x, y) => (p[at(x, y)] << 16) | (p[at(x, y) + 1] << 8) | p[at(x, y) + 2];
    const dirt = (x, y) => { const v = rgb(x, y); return v === 0x332919 || v === 0x4c3e26; }, bare = (x, y) => { const i = at(x, y); p[i] = 0x33; p[i + 1] = 0x29; p[i + 2] = 0x19; p[i + 3] = 255; };
    const ey = cy ? 7 : 0, ex = cx ? 7 : 0, open = [];
    if (oh) for (let x = 0; x < 8; x++) if (dirt(x, ey) && dirt(x, cy ? 6 : 1)) open.push([x, ey]);
    if (ov) for (let y = 0; y < 8; y++) if (dirt(ex, y) && dirt(cx ? 6 : 1, y)) open.push([ex, y]);
    for (const [x, y] of open) bare(x, y);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { if (rgb(x, y) !== 0x4c3e26) continue; let lone = true;
      for (let j = -1; j <= 1 && lone; j++) for (let i = -1; i <= 1; i++) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X > 7 || Y > 7 || !dirt(X, Y)) { lone = false; break; } }
      if (lone) bare(x, y); }
    q.putImageData(d, 0, 0);
  }
  return (CHIPQ[key] = cv);
}
function cryptFloor(g, W, H, near, inRoom, rooms, halls) {
  /* the laying: per tile, 0 bricks, or a slab kind */
  const lay = new Array(W * H).fill(null);
  for (const r of rooms) {
    const w = r.ix1 - r.ix0 + 1, h = r.iy1 - r.iy0 + 1, how = w >= 5 && h >= 5 && (r.kind === 'end' || w * h >= 110) ? 'nave' : r.kind === 'treasure' || w * h >= 56 ? 'slabs' : 'bricks', kind = how === 'nave' ? 'panel' : 'plain';
    r.paving = how + ' ' + kind;
    for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { /* (the room's own floor: ix, iy; fx, fy take in its walls) */
      const rim = x === r.ix0 || x === r.ix1 || y === r.iy0 || y === r.iy1;
      lay[y * W + x] = how === 'slabs' || (how === 'nave' && !rim) ? kind : 0;
    }
  }
  /* the paths the feet take, as lines through tile middles, each with how hard it is worn (k) */
  const segs = [], seg = (x0, y0, x1, y1, k) => { if (x0 !== x1 || y0 !== y1) segs.push([x0 + 0.5, y0 + 0.5, x1 + 0.5, y1 + 0.5, k]); };
  for (const r of rooms) {
    const cx = Math.round((r.ix0 + r.ix1) / 2), cy = Math.round((r.iy0 + r.iy1) / 2), k = r.kind === 'treasure' || r.kind === 'shop' || r.secret ? 0.55 : 1;
    const ins = r.doors.filter(d => !d.hidden).map(d => [d.side, d.cells[1][0], d.cells[1][1]]); if (r.stairX !== undefined) ins.push(['N', r.stairX + 1, r.iy0]);
    for (const [sd, mx, my] of ins) { if (sd === 'N' || sd === 'S') { seg(mx, my, mx, cy, k); seg(mx, cy, cx, cy, k); } else { seg(mx, my, cx, my, k); seg(cx, my, cx, cy, k); } }
    if (ins.length > 1) { seg(cx - 1, cy, cx + 1, cy, k * 1.35); seg(cx, cy - 1, cx, cy + 1, k * 1.35); } /* (where its paths meet, a wider worn place) */
  }
  for (const h of halls) { if (h.hidden) continue;
    if (h.dir === 'h') { const y = h.y0 + 1, yb = h.yb + 1; if (h.bent) { seg(h.x0, y, h.xm, y, 1); seg(h.xm, y, h.xm, yb, 1); seg(h.xm, yb, h.x1, yb, 1); } else seg(h.x0, y, h.x1, y, 1); }
    else { const x = h.x0 + 1, xb = h.xb + 1; if (h.bent) { seg(x, h.y0, x, h.ym, 1); seg(x, h.ym, xb, h.ym, 1); seg(xb, h.ym, xb, h.y1, 1); } else seg(x, h.y0, x, h.y1, 1); }
  }
  /* how deep the wear runs at a place (tile units): the band's half width there less the distance to its path; > 0 is worn */
  const wearAt = (px, py) => { let best = -9;
    for (const [x0, y0, x1, y1, k] of segs) {
      const dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy))), qx = x0 + dx * t, qy = y0 + dy * t;
      const hw = k * (0.95 + 0.75 * (0.5 + 0.5 * Math.sin(qx * 0.83 + qy * 0.61) * Math.cos(qx * 0.37 - qy * 0.71))), v = hw - Math.hypot(px - qx, py - qy);
      if (v > best) best = v;
    }
    return best; };
  CWEAR = wearAt; // (for the furniture, which stands where nobody walks: 43_crypt)
  const QW = W * 2, Q = new Int8Array(QW * H * 2).fill(-1), QV = new Float32Array(QW * H * 2); /* per quarter tile: -1 not floor, 0 stone, 1 bare earth; and the wear there */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!near(x, y)) continue; const slab = lay[y * W + x], deep = slab ? wearAt(x + 0.5, y + 0.5) > 0.45 : false;
    for (let q = 0; q < 4; q++) { const i = (y * 2 + (q >> 1)) * QW + x * 2 + (q & 1), v = wearAt(x + 0.25 + (q & 1) * 0.5, y + 0.25 + (q >> 1) * 0.5); QV[i] = v; Q[i] = slab ? (deep ? 1 : 0) : v > 0 ? 1 : 0; }
  }
  const at = (qx, qy) => qx < 0 || qy < 0 || qx >= QW || qy >= H * 2 ? -1 : Q[qy * QW + qx], vAt = (qx, qy) => qx < 0 || qy < 0 || qx >= QW || qy >= H * 2 ? -9 : QV[qy * QW + qx];
  /* the chipped corners, settled before anything is drawn (the bare earth beside one needs to know) */
  const chipped = new Map(); /* quarter tile -> [slab kind, corner] */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const slab = lay[y * W + x], qx = x * 2, qy = y * 2; if (!slab || !near(x, y) || at(qx, qy) !== 0) continue;
    const edge = []; /* (corners along a band's edge: at most one a side, the one the wear has nearly reached) */
    for (const [cx, cy, c] of [[0, 0, 'tl'], [1, 0, 'tr'], [0, 1, 'bl'], [1, 1, 'br']]) {
      const ox = cx ? qx + 2 : qx - 1, oy = cy ? qy + 2 : qy - 1, a = at(ox, qy + cy) === 1, b = at(qx + cx, oy) === 1, d = at(ox, oy) === 1, i = (qy + cy) * QW + qx + cx;
      if (a && b && d) chipped.set(i, [slab, c]); /* (out into the earth) */
      else if (d && (a || b) && QV[i] > 0.55) edge.push([i, c, a ? 'v' + cx : 'h' + cy, QV[i]]); /* (its own corner all but worn through) */
    }
    for (const e of edge) if (!edge.some(f => f !== e && f[2] === e[2] && (f[3] > e[3] || (f[3] === e[3] && f[0] < e[0])))) chipped.set(e[0], [slab, e[1]]);
  }
  /* the grout's print on bare earth (a brick's, n 1, or a slab's, n 2, from the sheet's bare piece at sx, sy): only along the
     sides where stone is still down (a chipped corner is open earth to it), so the lines open out into the dirt wherever the earth runs on */
  const stone = (qx, qy) => at(qx, qy) === 0 && !chipped.has(qy * QW + qx), cp = (sx, sy, w, h, dx, dy) => g.drawImage(IMG.crypt, sx, sy, w, h, dx, dy, w, h);
  const print = (sx, sy, n, ax, ay, ox, oy) => { const e = n * 8 - 1;
    earth(ox, oy, n * 8, n * 8);
    for (let k = 0; k < n; k++) {
      if (stone(ax + k, ay - 1)) cp(sx + k * 8, sy, 8, 1, ox + k * 8, oy);
      if (stone(ax + k, ay + n)) cp(sx + k * 8, sy + e, 8, 1, ox + k * 8, oy + e);
      if (stone(ax - 1, ay + k)) cp(sx, sy + k * 8, 1, 8, ox, oy + k * 8);
      if (stone(ax + n, ay + k)) cp(sx + e, sy + k * 8, 1, 8, ox + e, oy + k * 8);
    }
    for (const [cx, cy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { /* a corner: rounded where both its sides are stone, a dot where only the stone across it is */
      const hx = cx ? ax + n : ax - 1, hy = cy ? ay + n : ay - 1, vx = cx ? ax + n - 1 : ax, vy = cy ? ay + n - 1 : ay;
      const a = stone(vx, hy), b = stone(hx, vy), px = cx ? e : 0, py = cy ? e : 0;
      if (a && b && n > 1) cp(sx + (cx ? e - 2 : 0), sy + (cy ? e - 2 : 0), 3, 3, ox + (cx ? e - 2 : 0), oy + (cy ? e - 2 : 0));
      else if (!a && !b && stone(hx, hy)) cp(sx + px, sy + py, 1, 1, ox + px, oy + py);
    }
  };
  const earth = (dx, dy, w, h) => { g.fillStyle = '#332919'; g.fillRect(dx, dy, w, h); /* bare earth: its grit, a speck in every few dozen pixels, where the place says */
    for (let y = dy; y < dy + h; y++) for (let x = dx; x < dx + w; x++) { const u = hash2(x, y); if (u < 0.026) { g.fillStyle = u < 0.019 ? '#4c3e26' : '#261d1a'; g.fillRect(x, y, 1, 1); } } };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!near(x, y)) continue; const slab = lay[y * W + x], qx = x * 2, qy = y * 2, dx = x * TS, dy = y * TS;
    if (slab) {
      if (at(qx, qy) === 1) { print(6 * TS, TS, 2, qx, qy, dx, dy); continue; } /* a slab gone */
      cryptAt(g, slab === 'plain' ? 6 : 7, 0, dx, dy);
      for (const [cx, cy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const ch = chipped.get((qy + cy) * QW + qx + cx); if (!ch) continue;
        const hy = cy ? qy + 2 : qy - 1, vx = cx ? qx + 2 : qx - 1, oh = at(qx + cx, hy) === 1 || chipped.has(hy * QW + qx + cx), ov = at(vx, qy + cy) === 1 || chipped.has((qy + cy) * QW + vx); /* (a chipped corner across is earth too) */
        g.drawImage(chipQuarter(ch[0], ch[1], oh, ov), dx + cx * 8, dy + cy * 8); }
      continue;
    }
    for (let q = 0; q < 4; q++) { const ax = qx + (q & 1), ay = qy + (q >> 1), ox = dx + (q & 1) * 8, oy = dy + (q >> 1) * 8;
      if (!at(ax, ay)) { g.drawImage(IMG.crypt, 10 * TS + (q & 1) * 8, (q >> 1) * 8, 8, 8, ox, oy, 8, 8); continue; }
      print(10 * TS + (q & 1) * 8, TS + (q >> 1) * 8, 1, ax, ay, ox, oy); /* a brick gone */
    }
  }
}
// on the crypt's north walls, in place of the cellar's banners and windows: a burial niche (bones, skulls, urns, candles),
// or chains hanging down, set in the brick between the trim and the foot of the wall (on the face's tile, y)
const CRYPT_NICHES = [[6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [6, 7], [7, 7], [9, 7], [10, 7], [11, 7]];
// a crypt's lights on the walls are candles in a niche (the animated sheet's small shelf, four frames), set in the brick as
// the niches are; a dead one is a niche with nothing burning in it
function cryptTorch(c, t) {
  const x = t.x - 8, y = t.y - 15; if (t.out) { c.drawImage(IMG.crypt, 8 * TS, 7 * TS, TS, TS, x, y, TS, TS); return; }
  const f = ((G.time * 7 + (t.f || 0)) | 0) % 4; c.drawImage(IMG.cryptAnim, 16 + f * 16, 256, TS, TS, x, y, TS, TS);
}
function cryptAt(g, tx, ty, dx, dy) { g.drawImage(IMG.crypt, tx * TS, ty * TS, TS, TS, dx, dy, TS, TS); }
function tileAt(g, tx, ty, dx, dy) { const [im, sx, sy] = srcOf(tx, ty); g.drawImage(im, sx, sy, TS, TS, dx, dy, TS, TS); }
// A floor that cannot take the puzzles its depth asks for (37_levels levelPlan) is laid out again, a few times at most.
// It looks for some variety too: two puzzles of different kinds where it can, and the flooded way as often as the
// drawbridge where one is asked for (it takes a room with a side branch, so it fits less often); after eight tries any
// layout that has its puzzles will do.
function buildArena(floor) {
  let A = null; const wantFlood = chance(0.5); ARCH.cur = pickArch(floor); // (what the floor is like: 35_themes)
  for (let k = 0; k < 40; k++) { // (the one built last is ARENA: the one handed back)
    A = buildArena1(floor); if (!A.need) return A; if (A.musts < A.need) continue;
    const kinds = new Set(A.sets.filter(s => MUST_KINDS.has(s)));
    if (k >= 8 || (A.need >= 2 ? kinds.size >= 2 : kinds.has(wantFlood ? 'flood' : 'drawbridge') || [...kinds].some(s => s !== 'flood' && s !== 'drawbridge'))) return A;
  }
  return A;
}
function buildArena1(floor) {
  const th = CRYPT.force || (floor >= 4 && floor <= 6) ? THEMES.crypt : floor % 2 ? THEMES.brown : THEMES.grey, /* (floors 4 to 6: the catacombs) */ GW = 5, GH = 4; TH = th; const liq = th.sheet === 'crypt' ? pick(['blood', 'black', 'rot']) : null; themeSheets(th, liq); // (longer floors: nine rooms on the first, one more every second floor down, up to fourteen)
  const N = Math.min(GW * GH - 1, 9 + Math.min(5, Math.floor(floor / 2)));
  // ---- the room graph: grown outward from the start cell, then a loop or two so not every floor is a single line
  const key = (x, y) => y * GW + x, cells = new Map(), edges = [];
  const nb = ([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < GW && b < GH);
  // the way down first: a winding path through the grid, about two thirds of the rooms long, so a floor takes a while to
  // cross; then the rest hung off it as side rooms
  const L = Math.min(N - 2, Math.round(N * 0.65)); let path = [];
  for (let t = 0; t < 300 && path.length < L; t++) {
    const st = [randi(0, GW - 1), randi(0, GH - 1)], seen = new Set([key(...st)]); path = [st];
    while (path.length < L) { const o = nb(path[path.length - 1]).filter(c => !seen.has(key(...c))); if (!o.length) break; const n = pick(o); seen.add(key(...n)); path.push(n); }
  }
  const s0 = path[0]; for (let i = 0; i < path.length; i++) { cells.set(key(...path[i]), path[i]); if (i) edges.push([key(...path[i - 1]), key(...path[i])]); }
  let guard = 0; while (cells.size < N && guard++ < 500) { const c = pick([...cells.values()]), n = pick(nb(c)); if (cells.has(key(...n))) continue; cells.set(key(...n), n); edges.push([key(...c), key(...n)]); }
  const has = (a, b) => edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
  // a loop or two, but none that cuts the way down short
  const way = () => { const d = new Map([[key(...s0), 0]]), q = [key(...s0)]; while (q.length) { const k = q.shift(); for (const e of edges) { const n = e[0] === k ? e[1] : e[1] === k ? e[0] : -1; if (n >= 0 && !d.has(n)) { d.set(n, d.get(k) + 1); q.push(n); } } } return d.get(key(...path[path.length - 1])); };
  let loops = 0; const W0 = way(); for (const c of cells.values()) for (const n of nb(c)) { const a = key(...c), b = key(...n); if (a < b && cells.has(b) && !has(a, b) && loops < 3 && chance(0.3)) { edges.push([a, b]); if (way() < W0) edges.pop(); else loops++; } }
  // the end room is the one farthest from the start
  const adj = k => edges.filter(e => e[0] === k || e[1] === k).map(e => e[0] === k ? e[1] : e[0]);
  const far = new Map([[key(...s0), 0]]), q = [key(...s0)]; while (q.length) { const k = q.shift(); for (const n of adj(k)) if (!far.has(n)) { far.set(n, far.get(k) + 1); q.push(n); } }
  let endK = [...far.entries()].sort((a, b) => b[1] - a[1])[0][0], leaves = [...cells.keys()].filter(k => k !== endK && k !== key(...s0) && adj(k).length === 1);
  // from the second floor a dead end may be the shop (39_shop): one of two or more, or now and then the only one (the
  // treasure then goes to a guarded room)
  const lv = leaves.slice(), north = k => { const n = adj(k)[0]; return cells.get(n)[1] < cells.get(k)[1]; }, shopC = lv.filter(k => !north(k)); // (its door not in the north wall: the keeper stands with his back to it)
  const shopK = (floor >= 2 || FORCE_SHOP.on) && shopC.length && (lv.length >= 2 || FORCE_SHOP.on || chance(0.4)) ? pick(shopC) : -1; if (shopK >= 0) lv.splice(lv.indexOf(shopK), 1);
  const treasK = lv.length ? pick(lv) : -1; // a dead end off the way, when there is one, holds the treasure
  // ---- rooms inside their cells; every room covers its cell's centre so the corridors can run straight
  const W = GW * CW, H = GH * CH, fl = new Uint8Array(W * H), rooms = [], byKey = new Map();
  let hid = null; // (the hidden wing, below)
  const kindOf = k => hid && k === hid.s && hid.kind !== 'end' ? hid.kind : k === key(...s0) ? 'start' : k === endK ? 'end' : k === treasK ? 'treasure' : k === shopK ? 'shop' : 'room';
  // THE GREAT HALL (from the second floor, now and then; two from the sixth): two neighbouring cells of the grid made one
  // room, thirty to thirty-six tiles long, or a nave twenty-four to twenty-eight tall; the end room may be one
  const great = new Map(); if (floor >= 2 || GREAT.force) {
    const want = GREAT.force ? 1 : floor >= 6 ? 2 : 1, used = new Set(), ok = k => kindOf(k) === 'room' || kindOf(k) === 'end';
    for (const [a, b] of pitShuffle(edges.slice())) { if (great.size >= want) break; if (!ok(a) || !ok(b) || used.has(a) || used.has(b)) continue; const ca = cells.get(a), cb = cells.get(b); if (ca[1] !== cb[1] && !chance(0.35)) continue; if (!GREAT.force && !chance(Math.min(0.9, 0.45 * (ARCH.cur.great || 1)))) continue; const [f, s] = ca[0] + ca[1] * 100 < cb[0] + cb[1] * 100 ? [a, b] : [b, a]; great.set(f, s); used.add(a); used.add(b); }
  }
  const second = new Set(great.values());
  // THE HIDDEN WING: from the second floor, now and then, an empty cell of the grid north of a room holds a room of its own,
  // reached only by a corridor walled up behind a cracked stretch of that room's north wall (41_puzzles). Mostly treasure;
  // now and then an ordinary room (a switch the floor needs may end up in it), and from the third floor now and then the
  // way down itself, off a room far along the way
  if ((floor >= 2 || HIDDEN.force) && (HIDDEN.force || chance(0.55))) {
    const cand = [...cells.entries()].filter(([k, [x, y]]) => y > 0 && !cells.has(key(x, y - 1)) && kindOf(k) !== 'shop' && kindOf(k) !== 'end' && !great.has(k) && !second.has(k));
    if (cand.length) {
      const exit = HIDDEN.force === 'exit' || (!HIDDEN.force && floor >= 3 && chance(0.25)); cand.sort((a, b) => (far.get(b[0]) || 0) - (far.get(a[0]) || 0));
      const [rk, [x, y]] = exit ? cand[randi(0, Math.min(2, cand.length - 1))] : pick(cand), sk = key(x, y - 1);
      hid = { r: rk, s: sk, x, kind: exit ? 'end' : chance(0.35) ? 'room' : 'treasure', nest: HIDDEN.nest || (!HIDDEN.force && floor >= 3 && chance(0.4)) }; cells.set(sk, [x, y - 1]); if (exit) endK = sk;
    }
  }
  for (const [k, [gx, gy]] of cells) {
    if (second.has(k)) continue; const k2 = great.get(k), kind = k2 !== undefined && kindOf(k2) === 'end' ? 'end' : kindOf(k);
    const big = kind === 'end'; let w = big ? randi(18, 20) : kind === 'start' ? randi(13, 14) : kind === 'treasure' ? randi(10, 12) : kind === 'shop' ? 9 : randi(12, 18), h = big ? randi(10, 12) : kind === 'start' || kind === 'treasure' ? randi(7, 8) : kind === 'shop' ? 7 : randi(7, 11);
    const nestS = hid && hid.nest && k === hid.s, nestR = hid && hid.nest && k === hid.r; if (nestS) h = Math.min(h, big ? 10 : 8); // (a nested wing wants rows between the two rooms: the one behind as far north as it goes, the one in front as far south)
    const X0 = gx * CW, Y0 = gy * CH; let cx = X0 + CW / 2, cy = Y0 + 9, ix0, iy0, hz = null;
    if (k2 !== undefined) { // (across two cells: it covers both their middles, so the corridors still run straight)
      hz = cells.get(k2)[1] === gy;
      if (hz) { w = randi(30, 36); h = randi(10, 12); ix0 = randi(Math.max(X0 + 2, cx + CW + 3 - w), Math.min(cx - 2, X0 + 2 * CW - 2 - w)); iy0 = randi(Math.max(Y0 + 3, cy + 3 - h), Math.min(cy - 2, Y0 + CH - 2 - h)); }
      else { w = randi(13, 18); h = randi(24, 28); ix0 = randi(Math.max(X0 + 2, cx + 3 - w), Math.min(cx - 2, X0 + CW - 2 - w)); iy0 = randi(Math.max(Y0 + 3, cy + CH + 3 - h), Math.min(cy - 2, Y0 + 2 * CH - 2 - h)); }
      cx = Math.round(ix0 + (w - 1) / 2); cy = Math.round(iy0 + (h - 1) / 2);
    } else { ix0 = randi(Math.max(X0 + 2, cx + 3 - w), Math.min(cx - 2, X0 + CW - 2 - w)); const lo = Math.max(Y0 + 3, cy + 3 - h), hi = Math.min(cy - 2, Y0 + CH - 2 - h); iy0 = kind === 'shop' ? cy - 4 : nestS ? lo : nestR ? hi : randi(lo, hi); } // (a shop: its side doors come in below its counter)
    const r = { i: rooms.length, k, gx, gy, kind, cx, cy, ix0, iy0, ix1: ix0 + w - 1, iy1: iy0 + h - 1, fx0: ix0 - 1, fx1: ix0 + w, fy0: iy0 - 2, fy1: iy0 + h, w, h, doors: [] };
    if (k2 !== undefined) { r.great = hz ? 'h' : 'v'; byKey.set(k2, r); }
    r.px0 = r.fx0 * TS; r.py0 = r.fy0 * TS; r.px1 = (r.fx1 + 1) * TS; r.py1 = (r.fy1 + 1) * TS;
    r.b = { x0: ix0 * TS + 5, x1: (r.ix1 + 1) * TS - 5, y0: iy0 * TS + 4, y1: (r.iy1 + 1) * TS - 3 };
    rooms.push(r); byKey.set(k, r);
    for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) fl[y * W + x] = 1;
  }
  // ---- corridors: floor through both walls, the corridor's own walls between the rooms. Each runs along the middle line of
  // the cells it joins. Now and then one jogs aside halfway (THE BENT CORRIDOR: it comes into the far room three or four
  // tiles off its middle), or is twice as wide between its doorways (THE GALLERY, columns down its middle)
  const halls = [], carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fl[y * W + x] = 1; };
  for (const [a, b] of edges) {
    let A = byKey.get(a), B = byKey.get(b), ca = cells.get(a), cb = cells.get(b); if (A === B) continue; if (ca[0] > cb[0] || ca[1] > cb[1]) { [A, B] = [B, A]; [ca, cb] = [cb, ca]; }
    const odd = A.kind === 'shop' || B.kind === 'shop', roll = Math.random(), sh = pick([-4, -3, 3, 4]);
    if (ca[1] === cb[1]) { // side by side
      const y0 = ca[1] * CH + 9 - 1, x0 = A.fx1, x1 = B.fx0, yb = y0 + sh, xm = x0 + Math.floor((x1 - x0) / 2);
      const bent = !odd && roll < 0.22 && x1 - x0 >= 7 && yb >= B.iy0 && yb + 2 <= B.iy1, wide = !odd && !bent && roll < 0.42 && x1 - x0 >= 6;
      if (bent) { carve(x0, y0, xm + 1, y0 + 2); carve(xm - 1, Math.min(y0, yb), xm + 1, Math.max(y0, yb) + 2); carve(xm - 1, yb, x1, yb + 2); B.offDoor = true; } // (B: a door off its middle line, which the gauntlet's causeway and the ponds do not allow for)
      else { carve(x0, y0, x1, y0 + 2); if (wide) carve(x0 + 2, y0 - 1, x1 - 2, y0 + 3); }
      const y1 = bent ? yb : y0, hl = { dir: 'h', A, B, x0, x1, y0, bent, wide, xm, yb: y1, px0: x0 * TS, py0: (Math.min(y0, y1) - 2) * TS, px1: (x1 + 1) * TS, py1: (Math.max(y0, y1) + 4) * TS }; halls.push(hl);
      A.doors.push({ side: 'E', cells: [[A.fx1, y0], [A.fx1, y0 + 1], [A.fx1, y0 + 2]], hall: hl }); B.doors.push({ side: 'W', cells: [[B.fx0, y1], [B.fx0, y1 + 1], [B.fx0, y1 + 2]], hall: hl });
    } else { // one above the other
      const x0 = ca[0] * CW + CW / 2 - 1, y0 = A.fy1, y1 = B.fy0 + 1, xb = x0 + sh, ym = y0 + Math.floor((y1 - y0) / 2);
      const bent = !odd && roll < 0.22 && y1 - y0 >= 8 && xb >= B.ix0 + 1 && xb + 2 <= B.ix1 - 1 && B.kind !== 'end', wide = !odd && !bent && roll < 0.42 && y1 - y0 >= 9;
      if (bent) { carve(x0, y0, x0 + 2, ym + 1); carve(Math.min(x0, xb), ym - 1, Math.max(x0, xb) + 2, ym + 1); carve(xb, ym - 1, xb + 2, y1); B.offDoor = true; }
      else { carve(x0, y0, x0 + 2, y1); if (wide) carve(x0 - 1, y0 + 3, x0 + 3, y1 - 3); } // (three rows of wall at each end, as between any two rooms: a wall one tile thick has no piece in the sheet)
      const x1 = bent ? xb : x0, hl = { dir: 'v', A, B, x0, y0, y1, bent, wide, ym, xb: x1, px0: (Math.min(x0, x1) - 1) * TS, py0: y0 * TS, px1: (Math.max(x0, x1) + 4) * TS, py1: (y1 + 1) * TS }; halls.push(hl);
      A.doors.push({ side: 'S', cells: [[x0, A.fy1], [x0 + 1, A.fy1], [x0 + 2, A.fy1]], hall: hl }); B.doors.push({ side: 'N', cells: [[x1, B.fy0 + 1], [x1 + 1, B.fy0 + 1], [x1 + 2, B.fy0 + 1]], hall: hl });
    }
  }
  if (hid) { // its corridor: from the hidden room's south doorway to three rows short of the room it hangs off, whose wall stands whole across it
    const S = byKey.get(hid.s), R = byKey.get(hid.r), x0 = hid.x * CW + CW / 2 - 1, F = R.fy0, gap = F - S.fy1; let x1 = x0, P0 = null;
    // NESTED: behind the cracked wall a pocket with a second cracked wall in it, three rows of rock like any wall (a rim and
    // two of face) between the pocket and the corridor on to the room. The pocket is an alcove straight on, two to four
    // rows deep, or a leg running off sideways along the room's wall (the first wall broken off to one side), an L
    if (hid.nest) {
      const offs = [-6, -5, -4, 4, 5, 6].filter(s => x0 + s >= R.ix0 + 1 && x0 + s + 2 <= R.ix1 - 1);
      if (gap >= 9 && offs.length && hid.nest !== 'alcove' && (hid.nest === 'leg' || chance(0.5))) { x1 = x0 + pick(offs); P0 = F - 4; }
      else if (gap >= 8 && hid.nest !== 'leg') P0 = F - 1 - randi(2, Math.min(4, gap - 6));
    }
    if (P0 === null) carve(x0, S.fy1, x0 + 2, F - 2); else { carve(x0, S.fy1, x0 + 2, P0 - 4); carve(Math.min(x0, x1), P0, Math.max(x0, x1) + 2, F - 2); }
    const hl = { dir: 'v', A: S, B: R, x0, y0: S.fy1, y1: F + 1, bent: false, wide: false, ym: Math.floor((S.fy1 + F) / 2), xb: x1, hidden: true, px0: (Math.min(x0, x1) - 1) * TS, py0: S.fy1 * TS, px1: (Math.max(x0, x1) + 4) * TS, py1: (F + 2) * TS };
    halls.push(hl); S.doors.push({ side: 'S', cells: [[x0, S.fy1], [x0 + 1, S.fy1], [x0 + 2, S.fy1]], hall: hl }); S.secret = true;
    R.doors.push({ side: 'N', cells: [[x1, F + 1], [x1 + 1, F + 1], [x1 + 2, F + 1]], hall: hl, hidden: true }); // (a doorway as far as the room's other works go: its landing kept clear; walled up, so no door of its own)
    R.hiddenN = true; R.hidCrack = { x: x1, y: F, hp: 3, stage: 0, open: false, room: R.i, holds: 'hall', hall: hl };
    if (P0 !== null) { R.hidCrack.inner = { x: x0, y: P0 - 2, hp: 3, stage: 0, open: false, room: R.i, holds: 'hall', hall: hl, deep: true }; hl.nest = x1 === x0 ? 'alcove' : 'leg'; }
    // what of the wing stays unseen (nor remembered, nor read off the map) till the wall in front of it is broken: the room
    // and its corridor (with their walls), and in a nested wing the pocket first (34_sight)
    const rect = (a, b, c, d) => { const o = []; for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) o.push(y * W + x); return o; }, far = rect(S.fx0 - 1, S.fy0 - 1, S.fx1 + 1, S.fy1).concat(rect(x0 - 1, S.fy1, x0 + 3, P0 === null ? F - 2 : P0 - 4));
    if (P0 === null) R.hidCrack.secret = far; else { R.hidCrack.secret = rect(Math.min(x0, x1) - 1, P0 - 3, Math.max(x0, x1) + 3, F - 2); R.hidCrack.inner.secret = far; }
    // and painted as solid rock where it comes up to the wall, so the wall's top is a plain one and not the end of a corridor
    // (the two rows of floor behind each cracked wall; the real floor painted in when that wall breaks: 41_puzzles openCrack)
    const xa = P0 === null ? x0 : Math.min(x0, x1), xb = P0 === null ? x0 + 2 : Math.max(x0, x1) + 2; R.hidCrack.mask = rect(xa, F - 3, xb, F - 2).filter(i => fl[i] === 1); R.hidCrack.box = [xa - 2, F - 5, xb + 2, F + 2];
    if (P0 !== null) { R.hidCrack.inner.mask = rect(x0, P0 - 5, x0 + 2, P0 - 4).filter(i => fl[i] === 1); R.hidCrack.inner.box = [x0 - 2, P0 - 7, x0 + 4, P0]; }
    hid.mask = R.hidCrack.mask.concat(P0 !== null ? R.hidCrack.inner.mask : []);
  }
  shapeRooms(rooms, fl, W, H, floor); // pillared halls, rings, cut corners, alcoves, spurs (33_shapes)
  const hidMask = hid && hid.mask ? hid.mask : []; for (const i of hidMask) fl[i] = 0; // (a hidden wing's floor behind its walls, painted as rock: back after the paint)
  // ---- paint, the way the tileset is built: dark is solid rock, the beige rim is the top edge of the rock, and a brick face
  // stands under every rim that faces south. Wall pieces are overlays: the floor runs on underneath them.
  const cv = mkCanvas(W * TS, H * TS), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const cc = mkCanvas(W * TS, H * TS), cg = cc.getContext('2d'); cg.imageSmoothingEnabled = false; // the ceiling layer
  const cn = mkCanvas(W * TS, H * TS), cng = cn.getContext('2d'); cng.imageSmoothingEnabled = false; // the north walls' trim (CEIL_N)
  g.fillStyle = '#121418'; g.fillRect(0, 0, cv.width, cv.height);
  const isF = (x, y) => x >= 0 && y >= 0 && x < W && y < H && fl[y * W + x] === 1;
  const face = (x, y) => !isF(x, y) && isF(x, y + 1), O = (x, y) => isF(x, y) || face(x, y);
  const inRoomRect = (x, y) => rooms.some(r => x >= r.fx0 && x <= r.fx1 && y >= r.fy0 && y <= r.fy1);
  const near = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (O(x + dx, y + dy)) return true; return false; };
  const floorRow = th.floors[0][1], hallRow = floorRow + 2; // the plain slab, light in the rooms and its darker twin in the corridors
  // three free tiles of north wall, clear of any doorway by a tile, as near the middle as they come
  const wallSpot = r => { const nd = r.doors.filter(d => d.side === 'N').flatMap(d => d.cells.map(c => c[0])); let best = r.cx - 1, bd = 1e9; for (let x = r.ix0 + 1; x + 2 <= r.ix1 - 1; x++) { if (nd.some(c => c >= x - 1 && c <= x + 3)) continue; const d = Math.abs(x + 1 - (r.ix0 + r.ix1) / 2); if (d < bd) { bd = d; best = x; } } return best; };
  for (const r of rooms) if (r.kind === 'start' || r.kind === 'end') r.stairX = wallSpot(r); // (before the floor is laid: the crypt's wear runs from the stairs too)
  if (th.sheet === 'crypt') cryptFloor(g, W, H, near, inRoomRect, rooms, halls);
  else for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (near(x, y)) tileAt(g, 10, inRoomRect(x, y) ? floorRow : hallRow, x * TS, y * TS);
  // an inlaid square now and then: four corner slabs that only make sense together, or the small one-slab square
  if (th.sheet !== 'crypt') for (const r of rooms) { // (the crypt's broken slabs: cryptFloor)
    const n = Math.round(r.w * r.h / 70); for (let k = 0; k < n; k++) {
      const x = randi(r.ix0 + 1, r.ix1 - 2), y = randi(r.iy0 + 1, r.iy1 - 2); if (r.inlay && r.inlay.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - y) < 3)) continue; (r.inlay = r.inlay || []).push([x, y]);
      const four = chance(0.6); if (!(four ? isF(x, y) && isF(x + 1, y) && isF(x, y + 1) && isF(x + 1, y + 1) : isF(x, y))) { r.inlay.pop(); continue; } // (only on open floor: never on rock a room's shape left standing)
      if (four) { tileAt(g, 13, floorRow, x * TS, y * TS); tileAt(g, 11, floorRow, (x + 1) * TS, y * TS); tileAt(g, 14, floorRow, x * TS, (y + 1) * TS); tileAt(g, 12, floorRow, (x + 1) * TS, (y + 1) * TS); }
      else tileAt(g, 15, floorRow, x * TS, y * TS);
    }
  }
  const put = (c, tx, ty, x, y, flip) => { c.save(); c.translate(flip ? (x + 1) * TS : x * TS, y * TS); if (flip) c.scale(-1, 1); const [im, sx, sy] = srcOf(tx, ty + th.fy); c.drawImage(im, sx, sy, TS, TS, 0, 0, TS, TS); c.restore(); };
  const wt = new Uint16Array(W * H), wf = new Uint8Array(W * H); // which wall piece went where (tx * 64 + ty + 1), mirrored or not, for what is built against the walls later
  const T = (tx, ty, x, y, flip) => {
    put(g, tx, ty, x, y, flip); wt[y * W + x] = tx * 64 + ty + 1; wf[y * W + x] = flip ? 1 : 0; const m = (th.ceilN || CEIL_N)[tx + ',' + ty]; if (!m) return; // (the ceiling itself: paintCeil, below)
    const R = m.map(([mx, my, mw, mh]) => [x * TS + (flip ? TS - mx - mw : mx), y * TS + my, mw, mh]);
    cng.save(); cng.beginPath(); for (const [rx, ry, rw, rh] of R) cng.rect(rx, ry, rw, rh); cng.clip(); put(cng, tx, ty, x, y, flip); cng.restore();
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const P = wallPiece(isF, x, y); if (P) T(P[0], P[1], x, y, P[2]); }
  if (th.sheet === 'crypt') { g.fillStyle = '#121418'; for (const r of rooms) for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) if (!wt[y * W + x] && !isF(x, y)) g.fillRect(x * TS, y * TS, TS, TS); } // (the inside of a block of wall standing in a crypt room is the wall's dark top, as its edges are)
  const A = ARENA = { arch: ARCH.cur, w: W, h: H, pw: W * TS, ph: H * TS, th, ground: cv, g, ceil: cc, ceilN: cn, fl, wt, wf, rooms, halls, props: [], torches: [], name: floorName(floor), floor, liq, moss: th.sheet === 'crypt' && floor >= 6 }; // (liq: what the crypt's pools hold, 36_works LIQUIDS; moss: the deepest crypt's dead grown over, 43_crypt)
  paintCeil(A, cg, cv); // the painted trim, as drawn on the ground: the ceiling over everyone (31_walls)
  for (const i of hidMask) fl[i] = 1;
  for (const h of halls) h.frame = shortHall(h) && chance(0.6);
  A.doors = rooms.flatMap(r => r.doors.filter(d => !d.hidden).map(d => Object.assign(d, { room: r.i, k: 0, strut: th.sheet !== 'crypt' && (d.side === 'S' || d.side === 'N') && (d.hall.frame || chance(0.12)), motif: pick([0, 5, 10]) }))); // (strut: a north or south doorway's, now and then, and at both ends of most short straight corridors, the two facing each other: a square frame; a blast door's always, 41_puzzles makeGate; 32_crawl)
  A.start = rooms.find(r => r.kind === 'start'); A.end = rooms.find(r => r.kind === 'end');
  for (const r of rooms) if (r.hidCrack) { r.crack = r.hidCrack; r.crackX = r.crack.x; (A.cracks = A.cracks || []).push(r.crack); if (r.crack.inner) A.cracks.push(r.crack.inner); A.secret = A.secret || new Uint8Array(W * H); for (const c of [r.crack, r.crack.inner]) if (c) for (const i of c.secret) A.secret[i] = 1; } // (the hidden wing's walled-up doorway)
  // ---- furnishing (the stairways' places first, so no torch or banner hangs on them)
  if (!rooms.some(q => q.kind === 'treasure')) { const q = pick(rooms.filter(q => q.kind === 'room' && !q.shape)) || pick(rooms.filter(q => q.kind === 'room')); if (q) q.chest = true; } // no dead end: a guarded room keeps the chest
  levelPlan(A, g); // the floor's set pieces: a flooded way, a gauntlet, a sentinel (37_levels)
  pitPlan(A, g); // a chasm, broken floor, the ledges (38_pits)
  for (const r of rooms) worksBefore(A, r, g); // a cistern, a rune shrine (36_works)
  for (const r of rooms) { furnish(A, r, g); shapeAfter(A, r); } // (what stands in the alcoves: 33_shapes)
  mapChest(A); // (the floor's map, in one of its small chests)
  for (const r of rooms) worksAfter(A, r); for (const r of rooms) levelAfter(A, r); for (const r of rooms) puzzleAfter(A, r); spikeHalls(A); corridorWood(A, g); if (th.sheet === 'crypt') { cryptGalleries(A, g); cryptDress(A, g); } wayArrows(A, g); // (the crypt's dead, on floor nothing else needs: 43_crypt)
  // the stairway we came down, in the start room's north wall; the way down waits shut in the end room's
  { const r = A.start, sx = r.stairX; for (let i = 0; i < 3; i++) { tileAt(g, th.stairs + i, 12, (sx + i) * TS, r.fy0 * TS); tileAt(g, th.stairs + i, 13, (sx + i) * TS, (r.fy0 + 1) * TS); } }
  { const r = A.end, sx = r.stairX; for (let i = 0; i < 3; i++) { tileAt(g, th.stairs + i, 14, (sx + i) * TS, r.fy0 * TS); tileAt(g, th.stairs + i, 15, (sx + i) * TS, (r.fy0 + 1) * TS); } A.stairs = { x: (sx + 1.5) * TS, y: (r.fy0 + 2) * TS + 2, sx, sy: r.fy0, room: r.i };
    for (const tx of [sx - 1, sx + 3]) A.torches.push({ x: tx * TS + 8, y: (r.fy0 + 1) * TS + 9, tx, f: randi(0, 3), out: true, exit: true }); } // a dead torch each side of it, lit as a hero comes near (36_works)
  // the hero comes down the stairway in the start room's north wall and steps out of it into the room
  A.spawn = { x: (A.start.stairX + 1.5) * TS, y: (A.start.fy0 + 2) * TS + 16, from: (A.start.fy0 + 2) * TS - 14 };
  Object.assign(A, { x0: TS, x1: (A.w - 1) * TS, y0: TS, y1: (A.h - 1) * TS });
  return A;
}
// what stands about a cellar (sheet tile x, y, its kind, how many tiles tall, how many wide): pots, the two small chests,
// crates and crate stacks, the heap of sacks, and the heaps of crates two tiles wide and two high; all of it breaks
const CLUTTER = [[24, 8], [25, 8], [26, 8], [27, 8], [28, 8], [30, 8], [25, 12, 'crate'], [26, 12, 'crate'], [24, 13, 'crate'], [25, 13, 'crate'], [26, 13, 'crate']];
const STOCK = [[25, 12, 'crate'], [26, 12, 'crate'], [24, 13, 'crate'], [25, 13, 'crate'], [26, 13, 'crate'], [27, 12, 'crate', 2], [28, 12, 'crate', 2], [29, 12, 'crate', 2], [22, 8, 'sacks', 1, 2], [24, 8], [26, 8], [24, 14, 'crate', 2, 2], [26, 14, 'crate', 2, 2], [28, 14, 'crate', 2, 2]].map(t => t[2] ? t : [t[0], t[1], 'barrel']);
// The floor's map lies in one of its small wooden chests (not in the room you come down into, if it can be helped); a floor
// with none gets one, in a free corner of one of its rooms. Picked up, the whole floor is remembered (53_foes takeItem).
function mapChest(A) {
  let ch = A.props.filter(p => p.kind === 'chest' && !p.dead);
  if (!ch.length) for (const r of pitShuffle(A.rooms.filter(r => r.kind === 'room' && !r.set && !r.pool && !r.shrine))) {
    const near = (tx, ty) => r.doors.some(d => d.cells.some(([x, y]) => Math.abs(x - tx) <= 2 && Math.abs(y - ty) <= 2));
    const at = pitShuffle([[r.ix0, r.iy0], [r.ix1, r.iy0], [r.ix0, r.iy1], [r.ix1, r.iy1]]).find(([x, y]) => FLOOR(A.fl[y * A.w + x]) && !(A.crumbleSet && A.crumbleSet.has(y * A.w + x)) && !near(x, y) && !A.props.some(p => !p.dead && Math.abs(p.x - (x * TS + 8)) < 18 && Math.abs(p.y - (y * TS + 14)) < 18));
    if (at) { A.props.push({ kind: 'chest', tile: [pick([28, 30]), 8], th: 1, x: at[0] * TS + 8, y: at[1] * TS + 14, cy: at[1] * TS + 10, r: 5, solid: true, hp: 40, room: r.i }); ch = A.props.filter(p => p.kind === 'chest'); break; }
  }
  const away = ch.filter(p => p.room !== A.start.i); if (ch.length) pick(away.length ? away : ch).map = true;
}
// where a room's treasure chest stands: against the north wall, as near the middle as a spot clear of the doors comes, or
// else in the middle of the room (in the crypt never off its middle line)
function chestSpot(r) {
  const nearDoor = (tx, ty) => r.doors.some(d => d.cells.some(([x, y]) => Math.abs(x - tx) <= 2 && Math.abs(y - ty) <= 2)), cx = Math.round((r.ix0 + r.ix1) / 2);
  const A = ARENA, fr = (x, y) => FLOOR(A.fl[y * A.w + x]) && FLOOR(A.fl[(y + 1) * A.w + x]);
  if (TH && TH.sheet === 'crypt') { const cy = Math.round((r.iy0 + r.iy1) / 2), s = [[cx, r.iy0 + 1], [cx, cy], [cx, cy + 1], [cx, cy - 1], [cx, r.iy1 - 1]].find(([x, y]) => !nearDoor(x, y) && fr(x, y)); if (s) return s; } // (the crypt's: only on the room's middle line, against the north wall or else where its worn paths meet: the feet went to it)
  const spots = [0, 1, -1, 2, -2, 3, -3].map(k => [cx + k, r.iy0 + 1]).concat([[cx, Math.round((r.iy0 + r.iy1) / 2)]]); return spots.find(([x, y]) => !nearDoor(x, y) && fr(x, y)) || spots.find(([x, y]) => fr(x, y)) || spots[spots.length - 1];
}
// torches, banners, braziers, clutter and pillars for one room
function furnish(A, r, g) {
  if (r.kind === 'shop') { shopFit(A, r, g); return; } // (a scene of its own: 39_shop)
  const th = A.th, nearDoor = (tx, ty, m = 2) => r.doors.some(d => d.cells.some(([x, y]) => Math.abs(x - tx) <= m && Math.abs(y - ty) <= m)), used = new Set();
  for (const d of r.doors) if (d.side === 'N') for (const [x] of d.cells) for (let k = -2; k <= 2; k++) used.add(x + k);
  if (r.stairX !== undefined) for (let k = -1; k <= 3; k++) used.add(r.stairX + k);
  if (r.sluiceX != null) for (let k = -1; k <= 1; k++) used.add(r.sluiceX + k); // (a sluice's outlet goes there: 37_levels)
  if (r.crackX !== undefined) for (let k = -1; k <= 3; k++) used.add(r.crackX + k); // (a cracked wall: 41_puzzles)
  if (th.sheet === 'crypt') cryptWall(A, r, g, used); // (the crypt's: candle niches and niches of the dead, mirrored: 43_crypt)
  else for (let x = r.ix0 + 1; x < r.ix1; x += r.great === 'h' ? 5 : 4) { const tx = x + (used.has(x) ? 3 : 0); if (tx >= r.ix1 || used.has(tx) || !plainWall(A, tx, r.fy0 + 1)) continue; used.add(tx); A.torches.push({ x: tx * TS + 8, y: (r.fy0 + 1) * TS + 9, tx, f: randi(0, 3) }); }
  // a banner: one of the twelve tall ones ([20..31, 0..1], the rod low in the upper tile) or one of the eight small ones
  // ([16..19, 0..1], one tile, the rod at its top; hung so its rod is level with the tall ones' and it hangs as low)
  if (th.sheet !== 'crypt') for (let x = r.ix0 + 1; x < r.ix1; x++) {
    if (used.has(x) || used.has(x - 1) || used.has(x + 1) || !plainWall(A, x, r.fy0 + 1) || !chance(0.3)) continue; const b = randi(0, 19);
    if (b < 12) { tileAt(g, 20 + b, 0, x * TS, r.fy0 * TS); tileAt(g, 20 + b, 1, x * TS, (r.fy0 + 1) * TS); } else tileAt(g, 16 + (b - 12) % 4, (b - 12) >> 2, x * TS, r.fy0 * TS + 11);
    used.add(x);
  }
  // between the banners, now and then a barred window or a vent in the brick (grey [16..20, 2..3], brown three rows down);
  // the tall arched windows and the tall vent ([17..18, 2..3], [20, 2..3]) are two tiles high, their tops in the brick above
  const wy = th.tone === 'brown' ? 3 : 0, WIN = [[16, 2, 1], [16, 3, 1], [17, 3, 2], [18, 3, 2], [19, 2, 1], [19, 3, 1], [20, 3, 2]];
  if (th.sheet !== 'crypt') for (let x = r.ix0 + 1; x < r.ix1; x++) { if (used.has(x) || !plainWall(A, x, r.fy0 + 1) || !chance(0.16)) continue; const [wx, wy0, wh] = pick(WIN); for (let j = 0; j < wh; j++) tileAt(g, wx, wy0 + wy - j, x * TS, (r.fy0 + 1 - j) * TS); used.add(x); }
  if (r.rock && r.rock.size) blockDecor(A, r, g); // (the faces of the blocks its shape left standing: 33_shapes)
  const prop = (kind, tx, ty, o = {}) => { if (A.noProp && A.noProp.has(Math.floor(ty) * A.w + Math.floor(tx)) || !FLOOR(A.fl[Math.floor(ty) * A.w + Math.floor(tx)]) || !FLOOR(A.fl[Math.floor(ty) * A.w + Math.ceil(tx)]) || A.crumbleSet && (A.crumbleSet.has(Math.floor(ty) * A.w + Math.floor(tx)) || A.crumbleSet.has(Math.floor(ty) * A.w + Math.ceil(tx)))) return; A.props.push(Object.assign({ kind, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 5, solid: true, hp: 1e9, room: r.i }, o)); }; // (never in water, nor on a cracked slab: 38_pits)
  const free = (x, y, d = 10) => !A.props.some(p => Math.abs(p.x - x) < d && Math.abs(p.y - y) < d);
  const BZ = th.sheet === 'crypt' ? [[r.ix0 + 1, r.iy0 + 1], [r.ix1 - 1, r.iy0 + 1]] : [[r.ix0 + 1, r.iy1 - 1], [r.ix1 - 1, r.iy0 + 1]]; /* (the crypt's: a mirrored pair, both or neither) */
  if (r.w * r.h >= 100 && (th.sheet !== 'crypt' || BZ.every(([tx, ty]) => !nearDoor(tx, ty) && FLOOR(A.fl[ty * A.w + tx]) && !(A.noProp && A.noProp.has(ty * A.w + tx))))) for (const [tx, ty] of BZ) if (!nearDoor(tx, ty)) prop('brazier', tx, ty, { f: th.sheet === 'crypt' ? tx % 4 : randi(0, 3), pair: th.sheet === 'crypt' ? 'bz' + r.i : undefined }); // (the crypt's: a mirrored pair in its north corners)
  if (th.sheet === 'crypt') { cryptFurnish(A, r, g, prop, nearDoor); lightless(A, r); return; } // (43_crypt: by rule, no crates)
  if (themeRoom(A, r, prop, nearDoor)) { lightless(A, r); return; } // (a warehouse, a pottery, a cart shed, a statue gallery: 35_themes)
  const corner = (cx, cy) => { for (let i = 0; i < randi(1, 3); i++) { const tx = clamp(cx + randi(-1, 1), r.ix0, r.ix1), ty = clamp(cy + randi(-1, 1), r.iy0, r.iy1); if (nearDoor(tx, ty) || !free(tx * TS + 8, ty * TS + 14)) continue; const t = pick(CLUTTER); prop(t[2] || (t[0] >= 28 && t[1] === 8 ? 'chest' : 'barrel'), tx, ty, { tile: [t[0], t[1]], th: t[3] || 1, hp: 40 }); } };
  corner(r.ix0, r.iy0); corner(r.ix1, r.iy0); corner(r.ix0, r.iy1); corner(r.ix1, r.iy1);
  if (r.kind === 'room' && !r.pool && !r.shrine && !r.set && chance(0.3)) for (let x = r.ix0 + 1; x < r.ix1; x++) { // a storeroom: stock along its north wall
    if (!chance(0.45) || nearDoor(x, r.iy0, 2) || (r.stairX !== undefined && x >= r.stairX - 1 && x <= r.stairX + 3) || !free(x * TS + 8, r.iy0 * TS + 14, 14)) continue;
    // a two-wide heap takes this tile and the next whole (set between them), so it never laps over a neighbour
    let t = pick(STOCK); const two = (t[4] || 1) > 1;
    if (two && (x + 1 >= r.ix1 || nearDoor(x + 1, r.iy0, 2) || (r.stairX !== undefined && x + 1 >= r.stairX - 1 && x + 1 <= r.stairX + 3) || !free((x + 1) * TS + 8, r.iy0 * TS + 14, 14))) t = STOCK[0];
    const w = t[4] || 1; prop(t[2], x + (w - 1) / 2, r.iy0, { tile: [t[0], t[1]], th: t[3] || 1, tw: w, hp: 40, r: w > 1 ? 9 : 5 }); if (w > 1) x++;
  }
  if (r.kind === 'treasure' || r.chest) { const at = chestSpot(r); prop('tchest', at[0], at[1], { tier: chestTier(A.floor), hp: 1, r: 6, open: false }); } // its treasure chest
  if ((r.kind === 'room' || r.kind === 'end') && !r.pool && !r.shrine && !r.set && !r.shape) {
    if (r.w >= 15 && r.h >= 9 && chance(0.7) && !r.great) { const P = th.pillar[randi(0, 1)]; for (const [fx, fy] of chance(0.5) ? [[0.27, 0.4], [0.73, 0.4], [0.27, 0.78], [0.73, 0.78]] : [[0.3, 0.55], [0.7, 0.55]]) { const tx = Math.round(r.ix0 + fx * (r.w - 1)), ty = Math.max(r.iy0 + 3, Math.round(r.iy0 + fy * (r.h - 1))); if (!nearDoor(tx, ty, 2)) prop('pillar', tx, ty, { tile: P, r: 6 }); } }
  }
  lightless(A, r);
}
// (THE LIGHTLESS: half its rooms dark; deeper down, now and then one anyway: 35_themes)
function lightless(A, r) { if (r.kind === 'room' && !r.set && !r.shrine && !r.dark && chance(ARCH.cur.dark || (A.floor >= 3 ? 0.08 : 0))) { r.dark = true; darkRoom(A, r, false); } } // (it stays dark: its braziers empty)
function inArena(x, y) { return ARENA && x > ARENA.x0 - 4 && x < ARENA.x1 + 4 && y > ARENA.y0 - 8 && y < ARENA.y1 + 4 && !solidAt(x, y); }
function nearestSolid(x, y, r) { for (const p of ARENA.props) if (p.solid && !p.dead && dist(x, y, p.x, p.cy) < r + p.r) return p; return null; }
// walls and shut doors
// The floor is kept in 256-pixel squares. Blood, cracks and scorch marks change only the squares they touch, so a phone re-sends
// a small picture to its graphics chip instead of the whole map every time something bleeds.
const CHUNK = 256;
function groundChunks(A) {
  if (A.chunks) return A.chunks; A.chunks = [];
  for (let y = 0; y < A.ph; y += CHUNK) for (let x = 0; x < A.pw; x += CHUNK) {
    const w = Math.min(CHUNK, A.pw - x), h = Math.min(CHUNK, A.ph - y), cv = mkCanvas(w, h), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false; g.drawImage(A.ground, x, y, w, h, 0, 0, w, h); g.setTransform(1, 0, 0, 1, -x, -y); A.chunks.push({ x, y, w, h, cv, g });
  }
  A.lum = groundSeen(A.ground); A.ground = A.g = null; if (A.keepClean) keepClean(A); return A.chunks;
}
// which pixels of the floor's picture are drawn at all (stone, floor, a wall's face): not the black rock, which is no
// picture, only the dark behind it, nor what a wall's top covers (that is the ceiling, drawn over it). Blood and acid are
// painted only where it is drawn (45_blood onStone), or they show up as spots in the black
function groundSeen(cv) {
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, m = new Uint8Array(cv.width * cv.height);
  for (let i = 0, j = 0; j < m.length; i += 4, j++) m[j] = d[i + 3] > 0 && d[i] + d[i + 1] + d[i + 2] > 90 ? 1 : 0; // (the black behind it all, #121418, and the wall tops' near-black, #141619, are not ground: the darkest stone is #332c22)
  return m;
}
// fn paints in map coordinates into every square the box touches
function groundPaint(x0, y0, x1, y1, fn) { const A = ARENA; if (!A) return; for (const k of groundChunks(A)) if (x1 >= k.x && x0 < k.x + k.w && y1 >= k.y && y0 < k.y + k.h) { fn(k.g); pitMend(A, k.g, x0, y0, x1, y1); } bridgePaint(x0, y0, x1, y1, fn); } // (no mark stays on a pit: 38_pits) // (and on a bridge's slats: 36_works)
// draws the floor inside a box of the map (c is already in map coordinates)
// the ceiling layer over a box of the map (on the glow layer, 'destination-out' cuts the glow away under it)
function drawCeil(c, sx, sy, sw, sh, C = ARENA.ceil) {
  const x0 = Math.max(0, Math.floor(sx)), y0 = Math.max(0, Math.floor(sy)), x1 = Math.min(C.width, Math.ceil(sx + sw)), y1 = Math.min(C.height, Math.ceil(sy + sh));
  if (x1 > x0 && y1 > y0) c.drawImage(C, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
}
function drawGround(c, sx, sy, sw, sh) {
  for (const k of groundChunks(ARENA)) { const x0 = Math.max(sx, k.x), y0 = Math.max(sy, k.y), x1 = Math.min(sx + sw, k.x + k.w), y1 = Math.min(sy + sh, k.y + k.h); if (x1 > x0 && y1 > y0) c.drawImage(k.cv, x0 - k.x, y0 - k.y, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); }
}
// The floor grid: 0 rock, 1 floor, 2 water (feet cannot go in, but sight and shots pass over it), 3 a bridge over water
// (floor). solid*: rock, for sight and shots; block*: rock or water, for feet.
const FLOOR = v => v === 1 || v === 3;
function solidTile(tx, ty) { const A = ARENA; if (tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return true; return A.fl[ty * A.w + tx] === 0; }
function blockTile(tx, ty) { const A = ARENA; if (tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return true; return !FLOOR(A.fl[ty * A.w + tx]); }
// (what of a tile stops feet: 31_walls' wallBoxes, from the painted pieces)
function blockAt(x, y) { if (!ARENA || !ARENA.fl) return false; const B = wallBoxes(Math.floor(x / TS), Math.floor(y / TS)); if (B) for (const b of B) if (x >= b[0] && x < b[2] && y >= b[1] && y < b[3]) return true; return false; }
// the tile a point counts as standing on: a wall piece's floor belongs to the floor tile it opens onto (a south wall's
// row behind the room to the room's tile north of it, a side wall's strip to the floor beside it)
function footTile(x, y) {
  const A = ARENA, tx = Math.floor(x / TS), ty = Math.floor(y / TS), i = ty * A.w + tx; return openAt(x, y) && A.home[i] >= 0 ? A.home[i] : i;
}
// sight and shots: rock stops them, but for the floor of a wall piece (a south wall's row behind the room)
function solidAt(x, y) { return ARENA && ARENA.fl ? solidTile(Math.floor(x / TS), Math.floor(y / TS)) && !openAt(x, y) : false; }
function roomAt(x, y, m = 0) { const A = ARENA; if (!A || !A.rooms) return null; const tx = x / TS, ty = y / TS; for (const r of A.rooms) if (tx >= r.ix0 + m && tx < r.ix1 + 1 - m && ty >= r.iy0 + m && ty < r.iy1 + 1 - m) return r; return null; }
// a unit's feet are a small box; push it out of any wall tile it overlaps
// a move, one axis at a time and in short steps: a step that would put the body into rock or water stops it flush against
// it (so a fast dash or lunge never cuts in deep enough to be pushed out on the wrong side, along the water and into it)
function slideMove(u, dx, dy) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4)); for (let i = 0; i < n; i++) { slideAxis(u, dx / n, 0); slideAxis(u, dy / n, 1); }
}
function slideAxis(u, d, ax) {
  if (!d || !ARENA || !ARENA.fl) { if (ax) u.y += d; else u.x += d; return; } const hw = Math.max(3, u.r * 0.8), hh = Math.max(2, u.r * 0.45);
  if (ax) u.y += d; else u.x += d;
  const k = 0.02, tx0 = Math.floor((u.x - hw + k) / TS), tx1 = Math.floor((u.x + hw - k) / TS), ty0 = Math.floor((u.y - hh + k) / TS), ty1 = Math.floor((u.y + hh - k) / TS); let e = null; // (touching is not in)
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const B = wallBoxes(tx, ty); if (B) for (const b of B) {
      if (u.x + hw - k <= b[0] || u.x - hw + k >= b[2] || u.y + hh - k <= b[1] || u.y - hh + k >= b[3]) continue;
      const v = ax ? (d > 0 ? b[1] - hh - 0.01 : b[3] + hh + 0.01) : (d > 0 ? b[0] - hw - 0.01 : b[2] + hw + 0.01);
      if (e === null || (d > 0 ? v < e : v > e)) e = v;
    }
  }
  if (e === null) return;
  if (ax) { u.y = (d > 0 ? Math.max : Math.min)(u.y - d, e); u.ky *= -0.3; } else { u.x = (d > 0 ? Math.max : Math.min)(u.x - d, e); u.kx *= -0.3; } // flush, never back past where it started
}
function tileCollide(u) {
  const A = ARENA; if (!A || !A.fl) return; const hw = Math.max(3, u.r * 0.8), hh = Math.max(2, u.r * 0.45);
  for (let pass = 0; pass < 2; pass++) {
    const tx0 = Math.floor((u.x - hw) / TS), tx1 = Math.floor((u.x + hw) / TS), ty0 = Math.floor((u.y - hh) / TS), ty1 = Math.floor((u.y + hh) / TS);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const B = wallBoxes(tx, ty); if (B) for (const b of B) {
        const ox = Math.min(u.x + hw - b[0], b[2] - (u.x - hw)), oy = Math.min(u.y + hh - b[1], b[3] - (u.y - hh));
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) { const s = u.x < (b[0] + b[2]) / 2 ? -1 : 1; u.x += s * ox; u.kx *= -0.3; } else { const s = u.y < (b[1] + b[3]) / 2 ? -1 : 1; u.y += s * oy; u.ky *= -0.3; }
      }
    }
  }
}
