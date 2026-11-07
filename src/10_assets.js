// ===================== assets: images, silhouettes, pixel maps, glow textures =====================
const IMG = {}; let MOBS = {};
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image ' + String(src).slice(0, 40))); i.src = src; }); }
async function loadAssets() {
  const A = window.__ASSETS;
  for (const k of ['cellar', 'mobs']) IMG[k] = await loadImage(A ? A[k] : 'assets/' + k + '.png');
  MOBS = A ? A.mobsJson : await (await fetch('assets/mobs.json')).json();
  IMG.mobsW = silhouette(IMG.mobs); PIX.mobs = pixelData(IMG.mobs);
  for (const k in COL) { GLOW[k] = glowTex(COL[k]); }
  SMOKE.grey = smokeTex([70, 66, 72]); SMOKE.dust = smokeTex([122, 100, 78]); SMOKE.dark = smokeTex([22, 18, 24]); SMOKE.green = smokeTex([60, 120, 60]);
  ROCKS.length = 0; for (let i = 0; i < 6; i++) ROCKS.push(rockTex(i));
}
function silhouette(img) { const c = mkCanvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return c; }
const PIX = {}, PIXCACHE = {};
function pixelData(img) { const c = mkCanvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); return { w: img.width, d: x.getImageData(0, 0, img.width, img.height).data }; }
// opaque pixels of one sprite frame, relative to its feet (bottom-centre); cached
function spritePixels(key) {
  if (PIXCACHE[key]) return PIXCACHE[key];
  const m = MOBS[key], P = PIX.mobs, sx = 0, sy = m[0], fw = m[1], fh = m[2];
  const out = []; let foot = 0;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = ((sy + y) * P.w + sx + x) * 4; if (P.d[i + 3] > 128) foot = Math.max(foot, y); }
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = ((sy + y) * P.w + sx + x) * 4; if (P.d[i + 3] <= 128) continue;
    out.push({ x: x - fw / 2 + 0.5, y: y - foot - 0.5, c: `rgb(${P.d[i]},${P.d[i + 1]},${P.d[i + 2]})` });
  }
  out.foot = foot; return (PIXCACHE[key] = out);
}
function footOf(key) { return spritePixels(key).foot; }
// soft additive glow sprite for a colour
const GLOW = {};
function glowTex(c) {
  const s = 64, cv = mkCanvas(s, s), x = cv.getContext('2d'), g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, `rgba(${Math.min(255, c[0] + 90)},${Math.min(255, c[1] + 90)},${Math.min(255, c[2] + 90)},1)`);
  g.addColorStop(0.18, `rgba(${c[0]},${c[1]},${c[2]},0.85)`); g.addColorStop(0.5, `rgba(${c[0]},${c[1]},${c[2]},0.28)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
  x.fillStyle = g; x.fillRect(0, 0, s, s); return cv;
}
const SMOKE = {};
function smokeTex(c) {
  const s = 64, cv = mkCanvas(s, s), x = cv.getContext('2d');
  for (let i = 0; i < 7; i++) { const px = s / 2 + rand(-9, 9), py = s / 2 + rand(-9, 9), r = rand(12, 22), g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.5)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s); }
  return cv;
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
