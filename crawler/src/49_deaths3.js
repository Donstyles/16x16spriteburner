// ===================== the hero's deaths, the third lot: goblins, the wolf, the ticks =====================
// Looted by goblins, ragdolled by a goblin wolf rider, fed on by ticks. (48_deaths: how a death is chosen, its length,
// name and camera; 49_deaths2: the scripted creatures, f.script, and the lamp left where he fell.)

// ---- looted. Dying with goblins about (two or more), he goes down and they crowd round him, rummaging; his things are
// flung out of him one after another, only what he has on him (his weapon, the armour still on him, the floor's map if
// he found it, each of his flasks, his gold in a burst of coins), and each goblin grabs one, in that order, and makes off
// with it into the dark, slung on its back; the goblins left with nothing go off empty-handed. What no goblin takes stays
// on the floor.
const LOOT = { lie: 0.5, strip: 1.6, gap: 0.5 }, GOBLIN_RE = /^Goblin(?!WolfRider)/;
function goblinsAround(h) { return G.foes.filter(f => !f.dead && !f.dying && !f.fall && !f.feed && !f.script && GOBLIN_RE.test(f.spr) && dist(f.x, f.y, h.x, h.y) < 150).sort((a, b) => dist(a.x, a.y, h.x, h.y) - dist(b.x, b.y, h.x, h.y)).slice(0, 6); }
function lootOf(h) { // (what he has on him, in the order they go)
  const L = []; if (WEAPON[h.spr] && !h.dropped) L.push('weapon'); if (h.mail > 0) L.push('chainmail'); if (h.gamb > 0) L.push('gambeson');
  if (ARENA && ARENA.mapRead) L.push('map'); for (let i = 0; i < (h.flasks || 0); i++) L.push('flask'); if (G.gold > 0) L.push('gold'); return L;
}
function lootedPose(t, D) { return { lie: t > LOOT.lie, dip: t > 0.1 && t <= LOOT.lie ? 2 : 0, jit: D && D.jolt > 0 ? (((G.time * 40) | 0) % 2 ? 1 : -1) : 0 }; }
function lootedStart(h) {
  const D = h.death; D.L = lootOf(h); D.items = []; D.next = 0; h.lampAt = { x: h.x, y: h.y };
  D.V = goblinsAround(h); D.V.forEach((f, i) => { const a = i / D.V.length * TAU + rand(-0.3, 0.3); f.script = { h, tick: lootFoe, ox: Math.round(Math.cos(a) * 9), oy: Math.round(Math.sin(a) * 4) + 1, item: null }; f.act = null; });
}
function lootFling(h, k) { // one of his things, flung out of him
  const D = h.death, a = rand(TAU), v = rand(40, 70), pan = panOf(h.x);
  if (k === 'weapon') { dropWeapon(h, 1); D.items.push({ k, rock: FX.rocks[FX.rocks.length - 1] }); SFX.clang(pan); return; }
  if (k === 'gold') { const n = clamp(Math.ceil(G.gold / 6), 3, 8), drops = []; for (let i = 0; i < n; i++) { const b = rand(TAU), w = rand(30, 70), d = { k: 'gold', v: 0, x: h.x, y: h.y, z: 6, vx: Math.cos(b) * w, vy: Math.sin(b) * w * 0.7, vz: rand(70, 120), t: 0, wait: 0, hold: 99, loot: true }; G.drops.push(d); drops.push(d); } D.items.push({ k, drops }); SFX.coin(pan); return; }
  const d = { k, x: h.x, y: h.y, z: 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: rand(80, 120), t: 0, wait: 0, hold: 99, loot: true }; G.drops.push(d); D.items.push({ k, drop: d }); SFX.toss(pan);
}
function lootedTick(h, dt) {
  const D = h.death, t = h.deadT, pan = panOf(h.x); D.jolt = Math.max(0, (D.jolt || 0) - dt);
  const near = D.V.filter(f => f.script && !f.script.item && f.script.at).length;
  if (t > LOOT.strip && D.next < D.L.length && t > LOOT.strip + D.next * LOOT.gap) { lootFling(h, D.L[D.next]); D.next++; D.jolt = 0.15; }
  for (const it of D.items) if (!it.by) { const f = D.V.find(q => !q.dead && q.script && !q.script.item && q.script.at); if (f) { it.by = f; f.script.item = it; } } // (the next goblin free takes the next thing)
  if (D.next >= D.L.length && t > LOOT.strip + D.L.length * LOOT.gap + 0.9) for (const f of D.V) { const S = f.script; if (f.dead || !S || S.item) continue; S.item = { k: 'none' }; S.got = true; lootAway(f, h, angTo(h.lampAt.x, h.lampAt.y, f.x, f.y)); } // (nothing left on him: the rest go off empty-handed)
  if (near && t < LOOT.strip + D.L.length * LOOT.gap + 1) { if (chance(dt * 8)) SFX.tick(pan); if (chance(dt * 3)) SFX.squelch(pan, false); } // rummaging
}
function lootFoe(f, dt) {
  const S = f.script, h = S.h, D = h.death; if (!h.dead || !D || D.kind !== 'looted') { f.script = null; f.carry = null; return; }
  const it = S.item;
  if (!it) { // round him, rummaging
    const tx = h.x + S.ox, ty = h.y + S.oy; if (!S.at) { const d = steer(f, tx, ty, f.def.spd * 1.5, dt, 1.5); f.moving = true; f.face = tx < f.x ? -1 : 1; if (d <= 2.5 && h.deadT > LOOT.lie) S.at = true; return; }
    f.x = tx + randi(-1, 1) * (chance(dt * 8) ? 1 : 0); f.y = ty; f.vx = f.vy = 0; f.moving = chance(0.5); f.face = h.x < f.x ? -1 : 1; return;
  }
  if (!S.got) { // after it, and away with it
    let tx, ty; const pan = panOf(f.x);
    if (it.k === 'weapon') { const r = it.rock; if (!r || r.done || r.fade) { S.got = true; } else { tx = r.x; ty = r.y; if (dist(f.x, f.y, tx, ty) < 4) { f.carry = { img: r.rot[0] }; r.done = true; S.got = true; SFX.clang(pan); } } }
    else if (it.k === 'gold') { const c = it.drops.filter(d => !d.dead).sort((a, b) => dist(a.x, a.y, f.x, f.y) - dist(b.x, b.y, f.x, f.y))[0]; if (!c) { S.got = true; f.carry = { gold: true }; } else { tx = c.x; ty = c.y; if (dist(f.x, f.y, tx, ty) < 4) { c.dead = true; SFX.coin(pan); } } }
    else { const d = it.drop; if (d.dead) S.got = true; else { tx = d.x; ty = d.y; if (dist(f.x, f.y, tx, ty) < 4) { f.carry = { k: it.k }; d.dead = true; S.got = true; SFX.toss(pan); } } }
    if (!S.got) { steer(f, tx, ty, f.def.spd * 1.6, dt, 1); f.moving = true; f.face = tx < f.x ? -1 : 1; return; }
    lootAway(f, h, angTo(h.lampAt.x, h.lampAt.y, f.x, f.y));
  }
  if (darkFade(f) <= 0) { f.dead = true; return; } // (gone, into the dark, with it)
  const x0 = f.x, y0 = f.y; steer(f, S.away.x, S.away.y, f.def.spd * 1.8, dt, 2); f.moving = true; f.face = S.away.x < f.x ? -1 : 1;
  S.stuck = Math.hypot(f.x - x0, f.y - y0) < f.def.spd * dt * 0.3 ? (S.stuck || 0) + dt : 0;
  if (S.stuck > 0.35 || dist(f.x, f.y, S.away.x, S.away.y) < 4) { S.stuck = 0; if (++S.turns > 3) { if (f.vanishT === undefined) f.vanishT = G.time; } else lootAway(f, h, angTo(h.lampAt.x, h.lampAt.y, f.x, f.y) + rand(-1.2, 1.2)); } // (a wall in the way: round it; nowhere to go: the shadows take it)
}
function lootAway(f, h, a) { const S = f.script, b = darkest(f, [-0.9, -0.45, 0, 0.45, 0.9].map(k => a + k)); S.turns = S.turns || 0; S.away = { x: f.x + Math.cos(b) * 200, y: f.y + Math.sin(b) * 160 }; }
// (70_render drawUnit, before the body) what a goblin makes off with, slung on its back: behind it, sticking up past
// its shoulder, bobbing as it runs
function drawCarry(c, u) {
  const C = u.carry, fs = u.face < 0 ? -1 : 1, bob = u.moving && ((G.time * 9) | 0) % 2 ? 1 : 0;
  const x = Math.round(u.x) - fs * 5, by = Math.round(u.y - (u.z || 0) - (u.lift || 0)) - 5 - bob; // (by: the bottom of what it carries)
  if (C.img) { c.drawImage(C.img, Math.round(x - C.img.width / 2), by - C.img.height + 2); return; }
  if (C.gold) { c.fillStyle = '#2b2522'; c.fillRect(x - 3, by - 6, 7, 6); c.fillRect(x - 1, by - 8, 3, 2); c.fillStyle = '#7a5a10'; c.fillRect(x - 2, by - 5, 5, 4); c.fillStyle = '#a07a1c'; c.fillRect(x - 2, by - 5, 2, 2); c.fillStyle = '#ffd24a'; c.fillRect(x, by - 8, 1, 1); return; } // (his purse, its neck tied)
  const I = ITEM[C.k]; if (I) c.drawImage(IMG[I[4] || 'items'], I[0], I[1], 16, 16, x - 8, by - I[3], 16, 16);
}

