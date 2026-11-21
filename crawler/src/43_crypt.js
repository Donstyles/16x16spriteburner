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
// THE MOSSY DEEP: on the lowest crypt floor (6) its dead are grown over: every tomb, sarcophagus, gravestone, throne and
// font is the sheet's green twin (eight rows down), every niche its green twin (four rows down); walls and floor stay
const MOSS = () => (ARENA && ARENA.moss ? 8 : 0), MOSSN = () => (ARENA && ARENA.moss ? 4 : 0);
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
    if (r.kind === 'shop' || r.kind === 'start' || (r.kind !== 'end' && r.set) || r.pool || r.shrine || r.sluice || A.props.some(p => p.push && !p.dead && p.x >= r.ix0 * TS && p.x <= (r.ix1 + 1) * TS && p.y >= r.iy0 * TS && p.y <= (r.iy1 + 1) * TS)) continue;
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
    const mir = x => r.ix0 + r.ix1 - x, w = r.ix1 - r.ix0 + 1, h = r.iy1 - r.iy0 + 1, put = { prop, ok, fits, mir, W, unfit: tiles => { for (const k of tiles) blocked.delete(k); } };
    charnelPit(A, r, g, put); throneRoom(A, r, g, put); // (one a floor: below)
    if (r.kind === 'room' || r.kind === 'end') {
      const chamber = w >= 6 && h >= 6 && w % 2 === 0, chamberFirst = chamber && (w < 10 || h < 7 || hash2(r.i * 3 + 1, A.floor * 5 + 2) < 0.4); // (an even-width room: a burial chamber, or a tomb hall two in five times when it is big enough)
      if (r.charnel) ossuary(A, r, g, put); else if (chamberFirst && burialChamber(A, r, put)) { /* (a burial chamber) */ }
      else if (w >= 10 && h >= 7 && tombHall(A, r, put)) { /* (a tomb hall) */ }
      else if (chamber && !chamberFirst && burialChamber(A, r, put)) { /* (a burial chamber after all) */ }
      else ossuary(A, r, g, put);
    }
    for (const [x, y] of [[r.ix0 + 1, r.iy0 + 1], [r.ix0 + 1, r.iy1 - 1]]) if (ok(x, y) && ok(mir(x), y) && fits([y * W + x, y * W + mir(x)])) for (const xx of [x, mir(x)]) prop('barrel', xx, y, { tile: URNS[(xx + y) % 4], th: 1, hp: 40 }); // (urns in its corners, a pair at a time)
  }
}
// a tomb: two tiles tall (its bottom tile at x, y), solid from its foot to its lid's back edge
function tombProp(prop, x, y, kind, lit) {
  const M = MOSS(); prop('tomb', x, y, { sheet: 'crypt', tile: [TOMBS[kind], M], th: 2, r: 7, box: [-7, 7, -17, 1], tombKind: kind, moss: M });
  if (!lit) return; const A = ARENA, p = A.props[A.props.length - 1], col = TOMBS[kind] * TS; // (its candles: those of the same tomb lit, rows 2-3, on the lidded one)
  p.candles = addCandles(A, candleSrc(col, (2 + M) * TS, TS, 2 * TS, [col, M * TS]), p.x - 8, p.y - 14 - TS, p.y - 6, 480);
}
function tombHall(A, r, P) {
  const c2 = r.ix0 + r.ix1, xs = []; // (the columns: from the middle out, every second tile, the two halves mirrored)
  for (let x = Math.floor(c2 / 2); x > r.ix0; x -= 2) xs.push(x);
  const ys = []; for (let y = r.iy0 + 2; y <= r.iy1 - 1; y += 3) ys.push(y); if (!ys.length) return false;
  const shift = Math.floor(((r.iy1 - ys[ys.length - 1]) - (ys[0] - 1 - r.iy0)) / 2); // (the rows centred top to bottom)
  // (laid out first, set down after: a row of fewer than two tombs is no row, and a hall of fewer than four no hall)
  const plan = [], cellsOf = (x, yy) => (x === P.mir(x) ? [x] : [x, P.mir(x)]).flatMap(xx => [yy * P.W + xx, (yy - 1) * P.W + xx]);
  ys.forEach((y, k) => {
    const yy = y + shift, kind = ROW_TOMBS[k % ROW_TOMBS.length], cols = xs.filter(x => P.ok(x, yy) && P.ok(x, yy - 1) && P.ok(P.mir(x), yy) && P.ok(P.mir(x), yy - 1));
    const placed = []; for (const x of cols) if (P.fits(cellsOf(x, yy))) placed.push(x);
    const n = placed.reduce((m, x) => m + (x === P.mir(x) ? 1 : 2), 0);
    if (n < 2) { for (const x of placed) P.unfit(cellsOf(x, yy)); return; } plan.push([yy, kind, placed, n]);
  });
  if (plan.reduce((m, q) => m + q[3], 0) < 4) { for (const [yy, , placed] of plan) for (const x of placed) P.unfit(cellsOf(x, yy)); return false; }
  for (const [yy, kind, placed] of plan) { const inner = Math.max(...placed); // (the row's tombs nearest the middle carry its candles)
    for (const x of placed) for (const xx of x === P.mir(x) ? [x] : [x, P.mir(x)]) tombProp(P.prop, xx, yy, kind, x === inner); }
  return true;
}
function burialChamber(A, r, P) {
  const bx = (r.ix0 + r.ix1 - 1) / 2, cy = Math.round((r.iy0 + r.iy1) / 2); // (bx, bx + 1: its two columns)
  for (const by of [cy - 2, cy + 2, r.iy0 + 2, r.iy1 - 1]) { // (its bottom row: north of the paths' crossing, else south; else against the north wall, else the south)
    const cells = [[bx, by], [bx + 1, by], [bx, by - 1], [bx + 1, by - 1]];
    if (!cells.every(([x, y]) => P.ok(x, y, -0.05)) || !P.fits(cells.map(([x, y]) => y * P.W + x))) continue;
    P.prop('sarc', bx + 0.5, by, { sheet: 'crypt', tile: [(bx + by) % 2 ? 18 : 16, 6 + MOSS()], tw: 2, th: 2, r: 12, box: [-15, 15, -22, 1] });
    if ([bx - 2, bx + 3].every(gx => P.ok(gx, by) && P.ok(gx, by - 1)) && P.fits([by * P.W + bx - 2, by * P.W + bx + 3])) for (const gx of [bx - 2, bx + 3]) P.prop('grave', gx, by, { sheet: 'crypt', tile: [24, 6 + MOSS()], th: 2, r: 5, box: [-5, 5, -7, 1] });
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
  const c2 = r.ix0 + r.ix1, y = r.fy0 + 1;
  let k = 0;
  for (let x = Math.floor(c2 / 2); x > r.ix0; x -= 2, k++) {
    const m = c2 - x, both = x === m ? [x] : [x, m]; if (both.some(xx => used.has(xx) || !plainWall(A, xx, y))) continue;
    const role = k % 2 === 0 ? 'light' : ['skulls', 'urns', 'chains'][(k >> 1) % 3];
    if (k === 0 && both.length === 1 && fontRoom(r) && FLOOR(A.fl[r.iy0 * A.w + x])) { used.add(x); cryptFont(A, r, g, x, y); continue; } // (a font at its middle: below)
    for (const xx of both) { used.add(xx); cryptNiche(A, r, g, xx, y, role, k); }
  }
}
// one niche at x on the wall face row y: a light niche, skulls, urns or chains
function cryptNiche(A, r, g, xx, y, role, k) {
  const N = MOSSN(), NICHE = { skulls: [[6, 6 + N], [8, 6 + N], [9, 6 + N], [7, 7 + N]], urns: [[9, 7 + N], [10, 7 + N], [11, 6 + N]] }, nx = xx * TS, ny = y * TS + NICHE_Y, gy = (y + 1) * TS + 3;
  if (role === 'light') { const S = candleSrc(7 * TS, (6 + N) * TS, TS, TS, [8 * TS, (7 + N) * TS]); g.drawImage(S.cv, nx, ny); A.torches.push({ x: nx + 8, y: y * TS + 9, tx: xx, f: (xx * 3) % 4, room: r.i, candles: addCandles(A, S, nx, ny, gy, 1100, { wall: true, torch: true }) }); }
  else if (role === 'chains') cryptAt(g, 9 + (k >> 1) % 3, 2, nx, y * TS - 8);
  else { const L = NICHE[role], t = L[(k >> 1) % L.length], S = candleSrc(t[0] * TS, t[1] * TS, TS, TS); g.drawImage(S.cv, nx, ny); const cs = addCandles(A, S, nx, ny, gy, 700, { wall: true }); if (role === 'skulls' && y === r.fy0 + 1) (r.niches = r.niches || []).push({ nx, ny, candles: cs }); }
}
// the face of a block of wall standing in a room: niches mirrored about its middle, a light niche at the middle and every
// second tile out from it, niches of the dead between
function cryptFace(A, r, g, f) {
  const W = A.w, n = f.length, mid = (n - 1) / 2;
  f.forEach((c, i) => { const x = c % W, y = (c / W) | 0, d = Math.round(Math.abs(i - mid)); cryptNiche(A, r, g, x, y, d % 2 === 0 ? 'light' : 'skulls', d); });
}
// the crypt's floor spikes: rows of bone shards in three heights (sheet 9..10, 4..5), by the frame (3 tip, 2 half, 1 up)
const BONE_SHARDS = { 3: [[9, 4], [9, 4]], 2: [[10, 4], [11, 4]], 1: [[10, 5], [9, 5]] };

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
function lidOf(kind, M = 0) {
  const key = kind + M; if (LIDS[key]) return LIDS[key];
  const col = TOMBS[kind] * TS, P = PIX.crypt, w = TS, h = 2 * TS, cv = mkCanvas(w, h), g = cv.getContext('2d'), id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = ((M * TS + y) * P.w + col + x) * 4, b = (((OPEN_ROW + M) * TS + y) * P.w + col + x) * 4, j = (y * w + x) * 4;
    if (P.d[a + 3] && (!P.d[b + 3] || P.d[a] !== P.d[b] || P.d[a + 1] !== P.d[b + 1] || P.d[a + 2] !== P.d[b + 2])) { id.data[j] = P.d[a]; id.data[j + 1] = P.d[a + 1]; id.data[j + 2] = P.d[a + 2]; id.data[j + 3] = 255; }
  }
  g.putImageData(id, 0, 0); return (LIDS[key] = { cv, pix: { w, d: id.data } });
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
    if ((p.kind !== 'tomb' && p.kind !== 'sarc') || p.opened || p.dead) continue;
    if (p.wake === undefined) {
      if (p.candles) { if (!p.candles.some(c => c.lit)) p.wake = 1.5; }
      else if (h && !h.dead && Math.hypot(h.x - p.x, (h.y - (p.y - 6)) * 1.2) < (p.kind === 'sarc' ? 40 : 30) && !litAt(A, p.x, p.y - 8)) p.wake = p.kind === 'sarc' ? 1.4 : 0.8;
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
        const lw = L.lid.w || TS; L.done = true; breakSprite(L.lid.pix, 0, 0, lw, 2 * TS, Math.round(L.x), Math.round(L.y), L.y + 2 * TS - 2, 8, { spd: 0.7 });
        smoke(L.x + lw / 2, L.y + 24, 4, 'dust', 8, 22, 0.9); debris(L.x + lw / 2, L.y + 26, 10, ['#897873', '#ab9c94', '#4c403d'], 70, 90, 1.2); SFX.stone(panOf(L.x), true); shake(0.12);
      }
    }
    A.lids = A.lids.filter(L => !L.done);
  }
}
function popLid(A, p, h) {
  if (p.kind === 'sarc') { popSarc(A, p, h); return; }
  p.opened = true; p.wake = undefined; p.jx = 0; p.tile = [p.tile[0], OPEN_ROW + (p.moss || 0)]; p.candles = null; // (its candles stood on the lid: they go with it)
  const away = h ? Math.sign(p.x - h.x) || 1 : 1;
  (A.lids = A.lids || []).push({ lid: lidOf(p.tombKind, p.moss || 0), x: p.x - 8, y: p.y - 14 - TS, vx: away * 38, vy: 6, z: 0, vz: 150 });
  smoke(p.x, p.y - 8, 3, 'dust', 6, 16, 0.8); SFX.stone(panOf(p.x), true); SFX.groan(panOf(p.x)); shake(0.1);
  const who = tombOccupant(A, p); if (!who || !MOBS[who.spr]) return;
  const u = mkFoe(who.role, G.floor, p.x, p.y - 7, who.spr); Object.assign(u, { z: -14, room: p.room, face: -away, ghostT: 1.8 });
  G.foes.push(u); G.units.push(u); if (h) wakeFoe(u, h, 'noise');
}
// the lids in the air: over everything
function drawLids(c) { const A = ARENA; if (!A || !A.lids) return; for (const L of A.lids) c.drawImage(L.lid.cv, Math.round(L.x), Math.round(L.y - L.z)); }
// THE SARCOPHAGUS: a burial chamber's lord lies in it, and it is no quieter than the tombs. In the dark, come near it and
// it grinds, shudders and its lid is shoved off (the sheet's opened sarcophagus four columns on: the plain lid slid
// aside, the carved one broken); a blow on it wakes it in light or dark. What climbs out is the floor's heavy dead (its
// army's brute: a mummy of the bone legion, a bound cadaver of the rot).
function sarcLid(col, M) {
  const key = 's' + col + M; if (LIDS[key]) return LIDS[key];
  const P = PIX.crypt, w = 2 * TS, h = 2 * TS, sy = (6 + M) * TS, cv = mkCanvas(w, h), g = cv.getContext('2d'), id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = ((sy + y) * P.w + col * TS + x) * 4, b = ((sy + y) * P.w + (col + 4) * TS + x) * 4, j = (y * w + x) * 4;
    if (P.d[a + 3] && (!P.d[b + 3] || P.d[a] !== P.d[b] || P.d[a + 1] !== P.d[b + 1] || P.d[a + 2] !== P.d[b + 2])) { id.data[j] = P.d[a]; id.data[j + 1] = P.d[a + 1]; id.data[j + 2] = P.d[a + 2]; id.data[j + 3] = 255; }
  }
  g.putImageData(id, 0, 0); return (LIDS[key] = { cv, pix: { w, d: id.data }, w, h });
}
function popSarc(A, p, h) {
  const col = p.tile[0], M = p.tile[1] - 6; p.opened = true; p.wake = undefined; p.jx = 0; p.tile = [col + 4, p.tile[1]];
  const away = h ? Math.sign(p.x - h.x) || 1 : 1;
  (A.lids = A.lids || []).push({ lid: sarcLid(col, M), x: p.x - TS, y: p.y - 14 - TS, vx: away * 26, vy: 4, z: 0, vz: 120, w: 2 * TS });
  smoke(p.x, p.y - 8, 5, 'dust', 8, 22, 1); SFX.stone(panOf(p.x), true); SFX.groan(panOf(p.x)); shake(0.18);
  const spr = A.army === 'rot' ? 'BoundCadaver' : (ARMIES[A.army] && ARMIES[A.army].brute && MOBS[ARMIES[A.army].brute[0]] ? ARMIES[A.army].brute[0] : 'GrapplerMummy'); if (!MOBS[spr]) return;
  const u = mkFoe('brute', G.floor, p.x, p.y - 8, spr); Object.assign(u, { z: -16, room: p.room, face: -away, ghostT: 2.2 }); G.foes.push(u); G.units.push(u); if (h) wakeFoe(u, h, 'noise');
}
// a blow that passes over a sealed sarcophagus wakes it
function sarcBlow(src, mv, dir) {
  const A = ARENA; if (!A || A.th.sheet !== 'crypt') return;
  for (const p of A.props) if (p.kind === 'sarc' && !p.opened && p.wake === undefined && hitsShape(src, { x: p.x, y: p.cy, r: 14 }, mv, dir)) { p.wake = 0.5; SFX.stone(panOf(p.x)); smoke(p.x, p.y - 6, 1, 'dust', 4, 10, 0.5); }
}

