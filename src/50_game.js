// ===================== game state & party =====================
const G = {};
let M = null;
const TIME_SCALE = 2;          // game minutes per real second
const DAY = 1440;
const SAVE_KEY = 'harrowmere_mm_v1';
const dayOf = () => Math.floor(G.time / DAY) + 1;
const hourOf = () => Math.floor((G.time % DAY) / 60);
const minuteOf = () => Math.floor(G.time % 60);
const isNight = () => { const h = hourOf(); return h >= 20 || h < 6; };
function daylight() { const h = (G.time % DAY) / 60; if (h < 5) return 0; if (h < 7) return (h - 5) / 2; if (h < 18) return 1; if (h < 21) return 1 - (h - 18) / 3; return 0; }

// ---- members ----
function makeMember(name, cls) {
  const c = CLASSES[cls];
  const m = { name, cls, lvl: 1, xp: 0, stats: Object.assign({}, c.stats), skills: Object.assign({}, c.start), skillPts: 0, equip: {}, spells: c.spells.slice(), cond: {}, rec: 0, hp: 1, sp: 1, portrait: c.sprite, hurt: 0, bounce: 0 };
  for (const g of c.gear) equipItem(m, makeItem(g), true);
  m.hp = maxHp(m); m.sp = maxSp(m);
  return m;
}
function equipList(m) { return Object.values(m.equip).filter(Boolean); }
function enchSum(m, key) { let v = 0; for (const it of equipList(m)) { if (!it.ench) continue; const e = ENCHANTS.find(x => x.id === it.ench); if (e[key] !== undefined && key !== 'stat') v += it.ev; } return v; }
function effStat(m, s) { let v = m.stats[s]; for (const it of equipList(m)) { if (!it.ench) continue; const e = ENCHANTS.find(x => x.id === it.ench); if (e.stat === s) v += it.ev; } if (m.cond.weak) v -= 3; return Math.max(1, v); }
function maxHp(m) { const c = CLASSES[m.cls]; return Math.max(1, c.baseHp + m.lvl * (c.hpLv + statBonus(effStat(m, 'en')) + (m.skills.BodyBuilding || 0)) + enchSum(m, 'hp')); }
function maxSp(m) { const c = CLASSES[m.cls]; if (!c.spStat) return 0; return Math.max(0, c.baseSp + m.lvl * (c.spLv + statBonus(effStat(m, c.spStat)) + (m.skills.Meditation || 0)) + enchSum(m, 'spts')); }
function armorClass(m) {
  let ac = statBonus(effStat(m, 'sp'));
  for (const it of equipList(m)) { const b = ITEMS[it.id]; if (b.acv) ac += b.acv; if (it.ench) { const e = ENCHANTS.find(x => x.id === it.ench); if (e.acv) ac += it.ev; } if (b.skill && (b.type === 'armor' || b.type === 'shield') && (m.skills[b.skill] || 0) >= 4) ac += m.skills[b.skill]; if (b.type === 'shield') ac += (m.skills.Shield || 0); if (b.skill === 'Staff' && (m.skills.Staff || 0) >= 4) ac += 2 * m.skills.Staff; if (b.skill === 'Spear' && (m.skills.Spear || 0) >= 4) ac += 1; }
  if (buffOn('shield')) ac += 8 + G.buffs.shield.pow; if (buffOn('stoneskin')) ac += 12 + G.buffs.stoneskin.pow;
  return Math.max(0, ac);
}
function weaponOf(m) { return m.equip.weapon ? ITEMS[m.equip.weapon.id] : null; }
function isRanged(m) { const w = weaponOf(m); return !!(w && w.ranged); }
function attackBonus(m) { const w = weaponOf(m); let b = statBonus(effStat(m, 'ac')); if (w) b += (m.skills[w.skill] || 0); if (m.equip.weapon && m.equip.weapon.ench === 'ac_') b += m.equip.weapon.ev; if (buffOn('bless')) b += 5 + G.buffs.bless.pow; return b; }
function damageRoll(m) {
  const w = weaponOf(m); let d = w ? roll(w.dmg[0], w.dmg[1], w.dmg[2]) : roll(1, 3, 0);
  if (!(w && w.ranged)) d += statBonus(effStat(m, 'mt')); else d += Math.floor(statBonus(effStat(m, 'mt')) / 2);
  if (w && (m.skills[w.skill] || 0) >= 8 && ['Sword', 'Axe', 'Dagger', 'Bow'].includes(w.skill)) d += m.skills[w.skill];
  if (m.equip.weapon && m.equip.weapon.ench === 'dmg') d += m.equip.weapon.ev;
  if (buffOn('heroism')) d += 3 + G.buffs.heroism.pow; if (m.buffHammer > 0) d += m.buffHammer;
  if (w && w.skill === 'Dagger' && (m.skills.Dagger || 0) >= 8 && Math.random() < 0.15) d *= 3;
  return Math.max(1, d);
}
function weaponElem(m) { const it = m.equip.weapon; if (!it || !it.ench) return null; const e = ENCHANTS.find(x => x.id === it.ench); return e.elem ? { elem: e.elem, dmg: it.ev } : null; }
function recoveryTime(m) {
  const w = weaponOf(m); let ticks = w ? w.rec : 60;
  for (const it of equipList(m)) { const b = ITEMS[it.id]; if (b.recPen) ticks += b.recPen * Math.max(0, 1 - (m.skills[b.skill] || 0) * 0.2); }
  if (w && (m.skills[w.skill] || 0) >= 4 && (w.skill === 'Sword' || w.skill === 'Bow')) ticks -= 10;
  ticks -= statBonus(effStat(m, 'sp')) * 4;
  return clamp(ticks / 60, 0.35, 3);
}
function canUse(m, it) { const b = ITEMS[it.id]; if (!b) return false; if (b.type === 'weapon' && b.skill && !(m.skills[b.skill] > 0)) return false; if ((b.type === 'armor' || b.type === 'shield') && b.skill && !(m.skills[b.skill] > 0)) return false; return true; }
function equipItem(m, it, silent) {
  const b = ITEMS[it.id], slot = SLOT_OF[b.type]; if (!slot) return false;
  if (!canUse(m, it)) { if (!silent) log(m.name + ' lacks the ' + b.skill + ' skill.'); return false; }
  const old = m.equip[slot]; m.equip[slot] = it;
  if (b.twoHand && m.equip.shield) { G.inv.push(m.equip.shield); m.equip.shield = null; }
  if (b.type === 'shield' && m.equip.weapon && ITEMS[m.equip.weapon.id].twoHand) { G.inv.push(m.equip.weapon); m.equip.weapon = null; }
  if (old) G.inv.push(old);
  m.hp = Math.min(m.hp, maxHp(m)); m.sp = Math.min(m.sp, maxSp(m));
  return true;
}
function unequip(m, slot) { const it = m.equip[slot]; if (!it) return; m.equip[slot] = null; G.inv.push(it); m.hp = Math.min(m.hp, maxHp(m)); }
function alive(m) { return !m.cond.dead && !m.cond.unconscious; }
function addInv(it) { const b = ITEMS[it.id]; if (b.stack) { const ex = G.inv.find(x => x.id === it.id); if (ex) { ex.qty += it.qty || 1; return; } } G.inv.push(it); }
function removeInv(id, n = 1) { const ex = G.inv.find(x => x.id === id); if (!ex) return false; if (ex.qty > n) ex.qty -= n; else G.inv.splice(G.inv.indexOf(ex), 1); return true; }
function countInv(id) { const ex = G.inv.find(x => x.id === id); return ex ? ex.qty : 0; }
function buffOn(id) { return G.buffs[id] && G.buffs[id].until > G.time; }
function addBuff(id, hours, pow) { G.buffs[id] = { until: G.time + hours * 60, pow }; }

