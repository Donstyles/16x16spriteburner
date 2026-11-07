// ===================== autoplay bot: "Watch Claude play" =====================
const BOT = {
  on: false, say: '', sayT: 0, goals: [], cur: null, path: null, pathT: 0, stuckT: 0, lastPos: null, mx: 0, my: 0, flow: null, waitT: 0, retry: {}, wipes: 0, done: false, lastRestT: -1e9, log: [],
  start() { this.on = true; this.goals = []; this.cur = null; this.flow = null; this.done = false; this.plan(); this.talk('Four strangers in Harrowmere. First, the lord of the town.'); },
  stop() { this.on = false; this.mx = this.my = 0; this.flow = null; this.talk(''); },
  talk(t) { if (t && t !== this.say) { this.log.push(t); if (this.log.length > 50) this.log.shift(); } this.say = t; this.sayT = 0; },
  // ---------- high level plan ----------
  plan() {
    const g = this.goals;
    g.push({ k: 'town', first: true });
    g.push({ k: 'dungeon', id: 'warrens', need: 1 });
    g.push({ k: 'town' });
    g.push({ k: 'herbs' });
    g.push({ k: 'town' });
    g.push({ k: 'dungeon', id: 'barrow', need: 4 });
    g.push({ k: 'town' });
    g.push({ k: 'dungeon', id: 'reliquary', need: 7 });
    g.push({ k: 'town' });
    g.push({ k: 'dungeon', id: 'molten', need: 10 });
    g.push({ k: 'town' });
    g.push({ k: 'dungeon', id: 'sanctum', need: 13 });
    g.push({ k: 'town', last: true });
  },
  avgLevel() { return G.party.reduce((a, m) => a + m.lvl, 0) / G.party.length; },
  // ---------- pathfinding (A*, 4-way) ----------
  findPath(tx, ty) {
    const sx = Math.floor(G.x), sy = Math.floor(G.y); tx = Math.floor(tx); ty = Math.floor(ty);
    if (sx === tx && sy === ty) return [];
    const w = M.w, h = M.h, N = w * h; const gS = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open = [[Math.abs(tx - sx) + Math.abs(ty - sy), sy * w + sx]]; gS[sy * w + sx] = 0;
    const pop = () => { let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i; return open.splice(bi, 1)[0]; };
    let found = -1, iter = 0;
    while (open.length && iter++ < 60000) {
      const [f, i] = pop(); if (closed[i]) continue; closed[i] = 1; if (i === ty * w + tx) { found = i; break; }
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = ny * w + nx; if (closed[j]) continue; const t = M.t[j]; if (!PASSABLE.has(t) && j !== ty * w + tx) continue; const cost = gS[i] + (t === TR.ROAD ? 0.8 : 1) + (M.objects.some(o => o.x === nx && o.y === ny && (o.kind === 'chest' || o.kind === 'sign' || o.kind === 'well' || o.kind === 'brazier') && !o.taken) ? 1.5 : 0); if (cost < gS[j]) { gS[j] = cost; from[j] = i; open.push([cost + Math.abs(tx - nx) + Math.abs(ty - ny), j]); } }
    }
    if (found < 0) return null;
    const out = []; let i = found; while (i !== sy * w + sx && i >= 0) { out.push([i % w + 0.5, ((i / w) | 0) + 0.5]); i = from[i]; } return out.reverse();
  },
  goto(tx, ty, dt) { // returns true when arrived (within 0.6)
    const d = dist(G.x, G.y, tx, ty); if (d < 0.6) { this.mx = this.my = 0; this.path = null; return true; }
    this.pathT -= dt;
    if (!this.path || this.pathT <= 0 || this.pathTarget !== tx + ',' + ty) { this.path = this.findPath(tx, ty); this.pathTarget = tx + ',' + ty; this.pathT = 2.5; if (!this.path) { this.mx = this.my = 0; return 'nopath'; } if (this.path.length) this.path.push([tx, ty]); }
    while (this.path.length > 1 && dist(G.x, G.y, this.path[0][0], this.path[0][1]) < 0.45) this.path.shift();
    const n = this.path[0] || [tx, ty]; const dx = n[0] - G.x, dy = n[1] - G.y, l = Math.hypot(dx, dy) || 1; this.mx = dx / l; this.my = dy / l;
    // stuck detection
    if (this.lastPos && dist(this.lastPos[0], this.lastPos[1], G.x, G.y) < 0.02 * dt * 60) this.stuckT += dt; else this.stuckT = 0; this.lastPos = [G.x, G.y];
    if (this.stuckT > 1.2) { this.stuckT = 0; this.path = null; this.pathT = 0; const a = Math.random() * TAU; this.mx = Math.cos(a); this.my = Math.sin(a); }
    return false;
  },
  // ---------- threats & combat ----------
  threats() { return G.monsters.filter(mo => !mo.dead && !mo.hidden && mo.aware && dist(mo.x, mo.y, G.x, G.y) < 10); },
  combat(dt, ths) {
    const near = ths.sort((a, b) => dist(a.x, a.y, G.x, G.y) - dist(b.x, b.y, G.x, G.y)); const t = near[0]; G.target = t;
    const d = dist(t.x, t.y, G.x, G.y);
    // close the distance if nobody can hit it
    const melee = findMeleeTarget(t); const ranged = G.party.some(m => alive(m) && isRanged(m) && m.rec <= 0);
    if (!melee && (d > 1.4 || !hasLOS(G.x, G.y, t.x, t.y))) { this.goto(t.x, t.y, dt); } else { this.mx = this.my = 0; }
    if (G.fearT <= 0) partyAttack();
    // healing
    for (const m of G.party) { if (!alive(m)) continue; if (m.hp < maxHp(m) * 0.35) { const cleric = G.party.find(c => alive(c) && c.spells.includes('cure_wounds') && c.sp >= 3 && c.rec <= 0); if (cleric && d > 0.0) { castSpell(cleric, 'cure_wounds'); } else { const pot = G.inv.find(i => i.id === 'potion_heal2') || G.inv.find(i => i.id === 'potion_heal'); if (pot) useItem(pot, m); } } }
    const hurtCount = G.party.filter(m => alive(m) && m.hp < maxHp(m) * 0.6).length; const pc = G.party.find(c => alive(c) && c.spells.includes('power_cure') && c.sp >= 10 && c.rec <= 0); if (pc && hurtCount >= 2) castSpell(pc, 'power_cure');
    // offensive magic
    const n3 = near.filter(mo => dist(mo.x, mo.y, G.x, G.y) < 3).length;
    for (const m of G.party) {
      if (!alive(m) || m.rec > 0) continue;
      const has = id => m.spells.includes(id) && m.sp >= SPELLS[id].sp;
      if (n3 >= 2 && has('ring_of_fire')) { castSpell(m, 'ring_of_fire'); continue; }
      if (near.length >= 2 && has('fireball') && d > 2.5) { castSpell(m, 'fireball'); continue; }
      if (has('lightning_bolt') && t.hp > 40) { castSpell(m, 'lightning_bolt'); continue; }
      if (has('acid_burst') && t.hp > 40) { castSpell(m, 'acid_burst'); continue; }
      if (has('fire_bolt') && monsterResist(t, 'fire') < 50 && m.sp > 6) { castSpell(m, 'fire_bolt'); continue; }
      if (has('ice_bolt') && monsterResist(t, 'cold') < 50 && m.sp > 6) { castSpell(m, 'ice_bolt'); continue; }
      if (has('sparks') && m.sp > 6) { castSpell(m, 'sparks'); continue; }
      if (has('mind_blast') && monsterResist(t, 'mind') < 50 && m.sp > 8 && !m.spells.includes('cure_wounds')) { castSpell(m, 'mind_blast'); continue; }
      if (has('spirit_lash') && m.sp > 12) { castSpell(m, 'spirit_lash'); continue; }
    }
    if (!buffOn('bless')) { const c = G.party.find(c => alive(c) && c.spells.includes('bless') && c.sp >= 6 && c.rec <= 0); if (c) castSpell(c, 'bless'); }
    if (!buffOn('stoneskin') && !buffOn('shield')) { const c = G.party.find(c => alive(c) && c.rec <= 0 && ((c.spells.includes('stone_skin') && c.sp >= 8) || (c.spells.includes('shield') && c.sp >= 8))); if (c) castSpell(c, c.spells.includes('stone_skin') ? 'stone_skin' : 'shield'); }
    this.talk(t.boss ? 'The ' + t.name + '! Everyone, hold the line.' : 'Fighting ' + t.name + (near.length > 1 ? ' and ' + (near.length - 1) + ' more.' : '.'));
  },
  needRest() { const low = G.party.some(m => alive(m) && m.hp < maxHp(m) * 0.55) || G.party.some(m => alive(m) && maxSp(m) > 10 && m.sp < maxSp(m) * 0.3); return low; },
  // ---------- screen flows: a queue of [action, delay] ----------
  runFlow(steps, after) { this.flow = { steps, i: 0, t: 0.4, after }; },
  updateFlow(dt) {
    const f = this.flow; f.t -= dt; if (f.t > 0) return;
    if (f.i >= f.steps.length) { this.flow = null; if (f.after) f.after(); return; }
    const [act, delay, say] = f.steps[f.i++]; if (say) this.talk(say); try { act(); } catch (e) { } f.t = delay || 0.6;
  },
  // ---------- town routine ----------
  townRoutine(opts) {
    const O = getMap('over'); const bld = id => O.objects.find(o => o.kind === 'door' && BUILDINGS[o.building].id === id);
    const steps = [];
    const visit = (door, fn, saying) => { steps.push({ k: 'goto', x: door.x + 0.5, y: door.y + 0.6, say: saying }); steps.push({ k: 'flow', door, fn }); };
    // quests: hall first on the first visit; turn-ins whenever ready
    const hall = bld('hall');
    visit(hall, () => { const main = ['main1', 'main2', 'main3', 'main4'].find(q => questState(q) !== 'done') || 'main4'; const st = questState(main); const fl = []; if (st === 'none') fl.push([() => I.press('qaccept_' + main), 1.6, 'Lord Harrow has a task for us.'], [() => I.press('close'), 0.8]); else if (questReady(main)) fl.push([() => I.press('qturn_' + main), 1.6, 'Reporting back to Lord Harrow.']); fl.push([() => I.press('close'), 0.8]); this.runFlow(fl); }, 'To Harrow Hall, north of the square.');
    const turnIns = [['inn', 'bandits'], ['weapons', 'ore'], ['alchemist', 'herbs'], ['widow', 'locket'], ['temple', 'pilgrims'], ['scholar', 'tome']];
    for (const [b, q] of turnIns) { if (questState(q) === 'active' && questReady(q)) visit(bld(b), () => this.runFlow([[() => I.press('qturn_' + q), 1.6, 'Turning in: ' + QUESTS[q].name + '.'], [() => I.press('close'), 0.8]]), 'Someone is waiting on us.'); }
    if (opts.first) { for (const [b, q] of [['inn', 'bandits'], ['weapons', 'ore'], ['alchemist', 'herbs'], ['widow', 'locket'], ['temple', 'pilgrims'], ['scholar', 'tome']]) visit(bld(b), () => this.runFlow([[() => I.press('qaccept_' + q), 1.4, 'Collecting work from the townsfolk.'], [() => I.press('close'), 0.6], [() => I.press('close'), 0.4]]), 'Asking around town.'); }
    // temple: raise dead / heal
    visit(bld('temple'), () => { const fl = []; const lv = G.party.reduce((a, m) => a + m.lvl, 0); if (G.party.some(m => m.cond.dead) && G.gold >= 150 * lv) fl.push([() => I.press('raise'), 1.2, 'The temple can raise our fallen.']); if (G.party.some(m => m.cond.poison) && G.gold >= 15 * lv) fl.push([() => I.press('cure'), 1, 'Curing the poison.']); fl.push([() => I.press('close'), 0.6]); this.runFlow(fl); }, 'A visit to the temple.');
    // trainer: train and spend skill points, learn useful skills
    visit(bld('trainer'), () => this.trainerFlow(), 'Time to train what we have learned.');
    // guilds
    steps.push({ k: 'goto', x: O.npcs.find(n => n.guild === 'elemental').x + 0.8, y: O.npcs.find(n => n.guild === 'elemental').y, say: 'The Guild of the Elements sells spells.' }); steps.push({ k: 'npcflow', npc: O.npcs.find(n => n.guild === 'elemental'), fn: () => this.guildFlow('elemental') });
    steps.push({ k: 'goto', x: O.npcs.find(n => n.guild === 'spirit').x - 0.8, y: O.npcs.find(n => n.guild === 'spirit').y, say: 'And the Guild of the Spirit.' }); steps.push({ k: 'npcflow', npc: O.npcs.find(n => n.guild === 'spirit'), fn: () => this.guildFlow('spirit') });
    // shops
    visit(bld('weapons'), () => this.shopFlow('weapons'), 'Better steel at the Rusty Blade.');
    visit(bld('armor'), () => this.shopFlow('armor'), 'Armor at the Iron Hauberk.');
    visit(bld('alchemist'), () => this.shopFlow('alchemist'), 'Potions from Old Ysolde.');
    // inn: food and rest
    visit(bld('inn'), () => { const fl = []; const want = Math.max(0, 8 - G.food); for (let i = 0; i < Math.ceil(want / 5) && G.gold > 60; i++) fl.push([() => I.press('buyfood'), 0.8, 'Rations for the road.']); if (this.needRest() || G.party.some(m => m.cond.unconscious)) fl.push([() => I.press('innrest'), 1.5, 'A night at the Drowsy Dragon.']); fl.push([() => I.press('close'), 0.6]); this.runFlow(fl); }, 'The Drowsy Dragon, for food and a bed.');
    // equip pass (character screen, visible)
    steps.push({ k: 'equipflow' });
    return steps;
  },
  trainerFlow() {
    const fl = []; const PRI = { Knight: ['Sword', 'Chain', 'BodyBuilding', 'Shield', 'Plate'], Archer: ['Bow', 'Leather', 'Air', 'Fire', 'Perception'], Cleric: ['Body', 'Spirit', 'Mace', 'Meditation', 'Leather'], Sorcerer: ['Fire', 'Water', 'Air', 'Meditation', 'Earth'], Paladin: ['Mace', 'Spirit', 'Chain', 'Body'], Druid: ['Earth', 'Body', 'Water', 'Meditation'] };
    G.party.forEach((m, i) => {
      fl.push([() => I.press('mtab' + i), 0.5]);
      for (let k = 0; k < 6; k++) fl.push([() => { if (canTrain(m) && G.gold >= TRAIN_COST(m.lvl + 1) + 150) I.press('train'); }, 0.9, m.name + ' trains.']);
      // learn Plate for the knight when rich
      fl.push([() => { if (m.cls === 'Knight' && !m.skills.Plate && G.gold > 1600) I.press('learn_Plate'); if (m.cls === 'Sorcerer' && !m.skills.Meditation && G.gold > 900) I.press('learn_Meditation'); if (m.cls === 'Archer' && !m.skills.Learning && G.gold > 1200) I.press('learn_Learning'); }, 0.6]);
      // promotions for non-magic skills
      fl.push([() => { for (const sk of PRI[m.cls] || []) { if (SKILLS[sk] && SKILLS[sk].kind !== 'magic' && m.skills[sk]) { const have = (m.promo && m.promo[sk]) || 0; if (m.skills[sk] >= 3 && have < 4 && G.gold > 900) { I.press('promo_' + sk + '_4'); break; } if (m.skills[sk] >= 7 && have < 8 && G.gold > 3500) { I.press('promo_' + sk + '_8'); break; } } } }, 0.6]);
    });
    fl.push([() => I.press('close'), 0.5]);
    // spend skill points in the party screen
    fl.push([() => openScreen('char', { tab: 1 }), 0.6, 'Spending skill points.']);
    G.party.forEach((m, i) => { fl.push([() => I.press('mtab' + i), 0.4]); for (let k = 0; k < 6; k++) fl.push([() => { const pri = (PRI[m.cls] || []).filter(sk => m.skills[sk]); for (const sk of pri) { const lv = m.skills[sk]; if (lv >= 10) continue; const needPromo = (lv === 3 && !(m.promo && m.promo[sk] >= 4)) || (lv === 7 && !(m.promo && m.promo[sk] >= 8)); if (needPromo) continue; if (m.skillPts >= skillUpCost(lv)) { I.press('sk_' + sk); return; } } }, 0.45]); });
    fl.push([() => I.press('close'), 0.5]);
    this.runFlow(fl);
  },
  guildFlow(which) {
    const g = GUILDS[which]; const fl = [];
    const WANT = { Sorcerer: ['fire_bolt', 'ring_of_fire', 'sparks', 'ice_bolt', 'fireball', 'town_portal', 'lightning_bolt', 'acid_burst', 'stone_skin', 'shield', 'torch_light'], Cleric: ['cure_wounds', 'bless', 'power_cure', 'cure_poison', 'spirit_lash', 'mind_blast', 'heroism', 'raise_dead', 'mind_shield'], Archer: ['sparks', 'shield', 'fire_bolt', 'wizard_eye'], Paladin: ['bless', 'cure_wounds', 'spirit_lash', 'power_cure'], Druid: ['stun', 'cure_wounds', 'rock_blast', 'stone_skin', 'power_cure'], Knight: [] };
    G.party.forEach((m, i) => {
      if (!CLASSES[m.cls].schools.some(s => g.schools.includes(s))) return;
      fl.push([() => I.press('mtab' + i), 0.5]);
      // learn schools we want (Water for town portal, Earth, Mind)
      fl.push([() => { for (const sc of g.schools) { if (!CLASSES[m.cls].schools.includes(sc) || m.skills[sc]) continue; const wantSchool = (m.cls === 'Sorcerer' && (sc === 'Water' || sc === 'Earth')) || (m.cls === 'Cleric' && sc === 'Mind') || (m.cls === 'Archer' && sc === 'Fire'); if (wantSchool && G.gold > 700) { I.press('learn_' + sc); return; } } }, 0.7]);
      for (let k = 0; k < 5; k++) fl.push([() => { for (const id of WANT[m.cls] || []) { const sp = SPELLS[id]; if (!g.schools.includes(sp.school) || m.spells.includes(id) || !CLASSES[m.cls].schools.includes(sp.school)) continue; const need = sp.lvl === 1 ? 1 : sp.lvl === 2 ? 2 : sp.lvl === 3 ? 4 : 8; if ((m.skills[sp.school] || 0) >= need && G.gold >= sp.price + 250) { I.press('spell_' + id); return; } } }, 0.8, m.name + ' studies a new spell.']);
      fl.push([() => { for (const sc of g.schools) { if (!m.skills[sc]) continue; const have = (m.promo && m.promo[sc]) || 0; if (m.skills[sc] >= 3 && have < 4 && G.gold > 1200) { I.press('promo_' + sc + '_4'); return; } if (m.skills[sc] >= 7 && have < 8 && G.gold > 5000) { I.press('promo_' + sc + '_8'); return; } } }, 0.6]);
    });
    fl.push([() => I.press('close'), 0.5]);
    this.runFlow(fl);
  },
  shopFlow(id) {
    const fl = []; const b = Object.values(BUILDINGS).find(x => x.id === id); const reserve = 350;
    const avg = w => w.dmg[0] * (w.dmg[1] + 1) / 2 + w.dmg[2];
    if (id === 'weapons') {
      // sell spare weapons/armor first
      fl.push([() => I.press('tab1'), 0.6, 'Selling what we do not need.']);
      for (let k = 0; k < 6; k++) fl.push([() => { const i = G.inv.findIndex(it => ['weapon', 'armor', 'shield', 'helm', 'boots'].includes(ITEMS[it.id].type) && !G.party.some(m => canUse(m, it) && isUpgrade(m, it))); if (i >= 0) I.press('sell' + i); }, 0.5]);
      fl.push([() => I.press('tab0'), 0.6]);
      G.party.forEach(m => { for (let k = 0; k < 2; k++) fl.push([() => { if (!alive(m) && m.cond.dead) return; const cur = weaponOf(m); let best = -1, bestV = cur ? avg(cur) : 0; b.stock.forEach((sid, i) => { const w = ITEMS[sid]; if (w.type !== 'weapon' || !m.skills[w.skill]) return; if (cur && !!cur.ranged !== !!w.ranged) return; if (m.cls === 'Sorcerer' && w.skill !== 'Staff') return; const price = buyPrice(makeItem(sid)); if (avg(w) > bestV + 0.5 && G.gold - price >= reserve) { best = i; bestV = avg(w); } }); if (best >= 0) { I.press('buy' + best); this.talk('A ' + ITEMS[b.stock[best]].name + ' for ' + m.name + '.'); } }, 0.9]); });
    } else if (id === 'armor') {
      G.party.forEach(m => { fl.push([() => { for (const type of ['armor', 'shield', 'helm', 'boots']) { const cur = m.equip[SLOT_OF[type]]; const curV = cur ? ITEMS[cur.id].acv : 0; let best = -1, bestV = curV; b.stock.forEach((sid, i) => { const a = ITEMS[sid]; if (a.type !== type) return; if (a.skill && !m.skills[a.skill]) return; if (type === 'shield' && weaponOf(m) && weaponOf(m).twoHand) return; const price = buyPrice(makeItem(sid)); if (a.acv > bestV && G.gold - price >= reserve) { best = i; bestV = a.acv; } }); if (best >= 0) { I.press('buy' + best); this.talk(ITEMS[b.stock[best]].name + ' for ' + m.name + '.'); return; } } }, 0.9]); fl.push([() => { for (const type of ['armor', 'shield', 'helm', 'boots']) { const cur = m.equip[SLOT_OF[type]]; const curV = cur ? ITEMS[cur.id].acv : 0; let best = -1, bestV = curV; b.stock.forEach((sid, i) => { const a = ITEMS[sid]; if (a.type !== type || (a.skill && !m.skills[a.skill])) return; if (type === 'shield' && weaponOf(m) && weaponOf(m).twoHand) return; const price = buyPrice(makeItem(sid)); if (a.acv > bestV && G.gold - price >= reserve) { best = i; bestV = a.acv; } }); if (best >= 0) { I.press('buy' + best); return; } } }, 0.9]); });
    } else {
      const want = { potion_heal: 5, potion_mana: 3, potion_cure: 2, potion_heal2: G.gold > 2500 ? 3 : 0 };
      for (const pid in want) for (let k = 0; k < want[pid]; k++) fl.push([() => { if (countInv(pid) < want[pid] && G.gold - buyPrice(makeItem(pid)) >= reserve) I.press('buy' + b.stock.indexOf(pid)); }, 0.45, 'Stocking potions.']);
    }
    fl.push([() => I.press('close'), 0.6]);
    this.runFlow(fl);
  },
  equipFlow() {
    const fl = [[() => openScreen('char', { tab: 2 }), 0.8, 'Sorting the pack.']];
    G.party.forEach((m, i) => { for (let k = 0; k < 4; k++) fl.push([() => { if (G.sel !== i) { I.press('mtab' + i); return; } const j = G.inv.findIndex(it => SLOT_OF[ITEMS[it.id].type] && canUse(m, it) && isUpgrade(m, it)); if (j >= 0) { G.screen.selItem = j; I.press('equip'); this.talk(m.name + ' equips ' + itemName(G.inv[j]) + '.'); } }, 0.7]); });
    fl.push([() => I.press('close'), 0.6]);
    this.runFlow(fl);
  },
  // ---------- dungeon routine ----------
  dungeonTargets() {
    const t = [];
    for (const o of M.objects) if (o.kind === 'chest' && !o.opened) t.push({ kind: 'chest', x: o.x + 0.5, y: o.y + 0.5, o });
    for (const o of M.objects) if (o.kind === 'pickup' && !o.taken) t.push({ kind: 'pickup', x: o.x + 0.5, y: o.y + 0.5, o });
    return t;
  },
  // ---------- main update ----------
  update(dt) {
    if (!this.on) return; this.sayT += dt;
    if (G.mode === 'dead') { this.waitT += dt; if (this.waitT > 2.5) { this.waitT = 0; this.wipes++; I.press('wake'); this.talk('We wake in the temple. Lighter of purse, wiser of heart.'); if (this.cur) { if (this.cur.k === 'town') this.cur.steps = null; this.goals.unshift(this.cur); } this.goals.unshift({ k: 'town' }); this.cur = null; this.path = null; } return; }
    if (G.mode === 'ending') { this.talk('The Scepter is home. That is the whole game, beginning to end.'); this.done = true; return; }
    if (G.mode !== 'play') return;
    this.mx = this.my = 0;
    if (this.flow) { this.updateFlow(dt); return; }
    if (G.screen) { if (G.screen.kind === 'text' || G.screen.kind === 'npc') { this.waitT += dt; if (this.waitT > 1.8) { this.waitT = 0; I.press('close'); } return; } this.waitT += dt; if (this.waitT > 3) { this.waitT = 0; closeScreen(); } return; }
    this.waitT = 0;
    // combat first
    const ths = this.threats();
    if (ths.length) { this.combat(dt, ths); return; }
    G.target = null;
    // rest when hurt and safe
    if (this.needRest() && !canRest() && G.playTime - this.lastRestT > 8) { this.lastRestT = G.playTime; this.talk(G.food > 0 ? 'Making camp. Everyone needs rest.' : 'No food, but we must rest anyway.'); restParty(8); G.fadeT = 1; return; }
    // goals
    if (!this.cur) { this.cur = this.goals.shift(); if (!this.cur) { this.talk('Nothing left on the list.'); this.done = true; return; } this.cur.state = 0; }
    const c = this.cur; const O = getMap('over');
    if (c.k === 'town') {
      if (M.id !== 'over') { this.leaveDungeon(dt); return; }
      if (!c.steps) { c.steps = this.townRoutine(c); c.si = 0; }
      if (c.si >= c.steps.length) { this.cur = null; if (c.last) { this.talk('Harrowmere is quiet again. We keep walking.'); this.goals.push({ k: 'wander' }); } return; }
      const s = c.steps[c.si];
      if (s.k === 'goto') { if (s.say && this.sayT > 6) this.talk(s.say); const r = this.goto(s.x, s.y, dt); if (r === true) c.si++; else if (r === 'nopath') c.si++; return; }
      if (s.k === 'flow') { const it = nearestInteractable(); if (it && it.o === s.door) { doInteract(it); s.fn(); } c.si++; return; }
      if (s.k === 'npcflow') { const it = nearestInteractable(); if (it && it.n === s.npc) { doInteract(it); s.fn(); } c.si++; return; }
      if (s.k === 'equipflow') { this.equipFlow(); c.si++; return; }
      c.si++; return;
    }
    if (c.k === 'herbs') {
      if (M.id !== 'over') { this.leaveDungeon(dt); return; }
      if (questState('herbs') !== 'active' || countInv('marsh_herb') >= 4) { this.cur = null; return; }
      const herbs = O.objects.filter(o => o.kind === 'pickup' && o.item === 'marsh_herb' && !o.taken).sort((a, b) => dist(a.x, a.y, G.x, G.y) - dist(b.x, b.y, G.x, G.y));
      if (!herbs.length) { this.cur = null; return; }
      if (this.sayT > 8) this.talk('Picking marsh herb for Old Ysolde. The lizardfolk will not like it.');
      const h = herbs[0]; const r = this.goto(h.x + 0.5, h.y + 0.5, dt); if (r === true) { const it = nearestInteractable(); if (it && it.o === h) doInteract(it); else h.taken = true; } else if (r === 'nopath') h.taken = true;
      return;
    }
    if (c.k === 'dungeon') {
      const D = DUNGEONS[c.id];
      if (M.id === 'over') {
        if (this.avgLevel() < c.need - 2 && !c.grinding) { c.grinding = true; this.talk('We are not ready for the ' + D.name + '. Let us hunt the roads first.'); }
        if (c.grinding) { const camp = this.nearestCamp(); if (camp && this.avgLevel() < c.need - 1) { if (this.sayT > 8) this.talk('Hunting for experience near ' + camp.name + '.'); const r = this.goto(camp.x, camp.y, dt); if (r === true || r === 'nopath') c.campVisited = (c.campVisited || 0) + 1; if (c.campVisited > 2 || this.avgLevel() >= c.need - 1) { c.grinding = false; c.campVisited = 0; this.goals.unshift({ k: 'town' }, c); this.cur = null; } return; } c.grinding = false; }
        const [ex, ey] = ENTRANCES[c.id]; if (this.sayT > 8) this.talk('On the road to the ' + D.name + '.');
        const r = this.goto(ex + 0.5, ey + 0.9, dt); if (r === true) { const it = nearestInteractable(); if (it && it.o && it.o.kind === 'entrance') { doInteract(it); this.talk(D.entrance); } } return;
      }
      if (M.id !== c.id) { this.leaveDungeon(dt); return; }
      // inside: chests, then the boss, then leave
      const boss = G.monsters.find(mo => mo.boss && !mo.dead); const bossDead = !boss && mapState(c.id).dead[M.monsters.findIndex(mo => mo.boss)];
      const targets = this.dungeonTargets().sort((a, b) => dist(a.x, a.y, G.x, G.y) - dist(b.x, b.y, G.x, G.y));
      if (targets.length && !(c.bossFirst && boss)) {
        const t = targets[0]; if (this.sayT > 8) this.talk(t.kind === 'chest' ? 'A chest. Chests are why we came.' : 'Something on the floor.');
        const r = this.goto(t.x, t.y, dt); if (r === true) { const it = nearestInteractable(); if (it && it.o === t.o) doInteract(it); else { t.o.opened = true; t.o.taken = true; } } else if (r === 'nopath') { t.o.opened = true; t.o.taken = true; }
        return;
      }
      if (boss) { if (this.sayT > 8) this.talk('Now for ' + boss.name + '.'); const r = this.goto(boss.x, boss.y, dt); if (r === 'nopath') { boss.aware = true; } return; }
      if (G.drops.length) { const d = G.drops[0]; this.goto(d.x, d.y, dt); return; }
      this.talk(D.name + ' is cleared. Back to town.'); this.cur = null; return;
    }
    if (c.k === 'wander') { const camp = this.nearestCamp(); if (camp) { this.goto(camp.x, camp.y, dt); } return; }
    this.cur = null;
  },
  nearestCamp() { const O = getMap('over'); let best = null, bd = 1e9; for (const [cx, cy, r, list, n] of CAMPS) { const alive = G.monsters.some(mo => !mo.dead && mo.group === cx + ',' + cy); if (!alive) continue; const tier = MONSTERS[list[0]].tier; if (tier > Math.ceil(this.avgLevel() / 3) + 1) continue; const d = dist(cx, cy, G.x, G.y); if (d < bd) { bd = d; best = { x: cx + 0.5, y: cy + 0.5, name: MONSTERS[list[0]].name + 's' }; } } return best; },
  leaveDungeon(dt) { const st = M.objects.find(o => o.kind === 'stairs'); if (!st) { enterMap('over', null, null); return; } const port = G.party.find(m => alive(m) && m.spells.includes('town_portal') && m.sp >= 12 && m.rec <= 0); if (port) { this.talk('Town Portal. The long way home is for other people.'); castSpell(port, 'town_portal'); return; } if (this.sayT > 8) this.talk('Back to the stairs.'); const r = this.goto(st.x + 0.5, st.y + 0.5, dt); if (r === true) { const it = nearestInteractable(); if (it && it.o === st) doInteract(it); } else if (r === 'nopath') enterMap('over', null, null); },
};
function isUpgrade(m, it) { const b = ITEMS[it.id]; const slot = SLOT_OF[b.type]; if (!slot) return false; const cur = m.equip[slot]; if (b.type === 'weapon') { if (cur && !!ITEMS[cur.id].ranged !== !!b.ranged) return false; if (m.cls === 'Sorcerer' && b.skill !== 'Staff') return false; if (m.cls === 'Archer' && !b.ranged) return false; const avg = w => w.dmg[0] * (w.dmg[1] + 1) / 2 + w.dmg[2]; return avg(b) > (cur ? avg(ITEMS[cur.id]) : 0) + 0.4; } return (b.acv || 0) > (cur ? ITEMS[cur.id].acv || 0 : 0); }
