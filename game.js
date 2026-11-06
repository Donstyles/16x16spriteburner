(function(){
'use strict';
// ---- 00_core.js ----
// ===== Core utilities =====
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const normAng = a => { a %= TAU; if (a < -Math.PI) a += TAU; else if (a > Math.PI) a -= TAU; return a; };
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const rnd = Math.random;
const rrange = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => (a + Math.random() * (b - a + 1)) | 0;
const pick = arr => arr[(Math.random() * arr.length) | 0];
// packed ABGR pixel helpers (little-endian canvas layout)
const RGBA = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
const pxR = p => p & 255, pxG = p => (p >>> 8) & 255, pxB = p => (p >>> 16) & 255, pxA = p => p >>> 24;
function lerpPx(p, r, g, b, t) {
  const ir = pxR(p), ig = pxG(p), ib = pxB(p);
  return RGBA((ir + (r - ir) * t) | 0, (ig + (g - ig) * t) | 0, (ib + (b - ib) * t) | 0, pxA(p));
}
const fmtNum = n => { n = Math.floor(n); return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

// ===== 5x7 bitmap font =====
const FONT_W = 5, FONT_H = 7;
const FONT_SRC = {
'A':'.###.#...##...#######...##...##...#','B':'####.#...##...#####.#...##...#####.','C':'.###.#...##....#....#....#...#.###.',
'D':'###..#..#.#...##...##...##..#.###..','E':'######....#....####.#....#....#####','F':'######....#....####.#....#....#....',
'G':'.###.#...##....#.####...##...#.####','H':'#...##...##...#######...##...##...#','I':'.###...#....#....#....#....#...###.',
'J':'..###...#....#....#....#.#..#..##..','K':'#...##..#.#.#..##...#.#..#..#.#...#','L':'#....#....#....#....#....#....#####',
'M':'#...###.###.#.##.#.##...##...##...#','N':'#...##...###..##.#.##..###...##...#','O':'.###.#...##...##...##...##...#.###.',
'P':'####.#...##...#####.#....#....#....','Q':'.###.#...##...##...##.#.##..#..##.#','R':'####.#...##...#####.#.#..#..#.#...#',
'S':'.#####....#.....###.....#....#####.','T':'#####..#....#....#....#....#....#..','U':'#...##...##...##...##...##...#.###.',
'V':'#...##...##...##...##...#.#.#...#..','W':'#...##...##...##.#.##.#.##.#.#.#.#.','X':'#...##...#.#.#...#...#.#.#...##...#',
'Y':'#...##...#.#.#...#....#....#....#..','Z':'#####....#...#...#...#...#....#####',
'0':'.###.#...##..###.#.###..##...#.###.','1':'..#...##....#....#....#....#...###.', '2':'.###.#...#....#...#...#...#...#####',
'3':'#####...#...#.....#.....##...#.###.','4':'...#...##..#.#..#..######...#....#.','5':'######....####.....#....##...#.###.',
'6':'..##..#...#....####.#...##...#.###.','7':'#####....#...#...#...#...#....#....','8':'.###.#...##...#.###.#...##...#.###.',
'9':'.###.#...##...#.####....#...#..##..',' ':'...................................',
'.':'..........................##...##..',',':'.....................##...#...#....','!':'..#....#....#....#..............#..',
'?':'.###.#...#....#...#...#.........#..',':':'......##...##........##...##.......',';':'......##...##........##....#...#...',
'-':'...............#####...............','+':'.......#....#..#####..#....#.......','=':'..........#####.....#####..........',
'/':'....#....#...#...#...#...#....#....','(':'...#...#...#....#....#.....#.....#.',')':'.#.....#.....#....#....#....#...#..',
"'":'.##....#...#.......................','"':'.#.#..#.#..#.#.....................','%':'##..###..#...#...#...#...#..###..##',
'*':'......#.#...#..#####..#...#.#......','<':'...#...#...#...#.....#.....#.....#.','>':'.#.....#.....#.....#...#...#...#...',
'[':'.###..#....#....#....#....#....###.',']':'.###....#....#....#....#....#..###.','_':'..............................#####',
'&':'.##..#..#.#.#...#...#.#.##..#..##.#','#':'.#.#..#.#.#####.#.#.#####.#.#..#.#.',
'a':'...........###.....#.#####...#.####','b':'#....#....#.##.##..##...##...#####.','c':'...........###.#....#....#...#.###.',
'd':'....#....#.##.##..###...##...#.####','e':'...........###.#...#######.....###.','f':'..##..#..#.#...###...#....#....#...',
'g':'......#####...##...#.####....#.###.','h':'#....#....#.##.##..##...##...##...#','i':'..#........##....#....#....#...###.',
'j':'...#........##....#....#.#..#..##..','k':'#....#....#..#.#.#..##...#.#..#..#.','l':'.##....#....#....#....#....#...###.',
'm':'..........##.#.#.#.##.#.##...##...#','n':'..........#.##.##..##...##...##...#','o':'...........###.#...##...##...#.###.',
'p':'.....####.#...##...#####.#....#....','q':'......#####...##...#.####....#....#','r':'..........#.##.##..##....#....#....',
's':'...........#####.....###.....#####.','t':'.#....#...###...#....#....#..#..##.','u':'..........#...##...##...##..##.##.#',
'v':'..........#...##...##...#.#.#...#..','w':'..........#...##...##.#.##.#.#.#.#.','x':'..........#...#.#.#...#...#.#.#...#',
'y':'.....#...##...##...#.####....#.###.','z':'..........#####...#...#...#...#####',
};
const FONT = {};
for (const k in FONT_SRC) {
  const s = FONT_SRC[k];
  const rows = [];
  for (let r = 0; r < FONT_H; r++) {
    let bits = 0;
    for (let c = 0; c < FONT_W; c++) if (s[r * FONT_W + c] === '#') bits |= 1 << (FONT_W - 1 - c);
    rows.push(bits);
  }
  FONT[k] = rows;
}
const fontCache = new Map();
function fontSheet(color, scale) {
  const key = color + '|' + scale;
  let sh = fontCache.get(key);
  if (sh) return sh;
  const keys = Object.keys(FONT);
  const cw = (FONT_W + 1) * scale, ch = (FONT_H + 1) * scale;
  const cvs = document.createElement('canvas');
  cvs.width = cw * keys.length; cvs.height = ch;
  const c = cvs.getContext('2d');
  c.fillStyle = color;
  const map = {};
  keys.forEach((k, i) => {
    map[k] = i * cw;
    const rows = FONT[k];
    for (let r = 0; r < FONT_H; r++) for (let x = 0; x < FONT_W; x++)
      if (rows[r] & (1 << (FONT_W - 1 - x))) c.fillRect(i * cw + x * scale, r * scale, scale, scale);
  });
  sh = { cvs, map, cw, ch };
  fontCache.set(key, sh);
  return sh;
}
function textWidth(str, scale) { return str.length * (FONT_W + 1) * scale - scale; }
// draw bitmap text; align: 'left' | 'center' | 'right'
function drawText(ctx, str, x, y, scale = 2, color = '#e8dcc0', align = 'left', shadow = true) {
  str = String(str);
  const w = textWidth(str, scale);
  if (align === 'center') x -= w / 2; else if (align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  if (shadow) drawTextRaw(ctx, str, x + scale, y + scale, scale, 'rgba(0,0,0,0.85)');
  drawTextRaw(ctx, str, x, y, scale, color);
  return w;
}
function drawTextRaw(ctx, str, x, y, scale, color) {
  const sh = fontSheet(color, scale);
  const adv = (FONT_W + 1) * scale;
  for (let i = 0; i < str.length; i++) {
    let ch = str[i];
    if (!(ch in FONT)) ch = ch.toUpperCase() in FONT ? ch.toUpperCase() : '?';
    if (ch === ' ') continue;
    ctx.drawImage(sh.cvs, sh.map[ch], 0, sh.cw, sh.ch, x + i * adv, y, sh.cw, sh.ch);
  }
}
// word wrap to a max pixel width
function wrapText(str, scale, maxW) {
  const words = str.split(' '), lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t, scale) > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---- 10_assets.js ----
// ===== Assets, textures, sprites =====
const NLV = 32;               // shade levels per texture
const TW = 16, WALL_TH = 32;  // wall texture 16x32 (column-major)
const ASSETS = {};

function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image ' + src.slice(0, 40))); im.src = src; }); }
function imagePixels(im) {
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, im.width, im.height);
  return { w: im.width, h: im.height, px: new Uint32Array(d.data.buffer), img: im };
}
async function loadAssets(src) {
  const [tiles, creatures] = await Promise.all([loadImage(src.tiles), loadImage(src.creatures)]);
  ASSETS.tiles = imagePixels(tiles);
  ASSETS.creatures = imagePixels(creatures);
  ASSETS.cindex = src.cindexData || await fetch(src.cindex).then(r => r.json());
  buildTextures();
}
// region of a pixel source, row-major
function regionPx(srcp, x0, y0, w, h) {
  const out = new Uint32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = srcp.px[(y0 + y) * srcp.w + x0 + x];
  return out;
}
const tilePx = (c, r, w = 1, h = 1) => regionPx(ASSETS.tiles, c * 16, r * 16, w * 16, h * 16);

// Pix: tiny pixel buffer helper for procedural art
class Pix {
  constructor(w, h, fill = 0) { this.w = w; this.h = h; this.px = new Uint32Array(w * h); if (fill) this.px.fill(fill); }
  set(x, y, p) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = p; }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.px[y * this.w + x] : 0; }
  blit(src, dx, dy, sw, sh) { const w = sw || src.w, h = sh || src.h; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = src.px[y * w + x]; if (p >>> 24) this.set(dx + x, dy + y, p); } }
  rect(x0, y0, w, h, p) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, p); }
}
// shade table: NLV copies fading toward fog colour
function shadeTable(px, fr, fg, fb) {
  const n = px.length, out = new Uint32Array(NLV * n);
  for (let l = 0; l < NLV; l++) {
    const t = Math.min(1, 0.06 + 0.94 * l / (NLV - 1)), o = l * n;
    for (let i = 0; i < n; i++) {
      const p = px[i];
      if (!(p >>> 24)) { out[o + i] = 0; continue; }
      out[o + i] = lerpPx(p, fr, fg, fb, t);
    }
  }
  return out;
}
function mulPx(p, mr, mg, mb, add = 0) {
  if (!(p >>> 24)) return 0;
  return RGBA(clamp(pxR(p) * mr + add, 0, 255) | 0, clamp(pxG(p) * mg + add, 0, 255) | 0, clamp(pxB(p) * mb + add, 0, 255) | 0, pxA(p));
}

// ---- wall themes (tile columns on tileset rows top/bottom) ----
const WALL_THEMES = {
  stone:  { top: 24, bot: 27, cols: [6, 7, 8, 9, 10],      fog: [14, 9, 8] },
  crypt:  { top: 24, bot: 27, cols: [11, 12, 13, 14, 15],  fog: [6, 5, 7] },
  moss:   { top: 24, bot: 27, cols: [6, 7, 8, 9, 10],      fog: [4, 10, 6], tint: [0.55, 0.95, 0.5] },
  ice:    { top: 24, bot: 27, cols: [16, 17, 18, 19, 20],  fog: [4, 8, 20] },
  ember:  { top: 28, bot: 31, cols: [11, 12, 13, 14, 15],  fog: [22, 7, 3] },
  grey:   { top: 28, bot: 31, cols: [16, 17, 18, 19, 20],  fog: [8, 8, 11] },
  cosmic: { top: 24, bot: 27, cols: [21, 22, 23, 24, 25],  fog: [8, 3, 16] },
  violet: { top: 28, bot: 31, cols: [21, 22, 23, 24, 25],  fog: [10, 4, 18] },
  slime:  { top: 29, bot: 32, cols: [26, 27, 28, 29, 30],  fog: [3, 12, 14] },
};
const WALL_VARIANT = { plain: 0, arch: 1, alcove: 2, door: 3, gate: 4 };
const THEME_NAMES = Object.keys(WALL_THEMES);
const WALLTEX = [];          // id -> {px (col-major), sh}
const WALLTEX_ID = {};       // 'theme:variant' -> id
const FLOORTEX = [];         // id -> {px (row-major 16x16), sh}
const FLOOR_SETS = {};       // theme -> {floor:[ids], ceil:[ids]}

function addWallTexPx(px, fog) { const id = WALLTEX.length; WALLTEX.push({ px, sh: shadeTable(px, fog[0], fog[1], fog[2]) }); return id; }
function addFloorTex(px, fog) { const id = FLOORTEX.length; FLOORTEX.push({ px, sh: shadeTable(px, fog[0], fog[1], fog[2]) }); return id; }
function colMajor(rowPx, w, h) { const out = new Uint32Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[x * h + y] = rowPx[y * w + x]; return out; }

// floor tile sets per theme: list of [col,row] for floors and ceilings
const FLOOR_DEFS = {
  stone:  { floor: [[8, 6], [7, 6], [8, 5], [9, 7], [8, 6], [8, 6]], ceil: [[26, 2], [27, 2], [26, 3]], fog: [14, 9, 8] },
  crypt:  { floor: [[1, 4], [2, 4], [3, 4], [2, 6], [1, 7]], ceil: [[26, 2], [27, 3]], fog: [6, 5, 7] },
  moss:   { floor: [[33, 22], [32, 22], [34, 22], [16, 2], [33, 22]], ceil: [[32, 2], [33, 2], [32, 3]], fog: [4, 10, 6] },
  ice:    { floor: [[37, 11], [38, 11], [39, 11], [37, 12], [10, 2]], ceil: [[16, 0], [17, 0], [16, 1]], fog: [4, 8, 20] },
  ember:  { floor: [[32, 31], [33, 31], [33, 32], [12, 2], [13, 3]], ceil: [[26, 3], [27, 3]], fog: [22, 7, 3] },
  grey:   { floor: [[4, 2], [5, 2], [4, 3], [5, 3], [1, 2]], ceil: [[1, 4], [2, 4], [3, 4]], fog: [8, 8, 11] },
  cosmic: { floor: [[28, 11], [27, 11], [29, 11], [28, 12], [4, 0]], ceil: [[6, 0], [7, 0], [8, 1], [9, 1], [6, 1]], fog: [8, 3, 16] },
  violet: { floor: [[28, 11], [4, 0], [5, 1]], ceil: [[6, 0], [7, 1], [8, 0]], fog: [10, 4, 18] },
  slime:  { floor: [[37, 21], [38, 21], [37, 22], [38, 22]], ceil: [[36, 2], [37, 3]], fog: [3, 12, 14] },
  // specials
  lava:   { floor: [[14, 0], [15, 0], [14, 1], [15, 1]], ceil: [[26, 3]], fog: [22, 7, 3] },
  water:  { floor: [[37, 5], [38, 6], [39, 5], [38, 7]], ceil: [[16, 0]], fog: [4, 8, 20] },
  sand:   { floor: [[27, 21], [28, 21], [29, 21], [28, 22]], ceil: [[26, 2]], fog: [14, 9, 8] },
  gold:   { floor: [[2, 18], [3, 18], [4, 18], [5, 18]], ceil: [[26, 3]], fog: [22, 7, 3] },
  planks: { floor: [[22, 2], [23, 2], [24, 3], [25, 3]], ceil: [[26, 2]], fog: [14, 9, 8] },
  carved: { floor: [[10, 0], [11, 0], [10, 1], [11, 1]], ceil: [[26, 2]], fog: [8, 8, 11] },
};
let FOG_WALL_IDS = [];
function buildTextures() {
  for (const name of THEME_NAMES) {
    const t = WALL_THEMES[name];
    t.cols.forEach((col, vi) => {
      const top = tilePx(col, t.top), bot = tilePx(col, t.bot);
      const row = new Uint32Array(16 * 32); row.set(top, 0); row.set(bot, 256);
      if (t.tint) for (let i = 0; i < row.length; i++) row[i] = mulPx(row[i], t.tint[0], t.tint[1], t.tint[2]);
      const id = addWallTexPx(colMajor(row, 16, 32), t.fog);
      WALLTEX_ID[name + ':' + vi] = id;
    });
  }
  for (const name in FLOOR_DEFS) {
    const d = FLOOR_DEFS[name];
    FLOOR_SETS[name] = { floor: d.floor.map(([c, r]) => addFloorTex(tilePx(c, r), d.fog)), ceil: d.ceil.map(([c, r]) => { const px = tilePx(c, r); for (let i = 0; i < px.length; i++) px[i] = mulPx(px[i], 0.42, 0.4, 0.45); return addFloorTex(px, d.fog); }) };
  }
  // fog gate: animated white mist wall textures
  for (let f = 0; f < 6; f++) {
    const px = new Uint32Array(16 * 32);
    for (let x = 0; x < 16; x++) for (let y = 0; y < 32; y++) {
      const n = 0.5 + 0.5 * Math.sin(x * 0.9 + f * 1.1 + Math.sin(y * 0.5 + f)) * Math.cos(y * 0.35 - f * 0.9 + x * 0.3);
      const v = 150 + n * 100, a = 255;
      px[x * 32 + y] = RGBA(v | 0, (v * 0.97) | 0, (v * 0.9 + 20) | 0, a);
    }
    FOG_WALL_IDS.push(addWallTexPx(px, [60, 60, 70]));
  }
}
const wallTexId = (theme, variant = 0) => WALLTEX_ID[theme + ':' + variant];

// ---- sprites ----
const SPR = {};
function makeSprite(name, frames, opts = {}) { const s = Object.assign({ name, frames, fps: 6 }, opts); SPR[name] = s; return s; }
function creatureSprite(name) {
  if (SPR[name]) return SPR[name];
  const e = ASSETS.cindex[name];
  if (!e) throw new Error('no creature ' + name);
  const frames = [];
  for (let i = 0; i < e.n; i++) frames.push({ w: e.fw, h: e.fh, px: regionPx(ASSETS.creatures, i * e.fw, e.y, e.fw, e.fh), sh: null });
  return makeSprite(name, frames, { fps: 5 });
}
function tileSprite(name, c, r, w = 1, h = 1) {
  if (SPR[name]) return SPR[name];
  return makeSprite(name, [{ w: w * 16, h: h * 16, px: tilePx(c, r, w, h), sh: null }]);
}
function shadedFrame(fr) {
  if (!fr.sh) fr.sh = shadeTable(fr.px, 0, 0, 0);
  return fr.sh;
}
// canvas image for a sprite frame (HUD use), cached per scale
function spriteCanvas(spr, frame = 0, scale = 3) {
  const fr = spr.frames[frame];
  if (!fr.cv) fr.cv = {};
  if (fr.cv[scale]) return fr.cv[scale];
  const c = document.createElement('canvas'); c.width = fr.w; c.height = fr.h;
  const x = c.getContext('2d'); const id = x.createImageData(fr.w, fr.h);
  new Uint32Array(id.data.buffer).set(fr.px); x.putImageData(id, 0, 0);
  if (scale === 1) { fr.cv[1] = c; return c; }
  const c2 = document.createElement('canvas'); c2.width = fr.w * scale; c2.height = fr.h * scale;
  const x2 = c2.getContext('2d'); x2.imageSmoothingEnabled = false; x2.drawImage(c, 0, 0, c2.width, c2.height);
  fr.cv[scale] = c2; return c2;
}
const TILE_SPRITES = {
  chest: [4, 23], chest_open: [5, 23], chest_green: [2, 24], chest_green_open: [3, 24], chest_blue: [4, 24], chest_blue_open: [5, 24],
  bigchest: [4, 25, 2, 2], bigchest_open: [4, 27, 2, 2], silverchest: [2, 25, 2, 2], silverchest_open: [2, 27, 2, 2],
  potion_blue: [0, 32], potion_red: [1, 32], potion_green: [2, 32], sword: [3, 32], sword_gold: [4, 32], sword_blue: [5, 32],
  skull: [6, 32], skull_dark: [7, 32], staff: [8, 32], bomb: [9, 32], lantern: [10, 32], lantern_lit: [11, 32],
  key_gold: [2, 29], key_silver: [3, 29], key_bronze: [4, 29], ring: [5, 29], heart: [3, 30], heart_half: [4, 30], heart_empty: [5, 30], trophy: [2, 30],
  gem_blue: [0, 31], gem_red: [1, 31], gem_green: [2, 31], gem_purple: [3, 31], bag: [4, 31], bag2: [5, 31],
  brazier_red: [0, 12], brazier_green: [1, 12], brazier_purple: [0, 13], brazier_blue: [1, 13], brazier_off: [0, 14],
  pot: [4, 19], pot_dark: [5, 19], pot_gold: [3, 19], bigpot: [2, 20, 2, 2], bigpot_moss: [0, 20, 2, 2], bigpot_pattern: [2, 22, 2, 2],
  bush: [4, 20], bush_yellow: [5, 20], rock: [4, 21], rock_lava: [5, 21], rock_moss: [4, 22], rock_ember: [5, 22],
  coffin: [0, 18, 1, 2], coffin_dark: [1, 22, 1, 2], coffin_open: [1, 24, 1, 2], grave: [0, 22], grave2: [0, 23],
  sign_skull: [0, 27], sign_text: [1, 27], sign_q: [1, 30], sign_ex: [0, 30], statue: [1, 14], pedestal: [0, 7], pedestal2: [0, 8], altar: [0, 9],
  barrel: [0, 10], barrel2: [0, 11], bones: [2, 12], crate: [1, 18], alcove_statue: [10, 28, 1, 2], cage: [1, 5], eye: [30, 0], gate_window: [32, 21],
};
function getSprite(name) {
  if (SPR[name]) return SPR[name];
  if (TILE_SPRITES[name]) { const t = TILE_SPRITES[name]; return tileSprite(name, t[0], t[1], t[2] || 1, t[3] || 1); }
  if (ASSETS.cindex[name]) return creatureSprite(name);
  throw new Error('unknown sprite ' + name);
}

