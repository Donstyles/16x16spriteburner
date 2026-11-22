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
  // the catacombs (43_crypt, 44_candles): built as a crypt floor (the fourth; the sixth for the mossy deep)
  ['TOMB HALL', 'crypt', 'hall', 'KEEP THE CANDLES BURNING: A TOMB WHOSE LAST ONE GOES OUT OPENS', '#e89a90'],
  ['BURIAL CHAMBER', 'crypt', 'sarc', 'COME NEAR THE SARCOPHAGUS IN THE DARK, OR STRIKE IT, AND ITS LORD RISES', '#e89a90'],
  ['CHARNEL PIT', 'crypt', 'charnel', 'THE DEAD LEAP OUT TILL ITS FOUR BRAZIERS BURN AT ONCE: THEY OPEN THE WAY ON', '#e89a90'],
  ['SKULL FONT', 'crypt', 'font', 'STAND AT IT TO DRINK: BLOOD HEALS, AND CURSES', '#e89a90'],
  ['THRONE CRYPT', 'crypt', 'throne', 'THE LORD OF THE DEAD HOLDS THE WAY DOWN', '#e89a90'],
  ['THE SHADE', 'crypt', 'shade', 'IT CANNOT MOVE WHILE YOU FACE IT IN YOUR LAMP. LIGHT BURNS IT', '#e89a90'],
  ['NICHE AMBUSH', 'crypt', 'ambush', 'STEP IN: THE DEAD IN THE WALL COME DOWN', '#e89a90'],
  ['THE BURIED', 'crypt', 'buried', 'THE EARTH OF THE WORN PATHS STIRS IN THE DARK', '#e89a90'],
  ['BLOOD SEAL', 'crypt', 'blood', 'THE FONT THIRSTS: STAND AT IT, OR KILL SOMETHING THAT BLEEDS BESIDE IT', '#e89a90'],
  ['THE VIGIL', 'crypt', 'vigil', 'LIGHT EVERY NICHE OF THE ROOM AT ONCE', '#e89a90'],
  ['BLOOD CISTERN', 'crypt', 'pool', 'NO WATER IN THE CRYPT: BLOOD, BLACK BLOOD, ROT', '#e89a90'],
  ['BURIAL GALLERY', 'crypt', 'gallery', 'A CORRIDOR OF THE DEAD: LIGHT NICHES, CASKETS IN THE WALL BETWEEN', '#e89a90'],
  ['MOSSY DEEP', 'crypt', 'moss', 'THE LOWEST CRYPT FLOOR: ITS DEAD GROWN OVER', '#e89a90'],
  // the magma depths (42_magma, 42_magmaboss): built as a magma floor (the seventh; the ninth for its lord)
  ['LAVA PITS', 'magma', 'holes', 'KNOCKED INTO LAVA YOU BURN AND ARE THROWN BACK OUT ON FIRE: ROLL TO PUT IT OUT', '#ff9a50'],
  ['THE LAVA SPITS', 'magma', 'rim', 'BUBBLES SWELL AND THROW BURNING ROCKS: EACH IS MARKED WHERE IT WILL LAND', '#ff9a50'],
  ['LAVA LEDGES', 'magma', 'ledges', 'A PLATFORM OUT IN THE LAVA, A WAY TO IT FROM EVERY DOOR', '#ff9a50'],
  ['CRUST OVER LAVA', 'magma', 'crumble', 'THE FLOOR IS A THIN CRUST: IT GIVES WAY BEHIND YOU', '#ff9a50'],
  ['FIRE VENTS', 'magma', 'vents', 'THE HOLES GLOW AND SPIT SPARKS, THEN BLOW: ON A BEAT', '#ff9a50'],
  ['STONE FOREST', 'magma', 'forest', 'SPIRES AND BOULDERS IN RANKS: COVER FROM WHAT IS THROWN', '#ff9a50'],
  ['LAVA CISTERN', 'magma', 'pool', 'WHAT IS WATER ABOVE IS LAVA HERE: IT DRAINS AND RISES', '#ff9a50'],
  ['THE CRUCIBLE', 'magma', 'crucible', 'STAND ON AN ANVIL TILL THE LAVA THROWS A ROCK AT YOU, THEN STEP OFF: ALL THREE STRUCK OPEN THE GATE', '#ff9a50'],
  ['THE CINDER COURT', 'magma', 'cinders', 'FIRE THAT WALKS, ITS MAGES, GOLEMS OF BLACK GLASS', '#ff9a50'],
  ['THE DEMON HORDE', 'magma', 'demons', 'THE IMPS THROW FIRE NOW', '#ff9a50'],
  ['LORD ON THE LAKE', 'magma', 'lake', 'WALK OUT TO THE ISLAND. THREE STAGES: THE BRIDGES FALL, THE LAKE RISES', '#ffb060'],
];
// (on a gallery floor: PREV and NEXT at the top step through them all, its name and number under them; 61_input)
const GAL = { on: false, i: 0, kit: null };
function galleryStep(d) { const n = GALLERY.length; beginGallery(GAL.kit, ((GAL.i + d) % n + n) % n); }
function beginGallery(kit, i) {
  const [label, kind, what, line] = GALLERY[i]; beginRun(kit); G.floor = kind === 'magma' ? (what === 'lake' ? 9 : 7) : kind === 'crypt' ? (what === 'moss' ? 6 : 4) : kind === 'puz' || kind === 'crack' ? 4 : chance(0.5) ? 3 : 4; let at = null, keep = null; // (brown or grey; the puzzles at their fullest on the fourth)
  const room = r => { const W = ARENA.w, cx = Math.round((r.ix0 + r.ix1) / 2); for (let d = 0; d < 12; d++) for (const y of [r.iy1 - d, r.iy1 - d + 1]) for (const x of [cx, cx - d, cx + d]) if (y >= r.iy0 && y <= r.iy1 && FLOOR(ARENA.fl[y * W + x])) return [x * TS + 8, y * TS + 10]; return [(cx + 0.5) * TS, (r.iy1 + 0.5) * TS]; };
  const doorIn = (r, d) => { const [x, y] = d.cells[1]; return d.side === 'N' ? [x, y + 2] : d.side === 'S' ? [x, y - 2] : d.side === 'W' ? [x + 2, y] : [x - 2, y]; };
  for (let n = 0; n < 60 && !at; n++) {
    if (kind === 'magma') { if (['holes', 'rim', 'ledges', 'crumble'].includes(what)) ARCH.force = 'pits'; if (what === 'pool') ARCH.force = 'water'; if (what === 'crucible') PUZ.force = 'crucible'; if (what === 'cinders' || what === 'demons') G.nextArmy = what; else G.army = null; }
    if (kind === 'crypt') { CRYPT.force = true; if (what === 'blood' || what === 'vigil') PUZ.force = what; if (what === 'charnel') PUZ.force = 'fires'; } // (the pit as the floor's puzzle: THE CHARNEL PIT)
    if (kind === 'shape') SHAPES.force = what; if (kind === 'great') GREAT.force = true; if (kind === 'theme') ARCH.theme = what; if (kind === 'puz') { PUZ.force = what === 'songhidden' ? 'song' : what === 'spikehidden' ? 'spikegate' : what; PUZ.hidden = what === 'songhidden'; PUZ.spikeHidden = what === 'spikehidden'; } if (kind === 'crack') { PUZ.force = what === 'lever' ? 'gate' : what === 'rune' ? 'rune' : null; HIDDEN.force = what === 'hall' || what.startsWith('nest') ? true : what === 'hallexit' ? 'exit' : false; HIDDEN.nest = what === 'nestalcove' ? 'alcove' : what === 'nestleg' ? 'leg' : null; } if (kind === 'arch') ARCH.force = what;
    try { startFloor(); } finally { SHAPES.force = null; GREAT.force = false; ARCH.theme = null; PUZ.force = null; PUZ.hidden = false; PUZ.spikeHidden = false; HIDDEN.force = false; HIDDEN.nest = null; ARCH.force = null; CRYPT.force = false; }
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
    else if (kind === 'crypt') { const r = galleryCrypt(A, what); if (r) { at = r.at; keep = r.keep || null; } }
    else if (kind === 'magma') { const r = galleryNear(A, galleryMagma(A, what)); if (r) { at = r.at; keep = r.keep || null; } }
  }
  // a quiet floor to look round: no foes, the hero right there
  for (const f of G.foes) if (!(keep && keep(f))) f.dead = true; removeIf(G.foes, f => f.dead); G.units = G.heroes.concat(G.foes);
  const h = G.me; if (at) { h.x = at[0]; h.y = at[1]; h.enter = null; } CAM.x = h.x; CAM.y = h.y; G.fade = 0.6;
  Object.assign(GAL, { on: true, i, kit });
  G.card = { t: 0, life: 4.5, a: 'NIGHT GALLERY', b: label, c: line, d: kind === 'arch' ? (ARENA.arch.name || '') + ' · NO FOES' : kind === 'magma' ? (keep ? 'THEY ARE AWAKE' : 'NO FOES · THE LAVA IS LIVE') + ' · THE STAIRS LEAD ON AS EVER' : kind === 'crypt' ? 'THE DEAD STILL STIR · THE STAIRS LEAD ON AS EVER' : 'NO FOES · THE STAIRS LEAD ON AS EVER' };
}
// the gallery's screen: a grid of buttons, three columns (63_menu)
function drawGalleryMenu(c, W, H, big, btn, k) {
  font(c, 900, clamp(big / 10, 22, 40), F_DISP); label(c, 'Night gallery', W / 2, H * 0.11 + 6, '#f8ecd6', { align: 'center' });
  // (a column more each time ten rows would not hold them)
  const cols = Math.max(3, Math.ceil(GALLERY.length / 10)), rows = Math.ceil(GALLERY.length / cols), gx = 10, gy = 5, x0 = 14 + VIEW.safe.l + 86, x1 = W - 14 - VIEW.safe.r, bw = Math.min(230, (x1 - x0 - gx * (cols - 1)) / cols), y0 = H * 0.11 + 22, bh = clamp((H - y0 - 10 - VIEW.safe.b) / rows - gy, 22, 34), ox = (x0 + x1 - (bw * cols + gx * (cols - 1))) / 2;
  GALLERY.forEach(([txt, , , , col], i) => { const cx = Math.floor(i / rows), cy = i % rows; // (down each column: rooms and corridors, then themes and puzzles, then puzzles and floors)
    btn(c, ox + cx * (bw + gx), y0 + cy * (bh + gy), bw, bh, txt, () => beginGallery(k, i), { size: bh < 28 ? 12 : 14, col }); });
}
// a crypt gallery entry: where the hero stands to see it (and which creatures stay: the Shade, the lord on his throne, the
// buried, those are the thing to see)
// where the hero is put for a crypt entry: the spot asked for, or else the nearest open floor to it (no wall, no water or pit,
// nothing solid standing there): a sarcophagus against the south wall has no floor three tiles below it
function galleryCrypt(A, what) { return galleryNear(A, galleryCrypt0(A, what)); }
function galleryNear(A, r) {
  if (!r) return r; const [x0, y0] = r.at, tx0 = Math.floor(x0 / TS), ty0 = Math.floor(y0 / TS);
  const ok = (tx, ty) => A.fl[ty * A.w + tx] === 1 && !solidAt(tx * TS + 8, ty * TS + 10) && !A.props.some(q => !q.dead && q.solid && Math.abs(q.x - (tx * TS + 8)) < 14 && Math.abs((q.cy || q.y) - (ty * TS + 10)) < 14);
  if (ok(tx0, ty0)) return r; let best = null, bd = 1e9;
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const tx = tx0 + dx, ty = ty0 + dy, d = Math.hypot(dx, dy); if (d < bd && tx > 0 && ty > 0 && tx < A.w - 1 && ty < A.h - 1 && ok(tx, ty)) { bd = d; best = [tx * TS + 8, ty * TS + 10]; } }
  return best ? Object.assign({}, r, { at: best }) : r;
}
function galleryCrypt0(A, what) {
  const P = k => A.props.find(q => q.kind === k && !q.dead), below = (q, n) => [q.x, q.y + n * TS], inR = (r, x, y) => x >= r.ix0 * TS && x < (r.ix1 + 1) * TS && y >= r.iy0 * TS && y < (r.iy1 + 1) * TS;
  if (what === 'hall') { const by = {}; for (const q of A.props) if (q.kind === 'tomb') by[q.room] = (by[q.room] || 0) + 1; const k = Object.keys(by).find(k => by[k] >= 8); const r = k !== undefined && A.rooms.find(q => q.i === +k); return r ? { at: [(r.ix0 + r.ix1 + 1) / 2 * TS, (r.iy1 + 0.5) * TS] } : null; }
  if (what === 'sarc') { const q = P('sarc'); return q ? { at: below(q, 3) } : null; }
  if (what === 'charnel') { const q = P('charnel'); return q ? { at: [q.x + 4 * TS, q.y] } : null; }
  if (what === 'font') { const q = A.props.find(q => q.kind === 'font' && !q.seal); return q ? { at: below(q, 2) } : null; }
  if (what === 'blood') { const q = A.props.find(q => q.kind === 'font' && q.seal); return q ? { at: below(q, 2) } : null; }
  if (what === 'throne') { const q = P('throne'); return q ? { at: below(q, 5), keep: f => f.seated } : null; }
  if (what === 'shade') { const S = G.foes.find(f => f.shade); if (!S) return null; for (const d of [6, 5, 7, 4]) for (const sx of [1, -1]) { const x = S.x + sx * d * TS; if (FLOOR(A.fl[Math.floor(S.y / TS) * A.w + Math.floor(x / TS)]) && !solidAt(x, S.y)) return { at: [x, S.y], keep: f => f === S }; } return null; }
  if (what === 'buried') { const b = G.foes.find(f => f.buried && !litAt(A, f.x, f.y)); if (!b) return null; for (const d of [5, 4, 6]) for (const sx of [1, -1]) { const x = b.x + sx * d * TS; if (FLOOR(A.fl[Math.floor(b.y / TS) * A.w + Math.floor(x / TS)]) && !solidAt(x, b.y)) return { at: [x, b.y], keep: f => f.buried }; } return null; }
  if (what === 'ambush') { const r = A.rooms.find(r => r.niches && r.niches.length >= 2 && r.kind === 'room' && hash2(r.i * 7 + 3, A.floor * 11 + 1) <= 0.5); const d = r && r.doors.find(d => !d.hidden && d.side === 'S') || r && r.doors.find(d => !d.hidden); if (!d) return null; const [x, y] = d.cells[1], o = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }[d.side]; return { at: [(x + o[0]) * TS + 8, (y + o[1]) * TS + 10] }; }
  if (what === 'vigil') { const v = A.vigils && A.vigils[0]; if (!v) return null; return { at: [v.ts[0].x, v.ts[0].y + 3 * TS] }; }
  if (what === 'pool') { const q = (A.pools || []).find(q => !q.flooded); return q ? { at: [(q.x1 + 1.5) * TS + 8, (q.y0 + q.y1 + 1) / 2 * TS] } : null; }
  if (what === 'gallery') { const t = A.torches.find(t => t.candles && !A.rooms.some(r => inR(r, t.x, t.y + 24)) && FLOOR(A.fl[Math.floor((t.y + 24) / TS) * A.w + Math.floor(t.x / TS)])); return t ? { at: [t.x + 20, t.y + 26] } : null; }
  if (what === 'moss') return { at: [A.spawn.x, A.spawn.y] };
  return null;
}
// a magma gallery entry: where the hero stands to see it, and who stays
function galleryMagma(A, what) {
  const mid = r => [(r.ix0 + r.ix1 + 1) / 2 * TS, (r.iy0 + r.iy1 + 1) / 2 * TS], door = r => { const d = r.doors.find(d => !d.hidden); if (!d) return mid(r); const [x, y] = d.cells[1], o = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[d.side]; return [(x + o[0]) * TS + 8, (y + o[1]) * TS + 10]; };
  if (what === 'holes' || what === 'rim' || what === 'ledges' || what === 'crumble') { const r = A.rooms.find(q => q.set === what && !q.secret); return r ? { at: door(r) } : null; } // (never a room of a hidden wing: unseen till its wall is broken)
  if (what === 'vents') { const s = (A.spikes || []).find(q => !q.gate); return s ? { at: s.ax === 'x' ? [s.x - 44, s.y] : [s.x, s.y + 44] } : null; }
  if (what === 'crucible') { const C = (A.crucibles || [])[0]; return C ? { at: [C.px - 44, C.py + 26] } : null; }
  if (what === 'forest') { const r = A.rooms.find(q => q.forest && !q.secret); return r ? { at: door(r) } : null; }
  if (what === 'pool') { const q = (A.pools || []).find(q => !q.flooded); return q ? { at: [(q.x1 + 1.5) * TS + 8, (q.y0 + q.y1 + 1) / 2 * TS] } : null; }
  if (what === 'cinders' || what === 'demons') { if (A.army !== what) return null; const r = A.rooms.find(q => q.kind === 'room' && !q.set && !q.secret && G.foes.filter(f => roomAt(f.x, f.y) === q).length >= 4); return r ? { at: door(r), keep: f => roomAt(f.x, f.y) === r } : null; }
  if (what === 'lake') return A.lake ? { at: door(A.lake.r), keep: f => f.boss } : null;
  return null;
}