// ---- messages ----
function log(t) { const last = G.log[G.log.length - 1]; if (last && last.text === t) { last.t = 0; return; } G.log.push({ text: t, t: 0 }); if (G.log.length > 6) G.log.shift(); }
function notice(text, sub, dur = 3) { G.notice = { text, sub, t: dur, dur }; }

// ---- new game ----
function newGame(members) {
  Object.assign(G, {
    mode: 'play', party: members, sel: 0, gold: 500, food: 6, time: 8 * 60, inv: [], buffs: {}, mapState: {}, quests: {}, counters: {}, flags: {}, log: [], notice: null, screen: null,
    turnBased: false, tbClock: 0, monsters: [], projs: [], fx: [], drops: [], trail: [], facing: 1, kills: 0, playTime: 0, camSet: false, lastRest: 8 * 60, fadeT: 0,
  });
  addInv(makeItem('potion_heal')); addInv(makeItem('potion_heal')); addInv(makeItem('torch')); addInv(makeItem('torch'));
  enterMap('over', null, null);
  notice('HARROWMERE', 'Day 1, morning', 4);
  log('Welcome to Harrowmere. Lord Harrow\'s hall is north of the square.');
}
function defaultParty() { return [makeMember('Roderick', 'Knight'), makeMember('Sable', 'Archer'), makeMember('Mira', 'Cleric'), makeMember('Vesper', 'Sorcerer')]; }

