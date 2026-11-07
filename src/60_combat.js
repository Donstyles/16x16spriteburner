// ===================== combat =====================
function spawnMonster(def, idx) {
  const d = MONSTERS[def.kind];
  return { id: idx, kind: def.kind, d, name: d.name, x: def.x, y: def.y, hx: def.x, hy: def.y, hp: d.hp, maxHp: d.hp, r: 0.28 + (d.size || 1) * 0.08, aware: false, dead: false, rec: 1 + Math.random(), stun: 0, slow: 0, fear: 0, anim: Math.random() * 10, flip: false, boss: !!def.boss, drop: def.drop, group: def.group, wanderT: 0, blinkT: 4, summonT: 6, hurt: 0, mimic: !!d.mimic, hidden: !!d.mimic };
}
function restoreOpened() { const st = mapState(M.id); for (const o of M.objects) { if (st.opened[o.id]) { if (o.kind === 'chest') o.opened = true; else o.taken = true; } } }
function combatDt(dt) { return G.cd === undefined ? dt : G.cd; }
function frameCombatDt(dt) { if (!G.turnBased) { G.cd = dt; return; } const d = Math.min(dt, G.tbClock); G.tbClock = Math.max(0, G.tbClock - d); G.cd = d; }
function tbCost(n) { if (G.turnBased) G.tbClock += n; }
function nearestMember() { return { x: G.x, y: G.y }; }
function pickTargetMember() {
  const v = G.party.map((m, i) => ({ m, w: alive(m) ? (i < 2 ? 3 : 1.4) : 0 })).filter(e => e.w > 0); if (!v.length) return null;
  let t = Math.random() * v.reduce((a, e) => a + e.w, 0); for (const e of v) { t -= e.w; if (t <= 0) return e.m; } return v[v.length - 1].m;
}
function monsterResist(mo, elem) { const r = mo.d.res && mo.d.res[elem]; return r || 0; }
function hurtMonster(mo, dmg, elem, srcMember, silent) {
  if (mo.dead) return 0;
  const res = monsterResist(mo, elem || 'phys'); dmg = Math.round(dmg * (1 - res / 100)); if (res >= 100) dmg = 0;
  mo.hp -= dmg; mo.hurt = 0.2; mo.aware = true; mo.hidden = false; alertGroup(mo);
  fxText(mo.x, mo.y, dmg > 0 ? dmg : 'immune', elem === 'fire' ? '#ff9040' : elem === 'cold' ? '#90d0ff' : elem === 'elec' ? '#ffe060' : elem === 'poison' ? '#80e060' : elem === 'mind' ? '#e090ff' : '#fff');
  if (mo.hp <= 0) killMonster(mo, srcMember);
  return dmg;
}
function alertGroup(mo) { for (const o of G.monsters) if (!o.dead && !o.aware && o.group && o.group === mo.group && dist(o.x, o.y, mo.x, mo.y) < 8) o.aware = true; }
function killMonster(mo, src) {
  mo.dead = true; mo.deadT = 0.8; G.kills++; mapState(M.id).dead[mo.id] = 1;
  giveXp(mo.d.xp);
  const perc = Math.max(...G.party.map(m => m.skills.Perception || 0));
  const gold = Math.floor(rint(mo.d.gold[0], mo.d.gold[1]) * (1 + perc * 0.1));
  const items = []; if (Math.random() < 0.18 + mo.d.tier * 0.05 || mo.boss) items.push(randomLoot(mo.d.tier)); if (mo.boss) items.push(randomLoot(mo.d.tier + 1));
  if (mo.drop) items.push(makeItem(mo.drop));
  if (gold > 0 || items.length) G.drops.push({ x: mo.x, y: mo.y, gold, items, t: 0 });
  for (const id in G.quests) { const q = QUESTS[id]; if (G.quests[id] === 'active' && q.kill && q.kill.includes(mo.kind)) { G.counters[id] = (G.counters[id] || 0) + 1; if (G.counters[id] === q.count) log('Quest ready to turn in: ' + q.name); } }
  log((src ? src.name + ' slays ' : 'Slain: ') + mo.name + '. +' + mo.d.xp + ' xp');
  if (mo.boss) notice(mo.name.toUpperCase() + ' IS SLAIN', null, 4);
  fxAt(mo.x, mo.y, 'burst', '#ffd090', { r: 1.2, life: 0.5, dur: 0.5 });
  if (G.target === mo) G.target = null;
}
function hitChanceParty(m, mo) { const a = attackBonus(m); return clamp((a * 5 + 60) / (a * 5 + 60 + mo.d.acv * 2.5), 0.2, 0.97); }
function hitChanceMonster(mo, m) { const a = mo.d.atk; return clamp((a * 5 + 50) / (a * 5 + 50 + armorClass(m) * 2), 0.12, 0.95); }

