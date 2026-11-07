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
function makeSprite(name, frames, opts = {}) {
  const s = Object.assign({ name, frames, fps: 6 }, opts); SPR[name] = s;
  // transparent rows under the art (minimum across frames) as a fraction of the frame height
  let pad = 1;
  for (const fr of frames) { let rows = 0; outer: for (let y = fr.h - 1; y >= 0; y--) { for (let x = 0; x < fr.w; x++) if (fr.px[y * fr.w + x] >>> 24) break outer; rows++; } pad = Math.min(pad, rows / fr.h); }
  s.padB = pad >= 1 ? 0 : pad;
  return s;
}
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
