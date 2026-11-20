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
function tombProp(prop, x, y, kind, lit) {
  prop('tomb', x, y, { sheet: 'crypt', tile: [TOMBS[kind], 0], th: 2, r: 7, box: [-7, 7, -17, 1], tombKind: kind });
  if (!lit) return; const A = ARENA, p = A.props[A.props.length - 1], col = TOMBS[kind] * TS; // (its candles: those of the same tomb lit, rows 2-3, on the lidded one)
  p.candles = addCandles(A, candleSrc(col, 2 * TS, TS, 2 * TS, [col, 0]), p.x - 8, p.y - 14 - TS, p.y - 6, 300);
}
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
// the north wall: candle niches and niches of the dead, every second tile from the middle out, mirrored. A light niche
// is the sheet's empty niche with three candles in it (the three of its candle niche, 7,6); a niche of skulls keeps its
// own candles (44_candles); the urns' niches have none
const NICHE_Y = -6, LIGHT_NICHE = [7 * 16, 6 * 16, 16, 16, [8 * 16, 7 * 16]];
function cryptWall(A, r, g, used) {
  const c2 = r.ix0 + r.ix1, y = r.fy0 + 1, gy = (r.fy0 + 2) * TS + 3, NICHE = { skulls: [[6, 6], [8, 6], [9, 6], [7, 7]], urns: [[9, 7], [10, 7], [11, 6]] };
  let k = 0;
  for (let x = Math.floor(c2 / 2); x > r.ix0; x -= 2, k++) {
    const m = c2 - x, both = x === m ? [x] : [x, m]; if (both.some(xx => used.has(xx) || !plainWall(A, xx, y))) continue;
    const role = k % 2 === 0 ? 'light' : ['skulls', 'urns', 'chains'][(k >> 1) % 3];
    for (const xx of both) {
      used.add(xx); const nx = xx * TS, ny = y * TS + NICHE_Y;
      if (role === 'light') { const S = candleSrc(...LIGHT_NICHE); g.drawImage(S.cv, nx, ny); A.torches.push({ x: nx + 8, y: y * TS + 9, tx: xx, f: (xx * 3) % 4, candles: addCandles(A, S, nx, ny, gy, 720, { wall: true, torch: true }) }); }
      else if (role === 'chains') cryptAt(g, 9 + (k >> 1) % 3, 2, nx, y * TS - 8);
      else { const L = NICHE[role], t = L[(k >> 1) % L.length], S = candleSrc(t[0] * TS, t[1] * TS, TS, TS); g.drawImage(S.cv, nx, ny); addCandles(A, S, nx, ny, gy, 450, { wall: true }); }
    }
  }
}

