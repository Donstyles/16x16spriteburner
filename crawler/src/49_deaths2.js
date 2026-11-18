// ===================== the hero's deaths, the second lot: the work of what lives down here =====================
// Dragged into the dark by the feeders, raised by a necromancer's soul-fire, drained to a husk under a cloud of bats or
// carried off by them. (48_deaths has the first lot, the death's length, name, camera and how it is chosen.) The
// creatures at work on him are scripted while they are (f.script: 53_foes foeTick runs its tick instead of their own
// mind), they are always drawn (34_sight foeShown), they keep apart from no one (50_actors separate), and a bat at it
// flies as it is told (60_run, no flyTick).

// ---- shared: the lamp left where he fell. For the deaths that take him away, his lamp stays on the floor where he
// fell (70_render renderLight lights it there, not on him), so he goes out of its light: he and whatever takes him
// fade as they go into the dark (70_render drawUnit), full in the lamp's light, gone well out of it.
function darkFade(u) {
  const v = u.vanishT === undefined ? 1 : clamp(1 - (G.time - u.vanishT) / 0.6, 0, 1); // (vanishT: taken into the shadows wherever it is, a wall having stopped it short of the dark)
  const h = u.team === 'hero' ? u : u.script ? u.script.h : null; if (!h || !h.dead || !h.lampAt) return v;
  const R = h.lightR || 78, d = Math.hypot(u.x - h.lampAt.x, u.y - (u.z || 0) - (u.lift || 0) - h.lampAt.y);
  return Math.min(v, clamp(1 - (d - R * 0.55) / (R * 0.6), 0, 1));
}
// the way (of those given, angles) with the longest clear floor ahead of him, no wall and no pit: into the dark
function darkest(h, dirs) {
  let best = dirs[0], bl = -1;
  for (const a of dirs) { let l = 0; while (l < 170) { const x = h.x + Math.cos(a) * (l + 4), y = h.y + Math.sin(a) * (l + 4) * 0.8; if (solidAt(x, y) || (ARENA.pitN && pitAt(x, y))) break; l += 4; } if (l > bl) { bl = l; best = a; } }
  return best;
}
// a free spot about r from him (for one brought on: the test room, the bats out of the dark)
function spotNear(h, r0, r1) { for (let i = 0; i < 24; i++) { const a = rand(TAU), r = rand(r0, r1), x = h.x + Math.cos(a) * r, y = h.y + Math.sin(a) * r * 0.75; if (!solidAt(x, y) && !(ARENA.pitN && pitAt(x, y))) return { x, y }; } return { x: h.x + r0, y: h.y }; }
function moreCam(h, D, t) {
  const L = h.lampAt || h;
  if (D.kind === 'drag') return { x: L.x + D.dir * 14 * ease(t / 5), y: L.y - 5, z: 1.25 + 0.35 * ease(t / 6), r: 1.4 }; // held at his lamp, leaning a little after him into the dark
  if (D.kind === 'carried') return { x: L.x + (h.x - L.x) * 0.3, y: L.y - 6 - Math.min(26, (h.z || 0) * 0.35), z: 1.3, r: 1.4 }; // at his lamp, looking up after him
  const S = D.skel; if (S && !S.dead && t >= RAISE_D.burst) return { x: S.x, y: S.y - 8, z: 1.75, r: 1.6 }; // after the skeleton
  return { x: h.x, y: h.y - 9, z: 1.3 + 0.6 * ease((t - 0.3) / 2.7), r: 1.8 }; // in on him as it takes hold
}

