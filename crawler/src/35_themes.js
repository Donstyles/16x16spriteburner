// ===================== what a floor is like, and what its rooms are dressed as =====================
// FLOOR ARCHETYPES. Each floor is given a character, named on its card under the floor's own name, that tips what its
// rooms and puzzles are likely to be (the first floor is plain or one of the gentle three):
// - THE STOREHOUSES: warehouses, potteries and cart sheds wherever a room is free.
// - THE HALLS OF STONE: shaped rooms and great halls far more often, statue galleries.
// - THE LIGHTLESS: half the rooms with their torches and braziers dead.
// - THE WATERWORKS: a cistern wherever one can go, more ponds, the flooded way more often.
// - THE BROKEN FLOORS: two more kinds of pit than usual.
// - THE LOCKED WAYS: one more puzzle, and more cracked walls.
// ROOM THEMES (a free room: no set piece, water, shrine, sluice or puzzle; some shapes take some of them): THE WAREHOUSE, rows of crate stacks
// and crates across the room, a narrow aisle between each two, a gap or two in every row and the doors' ways left clear (all of it breaks); THE POTTERY, islands of
// pots to smash; THE CART SHED, mine carts nose to tail in rows, junk about them; THE COLONNADE, round columns on their plinths (once statues on their
// pedestals) in a row along the north and the south of the room facing an aisle, a burning brazier at each end.
const ARCHES = [
  { k: 'plain', w: 3, first: true },
  { k: 'stores', name: 'THE STOREHOUSES', w: 1, first: true, themes: { warehouse: 0.35, pottery: 0.25, carts: 0.25 } },
  { k: 'halls', name: 'THE HALLS OF STONE', w: 1, first: true, shape: 1.6, great: 2, themes: { statues: 0.35 } },
  { k: 'dark', name: 'THE LIGHTLESS', w: 1, dark: 0.5 },
  { k: 'water', name: 'THE WATERWORKS', w: 1, water: true },
  { k: 'pits', name: 'THE BROKEN FLOORS', w: 1, pits: 2 },
  { k: 'locks', name: 'THE LOCKED WAYS', w: 1, puzzles: 1, secrets: 2 },
];
const ARCH = { cur: ARCHES[0], force: null };
function pickArch(floor) {
  if (ARCH.force) return ARCHES.find(a => a.k === ARCH.force) || ARCHES[0];
  const ok = ARCHES.filter(a => floor >= 2 || a.first), tot = ok.reduce((s, a) => s + a.w, 0); let x = Math.random() * tot;
  for (const a of ok) { x -= a.w; if (x <= 0) return a; } return ok[0];
}
const THEME_NAMES = { warehouse: 'THE WAREHOUSE', pottery: 'THE POTTERY', carts: 'THE CART SHED', statues: 'THE COLONNADE' };
const THEMES_BASE = { warehouse: 0.07, pottery: 0.05, carts: 0.05, statues: 0.05 };
// which shaped rooms each may dress (rows of crates or carts only where the room is whole, or nearly)
const THEME_SHAPES = { warehouse: ['none', 'cuts', 'alcoves'], carts: ['none', 'cuts', 'alcoves'], pottery: ['none', 'cuts', 'alcoves', 'ring', 'hall', 'great'], statues: ['none', 'cuts', 'alcoves', 'great'] };
// (30_arena furnish) a free room may be dressed as one of the themes; true when it was
function themeRoom(A, r, prop, nearDoor) {
  if (r.kind !== 'room' || r.set || r.pool || r.shrine || r.sluice || r.puz || r.chest || r.w < 9 || r.h < 7) return false;
  const T = Object.assign({}, THEMES_BASE, (ARCH.cur && ARCH.cur.themes) || {}), force = ARCH.theme, fits = n => (THEME_SHAPES[n] || []).includes(r.shape || 'none');
  let k = force && fits(force) ? force : null; if (!k && !force) for (const [n, p] of pitShuffle(Object.entries(T))) if (fits(n) && chance(p * (r.great ? 3 : 1))) { k = n; break; } if (!k) return false;
  const W = A.w, sides = new Set(r.doors.map(d => d.side)), doorCols = r.doors.filter(d => d.side === 'N' || d.side === 'S').flatMap(d => d.cells.map(c => c[0])), doorRows = r.doors.filter(d => d.side === 'E' || d.side === 'W').flatMap(d => d.cells.map(c => c[1]));
  const lane = (x, y) => doorCols.some(c => Math.abs(c - x) <= 1) || doorRows.some(c => Math.abs(c - y) <= 1); // (a straight way from every door across the room)
  const d = A.th === THEMES.brown ? 3 : 0;
  if (k === 'warehouse' || k === 'carts') { // rows across the room with aisles between them, a gap or two in each row
    // (running east and west, or north and south: whichever the doors leave more room for)
    const lane1 = (x, y) => doorCols.includes(x) || doorRows.includes(y), step = k === 'carts' ? 3 : 2, cnt = ns => { let n = 0; for (let a = (ns ? r.ix0 : r.iy0) + 1; a <= (ns ? r.ix1 : r.iy1) - 1; a += step) if (!(ns ? doorCols : doorRows).includes(a)) n += (ns ? r.h : r.w) - 2; return n; }, ns = cnt(true) > cnt(false);
    for (let a = (ns ? r.ix0 : r.iy0) + 1; a <= (ns ? r.ix1 : r.iy1) - 1; a += step) {
      if ((ns ? doorCols : doorRows).includes(a)) continue;
      const gaps = new Set(), L0 = ns ? r.iy0 : r.ix0, L1 = ns ? r.iy1 : r.ix1; for (let i = 0; i < Math.ceil((L1 - L0) / 7); i++) gaps.add(randi(L0 + 1, L1 - 1));
      for (let b = L0 + 1; b <= L1 - 1; b++) {
        const x = ns ? a : b, y = ns ? b : a;
        if (lane1(x, y) || gaps.has(b) || nearDoor(x, y, 1)) continue;
        if (k === 'carts') { prop('crate', x, y, { tile: pick(FURN.cart), th: 1, hp: 40 }); if (chance(0.15)) prop('crate', x, y + 1, { tile: pick(FURN.junk), th: 1, hp: 40 }); }
        else { const t = Math.random(); if (t < 0.45) prop('crate', x, y, { tile: pick(FURN.stack), th: 2, hp: 40 }); else if (t < 0.85) prop('crate', x, y, { tile: pick(FURN.crate), th: 1, hp: 40 }); else prop('barrel', x, y, { tile: pick(FURN.pot), th: 1, hp: 40 }); }
      }
    }
  } else if (k === 'pottery') { // islands of pots
    for (let i = 0; i < randi(3, 5); i++) {
      const x0 = randi(r.ix0 + 1, r.ix1 - 3), y0 = randi(r.iy0 + 1, r.iy1 - 2);
      for (let y = y0; y <= y0 + 1; y++) for (let x = x0; x <= x0 + 2; x++) if (!lane(x, y) && !nearDoor(x, y, 2) && chance(0.8)) prop('barrel', x, y, { tile: pick(FURN.pot), th: 1, hp: 40 });
    }
  } else if (k === 'statues') { // a row along the north and the south, facing an aisle; braziers at its ends
    for (const y of [r.iy0 + 1, r.iy1 - 1]) for (let x = r.ix0 + 2; x <= r.ix1 - 2; x += 3) if (!lane(x, y) && !nearDoor(x, y, 2)) prop('stone', x, y, { tile: [24, 2 + d], th: 2, hp: 1e9 }); // (round columns on their plinths)
    const my = Math.round((r.iy0 + r.iy1) / 2); for (const x of [r.ix0, r.ix1]) if (!nearDoor(x, my, 2) && !lane(x, my)) prop('brazier', x, my, { f: randi(0, 3) });
  }
  r.theme = k; (A.themes = A.themes || []).push(THEME_NAMES[k]); return true;
}
