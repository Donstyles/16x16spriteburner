// ===================== heroes: kits, weapons, and a hand on every move =====================
// A hero acts on its own input record (stick, attack held/pressed/released, dodge, block, flask), so a player on another
// phone drives a hero exactly like the local one does. Every move costs stamina. An attack winds up, strikes, then
// recovers; pressing again during it chains the next blow of the weapon's combo, and only the recovery can be cut short
// by a roll. Holding attack charges the weapon's heavy blow. A roll is quick and untouchable for most of its length.
// Block soaks blows at the price of stamina; raised just as a blow lands it parries, leaving the attacker open.
const KITS = {
  sellsword: { name: 'SELLSWORD', spr: 'VeteranSwordsman', hp: 100, spd: 62, weapon: 'sword', off: 'shield', blurb: 'SWORD AND SHIELD · STEADY COMBOS, A SOLID GUARD' },
  lancer: { name: 'LANCER', spr: 'BoldManAtArms', hp: 100, spd: 60, weapon: 'spear', off: 'shield', blurb: 'SPEAR AND SHIELD · LONG REACH, KEEPS FOES AT BAY' },
  gladiator: { name: 'GLADIATOR', spr: 'BlessedGladiator', hp: 125, spd: 56, weapon: 'axe', off: null, blurb: 'TWO-HANDED AXE · SLOW, BRUTAL, BREAKS ANY GUARD' },
  cutthroat: { name: 'CUTTHROAT', spr: 'HalflingAssassin', hp: 85, spd: 68, weapon: 'daggers', off: null, roll: 1.3, blurb: 'TWIN DAGGERS · QUICK, ROLLS FAR, DEADLY FROM BEHIND' },
};
// k: 'arc' (sweep: +1/-1 direction of the swing), 'line' (thrust, w = width) or 'circle' (at = centre ahead of the hero)
const WEAPONS = {
  sword: { name: 'ARMING SWORD', dmg: 16, guard: { absorb: 0.5, cost: 1.2 }, combo: [
    { k: 'arc', wind: 0.07, act: 0.09, rec: 0.24, reach: 21, arc: 2.1, sweep: 1, dm: 1, stam: 12, poise: 10, lunge: 70, push: 70 },
    { k: 'arc', wind: 0.06, act: 0.09, rec: 0.24, reach: 21, arc: 2.1, sweep: -1, dm: 1.05, stam: 12, poise: 10, lunge: 70, push: 70 },
    { k: 'line', wind: 0.1, act: 0.08, rec: 0.36, reach: 28, w: 10, dm: 1.5, stam: 16, poise: 24, lunge: 140, push: 150 }],
    heavy: { k: 'circle', charge: 0.55, wind: 0.04, act: 0.24, rec: 0.42, reach: 27, dm: 2.3, stam: 26, poise: 60, push: 170, spin: true } },
  spear: { name: 'SPEAR', dmg: 15, guard: { absorb: 0.45, cost: 1.25 }, combo: [
    { k: 'line', wind: 0.09, act: 0.08, rec: 0.26, reach: 35, w: 8, dm: 1, stam: 12, poise: 9, lunge: 50, push: 90 },
    { k: 'line', wind: 0.08, act: 0.08, rec: 0.26, reach: 35, w: 8, dm: 1, stam: 12, poise: 9, lunge: 50, push: 90 },
    { k: 'arc', wind: 0.12, act: 0.1, rec: 0.38, reach: 31, arc: 2.6, sweep: 1, dm: 1.3, stam: 18, poise: 22, lunge: 30, push: 140 }],
    heavy: { k: 'line', charge: 0.6, wind: 0.05, act: 0.18, rec: 0.45, reach: 40, w: 10, dm: 2.4, stam: 26, poise: 55, lunge: 330, push: 210, dash: true } },
  axe: { name: 'BATTLE AXE', dmg: 27, guard: { absorb: 0.55, cost: 1.15 }, combo: [
    { k: 'arc', wind: 0.17, act: 0.11, rec: 0.38, reach: 23, arc: 2.5, sweep: 1, dm: 1, stam: 20, poise: 28, lunge: 70, push: 150 },
    { k: 'arc', wind: 0.19, act: 0.12, rec: 0.5, reach: 24, arc: 2.7, sweep: -1, dm: 1.25, stam: 22, poise: 36, lunge: 80, push: 180 }],
    heavy: { k: 'circle', charge: 0.75, wind: 0.08, act: 0.1, rec: 0.62, reach: 30, at: 14, dm: 2.8, stam: 32, poise: 95, push: 240, slam: true } },
  daggers: { name: 'TWIN DAGGERS', dmg: 9, back: 2, guard: { absorb: 0.25, cost: 1.5 }, combo: [
    { k: 'arc', wind: 0.04, act: 0.06, rec: 0.13, reach: 15, arc: 1.5, sweep: 1, dm: 1, stam: 7, poise: 4, lunge: 55, push: 30 },
    { k: 'arc', wind: 0.04, act: 0.06, rec: 0.13, reach: 15, arc: 1.5, sweep: -1, dm: 1, stam: 7, poise: 4, lunge: 55, push: 30 },
    { k: 'arc', wind: 0.04, act: 0.06, rec: 0.13, reach: 15, arc: 1.5, sweep: 1, dm: 1, stam: 7, poise: 4, lunge: 55, push: 30 },
    { k: 'line', wind: 0.06, act: 0.07, rec: 0.3, reach: 19, w: 8, dm: 1.7, stam: 10, poise: 10, lunge: 110, push: 80 }],
    heavy: { k: 'line', charge: 0.4, wind: 0.03, act: 0.14, rec: 0.3, reach: 20, w: 12, dm: 2, stam: 18, poise: 24, lunge: 380, push: 60, dash: true, through: true } },
};
const OFFHANDS = { shield: { name: 'ROUND SHIELD', guard: { absorb: 0.85, cost: 0.85 } } };
const newInp = () => ({ mx: 0, my: 0, aim: null, atk: false, atkP: false, atkR: false, dodgeP: false, block: false, itemP: false });
function makeHero(kitKey) {
  const k = KITS[kitKey], h = mkActor('hero', { ...k, r: 5, poise: 30 }, 0, 0);
  Object.assign(h, { kit: kitKey, weapon: k.weapon, off: k.off, stam: 100, maxStam: 100, stamT: 0, flasks: 3, maxFlasks: 3, lightR: 78, blockT: 0, riposteT: 0, combo: 0, comboT: 0, pressT: -1, inp: newInp(), pname: 'P1' });
  return h;
}
const weaponOf = h => WEAPONS[h.weapon];
// Every move takes stamina, and a short pause follows before it comes back. Spending the very last of it leaves the hero
// winded: nothing comes back for 1.6 s, and they stand there panting until a third of the bar has returned.
const WINDED = 1.6;
function spendStam(h, n, delay) { h.stam = Math.max(0, h.stam - n); h.stamT = Math.max(h.stamT, delay); if (h.stam <= 0) winded(h); }
function winded(h) { h.stamT = Math.max(h.stamT, WINDED); if (!h.huff) h.huff = { t: 0.18, out: true }; } // (no breathing sounds for now)
function pant(h, dt) {
  const H = h.huff; if (h.dead || (h.stamT <= 0 && h.stam >= h.maxStam / 3)) { h.huff = null; return; }
  if ((H.t -= dt) > 0) return; const slow = (h.stamT > 0 ? 1 : 1.35) * rand(0.85, 1.2); // slower as the stamina comes back, never quite even
  if (H.out) { for (let i = 0; i < 2; i++) part({ k: 'smoke', x: h.x + h.face * (5 + i * 2), y: h.y + 1, z: 10 + i, vx: h.face * rand(12, 22), vy: rand(-3, 3), vz: rand(3, 8), drag: 2, life: 0.8, s0: 2.5, s1: 6.5, col: 'breath', a0: 0.9, a1: 0 }); H.t = 0.2 * slow; }
  else H.t = 0.26 * slow;
  H.out = !H.out;
}
// The sellsword's sword, swung: the angle it points (screen space, about the grip) through each move. It starts from
// wherever it is (a combo flows on), draws back in the wind-up, sweeps through the arc in the strike and settles back to
// rest in the recovery. A thrust draws back and drives forward; the spin goes once round; charging, it is raised back.
const SWORD_REST = -Math.PI / 2;
const angLerp = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t, easeOut = t => 1 - (1 - t) * (1 - t), easeIO = t => t * t * (3 - 2 * t);
function swordPose(h) {
  const a = h.act; if (h.weapon !== 'sword' || !a || h.dead) return null;
  if (a.k === 'charge') { const p = Math.min(1, a.t / WEAPONS.sword.heavy.charge); return { th: angLerp(SWORD_REST, SWORD_REST - (h.face < 0 ? -1 : 1) * 1.0, easeOut(p)), push: 0, shake: p >= 1 }; } // raised back over the shoulder
  if (a.k !== 'atk') return null;
  if (a.th0 === undefined) a.th0 = h.swTh === undefined ? SWORD_REST : h.swTh;
  const mv = a.mv, w = mv.wind, s = w + mv.act, t = a.t, d = a.dir, rec = clamp((t - s) / mv.rec, 0, 1);
  if (mv.k === 'arc') {
    const sw = (mv.sweep || 1) * (h.face < 0 ? -1 : 1), half = mv.arc / 2 * 1.15, a0 = d - sw * half, a1 = d + sw * half;
    if (t < w) return { th: angLerp(a.th0, a0, easeOut(t / w)), push: 0 };
    if (t < s) return { th: a0 + (a1 - a0) * easeOut((t - w) / mv.act), push: 1 };
    return { th: angLerp(a1, SWORD_REST, easeIO(clamp((rec - 0.25) / 0.75, 0, 1))), push: 0 };
  }
  if (mv.k === 'line') {
    if (t < w) { const p = easeOut(t / w); return { th: angLerp(a.th0, d, p), push: -1 * p }; }
    if (t < s) return { th: d, push: -1 + 3 * easeOut((t - w) / mv.act) };
    return { th: angLerp(d, SWORD_REST, easeIO(clamp((rec - 0.3) / 0.7, 0, 1))), push: 2 * (1 - rec) };
  }
  if (t < w) return { th: angLerp(a.th0, d, t / w), push: 0 };
  if (t < s) return { th: d + (h.face < 0 ? -1 : 1) * TAU * easeOut((t - w) / mv.act), push: 1 };
  return { th: angLerp(d, SWORD_REST, easeIO(rec)), push: 0 };
}
function canRoll(h) { const a = h.act; return h.stam > 0 && h.stun <= 0 && (!a || a.k === 'charge' || (a.k === 'atk' && a.phase === 'rec') || a.k === 'drink'); }
function heroTick(h, dt) {
  const I = h.inp; if (h.dead) { h.deadT += dt; I.atkP = I.atkR = I.dodgeP = I.itemP = false; return; }
  if (h.iframe > 0) h.iframe -= dt; if (h.riposteT > 0) h.riposteT -= dt; if (h.comboT > 0) h.comboT -= dt;
  if (h.poiseT > 0) h.poiseT -= dt; else h.poise = h.maxPoise; if (h.poiseGuard > 0) h.poiseGuard -= dt;
  if (h.dipT > 0) h.dipT -= dt; if (h.huff) pant(h, dt);
  if (h.stamT > 0) h.stamT -= dt; else if (!(h.act && h.act.k !== 'charge')) h.stam = Math.min(h.maxStam, h.stam + (h.blocking ? 16 : 58) * dt);
  const want = I.mx || I.my ? Math.atan2(I.my, I.mx) : null;
  h.noise = !h.act ? (Math.hypot(I.mx, I.my) > CREEP + 0.05 ? 1 : 0) : h.act.k === 'roll' || h.act.k === 'atk' ? 2 : h.act.k === 'drink' ? 0 : 1;
  h.hush = damp(h.hush || 1, h.noise === 0 && (I.mx || I.my) ? 0.8 : 1, 6, dt); // creeping, the hero shades the lamp
  if (h.stun > 0) { h.stun -= dt; h.vx = damp(h.vx, 0, 8, dt); h.vy = damp(h.vy, 0, 8, dt); h.moving = false; h.pressT = -1; I.atkP = I.atkR = I.dodgeP = I.itemP = false; return; }
  const a = h.act;
  if (I.dodgeP) { I.dodgeP = false; if (canRoll(h)) { startRoll(h, want); I.atkP = I.atkR = false; h.pressT = -1; return; } else if (h.stam <= 0) G.tiredT = 0.6; }
  if (a) { if (a.k === 'atk' && I.atkP) a.buf = true; I.atkP = false; actTick(h, a, dt, I, want); I.itemP = false; return; }
  // free: walk, raise the shield, start an attack, drink
  if (I.itemP) { I.itemP = false; if (h.flasks > 0) { h.act = { k: 'drink', t: 0, dur: 0.85, done: false }; h.blocking = false; return; } else textPop(h.x, h.y, headZ(h) + 2, 'NO FLASKS', 'red', false); }
  if (I.atkP) { I.atkP = false; h.pressT = 0; }
  if (h.pressT >= 0) {
    h.pressT += dt;
    if (I.atkR || !I.atk) { I.atkR = false; h.pressT = -1; lightAttack(h, want); return; }
    if (h.pressT > 0.2) { h.pressT = -1; h.act = { k: 'charge', t: 0 }; h.blocking = false; return; }
  }
  I.atkR = false;
  const blocking = I.block && h.stam > 0; if (blocking && !h.blocking) h.blockT = 0; h.blocking = blocking; if (blocking) h.blockT += dt;
  const spd = h.def.spd * (blocking ? 0.45 : 1);
  h.vx = damp(h.vx, I.mx * spd, 14, dt); h.vy = damp(h.vy, I.my * spd, 14, dt); h.moving = !!(I.mx || I.my);
  if (I.aim !== null && I.aim !== undefined) faceTo(h, I.aim); else if (want !== null) faceTo(h, want);
}
// which foe a blow should go for: the nearest one roughly where the hero is heading
function aimAssist(h, dir, reach) {
  let best = null, bs = 1e9; for (const f of G.foes) { if (f.dead) continue; const d = dist(h.x, h.y, f.x, f.y), da = Math.abs(angDiff(dir, angTo(h.x, h.y, f.x, f.y))); if (d > reach + 30 || da > 1.3 || !lineOfSight(h.x, h.y - 4, f.x, f.y - 4)) continue; const s = d + da * 30; if (s < bs) { bs = s; best = f; } }
  return best ? angTo(h.x, h.y, best.x, best.y) : dir;
}
// h.combo is the next blow of the chain; it carries on if the next press comes soon enough after the last blow
function lightAttack(h, want, chained) {
  const W = weaponOf(h); if (!chained && h.comboT <= 0) h.combo = 0;
  if (startMove(h, W.combo[h.combo % W.combo.length], want)) h.combo = (h.combo + 1) % W.combo.length; else h.combo = 0;
}
function startMove(h, mv, want) {
  if (h.stam <= 0) { G.tiredT = 0.6; return false; }
  spendStam(h, mv.stam, 0.65); h.blocking = false;
  const dir = aimAssist(h, want !== null && want !== undefined ? want : h.dir, mv.reach); faceTo(h, dir);
  h.act = { k: 'atk', mv, t: 0, phase: 'wind', dir, hit: new Set(), buf: false };
  return true;
}
function startRoll(h, want) {
  const K = KITS[h.kit], dir = want !== null ? want : h.dir + Math.PI, len = 46 * (K.roll || 1), dur = 0.34;
  spendStam(h, 20, 0.6); h.blocking = false; h.iframe = 0.26;
  h.act = { k: 'roll', t: 0, dur, dir, spd: len / dur * 1.45 }; if (want !== null) faceTo(h, dir);
  smoke(h.x, h.y, 3, 'dust', 7, 26, 0.6); SFX.whoosh(panOf(h.x));
}
function actTick(h, a, dt, I, want) {
  a.t += dt;
  if (a.k === 'roll') {
    const u = a.t / a.dur, s = a.spd * (1 - u) * (1 - u * 0.4); h.vx = Math.cos(a.dir) * s; h.vy = Math.sin(a.dir) * s * 0.85; h.moving = true;
    if ((a.gT = (a.gT || 0) - dt) <= 0) { a.gT = 0.06; smoke(h.x - Math.cos(a.dir) * 3, h.y, 1, 'dust', 5, 12, 0.45); }
    if (u >= 1) { h.act = null; h.vx *= 0.3; h.vy *= 0.3; smoke(h.x, h.y, 2, 'dust', 6, 20, 0.5); h.dipT = 0.08; }
    return;
  }
  if (a.k === 'drink') {
    h.vx = damp(h.vx, I.mx * h.def.spd * 0.35, 10, dt); h.vy = damp(h.vy, I.my * h.def.spd * 0.35, 10, dt); h.moving = !!(I.mx || I.my);
    if (!a.done && a.t >= 0.55) { a.done = true; h.flasks--; const g = Math.min(h.maxHp - h.hp, Math.round(h.maxHp * 0.45)); h.hp += g; number(h.x, h.y, headZ(h) + 1, '+' + g, 'heal', true); healGlow(h.x, h.y); SFX.heal(); }
    if (a.t >= a.dur) h.act = null; return;
  }
  if (a.k === 'charge') {
    const H = weaponOf(h).heavy, full = a.t >= H.charge;
    h.vx = damp(h.vx, I.mx * h.def.spd * 0.35, 10, dt); h.vy = damp(h.vy, I.my * h.def.spd * 0.35, 10, dt); h.moving = !!(I.mx || I.my); if (want !== null) faceTo(h, want);
    if (chance(dt * (full ? 30 : 12))) part({ k: 'glow', x: h.x + rand(-7, 7), y: h.y + rand(-3, 3), z: rand(2, 16), vz: rand(10, 30), life: 0.4, s0: full ? 2.4 : 1.4, s1: 0, col: full ? 'gold' : 'white' });
    if (full && !a.ready) { a.ready = true; ring(h.x, h.y, 16, 'gold', 0.25, 2); SFX.charge && SFX.charge(); }
    if (I.atkR || !I.atk) { I.atkR = false; h.act = null; if (full) startMove(h, H, want); else lightAttack(h, want); }
    return;
  }
  // an attack: wind-up, strike, recovery
  const mv = a.mv, w = mv.wind, s = mv.wind + mv.act, e = s + mv.rec;
  if (a.phase === 'wind') { h.vx = damp(h.vx, 0, 18, dt); h.vy = damp(h.vy, 0, 18, dt); h.moving = false; if (a.t >= w) { a.phase = 'act'; strikeStart(h, a); } }
  if (a.phase === 'act') { const u = mv.dash ? 1 : 1 - (a.t - w) / mv.act; const L = mv.lunge || 0; h.vx = Math.cos(a.dir) * L * u; h.vy = Math.sin(a.dir) * L * u * 0.85; if (mv.through) h.iframe = Math.max(h.iframe, 0.05); strikeHits(h, a); if (a.t >= s) { a.phase = 'rec'; if (mv.dash) { h.vx *= 0.25; h.vy *= 0.25; } } }
  if (a.phase === 'rec') {
    h.vx = damp(h.vx, 0, 14, dt); h.vy = damp(h.vy, 0, 14, dt); h.moving = false;
    const heavy = mv === weaponOf(h).heavy;
    if (a.buf && !heavy && a.t >= s + Math.min(0.08, mv.rec * 0.4)) { h.act = null; lightAttack(h, want, true); return; }
    if (a.t >= e) { h.act = null; if (heavy) { h.combo = 0; h.comboT = 0; } else h.comboT = 0.35; }
  }
}
function strikeStart(h, a) {
  const mv = a.mv, x = h.x, y = h.y - 6; SFX.slash(panOf(h.x));
  if (mv.k === 'arc') arcFx(x, y, a.dir, mv.arc, mv.reach, 'white', 0.16, mv.dm > 1.2 ? 4 : 3);
  else if (mv.k === 'line') { for (let i = 0; i < 6; i++) { const f = i / 6, d = mv.reach * (0.3 + 0.7 * f); part({ k: 'spark', x: x + Math.cos(a.dir) * d, y: h.y + Math.sin(a.dir) * d * 0.85, z: 6, vx: Math.cos(a.dir) * 160, vy: Math.sin(a.dir) * 130, g: 0, drag: 6, life: 0.14, col: 'white' }); } }
  else { const cx = h.x + Math.cos(a.dir) * (mv.at || 0), cy = h.y + Math.sin(a.dir) * (mv.at || 0) * 0.85; if (mv.spin) { arcFx(x, y, a.dir, TAU, mv.reach, 'white', 0.24, 3); arcFx(x, y, a.dir + Math.PI, TAU, mv.reach * 0.8, 'white', 0.2, 2); } if (mv.slam) { ring(cx, cy, mv.reach * 1.3, 'white', 0.35, 4); debris(cx, cy, 14, ['#5a5048', '#7d7064'], 120, 160, 1.6); smoke(cx, cy, 6, 'dust', 10, 40, 1); cracks(cx, cy, 3, 16, 200, 1); shake(0.35); kick(0.04); SFX.boom(0.7, panOf(cx)); } }
}
function strikeHits(h, a) {
  const mv = a.mv, W = weaponOf(h), ox = mv.k === 'circle' && mv.at ? Math.cos(a.dir) * mv.at : 0, oy = mv.k === 'circle' && mv.at ? Math.sin(a.dir) * mv.at * 0.85 : 0, src = { x: h.x + ox, y: h.y + oy };
  for (const f of G.foes) {
    if (f.dead || a.hit.has(f) || !hitsShape(src, f, mv, a.dir)) continue; if (!lineOfSight(h.x, h.y - 4, f.x, f.y - 4)) continue;
    a.hit.add(f); let crit = 1, o = {};
    if (!f.aware) { crit = 2.5 * (W.back || 1); o.sneak = true; }
    else if (Math.abs(angDiff(f.dir, angTo(f.x, f.y, h.x, h.y))) > 2.1) { crit = 1.5 * (W.back || 1); o.back = true; }
    if (h.riposteT > 0 && f.stun > 0) { crit = Math.max(crit, 2.4); o.riposte = true; h.riposteT = 0; }
    const ka = angTo(h.x, h.y, f.x, f.y);
    hurt(f, W.dmg * mv.dm, h, { ...o, crit, poise: mv.poise * (crit > 1 ? 1.5 : 1), kx: Math.cos(ka) * mv.push, ky: Math.sin(ka) * mv.push * 0.8 });
    sparks(f.x, f.y, 8 * f.scale, 6, crit > 1 ? 'gold' : 'white', 120, 70, ka, 1.6); const big = mv.dm >= 2 || crit > 1; freeze(f, big ? 0.12 : 0.07); freeze(h, big ? 0.06 : 0.025); if (crit > 1) { kick(0.04); flashLight(f.x, f.y, 50, 'gold', 1, 0.2); }
  }
  for (const p of ARENA.props) if (!p.dead && p.hp < 1e8 && hitsShape(src, { x: p.x, y: p.cy, r: p.r }, mv, a.dir)) breakProp(p);
}
function breakProp(p) {
  if (p.dead || p.hp > 1e8) return; p.dead = true; p.solid = false;
  debris(p.x, p.cy, 18, ['#6a4a2a', '#8a6638', '#4a3018', '#a07848'], 140, 180, 2.2); smoke(p.x, p.cy, 4, 'dust', 9, 30, 1.2); SFX.crack(panOf(p.x));
  if (chance(p.kind === 'chest' ? 1 : 0.25)) dropGold(p.x, p.cy, p.kind === 'chest' ? randi(6, 14) : randi(1, 4));
}
function healGlow(x, y) { for (let i = 0; i < 12; i++) part({ k: 'glow', x: x + rand(-7, 7), y: y + rand(-3, 3), z: rand(0, 14), vz: rand(20, 50), drag: 1, life: rand(0.6, 1.2), s0: rand(2, 4), s1: 0, col: 'heal' }); flashLight(x, y, 60, 'heal', 1, 0.4); }
function ghost(u, life = 0.25) { FX.ghosts.push({ spr: u.spr, x: u.x, y: u.y, z: u.z, face: u.face, sc: u.scale, fr: ((u.anim * 9) | 0) % 4, t: 0, life }); }
