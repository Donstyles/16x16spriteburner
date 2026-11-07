// ===== Enemies, projectiles, combat, effects =====
function spawnEnemies() {
  S.enemies = [];
  S.interact = S.interact.filter(i => !i.mimic);
  for (const sp of WORLD.spawns) {
    const def = ENEMY_DEFS[sp.kind]; if (!def) continue;
    const id = sp.kind + sp.x + ',' + sp.y;
    if (def.boss && S.flags.boss[id]) continue;
    if ((def.unique || sp.unique) && S.flags.unique[id]) continue;
    S.enemies.push(makeEnemy(sp, def, id));
  }
}
function makeEnemy(sp, def, id, summoned) {
  const spr = def.mimic ? getSprite('chest') : getSprite(sp.kind);
  const e = { kind: sp.kind, def, id, name: def.name, x: sp.x, y: sp.y, hx: sp.x, hy: sp.y, hp: def.hp, hpMax: def.hp, r: 0.2 + def.size * 0.13, spd: def.spd, state: (def.mimic || sp.sleep) ? 'sleep' : 'idle', t: 0, anim: Math.random() * 5, spr, boss: !!def.boss, gates: sp.gates || [], arena: sp.arena, final: !!sp.final, dead: false, flash: 0, zoff: def.zoff || 0, summonT: 8, blinkT: 2 + Math.random() * 3, stuck: 0, side: null, cd: def.cd || 1.6, enraged: false, alpha: 1, dying: 0, summoned: !!summoned, aggroT: 0, unique: !!(def.unique || sp.unique), shake: 0 };
  e.sd = { spr, x: e.x, y: e.y, z: e.zoff, w: def.size * 0.9, h: def.size, frame: 0, emissive: !!def.emissive, alpha: 1, tint: null, shake: 0, ent: e };
  if (def.mimic) { S.interact.push({ type: 'chest', x: e.x, y: e.y, loot: {}, mimic: e }); e.sd.w = 0.65; e.sd.h = 0.65; }
  return e;
}
function wakeEnemy(e) {
  if (e.state === 'sleep') { if (e.def.mimic) { e.spr = getSprite(e.kind); e.sd.spr = e.spr; e.sd.w = e.def.size * 0.9; e.sd.h = e.def.size; S.interact = S.interact.filter(i => i.mimic !== e); message('A Mimic!'); Snd.sfx('roar'); } }
  if (e.state === 'sleep' || e.state === 'idle' || e.state === 'return') { e.state = 'chase'; if (e.boss) wakeBoss(e); else if (!e.noticed) { e.noticed = true; Snd.sfx('notice'); } }
}
function wakeBoss(e) {
  if (S.boss === e) return;
  S.boss = e; e.state = 'chase'; Snd.music('boss'); Snd.sfx('roar');
  for (const g of e.gates) { const d = MAP.doors.find(d => d.x === g[0] && d.y === g[1]); if (d) d.target = 0; }
}
function bossDefeated(e) {
  S.flags.boss[e.id] = 1; S.boss = null; S.bossKills++;
  for (const g of e.gates) { const d = MAP.doors.find(d => d.x === g[0] && d.y === g[1]); if (d) { d.removed = true; d.open = 1; MAP.type[d.y * MW + d.x] = 0; S.flags.boss[d.id] = 1; } }
  showCenter(e.final ? 'THE MANDATE IS RELIT' : 'GREAT FOE VANQUISHED', null, 4, 'victory'); Snd.sfx('victory'); Snd.music('ambient');
  if (e.final) { S.ending = 6; giveItem('crown'); }
  saveGame();
}
function damageEnemy(e, dmg, src, crit, fromSpell) {
  if (e.dead) return;
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.14; e.shake = 0.35; e.lastHit = S.t;
  floatText(e.x, e.y, e.zoff + e.def.size * 0.9, crit ? dmg + '!' : '' + dmg, crit ? '#ffe066' : fromSpell ? '#ff9a3c' : '#ffffff', crit ? 3 : 2);
  wakeEnemy(e);
  if (e.state === 'windup' && e.def.poise < dmg && !e.boss) { e.state = 'stagger'; e.t = 0.45; }
  if (e.hp <= 0) killEnemy(e, src);
}
function killEnemy(e, src) {
  e.dead = true; e.dying = 0.9; e.state = 'dead'; S.kills++;
  const souls = Math.round(e.def.souls * (1 + S.bossKills * 0.05));
  gainSouls(souls, e.x, e.y);
  Snd.sfx(e.boss ? 'bossdie' : 'kill');
  if (e.unique) S.flags.unique[e.id] = 1;
  if (e.boss) bossDefeated(e);
  if (S.target === e) S.target = null;
}
function floatText(x, y, z, text, color, scale = 2) { S.fx.push({ kind: 'text', x, y, z, text, color, scale, t: 1.1, dur: 1.1 }); }
function burst(x, y, n, color, up) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 0.6 + Math.random() * 1.6; S.fx.push({ kind: 'p', x, y, z: 0.4 + Math.random() * 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: (up ? 1.5 : 0.5) + Math.random() * 1.5, t: 0.6 + Math.random() * 0.5, color, size: 2 + Math.random() * 2 }); } }
function soulBurst(x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 0.3 + Math.random() * 0.8; S.fx.push({ kind: 'soul', x, y, z: 0.3 + Math.random() * 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 1 + Math.random(), t: 0.9 + Math.random() * 0.6, color: '#b8ffd0', size: 3 }); } }
function hitSpark(e) { burst(e.x, e.y, 5, '#ffe9a0'); }

