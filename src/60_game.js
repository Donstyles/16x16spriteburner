// ===== Game state, map compile, party, player =====
const PARTY_DEFS = [
  { id: 'knight', name: 'Roderick', cls: 'Knight', spr: 'SkilledBattlemage', hp: 120, mt: 14, en: 14, it: 6, sp: 9, atk: 'melee', base: 11, rec: 1.3, armor: 0.2, ability: 'bulwark', color: '#d8b36a' },
  { id: 'archer', name: 'Sable', cls: 'Archer', spr: 'SilentRanger', hp: 85, mt: 11, en: 10, it: 8, sp: 14, atk: 'ranged', proj: 'arrow', base: 8, rec: 0.85, ability: 'volley', color: '#8ccf6a' },
  { id: 'cleric', name: 'Mira', cls: 'Cleric', spr: 'ExpertDruid', hp: 95, mt: 9, en: 11, it: 12, sp: 10, atk: 'melee', base: 7, rec: 1.4, ability: 'heal', color: '#9ad0f0' },
  { id: 'sorc', name: 'Vesper', cls: 'Sorcerer', spr: 'FlameMagus', hp: 70, mt: 6, en: 8, it: 16, sp: 11, atk: 'ranged', proj: 'spark', base: 5, rec: 1.0, ability: 'firebolt', color: '#e08a6a' },
];
const ABILITIES = {
  bulwark: { name: 'Bulwark', desc: 'Shields up: the party takes 70% less damage for 4s.', stam: 30, cd: 12, icon: 'sword' },
  volley: { name: 'Volley', desc: 'Loose five arrows in quick succession.', sp: 10, cd: 8, icon: 'arrow' },
  heal: { name: 'Heal', desc: 'Mend the wounds of every living companion.', sp: 15, cd: 6, icon: 'heart' },
  firebolt: { name: 'Fire Bolt', desc: 'Hurl a bolt of flame that bursts on impact.', sp: 12, cd: 3, icon: 'firebolt' },
};
const STAT_NAMES = { mt: 'Might', en: 'Endurance', it: 'Intellect', sp: 'Speed' };
const STAT_DESC = { mt: 'Weapon damage', en: 'Max HP & stamina', it: 'Spell power & SP', sp: 'Recovery & dodge' };
const SAVE_KEY = 'ashen_mandate_v1';
const S = {};
let MAP = null;

function levelCost(lv) { return Math.round(80 * Math.pow(lv, 1.55)); }
function makeMember(d) {
  return { id: d.id, name: d.name, cls: d.cls, spr: d.spr, level: 1, mt: d.mt, en: d.en, it: d.it, sp: d.sp, hp: d.hp, hpMax: d.hp, spMax: 20 + d.it * 2, spts: 20 + d.it * 2, rec: 0, cd: 0, bounce: 0, hurt: 0, dead: false, def: d, dmgPop: null };
}
function memberMaxHp(m) { return Math.round(m.def.hp + (m.en - m.def.en) * 8 + (m.level - 1) * 4 + (S.hpBonus || 0)); }
function memberMaxSp(m) { return Math.round(20 + m.it * 2.5 + (m.level - 1) * 2); }
function recalcMember(m) { const h = memberMaxHp(m), s = memberMaxSp(m); m.hp = Math.min(m.hp + (h - m.hpMax), h); m.hpMax = h; m.spts = Math.min(m.spts + (s - m.spMax), s); m.spMax = s; }

function newGame() {
  Object.assign(S, {
    mode: 'play', t: 0, party: PARTY_DEFS.map(makeMember), souls: 0, stam: 100, stamMax: 100, estus: 4, estusMax: 4, weaponLvl: 0, hpBonus: 0,
    items: {}, flags: { boss: {}, chest: {}, gate: {}, item: {}, bonfire: {}, unique: {}, door: {}, lore: {} },
    bonfire: null, bloodstain: null, pitch: 0, bulwark: 0, chill: 0, venom: 0, iframes: 0, dodge: null, shake: 0, flash: 0, hurtT: 0, deathT: 0,
    msgs: [], center: null, itemCard: null, boss: null, areaShown: -1, lastZone: -1, playTime: 0, bossKills: 0, deaths: 0, kills: 0, menu: null, ending: 0, bob: 0, walkT: 0,
  });
  const st = findStart();
  S.px = st.x + 0.5; S.py = st.y + 0.5; S.pa = Math.PI / 2;
  buildEntities();
  showCenter('ASHEN MANDATE', 'Four awaken in the dark', 4, 'area');
  message('You awaken in a cell beneath the Undercroft.');
}
function findStart() { const g = WORLD.grid; for (let i = 0; i < g.length; i++) if (g[i] === 'P') return { x: i % MW, y: (i / MW) | 0 }; return { x: 3, y: 3 }; }

