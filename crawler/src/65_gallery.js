// ===================== the night gallery: every new room, corridor, puzzle and floor, one tap away =====================
// From the test rooms screen (NIGHT GALLERY): a grid of everything made in the night of the long build. Picking one builds
// a floor (the third or the fourth: the puzzles always the fourth, at their fullest) with it on, takes the foes away and puts the hero right by it, with a
// card naming it and saying how it works. The floor is a whole one: walk on, the stairs lead on as ever.
const GALLERY = [
  // [label, kind, what, the card's line, colour]
  ['PILLARED HALL', 'shape', 'hall', 'BLOCKS OF WALL STANDING FREE, IN PAIRS AND ROWS', '#d8c8a8'],
  ['THE RING', 'shape', 'ring', 'ONE GREAT BLOCK IN THE MIDDLE: A WALK ROUND IT', '#d8c8a8'],
  ['CUT CORNERS', 'shape', 'cuts', 'AN L, A Z, A CROSS', '#d8c8a8'],
  ['ALCOVES', 'shape', 'alcoves', 'NICHES IN THE WALLS: STATUES, BRAZIERS, CHESTS', '#d8c8a8'],
  ['SPURS', 'shape', 'spurs', 'WALLS RUN OUT INTO THE ROOM: BAYS', '#d8c8a8'],
  ['SERPENTINE', 'shape', 'serpent', 'SPURS FROM THE NORTH AND SOUTH IN TURN', '#d8c8a8'],
  ['GREAT HALL', 'great', null, 'TWO CELLS MADE ONE, A COLONNADE DOWN IT', '#f0d890'],
  ['BENT CORRIDOR', 'hall', 'bent', 'IT JOGS ASIDE HALFWAY', '#b8c8d8'],
  ['GALLERY CORRIDOR', 'hall', 'wide', 'TWICE AS WIDE, COLUMNS DOWN ITS MIDDLE', '#b8c8d8'],
  ['WAREHOUSE', 'theme', 'warehouse', 'ROWS OF CRATES AND STACKS: IT ALL BREAKS', '#e0a870'],
  ['POTTERY', 'theme', 'pottery', 'ISLANDS OF POTS TO SMASH', '#e0a870'],
  ['CART SHED', 'theme', 'carts', 'MINE CARTS NOSE TO TAIL', '#e0a870'],
  ['COLONNADE', 'theme', 'statues', 'COLUMNS ON THEIR PLINTHS FACING AN AISLE, BRAZIERS AT ITS ENDS', '#e0a870'],
  ['PORTCULLIS', 'puz', 'gate', 'THE WAY ON IS SHUT: ITS BUTTON IS IN ANOTHER ROOM', '#f0c060'],
  ['ECHOING RUNES', 'puz', 'echo', 'WATCH THE ORDER THEY LIGHT IN, THEN STEP ON THEM IN IT', '#f0c060'],
  ['SINGING RUNES', 'puz', 'song', 'NOTHING TO SEE: LISTEN TO THE ORDER, THEN STEP ON THE RUNES IN IT', '#f0c060'],
  ['HIDDEN NOTE', 'puz', 'songhidden', 'THE FOURTH NOTE SINGS FROM BEHIND A CRACKED WALL', '#f0c060'],
  ['COLD BRAZIERS', 'puz', 'fires', 'STAND BY EACH TO LIGHT IT: ALL OF THEM AT ONCE', '#f0c060'],
  // (THE WEIGHT and THE GAP: shelved till they are reworked, 41_puzzles PUZ_SHELVED)
  ['SPIKE GATE', 'puz', 'spikegate', 'THE PLATE DROPS THE SPIKES FOR SEVEN SECONDS: RUN', '#f0c060'],
  ['HIDDEN SWITCH', 'puz', 'spikehidden', 'THE SPIKE GATE\'S PLATE IS SEALED BEHIND A CRACKED WALL', '#c8b0e8'],
  ['HIDDEN HALLWAY', 'crack', 'hall', 'A CRACKED WALL WITH A CORRIDOR AND A ROOM BEHIND IT', '#c8b0e8'],
  ['HIDDEN EXIT', 'crack', 'hallexit', 'THE WAY DOWN IS IN A ROOM BEHIND A CRACKED WALL', '#c8b0e8'],
  ['WALL BEHIND A WALL', 'crack', 'nestalcove', 'THE CRACKED WALL OPENS ON AN ALCOVE: ANOTHER CRACKED WALL AT ITS END', '#c8b0e8'],
  ['THE CRACKED BEND', 'crack', 'nestleg', 'BEHIND THE CRACKED WALL A PASSAGE RUNS ASIDE TO A SECOND ONE', '#c8b0e8'],
  ['CRACKED WALL', 'crack', 'chest', 'THREE BLOWS, OR ONE HEAVY ONE', '#c8b0e8'],
  ['HIDDEN LEVER', 'crack', 'lever', 'A PORTCULLIS WHOSE BUTTON IS BEHIND A CRACKED WALL', '#c8b0e8'],
  ['HIDDEN RUNE', 'crack', 'rune', 'ONE OF THE THREE RUNES IS SEALED BEHIND A CRACKED WALL', '#c8b0e8'],
  ['STOREHOUSES', 'arch', 'stores', 'A FLOOR OF WAREHOUSES, POTTERIES, CART SHEDS', '#a8d8b0'],
  ['HALLS OF STONE', 'arch', 'halls', 'SHAPED ROOMS AND GREAT HALLS', '#a8d8b0'],
  ['THE LIGHTLESS', 'arch', 'dark', 'HALF THE ROOMS DARK', '#a8d8b0'],
  ['WATERWORKS', 'arch', 'water', 'CISTERNS, PONDS, THE FLOODED WAY', '#a8d8b0'],
  ['BROKEN FLOORS', 'arch', 'pits', 'MORE PITS THAN USUAL', '#a8d8b0'],
  ['LOCKED WAYS', 'arch', 'locks', 'MORE PUZZLES, MORE CRACKED WALLS', '#a8d8b0'],
];
// (on a gallery floor: PREV and NEXT at the top step through them all, its name and number under them; 61_input)
const GAL = { on: false, i: 0, kit: null };
function galleryStep(d) { const n = GALLERY.length; beginGallery(GAL.kit, ((GAL.i + d) % n + n) % n); }
function beginGallery(kit, i) {
  const [label, kind, what, line] = GALLERY[i]; beginRun(kit); G.floor = kind === 'puz' || kind === 'crack' ? 4 : chance(0.5) ? 3 : 4; let at = null; // (brown or grey; the puzzles at their fullest on the fourth)
  const room = r => { const W = ARENA.w, cx = Math.round((r.ix0 + r.ix1) / 2); for (let d = 0; d < 12; d++) for (const y of [r.iy1 - d, r.iy1 - d + 1]) for (const x of [cx, cx - d, cx + d]) if (y >= r.iy0 && y <= r.iy1 && FLOOR(ARENA.fl[y * W + x])) return [x * TS + 8, y * TS + 10]; return [(cx + 0.5) * TS, (r.iy1 + 0.5) * TS]; };
  const doorIn = (r, d) => { const [x, y] = d.cells[1]; return d.side === 'N' ? [x, y + 2] : d.side === 'S' ? [x, y - 2] : d.side === 'W' ? [x + 2, y] : [x - 2, y]; };
  for (let n = 0; n < 60 && !at; n++) {
    if (kind === 'shape') SHAPES.force = what; if (kind === 'great') GREAT.force = true; if (kind === 'theme') ARCH.theme = what; if (kind === 'puz') { PUZ.force = what === 'songhidden' ? 'song' : what === 'spikehidden' ? 'spikegate' : what; PUZ.hidden = what === 'songhidden'; PUZ.spikeHidden = what === 'spikehidden'; } if (kind === 'crack') { PUZ.force = what === 'lever' ? 'gate' : what === 'rune' ? 'rune' : null; HIDDEN.force = what === 'hall' || what.startsWith('nest') ? true : what === 'hallexit' ? 'exit' : false; HIDDEN.nest = what === 'nestalcove' ? 'alcove' : what === 'nestleg' ? 'leg' : null; } if (kind === 'arch') ARCH.force = what;
    try { startFloor(); } finally { SHAPES.force = null; GREAT.force = false; ARCH.theme = null; PUZ.force = null; PUZ.hidden = false; PUZ.spikeHidden = false; HIDDEN.force = false; HIDDEN.nest = null; ARCH.force = null; }
    const A = ARENA;
    if (kind === 'shape') { const r = A.rooms.find(q => q.shape === what); if (r) at = room(r); }
    else if (kind === 'great') { const r = A.rooms.find(q => q.great); if (r) at = room(r); }
    else if (kind === 'theme') { const r = A.rooms.find(q => q.theme === what); if (r) at = room(r); }
    else if (kind === 'hall') { const h = A.halls.find(q => q[what]); if (h) { const d = h.A.doors.find(q => q.hall === h), [x, y] = doorIn(h.A, d); at = [x * TS + 8, y * TS + 10]; } }
    else if (kind === 'puz') {
      const g = (A.gates || []).find(q => q.how === (what === 'gate' ? 'lever' : what === 'songhidden' ? 'song' : what) && (what !== 'songhidden' || (q.host && q.host.crack && q.host.crack.holds === 'rune'))), r = what === 'gap' ? A.rooms.find(q => q.gap) : what === 'spikegate' ? A.rooms.find(q => q.spikeGate) : what === 'spikehidden' ? A.rooms.find(q => q.spikeGate && q.spikeGate.hidden) : g && (what === 'gate' ? null : g.host);
      if (what === 'gate' && g) { const X = puzReach(A, g.hall, false).has(g.hall.A) ? g.hall.A : g.hall.B, d = X.doors.find(q => q.hall === g.hall), [x, y] = doorIn(X, d); at = [x * TS + 8, y * TS + 10]; }
      else if (r && what === 'gap') { const b = A.props.find(q => q.push && q.fill); at = b ? [b.x + 30, b.cy + 4] : room(r); } else if (r) at = room(r);
    } else if (kind === 'crack') { const nest = what.startsWith('nest') ? what.slice(4) : null, c = (A.cracks || []).find(q => q.holds === (what === 'hallexit' || nest ? 'hall' : what) && (what !== 'hallexit' || q.hall.A === A.end) && (!nest || (q.inner && q.hall.nest === nest))); if (c) at = [(c.x + 1.5) * TS, (c.y + 2) * TS + 8]; }
    else if (kind === 'arch') at = [A.spawn.x, A.spawn.y];
  }
  // a quiet floor to look round: no foes, the hero right there
  for (const f of G.foes) f.dead = true; G.foes.length = 0; G.units = G.heroes.slice();
  const h = G.me; if (at) { h.x = at[0]; h.y = at[1]; h.enter = null; } CAM.x = h.x; CAM.y = h.y; G.fade = 0.6;
  Object.assign(GAL, { on: true, i, kit });
  G.card = { t: 0, life: 4.5, a: 'NIGHT GALLERY', b: label, c: line, d: kind === 'arch' ? (ARENA.arch.name || '') + ' · NO FOES' : 'NO FOES · THE STAIRS LEAD ON AS EVER' };
}
// the gallery's screen: a grid of buttons, three columns (63_menu)
function drawGalleryMenu(c, W, H, big, btn, k) {
  font(c, 900, clamp(big / 10, 22, 40), F_DISP); label(c, 'Night gallery', W / 2, H * 0.11 + 6, '#f8ecd6', { align: 'center' });
  // (a column more each time ten rows would not hold them)
  const cols = Math.max(3, Math.ceil(GALLERY.length / 10)), rows = Math.ceil(GALLERY.length / cols), gx = 10, gy = 5, x0 = 14 + VIEW.safe.l + 86, x1 = W - 14 - VIEW.safe.r, bw = Math.min(230, (x1 - x0 - gx * (cols - 1)) / cols), y0 = H * 0.11 + 22, bh = clamp((H - y0 - 10 - VIEW.safe.b) / rows - gy, 22, 34), ox = (x0 + x1 - (bw * cols + gx * (cols - 1))) / 2;
  GALLERY.forEach(([txt, , , , col], i) => { const cx = Math.floor(i / rows), cy = i % rows; // (down each column: rooms and corridors, then themes and puzzles, then puzzles and floors)
    btn(c, ox + cx * (bw + gx), y0 + cy * (bh + gy), bw, bh, txt, () => beginGallery(k, i), { size: bh < 28 ? 12 : 14, col }); });
}