// ---- maps ----
function mapState(id) { if (!G.mapState[id]) G.mapState[id] = { dead: {}, opened: {}, lastVisit: -1e9, explored: null }; return G.mapState[id]; }
function enterMap(id, x, y) {
  if (M) { const st = mapState(M.id); st.explored = M.explored; st.lastVisit = G.time; }
  M = getMap(id); const st = mapState(id);
  // respawn
  const respawnAfter = id === 'over' ? 3 * DAY : 10 * DAY;
  if (st.lastVisit > -1e8 && G.time - st.lastVisit > respawnAfter) { for (const k in st.dead) { const mo = M.monsters[k]; if (mo && !mo.boss) delete st.dead[k]; } }
  if (st.explored && st.explored.length === M.explored.length) M.explored = st.explored; else st.explored = M.explored;
  G.monsters = []; M.monsters.forEach((mo, i) => { if (st.dead[i]) return; G.monsters.push(spawnMonster(mo, i)); });
  G.projs = []; G.fx = []; G.drops = [];
  const sx = x !== null && x !== undefined ? x : M.start.x, sy = y !== null && y !== undefined ? y : M.start.y;
  G.x = sx; G.y = sy; G.trail = []; for (let i = 0; i < 24; i++) { const ox = sx, oy = sy + i * 0.22; G.trail.push(mPass(M, Math.floor(ox), Math.floor(oy)) ? [ox, oy] : [sx, sy]); }
  G.camSet = false; G.mapT = 0;
  if (M.id !== 'over') notice(M.name.toUpperCase(), DUNGEONS[M.id].entrance, 4); else if (G.playTime > 1) notice('HARROWMERE REACH', null, 2.5);
}

// ---- movement ----
const PR = 0.3; // party collision radius
function blockedAt(x, y) { if (!mPass(M, Math.floor(x), Math.floor(y))) return true; return false; }
function moveCircle(ent, dx, dy, r) {
  let nx = ent.x + dx, ny = ent.y;
  if (!(blockedAt(nx + r, ny - r * 0.7) || blockedAt(nx + r, ny + r * 0.7) || blockedAt(nx - r, ny - r * 0.7) || blockedAt(nx - r, ny + r * 0.7))) ent.x = nx; else ent.blocked = true;
  ny = ent.y + dy; nx = ent.x;
  if (!(blockedAt(nx - r * 0.7, ny + r) || blockedAt(nx + r * 0.7, ny + r) || blockedAt(nx - r * 0.7, ny - r) || blockedAt(nx + r * 0.7, ny - r))) ent.y = ny; else ent.blocked = true;
}
function unstick(ent, r) {
  const cx = Math.floor(ent.x), cy = Math.floor(ent.y);
  if (blockedAt(ent.x, ent.y)) { for (let rad = 1; rad < 6; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (!blockedAt(cx + dx + 0.5, cy + dy + 0.5)) { ent.x = cx + dx + 0.5; ent.y = cy + dy + 0.5; return; } return; }
  if (blockedAt(ent.x + r, ent.y)) ent.x = cx + 1 - r - 0.01; if (blockedAt(ent.x - r, ent.y)) ent.x = cx + r + 0.01; if (blockedAt(ent.x, ent.y + r)) ent.y = cy + 1 - r - 0.01; if (blockedAt(ent.x, ent.y - r)) ent.y = cy + r + 0.01;
}
function hasLOS(x0, y0, x1, y1) { const d = dist(x0, y0, x1, y1); const n = Math.ceil(d * 3); for (let i = 1; i < n; i++) { const t = i / n; const tt = mGet(M, Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t)); if (tt === TR.WALL || tt === TR.VOID || tt === TR.ROOF || tt === TR.TREE) return false; } return true; }

