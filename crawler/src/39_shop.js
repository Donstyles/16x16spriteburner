// ===================== the shop: a small room where nobody fights =====================
// From the second floor one of a floor's dead ends may be the shop (30_arena): a small room, lit, with a counter across it
// (the sheet's crates end to end, wall to wall), the shopkeeper behind it (the overworked old villager) and
// his wares laid out on it. Nobody fights in here: stepping in, the hero puts his weapon away (slung on his back) and
// walks slowly, it being a small room full of things, and the view comes in a little closer. Standing at a ware shows
// its name and price; attack buys it: the coins go over the counter, the ware comes over to him. The foes stop at the
// door, and their arrows come no further than it.
// A prototype of how a shop looks and feels: he sells what the cellar already has (flasks, fish, the floor's map) and a
// gambeson and a chainmail; gold is what the cellars give.
const SHOP = { slow: 0.5, zoom: 1.3, keeper: 'OverworkedVillager', idle: 0.3 }; // idle: how fast the old man's idle frames turn over, against everyone else's
const WARES = [
  { k: 'flask', name: 'FLASK', price: f => 12 + 3 * f, stock: 2 },
  { k: 'fish', name: 'FISH', price: f => 6 + 2 * f, stock: 2 },
  { k: 'map', name: 'FLOOR MAP', price: f => 18 + 4 * f, stock: 1 },
  { k: 'gambeson', name: 'GAMBESON', sub: '+40 ARMOUR', price: f => 40 + 8 * f, stock: 1 },
  { k: 'chainmail', name: 'CHAINMAIL', sub: '+60 ARMOUR', price: f => 70 + 12 * f, stock: 1 },
];
const SHOP_HELLO = ['WELCOME, TRAVELLER. NO BLADES IN HERE.', 'AH, A CUSTOMER! MIND THE POTIONS.', 'COME IN, COME IN. LEAVE THE FIGHTING OUTSIDE.'];
const SHOP_THANKS = ['A FINE CHOICE.', 'PLEASURE DOING BUSINESS.', 'MAY IT SERVE YOU WELL.', 'COME BACK ALIVE, NOW.'];

