// ===================== bottomless pits: holes in the floor going down into the dark =====================
// The sheet's pit pieces: the earth under a floor's edge with roots hanging from it, fading into black ([10..15, 4] on
// the brown floors, [10..15, 12] on the grey), laid in a pit tile right under a floor tile (we look down past the
// floor's south edge at its thickness), or under the foot of a north wall the pit runs up to; the rest of a pit is
// black. Its other sides show nothing: the floor beside it is seen edge on, and the floor in front of it hides the
// pit's far wall. A side wall's strip of floor beside a pit, and the top rows of a south wall in front of one, go down
// into it too.
// Feet stop at a pit's edge (it blocks like water, and like water it lets sight, arrows and spells over it), and a roll
// or a lunge stops there too; but a hard enough blow (a brute's shove, a heavy swing, a wave, a spike's throw) carries
// whoever takes it over the edge (a brute's, straight away from it), and they fall: smaller and darker into the black,
// sinking behind the floor in front of the hole, and gone. A hero who falls climbs back out where he last stood clear
// of every pit, a fifth of his health the poorer (a fall he cannot pay for is his last); a foe that falls is gone, and
// its loot with it. Blood, gibs, sparks and stones that come down over a pit drop away into it and leave no mark, and
// nothing painted on the floor ever shows on the void.
// Three ways a room can have them (pitPlan, after the set pieces and before the rooms are furnished; never the first
// room, the last, the treasure room or a set piece's): THE CHASM, a band of pit two or three tiles wide from wall to
// wall, crossed by a stone bridge two tiles wide with a brute standing guard on it; BROKEN FLOOR, holes here and there,
// with some cracked slabs round them that give way a moment after anyone steps on them (they shake, grind and drop);
// THE LEDGES, a room all pit but a platform in its middle, a brute on it, and the ways out to it from every door;
// THE CRUMBLING FLOOR, a room with no hole in it as you come in, nearly every slab of it cracked (pitCrumble); and two
// that only give a fight an edge: PIT CORNERS, a hole two or three tiles square in two to four of a room's corners, and
// THE PIT RIM, a pit a tile wide along every wall but where the doors come in (pitEdges). A treasure room may be laid
// any of the last three ways. THE SPIKED WALKWAY: a room all pit but a walkway two wide from every door to a junction in
// its middle, with a field of spike traps across one of the ways (pitSpikeway).
// Every door of such a room stays joined to every other, and no floor is left cut off. Its cracked slabs lie still until
// a hero first sets foot in the room (nobody breaks them before he gets there).
const PIT = 4, PIT_DMG = 0.2, FALL_T = 0.95, CRUMBLE_T = 0.55, PIT_KNOCK = 110;
const FORCE_PITS = { on: false }; // the pit floor (kit screen): every kind of pit room that fits
let PITPASS = false; // (while a knocked unit moves, a pit does not stop it: 31_walls' wallBoxes)
const pitFace = A => A.th.tone === 'grey' ? [10, 12] : [10, 4];
let PIT_BLACK = null;
function pitBlack() { if (isMagma(ARENA)) return LAVA.rgb; /* (the magma's pits hold lava: 42_magma) */ if (ARENA && ARENA.th.sheet === 'crypt') return '#000'; /* (the crypt's: black, no brown to be taken for the earth of its worn floors) */ if (PIT_BLACK) return PIT_BLACK; const P = PIX.cellar, i = ((4 * TS + 15) * P.w + 10 * TS + 8) * 4; return (PIT_BLACK = `rgb(${P.d[i]},${P.d[i + 1]},${P.d[i + 2]})`); }
// a pit's hollow, or the charnel pit's (its ragged hole inside the stone rim: 43_crypt): what falls there goes down it
function holeAt(x, y) { const A = ARENA; if (!A) return false; if (A.pitN && pitAt(x, y)) return true; const C = A.charnel; if (!C) return false; const lx = x - C.x0 * TS, ly = y - C.y0 * TS; return lx >= 5 && lx <= 43 && ly >= 3 && ly <= 43; }
function pitAt(x, y) { const A = ARENA; if (!A || !A.fl) return false; const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx >= 0 && ty >= 0 && tx < A.w && ty < A.h && A.fl[ty * A.w + tx] === PIT; }
// a pit tile on the ground: black, the earth face under whatever stands to its north (a floor's edge, or the foot of a
// wall the pit runs up to), and the walls beside it: every pixel a wall
// piece leaves open in the four next to the pit (a side wall's strip, the open corner under a cap, a south wall's top)
// is pit too, the earth face carried on into it, and the wall's own pixels stay over it
const PIT_BAND = 4; let PITB = null;
function pitPaint(A, g, i) {
  const W = A.w, x = i % W, y = (i / W) | 0, n = A.fl[i - W], face = y > 0 && n !== PIT && !(A.plankSet && A.plankSet.has(i - W)), f = pitFace(A), v = (x * 5 + y * 3) % 6; // (no earth face under a wooden bridge: its planks' own edge)
  if (isMagma(A) && A.plankSet && A.plankSet.has(i)) { g.fillStyle = LAVA.under; g.fillRect(x * TS, y * TS, TS, TS); lavaMark(A, g, x * TS, y * TS, TS, TS); return; } /* (under a bridge over the lava: its shadow, dark, so the gaps between its planks are joints and never slivers of lava: 42_magma) */
  g.fillStyle = pitBlack(); g.fillRect(x * TS, y * TS, TS, TS); if (face) sheetTile(g, f, x * TS, y * TS, v, 0); if (isMagma(A)) magmaPitRim(A, g, i);
  if (!A.wt) { if (isMagma(A)) lavaMark(A, g, x * TS, y * TS, TS, TS); return; } const sx = (f[0] + v) * TS, sy = f[1] * TS, B = PIT_BAND;
  // [the wall's index, the band in its own tile, where the face's columns come from (or none)]
  for (const [j, bx, by, bw, bh, fx] of [[i - 1, TS - B, 0, B, TS, TS - B], [i + 1, 0, 0, B, TS, 0], [i + W, 0, 0, TS, B, -1]]) {
    if (A.fl[j] !== 0 || !A.wt[j]) continue; const c = A.wt[j] - 1, ptx = (c / 64) | 0, pty = c % 64, wx = (j % W) * TS, wy = ((j / W) | 0) * TS;
    if (!PITB) PITB = mkCanvas(TS, TS); const t = PITB.getContext('2d'); t.imageSmoothingEnabled = false; t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, TS, TS);
    t.fillStyle = pitBlack(); t.fillRect(bx, by, bw, bh); if (face && fx >= 0) t.drawImage(IMG.cellar, sx + fx, sy, bw, TS, bx, 0, bw, TS);
    t.globalCompositeOperation = 'destination-out'; t.save(); if (A.wf && A.wf[j]) { t.translate(TS, 0); t.scale(-1, 1); } { const [im, sx, sy] = srcOf(ptx, pty + A.th.fy); t.drawImage(im, sx, sy, TS, TS, 0, 0, TS, TS); } t.restore(); // (only where the wall leaves it open)
    t.globalCompositeOperation = 'source-over'; g.drawImage(PITB, wx, wy);
  }
  if (isMagma(A)) lavaMark(A, g, x * TS - TS, y * TS, 3 * TS, 2 * TS); // (what of it is lava, for the lava's own drawing: 42_magma)
}
// marks painted on the ground (blood, scorch, footprints) never stay on a pit: the pits they touched are painted again
function pitMend(A, g, x0, y0, x1, y1) {
  if (!A.pitN) return; const tx0 = Math.max(0, Math.floor(x0 / TS) - 1), tx1 = Math.min(A.w - 1, Math.floor(x1 / TS) + 1), ty0 = Math.max(0, Math.floor(y0 / TS) - 1), ty1 = Math.min(A.h - 1, Math.floor(y1 / TS) + 1);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (A.fl[ty * A.w + tx] === PIT && !(A.plankSet && A.plankSet.has(ty * A.w + tx))) pitPaint(A, g, ty * A.w + tx); // (a plank being laid stays)
}

