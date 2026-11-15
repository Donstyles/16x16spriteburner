// ===================== actors: heroes and foes, damage, poise, physics =====================
// Every hero and foe is an actor. Damage goes through hurt(): heroes may roll through it, block it or parry it; poise
// soaks blows until it breaks and the actor staggers. Actors move with their own velocity plus knockback, and walls,
// props and each other push them apart.
let UID = 0;
function mkActor(team, def, x, y, mul = 1) {
  const sc = def.scale || 1, hp = Math.round(def.hp * mul);
  return { id: ++UID, team, def, spr: def.spr, x, y, z: 0, vx: 0, vy: 0, vz: 0, kx: 0, ky: 0, r: (def.r || 5) * sc, scale: sc,
    hp, maxHp: hp, poise: def.poise || 20, maxPoise: def.poise || 20, poiseT: 0, dir: 0, face: 1, anim: rand(10), flash: 0, dead: false, deadT: 0,
    act: null, stun: 0, iframe: 0, moving: false, squash: 0, lunge: 0, la: 0 };
}
const alive = u => u && !u.dead;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
function faceTo(u, a) { u.dir = a; const c = Math.cos(a); if (Math.abs(c) > 0.15) u.face = c < 0 ? -1 : 1; }
// shapes a blow can take: a swept arc, a straight thrust, a ring around the attacker
function hitsShape(u, t, mv, dir) {
  const dx = t.x - u.x, dy = (t.y - u.y) * 1.15, d = Math.hypot(dx, dy) - t.r;
  if (mv.k === 'circle') return d < mv.reach;
  if (mv.k === 'line') { const along = dx * Math.cos(dir) + dy * Math.sin(dir), side = Math.abs(-dx * Math.sin(dir) + dy * Math.cos(dir)); return along > -4 && along < mv.reach + t.r && side < mv.w / 2 + t.r; }
  if (d > mv.reach) return false; return d < 3 || Math.abs(angDiff(dir, Math.atan2(dy, dx))) <= mv.arc / 2;
}
const PARRY_WINDOW = 0.2;
// o: { poise, kx, ky, ranged, unblockable, sneak, back, crit }
function hurt(u, dmg, src, o = {}) {
  if (!u || u.dead) return 0;
  if (u.iframe > 0) { if (u.team === 'hero' && chance(0.35)) textPop(u.x, u.y, 18, 'DODGED', 'white', false); return 0; }
  if (u.team === 'hero' && u.blocking && src && !o.unblockable) {
    const a = angTo(u.x, u.y, src.x, src.y);
    if (Math.abs(angDiff(u.dir, a)) < 1.25) {
      if (u.blockT < PARRY_WINDOW) { parried(u, src, o); return 0; }
      const g = guardOf(u); u.stam -= dmg * g.cost; u.stamT = 0.9; u.kx -= Math.cos(a) * 60; u.ky -= Math.sin(a) * 45;
      sparks(u.x + Math.cos(a) * 6, u.y + Math.sin(a) * 4, 10, 6, 'white', 120, 60); SFX.clang(panOf(u.x)); hitstop(0.04);
      if (u.stam <= 0) { u.stam = 0; winded(u); u.blocking = false; stagger(u, 0.8); textPop(u.x, u.y, 22, 'GUARD BROKEN', 'red', false); dmg *= 0.6; }
      else { dmg *= 1 - g.absorb; if (dmg < 1) return 0; }
    }
  }
  let d = dmg * rand(0.92, 1.08) * (o.crit || 1);
  if (u.def.armor) d *= 1 - u.def.armor;
  if (u.team === 'foe' && u.stun > 0) d *= 1.3; // a staggered foe is open
  d = Math.max(1, Math.round(d)); u.hp -= d; u.flash = 0.12;
  if (o.poise && !(u.act && u.act.armored)) { u.poise -= o.poise; u.poiseT = 2; if (u.poise <= 0) { u.poise = u.maxPoise; stagger(u, u.team === 'hero' ? 0.45 : 1.1); } }
  const km = u.scale > 1.2 ? 0.45 : 1; u.kx += (o.kx || 0) * km; u.ky += (o.ky || 0) * km;
  const tag = o.sneak ? 'SNEAK ATTACK' : o.riposte ? 'RIPOSTE' : o.back ? 'BACKSTAB' : null;
  number(u.x, u.y, u.z + 16 * u.scale, d, u.team === 'hero' ? 'red' : tag ? 'gold' : 'white', !!tag || d >= 40);
  if (tag) textPop(u.x, u.y, 30 * u.scale, tag, 'gold', false);
  if (u.team === 'hero') { shake(0.12 + Math.min(0.3, d / 80)); G.hurtFlash = 0.35; }
  const bl = BLOOD[u.def.blood || 'red'];
  if (u.def.blood === 'bone' || u.def.blood === 'metal') { sparks(u.x, u.y, 8 * u.scale, 5, 'white', 110, 80); SFX.clang(panOf(u.x)); }
  else { debris(u.x, u.y, 4, bl, 70, 90, 1.4); SFX.hit(panOf(u.x)); if (d > 12 && chance(0.5)) splat(u.x + rand(-4, 4), u.y + rand(-2, 2), bl[0], 3 + d / 12, 4); }
  if (u.hp <= 0) kill(u, src);
  else if (u.team === 'foe') alertFoe(u, src);
  return d;
}
function guardOf(u) { const off = u.off && OFFHANDS[u.off]; return off && off.guard ? off.guard : WEAPONS[u.weapon].guard || { absorb: 0.5, cost: 1.2 }; }
// a block raised the instant the blow lands turns it aside and leaves the attacker reeling
function parried(u, src, o) {
  const a = angTo(u.x, u.y, src.x, src.y); u.riposteT = 1.6; u.stam = Math.min(u.maxStam, u.stam + 15);
  sparks(u.x + Math.cos(a) * 7, u.y + Math.sin(a) * 5, 10, 18, 'gold', 220, 120); ring(u.x + Math.cos(a) * 7, u.y + Math.sin(a) * 5, 26, 'gold', 0.3, 3); flashLight(u.x, u.y, 70, 'gold', 1.4, 0.25);
  SFX.clang(panOf(u.x)); SFX.clang(panOf(u.x)); hitstop(0.14); kick(0.06); textPop(u.x, u.y, 26, 'PARRY', 'gold', true);
  if (!o.ranged && src.team === 'foe' && !src.dead) { stagger(src, src.def.boss ? 0.8 : 1.6); src.kx += Math.cos(a) * 140; src.ky += Math.sin(a) * 100; }
}
function stagger(u, t) {
  if (u.dead) return; u.act = null; u.stun = Math.max(u.stun, t); u.blocking = false;
  if (u.team === 'foe') { textPop(u.x, u.y, 22 * u.scale, 'STAGGERED', 'gold', false); for (let i = 0; i < 6; i++) part({ k: 'glow', x: u.x + rand(-5, 5), y: u.y, z: 16 * u.scale + rand(0, 6), vz: rand(-10, 10), life: t, s0: 1.4, s1: 0.6, col: 'gold' }); }
}
function kill(u, src) {
  u.dead = true; u.hp = 0; u.act = null; u.stun = 0;
  if (u.team === 'foe') { G.kills++; deathFx(u); dropLoot(u); if (src && src.team === 'hero') src.killsT = (src.killsT || 0) + 1; }
  else { u.deadT = 0; smoke(u.x, u.y, 6, 'dark', 10, 20, 1.4); flashLight(u.x, u.y, 60, 'red', 1, 0.6); textPop(u.x, u.y, 26, (u.pname || u.def.name) + ' FALLS', 'red'); SFX.boom(0.5, panOf(u.x)); shake(0.4); slowmo(0.3, 0.8); }
}
const BLOOD = { red: ['#7a0c14', '#a01420', '#5a0810'], bone: ['#cfc6b0', '#a49a84', '#7a705e'], metal: ['#9aa4b0', '#c8d0d8', '#6a7480'], slime: ['#3a8a30', '#60c040', '#2a5a20'], straw: ['#c8a040', '#e0c060', '#8a6a20'], bug: ['#4a3a20', '#6a5a30', '#2a2010'] };
// the body shatters into its own pixels
function deathFx(u) {
  if (!MOBS[u.spr]) return; const px = spritePixels(u.spr), sc = u.scale, fl = u.face < 0 ? -1 : 1, bl = BLOOD[u.def.blood || 'red'], pw = Math.max(1, Math.round(sc));
  const kx = clamp(u.kx * 0.4, -120, 120), ky = clamp(u.ky * 0.4, -120, 120), step = px.length > 200 ? 2 : 1;
  for (let i = 0; i < px.length; i += step) { const p = px[i], a = Math.atan2(p.y * 0.3, p.x * fl) + rand(-0.6, 0.6); part({ k: 'pix', x: u.x + p.x * sc * fl, y: u.y + rand(-1, 1), z: -p.y * sc, vx: Math.cos(a) * rand(20, 120) + kx, vy: rand(-50, 50) + ky, vz: rand(40, 150), g: 420, bounce: 0.35, drag: 1.1, life: rand(1, 2), s0: pw, col: p.c }); }
  debris(u.x, u.y, 8, bl, 120, 140, 1.6 * sc); if (u.def.blood !== 'bone' && u.def.blood !== 'metal') splat(u.x, u.y, bl[0], 6 + 4 * sc, 6 * sc); SFX.pop(panOf(u.x));
}
// physics: own velocity plus knockback, then walls, props and each other
function moveActor(u, dt) {
  if (!Number.isFinite(u.vx + u.vy + u.kx + u.ky)) { u.vx = u.vy = u.kx = u.ky = 0; }
  if (Number.isFinite(u.x + u.y)) { u.gx = u.x; u.gy = u.y; } else if (u.gx !== undefined) { u.x = u.gx; u.y = u.gy; }
  u.x += (u.vx + u.kx) * dt; u.y += (u.vy + u.ky) * dt; const f = Math.exp(-7 * dt); u.kx *= f; u.ky *= f;
  if (u.z > 0 || u.vz > 0) { u.vz -= 560 * dt; u.z += u.vz * dt; if (u.z <= 0) { u.z = 0; u.vz = 0; } }
  for (const p of ARENA.props) { if (!p.solid || p.dead) continue; const dx = u.x - p.x, dy = u.y - p.cy, d = Math.hypot(dx, dy), m = u.r + p.r; if (d < m) { const nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0; u.x = p.x + nx * m; u.y = p.cy + ny * m; } }
  tileCollide(u);
  if (u.squash > 0) u.squash = Math.max(0, u.squash - dt * 2.5);
}
function separate(list) {
  for (let i = 0; i < list.length; i++) { const a = list[i]; if (a.dead) continue; for (let j = i + 1; j < list.length; j++) { const b = list[j]; if (b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r; if (Math.abs(dx) > m || Math.abs(dy) > m) continue; const d = Math.hypot(dx, dy); if (d < m && d > 0.01) { const push = (m - d) * 0.5, nx = dx / d, ny = dy / d, wa = a.scale > b.scale + 0.2 ? 0.3 : b.scale > a.scale + 0.2 ? 1.7 : 1; a.x -= nx * push * wa; a.y -= ny * push * wa; b.x += nx * push * (2 - wa); b.y += ny * push * (2 - wa); } } }
}
// walk toward a point, sliding round props
function steer(u, tx, ty, spd, dt, stopAt = 0) {
  let dx = tx - u.x, dy = ty - u.y; const d = Math.hypot(dx, dy);
  if (d <= stopAt + 0.5) { u.vx = damp(u.vx, 0, 12, dt); u.vy = damp(u.vy, 0, 12, dt); u.moving = false; return d; }
  dx /= d; dy /= d;
  for (const p of ARENA.props) { if (!p.solid || p.dead) continue; const ox = p.x - u.x, oy = p.cy - u.y, od = Math.hypot(ox, oy); if (od < u.r + p.r + 14 && (ox * dx + oy * dy) > 0) { const side = (ox * dy - oy * dx) > 0 ? 1 : -1, sx = -dy * side, sy = dx * side; dx += sx * 1.2; dy += sy * 1.2; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; } }
  u.vx = damp(u.vx, dx * spd, 10, dt); u.vy = damp(u.vy, dy * spd, 10, dt); u.moving = true; return d;
}
// follow the corridors toward a point out of sight: a path over the tiles, refreshed now and then
function pathTo(u, tx, ty, spd, dt, stopAt = 0) {
  const cl = clipToWalls(u.x, u.y, tx, ty, u.r); if (Math.abs(cl[0] - tx) < 1 && Math.abs(cl[1] - ty) < 1) { u.path = null; return steer(u, tx, ty, spd, dt, stopAt); }
  const gk = Math.floor(tx / TS) + ',' + Math.floor(ty / TS);
  if (!u.path || u.pathTo !== gk || (u.pathT = (u.pathT || 0) - dt) <= 0) { u.path = findPath(u.x, u.y, tx, ty) || []; u.pathTo = gk; u.pathT = 0.5; }
  while (u.path.length && dist(u.x, u.y, u.path[0].x, u.path[0].y) < 7) u.path.shift();
  let wp = u.path[0] || { x: tx, y: ty }; for (let k = Math.min(3, u.path.length - 1); k > 0; k--) { const p = u.path[k], [cx, cy] = clipToWalls(u.x, u.y, p.x, p.y, u.r); if (Math.abs(cx - p.x) < 1 && Math.abs(cy - p.y) < 1) { wp = p; break; } }
  steer(u, wp.x, wp.y, spd, dt, 0); return dist(u.x, u.y, tx, ty);
}
function nearest(u, list, maxD = 1e9) { let best = null, bd = maxD; for (const o of list) { if (o.dead) continue; const d = dist(u.x, u.y, o.x, o.y); if (d < bd) { bd = d; best = o; } } return best; }
