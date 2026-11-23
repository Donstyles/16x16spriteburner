// ===================== the casters' spells and the scout's rifle =====================
// The casters fight as the archers do (they keep their distance and line up a clear shot, the shot marked by a red line
// as they aim), but each with its own magic:
// - the lizardfolk scout's rifle: a green glow gathers at the muzzle as he aims, then a fast green laser bolt
// - the goblin occultist's hex: a slow violet orb that wobbles and bends towards you; it curses you (your stamina comes
//   back at a third of its pace for a few seconds, violet motes rising off you meanwhile)
// - the vile witch's poison flask: lobbed in an arc at the spot she aims at (marked on the floor where it will land), it
//   shatters into a bubbling green pool that burns whoever stands in it for a few seconds
// - the merfolk aquamancer's wave: a rolling wall of water that knocks you back and soaks you
// - the adept necromancer raises the dead: a green circle turns on the floor near you and a skeleton claws its way up out
//   of it (no more than two of his at a time); with two up he throws bolts of green soul-fire that bend towards you
// - the elf enchanter wards her own (a stream of green light puts a shimmer round one that takes three blows for it) and
//   throws thorns; her treant comes first: unwarded, it is even odds each turn, and never more than two thorns before
//   she wards it again (her healing is off for now)
// Bolts that fly straight (the laser, the hex, the soul-fire, the thorns) can be parried back like arrows; a wave or a
// flask cannot.
const CAST = { LizardfolkScout: 'laser', GoblinOccultist: 'hex', VileWitch: 'flask', MerfolkAquamancer: 'wave', AdeptNecromancer: 'raise', ElfEnchanter: 'heal', AcidAnt: 'spit', CrimsonImp: 'fire', FlameMagus: 'fire', NovicePyromancer: 'fire', Pyro: 'fire', GnomeAlchemist: 'flask', GnomeMage: 'hex' }; // (fire: a ball of it, that sets alight what it strikes: the magma's imps and mages, 42_magma)
const ENCHANTER_HEALS = false; // her healing is off for now: she wards and throws thorns
const WARD_BLOWS = 3; // a ward takes this many blows before it breaks
const SPELL = {
  laser: { spd: 380, dmg: 1.1, r: 2, life: 1.2, col: 'poison' },
  hex: { spd: 92, dmg: 0.9, r: 3, life: 3.4, home: 1.5, col: 'arcane' },
  soul: { spd: 125, dmg: 1, r: 3, life: 2.6, home: 0.9, col: 'poison' },
  thorn: { spd: 170, dmg: 0.6, r: 2, life: 1.4, col: 'heal' },
  spit: { spd: 150, dmg: 1, r: 2.5, life: 1.6, col: 'poison' },
  wave: { spd: 82, dmg: 0.8, r: 11, life: 2.8, nopar: true, col: 'bolt' },
  fire: { spd: 140, dmg: 0.9, r: 3, life: 2.2, col: 'fire' },
};
const castOf = f => CAST[f.spr];
const RAISE_MAX = 4; // skeletons a necromancer keeps up at once

// --- the aim: what a caster's shot becomes (shoot() asks first)
function castShot(f, dir) {
  const c = castOf(f); if (!c) return false; const t = f.tgt;
  if (c === 'flask') { if (t) lobFlask(f, t); return true; }
  f.shotNext = false; if (c === 'heal') { f.thorns = (f.thorns || 0) + 1; f.pick = undefined; } // (her thorns since she last warded the treant)
  const kind = c === 'raise' ? 'soul' : c === 'heal' ? 'thorn' : c, S = SPELL[kind], pan = panOf(f.x);
  const x = f.x + Math.cos(dir) * 7, y = f.y - 2 + Math.sin(dir) * 4;
  G.proj.push({ k: kind, x, y, z: kind === 'wave' ? 2 : 7, vx: Math.cos(dir) * S.spd, vy: Math.sin(dir) * S.spd * 0.85, team: 'foe', dmg: f.def.dmg * f.dmgMul * S.dmg, src: f, life: S.life, r: S.r, tgt: t, ph: rand(TAU), spell: true, nopar: S.nopar, hit: new Set() });
  if (kind === 'laser') { flashLight(x, y, 16, 'poison', 0.6, 0.08); sparks(x, y, 7, 4, 'poison', 90, 40, dir, 0.6); SFX.laser(pan); }
  else if (kind === 'wave') { splash(x, y, 4, 14, { ang: dir, style: 'arc' }); SFX.splash(pan, true); }
  else if (kind === 'thorn') SFX.whoosh(pan);
  else if (kind === 'spit') SFX.squelch(pan, false);
  else if (kind === 'fire') { glows(x, y, 7, 6, 'fire', 40, 3, 0.4); flashLight(x, y, 24, 'fire', 0.7, 0.15); SFX.fire(pan); }
  else { glows(x, y, 7, 6, S.col, 40, 3, 0.5); SFX.hex(pan, kind === 'soul'); }
  return true;
}
// a glow gathering at the scout's muzzle while he aims (drawn in the glow layer)
function drawCharges(c) {
  for (const f of G.foes) {
    const a = f.act; if (!a || a.k !== 'aim' || f.dead || castOf(f) !== 'laser' || !foeShown(f)) continue;
    const u = clamp(a.t / a.dur, 0, 1), x = f.x + Math.cos(a.dir) * 8, y = f.y - f.z - 7 + Math.sin(a.dir) * 3, s = 1.5 + 3 * u * (0.85 + 0.15 * Math.sin(G.time * 40));
    c.globalAlpha = 0.25 + 0.7 * u; c.drawImage(GLOW.poison, x - s, y - s, s * 2, s * 2); c.globalAlpha = 1;
  }
  for (const f of G.foes) { // a ward: a shimmer round the warded
    if (!f.ward || f.dead || !foeShown(f)) continue; const sc = f.scale || 1, w = 9 * sc, h = 14 * sc, k = (0.35 + 0.15 * Math.sin(G.time * 6 + f.id)) * (0.5 + 0.5 * f.ward / WARD_BLOWS);
    c.strokeStyle = rgba('heal', k); c.lineWidth = 1; c.beginPath(); c.ellipse(f.x, f.y - f.z - h * 0.55, w, h * 0.7, 0, 0, TAU); c.stroke();
    c.globalAlpha = k * 0.5; c.drawImage(GLOW.heal, f.x - w * 1.3, f.y - f.z - h * 1.2, w * 2.6, h * 1.4); c.globalAlpha = 1;
  }
}

