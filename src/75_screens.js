// ===================== UI: screens =====================
function openScreen(kind, data) { G.screen = Object.assign({ kind, scroll: 0, tab: 0 }, data || {}); I.modal = true; I.joy = null; Snd.play('ui'); }
function closeScreen() { G.screen = null; I.modal = false; }
function openText(title, body) { openScreen('text', { title, body }); }
function openBuilding(b) { Snd.play('door'); openScreen(b.kind === 'shop' ? 'shop' : b.kind, { b, tab: 0, said: 0 }); }
function openNpc(n) { if (n.guild) openScreen('guild', { guild: GUILDS[n.guild], n }); else openScreen('npc', { n, line: 0 }); }
function merchantSkill() { return Math.max(...G.party.map(m => m.skills.Merchant || 0)); }
function buyPrice(it) { return Math.ceil(itemValue(it) * Math.max(1.0, 1.5 - merchantSkill() * 0.05)); }
function sellPrice(it) { return Math.floor(itemValue(it) * Math.min(0.8, 0.3 + merchantSkill() * 0.05)); }
function layout() { const x = U.ins.l + 10, y = U.ins.t + 8, w = U.W - U.ins.l - U.ins.r - 20, h = U.barTop - U.ins.t - 16; return { x, y, w, h }; }
// scrollable list of rows; returns nothing, buttons register themselves. rows: [{id,label,sub,right,on,disabled,icon}]
function listBox(ctx, key, x, y, w, h, rows, rowH = 34, opts = {}) {
  const s = G.screen; const maxScroll = Math.max(0, rows.length * (rowH + 4) - h); s[key] = clamp((s[key] || 0) + I.wheel * (rowH + 4) + (I.swipeScroll || 0), 0, maxScroll); I.wheel = 0;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  rows.forEach((r, i) => { const ry = y + i * (rowH + 4) - s[key]; if (ry + rowH < y || ry > y + h) return; btn(ctx, r.id, x, ry, w - (maxScroll > 0 ? 10 : 0), rowH, r.label, r); });
  ctx.restore();
  if (maxScroll > 0) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + w - 6, y, 4, h); ctx.fillStyle = C.gold; ctx.fillRect(x + w - 6, y + (h - 20) * (s[key] / maxScroll), 4, 20); I.scrollZones = I.scrollZones || []; I.scrollZones.push({ x, y, w, h, key }); }
  // keep buttons inside the clip region hit-testable only when visible
  I.buttons = I.buttons.filter(b => !rows.some(r => r.id === b.id) || (b.y + b.h > y && b.y < y + h));
}
function memberTabs(ctx, x, y) { G.party.forEach((m, i) => { const sel = i === G.sel; ctx.fillStyle = sel ? C.hl : 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + i * 56, 52, 52); ctx.strokeStyle = sel ? C.gold : '#4a3e34'; ctx.strokeRect(x + 0.5, y + i * 56 + 0.5, 51, 51); const im = creatureCanvas(m.portrait, 0, 3); if (m.cond.dead) ctx.globalAlpha = 0.4; ctx.drawImage(im, x + 2, y + i * 56 + 2, 48, 48); ctx.globalAlpha = 1; I.buttons.push({ id: 'mtab' + i, x, y: y + i * 56, w: 52, h: 52 }); }); }
function drawScreen(ctx) {
  const s = G.screen; const L = layout();
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, U.W, U.barTop);
  const fn = { char: drawChar, spells: drawSpells, map: drawMap, quests: drawQuests, shop: drawShop, temple: drawTemple, inn: drawInn, trainer: drawTrainer, guild: drawGuild, hall: drawHall, house: drawHouse, npc: drawNpcDialog, text: drawTextScreen, rest: drawRest, menu: drawMenu }[s.kind];
  if (fn) fn(ctx, L, s);
  btn(ctx, 'close', L.x + L.w - 40, L.y + 6, 34, 28, 'X', { scale: 2 });
}
// ---- character ----
function drawChar(ctx, L, s) {
  panel(ctx, L.x, L.y, L.w, L.h); const m = G.party[G.sel]; memberTabs(ctx, L.x + 8, L.y + 44);
  const tabs = ['STATS', 'SKILLS', 'ITEMS', 'SPELLS']; tabs.forEach((t, i) => btn(ctx, 'tab' + i, L.x + 70 + i * 96, L.y + 8, 90, 28, t, { on: s.tab === i, scale: 1 }));
  const x = L.x + 70, y = L.y + 44, w = L.w - 80, h = L.h - 52;
  if (s.tab === 0) {
    text(ctx, m.name + '  -  Level ' + m.lvl + ' ' + m.cls, x, y, 2, C.gold); text(ctx, 'Experience ' + fmtNum(m.xp) + ' / ' + fmtNum(XP_FOR_LEVEL(m.lvl + 1)) + (canTrain(m) ? '  (ready to train)' : '') + '   Skill points ' + m.skillPts + '   Condition: ' + condName(m), x, y + 18, 1, C.dim);
    STATS.forEach((st, i) => { const base = m.stats[st], eff = effStat(m, st), b = statBonus(eff); text(ctx, STAT_NAMES[st], x, y + 38 + i * 15, 1, C.text); text(ctx, eff + (eff !== base ? ' (' + base + ')' : ''), x + 90, y + 38 + i * 15, 1, eff > base ? '#80ff90' : eff < base ? '#ff8080' : C.text); text(ctx, (b >= 0 ? '+' : '') + b, x + 130, y + 38 + i * 15, 1, C.dim); });
    const dx = x + 180; const w0 = weaponOf(m);
    const der = [['Hit Points', m.hp + ' / ' + maxHp(m)], ['Spell Points', maxSp(m) ? m.sp + ' / ' + maxSp(m) : '-'], ['Armor Class', armorClass(m)], ['Attack Bonus', '+' + attackBonus(m)], ['Damage', w0 ? w0.dmg[0] + 'd' + w0.dmg[1] + (w0.dmg[2] ? '+' + w0.dmg[2] : '') + ' ' + (statBonus(effStat(m, 'mt')) >= 0 ? '+' : '') + statBonus(effStat(m, 'mt')) : '1d3'], ['Recovery', recoveryTime(m).toFixed(2) + 's'], ['Resist Fire', enchSum(m, 'res') ? '' : '-'], ];
    der.slice(0, 6).forEach(([k, v], i) => { text(ctx, k, dx, y + 38 + i * 15, 1, C.text); text(ctx, v, dx + 100, y + 38 + i * 15, 1, '#ffe9a0'); });
    // equipment
    const ex = x + 330, slots = ['weapon', 'armor', 'shield', 'helm', 'boots', 'ring', 'amulet'];
    text(ctx, 'EQUIPMENT  (tap to remove)', ex, y, 1, C.gold);
    slots.forEach((sl, i) => { const it = m.equip[sl]; btn(ctx, 'uneq' + sl, ex, y + 14 + i * 26, Math.min(300, L.x + L.w - ex - 14), 24, it ? itemName(it) : '-', { align: 'left', scale: 1, icon: it ? ITEMS[it.id].icon : undefined, sub: it ? null : cap(sl), disabled: !it, right: it ? (ITEMS[it.id].acv ? 'AC+' + ITEMS[it.id].acv : '') : '' }); });
    if (s.hint) text(ctx, s.hint, x, L.y + L.h - 16, 1, C.dim);
  } else if (s.tab === 1) {
    text(ctx, m.name + '   Skill points: ' + m.skillPts + '   (cost to raise = new level)', x, y, 2, C.gold);
    const sk = Object.keys(m.skills); const rows = sk.map(k => { const lv = m.skills[k]; const cost = skillUpCost(lv); const needPromo = (lv === 3 && !(m.promo && m.promo[k] >= 4)) || (lv === 7 && !(m.promo && m.promo[k] >= 8)); return { id: 'sk_' + k, label: k + '  ' + lv + '  ' + RANK(lv), sub: SKILLS[k].desc.slice(0, 70), right: lv >= 10 ? 'max' : needPromo ? 'needs ' + (lv === 3 ? 'Expert' : 'Master') : '+ ' + cost + ' pts', rightColor: m.skillPts >= cost && !needPromo && lv < 10 ? '#80ff90' : C.dim, disabled: false, align: 'left', scale: 1 }; });
    listBox(ctx, 'scroll', x, y + 20, w, h - 24, rows, 36);
  } else if (s.tab === 2) {
    text(ctx, 'THE PACK   Gold ' + fmtNum(G.gold) + '   Food ' + G.food + '   (' + G.inv.length + ' items)', x, y, 2, C.gold);
    const rows = G.inv.map((it, i) => ({ id: 'inv' + i, label: itemName(it), sub: itemDesc(it).slice(0, 80), icon: ITEMS[it.id].icon, right: fmtNum(itemValue(it)) + 'g', on: s.selItem === i, scale: 1 }));
    listBox(ctx, 'scroll', x, y + 20, w - 190, h - 24, rows, 34);
    const ax = x + w - 180;
    if (s.selItem !== undefined && G.inv[s.selItem]) { const it = G.inv[s.selItem], b = ITEMS[it.id]; text(ctx, itemName(it), ax, y + 20, 1, C.gold); wrap(itemDesc(it), 1, 170).slice(0, 7).forEach((l, i) => text(ctx, l, ax, y + 34 + i * 11, 1, C.text)); let by = y + 120; if (SLOT_OF[b.type]) { btn(ctx, 'equip', ax, by, 170, 28, 'EQUIP ON ' + m.name.toUpperCase(), { scale: 1, disabled: !canUse(m, it) }); by += 32; } if (b.type === 'potion' || b.use || b.type === 'food') { btn(ctx, 'use', ax, by, 170, 28, b.type === 'potion' ? 'USE ON ' + m.name.toUpperCase() : 'USE', { scale: 1 }); by += 32; } btn(ctx, 'drop', ax, by, 170, 28, 'DROP', { scale: 1 }); } else text(ctx, 'Select an item.', ax, y + 20, 1, C.dim);
  } else if (s.tab === 3) drawSpellList(ctx, x, y, w, h, m);
}
function drawSpells(ctx, L, s) { panel(ctx, L.x, L.y, L.w, L.h); memberTabs(ctx, L.x + 8, L.y + 44); const m = G.party[G.sel]; text(ctx, 'SPELLBOOK', L.x + 70, L.y + 14, 2, C.gold); drawSpellList(ctx, L.x + 70, L.y + 44, L.w - 80, L.h - 52, m); }
function drawSpellList(ctx, x, y, w, h, m) {
  text(ctx, m.name + '   Spell points ' + m.sp + ' / ' + maxSp(m) + '   (tap a spell to cast it)', x, y, 2, C.gold);
  const ids = m.spells.slice().sort((a, b) => SCHOOLS.indexOf(SPELLS[a].school) - SCHOOLS.indexOf(SPELLS[b].school) || SPELLS[a].lvl - SPELLS[b].lvl);
  const rows = ids.map(id => { const sp = SPELLS[id]; const err = canCast(m, id); return { id: 'cast_' + id, label: sp.name, sub: sp.school + ' ' + sp.lvl + ' (skill ' + (m.skills[sp.school] || 0) + ')  ' + sp.desc.slice(0, 60), right: sp.sp + ' sp', rightColor: err ? '#ff8080' : '#80ff90', scale: 1, align: 'left' }; });
  if (!rows.length) text(ctx, 'No spells known. Guilds in the town square sell them.', x, y + 24, 1, C.dim);
  listBox(ctx, 'scroll', x, y + 20, w, h - 24, rows, 36);
}
// ---- map ----
function drawMap(ctx, L, s) {
  panel(ctx, L.x, L.y, L.w, L.h); text(ctx, M.name.toUpperCase() + '   -   ' + (M.outdoor ? 'Harrowmere Reach' : DUNGEONS[M.id].entrance), L.x + 14, L.y + 14, 2, C.gold);
  const mx = L.x + 14, my = L.y + 40, mw = L.w - 28, mh = L.h - 54; const sc = Math.min(mw / M.w, mh / M.h); const ox = mx + (mw - M.w * sc) / 2, oy = my + (mh - M.h * sc) / 2;
  ctx.fillStyle = '#0a0806'; ctx.fillRect(ox, oy, M.w * sc, M.h * sc);
  const col = { [TR.FLOOR]: '#6a5a48', [TR.WALL]: '#2e2620', [TR.GRASS]: '#3f7a2a', [TR.DIRT]: '#6a4e2e', [TR.ROAD]: '#b8a070', [TR.WATER]: '#2e62b8', [TR.DEEP]: '#1e3f8a', [TR.SAND]: '#d8c070', [TR.TREE]: '#1f4f1a', [TR.ROCK]: '#777', [TR.LAVA]: '#ff6a20', [TR.DOOR]: '#d8a040', [TR.ROOF]: '#8a4a2a' };
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) { if (!M.explored[y * M.w + x]) continue; ctx.fillStyle = col[M.t[y * M.w + x]] || '#000'; ctx.fillRect(ox + x * sc, oy + y * sc, Math.ceil(sc), Math.ceil(sc)); }
  for (const o of M.objects) { if (!M.explored[o.y * M.w + o.x]) continue; if (o.kind === 'entrance' || o.kind === 'stairs' || o.kind === 'door') { ctx.fillStyle = '#fff'; ctx.fillRect(ox + o.x * sc - 1, oy + o.y * sc - 1, sc + 2, sc + 2); if (sc > 4 && (o.kind === 'entrance')) text(ctx, o.name, ox + o.x * sc, oy + o.y * sc - 10, 1, '#fff', 'center'); } else if (o.kind === 'chest' && !o.opened) { ctx.fillStyle = '#ffd040'; ctx.fillRect(ox + o.x * sc, oy + o.y * sc, Math.max(2, sc), Math.max(2, sc)); } }
  if (buffOn('eye')) for (const mo of G.monsters) if (!mo.dead) { ctx.fillStyle = mo.boss ? '#ff3030' : '#ff7070'; ctx.fillRect(ox + mo.x * sc - 1, oy + mo.y * sc - 1, 3, 3); }
  for (const n of M.npcs) { ctx.fillStyle = '#60c0ff'; ctx.fillRect(ox + n.x * sc - 1, oy + n.y * sc - 1, 3, 3); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox + G.x * sc, oy + G.y * sc, 3, 0, TAU); ctx.fill(); ctx.strokeStyle = C.gold; ctx.stroke();
  if (M.outdoor) { for (const id in ENTRANCES) { const [ex, ey] = ENTRANCES[id]; if (M.explored[ey * M.w + ex]) text(ctx, DUNGEONS[id].name, ox + ex * sc, oy + ey * sc - 12, 1, '#ffe9a0', 'center'); } text(ctx, 'Harrowmere', ox + M.townSquare.x * sc, oy + M.townSquare.y * sc + 6, 1, '#ffe9a0', 'center'); }
}
// ---- quests ----
function drawQuests(ctx, L, s) {
  panel(ctx, L.x, L.y, L.w, L.h); text(ctx, 'QUEST LOG', L.x + 14, L.y + 14, 2, C.gold);
  const ids = Object.keys(G.quests); const rows = ids.map(id => ({ id: 'q_' + id, label: QUESTS[id].name, sub: G.quests[id] === 'done' ? 'completed' : 'from ' + QUESTS[id].giver + '   ' + questProgress(id), right: G.quests[id] === 'done' ? 'done' : questReady(id) ? 'turn in!' : '', rightColor: questReady(id) ? '#80ff90' : C.dim, on: s.selQ === id, scale: 1 }));
  if (!rows.length) text(ctx, 'No quests yet. Talk to the people of Harrowmere.', L.x + 14, L.y + 44, 1, C.dim);
  listBox(ctx, 'scroll', L.x + 14, L.y + 40, Math.min(420, L.w / 2), L.h - 54, rows, 36);
  const q = s.selQ && QUESTS[s.selQ]; if (q) { const tx = L.x + Math.min(420, L.w / 2) + 30; text(ctx, q.name, tx, L.y + 44, 2, C.gold); wrap(q.text, 1, L.w - (tx - L.x) - 20).forEach((l, i) => text(ctx, l, tx, L.y + 66 + i * 11, 1, C.text)); text(ctx, 'Reward: ' + (q.reward.gold || 0) + ' gold, ' + (q.reward.xp || 0) + ' xp' + (q.reward.item ? ', ' + ITEMS[q.reward.item].name : '') + (q.reward.skillPoints ? ', ' + q.reward.skillPoints + ' skill points' : ''), tx, L.y + 150, 1, '#ffe9a0'); }
}
// ---- buildings ----
function keeperHeader(ctx, L, b, name, spr, greeting) { panel(ctx, L.x, L.y, L.w, L.h); const im = creatureCanvas(spr, Math.floor(G.playTime * 3) % 4, 4); ctx.drawImage(im, L.x + 14, L.y + 12, 64, 64); text(ctx, name, L.x + 90, L.y + 14, 2, C.gold); text(ctx, b, L.x + 90, L.y + 32, 1, C.dim); if (greeting) wrap(greeting, 1, L.w - 300).slice(0, 3).forEach((l, i) => text(ctx, l, L.x + 90, L.y + 48 + i * 11, 1, C.text)); }
function questButton(ctx, qid, x, y, w) {
  const st = questState(qid), q = QUESTS[qid];
  if (st === 'none') btn(ctx, 'qaccept_' + qid, x, y, w, 32, 'QUEST: ' + q.name, { scale: 1, sub: 'hear what they ask' });
  else if (st === 'active') btn(ctx, 'qturn_' + qid, x, y, w, 32, (questReady(qid) ? 'TURN IN: ' : 'IN PROGRESS: ') + q.name, { scale: 1, sub: questProgress(qid), disabled: false });
  else btn(ctx, 'none', x, y, w, 32, 'COMPLETED: ' + q.name, { scale: 1, disabled: true });
}
function drawShop(ctx, L, s) {
  const b = s.b; keeperHeader(ctx, L, b.name, b.keeper, b.spr, s.tab === 0 ? 'Have a look. Best goods in the Reach, and I would know.' : 'Show me what you carry. I pay fair, for the Reach.');
  btn(ctx, 'tab0', L.x + L.w - 300, L.y + 10, 80, 28, 'BUY', { on: s.tab === 0, scale: 1 }); btn(ctx, 'tab1', L.x + L.w - 215, L.y + 10, 80, 28, 'SELL', { on: s.tab === 1, scale: 1 });
  text(ctx, 'Gold ' + fmtNum(G.gold), L.x + L.w - 300, L.y + 46, 2, '#ffe9a0');
  const y = L.y + 84, h = L.h - 92;
  if (s.tab === 0) { const rows = b.stock.map((id, i) => { const it = makeItem(id); const p = buyPrice(it); return { id: 'buy' + i, label: ITEMS[id].name, sub: itemDesc(it).slice(0, 70), icon: ITEMS[id].icon, right: p + 'g', rightColor: G.gold >= p ? '#80ff90' : '#ff8080', scale: 1 }; }); listBox(ctx, 'scroll', L.x + 14, y, L.w - 28, h, rows, 34); }
  else { const rows = G.inv.map((it, i) => ({ it, i })).filter(e => b.buys.includes(ITEMS[e.it.id].type) || b.buys.includes('quest') && ITEMS[e.it.id].type !== 'quest' && false).map(e => ({ id: 'sell' + e.i, label: itemName(e.it), sub: itemDesc(e.it).slice(0, 70), icon: ITEMS[e.it.id].icon, right: sellPrice(e.it) + 'g', rightColor: '#80ff90', scale: 1 })); if (!rows.length) text(ctx, 'Nothing this shop wants.', L.x + 14, y + 4, 1, C.dim); listBox(ctx, 'scroll', L.x + 14, y, L.w - 28, h, rows, 34); }
  if (b.quest) questButton(ctx, b.quest, L.x + L.w - 300, L.y + 50 + 14, 286);
}
function drawTemple(ctx, L, s) {
  const b = s.b; keeperHeader(ctx, L, b.name, b.keeper, b.spr, 'The Dawn welcomes you. We mend what the dark breaks, for a donation.');
  const lv = G.party.reduce((a, m) => a + m.lvl, 0); const x = L.x + 14, y = L.y + 90, w = Math.min(420, L.w / 2 - 20);
  btn(ctx, 'heal', x, y, w, 36, 'HEAL THE PARTY', { scale: 1, sub: 'full hit points, ' + (10 * lv) + ' gold', right: 10 * lv + 'g' });
  btn(ctx, 'cure', x, y + 42, w, 36, 'CURE AILMENTS', { scale: 1, sub: 'poison and weakness, ' + (15 * lv) + ' gold', right: 15 * lv + 'g' });
  const dead = G.party.filter(m => m.cond.dead); btn(ctx, 'raise', x, y + 84, w, 36, 'RAISE THE DEAD', { scale: 1, sub: dead.length ? dead.map(m => m.name).join(', ') + ', ' + 150 * lv + ' gold' : 'no one needs raising', right: 150 * lv + 'g', disabled: !dead.length });
  btn(ctx, 'donate', x, y + 126, w, 36, 'DONATE 100 GOLD', { scale: 1, sub: 'a blessing of the Dawn for a day', right: '100g' });
  questButton(ctx, b.quest, L.x + L.w - 300, L.y + 64, 286);
  text(ctx, 'Gold ' + fmtNum(G.gold), L.x + L.w - 300, L.y + 44, 2, '#ffe9a0');
}
function drawInn(ctx, L, s) {
  const b = s.b; keeperHeader(ctx, L, b.name, b.keeper, b.spr, 'Rooms upstairs, stew downstairs, and rumours for the price of a drink.');
  const x = L.x + 14, y = L.y + 90, w = Math.min(420, L.w / 2 - 20);
  btn(ctx, 'innrest', x, y, w, 36, 'REST THE NIGHT', { scale: 1, sub: 'full heal and cure, no food needed, 30 gold', right: '30g' });
  btn(ctx, 'buyfood', x, y + 42, w, 36, 'BUY 5 RATIONS', { scale: 1, sub: 'food for five rests', right: '25g' });
  btn(ctx, 'rumour', x, y + 84, w, 36, 'BUY A ROUND, HEAR A RUMOUR', { scale: 1, sub: '5 gold', right: '5g' });
  if (s.rumour) wrap(s.rumour, 1, w).forEach((l, i) => text(ctx, l, x, y + 128 + i * 11, 1, C.text));
  questButton(ctx, b.quest, L.x + L.w - 300, L.y + 64, 286);
  text(ctx, 'Gold ' + fmtNum(G.gold) + '   Food ' + G.food, L.x + L.w - 300, L.y + 44, 2, '#ffe9a0');
}
const RUMOURS = ['They say the goblin king wears a signet that opens nothing, and guards it like it opens everything.', 'The barrow trees move at night. Fire makes them stop moving.', 'Golems do not fear your mind or your poison. Bring a heavy hammer.', 'The Reliquary is cold enough to slow a man. Dress warm, drink hot.', 'Old Ysolde pays well for marsh herb. The lizardfolk do not care for pickers.', 'The Sanctum has two locks. Nobody who went to find the keys came back to say where they were.', 'Train before you fight. A level is worth more than a sword.', 'Merchants charge what they like unless you know the trade yourself.'];
function drawTrainer(ctx, L, s) {
  const b = s.b; keeperHeader(ctx, L, b.name, b.keeper, b.spr, 'Experience is nothing until it is beaten into you. Who trains today?');
  const m = G.party[G.sel]; memberTabs(ctx, L.x + 14, L.y + 84); const x = L.x + 80, y = L.y + 84, w = L.w - 100;
  const need = XP_FOR_LEVEL(m.lvl + 1), cost = TRAIN_COST(m.lvl + 1);
  btn(ctx, 'train', x, y, Math.min(420, w), 40, 'TRAIN ' + m.name.toUpperCase() + ' TO LEVEL ' + (m.lvl + 1), { scale: 1, sub: fmtNum(m.xp) + ' / ' + fmtNum(need) + ' experience, costs ' + cost + ' gold', right: cost + 'g', disabled: !canTrain(m) || G.gold < cost });
  text(ctx, 'SKILLS FOR SALE (' + m.cls + ')', x, y + 50, 1, C.gold);
  const learn = CLASSES[m.cls].learnable.filter(k => SKILLS[k].kind !== 'magic' && !m.skills[k]).map(k => ({ id: 'learn_' + k, label: 'Learn ' + k, sub: SKILLS[k].desc.slice(0, 60), right: '200g', rightColor: G.gold >= 200 ? '#80ff90' : '#ff8080', scale: 1 }));
  const promo = Object.keys(m.skills).filter(k => SKILLS[k].kind !== 'magic').map(k => { const lv = m.skills[k]; const have = (m.promo && m.promo[k]) || 0; const want = have < 4 ? 4 : have < 8 ? 8 : 0; if (!want) return null; const price = want === 4 ? 500 : 2500; return { id: 'promo_' + k + '_' + want, label: (want === 4 ? 'Expert ' : 'Master ') + k, sub: 'requires skill ' + (want - 1) + ' (now ' + lv + ')', right: price + 'g', rightColor: lv >= want - 1 && G.gold >= price ? '#80ff90' : '#ff8080', disabled: lv < want - 1, scale: 1 }; }).filter(Boolean);
  listBox(ctx, 'scroll', x, y + 64, Math.min(520, w), L.h - 160, learn.concat(promo), 32);
  text(ctx, 'Gold ' + fmtNum(G.gold), L.x + L.w - 200, L.y + 44, 2, '#ffe9a0');
}
function drawGuild(ctx, L, s) {
  const g = s.guild; keeperHeader(ctx, L, g.name, g.keeper, g.spr, 'Knowledge for gold. The ' + g.schools.join(', ') + ' schools are taught here.');
  const m = G.party[G.sel]; memberTabs(ctx, L.x + 14, L.y + 84); const x = L.x + 80, y = L.y + 84, w = L.w - 100;
  const rows = [];
  for (const sc of g.schools) { if (!CLASSES[m.cls].schools.includes(sc)) continue; if (!m.skills[sc]) rows.push({ id: 'learn_' + sc, label: 'Learn ' + sc + ' magic', sub: SKILLS[sc].desc, right: '300g', rightColor: G.gold >= 300 ? '#80ff90' : '#ff8080', scale: 1 }); else { const lv = m.skills[sc], have = (m.promo && m.promo[sc]) || 0, want = have < 4 ? 4 : have < 8 ? 8 : 0; if (want) rows.push({ id: 'promo_' + sc + '_' + want, label: (want === 4 ? 'Expert ' : 'Master ') + sc, sub: 'requires skill ' + (want - 1) + ' (now ' + lv + ')', right: (want === 4 ? 600 : 3000) + 'g', disabled: lv < want - 1, scale: 1 }); } }
  for (const id in SPELLS) { const sp = SPELLS[id]; if (!g.schools.includes(sp.school) || !CLASSES[m.cls].schools.includes(sp.school) || m.spells.includes(id)) continue; const need = sp.lvl === 1 ? 1 : sp.lvl === 2 ? 2 : sp.lvl === 3 ? 4 : 8; const ok = (m.skills[sp.school] || 0) >= need; rows.push({ id: 'spell_' + id, label: sp.name, sub: sp.school + ' ' + sp.lvl + ', needs skill ' + need + ': ' + sp.desc.slice(0, 50), right: sp.price + 'g', rightColor: ok && G.gold >= sp.price ? '#80ff90' : '#ff8080', disabled: !ok, scale: 1, icon: 'book' }); }
  if (!rows.length) text(ctx, m.name + ' can learn nothing more here.', x, y, 1, C.dim);
  listBox(ctx, 'scroll', x, y, Math.min(560, w), L.h - 96, rows, 32);
  text(ctx, 'Gold ' + fmtNum(G.gold), L.x + L.w - 200, L.y + 44, 2, '#ffe9a0');
}
function drawHall(ctx, L, s) {
  const b = s.b; const main = ['main1', 'main2', 'main3', 'main4'].find(q => questState(q) !== 'done') || 'main4';
  const greet = questState('main1') === 'none' ? 'Adventurers. Good. The Scepter of the Mandate was stolen from this hall, and the Reach rots without it. I have work, if you have the stomach.' : G.flags.won ? 'The Mandate is restored. Harrowmere owes you more than gold.' : 'Any news? The Reach grows darker by the day.';
  keeperHeader(ctx, L, b.name, b.keeper, b.spr, greet);
  const x = L.x + 14, y = L.y + 90, w = Math.min(520, L.w - 28);
  questButton(ctx, main, x, y, w);
  wrap('The Mandate of Heaven: a scepter kept in Harrow Hall since the founding, by which the lord holds the Reach. Four months ago it was taken, and the goblins came down from the Warrens the week after.', 1, w).forEach((l, i) => text(ctx, l, x, y + 44 + i * 11, 1, C.text));
}
function drawHouse(ctx, L, s) { const b = s.b; const lines = { widow: 'My husband went north with the carts in spring. The goblins sent back his boots.', scholar: 'Mind the stacks. Somewhere in them was my tome, before the thief in the frost-blue cloak.' }; keeperHeader(ctx, L, b.name, b.keeper, b.spr, lines[b.id]); questButton(ctx, b.quest, L.x + 14, L.y + 90, Math.min(520, L.w - 28)); }
function drawNpcDialog(ctx, L, s) { const n = s.n; keeperHeader(ctx, L, 'Harrowmere', n.name, n.spr, null); const line = n.lines[s.line % n.lines.length]; panel(ctx, L.x + 14, L.y + 84, L.w - 28, 70, 'parch'); wrap(line, 1, L.w - 60).forEach((l, i) => text(ctx, l, L.x + 24, L.y + 94 + i * 11, 1, C.ink, 'left', false)); btn(ctx, 'next', L.x + 14, L.y + 164, 160, 32, 'ASK MORE', { scale: 1 }); btn(ctx, 'close', L.x + 184, L.y + 164, 160, 32, 'FAREWELL', { scale: 1 }); }
function drawTextScreen(ctx, L, s) { panel(ctx, L.x, L.y, L.w, L.h, 'parch'); serif(ctx, s.title, L.x + L.w / 2, L.y + 26, 20, C.ink, 'center', 1); wrap(s.body, 1, L.w - 60).forEach((l, i) => text(ctx, l, L.x + 30, L.y + 50 + i * 12, 1, C.ink, 'left', false)); }
function drawRest(ctx, L, s) {
  const w = 360, h = 230, x = U.W / 2 - w / 2, y = U.barTop / 2 - h / 2; panel(ctx, x, y, w, h); text(ctx, 'MAKE CAMP', x + w / 2, y + 12, 2, C.gold, 'center');
  const warn = canRest(); text(ctx, warn || ('Food: ' + G.food + '   Time: day ' + dayOf() + ', ' + ('0' + hourOf()).slice(-2) + ':00'), x + w / 2, y + 36, 1, warn ? '#ff8080' : C.dim, 'center');
  btn(ctx, 'rest8', x + 20, y + 60, w - 40, 36, 'REST 8 HOURS', { scale: 1, sub: 'heals fully, uses one ration', disabled: !!warn });
  btn(ctx, 'wait1', x + 20, y + 102, w - 40, 36, 'WAIT 1 HOUR', { scale: 1, sub: 'let the time pass', disabled: !!warn });
  btn(ctx, 'close', x + 20, y + 144, w - 40, 36, 'CANCEL', { scale: 1 });
  text(ctx, 'Resting outside is risky. Inns are safer.', x + w / 2, y + 196, 1, C.dim, 'center');
}
function drawMenu(ctx, L, s) {
  const w = 320, h = 290, x = U.W / 2 - w / 2, y = U.barTop / 2 - h / 2; panel(ctx, x, y, w, h); serif(ctx, 'HARROWMERE', x + w / 2, y + 22, 18, C.gold, 'center', 2);
  const rows = [['resume', 'RESUME'], ['save', 'SAVE GAME'], ['load', 'LOAD GAME', !hasSave()], ['sound', Snd.muted ? 'SOUND: OFF' : 'SOUND: ON'], ['quit', 'QUIT TO TITLE']];
  rows.forEach(([id, label, dis], i) => btn(ctx, id, x + 20, y + 44 + i * 42, w - 40, 36, label, { scale: 1, disabled: dis }));
  text(ctx, 'Day ' + dayOf() + '  Kills ' + G.kills + '  Gold ' + fmtNum(G.gold), x + w / 2, y + h - 22, 1, C.dim, 'center');
  if (s.msg) text(ctx, s.msg, x + w / 2, y + h - 36, 1, '#80ff90', 'center');
}
// ---- title & party creation ----
function drawTitle(ctx) {
  const W = U.W, H = U.H; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  serif(ctx, 'HARROWMERE', W / 2, H * 0.26, Math.min(64, W / 10), C.gold, 'center', 8); ctx.fillStyle = 'rgba(212,169,76,0.5)'; ctx.fillRect(W / 2 - 170, H * 0.26 + 40, 340, 1);
  serif(ctx, 'a top-down tale of Might and Magic', W / 2, H * 0.26 + 58, 15, C.text, 'center', 1);
  const by = H * 0.52; btn(ctx, 'newgame', W / 2 - 110, by, 220, 40, 'NEW GAME', { scale: 2 }); if (hasSave()) btn(ctx, 'continue', W / 2 - 110, by + 48, 220, 40, 'CONTINUE', { scale: 2 });
  btn(ctx, 'watch', W / 2 - 110, by + (hasSave() ? 96 : 48), 220, 40, 'WATCH CLAUDE PLAY', { scale: 1, sub: 'a full walkthrough, hands off' });
  text(ctx, 'Dungeon tiles by RunninBlood. Creature sprites from the Basic, Premium and Supporter packs.', W / 2, H - U.ins.b - 28, 1, C.dim, 'center');
  text(ctx, I.isTouch ? 'Play in landscape. Add to your Home Screen for full screen.' : 'WASD to move, SPACE to attack, F to cast, C for the party, E to interact.', W / 2, H - U.ins.b - 16, 1, C.dim, 'center');
}
function drawCreate(ctx) {
  const W = U.W, H = U.H; ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
  serif(ctx, 'CREATE YOUR PARTY', W / 2, U.ins.t + 22, 20, C.gold, 'center', 3);
  const cls = Object.keys(CLASSES), cw = Math.min(210, (W - U.ins.l - U.ins.r - 40) / 4), x0 = W / 2 - cw * 2, y0 = U.ins.t + 44, ch = H - y0 - U.ins.b - 60;
  G.create.forEach((c, i) => {
    const x = x0 + i * cw + 4, w = cw - 8; panel(ctx, x, y0, w, ch, 'dark');
    const im = creatureCanvas(CLASSES[c.cls].sprite, Math.floor(G.playTime * 4 + i) % 4, 4); ctx.drawImage(im, x + w / 2 - 32, y0 + 10, 64, 64);
    btn(ctx, 'cls_prev' + i, x + 8, y0 + 82, 28, 26, '<', { scale: 1 }); btn(ctx, 'cls_next' + i, x + w - 36, y0 + 82, 28, 26, '>', { scale: 1 }); text(ctx, c.cls, x + w / 2, y0 + 90, 2, C.gold, 'center');
    btn(ctx, 'name' + i, x + 8, y0 + 114, w - 16, 26, c.name + (G.editing === i ? '_' : ''), { scale: 1, sub: I.isTouch ? 'tap for another name' : 'click to type a name' });
    wrap(CLASSES[c.cls].desc, 1, w - 16).forEach((l, k) => text(ctx, l, x + 8, y0 + 148 + k * 11, 1, C.text));
    const st = CLASSES[c.cls].stats; STATS.forEach((s, k) => { if (y0 + 196 + k * 11 > y0 + ch - 14) return; text(ctx, STAT_NAMES[s], x + 8, y0 + 196 + k * 11, 1, C.dim); text(ctx, st[s], x + w - 10, y0 + 196 + k * 11, 1, C.text, 'right'); });
  });
  btn(ctx, 'begin', W / 2 - 110, H - U.ins.b - 50, 220, 40, 'BEGIN', { scale: 2 }); btn(ctx, 'backtitle', W / 2 - 300, H - U.ins.b - 50, 150, 40, 'BACK', { scale: 1 }); btn(ctx, 'defparty', W / 2 + 150, H - U.ins.b - 50, 150, 40, 'CLASSIC PARTY', { scale: 1 });
}
// ---- screen input ----
function screenInput() {
  const s = G.screen; if (!s) return;
  if (I.take('menu') || I.take('close')) { if (s.kind === 'npc' && s.n) { } closeScreen(); return; }
  for (let i = 0; i < 4; i++) { if (I.take('mtab' + i) || I.take('sel' + (i + 1))) { G.sel = i; s.selItem = undefined; } if (I.take('port' + i)) G.sel = i; }
  if (I.take('nextchar')) G.sel = (G.sel + 1) % 4;
  for (let i = 0; i < 4; i++) if (I.take('tab' + i)) { s.tab = i; s.scroll = 0; s.selItem = undefined; }
  const m = G.party[G.sel];
  if (s.kind === 'char' || s.kind === 'spells') {
    for (const sl of ['weapon', 'armor', 'shield', 'helm', 'boots', 'ring', 'amulet']) if (I.take('uneq' + sl)) unequip(m, sl);
    for (const k of Object.keys(m.skills)) if (I.take('sk_' + k)) { if (raiseSkill(m, k)) Snd.play('buy'); }
    G.inv.forEach((it, i) => { if (I.take('inv' + i)) s.selItem = i; });
    if (I.take('equip') && G.inv[s.selItem]) { const it = G.inv[s.selItem]; if (canUse(m, it)) { G.inv.splice(s.selItem, 1); equipItem(m, it); s.selItem = undefined; Snd.play('buy'); } }
    if (I.take('use') && G.inv[s.selItem]) { useItem(G.inv[s.selItem], m); if (!G.inv[s.selItem]) s.selItem = undefined; }
    if (I.take('drop') && G.inv[s.selItem]) { G.inv.splice(s.selItem, 1); s.selItem = undefined; }
    for (const id of m.spells) if (I.take('cast_' + id)) { closeScreen(); castSpell(m, id); return; }
  }
  if (s.kind === 'quests') for (const id in G.quests) if (I.take('q_' + id)) s.selQ = id;
  if (s.kind === 'shop') {
    const b = s.b; b.stock.forEach((id, i) => { if (I.take('buy' + i)) { const it = makeItem(id); const p = buyPrice(it); if (G.gold >= p) { G.gold -= p; addInv(it); Snd.play('buy'); log('Bought ' + ITEMS[id].name + ' for ' + p + ' gold.'); } else log('Not enough gold.'); } });
    G.inv.forEach((it, i) => { if (I.take('sell' + i)) { const p = sellPrice(it); G.gold += p; G.inv.splice(i, 1); Snd.play('coin'); log('Sold ' + itemName(it) + ' for ' + p + ' gold.'); } });
  }
  if (s.kind === 'temple') {
    const lv = G.party.reduce((a, p) => a + p.lvl, 0);
    if (I.take('heal')) { if (G.gold >= 10 * lv) { G.gold -= 10 * lv; for (const p of G.party) if (!p.cond.dead) { p.hp = maxHp(p); p.cond.unconscious = false; } log('The party is healed.'); Snd.play('rest'); } else log('Not enough gold.'); }
    if (I.take('cure')) { if (G.gold >= 15 * lv) { G.gold -= 15 * lv; for (const p of G.party) { p.cond.poison = false; p.cond.weak = false; } log('Ailments cured.'); Snd.play('rest'); } else log('Not enough gold.'); }
    if (I.take('raise')) { if (G.gold >= 150 * lv) { G.gold -= 150 * lv; for (const p of G.party) if (p.cond.dead) { p.cond = {}; p.hp = maxHp(p); } log('The dead rise, whole again.'); Snd.play('level'); } else log('Not enough gold.'); }
    if (I.take('donate')) { if (G.gold >= 100) { G.gold -= 100; addBuff('bless', 24, 3); log('The Dawn blesses your party.'); Snd.play('quest'); } else log('Not enough gold.'); }
  }
  if (s.kind === 'inn') {
    if (I.take('innrest')) { if (G.gold >= 30) { G.gold -= 30; restParty(8, true); Snd.play('rest'); } else log('Not enough gold.'); }
    if (I.take('buyfood')) { if (G.gold >= 25) { G.gold -= 25; G.food += 5; Snd.play('buy'); log('Five rations bought.'); } else log('Not enough gold.'); }
    if (I.take('rumour')) { if (G.gold >= 5) { G.gold -= 5; s.rumour = pick(RUMOURS); Snd.play('coin'); } else log('Not enough gold.'); }
  }
  if (s.kind === 'trainer' || s.kind === 'guild') {
    if (I.take('train')) { if (train(m)) Snd.play('level'); }
    for (const k in SKILLS) { if (I.take('learn_' + k)) { const price = SKILLS[k].kind === 'magic' ? 300 : 200; if (G.gold >= price) { G.gold -= price; m.skills[k] = 1; Snd.play('buy'); log(m.name + ' learns ' + k + '.'); } else log('Not enough gold.'); } for (const want of [4, 8]) if (I.take('promo_' + k + '_' + want)) { const price = SKILLS[k].kind === 'magic' ? (want === 4 ? 600 : 3000) : (want === 4 ? 500 : 2500); if (G.gold >= price) { G.gold -= price; m.promo = m.promo || {}; m.promo[k] = want; Snd.play('level'); log(m.name + ' is now ' + (want === 4 ? 'Expert' : 'Master') + ' in ' + k + '.'); } else log('Not enough gold.'); } }
    for (const id in SPELLS) if (I.take('spell_' + id)) { const sp = SPELLS[id]; if (G.gold >= sp.price) { G.gold -= sp.price; m.spells.push(id); Snd.play('buy'); log(m.name + ' learns ' + sp.name + '.'); } else log('Not enough gold.'); }
  }
  if (s.kind === 'npc' && I.take('next')) s.line++;
  if (s.kind === 'rest') { if (I.take('rest8')) { restParty(8); closeScreen(); Snd.play('rest'); G.fadeT = 1; } if (I.take('wait1')) { G.time += 60; closeScreen(); } }
  if (s.kind === 'menu') { if (I.take('resume')) closeScreen(); if (I.take('save')) { s.msg = saveGame() ? 'Saved.' : 'Save failed.'; } if (I.take('load')) { if (loadGame()) closeScreen(); } if (I.take('sound')) { Snd.muted = !Snd.muted; if (Snd.master) Snd.master.gain.value = Snd.muted ? 0 : 0.45; if (Snd.muted) { Snd.stopMusic(); Snd.musicKind = null; } } if (I.take('quit')) { saveGame(); closeScreen(); G.mode = 'title'; } }
  for (const qid in QUESTS) { if (I.take('qaccept_' + qid)) { startQuest(qid); openText(QUESTS[qid].name, QUESTS[qid].giver + ': "' + QUESTS[qid].text + '"'); Snd.play('quest'); } if (I.take('qturn_' + qid)) { if (completeQuest(qid)) Snd.play('level'); else openText(QUESTS[qid].name, QUESTS[qid].giver + ': "' + QUESTS[qid].text + '"  (' + questProgress(qid) + ')'); } }
}
