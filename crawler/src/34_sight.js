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
// light sources that reveal what they shine on: wall torches and braziers, the ones burning (a dead one is lit later: 36_works)
const lampK = () => (ARENA && ARENA.th.sheet === 'crypt' ? 0.7 * (1 - 0.3 * (G.lampDim || 0)) : 1); // (the crypt's dark: the hero's lamp reaches less far, 70_render too; less again while the Shade is close: 43_crypt lampDimTick)
function staticLights(A) { if (!A.lights) A.lights = lavaLights(A).concat(minesLamps(A)).concat(A.torches.filter(t => !t.out).map(t => ({ x: t.x, y: t.y + 10, r: t.candles ? 30 + 28 * (t.cf === undefined ? 1 : t.cf) : 58 })).concat((A.candles || []).filter(c => c.lit && !c.torch).map(c => ({ x: c.x + 1, y: c.yb + 2, r: 22 }))).concat(A.props.filter(p => p.kind === 'brazier' && !p.dead && !p.out).map(p => ({ x: p.x, y: p.y, r: 80 })))); return A.lights; }
// which tiles the fixed lights reach, worked out once per floor
function staticLit(A) {
  if (A.slit && !(isMagma(A) && A.slitV !== (A.flv || 0))) return A.slit; if (isMagma(A)) { A.lights = null; A.slitV = A.flv || 0; } /* (the lava is a light: where it lies changes as floors fall in and lakes crust over, 42_magma) */ const s = A.slit = new Uint8Array(A.w * A.h);
  if (isMagma(A)) { s.fill(1); for (const r of A.rooms) if (r.dark && (A.torches.some(t => t.out && t.room === r.i) || A.props.some(p => p.kind === 'brazier' && p.out && !p.dead && p.room === r.i))) for (let y = r.fy0; y <= r.fy1; y++) for (let x = r.fx0; x <= r.fx1; x++) s[y * A.w + x] = 0; } /* (the magma depths glow of themselves: whatever is in view is seen, lamp or no lamp, so no black tile stands between his lamp's reach and a pool's; all but a room gone dark, till its fires are lit) */
  for (const L of staticLights(A)) { const R = Math.ceil(L.r / TS); for (let y = Math.floor(L.y / TS) - R; y <= Math.floor(L.y / TS) + R; y++) for (let x = Math.floor(L.x / TS) - R; x <= Math.floor(L.x / TS) + R; x++) if (x >= 0 && y >= 0 && x < A.w && y < A.h && dist(L.x, L.y, x * TS + 8, y * TS + 8) < L.r) s[y * A.w + x] = 1; }
  return s;
}
function litTile(A, tx, ty, lamps) {
  if (tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return false; if (A.slit[ty * A.w + tx]) return true;
  const x = tx * TS + 8, y = ty * TS + 8; for (const h of lamps) if (dist(h.x, h.y, x, y) < h.lightR * (h.team === 'hero' ? lampK() : 1)) return true; return false;
}
function updateSight(dt) {
  const A = ARENA; if (!A || !A.mem) return; if ((SIGHT.t -= dt) > 0) return; SIGHT.t = 0.08;
  // a fallen hero's lamp still burns, so whoever killed him stays in sight
  const W = A.w, H = A.h, vis = A.vis, lamps = G.eyes ? G.heroes.concat(G.eyes) : G.heroes; staticLit(A); vis.fill(0); let fresh = 0; const MG = isMagma(A);
  // a seen tile is remembered in full; the tiles around it get a half-dim band, so memory ends in a softer pixel step
  const S = A.secret, D = A.memId.data, paint = (i, a) => { const o = i * 4; if (D[o + 3] >= a || S && S[i]) return; D[o] = 46; D[o + 1] = 40; D[o + 2] = 52; D[o + 3] = a; };
  const see = i => { if (vis[i] || S && S[i]) return; /* (a hidden wing: not till its wall is broken, 30_arena) */ vis[i] = 1; if (!A.mem[i]) { A.mem[i] = 1; fresh++; paint(i, 255); const x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) paint(Y * W + X, 96); } } };
  for (const h of lamps) { // (and a sluice's view: 37_levels)
    const hx = h.x / TS, hy = (h.y - 4) / TS, R = h.eyeR || SIGHT.R;
    for (let k = 0; k < 120; k++) {
      const a = k / 120 * TAU, dx = Math.cos(a) * 0.35, dy = Math.sin(a) * 0.35;
      let x = hx, y = hy;
      for (let s = 0; s < R / 0.35; s++) {
        x += dx; y += dy; const tx = Math.floor(x), ty = Math.floor(y); if (tx < 0 || ty < 0 || tx >= W || ty >= H) break;
        const i = ty * W + tx, solid = A.fl[i] === 0 && !openAt(x * TS, y * TS); // (a wall piece's floor lets sight on: 31_walls)
        if (litTile(A, tx, ty, lamps) || solid && litTile(A, tx, ty + 1, lamps)) { const was = vis[i]; see(i); if (solid && ty > 0 && A.fl[i - W] === 0) see(i - W); // a north wall's face hides its rim: both are seen
          if (MG && !solid && !was) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = i + dy * W + dx; if (A.fl[j] === 0) { see(j); if (dy < 0 && A.fl[j - W] === 0) see(j - W); } } } // (the magma's, seen by its own glow as far as the eye goes: a floor in view shows the walls it lies against, which a ray along a wall's foot never strikes far off)
        if (solid) break;
      }
    }
    // the hero's own tile and the walls right around it, always
    const tx = Math.floor(hx), ty = Math.floor(h.y / TS); for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const X = tx + xx, Y = ty + yy; if (X >= 0 && Y >= 0 && X < W && Y < H) see(Y * W + X); }
  }
  if (fresh) { A.memN += fresh; A.memCx.putImageData(A.memId, 0, 0); }
}
// the floor's map read (53_foes): all of the floor remembered at once, as if seen, with its walls (to two tiles above any
// floor, a north wall's top behind its face) and the soft edge round it
function revealFloor(A) {
  const W = A.w, H = A.h, D = A.memId.data, S = A.secret, open = (x, y) => x >= 0 && y >= 0 && x < W && y < H && A.fl[y * W + x] !== 0 && !(S && S[y * W + x]); let n = 0;
  const paint = (i, a) => { const o = i * 4; if (D[o + 3] >= a || S && S[i]) return; D[o] = 46; D[o + 1] = 40; D[o + 2] = 52; D[o + 3] = a; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (A.mem[i] || S && S[i]) continue; let near = false; for (let dy = -1; dy <= 2 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (open(x + dx, y + dy)) { near = true; break; }
    if (near) { A.mem[i] = 1; n++; paint(i, 255); }
  }
  for (let i = 0; i < W * H; i++) if (!A.mem[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && A.mem[Y * W + X]) paint(i, 96); } }
  A.memN += n; A.memCx.putImageData(A.memId, 0, 0);
}
const tileVisible = (x, y) => { const A = ARENA; if (!A || !A.vis) return true; const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx >= 0 && ty >= 0 && tx < A.w && ty < A.h && A.vis[ty * A.w + tx] === 1; };
// a foe is drawn while the party sees where it stands (or it is right next to a hero)
function foeShown(u) { if (u.team === 'hero' || u.feed || u.script) return true; if (tileVisible(u.x, u.y - 2)) return true; for (const h of G.heroes) if (dist(h.x, h.y, u.x, u.y) < (h.dead ? 70 : 22)) return true; return false; } // (round a hero lying dead, whoever is at him or watching shows: 48_deaths)
// remembered tiles as a mask over a buffer drawn in world pixels from (ox, oy): what was never seen goes black
function maskToMemory(c, ox, oy, op) {
  const A = ARENA; if (!A || !A.memCv) return; c.save(); c.setTransform(1, 0, 0, 1, -ox, -oy); c.imageSmoothingEnabled = false; c.globalCompositeOperation = op; c.globalAlpha = 1;
  c.drawImage(A.memCv, 0, 0, A.w * TS, A.h * TS); c.restore();
}