// ---- map compile ----
function compileMap() {
  buildWorldGrid();
  const g = WORLD.grid, zo = WORLD.zoneOf, n = MW * MH;
  const map = { w: MW, h: MH, type: new Uint8Array(n), wall: new Uint16Array(n), floorTex: new Uint16Array(n), ceilTex: new Uint16Array(n), light: new Float32Array(n), doors: [], doorIdx: new Int16Array(n).fill(-1), zone: zo, slow: new Uint8Array(n), grid: g, explored: new Uint8Array(n) };
  const isFloorC = c => c !== ' ' && c !== '#';
  for (let i = 0; i < n; i++) {
    const c = g[i], x = i % MW, y = (i / MW) | 0, zone = ZONES[zo[i]], fs = FLOOR_SETS[zone.floors];
    const h = hash2(x * 7 + 3, y * 13 + 1);
    if (!isFloorC(c)) {
      map.type[i] = 1;
      let v = 0; if (h < 0.08) v = 1; else if (h < 0.15) v = 2;
      map.wall[i] = wallTexId(zone.theme, v);
      map.floorTex[i] = fs.floor[0]; map.ceilTex[i] = fs.ceil[0];
      continue;
    }
    map.floorTex[i] = fs.floor[(h * fs.floor.length) | 0]; map.ceilTex[i] = fs.ceil[(hash2(x, y * 3) * fs.ceil.length) | 0];
    if (c === '~') { map.type[i] = 3; map.floorTex[i] = FLOOR_SETS.lava.floor[(h * 4) | 0]; }
    else if (c === 'w') { map.slow[i] = 1; map.floorTex[i] = FLOOR_SETS.water.floor[(h * 4) | 0]; }
    if ('DKGF'.includes(c)) {
      map.type[i] = 2;
      const wallN = !isFloorC(g[i - MW]), wallS = !isFloorC(g[i + MW]);
      const orient = (wallN && wallS) ? 0 : 1;
      const d = { x, y, orient, open: 0, kind: c, tex: wallTexId(zone.theme, c === 'G' ? 4 : 3), fog: c === 'F', locked: c === 'K', gate: c === 'G', target: 0, timer: 0, id: x + ',' + y };
      map.doorIdx[i] = map.doors.length; map.doors.push(d);
    }
  }
  // lighting: BFS from sources along floor cells
  const amb = new Float32Array(n); for (let i = 0; i < n; i++) amb[i] = ZONES[zo[i]].ambient;
  const sources = [];
  for (const o of WORLD.objects) {
    if (o.type === 'torch') sources.push({ x: o.x | 0, y: o.y | 0, p: 0.75, r: 5 });
    else if (o.type === 'brazier') sources.push({ x: o.x | 0, y: o.y | 0, p: 0.9, r: 6 });
  }
  for (let i = 0; i < n; i++) { if (g[i] === 'b') sources.push({ x: i % MW, y: (i / MW) | 0, p: 1.0, r: 7 }); if (g[i] === '~') sources.push({ x: i % MW, y: (i / MW) | 0, p: 0.55, r: 3 }); }
  const passable = i => map.type[i] !== 1;
  for (const s of sources) {
    // make sure the source cell is passable (torches on walls light the neighbouring floor)
    let sx = s.x, sy = s.y;
    if (!passable(sy * MW + sx)) { let f = null; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = sx + dx, ny = sy + dy; if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && passable(ny * MW + nx)) { f = [nx, ny]; break; } } if (!f) continue; sx = f[0]; sy = f[1]; }
    const dist = new Map(); const q = [[sx, sy, 0]]; dist.set(sy * MW + sx, 0);
    while (q.length) {
      const [x, y, d] = q.shift(); const i = y * MW + x;
      const v = s.p * Math.max(0, 1 - d / s.r) ** 1.3;
      if (v > map.light[i]) map.light[i] = v;
      if (d >= s.r) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const j = ny * MW + nx; if (!passable(j) || dist.has(j)) continue; dist.set(j, d + 1); q.push([nx, ny, d + 1]); }
    }
  }
  for (let i = 0; i < n; i++) map.light[i] = Math.min(1, map.light[i] + amb[i]);
  MAP = map;
  return map;
}
const cellAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? 1 : MAP.type[(y | 0) * MW + (x | 0)];
function cellBlocked(x, y, forEnemy) {
  if (x < 0 || y < 0 || x >= MW || y >= MH) return true;
  const i = (y | 0) * MW + (x | 0), t = MAP.type[i];
  if (t === 1 || t === 3) return true;
  if (t === 2) { const d = MAP.doors[MAP.doorIdx[i]]; if (d.fog) return !forEnemy ? !(S.fogPass === d) : true; return d.open < 0.85; }
  return false;
}
function moveCircle(ent, dx, dy, r, forEnemy) {
  // axis-separated slide against the grid
  let nx = ent.x + dx;
  if (!(cellBlocked(nx + r, ent.y - r * 0.7, forEnemy) || cellBlocked(nx + r, ent.y + r * 0.7, forEnemy) || cellBlocked(nx - r, ent.y - r * 0.7, forEnemy) || cellBlocked(nx - r, ent.y + r * 0.7, forEnemy))) ent.x = nx; else ent.blocked = true;
  let ny = ent.y + dy;
  if (!(cellBlocked(ent.x - r * 0.7, ny + r, forEnemy) || cellBlocked(ent.x + r * 0.7, ny + r, forEnemy) || cellBlocked(ent.x - r * 0.7, ny - r, forEnemy) || cellBlocked(ent.x + r * 0.7, ny - r, forEnemy))) ent.y = ny; else ent.blocked = true;
}
function hasLOS(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  if (len < 0.01) return true;
  const steps = Math.ceil(len * 4), sx = dx / steps, sy = dy / steps;
  let x = x0, y = y0;
  for (let i = 0; i < steps; i++) { x += sx; y += sy; const t = cellAt(x, y); if (t === 1) return false; if (t === 2) { const d = MAP.doors[MAP.doorIdx[(y | 0) * MW + (x | 0)]]; if (d.open < 0.5) return false; } }
  return true;
}
function zoneAt(x, y) { return ZONES[MAP.zone[clamp(y | 0, 0, MH - 1) * MW + clamp(x | 0, 0, MW - 1)]]; }