// ---- procedural art ----
const FIRE_PAL = [[0, 0, 0, 0], [60, 10, 10, 200], [140, 30, 10, 255], [220, 70, 10, 255], [255, 140, 20, 255], [255, 210, 70, 255], [255, 250, 200, 255]];
function genFire(w, h, nframes, seed, pal = FIRE_PAL, intensity = 1) {
  const rng = mulberry32(seed), frames = [];
  let heat = new Float32Array(w * h);
  const steps = nframes * 2 + 10;
  for (let s = 0; s < steps; s++) {
    for (let x = 0; x < w; x++) { const cx = Math.abs(x - (w - 1) / 2) / (w / 2); heat[(h - 1) * w + x] = Math.max(0, (1 - cx * cx * 1.1)) * (0.6 + rng() * 0.6) * intensity; }
    const nh = new Float32Array(w * h);
    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
      const dx = (rng() * 3 | 0) - 1;
      const sx = clamp(x + dx, 0, w - 1);
      const v = (heat[(y + 1) * w + sx] + heat[(y + 1) * w + x] + heat[Math.min(h - 1, y + 2) * w + x] + heat[(y + 1) * w + clamp(x - dx, 0, w - 1)]) / 4;
      nh[y * w + x] = Math.max(0, v - (0.05 + rng() * 0.09) * (1 + y * 0.01));
    }
    for (let x = 0; x < w; x++) nh[(h - 1) * w + x] = heat[(h - 1) * w + x];
    heat = nh;
    if (s >= 10 && (s - 10) % 2 === 0 && frames.length < nframes) {
      const px = new Uint32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const v = clamp(heat[i], 0, 1);
        const idx = Math.min(pal.length - 1, (v * (pal.length - 0.01)) | 0);
        const c = pal[idx]; px[i] = c[3] ? RGBA(c[0], c[1], c[2], c[3]) : 0;
      }
      frames.push({ w, h, px, sh: null });
    }
  }
  return frames;
}
const EMBER_PAL = [[0, 0, 0, 0], [40, 8, 8, 160], [110, 25, 5, 255], [200, 60, 10, 255], [255, 130, 20, 255], [255, 200, 60, 255], [255, 240, 180, 255]];
const BLUE_PAL = [[0, 0, 0, 0], [10, 10, 40, 160], [20, 40, 120, 255], [40, 90, 200, 255], [90, 160, 255, 255], [170, 220, 255, 255], [240, 250, 255, 255]];
const GREEN_PAL = [[0, 0, 0, 0], [5, 30, 10, 160], [10, 80, 20, 255], [30, 150, 40, 255], [90, 220, 70, 255], [180, 255, 120, 255], [240, 255, 220, 255]];
const PURPLE_PAL = [[0, 0, 0, 0], [30, 5, 40, 160], [80, 10, 120, 255], [150, 30, 200, 255], [200, 90, 255, 255], [230, 170, 255, 255], [250, 240, 255, 255]];
function genGlow(size, r, g, b, inner = 1) {
  const px = new Uint32Array(size * size), c = (size - 1) / 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x - c, y - c) / (size / 2);
    if (d > 1) continue;
    const a = clamp((1 - d) * (1 - d) * 1.6, 0, 1);
    const k = clamp(1 - d * 0.9, 0, 1) * inner;
    px[y * size + x] = RGBA(clamp(r + (255 - r) * k, 0, 255) | 0, clamp(g + (255 - g) * k, 0, 255) | 0, clamp(b + (255 - b) * k, 0, 255) | 0, (a * 255) | 0);
  }
  return { w: size, h: size, px, sh: null };
}
function buildProceduralSprites() {
  // bonfire: bones + sword + fire
  const fire = genFire(16, 20, 8, 7, EMBER_PAL, 1.1);
  const frames = fire.map(f => {
    const p = new Pix(16, 24);
    // ash & bones
    const bone = RGBA(190, 180, 160), bone2 = RGBA(120, 110, 95), ash = RGBA(60, 50, 45);
    for (let x = 2; x < 14; x++) p.set(x, 22, ash);
    for (let x = 4; x < 12; x++) p.set(x, 23, ash);
    [[3, 21], [4, 21], [11, 21], [12, 21], [5, 20], [10, 20], [2, 22], [13, 22]].forEach(([x, y]) => p.set(x, y, bone));
    [[6, 21], [9, 21], [7, 22], [8, 22]].forEach(([x, y]) => p.set(x, y, bone2));
    p.blit({ w: 16, h: 20, px: f.px }, 0, 2);
    // coiled sword
    const steel = RGBA(200, 205, 215), steel2 = RGBA(130, 135, 150), hilt = RGBA(90, 60, 40), gold = RGBA(230, 180, 60);
    for (let y = 4; y < 21; y++) { p.set(7, y, y % 3 === 0 ? steel2 : steel); p.set(8, y, steel2); }
    p.set(6, 7, gold); p.set(9, 7, gold); p.set(5, 7, gold); p.set(10, 7, gold);
    p.set(7, 3, hilt); p.set(8, 3, hilt); p.set(7, 2, gold); p.set(8, 2, gold);
    return { w: 16, h: 24, px: p.px, sh: null };
  });
  makeSprite('bonfire', frames, { fps: 10 });
  makeSprite('bonfire_unlit', [(() => { const p = new Pix(16, 24); const f = frames[0]; for (let i = 0; i < f.px.length; i++) { const q = f.px[i]; if (q >>> 24 && (pxR(q) < 150 || pxG(q) > 150 || pxB(q) > 120)) p.px[i] = q; } return { w: 16, h: 24, px: p.px, sh: null }; })()]);
  makeSprite('torch', genFire(6, 12, 8, 3, EMBER_PAL, 1.2).map(f => { const p = new Pix(6, 14); p.blit(f, 0, 0); const wood = RGBA(80, 50, 30); p.set(2, 11, wood); p.set(3, 11, wood); p.set(2, 12, wood); p.set(3, 12, wood); p.set(2, 13, RGBA(60, 40, 25)); p.set(3, 13, RGBA(60, 40, 25)); return { w: 6, h: 14, px: p.px, sh: null }; }), { fps: 12 });
  makeSprite('fire', genFire(12, 16, 8, 11, EMBER_PAL, 1.2), { fps: 12 });
  makeSprite('blueflame', genFire(10, 14, 8, 5, BLUE_PAL, 1.1), { fps: 12 });
  makeSprite('greenflame', genFire(10, 14, 8, 9, GREEN_PAL, 1.1), { fps: 12 });
  makeSprite('purpleflame', genFire(10, 14, 8, 13, PURPLE_PAL, 1.1), { fps: 12 });
  makeSprite('soulglow', [genGlow(15, 120, 255, 160, 0.9)]);
  makeSprite('bloodstain', [genGlow(13, 60, 200, 90, 0.5), genGlow(13, 90, 230, 120, 0.7)], { fps: 3 });
  makeSprite('itemglow', [genGlow(13, 255, 240, 200, 0.6), genGlow(13, 255, 250, 230, 0.8)], { fps: 2 });
  makeSprite('firebolt', [genGlow(9, 255, 120, 20, 1), genGlow(9, 255, 170, 40, 1), genGlow(9, 255, 90, 10, 1)], { fps: 15 });
  makeSprite('icebolt', [genGlow(7, 120, 200, 255, 1), genGlow(7, 180, 230, 255, 1)], { fps: 12 });
  makeSprite('darkbolt', [genGlow(9, 160, 40, 220, 1), genGlow(9, 200, 90, 255, 1)], { fps: 12 });
  makeSprite('venombolt', [genGlow(7, 90, 220, 60, 1), genGlow(7, 140, 255, 90, 1)], { fps: 12 });
  makeSprite('arrow', [(() => { const p = new Pix(7, 3); const w = RGBA(170, 130, 80), t = RGBA(210, 210, 220), f = RGBA(230, 230, 230); for (let x = 1; x < 6; x++) p.set(x, 1, w); p.set(6, 1, t); p.set(0, 0, f); p.set(0, 2, f); p.set(1, 0, f); return { w: 7, h: 3, px: p.px, sh: null }; })()]);
  makeSprite('rock_proj', [(() => { const p = new Pix(5, 5); const g = RGBA(110, 100, 95), d = RGBA(70, 60, 55); p.rect(1, 0, 3, 5, g); p.rect(0, 1, 5, 3, g); p.set(1, 3, d); p.set(3, 1, d); p.set(2, 4, d); return { w: 5, h: 5, px: p.px, sh: null }; })()]);
  makeSprite('spark', [genGlow(5, 255, 220, 120, 1)]);
  makeSprite('healglow', [genGlow(11, 120, 255, 140, 0.8)]);
}

// ---- 20_render.js ----
// ===== Raycast renderer =====
const WH = 2.0;                 // wall height in world units
const LIGHT_K = 14;             // how many shade levels a fully lit cell removes
const R = {
  VW: 0, VH: 0, buf: null, img: null, cvs: null, ctx: null,
  zbuf: null, wallTop: null, wallBot: null,
  hfov: 1.25, planeLen: 0, projV: 0, horizon: 0, pitch: 0,
  camZ: 1.0, fogScale: 3.1, flick: 1, bob: 0, time: 0,
};
function initRenderer(w, h) {
  R.VW = w; R.VH = h;
  R.cvs = R.cvs || document.createElement('canvas');
  R.cvs.width = w; R.cvs.height = h;
  R.ctx = R.cvs.getContext('2d');
  R.img = R.ctx.createImageData(w, h);
  R.buf = new Uint32Array(R.img.data.buffer);
  R.zbuf = new Float32Array(w);
  R.wallTop = new Int16Array(w); R.wallBot = new Int16Array(w);
  R.planeLen = Math.tan(R.hfov / 2);
  R.projV = (w / 2) / R.planeLen;
}
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function renderWorld(map, cam, sprites) {
  const VW = R.VW, VH = R.VH, buf = R.buf, zbuf = R.zbuf, wallTop = R.wallTop, wallBot = R.wallBot;
  const px = cam.x, py = cam.y, dirX = Math.cos(cam.a), dirY = Math.sin(cam.a);
  const planeX = -dirY * R.planeLen, planeY = dirX * R.planeLen;
  const projV = R.projV, camZ = R.camZ + R.bob * 0.02;
  const horizon = (VH / 2 + R.pitch + R.bob) | 0; R.horizon = horizon;
  const fogScale = R.fogScale * R.flick;
  const mw = map.w, mh = map.h, type = map.type, wall = map.wall, light = map.light, doors = map.doors, doorIdx = map.doorIdx;
  const NL1 = NLV - 1;
  const fogFrame = FOG_WALL_IDS[((R.time * 8) | 0) % FOG_WALL_IDS.length];
  // ---- walls ----
  for (let x = 0; x < VW; x++) {
    const cameraX = 2 * x / VW - 1;
    const rdx = dirX + planeX * cameraX, rdy = dirY + planeY * cameraX;
    let mapX = px | 0, mapY = py | 0;
    const deltaX = rdx === 0 ? 1e30 : Math.abs(1 / rdx), deltaY = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
    let stepX, stepY, sideDistX, sideDistY;
    if (rdx < 0) { stepX = -1; sideDistX = (px - mapX) * deltaX; } else { stepX = 1; sideDistX = (mapX + 1 - px) * deltaX; }
    if (rdy < 0) { stepY = -1; sideDistY = (py - mapY) * deltaY; } else { stepY = 1; sideDistY = (mapY + 1 - py) * deltaY; }
    let side = 0, hit = 0, perpD = 1e9, wallX = 0, texId = 0, prevIdx = mapY * mw + mapX, steps = 0, isDoor = false;
    while (!hit && steps++ < 80) {
      if (sideDistX < sideDistY) { sideDistX += deltaX; mapX += stepX; side = 0; } else { sideDistY += deltaY; mapY += stepY; side = 1; }
      if (mapX < 0 || mapY < 0 || mapX >= mw || mapY >= mh) { hit = 2; break; }
      const idx = mapY * mw + mapX, t = type[idx];
      if (t === 1) {
        hit = 1;
        if (side === 0) { perpD = (mapX - px + (1 - stepX) / 2) / rdx; wallX = py + perpD * rdy; } else { perpD = (mapY - py + (1 - stepY) / 2) / rdy; wallX = px + perpD * rdx; }
        wallX -= Math.floor(wallX);
        texId = wall[idx];
        if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) wallX = 1 - wallX;
      } else if (t === 2) {
        const d = doors[doorIdx[idx]];
        let tt, hx, hy, ok = false;
        if (d.orient === 0) { // plane x = mapX+0.5 (walls N & S)
          if (rdx !== 0) { tt = (mapX + 0.5 - px) / rdx; hy = py + tt * rdy; if (tt > 0 && (hy | 0) === mapY) { wallX = hy - mapY; if (rdx > 0) wallX = 1 - wallX; ok = true; } }
        } else {
          if (rdy !== 0) { tt = (mapY + 0.5 - py) / rdy; hx = px + tt * rdx; if (tt > 0 && (hx | 0) === mapX) { wallX = hx - mapX; if (rdy < 0) wallX = 1 - wallX; ok = true; } }
        }
        if (ok) {
          const op = d.open;
          if (wallX >= op) { hit = 1; perpD = tt; wallX -= op; side = d.orient === 0 ? 0 : 1; texId = d.fog ? fogFrame : d.tex; isDoor = true; }
        }
        if (!hit) prevIdx = idx;
      } else prevIdx = idx;
    }
    if (hit !== 1) { zbuf[x] = 1e9; wallTop[x] = VH; wallBot[x] = -1; continue; }
    if (perpD < 0.02) perpD = 0.02;
    zbuf[x] = perpD;
    const lineH = projV / perpD;
    const top = horizon - (WH - camZ) * lineH, bot = horizon + camZ * lineH;
    const h = bot - top;
    let ys = Math.ceil(top), ye = Math.floor(bot);
    if (ys < 0) ys = 0; if (ye >= VH) ye = VH - 1;
    wallTop[x] = ys; wallBot[x] = ye;
    let lvl = perpD * fogScale - light[prevIdx] * LIGHT_K + (side === 1 ? 1.5 : 0);
    if (lvl < 0) lvl = 0; else if (lvl > NL1) lvl = NL1;
    lvl |= 0;
    let texX = (wallX * TW) | 0; if (texX > 15) texX = 15;
    const sh = WALLTEX[texId].sh;
    const base = lvl * (TW * WALL_TH) + texX * WALL_TH;
    const texStep = WALL_TH / h;
    let texPos = (ys - top) * texStep;
    let o = ys * VW + x;
    for (let y = ys; y <= ye; y++) {
      buf[o] = sh[base + ((texPos | 0) & 31)];
      texPos += texStep; o += VW;
    }
  }
  // ---- floor & ceiling ----
  const FSH = FLOOR_SETS._sh || (FLOOR_SETS._sh = FLOORTEX.map(t => t.sh));
  const ftex = map.floorTex, ctex = map.ceilTex;
  for (let y = 0; y < VH; y++) {
    let rowDist, isFloor;
    if (y > horizon) { rowDist = camZ * projV / (y - horizon); isFloor = true; }
    else if (y < horizon) { rowDist = (WH - camZ) * projV / (horizon - y) * 1.35; isFloor = false; }
    else continue;
    const stepX = rowDist * 2 * planeX / VW, stepY = rowDist * 2 * planeY / VW;
    let fx = px + rowDist * (dirX - planeX), fy = py + rowDist * (dirY - planeY);
    const lvlBase = rowDist * fogScale;
    if (lvlBase - LIGHT_K > NL1 + 2) {
      // fully fogged row: fill with fog colour of nearest texture cheaply
      const o0 = y * VW;
      for (let x = 0; x < VW; x++) {
        if (isFloor ? y <= wallBot[x] : y >= wallTop[x]) { fx += stepX; fy += stepY; continue; }
        let cx = fx | 0, cy = fy | 0; if (cx < 0) cx = 0; else if (cx >= mw) cx = mw - 1; if (cy < 0) cy = 0; else if (cy >= mh) cy = mh - 1;
        const idx = cy * mw + cx;
        buf[o0 + x] = FSH[isFloor ? ftex[idx] : ctex[idx]][NL1 * 256];
        fx += stepX; fy += stepY;
      }
      continue;
    }
    const o0 = y * VW;
    for (let x = 0; x < VW; x++) {
      if (isFloor ? y <= wallBot[x] : y >= wallTop[x]) { fx += stepX; fy += stepY; continue; }
      let cx = fx | 0, cy = fy | 0; if (cx < 0) cx = 0; else if (cx >= mw) cx = mw - 1; if (cy < 0) cy = 0; else if (cy >= mh) cy = mh - 1;
      const idx = cy * mw + cx;
      let lvl = lvlBase - light[idx] * LIGHT_K; if (lvl < 0) lvl = 0; else if (lvl > NL1) lvl = NL1;
      const tx = ((fx - cx) * 16) | 0, ty = ((fy - cy) * 16) | 0;
      buf[o0 + x] = FSH[isFloor ? ftex[idx] : ctex[idx]][(lvl | 0) * 256 + ty * 16 + tx];
      fx += stepX; fy += stepY;
    }
  }
  // ---- sprites ----
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const vis = [];
  for (let i = 0; i < sprites.length; i++) {
    const s = sprites[i];
    const sx = s.x - px, sy = s.y - py;
    const tx = invDet * (dirY * sx - dirX * sy), ty = invDet * (-planeY * sx + planeX * sy);
    if (ty <= 0.08) continue;
    s._tx = tx; s._ty = ty;
    vis.push(s);
  }
  vis.sort((a, b) => b._ty - a._ty);
  for (let i = 0; i < vis.length; i++) {
    const s = vis[i], ty = s._ty;
    const fr = s.spr.frames[s.frame % s.spr.frames.length];
    const fw = fr.w, fh = fr.h;
    const screenX = (VW / 2) * (1 + s._tx / ty) + (s.shake || 0) * projV / ty;
    const spH = s.h * projV / ty, spW = s.w * projV / ty;
    const bottom = horizon + (camZ - (s.z || 0)) * projV / ty;
    const top = bottom - spH, left = screenX - spW / 2;
    let xs = Math.ceil(left), xe = Math.floor(left + spW); if (xs < 0) xs = 0; if (xe >= VW) xe = VW - 1;
    let ys = Math.ceil(top), ye = Math.floor(bottom); if (ys < 0) ys = 0; if (ye >= VH) ye = VH - 1;
    if (xs > xe || ys > ye) continue;
    const cx = clamp(s.x | 0, 0, mw - 1), cy = clamp(s.y | 0, 0, mh - 1);
    let lvl = ty * fogScale * (s.emissive ? 0.35 : 1) - (s.emissive ? 0 : light[cy * mw + cx] * LIGHT_K);
    if (lvl < 0) lvl = 0; else if (lvl > NL1) lvl = NL1; lvl |= 0;
    const sh = shadedFrame(fr), base = lvl * fw * fh;
    const txStep = fw / spW, tyStep = fh / spH;
    const alpha = s.alpha == null ? 1 : s.alpha, aThr = (alpha * 16) | 0;
    const tint = s.tint; // [r,g,b,t]
    for (let x = xs; x <= xe; x++) {
      if (ty >= zbuf[x]) continue;
      const texX = ((x - left) * txStep) | 0;
      if (texX < 0 || texX >= fw) continue;
      let tpos = (ys - top) * tyStep, o = ys * VW + x;
      for (let y = ys; y <= ye; y++, o += VW, tpos += tyStep) {
        const p = sh[base + ((tpos | 0) * fw) + texX];
        if (!(p >>> 24)) continue;
        if (aThr < 16 && BAYER4[((y & 3) << 2) | (x & 3)] >= aThr) continue;
        if (tint) buf[o] = lerpPx(p, tint[0], tint[1], tint[2], tint[3]); else buf[o] = p;
      }
    }
  }
}
function presentFrame() { R.ctx.putImageData(R.img, 0, 0); }

