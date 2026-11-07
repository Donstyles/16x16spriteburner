(function(){
'use strict';
// ---- 00_core.js ----
// ===================== core utilities =====================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
function seededRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = () => Math.random();
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const roll = (n, sides, bonus = 0) => { let t = bonus; for (let i = 0; i < n; i++) t += rint(1, sides); return t; };
const fmtNum = n => Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// ===================== 5x7 bitmap font =====================
const FW = 5, FH = 7;
const GLYPHS = {
  A: '.###.#...##...#######...##...##...#', B: '####.#...##...#####.#...##...#####.', C: '.###.#...##....#....#....#...#.###.', D: '###..#..#.#...##...##...##..#.###..',
  E: '######....#....####.#....#....#####', F: '######....#....####.#....#....#....', G: '.###.#...##....#.####...##...#.####', H: '#...##...##...#######...##...##...#',
  I: '.###...#....#....#....#....#...###.', J: '..###...#....#....#....#.#..#..##..', K: '#...##..#.#.#..##...#.#..#..#.#...#', L: '#....#....#....#....#....#....#####',
  M: '#...###.###.#.##.#.##...##...##...#', N: '#...##...###..##.#.##..###...##...#', O: '.###.#...##...##...##...##...#.###.', P: '####.#...##...#####.#....#....#....',
  Q: '.###.#...##...##...##.#.##..#..##.#', R: '####.#...##...#####.#.#..#..#.#...#', S: '.#####....#.....###.....#....#####.', T: '#####..#....#....#....#....#....#..',
  U: '#...##...##...##...##...##...#.###.', V: '#...##...##...##...##...#.#.#...#..', W: '#...##...##...##.#.##.#.##.#.#.#.#.', X: '#...##...#.#.#...#...#.#.#...##...#',
  Y: '#...##...#.#.#...#....#....#....#..', Z: '#####....#...#...#...#...#....#####',
  0: '.###.#...##..###.#.###..##...#.###.', 1: '..#...##....#....#....#....#...###.', 2: '.###.#...#....#...#...#...#...#####', 3: '#####...#...#.....#.....##...#.###.',
  4: '...#...##..#.#..#..######...#....#.', 5: '######....####.....#....##...#.###.', 6: '..##..#...#....####.#...##...#.###.', 7: '#####....#...#...#...#...#....#....',
  8: '.###.#...##...#.###.#...##...#.###.', 9: '.###.#...##...#.####....#...#..##..',
  a: '...........###.....#.#####...#.####', b: '#....#....#.##.##..##...##...#####.', c: '...........###.#....#....#...#.###.', d: '....#....#.##.##..###...##...#.####',
  e: '...........###.#...#######.....###.', f: '..##..#..#.#...###...#....#....#...', g: '......#####...##...#.####....#.###.', h: '#....#....#.##.##..##...##...##...#',
  i: '..#........##....#....#....#...###.', j: '...#........##....#....#.#..#..##..', k: '#....#....#..#.#.#..##...#.#..#..#.', l: '.##....#....#....#....#....#...###.',
  m: '..........##.#.#.#.##.#.##...##...#', n: '..........#.##.##..##...##...##...#', o: '...........###.#...##...##...#.###.', p: '.....####.#...##...#####.#....#....',
  q: '......#####...##...#.####....#....#', r: '..........#.##.##..##....#....#....', s: '...........#####.....###.....#####.', t: '.#....#...###...#....#....#..#..##.',
  u: '..........#...##...##...##..##.##.#', v: '..........#...##...##...#.#.#...#..', w: '..........#...##...##.#.##.#.#.#.#.', x: '..........#...#.#.#...#...#.#.#...#',
  y: '.....#...##...##...#.####....#.###.', z: '..........#####...#...#...#...#####',
  ' ': '...................................', '.': '..........................##...##..', ',': '.....................##...#...#....', '!': '..#....#....#....#..............#..',
  '?': '.###.#...#....#...#...#.........#..', ':': '......##...##........##...##.......', ';': '......##...##........##....#...#...', '-': '...............#####...............',
  '+': '.......#....#..#####..#....#.......', '=': '..........#####.....#####..........', '/': '....#....#...#...#...#...#....#....', '(': '...#...#...#....#....#.....#.....#.',
  ')': '.#.....#.....#....#....#....#...#..', "'": '.##....#...#.......................', '"': '.#.#..#.#..#.#.....................', '%': '##..###..#...#...#...#...#..###..##',
  '*': '......#.#...#..#####..#...#.#......', '<': '...#...#...#...#.....#.....#.....#.', '>': '.#.....#.....#.....#...#...#...#...', '[': '.###..#....#....#....#....#....###.',
  ']': '.###....#....#....#....#....#..###.', '_': '..............................#####', '&': '.##..#..#.#.#...#...#.#.##..#..##.#', '#': '.#.#..#.#.#####.#.#.#####.#.#..#.#.',
};
const fontSheets = new Map();
function fontSheet(color, scale) {
  const key = color + scale; if (fontSheets.has(key)) return fontSheets.get(key);
  const keys = Object.keys(GLYPHS), cw = (FW + 1) * scale, ch = (FH + 1) * scale;
  const cvs = document.createElement('canvas'); cvs.width = cw * keys.length; cvs.height = ch;
  const c = cvs.getContext('2d'); c.fillStyle = color; const map = {};
  keys.forEach((k, i) => { map[k] = i * cw; const g = GLYPHS[k]; for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (g[y * FW + x] === '#') c.fillRect(i * cw + x * scale, y * scale, scale, scale); });
  const sh = { cvs, map, cw, ch }; fontSheets.set(key, sh); return sh;
}
const textW = (s, scale = 1) => String(s).length * (FW + 1) * scale - scale;
function text(ctx, str, x, y, scale = 1, color = '#e8dcc0', align = 'left', shadow = true) {
  str = String(str); const w = textW(str, scale);
  if (align === 'center') x -= w / 2; else if (align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  if (shadow) rawText(ctx, str, x + scale, y + scale, scale, 'rgba(0,0,0,0.8)');
  rawText(ctx, str, x, y, scale, color); return w;
}
function rawText(ctx, str, x, y, scale, color) {
  const sh = fontSheet(color, scale), adv = (FW + 1) * scale;
  for (let i = 0; i < str.length; i++) { let ch = str[i]; if (!(ch in GLYPHS)) ch = ch.toUpperCase() in GLYPHS ? ch.toUpperCase() : '?'; if (ch === ' ') continue; ctx.drawImage(sh.cvs, sh.map[ch], 0, sh.cw, sh.ch, x + i * adv, y, sh.cw, sh.ch); }
}
function wrap(str, scale, maxW) { const out = []; for (const para of String(str).split('\n')) { let cur = ''; for (const w of para.split(' ')) { const t = cur ? cur + ' ' + w : w; if (textW(t, scale) > maxW && cur) { out.push(cur); cur = w; } else cur = t; } out.push(cur); } return out; }
// pixel buffer for procedural icons
class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.c = document.createElement('canvas'); this.c.width = w; this.c.height = h; this.x = this.c.getContext('2d'); }
  p(x, y, col) { this.x.fillStyle = col; this.x.fillRect(x, y, 1, 1); return this; }
  r(x, y, w, h, col) { this.x.fillStyle = col; this.x.fillRect(x, y, w, h); return this; }
  line(x0, y0, x1, y1, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) this.p(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col); return this; }
}

// ---- 10_assets.js ----
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
  mk('book', p => { p.r(3, 2, 10, 12, col.leather2).r(4, 3, 9, 10, '#a04030').r(12, 3, 1, 10, '#e8d8a8').r(13, 3, 1, 10, '#d8c898').r(6, 5, 5, 1, col.gold).r(6, 7, 5, 1, col.gold).r(6, 9, 3, 1, col.gold); });
  mk('scroll', p => { p.r(3, 3, 10, 10, '#e8d8a8').r(2, 2, 12, 2, '#c8a870').r(2, 12, 12, 2, '#c8a870').r(5, 6, 6, 1, '#6a5030').r(5, 8, 6, 1, '#6a5030').r(5, 10, 4, 1, '#6a5030'); });
  mk('empty', p => { });
}
function iconCanvas(id) {
  if (A.icons[id]) return A.icons[id];
  const t = TILE_ICONS[id]; if (!t) return A.icons.empty;
  const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d'); x.drawImage(A.tiles, t[0] * 16, t[1] * 16, 16, 16, 0, 0, 16, 16);
  A.icons[id] = c; return c;
}

// ---- 20_data.js ----
// ===================== rules data =====================
const STATS = ['mt', 'it', 'pe', 'en', 'ac', 'sp', 'lk'];
const STAT_NAMES = { mt: 'Might', it: 'Intellect', pe: 'Personality', en: 'Endurance', ac: 'Accuracy', sp: 'Speed', lk: 'Luck' };
function statBonus(v) { if (v <= 2) return -5; if (v <= 4) return -3; if (v <= 6) return -2; if (v <= 8) return -1; if (v <= 12) return 0; if (v <= 14) return 1; if (v <= 16) return 2; if (v <= 18) return 3; if (v <= 20) return 4; if (v <= 24) return 5; if (v <= 29) return 6; if (v <= 34) return 7; if (v <= 39) return 8; if (v <= 49) return 9; if (v <= 74) return 10; if (v <= 99) return 11; return 12 + Math.floor((v - 100) / 25); }
const XP_FOR_LEVEL = lv => 1000 * (lv - 1) * lv / 2; // xp needed to be trained to level lv
const TRAIN_COST = lv => 100 * lv;

const SKILLS = {
  Sword: { kind: 'weapon', desc: 'Swords and blades. +1 to hit per level; Expert: +recovery, Master: +1 damage per level.' },
  Axe: { kind: 'weapon', desc: 'Axes. +1 to hit per level; Master: +1 damage per level.' },
  Mace: { kind: 'weapon', desc: 'Maces and clubs. +1 to hit per level; Expert: chance to stun.' },
  Dagger: { kind: 'weapon', desc: 'Daggers. +1 to hit per level; Master: triple damage chance.' },
  Spear: { kind: 'weapon', desc: 'Spears and polearms. +1 to hit per level; Expert: +1 AC.' },
  Bow: { kind: 'weapon', desc: 'Bows. +1 to hit per level; Expert: faster, Master: two arrows.' },
  Staff: { kind: 'weapon', desc: 'Staves and wands. +1 to hit per level; Expert: +2 AC per level.' },
  Leather: { kind: 'armor', desc: 'Leather armor. Reduces armor recovery penalty; Expert: +1 AC per level.' },
  Chain: { kind: 'armor', desc: 'Chain mail. Reduces armor recovery penalty; Expert: +1 AC per level.' },
  Plate: { kind: 'armor', desc: 'Plate armor. Reduces armor recovery penalty; Expert: +1 AC per level.' },
  Shield: { kind: 'armor', desc: 'Shields. +1 AC per level.' },
  Fire: { kind: 'magic', desc: 'Fire magic: bolts and blasts.' }, Air: { kind: 'magic', desc: 'Air magic: sparks, shields, lightning.' },
  Water: { kind: 'magic', desc: 'Water magic: ice, poison, and Town Portal.' }, Earth: { kind: 'magic', desc: 'Earth magic: stone skin, stun, rock blast.' },
  Spirit: { kind: 'magic', desc: 'Spirit magic: blessings, heroism, raising the dead.' }, Mind: { kind: 'magic', desc: 'Mind magic: blasts that ignore armor, fear.' },
  Body: { kind: 'magic', desc: 'Body magic: healing and cures.' },
  BodyBuilding: { kind: 'misc', desc: '+1 hit point per level, every level.' }, Meditation: { kind: 'misc', desc: '+1 spell point per level, every level.' },
  Perception: { kind: 'misc', desc: 'More gold from chests and monsters.' }, Merchant: { kind: 'misc', desc: 'Better prices when buying and selling.' },
  Learning: { kind: 'misc', desc: '+5% experience per level.' }, Disarm: { kind: 'misc', desc: 'Chance to disarm chest traps.' },
};
const RANK = lv => lv >= 8 ? 'Master' : lv >= 4 ? 'Expert' : lv >= 1 ? 'Novice' : '-';

const CLASSES = {
  Knight: { sprite: 'SkilledBattlemage', hpLv: 8, spLv: 0, spStat: null, baseHp: 40, baseSp: 0, stats: { mt: 15, it: 7, pe: 9, en: 15, ac: 12, sp: 11, lk: 9 },
    start: { Sword: 1, Chain: 1, Shield: 1, BodyBuilding: 1 }, learnable: ['Sword', 'Axe', 'Mace', 'Spear', 'Dagger', 'Leather', 'Chain', 'Plate', 'Shield', 'BodyBuilding', 'Perception', 'Merchant', 'Learning', 'Disarm'],
    schools: [], gear: ['long_sword', 'chain_mail', 'buckler'], spells: [], desc: 'A master of arms. The most hit points, the heaviest armor, no magic.' },
  Paladin: { sprite: 'CapableCryomancer', hpLv: 6, spLv: 2, spStat: 'pe', baseHp: 34, baseSp: 6, stats: { mt: 13, it: 8, pe: 13, en: 13, ac: 11, sp: 10, lk: 10 },
    start: { Mace: 1, Chain: 1, Shield: 1, Spirit: 1 }, learnable: ['Sword', 'Mace', 'Spear', 'Leather', 'Chain', 'Plate', 'Shield', 'Spirit', 'Body', 'BodyBuilding', 'Meditation', 'Merchant', 'Learning'],
    schools: ['Spirit', 'Body'], gear: ['mace', 'chain_mail', 'buckler'], spells: ['bless'], desc: 'A holy warrior. Strong in combat with a little spirit magic.' },
  Archer: { sprite: 'SilentRanger', hpLv: 5, spLv: 2, spStat: 'it', baseHp: 30, baseSp: 6, stats: { mt: 12, it: 12, pe: 8, en: 11, ac: 15, sp: 13, lk: 10 },
    start: { Bow: 2, Leather: 1, Air: 1, Perception: 1 }, learnable: ['Bow', 'Dagger', 'Sword', 'Spear', 'Leather', 'Chain', 'Air', 'Fire', 'Water', 'Earth', 'Perception', 'Learning', 'Disarm', 'Merchant'],
    schools: ['Air', 'Fire', 'Water', 'Earth'], gear: ['short_bow', 'leather_armor', 'dagger'], spells: ['sparks'], desc: 'Deadly at range, with elemental magic to learn.' },
  Cleric: { sprite: 'ExpertDruid', hpLv: 4, spLv: 3, spStat: 'pe', baseHp: 28, baseSp: 10, stats: { mt: 10, it: 10, pe: 15, en: 11, ac: 10, sp: 10, lk: 11 },
    start: { Mace: 1, Leather: 1, Body: 1, Spirit: 1 }, learnable: ['Mace', 'Staff', 'Leather', 'Chain', 'Shield', 'Spirit', 'Mind', 'Body', 'Meditation', 'Merchant', 'Learning', 'Perception'],
    schools: ['Spirit', 'Mind', 'Body'], gear: ['mace', 'leather_armor', 'buckler'], spells: ['cure_wounds', 'bless'], desc: 'Healer and protector. Spirit, Mind and Body magic.' },
  Sorcerer: { sprite: 'FlameMagus', hpLv: 3, spLv: 4, spStat: 'it', baseHp: 24, baseSp: 14, stats: { mt: 8, it: 16, pe: 10, en: 9, ac: 10, sp: 12, lk: 11 },
    start: { Staff: 1, Leather: 1, Fire: 1, Air: 1 }, learnable: ['Staff', 'Dagger', 'Leather', 'Fire', 'Air', 'Water', 'Earth', 'Meditation', 'Learning', 'Merchant', 'Disarm'],
    schools: ['Fire', 'Air', 'Water', 'Earth'], gear: ['staff', 'robe', 'dagger'], spells: ['fire_bolt', 'torch_light'], desc: 'Elemental mage. Fragile, but devastating.' },
  Druid: { sprite: 'VileWitch', hpLv: 4, spLv: 3, spStat: 'it', baseHp: 26, baseSp: 12, stats: { mt: 9, it: 14, pe: 14, en: 10, ac: 10, sp: 11, lk: 12 },
    start: { Dagger: 1, Leather: 1, Earth: 1, Body: 1 }, learnable: ['Dagger', 'Staff', 'Leather', 'Fire', 'Water', 'Earth', 'Body', 'Mind', 'Meditation', 'Learning', 'Perception'],
    schools: ['Earth', 'Water', 'Fire', 'Body', 'Mind'], gear: ['dagger', 'leather_armor', 'staff'], spells: ['stun', 'cure_wounds'], desc: 'Elemental and body magic, nature\'s balance.' },
};
const NAME_POOL = ['Roderick', 'Sable', 'Mira', 'Vesper', 'Aldric', 'Brenna', 'Cedric', 'Dara', 'Edmund', 'Fenna', 'Garrick', 'Hesper', 'Isolde', 'Joren', 'Kael', 'Lysa', 'Marek', 'Nessa', 'Orin', 'Petra', 'Quill', 'Rhoswen', 'Soren', 'Tamsin', 'Ulric', 'Wren'];

// ---- items ----
const ITEMS = {
  // weapons: dmg [n, sides, bonus], rec = base recovery in ticks (lower is faster)
  dagger: { name: 'Dagger', type: 'weapon', skill: 'Dagger', dmg: [1, 4, 0], rec: 40, value: 20, tier: 1, icon: 'dagger' },
  long_dagger: { name: 'Long Dagger', type: 'weapon', skill: 'Dagger', dmg: [2, 3, 0], rec: 45, value: 90, tier: 2, icon: 'dagger' },
  short_sword: { name: 'Short Sword', type: 'weapon', skill: 'Sword', dmg: [1, 6, 0], rec: 60, value: 40, tier: 1, icon: 'sword' },
  long_sword: { name: 'Long Sword', type: 'weapon', skill: 'Sword', dmg: [2, 4, 0], rec: 70, value: 120, tier: 1, icon: 'sword2' },
  broad_sword: { name: 'Broad Sword', type: 'weapon', skill: 'Sword', dmg: [3, 4, 0], rec: 80, value: 350, tier: 2, icon: 'sword2' },
  great_sword: { name: 'Great Sword', type: 'weapon', skill: 'Sword', dmg: [4, 5, 0], rec: 100, value: 900, tier: 3, icon: 'sword3', twoHand: true },
  hand_axe: { name: 'Hand Axe', type: 'weapon', skill: 'Axe', dmg: [1, 8, 0], rec: 80, value: 45, tier: 1, icon: 'axe' },
  battle_axe: { name: 'Battle Axe', type: 'weapon', skill: 'Axe', dmg: [2, 8, 0], rec: 100, value: 380, tier: 2, icon: 'axe', twoHand: true },
  club: { name: 'Club', type: 'weapon', skill: 'Mace', dmg: [1, 4, 1], rec: 60, value: 15, tier: 1, icon: 'mace' },
  mace: { name: 'Mace', type: 'weapon', skill: 'Mace', dmg: [1, 6, 1], rec: 70, value: 60, tier: 1, icon: 'mace' },
  morning_star: { name: 'Morning Star', type: 'weapon', skill: 'Mace', dmg: [2, 5, 1], rec: 85, value: 320, tier: 2, icon: 'mace' },
  spear: { name: 'Spear', type: 'weapon', skill: 'Spear', dmg: [1, 8, 1], rec: 80, value: 60, tier: 1, icon: 'spear' },
  halberd: { name: 'Halberd', type: 'weapon', skill: 'Spear', dmg: [3, 5, 1], rec: 100, value: 650, tier: 3, icon: 'spear', twoHand: true },
  staff: { name: 'Staff', type: 'weapon', skill: 'Staff', dmg: [1, 6, 0], rec: 80, value: 30, tier: 1, icon: 'staff', twoHand: true },
  wand: { name: 'Wand', type: 'weapon', skill: 'Staff', dmg: [1, 4, 0], rec: 50, value: 90, tier: 2, icon: 'wand', spellPower: 2 },
  short_bow: { name: 'Short Bow', type: 'weapon', skill: 'Bow', dmg: [1, 6, 0], rec: 70, value: 50, tier: 1, icon: 'bow', ranged: true },
  long_bow: { name: 'Long Bow', type: 'weapon', skill: 'Bow', dmg: [2, 4, 0], rec: 80, value: 220, tier: 2, icon: 'bow', ranged: true },
  composite_bow: { name: 'Composite Bow', type: 'weapon', skill: 'Bow', dmg: [3, 4, 1], rec: 85, value: 700, tier: 3, icon: 'bow', ranged: true },
  // armor
  robe: { name: 'Robe', type: 'armor', skill: null, acv: 2, value: 20, tier: 1, icon: 'robe' },
  leather_armor: { name: 'Leather Armor', type: 'armor', skill: 'Leather', acv: 4, recPen: 5, value: 50, tier: 1, icon: 'leather' },
  studded_leather: { name: 'Studded Leather', type: 'armor', skill: 'Leather', acv: 6, recPen: 10, value: 180, tier: 2, icon: 'leather' },
  chain_mail: { name: 'Chain Mail', type: 'armor', skill: 'Chain', acv: 8, recPen: 15, value: 150, tier: 1, icon: 'chain' },
  scale_mail: { name: 'Scale Mail', type: 'armor', skill: 'Chain', acv: 10, recPen: 20, value: 420, tier: 2, icon: 'chain' },
  plate_mail: { name: 'Plate Mail', type: 'armor', skill: 'Plate', acv: 13, recPen: 30, value: 900, tier: 3, icon: 'plate' },
  full_plate: { name: 'Full Plate', type: 'armor', skill: 'Plate', acv: 17, recPen: 40, value: 2200, tier: 4, icon: 'plate' },
  buckler: { name: 'Buckler', type: 'shield', skill: 'Shield', acv: 2, value: 30, tier: 1, icon: 'shield' },
  shield: { name: 'Shield', type: 'shield', skill: 'Shield', acv: 4, value: 110, tier: 2, icon: 'shield' },
  tower_shield: { name: 'Tower Shield', type: 'shield', skill: 'Shield', acv: 6, value: 400, tier: 3, icon: 'shield' },
  cap: { name: 'Leather Cap', type: 'helm', acv: 1, value: 25, tier: 1, icon: 'cap' },
  helm: { name: 'Iron Helm', type: 'helm', acv: 3, value: 140, tier: 2, icon: 'helm' },
  great_helm: { name: 'Great Helm', type: 'helm', acv: 5, value: 520, tier: 3, icon: 'helm' },
  boots: { name: 'Boots', type: 'boots', acv: 1, value: 30, tier: 1, icon: 'boots' },
  iron_boots: { name: 'Iron Boots', type: 'boots', acv: 3, value: 160, tier: 2, icon: 'boots' },
  ring: { name: 'Ring', type: 'ring', value: 100, tier: 2, icon: 'ring' },
  amulet: { name: 'Amulet', type: 'amulet', value: 150, tier: 2, icon: 'amulet' },
  // consumables
  potion_heal: { name: 'Potion of Healing', type: 'potion', use: 'heal', power: 30, value: 40, tier: 1, icon: 'potion_red', stack: true },
  potion_heal2: { name: 'Potion of Restoration', type: 'potion', use: 'heal', power: 90, value: 150, tier: 2, icon: 'potion_red', stack: true },
  potion_mana: { name: 'Potion of Mana', type: 'potion', use: 'mana', power: 25, value: 60, tier: 1, icon: 'potion_blue', stack: true },
  potion_mana2: { name: 'Potion of Insight', type: 'potion', use: 'mana', power: 70, value: 200, tier: 2, icon: 'potion_blue', stack: true },
  potion_cure: { name: 'Antidote', type: 'potion', use: 'cure', value: 35, tier: 1, icon: 'potion_green', stack: true },
  food: { name: 'Rations', type: 'food', value: 5, tier: 1, icon: 'food', stack: true },
  torch: { name: 'Torch', type: 'misc', use: 'torch', value: 8, tier: 1, icon: 'torch', stack: true },
  // quest & misc
  gold_pile: { name: 'Gold', type: 'gold', icon: 'gold' },
  iron_ore: { name: 'Iron Ore', type: 'quest', value: 10, icon: 'ore', stack: true },
  marsh_herb: { name: 'Marsh Herb', type: 'quest', value: 8, icon: 'herb', stack: true },
  goblin_signet: { name: 'Goblin King\'s Signet', type: 'quest', value: 0, icon: 'ring', lore: 'A crude iron ring. The Warrens are leaderless without it.' },
  widow_locket: { name: 'Silver Locket', type: 'quest', value: 0, icon: 'amulet', lore: 'A locket with a faded portrait inside.' },
  pilgrim_letter: { name: 'Pilgrim\'s Letter', type: 'quest', value: 0, icon: 'letter', lore: 'Water-stained. "...we reached the barrow at dusk. The trees moved."' },
  barrow_relic: { name: 'Relic of the Mandate', type: 'quest', value: 0, icon: 'relic', lore: 'A reliquary of old gold. It hums faintly near the Sanctum.' },
  lost_tome: { name: 'Tome of Hollow Stars', type: 'quest', value: 0, icon: 'book', lore: 'The scholar\'s missing spellbook, bound in frost.' },
  frost_key: { name: 'Frost Key', type: 'quest', value: 0, icon: 'key2', lore: 'Cold enough to burn. One of the two keys to the Sanctum.' },
  brass_key: { name: 'Brass Key', type: 'quest', value: 0, icon: 'key', lore: 'Still warm. The second key to the Sanctum.' },
  scepter: { name: 'Scepter of the Mandate', type: 'quest', value: 0, icon: 'scepter', lore: 'The Mandate of Heaven, made solid.' },
};
const SLOT_OF = { weapon: 'weapon', armor: 'armor', shield: 'shield', helm: 'helm', boots: 'boots', ring: 'ring', amulet: 'amulet' };
const ENCHANTS = [
  { id: 'mt', name: 'of Might', stat: 'mt', slots: ['weapon', 'ring', 'amulet', 'helm'], v: [2, 6] }, { id: 'it', name: 'of Thought', stat: 'it', slots: ['ring', 'amulet', 'helm', 'armor'], v: [2, 6] },
  { id: 'pe', name: 'of Charm', stat: 'pe', slots: ['ring', 'amulet', 'helm'], v: [2, 6] }, { id: 'en', name: 'of Vigor', stat: 'en', slots: ['armor', 'ring', 'amulet', 'boots'], v: [2, 6] },
  { id: 'ac_', name: 'of Precision', stat: 'ac', slots: ['weapon', 'ring', 'boots'], v: [2, 6] }, { id: 'sp', name: 'of Speed', stat: 'sp', slots: ['boots', 'ring', 'weapon'], v: [2, 6] },
  { id: 'lk', name: 'of Fortune', stat: 'lk', slots: ['ring', 'amulet'], v: [2, 6] },
  { id: 'fire', name: 'of Fire', elem: 'fire', slots: ['weapon'], v: [2, 6] }, { id: 'cold', name: 'of Frost', elem: 'cold', slots: ['weapon'], v: [2, 6] },
  { id: 'elec', name: 'of Lightning', elem: 'elec', slots: ['weapon'], v: [2, 6] }, { id: 'poison', name: 'of Venom', elem: 'poison', slots: ['weapon'], v: [2, 6] },
  { id: 'rfire', name: 'of Fire Warding', res: 'fire', slots: ['armor', 'shield', 'amulet', 'ring'], v: [10, 25] }, { id: 'rcold', name: 'of Frost Warding', res: 'cold', slots: ['armor', 'shield', 'amulet', 'ring'], v: [10, 25] },
  { id: 'hp', name: 'of Health', hp: 1, slots: ['armor', 'amulet', 'ring', 'helm'], v: [5, 20] }, { id: 'sp_', name: 'of Mana', spts: 1, slots: ['ring', 'amulet', 'helm', 'armor'], v: [5, 20] },
  { id: 'acv', name: 'of Protection', acv: 1, slots: ['armor', 'shield', 'helm', 'boots', 'ring'], v: [2, 6] }, { id: 'dmg', name: 'of Slaying', dmg: 1, slots: ['weapon'], v: [1, 4] },
];
function makeItem(id, ench, power = 1) {
  const base = ITEMS[id]; if (!base) return null;
  const it = { id, qty: 1, ench: null, ev: 0 };
  if (ench) { const e = typeof ench === 'string' ? ENCHANTS.find(x => x.id === ench) : ench; if (e) { it.ench = e.id; it.ev = rint(e.v[0], e.v[1]) + Math.floor(power); } }
  return it;
}
function itemName(it) { const b = ITEMS[it.id]; if (!b) return '?'; const e = it.ench && ENCHANTS.find(x => x.id === it.ench); return (b.name + (e ? ' ' + e.name : '')) + (it.qty > 1 ? ' x' + it.qty : ''); }
function itemValue(it) { const b = ITEMS[it.id]; let v = b.value || 0; if (it.ench) v += 60 + it.ev * 40; return v * (it.qty || 1); }
function itemDesc(it) {
  const b = ITEMS[it.id]; const parts = [];
  if (b.type === 'weapon') parts.push('Damage ' + b.dmg[0] + 'd' + b.dmg[1] + (b.dmg[2] ? '+' + b.dmg[2] : '') + ', ' + (b.ranged ? 'ranged' : 'melee') + ', ' + b.skill + ' skill' + (b.twoHand ? ', two-handed' : ''));
  if (b.acv) parts.push('Armor +' + b.acv + (b.skill ? ' (' + b.skill + ' skill)' : ''));
  if (b.recPen) parts.push('Recovery penalty ' + b.recPen);
  if (b.use === 'heal') parts.push('Restores ' + b.power + ' hit points'); if (b.use === 'mana') parts.push('Restores ' + b.power + ' spell points'); if (b.use === 'cure') parts.push('Cures poison and disease');
  if (b.type === 'food') parts.push('One day of food for the party'); if (b.use === 'torch') parts.push('Light for one hour');
  if (it.ench) { const e = ENCHANTS.find(x => x.id === it.ench); if (e.stat) parts.push('+' + it.ev + ' ' + STAT_NAMES[e.stat]); if (e.elem) parts.push('+' + it.ev + ' ' + e.elem + ' damage'); if (e.res) parts.push('+' + it.ev + ' ' + e.res + ' resistance'); if (e.hp) parts.push('+' + it.ev + ' hit points'); if (e.spts) parts.push('+' + it.ev + ' spell points'); if (e.acv) parts.push('+' + it.ev + ' armor'); if (e.dmg) parts.push('+' + it.ev + ' damage'); }
  if (b.lore) parts.push(b.lore);
  parts.push('Value ' + fmtNum(itemValue(it)) + ' gold');
  return parts.join('. ');
}
// random loot by tier
const LOOT = {
  1: ['dagger', 'short_sword', 'club', 'hand_axe', 'spear', 'short_bow', 'leather_armor', 'cap', 'boots', 'buckler', 'potion_heal', 'potion_heal', 'potion_mana', 'potion_cure', 'food', 'torch', 'staff'],
  2: ['long_sword', 'mace', 'long_dagger', 'spear', 'long_bow', 'studded_leather', 'chain_mail', 'helm', 'boots', 'shield', 'ring', 'amulet', 'potion_heal2', 'potion_mana', 'potion_cure', 'wand'],
  3: ['broad_sword', 'morning_star', 'battle_axe', 'composite_bow', 'scale_mail', 'plate_mail', 'great_helm', 'iron_boots', 'tower_shield', 'ring', 'amulet', 'potion_heal2', 'potion_mana2'],
  4: ['great_sword', 'halberd', 'full_plate', 'plate_mail', 'great_helm', 'ring', 'amulet', 'composite_bow', 'potion_heal2', 'potion_mana2'],
};
function randomLoot(tier, luck = 0) {
  tier = clamp(tier, 1, 4); const id = pick(LOOT[Math.random() < 0.25 && tier < 4 ? tier + 1 : tier]); const b = ITEMS[id];
  let ench = null; if (SLOT_OF[b.type] && Math.random() < 0.18 + tier * 0.08 + luck * 0.01) { const opts = ENCHANTS.filter(e => e.slots.includes(b.type)); ench = pick(opts); }
  const it = makeItem(id, ench, tier - 1); if (b.stack && Math.random() < 0.4) it.qty = rint(1, 3); return it;
}

// ---- spells ----
const SPELLS = {
  torch_light: { name: 'Torch Light', school: 'Fire', lvl: 1, sp: 2, kind: 'party', desc: 'Light the darkness around the party for an hour.', price: 100 },
  fire_bolt: { name: 'Fire Bolt', school: 'Fire', lvl: 1, sp: 3, kind: 'bolt', elem: 'fire', dmg: [1, 8, 0], perSkill: 2, range: 8, desc: 'A bolt of flame. 1d8 +2 per skill level fire damage.', price: 150 },
  ring_of_fire: { name: 'Ring of Fire', school: 'Fire', lvl: 2, sp: 6, kind: 'around', elem: 'fire', dmg: [2, 6, 0], perSkill: 2, radius: 3, desc: 'Burns every enemy within 3 tiles for 2d6 +2 per level.', price: 500 },
  fireball: { name: 'Fireball', school: 'Fire', lvl: 3, sp: 9, kind: 'aoe', elem: 'fire', dmg: [3, 6, 0], perSkill: 3, range: 8, radius: 2.2, desc: 'Explodes on the target. 3d6 +3 per level to all nearby.', price: 1200 },
  wizard_eye: { name: 'Wizard Eye', school: 'Air', lvl: 1, sp: 2, kind: 'party', desc: 'Reveals monsters on the map for an hour.', price: 100 },
  sparks: { name: 'Sparks', school: 'Air', lvl: 1, sp: 3, kind: 'multi', elem: 'elec', dmg: [1, 4, 0], perSkill: 1, range: 6, desc: 'Several sparks of 1d4 +1 per level, one per nearby enemy (up to 2 + level/2).', price: 150 },
  shield: { name: 'Shield', school: 'Air', lvl: 2, sp: 5, kind: 'party', buff: 'shield', desc: 'Party armor +8 +1 per level for an hour.', price: 500 },
  lightning_bolt: { name: 'Lightning Bolt', school: 'Air', lvl: 3, sp: 9, kind: 'bolt', elem: 'elec', dmg: [4, 6, 0], perSkill: 3, range: 9, chain: true, desc: '4d6 +3 per level lightning, arcing to a second enemy.', price: 1200 },
  ice_bolt: { name: 'Ice Bolt', school: 'Water', lvl: 1, sp: 3, kind: 'bolt', elem: 'cold', dmg: [1, 8, 0], perSkill: 2, range: 8, slow: true, desc: 'A shard of ice. 1d8 +2 per level cold damage, slows the target.', price: 150 },
  poison_spray: { name: 'Poison Spray', school: 'Water', lvl: 2, sp: 5, kind: 'around', elem: 'poison', dmg: [2, 6, 0], perSkill: 2, radius: 2.5, poison: true, desc: 'Poisons every enemy within 2 tiles.', price: 500 },
  acid_burst: { name: 'Acid Burst', school: 'Water', lvl: 3, sp: 9, kind: 'bolt', elem: 'poison', dmg: [5, 6, 0], perSkill: 3, range: 8, desc: '5d6 +3 per level acid damage.', price: 1200 },
  town_portal: { name: 'Town Portal', school: 'Water', lvl: 3, sp: 12, kind: 'utility', desc: 'Returns the party to the square of Harrowmere.', price: 2000 },
  stun: { name: 'Stun', school: 'Earth', lvl: 1, sp: 3, kind: 'bolt', elem: 'phys', dmg: [1, 4, 0], perSkill: 1, range: 6, stunT: 3, desc: 'Stuns the target for 3 seconds (+0.5 per level).', price: 150 },
  slow: { name: 'Slow', school: 'Earth', lvl: 2, sp: 5, kind: 'around', elem: 'none', radius: 4, slowT: 12, desc: 'Slows every enemy within 4 tiles for 12 seconds (+2 per level).', price: 500 },
  stone_skin: { name: 'Stone Skin', school: 'Earth', lvl: 2, sp: 5, kind: 'party', buff: 'stoneskin', desc: 'Party armor +12 +1 per level for an hour.', price: 500 },
  rock_blast: { name: 'Rock Blast', school: 'Earth', lvl: 3, sp: 9, kind: 'aoe', elem: 'phys', dmg: [3, 8, 0], perSkill: 2, range: 7, radius: 2.2, desc: '3d8 +2 per level crushing damage to all near the target.', price: 1200 },
  bless: { name: 'Bless', school: 'Spirit', lvl: 1, sp: 3, kind: 'party', buff: 'bless', desc: 'Party to-hit +5 +1 per level for an hour.', price: 150 },
  spirit_lash: { name: 'Spirit Lash', school: 'Spirit', lvl: 2, sp: 5, kind: 'bolt', elem: 'spirit', dmg: [2, 8, 0], perSkill: 2, range: 7, desc: '2d8 +2 per level spirit damage.', price: 500 },
  heroism: { name: 'Heroism', school: 'Spirit', lvl: 3, sp: 7, kind: 'party', buff: 'heroism', desc: 'Party damage +3 +1 per level for an hour.', price: 1200 },
  raise_dead: { name: 'Raise Dead', school: 'Spirit', lvl: 4, sp: 18, kind: 'party', desc: 'Returns every dead companion to life with a sliver of health. Expert required.', price: 3000 },
  mind_blast: { name: 'Mind Blast', school: 'Mind', lvl: 1, sp: 3, kind: 'bolt', elem: 'mind', dmg: [1, 6, 0], perSkill: 2, range: 7, desc: '1d6 +2 per level mind damage that ignores armor.', price: 150 },
  mind_shield: { name: 'Mind Shield', school: 'Mind', lvl: 2, sp: 4, kind: 'party', buff: 'mindshield', desc: 'Party immune to fear and stun for an hour.', price: 500 },
  fear: { name: 'Fear', school: 'Mind', lvl: 2, sp: 6, kind: 'around', elem: 'none', radius: 5, fearT: 6, desc: 'Enemies within 5 tiles flee for 6 seconds (+1 per level).', price: 600 },
  psychic_shock: { name: 'Psychic Shock', school: 'Mind', lvl: 3, sp: 10, kind: 'bolt', elem: 'mind', dmg: [6, 6, 0], perSkill: 3, range: 7, desc: '6d6 +3 per level mind damage.', price: 1400 },
  cure_wounds: { name: 'Cure Wounds', school: 'Body', lvl: 1, sp: 3, kind: 'heal', heal: 6, perSkill: 5, desc: 'Heals the most wounded companion 6 +5 per level.', price: 150 },
  cure_poison: { name: 'Cure Poison', school: 'Body', lvl: 1, sp: 2, kind: 'cure', desc: 'Cures poison and disease in the whole party.', price: 120 },
  flying_fist: { name: 'Flying Fist', school: 'Body', lvl: 2, sp: 5, kind: 'bolt', elem: 'phys', dmg: [2, 8, 0], perSkill: 2, range: 6, desc: '2d8 +2 per level crushing damage.', price: 500 },
  power_cure: { name: 'Power Cure', school: 'Body', lvl: 3, sp: 10, kind: 'healall', heal: 10, perSkill: 6, desc: 'Heals every companion 10 +6 per level.', price: 1200 },
};
const SCHOOLS = ['Fire', 'Air', 'Water', 'Earth', 'Spirit', 'Mind', 'Body'];
const SCHOOL_COLOR = { Fire: '#ff7a30', Air: '#9ad8ff', Water: '#4a9aff', Earth: '#c8a060', Spirit: '#f0e0a0', Mind: '#d080ff', Body: '#80e080' };