// ---- entities ----
function buildEntities() {
  S.objects = []; S.enemies = []; S.projectiles = []; S.fx = []; S.pickups = []; S.bonfires = []; S.interact = [];
  const g = WORLD.grid;
  for (let i = 0; i < g.length; i++) {
    const c = g[i], x = i % MW, y = (i / MW) | 0;
    if (c === 'b') { const id = x + ',' + y; const b = { type: 'bonfire', x: x + 0.5, y: y + 0.5, id, lit: !!S.flags.bonfire[id], zone: zoneAt(x, y), name: zoneAt(x, y).name }; S.bonfires.push(b); S.objects.push({ spr: getSprite(b.lit ? 'bonfire' : 'bonfire_unlit'), x: b.x, y: b.y, w: 0.7, h: 1.05, z: 0, frame: 0, emissive: b.lit, solid: 0.35, ref: b, anim: Math.random() * 10 }); S.interact.push(b); }
    if (c === '?') { const id = x + ',' + y; const l = { type: 'lore', x: x + 0.5, y: y + 0.5, id, text: WORLD.lore[id] }; S.objects.push({ spr: getSprite('sign_text'), x: l.x, y: l.y, w: 0.55, h: 0.55, z: 0, frame: 0, solid: 0.25, ref: l }); S.interact.push(l); }
  }
  for (const o of WORLD.objects) {
    if (o.type === 'deco') { const spr = getSprite(o.spr); const tall = spr.frames[0].h > 16; S.objects.push({ spr, x: o.x, y: o.y, w: spr.frames[0].w / 16 * 0.7, h: tall ? 1.3 : 0.7, z: 0, frame: 0, solid: o.spr === 'bones' || o.spr === 'skull' || o.spr === 'skull_dark' ? 0 : 0.3, anim: Math.random() * 5 }); }
    else if (o.type === 'breakable') { const id = 'p' + o.x + ',' + o.y; if (S.flags.item[id]) continue; const spr = getSprite(o.spr); const b = { type: 'breakable', x: o.x, y: o.y, id, souls: 15 + ((o.zone + 1) * 25) * (o.spr === 'pot_gold' ? 3 : 1) }; S.objects.push({ spr, x: o.x, y: o.y, w: 0.6, h: 0.6, z: 0, frame: 0, solid: 0.3, ref: b }); S.interact.push(b); }
    else if (o.type === 'torch') { const t = placeOnWall(o.x | 0, o.y | 0); if (t) S.objects.push({ spr: getSprite('torch'), x: t.x, y: t.y, z: 0.95, w: 0.22, h: 0.5, frame: 0, emissive: true, anim: Math.random() * 5 }); }
    else if (o.type === 'brazier') { S.objects.push({ spr: getSprite(o.spr), x: o.x, y: o.y, w: 0.7, h: 0.7, z: 0, frame: 0, emissive: true, solid: 0.33 }); const fl = { brazier_red: 'fire', brazier_green: 'greenflame', brazier_purple: 'purpleflame', brazier_blue: 'blueflame' }[o.spr]; if (fl) S.objects.push({ spr: getSprite(fl), x: o.x, y: o.y, w: 0.42, h: 0.5, z: 0.52, frame: 0, emissive: true, anim: Math.random() * 5 }); }
    else if (o.type === 'chest') { const id = 'c' + o.x + ',' + o.y; const opened = !!S.flags.chest[id]; const ch = { type: 'chest', x: o.x, y: o.y, id, loot: o.loot, big: o.big, opened }; const spr = getSprite(o.big ? (opened ? 'bigchest_open' : 'bigchest') : (opened ? 'chest_open' : 'chest')); const ob = { spr, x: o.x, y: o.y, w: o.big ? 0.9 : 0.65, h: o.big ? 0.9 : 0.65, z: 0, frame: 0, solid: 0.35, ref: ch }; ch.obj = ob; S.objects.push(ob); S.interact.push(ch); }
    else if (o.type === 'item') { const id = 'i' + o.x + ',' + o.y; if (S.flags.item[id]) continue; S.pickups.push({ x: o.x, y: o.y, id, item: o.item }); }
    else if (o.type === 'npc') { const np = { type: 'npc', x: o.x, y: o.y, npc: o.npc, name: 'The Keeper' }; S.objects.push({ spr: getSprite('WiseWizard'), x: o.x, y: o.y, w: 0.9, h: 0.9, z: 0, frame: 0, solid: 0.35, ref: np, anim: Math.random() * 5 }); S.interact.push(np); }
    else if (o.type === 'lever') { const id = 'l' + o.x + ',' + o.y; const t = placeOnWall(o.x | 0, o.y | 0); const lv = { type: 'lever', x: t ? t.x : o.x, y: t ? t.y : o.y, id, gate: o.gate, used: !!S.flags.gate[o.gate[0] + ',' + o.gate[1]] }; S.objects.push({ spr: getSprite('lantern'), x: lv.x, y: lv.y, z: 0.7, w: 0.3, h: 0.4, frame: 0, ref: lv }); S.interact.push(lv); }
    else if (o.type === 'throne') { S.objects.push({ spr: getSprite('alcove_statue'), x: o.x, y: o.y, w: 0.9, h: 1.6, z: 0, frame: 0, solid: 0.4 }); }
  }
  // gates already opened stay open
  for (const d of MAP.doors) { if (d.gate && S.flags.gate[d.id]) { d.open = 1; d.target = 1; d.unlocked = true; } if (d.locked && S.flags.door[d.id]) d.locked = false; if (d.fog && S.flags.boss[d.id]) d.removed = true; }
  spawnEnemies(true);
}
// find the wall face next to a cell for wall-mounted props
function placeOnWall(cx, cy) {
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const t = cellAt(cx, cy);
  if (t === 1) { for (const [dx, dy] of dirs) { if (cellAt(cx + dx, cy + dy) === 0) return { x: cx + 0.5 + dx * 0.62, y: cy + 0.5 + dy * 0.62 }; } return null; }
  for (const [dx, dy] of dirs) { if (cellAt(cx + dx, cy + dy) === 1) return { x: cx + 0.5 + dx * 0.38, y: cy + 0.5 + dy * 0.38 }; }
  return { x: cx + 0.5, y: cy + 0.5 };
}