// ===================== they do not stay down =====================
// In the crypt a skeleton cut down falls into a heap of its bones, and in the dark the heap pulls itself together again:
// some seconds after, it rattles, shudders and stands up, whole. A heap in light stays down (a candle, a light niche, a
// brazier: litAt) for as long as the light lasts; a heavy blow, or two blows on the heap, scatters it for good, and a
// skeleton finished with a heavy blow never makes one. What it carried it dropped the first time only. While a
// necromancer lives within a few rooms' reach, the heaps near it rise twice as fast, and in light as well: kill it first.
const HEAP_T = 6, HEAP_RATTLE = 1.1;
function boneHeap(u, src) {
  const A = ARENA; if (!A || A.th.sheet !== 'crypt' || u.def.blood !== 'bone' || u.raisedBy || u.dummy || u.fall) return;
  if (src && src.act && src.act.mv && src.act.mv.dm >= 2) return; // (finished with a heavy blow: in pieces for good)
  (A.heaps = A.heaps || []).push({ x: Math.round(u.x), y: Math.round(u.y), spr: u.spr, type: u.type, face: u.face, room: u.room, t: 0, hp: 2, big: (u.scale || 1) > 1.1 });
}
function heapsTick(dt) {
  const A = ARENA; if (!A || !A.heaps || G.cine) return;
  for (const q of A.heaps) {
    if (q.gone) continue;
    const necro = G.foes.some(f => !f.dead && f.spr === 'AdeptNecromancer' && dist(f.x, f.y, q.x, q.y) < 170); // (the necromancer's hold: below)
    if (!necro && q.t < HEAP_T && litAt(A, q.x, q.y)) continue; // (in light it lies still)
    const was = q.t; q.t += dt * (necro ? 2 : 1);
    if (was < HEAP_T && q.t >= HEAP_T) SFX.clatter(panOf(q.x));
    if (q.t >= HEAP_T + HEAP_RATTLE) { // it stands up
      q.gone = true; const h = G.me, u = mkFoe(q.type, G.floor, q.x, q.y, q.spr);
      Object.assign(u, { z: -5, room: q.room, face: q.face, reborn: true, stun: 0.5 }); G.foes.push(u); G.units.push(u); if (h && !h.dead) wakeFoe(u, h, 'noise');
      SFX.bone(panOf(q.x), true); debris(q.x, q.y, 6, BLOOD.bone, 50, 70, 1);
    }
  }
  A.heaps = A.heaps.filter(q => !q.gone);
}
// a blow on a heap: two scatter it, a heavy one at once
function heapBlow(src, mv, dir) {
  const A = ARENA; if (!A || !A.heaps) return;
  for (const q of A.heaps) {
    if (q.gone || !hitsShape(src, { x: q.x, y: q.y, r: 5 }, mv, dir)) continue;
    q.hp -= mv.dm >= 2 ? 2 : 1; q.t = Math.min(q.t, HEAP_T * 0.5); SFX.bone(panOf(q.x), q.hp <= 0); debris(q.x, q.y, q.hp <= 0 ? 14 : 5, BLOOD.bone, 90, 110, 1.3);
    if (q.hp <= 0) { q.gone = true; smoke(q.x, q.y, 2, 'dust', 5, 12, 0.7); }
  }
}
// the heap: the sheet's pile of bones, shuddering as it gathers itself
const HEAP_TILES = [[13, 14], [12, 14]];
function drawHeaps(c) {
  const A = ARENA; if (!A || !A.heaps) return;
  for (const q of A.heaps) { const t = HEAP_TILES[q.big ? 0 : 1], j = q.t >= HEAP_T ? (((G.time * 30) | 0) % 2 ? 1 : -1) : 0; c.drawImage(IMG.crypt, t[0] * TS, t[1] * TS, TS, TS, q.x - 8 + j, q.y - 12, TS, TS); }
}

