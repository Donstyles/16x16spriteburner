// ===================== bottomless pits: holes in the floor going down into the dark =====================
// The sheet's pit pieces: the earth under a floor's edge with roots hanging from it, fading into black ([10..15, 4] on
// the brown floors, [10..15, 12] on the grey), laid in a pit tile right under a floor tile (we look down past the floor's
// south edge at its thickness); the rest of a pit is black. Its other sides show nothing: the floor beside it is seen
// edge on, and the floor in front of it hides the pit's far wall. A side wall's strip of floor beside a pit, and the top
// rows of a south wall in front of one, go down into it too.
// Feet stop at a pit's edge (it blocks like water, and like water it lets sight, arrows and spells over it), and a roll
// or a lunge stops there too; but a hard enough blow (a brute's shove, a heavy swing, a wave, a spike's throw) carries
// whoever takes it over the edge, and they fall: smaller and darker into the black, sinking behind the floor in front
// of the hole, and gone. A hero who falls climbs back out where he last stood clear of every pit, a fifth of his health
// the poorer (a fall he cannot pay for is his last); a foe that falls is gone, and its loot with it. Blood, gibs,
// sparks and stones that come down over a pit drop away into it and leave no mark, and nothing painted on the floor
// ever shows on the void.
// Three ways a room can have them (pitPlan, after the set pieces and before the rooms are furnished; never the first
// room, the last, the treasure room or a set piece's): THE CHASM, a band of pit two or three tiles wide from wall to
// wall, crossed by a stone bridge two tiles wide with a brute standing guard on it; BROKEN FLOOR, holes here and there,
// with some cracked slabs round them that give way a moment after anyone steps on them (they shake, grind and drop);
// THE LEDGES, a room all pit but a platform in its middle, a brute on it, and the ways out to it from every door.
// Every door of such a room stays joined to every other, and no floor is left cut off.
const PIT = 4, PIT_DMG = 0.2, FALL_T = 0.95, CRUMBLE_T = 0.55, PIT_KNOCK = 110;
const FORCE_PITS = { on: false }; // the pit floor (kit screen): every kind of pit room that fits
let PITPASS = false; // (while a knocked unit moves, a pit does not stop it: 30_arena's wallBox)
const pitFace = A => A.th === THEMES.grey ? [10, 12] : [10, 4];
let PIT_BLACK = null;
function pitBlack() { if (PIT_BLACK) return PIT_BLACK; const P = PIX.cellar, i = ((4 * TS + 15) * P.w + 10 * TS + 8) * 4; return (PIT_BLACK = `rgb(${P.d[i]},${P.d[i + 1]},${P.d[i + 2]})`); }
function pitAt(x, y) { const A = ARENA; if (!A || !A.fl) return false; const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx >= 0 && ty >= 0 && tx < A.w && ty < A.h && A.fl[ty * A.w + tx] === PIT; }
// a pit tile on the ground: black, the earth face under a floor to its north, and the wall strips beside it
function pitPaint(A, g, i) {
  const W = A.w, x = i % W, y = (i / W) | 0, n = A.fl[i - W], M = A.mg, face = n === 1 || n === 3, f = pitFace(A), v = (x * 5 + y * 3) % 6;
  g.fillStyle = pitBlack(); g.fillRect(x * TS, y * TS, TS, TS); if (face) sheetTile(g, f, x * TS, y * TS, v, 0);
  if (!M) return; const sx = (f[0] + v) * TS, sy = f[1] * TS;
  const ml = A.fl[i - 1] === 0 ? M.r[i - 1] : 0, mr = A.fl[i + 1] === 0 ? M.l[i + 1] : 0, mb = A.fl[i + W] === 0 ? M.t[i + W] : 0;
  g.fillStyle = pitBlack();
  if (ml) { g.fillRect(x * TS - ml, y * TS, ml, TS); if (face) g.drawImage(IMG.cellar, sx + TS - ml, sy, ml, TS, x * TS - ml, y * TS, ml, TS); }
  if (mr) { g.fillRect((x + 1) * TS, y * TS, mr, TS); if (face) g.drawImage(IMG.cellar, sx, sy, mr, TS, (x + 1) * TS, y * TS, mr, TS); }
  if (mb) g.fillRect(x * TS, (y + 1) * TS, TS, mb);
}
// marks painted on the ground (blood, scorch, footprints) never stay on a pit: the pits they touched are painted again
function pitMend(A, g, x0, y0, x1, y1) {
  if (!A.pitN) return; const tx0 = Math.max(0, Math.floor(x0 / TS) - 1), tx1 = Math.min(A.w - 1, Math.floor(x1 / TS) + 1), ty0 = Math.max(0, Math.floor(y0 / TS) - 1), ty1 = Math.min(A.h - 1, Math.floor(y1 / TS) + 1);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (A.fl[ty * A.w + tx] === PIT) pitPaint(A, g, ty * A.w + tx);
}

