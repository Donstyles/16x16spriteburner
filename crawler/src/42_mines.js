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
function minesTick(dt) { if (!isMines(ARENA)) return; floodsTick(dt); } // (its water: 42_minewater)
// THE FLOODED GALLERIES of a floor: (for now) a room or two under water wall to wall, dry at their doors
function minesWater(A) {
  const W = A.w, ok = r => r.kind === 'room' && !r.set && !r.puz && !r.chest && !r.gateOf && r.w * r.h >= 70;
  for (const r of A.rooms.filter(ok).sort(() => Math.random() - 0.5).slice(0, 2)) {
    const cells = new Set(); for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) if (A.fl[y * W + x] === 1) cells.add(y * W + x); if (cells.size < 40) continue;
    A.torches = A.torches.filter(t => !(t.tx >= r.ix0 && t.tx <= r.ix1 && Math.abs(t.y - ((r.fy0 + 1) * TS + 9)) < 2)); for (const p of A.props) if (p.kind === 'brazier' && cells.has(Math.floor(p.cy / TS) * W + Math.floor(p.x / TS))) p.dead = true; A.props = A.props.filter(p => !p.dead); A.lights = A.slit = null; // (no fire burns under water: its light is the crystals', below)
    const f = mkFlood(A, cells, { room: r.i, drain: [((r.ix0 + r.ix1 + 1) / 2) * TS, ((r.iy0 + r.iy1 + 1) / 2) * TS] }); r.flood = f;
  }
}