// ---- 30_input.js ----
// ===== Input: keyboard, mouse, multitouch =====
const Input = {
  keys: {}, mx: 0, my: 0, turn: 0, pitchD: 0, actions: {}, held: {}, buttons: [], touchBtn: new Map(),
  joy: null, look: null, pointerLocked: false, isTouch: false, lastTap: 0, sensT: 0.0045, sensP: 0.9, anyKey: 0,
  init(viewEl) {
    const KEYMAP = { ' ': 'attack', 'Space': 'attack', 'ShiftLeft': 'dodge', 'ShiftRight': 'dodge', 'KeyF': 'flask', 'KeyE': 'interact', 'Enter': 'interact', 'KeyM': 'map', 'Escape': 'menu', 'Digit1': 'ab1', 'Digit2': 'ab2', 'Digit3': 'ab3', 'Digit4': 'ab4', 'KeyR': 'flask', 'Tab': 'menu', 'KeyI': 'menu' };
    window.addEventListener('keydown', e => {
      if (e.repeat) { if (KEYMAP[e.code]) e.preventDefault(); return; }
      this.keys[e.code] = true; this.anyKey++;
      const a = KEYMAP[e.code]; if (a) { this.press(a); e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'Tab' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; const a = KEYMAP[e.code]; if (a) this.held[a] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.held = {}; });
    // mouse
    viewEl.addEventListener('mousedown', e => {
      if (this.isTouch) return;
      const b = this.hitButton(e.clientX, e.clientY);
      if (b) { this.press(b.id); this.mouseBtn = b.id; return; }
      if (!this.pointerLocked) { try { const pr = viewEl.requestPointerLock && viewEl.requestPointerLock(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { } this.anyKey++; return; }
      if (e.button === 0) this.press('attack'); else if (e.button === 2) this.press('dodge');
    });
    viewEl.addEventListener('mouseup', () => { if (this.mouseBtn) { this.held[this.mouseBtn] = false; this.mouseBtn = null; } this.held.attack = false; });
    viewEl.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => { this.pointerLocked = document.pointerLockElement === viewEl; });
    window.addEventListener('mousemove', e => {
      if (this.pointerLocked) { this.turn += e.movementX * 0.0022; this.pitchD -= e.movementY * 0.35; }
      this.mouseX = e.clientX; this.mouseY = e.clientY;
    });
    // touch
    const ts = e => {
      this.isTouch = true; this.anyKey++;
      for (const t of e.changedTouches) {
        const b = this.hitButton(t.clientX, t.clientY);
        if (b) { this.touchBtn.set(t.identifier, b.id); this.press(b.id); continue; }
        if (!this.joy && t.clientX < window.innerWidth * 0.42) { this.joy = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY }; continue; }
        if (!this.look) { this.look = { id: t.identifier, lx: t.clientX, ly: t.clientY, sx: t.clientX, sy: t.clientY, t: performance.now(), moved: 0 }; continue; }
      }
      if (e.cancelable) e.preventDefault();
    };
    const tm = e => {
      for (const t of e.changedTouches) {
        if (this.joy && t.identifier === this.joy.id) { this.joy.x = t.clientX; this.joy.y = t.clientY; }
        else if (this.look && t.identifier === this.look.id) {
          const dx = t.clientX - this.look.lx, dy = t.clientY - this.look.ly;
          this.turn += dx * this.sensT; this.pitchD -= dy * this.sensP; this.look.lx = t.clientX; this.look.ly = t.clientY; this.look.moved += Math.abs(dx) + Math.abs(dy);
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    const te = e => {
      for (const t of e.changedTouches) {
        const bid = this.touchBtn.get(t.identifier);
        if (bid) { this.held[bid] = false; this.touchBtn.delete(t.identifier); this.release(bid); continue; }
        if (this.joy && t.identifier === this.joy.id) this.joy = null;
        else if (this.look && t.identifier === this.look.id) {
          if (this.look.moved < 12 && performance.now() - this.look.t < 250) this.press('tap', { x: t.clientX, y: t.clientY });
          this.look = null;
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener('touchstart', ts, { passive: false });
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', te, { passive: false });
    window.addEventListener('touchcancel', te, { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
  },
  hitButton(x, y) {
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      const b = this.buttons[i];
      if (x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 6) return b;
    }
    return null;
  },
  press(id, data) { this.actions[id] = (this.actions[id] || 0) + 1; this.held[id] = true; this.lastData = data; this.lastPressed = id; },
  release(id) { this.released = this.released || {}; this.released[id] = true; },
  consume(id) { if (this.actions[id]) { this.actions[id]--; return true; } return false; },
  // call once per frame to compute analogue axes
  update() {
    let mx = 0, my = 0;
    const k = this.keys;
    if (k.KeyW || k.ArrowUp) my += 1; if (k.KeyS || k.ArrowDown) my -= 1;
    if (k.KeyA) mx -= 1; if (k.KeyD) mx += 1;
    let turn = 0; if (k.ArrowLeft || k.KeyQ) turn -= 1; if (k.ArrowRight || k.KeyE && false) turn += 1; if (k.ArrowRight) turn += 1;
    this.turnKey = turn;
    if (this.joy) {
      const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy, r = 46;
      const d = Math.hypot(dx, dy), m = Math.min(1, d / r);
      if (d > 4) { mx = dx / d * m; my = -dy / d * m; }
    }
    const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
    this.mx = mx; this.my = my;
  },
  endFrame() { this.actions = {}; this.turn = 0; this.pitchD = 0; this.released = {}; this.lastPressed = null; },
};

// ---- 40_audio.js ----
// ===== Procedural audio (WebAudio) =====
const Snd = {
  ctx: null, master: null, musicGain: null, cur: null, muted: false, musicNodes: [], musicKind: null, musicTimer: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.35; this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate * 1.5, nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = nb.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = nb;
      if (this.musicKind) { const k = this.musicKind; this.musicKind = null; this.music(k); }
    } catch (e) { }
  },
  env(g, t, a, peak, dec, sus = 0) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + a + dec); },
  tone(type, f0, f1, dur, vol, a = 0.005, dest) {
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    this.env(g, t, a, vol, dur); o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  burst(dur, vol, f0, f1, q = 1, a = 0.003, type = 'bandpass') {
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q;
    const g = c.createGain(); this.env(g, t, a, vol, dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  },
  sfx(name) {
    if (!this.ctx || this.muted) return;
    const now = performance.now(); this.last = this.last || {}; if (this.last[name] && now - this.last[name] < 40) return; this.last[name] = now;
    switch (name) {
      case 'step': this.burst(0.07, 0.12, 300 + Math.random() * 200, 120, 1); break;
      case 'sword': this.burst(0.12, 0.35, 2500, 600, 0.8); this.tone('square', 220, 90, 0.1, 0.12); break;
      case 'mace': this.burst(0.14, 0.35, 900, 200, 1); this.tone('sine', 150, 60, 0.12, 0.2); break;
      case 'bow': this.burst(0.08, 0.25, 1800, 4000, 2); this.tone('triangle', 900, 300, 0.08, 0.1); break;
      case 'spark': this.tone('sine', 1200, 300, 0.15, 0.15); break;
      case 'fire': this.burst(0.35, 0.4, 400, 1800, 0.7, 0.02); this.tone('sawtooth', 120, 60, 0.3, 0.12); break;
      case 'explode': this.burst(0.5, 0.6, 200, 60, 0.5, 0.005, 'lowpass'); this.tone('sine', 90, 30, 0.4, 0.3); break;
      case 'cast': this.tone('sine', 500, 1500, 0.25, 0.12); this.burst(0.2, 0.1, 2000, 4000, 2); break;
      case 'hurt': this.burst(0.18, 0.45, 500, 100, 1, 0.003, 'lowpass'); this.tone('square', 110, 50, 0.15, 0.15); break;
      case 'block': this.tone('square', 600, 250, 0.1, 0.2); this.burst(0.1, 0.25, 3000, 1500, 1); break;
      case 'dodge': this.burst(0.18, 0.2, 400, 1600, 1, 0.01); break;
      case 'kill': this.burst(0.3, 0.3, 800, 100, 1, 0.005, 'lowpass'); this.tone('triangle', 300, 60, 0.3, 0.2); break;
      case 'bossdie': this.burst(1.4, 0.6, 600, 40, 1, 0.01, 'lowpass'); this.tone('sawtooth', 110, 25, 1.4, 0.3); this.tone('sine', 55, 20, 1.6, 0.4); break;
      case 'windup': this.tone('sawtooth', 160, 320, 0.3, 0.07, 0.05); break;
      case 'bosswind': this.tone('sawtooth', 80, 200, 0.6, 0.18, 0.05); this.burst(0.5, 0.15, 200, 800, 1, 0.1); break;
      case 'whoosh': this.burst(0.2, 0.2, 600, 2000, 1, 0.02); break;
      case 'charge': this.burst(0.5, 0.4, 200, 1200, 1, 0.02); this.tone('sawtooth', 60, 140, 0.5, 0.2, 0.05); break;
      case 'slam': this.burst(0.6, 0.7, 150, 40, 0.5, 0.003, 'lowpass'); this.tone('sine', 70, 25, 0.6, 0.5); break;
      case 'roar': this.tone('sawtooth', 90, 45, 0.9, 0.35, 0.05); this.tone('square', 140, 60, 0.7, 0.15, 0.05); this.burst(0.8, 0.3, 300, 100, 0.7, 0.05); break;
      case 'notice': this.tone('square', 300, 420, 0.12, 0.08); break;
      case 'died': this.tone('sine', 220, 55, 2.5, 0.35, 0.3); this.tone('sine', 165, 41, 2.5, 0.25, 0.3); this.burst(2, 0.15, 300, 60, 0.5, 0.5, 'lowpass'); break;
      case 'fallen': this.tone('triangle', 240, 80, 0.6, 0.25, 0.02); break;
      case 'bonfire': this.tone('sine', 220, 440, 1.2, 0.2, 0.3); this.tone('sine', 330, 660, 1.4, 0.15, 0.4); this.tone('sine', 440, 880, 1.6, 0.1, 0.5); break;
      case 'rest': this.tone('sine', 330, 330, 0.6, 0.15, 0.1); this.tone('sine', 495, 495, 0.8, 0.12, 0.2); break;
      case 'levelup': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.35, 0.18, 0.01), i * 90)); break;
      case 'item': this.tone('triangle', 660, 990, 0.25, 0.15, 0.01); this.tone('triangle', 990, 1320, 0.3, 0.1, 0.1); break;
      case 'chest': this.burst(0.15, 0.3, 500, 200, 1); this.tone('triangle', 520, 780, 0.3, 0.15, 0.05); break;
      case 'door': this.burst(0.35, 0.25, 200, 80, 0.8, 0.02, 'lowpass'); break;
      case 'unlock': this.tone('square', 800, 1200, 0.08, 0.15); this.tone('square', 1200, 600, 0.12, 0.12, 0.08); break;
      case 'locked': this.tone('square', 200, 180, 0.12, 0.15); break;
      case 'lever': this.burst(0.3, 0.35, 300, 100, 0.8, 0.01, 'lowpass'); this.tone('square', 150, 100, 0.2, 0.15); break;
      case 'break': this.burst(0.25, 0.45, 1500, 300, 1); break;
      case 'fog': this.burst(1.2, 0.3, 300, 2000, 0.5, 0.3); this.tone('sine', 440, 880, 1.2, 0.08, 0.5); break;
      case 'flask': this.tone('sine', 300, 600, 0.4, 0.15, 0.05); this.burst(0.3, 0.1, 800, 300, 1, 0.05); break;
      case 'heal': this.tone('sine', 520, 1040, 0.6, 0.15, 0.1); this.tone('sine', 780, 1560, 0.7, 0.1, 0.2); break;
      case 'blink': this.tone('sine', 1500, 200, 0.3, 0.15, 0.01); break;
      case 'summon': this.tone('sawtooth', 100, 400, 0.6, 0.12, 0.1); break;
      case 'victory': [330, 392, 494, 659, 784].forEach((f, i) => setTimeout(() => { this.tone('triangle', f, f, 0.8, 0.2, 0.02); this.tone('sine', f / 2, f / 2, 1, 0.15, 0.05); }, i * 160)); break;
      case 'ui': this.tone('square', 700, 900, 0.05, 0.06); break;
      case 'souls': this.tone('sine', 880, 1760, 0.2, 0.06, 0.01); break;
    }
  },
  music(kind) {
    this.musicKind = kind;
    if (!this.ctx) return;
    this.stopMusic();
    const c = this.ctx, t = c.currentTime;
    const mk = (type, f, vol, detune = 0) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; o.detune.value = detune; g.gain.value = 0; g.gain.linearRampToValueAtTime(vol, t + 3); o.connect(g); g.connect(this.musicGain); o.start(); this.musicNodes.push(o, g); return { o, g }; };
    if (kind === 'ambient') {
      mk('sine', 55, 0.25); mk('sine', 82.4, 0.12, 6); mk('triangle', 110, 0.05, -8);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 18; lfo.connect(lg); lg.connect(this.musicNodes[0].frequency); lfo.start(); this.musicNodes.push(lfo, lg);
      this.bell = true;
    } else if (kind === 'boss') {
      mk('sawtooth', 55, 0.12); mk('sawtooth', 58.3, 0.1); mk('square', 110, 0.04);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.type = 'square'; lfo.frequency.value = 2.2; lg.gain.value = 0.08; lfo.connect(lg); lg.connect(this.musicNodes[1].gain); lfo.start(); this.musicNodes.push(lfo, lg);
      this.bell = false;
    } else if (kind === 'title') { mk('sine', 65.4, 0.2); mk('sine', 98, 0.1, 5); mk('sine', 130.8, 0.05); this.bell = true; }
    else this.bell = false;
  },
  stopMusic() { for (const n of this.musicNodes) { try { n.stop && n.stop(); n.disconnect(); } catch (e) { } } this.musicNodes = []; },
  update(dt, boss) {
    if (!this.ctx) return;
    this.musicTimer -= dt;
    if (this.musicTimer <= 0) {
      this.musicTimer = boss ? 0.5 : 6 + Math.random() * 8;
      if (boss) { this.burst(0.25, 0.5, 120, 40, 0.5, 0.003, 'lowpass'); if (Math.random() < 0.3) this.tone('sine', 220 * (Math.random() < 0.5 ? 1 : 1.06), 220, 0.4, 0.08, 0.01, this.musicGain); }
      else if (this.bell && Math.random() < 0.6) { const f = [220, 261.6, 293.7, 329.6, 392][(Math.random() * 5) | 0]; this.tone('sine', f, f, 3, 0.12, 0.05, this.musicGain); this.tone('sine', f * 2.01, f * 2, 2, 0.04, 0.05, this.musicGain); }
    }
  },
};

// ---- 50_world.js ----
// ===== World definition: zones, enemies, items, map builder =====
const ENEMY_DEFS = {
  // tier 1 - Undercroft
  ScarecrowGolem: { name: 'Scarecrow Husk', hp: 26, dmg: [4, 8], spd: 1.2, souls: 18, size: 0.9, behav: 'melee', poise: 0, color: '#c9a86b' },
  GoblinFighter: { name: 'Goblin Cutthroat', hp: 34, dmg: [6, 11], spd: 1.9, souls: 32, size: 0.85, behav: 'melee', poise: 0, cd: 1.3 },
  GoblinArcher: { name: 'Goblin Archer', hp: 24, dmg: [6, 10], spd: 1.6, souls: 34, size: 0.85, behav: 'ranged', proj: 'arrow', range: 7, poise: 0 },
  HungryMimic: { name: 'Mimic', hp: 95, dmg: [14, 22], spd: 1.1, souls: 160, size: 0.95, behav: 'melee', poise: 20, mimic: true, cd: 1.1 },
  StoneGolem: { name: 'Crypt Warden', hp: 130, dmg: [12, 18], spd: 0.8, souls: 220, size: 1.15, behav: 'melee', poise: 40, unique: true },
  BestialMinotaur: { name: 'Asterion, Warden of the Undercroft', hp: 620, dmg: [20, 32], spd: 1.7, souls: 1500, size: 1.75, behav: 'melee', poise: 999, boss: true, special: 'charge', cd: 1.6 },
  // tier 2 - Mossgrave
  CorruptedTreant: { name: 'Blighted Treant', hp: 72, dmg: [10, 16], spd: 0.9, souls: 60, size: 1.0, behav: 'melee', poise: 15 },
  SneakySatyr: { name: 'Satyr Trickster', hp: 44, dmg: [8, 13], spd: 2.3, souls: 55, size: 0.9, behav: 'melee', poise: 0, cd: 1.1 },
  GoblinOccultist: { name: 'Goblin Occultist', hp: 40, dmg: [10, 15], spd: 1.5, souls: 70, size: 0.85, behav: 'ranged', proj: 'darkbolt', range: 7, poise: 0 },
  GreenNaga: { name: 'Grave Naga', hp: 115, dmg: [14, 20], spd: 1.3, souls: 125, size: 1.05, behav: 'melee', poise: 25, venom: true },
  GoblinWolfRider: { name: 'Wolf Rider', hp: 62, dmg: [11, 16], spd: 2.6, souls: 85, size: 0.95, behav: 'melee', poise: 5, cd: 1.0 },
  GelatinousCube: { name: 'Gelatinous Cube', hp: 170, dmg: [12, 18], spd: 0.55, souls: 140, size: 1.15, behav: 'melee', poise: 60 },
  NatureElemental: { name: 'Mossheart', hp: 220, dmg: [16, 24], spd: 1.0, souls: 420, size: 1.3, behav: 'melee', poise: 50, unique: true },
  GrizzledTreant: { name: 'The Rotten Elder', hp: 1200, dmg: [24, 36], spd: 0.85, souls: 3200, size: 1.95, behav: 'melee', poise: 999, boss: true, special: 'summon', summon: 'CorruptedTreant', cd: 1.9 },
  // tier 3 - Frozen Reliquary
  IceGolem: { name: 'Rime Golem', hp: 135, dmg: [16, 24], spd: 0.95, souls: 165, size: 1.1, behav: 'melee', poise: 35 },
  CapableCryomancer: { name: 'Cryomancer', hp: 72, dmg: [14, 20], spd: 1.3, souls: 150, size: 0.9, behav: 'ranged', proj: 'icebolt', range: 8, poise: 0, chill: true },
  BlinkDog: { name: 'Blink Hound', hp: 62, dmg: [12, 18], spd: 2.2, souls: 135, size: 0.8, behav: 'melee', poise: 0, blink: true, cd: 1.0 },
  WaterElemental: { name: 'Water Elemental', hp: 115, dmg: [15, 22], spd: 1.4, souls: 175, size: 1.0, behav: 'melee', poise: 20 },
  FrostMagus: { name: 'Frost Magus', hp: 95, dmg: [18, 26], spd: 1.2, souls: 230, size: 0.95, behav: 'ranged', proj: 'icebolt', range: 8, poise: 5, volley: 3, chill: true },
  MithrilConstruct: { name: 'Sentinel of the Reliquary', hp: 2000, dmg: [28, 42], spd: 1.15, souls: 6500, size: 1.95, behav: 'melee', poise: 999, boss: true, special: 'slam', cd: 1.8 },
  // tier 4 - Molten Gallery
  FireElemental: { name: 'Fire Elemental', hp: 150, dmg: [20, 28], spd: 1.5, souls: 240, size: 1.0, behav: 'melee', poise: 15, emissive: true },
  NovicePyromancer: { name: 'Pyromancer', hp: 92, dmg: [20, 30], spd: 1.3, souls: 235, size: 0.9, behav: 'ranged', proj: 'firebolt', range: 8, poise: 0 },
  FlameMagus: { name: 'Flame Magus', hp: 125, dmg: [22, 32], spd: 1.2, souls: 310, size: 0.95, behav: 'ranged', proj: 'firebolt', range: 8, poise: 5, volley: 3 },
  ObsidianGolem: { name: 'Obsidian Golem', hp: 270, dmg: [26, 36], spd: 0.8, souls: 410, size: 1.2, behav: 'melee', poise: 60 },
  BrassGolem: { name: 'Brass Golem', hp: 210, dmg: [22, 32], spd: 1.0, souls: 360, size: 1.15, behav: 'melee', poise: 45 },
  MoltenEfreeti: { name: 'Ifrit of the Brass Gate', hp: 3200, dmg: [34, 50], spd: 1.45, souls: 13000, size: 2.0, behav: 'ranged', proj: 'firebolt', range: 9, volley: 3, poise: 999, boss: true, special: 'charge', emissive: true, cd: 1.5 },
  // tier 5 - Cosmic Sanctum
  ConjuringBeholder: { name: 'Beholder', hp: 250, dmg: [28, 40], spd: 1.0, souls: 620, size: 1.1, behav: 'ranged', proj: 'darkbolt', range: 9, volley: 3, poise: 30, zoff: 0.35 },
  MasterIllusionist: { name: 'Illusionist', hp: 125, dmg: [26, 36], spd: 1.3, souls: 460, size: 0.95, behav: 'ranged', proj: 'darkbolt', range: 8, poise: 0, blink: true },
  GraniteGargoyle: { name: 'Gargoyle', hp: 225, dmg: [26, 36], spd: 1.9, souls: 510, size: 1.05, behav: 'melee', poise: 40 },
  AirElemental: { name: 'Air Elemental', hp: 185, dmg: [24, 34], spd: 2.3, souls: 490, size: 1.0, behav: 'melee', poise: 10, zoff: 0.2 },
  AdeptNecromancer: { name: 'Necromancer', hp: 155, dmg: [24, 34], spd: 1.1, souls: 660, size: 0.95, behav: 'ranged', proj: 'darkbolt', range: 8, poise: 5, summon: 'ScarecrowGolem' },
  VileWitch: { name: 'Vile Witch', hp: 145, dmg: [26, 38], spd: 1.3, souls: 530, size: 0.95, behav: 'ranged', proj: 'venombolt', range: 8, poise: 5, venom: true },
  FleshGolem: { name: 'Flesh Golem', hp: 310, dmg: [28, 40], spd: 1.05, souls: 430, size: 1.2, behav: 'melee', poise: 70 },
  PowerfulDjinn: { name: 'Djinn of the Last Wish', hp: 950, dmg: [30, 42], spd: 1.6, souls: 4000, size: 1.5, behav: 'ranged', proj: 'darkbolt', range: 8, poise: 300, unique: true, blink: true },
  AdamantiumGolem: { name: 'The Ashen King', hp: 5600, dmg: [40, 58], spd: 1.3, souls: 60000, size: 2.2, behav: 'melee', poise: 999, boss: true, special: 'slam', summon: 'FleshGolem', enrage: 0.4, cd: 1.7 },
  // extras
  FluttringPixie: null,
};
delete ENEMY_DEFS.FluttringPixie;

const ZONES = [
  { id: 'under', name: 'The Undercroft', theme: 'stone', floors: 'stone', ambient: 0.05, keyName: 'Undercroft Key' },
  { id: 'moss', name: 'Mossgrave Catacombs', theme: 'moss', floors: 'moss', ambient: 0.04 },
  { id: 'ice', name: 'The Frozen Reliquary', theme: 'ice', floors: 'ice', ambient: 0.08 },
  { id: 'ember', name: 'The Molten Gallery', theme: 'ember', floors: 'ember', ambient: 0.12 },
  { id: 'cosmic', name: 'The Cosmic Sanctum', theme: 'cosmic', floors: 'cosmic', ambient: 0.06 },
  { id: 'cistern', name: 'The Sunken Cistern', theme: 'slime', floors: 'slime', ambient: 0.05 },
  { id: 'crypt', name: 'Chapel of the Hollow Crown', theme: 'crypt', floors: 'crypt', ambient: 0.03 },
  { id: 'cathedral', name: 'Cathedral of Ash', theme: 'grey', floors: 'grey', ambient: 0.05 },
];
const ZONE_BY_ID = {}; ZONES.forEach((z, i) => { z.idx = i; ZONE_BY_ID[z.id] = z; });

const ITEM_DEFS = {
  ember: { name: 'Ember', icon: 'fire', lore: 'A smouldering ember, still warm with the memory of a greater flame. Strengthens the Estus Flask by one draught.', use: 'estus+' },
  key_reliquary: { name: 'Reliquary Key', icon: 'key_silver', lore: 'A key of frosted silver, taken from the roots of the Rotten Elder. Opens the sealed door beneath the Undercroft.' },
  key_brass: { name: 'Brass Gate Key', icon: 'key_gold', lore: 'The Ifrit guarded this key for an age. It opens the Brass Gate to the Sanctum.' },
  soul_small: { name: 'Soul of a Lost Pilgrim', icon: 'soulglow', lore: 'The soul of one who came seeking the Mandate and found only the dark. Use to gain 300 souls.', souls: 300 },
  soul_large: { name: 'Soul of a Nameless Knight', icon: 'soulglow', lore: 'A knight of the old order. He did not kneel. Use to gain 1500 souls.', souls: 1500 },
  soul_huge: { name: 'Soul of the Forsaken Queen', icon: 'soulglow', lore: 'She wore the crown while the king slept. Use to gain 5000 souls.', souls: 5000 },
  heart: { name: 'Humanity', icon: 'heart', lore: 'A warm, beating thing. Raises the maximum health of every living companion by a small measure.', use: 'hp+' },
  gem_red: { name: 'Ruby of Might', icon: 'gem_red', lore: 'Light caught in red stone. Grants +1 Might to every companion.', stat: 'mt' },
  gem_blue: { name: 'Sapphire of Wit', icon: 'gem_blue', lore: 'Cold and clear. Grants +1 Intellect to every companion.', stat: 'it' },
  gem_green: { name: 'Emerald of Vigour', icon: 'gem_green', lore: 'It pulses faintly. Grants +1 Endurance to every companion.', stat: 'en' },
  gem_purple: { name: 'Amethyst of Haste', icon: 'gem_purple', lore: 'Swift as thought. Grants +1 Speed to every companion.', stat: 'sp' },
  titanite: { name: 'Titanite Shard', icon: 'rock', lore: 'A shard of the stone that fell with the first light. Reinforces the party\'s weapons.', use: 'weapon+' },
  crown: { name: 'The Hollow Crown', icon: 'trophy', lore: 'The crown of the Ashen King. It is lighter than it looks, and heavier than it should be.' },
};

// map builder --------------------------------------------------------
const MW = 64, MH = 80;
const WORLD = { w: MW, h: MH, grid: null, zoneOf: null, objects: [], spawns: [], lore: {}, bosses: [] };
function buildWorldGrid() {
  const g = new Array(MW * MH).fill(' '), zo = new Uint8Array(MW * MH);
  const at = (x, y) => g[y * MW + x];
  const set = (x, y, c) => { g[y * MW + x] = c; };
  let curZone = 0;
  const zone = id => { curZone = ZONE_BY_ID[id].idx; };
  const carve = (x0, y0, x1, y1, c = '.') => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { set(x, y, c); zo[y * MW + x] = curZone; } };
  const put = (x, y, c) => { set(x, y, c); zo[y * MW + x] = curZone; };
  const puts = (c, ...pts) => pts.forEach(([x, y]) => put(x, y, c));
  const obj = (type, x, y, extra) => WORLD.objects.push(Object.assign({ type, x, y, zone: curZone }, extra));
  const spawn = (kind, x, y, extra) => WORLD.spawns.push(Object.assign({ kind, x, y, zone: curZone }, extra));
  const lore = (x, y, text) => { put(x, y, '?'); WORLD.lore[x + ',' + y] = text; };
  const item = (x, y, id) => obj('item', x, y, { item: id });
  const chest = (x, y, loot, big) => obj('chest', x, y, { loot, big: !!big });

  // ================= THE UNDERCROFT (0-27, 0-27) =================
  zone('under');
  // awakening cell
  carve(2, 2, 4, 4); put(3, 3, 'P'); put(3, 5, 'D');
  obj('deco', 2.5, 2.5, { spr: 'bones' }); obj('deco', 4.5, 2.5, { spr: 'skull' });
  lore(4, 4, 'The cell door hangs open. Someone, or something, wanted you to leave.');
  // corridor down to hub
  carve(3, 6, 3, 9); carve(3, 9, 9, 9);
  obj('torch', 3.5, 7.5, {}); obj('torch', 6.5, 9.5, {});
  spawn('ScarecrowGolem', 5.5, 9.5);
  // hub room with bonfire and keeper
  carve(9, 9, 17, 17);
  put(13, 13, 'b'); obj('npc', 14.5, 11.5, { npc: 'keeper' });
  obj('torch', 9.5, 10.5, {}); obj('torch', 17.5, 10.5, {}); obj('torch', 9.5, 16.5, {}); obj('torch', 17.5, 16.5, {});
  obj('deco', 10.5, 9.5, { spr: 'statue' }); obj('deco', 16.5, 9.5, { spr: 'statue' });
  obj('deco', 10.5, 17.5, { spr: 'pot' }); obj('deco', 16.5, 17.5, { spr: 'pot_dark' });
  lore(13, 10, 'Bonfire of the Undercroft. Rest here, and the dark will forget you for a while.');
  // north treasure room
  carve(11, 7, 11, 8); carve(9, 2, 15, 6);
  spawn('ScarecrowGolem', 10.5, 3.5); spawn('ScarecrowGolem', 14.5, 5.5); spawn('GoblinFighter', 12.5, 3.5, { home: true });
  chest(13.5, 2.5, { souls: 120 }); obj('breakable', 9.5, 5.5, { spr: 'pot' }); obj('breakable', 15.5, 2.5, { spr: 'pot_gold' });
  obj('torch', 12.5, 2.5, {}); obj('deco', 9.5, 2.5, { spr: 'barrel' });
  item(11.5, 5.5, 'soul_small');
  // west wing: goblin warren + mimic
  carve(8, 14, 8, 14); carve(1, 11, 7, 19);
  puts('#', [4, 13], [4, 14], [4, 15], [4, 16]);
  spawn('GoblinFighter', 2.5, 12.5); spawn('GoblinArcher', 6.5, 18.5); spawn('GoblinFighter', 2.5, 18.5); spawn('GoblinArcher', 2.5, 15.5);
  spawn('HungryMimic', 6.5, 12.5);
  chest(1.5, 11.5, { souls: 80 }); obj('deco', 6.5, 11.5, { spr: 'crate' }); obj('deco', 1.5, 18.5, { spr: 'barrel2' });
  obj('torch', 7.5, 15.5, {}); obj('brazier', 1.5, 14.5, { spr: 'brazier_red' });
  lore(7, 19, 'Chests have teeth here. Count their locks before you count their gold.');
  item(5.5, 16.5, 'gem_green');
  // east: fog gate and minotaur arena
  carve(18, 13, 20, 13); put(21, 13, 'F');
  obj('torch', 19.5, 12.5, {});
  carve(22, 8, 26, 18); put(27, 13, 'D');
  spawn('BestialMinotaur', 24.5, 12.5, { boss: true, arena: 'under', gates: [[21, 13]] });
  obj('brazier', 22.5, 8.5, { spr: 'brazier_red' }); obj('brazier', 26.5, 8.5, { spr: 'brazier_red' }); obj('brazier', 22.5, 18.5, { spr: 'brazier_red' }); obj('brazier', 26.5, 18.5, { spr: 'brazier_red' });
  obj('deco', 24.5, 8.5, { spr: 'skull_dark' }); obj('deco', 23.5, 18.5, { spr: 'bones' });
  // south: corridor to locked reliquary door
  carve(13, 18, 13, 24); put(13, 25, 'K'); carve(13, 26, 13, 29);
  obj('torch', 13.5, 20.5, {}); obj('torch', 13.5, 23.5, {});
  spawn('StoneGolem', 13.5, 22.5, { unique: true });
  lore(12, 24, 'Sealed by the Reliquary\'s key. The Elder of Mossgrave holds it in his roots.');
  // shortcut corridor from hub SE to Mossgrave (gate opened from the far side)
  carve(18, 16, 26, 16); carve(26, 17, 26, 20); put(27, 20, 'G');
  obj('torch', 22.5, 15.5, {});
  // crypt chapel (dark side area, Crypt Warden guards a soul)
  zone('crypt');
  carve(19, 2, 25, 6); carve(19, 7, 19, 12); carve(18, 11, 18, 11);
  // link hub NE corner to chapel corridor
  zone('under'); carve(18, 11, 18, 11);
  zone('crypt');
  spawn('GoblinArcher', 20.5, 3.5); spawn('GoblinFighter', 24.5, 5.5); spawn('ScarecrowGolem', 22.5, 2.5);
  obj('deco', 19.5, 2.5, { spr: 'coffin' }); obj('deco', 25.5, 2.5, { spr: 'coffin_dark' }); obj('deco', 22.5, 2.5, { spr: 'altar' });
  obj('brazier', 20.5, 6.5, { spr: 'brazier_purple' }); obj('brazier', 24.5, 6.5, { spr: 'brazier_purple' });
  chest(22.5, 3.5, { item: 'soul_large' }, true);
  lore(20, 12, 'Chapel of the Hollow Crown. They buried the queen standing, so she could keep watching the door.');

  // ================= MOSSGRAVE CATACOMBS (28-63, 0-27) =================
  zone('moss');
  carve(28, 13, 31, 13); carve(32, 9, 41, 18); // graveyard hall
  obj('torch', 29.5, 12.5, {});
  for (const [x, y] of [[33, 10], [35, 10], [37, 10], [39, 10], [33, 17], [35, 17], [37, 17], [39, 17]]) obj('deco', x + 0.5, y + 0.5, { spr: hash2(x, y) > 0.5 ? 'grave' : 'grave2' });
  obj('deco', 36.5, 13.5, { spr: 'coffin_open' }); obj('deco', 33.5, 13.5, { spr: 'bigpot_moss' }); obj('deco', 40.5, 14.5, { spr: 'bush' });
  spawn('CorruptedTreant', 34.5, 12.5); spawn('CorruptedTreant', 39.5, 15.5); spawn('SneakySatyr', 37.5, 11.5); spawn('GoblinOccultist', 40.5, 10.5); spawn('SneakySatyr', 33.5, 16.5);
  obj('brazier', 32.5, 9.5, { spr: 'brazier_green' }); obj('brazier', 41.5, 18.5, { spr: 'brazier_green' });
  obj('breakable', 41.5, 9.5, { spr: 'pot' }); obj('breakable', 32.5, 18.5, { spr: 'pot' });
  lore(32, 16, 'Mossgrave. The dead here were planted, not buried. Mind the roots.');
  // shortcut lever corridor back to Undercroft gate
  carve(29, 18, 31, 18); carve(29, 19, 29, 20); carve(28, 20, 28, 20); obj('lever', 29.5, 20.5, { gate: [27, 20] });
  spawn('GoblinOccultist', 30.5, 18.5);
  // north: to bonfire
  carve(36, 4, 36, 8); carve(42, 3, 47, 7); carve(37, 5, 41, 5);
  put(44, 5, 'b'); obj('torch', 42.5, 3.5, {}); obj('torch', 47.5, 3.5, {});
  obj('deco', 42.5, 7.5, { spr: 'bush' }); obj('deco', 47.5, 7.5, { spr: 'bush_yellow' });
  spawn('SneakySatyr', 38.5, 5.5); spawn('GoblinWolfRider', 36.5, 6.5);
  lore(47, 5, 'A bonfire among the roots. Even the Elder will not come this close to it.');
  // east crypt: naga and cube, items
  carve(48, 5, 49, 5); carve(50, 2, 60, 10);
  puts('#', [54, 4], [55, 4], [56, 4], [54, 8], [55, 8], [56, 8]);
  spawn('GreenNaga', 52.5, 3.5); spawn('GelatinousCube', 58.5, 6.5); spawn('GoblinOccultist', 55.5, 6.5); spawn('GoblinWolfRider', 51.5, 8.5); spawn('CorruptedTreant', 58.5, 2.5);
  chest(59.5, 9.5, { souls: 400 }); item(50.5, 9.5, 'heart'); obj('breakable', 52.5, 9.5, { spr: 'pot_gold' });
  obj('brazier', 50.5, 2.5, { spr: 'brazier_green' }); obj('brazier', 60.5, 2.5, { spr: 'brazier_green' });
  obj('deco', 55.5, 2.5, { spr: 'coffin' }); obj('deco', 55.5, 9.5, { spr: 'bigpot' });
  lore(60, 10, 'The Mossheart sleeps in the deep cistern. Its roots drink from something older than water.');
  // boss approach and arena
  carve(42, 8, 42, 18); carve(42, 19, 48, 19); put(49, 19, 'F'); carve(50, 14, 61, 24); put(50, 25, 'G'); obj('lever', 51.5, 23.5, { gate: [50, 25] }); // south gate leads to cistern
  spawn('CorruptedTreant', 42.5, 15.5); obj('torch', 44.5, 18.5, {}); obj('torch', 47.5, 18.5, {});
  spawn('GrizzledTreant', 56.5, 19.5, { boss: true, arena: 'moss', gates: [[49, 19]] });
  obj('deco', 51.5, 14.5, { spr: 'bush' }); obj('deco', 60.5, 14.5, { spr: 'bush' }); obj('deco', 51.5, 23.5, { spr: 'rock_moss' }); obj('deco', 60.5, 23.5, { spr: 'bush_yellow' });
  obj('brazier', 55.5, 14.5, { spr: 'brazier_green' }); obj('brazier', 57.5, 14.5, { spr: 'brazier_green' });
  chest(60.5, 20.5, { item: 'key_reliquary' }, true);
  item(52.5, 22.5, 'titanite');
  // ---- Sunken Cistern (optional loop under Mossgrave) ----
  zone('cistern');
  carve(50, 26, 50, 26); carve(44, 26, 50, 26); carve(44, 20, 44, 25); // cistern loops back to the boss approach
  puts('w', [46, 26], [47, 26], [48, 26]);
  spawn('GelatinousCube', 47.5, 26.5); spawn('GreenNaga', 44.5, 23.5);
  spawn('NatureElemental', 50.5, 26.5, { unique: true });
  item(44.5, 26.5, 'ember');
  lore(43, 25, 'The Sunken Cistern. What the Mossheart guards, it guards jealously.');

  // ================= FROZEN RELIQUARY (0-27, 28-55) =================
  zone('ice');
  carve(13, 29, 13, 31); carve(6, 31, 13, 31); carve(3, 30, 8, 35); put(5, 33, 'b');
  obj('torch', 3.5, 30.5, {}); obj('torch', 8.5, 30.5, {}); obj('brazier', 3.5, 35.5, { spr: 'brazier_blue' }); obj('brazier', 8.5, 35.5, { spr: 'brazier_blue' });
  lore(7, 34, 'The Frozen Reliquary. The Sentinel does not sleep. It only waits.');
  // ice halls
  carve(5, 36, 5, 40); carve(2, 40, 12, 44); puts('w', [6, 41], [7, 41], [8, 41], [6, 42], [7, 42], [8, 42]);
  spawn('IceGolem', 3.5, 43.5); spawn('CapableCryomancer', 11.5, 41.5); spawn('BlinkDog', 10.5, 43.5); spawn('WaterElemental', 7.5, 40.5);
  obj('deco', 2.5, 40.5, { spr: 'rock' }); obj('deco', 12.5, 44.5, { spr: 'alcove_statue' }); obj('breakable', 2.5, 44.5, { spr: 'pot' });
  obj('brazier', 7.5, 44.5, { spr: 'brazier_blue' });
  chest(11.5, 40.5, { souls: 700 });
  // long gallery east
  carve(13, 42, 13, 42); carve(14, 36, 24, 40);
  puts('#', [18, 38], [19, 38], [20, 38]);
  carve(14, 38, 14, 41);
  spawn('FrostMagus', 22.5, 37.5); spawn('IceGolem', 16.5, 39.5); spawn('BlinkDog', 23.5, 39.5); spawn('CapableCryomancer', 17.5, 36.5);
  obj('torch', 15.5, 35.5, {}); obj('torch', 23.5, 35.5, {}); obj('deco', 24.5, 36.5, { spr: 'coffin_dark' }); obj('deco', 14.5, 36.5, { spr: 'statue' });
  item(24.5, 40.5, 'gem_blue'); obj('breakable', 20.5, 39.5, { spr: 'pot_dark' });
  lore(16, 36, 'Pilgrims froze here mid-prayer. The Sentinel let them finish.');
  // shortcut gate from arena approach back to bonfire halls
  carve(9, 45, 9, 46); put(9, 47, 'G'); carve(9, 48, 13, 48);
  // arena
  carve(14, 47, 14, 47); put(14, 47, 'F'); carve(13, 44, 13, 47);
  carve(24, 41, 24, 43); carve(20, 43, 24, 43); carve(20, 44, 20, 46); // winding approach
  carve(15, 43, 25, 52); // arena
  obj('lever', 10.5, 48.5, { gate: [9, 47] });
  spawn('MithrilConstruct', 20.5, 48.5, { boss: true, arena: 'ice', gates: [[14, 47]] });
  for (const [x, y] of [[15, 43], [25, 43], [15, 52], [25, 52]]) obj('brazier', x + 0.5, y + 0.5, { spr: 'brazier_blue' });
  obj('deco', 20.5, 43.5, { spr: 'alcove_statue' }); obj('deco', 16.5, 51.5, { spr: 'bones' }); obj('deco', 24.5, 51.5, { spr: 'skull' });
  chest(24.5, 45.5, { item: 'soul_large' }, true);
  // exit east to the molten gallery
  carve(26, 48, 27, 48); put(27, 48, 'D');
  spawn('WaterElemental', 22.5, 43.5); spawn('IceGolem', 20.5, 45.5, { sleep: true });

  // ================= MOLTEN GALLERY (28-63, 28-55) =================
  zone('ember');
  carve(28, 48, 30, 48); carve(31, 44, 36, 49); put(33, 46, 'b');
  obj('torch', 31.5, 43.5, {}); obj('torch', 36.5, 43.5, {}); obj('deco', 31.5, 49.5, { spr: 'rock_ember' }); obj('deco', 36.5, 49.5, { spr: 'rock_lava' });
  lore(35, 48, 'The Molten Gallery. The Ifrit forged the Brass Gate, and then forgot what it was for.');
  // lava lake hall (main path)
  carve(33, 36, 33, 43); carve(38, 30, 60, 42);
  carve(33, 36, 37, 36);
  // lava pools
  for (let y = 32; y <= 40; y++) for (let x = 41; x <= 57; x++) if (!((x >= 48 && x <= 50) || y === 36 || (x >= 41 && x <= 43 && y >= 34 && y <= 38) || (x >= 55 && x <= 57 && y >= 34 && y <= 38))) put(x, y, '~');
  puts('.', [45, 33], [46, 33], [52, 39], [53, 39]);
  spawn('FireElemental', 44.5, 36.5); spawn('FireElemental', 54.5, 36.5); spawn('NovicePyromancer', 42.5, 34.5); spawn('NovicePyromancer', 56.5, 38.5); spawn('ObsidianGolem', 49.5, 33.5); spawn('BrassGolem', 49.5, 39.5); spawn('FlameMagus', 59.5, 31.5);
  obj('deco', 38.5, 30.5, { spr: 'rock_lava' }); obj('deco', 60.5, 30.5, { spr: 'rock_ember' }); obj('deco', 38.5, 42.5, { spr: 'bigpot_pattern' });
  chest(59.5, 41.5, { souls: 1500 }); item(38.5, 41.5, 'gem_red'); item(49.5, 36.5, 'soul_large');
  lore(39, 30, 'The lake does not cool. Walk the stone spines, and do not look down for long.');
  // boss approach from lake SE down to arena
  carve(58, 43, 58, 44); carve(45, 44, 58, 44); put(47, 45, 'F'); // arena below
  carve(40, 48, 46, 48); carve(45, 45, 45, 47); put(40, 48, 'G'); carve(37, 48, 39, 48); obj('lever', 41.5, 48.5, { gate: [40, 48] });
  carve(47, 46, 60, 54);
  spawn('MoltenEfreeti', 54.5, 50.5, { boss: true, arena: 'ember', gates: [[47, 45]] });
  for (const [x, y] of [[47, 46], [60, 46], [47, 54], [60, 54], [53, 46], [55, 46]]) obj('brazier', x + 0.5, y + 0.5, { spr: 'brazier_red' });
  chest(59.5, 53.5, { item: 'key_brass' }, true); item(48.5, 53.5, 'ember');
  obj('deco', 50.5, 46.5, { spr: 'skull_dark' }); obj('deco', 58.5, 46.5, { spr: 'bones' });
  // brass gate (locked) south to the sanctum
  carve(54, 55, 54, 55); put(54, 56, 'K'); carve(54, 57, 54, 58);
  lore(55, 54, 'The Brass Gate. Beyond it the ceiling is sky, and the sky is wrong.');

  // ================= COSMIC SANCTUM (0-63, 56-79) =================
  zone('cosmic');
  carve(50, 59, 58, 63); put(54, 61, 'b'); obj('torch', 50.5, 58.5, {}); obj('torch', 58.5, 58.5, {});
  obj('brazier', 50.5, 63.5, { spr: 'brazier_purple' }); obj('brazier', 58.5, 63.5, { spr: 'brazier_purple' });
  lore(57, 62, 'The Cosmic Sanctum. The Mandate of Heaven was written here, and here it was unwritten.');
  // winding way west
  carve(49, 61, 49, 61); carve(40, 58, 48, 64); // star hall
  spawn('ConjuringBeholder', 44.5, 61.5); spawn('GraniteGargoyle', 41.5, 59.5); spawn('AirElemental', 47.5, 63.5); spawn('MasterIllusionist', 41.5, 63.5);
  obj('deco', 40.5, 58.5, { spr: 'statue' }); obj('deco', 48.5, 58.5, { spr: 'statue' }); obj('deco', 44.5, 58.5, { spr: 'altar' });
  chest(40.5, 64.5, { souls: 3000 }); obj('breakable', 48.5, 64.5, { spr: 'pot_gold' });
  carve(32, 61, 39, 61); carve(32, 61, 32, 70); carve(24, 66, 38, 72); // necropolis hall
  spawn('AdeptNecromancer', 30.5, 68.5); spawn('VileWitch', 36.5, 70.5); spawn('FleshGolem', 27.5, 69.5); spawn('GraniteGargoyle', 35.5, 67.5); spawn('AirElemental', 25.5, 71.5);
  for (const [x, y] of [[25, 66], [28, 66], [31, 66], [34, 66], [37, 66]]) obj('deco', x + 0.5, y + 0.5, { spr: hash2(x, y) > 0.5 ? 'coffin_dark' : 'coffin' });
  obj('brazier', 24.5, 72.5, { spr: 'brazier_purple' }); obj('brazier', 38.5, 72.5, { spr: 'brazier_purple' });
  item(24.5, 66.5, 'gem_purple'); item(38.5, 66.5, 'heart'); chest(31.5, 72.5, { item: 'soul_huge' }, true);
  lore(33, 71, 'The King sits beyond the white light. He has been waiting a very long time to be relieved.');
  // djinn side chamber
  carve(36, 73, 36, 75); carve(33, 76, 39, 78); spawn('PowerfulDjinn', 36.5, 77.5, { unique: true }); item(33.5, 77.5, 'ember'); chest(39.5, 77.5, { souls: 5000 });
  obj('brazier', 33.5, 76.5, { spr: 'brazier_purple' }); obj('brazier', 39.5, 76.5, { spr: 'brazier_purple' });
  // final approach and arena
  carve(20, 69, 23, 69); put(19, 69, 'F'); carve(4, 61, 18, 77);
  spawn('AdamantiumGolem', 11.5, 69.5, { boss: true, arena: 'cosmic', gates: [[19, 69]], final: true });
  for (const [x, y] of [[4, 61], [18, 61], [4, 77], [18, 77], [11, 61], [11, 77]]) obj('brazier', x + 0.5, y + 0.5, { spr: 'brazier_purple' });
  obj('deco', 5.5, 69.5, { spr: 'alcove_statue' }); obj('deco', 7.5, 61.5, { spr: 'statue' }); obj('deco', 15.5, 61.5, { spr: 'statue' });
  zone('cathedral');
  // the ash throne at the far west of the arena
  carve(1, 67, 3, 71); obj('deco', 1.5, 69.5, { spr: 'trophy' }); obj('throne', 1.5, 69.5, {});

  // walls: every non-floor cell adjacent to floor becomes a themed wall; void stays wall too
  WORLD.grid = g; WORLD.zoneOf = zo;
  // propagate zone ids to wall cells from neighbouring floor (so themes follow rooms)
  const isFloor = c => c !== ' ' && c !== '#';
  const zo2 = new Uint8Array(zo);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const c = at(x, y); if (isFloor(c)) continue;
    let best = -1, bestD = 9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      if (isFloor(at(nx, ny))) { const d = Math.abs(dx) + Math.abs(dy); if (d < bestD) { bestD = d; best = zo[ny * MW + nx]; } }
    }
    if (best >= 0) zo2[y * MW + x] = best;
  }
  WORLD.zoneOf = zo2;
}

