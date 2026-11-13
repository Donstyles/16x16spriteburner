// ===================== Voltaire, the stormcaller: wind first, thunder second =====================
// Whooshes hurl the horde away (a foe that hits a wall in flight takes the slam). Tornadoes suck foes in, carry them
// up and round in a spiral and fling them out to crash down. Lightning is the other half of the storm: it strikes
// whatever is airborne 50% harder.
COL.wind = [225, 235, 255]; COL.storm = [175, 150, 255];
SPARK_PAL.wind = ['#ffffff', '#f4f7ff', '#d6e0ff', '#a0a8d8']; SPARK_PAL.storm = ['#ffffff', '#e6dcff', '#b8a0ff', '#7058d0'];
Object.assign(HERO_DEFS.storm, { spr: 'Stormcaller', col: 'storm' });
HERO_PROG.storm = { titles: [[1, 'WIND ADEPT'], [5, 'STORMCALLER'], [12, 'LORD OF THE GALE']], ult: 'TEMPEST', evolve: { lvl: 12, spr: 'StormLord' } };
DEFAULT_BASIC.storm = 'WIND BLADE';
HERO_BLURB.storm = ['WIND · THUNDER · RANGED', 'Whooshes hurl foes into walls; tornadoes spin them up for the lightning.', ['WHOOSH', 'TORNADO', 'TEMPEST']];

// ---------- wind physics ----------
// a cone of wind: everything inside is hurled away; whoever hits a wall while still flying takes the slam
function blow(h, x, y, a, cone, range, power, dmg, slam) {
  for (const u of live(G.mons)) {
    const d = dist(x, y, u.x, u.y); if (d > range + u.r || Math.abs(angDiff(angTo(x, y, u.x, u.y), a)) > cone || u.carried) continue;
    const f = 1 - 0.45 * d / range; hurt(u, dmg, h, { elem: 'wind', kx: Math.cos(a) * power * f, ky: Math.sin(a) * power * f * 0.75 });
    if (!u.boss) { u.windT = 0.9; u.windDmg = slam; u.windSrc = h; }
  }
}
// called from moveUnit: a foe still flying from a gust hits the wall
function windWall(u, A) {
  if ((u.x < A.x0 + u.r + 1 && u.kx < -110) || (u.x > A.x1 - u.r - 1 && u.kx > 110) || (u.y < A.y0 + u.r * 0.4 + 1 && u.ky < -80) || (u.y > A.y1 - 1 && u.ky > 80)) {
    u.windT = 0; if (u.windDmg && !u.dead) { hurt(u, u.windDmg, u.windSrc, { elem: 'wind', stun: 0.5 }); HFX.slam(u.x, u.y); }
  }
}
// thrown out of a tornado: it falls, and the landing hurts
function fling(u, a, power, drop, src) { u.carried = 0; u.vz = 70; u.z = Math.max(u.z, 1); u.kx = Math.cos(a) * power; u.ky = Math.sin(a) * power * 0.7; u.dropDmg = drop; u.dropSrc = src; u.windT = 0.9; u.windDmg = drop * 0.5; u.windSrc = src; u.moving = false; }
const airborne = f => f.filter(u => u.air);