// --- bolts in flight (updateProj hands them here first); returns true when it took care of the bolt this frame
function spellStep(p, dt) {
  if (p.k === 'flask') { flaskStep(p, dt); return true; }
  const S = SPELL[p.k]; if (!S) return false;
  if (S.home && p.tgt && !p.tgt.dead && p.team === 'foe') { // bending towards the target
    const a = Math.atan2(p.vy / 0.85, p.vx), want = angTo(p.x, p.y, p.tgt.x, p.tgt.y), na = a + clamp(angDiff(a, want), -S.home * dt, S.home * dt), v = Math.hypot(p.vx, p.vy / 0.85);
    p.vx = Math.cos(na) * v; p.vy = Math.sin(na) * v * 0.85;
  }
  if (p.k === 'hex') { const n = Math.sin(p.life * 9 + p.ph) * 22, a = Math.atan2(p.vy, p.vx) + Math.PI / 2; p.x += Math.cos(a) * n * dt; p.y += Math.sin(a) * n * dt * 0.85; if (chance(dt * 30)) part({ k: 'glow', x: p.x, y: p.y, z: p.z, vz: rand(4, 12), drag: 2, life: 0.5, s0: 1.6, s1: 0.4, col: 'arcane', a0: 0.7, a1: 0 }); }
  else if (p.k === 'spit') { if (chance(dt * 25)) part({ k: 'gore', x: p.x, y: p.y, z: p.z, vx: p.vx * 0.2, vy: p.vy * 0.2, vz: 0, g: 420, life: 5, s0: 1, col: pick(['#7cc030', '#a6e040', '#4c8a18']), kind: 'bug' }); }
  else if (p.k === 'fire') { if (chance(dt * 40)) part({ k: 'glow', x: p.x + rand(-1, 1), y: p.y, z: p.z + rand(-1, 1), vz: rand(4, 14), drag: 2, life: rand(0.25, 0.45), s0: rand(2, 3.2), s1: 0.4, col: pick(['fire', 'fire2', 'ember']), a0: 0.8, a1: 0 }); light(p.x, p.y - p.z, 30, 'fire', 0.7); }
  else if (p.k === 'soul') { if (chance(dt * 30)) part({ k: 'glow', x: p.x + rand(-1, 1), y: p.y, z: p.z, vz: rand(6, 16), drag: 2, life: 0.6, s0: 1.8, s1: 0.3, col: 'poison', a0: 0.7, a1: 0 }); }
  else if (p.k === 'wave') { if (chance(dt * 40)) { const a = Math.atan2(p.vy, p.vx) + Math.PI / 2, o = rand(-10, 10); water(p.x + Math.cos(a) * o, p.y + Math.sin(a) * o * 0.85, rand(3, 8), p.vx * 0.3 + rand(-15, 15), p.vy * 0.3 + rand(-10, 10), rand(20, 60)); } if (chance(dt * 25)) { const a = Math.atan2(p.vy, p.vx) + Math.PI / 2, o = rand(-10, 10); wetSpot(p.x + Math.cos(a) * o, p.y + Math.sin(a) * o * 0.85, rand(6, 10), false, rand(1.5, 2.5)); } }
  return false;
}
// a bolt that struck a wall or ran out
function spellEnd(p) {
  if (p.k === 'laser') { sparks(p.x, p.y, p.z, 8, 'poison', 110, 60); flashLight(p.x, p.y, 26, 'poison', 0.6, 0.1); }
  else if (p.k === 'wave') { splash(p.x, p.y, 4, 26, { spd: 0.9 }); puddle(p.x, p.y, 7, 10); SFX.splash(panOf(p.x), true); }
  else if (p.k === 'hex' || p.k === 'soul') glows(p.x, p.y, p.z, 8, SPELL[p.k].col, 50, 3, 0.5);
  else if (p.k === 'fire') { sparks(p.x, p.y, p.z, 10, 'fire', 110, 70); glows(p.x, p.y, p.z, 5, 'fire', 40, 4, 0.4); flashLight(p.x, p.y, 34, 'fire', 0.8, 0.2); SFX.puff(panOf(p.x)); }
  else if (p.k === 'spit') { let x = p.x, y = p.y; for (let k = 0; k < 16 && solidAt(x, y); k++) { x -= p.vx * 0.003; y -= p.vy * 0.003; } acidSplat(x, y); } // (from just outside the wall it struck: begun inside it, its drops would mark the black rock)
  else sparks(p.x, p.y, p.z, 3, 'heal', 60, 40);
}
// a bolt reached someone: what it does besides the blow
function spellHit(p, u) {
  if (p.k === 'laser') { sparks(u.x, u.y, 8, 10, 'poison', 120, 70); flashLight(u.x, u.y, 30, 'poison', 0.8, 0.12); }
  else if (p.k === 'hex') { glows(u.x, u.y, 10, 10, 'arcane', 50, 3, 0.7); if (u.team === 'hero') { u.curseT = 4; textPop(u.x, u.y, headZ(u) + 4, 'CURSED', 'curse', false); SFX.hex(panOf(u.x), true); } }
  else if (p.k === 'soul') glows(u.x, u.y, 10, 10, 'poison', 50, 3, 0.6);
  else if (p.k === 'fire') { sparks(u.x, u.y, 8, 12, 'fire', 120, 90); flashLight(u.x, u.y - 5, 40, 'fire', 0.9, 0.2); ignite(u, 2.5); }
  else if (p.k === 'spit') acidSplat(u.x, u.y);
  else if (p.k === 'wave') { soak(u); splash(u.x, u.y, 8, 30, { ang: Math.atan2(p.vy, p.vx), style: 'arc' }); u.kx += p.vx * 2.4; u.ky += p.vy * 2.4; }
}
function drawBolt(c, p) { // in the world, sorted with everyone
  const a = Math.atan2(p.vy, p.vx), x = Math.round(p.x), y = Math.round(p.y - p.z);
  if (p.k === 'laser') { for (let i = 0; i < 10; i++) { c.fillStyle = i < 3 ? '#f4ffe0' : i < 6 ? '#9dff5a' : '#3fa02a'; c.fillRect(Math.round(p.x - Math.cos(a) * i), Math.round(p.y - p.z - Math.sin(a) * i), 1, 1); } }
  else if (p.k === 'hex') { c.fillStyle = '#3a1050'; c.fillRect(x - 1, y - 1, 3, 3); c.fillStyle = '#c070ff'; c.fillRect(x - 1, y - 1, 2, 2); c.fillStyle = '#f0d0ff'; c.fillRect(x, y - 1, 1, 1); }
  else if (p.k === 'soul') { c.fillStyle = '#1c3a10'; c.fillRect(x - 1, y - 1, 3, 3); c.fillStyle = '#a0ff50'; c.fillRect(x - 1, y - 1, 2, 2); c.fillStyle = '#e8ffc0'; c.fillRect(x, y - 1, 1, 1); }
  else if (p.k === 'fire') { c.fillStyle = '#e54c00'; c.fillRect(x - 2, y - 1, 4, 3); c.fillRect(x - 1, y - 2, 2, 5); c.fillStyle = '#ff9a2e'; c.fillRect(x - 1, y - 1, 3, 2); c.fillStyle = '#ffe6a0'; c.fillRect(x, y - 1, 1, 1); for (let i = 2; i < 6; i++) { c.fillStyle = i < 4 ? '#ff7f00' : '#a51b00'; c.fillRect(Math.round(p.x - Math.cos(a) * i * 1.3), Math.round(p.y - p.z - Math.sin(a) * i * 1.3), 1, 1); } } // (a ball of fire, its tail behind it)
  else if (p.k === 'spit') { c.fillStyle = '#2a5a10'; c.fillRect(x - 1, y - 1, 3, 3); c.fillStyle = '#8cf040'; c.fillRect(x - 1, y - 1, 2, 2); c.fillStyle = '#e0ffb0'; c.fillRect(x, y - 1, 1, 1); }
  else if (p.k === 'thorn') { c.fillStyle = '#4f7a2a'; for (let i = 0; i < 3; i++) c.fillRect(Math.round(p.x - Math.cos(a) * i), Math.round(p.y - p.z - Math.sin(a) * i), 1, 1); c.fillStyle = '#c8f090'; c.fillRect(x, y, 1, 1); }
  else if (p.k === 'wave') { // a roller, whichever way it goes: along its front the water heaps up, foam on its leading edge, its body trailing back and lower
    const fx = Math.cos(a), fy = Math.sin(a) * 0.85, px = -Math.sin(a), py = Math.cos(a) * 0.85, bob = G.time * 14 + p.ph;
    for (let i = -9; i <= 9; i++) {
      const h = Math.max(1, Math.round(2.5 + 1.2 * Math.sin(bob + i * 0.7) - Math.abs(i) * 0.12)), bx = p.x + px * i, by = p.y + py * i;
      for (let j = 9; j >= 0; j--) { // from the back of its body, low and dark, to the foam at its front, highest
        const wx = Math.round(bx - fx * j), wy = Math.round(by - fy * j), lift = Math.round(h * (1 - j / 10));
        if (lift > 0) { c.fillStyle = j < 4 ? '#2f6aa8' : '#24548a'; c.fillRect(wx, wy - lift + 1, 1, lift); } // the water's face under the crest
        c.fillStyle = j === 0 ? '#eef8ff' : j === 1 ? '#bfe4ff' : j < 4 ? '#8cc8f0' : j < 7 ? '#5a9ad0' : '#3f78b4'; c.fillRect(wx, wy - lift, 1, 1);
      }
    }
  }
  else if (p.k === 'flask') { const s = ((p.t * 14) | 0) % 2; c.fillStyle = '#1a2a10'; c.fillRect(x - 1, y - 2, 3, 4); c.fillStyle = '#80e040'; c.fillRect(x - 1, y - 1 + s, 3, 2 - s); c.fillStyle = '#c8b090'; c.fillRect(x, y - 3, 1, 1); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 1, Math.round(p.y), 3, 1); }
}
function drawSpellGlows(c) { // in the glow layer: they shine in the dark
  for (const p of G.proj) {
    if (!p.spell && p.k !== 'flask') continue; const x = p.x, y = p.y - p.z, a = Math.atan2(p.vy, p.vx);
    if (p.k === 'laser') { // its shine lies on its own pixels, one wide, brightest at the head: a thin bolt, not a beam
      for (let i = 0; i < 10; i++) { c.globalAlpha = 0.75 * (1 - i / 10); c.fillStyle = i < 4 ? '#e8ffd0' : '#7cff40'; c.fillRect(Math.round(x - Math.cos(a) * i), Math.round(y - Math.sin(a) * i), 1, 1); }
      c.globalAlpha = 0.3; c.drawImage(GLOW.poison, x - 3, y - 3, 6, 6);
    }
    else if (p.k === 'spit') { c.globalAlpha = 0.55; c.drawImage(GLOW.poison, x - 5, y - 5, 10, 10); }
    else if (p.k === 'fire') { const s = 6 + Math.sin(G.time * 24 + p.ph); c.globalAlpha = 0.75; c.drawImage(GLOW.fire, x - s, y - s, s * 2, s * 2); }
    else if (p.k === 'hex' || p.k === 'soul') { const s = 6 + Math.sin(G.time * 20 + p.ph); c.globalAlpha = 0.8; c.drawImage(GLOW[SPELL[p.k].col], x - s, y - s, s * 2, s * 2); }
    else if (p.k === 'thorn') { c.globalAlpha = 0.5; c.drawImage(GLOW.heal, x - 4, y - 4, 8, 8); }
    else if (p.k === 'flask') { c.globalAlpha = 0.6; c.drawImage(GLOW.poison, x - 5, y - 5, 10, 10); }
  }
  c.globalAlpha = 1;
}