// ===================== out of the ground, out of the walls =====================
// THE BURIED: the dead of a crypt floor whose place is on bare earth in the dark (the worn paths are earth: where the
// living walk, the dead lie under them) lie buried there instead of standing about, two in three of them by their
// place: nothing shows but, as the hero comes near, the earth twitching; when he comes within a few steps they claw up
// through it (dormantTick, as the drowned do). Skeletons and grave revenants, stumblers and ghouls; never the archers,
// brutes or flyers, and never in light.
const BURIABLE = new Set(['DecrepitBones', 'GraveRevenant', 'MutilatedStumbler', 'SandGhoul']);
function cryptBury(A) {
  for (const f of G.foes) {
    if (!BURIABLE.has(f.spr) || f.guard || f.dormant || f.horde) continue;
    const tx0 = Math.floor(f.x / TS), ty0 = Math.floor(f.y / TS); if (hash2(tx0 * 13 + 5, ty0 * 29 + 1) > 0.67) continue;
    let best = null, bd = 9;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const x = tx0 + i, y = ty0 + j, d = Math.hypot(i, j); if (d < bd && A.fl[y * A.w + x] === 1 && worn(x, y) > 0.2 && !litAt(A, x * TS + 8, y * TS + 10) && !A.props.some(p => !p.dead && p.solid && Math.abs(p.x - (x * TS + 8)) < 14 && Math.abs(p.cy - (y * TS + 10)) < 14)) { best = [x, y]; bd = d; } }
    if (!best) continue;
    Object.assign(f, { x: best[0] * TS + 8, y: best[1] * TS + 10, dormant: true, buried: true, z: -11, aware: false, twitchT: 1 + hash2(best[0], best[1]) });
  }
}
// the earth over one of them twitching as the hero comes near (a puff of grit, now and then)
function buriedTick(dt) {
  const h = G.me; if (!h || h.dead) return;
  for (const f of G.foes) { if (!f.buried || !f.dormant || f.dead) continue; if (dist(h.x, h.y, f.x, f.y) > 100 || (f.twitchT -= dt) > 0) continue; f.twitchT = 1.2 + hash2(G.time * 7 | 0, f.x | 0) * 1.4; debris(f.x + rand(-3, 3), f.y, 2, ['#4c3e26', '#665333', '#332919'], 18, 26, 0.6); }
}
// THE NICHE AMBUSH: in some crypt rooms (one in two by its place, if it has two or more niches of skulls) the dead wait
// in the north wall's niches. The hero two steps in, the niches burst one after another, candles, skulls and brick
// coming down, and out of each drops a skeleton (a stumbler, on a floor of the rot).
function nicheAmbush(dt) {
  const A = ARENA, h = G.me; if (!A || !h || h.dead || A.th.sheet !== 'crypt' || G.cine) return;
  for (const r of A.rooms) {
    if (!r.niches || r.niches.length < 2 || r.ambushed || r.kind !== 'room' || hash2(r.i * 7 + 3, A.floor * 11 + 1) > 0.5) continue;
    if (!(h.x > (r.ix0 + 1) * TS && h.x < r.ix1 * TS && h.y > (r.iy0 + 2) * TS && h.y < (r.iy1 + 1) * TS)) continue;
    r.ambushed = true; SFX.groan(panOf(h.x));
    r.niches.forEach((n, i) => after(0.35 + i * 0.3, () => { if (ARENA === A) burstNiche(A, r, n); }));
  }
}
function burstNiche(A, r, n) {
  for (const c of n.candles || []) { snuff(c, true); const i = A.wallCandles.indexOf(c); if (i >= 0) A.wallCandles.splice(i, 1); const j = A.candles.indexOf(c); if (j >= 0) A.candles.splice(j, 1); }
  groundPaint(n.nx, n.ny, n.nx + TS, n.ny + TS, g => { g.drawImage(IMG.crypt, 8 * TS, (7 + MOSSN()) * TS, TS, TS, n.nx, n.ny, TS, TS); }); // (an empty niche now)
  const x = n.nx + 8, y = (r.fy0 + 2) * TS + 5;
  debris(x, y - 10, 12, ['#3a2f11', '#33240f', '#cfc6b0', '#a49a84'], 80, 120, 1.4); smoke(x, y - 8, 3, 'dust', 6, 16, 0.9); SFX.stone(panOf(x), true); SFX.clatter(panOf(x)); shake(0.12);
  const spr = A.army === 'rot' ? 'MutilatedStumbler' : 'DecrepitBones'; if (!MOBS[spr]) return;
  const u = mkFoe('grunt', G.floor, x, y, spr); Object.assign(u, { z: 14, vz: 20, room: r.i, face: hash2(n.nx, 3) < 0.5 ? 1 : -1, stun: 0.6 }); G.foes.push(u); G.units.push(u); wakeFoe(u, G.me, 'noise');
}

