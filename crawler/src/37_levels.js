// ===================== level design: set pieces made of the water =====================
// Each floor may hold one or more set pieces, chosen from the shape of its room graph and built out of the cistern's
// works (36_works). Every body of water in them can be drained, so nothing is ever cut off for good.
// - THE FLOODED WAY: a room that the only way to the stairs runs through, flooded wall to wall but for a landing at each
//   door and a ledge along the wall from the landing you come in by to a side branch's door. The stairs' side lies across
//   the water; the sluice is down the branch: a pressure plate under an outlet grate in the north wall, water trickling. Step on it and the view goes to the flooded room
//   while it drains (everything else holds still; attack or dodge skips it). In the drained basin lie the drowned, only
//   their heads above the mud; they climb out when anyone comes near.
// - THE GAUNTLET: a room flooded but for a stone causeway that carries the corridors across it, with archers on small
//   islands out of reach, and flooded pillars along the causeway to hide behind. Its sluice is in another room, best one
//   beyond it; once the water is gone the islands can be walked to.
// - THE SENTINEL: a pond in an ordinary room with a single archer on an island in its middle, shooting at whatever moves;
//   its sluice too is in another room.
// Every sluice (the cisterns' too) is in a room of its own, under an outlet in the north wall that trickles while its
// water is up; stepping on it shows that water draining. The layout puts it after its water: in a room that can only be
// reached through the water's own room. And each room has an arrow in its floor toward the stairs.
const FORCE = { set: false }; // the puzzle floor (kit screen): every set piece that fits, on one floor

