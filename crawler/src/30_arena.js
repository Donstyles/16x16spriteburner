// ===================== the dungeon: a floor of rooms and corridors, built from the FG_Cellar tileset =====================
// Rooms sit one to a cell of a coarse grid; neighbouring rooms are joined by straight corridors three tiles wide that run
// along the cells' centre lines, so every corridor meets its rooms square on. Everything that is not floor is wall.
const THEMES = {
  brown: { fy: 0, floors: [[10, 1], [10, 1], [10, 1], [10, 1], [10, 3], [11, 1], [12, 1], [13, 3], [14, 1], [15, 3]], pillar: [[21, 5], [23, 5]], stairs: 19, rune: [27, 7], amb: [92, 78, 70], door: 7 },
  grey: { fy: 7, floors: [[10, 9], [10, 9], [10, 9], [10, 9], [10, 11], [11, 9], [12, 9], [13, 11], [14, 9], [15, 11]], pillar: [[21, 2], [23, 2]], stairs: 16, rune: [27, 4], amb: [60, 66, 88], door: 1 },
};
const FLOOR_NAMES = ['THE ROOT CELLAR', 'THE SALT VAULT', 'THE DROWNED STORES', 'THE BONE PANTRY', 'THE ASHEN KILN', 'THE WINE CRYPT', 'THE GRAIN TOMB', 'THE IRON LARDER', 'THE HOLLOW CISTERN', 'THE ROTTED GRANARY', 'THE BLACK BREWERY', 'THE DEEP MILL', 'THE SCREAMING SILO', 'THE LAST LARDER'];
let ARENA = null;
const CW = 24, CH = 17; // one grid cell, in tiles
// The tops of the south, east and west walls are at the ceiling: nothing in the room passes over them, so their painted
// trim is drawn into a ceiling layer over everything else (31_walls).
// A north wall is behind whoever stands at its foot: its brick face and the trim along its top (the light top, its south
// face and the dark line under it) stay under the units. That trim goes on a layer of its own, which only keeps the glows
// off the top of the wall, as the ceiling does.
const CEIL_N = { '6,0': [[0, 0, 16, 11]] };
function tileAt(g, tx, ty, dx, dy) { g.drawImage(IMG.cellar, tx * TS, ty * TS, TS, TS, dx, dy, TS, TS); }
function buildArena(floor) {
  const th = floor % 2 ? THEMES.brown : THEMES.grey, GW = floor <= 2 ? 3 : 4, GH = 3;
  const N = Math.min(GW * GH - 1, 5 + Math.min(4, Math.floor((floor + 1) / 2)));
  // ---- the room graph: grown outward from the start cell, then a loop or two so not every floor is a single line
  const key = (x, y) => y * GW + x, cells = new Map(), edges = [];
  const s0 = [randi(0, GW - 1), randi(0, GH - 1)]; cells.set(key(...s0), s0);
  const nb = ([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < GW && b < GH);
  let guard = 0; while (cells.size < N && guard++ < 500) { const c = pick([...cells.values()]), n = pick(nb(c)); if (cells.has(key(...n))) continue; cells.set(key(...n), n); edges.push([key(...c), key(...n)]); }
  const has = (a, b) => edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
  let loops = 0; for (const c of cells.values()) for (const n of nb(c)) { const a = key(...c), b = key(...n); if (a < b && cells.has(b) && !has(a, b) && loops < 2 && chance(0.3)) { edges.push([a, b]); loops++; } }
  // the end room is the one farthest from the start
  const adj = k => edges.filter(e => e[0] === k || e[1] === k).map(e => e[0] === k ? e[1] : e[0]);
  const far = new Map([[key(...s0), 0]]), q = [key(...s0)]; while (q.length) { const k = q.shift(); for (const n of adj(k)) if (!far.has(n)) { far.set(n, far.get(k) + 1); q.push(n); } }
  const endK = [...far.entries()].sort((a, b) => b[1] - a[1])[0][0], leaves = [...cells.keys()].filter(k => k !== endK && k !== key(...s0) && adj(k).length === 1);
  const treasK = leaves.length ? pick(leaves) : -1; // a dead end off the way, when there is one, holds the treasure
  // ---- rooms inside their cells; every room covers its cell's centre so the corridors can run straight
  const W = GW * CW, H = GH * CH, fl = new Uint8Array(W * H), rooms = [], byKey = new Map();
  for (const [k, [gx, gy]] of cells) {
    const kind = k === key(...s0) ? 'start' : k === endK ? 'end' : k === treasK ? 'treasure' : 'room';
    const big = kind === 'end', w = big ? randi(18, 20) : kind === 'start' ? randi(13, 14) : kind === 'treasure' ? randi(10, 12) : randi(12, 18), h = big ? randi(10, 12) : kind === 'start' || kind === 'treasure' ? randi(7, 8) : randi(7, 11);
    const X0 = gx * CW, Y0 = gy * CH, cx = X0 + CW / 2, cy = Y0 + 9;
    const ix0 = randi(Math.max(X0 + 2, cx + 3 - w), Math.min(cx - 2, X0 + CW - 2 - w)), iy0 = randi(Math.max(Y0 + 3, cy + 3 - h), Math.min(cy - 2, Y0 + CH - 2 - h));
    const r = { i: rooms.length, k, gx, gy, kind, cx, cy, ix0, iy0, ix1: ix0 + w - 1, iy1: iy0 + h - 1, fx0: ix0 - 1, fx1: ix0 + w, fy0: iy0 - 2, fy1: iy0 + h, w, h, doors: [] };
    r.px0 = r.fx0 * TS; r.py0 = r.fy0 * TS; r.px1 = (r.fx1 + 1) * TS; r.py1 = (r.fy1 + 1) * TS;
    r.b = { x0: ix0 * TS + 5, x1: (r.ix1 + 1) * TS - 5, y0: iy0 * TS + 4, y1: (r.iy1 + 1) * TS - 3 };
    rooms.push(r); byKey.set(k, r);
    for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) fl[y * W + x] = 1;
  }
  // ---- corridors: floor through both walls, the corridor's own walls between the rooms
  const halls = [];
  for (const [a, b] of edges) {
    let A = byKey.get(a), B = byKey.get(b); if (A.gx > B.gx || A.gy > B.gy) [A, B] = [B, A];
    if (A.gy === B.gy) { // side by side
      const y0 = A.cy - 1, x0 = A.fx1, x1 = B.fx0; for (let y = y0; y <= y0 + 2; y++) for (let x = x0; x <= x1; x++) fl[y * W + x] = 1;
      const hl = { dir: 'h', A, B, x0, x1, y0, px0: x0 * TS, py0: (y0 - 2) * TS, px1: (x1 + 1) * TS, py1: (y0 + 4) * TS }; halls.push(hl);
      A.doors.push({ side: 'E', cells: [[A.fx1, y0], [A.fx1, y0 + 1], [A.fx1, y0 + 2]], hall: hl }); B.doors.push({ side: 'W', cells: [[B.fx0, y0], [B.fx0, y0 + 1], [B.fx0, y0 + 2]], hall: hl });
    } else { // one above the other
      const x0 = A.cx - 1, y0 = A.fy1, y1 = B.fy0 + 1; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x0 + 2; x++) fl[y * W + x] = 1;
      const hl = { dir: 'v', A, B, x0, y0, y1, px0: (x0 - 1) * TS, py0: y0 * TS, px1: (x0 + 4) * TS, py1: (y1 + 1) * TS }; halls.push(hl);
      A.doors.push({ side: 'S', cells: [[x0, A.fy1], [x0 + 1, A.fy1], [x0 + 2, A.fy1]], hall: hl }); B.doors.push({ side: 'N', cells: [[x0, B.fy0 + 1], [x0 + 1, B.fy0 + 1], [x0 + 2, B.fy0 + 1]], hall: hl });
    }
  }
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
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (near(x, y)) tileAt(g, 10, inRoomRect(x, y) ? floorRow : hallRow, x * TS, y * TS);
  // an inlaid square now and then: four corner slabs that only make sense together, or the small one-slab square
  for (const r of rooms) {
    const n = Math.round(r.w * r.h / 70); for (let k = 0; k < n; k++) {
      const x = randi(r.ix0 + 1, r.ix1 - 2), y = randi(r.iy0 + 1, r.iy1 - 2); if (r.inlay && r.inlay.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - y) < 3)) continue; (r.inlay = r.inlay || []).push([x, y]);
      if (chance(0.6)) { tileAt(g, 13, floorRow, x * TS, y * TS); tileAt(g, 11, floorRow, (x + 1) * TS, y * TS); tileAt(g, 14, floorRow, x * TS, (y + 1) * TS); tileAt(g, 12, floorRow, (x + 1) * TS, (y + 1) * TS); }
      else tileAt(g, 15, floorRow, x * TS, y * TS);
    }
  }
  const put = (c, tx, ty, x, y, flip) => { c.save(); c.translate(flip ? (x + 1) * TS : x * TS, y * TS); if (flip) c.scale(-1, 1); c.drawImage(IMG.cellar, tx * TS, (ty + th.fy) * TS, TS, TS, 0, 0, TS, TS); c.restore(); };
  const wt = new Uint16Array(W * H), wf = new Uint8Array(W * H); // which wall piece went where (tx * 64 + ty + 1), mirrored or not, for what is built against the walls later
  const T = (tx, ty, x, y, flip) => {
    put(g, tx, ty, x, y, flip); wt[y * W + x] = tx * 64 + ty + 1; wf[y * W + x] = flip ? 1 : 0; const m = CEIL_N[tx + ',' + ty]; if (!m) return; // (the ceiling itself: paintCeil, below)
    const R = m.map(([mx, my, mw, mh]) => [x * TS + (flip ? TS - mx - mw : mx), y * TS + my, mw, mh]);
    cng.save(); cng.beginPath(); for (const [rx, ry, rw, rh] of R) cng.rect(rx, ry, rw, rh); cng.clip(); put(cng, tx, ty, x, y, flip); cng.restore();
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (isF(x, y)) continue;
    if (face(x, y)) { // the brick face; where floor runs past its end, the block's end piece
      const lf = isF(x - 1, y), rf = isF(x + 1, y); if (rf && !lf) T(3, 3, x, y); else if (lf && !rf) T(3, 3, x, y, true); else T(6, 1, x, y); continue;
    }
    const n = O(x, y - 1), e = O(x + 1, y), s = O(x, y + 1), w = O(x - 1, y);
    if (n && e) T(3, 0, x, y); else if (n && w) T(3, 0, x, y, true); // a corner of rock jutting into the floor
    else if (s && e) T(3, 2, x, y); else if (s && w) T(3, 2, x, y, true);
    else if (s) T(6, 0, x, y); else if (n) T(6, 3, x, y);
    else if (e) T(5, face(x + 1, y) ? 1 : 2, x, y); else if (w) T(7, face(x - 1, y) ? 1 : 2, x, y); // side walls; beside a brick face the rim runs down past it
    else if (O(x + 1, y + 1)) T(5, 0, x, y); else if (O(x - 1, y + 1)) T(7, 0, x, y); // the inside corners of a room
    else if (O(x + 1, y - 1)) T(5, 3, x, y); else if (O(x - 1, y - 1)) T(7, 3, x, y);
  }
  const A = ARENA = { w: W, h: H, pw: W * TS, ph: H * TS, th, ground: cv, g, ceil: cc, ceilN: cn, fl, wt, wf, rooms, halls, props: [], torches: [], name: floorName(floor), floor };
  paintCeil(A, cg, cv); // the painted trim, as drawn on the ground: the ceiling over everyone (31_walls)
  A.doors = rooms.flatMap(r => r.doors.map(d => Object.assign(d, { room: r.i, k: 0 })));
  A.start = rooms.find(r => r.kind === 'start'); A.end = rooms.find(r => r.kind === 'end');
  // ---- furnishing (the stairways' places first, so no torch or banner hangs on them)
  // three free tiles of north wall, clear of any doorway by a tile, as near the middle as they come
  const wallSpot = r => { const nd = r.doors.filter(d => d.side === 'N').flatMap(d => d.cells.map(c => c[0])); let best = r.cx - 1, bd = 1e9; for (let x = r.ix0 + 1; x + 2 <= r.ix1 - 1; x++) { if (nd.some(c => c >= x - 1 && c <= x + 3)) continue; const d = Math.abs(x + 1 - (r.ix0 + r.ix1) / 2); if (d < bd) { bd = d; best = x; } } return best; };
  A.start.stairX = wallSpot(A.start); A.end.stairX = wallSpot(A.end);
  if (!rooms.some(q => q.kind === 'treasure')) { const q = pick(rooms.filter(q => q.kind === 'room')); if (q) q.chest = true; } // no dead end: a guarded room keeps the chest
  levelPlan(A, g); // the floor's set pieces: a flooded way, a gauntlet, a sentinel (37_levels)
  pitPlan(A, g); // a chasm, broken floor, the ledges (38_pits)
  for (const r of rooms) worksBefore(A, r, g); // a cistern, a rune shrine (36_works)
  for (const r of rooms) furnish(A, r, g);
  mapChest(A); // (the floor's map, in one of its small chests)
  for (const r of rooms) worksAfter(A, r); for (const r of rooms) levelAfter(A, r); spikeHalls(A); corridorWood(A, g); wayArrows(A, g);
  // the stairway we came down, in the start room's north wall; the way down waits shut in the end room's
  { const r = A.start, sx = r.stairX; for (let i = 0; i < 3; i++) { tileAt(g, th.stairs + i, 12, (sx + i) * TS, r.fy0 * TS); tileAt(g, th.stairs + i, 13, (sx + i) * TS, (r.fy0 + 1) * TS); } }
  { const r = A.end, sx = r.stairX; for (let i = 0; i < 3; i++) { tileAt(g, th.stairs + i, 14, (sx + i) * TS, r.fy0 * TS); tileAt(g, th.stairs + i, 15, (sx + i) * TS, (r.fy0 + 1) * TS); } A.stairs = { x: (sx + 1.5) * TS, y: (r.fy0 + 2) * TS + 2, sx, sy: r.fy0, room: r.i }; }
  // the hero comes down the stairway in the start room's north wall and steps out of it into the room
  A.spawn = { x: (A.start.stairX + 1.5) * TS, y: (A.start.fy0 + 2) * TS + 16, from: (A.start.fy0 + 2) * TS - 14 };
  Object.assign(A, { x0: TS, x1: (A.w - 1) * TS, y0: TS, y1: (A.h - 1) * TS });
  return A;
}
// what stands about a cellar (sheet tile x, y, its kind, how many tiles tall, how many wide): pots, the two small chests,
// crates and crate stacks, and the heap of sacks; all of it breaks
const CLUTTER = [[24, 8], [25, 8], [26, 8], [27, 8], [28, 8], [30, 8], [25, 12, 'crate'], [26, 12, 'crate'], [24, 13, 'crate'], [25, 13, 'crate'], [26, 13, 'crate']];
const STOCK = [[25, 12, 'crate'], [26, 12, 'crate'], [24, 13, 'crate'], [25, 13, 'crate'], [26, 13, 'crate'], [27, 12, 'crate', 2], [28, 12, 'crate', 2], [29, 12, 'crate', 2], [22, 8, 'sacks', 1, 2], [24, 8], [26, 8]].map(t => t[2] ? t : [t[0], t[1], 'barrel']);
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
// else in the middle of the room
function chestSpot(r) {
  const nearDoor = (tx, ty) => r.doors.some(d => d.cells.some(([x, y]) => Math.abs(x - tx) <= 2 && Math.abs(y - ty) <= 2)), cx = Math.round((r.ix0 + r.ix1) / 2);
  const spots = [0, 1, -1, 2, -2, 3, -3].map(k => [cx + k, r.iy0 + 1]).concat([[cx, Math.round((r.iy0 + r.iy1) / 2)]]); return spots.find(([x, y]) => !nearDoor(x, y)) || spots[spots.length - 1];
}
// torches, banners, braziers, clutter and pillars for one room
function furnish(A, r, g) {
  const th = A.th, nearDoor = (tx, ty, m = 2) => r.doors.some(d => d.cells.some(([x, y]) => Math.abs(x - tx) <= m && Math.abs(y - ty) <= m)), used = new Set();
  for (const d of r.doors) if (d.side === 'N') for (const [x] of d.cells) for (let k = -2; k <= 2; k++) used.add(x + k);
  if (r.stairX !== undefined) for (let k = -1; k <= 3; k++) used.add(r.stairX + k);
  if (r.sluiceX !== undefined) for (let k = -1; k <= 1; k++) used.add(r.sluiceX + k); // (a sluice's outlet goes there: 37_levels)
  for (let x = r.ix0 + 1; x < r.ix1; x += 4) { const tx = x + (used.has(x) ? 3 : 0); if (tx >= r.ix1 || used.has(tx)) continue; used.add(tx); A.torches.push({ x: tx * TS + 8, y: (r.fy0 + 1) * TS + 9, tx, f: randi(0, 3) }); }
  for (let x = r.ix0 + 1; x < r.ix1; x++) { if (used.has(x) || used.has(x - 1) || used.has(x + 1) || !chance(0.3)) continue; const b = randi(20, 31); tileAt(g, b, 0, x * TS, r.fy0 * TS); tileAt(g, b, 1, x * TS, (r.fy0 + 1) * TS); used.add(x); }
  // between the banners, now and then a barred window or a vent in the brick (grey [16..20, 2..3], brown three rows down);
  // the tall arched windows and the tall vent ([17..18, 2..3], [20, 2..3]) are two tiles high, their tops in the brick above
  const wy = th === THEMES.brown ? 3 : 0, WIN = [[16, 2, 1], [16, 3, 1], [17, 3, 2], [18, 3, 2], [19, 2, 1], [19, 3, 1], [20, 3, 2]];
  for (let x = r.ix0 + 1; x < r.ix1; x++) { if (used.has(x) || !chance(0.16)) continue; const [wx, wy0, wh] = pick(WIN); for (let j = 0; j < wh; j++) tileAt(g, wx, wy0 + wy - j, x * TS, (r.fy0 + 1 - j) * TS); used.add(x); }
  const prop = (kind, tx, ty, o = {}) => { if (!FLOOR(A.fl[Math.floor(ty) * A.w + Math.floor(tx)]) || !FLOOR(A.fl[Math.floor(ty) * A.w + Math.ceil(tx)]) || A.crumbleSet && (A.crumbleSet.has(Math.floor(ty) * A.w + Math.floor(tx)) || A.crumbleSet.has(Math.floor(ty) * A.w + Math.ceil(tx)))) return; A.props.push(Object.assign({ kind, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 5, solid: true, hp: 1e9, room: r.i }, o)); }; // (never in water, nor on a cracked slab: 38_pits)
  const free = (x, y, d = 10) => !A.props.some(p => Math.abs(p.x - x) < d && Math.abs(p.y - y) < d);
  if (r.w * r.h >= 100) for (const [tx, ty] of [[r.ix0 + 1, r.iy1 - 1], [r.ix1 - 1, r.iy0 + 1]]) if (!nearDoor(tx, ty)) prop('brazier', tx, ty, { f: randi(0, 3) });
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
  if ((r.kind === 'room' || r.kind === 'end') && chance(0.35)) for (let i = randi(1, 2); i > 0; i--) { // an ore rock or two against a wall
    const west = chance(0.5), tx = west ? r.ix0 : r.ix1, ty = randi(r.iy0 + 1, r.iy1 - 1); if (!nearDoor(tx, ty, 2) && free(tx * TS + 8, ty * TS + 14)) prop('ore', tx, ty, { shape: randi(0, 6), ore: pick([0, 0, 1, 2, 3]), hp: 3, r: 6 }); }
  if ((r.kind === 'room' || r.kind === 'end') && !r.pool && !r.shrine && !r.set) {
    if (r.w >= 15 && r.h >= 9 && chance(0.7)) { const P = th.pillar[randi(0, 1)]; for (const [fx, fy] of chance(0.5) ? [[0.27, 0.4], [0.73, 0.4], [0.27, 0.78], [0.73, 0.78]] : [[0.3, 0.55], [0.7, 0.55]]) { const tx = Math.round(r.ix0 + fx * (r.w - 1)), ty = Math.max(r.iy0 + 3, Math.round(r.iy0 + fy * (r.h - 1))); if (!nearDoor(tx, ty, 2)) prop('pillar', tx, ty, { tile: P, r: 6 }); } }
  }
}
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
  A.ground = A.g = null; if (A.keepClean) keepClean(A); return A.chunks;
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