// ===================== the Shade =====================
// One to every crypt floor: a shape darker than the dark, two pale eyes. It waits in the darkest corner of the room
// farthest from the stairs the hero came down. It never steps into light (a candle, a light niche, a brazier): light
// burns it, and held in light it comes apart. Inside the hero's lamp, while he faces it, it cannot move at all; the
// moment he looks away, or the lamp no longer reaches it, it comes on, fast and without a sound, and claws; then it
// draws back into the dark and comes again. Its eyes show in the dark from far off; its body only in the lamp. So the
// candles are the hero's only safe ground: every one put out by a careless blow, or burnt down while he lingers, gives
// it more of the crypt. It can be cut down like anything else, and better, lured into light.
function cryptShade(A) {
  const s = A.start, far = A.rooms.filter(r => r.kind === 'room' && !r.set && !r.pool).sort((a, b) => Math.hypot(b.ix0 - s.ix0, b.iy0 - s.iy0) - Math.hypot(a.ix0 - s.ix0, a.iy0 - s.iy0))[0]; if (!far || !MOBS.SkeweringStalker) return;
  let best = null, bd = -1; // (its spot: the floor tile there farthest from any light)
  for (let y = far.iy0 + 1; y <= far.iy1 - 1; y++) for (let x = far.ix0 + 1; x <= far.ix1 - 1; x++) {
    if (A.fl[y * A.w + x] !== 1 || A.props.some(p => !p.dead && p.solid && Math.abs(p.x - (x * TS + 8)) < 14 && Math.abs(p.cy - (y * TS + 10)) < 14)) continue;
    let d = 1e9; for (const c of A.candles || []) d = Math.min(d, Math.hypot(c.x - x * TS, c.yb - y * TS)); for (const t of A.torches) d = Math.min(d, Math.hypot(t.x - x * TS, t.y + 20 - y * TS)); for (const p of A.props) if (p.kind === 'brazier') d = Math.min(d, Math.hypot(p.x - x * TS, p.y - y * TS));
    if (d > bd) { bd = d; best = [x, y]; }
  }
  if (!best) return;
  const u = mkFoe('flanker', G.floor, best[0] * TS + 8, best[1] * TS + 10, 'SkeweringStalker');
  Object.assign(u, { shade: true, room: far.i, maxHp: u.maxHp * 2.4, hp: u.maxHp * 2.4, face: -1, blood: 'black', cdT: 0, backT: 0 }); u.def = Object.assign({}, u.def, { blood: 'sludge' });
  G.foes.push(u);
}
function shadeTick(f, dt) {
  const A = ARENA, h = G.me; f.cdT -= dt; f.moving = false;
  if (!h || h.dead) { f.vx = damp(f.vx, 0, 10, dt); f.vy = damp(f.vy, 0, 10, dt); return; }
  if (litAt(A, f.x, f.y - 4)) { // in light it burns, and flees it
    f.hp -= 16 * dt; if (Math.random() < dt * 14) smoke(f.x + rand(-4, 4), f.y - rand(4, 18), 1, 'dark', 3, 8, 0.6, 10);
    if (f.hp <= 0) { kill(f, h); return; } const a = angTo(h.x, h.y, f.x, f.y); f.vx = Math.cos(a) * 60; f.vy = Math.sin(a) * 50; f.moving = true; f.seen = true; return;
  }
  const d = dist(f.x, f.y, h.x, h.y), lampR = h.lightR * lampK() * 0.95, inLamp = d < lampR, faced = (f.x - h.x) * (h.face || 1) > -6; // (faced: on the side he is turned to)
  if (d > 230 && !f.hunting) { f.vx = f.vy = 0; return; } // waiting
  f.hunting = true;
  if (inLamp && faced && lineOfSight(h.x, h.y - 4, f.x, f.y - 4)) { // seen: it cannot move
    if (!f.frozen && d < 70) { SFX.hex(panOf(f.x), true); shake(0.05); } f.frozen = true; f.vx = f.vy = 0; return;
  }
  if (f.frozen && d < 90) SFX.whisper(clamp((f.x - h.x) / 120, -0.9, 0.9), true); // (turned from it: it is coming)
  f.frozen = false; let tx = h.x, ty = h.y, spd = 78;
  if ((f.snuffT = (f.snuffT || 3) - dt) <= 0) { // it puts the candles out ahead of it, one at a time, so the dark spreads
    f.snuffT = 4.5; const c = (A.candles || []).filter(k => k.lit && !k.torch && Math.hypot(k.x - f.x, k.yb - f.y) < 46).sort((a, b) => Math.hypot(a.x - f.x, a.yb - f.y) - Math.hypot(b.x - f.x, b.yb - f.y))[0]; if (c) snuff(c);
  }
  if (f.backT > 0) { f.backT -= dt; const a = angTo(h.x, h.y, f.x, f.y); tx = f.x + Math.cos(a) * 40; ty = f.y + Math.sin(a) * 40; spd = 60; }
  else if (d < 16 && f.cdT <= 0) { // it claws, and draws back
    f.cdT = 1.5; f.backT = 1.1; hurt(h, 20 * (f.dmgMul || 1), f, { kx: (h.x - f.x) * 6, ky: (h.y - f.y) * 6, ang: angTo(f.x, f.y, h.x, h.y), style: 'claw' }); SFX.rip(panOf(h.x), true); return;
  }
  pathTo(f, tx, ty, spd, dt, 6);
  const nx = f.x + f.vx * 0.12, ny = f.y + f.vy * 0.12; if (litAt(A, nx, ny - 4)) { f.vx = f.vy = 0; f.moving = false; } // (never into light)
}
// drawn as its own black shape (the sprite's silhouette), only where the lamp shows it; its eyes in the glow layer
function drawShade(c, u) {
  const m = MOBS[u.spr]; if (!m) return; const fw = m[1], fh = m[2], foot = footOf(u.spr), fr = u.moving ? ((u.anim * 9) | 0) % 4 : 0;
  c.save(); c.translate(Math.round(u.x), Math.round(u.y - (u.z || 0))); if (u.face < 0) c.scale(-1, 1); c.drawImage(IMG.mobsK, fr * fw, m[0], fw, fh, -fw / 2, -foot - 1, fw, fh); c.restore();
}
function drawShadeEyes(c) {
  const h = G.me; if (!h) return;
  for (const f of G.foes) {
    if (!f.shade || f.dead) continue; const d = dist(f.x, f.y, h.x, h.y); if (d > 190) continue;
    const blink = ((G.time * 0.7 + f.x * 0.01) % 4) < 0.12, y = Math.round(f.y - headZ(f) + 1), x = Math.round(f.x);
    if (blink) continue; c.globalAlpha = Math.min(1, (190 - d) / 80) * (f.frozen ? 1 : 0.85); c.fillStyle = '#e8f0ff'; c.fillRect(x - 2, y, 1, 1); c.fillRect(x + 1, y, 1, 1);
  }
  c.globalAlpha = 1;
}