// ---- enemy update ----
function updateEnemies(dt) {
  const px = S.px, py = S.py;
  for (const e of S.enemies) {
    e.anim += dt;
    if (e.flash > 0) e.flash -= dt; if (e.shake > 0) e.shake -= dt;
    if (e.dead) { e.dying -= dt; e.sd.alpha = Math.max(0, e.dying / 0.9); e.sd.z = e.zoff - (1 - e.sd.alpha) * 0.3; e.sd.tint = [255, 255, 255, Math.max(0, 1 - e.dying)]; continue; }
    const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy);
    const ndx = d > 0.001 ? dx / d : 1, ndy = d > 0.001 ? dy / d : 0;
    const def = e.def, melee = def.behav === 'melee';
    const atkRange = melee ? 0.55 + e.r + 0.26 : (def.range || 7);
    e.t -= dt;
    switch (e.state) {
      case 'sleep': if (!def.mimic && d < 2.0 && hasLOS(e.x, e.y, px, py)) wakeEnemy(e); break;
      case 'idle': case 'return': {
        if (e.state === 'return') { const hdx = e.hx - e.x, hdy = e.hy - e.y, hd = Math.hypot(hdx, hdy); if (hd > 0.3) enemyMove(e, hdx / hd, hdy / hd, dt, 0.8); else { e.state = 'idle'; e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.5); } }
        if (e.state === 'idle' && !e.boss && !def.mimic) {
          e.wanderT = (e.wanderT || 0) - dt;
          if (e.wanderT <= 0) { e.wanderT = 2 + Math.random() * 4; const a = Math.random() * TAU; e.wander = Math.random() < 0.5 ? null : { x: Math.cos(a), y: Math.sin(a), t: 0.6 + Math.random() * 0.8 }; }
          if (e.wander) { e.wander.t -= dt; if (e.wander.t <= 0) e.wander = null; else if (dist2(e.x, e.y, e.hx, e.hy) < 2.2) enemyMove(e, e.wander.x, e.wander.y, dt, 0.35); else { const hdx = e.hx - e.x, hdy = e.hy - e.y, hd = Math.hypot(hdx, hdy) || 1; enemyMove(e, hdx / hd, hdy / hd, dt, 0.35); } }
        }
        const aggro = e.boss ? 7.5 : 6.5;
        if (d < aggro && hasLOS(e.x, e.y, px, py)) { e.aggroT += dt; if (e.aggroT > (e.boss ? 0 : 0.25)) wakeEnemy(e); } else e.aggroT = 0;
        break;
      }
      case 'chase': case 'cooldown': {
        const los = hasLOS(e.x, e.y, px, py);
        if (los) { e.lastSeenX = px; e.lastSeenY = py; e.lostT = 0; } else { e.lostT = (e.lostT || 0) + dt; }
        if (!e.boss && (d > 18 || e.lostT > 7)) { e.state = 'return'; e.noticed = false; break; }
        let tx = e.lastSeenX !== undefined ? e.lastSeenX : px, ty = e.lastSeenY !== undefined ? e.lastSeenY : py;
        const tdx = tx - e.x, tdy = ty - e.y, td = Math.hypot(tdx, tdy) || 1;
        let mvx = tdx / td, mvy = tdy / td, spdMul = e.state === 'cooldown' ? 0.45 : 1;
        if (!melee && d < 2.6 && los) { mvx = -ndx; mvy = -ndy; spdMul = 0.6; } // ranged keep distance
        else if (melee && d < atkRange - 0.15) { mvx = 0; mvy = 0; }
        else if (!melee && d < atkRange * 0.8 && los) { mvx = 0; mvy = 0; }
        if (mvx || mvy) enemyMove(e, mvx, mvy, dt, spdMul);
        // separation
        for (const o of S.enemies) { if (o === e || o.dead) continue; pushApart(e, o, e.r + o.r, 0.5); }
        for (const o of S.objects) { if (!o.solid) continue; pushApart(e, o, e.r + o.solid, 1); }
        if (e.state === 'cooldown') { if (e.t <= 0) e.state = 'chase'; break; }
        // decide attack
        if (melee ? (d < atkRange) : (d < atkRange && los)) {
          e.state = 'windup'; e.t = def.boss ? 0.75 : (melee ? 0.55 : 0.7); e.windupDur = e.t; e.special = null;
          if (def.special === 'charge' && d > 2.5 && Math.random() < 0.6) { e.special = 'charge'; e.t = 0.8; e.windupDur = 0.8; }
          else if (def.special === 'slam' && d < 3.2 && Math.random() < 0.45) { e.special = 'slam'; e.t = 1.0; e.windupDur = 1.0; }
          Snd.sfx(e.boss ? 'bosswind' : 'windup', e.x, e.y);
        } else if (!melee && def.special === 'charge' && d < 6 && Math.random() < dt * 0.25) { e.state = 'windup'; e.special = 'charge'; e.t = 0.8; e.windupDur = 0.8; Snd.sfx('bosswind'); }
        // blink
        if (def.blink) { e.blinkT -= dt; if (e.blinkT <= 0 && d > 2.5) { blinkEnemy(e); e.blinkT = 3 + Math.random() * 3; } }
        // summon
        if (def.summon && (!e.boss || e.hp < e.hpMax * 0.75)) { e.summonT -= dt; if (e.summonT <= 0) { summonAdds(e); e.summonT = e.boss ? 14 : 11; } }
        break;
      }
      case 'windup': {
        e.sd.tint = [255, 70, 50, 0.18 + 0.32 * (1 - e.t / e.windupDur)];
        if (e.special !== 'charge' && melee) { const face = Math.atan2(dy, dx); e.sd.shake = 0; }
        if (e.t <= 0) {
          e.sd.tint = null;
          if (e.special === 'charge') { e.state = 'charge'; e.t = 0.75; e.cvx = ndx * (def.spd * 4.5); e.cvy = ndy * (def.spd * 4.5); e.chargeHit = false; Snd.sfx('charge'); }
          else if (e.special === 'slam') { e.state = 'cooldown'; e.t = e.cd; slamAttack(e); }
          else if (melee) { e.state = 'cooldown'; e.t = e.cd; if (d < atkRange + 0.35) hitParty(rollEnemyDmg(e), e); else Snd.sfx('whoosh'); }
          else { e.state = 'cooldown'; e.t = e.cd; fireEnemyProjectile(e, def.volley || 1); }
        }
        break;
      }
      case 'charge': {
        const prev = { x: e.x, y: e.y };
        moveCircle(e, e.cvx * dt, e.cvy * dt, e.r, true);
        if (!e.chargeHit && d < e.r + 0.5) { e.chargeHit = true; hitParty(rollEnemyDmg(e) * 1.5, e, { shake: 0.5 }); }
        if (e.blocked || e.t <= 0) { e.blocked = false; e.state = 'cooldown'; e.t = e.cd * 1.2; if (e.blocked) S.shake = Math.max(S.shake, 0.3); }
        e.blocked = false;
        break;
      }
      case 'stagger': if (e.t <= 0) e.state = 'chase'; break;
    }
    if (e.state !== 'windup' && !e.dead) e.sd.tint = e.flash > 0 ? [255, 255, 255, 0.85] : (e.enraged ? [255, 60, 40, 0.3] : null);
    else if (e.flash > 0) e.sd.tint = [255, 255, 255, 0.85];
    if (e.boss && def.enrage && !e.enraged && e.hp < e.hpMax * def.enrage) { e.enraged = true; e.spd *= 1.3; e.cd *= 0.75; message(e.name + ' is enraged!'); Snd.sfx('roar'); }
    if (e.state !== 'sleep') unstick(e, e.r, true);
    // sprite descriptor
    e.sd.x = e.x; e.sd.y = e.y; e.sd.shake = e.shake > 0 ? Math.sin(S.t * 60) * 0.04 : 0;
    const hover = e.zoff ? Math.sin(e.anim * 2.5) * 0.08 : 0;
    e.sd.z = e.zoff + hover + (e.state === 'windup' ? (1 - e.t / e.windupDur) * 0.12 : 0);
    e.sd.frame = (e.anim * e.spr.fps) | 0;
    if (e.state === 'windup') { const k = 1 + (1 - e.t / e.windupDur) * 0.12; e.sd.h = def.size * k; e.sd.w = def.size * 0.9 * k; } else { e.sd.h = def.size * (e.state === 'stagger' ? 0.92 : 1); e.sd.w = def.size * 0.9; }
    if (def.mimic && e.state === 'sleep') { e.sd.w = 0.65; e.sd.h = 0.65; }
  }
  // remove faded corpses
  S.enemies = S.enemies.filter(e => !e.dead || e.dying > 0);
}
function enemyMove(e, mvx, mvy, dt, mul = 1) {
  let vx = mvx, vy = mvy;
  if (e.side) { e.side.t -= dt; if (e.side.t <= 0) e.side = null; else { vx = e.side.x; vy = e.side.y; } }
  const spd = e.spd * mul * (e.state === 'cooldown' ? 1 : 1);
  const ox = e.x, oy = e.y;
  e.blocked = false; moveCircle(e, vx * spd * dt, vy * spd * dt, e.r, true);
  const moved = Math.hypot(e.x - ox, e.y - oy);
  if (moved < spd * dt * 0.3) { e.stuck += dt; if (e.stuck > 0.25) { const s = Math.random() < 0.5 ? 1 : -1; e.side = { x: -mvy * s, y: mvx * s, t: 0.5 + Math.random() * 0.5 }; e.stuck = 0; } } else e.stuck = 0;
}
function blinkEnemy(e) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * TAU, r = 1.5 + Math.random() * 1.5, x = S.px + Math.cos(a) * r, y = S.py + Math.sin(a) * r;
    if (!cellBlocked(x, y, true) && hasLOS(S.px, S.py, x, y)) { burst(e.x, e.y, 6, '#c9a0ff'); e.x = x; e.y = y; burst(x, y, 6, '#c9a0ff'); Snd.sfx('blink'); return; }
  }
}
function summonAdds(e) {
  const alive = S.enemies.filter(o => o.summoned && !o.dead).length; if (alive >= 3) return;
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * TAU, x = e.x + Math.cos(a) * 1.4, y = e.y + Math.sin(a) * 1.4;
    if (cellBlocked(x, y, true)) continue;
    const def = ENEMY_DEFS[e.def.summon]; const add = makeEnemy({ kind: e.def.summon, x, y }, def, 'summon' + Math.random(), true); add.state = 'chase'; add.noticed = true; S.enemies.push(add); burst(x, y, 8, '#80ff80');
  }
  message(e.name + ' calls for aid.'); Snd.sfx('summon');
}
function slamAttack(e) {
  S.shake = Math.max(S.shake, 0.6); Snd.sfx('slam'); burst(e.x, e.y, 16, '#aaa');
  const d = Math.hypot(S.px - e.x, S.py - e.y);
  if (d < 3.4) hitParty(rollEnemyDmg(e) * 1.35, e, { all: d < 1.8 });
}
function rollEnemyDmg(e) { const [a, b] = e.def.dmg; return (a + Math.random() * (b - a)) * (e.enraged ? 1.25 : 1); }
function fireEnemyProjectile(e, n) {
  const base = Math.atan2(S.py - e.y, S.px - e.x);
  for (let i = 0; i < n; i++) {
    const spread = n > 1 ? (i - (n - 1) / 2) * 0.16 : 0, a = base + spread;
    const spd = e.def.proj === 'arrow' ? 9 : 6.5;
    S.projectiles.push({ x: e.x + Math.cos(a) * 0.3, y: e.y + Math.sin(a) * 0.3, z: 0.7 + e.zoff, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, spr: getSprite(e.def.proj), dmg: rollEnemyDmg(e), owner: 'enemy', life: 3, r: 0.4, chill: !!e.def.chill, venom: !!e.def.venom, w: e.def.proj === 'arrow' ? 0.35 : 0.3, h: e.def.proj === 'arrow' ? 0.15 : 0.3, ang: a, anim: 0, emissive: e.def.proj !== 'arrow' });
  }
  Snd.sfx(e.def.proj === 'arrow' ? 'bow' : 'cast', e.x, e.y);
}

