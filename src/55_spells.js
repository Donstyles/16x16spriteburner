// ===================== spells, projectiles and the big set pieces =====================
function after(t, fn) { G.sched.push({ t, fn, h: MDH }); }
function proj(o) { const p = { x: 0, y: 0, z: 9, vx: 0, vy: 0, vz: 0, t: 0, life: 3, r: 3, dmg: 10, team: 'hero', k: 'fireball', src: null, col: 'fire', trail: 0 }; for (const k in o) p[k] = o[k]; G.proj.push(p); return p; }
function breakProp(p) {
  if (p.dead || p.hp > 1e8) return; p.dead = true; p.solid = false;
  debris(p.x, p.cy, 18, ['#6a4a2a', '#8a6638', '#4a3018', '#a07848'], 140, 180, 2.2); smoke(p.x, p.cy, 4, 'dust', 9, 30, 1.2); SFX.pop(panOf(p.x));
  if (p.kind === 'chest') { sparks(p.x, p.cy, 6, 24, 'gold', 140, 160); glows(p.x, p.cy, 6, 10, 'gold', 60, 4, 1); textPop(p.x, p.cy, 14, '+GOLD', 'gold', false); }
}
function hitProps(x, y, R) { for (const p of ARENA.props) if (!p.dead && p.hp < 1e8 && dist(x, y, p.x, p.cy) < R + p.r) breakProp(p); }
// ---------- FIRE ----------
function explode(x, y, R, dmg, src, o = {}) {
  const big = R / 26, team = src ? src.team : 'hero', foes = team === 'hero' ? G.mons : G.heroes;
  for (const u of within(x, y, R, foes)) { const d = dist(x, y, u.x, u.y), f = 1 - 0.45 * Math.min(1, d / R), a = angTo(x, y, u.x, u.y); hurt(u, dmg * f, src, { elem: o.elem || 'fire', kx: Math.cos(a) * 230 * big, ky: Math.sin(a) * 170 * big, up: 150 * big, crit: chance(0.15) }); if (o.burn && !u.dead) { u.burn = 2.5; u.burnDmg = dmg * 0.15; u.immo = src; } }
  hitProps(x, y, R);
  if (o.fx === 'pop') { emberPop(x, y, R); return; } // a basic ember: a small burst, no shake, no pause, no flash
  part({ k: 'glow', x, y, z: 6, life: 0.14, s0: R * 1.1, s1: R * 1.6, col: 'hot', a0: 0.9, a1: 0 });
  glows(x, y, 8, 18 * big, 'fire', 150 * big, 9 * big, 0.75, 1); glows(x, y, 8, 8 * big, 'fire2', 90 * big, 7 * big, 0.45, 0); glows(x, y, 10, 10 * big, 'ember', 200 * big, 6 * big, 0.9, 0);
  sparks(x, y, 6, 46 * big, 'fire', 260 * big, 240 * big); embers(x, y, 20 * big, 'ember', 80 * big);
  smoke(x, y, 7 * big, 'dark', 16 * big, 46 * big, 2.4, 18); debris(x, y, 12 * big, ['#5a5048', '#7d7064', '#3c342e', '#241c18'], 170 * big, 240 * big, 2);
  ring(x, y, R * 2.3, 'fire2', 0.4, 6); ring(x, y, R * 1.2, 'white', 0.2, 3);
  flashLight(x, y, R * 5, 'fire', 1.6, 0.5); flashLight(x, y, R * 1.8, 'hot', 1, 0.12);
  scorch(x, y, R * 0.95, 0.75); if (big >= 0.95 && o.fx !== 'light') cracks(x, y, randi(4, 7), R * 1.4, 320, 1.8);
  if (o.fx === 'light') { shake(0.1 * big); SFX.boom(big * 0.7, panOf(x)); return; } // a basic attack's blast: no pause, no flash
  shake(0.32 * big); hitstop(0.04 * big); kick(0.05 * big); flash('fire', 0.1 * big); SFX.boom(big, panOf(x)); buzz(Math.round(30 * big));
}
function emberPop(x, y, R) { part({ k: 'glow', x, y, z: 6, life: 0.12, s0: R * 0.7, s1: R, col: 'hot', a0: 0.8, a1: 0 }); glows(x, y, 6, 5, 'fire', 60, 4, 0.35, 1); sparks(x, y, 6, 8, 'fire', 120, 100); ring(x, y, R * 0.9, 'fire2', 0.18, 2); flashLight(x, y, R * 2.2, 'fire', 0.9, 0.12); scorch(x, y, R * 0.45, 0.4); SFX.fire(panOf(x)); }
function castFireball(h, tx, ty, big = 1, dm = 1.5, o = {}) {
  const a = angTo(h.x, h.y, tx, ty), s = o.speed || 200; h.lunge = 0.2; h.la = a;
  proj({ k: 'fireball', x: h.x + Math.cos(a) * 6, y: h.y + Math.sin(a) * 3, z: 11, vx: Math.cos(a) * s, vy: Math.sin(a) * s, team: 'hero', src: h, dmg: h.def.dmg * h.mul * dm, R: 26 * big, big, tx, ty, life: 2.2, r: 4 * big, burn: o.burn, cluster: o.cluster, fx: o.fx });
  glows(h.x + Math.cos(a) * 8, h.y, 11, 8, 'fire', 60, 5, 0.3); SFX.fire(panOf(h.x));
}
function flameNova(h) { const m = md('FLAME NOVA'); for (let k = 0; k <= m.count; k++) after(k * 0.42, () => { if (alive(h)) novaPulse(h, m); }); }
function novaPulse(h, m) {
  const S = m.size; h.lunge = 0.3; novaFx(h.x, h.y, S);
  for (const u of within(h.x, h.y, 50 * S, G.mons)) { const a = angTo(h.x, h.y, u.x, u.y); hurt(u, h.def.dmg * h.mul * 1.6 * m.dmg, h, { elem: 'fire', kx: Math.cos(a) * 260, ky: Math.sin(a) * 200, up: 120 }); }
  flashLight(h.x, h.y, 150, 'fire', 1.6, 0.4); shake(0.3); hitstop(0.04); SFX.boom(0.8, panOf(h.x)); scorch(h.x, h.y, 26, 0.5);
}
function meteorStorm(h) {
  banner('METEOR STORM', h); SFX.braam(); slowmo(0.5, 0.4); G.ambDark = Math.max(G.ambDark, 0.35);
  const m = md('METEOR STORM'), n = PWR.meteors() + m.count;
  for (let i = 0; i < n; i++) after(0.25 + i * Math.max(0.16, 0.26 - m.count * 0.015), () => {
    const last = i === n - 1, d = last ? densest(G.mons, 40) : null, t = d || (G.mons.length ? pick(G.mons) : null);
    const tx = t ? t.x + rand(-14, 14) : rand(ARENA.x0, ARENA.x1), ty = t ? t.y + rand(-10, 10) : rand(ARENA.y0, ARENA.y1), H = 300, T = 0.9;
    proj({ k: 'meteor', x: tx + 130, y: ty, z: H, vx: -130 / T, vy: 0, vz: -H / T, team: 'hero', src: h, dmg: h.def.dmg * h.mul * (last ? 4 : 2.4) * m.dmg, R: (last ? 58 : 36) * m.size, tx, ty, life: 3, big: (last ? 2.3 : 1.4) * m.size, last, lava: m.f.lava });
    SFX.whoosh(panOf(tx));
  });
}
// ---------- LIGHTNING ----------
function zapHit(u, src, dmg, o = {}) {
  if (!alive(u) || u.spawnT > 0) return; hurt(u, dmg, src, { elem: 'bolt', stun: o.stun || 0.35, kx: rand(-50, 50), ky: rand(-40, 40), crit: chance(0.2), up: o.up || 0 });
  sparks(u.x, u.y, 8 * u.scale, 12, 'bolt', 170, 140); flashLight(u.x, u.y, 80, 'bolt', 1.4, 0.18); G.ambFlash = Math.min(0.35, G.ambFlash + 0.08); shake(0.08); SFX.zap(panOf(u.x));
}
function chainLightning(h, first, nJumps, dmMul) {
  const cm = md('CHAIN LIGHTNING'), hit = new Set(); let from = { x: h.x + h.face * 4, y: h.y - 12 }, tgt = first, delay = 0; const jumps = nJumps || PWR.chain() + cm.count, weak = !!nJumps && nJumps <= 2, mul = dmMul || cm.dmg;
  h.lunge = 0.25; h.la = angTo(h.x, h.y, first.x, first.y);
  for (let i = 0; i < jumps && tgt; i++) {
    const a = from, b = tgt, dm = h.def.dmg * h.mul * (1.25 - Math.min(0.6, i * 0.07)) * mul; hit.add(b);
    after(delay, () => { if (!alive(b)) return; bolt(a.x, a.y, b.x, b.y - 7 * b.scale, { life: weak ? 0.2 : 0.32, w: weak ? 0.6 : 1.15, branches: weak ? 0 : 2 }); zapHit(b, h, dm); });
    from = { x: b.x, y: b.y - 7 * b.scale }; delay += 0.065;
    let best = null, bd = 85; for (const m of G.mons) { if (hit.has(m) || m.dead || m.spawnT > 0) continue; const d = dist(b.x, b.y, m.x, m.y); if (d < bd) { bd = d; best = m; } } tgt = best;
  }
  flashLight(h.x, h.y - 10, 70, 'bolt', 1.2, 0.2);
}
function ballLightning(h, t) { const m = md('BALL LIGHTNING'); for (let k = 0; k <= m.count; k++) { const a = angTo(h.x, h.y, t.x, t.y) + (k - m.count / 2) * 0.7; proj({ k: 'ball', x: h.x, y: h.y, z: 12, vx: Math.cos(a) * 46, vy: Math.sin(a) * 46, team: 'hero', src: h, dmg: h.def.dmg * h.mul * 0.45 * m.dmg, life: 3.4 * m.dur, r: 5, zapT: 0, target: k ? null : t, DR: 46 * m.size }); } SFX.zap(panOf(h.x)); }
function skyStrike(x, y, src, p = 1) {
  const top = y - 280; bolt(x + rand(-50, 50), top, x, y, { life: 0.38, w: 2.3 * p, branches: 5, jag: 1.25 }); bolt(x + rand(-30, 30), top, x + rand(-4, 4), y, { life: 0.25, w: 1.2 * p, branches: 2 });
  flash('bolt2', 0.16 * p); G.ambFlash = Math.max(G.ambFlash, 0.45 * Math.min(1.4, p)); flashLight(x, y, 120 * p, 'bolt2', 1.5, 0.35);
  for (const u of within(x, y, 26 * p, G.mons)) { const a = angTo(x, y, u.x, u.y); hurt(u, src.def.dmg * src.mul * 1.7 * p, src, { elem: 'bolt', stun: 0.7, up: 140 * p, kx: Math.cos(a) * 150, ky: Math.sin(a) * 120, crit: chance(0.25) }); }
  hitProps(x, y, 20 * p);
  sparks(x, y, 4, 50 * p, 'bolt', 280, 260); glows(x, y, 6, 14, 'bolt', 130, 8 * p, 0.5); ring(x, y, 54 * p, 'bolt', 0.42, 6); ring(x, y, 26 * p, 'white', 0.22, 4);
  scorch(x, y, 18 * p, 0.8); cracks(x, y, 5, 32 * p, 520, 1.1, 'bolt'); debris(x, y, 10 * p, ['#5a5048', '#7d7064', '#3c342e'], 150, 200, 1.8); smoke(x, y, 2, 'dark', 10, 24, 1.2);
  shake(0.42 * p); hitstop(0.05 * p); kick(0.05 * p); SFX.thunder(panOf(x), Math.min(1.3, p)); buzz(Math.round(50 * p));
}
function thunderstorm(h) { banner('THUNDERSTORM', h); SFX.braam(); const m = md('THUNDERSTORM'); G.storm = { t: 0, dur: PWR.storm() * m.dur, next: 0.45, src: h, fin: false, rate: 1 / (1 + 0.6 * m.count), p: m.size * m.dmg }; G.ambDark = Math.max(G.ambDark, 0.75); slowmo(0.55, 0.35); }
function updateStorm(dt) {
  const s = G.storm; if (!s) return; s.t += dt; G.ambDark = Math.max(G.ambDark, 0.7);
  if (s.t >= s.next && s.t < s.dur - 0.4) { s.next += rand(0.17, 0.3) * s.rate; const t = G.mons.length && chance(0.8) ? pick(G.mons) : null; skyStrike(t ? t.x + rand(-6, 6) : rand(ARENA.x0, ARENA.x1), t ? t.y + rand(-4, 4) : rand(ARENA.y0, ARENA.y1), s.src, rand(0.8, 1.1) * s.p); }
  if (!s.fin && s.t >= s.dur - 0.35) { s.fin = true; const d = densest(G.mons, 40) || { x: CAM.x, y: CAM.y }; slowmo(0.25, 0.45); skyStrike(d.x, d.y, s.src, 2.1); hitstop(0.1); flash('white', 0.6); }
  if (s.t >= s.dur) G.storm = null;
}
// ---------- EARTH ----------
function stoneSpikes(h, t) {
  const a0 = angTo(h.x, h.y, t.x, t.y), m = md('STONE SPIKES'); h.lunge = 0.25; h.la = a0; SFX.whoosh(panOf(h.x));
  const n = PWR.spikes() + m.count, small = false;
  for (const a of m.f.fan ? [a0 - 0.5, a0, a0 + 0.5] : [a0]) for (let i = 0; i < n; i++) after(i * 0.05, () => {
    const x = h.x + Math.cos(a) * (14 + i * 11), y = h.y + Math.sin(a) * (14 + i * 11) * 0.85; if (!inArena(x, y)) return;
    part({ k: 'spike', x, y, life: 0.7, s0: small ? rand(3, 5) : rand(6, 9) + Math.min(4, (G.lvl - 3) * 0.3) });
    debris(x, y, 5, ['#6b625a', '#8a8076', '#4a423c'], 70, 160, 1.6); smoke(x, y, 1, 'dust', 8, 14, 0.8);
    for (const u of within(x, y, 11, G.mons)) hurt(u, h.def.dmg * h.mul * 0.9 * m.dmg, h, { elem: 'earth', up: 190, stun: 0.5, kx: Math.cos(a) * 60, ky: Math.sin(a) * 50 });
    shake(0.05); SFX.hit(panOf(x));
  });
}
function slamFx(x, y, p, col = 'earth') {
  ring(x, y, 70 * p, col, 0.5, 7); ring(x, y, 40 * p, 'white', 0.3, 4); ring(x, y, 100 * p, 'fire2', 0.7, 3, 20);
  cracks(x, y, randi(7, 10), 60 * p, 380, 2.4); debris(x, y, 34 * p, ['#5a5048', '#7d7064', '#3c342e', '#9a8c7c'], 210 * p, 300 * p, 2.4);
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; part({ k: 'smoke', x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 7, z: 2, vx: Math.cos(a) * 120 * p, vy: Math.sin(a) * 90 * p, vz: 6, drag: 2.4, life: 1.6, s0: 6, s1: 15 * p, col: 'dust', a0: 0.8, a1: 0 }); }
  sparks(x, y, 3, 30 * p, 'fire', 220, 200); flashLight(x, y, 130 * p, 'earth', 1.6, 0.45); scorch(x, y, 22 * p, 0.6);
  shake(0.75 * p); quake(0.9 * p, 0.9); hitstop(0.08 * p); kick(0.1 * p); flash('earth', 0.2); SFX.boom(1.3 * p, panOf(x)); SFX.quake(1); buzz([70, 30, 50]);
}
function earthquake(h) { const m = md('EARTHQUAKE'), D = PWR.quake() * m.dur; banner('EARTHQUAKE', h, null, 'earth'); SFX.braam(); SFX.quake(D); quake(D, 1.25); G.eq = { t: 0, dur: D, src: h, rockT: 0.3, crackT: 0, tickT: 0.4, dm: m.dmg, rr: 1 / (1 + 0.8 * m.count) }; buzz([200, 80, 200, 80, 300, 80, 400]); }
function updateQuake(dt) {
  const e = G.eq; if (!e) return; e.t += dt; e.rockT -= dt; e.crackT -= dt; e.tickT -= dt; G.ambDark = Math.max(G.ambDark, 0.3);
  if (e.rockT <= 0 && e.t < e.dur - 0.3) { e.rockT = rand(0.08, 0.16) * e.rr; const t = G.mons.length && chance(0.75) ? pick(G.mons) : null, x = t ? t.x + rand(-10, 10) : rand(ARENA.x0, ARENA.x1), y = t ? t.y + rand(-8, 8) : rand(ARENA.y0, ARENA.y1), H = rand(200, 280); proj({ k: 'boulder', x, y, z: H, vz: -H / 0.75, team: 'hero', src: e.src, dmg: e.src.def.dmg * e.src.mul * 1.4 * e.dm, R: 16, life: 2, rk: randi(0, 5), sz: rand(0.8, 1.4) }); }
  if (e.crackT <= 0) { e.crackT = rand(0.2, 0.35); const t = G.mons.length ? pick(G.mons) : null; cracks(t ? t.x : rand(ARENA.x0, ARENA.x1), t ? t.y : rand(ARENA.y0, ARENA.y1), randi(3, 6), rand(30, 60), 400, 2.6); }
  if (e.tickT <= 0) { e.tickT = 0.55; for (const m of G.mons) if (m.spawnT <= 0) hurt(m, e.src.def.dmg * e.src.mul * 0.55 * e.dm, e.src, { elem: 'earth', up: rand(80, 200), stun: 0.5, kx: rand(-60, 60), ky: rand(-40, 40), quiet: true }); for (let i = 0; i < 6; i++) smoke(rand(ARENA.x0, ARENA.x1), rand(ARENA.y0, ARENA.y1), 1, 'dust', 14, 20, 1.5, 6); }
  if (e.t >= e.dur) { const d = densest(G.mons, 50) || { x: CAM.x, y: CAM.y }; slamFx(d.x, d.y, 1.6); for (const u of within(d.x, d.y, 70, G.mons)) hurt(u, e.src.def.dmg * e.src.mul * 2.5, e.src, { elem: 'earth', up: 260, stun: 1 }); slowmo(0.3, 0.5); flash('white', 0.5); G.eq = null; }
}
// ---------- STEEL ----------
function slash(h, t) {
  const a = angTo(h.x, h.y, t.x, t.y); h.lunge = 0.3; h.la = a; h.face = Math.cos(a) < 0 ? -1 : 1; h.combo = (h.combo || 0) + 1;
  const sm = md('SLASH'), fin = sm.f.crush && h.combo % 4 === 0; arcFx(h.x, h.y - 6, a, fin ? 3.4 : 2.2, fin ? 26 : 20, 'gold', 0.2, fin ? 5 : 3.5); SFX.slash(panOf(h.x));
  let any = false;
  for (const u of within(h.x, h.y, fin ? 30 : 24, G.mons)) { let da = Math.abs(((angTo(h.x, h.y, u.x, u.y) - a) % TAU + TAU + Math.PI) % TAU - Math.PI); if (da > (fin ? 1.8 : 1.25)) continue; any = true; hurt(u, h.def.dmg * h.mul * (fin ? 1.9 : 1) * sm.dmg, h, { elem: 'phys', kx: Math.cos(a) * (fin ? 260 : 110), ky: Math.sin(a) * (fin ? 200 : 80), up: fin ? 120 : 0, crit: fin || chance(0.18), stun: 0.15 }); sparks(u.x, u.y, 8, fin ? 16 : 7, 'gold', 180, 100, a, 1.6); }
  if (any) { hitstop(fin ? 0.07 : 0.025); shake(fin ? 0.2 : 0.06); if (fin) kick(0.04); flashLight(h.x, h.y, 50, 'gold', 1, 0.12); }
  if (fin && sm.f.shock) { const x = h.x + Math.cos(a) * 22, y = h.y + Math.sin(a) * 16; ring(x, y, 40, 'gold', 0.35, 4); cracks(x, y, 4, 30, 400, 1.2); debris(x, y, 10, ['#5a5048', '#7d7064'], 120, 160, 1.8); for (const u of within(x, y, 32, G.mons)) hurt(u, h.def.dmg * h.mul * 1.2, h, { elem: 'earth', up: 150, stun: 0.5 }); shake(0.25); SFX.boom(0.6, panOf(x)); }
}
function whirlwind(h) { const m = md('WHIRLWIND'); h.state = { k: 'whirl', t: 0, dur: 1.15 * m.dur, tick: 0, R: 30 * m.size, dm: m.dmg, pull: m.f.pull }; SFX.whoosh(panOf(h.x)); }
function cataclysm(h) {
  const d = densest(G.mons, 50, h, 200) || nearest(h, G.mons); if (!d) return; const m = md('CATACLYSM'), again = h.catAgain === undefined ? m.count : h.catAgain; if (h.catAgain === undefined) { banner('CATACLYSM', h); SFX.braam(); }
  h.state = { k: 'leap', t: 0, dur: 0.62, x0: h.x, y0: h.y, x1: d.x, y1: d.y, P: PWR.slam() * m.size, dm: m.dmg, lava: m.f.lava, again }; slowmo(0.6, 0.3); SFX.whoosh(panOf(h.x));
}
// ---------- MONSTERS AND BOSSES ----------
function monShot(m, t) {
  const k = m.def.shot, a = angTo(m.x, m.y, t.x, t.y), s = k === 'arrow' || k === 'stone' ? 175 : 115, col = { arcane: 'arcane', poison: 'poison', fire: 'fire', zap: 'bolt' }[k] || 'white';
  m.lunge = 0.2; m.la = a;
  if (k === 'zap') { bolt(m.x, m.y - 8, t.x, t.y - 6, { life: 0.22, w: 0.8, col: 'arcane', branches: 1 }); hurt(t, m.def.dmg * m.mul, m, { elem: 'bolt' }); sparks(t.x, t.y, 8, 8, 'arcane', 120, 80); flashLight(t.x, t.y, 50, 'arcane', 1, 0.15); SFX.zap(panOf(t.x)); return; }
  proj({ k: 'mshot', shot: k, x: m.x, y: m.y, z: 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s, team: 'mon', src: m, dmg: m.def.dmg * m.mul, col, life: 2.4, r: 3, home: k !== 'arrow' && k !== 'stone' ? t : null });
}
function heavySlam(m) { const R = 26 * m.scale; ring(m.x, m.y, R * 1.6, 'earth', 0.35, 4); cracks(m.x, m.y, 4, R, 300, 1.2); debris(m.x, m.y, 10, ['#5a5048', '#7d7064'], 120, 150, 1.8); smoke(m.x, m.y, 5, 'dust', 10, 40, 1.2); for (const u of within(m.x, m.y, R, G.heroes)) { const a = angTo(m.x, m.y, u.x, u.y); hurt(u, m.def.dmg * m.mul * 1.3, m, { kx: Math.cos(a) * 180, ky: Math.sin(a) * 140, up: 90 }); } shake(0.18); SFX.boom(0.5, panOf(m.x)); }
function bossMove(b, mv, t) {
  const c = b.def.col || 'red';
  if (mv === 'slam') { const x = t.x, y = t.y; teleg(x, y, 46, 0.95); after(0.45, () => { if (alive(b)) b.state = { k: 'leap', t: 0, dur: 0.5, x0: b.x, y0: b.y, x1: x, y1: y }; }); }
  else if (mv === 'charge') { const a = angTo(b.x, b.y, t.x, t.y); for (let i = 1; i < 9; i++) teleg(b.x + Math.cos(a) * i * 22, b.y + Math.sin(a) * i * 16, 14, 0.6); b.state = { k: 'windup', t: 0, dur: 0.6, next: { k: 'charge', t: 0, dur: 0.85, a } }; SFX.summon(panOf(b.x)); }
  else if (mv === 'volley') { for (let w = 0; w < 3; w++) after(w * 0.35, () => { if (!alive(b)) return; const n = 16, off = rand(TAU); for (let i = 0; i < n; i++) { const a = off + i / n * TAU; proj({ k: 'mshot', shot: 'orb', x: b.x, y: b.y - 6, z: 10, vx: Math.cos(a) * 105, vy: Math.sin(a) * 85, team: 'mon', src: b, dmg: 16 * b.mul, col: c, life: 3, r: 4 }); } ring(b.x, b.y, 50, c, 0.3, 4); flashLight(b.x, b.y, 110, c, 1.3, 0.25); SFX.fire(panOf(b.x)); }); }
  else if (mv === 'summon') { ring(b.x, b.y, 80, c, 0.5, 5); shake(0.3); SFX.summon(0); const pool = Object.values(MON_DEFS).filter(d => d.tier <= Math.min(3, 1 + (G.floor >> 2))); for (let i = 0; i < 4; i++) { const r = pick(ARENA.runes); summonMon(pick(pool), r.x + rand(-8, 8), r.y + rand(-6, 6), i * 0.15); } }
  else if (mv === 'beam') { const a = angTo(b.x, b.y, t.x, t.y), dir = chance(0.5) ? 1 : -1; b.state = { k: 'beam', t: 0, dur: 2.0, a0: a - 1.0 * dir, a1: a + 1.0 * dir, tick: 0 }; G.ambDark = Math.max(G.ambDark, 0.4); SFX.braam(); }
}
function bossDeath(b) {
  slowmo(0.2, 1.8); G.ambDark = Math.max(G.ambDark, 0.5); banner('VANQUISHED', null, b.def.name);
  for (let i = 0; i < 9; i++) after(i * 0.13, () => { const x = b.x + rand(-18, 18) * b.scale / 3, y = b.y + rand(-10, 6); part({ k: 'glow', x, y, z: rand(10, 40), life: 0.25, s0: 18, s1: 36, col: 'hot' }); glows(x, y, 20, 10, b.def.col || 'fire', 120, 8, 0.6); sparks(x, y, 20, 18, b.def.col === 'bolt' ? 'bolt' : 'fire', 220, 200); flashLight(x, y, 120, b.def.col || 'fire', 1.6, 0.25); shake(0.3); SFX.boom(0.8, panOf(x)); });
  after(2.8, () => queueChoice('boss', 'SPOILS OF ' + b.def.name));
  after(1.2, () => { flash('white', 0.9); ring(b.x, b.y, 160, 'white', 0.8, 8); ring(b.x, b.y, 110, b.def.col || 'fire', 0.6, 6); slamFx(b.x, b.y, 1.8, b.def.col || 'earth'); scorch(b.x, b.y, 50, 0.8); quake(1.8, 1.3); SFX.thunder(0, 1.4); });
}
function summonMon(def, x, y, delay, hpMul = G.monHp, dmgMul = G.monDmg, rank = null) {
  x = clamp(x, ARENA.x0 + 8, ARENA.x1 - 8); y = clamp(y, ARENA.y0 + 6, ARENA.y1 - 4); G.pending++;
  if (rank) { const war = rank === 'warlord'; def = { ...def, scale: (def.scale || 1) * (war ? 1.9 : 1.45), r: (def.r || 5), dmg: def.dmg * (war ? 1.7 : 1.35), hp: def.hp * (war ? 9 : 4) * [0.6, 0.75, 0.9, 1][NP() - 1], spd: def.spd * 0.9, rank }; }
  const sc = def.scale || 1;
  after(delay, () => summonFx(x, y, sc));
  after(delay + 0.75, () => {
    G.pending--; const m = mkUnit('mon', def, x, y, hpMul); m.mul = dmgMul; m.spawnT = 0.35; G.units.push(m);
    if (def.rank) { m.rank = def.rank; ring(x, y, 50 * sc, 'red', 0.5, 5); flashLight(x, y, 120, 'red', 1.6, 0.5); shake(0.25); SFX.summon(panOf(x)); if (def.rank === 'warlord') { m.title = pick(WARLORD_NAMES); G.champ = m; textBanner(m.title, 'WARLORD OF ' + ARENA.name, 'red'); quake(1, 0.7); slowmo(0.45, 0.5); smoke(x, y, 12, 'dark', 18, 60, 2, 16); debris(x, y, 30, ['#5a5048', '#7d7064', '#3c342e'], 200, 260, 2.2); } }
    ring(x, y, 22 * sc, 'arcane', 0.3, 3); sparks(x, y, 8, 12, 'arcane', 140, 120); smoke(x, y, 3, 'dark', 9 * sc, 20, 1); flashLight(x, y, 60, 'arcane', 1.2, 0.25); SFX.pop(panOf(x));
  });
}
// ---------- projectiles ----------
function updateProj(dt) {
  for (const p of G.proj) {
    p.t += dt; const foes = p.team === 'hero' ? G.mons : G.heroes; localFx(() => projFx(p, dt));
    if (p.k === 'meteor' || p.k === 'boulder') {
      p.x += p.vx * dt; p.z += p.vz * dt;
      if (p.z <= 0) { p.dead = true;
        if (p.k === 'meteor') { explode(p.x, p.y, p.R, p.dmg, p.src); if (p.lava) hazard({ k: 'lava', x: p.x, y: p.y, r: p.R * 0.45, life: 4.5, rate: 0.3, dmg: p.dmg * 0.08, src: p.src }); cracks(p.x, p.y, 8, p.R * 1.6, 360, 3); quake(0.5 * p.big, 0.6); if (p.last) { slowmo(0.25, 0.5); flash('white', 0.6); hitstop(0.09); } }
        else { for (const u of within(p.x, p.y, p.R * p.sz, G.mons)) hurt(u, p.dmg, p.src, { elem: 'earth', up: 160, stun: 0.6 }); hitProps(p.x, p.y, 12); debris(p.x, p.y, 10, ['#5a5048', '#7d7064', '#3c342e'], 110, 170, 2); smoke(p.x, p.y, 3, 'dust', 10, 30, 1.2); ring(p.x, p.y, 22 * p.sz, 'earth', 0.3, 3); scorch(p.x, p.y, 8, 0.4); shake(0.08); SFX.hit(panOf(p.x)); }
      }
      continue;
    }
    if (p.k === 'glob') { p.u += dt / p.T; p.x = lerp(p.x0, p.tx, Math.min(1, p.u)); p.y = lerp(p.y0, p.ty, Math.min(1, p.u)); p.z = 8 + Math.sin(Math.min(1, p.u) * Math.PI) * 44; if (p.u >= 1 && p.mud) { p.dead = true; const R = p.PR || 18; for (const u of within(p.tx, p.ty, R, G.mons)) { hurt(u, p.dmg, p.src, { elem: 'earth', kx: rand(-40, 40), ky: rand(-30, 30) }); u.slow = Math.max(u.slow, p.SL || 1.6); } debris(p.tx, p.ty, 12, ['#5a4028', '#7a5a38', '#3a2818'], 90, 120, 1.8); smoke(p.tx, p.ty, 3, 'dust', 10, 30, 1); ring(p.tx, p.ty, R * 1.3, 'earth', 0.3, 3); splat(p.tx, p.ty, '#3a2818', 8, R * 0.6); SFX.hit(panOf(p.tx)); continue; } if (p.u >= 1) { p.dead = true; hazard({ k: 'lava', x: p.tx, y: p.ty, r: p.PR || 13, life: p.PL || 4.2, rate: 0.3, dmg: p.dmg, src: p.src }); scorch(p.tx, p.ty, 12, 0.6); glows(p.tx, p.ty, 4, 8, 'fire', 80, 5, 0.5); sparks(p.tx, p.ty, 4, 10, 'fire', 120, 100); SFX.hit(panOf(p.tx)); } continue; }
    if (p.shot === 'serpent') { p.wob += dt * 9; const s = Math.hypot(p.vx, p.vy), ca = Math.atan2(p.vy, p.vx) + Math.sin(p.wob) * 2.2 * dt; p.vx = Math.cos(ca) * s; p.vy = Math.sin(ca) * s; }
    if (p.home && alive(p.home)) { const a = angTo(p.x, p.y, p.home.x, p.home.y), s = Math.hypot(p.vx, p.vy), ca = Math.atan2(p.vy, p.vx), na = ca + clamp(((a - ca + Math.PI * 3) % TAU) - Math.PI, -1.8 * dt, 1.8 * dt); p.vx = Math.cos(na) * s; p.vy = Math.sin(na) * s; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.k === 'ball') { p.zapT -= dt; if (p.zapT <= 0) { p.zapT = 0.13; const t = nearest(p, G.mons, 62); if (t) { bolt(p.x, p.y - p.z, t.x, t.y - 6 * t.scale, { life: 0.14, w: 0.7, branches: 1 }); zapHit(t, p.src, p.dmg, { stun: 0.25 }); } else if (chance(0.5)) { const a = rand(TAU); bolt(p.x, p.y - p.z, p.x + Math.cos(a) * 22, p.y + Math.sin(a) * 16, { life: 0.1, w: 0.5, branches: 0 }); } } if (p.home === undefined && p.target && alive(p.target)) { const a = angTo(p.x, p.y, p.target.x, p.target.y); p.vx = damp(p.vx, Math.cos(a) * 46, 2, dt); p.vy = damp(p.vy, Math.sin(a) * 46, 2, dt); } }
    // collisions
    let hitU = null; for (const u of foes) { if (u.dead || u.spawnT > 0 || u.carried === 2) continue; if (Math.abs(u.x - p.x) < u.r + p.r && Math.abs(u.y - p.y) < u.r + p.r && dist(u.x, u.y, p.x, p.y) < u.r + p.r) { hitU = u; break; } }
    const wall = !inArena(p.x, p.y) || nearestSolid(p.x, p.y + 2, p.r);
    const reached = p.k === 'fireball' && dist(p.x, p.y, p.tx, p.ty) < 6;
    if (p.k === 'ball') { if (p.t >= p.life || wall) { p.dead = true; const DR = p.DR || 46; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; bolt(p.x, p.y - p.z, p.x + Math.cos(a) * DR, p.y + Math.sin(a) * DR * 0.74, { life: 0.25, w: 0.9, branches: 1 }); } for (const u of within(p.x, p.y, DR, G.mons)) zapHit(u, p.src, p.dmg * 2.5, { stun: 0.6 }); ring(p.x, p.y, 60, 'bolt', 0.35, 5); flash('bolt2', 0.2); flashLight(p.x, p.y, 140, 'bolt2', 1.6, 0.3); shake(0.25); SFX.thunder(panOf(p.x), 0.6); } continue; }
    if (hitU || wall || reached || p.t >= p.life) {
      p.dead = true;
      if (p.k === 'fireball') { explode(p.x, p.y, p.R, p.dmg, p.src, { burn: p.burn, fx: p.fx }); if (p.cluster) { const px = p.x, py = p.y, s = p.src, dm = p.dmg; for (let i = 0; i < 4; i++) after(0.12 + i * 0.09, () => { const a = rand(TAU), r = rand(18, 34); explode(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.75, 15, dm * 0.4, s); }); } }
      else if (p.shot === 'serpent') explode(p.x, p.y, p.ER || 17, p.dmg, p.src);
      else if (p.shot === 'sorb') { const BR = p.BR || 20; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; bolt(p.x, p.y - p.z, p.x + Math.cos(a) * BR, p.y - p.z + Math.sin(a) * BR * 0.75, { life: 0.16, w: 0.6, branches: 0 }); } for (const u of within(p.x, p.y, BR, G.mons)) zapHit(u, p.src, p.dmg * (u === hitU ? 1 : 0.5), { stun: p.ST || 0.9 }); flashLight(p.x, p.y, 80, 'bolt2', 1.3, 0.2); }
      else if (p.k === 'bat') { if (hitU) { hurt(hitU, p.dmg, p.src, { elem: 'crimson' }); HFX.bite(p.x, p.y); } else HFX.batBurst(p.x, p.y, 1); }
      else if (p.shot === 'ishard') { for (const u of within(p.x, p.y, p.BR || 16, G.mons)) hurt(u, p.dmg * (u === hitU ? 1 : 0.5), p.src, { elem: 'ice', quiet: u !== hitU }); sparks(p.x, p.y, p.z, 7, 'ice', 90, 60); flashLight(p.x, p.y, 36, 'ice', 1, 0.15); }
      else if (p.k === 'mshot') { if (hitU) hurt(hitU, p.dmg, p.src, { elem: p.col === 'bolt' ? 'bolt' : p.col === 'ice' || p.col === 'water' ? p.col : undefined, kx: p.vx * 0.3, ky: p.vy * 0.3 }); if (p.shot === 'orb' || p.shot === 'fire') { glows(p.x, p.y, p.z, 6, p.col, 60, 5, 0.4); flashLight(p.x, p.y, 40, p.col, 1, 0.15); } else sparks(p.x, p.y, p.z, 4, p.col === 'white' ? 'white' : p.col, 70, 50); }
    }
  }
  removeIf(G.proj, p => p.dead);
}