// ===================== the charnel pit =====================
// One crypt room a floor (the first one with room for it) has the pit the dead were thrown into: the sheet's ragged pit,
// three tiles square, off the worn paths and as near the room's middle as it fits, a cold brazier either side of it.
// While the hero is in its room and either brazier is dark, the dead climb out of it, one every few seconds (no more
// than three of its own up at once, eight in all). Stand at a brazier a moment and his lamp lights it; with both
// burning, the pit is quiet for good (and the light keeps the heaps of those cut down there down: 43_crypt litAt).
function charnelPit(A, r, g, P) {
  if (A.charnel || r.kind !== 'room' || r.ix1 - r.ix0 < 8 || r.iy1 - r.iy0 < 5) return;
  const cx = Math.round((r.ix0 + r.ix1) / 2), cy = Math.round((r.iy0 + r.iy1) / 2), tries = [];
  for (let j = -3; j <= 3; j++) for (let i = -6; i <= 6; i++) tries.push([cx + i - 1, cy + j - 1, Math.abs(i) + Math.abs(j) * 1.5]);
  tries.sort((a, b) => a[2] - b[2]);
  for (const [x0, y0] of tries) {
    const cells = []; for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 3; x++) cells.push([x, y]);
    if (!cells.every(([x, y]) => P.ok(x, y, 0)) || !P.ok(x0 - 2, y0 + 2) || !P.ok(x0 + 4, y0 + 2) || !P.fits(cells.map(([x, y]) => y * P.W + x).concat([(y0 + 2) * P.W + x0 - 2, (y0 + 2) * P.W + x0 + 4]))) continue;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) cryptAt(g, 3 + i, 13 + j, (x0 + i) * TS, (y0 + j) * TS);
    P.prop('charnel', x0 + 1, y0 + 1, { flat: true, r: 18, box: [-23, 23, -24, 18], draw: false });
    const fires = [x0 - 2, x0 + 4].map(bx => { P.prop('brazier', bx, y0 + 2, { f: bx % 4, out: true, ember: true, pitFire: true, r: 6 }); return A.props[A.props.length - 1]; });
    A.charnel = { x0, y0, room: r.i, fires, t: 3, made: 0, kids: [] }; r.charnel = true; return;
  }
}
function charnelTick(dt) {
  const A = ARENA, C = A && A.charnel, h = G.me; if (!C || !h || h.dead || G.cine) return;
  for (const p of C.fires) if (p.out) { if (dist(h.x, h.y, p.x, p.y) < 20) { p.lightT = (p.lightT || 0) + dt; if (p.lightT > 0.8) { lightUp(p, true); } } else p.lightT = 0; }
  const r = A.rooms[C.room]; if (C.fires.every(p => !p.out) || C.made >= 8) return;
  if (!(h.x > r.ix0 * TS && h.x < (r.ix1 + 1) * TS && h.y > r.iy0 * TS && h.y < (r.iy1 + 1) * TS)) return;
  C.kids = C.kids.filter(u => !u.dead); if (C.kids.length >= 3 || (C.t -= dt) > 0) return;
  C.t = 4.5; C.made++;
  const spr = A.army === 'rot' ? (C.made % 2 ? 'MutilatedStumbler' : 'DismemberedCrawler') : (C.made % 3 ? 'DecrepitBones' : 'UnravelingCrawler'); if (!MOBS[spr]) return;
  const side = C.made % 4, x = (C.x0 + 0.5 + (side % 2 ? 2 : 0)) * TS + (side < 2 ? 4 : 0), y = (C.y0 + 2.6) * TS;
  const u = mkFoe(spr === 'UnravelingCrawler' || spr === 'DismemberedCrawler' ? 'flanker' : 'grunt', G.floor, x, y, spr);
  Object.assign(u, { z: -16, room: C.room, ghostT: 2.2, face: x < (C.x0 + 1.5) * TS ? -1 : 1 }); G.foes.push(u); G.units.push(u); wakeFoe(u, h, 'noise'); C.kids.push(u);
  SFX.clatter(panOf(x)); debris(x, y - 4, 5, ['#cfc6b0', '#a49a84', '#332919'], 40, 70, 1); smoke(x, y - 6, 1, 'dust', 4, 10, 0.6);
}