function updateParty(dt) {
  const spd = (buffOn('haste') ? 5.5 : 4.2) * (G.chill > 0 ? 0.55 : 1) * (M.outdoor && mGet(M, Math.floor(G.x), Math.floor(G.y)) === TR.ROAD ? 1.15 : 1);
  let mx = I.mx, my = I.my;
  if (mx || my) {
    const p = { x: G.x, y: G.y, blocked: false }; moveCircle(p, mx * spd * dt, my * spd * dt, PR);
    const moved = dist(p.x, p.y, G.x, G.y); G.x = p.x; G.y = p.y;
    if (Math.abs(mx) > 0.2) G.facing = mx < 0 ? -1 : 1;
    G.walkT = (G.walkT || 0) + moved;
    if (moved > 0) { const last = G.trail[0]; if (dist(last[0], last[1], G.x, G.y) > 0.22) { G.trail.unshift([G.x, G.y]); if (G.trail.length > 40) G.trail.pop(); } }
    if (G.turnBased && moved > 0) G.tbClock += moved * 0.6;
  }
  for (const mo of G.monsters) if (!mo.dead) pushApart(G, mo, PR + mo.r, 1);
  const p = { x: G.x, y: G.y }; unstick(p, PR); G.x = p.x; G.y = p.y;
  G.x = clamp(G.x, 0.5, M.w - 0.5); G.y = clamp(G.y, 0.5, M.h - 0.5);
  // explore
  const rad = M.outdoor ? (daylight() > 0.3 ? 11 : 6 + (buffOn('torch') ? 3 : 0)) : 5 + (buffOn('torch') ? 3 : 0);
  const cx = Math.floor(G.x), cy = Math.floor(G.y);
  for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (x >= 0 && y >= 0 && x < M.w && y < M.h && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rad * rad) M.explored[y * M.w + x] = 1;
  // triggers: exits when standing on them, lava damage
  const t = mGet(M, cx, cy);
  if (t === TR.LAVA) { G.lavaT = (G.lavaT || 0) + dt; if (G.lavaT > 0.5) { G.lavaT = 0; for (const m of G.party) if (alive(m)) damageMember(m, 8, 'fire'); log('The lava burns!'); } }
}
function pushApart(a, b, minD, w) {
  const ax = a.x, ay = a.y; let dx = ax - b.x, dy = ay - b.y, d2 = dx * dx + dy * dy; if (d2 >= minD * minD) return;
  if (d2 < 1e-6) { dx = 0.01; dy = 0.005; d2 = dx * dx + dy * dy; }
  const d = Math.sqrt(d2), push = (minD - d) * w;
  const tmp = { x: ax, y: ay }; moveCircle(tmp, dx / d * push, dy / d * push, a === G ? PR : (a.r || 0.3)); a.x = tmp.x; a.y = tmp.y;
}
function memberScreenPositions() { // formation: followers trail the leader
  const out = []; let fi = 0;
  G.party.forEach((m, i) => { if (!alive(m)) return; const idx = Math.min(G.trail.length - 1, fi * 4); const p = fi === 0 ? [G.x, G.y] : G.trail[idx]; out.push({ m, x: p[0], y: p[1], i }); fi++; });
  return out;
}

