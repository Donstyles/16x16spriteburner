// ===================== crawling: walls, paths, sight lines, doors, the map ========================
// a unit-sized box fits here without touching a wall
function boxFree(x, y, r) { const hw = Math.max(3, r * 0.8), hh = Math.max(2, r * 0.45); for (const [px, py] of [[x - hw, y - hh], [x + hw, y - hh], [x - hw, y + hh], [x + hw, y + hh]]) if (blockAt(px, py)) return false; return true; }
// the farthest point along a straight move that does not end inside a wall (dashes and leaps never pass through stone)
function clipToWalls(x0, y0, x1, y1, r) {
  if (!ARENA || !ARENA.fl) return [x1, y1]; const d = dist(x0, y0, x1, y1), n = Math.max(1, Math.ceil(d / 3)); let lx = x0, ly = y0;
  for (let i = 1; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); if (!boxFree(x, y, r)) break; lx = x; ly = y; }
  return [lx, ly];
}
// breadth-first search over floor tiles; the path is a list of tile centres, start excluded
function findPath(x0, y0, x1, y1) {
  if (!Number.isFinite(x0 + y0 + x1 + y1)) return null; // no real place to go: no path (it would never end)
  const A = ARENA, W = A.w, s = footTile(x0, y0), g = footTile(x1, y1); // (a wall's open edge counts as the floor beside it)
  if (s === g) return []; const from = new Int32Array(W * A.h).fill(-1); from[s] = s; const q = [s];
  const open = i => FLOOR(A.fl[i]);
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi]; if (i === g) break; const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= A.h) continue; const j = ny * W + nx;
      if (from[j] >= 0 || !open(j)) continue; if (dx && dy && (!open(y * W + nx) || !open(ny * W + x))) continue; // no cutting corners
      from[j] = i; q.push(j);
    }
  }
  if (!(from[g] >= 0)) return null; const out = []; for (let i = g, n = 0; i !== s && n < W * A.h; i = from[i], n++) out.push({ x: (i % W) * TS + 8, y: ((i / W) | 0) * TS + 9 }); return out.reverse();
}
// a straight line between two points crosses no wall (sight, shots, alarms)
function lineOfSight(x0, y0, x1, y1) {
  const d = dist(x0, y0, x1, y1), n = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i < n; i++) if (solidAt(lerp(x0, x1, i / n), lerp(y0, y1, i / n))) return false;
  return true;
}
// blast doors in the north walls (frames from the door sheet, shut to open: each door one of the sheet's three motifs, door and
// strut in the floor's colour, grey or brown); a portcullis seen edge-on in the side walls
function drawDoors(c) {
  const A = ARENA; if (!A.doors) return; const th = A.th;
  for (const d of A.doors) {
    if (d.k <= 0.02) continue; const k = d.k;
    if (d.side === 'N' || d.side === 'S') {
      const col = 1 + Math.round((1 - k) * 3) + (d.motif || 0); // (its motif: the cross, the chevron or the emblem, in the floor's colour)
      if (d.side === 'S') continue; // (a south doorway's blast door is drawn among the units: drawSouthDoor)
      for (const [x, y] of d.cells) { c.drawImage(IMG.doors, col * TS, th.door * TS, TS, TS, x * TS, (y - 1) * TS, TS, TS); c.drawImage(IMG.doors, col * TS, (th.door + 1) * TS, TS, TS, x * TS, y * TS, TS, TS); }
    } else {
      // the portcullis stands in the wall line: up past the brick face to the corner post above the doorway, down to the corner
      // post below it. Both posts stand in front of it in the tileset's perspective, so they are drawn again over its two ends
      const x = d.cells[0][0], ty = d.cells[0][1], y0 = (ty - 1) * TS - 4, y1 = (d.cells[2][1] + 1) * TS + 6, len = Math.round((y1 - y0) * k), gx = x * TS + (d.side === 'W' ? 7 : 5);
      c.fillStyle = '#1a1816'; c.fillRect(gx, y0, 4, len); c.fillStyle = '#6a625a'; c.fillRect(gx, y0, 1, len); c.fillStyle = '#9a9086';
      for (let yy = y0 + 3; yy < y0 + len - 2; yy += 5) c.fillRect(gx + 1, yy, 2, 1);
      c.fillStyle = '#2a2622'; c.fillRect(gx - 1, y0 + len - 2, 6, 2);
      for (const cy of [ty - 2, d.cells[2][1] + 1]) drawGround(c, x * TS, cy * TS, TS, TS);
    }
  }
  const s = A.stairs; if (s && s.open) { const p = 0.5 + 0.5 * Math.sin(G.time * 3); c.globalAlpha = 0.25 + 0.2 * p; c.fillStyle = '#ffd27a'; c.fillRect(s.sx * TS + 8, (s.sy + 1) * TS + 10, TS * 2, 6); c.globalAlpha = 1; }
}
// The strut across the top of a blast door stays when the door is up (the frames' top rows: the bar and its dark
// underside). It is drawn among the units by depth, the depth of the wall's face where it meets the floor: whoever walks
// through the doorway passes under it, whoever stands in the room in front of the wall stays in front of it.
const STRUTS = d => d.side === 'N' ? [(d.cells[0][1] + 1) * TS, 6, d] : null;
function drawStrut(c, d) { const th = ARENA.th, sx = (4 + (d.motif || 0)) * TS; for (const [x, y] of d.cells) c.drawImage(IMG.doors, sx, th.door * TS, TS, 11, x * TS, (y - 1) * TS, TS, 11); strutEnds(c, d, sx, th.door * TS + 3, (d.cells[0][1] - 1) * TS + 3); }
// the bar's two ends run one pixel on into the posts beside the doorway, over the posts' dark outline, so the strut joins
// the trim instead of stopping short against a dark edge (the outline stays above and below it)
function strutEnds(c, d, sx, sy, dy) { const xs = d.cells.map(q => q[0]), x0 = Math.min(...xs), x1 = Math.max(...xs); c.drawImage(IMG.doors, sx, sy, 1, 8, x0 * TS - 1, dy, 1, 8); c.drawImage(IMG.doors, sx + TS - 1, sy, 1, 8, (x1 + 1) * TS, dy, 1, 8); }
// a blast door in a south doorway: the same frames (we see its south face, as with a north wall's), hung from the top of
// the south wall, where its strut runs, and reaching down over the doorway and the corridor's first row; drawn among the
// units by the depth of its foot, so whoever is in the corridor in front of it stands in front of it
function drawSouthDoor(c, d) { const th = ARENA.th, col = 1 + Math.round((1 - d.k) * 3) + (d.motif || 0); for (const [x, y] of d.cells) { c.drawImage(IMG.doors, col * TS, th.door * TS, TS, TS, x * TS, y * TS - 3, TS, TS); c.drawImage(IMG.doors, col * TS, (th.door + 1) * TS, TS, TS, x * TS, (y + 1) * TS - 3, TS, TS); } }
// now and then a south doorway (which has no door) has a strut across it too: the same bar (the sheet has none seen from
// behind), along the top of the south wall at the ceiling, over everyone passing under it (drawn with the ceiling)
function drawSouthStruts(c) { const A = ARENA; if (!A.doors) return; for (const d of A.doors) if (d.side === 'N') strutEnds(c, d, (4 + (d.motif || 0)) * TS, A.th.door * TS + 3, (d.cells[0][1] - 1) * TS + 3); /* (a north strut's two ends again, over the ceiling: the posts' dark outline is part of the ceiling's trim) */ for (const d of A.doors) if (d.side === 'S' && d.strut) { const sx = (4 + (d.motif || 0)) * TS; for (const [x, y] of d.cells) c.drawImage(IMG.doors, sx, A.th.door * TS + 3, TS, 8, x * TS, y * TS, TS, 8); strutEnds(c, d, sx, A.th.door * TS + 3, d.cells[0][1] * TS); } }
// the map in the corner: every tile the party has seen, where it came down, the way down once the map is read, every hero
let MINI = null;
function drawMinimap(c, xr, y0) {
  const A = ARENA; if (!A || !A.mem) return;
  if (!MINI || MINI.A !== A || MINI.n !== A.memN + (A.flv || 0) * 1e6) { // redrawn only when the party has seen something new (or a cistern drained)
    const cv = MINI && MINI.A === A ? MINI.cv : mkCanvas(A.w, A.h), x = cv.getContext('2d'), id = x.createImageData(A.w, A.h), d = id.data;
    for (let i = 0; i < A.w * A.h; i++) { if (!A.mem[i]) continue; const v = A.fl[i], f = v === 1 || v === 3, w = v === 2, pt = v === PIT, o = i * 4; d[o] = pt ? 16 : w ? 52 : f ? 118 : 58; d[o + 1] = pt ? 14 : w ? 96 : f ? 104 : 50; d[o + 2] = pt ? 20 : w ? 150 : f ? 92 : 46; d[o + 3] = f || w || pt ? 230 : 200; } // water blue
    x.putImageData(id, 0, 0); MINI = { A, n: A.memN + (A.flv || 0) * 1e6, cv };
  }
  const s = Math.min(clamp(Math.min(VIEW.w, VIEW.h) / 430, 0.85, 1.3) * 1.5, 170 / A.w), w = A.w * s, h = A.h * s, x0 = Math.round(xr - w); // (no wider than 170 px, however big the floor)
  c.globalAlpha = 0.85; c.fillStyle = 'rgba(8,7,10,0.6)'; c.fillRect(x0 - 4, y0 - 4, w + 8, h + 8);
  c.imageSmoothingEnabled = false; c.drawImage(MINI.cv, x0, y0, w, h);
  // where the party came down (dark violet), and the way down once the floor's map is read (yellow: 53_foes)
  const dot = (x, y, col) => { c.fillStyle = col; c.fillRect(Math.round(x0 + x / TS * s) - 2, Math.round(y0 + (y - 12) / TS * s) - 2, 4, 4); };
  if (A.spawn) dot(A.spawn.x, (A.start.fy0 + 2) * TS + 2, '#6c3aa6');
  const st = A.stairs; if (st && A.mapRead) dot(st.x, st.y, '#ffd860');
  for (const h of G.heroes) { if (h.dead) continue; c.fillStyle = h === G.me ? '#ffffff' : '#9fd0ff'; c.fillRect(Math.round(x0 + h.x / TS * s) - 2, Math.round(y0 + h.y / TS * s) - 2, 4, 4); }
  c.globalAlpha = 1;
}
