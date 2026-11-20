// ===================== the crypt: its rooms' furniture, laid out by rule =====================
// Nothing in a crypt room is placed by chance. What stands in a room follows what the room is, stands clear of the
// paths worn into its floor (cryptFloor's wear: furniture only where nobody walks), and comes in rows and pairs mirrored
// about the room's middle, so a room reads as laid out by the people who buried their dead in it.
//   the north wall: from its middle out, every second tile, mirrored: a candle niche (the room's light), then a niche
//     of the dead, skulls, urns and chains in turn; a place is used only when its mirror is free as well
//   a TOMB HALL (a big room): rows of tombs either side of its paths, one kind of tomb along a row, the back row the tall
//     ones with headstones, the tombs nearest the aisle lit with candles
//   a BURIAL CHAMBER (a middling room of even width): a sarcophagus on its middle line, on the north side of its paths
//     or else the south, a gravestone either side of it
//   an OSSUARY (a small room): bones heaped along its side walls, every second tile, mirrored
//   a treasure room: its chest, an urn either side of it
//   every room: urns in pairs in its corners, where both of a pair are free (they break, and hold what pots hold)
// All of it but the walls goes in last of all (cryptDress), on floor nothing else on the floor needs.

let CWEAR = null; // (the floor's wear, from cryptFloor: > 0 worn)
const worn = (x, y) => (CWEAR ? CWEAR(x + 0.5, y + 0.5) : -9);
// the sheet's tombs (columns; rows 0-1 lidded, 2-3 the same with candles, 4-5 opened) and the rest of its dead
const TOMBS = { cross: 16, frame: 17, plain: 18, carved: 19, head: 20, headCross: 21 };
const ROW_TOMBS = ['head', 'cross', 'carved', 'frame', 'plain'];
const URNS = [[24, 8], [25, 8], [26, 8], [27, 8]]; // (the cellar's pots, in the crypt's clay: 30_arena themeSheets)
const BONES_BIG = [[13, 14], [12, 14], [11, 14]], BONES_SMALL = [[9, 14], [10, 14], [9, 15], [10, 15], [11, 15], [12, 15], [13, 15]];