// ---- 60_game.js ----
// ===== Game state, map compile, party, player =====
const PARTY_DEFS = [
  { id: 'knight', name: 'Roderick', cls: 'Knight', spr: 'SkilledBattlemage', hp: 120, mt: 14, en: 14, it: 6, sp: 9, atk: 'melee', base: 11, rec: 1.3, armor: 0.2, ability: 'bulwark', color: '#d8b36a' },
  { id: 'archer', name: 'Sable', cls: 'Archer', spr: 'SilentRanger', hp: 85, mt: 11, en: 10, it: 8, sp: 14, atk: 'ranged', proj: 'arrow', base: 8, rec: 0.85, ability: 'volley', color: '#8ccf6a' },
  { id: 'cleric', name: 'Mira', cls: 'Cleric', spr: 'ExpertDruid', hp: 95, mt: 9, en: 11, it: 12, sp: 10, atk: 'melee', base: 7, rec: 1.4, ability: 'heal', color: '#9ad0f0' },
  { id: 'sorc', name: 'Vesper', cls: 'Sorcerer', spr: 'FlameMagus', hp: 70, mt: 6, en: 8, it: 16, sp: 11, atk: 'ranged', proj: 'spark', base: 5, rec: 1.0, ability: 'firebolt', color: '#e08a6a' },
];
const ABILITIES = {
  bulwark: { name: 'Bulwark', desc: 'Shields up: the party takes 70% less damage for 4s.', stam: 30, cd: 12, icon: 'sword' },
  volley: { name: 'Volley', desc: 'Loose five arrows in quick succession.', sp: 10, cd: 8, icon: 'arrow' },
  heal: { name: 'Heal', desc: 'Mend the wounds of every living companion.', sp: 15, cd: 6, icon: 'heart' },
  firebolt: { name: 'Fire Bolt', desc: 'Hurl a bolt of flame that bursts on impact.', sp: 12, cd: 3, icon: 'firebolt' },
};
const STAT_NAMES = { mt: 'Might', en: 'Endurance', it: 'Intellect', sp: 'Speed' };
const STAT_DESC = { mt: 'Weapon damage', en: 'Max HP & stamina', it: 'Spell power & SP', sp: 'Recovery & dodge' };
const SAVE_KEY = 'ashen_mandate_v1';
const S = {};
let MAP = null;

function levelCost(lv) { return Math.round(80 * Math.pow(lv, 1.55)); }
function makeMember(d) {
  return { id: d.id, name: d.name, cls: d.cls, spr: d.spr, level: 1, mt: d.mt, en: d.en, it: d.it, sp: d.sp, hp: d.hp, hpMax: d.hp, spMax: 20 + d.it * 2, spts: 20 + d.it * 2, rec: 0, cd: 0, bounce: 0, hurt: 0, dead: false, def: d, dmgPop: null };
}
function memberMaxHp(m) { return Math.round(m.def.hp + (m.en - m.def.en) * 8 + (m.level - 1) * 4 + (S.hpBonus || 0)); }
function memberMaxSp(m) { return Math.round(20 + m.it * 2.5 + (m.level - 1) * 2); }
function recalcMember(m) { const h = memberMaxHp(m), s = memberMaxSp(m); m.hp = Math.min(m.hp + (h - m.hpMax), h); m.hpMax = h; m.spts = Math.min(m.spts + (s - m.spMax), s); m.spMax = s; }

function newGame() {
  Object.assign(S, {
    mode: 'play', t: 0, party: PARTY_DEFS.map(makeMember), souls: 0, stam: 100, stamMax: 100, estus: 4, estusMax: 4, weaponLvl: 0, hpBonus: 0,
    items: {}, flags: { boss: {}, chest: {}, gate: {}, item: {}, bonfire: {}, unique: {}, door: {}, lore: {} },
    bonfire: null, bloodstain: null, pitch: 0, bulwark: 0, chill: 0, venom: 0, iframes: 0, dodge: null, shake: 0, flash: 0, hurtT: 0, deathT: 0,
    msgs: [], center: null, itemCard: null, boss: null, areaShown: -1, lastZone: -1, playTime: 0, bossKills: 0, deaths: 0, kills: 0, menu: null, ending: 0, bob: 0, walkT: 0,
  });
  const st = findStart();
  S.px = st.x + 0.5; S.py = st.y + 0.5; S.pa = Math.PI / 2;
  buildEntities();
  showCenter('ASHEN MANDATE', 'Four awaken in the dark', 4, 'area');
  message('You awaken in a cell beneath the Undercroft.');
}
function findStart() { const g = WORLD.grid; for (let i = 0; i < g.length; i++) if (g[i] === 'P') return { x: i % MW, y: (i / MW) | 0 }; return { x: 3, y: 3 }; }

// ---- map compile ----
function compileMap() {
  buildWorldGrid();
  const g = WORLD.grid, zo = WORLD.zoneOf, n = MW * MH;
  const map = { w: MW, h: MH, type: new Uint8Array(n), wall: new Uint16Array(n), floorTex: new Uint16Array(n), ceilTex: new Uint16Array(n), light: new Float32Array(n), doors: [], doorIdx: new Int16Array(n).fill(-1), zone: zo, slow: new Uint8Array(n), grid: g, explored: new Uint8Array(n) };
  const isFloorC = c => c !== ' ' && c !== '#';
  for (let i = 0; i < n; i++) {
    const c = g[i], x = i % MW, y = (i / MW) | 0, zone = ZONES[zo[i]], fs = FLOOR_SETS[zone.floors];
    const h = hash2(x * 7 + 3, y * 13 + 1);
    if (!isFloorC(c)) {
      map.type[i] = 1;
      let v = 0; if (h < 0.08) v = 1; else if (h < 0.15) v = 2;
      map.wall[i] = wallTexId(zone.theme, v);
      map.floorTex[i] = fs.floor[0]; map.ceilTex[i] = fs.ceil[0];
      continue;
    }
    map.floorTex[i] = fs.floor[(h * fs.floor.length) | 0]; map.ceilTex[i] = fs.ceil[(hash2(x, y * 3) * fs.ceil.length) | 0];
    if (c === '~') { map.type[i] = 3; map.floorTex[i] = FLOOR_SETS.lava.floor[(h * 4) | 0]; }
    else if (c === 'w') { map.slow[i] = 1; map.floorTex[i] = FLOOR_SETS.water.floor[(h * 4) | 0]; }
    if ('DKGF'.includes(c)) {
      map.type[i] = 2;
      const wallN = !isFloorC(g[i - MW]), wallS = !isFloorC(g[i + MW]);
      const orient = (wallN && wallS) ? 0 : 1;
      const d = { x, y, orient, open: 0, kind: c, tex: wallTexId(zone.theme, c === 'G' ? 4 : 3), fog: c === 'F', locked: c === 'K', gate: c === 'G', target: 0, timer: 0, id: x + ',' + y };
      map.doorIdx[i] = map.doors.length; map.doors.push(d);
    }
  }
  // lighting: BFS from sources along floor cells
  const amb = new Float32Array(n); for (let i = 0; i < n; i++) amb[i] = ZONES[zo[i]].ambient;
  const sources = [];
  for (const o of WORLD.objects) {
    if (o.type === 'torch') sources.push({ x: o.x | 0, y: o.y | 0, p: 0.75, r: 5 });
    else if (o.type === 'brazier') sources.push({ x: o.x | 0, y: o.y | 0, p: 0.9, r: 6 });
  }
  for (let i = 0; i < n; i++) { if (g[i] === 'b') sources.push({ x: i % MW, y: (i / MW) | 0, p: 1.0, r: 7 }); if (g[i] === '~') sources.push({ x: i % MW, y: (i / MW) | 0, p: 0.55, r: 3 }); }
  const passable = i => map.type[i] !== 1;
  for (const s of sources) {
    // make sure the source cell is passable (torches on walls light the neighbouring floor)
    let sx = s.x, sy = s.y;
    if (!passable(sy * MW + sx)) { let f = null; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = sx + dx, ny = sy + dy; if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && passable(ny * MW + nx)) { f = [nx, ny]; break; } } if (!f) continue; sx = f[0]; sy = f[1]; }
    const dist = new Map(); const q = [[sx, sy, 0]]; dist.set(sy * MW + sx, 0);
    while (q.length) {
      const [x, y, d] = q.shift(); const i = y * MW + x;
      const v = s.p * Math.max(0, 1 - d / s.r) ** 1.3;
      if (v > map.light[i]) map.light[i] = v;
      if (d >= s.r) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const j = ny * MW + nx; if (!passable(j) || dist.has(j)) continue; dist.set(j, d + 1); q.push([nx, ny, d + 1]); }
    }
  }
  for (let i = 0; i < n; i++) map.light[i] = Math.min(1, map.light[i] + amb[i]);
  MAP = map;
  return map;
}
const cellAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? 1 : MAP.type[(y | 0) * MW + (x | 0)];
function cellBlocked(x, y, forEnemy) {
  if (x < 0 || y < 0 || x >= MW || y >= MH) return true;
  const i = (y | 0) * MW + (x | 0), t = MAP.type[i];
  if (t === 1 || t === 3) return true;
  if (t === 2) { const d = MAP.doors[MAP.doorIdx[i]]; if (d.fog) return !forEnemy ? !(S.fogPass === d) : true; return d.open < 0.85; }
  return false;
}
function moveCircle(ent, dx, dy, r, forEnemy) {
  // axis-separated slide against the grid
  let nx = ent.x + dx;
  if (!(cellBlocked(nx + r, ent.y - r * 0.7, forEnemy) || cellBlocked(nx + r, ent.y + r * 0.7, forEnemy) || cellBlocked(nx - r, ent.y - r * 0.7, forEnemy) || cellBlocked(nx - r, ent.y + r * 0.7, forEnemy))) ent.x = nx; else ent.blocked = true;
  let ny = ent.y + dy;
  if (!(cellBlocked(ent.x - r * 0.7, ny + r, forEnemy) || cellBlocked(ent.x + r * 0.7, ny + r, forEnemy) || cellBlocked(ent.x - r * 0.7, ny - r, forEnemy) || cellBlocked(ent.x + r * 0.7, ny - r, forEnemy))) ent.y = ny; else ent.blocked = true;
}
function hasLOS(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  if (len < 0.01) return true;
  const steps = Math.ceil(len * 4), sx = dx / steps, sy = dy / steps;
  let x = x0, y = y0;
  for (let i = 0; i < steps; i++) { x += sx; y += sy; const t = cellAt(x, y); if (t === 1) return false; if (t === 2) { const d = MAP.doors[MAP.doorIdx[(y | 0) * MW + (x | 0)]]; if (d.open < 0.5) return false; } }
  return true;
}
function zoneAt(x, y) { return ZONES[MAP.zone[clamp(y | 0, 0, MH - 1) * MW + clamp(x | 0, 0, MW - 1)]]; }