// ---- dragged into the dark. Dying with a carcass feeder or a ghoul about, he goes down; they go round to his feet and
// take him by the ankles and haul him off, backwards, in heaves, feet first, into the dark, his blood smeared along the
// floor behind him, his lamp left burning where he fell. Out of its light, the sounds of it: tearing, crunching, chewing.
// Then something comes rolling back into the light: his skull.
const DRAGGERS = /CarcassFeeder|SandGhoul|MutilatedStumbler|GraveRevenant/, DRAG = { lie: 0.5, pull: 1.9, far: 96 };
function draggersAround(h) { return G.foes.filter(f => !f.dead && !f.dying && !f.fall && !f.feed && !f.script && DRAGGERS.test(f.spr) && dist(f.x, f.y, h.x, h.y) < 140).sort((a, b) => dist(a.x, a.y, h.x, h.y) - dist(b.x, b.y, h.x, h.y)).slice(0, 2); }
function dragPose(t) { return { lie: t > DRAG.lie, dip: t > 0.1 && t <= DRAG.lie ? 2 : 0, jit: 0 }; }
function dragStart(h) {
  const D = h.death, dir = Math.cos(darkest(h, [0, Math.PI])) > 0 ? 1 : -1; // (lying, he goes feet first, so along the floor one way or the other)
  D.dir = dir; h.face = dir; h.lampAt = { x: h.x, y: h.y }; dropWeapon(h, 0.7);
  D.V = draggersAround(h); D.V.forEach((f, i) => { f.script = { h, tick: dragFoe, slot: i, at: false }; f.act = null; });
}
function dragFoe(f, dt) { // round to his feet, an ankle each; then hauling him, walking backwards with each heave; in the dark, at their meal
  const S = f.script, h = S.h, D = h.death; if (!h.dead || !D || D.kind !== 'drag') { f.script = null; f.vanishT = undefined; return; }
  const L = lieOf(h.spr, h.scale || 1), tx = h.x + D.dir * (L.half + 7 + S.slot * 3), ty = h.y + (S.slot ? -3 : 2);
  if (!S.at) { const d = steer(f, tx, ty, f.def.spd * 1.5, dt, 1.5); f.moving = true; f.face = tx < f.x ? -1 : 1; if (d <= 2.5 && h.deadT > DRAG.lie) { S.at = true; SFX.squelch(panOf(f.x), false); } return; }
  f.x = tx + (D.gone ? randi(-1, 1) : 0); f.y = ty; f.vx = f.vy = 0; f.face = D.dir > 0 ? -1 : 1; f.moving = !!D.heave || !!D.gone;
}
function dragTick(h, dt) {
  const D = h.death, t = h.deadT, L = h.lampAt, pan = panOf(h.x), ready = D.V.length && D.V.every(f => f.dead || (f.script && f.script.at));
  if (!D.gone && ready && t > DRAG.pull) {
    if (D.heave) { // a heave: he slides a few pixels, feet first, smearing his blood behind him
      const H = D.heave, s = Math.min(H.left, dt), x0 = h.x; slideMove(h, D.dir * H.v * s, H.vy * s); H.left -= s;
      if (Math.abs(h.x - x0) < 0.01) D.stuck = (D.stuck || 0) + dt;
      if (bleeds(h) && (D.smear = (D.smear || 0) + Math.abs(h.x - x0)) > 1.2) { D.smear = 0; bloodMark(h.x - D.dir * 3, h.y + rand(-1, 1), 2.5, 'red'); if (chance(0.18)) pool(h.x - D.dir * 4, h.y, 'red', 0.5); } // (close together, so it runs into one smear)
      if (H.left <= 0) D.heave = null;
    } else if ((D.heaveT = (D.heaveT || 0) - dt) <= 0) { D.heaveT = rand(0.22, 0.4); D.heave = { left: 0.16, v: rand(8, 12) / 0.16, vy: rand(-6, 6) }; SFX.stride(pan, 0, true); if (chance(0.5)) SFX.squelch(pan, false); }
    if (dist(h.x, h.y, L.x, L.y) > DRAG.far || (D.stuck || 0) > 0.3) { D.gone = t; D.heave = null; }
  }
  if (!D.gone && t > 7.5) D.gone = t; // (whatever happens, they have him in the dark by now)
  if (!D.gone) return;
  if (h.vanishT === undefined && darkFade(h) > 0) { h.vanishT = G.time; for (const f of D.V || []) if (f.vanishT === undefined) f.vanishT = G.time; } // (stopped short of the dark by a wall: the shadows take him there, them with him, before anything comes back)
  if (chance(dt * 6)) SFX.squelch(pan, chance(0.3)); if (chance(dt * 2.5)) SFX.bone(pan, chance(0.4)); if (chance(dt * 4)) SFX.tick(pan); // the sounds of it, out of the dark
  if (bleeds(h) && chance(dt * 3)) for (let j = 0; j < 3; j++) part({ k: 'gore', x: h.x + rand(-4, 4), y: h.y, z: rand(1, 4), vx: rand(-30, 30), vy: rand(-15, 15), vz: rand(20, 60), g: 420, life: 5, s0: 1, col: pick(BLOOD.red), kind: 'red' });
  if (!D.tossed && t > D.gone + 1.4) { // and something comes rolling back into the light
    D.tossed = true; const a = angTo(h.x, h.y, L.x, L.y), d = dist(h.x, h.y, L.x, L.y); tossBit('skull', h.x, h.y, { tick: true, upright: true, z: 6, up: 55, lie: 99 });
    const r = FX.rocks[FX.rocks.length - 1], v = Math.max(50, (d - 8) / 0.42); r.vx = Math.cos(a) * v; r.vy = Math.sin(a) * v * 0.75; r.bleed = bleeds(h) ? 'red' : null; SFX.toss(pan);
  }
}