// ---- party takes damage ----
function hitParty(dmg, src, opts = {}) {
  if (S.mode !== 'play') return;
  if (S.iframes > 0) { floatText(S.px + Math.cos(S.pa) * 0.8, S.py + Math.sin(S.pa) * 0.8, 0.9, 'DODGED', '#9ad0f0', 2); return; }
  const alive = S.party.filter(m => !m.dead); if (!alive.length) return;
  let mult = 1;
  if (S.bulwark > 0) mult *= 0.3;
  const targets = opts.all ? alive : [alive[(Math.random() * alive.length) | 0]];
  for (const m of targets) {
    let d = dmg * mult * (opts.all ? 0.7 : 1);
    if (m.def.armor) d *= 1 - m.def.armor;
    if (m.id === 'knight' && Math.random() < 0.18 && S.stam > 15) { S.stam -= 12; m.block = 0.5; floatText(S.px + Math.cos(S.pa) * 0.8, S.py + Math.sin(S.pa) * 0.8, 1.0, 'BLOCKED', '#d8b36a', 2); Snd.sfx('block'); continue; }
    d = Math.max(1, Math.round(d));
    m.hp -= d; m.hurt = 0.5; m.dmgPop = { n: d, t: 1 };
    if (m.hp <= 0) { m.hp = 0; m.dead = true; message(m.name + ' has fallen.'); Snd.sfx('fallen'); }
  }
  S.hurtT = 0.5; S.shake = Math.max(S.shake, opts.shake || 0.18); Snd.sfx('hurt'); try { if (navigator.vibrate) navigator.vibrate(opts.shake ? 60 : 25); } catch (e) { }
  if (src && src.def) { if (src.def.chill) { S.chill = 3; message('The cold slows the party.'); } if (src.def.venom) { S.venom = 5; } }
  if (!S.party.some(m => !m.dead)) dieParty();
}