// ===================== the crypt's sounds =====================
// Every eight to sixteen seconds, something far off in the dark: a whisper, a groan, stone dragged over stone, a drip,
// bones settling; in turn, never the same twice running, each from its own side. When the Shade is hunting within a few
// rooms' reach the whispers come close and quick, from where it is.
const CRYPT_SOUNDS = ['drip', 'whisper', 'settle', 'scrape', 'drip', 'farGroan'];
function cryptSounds(dt) {
  const A = ARENA, h = G.me; if (!A || A.th.sheet !== 'crypt' || !h || h.dead || G.cine) return;
  const S = G.foes.find(f => f.shade && !f.dead && f.hunting && dist(f.x, f.y, h.x, h.y) < 170);
  if (S && !S.frozen) { if ((A.whisperT = (A.whisperT || 0) - dt) <= 0) { A.whisperT = 2.6; SFX.whisper(clamp((S.x - h.x) / 120, -0.9, 0.9), true); } }
  if ((A.soundT = (A.soundT === undefined ? 6 : A.soundT) - dt) > 0) return;
  const n = A.soundN = (A.soundN || 0) + 1, k = CRYPT_SOUNDS[n % CRYPT_SOUNDS.length], pan = (hash2(n, A.floor) - 0.5) * 1.6;
  A.soundT = 8 + 8 * hash2(n * 3 + 1, A.floor + 7); if (SFX[k]) SFX[k](pan);
}
// a cold brazier anywhere in the crypt lights from the hero's lamp when he stands at it a moment (the charnel pit's too)
function brazierLamp(dt) {
  const A = ARENA, h = G.me; if (!A || A.th.sheet !== 'crypt' || !h || h.dead) return;
  for (const p of A.props) { if (p.kind !== 'brazier' || !p.out || p.dead || p.pitFire) continue; if (dist(h.x, h.y, p.x, p.y) < 20) { p.lightT = (p.lightT || 0) + dt; if (p.lightT > 0.8) lightUp(p, true); } else p.lightT = 0; }
}

// ===================== the skull fonts =====================
// In one crypt room in three (by its place) the middle of the north wall holds a font instead of a light niche: a skull
// set in the brick over a stone basin with candles at its corners, the basin full of blood (no water in the crypt: the
// sheet's water font is left unused). Stand at it a moment to drink. The blood heals four tenths of the hero's life, and
// curses him (his blows go wide two times in three for twenty seconds). Drunk, the basin
// empties, and fills again from the skull's mouth over a minute and a half, a thin stream running down the whole while.
const FONT_COL = { blood: 23, water: 24 }, FONT_RGB = { blood: '#8a1418', water: '#2f7fcc' };
const fontRoom = r => r.kind === 'room' && hash2(r.i * 5 + 2, 77) < 0.34;
function cryptFont(A, r, g, xx, y) {
  const liq = 'blood', col = FONT_COL[liq], nx = xx * TS, M = MOSS();
  cryptAt(g, col, 1 + M, nx, y * TS - 3); // (the skull in the brick)
  const p = { kind: 'font', sheet: 'crypt', liq, full: 1, moss: M, x: nx + 8, y: r.iy0 * TS + 14, cy: r.iy0 * TS + 10, r: 6, solid: true, hp: 1e9, room: r.i, box: [-7, 7, -9, 1], drinkT: 0 };
  p.candles = addCandles(A, candleSrc(col * TS, (3 + M) * TS, TS, TS, [col * TS, (2 + M) * TS]), nx, r.iy0 * TS, r.iy0 * TS + 16, 900);
  A.props.push(p);
}
function drawFont(c, p) {
  const x = p.x - 8, y = p.y - 14, R = (2 + (p.moss || 0)) * TS; c.drawImage(IMG.crypt, 22 * TS, R, TS, TS, x, y, TS, TS); // (the empty basin)
  if (p.full > 0) { c.globalAlpha = Math.min(1, p.full * 1.4); c.drawImage(IMG.crypt, FONT_COL[p.liq] * TS, R, TS, TS, x, y, TS, TS); c.globalAlpha = 1; }
  if (p.full < 1 && p.full > 0.02) { c.fillStyle = FONT_RGB[p.liq]; c.fillRect(p.x - (p.liq === 'blood' ? 0 : 1), y - 6, 1, 8 + ((G.time * 20) | 0) % 2); } // (the stream from the skull's mouth)
  if (p.candles) drawCandles(c, p.candles);
}
function fontsTick(dt) {
  const A = ARENA, h = G.me; if (!A || A.th.sheet !== 'crypt' || !h || h.dead) return;
  for (const p of A.props) {
    if (p.kind !== 'font') continue;
    if (p.seal) { // (the blood seal's font: it never fills of itself; it takes a quarter of his life)
      if (p.full >= 1) continue; if (Math.abs(h.x - p.x) < 10 && h.y > p.y - 2 && h.y < p.y + 14) { if ((p.drinkT += dt) > 1) { const n = Math.min(Math.round(h.maxHp * 0.25), Math.max(0, Math.ceil(h.hp) - 1)); h.hp -= n; textPop(h.x, h.y, headZ(h) + 4, '-' + n, 'red', true); spray(h, 14, {}); sealFill(p); } } else p.drinkT = 0; continue;
    }
    if (p.full < 1) { p.full = Math.min(1, p.full + dt / 90); continue; }
    if (Math.abs(h.x - p.x) < 10 && h.y > p.y - 2 && h.y < p.y + 14) { if ((p.drinkT += dt) > 0.6) drinkFont(p, h); } else p.drinkT = 0;
  }
}
function drinkFont(p, h) {
  p.full = 0; p.drinkT = 0; SFX.splash(panOf(p.x)); healGlow(h.x, h.y);
  if (p.liq === 'blood') { const n = Math.round(h.maxHp * 0.4); h.hp = Math.min(h.maxHp, h.hp + n); h.curseT = 20; textPop(h.x, h.y, headZ(h) + 4, '+' + n, 'heal', true); textPop(h.x, h.y, headZ(h) + 12, 'CURSED', 'curse', false); SFX.hex(panOf(h.x), true); }
  else { const n = Math.round(h.maxHp * 0.15), cursed = h.curseT > 0; h.hp = Math.min(h.maxHp, h.hp + n); h.curseT = 0; textPop(h.x, h.y, headZ(h) + 4, '+' + n, 'heal', true); if (cursed) textPop(h.x, h.y, headZ(h) + 12, 'CLEANSED', 'heal', false); SFX.chime(panOf(h.x)); }
}