// (furnish, before the floor's puzzles are laid: only the treasure room's chest and its urns)
function cryptFurnish(A, r, g, prop, nearDoor) {
  if (r.kind === 'treasure' || r.chest) { const at = chestSpot(r); prop('tchest', at[0], at[1], { tier: chestTier(A.floor), hp: 1, r: 6, open: false }); for (const s of [-2, 2]) if (FLOOR(A.fl[at[1] * A.w + at[0] + s]) && !nearDoor(at[0] + s, at[1], 2)) prop('barrel', at[0] + s, at[1], { tile: URNS[(Math.abs(at[0] + s) + at[1]) % 4], th: 1, hp: 40 }); }
}
// THE DRESSING, after everything else on the floor is in place (its set pieces, pools, puzzles, spikes): the dead go
// only on floor nobody needs. A tile is free when it is plain floor off the worn paths, a tile or more from anything the
// floor already holds (a plate, a rune, a spike, a lever, a block, a chest, anything standing), two from a doorway, not
// before a cracked wall nor under a stairway; a room with blocks to push, or a set piece, a pool or a shrine, gets none.
// Each pair is set down only if every tile of the room that could be reached before can still be reached after.
function cryptDress(A, g) {
  for (const r of A.rooms) {
    if (r.kind === 'shop' || r.kind === 'start' || r.set || r.pool || r.shrine || r.sluice || A.props.some(p => p.push && !p.dead && p.x >= r.ix0 * TS && p.x <= (r.ix1 + 1) * TS && p.y >= r.iy0 * TS && p.y <= (r.iy1 + 1) * TS)) continue;
    const W = A.w, inR = (x, y) => x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1, keep = new Set(), near = (x, y, m) => { for (let j = -m; j <= m; j++) for (let i = -m; i <= m; i++) keep.add((y + j) * W + x + i); };
    for (const q of A.plates || []) near(q.tx, q.ty, 1); for (const q of A.runes || []) near(q.tx, q.ty, 1); for (const q of A.spikes || []) near(q.tx, q.ty, 1); for (const q of A.levers || []) if (q.tx !== undefined) near(q.tx, q.ty, 1);
    for (const p of A.props) if (!p.dead) near(Math.floor(p.x / TS), Math.floor(p.cy / TS), 1);
    for (const d of r.doors) for (const [x, y] of d.cells) near(x, y, 2);
    for (const c of A.cracks || []) for (let x = c.x - 1; x <= c.x + 3; x++) for (let y = c.y + 1; y <= c.y + 3; y++) keep.add(y * W + x);
    if (r.stairX !== undefined) for (let x = r.stairX - 1; x <= r.stairX + 3; x++) for (let y = r.iy0; y <= r.iy0 + 1; y++) keep.add(y * W + x);
    const blocked = new Set(), ok = (x, y, m = -0.25) => inR(x, y) && x > r.ix0 && x < r.ix1 && y > r.iy0 && A.fl[y * W + x] === 1 && !keep.has(y * W + x) && !blocked.has(y * W + x) && !(A.noProp && A.noProp.has(y * W + x)) && !(A.crumbleSet && A.crumbleSet.has(y * W + x)) && !(A.basin && A.basin[y * W + x]) && worn(x, y) < m;
    const reach = () => { const S = new Set(); let st = null; for (let y = r.iy0; y <= r.iy1 && !st; y++) for (let x = r.ix0; x <= r.ix1; x++) if (FLOOR(A.fl[y * W + x]) && !blocked.has(y * W + x)) { st = [x, y]; break; } if (!st) return S;
      const Q = [st]; S.add(st[1] * W + st[0]); while (Q.length) { const [x, y] = Q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (inR(nx, ny) && !S.has(k) && FLOOR(A.fl[k]) && !blocked.has(k)) { S.add(k); Q.push([nx, ny]); } } } return S; };
    const before = reach(), fits = tiles => { for (const k of tiles) blocked.add(k); const after = reach(); for (const k of before) if (!blocked.has(k) && !after.has(k)) { for (const t of tiles) blocked.delete(t); return false; } return true; };
    const prop = (kind, tx, ty, o) => A.props.push(Object.assign({ kind, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 5, solid: true, hp: 1e9, room: r.i }, o));
    const mir = x => r.ix0 + r.ix1 - x, w = r.ix1 - r.ix0 + 1, h = r.iy1 - r.iy0 + 1, put = { prop, ok, fits, mir, W };
    if (r.kind === 'room' || r.kind === 'end') {
      if (w >= 10 && h >= 7) tombHall(A, r, put);
      else if (w >= 6 && h >= 6 && w % 2 === 0) { if (!burialChamber(A, r, put)) ossuary(A, r, g, put); }
      else ossuary(A, r, g, put);
    }
    for (const [x, y] of [[r.ix0 + 1, r.iy0 + 1], [r.ix0 + 1, r.iy1 - 1]]) if (ok(x, y) && ok(mir(x), y) && fits([y * W + x, y * W + mir(x)])) for (const xx of [x, mir(x)]) prop('barrel', xx, y, { tile: URNS[(xx + y) % 4], th: 1, hp: 40 }); // (urns in its corners, a pair at a time)
  }
}
// a tomb: two tiles tall (its bottom tile at x, y), solid from its foot to its lid's back edge
function tombProp(prop, x, y, kind, lit) { prop('tomb', x, y, { sheet: 'crypt', tile: [TOMBS[kind], lit ? 2 : 0], th: 2, r: 7, box: [-7, 7, -17, 1], tombKind: kind }); }
function tombHall(A, r, P) {
  const c2 = r.ix0 + r.ix1, xs = []; // (the columns: from the middle out, every second tile, the two halves mirrored)
  for (let x = Math.floor(c2 / 2); x > r.ix0; x -= 2) xs.push(x);
  const ys = []; for (let y = r.iy0 + 2; y <= r.iy1 - 1; y += 3) ys.push(y); if (!ys.length) return;
  const shift = Math.floor(((r.iy1 - ys[ys.length - 1]) - (ys[0] - 1 - r.iy0)) / 2); // (the rows centred top to bottom)
  ys.forEach((y, k) => {
    const yy = y + shift, kind = ROW_TOMBS[k % ROW_TOMBS.length], cols = xs.filter(x => P.ok(x, yy) && P.ok(x, yy - 1) && P.ok(P.mir(x), yy) && P.ok(P.mir(x), yy - 1));
    const placed = []; for (const x of cols) { const pair = x === P.mir(x) ? [x] : [x, P.mir(x)]; if (P.fits(pair.flatMap(xx => [yy * P.W + xx, (yy - 1) * P.W + xx]))) placed.push(x); }
    const inner = Math.max(...placed); // (the row's tombs nearest the middle carry its candles)
    for (const x of placed) for (const xx of x === P.mir(x) ? [x] : [x, P.mir(x)]) tombProp(P.prop, xx, yy, kind, x === inner);
  });
}
function burialChamber(A, r, P) {
  const bx = (r.ix0 + r.ix1 - 1) / 2, cy = Math.round((r.iy0 + r.iy1) / 2); // (bx, bx + 1: its two columns)
  for (const by of [cy - 2, cy + 2]) { // (its bottom row: north of the paths' crossing, else south)
    const cells = [[bx, by], [bx + 1, by], [bx, by - 1], [bx + 1, by - 1]];
    if (!cells.every(([x, y]) => P.ok(x, y, -0.4)) || !P.fits(cells.map(([x, y]) => y * P.W + x))) continue;
    P.prop('sarc', bx + 0.5, by, { sheet: 'crypt', tile: [(bx + by) % 2 ? 18 : 16, 6], tw: 2, th: 2, r: 12, box: [-15, 15, -22, 1] });
    if ([bx - 2, bx + 3].every(gx => P.ok(gx, by) && P.ok(gx, by - 1)) && P.fits([by * P.W + bx - 2, by * P.W + bx + 3])) for (const gx of [bx - 2, bx + 3]) P.prop('grave', gx, by, { sheet: 'crypt', tile: [24, 6], th: 2, r: 5, box: [-5, 5, -7, 1] });
    return true;
  }
  return false;
}
// bones heaped on the floor along the side walls (painted into the ground: nobody trips on them)
function ossuary(A, r, g, P) {
  let k = 0; for (let y = r.iy0 + 1; y <= r.iy1 - 1; y += 2, k++) { const x = r.ix0 + 1; if (!P.ok(x, y) || !P.ok(P.mir(x), y)) continue; const t = k % 2 ? BONES_SMALL[k % BONES_SMALL.length] : BONES_BIG[(k >> 1) % BONES_BIG.length]; for (const xx of [x, P.mir(x)]) cryptAt(g, t[0], t[1], xx * TS, y * TS); }
}
// the north wall: candle niches and niches of the dead, every second tile from the middle out, mirrored
function cryptWall(A, r, g, used) {
  const c2 = r.ix0 + r.ix1, y = r.fy0 + 1, NICHE = { skulls: [[6, 6], [8, 6], [9, 6], [7, 7]], urns: [[9, 7], [10, 7], [11, 6]] };
  let k = 0;
  for (let x = Math.floor(c2 / 2); x > r.ix0; x -= 2, k++) {
    const m = c2 - x, both = x === m ? [x] : [x, m]; if (both.some(xx => used.has(xx) || !plainWall(A, xx, y))) continue;
    const role = k % 2 === 0 ? 'light' : ['skulls', 'urns', 'chains'][(k >> 1) % 3];
    for (const xx of both) {
      used.add(xx);
      if (role === 'light') A.torches.push({ x: xx * TS + 8, y: y * TS + 9, tx: xx, f: (xx * 3) % 4 });
      else if (role === 'chains') cryptAt(g, 9 + (k >> 1) % 3, 2, xx * TS, y * TS - 8);
      else { const L = NICHE[role], t = L[(k >> 1) % L.length]; cryptAt(g, t[0], t[1], xx * TS, y * TS - 6); }
    }
  }
}
