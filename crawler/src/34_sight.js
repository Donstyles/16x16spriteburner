// ===================== sight: what the party sees now, and what it remembers =====================
// The dungeon is dark. Rays from every hero find what is in view; a tile in view counts as seen when light falls on it,
// from the hero's own lamp or a torch or brazier burning nearby. Seen tiles are remembered and stay faintly visible after
// the party moves on; tiles never seen stay black, and no light or effect is allowed to show there. Foes are only drawn
// while they stand somewhere the party can see right now.
const SIGHT = { t: 0, R: 10 };
function initSight(A) {
  A.mem = new Uint8Array(A.w * A.h); A.vis = new Uint8Array(A.w * A.h); A.memN = 0;
  A.memCv = mkCanvas(A.w, A.h); A.memCx = A.memCv.getContext('2d'); A.memId = A.memCx.createImageData(A.w, A.h);
  SIGHT.t = 0;
}
// light sources that reveal what they shine on: wall torches and braziers (always lit for now)
function staticLights(A) { if (!A.lights) A.lights = A.torches.map(t => ({ x: t.x, y: t.y + 10, r: 58 })).concat(A.props.filter(p => p.kind === 'brazier' && !p.dead).map(p => ({ x: p.x, y: p.y, r: 80 }))); return A.lights; }
// which tiles the fixed lights reach, worked out once per floor
function staticLit(A) {
  if (A.slit) return A.slit; const s = A.slit = new Uint8Array(A.w * A.h);
  for (const L of staticLights(A)) { const R = Math.ceil(L.r / TS); for (let y = Math.floor(L.y / TS) - R; y <= Math.floor(L.y / TS) + R; y++) for (let x = Math.floor(L.x / TS) - R; x <= Math.floor(L.x / TS) + R; x++) if (x >= 0 && y >= 0 && x < A.w && y < A.h && dist(L.x, L.y, x * TS + 8, y * TS + 8) < L.r) s[y * A.w + x] = 1; }
  return s;
}
function litTile(A, tx, ty, lamps) {
  if (tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return false; if (A.slit[ty * A.w + tx]) return true;
  const x = tx * TS + 8, y = ty * TS + 8; for (const h of lamps) if (dist(h.x, h.y, x, y) < h.lightR) return true; return false;
}
function updateSight(dt) {
  const A = ARENA; if (!A || !A.mem) return; if ((SIGHT.t -= dt) > 0) return; SIGHT.t = 0.08;
  // a fallen hero's lamp still burns, so whoever killed him stays in sight
  const W = A.w, H = A.h, vis = A.vis, lamps = G.heroes; staticLit(A); vis.fill(0); let fresh = 0;
  // a seen tile is remembered in full; the tiles around it get a half-dim band, so memory ends in a softer pixel step
  const D = A.memId.data, paint = (i, a) => { const o = i * 4; if (D[o + 3] >= a) return; D[o] = 66; D[o + 1] = 58; D[o + 2] = 72; D[o + 3] = a; };
  const see = i => { if (vis[i]) return; vis[i] = 1; if (!A.mem[i]) { A.mem[i] = 1; fresh++; paint(i, 255); const x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) paint(Y * W + X, 96); } } };
  for (const h of G.heroes) {
    const hx = h.x / TS, hy = (h.y - 4) / TS, R = SIGHT.R;
    for (let k = 0; k < 120; k++) {
      const a = k / 120 * TAU, dx = Math.cos(a) * 0.35, dy = Math.sin(a) * 0.35;
      let x = hx, y = hy;
      for (let s = 0; s < R / 0.35; s++) {
        x += dx; y += dy; const tx = Math.floor(x), ty = Math.floor(y); if (tx < 0 || ty < 0 || tx >= W || ty >= H) break;
        const i = ty * W + tx, solid = A.fl[i] === 0;
        if (litTile(A, tx, ty, lamps) || solid && litTile(A, tx, ty + 1, lamps)) { see(i); if (solid && ty > 0 && A.fl[i - W] === 0) see(i - W); } // a north wall's face hides its rim: both are seen
        if (solid) break;
      }
    }
    // the hero's own tile and the walls right around it, always
    const tx = Math.floor(hx), ty = Math.floor(h.y / TS); for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const X = tx + xx, Y = ty + yy; if (X >= 0 && Y >= 0 && X < W && Y < H) see(Y * W + X); }
  }
  if (fresh) { A.memN += fresh; A.memCx.putImageData(A.memId, 0, 0); }
}
const tileVisible = (x, y) => { const A = ARENA; if (!A || !A.vis) return true; const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx >= 0 && ty >= 0 && tx < A.w && ty < A.h && A.vis[ty * A.w + tx] === 1; };
// a foe is drawn while the party sees where it stands (or it is right next to a hero)
function foeShown(u) { if (u.team === 'hero') return true; if (tileVisible(u.x, u.y - 2)) return true; for (const h of G.heroes) if (!h.dead && dist(h.x, h.y, u.x, u.y) < 22) return true; return false; }
// remembered tiles as a mask over a buffer drawn in world pixels from (ox, oy): what was never seen goes black
function maskToMemory(c, ox, oy, op) {
  const A = ARENA; if (!A || !A.memCv) return; c.save(); c.setTransform(1, 0, 0, 1, -ox, -oy); c.imageSmoothingEnabled = false; c.globalCompositeOperation = op; c.globalAlpha = 1;
  c.drawImage(A.memCv, 0, 0, A.w * TS, A.h * TS); c.restore();
}