// --- the witch's flask: thrown up in an arc at a spot (a little ahead of a moving target), marked on the floor
// its track over the floor touches no rock, not even a corner's tip (a strip 5 px wide, walked in 2 px steps)
function trackClear(x0, y0, x1, y1) {
  const L = dist(x0, y0, x1, y1), n = Math.max(1, Math.ceil(L / 2)), nx = L ? -(y1 - y0) / L * 2 : 0, ny = L ? (x1 - x0) / L * 2 : 0;
  for (let i = 1; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); if (solidAt(x, y) || solidAt(x + nx, y + ny) || solidAt(x - nx, y - ny)) return false; }
  return true;
}
function lobFlask(f, t) {
  let tx = t.x + (t.vx || 0) * 0.45, ty = t.y + (t.vy || 0) * 0.45; if (blockAt(tx, ty) || !trackClear(f.x, f.y, tx, ty)) { tx = t.x; ty = t.y; }
  const T = clamp(dist(f.x, f.y, tx, ty) / 120, 0.6, 1.1);
  G.proj.push({ k: 'flask', x: f.x, y: f.y, z: 10, x0: f.x, y0: f.y, x1: tx, y1: ty, t: 0, T, vx: tx - f.x, vy: ty - f.y, team: 'foe', src: f, life: T + 1, r: 0, dmg: 0 });
  teleg(tx, ty, 15, T, 'red'); SFX.whoosh(panOf(f.x));
}
function flaskStep(p, dt) {
  p.t += dt; const u = Math.min(1, p.t / p.T), px = p.x, py = p.y; p.x = lerp(p.x0, p.x1, u); p.y = lerp(p.y0, p.y1, u); p.z = lerp(10, 0, u) + Math.sin(u * Math.PI) * 38;
  if (u < 1 && !trackClear(px, py, p.x, p.y)) { p.x = px; p.y = py; p.z = 0; } // it caught a wall: it bursts there, against the stone
  else if (u < 1) return;
  if (holeAt(p.x, p.y)) { p.dead = true; return; } // (into a pit: gone, no pool)
  p.dead = true; sparks(p.x, p.y, 2, 10, 'white', 90, 60); sparks(p.x, p.y, 2, 14, 'poison', 120, 80); SFX.shatter(panOf(p.x)); SFX.splash(panOf(p.x), false);
  for (let i = 0; i < 18; i++) { const a = rand(TAU), v = rand(30, 90); part({ k: 'glow', x: p.x, y: p.y, z: 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: rand(20, 70), g: 200, life: rand(0.4, 0.8), s0: 1.6, s1: 0.4, col: 'poison', a0: 0.9, a1: 0 }); }
  G.hz.push({ x: p.x, y: p.y, r: 15, t: 0, life: 4.5, dps: (p.src ? p.src.def.dmg * p.src.dmgMul : 11) * 0.8, tick: 0, src: p.src, dir: Math.atan2(p.vy, p.vx) });
}
// the poison pools: they bubble and burn whoever stands in them, then sink away
// Standing in the acid, he is told it is the floor that hurts: each burn hisses and steams at his feet (no blood, a sour
// yellow number, see acidBurn), the first burn of each pool pops ACID over him, the pool ripples out from his feet with
// every burn and bubbles hard round them while he stands in it, and his health bar's edge burns sour green meanwhile.
const inPool = (h, z) => dist(h.x, h.y, z.x, z.y) < z.r && Math.abs(h.y - z.y) < z.r * 0.62;
function updateHazards(dt) {
  for (const h of G.heroes) if (h.acidT > 0) h.acidT -= dt;
  for (const z of G.hz) {
    z.t += dt; const rip = z.rip || (z.rip = []); for (const r of rip) r.t += dt; removeIf(rip, r => r.t >= 0.8);
    for (const h of G.heroes) { // round his feet it seethes
      if (h.dead || !inPool(h, z)) continue; h.acidT = 0.25;
      if (chance(dt * 16)) { const a = rand(TAU), d = rand(2, 7); part({ k: 'glow', x: h.x + Math.cos(a) * d, y: h.y + Math.sin(a) * d * 0.62, z: 0, vz: rand(6, 14), life: rand(0.25, 0.5), s0: rand(1, 2), s1: 2.8, col: 'poison', a0: 0.85, a1: 0 }); }
    }
    if ((z.tick -= dt) <= 0) { z.tick = 0.45; for (const h of G.heroes) if (!h.dead && inPool(h, z)) {
      const d = hurt(h, z.dps * 0.45, { x: z.x, y: z.y, team: 'foe', def: {} }, { ranged: true, poise: 0, unblockable: true, acid: true });
      if (d > 0) { rip.push({ x: h.x, y: h.y, t: 0 }, { x: h.x, y: h.y, t: -0.18 }); if (!(z.told || (z.told = new Set())).has(h)) { z.told.add(h); textPop(h.x, h.y, headZ(h) + 8, 'ACID', 'acid', false, h); } }
    } }
    const bub = z.bub || (z.bub = []); for (const q of bub) q.t += dt;
    for (const q of bub) if (q.t >= q.life) { for (let i = 0; i < 3; i++) part({ k: 'glow', x: q.x + rand(-1, 1), y: q.y, z: 1, vz: rand(10, 22), vx: rand(-8, 8), life: rand(0.25, 0.45), s0: 1.4, s1: 0.4, col: 'poison', a0: 0.9, a1: 0 }); } // it pops
    removeIf(bub, q => q.t >= q.life);
    if (z.t < z.life - 0.6) {
      const R = z.r * 0.8;
      if (chance(dt * 7)) { const a = rand(TAU), d = Math.sqrt(Math.random()) * R * 0.6; bub.push({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d * 0.62, t: 0, life: rand(0.5, 1.1), s: rand(0.8, 2.6) }); }
      if (chance(dt * 2.5)) smoke(z.x + rand(-R * 0.5, R * 0.5), z.y + rand(-2, 2), 1, 'green', 4, 3, 1.8, 9); // fumes
      if (chance(dt * 2.5)) { const a = rand(TAU), d = Math.sqrt(Math.random()) * R * 0.8; part({ k: 'glow', x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d * 0.62, z: 0, vz: rand(6, 12), life: rand(0.3, 0.6), s0: rand(0.8, 1.4), s1: 1.6, col: 'poison', a0: 0.6, a1: 0 }); } // a mote of it rising
    }
  }
  for (const z of G.hz) if (z.t >= z.life) splat(z.x, z.y, '#26361a', 7, z.r * 0.55); // spent: a dark stain where it lay
  removeIf(G.hz, z => z.t >= z.life);
}
// a burn from the acid underfoot: steam and spatter off his feet and a hiss, where a blow would draw blood
function acidBurn(u) {
  smoke(u.x, u.y, 3, 'green', 4, 8, 0.7, 20);
  for (let i = 0; i < 5; i++) { const a = rand(TAU), v = rand(15, 40); part({ k: 'gore', x: u.x + rand(-3, 3), y: u.y, z: rand(1, 3), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: rand(25, 55), g: 420, life: 1.5, s0: 1, col: pick(['#a6e040', '#d8f060', '#7cc030']), kind: 'bug' }); }
  sparks(u.x, u.y, 3, 4, 'poison', 50, 40); SFX.sizzle(panOf(u.x));
}
// The witch's spill is painted the way blood pools are: a cluster of wet blobs, the deepest green under and brighter on
// top, so its edge comes out ragged; splashes thrown on in the way the flask flew; bits of the flask's glass lying in it.
// It is alive while it lasts: bubbles swell and pop on it, a few glints of sheen drift over it, it fumes and casts a faint
// green light of its own; spent, it shrinks away and leaves a dark stain on the stone.
const ACID = { deep: '#2a6a0c', mid: '#4cb618', bright: '#7ee02c', sheen: '#c2f56a', glint: '#f0fcc4', glass: ['#dcefe4', '#a2c2b0'] };
function spillOf(z) {
  if (z.sp) return z.sp; const r = z.r, B = [], S = [], GL = [], dir = z.dir === undefined ? rand(TAU) : z.dir;
  B.push({ x: 0, y: 0, rx: r * 0.72, ry: r * 0.44, c: 'deep', a: 0.9 }); // its body
  for (let i = 0; i < 11; i++) { const a = rand(TAU), d = rand(0.45, 0.8) * r, br = rand(2.6, 5) * r / 15; B.push({ x: Math.cos(a) * (d - br * 0.6), y: Math.sin(a) * (d - br * 0.6) * 0.62, rx: br, ry: br * 0.72, c: 'deep', a: rand(0.8, 0.95) }); } // lumps that make its edge
  for (let i = 0; i < 8; i++) { const a = rand(TAU), d = Math.sqrt(Math.random()) * r * 0.5, br = rand(2, 3.8) * r / 15; B.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.62, rx: br, ry: br * 0.72, c: 'mid', a: rand(0.75, 0.95) }); }
  for (let i = 0; i < 4; i++) { const a = rand(TAU), d = Math.sqrt(Math.random()) * r * 0.32, br = rand(1.2, 2.4) * r / 15; B.push({ x: Math.cos(a) * d - r * 0.12, y: Math.sin(a) * d * 0.62 - r * 0.08, rx: br, ry: br * 0.7, c: 'bright', a: rand(0.7, 0.9) }); } // brighter on top, towards the light
  for (let i = 0; i < 9; i++) { const a = dir + rand(-1, 1) * (chance(0.3) ? 2.6 : 0.9), d = rand(0.9, 1.35) * r; S.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.62, r: rand(0.6, 1.5) }); } // splashes, most of them on in the way it flew
  for (let i = 0; i < 4; i++) { const a = rand(TAU), d = rand(0.15, 0.75) * r; GL.push({ x: Math.round(Math.cos(a) * d), y: Math.round(Math.sin(a) * d * 0.62), c: pick(ACID.glass), w: chance(0.4) ? 2 : 1 }); } // the flask's glass
  return (z.sp = { B, S, GL });
}
function drawHazards(c) { // on the floor, under everyone
  for (const z of G.hz || []) {
    const sp = spillOf(z), land = Math.min(1, z.t / 0.22), k = Math.min(1, (z.life - z.t) / 0.8), s = (0.35 + 0.65 * land) * (0.75 + 0.25 * k), X = z.x, Y = z.y;
    for (const b of sp.B) { c.globalAlpha = b.a * k; c.fillStyle = ACID[b.c]; c.beginPath(); c.ellipse(X + b.x * s, Y + b.y * s, b.rx * s, b.ry * s, 0, 0, TAU); c.fill(); }
    if (land >= 1) { c.fillStyle = ACID.mid; for (const q of sp.S) { c.globalAlpha = 0.9 * k; c.beginPath(); c.ellipse(X + q.x, Y + q.y, q.r, q.r * 0.75, 0, 0, TAU); c.fill(); } }
    c.globalAlpha = k;
    for (const g of sp.GL) { c.fillStyle = g.c; c.fillRect(Math.round(X + g.x * s), Math.round(Y + g.y * s), g.w, 1); }
    for (let i = 0; i < 3; i++) { // sheen drifting on it
      const a = G.time * 0.5 + i * 2.1 + z.x * 0.1, gx = Math.round(X + Math.cos(a) * z.r * 0.38 * s), gy = Math.round(Y + Math.sin(a * 1.3) * z.r * 0.2 * s);
      c.fillStyle = ACID.sheen; c.fillRect(gx - 1, gy, 3, 1); c.fillStyle = ACID.glint; c.fillRect(gx, gy, 1, 1);
    }
    for (const q of z.bub || []) { // bubbles: swelling, a lit top, then gone
      const u = q.t / q.life, rr = q.s * Math.min(1, u * 1.3), bx = Math.round(q.x), by = Math.round(q.y);
      if (rr < 1.2) { c.fillStyle = ACID.bright; c.fillRect(bx, by - 1, 2, 2); c.fillStyle = ACID.glint; c.fillRect(bx, by - 1, 1, 1); }
      else { const d = Math.round(rr); c.fillStyle = ACID.deep; c.fillRect(bx - d, by - d, d * 2 + 1, d + 1); c.fillStyle = ACID.bright; c.fillRect(bx - d + 1, by - d, d * 2 - 1, d); c.fillStyle = ACID.glint; c.fillRect(bx - d + 1, by - d, 1, 1); }
    }
    c.globalAlpha = 1;
    for (const q of z.rip || []) { if (q.t < 0) continue; const u = q.t / 0.8, Rr = 5 + 15 * (1 - (1 - u) * (1 - u)); c.strokeStyle = `rgba(240,252,196,${0.9 * (1 - u) * k})`; c.lineWidth = 1; c.beginPath(); c.ellipse(q.x, q.y + 1, Rr, Rr * 0.62, 0, 0, TAU); c.stroke(); } // two ripples out from his feet
    light(X, Y, z.r * 2.2, 'poison', 0.4 * k); // a faint green light of its own
  }
}