// ---- monsters ----
// hp, acv (armor), atk (to-hit bonus), dmg dice, spd (tiles/s), xp, gold, res {fire,cold,elec,poison,mind,phys}, ranged {type, range}, spell, special, tier
const MONSTERS = {
  // tier 1
  goblin: { name: 'Goblin', spr: 'GoblinFighter', hp: 14, acv: 6, atk: 2, dmg: [1, 6, 0], spd: 2.6, xp: 25, gold: [2, 12], tier: 1 },
  goblin_archer: { name: 'Goblin Archer', spr: 'GoblinArcher', hp: 11, acv: 5, atk: 3, dmg: [1, 6, 0], spd: 2.4, xp: 30, gold: [3, 14], tier: 1, ranged: { type: 'arrow', range: 6 } },
  goblin_shaman: { name: 'Goblin Shaman', spr: 'GoblinOccultist', hp: 12, acv: 5, atk: 2, dmg: [1, 4, 0], spd: 2.2, xp: 45, gold: [8, 20], tier: 1, spell: 'spark' },
  scarecrow: { name: 'Scarecrow', spr: 'ScarecrowGolem', hp: 18, acv: 4, atk: 1, dmg: [1, 6, 0], spd: 1.6, xp: 20, gold: [0, 3], tier: 1, res: { fire: -50, mind: 100, poison: 100 } },
  wild_dog: { name: 'Wild Dog', spr: 'BlinkDog', hp: 10, acv: 7, atk: 3, dmg: [1, 4, 1], spd: 3.4, xp: 18, gold: [0, 0], tier: 1 },
  bandit: { name: 'Halfling Bandit', spr: 'HalflingRogue', hp: 16, acv: 8, atk: 3, dmg: [1, 6, 1], spd: 2.8, xp: 35, gold: [10, 30], tier: 1 },
  bandit_slinger: { name: 'Halfling Slinger', spr: 'HalflingSlinger', hp: 12, acv: 7, atk: 4, dmg: [1, 5, 0], spd: 2.6, xp: 35, gold: [8, 25], tier: 1, ranged: { type: 'rock', range: 6 } },
  goblin_king: { name: 'Gruk, Goblin King', spr: 'GoblinWolfRider', hp: 140, acv: 12, atk: 7, dmg: [2, 8, 2], spd: 2.6, xp: 600, gold: [150, 300], tier: 2, boss: true, size: 1.5, special: 'regen' },
  // tier 2
  lizard_scout: { name: 'Lizardfolk Scout', spr: 'LizardfolkScout', hp: 26, acv: 10, atk: 5, dmg: [1, 8, 1], spd: 3.0, xp: 60, gold: [10, 30], tier: 2 },
  lizard_spear: { name: 'Lizardfolk Spearman', spr: 'LizardfolkSpearman', hp: 34, acv: 12, atk: 6, dmg: [2, 6, 1], spd: 2.4, xp: 80, gold: [12, 35], tier: 2 },
  lizard_archer: { name: 'Lizardfolk Archer', spr: 'LizardfolkArcher', hp: 24, acv: 9, atk: 7, dmg: [1, 8, 0], spd: 2.6, xp: 75, gold: [10, 30], tier: 2, ranged: { type: 'arrow', range: 7 } },
  lizard_gladiator: { name: 'Lizardfolk Gladiator', spr: 'LizardfolkGladiator', hp: 55, acv: 15, atk: 8, dmg: [2, 8, 2], spd: 2.5, xp: 150, gold: [30, 60], tier: 2 },
  bestial_lizard: { name: 'Bestial Lizardfolk', spr: 'BestialLizardfolk', hp: 70, acv: 13, atk: 8, dmg: [3, 6, 2], spd: 3.0, xp: 200, gold: [20, 50], tier: 3, special: 'poison' },
  satyr: { name: 'Satyr', spr: 'SneakySatyr', hp: 28, acv: 11, atk: 6, dmg: [1, 8, 2], spd: 3.4, xp: 70, gold: [15, 40], tier: 2 },
  pixie: { name: 'Pixie', spr: 'FlutteringPixie', hp: 14, acv: 14, atk: 5, dmg: [1, 4, 0], spd: 3.2, xp: 60, gold: [5, 25], tier: 2, spell: 'spark', fly: true },
  wisp: { name: 'Glowing Wisp', spr: 'GlowingWisp', hp: 20, acv: 16, atk: 6, dmg: [1, 6, 0], spd: 2.8, xp: 80, gold: [0, 10], tier: 2, spell: 'spark', fly: true, res: { elec: 100, phys: 50 }, light: true },
  fairy: { name: 'Fairy', spr: 'MagicalFairy', hp: 18, acv: 15, atk: 5, dmg: [1, 4, 0], spd: 3.0, xp: 70, gold: [5, 30], tier: 2, spell: 'heal_ally', fly: true },
  treant: { name: 'Blighted Treant', spr: 'CorruptedTreant', hp: 60, acv: 12, atk: 6, dmg: [2, 8, 1], spd: 1.5, xp: 160, gold: [0, 15], tier: 2, res: { fire: -50, poison: 100, cold: 50 } },
  wolf_rider: { name: 'Goblin Wolf Rider', spr: 'GoblinWolfRider', hp: 40, acv: 12, atk: 7, dmg: [2, 6, 1], spd: 3.6, xp: 120, gold: [15, 40], tier: 2 },
  assassin: { name: 'Halfling Assassin', spr: 'HalflingAssassin', hp: 32, acv: 14, atk: 9, dmg: [2, 6, 2], spd: 3.2, xp: 130, gold: [25, 60], tier: 2, special: 'poison' },
  ranger: { name: 'Halfling Ranger', spr: 'HalflingRanger', hp: 30, acv: 12, atk: 8, dmg: [2, 5, 1], spd: 2.8, xp: 110, gold: [20, 50], tier: 2, ranged: { type: 'arrow', range: 8 } },
  bard: { name: 'Halfling Bard', spr: 'HalflingBard', hp: 26, acv: 10, atk: 5, dmg: [1, 6, 0], spd: 2.8, xp: 100, gold: [30, 70], tier: 2, spell: 'fear_party' },
  // tier 3
  clay_golem: { name: 'Clay Golem', spr: 'ClayGolem', hp: 90, acv: 14, atk: 8, dmg: [2, 10, 2], spd: 1.6, xp: 260, gold: [0, 20], tier: 3, res: { mind: 100, poison: 100, elec: 50 } },
  stone_golem: { name: 'Stone Golem', spr: 'StoneGolem', hp: 130, acv: 18, atk: 9, dmg: [3, 8, 2], spd: 1.5, xp: 380, gold: [0, 30], tier: 3, res: { mind: 100, poison: 100, fire: 50, cold: 50 } },
  iron_golem: { name: 'Iron Golem', spr: 'IronGolem', hp: 170, acv: 22, atk: 11, dmg: [3, 10, 3], spd: 1.5, xp: 550, gold: [0, 40], tier: 4, res: { mind: 100, poison: 100, fire: 50, phys: 25 } },
  ice_golem: { name: 'Ice Golem', spr: 'IceGolem', hp: 110, acv: 16, atk: 9, dmg: [3, 6, 2], spd: 1.7, xp: 340, gold: [0, 30], tier: 3, res: { cold: 100, fire: -50, mind: 100 }, special: 'chill' },
  earth_elemental: { name: 'Earth Elemental', spr: 'EarthElemental', hp: 100, acv: 15, atk: 8, dmg: [2, 10, 2], spd: 1.8, xp: 300, gold: [0, 20], tier: 3, res: { elec: 100, poison: 100, phys: 25 } },
  fire_elemental: { name: 'Fire Elemental', spr: 'FireElemental', hp: 80, acv: 16, atk: 9, dmg: [2, 8, 2], spd: 2.6, xp: 320, gold: [0, 20], tier: 3, res: { fire: 100, cold: -50, poison: 100 }, spell: 'fire_bolt', light: true },
  water_elemental: { name: 'Water Elemental', spr: 'WaterElemental', hp: 95, acv: 15, atk: 8, dmg: [2, 8, 2], spd: 2.2, xp: 310, gold: [0, 20], tier: 3, res: { cold: 100, fire: 50, elec: -50, poison: 100 }, spell: 'ice_bolt' },
  air_elemental: { name: 'Air Elemental', spr: 'AirElemental', hp: 75, acv: 20, atk: 10, dmg: [2, 8, 1], spd: 3.6, xp: 330, gold: [0, 20], tier: 3, res: { elec: 100, poison: 100, phys: 25 }, fly: true, spell: 'spark' },
  naga: { name: 'Green Naga', spr: 'GreenNaga', hp: 85, acv: 16, atk: 9, dmg: [2, 8, 2], spd: 2.4, xp: 300, gold: [40, 90], tier: 3, special: 'poison', spell: 'acid' },
  minotaur: { name: 'Minotaur', spr: 'BestialMinotaur', hp: 120, acv: 15, atk: 10, dmg: [3, 8, 3], spd: 2.8, xp: 400, gold: [30, 80], tier: 3, size: 1.3 },
  cube: { name: 'Gelatinous Cube', spr: 'GelatinousCube', hp: 150, acv: 8, atk: 6, dmg: [2, 8, 0], spd: 1.0, xp: 280, gold: [20, 80], tier: 3, res: { elec: 100, poison: 100, cold: 50 }, special: 'poison' },
  mimic: { name: 'Mimic', spr: 'HungryMimic', hp: 90, acv: 14, atk: 9, dmg: [3, 6, 2], spd: 1.6, xp: 320, gold: [80, 200], tier: 3, mimic: true },
  necromancer: { name: 'Necromancer', spr: 'AdeptNecromancer', hp: 48, acv: 12, atk: 7, dmg: [1, 6, 1], spd: 2.2, xp: 280, gold: [40, 100], tier: 3, spell: 'dark_bolt', special: 'summon:scarecrow' },
  witch: { name: 'Vile Witch', spr: 'VileWitch', hp: 44, acv: 12, atk: 6, dmg: [1, 6, 1], spd: 2.3, xp: 260, gold: [30, 90], tier: 3, spell: 'poison_bolt' },
  sorceress: { name: 'Sorceress', spr: 'DeftSorceress', hp: 42, acv: 13, atk: 7, dmg: [1, 4, 1], spd: 2.4, xp: 270, gold: [40, 100], tier: 3, spell: 'fire_bolt' },
  cryomancer: { name: 'Cryomancer', spr: 'CapableCryomancer', hp: 50, acv: 13, atk: 7, dmg: [1, 6, 1], spd: 2.2, xp: 290, gold: [40, 100], tier: 3, spell: 'ice_bolt', res: { cold: 50 } },
  pyromancer: { name: 'Pyromancer', spr: 'NovicePyromancer', hp: 46, acv: 12, atk: 7, dmg: [1, 6, 1], spd: 2.3, xp: 280, gold: [40, 100], tier: 3, spell: 'fire_bolt', res: { fire: 50 } },
  enchanter: { name: 'Enchanter', spr: 'BeginnerEnchanter', hp: 40, acv: 12, atk: 6, dmg: [1, 4, 1], spd: 2.4, xp: 240, gold: [40, 100], tier: 3, spell: 'spark' },
  illusionist: { name: 'Illusionist', spr: 'MasterIllusionist', hp: 55, acv: 16, atk: 8, dmg: [1, 6, 1], spd: 2.5, xp: 350, gold: [50, 120], tier: 3, spell: 'dark_bolt', special: 'blink' },
  venomancer: { name: 'Venomancer', spr: 'MasterfulVenomancer', hp: 60, acv: 14, atk: 8, dmg: [2, 6, 1], spd: 2.4, xp: 360, gold: [50, 120], tier: 3, spell: 'poison_bolt', special: 'poison' },
  // tier 4
  obsidian_golem: { name: 'Obsidian Golem', spr: 'ObsidianGolem', hp: 220, acv: 24, atk: 12, dmg: [4, 8, 4], spd: 1.6, xp: 800, gold: [0, 60], tier: 4, res: { fire: 100, mind: 100, poison: 100, phys: 25 } },
  brass_golem: { name: 'Brass Golem', spr: 'BrassGolem', hp: 190, acv: 22, atk: 12, dmg: [3, 10, 3], spd: 1.8, xp: 700, gold: [20, 80], tier: 4, res: { fire: 100, elec: -25, mind: 100, poison: 100 } },
  flesh_golem: { name: 'Flesh Golem', spr: 'FleshGolem', hp: 240, acv: 14, atk: 11, dmg: [4, 8, 3], spd: 1.9, xp: 650, gold: [0, 30], tier: 4, res: { mind: 100, poison: 100, elec: -50 }, special: 'regen' },
  flame_magus: { name: 'Flame Magus', spr: 'FlameMagus', hp: 90, acv: 16, atk: 10, dmg: [2, 6, 2], spd: 2.4, xp: 600, gold: [80, 200], tier: 4, spell: 'fireball', res: { fire: 100 } },
  frost_magus: { name: 'Frost Magus', spr: 'FrostMagus', hp: 90, acv: 16, atk: 10, dmg: [2, 6, 2], spd: 2.4, xp: 600, gold: [80, 200], tier: 4, spell: 'ice_bolt', res: { cold: 100 }, special: 'chill' },
  wizard: { name: 'Wizard', spr: 'WiseWizard', hp: 110, acv: 18, atk: 11, dmg: [2, 6, 2], spd: 2.3, xp: 750, gold: [100, 260], tier: 4, spell: 'lightning', special: 'blink' },
  gargoyle: { name: 'Granite Gargoyle', spr: 'GraniteGargoyle', hp: 160, acv: 22, atk: 12, dmg: [3, 8, 3], spd: 3.2, xp: 700, gold: [0, 40], tier: 4, fly: true, res: { phys: 25, poison: 100, mind: 100 } },
  beholder: { name: 'Beholder', spr: 'ConjuringBeholder', hp: 180, acv: 20, atk: 13, dmg: [3, 8, 2], spd: 2.0, xp: 1200, gold: [150, 400], tier: 4, fly: true, spell: 'dark_bolt', special: 'blink' },
  djinn: { name: 'Djinn', spr: 'PowerfulDjinn', hp: 200, acv: 22, atk: 13, dmg: [3, 10, 3], spd: 3.0, xp: 1100, gold: [200, 500], tier: 4, fly: true, spell: 'lightning', res: { elec: 100, fire: 50 } },
  nature_elemental: { name: 'Nature Elemental', spr: 'NatureElemental', hp: 170, acv: 18, atk: 11, dmg: [3, 8, 3], spd: 2.0, xp: 650, gold: [0, 40], tier: 4, res: { poison: 100, fire: -50, elec: 50 }, special: 'regen' },
  mithril_construct: { name: 'Mithril Sentinel', spr: 'MithrilConstruct', hp: 320, acv: 26, atk: 14, dmg: [4, 10, 4], spd: 2.0, xp: 2500, gold: [300, 600], tier: 4, boss: true, size: 1.6, res: { mind: 100, poison: 100, cold: 100, fire: 50 } },
  efreeti: { name: 'Molten Efreeti', spr: 'MoltenEfreeti', hp: 360, acv: 24, atk: 15, dmg: [4, 10, 5], spd: 2.6, xp: 3000, gold: [400, 800], tier: 4, boss: true, size: 1.7, spell: 'fireball', res: { fire: 100, cold: -50, poison: 100 }, light: true },
  elder_treant: { name: 'Elder Barrow Treant', spr: 'GrizzledTreant', hp: 300, acv: 18, atk: 12, dmg: [4, 8, 4], spd: 1.5, xp: 1500, gold: [100, 300], tier: 3, boss: true, size: 1.7, res: { fire: -50, poison: 100, cold: 50 }, special: 'summon:treant', summonMax: 2, summonCount: 1, summonEvery: 25 },
  adamantium_golem: { name: 'The Hollow Regent', spr: 'AdamantiumGolem', hp: 360, acv: 22, atk: 15, dmg: [4, 8, 2], spd: 2.0, xp: 8000, gold: [1000, 2000], tier: 5, boss: true, size: 2.0, res: { mind: 100, poison: 100, fire: 50, cold: 50, elec: -50 }, special: 'summon:gargoyle', summonMax: 1, summonCount: 1, summonEvery: 45 },
};
const MONSTER_SPELLS = {
  spark: { dmg: [1, 6, 0], elem: 'elec', range: 6, proj: 'spark' }, fire_bolt: { dmg: [2, 6, 0], elem: 'fire', range: 7, proj: 'fire' }, ice_bolt: { dmg: [2, 6, 0], elem: 'cold', range: 7, proj: 'ice', slow: true },
  dark_bolt: { dmg: [3, 6, 0], elem: 'mind', range: 7, proj: 'dark' }, poison_bolt: { dmg: [2, 6, 0], elem: 'poison', range: 7, proj: 'poison', poison: true }, acid: { dmg: [2, 8, 0], elem: 'poison', range: 6, proj: 'poison' },
  lightning: { dmg: [4, 6, 0], elem: 'elec', range: 8, proj: 'spark' }, fireball: { dmg: [3, 6, 0], elem: 'fire', range: 7, proj: 'fire', aoe: 2 }, heal_ally: { heal: 20, range: 6 }, fear_party: { fear: 4, range: 6 },
};

// ---- 30_world.js ----
// ===================== world: terrain, themes, maps =====================
const TR = { VOID: 0, FLOOR: 1, WALL: 2, GRASS: 3, DIRT: 4, ROAD: 5, WATER: 6, SAND: 7, TREE: 8, ROCK: 9, LAVA: 10, DOOR: 11, ROOF: 12, DEEP: 13 };
const PASSABLE = new Set([TR.FLOOR, TR.GRASS, TR.DIRT, TR.ROAD, TR.SAND, TR.DOOR]);
// plus-block (wall rim) themes: origin of the 5x5 block; floor tiles inside; filler is the block corner
const THEMES = {
  cave: { plus: [6, 4], fogColor: '#120c08', ambient: 0.42, torch: 'brazier' },
  moss: { plus: [16, 9], fogColor: '#06100a', ambient: 0.38, torch: 'brazier_green' },
  ice: { plus: [6, 14], fogColor: '#060a18', ambient: 0.42, torch: 'brazier_blue' },
  molten: { plus: [11, 19], fogColor: '#1a0804', ambient: 0.5, torch: 'brazier' },
  cosmic: { plus: [26, 9], fogColor: '#08041a', ambient: 0.4, torch: 'brazier_purple' },
  crypt: { plus: [11, 9], fogColor: '#0a0a0c', ambient: 0.3, torch: 'brazier_purple' },
  town: { plus: [6, 19], fogColor: '#0a0a12', ambient: 1, torch: 'brazier' },
};
// outdoor blob blocks: [c0, r0]
const BLOBS = { grass: [21, 9], road: [31, 24], sand: [36, 24], water: [36, 4] };
const DIRT_TILES = [[14, 2], [15, 2], [14, 3], [15, 3]];
const ROOF_TILES = [[22, 2], [23, 2], [24, 3], [25, 3]];
const LAVA_TILES = [[14, 0], [15, 0], [14, 1], [15, 1]];
const DEEP_TILES = [[37, 5], [38, 6], [39, 5], [38, 7]];
const TREE_TILES = [[4, 20], [5, 20], [4, 20], [4, 22]];
const ROCK_TILES = [[4, 21], [4, 22]];

// map registry: definitions produce maps on demand (deterministic from seed)
const MAPS = {};
function newMap(id, name, w, h, opts) { return Object.assign({ id, name, w, h, t: new Uint8Array(w * h), explored: new Uint8Array(w * h), objects: [], monsters: [], npcs: [], exits: [], lights: [], start: { x: 2, y: 2 }, outdoor: false, theme: 'cave', tier: 1 }, opts); }
const mIdx = (m, x, y) => y * m.w + x;
const mGet = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? TR.VOID : m.t[y * m.w + x];
const mSet = (m, x, y, v) => { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.t[y * m.w + x] = v; };
const mPass = (m, x, y) => PASSABLE.has(mGet(m, x, y));

// ---------- the town of Harrowmere ----------
const TOWN_ASCII = `
TTTTTTTTT.TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T
T,,T,,,#####,,,,,,#######,,,,,,,,######,,,,T,,,T
T,,,,,,#AAA#,,,,,,#BBBBB#,,,,,,,,#CCCC#,,,,,,,,T
T,,,,,,#AAA#,,,,,,#BBBBB#,,,,,,,,#CCCC#,,,,,,,,T
T,,,,,,##a##,,,,,,###b###,,,,,,,,##c###,,,T,,,,T
T,,,,,,,,.,,,,,,,,,,.,,,,,,,,,,,,,.,,,,,,,,,,,,T
T,,,,,,,,......................................T
T,,T,,,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,#######,,,,,,,,,,,,,,,,######,,,,.,T
T,,,,,,,,.,,#LLLLL#,,,,,,,,,,,,,,,,#PPPP#,,,,.,T
T,,,,,,,,.,,#LLLLL#,,,,,,,,,,,,,,,,#PPPP#,,,,.,T
T,,,,,,,,.,,#LLLLL#,,,,,,,,,,,,,,,,#PPPP#,,,,.,T
T,,,,,,,,.,,###l###,,,,,,,,,,,,,,,,##p###,,,,.,T
T,,,,,,,,.,,,,,.,,,,,,,,,,,,,,,,,,,,,.,,,,,,,.,T
.,,T,,,,,.......................................
T,,,,,,,,.,,,,,,,,,,,,.,,,,,,,,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,,,,,,,,,,.,,,,,,,,,,,,,,,,,,,,,,.,T
T,,####,,.,,,,,,,,,,,,.,,,,,,,,,,,#####,,,,,,.,T
T,,#HH#,,.,,,,,,,,,,,,@,,,,,,,,,,,#III#,,,,,,.,T
T,,#HH#,,.,,,,,,,,,,,,,,,,,,,,,,,,#III#,,,,,,.,T
T,,##h#,,.,,,,,,,,,,,,,,,,,,,,,,,,##i##,,,,,,.,T
T,,,,.,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,.,,,,,,,,.,T
T,,,,....................................,,,,.,T
T,,,,,,,,.,,,####,,,,,,,,#####,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,#KK#,,,,,,,,#RRR#,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,#KK#,,,,,,,,#RRR#,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,##k#,,,,,,,,##r##,,,,,,,,,,,,,,,.,T
T,,,,,,,,.,,,,,.,,,,,,,,,,,.,,,,,,,,,,,,,,,,,.,T
T,,,,,,,,......................................T
T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T
TTTTTTTTTTTTTTTTTTT.TTTTTTTTTTTTTTTTTTTTTTTTTTTT`.trim().split('\n');
const BUILDINGS = {
  a: { id: 'weapons', name: 'The Rusty Blade', kind: 'shop', keeper: 'Brom the Smith', spr: 'LizardfolkGladiator', stock: ['dagger', 'short_sword', 'long_sword', 'hand_axe', 'club', 'mace', 'spear', 'short_bow', 'staff', 'long_bow', 'broad_sword', 'morning_star'], buys: ['weapon'], quest: 'ore' },
  b: { id: 'armor', name: 'The Iron Hauberk', kind: 'shop', keeper: 'Marta Hauberk', spr: 'HalflingBard', stock: ['leather_armor', 'studded_leather', 'chain_mail', 'buckler', 'shield', 'cap', 'helm', 'boots', 'robe', 'scale_mail'], buys: ['armor', 'shield', 'helm', 'boots'] },
  c: { id: 'alchemist', name: 'The Gilded Flask', kind: 'shop', keeper: 'Old Ysolde', spr: 'DeftSorceress', stock: ['potion_heal', 'potion_mana', 'potion_cure', 'torch', 'food', 'potion_heal2', 'potion_mana2'], buys: ['potion', 'misc', 'food', 'quest', 'ring', 'amulet'], quest: 'herbs' },
  l: { id: 'hall', name: 'Harrow Hall', kind: 'hall', keeper: 'Lord Edric Harrow', spr: 'WiseWizard' },
  p: { id: 'temple', name: 'Temple of the Dawn', kind: 'temple', keeper: 'Sister Amalie', spr: 'BeginnerEnchanter', quest: 'pilgrims' },
  h: { id: 'widow', name: 'Widow Greer\'s cottage', kind: 'house', keeper: 'Widow Greer', spr: 'HalflingRanger', quest: 'locket' },
  i: { id: 'inn', name: 'The Drowsy Dragon', kind: 'inn', keeper: 'Tobbin the Innkeep', spr: 'HalflingRogue', quest: 'bandits' },
  k: { id: 'scholar', name: 'Scholar Pell\'s study', kind: 'house', keeper: 'Scholar Pell', spr: 'MasterIllusionist', quest: 'tome' },
  r: { id: 'trainer', name: 'Harrowmere Training Hall', kind: 'trainer', keeper: 'Drillmaster Oswin', spr: 'SkilledBattlemage' },
};
const GUILDS = { // guild stalls stand in the square (NPC objects)
  elemental: { name: 'Guild of the Elements', keeper: 'Magister Thane', spr: 'FrostMagus', schools: ['Fire', 'Air', 'Water', 'Earth'] },
  spirit: { name: 'Guild of the Spirit', keeper: 'Mother Ilse', spr: 'ExpertDruid', schools: ['Spirit', 'Mind', 'Body'] },
};
// ---------- quests ----------
const QUESTS = {
  main1: { name: 'The Goblin King', giver: 'Lord Edric Harrow', text: 'Goblins from the Warrens raid the north road. Bring me the signet of their king, Gruk, and Harrowmere will know your names.', item: 'goblin_signet', reward: { gold: 500, xp: 1500 }, next: 'main2' },
  main2: { name: 'The Relic of the Mandate', giver: 'Lord Edric Harrow', text: 'The Relic was taken to the Mossgrave Barrow by those who stole the Scepter. The barrow is older than the town. Bring the Relic back.', item: 'barrow_relic', reward: { gold: 1500, xp: 4000 }, next: 'main3' },
  main3: { name: 'The Two Keys', giver: 'Lord Edric Harrow', text: 'The Sanctum where the Scepter is kept opens only to the Frost Key of the Reliquary and the Brass Key of the Molten Gallery. Bring both.', items: ['frost_key', 'brass_key'], reward: { gold: 4000, xp: 12000 }, next: 'main4' },
  main4: { name: 'The Scepter of the Mandate', giver: 'Lord Edric Harrow', text: 'The Hollow Regent sits in the Sanctum with our Scepter. End it, and bring the Mandate home.', item: 'scepter', reward: { gold: 20000, xp: 50000 }, final: true },
  bandits: { name: 'Bandits on the Road', giver: 'Tobbin the Innkeep', text: 'Halfling bandits waylay my carts on the west road. Put down eight of them and the drinks are on me, plus a purse.', kill: ['bandit', 'bandit_slinger', 'assassin', 'ranger'], count: 8, reward: { gold: 400, xp: 800 } },
  ore: { name: 'Ore for the Forge', giver: 'Brom the Smith', text: 'The goblins dug iron in the Warrens before they stopped digging and started raiding. Bring me three lumps of ore.', item: 'iron_ore', count: 3, reward: { gold: 250, xp: 500, item: 'broad_sword' } },
  herbs: { name: 'Marsh Herbs', giver: 'Old Ysolde', text: 'The marsh east of town grows a bitter herb I need. Four bundles, if the lizardfolk let you.', item: 'marsh_herb', count: 4, reward: { gold: 200, xp: 400, item: 'potion_heal2' } },
  locket: { name: 'The Silver Locket', giver: 'Widow Greer', text: 'The goblins took my husband\'s locket when they took him. If it is anywhere, it is in their Warrens.', item: 'widow_locket', reward: { gold: 100, xp: 600, item: 'amulet' } },
  pilgrims: { name: 'The Lost Pilgrims', giver: 'Sister Amalie', text: 'Pilgrims went to the Mossgrave Barrow to pray and did not return. Find any word of them.', item: 'pilgrim_letter', reward: { gold: 300, xp: 900 } },
  tome: { name: 'The Tome of Hollow Stars', giver: 'Scholar Pell', text: 'My tome was stolen and, I am told, carried into the Frozen Reliquary. Return it and I will teach you what I know.', item: 'lost_tome', reward: { gold: 600, xp: 2000, skillPoints: 3 } },
};
// ---------- dungeons ----------
const DUNGEONS = {
  warrens: { name: 'Goblin Warrens', theme: 'cave', w: 46, h: 38, rooms: 10, tier: 1, seed: 1101, pool: ['goblin', 'goblin', 'goblin', 'goblin_archer', 'goblin_shaman', 'wild_dog'], boss: 'goblin_king', drop: 'goblin_signet', items: ['iron_ore', 'iron_ore', 'iron_ore', 'iron_ore', 'widow_locket'], entrance: 'A cave mouth, reeking of goblin.' },
  barrow: { name: 'Mossgrave Barrow', theme: 'moss', w: 50, h: 42, rooms: 11, tier: 2, seed: 2202, pool: ['treant', 'scarecrow', 'wisp', 'satyr', 'necromancer', 'scarecrow'], boss: 'elder_treant', drop: 'barrow_relic', items: ['pilgrim_letter'], entrance: 'A barrow door of green stone, half swallowed by roots.' },
  reliquary: { name: 'Frozen Reliquary', theme: 'ice', w: 52, h: 44, rooms: 12, tier: 3, seed: 3303, pool: ['ice_golem', 'cryomancer', 'water_elemental', 'stone_golem', 'illusionist', 'wild_dog'], boss: 'mithril_construct', drop: 'frost_key', items: ['lost_tome'], entrance: 'Cold air pours from a doorway of blue ice.' },
  molten: { name: 'Molten Gallery', theme: 'molten', w: 52, h: 44, rooms: 12, tier: 4, seed: 4404, pool: ['fire_elemental', 'pyromancer', 'flame_magus', 'brass_golem', 'earth_elemental', 'obsidian_golem'], boss: 'efreeti', drop: 'brass_key', items: [], lava: true, entrance: 'Heat shimmers over a brass-bound gate in the rock.' },
  sanctum: { name: 'The Sanctum', theme: 'cosmic', w: 56, h: 46, rooms: 13, tier: 4, seed: 5505, pool: ['gargoyle', 'beholder', 'wizard', 'air_elemental', 'flesh_golem', 'venomancer', 'djinn'], boss: 'adamantium_golem', drop: 'scepter', items: [], locked: ['frost_key', 'brass_key'], entrance: 'A door with two keyholes. The stone around it is not from here.' },
};
// where dungeon entrances sit on the overworld, and the town's position
const OVER_W = 110, OVER_H = 86;
const TOWN_POS = { x: 31, y: 44 };
const ENTRANCES = { warrens: [52, 9], barrow: [96, 22], reliquary: [10, 10], molten: [100, 70], sanctum: [72, 77] };
const CAMPS = [ // overworld monster camps: x, y, radius, list, count
  [44, 22, 5, ['goblin', 'goblin', 'goblin_archer', 'wild_dog'], 5], [60, 16, 5, ['goblin', 'goblin_shaman', 'goblin_archer'], 5], [38, 12, 4, ['scarecrow', 'wild_dog', 'goblin'], 4],
  [16, 50, 5, ['bandit', 'bandit', 'bandit_slinger'], 4], [12, 66, 5, ['bandit', 'bandit_slinger', 'assassin'], 4], [22, 30, 5, ['bandit', 'bandit', 'wild_dog', 'bandit_slinger'], 5],
  [84, 44, 6, ['lizard_scout', 'lizard_spear', 'lizard_archer'], 5], [92, 56, 6, ['lizard_spear', 'lizard_gladiator', 'lizard_scout'], 5], [76, 30, 5, ['lizard_scout', 'lizard_archer', 'satyr'], 4],
  [20, 18, 5, ['satyr', 'pixie', 'treant'], 4], [30, 8, 5, ['wisp', 'fairy', 'satyr'], 4], [88, 10, 5, ['treant', 'wolf_rider', 'satyr'], 4],
  [8, 26, 5, ['stone_golem', 'earth_elemental', 'clay_golem'], 3], [100, 40, 5, ['fire_elemental', 'pyromancer'], 3], [92, 68, 5, ['lizard_gladiator', 'bestial_lizard', 'naga'], 4], [6, 56, 5, ['minotaur', 'wolf_rider'], 3],
];

// ---------- value noise ----------
function makeNoise(seed) {
  const rng = seededRng(seed), g = new Float32Array(256 * 256); for (let i = 0; i < g.length; i++) g[i] = rng();
  const at = (x, y) => g[((y & 255) << 8) | (x & 255)];
  const smoothed = (x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return lerp(lerp(at(x0, y0), at(x0 + 1, y0), sx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), sx), sy); };
  return (x, y, oct = 3) => { let v = 0, a = 1, f = 1, n = 0; for (let i = 0; i < oct; i++) { v += smoothed(x * f, y * f) * a; n += a; a *= 0.5; f *= 2; } return v / n; };
}

