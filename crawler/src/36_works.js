// ===================== the cellar's works: water, cisterns, bridges, pressure plates, rune plates, spike traps =====================
// All of it is made of the cellar sheet's own pieces, grey or brown after the floor's theme (sheet tile [x, y]):
// - water, of any shape: the sheet's water pieces are overlays (transparent where the floor shows through), two 3 x 3 sets
//   for each look. The outer set is a pool seen whole: its corners, its edges and its open middle; the island set is
//   water all round a hole of floor, so its pieces are the inside corners. Every water tile is put together from four
//   quarter tiles, each picked by that corner's neighbours (floor on both sides: an outer corner; on one: an edge; on
//   neither but the diagonal: an inside corner; none: open water). Square-cut stone (outer [20..22, 19..21], island
//   [20..22, 16..18]; brown [20..22, 26..28] / [20..22, 23..25]) lines the cisterns; rounded pools (outer
//   [16..18, 19..21], island [16..18, 16..18]; brown [16..18, 26..28] / [16..18, 23..25]) and deep rimless water
//   ([24..26, 19..21] / [24..26, 16..18]; [24..26, 26..28] / [24..26, 23..25]) lie about the rooms as ponds. The
//   dark band under a north rim is the water's sunken wall. Feet cannot go in; sight, arrows and spells pass over it.
//   Under a cistern's water lies its basin (the same water turned to wet stone) with a small drain grate ([18, 4] /
//   [18, 7], darkened wet) in the middle
// - a bridge across a cistern: the stone slats ([17, 29] grey, [21, 29] brown) laid two wide along a north-south bridge,
//   and the upright slats ([16, 30] / [20, 30]) along an east-west one
// - pillars standing in the water: the sheet's flooded column, its foot in the water ([1, 16..17] / [1, 19..20])
// - the drain: a pressure plate (its socket [13, 26] / [13, 27] with the stone button raised in it, [10..13, 28] / [10..13, 29]
//   four frames sinking flush under a foot).
//   Stepped on, it sinks with a clunk, the water gurgles away down the grate over a few seconds and the basin can be
//   walked; what stood in the water can be broken, and coins lie at the bottom
// - a rune shrine: three rune plates in the floor (unlit [27..29, 3] / [27..29, 6], lit [27..29, 4] / [27..29, 7]) and in
//   the middle of the room a chest walled in by eight stone blocks ([10..13, 28] / [10..13, 29], four frames sinking into
//   the floor). Each plate wakes as you step on it and keeps glowing gold; when all three are lit the blocks sink away
// - spike traps: a row of spikes across a corridor ([0..3, 28] / [5..8, 28]: the hole, then the spike rising), on a beat:
//   they hurt anyone standing over them as they shoot up, foe or hero alike
const WK = {
  grey: { square: [[20, 19], [20, 16]], round: [[16, 19], [16, 16]], deep: [[24, 19], [24, 16]], slatV: [17, 29], slatH: [16, 30], plate: [10, 26], socket: [13, 26], rune: [27, 3], runeOn: [27, 4], block: [10, 28], spike: [0, 28], drain: [18, 4], wetPillar: [1, 16], dryPillar: [24, 2], basin: [54, 56, 62] },
  brown: { square: [[20, 26], [20, 23]], round: [[16, 26], [16, 23]], deep: [[24, 26], [24, 23]], slatV: [21, 29], slatH: [20, 30], plate: [10, 27], socket: [13, 27], rune: [27, 6], runeOn: [27, 7], block: [10, 29], spike: [5, 28], drain: [18, 7], wetPillar: [1, 19], dryPillar: [24, 5], basin: [64, 54, 44] },
};
const wkOf = A => WK[A.th === THEMES.grey ? 'grey' : 'brown'];
const sheetTile = (g, [tx, ty], x, y, dx = 0, dy = 0) => g.drawImage(IMG.cellar, (tx + dx) * TS, (ty + dy) * TS, TS, TS, x, y, TS, TS);
// A body of water: its tiles (cells, a set of tile indices) put together on a canvas of their own, and the same with the
// water turned to wet stone (its bed), which is painted on the floor under it. Square-cut water is built tile by tile,
// each tile from four quarter tiles picked by that corner's neighbours (floor on both sides: an outer corner; on one: an
// edge; on neither but the diagonal: an inside corner; none: open water). The rounded sets have their water half a tile
// in from their tiles' edges: they are laid on the corners between tiles instead (a dual grid), each piece picked by
// which of the four tiles round that corner are water (one: an outer corner; two side by side: an edge; two across:
// two corners; three: an inside corner; four: open water).
function waterBody(A, cells, set, W, dual) {
  const xs = [...cells].map(i => i % A.w), ys = [...cells].map(i => (i / A.w) | 0), x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
  const px0 = x0 * TS - (dual ? 8 : 0), py0 = y0 * TS - (dual ? 8 : 0);
  const cv = mkCanvas((x1 - x0 + 1) * TS + (dual ? TS : 0), (y1 - y0 + 1) * TS + (dual ? TS : 0)), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const wet = (x, y) => cells.has(y * A.w + x), [[ox, oy], [ix, iy]] = set, H = TS / 2;
  if (dual) for (let vy = y0; vy <= y1 + 1; vy++) for (let vx = x0; vx <= x1 + 1; vx++) {
    const tl = wet(vx - 1, vy - 1), tr = wet(vx, vy - 1), bl = wet(vx - 1, vy), br = wet(vx, vy), n = tl + tr + bl + br; if (!n) continue;
    const P = n === 4 ? [[ox + 1, oy + 1]] : n === 1 ? [br ? [ox, oy] : bl ? [ox + 2, oy] : tr ? [ox, oy + 2] : [ox + 2, oy + 2]]
      : n === 3 ? [!tl ? [ix + 2, iy + 2] : !tr ? [ix, iy + 2] : !bl ? [ix + 2, iy] : [ix, iy]]
      : bl && br ? [[ox + 1, oy]] : tl && tr ? [[ox + 1, oy + 2]] : tr && br ? [[ox, oy + 1]] : tl && bl ? [[ox + 2, oy + 1]] : tl && br ? [[ox + 2, oy + 2], [ox, oy]] : [[ox, oy + 2], [ox + 2, oy]];
    for (const [tx, ty] of P) g.drawImage(IMG.cellar, tx * TS, ty * TS, TS, TS, vx * TS - 8 - px0, vy * TS - 8 - py0, TS, TS);
  }
  else for (const i of cells) {
    const x = i % A.w, y = (i / A.w) | 0;
    for (let qy = 0; qy < 2; qy++) for (let qx = 0; qx < 2; qx++) {
      const sx = qx ? 1 : -1, sy = qy ? 1 : -1, h = wet(x + sx, y), v = wet(x, y + sy), d = wet(x + sx, y + sy);
      const [tx, ty] = !h && !v ? [ox + (qx ? 2 : 0), oy + (qy ? 2 : 0)] : h && !v ? [ox + 1, oy + (qy ? 2 : 0)] : !h && v ? [ox + (qx ? 2 : 0), oy + 1] : !d ? [ix + (qx ? 0 : 2), iy + (qy ? 0 : 2)] : [ox + 1, oy + 1];
      g.drawImage(IMG.cellar, tx * TS + qx * H, ty * TS + qy * H, H, H, x * TS - px0 + qx * H, y * TS - py0 + qy * H, H, H);
    }
  }
  const bed = mkCanvas(cv.width, cv.height), bg = bed.getContext('2d'); bg.drawImage(cv, 0, 0);
  const id = bg.getImageData(0, 0, bed.width, bed.height), dd = id.data, [br, bgc, bb] = W.basin;
  for (let i = 0; i < dd.length; i += 4) {
    const r = dd[i], gg = dd[i + 1], b = dd[i + 2]; if (dd[i + 3] === 0 || b < r + 30) continue; // the rim and its shadow stay
    const k = 0.78 + 0.22 * ((r + gg + b) / 3 - 60) / 120 + ((i * 2654435761) >>> 28) / 160; // its own speckle, as the water's was
    dd[i] = Math.round(br * k); dd[i + 1] = Math.round(bgc * k); dd[i + 2] = Math.round(bb * k);
  }
  bg.putImageData(id, 0, 0);
  for (const i of cells) A.fl[i] = 2;
  return { cells, x0, y0, x1, y1, px0, py0, cv, bed, level: 1, drain: 0 };
}