// ---- building
const pitShuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = randi(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pitRoomOK = (A, r) => r.kind === 'room' && !r.chest && !r.set && !r.sluice && !r.pool && !r.shrine && !r.shape && !r.puz;
// the door cells and the floor just inside each door (two tiles deep), which always stay
function doorLanding(A, r, deep = 2) {
  const keep = new Set();
  for (const d of r.doors) for (const [x, y] of d.cells) {
    keep.add(y * A.w + x); const [dx, dy] = d.side === 'N' ? [0, 1] : d.side === 'S' ? [0, -1] : d.side === 'W' ? [1, 0] : [-1, 0];
    for (let k = 1; k <= deep; k++) keep.add((y + dy * k) * A.w + x + dx * k);
  }
  return keep;
}
// with these tiles gone, is every door still joined to every other, and how much of the room's floor can be reached
function pitReach(A, r, gone) {
  const W = A.w, inside = i => { const x = i % W, y = (i / W) | 0; return x >= r.fx0 && x <= r.fx1 && y >= r.fy0 && y <= r.fy1; };
  const open = i => inside(i) && FLOOR(A.fl[i]) && !gone.has(i), d0 = r.doors[0]; if (!d0) return null;
  const s = d0.cells[1][1] * W + d0.cells[1][0], seen = new Set([s]), q = [s];
  while (q.length) { const i = q.pop(); for (const j of [i - 1, i + 1, i - W, i + W]) if (!seen.has(j) && open(j)) { seen.add(j); q.push(j); } }
  const linked = r.doors.every(d => d.cells.some(([x, y]) => seen.has(y * W + x)));
  let all = 0; for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) if (open(y * W + x)) all++;
  return { linked, seen, all };
}
// every floor tile of the room still reached from its doors, with these tiles gone (none at all cut off)
function noIsland(A, r, R, gone) { for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * A.w + x; if (FLOOR(A.fl[i]) && !gone.has(i) && !R.seen.has(i)) return false; } return true; }
// holes here and there, never against a wall, and cracked slabs round some of them
function pitHoles(A, r) {
  const keep = doorLanding(A, r), gone = new Set(), n = randi(2, 4), W = A.w; let made = 0;
  for (let tries = 0; made < n && tries < 50; tries++) {
    const w = randi(2, 3), h = randi(2, 3), x0 = randi(r.ix0 + 1, r.ix1 - w), y0 = randi(r.iy0 + 1, r.iy1 - h); if (x0 < r.ix0 + 1 || y0 < r.iy0 + 1) continue;
    let cells = []; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) cells.push(y * W + x);
    if (w * h > 4 && chance(0.6)) { const c = pick([0, w - 1, (h - 1) * w, h * w - 1]); cells = cells.filter((_, k) => k !== c); } // a corner bitten off: an odd shape
    if (cells.some(i => keep.has(i) || gone.has(i) || !FLOOR(A.fl[i]) || [i - 1, i + 1, i - W, i + W, i - W - 1, i - W + 1, i + W - 1, i + W + 1].some(j => gone.has(j)))) continue; // (holes apart)
    cells.forEach(i => gone.add(i)); const R = pitReach(A, r, gone); if (!R || !R.linked || !noIsland(A, r, R, gone)) { cells.forEach(i => gone.delete(i)); continue; } made++;
  }
  if (made < 2) return null;
  // the cracked slabs: on the edge of a hole, and even if they all give way the doors stay joined
  const crack = []; for (const i of pitShuffle([...gone])) for (const j of pitShuffle([i - 1, i + 1, i - W, i + W])) {
    if (crack.length >= randi(3, 5) || gone.has(j) || keep.has(j) || crack.includes(j) || !FLOOR(A.fl[j])) continue; const x = j % W, y = (j / W) | 0; if (x < r.ix0 || x > r.ix1 || y < r.iy0 || y > r.iy1) continue;
    const all = new Set([...gone, ...crack, j]), R = pitReach(A, r, all); if (R && R.linked && noIsland(A, r, R, all)) crack.push(j); // (even if they all give way, no floor is cut off: a slab that was the last way to a tile left whoever stood there on an island)
  }
  return { cells: gone, crack };
}
// a band of pit from wall to wall, two or three tiles wide, crossed by a bridge two tiles wide
function pitChasm(A, r) {
  const W = A.w, H = randi(2, 3), opts = [];
  const sideRows = r.doors.filter(d => d.side === 'E' || d.side === 'W').flatMap(d => d.cells.map(c => c[1])), sideCols = r.doors.filter(d => d.side === 'N' || d.side === 'S').flatMap(d => d.cells.map(c => c[0]));
  for (let y = r.iy0 + 2; y + H - 1 <= r.iy1 - 2; y++) if (!sideRows.some(v => v >= y - 1 && v <= y + H)) opts.push({ v: false, at: y });
  for (let x = r.ix0 + 2; x + H - 1 <= r.ix1 - 2; x++) if (!sideCols.some(v => v >= x - 1 && v <= x + H)) opts.push({ v: true, at: x });
  for (const o of pitShuffle(opts)) {
    const lo = o.v ? r.iy0 + 1 : r.ix0 + 1, hi = o.v ? r.iy1 - 2 : r.ix1 - 2; if (hi < lo) continue; const b = randi(lo, hi), cells = new Set(), bridge = [];
    for (let k = 0; k < H; k++) for (let s = o.v ? r.iy0 : r.ix0; s <= (o.v ? r.iy1 : r.ix1); s++) {
      const x = o.v ? o.at + k : s, y = o.v ? s : o.at + k, i = y * W + x; if (s === b || s === b + 1) { bridge.push([x, y]); continue; } cells.add(i);
    }
    const R = pitReach(A, r, cells); if (!R || !R.linked || R.seen.size < R.all * 0.95) continue;
    return { cells, guard: o.v ? [(o.at + H / 2) * TS, (b + 1) * TS + 4] : [(b + 1) * TS, (o.at + H / 2) * TS + 4], bridge, v: o.v };
  }
  return null;
}
// all pit but a platform in the middle and a way two wide from each door out to it
function pitLedges(A, r) {
  const W = A.w, keep = doorLanding(A, r, 1), add = (x, y) => { if (x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1) keep.add(y * W + x); };
  const cx = Math.floor((r.ix0 + r.ix1) / 2), cy = Math.floor((r.iy0 + r.iy1) / 2);
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 2; x++) add(x, y);
  for (const d of r.doors) {
    const [ax, ay] = d.cells[chance(0.5) ? 0 : 1], N = d.side === 'N' || d.side === 'S';
    if (N) { const y0 = d.side === 'N' ? r.iy0 : r.iy1, sy = cy > y0 ? 1 : -1; for (let y = y0; y !== cy + sy; y += sy) { add(ax, y); add(ax + 1, y); } for (let x = Math.min(ax, cx); x <= Math.max(ax + 1, cx + 1); x++) { add(x, cy); add(x, cy - sy); } }
    else { const x0 = d.side === 'W' ? r.ix0 : r.ix1, sx = cx > x0 ? 1 : -1; for (let x = x0; x !== cx + sx; x += sx) { add(x, ay); add(x, ay + 1); } for (let y = Math.min(ay, cy); y <= Math.max(ay + 1, cy); y++) { add(cx, y); add(cx + 1, y); } }
  }
  const cells = new Set(); for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (!keep.has(i) && FLOOR(A.fl[i])) cells.add(i); }
  const R = pitReach(A, r, cells); if (!R || !R.linked) return null;
  for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (FLOOR(A.fl[i]) && !cells.has(i) && !R.seen.has(i)) cells.add(i); } // (nothing left cut off)
  return { cells, guard: [(cx + 1) * TS, cy * TS + 10] };
}
// THE CRUMBLING FLOOR: nearly every slab cracked, to give way a moment after a foot comes down on it, and no hole showing
// as you come in. A winding way of sound slabs joins every door (each door's landing stays too), but it looks like the
// rest: only the crumbs that drop now and then off the cracked ones tell them apart. Run, and the floor falls in behind
// you; stop on a cracked slab and you go down with it. A treasure room can be laid this way too (it looks like any
// other): there the ways lead to its chest, which stands on sound stone with a little sound floor in front of it for its
// guardian (who will not stay on it once it comes after you).
function pitCrumble(A, r) {
  const W = A.w, keep = doorLanding(A, r, 2), inside = (x, y) => x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1, loot = r.kind === 'treasure' || r.chest;
  const hub = loot ? chestSpot(r) : [randi(r.ix0 + 2, r.ix1 - 2), randi(r.iy0 + 2, r.iy1 - 2)];
  if (loot) for (let y = hub[1]; y <= hub[1] + 2; y++) for (let x = hub[0] - 1; x <= hub[0] + 1; x++) if (inside(x, y)) keep.add(y * W + x);
  for (const d of r.doors) { // from the inner edge of each door's landing, a way that wanders toward the hub
    const [dx, dy] = d.side === 'N' ? [0, 1] : d.side === 'S' ? [0, -1] : d.side === 'W' ? [1, 0] : [-1, 0]; let [x, y] = pick(d.cells); x += dx * 2; y += dy * 2;
    for (let n = 0; n < 300 && !(x === hub[0] && y === hub[1]); n++) {
      keep.add(y * W + x); const ex = hub[0] - x, ey = hub[1] - y; let mx = 0, my = 0;
      if (chance(0.3)) { if (chance(0.5)) mx = pick([-1, 1]); else my = pick([-1, 1]); } // (a step aside: the way winds)
      else if (ex && (!ey || chance(Math.abs(ex) / (Math.abs(ex) + Math.abs(ey))))) mx = Math.sign(ex); else my = Math.sign(ey);
      if (inside(x + mx, y + my)) { x += mx; y += my; }
    }
    keep.add(y * W + x);
  }
  const crack = new Set(); for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (!keep.has(i) && FLOOR(A.fl[i])) crack.add(i); }
  const R = pitReach(A, r, crack); if (!R || !R.linked || crack.size < 20) return null;
  for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (FLOOR(A.fl[i]) && !R.seen.has(i)) crack.add(i); } // (no sound slab left an island)
  return { cells: new Set(), crack: [...crack], tell: 0.15 };
}
// THE SPIKED WALKWAY. All pit but a walkway two wide from every door to a two-by-two junction in the middle: straight in
// from the door, then along to the junction (an L where a door does not line up with it). Across one door's way, a field
// of spike traps two or three deep, in step. A spike throws whoever it stabs hard out of the nearer end of its field,
// along the way: on a straight stretch that is along the walkway, but from the deeper floors on the field lies right
// before a turn, and thrown out of that end you go on over the corner into the pit. There a brute holds the junction.
function pitSpikeway(A, r) {
  if (r.doors.length < 2) return null; const W = A.w, keep = doorLanding(A, r, 1), add = (x, y) => { if (x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1) keep.add(y * W + x); };
  const cx = Math.floor((r.ix0 + r.ix1) / 2), cy = Math.floor((r.iy0 + r.iy1) / 2), legs = [];
  for (let y = cy; y <= cy + 1; y++) for (let x = cx; x <= cx + 1; x++) add(x, y);
  for (const d of r.doors) {
    const V = d.side === 'N' || d.side === 'S', [ax, ay] = d.cells[0];
    if (V) { // straight in down (or up) the door's columns to the junction's rows, then along them to the junction
      const y0 = d.side === 'N' ? r.iy0 : r.iy1, sy = d.side === 'N' ? 1 : -1, y1 = sy > 0 ? cy + 1 : cy; for (let y = y0; y !== y1 + sy; y += sy) { add(ax, y); add(ax + 1, y); }
      for (let x = Math.min(ax, cx); x <= Math.max(ax + 1, cx + 1); x++) { add(x, cy); add(x, cy + 1); }
      legs.push({ ax: 'y', lane: ax, from: y0, to: y1, s: sy, turn: ax !== cx });
    } else {
      const x0 = d.side === 'W' ? r.ix0 : r.ix1, sx = d.side === 'W' ? 1 : -1, x1 = sx > 0 ? cx + 1 : cx; for (let x = x0; x !== x1 + sx; x += sx) { add(x, ay); add(x, ay + 1); }
      for (let y = Math.min(ay, cy); y <= Math.max(ay + 1, cy + 1); y++) { add(cx, y); add(cx + 1, y); }
      legs.push({ ax: 'x', lane: ay, from: x0, to: x1, s: sx, turn: ay !== cy });
    }
  }
  const cells = new Set(); for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (!keep.has(i) && FLOOR(A.fl[i])) cells.add(i); }
  const R = pitReach(A, r, cells); if (!R || !R.linked) return null;
  for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (FLOOR(A.fl[i]) && !cells.has(i) && !R.seen.has(i)) cells.add(i); } // (nothing left cut off)
  // the spikes: across the longest way in (from the deeper floors, one that turns, the field right before its turn)
  const deep = A.floor >= 3, D = randi(2, 3), len = l => Math.abs(l.to - l.from) + 1, fit = legs.filter(l => len(l) >= D + 3);
  const leg = (deep && fit.filter(l => l.turn).sort((a, b) => len(b) - len(a))[0]) || fit.sort((a, b) => len(b) - len(a))[0]; if (!leg) return null;
  const turnAt = deep && leg.turn, end = leg.ax === 'y' ? (leg.s > 0 ? cy : cy + 1) : (leg.s > 0 ? cx : cx + 1); // (the junction's near edge along the way)
  const m0 = turnAt ? end - leg.s * D : Math.round((leg.from + leg.to) / 2 - leg.s * (D - 1) / 2), lo0 = Math.min(m0, m0 + leg.s * (D - 1)), spikes = [];
  // (where the way is two wide and no other crosses it: there, or as near as the leg allows; a field that has to stand where
  // it is wider, by a door's landing, takes in the third lane too, or that lane is a way past)
  const at = (a, k) => (leg.ax === 'y' ? [leg.lane + k, a] : [a, leg.lane + k]), walk = ([x, y]) => x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1 && FLOOR(A.fl[y * W + x]) && !cells.has(y * W + x);
  const a0 = Math.min(leg.from, leg.to), a1 = Math.max(leg.from, leg.to), clean = l => { for (let j = 0; j < D; j++) if (!walk(at(l + j, 0)) || !walk(at(l + j, 1)) || walk(at(l + j, -1)) || walk(at(l + j, 2))) return false; return true; };
  let lo = lo0; for (let d = 0; d <= a1 - a0; d++) { const c = [lo0 - leg.s * d, lo0 + leg.s * d].find(l => l >= a0 && l + D - 1 <= a1 && clean(l)); if (c !== undefined) { lo = c; break; } }
  for (let j = 0; j < D; j++) for (let k = 0; k < 2; k++) spikes.push(at(lo + j, k));
  if (!clean(lo)) for (let j = 0; j < D; j++) for (const k of [-1, 2]) if (walk(at(lo + j, k))) spikes.push(at(lo + j, k));
  if (spikes.some(([x, y]) => cells.has(y * W + x) || !FLOOR(A.fl[y * W + x]))) return null;
  return { cells, spikes, spikeAx: leg.ax, spikeC: (lo + D / 2) * TS, guard: deep ? [(cx + 1) * TS, (cy + 1) * TS + 4] : null };
}
// what of a room stays floor whatever pit it gets: every door's landing, and a treasure room's chest with a little floor
// in front of it for its guardian
function pitKeep(A, r) {
  const keep = doorLanding(A, r, 2); if (r.kind === 'treasure' || r.chest) { const [cx, cy] = chestSpot(r); for (let y = cy; y <= cy + 2; y++) for (let x = cx - 1; x <= cx + 1; x++) keep.add(y * A.w + x); }
  return keep;
}
// PIT CORNERS (rim false): holes two or three tiles square in two to four corners, never on a door's landing; THE PIT RIM
// (rim true): a pit a tile wide along every wall but where the doors come in. Either way the doors stay joined and no
// floor is cut off.
function pitEdges(A, r, rim) {
  const W = A.w, keep = pitKeep(A, r), gone = new Set(), ok = () => { // (the doors joined, and every floor tile left reached from them)
    const R = pitReach(A, r, gone); if (!R || !R.linked) return false; for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (FLOOR(A.fl[i]) && !gone.has(i) && !R.seen.has(i)) return false; } return true;
  };
  if (rim) { for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if ((x === r.ix0 || x === r.ix1 || y === r.iy0 || y === r.iy1) && !keep.has(i) && FLOOR(A.fl[i])) gone.add(i); } return ok() ? { cells: gone } : null; }
  let made = 0; const want = randi(2, 4);
  for (const [x0, y0, sx, sy] of pitShuffle([[r.ix0, r.iy0, 1, 1], [r.ix1, r.iy0, -1, 1], [r.ix0, r.iy1, 1, -1], [r.ix1, r.iy1, -1, -1]])) {
    if (made >= want) break; const n = r.w >= 10 && r.h >= 8 && chance(0.5) ? 3 : 2, cells = [];
    for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) cells.push((y0 + sy * j) * W + x0 + sx * k);
    if (cells.some(i => keep.has(i) || !FLOOR(A.fl[i]))) continue; cells.forEach(i => gone.add(i)); if (ok()) made++; else cells.forEach(i => gone.delete(i));
  }
  return made >= 2 ? { cells: gone } : null;
}
function pitPlan(A, g) {
  A.pitSets = []; A.crumbles = []; A.crumbleSet = new Set(); A.live = new Set(); A.pitN = A.pitN || 0; A.plankSet = A.plankSet || new Set(); A.peb = []; A.fallers = []; // (a drawbridge's chasm is already dug: 37_levels)
  const kinds = FORCE_PITS.on ? ['spikeway', 'ledges', 'chasm', 'crumble', 'rim', 'corners', 'holes'] : A.floor < 2 ? [chance(0.35) && 'holes', chance(0.25) && 'crumble', chance(0.25) && 'corners'].filter(Boolean)
    : [chance(0.5) && pick(['chasm', 'ledges', 'spikeway']), chance(0.4) && 'holes', chance(0.3) && 'crumble', chance(0.35) && pick(['rim', 'corners'])].filter(Boolean);
  if (ARCH.cur.pits && A.floor >= 2) for (let i = 0; i < ARCH.cur.pits; i++) kinds.push(pick(['chasm', 'ledges', 'holes', 'crumble', 'rim', 'corners', 'spikeway'])); // (THE BROKEN FLOORS: 35_themes)
  // the treasure room's: cracked slabs ('loot'), pit corners or the pit rim ('t' + kind)
  const tk = FORCE_PITS.on ? 'loot' : chance(A.floor < 2 ? 0.3 : 0.45) ? pick(['loot', 'loot', 'trim', 'tcorners']) : null; if (tk) kinds.push(tk);
  for (const kind of kinds) for (const r of pitShuffle(A.rooms.filter(r => kind === 'loot' || kind[0] === 't' ? (r.kind === 'treasure' || r.chest) && !r.set && !r.sluice && !r.pool && !r.shrine && !r.shape : pitRoomOK(A, r)))) {
    const k = kind[0] === 't' ? kind.slice(1) : kind; // (rim, corners)
    if (k === 'ledges' && (r.w < 11 || r.h < 8) || k === 'chasm' && (r.w < 9 || r.h < 8) || (k === 'crumble' || k === 'loot') && (r.w < 8 || r.h < 6) || k === 'rim' && (r.w < 7 || r.h < 6) || k === 'spikeway' && (r.w < 10 || r.h < 8) || k === 'corners' && (r.w < 8 || r.h < 7) || r.w * r.h < 48) continue;
    const res = k === 'chasm' ? pitChasm(A, r) : k === 'ledges' ? pitLedges(A, r) : k === 'crumble' || k === 'loot' ? pitCrumble(A, r) : k === 'rim' || k === 'corners' ? pitEdges(A, r, k === 'rim') : k === 'spikeway' ? pitSpikeway(A, r) : pitHoles(A, r); if (!res) continue;
    if (res.spikes) { const Wk = wkOf(A), ph = rand(0, SPIKE_T); A.spikes = A.spikes || []; for (const [tx, ty] of res.spikes) A.spikes.push({ tx, ty, x: tx * TS + 8, y: ty * TS + 8, tile: spikeLook(Wk), ph, hit: new Set(), was: 0, ax: res.spikeAx, fc: res.spikeC }); }
    // a chasm's bridge: the floor left standing (stone), or half the time the sheet's wooden bridge over the black
    const wood = k === 'chasm' && res.bridge && chance(0.5) ? pick(['orange', 'green']) : null; if (wood) for (const [x, y] of res.bridge) A.plankSet.add(y * A.w + x);
    for (const i of res.cells) A.fl[i] = PIT; for (const i of res.cells) pitPaint(A, g, i); A.pitN += res.cells.size;
    if (wood) { const xs = res.bridge.map(c => c[0]), ys = res.bridge.map(c => c[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), tr = res.v ? 'ew' : 'ns', n = (res.v ? Math.max(...xs) - x0 + 1 : Math.max(...ys) - y0 + 1) * 2;
      for (const [x, y] of res.bridge) pitPaint(A, g, y * A.w + x); for (let j = 0; j < n; j++) plankStrip(g, tr, wood, j, x0 * TS + (res.v ? j * 8 : 0), y0 * TS + (res.v ? 0 : j * 8)); }
    r.set = kind; r.pitGuard = res.guard || null; A.pitSets.push(kind);
    for (const i of res.crack || []) { const x = i % A.w, y = (i / A.w) | 0, cv = mkCanvas(TS, TS); cv.getContext('2d').drawImage(g.canvas, x * TS, y * TS, TS, TS, 0, 0, TS, TS); A.crumbles.push({ i, x, y, cv, st: 0, t: 0, ph: rand(TAU), room: r.i, tell: res.tell || 0.5 }); A.crumbleSet.add(i); }
    break;
  }
}

// ---- falling
function startFall(u) {
  if (isMagma(ARENA)) { lavaPlunge(u); return; } // (the magma's pits hold lava: 42_magma)
  u.fall = { t: 0, T: FALL_T * (u.scale > 1.2 ? 1.2 : 1), x: u.x, y: u.y, spin: rand(-0.9, 0.9) }; u.vx = u.vy = u.kx = u.ky = 0; u.act = null; u.sprint = false; u.blocking = false; u.stun = 0;
  removeIf(FX.nums, n => n.on === u); // (its marks go with it)
  pebbles(u.x, u.y - 2, 8); smoke(u.x, u.y, 2, 'dust', 6, 12, 0.6); SFX.fall(panOf(u.x), u.scale > 1.2, u.team === 'hero');
  if (u.team === 'hero') { shake(0.15); G.hurtFlash = 0.2; if (u.hp - Math.round(u.maxHp * PIT_DMG) <= 0 && !(TEST.on && TEST.god)) { u.fall.fatal = true; SFX.scream(panOf(u.x)); } } // (a fall he will not climb out of: he screams, 48_deaths)
}
function endFall(u) {
  if (u.fall.lava) { lavaOut(u, u.fall); return; }
  const F = u.fall; u.fall = null;
  if (u.team !== 'hero') { u.dead = true; u.hp = 0; u.act = null; if (!u.raisedBy) G.kills++; return; } // gone, and all it carried
  const dmg = Math.round(u.maxHp * PIT_DMG);
  if (u.hp - dmg <= 0 && !(TEST.on && TEST.god)) { // a fall he cannot pay for: he is gone
    Object.assign(u, { dead: true, hp: 0, act: null, stun: 0, deadT: 0, gone: true, dropped: true, death: { kind: 'fall', x: F.x, y: F.y } }); return; // (the long fall: silence, then the impact far below, 48_deaths)
  }
  let s = u.safe || ARENA.spawn; if (penned(ARENA, s)) s = doorLandingNear(ARENA, s) || ARENA.spawn; u.penned = false; /* (never back onto floor cut off from the doors: inside the nearest door) */ u.hp = Math.max(1, u.hp - dmg); u.x = s.x; u.y = s.y; u.z = 0; u.vx = u.vy = u.kx = u.ky = 0; u.iframe = 1; u.rise = 1; u.path = null;
  number(u.x, u.y, headZ(u) + 1, dmg, 'red', false, u); G.hurtFlash = 0.35; shake(0.2); smoke(u.x, u.y, 4, 'dust', 8, 14, 0.8); SFX.stone(panOf(u.x), false);
}
// a few stones and crumbs off the edge, down into the dark
function pebbles(x, y, n) { const A = ARENA; if (!A || !A.peb) return; for (let i = 0; i < n; i++) A.peb.push({ x: x + rand(-5, 5), y: y + rand(-2, 2), vy: rand(10, 40), t: 0, life: rand(0.35, 0.7), c: pick(['#5a4a3a', '#7a6a58', '#3a3028', '#8a7a66']) }); if (A.peb.length > 80) A.peb.splice(0, A.peb.length - 80); }
// (a brute's shove or slam throws whoever it lands on straight away from it, from a slam's middle, never bent toward an
// edge: a hero goes over only with the pit behind him)
// a crack running over a cracked slab sets it crumbling (a heavy blow's, or a brute's slam's: 40_fx cracks)
function crackSlabs(x0, y0, x1, y1) {
  const A = ARENA; if (!A || !A.crumbleSet || !A.crumbleSet.size) return; const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
  for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n, i = Math.floor(y / TS) * A.w + Math.floor(x / TS); if (!A.crumbleSet.has(i)) continue; const c = A.crumbles.find(c => c.i === i); if (c && c.st === 0) { c.st = 1; c.t = 0; SFX.crumble(panOf(x), 0); } }
}
function pitKnock(u) { return !u.fly && !u.under && Math.hypot(u.kx, u.ky) > PIT_KNOCK && !(u.def && u.def.fireproof && isMagma(ARENA)); } // (what is made of fire is not thrown into the lava)
// Penned in: the floor he stands on joined to no door of his room (pits all round, loose slabs fallen). No layout should
// ever do it (38_pits pitHoles noIsland), but should one, he is never stuck for good: he may step off the edge, and the
// fall puts him back where he last stood clear (50_actors lets him over the edge).
function doorLandingNear(A, p) { const r = roomAt(p.x, p.y); if (!r) return null; let best = null, bd = 1e9; for (const d of r.doors) { const [x, y] = d.cells[1], [dx, dy] = d.side === 'N' ? [0, 1] : d.side === 'S' ? [0, -1] : d.side === 'W' ? [1, 0] : [-1, 0], q = { x: (x + dx * 2) * TS + 8, y: (y + dy * 2) * TS + 8 }, dd = dist(q.x, q.y, p.x, p.y); if (dd < bd && FLOOR(A.fl[Math.floor(q.y / TS) * A.w + Math.floor(q.x / TS)])) { bd = dd; best = q; } } return best; }
// Unsupported floor gives way on its own: when a slab drops, any floor next to it that is no longer joined to its room's
// doors (a slab with nothing but pit north, south, east and west, held only at its corners, or a patch of a few cut off
// together) cracks and falls a moment later, whoever is on it going down with it. So no one is ever left marooned.
function unsupported(A, c) {
  const r = A.rooms[c.room] || roomAt(c.x * TS + 8, c.y * TS + 8); if (!r) return; if (A.lake && A.lake.r === r) return; // (the lake's island stands alone once its bridges are down: 42_magmaboss)
  const doors = new Set(r.doors.flatMap(d => d.cells.map(([x, y]) => y * A.w + x))), inside = i => { const x = i % A.w, y = (i / A.w) | 0; return x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1; };
  for (const s of [c.i - 1, c.i + 1, c.i - A.w, c.i + A.w]) {
    if (!inside(s) || !FLOOR(A.fl[s]) || A.crumbles.some(q => q.i === s && q.st > 0)) continue;
    const seen = new Set([s]), q = [s]; let held = false;
    while (q.length && !held) { const i = q.pop(); if (doors.has(i) || seen.size > 120) { held = true; break; } for (const j of [i - 1, i + 1, i - A.w, i + A.w]) if (!seen.has(j) && FLOOR(A.fl[j]) && (inside(j) || doors.has(j))) { seen.add(j); q.push(j); } }
    if (held) continue;
    for (const i of seen) { // cracks, shakes, and goes, one slab a beat after another
      let q = A.crumbles.find(k => k.i === i); const x = i % A.w, y = (i / A.w) | 0;
      if (!q) { const cv = mkCanvas(TS, TS), k = groundChunks(A).find(k => x * TS >= k.x && x * TS < k.x + k.w && y * TS >= k.y && y * TS < k.y + k.h); if (k) cv.getContext('2d').drawImage(k.cv, x * TS - k.x, y * TS - k.y, TS, TS, 0, 0, TS, TS); q = { i, x, y, cv, st: 0, t: 0, ph: rand(TAU), room: c.room, tell: 0.3 }; A.crumbles.push(q); A.crumbleSet.add(i); }
      if (q.st === 0) { q.st = 1; q.t = -rand(0.15, 0.45); SFX.crumble(panOf(x * TS + 8), 0); }
    }
  }
}
function penned(A, u) {
  if (!A.pitN) return false; const r = roomAt(u.x, u.y), s = footTile(u.x, u.y); if (!r || !FLOOR(A.fl[s])) return false; if (A.lake && A.lake.r === r) return false; // (on the lake's island he is meant to be cut off)
  const doors = new Set(r.doors.flatMap(d => d.cells.map(([x, y]) => y * A.w + x))), seen = new Set([s]), q = [s];
  while (q.length) { const i = q.pop(); if (doors.has(i) || seen.size > 80) return false; for (const j of [i - 1, i + 1, i - A.w, i + A.w]) if (!seen.has(j) && FLOOR(A.fl[j])) { seen.add(j); q.push(j); } }
  return true;
}
function pitsTick(dt) {
  const A = ARENA; if (!A || !A.fl) return; if (!A.peb) Object.assign(A, { peb: [], fallers: [], crumbles: A.crumbles || [], pitN: A.pitN || 0 });
  // cracked slabs: still until a hero first comes into their room; then a foot on one sets it shaking, and a moment later
  // it drops away (with whoever stands on it, behind the south wall over it too: his foot counts as on that slab)
  if (!A.live) A.live = new Set();
  if (A.crumbles.length) for (const h of G.heroes) { if (h.dead) continue; const tx = Math.floor(h.x / TS), ty = Math.floor(h.y / TS); for (const r of A.rooms) if (tx >= r.ix0 && tx <= r.ix1 && ty >= r.iy0 && ty <= r.iy1) A.live.add(r.i); }
  const onSlab = (u, i) => !u.dead && !u.fly && !u.under && !u.fall && footTile(u.x, u.y) === i;
  for (const c of A.crumbles) {
    if (c.st === 0 && (c.room === undefined || A.live.has(c.room)) && G.units.some(u => onSlab(u, c.i))) { c.st = 1; c.t = 0; SFX.crumble(panOf(c.x * TS + 8), 0); }
    if (c.st === 0 && chance(dt * (c.tell || 0.5))) pebbles(c.x * TS + rand(3, 13), c.y * TS + rand(4, 14), 1); // (a crumb now and then off a cracked slab: the tell)
    if (c.st !== 1) continue; c.t += dt; if (chance(dt * 18)) pebbles(c.x * TS + rand(2, 14), c.y * TS + 15, 1); if (chance(dt * 10)) smoke(c.x * TS + rand(3, 13), c.y * TS + rand(6, 14), 1, 'dust', 4, 8, 0.5);
    if (c.t < CRUMBLE_T) continue; const on = G.units.filter(u => onSlab(u, c.i)); c.st = 2; A.fl[c.i] = PIT; A.pitN++; A.flv = (A.flv || 0) + 1;
    for (const u of on) if (!pitAt(u.x, u.y)) startFall(u); // (one standing behind the wall over it)
    for (const k of groundChunks(A)) { pitPaint(A, k.g, c.i); if (A.fl[c.i + A.w] === PIT) pitPaint(A, k.g, c.i + A.w); }
    unsupported(A, c); // (what that leaves standing on nothing goes too)
    A.fallers.push({ cv: c.cv, x: c.x * TS, y: c.y * TS, t: 0 }); pebbles(c.x * TS + 8, c.y * TS + 8, 10); smoke(c.x * TS + 8, c.y * TS + 8, 4, 'dust', 8, 16, 0.9); SFX.crumble(panOf(c.x * TS + 8), 1); if (G.me && dist(G.me.x, G.me.y, c.x * TS, c.y * TS) < 160) shake(0.12);
  }
  for (const u of G.units) {
    if (u.fall) { u.fall.t += dt; if (u.fall.lava) lavaFallTick(u, dt); if (u.fall.t >= u.fall.T) endFall(u); continue; }
    if (u.dead || u.fly || u.under || u.enter || u.noFall || (u.z || 0) > 2) continue; // (noFall: the lake's lord, who rises out of the lava: 42_magmaboss)
    if (u.rise > 0) u.rise -= dt;
    if ((A.pitN && pitAt(u.x, u.y)) || (isMagma(A) && wetAt(u.x, u.y))) { startFall(u); continue; } // (the floor gave way under it; or the lava rose)
    if (u.team !== 'hero') continue;
    // where he would climb back out: the last place he stood clear of every pit (and of every cracked slab), kept on every
    // floor (one whose only pits are hidden under loose slabs has none open until one gives way: he climbed out at the
    // floor's start)
    const i = footTile(u.x, u.y), clear = FLOOR(A.fl[i]) && ![i - 1, i, i + 1].some(j => [j - A.w, j, j + A.w].some(k => A.fl[k] === PIT || (A.fl[k] === 2 && isMagma(A)) || (A.crumbleSet && A.crumbleSet.has(k) && A.crumbles.some(c => c.i === k && c.st < 2))));
    if (clear) u.safe = { x: u.x, y: u.y };
    if ((u.penT = (u.penT || 0) - dt) <= 0) { u.penT = 0.5; const was = u.penned; u.penned = penned(A, u); if (u.penned && !was) textPop(u.x, u.y, headZ(u) + 6, 'NO WAY OUT · STEP OFF', 'red', false); }
    // pressing at an edge: stones crumble off it
    const sp = Math.hypot(u.vx, u.vy); if (A.pitN && sp > 12) { const px = u.x + u.vx / sp * 7, py = u.y + u.vy / sp * 5; if (pitAt(px, py) && chance(dt * 5)) { pebbles(px, py, 2); if (chance(0.5)) SFX.tick(panOf(px)); } }
  }
  for (const p of A.peb) { p.t += dt; p.vy += 260 * dt; p.y += p.vy * dt; } removeIf(A.peb, p => p.t >= p.life);
  for (const f of A.fallers) f.t += dt; removeIf(A.fallers, f => f.t >= 0.8);
}