// ---- messages & UI state ----
function message(t) { const last = S.msgs[S.msgs.length - 1]; if (last && last.t === t) { last.time = 6; return; } S.msgs.push({ t, time: 6 }); if (S.msgs.length > 4) S.msgs.shift(); }
function showCenter(text, sub, dur, kind) { S.center = { text, sub, t: dur, dur, kind }; }
function showItem(item, extra) { S.itemCard = { item, t: 4.5, extra }; }

// ---- player update ----
function updatePlayer(dt) {
  const inp = Input;
  // turning
  let turn = inp.turn + inp.turnKey * 2.4 * dt;
  S.pa += turn; S.pitch = clamp(S.pitch + inp.pitchD, -R.VH * 0.3, R.VH * 0.3);
  if (!inp.look && !inp.pointerLocked) S.pitch *= Math.pow(0.02, dt); // recentre
  // dodge
  if (S.dodge) {
    S.dodge.t -= dt;
    const e = { x: S.px, y: S.py }; moveCircle(e, S.dodge.dx * dt, S.dodge.dy * dt, 0.26); S.px = e.x; S.py = e.y;
    if (S.dodge.t <= 0) S.dodge = null;
  } else {
    let mx = inp.mx, my = inp.my;
    const spd = 3.1 * (S.chill > 0 ? 0.55 : 1) * (MAP.slow[(S.py | 0) * MW + (S.px | 0)] ? 0.6 : 1);
    const ca = Math.cos(S.pa), sa = Math.sin(S.pa);
    const vx = (ca * my - sa * mx) * spd, vy = (sa * my + ca * mx) * spd;
    if (mx || my) {
      const e = { x: S.px, y: S.py }; moveCircle(e, vx * dt, vy * dt, 0.26); S.px = e.x; S.py = e.y;
      S.walkT += dt * Math.hypot(mx, my); S.bob = Math.sin(S.walkT * 9) * 1.6;
      if (((S.walkT * 9 / Math.PI) | 0) !== S.lastStep) { S.lastStep = (S.walkT * 9 / Math.PI) | 0; Snd.sfx('step'); }
    } else S.bob *= 0.8;
    if (inp.consume('dodge') && S.stam >= 22) {
      let dx, dy; if (mx || my) { dx = vx / spd; dy = vy / spd; } else { dx = -ca; dy = -sa; }
      const l = Math.hypot(dx, dy) || 1;
      S.dodge = { t: 0.28, dx: dx / l * 8.5, dy: dy / l * 8.5 }; S.iframes = 0.42; S.stam -= 22; Snd.sfx('dodge');
    }
  }
  // push out of solid objects and enemies
  for (const o of S.objects) { if (!o.solid) continue; pushApart(S, o, 0.26 + o.solid, 1); }
  for (const e of S.enemies) { if (e.dead) continue; pushApart(S, e, 0.26 + e.r, 1); }
  S.px = clamp(S.px, 0.3, MW - 0.3); S.py = clamp(S.py, 0.3, MH - 0.3);
  // field name
  const z = zoneAt(S.px, S.py);
  if (z.idx !== S.lastZone) { S.lastZone = z.idx; S.areaT = S.areaT || {}; if (!S.boss && (S.t - (S.areaT[z.idx] || -999) > 90)) { showCenter(z.name.toUpperCase(), null, 3.5, 'area'); S.areaT[z.idx] = S.t; } }
  MAP.explored[(S.py | 0) * MW + (S.px | 0)] = 1;
  // doors: auto open for the player when near
  for (const d of MAP.doors) {
    if (d.removed) continue;
    const dx = d.x + 0.5 - S.px, dy = d.y + 0.5 - S.py, dd = dx * dx + dy * dy;
    let want = 0;
    if (!d.locked && !d.fog && (!d.gate || d.unlocked) && dd < 1.6) want = 1;
    for (const e of S.enemies) if (!e.dead && !d.locked && !d.fog && (!d.gate || d.unlocked) && dist2(e.x, e.y, d.x + 0.5, d.y + 0.5) < 1.2) want = 1;
    if (d.gate && d.unlocked) want = 1;
    if (want !== d.target) { d.target = want; if (want) Snd.sfx('door'); }
    if (d.open < d.target) d.open = Math.min(1, d.open + dt * 1.6); else if (d.open > d.target) { if (dd > 1.0) d.open = Math.max(0, d.open - dt * 1.2); }
  }
}
function pushApart(a, b, minD, weightA) {
  const dx = a.px !== undefined ? a.px - b.x : a.x - b.x, dy = a.px !== undefined ? a.py - b.y : a.y - b.y;
  const d2 = dx * dx + dy * dy; if (d2 >= minD * minD || d2 < 1e-6) return;
  const d = Math.sqrt(d2), push = (minD - d) * weightA, nx = dx / d, ny = dy / d;
  if (a.px !== undefined) { a.px += nx * push; a.py += ny * push; } else { a.x += nx * push; a.y += ny * push; }
}
// ---- interaction ----
function findFocus() {
  let best = null, bestScore = 1e9;
  const ca = Math.cos(S.pa), sa = Math.sin(S.pa);
  for (const it of S.interact) {
    if (it.opened && it.type === 'chest') continue;
    if (it.type === 'lever' && it.used) continue;
    const dx = it.x - S.px, dy = it.y - S.py, d = Math.hypot(dx, dy);
    if (d > 1.65) continue;
    const dot = (dx * ca + dy * sa) / (d || 1);
    if (dot < 0.55 && d > 0.6) continue;
    const score = d - dot * 0.5; if (score < bestScore) { bestScore = score; best = it; }
  }
  for (const dr of MAP.doors) {
    if (dr.removed) continue;
    if (!(dr.locked || dr.fog || (dr.gate && !dr.unlocked))) continue;
    const dx = dr.x + 0.5 - S.px, dy = dr.y + 0.5 - S.py, d = Math.hypot(dx, dy);
    if (d > 1.5) continue;
    const dot = (dx * ca + dy * sa) / (d || 1); if (dot < 0.6) continue;
    const score = d - dot * 0.5; if (score < bestScore) { bestScore = score; best = { type: 'door', door: dr, x: dr.x + 0.5, y: dr.y + 0.5 }; }
  }
  return best;
}
function focusLabel(f) {
  if (!f) return null;
  switch (f.type) {
    case 'bonfire': return f.lit ? 'Rest at bonfire' : 'Light bonfire';
    case 'chest': return f.opened ? null : (f.big ? 'Open the great chest' : 'Open chest');
    case 'npc': return 'Talk to the Keeper';
    case 'lever': return 'Pull lever';
    case 'lore': return 'Read';
    case 'breakable': return 'Smash';
    case 'door': return f.door.fog ? 'Traverse the white light' : f.door.locked ? 'Open (locked)' : 'Gate is barred';
  }
  return null;
}
function doInteract(f) {
  if (!f) return;
  switch (f.type) {
    case 'bonfire': {
      if (!f.lit) { f.lit = true; S.flags.bonfire[f.id] = 1; const o = S.objects.find(o => o.ref === f); o.spr = getSprite('bonfire'); o.emissive = true; showCenter('BONFIRE LIT', null, 3, 'bonfire'); Snd.sfx('bonfire'); S.bonfire = f.id; restAtBonfire(f, true); }
      else { S.menu = { kind: 'bonfire', bonfire: f, sel: 0 }; S.mode = 'menu'; Snd.sfx('ui'); }
      break;
    }
    case 'chest': if (f.mimic) { const e = f.mimic; wakeEnemy(e); hitParty(rollEnemyDmg(e) * 0.8, e, { shake: 0.4 }); } else openChest(f); break;
    case 'npc': S.menu = { kind: 'keeper', line: 0, sel: 0 }; S.mode = 'menu'; Snd.sfx('ui'); break;
    case 'lever': { f.used = true; const d = MAP.doors.find(d => d.x === f.gate[0] && d.y === f.gate[1]); if (d) { d.unlocked = true; d.target = 1; S.flags.gate[d.id] = 1; } message('A gate opened somewhere.'); Snd.sfx('lever'); saveGame(); break; }
    case 'lore': { S.menu = { kind: 'lore', text: f.text }; S.mode = 'menu'; S.flags.lore[f.id] = 1; Snd.sfx('ui'); break; }
    case 'breakable': { S.flags.item[f.id] = 1; S.objects = S.objects.filter(o => o.ref !== f); S.interact = S.interact.filter(i => i !== f); gainSouls(f.souls, f.x, f.y); Snd.sfx('break'); burst(f.x, f.y, 8, '#b08a60'); break; }
    case 'door': {
      const d = f.door;
      if (d.fog) { traverseFog(d); }
      else if (d.locked) {
        const z = zoneAt(d.x, d.y); const key = d.y < 28 ? 'key_reliquary' : 'key_brass';
        if (S.items[key]) { d.locked = false; S.flags.door[d.id] = 1; message('Unlocked with the ' + ITEM_DEFS[key].name + '.'); Snd.sfx('unlock'); saveGame(); }
        else { message('Locked. It needs the ' + ITEM_DEFS[key].name + '.'); Snd.sfx('locked'); }
      } else message('Barred from the other side.');
      break;
    }
  }
}
function openChest(ch) {
  ch.opened = true; S.flags.chest[ch.id] = 1; ch.obj.spr = getSprite(ch.big ? 'bigchest_open' : 'chest_open'); Snd.sfx('chest');
  if (ch.loot.souls) { gainSouls(ch.loot.souls, ch.x, ch.y); message('Found ' + fmtNum(ch.loot.souls) + ' souls.'); }
  if (ch.loot.item) giveItem(ch.loot.item);
  saveGame();
}
function giveItem(id) {
  const def = ITEM_DEFS[id];
  S.items[id] = (S.items[id] || 0) + 1;
  showItem(id); Snd.sfx('item');
  if (def.use === 'estus+') { S.estusMax++; S.estus = S.estusMax; message('Estus Flask strengthened (' + S.estusMax + ').'); }
  else if (def.use === 'hp+') { S.hpBonus += 12; S.party.forEach(recalcMember); message('Max HP raised for all.'); }
  else if (def.use === 'weapon+') { S.weaponLvl++; message('Weapons reinforced +' + S.weaponLvl + '.'); }
  else if (def.stat) { S.party.forEach(m => { m[def.stat]++; recalcMember(m); }); message('+1 ' + STAT_NAMES[def.stat] + ' for all.'); }
  else if (def.souls) { gainSouls(def.souls, S.px, S.py); }
  else message('Acquired ' + def.name + '.');
}
function traverseFog(d) {
  S.fogPass = d; S.fade = { t: 0.8, dur: 0.8, color: '#ffffff' };
  const ox = d.orient === 0 ? Math.sign(S.px - d.x - 0.5) : 0, oy = d.orient === 1 ? Math.sign(S.py - d.y - 0.5) : 0;
  S.px = d.x + 0.5 - ox * 1.0; S.py = d.y + 0.5 - oy * 1.0;
  S.fogPass = null;
  Snd.sfx('fog');
  const boss = S.enemies.find(e => e.boss && !e.dead && e.gates.some(g => g[0] === d.x && g[1] === d.y));
  if (boss) wakeBoss(boss);
}
function gainSouls(n, x, y) { n = Math.round(n); S.souls += n; S.soulPop = { n, t: 1.5 }; if (x !== undefined) soulBurst(x, y, Math.min(14, 3 + n / 40)); }