// ---- party actions ----
function findMeleeTarget(prefer) {
  if (prefer && !prefer.dead && dist(prefer.x, prefer.y, G.x, G.y) < 1.6 + prefer.r) return prefer;
  let best = null, bd = 1e9; for (const mo of G.monsters) { if (mo.dead || mo.hidden) continue; const d = dist(mo.x, mo.y, G.x, G.y); if (d < 1.45 + mo.r && d < bd) { bd = d; best = mo; } } return best;
}
function findRangedTarget(prefer, range) {
  if (prefer && !prefer.dead && dist(prefer.x, prefer.y, G.x, G.y) <= range && hasLOS(G.x, G.y, prefer.x, prefer.y)) return prefer;
  let best = null, bd = 1e9; for (const mo of G.monsters) { if (mo.dead || mo.hidden) continue; const d = dist(mo.x, mo.y, G.x, G.y); if (d <= range && d < bd && (mo.aware || d < 7) && hasLOS(G.x, G.y, mo.x, mo.y)) { bd = d; best = mo; } } return best;
}
function partyAttack(onlyMember) {
  let acted = false;
  for (const m of G.party) {
    if (onlyMember && m !== onlyMember) continue;
    if (!alive(m) || m.rec > 0) continue;
    const ranged = isRanged(m);
    const tgt = ranged ? findRangedTarget(G.target, 9) : findMeleeTarget(G.target);
    if (!tgt) continue;
    m.rec = recoveryTime(m); m.bounce = 1; acted = true; tbCost(1.2);
    if (ranged) {
      const n = (m.skills.Bow || 0) >= 8 ? 2 : 1;
      for (let i = 0; i < n; i++) fireProjectile(G.x, G.y, tgt, 'arrow', { member: m, dmg: damageRoll(m), elem: 'phys', ench: weaponElem(m), hitChance: hitChanceParty(m, tgt), spread: i * 0.3 });
      Snd.play('bow');
    } else {
      const roll_ = Math.random();
      if (roll_ < hitChanceParty(m, tgt)) {
        let dmg = damageRoll(m); const crit = Math.random() < 0.05 + statBonus(effStat(m, 'lk')) * 0.01; if (crit) dmg *= 2;
        hurtMonster(tgt, dmg, 'phys', m); const we = weaponElem(m); if (we && !tgt.dead) hurtMonster(tgt, we.dmg, we.elem, m, true);
        if (weaponOf(m) && weaponOf(m).skill === 'Mace' && (m.skills.Mace || 0) >= 4 && Math.random() < 0.2 && !tgt.boss) { tgt.stun = Math.max(tgt.stun, 2); fxText(tgt.x, tgt.y + 0.3, 'stunned', '#ffe060'); }
        Snd.play(crit ? 'crit' : 'hit');
      } else { fxText(tgt.x, tgt.y, 'miss', '#aaa'); Snd.play('miss'); }
      fxAt(tgt.x, tgt.y, 'spark', '#fff0c0', { life: 0.25, dur: 0.25 });
    }
  }
  return acted;
}
function fireProjectile(x, y, tgt, proj, o) {
  const a = Math.atan2(tgt.y - y, tgt.x - x) + (o.spread || 0) * (Math.random() - 0.5);
  const spd = proj === 'arrow' ? 11 : proj === 'rock' ? 8 : 7;
  G.projs.push(Object.assign({ kind: 'proj', x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, ang: a, proj, tgt, life: 2.5, src: o.member ? 'party' : 'monster' }, o));
}
// ---- spells ----
function spellPower(m, sp) { return m.skills[sp.school] || 0; }
function canCast(m, id) { const sp = SPELLS[id]; if (!sp) return 'unknown spell'; if (!alive(m)) return m.name + ' cannot act.'; if (!m.spells.includes(id)) return 'not known'; if (m.sp < sp.sp) return 'not enough spell points'; if (m.rec > 0) return 'recovering'; return null; }
function castSpell(m, id) {
  const err = canCast(m, id); if (err) { log(err === 'recovering' ? m.name + ' is still recovering.' : cap(err) + '.'); return false; }
  const sp = SPELLS[id], pw = spellPower(m, sp), stat = CLASSES[m.cls].spStat ? statBonus(effStat(m, CLASSES[m.cls].spStat)) : 0, wandPow = (m.equip.weapon && ITEMS[m.equip.weapon.id].spellPower) || 0;
  const dmgOf = () => Math.max(1, roll(sp.dmg[0], sp.dmg[1], sp.dmg[2]) + (sp.perSkill || 0) * pw + Math.floor(stat / 2) + wandPow);
  let ok = true;
  switch (sp.kind) {
    case 'bolt': { const t = findRangedTarget(G.target, sp.range); if (!t) { log('No target in range.'); return false; } fireProjectile(G.x, G.y, t, { fire: 'fire', cold: 'ice', elec: 'spark', poison: 'poison', spirit: 'spirit', mind: 'mind', phys: 'phys' }[sp.elem] || 'spark', { member: m, dmg: dmgOf(), elem: sp.elem, hitChance: 0.97, spell: sp, chain: sp.chain, stunT: sp.stunT ? sp.stunT + pw * 0.5 : 0, slow: sp.slow }); break; }
    case 'aoe': { const t = findRangedTarget(G.target, sp.range); if (!t) { log('No target in range.'); return false; } fireProjectile(G.x, G.y, t, sp.elem === 'fire' ? 'fire' : 'phys', { member: m, dmg: dmgOf(), elem: sp.elem, hitChance: 1, spell: sp, aoe: sp.radius }); break; }
    case 'around': { let n = 0; for (const mo of G.monsters) { if (mo.dead || dist(mo.x, mo.y, G.x, G.y) > sp.radius) continue; n++; if (sp.dmg) hurtMonster(mo, dmgOf(), sp.elem, m); if (sp.poison) mo.poison = 10; if (sp.slowT) mo.slow = sp.slowT + pw * 2; if (sp.fearT && !mo.boss) mo.fear = sp.fearT + pw; } fxAt(G.x, G.y, 'burst', SCHOOL_COLOR[sp.school], { r: sp.radius, life: 0.6, dur: 0.6 }); if (!n) log('Nothing within reach.'); break; }
    case 'multi': { const n = 2 + Math.floor(pw / 2); const ts = G.monsters.filter(mo => !mo.dead && !mo.hidden && dist(mo.x, mo.y, G.x, G.y) <= sp.range && hasLOS(G.x, G.y, mo.x, mo.y)).sort((a, b) => dist(a.x, a.y, G.x, G.y) - dist(b.x, b.y, G.x, G.y)); if (!ts.length) { log('No target in range.'); return false; } for (let i = 0; i < n; i++) { const t = ts[i % ts.length]; fireProjectile(G.x, G.y, t, 'spark', { member: m, dmg: dmgOf(), elem: 'elec', hitChance: 0.9, spread: 0.5 }); } break; }
    case 'party': {
      if (sp.buff) { addBuff(sp.buff, 1 + Math.floor(pw / 3), pw); log(sp.name + ' surrounds the party.'); }
      else if (id === 'torch_light') { addBuff('torch', 1 + pw * 0.5, pw); log('A warm light surrounds the party.'); }
      else if (id === 'wizard_eye') { addBuff('eye', 1 + pw * 0.5, pw); log('You sense every creature nearby.'); }
      else if (id === 'raise_dead') { if (pw < 4) { log('Expert Spirit magic is needed.'); return false; } const dead = G.party.filter(p => p.cond.dead); if (!dead.length) { log('No one here is dead.'); return false; } for (const p of dead) { p.cond = {}; p.hp = 1; } log('The dead draw breath again.'); }
      for (const p of memberScreenPositions()) fxAt(p.x, p.y, 'heal', SCHOOL_COLOR[sp.school]);
      break;
    }
    case 'heal': { const v = G.party.filter(p => !p.cond.dead && !p.cond.unconscious).sort((a, b) => (a.hp / maxHp(a)) - (b.hp / maxHp(b)))[0]; const unc = G.party.find(p => p.cond.unconscious); const t = unc || v; if (!t) return false; const h = sp.heal + sp.perSkill * pw + stat; t.hp = Math.min(maxHp(t), t.hp + h); t.cond.unconscious = false; t.heal = 0.8; log(t.name + ' is healed for ' + h + '.'); fxAt(G.x, G.y, 'heal', '#80ff90'); break; }
    case 'healall': { const h = sp.heal + sp.perSkill * pw + stat; for (const p of G.party) if (!p.cond.dead) { p.hp = Math.min(maxHp(p), p.hp + h); p.cond.unconscious = false; p.heal = 0.8; } log('The party is healed for ' + h + '.'); fxAt(G.x, G.y, 'heal', '#80ff90'); break; }
    case 'cure': { for (const p of G.party) { p.cond.poison = false; p.cond.disease = false; } log('Poison is purged from the party.'); break; }
    case 'utility': { if (id === 'town_portal') { if (M.id !== 'over') { enterMap('over', getMap('over').townSquare.x, getMap('over').townSquare.y + 1); } else { G.x = M.townSquare.x; G.y = M.townSquare.y + 1; G.trail = G.trail.map(() => [G.x, G.y]); G.camSet = false; } log('The world folds. You stand in Harrowmere square.'); } break; }
  }
  if (!ok) return false;
  m.sp -= sp.sp; m.rec = Math.max(0.8, recoveryTime(m) * 0.9); m.bounce = 1; tbCost(1.5); Snd.play('cast'); return true;
}
function useItem(it, m) {
  const b = ITEMS[it.id];
  if (b.type === 'potion') { const t = m && alive(m) ? m : G.party.find(alive); if (!t) return false; if (b.use === 'heal') { t.hp = Math.min(maxHp(t), t.hp + b.power); t.heal = 0.8; log(t.name + ' drinks: +' + b.power + ' HP.'); } if (b.use === 'mana') { t.sp = Math.min(maxSp(t), t.sp + b.power); log(t.name + ' drinks: +' + b.power + ' SP.'); } if (b.use === 'cure') { t.cond.poison = false; t.cond.disease = false; log(t.name + ' is cured.'); } removeInv(it.id, 1); Snd.play('drink'); return true; }
  if (b.use === 'torch') { addBuff('torch', 1, 0); removeInv(it.id, 1); log('You light a torch.'); return true; }
  if (b.type === 'food') { G.food += it.qty || 1; removeInv(it.id, it.qty || 1); log('Rations stored.'); return true; }
  return false;
}