// ---- ragdolled. Killed by a goblin wolf rider's bite, he is seized in the wolf's jaws, lifted and shaken, violently,
// this way and that, blood flung off him with every shake; then flung away, a short tumbling arc, a thud and a bounce,
// and he lies where he lands.
const RAG = { seize: 0.3, shake: 2.2 };
function ragdollPose(t, D) { return { lie: t > 0.08, dip: 0, jit: 0 }; }
function ragdollStart(h, o) {
  const D = h.death, w = h.lastSrc; D.wolf = w && !w.dead ? w : null; dropWeapon(h, 1.2); if (D.wolf) { D.wolf.script = { h, tick: wolfFoe }; D.wolf.act = null; SFX.groan(panOf(h.x)); }
}
function wolfFoe(f, dt) { // it holds him in its jaws and stands its ground, shaking its head; then watches him lie
  const S = f.script, h = S.h, D = h.death; if (!h.dead || !D || D.kind !== 'ragdoll' || h.deadT > DEATH_LEN.ragdoll) { f.script = null; return; }
  f.vx = f.vy = 0; f.moving = false; if (h.deadT < RAG.shake) f.face = h.x < f.x ? -1 : 1;
}
function ragdollTick(h, dt) {
  const D = h.death, t = h.deadT, w = D.wolf, pan = panOf(h.x);
  if (t < RAG.shake && w && !w.dead) { // seized and shaken
    const fs = w.face < 0 ? -1 : 1, k = clamp(t / RAG.seize, 0, 1), mx = w.x + fs * 11 * (w.scale || 1), my = w.y + 1;
    if ((D.shT = (D.shT || 0) - dt) <= 0 && t > RAG.seize) {
      D.shT = 0.07; D.side = -(D.side || 1); h.face = D.side; // (this way, that way)
      if (bleeds(h)) { for (let j = 0; j < 7; j++) part({ k: 'gore', x: h.x, y: h.y, z: h.z + 2, vx: D.side * rand(30, 110), vy: rand(-30, 30), vz: rand(20, 90), g: 420, life: 5, s0: 1, col: pick(BLOOD.red), kind: 'red' }); if (chance(0.4)) pool(h.x + rand(-6, 6), h.y + rand(-3, 3), 'red', 0.6); }
      if (chance(0.5)) SFX.squelch(pan, false); shake(0.04);
    }
    const sx = t > RAG.seize ? (D.side || 1) * 3 : 0; h.x += (mx + sx - h.x) * Math.min(1, dt * 30 * k + 0.1); h.y += (my - h.y) * Math.min(1, dt * 20); h.z = Math.round(4 + 4 * k + (t > RAG.seize ? (((G.time * 28) | 0) % 2) * 2 : 0)); h.vz = 0;
    return;
  }
  if (!D.fly) { // flung away
    const fs = w && !w.dead ? (w.face < 0 ? -1 : 1) : (h.face < 0 ? -1 : 1), a = fs > 0 ? rand(-0.4, 0.4) : Math.PI + rand(-0.4, 0.4), v = rand(85, 110);
    D.fly = { vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 120, n: 0, tumble: 0 }; SFX.whoosh(pan); if (w) SFX.groan(pan);
  }
  const F = D.fly; if (F.done) { if (bleeds(h) && (D.poolT = (D.poolT || 0) - dt) <= 0) { D.poolT = 0.6; pool(h.x, h.y + 1, 'red', 0.7); } return; }
  slideMove(h, F.vx * dt, F.vy * dt); F.vz -= 480 * dt; h.z = Math.max(0, (h.z || 0) + F.vz * dt); h.vz = 0;
  if ((F.tumble -= dt) <= 0 && h.z > 2) { F.tumble = 0.12; h.face = -h.face; } // (tumbling)
  if (bleeds(h) && h.z > 2 && chance(dt * 20)) drip(h.x, h.y, h.z, 'red', F.vx * 0.3, F.vy * 0.3);
  if (h.z <= 0 && F.vz < 0) { // the ground: a thud and a bounce, then he lies
    h.z = 0; shake(0.12); smoke(h.x, h.y, 2, 'dust', 6, 12, 0.6); SFX.boom(0.22, pan); if (bleeds(h)) { pool(h.x, h.y + 1, 'red', 2); bloodMark(h.x, h.y, 6, 'red'); }
    if (F.n++ === 0) { F.vz = 60; F.vx *= 0.45; F.vy *= 0.45; } else { F.done = true; F.vx = F.vy = 0; }
  }
}