// ---------- overworld ----------
function buildOverworld() {
  const m = newMap('over', 'Harrowmere Reach', OVER_W, OVER_H, { outdoor: true, theme: 'town', tier: 1 });
  const noise = makeNoise(77), n2 = makeNoise(78), rng = seededRng(79);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const e = noise(x / 14, y / 14, 3), f = n2(x / 7, y / 7, 2);
    let t = TR.GRASS;
    if (y > m.h - 6 - Math.floor(noise(x / 9, 0, 2) * 5)) t = TR.DEEP; // southern sea
    else if (y > m.h - 9 - Math.floor(noise(x / 9, 0, 2) * 5)) t = TR.SAND;
    else if (e < 0.32) t = TR.WATER; else if (e < 0.36) t = TR.SAND;
    else if (f > 0.62) t = TR.TREE; else if (f > 0.58 && rng() < 0.5) t = TR.TREE;
    else if (e > 0.72 && rng() < 0.6) t = TR.ROCK;
    if (x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1) t = TR.TREE;
    mSet(m, x, y, t);
  }
  // clear and stamp the town
  const tw = TOWN_ASCII[0].length, th = TOWN_ASCII.length, tx0 = TOWN_POS.x, ty0 = TOWN_POS.y;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const c = TOWN_ASCII[y][x]; const X = tx0 + x, Y = ty0 + y; let t = TR.GRASS;
    if (c === 'T') t = TR.TREE; else if (c === '#') t = TR.WALL; else if (c === '.') t = TR.ROAD; else if (c === '@') { t = TR.ROAD; m.start = { x: X + 0.5, y: Y + 2.5 }; m.objects.push({ kind: 'well', x: X, y: Y }); }
    else if (/[A-Z]/.test(c)) t = TR.ROOF;
    else if (/[a-z]/.test(c)) { t = TR.DOOR; const b = BUILDINGS[c]; if (b) m.objects.push({ kind: 'door', x: X, y: Y, building: c, name: b.name }); }
    mSet(m, X, Y, t);
  }
  m.town = { x0: tx0, y0: ty0, x1: tx0 + tw - 1, y1: ty0 + th - 1 };
  m.townSquare = { x: tx0 + 22.5, y: ty0 + 15.5 };
  // guild stalls, townsfolk, signs
  m.npcs.push({ id: 'guild_el', name: GUILDS.elemental.keeper, spr: GUILDS.elemental.spr, x: tx0 + 15.5, y: ty0 + 16.5, guild: 'elemental' });
  m.npcs.push({ id: 'guild_sp', name: GUILDS.spirit.keeper, spr: GUILDS.spirit.spr, x: tx0 + 29.5, y: ty0 + 16.5, guild: 'spirit' });
  m.npcs.push({ id: 'guard1', name: 'Town Guard', spr: 'LizardfolkSpearman', x: tx0 + 19.5, y: ty0 + 31.5, lines: ['The south gate leads to the beach. Mind the tide, and mind the lizardfolk in the eastern marsh.', 'Lord Harrow is in the hall, north of the square. He pays well for goblin heads.'], wander: 1 });
  m.npcs.push({ id: 'child', name: 'Pip', spr: 'HalflingSlinger', x: tx0 + 12.5, y: ty0 + 7.5, lines: ['Are you adventurers? My da says the Warrens up north are full of goblins and gold!', 'The scholar by the south road talks to himself. Mum says he lost his book.'], wander: 2 });
  m.npcs.push({ id: 'fisher', name: 'Nell the Fisher', spr: 'HalflingRanger', x: tx0 + 40.5, y: ty0 + 23.5, lines: ['Nothing bites since the Scepter went missing. The sea knows something is wrong.', 'The old barrow east of the marsh glows green at night. I do not fish near it.'], wander: 2 });
  m.npcs.push({ id: 'drunk', name: 'Hob', spr: 'SneakySatyr', x: tx0 + 36.5, y: ty0 + 17.5, lines: ['Tobbin waters the ale, I swear it. But his stew! Buy the stew.', 'Rest at the inn before you go anywhere. The roads are no place to sleep.'], wander: 1 });
  m.objects.push({ kind: 'sign', x: tx0 + 6, y: ty0 + 7, text: 'HARROWMERE. North: the Warrens road. West: the forest road. East: the marsh. Travellers, rest at the Drowsy Dragon.' });
  m.objects.push({ kind: 'sign', x: tx0 + 22, y: ty0 + 14, text: 'The town square. Guilds trade here by day: the Elements to the west, the Spirit to the east.' });
  for (const [x, y] of [[12, 15], [32, 15], [10, 23], [34, 24], [20, 2], [27, 2]]) m.lights.push({ x: tx0 + x + 0.5, y: ty0 + y + 0.5, r: 5, kind: 'lamp' });
  for (const [x, y] of [[12, 15], [32, 15], [10, 23], [34, 24], [20, 2], [27, 2]]) m.objects.push({ kind: 'brazier', x: tx0 + x, y: ty0 + y });
  // roads from the town gates to every entrance (carve road, trees removed)
  const gates = { north: [tx0 + 9, ty0 - 1], west: [tx0 - 1, ty0 + 15], east: [tx0 + tw, ty0 + 15], south: [tx0 + 19, ty0 + th] };
  const carveRoad = (ax, ay, bx, by) => {
    let x = ax, y = ay; const r2 = seededRng(ax * 31 + by);
    while (x !== bx || y !== by) {
      const dx = sign(bx - x), dy = sign(by - y);
      if (dx && dy) { if (r2() < 0.5) x += dx; else y += dy; } else { x += dx; y += dy; }
      for (let oy = 0; oy <= 1; oy++) for (let ox = 0; ox <= 1; ox++) { const t = mGet(m, x + ox, y + oy); if (t !== TR.WALL && t !== TR.ROOF && t !== TR.DOOR && t !== TR.DEEP) mSet(m, x + ox, y + oy, t === TR.WATER ? TR.ROAD : TR.ROAD); }
    }
  };
  // make sure the gates are open
  for (const g of Object.values(gates)) mSet(m, g[0], g[1], TR.ROAD);
  carveRoad(gates.north[0], gates.north[1], ENTRANCES.warrens[0], ENTRANCES.warrens[1] + 1);
  carveRoad(gates.west[0], gates.west[1], ENTRANCES.reliquary[0], ENTRANCES.reliquary[1] + 1);
  carveRoad(gates.east[0], gates.east[1], ENTRANCES.barrow[0], ENTRANCES.barrow[1] + 1);
  carveRoad(gates.east[0], gates.east[1] + 1, ENTRANCES.molten[0], ENTRANCES.molten[1] - 1);
  carveRoad(gates.south[0], gates.south[1], ENTRANCES.sanctum[0], ENTRANCES.sanctum[1] - 1);
  // entrances: a 3x3 stone pad with the door in the middle top
  for (const id in ENTRANCES) {
    const [ex, ey] = ENTRANCES[id];
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) mSet(m, ex + x, ey + y, TR.ROAD);
    for (let x = -1; x <= 1; x++) mSet(m, ex + x, ey - 1, TR.WALL);
    mSet(m, ex, ey, TR.DOOR);
    m.objects.push({ kind: 'entrance', x: ex, y: ey, dungeon: id, name: DUNGEONS[id].name });
    m.exits.push({ x: ex, y: ey, to: id });
  }
  // monster camps
  sealPockets(m, Math.floor(m.townSquare.x), Math.floor(m.townSquare.y), TR.TREE);
  relocateCamps(m);
  for (const [cx, cy, r, list, n] of CAMPS) for (let i = 0; i < n; i++) m.monsters.push({ kind: list[i % list.length], x: cx + (rng() - 0.5) * r * 2, y: cy + (rng() - 0.5) * r * 2, group: cx + ',' + cy });
  // marsh herbs (quest) in the east marsh, ore nowhere here
  for (let i = 0; i < 7; i++) m.objects.push({ kind: 'pickup', x: 78 + Math.floor(rng() * 20), y: 36 + Math.floor(rng() * 22), item: 'marsh_herb', id: 'herb' + i });
  // a few treasure chests in the wilds
  for (const [x, y, tier] of [[20, 20, 1], [62, 8, 1], [8, 28, 2], [96, 12, 2], [96, 58, 3], [38, 74, 2], [72, 72, 3], [12, 70, 2]]) m.objects.push({ kind: 'chest', x, y, tier, id: 'oc' + x + ',' + y });
  m.monsters = m.monsters.filter(mo => !(mo.x >= m.town.x0 - 1 && mo.x <= m.town.x1 + 1 && mo.y >= m.town.y0 - 1 && mo.y <= m.town.y1 + 1));
  cleanOverworld(m);
  return m;
}
function sealPockets(m, sx, sy, fill) { // passable ground that cannot be walked to from the start is sealed, so nothing can ever get stuck in it
  const N = m.w * m.h, seen = new Uint8Array(N), st = [sy * m.w + sx]; seen[st[0]] = 1;
  while (st.length) { const i = st.pop(); const x = i % m.w, y = (i / m.w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue; const j = ny * m.w + nx; if (seen[j] || !PASSABLE.has(m.t[j])) continue; seen[j] = 1; st.push(j); } }
  let n = 0; for (let i = 0; i < N; i++) if (!seen[i] && PASSABLE.has(m.t[i])) { m.t[i] = fill; n++; }
  m.reach = seen; return n;
}
function relocateCamps(m) { // a camp whose centre sits in the trees moves to the nearest walkable ground
  for (const camp of CAMPS) { const [cx, cy] = camp; if (m.reach[cy * m.w + cx]) continue; let best = null, bd = 1e9; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x >= m.w - 1 || y >= m.h - 1 || !m.reach[y * m.w + x]) continue; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [x, y]; } } if (best) { camp[0] = best[0]; camp[1] = best[1]; } }
}
function cleanOverworld(m) {
  // keep objects and monsters on passable ground; nudge them to nearest passable cell
  const fix = o => { if (mPass(m, o.x | 0, o.y | 0)) return; for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (mPass(m, (o.x | 0) + dx, (o.y | 0) + dy)) { o.x = (o.x | 0) + dx + (o.x % 1 || 0); o.y = (o.y | 0) + dy + (o.y % 1 || 0); return; } };
  m.objects.forEach(o => { if (o.kind !== 'door' && o.kind !== 'entrance') fix(o); }); m.monsters.forEach(fix); m.npcs.forEach(fix);
  for (const o of m.objects) if (o.kind === 'chest' || o.kind === 'pickup') { o.x = (o.x | 0); o.y = (o.y | 0); }
}

// ---------- dungeon generator ----------
function buildDungeon(id) {
  const d = DUNGEONS[id], rng = seededRng(d.seed);
  const m = newMap(id, d.name, d.w, d.h, { theme: d.theme, tier: d.tier, outdoor: false });
  m.t.fill(TR.WALL);
  const rooms = [];
  for (let tries = 0; tries < 400 && rooms.length < d.rooms; tries++) {
    const rw = 4 + Math.floor(rng() * 7), rh = 4 + Math.floor(rng() * 6), x = 2 + Math.floor(rng() * (m.w - rw - 4)), y = 2 + Math.floor(rng() * (m.h - rh - 4));
    if (rooms.some(r => x < r.x + r.w + 2 && x + rw + 2 > r.x && y < r.y + r.h + 2 && y + rh + 2 > r.y)) continue;
    rooms.push({ x, y, w: rw, h: rh, cx: x + Math.floor(rw / 2), cy: y + Math.floor(rh / 2) });
  }
  rooms.sort((a, b) => a.cx - b.cx);
  const carve = (x, y) => { if (x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1) mSet(m, x, y, TR.FLOOR); };
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y);
  // connect sequential rooms with 2-wide L corridors, plus a few extra links
  const link = (a, b) => { let x = a.cx, y = a.cy; const horizFirst = rng() < 0.5; const go = (tx, ty) => { while (x !== tx) { carve(x, y); carve(x, y + 1); x += sign(tx - x); } while (y !== ty) { carve(x, y); carve(x + 1, y); y += sign(ty - y); } carve(x, y); carve(x + 1, y); carve(x, y + 1); }; if (horizFirst) go(b.cx, b.cy); else { go(x, b.cy); go(b.cx, b.cy); } };
  for (let i = 0; i + 1 < rooms.length; i++) link(rooms[i], rooms[i + 1]);
  for (let i = 0; i < Math.floor(rooms.length / 3); i++) link(rooms[Math.floor(rng() * rooms.length)], rooms[Math.floor(rng() * rooms.length)]);
  // entrance in the first room, boss in the largest room far from it
  const first = rooms[0];
  m.start = { x: first.cx + 0.5, y: first.cy + 0.5 };
  m.objects.push({ kind: 'stairs', x: first.cx, y: first.cy - 1, to: 'over' });
  mSet(m, first.cx, first.cy - 1, TR.FLOOR);
  m.exits.push({ x: first.cx, y: first.cy - 1, to: 'over', tx: ENTRANCES[id][0], ty: ENTRANCES[id][1] + 1 });
  const far = rooms.slice(1).sort((a, b) => (dist(b.cx, b.cy, first.cx, first.cy) * b.w * b.h) - (dist(a.cx, a.cy, first.cx, first.cy) * a.w * a.h))[0];
  far.boss = true;
  // lava pools in the molten gallery
  if (d.lava) for (const r of rooms) if (!r.boss && r !== first && r.w >= 6 && r.h >= 5 && rng() < 0.6) { for (let y = r.y + 1; y < r.y + r.h - 1; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (rng() < 0.5 && !(x === r.cx || y === r.cy)) mSet(m, x, y, TR.LAVA); }
  // monsters, chests, decor
  let itemQueue = d.items.slice();
  rooms.forEach((r, i) => {
    const area = r.w * r.h;
    if (r.boss) {
      m.monsters.push({ kind: d.boss, x: r.cx + 0.5, y: r.cy + 0.5, boss: true, drop: d.drop });
      for (let k = 0; k < 2; k++) m.monsters.push({ kind: d.pool[Math.floor(rng() * d.pool.length)], x: r.x + 1 + rng() * (r.w - 2), y: r.y + 1 + rng() * (r.h - 2) });
      m.objects.push({ kind: 'chest', x: r.x + r.w - 1, y: r.y + r.h - 1, tier: d.tier + 1, id: id + 'boss', big: true });
      for (const [dx, dy] of [[0, 0], [r.w - 1, 0], [0, r.h - 1]]) m.objects.push({ kind: 'brazier', x: r.x + dx, y: r.y + dy });
      for (const [dx, dy] of [[0, 0], [r.w - 1, 0], [0, r.h - 1]]) m.lights.push({ x: r.x + dx + 0.5, y: r.y + dy + 0.5, r: 5 });
      return;
    }
    if (i > 0) { const n = Math.min(5, 1 + Math.floor(area / 14) + (rng() < 0.4 ? 1 : 0)); for (let k = 0; k < n; k++) m.monsters.push({ kind: d.pool[Math.floor(rng() * d.pool.length)], x: r.x + 1 + rng() * Math.max(1, r.w - 2), y: r.y + 1 + rng() * Math.max(1, r.h - 2), group: 'r' + i }); }
    if (rng() < 0.55 || itemQueue.length) { const cx = r.x + Math.floor(rng() * r.w), cy = r.y + Math.floor(rng() * r.h); const ch = { kind: 'chest', x: cx, y: cy, tier: d.tier, id: id + 'c' + i }; if (itemQueue.length && i > 0) ch.item = itemQueue.shift(); m.objects.push(ch); }
    if (rng() < 0.7) { m.objects.push({ kind: 'brazier', x: r.x, y: r.y }); m.lights.push({ x: r.x + 0.5, y: r.y + 0.5, r: 4.5 }); }
    if (rng() < 0.5) m.objects.push({ kind: 'deco', x: r.x + r.w - 1, y: r.y + r.h - 1, spr: pick(['pot', 'bones', 'barrel', 'rock', 'skull', 'crate']) });
    if (rng() < 0.3) m.objects.push({ kind: 'pot', x: r.x + r.w - 1, y: r.y, id: id + 'p' + i });
  });
  // leftover quest items go to the boss chest
  if (itemQueue.length) { const bc = m.objects.find(o => o.id === id + 'boss'); bc.item = itemQueue.shift(); }
  // make sure spawn cells are floor (lava avoidance)
  for (const mo of m.monsters) if (!mPass(m, mo.x | 0, mo.y | 0)) { const r = rooms.find(r => (mo.x | 0) >= r.x && (mo.x | 0) < r.x + r.w && (mo.y | 0) >= r.y && (mo.y | 0) < r.y + r.h); if (r) { mo.x = r.cx + 0.5; mo.y = r.cy + 0.5; } }
  for (const o of m.objects) if (!mPass(m, o.x, o.y) && o.kind !== 'stairs') { mSet(m, o.x, o.y, TR.FLOOR); }
  sealPockets(m, Math.floor(m.start.x), Math.floor(m.start.y), TR.WALL);
  m.monsters = m.monsters.filter(mo => mo.boss || mPass(m, mo.x | 0, mo.y | 0)); m.objects = m.objects.filter(o => o.kind === 'stairs' || mPass(m, o.x | 0, o.y | 0));
  return m;
}
function getMap(id) { if (!MAPS[id]) MAPS[id] = id === 'over' ? buildOverworld() : buildDungeon(id); return MAPS[id]; }

// ---- 40_render.js ----
// ===================== renderer =====================
const V = { cvs: null, ctx: null, W: 0, H: 0, dpr: 1, zoom: 2, camX: 0, camY: 0, viewTop: 0, viewBottom: 0, light: null, lctx: null, fog: null };
function initView(cvs) { V.cvs = cvs; V.ctx = cvs.getContext('2d'); V.light = document.createElement('canvas'); V.lctx = V.light.getContext('2d'); }
function resizeView(w, h, dpr) {
  V.W = w; V.H = h; V.dpr = dpr; V.cvs.width = Math.round(w * dpr); V.cvs.height = Math.round(h * dpr); V.cvs.style.width = w + 'px'; V.cvs.style.height = h + 'px';
  V.zoom = w >= 1500 && h >= 800 ? 4 : (w >= 1000 && h >= 600) ? 3 : 2;
  V.light.width = Math.ceil(w / 4); V.light.height = Math.ceil(h / 4);
}
const worldToScreen = (x, y) => [(x * T - V.camX) * V.zoom, (y * T - V.camY) * V.zoom];
const screenToWorld = (sx, sy) => [(sx / V.zoom + V.camX) / T, (sy / V.zoom + V.camY) / T];

// ---- autotiling ----
function plusTile(theme, x, y, m) {
  const [c0, r0] = THEMES[theme].plus;
  const f = (dx, dy) => { const t = mGet(m, x + dx, y + dy); return t !== TR.WALL && t !== TR.VOID && t !== TR.ROOF; };
  const N = f(0, -1), S = f(0, 1), E = f(1, 0), W = f(-1, 0);
  if (E && S && !N && !W) return [c0 + 1, r0 + 1]; if (W && S && !N && !E) return [c0 + 3, r0 + 1]; if (E && N && !S && !W) return [c0 + 1, r0 + 3]; if (W && N && !S && !E) return [c0 + 3, r0 + 3];
  if (S && !N) return [c0 + 2, r0]; if (N && !S) return [c0 + 2, r0 + 4]; if (E && !W) return [c0, r0 + 2]; if (W && !E) return [c0 + 4, r0 + 2];
  if (N && S) return [c0 + 2, r0]; if (E && W) return [c0, r0 + 2];
  if (f(1, 1)) return [c0 + 1, r0]; if (f(-1, 1)) return [c0 + 3, r0]; if (f(1, -1)) return [c0 + 1, r0 + 4]; if (f(-1, -1)) return [c0 + 3, r0 + 4];
  return [c0, r0];
}
function blobTile(block, same, x, y, m) {
  const [c0, r0] = block; const s = (dx, dy) => same(mGet(m, x + dx, y + dy));
  const N = s(0, -1), S = s(0, 1), E = s(1, 0), W = s(-1, 0);
  if (!N && !W) return [c0 + 1, r0]; if (!N && !E) return [c0 + 3, r0]; if (!S && !W) return [c0 + 1, r0 + 4]; if (!S && !E) return [c0 + 3, r0 + 4];
  if (!N) return [c0 + 2, r0]; if (!S) return [c0 + 2, r0 + 4]; if (!W) return [c0, r0 + 2]; if (!E) return [c0 + 4, r0 + 2];
  const v = hash2(x, y); return [c0 + 1 + Math.floor(v * 3), r0 + 1 + Math.floor(hash2(y, x) * 3)];
}
function renderMapLayer(m) {
  if (m._layer) return m._layer;
  const cvs = document.createElement('canvas'); cvs.width = m.w * T; cvs.height = m.h * T; const c = cvs.getContext('2d'); c.imageSmoothingEnabled = false;
  const theme = THEMES[m.theme], [pc, pr] = theme.plus;
  const floorTiles = [[pc + 2, pr + 1], [pc + 1, pr + 2], [pc + 2, pr + 2], [pc + 3, pr + 2], [pc + 2, pr + 3]];
  const isGrassLike = t => t === TR.GRASS || t === TR.TREE || t === TR.ROCK || t === TR.ROAD || t === TR.SAND || t === TR.DOOR || t === TR.WALL || t === TR.ROOF;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const t = m.t[y * m.w + x], v = hash2(x * 3 + 1, y * 5 + 2), px = x * T, py = y * T;
    if (m.outdoor) {
      // dirt base, grass blob on top for grass-like cells
      const d = DIRT_TILES[Math.floor(v * 4)]; drawTile(c, d[0], d[1], px, py);
      if (isGrassLike(t)) { const g = blobTile(BLOBS.grass, isGrassLike, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.ROAD || t === TR.DOOR) { const g = blobTile(BLOBS.road, q => q === TR.ROAD || q === TR.DOOR || q === TR.WALL || q === TR.ROOF, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.SAND) { const g = blobTile(BLOBS.sand, q => q === TR.SAND || q === TR.WATER || q === TR.DEEP, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.WATER) { const g = blobTile(BLOBS.water, q => q === TR.WATER || q === TR.DEEP, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.DEEP) { const g = DEEP_TILES[Math.floor(v * 4)]; drawTile(c, g[0], g[1], px, py); }
      if (t === TR.TREE) { const g = TREE_TILES[Math.floor(v * 4)]; drawTile(c, g[0], g[1], px, py); }
      if (t === TR.ROCK) { const g = ROCK_TILES[Math.floor(v * 2)]; drawTile(c, g[0], g[1], px, py); }
      if (t === TR.ROOF) { const g = ROOF_TILES[Math.floor(v * 4)]; drawTile(c, g[0], g[1], px, py); }
      if (t === TR.WALL) { const g = plusTile(m.theme, x, y, m); drawTile(c, g[0], g[1], px, py); }
      if (t === TR.DOOR) { const bx = mGet(m, x, y - 1) === TR.ROOF || mGet(m, x, y - 1) === TR.WALL; if (bx) drawTile(c, 1, 15, px, py); }
    } else {
      if (t === TR.WALL || t === TR.VOID) { const g = plusTile(m.theme, x, y, m); drawTile(c, g[0], g[1], px, py); }
      else if (t === TR.LAVA) { const g = LAVA_TILES[Math.floor(v * 4)]; drawTile(c, g[0], g[1], px, py); }
      else { const f = floorTiles[Math.floor(v * 5)]; drawTile(c, f[0], f[1], px, py); }
    }
  }
  m._layer = cvs; return cvs;
}
// ---- frame ----
function drawWorld(m, ents, opts) {
  const ctx = V.ctx, z = V.zoom, dpr = V.dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, V.W, V.H);
  const layer = renderMapLayer(m);
  const vw = V.W / z, vh = V.H / z; // visible world px
  // camera clamp
  V.camX = clamp(V.camX, 0, Math.max(0, m.w * T - vw)); V.camY = clamp(V.camY, 0, Math.max(0, m.h * T - vh));
  const cx = Math.floor(V.camX), cy = Math.floor(V.camY);
  ctx.setTransform(dpr * z, 0, 0, dpr * z, 0, 0);
  ctx.drawImage(layer, cx, cy, Math.ceil(vw) + 1, Math.ceil(vh) + 1, 0, 0, Math.ceil(vw) + 1, Math.ceil(vh) + 1);
  ctx.translate(-cx, -cy);
  // animated water shimmer / lava glow
  const t = opts.time || 0;
  if (!m.outdoor && m.id === 'molten') { ctx.fillStyle = 'rgba(255,120,30,' + (0.08 + Math.sin(t * 3) * 0.05) + ')'; const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T); for (let y = y0; y < y0 + vh / T + 1; y++) for (let x = x0; x < x0 + vw / T + 1; x++) if (mGet(m, x, y) === TR.LAVA) ctx.fillRect(x * T, y * T, T, T); }
  // entities (sorted by y)
  ents.sort((a, b) => (a.y + (a.sortOff || 0)) - (b.y + (b.sortOff || 0)));
  for (const e of ents) {
    const sx = e.x * T, sy = e.y * T;
    if (sx < cx - 48 || sy < cy - 48 || sx > cx + vw + 48 || sy > cy + vh + 48) continue;
    if (e.shadow !== false && e.kind !== 'fx' && e.kind !== 'proj') { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx, sy - 1, 6 * (e.scale || 1), 2.5 * (e.scale || 1), 0, 0, TAU); ctx.fill(); }
    if (e.spr) {
      const sc = e.scale || 1, fw = 16 * sc, fh = 16 * sc; const dx = sx - fw / 2, dy = sy - fh + 2 - (e.hover || 0);
      if (e.alpha !== undefined && e.alpha < 1) ctx.globalAlpha = e.alpha;
      if (sc !== 1) { ctx.save(); ctx.translate(dx, dy); ctx.scale(sc, sc); drawCreature(ctx, e.spr, e.frame || 0, 0, 0, 1, e.flip); ctx.restore(); } else drawCreature(ctx, e.spr, e.frame || 0, dx, dy, 1, e.flip);
      if (e.tint) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = e.tint; ctx.fillRect(dx, dy, fw, fh); ctx.globalCompositeOperation = 'source-over'; }
      ctx.globalAlpha = 1;
      if (e.hpFrac !== undefined && e.hpFrac < 1) { ctx.fillStyle = '#200'; ctx.fillRect(dx, dy - 3, fw, 2); ctx.fillStyle = e.boss ? '#ff4040' : '#d03030'; ctx.fillRect(dx, dy - 3, fw * e.hpFrac, 2); }
      if (e.selected) { ctx.strokeStyle = 'rgba(255,220,120,0.9)'; ctx.lineWidth = 0.5; ctx.strokeRect(dx - 1, dy - 1, fw + 2, fh + 2); }
    } else if (e.tile) { if (e.alpha !== undefined) ctx.globalAlpha = e.alpha; drawTile(ctx, e.tile[0], e.tile[1], sx - 8 * (e.tile[2] || 1), sy - 14 * (e.tile[3] || 1) + (e.yoff || 0), 1, e.tile[2] || 1, e.tile[3] || 1); ctx.globalAlpha = 1; }
    else if (e.icon) { const ic = iconCanvas(e.icon); ctx.drawImage(ic, sx - 8, sy - 12 - (e.hover || 0)); }
    else if (e.kind === 'fx') drawFx(ctx, e, t);
    else if (e.kind === 'proj') drawProj(ctx, e, t);
    if (e.label) { ctx.font = 'bold 6px monospace'; }
  }
  // lighting
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawLighting(m, opts, cx, cy, vw, vh);
  // fog of war (unexplored black, soft)
  if (!m.outdoor || opts.fogOutdoor) drawFog(m, cx, cy, vw, vh);
}
function drawFx(ctx, e, t) {
  const sx = e.x * T, sy = e.y * T, k = e.life / e.dur;
  if (e.fx === 'burst') { const r = (1 - k) * e.r * T + 2; ctx.strokeStyle = e.color; ctx.lineWidth = 1.5; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(sx, sy - 6, r, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  else if (e.fx === 'glow') { const g = ctx.createRadialGradient(sx, sy - 6, 0, sx, sy - 6, e.r * T); g.addColorStop(0, e.color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = k * 0.8; ctx.fillStyle = g; ctx.fillRect(sx - e.r * T, sy - 6 - e.r * T, e.r * T * 2, e.r * T * 2); ctx.globalAlpha = 1; }
  else if (e.fx === 'text') { ctx.globalAlpha = Math.min(1, k * 2); text(ctx, e.text, sx, sy - 18 - (1 - k) * 12, 1, e.color, 'center'); ctx.globalAlpha = 1; }
  else if (e.fx === 'spark') { ctx.fillStyle = e.color; ctx.globalAlpha = k; for (let i = 0; i < 6; i++) { const a = i * 1.05 + e.seed, d = (1 - k) * 10; ctx.fillRect(sx + Math.cos(a) * d - 1, sy - 6 + Math.sin(a) * d - 1, 2, 2); } ctx.globalAlpha = 1; }
  else if (e.fx === 'heal') { ctx.fillStyle = e.color; ctx.globalAlpha = k; for (let i = 0; i < 5; i++) { const a = i * 1.3 + e.seed; ctx.fillRect(sx + Math.cos(a) * 5 - 1, sy - 4 - (1 - k) * 14 - i * 2, 2, 2); } ctx.globalAlpha = 1; }
}
function drawProj(ctx, e, t) {
  const sx = e.x * T, sy = e.y * T - 6;
  if (e.proj === 'arrow' || e.proj === 'rock') { ctx.save(); ctx.translate(sx, sy); ctx.rotate(e.ang); ctx.fillStyle = e.proj === 'arrow' ? '#c9a46a' : '#8a8078'; ctx.fillRect(-4, -0.5, 8, 1); ctx.fillStyle = '#eee'; ctx.fillRect(3, -1, 2, 2); ctx.restore(); return; }
  const col = { fire: '#ff8030', ice: '#80d0ff', spark: '#ffe060', dark: '#c060ff', poison: '#60e040', spirit: '#fff0b0', mind: '#e080ff', phys: '#d8c8a0' }[e.proj] || '#fff';
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5); g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 5, sy - 5, 10, 10);
}
function drawLighting(m, opts, cx, cy, vw, vh) {
  const l = V.lctx, lw = V.light.width, lh = V.light.height, s = lw / vw; // light px per world px
  let amb = opts.ambient; // [r,g,b] 0..255
  l.globalCompositeOperation = 'source-over'; l.fillStyle = `rgb(${amb[0]},${amb[1]},${amb[2]})`; l.fillRect(0, 0, lw, lh);
  l.globalCompositeOperation = 'lighter';
  for (const li of opts.lights) {
    const lx = (li.x * T - cx) * s, ly = (li.y * T - cy) * s, lr = li.r * T * s; if (lx < -lr || ly < -lr || lx > lw + lr || ly > lh + lr) continue;
    const g = l.createRadialGradient(lx, ly, 0, lx, ly, lr); const c = li.color || [255, 200, 120]; const i = li.i === undefined ? 1 : li.i;
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${i})`); g.addColorStop(0.5, `rgba(${c[0]},${c[1]},${c[2]},${i * 0.45})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
  }
  const ctx = V.ctx; ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true; ctx.drawImage(V.light, 0, 0, lw, lh, 0, 0, V.W, V.H); ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
}
function drawFog(m, cx, cy, vw, vh) {
  if (!m._fog) { m._fog = document.createElement('canvas'); m._fog.width = m.w; m._fog.height = m.h; m._fogData = m._fog.getContext('2d').createImageData(m.w, m.h); }
  const d = m._fogData.data; for (let i = 0; i < m.w * m.h; i++) { d[i * 4] = 0; d[i * 4 + 1] = 0; d[i * 4 + 2] = 0; d[i * 4 + 3] = m.explored[i] ? 0 : 255; }
  m._fog.getContext('2d').putImageData(m._fogData, 0, 0);
  const ctx = V.ctx, z = V.zoom; ctx.imageSmoothingEnabled = true;
  // draw the fog scaled so that 1 fog px = 16 world px; offset by half a tile so blur centres on cells
  ctx.setTransform(V.dpr * z, 0, 0, V.dpr * z, 0, 0); ctx.translate(-cx, -cy);
  ctx.drawImage(m._fog, 0, 0, m.w, m.h, 0, 0, m.w * T, m.h * T);
  ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); ctx.imageSmoothingEnabled = false;
}

// ---- 45_audio.js ----
// ===================== audio =====================
const Snd = {
  ctx: null, master: null, muted: false, last: {},
  init() { if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; } try { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.45; this.master.connect(this.ctx.destination); const len = this.ctx.sampleRate, nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = nb; } catch (e) { } },
  tone(type, f0, f1, dur, vol, a = 0.005) { const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05); },
  burst(dur, vol, f0, f1, type = 'bandpass', q = 1) { const c = this.ctx, t = c.currentTime, s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05); },
  music(kind) {
    if (!this.ctx || this.muted) return; if (this.musicKind === kind) return; this.musicKind = kind; this.stopMusic();
    const c = this.ctx; this.mg = c.createGain(); this.mg.gain.value = 0.0001; this.mg.connect(this.master); this.mg.gain.linearRampToValueAtTime(0.16, c.currentTime + 2);
    const pluck = (f, t, dur, vol) => { const o = c.createOscillator(), g = c.createGain(); o.type = kind === 'town' ? 'triangle' : 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.mg); o.start(t); o.stop(t + dur + 0.05); };
    const town = [[0, 262], [1, 330], [2, 392], [3, 494], [4, 392], [5, 330], [6, 294], [7, 349], [8, 440], [9, 523], [10, 440], [11, 349], [12, 262], [13, 330], [14, 392], [15, 330]];
    const dungeon = [[0, 110], [4, 131], [8, 98], [12, 123], [2, 165], [6, 196], [10, 147], [14, 185]];
    const pat = kind === 'town' ? town : dungeon, step = kind === 'town' ? 0.32 : 0.6, bar = 16 * step;
    const schedule = () => { if (this.musicKind !== kind) return; const t0 = c.currentTime + 0.1; for (const [i, f] of pat) pluck(f, t0 + i * step, kind === 'town' ? 0.5 : 2.2, kind === 'town' ? 0.5 : 0.35); if (kind === 'dungeon') pluck(55, t0, bar, 0.4); this.musicTimer = setTimeout(schedule, bar * 1000 - 50); };
    schedule();
  },
  stopMusic() { if (this.musicTimer) clearTimeout(this.musicTimer); this.musicTimer = null; if (this.mg) { try { this.mg.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5); const g = this.mg; setTimeout(() => g.disconnect(), 700); } catch (e) { } } this.mg = null; },
  play(n) {
    if (!this.ctx || this.muted) return; const now = performance.now(); if (this.last[n] && now - this.last[n] < 50) return; this.last[n] = now;
    switch (n) {
      case 'hit': this.burst(0.1, 0.3, 1800, 500); this.tone('square', 200, 90, 0.08, 0.1); break;
      case 'crit': this.burst(0.14, 0.4, 2500, 600); this.tone('square', 300, 100, 0.12, 0.15); break;
      case 'miss': this.burst(0.12, 0.15, 900, 2500); break;
      case 'bow': this.burst(0.07, 0.2, 1600, 4000, 'bandpass', 2); this.tone('triangle', 800, 300, 0.07, 0.08); break;
      case 'cast': this.tone('sine', 500, 1400, 0.25, 0.1); this.burst(0.2, 0.08, 2000, 5000); break;
      case 'hurt': this.burst(0.15, 0.35, 500, 120, 'lowpass'); this.tone('square', 120, 60, 0.12, 0.12); break;
      case 'explode': this.burst(0.45, 0.5, 300, 60, 'lowpass'); this.tone('sine', 100, 30, 0.4, 0.25); break;
      case 'coin': this.tone('triangle', 1200, 1800, 0.08, 0.1); this.tone('triangle', 1800, 2400, 0.1, 0.08, 0.05); break;
      case 'drink': this.tone('sine', 400, 700, 0.2, 0.12); break;
      case 'ui': this.tone('square', 600, 800, 0.04, 0.05); break;
      case 'buy': this.tone('triangle', 900, 1300, 0.1, 0.1); this.tone('triangle', 1300, 1600, 0.1, 0.08, 0.08); break;
      case 'level': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.3, 0.15, 0.01), i * 90)); break;
      case 'quest': [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone('sine', f, f, 0.4, 0.14, 0.02), i * 120)); break;
      case 'door': this.burst(0.3, 0.2, 200, 80, 'lowpass'); break;
      case 'chest': this.burst(0.12, 0.25, 500, 200); this.tone('triangle', 500, 800, 0.25, 0.12, 0.05); break;
      case 'rest': this.tone('sine', 330, 330, 0.6, 0.12, 0.1); this.tone('sine', 495, 495, 0.8, 0.1, 0.2); break;
      case 'dead': this.tone('sine', 220, 55, 2, 0.3, 0.3); this.tone('sine', 165, 41, 2, 0.2, 0.3); break;
      case 'boss': this.tone('sawtooth', 80, 40, 1, 0.3, 0.05); this.burst(0.8, 0.25, 200, 60, 'lowpass'); break;
      case 'portal': this.tone('sine', 300, 1800, 0.8, 0.15, 0.1); this.burst(0.6, 0.1, 800, 4000); break;
    }
  },
};

// ---- 50_game.js ----
// ===================== game state & party =====================
const G = {};
let M = null;
const TIME_SCALE = 2;          // game minutes per real second
const DAY = 1440;
const SAVE_KEY = 'harrowmere_mm_v1';
const dayOf = () => Math.floor(G.time / DAY) + 1;
const hourOf = () => Math.floor((G.time % DAY) / 60);
const minuteOf = () => Math.floor(G.time % 60);
const isNight = () => { const h = hourOf(); return h >= 20 || h < 6; };
function daylight() { const h = (G.time % DAY) / 60; if (h < 5) return 0; if (h < 7) return (h - 5) / 2; if (h < 18) return 1; if (h < 21) return 1 - (h - 18) / 3; return 0; }