// ---- entities ----
function buildEntities() {
  S.objects = []; S.enemies = []; S.projectiles = []; S.fx = []; S.pickups = []; S.bonfires = []; S.interact = [];
  const g = WORLD.grid;
  for (let i = 0; i < g.length; i++) {
    const c = g[i], x = i % MW, y = (i / MW) | 0;
    if (c === 'b') { const id = x + ',' + y; const b = { type: 'bonfire', x: x + 0.5, y: y + 0.5, id, lit: !!S.flags.bonfire[id], zone: zoneAt(x, y), name: zoneAt(x, y).name }; S.bonfires.push(b); S.objects.push({ spr: getSprite(b.lit ? 'bonfire' : 'bonfire_unlit'), x: b.x, y: b.y, w: 0.7, h: 1.05, z: 0, frame: 0, emissive: b.lit, solid: 0.35, ref: b, anim: Math.random() * 10 }); S.interact.push(b); }
    if (c === '?') { const id = x + ',' + y; const l = { type: 'lore', x: x + 0.5, y: y + 0.5, id, text: WORLD.lore[id] }; S.objects.push({ spr: getSprite('sign_text'), x: l.x, y: l.y, w: 0.55, h: 0.55, z: 0, frame: 0, solid: 0.25, ref: l }); S.interact.push(l); }
  }
  for (const o of WORLD.objects) {
    if (o.type === 'deco') { const spr = getSprite(o.spr); const tall = spr.frames[0].h > 16; S.objects.push({ spr, x: o.x, y: o.y, w: spr.frames[0].w / 16 * 0.7, h: tall ? 1.3 : 0.7, z: 0, frame: 0, solid: o.spr === 'bones' || o.spr === 'skull' || o.spr === 'skull_dark' ? 0 : 0.3, anim: Math.random() * 5 }); }
    else if (o.type === 'breakable') { const id = 'p' + o.x + ',' + o.y; if (S.flags.item[id]) continue; const spr = getSprite(o.spr); const b = { type: 'breakable', x: o.x, y: o.y, id, souls: 15 + ((o.zone + 1) * 25) * (o.spr === 'pot_gold' ? 3 : 1) }; S.objects.push({ spr, x: o.x, y: o.y, w: 0.6, h: 0.6, z: 0, frame: 0, solid: 0.3, ref: b }); S.interact.push(b); }
    else if (o.type === 'torch') { const t = placeOnWall(o.x | 0, o.y | 0); if (t) S.objects.push({ spr: getSprite('torch'), x: t.x, y: t.y, z: 0.95, w: 0.22, h: 0.5, frame: 0, emissive: true, anim: Math.random() * 5 }); }
    else if (o.type === 'brazier') { S.objects.push({ spr: getSprite(o.spr), x: o.x, y: o.y, w: 0.7, h: 0.7, z: 0, frame: 0, emissive: true, solid: 0.33 }); const fl = { brazier_red: 'fire', brazier_green: 'greenflame', brazier_purple: 'purpleflame', brazier_blue: 'blueflame' }[o.spr]; if (fl) S.objects.push({ spr: getSprite(fl), x: o.x, y: o.y, w: 0.42, h: 0.5, z: 0.52, frame: 0, emissive: true, anim: Math.random() * 5 }); }
    else if (o.type === 'chest') { const id = 'c' + o.x + ',' + o.y; const opened = !!S.flags.chest[id]; const ch = { type: 'chest', x: o.x, y: o.y, id, loot: o.loot, big: o.big, opened }; const spr = getSprite(o.big ? (opened ? 'bigchest_open' : 'bigchest') : (opened ? 'chest_open' : 'chest')); const ob = { spr, x: o.x, y: o.y, w: o.big ? 0.9 : 0.65, h: o.big ? 0.9 : 0.65, z: 0, frame: 0, solid: 0.35, ref: ch }; ch.obj = ob; S.objects.push(ob); S.interact.push(ch); }
    else if (o.type === 'item') { const id = 'i' + o.x + ',' + o.y; if (S.flags.item[id]) continue; S.pickups.push({ x: o.x, y: o.y, id, item: o.item }); }
    else if (o.type === 'npc') { const np = { type: 'npc', x: o.x, y: o.y, npc: o.npc, name: 'The Keeper' }; S.objects.push({ spr: getSprite('WiseWizard'), x: o.x, y: o.y, w: 0.9, h: 0.9, z: 0, frame: 0, solid: 0.35, ref: np, anim: Math.random() * 5 }); S.interact.push(np); }
    else if (o.type === 'lever') { const id = 'l' + o.x + ',' + o.y; const t = placeOnWall(o.x | 0, o.y | 0); const lv = { type: 'lever', x: t ? t.x : o.x, y: t ? t.y : o.y, id, gate: o.gate, used: !!S.flags.gate[o.gate[0] + ',' + o.gate[1]] }; S.objects.push({ spr: getSprite('lantern'), x: lv.x, y: lv.y, z: 0.7, w: 0.3, h: 0.4, frame: 0, ref: lv }); S.interact.push(lv); }
    else if (o.type === 'throne') { S.objects.push({ spr: getSprite('alcove_statue'), x: o.x, y: o.y, w: 0.9, h: 1.6, z: 0, frame: 0, solid: 0.4 }); }
  }
  // gates already opened stay open
  for (const d of MAP.doors) { if (d.gate && S.flags.gate[d.id]) { d.open = 1; d.target = 1; d.unlocked = true; } if (d.locked && S.flags.door[d.id]) d.locked = false; if (d.fog && S.flags.boss[d.id]) d.removed = true; }
  spawnEnemies(true);
}
// find the wall face next to a cell for wall-mounted props
function placeOnWall(cx, cy) {
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const t = cellAt(cx, cy);
  if (t === 1) { for (const [dx, dy] of dirs) { if (cellAt(cx + dx, cy + dy) === 0) return { x: cx + 0.5 + dx * 0.62, y: cy + 0.5 + dy * 0.62 }; } return null; }
  for (const [dx, dy] of dirs) { if (cellAt(cx + dx, cy + dy) === 1) return { x: cx + 0.5 + dx * 0.38, y: cy + 0.5 + dy * 0.38 }; }
  return { x: cx + 0.5, y: cy + 0.5 };
}

// ---- messages & UI state ----
function message(t) { S.msgs.push({ t, time: 6 }); if (S.msgs.length > 4) S.msgs.shift(); }
function showCenter(text, sub, dur, kind) { S.center = { text, sub, t: dur, dur, kind }; }
function showItem(item, extra) { S.itemCard = { item, t: 4.5, extra }; }

// ---- player update ----
function updatePlayer(dt) {
  const inp = Input;
  // turning
  let turn = inp.turn + inp.turnKey * 2.4 * dt;
  S.pa += turn; S.pitch = clamp(S.pitch + inp.pitchD, -R.VH * 0.3, R.VH * 0.3);
  if (!inp.look && !inp.pointerLocked) S.pitch *= Math.pow(0.02, dt); // recentre
  // dodge
  if (S.dodge) {
    S.dodge.t -= dt;
    const e = { x: S.px, y: S.py }; moveCircle(e, S.dodge.dx * dt, S.dodge.dy * dt, 0.26); S.px = e.x; S.py = e.y;
    if (S.dodge.t <= 0) S.dodge = null;
  } else {
    let mx = inp.mx, my = inp.my;
    const spd = 3.1 * (S.chill > 0 ? 0.55 : 1) * (MAP.slow[(S.py | 0) * MW + (S.px | 0)] ? 0.6 : 1);
    const ca = Math.cos(S.pa), sa = Math.sin(S.pa);
    const vx = (ca * my - sa * mx) * spd, vy = (sa * my + ca * mx) * spd;
    if (mx || my) {
      const e = { x: S.px, y: S.py }; moveCircle(e, vx * dt, vy * dt, 0.26); S.px = e.x; S.py = e.y;
      S.walkT += dt * Math.hypot(mx, my); S.bob = Math.sin(S.walkT * 9) * 1.6;
      if (((S.walkT * 9 / Math.PI) | 0) !== S.lastStep) { S.lastStep = (S.walkT * 9 / Math.PI) | 0; Snd.sfx('step'); }
    } else S.bob *= 0.8;
    if (inp.consume('dodge') && S.stam >= 22) {
      let dx, dy; if (mx || my) { dx = vx / spd; dy = vy / spd; } else { dx = -ca; dy = -sa; }
      const l = Math.hypot(dx, dy) || 1;
      S.dodge = { t: 0.28, dx: dx / l * 8.5, dy: dy / l * 8.5 }; S.iframes = 0.42; S.stam -= 22; Snd.sfx('dodge');
    }
  }
  // push out of solid objects and enemies
  for (const o of S.objects) { if (!o.solid) continue; pushApart(S, o, 0.26 + o.solid, 1); }
  for (const e of S.enemies) { if (e.dead) continue; pushApart(S, e, 0.26 + e.r, 1); }
  S.px = clamp(S.px, 0.3, MW - 0.3); S.py = clamp(S.py, 0.3, MH - 0.3);
  // field name
  const z = zoneAt(S.px, S.py);
  if (z.idx !== S.lastZone) { S.lastZone = z.idx; S.areaT = S.areaT || {}; if (!S.boss && (S.t - (S.areaT[z.idx] || -999) > 90)) { showCenter(z.name.toUpperCase(), null, 3.5, 'area'); S.areaT[z.idx] = S.t; } }
  MAP.explored[(S.py | 0) * MW + (S.px | 0)] = 1;
  // doors: auto open for the player when near
  for (const d of MAP.doors) {
    if (d.removed) continue;
    const dx = d.x + 0.5 - S.px, dy = d.y + 0.5 - S.py, dd = dx * dx + dy * dy;
    let want = 0;
    if (!d.locked && !d.fog && (!d.gate || d.unlocked) && dd < 1.6) want = 1;
    for (const e of S.enemies) if (!e.dead && !d.locked && !d.fog && (!d.gate || d.unlocked) && dist2(e.x, e.y, d.x + 0.5, d.y + 0.5) < 1.2) want = 1;
    if (d.gate && d.unlocked) want = 1;
    if (want !== d.target) { d.target = want; if (want) Snd.sfx('door'); }
    if (d.open < d.target) d.open = Math.min(1, d.open + dt * 1.6); else if (d.open > d.target) { if (dd > 1.0) d.open = Math.max(0, d.open - dt * 1.2); }
  }
}
function pushApart(a, b, minD, weightA) {
  const dx = a.px !== undefined ? a.px - b.x : a.x - b.x, dy = a.px !== undefined ? a.py - b.y : a.y - b.y;
  const d2 = dx * dx + dy * dy; if (d2 >= minD * minD || d2 < 1e-6) return;
  const d = Math.sqrt(d2), push = (minD - d) * weightA, nx = dx / d, ny = dy / d;
  if (a.px !== undefined) { a.px += nx * push; a.py += ny * push; } else { a.x += nx * push; a.y += ny * push; }
}
// ---- interaction ----
function findFocus() {
  let best = null, bestScore = 1e9;
  const ca = Math.cos(S.pa), sa = Math.sin(S.pa);
  for (const it of S.interact) {
    if (it.opened && it.type === 'chest') continue;
    if (it.type === 'lever' && it.used) continue;
    const dx = it.x - S.px, dy = it.y - S.py, d = Math.hypot(dx, dy);
    if (d > 1.65) continue;
    const dot = (dx * ca + dy * sa) / (d || 1);
    if (dot < 0.55 && d > 0.6) continue;
    const score = d - dot * 0.5; if (score < bestScore) { bestScore = score; best = it; }
  }
  for (const dr of MAP.doors) {
    if (dr.removed) continue;
    if (!(dr.locked || dr.fog || (dr.gate && !dr.unlocked))) continue;
    const dx = dr.x + 0.5 - S.px, dy = dr.y + 0.5 - S.py, d = Math.hypot(dx, dy);
    if (d > 1.5) continue;
    const dot = (dx * ca + dy * sa) / (d || 1); if (dot < 0.6) continue;
    const score = d - dot * 0.5; if (score < bestScore) { bestScore = score; best = { type: 'door', door: dr, x: dr.x + 0.5, y: dr.y + 0.5 }; }
  }
  return best;
}
function focusLabel(f) {
  if (!f) return null;
  switch (f.type) {
    case 'bonfire': return f.lit ? 'Rest at bonfire' : 'Light bonfire';
    case 'chest': return f.opened ? null : (f.big ? 'Open the great chest' : 'Open chest');
    case 'npc': return 'Talk to the Keeper';
    case 'lever': return 'Pull lever';
    case 'lore': return 'Read';
    case 'breakable': return 'Smash';
    case 'door': return f.door.fog ? 'Traverse the white light' : f.door.locked ? 'Open (locked)' : 'Gate is barred';
  }
  return null;
}
function doInteract(f) {
  if (!f) return;
  switch (f.type) {
    case 'bonfire': {
      if (!f.lit) { f.lit = true; S.flags.bonfire[f.id] = 1; const o = S.objects.find(o => o.ref === f); o.spr = getSprite('bonfire'); o.emissive = true; showCenter('BONFIRE LIT', null, 3, 'bonfire'); Snd.sfx('bonfire'); S.bonfire = f.id; restAtBonfire(f, true); }
      else { S.menu = { kind: 'bonfire', bonfire: f, sel: 0 }; S.mode = 'menu'; Snd.sfx('ui'); }
      break;
    }
    case 'chest': if (f.mimic) { const e = f.mimic; wakeEnemy(e); hitParty(rollEnemyDmg(e) * 0.8, e, { shake: 0.4 }); } else openChest(f); break;
    case 'npc': S.menu = { kind: 'keeper', line: 0, sel: 0 }; S.mode = 'menu'; Snd.sfx('ui'); break;
    case 'lever': { f.used = true; const d = MAP.doors.find(d => d.x === f.gate[0] && d.y === f.gate[1]); if (d) { d.unlocked = true; d.target = 1; S.flags.gate[d.id] = 1; } message('A gate opened somewhere.'); Snd.sfx('lever'); saveGame(); break; }
    case 'lore': { S.menu = { kind: 'lore', text: f.text }; S.mode = 'menu'; S.flags.lore[f.id] = 1; Snd.sfx('ui'); break; }
    case 'breakable': { S.flags.item[f.id] = 1; S.objects = S.objects.filter(o => o.ref !== f); S.interact = S.interact.filter(i => i !== f); gainSouls(f.souls, f.x, f.y); Snd.sfx('break'); burst(f.x, f.y, 8, '#b08a60'); break; }
    case 'door': {
      const d = f.door;
      if (d.fog) { traverseFog(d); }
      else if (d.locked) {
        const z = zoneAt(d.x, d.y); const key = d.y < 28 ? 'key_reliquary' : 'key_brass';
        if (S.items[key]) { d.locked = false; S.flags.door[d.id] = 1; message('Unlocked with the ' + ITEM_DEFS[key].name + '.'); Snd.sfx('unlock'); saveGame(); }
        else { message('Locked. It needs the ' + ITEM_DEFS[key].name + '.'); Snd.sfx('locked'); }
      } else message('Barred from the other side.');
      break;
    }
  }
}
function openChest(ch) {
  ch.opened = true; S.flags.chest[ch.id] = 1; ch.obj.spr = getSprite(ch.big ? 'bigchest_open' : 'chest_open'); Snd.sfx('chest');
  if (ch.loot.souls) { gainSouls(ch.loot.souls, ch.x, ch.y); message('Found ' + fmtNum(ch.loot.souls) + ' souls.'); }
  if (ch.loot.item) giveItem(ch.loot.item);
  saveGame();
}
function giveItem(id) {
  const def = ITEM_DEFS[id];
  S.items[id] = (S.items[id] || 0) + 1;
  showItem(id); Snd.sfx('item');
  if (def.use === 'estus+') { S.estusMax++; S.estus = S.estusMax; message('Estus Flask strengthened (' + S.estusMax + ').'); }
  else if (def.use === 'hp+') { S.hpBonus += 12; S.party.forEach(recalcMember); message('Max HP raised for all.'); }
  else if (def.use === 'weapon+') { S.weaponLvl++; message('Weapons reinforced +' + S.weaponLvl + '.'); }
  else if (def.stat) { S.party.forEach(m => { m[def.stat]++; recalcMember(m); }); message('+1 ' + STAT_NAMES[def.stat] + ' for all.'); }
  else if (def.souls) { gainSouls(def.souls, S.px, S.py); }
  else message('Acquired ' + def.name + '.');
}
function traverseFog(d) {
  S.fogPass = d; S.fade = { t: 0.8, dur: 0.8, color: '#ffffff' };
  const ox = d.orient === 0 ? Math.sign(S.px - d.x - 0.5) : 0, oy = d.orient === 1 ? Math.sign(S.py - d.y - 0.5) : 0;
  S.px = d.x + 0.5 - ox * 1.0; S.py = d.y + 0.5 - oy * 1.0;
  S.fogPass = null;
  Snd.sfx('fog');
  const boss = S.enemies.find(e => e.boss && !e.dead && e.gates.some(g => g[0] === d.x && g[1] === d.y));
  if (boss) wakeBoss(boss);
}
function gainSouls(n, x, y) { n = Math.round(n); S.souls += n; S.soulPop = { n, t: 1.5 }; if (x !== undefined) soulBurst(x, y, Math.min(14, 3 + n / 40)); }

// ---- bonfire / rest / death ----
function restAtBonfire(b, first) {
  S.bonfire = b.id;
  for (const m of S.party) { m.dead = false; recalcMember(m); m.hp = m.hpMax; m.spts = m.spMax; m.rec = 0; m.cd = 0; }
  S.estus = S.estusMax; S.stam = S.stamMax; S.chill = 0; S.venom = 0; S.bulwark = 0;
  spawnEnemies(false);
  if (!first) { Snd.sfx('rest'); message('The party rests. The dark stirs again.'); }
  saveGame();
}
function dieParty() {
  if (S.mode === 'dead') return;
  S.mode = 'dead'; S.deathT = 0; S.deaths++; S.deathAt = S.t; Snd.sfx('died'); Snd.music('ambient');
  S.bloodstain = S.souls > 0 ? { x: S.px, y: S.py, souls: S.souls } : S.bloodstain;
  S.souls = 0; S.boss = null; S.menu = null;
}
function respawn() {
  const b = S.bonfires.find(b => b.id === S.bonfire);
  if (b) { S.px = b.x + 0.9; S.py = b.y; S.pa = Math.atan2(b.y - S.py, b.x - S.px) + Math.PI; }
  else { const st = findStart(); S.px = st.x + 0.5; S.py = st.y + 0.5; S.pa = Math.PI / 2; }
  for (const m of S.party) { m.dead = false; recalcMember(m); m.hp = m.hpMax; m.spts = m.spMax; m.rec = 0; m.cd = 0; }
  S.estus = S.estusMax; S.stam = S.stamMax; S.chill = 0; S.venom = 0; S.bulwark = 0; S.dodge = null; S.iframes = 0; S.projectiles = [];
  for (const d of MAP.doors) if (d.fog && !d.removed) d.target = 0;
  spawnEnemies(false);
  S.mode = 'play'; S.fade = { t: 1.2, dur: 1.2, color: '#000' };
  saveGame();
}
function useFlask() {
  if (S.estus <= 0) { message('The flask is empty.'); Snd.sfx('locked'); return; }
  S.estus--; Snd.sfx('flask');
  for (const m of S.party) { if (m.dead) continue; const h = Math.round(m.hpMax * 0.45 + 10); m.hp = Math.min(m.hpMax, m.hp + h); m.heal = 0.8; }
  S.chill = 0; S.venom = 0; S.healFx = 0.9;
  burst(S.px, S.py, 10, '#ffb347', true);
}

// ---- level up ----
function levelUp(m, stat) {
  const cost = levelCost(m.level);
  if (S.souls < cost) return false;
  S.souls -= cost; m.level++; m[stat] += 1 + (stat === 'en' ? 1 : 0); recalcMember(m); Snd.sfx('levelup');
  if (stat === 'en') { S.stamMax = 100 + S.party.reduce((a, p) => a + p.en - p.def.en, 0) * 2; }
  saveGame(); return true;
}