// ---------- one-off effects ----------
Object.assign(HFX, {
  whoosh(x, y, a, cone, range) {
    for (let i = 0; i < 34; i++) { const aa = a + rand(-cone, cone), sp = rand(200, 360) * range / 90; part({ k: 'spark', x: x + Math.cos(aa) * 6, y: y + Math.sin(aa) * 4, z: rand(2, 16), vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.75, drag: 2.6, life: rand(0.3, 0.5), col: chance(0.7) ? 'wind' : 'storm' }); }
    for (let k = 0; k < 3; k++) arcFx(x + Math.cos(a) * (14 + k * range * 0.28), y + Math.sin(a) * (10 + k * range * 0.2), a, cone * (0.7 + k * 0.15), 10 + k * 8, 'wind', 0.22 + k * 0.05, 2.4 - k * 0.5);
    smoke(x + Math.cos(a) * 16, y + Math.sin(a) * 12, 3, 'dust', 10, 30, 0.8); SFX.whoosh(panOf(x));
  },
  slam(x, y) { debris(x, y, 6, ['#5a5048', '#7d7064', '#a09080'], 90, 110, 1.4); smoke(x, y, 4, 'dust', 10, 24, 0.9); ring(x, y, 16, 'wind', 0.22, 3); SFX.hit(panOf(x)); },
  thud(x, y) { smoke(x, y, 3, 'dust', 8, 20, 0.8); ring(x, y, 12, 'wind', 0.2, 2); debris(x, y, 4, ['#5a5048', '#7d7064'], 60, 80, 1.1); SFX.pop(panOf(x)); },
  crosswind(x, y, R) { for (const s of [-1, 1]) for (let i = 0; i < 18; i++) part({ k: 'spark', x: x + s * R * rand(0.9, 1.3), y: y + rand(-R, R) * 0.5, z: rand(2, 14), vx: -s * rand(220, 320), vy: rand(-20, 20), drag: 2.5, life: rand(0.3, 0.45), col: 'wind' }); SFX.whoosh(panOf(x)); },
  crush(x, y) { ring(x, y, 26, 'wind', 0.3, 4); ring(x, y, 14, 'white', 0.2, 2); debris(x, y, 8, ['#5a5048', '#a09080'], 80, 120, 1.3); SFX.hit(panOf(x)); },
  downdraft(x, y, R) { for (let i = 0; i < 30; i++) part({ k: 'spark', x: x + rand(-R, R) * 0.8, y: y + rand(-R, R) * 0.5, z: rand(60, 120), vz: -rand(300, 420), drag: 0.5, life: 0.28, col: chance(0.6) ? 'wind' : 'storm' }); SFX.whoosh(panOf(x)); },
  downdraftHit(x, y, R) { ring(x, y, R, 'wind', 0.4, 5); ring(x, y, R * 0.6, 'storm', 0.3, 3); smoke(x, y, 10, 'dust', R * 0.6, 50, 1.2); shake(0.3); SFX.hit(panOf(x)); },
  thunderclap(x, y, R) { bolt(x + rand(-20, 20), y - 180, x, y - 6, { life: 0.3, w: 2.4, branches: 4 }); ring(x, y, R, 'storm', 0.5, 7); ring(x, y, R * 0.6, 'wind', 0.35, 4); flash('storm', 0.4); flashLight(x, y, R * 2.4, 'bolt', 2, 0.5); smoke(x, y, 10, 'dust', 20, 60, 1.2); SFX.thunder(panOf(x), 1); },
  skyBolt(x, y) { bolt(x + rand(-30, 30), y - 170, x, y - 8, { life: 0.22, w: 1.6, branches: 2 }); flashLight(x, y, 80, 'bolt', 1.4, 0.2); SFX.zap(panOf(x)); },
  twisterStart(x, y, big) { smoke(x, y, 8 * big, 'dust', 14 * big, 40, 1.2); ring(x, y, 20 * big, 'wind', 0.4, 4); SFX.whoosh(panOf(x)); if (big > 1) SFX.braam(); },
});
// ---------- continuous effects ----------
Object.assign(HAZFX, {
  twister(z, dt) {
    if (z._x === undefined) { z._x = z.x; z._y = z.y; } z._x = damp(z._x, z.x, 6, dt); z._y = damp(z._y, z.y, 6, dt);
    if (chance(dt * (z.big ? 26 : 12))) smoke(z._x + rand(-z.r, z.r) * 0.7, z._y + rand(-3, 3), 1, 'dust', 6, 14, 0.9, 6);
    light(z._x, z._y - z.top * 0.4, z.r * 2.4, 'storm', 0.45);
  },
  blade(z, dt) { if (chance(0.8)) part({ k: 'spark', x: z.x, y: z.y, z: 8, vx: -z.vx * 0.25 + rand(-20, 20), vy: -z.vy * 0.25 + rand(-15, 15), drag: 3, life: 0.2, col: 'wind' }); light(z.x, z.y, 26, 'wind', 0.6); },
  eye(z, dt) { const s = z.src; if (chance(dt * 30)) { const a = rand(TAU), r = z.r * rand(0.6, 1); part({ k: 'spark', x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r * 0.6, z: rand(2, 16), vx: -Math.sin(a) * 160, vy: Math.cos(a) * 96, drag: 2, life: 0.3, col: chance(0.7) ? 'wind' : 'storm' }); } light(z.x, z.y, z.r * 1.6, 'storm', 0.4); void s; },
});
Object.assign(HAZDRAW.world, {
  // a funnel of turning bands, narrow at the floor and wide at the top, with grit orbiting inside
  twister(c, z) {
    const x = z._x === undefined ? z.x : z._x, y = z._y === undefined ? z.y : z._y, top = z.top + 18, T = G.time, life = Math.min(1, z.t * 3, (z.life - z.t) * 3), R0 = z.r * 0.3, R1 = z.r * 1.2, n = z.big ? 18 : 13;
    c.save(); c.globalAlpha = life;
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, y, z.r * 0.9, z.r * 0.35, 0, 0, TAU); c.fill();
    const sw = Math.sin(T * 2.3 + 3.2) * 7; c.fillStyle = 'rgba(205,200,235,0.2)'; c.beginPath(); c.moveTo(x - R0, y); c.lineTo(x + sw - R1, y - top); c.lineTo(x + sw + R1, y - top); c.lineTo(x + R0, y); c.closePath(); c.fill(); // the body of the funnel
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), hh = f * top, rr = lerp(R0, R1, f * f) * (1 + 0.08 * Math.sin(T * 7 + i)), sway = Math.sin(T * 2.3 + f * 3.2) * 7 * f, a0 = -T * (10 - f * 4) + i * 0.9;
      c.strokeStyle = i % 3 === 0 ? `rgba(248,250,255,${0.55 + 0.4 * f})` : `rgba(${i % 2 ? '200,190,240' : '160,150,210'},${0.5 + 0.4 * f})`; c.lineWidth = z.big ? 2.6 : 2;
      c.beginPath(); c.ellipse(x + sway, y - hh, rr, rr * 0.3, 0, a0, a0 + 4.3); c.stroke();
    }
    c.fillStyle = 'rgba(110,96,84,0.95)'; for (let k = 0; k < (z.big ? 22 : 10); k++) { const f = (k * 0.377 + T * 0.4) % 1, a = -T * 9 + k * 2.3, rr = lerp(R0, R1, f * f), sway = Math.sin(T * 2.3 + f * 3.2) * 7 * f; c.fillRect(x + sway + Math.cos(a) * rr - 0.8, y - f * top + Math.sin(a) * rr * 0.3 - 0.8, 1.6, 1.6); }
    c.restore();
  },
  blade(c, z) { const a = Math.atan2(z.vy, z.vx), x = z.x, y = z.y - 8; c.save(); c.strokeStyle = 'rgba(245,248,255,0.95)'; c.lineWidth = 2; c.beginPath(); c.arc(x - Math.cos(a) * 4, y - Math.sin(a) * 3, 7 * (z.s || 1), a - 1.25, a + 1.25); c.stroke(); c.strokeStyle = 'rgba(180,160,255,0.7)'; c.lineWidth = 1; c.beginPath(); c.arc(x - Math.cos(a) * 7, y - Math.sin(a) * 5, 6 * (z.s || 1), a - 1.1, a + 1.1); c.stroke(); c.restore(); },
  eye(c, z) { const T = G.time, life = Math.min(1, z.t * 4, (z.life - z.t) * 3); c.save(); c.globalAlpha = life; for (let k = 0; k < 3; k++) { const r = z.r * (0.7 + k * 0.15), a0 = T * (6 - k) + k * 2; c.strokeStyle = k === 1 ? 'rgba(190,175,255,0.7)' : 'rgba(240,245,255,0.75)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(z.x, z.y - 4, r, r * 0.5, 0, a0, a0 + 2.2); c.stroke(); c.beginPath(); c.ellipse(z.x, z.y - 4, r, r * 0.5, 0, a0 + Math.PI, a0 + Math.PI + 2.2); c.stroke(); } c.restore(); },
});
// ---------- the zones on the host ----------
Object.assign(HAZSIM, {
  // a tornado drifts at the crowd, pulls foes in, carries them up and round, and throws them out
  twister(z, dt, tick) {
    const A = ARENA, R = z._r || (z._r = []);
    if (z.spd) { if ((z.aimT = (z.aimT || 0) - dt) <= 0) { z.aimT = 1; const d = densest(live(G.mons), 40, z, 260); if (d) { const a = angTo(z.x, z.y, d.x, d.y); z.vx = Math.cos(a) * z.spd; z.vy = Math.sin(a) * z.spd * 0.7; } } z.x = clamp(z.x + (z.vx || 0) * dt, A.x0 + 10, A.x1 - 10); z.y = clamp(z.y + (z.vy || 0) * dt, A.y0 + 8, A.y1 - 6); }
    for (const u of G.mons) {
      if (u.dead || u.spawnT > 0 || u.carried || u.frozen > 0) continue; const d = dist(z.x, z.y, u.x, u.y); if (d > z.pull) continue;
      if (d < z.r + u.r && !u.boss && R.length < z.cap) { u.carried = 1; u.air = 1; u.state = null; u.vx = u.vy = 0; R.push({ u, a: angTo(z.x, z.y, u.x, u.y), h: u.z, t: 0, ride: z.ride * rand(0.8, 1.2) }); hurt(u, z.dmg, z.src, { elem: 'wind' }); continue; }
      const a = angTo(u.x, u.y, z.x, z.y) + 0.6, k = z.suck * (u.boss ? 0.15 : 1) * (1 - 0.5 * d / z.pull); u.kx += Math.cos(a) * k * dt; u.ky += Math.sin(a) * k * 0.7 * dt;
    }
    const ending = z.t > z.life - 0.2;
    for (const r of R) {
      const u = r.u; if (u.dead) { u.carried = 0; u.air = 0; r.done = true; continue; }
      r.t += dt; r.a += dt * (4 + r.t * 2.5); r.h = Math.min(z.top, r.h + dt * z.top / 0.9); const f = r.h / z.top, rad = lerp(z.r * 0.35, z.r * 1.1, f * f), sway = Math.sin(G.time * 2.3 + f * 3.2) * 7 * f;
      u.x = z.x + sway + Math.cos(r.a) * rad; u.y = z.y + Math.sin(r.a) * rad * 0.3; u.z = r.h; u.vz = 0; u.kx = u.ky = 0; u.face = Math.sin(r.a) > 0 ? 1 : -1; u.moving = true;
      if (tick) hurt(u, z.dmg * 0.6, z.src, { elem: 'wind', quiet: true });
      if (r.t >= r.ride || ending) { fling(u, r.a + 1.3, z.big ? 300 : 220, z.drop, z.src); r.done = true; }
    }
    removeIf(R, r => r.done);
    if (z.lightning && (z.zapT = (z.zapT || 0) - dt) <= 0) { z.zapT = z.lightning; const t = R.length ? pick(R).u : pick(live(G.mons)); if (t) { HFX.skyBolt(t.x, t.y + t.z * 0.3); zapHit(t, z.src, z.zap); } }
  },
  blade(z, dt) {
    z.x += z.vx * dt; z.y += z.vy * dt; if (!inArena(z.x, z.y)) { z.dead = true; return; }
    for (const u of G.mons) { if (u.dead || u.spawnT > 0 || u.carried === 2 || z.hit.has(u) || dist(z.x, z.y, u.x, u.y) > u.r + 7 * (z.s || 1)) continue; z.hit.add(u); hurt(u, z.dmg, z.src, { elem: 'wind', kx: z.vx * 0.35, ky: z.vy * 0.35 }); if (z.hit.size >= z.pierce) { z.dead = true; HFX.thud(z.x, z.y); return; } }
  },
  eye(z, dt, tick) {
    const s = z.src; if (alive(s)) { z.x = s.x; z.y = s.y; } else { z.dead = true; return; }
    if (!tick) return; for (const u of within(z.x, z.y, z.r, G.mons)) { if (u.carried) continue; const a = angTo(z.x, z.y, u.x, u.y); hurt(u, z.dmg, s, { elem: 'wind', quiet: true, kx: Math.cos(a) * z.push, ky: Math.sin(a) * z.push * 0.7 }); if (!u.boss) { u.windT = 0.7; u.windDmg = z.slam; u.windSrc = s; } }
  },
});