// ---- members ----
function makeMember(name, cls) {
  const c = CLASSES[cls];
  const m = { name, cls, lvl: 1, xp: 0, stats: Object.assign({}, c.stats), skills: Object.assign({}, c.start), skillPts: 0, equip: {}, spells: c.spells.slice(), cond: {}, rec: 0, hp: 1, sp: 1, portrait: c.sprite, hurt: 0, bounce: 0 };
  for (const g of c.gear) equipItem(m, makeItem(g), true);
  m.hp = maxHp(m); m.sp = maxSp(m);
  return m;
}
function equipList(m) { return Object.values(m.equip).filter(Boolean); }
function enchSum(m, key) { let v = 0; for (const it of equipList(m)) { if (!it.ench) continue; const e = ENCHANTS.find(x => x.id === it.ench); if (e[key] !== undefined && key !== 'stat') v += it.ev; } return v; }
function effStat(m, s) { let v = m.stats[s]; for (const it of equipList(m)) { if (!it.ench) continue; const e = ENCHANTS.find(x => x.id === it.ench); if (e.stat === s) v += it.ev; } if (m.cond.weak) v -= 3; return Math.max(1, v); }
function maxHp(m) { const c = CLASSES[m.cls]; return Math.max(1, c.baseHp + m.lvl * (c.hpLv + statBonus(effStat(m, 'en')) + (m.skills.BodyBuilding || 0)) + enchSum(m, 'hp')); }
function maxSp(m) { const c = CLASSES[m.cls]; if (!c.spStat) return 0; return Math.max(0, c.baseSp + m.lvl * (c.spLv + statBonus(effStat(m, c.spStat)) + (m.skills.Meditation || 0)) + enchSum(m, 'spts')); }
function armorClass(m) {
  let ac = statBonus(effStat(m, 'sp'));
  for (const it of equipList(m)) { const b = ITEMS[it.id]; if (b.acv) ac += b.acv; if (it.ench) { const e = ENCHANTS.find(x => x.id === it.ench); if (e.acv) ac += it.ev; } if (b.skill && (b.type === 'armor' || b.type === 'shield') && (m.skills[b.skill] || 0) >= 4) ac += m.skills[b.skill]; if (b.type === 'shield') ac += (m.skills.Shield || 0); if (b.skill === 'Staff' && (m.skills.Staff || 0) >= 4) ac += 2 * m.skills.Staff; if (b.skill === 'Spear' && (m.skills.Spear || 0) >= 4) ac += 1; }
  if (buffOn('shield')) ac += 8 + G.buffs.shield.pow; if (buffOn('stoneskin')) ac += 12 + G.buffs.stoneskin.pow;
  return Math.max(0, ac);
}
function weaponOf(m) { return m.equip.weapon ? ITEMS[m.equip.weapon.id] : null; }
function isRanged(m) { const w = weaponOf(m); return !!(w && w.ranged); }
function attackBonus(m) { const w = weaponOf(m); let b = statBonus(effStat(m, 'ac')); if (w) b += (m.skills[w.skill] || 0); if (m.equip.weapon && m.equip.weapon.ench === 'ac_') b += m.equip.weapon.ev; if (buffOn('bless')) b += 5 + G.buffs.bless.pow; return b; }
function damageRoll(m) {
  const w = weaponOf(m); let d = w ? roll(w.dmg[0], w.dmg[1], w.dmg[2]) : roll(1, 3, 0);
  if (!(w && w.ranged)) d += statBonus(effStat(m, 'mt')); else d += Math.floor(statBonus(effStat(m, 'mt')) / 2);
  if (w && (m.skills[w.skill] || 0) >= 8 && ['Sword', 'Axe', 'Dagger', 'Bow'].includes(w.skill)) d += m.skills[w.skill];
  if (m.equip.weapon && m.equip.weapon.ench === 'dmg') d += m.equip.weapon.ev;
  if (buffOn('heroism')) d += 3 + G.buffs.heroism.pow; if (m.buffHammer > 0) d += m.buffHammer;
  if (w && w.skill === 'Dagger' && (m.skills.Dagger || 0) >= 8 && Math.random() < 0.15) d *= 3;
  return Math.max(1, d);
}
function weaponElem(m) { const it = m.equip.weapon; if (!it || !it.ench) return null; const e = ENCHANTS.find(x => x.id === it.ench); return e.elem ? { elem: e.elem, dmg: it.ev } : null; }
function recoveryTime(m) {
  const w = weaponOf(m); let ticks = w ? w.rec : 60;
  for (const it of equipList(m)) { const b = ITEMS[it.id]; if (b.recPen) ticks += b.recPen * Math.max(0, 1 - (m.skills[b.skill] || 0) * 0.2); }
  if (w && (m.skills[w.skill] || 0) >= 4 && (w.skill === 'Sword' || w.skill === 'Bow')) ticks -= 10;
  ticks -= statBonus(effStat(m, 'sp')) * 4;
  return clamp(ticks / 60, 0.35, 3);
}
function canUse(m, it) { const b = ITEMS[it.id]; if (!b) return false; if (b.type === 'weapon' && b.skill && !(m.skills[b.skill] > 0)) return false; if ((b.type === 'armor' || b.type === 'shield') && b.skill && !(m.skills[b.skill] > 0)) return false; return true; }
function equipItem(m, it, silent) {
  const b = ITEMS[it.id], slot = SLOT_OF[b.type]; if (!slot) return false;
  if (!canUse(m, it)) { if (!silent) log(m.name + ' lacks the ' + b.skill + ' skill.'); return false; }
  const old = m.equip[slot]; m.equip[slot] = it;
  if (b.twoHand && m.equip.shield) { G.inv.push(m.equip.shield); m.equip.shield = null; }
  if (b.type === 'shield' && m.equip.weapon && ITEMS[m.equip.weapon.id].twoHand) { G.inv.push(m.equip.weapon); m.equip.weapon = null; }
  if (old) G.inv.push(old);
  m.hp = Math.min(m.hp, maxHp(m)); m.sp = Math.min(m.sp, maxSp(m));
  return true;
}
function unequip(m, slot) { const it = m.equip[slot]; if (!it) return; m.equip[slot] = null; G.inv.push(it); m.hp = Math.min(m.hp, maxHp(m)); }
function alive(m) { return !m.cond.dead && !m.cond.unconscious; }
function addInv(it) { const b = ITEMS[it.id]; if (b.stack) { const ex = G.inv.find(x => x.id === it.id); if (ex) { ex.qty += it.qty || 1; return; } } G.inv.push(it); }
function removeInv(id, n = 1) { const ex = G.inv.find(x => x.id === id); if (!ex) return false; if (ex.qty > n) ex.qty -= n; else G.inv.splice(G.inv.indexOf(ex), 1); return true; }
function countInv(id) { const ex = G.inv.find(x => x.id === id); return ex ? ex.qty : 0; }
function buffOn(id) { return G.buffs[id] && G.buffs[id].until > G.time; }
function addBuff(id, hours, pow) { G.buffs[id] = { until: G.time + hours * 60, pow }; }

// ---- messages ----
function log(t) { const last = G.log[G.log.length - 1]; if (last && last.text === t) { last.t = 0; return; } G.log.push({ text: t, t: 0 }); if (G.log.length > 6) G.log.shift(); }
function notice(text, sub, dur = 3) { G.notice = { text, sub, t: dur, dur }; }

// ---- new game ----
function newGame(members) {
  Object.assign(G, {
    mode: 'play', party: members, sel: 0, gold: 500, food: 6, time: 8 * 60, inv: [], buffs: {}, mapState: {}, quests: {}, counters: {}, flags: {}, log: [], notice: null, screen: null,
    turnBased: false, tbClock: 0, monsters: [], projs: [], fx: [], drops: [], trail: [], facing: 1, kills: 0, fearT: 0, playTime: 0, camSet: false, lastRest: 8 * 60, fadeT: 0,
  });
  addInv(makeItem('potion_heal')); addInv(makeItem('potion_heal')); addInv(makeItem('torch')); addInv(makeItem('torch'));
  enterMap('over', null, null);
  notice('HARROWMERE', 'Day 1, morning', 4);
  log('Welcome to Harrowmere. Lord Harrow\'s hall is north of the square.');
}
function defaultParty() { return [makeMember('Roderick', 'Knight'), makeMember('Sable', 'Archer'), makeMember('Mira', 'Cleric'), makeMember('Vesper', 'Sorcerer')]; }

// ---- maps ----
function respawnCheck(map, st, live) { // the dead come back after a while (bosses excepted); outdoors in 3 days, dungeons in 10
  const respawnAfter = map.id === 'over' ? 3 * DAY : 10 * DAY;
  for (const k in st.dead) { const mo = map.monsters[k]; if (!mo || mo.boss) continue; const t = st.dead[k] === 1 ? -1e9 : st.dead[k]; if (G.time - t > respawnAfter) { delete st.dead[k]; if (live && dist(mo.x, mo.y, G.x, G.y) > 14 && !G.monsters.some(o => o.id === +k)) G.monsters.push(spawnMonster(mo, +k)); } }
}
function mapState(id) { if (!G.mapState[id]) G.mapState[id] = { dead: {}, opened: {}, lastVisit: -1e9, explored: null }; return G.mapState[id]; }
function enterMap(id, x, y) {
  if (M) { const st = mapState(M.id); st.explored = M.explored; st.lastVisit = G.time; }
  M = getMap(id); const st = mapState(id);
  // respawn
  respawnCheck(M, st, false);
  if (st.explored && st.explored.length === M.explored.length) M.explored = st.explored; else st.explored = M.explored;
  G.monsters = []; M.monsters.forEach((mo, i) => { if (st.dead[i]) return; G.monsters.push(spawnMonster(mo, i)); });
  G.projs = []; G.fx = []; G.drops = [];
  const sx = x !== null && x !== undefined ? x : M.start.x, sy = y !== null && y !== undefined ? y : M.start.y;
  G.x = sx; G.y = sy; G.trail = []; for (let i = 0; i < 24; i++) { const ox = sx, oy = sy + i * 0.22; G.trail.push(mPass(M, Math.floor(ox), Math.floor(oy)) ? [ox, oy] : [sx, sy]); }
  G.camSet = false; G.mapT = 0;
  if (M.id !== 'over') notice(M.name.toUpperCase(), DUNGEONS[M.id].entrance, 4); else if (G.playTime > 1) notice('HARROWMERE REACH', null, 2.5);
}

// ---- movement ----
const PR = 0.3; // party collision radius
function blockedAt(x, y) { if (!mPass(M, Math.floor(x), Math.floor(y))) return true; return false; }
function moveCircle(ent, dx, dy, r) {
  let nx = ent.x + dx, ny = ent.y;
  if (!(blockedAt(nx + r, ny - r * 0.7) || blockedAt(nx + r, ny + r * 0.7) || blockedAt(nx - r, ny - r * 0.7) || blockedAt(nx - r, ny + r * 0.7))) ent.x = nx; else ent.blocked = true;
  ny = ent.y + dy; nx = ent.x;
  if (!(blockedAt(nx - r * 0.7, ny + r) || blockedAt(nx + r * 0.7, ny + r) || blockedAt(nx - r * 0.7, ny - r) || blockedAt(nx + r * 0.7, ny - r))) ent.y = ny; else ent.blocked = true;
}
function unstick(ent, r) {
  const cx = Math.floor(ent.x), cy = Math.floor(ent.y);
  if (blockedAt(ent.x, ent.y)) { for (let rad = 1; rad < 6; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (!blockedAt(cx + dx + 0.5, cy + dy + 0.5)) { ent.x = cx + dx + 0.5; ent.y = cy + dy + 0.5; return; } return; }
  if (blockedAt(ent.x + r, ent.y)) ent.x = cx + 1 - r - 0.01; if (blockedAt(ent.x - r, ent.y)) ent.x = cx + r + 0.01; if (blockedAt(ent.x, ent.y + r)) ent.y = cy + 1 - r - 0.01; if (blockedAt(ent.x, ent.y - r)) ent.y = cy + r + 0.01;
}
function hasLOS(x0, y0, x1, y1) { const d = dist(x0, y0, x1, y1); const n = Math.ceil(d * 3); for (let i = 1; i < n; i++) { const t = i / n; const tt = mGet(M, Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t)); if (tt === TR.WALL || tt === TR.VOID || tt === TR.ROOF || tt === TR.TREE) return false; } return true; }

function updateParty(dt) {
  const spd = (buffOn('haste') ? 5.5 : 4.2) * (G.chill > 0 ? 0.55 : 1) * (M.outdoor && mGet(M, Math.floor(G.x), Math.floor(G.y)) === TR.ROAD ? 1.15 : 1);
  let mx = I.mx, my = I.my;
  if (mx || my) {
    const p = { x: G.x, y: G.y, blocked: false }; moveCircle(p, mx * spd * dt, my * spd * dt, PR);
    const moved = dist(p.x, p.y, G.x, G.y); G.x = p.x; G.y = p.y;
    if (Math.abs(mx) > 0.2) G.facing = mx < 0 ? -1 : 1;
    G.walkT = (G.walkT || 0) + moved;
    if (moved > 0) { const last = G.trail[0]; if (dist(last[0], last[1], G.x, G.y) > 0.22) { G.trail.unshift([G.x, G.y]); if (G.trail.length > 40) G.trail.pop(); } }
    if (G.turnBased && moved > 0) G.tbClock += moved * 0.6;
  }
  for (const mo of G.monsters) if (!mo.dead) pushApart(G, mo, PR + mo.r, 1);
  const p = { x: G.x, y: G.y }; unstick(p, PR); G.x = p.x; G.y = p.y;
  G.x = clamp(G.x, 0.5, M.w - 0.5); G.y = clamp(G.y, 0.5, M.h - 0.5);
  // explore
  const rad = M.outdoor ? (daylight() > 0.3 ? 11 : 6 + (buffOn('torch') ? 3 : 0)) : 5 + (buffOn('torch') ? 3 : 0);
  const cx = Math.floor(G.x), cy = Math.floor(G.y);
  for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (x >= 0 && y >= 0 && x < M.w && y < M.h && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rad * rad) M.explored[y * M.w + x] = 1;
  // triggers: exits when standing on them, lava damage
  const t = mGet(M, cx, cy);
  if (t === TR.LAVA) { G.lavaT = (G.lavaT || 0) + dt; if (G.lavaT > 0.5) { G.lavaT = 0; for (const m of G.party) if (alive(m)) damageMember(m, 8, 'fire'); log('The lava burns!'); } }
}
function pushApart(a, b, minD, w) {
  const ax = a.x, ay = a.y; let dx = ax - b.x, dy = ay - b.y, d2 = dx * dx + dy * dy; if (d2 >= minD * minD) return;
  if (d2 < 1e-6) { dx = 0.01; dy = 0.005; d2 = dx * dx + dy * dy; }
  const d = Math.sqrt(d2), push = (minD - d) * w;
  const tmp = { x: ax, y: ay }; moveCircle(tmp, dx / d * push, dy / d * push, a === G ? PR : (a.r || 0.3)); a.x = tmp.x; a.y = tmp.y;
}
function memberScreenPositions() { // formation: followers trail the leader
  const out = []; let fi = 0;
  G.party.forEach((m, i) => { if (!alive(m)) return; const idx = Math.min(G.trail.length - 1, fi * 4); const p = fi === 0 ? [G.x, G.y] : G.trail[idx]; out.push({ m, x: p[0], y: p[1], i }); fi++; });
  return out;
}

// ---- interaction ----
function nearestInteractable() {
  let best = null, bd = 1.6;
  for (const o of M.objects) { if (o.taken || (o.kind === 'chest' && o.opened) || o.kind === 'brazier' || o.kind === 'deco') continue; let d = dist(G.x, G.y, o.x + 0.5, o.y + 0.5); if (o.kind === 'door' || o.kind === 'entrance' || o.kind === 'stairs') d -= 0.45; if (d < bd) { bd = d; best = { type: 'object', o, d }; } }
  for (const n of M.npcs) { const d = dist(G.x, G.y, n.x, n.y); if (d < bd) { bd = d; best = { type: 'npc', n, d }; } }
  return best;
}
function interactLabel(it) {
  if (!it) return null;
  if (it.type === 'npc') return 'Talk to ' + it.n.name;
  const o = it.o; switch (o.kind) {
    case 'door': return 'Enter ' + o.name; case 'entrance': return 'Enter ' + o.name; case 'stairs': return 'Leave the dungeon'; case 'chest': return o.big ? 'Open the great chest' : 'Open chest'; case 'pickup': return 'Take ' + ITEMS[o.item].name; case 'sign': return 'Read sign'; case 'well': return 'Drink from the well'; case 'pot': return 'Smash pot'; case 'brazier': case 'deco': return null;
  }
  return null;
}
function doInteract(it) {
  if (!it) return;
  if (it.type === 'npc') { openNpc(it.n); return; }
  const o = it.o;
  switch (o.kind) {
    case 'door': openBuilding(BUILDINGS[o.building]); break;
    case 'entrance': { const d = DUNGEONS[o.dungeon]; if (d.locked && !d.locked.every(k => countInv(k) > 0)) { log('The door is locked. It needs the ' + d.locked.map(k => ITEMS[k].name).join(' and the ') + '.'); return; } enterMap(o.dungeon, null, null); break; }
    case 'stairs': { const ex = M.exits.find(e => e.x === o.x && e.y === o.y); enterMap('over', ex.tx + 0.5, ex.ty + 0.5); break; }
    case 'chest': openChest(o); break;
    case 'pickup': { o.taken = true; mapState(M.id).opened[o.id] = 1; addInv(makeItem(o.item)); log('Found ' + ITEMS[o.item].name + '.'); checkQuests(); break; }
    case 'sign': openText('Sign', o.text); break;
    case 'well': { for (const m of G.party) if (alive(m)) m.hp = Math.min(maxHp(m), m.hp + 10); log('Cool water. The party feels refreshed.'); break; }
    case 'pot': { o.taken = true; mapState(M.id).opened[o.id] = 1; const g = rint(5, 25) * M.tier; G.gold += g; log('Smashed a pot: ' + g + ' gold.'); fxAt(o.x + 0.5, o.y + 0.5, 'spark', '#c8a060'); break; }
  }
}
function openChest(o) {
  const st = mapState(M.id); o.opened = true; st.opened[o.id] = 1;
  const disarm = Math.max(...G.party.map(m => m.skills.Disarm || 0));
  if (Math.random() < 0.22 && Math.random() > disarm * 0.15) { const v = G.party.filter(alive); if (v.length) { const m = pick(v); const d = 4 * o.tier + rint(1, 8); damageMember(m, d, 'phys'); log('A trap! ' + m.name + ' takes ' + d + ' damage.'); } }
  const perc = Math.max(...G.party.map(m => m.skills.Perception || 0));
  const gold = Math.floor((rint(30, 90) * o.tier) * (1 + perc * 0.1)); G.gold += gold;
  const items = []; const n = o.big ? 3 : (Math.random() < 0.6 ? 1 : 2);
  for (let i = 0; i < n; i++) { const it = randomLoot(o.tier, Math.max(...G.party.map(m => effStat(m, 'lk')))); addInv(it); items.push(itemName(it)); }
  if (o.item) { addInv(makeItem(o.item)); items.push(ITEMS[o.item].name); }
  log('Chest: ' + gold + ' gold, ' + items.join(', ') + '.');
  fxAt(o.x + 0.5, o.y + 0.5, 'spark', '#ffd060'); checkQuests();
}

// ---- time, rest, conditions ----
function updateClock(dt) {
  G.time += dt * TIME_SCALE; G.playTime += dt;
  // slow SP regen, poison ticks
  G.regenT = (G.regenT || 0) + dt * TIME_SCALE;
  if (G.regenT >= 15) { G.regenT -= 15; for (const m of G.party) { if (!alive(m)) continue; if (m.sp < maxSp(m)) m.sp = Math.min(maxSp(m), m.sp + 1 + Math.floor((m.skills.Meditation || 0) / 3)); if (m.cond.poison) { m.hp = Math.max(1, m.hp - 2); if (Math.random() < 0.15) log(m.name + ' suffers from poison.'); } } }
  for (const id in G.buffs) if (G.buffs[id].until <= G.time) delete G.buffs[id];
  if (G.chill > 0) G.chill -= dt;
}
function canRest() { for (const mo of G.monsters) if (!mo.dead && mo.aware && dist(mo.x, mo.y, G.x, G.y) < 10) return 'Enemies are nearby!'; return null; }
function restParty(hours = 8, inn = false) {
  if (!inn) { if (G.food <= 0) { log('No food. The party rests poorly.'); } else G.food--; }
  G.time += hours * 60;
  const full = inn || G.food >= 0 && G.lastFood !== 'none';
  for (const m of G.party) { if (m.cond.dead) continue; m.cond.unconscious = false; if (inn) { m.cond.poison = false; } const frac = inn || G.food >= 0 ? 1 : 0.5; m.hp = Math.max(m.hp, Math.floor(maxHp(m) * frac)); m.sp = Math.max(m.sp, Math.floor(maxSp(m) * frac)); m.cond.weak = false; }
  G.lastRest = G.time;
  // monsters wander back home while you sleep
  for (const mo of G.monsters) if (!mo.dead) { mo.aware = false; mo.x = mo.hx; mo.y = mo.hy; mo.hp = Math.min(mo.maxHp, mo.hp + mo.maxHp * 0.5); }
  respawnCheck(M, mapState(M.id), true);
  log('The party rests for ' + hours + ' hours.');
}
function damageMember(m, dmg, elem, src) {
  if (m.cond.dead) return 0;
  dmg = Math.max(0, Math.round(dmg)); if (elem && elem !== 'phys' && elem !== 'mind') { const res = enchSum(m, 'res_' + elem) || 0; for (const it of equipList(m)) { if (it.ench === 'r' + elem) dmg = Math.round(dmg * (1 - Math.min(0.75, it.ev / 100))); } }
  if (m.cond.unconscious) { m.cond.dead = true; m.cond.unconscious = false; m.hp = 0; log(m.name + ' has died!'); checkPartyDead(); return dmg; }
  m.hp -= dmg; m.hurt = 0.5; m.dmgPop = { n: dmg, t: 1 };
  if (m.hp <= 0) { m.hp = 0; m.cond.unconscious = true; log(m.name + ' falls unconscious!'); if (G.sel === G.party.indexOf(m)) selectNextAlive(); checkPartyDead(); }
  return dmg;
}
function selectNextAlive() { for (let i = 0; i < 4; i++) { const j = (G.sel + i) % G.party.length; if (alive(G.party[j])) { G.sel = j; return; } } }
function checkPartyDead() { if (G.party.some(alive)) return; G.mode = 'dead'; G.deadT = 0; }
function partyWipe() {
  // the temple takes a tithe and brings everyone back
  const tithe = Math.floor(G.gold * 0.2); G.gold -= tithe;
  for (const m of G.party) { m.cond = {}; m.hp = Math.max(1, Math.floor(maxHp(m) / 2)); m.sp = Math.floor(maxSp(m) / 2); m.rec = 0; }
  G.time += 12 * 60; G.turnBased = false;
  enterMap('over', getMap('over').townSquare.x, getMap('over').townSquare.y + 1);
  G.mode = 'play'; G.sel = 0;
  log('You wake in the Temple of the Dawn. The priests kept ' + tithe + ' gold for their trouble.');
}

// ---- XP, training, quests ----
function giveXp(n) { for (const m of G.party) if (!m.cond.dead) m.xp += Math.round(n * (1 + (m.skills.Learning || 0) * 0.05)); }
function canTrain(m) { return !m.cond.dead && m.xp >= XP_FOR_LEVEL(m.lvl + 1); }
function train(m) {
  if (!canTrain(m)) return false; const cost = TRAIN_COST(m.lvl + 1); if (G.gold < cost) { log('Not enough gold to train.'); return false; }
  G.gold -= cost; m.lvl++; m.skillPts += 2; m.hp = maxHp(m); m.sp = maxSp(m); log(m.name + ' is now level ' + m.lvl + '.'); return true;
}
function skillUpCost(lv) { return lv + 1; }
function raiseSkill(m, sk) {
  const lv = m.skills[sk] || 0; const cost = skillUpCost(lv);
  if (lv >= 3 && lv < 4 && !(m.promo && m.promo[sk] >= 4)) { log('Expert training is needed to go further.'); return false; }
  if (lv >= 7 && lv < 8 && !(m.promo && m.promo[sk] >= 8)) { log('Master training is needed to go further.'); return false; }
  if (lv >= 10) return false;
  if (m.skillPts < cost) { log('Not enough skill points (' + cost + ' needed).'); return false; }
  m.skillPts -= cost; m.skills[sk] = lv + 1; return true;
}
function questState(id) { return G.quests[id] || 'none'; }
function startQuest(id) { if (questState(id) === 'none') { G.quests[id] = 'active'; log('New quest: ' + QUESTS[id].name); } }
function questProgress(id) { const q = QUESTS[id]; if (q.kill) return Math.min(q.count, G.counters[id] || 0) + '/' + q.count; if (q.items) return q.items.filter(i => countInv(i) > 0).length + '/' + q.items.length; if (q.item && q.count) return Math.min(q.count, countInv(q.item)) + '/' + q.count; if (q.item) return countInv(q.item) > 0 ? 'item found' : 'not yet'; return ''; }
function questReady(id) { const q = QUESTS[id]; if (questState(id) !== 'active') return false; if (q.kill) return (G.counters[id] || 0) >= q.count; if (q.items) return q.items.every(i => countInv(i) > 0); if (q.item) return countInv(q.item) >= (q.count || 1); return false; }
function completeQuest(id) {
  const q = QUESTS[id]; if (!questReady(id)) return false;
  if (q.items) q.items.forEach(i => removeInv(i)); else if (q.item) removeInv(q.item, q.count || 1);
  G.quests[id] = 'done'; G.gold += q.reward.gold || 0; giveXp(q.reward.xp || 0);
  if (q.reward.item) addInv(makeItem(q.reward.item)); if (q.reward.skillPoints) for (const m of G.party) m.skillPts += q.reward.skillPoints;
  log('Quest complete: ' + q.name + '. +' + q.reward.gold + ' gold, +' + q.reward.xp + ' experience.');
  if (q.next) startQuest(q.next); if (q.final) { G.flags.won = true; G.mode = 'ending'; G.endT = 0; }
  return true;
}
function checkQuests() { for (const id in G.quests) if (G.quests[id] === 'active' && questReady(id)) { log('Quest ready to turn in: ' + QUESTS[id].name); } }

// ---- fx helpers ----
function fxAt(x, y, fx, color, extra) { G.fx.push(Object.assign({ kind: 'fx', x, y, fx, color, life: 0.6, dur: 0.6, r: 1, seed: Math.random() * 6 }, extra || {})); }
function fxText(x, y, t, color) { G.fx.push({ kind: 'fx', x, y, fx: 'text', text: t, color, life: 1.1, dur: 1.1 }); }

// ---- save / load ----
function saveGame(slot = 'auto') {
  try {
    if (M) { const st = mapState(M.id); st.explored = M.explored; }
    const ms = {}; for (const id in G.mapState) { const s = G.mapState[id]; ms[id] = { dead: s.dead, opened: s.opened, lastVisit: s.lastVisit, explored: s.explored ? btoa(String.fromCharCode.apply(null, Array.from(s.explored).map(v => v ? 49 : 48))) : null }; }
    const data = { v: 1, party: G.party, gold: G.gold, food: G.food, time: G.time, inv: G.inv, buffs: G.buffs, mapState: ms, quests: G.quests, counters: G.counters, flags: G.flags, mapId: M.id, x: G.x, y: G.y, kills: G.kills, playTime: G.playTime, sel: G.sel, savedAt: Date.now() };
    localStorage.setItem(SAVE_KEY + '_' + slot, JSON.stringify(data)); return true;
  } catch (e) { return false; }
}
function hasSave(slot = 'auto') { try { return !!localStorage.getItem(SAVE_KEY + '_' + slot); } catch (e) { return false; } }
function loadGame(slot = 'auto') {
  let d; try { d = JSON.parse(localStorage.getItem(SAVE_KEY + '_' + slot)); } catch (e) { return false; } if (!d) return false;
  Object.assign(G, { mode: 'play', party: d.party, sel: d.sel || 0, gold: d.gold, food: d.food, time: d.time, inv: d.inv, buffs: d.buffs || {}, mapState: {}, quests: d.quests, counters: d.counters, flags: d.flags, log: [], notice: null, screen: null, turnBased: false, tbClock: 0, monsters: [], projs: [], fx: [], drops: [], trail: [], facing: 1, kills: d.kills || 0, fearT: 0, playTime: d.playTime || 0, camSet: false, fadeT: 0 });
  for (const id in d.mapState) { const s = d.mapState[id]; G.mapState[id] = { dead: s.dead, opened: s.opened, lastVisit: s.lastVisit, explored: s.explored ? Uint8Array.from(atob(s.explored), c => c === '1' ? 1 : 0) : null }; }
  for (const m of G.party) { m.rec = 0; m.hurt = 0; m.bounce = 0; m.dmgPop = null; }
  M = null; enterMap(d.mapId, d.x, d.y);
  // restore opened chests / taken pickups
  const st = mapState(M.id); for (const o of M.objects) { if (st.opened[o.id]) { if (o.kind === 'chest') o.opened = true; else o.taken = true; } }
  log('Game loaded.'); return true;
}

// ---- 60_combat.js ----
// ===================== combat =====================
function spawnMonster(def, idx) {
  const d = MONSTERS[def.kind];
  return { id: idx, kind: def.kind, d, name: d.name, x: def.x, y: def.y, hx: def.x, hy: def.y, hp: d.hp, maxHp: d.hp, r: 0.28 + (d.size || 1) * 0.08, aware: false, dead: false, rec: 1 + Math.random(), stun: 0, slow: 0, fear: 0, anim: Math.random() * 10, flip: false, boss: !!def.boss, drop: def.drop, group: def.group, wanderT: 0, blinkT: 4, summonT: 6, hurt: 0, mimic: !!d.mimic, hidden: !!d.mimic };
}
function restoreOpened() { const st = mapState(M.id); for (const o of M.objects) { if (st.opened[o.id]) { if (o.kind === 'chest') o.opened = true; else o.taken = true; } } }
function combatDt(dt) { return G.cd === undefined ? dt : G.cd; }
function frameCombatDt(dt) { if (!G.turnBased) { G.cd = dt; return; } const d = Math.min(dt, G.tbClock); G.tbClock = Math.max(0, G.tbClock - d); G.cd = d; }
function tbCost(n) { if (G.turnBased) G.tbClock += n; }
function nearestMember() { return { x: G.x, y: G.y }; }
function pickTargetMember() {
  const v = G.party.map((m, i) => ({ m, w: alive(m) ? (i < 2 ? 3 : 1.4) : 0 })).filter(e => e.w > 0); if (!v.length) return null;
  let t = Math.random() * v.reduce((a, e) => a + e.w, 0); for (const e of v) { t -= e.w; if (t <= 0) return e.m; } return v[v.length - 1].m;
}
function monsterResist(mo, elem) { const r = mo.d.res && mo.d.res[elem]; return r || 0; }
function hurtMonster(mo, dmg, elem, srcMember, silent) {
  if (mo.dead) return 0;
  const res = monsterResist(mo, elem || 'phys'); dmg = Math.round(dmg * (1 - res / 100)); if (res >= 100) dmg = 0;
  mo.hp -= dmg; mo.hurt = 0.2; mo.aware = true; mo.hidden = false; alertGroup(mo);
  fxText(mo.x, mo.y, dmg > 0 ? dmg : 'immune', elem === 'fire' ? '#ff9040' : elem === 'cold' ? '#90d0ff' : elem === 'elec' ? '#ffe060' : elem === 'poison' ? '#80e060' : elem === 'mind' ? '#e090ff' : '#fff');
  if (mo.hp <= 0) killMonster(mo, srcMember);
  return dmg;
}
function alertGroup(mo) { for (const o of G.monsters) if (!o.dead && !o.aware && o.group && o.group === mo.group && dist(o.x, o.y, mo.x, mo.y) < 8) o.aware = true; }
function killMonster(mo, src) {
  mo.dead = true; mo.deadT = 0.8; G.kills++; mapState(M.id).dead[mo.id] = G.time || 1;
  giveXp(mo.d.xp);
  const perc = Math.max(...G.party.map(m => m.skills.Perception || 0));
  const gold = Math.floor(rint(mo.d.gold[0], mo.d.gold[1]) * (1 + perc * 0.1));
  const items = []; if (Math.random() < 0.18 + mo.d.tier * 0.05 || mo.boss) items.push(randomLoot(mo.d.tier)); if (mo.boss) items.push(randomLoot(mo.d.tier + 1));
  if (mo.drop) items.push(makeItem(mo.drop));
  if (gold > 0 || items.length) G.drops.push({ x: mo.x, y: mo.y, gold, items, t: 0 });
  for (const id in G.quests) { const q = QUESTS[id]; if (G.quests[id] === 'active' && q.kill && q.kill.includes(mo.kind)) { G.counters[id] = (G.counters[id] || 0) + 1; if (G.counters[id] === q.count) log('Quest ready to turn in: ' + q.name); } }
  log((src ? src.name + ' slays ' : 'Slain: ') + mo.name + '. +' + mo.d.xp + ' xp');
  if (mo.boss) notice(mo.name.toUpperCase() + ' IS SLAIN', null, 4);
  fxAt(mo.x, mo.y, 'burst', '#ffd090', { r: 1.2, life: 0.5, dur: 0.5 });
  if (G.target === mo) G.target = null;
}
function hitChanceParty(m, mo) { const a = attackBonus(m); return clamp((a * 5 + 60) / (a * 5 + 60 + mo.d.acv * 2.5), 0.2, 0.97); }
function hitChanceMonster(mo, m) { const a = mo.d.atk; return clamp((a * 5 + 50) / (a * 5 + 50 + armorClass(m) * 2), 0.12, 0.95); }