// ---- bonfire / rest / death ----
function restAtBonfire(b, first) {
  S.bonfire = b.id;
  for (const m of S.party) { m.dead = false; recalcMember(m); m.hp = m.hpMax; m.spts = m.spMax; m.rec = 0; m.cd = 0; }
  S.estus = S.estusMax; S.stam = S.stamMax; S.chill = 0; S.venom = 0; S.bulwark = 0;
  spawnEnemies(false);
  if (!first) { Snd.sfx('rest'); message('The party rests. The dark stirs again.'); }
  saveGame();
}
function dieParty() {
  if (S.mode === 'dead') return;
  S.mode = 'dead'; S.deathT = 0; S.deaths++; S.deathAt = S.t; Snd.sfx('died'); Snd.music('ambient');
  S.bloodstain = S.souls > 0 ? { x: S.px, y: S.py, souls: S.souls } : S.bloodstain;
  S.souls = 0; S.boss = null; S.menu = null;
}
function respawn() {
  const b = S.bonfires.find(b => b.id === S.bonfire);
  if (b) { S.px = b.x + 0.9; S.py = b.y; S.pa = Math.atan2(b.y - S.py, b.x - S.px) + Math.PI; }
  else { const st = findStart(); S.px = st.x + 0.5; S.py = st.y + 0.5; S.pa = Math.PI / 2; }
  for (const m of S.party) { m.dead = false; recalcMember(m); m.hp = m.hpMax; m.spts = m.spMax; m.rec = 0; m.cd = 0; }
  S.estus = S.estusMax; S.stam = S.stamMax; S.chill = 0; S.venom = 0; S.bulwark = 0; S.dodge = null; S.iframes = 0; S.projectiles = [];
  for (const d of MAP.doors) if (d.fog && !d.removed) d.target = 0;
  spawnEnemies(false);
  S.mode = 'play'; S.fade = { t: 1.2, dur: 1.2, color: '#000' };
  saveGame();
}
function useFlask() {
  if (S.estus <= 0) { message('The flask is empty.'); Snd.sfx('locked'); return; }
  S.estus--; Snd.sfx('flask');
  for (const m of S.party) { if (m.dead) continue; const h = Math.round(m.hpMax * 0.45 + 10); m.hp = Math.min(m.hpMax, m.hp + h); m.heal = 0.8; }
  S.chill = 0; S.venom = 0; S.healFx = 0.9;
  burst(S.px, S.py, 10, '#ffb347', true);
}