// ---- interaction ----
function nearestInteractable() {
  let best = null, bd = 1.6;
  for (const o of M.objects) { if (o.taken || (o.kind === 'chest' && o.opened) || o.kind === 'brazier' || o.kind === 'deco') continue; let d = dist(G.x, G.y, o.x + 0.5, o.y + 0.5); if (o.kind === 'door' || o.kind === 'entrance' || o.kind === 'stairs') d -= 0.45; if (d < bd) { bd = d; best = { type: 'object', o, d }; } }
  for (const n of M.npcs) { const d = dist(G.x, G.y, n.x, n.y); if (d < bd) { bd = d; best = { type: 'npc', n, d }; } }
  return best;
}
function interactLabel(it) {
  if (!it) return null;
  if (it.type === 'npc') return 'Talk to ' + it.n.name;
  const o = it.o; switch (o.kind) {
    case 'door': return 'Enter ' + o.name; case 'entrance': return 'Enter ' + o.name; case 'stairs': return 'Leave the dungeon'; case 'chest': return o.big ? 'Open the great chest' : 'Open chest'; case 'pickup': return 'Take ' + ITEMS[o.item].name; case 'sign': return 'Read sign'; case 'well': return 'Drink from the well'; case 'pot': return 'Smash pot'; case 'brazier': case 'deco': return null;
  }
  return null;
}
function doInteract(it) {
  if (!it) return;
  if (it.type === 'npc') { openNpc(it.n); return; }
  const o = it.o;
  switch (o.kind) {
    case 'door': openBuilding(BUILDINGS[o.building]); break;
    case 'entrance': { const d = DUNGEONS[o.dungeon]; if (d.locked && !d.locked.every(k => countInv(k) > 0)) { log('The door is locked. It needs the ' + d.locked.map(k => ITEMS[k].name).join(' and the ') + '.'); return; } enterMap(o.dungeon, null, null); break; }
    case 'stairs': { const ex = M.exits.find(e => e.x === o.x && e.y === o.y); enterMap('over', ex.tx + 0.5, ex.ty + 0.5); break; }
    case 'chest': openChest(o); break;
    case 'pickup': { o.taken = true; mapState(M.id).opened[o.id] = 1; addInv(makeItem(o.item)); log('Found ' + ITEMS[o.item].name + '.'); checkQuests(); break; }
    case 'sign': openText('Sign', o.text); break;
    case 'well': { for (const m of G.party) if (alive(m)) m.hp = Math.min(maxHp(m), m.hp + 10); log('Cool water. The party feels refreshed.'); break; }
    case 'pot': { o.taken = true; mapState(M.id).opened[o.id] = 1; const g = rint(5, 25) * M.tier; G.gold += g; log('Smashed a pot: ' + g + ' gold.'); fxAt(o.x + 0.5, o.y + 0.5, 'spark', '#c8a060'); break; }
  }
}
function openChest(o) {
  const st = mapState(M.id); o.opened = true; st.opened[o.id] = 1;
  const disarm = Math.max(...G.party.map(m => m.skills.Disarm || 0));
  if (Math.random() < 0.22 && Math.random() > disarm * 0.15) { const v = G.party.filter(alive); if (v.length) { const m = pick(v); const d = 4 * o.tier + rint(1, 8); damageMember(m, d, 'phys'); log('A trap! ' + m.name + ' takes ' + d + ' damage.'); } }
  const perc = Math.max(...G.party.map(m => m.skills.Perception || 0));
  const gold = Math.floor((rint(30, 90) * o.tier) * (1 + perc * 0.1)); G.gold += gold;
  const items = []; const n = o.big ? 3 : (Math.random() < 0.6 ? 1 : 2);
  for (let i = 0; i < n; i++) { const it = randomLoot(o.tier, Math.max(...G.party.map(m => effStat(m, 'lk')))); addInv(it); items.push(itemName(it)); }
  if (o.item) { addInv(makeItem(o.item)); items.push(ITEMS[o.item].name); }
  log('Chest: ' + gold + ' gold, ' + items.join(', ') + '.');
  fxAt(o.x + 0.5, o.y + 0.5, 'spark', '#ffd060'); checkQuests();
}

