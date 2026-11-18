// ===================== arrows that stay: in him, in the walls, on the floor =====================
// An arrow that hits a hero stays in him (53_foes, the arrows' flight): where it struck, on the side it came from, at
// about the height it flew, its head in him and four or five pixels of shaft and fletching out of him, tilted as it
// flew. Up to five at once (a sixth knocks the oldest out); each works loose after eight seconds and drops to the floor;
// a roll knocks one or two out, a flask drunk pulls them all. The chainmail turns arrows (they glance off it with a
// spark); the gambeson catches them in its padding; one his guard stops drops at his feet. A parried arrow or a sling
// stone never sticks. Dead, he keeps them. They are drawn on him in his own sprite's pixels (70_render drawUnit), so
// they go with him: walking, kneeling, rolling, lying.
// An arrow that misses goes into the wall or the pillar it meets and stays there for the rest of the floor (past forty,
// the oldest goes); one that flies out its range drops and lies on the floor.
const ARROWS = { max: 5, life: 8, walls: 40 }, ARROW_COL = { shaft: '#5e4630', fletch: '#f0ece2', head: '#9aa2ad', wound: '#7a0c14' }; // (a dark shaft, so it reads on the floor and on him)
// his body's edge on one side, at a row of his sprite (his own pixels, without his weapon): where an arrow strikes
function bodyEdge(spr, y, side) {
  const m = MOBS[spr], Wc = WEAPON[spr], fw = m[1], D = Wc ? (Wc.cutPD = Wc.cutPD || pixelData(Wc.cut)) : PIX.mobs, oy = Wc ? 0 : m[0];
  let best = null; for (let x = 0; x < fw; x++) { const i = ((oy + y) * D.w + x) * 4; if (D.d[i + 3] > 128 && (best === null || (side > 0 ? x > best : x < best))) best = x; }
  return best;
}
// (53_foes) an enemy arrow p has met him; was: his health and armour just before the blow
function arrowHit(h, p, was) {
  if (was.mail > 0) { sparks(p.x, p.y, p.z || 7, 4, 'white', 70, 50); SFX.clink(rand(3000, 4200), 0.12, panOf(h.x), 0); return; } // (turned by the mail)
  if (!(h.hp < was.hp || (h.gamb || 0) < was.gamb || (h.dead && !was.dead))) { arrowDrop(h.x, h.y, p.z || 7, Math.atan2(p.vy, p.vx), -p.vx * 0.15, -p.vy * 0.15); return; } // (his guard stopped it)
  const m = MOBS[h.spr]; if (!m) return; const fw = m[1], foot = footOf(h.spr), fs = h.face < 0 ? -1 : 1, a = Math.atan2(p.vy, p.vx);
  let cx = Math.cos(a); if (Math.abs(cx) < 0.3) cx = chance(0.5) ? 0.3 : -0.3;
  const side = -Math.sign(cx) * fs, tilt = clamp(-Math.sin(a) * 0.6, -0.6, 0.6); // (sprite space: the shaft out the way it came, tilted toward the archer)
  for (let k = 0; k < 6; k++) {
    const y = foot - clamp(Math.round((p.z || 7) + rand(-3, 4)), 3, 12), x = bodyEdge(h.spr, y, side); if (x === null) continue;
    (h.arrows = h.arrows || []).push({ px: x - fw / 2, py: y - foot - 1, side, tilt, L: randi(4, 5), t: 0 });
    if (h.arrows.length > ARROWS.max) arrowsOut(h, 1);
    return;
  }
}
// the oldest n of them out of him: they drop, turning, bounce once and lie on the floor
function arrowsOut(h, n) {
  const fs = h.face < 0 ? -1 : 1;
  for (let i = 0; i < n && h.arrows && h.arrows.length; i++) { const A = h.arrows.shift(); arrowDrop(h.x + (A.px + A.side * 2) * fs, h.y, (h.z || 0) - A.py, A.side * fs > 0 ? 0 : Math.PI, A.side * fs * rand(10, 30), rand(-8, 8)); }
}
function arrowDrop(x, y, z, a, vx = 0, vy = 0) { part({ k: 'arrowbit', x, y, z, vx, vy, vz: rand(20, 50), life: 6, s0: 1, a, va: rand(-14, 14) }); }
function arrowsTick(h, dt) { // (52_hero) they work loose
  if (!h.arrows || !h.arrows.length || h.dead) return; for (const A of h.arrows) A.t += dt;
  while (h.arrows.length && h.arrows[0].t > ARROWS.life) arrowsOut(h, 1);
}
// (70_render drawUnit, in his sprite's own pixels, after his body) the arrows in him
function drawStuck(c, u, dip, cut, foot) {
  for (const A of u.arrows) {
    const lift = A.py < cut - foot - 1 ? dip : 0, y0 = A.py + lift; if (bleeds(u)) { c.fillStyle = ARROW_COL.wound; c.fillRect(A.px, y0, 1, 1); }
    for (let i = 1; i <= A.L; i++) { c.fillStyle = i >= A.L - 1 ? ARROW_COL.fletch : ARROW_COL.shaft; c.fillRect(A.px + A.side * i, y0 + Math.round(A.tilt * i), 1, 1); }
  }
}
// an arrow lying on the floor (painted onto it): its head, its shaft, its fletching, along a
function floorArrow(x, y, a) {
  const cx = Math.cos(a), cy = Math.sin(a) * 0.5; x = Math.round(x); y = Math.round(y);
  groundPaint(x - 7, y - 4, x + 7, y + 4, g => { for (let i = 0; i < 6; i++) { g.fillStyle = i === 0 ? ARROW_COL.head : i >= 4 ? ARROW_COL.fletch : ARROW_COL.shaft; g.fillRect(x + Math.round(cx * (2.5 - i)), y + Math.round(cy * (2.5 - i)), 1, 1); } });
}
// an arrow in a wall or a pillar: its head in the stone, its shaft out the way it came (foreshortened as it points
// out at us), drawn in depth among everything else (70_render)
function wallArrow(x, y, z, a) {
  const A = ARENA; (A.warrows = A.warrows || []).push({ x: Math.round(x), y, z: Math.round(z), a }); if (A.warrows.length > ARROWS.walls) A.warrows.shift();
  smoke(x, y, 1, 'dust', 4, 6, 0.5, 4); SFX.tick(panOf(x)); SFX.stride(panOf(x), 0, false);
}
function drawWallArrow(c, w) {
  const cx = -Math.cos(w.a), cy = -Math.sin(w.a) * 0.5, y0 = Math.round(w.y - w.z);
  for (let i = 1; i <= 5; i++) { c.fillStyle = i >= 4 ? ARROW_COL.fletch : ARROW_COL.shaft; c.fillRect(w.x + Math.round(cx * i), y0 + Math.round(cy * i), 1, 1); }
}