// ---- raised. Killed by a necromancer's soul-fire, he does not fall: he stands, still; then he starts to twitch, faster
// and harder as it takes hold of him, green motes rising off him; then it tears him apart from inside, and what is left
// standing where he stood is his skeleton. A few moments, and it starts to walk: to its master, or off into the dark.
const RAISE_D = { twitch: 0.7, burst: 3.0, wake: 4.8 };
function raisedPose(t) {
  const k = clamp((t - RAISE_D.twitch) / (RAISE_D.burst - RAISE_D.twitch), 0, 1), n = (G.time * (14 + 40 * k)) | 0, on = t > RAISE_D.twitch && (n * 7919) % 11 < 2 + 7 * k;
  return { lie: false, dip: on && k > 0.5 && n % 3 === 0 ? 1 : 0, jit: on ? (n % 2 ? 1 : -1) * (k > 0.75 && n % 4 === 0 ? 2 : 1) : 0 };
}
function raisedStart(h, o) { const D = h.death; D.caster = o.caster && !o.caster.dead && o.caster.team === 'foe' ? o.caster : null; circleFx(h.x, h.y, 11, 'poison', RAISE_D.burst + 0.4); glows(h.x, h.y, 10, 14, 'poison', 40, 2.5, 0.8); SFX.hex(panOf(h.x), true); }
function raisedTick(h, dt) {
  const D = h.death, t = h.deadT, p = t - dt, R = RAISE_D, pan = panOf(h.x);
  if (t < R.burst) { // the soul-fire working in him
    const k = clamp((t - R.twitch) / (R.burst - R.twitch), 0, 1);
    if (chance(dt * (8 + 30 * k))) part({ k: 'glow', x: h.x + rand(-5, 5), y: h.y, z: rand(2, 14), vz: rand(10, 30), drag: 2, life: 0.7, s0: 1.6, s1: 0.3, col: 'poison', a0: 0.8, a1: 0 });
    if (t > R.twitch && chance(dt * (2 + 6 * k))) SFX.tick(pan);
    if (k > 0.6 && chance(dt * 10)) flashLight(h.x, h.y - 8, 18 + 20 * k, 'poison', 0.3 * k, 0.12);
  }
  if (p < R.burst && t >= R.burst) { // it tears him apart, and his skeleton stands there
    heroBurst(h, {}); flashLight(h.x, h.y - 8, 80, 'poison', 1.3, 0.6); glows(h.x, h.y, 10, 24, 'poison', 90, 3, 0.9); SFX.hex(pan, true); shake(0.35);
    const s = mkFoe('grunt', G.floor, h.x, h.y, 'DecrepitBones'); Object.assign(s, { face: h.face, raisedBy: D.caster, aware: true, state: 'fight', ctest: TEST.gen, script: { h, tick: skelTick } }); s.def.gold = [0, 0];
    G.foes.push(s); G.units.push(s); D.skel = s;
  }
}
function skelTick(f, dt) { // stands where he stood, a green glint in its eyes; then a shamble, to its master or off into the dark
  const S = f.script, h = S.h, D = h.death, t = h.deadT || 0; if (!h.dead || !D || D.kind !== 'raised' || t > DEATH_LEN.raised) { f.script = null; return; }
  if (t < RAISE_D.wake) { f.moving = false; f.vx = f.vy = 0; if (chance(dt * 3)) part({ k: 'glow', x: f.x + (f.face < 0 ? -1 : 1), y: f.y, z: headZ(f) - 3, vz: 4, drag: 3, life: 0.4, s0: 1.2, s1: 0, col: 'poison', a0: 0.9, a1: 0 }); return; }
  if (!S.to) { const c = D.caster && !D.caster.dead ? D.caster : null; S.to = c ? { x: c.x + (f.x < c.x ? -14 : 14), y: c.y + 4 } : { x: f.x + (f.face < 0 ? -1 : 1) * 70, y: f.y + rand(-10, 10) }; }
  const d = steer(f, S.to.x, S.to.y, f.def.spd * 0.5, dt, 2); f.moving = d > 2.5; if (f.moving) f.face = S.to.x < f.x ? -1 : 1; if (f.moving && chance(dt * 2.2)) SFX.bone(panOf(f.x), false);
}