// ---- party actions ----
function findMeleeTarget(prefer) {
  if (prefer && !prefer.dead && dist(prefer.x, prefer.y, G.x, G.y) < 1.6 + prefer.r) return prefer;
  let best = null, bd = 1e9; for (const mo of G.monsters) { if (mo.dead || mo.hidden) continue; const d = dist(mo.x, mo.y, G.x, G.y); if (d < 1.45 + mo.r && d < bd) { bd = d; best = mo; } } return best;
}
function findRangedTarget(prefer, range) {
  if (prefer && !prefer.dead && dist(prefer.x, prefer.y, G.x, G.y) <= range && hasLOS(G.x, G.y, prefer.x, prefer.y)) return prefer;
  let best = null, bd = 1e9; for (const mo of G.monsters) { if (mo.dead || mo.hidden) continue; const d = dist(mo.x, mo.y, G.x, G.y); if (d <= range && d < bd && (mo.aware || d < 7) && hasLOS(G.x, G.y, mo.x, mo.y)) { bd = d; best = mo; } } return best;
}
function partyAttack(onlyMember) {
  let acted = false;
  for (const m of G.party) {
    if (onlyMember && m !== onlyMember) continue;
    if (!alive(m) || m.rec > 0) continue;
    const ranged = isRanged(m);
    const tgt = ranged ? findRangedTarget(G.target, 9) : findMeleeTarget(G.target);
    if (!tgt) continue;
    m.rec = recoveryTime(m); m.bounce = 1; acted = true; tbCost(1.2);
    if (ranged) {
      const n = (m.skills.Bow || 0) >= 8 ? 2 : 1;
      for (let i = 0; i < n; i++) fireProjectile(G.x, G.y, tgt, 'arrow', { member: m, dmg: damageRoll(m), elem: 'phys', ench: weaponElem(m), hitChance: hitChanceParty(m, tgt), spread: i * 0.3 });
      Snd.play('bow');
    } else {
      const roll_ = Math.random();
      if (roll_ < hitChanceParty(m, tgt)) {
        let dmg = damageRoll(m); const crit = Math.random() < 0.05 + statBonus(effStat(m, 'lk')) * 0.01; if (crit) dmg *= 2;
        hurtMonster(tgt, dmg, 'phys', m); const we = weaponElem(m); if (we && !tgt.dead) hurtMonster(tgt, we.dmg, we.elem, m, true);
        if (weaponOf(m) && weaponOf(m).skill === 'Mace' && (m.skills.Mace || 0) >= 4 && Math.random() < 0.2 && !tgt.boss) { tgt.stun = Math.max(tgt.stun, 2); fxText(tgt.x, tgt.y + 0.3, 'stunned', '#ffe060'); }
        Snd.play(crit ? 'crit' : 'hit');
      } else { fxText(tgt.x, tgt.y, 'miss', '#aaa'); Snd.play('miss'); }
      fxAt(tgt.x, tgt.y, 'spark', '#fff0c0', { life: 0.25, dur: 0.25 });
    }
  }
  return acted;
}
function fireProjectile(x, y, tgt, proj, o) {
  const a = Math.atan2(tgt.y - y, tgt.x - x) + (o.spread || 0) * (Math.random() - 0.5);
  const spd = proj === 'arrow' ? 11 : proj === 'rock' ? 8 : 7;
  G.projs.push(Object.assign({ kind: 'proj', x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, ang: a, proj, tgt, life: 2.5, src: o.member ? 'party' : 'monster' }, o));
}
// ---- spells ----
function spellPower(m, sp) { return m.skills[sp.school] || 0; }
function canCast(m, id) { const sp = SPELLS[id]; if (!sp) return 'unknown spell'; if (!alive(m)) return m.name + ' cannot act.'; if (!m.spells.includes(id)) return 'not known'; if (m.sp < sp.sp) return 'not enough spell points'; if (m.rec > 0) return 'recovering'; return null; }
function castSpell(m, id) {
  const err = canCast(m, id); if (err) { log(err === 'recovering' ? m.name + ' is still recovering.' : cap(err) + '.'); return false; }
  const sp = SPELLS[id], pw = spellPower(m, sp), stat = CLASSES[m.cls].spStat ? statBonus(effStat(m, CLASSES[m.cls].spStat)) : 0, wandPow = (m.equip.weapon && ITEMS[m.equip.weapon.id].spellPower) || 0;
  const dmgOf = () => Math.max(1, roll(sp.dmg[0], sp.dmg[1], sp.dmg[2]) + (sp.perSkill || 0) * pw + Math.floor(stat / 2) + wandPow);
  let ok = true;
  switch (sp.kind) {
    case 'bolt': { const t = findRangedTarget(G.target, sp.range); if (!t) { log('No target in range.'); return false; } fireProjectile(G.x, G.y, t, { fire: 'fire', cold: 'ice', elec: 'spark', poison: 'poison', spirit: 'spirit', mind: 'mind', phys: 'phys' }[sp.elem] || 'spark', { member: m, dmg: dmgOf(), elem: sp.elem, hitChance: 0.97, spell: sp, chain: sp.chain, stunT: sp.stunT ? sp.stunT + pw * 0.5 : 0, slow: sp.slow }); break; }
    case 'aoe': { const t = findRangedTarget(G.target, sp.range); if (!t) { log('No target in range.'); return false; } fireProjectile(G.x, G.y, t, sp.elem === 'fire' ? 'fire' : 'phys', { member: m, dmg: dmgOf(), elem: sp.elem, hitChance: 1, spell: sp, aoe: sp.radius }); break; }
    case 'around': { let n = 0; for (const mo of G.monsters) { if (mo.dead || dist(mo.x, mo.y, G.x, G.y) > sp.radius) continue; n++; if (sp.dmg) hurtMonster(mo, dmgOf(), sp.elem, m); if (sp.poison) mo.poison = 10; if (sp.slowT) mo.slow = sp.slowT + pw * 2; if (sp.fearT && !mo.boss) mo.fear = sp.fearT + pw; } fxAt(G.x, G.y, 'burst', SCHOOL_COLOR[sp.school], { r: sp.radius, life: 0.6, dur: 0.6 }); if (!n) log('Nothing within reach.'); break; }
    case 'multi': { const n = 2 + Math.floor(pw / 2); const ts = G.monsters.filter(mo => !mo.dead && !mo.hidden && dist(mo.x, mo.y, G.x, G.y) <= sp.range && hasLOS(G.x, G.y, mo.x, mo.y)).sort((a, b) => dist(a.x, a.y, G.x, G.y) - dist(b.x, b.y, G.x, G.y)); if (!ts.length) { log('No target in range.'); return false; } for (let i = 0; i < n; i++) { const t = ts[i % ts.length]; fireProjectile(G.x, G.y, t, 'spark', { member: m, dmg: dmgOf(), elem: 'elec', hitChance: 0.9, spread: 0.5 }); } break; }
    case 'party': {
      if (sp.buff) { addBuff(sp.buff, 1 + Math.floor(pw / 3), pw); log(sp.name + ' surrounds the party.'); }
      else if (id === 'torch_light') { addBuff('torch', 1 + pw * 0.5, pw); log('A warm light surrounds the party.'); }
      else if (id === 'wizard_eye') { addBuff('eye', 1 + pw * 0.5, pw); log('You sense every creature nearby.'); }
      else if (id === 'raise_dead') { if (pw < 4) { log('Expert Spirit magic is needed.'); return false; } const dead = G.party.filter(p => p.cond.dead); if (!dead.length) { log('No one here is dead.'); return false; } for (const p of dead) { p.cond = {}; p.hp = 1; } log('The dead draw breath again.'); }
      for (const p of memberScreenPositions()) fxAt(p.x, p.y, 'heal', SCHOOL_COLOR[sp.school]);
      break;
    }
    case 'heal': { const v = G.party.filter(p => !p.cond.dead && !p.cond.unconscious).sort((a, b) => (a.hp / maxHp(a)) - (b.hp / maxHp(b)))[0]; const unc = G.party.find(p => p.cond.unconscious); const t = unc || v; if (!t) return false; const h = sp.heal + sp.perSkill * pw + stat; t.hp = Math.min(maxHp(t), t.hp + h); t.cond.unconscious = false; t.heal = 0.8; log(t.name + ' is healed for ' + h + '.'); fxAt(G.x, G.y, 'heal', '#80ff90'); break; }
    case 'healall': { const h = sp.heal + sp.perSkill * pw + stat; for (const p of G.party) if (!p.cond.dead) { p.hp = Math.min(maxHp(p), p.hp + h); p.cond.unconscious = false; p.heal = 0.8; } log('The party is healed for ' + h + '.'); fxAt(G.x, G.y, 'heal', '#80ff90'); break; }
    case 'cure': { for (const p of G.party) { p.cond.poison = false; p.cond.disease = false; } log('Poison is purged from the party.'); break; }
    case 'utility': { if (id === 'town_portal') { if (M.id !== 'over') { enterMap('over', getMap('over').townSquare.x, getMap('over').townSquare.y + 1); } else { G.x = M.townSquare.x; G.y = M.townSquare.y + 1; G.trail = G.trail.map(() => [G.x, G.y]); G.camSet = false; } log('The world folds. You stand in Harrowmere square.'); } break; }
  }
  if (!ok) return false;
  m.sp -= sp.sp; m.rec = Math.max(0.8, recoveryTime(m) * 0.9); m.bounce = 1; tbCost(1.5); Snd.play('cast'); return true;
}
function useItem(it, m) {
  const b = ITEMS[it.id];
  if (b.type === 'potion') { const t = m && alive(m) ? m : G.party.find(alive); if (!t) return false; if (b.use === 'heal') { t.hp = Math.min(maxHp(t), t.hp + b.power); t.heal = 0.8; log(t.name + ' drinks: +' + b.power + ' HP.'); } if (b.use === 'mana') { t.sp = Math.min(maxSp(t), t.sp + b.power); log(t.name + ' drinks: +' + b.power + ' SP.'); } if (b.use === 'cure') { t.cond.poison = false; t.cond.disease = false; log(t.name + ' is cured.'); } removeInv(it.id, 1); Snd.play('drink'); return true; }
  if (b.use === 'torch') { addBuff('torch', 1, 0); removeInv(it.id, 1); log('You light a torch.'); return true; }
  if (b.type === 'food') { G.food += it.qty || 1; removeInv(it.id, it.qty || 1); log('Rations stored.'); return true; }
  return false;
}

// ---- monster update ----
function updateMonsters(dt) {
  const cd = combatDt(dt);
  for (const mo of G.monsters) {
    mo.anim += dt;
    if (mo.dead) { mo.deadT -= dt; continue; }
    if (mo.hurt > 0) mo.hurt -= dt;
    const d = dist(mo.x, mo.y, G.x, G.y);
    if (cd <= 0) continue;
    if (mo.stun > 0) { mo.stun -= cd; continue; }
    if (mo.slow > 0) mo.slow -= cd; if (mo.fear > 0) mo.fear -= cd; if (mo.poison > 0) { mo.poison -= cd; mo.poisonT = (mo.poisonT || 0) + cd; if (mo.poisonT > 1) { mo.poisonT = 0; hurtMonster(mo, 3, 'poison'); } }
    if (mo.d.special === 'regen' && mo.hp < mo.maxHp) mo.hp = Math.min(mo.maxHp, mo.hp + 2 * cd);
    mo.rec -= cd;
    // awareness
    const aggro = mo.mimic ? 1.4 : (M.outdoor ? 7 : 6);
    if (!mo.aware) {
      if (d < aggro && hasLOS(mo.x, mo.y, G.x, G.y)) { mo.aware = true; mo.hidden = false; alertGroup(mo); if (mo.mimic) log('The chest is a Mimic!'); }
      else { mo.wanderT -= cd; if (mo.wanderT <= 0) { mo.wanderT = 2 + Math.random() * 4; const a = Math.random() * TAU; mo.wander = Math.random() < 0.5 && !mo.mimic ? { x: Math.cos(a), y: Math.sin(a), t: 0.8 + Math.random() } : null; } if (mo.wander) { mo.wander.t -= cd; if (mo.wander.t <= 0) mo.wander = null; else if (dist(mo.x, mo.y, mo.hx, mo.hy) < 2.5) monsterMove(mo, mo.wander.x, mo.wander.y, cd, 0.35); } }
      continue;
    }
    if (d > 22 && !M.outdoor || d > 30) { mo.aware = false; continue; }
    if (M.town && G.x >= M.town.x0 && G.x <= M.town.x1 + 1 && G.y >= M.town.y0 && G.y <= M.town.y1 + 1 && !(mo.x >= M.town.x0 && mo.x <= M.town.x1 + 1 && mo.y >= M.town.y0 && mo.y <= M.town.y1 + 1)) { mo.aware = false; continue; } // the town walls are a sanctuary
    const spdMul = (mo.slow > 0 ? 0.5 : 1) * (mo.fear > 0 ? 1.1 : 1);
    const ranged = mo.d.ranged, spell = mo.d.spell && MONSTER_SPELLS[mo.d.spell];
    const dx = (G.x - mo.x) / (d || 1), dy = (G.y - mo.y) / (d || 1);
    if (mo.fear > 0) { monsterMove(mo, -dx, -dy, cd, spdMul); continue; }
    // specials
    if (mo.d.special === 'blink') { mo.blinkT -= cd; if (mo.blinkT <= 0 && d > 3) { blink(mo); mo.blinkT = 6 + Math.random() * 4; } }
    if (mo.d.special && mo.d.special.startsWith('summon:')) { mo.summonT -= cd; if (mo.summonT <= 0 && d < 9) { summon(mo, mo.d.special.split(':')[1]); mo.summonT = mo.d.summonEvery || 14; } }
    const meleeRange = PR + mo.r + 0.35;
    const los = hasLOS(mo.x, mo.y, G.x, G.y);
    if (spell && los && d <= spell.range && d > 1.2) {
      if (mo.rec <= 0) { monsterCast(mo, spell); mo.rec = 2.2 + Math.random(); }
      if (d < 3) monsterMove(mo, -dx, -dy, cd, spdMul * 0.6); else if (d > spell.range - 1) monsterMove(mo, dx, dy, cd, spdMul);
    } else if (ranged && los && d <= ranged.range && d > 1.3) {
      if (mo.rec <= 0) { fireProjectile(mo.x, mo.y, { x: G.x, y: G.y }, ranged.type, { dmg: roll(mo.d.dmg[0], mo.d.dmg[1], mo.d.dmg[2]), elem: 'phys', mon: mo }); mo.rec = 1.6 + Math.random() * 0.6; Snd.play('bow'); }
      if (d < 2.5) monsterMove(mo, -dx, -dy, cd, spdMul * 0.6);
    } else if (d > meleeRange) {
      monsterMove(mo, dx, dy, cd, spdMul);
    } else if (mo.rec <= 0) {
      monsterMelee(mo); mo.rec = clamp(1.4 - mo.d.spd * 0.1, 0.8, 1.6) + Math.random() * 0.3;
    }
    mo.flip = G.x < mo.x;
    for (const o of G.monsters) if (o !== mo && !o.dead) pushApart(mo, o, mo.r + o.r, 0.5);
    unstick(mo, mo.r);
  }
  // remove faded corpses, collect drops
  G.monsters = G.monsters.filter(mo => !mo.dead || mo.deadT > 0);
  for (let i = G.drops.length - 1; i >= 0; i--) { const dr = G.drops[i]; dr.t += dt; if (dist(dr.x, dr.y, G.x, G.y) < 0.9) { if (dr.gold) { G.gold += dr.gold; } for (const it of dr.items) addInv(it); log('Picked up ' + [dr.gold ? dr.gold + ' gold' : null].concat(dr.items.map(itemName)).filter(Boolean).join(', ') + '.'); G.drops.splice(i, 1); Snd.play('coin'); checkQuests(); } }
}
function monsterMove(mo, dx, dy, dt, mul = 1) {
  const spd = mo.d.spd * mul; const ox = mo.x, oy = mo.y;
  mo.blocked = false; moveCircle(mo, dx * spd * dt, dy * spd * dt, mo.r);
  // slide around obstacles
  if (dist(mo.x, mo.y, ox, oy) < spd * dt * 0.3) { mo.stuck = (mo.stuck || 0) + dt; if (mo.stuck > 0.3) { mo.side = mo.side || (Math.random() < 0.5 ? 1 : -1); moveCircle(mo, -dy * mo.side * spd * dt, dx * mo.side * spd * dt, mo.r); if (mo.stuck > 1.5) { mo.stuck = 0; mo.side = -mo.side; } } } else mo.stuck = 0;
  if (mo.d.fly && mGet(M, Math.floor(mo.x), Math.floor(mo.y)) === TR.WATER) { /* flying creatures ignore water: allowed by moveCircle? no; fine */ }
}
function monsterMelee(mo) {
  const t = pickTargetMember(); if (!t) return;
  mo.lunge = 0.25;
  if (Math.random() < hitChanceMonster(mo, t)) {
    let dmg = roll(mo.d.dmg[0], mo.d.dmg[1], mo.d.dmg[2]);
    damageMember(t, dmg, 'phys', mo); Snd.play('hurt');
    if (mo.d.special === 'poison' && Math.random() < 0.35 && !t.cond.poison) { t.cond.poison = true; log(t.name + ' is poisoned!'); }
    if (mo.d.special === 'chill') { G.chill = 4; }
    fxText(G.x, G.y - 0.2, '-' + dmg + ' ' + t.name, '#ff6a50');
  } else { fxText(G.x, G.y - 0.2, 'miss', '#aaa'); }
}
function monsterCast(mo, spell) {
  if (spell.heal) { const ally = G.monsters.filter(o => !o.dead && o !== mo && o.hp < o.maxHp && dist(o.x, o.y, mo.x, mo.y) < spell.range).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; const t = ally || (mo.hp < mo.maxHp ? mo : null); if (t) { t.hp = Math.min(t.maxHp, t.hp + spell.heal); fxAt(t.x, t.y, 'heal', '#80ff90'); } return; }
  if (spell.fear) { if (!buffOn('mindshield')) { G.fearT = spell.fear; log(mo.name + ' sings a song of dread! The party cannot attack.'); } return; }
  fireProjectile(mo.x, mo.y, { x: G.x, y: G.y }, spell.proj, { dmg: roll(spell.dmg[0], spell.dmg[1], spell.dmg[2]), elem: spell.elem, mon: mo, aoe: spell.aoe, slow: spell.slow, poison: spell.poison });
  Snd.play('cast');
}
function blink(mo) { for (let i = 0; i < 10; i++) { const a = Math.random() * TAU, r = 1.5 + Math.random() * 1.5, x = G.x + Math.cos(a) * r, y = G.y + Math.sin(a) * r; if (!blockedAt(x, y)) { fxAt(mo.x, mo.y, 'spark', '#c080ff'); mo.x = x; mo.y = y; fxAt(x, y, 'spark', '#c080ff'); return; } } }
function summon(mo, kind) { const n = G.monsters.filter(o => o.summoned && !o.dead).length; if (n >= (mo.d.summonMax || 3)) return; for (let i = 0; i < (mo.d.summonCount || 2); i++) { const a = Math.random() * TAU, x = mo.x + Math.cos(a) * 1.5, y = mo.y + Math.sin(a) * 1.5; if (blockedAt(x, y)) continue; const s = spawnMonster({ kind, x, y }, -1); s.aware = true; s.summoned = true; s.id = -1; G.monsters.push(s); fxAt(x, y, 'spark', '#80ff80'); } log(mo.name + ' calls for aid!'); }
// ---- projectiles ----
function updateProjectiles(dt) {
  const cd = combatDt(dt); if (cd <= 0) return;
  const keep = [];
  for (const p of G.projs) {
    p.life -= cd;
    if (p.src === 'party' && p.tgt && !p.tgt.dead) { const a = Math.atan2(p.tgt.y - p.y, p.tgt.x - p.x), cur = Math.atan2(p.vy, p.vx); let da = a - cur; da = Math.atan2(Math.sin(da), Math.cos(da)); const na = cur + clamp(da, -4 * cd, 4 * cd); const s = Math.hypot(p.vx, p.vy); p.vx = Math.cos(na) * s; p.vy = Math.sin(na) * s; p.ang = na; }
    const nx = p.x + p.vx * cd, ny = p.y + p.vy * cd;
    const tt = mGet(M, Math.floor(nx), Math.floor(ny));
    if (tt === TR.WALL || tt === TR.VOID || tt === TR.ROOF || tt === TR.TREE || p.life <= 0) { if (p.aoe) explode(p); continue; }
    p.x = nx; p.y = ny;
    let hit = false;
    if (p.src === 'party') {
      for (const mo of G.monsters) { if (mo.dead || mo.hidden) continue; if (dist(p.x, p.y, mo.x, mo.y) < mo.r + 0.3) { hit = true; if (p.aoe) { explode(p, mo); break; } if (Math.random() < (p.hitChance || 0.9)) { hurtMonster(mo, p.dmg, p.elem, p.member); if (p.ench && !mo.dead) hurtMonster(mo, p.ench.dmg, p.ench.elem, p.member, true); if (p.stunT && !mo.boss) mo.stun = Math.max(mo.stun, p.stunT); if (p.slow) mo.slow = Math.max(mo.slow, 5); if (p.chain) { const o = G.monsters.find(o => o !== mo && !o.dead && dist(o.x, o.y, mo.x, mo.y) < 4); if (o) { hurtMonster(o, Math.floor(p.dmg / 2), p.elem, p.member); fxAt(o.x, o.y, 'spark', '#ffe060'); } } } else fxText(mo.x, mo.y, 'miss', '#aaa'); fxAt(p.x, p.y, 'spark', '#fff0c0', { life: 0.25, dur: 0.25 }); break; } }
    } else {
      if (dist(p.x, p.y, G.x, G.y) < PR + 0.3) { hit = true; const t = pickTargetMember(); if (t) { if (p.aoe) { for (const m of G.party) if (alive(m)) damageMember(m, p.dmg * 0.7, p.elem); log(p.mon.name + '\'s ' + p.proj + ' blast hits the party!'); } else if (Math.random() < hitChanceMonster(p.mon, t) + 0.1) { damageMember(t, p.dmg, p.elem); fxText(G.x, G.y - 0.2, '-' + p.dmg + ' ' + t.name, '#ff6a50'); if (p.poison && Math.random() < 0.4) { t.cond.poison = true; log(t.name + ' is poisoned!'); } if (p.slow) G.chill = 3; } else fxText(G.x, G.y - 0.2, 'miss', '#aaa'); } Snd.play('hurt'); fxAt(p.x, p.y, 'spark', '#ffb080', { life: 0.25, dur: 0.25 }); }
    }
    if (!hit) keep.push(p);
  }
  G.projs = keep;
}
function explode(p, except) { fxAt(p.x, p.y, 'burst', '#ff9040', { r: p.aoe, life: 0.5, dur: 0.5 }); fxAt(p.x, p.y, 'glow', '#ff8030', { r: p.aoe, life: 0.4, dur: 0.4 }); for (const mo of G.monsters) { if (mo.dead) continue; const d = dist(mo.x, mo.y, p.x, p.y); if (d <= p.aoe + mo.r) hurtMonster(mo, mo === except ? p.dmg : Math.floor(p.dmg * 0.75), p.elem, p.member); } Snd.play('explode'); }
function updateFx(dt) { for (const f of G.fx) f.life -= dt; G.fx = G.fx.filter(f => f.life > 0); }
function updatePartyTimers(dt) {
  const cd = combatDt(dt);
  for (const m of G.party) { if (m.rec > 0) m.rec -= cd; if (m.hurt > 0) m.hurt -= dt; if (m.bounce > 0) m.bounce -= dt * 4; if (m.heal > 0) m.heal -= dt; if (m.dmgPop) { m.dmgPop.t -= dt; if (m.dmgPop.t <= 0) m.dmgPop = null; } }
  if (G.fearT > 0) G.fearT -= dt;
  for (const mo of G.monsters) if (mo.lunge > 0) mo.lunge -= dt;
}

// ---- 70_ui.js ----
// ===================== UI: HUD and widgets =====================
const U = { cvs: null, ctx: null, W: 0, H: 0, dpr: 1, ins: { l: 0, r: 0, t: 0, b: 0 }, barTop: 0, scroll: {} };
const SERIF = 'Georgia, "Times New Roman", serif';
const C = { gold: '#d4a94c', gold2: '#8a6a2a', stone: '#221c18', stone2: '#3a302a', parch: '#e8d8b0', parch2: '#c9b588', ink: '#2a1c10', text: '#ecdfc3', dim: '#9a8c74', red: '#c43a2e', blue: '#3b6fc9', green: '#4ea64a', hl: 'rgba(212,169,76,0.25)' };
function initUI(cvs) { U.cvs = cvs; U.ctx = cvs.getContext('2d'); }
function resizeUI(w, h, dpr, ins) { U.W = w; U.H = h; U.dpr = dpr; U.ins = ins; U.cvs.width = Math.round(w * dpr); U.cvs.height = Math.round(h * dpr); U.cvs.style.width = w + 'px'; U.cvs.style.height = h + 'px'; U.barTop = h - 70 - ins.b; }
function serif(ctx, s, x, y, size, color, align = 'center', spacing = 0) { ctx.font = 'bold ' + size + 'px ' + SERIF; ctx.textBaseline = 'middle'; ctx.fillStyle = color; if (!spacing) { ctx.textAlign = align; ctx.fillText(s, x, y); return; } let w = 0; const ws = [...s].map(ch => { const cw = ctx.measureText(ch).width + spacing; w += cw; return cw; }); let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; ctx.textAlign = 'left'; [...s].forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i]; }); }
function panel(ctx, x, y, w, h, style = 'stone') {
  if (style === 'parch') { ctx.fillStyle = C.parch; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.gold2; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); ctx.strokeStyle = 'rgba(138,106,42,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9); return; }
  ctx.fillStyle = style === 'dark' ? 'rgba(10,8,8,0.88)' : C.stone; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  ctx.fillStyle = C.gold; for (const [cx, cy] of [[x + 3, y + 3], [x + w - 6, y + 3], [x + 3, y + h - 6], [x + w - 6, y + h - 6]]) ctx.fillRect(cx, cy, 3, 3);
}
function bar(ctx, x, y, w, h, frac, color, back = '#1a1210') { ctx.fillStyle = back; ctx.fillRect(x, y, w, h); ctx.fillStyle = color; ctx.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), h); ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
function vbar(ctx, x, y, w, h, frac, color) { ctx.fillStyle = '#120e0c'; ctx.fillRect(x, y, w, h); const hh = Math.round(h * clamp(frac, 0, 1)); ctx.fillStyle = color; ctx.fillRect(x, y + h - hh, w, hh); ctx.strokeStyle = '#000'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
function btn(ctx, id, x, y, w, h, label, o = {}) {
  const on = !!o.on, dis = !!o.disabled;
  ctx.fillStyle = dis ? 'rgba(40,34,30,0.8)' : on ? 'rgba(212,169,76,0.35)' : (o.parch ? '#d8c89c' : 'rgba(58,48,42,0.95)'); ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = dis ? '#5a4e44' : on ? C.gold : (o.parch ? C.gold2 : 'rgba(212,169,76,0.55)'); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const sc = o.scale || 2, col = dis ? '#6a6058' : (o.parch ? C.ink : C.text);
  if (o.icon) { const ic = iconCanvas(o.icon); ctx.drawImage(ic, x + 6, y + (h - 24) / 2, 24, 24); }
  text(ctx, label, o.align === 'left' || o.icon ? x + (o.icon ? 36 : 10) : x + w / 2, y + (h - 7 * sc) / 2 - (o.sub ? 5 : 0), sc, col, o.align === 'left' || o.icon ? 'left' : 'center', !o.parch);
  if (o.sub) text(ctx, o.sub, o.icon ? x + 36 : (o.align === 'left' ? x + 10 : x + w / 2), y + h / 2 + 4, 1, dis ? '#6a6058' : (o.parch ? '#5a4420' : C.dim), o.icon || o.align === 'left' ? 'left' : 'center', !o.parch);
  if (o.right) text(ctx, o.right, x + w - 8, y + (h - 7 * sc) / 2, sc, dis ? '#6a6058' : (o.rightColor || C.gold), 'right', !o.parch);
  if (!dis) I.buttons.push({ id, x, y, w, h });
}
function circle(ctx, id, cx, cy, r, label, o = {}) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = o.on ? 'rgba(120,90,30,0.85)' : (o.dim ? 'rgba(30,24,24,0.55)' : 'rgba(34,28,24,0.78)'); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = o.on ? C.gold : 'rgba(212,169,76,0.75)'; ctx.stroke();
  if (o.icon) { const ic = iconCanvas(o.icon); const s = r * 1.0; ctx.drawImage(ic, cx - s / 2, cy - s / 2 - (label ? 5 : 0), s, s); }
  if (label) text(ctx, label, cx, cy + r * 0.4, 1, C.text, 'center');
  if (o.badge !== undefined) text(ctx, o.badge, cx + r * 0.6, cy - r * 0.95, 2, '#ffe9a0', 'center');
  I.buttons.push({ id, x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
}
function condColor(m) { if (m.cond.dead) return '#ff4040'; if (m.cond.unconscious) return '#9a9a9a'; if (m.cond.poison) return '#60e040'; if (m.cond.weak) return '#d0a040'; return null; }
function condName(m) { if (m.cond.dead) return 'Dead'; if (m.cond.unconscious) return 'Unconscious'; if (m.cond.poison) return 'Poisoned'; if (m.cond.weak) return 'Weak'; return 'Good'; }

function drawHUD() {
  const ctx = U.ctx, W = U.W, H = U.H; ctx.setTransform(U.dpr, 0, 0, U.dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false; I.buttons.length = 0;
  if (G.mode === 'title') { drawTitle(ctx); return; }
  if (G.mode === 'create') { drawCreate(ctx); return; }
  drawWorldFx(ctx);
  drawPortraitBar(ctx);
  if (G.mode === 'play' && !G.screen) { drawTopBar(ctx); drawButtons(ctx); drawLog(ctx); drawPrompt(ctx); drawTargetBar(ctx); }
  if (BOT.on && (G.mode === 'play' || G.mode === 'dead')) drawBotCaption(ctx);
  drawNotice(ctx);
  if (G.screen) drawScreen(ctx);
  if (G.mode === 'dead') drawDead(ctx);
  if (G.mode === 'ending') drawEnding(ctx);
  if (G.fadeT > 0) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, G.fadeT) + ')'; ctx.fillRect(0, 0, W, H); }
}
function drawWorldFx(ctx) {
  // damage pops over party members
  for (const p of memberScreenPositions()) { const m = p.m; if (m.dmgPop) { const [sx, sy] = worldToScreen(p.x, p.y); text(ctx, '-' + m.dmgPop.n, sx, sy - 34 - (1 - m.dmgPop.t) * 14, 2, '#ff6a50', 'center'); } }
  if (G.turnBased) { ctx.strokeStyle = 'rgba(80,140,255,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, U.W - 4, U.barTop - 4); }
  if (G.fearT > 0) { ctx.fillStyle = 'rgba(120,40,160,' + Math.min(0.25, G.fearT * 0.1) + ')'; ctx.fillRect(0, 0, U.W, U.barTop); }
  if (G.chill > 0) { ctx.fillStyle = 'rgba(120,180,255,' + Math.min(0.18, G.chill * 0.08) + ')'; ctx.fillRect(0, 0, U.W, U.barTop); }
  const hurt = Math.max(...G.party.map(m => m.hurt || 0)); if (hurt > 0) { const g = ctx.createRadialGradient(U.W / 2, U.barTop / 2, U.barTop * 0.4, U.W / 2, U.barTop / 2, U.barTop); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, 'rgba(140,0,0,' + hurt * 0.8 + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, U.W, U.barTop); }
}
function drawBotCaption(ctx) {
  const y = U.ins.t + 50, w = Math.min(560, U.W - 240); const x = U.W / 2 - w / 2;
  ctx.fillStyle = 'rgba(8,6,6,0.72)'; ctx.fillRect(x, y, w, 16); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 2, 16);
  text(ctx, 'Claude: ' + (BOT.say || '...'), x + 8, y + 4, 1, '#ffe9a0');
  btn(ctx, 'stopbot', x + w + 6, y - 2, 46, 20, 'STOP', { scale: 1 });
}
function drawTopBar(ctx) {
  const x0 = U.ins.l + 8, y0 = U.ins.t + 6;
  panel(ctx, x0, y0, 232, 40, 'dark');
  text(ctx, M.name, x0 + 10, y0 + 7, 2, C.gold);
  text(ctx, 'Day ' + dayOf() + '  ' + ('0' + hourOf()).slice(-2) + ':' + ('0' + minuteOf()).slice(-2) + (isNight() ? '  night' : ''), x0 + 10, y0 + 25, 1, C.dim);
  const x1 = x0 + 240; panel(ctx, x1, y0, 170, 40, 'dark');
  ctx.drawImage(iconCanvas('gold'), x1 + 8, y0 + 8, 24, 24); text(ctx, fmtNum(G.gold), x1 + 36, y0 + 13, 2, '#ffe9a0');
  ctx.drawImage(iconCanvas('food'), x1 + 108, y0 + 8, 24, 24); text(ctx, G.food, x1 + 136, y0 + 13, 2, G.food > 0 ? C.text : '#ff8060');
  const bx = U.W - U.ins.r - 8;
  btn(ctx, 'menu', bx - 44, y0, 44, 40, '=', { scale: 3 });
  btn(ctx, 'turn', bx - 44 - 50, y0, 46, 40, 'TB', { on: G.turnBased, sub: G.turnBased ? 'turns' : 'real' });
  btn(ctx, 'map', bx - 44 - 50 - 50, y0, 46, 40, 'MAP', { scale: 1 });
  btn(ctx, 'quests', bx - 44 - 50 - 50 - 50, y0, 46, 40, 'LOG', { scale: 1 });
  if (buffOn('bless') || buffOn('shield') || buffOn('stoneskin') || buffOn('heroism') || buffOn('torch') || buffOn('eye') || buffOn('mindshield')) { const names = ['bless', 'shield', 'stoneskin', 'heroism', 'torch', 'eye', 'mindshield'].filter(buffOn); text(ctx, names.join(' '), x0 + 10, y0 + 44, 1, '#9ad0ff'); }
}
function drawPortraitBar(ctx) {
  const y0 = U.barTop, n = 4, slotW = Math.min(150, (U.W - U.ins.l - U.ins.r - 16) / 4), total = slotW * n, x0 = U.W / 2 - total / 2;
  ctx.fillStyle = C.stone; ctx.fillRect(0, y0, U.W, U.H - y0); ctx.fillStyle = C.gold; ctx.fillRect(0, y0, U.W, 2);
  G.party.forEach((m, i) => {
    const x = x0 + i * slotW + 4, y = y0 + 6, w = slotW - 8, h = 60, sel = i === G.sel;
    ctx.fillStyle = sel ? 'rgba(212,169,76,0.18)' : 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = sel ? C.gold : '#4a3e34'; ctx.lineWidth = sel ? 2 : 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const im = creatureCanvas(m.portrait, m.cond.dead || m.cond.unconscious ? 0 : Math.floor(G.playTime * 4 + i) % 4, 3); const bsc = 1 + (m.bounce > 0 ? m.bounce * 0.12 : 0), hx = m.hurt > 0 ? Math.sin(G.playTime * 60) * 2 : 0;
    ctx.save(); ctx.translate(x + 28 + hx, y + 30); ctx.scale(bsc, bsc); if (m.cond.dead) ctx.globalAlpha = 0.35; else if (m.cond.unconscious) ctx.globalAlpha = 0.6; ctx.drawImage(im, -24, -24, 48, 48); ctx.restore();
    if (m.hurt > 0) { ctx.fillStyle = 'rgba(255,40,30,' + m.hurt * 0.5 + ')'; ctx.fillRect(x + 2, y + 2, 52, h - 4); } if (m.heal > 0) { ctx.fillStyle = 'rgba(80,255,120,' + m.heal * 0.35 + ')'; ctx.fillRect(x + 2, y + 2, 52, h - 4); }
    if (m.cond.dead) text(ctx, 'DEAD', x + 28, y + 24, 1, '#ff5050', 'center'); else if (m.cond.unconscious) text(ctx, 'KO', x + 28, y + 24, 2, '#cfcfcf', 'center');
    vbar(ctx, x + 56, y + 4, 7, h - 8, m.hp / maxHp(m), m.hp < maxHp(m) * 0.3 ? '#ff5030' : C.red);
    if (maxSp(m) > 0) vbar(ctx, x + 65, y + 4, 7, h - 8, m.sp / maxSp(m), C.blue);
    const tx = x + 78, tw = w - 82;
    text(ctx, m.name, tx, y + 5, tw > 60 ? 2 : 1, C.text);
    text(ctx, 'L' + m.lvl + ' ' + m.cls, tx, y + 24, 1, C.dim);
    text(ctx, m.hp + '/' + maxHp(m), tx, y + 36, 1, '#f0b0a0'); if (maxSp(m) > 0) text(ctx, m.sp + '/' + maxSp(m), tx + 46, y + 36, 1, '#a0c0ff');
    const cc = condColor(m); if (cc) text(ctx, condName(m), tx, y + 48, 1, cc);
    else if (m.rec > 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(tx, y + 50, tw * clamp(m.rec / recoveryTime(m), 0, 1), 4); } else if (canTrain(m)) text(ctx, 'can train', tx, y + 48, 1, '#ffe060');
    I.buttons.push({ id: 'port' + i, x, y, w, h });
  });
}
function drawButtons(ctx) {
  const bx = U.W - U.ins.r - 62, by = U.barTop - 62;
  if (I.isTouch) {
    circle(ctx, 'attack', bx, by, 36, 'ATTACK', { icon: 'sword2', dim: G.fearT > 0 });
    circle(ctx, 'cast', bx - 84, by + 20, 27, 'CAST', { icon: 'wand' });
    circle(ctx, 'char', bx - 84, by - 48, 27, 'PARTY', { icon: 'helm' });
    circle(ctx, 'rest', bx - 4, by - 80, 24, 'REST', {});
    if (I.joy) { const j = I.joy; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(j.ox, j.oy, 44, 0, TAU); ctx.stroke(); const dx = j.x - j.ox, dy = j.y - j.oy, d = Math.hypot(dx, dy), mm = Math.min(1, d / 44); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(j.ox + (d ? dx / d * mm * 44 : 0), j.oy + (d ? dy / d * mm * 44 : 0), 16, 0, TAU); ctx.fill(); }
    else if (G.playTime < 20) { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(U.ins.l + 90, U.barTop - 90, 44, 0, TAU); ctx.stroke(); text(ctx, 'MOVE', U.ins.l + 90, U.barTop - 94, 1, 'rgba(255,255,255,0.4)', 'center'); }
  } else {
    text(ctx, 'WASD move   SPACE attack   F cast   E interact   C party   I pack   M map   Q quests   R rest   ENTER turn-based   1-4 select', U.W / 2, U.barTop - 12, 1, 'rgba(200,180,150,0.55)', 'center');
  }
}
function drawLog(ctx) { let y = U.barTop - (I.isTouch ? 26 : 26); const n = Math.min(4, G.log.length); for (let i = G.log.length - 1; i >= G.log.length - n; i--) { const l = G.log[i]; ctx.globalAlpha = clamp(1 - (l.t - 6) / 2, 0.15, 1); text(ctx, l.text, U.ins.l + 10, y, 1, C.text); y -= 11; } ctx.globalAlpha = 1; }
function drawPrompt(ctx) {
  const it = G.focus; const label = interactLabel(it); if (!label) return;
  const w = textW(label, 2) + 28, x = U.W / 2 - w / 2, y = U.barTop - 56;
  panel(ctx, x, y, w, 28, 'dark'); text(ctx, label, U.W / 2, y + 7, 2, '#ffe9a0', 'center'); if (!I.isTouch) text(ctx, '[E]', x + w - 2, y - 10, 1, C.dim, 'right');
  I.buttons.push({ id: 'interact', x, y, w, h: 28 });
}
function drawTargetBar(ctx) {
  const t = G.target; if (!t || t.dead) return;
  const w = 220, x = U.W / 2 - w / 2, y = U.ins.t + 52; text(ctx, t.name, U.W / 2, y, 2, C.text, 'center'); bar(ctx, x, y + 16, w, 6, t.hp / t.maxHp, t.boss ? '#ff4040' : C.red);
  text(ctx, Math.ceil(t.hp) + '/' + t.maxHp, x + w, y + 24, 1, C.dim, 'right');
}
function drawNotice(ctx) {
  const n = G.notice; if (!n) return; const k = n.t / n.dur, a = k > 0.85 ? (1 - k) / 0.15 : k < 0.2 ? k / 0.2 : 1; ctx.globalAlpha = clamp(a, 0, 1);
  const y = U.barTop * 0.3; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y - 30, U.W, n.sub ? 70 : 54);
  serif(ctx, n.text, U.W / 2, y, Math.min(32, U.W / 20), C.gold, 'center', 3); if (n.sub) text(ctx, n.sub, U.W / 2, y + 22, 1, C.text, 'center'); ctx.globalAlpha = 1;
}
function drawDead(ctx) {
  const a = clamp(G.deadT / 1.5, 0, 1); ctx.fillStyle = 'rgba(0,0,0,' + a * 0.8 + ')'; ctx.fillRect(0, 0, U.W, U.H); ctx.globalAlpha = a;
  serif(ctx, 'THE PARTY HAS FALLEN', U.W / 2, U.H * 0.38, Math.min(40, U.W / 16), '#9b1a16', 'center', 4);
  text(ctx, 'The priests of the Dawn will find you, for a price.', U.W / 2, U.H * 0.38 + 36, 1, C.text, 'center');
  if (G.deadT > 1.5) btn(ctx, 'wake', U.W / 2 - 110, U.H * 0.6, 220, 40, 'WAKE IN THE TEMPLE'); ctx.globalAlpha = 1;
}
function drawEnding(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, U.W, U.H);
  serif(ctx, 'THE MANDATE RESTORED', U.W / 2, U.H * 0.22, Math.min(40, U.W / 16), C.gold, 'center', 5);
  const lines = ['The Scepter returns to Harrow Hall, and the sea begins to bite again.', 'Lord Harrow names the four of you Wardens of the Reach.', 'The roads are still dangerous, the Warrens still breed goblins, and the old barrow still glows at night.', 'There is always more to do.', '', 'Days ' + dayOf() + '   Kills ' + G.kills + '   Gold ' + fmtNum(G.gold)];
  lines.forEach((l, i) => text(ctx, l, U.W / 2, U.H * 0.38 + i * 16, 1, i === 5 ? '#ffe9a0' : C.text, 'center'));
  btn(ctx, 'keepplaying', U.W / 2 - 110, U.H * 0.72, 220, 40, 'KEEP EXPLORING');
}

