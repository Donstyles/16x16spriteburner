// ===================== the rooms' shapes =====================
// Every room is first cut out of the rock as a rectangle (30_arena). Some are then given a shape of their own before the
// walls are painted, so the walls round it are drawn from the sheet's pieces like any other (30_arena):
// - THE PILLARED HALL: blocks of wall standing free in the room, two tiles wide and three tall, in a pair, a four
//   or two rows of three, mirrored about the room's middle.
// - THE RING: one great block of wall in the middle, square: three or four wide and a tile taller (its top, drawn north of
//   where it stands, is then as deep as it is wide; its bricks are the extra row); the room is a walk round it.
// - CUT CORNERS: a corner or two of the rock left standing in the room (an L, a T, a Z), or all four (a cross).
// - ALCOVES: niches let into the north wall (or a side wall without a door), with something standing in them: a statue on
//   its pedestal, a burning brazier, a small chest, a column.
// - SPURS: walls run out into the room from one side, three tiles thick, from any wall
//   wall, making bays; from the north and the south in turn they make the room a serpentine.
// Every door still reaches every other, nothing of the room is cut off, and the doors' landings stay clear. A shaped room
// takes no set piece, pit, cistern, shrine or pond (its walls are its feature); the end room may have a pillared hall or a
// ring, kept clear of its north wall (the stairs).
const SHAPES = { force: null }; // (a test: this shape on every room that can take one)
const SHAPE_KINDS = ['hall', 'ring', 'cuts', 'alcoves', 'spurs', 'serpent'];
function shapeRooms(rooms, fl, W, H, floor) {
  for (const r of rooms) if (r.great) { greatHall(r, fl, W, H); r.shape = 'great'; } // (THE GREAT HALL: 30_arena)
  for (const r of rooms) {
    if (r.great) continue;
    if (r.kind !== 'room' && r.kind !== 'end') continue; if (r.hiddenN) continue; if (r.kind === 'end' && lakeFloor(floor)) continue; // (the lake's room stays whole: 42_magmaboss) // (a hidden wing's doorway in its north wall: kept plain)
    if (!SHAPES.force && !chance(clamp((0.32 + floor * 0.04) * (ARCH.cur.shape || 1), 0.32, 0.8))) continue; // (more on THE HALLS OF STONE: 35_themes)
    const kinds = SHAPES.force ? [SHAPES.force] : pitShuffle(r.kind === 'end' ? ['hall', 'ring'] : solidTh(TH) ? ['hall', 'ring', 'cuts'] : SHAPE_KINDS.slice()); // (the crypt's: only the shapes that can stand mirrored; its cut corners go in mirrored pairs, below)
    for (const k of kinds) if (shapeRoom(r, k, fl, W, H)) { r.shape = k; break; }
  }
}
// the doors' landings and a tile round them: no wall goes there
function landingKeep(r, W) {
  const keep = new Set(), add = (x, y) => keep.add(y * W + x);
  for (const d of r.doors) {
    const xs = d.cells.map(c => c[0]), ys = d.cells.map(c => c[1]);
    if (d.side === 'N' || d.side === 'S') { const y0 = d.side === 'N' ? r.iy0 : r.iy1 - 2; for (let y = y0; y <= y0 + 2; y++) for (let x = Math.min(...xs) - 2; x <= Math.max(...xs) + 2; x++) add(x, y); }
    else { const x0 = d.side === 'W' ? r.ix0 : r.ix1 - 2; for (let x = x0; x <= x0 + 2; x++) for (let y = Math.min(...ys) - 2; y <= Math.max(...ys) + 2; y++) add(x, y); }
  }
  if (r.kind === 'end') for (let y = r.iy0; y <= r.iy0 + 2; y++) for (let x = r.ix0; x <= r.ix1; x++) add(x, y); // (the stairs go somewhere in its north wall)
  return keep;
}
// rock: cells of the room turned to wall; open: cells of the walls turned to floor (alcoves). Every door reaches every
// other and no floor of the room is left cut off.
function shapeOK(r, rock, open, fl, W, keep) {
  for (const i of rock) { const x = i % W, y = (i / W) | 0; if (x < r.ix0 || x > r.ix1 || y < r.iy0 || y > r.iy1 || keep.has(i)) return false; }
  const inside = i => { const x = i % W, y = (i / W) | 0; return open.has(i) || (x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1 && !rock.has(i)); };
  const doorIn = r.doors.map(d => { const [x, y] = d.cells[1]; return d.side === 'N' ? (y + 1) * W + x : d.side === 'S' ? (y - 1) * W + x : d.side === 'W' ? y * W + x + 1 : y * W + x - 1; });
  let n = 0; for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) if (inside(y * W + x)) n++; n += open.size;
  const s = doorIn[0], seen = new Set([s]), q = [s]; while (q.length) { const i = q.pop(); for (const j of [i - 1, i + 1, i - W, i + W]) if (!seen.has(j) && inside(j)) { seen.add(j); q.push(j); } }
  if (seen.size !== n || !doorIn.every(i => seen.has(i))) return false;
  for (const i of seen) if ((!inside(i - 1) && !inside(i + 1) && !doorIn.includes(i)) || (!inside(i - W) && !inside(i + W) && !doorIn.includes(i))) return false; // (no lane a tile wide)
  return true;
}
function shapeRoom(r, k, fl, W, H) {
  const keep = landingKeep(r, W), side = s => r.doors.some(d => d.side === s);
  const rect = (S, x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) S.add(y * W + x); };
  for (let t = 0; t < 30; t++) {
    const rock = new Set(), open = new Set(), alc = [];
    if (k === 'hall') { // blocks two tiles wide, mirrored about the middle
      const bw = 2, bh = solidTh(TH) ? 4 : 3, top = r.iy0 + (r.kind === 'end' ? 3 : 2), lay = pick(['pair', 'four', 'rows']); // (the crypt's two deeper: its top square, 30_arena cryptBlocks)
      const hi = Math.floor((r.ix0 + r.ix1) / 2) - 2 - bw; if (hi < r.ix0 + 2) return false; const xl = randi(r.ix0 + 2, hi), xr = r.ix0 + r.ix1 - xl - bw + 1; if (xr - (xl + bw) < 2) continue;
      const xs = lay === 'rows' ? [xl, Math.round((r.ix0 + r.ix1 - bw + 1) / 2), xr] : [xl, xr]; if (lay === 'rows' && (xs[1] - (xl + bw) < 2 || xr - (xs[1] + bw) < 2)) continue;
      let ys; if (lay === 'pair') ys = [Math.round((r.iy0 + r.iy1 - bh + 1) / 2)]; else { const yt = randi(top, top + 1), yb = r.iy0 + r.iy1 - yt - bh + 1; if (yb - (yt + bh) < 2) continue; ys = [yt, yb]; }
      if (ys[0] < top || ys[ys.length - 1] + bh - 1 > r.iy1 - 2) continue;
      for (const x of xs) for (const y of ys) rect(rock, x, y, bw, bh);
    } else if (k === 'ring') { // one great block in the middle, a walk round it
      const top = r.kind === 'end' ? 3 : 2, dd = solidTh(TH) ? 2 : 1, ws = [3, 5].filter(b => b <= r.w - 8 && b + dd <= r.h - top - 2); if (!ws.length) return false; const bw = pick(ws), bh = bw + dd; // (a tile taller than wide: its top, drawn north of where it stands, then reads square; the crypt's two, 30_arena cryptBlocks)
      // lined up with the corridors: an odd width like theirs, centred on a north or south doorway (else the room's middle)
      const nd = r.doors.filter(d => d.side === 'N' || d.side === 'S').map(d => d.cells[1][0]), ax = nd.length ? pick(nd) : Math.round((r.ix0 + r.ix1) / 2);
      const x0 = ax - (bw - 1) / 2, y0 = Math.max(r.iy0 + (r.kind === 'end' ? 3 : 2), Math.round((r.iy0 + r.iy1 - bh + 1) / 2));
      if (x0 - r.ix0 < 3 || r.ix1 - (x0 + bw - 1) < 3 || r.iy1 - (y0 + bh - 1) < 2) continue; rect(rock, x0, y0, bw, bh);
    } else if (k === 'cuts') { // corners of rock left standing
      if (solidTh(TH)) { // (the crypt's: the two corners of one end, or all four, each the same size, mirrored)
        const four = chance(0.4), cyy = chance(0.5) ? 1 : 0, cw = randi(2, Math.max(2, Math.floor(r.w * 0.3))), ch = randi(2, Math.max(2, Math.floor(r.h * 0.4)));
        for (const [cx, cy] of four ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, cyy], [1, cyy]]) rect(rock, cx ? r.ix1 - cw + 1 : r.ix0, cy ? r.iy1 - ch + 1 : r.iy0, cw, ch);
      } else {
      const n = pick([1, 1, 2, 2, 4]), cs = pitShuffle([[0, 0], [1, 0], [0, 1], [1, 1]]).slice(0, n);
      for (const [cx, cy] of cs) {
        const cw = randi(2, Math.max(2, Math.floor(r.w * 0.4))), ch = randi(2, Math.max(2, Math.floor(r.h * 0.45)));
        rect(rock, cx ? r.ix1 - cw + 1 : r.ix0, cy ? r.iy1 - ch + 1 : r.iy0, cw, ch);
      }
      }
    } else if (k === 'spurs' || k === 'serpent') { // walls run out into the room
      const ser = k === 'serpent', n = ser ? randi(2, 3) : randi(1, 2), from = ser ? (chance(0.5) ? ['N', 'S', 'N'] : ['S', 'N', 'S']) : null;
      const xsAll = []; for (let x = r.ix0 + 3; x <= r.ix1 - 5; x++) xsAll.push(x);
      let xs = ser ? (() => { const step = (r.w - 2) / (n + 1); return Array.from({ length: n }, (_, i) => Math.round(r.ix0 + step * (i + 1)) - 1 + randi(-1, 1)); })() : pitShuffle(xsAll).slice(0, n);
      let bad = false;
      for (let i = 0; i < n; i++) {
        const s = ser ? from[i] : pick(['N', 'S', 'N', 'S', 'E', 'W']), x = xs[i];
        if (s === 'N' || s === 'S') { const L = ser ? r.h - 3 : randi(2, Math.max(2, r.h - 4)); rect(rock, x, s === 'N' ? r.iy0 : r.iy1 - L + 1, 3, L); } // (three tiles thick: two read as a thin line)
        else { if (side(s)) { bad = true; break; } const L = randi(2, Math.max(2, Math.floor(r.w / 2) - 2)), t = L >= 3 ? 4 : 3, y = randi(r.iy0 + 1, r.iy1 - t); if (y < r.iy0 + 1) { bad = true; break; } rect(rock, s === 'W' ? r.ix0 : r.ix1 - L + 1, y, L, t); } // (four tiles thick, its top then reads two wide; a short stub stays three)
      }
      if (bad) continue;
      // bays two tiles wide at least between spurs
      const cols = [...new Set([...rock].map(i => i % W))].sort((a, b) => a - b); if (cols.some((c, i) => i && c - cols[i - 1] > 1 && c - cols[i - 1] < 3)) continue;
    } else if (k === 'alcoves') { // niches let into the walls
      const want = randi(1, 3), nd = r.doors.filter(d => d.side === 'N').flatMap(d => d.cells.map(c => c[0]));
      for (let a = 0; a < 12 && alc.length < want; a++) {
        const sd = !side('E') && chance(0.25) ? 'E' : !side('W') && chance(0.25) ? 'W' : 'N';
        if (sd === 'N') {
          const x = randi(r.ix0 + 1, r.ix1 - 3), y = r.iy0 - 2; if (nd.some(c => c >= x - 3 && c <= x + 5) || alc.some(o => o.side === 'N' && Math.abs(o.x - x) < 6)) continue;
          let ok = y - 3 >= 0; for (let yy = y - 3; yy <= y + 1 && ok; yy++) for (let xx = x - 1; xx <= x + 3; xx++) if (fl[yy * W + xx]) { ok = false; break; } if (!ok) continue;
          rect(open, x, y, 3, 2); alc.push({ side: 'N', x, y, w: 3, h: 2 });
        } else {
          const y = randi(r.iy0 + 1, r.iy1 - 3), x = sd === 'E' ? r.ix1 + 1 : r.ix0 - 2; if (alc.some(o => o.side === sd)) continue;
          let ok = true; for (let yy = y - 3; yy <= y + 3 && ok; yy++) for (let k = 0; k < 4; k++) { const X = sd === 'E' ? r.ix1 + 1 + k : r.ix0 - 1 - k; if (fl[yy * W + X]) { ok = false; break; } } if (!ok) continue;
          rect(open, x, y, 2, 3); alc.push({ side: sd, x, y, w: 2, h: 3 });
        }
      }
      if (!alc.length) return false;
    }
    if (!rock.size && !open.size) continue;
    if (!shapeOK(r, rock, open, fl, W, keep)) continue;
    for (const i of rock) fl[i] = 0; for (const i of open) fl[i] = 1;
    r.rock = rock; if (alc.length) r.alcoves = alc; return true;
  }
  return false;
}
// THE GREAT HALL's colonnade: blocks of wall two tiles wide in two rows down its length (a long hall), or two columns
// down a nave, every five or six tiles; any that would stand in a door's way is left out
function greatHall(r, fl, W, H) {
  const keep = landingKeep(r, W), bh = solidTh(TH) ? 4 : 3, step = randi(5, 6);
  for (let t = 0; t < 12; t++) {
    const rock = new Set(), add = (x0, y0, w, h) => { const c = []; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) c.push(y * W + x); if (c.some(i => keep.has(i))) return; for (const i of c) rock.add(i); };
    const C = solidTh(TH), group = bs => { const cs = bs.map(([x0, y0, w, h]) => { const c = []; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) c.push(y * W + x); return c; }); if (cs.some(c => c.some(i => keep.has(i)))) return; for (const c of cs) for (const i of c) rock.add(i); }; // (the crypt's: a block and its mirrors stand together or not at all)
    if (r.great === 'h') { // two rows with a nave between them, or (no room for two) one row down the middle
      const h2 = bh, yt = r.iy0 + (r.kind === 'end' ? 3 : 2) + (t % 2), yb = r.iy0 + r.iy1 - yt - h2 + 1, two = yb - (yt + h2) >= 2, ym = Math.max(r.iy0 + (r.kind === 'end' ? 4 : 3), Math.round((r.iy0 + r.iy1 - h2 + 1) / 2));
      const x00 = r.ix0 + 3 + randi(0, 1);
      if (C) { // (the crypt's colonnade: laid out from the hall's middle, mirrored)
        const c2 = r.ix0 + r.ix1, rowsOf = x => two ? [[x, yt, 2, h2], [x, yb, 2, h2]] : [[x, ym, 2, h2]];
        let x = c2 % 2 ? (c2 - 1) / 2 : c2 / 2 - 1 - Math.floor(step / 2); if (c2 % 2) { group(rowsOf(x)); x -= step; }
        for (; x >= r.ix0 + 3; x -= step) group(rowsOf(x).concat(rowsOf(c2 - x - 1)));
      } else for (let x = x00; x + 1 <= r.ix1 - 3; x += step) { if (two) { add(x, yt, 2, h2); add(x, yb, 2, h2); } else add(x, ym, 2, h2); }
    }
    else { const xl = r.ix0 + 2 + randi(0, 1), xr = r.ix0 + r.ix1 - xl - 1; if (xr - (xl + 2) < 3) return; for (let y = r.iy0 + (r.kind === 'end' ? 4 : 3); y + bh - 1 <= r.iy1 - 3; y += step) { if (C) group([[xl, y, 2, bh], [xr, y, 2, bh]]); else { add(xl, y, 2, bh); add(xr, y, 2, bh); } } }
    if (rock.size && shapeOK(r, rock, new Set(), fl, W, keep)) { for (const i of rock) fl[i] = 0; r.rock = rock; return; }
  }
}
// whether a north wall's brick face stands at (x, y): rock with floor right under it (torches, banners and windows hang
// only there)
// a stretch of plain north wall at x: its bricks the sheet's plain face [6, 1] and its top the plain wall top [6, 0], not
// a face's end or a corner beside an alcove, a cut corner or a doorway (a window, a banner or a torch hung there would
// run over the corner)
function plainWall(A, x, y) { return faceAt(A, x, y) && A.wt[y * A.w + x] === 6 * 64 + 1 + 1 && A.wt[(y - 1) * A.w + x] === 6 * 64 + 0 + 1; }
function faceAt(A, x, y) { return x >= 0 && y >= 0 && y + 1 < A.h && A.fl[y * A.w + x] === 0 && FLOOR(A.fl[(y + 1) * A.w + x]); }
// The blocks of wall a room's shape leaves standing get torches, banners and barred windows on their faces like any wall.
// Only plain brick takes them: a 2-wide block has none (both its face
// tiles are wall ends), a 3-wide ring one (in the middle), a 5-wide three, a spur's long side many. Each face is laid out
// about its middle: one tile a torch, a banner or a window; three a torch, a banner or a window and a torch, a banner alone,
// two windows or two torches; a long face torches four tiles apart, centred, a banner or a window now and then between.
function blockDecor(A, r, g) {
  const W = A.w, seen = new Set(), faces = [];
  for (const s of r.rock) {
    if (seen.has(s)) continue; const blk = [], st = [s]; seen.add(s);
    while (st.length) { const c = st.pop(); blk.push(c); for (const d of [1, -1, W, -W]) if (r.rock.has(c + d) && !seen.has(c + d)) { seen.add(c + d); st.push(c + d); } }
    let run = []; for (const c of blk.filter(q => plainWall(A, q % W, (q / W) | 0)).sort((a, b) => a - b)) { if (run.length && c !== run[run.length - 1] + 1) { faces.push(run); run = []; } run.push(c); } if (run.length) faces.push(run);
  }
  const torch = c => A.torches.push({ x: (c % W) * TS + 8, y: ((c / W) | 0) * TS + 9, tx: c % W, f: randi(0, 3), room: r.i });
  const wy = A.th.tone === 'brown' ? 3 : 0, WIN = [[16, 2, 1], [16, 3, 1], [17, 3, 2], [18, 3, 2], [19, 2, 1], [19, 3, 1], [20, 3, 2]];
  const win = c => { const x = c % W, y = (c / W) | 0, [wx, wy0, wh] = pick(WIN); for (let j = 0; j < wh; j++) tileAt(g, wx, wy0 + wy - j, x * TS, (y - j) * TS); };
  const banner = c => { const x = c % W, y = (c / W) | 0, b = randi(0, 19); if (b < 12) { tileAt(g, 20 + b, 0, x * TS, (y - 1) * TS); tileAt(g, 20 + b, 1, x * TS, y * TS); } else tileAt(g, 16 + (b - 12) % 4, (b - 12) >> 2, x * TS, (y - 1) * TS + 11); };
  if (A.th.sheet === 'crypt') { for (const f of faces) cryptFace(A, r, g, f); return; }
  if (isMagma(A)) { for (const f of faces) if (f.length >= 2 && chance(0.5)) { const a = randi(0, f.length - 2), n = randi(2, Math.min(4, f.length - a)); for (let i = a; i < a + n; i++) magmaVein(A, g, f[i] % W, (f[i] / W) | 0, i - a); } return; } // (the magma's: lava in the rock, 42_magma) // (the crypt's: niches, mirrored on each face, 43_crypt)
  for (const f of faces) {
    const n = f.length, k = Math.random();
    if (n === 1) { if (k < 0.4) torch(f[0]); else if (k < 0.7) banner(f[0]); else if (k < 0.9) win(f[0]); }
    else if (n === 2) { if (k < 0.4) { banner(f[0]); banner(f[1]); } else if (k < 0.7) { win(f[0]); win(f[1]); } }
    else if (n === 3) { if (k < 0.3) { torch(f[0]); banner(f[1]); torch(f[2]); } else if (k < 0.55) { torch(f[0]); win(f[1]); torch(f[2]); } else if (k < 0.7) banner(f[1]); else if (k < 0.85) { win(f[0]); win(f[2]); } else { torch(f[0]); torch(f[2]); } }
    else { const cnt = Math.floor((n - 1) / 4) + 1, s0 = Math.floor((n - 1 - (cnt - 1) * 4) / 2), ts = new Set(); for (let i = 0; i < cnt; i++) ts.add(s0 + i * 4); for (const i of ts) torch(f[i]); for (let i = 0; i < n; i++) if (!ts.has(i) && !ts.has(i - 1) && !ts.has(i + 1)) { const q = Math.random(); if (q < 0.25) banner(f[i]); else if (q < 0.4) win(f[i]); } }
  }
}
// what stands in the alcoves (after the room is furnished): a statue on its pedestal, a burning brazier, a small chest, a
// column; a torch on the back wall of a north niche
function shapeAfter(A, r) {
  if (!r.alcoves) return; const d = A.th.tone === 'brown' ? 3 : 0;
  const put = (kind, tx, ty, o) => A.props.push(Object.assign({ kind, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 5, solid: true, hp: 1e9, room: r.i }, o));
  for (const a of r.alcoves) {
    const mx = a.side === 'N' ? a.x + 1 : a.x + (a.side === 'E' ? 1 : 0), my = a.side === 'N' ? a.y : a.y + 1, what = pick(['statue', 'statue', 'brazier', 'chest', 'column', 'chest']);
    if (what === 'statue') put('stone', mx, my, { tile: [24, 2 + d], th: 2 }); // (a round column on its plinth: the sheet's stepped pedestal is not used)
    else if (what === 'column') put('stone', mx, my, { tile: [22, 2 + d], th: 2 });
    else if (what === 'brazier') put('brazier', mx, my, { f: randi(0, 3) });
    else put('chest', mx, my, { tile: [pick([28, 30]), 8], th: 1, hp: 40, nook: true });
    if (a.side === 'N') for (const tx of what === 'statue' || what === 'column' ? [a.x, a.x + 2] : [mx]) A.torches.push({ x: tx * TS + 8, y: (a.y - 1) * TS + 9, tx, f: randi(0, 3), room: r.i }); // (either side of a statue or a column)
  }
}
// THE GALLERY: a corridor twice as wide between its doorways, columns down its middle every three tiles
function hallColumns(A, hl) {
  const P = A.th.pillar[randi(0, 1)], H = hl.dir === 'h', a0 = (H ? hl.x0 : hl.y0) + 3, a1 = (H ? hl.x1 : hl.y1) - 3;
  for (let k = a0; k <= a1; k += 3) { const tx = H ? k : hl.x0 + 1, ty = H ? hl.y0 + 1 : k; if (!FLOOR(A.fl[ty * A.w + tx]) || A.props.some(q => !q.dead && Math.abs(q.x - (tx * TS + 8)) < 16 && Math.abs(q.y - (ty * TS + 14)) < 16)) continue; A.props.push({ kind: 'pillar', tile: P, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 6, solid: true, hp: 1e9, hall: true }); }
}