// ---- monster update ----
function updateMonsters(dt) {
  const cd = combatDt(dt);
  for (const mo of G.monsters) {
    mo.anim += dt;
    if (mo.dead) { mo.deadT -= dt; continue; }
    if (mo.hurt > 0) mo.hurt -= dt;
    const d = dist(mo.x, mo.y, G.x, G.y);
    if (cd <= 0) continue;
    if (mo.stun > 0) { mo.stun -= cd; continue; }
    if (mo.slow > 0) mo.slow -= cd; if (mo.fear > 0) mo.fear -= cd; if (mo.poison > 0) { mo.poison -= cd; mo.poisonT = (mo.poisonT || 0) + cd; if (mo.poisonT > 1) { mo.poisonT = 0; hurtMonster(mo, 3, 'poison'); } }
    if (mo.d.special === 'regen' && mo.hp < mo.maxHp) mo.hp = Math.min(mo.maxHp, mo.hp + 2 * cd);
    mo.rec -= cd;
    // awareness
    const aggro = mo.mimic ? 1.4 : (M.outdoor ? 7 : 6);
    if (!mo.aware) {
      if (d < aggro && hasLOS(mo.x, mo.y, G.x, G.y)) { mo.aware = true; mo.hidden = false; alertGroup(mo); if (mo.mimic) log('The chest is a Mimic!'); }
      else { mo.wanderT -= cd; if (mo.wanderT <= 0) { mo.wanderT = 2 + Math.random() * 4; const a = Math.random() * TAU; mo.wander = Math.random() < 0.5 && !mo.mimic ? { x: Math.cos(a), y: Math.sin(a), t: 0.8 + Math.random() } : null; } if (mo.wander) { mo.wander.t -= cd; if (mo.wander.t <= 0) mo.wander = null; else if (dist(mo.x, mo.y, mo.hx, mo.hy) < 2.5) monsterMove(mo, mo.wander.x, mo.wander.y, cd, 0.35); } }
      continue;
    }
    if (d > 22 && !M.outdoor || d > 30) { mo.aware = false; continue; }
    const spdMul = (mo.slow > 0 ? 0.5 : 1) * (mo.fear > 0 ? 1.1 : 1);
    const ranged = mo.d.ranged, spell = mo.d.spell && MONSTER_SPELLS[mo.d.spell];
    const dx = (G.x - mo.x) / (d || 1), dy = (G.y - mo.y) / (d || 1);
    if (mo.fear > 0) { monsterMove(mo, -dx, -dy, cd, spdMul); continue; }
    // specials
    if (mo.d.special === 'blink') { mo.blinkT -= cd; if (mo.blinkT <= 0 && d > 3) { blink(mo); mo.blinkT = 6 + Math.random() * 4; } }
    if (mo.d.special && mo.d.special.startsWith('summon:')) { mo.summonT -= cd; if (mo.summonT <= 0 && d < 9) { summon(mo, mo.d.special.split(':')[1]); mo.summonT = 14; } }
    const meleeRange = PR + mo.r + 0.35;
    const los = hasLOS(mo.x, mo.y, G.x, G.y);
    if (spell && los && d <= spell.range && d > 1.2) {
      if (mo.rec <= 0) { monsterCast(mo, spell); mo.rec = 2.2 + Math.random(); }
      if (d < 3) monsterMove(mo, -dx, -dy, cd, spdMul * 0.6); else if (d > spell.range - 1) monsterMove(mo, dx, dy, cd, spdMul);
    } else if (ranged && los && d <= ranged.range && d > 1.3) {
      if (mo.rec <= 0) { fireProjectile(mo.x, mo.y, { x: G.x, y: G.y }, ranged.type, { dmg: roll(mo.d.dmg[0], mo.d.dmg[1], mo.d.dmg[2]), elem: 'phys', mon: mo }); mo.rec = 1.6 + Math.random() * 0.6; Snd.play('bow'); }
      if (d < 2.5) monsterMove(mo, -dx, -dy, cd, spdMul * 0.6);
    } else if (d > meleeRange) {
      monsterMove(mo, dx, dy, cd, spdMul);
    } else if (mo.rec <= 0) {
      monsterMelee(mo); mo.rec = clamp(1.4 - mo.d.spd * 0.1, 0.8, 1.6) + Math.random() * 0.3;
    }
    mo.flip = G.x < mo.x;
    for (const o of G.monsters) if (o !== mo && !o.dead) pushApart(mo, o, mo.r + o.r, 0.5);
    unstick(mo, mo.r);
  }
  // remove faded corpses, collect drops
  G.monsters = G.monsters.filter(mo => !mo.dead || mo.deadT > 0);
  for (let i = G.drops.length - 1; i >= 0; i--) { const dr = G.drops[i]; dr.t += dt; if (dist(dr.x, dr.y, G.x, G.y) < 0.9) { if (dr.gold) { G.gold += dr.gold; } for (const it of dr.items) addInv(it); log('Picked up ' + [dr.gold ? dr.gold + ' gold' : null].concat(dr.items.map(itemName)).filter(Boolean).join(', ') + '.'); G.drops.splice(i, 1); Snd.play('coin'); checkQuests(); } }
}
function monsterMove(mo, dx, dy, dt, mul = 1) {
  const spd = mo.d.spd * mul; const ox = mo.x, oy = mo.y;
  mo.blocked = false; moveCircle(mo, dx * spd * dt, dy * spd * dt, mo.r);
  // slide around obstacles
  if (dist(mo.x, mo.y, ox, oy) < spd * dt * 0.3) { mo.stuck = (mo.stuck || 0) + dt; if (mo.stuck > 0.3) { mo.side = mo.side || (Math.random() < 0.5 ? 1 : -1); moveCircle(mo, -dy * mo.side * spd * dt, dx * mo.side * spd * dt, mo.r); if (mo.stuck > 1.5) { mo.stuck = 0; mo.side = -mo.side; } } } else mo.stuck = 0;
  if (mo.d.fly && mGet(M, Math.floor(mo.x), Math.floor(mo.y)) === TR.WATER) { /* flying creatures ignore water: allowed by moveCircle? no; fine */ }
}
function monsterMelee(mo) {
  const t = pickTargetMember(); if (!t) return;
  mo.lunge = 0.25;
  if (Math.random() < hitChanceMonster(mo, t)) {
    let dmg = roll(mo.d.dmg[0], mo.d.dmg[1], mo.d.dmg[2]);
    damageMember(t, dmg, 'phys', mo); Snd.play('hurt');
    if (mo.d.special === 'poison' && Math.random() < 0.35 && !t.cond.poison) { t.cond.poison = true; log(t.name + ' is poisoned!'); }
    if (mo.d.special === 'chill') { G.chill = 4; }
    fxText(G.x, G.y - 0.2, '-' + dmg + ' ' + t.name, '#ff6a50');
  } else { fxText(G.x, G.y - 0.2, 'miss', '#aaa'); }
}
function monsterCast(mo, spell) {
  if (spell.heal) { const ally = G.monsters.filter(o => !o.dead && o !== mo && o.hp < o.maxHp && dist(o.x, o.y, mo.x, mo.y) < spell.range).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; const t = ally || (mo.hp < mo.maxHp ? mo : null); if (t) { t.hp = Math.min(t.maxHp, t.hp + spell.heal); fxAt(t.x, t.y, 'heal', '#80ff90'); } return; }
  if (spell.fear) { if (!buffOn('mindshield')) { G.fearT = spell.fear; log(mo.name + ' sings a song of dread! The party cannot attack.'); } return; }
  fireProjectile(mo.x, mo.y, { x: G.x, y: G.y }, spell.proj, { dmg: roll(spell.dmg[0], spell.dmg[1], spell.dmg[2]), elem: spell.elem, mon: mo, aoe: spell.aoe, slow: spell.slow, poison: spell.poison });
  Snd.play('cast');
}
function blink(mo) { for (let i = 0; i < 10; i++) { const a = Math.random() * TAU, r = 1.5 + Math.random() * 1.5, x = G.x + Math.cos(a) * r, y = G.y + Math.sin(a) * r; if (!blockedAt(x, y)) { fxAt(mo.x, mo.y, 'spark', '#c080ff'); mo.x = x; mo.y = y; fxAt(x, y, 'spark', '#c080ff'); return; } } }
function summon(mo, kind) { const n = G.monsters.filter(o => o.summoned && !o.dead).length; if (n >= 3) return; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, x = mo.x + Math.cos(a) * 1.5, y = mo.y + Math.sin(a) * 1.5; if (blockedAt(x, y)) continue; const s = spawnMonster({ kind, x, y }, -1); s.aware = true; s.summoned = true; s.id = -1; G.monsters.push(s); fxAt(x, y, 'spark', '#80ff80'); } log(mo.name + ' calls for aid!'); }
// ---- projectiles ----
function updateProjectiles(dt) {
  const cd = combatDt(dt); if (cd <= 0) return;
  const keep = [];
  for (const p of G.projs) {
    p.life -= cd;
    if (p.src === 'party' && p.tgt && !p.tgt.dead) { const a = Math.atan2(p.tgt.y - p.y, p.tgt.x - p.x), cur = Math.atan2(p.vy, p.vx); let da = a - cur; da = Math.atan2(Math.sin(da), Math.cos(da)); const na = cur + clamp(da, -4 * cd, 4 * cd); const s = Math.hypot(p.vx, p.vy); p.vx = Math.cos(na) * s; p.vy = Math.sin(na) * s; p.ang = na; }
    const nx = p.x + p.vx * cd, ny = p.y + p.vy * cd;
    const tt = mGet(M, Math.floor(nx), Math.floor(ny));
    if (tt === TR.WALL || tt === TR.VOID || tt === TR.ROOF || tt === TR.TREE || p.life <= 0) { if (p.aoe) explode(p); continue; }
    p.x = nx; p.y = ny;
    let hit = false;
    if (p.src === 'party') {
      for (const mo of G.monsters) { if (mo.dead || mo.hidden) continue; if (dist(p.x, p.y, mo.x, mo.y) < mo.r + 0.3) { hit = true; if (p.aoe) { explode(p, mo); break; } if (Math.random() < (p.hitChance || 0.9)) { hurtMonster(mo, p.dmg, p.elem, p.member); if (p.ench && !mo.dead) hurtMonster(mo, p.ench.dmg, p.ench.elem, p.member, true); if (p.stunT && !mo.boss) mo.stun = Math.max(mo.stun, p.stunT); if (p.slow) mo.slow = Math.max(mo.slow, 5); if (p.chain) { const o = G.monsters.find(o => o !== mo && !o.dead && dist(o.x, o.y, mo.x, mo.y) < 4); if (o) { hurtMonster(o, Math.floor(p.dmg / 2), p.elem, p.member); fxAt(o.x, o.y, 'spark', '#ffe060'); } } } else fxText(mo.x, mo.y, 'miss', '#aaa'); fxAt(p.x, p.y, 'spark', '#fff0c0', { life: 0.25, dur: 0.25 }); break; } }
    } else {
      if (dist(p.x, p.y, G.x, G.y) < PR + 0.3) { hit = true; const t = pickTargetMember(); if (t) { if (p.aoe) { for (const m of G.party) if (alive(m)) damageMember(m, p.dmg * 0.7, p.elem); log(p.mon.name + '\'s ' + p.proj + ' blast hits the party!'); } else if (Math.random() < hitChanceMonster(p.mon, t) + 0.1) { damageMember(t, p.dmg, p.elem); fxText(G.x, G.y - 0.2, '-' + p.dmg + ' ' + t.name, '#ff6a50'); if (p.poison && Math.random() < 0.4) { t.cond.poison = true; log(t.name + ' is poisoned!'); } if (p.slow) G.chill = 3; } else fxText(G.x, G.y - 0.2, 'miss', '#aaa'); } Snd.play('hurt'); fxAt(p.x, p.y, 'spark', '#ffb080', { life: 0.25, dur: 0.25 }); }
    }
    if (!hit) keep.push(p);
  }
  G.projs = keep;
}
function explode(p, except) { fxAt(p.x, p.y, 'burst', '#ff9040', { r: p.aoe, life: 0.5, dur: 0.5 }); fxAt(p.x, p.y, 'glow', '#ff8030', { r: p.aoe, life: 0.4, dur: 0.4 }); for (const mo of G.monsters) { if (mo.dead) continue; const d = dist(mo.x, mo.y, p.x, p.y); if (d <= p.aoe + mo.r) hurtMonster(mo, mo === except ? p.dmg : Math.floor(p.dmg * 0.75), p.elem, p.member); } Snd.play('explode'); }
function updateFx(dt) { for (const f of G.fx) f.life -= dt; G.fx = G.fx.filter(f => f.life > 0); }
function updatePartyTimers(dt) {
  const cd = combatDt(dt);
  for (const m of G.party) { if (m.rec > 0) m.rec -= cd; if (m.hurt > 0) m.hurt -= dt; if (m.bounce > 0) m.bounce -= dt * 4; if (m.heal > 0) m.heal -= dt; if (m.dmgPop) { m.dmgPop.t -= dt; if (m.dmgPop.t <= 0) m.dmgPop = null; } }
  if (G.fearT > 0) G.fearT -= dt;
  for (const mo of G.monsters) if (mo.lunge > 0) mo.lunge -= dt;
}
