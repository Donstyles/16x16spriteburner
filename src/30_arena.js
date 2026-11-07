// ===================== the arena: one cellar room per floor, built from the FG_Cellar tileset =====================
const THEMES = {
  brown: { fy: 0, floors: [[10, 1], [10, 1], [10, 1], [10, 1], [10, 3], [11, 1], [12, 1], [13, 3], [14, 1], [15, 3]], pillar: [[21, 5], [23, 5]], stairs: 19, rune: [27, 7], amb: [92, 78, 70] },
  grey: { fy: 7, floors: [[10, 9], [10, 9], [10, 9], [10, 9], [10, 11], [11, 9], [12, 9], [13, 11], [14, 9], [15, 11]], pillar: [[21, 2], [23, 2]], stairs: 16, rune: [27, 4], amb: [60, 66, 88] },
};
const FLOOR_NAMES = ['THE ROOT CELLAR', 'THE SALT VAULT', 'THE DROWNED STORES', 'THE BONE PANTRY', 'THE ASHEN KILN', 'THE WINE CRYPT', 'THE GRAIN TOMB', 'THE IRON LARDER', 'THE HOLLOW CISTERN', 'THE ROTTED GRANARY', 'THE BLACK BREWERY', 'THE DEEP MILL', 'THE SCREAMING SILO', 'THE LAST LARDER'];
let ARENA = null;
function tileAt(g, tx, ty, dx, dy) { g.drawImage(IMG.cellar, tx * TS, ty * TS, TS, TS, dx, dy, TS, TS); }
function buildArena(floor) {
  const th = floor % 2 ? THEMES.brown : THEMES.grey;
  const W = randi(22, 26), H = randi(14, 16);
  const cv = mkCanvas(W * TS, H * TS), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#121418'; g.fillRect(0, 0, cv.width, cv.height);
  for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const f = pick(th.floors); tileAt(g, f[0], f[1], x * TS, y * TS); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const fx = x === 0 ? 5 : x === W - 1 ? 7 : 6, fy = y === 0 ? 0 : y === 1 ? 1 : y === H - 1 ? 3 : 2;
    if (fx === 6 && fy === 2) continue; tileAt(g, fx, fy + th.fy, x * TS, y * TS);
  }
  const A = ARENA = { w: W, h: H, pw: W * TS, ph: H * TS, th, ground: cv, g, props: [], torches: [], runes: [], x0: TS + 5, x1: (W - 1) * TS - 5, y0: 2 * TS + 4, y1: (H - 1) * TS - 3, name: FLOOR_NAMES[(floor - 1) % FLOOR_NAMES.length] };
  // the stairway we came down, in the north wall
  const sx = Math.floor(W / 2) - 1; for (let i = 0; i < 3; i++) { tileAt(g, th.stairs + i, 12, (sx + i) * TS, 0); tileAt(g, th.stairs + i, 13, (sx + i) * TS, TS); }
  const used = new Set([sx, sx + 1, sx + 2]);
  // torches and banners along the north wall
  for (let x = 2; x < W - 2; x += 4) { const tx = x + (used.has(x) ? 3 : 0); if (tx >= W - 1 || used.has(tx)) continue; used.add(tx); A.torches.push({ x: tx * TS + 8, y: TS + 9, tx, f: randi(0, 3) }); }
  for (let x = 2; x < W - 2; x++) { if (used.has(x) || used.has(x - 1) || used.has(x + 1) || !chance(0.35)) continue; const b = randi(20, 31); tileAt(g, b, 0, x * TS, 0); tileAt(g, b, 1, x * TS, TS); used.add(x); }
  // summoning runes on the floor (where monsters come through)
  const rp = [[0.2, 0.3], [0.8, 0.3], [0.5, 0.42], [0.2, 0.82], [0.8, 0.82], [0.5, 0.9]];
  for (const [fx, fy] of rp) { const tx = Math.round(1 + fx * (W - 3)), ty = Math.round(2 + fy * (H - 4)); tileAt(g, th.rune[0], th.rune[1], tx * TS, ty * TS); A.runes.push({ x: tx * TS + 8, y: ty * TS + 8, glow: 0 }); }
  // pillars (three tiles tall, solid at the base)
  const pat = randi(0, 2), P = th.pillar[randi(0, 1)];
  const spots = pat === 0 ? [[0.27, 0.42], [0.73, 0.42], [0.27, 0.76], [0.73, 0.76]] : pat === 1 ? [[0.2, 0.45], [0.5, 0.45], [0.8, 0.45], [0.2, 0.8], [0.5, 0.8], [0.8, 0.8]] : [[0.35, 0.55], [0.65, 0.55]];
  for (const [fx, fy] of spots) { const tx = Math.round(1 + fx * (W - 3)), ty = Math.max(5, Math.round(2 + fy * (H - 4))); A.props.push({ kind: 'pillar', tile: P, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 6, solid: true, hp: 1e9 }); }
  // barrels, sacks and crates crowd the corners; chests sit by the walls
  const corner = (cx, cy) => { for (let i = 0; i < randi(2, 4); i++) { const tx = clamp(cx + randi(-1, 1), 1, W - 2), ty = clamp(cy + randi(-1, 1), 2, H - 2); if (A.props.some(p => Math.abs(p.x - (tx * TS + 8)) < 10 && Math.abs(p.y - (ty * TS + 14)) < 10)) continue; const t = pick([[24, 8], [25, 8], [26, 8], [27, 8], [22, 8], [28, 8], [30, 8]]); A.props.push({ kind: t[0] >= 28 ? 'chest' : 'barrel', tile: t, x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 5, solid: true, hp: 40 }); } };
  corner(1, 2); corner(W - 2, 2); corner(1, H - 2); corner(W - 2, H - 2);
  // braziers in two corners light the room
  for (const [tx, ty] of [[2, H - 3], [W - 3, 3]]) A.props.push({ kind: 'brazier', x: tx * TS + 8, y: ty * TS + 14, cy: ty * TS + 10, r: 5, solid: true, hp: 1e9, f: randi(0, 3) });
  return A;
}
function inArena(x, y) { return ARENA && x > ARENA.x0 - 4 && x < ARENA.x1 + 4 && y > ARENA.y0 - 8 && y < ARENA.y1 + 4; }
function nearestSolid(x, y, r) { for (const p of ARENA.props) if (p.solid && !p.dead && dist(x, y, p.x, p.cy) < r + p.r) return p; return null; }