// ---- building (called from buildArena): before the room is furnished, and after
function worksBefore(A, r, g) {
  if (r.kind !== 'room' || r.chest || r.set || r.sluice) return; // (a set piece's room, or the room with its sluice: 37_levels)
  if (!A.cistern && r.w >= 12 && r.h >= 8 && chance(0.6)) cistern(A, r, g);
  else if (!A.shrine && r.w >= 12 && r.h >= 8 && chance(0.55)) { A.shrine = r; r.shrine = true; }
  else if (chance(0.3)) ponds(A, r, g);
}
function worksAfter(A, r) {
  if (r.pool && !r.set) cisternAfter(A, r);
  if (r.shrine) shrine(A, r);
}
// a pond or two in an ordinary room: rounded water in the room's corners, clear of the walls and of the cross the
// corridors make through its middle (so every door still reaches every other)
function ponds(A, r, g) {
  const W = wkOf(A), cx = (r.ix0 + r.ix1) / 2, cy = (r.iy0 + r.iy1) / 2, n = randi(1, 2);
  for (let k = 0; k < n; k++) {
    const qx = chance(0.5) ? -1 : 1, qy = chance(0.5) ? -1 : 1, cells = new Set();
    const xa = qx < 0 ? r.ix0 + 2 : Math.ceil(cx) + 3, xb = qx < 0 ? Math.floor(cx) - 3 : r.ix1 - 2, ya = qy < 0 ? r.iy0 + 2 : Math.ceil(cy) + 2, yb = qy < 0 ? Math.floor(cy) - 2 : r.iy1 - 2;
    if (xb - xa < 1 || yb - ya < 1) continue;
    for (let j = 0; j < randi(1, 2); j++) { // a rectangle or two, overlapping: an odd shape
      const w = randi(2, Math.min(4, xb - xa + 1)), h = randi(2, Math.min(3, yb - ya + 1)), x = randi(xa, xb - w + 1), y = randi(ya, yb - h + 1);
      for (let ty = y; ty < y + h; ty++) for (let tx = x; tx < x + w; tx++) cells.add(ty * A.w + tx);
    }
    if ([...cells].some(i => A.fl[i] !== 1)) continue;
    const b = waterBody(A, cells, chance(0.7) ? W.round : W.deep, W, true); b.room = r.i; b.still = true; g.drawImage(b.bed, b.px0, b.py0); (A.pools = A.pools || []).push(b);
  }
}
function cistern(A, r, g) {
  const W = wkOf(A), x0 = r.ix0 + 2, x1 = r.ix1 - 2, y0 = r.iy0 + 2, y1 = r.iy1 - 2;
  if (x1 - x0 < 3 || y1 - y0 < 2) return;
  const cells = new Set(); for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) cells.add(ty * A.w + tx);
  const p = waterBody(A, cells, W.square, W, false); p.room = r.i;
  A.cistern = r; r.pool = p; (A.pools = A.pools || []).push(p); remoteSluice(A, r, p); // (its sluice in another room: 37_levels)
  // the bridge: across the way the room's doors face, two tiles wide, over the middle
  const ew = r.doors.some(d => d.side === 'E' || d.side === 'W'), ns = r.doors.some(d => d.side === 'N' || d.side === 'S');
  const horiz = (ew && !ns) || (ew === ns && chance(0.5)) ? p.y1 - p.y0 >= 3 : p.x1 - p.x0 < 4;
  p.bridge = { horiz, cells: [] };
  if (horiz) { const m = Math.floor((p.y0 + p.y1) / 2); for (let x = p.x0; x <= p.x1; x++) p.bridge.cells.push([x, m], [x, m + 1]); }
  else { const m = Math.floor((p.x0 + p.x1) / 2); for (let y = p.y0; y <= p.y1; y++) p.bridge.cells.push([m, y], [m + 1, y]); }
  for (const [x, y] of p.bridge.cells) A.fl[y * A.w + x] = 3;
  { // blood on the bridge: its own layer over the slats, clipped to them (what lands in a gap falls through, 45_blood)
    const B = p.bridge, xs = B.cells.map(c => c[0]), ys = B.cells.map(c => c[1]); B.bx0 = Math.min(...xs) * TS; B.by0 = Math.min(...ys) * TS;
    const w = (Math.max(...xs) + 1) * TS - B.bx0, h = (Math.max(...ys) + 1) * TS - B.by0, W = wkOf(A);
    B.mask = mkCanvas(w, h); const mg = B.mask.getContext('2d'); for (const [x, y] of B.cells) sheetTile(mg, B.horiz ? W.slatH : W.slatV, x * TS - B.bx0, y * TS - B.by0);
    const md = mg.getImageData(0, 0, w, h).data; B.solid = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) B.solid[i] = md[i * 4 + 3] > 0 ? 1 : 0;
    B.w = w; B.h = h; B.cv = mkCanvas(w, h); B.g = B.cv.getContext('2d'); B.g.translate(-B.bx0, -B.by0);
  }
  // the basin under the water, with its drain grate, off the bridge
  g.drawImage(p.bed, p.px0, p.py0);
  const bc = p.bridge.cells, free = (x, y) => !bc.some(([a, b]) => a === x && b === y);
  // (the inner cells first, the rim's after them, never a bridge's: a narrow cistern's bridge can take all its inner rows)
  const cands = []; for (let ty = p.y0; ty <= p.y1; ty++) for (let tx = p.x0; tx <= p.x1; tx++) if (free(tx, ty)) cands.push([tx, ty, tx > p.x0 && tx < p.x1 && ty > p.y0 && ty < p.y1 ? 0 : 1]);
  const cx = (p.x0 + p.x1) / 2, cy = (p.y0 + p.y1) / 2; cands.sort((a, b) => a[2] - b[2] || Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
  p.drainAt = cands[0] || [p.x0, p.y0];
  { // the grate (the sheet's small square one), wet and dark like the stone round it
    const t = mkCanvas(TS, TS), tg = t.getContext('2d'), [br, bgc, bb] = W.basin; sheetTile(tg, W.drain, 0, 0);
    tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = `rgba(${br},${bgc},${bb},0.45)`; tg.fillRect(0, 0, TS, TS); g.drawImage(t, p.drainAt[0] * TS, p.drainAt[1] * TS);
  }
  p.spots = cands.slice(1); // where the sunken things lie
}
// Things standing in a cistern's water. The sheet has its pots, chests, crates, carts and heaps a second time standing
// in water ([5..14, 16..23]: the same pixels, the foot under the waterline tinted the water's blue); each is set here with
// its dry twin ([22..31, 8..15]), which it turns into as the water drains below it, and then it breaks like any other.
// (Not the chests: a chest that low would be under water but for its lid, and the sheet has nothing for that.)
// [wet tile, dry tile, kind, tiles wide, tiles tall]
const SUNK = [
  [[7, 16], [24, 8], 'barrel'], [[8, 16], [25, 8], 'barrel'], [[9, 16], [26, 8], 'barrel'], [[10, 16], [27, 8], 'barrel'],
  [[8, 20], [25, 12], 'crate'], [[9, 20], [26, 12], 'crate'],
  [[13, 20], [30, 12], 'cart'], [[14, 20], [31, 12], 'cart'], [[13, 22], [30, 14], 'cart'], [[14, 22], [31, 14], 'cart'],
  [[5, 22], [22, 8], 'sacks', 2], [[11, 23], [28, 15], 'crate', 2], [[7, 22], [24, 14], 'crate', 2, 2], [[9, 22], [26, 14], 'crate', 2, 2],
];
// n of them about the water, each on open water clear of the bridge, the drain, the pillars and each other
function sinkThings(A, p, n, kinds) {
  const bc = p.bridge ? p.bridge.cells : [], taken = new Set();
  const open = (x, y) => { const i = y * A.w + x; return p.cells.has(i) && A.fl[i] === 2 && !taken.has(i) && !bc.some(([a, b]) => Math.abs(a - x) <= 1 && Math.abs(b - y) <= 1) && !(x === p.drainAt[0] && y === p.drainAt[1]) &&
    !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < 16 && Math.abs(q.cy - (y * TS + 10)) < 20); };
  const list = kinds || Array.from({ length: n }, () => pick(SUNK)); let made = 0;
  for (const s of list) for (let k = 0; k < 10 && made < n; k++) { // each a few tries for a spot it fits
    // (on open water, never on the stone rim: the foot off the edge rows and columns; a tall heap's top may stand in front of the north rim)
    const [wt, dt, kind, w = 1, h = 1] = s, xa = p.x0 + 1, xb = p.x1 - w, ya = Math.max(p.y0 + 1, p.y0 + h - 1), yb = p.y1 - 1; if (xb < xa || yb < ya) break;
    const x = randi(xa, xb), y = randi(ya, yb);
    const cells = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cells.push([x + i, y - j]);
    if (!cells.every(([a, b]) => open(a, b))) continue;
    for (const [a, b] of cells) taken.add(b * A.w + a);
    A.props.push({ kind: kind === 'cart' ? 'crate' : kind, tile: wt, wetTile: wt, dry: dt, tw: w, th: h, x: (x + (w - 1) / 2) * TS + 8, y: y * TS + 14, cy: y * TS + 10, r: w > 1 ? 9 : 5, solid: true, hp: 1e9, sunk: p, room: p.room });
    made++; break;
  }
  return made;
}
function cisternAfter(A, r) {
  const p = r.pool, W = wkOf(A), nearDoor = (tx, ty, m) => r.doors.some(d => d.cells.some(([x, y]) => Math.abs(x - tx) <= m && Math.abs(y - ty) <= m));
  // a pillar or two standing in the water, clear of the bridge (props sort with everyone, so they stand up out of it)
  const bc = p.bridge.cells, nearBridge = (x, y) => bc.some(([a, b]) => Math.abs(a - x) <= 1 && Math.abs(b - y) <= 1);
  const spots = [[p.x0 + 1, p.y0 + 1], [p.x1 - 1, p.y0 + 1], [p.x0 + 1, p.y1], [p.x1 - 1, p.y1]].filter(([x, y]) => y > p.y0 && !nearBridge(x, y) && !(x === p.drainAt[0] && y === p.drainAt[1]));
  for (const [x, y] of spots.slice(0, randi(1, 2))) A.props.push({ kind: 'wetpillar', tile: W.wetPillar, wetTile: W.wetPillar, dry: W.dryPillar, sunk: p, th: 2, x: x * TS + 8, y: y * TS + 14, cy: y * TS + 10, r: 6, solid: true, hp: 1e9, room: r.i });
  sinkThings(A, p, randi(2, 4)); // crates, pots, a cart or a chest standing in the water, to be had once it drains
  // the drain plate: on the walk round the cistern, clear of the doors and of anything standing there
  const ring = [];
  for (let x = p.x0 - 1; x <= p.x1 + 1; x++) ring.push([x, p.y0 - 1], [x, p.y1 + 1]);
  for (let y = p.y0; y <= p.y1; y++) ring.push([p.x0 - 1, y], [p.x1 + 1, y]);
  const ok = ([x, y]) => !nearDoor(x, y, 2) && !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < 14 && Math.abs(q.cy - (y * TS + 10)) < 12) && FLOOR(A.fl[y * A.w + x]);
  const at = pick(ring.filter(ok)) || ring.find(([x, y]) => FLOOR(A.fl[y * A.w + x]));
  p.localAt = at; if (at && !p.host) { A.plates = A.plates || []; A.plates.push({ x: at[0] * TS + 8, y: at[1] * TS + 8, tx: at[0], ty: at[1], tile: W.plate, f: 0, down: false, pool: p, room: r.i }); } // (on the walk only when no other room took its sluice)
}
function shrine(A, r) {
  const W = wkOf(A), vx = Math.round((r.ix0 + r.ix1) / 2), vy = Math.round((r.iy0 + r.iy1) / 2) + 1;
  // the vault: eight blocks round a chest in the middle of the room (whatever stood there is moved out of its way)
  removeIf(A.props, q => Math.abs(q.x - (vx * TS + 8)) < 30 && Math.abs(q.cy - (vy * TS + 10)) < 28);
  const v = { blocks: [], open: false, t: 0, room: r.i, runes: [] }; A.vaults = A.vaults || []; A.vaults.push(v);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = vx + dx, y = vy + dy;
    if (dx || dy) { const b = { kind: 'block', tile: W.block, f: 0, x: x * TS + 8, y: y * TS + 14, cy: y * TS + 8, r: 7, solid: true, hp: 1e9, room: r.i }; A.props.push(b); v.blocks.push(b); }
  }
  A.props.push({ kind: 'tchest', x: vx * TS + 8, y: vy * TS + 14, cy: vy * TS + 10, r: 6, solid: true, hp: 1, room: r.i, tier: pick(['red', 'red', 'gold']), open: false, sealed: v });
  // three rune plates, each its own sign, spread out round the room clear of the vault and the doors
  const nearDoor = (tx, ty) => r.doors.some(d => d.cells.some(([x, y]) => Math.abs(x - tx) <= 2 && Math.abs(y - ty) <= 2));
  const cands = []; for (let ty = r.iy0 + 1; ty <= r.iy1 - 1; ty++) for (let tx = r.ix0 + 1; tx <= r.ix1 - 1; tx++) {
    if (Math.abs(tx - vx) <= 2 && Math.abs(ty - vy) <= 2 || nearDoor(tx, ty)) continue;
    if (A.props.some(q => !q.dead && Math.abs(q.x - (tx * TS + 8)) < 14 && Math.abs(q.cy - (ty * TS + 10)) < 12)) continue; cands.push([tx, ty]);
  }
  A.runes = A.runes || [];
  for (let i = 0; i < 3 && cands.length; i++) {
    const far = cands.filter(([x, y]) => v.runes.every(q => Math.hypot(q.tx - x, q.ty - y) >= 4)), [x, y] = pick(far.length ? far : cands);
    const rn = { tx: x, ty: y, x: x * TS + 8, y: y * TS + 8, tile: [W.rune[0] + i, W.rune[1]], lit: [W.runeOn[0] + i, W.runeOn[1]], on: false, t: 0, vault: v, room: r.i }; A.runes.push(rn); v.runes.push(rn);
    removeIf(cands, ([a, b]) => a === x && b === y);
  }
}
// spike traps across the corridors (not on the first floor): a row of three, in step, somewhere along the middle
function spikeHalls(A) {
  if (A.floor < 2) return; const W = wkOf(A); A.spikes = A.spikes || [];
  for (const hl of A.halls) {
    const len = hl.dir === 'h' ? hl.x1 - hl.x0 : hl.y1 - hl.y0; if (len < 6 || !chance(0.35)) continue;
    const ph = rand(0, 2.6), m = hl.dir === 'h' ? Math.round((hl.x0 + hl.x1) / 2) : Math.round((hl.y0 + hl.y1) / 2);
    for (let k = 0; k < 3; k++) { const tx = hl.dir === 'h' ? m : hl.x0 + k, ty = hl.dir === 'h' ? hl.y0 + k : m; A.spikes.push({ tx, ty, x: tx * TS + 8, y: ty * TS + 8, tile: W.spike, ph, hit: new Set(), was: 0 }); }
  }
}