// THE SCENE (30_arena furnish, in place of the usual): the room is nine tiles wide and seven deep, its door in the south,
// east or west wall, so the keeper stands with his back to the north wall, and it is laid out by hand:
//   the north wall: two torches, and between them a banner over the keeper (his sign)
//   row 0, against the wall: his stock (a crate stack, pots, a small chest, a heap of crates two by two, another stack)
//   row 1: the keeper in the middle, a brazier burning at either end of the room
//   row 2: the counter, the sheet's long crate end to end and wall to wall, his five wares laid out on it
//   rows 3-6: the customers' side, a pot and a crate in its corners
// tiles are relative to the room's top left corner (ix0, iy0)
const SHOP_STOCK = [['crate', [27, 12], 0, 0, 1, 2], ['barrel', [24, 8], 1, 0], ['barrel', [26, 8], 2, 0], ['chest', [28, 8], 3, 0], ['crate', [24, 14], 5.5, 0, 2, 2], ['barrel', [25, 8], 7, 0], ['crate', [28, 12], 8, 0, 1, 2]];
function shopFit(A, r, g) {
  const X = r.ix0, Y = r.iy0, cx = X + 4, C = A.th.sheet === 'crypt'; // (C: in the crypt his stock is urns, no crates, and over him a niche of skulls, no banner)
  const put = (kind, tile, x, y, o = {}) => A.props.push(Object.assign({ kind, tile, x: x * TS + 8, y: y * TS + 14, cy: y * TS + 10, r: 5, solid: true, hp: 1e9, room: r.i }, o));
  // the north wall: torches either side, a banner (one of the gold ones) between them
  for (const tx of [X + 2, X + 6]) A.torches.push({ x: tx * TS + 8, y: (r.fy0 + 1) * TS + 9, tx, f: randi(0, 3) });
  if (C) cryptNiche(A, r, g, cx, r.fy0 + 1, 'skulls', 0); else { const b = pick([24, 25, 26, 27]); tileAt(g, b, 0, cx * TS, r.fy0 * TS); tileAt(g, b, 1, cx * TS, (r.fy0 + 1) * TS); }
  // his stock along the wall, the braziers, the counter
  for (const [kind, tile, dx, dy, tw = 1, th = 1] of SHOP_STOCK) { if (C && kind === 'crate') { for (let i = 0; i < tw; i++) { const x = X + Math.floor(dx) + i; put('barrel', URNS[x % 4], x, Y + dy, { th: 1, hp: 1e9 }); } continue; } put(kind, tile, X + dx, Y + dy, { tw, th, r: tw > 1 ? 9 : 5 }); }
  for (const dx of [0, 8]) put('brazier', null, X + dx, Y + 1, { f: randi(0, 3) }); // (at the room's two ends, clear of the wares)
  for (let i = 0; i < 4; i++) put('counter', [29, 10], X + i * 2 + 0.5, Y + 2, { tw: 2, r: 9 });
  put('counter', [31, 10], X + 8, Y + 2);
  // the customers' corners
  put('barrel', [27, 8], X, Y + 6); if (C) put('barrel', [27, 8], X + 8, Y + 6); else put('crate', [25, 12], X + 8, Y + 6);
  // the keeper, behind the counter (his legs hidden by it), and his wares on it (two to his left, three to his right)
  const kp = { id: -1, team: 'npc', spr: SHOP.keeper, animK: SHOP.idle, x: cx * TS + 8, y: (Y + 2) * TS + 3, z: 0, vx: 0, vy: 0, kx: 0, ky: 0, r: 5, scale: 1, face: 1, anim: rand(0, 4), act: null, state: 'idle', moving: false, dead: false, hp: 1, maxHp: 1 };
  const wares = WARES.map((w, i) => Object.assign({}, w, { x: [X + 2, X + 3, X + 5, X + 6, X + 7][i] * TS + 8, y: (Y + 2) * TS + 14, stock: w.stock }));
  A.shop = { room: r, keeper: kp, wares, sel: null, say: null };
}
function inShop(A, x, y) { const S = A && A.shop; if (!S) return false; const r = S.room; return x >= r.ix0 * TS && x < (r.ix1 + 1) * TS && y >= r.iy0 * TS - 2 && y < (r.iy1 + 1) * TS + 4; }
function shopSay(S, txt) { S.say = { txt, t: 0 }; }
// each frame (36_works worksTick): who is in it, the hero's weapon going onto his back or back into his hand, the ware he stands at
function shopTick(A, dt) {
  const S = A.shop; if (!S) { for (const h of G.heroes) { h.inShop = false; h.sheathK = Math.max(0, (h.sheathK || 0) - dt / 0.2); } return; } const kp = S.keeper; kp.anim += dt; if (S.say) { S.say.t += dt; if (S.say.t > 3.2) S.say = null; }
  for (const h of G.heroes) {
    const was = !!h.inShop; h.inShop = !h.dead && !h.fall && inShop(A, h.x, h.y);
    h.sheathK = h.inShop ? Math.min(1, (h.sheathK || 0) + dt / 0.28) : Math.max(0, (h.sheathK || 0) - dt / 0.2);
    if (h.inShop !== was) { SFX.whoosh(panOf(h.x)); if (h === G.me) SFX.calm(h.inShop); if (h.inShop) { SFX.chime(panOf(kp.x)); if (!S.hello) { S.hello = true; shopSay(S, pick(SHOP_HELLO)); } } }
  }
  const h = G.me; S.sel = null; if (!h || !h.inShop) return;
  // the quiet in here, which he hears now he is at rest: the torches and braziers crackling (the nearer, the louder), a
  // flame's soft breath now and then, and his own slow steps on the stone
  const r = S.room; S.crT = (S.crT || 0) - dt;
  if (S.crT <= 0) {
    S.crT = rand(0.05, 0.22); const L = A.torches.filter(t => t.tx >= r.ix0 && t.tx <= r.ix1 && Math.abs(t.y - ((r.fy0 + 1) * TS + 9)) < 2).concat(A.props.filter(p => p.kind === 'brazier' && p.room === r.i)), o = pick(L);
    if (o) { const v = clamp(1.4 - dist(h.x, h.y, o.x, o.y) / 110, 0.35, 1.2); SFX.crackle(panOf(o.x), v); if (chance(0.07)) SFX.flame(panOf(o.x), v); }
  }
  if (h.moving && !h.act) { S.stT = (S.stT || 0) - dt; if (S.stT <= 0) { S.stT = 0.48; S.stN = (S.stN || 0) + 1; SFX.step(panOf(h.x), S.stN); } } else S.stT = 0.15;
  kp.face = h.x < kp.x ? -1 : 1;
  // the ware he stands at: the nearest on his side of the counter, within an arm and a bit
  let best = null, bd = 22; for (const w of S.wares) { if (w.stock <= 0 || (w.k === 'map' && A.mapRead)) continue; const d = dist(h.x, h.y, w.x, w.y + 10); if (d < bd) { bd = d; best = w; } } // (standing before it, at the counter)
  S.sel = best;
}
// attack, in the shop: buy what he stands at
function shopBuy(h) {
  const A = ARENA, S = A.shop, w = S && S.sel; if (!w) return; const price = w.price(A.floor), kp = S.keeper;
  if (w.k === 'flask' && h.flasks >= h.maxFlasks) { shopSay(S, 'YOUR FLASKS ARE ALL FULL.'); return; }
  if (w.k === 'fish' && h.hp >= h.maxHp) { shopSay(S, 'YOU LOOK HALE ENOUGH TO ME.'); return; }
  if ((w.k === 'gambeson' && h.gamb >= GAMBESON.max) || (w.k === 'chainmail' && h.mail >= MAIL.max)) { shopSay(S, 'YOURS IS STILL WHOLE, FRIEND.'); return; }
  if (G.gold < price) { w.noT = G.time; shopSay(S, 'NOT ENOUGH COIN, FRIEND.'); SFX.tick(panOf(w.x)); return; }
  G.gold -= price; w.stock--; number(h.x, h.y, headZ(h) + 1, '-' + price, 'gold', false);
  // the coins go over the counter to him, a clink apiece
  const n = Math.min(10, Math.ceil(price / 4)); for (let i = 0; i < n; i++) { const t = i * 0.05; after(t, () => SFX.coin(panOf(kp.x))); part({ k: 'glow', x: h.x + rand(-3, 3), y: h.y - 2, z: 8, vx: (kp.x - h.x) * 1.6 + rand(-8, 8), vy: (kp.y - h.y) * 1.6 + rand(-6, 6), vz: rand(50, 80), drag: 0.6, life: 0.6, s0: 1.6, s1: 0.6, col: 'gold' }); }
  G.drops.push({ k: w.k, x: w.x, y: w.y - 2, z: 14, vx: 0, vy: 0, vz: 70, t: 0, hold: 0.25, seek: h }); // (it comes over the counter to him: 53_foes updateDrops)
  shopSay(S, pick(SHOP_THANKS));
}
// his weapon slung on his back while he is in the shop (52_hero weaponPose): from his hand to over his shoulder, blade down behind him
// a sword hangs blade down, its hilt over the shoulder; a spear or an axe rides head up behind the shoulder; a dagger at the belt
const SLUNG = { sword: { th: 0.55, at: [-2, -12], down: true }, spear: { th: 0.35, at: [-3, -7] }, axe: { th: 0.6, at: [-3, -6] }, daggers: { th: 0.9, at: [-3, -5], down: true } };
function slungPose(h, Wc) {
  const fs = h.face < 0 ? -1 : 1, k = easeIO(clamp(h.sheathK, 0, 1)), S = SLUNG[h.weapon] || SLUNG.sword, th = S.down ? Math.PI / 2 + fs * S.th : -Math.PI / 2 - fs * S.th;
  return { th: angLerp(Wc.rest, th, k), push: 0, at: [h.x + fs * S.at[0], h.y + S.at[1]], blend: k, behind: k > 0.45 };
}
// the wares on the counter (in the world, sorted with everything else: 70_render)
function drawWare(c, w) {
  const A = ARENA, S = A.shop; if (w.stock <= 0 || (w.k === 'map' && A.mapRead)) return;
  const it = ITEM[w.icon || w.k], sel = S.sel === w, up = sel ? 1 + Math.round(Math.sin(G.time * 6)) : 0, x = Math.round(w.x - 8), y = Math.round(w.y - 21 - up); // (standing on the counter's top)
  c.drawImage(IMG[it[4] || 'items'], it[0], it[1], 16, 16, x, y, 16, 16);
}
function drawWareGlow(c) { // (on the glow layer: the ware he stands at glows)
  const S = ARENA && ARENA.shop; if (!S) return;
  for (const w of S.wares) { if (w.stock <= 0) continue; const sel = S.sel === w; if (!sel) continue; c.globalAlpha = sel ? 0.45 + 0.15 * Math.sin(G.time * 6) : 0.25; c.drawImage(GLOW.gold, w.x - 10, w.y - 30, 20, 18); }
  c.globalAlpha = 1;
}
// on the HUD: the name and price over the ware he stands at, a price over the others, and what the keeper says
function drawShopHud(c, zf) {
  const A = ARENA, S = A && A.shop; if (!S || !G.me || !G.me.inShop) return; let selTop = Infinity;
  for (const w of S.wares) {
    if (w.stock <= 0 || (w.k === 'map' && A.mapRead)) continue; const sel = S.sel === w, p = w.price(A.floor), [sx, sy] = toScreen(w.x, w.y - 26), [tx, ty] = toScreen(w.x, w.y - 3);
    const poor = G.gold < p, red = w.noT && G.time - w.noT < 0.6 && ((G.time * 10) | 0) % 2;
    if (!sel) { font(c, 600, 9 * zf, F_NUM); label(c, p + 'G', tx, ty, poor ? '#a08a70' : '#ffd860', { align: 'center', stroke: 3 }); continue; } // (its tag, hung on the counter's front)
    selTop = sy - (w.sub ? 40 : 29) * zf; font(c, 600, 13 * zf, F_HUD); label(c, w.name, sx, sy - 14 * zf, '#ffffff', { align: 'center', stroke: 3 });
    if (w.sub) { font(c, 600, 9 * zf, F_HUD); label(c, w.sub, sx, sy - 27 * zf, '#7cff9c', { align: 'center', stroke: 3 }); }
    font(c, 600, 12 * zf, F_NUM); label(c, p + ' GOLD', sx, sy, red ? '#ff5a46' : poor ? '#c08a6a' : '#ffd860', { align: 'center', stroke: 3 });
    if (!INPUT.touch) { const [hx, hy] = toScreen(G.me.x, G.me.y + 10); font(c, 600, 9 * zf, F_HUD); label(c, 'ATTACK: BUY', hx, hy, '#d8d0c0', { align: 'center', stroke: 3 }); } // (on a phone the attack button itself says BUY: shopWare, 61_input)
  }
  // what the keeper says: in the words' own face and outline, but pale blue (no number is) and typed out a letter at a
  // time, steady over his head, so it reads as speech and not as one of the numbers that pop and fly; above the name of
  // the ware the hero stands at, never across it
  if (S.say) { const kp = S.keeper, [kx, ky] = toScreen(kp.x, kp.y - headZ(kp) - 6), u = S.say.t, txt = S.say.txt, n = Math.min(txt.length, Math.floor(u * 38) + 1);
    c.globalAlpha = u > 2.8 ? Math.max(0, (3.2 - u) / 0.4) : 1; font(c, 600, 12 * zf, F_TALK);
    const m = c.measureText(txt), desc = m.actualBoundingBoxDescent || 0, hw = m.width / 2, sy = Math.min(ky, selTop - desc), sx = clamp(kx, hw + 8, VIEW.w - hw - 8);
    label(c, txt.slice(0, n), sx - hw, sy, '#a8dcff', { stroke: 3 }); c.globalAlpha = 1; } // (set from the left edge of the whole line, so it does not shift as it grows)
}
// the shop test (kit screen): a run whose floor has a shop, the hero at its door with some gold to spend
function beginShopTest(kit) {
  beginRun(kit); G.floor = 2; FORCE_SHOP.on = true; for (let n = 0; n < 60; n++) { startFloor(); if (ARENA.shop) break; } FORCE_SHOP.on = false;
  G.gold = 150; G.card = { t: 0, life: 2.6, a: 'THE SHOP', b: 'NO FIGHTING INSIDE', c: '150 GOLD TO SPEND' };
  const S = ARENA.shop; if (!S) return; const r = S.room, d = r.doors[0], [dx, dy] = d.cells[1], o = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[d.side], h = G.me;
  h.enter = null; h.x = (dx + o[0] * 2) * TS + 8; h.y = (dy + o[1] * 2) * TS + 10; h.safe = { x: h.x, y: h.y };
  for (const f of G.foes) if (dist(f.x, f.y, h.x, h.y) < 160) f.dead = true; // (nobody waiting at the door)
  CAM.x = h.x; CAM.y = h.y;
}
// the ware a blow would buy now: the one picked out on the counter, in stock (the attack button reads BUY: 61_input)
function shopWare() { const A = ARENA, S = A && A.shop, w = S && G.me && G.me.inShop ? S.sel : null; return w && w.stock > 0 && !(w.k === 'map' && A.mapRead) ? w : null; }
