// ===================== assets =====================
const A = { tiles: null, creatures: null, cindex: null, icons: {} };
const T = 16;
function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image failed')); im.src = src; }); }
async function loadAssets(src) {
  [A.tiles, A.creatures] = await Promise.all([loadImage(src.tiles), loadImage(src.creatures)]);
  A.cindex = src.cindexData || await fetch(src.cindex).then(r => r.json());
  buildIcons();
}
function drawTile(ctx, c, r, x, y, z = 1, w = 1, h = 1) { ctx.drawImage(A.tiles, c * T, r * T, w * T, h * T, x, y, w * T * z, h * T * z); }
function drawCreature(ctx, name, frame, x, y, z = 1, flip = false, alpha = 1) {
  const e = A.cindex[name]; if (!e) return;
  const [sy, fw, fh] = e; const sx = (frame % 4) * fw;
  if (alpha !== 1) ctx.globalAlpha = alpha;
  if (flip) { ctx.save(); ctx.translate(x + fw * z, y); ctx.scale(-1, 1); ctx.drawImage(A.creatures, sx, sy, fw, fh, 0, 0, fw * z, fh * z); ctx.restore(); }
  else ctx.drawImage(A.creatures, sx, sy, fw, fh, x, y, fw * z, fh * z);
  if (alpha !== 1) ctx.globalAlpha = 1;
}
// cached canvas of a creature frame (for portraits / UI)
const creatureCache = new Map();
function creatureCanvas(name, frame = 0, z = 3) {
  const key = name + frame + z; if (creatureCache.has(key)) return creatureCache.get(key);
  const e = A.cindex[name]; const c = document.createElement('canvas'); c.width = e[1] * z; c.height = e[2] * z;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; drawCreature(x, name, frame, 0, 0, z);
  creatureCache.set(key, c); return c;
}
// tile coordinates for item icons that exist in the tileset, plus procedural ones
const TILE_ICONS = {
  sword: [3, 32], sword2: [5, 32], sword3: [4, 32], staff: [8, 32], potion_red: [1, 32], potion_blue: [0, 32], potion_green: [2, 32],
  gem_blue: [0, 31], gem_red: [1, 31], gem_green: [2, 31], gem_purple: [3, 31], bag: [4, 31], bag2: [5, 31], key: [2, 29], key2: [3, 29], key3: [4, 29], ring: [5, 29],
  heart: [3, 30], trophy: [2, 30], skull: [6, 32], bomb: [9, 32], lantern: [11, 32], scroll: [1, 27], book: [1, 18], chest: [4, 23], chest_open: [5, 23], bigchest: [4, 25], bigchest_open: [4, 27],
  food: [3, 19], crate: [1, 18], pot: [4, 19], bush: [4, 20], bush2: [5, 20], rock: [4, 21], rock2: [4, 22], grave: [0, 22], grave2: [0, 23], sign: [1, 27], signq: [1, 30], signx: [0, 30],
  statue: [1, 14], altar: [0, 9], barrel: [0, 10], bones: [2, 12], coffin: [0, 18], brazier: [0, 12], brazier_blue: [1, 13], brazier_green: [1, 12], brazier_purple: [0, 13], well: [0, 15], pedestal: [0, 7],
  door_wood: [1, 15], door_wood2: [1, 16], cage: [1, 5], eye: [30, 0], arrow_r: [0, 28], arrow_l: [1, 28], arrow_d: [0, 29], arrow_u: [1, 29], fence: [3, 5], bars: [1, 5], boat: [0, 20],
};
function buildIcons() {
  const col = { wood: '#7a4a24', wood2: '#a06a34', steel: '#c8ccd4', steel2: '#7a8090', gold: '#e2b23c', leather: '#8a5a30', leather2: '#5c3a1c', iron: '#8a8f99', iron2: '#4e535c', gem: '#5ac8ff', dark: '#1a1414', red: '#c02828', cloth: '#3a5ab8', cloth2: '#243a80', silver: '#e8ecf0' };
  const mk = (name, fn) => { const p = new Pix(16, 16); fn(p); A.icons[name] = p.c; };
  mk('bow', p => { p.line(4, 2, 4, 13, col.wood).line(4, 2, 7, 4, col.wood).line(4, 13, 7, 11, col.wood).line(7, 4, 7, 11, '#ddd').line(8, 7, 13, 7, col.wood2).p(13, 6, col.steel).p(13, 8, col.steel).p(14, 7, col.steel); });
  mk('mace', p => { p.line(3, 13, 9, 7, col.wood).r(8, 3, 5, 5, col.iron).r(9, 4, 3, 3, col.iron2).p(7, 5, col.iron).p(13, 5, col.iron).p(10, 2, col.iron).p(10, 8, col.iron); });
  mk('axe', p => { p.line(3, 13, 10, 6, col.wood).r(8, 2, 5, 6, col.steel).r(9, 3, 3, 4, col.steel2).p(12, 2, col.silver).p(12, 7, col.silver); });
  mk('dagger', p => { p.line(5, 11, 11, 5, col.steel).line(6, 12, 12, 6, col.steel2).r(3, 10, 3, 3, col.wood).p(4, 11, col.gold).p(7, 8, col.gold); });
  mk('spear', p => { p.line(2, 13, 11, 4, col.wood).line(10, 5, 13, 2, col.steel).p(12, 2, col.silver).p(13, 3, col.silver); });
  mk('leather', p => { p.r(4, 3, 8, 10, col.leather).r(5, 4, 6, 8, col.leather2).r(3, 4, 2, 4, col.leather).r(11, 4, 2, 4, col.leather).r(6, 2, 4, 2, col.leather2).p(7, 6, col.gold).p(8, 9, col.gold); });
  mk('chain', p => { for (let y = 3; y < 13; y++) for (let x = 4; x < 12; x++) p.p(x, y, (x + y) % 2 ? col.iron : col.iron2); p.r(3, 4, 1, 4, col.iron).r(12, 4, 1, 4, col.iron).r(6, 2, 4, 1, col.iron2); });
  mk('plate', p => { p.r(4, 3, 8, 10, col.steel).r(3, 4, 2, 5, col.steel2).r(11, 4, 2, 5, col.steel2).r(6, 2, 4, 2, col.steel2).line(8, 4, 8, 12, col.steel2).p(6, 6, col.silver).p(10, 6, col.silver).r(5, 11, 6, 2, col.gold); });
  mk('robe', p => { p.r(4, 3, 8, 11, col.cloth).r(5, 4, 6, 9, col.cloth2).r(3, 4, 2, 4, col.cloth).r(11, 4, 2, 4, col.cloth).r(6, 2, 4, 2, col.cloth2).line(8, 4, 8, 13, col.gold); });
  mk('shield', p => { p.r(4, 2, 8, 9, col.iron).r(5, 3, 6, 7, col.cloth).r(5, 11, 6, 2, col.iron).r(6, 13, 4, 1, col.iron2).line(8, 3, 8, 12, col.gold).line(5, 6, 10, 6, col.gold); });
  mk('helm', p => { p.r(4, 4, 8, 7, col.steel).r(5, 3, 6, 1, col.steel).r(4, 11, 8, 2, col.steel2).r(6, 8, 4, 3, col.dark).p(7, 1, col.red).p(8, 1, col.red).p(8, 2, col.red); });
  mk('cap', p => { p.r(4, 5, 8, 6, col.leather).r(5, 4, 6, 1, col.leather).r(3, 11, 10, 2, col.leather2); });
  mk('boots', p => { p.r(4, 3, 4, 8, col.leather2).r(8, 3, 4, 8, col.leather2).r(3, 11, 5, 2, col.leather).r(8, 11, 6, 2, col.leather).p(5, 5, col.gold).p(9, 5, col.gold); });
  mk('amulet', p => { p.line(4, 3, 8, 10, col.gold).line(12, 3, 8, 10, col.gold).r(7, 10, 3, 3, col.gem).p(8, 11, '#fff'); });
  mk('wand', p => { p.line(4, 12, 11, 5, col.wood2).r(10, 3, 3, 3, col.gem).p(11, 4, '#fff'); });
  mk('arrows', p => { p.line(3, 13, 12, 4, col.wood2).line(5, 13, 13, 5, col.wood2).r(11, 3, 2, 2, col.steel).r(12, 4, 2, 2, col.steel).r(3, 11, 2, 2, '#ddd').r(4, 12, 2, 2, '#ddd'); });
  mk('gold', p => { for (const [x, y] of [[5, 6], [9, 5], [7, 9], [11, 9], [4, 10]]) { p.r(x, y, 3, 2, col.gold); p.p(x, y, '#fff'); } });
  mk('ore', p => { p.r(4, 6, 8, 7, col.iron2).r(5, 5, 6, 1, col.iron2).p(6, 7, col.gold).p(9, 9, col.gold).p(7, 10, col.gold).p(10, 6, col.silver); });
  mk('torch', p => { p.r(7, 7, 2, 7, col.wood).r(6, 3, 4, 4, '#f08030').r(7, 1, 2, 3, '#ffd040').p(7, 4, '#fff'); });
  mk('herb', p => { p.line(8, 13, 8, 5, '#3a8a2a').line(8, 9, 5, 6, '#3a8a2a').line(8, 8, 11, 5, '#3a8a2a').r(4, 4, 3, 3, '#58c040').r(10, 3, 3, 3, '#58c040').r(7, 3, 3, 3, '#80e060'); });
  mk('map', p => { p.r(3, 3, 10, 10, '#d8c090').r(4, 4, 8, 8, '#e8d8a8').line(5, 10, 10, 5, col.red).p(10, 5, col.red).p(6, 6, '#3a6ab8').p(9, 9, '#3a6ab8'); });
  mk('letter', p => { p.r(3, 4, 10, 8, '#e8d8a8').line(3, 4, 8, 8, '#a08860').line(13, 4, 8, 8, '#a08860').p(8, 9, col.red); });
  mk('relic', p => { p.r(6, 3, 4, 10, col.gold).r(5, 5, 6, 2, col.gold).r(7, 1, 2, 2, col.gem).p(8, 8, col.red); });
  mk('scepter', p => { p.line(4, 13, 11, 6, col.gold).r(10, 2, 4, 4, col.gold).r(11, 3, 2, 2, '#c050ff').p(11, 3, '#fff'); });
  mk('food', p => { p.r(4, 6, 8, 6, '#c08040').r(5, 5, 6, 1, '#e0a060').r(3, 9, 10, 1, '#8a5020').p(6, 7, '#ffd080').p(9, 8, '#ffd080'); });
  mk('empty', p => { });
}
function iconCanvas(id) {
  if (A.icons[id]) return A.icons[id];
  const t = TILE_ICONS[id]; if (!t) return A.icons.empty;
  const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d'); x.drawImage(A.tiles, t[0] * 16, t[1] * 16, 16, 16, 0, 0, 16, 16);
  A.icons[id] = c; return c;
}