// --- spells cast rather than thrown: the necromancer's raising, the enchanter's tending
function castMind(f, t, dt, d, sees) {
  const c = castOf(f); if (f.cdT > 0) return false;
  if (c === 'raise') {
    f.raised = (f.raised || []).filter(u => !u.dead); if (f.raised.length) f.massTried = false;
    if (f.raised.length >= RAISE_MAX || !sees || d > 170) return false;
    const spot = (cx, cy, r0, r1) => { let x = cx, y = cy; for (let k = 0; k < 12; k++) { const a = rand(TAU), r = rand(r0, r1); x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r * 0.8; if (!solidAt(x, y) && boxFree(x, y, 5)) break; } return [x, y]; };
    let spots;
    if (!f.raised.length && d < 110 && !f.massTried) { f.massTried = true; if (chance(0.5)) { const a0 = rand(TAU); spots = [0, 1, 2, 3].map(i => { const a = a0 + i * Math.PI / 2, x = f.x + Math.cos(a) * 20, y = f.y + Math.sin(a) * 16; return !solidAt(x, y) && boxFree(x, y, 5) ? [x, y] : spot(f.x, f.y, 14, 24); }); } }
    if (!spots) spots = [spot(t.x, t.y, 22, 34)];
    f.act = { k: 'cast', spell: 'raise', t: 0, dur: spots.length > 1 ? 1.5 : 1.1, spots, tgt: t }; for (const [x, y] of spots) circleFx(x, y, 10, 'poison', 1.5 + (spots.length > 1 ? 0.4 : 0));
    SFX.summon(panOf(f.x)); if (spots.length > 1) { flashLight(f.x, f.y, 60, 'poison', 0.8, 1.4); textPop(f.x, f.y, headZ(f) + 4, 'RISE', 'heal', true, f); } faceTo(f, angTo(f.x, f.y, spots[0][0], spots[0][1])); return true;
  }
  if (c === 'heal') {
    const near = G.foes.filter(u => u !== f && !u.dead && !u.dying && u.aware && dist(u.x, u.y, f.x, f.y) < 150 && lineOfSight(f.x, f.y - 4, u.x, u.y - 4));
    // the treant first: while it is near her and unwarded, each time she is free to act it is even odds whether she wards
    // it or throws a thorn, and after two thorns she always wards it (the choice holds until she has done it)
    const tree = near.find(u => u.spr === 'GrizzledTreant' && !u.ward);
    if (tree) {
      if (f.pick === undefined) f.pick = (f.thorns || 0) >= 2 || chance(0.5);
      if (!f.pick) return false;
      f.act = { k: 'cast', spell: 'ward', t: 0, dur: 0.8, who: tree }; FX.beams.push({ x0: f.x, y0: f.y - 8, x1: tree.x, y1: tree.y - 8, w: 1.2, col: 'heal', life: 0.8, t: 0, steady: true, cap: true, who: tree, from: f }); SFX.chime(panOf(f.x)); return true;
    }
    if (f.shotNext || (f.wardT || 0) > G.time) return false; // a ward, then a thorn: she does not spend all her time on wards
    const hurtOne = ENCHANTER_HEALS ? near.filter(u => u.hp < u.maxHp * 0.8).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] : null;
    const wardOne = !hurtOne && near.filter(u => !u.ward && (u.wardCd || 0) < G.time).sort((a, b) => b.maxHp - a.maxHp)[0];
    const who = hurtOne || wardOne; if (!who) return false;
    f.act = { k: 'cast', spell: hurtOne ? 'heal' : 'ward', t: 0, dur: hurtOne ? 1 : 0.8, who }; FX.beams.push({ x0: f.x, y0: f.y - 8, x1: who.x, y1: who.y - 8, w: 1.2, col: 'heal', life: hurtOne ? 1 : 0.8, t: 0, steady: true, cap: true, who, from: f }); SFX.chime(panOf(f.x)); return true;
  }
  return false;
}
function castTick(f, a, dt) {
  f.vx = damp(f.vx, 0, 12, dt); f.vy = damp(f.vy, 0, 12, dt); f.moving = false;
  const col = a.spell === 'raise' ? 'poison' : 'heal'; if (chance(dt * 18)) part({ k: 'glow', x: f.x + rand(-5, 5), y: f.y, z: rand(6, 14), vz: rand(8, 20), drag: 2, life: 0.6, s0: 1.6, s1: 0.4, col, a0: 0.8, a1: 0 });
  for (const b of FX.beams) if (b.from === f && b.who) { b.x0 = f.x; b.y0 = f.y - 8; b.x1 = b.who.x; b.y1 = b.who.y - 8; if (b.who.dead) b.t = b.life; }
  if (a.t >= a.dur && !a.done) {
    a.done = true;
    if (a.spell === 'raise') for (const [x, y] of a.spots) raiseDead(f, x, y, a.tgt);
    else if (a.spell === 'heal' && !a.who.dead) { const n = Math.round(a.who.maxHp * 0.3); a.who.hp = Math.min(a.who.maxHp, a.who.hp + n); glows(a.who.x, a.who.y, 10, 14, 'heal', 30, 3, 0.9); number(a.who.x, a.who.y, headZ(a.who) + 1, '+' + n, 'heal', false, a.who); SFX.heal(); }
    else if (a.spell === 'ward' && !a.who.dead) { a.who.ward = WARD_BLOWS; a.who.wardCd = G.time + 8; f.shotNext = true; f.wardT = G.time + 6; f.pick = undefined; if (a.who.spr === 'GrizzledTreant') f.thorns = 0; ring(a.who.x, a.who.y - 6, 14, 'heal', 0.4, 2); SFX.chime(panOf(a.who.x)); }
  }
  if (a.t >= a.dur + 0.45) { f.act = null; f.cdT = a.spell === 'ward' ? rand(0.5, 0.9) : rand(2.2, 3.6); } // after a ward a thorn comes soon
}
// the dead raised: a skeleton claws up out of the floor (it rises over most of a second, shaking, before it can fight)
function raiseDead(f, x, y, t) {
  const u = mkFoe('grunt', G.floor, x, y, 'DecrepitBones'); u.def.gold = [0, 0]; Object.assign(u, { aware: true, state: 'fight', tgt: t, lastX: t.x, lastY: t.y, z: -18, stun: 0.9, raisedBy: f, room: f.room });
  G.foes.push(u); G.units.push(u); f.raised.push(u);
  debris(x, y, 10, ['#5a4636', '#7a604a', '#3e3026'], 60, 90, 1.4); smoke(x, y, 2, 'dust', 6, 12, 0.8); for (let i = 0; i < 8; i++) chip(x + rand(-3, 3), y, rand(1, 4), rand(-30, 30), rand(-20, 20), rand(30, 70), pick([BONE.L, BONE.M]));
  SFX.clatter(panOf(x)); SFX.groan(panOf(x));
}
// a warded foe's ward takes the blow for it, flaring; after its last blow it breaks
function wardBreaks(u) {
  if (!u.ward) return false; u.ward--; u.flash = 0.06;
  if (u.ward > 0) { sparks(u.x, u.y, 10, 8, 'heal', 100, 60); ring(u.x, u.y - 6, 13, 'heal', 0.25, 2); SFX.clang(panOf(u.x)); return true; }
  sparks(u.x, u.y, 10, 16, 'heal', 150, 90); ring(u.x, u.y - 6, 18, 'heal', 0.35, 3); SFX.shatter(panOf(u.x)); return true;
}
// acid splashing: green drops thrown out, a hiss, a sizzle of smoke
function acidSplat(x, y) { if (solidAt(x, y)) return; for (let i = 0; i < 10; i++) { const a = rand(TAU), v = rand(20, 70); part({ k: 'gore', x, y, z: rand(2, 6), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: rand(20, 60), g: 420, life: 5, s0: chance(0.4) ? 2 : 1, col: pick(['#7cc030', '#a6e040', '#4c8a18']), kind: 'bug' }); } smoke(x, y, 2, 'green', 5, 10, 0.7, 12); SFX.hex(panOf(x), true); }
// cursed: the stamina comes back slowly, violet motes rising off the hero
function curseTick(h, dt) {
  if (!(h.curseT > 0)) return; h.curseT -= dt;
  if (chance(dt * 10)) part({ k: 'glow', x: h.x + rand(-4, 4), y: h.y, z: rand(4, 14), vz: rand(8, 16), drag: 2, life: 0.7, s0: 1.4, s1: 0.3, col: 'arcane', a0: 0.7, a1: 0 });
}