// ---- building
const pitShuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = randi(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pitRoomOK = (A, r) => r.kind === 'room' && !r.chest && !r.set && !r.sluice && !r.pool && !r.shrine;
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
// holes here and there, never against a wall, and cracked slabs round some of them
function pitHoles(A, r) {
  const keep = doorLanding(A, r), gone = new Set(), n = randi(2, 4), W = A.w; let made = 0;
  for (let tries = 0; made < n && tries < 50; tries++) {
    const w = randi(2, 3), h = randi(2, 3), x0 = randi(r.ix0 + 1, r.ix1 - w), y0 = randi(r.iy0 + 1, r.iy1 - h); if (x0 < r.ix0 + 1 || y0 < r.iy0 + 1) continue;
    let cells = []; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) cells.push(y * W + x);
    if (w * h > 4 && chance(0.6)) { const c = pick([0, w - 1, (h - 1) * w, h * w - 1]); cells = cells.filter((_, k) => k !== c); } // a corner bitten off: an odd shape
    if (cells.some(i => keep.has(i) || gone.has(i) || !FLOOR(A.fl[i]) || [i - 1, i + 1, i - W, i + W, i - W - 1, i - W + 1, i + W - 1, i + W + 1].some(j => gone.has(j)))) continue; // (holes apart)
    cells.forEach(i => gone.add(i)); const R = pitReach(A, r, gone); if (!R || !R.linked || R.seen.size < R.all * 0.95) { cells.forEach(i => gone.delete(i)); continue; } made++;
  }
  if (made < 2) return null;
  // the cracked slabs: on the edge of a hole, and even if they all give way the doors stay joined
  const crack = []; for (const i of pitShuffle([...gone])) for (const j of pitShuffle([i - 1, i + 1, i - W, i + W])) {
    if (crack.length >= randi(3, 5) || gone.has(j) || keep.has(j) || crack.includes(j) || !FLOOR(A.fl[j])) continue; const x = j % W, y = (j / W) | 0; if (x < r.ix0 || x > r.ix1 || y < r.iy0 || y > r.iy1) continue;
    const all = new Set([...gone, ...crack, j]), R = pitReach(A, r, all); if (R && R.linked && R.seen.size >= R.all * 0.95) crack.push(j);
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
    return { cells, guard: o.v ? [(o.at + H / 2) * TS, (b + 1) * TS + 4] : [(b + 1) * TS, (o.at + H / 2) * TS + 4], bridge };
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
function pitPlan(A, g) {
  A.pitSets = []; A.crumbles = []; A.pitN = 0; A.peb = []; A.fallers = [];
  const kinds = FORCE_PITS.on ? ['ledges', 'chasm', 'holes'] : A.floor < 2 ? (chance(0.35) ? ['holes'] : []) : [chance(0.5) && pick(['chasm', 'ledges']), chance(0.4) && 'holes'].filter(Boolean);
  for (const kind of kinds) for (const r of pitShuffle(A.rooms.filter(r => pitRoomOK(A, r)))) {
    if (kind === 'ledges' && (r.w < 11 || r.h < 8) || kind === 'chasm' && (r.w < 9 || r.h < 8) || r.w * r.h < 48) continue;
    const res = kind === 'chasm' ? pitChasm(A, r) : kind === 'ledges' ? pitLedges(A, r) : pitHoles(A, r); if (!res) continue;
    for (const i of res.cells) A.fl[i] = PIT; for (const i of res.cells) pitPaint(A, g, i); A.pitN += res.cells.size;
    r.set = kind; r.pitGuard = res.guard || null; A.pitSets.push(kind);
    for (const i of res.crack || []) { const x = i % A.w, y = (i / A.w) | 0, cv = mkCanvas(TS, TS); cv.getContext('2d').drawImage(g.canvas, x * TS, y * TS, TS, TS, 0, 0, TS, TS); A.crumbles.push({ i, x, y, cv, st: 0, t: 0, ph: rand(TAU) }); }
    break;
  }
}

// ---- falling
function startFall(u) {
  u.fall = { t: 0, T: FALL_T * (u.scale > 1.2 ? 1.2 : 1), x: u.x, y: u.y, spin: rand(-0.9, 0.9) }; u.vx = u.vy = u.kx = u.ky = 0; u.act = null; u.sprint = false; u.blocking = false; u.stun = 0;
  removeIf(FX.nums, n => n.on === u); // (its marks go with it)
  pebbles(u.x, u.y - 2, 8); smoke(u.x, u.y, 2, 'dust', 6, 12, 0.6); SFX.fall(panOf(u.x), u.scale > 1.2, u.team === 'hero');
  if (u.team === 'hero') { shake(0.15); G.hurtFlash = 0.2; }
}
function endFall(u) {
  u.fall = null;
  if (u.team !== 'hero') { u.dead = true; u.hp = 0; u.act = null; if (!u.raisedBy) G.kills++; return; } // gone, and all it carried
  const dmg = Math.round(u.maxHp * PIT_DMG);
  if (u.hp - dmg <= 0 && !(TEST.on && TEST.god)) { // a fall he cannot pay for: he is gone
    Object.assign(u, { dead: true, hp: 0, act: null, stun: 0, deadT: 0, gone: true, dropped: true });
    textPop(u.x, u.y, 18, (u.pname || u.def.name) + ' FELL', 'red'); SFX.boom(0.4, panOf(u.x)); shake(0.3); slowmo(0.3, 1.2); return;
  }
  const s = u.safe || ARENA.spawn; u.hp = Math.max(1, u.hp - dmg); u.x = s.x; u.y = s.y; u.z = 0; u.vx = u.vy = u.kx = u.ky = 0; u.iframe = 1; u.rise = 1; u.path = null;
  number(u.x, u.y, headZ(u) + 1, dmg, 'red', false, u); G.hurtFlash = 0.35; shake(0.2); smoke(u.x, u.y, 4, 'dust', 8, 14, 0.8); SFX.stone(panOf(u.x), false);
}
// a few stones and crumbs off the edge, down into the dark
function pebbles(x, y, n) { const A = ARENA; if (!A || !A.peb) return; for (let i = 0; i < n; i++) A.peb.push({ x: x + rand(-5, 5), y: y + rand(-2, 2), vy: rand(10, 40), t: 0, life: rand(0.35, 0.7), c: pick(['#5a4a3a', '#7a6a58', '#3a3028', '#8a7a66']) }); if (A.peb.length > 80) A.peb.splice(0, A.peb.length - 80); }
// a brute's shove or slam near a pit throws you toward the nearest edge (as long as that is not back at the brute)
function pitAim(h, ka) {
  const A = ARENA; if (!A || !A.pitN) return ka; let best = null, bd = 28;
  for (let ty = Math.floor((h.y - 28) / TS); ty <= Math.floor((h.y + 28) / TS); ty++) for (let tx = Math.floor((h.x - 28) / TS); tx <= Math.floor((h.x + 28) / TS); tx++) {
    if (tx < 0 || ty < 0 || tx >= A.w || ty >= A.h || A.fl[ty * A.w + tx] !== PIT) continue; const px = clamp(h.x, tx * TS + 1, tx * TS + TS - 1), py = clamp(h.y, ty * TS + 1, ty * TS + TS - 1), d = dist(h.x, h.y, px, py); if (d > 0.5 && d < bd) { bd = d; best = [px, py]; }
  }
  if (!best) return ka; const a = angTo(h.x, h.y, best[0], best[1]); return Math.abs(angDiff(ka, a)) < 1.75 ? a : ka;
}
function pitKnock(u) { return !u.fly && !u.under && Math.hypot(u.kx, u.ky) > PIT_KNOCK; }
function pitsTick(dt) {
  const A = ARENA; if (!A || !A.fl) return; if (!A.peb) Object.assign(A, { peb: [], fallers: [], crumbles: A.crumbles || [], pitN: A.pitN || 0 });
  // cracked slabs: a foot on one sets it shaking, and a moment later it drops away
  for (const c of A.crumbles) {
    if (c.st === 0 && G.units.some(u => !u.dead && !u.fly && !u.under && !u.fall && footTile(u.x, u.y) === c.i)) { c.st = 1; c.t = 0; SFX.crumble(panOf(c.x * TS + 8), 0); }
    if (c.st === 0 && chance(dt * 0.5)) pebbles(c.x * TS + rand(3, 13), c.y * TS + rand(4, 14), 1); // (a crumb now and then off a cracked slab: the tell)
    if (c.st !== 1) continue; c.t += dt; if (chance(dt * 18)) pebbles(c.x * TS + rand(2, 14), c.y * TS + 15, 1); if (chance(dt * 10)) smoke(c.x * TS + rand(3, 13), c.y * TS + rand(6, 14), 1, 'dust', 4, 8, 0.5);
    if (c.t < CRUMBLE_T) continue; c.st = 2; A.fl[c.i] = PIT; A.pitN++; A.flv = (A.flv || 0) + 1;
    for (const k of groundChunks(A)) { pitPaint(A, k.g, c.i); if (A.fl[c.i + A.w] === PIT) pitPaint(A, k.g, c.i + A.w); }
    A.fallers.push({ cv: c.cv, x: c.x * TS, y: c.y * TS, t: 0 }); pebbles(c.x * TS + 8, c.y * TS + 8, 10); smoke(c.x * TS + 8, c.y * TS + 8, 4, 'dust', 8, 16, 0.9); SFX.crumble(panOf(c.x * TS + 8), 1); if (G.me && dist(G.me.x, G.me.y, c.x * TS, c.y * TS) < 160) shake(0.12);
  }
  for (const u of G.units) {
    if (u.fall) { u.fall.t += dt; if (u.fall.t >= u.fall.T) endFall(u); continue; }
    if (u.dead || u.fly || u.under || u.enter || (u.z || 0) > 2) continue;
    if (u.rise > 0) u.rise -= dt;
    if (A.pitN && pitAt(u.x, u.y)) { startFall(u); continue; } // (the floor gave way under it)
    if (u.team !== 'hero' || !A.pitN) continue;
    // where he would climb back out: the last place he stood clear of every pit (and of every cracked slab)
    const i = footTile(u.x, u.y), clear = FLOOR(A.fl[i]) && ![i - 1, i, i + 1].some(j => [j - A.w, j, j + A.w].some(k => A.fl[k] === PIT || A.crumbles.some(c => c.i === k && c.st < 2)));
    if (clear) u.safe = { x: u.x, y: u.y };
    // pressing at an edge: stones crumble off it
    const sp = Math.hypot(u.vx, u.vy); if (sp > 12) { const px = u.x + u.vx / sp * 7, py = u.y + u.vy / sp * 5; if (pitAt(px, py) && chance(dt * 5)) { pebbles(px, py, 2); if (chance(0.5)) SFX.tick(panOf(px)); } }
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
  for (let n = 0; n < 120; n++) { startFloor(); if (ARENA.pitSets.length >= (n < 90 ? 3 : 2)) break; }
  FORCE_PITS.on = false; G.card = { t: 0, life: 3.2, a: 'PIT FLOOR', b: ARENA.pitSets.map(s => ({ chasm: 'THE CHASM', holes: 'BROKEN FLOOR', ledges: 'THE LEDGES' })[s]).join('  ·  '), c: 'MIND THE EDGE' };
}
