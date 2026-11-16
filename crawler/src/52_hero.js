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
const newInp = () => ({ mx: 0, my: 0, aim: null, atk: false, atkP: false, atkR: false, dodgeP: false, dodge: false, block: false, itemP: false });
function makeHero(kitKey) {
  const k = KITS[kitKey], h = mkActor('hero', { ...k, r: 5, poise: 30 }, 0, 0);
  Object.assign(h, { kit: kitKey, weapon: k.weapon, off: k.off, stam: 100, maxStam: 100, stamT: 0, flasks: 3, maxFlasks: 3, lightR: 78, blockT: 0, riposteT: 0, combo: 0, comboT: 0, pressT: -1, inp: newInp(), pname: 'P1' });
  return h;
}
const weaponOf = h => WEAPONS[h.weapon];
// Every move takes stamina, and a short pause follows before it comes back. Spending the very last of it leaves the hero
// winded: nothing comes back for 1.6 s, and they stand there panting until a third of the bar has returned.
const WINDED = 1.6, WINDED_PACE = 0.4, SPRINT = { speed: 1.6, cost: 33 }; // a sprint: 1.6x speed, 33 stamina a second
function spendStam(h, n, delay) { h.stam = Math.max(0, h.stam - n); h.stamT = Math.max(h.stamT, delay); if (h.stam <= 0) winded(h); }
function winded(h) { h.stamT = Math.max(h.stamT, WINDED); if (!h.huff) h.huff = { t: 0.18, out: true }; }
// the winded breathing, as chosen on the Winded Breath Board ("Through the nose")
const BREATH = { vol: 0.1, inVol: 0.5, len: 0.18, inLen: 0.9, pace: 0.55, cycles: 5, fade: 0.5, mouth: 0.1, tone: 0.85, focus: 0.2, air: 0.15, dark: 0.75, attack: 0.25, flutter: 0.15, grunt: 0, vary: 0.3 };
function pant(h, dt) {
  const H = h.huff; if (h.dead || (h.stamT <= 0 && h.stam >= h.maxStam / 3)) { h.huff = null; return; }
  if (chance(dt * (h.stamT > 0 ? 5 : 2.5))) sweat(h); // fewer drops once the stamina is coming back
  if ((H.t -= dt) > 0) return; const B = BREATH;
  const slow = (h.stamT > 0 ? 1 : 1.35) * (1 + rand(-0.2, 0.2) * B.vary), lvl = h.stamT > 0 ? 1 : lerp(1, B.fade, clamp(h.stam / (h.maxStam / 3), 0, 1)); // slower and quieter as he recovers
  if (H.out) { SFX.breath(B, 'out', lvl, panOf(h.x)); for (let i = 0; i < 2; i++) part({ k: 'smoke', x: h.x + h.face * (5 + i * 2), y: h.y + 1, z: 10 + i, vx: h.face * rand(12, 22), vy: rand(-3, 3), vz: rand(3, 8), drag: 2, life: 0.8, s0: 2.5, s1: 6.5, col: 'breath', a0: 0.9, a1: 0 }); H.t = B.pace * 0.45 * slow; }
  else { SFX.breath(B, 'in', lvl, panOf(h.x)); H.t = B.pace * 0.55 * slow; }
  H.out = !H.out;
}
// A hero's weapon, swung: the angle it points (screen space, about the hand) through each move. It starts from wherever
// it is (a combo flows on), draws back in the wind-up, sweeps through the arc in the strike and settles back to rest in
// the recovery. A thrust draws back and drives forward along the line (the shaft slides through the hand); a dash points
// ahead; the spin goes once round; the slam is raised overhead and brought down on the spot ahead; charging, the weapon
// is raised back over the shoulder.
const angLerp = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t, easeOut = t => 1 - (1 - t) * (1 - t), easeIO = t => t * t * (3 - 2 * t);
// the guard arc drawn while blocking: centred on the hero's middle, flattened like the floor, a little over a quarter turn.
// The weapon is held across between him and the arc: laid along the arc's direction at its middle, and brought in from
// the arc as far as it takes for every part of it under the arc (with its outline) to stay GUARD.gap inside the line
const GUARD = { r: 9, k: 0.75, dy: -4, half: 0.9, gap: 1.5 };
function guardOut(Wc, d, m) { // how far out the weapon reaches under the arc, in arc radii, its middle m out along d
  const half = Wc.len / 2 + 1, K = GUARD.k, ta = Math.atan2(Math.cos(d) * K, -Math.sin(d)), cx = Math.cos(d), sy = Math.sin(d); let R = 0;
  for (let j = 0; j <= 16; j++) {
    const s = (j / 8 - 1) * half, x = cx * (m + 1) + s * Math.cos(ta), y = sy * (m + 1) * K + s * Math.sin(ta), e = Math.atan2(y / K, x);
    if (Math.abs(Math.atan2(Math.sin(e - d), Math.cos(e - d))) <= GUARD.half + 0.1) R = Math.max(R, Math.hypot(x, y / K));
  }
  return R;
}
function guardM(spr, d) { // per weapon, a table over 64 directions (each the least of it and its neighbours, so it eases round)
  const Wc = WEAPON[spr]; if (!Wc.guardM) {
    const raw = []; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU; let m = GUARD.r - 1; while (m > 0 && guardOut(Wc, a, m) > GUARD.r - GUARD.gap) m -= 0.25; raw.push(m); }
    Wc.guardM = raw.map((m, i) => Math.min(m, raw[(i + 1) % 64], raw[(i + 63) % 64]));
  }
  const f = ((d / TAU % 1) + 1) % 1 * 64, i = Math.floor(f) % 64; return lerp(Wc.guardM[i], Wc.guardM[(i + 1) % 64], f - Math.floor(f));
}
function weaponPose(h) {
  const Wc = WEAPON[h.spr], a = h.act; if (!Wc || h.dead) return null;
  const R = Wc.rest, fs = h.face < 0 ? -1 : 1, UP = -Math.PI / 2;
  if (h.blocking && !a) { // the guard: the weapon laid along the block arc, its middle on the arc's middle, eased in from the hand
    const d = h.dir, m = guardM(h.spr, d), mx = h.x + Math.cos(d) * m, my = h.y + GUARD.dy + Math.sin(d) * m * GUARD.k;
    const ta = Math.atan2(Math.cos(d) * GUARD.k, -Math.sin(d)), vert = Math.abs(Math.sin(d)) > 0.6; // the arc's direction at its middle
    const th = vert ? (Math.cos(ta) * fs < 0 ? ta : ta + Math.PI) : (Math.sin(ta) < 0 ? ta : ta + Math.PI); // blade up beside him, across him above or below
    const p = easeOut(Math.min(1, h.blockT / 0.08)), from = h.swTh === undefined ? R : h.swTh;
    return { th: angLerp(from, th, p), push: 0, at: [mx - Math.cos(th) * Wc.mid, my - Math.sin(th) * Wc.mid], blend: p, front: Math.sin(d) > 0.3, behind: Math.sin(d) < -0.6 };
  }
  const still = h.gore > 0.05 && GORE.level ? { th: R, push: 0 } : null; // a bloodied blade is drawn on its own even at rest
  if (!a) return still;
  if (a.k === 'charge') { const p = Math.min(1, a.t / weaponOf(h).heavy.charge); return { th: angLerp(R, UP - fs * 1.0, easeOut(p)), push: 0, shake: p >= 1 }; }
  if (a.k !== 'atk') return still;
  if (a.th0 === undefined) a.th0 = h.swTh === undefined ? R : h.swTh;
  const mv = a.mv, w = mv.wind, s = w + mv.act, t = a.t, d = a.dir, rec = clamp((t - s) / mv.rec, 0, 1), home = (th, from = 0.25) => angLerp(th, R, easeIO(clamp((rec - from) / (1 - from), 0, 1)));
  if (mv.k === 'arc') {
    const sw = (mv.sweep || 1) * fs, half = mv.arc / 2 * 1.15, a0 = d - sw * half, a1 = d + sw * half;
    if (t < w) return { th: angLerp(a.th0, a0, easeOut(t / w)), push: 0 };
    if (t < s) return { th: a0 + (a1 - a0) * easeOut((t - w) / mv.act), push: 1 };
    return { th: home(a1), push: 0 };
  }
  if (mv.k === 'line') {
    const reach = mv.dash ? 2 : mv.reach >= 30 ? 3 : 2;
    if (t < w) { const p = easeOut(t / w); return { th: angLerp(a.th0, d, p), push: mv.dash ? 0 : -1.5 * p }; }
    if (t < s) return { th: d, push: mv.dash ? reach : -1.5 + (reach + 1.5) * easeOut((t - w) / mv.act) };
    return { th: home(d, 0.3), push: reach * (1 - rec) };
  }
  if (mv.slam) {
    const up = UP - fs * 0.5, down = angLerp(d, Math.PI / 2, 0.35);
    if (t < w) return { th: angLerp(a.th0, up, easeOut(t / w)), push: 0 };
    if (t < s) return { th: angLerp(up, down, easeOut((t - w) / mv.act)), push: 1 };
    return { th: home(down, 0.4), push: 0 };
  }
  if (t < w) return { th: angLerp(a.th0, d, t / w), push: 0 };
  if (t < s) return { th: d + fs * TAU * easeOut((t - w) / mv.act), push: 1 };
  return { th: home(d, 0), push: 0 };
}
// a drop of sweat: it beads at the edge of the head, runs down the side with him, lets go at the jaw and falls; where it
// lands it leaves a wet pixel that dries
// The outline of a hero's head, measured once from his sprite (without his weapon), frame by frame: the top row of the
// head and, for each row below it, the left and right edge of the head (the run of pixels through the middle of the head,
// so a shoulder or a shield beside it does not count). A drop of sweat sits on the edge pixel of the row it has reached.
const HEADS = {};
function headSpan(spr) {
  if (HEADS[spr]) return HEADS[spr]; const m = MOBS[spr], fw = m[1], fh = m[2], Wc = WEAPON[spr], P = PIX.mobs;
  const d = Wc ? Wc.cut.getContext('2d').getImageData(0, 0, fw * 4, fh).data : null;
  const op = (f, x, y) => x >= 0 && x < fw && y >= 0 && y < fh && (d ? d[(y * fw * 4 + f * fw + x) * 4 + 3] : P.d[((m[0] + y) * P.w + f * fw + x) * 4 + 3]) > 128;
  const frames = [];
  for (let f = 0; f < 4; f++) {
    let top = 0; while (top < fh - 1 && ![...Array(fw).keys()].some(x => op(f, x, top))) top++;
    let c0 = fw, c1 = 0; for (let x = 0; x < fw; x++) if (op(f, x, top)) { c0 = Math.min(c0, x); c1 = Math.max(c1, x); } const c = Math.round((c0 + c1) / 2);
    const rows = []; for (let k = 0; k < 8 && top + k < fh; k++) { const y = top + k; if (!op(f, c, y)) { rows.push(rows[k - 1] || [c, c]); continue; } let l = c, r = c; while (op(f, l - 1, y)) l--; while (op(f, r + 1, y)) r++; rows.push([l, r]); }
    frames.push({ top, rows });
  }
  return (HEADS[spr] = { f: frames, fw, foot: footOf(spr) });
}
// a drop of sweat: it beads a row or two below the top of the head on its left or right edge, runs down that edge with him,
// lets go at the jaw and falls; where it lands it leaves a wet pixel that dries
function sweat(h) { part({ k: 'drop', on: h, side: chance(0.5) ? -1 : 1, row: rand(1, 2.5), rowEnd: rand(4.5, 6), rate: rand(6, 10), x: h.x, y: h.y + 0.5, z: 0, g: 0, vz: 0, life: 4, col: chance(0.7) ? '#cfe9ff' : '#9cc9ee' }); }
// where a running drop is this frame: on the edge pixel of its row, mapped to the screen exactly as the sprite is drawn
function placeDrop(p, u) {
  const H = headSpan(u.spr), fw = H.fw, fr = ((u.anim * (u.moving ? (u.noise === 0 ? 5 : 9) : 5)) | 0) % 4, F = H.f[fr], r = Math.min(F.rows.length - 1, Math.floor(p.row));
  const kx = p.side < 0 ? F.rows[r][0] : F.rows[r][1], px0 = Math.round(u.x - fw / 2), col = u.face < 0 ? px0 + fw - 1 - kx : px0 + kx;
  const dip = Math.min(2, (u.moving && u.noise === 0 && !u.act ? 1 : 0) + (u.dipT > 0 ? 1 : 0)), rowY = Math.round(u.y - u.z - H.foot - 1) + F.top + r + dip;
  p.x = col + 0.25; p.y = u.y + 0.5; p.z = p.y - rowY - 0.25; // rounds to exactly that pixel
}
function canRoll(h) { const a = h.act; return h.stam > 0 && h.stun <= 0 && (!a || a.k === 'charge' || (a.k === 'atk' && a.phase === 'rec') || a.k === 'drink'); }
// a new floor: the hero walks down out of the stairway into the room, then is yours
function enterTick(h) { h.vx = 0; h.vy = 26; h.moving = true; h.dir = Math.PI / 2; if (h.y >= h.enter.y1) { h.enter = null; h.vy = 0; h.moving = false; } }
function heroTick(h, dt) {
  const I = h.inp; if (h.dead) { h.deadT += dt; deathTick(h, dt); I.atkP = I.atkR = I.dodgeP = I.itemP = false; return; }
  if (h.enter) { enterTick(h); I.atkP = I.atkR = I.dodgeP = I.itemP = false; return; }
  if (h.iframe > 0) h.iframe -= dt; if (h.riposteT > 0) h.riposteT -= dt; if (h.comboT > 0) h.comboT -= dt;
  if (h.poiseT > 0) h.poiseT -= dt; else h.poise = h.maxPoise; if (h.poiseGuard > 0) h.poiseGuard -= dt;
  if (h.dipT > 0) h.dipT -= dt; if (h.huff) pant(h, dt);
  if (h.stamT > 0) h.stamT -= dt; else if (!(h.act && h.act.k !== 'charge')) h.stam = Math.min(h.maxStam, h.stam + (h.blocking ? 16 : 58) * dt);
  const want = I.mx || I.my ? Math.atan2(I.my, I.mx) : null;
  h.noise = h.sprint ? 2 : !h.act ? (Math.hypot(I.mx, I.my) > CREEP + 0.05 ? 1 : 0) : h.act.k === 'roll' || h.act.k === 'atk' ? 2 : h.act.k === 'drink' ? 0 : 1;
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
  // sprinting: half as fast again, for as long as roll and a direction are held and the stamina lasts (it does not refill
  // meanwhile, and running it dry leaves the hero winded); loud, and kicking up dust
  if (h.sprint && (!I.dodge || !(I.mx || I.my) || blocking || h.stam <= 0)) h.sprint = false;
  if (h.sprint) { spendStam(h, SPRINT.cost * dt, 0.5); if (h.stam <= 0) h.sprint = false; if ((h.dustT = (h.dustT || 0) - dt) <= 0) { h.dustT = 0.1; smoke(h.x - I.mx * 4, h.y, 1, 'dust', 5, 10, 0.5, 6); } }
  const tired = !h.huff ? 1 : h.stamT > 0 ? WINDED_PACE : lerp(WINDED_PACE, 1, clamp(h.stam / (h.maxStam / 3), 0, 1)); // winded: a trudge, picking up as the stamina returns
  const spd = h.def.spd * (blocking ? 0.45 : h.sprint ? SPRINT.speed : 1) * tired;
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
  spendStam(h, mv.stam, 0.65); h.blocking = false; h.sprint = false;
  const dir = aimAssist(h, want !== null && want !== undefined ? want : h.dir, mv.reach); faceTo(h, dir);
  h.act = { k: 'atk', mv, t: 0, phase: 'wind', dir, hit: new Set(), buf: false };
  return true;
}
function startRoll(h, want) {
  const K = KITS[h.kit], dir = want !== null ? want : h.dir + Math.PI, len = 46 * (K.roll || 1), dur = 0.34;
  spendStam(h, 20, 0.6); h.blocking = false; h.sprint = false; h.iframe = 0.26; if (h.gore) h.gore = Math.max(0, h.gore - 0.6); // a roll wipes some blood off the blade
  h.act = { k: 'roll', t: 0, dur, dir, spd: len / dur * 1.45 }; if (want !== null) faceTo(h, dir);
  smoke(h.x, h.y, 3, 'dust', 7, 26, 0.6); SFX.whoosh(panOf(h.x));
}
function actTick(h, a, dt, I, want) {
  a.t += dt;
  if (a.k === 'roll') {
    const u = a.t / a.dur, s = a.spd * (1 - u) * (1 - u * 0.4); h.vx = Math.cos(a.dir) * s; h.vy = Math.sin(a.dir) * s * 0.85; h.moving = true;
    if ((a.gT = (a.gT || 0) - dt) <= 0) { a.gT = 0.06; smoke(h.x - Math.cos(a.dir) * 3, h.y, 1, 'dust', 5, 12, 0.45); }
    if (u >= 1) { h.act = null; smoke(h.x, h.y, 2, 'dust', 6, 20, 0.5); h.dipT = 0.08; if (I.dodge && (I.mx || I.my) && h.stam > 0) h.sprint = true; else { h.vx *= 0.3; h.vy *= 0.3; } } // still holding roll and a direction: up and running
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
    hurt(f, W.dmg * mv.dm, h, { ...o, crit, poise: mv.poise * (crit > 1 ? 1.5 : 1), kx: Math.cos(ka) * mv.push, ky: Math.sin(ka) * mv.push * 0.8, ang: ka, style: styleOf(h, mv), sweep: (mv.sweep || 1) * (h.face < 0 ? -1 : 1) });
    sparks(f.x, f.y, 8 * f.scale, 6, crit > 1 ? 'gold' : 'white', 120, 70, ka, 1.6); const big = mv.dm >= 2 || crit > 1; freeze(f, big ? 0.12 : 0.07); freeze(h, big ? 0.06 : 0.025); if (crit > 1) { kick(0.04); flashLight(f.x, f.y, 50, 'gold', 1, 0.2); }
  }
  for (const p of ARENA.props) if (!p.dead && p.hp < 1e8 && !a.hit.has(p) && hitsShape(src, { x: p.x, y: p.cy, r: p.r }, mv, a.dir)) { a.hit.add(p); breakProp(p); }
}
function breakProp(p) {
  if (p.dead || p.hp > 1e8) return; if (p.kind === 'tchest') { openChest(p); return; } if (p.kind === 'ore') { hitOre(p); return; } p.dead = true; p.solid = false;
  debris(p.x, p.cy, 18, ['#6a4a2a', '#8a6638', '#4a3018', '#a07848'], 140, 180, 2.2); smoke(p.x, p.cy, 4, 'dust', 9, 30, 1.2); SFX.crack(panOf(p.x));
  if (chance(p.kind === 'chest' ? 1 : 0.25)) dropGold(p.x, p.cy, p.kind === 'chest' ? randi(6, 14) : randi(1, 4));
  const chest = p.kind === 'chest'; if (chance(chest ? 0.25 : 0.1)) dropItem('fish', p.x, p.cy); if (chance(chest ? 0.2 : 0.05)) dropItem('flask', p.x, p.cy);
}
// An ore rock takes three blows: each one flashes it white (fading back, as a foe does), knocks a chip or two of its own
// stone off, glints where it has silver or gold, and knocks; the third bursts it into chunks of itself that tumble
// away and lie on the floor as rubble. Nothing inside yet.
const ORE_GLINT = [null, ['#dfe8f0', '#9fc3dc'], ['#dfe8f0', '#9fc3dc'], ['#ffe27a', '#e3a92c']];
function hitOre(p) {
  if (p.burst) return; p.hp--; const last = p.hp <= 0, h = G.me, away = h ? angTo(h.x, h.y, p.x, p.cy) : null, sx = p.ore * 32, sy = p.shape * 32;
  p.flashUntil = G.time + 0.12; SFX.stone(panOf(p.x), last); shake(last ? 0.09 : 0.04);
  if (last) { p.burst = G.time + 0.05; p.solid = false; breakSprite(PIX.ores, sx, sy, 32, 32, p.x - 16, p.y - 30, p.y, randi(5, 7), { away, wait: 0.05, spd: 1.15 }); smoke(p.x, p.cy, 5, 'dust', 10, 30, 1.1); }
  else for (let i = 0; i < 2; i++) chipSprite(PIX.ores, sx, sy, 32, 32, p.x - 16, p.y - 30, p.y, away);
  debris(p.x, p.cy - 4, last ? 8 : 3, ['#5a4636', '#7a604a', '#3e3026'], 80, 110, 1.4); // a little grit with it
  if (ORE_GLINT[p.ore]) for (let i = 0; i < (last ? 8 : 3); i++) part({ k: 'spark', x: p.x + rand(-4, 4), y: p.cy, z: rand(4, 12), vx: rand(-60, 60), vy: rand(-30, 30), vz: rand(30, 90), g: 300, life: rand(0.3, 0.6), col: 'white', s0: 1 });
}
// Treasure chests (one in each treasure room): one blow opens it and it stays open. The colour says what is inside: black
// and blue a little gold, red more, gold the most; every chest has a fish or a flask, the red and gold ones both.
const CHEST = { black: { at: [0, 64], gold: [8, 14] }, blue: { at: [0, 48], gold: [12, 20] }, red: { at: [0, 32], gold: [20, 30], both: true }, gold: { at: [0, 16], gold: [30, 45], both: true } };
// gold is rare near the top, likelier deeper down
function chestTier(floor) { const r = Math.random() * (1 + floor * 0.06); return r < 0.45 ? 'black' : r < 0.8 ? 'blue' : r < 1.05 ? 'red' : 'gold'; }
function openChest(p) {
  if (p.open) return; p.open = true; const T = CHEST[p.tier]; SFX.chest(panOf(p.x)); shake(0.06);
  const loot = T.both ? ['fish', 'flask'] : [chance(0.5) ? 'fish' : 'flask'], n = randi(T.gold[0], T.gold[1]), coins = Math.min(n, 6);
  for (let i = 0; i < coins; i++) loot.splice(randi(0, loot.length), 0, Math.ceil(n / coins));
  loot.forEach((k, i) => spill(p, k, i, loot.length));
  for (let i = 0; i < 14; i++) part({ k: 'glow', x: p.x + rand(-6, 6), y: p.cy + rand(-2, 3), z: rand(4, 12), vz: rand(20, 60), life: rand(0.5, 1), s0: rand(1.5, 2.5), s1: 0, col: 'gold' }); flashLight(p.x, p.cy, 60, 'gold', 1, 0.5);
}
// one piece of a chest's contents: it waits its turn, then is tossed out of the chest's front (away from the wall
// it stands against), spread over a fan so the pieces land apart; coins lie there a second before they fly to you
function spill(p, k, i, n) {
  const a = Math.PI / 2 + (n > 1 ? (i / (n - 1) - 0.5) * 2.2 : 0) + rand(-0.15, 0.15), v = rand(55, 80), gold = typeof k === 'number';
  G.drops.push({ k: gold ? 'gold' : k, v: gold ? k : 0, x: p.x + rand(-2, 2), y: p.cy + 3, z: 8, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: rand(90, 130), t: 0, wait: 0.12 + i * 0.09, hold: 1.4 });
}
function healGlow(x, y) { for (let i = 0; i < 12; i++) part({ k: 'glow', x: x + rand(-7, 7), y: y + rand(-3, 3), z: rand(0, 14), vz: rand(20, 50), drag: 1, life: rand(0.6, 1.2), s0: rand(2, 4), s1: 0, col: 'heal' }); flashLight(x, y, 60, 'heal', 1, 0.4); }
function ghost(u, life = 0.25) { FX.ghosts.push({ spr: u.spr, x: u.x, y: u.y, z: u.z, face: u.face, sc: u.scale, fr: ((u.anim * 9) | 0) % 4, t: 0, life }); }
