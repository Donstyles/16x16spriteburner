// ===================== HUD: health, stamina, flasks, gold, the floor, banners =====================
const F_DISP = '"Grenze Gotisch", "Palatino Linotype", Palatino, "Book Antiqua", serif', F_HUD = 'Teko, "Arial Narrow", "Avenir Next Condensed", sans-serif';
const NUMCOL = { red: '#ff5a46', white: '#ffffff', gold: '#ffd860', heal: '#7cff9c', curse: '#d9a0ff', acid: '#e8f02c', cloth: '#ecdcae' }; // acid: a sour yellow, well clear of the mint of healing
// The new lettering, on trial (TYPE.on; off unless switched on, on the title screen or in the pause menu; kept on this
// device), round three: two faces and no more, and a third for the numbers. Grenze Gotisch keeps every heading (the menus' titles, the kit names, the
// floor cards, the banners); every other word and number (the buttons, the HUD, the floating numbers, the hints, the kit
// cards, what the shopkeeper says) is set in Cinzel, carved Roman capitals, bold enough to read small (the HUD's, outlined,
// in its heaviest weight). The numbers (the floating ones, health, gold, prices) are Cellar Numerals: Grenze Black, the
// plain sister of Grenze Gotisch, its level digits made the default (crawler/assets/fonts), heavy enough to read in a
// glance. The one exception is the game's own name on the title screen, its logo, in Pirata One.
// Off, every call draws exactly as before (Teko for all those words).
const F_LOGO = '"Grenze Gotisch", Palatino, serif'; // the title screen's title (Grenze Gotisch; Pirata One on trial)
const F_BTN = 'Teko, "Avenir Next Condensed", sans-serif'; // the buttons' words (Teko as the HUD)
const F_TALK = 'Teko, "Arial Narrow", sans-serif'; // what the shopkeeper says (Teko as the HUD)
const F_SUB = 'Teko, "Avenir Next Condensed", "Arial Narrow", sans-serif'; // the lines under a floor's card and a banner (Teko)
const F_NUM = 'Teko, "Arial Narrow", "Avenir Next Condensed", "Helvetica Neue", sans-serif'; // numbers: the floating ones, health, gold, prices (Teko as the HUD)
const F_PIRATA = '"Pirata One", "Grenze Gotisch", serif', F_CINZEL = 'Cinzel, "Trajan Pro", "Times New Roman", serif';
const TYPE = { on: false, shadow: false, menu: false, last: null }; // (menu: a menu or the pause screen is being drawn)
try { TYPE.on = localStorage.getItem('cr2-type') === '1'; } catch (e) { /* storage blocked: off */ }
const TYPE_FACES = ['400 30px "Pirata One"', '700 16px Cinzel', '800 16px Cinzel', '900 16px "Cellar Numerals"'];
let numFace = null; // (Cellar Numerals ships inside the page: added to the document's fonts the first time it is wanted)
function loadTypeFaces() { if (!numFace && window.FontFace && document.fonts) { try { numFace = new window.FontFace('Cellar Numerals', `url(${(window.__ASSETS && window.__ASSETS.numerals) || 'assets/fonts/cellar-numerals.ttf'})`, { weight: '900' }); document.fonts.add(numFace); } catch (e) { numFace = false; } }
  if (document.fonts) return Promise.all(TYPE_FACES.map(f => document.fonts.load(f).catch(() => { }))); return Promise.resolve(); }
