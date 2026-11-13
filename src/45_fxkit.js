// ===================== effects that every phone generates itself =====================
// In co-op the host never streams particles. One-off bursts below travel as a single short event ("heal here",
// "nova here"); continuous effects (trails, burning zones, casting glows, channelled sprays) are drawn by each phone
// every frame from what it already knows about projectiles, zones and heroes. Same spectacle on every screen.
function healFx(x, y) { for (let i = 0; i < 10; i++) part({ k: 'glow', x: x + rand(-7, 7), y: y + rand(-3, 3), z: rand(0, 14), vz: rand(20, 50), drag: 1, life: rand(0.6, 1.2), s0: rand(2, 4), s1: 0, col: 'heal' }); light(x, y, 40, 'heal', 0.8); }
function novaFx(x, y, S) {
  ring(x, y, 60 * S, 'fire', 0.45, 7); ring(x, y, 40 * S, 'fire2', 0.3, 4);
  for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; part({ k: 'glow', x, y, z: 6, vx: Math.cos(a) * 190 * S, vy: Math.sin(a) * 140 * S, drag: 2.6, life: 0.6, s0: 7, s1: 2, col: i % 2 ? 'fire' : 'fire2' }); }
}
function summonFx(x, y, sc) { circleFx(x, y, 9 * sc + 5, 'arcane', 1.0); for (let i = 0; i < 10; i++) part({ k: 'glow', x: x + rand(-8, 8), y: y + rand(-5, 5), z: 0, vz: rand(30, 70), drag: 0.5, life: rand(0.5, 0.9), s0: rand(1.5, 3), s1: 0, col: 'arcane' }); SFX.summon(panOf(x)); }
function gustFx(x, y, a, cone, size) { for (let i = 0; i < 28; i++) { const aa = a + rand(-cone * 0.8, cone * 0.8), sp = rand(160, 280) * size; part({ k: 'spark', x: x + Math.cos(aa) * 8, y: y + Math.sin(aa) * 6, z: rand(2, 14), vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.8, drag: 2.2, life: rand(0.3, 0.5), col: 'white' }); } }
function lashFx(x0, y0, x1, y1) { for (let k = 0; k < 8; k++) { const f = k / 8; part({ k: 'pix', x: lerp(x0, x1, f) + rand(-2, 2), y: lerp(y0, y1, f), z: lerp(8, 6, f) + rand(-2, 2), vx: rand(-20, 20), vy: rand(-10, 10), vz: rand(20, 60), g: 300, life: 0.6, s0: 1.2, col: '#3a8a30' }); } }
function riseFx(x, y) { column(x, y, 'heal', 1.6, 18); ring(x, y, 60, 'heal', 0.6, 5); flashLight(x, y, 150, 'heal', 1.8, 0.7); for (let i = 0; i < 30; i++) part({ k: 'glow', x: x + rand(-10, 10), y: y + rand(-5, 5), z: rand(0, 30), vz: rand(30, 90), drag: 0.6, life: rand(0.8, 1.6), s0: rand(2, 4), s1: 0, col: chance(0.5) ? 'heal' : 'gold' }); }
function bashFx(x, y) { for (let i = 0; i < 12; i++) { const b = i / 12 * TAU; part({ k: 'spark', x, y, z: 8, vx: Math.cos(b) * 200, vy: Math.sin(b) * 160, drag: 5, life: 0.25, col: 'white' }); } ring(x, y, 18, 'white', 0.2, 3); }
function jetFx(x, y, a, size) { for (let i = 0; i < 7; i++) { const aa = a + rand(-0.2, 0.2), sp = rand(170, 240) * Math.sqrt(size); part({ k: 'glow', x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 4, z: 8, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.8, drag: 3, life: rand(0.25, 0.4), s0: rand(2, 3.5), s1: 5.5, col: chance(0.5) ? 'fire' : 'fire2', a0: 0.9, a1: 0 }); } light(x + Math.cos(a) * 26, y + Math.sin(a) * 20, 50, 'fire', 0.9); }
function levelFx(x, y) { column(x, y, 'gold', 1.3, 11); ring(x, y, 34, 'gold', 0.5, 4); flashLight(x, y, 90, 'gold', 1.5, 0.6); for (let i = 0; i < 14; i++) part({ k: 'glow', x: x + rand(-8, 8), y: y + rand(-4, 4), z: rand(0, 12), vz: rand(40, 110), drag: 0.8, life: rand(0.7, 1.3), s0: rand(1.5, 3), s1: 0, col: 'gold' }); }
// ---------- continuous effects, generated per frame on every phone ----------
function projFx(p, dt) {
  if (p.k === 'meteor') { glows(p.x, p.y, p.z, 2, 'fire', 30, 8, 0.4); if (chance(0.6)) part({ k: 'smoke', x: p.x, y: p.y, z: p.z, vx: rand(-8, 8), vy: rand(-5, 5), vz: 4, drag: 1, life: 1, s0: 5, s1: 13, col: 'dark', a0: 0.7, a1: 0 }); embers(p.x, p.y, 1); light(p.x, p.y, 70, 'fire', 0.9); }
  else if (p.k === 'glob') { if (!p.mud) { if (chance(0.7)) part({ k: 'glow', x: p.x, y: p.y, z: p.z, life: 0.3, s0: 4, s1: 0, col: 'fire' }); light(p.x, p.y, 40, 'fire', 0.8); } }
  else if (p.k === 'fireball') { for (let i = 0; i < 2; i++) part({ k: 'glow', x: p.x + rand(-2, 2), y: p.y + rand(-2, 2), z: p.z, vx: -p.vx * 0.15 + rand(-15, 15), vy: -p.vy * 0.15 + rand(-15, 15), drag: 2, life: rand(0.25, 0.45), s0: 6 * (p.big || 1), s1: 1, col: chance(0.5) ? 'fire' : 'fire2' }); if (chance(0.4)) embers(p.x, p.y, 1); if (chance(0.25)) smoke(p.x, p.y, 1, 'dark', 6, 6, 0.8, 4); light(p.x, p.y, 60 * (p.big || 1), 'fire', 1.1); }
  else if (p.k === 'ball') { light(p.x, p.y, 70, 'bolt', 1.2); if (chance(0.5)) sparks(p.x, p.y, p.z, 1, 'bolt', 80, 40); }
  else if (p.k === 'mshot' && p.shot !== 'arrow' && p.shot !== 'stone') { part({ k: 'glow', x: p.x, y: p.y, z: p.z, vx: -p.vx * 0.1, vy: -p.vy * 0.1, life: 0.3, s0: 4, s1: 0, col: p.col }); light(p.x, p.y, 34, p.col, 0.8); }
  if (p.shot === 'serpent') { for (let i = 0; i < 2; i++) part({ k: 'glow', x: p.x + rand(-1, 1), y: p.y, z: p.z, vx: -p.vx * 0.1, vy: -p.vy * 0.1, life: 0.35, s0: 4, s1: 0.5, col: i ? 'fire2' : 'fire' }); light(p.x, p.y, 40, 'fire', 0.8); }
}
function hazFx(z, dt) {
  const live2 = 1 - z.t / z.life;
  if (z.k === 'flame') { if (chance(0.9)) part({ k: 'glow', x: z.x + rand(-3, 3), y: z.y + rand(-2, 2), z: rand(0, 4), vz: rand(30, 60), drag: 1, life: rand(0.3, 0.6), s0: rand(3, 5) * live2 + 1, s1: 0.5, col: chance(0.6) ? 'fire' : 'fire2' }); if (chance(0.2)) embers(z.x, z.y, 1); light(z.x, z.y, 34, 'fire', 0.8 * live2); }
  else if (z.k === 'lava') { if (chance(0.3)) embers(z.x, z.y, 1); if (chance(0.15)) glows(z.x + rand(-8, 8), z.y + rand(-5, 5), 2, 1, 'fire', 10, 3, 0.4); light(z.x, z.y, 46, 'magma', 0.9 * Math.min(1, live2 * 3)); }
  else if (z.k === 'coil') { light(z.x, z.y - 14, 50, 'bolt', 0.9); if (chance(0.15)) { const a = rand(TAU); bolt(z.x, z.y - 14, z.x + Math.cos(a) * 12, z.y - 14 + Math.sin(a) * 10, { life: 0.08, w: 0.4, branches: 0 }); } }
  else if (z.k === 'arc') { light(z.x, z.y, z.r * 2, 'bolt', 0.6 * live2 + 0.2); if (chance(0.7)) { const a = rand(TAU), r = rand(z.r * 0.8), b = rand(TAU), x0 = z.x + Math.cos(a) * r, y0 = z.y + Math.sin(a) * r * 0.72; bolt(x0, y0, x0 + Math.cos(b) * 16, y0 + Math.sin(b) * 12, { life: 0.1, w: 0.5, branches: 0 }); } }
  else if (z.k === 'boulder') { if (chance(0.6)) smoke(z.x, z.y + 4, 1, 'dust', 8, 10, 0.8, 4); if (chance(0.15)) cracks(z.x, z.y, 2, 10, 300, 0.4); }
  else if (z.k === 'wave') { light(z.x, z.y, 40, 'gold', 0.8); if (chance(0.6)) sparks(z.x, z.y, 6, 1, 'gold', 60, 40); }
  else if (HAZFX[z.k]) HAZFX[z.k](z, dt);
}
function castFx(h, tier, u, dt) {
  const col = h.def.col;
  if (chance(dt * (20 + tier * 15))) { const a = rand(TAU), r = rand(14, 24) + tier * 3; part({ k: 'glow', x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r * 0.7, z: rand(4, 16), vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 2.1, life: 0.32, s0: 1.4, s1: 2.6 + tier * 0.4, col }); }
  light(h.x, h.y - 6, 26 + 30 * u * tier, col, 0.5 + 0.5 * u);
}
function regenFx(h, dt) { if (chance(dt * 12)) { const a = G.time * 6 + rand(TAU); part({ k: 'glow', x: h.x + Math.cos(a) * 8, y: h.y + Math.sin(a) * 5, z: rand(2, 16), vz: 20, life: 0.5, s0: 1.8, s1: 0, col: 'heal' }); } }
// timed emitters: started by one event, then each phone runs them for their duration
const EMIT = {
  rise(e, dt) { if (chance(dt * 20)) part({ k: 'glow', x: e.x + rand(-40, 40), y: e.y + rand(-28, 28), z: 0, vz: rand(40, 120), drag: 0.4, life: rand(0.6, 1.2), s0: rand(2, 4), s1: 0, col: e.col }); },
  spray(e, dt) {
    const h = e.u; if (!h || h.dead || h.x === undefined) { e.t = e.dur; return; }
    for (let i = 0; i < 3; i++) { const aa = e.a + rand(-e.cone, e.cone), sp = rand(120, 200) * Math.sqrt(e.sz); part({ k: 'glow', x: h.x + Math.cos(e.a) * 6, y: h.y + Math.sin(e.a) * 4, z: 8, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.8, drag: 2.6, life: rand(0.3, 0.5), s0: rand(2.5, 4), s1: 7, col: chance(0.5) ? 'fire' : 'fire2', a0: 0.9, a1: 0 }); }
    light(h.x + Math.cos(e.a) * 30, h.y + Math.sin(e.a) * 22, 60, 'fire', 1);
  },
};
function emitFx(kind, o, dur) { FX.emit.push({ kind, t: 0, dur, ...o }); }
function updateEmitters(dt) { for (const e of FX.emit) { e.t += dt; const f = EMIT[e.kind]; if (f) f(e, dt); } removeIf(FX.emit, e => e.t >= e.dur); }
// on the host, continuous effects must not be sent: each phone makes its own
function localFx(fn) { NET.depth++; try { fn(); } finally { NET.depth--; } }