// ===================== the restless dead =====================
// A tomb's candles keep its dead asleep: while one still burns, the lid stays on. When the last goes out (burnt down, or
// put out by a careless blow), the dead stir: a grinding, the tomb shudders, then the lid bursts off, comes down beside
// it in pieces, and what lay in it climbs out. A tomb without candles holds its dead only while it stands in light:
// come close to one in the dark (no candle, niche or brazier lighting it) and it opens. So keep to the worn paths,
// keep the candles burning, and do not swing among the tombs. Who lies in a tomb follows the tomb: the tall ones with
// headstones a mummy of the bone legion (a bound cadaver of the rot), the others a skeleton (a stumbler); one tomb in
// three, by its place, is empty, and only its lid gives. The lid is read off the sheet: what of the lidded tomb is not
// in the opened one (rows 4-5), so it is exactly the part that comes away.
const OPEN_ROW = 4, LIDS = {};
function lidOf(kind) {
  if (LIDS[kind]) return LIDS[kind];
  const col = TOMBS[kind] * TS, P = PIX.crypt, w = TS, h = 2 * TS, cv = mkCanvas(w, h), g = cv.getContext('2d'), id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = (y * P.w + col + x) * 4, b = ((OPEN_ROW * TS + y) * P.w + col + x) * 4, j = (y * w + x) * 4;
    if (P.d[a + 3] && (!P.d[b + 3] || P.d[a] !== P.d[b] || P.d[a + 1] !== P.d[b + 1] || P.d[a + 2] !== P.d[b + 2])) { id.data[j] = P.d[a]; id.data[j + 1] = P.d[a + 1]; id.data[j + 2] = P.d[a + 2]; id.data[j + 3] = 255; }
  }
  g.putImageData(id, 0, 0); return (LIDS[kind] = { cv, pix: { w, d: id.data } });
}
// light on a place: a lit candle within 30 px, a lit niche within 56, a burning brazier within 80
function litAt(A, x, y) {
  if ((A.candles || []).some(c => c.lit && Math.hypot(c.x - x, c.yb - y) < 30)) return true;
  if (A.torches.some(t => !t.out && Math.hypot(t.x - x, t.y + 20 - y) < 56)) return true;
  return A.props.some(p => p.kind === 'brazier' && !p.dead && !p.out && Math.hypot(p.x - x, p.y - y) < 80);
}
function tombOccupant(A, p) {
  const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS); if (hash2(tx * 31 + 7, ty * 17 + 3) < 0.34) return null;
  const rot = A.army === 'rot', tall = p.tombKind === 'head' || p.tombKind === 'headCross', alt = hash2(ty, tx) < 0.5;
  return tall ? { role: 'brute', spr: rot ? 'BoundCadaver' : 'GrapplerMummy' } : { role: 'grunt', spr: rot ? (alt ? 'MutilatedStumbler' : 'SandGhoul') : (alt ? 'DecrepitBones' : 'GraveRevenant') };
}
function tombsTick(dt) {
  const A = ARENA; if (!A || A.th.sheet !== 'crypt' || G.cine) return; const h = G.me;
  for (const p of A.props) {
    if (p.kind !== 'tomb' || p.opened || p.dead) continue;
    if (p.wake === undefined) {
      if (p.candles) { if (!p.candles.some(c => c.lit)) p.wake = 1.5; }
      else if (h && !h.dead && Math.hypot(h.x - p.x, (h.y - (p.y - 6)) * 1.2) < 30 && !litAt(A, p.x, p.y - 8)) p.wake = 0.8;
      if (p.wake !== undefined) { SFX.stone(panOf(p.x)); smoke(p.x, p.y - 6, 1, 'dust', 4, 10, 0.5); }
      continue;
    }
    p.jx = ((G.time * 26) | 0) % 2 ? 1 : 0; // (it shudders)
    if ((p.wake -= dt) <= 0) popLid(A, p, h);
  }
  for (const f of G.foes) if (f.ghostT > 0) f.ghostT -= dt;
  if (A.lids) {
    for (const L of A.lids) {
      L.vz -= 520 * dt; L.z += L.vz * dt; L.x += L.vx * dt; L.y += L.vy * dt;
      if (L.z <= 0 && L.vz < 0) { // it comes down and breaks
        L.done = true; breakSprite(L.lid.pix, 0, 0, TS, 2 * TS, Math.round(L.x), Math.round(L.y), L.y + 2 * TS - 2, 8, { spd: 0.7 });
        smoke(L.x + 8, L.y + 24, 4, 'dust', 8, 22, 0.9); debris(L.x + 8, L.y + 26, 10, ['#897873', '#ab9c94', '#4c403d'], 70, 90, 1.2); SFX.stone(panOf(L.x), true); shake(0.12);
      }
    }
    A.lids = A.lids.filter(L => !L.done);
  }
}
function popLid(A, p, h) {
  p.opened = true; p.wake = undefined; p.jx = 0; p.tile = [p.tile[0], OPEN_ROW]; p.candles = null; // (its candles stood on the lid: they go with it)
  const away = h ? Math.sign(p.x - h.x) || 1 : 1;
  (A.lids = A.lids || []).push({ lid: lidOf(p.tombKind), x: p.x - 8, y: p.y - 14 - TS, vx: away * 38, vy: 6, z: 0, vz: 150 });
  smoke(p.x, p.y - 8, 3, 'dust', 6, 16, 0.8); SFX.stone(panOf(p.x), true); SFX.groan(panOf(p.x)); shake(0.1);
  const who = tombOccupant(A, p); if (!who || !MOBS[who.spr]) return;
  const u = mkFoe(who.role, G.floor, p.x, p.y - 7, who.spr); Object.assign(u, { z: -14, room: p.room, face: -away, ghostT: 1.8 });
  G.foes.push(u); G.units.push(u); if (h) wakeFoe(u, h, 'noise');
}
// the lids in the air: over everything
function drawLids(c) { const A = ARENA; if (!A || !A.lids) return; for (const L of A.lids) c.drawImage(L.lid.cv, Math.round(L.x), Math.round(L.y - L.z)); }