// ---- running
const SPIKE_T = 2.6; // its beat: down 1.55 s, rising, up, sinking back
function spikeFrame(s) { const t = (G.time + s.ph) % SPIKE_T; return t < 1.55 ? 0 : t < 1.62 ? 3 : t < 1.69 ? 2 : t < 2.3 ? 1 : t < 2.4 ? 2 : t < 2.48 ? 3 : 0; } // 0 hole, 3 tip, 2 half, 1 up
function worksTick(dt) {
  const A = ARENA; if (!A) return; const heroes = G.heroes.filter(h => !h.dead && !h.enter);
  for (const pl of A.plates || []) {
    // the plate stands a little proud of the floor: a hero steps up onto it with a small hop, once each time he comes on
    if (!pl.down) for (const h of heroes) { const near = Math.abs(h.x - pl.x) < 12 && Math.abs(h.y - pl.y) < 10, far = Math.abs(h.x - pl.x) > 16 || Math.abs(h.y - pl.y) > 14; pl.on = pl.on || new Set(); if (near && !pl.on.has(h)) { pl.on.add(h); if (h.z <= 0.5) hopNow(h); } else if (far) pl.on.delete(h); }
    if (!pl.down && pl.pool && !sluiceLive(pl.pool)) { // sealed: the button will not go down until its water has been seen
      if (heroes.some(h => Math.abs(h.x - pl.x) < 8 && Math.abs(h.y - pl.y) < 7) && G.time - (pl.jamT || -9) > 1.2) { pl.jamT = G.time; SFX.stone(panOf(pl.x), false); smoke(pl.x, pl.y + 2, 2, 'dust', 4, 8, 0.5); }
      continue;
    }
    if (!pl.down && heroes.some(h => Math.abs(h.x - pl.x) < 8 && Math.abs(h.y - pl.y) < 7)) { pl.down = true; pl.t = 0; SFX.stone(panOf(pl.x), true); shake(0.05); }
    if (pl.down) { pl.t += dt; pl.f = Math.min(3, Math.floor(pl.t / 0.06)); if (pl.pool && !pl.pool.drain && pl.t > 0.35) { if (pl.remote) startCine(pl); else startDrain(pl.pool); } }
  }
  for (const p of A.pools || []) if (p.drain === 1) {
    p.level = Math.max(0, p.level - dt / (p.rate || 3.4)); const [dx, dy] = p.drainAt, cx = dx * TS + 8, cy = dy * TS + 8;
    if (chance(dt * 10)) { const a = rand(TAU), d = rand(6, 20) * p.level + 3; water(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, 1, -Math.cos(a) * 18, -Math.sin(a) * 12, rand(10, 30)); }
    if (p.level < 0.3 && !p.dried) dryOut(p); // the water falls below what stands in it
    if (p.level <= 0) endDrain(p);
  }
  for (const p of A.pools || []) if (p.drain === 3) { p.level = Math.min(1, p.level + dt / 2); if (p.level >= 1) p.drain = 0; } // (the test room's refill)
  for (const rn of A.runes || []) {
    if (!rn.on && heroes.some(h => Math.abs(h.x - rn.x) < 8 && Math.abs(h.y - rn.y) < 7)) {
      // it wakes: a column of gold light shoots up out of it, sparks burst and climb, a ring runs out over the floor, and it
      // sounds its own note (the three rising to a chord); the last one sends a beam from every rune to the vault
      const v = rn.vault, n = v.runes.filter(q => q.on).length; rn.on = true; rn.t = 0; rn.flash = 1;
      SFX.rune(panOf(rn.x), n); ring(rn.x, rn.y, 30, 'gold', 0.6, 3); ring(rn.x, rn.y, 16, 'white', 0.35, 2); flashLight(rn.x, rn.y, 90, 'gold', 1.4, 0.7); shake(0.08);
      for (let i = 0; i < 22; i++) { const a = rand(TAU), sp = rand(20, 70); part({ k: 'glow', x: rn.x + rand(-5, 5), y: rn.y + rand(-3, 3), z: rand(0, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: rand(30, 90), drag: 2.2, life: rand(0.6, 1.2), s0: rand(1.4, 2.4), s1: 0, col: 'gold', a0: 1, a1: 0 }); }
      sparks(rn.x, rn.y, 6, 12, 'gold', 120, 80);
      if (v.runes.every(q => q.on) && !v.open) {
        v.open = true; v.t = -1; const vx = v.blocks.reduce((s, b) => s + b.x, 0) / v.blocks.length, vy = v.blocks.reduce((s, b) => s + b.cy, 0) / v.blocks.length;
        for (const q of v.runes) FX.beams.push({ x0: q.x, y0: q.y - 2, x1: vx, y1: vy - 4, w: 1.6, col: 'gold', life: 1.1, t: 0, steady: true, cap: true });
        textPop(vx, vy, 26, 'THE VAULT OPENS', 'gold', true); G.sched.push({ t: 0.9, fn: () => SFX.quake(1.4) });
      }
    }
    if (rn.on) rn.t += dt;
  }
  for (const v of A.vaults || []) if (v.open) { // the blocks sink one after another, round the ring
    v.t += dt; if (v.t > 0 && v.t - dt <= 0) { shake(0.3); flashLight(v.blocks[0].x, v.blocks[0].cy, 110, 'gold', 1.2, 0.6); }
    v.blocks.forEach((b, i) => { const u = v.t - i * 0.14; if (u <= 0 || b.f >= 3 && !b.solid) return; const f = Math.min(3, Math.floor(u / 0.12)); if (f > b.f) { b.f = f; debris(b.x, b.cy, 3, ['#5a5450', '#7a726a'], 40, 60, 1.1); if (f === 1) smoke(b.x, b.cy, 2, 'dust', 6, 12, 0.8); } if (f >= 3 && b.solid) { b.solid = false; b.flat = true; } });
  }
  for (const s of A.spikes || []) { // up: whoever stands over it is stabbed once a beat
    const f = spikeFrame(s); if (f === 1 && s.was !== 1) {
      s.hit.clear(); if (G.me && dist(G.me.x, G.me.y, s.x, s.y) < 200) SFX.spike(panOf(s.x));
      for (const u of G.units) if (!u.dead && !u.fly && !u.under && (u.z || 0) < 4 && Math.abs(u.x - s.x) < 8 && Math.abs(u.y - s.y) < 8 && !s.hit.has(u)) {
        s.hit.add(u); hurt(u, 9 + A.floor * 1.5, { x: s.x, y: s.y + 6, team: 'trap', def: {} }, { ranged: true, unblockable: true, poise: 25, ky: -40, style: 'line', ang: -Math.PI / 2 });
      }
    }
    s.was = f;
  }
}
function startDrain(p) {
  p.drain = 1; const [dx, dy] = p.drainAt; SFX.drain(panOf(dx * TS)); SFX.quake(0.8);
}
function endDrain(p) {
  const A = ARENA; p.drain = 2; p.level = 0;
  A.basin = A.basin || new Uint8Array(A.w * A.h); // the dry basin: floor now, but a step below the walk and the bridge
  for (const i of p.cells) if (A.fl[i] === 2) { A.fl[i] = 1; A.basin[i] = 1; }
  if (p.flooded && !p.drownedDone) { p.drownedDone = true; drownedRise(A, p); } // (the flooded way's dead: 37_levels)
  A.flv = (A.flv || 0) + 1;
  // what lay at the bottom: a scatter of coins (no treasure chest: the sheet has no chest standing in water, so none was there)
  const s = p.spots.filter(([x, y]) => !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < 14 && Math.abs(q.cy - (y * TS + 10)) < 12));
  for (let i = 0; i < 5; i++) { const q = pick(s) || p.drainAt; G.drops.push({ k: 'gold', v: randi(1, 4), x: q[0] * TS + 8, y: q[1] * TS + 8, z: 1, vx: 0, vy: 0, vz: 30, t: 0, hold: 0.3 }); }
}
// what stood in the water is dry now: each turns into its dry twin, water running off it, and can be broken
function dryOut(p) {
  p.dried = true;
  if (ARENA.clouds) removeIf(ARENA.clouds, q => p.cells.has(Math.floor(q.y / TS) * ARENA.w + Math.floor(q.x / TS)));
  for (const q of ARENA.props) if (q.sunk === p && !q.dead) { q.tile = q.dry; q.hp = q.kind === 'wetpillar' ? 1e9 : 40; q.wet = q.sunk; q.sunk = null; water(q.x, q.y - 4, 4, 0, 0, rand(8, 18)); }
}
// the test room's refill: the water comes back in from the grate over a couple of seconds, everything that stood in it
// stands there again (wet), whatever the drain left at the bottom goes, and the plate rises for another go
function refillPool(p) {
  const A = ARENA; if (!p || p.drain === 3) return;
  for (const i of p.cells) if (A.basin && A.basin[i]) { A.basin[i] = 0; A.fl[i] = 2; }
  A.flv = (A.flv || 0) + 1; p.drain = 3; p.dried = false;
  for (const u of G.units) if (!u.dead && !u.fly && p.cells.has(Math.floor(u.y / TS) * A.w + Math.floor(u.x / TS)) && A.fl[Math.floor(u.y / TS) * A.w + Math.floor(u.x / TS)] === 2) { // out of the water, onto the walk or the bridge
    let best = null, bd = 1e9; for (let ty = p.y0 - 1; ty <= p.y1 + 1; ty++) for (let tx = p.x0 - 1; tx <= p.x1 + 1; tx++) { const i = ty * A.w + tx; if (!FLOOR(A.fl[i]) || A.fl[i] === 2) continue; const d = Math.hypot(tx * TS + 8 - u.x, ty * TS + 8 - u.y); if (d < bd) { bd = d; best = [tx, ty]; } }
    if (best) { u.x = best[0] * TS + 8; u.y = best[1] * TS + 10; u.vx = u.vy = u.kx = u.ky = 0; smoke(u.x, u.y, 3, 'dust', 6, 12, 0.6); }
  }
  for (const q of A.props) if (q.wet === p || q.sunk === p) Object.assign(q, { dead: false, solid: true, tile: q.wetTile, sunk: p, wet: null, hp: 1e9 });
  G.drops = G.drops.filter(d => !p.cells.has(Math.floor(d.y / TS) * A.w + Math.floor(d.x / TS)));
  for (const pl of A.plates || []) if (pl.pool === p) { pl.down = false; pl.t = 0; pl.f = 0; }
  const [dx, dy] = p.drainAt; SFX.drain(panOf(dx * TS));
}
// painting on the floor (groundPaint) paints the bridges too, clipped to their slats
function bridgePaint(x0, y0, x1, y1, fn) {
  for (const p of ARENA.pools || []) {
    const B = p.bridge; if (!B || !B.g || x1 < B.bx0 || x0 >= B.bx0 + B.w || y1 < B.by0 || y0 >= B.by0 + B.h) continue;
    B.g.save(); fn(B.g); B.g.restore();
    B.g.save(); B.g.setTransform(1, 0, 0, 1, 0, 0); B.g.globalCompositeOperation = 'destination-in'; B.g.drawImage(B.mask, 0, 0); B.g.restore();
  }
}
// a point over a bridge: 'slat' on a plank, 'gap' between them (then it falls through, to the water or the dry bed), or null
function bridgeAt(x, y) {
  const A = ARENA; if (!A || !A.pools) return null; const tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (A.fl[ty * A.w + tx] !== 3) return null;
  for (const p of A.pools) { const B = p.bridge; if (!B || !B.solid) continue; const lx = Math.floor(x - B.bx0), ly = Math.floor(y - B.by0); if (lx < 0 || ly < 0 || lx >= B.w || ly >= B.h) continue; return { p, at: B.solid[ly * B.w + lx] ? 'slat' : 'gap' }; }
  return null;
}
// whether a point is down in a drained basin
function basinAt(x, y) { const A = ARENA; if (!A || !A.basin) return 0; const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx >= 0 && ty >= 0 && tx < A.w && ty < A.h ? A.basin[ty * A.w + tx] : 0; }
// a walker crossing a basin's rim, down into it or up out of it, gives a little hop (a puff of dust where it pushes off)
function basinHop(u) {
  const b = basinAt(u.x, u.y);
  if (u.inBasin !== undefined && b !== u.inBasin && !u.fly && !u.under && !u.dead && u.z <= 0.5 && !(u.hopT && G.time - u.hopT < 0.4)) hopNow(u);
  u.inBasin = b;
}
function hopNow(u) { u.vz = 70; u.z = 0.01; u.hopT = G.time; smoke(u.x, u.y, 2, 'dust', 4, 8, 0.5); }
// Coming up to the rim, a walker checks for a moment (a fifth of its pace for a beat) and then hops, so the hop is seen
// over the edge and not after it, however fast it was going. The answer scales this frame's move.
function basinBrake(u, dt) {
  const A = ARENA; if (!A || !A.basin || u.fly || u.under || u.dead || u.enter) return 1;
  if (u.brake > 0) { u.brake -= dt; if (u.brake <= 0) hopNow(u); return 0.2; }
  if (u.z > 0.5 || (u.hopCool || 0) > G.time) return 1;
  const gk = u.gaitK === undefined ? 1 : u.gaitK, vx = u.vx * gk + u.kx, vy = u.vy * gk + u.ky, sp = Math.hypot(vx, vy); if (sp < 20) return 1;
  const ahead = clamp(sp * 0.1, 3, 10), ax = u.x + vx / sp * ahead, ay = u.y + vy / sp * ahead;
  if (basinAt(ax, ay) === basinAt(u.x, u.y) || !FLOOR(A.fl[Math.floor(ay / TS) * A.w + Math.floor(ax / TS)])) return 1;
  u.brake = 0.08; u.hopCool = G.time + 0.45; return 0.2;
}
// a drop landing in full water: a ring on the water instead of a mark on the floor
function wetAt(x, y) { const A = ARENA; if (!A || !A.fl) return false; const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx >= 0 && ty >= 0 && tx < A.w && ty < A.h && A.fl[ty * A.w + tx] === 2; }
// blood in the water: a red haze that spreads and thins away (gibs and bodies falling in leave a bigger one)
function bloodCloud(x, y, col, size = 1) { const A = ARENA; if (!A) return; (A.clouds = A.clouds || []).push({ x, y, col, t: 0, life: rand(3.5, 5.5) * (0.8 + size * 0.2), r0: 1 + size, r1: 4 + size * 3.5, dx: rand(-2, 2), dy: rand(-1.5, 1.5) }); if (A.clouds.length > 60) A.clouds.shift(); }
// over water: open water, or between a bridge's slats with water under them
function overWater(x, y) { if (wetAt(x, y)) return true; const br = bridgeAt(x, y); return !!(br && br.at === 'gap' && br.p.level > 0); }
function plip(x, y) { const A = ARENA; (A.plips = A.plips || []).push({ x, y, t: 0 }); if (A.plips.length > 40) A.plips.shift(); }