// ===================== the throne crypt =====================
// The way down is held by a lord of the dead: in the crypt's exit room a stone throne stands before the stairway (on its
// middle line, a step out from it), a burning brazier either side, and before the throne waits the strongest of the
// exit's guards, still, until the hero comes near or strikes it; then it rises, and the way stays sealed until it falls
// with the rest. With no brute among the guards, the floor's army sends one up to take the seat.
function throneRoom(A, r, g, P) {
  if (r.kind !== 'end' || A.throne) return;
  const x = r.stairX !== undefined ? r.stairX + 1 : Math.round((r.ix0 + r.ix1) / 2), y = r.iy0 + 4;
  if (!P.ok(x, y, 9) || !P.ok(x, y - 1, 9) || !P.fits([y * P.W + x, (y - 1) * P.W + x])) return;
  P.prop('throne', x, y, { sheet: 'crypt', tile: [26, 6 + MOSS()], th: 2, r: 6, box: [-6, 6, -10, 1] });
  for (const bx of [x - 2, x + 2]) if (P.ok(bx, y, 9) && P.fits([y * P.W + bx])) P.prop('brazier', bx, y, { f: bx % 4, r: 6 });
  A.throne = { x: x * TS + 8, y: y * TS + 14 };
}
function cryptLord(A) {
  if (!A.throne) return; const guards = G.foes.filter(f => f.exitGuard && !f.dead);
  let L = guards.filter(f => f.type === 'brute').sort((a, b) => b.maxHp - a.maxHp)[0];
  if (!L) { const spr = (ARMIES[A.army] && ARMIES[A.army].brute[0]) || 'GrapplerMummy'; if (!MOBS[spr]) return; L = mkFoe('brute', G.floor, A.throne.x, A.throne.y + 4, spr); L.exitGuard = true; L.room = A.end.i; G.foes.push(L); }
  Object.assign(L, { x: A.throne.x, y: A.throne.y + 4, seated: true, aware: false, face: 1, lord: true, maxHp: L.maxHp * 1.6, hp: L.maxHp * 1.6, dmgMul: (L.dmgMul || 1) * 1.2 });
}
function seatedTick(f) {
  f.vx = f.vy = 0; f.moving = false; const h = G.me;
  if (!(h && !h.dead && (dist(h.x, h.y, f.x, f.y) < 76 || f.hp < f.maxHp))) return;
  f.seated = false; f.stun = 0.5; SFX.groan(panOf(f.x)); SFX.stone(panOf(f.x), true); shake(0.2); smoke(f.x, f.y - 6, 3, 'dust', 6, 14, 0.8); wakeFoe(f, h, 'noise');
}

// ===================== the burial galleries =====================
// The crypt's corridors are its galleries: along the north wall of every straight one running east and west, from its
// middle out and mirrored, a light niche every fourth tile and niches of skulls between, the dead stored in its walls.
function cryptGalleries(A, g) {
  for (const hl of A.halls) {
    if (hl.dir !== 'h' || hl.bent || hl.hidden) continue; const y = hl.y0 - 1, c2 = hl.x0 + hl.x1, R = { i: -1, fy0: -99 }; let k = 0;
    for (let x = Math.floor(c2 / 2); x > hl.x0 + 1; x -= 2, k++) {
      const m = c2 - x, both = x === m ? [x] : [x, m]; if (both.some(xx => !plainWall(A, xx, y))) continue;
      for (const xx of both) cryptNiche(A, R, g, xx, y, k % 2 === 0 ? 'light' : 'skulls', k);
    }
  }
}
// a snuffed candle (not a burnt-down one) lights again from the hero's lamp: stand under a light niche, or beside a
// candle tomb, a moment
function relightTick(dt) {
  const A = ARENA, h = G.me; if (!A || A.th.sheet !== 'crypt' || !h || h.dead) return;
  const relight = (o, list) => { if ((o.relightT = (o.relightT || 0) + dt) < 0.9) return; o.relightT = 0; let n = 0; for (const c of list) if (!c.lit && c.wax > 0.6) { c.lit = true; c.sput = 0; n++; } if (n) { SFX.fire(panOf(o.x)); sparks(o.x, o.y - 6, 2, 5, 'fire', 40, 40); A.lights = A.slit = null; } };
  for (const t of A.torches) { if (!t.candles || !t.candles.some(c => !c.lit && c.wax > 0.6)) continue; if (Math.abs(h.x - t.x) < 12 && h.y > t.y + 8 && h.y < t.y + 34) relight(t, t.candles); else t.relightT = 0; }
  for (const p of A.props) { if (p.kind !== 'tomb' || !p.candles || p.opened || p.wake !== undefined || !p.candles.some(c => !c.lit && c.wax > 0.6)) continue; if (dist(h.x, h.y, p.x, p.y - 6) < 22) relight(p, p.candles); else p.relightT = 0; }
}

// ===================== hints =====================
// The first time the hero comes near something in the crypt he can use (a full font, a cold brazier, a niche whose
// candles were put out), a word rises from it once: what standing there does.
function cryptHints() {
  const A = ARENA, h = G.me; if (!A || A.th.sheet !== 'crypt' || !h || h.dead) return;
  const hint = (o, x, y, txt, col) => { if (o.hinted || dist(h.x, h.y, x, y) > 34) return; o.hinted = true; textPop(x, y, 14, txt, col, false); };
  for (const p of A.props) { if (p.kind === 'font' && p.seal && p.full < 1) hint(p, p.x, p.y, 'IT THIRSTS', 'red'); else if (p.kind === 'font' && p.full >= 1 && !p.seal) hint(p, p.x, p.y, p.liq === 'blood' ? 'DRINK: BLOOD' : 'DRINK: WATER', p.liq === 'blood' ? 'red' : 'heal'); else if (p.kind === 'brazier' && p.out && !p.dead) hint(p, p.x, p.y, 'STAND TO LIGHT', 'gold'); }
  for (const t of A.torches) if (!t.hinted && t.candles && t.candles.some(c => !c.lit && c.wax > 0.6) && dist(h.x, h.y, t.x, t.y + 22) <= 34) { // (one word for a room's dark niches, not one each)
    hint(t, t.x, t.y + 22, t.vigil ? 'LIGHT EVERY NICHE' : 'STAND TO RELIGHT', 'gold'); for (const u of A.torches) if (u.room === t.room) u.hinted = true; break; }
}