// ---- party attacks & abilities ----
function recoveryTime(m) { return m.def.rec * Math.max(0.45, 1 - (m.sp - m.def.sp) * 0.03); }
function rollDamage(m) { const d = m.def; let base = d.base + (d.atk === 'melee' ? m.mt * 0.8 : (m.id === 'archer' ? m.mt * 0.65 : m.it * 0.5)) + S.weaponLvl * 2.5; return base * (0.85 + Math.random() * 0.3); }
function partyAttack() {
  const tgt = S.target; let any = false, blockedByStam = false, meleeHit = false;
  for (const m of S.party) {
    if (m.dead || m.rec > 0) continue;
    const d = m.def;
    if (d.atk === 'melee') {
      if (!tgt) continue;
      const dist = Math.hypot(tgt.x - S.px, tgt.y - S.py);
      if (dist > 1.6 + tgt.r) continue;
      if (S.stam < 10) { blockedByStam = true; continue; }
      S.stam -= 10; S.stamT = 0.7; m.rec = recoveryTime(m); m.bounce = 1; any = true;
      const crit = Math.random() < 0.08 + m.sp * 0.004; const dmg = rollDamage(m) * (crit ? 2 : 1);
      damageEnemy(tgt, dmg, m, crit); hitSpark(tgt); Snd.sfx(m.id === 'knight' ? 'sword' : 'mace'); meleeHit = true;
    } else {
      if (S.stam < 8) { blockedByStam = true; continue; }
      S.stam -= 8; S.stamT = 0.7; m.rec = recoveryTime(m); m.bounce = 1; any = true;
      firePartyProjectile(m, d.proj, rollDamage(m), tgt, 0);
      Snd.sfx(m.id === 'archer' ? 'bow' : 'spark');
    }
  }
  if (!any && blockedByStam) { message('Exhausted!'); }
  if (any) { if (meleeHit) S.swing = 0.25; else S.rangedFlash = 0.15; }
}
function firePartyProjectile(m, sprName, dmg, tgt, spread, extra = {}) {
  let a = S.pa;
  if (tgt) { const tdx = tgt.x - S.px, tdy = tgt.y - S.py; a = Math.atan2(tdy, tdx); }
  a += spread;
  const spd = sprName === 'arrow' ? 13 : sprName === 'firebolt' ? 9 : 10;
  S.projectiles.push(Object.assign({ x: S.px + Math.cos(a) * 0.35, y: S.py + Math.sin(a) * 0.35, z: 0.85, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, spr: getSprite(sprName), dmg, owner: 'party', life: 2.5, r: 0.35, member: m, w: sprName === 'arrow' ? 0.35 : sprName === 'firebolt' ? 0.38 : 0.2, h: sprName === 'arrow' ? 0.15 : sprName === 'firebolt' ? 0.38 : 0.2, ang: a, anim: 0, emissive: sprName !== 'arrow', tgt }, extra));
}
function useAbility(idx) {
  const m = S.party[idx]; if (!m || m.dead) return;
  const ab = ABILITIES[m.def.ability];
  if (m.cd > 0) { Snd.sfx('locked'); return; }
  if (ab.sp && m.spts < ab.sp) { message(m.name + ' lacks spell points.'); Snd.sfx('locked'); return; }
  if (ab.stam && S.stam < ab.stam) { message('Exhausted!'); Snd.sfx('locked'); return; }
  if (ab.sp) m.spts -= ab.sp; if (ab.stam) S.stam -= ab.stam;
  m.cd = ab.cd; m.bounce = 1;
  switch (m.def.ability) {
    case 'bulwark': S.bulwark = 4; message('Roderick raises the bulwark.'); Snd.sfx('block'); break;
    case 'volley': S.volley = { n: 5, t: 0, m }; Snd.sfx('bow'); break;
    case 'heal': { const h = Math.round(22 + m.it * 2.5 + m.level * 2); for (const p of S.party) if (!p.dead) { p.hp = Math.min(p.hpMax, p.hp + h); p.heal = 0.8; } S.healFx = 0.9; burst(S.px, S.py, 12, '#90ff90', true); Snd.sfx('heal'); break; }
    case 'firebolt': firePartyProjectile(m, 'firebolt', 22 + m.it * 2.6 + m.level * 2 + S.weaponLvl * 3, S.target, 0, { splash: 1.3, spell: true }); Snd.sfx('fire'); break;
  }
}
// ---- projectiles ----
function updateProjectiles(dt) {
  const keep = [];
  for (const p of S.projectiles) {
    p.life -= dt; p.anim += dt;
    if (p.tgt && !p.tgt.dead && p.owner === 'party') { // light homing
      const a = Math.atan2(p.tgt.y - p.y, p.tgt.x - p.x), cur = Math.atan2(p.vy, p.vx), da = normAng(a - cur), spd = Math.hypot(p.vx, p.vy);
      const na = cur + clamp(da, -2.5 * dt, 2.5 * dt); p.vx = Math.cos(na) * spd; p.vy = Math.sin(na) * spd;
    }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    const t = cellAt(nx, ny);
    let blocked = t === 1 || t === 3 && false;
    if (t === 2) { const d = MAP.doors[MAP.doorIdx[(ny | 0) * MW + (nx | 0)]]; if (d.open < 0.6 && !d.removed) blocked = true; }
    if (blocked || p.life <= 0) { burst(p.x, p.y, 4, p.spr.name === 'arrow' ? '#c0b090' : '#ffb060'); if (p.splash) splash(p); continue; }
    p.x = nx; p.y = ny;
    let hit = false;
    if (p.owner === 'enemy') {
      if (dist2(p.x, p.y, S.px, S.py) < 0.45 * 0.45) { hitParty(p.dmg, { def: { chill: p.chill, venom: p.venom } }); hit = true; }
    } else {
      for (const e of S.enemies) { if (e.dead || (e.state === 'sleep' && e.def.mimic)) continue; const rr = e.r + 0.25; if (dist2(p.x, p.y, e.x, e.y) < rr * rr) { damageEnemy(e, p.dmg, p.member, false, p.spell); hitSpark(e); if (p.splash) splash(p, e); hit = true; break; } }
    }
    if (hit) { if (p.spr.name !== 'arrow') burst(p.x, p.y, 6, '#ffd080'); continue; }
    keep.push(p);
  }
  S.projectiles = keep;
}
function splash(p, except) { Snd.sfx('explode'); burst(p.x, p.y, 14, '#ff8030'); S.shake = Math.max(S.shake, 0.12); for (const e of S.enemies) { if (e.dead || e === except) continue; if (dist2(p.x, p.y, e.x, e.y) < p.splash * p.splash) damageEnemy(e, p.dmg * 0.6, p.member, false, true); } }

