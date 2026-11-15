// ===================== assets: images, silhouettes, pixel maps, glow textures =====================
const IMG = {}; let MOBS = {};
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image ' + String(src).slice(0, 40))); i.src = src; }); }
async function loadAssets() {
  const A = window.__ASSETS;
  for (const k of ['cellar', 'mobs', 'doors']) IMG[k] = await loadImage(A ? A[k] : 'assets/' + (k === 'doors' ? 'cellar_doors' : k) + '.png');
  MOBS = A ? A.mobsJson : await (await fetch('assets/mobs.json')).json();
  IMG.mobsW = silhouette(IMG.mobs); PIX.mobs = pixelData(IMG.mobs); cutSword();
  for (const k in COL) { GLOW[k] = glowTex(COL[k]); }
  SMOKE.grey = smokeTex([70, 66, 72]); SMOKE.dust = smokeTex([122, 100, 78]); SMOKE.dark = smokeTex([22, 18, 24]); SMOKE.green = smokeTex([60, 120, 60]); SMOKE.breath = smokeTex([226, 230, 240]);
  ROCKS.length = 0; for (let i = 0; i < 6; i++) ROCKS.push(rockTex(i));
}
function silhouette(img) { const c = mkCanvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return c; }
const PIX = {}, PIXCACHE = {};
function pixelData(img) { const c = mkCanvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); return { w: img.width, d: x.getImageData(0, 0, img.width, img.height).data }; }
// opaque pixels of one sprite frame, relative to its feet (bottom-centre); cached
function spritePixels(key) {
  if (PIXCACHE[key]) return PIXCACHE[key];
  const m = MOBS[key], P = PIX.mobs, sx = 0, sy = m[0], fw = m[1], fh = m[2];
  const out = []; let foot = 0, top = fh;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = ((sy + y) * P.w + sx + x) * 4; if (P.d[i + 3] > 128) { foot = Math.max(foot, y); top = Math.min(top, y); } }
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = ((sy + y) * P.w + sx + x) * 4; if (P.d[i + 3] <= 128) continue;
    out.push({ x: x - fw / 2 + 0.5, y: y - foot - 0.5, c: `rgb(${P.d[i]},${P.d[i + 1]},${P.d[i + 2]})` });
  }
  out.foot = foot; out.top = top; return (PIXCACHE[key] = out);
}
function footOf(key) { return spritePixels(key).foot; }
// soft additive glow sprite for a colour
const GLOW = {};
// pixel-art light: soft gradients are cut into a few hard steps of alpha, so glows, lights and smoke come out as bands of pixels
function posterize(cv, levels) { const x = cv.getContext('2d'), id = x.getImageData(0, 0, cv.width, cv.height), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] = Math.round(Math.round(d[i] / 255 * levels) / levels * 255); x.putImageData(id, 0, 0); return cv; }
function glowTex(c) {
  const s = 64, cv = mkCanvas(s, s), x = cv.getContext('2d'), g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, `rgba(${Math.min(255, c[0] + 90)},${Math.min(255, c[1] + 90)},${Math.min(255, c[2] + 90)},1)`);
  g.addColorStop(0.18, `rgba(${c[0]},${c[1]},${c[2]},0.85)`); g.addColorStop(0.5, `rgba(${c[0]},${c[1]},${c[2]},0.28)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
  x.fillStyle = g; x.fillRect(0, 0, s, s); return posterize(cv, 4);
}
const SMOKE = {};
function smokeTex(c) {
  const s = 64, cv = mkCanvas(s, s), x = cv.getContext('2d');
  for (let i = 0; i < 7; i++) { const px = s / 2 + rand(-9, 9), py = s / 2 + rand(-9, 9), r = rand(12, 22), g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.5)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s); }
  return posterize(cv, 3);
}
// procedural falling rock / meteor body
const ROCKS = [];
function rockTex(seed) {
  const s = 20, cv = mkCanvas(s, s), x = cv.getContext('2d'); const n = 9, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, r = 6 + Math.random() * 3.5; pts.push([s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r * 0.9]); }
  const path = () => { x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); };
  path(); x.fillStyle = '#5a5048'; x.fill(); x.lineWidth = 1.2; x.strokeStyle = '#231d1a'; x.stroke();
  x.save(); path(); x.clip(); x.fillStyle = '#7d7064'; x.beginPath(); x.ellipse(s / 2 - 2, s / 2 - 3, 5, 3.5, -0.4, 0, TAU); x.fill(); x.fillStyle = '#9a8c7c'; x.fillRect(s / 2 - 4, s / 2 - 5, 2, 2); x.fillStyle = '#3c342e'; x.fillRect(s / 2 + 2, s / 2 + 1, 3, 2); x.restore();
  return cv;
}

// ---------- the sellsword's sword, cut out of his own sprite so that he can swing it ----------
// At rest he is drawn as he always was. While he attacks, his frames are drawn without the sword (the fist kept, the gaps
// outlined again) and the sword is drawn on its own, turned about the grip. The turned swords are made once, the RotSprite
// way: the sword is scaled up 8x with Scale2x (which rounds its edges instead of making blocks), turned, and sampled back
// down, so a blade at an angle keeps clean pixel lines. Quarter turns are exact copies.
const WEAPON_CUT = { VeteranSwordsman: { grip: [[12, 8], [12, 9], [11, 9], [12, 9]] } }; // the top of the grip, frame by frame
const SWORD = { cut: null, cutW: null, rot: [], fist: [], n: 64, r: 10 };
function cutSword() {
  const key = 'VeteranSwordsman', m = MOBS[key]; if (!m) return; const [sy, fw, fh] = m, W = PIX.mobs.w, D = PIX.mobs.d, OUT = [29, 29, 28, 255];
  const px = (x, y) => { const i = ((sy + y) * W + x) * 4; return [D[i], D[i + 1], D[i + 2], D[i + 3]]; };
  // the sword's pixels around the top of its grip: three columns from the tip's outline down to the pommel's, and the right
  // end of the crossguard. The fist (two pixels left of the grip) stays on the body; on the sword those two pixels, and the
  // guard's left end (where his arm is), become outline.
  const rel = []; for (let dy = -8; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) rel.push([dx, dy]); rel.push([2, -1]);
  const isFist = (dx, dy) => dx === -1 && (dy === 0 || dy === 1);
  const sw = 5, sh = 12, img = new Uint8ClampedArray(sw * sh * 4), [g0x, g0y] = WEAPON_CUT[key].grip[0];
  for (const [dx, dy] of rel.concat([[-2, -1]])) { const c = isFist(dx, dy) || dx === -2 ? OUT : px(g0x + dx, g0y + dy), i = ((dy + 8) * sw + dx + 2) * 4; for (let k = 0; k < 4; k++) img[i + k] = c[k]; }
  // his four frames without the sword
  const cut = mkCanvas(fw * 4, fh), cx = cut.getContext('2d'), id = cx.createImageData(fw * 4, fh), E = id.data, at = (f, x, y) => (y * fw * 4 + f * fw + x) * 4;
  for (let f = 0; f < 4; f++) for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const c = px(f * fw + x, y), i = at(f, x, y); for (let k = 0; k < 4; k++) E[i + k] = c[k]; }
  for (let f = 0; f < 4; f++) {
    const [gx, gy] = WEAPON_CUT[key].grip[f], gone = [];
    for (const [dx, dy] of rel) { const x = gx + dx, y = gy + dy; if (isFist(dx, dy) || x < 0 || y < 0 || x >= fw || y >= fh) continue; const i = at(f, x, y); if (E[i + 3]) { E[i + 3] = 0; gone.push([x, y]); } }
    const solid = (x, y) => x >= 0 && y >= 0 && x < fw && y < fh && E[at(f, x, y) + 3] > 0, line = (x, y) => { const i = at(f, x, y); return E[i] === 29 && E[i + 1] === 29 && E[i + 2] === 28; };
    for (const [x, y] of gone) if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => solid(x + a, y + b) && !line(x + a, y + b))) { const i = at(f, x, y); E[i] = 29; E[i + 1] = 29; E[i + 2] = 28; E[i + 3] = 255; }
    SWORD.fist.push([[gx - 1, gy, px(f * fw + gx - 1, gy)], [gx - 1, gy + 1, px(f * fw + gx - 1, gy + 1)]]);
  }
  cx.putImageData(id, 0, 0); SWORD.cut = cut; SWORD.cutW = silhouette(cut);
  // the sword turned to 64 angles about the centre of the grip's top pixel (2, 8)
  let big = { w: sw, h: sh, d: img }; for (let k = 0; k < 3; k++) big = scale2x(big);
  const R = SWORD.r, S = 2 * R + 1;
  for (let a = 0; a < SWORD.n; a++) {
    const ph = a / SWORD.n * TAU, co = Math.round(Math.cos(ph) * 1e9) / 1e9, si = Math.round(Math.sin(ph) * 1e9) / 1e9, exact = a % (SWORD.n / 4) === 0;
    const cv = mkCanvas(S, S), x = cv.getContext('2d'), o = x.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
      const rx = xx - R, ry = y - R, ux = 2.5 + co * rx + si * ry, uy = 8.5 - si * rx + co * ry, j = (y * S + xx) * 4;
      const src = exact ? { w: sw, h: sh, d: img } : big, k8 = exact ? 1 : 8, X = Math.floor(ux * k8), Y = Math.floor(uy * k8);
      if (X < 0 || Y < 0 || X >= src.w || Y >= src.h) continue; const i = (Y * src.w + X) * 4; for (let k = 0; k < 4; k++) o.data[j + k] = src.d[i + k];
    }
    x.putImageData(o, 0, 0); SWORD.rot.push(cv);
  }
}
// Scale2x (EPX): doubles a pixel image, following diagonal edges instead of turning every pixel into a block
function scale2x(s) {
  const w = s.w, h = s.h, d = s.d, W = w * 2, o = new Uint8ClampedArray(W * h * 2 * 4);
  const at = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return 0; const i = (y * w + x) * 4; return d[i + 3] ? ((d[i] << 24 | d[i + 1] << 16 | d[i + 2] << 8 | d[i + 3]) >>> 0) : 0; };
  const put = (x, y, v) => { const i = (y * W + x) * 4; o[i] = v >>> 24 & 255; o[i + 1] = v >>> 16 & 255; o[i + 2] = v >>> 8 & 255; o[i + 3] = v & 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), Dn = at(x, y + 1);
    put(2 * x, 2 * y, C === A && C !== Dn && A !== B ? A : P); put(2 * x + 1, 2 * y, A === B && A !== C && B !== Dn ? B : P);
    put(2 * x, 2 * y + 1, Dn === C && Dn !== B && C !== A ? C : P); put(2 * x + 1, 2 * y + 1, B === Dn && B !== A && Dn !== C ? Dn : P);
  }
  return { w: W, h: h * 2, d: o };
}