function setType(on) { TYPE.on = on; try { localStorage.setItem('cr2-type', on ? '1' : '0'); } catch (e) { /* not kept */ } if (on) loadTypeFaces(); }
function font(c, w, size, fam) {
  TYPE.shadow = false; TYPE.last = [w, size, fam];
  if (TYPE.on) {
    if (fam === F_LOGO) { c.font = `400 ${size * 0.86}px ${F_PIRATA}`; return; }
    if (fam === F_NUM) { c.font = `900 ${size * 1.04}px "Cellar Numerals", ${F_CINZEL}`; return; }
    if (fam === F_HUD || fam === F_BTN || fam === F_SUB || fam === F_TALK) { const play = fam === F_HUD && !TYPE.menu; c.font = `${play ? 800 : 700} ${size * 0.8}px ${F_CINZEL}`; TYPE.shadow = !play; return; } }
  c.font = `${w} ${size}px ${fam}`;
}
// the hard shadow of the new lettering: one pixel down and right, in black (none under a glow)
function typeShadow(c, s, x, y) { if (TYPE.shadow && !c.shadowBlur) { const f = c.fillStyle; c.fillStyle = 'rgba(0,0,0,0.92)'; c.fillText(s, x + 1, y + 1); c.fillStyle = f; } }
function label(c, s, x, y, col, o = {}) {
  let keep = null;
  if (o.max && TYPE.on && TYPE.last) { const mw = c.measureText(s).width; if (mw > o.max) { keep = TYPE.last; font(c, keep[0], keep[1] * o.max / mw, keep[2]); } } // (too wide for its card: set smaller)
  c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic'; if (o.stroke) { c.lineWidth = o.stroke; c.strokeStyle = 'rgba(8,6,8,0.9)'; c.lineJoin = 'round'; c.strokeText(s, x, y); } else typeShadow(c, s, x, y); c.fillStyle = col; c.fillText(s, x, y);
  if (keep) font(c, keep[0], keep[1], keep[2]);
}
// a line too wide for w broken in two where the halves come out most even (the kit cards, in the new lettering)
function wrapTo(c, s, w) { if (c.measureText(s).width <= w) return [s]; const ws = s.split(' '); let best = [s], bw = 1e9;
  for (let i = 1; i < ws.length; i++) { const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), m = Math.max(c.measureText(a).width, c.measureText(b).width); if (m < bw) { bw = m; best = [a, b]; } } return best; }