// ---- 75_screens.js ----
// ===================== UI: screens =====================
function openScreen(kind, data) { G.screen = Object.assign({ kind, scroll: 0, tab: 0 }, data || {}); I.modal = true; I.joy = null; Snd.play('ui'); }
function closeScreen() { G.screen = null; I.modal = false; }
function openText(title, body) { openScreen('text', { title, body }); }
function openBuilding(b) { Snd.play('door'); openScreen(b.kind === 'shop' ? 'shop' : b.kind, { b, tab: 0, said: 0 }); }
function openNpc(n) { if (n.guild) openScreen('guild', { guild: GUILDS[n.guild], n }); else openScreen('npc', { n, line: 0 }); }
function merchantSkill() { return Math.max(...G.party.map(m => m.skills.Merchant || 0)); }
function buyPrice(it) { return Math.ceil(itemValue(it) * Math.max(1.0, 1.5 - merchantSkill() * 0.05)); }
function sellPrice(it) { return Math.floor(itemValue(it) * Math.min(0.8, 0.3 + merchantSkill() * 0.05)); }
function layout() { const x = U.ins.l + 10, y = U.ins.t + 8, w = U.W - U.ins.l - U.ins.r - 20, h = U.barTop - U.ins.t - 16; return { x, y, w, h }; }
// scrollable list of rows; returns nothing, buttons register themselves. rows: [{id,label,sub,right,on,disabled,icon}]
function listBox(ctx, key, x, y, w, h, rows, rowH = 34, opts = {}) {
  const s = G.screen; const maxScroll = Math.max(0, rows.length * (rowH + 4) - h); s[key] = clamp((s[key] || 0) + I.wheel * (rowH + 4) + (I.swipeScroll || 0), 0, maxScroll); I.wheel = 0;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  rows.forEach((r, i) => { const ry = y + i * (rowH + 4) - s[key]; if (ry + rowH < y || ry > y + h) return; btn(ctx, r.id, x, ry, w - (maxScroll > 0 ? 10 : 0), rowH, r.label, r); });
  ctx.restore();
  if (maxScroll > 0) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + w - 6, y, 4, h); ctx.fillStyle = C.gold; ctx.fillRect(x + w - 6, y + (h - 20) * (s[key] / maxScroll), 4, 20); I.scrollZones = I.scrollZones || []; I.scrollZones.push({ x, y, w, h, key }); }
  // keep buttons inside the clip region hit-testable only when visible
  I.buttons = I.buttons.filter(b => !rows.some(r => r.id === b.id) || (b.y + b.h > y && b.y < y + h));
}
function memberTabs(ctx, x, y) { G.party.forEach((m, i) => { const sel = i === G.sel; ctx.fillStyle = sel ? C.hl : 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + i * 56, 52, 52); ctx.strokeStyle = sel ? C.gold : '#4a3e34'; ctx.strokeRect(x + 0.5, y + i * 56 + 0.5, 51, 51); const im = creatureCanvas(m.portrait, 0, 3); if (m.cond.dead) ctx.globalAlpha = 0.4; ctx.drawImage(im, x + 2, y + i * 56 + 2, 48, 48); ctx.globalAlpha = 1; I.buttons.push({ id: 'mtab' + i, x, y: y + i * 56, w: 52, h: 52 }); }); }
function drawScreen(ctx) {
  const s = G.screen; const L = layout();
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, U.W, U.barTop);
  const fn = { char: drawChar, spells: drawSpells, map: drawMap, quests: drawQuests, shop: drawShop, temple: drawTemple, inn: drawInn, trainer: drawTrainer, guild: drawGuild, hall: drawHall, house: drawHouse, npc: drawNpcDialog, text: drawTextScreen, rest: drawRest, menu: drawMenu }[s.kind];
  if (fn) fn(ctx, L, s);
  btn(ctx, 'close', L.x + L.w - 40, L.y + 6, 34, 28, 'X', { scale: 2 });
}
// ---- character ----
function drawChar(ctx, L, s) {
  panel(ctx, L.x, L.y, L.w, L.h); const m = G.party[G.sel]; memberTabs(ctx, L.x + 8, L.y + 44);
  const tabs = ['STATS', 'SKILLS', 'ITEMS', 'SPELLS']; tabs.forEach((t, i) => btn(ctx, 'tab' + i, L.x + 70 + i * 96, L.y + 8, 90, 28, t, { on: s.tab === i, scale: 1 }));
  const x = L.x + 70, y = L.y + 44, w = L.w - 80, h = L.h - 52;
  if (s.tab === 0) {
    text(ctx, m.name + '  -  Level ' + m.lvl + ' ' + m.cls, x, y, 2, C.gold); text(ctx, 'Experience ' + fmtNum(m.xp) + ' / ' + fmtNum(XP_FOR_LEVEL(m.lvl + 1)) + (canTrain(m) ? '  (ready to train)' : '') + '   Skill points ' + m.skillPts + '   Condition: ' + condName(m), x, y + 18, 1, C.dim);
    STATS.forEach((st, i) => { const base = m.stats[st], eff = effStat(m, st), b = statBonus(eff); text(ctx, STAT_NAMES[st], x, y + 38 + i * 15, 1, C.text); text(ctx, eff + (eff !== base ? ' (' + base + ')' : ''), x + 90, y + 38 + i * 15, 1, eff > base ? '#80ff90' : eff < base ? '#ff8080' : C.text); text(ctx, (b >= 0 ? '+' : '') + b, x + 130, y + 38 + i * 15, 1, C.dim); });
    const dx = x + 180; const w0 = weaponOf(m);
    const der = [['Hit Points', m.hp + ' / ' + maxHp(m)], ['Spell Points', maxSp(m) ? m.sp + ' / ' + maxSp(m) : '-'], ['Armor Class', armorClass(m)], ['Attack Bonus', '+' + attackBonus(m)], ['Damage', w0 ? w0.dmg[0] + 'd' + w0.dmg[1] + (w0.dmg[2] ? '+' + w0.dmg[2] : '') + ' ' + (statBonus(effStat(m, 'mt')) >= 0 ? '+' : '') + statBonus(effStat(m, 'mt')) : '1d3'], ['Recovery', recoveryTime(m).toFixed(2) + 's'], ['Resist Fire', enchSum(m, 'res') ? '' : '-'], ];
    der.slice(0, 6).forEach(([k, v], i) => { text(ctx, k, dx, y + 38 + i * 15, 1, C.text); text(ctx, v, dx + 100, y + 38 + i * 15, 1, '#ffe9a0'); });
    // equipment
    const ex = x + 330, slots = ['weapon', 'armor', 'shield', 'helm', 'boots', 'ring', 'amulet'];
    text(ctx, 'EQUIPMENT  (tap to remove)', ex, y, 1, C.gold);
    slots.forEach((sl, i) => { const it = m.equip[sl]; btn(ctx, 'uneq' + sl, ex, y + 14 + i * 26, Math.min(300, L.x + L.w - ex - 14), 24, it ? itemName(it) : '-', { align: 'left', scale: 1, icon: it ? ITEMS[it.id].icon : undefined, sub: it ? null : cap(sl), disabled: !it, right: it ? (ITEMS[it.id].acv ? 'AC+' + ITEMS[it.id].acv : '') : '' }); });
    if (s.hint) text(ctx, s.hint, x, L.y + L.h - 16, 1, C.dim);
  } else if (s.tab === 1) {
    text(ctx, m.name + '   Skill points: ' + m.skillPts + '   (cost to raise = new level)', x, y, 2, C.gold);
    const sk = Object.keys(m.skills); const rows = sk.map(k => { const lv = m.skills[k]; const cost = skillUpCost(lv); const needPromo = (lv === 3 && !(m.promo && m.promo[k] >= 4)) || (lv === 7 && !(m.promo && m.promo[k] >= 8)); return { id: 'sk_' + k, label: k + '  ' + lv + '  ' + RANK(lv), sub: SKILLS[k].desc.slice(0, 70), right: lv >= 10 ? 'max' : needPromo ? 'needs ' + (lv === 3 ? 'Expert' : 'Master') : '+ ' + cost + ' pts', rightColor: m.skillPts >= cost && !needPromo && lv < 10 ? '#80ff90' : C.dim, disabled: false, align: 'left', scale: 1 }; });
    listBox(ctx, 'scroll', x, y + 20, w, h - 24, rows, 36);
  } else if (s.tab === 2) {
    text(ctx, 'THE PACK   Gold ' + fmtNum(G.gold) + '   Food ' + G.food + '   (' + G.inv.length + ' items)', x, y, 2, C.gold);
    const rows = G.inv.map((it, i) => ({ id: 'inv' + i, label: itemName(it), sub: itemDesc(it).slice(0, 80), icon: ITEMS[it.id].icon, right: fmtNum(itemValue(it)) + 'g', on: s.selItem === i, scale: 1 }));
    listBox(ctx, 'scroll', x, y + 20, w - 190, h - 24, rows, 34);
    const ax = x + w - 180;
    if (s.selItem !== undefined && G.inv[s.selItem]) { const it = G.inv[s.selItem], b = ITEMS[it.id]; text(ctx, itemName(it), ax, y + 20, 1, C.gold); wrap(itemDesc(it), 1, 170).slice(0, 7).forEach((l, i) => text(ctx, l, ax, y + 34 + i * 11, 1, C.text)); let by = y + 120; if (SLOT_OF[b.type]) { btn(ctx, 'equip', ax, by, 170, 28, 'EQUIP ON ' + m.name.toUpperCase(), { scale: 1, disabled: !canUse(m, it) }); by += 32; } if (b.type === 'potion' || b.use || b.type === 'food') { btn(ctx, 'use', ax, by, 170, 28, b.type === 'potion' ? 'USE ON ' + m.name.toUpperCase() : 'USE', { scale: 1 }); by += 32; } btn(ctx, 'drop', ax, by, 170, 28, 'DROP', { scale: 1 }); } else text(ctx, 'Select an item.', ax, y + 20, 1, C.dim);
  } else if (s.tab === 3) drawSpellList(ctx, x, y, w, h, m);
}
function drawSpells(ctx, L, s) { panel(ctx, L.x, L.y, L.w, L.h); memberTabs(ctx, L.x + 8, L.y + 44); const m = G.party[G.sel]; text(ctx, 'SPELLBOOK', L.x + 70, L.y + 14, 2, C.gold); drawSpellList(ctx, L.x + 70, L.y + 44, L.w - 80, L.h - 52, m); }
function drawSpellList(ctx, x, y, w, h, m) {
  text(ctx, m.name + '   Spell points ' + m.sp + ' / ' + maxSp(m) + '   (tap a spell to cast it)', x, y, 2, C.gold);
  const ids = m.spells.slice().sort((a, b) => SCHOOLS.indexOf(SPELLS[a].school) - SCHOOLS.indexOf(SPELLS[b].school) || SPELLS[a].lvl - SPELLS[b].lvl);
  const rows = ids.map(id => { const sp = SPELLS[id]; const err = canCast(m, id); return { id: 'cast_' + id, label: sp.name, sub: sp.school + ' ' + sp.lvl + ' (skill ' + (m.skills[sp.school] || 0) + ')  ' + sp.desc.slice(0, 60), right: sp.sp + ' sp', rightColor: err ? '#ff8080' : '#80ff90', scale: 1, align: 'left' }; });
  if (!rows.length) text(ctx, 'No spells known. Guilds in the town square sell them.', x, y + 24, 1, C.dim);
  listBox(ctx, 'scroll', x, y + 20, w, h - 24, rows, 36);
}
// ---- map ----
function drawMap(ctx, L, s) {
  panel(ctx, L.x, L.y, L.w, L.h); text(ctx, M.name.toUpperCase() + '   -   ' + (M.outdoor ? 'Harrowmere Reach' : DUNGEONS[M.id].entrance), L.x + 14, L.y + 14, 2, C.gold);
  const mx = L.x + 14, my = L.y + 40, mw = L.w - 28, mh = L.h - 54; const sc = Math.min(mw / M.w, mh / M.h); const ox = mx + (mw - M.w * sc) / 2, oy = my + (mh - M.h * sc) / 2;
  ctx.fillStyle = '#0a0806'; ctx.fillRect(ox, oy, M.w * sc, M.h * sc);
  const col = { [TR.FLOOR]: '#6a5a48', [TR.WALL]: '#2e2620', [TR.GRASS]: '#3f7a2a', [TR.DIRT]: '#6a4e2e', [TR.ROAD]: '#b8a070', [TR.WATER]: '#2e62b8', [TR.DEEP]: '#1e3f8a', [TR.SAND]: '#d8c070', [TR.TREE]: '#1f4f1a', [TR.ROCK]: '#777', [TR.LAVA]: '#ff6a20', [TR.DOOR]: '#d8a040', [TR.ROOF]: '#8a4a2a' };
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) { if (!M.explored[y * M.w + x]) continue; ctx.fillStyle = col[M.t[y * M.w + x]] || '#000'; ctx.fillRect(ox + x * sc, oy + y * sc, Math.ceil(sc), Math.ceil(sc)); }
  for (const o of M.objects) { if (!M.explored[o.y * M.w + o.x]) continue; if (o.kind === 'entrance' || o.kind === 'stairs' || o.kind === 'door') { ctx.fillStyle = '#fff'; ctx.fillRect(ox + o.x * sc - 1, oy + o.y * sc - 1, sc + 2, sc + 2); if (sc > 4 && (o.kind === 'entrance')) text(ctx, o.name, ox + o.x * sc, oy + o.y * sc - 10, 1, '#fff', 'center'); } else if (o.kind === 'chest' && !o.opened) { ctx.fillStyle = '#ffd040'; ctx.fillRect(ox + o.x * sc, oy + o.y * sc, Math.max(2, sc), Math.max(2, sc)); } }
  if (buffOn('eye')) for (const mo of G.monsters) if (!mo.dead) { ctx.fillStyle = mo.boss ? '#ff3030' : '#ff7070'; ctx.fillRect(ox + mo.x * sc - 1, oy + mo.y * sc - 1, 3, 3); }
  for (const n of M.npcs) { ctx.fillStyle = '#60c0ff'; ctx.fillRect(ox + n.x * sc - 1, oy + n.y * sc - 1, 3, 3); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox + G.x * sc, oy + G.y * sc, 3, 0, TAU); ctx.fill(); ctx.strokeStyle = C.gold; ctx.stroke();
  if (M.outdoor) { for (const id in ENTRANCES) { const [ex, ey] = ENTRANCES[id]; if (M.explored[ey * M.w + ex]) text(ctx, DUNGEONS[id].name, ox + ex * sc, oy + ey * sc - 12, 1, '#ffe9a0', 'center'); } text(ctx, 'Harrowmere', ox + M.townSquare.x * sc, oy + M.townSquare.y * sc + 6, 1, '#ffe9a0', 'center'); }
}
// ---- quests ----
function drawQuests(ctx, L, s) {
  panel(ctx, L.x, L.y, L.w, L.h); text(ctx, 'QUEST LOG', L.x + 14, L.y + 14, 2, C.gold);
  const ids = Object.keys(G.quests); const rows = ids.map(id => ({ id: 'q_' + id, label: QUESTS[id].name, sub: G.quests[id] === 'done' ? 'completed' : 'from ' + QUESTS[id].giver + '   ' + questProgress(id), right: G.quests[id] === 'done' ? 'done' : questReady(id) ? 'turn in!' : '', rightColor: questReady(id) ? '#80ff90' : C.dim, on: s.selQ === id, scale: 1 }));
  if (!rows.length) text(ctx, 'No quests yet. Talk to the people of Harrowmere.', L.x + 14, L.y + 44, 1, C.dim);
  listBox(ctx, 'scroll', L.x + 14, L.y + 40, Math.min(420, L.w / 2), L.h - 54, rows, 36);
  const q = s.selQ && QUESTS[s.selQ]; if (q) { const tx = L.x + Math.min(420, L.w / 2) + 30; text(ctx, q.name, tx, L.y + 44, 2, C.gold); wrap(q.text, 1, L.w - (tx - L.x) - 20).forEach((l, i) => text(ctx, l, tx, L.y + 66 + i * 11, 1, C.text)); text(ctx, 'Reward: ' + (q.reward.gold || 0) + ' gold, ' + (q.reward.xp || 0) + ' xp' + (q.reward.item ? ', ' + ITEMS[q.reward.item].name : '') + (q.reward.skillPoints ? ', ' + q.reward.skillPoints + ' skill points' : ''), tx, L.y + 150, 1, '#ffe9a0'); }
}
// ---- buildings ----
function keeperHeader(ctx, L, b, name, spr, greeting) { panel(ctx, L.x, L.y, L.w, L.h); const im = creatureCanvas(spr, Math.floor(G.playTime * 3) % 4, 4); ctx.drawImage(im, L.x + 14, L.y + 12, 64, 64); text(ctx, name, L.x + 90, L.y + 14, 2, C.gold); text(ctx, b, L.x + 90, L.y + 32, 1, C.dim); if (greeting) wrap(greeting, 1, L.w - 300).slice(0, 3).forEach((l, i) => text(ctx, l, L.x + 90, L.y + 48 + i * 11, 1, C.text)); }
function questButton(ctx, qid, x, y, w) {
  const st = questState(qid), q = QUESTS[qid];
  if (st === 'none') btn(ctx, 'qaccept_' + qid, x, y, w, 32, 'QUEST: ' + q.name, { scale: 1, sub: 'hear what they ask' });
  else if (st === 'active') btn(ctx, 'qturn_' + qid, x, y, w, 32, (questReady(qid) ? 'TURN IN: ' : 'IN PROGRESS: ') + q.name, { scale: 1, sub: questProgress(qid), disabled: false });
  else btn(ctx, 'none', x, y, w, 32, 'COMPLETED: ' + q.name, { scale: 1, disabled: true });
}
function drawShop(ctx, L, s) {
  const b = s.b; keeperHeader(ctx, L, b.name, b.keeper, b.spr, s.tab === 0 ? 'Have a look. Best goods in the Reach, and I would know.' : 'Show me what you carry. I pay fair, for the Reach.');
  btn(ctx, 'tab0', L.x + L.w - 300, L.y + 10, 80, 28, 'BUY', { on: s.tab === 0, scale: 1 }); btn(ctx, 'tab1', L.x + L.w - 215, L.y + 10, 80, 28, 'SELL', { on: s.tab === 1, scale: 1 });
  text(ctx, 'Gold ' + fmtNum(G.gold), L.x + L.w - 300, L.y + 46, 2, '#ffe9a0');
  const y = L.y + 84, h = L.h - 92;
  if (s.tab === 0) { const rows = b.stock.map((id, i) => { const it = makeItem(id); const p = buyPrice(it); return { id: 'buy' + i, label: ITEMS[id].name, sub: itemDesc(it).slice(0, 70), icon: ITEMS[id].icon, right: p + 'g', rightColor: G.gold >= p ? '#80ff90' : '#ff8080', scale: 1 }; }); listBox(ctx, 'scroll', L.x + 14, y, L.w - 28, h, rows, 34); }
  else { const rows = G.inv.map((it, i) => ({ it, i })).filter(e => b.buys.includes(ITEMS[e.it.id].type) || b.buys.includes('quest') && ITEMS[e.it.id].type !== 'quest' && false).map(e => ({ id: 'sell' + e.i, label: itemName(e.it), sub: itemDesc(e.it).slice(0, 70), icon: ITEMS[e.it.id].icon, right: sellPrice(e.it) + 'g', rightColor: '#80ff90', scale: 1 })); if (!rows.length) text(ctx, 'Nothing this shop wants.', L.x + 14, y + 4, 1, C.dim); listBox(ctx, 'scroll', L.x + 14, y, L.w - 28, h, rows, 34); }
  if (b.quest) questButton(ctx, b.quest, L.x + L.w - 300, L.y + 50 + 14, 286);
}
function drawTemple(ctx, L, s) {
  const b = s.b; keeperHeader(ctx, L, b.name, b.keeper, b.spr, 'The Dawn welcomes you. We mend what the dark breaks, for a donation.');
  const lv = G.party.reduce((a, m) => a + m.lvl, 0); const x = L.x + 14, y = L.y + 90, w = Math.min(420, L.w / 2 - 20);
  btn(ctx, 'heal', x, y, w, 36, 'HEAL THE PARTY', { scale: 1, sub: 'full hit points, ' + (10 * lv) + ' gold', right: 10 * lv + 'g' });
  btn(ctx, 'cure', x, y + 42, w, 36, 'CURE AILMENTS', { scale: 1, sub: 'poison and weakness, ' + (15 * lv) + ' gold', right: 15 * lv + 'g' });
  const dead = G.party.filter(m => m.cond.dead); btn(ctx, 'raise', x, y + 84, w, 36, 'RAISE THE DEAD', { scale: 1, sub: dead.length ? dead.map(m => m.name).join(', ') + ', ' + 150 * lv + ' gold' : 'no one needs raising', right: 150 * lv + 'g', disabled: !dead.length });
  btn(ctx, 'donate', x, y + 126, w, 36, 'DONATE 100 GOLD', { scale: 1, sub: 'a blessing of the Dawn for a day', right: '100g' });
  questButton(ctx, b.quest, L.x + L.w - 300, L.y + 64, 286);
  text(ctx, 'Gold ' + fmtNum(G.gold), L.x + L.w - 300, L.y + 44, 2, '#ffe9a0');
}
function drawInn(ctx, L, s) {
  const b = s.b; keeperHeader(ctx, L, b.name, b.keeper, b.spr, 'Rooms upstairs, stew downstairs, and rumours for the price of a drink.');
  const x = L.x + 14, y = L.y + 90, w = Math.min(420, L.w / 2 - 20);
  btn(ctx, 'innrest', x, y, w, 36, 'REST THE NIGHT', { scale: 1, sub: 'full heal and cure, no food needed, 30 gold', right: '30g' });
  btn(ctx, 'buyfood', x, y + 42, w, 36, 'BUY 5 RATIONS', { scale: 1, sub: 'food for five rests', right: '25g' });
  btn(ctx, 'rumour', x, y + 84, w, 36, 'BUY A ROUND, HEAR A RUMOUR', { scale: 1, sub: '5 gold', right: '5g' });
  if (s.rumour) wrap(s.rumour, 1, w).forEach((l, i) => text(ctx, l, x, y + 128 + i * 11, 1, C.text));
  questButton(ctx, b.quest, L.x + L.w - 300, L.y + 64, 286);
  text(ctx, 'Gold ' + fmtNum(G.gold) + '   Food ' + G.food, L.x + L.w - 300, L.y + 44, 2, '#ffe9a0');
}
const RUMOURS = ['They say the goblin king wears a signet that opens nothing, and guards it like it opens everything.', 'The barrow trees move at night. Fire makes them stop moving.', 'Golems do not fear your mind or your poison. Bring a heavy hammer.', 'The Reliquary is cold enough to slow a man. Dress warm, drink hot.', 'Old Ysolde pays well for marsh herb. The lizardfolk do not care for pickers.', 'The Sanctum has two locks. Nobody who went to find the keys came back to say where they were.', 'Train before you fight. A level is worth more than a sword.', 'Merchants charge what they like unless you know the trade yourself.'];
function drawTrainer(ctx, L, s) {
  const b = s.b; keeperHeader(ctx, L, b.name, b.keeper, b.spr, 'Experience is nothing until it is beaten into you. Who trains today?');
  const m = G.party[G.sel]; memberTabs(ctx, L.x + 14, L.y + 84); const x = L.x + 80, y = L.y + 84, w = L.w - 100;
  const need = XP_FOR_LEVEL(m.lvl + 1), cost = TRAIN_COST(m.lvl + 1);
  btn(ctx, 'train', x, y, Math.min(420, w), 40, 'TRAIN ' + m.name.toUpperCase() + ' TO LEVEL ' + (m.lvl + 1), { scale: 1, sub: fmtNum(m.xp) + ' / ' + fmtNum(need) + ' experience, costs ' + cost + ' gold', right: cost + 'g', disabled: !canTrain(m) || G.gold < cost });
  text(ctx, 'SKILLS FOR SALE (' + m.cls + ')', x, y + 50, 1, C.gold);
  const learn = CLASSES[m.cls].learnable.filter(k => SKILLS[k].kind !== 'magic' && !m.skills[k]).map(k => ({ id: 'learn_' + k, label: 'Learn ' + k, sub: SKILLS[k].desc.slice(0, 60), right: '200g', rightColor: G.gold >= 200 ? '#80ff90' : '#ff8080', scale: 1 }));
  const promo = Object.keys(m.skills).filter(k => SKILLS[k].kind !== 'magic').map(k => { const lv = m.skills[k]; const have = (m.promo && m.promo[k]) || 0; const want = have < 4 ? 4 : have < 8 ? 8 : 0; if (!want) return null; const price = want === 4 ? 500 : 2500; return { id: 'promo_' + k + '_' + want, label: (want === 4 ? 'Expert ' : 'Master ') + k, sub: 'requires skill ' + (want - 1) + ' (now ' + lv + ')', right: price + 'g', rightColor: lv >= want - 1 && G.gold >= price ? '#80ff90' : '#ff8080', disabled: lv < want - 1, scale: 1 }; }).filter(Boolean);
  listBox(ctx, 'scroll', x, y + 64, Math.min(520, w), L.h - 160, learn.concat(promo), 32);
  text(ctx, 'Gold ' + fmtNum(G.gold), L.x + L.w - 200, L.y + 44, 2, '#ffe9a0');
}
function drawGuild(ctx, L, s) {
  const g = s.guild; keeperHeader(ctx, L, g.name, g.keeper, g.spr, 'Knowledge for gold. The ' + g.schools.join(', ') + ' schools are taught here.');
  const m = G.party[G.sel]; memberTabs(ctx, L.x + 14, L.y + 84); const x = L.x + 80, y = L.y + 84, w = L.w - 100;
  const rows = [];
  for (const sc of g.schools) { if (!CLASSES[m.cls].schools.includes(sc)) continue; if (!m.skills[sc]) rows.push({ id: 'learn_' + sc, label: 'Learn ' + sc + ' magic', sub: SKILLS[sc].desc, right: '300g', rightColor: G.gold >= 300 ? '#80ff90' : '#ff8080', scale: 1 }); else { const lv = m.skills[sc], have = (m.promo && m.promo[sc]) || 0, want = have < 4 ? 4 : have < 8 ? 8 : 0; if (want) rows.push({ id: 'promo_' + sc + '_' + want, label: (want === 4 ? 'Expert ' : 'Master ') + sc, sub: 'requires skill ' + (want - 1) + ' (now ' + lv + ')', right: (want === 4 ? 600 : 3000) + 'g', disabled: lv < want - 1, scale: 1 }); } }
  for (const id in SPELLS) { const sp = SPELLS[id]; if (!g.schools.includes(sp.school) || !CLASSES[m.cls].schools.includes(sp.school) || m.spells.includes(id)) continue; const need = sp.lvl === 1 ? 1 : sp.lvl === 2 ? 2 : sp.lvl === 3 ? 4 : 8; const ok = (m.skills[sp.school] || 0) >= need; rows.push({ id: 'spell_' + id, label: sp.name, sub: sp.school + ' ' + sp.lvl + ', needs skill ' + need + ': ' + sp.desc.slice(0, 50), right: sp.price + 'g', rightColor: ok && G.gold >= sp.price ? '#80ff90' : '#ff8080', disabled: !ok, scale: 1, icon: 'book' }); }
  if (!rows.length) text(ctx, m.name + ' can learn nothing more here.', x, y, 1, C.dim);
  listBox(ctx, 'scroll', x, y, Math.min(560, w), L.h - 96, rows, 32);
  text(ctx, 'Gold ' + fmtNum(G.gold), L.x + L.w - 200, L.y + 44, 2, '#ffe9a0');
}
function drawHall(ctx, L, s) {
  const b = s.b; const main = ['main1', 'main2', 'main3', 'main4'].find(q => questState(q) !== 'done') || 'main4';
  const greet = questState('main1') === 'none' ? 'Adventurers. Good. The Scepter of the Mandate was stolen from this hall, and the Reach rots without it. I have work, if you have the stomach.' : G.flags.won ? 'The Mandate is restored. Harrowmere owes you more than gold.' : 'Any news? The Reach grows darker by the day.';
  keeperHeader(ctx, L, b.name, b.keeper, b.spr, greet);
  const x = L.x + 14, y = L.y + 90, w = Math.min(520, L.w - 28);
  questButton(ctx, main, x, y, w);
  wrap('The Mandate of Heaven: a scepter kept in Harrow Hall since the founding, by which the lord holds the Reach. Four months ago it was taken, and the goblins came down from the Warrens the week after.', 1, w).forEach((l, i) => text(ctx, l, x, y + 44 + i * 11, 1, C.text));
}
function drawHouse(ctx, L, s) { const b = s.b; const lines = { widow: 'My husband went north with the carts in spring. The goblins sent back his boots.', scholar: 'Mind the stacks. Somewhere in them was my tome, before the thief in the frost-blue cloak.' }; keeperHeader(ctx, L, b.name, b.keeper, b.spr, lines[b.id]); questButton(ctx, b.quest, L.x + 14, L.y + 90, Math.min(520, L.w - 28)); }
function drawNpcDialog(ctx, L, s) { const n = s.n; keeperHeader(ctx, L, 'Harrowmere', n.name, n.spr, null); const line = n.lines[s.line % n.lines.length]; panel(ctx, L.x + 14, L.y + 84, L.w - 28, 70, 'parch'); wrap(line, 1, L.w - 60).forEach((l, i) => text(ctx, l, L.x + 24, L.y + 94 + i * 11, 1, C.ink, 'left', false)); btn(ctx, 'next', L.x + 14, L.y + 164, 160, 32, 'ASK MORE', { scale: 1 }); btn(ctx, 'close', L.x + 184, L.y + 164, 160, 32, 'FAREWELL', { scale: 1 }); }
function drawTextScreen(ctx, L, s) { panel(ctx, L.x, L.y, L.w, L.h, 'parch'); serif(ctx, s.title, L.x + L.w / 2, L.y + 26, 20, C.ink, 'center', 1); wrap(s.body, 1, L.w - 60).forEach((l, i) => text(ctx, l, L.x + 30, L.y + 50 + i * 12, 1, C.ink, 'left', false)); }
function drawRest(ctx, L, s) {
  const w = 360, h = 230, x = U.W / 2 - w / 2, y = U.barTop / 2 - h / 2; panel(ctx, x, y, w, h); text(ctx, 'MAKE CAMP', x + w / 2, y + 12, 2, C.gold, 'center');
  const warn = canRest(); text(ctx, warn || ('Food: ' + G.food + '   Time: day ' + dayOf() + ', ' + ('0' + hourOf()).slice(-2) + ':00'), x + w / 2, y + 36, 1, warn ? '#ff8080' : C.dim, 'center');
  btn(ctx, 'rest8', x + 20, y + 60, w - 40, 36, 'REST 8 HOURS', { scale: 1, sub: 'heals fully, uses one ration', disabled: !!warn });
  btn(ctx, 'wait1', x + 20, y + 102, w - 40, 36, 'WAIT 1 HOUR', { scale: 1, sub: 'let the time pass', disabled: !!warn });
  btn(ctx, 'close', x + 20, y + 144, w - 40, 36, 'CANCEL', { scale: 1 });
  text(ctx, 'Resting outside is risky. Inns are safer.', x + w / 2, y + 196, 1, C.dim, 'center');
}
function drawMenu(ctx, L, s) {
  const w = 320, h = 290, x = U.W / 2 - w / 2, y = U.barTop / 2 - h / 2; panel(ctx, x, y, w, h); serif(ctx, 'HARROWMERE', x + w / 2, y + 22, 18, C.gold, 'center', 2);
  const rows = [['resume', 'RESUME'], ['save', 'SAVE GAME'], ['load', 'LOAD GAME', !hasSave()], ['sound', Snd.muted ? 'SOUND: OFF' : 'SOUND: ON'], ['quit', 'QUIT TO TITLE']];
  rows.forEach(([id, label, dis], i) => btn(ctx, id, x + 20, y + 44 + i * 42, w - 40, 36, label, { scale: 1, disabled: dis }));
  text(ctx, 'Day ' + dayOf() + '  Kills ' + G.kills + '  Gold ' + fmtNum(G.gold), x + w / 2, y + h - 22, 1, C.dim, 'center');
  if (s.msg) text(ctx, s.msg, x + w / 2, y + h - 36, 1, '#80ff90', 'center');
}
// ---- title & party creation ----
function drawTitle(ctx) {
  const W = U.W, H = U.H; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  serif(ctx, 'HARROWMERE', W / 2, H * 0.26, Math.min(64, W / 10), C.gold, 'center', 8); ctx.fillStyle = 'rgba(212,169,76,0.5)'; ctx.fillRect(W / 2 - 170, H * 0.26 + 40, 340, 1);
  serif(ctx, 'a top-down tale of Might and Magic', W / 2, H * 0.26 + 58, 15, C.text, 'center', 1);
  const by = H * 0.52; btn(ctx, 'newgame', W / 2 - 110, by, 220, 40, 'NEW GAME', { scale: 2 }); if (hasSave()) btn(ctx, 'continue', W / 2 - 110, by + 48, 220, 40, 'CONTINUE', { scale: 2 });
  btn(ctx, 'watch', W / 2 - 110, by + (hasSave() ? 96 : 48), 220, 40, 'WATCH CLAUDE PLAY', { scale: 1, sub: 'a full walkthrough, hands off' });
  text(ctx, 'Dungeon tiles by RunninBlood. Creature sprites from the Basic, Premium and Supporter packs.', W / 2, H - U.ins.b - 28, 1, C.dim, 'center');
  text(ctx, I.isTouch ? 'Play in landscape. Add to your Home Screen for full screen.' : 'WASD to move, SPACE to attack, F to cast, C for the party, E to interact.', W / 2, H - U.ins.b - 16, 1, C.dim, 'center');
}
function drawCreate(ctx) {
  const W = U.W, H = U.H; ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
  serif(ctx, 'CREATE YOUR PARTY', W / 2, U.ins.t + 22, 20, C.gold, 'center', 3);
  const cls = Object.keys(CLASSES), cw = Math.min(210, (W - U.ins.l - U.ins.r - 40) / 4), x0 = W / 2 - cw * 2, y0 = U.ins.t + 44, ch = H - y0 - U.ins.b - 60;
  G.create.forEach((c, i) => {
    const x = x0 + i * cw + 4, w = cw - 8; panel(ctx, x, y0, w, ch, 'dark');
    const im = creatureCanvas(CLASSES[c.cls].sprite, Math.floor(G.playTime * 4 + i) % 4, 4); ctx.drawImage(im, x + w / 2 - 32, y0 + 10, 64, 64);
    btn(ctx, 'cls_prev' + i, x + 8, y0 + 82, 28, 26, '<', { scale: 1 }); btn(ctx, 'cls_next' + i, x + w - 36, y0 + 82, 28, 26, '>', { scale: 1 }); text(ctx, c.cls, x + w / 2, y0 + 90, 2, C.gold, 'center');
    btn(ctx, 'name' + i, x + 8, y0 + 114, w - 16, 26, c.name + (G.editing === i ? '_' : ''), { scale: 1, sub: I.isTouch ? 'tap for another name' : 'click to type a name' });
    wrap(CLASSES[c.cls].desc, 1, w - 16).forEach((l, k) => text(ctx, l, x + 8, y0 + 148 + k * 11, 1, C.text));
    const st = CLASSES[c.cls].stats; STATS.forEach((s, k) => { if (y0 + 196 + k * 11 > y0 + ch - 14) return; text(ctx, STAT_NAMES[s], x + 8, y0 + 196 + k * 11, 1, C.dim); text(ctx, st[s], x + w - 10, y0 + 196 + k * 11, 1, C.text, 'right'); });
  });
  btn(ctx, 'begin', W / 2 - 110, H - U.ins.b - 50, 220, 40, 'BEGIN', { scale: 2 }); btn(ctx, 'backtitle', W / 2 - 300, H - U.ins.b - 50, 150, 40, 'BACK', { scale: 1 }); btn(ctx, 'defparty', W / 2 + 150, H - U.ins.b - 50, 150, 40, 'CLASSIC PARTY', { scale: 1 });
}
// ---- screen input ----
function screenInput() {
  const s = G.screen; if (!s) return;
  if (I.take('menu') || I.take('close')) { if (s.kind === 'npc' && s.n) { } closeScreen(); return; }
  for (let i = 0; i < 4; i++) { if (I.take('mtab' + i) || I.take('sel' + (i + 1))) { G.sel = i; s.selItem = undefined; } if (I.take('port' + i)) G.sel = i; }
  if (I.take('nextchar')) G.sel = (G.sel + 1) % 4;
  for (let i = 0; i < 4; i++) if (I.take('tab' + i)) { s.tab = i; s.scroll = 0; s.selItem = undefined; }
  const m = G.party[G.sel];
  if (s.kind === 'char' || s.kind === 'spells') {
    for (const sl of ['weapon', 'armor', 'shield', 'helm', 'boots', 'ring', 'amulet']) if (I.take('uneq' + sl)) unequip(m, sl);
    for (const k of Object.keys(m.skills)) if (I.take('sk_' + k)) { if (raiseSkill(m, k)) Snd.play('buy'); }
    G.inv.forEach((it, i) => { if (I.take('inv' + i)) s.selItem = i; });
    if (I.take('equip') && G.inv[s.selItem]) { const it = G.inv[s.selItem]; if (canUse(m, it)) { G.inv.splice(s.selItem, 1); equipItem(m, it); s.selItem = undefined; Snd.play('buy'); } }
    if (I.take('use') && G.inv[s.selItem]) { useItem(G.inv[s.selItem], m); if (!G.inv[s.selItem]) s.selItem = undefined; }
    if (I.take('drop') && G.inv[s.selItem]) { G.inv.splice(s.selItem, 1); s.selItem = undefined; }
    for (const id of m.spells) if (I.take('cast_' + id)) { closeScreen(); castSpell(m, id); return; }
  }
  if (s.kind === 'quests') for (const id in G.quests) if (I.take('q_' + id)) s.selQ = id;
  if (s.kind === 'shop') {
    const b = s.b; b.stock.forEach((id, i) => { if (I.take('buy' + i)) { const it = makeItem(id); const p = buyPrice(it); if (G.gold >= p) { G.gold -= p; addInv(it); Snd.play('buy'); log('Bought ' + ITEMS[id].name + ' for ' + p + ' gold.'); } else log('Not enough gold.'); } });
    G.inv.forEach((it, i) => { if (I.take('sell' + i)) { const p = sellPrice(it); G.gold += p; G.inv.splice(i, 1); Snd.play('coin'); log('Sold ' + itemName(it) + ' for ' + p + ' gold.'); } });
  }
  if (s.kind === 'temple') {
    const lv = G.party.reduce((a, p) => a + p.lvl, 0);
    if (I.take('heal')) { if (G.gold >= 10 * lv) { G.gold -= 10 * lv; for (const p of G.party) if (!p.cond.dead) { p.hp = maxHp(p); p.cond.unconscious = false; } log('The party is healed.'); Snd.play('rest'); } else log('Not enough gold.'); }
    if (I.take('cure')) { if (G.gold >= 15 * lv) { G.gold -= 15 * lv; for (const p of G.party) { p.cond.poison = false; p.cond.weak = false; } log('Ailments cured.'); Snd.play('rest'); } else log('Not enough gold.'); }
    if (I.take('raise')) { if (G.gold >= 150 * lv) { G.gold -= 150 * lv; for (const p of G.party) if (p.cond.dead) { p.cond = {}; p.hp = maxHp(p); } log('The dead rise, whole again.'); Snd.play('level'); } else log('Not enough gold.'); }
    if (I.take('donate')) { if (G.gold >= 100) { G.gold -= 100; addBuff('bless', 24, 3); log('The Dawn blesses your party.'); Snd.play('quest'); } else log('Not enough gold.'); }
  }
  if (s.kind === 'inn') {
    if (I.take('innrest')) { if (G.gold >= 30) { G.gold -= 30; restParty(8, true); Snd.play('rest'); } else log('Not enough gold.'); }
    if (I.take('buyfood')) { if (G.gold >= 25) { G.gold -= 25; G.food += 5; Snd.play('buy'); log('Five rations bought.'); } else log('Not enough gold.'); }
    if (I.take('rumour')) { if (G.gold >= 5) { G.gold -= 5; s.rumour = pick(RUMOURS); Snd.play('coin'); } else log('Not enough gold.'); }
  }
  if (s.kind === 'trainer' || s.kind === 'guild') {
    if (I.take('train')) { if (train(m)) Snd.play('level'); }
    for (const k in SKILLS) { if (I.take('learn_' + k)) { const price = SKILLS[k].kind === 'magic' ? 300 : 200; if (G.gold >= price) { G.gold -= price; m.skills[k] = 1; Snd.play('buy'); log(m.name + ' learns ' + k + '.'); } else log('Not enough gold.'); } for (const want of [4, 8]) if (I.take('promo_' + k + '_' + want)) { const price = SKILLS[k].kind === 'magic' ? (want === 4 ? 600 : 3000) : (want === 4 ? 500 : 2500); if (G.gold >= price) { G.gold -= price; m.promo = m.promo || {}; m.promo[k] = want; Snd.play('level'); log(m.name + ' is now ' + (want === 4 ? 'Expert' : 'Master') + ' in ' + k + '.'); } else log('Not enough gold.'); } }
    for (const id in SPELLS) if (I.take('spell_' + id)) { const sp = SPELLS[id]; if (G.gold >= sp.price) { G.gold -= sp.price; m.spells.push(id); Snd.play('buy'); log(m.name + ' learns ' + sp.name + '.'); } else log('Not enough gold.'); }
  }
  if (s.kind === 'npc' && I.take('next')) s.line++;
  if (s.kind === 'rest') { if (I.take('rest8')) { restParty(8); closeScreen(); Snd.play('rest'); G.fadeT = 1; } if (I.take('wait1')) { G.time += 60; closeScreen(); } }
  if (s.kind === 'menu') { if (I.take('resume')) closeScreen(); if (I.take('save')) { s.msg = saveGame() ? 'Saved.' : 'Save failed.'; } if (I.take('load')) { if (loadGame()) closeScreen(); } if (I.take('sound')) { Snd.muted = !Snd.muted; if (Snd.master) Snd.master.gain.value = Snd.muted ? 0 : 0.45; if (Snd.muted) { Snd.stopMusic(); Snd.musicKind = null; } } if (I.take('quit')) { saveGame(); closeScreen(); G.mode = 'title'; } }
  for (const qid in QUESTS) { if (I.take('qaccept_' + qid)) { startQuest(qid); openText(QUESTS[qid].name, QUESTS[qid].giver + ': "' + QUESTS[qid].text + '"'); Snd.play('quest'); } if (I.take('qturn_' + qid)) { if (completeQuest(qid)) Snd.play('level'); else openText(QUESTS[qid].name, QUESTS[qid].giver + ': "' + QUESTS[qid].text + '"  (' + questProgress(qid) + ')'); } }
}

