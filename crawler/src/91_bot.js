// ===================== a test pilot (window.CR_BOT = true): plays the local hero for soak tests and screenshots =====================
// It fights the nearest foe it can see (now and then holding the blow for a heavy), raises its guard against marked blows, rolls away from slams, drinks when low and
// otherwise walks toward unexplored floor, and once the map is mostly known, to the way down. Held up (going nowhere for
// a moment), it smashes whatever breakable thing is in its way (a barricade); a foe it has no way to (an archer on an
// island) it leaves be for a while.
function botDrive(h, dt) {
  if (!h || h.dead) return; const I = h.inp, A = ARENA; I.aim = null; I.block = false; I.atk = false;
  const B = h.bot = h.bot || { t: 0, goal: null };
  const foes = G.foes.filter(f => !f.dead && foeShown(f) && !(f.botNo > G.time)), f = nearest(h, foes);
  B.st = (B.st || 0) + dt; if (B.st > 0.8) { B.stuck = B.lx !== undefined && dist(h.x, h.y, B.lx, B.ly) < 6; B.lx = h.x; B.ly = h.y; B.st = 0; }
  if (B.stuck && !h.act) { const p = A.props.filter(q => !q.dead && q.solid && q.hp < 1e8 && !(q.sealed && !q.sealed.open) && !(q.kind === 'tchest' && q.open) && !(q.botNo > G.time) && dist(h.x, h.y, q.x, q.cy) < 28).sort((a, b) => dist(h.x, h.y, a.x, a.cy) - dist(h.x, h.y, b.x, b.cy))[0];
    if (p) { if (B.hitQ !== p) { B.hitQ = p; B.hitT = G.time; } else if (G.time - B.hitT > 4) { p.botNo = G.time + 20; B.hitQ = null; } // (four seconds at it and still standing: something else)
      const a = angTo(h.x, h.y, p.x, p.cy); I.mx = Math.cos(a) * 0.05; I.my = Math.sin(a) * 0.05; if (h.stam > 20 && chance(dt * 9)) I.atkP = true; return; }
    // held up with nothing to smash and nobody to fight (a brazier or a pillar in the way of its path): a step aside, and
    // that goal (a button, a rune, a tile to explore) left alone a while
    if (!f && B.goal) { if (B.goal.q) B.goal.q.botNo = G.time + 15; (B.bad = B.bad || new Map()).set(Math.floor(B.goal.y / TS) * A.w + Math.floor(B.goal.x / TS), G.time + 20); B.goal = null; B.side = { t: 0.5, a: rand(TAU) }; B.stuck = false; } }
  if (B.side && B.side.t > 0 && !f) { B.side.t -= dt; I.mx = Math.cos(B.side.a); I.my = Math.sin(B.side.a); return; }
  const danger = foes.some(o => o.act && o.act.phase === 'wind' && dist(h.x, h.y, o.x, o.y) < 45);
  if (h.hp < h.maxHp * 0.4 && h.flasks > 0 && !h.act && !danger && (!f || dist(h.x, h.y, f.x, f.y) > 26 || h.hp < h.maxHp * 0.25)) { I.itemP = true; I.mx = I.my = 0; return; }
  if (f) {
    const d = dist(h.x, h.y, f.x, f.y), a = angTo(h.x, h.y, f.x, f.y), fa = f.act;
    if (fa && fa.k === 'atk' && fa.phase === 'wind' && d < 50) { if (fa.mv.slam || h.stam < 30 || guardOf(h).absorb < 0.6) { I.dodgeP = true; I.mx = -Math.cos(a); I.my = -Math.sin(a); } else { I.block = true; I.mx = Math.cos(a) * 0.01; I.my = Math.sin(a) * 0.01; } return; }
    const reach = weaponOf(h).combo[0].reach + f.r;
    if (d > reach && !(h.path && h.pathTo === 'f' + f.id) && !findPath(h.x, h.y, f.x, f.y) && !lineOfSight(h.x, h.y, f.x, f.y)) { f.botNo = G.time + 6; return; } // (no way to it)
    if (d > reach && B.stuck && !findPath(h.x, h.y, f.x, f.y)) { f.botNo = G.time + 6; B.stuck = false; return; } // (seen across water or a pit, and no way round)
    if (d > reach) { const p = h.path && h.pathTo === 'f' + f.id ? h.path : (h.path = findPath(h.x, h.y, f.x, f.y) || [], h.pathTo = 'f' + f.id, h.path); while (p.length && dist(h.x, h.y, p[0].x, p[0].y) < 8) p.shift(); const wp = lineOfSight(h.x, h.y, f.x, f.y) ? f : p[0] || f; const l = dist(h.x, h.y, wp.x, wp.y) || 1; I.mx = (wp.x - h.x) / l; I.my = (wp.y - h.y) / l; if ((B.t -= dt) <= 0) { B.t = 1; h.path = null; } }
    else { I.mx = Math.cos(a) * 0.05; I.my = Math.sin(a) * 0.05; if (B.hold > 0) { B.hold -= dt; I.atk = true; } else if (!h.act && h.stam > 20 && chance(dt * 9)) { I.atkP = true; if (chance(0.3)) { B.hold = weaponOf(h).heavy.charge + 0.3; I.atk = true; B.heavies = (B.heavies || 0) + 1; } } }
    return;
  }
  // explore: the nearest floor tile not yet seen, else the way down
  if (!B.goal || (B.t -= dt) <= 0 || dist(h.x, h.y, B.goal.x, B.goal.y) < 10) {
    B.t = 3; let best = null, bd = 1e9; const seenAll = A.mem.reduce((n, v, i) => n + (A.fl[i] === 1 && !v ? 1 : 0), 0) < 40;
    if (!seenAll) for (let i = 0; i < A.w * A.h; i += 3) { if (A.fl[i] !== 1 || A.mem[i] || B.bad && B.bad.get(i) > G.time) continue; const x = (i % A.w) * TS + 8, y = ((i / A.w) | 0) * TS + 8, dd = dist(h.x, h.y, x, y); if (dd < bd) { bd = dd; best = { x, y }; } }
    // a button it has seen and not yet pressed (a sluice, a drawbridge's), if it can get there
    const pl = (A.plates || []).concat(A.runes || []).find(q => !q.down && !q.on && !(q.botNo > G.time) && A.mem[q.ty * A.w + q.tx] && findPath(h.x, h.y, q.x, q.y)); // (and a rune: a crate on it, it smashes)
    B.goal = pl ? { x: pl.x, y: pl.y, q: pl } : best || { x: A.stairs.x, y: A.stairs.y - 6 }; B.path = findPath(h.x, h.y, B.goal.x, B.goal.y) || [];
    // behind a south wall (a wall tile, its floor open) there is no path from where it stands: from the floor tile it counts as on
    if (!B.path.length) { const ft = footTile(h.x, h.y), fx = (ft % A.w) * TS + 8, fy = ((ft / A.w) | 0) * TS + 8, q2 = findPath(fx, fy, B.goal.x, B.goal.y); if (q2) B.path = [{ x: fx, y: fy }].concat(q2); }
  }
  const p = B.path || []; while (p.length && dist(h.x, h.y, p[0].x, p[0].y) < 8) p.shift(); const wp = p[0] || B.goal, l = dist(h.x, h.y, wp.x, wp.y) || 1; I.mx = (wp.x - h.x) / l; I.my = (wp.y - h.y) / l;
}
