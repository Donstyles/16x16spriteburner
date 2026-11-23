// ===================== ORE CARTS (the mines, 42_mines) =====================
// Rails run down some of the straight passages and across some of the plain rooms, wall to wall, and an ore cart stands
// on each. Strike the cart and it runs: away from whoever struck it, to the end of its rails, where it stops against the
// buffer with a clang. Whatever stands on the track as it comes through is run down (a hard blow, thrown aside): foes, and
// heroes too. Struck again it runs back. A heavy blow sends it faster.
// The sheet's rails: across, tiles [19..21, 22] (48 by 22 pixels from x 304, y 349: an end, a middle, an end); down, tiles
// [17, 21..23] (22 by 48 from x 269, y 336). Its carts: from the side [24..26, 23] (ore, coal, empty), end on [28, 23].
const CART = { v: 210, dmg: 28, max: 4 };
function railPaint(g, R) {
  for (let t = R.t0; t <= R.t1; t++) { const k = t === R.t0 ? 0 : t === R.t1 ? 2 : 1; if (R.horiz) g.drawImage(IMG.mines, 304 + k * TS, 349, TS, 22, t * TS, R.c * TS - 3, TS, 22); else g.drawImage(IMG.mines, 269, 336 + k * TS, 22, TS, R.c * TS - 3, t * TS, 22, TS); }
}
const cartPlace = (p, R) => { if (R.horiz) { p.x = R.pos; p.y = R.c * TS + 14; } else { p.x = R.c * TS + 8; p.y = R.pos + 6; } p.cy = p.y - 4; };
function minesRails(A, g) {
  A.rails = []; const W = A.w, S = A.secret;
  const open = (x, y) => A.fl[y * W + x] === 1 && !(S && S[y * W + x]) && !(A.floodAt && A.floodAt[y * W + x]) && !(A.spikes || []).some(s => s.tx === x && s.ty === y) && !(A.plates || []).some(q => q.tx === x && q.ty === y) && !(A.runes || []).some(q => q.tx === x && q.ty === y) && !(A.crumbles || []).some(q => q.i === y * W + x);
  const lay = (horiz, c, t0, t1, tag) => {
    const R = { horiz, c, t0, t1, a: (t0 + 1) * TS + 8, b: (t1 - 1) * TS + 8, vel: 0, ck: 0, hit: null }; railPaint(g, R);
    R.pos = chance(0.5) ? R.a + TS * randi(1, 2) : R.b - TS * randi(1, 2); // (a tile or two in from an end: room to stand behind it)
    const p = Object.assign({ kind: 'cart', sheet: 'mines', tile: horiz ? [pick([24, 24, 25, 26]), 23] : [28, 23], th: 1, r: 6, solid: true, hp: 60, cart: R }, tag); cartPlace(p, R); R.cart = p; A.props.push(p); A.rails.push(R);
  };
  // the passages: straight, plain, long enough; what wood lay about in one is cleared for its rails
  let n = 0; for (const h of pitShuffle(A.halls.slice())) {
    if (n >= 3 || h.bent || h.wide || h.gate || h.A.secret || h.B.secret || h.A.flood || h.B.flood) continue; const horiz = h.dir === 'h', t0 = (horiz ? h.x0 : h.y0) + 1, t1 = (horiz ? h.x1 : h.y1) - 1, c = (horiz ? h.y0 : h.x0) + 1; if (t1 - t0 < 5 || !chance(0.6)) continue;
    let ok = true; for (let t = t0 - 1; t <= t1 + 1 && ok; t++) for (let k = -1; k <= 1; k++) if (!open(horiz ? t : c + k, horiz ? c + k : t)) { ok = false; break; } if (!ok) continue;
    removeIf(A.props, q => q.hall && q.x >= h.px0 && q.x <= h.px1 && q.cy >= h.py0 && q.cy <= h.py1); lay(horiz, c, t0, t1, {}); n++;
  }
  // the rooms: across a plain one, along a row nothing stands on and no side door opens onto
  let m = 0; for (const r of pitShuffle(A.rooms.slice())) {
    if (m >= 2 || n + m >= CART.max || r.kind !== 'room' || r.set || r.puz || r.chest || r.flood || r.secret || r.gateOf || r.crack || r.pool || r.sluice || r.w < 9 || r.h < 6 || !chance(0.85)) continue;
    const doorRows = new Set(r.doors.filter(d => d.side === 'E' || d.side === 'W').flatMap(d => d.cells.map(q => q[1]))), mid = (r.iy0 + r.iy1) / 2, rows = []; for (let y = r.iy0 + 2; y <= r.iy1 - 2; y++) if (!doorRows.has(y)) rows.push(y); rows.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
    const t0 = r.ix0 + 1, t1 = r.ix1 - 1, clear = y => { for (let x = t0; x <= t1; x++) if (!open(x, y)) return false; return !A.props.some(q => !q.dead && q.x >= (t0 - 1) * TS - 6 && q.x <= (t1 + 2) * TS + 6 && Math.abs(q.cy - (y * TS + 10)) < 21 && (q.solid || q.th > 1 || q.tw > 1)); };
    const y = rows.find(clear); if (y === undefined) continue; removeIf(A.props, q => !q.solid && q.x >= t0 * TS && q.x <= (t1 + 1) * TS && Math.abs(q.cy - (y * TS + 10)) < 10); lay(true, y, t0, t1, { room: r.i }); r.rail = true; m++;
  }
}
// struck: off it goes, away from whoever struck it (struck from the side: the longer run)
function cartHit(p, mv) {
  const R = p.cart; p.flashUntil = G.time + 0.08; if (R.vel) return; const h = G.heroes.filter(q => !q.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.cy) - Math.hypot(b.x - p.x, b.y - p.cy))[0];
  const along = h ? (R.horiz ? p.x - h.x : p.cy - h.y) : 0; let dir = Math.abs(along) > 5 ? Math.sign(along) : R.b - R.pos > R.pos - R.a ? 1 : -1;
  if ((dir > 0 && R.b - R.pos < 3) || (dir < 0 && R.pos - R.a < 3)) { if (Math.abs(along) > 5) { SFX.clang(panOf(p.x)); shake(0.08); sparks(p.x, p.cy + 4, 2, 4, 'fire', 90, 60); return; } dir = -dir; } // (hard against its buffer: it only rings)
  R.vel = dir * CART.v * (mv && mv.dm >= 2 ? 1.3 : 1); R.hit = new Set(); R.ck = 0; p.solid = false; SFX.wood(panOf(p.x), true); SFX.clang(panOf(p.x)); shake(0.12); logEv('cart', { at: tileOf(p) });
}
function cartsTick(dt) {
  const A = ARENA; if (!A.rails) return;
  for (const R of A.rails) {
    if (!R.vel) continue; const p = R.cart; let pos = R.pos + R.vel * dt, end = false; if (pos >= R.b) { pos = R.b; end = true; } else if (pos <= R.a) { pos = R.a; end = true; } R.pos = pos; cartPlace(p, R);
    const cx = p.x, cy = p.cy, sg = Math.sign(R.vel);
    for (const u of G.units) { // what stands on the track
      if (u.dead || u.fall || u.fly || u.under || R.hit.has(u) || (u.z || 0) > 10) continue; if (Math.abs(u.x - cx) > (R.horiz ? 11 : 9) + u.r * 0.4 || Math.abs(u.y - cy) > (R.horiz ? 9 : 11) + u.r * 0.4) continue;
      R.hit.add(u); const side = (R.horiz ? Math.sign(u.y - cy) : Math.sign(u.x - cx)) || (chance(0.5) ? 1 : -1), a = R.horiz ? Math.atan2(side * 0.8, sg) : Math.atan2(sg, side * 0.8);
      hurt(u, CART.dmg + A.floor * 2.2, { x: cx - Math.cos(a) * 10, y: cy - Math.sin(a) * 10, team: 'trap', def: {} }, { ranged: true, unblockable: true, poise: 90, kx: Math.cos(a) * 190, ky: Math.sin(a) * 150, ang: a }); shake(0.14); SFX.wood(panOf(cx), true);
    }
    if ((R.ck -= dt) <= 0) { R.ck = 0.075; SFX.rail(panOf(cx)); sparks(cx - (R.horiz ? sg * 6 : 0), cy + (R.horiz ? 5 : -sg * 6), 1, 1, 'fire', 70, 40); if (chance(0.5)) smoke(cx - (R.horiz ? sg * 8 : 0), cy + 4 - (R.horiz ? 0 : sg * 8), 1, 'dust', 4, 8, 0.5, 6); }
    if (end) { R.vel = 0; p.solid = true; shake(0.22); SFX.clang(panOf(cx)); SFX.boom(0.25, panOf(cx)); sparks(cx + (R.horiz ? sg * 8 : 0), cy + (R.horiz ? 4 : sg * 8), 3, 8, 'fire', 150, 110); smoke(cx, cy + 4, 3, 'dust', 8, 14, 0.8, 8);
      for (const u of G.units) if (!u.dead && Math.hypot(u.x - p.x, u.y - p.cy) < p.r + u.r) { const a = Math.atan2(u.y - p.cy, u.x - p.x) || 0; u.x = p.x + Math.cos(a) * (p.r + u.r + 1); u.y = p.cy + Math.sin(a) * (p.r + u.r + 1); } } // (nobody left standing inside it)
  }
}