// ---- 80_input.js ----
// ===================== input =====================
const I = {
  keys: {}, mx: 0, my: 0, acts: {}, held: {}, buttons: [], touchBtn: new Map(), joy: null, isTouch: false, tapPos: null, pointer: null, clicked: null, wheel: 0,
  init(el) {
    const KM = { Space: 'attack', Enter: 'turn', KeyE: 'interact', KeyC: 'char', KeyI: 'inventory', KeyB: 'spells', KeyM: 'map', KeyQ: 'quests', KeyR: 'rest', Escape: 'menu', Digit1: 'sel1', Digit2: 'sel2', Digit3: 'sel3', Digit4: 'sel4', KeyF: 'cast', Tab: 'nextchar', KeyJ: 'journal' };
    window.addEventListener('keydown', e => { if (e.repeat) { e.preventDefault(); return; } this.keys[e.code] = true; const a = KM[e.code]; if (a) { this.press(a); e.preventDefault(); } if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault(); if (this.textTarget && e.key.length === 1) this.textTarget(e.key); if (this.textTarget && e.code === 'Backspace') this.textTarget('\b'); });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; const a = KM[e.code]; if (a) this.held[a] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.held = {}; });
    el.addEventListener('mousedown', e => { if (this.isTouch) return; this.pointer = { x: e.clientX, y: e.clientY }; const b = this.hit(e.clientX, e.clientY); if (b) { this.press(b.id); this.mouseBtn = b.id; return; } this.clicked = { x: e.clientX, y: e.clientY, right: e.button === 2 }; });
    el.addEventListener('mouseup', () => { if (this.mouseBtn) { this.held[this.mouseBtn] = false; this.mouseBtn = null; } });
    el.addEventListener('mousemove', e => { this.pointer = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('wheel', e => { this.wheel += Math.sign(e.deltaY); }, { passive: true });
    const ts = e => { this.isTouch = true; for (const t of e.changedTouches) { const b = this.hit(t.clientX, t.clientY); if (b) { this.touchBtn.set(t.identifier, b.id); this.press(b.id); continue; } if (!this.joy && t.clientX < window.innerWidth * 0.45 && !this.modal) { this.joy = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY }; continue; } this.tapStart = { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now() }; } if (e.cancelable) e.preventDefault(); };
    const tm = e => { for (const t of e.changedTouches) { if (this.joy && t.identifier === this.joy.id) { this.joy.x = t.clientX; this.joy.y = t.clientY; } if (this.tapStart && t.identifier === this.tapStart.id) { this.tapStart.mx = t.clientX; this.tapStart.my = t.clientY; } } if (e.cancelable) e.preventDefault(); };
    const te = e => { for (const t of e.changedTouches) { const bid = this.touchBtn.get(t.identifier); if (bid) { this.held[bid] = false; this.touchBtn.delete(t.identifier); continue; } if (this.joy && t.identifier === this.joy.id) { this.joy = null; continue; } if (this.tapStart && t.identifier === this.tapStart.id) { const d = Math.hypot(t.clientX - this.tapStart.x, t.clientY - this.tapStart.y); if (d < 14 && performance.now() - this.tapStart.t < 400) this.clicked = { x: t.clientX, y: t.clientY, touch: true }; else if (d >= 14) this.swipe = { dx: t.clientX - this.tapStart.x, dy: t.clientY - this.tapStart.y }; this.tapStart = null; } } if (e.cancelable) e.preventDefault(); };
    window.addEventListener('touchstart', ts, { passive: false }); window.addEventListener('touchmove', tm, { passive: false }); window.addEventListener('touchend', te, { passive: false }); window.addEventListener('touchcancel', te, { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
  },
  hit(x, y) { for (let i = this.buttons.length - 1; i >= 0; i--) { const b = this.buttons[i]; if (x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 4 && y <= b.y + b.h + 4) return b; } return null; },
  press(id) { this.acts[id] = (this.acts[id] || 0) + 1; this.held[id] = true; },
  take(id) { if (this.acts[id]) { this.acts[id]--; return true; } return false; },
  update() {
    let mx = 0, my = 0; const k = this.keys;
    if (k.KeyW || k.ArrowUp) my -= 1; if (k.KeyS || k.ArrowDown) my += 1; if (k.KeyA && false) mx -= 1; if (k.ArrowLeft) mx -= 1; if (k.ArrowRight || k.KeyD) mx += 1; if (k.KeyA) mx -= 1;
    if (this.joy) { const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy, d = Math.hypot(dx, dy), r = 44; if (d > 5) { const mm = Math.min(1, d / r); mx = dx / d * mm; my = dy / d * mm; } }
    const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
    this.mx = mx; this.my = my;
  },
  endFrame() { this.acts = {}; this.clicked = null; this.swipe = null; this.wheel = 0; },
};

// ---- 85_bot.js ----
// ===================== autoplay bot: "Watch Claude play" =====================
const BOSS_LV = { warrens: 3, barrow: 6, reliquary: 9, molten: 8, sanctum: 13 }; // party level the bot wants before it fights each boss
const BOT = {
  on: false, say: '', sayT: 0, goals: [], cur: null, path: null, pathT: 0, stuckT: 0, lastPos: null, mx: 0, my: 0, flow: null, waitT: 0, retry: {}, wipes: 0, flee: 0, eng: null, skip: {}, lastCamp: null, done: false, lastRestT: -1e9, log: [],
  start() { this.on = true; this.goals = []; this.cur = null; this.flow = null; this.done = false; this.plan(); this.talk('Four strangers in Harrowmere. First, the lord of the town.'); },
  stop() { this.on = false; this.mx = this.my = 0; this.flow = null; this.talk(''); },
  talk(t) { if (t && t !== this.say) { this.log.push(t); if (this.log.length > 50) this.log.shift(); } this.say = t; this.sayT = 0; },
  // ---------- high level plan ----------
  plan() {
    const g = this.goals;
    g.push({ k: 'town', first: true });
    g.push({ k: 'dungeon', id: 'warrens', need: 1 });
    g.push({ k: 'town' });
    g.push({ k: 'herbs' });
    g.push({ k: 'town' });
    g.push({ k: 'dungeon', id: 'barrow', need: 4 });
    g.push({ k: 'town' });
    g.push({ k: 'dungeon', id: 'reliquary', need: 7 });
    g.push({ k: 'town' });
    g.push({ k: 'dungeon', id: 'molten', need: 8 });
    g.push({ k: 'town' });
    g.push({ k: 'dungeon', id: 'sanctum', need: 11 });
    g.push({ k: 'town', last: true });
  },
  avgLevel() { return G.party.reduce((a, m) => a + m.lvl, 0) / G.party.length; },
  // ---------- pathfinding (A*, 4-way) ----------
  findPath(tx, ty) {
    const sx = Math.floor(G.x), sy = Math.floor(G.y); tx = Math.floor(tx); ty = Math.floor(ty);
    if (sx === tx && sy === ty) return [];
    const w = M.w, h = M.h, N = w * h; const gS = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open = [[Math.abs(tx - sx) + Math.abs(ty - sy), sy * w + sx]]; gS[sy * w + sx] = 0;
    const pop = () => { let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i; return open.splice(bi, 1)[0]; };
    let found = -1, iter = 0;
    while (open.length && iter++ < 60000) {
      const [f, i] = pop(); if (closed[i]) continue; closed[i] = 1; if (i === ty * w + tx) { found = i; break; }
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = ny * w + nx; if (closed[j]) continue; const t = M.t[j]; if (!PASSABLE.has(t) && j !== ty * w + tx) continue; const cost = gS[i] + (t === TR.ROAD ? 0.8 : 1) + (M.objects.some(o => o.x === nx && o.y === ny && (o.kind === 'chest' || o.kind === 'sign' || o.kind === 'well' || o.kind === 'brazier') && !o.taken) ? 1.5 : 0); if (cost < gS[j]) { gS[j] = cost; from[j] = i; open.push([cost + Math.abs(tx - nx) + Math.abs(ty - ny), j]); } }
    }
    if (found < 0) return null;
    const out = []; let i = found; while (i !== sy * w + sx && i >= 0) { out.push([i % w + 0.5, ((i / w) | 0) + 0.5]); i = from[i]; } return out.reverse();
  },
  goto(tx, ty, dt) { // returns true when arrived (within 0.6)
    const d = dist(G.x, G.y, tx, ty); if (d < 0.6) { this.mx = this.my = 0; this.path = null; return true; }
    this.pathT -= dt;
    const key = tx + ',' + ty; if (this.pathTarget !== key) { this.budget = 25 + d * 1.5; }
    this.budget -= dt; if (this.budget <= 0) { this.budget = 25 + d * 1.5; this.path = null; this.pathTarget = key; this.mx = this.my = 0; return 'nopath'; }
    if (!this.path || this.pathT <= 0 || this.pathTarget !== key) { this.path = this.findPath(tx, ty); this.pathTarget = key; this.pathT = 2.5; if (!this.path) { this.mx = this.my = 0; return 'nopath'; } if (this.path.length) this.path.push([tx, ty]); }
    while (this.path.length > 1 && dist(G.x, G.y, this.path[0][0], this.path[0][1]) < 0.45) this.path.shift();
    const n = this.path[0] || [tx, ty]; const dx = n[0] - G.x, dy = n[1] - G.y, l = Math.hypot(dx, dy) || 1; this.mx = dx / l; this.my = dy / l;
    // stuck detection
    if (this.lastPos && dist(this.lastPos[0], this.lastPos[1], G.x, G.y) < 0.02 * dt * 60) this.stuckT += dt; else this.stuckT = 0; this.lastPos = [G.x, G.y];
    if (this.stuckT > 1.2) { this.stuckT = 0; this.path = null; this.pathT = 0; const a = Math.random() * TAU; this.mx = Math.cos(a); this.my = Math.sin(a); }
    return false;
  },
  // ---------- threats & combat ----------
  threats() { return G.monsters.filter(mo => { if (mo.dead || mo.hidden || !mo.aware || mo.botIgnore > G.playTime) return false; const d = dist(mo.x, mo.y, G.x, G.y); return d < 10 && (d < 3 || hasLOS(G.x, G.y, mo.x, mo.y)); }); },
  giveUpOn(t, why) { t.botIgnore = G.playTime + 25; t.aware = false; this.eng = null; this.path = null; this.mx = this.my = 0; this.talk(why); },
  combat(dt, ths) {
    const near = ths.sort((a, b) => dist(a.x, a.y, G.x, G.y) - dist(b.x, b.y, G.x, G.y)); const t = near[0]; G.target = t;
    const d = dist(t.x, t.y, G.x, G.y);
    const aliveN = G.party.filter(alive).length, hpFrac = G.party.reduce((a, m) => a + Math.max(0, m.hp), 0) / Math.max(1, G.party.reduce((a, m) => a + maxHp(m), 0));
    const bossNearDead = t.boss && t.hp < t.maxHp * 0.15; // when the boss is almost down, the last one standing finishes it
    if (!bossNearDead && (aliveN <= 1 || (t.boss && (aliveN <= 2 || hpFrac < 0.3) && t.hp / t.maxHp > hpFrac + 0.15 && t.hp > t.maxHp * 0.25))) { this.flee = G.playTime + 30; this.path = null; this.eng = null; this.talk('Retreat! Live to fight another day.'); if (this.cur && this.cur.k === 'dungeon') { this.setback(this.cur); this.goals.unshift({ k: 'town' }, this.cur); this.cur = null; } if (this.cur && this.cur.k === 'grind' && this.lastCamp) this.skip[this.lastCamp] = G.playTime + 900; return; }
    // close the distance if nobody can hit it
    const melee = findMeleeTarget(t); const ranged = G.party.some(m => alive(m) && isRanged(m) && m.rec <= 0);
    const php = G.party.reduce((a, m) => a + m.hp, 0), thp = near.reduce((a, mo) => a + mo.hp, 0);
    if (this.eng && this.eng.kills === G.kills && this.eng.thp === thp && this.eng.php === php) this.eng.t += dt; else this.eng = { kills: G.kills, thp, php, t: 0 };
    let r = false;
    if (!melee && (d > 1.4 || !hasLOS(G.x, G.y, t.x, t.y))) { r = this.goto(t.x, t.y, dt); } else { this.mx = this.my = 0; }
    if (r === 'nopath' && d > 1.6) { this.giveUpOn(t, 'That ' + t.name + ' cannot reach us and we cannot reach it. Moving on.'); return; }
    if (this.eng.t > 8) { for (const mo of near) this.giveUpOn(mo, ''); this.talk('Nobody can reach anybody here. Moving on.'); if (this.cur && this.cur.k === 'grind' && this.lastCamp) this.skip[this.lastCamp] = G.playTime + 600; return; }
    if (!(G.fearT > 0)) partyAttack();
    // healing
    for (const m of G.party) { if (!alive(m)) continue; if (m.hp < maxHp(m) * (t.boss ? 0.45 : 0.35)) { const cleric = G.party.find(c => alive(c) && c.spells.includes('cure_wounds') && c.sp >= 3 && c.rec <= 0); if (cleric && d > 0.0) { castSpell(cleric, 'cure_wounds'); } else { const pot = G.inv.find(i => i.id === 'potion_heal2') || G.inv.find(i => i.id === 'potion_heal'); if (pot) useItem(pot, m); } } }
    const hurtCount = G.party.filter(m => alive(m) && m.hp < maxHp(m) * 0.6).length; const pc = G.party.find(c => alive(c) && c.spells.includes('power_cure') && c.sp >= 10 && c.rec <= 0); if (pc && hurtCount >= 2) castSpell(pc, 'power_cure');
    // offensive magic
    const n3 = near.filter(mo => dist(mo.x, mo.y, G.x, G.y) < 3).length;
    for (const m of G.party) {
      if (!alive(m) || m.rec > 0) continue;
      const has = (id, max = 50) => m.spells.includes(id) && m.sp >= SPELLS[id].sp && monsterResist(t, SPELLS[id].elem) < max; // never waste mana on what it shrugs off
      const weak = ['lightning_bolt', 'acid_burst', 'fireball', 'fire_bolt', 'ice_bolt', 'sparks', 'rock_blast', 'spirit_lash'].find(id => has(id, 0)); // hit the weakness first
      if (weak) { castSpell(m, weak); continue; }
      if (n3 >= 2 && has('ring_of_fire')) { castSpell(m, 'ring_of_fire'); continue; }
      if (near.length >= 2 && has('fireball') && d > 2.5) { castSpell(m, 'fireball'); continue; }
      if (has('lightning_bolt') && t.hp > 40) { castSpell(m, 'lightning_bolt'); continue; }
      if (has('acid_burst') && t.hp > 40) { castSpell(m, 'acid_burst'); continue; }
      if (has('rock_blast') && t.hp > 40) { castSpell(m, 'rock_blast'); continue; }
      if (has('fire_bolt') && m.sp > 6) { castSpell(m, 'fire_bolt'); continue; }
      if (has('ice_bolt') && m.sp > 6) { castSpell(m, 'ice_bolt'); continue; }
      if (has('sparks') && m.sp > 6) { castSpell(m, 'sparks'); continue; }
      if (has('mind_blast') && m.sp > 8 && !m.spells.includes('cure_wounds')) { castSpell(m, 'mind_blast'); continue; }
      if (has('spirit_lash') && m.sp > 12) { castSpell(m, 'spirit_lash'); continue; }
    }
    if (!buffOn('bless')) { const c = G.party.find(c => alive(c) && c.spells.includes('bless') && c.sp >= 6 && c.rec <= 0); if (c) castSpell(c, 'bless'); }
    if (!buffOn('stoneskin') && !buffOn('shield')) { const c = G.party.find(c => alive(c) && c.rec <= 0 && ((c.spells.includes('stone_skin') && c.sp >= 8) || (c.spells.includes('shield') && c.sp >= 8))); if (c) castSpell(c, c.spells.includes('stone_skin') ? 'stone_skin' : 'shield'); }
    this.talk(t.boss ? 'The ' + t.name + '! Everyone, hold the line.' : 'Fighting ' + t.name + (near.length > 1 ? ' and ' + (near.length - 1) + ' more.' : '.'));
  },
  setback(c) { c.fails = (c.fails || 0) + 1; if (c.fails >= 2) { c.fails = 0; c.minLv = Math.max(c.minLv || 0, Math.ceil(this.avgLevel()) + 1); } },
  fleeing(dt) {
    for (const m of G.party) { if (alive(m) && m.hp < maxHp(m) * 0.4) { const pot = G.inv.find(i => i.id === 'potion_heal2') || G.inv.find(i => i.id === 'potion_heal'); if (pot) useItem(pot, m); } }
    if (this.sayT > 6) this.talk('Running for it.');
    if (M.id !== 'over') { this.leaveDungeon(dt); return; }
    const chasers = G.monsters.some(mo => !mo.dead && mo.aware && dist(mo.x, mo.y, G.x, G.y) < 12);
    const sq = getMap('over').townSquare; const r = this.goto(sq.x, sq.y, dt);
    if (!chasers || r === true || r === 'nopath') { this.flee = 0; this.path = null; this.talk('We got away. Barely.'); }
  },
  needRest() { return G.party.some(m => m.cond.unconscious) || G.party.some(m => alive(m) && m.hp < maxHp(m) * 0.55) || G.party.some(m => alive(m) && maxSp(m) > 10 && m.sp < maxSp(m) * 0.3); },
  // ---------- screen flows: a queue of [action, delay] ----------
  runFlow(steps, after) { this.flow = { steps, i: 0, t: 0.4, after }; },
  updateFlow(dt) {
    const f = this.flow; f.t -= dt; if (f.t > 0) return;
    if (f.i >= f.steps.length) { this.flow = null; if (f.after) f.after(); return; }
    const [act, delay, say] = f.steps[f.i++]; if (say) this.talk(say); try { act(); } catch (e) { } f.t = delay || 0.6;
  },
  // ---------- town routine ----------
  townRoutine(opts) {
    const O = getMap('over'); const bld = id => O.objects.find(o => o.kind === 'door' && BUILDINGS[o.building].id === id);
    const steps = [];
    const visit = (door, fn, saying) => { steps.push({ k: 'goto', x: door.x + 0.5, y: door.y + 0.6, say: saying }); steps.push({ k: 'flow', door, fn }); };
    const main = ['main1', 'main2', 'main3', 'main4'].find(q => questState(q) !== 'done') || 'main4';
    const lvSum = G.party.reduce((a, m) => a + m.lvl, 0);
    // temple first if anyone is dead
    if (G.party.some(m => m.cond.dead) && G.gold >= 150 * lvSum || G.party.some(m => m.cond.poison)) visit(bld('temple'), () => { const fl = []; if (G.party.some(m => m.cond.dead) && G.gold >= 150 * lvSum) fl.push([() => I.press('raise'), 1.2, 'The temple can raise our fallen.']); if (G.party.some(m => m.cond.poison) && G.gold >= 15 * lvSum) fl.push([() => I.press('cure'), 1, 'Curing the poison.']); fl.push([() => I.press('close'), 0.6]); this.runFlow(fl); }, 'A visit to the temple.');
    // lord: accept or turn in the main quest
    if (questState(main) === 'none' || questReady(main)) visit(bld('hall'), () => { const fl = []; if (questState(main) === 'none') fl.push([() => I.press('qaccept_' + main), 1.6, 'Lord Harrow has a task for us.'], [() => I.press('close'), 0.8]); else fl.push([() => I.press('qturn_' + main), 1.6, 'Reporting back to Lord Harrow.']); fl.push([() => I.press('close'), 0.8]); this.runFlow(fl); }, 'To Harrow Hall, north of the square.');
    const givers = [['inn', 'bandits'], ['weapons', 'ore'], ['alchemist', 'herbs'], ['widow', 'locket'], ['temple', 'pilgrims'], ['scholar', 'tome']];
    for (const [b, q] of givers) { if (questState(q) === 'active' && questReady(q)) visit(bld(b), () => this.runFlow([[() => I.press('qturn_' + q), 1.6, 'Turning in: ' + QUESTS[q].name + '.'], [() => I.press('close'), 0.8]]), 'Someone is waiting on us.'); }
    if (opts.first) { for (const [b, q] of givers) visit(bld(b), () => this.runFlow([[() => I.press('qaccept_' + q), 1.4, 'Collecting work from the townsfolk.'], [() => I.press('close'), 0.6], [() => I.press('close'), 0.4]]), 'Asking around town.'); }
    // trainer when someone can train or has points to spend
    if (G.party.some(m => (canTrain(m) && G.gold >= TRAIN_COST(m.lvl + 1)) || m.skillPts >= 2) || G.gold > 1600) visit(bld('trainer'), () => this.trainerFlow(), 'Time to train what we have learned.');
    // guilds when we can afford a spell or a school
    if (G.gold >= 400) {
      const el = O.npcs.find(n => n.guild === 'elemental'), sp = O.npcs.find(n => n.guild === 'spirit');
      steps.push({ k: 'goto', x: el.x + 0.8, y: el.y, say: 'The Guild of the Elements sells spells.' }); steps.push({ k: 'npcflow', npc: el, fn: () => this.guildFlow('elemental') });
      steps.push({ k: 'goto', x: sp.x - 0.8, y: sp.y, say: 'And the Guild of the Spirit.' }); steps.push({ k: 'npcflow', npc: sp, fn: () => this.guildFlow('spirit') });
    }
    // shops
    const spareOf = types => G.inv.some(it => types.includes(ITEMS[it.id].type) && !G.party.some(m => canUse(m, it) && isUpgrade(m, it)));
    if (G.gold >= 450 || spareOf(['weapon'])) visit(bld('weapons'), () => this.shopFlow('weapons'), 'Better steel at the Rusty Blade.');
    if (G.gold >= 450 || spareOf(['armor', 'shield', 'helm', 'boots'])) visit(bld('armor'), () => this.shopFlow('armor'), 'Armor at the Iron Hauberk.');
    if (countInv('potion_heal') < 3 && G.gold >= 400) visit(bld('alchemist'), () => this.shopFlow('alchemist'), 'Potions from Old Ysolde.');
    // inn: food and rest
    if (G.food < 4 || this.needRest() || G.party.some(m => m.cond.unconscious)) visit(bld('inn'), () => { const fl = []; const want = Math.max(0, 8 - G.food); for (let i = 0; i < Math.ceil(want / 5) && G.gold > 60; i++) fl.push([() => I.press('buyfood'), 0.8, 'Rations for the road.']); if ((this.needRest() || G.party.some(m => m.cond.unconscious)) && G.gold >= 30) fl.push([() => I.press('innrest'), 1.5, 'A night at the Drowsy Dragon.']); fl.push([() => I.press('close'), 0.6]); this.runFlow(fl); }, 'The Drowsy Dragon, for food and a bed.');
    // equip pass (character screen, visible) when the pack holds an upgrade
    if (G.inv.some(it => SLOT_OF[ITEMS[it.id].type] && G.party.some(m => canUse(m, it) && isUpgrade(m, it)))) steps.push({ k: 'equipflow' });
    return steps;
  },
  trainerFlow() {
    const fl = []; const PRI = { Knight: ['Sword', 'Chain', 'BodyBuilding', 'Shield', 'Plate'], Archer: ['Bow', 'Leather', 'Air', 'Fire', 'Perception'], Cleric: ['Body', 'Spirit', 'Mace', 'Meditation', 'Leather'], Sorcerer: ['Fire', 'Water', 'Air', 'Meditation', 'Earth'], Paladin: ['Mace', 'Spirit', 'Chain', 'Body'], Druid: ['Earth', 'Body', 'Water', 'Meditation'] };
    G.party.forEach((m, i) => {
      fl.push([() => I.press('mtab' + i), 0.5]);
      for (let k = 0; k < 6; k++) fl.push([() => { if (canTrain(m) && G.gold >= TRAIN_COST(m.lvl + 1)) I.press('train'); }, 0.9, m.name + ' trains.']);
      // learn Plate for the knight when rich
      fl.push([() => { if (m.cls === 'Knight' && !m.skills.Plate && G.gold > 1600) I.press('learn_Plate'); if (m.cls === 'Sorcerer' && !m.skills.Meditation && G.gold > 900) I.press('learn_Meditation'); if (m.cls === 'Archer' && !m.skills.Learning && G.gold > 1200) I.press('learn_Learning'); }, 0.6]);
      // promotions for non-magic skills
      fl.push([() => { for (const sk of PRI[m.cls] || []) { if (SKILLS[sk] && SKILLS[sk].kind !== 'magic' && m.skills[sk]) { const have = (m.promo && m.promo[sk]) || 0; if (m.skills[sk] >= 3 && have < 4 && G.gold > 900) { I.press('promo_' + sk + '_4'); break; } if (m.skills[sk] >= 7 && have < 8 && G.gold > 3500) { I.press('promo_' + sk + '_8'); break; } } } }, 0.6]);
    });
    fl.push([() => I.press('close'), 0.5]);
    // spend skill points in the party screen
    fl.push([() => openScreen('char', { tab: 1 }), 0.6, 'Spending skill points.']);
    G.party.forEach((m, i) => { fl.push([() => I.press('mtab' + i), 0.4]); for (let k = 0; k < 6; k++) fl.push([() => { const pri = (PRI[m.cls] || []).filter(sk => m.skills[sk]); for (const sk of pri) { const lv = m.skills[sk]; if (lv >= 10) continue; const needPromo = (lv === 3 && !(m.promo && m.promo[sk] >= 4)) || (lv === 7 && !(m.promo && m.promo[sk] >= 8)); if (needPromo) continue; if (m.skillPts >= skillUpCost(lv)) { I.press('sk_' + sk); return; } } }, 0.45]); });
    fl.push([() => I.press('close'), 0.5]);
    this.runFlow(fl);
  },
  guildFlow(which) {
    const g = GUILDS[which]; const fl = [];
    const WANT = { Sorcerer: ['fire_bolt', 'ring_of_fire', 'sparks', 'ice_bolt', 'fireball', 'town_portal', 'lightning_bolt', 'acid_burst', 'stone_skin', 'shield', 'torch_light'], Cleric: ['cure_wounds', 'bless', 'power_cure', 'cure_poison', 'spirit_lash', 'mind_blast', 'heroism', 'raise_dead', 'mind_shield'], Archer: ['sparks', 'shield', 'fire_bolt', 'wizard_eye'], Paladin: ['bless', 'cure_wounds', 'spirit_lash', 'power_cure'], Druid: ['stun', 'cure_wounds', 'rock_blast', 'stone_skin', 'power_cure'], Knight: [] };
    G.party.forEach((m, i) => {
      if (!CLASSES[m.cls].schools.some(s => g.schools.includes(s))) return;
      fl.push([() => I.press('mtab' + i), 0.5]);
      // learn schools we want (Water for town portal, Earth, Mind)
      fl.push([() => { for (const sc of g.schools) { if (!CLASSES[m.cls].schools.includes(sc) || m.skills[sc]) continue; const wantSchool = (m.cls === 'Sorcerer' && (sc === 'Water' || sc === 'Earth')) || (m.cls === 'Cleric' && sc === 'Mind') || (m.cls === 'Archer' && sc === 'Fire'); if (wantSchool && G.gold > 700) { I.press('learn_' + sc); return; } } }, 0.7]);
      for (let k = 0; k < 5; k++) fl.push([() => { for (const id of WANT[m.cls] || []) { const sp = SPELLS[id]; if (!g.schools.includes(sp.school) || m.spells.includes(id) || !CLASSES[m.cls].schools.includes(sp.school)) continue; const need = sp.lvl === 1 ? 1 : sp.lvl === 2 ? 2 : sp.lvl === 3 ? 4 : 8; if ((m.skills[sp.school] || 0) >= need && G.gold >= sp.price + 250) { I.press('spell_' + id); return; } } }, 0.8, m.name + ' studies a new spell.']);
      fl.push([() => { for (const sc of g.schools) { if (!m.skills[sc]) continue; const have = (m.promo && m.promo[sc]) || 0; if (m.skills[sc] >= 3 && have < 4 && G.gold > 1200) { I.press('promo_' + sc + '_4'); return; } if (m.skills[sc] >= 7 && have < 8 && G.gold > 5000) { I.press('promo_' + sc + '_8'); return; } } }, 0.6]);
    });
    fl.push([() => I.press('close'), 0.5]);
    this.runFlow(fl);
  },
  shopFlow(id) {
    const fl = []; const b = Object.values(BUILDINGS).find(x => x.id === id); const reserve = 350;
    const avg = w => w.dmg[0] * (w.dmg[1] + 1) / 2 + w.dmg[2];
    if (id === 'weapons') {
      // sell spare weapons/armor first
      fl.push([() => I.press('tab1'), 0.6, 'Selling what we do not need.']);
      for (let k = 0; k < 6; k++) fl.push([() => { const i = G.inv.findIndex(it => ITEMS[it.id].type === 'weapon' && !G.party.some(m => canUse(m, it) && isUpgrade(m, it))); if (i >= 0) I.press('sell' + i); }, 0.5]);
      fl.push([() => I.press('tab0'), 0.6]);
      G.party.forEach(m => { for (let k = 0; k < 2; k++) fl.push([() => { if (!alive(m) && m.cond.dead) return; const cur = weaponOf(m); let best = -1, bestV = cur ? avg(cur) : 0; b.stock.forEach((sid, i) => { const w = ITEMS[sid]; if (w.type !== 'weapon' || !m.skills[w.skill]) return; if (cur && !!cur.ranged !== !!w.ranged) return; if (m.cls === 'Sorcerer' && w.skill !== 'Staff') return; const price = buyPrice(makeItem(sid)); if (avg(w) > bestV + 0.5 && G.gold - price >= reserve) { best = i; bestV = avg(w); } }); if (best >= 0) { I.press('buy' + best); this.talk('A ' + ITEMS[b.stock[best]].name + ' for ' + m.name + '.'); } }, 0.9]); });
    } else if (id === 'armor') {
      fl.push([() => I.press('tab1'), 0.6, 'Selling what we do not need.']);
      for (let k = 0; k < 6; k++) fl.push([() => { const i = G.inv.findIndex(it => ['armor', 'shield', 'helm', 'boots'].includes(ITEMS[it.id].type) && !G.party.some(m => canUse(m, it) && isUpgrade(m, it))); if (i >= 0) I.press('sell' + i); }, 0.5]);
      fl.push([() => I.press('tab0'), 0.6]);
      G.party.forEach(m => { fl.push([() => { for (const type of ['armor', 'shield', 'helm', 'boots']) { const cur = m.equip[SLOT_OF[type]]; const curV = cur ? ITEMS[cur.id].acv : 0; let best = -1, bestV = curV; b.stock.forEach((sid, i) => { const a = ITEMS[sid]; if (a.type !== type) return; if (a.skill && !m.skills[a.skill]) return; if (type === 'shield' && weaponOf(m) && weaponOf(m).twoHand) return; const price = buyPrice(makeItem(sid)); if (a.acv > bestV && G.gold - price >= reserve) { best = i; bestV = a.acv; } }); if (best >= 0) { I.press('buy' + best); this.talk(ITEMS[b.stock[best]].name + ' for ' + m.name + '.'); return; } } }, 0.9]); fl.push([() => { for (const type of ['armor', 'shield', 'helm', 'boots']) { const cur = m.equip[SLOT_OF[type]]; const curV = cur ? ITEMS[cur.id].acv : 0; let best = -1, bestV = curV; b.stock.forEach((sid, i) => { const a = ITEMS[sid]; if (a.type !== type || (a.skill && !m.skills[a.skill])) return; if (type === 'shield' && weaponOf(m) && weaponOf(m).twoHand) return; const price = buyPrice(makeItem(sid)); if (a.acv > bestV && G.gold - price >= reserve) { best = i; bestV = a.acv; } }); if (best >= 0) { I.press('buy' + best); return; } } }, 0.9]); });
    } else {
      const want = { potion_heal: 5, potion_mana: 3, potion_cure: 2, potion_heal2: G.gold > 2500 ? 3 : 0 };
      for (const pid in want) for (let k = 0; k < want[pid]; k++) fl.push([() => { if (countInv(pid) < want[pid] && G.gold - buyPrice(makeItem(pid)) >= reserve) I.press('buy' + b.stock.indexOf(pid)); }, 0.45, 'Stocking potions.']);
    }
    fl.push([() => I.press('close'), 0.6]);
    this.runFlow(fl);
  },
  equipFlow() {
    const fl = [[() => openScreen('char', { tab: 2 }), 0.8, 'Sorting the pack.']];
    G.party.forEach((m, i) => { for (let k = 0; k < 4; k++) fl.push([() => { if (G.sel !== i) { I.press('mtab' + i); return; } const j = G.inv.findIndex(it => SLOT_OF[ITEMS[it.id].type] && canUse(m, it) && isUpgrade(m, it)); if (j >= 0) { G.screen.selItem = j; I.press('equip'); this.talk(m.name + ' equips ' + itemName(G.inv[j]) + '.'); } }, 0.7]); });
    fl.push([() => I.press('close'), 0.6]);
    this.runFlow(fl);
  },
  // ---------- dungeon routine ----------
  dungeonTargets() {
    const t = [];
    for (const o of M.objects) if (o.kind === 'chest' && !o.opened) t.push({ kind: 'chest', x: o.x + 0.5, y: o.y + 0.5, o });
    for (const o of M.objects) if (o.kind === 'pickup' && !o.taken) t.push({ kind: 'pickup', x: o.x + 0.5, y: o.y + 0.5, o });
    return t;
  },
  // ---------- main update ----------
  update(dt) {
    if (!this.on) return; this.sayT += dt;
    if (G.mode === 'dead') { this.waitT += dt; if (this.waitT > 2.5) { this.waitT = 0; this.wipes++; I.press('wake'); this.talk('We wake in the temple. Lighter of purse, wiser of heart.'); this.flee = 0; this.eng = null; if (this.cur) { if (this.cur.k === 'town') this.cur.steps = null; if (this.cur.k === 'dungeon') { this.cur.wipes = (this.cur.wipes || 0) + 1; this.setback(this.cur); } if (this.cur.k === 'grind' && this.lastCamp) this.skip[this.lastCamp] = G.playTime + 900; this.goals.unshift(this.cur); } this.goals.unshift({ k: 'town' }); this.cur = null; this.path = null; } return; }
    if (G.mode === 'ending') { this.talk('The Scepter is home. That is the whole game, beginning to end.'); this.done = true; return; }
    if (G.mode !== 'play') return;
    this.mx = this.my = 0; this.why = 'goal';
    if (this.flow) { this.why = 'flow'; this.updateFlow(dt); return; }
    if (G.screen) { this.why = 'screen:' + G.screen.kind; if (G.screen.kind === 'text' || G.screen.kind === 'npc') { this.waitT += dt; if (this.waitT > 1.8) { this.waitT = 0; I.press('close'); } return; } this.waitT += dt; if (this.waitT > 3) { this.waitT = 0; closeScreen(); } return; }
    this.waitT = 0;
    if (this.flee > G.playTime) { this.why = 'flee'; this.fleeing(dt); return; }
    // combat first
    const ths = this.threats();
    if (ths.length) { this.why = 'combat'; this.combat(dt, ths); return; }
    G.target = null;
    // watchdog: standing still with nothing dying for a minute means the plan is broken; change it
    if (!this.wd || G.kills !== this.wd.kills || this.wd.map !== M.id || dist(this.wd.x, this.wd.y, G.x, G.y) > 2) this.wd = { x: G.x, y: G.y, kills: G.kills, map: M.id, t: 0 }; else this.wd.t += dt;
    if (this.wd.t > 60) {
      this.wd = null; this.stalls = (this.stalls || 0) + 1; this.path = null; this.eng = null;
      for (const mo of G.monsters) if (mo.aware) { mo.aware = false; mo.botIgnore = G.playTime + 30; }
      if (this.cur && this.cur.k === 'grind' && this.lastCamp) this.skip[this.lastCamp] = G.playTime + 900;
      if (this.cur && this.cur.k === 'town') this.cur.steps = null;
      if (this.cur) { this.goals.unshift(this.cur); this.cur = null; }
      this.goals.unshift({ k: 'town' }); this.talk('This is going nowhere. Back to town to think again.');
      if (this.stalls % 3 === 0) { const sq = getMap('over').townSquare; enterMap('over', sq.x, sq.y); G.fadeT = 1; this.talk('Lost. We double back to Harrowmere by the old paths.'); }
      return;
    }
    // rest when hurt and safe
    if (this.needRest() && G.playTime - this.lastRestT > 8) {
      if (!canRest()) { this.lastRestT = G.playTime; this.talk(G.food > 0 ? 'Making camp. Everyone needs rest.' : 'No food, but we must rest anyway.'); restParty(8); G.fadeT = 1; return; }
      // enemies about: put some distance between us and them first
      this.why = 'saferest'; this.restWalkT = (this.restWalkT || 0) + dt; if (this.sayT > 6) this.talk('Too dangerous to camp here. Moving on a little.');
      const sq = M.id === 'over' ? getMap('over').townSquare : M.objects.find(o => o.kind === 'stairs'); const r = sq ? this.goto(sq.x + (M.id === 'over' ? 0 : 0.5), sq.y + (M.id === 'over' ? 0 : 0.5), dt) : 'nopath';
      if (r === 'nopath' || r === true || this.restWalkT > 25) { this.restWalkT = 0; this.lastRestT = G.playTime; this.talk('Resting with one eye open.'); restParty(8); G.fadeT = 1; }
      return;
    }
    // goals
    if (!this.cur) { this.cur = this.goals.shift(); if (!this.cur) { this.talk('Nothing left on the list.'); this.done = true; return; } this.cur.state = 0; }
    const c = this.cur; const O = getMap('over');
    if (c.k === 'town') {
      if (M.id !== 'over') { this.leaveDungeon(dt); return; }
      if (!c.steps) { c.steps = this.townRoutine(c); c.si = 0; }
      if (c.si >= c.steps.length) { this.cur = null; if (c.last) { this.talk('Harrowmere is quiet again. We keep walking.'); this.goals.push({ k: 'wander' }); } return; }
      const s = c.steps[c.si];
      if (s.k === 'goto') { if (s.say && this.sayT > 6) this.talk(s.say); const r = this.goto(s.x, s.y, dt); if (r === true) c.si++; else if (r === 'nopath') c.si++; return; }
      if (s.k === 'flow') { const it = nearestInteractable(); if (it && it.o === s.door) { doInteract(it); s.fn(); } c.si++; return; }
      if (s.k === 'npcflow') { const it = nearestInteractable(); if (it && it.n === s.npc) { doInteract(it); s.fn(); } c.si++; return; }
      if (s.k === 'equipflow') { this.equipFlow(); c.si++; return; }
      c.si++; return;
    }
    if (c.k === 'herbs') {
      if (M.id !== 'over') { this.leaveDungeon(dt); return; }
      if (questState('herbs') !== 'active' || countInv('marsh_herb') >= 4) { this.cur = null; return; }
      const herbs = O.objects.filter(o => o.kind === 'pickup' && o.item === 'marsh_herb' && !o.taken).sort((a, b) => dist(a.x, a.y, G.x, G.y) - dist(b.x, b.y, G.x, G.y));
      if (!herbs.length) { this.cur = null; return; }
      if (this.sayT > 8) this.talk('Picking marsh herb for Old Ysolde. The lizardfolk will not like it.');
      const h = herbs[0]; const r = this.goto(h.x + 0.5, h.y + 0.5, dt); if (r === true) { const it = nearestInteractable(); if (it && it.o === h) doInteract(it); else h.taken = true; } else if (r === 'nopath') h.taken = true;
      return;
    }
    if (c.k === 'dungeon') {
      const D = DUNGEONS[c.id];
      if (M.id === 'over') {
        const want = Math.max(c.need, c.minLv || 0);
        if (this.avgLevel() < want) { this.talk('We are not ready for the ' + D.name + '. Let us hunt the roads first.'); this.goals.unshift({ k: 'grind', to: want, why: 'the ' + D.name }, c); this.cur = null; return; }
        const [ex, ey] = ENTRANCES[c.id]; if (this.sayT > 8) this.talk('On the road to the ' + D.name + '.');
        const r = this.goto(ex + 0.5, ey + 0.9, dt); if (r === true) { const it = nearestInteractable(); if (it && it.o && it.o.kind === 'entrance') { doInteract(it); this.talk(D.entrance); } } return;
      }
      if (M.id !== c.id) { this.leaveDungeon(dt); return; }
      // inside: chests, then the boss, then leave
      const boss = G.monsters.find(mo => mo.boss && !mo.dead); const bossDead = !boss && mapState(c.id).dead[M.monsters.findIndex(mo => mo.boss)];
      const targets = this.dungeonTargets().sort((a, b) => dist(a.x, a.y, G.x, G.y) - dist(b.x, b.y, G.x, G.y));
      if (targets.length && !(c.bossFirst && boss)) {
        const t = targets[0]; if (this.sayT > 8) this.talk(t.kind === 'chest' ? 'A chest. Chests are why we came.' : 'Something on the floor.');
        const r = this.goto(t.x, t.y, dt); if (r === true) { const it = nearestInteractable(); if (it && it.o === t.o) doInteract(it); else { t.o.opened = true; t.o.taken = true; } } else if (r === 'nopath') { t.o.opened = true; t.o.taken = true; }
        return;
      }
      if (boss) { const want = Math.max(BOSS_LV[c.id] || 0, c.minLv || 0); if (this.avgLevel() < want) { this.talk(boss.name + ' is beyond us for now. We will come back stronger.'); c.minLv = want; this.goals.unshift({ k: 'grind', to: want, why: boss.name }, c); this.cur = null; return; } if (this.sayT > 8) this.talk('Now for ' + boss.name + '.'); const r = this.goto(boss.x, boss.y, dt); if (r === 'nopath') { boss.aware = true; boss.botIgnore = 0; c.bossNoPath = (c.bossNoPath || 0) + dt; if (c.bossNoPath > 30) { c.bossNoPath = 0; boss.x = boss.hx; boss.y = boss.hy; } } else c.bossNoPath = 0; return; }
      if (G.drops.length) { const d = G.drops[0]; this.goto(d.x, d.y, dt); return; }
      this.talk(D.name + ' is cleared. Back to town.'); this.cur = null; return;
    }
    if (c.k === 'grind') {
      if (M.id !== 'over') { this.leaveDungeon(dt); return; }
      if (this.avgLevel() >= c.to) { this.talk('Strong enough now. Back to ' + c.why + '.'); this.cur = null; return; }
      const trainable = G.party.some(m => canTrain(m) && G.gold >= TRAIN_COST(m.lvl + 1));
      if (trainable && G.playTime - (c.townT || -1e9) > 90) { c.townT = G.playTime; this.goals.unshift({ k: 'town' }, c); this.cur = null; return; }
      if (questState('herbs') === 'active' && !c.herbs && countInv('marsh_herb') < 4 && this.avgLevel() >= 3) { c.herbs = true; this.goals.unshift({ k: 'herbs' }, c); this.cur = null; return; }
      const camp = this.nearestCamp();
      if (camp) {
        this.lastCamp = camp.key; if (this.sayT > 8) this.talk('Hunting the ' + camp.name + ' camp for experience. ' + c.why.charAt(0).toUpperCase() + c.why.slice(1) + ' can wait.');
        const r = this.goto(camp.x, camp.y, dt);
        if (r === true || r === 'nopath') { c.campT = (c.campT || 0) + dt; if (r === 'nopath' || c.campT > 15) { this.skip[camp.key] = G.playTime + 600; c.campT = 0; this.path = null; } } else c.campT = 0;
        return;
      }
      // nothing left to hunt: sell, train, eat, then wait for the roads to fill again
      this.goals.unshift({ k: 'town' }, { k: 'passtime', rests: 9 }, c); this.cur = null; return;
    }
    if (c.k === 'passtime') {
      if (M.id !== 'over') { this.leaveDungeon(dt); return; }
      if ((c.done || 0) >= c.rests) { this.cur = null; return; }
      if (G.playTime - this.lastRestT < 1.5) return;
      this.lastRestT = G.playTime; c.done = (c.done || 0) + 1; this.talk('Waiting for the roads to fill with trouble again.'); restParty(8); G.fadeT = 1; return;
    }
    if (c.k === 'wander') { const camp = this.nearestCamp(); if (camp) { this.goto(camp.x, camp.y, dt); } return; }
    this.cur = null;
  },
  nearestCamp() { // sticky: once we have picked a camp we keep walking to it, or two equidistant camps make us dither forever
    let best = null, bd = 1e9;
    for (const [cx, cy, r, list, n] of CAMPS) {
      const key = cx + ',' + cy; if (this.skip[key] > G.playTime) continue;
      const anyAlive = G.monsters.some(mo => !mo.dead && mo.group === key); if (!anyAlive) continue;
      const tier = MONSTERS[list[0]].tier, ideal = clamp(Math.ceil(this.avgLevel() / 3), 1, 5); if (tier > ideal + 1) continue; // hunt what is worth hunting at our level
      const cand = { x: cx + 0.5, y: cy + 0.5, name: MONSTERS[list[0]].name, key };
      if (key === this.lastCamp) return cand;
      const d = dist(cx, cy, G.x, G.y) + Math.abs(tier - ideal) * 50; if (d < bd) { bd = d; best = cand; }
    }
    return best;
  },
  leaveDungeon(dt) { const st = M.objects.find(o => o.kind === 'stairs'); if (!st) { enterMap('over', null, null); return; } const port = G.party.find(m => alive(m) && m.spells.includes('town_portal') && m.sp >= 12 && m.rec <= 0); if (port) { this.talk('Town Portal. The long way home is for other people.'); castSpell(port, 'town_portal'); return; } if (this.sayT > 8) this.talk('Back to the stairs.'); const r = this.goto(st.x + 0.5, st.y + 0.5, dt); if (r === true) { const it = nearestInteractable(); if (it && it.o === st) doInteract(it); } else if (r === 'nopath') enterMap('over', null, null); },
};
function isUpgrade(m, it) { const b = ITEMS[it.id]; const slot = SLOT_OF[b.type]; if (!slot) return false; const cur = m.equip[slot]; if (b.type === 'weapon') { if (cur && !!ITEMS[cur.id].ranged !== !!b.ranged) return false; if (m.cls === 'Sorcerer' && b.skill !== 'Staff') return false; if (m.cls === 'Archer' && !b.ranged) return false; const avg = w => w.dmg[0] * (w.dmg[1] + 1) / 2 + w.dmg[2]; return avg(b) > (cur ? avg(ITEMS[cur.id]) : 0) + 0.4; } return (b.acv || 0) > (cur ? ITEMS[cur.id].acv || 0 : 0); }