// ---- save / load ----
function saveGame() {
  try {
    const data = { v: 1, party: S.party.map(m => ({ id: m.id, level: m.level, mt: m.mt, en: m.en, it: m.it, sp: m.sp })), souls: S.souls, estusMax: S.estusMax, weaponLvl: S.weaponLvl, hpBonus: S.hpBonus, items: S.items, flags: S.flags, bonfire: S.bonfire, bloodstain: S.bloodstain, playTime: S.playTime, deaths: S.deaths, kills: S.kills, bossKills: S.bossKills, stamMax: S.stamMax };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function loadGame() {
  let data; try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!data) return false;
  newGame();
  S.party.forEach((m, i) => { const d = data.party.find(p => p.id === m.id); if (d) { Object.assign(m, d); } });
  S.souls = data.souls; S.estusMax = data.estusMax; S.estus = S.estusMax; S.weaponLvl = data.weaponLvl; S.hpBonus = data.hpBonus || 0; S.items = data.items || {}; S.flags = data.flags; S.bonfire = data.bonfire; S.bloodstain = data.bloodstain; S.playTime = data.playTime || 0; S.deaths = data.deaths || 0; S.kills = data.kills || 0; S.bossKills = data.bossKills || 0; S.stamMax = data.stamMax || 100;
  S.party.forEach(m => { recalcMember(m); m.hp = m.hpMax; m.spts = m.spMax; });
  buildEntities();
  respawn(); S.fade = null; S.center = null;
  const z = zoneAt(S.px, S.py); S.lastZone = z.idx; S.areaShown = z.idx;
  message('The party returns to the bonfire.');
  return true;
}

// ---- 65_combat.js ----
// ===== Enemies, projectiles, combat, effects =====
function spawnEnemies() {
  S.enemies = [];
  S.interact = S.interact.filter(i => !i.mimic);
  for (const sp of WORLD.spawns) {
    const def = ENEMY_DEFS[sp.kind]; if (!def) continue;
    const id = sp.kind + sp.x + ',' + sp.y;
    if (def.boss && S.flags.boss[id]) continue;
    if ((def.unique || sp.unique) && S.flags.unique[id]) continue;
    S.enemies.push(makeEnemy(sp, def, id));
  }
}
function makeEnemy(sp, def, id, summoned) {
  const spr = def.mimic ? getSprite('chest') : getSprite(sp.kind);
  const e = { kind: sp.kind, def, id, name: def.name, x: sp.x, y: sp.y, hx: sp.x, hy: sp.y, hp: def.hp, hpMax: def.hp, r: 0.2 + def.size * 0.13, spd: def.spd, state: (def.mimic || sp.sleep) ? 'sleep' : 'idle', t: 0, anim: Math.random() * 5, spr, boss: !!def.boss, gates: sp.gates || [], arena: sp.arena, final: !!sp.final, dead: false, flash: 0, zoff: def.zoff || 0, summonT: 8, blinkT: 2 + Math.random() * 3, stuck: 0, side: null, cd: def.cd || 1.6, enraged: false, alpha: 1, dying: 0, summoned: !!summoned, aggroT: 0, unique: !!(def.unique || sp.unique), shake: 0 };
  e.sd = { spr, x: e.x, y: e.y, z: e.zoff, w: def.size * 0.9, h: def.size, frame: 0, emissive: !!def.emissive, alpha: 1, tint: null, shake: 0, ent: e };
  if (def.mimic) { S.interact.push({ type: 'chest', x: e.x, y: e.y, loot: {}, mimic: e }); e.sd.w = 0.65; e.sd.h = 0.65; }
  return e;
}
function wakeEnemy(e) {
  if (e.state === 'sleep') { if (e.def.mimic) { e.spr = getSprite(e.kind); e.sd.spr = e.spr; e.sd.w = e.def.size * 0.9; e.sd.h = e.def.size; S.interact = S.interact.filter(i => i.mimic !== e); message('A Mimic!'); Snd.sfx('roar'); } }
  if (e.state === 'sleep' || e.state === 'idle' || e.state === 'return') { e.state = 'chase'; if (e.boss) wakeBoss(e); else if (!e.noticed) { e.noticed = true; Snd.sfx('notice'); } }
}
function wakeBoss(e) {
  if (S.boss === e) return;
  S.boss = e; e.state = 'chase'; Snd.music('boss'); Snd.sfx('roar');
  for (const g of e.gates) { const d = MAP.doors.find(d => d.x === g[0] && d.y === g[1]); if (d) d.target = 0; }
}
function bossDefeated(e) {
  S.flags.boss[e.id] = 1; S.boss = null; S.bossKills++;
  for (const g of e.gates) { const d = MAP.doors.find(d => d.x === g[0] && d.y === g[1]); if (d) { d.removed = true; d.open = 1; MAP.type[d.y * MW + d.x] = 0; S.flags.boss[d.id] = 1; } }
  showCenter(e.final ? 'THE MANDATE IS RELIT' : 'GREAT FOE VANQUISHED', null, 4, 'victory'); Snd.sfx('victory'); Snd.music('ambient');
  if (e.final) { S.ending = 6; giveItem('crown'); }
  saveGame();
}
function damageEnemy(e, dmg, src, crit, fromSpell) {
  if (e.dead) return;
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.14; e.shake = 0.35; e.lastHit = S.t;
  floatText(e.x, e.y, e.zoff + e.def.size * 0.9, crit ? dmg + '!' : '' + dmg, crit ? '#ffe066' : fromSpell ? '#ff9a3c' : '#ffffff', crit ? 3 : 2);
  wakeEnemy(e);
  if (e.state === 'windup' && e.def.poise < dmg && !e.boss) { e.state = 'stagger'; e.t = 0.45; }
  if (e.hp <= 0) killEnemy(e, src);
}
function killEnemy(e, src) {
  e.dead = true; e.dying = 0.9; e.state = 'dead'; S.kills++;
  const souls = Math.round(e.def.souls * (1 + S.bossKills * 0.05));
  gainSouls(souls, e.x, e.y);
  Snd.sfx(e.boss ? 'bossdie' : 'kill');
  if (e.unique) S.flags.unique[e.id] = 1;
  if (e.boss) bossDefeated(e);
  if (S.target === e) S.target = null;
}
function floatText(x, y, z, text, color, scale = 2) { S.fx.push({ kind: 'text', x, y, z, text, color, scale, t: 1.1, dur: 1.1 }); }
function burst(x, y, n, color, up) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 0.6 + Math.random() * 1.6; S.fx.push({ kind: 'p', x, y, z: 0.4 + Math.random() * 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: (up ? 1.5 : 0.5) + Math.random() * 1.5, t: 0.6 + Math.random() * 0.5, color, size: 2 + Math.random() * 2 }); } }
function soulBurst(x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 0.3 + Math.random() * 0.8; S.fx.push({ kind: 'soul', x, y, z: 0.3 + Math.random() * 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 1 + Math.random(), t: 0.9 + Math.random() * 0.6, color: '#b8ffd0', size: 3 }); } }
function hitSpark(e) { burst(e.x, e.y, 5, '#ffe9a0'); }

// ---- enemy update ----
function updateEnemies(dt) {
  const px = S.px, py = S.py;
  for (const e of S.enemies) {
    e.anim += dt;
    if (e.flash > 0) e.flash -= dt; if (e.shake > 0) e.shake -= dt;
    if (e.dead) { e.dying -= dt; e.sd.alpha = Math.max(0, e.dying / 0.9); e.sd.z = e.zoff - (1 - e.sd.alpha) * 0.3; e.sd.tint = [255, 255, 255, Math.max(0, 1 - e.dying)]; continue; }
    const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy);
    const ndx = d > 0.001 ? dx / d : 1, ndy = d > 0.001 ? dy / d : 0;
    const def = e.def, melee = def.behav === 'melee';
    const atkRange = melee ? 0.55 + e.r + 0.26 : (def.range || 7);
    e.t -= dt;
    switch (e.state) {
      case 'sleep': if (!def.mimic && d < 2.0 && hasLOS(e.x, e.y, px, py)) wakeEnemy(e); break;
      case 'idle': case 'return': {
        if (e.state === 'return') { const hdx = e.hx - e.x, hdy = e.hy - e.y, hd = Math.hypot(hdx, hdy); if (hd > 0.3) enemyMove(e, hdx / hd, hdy / hd, dt, 0.8); else { e.state = 'idle'; e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.5); } }
        const aggro = e.boss ? 7.5 : 6.5;
        if (d < aggro && hasLOS(e.x, e.y, px, py)) { e.aggroT += dt; if (e.aggroT > (e.boss ? 0 : 0.25)) wakeEnemy(e); } else e.aggroT = 0;
        break;
      }
      case 'chase': case 'cooldown': {
        const los = hasLOS(e.x, e.y, px, py);
        if (los) { e.lastSeenX = px; e.lastSeenY = py; e.lostT = 0; } else { e.lostT = (e.lostT || 0) + dt; }
        if (!e.boss && (d > 18 || e.lostT > 7)) { e.state = 'return'; e.noticed = false; break; }
        let tx = e.lastSeenX !== undefined ? e.lastSeenX : px, ty = e.lastSeenY !== undefined ? e.lastSeenY : py;
        const tdx = tx - e.x, tdy = ty - e.y, td = Math.hypot(tdx, tdy) || 1;
        let mvx = tdx / td, mvy = tdy / td, spdMul = e.state === 'cooldown' ? 0.45 : 1;
        if (!melee && d < 2.6 && los) { mvx = -ndx; mvy = -ndy; spdMul = 0.6; } // ranged keep distance
        else if (melee && d < atkRange - 0.15) { mvx = 0; mvy = 0; }
        else if (!melee && d < atkRange * 0.8 && los) { mvx = 0; mvy = 0; }
        if (mvx || mvy) enemyMove(e, mvx, mvy, dt, spdMul);
        // separation
        for (const o of S.enemies) { if (o === e || o.dead) continue; pushApart(e, o, e.r + o.r, 0.5); }
        for (const o of S.objects) { if (!o.solid) continue; pushApart(e, o, e.r + o.solid, 1); }
        if (e.state === 'cooldown') { if (e.t <= 0) e.state = 'chase'; break; }
        // decide attack
        if (melee ? (d < atkRange) : (d < atkRange && los)) {
          e.state = 'windup'; e.t = def.boss ? 0.75 : (melee ? 0.55 : 0.7); e.windupDur = e.t; e.special = null;
          if (def.special === 'charge' && d > 2.5 && Math.random() < 0.6) { e.special = 'charge'; e.t = 0.8; e.windupDur = 0.8; }
          else if (def.special === 'slam' && d < 3.2 && Math.random() < 0.45) { e.special = 'slam'; e.t = 1.0; e.windupDur = 1.0; }
          Snd.sfx(e.boss ? 'bosswind' : 'windup', e.x, e.y);
        } else if (!melee && def.special === 'charge' && d < 6 && Math.random() < dt * 0.25) { e.state = 'windup'; e.special = 'charge'; e.t = 0.8; e.windupDur = 0.8; Snd.sfx('bosswind'); }
        // blink
        if (def.blink) { e.blinkT -= dt; if (e.blinkT <= 0 && d > 2.5) { blinkEnemy(e); e.blinkT = 3 + Math.random() * 3; } }
        // summon
        if (def.summon && (!e.boss || e.hp < e.hpMax * 0.75)) { e.summonT -= dt; if (e.summonT <= 0) { summonAdds(e); e.summonT = e.boss ? 14 : 11; } }
        break;
      }
      case 'windup': {
        e.sd.tint = [255, 70, 50, 0.35 + 0.45 * (1 - e.t / e.windupDur)];
        if (e.special !== 'charge' && melee) { const face = Math.atan2(dy, dx); e.sd.shake = 0; }
        if (e.t <= 0) {
          e.sd.tint = null;
          if (e.special === 'charge') { e.state = 'charge'; e.t = 0.75; e.cvx = ndx * (def.spd * 4.5); e.cvy = ndy * (def.spd * 4.5); e.chargeHit = false; Snd.sfx('charge'); }
          else if (e.special === 'slam') { e.state = 'cooldown'; e.t = e.cd; slamAttack(e); }
          else if (melee) { e.state = 'cooldown'; e.t = e.cd; if (d < atkRange + 0.35) hitParty(rollEnemyDmg(e), e); else Snd.sfx('whoosh'); }
          else { e.state = 'cooldown'; e.t = e.cd; fireEnemyProjectile(e, def.volley || 1); }
        }
        break;
      }
      case 'charge': {
        const prev = { x: e.x, y: e.y };
        moveCircle(e, e.cvx * dt, e.cvy * dt, e.r, true);
        if (!e.chargeHit && d < e.r + 0.5) { e.chargeHit = true; hitParty(rollEnemyDmg(e) * 1.5, e, { shake: 0.5 }); }
        if (e.blocked || e.t <= 0) { e.blocked = false; e.state = 'cooldown'; e.t = e.cd * 1.2; if (e.blocked) S.shake = Math.max(S.shake, 0.3); }
        e.blocked = false;
        break;
      }
      case 'stagger': if (e.t <= 0) e.state = 'chase'; break;
    }
    if (e.state !== 'windup' && !e.dead) e.sd.tint = e.flash > 0 ? [255, 255, 255, 0.85] : (e.enraged ? [255, 60, 40, 0.3] : null);
    else if (e.flash > 0) e.sd.tint = [255, 255, 255, 0.85];
    if (e.boss && def.enrage && !e.enraged && e.hp < e.hpMax * def.enrage) { e.enraged = true; e.spd *= 1.3; e.cd *= 0.75; message(e.name + ' is enraged!'); Snd.sfx('roar'); }
    // sprite descriptor
    e.sd.x = e.x; e.sd.y = e.y; e.sd.shake = e.shake > 0 ? Math.sin(S.t * 60) * 0.04 : 0;
    const hover = e.zoff ? Math.sin(e.anim * 2.5) * 0.08 : 0;
    e.sd.z = e.zoff + hover + (e.state === 'windup' ? (1 - e.t / e.windupDur) * 0.12 : 0);
    e.sd.frame = (e.anim * e.spr.fps) | 0;
    if (e.state === 'windup') { const k = 1 + (1 - e.t / e.windupDur) * 0.12; e.sd.h = def.size * k; e.sd.w = def.size * 0.9 * k; } else { e.sd.h = def.size * (e.state === 'stagger' ? 0.92 : 1); e.sd.w = def.size * 0.9; }
    if (def.mimic && e.state === 'sleep') { e.sd.w = 0.65; e.sd.h = 0.65; }
  }
  // remove faded corpses
  S.enemies = S.enemies.filter(e => !e.dead || e.dying > 0);
}
function enemyMove(e, mvx, mvy, dt, mul = 1) {
  let vx = mvx, vy = mvy;
  if (e.side) { e.side.t -= dt; if (e.side.t <= 0) e.side = null; else { vx = e.side.x; vy = e.side.y; } }
  const spd = e.spd * mul * (e.state === 'cooldown' ? 1 : 1);
  const ox = e.x, oy = e.y;
  e.blocked = false; moveCircle(e, vx * spd * dt, vy * spd * dt, e.r, true);
  const moved = Math.hypot(e.x - ox, e.y - oy);
  if (moved < spd * dt * 0.3) { e.stuck += dt; if (e.stuck > 0.25) { const s = Math.random() < 0.5 ? 1 : -1; e.side = { x: -mvy * s, y: mvx * s, t: 0.5 + Math.random() * 0.5 }; e.stuck = 0; } } else e.stuck = 0;
}
function blinkEnemy(e) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * TAU, r = 1.5 + Math.random() * 1.5, x = S.px + Math.cos(a) * r, y = S.py + Math.sin(a) * r;
    if (!cellBlocked(x, y, true) && hasLOS(S.px, S.py, x, y)) { burst(e.x, e.y, 6, '#c9a0ff'); e.x = x; e.y = y; burst(x, y, 6, '#c9a0ff'); Snd.sfx('blink'); return; }
  }
}
function summonAdds(e) {
  const alive = S.enemies.filter(o => o.summoned && !o.dead).length; if (alive >= 3) return;
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * TAU, x = e.x + Math.cos(a) * 1.4, y = e.y + Math.sin(a) * 1.4;
    if (cellBlocked(x, y, true)) continue;
    const def = ENEMY_DEFS[e.def.summon]; const add = makeEnemy({ kind: e.def.summon, x, y }, def, 'summon' + Math.random(), true); add.state = 'chase'; add.noticed = true; S.enemies.push(add); burst(x, y, 8, '#80ff80');
  }
  message(e.name + ' calls for aid.'); Snd.sfx('summon');
}
function slamAttack(e) {
  S.shake = Math.max(S.shake, 0.6); Snd.sfx('slam'); burst(e.x, e.y, 16, '#aaa');
  const d = Math.hypot(S.px - e.x, S.py - e.y);
  if (d < 3.4) hitParty(rollEnemyDmg(e) * 1.35, e, { all: d < 1.8 });
}
function rollEnemyDmg(e) { const [a, b] = e.def.dmg; return (a + Math.random() * (b - a)) * (e.enraged ? 1.25 : 1); }
function fireEnemyProjectile(e, n) {
  const base = Math.atan2(S.py - e.y, S.px - e.x);
  for (let i = 0; i < n; i++) {
    const spread = n > 1 ? (i - (n - 1) / 2) * 0.16 : 0, a = base + spread;
    const spd = e.def.proj === 'arrow' ? 9 : 6.5;
    S.projectiles.push({ x: e.x + Math.cos(a) * 0.3, y: e.y + Math.sin(a) * 0.3, z: 0.7 + e.zoff, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, spr: getSprite(e.def.proj), dmg: rollEnemyDmg(e), owner: 'enemy', life: 3, r: 0.4, chill: !!e.def.chill, venom: !!e.def.venom, w: e.def.proj === 'arrow' ? 0.35 : 0.3, h: e.def.proj === 'arrow' ? 0.15 : 0.3, ang: a, anim: 0, emissive: e.def.proj !== 'arrow' });
  }
  Snd.sfx(e.def.proj === 'arrow' ? 'bow' : 'cast', e.x, e.y);
}

// ---- party takes damage ----
function hitParty(dmg, src, opts = {}) {
  if (S.mode !== 'play') return;
  if (S.iframes > 0) { floatText(S.px + Math.cos(S.pa) * 0.8, S.py + Math.sin(S.pa) * 0.8, 0.9, 'DODGED', '#9ad0f0', 2); return; }
  const alive = S.party.filter(m => !m.dead); if (!alive.length) return;
  let mult = 1;
  if (S.bulwark > 0) mult *= 0.3;
  const targets = opts.all ? alive : [alive[(Math.random() * alive.length) | 0]];
  for (const m of targets) {
    let d = dmg * mult * (opts.all ? 0.7 : 1);
    if (m.def.armor) d *= 1 - m.def.armor;
    if (m.id === 'knight' && Math.random() < 0.18 && S.stam > 15) { S.stam -= 12; m.block = 0.5; floatText(S.px + Math.cos(S.pa) * 0.8, S.py + Math.sin(S.pa) * 0.8, 1.0, 'BLOCKED', '#d8b36a', 2); Snd.sfx('block'); continue; }
    d = Math.max(1, Math.round(d));
    m.hp -= d; m.hurt = 0.5; m.dmgPop = { n: d, t: 1 };
    if (m.hp <= 0) { m.hp = 0; m.dead = true; message(m.name + ' has fallen.'); Snd.sfx('fallen'); }
  }
  S.hurtT = 0.5; S.shake = Math.max(S.shake, opts.shake || 0.18); Snd.sfx('hurt');
  if (src && src.def) { if (src.def.chill) { S.chill = 3; message('The cold slows the party.'); } if (src.def.venom) { S.venom = 5; } }
  if (!S.party.some(m => !m.dead)) dieParty();
}

// ---- party attacks & abilities ----
function recoveryTime(m) { return m.def.rec * Math.max(0.45, 1 - (m.sp - m.def.sp) * 0.03); }
function rollDamage(m) { const d = m.def; let base = d.base + (d.atk === 'melee' ? m.mt * 0.8 : (m.id === 'archer' ? m.mt * 0.65 : m.it * 0.5)) + S.weaponLvl * 2.5; return base * (0.85 + Math.random() * 0.3); }
function partyAttack() {
  const tgt = S.target; let any = false, blockedByStam = false, meleeHit = false;
  for (const m of S.party) {
    if (m.dead || m.rec > 0) continue;
    const d = m.def;
    if (d.atk === 'melee') {
      if (!tgt) continue;
      const dist = Math.hypot(tgt.x - S.px, tgt.y - S.py);
      if (dist > 1.6 + tgt.r) continue;
      if (S.stam < 10) { blockedByStam = true; continue; }
      S.stam -= 10; S.stamT = 0.7; m.rec = recoveryTime(m); m.bounce = 1; any = true;
      const crit = Math.random() < 0.08 + m.sp * 0.004; const dmg = rollDamage(m) * (crit ? 2 : 1);
      damageEnemy(tgt, dmg, m, crit); hitSpark(tgt); Snd.sfx(m.id === 'knight' ? 'sword' : 'mace'); meleeHit = true;
    } else {
      if (S.stam < 8) { blockedByStam = true; continue; }
      S.stam -= 8; S.stamT = 0.7; m.rec = recoveryTime(m); m.bounce = 1; any = true;
      firePartyProjectile(m, d.proj, rollDamage(m), tgt, 0);
      Snd.sfx(m.id === 'archer' ? 'bow' : 'spark');
    }
  }
  if (!any && blockedByStam) { message('Exhausted!'); }
  if (any) { if (meleeHit) S.swing = 0.25; else S.rangedFlash = 0.15; }
}
function firePartyProjectile(m, sprName, dmg, tgt, spread, extra = {}) {
  let a = S.pa;
  if (tgt) { const tdx = tgt.x - S.px, tdy = tgt.y - S.py; a = Math.atan2(tdy, tdx); }
  a += spread;
  const spd = sprName === 'arrow' ? 13 : sprName === 'firebolt' ? 9 : 10;
  S.projectiles.push(Object.assign({ x: S.px + Math.cos(a) * 0.35, y: S.py + Math.sin(a) * 0.35, z: 0.85, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, spr: getSprite(sprName), dmg, owner: 'party', life: 2.5, r: 0.35, member: m, w: sprName === 'arrow' ? 0.35 : sprName === 'firebolt' ? 0.38 : 0.2, h: sprName === 'arrow' ? 0.15 : sprName === 'firebolt' ? 0.38 : 0.2, ang: a, anim: 0, emissive: sprName !== 'arrow', tgt }, extra));
}
function useAbility(idx) {
  const m = S.party[idx]; if (!m || m.dead) return;
  const ab = ABILITIES[m.def.ability];
  if (m.cd > 0) { Snd.sfx('locked'); return; }
  if (ab.sp && m.spts < ab.sp) { message(m.name + ' lacks spell points.'); Snd.sfx('locked'); return; }
  if (ab.stam && S.stam < ab.stam) { message('Exhausted!'); Snd.sfx('locked'); return; }
  if (ab.sp) m.spts -= ab.sp; if (ab.stam) S.stam -= ab.stam;
  m.cd = ab.cd; m.bounce = 1;
  switch (m.def.ability) {
    case 'bulwark': S.bulwark = 4; message('Roderick raises the bulwark.'); Snd.sfx('block'); break;
    case 'volley': S.volley = { n: 5, t: 0, m }; Snd.sfx('bow'); break;
    case 'heal': { const h = Math.round(22 + m.it * 2.5 + m.level * 2); for (const p of S.party) if (!p.dead) { p.hp = Math.min(p.hpMax, p.hp + h); p.heal = 0.8; } S.healFx = 0.9; burst(S.px, S.py, 12, '#90ff90', true); Snd.sfx('heal'); break; }
    case 'firebolt': firePartyProjectile(m, 'firebolt', 22 + m.it * 2.6 + m.level * 2 + S.weaponLvl * 3, S.target, 0, { splash: 1.3, spell: true }); Snd.sfx('fire'); break;
  }
}
// ---- projectiles ----
function updateProjectiles(dt) {
  const keep = [];
  for (const p of S.projectiles) {
    p.life -= dt; p.anim += dt;
    if (p.tgt && !p.tgt.dead && p.owner === 'party') { // light homing
      const a = Math.atan2(p.tgt.y - p.y, p.tgt.x - p.x), cur = Math.atan2(p.vy, p.vx), da = normAng(a - cur), spd = Math.hypot(p.vx, p.vy);
      const na = cur + clamp(da, -2.5 * dt, 2.5 * dt); p.vx = Math.cos(na) * spd; p.vy = Math.sin(na) * spd;
    }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    const t = cellAt(nx, ny);
    let blocked = t === 1 || t === 3 && false;
    if (t === 2) { const d = MAP.doors[MAP.doorIdx[(ny | 0) * MW + (nx | 0)]]; if (d.open < 0.6 && !d.removed) blocked = true; }
    if (blocked || p.life <= 0) { burst(p.x, p.y, 4, p.spr.name === 'arrow' ? '#c0b090' : '#ffb060'); if (p.splash) splash(p); continue; }
    p.x = nx; p.y = ny;
    let hit = false;
    if (p.owner === 'enemy') {
      if (dist2(p.x, p.y, S.px, S.py) < 0.45 * 0.45) { hitParty(p.dmg, { def: { chill: p.chill, venom: p.venom } }); hit = true; }
    } else {
      for (const e of S.enemies) { if (e.dead || (e.state === 'sleep' && e.def.mimic)) continue; const rr = e.r + 0.25; if (dist2(p.x, p.y, e.x, e.y) < rr * rr) { damageEnemy(e, p.dmg, p.member, false, p.spell); hitSpark(e); if (p.splash) splash(p, e); hit = true; break; } }
    }
    if (hit) { if (p.spr.name !== 'arrow') burst(p.x, p.y, 6, '#ffd080'); continue; }
    keep.push(p);
  }
  S.projectiles = keep;
}
function splash(p, except) { Snd.sfx('explode'); burst(p.x, p.y, 14, '#ff8030'); S.shake = Math.max(S.shake, 0.12); for (const e of S.enemies) { if (e.dead || e === except) continue; if (dist2(p.x, p.y, e.x, e.y) < p.splash * p.splash) damageEnemy(e, p.dmg * 0.6, p.member, false, true); } }