function levelPlan(A, g) {
  const rooms = A.rooms, adj = r => A.halls.filter(h => h.A === r || h.B === r).map(h => (h.A === r ? h.B : h.A));
  const reach = skip => { const seen = new Set([A.start]), q = [A.start]; while (q.length) { const r = q.shift(); for (const n of adj(r)) if (n !== skip && !seen.has(n)) { seen.add(n); q.push(n); } } return seen; };
  const free = r => r.kind === 'room' && !r.chest && !r.set && !r.sluice && !r.shape && !r.puz, shuffled = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
  A.sets = []; A.plankSet = new Set(); A.noProp = new Set(); A.planning = true;
  const tryFlood = () => { for (const r of shuffled(rooms.filter(r => free(r) && !reach(r).has(A.end)))) {
    // the flooded way stands where the way to the stairs runs through it and a side branch leaves it too: you come in
    // on one side, a ledge along the wall takes you round to the branch, and the stairs' side lies across the water.
    // The sluice is in the branch, which can only be reached through the flooded room.
    const parts = new Map(); // each door's side of the room: the start's, the stairs', or a branch (by the room it leads to)
    for (const d of r.doors) { const n = d.hall.A === r ? d.hall.B : d.hall.A; const seen = new Set([n]), q = [n]; while (q.length) { const a = q.shift(); for (const m of adj(a)) if (m !== r && !seen.has(m)) { seen.add(m); q.push(m); } } parts.set(d, seen.has(A.start) ? 'near' : seen.has(A.end) ? 'far' : seen); }
    const branches = [...parts.entries()].filter(([, v]) => v instanceof Set); if (!branches.length) continue;
    const GF = gateFree(A), hosts = branches.flatMap(([, v]) => [...v]).filter(hostOK(A)).filter(h => !GF || GF.has(h)); if (!hosts.length) continue; // (never behind a gate: 41_puzzles)
    const host = hosts.sort((a, b) => adj(a).length - adj(b).length || Math.random() - 0.5)[0];
    const far = new Set([...parts.entries()].filter(([, v]) => v === 'far').map(([d]) => d));
    const p = floodedWay(A, r, g, far); if (!p) continue;
    p.preReach = new Set([...reach(r), ...branches.flatMap(([, v]) => [...v])]); // (what can be reached before it drains: THE SUNKEN BUTTON, 36_works)
    r.set = 'flood'; A.sets.push('flood'); hostSluice(A, host, p);
    return true;
  } return false; };
  const tryBridge = () => { for (const r of shuffled(rooms.filter(r => (r === A.end && !r.shape || free(r) && !reach(r).has(A.end)) && r.w >= 9 && r.h >= 7))) if (drawbridge(A, r, g, reach(r), adj)) return true; return false; };
  // THE PUZZLES THAT STAND IN THE WAY: from the second floor every floor has one between you and the stairs, from the
  // third two (a flooded way, a drawbridge, one of each if they fit); the first floor may have a flooded way or not.
  // A floor that cannot take them is laid out again (30_arena buildArena).
  A.need = FORCE.set ? 0 : A.floor >= 3 ? 2 : A.floor === 2 ? 1 : 0;
  const musts = () => A.sets.filter(s => MUST_KINDS.has(s)).length;
  if (A.need) for (let k = 0; k < 4 && musts() < A.need; k++) {
    if ((PUZ.force || chance(0.5)) && puzzleTry(A, g)) continue; /* (the portcullis, the echoing runes, the weight, the gap, the spike gate: 41_puzzles) */ const order = A.sets.includes('flood') ? [tryBridge, tryFlood] : A.sets.includes('drawbridge') ? [tryFlood, tryBridge] : chance(0.5) ? [tryFlood, tryBridge] : [tryBridge, tryFlood]; if (!order[0]()) order[1](); }
  else if (FORCE.set || chance(ARCH.cur.water ? 0.9 : 0.55)) tryFlood();
  if (FORCE.set) tryBridge();
  if (FORCE.set || chance(0.45)) for (const r of shuffled(rooms.filter(r => free(r) && !r.offDoor && r.w >= 12 && r.h >= 8 && r.doors.length >= 2 && beyondHost(A, r)))) if (gauntlet(A, r, g)) { r.set = 'gauntlet'; A.sets.push('gauntlet'); remoteSluice(A, r, r.pool); break; }
  if (FORCE.set || chance(0.4)) for (const r of shuffled(rooms.filter(r => free(r) && r.w >= 11 && r.h >= 7 && beyondHost(A, r)))) if (sentinelPond(A, r, g)) { r.set = 'sentinel'; A.sets.push('sentinel'); remoteSluice(A, r, r.pool); break; }
  if (A.floor >= 4 && chance(0.4)) puzzleTry(A, g); // (deeper down, now and then one more)
  for (let i = 0; i < (ARCH.cur.puzzles || 0); i++) puzzleTry(A, g); // (THE LOCKED WAYS: 35_themes)
  secretPlan(A); // (cracked walls with niches behind them: 41_puzzles)
  A.musts = musts(); A.planning = false;
}
// THE DRAWBRIDGE: a chasm across a room the way down runs through (the end room, between its doors and the stairs, or a
// room on the way), wall to wall and two or three tiles wide, with no way over it. Its bridge (the sheet's wooden one, two
// tiles wide, fresh or green with age) is laid by a button in a room of its own: down a side branch that leaves this room
// on the near side of the chasm, so it is always found after the chasm (no such branch, no drawbridge here).
// Stepping on it takes the view to the chasm while the bridge goes across, plank by plank from the near side.
function drawbridge(A, r, g, near, adj) {
  const W = A.w, other = d => (d.hall.A === r ? d.hall.B : d.hall.A), nearDoors = r.doors.filter(d => near.has(other(d))); if (!nearDoors.length) return false;
  const toEnd = new Map([[A.end, 0]]), q = [A.end]; while (q.length) { const a = q.shift(); for (const n of adj(a)) if (!toEnd.has(n)) { toEnd.set(n, toEnd.get(a) + 1); q.push(n); } }
  // what must lie across it: the stairs (the end room), or the door on toward them
  const far = r === A.end ? [0, 1, 2].map(k => [r.stairX + k, r.iy0]) : r.doors.filter(d => !near.has(other(d)) && toEnd.get(other(d)) < toEnd.get(r)).flatMap(d => d.cells); if (!far.length) return false;
  const H = randi(2, 3), opts = [], sideRows = r.doors.filter(d => d.side === 'E' || d.side === 'W').flatMap(d => d.cells.map(c => c[1])), sideCols = r.doors.filter(d => d.side === 'N' || d.side === 'S').flatMap(d => d.cells.map(c => c[0])).concat(r === A.end ? [r.stairX, r.stairX + 1, r.stairX + 2] : []);
  for (let y = r.iy0 + 2; y + H - 1 <= r.iy1 - 2; y++) if (!sideRows.some(v => v >= y - 1 && v <= y + H)) opts.push({ v: false, at: y });
  for (let x = r.ix0 + 2; x + H - 1 <= r.ix1 - 2; x++) if (!sideCols.some(v => v >= x - 1 && v <= x + H)) opts.push({ v: true, at: x });
  const inside = i => { const x = i % W, y = (i / W) | 0; return x >= r.fx0 && x <= r.fx1 && y >= r.fy0 && y <= r.fy1; };
  for (const o of pitShuffle(opts)) {
    const band = new Set(); for (let k = 0; k < H; k++) for (let s = o.v ? r.iy0 : r.ix0; s <= (o.v ? r.iy1 : r.ix1); s++) band.add(o.v ? s * W + o.at + k : (o.at + k) * W + s);
    const open = i => inside(i) && FLOOR(A.fl[i]) && !band.has(i), fill = s => { const seen = new Set([s]), st = [s]; while (st.length) { const i = st.pop(); for (const j of [i - 1, i + 1, i - W, i + W]) if (!seen.has(j) && open(j)) { seen.add(j); st.push(j); } } return seen; };
    const [sx, sy] = nearDoors[0].cells[1], S = fill(sy * W + sx);
    if (!nearDoors.every(d => d.cells.some(([x, y]) => S.has(y * W + x))) || far.some(([x, y]) => S.has(y * W + x))) continue; // (the near doors together, the way on across)
    const F = fill(far[1][1] * W + far[1][0]); let lost = false; // (no floor cut off from both sides)
    for (let y = r.iy0; y <= r.iy1 && !lost; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (open(i) && !S.has(i) && !F.has(i)) { lost = true; break; } }
    if (lost) continue;
    const ends = b => [b, b + 1].every(s => { const [ax, ay, bx, by] = o.v ? [o.at - 1, s, o.at + H, s] : [s, o.at - 1, s, o.at + H]; return FLOOR(A.fl[ay * W + ax]) && FLOOR(A.fl[by * W + bx]); });
    const bs = []; for (let b = (o.v ? r.iy0 : r.ix0) + 1; b <= (o.v ? r.iy1 : r.ix1) - 2; b++) bs.push(b); const b = pitShuffle(bs).find(ends); if (b === undefined) continue;
    // the button's room: off a door of this room on the near side (a branch beyond it), never one passed before it
    const branch = new Set(); for (const d of r.doors) { if (near.has(other(d)) || !d.cells.some(([x, y]) => S.has(y * W + x))) continue; const seen = new Set([other(d)]), st = [other(d)]; while (st.length) { const a = st.pop(); for (const n of adj(a)) if (n !== r && !seen.has(n)) { seen.add(n); st.push(n); } } seen.forEach(h => branch.add(h)); }
    const GF = gateFree(A), ok = h => hostOK(A)(h) && (!GF || GF.has(h)), host = [...branch].filter(ok).sort((a, c) => adj(a).length - adj(c).length || Math.random() - 0.5)[0]; if (!host) continue; // (only beyond: the chasm is met before its button)
    for (const i of band) A.fl[i] = PIT; for (const i of band) pitPaint(A, g, i); A.pitN = (A.pitN || 0) + band.size;
    const cells = []; for (let k = 0; k < H; k++) for (const s of [b, b + 1]) cells.push(o.v ? [o.at + k, s] : [s, o.at + k]);
    const lowNear = o.v ? S.has(b * W + o.at - 1) : S.has((o.at - 1) * W + b); // (laid from the near side)
    const br = { drawbridge: true, room: r.i, travel: o.v ? 'ew' : 'ns', wood: pick(['orange', 'green']), cells, len: H, back: !lowNear, laid: 0, going: false, x0: o.v ? o.at : b, x1: o.v ? o.at + H - 1 : b + 1, y0: o.v ? b : o.at, y1: o.v ? b + 1 : o.at + H - 1 };
    br.runes = A.floor >= 2 && chance(0.4); // (laid by a button, or by the runes of a dark storeroom: 36_works)
    (A.bridges = A.bridges || []).push(br); r.set = 'drawbridge'; r.bridge = br; A.sets.push('drawbridge'); br.preReach = new Set([...near, ...branch]); hostSluice(A, host, br); // (preReach: THE SUNKEN BUTTON, 36_works)
    for (const [x, y] of cells) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) A.noProp.add((y + dy) * W + x + dx); // (nothing stands where it comes ashore)
    return true;
  }
  return false;
}
// Every body of water that drains has its sluice in another room, and the order is in the layout: the sluice is in a room
// that can only be reached through the water's own room (across the causeway, past the sentinel, round the cistern, or
// along the flooded way's ledge), so whoever finds it has met the water first. A piece only goes where such a room is.
const hostOK = A => h => h !== A.start && h.kind !== 'treasure' && h.kind !== 'shop' && !h.chest && !h.set && !h.sluice && !h.pool && !h.shrine && !h.puz && h.w >= 6;
function beyondHost(A, r, within = null) { // (within: only one of these rooms)
  const adj = q => A.halls.filter(h => h.A === q || h.B === q).map(h => (h.A === q ? h.B : h.A));
  if (r === A.start) return null; const near = new Set([A.start]), q = [A.start]; while (q.length) { const a = q.shift(); for (const n of adj(a)) if (n !== r && !near.has(n)) { near.add(n); q.push(n); } }
  const beyond = A.rooms.filter(h => h !== r && !near.has(h) && (!within || within.has(h))).filter(hostOK(A)).sort((a, b) => (adj(r).includes(a) ? 1 : 0) - (adj(r).includes(b) ? 1 : 0) || Math.random() - 0.5);
  return beyond[0] || null;
}
function remoteSluice(A, r, p) { const h = beyondHost(A, r); if (!h) return false; hostSluice(A, h, p); return true; }
function hostSluice(A, host, p) {
  host.sluice = p; p.host = host;
  if (A.planning && !A.sunkPlanned && !p.runes && !host.shape && host.w >= 12 && host.h >= 8 && chance(0.5)) { host.sunkHost = p; A.sunkPlanned = true; } // (its button sunk in a cistern made of this room: THE SUNKEN BUTTON, 36_works)
  // the outlet in the host's north wall, clear of its doors and stairs (furnish leaves it bare)
  const nd = host.doors.filter(d => d.side === 'N').flatMap(d => d.cells.map(c => c[0])), xs = [];
  for (let x = host.ix0 + 1; x <= host.ix1 - 1; x++) if (faceAt(A, x, host.fy0 + 1) && !nd.some(c => Math.abs(c - x) <= 3) && !(host.stairX !== undefined && x >= host.stairX - 2 && x <= host.stairX + 4) && !(host.crackX !== undefined && x >= host.crackX - 2 && x <= host.crackX + 4)) xs.push(x);
  host.sluiceX = xs.length ? pick(xs) : host.ix0 + 1;
}
// the bed, the grate in it, and what a drained body needs (where its whirl turns, where its coins lie)
function waterSet(A, r, cells, g, set, dual) {
  const W = wkOf(A), p = waterBody(A, cells, set, W, dual); p.room = r.i; (A.pools = A.pools || []).push(p); g.drawImage(p.bed, p.px0, p.py0);
  const cs = [...cells].map(i => [i % A.w, Math.floor(i / A.w)]), cx = (p.x0 + p.x1) / 2, cy = (p.y0 + p.y1) / 2;
  cs.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy)); p.drainAt = cs[0]; p.spots = cs.slice(1).sort(() => Math.random() - 0.5);
  const t = mkCanvas(TS, TS), tg = t.getContext('2d'), [br, bgc, bb] = W.basin; sheetTile(tg, W.drain, 0, 0);
  tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = `rgba(${br},${bgc},${bb},0.45)`; tg.fillRect(0, 0, TS, TS); g.drawImage(t, p.drainAt[0] * TS, p.drainAt[1] * TS);
  return p;
}
// the landing in front of each door, inside the room: its three cells and one either side, two deep
function landings(r) {
  const out = [];
  for (const d of r.doors) {
    const xs = d.cells.map(c => c[0]), ys = d.cells.map(c => c[1]), L = [];
    if (d.side === 'N' || d.side === 'S') { const y0 = d.side === 'N' ? r.iy0 : r.iy1 - 1; for (let y = y0; y <= y0 + 1; y++) for (let x = Math.min(...xs) - 1; x <= Math.max(...xs) + 1; x++) if (x >= r.ix0 && x <= r.ix1) L.push([x, y]); }
    else { const x0 = d.side === 'W' ? r.ix0 : r.ix1 - 1; for (let x = x0; x <= x0 + 1; x++) for (let y = Math.min(...ys) - 1; y <= Math.max(...ys) + 1; y++) if (y >= r.iy0 && y <= r.iy1) L.push([x, y]); }
    out.push(L);
  }
  return out;
}
function floodedWay(A, r, g, far) {
  // every landing; the near ones (and the branch's) joined by a ledge a tile wide along the wall, the long way round if the
  // short way passes the far side's landing; the far side's landing stands alone across the water
  const Ls = r.doors.map((d, k) => ({ d, cells: landings(r)[k], far: far.has(d) })), key = (x, y) => y * A.w + x, dry = new Set();
  for (const L of Ls) for (const [x, y] of L.cells) dry.add(key(x, y));
  const ring = []; for (let x = r.ix0; x <= r.ix1; x++) ring.push([x, r.iy0]); for (let y = r.iy0 + 1; y <= r.iy1; y++) ring.push([r.ix1, y]);
  for (let x = r.ix1 - 1; x >= r.ix0; x--) ring.push([x, r.iy1]); for (let y = r.iy1 - 1; y > r.iy0; y--) ring.push([r.ix0, y]);
  const farCells = Ls.filter(L => L.far).flatMap(L => L.cells), bad = ([x, y]) => farCells.some(([a, b]) => Math.max(Math.abs(a - x), Math.abs(b - y)) <= 1);
  const at = L => { const ks = new Set(L.cells.map(([x, y]) => key(x, y))); return ring.findIndex(([x, y]) => ks.has(key(x, y))); };
  const near = Ls.filter(L => !L.far).map(L => at(L)).filter(i => i >= 0).sort((a, b) => a - b);
  for (let k = 0; k + 1 < near.length; k++) {
    const i0 = near[k], i1 = near[k + 1], n = ring.length, arc = (a, b) => { const out = []; for (let i = a; i !== b; i = (i + 1) % n) out.push(ring[i]); out.push(ring[b]); return out; };
    const a1 = arc(i0, i1), a2 = arc(i1, i0), ok1 = !a1.some(bad), ok2 = !a2.some(bad), path = ok1 && (!ok2 || a1.length <= a2.length) ? a1 : ok2 ? a2 : null;
    if (!path) return null; for (const [x, y] of path) dry.add(key(x, y));
  }
  const cells = new Set(); for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) if (!dry.has(key(x, y))) cells.add(key(x, y));
  // the near side must hold together, and nothing of it may touch the far side's landing
  const start = Ls.find(L => !L.far), seen = new Set([key(...start.cells[0])]), q = [key(...start.cells[0])];
  while (q.length) { const c = q.pop(); for (const j of [c + 1, c - 1, c + A.w, c - A.w]) { const x = j % A.w, y = Math.floor(j / A.w); if (x < r.ix0 || x > r.ix1 || y < r.iy0 || y > r.iy1 || !dry.has(j) || seen.has(j)) continue; seen.add(j); q.push(j); } }
  if (Ls.some(L => !L.far && !L.cells.some(([x, y]) => seen.has(key(x, y)))) || farCells.some(([x, y]) => seen.has(key(x, y)))) return null;
  if (cells.size < 30) return null;
  const p = waterSet(A, r, cells, g, wkOf(A).square, false); p.flooded = true; p.rate = 2.6; r.pool = p; r.ledge = [...dry]; return p;
}
function gauntlet(A, r, g) {
  const ns = r.doors.find(d => d.side === 'N' || d.side === 'S'), ew = r.doors.find(d => d.side === 'E' || d.side === 'W');
  const vx = ns ? Math.min(...ns.cells.map(c => c[0])) : Math.round((r.ix0 + r.ix1) / 2) - 1, hy = ew ? Math.min(...ew.cells.map(c => c[1])) : Math.round((r.iy0 + r.iy1) / 2) - 1;
  const way = new Set(), add = (x, y) => { if (x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1) way.add(y * A.w + x); };
  const sides = new Set(r.doors.map(d => d.side));
  // the arms the doors need, three wide like the corridors, meeting where the corridors would cross
  for (let x = vx; x <= vx + 2; x++) { if (sides.has('N')) for (let y = r.iy0; y <= hy + 2; y++) add(x, y); if (sides.has('S')) for (let y = hy; y <= r.iy1; y++) add(x, y); }
  for (let y = hy; y <= hy + 2; y++) { if (sides.has('W')) for (let x = r.ix0; x <= vx + 2; x++) add(x, y); if (sides.has('E')) for (let x = vx; x <= r.ix1; x++) add(x, y); }
  const near = (x, y, m) => { for (let dy = -m; dy <= m; dy++) for (let dx = -m; dx <= m; dx++) if (way.has((y + dy) * A.w + x + dx)) return true; return false; };
  // islands: two tiles square, two tiles of water at least between them and the causeway, archers on them
  const isl = [], taken = new Set(), want = clamp(1 + Math.floor(A.floor / 2), 1, 3), cands = [];
  for (let y = r.iy0 + 1; y <= r.iy1 - 2; y++) for (let x = r.ix0 + 1; x <= r.ix1 - 2; x++) { const d = Math.min(...[...way].map(i => Math.max(Math.abs(i % A.w - x - 0.5), Math.abs(Math.floor(i / A.w) - y - 0.5)))); if (!near(x, y, 3) && !near(x + 1, y + 1, 3) && !near(x + 1, y, 3) && !near(x, y + 1, 3) && d <= 7) cands.push([x, y, d]); } // (two tiles of water at least between: out of reach of a spear)
  for (const [x, y] of cands.sort(() => Math.random() - 0.5)) {
    if (isl.length >= want) break; if ([[0, 0], [1, 0], [0, 1], [1, 1]].some(([a, b]) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (taken.has((y + b + dy) * A.w + x + a + dx)) return true; return false; })) continue;
    isl.push([x, y]); for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) taken.add((y + b) * A.w + x + a);
  }
  if (!isl.length) return false;
  const cells = new Set(); for (let y = r.iy0; y <= r.iy1; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * A.w + x; if (!way.has(i) && !taken.has(i)) cells.add(i); }
  if (cells.size < 30) return false;
  const p = waterSet(A, r, cells, g, wkOf(A).square, false); p.gauntlet = true; r.pool = p; r.islands = isl; r.way = way; r.wayAt = [vx + 1, hy + 1]; return true;
}
function sentinelPond(A, r, g) {
  // a pond five tiles square anywhere in the room that leaves every door in reach of every other, an island in its middle
  // (two tiles of water all round it: out of reach of any blade)
  const Ls = landings(r), doorAt = Ls.map(L => L[Math.floor(L.length / 2)]);
  for (let k = 0; k < 24; k++) {
    const w = 5, h = 5, x0 = randi(r.ix0 + 1, r.ix1 - w), y0 = randi(r.iy0 + 1, r.iy1 - h); if (x0 < r.ix0 + 1 || y0 < r.iy0 + 1) continue;
    const ix = x0 + 2, iy = y0 + 2, cells = new Set(); for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (!(x === ix && y === iy)) cells.add(y * A.w + x);
    if ([...cells].some(i => A.fl[i] !== 1) || Ls.flat().some(([x, y]) => cells.has(y * A.w + x))) continue;
    // every door still reaches every other round it
    const seen = new Set([doorAt[0][1] * A.w + doorAt[0][0]]), q = [doorAt[0][1] * A.w + doorAt[0][0]];
    while (q.length) { const i = q.pop(), x = i % A.w, y = Math.floor(i / A.w); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + a, Y = y + b, j = Y * A.w + X; if (X < r.ix0 || X > r.ix1 || Y < r.iy0 || Y > r.iy1 || seen.has(j) || cells.has(j) || (X === ix && Y === iy)) continue; seen.add(j); q.push(j); } }
    if (!doorAt.every(([x, y]) => seen.has(y * A.w + x))) continue;
    const p = waterSet(A, r, cells, g, chance(0.6) ? wkOf(A).round : wkOf(A).deep, true); p.sentinel = true; r.pool = p; r.islands = [[ix, iy]]; r.lone = true;
    // its sluice: a plate on the floor beside the pond, on the side toward the room's middle
    const sx = x0 + w / 2 < (r.ix0 + r.ix1) / 2 ? x0 + w : x0 - 1; r.pondPlate = [sx, iy]; return true;
  }
  return false;
}
// a remote button's place, half the time: standing free in its room, on bare floor two tiles in from the walls, clear of
// the doors, the stairs, spikes and anything standing there (null: before the outlet grate in the north wall, as before)
function freeSpot(A, r) {
  if (!chance(0.5)) return null; const ok = [];
  for (let y = r.iy0 + 2; y <= r.iy1 - 2; y++) for (let x = r.ix0 + 2; x <= r.ix1 - 2; x++) {
    if (!FLOOR(A.fl[y * A.w + x]) || r.doors.some(d => d.cells.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 4))) continue;
    if (r.stairX !== undefined && x >= r.stairX - 1 && x <= r.stairX + 3 && y <= r.iy0 + 2) continue;
    if ((A.spikes || []).some(s => Math.abs(s.tx - x) <= 1 && Math.abs(s.ty - y) <= 1) || (A.plates || []).some(p => Math.abs(p.tx - x) <= 2 && Math.abs(p.ty - y) <= 2)) continue;
    if (A.props.some(q => !q.dead && Math.abs(q.x - (x * TS + 8)) < 24 && Math.abs(q.cy - (y * TS + 10)) < 22)) continue;
    ok.push([x, y]);
  }
  return ok.length ? pick(ok) : null;
}
// ---- after the rooms are furnished: the plates, the outlet, the flooded pillars and the things standing in the water
function levelAfter(A, r) {
  let sunk = null; const W = wkOf(A), plate = (tx, ty, p, o = {}) => { A.plates = A.plates || []; A.plates.push(Object.assign({ x: tx * TS + 8, y: ty * TS + 8, tx, ty, tile: W.plate, f: 0, down: false, pool: p, room: r.i }, o)); };
  const clear = (tx, ty) => removeIf(A.props, q => Math.abs(q.x - (tx * TS + 8)) < 14 && Math.abs(q.cy - (ty * TS + 10)) < 14);
  // (a drawbridge's room: r.sluice is the bridge, marked drawbridge; a cistern's water has a .bridge of its own, its walkway)
  if (r.sluice && r.sunkHost === r.sluice && r.pool && (sunk = r.pool.sunkAt)) plate(sunk[0], sunk[1], r.sluice.drawbridge ? null : r.sluice, { remote: true, bridge: r.sluice.drawbridge ? r.sluice : null, sunken: r.pool }); // its button sunk in this cistern's floor (THE SUNKEN BUTTON, 36_works)
  else if (r.sluice && r.sluice.drawbridge && r.sluice.runes) { const v = { blocks: [], open: false, t: 0, room: r.i, runes: [], bridge: r.sluice, dark: true }; (A.vaults = A.vaults || []).push(v); placeRunes(A, r, v); hideRunes(A, r, v); darkRoom(A, r); } // a drawbridge laid by three hidden runes (36_works)
  else if (r.sluice && r.sluice.drawbridge) { const [px, py] = freeSpot(A, r) || [r.sluiceX, r.iy0]; if (py === r.iy0) clear(px, py); plate(px, py, null, { remote: true, bridge: r.sluice }); } // a drawbridge's button
  else if (r.sluice) { // the outlet grate in the north wall, the plate before it, or standing free in the room
    const x = r.sluiceX, wy = A.th === THEMES.brown ? 3 : 0; tileAt(A.g, 19, 3 + wy, x * TS, (r.fy0 + 1) * TS);
    const [px, py] = freeSpot(A, r) || [x, r.iy0]; if (py === r.iy0) clear(px, py);
    plate(px, py, r.sluice, { remote: true, outlet: { x: x * TS + 8, y: (r.fy0 + 1) * TS + 11 } });
  }
  if (r.set === 'flood') sinkThings(A, r.pool, randi(2, 3));
  if (r.set === 'gauntlet') {
    const p = r.pool, way = r.way; if (!p.host) { clear(r.wayAt[0], r.wayAt[1]); plate(r.wayAt[0], r.wayAt[1], p); } // (only if no other room could take its sluice)
    // flooded pillars beside the causeway, a few tiles apart: cover from the islands
    const spots = []; for (const i of p.cells) { const x = i % A.w, y = Math.floor(i / A.w); if (y - 1 < p.y0 || !p.cells.has((y - 1) * A.w + x)) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => way.has((y + b) * A.w + x + a))) spots.push([x, y]); }
    const put = []; for (const [x, y] of spots.sort(() => Math.random() - 0.5)) { if (put.length >= 3) break; if (put.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 4)) continue; if (r.islands.some(([a, b]) => x >= a - 1 && x <= a + 2 && y >= b - 1 && y <= b + 2)) continue; put.push([x, y]); }
    for (const [x, y] of put) A.props.push({ kind: 'wetpillar', tile: W.wetPillar, wetTile: W.wetPillar, dry: W.dryPillar, sunk: p, th: 2, x: x * TS + 8, y: y * TS + 14, cy: y * TS + 10, r: 6, solid: true, hp: 1e9, room: r.i });
    sinkThings(A, p, randi(1, 2));
  }
  if (r.set === 'sentinel' && !r.pool.host) { const [x, y] = r.pondPlate; if (FLOOR(A.fl[y * A.w + x])) { clear(x, y); plate(x, y, r.pool); } }
}
// ---- an arrow in each room's floor, toward the door that leads on to the stairs (the sheet's arrow slabs: grey
// [10..13, 8], brown [10..13, 0]: down, left, right, up), on a free tile near the middle of the room
function wayArrows(A, g) {
  const adj = q => A.halls.filter(h => h.A === q || h.B === q).map(h => (h.A === q ? h.B : h.A));
  const d = new Map([[A.end, 0]]), q = [A.end]; while (q.length) { const a = q.shift(); for (const n of adj(a)) if (!d.has(n)) { d.set(n, d.get(a) + 1); q.push(n); } }
  const row = A.th.floors[0][1] - 1, COL = { S: 10, W: 11, E: 12, N: 13 };
  for (const r of A.rooms) {
    if (r === A.end || r.kind === 'shop' || !d.has(r)) continue; const next = adj(r).find(n => d.get(n) === d.get(r) - 1); if (!next) continue;
    const door = r.doors.find(dd => dd.hall && (dd.hall.A === next || dd.hall.B === next)); if (!door) continue;
    const cx = (r.ix0 + r.ix1) / 2, cy = (r.iy0 + r.iy1) / 2, cands = [];
    for (let y = r.iy0 + 1; y <= r.iy1 - 1; y++) for (let x = r.ix0 + 1; x <= r.ix1 - 1; x++) cands.push([x, y, Math.hypot(x - cx, (y - cy) * 1.3)]);
    cands.sort((a, b) => a[2] - b[2]);
    const free = (x, y) => A.fl[y * A.w + x] === 1 && !(A.basin && A.basin[y * A.w + x]) && !(A.crumbles || []).some(c => c.i === y * A.w + x) && !(r.pool && r.pool.cells.has(y * A.w + x))
      && !A.props.some(p => !p.dead && Math.abs(p.x - (x * TS + 8)) < 16 && p.y > y * TS && p.y < (y + 2) * TS + 6)
      && !(A.plates || []).some(p => p.tx === x && p.ty === y) && !(A.runes || []).some(p => p.tx === x && p.ty === y) && !(r.inlay || []).some(([a, b]) => x >= a && x <= a + 1 && y >= b && y <= b + 1);
    const at = cands.find(([x, y]) => free(x, y)); if (at) tileAt(g, COL[door.side], row, at[0] * TS, at[1] * TS);
  }
}
// ---- the corridors: some barricaded across with wooden furniture (it all breaks: smash a way through), some cluttered
// along both sides with the middle lane left clear, and smashed crates lying about on their floors. The sheet's wood:
// crates [25..26, 12], [24..26, 13]; crate stacks two high [27..29, 12]; pots [24..27, 8]; mine carts [30..31, 12..15];
// a heap of pots two wide [22, 8]; the crates intact in row 10 and smashed in rows 9 and 11 ([24..28, 9..11], [31, 9..11]).
const FURN = {
  crate: [[25, 12], [26, 12], [24, 13], [25, 13], [26, 13], [24, 10], [25, 10], [26, 10], [27, 10], [28, 10], [31, 10]],
  stack: [[27, 12], [28, 12], [29, 12]], pot: [[24, 8], [25, 8], [26, 8], [27, 8]], cart: [[30, 12], [31, 12], [30, 13], [31, 13], [30, 14], [31, 14], [30, 15], [31, 15]],
  junk: [[24, 9], [24, 11], [25, 9], [25, 11], [26, 9], [26, 11], [27, 9], [27, 11], [28, 9], [28, 11], [31, 9], [31, 11]],
};
function corridorWood(A, g) {
  const put = (kind, t, tx, ty, th = 1) => A.props.push({ kind, tile: t, th, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 5, solid: true, hp: 40, hall: true });
  const spiky = (x, y) => (A.spikes || []).some(s => s.tx === x && s.ty === y);
  // a smashed crate: still a heap of wood in the way (it takes a blow to clear)
  const junkAt = (x, y) => { if (spiky(x, y) || A.props.some(q => !q.dead && Math.abs(q.x - (x * TS + 8)) < 14 && Math.abs(q.cy - (y * TS + 10)) < 14)) return; put('crate', pick(FURN.junk), x, y); };
  for (const hl of A.halls) {
    // its own floor: across the door cells' rows (or columns), from a tile past the one wall to a tile short of the other
    if (hl.A.kind === 'shop' || hl.B.kind === 'shop' || hl.bent || hl.hidden) continue; // (the way to the shop is kept clear; a bent corridor too, and a hidden one)
    if (hl.wide) { hallColumns(A, hl); continue; } // (a gallery: columns down its middle)
    const h = hl.dir === 'h', a0 = h ? hl.x0 + 1 : hl.y0 + 1, a1 = h ? hl.x1 - 1 : hl.B.fy0 - 1, len = a1 - a0 + 1; if (len < 3) continue;
    const at = (k, lane) => (h ? [k, hl.y0 + lane] : [hl.x0 + lane, k]);
    const roll = Math.random();
    if (roll < 0.22 && len >= 4) { // a barricade across it, somewhere along the middle
      const k = randi(a0 + 1, a1 - 1); if ([0, 1, 2].some(l => spiky(...at(k, l)))) continue;
      const style = pick(['carts', 'crates', 'mixed']);
      for (let l = 0; l < (h ? 4 : 3); l++) { // (across a corridor running east and west, its south wall's row too: floor behind the wall, 31_walls)
        const [x, y] = at(k, l), w = style === 'carts' ? ['cart', pick(FURN.cart)] : style === 'crates' ? ['crate', pick(FURN.crate)] : pick([['cart', pick(FURN.cart)], ['crate', pick(FURN.crate)], ['barrel', pick(FURN.pot)]]);
        if (!h && l !== 1 && chance(0.4)) put('crate', pick(FURN.stack), x, y, 2); else put(w[0] === 'cart' ? 'crate' : w[0], w[1], x, y);
      }
      for (let i = 0; i < randi(1, 3); i++) junkAt(...at(randi(a0, a1), chance(0.5) ? 0 : 2)); // smashed crates about it
    } else if (roll < 0.57) { // cluttered: things along both sides, the middle lane clear
      for (let k = a0; k <= a1; k++) {
        if (!chance(0.38)) continue; const lane = chance(0.5) ? 0 : 2, [x, y] = at(k, lane); if (spiky(x, y)) continue;
        if (A.props.some(q => !q.dead && Math.abs(q.x - (x * TS + 8)) < 16 && Math.abs(q.cy - (y * TS + 10)) < 16)) continue;
        const t = Math.random(); if (t < 0.4) put('crate', pick(FURN.crate), x, y); else if (t < 0.65) put('barrel', pick(FURN.pot), x, y); else if (t < 0.85) put('crate', pick(FURN.cart), x, y); else if (h && lane === 0 || !h) put('crate', pick(FURN.stack), x, y, 2); else put('crate', pick(FURN.crate), x, y);
      }
      for (let i = 0; i < randi(1, 3); i++) junkAt(...at(randi(a0, a1), chance(0.5) ? 0 : 2));
    } else if (roll < 0.75) for (let i = 0; i < randi(1, 2); i++) junkAt(...at(randi(a0, a1), chance(0.5) ? 0 : 2)); // only a smashed crate or two
  }
}
// ---- who stands in them: archers on the islands (turrets while the water is up); nobody in the flooded way yet
function levelFoes(A, f) {
  const out = [];
  for (const r of A.rooms) {
    if (!r.islands) continue;
    for (const [x, y] of r.islands) {
      const u = mkFoe('archer', f, (x + (r.lone ? 0.5 : 1)) * TS, (y + (r.lone ? 0.5 : 1)) * TS + 2); u.turret = r.pool; u.room = r.i; out.push(u);
    }
  }
  for (const r of A.rooms) if (r.pitGuard) { const u = mkFoe('brute', f, r.pitGuard[0], r.pitGuard[1]); u.room = r.i; out.push(u); } // a brute standing guard on a chasm's bridge, or on the ledges' platform (38_pits)
  return out;
}
// an archer on an island while the water is up: it stands, turns and shoots whatever it can see and reach
function turretMind(f, t, dt, d, sees) {
  const T = f.def; faceTo(f, angTo(f.x, f.y, t.x, t.y)); holdStill(f, dt);
  if (f.cdT <= 0 && sees && d < T.keep[1] + 90 && clearShot(f, t)) f.act = { k: 'aim', t: 0, dur: T.shot.aim, dir: angTo(f.x, f.y, t.x, t.y) };
}
// ---- the sluice: the plate goes down, and the view goes to the water it lets out
function startCine(pl) {
  const p = pl.pool; if (pl.cined) return; pl.cined = true;
  const cx = (p.x0 + p.x1 + 1) / 2 * TS, cy = (p.y0 + p.y1 + 1) / 2 * TS;
  G.cine = { x: cx, y: cy, t: 0, pool: p, pl };
  G.eyes = [{ x: cx, y: cy + 4, lightR: Math.max(p.x1 - p.x0 + 1, p.y1 - p.y0 + 1) * 10 + 40, eyeR: Math.max(p.x1 - p.x0, p.y1 - p.y0) / 2 + 4, dead: false, hush: 1, dir: 0 }];
  SFX.stone(panOf(pl.x), true); shake(0.15);
  if (pl.outlet) for (let i = 0; i < 18; i++) water(pl.outlet.x + rand(-3, 3), pl.outlet.y, 6, rand(-30, 30), rand(10, 40), rand(10, 50)); // a gush from the outlet
}
function startBridgeCine(pl) { // (pl: the button, or where the last rune was)
  const br = pl.bridge; if (br.going) return; br.going = true; const cx = (br.x0 + br.x1 + 1) / 2 * TS, cy = (br.y0 + br.y1 + 1) / 2 * TS;
  G.cine = { x: cx, y: cy, t: 0, bridge: br, pl }; G.eyes = [{ x: cx, y: cy + 4, lightR: 90, eyeR: 7, dead: false, hush: 1, dir: 0 }];
  SFX.stone(panOf(pl.x), true); shake(0.12);
}
// one plank of a drawbridge down, from the near side (strip j counted from the bridge's low end); a tile with both its
// planks down can be walked
function layPlank(br, quiet) {
  const A = ARENA, n = br.len * 2, k = br.laid++, j = br.back ? n - 1 - k : k, ew = br.travel === 'ew', t = j >> 1;
  const x = br.x0 * TS + (ew ? j * 8 : 0), y = br.y0 * TS + (ew ? 0 : j * 8), cells = ew ? [[br.x0 + t, br.y0], [br.x0 + t, br.y1]] : [[br.x0, br.y0 + t], [br.x1, br.y0 + t]];
  for (const [cx, cy] of cells) A.plankSet.add(cy * A.w + cx);
  groundPaint(x, y, x + (ew ? 8 : 32), y + (ew ? 32 : 8), gg => plankStrip(gg, br.travel, br.wood, j, x, y));
  if (k % 2) { for (const [cx, cy] of cells) A.fl[cy * A.w + cx] = 1; A.flv = (A.flv || 0) + 1; }
  if (!quiet) { const mx = x + (ew ? 4 : 16), my = y + (ew ? 16 : 4); SFX.wood(panOf(mx)); pebbles(mx, my, 4); smoke(mx, my, 1, 'dust', 5, 10, 0.6); shake(0.03); }
}
function bridgeCine(C, dt) {
  const br = C.bridge, n = br.len * 2; updateSight(dt); updateProj(0);
  while (br.laid < n && C.t > 0.8 + br.laid * 0.14) layPlank(br);
  if (br.laid >= n && C.endT === undefined) { C.endT = C.t; SFX.stone(panOf(C.x), false); }
  const I = G.me && G.me.inp, skip = C.t > 1 && I && (I.atkP || I.dodgeP);
  if (skip) { while (br.laid < n) layPlank(br, true); I.atkP = I.dodgeP = I.atkR = false; }
  if (skip || (C.endT !== undefined && C.t - C.endT > 1.1)) { G.cine = null; G.eyes = null; }
}
function cineTick(dt) {
  const C = G.cine; C.t += dt; if (C.bridge) { bridgeCine(C, dt); return; } if (C.gate) { gateCine(C, dt); return; } if (C.echo) { echoCine(C, dt); return; } const p = C.pool;
  if (C.t > 0.8 && !p.drain) startDrain(p);
  worksTick(dt); updateSight(dt); updateProj(0);
  for (const f of G.foes) if (f.drowned) foeTick(f, dt); // (the drowned settle where they lie)
  if (p.drain === 2 && C.endT === undefined) C.endT = C.t;
  const I = G.me && G.me.inp, skip = C.t > 1 && I && (I.atkP || I.dodgeP);
  if (skip || (C.endT !== undefined && C.t - C.endT > 1.3)) {
    if (skip) { if (!p.drain) startDrain(p); if (p.drain === 1) { p.level = 0; if (!p.dried) dryOut(p); endDrain(p); } I.atkP = I.dodgeP = I.atkR = false; }
    G.cine = null; G.eyes = null;
  }
}
// ---- the drowned: when the flooded way drains, the dead it held lie in the mud, heads up; they climb out when anyone comes near
const DROWNED = ['DecrepitBones', 'MutilatedStumbler'];
function drownedRise(A, p) {
  const r = A.rooms[p.room], Ls = landings(r).flat(), n = clamp(3 + Math.floor(A.floor / 2), 3, 6), spots = [];
  const ok = (x, y) => Ls.every(([a, b]) => Math.max(Math.abs(a - x), Math.abs(b - y)) >= 3) && spots.every(([a, b]) => Math.hypot(a - x, b - y) >= 1.6) && !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < 14 && Math.abs(q.cy - (y * TS + 10)) < 14);
  for (const i of [...p.cells].sort(() => Math.random() - 0.5)) { if (spots.length >= n) break; const x = i % A.w, y = Math.floor(i / A.w); if (A.fl[i] === 1 && ok(x, y)) spots.push([x, y]); }
  for (const [x, y] of spots) {
    const pool = (ARMIES.bones && ARMIES.bones.grunt.length ? ARMIES.bones.grunt : []).concat(ARMIES.rot && ARMIES.rot.grunt.length ? ARMIES.rot.grunt : []).filter(s => MOBS[s]);
    const u = mkFoe('grunt', G.floor, x * TS + 8 + rand(-3, 3), y * TS + 10, pick(pool.length ? pool : DROWNED.filter(s => MOBS[s])));
    Object.assign(u, { dormant: true, drowned: true, z: -11, room: r.i, face: chance(0.5) ? 1 : -1 }); G.foes.push(u); G.units.push(u);
    debris(u.x, u.y, 4, ['#3e3026', '#5a4636'], 30, 40, 1); // the mud settling round it
  }
}
function dormantTick(f, dt) {
  f.vx = f.vy = 0; f.moving = false; f.z = Math.min(f.z, -11);
  const h = nearest(f, G.heroes.filter(alive)); if (!h || G.cine) return;
  if (f.aware || f.alarmT > 0 || dist(h.x, h.y, f.x, f.y) < 56) {
    f.dormant = false; f.stun = 0.8; f.z = -11; debris(f.x, f.y, 10, ['#5a4636', '#7a604a', '#3e3026'], 60, 90, 1.4); smoke(f.x, f.y, 2, 'dust', 6, 12, 0.8);
    SFX.groan(panOf(f.x)); if (!f.aware) wakeFoe(f, h, 'noise');
    for (const o of G.foes) if (o.dormant && o !== f && dist(o.x, o.y, f.x, f.y) < 70) o.alarmT = rand(0.3, 0.9); // the rest stir
  }
}
// ---- the trickle from a sluice's outlet while its water is up: the hint that the plate under it does something
function levelTick(dt) {
  for (const d of G.drops) if (d.flop && d.z <= 0 && !d.dead && chance(dt * 1.4)) { d.vz = rand(35, 65); d.vx = rand(-18, 18); d.vy = rand(-8, 8); } // a fish out of water
  // an island's archer is watching the water: it sees anyone in its sight across it
  for (const f of G.foes) if (f.turret && !f.aware && !f.dead) { const h = G.heroes.find(h => alive(h) && dist(h.x, h.y, f.x, f.y) < 150 && lineOfSight(f.x, f.y - 4, h.x, h.y - 4)); if (h) wakeFoe(f, h, 'sight'); }
  for (const pl of ARENA.plates || []) if (pl.outlet && !pl.down && pl.pool && !pl.pool.drain && chance(dt * 5)) water(pl.outlet.x + rand(-2, 2), pl.outlet.y, 8, rand(-4, 4), rand(2, 8), 0);
}
// ---- the puzzle floor (kit screen): a run whose first floor holds every set piece that will fit
function beginPuzzleFloor(kit) {
  beginRun(kit); FORCE.set = true;
  for (let n = 0; n < 120; n++) { startFloor(); if (ARENA.sets.length >= (n < 90 ? 4 : 2)) break; }
  FORCE.set = false; G.card = { t: 0, life: 3.2, a: 'PUZZLE FLOOR', b: (ARENA.sets || []).map(s => ({ flood: 'THE FLOODED WAY', gauntlet: 'THE GAUNTLET', sentinel: 'THE SENTINEL', drawbridge: 'THE DRAWBRIDGE' })[s]).join('  ·  '), c: 'EVERY WATER HAS ITS SLUICE' };
}
