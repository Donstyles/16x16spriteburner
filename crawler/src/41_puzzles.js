// ===================== puzzles: gates and what opens them, stone blocks to push, the gap, spike gates, cracked walls =====================
// More puzzles that stand between you and the stairs (37_levels counts them with the flooded way and the drawbridge):
// - THE PORTCULLIS: the way on is shut by a gate (a blast door in a north doorway, a portcullis in a side one) and its
//   button is in a room of its own somewhere you can reach without it. Stepping on it takes the view to the gate as it
//   grinds up, chains rattling.
// - THE ECHOING RUNES: the gate's room before it holds three or four rune plates. Coming in, they light one after
//   another, each with its note: that is the order. Step on them in it and the gate opens; a wrong one and they all go
//   dark with a dull knock, and the order is shown again.
// - THE COLD BRAZIERS: the room before the gate is dark, and three or four braziers stand cold about it. Stand by one a
//   while (a second, and it starts to smoke; more than two, and it catches) and it lights; it burns thirty seconds, sputtering at the end, then goes out. All of
//   them burning at once and the gate opens.
// - THE WEIGHT: the gate stands open only while its plate (in the room before it, well away from the door) is pressed.
//   Stand on it and the gate rises; step off and it slams. A stone block stands in the room: push it onto the plate.
// - THE GAP: a cleft in the floor a tile wide (two, deeper down) across a room the way runs through, wall to wall, and
//   a stone block (two) on the near side. Push a block in and it drops and wedges: a stepping stone.
// - THE SPIKE GATE: a field of spikes across the corridor on, wall to wall, standing up and staying up. A plate in the
//   room before it, far from the corridor, drops them: a clock ticks, faster toward the end, the tips peek up a second
//   before they shoot up again. Run.
// - THE CRACKED WALL: a stretch of north wall with cracks in its bricks, a crumb dropping off it now and then. Three
//   blows break it (a heavy blow is three): behind it a niche, with a small chest worth the trouble, or the button of a
//   portcullis (THE HIDDEN LEVER).
// Stone blocks are pushed by walking into them a moment, a tile at a time, along the room's length or breadth; one left
// where it cannot help slides back to where it stood once nobody is in its room.
const PUZ = { force: null }; // (a test: this one kind, wherever it fits)
const MUST_KINDS = new Set(['flood', 'drawbridge', 'gate', 'gap', 'spikegate']);
const PUZ_NAMES = { gate: 'THE PORTCULLIS', echo: 'THE ECHOING RUNES', fires: 'THE COLD BRAZIERS', weight: 'THE WEIGHT', gap: 'THE GAP', spikegate: 'THE SPIKE GATE', crack: 'THE CRACKED WALL', lever: 'THE HIDDEN LEVER' };
const SPIKEGATE = { t: 7 };
// ---- the room graph
const puzAdj = (A, r) => A.halls.filter(h => h.A === r || h.B === r).map(h => (h.A === r ? h.B : h.A));
function puzReach(A, cut, free) { // rooms reachable from the start without the hall cut (free: nor through a room a set piece cuts in two, nor a gate)
  const barrier = r => free && (r.set === 'flood' || r.set === 'drawbridge' || r.set === 'gap'), seen = new Set([A.start]), q = [A.start];
  while (q.length) { const r = q.shift(); for (const h of A.halls) { if (h === cut || (h.A !== r && h.B !== r) || (free && (h.gate || h.spikeGate))) continue; const n = h.A === r ? h.B : h.A; if (seen.has(n) || barrier(n)) continue; seen.add(n); q.push(n); } }
  return seen;
}
// what can be reached before any gate is opened (a set piece's sluice or button is never put behind one: 37_levels), or
// null while the floor has no gates
const gateFree = A => A.gates && A.gates.length ? puzReach(A, null, true) : null;
// the corridors the way down must pass through (none of them is part of a loop)
function critHalls(A) { return A.halls.filter(h => h.A.kind !== 'shop' && h.B.kind !== 'shop' && !h.gate && !h.spikeGate && !puzReach(A, h, false).has(A.end)); }
const puzRoomOK = r => r && r.kind !== 'shop' && r.kind !== 'end' && !r.set && !r.pool && !r.shrine && !r.puz && !r.sluice && !r.chest;
// ---- planning (37_levels levelPlan): one of the puzzles that stand in the way, wherever it fits
function puzzleTry(A, g) {
  const T = { gate: () => tryGate(A, 'lever'), echo: () => tryGate(A, 'echo'), fires: () => tryGate(A, 'fires'), weight: () => tryGate(A, 'weight'), gap: () => tryGap(A, g), spikegate: () => trySpikeGate(A) };
  const used = A.puzUsed = A.puzUsed || new Set(), ks = PUZ.force && T[PUZ.force] ? [PUZ.force] : pitShuffle(Object.keys(T)).sort((a, b) => used.has(a) - used.has(b)); // (a kind not yet on this floor first)
  for (const k of ks) if (T[k]()) { used.add(k); return true; } return false;
}
function tryGate(A, how) {
  for (const h of pitShuffle(critHalls(A))) {
    const near = puzReach(A, h, false), X = near.has(h.A) ? h.A : h.B; // (X: the room before the gate)
    let host = null;
    if (how === 'lever') host = pitShuffle([...puzReach(A, h, true)].filter(hostOK(A)).filter(r => r !== X || chance(0.3)))[0];
    else host = puzRoomOK(X) && !X.shape && X.w >= 10 && X.h >= 7 && (how !== 'weight' || X !== A.start) ? X : null;
    if (!host) continue;
    const g = makeGate(A, h, near); if (!g) continue;
    g.how = how; host.puz = how; host.gateOf = g; g.host = host; A.sets.push('gate'); (A.puzNames = A.puzNames || []).push(PUZ_NAMES[how === 'lever' ? 'gate' : how]);
    if (how === 'weight') g.hold = true;
    return true;
  }
  return false;
}
// ---- the gates
function makeGate(A, h, near) {
  const d = h.dir === 'v' ? h.B.doors.find(q => q.hall === h) : (near.has(h.A) ? h.B : h.A).doors.find(q => q.hall === h); if (!d) return null;
  const g = { d, hall: h, k: 1, target: 1, going: false }; h.gate = g; d.gate = g; (A.gates = A.gates || []).push(g); gateShut(A, g, true); d.k = 1; return g;
}
function gateCells(A, g) { const d = g.d, out = d.cells.map(([x, y]) => y * A.w + x); if (d.side === 'N') for (const [x, y] of d.cells) out.push((y - 1) * A.w + x); return out; }
// shut, its cells are rock (and a side doorway's row behind the south wall, where it crosses the doorway); open, floor again
function gateShut(A, g, shut) {
  const d = g.d; for (const i of gateCells(A, g)) A.fl[i] = shut ? 0 : 1;
  if (d.side === 'E' || d.side === 'W') { const x = d.cells[0][0], y = Math.max(...d.cells.map(c => c[1])) + 1, i = y * A.w + x; if (shut) { if (!g.wt) g.wt = [i, A.wt[i]]; A.wt[i] = 0; } else if (g.wt) A.wt[i] = g.wt[1]; }
  g.shut = shut; A.flv = (A.flv || 0) + 1;
}
const gatePos = g => { const c = g.d.cells[1]; return [c[0] * TS + 8, c[1] * TS + (g.d.side === 'N' ? 0 : 8)]; };
function gatesTick(A, dt) {
  for (const g of A.gates || []) {
    if (g.hold) g.target = g.held ? 0 : 1; const was = g.k, [gx, gy] = gatePos(g), pan = panOf(gx);
    if (g.k > g.target) g.k = Math.max(g.target, g.k - dt / 1.3); else if (g.k < g.target) g.k = Math.min(g.target, g.k + dt / 0.3);
    if (g.k < 0.5 && g.shut) gateShut(A, g, false);
    if (g.k >= 0.5 && !g.shut) { // (it never comes down on anyone: it waits)
      const cs = gateCells(A, g).map(i => [(i % A.w) * TS, Math.floor(i / A.w) * TS]);
      if (G.units.some(u => !u.dead && cs.some(([x, y]) => u.x > x - 5 && u.x < x + TS + 5 && u.y > y - 3 && u.y < y + TS + 4))) g.k = 0.49; else { gateShut(A, g, true); shake(0.06); SFX.stone(pan, true); smoke(gx, gy + 6, 3, 'dust', 8, 16, 0.8); }
    }
    if (g.k !== was) { if ((g.chT = (g.chT || 0) - dt) <= 0) { g.chT = rand(0.05, 0.1); SFX.clink(rand(1500, 2600), 0.05, pan, 0); } if (was === 1 || was === 0) SFX.stone(pan, false); if (g.k === 0 && was > 0) { SFX.stone(pan, true); smoke(gx, gy, 2, 'dust', 6, 10, 0.6); } }
    g.d.k = g.k;
  }
}
// a remote button: the view goes to the gate while it grinds up (37_levels cineTick)
function startGateCine(pl, g) {
  if (g.going) return; g.going = true; const [x, y] = gatePos(g);
  G.cine = { x, y, t: 0, gate: g, pl }; G.eyes = [{ x, y: y + 6, lightR: 90, eyeR: 7, dead: false, hush: 1, dir: 0 }]; SFX.stone(panOf(pl.x), true); shake(0.1);
}
function gateCine(C, dt) {
  const g = C.gate; updateSight(dt); updateProj(0); if (C.t > 0.7) g.target = 0; gatesTick(ARENA, dt);
  if (g.k <= 0 && C.endT === undefined) C.endT = C.t;
  const I = G.me && G.me.inp, skip = C.t > 1 && I && (I.atkP || I.dodgeP);
  if (skip) { g.target = 0; g.k = 0; gatesTick(ARENA, 0); I.atkP = I.dodgeP = I.atkR = false; }
  if (skip || (C.endT !== undefined && C.t - C.endT > 0.9)) { G.cine = null; G.eyes = null; }
}
// ---- THE GAP: a cleft a tile wide (two, from the fourth floor) across a room the way runs through
function tryGap(A, g) {
  const W = A.w;
  for (const r of pitShuffle(A.rooms.filter(q => q.kind === 'room' && puzRoomOK(q) && !q.shape && q.w >= 9 && q.h >= 7))) {
    const near = puzReach(A, null, false), toEnd = new Map([[A.end, 0]]), q = [A.end]; while (q.length) { const a = q.shift(); for (const n of puzAdj(A, a)) if (!toEnd.has(n)) { toEnd.set(n, toEnd.get(a) + 1); q.push(n); } }
    const other = d => (d.hall.A === r ? d.hall.B : d.hall.A); if (!near.has(r)) continue;
    // its near doors: toward the start; far: toward the stairs
    const dist0 = new Map([[A.start, 0]]), q0 = [A.start]; while (q0.length) { const a = q0.shift(); for (const n of puzAdj(A, a)) if (!dist0.has(n)) { dist0.set(n, dist0.get(a) + 1); q0.push(n); } }
    const nearDoors = r.doors.filter(d => dist0.get(other(d)) < dist0.get(r)), farDoors = r.doors.filter(d => toEnd.get(other(d)) < toEnd.get(r)); if (!nearDoors.length || !farDoors.length) continue;
    const H = A.floor >= 4 ? 2 : 1, opts = [], sideRows = r.doors.filter(d => d.side === 'E' || d.side === 'W').flatMap(d => d.cells.map(c => c[1])), sideCols = r.doors.filter(d => d.side === 'N' || d.side === 'S').flatMap(d => d.cells.map(c => c[0]));
    for (let y = r.iy0 + 3; y + H - 1 <= r.iy1 - 2; y++) if (!sideRows.some(v => v >= y - 1 && v <= y + H)) opts.push({ v: false, at: y });
    for (let x = r.ix0 + 4; x + H - 1 <= r.ix1 - 4; x++) if (!sideCols.some(v => v >= x - 1 && v <= x + H)) opts.push({ v: true, at: x });
    const inside = i => { const x = i % W, y = (i / W) | 0; return x >= r.ix0 && x <= r.ix1 && y >= r.iy0 && y <= r.iy1; };
    for (const o of pitShuffle(opts)) {
      const band = new Set(); for (let k = 0; k < H; k++) for (let s = o.v ? r.iy0 : r.ix0; s <= (o.v ? r.iy1 : r.ix1); s++) band.add(o.v ? s * W + o.at + k : (o.at + k) * W + s);
      const open = i => inside(i) && FLOOR(A.fl[i]) && !band.has(i), fill = s => { const seen = new Set([s]), st = [s]; while (st.length) { const i = st.pop(); for (const j of [i - 1, i + 1, i - W, i + W]) if (!seen.has(j) && open(j)) { seen.add(j); st.push(j); } } return seen; };
      const inCell = d => { const [x, y] = d.cells[1]; return d.side === 'N' ? (y + 1) * W + x : d.side === 'S' ? (y - 1) * W + x : d.side === 'W' ? y * W + x + 1 : y * W + x - 1; };
      const S = fill(inCell(nearDoors[0])); if (!nearDoors.every(d => S.has(inCell(d))) || farDoors.some(d => S.has(inCell(d)))) continue;
      const F = fill(inCell(farDoors[0])); let lost = false; for (let y = r.iy0; y <= r.iy1 && !lost; y++) for (let x = r.ix0; x <= r.ix1; x++) { const i = y * W + x; if (open(i) && !S.has(i) && !F.has(i)) { lost = true; break; } } if (lost) continue;
      // the blocks: on the near side, in line with the cleft, two to four tiles from it, with floor behind them to push from
      const side = S.has(o.v ? r.iy0 * W + o.at - 1 : (o.at - 1) * W + r.ix0) ? -1 : 1, lanes = [];
      for (let s = (o.v ? r.iy0 : r.ix0) + 1; s <= (o.v ? r.iy1 : r.ix1) - 1; s++) {
        const d0 = randi(2, 3), cell = k => { const a = side < 0 ? o.at - k : o.at + H - 1 + k; return o.v ? s * W + a : a * W + s; }; // (k tiles out from the cleft)
        let ok = true; for (let k = 1; k <= d0 + 1; k++) if (!S.has(cell(k))) { ok = false; break; } if (ok) lanes.push({ s, d0, cell: cell(d0), lane: Array.from({ length: d0 + 1 }, (_, k) => cell(k + 1)) });
      }
      const picks = []; for (const L of pitShuffle(lanes)) { if (picks.length >= H) break; if (picks.some(p => Math.abs(p.s - L.s) < 2)) continue; picks.push(L); } if (picks.length < H) continue;
      for (const i of band) A.fl[i] = PIT; for (const i of band) pitPaint(A, g, i); A.pitN = (A.pitN || 0) + band.size;
      for (const i of band) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) A.noProp.add(i + dy * W + dx);
      for (const p of picks) for (const i of p.lane) for (const j of [i, i - 1, i + 1, i - W, i + W]) A.noProp.add(j);
      r.set = 'gap'; r.puz = 'gap'; r.gap = { band, blocks: picks.map(p => [p.cell % W, (p.cell / W) | 0]), lanes: picks.flatMap(p => p.lane), v: o.v }; A.sets.push('gap'); (A.puzNames = A.puzNames || []).push(PUZ_NAMES.gap);
      return true;
    }
  }
  return false;
}
// ---- THE SPIKE GATE: a corridor the way runs through, spikes across it wall to wall, held up; their plate in the room
// before it, far from it
function trySpikeGate(A) {
  if (A.floor < 2 && !PUZ.force) return false; const W = A.w;
  for (const h of pitShuffle(critHalls(A))) {
    const H = h.dir === 'h', len = H ? h.x1 - h.x0 : h.y1 - h.y0; if (len < 6 || h.bent || h.wide) continue;
    const near = puzReach(A, h, false), X = near.has(h.A) ? h.A : h.B; if (!puzRoomOK(X) || X.shape) continue;
    const d = X.doors.find(q => q.hall === h); if (!d) continue; const [dx, dy] = d.cells[1];
    // the plate: as far from the corridor's door as the room allows (seven tiles at least), on bare floor
    const spots = []; for (let y = X.iy0 + 1; y <= X.iy1 - 1; y++) for (let x = X.ix0 + 1; x <= X.ix1 - 1; x++) { if (!FLOOR(A.fl[y * W + x]) || X.doors.some(q => q.cells.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 3))) continue; const m = Math.abs(x - dx) + Math.abs(y - dy); if (m >= 7) spots.push([x, y, m]); }
    if (!spots.length) continue; spots.sort((a, b) => b[2] - a[2]); const at = pick(spots.slice(0, 4));
    const D = 3, m0 = Math.round(((H ? h.x0 + h.x1 : h.y0 + h.y1) - D + 1) / 2), fc = (m0 + D / 2) * TS, sg = { downT: 0, spikes: [], clr: 0, hall: h, at: [at[0], at[1]], room: X.i };
    const Wk = wkOf(A); A.spikes = A.spikes || [];
    for (let j = 0; j < D; j++) for (let k = 0; k < 6; k++) { const tx = H ? m0 + j : h.x0 + k, ty = H ? h.y0 + k : m0 + j; if (k >= 3 && !FLOOR(A.fl[ty * W + tx]) && !openAt(tx * TS + 8, ty * TS + 8)) break; const s = { tx, ty, x: tx * TS + 8, y: ty * TS + 8, tile: spikeLook(Wk), ph: 0, hit: new Set(), was: 1, ax: H ? 'x' : 'y', fc, gate: sg }; A.spikes.push(s); sg.spikes.push(s); }
    h.spikeGate = sg; (A.spikeGates = A.spikeGates || []).push(sg); X.puz = 'spikegate'; X.spikeGate = sg; A.sets.push('spikegate'); (A.puzNames = A.puzNames || []).push(PUZ_NAMES.spikegate);
    return true;
  }
  return false;
}
function spikeGateFrame(sg) { const t = sg.downT; return t <= 0 ? 1 : t > 1.1 ? 0 : (((t * 8) | 0) % 2 ? 3 : 0); } // (up; down; the tips peeking up the last second)
// ---- THE CRACKED WALL: a niche behind a stretch of cracked north wall (a secret; now and then a gate's hidden button)
function secretPlan(A) {
  const W = A.w, want = (A.floor >= 3 ? randi(1, 2) : 1) + (ARCH.cur.secrets || 0); let n = 0;
  for (const r of pitShuffle(A.rooms.filter(q => q.kind !== 'shop' && !q.set && !q.pool && !q.crack))) {
    if (n >= want) break; if (!PUZ.force && !chance(0.5)) continue;
    const nd = r.doors.filter(d => d.side === 'N').flatMap(d => d.cells.map(c => c[0])), used = x => nd.some(c => c >= x - 3 && c <= x + 5) || (r.stairX !== undefined && x + 3 >= r.stairX - 1 && x <= r.stairX + 4) || (r.sluiceX !== undefined && Math.abs(r.sluiceX - x - 1) <= 3);
    for (let t = 0; t < 10; t++) {
      const x = randi(r.ix0 + 1, r.ix1 - 3), y = r.fy0; if (used(x) || y - 3 < 0) continue;
      let ok = true; for (let yy = y - 3; yy <= y + 1 && ok; yy++) for (let xx = x - 1; xx <= x + 3; xx++) if (A.fl[yy * W + xx] || (yy === y + 1 && !faceAt(A, xx, yy) && xx >= x && xx <= x + 2)) { ok = false; break; }
      if (!ok) continue; for (let k = x; k <= x + 2; k++) if (!FLOOR(A.fl[(y + 2) * W + k])) ok = false; if (!ok) continue;
      r.crack = { x, y, hp: 3, stage: 0, open: false, room: r.i, holds: 'chest' }; r.crackX = x; (A.cracks = A.cracks || []).push(r.crack); n++; break;
    }
  }
}
// ---- after the rooms are furnished: the plates, the blocks, the runes, the cracked walls' props
function puzzleAfter(A, r) {
  const W = A.w, Wk = wkOf(A), clear = (tx, ty, m = 14) => removeIf(A.props, q => Math.abs(q.x - (tx * TS + 8)) < m && Math.abs(q.cy - (ty * TS + 10)) < m);
  const plate = (tx, ty, o) => { clear(tx, ty); (A.plates = A.plates || []).push(Object.assign({ x: tx * TS + 8, y: ty * TS + 8, tx, ty, tile: Wk.plate, f: 0, down: false, pool: null, room: r.i }, o)); };
  const block = (tx, ty) => { clear(tx, ty, 16); const b = { kind: 'block', push: true, tile: Wk.block, f: 0, tx, ty, home: [tx, ty], x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 8, r: 7, solid: true, hp: 1e9, room: r.i }; A.props.push(b); return b; };
  const bare = (x, y, m = 2) => FLOOR(A.fl[y * W + x]) && !r.doors.some(d => d.cells.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 3)) && !(A.plates || []).some(p => Math.abs(p.tx - x) <= m && Math.abs(p.ty - y) <= m) && !(A.spikes || []).some(s => s.tx === x && s.ty === y) && !(A.runes || []).some(q => q.tx === x && q.ty === y);
  if (r.gateOf && r.puz === 'lever') { // its button, standing free in the room (or hidden behind a cracked wall: THE HIDDEN LEVER)
    if (r.crack && chance(0.5)) { r.crack.holds = 'lever'; const c = r.crack; plate(c.x + 1, c.y, { remote: true, gate: r.gateOf, hidden: true }); A.puzNames.push(PUZ_NAMES.lever); }
    else { const s = []; for (let y = r.iy0 + 1; y <= r.iy1 - 1; y++) for (let x = r.ix0 + 1; x <= r.ix1 - 1; x++) if (bare(x, y) && !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (x * TS + 8)) < 20 && Math.abs(q.cy - (y * TS + 10)) < 18)) s.push([x, y]); const at = s.length ? pick(s) : [Math.round((r.ix0 + r.ix1) / 2), Math.round((r.iy0 + r.iy1) / 2)]; plate(at[0], at[1], { remote: true, gate: r.gateOf }); }
  }
  if (r.gateOf && r.puz === 'weight') { // its plate well away from the gate's door, a block three tiles from it in line, room to push from behind
    const g = r.gateOf, [gx, gy] = r.doors.find(d => d.hall === g.hall).cells[1], cands = [];
    for (let y = r.iy0 + 1; y <= r.iy1 - 1; y++) for (let x = r.ix0 + 1; x <= r.ix1 - 1; x++) { if (!bare(x, y) || Math.abs(x - gx) + Math.abs(y - gy) < 8) continue; for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = 3, bx = x - ax * k, by = y - ay * k; let ok = true; for (let j = 0; j <= k + 1; j++) { const cx = x - ax * j, cy = y - ay * j; if (cx < r.ix0 + (j > 0 && ax ? 1 : 0) || cx > r.ix1 - (j > 0 && ax ? 1 : 0) || cy < r.iy0 || cy > r.iy1 || !FLOOR(A.fl[cy * W + cx])) { ok = false; break; } } if (ok && bx > r.ix0 && bx < r.ix1 && by > r.iy0 && by < r.iy1) cands.push([x, y, bx, by, ax, ay]); } }
    const c = cands.length ? pick(cands) : null; if (c) { plate(c[0], c[1], { hold: true, gate: g }); for (let j = 1; j <= 4; j++) clear(c[0] - c[4] * j, c[1] - c[5] * j, 16); block(c[2], c[3]); }
    else { plate(Math.round((r.ix0 + r.ix1) / 2), r.iy1 - 1, { hold: true, gate: g }); block(Math.round((r.ix0 + r.ix1) / 2), r.iy0 + 2); }
  }
  if (r.gateOf && r.puz === 'echo') placeEcho(A, r, r.gateOf);
  if (r.gateOf && r.puz === 'fires') placeFires(A, r, r.gateOf);
  if (r.gap) { for (const i of r.gap.lanes) clear(i % W, (i / W) | 0, 16); for (const [x, y] of r.gap.blocks) { const b = block(x, y); b.fill = true; } }
  if (r.spikeGate) { const sg = r.spikeGate; plate(sg.at[0], sg.at[1], { timer: sg }); }
  if (r.crack) { const c = r.crack; A.props.push({ kind: 'crack', crack: c, x: (c.x + 1.5) * TS, y: (c.y + 1) * TS + 15, cy: (c.y + 1) * TS + 12, r: 18, solid: false, hp: 3, room: r.i }); }
}
// ---- THE ECHOING RUNES
function placeEcho(A, r, g) {
  const Wk = wkOf(A), n = A.floor >= 4 ? 4 : 3, cands = [], e = { runes: [], order: [], step: 0, shown: false, play: null, gate: g, room: r.i };
  for (let ty = r.iy0 + 1; ty <= r.iy1 - 1; ty++) for (let tx = r.ix0 + 1; tx <= r.ix1 - 1; tx++) { if (A.fl[ty * A.w + tx] !== 1 || r.doors.some(d => d.cells.some(([x, y]) => Math.abs(x - tx) + Math.abs(y - ty) < 4)) || A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (tx * TS + 8)) < 16 && Math.abs(q.cy - (ty * TS + 10)) < 14)) continue; cands.push([tx, ty]); }
  for (let i = 0; i < n && cands.length; i++) { const far = cands.filter(([x, y]) => e.runes.every(q => Math.hypot(q.tx - x, q.ty - y) >= 4)), [x, y] = pick(far.length ? far : cands); e.runes.push({ tx: x, ty: y, x: x * TS + 8, y: y * TS + 8, tile: [Wk.rune[0] + i % 3, Wk.rune[1]], lit: [Wk.runeOn[0] + i % 3, Wk.runeOn[1]], on: false, flash: 0, under: false, i }); removeIf(cands, ([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 2); }
  e.order = pitShuffle(e.runes.map((_, i) => i)); (A.echoes = A.echoes || []).push(e);
}
function echoTick(A, e, dt, heroes) {
  for (const rn of e.runes) rn.flash = Math.max(0, rn.flash - dt);
  const r = A.rooms[e.room]; if (!e.solved && !e.play && !e.shown && heroes.some(h => roomAt(h.x, h.y) === r)) e.play = { i: 0, t: -0.5 };
  if (e.play) { // the order, shown: each lights a moment with its note
    const P = e.play; P.t += dt; while (P.i < e.order.length && P.t >= P.i * 0.7) { const rn = e.runes[e.order[P.i]]; rn.flash = 0.5; SFX.rune(panOf(rn.x), P.i); ring(rn.x, rn.y, 16, 'gold', 0.4, 2); P.i++; }
    if (P.i >= e.order.length && P.t > e.order.length * 0.7 + 0.2) { e.play = null; e.shown = true; } return;
  }
  if (e.solved) return;
  for (const rn of e.runes) {
    const under = heroes.some(h => Math.abs(h.x - rn.x) < 8 && Math.abs(h.y - rn.y) < 7), step = under && !rn.under; rn.under = under; if (!step || rn.on) continue;
    if (e.order[e.step] === rn.i) {
      rn.on = true; SFX.rune(panOf(rn.x), e.step); ring(rn.x, rn.y, 26, 'gold', 0.5, 3); flashLight(rn.x, rn.y, 70, 'gold', 1.1, 0.5); e.step++;
      if (e.step >= e.runes.length) { e.solved = true; const gx = gatePos(e.gate); for (const q of e.runes) FX.beams.push({ x0: q.x, y0: q.y - 2, x1: gx[0], y1: gx[1], w: 1.4, col: 'gold', life: 1, t: 0, steady: true, cap: true }); after(0.9, () => { if (ARENA === A) startGateCine(rn, e.gate); }); }
    } else { // wrong: all dark again, and the order shown once more
      for (const q of e.runes) q.on = false; e.step = 0; SFX.clang(panOf(rn.x)); SFX.stone(panOf(rn.x), false); shake(0.06); smoke(rn.x, rn.y, 2, 'dust', 6, 10, 0.6); e.play = { i: 0, t: -1.1 };
    }
  }
}
// ---- THE COLD BRAZIERS (smoke: how long a hero stands by one before it smokes; catch: before it lights)
const FIRES = { smoke: 1.0, catch: 2.4 };
function placeFires(A, r, g) {
  const n = A.floor >= 4 ? 4 : 3, f = { braziers: [], gate: g, burn: 30, room: r.i }; darkRoom(A, r); r.dark = true;
  for (const p of A.props) if (p.kind === 'brazier' && p.room === r.i && !p.dead) { p.out = true; f.braziers.push(p); }
  const cands = []; for (let y = r.iy0 + 1; y <= r.iy1 - 1; y++) for (let x = r.ix0 + 1; x <= r.ix1 - 1; x++) { if (!FLOOR(A.fl[y * A.w + x]) || r.doors.some(d => d.cells.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 4)) || A.props.some(q => !q.dead && Math.abs(q.x - (x * TS + 8)) < 20 && Math.abs(q.cy - (y * TS + 10)) < 18)) continue; cands.push([x, y]); }
  while (f.braziers.length < n && cands.length) { const far = cands.filter(([x, y]) => f.braziers.every(q => Math.hypot(q.x - (x * TS + 8), q.y - (y * TS + 14)) >= 80)), [x, y] = pick(far.length ? far : cands); const p = { kind: 'brazier', x: x * TS + 8, y: y * TS + 14, cy: y * TS + 10, r: 5, solid: true, hp: 1e9, room: r.i, f: randi(0, 3), out: true, ember: false }; A.props.push(p); f.braziers.push(p); removeIf(cands, ([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 4); }
  for (const p of f.braziers) { p.ember = true; p.fire = f; } /* (the coals in it: a brazier that can be lit, 36_works darkRoom) */ A.lights = A.slit = null; (A.fires = A.fires || []).push(f);
}
// Every brazier with dead coals in it can be lit, wherever it stands, the same way: stand by it a while. (A dark rune
// room's, a cistern's sunken one once the water is gone, a cold braziers puzzle's; that last burns only so long.) An
// empty brazier never lights: the coals are the sign.
const isCoals = p => !p.dead && !p.fire && ((p.kind === 'brazier' && p.out && p.ember) || (p.kind === 'stone' && p.tile && p.tile[0] === 31 && (p.tile[1] === 3 || p.tile[1] === 6)));
function coalsTick(A, dt, heroes) {
  for (const p of A.props) {
    if (!isCoals(p)) continue;
    if (!heroes.some(h => Math.abs(h.x - p.x) < 15 && Math.abs(h.y - p.cy) < 13)) { p.kindle = 0; continue; }
    p.kindle = (p.kindle || 0) + dt; if (p.kindle > FIRES.smoke && chance(dt * (6 + 14 * (p.kindle - FIRES.smoke)))) smoke(p.x, p.y - 12, 1, 'dust', 4, 8, 0.6, 10);
    if (p.kindle > FIRES.catch) { p.kindle = 0; if (p.kind === 'stone') Object.assign(p, { kind: 'brazier', out: true, ember: true, f: randi(0, 3), tile: null }); lightUp(p, true); } // (a sunken one, dry now: a brazier again)
  }
}
function firesTick(A, f, dt, heroes) {
  if (f.solved) return; let lit = 0;
  for (const p of f.braziers) {
    if (p.out) { // a hero standing by it: it smokes, then catches
      if (heroes.some(h => Math.abs(h.x - p.x) < 15 && Math.abs(h.y - p.cy) < 13)) { p.kindle = (p.kindle || 0) + dt; if (p.kindle > FIRES.smoke && chance(dt * (6 + 14 * (p.kindle - FIRES.smoke)))) smoke(p.x, p.y - 12, 1, 'dust', 4, 8, 0.6, 10); if (p.kindle > FIRES.catch) { lightUp(p, true); p.burnT = f.burn; p.kindle = 0; } } else p.kindle = 0; // (it takes a while: nobody lights one by brushing past it)
      continue;
    }
    p.burnT -= dt; lit++;
    if (p.burnT < 4 && chance(dt * 6)) { smoke(p.x, p.y - 12, 1, 'dust', 4, 8, 0.5, 8); if (chance(0.3)) SFX.sizzle(panOf(p.x)); } // (sputtering)
    if (p.burnT <= 0) { p.out = true; p.ember = true; A.lights = A.slit = null; smoke(p.x, p.y - 10, 4, 'dust', 6, 12, 1); SFX.sizzle(panOf(p.x)); lit--; }
  }
  if (lit === f.braziers.length) { f.solved = true; const gx = gatePos(f.gate); for (const q of f.braziers) { q.burnT = 1e9; FX.beams.push({ x0: q.x, y0: q.y - 12, x1: gx[0], y1: gx[1], w: 1.4, col: 'fire', life: 1, t: 0, steady: true, cap: true }); } const p0 = f.braziers[0]; after(0.9, () => { if (ARENA === A) startGateCine(p0, f.gate); }); }
}
// ---- the stone blocks: walk into one a moment and it slides a tile the way you push it
function pushTick(A, dt, heroes) {
  const W = A.w;
  for (const b of A.props) {
    if (!b.push || b.dead || b.locked) continue;
    if (b.drop) { b.drop.t += dt; b.f = Math.min(3, Math.floor(b.drop.t / 0.1)); if (b.drop.t > 0.42) fillGap(A, b); continue; }
    if (b.slide) { const S = b.slide; S.t = Math.min(1, S.t + dt / 0.3); const k = S.t * S.t * (3 - 2 * S.t); b.x = lerp(S.x0, S.x1, k); b.y = lerp(S.y0, S.y1, k); b.cy = b.y - 6; if (S.t >= 1) { b.slide = null; if (A.fl[b.ty * W + b.tx] === PIT) { b.drop = { t: 0 }; b.solid = false; SFX.stone(panOf(b.x), true); } else if (blockOnPlate(A, b)) { b.locked = true; SFX.stone(panOf(b.x), true); shake(0.08); smoke(b.x, b.cy, 4, 'dust', 8, 14, 0.8); textPop(b.x, b.cy, 20, 'CLUNK', 'gold', false); } } continue; } // (on its plate it settles into the socket and stays)
    // pushed: a hero beside it, walking into it along the room's length or breadth
    let dir = null; for (const h of heroes) {
      const I = h.inp; if (!I || h.act || !(I.mx || I.my)) continue; const ax = Math.abs(I.mx), ay = Math.abs(I.my), dx = b.x - h.x, dy = b.cy - h.y;
      if (ax > ay * 1.5 && Math.sign(I.mx) === Math.sign(dx) && Math.abs(dx) < 17 && Math.abs(dy) < 7) dir = [Math.sign(I.mx), 0, h];
      else if (ay > ax * 1.5 && Math.sign(I.my) === Math.sign(dy) && Math.abs(dy) < 15 && Math.abs(dx) < 7) dir = [0, Math.sign(I.my), h];
      if (dir) break;
    }
    if (!dir) { b.pushT = 0; b.away = (b.away || 0) + (heroes.some(h => roomAt(h.x, h.y) === A.rooms[b.room]) ? -b.away : dt); if (b.away > 3 && (b.tx !== b.home[0] || b.ty !== b.home[1]) && !blockOnPlate(A, b)) blockHome(A, b); continue; }
    b.away = 0; b.pushT = (b.pushT || 0) + dt; if ((b.dustT = (b.dustT || 0) - dt) <= 0) { b.dustT = 0.12; smoke(b.x - dir[0] * 7, b.y - 1, 1, 'dust', 4, 6, 0.4, 3); }
    if (b.pushT < 0.3) continue; b.pushT = 0;
    const nx = b.tx + dir[0], ny = b.ty + dir[1], i = ny * W + nx, v = A.fl[i], R = A.rooms[b.room], inRoom = nx >= R.ix0 && nx <= R.ix1 && ny >= R.iy0 && ny <= R.iy1;
    const busy = A.props.some(q => q !== b && !q.dead && q.solid && Math.abs(q.x - (nx * TS + 8)) < 12 && Math.abs(q.cy - (ny * TS + 8)) < 10) || G.units.some(u => u !== dir[2] && !u.dead && !u.fly && Math.abs(u.x - (nx * TS + 8)) < 11 && Math.abs(u.y - (ny * TS + 8)) < 10);
    if (!inRoom || busy || !(FLOOR(v) || (v === PIT && b.fill))) { SFX.stone(panOf(b.x), false); shake(0.02); continue; } // (it will not go)
    b.slide = { x0: b.x, y0: b.y, x1: nx * TS + 8, y1: ny * TS + 14, t: 0 }; b.tx = nx; b.ty = ny; SFX.stone(panOf(b.x), false); SFX.drag && SFX.drag(panOf(b.x)); debris(b.x, b.y, 3, ['#5a5450', '#7a726a'], 30, 40, 1);
  }
}
const blockOnPlate = (A, b) => (A.plates || []).some(p => p.hold && p.tx === b.tx && p.ty === b.ty);
function pushOn(pl) { return ARENA.props.some(b => b.push && !b.dead && !b.slide && b.tx === pl.tx && b.ty === pl.ty); }
function blockHome(A, b) { smoke(b.x, b.cy, 4, 'dust', 8, 14, 0.8); b.tx = b.home[0]; b.ty = b.home[1]; b.x = b.tx * TS + 8; b.y = b.ty * TS + 14; b.cy = b.ty * TS + 8; smoke(b.x, b.cy, 4, 'dust', 8, 14, 0.8); SFX.stone(panOf(b.x), false); }
// a block that went into the cleft: it wedges there, its top level with the floor, a stepping stone
function fillGap(A, b) {
  const i = b.ty * A.w + b.tx; b.dead = true; A.fl[i] = 1; A.flv = (A.flv || 0) + 1; const x = b.tx * TS, y = b.ty * TS, Wk = wkOf(A);
  groundPaint(x, y, x + TS, y + TS, g => { g.fillStyle = '#121418'; g.fillRect(x, y, TS, TS); sheetTile(g, Wk.block, x, y - 2, 3, 0); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y + TS - 3, TS, 3); });
  shake(0.18); SFX.boom && SFX.boom(0.2, panOf(x)); SFX.stone(panOf(x), true); smoke(x + 8, y + 8, 6, 'dust', 9, 20, 1); debris(x + 8, y + 8, 8, ['#5a5450', '#7a726a', '#3c342e'], 60, 80, 1.2); ring(x + 8, y + 8, 22, 'white', 0.35, 2);
  textPop(x + 8, y + 8, 18, 'WEDGED', 'gold', false);
}
// ---- THE CRACKED WALL: a blow on it
function hitCrack(p, n) {
  const c = p.crack; if (c.open) return; c.hp -= n; c.stage = Math.min(2, 3 - Math.max(0, c.hp)); p.flashUntil = G.time + 0.1;
  const x = p.x, y = p.cy - 6; debris(x + rand(-14, 14), y, 6 + n * 3, ['#6e665c', '#8a8076', '#4a443e', '#a69a8c'], 70, 90, 1.4); smoke(x, y, 2 + n, 'dust', 8, 14, 0.9); SFX.stone(panOf(x), n >= 3); shake(0.04 * n);
  if (c.hp <= 0) openCrack(ARENA, p);
}
function openCrack(A, p) {
  const c = p.crack, W = A.w; c.open = true; p.dead = true;
  for (let yy = c.y; yy <= c.y + 1; yy++) for (let xx = c.x; xx <= c.x + 2; xx++) A.fl[yy * W + xx] = 1;
  repaintTiles(A, c.x - 1, c.y - 3, c.x + 3, c.y + 2);
  const x = (c.x + 1.5) * TS, y = (c.y + 1) * TS + 8; shake(0.25); SFX.quake(0.9); SFX.stone(panOf(x), true);
  for (let i = 0; i < 3; i++) debris(x + rand(-16, 16), y + rand(-6, 6), 14, ['#6e665c', '#8a8076', '#4a443e', '#a69a8c', '#3a342e'], 120, 140, 2); smoke(x, y, 10, 'dust', 12, 26, 1.4);
  if (c.holds === 'lever') { const pl = (A.plates || []).find(q => q.hidden && q.tx === c.x + 1 && q.ty === c.y); if (pl) pl.hidden = false; textPop(x, y, 26, 'A HIDDEN LEVER', 'gold', true); }
  else { A.props.push({ kind: 'chest', tile: [pick([28, 30]), 8], th: 1, x: (c.x + 1) * TS + 8, y: c.y * TS + 14, cy: c.y * TS + 10, r: 5, solid: true, hp: 40, room: c.room, rich: true }); textPop(x, y, 26, 'A HIDDEN NICHE', 'gold', true); }
  A.lights = A.slit = null;
}
// the floor picture over a box of tiles drawn again from the floor grid (a wall broken open): floor, wall pieces, the
// ceiling over them, and what of it is drawn at all (30_arena groundSeen)
function repaintTiles(A, x0, y0, x1, y1) {
  const W = A.w, isF = (x, y) => x >= 0 && y >= 0 && x < W && y < A.h && A.fl[y * W + x] !== 0, th = A.th, floorRow = th.floors[0][1];
  const put = (g, tx, ty, x, y, flip) => { g.save(); g.translate(flip ? (x + 1) * TS : x * TS, y * TS); if (flip) g.scale(-1, 1); g.drawImage(IMG.cellar, tx * TS, (ty + th.fy) * TS, TS, TS, 0, 0, TS, TS); g.restore(); };
  const P = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; A.wt[i] = 0; A.wf[i] = 0; if (!isF(x, y)) { const pc = wallPiece(isF, x, y); if (pc) { A.wt[i] = pc[0] * 64 + pc[1] + 1; A.wf[i] = pc[2] ? 1 : 0; P.push([x, y, pc]); } } }
  groundPaint(x0 * TS, y0 * TS, (x1 + 1) * TS, (y1 + 1) * TS, g => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = A.fl[y * W + x]; if (v !== 0 && !FLOOR(v)) continue; g.fillStyle = '#121418'; g.fillRect(x * TS, y * TS, TS, TS); if (FLOOR(v) || P.some(q => q[0] === x && q[1] === y)) tileAt(g, 10, floorRow, x * TS, y * TS); } // (water and pits stay as they are)
    for (const [x, y, pc] of P) put(g, pc[0], pc[1], x, y, pc[2]);
  });
  // the ceiling over it again (and the north walls' trim), from the floor as it is drawn now
  const px = x0 * TS, py = y0 * TS, pw = (x1 - x0 + 1) * TS, ph = (y1 - y0 + 1) * TS, tmp = mkCanvas(pw, ph), tg = tmp.getContext('2d'); tg.translate(-px, -py); drawGround(tg, px, py, pw, ph);
  const cg = A.ceil.getContext('2d'), cn = A.ceilN.getContext('2d'); cg.clearRect(px, py, pw, ph); cn.clearRect(px, py, pw, ph);
  for (const [x, y, pc] of P) { const i = y * W + x; for (const [rx, ry, rw, rh] of paintAt(A, i).tr) cg.drawImage(tmp, x * TS + rx - px, y * TS + ry - py, rw, rh, x * TS + rx, y * TS + ry, rw, rh); const m = CEIL_N[pc[0] + ',' + pc[1]]; if (m) { cn.save(); cn.beginPath(); for (const [mx, my, mw, mh] of m) cn.rect(x * TS + (pc[2] ? TS - mx - mw : mx), y * TS + my, mw, mh); cn.clip(); put(cn, pc[0], pc[1], x, y, pc[2]); cn.restore(); } }
  const d = tg.getImageData(0, 0, pw, ph).data; if (A.lum) for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) { const o = (yy * pw + xx) * 4; A.lum[(py + yy) * A.pw + px + xx] = d[o + 3] > 0 && d[o] + d[o + 1] + d[o + 2] > 12 ? 1 : 0; }
  A.flv = (A.flv || 0) + 1;
}
// the cracks in a stretch of wall: jagged dark lines in its bricks, more of them with every blow; a crumb drops off it now
// and then (the tell)
function drawCrack(c, p) {
  const k = p.crack, x0 = k.x * TS, y0 = (k.y + 1) * TS, n = 3 + k.stage * 3; if (!k.lines) { k.lines = []; for (let i = 0; i < 9; i++) { let x = x0 + rand(4, 44), y = y0 + rand(0, 4); const L = [[x, y]]; for (let j = 0; j < randi(3, 6); j++) { x += rand(-4, 4); y += rand(2, 4); L.push([x, y]); } k.lines.push(L); } }
  const fl = (p.flashUntil || 0) > G.time;
  for (let i = 0; i < Math.min(n, k.lines.length); i++) { const L = k.lines[i]; for (let j = 1; j < L.length; j++) { const [ax, ay] = L[j - 1], [bx, by] = L[j], m = Math.max(Math.abs(bx - ax), Math.abs(by - ay)); for (let s = 0; s <= m; s++) { const x = Math.round(lerp(ax, bx, s / m)), y = Math.round(lerp(ay, by, s / m)); if (y >= y0 + 16) continue; c.fillStyle = fl ? '#e8e0d0' : '#1c1814'; c.fillRect(x, y, 1, 1); c.fillStyle = 'rgba(210,196,170,0.35)'; c.fillRect(x + 1, y, 1, 1); } } }
  if (k.stage >= 1) { c.fillStyle = '#1c1814'; for (let i = 0; i < k.stage * 3; i++) { const L = k.lines[i]; c.fillRect(Math.round(L[1][0]) - 1, Math.round(L[1][1]), 3, 2); } } // (chips knocked out of it)
  if (chance(0.006)) debris(x0 + rand(6, 42), y0 + 14, 1, ['#6e665c', '#8a8076'], 6, 10, 1);
}
// ---- every frame (36_works worksTick)
function puzzlesTick(dt) {
  const A = ARENA; if (!A) return; const heroes = G.heroes.filter(h => !h.dead && !h.enter);
  gatesTick(A, dt); pushTick(A, dt, heroes); for (const e of A.echoes || []) echoTick(A, e, dt, heroes); for (const f of A.fires || []) firesTick(A, f, dt, heroes); coalsTick(A, dt, heroes);
  for (const sg of A.spikeGates || []) {
    const was = sg.downT; if (sg.downT > 0) { sg.downT = Math.max(0, sg.downT - dt); const left = sg.downT; if ((sg.tkT = (sg.tkT || 0) - dt) <= 0) { sg.tkT = left > 3 ? 0.5 : left > 1.2 ? 0.25 : 0.12; SFX.tick(panOf(sg.spikes[0].x)); } }
    if (was > 0 && sg.downT <= 0) for (const s of sg.spikes) s.hit.clear();
    if ((sg.clr -= dt) <= 0) { sg.clr = 0.9; for (const s of sg.spikes) s.hit.clear(); } // (standing up, they stab whoever comes on, once a beat)
  }
}
// ---- drawn with the works (36_works drawWorks): the echoing runes
function drawPuzzles(c) {
  for (const e of ARENA.echoes || []) for (const rn of e.runes) { const lit = rn.on || rn.flash > 0; sheetTile(c, lit ? rn.lit : rn.tile, rn.x - 8, rn.y - 8); if (lit) light(rn.x, rn.y, 40 + (rn.flash > 0 ? 20 : 0), 'gold', rn.flash > 0 ? 0.8 : 0.5); }
}