// ---- per-frame combat housekeeping ----
function updateCombat(dt) {
  // target selection
  let best = null, bestScore = 1e9;
  const ca = Math.cos(S.pa), sa = Math.sin(S.pa);
  for (const e of S.enemies) {
    if (e.dead || (e.state === 'sleep' && e.def.mimic)) continue;
    const dx = e.x - S.px, dy = e.y - S.py, d = Math.hypot(dx, dy); if (d > 12) continue;
    const ang = Math.abs(normAng(Math.atan2(dy, dx) - S.pa));
    const cone = 0.3 + Math.atan2(e.r + 0.2, d);
    if (ang > cone) continue;
    if (!hasLOS(S.px, S.py, e.x, e.y)) continue;
    const score = d * (1 + ang * 1.5); if (score < bestScore) { bestScore = score; best = e; }
  }
  S.target = best;
  for (const m of S.party) { if (m.rec > 0) m.rec -= dt; if (m.cd > 0) m.cd -= dt; if (m.bounce > 0) m.bounce -= dt * 4; if (m.hurt > 0) m.hurt -= dt; if (m.heal > 0) m.heal -= dt; if (m.block > 0) m.block -= dt; if (m.dmgPop) { m.dmgPop.t -= dt; if (m.dmgPop.t <= 0) m.dmgPop = null; } if (!m.dead && m.spts < m.spMax) m.spts = Math.min(m.spMax, m.spts + dt * 0.6); }
  if (S.stamT > 0) S.stamT -= dt; else S.stam = Math.min(S.stamMax, S.stam + dt * 30);
  if (S.bulwark > 0) S.bulwark -= dt; if (S.chill > 0) S.chill -= dt; if (S.iframes > 0) S.iframes -= dt; if (S.hurtT > 0) S.hurtT -= dt; if (S.healFx > 0) S.healFx -= dt; if (S.swing > 0) S.swing -= dt; if (S.rangedFlash > 0) S.rangedFlash -= dt;
  if (S.venom > 0) { S.venom -= dt; S.venomTick = (S.venomTick || 0) + dt; if (S.venomTick > 1) { S.venomTick = 0; for (const m of S.party) if (!m.dead) { m.hp = Math.max(1, m.hp - 2); } } }
  if (S.shake > 0) S.shake -= dt;
  if (S.volley) { S.volley.t -= dt; if (S.volley.t <= 0) { firePartyProjectile(S.volley.m, 'arrow', rollDamage(S.volley.m) * 0.8, S.target, (Math.random() - 0.5) * 0.12); Snd.sfx('bow'); S.volley.n--; S.volley.t = 0.11; if (S.volley.n <= 0) S.volley = null; } }
  // boss wake by proximity (if the player got in by other means)
  for (const e of S.enemies) if (e.boss && !e.dead && e.state === 'idle') { const d = Math.hypot(e.x - S.px, e.y - S.py); if (d < 8 && hasLOS(e.x, e.y, S.px, S.py)) wakeEnemy(e); }
  if (S.boss && (S.boss.dead)) S.boss = null;
  // pickups
  for (let i = S.pickups.length - 1; i >= 0; i--) { const p = S.pickups[i]; if (dist2(p.x, p.y, S.px, S.py) < 0.55 * 0.55) { S.pickups.splice(i, 1); S.flags.item[p.id] = 1; giveItem(p.item); saveGame(); } }
  if (S.mode === 'play' && S.bloodstain && S.t - (S.deathAt || -9) > 2 && dist2(S.bloodstain.x, S.bloodstain.y, S.px, S.py) < 0.6 * 0.6) { gainSouls(S.bloodstain.souls, S.px, S.py); message('Recovered ' + fmtNum(S.bloodstain.souls) + ' souls.'); S.bloodstain = null; Snd.sfx('item'); saveGame(); }
  // fx
  for (let i = S.fx.length - 1; i >= 0; i--) {
    const f = S.fx[i]; f.t -= dt;
    if (f.kind === 'p' || f.kind === 'soul') { f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; f.vz -= (f.kind === 'soul' ? -0.5 : 3) * dt; if (f.kind === 'soul') { f.vx *= 0.9; f.vy *= 0.9; } }
    if (f.t <= 0) S.fx.splice(i, 1);
  }
}
// ---- sprite list for the renderer ----
const _sprList = [];
function gatherSprites() {
  const L = _sprList; L.length = 0;
  for (const o of S.objects) { if (o.anim !== undefined) { o.anim += 1 / 60; o.frame = (o.anim * o.spr.fps) | 0; } L.push(o); }
  for (const e of S.enemies) L.push(e.sd);
  for (const p of S.projectiles) L.push({ spr: p.spr, x: p.x, y: p.y, z: p.z, w: p.w, h: p.h, frame: (p.anim * p.spr.fps) | 0, emissive: p.emissive });
  for (const p of S.pickups) { const def = ITEM_DEFS[p.item]; L.push({ spr: getSprite('itemglow'), x: p.x, y: p.y, z: 0.1, w: 0.7, h: 0.7, frame: (S.t * 2) | 0, emissive: true }); L.push({ spr: getSprite(def.icon), x: p.x, y: p.y, z: 0.25 + Math.sin(S.t * 2 + p.x) * 0.04, w: 0.35, h: 0.35, frame: 0, emissive: true }); }
  if (S.bloodstain) L.push({ spr: getSprite('bloodstain'), x: S.bloodstain.x, y: S.bloodstain.y, z: 0.05, w: 0.7, h: 0.5, frame: (S.t * 3) | 0, emissive: true });
  return L;
}
