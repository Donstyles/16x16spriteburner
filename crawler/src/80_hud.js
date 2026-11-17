// ===================== HUD: health, stamina, flasks, gold, the floor, banners =====================
const F_DISP = '"Grenze Gotisch", "Palatino Linotype", Palatino, "Book Antiqua", serif', F_HUD = 'Teko, "Arial Narrow", "Avenir Next Condensed", sans-serif';
const NUMCOL = { red: '#ff5a46', white: '#ffffff', gold: '#ffd860', heal: '#7cff9c', curse: '#d9a0ff', acid: '#e8f02c' }; // acid: a sour yellow, well clear of the mint of healing
// The new lettering, on trial (TYPE.on; off unless switched on, on the title screen or in the pause menu; kept on this
// device), round three: two faces and no more. Grenze Gotisch keeps every heading (the menus' titles, the kit names, the
// floor cards, the banners); every other word and number (the buttons, the HUD, the floating numbers, the hints, the kit
// cards, what the shopkeeper says) is set in Cinzel, carved Roman capitals, bold enough to read small (the HUD's, outlined,
// in its heaviest weight). The one exception is the game's own name on the title screen, its logo, in Pirata One.
// Off, every call draws exactly as before (Teko for all those words).
const F_LOGO = '"Grenze Gotisch", Palatino, serif'; // the title screen's title (Grenze Gotisch; Pirata One on trial)
const F_BTN = 'Teko, "Avenir Next Condensed", sans-serif'; // the buttons' words (Teko as the HUD)
const F_TALK = 'Teko, "Arial Narrow", sans-serif'; // what the shopkeeper says (Teko as the HUD)
const F_SUB = 'Teko, "Avenir Next Condensed", "Arial Narrow", sans-serif'; // the lines under a floor's card and a banner (Teko)
const F_PIRATA = '"Pirata One", "Grenze Gotisch", serif', F_CINZEL = 'Cinzel, "Trajan Pro", "Times New Roman", serif';
const TYPE = { on: false, shadow: false, menu: false, last: null }; // (menu: a menu or the pause screen is being drawn)
try { TYPE.on = localStorage.getItem('cr2-type') === '1'; } catch (e) { /* storage blocked: off */ }
const TYPE_FACES = ['400 30px "Pirata One"', '700 16px Cinzel', '800 16px Cinzel'];
function loadTypeFaces() { if (document.fonts) return Promise.all(TYPE_FACES.map(f => document.fonts.load(f).catch(() => { }))); return Promise.resolve(); }
function setType(on) { TYPE.on = on; try { localStorage.setItem('cr2-type', on ? '1' : '0'); } catch (e) { /* not kept */ } if (on) loadTypeFaces(); }
function font(c, w, size, fam) {
  TYPE.shadow = false; TYPE.last = [w, size, fam];
  if (TYPE.on) {
    if (fam === F_LOGO) { c.font = `400 ${size * 0.86}px ${F_PIRATA}`; return; }
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
  const bw = Math.round(clamp(W * 0.24, 130, 220)), P = 40, x0 = L + P + 7, low = h.hp < h.maxHp * 0.3 && !h.dead, beat = low ? 0.5 + 0.5 * Math.sin(G.time * 7.5) : 0;
  // the portrait
  c.fillStyle = 'rgba(10,8,12,0.78)'; c.fillRect(L, T, P, P);
  const g = c.createRadialGradient(L + P / 2, T + P * 0.62, 2, L + P / 2, T + P * 0.62, P * 0.6); g.addColorStop(0, h.dead ? 'rgba(120,20,20,0.5)' : 'rgba(255,170,80,0.38)'); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(L, T, P, P);
  // his face, close up: a 9 x 9 pixel square round his head (found from his sprite), four times over (its idle frames breathe)
  const m = MOBS[h.spr], fc = m && faceOf(h.spr); if (fc) { const fr = 0, sc = 4; c.imageSmoothingEnabled = false; c.globalAlpha = h.dead ? 0.45 : 1; c.drawImage(IMG.mobs, fr * m[1] + fc.x, m[0] + fc.y, 9, 9, L + 2, T + 2, 9 * sc, 9 * sc); c.globalAlpha = 1; }
  c.strokeStyle = low ? `rgba(255,${Math.round(70 + 80 * (1 - beat))},60,${0.7 + 0.3 * beat})` : '#7a6040'; c.lineWidth = 1; c.strokeRect(L + 0.5, T + 0.5, P - 1, P - 1);
  c.strokeStyle = 'rgba(0,0,0,0.7)'; c.strokeRect(L + 1.5, T + 1.5, P - 3, P - 3);
  c.fillStyle = '#c8a060'; for (const [cx, cy] of [[L, T], [L + P - 2, T], [L, T + P - 2], [L + P - 2, T + P - 2]]) c.fillRect(cx, cy, 2, 2); // the frame's corner studs
  // the name
  font(c, 900, 18, F_DISP); label(c, KITS[h.kit].name, x0, T + 13, '#f8ecd6', { stroke: 3 });
  // health
  hudBar(c, x0, T + 18, bw, 10, h.hp / h.maxHp, 'hpT', low ? [`rgb(255,${Math.round(110 + 60 * beat)},90)`, '#d0302a', '#6a0e10'] : ['#ff6a50', '#c8302a', '#6e1214'], Math.max(1, Math.floor(h.maxHp / 25)));
  if (h.acidT > 0) { const p = 0.55 + 0.45 * Math.sin(G.time * 14); c.strokeStyle = `rgba(214,255,60,${0.5 + 0.5 * p})`; c.lineWidth = 2; c.strokeRect(x0 - 3, T + 15, bw + 6, 16); c.lineWidth = 1; } // standing in acid: the bar's edge burns sour green
  font(c, 600, 12, F_HUD); label(c, Math.max(0, Math.ceil(h.hp)) + ' / ' + h.maxHp, x0 + bw - 3, T + 26.5, 'rgba(255,244,228,0.92)', { align: 'right', stroke: 3 });
  // stamina
  const tired = G.tiredT > 0 || h.huff, cursed = h.curseT > 0, flick = tired && ((G.time * 8) | 0) % 2;
  hudBar(c, x0, T + 31, Math.round(bw * 0.85), 5, h.stam / h.maxStam, 'stT', cursed ? ['#e0b0ff', '#a050e0', '#4a1a70'] : flick ? ['#ffb070', '#e06030', '#6a2010'] : ['#e8f080', '#9ad85a', '#3e6a20'], 0);
  if (tired) { font(c, 600, 12, F_HUD); label(c, h.huff ? 'WINDED' : 'OUT OF STAMINA', x0 + Math.round(bw * 0.85) + 6, T + 37, '#f0e0c0', { stroke: 3 }); }
  else if (cursed) { font(c, 600, 12, F_HUD); label(c, 'CURSED', x0 + Math.round(bw * 0.85) + 6, T + 37, '#e0b0ff', { stroke: 3 }); }
  // flasks
  c.imageSmoothingEnabled = false;
  for (let i = 0; i < h.maxFlasks; i++) { const fx = x0 + i * 15, fy = T + 41, full = i < h.flasks; c.globalAlpha = full ? 1 : 0.22; c.drawImage(IMG.items, 21, 3, 6, 9, fx, fy, 12, 18); } // the flask from the item sheet, at twice its size
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
function drawHUD() {
  const c = ctx, d = VIEW.dpr, W = VIEW.w, H = VIEW.h, S = VIEW.safe, L = Math.max(12, S.l + 10), R = W - Math.max(12, S.r + 10), T = Math.max(10, S.t + 8);
  c.setTransform(d, 0, 0, d, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; TYPE.menu = false;
  if (G.mode !== 'play') { drawMenu(c); return; }
  // floating numbers
  const zf = clamp(CAM.z / 2.4, 0.8, 1.5);
  for (const n of FX.nums) { if (n.who && n.who.team === 'foe' && !n.who.dead && !foeShown(n.who)) continue; // nothing gives away a foe you cannot see
    const [sx, sy] = toScreen(n.x, n.y - n.z), u = n.t / n.life, pop = n.t < 0.08 ? 1 + (1 - n.t / 0.08) * 0.8 : 1; c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; font(c, 600, (n.sz || (n.big ? 18 : 12)) * zf * pop, F_HUD); label(c, n.txt, sx, sy, NUMCOL[n.col] || '#fff', { align: 'center', stroke: n.big ? 4 : 3 }); }
  c.globalAlpha = 1;
  drawShopHud(c, zf); // (the wares' names and prices, what the shopkeeper says: 39_shop)
  // a hit lands: the edges flush red
  if (G.hurtFlash > 0) { const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.66); g.addColorStop(0, 'rgba(150,0,0,0)'); g.addColorStop(1, `rgba(180,10,10,${G.hurtFlash})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  const h = G.me;
  if (h) drawHeroPanel(c, h, L, T, W);
  // gold, the floor, the map (top right, under the menu button)
  const mb = btnLayout().menu, my = mb.y + mb.r + 10;
  font(c, 600, 15, F_HUD); label(c, G.gold + ' GOLD', mb.x - mb.r - 10, T + 14, '#ffd860', { align: 'right', stroke: 3 });
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
