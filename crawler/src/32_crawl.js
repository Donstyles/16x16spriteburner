// ===================== crawling: paths through the corridors, fog over unseen rooms, doors, the map =====================
// a unit-sized box fits here without touching a wall
function boxFree(x, y, r) { const hw = Math.max(3, r * 0.8), hh = Math.max(2, r * 0.45); for (const [px, py] of [[x - hw, y - hh], [x + hw, y - hh], [x - hw, y + hh], [x + hw, y + hh]]) if (solidAt(px, py)) return false; return true; }
// the farthest point along a straight move that does not end inside a wall (dashes and leaps never pass through stone)
function clipToWalls(x0, y0, x1, y1, r) {
  if (!ARENA || !ARENA.fl) return [x1, y1]; const d = dist(x0, y0, x1, y1), n = Math.max(1, Math.ceil(d / 3)); let lx = x0, ly = y0;
  for (let i = 1; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); if (!boxFree(x, y, r)) break; lx = x; ly = y; }
  return [lx, ly];
}
// breadth-first search over floor tiles; the path is a list of tile centres, start excluded
function findPath(x0, y0, x1, y1) {
  const A = ARENA, W = A.w, s = Math.floor(y0 / TS) * W + Math.floor(x0 / TS), g = Math.floor(y1 / TS) * W + Math.floor(x1 / TS);
  if (s === g) return []; const from = new Int32Array(W * A.h).fill(-1); from[s] = s; const q = [s];
  const open = i => A.fl[i] === 1;
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi]; if (i === g) break; const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= A.h) continue; const j = ny * W + nx;
      if (from[j] >= 0 || !open(j)) continue; if (dx && dy && (!open(y * W + nx) || !open(ny * W + x))) continue; // no cutting corners
      from[j] = i; q.push(j);
    }
  }
  if (from[g] < 0) return null; const out = []; for (let i = g; i !== s; i = from[i]) out.push({ x: (i % W) * TS + 8, y: ((i / W) | 0) * TS + 9 }); return out.reverse();
}
// where an exploring hero with nobody to follow goes next: the way down once it is open, else the nearest room still to clear
function exploreGoal(h) {
  const A = ARENA; if (A.stairs && A.stairs.open) return { x: A.stairs.x, y: A.stairs.y - 6 };
  let best = null, bd = 1e9; for (const r of A.rooms) { if (!r.waves || (G.clearMask & (1 << r.i))) continue; const x = (r.ix0 + r.ix1 + 1) / 2 * TS, y = (r.iy0 + r.iy1 + 1) / 2 * TS, d = dist(h.x, h.y, x, y) + (r.kind === 'end' && roomsLeft() > 1 ? 2000 : 0); if (d < bd) { bd = d; best = { x, y }; } }
  return best;
}
// a hero with nothing to fight: follows a player who steers by hand, or explores on its own; waits inside a shut room
function exploreAI(h, dt) {
  if (!G.me && NET.role !== 'client') { h.vx = damp(h.vx, 0, 10, dt); h.vy = damp(h.vy, 0, 10, dt); h.moving = false; return; } // heroes are still being chosen
  const A = ARENA, lead = G.heroes.find(o => o !== h && alive(o) && o.ctrl === 'player' && o.inp && o.inp.mv !== 2 && !o.away);
  let tx, ty, near;
  if (G.phase === 'fight' && A.cur) { const i = G.heroes.indexOf(h); tx = A.cx + (i - 1.5) * 18; ty = A.cy + 18 + (i % 2) * 8; near = 4; }
  else if (lead) { tx = lead.x; ty = lead.y; near = 20; }
  else { const t = exploreGoal(h); if (!t) { h.vx = damp(h.vx, 0, 10, dt); h.vy = damp(h.vy, 0, 10, dt); h.moving = false; return; } tx = t.x; ty = t.y; near = 4; }
  if (dist(h.x, h.y, tx, ty) < near) { h.vx = damp(h.vx, 0, 10, dt); h.vy = damp(h.vy, 0, 10, dt); h.moving = false; h.path = null; return; }
  const gk = Math.floor(tx / TS) + ',' + Math.floor(ty / TS);
  if (!h.path || h.pathTo !== gk || (h.pathT = (h.pathT || 0) - dt) <= 0) { h.path = findPath(h.x, h.y, tx, ty) || []; h.pathTo = gk; h.pathT = 0.6; }
  while (h.path.length && dist(h.x, h.y, h.path[0].x, h.path[0].y) < 7) h.path.shift();
  // aim past waypoints that are in plain sight, so the hero walks straight lines instead of tile steps
  let wp = h.path[0] || { x: tx, y: ty }; for (let k = Math.min(4, h.path.length - 1); k > 0; k--) { const p = h.path[k], [cx, cy] = clipToWalls(h.x, h.y, p.x, p.y, h.r); if (Math.abs(cx - p.x) < 1 && Math.abs(cy - p.y) < 1) { wp = p; break; } }
  steer(h, wp.x, wp.y, h.def.spd * (lead ? 1.15 : 0.95), dt, 0);
}
// rooms are hidden until someone walks in; a corridor shows once either of its rooms has been seen
function revealRooms() {
  const A = ARENA; if (!A || !A.rooms) return;
  for (const h of G.heroes) { if (h.dead) continue; for (const r of A.rooms) if (!r.seen && h.x > r.px0 && h.x < r.px1 && h.y > r.py0 && h.y < r.py1) { r.seen = true; if (G.mode === 'play') SFX.whoosh(0); } }
  for (const hl of A.halls) hl.seen = hl.A.seen || hl.B.seen;
}
function drawFog(c) {
  const A = ARENA; if (!A.rooms) return; c.fillStyle = '#070609';
  for (const hl of A.halls) if (!hl.seen) c.fillRect(hl.px0, hl.py0, hl.px1 - hl.px0, hl.py1 - hl.py0);
  for (const r of A.rooms) if (!r.seen) c.fillRect(r.px0, r.py0, r.px1 - r.px0, r.py1 - r.py0);
}
// shutters in the north and south walls (frames from the door sheet, shut to open); a portcullis seen edge-on in the side walls
function drawDoors(c) {
  const A = ARENA; if (!A.doors) return; const th = A.th;
  for (const d of A.doors) {
    if (d.k <= 0.02) continue; const k = d.k;
    if (d.side === 'N' || d.side === 'S') {
      const col = 1 + Math.round((1 - k) * 3);
      for (const [x, y] of d.cells) {
        if (d.side === 'N') { c.drawImage(IMG.doors, col * TS, th.door * TS, TS, TS, x * TS, (y - 1) * TS, TS, TS); c.drawImage(IMG.doors, col * TS, (th.door + 1) * TS, TS, TS, x * TS, y * TS, TS, TS); }
        else c.drawImage(IMG.doors, col * TS, (th.door + 1) * TS, TS, TS, x * TS, y * TS - 4, TS, TS);
      }
    } else {
      const x = d.cells[0][0], y0 = d.cells[0][1] * TS - 14, y1 = (d.cells[2][1] + 1) * TS, len = Math.round((y1 - y0) * k), gx = x * TS + (d.side === 'W' ? 7 : 5);
      c.fillStyle = '#1a1816'; c.fillRect(gx, y0, 4, len); c.fillStyle = '#6a625a'; c.fillRect(gx, y0, 1, len); c.fillStyle = '#9a9086';
      for (let yy = y0 + 3; yy < y0 + len - 2; yy += 5) c.fillRect(gx + 1, yy, 2, 1);
      c.fillStyle = '#2a2622'; c.fillRect(gx - 1, y0 + len - 2, 6, 2);
    }
  }
  const s = A.stairs; if (s && s.open) { const p = 0.5 + 0.5 * Math.sin(G.time * 3); c.globalAlpha = 0.25 + 0.2 * p; c.fillStyle = '#ffd27a'; c.fillRect(s.sx * TS + 8, (s.sy + 1) * TS + 10, TS * 2, 6); c.globalAlpha = 1; }
}
// the map in the corner: rooms seen so far, the ones still to clear, the way down, every hero
function drawMinimap(c, xr, y0) {
  const A = ARENA; if (!A || !A.rooms || G.training) return;
  const s = clamp(Math.min(VIEW.w, VIEW.h) / 430, 0.85, 1.3) * 1.25, x0 = Math.round(xr - A.w * s);
  c.globalAlpha = 0.9; c.fillStyle = 'rgba(8,7,10,0.62)'; c.fillRect(x0 - 5, y0 - 5, A.w * s + 10, A.h * s + 10);
  const R = (x0p, y0p, x1p, y1p) => c.fillRect(x0 + x0p / TS * s, y0 + y0p / TS * s, (x1p - x0p) / TS * s, (y1p - y0p) / TS * s);
  c.fillStyle = '#3e362f'; for (const hl of A.halls) if (hl.seen) { if (hl.dir === 'h') R(hl.px0, (hl.y0) * TS, hl.px1, (hl.y0 + 3) * TS); else R(hl.x0 * TS, hl.py0, (hl.x0 + 3) * TS, hl.py1); }
  for (const r of A.rooms) {
    if (!r.seen) continue; const done = G.clearMask & (1 << r.i), cur = G.roomI === r.i;
    c.fillStyle = cur ? '#c0503a' : !r.waves || done ? '#6e6256' : r.kind === 'end' ? '#8a3a30' : '#7a5040'; R(r.ix0 * TS, r.iy0 * TS, (r.ix1 + 1) * TS, (r.iy1 + 1) * TS);
  }
  const st = A.stairs; if (st && A.rooms[st.room].seen) { c.fillStyle = st.open ? '#ffd860' : '#2a2420'; const p = st.open ? 1 + 0.4 * Math.sin(G.time * 5) : 1; c.fillRect(x0 + st.x / TS * s - 2 * p, y0 + (st.y - 12) / TS * s - 2 * p, 4 * p, 4 * p); }
  for (const h of G.heroes) { if (h.dead) continue; const k = COL[h.def.col] || COL.white, me = h === G.me; c.fillStyle = me ? '#ffffff' : `rgb(${k})`; const z = me ? 4 : 3; c.fillRect(Math.round(x0 + h.x / TS * s - z / 2), Math.round(y0 + h.y / TS * s - z / 2), z, z); }
  c.globalAlpha = 1;
}