// ---- per-frame combat housekeeping ----
function updateCombat(dt) {
  // target selection
  let best = null, bestScore = 1e9;
  const ca = Math.cos(S.pa), sa = Math.sin(S.pa);
  for (const e of S.enemies) {
    if (e.dead || (e.state === 'sleep' && e.def.mimic)) continue;
    const dx = e.x - S.px, dy = e.y - S.py, d = Math.hypot(dx, dy); if (d > 12) continue;
    const ang = Math.abs(normAng(Math.atan2(dy, dx) - S.pa));
    const cone = 0.3 + Math.atan2(e.r + 0.2, d);
    if (ang > cone) continue;
    if (!hasLOS(S.px, S.py, e.x, e.y)) continue;
    const score = d * (1 + ang * 1.5); if (score < bestScore) { bestScore = score; best = e; }
  }
  S.target = best;
  for (const m of S.party) { if (m.rec > 0) m.rec -= dt; if (m.cd > 0) m.cd -= dt; if (m.bounce > 0) m.bounce -= dt * 4; if (m.hurt > 0) m.hurt -= dt; if (m.heal > 0) m.heal -= dt; if (m.block > 0) m.block -= dt; if (m.dmgPop) { m.dmgPop.t -= dt; if (m.dmgPop.t <= 0) m.dmgPop = null; } if (!m.dead && m.spts < m.spMax) m.spts = Math.min(m.spMax, m.spts + dt * 0.6); }
  if (S.stamT > 0) S.stamT -= dt; else S.stam = Math.min(S.stamMax, S.stam + dt * 30);
  if (S.bulwark > 0) S.bulwark -= dt; if (S.chill > 0) S.chill -= dt; if (S.iframes > 0) S.iframes -= dt; if (S.hurtT > 0) S.hurtT -= dt; if (S.healFx > 0) S.healFx -= dt; if (S.swing > 0) S.swing -= dt; if (S.rangedFlash > 0) S.rangedFlash -= dt;
  if (S.venom > 0) { S.venom -= dt; S.venomTick = (S.venomTick || 0) + dt; if (S.venomTick > 1) { S.venomTick = 0; for (const m of S.party) if (!m.dead) { m.hp = Math.max(1, m.hp - 2); } } }
  if (S.shake > 0) S.shake -= dt;
  if (S.volley) { S.volley.t -= dt; if (S.volley.t <= 0) { firePartyProjectile(S.volley.m, 'arrow', rollDamage(S.volley.m) * 0.8, S.target, (Math.random() - 0.5) * 0.12); Snd.sfx('bow'); S.volley.n--; S.volley.t = 0.11; if (S.volley.n <= 0) S.volley = null; } }
  // boss wake by proximity (if the player got in by other means)
  for (const e of S.enemies) if (e.boss && !e.dead && e.state === 'idle') { const d = Math.hypot(e.x - S.px, e.y - S.py); if (d < 8 && hasLOS(e.x, e.y, S.px, S.py)) wakeEnemy(e); }
  if (S.boss && (S.boss.dead)) S.boss = null;
  // pickups
  for (let i = S.pickups.length - 1; i >= 0; i--) { const p = S.pickups[i]; if (dist2(p.x, p.y, S.px, S.py) < 0.55 * 0.55) { S.pickups.splice(i, 1); S.flags.item[p.id] = 1; giveItem(p.item); saveGame(); } }
  if (S.mode === 'play' && S.bloodstain && S.t - (S.deathAt || -9) > 2 && dist2(S.bloodstain.x, S.bloodstain.y, S.px, S.py) < 0.6 * 0.6) { gainSouls(S.bloodstain.souls, S.px, S.py); message('Recovered ' + fmtNum(S.bloodstain.souls) + ' souls.'); S.bloodstain = null; Snd.sfx('item'); saveGame(); }
  // fx
  for (let i = S.fx.length - 1; i >= 0; i--) {
    const f = S.fx[i]; f.t -= dt;
    if (f.kind === 'p' || f.kind === 'soul') { f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; f.vz -= (f.kind === 'soul' ? -0.5 : 3) * dt; if (f.kind === 'soul') { f.vx *= 0.9; f.vy *= 0.9; } }
    if (f.t <= 0) S.fx.splice(i, 1);
  }
}
// ---- sprite list for the renderer ----
const _sprList = [];
function gatherSprites() {
  const L = _sprList; L.length = 0;
  for (const o of S.objects) { if (o.anim !== undefined) { o.anim += 1 / 60; o.frame = (o.anim * o.spr.fps) | 0; } L.push(o); }
  for (const e of S.enemies) L.push(e.sd);
  for (const p of S.projectiles) L.push({ spr: p.spr, x: p.x, y: p.y, z: p.z, w: p.w, h: p.h, frame: (p.anim * p.spr.fps) | 0, emissive: p.emissive });
  for (const p of S.pickups) { const def = ITEM_DEFS[p.item]; L.push({ spr: getSprite('itemglow'), x: p.x, y: p.y, z: 0.1, w: 0.7, h: 0.7, frame: (S.t * 2) | 0, emissive: true }); L.push({ spr: getSprite(def.icon), x: p.x, y: p.y, z: 0.25 + Math.sin(S.t * 2 + p.x) * 0.04, w: 0.35, h: 0.35, frame: 0, emissive: true }); }
  if (S.bloodstain) L.push({ spr: getSprite('bloodstain'), x: S.bloodstain.x, y: S.bloodstain.y, z: 0.05, w: 0.7, h: 0.5, frame: (S.t * 3) | 0, emissive: true });
  return L;
}

// ---- 70_hud.js ----
// ===== HUD, menus and screens =====
const H = { cvs: null, ctx: null, W: 0, H: 0, dpr: 1, sl: 0, sr: 0, st: 0, sb: 0, barTop: 0, viewScaleX: 1, viewScaleY: 1, btn: {} };
const SERIF = 'Georgia, "Times New Roman", Times, serif';
function hudInit(cvs) { H.cvs = cvs; H.ctx = cvs.getContext('2d'); }
function hudResize(w, h, dpr, ins) {
  H.W = w; H.H = h; H.dpr = dpr; H.cvs.width = Math.round(w * dpr); H.cvs.height = Math.round(h * dpr);
  H.cvs.style.width = w + 'px'; H.cvs.style.height = h + 'px';
  H.sl = ins.l; H.sr = ins.r; H.st = ins.t; H.sb = ins.b;
  H.barTop = h - 66 - H.sb;
}
function worldToScreen(x, y, z) {
  const dirX = Math.cos(S.pa), dirY = Math.sin(S.pa), planeX = -dirY * R.planeLen, planeY = dirX * R.planeLen;
  const sx = x - S.px, sy = y - S.py, invDet = 1 / (planeX * dirY - dirX * planeY);
  const tx = invDet * (dirY * sx - dirX * sy), ty = invDet * (-planeY * sx + planeX * sy);
  if (ty <= 0.1) return null;
  const ix = (R.VW / 2) * (1 + tx / ty), iy = R.horizon + (R.camZ - z) * R.projV / ty;
  const col = ix | 0; if (col < 0 || col >= R.VW) return null;
  if (R.zbuf[col] < ty) return null;
  return { x: ix * H.viewScaleX, y: iy * H.viewScaleY, d: ty };
}
function serifText(ctx, text, x, y, size, color, align = 'center', spacing = 0, bold = true) {
  ctx.font = (bold ? 'bold ' : '') + size + 'px ' + SERIF; ctx.textBaseline = 'middle';
  if (!spacing) { ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(text, x, y); return; }
  let w = 0; const ws = []; for (const ch of text) { const cw = ctx.measureText(ch).width + spacing; ws.push(cw); w += cw; }
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.textAlign = 'left'; ctx.fillStyle = color;
  [...text].forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i]; });
}
function panel(ctx, x, y, w, h, alpha = 0.82) {
  ctx.fillStyle = 'rgba(8,7,12,' + alpha + ')'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(190,160,100,0.55)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
}
function bar(ctx, x, y, w, h, frac, color, back = '#1a1418', trail) {
  ctx.fillStyle = back; ctx.fillRect(x, y, w, h);
  if (trail !== undefined && trail > frac) { ctx.fillStyle = '#c8a040'; ctx.fillRect(x, y, w * clamp(trail, 0, 1), h); }
  ctx.fillStyle = color; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, y, w * clamp(frac, 0, 1), Math.max(1, h / 3));
  ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function circleBtn(ctx, id, cx, cy, r, label, iconSpr, active, sub, color = 'rgba(20,16,24,0.72)') {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = active ? 'rgba(90,60,30,0.85)' : color; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = active ? '#ffd27a' : 'rgba(210,180,120,0.8)'; ctx.stroke();
  if (iconSpr) { const im = spriteCanvas(getSprite(iconSpr), 0, 2); const s = r * 0.95; ctx.drawImage(im, cx - s / 2, cy - s / 2 - (label ? 4 : 0), s, s); }
  if (label) drawText(ctx, label, cx, cy + r * 0.38, 1, '#e8dcc0', 'center');
  if (sub) drawText(ctx, sub, cx + r * 0.55, cy - r * 0.9, 2, '#ffe9a0', 'center');
  Input.buttons.push({ id, x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
}
function rectBtn(ctx, id, x, y, w, h, label, sel, disabled, sub) {
  ctx.fillStyle = sel ? 'rgba(120,90,40,0.75)' : 'rgba(30,26,34,0.85)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = sel ? '#ffd27a' : 'rgba(170,150,110,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  drawText(ctx, label, x + 12, y + (sub ? 7 : (h - 14) / 2), 2, disabled ? '#6b6560' : '#f0e4c8');
  if (sub) drawText(ctx, sub, x + 12, y + h - 16, 1, disabled ? '#5a5550' : '#b8a888');
  if (!disabled) Input.buttons.push({ id, x, y, w, h });
}

function drawHUD(dt) {
  const ctx = H.ctx, W = H.W, HH = H.H;
  ctx.setTransform(H.dpr, 0, 0, H.dpr, 0, 0);
  ctx.clearRect(0, 0, W, HH);
  ctx.imageSmoothingEnabled = false;
  Input.buttons.length = 0;
  if (S.mode === 'title') { drawTitle(ctx); return; }
  if (S.mode === 'victory') { drawVictory(ctx); return; }
  drawWorldFx(ctx);
  drawOverlays(ctx);
  if (S.mode === 'play' && !Input.hideWeapon) drawWeapon(ctx);
  if (S.mode === 'play' || S.mode === 'menu' || S.mode === 'dead') {
    drawPortraits(ctx);
    if (S.mode === 'play') {
      drawEnemyBars(ctx); drawCrosshair(ctx); drawTarget(ctx); drawMinimap(ctx); drawSouls(ctx); drawStamina(ctx); drawBossBar(ctx); drawButtons(ctx); drawMessages(ctx); drawItemCard(ctx);
    }
  }
  drawCenter(ctx);
  if (S.mode === 'menu') drawMenu(ctx);
  if (S.mode === 'dead') drawDead(ctx);
  if (S.fade) { const a = clamp(S.fade.t / S.fade.dur, 0, 1); ctx.fillStyle = S.fade.color; ctx.globalAlpha = a; ctx.fillRect(0, 0, W, HH); ctx.globalAlpha = 1; }
}
function drawWorldFx(ctx) {
  for (const f of S.fx) {
    if (f.kind === 'text') {
      const k = 1 - f.t / f.dur; const p = worldToScreen(f.x, f.y, f.z + k * 0.5); if (!p) continue;
      const sc = Math.max(1, Math.round(f.scale * Math.min(2.2, 2.2 / Math.sqrt(p.d)))); ctx.globalAlpha = f.t < 0.3 ? f.t / 0.3 : 1;
      drawText(ctx, f.text, p.x, p.y, sc, f.color, 'center'); ctx.globalAlpha = 1;
    } else {
      const p = worldToScreen(f.x, f.y, f.z); if (!p) continue;
      const s = Math.max(1.5, f.size * 2.2 / p.d); ctx.fillStyle = f.color; ctx.globalAlpha = clamp(f.t * 2, 0, 1); ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s); ctx.globalAlpha = 1;
    }
  }
}
function drawWeapon(ctx) {
  // first-person weapon feedback: sword sweep on melee, bow flash on ranged
  const W = H.W, HH = H.H, base = H.barTop;
  const sw = S.swing || 0, k = sw > 0 ? 1 - sw / 0.25 : 1; // 0..1 progress of the swing
  const restX = Input.isTouch ? W - H.sr - 270 : W - H.sr - 150, restY = base + 40;
  const im = spriteCanvas(getSprite('sword_gold'), 0, 4);
  const size = Math.min(150, HH * 0.42);
  ctx.save();
  if (sw > 0) {
    const ang = -0.9 + Math.sin(k * Math.PI) * 1.6, px = restX - Math.sin(k * Math.PI) * size * 0.9, py = restY - Math.sin(k * Math.PI) * size * 0.75;
    ctx.translate(px, py); ctx.rotate(ang);
    ctx.globalAlpha = 0.95; ctx.drawImage(im, -size * 0.1, -size * 0.9, size, size);
  } else if (S.mode === 'play') {
    const bob = Math.sin(S.walkT * 9) * 3, breathe = Math.sin(S.t * 1.5) * 2;
    ctx.translate(restX + 30, restY + 18 + bob + breathe); ctx.rotate(-0.55);
    ctx.globalAlpha = 0.9; ctx.drawImage(im, -size * 0.1, -size * 0.9, size, size);
  }
  ctx.restore();
  if (S.rangedFlash > 0) { const cx = W / 2, cy = HH / 2 + S.pitch * H.viewScaleY; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40); g.addColorStop(0, 'rgba(255,230,160,' + (S.rangedFlash * 1.6) + ')'); g.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 40, cy - 40, 80, 80); }
}
function drawOverlays(ctx) {
  const W = H.W, HH = H.H;
  { const g = ctx.createRadialGradient(W / 2, HH / 2, HH * 0.45, W / 2, HH / 2, HH * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH); }
  if (S.hurtT > 0 || S.party.some(m => !m.dead && m.hp < m.hpMax * 0.25)) {
    const low = S.party.some(m => !m.dead && m.hp < m.hpMax * 0.25) ? 0.25 + Math.sin(S.t * 4) * 0.08 : 0;
    const a = Math.max(low, S.hurtT * 1.2);
    const g = ctx.createRadialGradient(W / 2, HH / 2, HH * 0.35, W / 2, HH / 2, HH * 0.85); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, 'rgba(140,0,0,' + clamp(a, 0, 0.75) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
  }
  if (S.healFx > 0) { ctx.fillStyle = 'rgba(90,255,120,' + (S.healFx * 0.18) + ')'; ctx.fillRect(0, 0, W, HH); }
  if (S.chill > 0) { ctx.fillStyle = 'rgba(120,180,255,' + Math.min(0.18, S.chill * 0.08) + ')'; ctx.fillRect(0, 0, W, HH); }
  if (S.venom > 0) { ctx.fillStyle = 'rgba(80,200,40,' + Math.min(0.14, S.venom * 0.05) + ')'; ctx.fillRect(0, 0, W, HH); }
  if (S.bulwark > 0) { ctx.strokeStyle = 'rgba(216,179,106,' + Math.min(0.8, S.bulwark * 0.4) + ')'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, HH - 6); }
}
function drawCrosshair(ctx) {
  const cx = H.W / 2, cy = H.H / 2 + S.pitch * H.viewScaleY; const sw = S.swing > 0 ? 1 + S.swing * 4 : 1;
  ctx.strokeStyle = S.target ? '#ff7a5a' : 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 7 * sw, cy); ctx.lineTo(cx - 3, cy); ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 7 * sw, cy); ctx.moveTo(cx, cy - 7 * sw); ctx.lineTo(cx, cy - 3); ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 7 * sw); ctx.stroke();
  const f = S.focus; const label = focusLabel(f);
  if (label) {
    const y = H.H * 0.56 + S.pitch * 0.5;
    const w = textWidth(label, 2) + 28; const x = H.W / 2 - w / 2;
    ctx.fillStyle = 'rgba(10,8,14,0.78)'; ctx.fillRect(x, y, w, 26); ctx.strokeStyle = 'rgba(210,180,120,0.7)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 25);
    drawText(ctx, label, H.W / 2, y + 6, 2, '#ffe9a0', 'center');
    if (!Input.isTouch) drawText(ctx, '[E]', x + w - 6, y - 10, 1, '#b8a888', 'right');
    Input.buttons.push({ id: 'interact', x, y, w, h: 26 });
  }
}
function drawEnemyBars(ctx) {
  for (const e of S.enemies) {
    if (e.dead || e.boss || e.hp >= e.hpMax || (e.state === 'sleep')) continue;
    if (S.t - (e.lastHit || -99) > 6 && e.state !== 'windup') continue;
    const p = worldToScreen(e.x, e.y, e.zoff + e.def.size + 0.12); if (!p || p.d > 9) continue;
    const w = clamp(60 / p.d, 14, 46);
    bar(ctx, p.x - w / 2, p.y - 3, w, 3, e.hp / e.hpMax, e === S.target ? '#ff5a3a' : '#b8282a', 'rgba(20,10,10,0.8)');
  }
}
function drawTarget(ctx) {
  const e = S.target; if (!e || e.boss) return;
  const cx = H.W / 2, y = H.st + 10;
  drawText(ctx, e.name, cx, y, 2, '#f0e4c8', 'center');
  bar(ctx, cx - 70, y + 18, 140, 6, e.hp / e.hpMax, '#c0302a');
}
function drawBossBar(ctx) {
  const b = S.boss; if (!b || b.dead) return;
  const w = Math.min(560, H.W * 0.6), x = H.W / 2 - w / 2, y = H.barTop - 44;
  serifText(ctx, b.name, H.W / 2, y - 10, 15, '#f3e9d2', 'center', 1);
  b.trail = b.trail === undefined ? b.hp / b.hpMax : lerp(b.trail, b.hp / b.hpMax, 0.03);
  bar(ctx, x, y, w, 10, b.hp / b.hpMax, '#b8231d', '#15100f', b.trail);
  drawText(ctx, Math.ceil(b.hp) + '', x + w - 2, y + 12, 1, '#c8b8a0', 'right');
}
function drawSouls(ctx) {
  const x = H.W - H.sr - 12, y = H.st + 10;
  const im = spriteCanvas(getSprite('soulglow'), 0, 1);
  ctx.drawImage(im, x - 18, y - 2, 18, 18);
  drawText(ctx, fmtNum(S.souls), x - 22, y + 2, 2, '#d8f0e0', 'right');
  if (S.soulPop) { S.soulPop.t -= 1 / 60; if (S.soulPop.t <= 0) S.soulPop = null; else { ctx.globalAlpha = Math.min(1, S.soulPop.t); drawText(ctx, '+' + fmtNum(S.soulPop.n), x - 22, y + 20, 1, '#b8ffd0', 'right'); ctx.globalAlpha = 1; } }
  // pause button
  circleBtn(ctx, 'menu', x - 16, y + 48, 14, null, null, false, null); drawText(ctx, '=', x - 16, y + 42, 2, '#e8dcc0', 'center');
}
function drawStamina(ctx) {
  const w = Math.min(300, H.W * 0.3), x = H.W / 2 - w / 2, y = H.barTop - 14;
  bar(ctx, x, y, w, 7, S.stam / S.stamMax, S.stam < 20 ? '#c08a30' : '#5fa84a', '#15181a');
}
function drawMinimap(ctx) {
  const size = 92, x0 = H.sl + 10, y0 = H.st + 10, cs = 4, rad = (size / cs / 2) | 0;
  ctx.fillStyle = 'rgba(6,5,9,0.75)'; ctx.fillRect(x0, y0, size, size);
  const pcx = S.px | 0, pcy = S.py | 0;
  const THEME_COL = { stone: '#8a6a4a', crypt: '#5a4a5a', moss: '#4f7a3a', ice: '#5a88c8', ember: '#c8702a', grey: '#8a8a96', cosmic: '#7a4ab8', violet: '#8a5ad0', slime: '#3aa0a8' };
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, size, size); ctx.clip();
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    const cx = pcx + dx, cy = pcy + dy; if (cx < 0 || cy < 0 || cx >= MW || cy >= MH) continue;
    const i = cy * MW + cx; let seen = false;
    for (let oy = -2; oy <= 2 && !seen; oy++) for (let ox = -2; ox <= 2; ox++) { const nx = cx + ox, ny = cy + oy; if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && MAP.explored[ny * MW + nx]) { seen = true; break; } }
    if (!seen) continue;
    const t = MAP.type[i]; let col;
    if (t === 1) col = THEME_COL[ZONES[MAP.zone[i]].theme] || '#888'; else if (t === 2) { const d = MAP.doors[MAP.doorIdx[i]]; col = d.removed ? '#2a2630' : d.fog ? '#e8e8f8' : '#a06a30'; } else if (t === 3) col = '#ff6a20'; else col = '#2a2630';
    ctx.fillStyle = col; ctx.fillRect(x0 + (dx + rad) * cs - (S.px - pcx - 0.5) * cs, y0 + (dy + rad) * cs - (S.py - pcy - 0.5) * cs, cs, cs);
  }
  for (const b of S.bonfires) { const dx = b.x - S.px, dy = b.y - S.py; if (Math.abs(dx) <= rad && Math.abs(dy) <= rad && MAP.explored[(b.y | 0) * MW + (b.x | 0)]) { ctx.fillStyle = b.lit ? '#ffb040' : '#806040'; ctx.fillRect(x0 + size / 2 + dx * cs - 2, y0 + size / 2 + dy * cs - 2, 4, 4); } }
  for (const e of S.enemies) { if (e.dead || e.state === 'sleep') continue; const dx = e.x - S.px, dy = e.y - S.py; if (Math.abs(dx) <= rad && Math.abs(dy) <= rad && (e.state !== 'idle' || Math.hypot(dx, dy) < 6)) { ctx.fillStyle = e.boss ? '#ff3030' : '#e04040'; ctx.fillRect(x0 + size / 2 + dx * cs - 1.5, y0 + size / 2 + dy * cs - 1.5, 3, 3); } }
  if (S.bloodstain) { const dx = S.bloodstain.x - S.px, dy = S.bloodstain.y - S.py; if (Math.abs(dx) <= rad && Math.abs(dy) <= rad) { ctx.fillStyle = '#60ff90'; ctx.fillRect(x0 + size / 2 + dx * cs - 2, y0 + size / 2 + dy * cs - 2, 4, 4); } }
  // player arrow
  const cx = x0 + size / 2, cy = y0 + size / 2; ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(cx + Math.cos(S.pa) * 5, cy + Math.sin(S.pa) * 5); ctx.lineTo(cx + Math.cos(S.pa + 2.5) * 4, cy + Math.sin(S.pa + 2.5) * 4); ctx.lineTo(cx + Math.cos(S.pa - 2.5) * 4, cy + Math.sin(S.pa - 2.5) * 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(190,160,100,0.6)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, size - 1, size - 1);
  const z = zoneAt(S.px, S.py); drawText(ctx, z.name, x0, y0 + size + 4, 1, '#b8a888');
}
function drawPortraits(ctx) {
  const n = S.party.length, slotW = Math.min(118, (H.W - H.sl - H.sr - 20) / 4), gap = 4, total = n * slotW + (n - 1) * gap, x0 = H.W / 2 - total / 2, y0 = H.barTop + 4, slotH = 58;
  ctx.fillStyle = 'rgba(8,7,12,0.8)'; ctx.fillRect(0, H.barTop, H.W, H.H - H.barTop);
  ctx.fillStyle = 'rgba(190,160,100,0.35)'; ctx.fillRect(0, H.barTop, H.W, 1);
  S.party.forEach((m, i) => {
    const x = x0 + i * (slotW + gap), y = y0;
    const hurtOff = m.hurt > 0 ? Math.sin(S.t * 60) * 2 * m.hurt : 0;
    ctx.fillStyle = m.dead ? 'rgba(20,10,10,0.9)' : 'rgba(26,22,30,0.95)'; ctx.fillRect(x, y, slotW, slotH);
    ctx.strokeStyle = m.cd <= 0 && !m.dead ? m.def.color : 'rgba(110,100,90,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1);
    // portrait
    const spr = getSprite(m.spr); const frame = m.dead ? 0 : ((S.t * 4 + i) | 0) % spr.frames.length;
    const im = spriteCanvas(spr, frame, 3); const bsc = 1 + (m.bounce > 0 ? m.bounce * 0.12 : 0);
    ctx.save(); ctx.translate(x + 26 + hurtOff, y + 29); ctx.scale(bsc, bsc);
    if (m.dead) ctx.globalAlpha = 0.35;
    ctx.drawImage(im, -22, -22, 44, 44); ctx.restore();
    if (m.hurt > 0) { ctx.fillStyle = 'rgba(255,40,30,' + (m.hurt * 0.5) + ')'; ctx.fillRect(x + 2, y + 2, 48, slotH - 4); }
    if (m.heal > 0) { ctx.fillStyle = 'rgba(80,255,120,' + (m.heal * 0.35) + ')'; ctx.fillRect(x + 2, y + 2, 48, slotH - 4); }
    if (m.dead) { const sk = spriteCanvas(getSprite('skull'), 0, 2); ctx.drawImage(sk, x + 10, y + 13, 32, 32); }
    // text & bars
    const tx = x + 54, tw = slotW - 58;
    drawText(ctx, m.name, tx, y + 5, 1, m.dead ? '#8a6a6a' : '#f0e4c8');
    drawText(ctx, 'L' + m.level, x + slotW - 4, y + 5, 1, '#b8a888', 'right');
    bar(ctx, tx, y + 15, tw, 6, m.hp / m.hpMax, m.hp < m.hpMax * 0.25 ? '#ff5030' : '#b8282a');
    drawText(ctx, Math.ceil(m.hp) + '/' + m.hpMax, tx + tw, y + 22, 1, '#c8b8a0', 'right');
    bar(ctx, tx, y + 31, tw, 4, m.spts / m.spMax, '#3a6ac8');
    // ability
    const ab = ABILITIES[m.def.ability]; const ready = !m.dead && m.cd <= 0 && (!ab.sp || m.spts >= ab.sp) && (!ab.stam || S.stam >= ab.stam);
    drawText(ctx, ab.name.toUpperCase(), tx, y + 39, 1, ready ? '#ffe9a0' : '#7a7068');
    if (m.cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(tx, y + 38, tw * (m.cd / ab.cd), 9); drawText(ctx, Math.ceil(m.cd) + 's', tx + tw, y + 48, 1, '#b8a888', 'right'); }
    else drawText(ctx, ab.sp ? ab.sp + ' SP' : ab.stam + ' ST', tx + tw, y + 48, 1, '#8aa0b8', 'right');
    if (!Input.isTouch) drawText(ctx, '[' + (i + 1) + ']', tx, y + 48, 1, '#8a8078');
    if (m.rec > 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x + 4, y + 51, 44 * clamp(m.rec / recoveryTime(m), 0, 1), 3); }
    if (m.dmgPop) { drawText(ctx, '-' + m.dmgPop.n, x + 26, y - 12 - (1 - m.dmgPop.t) * 10, 2, '#ff6a50', 'center'); }
    if (!m.dead && S.mode === 'play') Input.buttons.push({ id: 'ab' + (i + 1), x, y, w: slotW, h: slotH });
  });
}
function drawButtons(ctx) {
  if (!Input.isTouch) {
    drawText(ctx, 'WASD move  mouse look  SPACE attack  SHIFT dodge  F flask  E interact  1-4 abilities', H.W - H.sr - 8, H.barTop - 26, 1, 'rgba(200,180,150,0.5)', 'right');
  }
  const bx = H.W - H.sr - 64, by = H.barTop - 74;
  if (Input.isTouch) {
    circleBtn(ctx, 'attack', bx, by, 38, 'ATTACK', 'sword_gold', Input.held.attack, null, S.stam < 10 ? 'rgba(60,20,20,0.7)' : undefined);
    circleBtn(ctx, 'dodge', bx - 86, by + 30, 27, 'DODGE', null, Input.held.dodge);
    circleBtn(ctx, 'flask', bx - 86, by - 44, 27, 'FLASK', 'potion_red', false, S.estus + '');
    if (S.target && S.target.boss === false) { }
  }
  if (!Input.isTouch) { drawText(ctx, 'FLASK ' + S.estus + '/' + S.estusMax, H.W - H.sr - 8, H.barTop - 40, 1, '#ffb080', 'right'); }
  // joystick
  if (Input.joy) {
    const j = Input.joy; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(j.ox, j.oy, 46, 0, TAU); ctx.stroke();
    const dx = j.x - j.ox, dy = j.y - j.oy, d = Math.hypot(dx, dy), m = Math.min(1, d / 46); const kx = j.ox + (d ? dx / d * m * 46 : 0), ky = j.oy + (d ? dy / d * m * 46 : 0);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(kx, ky, 18, 0, TAU); ctx.fill();
  } else if (Input.isTouch && S.playTime < 14) { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(H.sl + 90, H.barTop - 90, 46, 0, TAU); ctx.stroke(); drawText(ctx, 'MOVE', H.sl + 90, H.barTop - 95, 1, 'rgba(255,255,255,0.4)', 'center'); drawText(ctx, 'DRAG HERE TO LOOK', H.W - H.sr - 300, H.st + 60, 1, 'rgba(255,255,255,0.4)', 'center'); }
}
function drawMessages(ctx) {
  let y = H.barTop - 36;
  for (let i = S.msgs.length - 1; i >= 0; i--) { const m = S.msgs[i]; ctx.globalAlpha = clamp(m.time, 0, 1); drawText(ctx, m.t, H.sl + 10, y, 1, '#e8dcc0'); y -= 11; }
  ctx.globalAlpha = 1;
}
function drawItemCard(ctx) {
  const c = S.itemCard; if (!c) return;
  const def = ITEM_DEFS[c.item]; const w = Math.max(220, textWidth(def.name, 2) + 70), x = H.W / 2 - w / 2, y = H.barTop - 110;
  ctx.globalAlpha = clamp(c.t, 0, 1); panel(ctx, x, y, w, 46, 0.9);
  const im = spriteCanvas(getSprite(def.icon), 0, 2); ctx.drawImage(im, x + 10, y + 7, 32, 32);
  drawText(ctx, def.name, x + 52, y + 9, 2, '#ffe9a0'); drawText(ctx, 'acquired', x + 52, y + 28, 1, '#b8a888');
  ctx.globalAlpha = 1;
  Input.buttons.push({ id: 'itemcard', x, y, w, h: 46 });
}
function drawCenter(ctx) {
  const c = S.center; if (!c) return;
  const k = c.t / c.dur; const a = k > 0.85 ? (1 - k) / 0.15 : k < 0.25 ? k / 0.25 : 1;
  ctx.globalAlpha = clamp(a, 0, 1);
  const y = H.H * 0.38;
  if (c.kind === 'area') {
    serifText(ctx, c.text, H.W / 2, y, Math.min(34, H.W / 18), '#e9e2d0', 'center', 3);
    ctx.fillStyle = 'rgba(233,226,208,0.6)'; ctx.fillRect(H.W / 2 - 140, y + 22, 280, 1);
    if (c.sub) serifText(ctx, c.sub, H.W / 2, y + 40, 14, '#b8a888', 'center', 1, false);
  } else if (c.kind === 'bonfire') {
    serifText(ctx, c.text, H.W / 2, y, Math.min(40, H.W / 16), '#ffb347', 'center', 4);
  } else if (c.kind === 'victory') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y - 34, H.W, 68);
    serifText(ctx, c.text, H.W / 2, y, Math.min(40, H.W / 16), '#e8c060', 'center', 5);
  }
  ctx.globalAlpha = 1;
}
function drawDead(ctx) {
  const t = S.deathT; const a = clamp(t / 1.2, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,' + (a * 0.75) + ')'; ctx.fillRect(0, 0, H.W, H.H);
  const y = H.H * 0.42; ctx.fillStyle = 'rgba(0,0,0,' + (a * 0.5) + ')'; ctx.fillRect(0, y - 40, H.W, 80);
  ctx.globalAlpha = a; const size = Math.min(64, H.W / 10) * (1 + t * 0.012);
  serifText(ctx, 'YOU DIED', H.W / 2, y, size, '#9b1a16', 'center', 6);
  ctx.globalAlpha = 1;
}
// ---- menus ----
function menuItems() {
  const m = S.menu, items = [];
  if (m.kind === 'bonfire') {
    items.push({ label: 'Rest', sub: 'Heal, revive, refill flask. Enemies return.', act: () => { restAtBonfire(m.bonfire); closeMenu(); showCenter('RESTED', null, 1.5, 'bonfire'); } });
    items.push({ label: 'Level up', sub: 'Spend souls to strengthen a companion', act: () => { S.menu = { kind: 'levelup', sel: 0, back: m }; } });
    const lit = S.bonfires.filter(b => b.lit && b !== m.bonfire);
    items.push({ label: 'Travel', sub: lit.length ? 'Warp to another lit bonfire' : 'No other bonfires lit', disabled: !lit.length, act: () => { S.menu = { kind: 'travel', sel: 0, back: m }; } });
    items.push({ label: 'Leave', act: closeMenu });
  } else if (m.kind === 'levelup') {
    if (m.member === undefined) {
      S.party.forEach((p, i) => items.push({ label: p.name + '  L' + p.level + '  ' + p.cls, sub: 'MT ' + p.mt + '  EN ' + p.en + '  IT ' + p.it + '  SP ' + p.sp + '   cost ' + fmtNum(levelCost(p.level)), disabled: S.souls < levelCost(p.level), act: () => { m.member = i; m.sel = 0; } }));
      items.push({ label: 'Back', act: () => { S.menu = m.back || null; if (!S.menu) closeMenu(); } });
    } else {
      const p = S.party[m.member];
      for (const st of ['mt', 'en', 'it', 'sp']) items.push({ label: STAT_NAMES[st] + '  ' + p[st] + ' > ' + (p[st] + (st === 'en' ? 2 : 1)), sub: STAT_DESC[st], act: () => { if (levelUp(p, st)) { message(p.name + ' reaches level ' + p.level + '.'); } m.member = undefined; m.sel = 0; } });
      items.push({ label: 'Back', act: () => { m.member = undefined; m.sel = 0; } });
    }
  } else if (m.kind === 'travel') {
    for (const b of S.bonfires.filter(b => b.lit)) items.push({ label: b.name, act: () => { S.bonfire = b.id; closeMenu(); S.fade = { t: 1, dur: 1, color: '#000' }; respawn(); S.mode = 'play'; } });
    items.push({ label: 'Back', act: () => { S.menu = m.back; } });
  } else if (m.kind === 'keeper') {
    const lines = KEEPER_LINES;
    items.push({ label: 'Talk', sub: 'Hear what the Keeper knows', act: () => { m.line = (m.line + 1) % lines.length; m.said = lines[m.line]; } });
    for (const w of KEEPER_WARES) { const sold = S.flags.item['keeper_' + w.id]; items.push({ label: w.name + (sold ? '  (sold)' : '  ' + fmtNum(w.cost)), sub: w.sub, disabled: sold || S.souls < w.cost, act: () => { S.souls -= w.cost; S.flags.item['keeper_' + w.id] = 1; giveItem(w.item); m.said = 'Spend it well. Souls are the only coin the dark respects.'; saveGame(); } }); }
    items.push({ label: 'Leave', act: closeMenu });
  } else if (m.kind === 'lore') {
    items.push({ label: 'Close', act: closeMenu });
  } else if (m.kind === 'pause') {
    items.push({ label: 'Resume', act: closeMenu });
    items.push({ label: (Snd.muted ? 'Unmute' : 'Mute') + ' audio', act: () => { Snd.muted = !Snd.muted; if (Snd.master) Snd.master.gain.value = Snd.muted ? 0 : 0.5; } });
    items.push({ label: 'Look sensitivity: ' + (Input.sensT > 0.006 ? 'High' : Input.sensT > 0.0035 ? 'Normal' : 'Low'), act: () => { Input.sensT = Input.sensT > 0.006 ? 0.0028 : Input.sensT > 0.0035 ? 0.0075 : 0.0045; } });
    items.push({ label: 'Journal', sub: 'Souls ' + fmtNum(S.souls) + '  Deaths ' + S.deaths + '  Kills ' + S.kills + '  Time ' + fmtTime(S.playTime), act: () => { } });
    items.push({ label: 'Quit to title', sub: 'Progress is saved at bonfires', act: () => { saveGame(); S.mode = 'title'; S.menu = null; Snd.music('title'); } });
  }
  return items;
}
const KEEPER_LINES = [
  'Ah. Four more. The cell always opens for four; it is the only kindness this place still remembers.',
  'The Mandate of Heaven was a promise: a king on the throne, a flame in the Sanctum, the dark kept out. The flame guttered. The king stayed.',
  'Rest at the bonfires. Spend your souls there and grow strong, or hoard them and lose them to the dark. The choice is the whole of the game.',
  'Asterion guards the east gate. Beyond him the Mossgrave, where the Elder holds the Reliquary key in his roots. The sealed door below is his.',
  'Ice, then fire, then the sky that is not a sky. At the end of it sits the King. Relieve him of his crown, and the flame may yet catch.',
  'When one of you falls, the rest carry on. When all of you fall, you return here, lighter by every soul you carried. Try not to carry too many.',
  'I have kept this fire for longer than I had a name. Go on. I will be here when you die.',
];
const KEEPER_WARES = [
  { id: 'ember', name: 'Keeper\'s Ember', cost: 2500, sub: '+1 Estus Flask draught', item: 'ember' },
  { id: 'titanite', name: 'Titanite Shard', cost: 2000, sub: 'Reinforce all weapons', item: 'titanite' },
  { id: 'heart', name: 'Humanity', cost: 1200, sub: 'Raise max HP of all', item: 'heart' },
];
function fmtTime(s) { s |= 0; return ((s / 3600) | 0) + ':' + ('0' + ((s / 60) % 60 | 0)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); }
function closeMenu() { S.menu = null; S.mode = 'play'; Snd.sfx('ui'); }
function drawMenu(ctx) {
  const m = S.menu; if (!m) return;
  const items = menuItems(); m.items = items;
  const w = Math.min(480, H.W - H.sl - H.sr - 40), rowH = 44, titleH = 46;
  let bodyH = items.length * rowH + 16;
  let extraH = 0; if (m.kind === 'lore') extraH = 120; if (m.kind === 'keeper') extraH = 70;
  const h = titleH + bodyH + extraH, x = H.W / 2 - w / 2, y = Math.max(H.st + 6, H.H / 2 - h / 2 - 20);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, H.W, H.H);
  panel(ctx, x, y, w, h, 0.92);
  const title = { bonfire: 'BONFIRE', levelup: m.member !== undefined ? S.party[m.member].name.toUpperCase() + ' - CHOOSE A STAT' : 'LEVEL UP', travel: 'TRAVEL', keeper: 'THE KEEPER', lore: 'INSCRIPTION', pause: 'PAUSED' }[m.kind];
  serifText(ctx, title, x + w / 2, y + 24, 18, '#e8c060', 'center', 2);
  if (m.kind === 'bonfire' || m.kind === 'levelup' || m.kind === 'keeper') drawText(ctx, fmtNum(S.souls) + ' souls', x + w - 12, y + 10, 1, '#b8ffd0', 'right');
  let cy = y + titleH;
  if (m.kind === 'lore') { const lines = wrapText(m.text, 2, w - 40); lines.forEach((l, i) => drawText(ctx, l, x + 20, cy + 8 + i * 18, 2, '#e8dcc0')); cy += extraH; }
  if (m.kind === 'keeper') { const said = m.said || KEEPER_LINES[0]; const lines = wrapText(said, 1, w - 40); lines.forEach((l, i) => drawText(ctx, l, x + 20, cy + 6 + i * 11, 1, '#e8dcc0')); cy += extraH; }
  items.forEach((it, i) => { rectBtn(ctx, 'menu' + i, x + 12, cy + 8 + i * rowH, w - 24, rowH - 6, it.label, i === m.sel, it.disabled, it.sub); });
  if (!Input.isTouch) drawText(ctx, 'ARROWS / ENTER / ESC', x + w / 2, y + h - 12, 1, '#7a7068', 'center');
}
function menuInput() {
  const m = S.menu; if (!m) return; const items = m.items || menuItems();
  if (Input.consume('menu')) { if (m.kind === 'levelup' && m.member !== undefined) { m.member = undefined; } else if (m.back) S.menu = m.back; else closeMenu(); return; }
  if (Input.keys.ArrowUp && !m._ku) { m.sel = (m.sel - 1 + items.length) % items.length; Snd.sfx('ui'); } m._ku = !!Input.keys.ArrowUp;
  if (Input.keys.ArrowDown && !m._kd) { m.sel = (m.sel + 1) % items.length; Snd.sfx('ui'); } m._kd = !!Input.keys.ArrowDown;
  if (Input.consume('interact') || Input.consume('attack')) { const it = items[m.sel]; if (it && !it.disabled) { Snd.sfx('ui'); it.act(); } }
  for (let i = 0; i < items.length; i++) if (Input.consume('menu' + i)) { m.sel = i; const it = items[i]; if (!it.disabled) { Snd.sfx('ui'); it.act(); } }
}
// ---- title & victory ----
function drawTitle(ctx) {
  const W = H.W, HH = H.H;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, HH);
  const g = ctx.createLinearGradient(0, HH * 0.6, 0, HH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
  const ty = HH * 0.3;
  serifText(ctx, 'ASHEN MANDATE', W / 2, ty, Math.min(58, W / 11), '#e8c060', 'center', 8);
  ctx.fillStyle = 'rgba(232,192,96,0.5)'; ctx.fillRect(W / 2 - 160, ty + 36, 320, 1);
  serifText(ctx, 'a first-person tale of the Hollow Crown', W / 2, ty + 54, 14, '#c8b8a0', 'center', 1, false);
  const by = HH * 0.62, bw = 220;
  const has = hasSave();
  rectBtn(ctx, 'new', W / 2 - bw / 2, by - (has ? 26 : 0), bw, 40, has ? 'NEW GAME' : 'BEGIN', S.titleSel === 0);
  if (has) rectBtn(ctx, 'continue', W / 2 - bw / 2, by + 24, bw, 40, 'CONTINUE', S.titleSel === 1);
  drawText(ctx, 'Dungeon tiles by RunninBlood. Creature sprites from the Basic, Premium and Supporter asset packs.', W / 2, HH - H.sb - 30, 1, '#8a8078', 'center');
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone;
  const hint = ios ? 'iPhone: tap Share, then Add to Home Screen, for full screen play.' : Input.isTouch ? 'Best played in landscape, installed to your Home Screen.' : 'Click the view to capture the mouse. WASD + mouse, SPACE to attack.';
  drawText(ctx, hint, W / 2, HH - H.sb - 18, 1, ios ? '#e8c060' : '#8a8078', 'center');
}
function drawVictory(ctx) {
  const W = H.W, HH = H.H;
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, HH);
  serifText(ctx, 'THE MANDATE IS RELIT', W / 2, HH * 0.26, Math.min(44, W / 14), '#e8c060', 'center', 6);
  const lines = ['The Ashen King is unseated. The flame in the Sanctum catches, coughs, and holds.', 'Four walk back up through ice and fire and moss, past every bonfire they lit,', 'to a cell beneath the Undercroft whose door now, finally, closes behind them.', '', 'Time ' + fmtTime(S.playTime) + '   Deaths ' + S.deaths + '   Kills ' + S.kills + '   Souls ' + fmtNum(S.souls)];
  lines.forEach((l, i) => drawText(ctx, l, W / 2, HH * 0.4 + i * 16, 1, i === 4 ? '#b8ffd0' : '#e8dcc0', 'center'));
  rectBtn(ctx, 'continue', W / 2 - 110, HH * 0.72, 220, 40, 'KEEP EXPLORING', true);
  rectBtn(ctx, 'new', W / 2 - 110, HH * 0.72 + 50, 220, 40, 'TITLE', false);
}