// ---- fed on. Dying with ticks about (two or more), he drops to his knees and they come to him and climb him and
// latch on, here and there over his body; and they drink. Their bodies swell, fat, glossy, dark with his blood, pulsing
// as they drink, while he pales, his colour going out of him step by step, and his heart slows. When they are full they
// let go and drop off him, bloated, and drag themselves slowly away, and he slumps over.
const TICKS = { kneel: 0.2, drop: 6.2, slump: 6.6 }, TICK_RE = /Tick$/;
function ticksAround(h) { return G.foes.filter(f => !f.dead && !f.dying && !f.fall && !f.feed && !f.script && TICK_RE.test(f.spr) && dist(f.x, f.y, h.x, h.y) < 140).sort((a, b) => dist(a.x, a.y, h.x, h.y) - dist(b.x, b.y, h.x, h.y)).slice(0, 6); }
// his struggle while they drink: bursts of it, about one a second, each a few rapid lurches side to side and up off his
// knees, wilder at first and weaker and shorter as he pales; the ticks latched on him go with him (tickFoe)
function ticksStrug(t) {
  const dip = t > TICKS.kneel && t <= TICKS.slump ? 2 : 0; if (t < 1 || t >= TICKS.drop) return { x: 0, dip, on: false };
  const s = clamp(1 - (t - 1) / 5.2, 0.2, 1), on = (t * 1.15) % 1 < 0.12 + 0.3 * s; if (!on) return { x: 0, dip, on };
  const n = (t * 13) | 0; return { x: (n % 2 ? 1 : -1) * (s > 0.6 && n % 4 < 2 ? 2 : 1), dip: n % 3 === 0 ? 1 : 2, on };
}
function ticksPose(t) { const S = ticksStrug(t); return { lie: t > TICKS.slump, dip: S.dip, jit: S.x }; }
function ticksStart(h) {
  const D = h.death, P = spritePixels(h.spr), top = P.top - P.foot - 1, V = ticksAround(h).slice(0, 4); D.V = V; dropWeapon(h, 0.9);
  // where each one latches: down him (0 his head, 1 his feet), which side, in front of him or behind; on his outline,
  // its head to him and its body out from him, so he stays in sight between them, paling
  const SLOTS = [{ at: 0.3, side: 1, oy: 1 }, { at: 0.55, side: -1, oy: 1 }, { at: 0.45, side: -1, oy: -1 }, { at: 0.72, side: 1, oy: -1 }];
  V.forEach((f, i) => {
    const L = SLOTS[i], T = spritePixels(f.spr), tx = T.map(q => q.x), tw = (Math.max(...tx) - Math.min(...tx) + 1) / 2, th = T.foot - T.top + 1;
    const ry = Math.round(top * (1 - L.at)), xs = P.filter(q => Math.round(q.y - 0.5) === ry).map(q => q.x - 0.5), edge = xs.length ? (L.side > 0 ? Math.max(...xs) + 1 : Math.min(...xs)) : L.side * 4;
    f.script = { h, tick: tickFoe, dx: Math.round(edge + L.side * (tw - 2)), lz: Math.max(0, Math.round(-ry - th / 2)), oy: L.oy, sw: 0 }; f.act = null;
  });
}
function tickFoe(f, dt) {
  const S = f.script, h = S.h, D = h.death, t = h.deadT || 0; if (!h.dead || !D || D.kind !== 'ticks') { f.script = null; f.engorge = 0; return; }
  const fs = h.face < 0 ? -1 : 1, st = ticksStrug(t), tx = h.x + S.dx * fs + st.x, ty = h.y + S.oy, lz = Math.max(0, S.lz - (S.lz > 2 ? st.dip : 0)); // (with him as he struggles)
  if (t >= TICKS.drop) { // full: it lets go, drops, and drags itself away, slow with its load
    if (!S.off) { S.off = true; S.vz = 0; SFX.squelch(panOf(f.x), false); const a = angTo(h.x, h.y, f.x, f.y) + rand(-0.6, 0.6); S.away = { x: f.x + Math.cos(a) * 60, y: f.y + Math.sin(a) * 40 }; }
    if (f.lift > 0) { S.vz -= 400 * dt; S.fl = Math.max(0, (S.fl === undefined ? f.lift : S.fl) + S.vz * dt); f.lift = Math.round(S.fl); if (!f.lift) { SFX.squelch(panOf(f.x), false); if (bleeds(h)) pool(f.x, f.y, 'red', 0.5); } return; }
    steer(f, S.away.x, S.away.y, f.def.spd * 0.28, dt, 2); f.moving = true; f.face = S.away.x < f.x ? -1 : 1; if (bleeds(h) && chance(dt * 2)) bloodMark(f.x, f.y, 1.5, 'red'); return;
  }
  if (!S.at) { const d = steer(f, tx, ty, f.def.spd * 1.6, dt, 1.5); f.moving = true; f.face = tx < f.x ? -1 : 1; if (d <= 2) { S.at = true; S.t0 = t; } return; }
  f.x = tx; f.y = ty; f.vx = f.vy = 0; f.face = S.dx * fs > 0 ? -1 : 1; // (its head to him, its body out from him)
  if ((f.lift || 0) < lz) { f.lift = Math.min(lz, (f.lift || 0) + dt * 22); f.moving = true; return; } // climbing him
  f.lift = lz; f.moving = false; S.sw = clamp((t - S.t0 - 0.4) / 4, 0, 1); f.engorge = S.sw; // latched, drinking, swelling
}
function ticksTick(h, dt) {
  const D = h.death, t = h.deadT, p = t - dt, pan = panOf(h.x), latched = D.V.filter(f => f.engorge > 0).length;
  h.pale = t < 1.6 ? 0 : t < 3 ? 1 : t < 4.6 ? 2 : 3; // (paling, step by step)
  if (latched && t < TICKS.drop) { if (chance(dt * 4)) SFX.squelch(pan, false); if (chance(dt * 2)) SFX.tick(pan); }
  if (ticksStrug(t).on && !ticksStrug(p).on) SFX.stride(pan, 0, false); // (his feet scraping as he struggles)
  const beat = 0.75 + t * 0.12; if (t < TICKS.drop + 1 && (D.hb = (D.hb || 0) - dt) <= 0) { D.hb = beat; SFX.heart(Math.max(0.15, 0.6 - t * 0.07)); } // (his heart, slowing)
  if (p < TICKS.slump && t >= TICKS.slump) { SFX.boom(0.15, pan); smoke(h.x, h.y, 2, 'dust', 6, 12, 0.6); }
}
// (70_render drawUnit) a tick's body swollen with his blood: a fat glossy bulb behind it, pulsing as it drinks
function drawEngorged(c, u) {
  const sw = u.engorge, r = Math.round(1 + 4.5 * sw + (u.script && !u.script.off ? Math.sin(G.time * 7) * 0.5 * sw : 0)); if (r < 1) return;
  const fs = u.face < 0 ? -1 : 1, cx = Math.round(u.x) - fs * (2 + r), cy = Math.round(u.y - (u.z || 0) - (u.lift || 0)) - r - 1, ry = r * 0.8;
  for (let y = -Math.ceil(ry) - 1; y <= Math.ceil(ry) + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const e = (x * x) / ((r + 0.6) * (r + 0.6)) + (y * y) / ((ry + 0.6) * (ry + 0.6)); if (e > 1) continue;
    const inner = (x * x) / (r * r || 1) + (y * y) / (ry * ry || 1); c.fillStyle = inner > 1 ? '#2b2522' : inner > 0.55 ? '#4a1418' : y < 0 && inner < 0.2 && x * fs > 0 ? '#9a3036' : '#6e1a20';
    c.fillRect(cx + x, cy + y, 1, 1);
  }
  if (r >= 2) { c.fillStyle = '#e0b0b4'; c.fillRect(cx - fs * Math.round(r * 0.4), cy - Math.round(ry * 0.5), 1, 1); } // (the gloss on it)
}
// (70_render drawUnit) his frames paling: drained toward a cold grey, a third more at each step; cached
const PALES = {};
function paleOf(spr, src, oy, stage) {
  const key = spr + (src === IMG.mobs ? ':m' : ':c') + stage; if (PALES[key]) return PALES[key];
  const m = MOBS[spr], fw = m[1], fh = m[2], W = fw * 4, cv = mkCanvas(W, fh), g = cv.getContext('2d'); g.drawImage(src, 0, oy, W, fh, 0, 0, W, fh);
  const D = g.getImageData(0, 0, W, fh), d = D.data, k = stage / 3 * 0.75;
  for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2], tr = 0.92 * l + 18, tg = 0.94 * l + 18, tb = l + 24; d[i] = Math.round(d[i] + (tr - d[i]) * k); d[i + 1] = Math.round(d[i + 1] + (tg - d[i + 1]) * k); d[i + 2] = Math.round(d[i + 2] + (tb - d[i + 2]) * k); }
  g.putImageData(D, 0, 0); return (PALES[key] = cv);
}
function moreCam3(h, D, t) {
  if (D.kind === 'looted') { const L = h.lampAt || h; return { x: L.x, y: L.y - 4, z: 1.15 + 0.15 * ease(t / 4), r: 1.5 }; } // (back a little, to see them make off)
  if (D.kind === 'ragdoll') return { x: h.x, y: h.y - 6 - (h.z || 0) * 0.5, z: 1.5, r: 3 };
  return { x: h.x, y: h.y - 8, z: 1.45 + 0.45 * ease(t / 5), r: 1.6 }; // (the ticks: in close)
}