// ---- the bats. Dying with bats about (two or more, or killed by one), more of them come out of the dark to it. Half
// the time they cover him where he lies in a flapping cloud (the vermin's heap, 48_deaths, but hovering), and drink;
// out of sight under it he dries to a husk, and when they scatter a bound cadaver, grey and shrivelled, lies there. The other
// half they gather round him and lift him, and carry him off up into the dark, his blood dripping down out of it; his
// lamp burns on where he fell, and the last of him is one drop falling into its light.
const BATD = { back: 6.0 }, BAT_RE = /Bat$/, CARRY = { lie: 0.35, lift: 2.2, rise: 4.2 };
const isBat = f => !f.dead && !f.dying && !f.fall && !f.feed && !f.script && f.fly && BAT_RE.test(f.spr);
function batsAround(h) { return G.foes.filter(f => isBat(f) && dist(f.x, f.y, h.x, h.y) < 150).sort((a, b) => dist(a.x, a.y, h.x, h.y) - dist(b.x, b.y, h.x, h.y)).slice(0, 14); }
function batDeath(h) { const s = h.lastSrc; return batsAround(h).length >= 2 || !!(s && s.spr && BAT_RE.test(s.spr) && s.fly); }
function batsCome(h, n) { // more of them, out of the dark
  const V = batsAround(h), spr = (V[0] && V[0].spr) || 'VampireBat';
  while (V.length < n) { const p = spotNear(h, 100, 140), b = mkFoe('skitter', G.floor, p.x, p.y, spr); Object.assign(b, { aware: true, state: 'fight', tgt: h, ctest: TEST.gen }); b.def.gold = [0, 0]; b.z = 12; G.foes.push(b); G.units.push(b); V.push(b); }
  return V;
}
function batsStart(h) {
  let V = batsCome(h, 8); const need = 2.6 * spritePixels(h.spr).length, bulk = L => L.reduce((n, f) => n + solidOf(f.spr).length, 0);
  while (V.length < 14 && bulk(V) < need) V = batsCome(h, V.length + 1); // (enough of them to hide him)
  dropWeapon(h, 1); heapOn(h, V, BATD.back, [2, 4, 6, 8, 10, 12]); SFX.whoosh(panOf(h.x));
}
function batsTick(h, dt) {
  const D = h.death, t = h.deadT, p = t - dt, V = D.feeders || [], n = V.filter(f => f.feed && f.feed.at && !f.dead).length, pan = panOf(h.x);
  if (!D.heap && t > VERM.hide && t < BATD.back && n >= Math.min(3, V.length)) D.heap = true;
  if (t < BATD.back + 0.8 && chance(dt * 9)) SFX.whoosh(pan + rand(-0.2, 0.2)); // the wingbeats
  if (D.heap && t < BATD.back) { if (chance(dt * 6)) SFX.tick(pan); if (chance(dt * 3)) SFX.squelch(pan, false); if (bleeds(h) && chance(dt * 4)) drip(h.x + rand(-5, 5), h.y, rand(1, 4), 'red', rand(-20, 20), rand(-8, 8)); }
  if (p < BATD.back && t >= BATD.back) { shake(0.06); smoke(h.x, h.y, 2, 'dust', 6, 12, 0.6); } // they scatter
}
function carriedPose(t) { return { lie: t > CARRY.lie, dip: t > 0.1 && t <= CARRY.lie ? 2 : 0, jit: 0 }; }
function carriedStart(h) {
  const D = h.death; h.lampAt = { x: h.x, y: h.y }; dropWeapon(h, 0.8);
  D.a = darkest(h, [0, 1, 2, 3, 4, 5, 6, 7].map(i => i * TAU / 8)); D.V = batsCome(h, 9);
  D.V.forEach((f, i) => { f.script = { h, tick: carryBat, a: i / D.V.length * TAU + rand(-0.3, 0.3), r: rand(5, 11), hz: rand(2, 14), at: false }; f.act = null; f.lift = Math.round(f.z || 12); f.z = 0; });
}
function carryBat(f, dt) { // round him and over him, wheeling, then bearing him up
  const S = f.script, h = S.h, D = h.death; if (!h.dead || !D || D.kind !== 'carried') { f.script = null; return; }
  S.a += dt * 0.8; const tx = h.x + Math.cos(S.a) * S.r, ty = h.y + 1 + Math.sin(S.a) * S.r * 0.5, tz = (h.z || 0) + S.hz + Math.sin(G.time * 9 + S.r) * 1.5;
  if (!S.at) { const d = steer(f, tx, ty, f.def.spd * 2.4, dt, 1); f.face = tx < f.x ? -1 : 1; f.moving = true; f.lift = Math.round(f.lift + (tz - f.lift) * Math.min(1, dt * 4)); if (d < 3) S.at = true; return; }
  f.x = tx; f.y = ty; f.vx = f.vy = 0; f.lift = Math.round(tz); f.moving = true; f.face = Math.cos(S.a) > 0 ? -1 : 1;
}
function carriedTick(h, dt) {
  const D = h.death, t = h.deadT, pan = panOf(h.x), C = CARRY;
  if (t < 7 && chance(dt * 10)) SFX.whoosh(pan + rand(-0.2, 0.2)); if (t > 0.6 && t < 6 && chance(dt * 4)) SFX.tick(pan);
  if (t > C.lift) { // up, and away into the dark
    const u = ease((t - C.lift) / C.rise), sp = 22 * Math.min(1, (t - C.lift) / 1.5); h.z = Math.round(70 * u); h.vz = 0; slideMove(h, Math.cos(D.a) * sp * dt, Math.sin(D.a) * sp * 0.75 * dt);
    if (bleeds(h) && (D.dripT = (D.dripT || 0) - dt) <= 0) { D.dripT = rand(0.12, 0.3); drip(h.x + rand(-3, 3), h.y, h.z + 2, 'red', 0, 0); }
  }
  if (!D.drop && t > 7.2 && bleeds(h)) { D.drop = true; const L = h.lampAt; part({ k: 'gore', x: L.x + rand(-6, 6), y: L.y + rand(-2, 4), z: 90, vx: 0, vy: 0, vz: -20, g: 420, life: 5, s0: 2, col: BLOOD.red[0], kind: 'red' }); } // the last of him: one drop, out of the dark, into the light
}