// ---- level up ----
function levelUp(m, stat) {
  const cost = levelCost(m.level);
  if (S.souls < cost) return false;
  S.souls -= cost; m.level++; m[stat] += 1 + (stat === 'en' ? 1 : 0); recalcMember(m); Snd.sfx('levelup');
  if (stat === 'en') { S.stamMax = 100 + S.party.reduce((a, p) => a + p.en - p.def.en, 0) * 2; }
  saveGame(); return true;
}

// ---- save / load ----
function saveGame() {
  try {
    const data = { v: 1, party: S.party.map(m => ({ id: m.id, level: m.level, mt: m.mt, en: m.en, it: m.it, sp: m.sp })), souls: S.souls, estusMax: S.estusMax, weaponLvl: S.weaponLvl, hpBonus: S.hpBonus, items: S.items, flags: S.flags, bonfire: S.bonfire, bloodstain: S.bloodstain, playTime: S.playTime, deaths: S.deaths, kills: S.kills, bossKills: S.bossKills, stamMax: S.stamMax };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function loadGame() {
  let data; try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!data) return false;
  newGame();
  S.party.forEach((m, i) => { const d = data.party.find(p => p.id === m.id); if (d) { Object.assign(m, d); } });
  S.souls = data.souls; S.estusMax = data.estusMax; S.estus = S.estusMax; S.weaponLvl = data.weaponLvl; S.hpBonus = data.hpBonus || 0; S.items = data.items || {}; S.flags = data.flags; S.bonfire = data.bonfire; S.bloodstain = data.bloodstain; S.playTime = data.playTime || 0; S.deaths = data.deaths || 0; S.kills = data.kills || 0; S.bossKills = data.bossKills || 0; S.stamMax = data.stamMax || 100;
  S.party.forEach(m => { recalcMember(m); m.hp = m.hpMax; m.spts = m.spMax; });
  buildEntities();
  respawn(); S.fade = null; S.center = null;
  const z = zoneAt(S.px, S.py); S.lastZone = z.idx; S.areaShown = z.idx;
  message('The party returns to the bonfire.');
  return true;
}