// ---- 90_main.js ----
// ===================== main loop =====================
let viewCvs, hudCvs, lastT = 0, autosaveT = 0;
function readInsets() { const cs = getComputedStyle(document.documentElement); const v = k => parseFloat(cs.getPropertyValue(k)) || 0; return { l: v('--sal'), r: v('--sar'), t: v('--sat'), b: v('--sab') }; }
function resize() {
  const vv = window.visualViewport; const W = Math.round(vv ? vv.width : window.innerWidth), H = Math.round(vv ? vv.height : window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2); const ins = readInsets();
  resizeView(W, H, dpr); resizeUI(W, H, dpr, ins);
  const touchDev = I.isTouch || navigator.maxTouchPoints > 0; document.getElementById('rotate').style.display = (W < H && touchDev) ? 'flex' : 'none';
  G.camSet = false;
}
async function boot() {
  viewCvs = document.getElementById('view'); hudCvs = document.getElementById('hud'); initView(viewCvs); initUI(hudCvs); I.init(document.body);
  const loading = document.getElementById('loading');
  try { await loadAssets(window.ASSET_SRC); } catch (e) { loading.textContent = 'Failed to load: ' + e.message; throw e; }
  loading.style.display = 'none';
  resize(); window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 300)); if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  const first = () => { Snd.init(); Snd.music(G.mode === 'title' || (M && M.outdoor) ? 'town' : 'dungeon'); }; window.addEventListener('touchstart', first, { once: true }); window.addEventListener('mousedown', first, { once: true }); window.addEventListener('keydown', first, { once: true });
  const wake = () => { try { if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume(); } catch (e) { } }; window.addEventListener('touchend', wake); window.addEventListener('mouseup', wake);
  titleSetup();
  requestAnimationFrame(loop);
}
function titleSetup() {
  M = getMap('over'); Object.assign(G, { mode: 'title', party: [], time: 10 * 60, playTime: 0, log: [], fx: [], monsters: [], projs: [], drops: [], trail: [], buffs: {}, screen: null, notice: null, sel: 0, x: M.townSquare.x, y: M.townSquare.y, facing: 1, camSet: false, fadeT: 0, titleT: 0 });
  I.modal = false;
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) M.explored[y * M.w + x] = 1;
}
function startCreate() { G.mode = 'create'; const used = []; G.create = ['Knight', 'Archer', 'Cleric', 'Sorcerer'].map(cls => { let n; do { n = pick(NAME_POOL); } while (used.includes(n)); used.push(n); return { cls, name: n }; }); G.editing = null; I.textTarget = null; }
function goFullscreen() { if (!I.isTouch || navigator.standalone) return; try { const el = document.documentElement; const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null; const lock = () => { try { const l = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (l && l.catch) l.catch(() => { }); } catch (e) { } }; if (p && p.then) p.then(lock, () => { }); else lock(); } catch (e) { } }

function playInput() {
  if (G.screen) { screenInput(); return; }
  if (I.take('attack') || I.held.attack) { if (G.fearT > 0) { if (I.take('attack')) log('The party is too afraid to attack!'); } else partyAttack(); }
  if (I.take('interact')) doInteract(G.focus);
  if (I.take('cast') || I.take('spells')) { if (!G.party[G.sel].spells.length) { const j = G.party.findIndex(m => m.spells.length && alive(m)); if (j >= 0) G.sel = j; } openScreen('spells'); }
  if (I.take('char') || I.take('inventory')) openScreen('char', { tab: I.take('inventory') ? 2 : 0 });
  if (I.take('map')) openScreen('map'); if (I.take('quests') || I.take('journal')) openScreen('quests'); if (I.take('rest')) openScreen('rest'); if (I.take('menu')) openScreen('menu');
  if (I.take('turn')) { G.turnBased = !G.turnBased; G.tbClock = 0; log(G.turnBased ? 'Turn-based mode: enemies act only when you do.' : 'Real-time mode.'); Snd.play('ui'); }
  for (let i = 0; i < 4; i++) { if (I.take('sel' + (i + 1))) G.sel = i; if (I.take('port' + i)) { if (G.sel === i && G.lastPort === i && G.playTime - (G.lastPortT || 0) < 0.6) openScreen('char', { tab: 0 }); G.sel = i; G.lastPort = i; G.lastPortT = G.playTime; } }
  if (I.take('nextchar')) G.sel = (G.sel + 1) % 4;
  if (I.clicked) {
    const [wx, wy] = screenToWorld(I.clicked.x, I.clicked.y);
    let best = null, bd = 1.0; for (const mo of G.monsters) { if (mo.dead || mo.hidden) continue; const d = dist(wx, wy + 0.4, mo.x, mo.y); if (d < bd) { bd = d; best = mo; } }
    if (best) { G.target = best; if (!(G.fearT > 0)) partyAttack(); }
    else { const it = nearestInteractable(); if (it) { const ox = it.o ? it.o.x + 0.5 : it.n.x, oy = it.o ? it.o.y + 0.5 : it.n.y; if (dist(wx, wy, ox, oy) < 1.3) doInteract(it); else if (I.clicked.touch) { } } }
  }
  if (G.target && (G.target.dead || dist(G.target.x, G.target.y, G.x, G.y) > 12)) G.target = null;
}
function updateNpcs(dt) {
  for (const n of M.npcs) {
    n.anim = (n.anim || 0) + dt; if (!n.wander) continue; n.hx = n.hx === undefined ? n.x : n.hx; n.hy = n.hy === undefined ? n.y : n.hy;
    n.wt = (n.wt || 0) - dt; if (n.wt <= 0) { n.wt = 2 + Math.random() * 4; const a = Math.random() * TAU; n.dir = Math.random() < 0.5 ? null : [Math.cos(a), Math.sin(a)]; n.dt = 0.8 + Math.random(); }
    if (n.dir && n.dt > 0) { n.dt -= dt; const nx = n.x + n.dir[0] * dt, ny = n.y + n.dir[1] * dt; if (mPass(M, Math.floor(nx), Math.floor(ny)) && dist(nx, ny, n.hx, n.hy) < n.wander + 1 && dist(nx, ny, G.x, G.y) > 0.8) { n.x = nx; n.y = ny; n.flip = n.dir[0] < 0; } else n.dir = null; }
  }
}
function buildEnts() {
  const ents = [], lights = [], t = G.playTime;
  for (const o of M.objects) {
    if (o.taken) continue; const x = o.x + 0.5, y = o.y + 0.95;
    switch (o.kind) {
      case 'chest': ents.push({ x, y: o.big ? y + 0.05 : y, tile: o.big ? (o.opened ? [4, 27, 2, 2] : [4, 25, 2, 2]) : (o.opened ? [5, 23] : [4, 23]), shadow: false }); break;
      case 'pickup': ents.push({ x, y, icon: ITEMS[o.item].icon, hover: 2 + Math.sin(t * 3 + o.x) * 2, shadow: false }); lights.push({ x, y: y - 0.5, r: 1.5, i: 0.5, color: [255, 240, 200] }); break;
      case 'sign': ents.push({ x, y, tile: [1, 27], shadow: false }); break;
      case 'well': ents.push({ x, y, tile: [0, 16], shadow: false }); break;
      case 'brazier': ents.push({ x, y, tile: TILE_ICONS[THEMES[M.theme].torch] || [0, 12], shadow: false }); lights.push({ x, y: y - 0.6, r: 4.5, i: 0.9 + Math.sin(t * 9 + o.x) * 0.1 + Math.sin(t * 13.7 + o.y) * 0.05, color: M.theme === 'ice' ? [120, 170, 255] : M.theme === 'moss' ? [120, 255, 140] : M.theme === 'cosmic' ? [200, 120, 255] : [255, 180, 100] }); break;
      case 'deco': ents.push({ x, y, icon: o.spr, shadow: false }); break;
      case 'entrance': ents.push({ x, y: y - 0.2, tile: [1, 16], shadow: false, sortOff: -0.5 }); break;
      case 'stairs': ents.push({ x, y: y + 0.3, tile: [10, 28, 1, 2], shadow: false, sortOff: -1 }); break;
      case 'pot': ents.push({ x, y, tile: [4, 19], shadow: false }); break;
    }
  }
  for (const mo of G.monsters) {
    if (mo.dead) { ents.push({ x: mo.x, y: mo.y, spr: mo.d.spr, frame: 0, alpha: clamp(mo.deadT / 0.8, 0, 1), scale: mo.d.size || 1, flip: mo.flip }); continue; }
    if (mo.hidden) { ents.push({ x: mo.x, y: mo.y + 0.45, tile: [4, 23], shadow: false }); continue; }
    const lunge = mo.lunge > 0 ? Math.sin(mo.lunge / 0.25 * Math.PI) * 0.25 : 0; const dx = G.x - mo.x, dy = G.y - mo.y, dd = Math.hypot(dx, dy) || 1;
    ents.push({ x: mo.x + dx / dd * lunge, y: mo.y + dy / dd * lunge, spr: mo.d.spr, frame: Math.floor(mo.anim * (mo.aware ? 6 : 3)) % 4, flip: mo.flip, scale: mo.d.size || 1, hover: mo.d.fly ? 4 + Math.sin(mo.anim * 3) * 2 : 0, hpFrac: mo.aware ? mo.hp / mo.maxHp : 1, tint: mo.hurt > 0 ? 'rgba(255,255,255,0.75)' : mo.stun > 0 ? 'rgba(255,230,80,0.35)' : mo.fear > 0 ? 'rgba(200,80,255,0.3)' : null, selected: G.target === mo, boss: mo.boss });
    if (mo.d.light) lights.push({ x: mo.x, y: mo.y - 0.4, r: 3, i: 0.7, color: mo.kind === 'wisp' ? [150, 220, 255] : [255, 150, 60] });
  }
  for (const n of M.npcs) ents.push({ x: n.x, y: n.y, spr: n.spr, frame: Math.floor((n.anim || 0) * 3) % 4, flip: n.flip });
  const moving = (I.mx || I.my) && G.mode === 'play' && !G.screen;
  for (const p of memberScreenPositions()) { const m = p.m; ents.push({ x: p.x, y: p.y, spr: m.portrait, frame: moving ? Math.floor(G.walkT * 5 + p.i) % 4 : Math.floor(t * 2.5 + p.i) % 4, flip: G.facing < 0, selected: p.i === G.sel && G.mode === 'play', sortOff: 0.02 * p.i, hover: m.bounce > 0 ? m.bounce * 3 : 0, tint: m.hurt > 0 ? 'rgba(255,60,40,0.5)' : m.heal > 0 ? 'rgba(80,255,120,0.4)' : null }); }
  for (const d of G.drops) ents.push({ x: d.x, y: d.y, icon: d.items.length ? ITEMS[d.items[0].id].icon : 'gold', hover: 1 + Math.sin(t * 4 + d.x) * 1.5, shadow: false });
  for (const p of G.projs) { ents.push(p); if (p.proj === 'fire' || p.proj === 'spark') lights.push({ x: p.x, y: p.y, r: 2, i: 0.8, color: p.proj === 'fire' ? [255, 140, 50] : [255, 240, 140] }); }
  for (const f of G.fx) { ents.push(f); if (f.fx === 'glow') lights.push({ x: f.x, y: f.y, r: f.r * 1.5, i: f.life / f.dur, color: [255, 150, 60] }); }
  for (const l of M.lights) lights.push({ x: l.x, y: l.y, r: l.r, i: 0.85 + Math.sin(t * 8 + l.x) * 0.1, color: M.theme === 'ice' ? [120, 170, 255] : M.theme === 'moss' ? [120, 255, 140] : M.theme === 'cosmic' ? [200, 120, 255] : [255, 190, 110] });
  if (G.mode !== 'title') { const torch = buffOn('torch'); const r = torch ? 9 : (M.outdoor ? 5.5 : 5.2); lights.push({ x: G.x, y: G.y - 0.3, r, i: 1, color: torch ? [255, 220, 160] : [255, 200, 150] }); }
  return { ents, lights };
}
function ambientColor() {
  if (M.outdoor) { const d = daylight(); return [lerp(52, 255, d), lerp(62, 255, d), lerp(105, 255, d)]; }
  const a = THEMES[M.theme].ambient; return [a * 200, a * 196, a * 215];
}
function stepPlay(dt) {
  if (BOT.on) { BOT.update(dt); I.mx = BOT.mx; I.my = BOT.my; if (I.take('stopbot')) BOT.stop(); }
  if (G.mode === 'dead') { G.deadT += dt; G.playTime += dt; if (G.deadT > 1.5 && (I.take('wake') || I.take('interact'))) partyWipe(); return; }
  G.playTime += dt; G.mapT = (G.mapT || 0) + dt;
  playInput();
  Snd.music(M.outdoor ? 'town' : 'dungeon');
  if (!G.screen && G.mode === 'play') {
    frameCombatDt(dt); updateParty(dt); updateMonsters(dt); updateProjectiles(dt); updateFx(dt); updatePartyTimers(dt); updateClock(dt); updateNpcs(dt);
    G.focus = nearestInteractable();
    for (const l of G.log) l.t += dt; if (G.log.length && G.log[0].t > 10) G.log.shift();
    if (G.notice) { G.notice.t -= dt; if (G.notice.t <= 0) G.notice = null; }
    autosaveT += dt; if (autosaveT > 90) { autosaveT = 0; saveGame(); }
  }
  if (G.fadeT > 0) G.fadeT -= dt * 1.5;
}
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
  I.update();
  if (G.mode === 'title') {
    G.titleT += dt; G.playTime += dt; updateNpcs(dt); G.x = M.townSquare.x + Math.sin(G.titleT * 0.1) * 6; G.y = M.townSquare.y + Math.cos(G.titleT * 0.13) * 3;
    if (I.take('newgame')) { Snd.init(); goFullscreen(); startCreate(); } if (I.take('continue')) { Snd.init(); goFullscreen(); if (!loadGame()) startCreate(); }
    if (I.take('watch')) { Snd.init(); goFullscreen(); newGame(defaultParty()); G.fadeT = 1; BOT.start(); }
  } else if (G.mode === 'create') {
    G.playTime += dt; const cls = Object.keys(CLASSES);
    G.create.forEach((c, i) => { if (I.take('cls_prev' + i)) c.cls = cls[(cls.indexOf(c.cls) + cls.length - 1) % cls.length]; if (I.take('cls_next' + i)) c.cls = cls[(cls.indexOf(c.cls) + 1) % cls.length]; if (I.take('name' + i)) { if (I.isTouch) c.name = pick(NAME_POOL.filter(n => !G.create.some(x => x.name === n))); else { G.editing = i; I.textTarget = ch => { if (ch === '\b') c.name = c.name.slice(0, -1); else if (c.name.length < 12 && /[a-zA-Z' ]/.test(ch)) c.name += ch; }; } } });
    if (I.take('defparty')) { G.create = [{ cls: 'Knight', name: 'Roderick' }, { cls: 'Archer', name: 'Sable' }, { cls: 'Cleric', name: 'Mira' }, { cls: 'Sorcerer', name: 'Vesper' }]; }
    if (I.take('backtitle')) { G.mode = 'title'; I.textTarget = null; }
    if (I.take('begin') || I.take('interact')) { I.textTarget = null; G.editing = null; newGame(G.create.map(c => makeMember(c.name.trim() || pick(NAME_POOL), c.cls))); G.fadeT = 1; }
  } else if (G.mode === 'play' || G.mode === 'dead') {
    const steps = window.HM_TURBO || 1;
    for (let k = 0; k < steps; k++) { stepPlay(dt); if (k < steps - 1) I.endFrame(); }
  }
  else if (G.mode === 'ending') { G.endT += dt; if (I.take('keepplaying')) G.mode = 'play'; }
  // camera
  const vw = V.W / V.zoom, vh = V.H / V.zoom; const tx = G.x * T - vw / 2, ty = G.y * T - (vh - (U.H - U.barTop) / V.zoom) / 2;
  if (!G.camSet) { V.camX = tx; V.camY = ty; G.camSet = true; } else { const k = Math.min(1, dt * 9); V.camX += (tx - V.camX) * k; V.camY += (ty - V.camY) * k; }
  const { ents, lights } = buildEnts();
  drawWorld(M, ents, { ambient: ambientColor(), lights, time: G.playTime });
  drawHUD();
  I.endFrame();
}
window.addEventListener('load', boot);
window.HM = { G, I, V, BOT, canCast, get M() { return M; }, getMap, newGame, loadGame, saveGame, enterMap, partyAttack, castSpell, openScreen, closeScreen, makeMember, spawnMonster, hurtMonster, MONSTERS, ITEMS, SPELLS, QUESTS, doInteract, nearestInteractable, giveXp, train, addInv, makeItem, restParty, completeQuest, startQuest, defaultParty, raiseSkill, equipItem, skillUpCost, XP_FOR_LEVEL, canUse, maxHp, maxSp, CAMPS, DUNGEONS, mapState, questState, SKILLS };

})();