// ---- 90_main.js ----
// ===== Boot & main loop =====
let viewCvs, lastT = 0, titleCam = { x: 13.5, y: 15.5, a: -Math.PI / 2, t: 0 }, fpsAcc = 0, fpsN = 0, FPS = 60;
function readInsets() {
  const cs = getComputedStyle(document.documentElement);
  const v = k => parseFloat(cs.getPropertyValue(k)) || 0;
  return { l: v('--sal'), r: v('--sar'), t: v('--sat'), b: v('--sab') };
}
function resize() {
  const vv = window.visualViewport;
  const W = Math.round(vv ? vv.width : window.innerWidth), Hh = Math.round(vv ? vv.height : window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ins = readInsets();
  const VH = clamp(Math.round(Hh / 2.1 * (window.RES_SCALE || 1)), 140, 270), VW = Math.min(620, Math.round(VH * W / Hh));
  R.hfov = VW / VH > 2 ? 1.42 : 1.28;
  R.cvs = viewCvs; initRenderer(VW, VH);
  viewCvs.style.width = W + 'px'; viewCvs.style.height = Hh + 'px';
  H.viewScaleX = W / VW; H.viewScaleY = Hh / VH;
  hudResize(W, Hh, dpr, ins);
  const touchDev = Input.isTouch || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  document.getElementById('rotate').style.display = (W < Hh && touchDev) ? 'flex' : 'none';
}
async function boot() {
  viewCvs = document.getElementById('view');
  hudInit(document.getElementById('hud'));
  Input.init(document.body);
  resize();
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 300));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  const loading = document.getElementById('loading');
  try {
    await loadAssets(window.ASSET_SRC);
    buildProceduralSprites();
    compileMap();
  } catch (e) { loading.textContent = 'Failed to load: ' + e.message; throw e; }
  loading.style.display = 'none';
  S.mode = 'title'; S.titleSel = hasSave() ? 1 : 0; S.t = 0; S.msgs = []; S.fx = []; S.party = []; S.px = titleCam.x; S.py = titleCam.y; S.pa = titleCam.a; S.pitch = 0;
  S.objects = []; S.enemies = []; S.projectiles = []; S.pickups = []; S.bonfires = []; S.interact = [];
  // title scene: a lit hub with keeper
  S.flags = { boss: {}, chest: {}, gate: {}, item: {}, bonfire: { '13,13': 1 }, unique: {}, door: {}, lore: {} };
  buildEntities(); S.enemies = [];
  const first = () => { Snd.init(); if (!Snd.musicKind) Snd.music('title'); };
  window.addEventListener('touchstart', first, { once: true }); window.addEventListener('mousedown', first, { once: true }); window.addEventListener('keydown', first, { once: true });
  requestAnimationFrame(loop);
}
function goFullscreen() {
  if (!Input.isTouch || navigator.standalone) return;
  try { const el = document.documentElement; const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null; const lock = () => { try { const l = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (l && l.catch) l.catch(() => {}); } catch (e) { } }; if (p && p.then) p.then(lock, () => {}); else lock(); } catch (e) { }
}
function startNew() { Snd.init(); goFullscreen(); newGame(); Snd.music('ambient'); S.fade = { t: 1.5, dur: 1.5, color: '#000' }; }
function startContinue() { Snd.init(); goFullscreen(); if (!loadGame()) startNew(); else Snd.music('ambient'); }
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
  fpsAcc += dt; fpsN++; if (fpsAcc >= 1) { FPS = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (S.mode === 'play' && S.playTime > 4 && FPS < 42 && (window.RES_SCALE || 1) > 0.6) { window.RES_SCALE = (window.RES_SCALE || 1) * 0.85; resize(); } }
  Input.update();
  S.t += dt;
  if (S.mode === 'title') {
    titleCam.t += dt; S.px = 13.5 + Math.cos(titleCam.t * 0.15) * 2.2; S.py = 13.5 + Math.sin(titleCam.t * 0.15) * 2.2; S.pa = Math.atan2(13.5 - S.py, 13.5 - S.px);
    if (Input.consume('new')) startNew(); else if (Input.consume('continue')) startContinue();
    if (Input.keys.ArrowUp || Input.keys.ArrowDown) { if (!S._tk) { S.titleSel = hasSave() ? 1 - S.titleSel : 0; Snd.sfx('ui'); } S._tk = true; } else S._tk = false;
    if (Input.consume('interact') || Input.consume('attack')) { if (S.titleSel === 1 && hasSave()) startContinue(); else startNew(); }
    for (const o of S.objects) if (o.anim !== undefined) { o.anim += dt; o.frame = (o.anim * o.spr.fps) | 0; }
  } else if (S.mode === 'play') {
    S.playTime += dt;
    S.focus = findFocus();
    updatePlayer(dt); if (S.mode === 'play') updateEnemies(dt); if (S.mode === 'play') updateProjectiles(dt); if (S.mode === 'play') updateCombat(dt);
    if (S.mode !== 'play') { Input.endFrame(); }
    if (Input.consume('attack') || Input.held.attack) partyAttack();
    if (Input.consume('flask')) useFlask();
    if (Input.consume('interact')) doInteract(S.focus);
    if (Input.consume('tap')) { if (S.focus) doInteract(S.focus); }
    for (let i = 1; i <= 4; i++) if (Input.consume('ab' + i)) useAbility(i - 1);
    if (Input.consume('menu') || Input.consume('map')) { S.menu = { kind: 'pause', sel: 0 }; S.mode = 'menu'; Snd.sfx('ui'); }
    if (Input.consume('itemcard')) S.itemCard = null;
    for (const m of S.msgs) m.time -= dt; S.msgs = S.msgs.filter(m => m.time > 0);
    if (S.center) { S.center.t -= dt; if (S.center.t <= 0) S.center = null; }
    if (S.itemCard) { S.itemCard.t -= dt; if (S.itemCard.t <= 0) S.itemCard = null; }
    if (S.ending > 0) { S.ending -= dt; if (S.ending <= 0) { S.mode = 'victory'; saveGame(); } }
  } else if (S.mode === 'menu') {
    menuInput();
    for (const o of S.objects) if (o.anim !== undefined) { o.anim += dt; o.frame = (o.anim * o.spr.fps) | 0; }
  } else if (S.mode === 'dead') {
    S.deathT += dt;
    for (const e of S.enemies) e.anim += dt;
    if (S.deathT > 3.8) respawn();
  } else if (S.mode === 'victory') {
    if (Input.consume('continue')) { S.mode = 'play'; }
    if (Input.consume('new')) { S.mode = 'title'; Snd.music('title'); }
  }
  if (S.fade) { S.fade.t -= dt; if (S.fade.t <= 0) S.fade = null; }
  Snd.update(dt, S.mode === 'play' && !!S.boss);
  // render
  R.pitch = S.pitch || 0; R.bob = S.mode === 'play' ? S.bob || 0 : 0; R.time = S.t;
  R.flick = 1 + Math.sin(S.t * 13) * 0.025 + Math.sin(S.t * 7.3) * 0.02;
  renderWorld(MAP, { x: S.px, y: S.py, a: S.pa }, gatherSprites());
  presentFrame();
  const sh = S.shake > 0 ? S.shake * 8 : 0;
  viewCvs.style.transform = sh ? 'translate(' + ((Math.random() - 0.5) * sh) + 'px,' + ((Math.random() - 0.5) * sh) + 'px)' : '';
  drawHUD(dt);
  if (window.DEBUG_FPS) { H.ctx.setTransform(H.dpr, 0, 0, H.dpr, 0, 0); drawText(H.ctx, FPS.toFixed(0) + ' fps ' + R.VW + 'x' + R.VH, H.W / 2, H.st + 2, 1, '#8f8', 'center'); }
  Input.endFrame();
}
window.addEventListener('load', boot);
window.AM = { S, R, Input, get MAP() { return MAP; }, newGame, loadGame, saveGame, message, showCenter, giveItem, ENEMY_DEFS, WORLD, Snd, getSprite, spawnEnemies, damageEnemy, useAbility, partyAttack, doInteract, findFocus, hitParty, respawn, dieParty, restAtBonfire, makeEnemy, zoneAt };

})();
