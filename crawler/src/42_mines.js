// ===================== THE ABANDONED MINES (floors 10 to 12) =====================
// Built as the magma is: the grey cellar underneath with the mines sheet drawn over it (crawler/assets/mines.png:
// ElvGames' Abandoned Mines, with the room frame the game needs composed under it in rows 40 to 43 by
// tools/mines_sheet.py). Its floor is the sheet's own: packed dirt in the galleries and the drifts between them, the
// paved cobble where the miners lived and worked (the way in, the way down, the shop, the treasury). What is cut from
// the cellar's sheet (plates, doors, pits' faces) is drawn in the mines' colours (tools/mines_recolor.py).
THEMES.mines = Object.assign({}, THEMES.grey, { name: 'mines', sheet: 'mines', solid: true, amb: [70, 60, 56], ceilN: { '6,0': [[0, 0, 16, 8]] }, map: {
  '6,8': [1, 41], '6,7': [1, 40], '6,10': [1, 43], '5,7': [0, 40], '7,7': [2, 40], '5,8': [0, 41], '7,8': [2, 41], '5,9': [0, 42], '7,9': [2, 42], '5,10': [0, 43], '7,10': [2, 43],
  '3,7': [3, 40], '3,9': [3, 42], '3,10': [3, 43],
} });
const MINES = { force: false }; // (a test: the mines on any floor)
const isMines = A => !!A && A.th.sheet === 'mines';
WK.mines = Object.assign({}, WK.grey, { basin: [84, 64, 44], slatV: WK.brown.slatV, slatH: WK.brown.slatH });
// a free block of wall's atlas, as the magma's (42_magma magmaBlockAtlas), from the mines' rows
function minesBlockAtlas(img) { const c = mkCanvas(3 * TS, 4 * TS); c.getContext('2d').drawImage(img, 4 * TS, 40 * TS, 3 * TS, 4 * TS, 0, 0, 3 * TS, 4 * TS); return c; }
// the cellar's pit faces ([10..15, 12]: the earth under a pit's north edge) in the mines' own rock: seven rows of its face
function minesCellar(img) {
  const c = mkCanvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0);
  for (let v = 0; v < 6; v++) { const x = (10 + v) * TS, y = 12 * TS, o = (v * 5) % TS; g.clearRect(x, y, TS, TS);
    g.drawImage(IMG.mines, TS + o, 41 * TS + 9, TS - o, 7, x, y, TS - o, 7); if (o) g.drawImage(IMG.mines, TS, 41 * TS + 9, o, 7, x + TS - o, y, o, 7); }
  return c;
}
// THE FLOOR: dirt ([13, 13] plain, [12..15, 14] with darker patches) everywhere a foot can go; cobble ([13, 11] plain,
// [12..15, 12] with a darker stone) wall to wall in the rooms that were lived and worked in. Each family lies on one
// grid, so any of its tiles sits beside any other; the two meet only in a doorway, along a straight line.
const MFL = { dirt: [[13, 13], [13, 13], [12, 14], [13, 14], [14, 14], [15, 14]], cobble: [[13, 11], [13, 11], [13, 11], [12, 12], [13, 12], [14, 12], [15, 12]] };
function minesFloor(g, W, H, near, inRoom, rooms) {
  const paved = new Uint8Array(W * H); for (const r of rooms) if (r.kind !== 'room') for (let y = r.fy0; y <= r.fy1; y++) for (let x = r.fx0; x <= r.fx1; x++) paved[y * W + x] = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!near(x, y)) continue; const L = paved[y * W + x] ? MFL.cobble : MFL.dirt, t = L[(hash2(x * 7 + 3, y * 13 + 5) * L.length) | 0];
    g.drawImage(IMG.mines, t[0] * TS, t[1] * TS, TS, TS, x * TS, y * TS, TS, TS);
  }
}
function minesTick(dt) { if (!isMines(ARENA)) return; floodsTick(dt); minesLights(); sumpTick(dt); roofTick(dt); } // (its water: 42_minewater)
// THE TIMBERING: the mines' wall lights are lanterns hung in the sheet's pit frames ([16..18, 28..31]: two posts and a
// beam, a lantern on its hook between them, dark in rows 28 and 29, burning in 30 and 31), one frame to each light,
// standing against the north wall with its feet a little out on the floor, so its beam shows under the wall's rim. A
// lantern is put out and lit as a torch is (36_works): the same thing, drawn in its frame.
function minesLantern(c, t) { c.drawImage(IMG.mines, 16 * TS, (t.out ? 28 : 30) * TS, 3 * TS, 2 * TS, t.x - 8 - TS, t.y - 9 - TS + 6, 3 * TS, 2 * TS); }
// WHAT LIES ABOUT: the sheet's rocks ([16..23, 11..15], as the magma's are laid out: 42_magma MROCK) and its heaps of ore
// (silver [5..6, 33..35], pale [9..10, 33..35], gold [13..14, 33..35]) in the corners, where nothing they stand on is
// wanted for walking; mushrooms ([27..31, 30..31]) painted into the dirt along the feet of the walls.
const MORE = [[5, 33], [6, 33], [5, 34], [6, 34], [5, 35], [6, 35], [9, 33], [10, 33], [9, 34], [10, 34], [9, 35], [10, 35], [13, 33], [14, 33], [13, 34], [14, 34], [13, 35], [14, 35]], MSHROOM = [[27, 30], [28, 30], [29, 30], [30, 30], [27, 31], [28, 31], [29, 31], [30, 31]];
function minesDress(A, r, g, prop, nearDoor, free) {
  if (r.kind === 'shop') return; const W = A.w, okT = (x, y) => x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1 && A.fl[y * W + x] === 1 && !nearDoor(x, y) && free(x * TS + 8, y * TS + 14, 13) && !(A.noProp && A.noProp.has(y * W + x)) && !(A.plates || []).some(p => Math.abs(p.tx - x) <= 1 && Math.abs(p.ty - y) <= 1) && !(r.stairX !== undefined && y <= r.iy0 + 1 && x >= r.stairX - 1 && x <= r.stairX + 3);
  for (const [cx, cy, sx, sy] of [[r.ix0, r.iy0, 1, 1], [r.ix1, r.iy0, -1, 1], [r.ix0, r.iy1, 1, -1], [r.ix1, r.iy1, -1, -1]]) {
    if (!chance(0.55)) continue; const k = Math.random();
    if (k < 0.5) { if (okT(cx, cy)) prop('stone', cx, cy, { sheet: 'mines', tile: pick(MROCK.one), r: 5, rock: true }); if (chance(0.5) && okT(cx + sx, cy)) prop('stone', cx + sx, cy, { sheet: 'mines', tile: pick(MORE), r: 5, rock: true }); }
    else if (k < 0.8) { for (const [dx, dy] of [[0, 0], [sx, 0], [0, sy]]) if (chance(0.7) && okT(cx + dx, cy + dy)) prop('stone', cx + dx, cy + dy, { sheet: 'mines', tile: pick(MORE), r: 5, rock: true }); }
    else if (cy === r.iy1 && okT(cx, cy) && okT(cx, cy - 1)) prop('stone', cx, cy, { sheet: 'mines', tile: pick(MROCK.spire), th: 2, r: 5, rock: true });
  }
  // mushrooms: a patch or two in the dirt at the foot of a wall (never on paving, nor where anything stands)
  if (r.kind === 'room') for (let n = randi(0, 2); n > 0; n--) { const side = randi(0, 2), x0 = side === 0 ? randi(r.ix0 + 1, r.ix1 - 2) : side === 1 ? r.ix0 : r.ix1, y0 = side === 0 ? r.iy1 : randi(r.iy0 + 2, r.iy1 - 1);
    for (let i = 0; i < randi(2, 3); i++) { const x = x0 + (side === 0 ? i : 0), y = y0 - (side === 0 ? 0 : i); if (!okT(x, y)) continue; const t = pick(MSHROOM); g.drawImage(IMG.mines, t[0] * TS, t[1] * TS, TS, TS, x * TS + (side === 1 ? -3 : side === 2 ? 3 : 0), y * TS + (side === 0 ? 3 : 0), TS, TS); } }
}
// THE CRYSTAL LAMPS (the sheet's, [18..25, 33..39]: a crystal in a low socket, or on a post two tiles tall; green and blue
// in rows 33 to 35, red and yellow in 37 to 39): the only light that burns under water, so a flooded gallery is lit by them
const MLAMP = { heal: [18, 33], bolt: [22, 33], crimson: [18, 37], gold: [22, 37] };
function minesLamp(A, r, tx, ty, col, tall) { const [cx, cy] = MLAMP[col], k = randi(0, 3); A.props.push({ kind: 'stone', sheet: 'mines', tile: [cx + k, cy + (tall ? 1 : 0)], th: tall ? 2 : 1, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 5, solid: true, hp: 1e9, room: r.i, crystal: col, rock: true }); }
function minesLamps(A) { const L = []; if (!isMines(A)) return L; for (const p of A.props) if (p.crystal && !p.dead) L.push({ x: p.x, y: p.y - 4, r: 56 }); return L; }
function minesLights() { const A = ARENA; for (const p of A.props) if (p.crystal && !p.dead) light(p.x, p.y - (p.th === 2 ? 20 : 8), 58 + 4 * Math.sin(G.time * 2.2 + p.x), p.crystal, 0.8); }
// A FLOODED GALLERY: a room under water wall to wall (its doors' own tiles dry, so the water shelves down from every
// way in; o.doorIn: but this door's tiles under it too, the water standing against a door it holds shut). No fire burns
// in it: its torches and braziers are taken out and crystal lamps stand in their place. Its valve, if it has one, is a
// plate on the bed at its lowest point, as far from the ways in as the room allows.
function floodRoom(A, r, o = {}) {
  const W = A.w, cells = new Set(); for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) if (A.fl[y * W + x] === 1) cells.add(y * W + x);
  if (o.doorIn) for (const [x, y] of o.doorIn.cells) if (A.fl[y * W + x] === 1) cells.add(y * W + x);
  if (cells.size < 40) return null;
  A.torches = A.torches.filter(t => t.exit || !(t.tx >= r.ix0 && t.tx <= r.ix1 && Math.abs(t.y - ((r.fy0 + 1) * TS + 9)) < 2)); removeIf(A.props, p => p.kind === 'brazier' && cells.has(Math.floor(p.cy / TS) * W + Math.floor(p.x / TS))); A.lights = A.slit = null;
  const doors = r.doors.filter(d => d !== o.doorIn), far = (x, y) => Math.min(99, ...doors.map(d => Math.min(...d.cells.map(([a, b]) => Math.hypot(a - x, b - y))))), clear = (x, y, m = 14) => !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < m && Math.abs(q.cy - (y * TS + 10)) < m);
  let at = null, bd = -1; for (let y = r.iy0 + 2; y <= r.iy1 - 2; y++) for (let x = r.ix0 + 2; x <= r.ix1 - 2; x++) { if (!cells.has(y * W + x) || !clear(x, y, 20) || (A.noProp && A.noProp.has(y * W + x))) continue; const d = far(x, y) + hash2(x, y) * 0.5; if (d > bd) { bd = d; at = [x, y]; } }
  const f = mkFlood(A, cells, { room: r.i, drain: at ? [at[0] * TS + 8, at[1] * TS + 8] : null, flat: o.flat, shoals: o.shoals && at ? o.shoals(at) : null }); r.flood = f; f.at = at;
  // its lamps: one by each end of the north wall, one or two out on the bed
  const col = pick(['bolt', 'heal', 'bolt', 'gold']), spots = [[r.ix0 + 1, r.iy0], [r.ix1 - 1, r.iy0], [Math.round((r.ix0 + r.ix1) / 2) + randi(-2, 2), r.iy1 - 1], [r.ix0 + 2 + randi(0, 2), Math.round((r.iy0 + r.iy1) / 2)], [r.ix1 - 2 - randi(0, 2), Math.round((r.iy0 + r.iy1) / 2) + 1]];
  let n = 0; for (const [x, y] of spots) { if (n >= 4 || !cells.has(y * W + x) || !clear(x, y, 18) || far(x, y) < 3 || (at && Math.hypot(x - at[0], y - at[1]) < 3) || (A.noProp && A.noProp.has(y * W + x))) continue; minesLamp(A, r, x, y, col, y > r.iy0); n++; }
  return f;
}
// THE DROWNED DOOR: the way on is a door the water holds shut: the gallery in front of it is flooded to the roof and the
// water stands against it. The valve is on the bed, out in the deepest of it (a thread of bubbles rises from it): go
// down to it, stand on it, and the gallery drains; with the water gone from it, the door opens.
function drownedDoor(A, r, bare, plate, clear) {
  const g = r.gateOf, f = floodRoom(A, r, { doorIn: g.d }); if (!f || !f.at) { leverInstead(A, r, bare, plate); return; }
  plate(f.at[0], f.at[1], { flood: f, to: 0 }); f.gate = g; f.valves = [A.plates[A.plates.length - 1]];
}
// THE TWO SLUICES: the gallery before the door is flooded deep, bed and all, and the door is held as the drowned door
// is. Its main sluice is far out on the bed and will not turn under that weight of water. A first sluice stands in the
// shallows by the way in: it lets a fifth of the water go, no more, and shoals show under the surface, a line of them
// out to the main sluice, which stands on the last. Out along them (a breath on each), onto it, and the rest drains.
function twoSluices(A, r, bare, plate, clear) {
  const g = r.gateOf, W = A.w, ins = r.doors.filter(d => d !== g.d && !d.hidden); if (!ins.length) { drownedDoor(A, r, bare, plate, clear); return; }
  const gd = g.d.cells[1], din = ins.slice().sort((a, b) => Math.hypot(b.cells[1][0] - gd[0], b.cells[1][1] - gd[1]) - Math.hypot(a.cells[1][0] - gd[0], a.cells[1][1] - gd[1]))[0], [ex, ey] = din.cells[1];
  // the first sluice: two tiles in from the way in, straight on from the door
  const o = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[din.side]; let v1 = null; for (const k of [2, 3, 1]) for (const s of [0, 1, -1]) { const x = ex + o[0] * k + o[1] * s, y = ey + o[1] * k + o[0] * s; if (!v1 && x > r.ix0 && x < r.ix1 && y > r.iy0 && y < r.iy1 && A.fl[y * W + x] === 1 && bare(x, y)) v1 = [x, y]; }
  if (!v1) { drownedDoor(A, r, bare, plate, clear); return; }
  const f = floodRoom(A, r, { doorIn: g.d, flat: true, shoals: at => { const a = [v1[0] * TS + 8, v1[1] * TS + 8], b = [at[0] * TS + 8, at[1] * TS + 8], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 62)), out = [[b[0], b[1], 15], [a[0], a[1], 13, 0.24]]; /* (the main sluice's shoal; the first sluice's shelf, ankle deep) */ for (let i = 1; i < n; i++) { const t = i / n, w = (i % 2 ? 1 : -1) * 10; out.push([a[0] + (b[0] - a[0]) * t - (b[1] - a[1]) / L * w, a[1] + (b[1] - a[1]) * t + (b[0] - a[0]) / L * w, 13]); } return out; } });
  if (!f || !f.at || Math.hypot(f.at[0] - v1[0], f.at[1] - v1[1]) < 5) { if (f && f.at) { plate(f.at[0], f.at[1], { flood: f, to: 0 }); f.gate = g; f.valves = [A.plates[A.plates.length - 1]]; } else leverInstead(A, r, bare, plate); return; } // (too small a gallery for two: the drowned door's one)
  plate(v1[0], v1[1], { flood: f, to: FLOOD.LOW }); const p1 = A.plates[A.plates.length - 1]; plate(f.at[0], f.at[1], { flood: f, to: 0, maxDepth: FLOOD.TURN }); f.gate = g; f.valves = [p1, A.plates[A.plates.length - 1]];
}
// the floor's other flooded galleries: a room or two of its plain ones, each with its valve on its bed
function minesWater(A) {
  if (A.sump) sumpLake(A); // (the last floor's: 42_minesboss)
  const ok = r => r.kind === 'room' && !r.set && !r.puz && !r.chest && !r.gateOf && !r.flood && !r.shape && r.w * r.h >= 70, Wk = wkOf(A);
  for (const r of A.rooms.filter(ok).sort(() => Math.random() - 0.5).slice(0, 1 + (chance(0.5) ? 1 : 0))) {
    const f = floodRoom(A, r); if (!f || !f.at) continue; const [tx, ty] = f.at; removeIf(A.props, q => Math.abs(q.x - (tx * TS + 8)) < 14 && Math.abs(q.cy - (ty * TS + 10)) < 14);
    const pl = { x: tx * TS + 8, y: ty * TS + 8, tx, ty, tile: Wk.plate, f: 0, down: false, pool: null, room: r.i, flood: f, to: 0 }; (A.plates = A.plates || []).push(pl); f.valves = [pl];
  }
}