// ---- drawing, on the floor under everyone (after the ground, before blood and wet)
function drawWorks(c) {
  const A = ARENA; if (!A) return;
  // a vault's blocks, once sunk level with the floor, lie under everyone (not sorted in with the standing things)
  for (const p of A.props) if (p.flat && !p.dead) drawProp(c, p);
  for (const p of A.pools || []) {
    const X = p.px0, Y = p.py0, w = p.cv.width, h = p.cv.height;
    if (p.level > 0) { // the water, and as it drains, its edge drawing back from the rim
      const ins = Math.round((1 - p.level) * 6); c.globalAlpha = Math.min(1, p.level * 1.6);
      c.drawImage(p.cv, ins, ins, w - ins * 2, h - ins * 2, X + ins, Y + ins, w - ins * 2, h - ins * 2); c.globalAlpha = 1;
      // light on the water: a few glints drifting and winking
      for (let i = 0; i < Math.round(w * h / 300); i++) {
        const sd = (i * 7919 + p.x0 * 31) % 997, gx = X + 3 + ((sd * 13 + G.time * (6 + sd % 5)) % (w - 6)), gy = Y + 7 + (sd * 29) % (h - 10), on = Math.sin(G.time * (1.3 + sd % 3) + sd) > 0.55;
        if (on && p.level > 0.4 && wetAt(gx, gy)) { c.fillStyle = 'rgba(214,236,255,0.75)'; c.fillRect(Math.round(gx), Math.round(gy), 2, 1); }
      }
      if (p.drain === 1) { // the whirl over the drain
        const [dx, dy] = p.drainAt, cx = dx * TS + 8, cy = dy * TS + 8; c.fillStyle = 'rgba(230,244,255,0.85)';
        for (let k = 0; k < 14; k++) { const a = G.time * 7 + k * 0.55, rr = (2 + k * 1.1) * (0.4 + p.level * 0.6); c.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * 0.6), 1, 1); }
      }
    }
    if (p.level > 0.2 && A.clouds && A.clouds.length) { // blood in the water, kept inside it
      c.save(); c.beginPath(); for (const i of p.cells) c.rect((i % A.w) * TS, Math.floor(i / A.w) * TS, TS, TS); c.clip();
      for (const q of A.clouds) { // a soft haze, darkest in its middle, spreading and thinning
        const u = q.t / q.life; if (u >= 1 || !p.cells.has(Math.floor(q.y / TS) * A.w + Math.floor(q.x / TS))) continue; const r = q.r0 + (q.r1 - q.r0) * Math.sqrt(u);
        if (!q.rgb) { const h = /^#?([0-9a-f]{6})$/i.exec(q.col || '') ? q.col.replace('#', '') : '6a1010'; q.rgb = [0, 2, 4].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.75)).join(','); }
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${q.rgb},${(0.5 * (1 - u) * Math.min(1, p.level * 1.5)).toFixed(3)})`); gr.addColorStop(1, `rgba(${q.rgb},0)`);
        c.save(); c.translate(q.x + q.dx * u * 3, q.y + q.dy * u * 3); c.scale(1, 0.7); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore();
      }
      c.restore();
    }
    // the bridge over it
    if (!p.bridge) continue; const W = wkOf(A), bc = p.bridge.cells;
    if (p.level > 0) { // its shadow lies on the water under all of it (dark between the slats and between its two rows) and runs a little out past its south edge
      const k = Math.min(1, p.level * 1.6); c.fillStyle = `rgba(8,16,34,${0.55 * k})`;
      for (const [x, y] of bc) { const top = bc.some(([a, b]) => a === x && b === y - 1) ? 0 : 2; c.fillRect(x * TS, y * TS + top, TS, TS - top); if (!bc.some(([a, b]) => a === x && b === y + 1) && A.fl[(y + 1) * A.w + x] === 2) c.fillRect(x * TS, (y + 1) * TS, TS, 3); }
    }
    for (const [x, y] of bc) sheetTile(c, p.bridge.horiz ? W.slatH : W.slatV, x * TS, y * TS);
    if (p.bridge.cv) c.drawImage(p.bridge.cv, p.bridge.bx0, p.bridge.by0); // blood on its slats
  }
  for (const q of A.plips || []) { q.t += 1 / 60; const u = q.t / 0.5; if (u >= 1) continue; c.strokeStyle = `rgba(220,240,255,${0.7 * (1 - u)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(q.x, q.y, 1 + u * 4, (1 + u * 4) * 0.6, 0, 0, TAU); c.stroke(); }
  if (A.plips) removeIf(A.plips, q => q.t >= 0.5);
  if (A.clouds) { for (const q of A.clouds) q.t += 1 / 60; removeIf(A.clouds, q => q.t >= q.life); }
  // a plate: its socket in the floor ([13, 26] / [13, 27]), the stone button standing raised in it, which a foot drives down
  // flush in four frames ([10..13, 28] / [10..13, 29]); the socket is never seen empty
  // (aligned by hand on the Plate Aligner: the socket a pixel up, the button four)
  { const Wk = wkOf(A); for (const pl of A.plates || []) { sheetTile(c, Wk.socket, pl.x - 8, pl.y - 9); sheetTile(c, Wk.block, pl.x - 8, pl.y - 12, pl.f, 0); } }
  for (const rn of A.runes || []) {
    sheetTile(c, rn.on ? rn.lit : rn.tile, rn.x - 8, rn.y - 8);
    if (rn.on) light(rn.x, rn.y, 46 + 4 * Math.sin(G.time * 3 + rn.x), 'gold', 0.55);
  }
  for (const s of A.spikes || []) sheetTile(c, s.tile, s.x - 8, s.y - 8, spikeFrame(s), 0);
}
function drawWorksGlow(c) { // the lit runes glow in the dark; just woken, a column of light stands on one
  const A = ARENA; if (!A) return;
  for (const rn of A.runes || []) if (rn.on) {
    c.globalAlpha = 0.35 + 0.1 * Math.sin(G.time * 3 + rn.x); c.drawImage(GLOW.gold, rn.x - 10, rn.y - 8, 20, 16);
    if (rn.flash > 0) { rn.flash = Math.max(0, rn.flash - 1 / 60 / 0.9); const k = rn.flash, w = 4 + 8 * k, h = 70 * Math.min(1, (1 - k) * 6) ; c.globalAlpha = k; c.drawImage(GLOW.gold, rn.x - w, rn.y - h, w * 2, h + 4); c.globalAlpha = k * 0.9; c.fillStyle = '#fff6c8'; c.fillRect(Math.round(rn.x) - 1, Math.round(rn.y - h * 0.8), 2, Math.round(h * 0.8)); }
  }
  c.globalAlpha = 1;
}
