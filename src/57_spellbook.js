// ===================== spellbook: low, medium and high spells, cast one at a time =====================
// tier 0 basic (never waits) · 1 low · 2 medium · 3 high · 4 ultimate. Non-basic casts take turns via a global stage lock.
const LOCK = [0, 0.55, 1.0, 1.7, 2.4];
const angDiff = (a, b) => ((a - b) % TAU + TAU * 1.5) % TAU - Math.PI;
function spellLabel(h, name, tier) { FX.nums.push({ x: h.x, y: h.y, z: 22 * h.scale + 10, vz: 14, vx: 0, txt: name, col: h.def.col, big: tier >= 3, label: tier, t: 0, life: 1.1 + tier * 0.3 }); }
function ghost(u, col = 'gold', life = 0.3) { FX.ghosts.push({ spr: u.spr, x: u.x, y: u.y, z: u.z, face: u.face, sc: u.scale, fr: ((u.anim * 9) | 0) % 4, col, t: 0, life }); }
let HZID = 0;
function hazard(o) { const z = { t: 0, tick: 0, hit: new Set(), ...o, id: ++HZID }; FX.hz.push(z); return z; }
// ---------- target pickers ----------
const live = f => f.filter(m => !m.dead && m.spawnT <= 0 && m.carried !== 2);
function nearestFoe(h, f, r) { return nearest(h, f, r); }
function farFoe(h, f, r0, r1) { let best = null, bd = 0; for (const m of f) { const d = dist(h.x, h.y, m.x, m.y); if (d > r0 && d < r1 && d > bd) { bd = d; best = m; } } return best; }
function toughest(h, f, r) { let best = null, bh = 0; for (const m of f) { if (dist(h.x, h.y, m.x, m.y) > r) continue; if (m.hp > bh) { bh = m.hp; best = m; } } return best; }
function cluster(h, f, r, minN, maxD) { const d = densest(f, r, h, maxD); return d && d.n >= minN ? d : null; }
function lowestHero(th) { let best = null, bf = th; for (const x of G.heroes) { if (x.dead) continue; const fr = x.hp / x.maxHp; if (fr < bf) { bf = fr; best = x; } } return best; }
function lineTarget(h, f, r, minN = 2) { let best = null, bn = 0; for (const m of f) { const d = dist(h.x, h.y, m.x, m.y); if (d > r) continue; const a = angTo(h.x, h.y, m.x, m.y); let n = 0; for (const o of f) { const od = dist(h.x, h.y, o.x, o.y); if (od < r * 1.6 && Math.abs(angDiff(angTo(h.x, h.y, o.x, o.y), a)) < 0.16) n++; } if (n > bn) { bn = n; best = m; } } return bn >= minN ? best : null; }
function segDist(px, py, x0, y0, x1, y1) { const dx = x1 - x0, dy = y1 - y0, t = clamp(((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - x0 - dx * t, py - y0 - dy * t); }
function rayEnd(x, y, a, maxL = 420) { let x1 = x, y1 = y; for (let k = 1; k <= maxL / 5; k++) { const fx = x + Math.cos(a) * k * 5, fy = y + Math.sin(a) * k * 5 * 0.85; if (!inArena(fx, fy + 10)) break; x1 = fx; y1 = fy; } return [x1, y1]; }
const D = h => h.def.dmg * h.mul;
// ---------- the phat continuous laser ----------
function laser(h, t, o) {
  const a0 = angTo(h.x, h.y, t.x, t.y), dir = chance(0.5) ? 1 : -1; SFX.beam(o.dur, o.col === 'fire' ? 0.7 : 1);
  if (o.big) { G.ambDark = Math.max(G.ambDark, 0.45); slowmo(0.6, 0.3); }
  h.state = { k: 'channel', t: 0, dur: o.dur, tick: 0, fn: (h, s, dt) => {
    const u = s.t / s.dur; let a = a0 + (u - 0.5) * o.sweep * dir;
    if (h.ctrl === 'player' && h.inp && h.inp.mv === 0) { const ix = h.inp.mx, iy = h.inp.my; if (s.aim === undefined) s.aim = a0; if (ix || iy) s.aim += clamp(angDiff(Math.atan2(iy, ix), s.aim), -3 * dt, 3 * dt); a = s.aim; }
    const ex = h.x + Math.cos(a) * 7, ey = h.y - 10, [x1, y1] = rayEnd(ex, ey, a);
    const w = o.w * Math.min(1, u * 8, (1 - u) * 8) * (0.88 + 0.12 * Math.sin(s.t * 55));
    h.face = Math.cos(a) < 0 ? -1 : 1; h.vx = damp(h.vx, -Math.cos(a) * 6, 4, dt); h.vy = damp(h.vy, -Math.sin(a) * 4, 4, dt);
    if (!s.beam || !FX.beams.includes(s.beam)) { s.beam = { col: o.col, steady: true, cap: true }; FX.beams.push(s.beam); } Object.assign(s.beam, { x0: ex, y0: ey, x1, y1, w, t: 0, life: 0.2 });
    for (let k = 0; k <= 6; k++) light(lerp(ex, x1, k / 6), lerp(ey, y1, k / 6) + 8, 26 + w * 6, o.col, 0.8);
    light(x1, y1 + 8, 40 + w * 10, o.col, 1.4); G.ambFlash = Math.max(G.ambFlash, 0.08 * w / 3);
    sparks(x1, y1 + 10, 6, o.big ? 4 : 2, o.col === 'fire' ? 'fire' : 'bolt', 200, 160); if (chance(0.5)) glows(x1, y1 + 10, 6, 1, o.col, 60, w * 1.5, 0.3); if (chance(0.25)) smoke(x1, y1 + 10, 1, 'dark', 8, 20, 1, 12); if (chance(0.4)) scorch(x1, y1 + 12, 4 + w, 0.35);
    shake(o.big ? 0.035 : 0.015);
    s.tick -= dt; if (s.tick <= 0) { s.tick = 0.08; for (const m of G.mons) { if (m.dead || m.spawnT > 0) continue; if (segDist(m.x, m.y - 6 * m.scale, ex, ey, x1, y1) < w * 1.4 + m.r) { hurt(m, D(h) * o.dps * 0.08, h, { elem: o.col === 'fire' ? 'fire' : 'bolt', kx: Math.cos(a) * 40, ky: Math.sin(a) * 30, quiet: true, stun: 0.12 }); if (chance(0.3)) sparks(m.x, m.y, 8, 3, o.col === 'fire' ? 'fire' : 'bolt', 140, 100); } } }
  } };
}
// ---------- FIRE: Ignis ----------
const fan = (n, spread) => Array.from({ length: n }, (_, i) => n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
function emberBolt(h, t) { const m = md('EMBER BOLT'), a = angTo(h.x, h.y, t.x, t.y), d = dist(h.x, h.y, t.x, t.y); for (const o of fan(1 + m.count, 0.5)) castFireball(h, h.x + Math.cos(a + o) * d, h.y + Math.sin(a + o) * d, 0.42, 1.1 * m.dmg, { burn: m.f.burn, fx: 'pop' }); }
function cinderSpray(h, t) {
  const m = md('CINDER SPRAY'), a = angTo(h.x, h.y, t.x, t.y), cone = 0.4 * m.size, R = 72 * m.size; SFX.fire(panOf(h.x)); emitFx('spray', { u: h, a, cone, sz: m.size }, 0.8 * m.dur);
  h.state = { k: 'channel', t: 0, dur: 0.8 * m.dur, tick: 0, fn: (h, s, dt) => {
    s.tick -= dt; if (s.tick <= 0) { s.tick = 0.15; for (const u of live(G.mons)) { if (dist(h.x, h.y, u.x, u.y) < R && Math.abs(angDiff(angTo(h.x, h.y, u.x, u.y), a)) < cone + 0.1) { hurt(u, D(h) * 0.3 * m.dmg, h, { elem: 'fire', quiet: true }); u.burn = Math.max(u.burn, 1); } } }
  } };
}
function immolate(h, t) { const m = md('IMMOLATE'), ts = [t, ...live(G.mons).filter(x => x !== t).sort((a, b) => b.hp - a.hp).slice(0, m.count)]; for (const u of ts) { u.burn = 4.5; u.burnDmg = D(h) * 0.3 * m.dmg; u.immo = h; u.immoR = 34 * m.size; u.immoD = m.dmg; hurt(u, D(h) * 0.7 * m.dmg, h, { elem: 'fire' }); column(u.x, u.y, 'fire', 0.8, 7); glows(u.x, u.y, 10, 10, 'fire', 50, 5, 0.6); ring(u.x, u.y, 22, 'fire', 0.3, 3); } SFX.fire(panOf(t.x)); }
function blazingDarts(h) { const m = md('BLAZING DARTS'), ts = live(G.mons).sort((a, b) => dist(h.x, h.y, a.x, a.y) - dist(h.x, h.y, b.x, b.y)).slice(0, 3 + m.count); for (let i = 0; i < 3 + m.count && ts.length; i++) { const t = ts[i % ts.length]; after(i * 0.08, () => { if (alive(h)) castFireball(h, t.x + rand(-4, 4), t.y + rand(-3, 3), 0.5 * m.size, 1.2 * m.dmg); }); } }
function flameWall(h, p) {
  const m = md('FLAME WALL'), a0 = angTo(h.x, h.y, p.x, p.y), half = Math.round(4 * m.size);
  for (const a of m.count ? [a0, a0 + Math.PI / 2] : [a0]) {
    const px = -Math.sin(a), py = Math.cos(a), cx = p.x - Math.cos(a0) * 10, cy = p.y - Math.sin(a0) * 8;
    for (let i = -half; i <= half; i++) { const x = cx + px * i * 9, y = cy + py * i * 7; if (!inArena(x, y)) continue; after((i + half) * 0.035, () => { hazard({ k: 'flame', x, y, r: 8, life: 3.4 * m.dur, rate: 0.3, dmg: D(h) * 0.35 * m.dmg, src: h }); debris(x, y, 3, ['#3c342e', '#241c18'], 60, 100, 1.4); glows(x, y, 4, 4, 'fire', 60, 6, 0.4); }); }
  }
  SFX.boom(0.5, panOf(p.x)); shake(0.12);
}
function fireSerpents(h) {
  const m = md('FIRE SERPENTS'), n = 3 + m.count, ts = live(G.mons).sort((a, b) => dist(h.x, h.y, a.x, a.y) - dist(h.x, h.y, b.x, b.y)).slice(0, n); if (!ts.length) return;
  for (let i = 0; i < n; i++) { const t = ts[i % ts.length], a = angTo(h.x, h.y, t.x, t.y) + (i - (n - 1) / 2) * 0.6; after(i * 0.05, () => proj({ k: 'mshot', shot: 'serpent', x: h.x, y: h.y, z: 9, vx: Math.cos(a) * 115, vy: Math.sin(a) * 100, team: 'hero', src: h, dmg: D(h) * 1.4 * m.dmg, col: 'fire', life: 3, r: 3, home: t, wob: rand(TAU), ER: 17 * m.size })); }
  SFX.whoosh(panOf(h.x));
}
function magmaPools(h, p) { const m = md('MAGMA POOLS'); for (let i = 0; i < 3 + m.count; i++) { const tx = p.x + rand(-26, 26), ty = p.y + rand(-16, 16); proj({ k: 'glob', x: h.x, y: h.y, x0: h.x, y0: h.y, tx, ty, z: 8, u: 0, T: 0.5 + i * 0.1, team: 'hero', src: h, dmg: D(h) * 0.3 * m.dmg, life: 3, PR: 13 * m.size, PL: 4.2 * m.dur }); } SFX.fire(panOf(h.x)); }
function heatRay(h, t) { const m = md('HEAT RAY'); laser(h, t, { dur: 1.4 * m.dur, w: 2.2 * m.size, sweep: 0.5, dps: 1.6 * m.dmg, col: 'fire' }); }
// ---------- STORM: Voltaire ----------
function spark(h, t) { const m = md('SPARK'); chainLightning(h, t, 1 + m.count, m.dmg); }
function staticCharge(h) { const m = md('STATIC CHARGE'), ts = live(G.mons).filter(u => dist(h.x, h.y, u.x, u.y) < 85 * m.size).slice(0, 3 + m.count); for (const u of ts) { bolt(h.x, h.y - 10, u.x, u.y - 6, { life: 0.16, w: 0.6, branches: 0 }); zapHit(u, h, D(h) * 0.7 * m.dmg, { stun: 0.3 }); } ring(h.x, h.y, 26 * m.size, 'bolt', 0.25, 2); }
function shockOrb(h, t) { const m = md('SHOCK ORB'), ts = [t, ...live(G.mons).filter(x => x !== t).slice(0, m.count)]; ts.forEach((u, i) => { const a = angTo(h.x, h.y, u.x, u.y); proj({ k: 'mshot', shot: 'sorb', x: h.x, y: h.y, z: 10, vx: Math.cos(a) * 120, vy: Math.sin(a) * 100, team: 'hero', src: h, dmg: D(h) * 1.3 * m.dmg, col: 'bolt', life: 2.5, r: 4, home: u, BR: 20 * m.size, ST: 0.9 * m.dur }); }); SFX.zap(panOf(h.x)); }
function gust(h, t) {
  const m = md('GUST'), a0 = angTo(h.x, h.y, t.x, t.y), R = 64 * m.size, cone = 0.65 * Math.sqrt(m.size); SFX.whoosh(panOf(h.x));
  for (const a of m.count ? [a0, a0 + Math.PI] : [a0]) {
    gustFx(h.x, h.y, a, cone, m.size);
    smoke(h.x + Math.cos(a) * 20, h.y + Math.sin(a) * 15, 4, 'dust', 8, 50, 0.8, 4);
    for (const u of live(G.mons)) if (dist(h.x, h.y, u.x, u.y) < R && Math.abs(angDiff(angTo(h.x, h.y, u.x, u.y), a)) < cone) hurt(u, D(h) * 0.4 * m.dmg, h, { kx: Math.cos(a) * 280, ky: Math.sin(a) * 220, stun: 0.5, up: 40 });
  }
}
function lightningLance(h, t) {
  const m = md('LIGHTNING LANCE'), a0 = angTo(h.x, h.y, t.x, t.y), ex = h.x, ey = h.y - 10, W = 3.2 * m.size;
  fan(1 + m.count, 0.5 * Math.min(1, m.count)).forEach((o, i) => after(i * 0.07, () => {
    const a = a0 + o, [x1, y1] = rayEnd(ex, ey, a);
    FX.beams.push({ x0: ex, y0: ey, x1, y1, w: W, col: 'bolt', t: 0, life: 0.32, cap: true }); bolt(ex, ey, x1, y1, { life: 0.3, w: 1, branches: 3, jag: 0.35 });
    for (let k = 0; k <= 8; k++) flashLight(lerp(ex, x1, k / 8), lerp(ey, y1, k / 8) + 8, 50, 'bolt2', 1.2, 0.3);
    for (const u of live(G.mons)) if (segDist(u.x, u.y - 6, ex, ey, x1, y1) < 9 * m.size + u.r) { hurt(u, D(h) * 2.2 * m.dmg, h, { elem: 'bolt', stun: 0.5, kx: Math.cos(a) * 90, ky: Math.sin(a) * 70, crit: chance(0.3) }); sparks(u.x, u.y, 8, 8, 'bolt', 160, 120); }
    sparks(x1, y1 + 10, 6, 20, 'bolt', 240, 180); scorch(x1, y1 + 12, 10, 0.6); flash('bolt2', 0.12); shake(0.22); hitstop(0.04); SFX.thunder(panOf(h.x), 0.6);
  }));
}
function teslaCoil(h, p) { const m = md('TESLA COIL'); for (let i = 0; i <= m.count; i++) { const x = clamp(p.x + rand(-14, 14) + (i ? rand(-40, 40) : 0), ARENA.x0 + 10, ARENA.x1 - 10), y = clamp(p.y + rand(-10, 10) + (i ? rand(-24, 24) : 0), ARENA.y0 + 10, ARENA.y1 - 6); hazard({ k: 'coil', x, y, r: 72 * m.size, life: 5.5 * m.dur, rate: 0.28, dmg: D(h) * 0.75 * m.dmg, src: h }); ring(x, y, 30, 'bolt', 0.35, 3); debris(x, y, 8, ['#5a5048', '#7d7064'], 80, 120, 1.6); } SFX.zap(panOf(p.x)); }
function arcField(h, p) { const m = md('ARC FIELD'); hazard({ k: 'arc', x: p.x, y: p.y, r: 40 * m.size, life: 3.4 * m.dur, rate: 0.22, dmg: D(h) * 0.4 * m.dmg, src: h }); ring(p.x, p.y, 44 * m.size, 'bolt', 0.4, 4); SFX.thunder(panOf(p.x), 0.4); }
function arcCannon(h, t) { const m = md('ARC CANNON'); banner('ARC CANNON', h); laser(h, t, { dur: 2.8 * m.dur, w: 6 * m.size, sweep: m.f.sweep ? 2 : 1.1, dps: 3.2 * m.dmg, col: 'bolt', big: true }); }
// ---------- EARTH: Mossa ----------
function pebble(h, t) { const m = md('PEBBLE'), a0 = angTo(h.x, h.y, t.x, t.y); for (const o of fan(1 + m.count, 0.45)) { const a = a0 + o; proj({ k: 'mshot', shot: 'stone', x: h.x, y: h.y, z: 8, vx: Math.cos(a) * 190, vy: Math.sin(a) * 160, team: 'hero', src: h, dmg: D(h) * 0.9 * m.dmg, col: 'white', life: 1.6, r: 3 }); } }
function mend(h, t) { const m = md('MEND'), ts = [t, ...G.heroes.filter(x => !x.dead && x !== t && x.hp < x.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, m.count)]; for (const u of ts) { heal(u, u.maxHp * 0.3 * m.dmg); column(u.x, u.y, 'heal', 0.9, 9); ring(u.x, u.y, 26, 'heal', 0.35, 3); } SFX.heal(); }
function thornLash(h, t) { const m = md('THORN LASH'), ts = [t, ...live(G.mons).filter(x => x !== t && dist(h.x, h.y, x.x, x.y) < 120).slice(0, m.count)]; for (const u of ts) { FX.beams.push({ x0: h.x, y0: h.y - 8, x1: u.x, y1: u.y - 6, w: 1.3, col: 'heal', t: 0, life: 0.28 }); lashFx(h.x, h.y, u.x, u.y); hurt(u, D(h) * 1.2 * m.dmg, h, { elem: 'earth', stun: 0.8 * m.size }); } SFX.slash(panOf(t.x)); }
function rejuvenate(h, t) { const m = md('REJUVENATE'), ts = [t, ...G.heroes.filter(x => !x.dead && x !== t).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, m.count)]; for (const u of ts) { u.regen = { t: 4.5 * m.dur, per: u.maxHp * 0.045 * m.dmg, tick: 0 }; ring(u.x, u.y, 30, 'heal', 0.5, 3); } SFX.heal(); }
function entangle(h, p) { const m = md('ENTANGLE'), R = 34 * m.size; for (const u of within(p.x, p.y, R, G.mons)) { const T = (u.scale > 1.2 ? 1 : 2) * m.dur; u.stun = Math.max(u.stun, T); hazard({ k: 'roots', m: u, x: u.x, y: u.y, life: T, seed: rand(100) }); hurt(u, D(h) * 0.5 * m.dmg, h, { elem: 'earth', quiet: true }); } debris(p.x, p.y, 12, ['#3a8a30', '#6a4a2a', '#2a5a20'], 70, 120, 1.6); ring(p.x, p.y, R + 2, 'heal', 0.4, 3); SFX.hit(panOf(p.x)); }
function stoneFist(h, t) { const m = md('STONE FIST'), ts = [t, ...live(G.mons).filter(x => x !== t).sort((a, b) => b.hp - a.hp).slice(0, m.count)]; ts.forEach((u, i) => { const x = u.x, y = u.y; teleg(x, y, 16 * m.size, 0.3, 'earth'); after(0.3 + i * 0.12, () => { hazard({ k: 'fist', x, y, life: 0.9, r: 15 * m.size, sz: m.size, dmg: D(h) * 2.4 * m.dmg, src: h }); debris(x, y, 16, ['#5a5048', '#7d7064', '#3c342e'], 120, 220, 2); smoke(x, y, 4, 'dust', 10, 40, 1); shake(0.25); SFX.boom(0.6, panOf(x)); }); }); }
function insectSwarm(h, p) { const m = md('INSECT SWARM'); for (let i = 0; i <= m.count; i++) { const tg = i ? pick(live(G.mons)) || p.u : p.u; hazard({ k: 'swarm', x: tg ? tg.x : p.x, y: tg ? tg.y : p.y, tgt: tg, life: 4.5 * m.dur, rate: 0.3, r: 18, dmg: D(h) * 0.35 * m.dmg, src: h, dots: Array.from({ length: 22 }, () => [rand(TAU), rand(4, 12), rand(6, 14)]) }); } SFX.whoosh(panOf(p.x)); }
function boulderRoll(h, p) { const m = md('BOULDER ROLL'), a0 = angTo(h.x, h.y, p.x, p.y); for (const o of fan(1 + m.count, 0.6)) { const a = a0 + o; hazard({ k: 'boulder', x: h.x + Math.cos(a) * 12, y: h.y + Math.sin(a) * 10, vx: Math.cos(a) * 155, vy: Math.sin(a) * 130, a, r: 11 * m.size, sz: m.size, life: 3.2 * m.dur, dmg: D(h) * 2.2 * m.dmg, src: h, rot: 0 }); } SFX.hit(panOf(h.x)); }
function massHeal(h) { const m = md('MASS HEAL'), hl = G.heroes.filter(x => !x.dead && x.hp < x.maxHp * 0.8); for (const x of hl) { heal(x, x.maxHp * 0.28 * m.dmg); column(x.x, x.y, 'heal', 1, 10); if (m.f.regen) x.regen = { t: 4, per: x.maxHp * 0.04, tick: 0 }; } ring(h.x, h.y, 70, 'heal', 0.6, 4); SFX.heal(); }
function resurrect(h, f) {
  const m = md('RESURRECTION'); f = f && f.dead ? f : G.heroes.find(x => x.dead); if (!f) return; f.dead = false; f.hp = Math.round(f.maxHp * Math.min(1, 0.5 * m.dmg)); f.stun = 0.6; f.vz = 90;
  riseFx(f.x, f.y);
  if (m.f.blast) { ring(f.x, f.y, 90, 'gold', 0.5, 6); for (const u of within(f.x, f.y, 60, G.mons)) { const a = angTo(f.x, f.y, u.x, u.y); hurt(u, D(h) * 2, h, { elem: 'earth', kx: Math.cos(a) * 300, ky: Math.sin(a) * 240, up: 200, stun: 1 }); } shake(0.4); }
  textBanner(f.def.name + ' RISES', 'PULLED FROM THE DARK BY ' + h.def.name, 'heal'); SFX.heal(); slowmo(0.5, 0.4);
}
// ---------- STEEL: Brandt ----------
function dash(h, tx, ty, dur, o = {}) { tx = clamp(tx, ARENA.x0 + 6, ARENA.x1 - 6); ty = clamp(ty, ARENA.y0 + 4, ARENA.y1 - 2); h.state = { k: 'dash', t: 0, dur, x0: h.x, y0: h.y, x1: tx, y1: ty, hit: new Set(), r: o.r || 12, onHit: o.onHit, onEnd: o.onEnd, col: o.col || 'gold', gT: 0 }; h.face = tx < h.x ? -1 : 1; }
function shieldBash(h, t) {
  const m = md('SHIELD BASH'), a = angTo(h.x, h.y, t.x, t.y);
  const hit = u => { hurt(u, D(h) * 1.1 * m.dmg, h, { kx: Math.cos(a) * 230, ky: Math.sin(a) * 180, stun: 1.1, crit: true }); bashFx(u.x, u.y); hitstop(0.05); SFX.clang(panOf(u.x)); };
  dash(h, t.x - Math.cos(a) * 9, t.y - Math.sin(a) * 7, 0.12, { r: 10, onHit: hit, onEnd: () => { if (m.f.wide) { ring(h.x, h.y, 44, 'white', 0.3, 4); for (const u of within(h.x, h.y, 30, G.mons)) hurt(u, D(h) * 0.7 * m.dmg, h, { stun: 0.9, kx: Math.cos(angTo(h.x, h.y, u.x, u.y)) * 200, ky: Math.sin(angTo(h.x, h.y, u.x, u.y)) * 160 }); shake(0.2); } } });
}
function lunge(h, t, left) {
  const m = md('LUNGE'); left = left === undefined ? m.count : left; const a = angTo(h.x, h.y, t.x, t.y), tx = t.x + Math.cos(a) * 14, ty = t.y + Math.sin(a) * 11;
  FX.beams.push({ x0: h.x, y0: h.y - 6, x1: tx, y1: ty - 6, w: 0.9 * m.size, col: 'gold', t: 0, life: 0.22 });
  dash(h, tx, ty, 0.16, { r: 11 * m.size, onHit: u => { hurt(u, D(h) * 1.5 * m.dmg, h, { kx: Math.cos(a) * 160, ky: Math.sin(a) * 120, crit: chance(0.4) }); sparks(u.x, u.y, 8, 10, 'gold', 200, 100, a, 1); }, onEnd: () => { if (left > 0) { const n = farFoe(h, live(G.mons), 30, 110 * m.size); if (n) after(0.06, () => { if (alive(h) && !h.state) lunge(h, n, left - 1); }); } } });
  SFX.slash(panOf(h.x));
}
function risingSlash(h, t) {
  const m = md('RISING SLASH'), ts = m.f.wide ? within(h.x, h.y, 26, G.mons) : [t];
  arcFx(h.x, h.y - 6, -Math.PI / 2, 2.6, 18, 'gold', 0.22, 4); h.lunge = 0.3; h.la = -Math.PI / 2; SFX.slash(panOf(h.x));
  for (const u of ts) { hurt(u, D(h) * 1.2 * m.dmg, h, { up: 320 * m.size, stun: 1, crit: true }); sparks(u.x, u.y, 6, 10, 'gold', 120, 220, -Math.PI / 2, 1.2); }
  for (let k = 0; k <= m.count; k++) after(0.3 + k * 0.14, () => { for (const u of ts) { if (!alive(u) || !alive(h)) continue; arcFx(u.x, u.y - u.z - 4, rand(TAU), 3, 14, 'gold', 0.18, 3.5); hurt(u, D(h) * 0.9 * m.dmg, h, { kx: k === m.count ? h.face * 220 : 0, ky: rand(-60, 60), up: k < m.count ? 120 : 0, crit: true }); sparks(u.x, u.y, u.z + 4, 12, 'gold', 180, 60); } hitstop(0.05); SFX.clang(panOf(t.x)); });
}
function bladeFlurry(h, t) {
  const m = md('BLADE FLURRY'), n = 7 + m.count; h.state = { k: 'hold', t: 0, dur: 0.1 + n * 0.075 }; SFX.whoosh(panOf(h.x));
  for (let i = 0; i < n; i++) after(i * 0.075, () => { if (!alive(t) || !alive(h)) return; const last = i === n - 1, a = rand(TAU); arcFx(t.x, t.y - 6, a, last ? 3.6 : 2.2, last ? 22 : 14, 'gold', 0.14, last ? 5 : 2.5); ghost(h, 'gold', 0.18); h.face = t.x < h.x ? -1 : 1; hurt(t, D(h) * (last ? 1.8 * m.dmg : 0.45), h, { elem: 'phys', kx: last ? h.face * 260 : 0, crit: last, quiet: !last && i % 2 === 0 }); sparks(t.x, t.y, 8, last ? 16 : 4, 'gold', 170, 90); SFX.slash(panOf(t.x)); if (last) { hitstop(0.07); shake(0.2); kick(0.03); } });
}
function swordWave(h, t) { const m = md('SWORD WAVE'), a0 = angTo(h.x, h.y, t.x, t.y); arcFx(h.x, h.y - 6, a0, 2.4, 22, 'gold', 0.18, 4); for (const o of fan(1 + m.count, 0.5)) { const a = a0 + o; hazard({ k: 'wave', x: h.x + Math.cos(a) * 10, y: h.y + Math.sin(a) * 8, vx: Math.cos(a) * 230, vy: Math.sin(a) * 190, a, r: 15 * m.size, sz: m.size, life: 0.95 * m.dur, dmg: D(h) * 1.7 * m.dmg, src: h }); } SFX.slash(panOf(h.x)); SFX.whoosh(panOf(h.x)); }
function groundPound(h) { const m = md('GROUND POUND'); h.state = { k: 'leap', t: 0, dur: 0.34, x0: h.x, y0: h.y, x1: h.x, y1: h.y, pow: 0.6 * m.size, R: 42 * m.size, dm: 1.6 * m.dmg, hgt: 34 }; if (m.count) after(0.75, () => { if (alive(h) && !h.state) h.state = { k: 'leap', t: 0, dur: 0.3, x0: h.x, y0: h.y, x1: h.x, y1: h.y, pow: 0.7 * m.size, R: 48 * m.size, dm: 1.4 * m.dmg, hgt: 40 }; }); }
function charge(h, t, back) {
  const m = md('CHARGE'), a = angTo(h.x, h.y, t.x, t.y), L = 130 * m.dur, px = -Math.sin(a), py = Math.cos(a);
  dash(h, h.x + Math.cos(a) * L, h.y + Math.sin(a) * L * 0.85, 0.5 * Math.sqrt(m.dur), { r: 13, onHit: u => { const side = ((u.x - h.x) * px + (u.y - h.y) * py) > 0 ? 1 : -1; hurt(u, D(h) * 1.4 * m.dmg, h, { kx: px * side * 280 + Math.cos(a) * 80, ky: py * side * 220, up: 170, stun: 0.7 }); debris(u.x, u.y, 4, ['#5a5048', '#7d7064'], 80, 100, 1.4); hitstop(0.02); SFX.hit(panOf(u.x)); }, onEnd: () => { ring(h.x, h.y, 40, 'gold', 0.3, 4); smoke(h.x, h.y, 5, 'dust', 10, 40, 1); shake(0.2); if (m.count && !back) { const n = nearest(h, live(G.mons), 160); if (n) after(0.15, () => { if (alive(h) && !h.state) charge(h, n, true); }); } } });
  SFX.whoosh(panOf(h.x));
}
function thousandCuts(h) {
  const m = md('THOUSAND CUTS'), list = live(G.mons).sort((a, b) => dist(h.x, h.y, a.x, a.y) - dist(h.x, h.y, b.x, b.y)).slice(0, 10 + Math.min(8, G.lvl - 13) + m.count); if (!list.length) return;
  banner('THOUSAND CUTS', h); slowmo(0.4, 1.4); G.ambDark = Math.max(G.ambDark, 0.65); flash('white', 0.25); SFX.braam();
  h.state = { k: 'cuts', t: 0, i: 0, list, step: 0.1, marked: [], dm: m.dmg };
}
// ---------- alternative basic attacks ----------
function cleave(h, t) {
  const m = md('CLEAVE'), a = angTo(h.x, h.y, t.x, t.y), R = 28 * m.size; h.lunge = 0.35; h.la = a; h.face = Math.cos(a) < 0 ? -1 : 1;
  arcFx(h.x, h.y - 6, a, 3 * Math.min(1.3, m.size), R, 'gold', 0.24, 5); SFX.slash(panOf(h.x)); let any = false;
  for (const u of within(h.x, h.y, R + 4, G.mons)) { if (Math.abs(angDiff(angTo(h.x, h.y, u.x, u.y), a)) > 1.6) continue; any = true; hurt(u, D(h) * 2 * m.dmg, h, { elem: 'phys', kx: Math.cos(a) * 220, ky: Math.sin(a) * 170, up: 80, crit: chance(0.15), stun: 0.3 }); sparks(u.x, u.y, 8, 8, 'gold', 190, 110, a, 1.4); }
  if (any) { hitstop(0.05); shake(0.14); SFX.hit(panOf(h.x)); }
}
function quickStab(h, t) {
  const m = md('QUICK STAB'), a = angTo(h.x, h.y, t.x, t.y); h.lunge = 0.25; h.la = a; h.face = Math.cos(a) < 0 ? -1 : 1;
  const stab = () => { if (!alive(t) || !alive(h)) return; FX.beams.push({ x0: h.x + Math.cos(a) * 4, y0: h.y - 6, x1: t.x, y1: t.y - 6, w: 0.5, col: 'gold', t: 0, life: 0.1 }); const crit = chance(m.f.crit ? 0.6 : 0.35); hurt(t, D(h) * 0.7 * m.dmg, h, { elem: 'phys', crit, kx: Math.cos(a) * 50, ky: Math.sin(a) * 40 }); sparks(t.x, t.y, 8, crit ? 8 : 3, 'gold', 150, 80, a, 0.8); if (crit) hitstop(0.03); };
  stab(); for (let i = 1; i <= m.count; i++) after(i * 0.08, stab); SFX.slash(panOf(h.x));
}
function fireOrb(h, t) { const m = md('FIRE ORB'), a0 = angTo(h.x, h.y, t.x, t.y), d = dist(h.x, h.y, t.x, t.y); for (const o of fan(1 + m.count, 0.45)) castFireball(h, h.x + Math.cos(a0 + o) * d, h.y + Math.sin(a0 + o) * d, 0.55 * m.size, 1.3 * m.dmg, { speed: 120, fx: 'light' }); }
function flameJet(h, t) {
  const m = md('FLAME JET'), a = angTo(h.x, h.y, t.x, t.y), R = 66 * m.size; h.lunge = 0.15; h.la = a;
  jetFx(h.x, h.y, a, m.size);
  for (const u of live(G.mons)) if (dist(h.x, h.y, u.x, u.y) < R && Math.abs(angDiff(angTo(h.x, h.y, u.x, u.y), a)) < 0.32) { hurt(u, D(h) * 0.45 * m.dmg, h, { elem: 'fire', quiet: true }); if (m.f.burn) { u.burn = Math.max(u.burn, 2); u.burnDmg = Math.max(u.burnDmg || 0, D(h) * 0.12); } }
  if (chance(0.3)) SFX.fire(panOf(h.x));
}
function arcWhip(h) { const m = md('ARC WHIP'), ts = live(G.mons).filter(u => dist(h.x, h.y, u.x, u.y) < 72 * m.size).sort((a, b) => dist(h.x, h.y, a.x, a.y) - dist(h.x, h.y, b.x, b.y)).slice(0, 2 + m.count); for (const u of ts) { bolt(h.x, h.y - 10, u.x, u.y - 6, { life: 0.14, w: 0.55, branches: 0 }); zapHit(u, h, D(h) * 0.8 * m.dmg, { stun: 0.15 }); } }
function stormBolt(h, t) { const m = md('STORM BOLT'), ts = [t, ...live(G.mons).filter(x => x !== t).slice(0, m.count)]; for (const u of ts) { const a = angTo(h.x, h.y, u.x, u.y); proj({ k: 'mshot', shot: 'sorb', x: h.x, y: h.y, z: 10, vx: Math.cos(a) * 150, vy: Math.sin(a) * 125, team: 'hero', src: h, dmg: D(h) * 2.2 * m.dmg, col: 'bolt', life: 2, r: 4, home: u, BR: 13 * m.size, ST: 0.6 }); } SFX.zap(panOf(h.x)); }
function thornDart(h, t) { const m = md('THORN DART'), a0 = angTo(h.x, h.y, t.x, t.y); fan(2 + m.count, 0.3).forEach((o, i) => after(i * 0.06, () => { if (!alive(h)) return; const a = a0 + o; proj({ k: 'mshot', shot: 'arrow', tint: '#8ce070', x: h.x, y: h.y, z: 8, vx: Math.cos(a) * 230, vy: Math.sin(a) * 190, team: 'hero', src: h, dmg: D(h) * 0.55 * m.dmg, col: 'heal', life: 1.4, r: 3 }); })); }
function mudBall(h, t) { const m = md('MUD BALL'); for (let i = 0; i <= m.count; i++) { const tx = t.x + (i ? rand(-22, 22) : 0), ty = t.y + (i ? rand(-15, 15) : 0); proj({ k: 'glob', mud: true, x: h.x, y: h.y, x0: h.x, y0: h.y, tx, ty, z: 8, u: 0, T: 0.55 + i * 0.1, team: 'hero', src: h, dmg: D(h) * 1.3 * m.dmg, life: 3, PR: 18 * m.size, SL: 1.6 * m.dur }); } }
// ---------- the book ----------
const SPELLBOOK = {
  warrior: [
    { name: 'SLASH', lvl: 1, tier: 0, basic: true, cd: 0.5, reach: 14, cast: slash },
    { name: 'CLEAVE', lvl: 1, tier: 0, basic: true, cd: 0.95, reach: 16, cast: cleave },
    { name: 'QUICK STAB', lvl: 1, tier: 0, basic: true, cd: 0.3, reach: 14, cast: quickStab },
    { name: 'SHIELD BASH', lvl: 2, tier: 1, cd: 4.5, wind: 0.12, pick: (h, f) => nearestFoe(h, f, 42), cast: shieldBash },
    { name: 'LUNGE', lvl: 3, tier: 1, cd: 5, wind: 0.14, pick: (h, f) => farFoe(h, f, 40, 110), cast: lunge },
    { name: 'RISING SLASH', lvl: 4, tier: 1, cd: 5.5, wind: 0.12, pick: (h, f) => nearestFoe(h, f, 26), cast: risingSlash },
    { name: 'BLADE FLURRY', lvl: 5, tier: 2, cd: 6.5, wind: 0.2, pick: (h, f) => toughest(h, f, 28), cast: bladeFlurry },
    { name: 'SWORD WAVE', lvl: 6, tier: 2, cd: 6, wind: 0.3, pick: (h, f) => lineTarget(h, f, 140), cast: swordWave },
    { name: 'GROUND POUND', lvl: 8, tier: 2, cd: 8, wind: 0.22, pick: (h, f) => within(h.x, h.y, 38, f).length >= 4 ? true : null, cast: groundPound },
    { name: 'CHARGE', lvl: 9, tier: 2, cd: 9, wind: 0.3, pick: (h, f) => lineTarget(h, f, 150, 3), cast: charge },
    { name: 'WHIRLWIND', lvl: 11, tier: 3, cd: 7, wind: 0.3, pick: (h, f) => within(h.x, h.y, 30, f).length >= 3 ? true : null, cast: whirlwind },
    { name: 'THOUSAND CUTS', lvl: 13, tier: 3, cd: 16, wind: 0.5, pick: (h, f) => f.length >= 6 ? true : null, cast: thousandCuts },
    { name: 'CATACLYSM', lvl: 15, tier: 4, wind: 0.5, pick: (h, f) => { const d = densest(f, 50, h, 200); return d && (d.n >= 4 || G.boss) ? d : null; }, cast: cataclysm },
  ],
  pyro: [
    { name: 'EMBER BOLT', lvl: 1, tier: 0, basic: true, cd: 1.15, pick: (h, f) => nearestFoe(h, f, 170), cast: emberBolt },
    { name: 'FIRE ORB', lvl: 1, tier: 0, basic: true, cd: 1.8, pick: (h, f) => nearestFoe(h, f, 170), cast: fireOrb },
    { name: 'FLAME JET', lvl: 1, tier: 0, basic: true, cd: 0.3, range: 60, pick: (h, f) => nearestFoe(h, f, 75 * md('FLAME JET').size), cast: flameJet },
    { name: 'CINDER SPRAY', lvl: 2, tier: 1, cd: 5, wind: 0.25, pick: (h, f) => nearestFoe(h, f, 70), cast: cinderSpray },
    { name: 'IMMOLATE', lvl: 3, tier: 1, cd: 6, wind: 0.3, pick: (h, f) => toughest(h, f, 160), cast: immolate },
    { name: 'BLAZING DARTS', lvl: 4, tier: 1, cd: 4.5, wind: 0.25, pick: (h, f) => nearestFoe(h, f, 170), cast: blazingDarts },
    { name: 'FLAME WALL', lvl: 5, tier: 2, cd: 10, wind: 0.45, pick: (h, f) => cluster(h, f, 30, 4, 150), cast: flameWall },
    { name: 'HEAT RAY', lvl: 6, tier: 2, cd: 9, wind: 0.5, pick: (h, f) => lineTarget(h, f, 160, 2), cast: heatRay },
    { name: 'FIRE SERPENTS', lvl: 7, tier: 2, cd: 8, wind: 0.45, pick: (h, f) => nearestFoe(h, f, 180), cast: fireSerpents },
    { name: 'MAGMA POOLS', lvl: 8, tier: 2, cd: 9, wind: 0.45, pick: (h, f) => cluster(h, f, 26, 3, 170), cast: magmaPools },
    { name: 'FIREBALL', lvl: 10, tier: 3, cd: 3.4, wind: 0.6, pick: (h, f) => cluster(h, f, 26, 2, 180), cast: (h, t) => castFireball(h, t.x, t.y, PWR.fireball()) },
    { name: 'FLAME NOVA', lvl: 11, tier: 3, cd: 8, wind: 0.55, pick: (h, f) => within(h.x, h.y, 44, f).length >= 3 ? true : null, cast: flameNova },
    { name: 'METEOR STORM', lvl: 13, tier: 4, wind: 0.9, pick: () => true, cast: meteorStorm },
  ],
  storm: [], // Voltaire's wind and thunder book is in 67_windcaller.js
  druid: [
    { name: 'PEBBLE', lvl: 1, tier: 0, basic: true, cd: 1.3, pick: (h, f) => nearestFoe(h, f, 150), cast: pebble },
    { name: 'THORN DART', lvl: 1, tier: 0, basic: true, cd: 1, pick: (h, f) => nearestFoe(h, f, 160), cast: thornDart },
    { name: 'MUD BALL', lvl: 1, tier: 0, basic: true, cd: 1.8, pick: (h, f) => nearestFoe(h, f, 160), cast: mudBall },
    { name: 'MEND', lvl: 1, tier: 1, free: true, cd: 5, wind: 0.25, pick: () => lowestHero(0.7), cast: mend },
    { name: 'THORN LASH', lvl: 2, tier: 1, cd: 4, wind: 0.2, pick: (h, f) => nearestFoe(h, f, 110), cast: thornLash },
    { name: 'REJUVENATE', lvl: 3, tier: 1, free: true, cd: 7, wind: 0.3, pick: () => lowestHero(0.85), cast: rejuvenate },
    { name: 'ENTANGLE', lvl: 4, tier: 1, cd: 7, wind: 0.3, pick: (h, f) => cluster(h, f, 30, 3, 150), cast: entangle },
    { name: 'STONE FIST', lvl: 5, tier: 2, cd: 6, wind: 0.4, pick: (h, f) => toughest(h, f, 160), cast: stoneFist },
    { name: 'INSECT SWARM', lvl: 7, tier: 2, cd: 9, wind: 0.4, pick: (h, f) => cluster(h, f, 24, 3, 170), cast: insectSwarm },
    { name: 'BOULDER ROLL', lvl: 8, tier: 2, cd: 10, wind: 0.5, pick: (h, f) => cluster(h, f, 30, 4, 200), cast: boulderRoll },
    { name: 'STONE SPIKES', lvl: 10, tier: 3, cd: 4, wind: 0.5, pick: (h, f) => nearestFoe(h, f, 150), cast: stoneSpikes },
    { name: 'MASS HEAL', lvl: 11, tier: 3, free: true, cd: 9, wind: 0.5, pick: () => G.heroes.filter(x => !x.dead && x.hp < x.maxHp * 0.7).length >= Math.min(2, G.heroes.filter(x => !x.dead).length) ? true : null, cast: massHeal },
    { name: 'RESURRECTION', lvl: 12, tier: 3, free: true, cd: 18, wind: 0.8, pick: () => G.heroes.find(x => x.dead && x.deadT > 2.5) || null, cast: resurrect },
    { name: 'EARTHQUAKE', lvl: 15, tier: 4, wind: 1, pick: () => true, cast: earthquake },
  ],
};
// ---------- the stage: one spell at a time ----------
function beginCast(h, sp, t) {
  h.state = { k: 'cast', t: 0, dur: sp.wind || 0.05, sp, tgt: t };
  if (!sp.free) { G.castLock = LOCK[sp.tier] + (sp.wind || 0); if (sp.tier >= 3) G.majorLock = (sp.tier === 4 ? 4.5 : 2.6) + (sp.wind || 0); }
  spellLabel(h, sp.name, sp.tier);
  if ((sp.wind || 0) > 0.1) circleFx(h.x, h.y, 7 + sp.tier * 3, h.def.col, sp.wind + 0.25);
  if (sp.tier >= 2) { G.focus = { x: h.x, y: h.y, t: (sp.wind || 0) + (sp.tier >= 3 ? 1.6 : 0.8), w: sp.tier >= 3 ? 0.45 : 0.25 }; SFX.charge(sp.tier, sp.wind || 0.3); }
}
function heroBrain(h, foes) {
  const book = SPELLBOOK[h.key];
  for (let i = book.length - 1; i >= 0; i--) {
    const sp = book[i]; if (!sp.tier || !sbOf(h).known.has(sp.name)) continue;
    if (sp.tier === 4) { if (!canUlt(h)) continue; } else if ((h.cd[sp.name] || 0) > 0) continue;
    if (!sp.free && (G.castLock > 0 || (sp.tier >= 3 && G.majorLock > 0))) continue;
    const t = sp.pick(h, foes); if (!t) continue;
    if (sp.tier === 4) startUlt(h, sp); else setCd(h, sp.name, sp.cd * md(sp.name).cd * rand(0.9, 1.2));
    beginCast(h, sp, t === true ? null : t); return true;
  }
  return false;
}
const DEFAULT_BASIC = { warrior: 'SLASH', pyro: 'EMBER BOLT', storm: 'SPARK', druid: 'PEBBLE' };
function basicOf(h) { const n = sbOf(h).basic[h.key] || DEFAULT_BASIC[h.key], sp = SPELLBOOK[h.key].find(s => s.name === n); return G.training && TRAIN.noBasic && sp ? (TRAIN.mute[n] || (TRAIN.mute[n] = { ...sp, cast: () => { } })) : sp; }
function heroAI(h, dt) {
  const I = h.ctrl === 'player' ? h.inp : null; // a player on AUTO MOVE or AUTOPILOT still sends spells and dodges
  if (h.dead) { h.deadT += dt; if (I) I.castQ.length = 0; return; }
  for (const k in h.cd) h.cd[k] -= dt;
  ultTick(h, dt);
  if (h.regen && (h.regen.t -= dt) > 0) { if ((h.regen.tick -= dt) <= 0) { h.regen.tick = 0.5; heal(h, h.regen.per); } localFx(() => regenFx(h, dt)); } else h.regen = null;
  if (h.z > 0 && G.phase !== 'fight') return;
  if (I && I.dashQ) { I.dashQ = false; if (canDash(h)) { h.state = null; const [dx, dy] = escapeDir(h, live(G.mons)); doDash(h, dx, dy); } else dashFail(h); }
  if (h.stun > 0) { h.stun -= dt; h.vx = damp(h.vx, 0, 8, dt); h.vy = damp(h.vy, 0, 8, dt); return; }
  if (h.state) { heroState(h, dt); return; }
  const foes = live(G.mons);
  if (I) { while (I.castQ.length && !h.state) tryCast(h, I.castQ.shift(), foes); if (h.state) return; }
  if (!foes.length || G.phase !== 'fight') { const i = G.heroes.indexOf(h), tx = (ARENA.pw / 2) + (i - 1.5) * 20, ty = ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.6 + (i % 2) * 10; steer(h, tx, ty, h.def.spd * 0.7, dt, 4); return; }
  if ((!I || I.mv === 2) && aiDodge(h, foes, dt)) return;
  if ((!I || I.sp) && heroBrain(h, foes)) return;
  const basic = basicOf(h);
  if (h.def.role === 'melee' && h.fleeT > 0) { h.fleeT -= dt; kite(h, foes, dt, 80); } // badly hurt and swarmed: back off a moment
  else if (h.def.skirm) {
    // hit and run: a close-range basic darts in, strikes and springs back out; a reaching basic keeps its distance
    const reach = (basic.reach || 14) * md(basic.name).size, ranged = reach > 40, n = nearest(h, foes);
    if (h.hitRun > 0) { h.hitRun -= dt; kite(h, foes, dt, 75); }
    else if (ranged) kite(h, foes, dt, reach * 0.8);
    else if (n) steer(h, n.x, n.y, h.def.spd, dt, h.r + n.r + 6);
    const t = nearest(h, foes, h.r + reach + 6);
    if (t && !(h.cd.slash > 0)) { h.cd.slash = basic.cd * md(basic.name).cd * (h.frenzyT > 0 ? 0.5 : 1); basic.cast(h, t); if (!ranged) h.hitRun = h.frenzyT > 0 ? 0.3 : 0.6; }
  }
  else if (h.def.role === 'melee') {
    const others = G.heroes.filter(x => x !== h && !x.dead), cx = others.length ? others.reduce((a, c) => a + c.x, 0) / others.length : h.x, cy = others.length ? others.reduce((a, c) => a + c.y, 0) / others.length : h.y;
    let t = nearest({ x: cx, y: cy }, foes, 70) || nearest(h, foes); if (G.boss && alive(G.boss) && G.boss.spawnT <= 0 && chance(0.02)) t = G.boss; if (h.target && alive(h.target) && dist(h.x, h.y, h.target.x, h.target.y) < 40) t = h.target; h.target = t;
    const d = steer(h, t.x, t.y, h.def.spd, dt, h.r + t.r + 8);
    if (d < h.r + t.r + (basic.reach || 14) && !(h.cd.slash > 0)) { h.cd.slash = basic.cd * md(basic.name).cd * (h.frenzyT > 0 ? 0.5 : 1); basic.cast(h, t); }
    if (h.moving && chance(dt * 6) && G.lvl >= 5) ghost(h, 'gold', 0.2);
  } else {
    kite(h, foes, dt, basic.range || (h.def.role === 'support' ? 85 : 100));
    if (!(h.cd.basic > 0)) { const t = basic.pick(h, foes); if (t) { h.cd.basic = basic.cd * md(basic.name).cd * (h.frenzyT > 0 ? 0.5 : 1); basic.cast(h, t); } }
  }
}
// spell states that heroState hands over to
function spellState(h, s, dt) {
  if (s.k === 'cast') {
    h.vx = damp(h.vx, 0, 10, dt); h.vy = damp(h.vy, 0, 10, dt); const u = s.t / s.dur, col = h.def.col;
    localFx(() => castFx(h, s.sp.tier, u, dt)); void col;
    if (s.t >= s.dur) { h.state = null; const foes = live(G.mons); let t = s.tgt; if (t && t.team && !alive(t) && s.sp.name !== 'RESURRECTION') t = s.sp.pick(h, foes); if (t && !t.team && t.x !== undefined && s.sp.tier < 4) { const re = s.sp.pick(h, foes); if (re && re !== true) t = re; } if (s.sp.tier > 0 && (t || s.tgt === null)) s.sp.cast(h, t || null); }
  } else if (s.k === 'channel') { s.fn(h, s, dt); if (s.t >= s.dur) h.state = null; }
  else if (s.k === 'hold') { h.vx = damp(h.vx, 0, 10, dt); h.vy = damp(h.vy, 0, 10, dt); if (s.t >= s.dur) h.state = null; }
  else if (s.k === 'dash') {
    const u = Math.min(1, s.t / s.dur), e = 1 - (1 - u) * (1 - u); h.x = lerp(s.x0, s.x1, e); h.y = lerp(s.y0, s.y1, e); h.vx = h.vy = 0;
    if ((s.gT -= dt) <= 0) { s.gT = 0.03; ghost(h, s.col, 0.28); } if (chance(0.4)) smoke(h.x, h.y, 1, 'dust', 6, 10, 0.6, 4);
    for (const m of G.mons) if (!s.hit.has(m) && !m.dead && m.spawnT <= 0 && dist(h.x, h.y, m.x, m.y) < s.r + m.r) { s.hit.add(m); s.onHit && s.onHit(m); }
    if (u >= 1) { h.state = null; s.onEnd && s.onEnd(); }
  } else if (s.k === 'cuts') {
    h.vx = h.vy = 0;
    while (s.i < s.list.length && s.t >= (s.i + 1) * s.step) {
      const m = s.list[s.i++]; if (!alive(m)) continue; ghost(h, 'gold', 0.5); const a = rand(TAU), L = 64;
      h.x = clamp(m.x - Math.cos(a) * 10, ARENA.x0 + 6, ARENA.x1 - 6); h.y = clamp(m.y - Math.sin(a) * 8, ARENA.y0 + 4, ARENA.y1 - 2); h.face = Math.cos(a) > 0 ? 1 : -1;
      FX.beams.push({ x0: m.x - Math.cos(a) * L, y0: m.y - 6 - Math.sin(a) * L * 0.75, x1: m.x + Math.cos(a) * L, y1: m.y - 6 + Math.sin(a) * L * 0.75, w: 1.1, col: 'gold', t: 0, life: 0.4 });
      sparks(m.x, m.y, 8, 10, 'gold', 220, 120, a, 1.4); m.stun = Math.max(m.stun, 2.5); m.flash = 0.25; s.marked.push(m); flashLight(m.x, m.y, 50, 'gold', 1, 0.2); SFX.slash(panOf(m.x));
    }
    if (s.i >= s.list.length && s.t > s.list.length * s.step + 0.45) {
      h.state = null; flash('white', 0.45); shake(0.7); kick(0.08); hitstop(0.1); SFX.boom(1.2, panOf(h.x)); ring(h.x, h.y, 90, 'gold', 0.5, 5);
      for (const m of s.marked) if (alive(m)) { arcFx(m.x, m.y - 6, rand(TAU), 3.5, 18, 'gold', 0.3, 4); hurt(m, D(h) * 4.2 * (s.dm || 1), h, { elem: 'phys', crit: true, up: 160, kx: rand(-120, 120), ky: rand(-80, 80) }); }
    }
  }
}
// ---------- persistent spell hazards ----------
function updateHazards(dt) {
  for (const z of FX.hz) {
    z.t += dt; z.tick -= dt; const tick = z.tick <= 0; if (tick) z.tick = z.rate || 0.25; localFx(() => hazFx(z, dt));
    if (z.k === 'flame') { if (tick) for (const m of within(z.x, z.y, z.r, G.mons)) { hurt(m, z.dmg, z.src, { elem: 'fire', quiet: true }); m.burn = Math.max(m.burn, 1.2); } }
    else if (z.k === 'lava') { if (tick) for (const m of within(z.x, z.y, z.r, G.mons)) { hurt(m, z.dmg, z.src, { elem: 'fire', quiet: true }); m.slow = 0.4; m.burn = Math.max(m.burn, 1); } }
    else if (z.k === 'coil') { if (tick) { const t = nearest(z, G.mons, z.r); if (t) { bolt(z.x, z.y - 14, t.x, t.y - 6 * t.scale, { life: 0.16, w: 0.8, branches: 1 }); zapHit(t, z.src, z.dmg, { stun: 0.25 }); } } if (z.t > z.life - 0.05 && !z.boom) { z.boom = true; ring(z.x, z.y, 40, 'bolt', 0.3, 4); sparks(z.x, z.y, 12, 16, 'bolt', 160, 160); } }
    else if (z.k === 'arc') { if (tick) for (const m of within(z.x, z.y, z.r, G.mons)) { hurt(m, z.dmg, z.src, { elem: 'bolt', quiet: true, stun: 0.15 }); m.slow = 0.3; } }
    else if (z.k === 'swarm') { if (!alive(z.tgt)) z.tgt = nearest(z, G.mons, 120); if (z.tgt) { z.x = damp(z.x, z.tgt.x, 3, dt); z.y = damp(z.y, z.tgt.y, 3, dt); } if (tick) for (const m of within(z.x, z.y, z.r, G.mons)) hurt(m, z.dmg, z.src, { elem: 'poison', quiet: true }); }
    else if (z.k === 'roots') { if (!alive(z.m)) z.dead = true; else { z.x = z.m.x; z.y = z.m.y; z.m.vx = z.m.vy = 0; } }
    else if (z.k === 'fist') { if (!z.hitDone && z.t > 0.08) { z.hitDone = true; for (const m of within(z.x, z.y, z.r, G.mons)) hurt(m, z.dmg, z.src, { elem: 'earth', up: 300, stun: 1, crit: true }); hitProps(z.x, z.y, 12); } }
    else if (z.k === 'boulder' || z.k === 'wave') {
      z.x += z.vx * dt; z.y += z.vy * dt; z.rot = (z.rot || 0) + dt * 12;
      for (const m of G.mons) { if (m.dead || m.spawnT > 0 || z.hit.has(m) || dist(z.x, z.y, m.x, m.y) > z.r + m.r) continue; z.hit.add(m); const side = ((m.x - z.x) * -Math.sin(z.a) + (m.y - z.y) * Math.cos(z.a)) > 0 ? 1 : -1; hurt(m, z.dmg, z.src, { elem: z.k === 'boulder' ? 'earth' : 'phys', kx: -Math.sin(z.a) * side * 220 + z.vx * 0.4, ky: Math.cos(z.a) * side * 180 + z.vy * 0.4, up: z.k === 'boulder' ? 180 : 60, stun: 0.6 }); if (z.k === 'boulder') { debris(m.x, m.y, 5, ['#5a5048', '#7d7064'], 90, 120, 1.6); shake(0.06); } else sparks(m.x, m.y, 8, 8, 'gold', 180, 80, z.a, 1); }
      if (!inArena(z.x, z.y) || nearestSolid(z.x, z.y, z.r * 0.6)) { z.dead = true; if (z.k === 'boulder') { debris(z.x, z.y, 26, ['#5a5048', '#7d7064', '#3c342e'], 160, 220, 2.2); smoke(z.x, z.y, 6, 'dust', 12, 50, 1.4); ring(z.x, z.y, 40, 'earth', 0.35, 4); shake(0.3); SFX.boom(0.7, panOf(z.x)); hitProps(z.x, z.y, 16); } else sparks(z.x, z.y, 8, 14, 'gold', 180, 120); }
    }
  }
  for (const z of FX.hz) { const f = HAZSIM[z.k]; if (f && !z.dead) f(z, dt, z.tick === (z.rate || 0.25)); } // the newer zones
  removeIf(FX.hz, z => z.dead || z.t >= z.life);
}
function drawHazardsWorld(c) { // normal blend, lit
  for (const z of FX.hz) {
    if (z.k === 'coil') { c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(z.x, z.y, 5, 2, 0, 0, TAU); c.fill(); c.fillStyle = '#3a3f4a'; c.fillRect(z.x - 1.5, z.y - 14, 3, 14); c.fillStyle = '#7a8aa0'; c.fillRect(z.x - 3, z.y - 4, 6, 2); c.fillRect(z.x - 2.5, z.y - 9, 5, 1.5); }
    else if (z.k === 'boulder') { c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(z.x, z.y + 2, 10, 4, 0, 0, TAU); c.fill(); c.save(); c.translate(z.x, z.y - 8 * (z.sz || 1)); c.rotate(z.rot); c.scale(1.2 * (z.sz || 1), 1.2 * (z.sz || 1)); c.drawImage(ROCKS[1], -10, -10); c.restore(); }
    else if (z.k === 'fist') { const u = z.t / z.life, S = z.sz || 1, h = (u < 0.15 ? u / 0.15 : u > 0.7 ? (1 - u) / 0.3 : 1) * 22 * S; c.save(); c.beginPath(); c.rect(z.x - 16 * S, z.y - 40 * S, 32 * S, 40 * S); c.clip(); c.drawImage(ROCKS[2], z.x - 12 * S, z.y - h - 6 * S, 24 * S, 24 * S); c.fillStyle = '#4a423c'; c.fillRect(z.x - 6, z.y - h + 12, 12, Math.max(0, h - 10)); c.restore(); }
    else if (z.k === 'roots') { const s = z.seed; c.strokeStyle = '#2a5a20'; c.lineWidth = 1.3; for (let i = 0; i < 5; i++) { const a = s + i * 1.3, r = 6 + (i % 2) * 2, up = 8 + Math.sin(G.time * 4 + i) * 2; c.beginPath(); c.moveTo(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r * 0.5); c.quadraticCurveTo(z.x + Math.cos(a) * r * 0.4, z.y - up, z.x + Math.cos(a + 1) * 3, z.y - up * 0.6); c.stroke(); } c.strokeStyle = '#6a4a2a'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(z.x, z.y - 4, 6, 3, 0, 0, TAU); c.stroke(); }
    else if (z.k === 'swarm') { c.fillStyle = '#1e2a14'; for (const d of z.dots) { const a = d[0] + G.time * d[2] * 0.5; c.fillRect(z.x + Math.cos(a) * d[1] - 0.6, z.y - 8 + Math.sin(a * 1.3) * d[1] * 0.6 - 0.6, 1.3, 1.3); } }
    else if (HAZDRAW.world[z.k]) HAZDRAW.world[z.k](c, z);
  }
}
function drawHazardsFx(c) { // additive glow
  for (const z of FX.hz) {
    const live2 = 1 - z.t / z.life;
    if (z.k === 'lava') { const s = z.r * (1 + 0.08 * Math.sin(G.time * 5 + z.x)), a = Math.min(1, live2 * 3); c.globalAlpha = 0.8 * a; c.drawImage(GLOW.magma, z.x - s * 1.4, z.y - s, s * 2.8, s * 2); c.globalAlpha = 0.5 * a; c.drawImage(GLOW.fire2, z.x - s * 0.7, z.y - s * 0.45, s * 1.4, s * 0.9); }
    else if (z.k === 'coil') { const s = 7 + Math.sin(G.time * 30) * 1.5; c.globalAlpha = 1; c.drawImage(GLOW.bolt, z.x - s, z.y - 14 - s, s * 2, s * 2); c.drawImage(GLOW.white, z.x - 2, z.y - 16, 4, 4); }
    else if (z.k === 'arc') { c.globalAlpha = 0.55 * live2 + 0.2; c.strokeStyle = rgba('bolt', 0.7); c.lineWidth = 1.2; c.beginPath(); c.ellipse(z.x, z.y, z.r, z.r * 0.72, 0, 0, TAU); c.stroke(); c.globalAlpha = 0.25; c.drawImage(GLOW.bolt, z.x - z.r, z.y - z.r * 0.72, z.r * 2, z.r * 1.44); }
    else if (z.k === 'wave') { c.globalAlpha = Math.min(1, live2 * 2); c.lineCap = 'round'; for (const [w, col] of [[6, rgba('gold', 0.35)], [2.2, rgba('fire2', 0.9)], [0.9, 'rgba(255,255,255,1)']]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.ellipse(z.x, z.y - 6, 13 * (z.sz || 1), 10 * (z.sz || 1), 0, z.a - 1.3, z.a + 1.3); c.stroke(); } }
    else if (z.k === 'swarm') { c.globalAlpha = 0.35; c.drawImage(GLOW.poison, z.x - 14, z.y - 18, 28, 20); }
    else if (HAZDRAW.fx[z.k]) HAZDRAW.fx[z.k](c, z);
  }
  c.globalAlpha = 1;
}
const TINT = {};
function tinted(col) { if (TINT[col]) return TINT[col]; const s = IMG.mobsW, cv = mkCanvas(s.width, s.height), x = cv.getContext('2d'); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = rgba(col, 1); x.fillRect(0, 0, cv.width, cv.height); return (TINT[col] = cv); }
function drawGhosts(c) { for (const g of FX.ghosts) { const m = MOBS[g.spr]; if (!m) continue; const foot = footOf(g.spr), u = g.t / g.life; c.globalAlpha = 0.6 * (1 - u); c.save(); c.translate(g.x, g.y - g.z); c.scale(g.sc * (g.face < 0 ? -1 : 1), g.sc); c.drawImage(tinted(g.col), g.fr * m[1], m[0], m[1], m[2], -m[1] / 2, -foot - 1, m[1], m[2]); c.restore(); } c.globalAlpha = 1; }
