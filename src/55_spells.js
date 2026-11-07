// ===================== spells, projectiles and the big set pieces =====================
function after(t, fn) { G.sched.push({ t, fn }); }
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
  for (const u of within(x, y, R, foes)) { const d = dist(x, y, u.x, u.y), f = 1 - 0.45 * Math.min(1, d / R), a = angTo(x, y, u.x, u.y); hurt(u, dmg * f, src, { elem: o.elem || 'fire', kx: Math.cos(a) * 230 * big, ky: Math.sin(a) * 170 * big, up: 150 * big, crit: chance(0.15) }); }
  hitProps(x, y, R);
  part({ k: 'glow', x, y, z: 6, life: 0.14, s0: R * 1.1, s1: R * 1.6, col: 'hot', a0: 0.9, a1: 0 });
  glows(x, y, 8, 18 * big, 'fire', 150 * big, 9 * big, 0.75, 1); glows(x, y, 8, 8 * big, 'fire2', 90 * big, 7 * big, 0.45, 0); glows(x, y, 10, 10 * big, 'ember', 200 * big, 6 * big, 0.9, 0);
  sparks(x, y, 6, 46 * big, 'fire', 260 * big, 240 * big); embers(x, y, 20 * big, 'ember', 80 * big);
  smoke(x, y, 7 * big, 'dark', 16 * big, 46 * big, 2.4, 18); debris(x, y, 12 * big, ['#5a5048', '#7d7064', '#3c342e', '#241c18'], 170 * big, 240 * big, 2);
  ring(x, y, R * 2.3, 'fire2', 0.4, 6); ring(x, y, R * 1.2, 'white', 0.2, 3);
  flashLight(x, y, R * 5, 'fire', 1.6, 0.5); flashLight(x, y, R * 1.8, 'hot', 1, 0.12);
  scorch(x, y, R * 0.95, 0.75); if (big >= 0.95) cracks(x, y, randi(4, 7), R * 1.4, 320, 1.8);
  shake(0.32 * big); hitstop(0.04 * big); kick(0.05 * big); flash('fire', 0.1 * big); SFX.boom(big, panOf(x)); buzz(Math.round(30 * big));
}
function castFireball(h, tx, ty, big = 1) {
  const a = angTo(h.x, h.y, tx, ty), s = 200; h.lunge = 0.2; h.la = a;
  proj({ k: 'fireball', x: h.x + Math.cos(a) * 6, y: h.y + Math.sin(a) * 3, z: 11, vx: Math.cos(a) * s, vy: Math.sin(a) * s, team: 'hero', src: h, dmg: h.def.dmg * h.mul * 1.5, R: 26 * big, big, tx, ty, life: 2.2, r: 4 * big });
  glows(h.x + Math.cos(a) * 8, h.y, 11, 8, 'fire', 60, 5, 0.3); SFX.fire(panOf(h.x));
}
function flameNova(h) {
  h.lunge = 0.3; ring(h.x, h.y, 60, 'fire', 0.45, 7); ring(h.x, h.y, 40, 'fire2', 0.3, 4);
  for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; part({ k: 'glow', x: h.x, y: h.y, z: 6, vx: Math.cos(a) * 190, vy: Math.sin(a) * 140, drag: 2.6, life: 0.6, s0: 7, s1: 2, col: i % 2 ? 'fire' : 'fire2' }); }
  for (const u of within(h.x, h.y, 50, G.mons)) { const a = angTo(h.x, h.y, u.x, u.y); hurt(u, h.def.dmg * h.mul * 1.6, h, { elem: 'fire', kx: Math.cos(a) * 260, ky: Math.sin(a) * 200, up: 120 }); }
  flashLight(h.x, h.y, 150, 'fire', 1.6, 0.4); shake(0.3); hitstop(0.04); SFX.boom(0.8, panOf(h.x)); scorch(h.x, h.y, 26, 0.5);
}
function meteorStorm(h) {
  banner('METEOR STORM', h); SFX.braam(); slowmo(0.5, 0.4); G.ambDark = Math.max(G.ambDark, 0.35);
  const n = 9;
  for (let i = 0; i < n; i++) after(0.25 + i * 0.26, () => {
    const last = i === n - 1, d = last ? densest(G.mons, 40) : null, t = d || (G.mons.length ? pick(G.mons) : null);
    const tx = t ? t.x + rand(-14, 14) : rand(ARENA.x0, ARENA.x1), ty = t ? t.y + rand(-10, 10) : rand(ARENA.y0, ARENA.y1), H = 300, T = 0.9;
    proj({ k: 'meteor', x: tx + 130, y: ty, z: H, vx: -130 / T, vy: 0, vz: -H / T, team: 'hero', src: h, dmg: h.def.dmg * h.mul * (last ? 4 : 2.4), R: last ? 58 : 36, tx, ty, life: 3, big: last ? 2.3 : 1.4, last });
    SFX.whoosh(panOf(tx));
  });
}
// ---------- LIGHTNING ----------
function zapHit(u, src, dmg, o = {}) {
  if (!alive(u)) return; hurt(u, dmg, src, { elem: 'bolt', stun: o.stun || 0.35, kx: rand(-50, 50), ky: rand(-40, 40), crit: chance(0.2), up: o.up || 0 });
  sparks(u.x, u.y, 8 * u.scale, 12, 'bolt', 170, 140); flashLight(u.x, u.y, 80, 'bolt', 1.4, 0.18); G.ambFlash = Math.min(0.35, G.ambFlash + 0.08); shake(0.08); SFX.zap(panOf(u.x));
}
function chainLightning(h, first) {
  const hit = new Set(); let from = { x: h.x + h.face * 4, y: h.y - 12 }, tgt = first, delay = 0; const jumps = 5 + Math.min(4, G.floor >> 2);
  h.lunge = 0.25; h.la = angTo(h.x, h.y, first.x, first.y);
  for (let i = 0; i < jumps && tgt; i++) {
    const a = from, b = tgt, dm = h.def.dmg * h.mul * (1.25 - i * 0.07); hit.add(b);
    after(delay, () => { if (!alive(b)) return; bolt(a.x, a.y, b.x, b.y - 7 * b.scale, { life: 0.32, w: 1.15, branches: 2 }); zapHit(b, h, dm); });
    from = { x: b.x, y: b.y - 7 * b.scale }; delay += 0.065;
    let best = null, bd = 85; for (const m of G.mons) { if (hit.has(m) || m.dead || m.spawnT > 0) continue; const d = dist(b.x, b.y, m.x, m.y); if (d < bd) { bd = d; best = m; } } tgt = best;
  }
  flashLight(h.x, h.y - 10, 70, 'bolt', 1.2, 0.2);
}
function ballLightning(h, t) { const a = angTo(h.x, h.y, t.x, t.y); proj({ k: 'ball', x: h.x, y: h.y, z: 12, vx: Math.cos(a) * 46, vy: Math.sin(a) * 46, team: 'hero', src: h, dmg: h.def.dmg * h.mul * 0.45, life: 3.4, r: 5, zapT: 0, target: t }); SFX.zap(panOf(h.x)); }
function skyStrike(x, y, src, p = 1) {
  const top = y - 280; bolt(x + rand(-50, 50), top, x, y, { life: 0.38, w: 2.3 * p, branches: 5, jag: 1.25 }); bolt(x + rand(-30, 30), top, x + rand(-4, 4), y, { life: 0.25, w: 1.2 * p, branches: 2 });
  flash('bolt2', 0.16 * p); G.ambFlash = Math.max(G.ambFlash, 0.45 * Math.min(1.4, p)); flashLight(x, y, 120 * p, 'bolt2', 1.5, 0.35);
  for (const u of within(x, y, 26 * p, G.mons)) { const a = angTo(x, y, u.x, u.y); hurt(u, src.def.dmg * src.mul * 1.7 * p, src, { elem: 'bolt', stun: 0.7, up: 140 * p, kx: Math.cos(a) * 150, ky: Math.sin(a) * 120, crit: chance(0.25) }); }
  hitProps(x, y, 20 * p);
  sparks(x, y, 4, 50 * p, 'bolt', 280, 260); glows(x, y, 6, 14, 'bolt', 130, 8 * p, 0.5); ring(x, y, 54 * p, 'bolt', 0.42, 6); ring(x, y, 26 * p, 'white', 0.22, 4);
  scorch(x, y, 18 * p, 0.8); cracks(x, y, 5, 32 * p, 520, 1.1, 'bolt'); debris(x, y, 10 * p, ['#5a5048', '#7d7064', '#3c342e'], 150, 200, 1.8); smoke(x, y, 2, 'dark', 10, 24, 1.2);
  shake(0.42 * p); hitstop(0.05 * p); kick(0.05 * p); SFX.thunder(panOf(x), Math.min(1.3, p)); buzz(Math.round(50 * p));
}
function thunderstorm(h) { banner('THUNDERSTORM', h); SFX.braam(); G.storm = { t: 0, dur: 3.6, next: 0.45, src: h, fin: false }; G.ambDark = Math.max(G.ambDark, 0.75); slowmo(0.55, 0.35); }
function updateStorm(dt) {
  const s = G.storm; if (!s) return; s.t += dt; G.ambDark = Math.max(G.ambDark, 0.7);
  if (s.t >= s.next && s.t < s.dur - 0.4) { s.next += rand(0.17, 0.3); const t = G.mons.length && chance(0.8) ? pick(G.mons) : null; skyStrike(t ? t.x + rand(-6, 6) : rand(ARENA.x0, ARENA.x1), t ? t.y + rand(-4, 4) : rand(ARENA.y0, ARENA.y1), s.src, rand(0.8, 1.1)); }
  if (!s.fin && s.t >= s.dur - 0.35) { s.fin = true; const d = densest(G.mons, 40) || { x: CAM.x, y: CAM.y }; slowmo(0.25, 0.45); skyStrike(d.x, d.y, s.src, 2.1); hitstop(0.1); flash('white', 0.6); }
  if (s.t >= s.dur) G.storm = null;
}
// ---------- EARTH ----------
function stoneSpikes(h, t) {
  const a = angTo(h.x, h.y, t.x, t.y); h.lunge = 0.25; h.la = a; SFX.whoosh(panOf(h.x));
  for (let i = 0; i < 8; i++) after(i * 0.05, () => {
    const x = h.x + Math.cos(a) * (14 + i * 11), y = h.y + Math.sin(a) * (14 + i * 11) * 0.85; if (!inArena(x, y)) return;
    part({ k: 'spike', x, y, life: 0.7, s0: rand(6, 9) });
    debris(x, y, 5, ['#6b625a', '#8a8076', '#4a423c'], 70, 160, 1.6); smoke(x, y, 1, 'dust', 8, 14, 0.8);
    for (const u of within(x, y, 11, G.mons)) hurt(u, h.def.dmg * h.mul * 0.9, h, { elem: 'earth', up: 190, stun: 0.5, kx: Math.cos(a) * 60, ky: Math.sin(a) * 50 });
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
function earthquake(h) { banner('EARTHQUAKE', h, null, 'earth'); SFX.braam(); SFX.quake(3.8); quake(3.8, 1.25); G.eq = { t: 0, dur: 3.8, src: h, rockT: 0.3, crackT: 0, tickT: 0.4 }; buzz([200, 80, 200, 80, 300, 80, 400]); }
function updateQuake(dt) {
  const e = G.eq; if (!e) return; e.t += dt; e.rockT -= dt; e.crackT -= dt; e.tickT -= dt; G.ambDark = Math.max(G.ambDark, 0.3);
  if (e.rockT <= 0 && e.t < e.dur - 0.3) { e.rockT = rand(0.08, 0.16); const t = G.mons.length && chance(0.75) ? pick(G.mons) : null, x = t ? t.x + rand(-10, 10) : rand(ARENA.x0, ARENA.x1), y = t ? t.y + rand(-8, 8) : rand(ARENA.y0, ARENA.y1), H = rand(200, 280); proj({ k: 'boulder', x, y, z: H, vz: -H / 0.75, team: 'hero', src: e.src, dmg: e.src.def.dmg * e.src.mul * 1.4, R: 16, life: 2, rk: randi(0, 5), sz: rand(0.8, 1.4) }); }
  if (e.crackT <= 0) { e.crackT = rand(0.2, 0.35); const t = G.mons.length ? pick(G.mons) : null; cracks(t ? t.x : rand(ARENA.x0, ARENA.x1), t ? t.y : rand(ARENA.y0, ARENA.y1), randi(3, 6), rand(30, 60), 400, 2.6); }
  if (e.tickT <= 0) { e.tickT = 0.55; for (const m of G.mons) if (m.spawnT <= 0) hurt(m, e.src.def.dmg * e.src.mul * 0.55, e.src, { elem: 'earth', up: rand(80, 200), stun: 0.5, kx: rand(-60, 60), ky: rand(-40, 40), quiet: true }); for (let i = 0; i < 6; i++) smoke(rand(ARENA.x0, ARENA.x1), rand(ARENA.y0, ARENA.y1), 1, 'dust', 14, 20, 1.5, 6); }
  if (e.t >= e.dur) { const d = densest(G.mons, 50) || { x: CAM.x, y: CAM.y }; slamFx(d.x, d.y, 1.6); for (const u of within(d.x, d.y, 70, G.mons)) hurt(u, e.src.def.dmg * e.src.mul * 2.5, e.src, { elem: 'earth', up: 260, stun: 1 }); slowmo(0.3, 0.5); flash('white', 0.5); G.eq = null; }
}
// ---------- STEEL ----------
function slash(h, t) {
  const a = angTo(h.x, h.y, t.x, t.y); h.lunge = 0.3; h.la = a; h.face = Math.cos(a) < 0 ? -1 : 1; h.combo = (h.combo || 0) + 1;
  const fin = h.combo % 4 === 0; arcFx(h.x, h.y - 6, a, fin ? 3.4 : 2.2, fin ? 26 : 20, 'gold', 0.2, fin ? 5 : 3.5); SFX.slash(panOf(h.x));
  let any = false;
  for (const u of within(h.x, h.y, fin ? 30 : 24, G.mons)) { let da = Math.abs(((angTo(h.x, h.y, u.x, u.y) - a) % TAU + TAU + Math.PI) % TAU - Math.PI); if (da > (fin ? 1.8 : 1.25)) continue; any = true; hurt(u, h.def.dmg * h.mul * (fin ? 1.9 : 1), h, { elem: 'phys', kx: Math.cos(a) * (fin ? 260 : 110), ky: Math.sin(a) * (fin ? 200 : 80), up: fin ? 120 : 0, crit: fin || chance(0.18), stun: 0.15 }); sparks(u.x, u.y, 8, fin ? 16 : 7, 'gold', 180, 100, a, 1.6); }
  if (any) { hitstop(fin ? 0.07 : 0.025); shake(fin ? 0.2 : 0.06); if (fin) kick(0.04); flashLight(h.x, h.y, 50, 'gold', 1, 0.12); }
}
function whirlwind(h) { h.state = { k: 'whirl', t: 0, dur: 1.15, tick: 0 }; SFX.whoosh(panOf(h.x)); }
function cataclysm(h) {
  const d = densest(G.mons, 50, h, 200) || nearest(h, G.mons); if (!d) return; banner('CATACLYSM', h); SFX.braam();
  h.state = { k: 'leap', t: 0, dur: 0.62, x0: h.x, y0: h.y, x1: d.x, y1: d.y }; slowmo(0.6, 0.3); SFX.whoosh(panOf(h.x));
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
  after(1.2, () => { flash('white', 0.9); ring(b.x, b.y, 160, 'white', 0.8, 8); ring(b.x, b.y, 110, b.def.col || 'fire', 0.6, 6); slamFx(b.x, b.y, 1.8, b.def.col || 'earth'); scorch(b.x, b.y, 50, 0.8); quake(1.8, 1.3); SFX.thunder(0, 1.4); });
}
function summonMon(def, x, y, delay, hpMul = G.monHp, dmgMul = G.monDmg) {
  x = clamp(x, ARENA.x0 + 8, ARENA.x1 - 8); y = clamp(y, ARENA.y0 + 6, ARENA.y1 - 4); G.pending++;
  const sc = def.scale || 1;
  after(delay, () => { circleFx(x, y, 9 * sc + 5, 'arcane', 1.0); for (let i = 0; i < 10; i++) part({ k: 'glow', x: x + rand(-8, 8), y: y + rand(-5, 5), z: 0, vz: rand(30, 70), drag: 0.5, life: rand(0.5, 0.9), s0: rand(1.5, 3), s1: 0, col: 'arcane' }); SFX.summon(panOf(x)); });
  after(delay + 0.75, () => {
    G.pending--; const m = mkUnit('mon', def, x, y, hpMul); m.mul = dmgMul; m.spawnT = 0.35; G.units.push(m);
    ring(x, y, 22 * sc, 'arcane', 0.3, 3); sparks(x, y, 8, 12, 'arcane', 140, 120); smoke(x, y, 3, 'dark', 9 * sc, 20, 1); flashLight(x, y, 60, 'arcane', 1.2, 0.25); SFX.pop(panOf(x));
  });
}
// ---------- projectiles ----------
function updateProj(dt) {
  for (const p of G.proj) {
    p.t += dt; const foes = p.team === 'hero' ? G.mons : G.heroes;
    if (p.k === 'meteor' || p.k === 'boulder') {
      p.x += p.vx * dt; p.z += p.vz * dt;
      if (p.k === 'meteor') { glows(p.x, p.y, p.z, 2, 'fire', 30, 8, 0.4); if (chance(0.6)) part({ k: 'smoke', x: p.x, y: p.y, z: p.z, vx: rand(-8, 8), vy: rand(-5, 5), vz: 4, drag: 1, life: 1, s0: 5, s1: 13, col: 'dark', a0: 0.7, a1: 0 }); embers(p.x, p.y, 1); light(p.x, p.y, 70, 'fire', 0.9); }
      if (p.z <= 0) { p.dead = true;
        if (p.k === 'meteor') { explode(p.x, p.y, p.R, p.dmg, p.src); cracks(p.x, p.y, 8, p.R * 1.6, 360, 3); quake(0.5 * p.big, 0.6); if (p.last) { slowmo(0.25, 0.5); flash('white', 0.6); hitstop(0.09); } }
        else { for (const u of within(p.x, p.y, p.R * p.sz, G.mons)) hurt(u, p.dmg, p.src, { elem: 'earth', up: 160, stun: 0.6 }); hitProps(p.x, p.y, 12); debris(p.x, p.y, 10, ['#5a5048', '#7d7064', '#3c342e'], 110, 170, 2); smoke(p.x, p.y, 3, 'dust', 10, 30, 1.2); ring(p.x, p.y, 22 * p.sz, 'earth', 0.3, 3); scorch(p.x, p.y, 8, 0.4); shake(0.08); SFX.hit(panOf(p.x)); }
      }
      continue;
    }
    if (p.home && alive(p.home)) { const a = angTo(p.x, p.y, p.home.x, p.home.y), s = Math.hypot(p.vx, p.vy), ca = Math.atan2(p.vy, p.vx), na = ca + clamp(((a - ca + Math.PI * 3) % TAU) - Math.PI, -1.8 * dt, 1.8 * dt); p.vx = Math.cos(na) * s; p.vy = Math.sin(na) * s; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.k === 'fireball') { for (let i = 0; i < 2; i++) part({ k: 'glow', x: p.x + rand(-2, 2), y: p.y + rand(-2, 2), z: p.z, vx: -p.vx * 0.15 + rand(-15, 15), vy: -p.vy * 0.15 + rand(-15, 15), drag: 2, life: rand(0.25, 0.45), s0: 6 * p.big, s1: 1, col: chance(0.5) ? 'fire' : 'fire2' }); if (chance(0.4)) embers(p.x, p.y, 1); if (chance(0.25)) smoke(p.x, p.y, 1, 'dark', 6, 6, 0.8, 4); light(p.x, p.y, 60 * p.big, 'fire', 1.1); }
    else if (p.k === 'ball') { p.zapT -= dt; light(p.x, p.y, 70, 'bolt', 1.2); if (chance(0.5)) sparks(p.x, p.y, p.z, 1, 'bolt', 80, 40); if (p.zapT <= 0) { p.zapT = 0.13; const t = nearest(p, G.mons, 62); if (t) { bolt(p.x, p.y - p.z, t.x, t.y - 6 * t.scale, { life: 0.14, w: 0.7, branches: 1 }); zapHit(t, p.src, p.dmg, { stun: 0.25 }); } else if (chance(0.5)) { const a = rand(TAU); bolt(p.x, p.y - p.z, p.x + Math.cos(a) * 22, p.y + Math.sin(a) * 16, { life: 0.1, w: 0.5, branches: 0 }); } } if (p.home === undefined && p.target && alive(p.target)) { const a = angTo(p.x, p.y, p.target.x, p.target.y); p.vx = damp(p.vx, Math.cos(a) * 46, 2, dt); p.vy = damp(p.vy, Math.sin(a) * 46, 2, dt); } }
    else if (p.k === 'mshot') { if (p.shot !== 'arrow' && p.shot !== 'stone') { part({ k: 'glow', x: p.x, y: p.y, z: p.z, vx: -p.vx * 0.1, vy: -p.vy * 0.1, life: 0.3, s0: 4, s1: 0, col: p.col }); light(p.x, p.y, 34, p.col, 0.8); } }
    // collisions
    let hitU = null; for (const u of foes) { if (u.dead || u.spawnT > 0) continue; if (Math.abs(u.x - p.x) < u.r + p.r && Math.abs(u.y - p.y) < u.r + p.r && dist(u.x, u.y, p.x, p.y) < u.r + p.r) { hitU = u; break; } }
    const wall = !inArena(p.x, p.y) || nearestSolid(p.x, p.y + 2, p.r);
    const reached = p.k === 'fireball' && dist(p.x, p.y, p.tx, p.ty) < 6;
    if (p.k === 'ball') { if (p.t >= p.life || wall) { p.dead = true; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; bolt(p.x, p.y - p.z, p.x + Math.cos(a) * 46, p.y + Math.sin(a) * 34, { life: 0.25, w: 0.9, branches: 1 }); } for (const u of within(p.x, p.y, 46, G.mons)) zapHit(u, p.src, p.dmg * 2.5, { stun: 0.6 }); ring(p.x, p.y, 60, 'bolt', 0.35, 5); flash('bolt2', 0.2); flashLight(p.x, p.y, 140, 'bolt2', 1.6, 0.3); shake(0.25); SFX.thunder(panOf(p.x), 0.6); } continue; }
    if (hitU || wall || reached || p.t >= p.life) {
      p.dead = true;
      if (p.k === 'fireball') explode(p.x, p.y, p.R, p.dmg, p.src);
      else if (p.k === 'mshot') { if (hitU) hurt(hitU, p.dmg, p.src, { elem: p.col === 'bolt' ? 'bolt' : undefined, kx: p.vx * 0.3, ky: p.vy * 0.3 }); if (p.shot === 'orb' || p.shot === 'fire') { glows(p.x, p.y, p.z, 6, p.col, 60, 5, 0.4); flashLight(p.x, p.y, 40, p.col, 1, 0.15); } else sparks(p.x, p.y, p.z, 4, p.col === 'white' ? 'white' : p.col, 70, 50); }
    }
  }
  removeIf(G.proj, p => p.dead);
}