// ---- time, rest, conditions ----
function updateClock(dt) {
  G.time += dt * TIME_SCALE; G.playTime += dt;
  // slow SP regen, poison ticks
  G.regenT = (G.regenT || 0) + dt * TIME_SCALE;
  if (G.regenT >= 15) { G.regenT -= 15; for (const m of G.party) { if (!alive(m)) continue; if (m.sp < maxSp(m)) m.sp = Math.min(maxSp(m), m.sp + 1 + Math.floor((m.skills.Meditation || 0) / 3)); if (m.cond.poison) { m.hp = Math.max(1, m.hp - 2); if (Math.random() < 0.15) log(m.name + ' suffers from poison.'); } } }
  for (const id in G.buffs) if (G.buffs[id].until <= G.time) delete G.buffs[id];
  if (G.chill > 0) G.chill -= dt;
}
function canRest() { for (const mo of G.monsters) if (!mo.dead && mo.aware && dist(mo.x, mo.y, G.x, G.y) < 10) return 'Enemies are nearby!'; return null; }
function restParty(hours = 8, inn = false) {
  if (!inn) { if (G.food <= 0) { log('No food. The party rests poorly.'); } else G.food--; }
  G.time += hours * 60;
  const full = inn || G.food >= 0 && G.lastFood !== 'none';
  for (const m of G.party) { if (m.cond.dead) continue; m.cond.unconscious = false; if (inn) { m.cond.poison = false; } const frac = inn || G.food >= 0 ? 1 : 0.5; m.hp = Math.max(m.hp, Math.floor(maxHp(m) * frac)); m.sp = Math.max(m.sp, Math.floor(maxSp(m) * frac)); m.cond.weak = false; }
  G.lastRest = G.time;
  // monsters wander back home while you sleep
  for (const mo of G.monsters) if (!mo.dead) { mo.aware = false; mo.x = mo.hx; mo.y = mo.hy; mo.hp = Math.min(mo.maxHp, mo.hp + mo.maxHp * 0.5); }
  log('The party rests for ' + hours + ' hours.');
}
function damageMember(m, dmg, elem, src) {
  if (m.cond.dead) return 0;
  dmg = Math.max(0, Math.round(dmg)); if (elem && elem !== 'phys' && elem !== 'mind') { const res = enchSum(m, 'res_' + elem) || 0; for (const it of equipList(m)) { if (it.ench === 'r' + elem) dmg = Math.round(dmg * (1 - Math.min(0.75, it.ev / 100))); } }
  if (m.cond.unconscious) { m.cond.dead = true; m.cond.unconscious = false; m.hp = 0; log(m.name + ' has died!'); checkPartyDead(); return dmg; }
  m.hp -= dmg; m.hurt = 0.5; m.dmgPop = { n: dmg, t: 1 };
  if (m.hp <= 0) { m.hp = 0; m.cond.unconscious = true; log(m.name + ' falls unconscious!'); if (G.sel === G.party.indexOf(m)) selectNextAlive(); checkPartyDead(); }
  return dmg;
}
function selectNextAlive() { for (let i = 0; i < 4; i++) { const j = (G.sel + i) % G.party.length; if (alive(G.party[j])) { G.sel = j; return; } } }
function checkPartyDead() { if (G.party.some(alive)) return; G.mode = 'dead'; G.deadT = 0; }
function partyWipe() {
  // the temple takes a tithe and brings everyone back
  const tithe = Math.floor(G.gold * 0.2); G.gold -= tithe;
  for (const m of G.party) { m.cond = {}; m.hp = Math.max(1, Math.floor(maxHp(m) / 2)); m.sp = Math.floor(maxSp(m) / 2); m.rec = 0; }
  G.time += 12 * 60; G.turnBased = false;
  enterMap('over', getMap('over').townSquare.x, getMap('over').townSquare.y + 1);
  G.mode = 'play'; G.sel = 0;
  log('You wake in the Temple of the Dawn. The priests kept ' + tithe + ' gold for their trouble.');
}

// ---- XP, training, quests ----
function giveXp(n) { for (const m of G.party) if (!m.cond.dead) m.xp += Math.round(n * (1 + (m.skills.Learning || 0) * 0.05)); }
function canTrain(m) { return !m.cond.dead && m.xp >= XP_FOR_LEVEL(m.lvl + 1); }
function train(m) {
  if (!canTrain(m)) return false; const cost = TRAIN_COST(m.lvl + 1); if (G.gold < cost) { log('Not enough gold to train.'); return false; }
  G.gold -= cost; m.lvl++; m.skillPts += 2; m.hp = maxHp(m); m.sp = maxSp(m); log(m.name + ' is now level ' + m.lvl + '.'); return true;
}
function skillUpCost(lv) { return lv + 1; }
function raiseSkill(m, sk) {
  const lv = m.skills[sk] || 0; const cost = skillUpCost(lv);
  if (lv >= 3 && lv < 4 && !(m.promo && m.promo[sk] >= 4)) { log('Expert training is needed to go further.'); return false; }
  if (lv >= 7 && lv < 8 && !(m.promo && m.promo[sk] >= 8)) { log('Master training is needed to go further.'); return false; }
  if (lv >= 10) return false;
  if (m.skillPts < cost) { log('Not enough skill points (' + cost + ' needed).'); return false; }
  m.skillPts -= cost; m.skills[sk] = lv + 1; return true;
}
function questState(id) { return G.quests[id] || 'none'; }
function startQuest(id) { if (questState(id) === 'none') { G.quests[id] = 'active'; log('New quest: ' + QUESTS[id].name); } }
function questProgress(id) { const q = QUESTS[id]; if (q.kill) return Math.min(q.count, G.counters[id] || 0) + '/' + q.count; if (q.items) return q.items.filter(i => countInv(i) > 0).length + '/' + q.items.length; if (q.item && q.count) return Math.min(q.count, countInv(q.item)) + '/' + q.count; if (q.item) return countInv(q.item) > 0 ? 'item found' : 'not yet'; return ''; }
function questReady(id) { const q = QUESTS[id]; if (questState(id) !== 'active') return false; if (q.kill) return (G.counters[id] || 0) >= q.count; if (q.items) return q.items.every(i => countInv(i) > 0); if (q.item) return countInv(q.item) >= (q.count || 1); return false; }
function completeQuest(id) {
  const q = QUESTS[id]; if (!questReady(id)) return false;
  if (q.items) q.items.forEach(i => removeInv(i)); else if (q.item) removeInv(q.item, q.count || 1);
  G.quests[id] = 'done'; G.gold += q.reward.gold || 0; giveXp(q.reward.xp || 0);
  if (q.reward.item) addInv(makeItem(q.reward.item)); if (q.reward.skillPoints) for (const m of G.party) m.skillPts += q.reward.skillPoints;
  log('Quest complete: ' + q.name + '. +' + q.reward.gold + ' gold, +' + q.reward.xp + ' experience.');
  if (q.next) startQuest(q.next); if (q.final) { G.flags.won = true; G.mode = 'ending'; G.endT = 0; }
  return true;
}
function checkQuests() { for (const id in G.quests) if (G.quests[id] === 'active' && questReady(id)) { log('Quest ready to turn in: ' + QUESTS[id].name); } }