// ===================== the blood seal =====================
// A crypt puzzle (THE BLOOD SEAL, one of the gates that stand in the way on the crypt's floors): the door on is shut, and
// in the room before it stands an empty font, its skull dry. Blood opens the way: stand at the font a moment and it takes
// a quarter of the hero's life (never the last of it), or cut down something that bleeds beside it (bones and dust do
// not count). Full, the door grinds up.
function bloodSeal(A, r, bare, plate) {
  const g = r.gateOf, [gx, gy] = r.doors.find(d => d.hall === g.hall).cells[1], c = [];
  for (let y = r.iy0 + 1; y <= r.iy1 - 1; y++) for (let x = r.ix0 + 1; x <= r.ix1 - 1; x++) { const d = Math.abs(x - gx) + Math.abs(y - gy); if (d >= 4 && d <= 7 && bare(x, y) && !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < 20 && Math.abs(q.cy - (y * TS + 10)) < 20)) c.push([x, y, d]); }
  c.sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]); const at = c[0]; if (!at) { leverInstead(A, r, bare, plate); return; } // (no room: a plain gate's lever instead)
  const [x, y] = at, M = MOSS(), p = { kind: 'font', sheet: 'crypt', liq: 'blood', full: 0, moss: M, seal: g, x: x * TS + 8, y: y * TS + 14, cy: y * TS + 10, r: 6, solid: true, hp: 1e9, room: r.i, box: [-7, 7, -9, 1], drinkT: 0 };
  p.candles = addCandles(A, candleSrc(23 * TS, (3 + M) * TS, TS, TS, [23 * TS, (2 + M) * TS]), x * TS, y * TS, y * TS + 16, 900); A.props.push(p);
}
function sealFill(p) {
  if (p.full >= 1) return; p.full = 1; const g = p.seal; SFX.squelch(panOf(p.x), true); SFX.groan(panOf(p.x)); logEv('blood seal', { at: tileOf(p) });
  if (g && !g.going && g.k > 0) startGateCine({ x: p.x }, g);
}
// something that bleeds cut down beside an empty seal font fills it
function sealBlood(u) {
  const A = ARENA; if (!A || A.th.sheet !== 'crypt' || !bleeds(u)) return;
  for (const p of A.props) if (p.kind === 'font' && p.seal && p.full < 1 && dist(u.x, u.y, p.x, p.y) < 30) { pool(p.x, p.y - 4, u.def.blood || 'red', 1.5); sealFill(p); }
}

// a crypt puzzle with no place for its answer gets a plain gate's lever instead (a button free in the room)
function leverInstead(A, r, bare, plate) {
  const g = r.gateOf, cx = Math.round((r.ix0 + r.ix1) / 2), cy = Math.round((r.iy0 + r.iy1) / 2), s = [];
  for (let y = r.iy0 + 1; y <= r.iy1 - 1; y++) for (let x = r.ix0 + 1; x <= r.ix1 - 1; x++) if (bare(x, y) && !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < 20 && Math.abs(q.cy - (y * TS + 10)) < 18)) s.push([x, y]);
  s.sort((a, b) => Math.abs(a[0] - cx) + Math.abs(a[1] - cy) - Math.abs(b[0] - cx) - Math.abs(b[1] - cy) || a[0] - b[0] || a[1] - b[1]);
  const [x, y] = s[0] || [cx, cy]; plate(x, y, { remote: true, gate: g }); g.how = 'lever'; r.puz = 'lever'; A.puzNames[A.puzNames.lastIndexOf(PUZ_NAMES.blood) >= 0 ? A.puzNames.lastIndexOf(PUZ_NAMES.blood) : A.puzNames.lastIndexOf(PUZ_NAMES.vigil)] = PUZ_NAMES.gate;
}

// ===================== the vigil =====================
// A crypt puzzle (THE VIGIL): a gate shut across the way out of a room whose every light has gone out. Its candle niches
// stand dark (snuffed, not burnt down: they will take a flame), its braziers cold. Light every niche of the room again
// (stand under one a moment and the lamp lights its candles: relightTick) and, the moment all of them burn at once, the
// gate grinds up. Until then the room is the dark the dead wait in: tombs open on whoever comes near them, the buried
// rise, the heaps get up; a swing that passes over a niche's candles puts them out again, and the Shade, if it is near,
// puts them out as it comes. Light is the way through, and the way through is lit one niche at a time.
function vigil(A, r, bare, plate) {
  const ts = A.torches.filter(t => t.room === r.i && t.candles && t.candles.length);
  if (ts.length < 2) { leverInstead(A, r, bare, plate); return; }
  for (const t of ts) { for (const c of t.candles) { c.lit = false; c.smokeT = 0; } t.out = true; t.cf = 0; t.vigil = true; }
  for (const p of A.props) if (p.kind === 'brazier' && p.room === r.i && !p.out) { p.out = true; p.ember = true; }
  r.vigil = { gate: r.gateOf, ts }; A.vigils = (A.vigils || []).concat([r.vigil]);
}
function vigilTick() {
  const A = ARENA; if (!A || !A.vigils) return;
  for (const v of A.vigils) {
    if (v.done || v.gate.going || v.gate.k <= 0) continue;
    const lit = v.ts.filter(t => t.candles.every(c => c.lit)).length; if (lit !== v.lit) { if (v.lit !== undefined && lit > v.lit) SFX.chime(panOf(G.me ? G.me.x : 0)); v.lit = lit; }
    if (lit < v.ts.length) continue;
    v.done = true; const gx = gatePos(v.gate); logEv('vigil', { niches: lit });
    for (const t of v.ts) FX.beams.push({ x0: t.x, y0: t.y - 4, x1: gx[0], y1: gx[1], w: 1.2, col: 'fire', life: 1, t: 0, steady: true, cap: true });
    after(0.9, () => { if (ARENA === A) startGateCine(v.ts[0], v.gate); });
  }
}

// ===================== the crypt's floor names =====================
// A floor's character is named on its card under the floor's own name; the cellar's names (the storehouses, the
// waterworks) do not belong down here, so the crypt names the same characters its own way (the cisterns by what fills them)
const CRYPT_ARCH = { stores: 'THE CHARNEL STORES', halls: 'THE NAVES OF THE DEAD', dark: 'THE UNLIT TOMBS', water: { blood: 'THE BLOOD CISTERNS', black: 'THE BLACK CISTERNS', rot: 'THE ROTTING CISTERNS' }, pits: 'THE OPEN GRAVES', locks: 'THE SEALED TOMBS' };
function archName(A) {
  const a = A && A.arch; if (!a || !a.name) return ''; if (A.th.sheet !== 'crypt') return a.name;
  const n = CRYPT_ARCH[a.k]; return typeof n === 'object' ? n[A.liq] || a.name : n || a.name;
}

// ===================== the lamp falters =====================
// While the Shade hunts close by, the hero's lamp gutters and draws in (lampK, 34_sight): the nearer it is, the less the
// lamp reaches and the more it flickers (70_render), and the less of the dark it holds still (its freeze, above). It
// comes back as the Shade draws off, or dies.
function lampDimTick(dt) {
  const A = ARENA, h = G.me; let want = 0;
  if (A && A.th.sheet === 'crypt' && h && !h.dead) for (const f of G.foes) if (f.shade && !f.dead && f.hunting) { const d = dist(f.x, f.y, h.x, h.y); if (d < 150) want = Math.max(want, 1 - d / 150); }
  G.lampDim = (G.lampDim || 0) + (want - (G.lampDim || 0)) * Math.min(1, dt * (want > (G.lampDim || 0) ? 2.5 : 0.8));
}
