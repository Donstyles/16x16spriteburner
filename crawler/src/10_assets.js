// ===================== assets: images, silhouettes, pixel maps, glow textures =====================
const IMG = {}; let MOBS = {};
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image ' + String(src).slice(0, 40))); i.src = src; }); }
async function loadAssets() {
  const A = window.__ASSETS;
  for (const k of ['cellar', 'mobs', 'doors']) IMG[k] = await loadImage(A ? A[k] : 'assets/' + (k === 'doors' ? 'cellar_doors' : k) + '.png');
  MOBS = A ? A.mobsJson : await (await fetch('assets/mobs.json')).json();
  IMG.mobsW = silhouette(IMG.mobs); PIX.mobs = pixelData(IMG.mobs); cutWeapons();
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

// ---------- each hero's weapon, cut out of his own sprite so that he can swing it ----------
// At rest a hero is drawn as he always was. While he attacks, his frames are drawn without the weapon (the hand kept, the
// cut edges outlined again) and the weapon is drawn on its own, turned about the hand. A weapon is found by its colours:
// every pixel of one of its colours on its side of the sprite, plus the outline around those pixels that does not also
// border the body. The turned weapons are made once, the RotSprite way: scaled up 8x with Scale2x (which rounds edges
// instead of making blocks), turned, and sampled back down, so a blade at an angle keeps clean pixel lines. Quarter turns
// are exact copies.
const WEAPON_CUT = {
  VeteranSwordsman: { core: ['dceaee', 'b8ccd8', '88a3bc', '5e718e', 'f8e398', '695b59', 'e1bf89'], xMin: 10, hand: ['464762'], grip: [12, 8] }, // arming sword (one frame holds it a pixel to the left)
  BoldManAtArms: { core: ['ecebe7', '595757', 'cbc6c1', '724b2c'], xMin: 9, hand: ['33272a'], grip: [11, 8] },                              // spear, held mid-shaft
  BlessedGladiator: { core: ['fcf7be', 'f6d896', 'e2b27e'], xMin: 12, hand: ['594d4d'], grip: [13, 8] },                                  // golden axe
  HalflingAssassin: { core: ['003b62', '049050', '6ac81f', 'c1f567'], xMin: 11, hand: ['dfb2c6'], grip: [12, 11] },                       // dagger, reverse grip
};
const WEAPON = {}; const WEAPON_TURNS = 64, OUTLINE_RGB = [29, 29, 28];
function cutWeapons() { for (const key in WEAPON_CUT) if (MOBS[key]) WEAPON[key] = cutWeapon(key, WEAPON_CUT[key]); }
function cutWeapon(key, cfg) {
  const [sy, fw, fh] = MOBS[key], SW = PIX.mobs.w, D = PIX.mobs.d, hex = c => c.map(v => v.toString(16).padStart(2, '0')).join('');
  const px = (f, x, y) => { if (x < 0 || y < 0 || x >= fw || y >= fh) return null; const i = ((sy + y) * SW + f * fw + x) * 4; return D[i + 3] > 128 ? [D[i], D[i + 1], D[i + 2], 255] : null; };
  const isOut = c => c && c[0] === OUTLINE_RGB[0] && c[1] === OUTLINE_RGB[1] && c[2] === OUTLINE_RGB[2];
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], N8 = N4.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const core = (x, y) => { const c = px(f, x, y); return !!c && x >= cfg.xMin && cfg.core.includes(hex(c.slice(0, 3))); };
    const body = (x, y) => { const c = px(f, x, y); return !!c && !isOut(c) && !core(x, y); };
    const W = new Set(), key2 = (x, y) => x + ',' + y;
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      if (core(x, y)) { W.add(key2(x, y)); continue; }
      const c = px(f, x, y); if (!isOut(c)) continue;
      if (N8.some(([a, b]) => core(x + a, y + b)) && !N4.some(([a, b]) => body(x + a, y + b))) W.add(key2(x, y));
    }
    const hands = []; for (let y = 0; y < fh; y++) for (let x = Math.max(0, cfg.xMin - 2); x < fw; x++) { const c = px(f, x, y); if (c && cfg.hand.includes(hex(c.slice(0, 3))) && N8.some(([a, b]) => W.has(key2(x + a, y + b)))) hands.push([x, y, c]); }
    let mx = fw, my = fh; for (const k of W) { const [x, y] = k.split(',').map(Number); if (core(x, y)) { mx = Math.min(mx, x); my = Math.min(my, y); } }
    frames.push({ W, hands, mx, my, core, body });
  }
  // the grip in each frame: the weapon pixel beside the hand nearest to where frame 0's grip has moved to
  const piv = frames.map((F, f) => {
    const want = [cfg.grip[0] + F.mx - frames[0].mx, cfg.grip[1] + F.my - frames[0].my]; let best = want, bd = 1e9;
    for (const [hx, hy] of F.hands) for (const [a, b] of N4) { const x = hx + a, y = hy + b; if (!F.core(x, y)) continue; const d = Math.hypot(x - want[0], y - want[1]); if (d < bd) { bd = d; best = [x, y]; } }
    return f === 0 ? cfg.grip : best;
  });
  // the hero without his weapon, frame by frame
  const cut = mkCanvas(fw * 4, fh), cx = cut.getContext('2d'), id = cx.createImageData(fw * 4, fh), E = id.data, at = (f, x, y) => (y * fw * 4 + f * fw + x) * 4;
  for (let f = 0; f < 4; f++) {
    const F = frames[f];
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const c = px(f, x, y); if (!c || F.W.has(x + ',' + y)) continue; const i = at(f, x, y); E[i] = c[0]; E[i + 1] = c[1]; E[i + 2] = c[2]; E[i + 3] = 255; }
    for (const k of F.W) { const [x, y] = k.split(',').map(Number); if (N4.some(([a, b]) => F.body(x + a, y + b) && !F.W.has((x + a) + ',' + (y + b)))) { const i = at(f, x, y); E[i] = OUTLINE_RGB[0]; E[i + 1] = OUTLINE_RGB[1]; E[i + 2] = OUTLINE_RGB[2]; E[i + 3] = 255; } }
  }
  cx.putImageData(id, 0, 0);
  // the weapon alone, from frame 0, its outline closed where the hand held it
  const F0 = frames[0], pts = [...F0.W].map(k => k.split(',').map(Number));
  let x0 = fw, y0 = fh, x1 = 0, y1 = 0; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  x0--; y0--; x1++; y1++; const iw = x1 - x0 + 1, ih = y1 - y0 + 1, img = new Uint8ClampedArray(iw * ih * 4), put = (x, y, c) => { const i = ((y - y0) * iw + (x - x0)) * 4; img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2]; img[i + 3] = 255; };
  for (const [x, y] of pts) put(x, y, px(0, x, y));
  for (const [x, y] of pts) if (F0.core(x, y)) for (const [a, b] of N4) if (!F0.W.has((x + a) + ',' + (y + b))) put(x + a, y + b, OUTLINE_RGB);
  const gx = cfg.grip[0] - x0, gy = cfg.grip[1] - y0;
  // which way it points at rest: from the grip to its farthest coloured pixel, to the nearest quarter turn
  let far = 0, ang = -Math.PI / 2; for (const [x, y] of pts) if (F0.core(x, y)) { const d = Math.hypot(x - cfg.grip[0], y - cfg.grip[1]); if (d > far) { far = d; ang = Math.atan2(y - cfg.grip[1], x - cfg.grip[0]); } }
  const rest = Math.round(ang / (Math.PI / 2)) * (Math.PI / 2);
  let R = 0; for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) if (img[(y * iw + x) * 4 + 3]) R = Math.max(R, Math.ceil(Math.hypot(x - gx, y - gy)) + 1);
  // turned to WEAPON_TURNS angles about the centre of the grip pixel
  let big = { w: iw, h: ih, d: img }; for (let k = 0; k < 3; k++) big = scale2x(big);
  const S = 2 * R + 1, rot = [];
  for (let a = 0; a < WEAPON_TURNS; a++) {
    const ph = a / WEAPON_TURNS * TAU, co = Math.round(Math.cos(ph) * 1e9) / 1e9, si = Math.round(Math.sin(ph) * 1e9) / 1e9, exact = a % (WEAPON_TURNS / 4) === 0;
    const cv = mkCanvas(S, S), x = cv.getContext('2d'), o = x.createImageData(S, S), src = exact ? { w: iw, h: ih, d: img } : big, k8 = exact ? 1 : 8;
    for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
      const rx = xx - R, ry = y - R, ux = gx + 0.5 + co * rx + si * ry, uy = gy + 0.5 - si * rx + co * ry, X = Math.floor(ux * k8), Y = Math.floor(uy * k8);
      if (X < 0 || Y < 0 || X >= src.w || Y >= src.h) continue; const i = (Y * src.w + X) * 4, j = (y * S + xx) * 4; for (let k = 0; k < 4; k++) o.data[j + k] = src.d[i + k];
    }
    x.putImageData(o, 0, 0); rot.push(cv);
  }
  return { cut, cutW: silhouette(cut), rot, r: R, piv, hands: frames.map(F => F.hands), rest, img: { w: iw, h: ih, d: img, gx, gy } };
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