// ---- fx helpers ----
function fxAt(x, y, fx, color, extra) { G.fx.push(Object.assign({ kind: 'fx', x, y, fx, color, life: 0.6, dur: 0.6, r: 1, seed: Math.random() * 6 }, extra || {})); }
function fxText(x, y, t, color) { G.fx.push({ kind: 'fx', x, y, fx: 'text', text: t, color, life: 1.1, dur: 1.1 }); }

// ---- save / load ----
function saveGame(slot = 'auto') {
  try {
    if (M) { const st = mapState(M.id); st.explored = M.explored; }
    const ms = {}; for (const id in G.mapState) { const s = G.mapState[id]; ms[id] = { dead: s.dead, opened: s.opened, lastVisit: s.lastVisit, explored: s.explored ? btoa(String.fromCharCode.apply(null, Array.from(s.explored).map(v => v ? 49 : 48))) : null }; }
    const data = { v: 1, party: G.party, gold: G.gold, food: G.food, time: G.time, inv: G.inv, buffs: G.buffs, mapState: ms, quests: G.quests, counters: G.counters, flags: G.flags, mapId: M.id, x: G.x, y: G.y, kills: G.kills, playTime: G.playTime, sel: G.sel, savedAt: Date.now() };
    localStorage.setItem(SAVE_KEY + '_' + slot, JSON.stringify(data)); return true;
  } catch (e) { return false; }
}
function hasSave(slot = 'auto') { try { return !!localStorage.getItem(SAVE_KEY + '_' + slot); } catch (e) { return false; } }
function loadGame(slot = 'auto') {
  let d; try { d = JSON.parse(localStorage.getItem(SAVE_KEY + '_' + slot)); } catch (e) { return false; } if (!d) return false;
  Object.assign(G, { mode: 'play', party: d.party, sel: d.sel || 0, gold: d.gold, food: d.food, time: d.time, inv: d.inv, buffs: d.buffs || {}, mapState: {}, quests: d.quests, counters: d.counters, flags: d.flags, log: [], notice: null, screen: null, turnBased: false, tbClock: 0, monsters: [], projs: [], fx: [], drops: [], trail: [], facing: 1, kills: d.kills || 0, playTime: d.playTime || 0, camSet: false, fadeT: 0 });
  for (const id in d.mapState) { const s = d.mapState[id]; G.mapState[id] = { dead: s.dead, opened: s.opened, lastVisit: s.lastVisit, explored: s.explored ? Uint8Array.from(atob(s.explored), c => c === '1' ? 1 : 0) : null }; }
  for (const m of G.party) { m.rec = 0; m.hurt = 0; m.bounce = 0; m.dmgPop = null; }
  M = null; enterMap(d.mapId, d.x, d.y);
  // restore opened chests / taken pickups
  const st = mapState(M.id); for (const o of M.objects) { if (st.opened[o.id]) { if (o.kind === 'chest') o.opened = true; else o.taken = true; } }
  log('Game loaded.'); return true;
}