// ---- drawing (on the floor, under everyone): a cracked slab shaking, a slab dropping away, stones falling
function drawPits(c) {
  const A = ARENA; if (!A || !A.crumbles) return;
  for (const q of A.crumbles) { if (q.st !== 1) continue; const j = ((G.time * 40) | 0) % 2 ? 1 : -1, k = Math.min(1, q.t / CRUMBLE_T); c.fillStyle = pitBlack(); c.globalAlpha = 0.5 * k; c.fillRect(q.x * TS, q.y * TS, TS, TS); c.globalAlpha = 1; c.drawImage(q.cv, q.x * TS + (k > 0.4 ? j : 0), q.y * TS + (k > 0.7 ? 1 : 0)); }
  for (const f of A.fallers) { const e = f.t / 0.8, s = 1 - 0.7 * e * e; c.save(); c.beginPath(); c.rect(f.x - 4, f.y - 4, TS + 8, TS + 4); c.clip(); c.globalAlpha = Math.max(0, 1 - e * 1.3); c.translate(f.x + 8, f.y + 8 + 10 * e * e); c.scale(s, s); c.drawImage(f.cv, -8, -8); c.restore(); }
  for (const p of A.peb) { c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = p.c; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } c.globalAlpha = 1;
}
// someone falling: smaller and darker into the black, turning a little, hidden by the floor in front of the hole as he sinks
let FALLCV = null;
function drawFalling(c, u) {
  if (u.fall.lava) { drawUnit(c, u); return; } // (into the lava, or thrown back out of it: where 42_magma has him)
  const A = ARENA, F = u.fall, e = Math.min(1, F.t / F.T), k = 1 - 0.8 * e * e, drop = 34 * e * e, a = e < 0.5 ? 1 : Math.max(0, 1 - (e - 0.5) / 0.5);
  const tx = Math.floor(F.x / TS); let ty = Math.floor(F.y / TS); while (ty < A.h && A.fl[ty * A.w + tx] === PIT) ty++; const cut = ty * TS;
  if (!FALLCV) { FALLCV = mkCanvas(128, 128); FALLCV.g = FALLCV.getContext('2d'); FALLCV.g.imageSmoothingEnabled = false; }
  const o = FALLCV.g; o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.clearRect(0, 0, 128, 128); o.setTransform(1, 0, 0, 1, 64 - u.x, 100 - u.y); drawUnit(o, u);
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-atop'; o.globalAlpha = 1; o.fillStyle = `rgba(0,0,0,${(0.75 * e).toFixed(3)})`; o.fillRect(0, 0, 128, 128); o.globalCompositeOperation = 'source-over'; // (darker as it goes)
  c.save(); c.beginPath(); c.rect(u.x - 64, u.y - 110, 128, cut - (u.y - 110)); c.clip(); c.globalAlpha = a; c.translate(Math.round(u.x), Math.round(u.y + drop)); c.rotate(F.spin * e); c.scale(k, k);
  c.drawImage(FALLCV, -64, -100); c.restore();
}
// ---- the pit floor (kit screen): a run whose first floor has every kind of pit room that will fit
function beginPitFloor(kit) {
  beginRun(kit); FORCE_PITS.on = true;
  for (let n = 0; n < 160; n++) { startFloor(); if (ARENA.pitSets.length >= (n < 60 ? 6 : n < 120 ? 5 : 4)) break; }
  FORCE_PITS.on = false; G.card = { t: 0, life: 3.2, a: 'PIT FLOOR', b: ARENA.pitSets.map(s => ({ chasm: 'THE CHASM', holes: 'BROKEN FLOOR', ledges: 'THE LEDGES', crumble: 'CRUMBLING FLOOR', loot: 'LOOSE TREASURE', rim: 'THE PIT RIM', corners: 'PIT CORNERS', spikeway: 'SPIKED WALKWAY', trim: 'TREASURE ON THE RIM', tcorners: 'TREASURE WITH PIT CORNERS' })[s]).join('  ·  '), c: 'MIND THE EDGE' };
}