// ---------- Voltaire's spells ----------
function twister(h, o) { const z = hazard({ k: 'twister', x: o.x, y: o.y, r: o.r, pull: o.pull, suck: o.suck || 220, cap: o.cap, top: o.top, ride: o.ride, spd: o.spd || 0, dmg: o.dmg, drop: o.drop, big: o.big ? 1 : 0, lightning: o.lightning || 0, zap: o.zap || 0, life: o.life, rate: 0.4, src: h }); HFX.twisterStart(o.x, o.y, o.big ? 2 : 1); return z; }
function windBlade(h, t) { const m = md('WIND BLADE'), a0 = angTo(h.x, h.y, t.x, t.y), n = 1 + m.count; for (let i = 0; i < n; i++) { const a = a0 + (n > 1 ? (i / (n - 1) - 0.5) * 0.5 : 0); hazard({ k: 'blade', x: h.x + Math.cos(a) * 6, y: h.y + Math.sin(a) * 4, vx: Math.cos(a) * 230, vy: Math.sin(a) * 170, s: m.size, pierce: 3 + (m.f.pierce ? 3 : 0), dmg: D(h) * 0.8 * m.dmg, life: 1, src: h }); } SFX.whoosh(panOf(h.x)); }
function gale(h, t) { const m = md('GALE'), a = angTo(h.x, h.y, t.x, t.y); h.lunge = 0.15; h.la = a; HFX.whoosh(h.x, h.y, a, 0.55 * m.size, 60 * m.size); blow(h, h.x, h.y, a, 0.6 * m.size, 60 * m.size, m.f.hurl ? 420 : 260, D(h) * 0.55 * m.dmg, D(h) * 0.7 * m.dmg); }
function whoosh(h, t) { const m = md('WHOOSH'), a = angTo(h.x, h.y, t.x, t.y); h.lunge = 0.25; h.la = a; for (let k = 0; k <= m.count; k++) after(k * 0.3, () => { if (!alive(h)) return; HFX.whoosh(h.x, h.y, a, 0.9 * m.size, 110 * m.size); blow(h, h.x, h.y, a, 0.9 * m.size, 110 * m.size, 440, D(h) * 0.9 * m.dmg, D(h) * 1.5 * m.dmg * (m.f.slam ? 2 : 1)); }); }
function dustDevil(h, t) { const m = md('DUST DEVIL'); twister(h, { x: t.x, y: t.y, r: 14 * m.size, pull: 44 * m.size, cap: 2 + m.count, top: 34, ride: 1.2, spd: 40, dmg: D(h) * 0.45 * m.dmg, drop: D(h) * 0.9 * m.dmg, life: 4 * m.dur }); }
function crosswind(h, p) {
  const m = md('CROSSWIND'), R = 50 * m.size; HFX.crosswind(p.x, p.y, R);
  for (const u of within(p.x, p.y, R, G.mons)) { if (u.carried) continue; u.kx += Math.sign(p.x - u.x || 1) * (u.boss ? 40 : 300); u.ky += (p.y - u.y) * 2; }
  after(0.28, () => { const ts = within(p.x, p.y, 28 * m.size, G.mons), n = ts.length; HFX.crush(p.x, p.y); for (const u of ts) hurt(u, D(h) * (0.7 + 0.15 * n) * m.dmg, h, { elem: 'wind', stun: m.f.daze ? 1.2 : 0.6 }); });
}
function tornado(h, t) { const m = md('TORNADO'); for (let k = 0; k <= m.count; k++) { const a = rand(TAU); twister(h, { x: t.x + (k ? Math.cos(a) * 30 : 0), y: t.y + (k ? Math.sin(a) * 20 : 0), r: 22 * m.size, pull: 72 * m.size, cap: 5, top: 60, ride: 1.6, spd: 30, dmg: D(h) * 0.55 * m.dmg, drop: D(h) * 1.7 * m.dmg, life: 5 * m.dur }); } }
function downdraft(h, p) { const m = md('DOWNDRAFT'), R = 50 * m.size; HFX.downdraft(p.x, p.y, R); after(0.25, () => { HFX.downdraftHit(p.x, p.y, R); for (const u of within(p.x, p.y, R, G.mons)) { const a = angTo(p.x, p.y, u.x, u.y); if (u.carried === 1 && u.air) { u.z = Math.min(u.z, 4); } hurt(u, D(h) * 1.6 * m.dmg, h, { elem: 'wind', stun: 0.8 * m.dur, kx: Math.cos(a) * 280, ky: Math.sin(a) * 200 }); if (!u.boss) { u.windT = 0.8; u.windDmg = D(h) * 0.8; u.windSrc = h; } } }); }
function eyeOfTheStorm(h) { const m = md('EYE OF THE STORM'); hazard({ k: 'eye', x: h.x, y: h.y, r: 46 * m.size, push: m.f.gale ? 420 : 280, dmg: D(h) * 0.3 * m.dmg, slam: D(h) * 0.9 * m.dmg, life: 5 * m.dur, rate: 0.2, src: h }); HFX.whoosh(h.x, h.y, 0, Math.PI, 46 * m.size); }
function hurricane(h) { const m = md('HURRICANE'), d = densest(live(G.mons), 50, h, 300) || h; banner('HURRICANE', h); twister(h, { x: d.x, y: d.y, r: 34 * m.size, pull: 150 * m.size, suck: 300, cap: 10 + m.count, top: 85, ride: 2.2, spd: 22, dmg: D(h) * 0.6 * m.dmg, drop: D(h) * 2.6 * m.dmg, big: true, lightning: m.f.storm ? 0.45 : 0, zap: D(h) * 1.2, life: 6 * m.dur }); }
function thunderclap(h) { const m = md('THUNDERCLAP'), R = 80 * m.size; banner('THUNDERCLAP', h); HFX.thunderclap(h.x, h.y, R); for (const u of within(h.x, h.y, R, G.mons)) { const a = angTo(h.x, h.y, u.x, u.y); hurt(u, D(h) * 2.2 * m.dmg, h, { elem: 'bolt', stun: 1, kx: Math.cos(a) * 380, ky: Math.sin(a) * 270 }); if (!u.boss) { u.windT = 0.9; u.windDmg = D(h) * 1.2; u.windSrc = h; } } }
function tempest(h) {
  const m = md('TEMPEST'), A = ARENA; banner('TEMPEST', h); G.ambDark = 1; flash('storm', 0.5); quake(1.4, 0.5);
  twister(h, { x: A.pw / 2, y: (A.y0 + A.y1) / 2, r: 50, pull: 1000, suck: 320, cap: 40, top: 115, ride: 99, spd: 0, dmg: D(h) * 0.8 * m.dmg, drop: D(h) * 4 * m.dmg, big: true, lightning: 0.3 / (1 + m.count * 0.5), zap: D(h) * 1.6 * m.dmg, life: 7 * m.dur });
}
SPELLBOOK.storm = [
  { name: 'WIND BLADE', lvl: 1, tier: 0, basic: true, cd: 1.1, pick: (h, f) => nearestFoe(h, f, 170), cast: windBlade },
  { name: 'GALE', lvl: 1, tier: 0, basic: true, cd: 1.1, range: 55, pick: (h, f) => nearestFoe(h, f, 64 * md('GALE').size), cast: gale },
  { name: 'SPARK', lvl: 1, tier: 0, basic: true, cd: 1.25, pick: (h, f) => (airborne(f).length ? nearest(h, airborne(f), 170) : null) || nearestFoe(h, f, 160), cast: spark },
  { name: 'WHOOSH', lvl: 2, tier: 1, cd: 5, wind: 0.2, pick: (h, f) => within(h.x, h.y, 70, f).length >= 2 ? nearestFoe(h, f, 70) : null, cast: whoosh },
  { name: 'DUST DEVIL', lvl: 2, tier: 1, cd: 7, wind: 0.25, pick: (h, f) => nearestFoe(h, f, 150), cast: dustDevil },
  { name: 'STATIC CHARGE', lvl: 3, tier: 1, cd: 4, wind: 0.2, pick: (h, f) => nearestFoe(h, f, 80), cast: staticCharge },
  { name: 'CROSSWIND', lvl: 4, tier: 1, cd: 7, wind: 0.3, pick: (h, f) => cluster(h, f, 30, 3, 160), cast: crosswind },
  { name: 'TORNADO', lvl: 5, tier: 2, cd: 10, wind: 0.4, pick: (h, f) => cluster(h, f, 30, 3, 170) || nearestFoe(h, f, 120), cast: tornado },
  { name: 'LIGHTNING LANCE', lvl: 6, tier: 2, cd: 7, wind: 0.5, pick: (h, f) => lineTarget(h, f, 170, 2), cast: lightningLance },
  { name: 'DOWNDRAFT', lvl: 7, tier: 2, cd: 8, wind: 0.35, pick: (h, f) => cluster(h, f, 32, 3, 170), cast: downdraft },
  { name: 'EYE OF THE STORM', lvl: 8, tier: 2, cd: 12, wind: 0.3, pick: (h, f) => within(h.x, h.y, 50, f).length >= 3 ? true : null, cast: eyeOfTheStorm },
  { name: 'HURRICANE', lvl: 10, tier: 3, cd: 14, wind: 0.6, pick: (h, f) => f.length >= 6 ? true : null, cast: hurricane },
  { name: 'CHAIN LIGHTNING', lvl: 11, tier: 3, cd: 3.2, wind: 0.55, pick: (h, f) => (airborne(f).length ? nearest(h, airborne(f), 170) : null) || nearestFoe(h, f, 170), cast: (h, t) => chainLightning(h, t) },
  { name: 'THUNDERCLAP', lvl: 12, tier: 3, cd: 11, wind: 0.5, pick: (h, f) => within(h.x, h.y, 70, f).length >= 4 ? true : null, cast: thunderclap },
  { name: 'TEMPEST', lvl: 15, tier: 4, wind: 1, pick: (h, f) => f.length >= 5 || G.boss ? true : null, cast: tempest },
];
Object.assign(SPELL_INFO, {
  'WIND BLADE': 'A crescent of wind that cuts through three foes', 'GALE': 'A close gust that throws foes back', 'SPARK': 'A bolt that jumps to a second foe; airborne foes take 50% more',
  'WHOOSH': 'A great gust hurls everything in front of you away; foes that hit a wall take the slam', 'DUST DEVIL': 'A small whirlwind that picks up two foes and drops them', 'STATIC CHARGE': 'Shock everything close by', 'CROSSWIND': 'Winds from both sides smash a crowd together',
  'TORNADO': 'A tornado that sucks foes in, spins them up in a spiral and flings them out', 'LIGHTNING LANCE': 'A piercing line of lightning', 'DOWNDRAFT': 'A column of air slams a crowd flat and scatters it', 'EYE OF THE STORM': 'A ring of wind around you throws back anything that comes close',
  'HURRICANE': 'A huge storm that drags in half the room and hurls it high', 'CHAIN LIGHTNING': 'Lightning that leaps from foe to foe; airborne foes take 50% more', 'THUNDERCLAP': 'Lightning strikes you and the blast hurls everything away',
  'TEMPEST': 'A cyclone swallows the whole horde, lightning strikes the spinning mass, then it is flung at the walls',
});
Object.assign(MODS, {
  'WIND BLADE': [['TWIN BLADES', 'Two blades in a fan', { count: 1 }], ['KEEN EDGE', 'Cuts through six foes', { f: 'pierce' }], ['SHARP WIND', '+45% damage', { dmg: 1.45 }]],
  'GALE': [['WIDE GALE', 'Wider and longer', { size: 1.35 }], ['HURL', 'Throws foes much farther', { f: 'hurl' }], ['BITING WIND', '+45% damage', { dmg: 1.45 }]],
  'WHOOSH': [['DOUBLE WHOOSH', 'A second gust follows', { count: 1 }], ['WALL BREAKER', 'Wall slams hit twice as hard', { f: 'slam' }], ['WIDE WHOOSH', '40% wider and farther', { size: 1.4 }]],
  'DUST DEVIL': [['WHIRLING', 'Carries two more foes', { count: 2 }], ['BIG DEVIL', 'Bigger whirlwind', { size: 1.4 }], ['LONG WIND', 'Lasts 60% longer', { dur: 1.6 }]],
  'CROSSWIND': [['GALE FORCE', 'Bigger area', { size: 1.4 }], ['DAZE', 'Stuns twice as long', { f: 'daze' }], ['HARD CRUSH', '+50% damage', { dmg: 1.5 }]],
  'TORNADO': [['TWIN TWISTERS', 'A second tornado', { count: 1 }], ['WIDE FUNNEL', 'Bigger tornado', { size: 1.35 }], ['LONG SPIN', 'Lasts 50% longer', { dur: 1.5 }]],
  'DOWNDRAFT': [['WIDE DRAFT', 'Radius +40%', { size: 1.4 }], ['FLATTEN', 'Stuns 60% longer', { dur: 1.6 }], ['CRUSHING AIR', '+50% damage', { dmg: 1.5 }]],
  'EYE OF THE STORM': [['STILL CENTRE', 'Lasts 50% longer', { dur: 1.5 }], ['WIDE EYE', 'Radius +35%', { size: 1.35 }], ['HOWLING WALL', 'Throws foes much farther', { f: 'gale' }]],
  'HURRICANE': [['STORM CELL', 'Lightning strikes the funnel', { f: 'storm' }], ['CATEGORY FIVE', 'Bigger and carries five more', { size: 1.3, count: 5 }], ['LONG STORM', 'Lasts 50% longer', { dur: 1.5 }]],
  'THUNDERCLAP': [['ROLLING THUNDER', 'Radius +40%', { size: 1.4 }], ['DEAFENING', '+50% damage', { dmg: 1.5 }], ['QUICK STORM', 'Cooldown -40%', { cd: 0.6 }]],
  'TEMPEST': [['EYE OF GOD', '+50% damage', { dmg: 1.5 }], ['STORM FRONT', 'Lightning strikes twice as often', { count: 2 }], ['ENDLESS GALE', 'Lasts 50% longer', { dur: 1.5 }]],
});
