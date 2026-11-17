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
  if (u.fall) return 0; // (already going down a pit)
  if (!u || u.dead) return 0;
  if (u.team === 'foe' && u.ward && dmg > 0 && wardBreaks(u)) return 0; // an enchanter's ward takes the blow
  if (u.under) return 0; // a mole under the floor is out of reach
  if (u.iframe > 0) { if (u.team === 'hero' && chance(0.35)) textPop(u.x, u.y, headZ(u) + 1, 'DODGED', 'white', false); return 0; }
  if (u.team === 'hero' && u.blocking && src && !o.unblockable) {
    const a = angTo(u.x, u.y, src.x, src.y);
    if (Math.abs(angDiff(u.dir, a)) < 1.25) {
      if (u.blockT < PARRY_WINDOW) { parried(u, src, o); return 0; }
      const g = guardOf(u); u.stam -= dmg * g.cost; u.stamT = 0.9; u.kx -= Math.cos(a) * 60; u.ky -= Math.sin(a) * 45;
      sparks(u.x + Math.cos(a) * 6, u.y + Math.sin(a) * 4, 10, 6, 'white', 120, 60); SFX.clang(panOf(u.x)); freeze(u, 0.04); if (!o.ranged) freeze(src, 0.07);
      if (u.stam <= 0) { u.stam = 0; winded(u); u.blocking = false; stagger(u, 0.8); textPop(u.x, u.y, headZ(u) + 2, 'GUARD BROKEN', 'red', false); dmg *= 0.6; }
      else { dmg *= 1 - g.absorb; if (dmg < 1) return 0; }
    }
  }
  let d = dmg * rand(0.92, 1.08) * (o.crit || 1);
  if (u.def.armor) d *= 1 - u.def.armor;
  if (u.team === 'foe' && u.stun > 0) d *= 1.3; // a staggered foe is open
  d = Math.max(1, Math.round(d));
  // the hero's gambeson takes the blow first (53_foes); a blow it takes whole still knocks him back, but draws no blood
  if (u.gamb > 0) { d = gambesonTakes(u, d, o); if (d <= 0) { const km = u.scale > 1.2 ? 0.45 : 1; u.kx += (o.kx || 0) * km; u.ky += (o.ky || 0) * km; shake(0.08); return 0; } }
  const before = u.hp; u.hp -= d; u.flash = 0.12;
  // a killing blow does not stagger: the foe simply dies
  if (o.poise && u.hp > 0 && !(u.act && u.act.armored) && !(u.poiseGuard > 0)) { u.poise -= o.poise; u.poiseT = 2; if (u.poise <= 0) { u.poise = u.maxPoise; stagger(u, u.team === 'hero' ? 0.45 : 1.1); } }
  const km = u.scale > 1.2 ? 0.45 : 1; u.kx += (o.kx || 0) * km; u.ky += (o.ky || 0) * km;
  const tag = o.sneak ? 'SNEAK ATTACK' : o.riposte ? 'RIPOSTE' : o.back ? 'BACKSTAB' : null;
  number(u.x, u.y, headZ(u) + 1, d, o.acid ? 'acid' : u.team === 'hero' ? 'red' : tag ? 'gold' : 'white', !!tag || d >= 40, u);
  if (tag) textPop(u.x, u.y, headZ(u) + 7, tag, 'gold', false, u);
  if (u.team === 'hero') { shake(o.acid ? 0.05 : 0.12 + Math.min(0.3, d / 80)); G.hurtFlash = o.acid ? 0.15 : 0.35; }
  if (o.acid) acidBurn(u); // burnt from below, not cut: it hisses and steams at his feet and does not bleed
  else if (DRY.has(u.def.blood)) { shed(u, d, o); SFX.hit(panOf(u.x)); } // bone, hay, stone, water, wood or pixie dust instead of blood
  if (o.acid) { /* (see acidBurn) */ } else if (u.team === 'hero' && src && src.def && src.def.blood === 'water' && !o.ranged) soak(u); // a blow of water leaves him dripping
  else if (bleeds(u)) { // the blood flies the way the blow went
    spray(u, d, o); SFX.hit(panOf(u.x)); SFX.squelch(panOf(u.x), d >= 30); if (d > 12 && chance(0.4)) pool(u.x + rand(-3, 3), u.y + rand(-2, 2), u.def.blood || 'red', 1);
    if (src && src.team === 'hero' && !o.ranged) { src.gore = Math.min(3, (src.gore || 0) + (u.hp <= 0 ? 1 : 0.3)); src.goreKind = u.def.blood || 'red'; }
  }
  else { debris(u.x, u.y, 4, DUST, 70, 90, 1.4); SFX.hit(panOf(u.x)); } // the gore is off
  if (u.hp <= 0 && u.team === 'hero' && TEST.on && TEST.god) u.hp = 1; // the creature test room: he cannot die
  if (u.hp <= 0) {
    u.lastBlow = o;
    // overkill: a killing blow that alone does more than half the foe's full health blows one of the bigger foes (never
    // the trash) apart, whatever it had left (a 51 blow on a foe at 1 of 100 does it)
    if (GORE.level === 2 && u.team === 'foe' && u.def.role !== 'rush' && (bleeds(u) || DRY.has(u.def.blood)) && d > 0.5 * u.maxHp) { u.gib = true; if (src) { freeze(src, GIB_HOLD); if (src.gore !== undefined && bleeds(u)) src.gore = Math.min(3, src.gore + 0.5); } }
    // a brute brought down goes into its death throes; a blow during them finishes it
    if (!u.gib && !u.dying && u.team === 'foe' && u.def.role === 'tank') throes(u, src); else { u.dying = null; kill(u, src); }
  }
  else if (u.team === 'foe') alertFoe(u, src);
  return d;
}
function guardOf(u) { const off = u.off && OFFHANDS[u.off]; return off && off.guard ? off.guard : WEAPONS[u.weapon].guard || { absorb: 0.5, cost: 1.2 }; }
// a block raised the instant the blow lands turns it aside and leaves the attacker reeling
function parried(u, src, o) {
  const a = angTo(u.x, u.y, src.x, src.y); u.riposteT = 1.6; u.stam = Math.min(u.maxStam, u.stam + 15);
  sparks(u.x + Math.cos(a) * 7, u.y + Math.sin(a) * 5, 10, 18, 'gold', 220, 120); ring(u.x + Math.cos(a) * 7, u.y + Math.sin(a) * 5, 26, 'gold', 0.3, 3); flashLight(u.x, u.y, 70, 'gold', 1.4, 0.25);
  SFX.clang(panOf(u.x)); SFX.clang(panOf(u.x)); hitstop(0.07); kick(0.06); textPop(u.x, u.y, headZ(u) + 3, 'PARRY', 'gold', true);
  if (!o.ranged && src.team === 'foe' && !src.dead) { stagger(src, src.def.boss ? 0.8 : 1.6); src.kx += Math.cos(a) * 140; src.ky += Math.sin(a) * 100; }
}
function stagger(u, t) {
  if (u.dead) return; u.act = null; u.stun = Math.max(u.stun, t); u.blocking = false;
  u.poise = u.maxPoise; u.poiseGuard = t + (u.team === 'foe' ? 2.5 : 1.5); // back on its feet, it cannot be worn down again for a while
  if (u.team === 'foe') { textPop(u.x, u.y, headZ(u) + 2, 'STAGGERED', 'gold', false, u); for (let i = 0; i < 6; i++) part({ k: 'glow', x: u.x + rand(-5, 5), y: u.y, z: 16 * u.scale + rand(0, 6), vz: rand(-10, 10), life: t, s0: 1.4, s1: 0.6, col: 'gold' }); }
}
function kill(u, src) {
  u.dead = true; u.hp = 0; u.act = null; u.stun = 0;
  if (u.team === 'foe') { if (!u.raisedBy) G.kills++; deathFx(u); if (!u.raisedBy) dropLoot(u); if (u.dummy) dummyDied(u); if (src && src.team === 'hero' && !u.raisedBy) src.killsT = (src.killsT || 0) + 1; } // the necromancer's raised dead are worth nothing
  else { heroFalls(u); smoke(u.x, u.y, 6, 'dark', 10, 20, 1.4); flashLight(u.x, u.y, 60, 'red', 1, 0.6); textPop(u.x, u.y, headZ(u) + 3, (u.pname || u.def.name) + ' FALLS', 'red'); SFX.boom(0.5, panOf(u.x)); shake(0.4); slowmo(0.3, 1.4); }
}
const BLOOD = { red: ['#7a0c14', '#a01420', '#5a0810'], bone: ['#cfc6b0', '#a49a84', '#7a705e'], stone: ['#9b9c9b', '#6e6e6e', '#625353'], water: ['#8cc8f0', '#5a9ad0', '#bfe4ff'], wood: ['#7a5230', '#5a3a1e', '#b08a58'], dust: ['#ffd6f5', '#c8f0ff', '#fff4b0'], slime: ['#3a8a30', '#60c040', '#2a5a20'], straw: ['#c8a040', '#e0c060', '#8a6a20'], bug: ['#7c8c1c', '#a6b630', '#4c5810'], sludge: ['#2a2219', '#40352a', '#120e0b'] }; // bug: green-yellow ichor; sludge: what the crypt dead have left
// the body shatters into its own pixels (k: how hard they fly)
function shatter(u, k) {
  const px = spritePixels(u.spr), sc = u.scale, fl = u.face < 0 ? -1 : 1, pw = Math.max(1, Math.round(sc));
  const kx = clamp(u.kx * 0.4, -120, 120), ky = clamp(u.ky * 0.4, -120, 120), step = px.length > 200 ? 2 : 1;
  for (let i = 0; i < px.length; i += step) { const p = px[i], a = Math.atan2(p.y * 0.3, p.x * fl) + rand(-0.6, 0.6); part({ k: 'pix', x: u.x + p.x * sc * fl, y: u.y + rand(-1, 1), z: (u.z || 0) - p.y * sc, vx: (Math.cos(a) * rand(20, 120) + kx) * k, vy: (rand(-50, 50) + ky) * k, vz: rand(40, 150) * k, g: 420, bounce: 0.35, drag: 1.1, life: rand(1, 2), s0: pw, col: p.c }); }
}
function deathFx(u) {
  if (u.gib) { gibBurst(u); return; }
  if (!MOBS[u.spr]) return; const sc = u.scale, bl = BLOOD[u.def.blood || 'red'];
  shatter(u, u.def.blood === 'bone' ? 0.45 : 1); // a skeleton collapses more than it bursts
  if (bleeds(u)) { spray(u, 30, { ...(u.lastBlow || {}), more: 1.3 }); pool(u.x, u.y, u.def.blood || 'red', 2 + sc); debris(u.x, u.y, 4, bl, 100, 120, 1.4 * sc); }
  else if (DRY.has(u.def.blood)) remains(u); // a heap of bones, a cloud of hay, pieces of stone
  else debris(u.x, u.y, 8, DUST, 120, 140, 1.6 * sc);
  SFX.pop(panOf(u.x));
}
// A column on its plinth (the three-tile column's plinth is drawn from 19 to 8 pixels above its prop's foot line, the
// flooded column's, two tiles, from 12 to 1). The box nobody walks into: from the front of the plinth back to its drawn
// top edge, so a foot coming from the north stops where the plinth's top begins and never sinks in behind it.
function propFoot(p) {
  if (p.kind === 'pillar') return { x0: p.x - 6, x1: p.x + 6, y0: p.y - 17, y1: p.y - 7 };
  if (p.kind === 'wetpillar') return { x0: p.x - 6, x1: p.x + 6, y0: p.y - 10, y1: p.y };
  if (p.kind === 'counter') { const w = (p.tw || 1) * 8; return { x0: p.x - w, x1: p.x + w, y0: p.y - 12, y1: p.y + 1 }; } // (the shop's counter: solid end to end, 39_shop)
  if (p.kind === 'tchest') return { x0: p.x - 7, x1: p.x + 7, y0: p.y - 6, y1: p.y + 1 }; // (a treasure chest, its lid's edge 11 above its foot line: from the north, feet go a pixel or two in behind it)
  return null;
}
// How a column is drawn among the rest: its plinth (everything from its top edge down) is low, under anyone's hand, so it
// goes down first and everyone stands and swings over it (nobody's feet reach in behind it: propFoot); the column above
// it is drawn in front of or behind a unit by the column's own middle (band: the plinth's top edge; mid: that line)
function propSplit(p) {
  if (p.kind === 'pillar') return { band: p.y - 19, mid: p.y - 10 };
  if (p.kind === 'wetpillar') return { band: p.y - 12, mid: p.y - 3 };
  return null;
}
// a point in a column's plinth or a treasure chest (a coin does not come to rest in one)
function propFootAt(x, y) { for (const p of ARENA.props) { if (!p.solid || p.dead) continue; const F = propFoot(p); if (F && x >= F.x0 && x < F.x1 && y >= F.y0 && y < F.y1) return true; } return false; }
// physics: own velocity plus knockback, then walls, props and each other
function moveActor(u, dt) {
  if (!Number.isFinite(u.vx + u.vy + u.kx + u.ky)) { u.vx = u.vy = u.kx = u.ky = 0; }
  if (Number.isFinite(u.x + u.y)) { u.gx = u.x; u.gy = u.y; } else if (u.gx !== undefined) { u.x = u.gx; u.y = u.gy; }
  if (u.enter) { u.y += u.vy * dt; return; } // stepping out of the stairway, through the wall's face
  const gk = u.gaitK === undefined ? 1 : u.gaitK; // a gait's pace (56_gaits): the stumbler's lurch, the crawler's bursts
  if (u.fall) return; // (going down a pit: 38_pits)
  // (a hard knock carries over a pit's edge: while it lasts, a pit does not push back, and once the middle is over it, down it goes)
  const bk = basinBrake(u, dt); PITPASS = pitKnock(u); tileCollide(u); slideMove(u, (u.vx * gk + u.kx) * dt * bk, (u.vy * gk + u.ky) * dt * bk); const f = Math.exp(-7 * dt); u.kx *= f; u.ky *= f; // (any small push since last frame settled first)
  if (u.team === 'foe' && ARENA.shop && inShop(ARENA, u.x, u.y) && !inShop(ARENA, u.gx, u.gy)) { u.x = u.gx; u.y = u.gy; } // (no foe comes into the shop: 39_shop)
  if (!u.fly && !u.under && (u.z || 0) <= 2 && pitAt(u.x, u.y)) { PITPASS = false; startFall(u); return; }
  if (!u.fly && (u.z > 0 || u.vz > 0)) { u.vz -= 560 * dt; u.z += u.vz * dt; if (u.z <= 0) { u.z = 0; u.vz = 0; } }
  for (const p of ARENA.props) {
    if (!p.solid || p.dead) continue; const F = propFoot(p);
    if (F) { // a column's plinth: a box where it meets the floor, so nobody stands half inside it from the side
      const hw = Math.max(3, u.r * 0.8), hh = Math.max(2, u.r * 0.45), ox = Math.min(u.x + hw - F.x0, F.x1 - (u.x - hw)), oy = Math.min(u.y + hh - F.y0, F.y1 - (u.y - hh));
      if (ox > 0 && oy > 0) { if (ox < oy) u.x += u.x < (F.x0 + F.x1) / 2 ? -ox : ox; else u.y += u.y < (F.y0 + F.y1) / 2 ? -oy : oy; }
      continue;
    }
    const dx = u.x - p.x, dy = u.y - p.cy, d = Math.hypot(dx, dy), m = u.r + p.r; if (d < m) { const nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0; u.x = p.x + nx * m; u.y = p.cy + ny * m; }
  }
  tileCollide(u); PITPASS = false; basinHop(u); // (36_works: the step down into a drained cistern)
  if (u.squash > 0) u.squash = Math.max(0, u.squash - dt * 2.5);
}
function separate(list) {
  for (let i = 0; i < list.length; i++) { const a = list[i]; if (a.dead || a.fall) continue; for (let j = i + 1; j < list.length; j++) { const b = list[j]; if (b.dead || b.fall) continue; const dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r; if (Math.abs(dx) > m || Math.abs(dy) > m) continue; const d = Math.hypot(dx, dy); if (d < m && d > 0.01) { const push = (m - d) * 0.5, nx = dx / d, ny = dy / d, wa = a.scale > b.scale + 0.2 ? 0.3 : b.scale > a.scale + 0.2 ? 1.7 : 1; a.x -= nx * push * wa; a.y -= ny * push * wa; b.x += nx * push * (2 - wa); b.y += ny * push * (2 - wa); } } }
}
// walk toward a point, sliding round props
function steer(u, tx, ty, spd, dt, stopAt = 0) {
  let dx = tx - u.x, dy = ty - u.y; const d = Math.hypot(dx, dy);
  if (d <= stopAt + 0.5) { u.vx = damp(u.vx, 0, 12, dt); u.vy = damp(u.vy, 0, 12, dt); u.moving = false; return d; }
  dx /= d; dy /= d;
  for (const p of ARENA.props) { if (!p.solid || p.dead) continue; const ox = p.x - u.x, oy = p.cy - u.y, od = Math.hypot(ox, oy); if (od < u.r + p.r + 14 && (ox * dx + oy * dy) > 0) { const side = (ox * dy - oy * dx) > 0 ? 1 : -1, sx = -dy * side, sy = dx * side; dx += sx * 1.2; dy += sy * 1.2; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; } }
  const grip = u.fly ? 3.5 : 10; // a flyer turns in wide arcs
  u.vx = damp(u.vx, dx * spd, grip, dt); u.vy = damp(u.vy, dy * spd, grip, dt); u.moving = true; return d;
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