function spaced(c, s, x, y, sp, col, align = 'left') {
  let w = 0; for (const ch of s) w += c.measureText(ch).width + sp; w -= sp;
  // (the new lettering runs wider than Teko: a line too long for the screen is set smaller)
  if (TYPE.on && TYPE.last && w > VIEW.w - 28) { const k = (VIEW.w - 28) / w, [fw, fs, ff] = TYPE.last; font(c, fw, fs * k, ff); sp *= k; w = 0; for (const ch of s) w += c.measureText(ch).width + sp; w -= sp; }
  let px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = col; for (const ch of s) { typeShadow(c, ch, px, y); c.fillText(ch, px, y); px += c.measureText(ch).width + sp; }
}
// a bar that shows recent loss as a pale trail
function bar(c, x, y, w, h, f, trailKey, col, back = 'rgba(0,0,0,0.6)') {
  const T = UI[trailKey] = UI[trailKey] === undefined ? f : (UI[trailKey] > f ? Math.max(f, UI[trailKey] - 0.5 / 60) : f);
  c.fillStyle = back; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(x, y, w * T, h); c.fillStyle = col; c.fillRect(x, y, w * f, h);
}
// The hero's panel (top left): his portrait in a little lamp-lit frame, alive and breathing (his own sprite, moving in
// its idle frames), his name beside it in the display face, and under that his health and stamina as bevelled bars
// with notches (every 25 health), the part just lost lingering pale before it drains, and his flasks as the flask from
// the item sheet, full or empty. Low on health the frame and the bar beat red with his heart; cursed, the stamina bar
// turns violet; out of breath, it flashes.
function drawHeroPanel(c, h, L, T, W) {
  const gw = h.gamb > 0 || (h.gambLost && h.gambLost.length), bw = Math.round(clamp(W * 0.24, 130, 220)), P = 40, x0 = L + P + 7, low = h.hp < h.maxHp * 0.3 && !h.dead, beat = low ? 0.5 + 0.5 * Math.sin(G.time * 7.5) : 0;
  // the portrait
  c.fillStyle = 'rgba(10,8,12,0.78)'; c.fillRect(L, T, P, P);
  const g = c.createRadialGradient(L + P / 2, T + P * 0.62, 2, L + P / 2, T + P * 0.62, P * 0.6); g.addColorStop(0, h.dead ? 'rgba(120,20,20,0.5)' : 'rgba(255,170,80,0.38)'); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(L, T, P, P);
  // his face, close up: a 9 x 9 pixel square round his head (found from his sprite), four times over (its idle frames breathe)
  const ps = h.sprWas || h.spr, m = MOBS[ps], fc = m && faceOf(ps); if (fc) { const fr = 0, sc = 4; c.imageSmoothingEnabled = false; c.globalAlpha = h.dead ? 0.45 : 1; const HB = h.headless && HEADLESS[ps]; /* (ps: his own face, even when the vermin have left only his bones: 48_deaths) */ c.drawImage(HB ? HB.body : IMG.mobs, fr * m[1] + fc.x, (HB ? 0 : m[0]) + fc.y, 9, 9, L + 2, T + 2, 9 * sc, 9 * sc); /* (beheaded: his portrait shows the stump) */ c.globalAlpha = 1; }
  c.strokeStyle = low ? `rgba(255,${Math.round(70 + 80 * (1 - beat))},60,${0.7 + 0.3 * beat})` : '#7a6040'; c.lineWidth = 1; c.strokeRect(L + 0.5, T + 0.5, P - 1, P - 1);
  c.strokeStyle = 'rgba(0,0,0,0.7)'; c.strokeRect(L + 1.5, T + 1.5, P - 3, P - 3);
  c.fillStyle = '#c8a060'; for (const [cx, cy] of [[L, T], [L + P - 2, T], [L, T + P - 2], [L + P - 2, T + P - 2]]) c.fillRect(cx, cy, 2, 2); // the frame's corner studs
  if (h.gamb > 0) { // worn, the gambeson pads his portrait's frame as well, stitched in with the band round his health
    drawQuiltFrame(c, L, T, P, h); }
  // the name
  font(c, 900, 18, F_DISP); label(c, KITS[h.kit].name, x0, T + 13, '#f8ecd6', { stroke: 3 });
  // health (worn in a gambeson, the bar sits in a band of quilted cloth: drawQuilt)
  const hy = gw ? 4 : 0, gq = gw ? 12 : 0;
  hudBar(c, x0, T + 18 + hy, bw, 10, h.hp / h.maxHp, 'hpT', low ? [`rgb(255,${Math.round(110 + 60 * beat)},90)`, '#d0302a', '#6a0e10'] : ['#ff6a50', '#c8302a', '#6e1214'], Math.max(1, Math.floor(h.maxHp / 25)));
  if (gw) drawQuilt(c, x0 - 8, T + 14, bw + 16, 26, h, [x0 + 3, T + 20 + hy, bw - 6, 6]); // (thick, and wrapped over the bar's edges: while it holds, the bar inside it is out of reach)
  if (h.acidT > 0) { const p = 0.55 + 0.45 * Math.sin(G.time * 14); c.strokeStyle = `rgba(214,255,60,${0.5 + 0.5 * p})`; c.lineWidth = 2; c.strokeRect(x0 - 3, T + 15 + hy, bw + 6, 16); c.lineWidth = 1; } // standing in acid: the bar's edge burns sour green
  font(c, 600, 12, F_NUM); label(c, Math.max(0, Math.ceil(h.hp)) + ' / ' + h.maxHp, x0 + bw - 3, T + 26.5 + hy, 'rgba(255,244,228,0.92)', { align: 'right', stroke: 3 });
  // stamina
  const tired = G.tiredT > 0 || h.huff, cursed = h.curseT > 0, flick = tired && ((G.time * 8) | 0) % 2;
  hudBar(c, x0, T + 31 + gq, Math.round(bw * 0.85), 5, h.stam / h.maxStam, 'stT', cursed ? ['#e0b0ff', '#a050e0', '#4a1a70'] : flick ? ['#ffb070', '#e06030', '#6a2010'] : ['#e8f080', '#9ad85a', '#3e6a20'], 0);
  if (tired) { font(c, 600, 12, F_HUD); label(c, h.huff ? 'WINDED' : 'OUT OF STAMINA', x0 + Math.round(bw * 0.85) + 6, T + 37 + gq, '#f0e0c0', { stroke: 3 }); }
  else if (cursed) { font(c, 600, 12, F_HUD); label(c, 'CURSED', x0 + Math.round(bw * 0.85) + 6, T + 37 + gq, '#e0b0ff', { stroke: 3 }); }
  // flasks
  c.imageSmoothingEnabled = false;
  for (let i = 0; i < h.maxFlasks; i++) { const fx = x0 + i * 15, fy = T + 41 + gq, full = i < h.flasks; c.globalAlpha = full ? 1 : 0.22; c.drawImage(IMG.items, 21, 3, 6, 9, fx, fy, 12, 18); } // the flask from the item sheet, at twice its size
  c.globalAlpha = 1;
}
// where a hero's face is on his sprite: the top of the figure, and across, the middle of his body a little below it
// (so a weapon raised beside his head does not pull the square off his face)
const FACES = {};
function faceOf(spr) {
  if (FACES[spr]) return FACES[spr]; const m = MOBS[spr], P = PIX.mobs; if (!m || !P) return null; const [sy, fw, fh] = m, a = (x, y) => P.d[((sy + y) * P.w + x) * 4 + 3] > 0;
  let y0 = 0; while (y0 < fh - 1 && ![...Array(fw).keys()].some(x => a(x, y0))) y0++;
  const xs = []; for (let y = y0 + 4; y <= Math.min(fh - 1, y0 + 10); y++) for (let x = 0; x < fw; x++) if (a(x, y)) xs.push(x);
  const cx = xs.length ? xs.sort((p, q) => p - q)[xs.length >> 1] : fw >> 1;
  return (FACES[spr] = { x: clamp(cx - 4, 0, fw - 9), y: clamp(y0 - 1, 0, fh - 9) });
}
// a bevelled bar: a dark frame, the fill shaded top to bottom with a gloss along its top, the part just lost lingering pale
// before it drains, notches (n of them) across it
function hudBar(c, x, y, w, h, f, trailKey, cols, n) {
  f = clamp(f, 0, 1); const T = UI[trailKey] = UI[trailKey] === undefined ? f : (UI[trailKey] > f ? Math.max(f, UI[trailKey] - 0.45 / 60) : f);
  c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(x - 2, y - 2, w + 4, h + 4); c.fillStyle = '#5a4630'; c.fillRect(x - 1, y - 1, w + 2, 1); c.fillRect(x - 1, y + h, w + 2, 1); c.fillRect(x - 1, y, 1, h); c.fillRect(x + w, y, 1, h);
  c.fillStyle = '#1a1214'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,236,210,0.85)'; c.fillRect(x, y, Math.round(w * T), h);
  const fw = Math.round(w * f); if (fw > 0) { const gr = c.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, cols[0]); gr.addColorStop(0.45, cols[1]); gr.addColorStop(1, cols[2]); c.fillStyle = gr; c.fillRect(x, y, fw, h); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(x, y, fw, Math.max(1, Math.round(h * 0.22))); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(x + fw - 1, y, 1, h); }
  c.fillStyle = 'rgba(0,0,0,0.45)'; for (let i = 1; i < n; i++) c.fillRect(Math.round(x + w * i / n), y, 1, h);
}
// The gambeson on the HUD, in pixel art as the game is: a band of quilted linen wrapped round the health bar (and a
// frame of it round the portrait), drawn in art pixels two screen pixels square in the gambeson sprite's own colours
// (armours [0, 5]): cream linen quilted in diamonds, stitched on both diagonals every six pixels, each diamond padded
// out and lit from the top left (not channels, which read as straw); outlined in the items' dark, faintly warm
// edge, as every pickup is (never black), a dark seam where the bar is tucked in. As much of it is left as he has
// armour left, hacked back from the right to a frayed edge, the white wadding showing and threads hanging loose; each
// piece hacked off falls away and fades. Put on, it is stitched in from the left, a needle's glint at the seam.
const QP = 2, QCOL = { lit: '#2b2522', o: '#2b2522', base: '#e8d4b2', hi: '#fff9e4', line: '#a28a58', low: '#ddbe88', dip: '#cca96d', seam: '#452e25', wad: '#fbf5e6', thread: '#cdb586' };
const QTEX = {};
function quiltTex(w, h, hole, seam = true) { // w, h, hole ([x, y, w, h]) in art pixels; the hole see-through; seam: a dark seam round the hole
  const key = w + 'x' + h + (hole ? ':' + hole.join(',') : '') + (seam ? '' : ':open'); if (QTEX[key]) return QTEX[key];
  const cv = mkCanvas(w, h), g = cv.getContext('2d'), inH = (x, y) => hole && x >= hole[0] && x < hole[0] + hole[2] && y >= hole[1] && y < hole[1] + hole[3];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (inH(x, y)) continue; let col;
    if (x === 0 || y === 0) col = QCOL.lit; else if (x === w - 1 || y === h - 1) col = QCOL.o;
    else if (hole && seam && (inH(x - 1, y) || inH(x + 1, y) || inH(x, y - 1) || inH(x, y + 1) || inH(x - 1, y - 1) || inH(x + 1, y + 1) || inH(x - 1, y + 1) || inH(x + 1, y - 1))) col = QCOL.seam;
    else { // diamonds: stitched on both diagonals every six pixels, each diamond padded out between them and lit from the top
      // left: its upper left face brightest, its upper right a little less, its lower left darker, its lower right darkest
      const a = (x + y) % 6, b = ((x - y) % 6 + 6) % 6, v = (3 - a) + (b - 3) * 0.5;
      col = a === 0 || b === 0 ? QCOL.line : v >= 1.5 ? QCOL.hi : v >= -0.6 ? QCOL.base : v >= -2.1 ? QCOL.low : QCOL.dip;
    }
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
  return (QTEX[key] = cv);
}
// the band (x, y: its top left on screen; w, h, hole in art pixels), rows cut to n art pixels each (the hacked edge)
function quiltRows(c, T, x, y, cut) {
  for (let j = 0; j < T.height; j++) { const n = Math.min(T.width, cut(j)); if (n > 0) c.drawImage(T, 0, j, n, 1, x, y + j * QP, n * QP, QP); }
}
function drawQuilt(c, x, y, w, h, hero, hole) { // (x, y, w, h, hole in screen pixels; snapped to the art pixels)
  x = Math.round(x / QP) * QP; y = Math.round(y / QP) * QP; const W = Math.round(w / QP), H = Math.round(h / QP);
  const T = quiltTex(W, H, hole ? [Math.round((hole[0] - x) / QP), Math.round((hole[1] - y) / QP), Math.round(hole[2] / QP), Math.round(hole[3] / QP)] : null);
  const k = clamp((G.time - (hero.gambT0 || -9)) / 0.7, 0, 1), f = clamp((hero.gamb || 0) / GAMBESON.max, 0, 1), n = Math.round(W * Math.min(k, f)), torn = f < 1 && k >= f;
  c.save(); c.imageSmoothingEnabled = false;
  if (n > 0) {
    const rag = j => torn ? [0, 1, 2, 1, 0, 2, 1, 0, 1, 2, 0, 1, 2][j % 13] : 0; // (the hacked edge: ragged, row by row)
    quiltRows(c, T, x, y, j => n - rag(j));
    if (torn) for (let j = 1; j < H - 1; j++) { // its frayed rim: the white wadding showing at the cut, a dark nick here and there, threads hanging loose
      const e = n - rag(j); if (e <= 0 || e >= W) continue; c.fillStyle = j % 5 === 2 ? QCOL.seam : QCOL.wad; c.fillRect(x + (e - 1) * QP, y + j * QP, QP, QP);
      if (j % 3 === 1) { c.fillStyle = QCOL.thread; c.fillRect(x + e * QP, y + j * QP, QP, QP); if (j % 6 === 1) c.fillRect(x + (e + 1) * QP, y + (j + 1) * QP, QP, QP); }
    }
    if (k < f) { c.fillStyle = '#fffbe8'; c.fillRect(x + n * QP - QP, y + QP, QP, QP); c.fillRect(x + n * QP - QP, y + (H - 2) * QP, QP, QP); }
  }
  hero.gambLost = (hero.gambLost || []).filter(p => G.time - p.t0 < 0.6);
  for (const p of hero.gambLost) { // the pieces hacked off, falling away
    const u = (G.time - p.t0) / 0.6, a = Math.round(W * p.a), b = Math.round(W * p.b); if (b <= a) continue;
    c.globalAlpha = 1 - u; const dy = Math.round((26 * u * u + 2 * u) / QP) * QP;
    for (let j = 0; j < H; j++) c.drawImage(T, a, j, b - a, 1, x + a * QP, y + dy + j * QP, (b - a) * QP, QP); c.globalAlpha = 1;
  }
  c.restore();
}
// the portrait's frame of it (x, y, size: the portrait's box, in screen pixels), stitched in with the band
function drawQuiltFrame(c, x, y, size, hero) { // (it meets the portrait's own edge with no gap: no seam, set to the portrait's pixel)
  const k = clamp((G.time - (hero.gambT0 || -9)) / 0.7, 0, 1), X = Math.round(x) - 8, Y = Math.round(y) - 8, W = Math.round(size / QP) + 8, T = quiltTex(W, W, [4, 4, W - 8, W - 8], false);
  c.save(); c.imageSmoothingEnabled = false; quiltRows(c, T, X, Y, () => Math.round(W * k)); c.restore();
}
function drawHUD() {
  const c = ctx, d = VIEW.dpr, W = VIEW.w, H = VIEW.h, S = VIEW.safe, L = Math.max(12, S.l + 10), R = W - Math.max(12, S.r + 10), T = Math.max(10, S.t + 8);
  c.setTransform(d, 0, 0, d, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; TYPE.menu = false;
  if (G.mode !== 'play') { drawMenu(c); return; }
  // floating numbers
  const zf = clamp(CAM.z / 2.4, 0.8, 1.5);
  for (const n of FX.nums) { if (n.who && n.who.team === 'foe' && !n.who.dead && !foeShown(n.who)) continue; // nothing gives away a foe you cannot see
    const [sx, sy] = toScreen(n.x, n.y - n.z), u = n.t / n.life, pop = n.t < 0.08 ? 1 + (1 - n.t / 0.08) * 0.8 : 1; c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; font(c, 600, (n.sz || (n.big ? 18 : 12)) * zf * pop, F_NUM); label(c, n.txt, sx, sy, NUMCOL[n.col] || '#fff', { align: 'center', stroke: n.big ? 4 : 3 }); }
  c.globalAlpha = 1;
  drawShopHud(c, zf); // (the wares' names and prices, what the shopkeeper says: 39_shop)
  // a hit lands: the edges flush red
  if (G.hurtFlash > 0) { const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.66); g.addColorStop(0, 'rgba(150,0,0,0)'); g.addColorStop(1, `rgba(180,10,10,${G.hurtFlash})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  const h = G.me;
  if (h) drawHeroPanel(c, h, L, T, W);
  // gold, the floor, the map (top right, under the menu button)
  const mb = btnLayout().menu, my = mb.y + mb.r + 10;
  font(c, 600, 15, F_NUM); label(c, G.gold + ' GOLD', mb.x - mb.r - 10, T + 14, '#ffd860', { align: 'right', stroke: 3 });
  font(c, 500, 13, F_HUD); label(c, ARENA.name, mb.x - mb.r - 10, T + 30, 'rgba(240,224,192,0.7)', { align: 'right', stroke: 3 });
  if (!UI.paused) drawMinimap(c, R, my);
  if (MENU.update && !UI.paused) { c.globalAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 260); font(c, 600, 14, F_HUD); label(c, 'UPDATE READY · OPEN THE MENU', mb.x - mb.r - 10, T + 46, '#ffb860', { align: 'right', stroke: 3 }); c.globalAlpha = 1; }
  // banners
  const bn = G.banner; if (bn) {
    const u = bn.t / bn.life, a = u > 0.8 ? (1 - u) / 0.2 : Math.min(1, bn.t * 6), sz = clamp(Math.min(W, H) / 8, 26, 60) * (bn.small ? 0.55 : 1), y = bn.small ? H * 0.2 : H * 0.3, cc = COL[bn.col] || COL.gold;
    c.globalAlpha = a; font(c, 900, sz, F_DISP); c.shadowColor = `rgba(${cc},0.9)`; c.shadowBlur = 20; label(c, bn.a, W / 2, y, '#fff6e0', { align: 'center' }); c.shadowBlur = 0;
    if (bn.b) { font(c, 500, clamp(Math.min(W, H) / 26, 13, 20), F_SUB); spaced(c, bn.b, W / 2, y + sz * 0.5, 3, `rgb(${cc})`, 'center'); }
    c.globalAlpha = 1;
  }
  drawControls(c);
  if (G.fade > 0.001) { c.fillStyle = `rgba(4,3,5,${G.fade})`; c.fillRect(0, 0, W, H); }
  const cd = G.card; if (cd) { const u = cd.t / cd.life, a = u < 0.15 ? u / 0.15 : u > 0.75 ? (1 - u) / 0.25 : 1; c.globalAlpha = a; font(c, 900, clamp(Math.min(W, H) / 5, 34, 84), F_DISP); c.shadowColor = 'rgba(255,140,40,0.8)'; c.shadowBlur = 28; label(c, cd.a, W / 2, H * 0.42, '#f8ecd6', { align: 'center' }); c.shadowBlur = 0; font(c, 500, clamp(Math.min(W, H) / 22, 14, 22), F_SUB); spaced(c, cd.b, W / 2, H * 0.42 + 34, 4, '#c8a870', 'center'); if (cd.c) spaced(c, cd.c, W / 2, H * 0.42 + 58, 3, 'rgba(240,224,192,0.6)', 'center'); if (cd.d) spaced(c, cd.d, W / 2, H * 0.42 + 80, 3, 'rgba(240,224,192,0.45)', 'center'); c.globalAlpha = 1; }
  drawPause(c);
}
