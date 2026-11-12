// ===================== online co-op: one phone hosts the fight, the others mirror it =====================
// The host runs the real game. Guests send their stick and buttons; 20 times a second the host sends back where
// everything is, plus every effect that fired (explosions, bolts, sounds, banners) as a short event. Guests replay
// those events locally, so the full spectacle costs almost no bandwidth. Matchmaking uses the public PeerJS server.
const NET = { role: null, on: false, peer: null, conns: new Map(), host: null, code: '', myPid: -1, sendT: 0, inT: 0, rec: false, depth: 0, ev: [], lightsCur: [], lights: [],
  defIds: new Map(), defs: [], newDefs: [], statCache: new Map(), mir: new Map(), stat: new Map(), pend: new Map(), chId: 0, arena: null, lastCard: null, lastCallout: null,
  status: '', statusT: 0, panel: false, panelRects: [], draft: {}, rx: 0, tx: 0, bytes: 0 };
const NET_PREFIX = 'cellar-of-ruin-v1-';
const PCOL = ['#ffd860', '#6cc8ff', '#ff7a8a', '#8aff9a'];
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const netGuest = () => NET.role === 'client';
function netSay(s, t = 3) { NET.status = s; NET.statusT = t; }
// plain JSON text over the data channel; anything bigger than ~12 KB goes in numbered chunks (some phones cap one message near 16 KB)
let CHUNK_ID = 0;
function netSend(conn, obj) { if (!conn || !conn.open) return; const s = JSON.stringify(obj), L = 12000; NET.tx += s.length; if (s.length <= L) { conn.send(s); return; } const id = ++CHUNK_ID, n = Math.ceil(s.length / L); for (let i = 0; i < n; i++) conn.send('\u0001' + id + ',' + i + ',' + n + ',' + s.slice(i * L, (i + 1) * L)); }
function netRecv(conn, d, fn) {
  if (typeof d !== 'string') return; NET.bytes += d.length;
  if (d.charCodeAt(0) !== 1) return fn(JSON.parse(d));
  const a = d.indexOf(','), b = d.indexOf(',', a + 1), c = d.indexOf(',', b + 1), id = d.slice(1, a), i = +d.slice(a + 1, b), n = +d.slice(b + 1, c);
  const bufs = conn.__chunks || (conn.__chunks = {}), q = bufs[id] || (bufs[id] = { got: 0, parts: [] });
  q.parts[i] = d.slice(c + 1); q.got++; if (q.got === n) { delete bufs[id]; fn(JSON.parse(q.parts.join(''))); }
}
// ---------- effects become events ----------
const FXO = [];
// single particles are the bulk of the traffic: packed as plain arrays in this key order, at most 30 per update
const PARTK = ['k', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'life', 's0', 's1', 'col', 'drag', 'a0', 'a1', 'g', 'bounce', 'vr', 'rot', 'c2'];
function encPart(o) { const r = PARTK.map(k => { const v = o[k]; return v === undefined ? null : typeof v === 'number' ? r1(v) : v; }); while (r.length && r[r.length - 1] === null) r.pop(); return r; }
function decPart(a) { const o = {}; a.forEach((v, j) => { if (v !== null) o[PARTK[j]] = v; }); return o; }
function fxWrap(name, f, self) {
  const i = FXO.length, isPart = name === 'part'; FXO.push({ name, f, self, isPart });
  return function (...a) { if (NET.rec && !NET.depth) { if (!isPart) NET.ev.push([i, ...a.map(encA)]); else if (a[0]) NET.ev.push([i, encPart(a[0])]); } NET.depth++; try { return f.apply(self || this, a); } finally { NET.depth--; } };
}
function encA(v) {
  if (typeof v === 'number') return r2(v);
  if (!v || typeof v !== 'object') return typeof v === 'function' ? 0 : v;
  if (v.team) return { $u: v.id };
  if (Array.isArray(v)) return v.map(encA);
  const r = {}; for (const k in v) { const x = v[k]; if (typeof x !== 'function' && !(x instanceof Set)) r[k] = encA(x); } return r;
}
function decA(v) {
  if (!v || typeof v !== 'object') return v;
  if (v.$u !== undefined) return NET.mir.get(v.$u) || { x: 0, y: 0, z: 0, scale: 1, face: 1, spr: '', def: { col: 'white', name: '' }, team: 'mon', dead: true };
  if (Array.isArray(v)) return v.map(decA);
  const r = {}; for (const k in v) r[k] = decA(v[k]); return r;
}
function withSeed(seed, fn) { const R = Math.random; let s = seed >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; try { return fn(); } finally { Math.random = R; } }
let _buildArena = null;
function netWrap() {
  part = fxWrap('part', part); sparks = fxWrap('sparks', sparks); glows = fxWrap('glows', glows); embers = fxWrap('embers', embers); smoke = fxWrap('smoke', smoke); debris = fxWrap('debris', debris);
  ring = fxWrap('ring', ring); flashLight = fxWrap('flashLight', flashLight); arcFx = fxWrap('arcFx', arcFx); teleg = fxWrap('teleg', teleg); column = fxWrap('column', column); circleFx = fxWrap('circleFx', circleFx);
  shake = fxWrap('shake', shake); quake = fxWrap('quake', quake); kick = fxWrap('kick', kick); flash = fxWrap('flash', flash); bolt = fxWrap('bolt', bolt); cracks = fxWrap('cracks', cracks);
  scorch = fxWrap('scorch', scorch); splat = fxWrap('splat', splat); number = fxWrap('number', number); textPop = fxWrap('textPop', textPop); spellLabel = fxWrap('spellLabel', spellLabel); ghost = fxWrap('ghost', ghost);
  healFx = fxWrap('healFx', healFx); novaFx = fxWrap('novaFx', novaFx); summonFx = fxWrap('summonFx', summonFx); gustFx = fxWrap('gustFx', gustFx); lashFx = fxWrap('lashFx', lashFx); riseFx = fxWrap('riseFx', riseFx);
  bashFx = fxWrap('bashFx', bashFx); jetFx = fxWrap('jetFx', jetFx); levelFx = fxWrap('levelFx', levelFx); deathFx = fxWrap('deathFx', deathFx); slamFx = fxWrap('slamFx', slamFx); emitFx = fxWrap('emitFx', emitFx);
  pushBanner = fxWrap('pushBanner', pushBanner); textBanner = fxWrap('textBanner', textBanner); banner = fxWrap('banner', banner);
  for (const k of ['boom', 'thunder', 'zap', 'quake', 'slash', 'clang', 'hit', 'fire', 'whoosh', 'summon', 'pop', 'shatter', 'drum', 'beam', 'charge', 'heal', 'braam', 'drone', 'levelup']) if (typeof SFX[k] === 'function') SFX[k] = fxWrap('sfx.' + k, SFX[k], SFX);
  const _light = light; light = function (x, y, r, col, a = 1) { if (NET.rec && !NET.depth) NET.lightsCur.push(r1(x), r1(y), r1(r), col, r2(a)); return _light(x, y, r, col, a); };
  _buildArena = buildArena; loadTurn();
  buildArena = function (floor) { const seed = (Math.random() * 2147483647) | 0; NET.arena = { floor, seed }; if (NET.role === 'host') NET.ev.push(['A', floor, seed]); return withSeed(seed, () => _buildArena(floor)); };
}
// ---------- host: what goes on the wire ----------
function defIdOf(d) { let id = NET.defIds.get(d); if (id === undefined) { id = NET.defs.length; NET.defIds.set(d, id); const o = {}; for (const k in d) { const v = d[k]; if (v === null || (typeof v !== 'object' && typeof v !== 'function')) o[k] = v; } NET.defs.push(o); NET.newDefs.push([id, o]); } return id; }
const statOf = u => [u.id, defIdOf(u.def), u.spr, u.team, u.key || 0, u.rank || 0, u.title || 0, u.pid === undefined ? -1 : u.pid, u.pname || 0, r1(u.r), u.boss ? 1 : 0];
const dynOf = u => [u.id, r1(u.x), r1(u.y), r1(u.z), r1(u.vx), r1(u.vy), r2(u.anim), u.face, Math.round(u.hp), Math.round(u.maxHp), r2(u.flash), r2(u.lunge), r2(u.la), r2(u.squash), r2(u.stun), r2(u.spawnT), r2(u.scale), Math.round(u.ult || 0),
  (u.dead ? 1 : 0) | (u.moving ? 2 : 0) | (u.iframe > 0 ? 4 : 0) | (u.inp && u.inp.auto >= 2 ? 8 : 0) | (u.away ? 16 : 0) | (u.regen ? 32 : 0), u.state && u.state.k === 'cast' && u.state.sp ? u.state.sp.tier + 1 : 0, u.state && u.state.k === 'cast' ? r2(u.state.t / u.state.dur) : 0];
const PK = ['k', 'x', 'y', 'z', 'vx', 'vy', 'vz', 't', 'big', 'sz', 'rk', 'mud', 'shot', 'tint', 'col', 'life'];
function pickO(o, keys) { const r = {}; for (const k of keys) { const v = o[k]; if (v !== undefined && v !== null && typeof v !== 'object' && typeof v !== 'function') r[k] = typeof v === 'number' ? r2(v) : v; } return r; }
function plain(o) { const r = {}; for (const k in o) { if (k === 'hit') continue; const v = o[k], t = typeof v; if (t === 'number') r[k] = r2(v); else if (t === 'string' || t === 'boolean') r[k] = v; else if (Array.isArray(v) && v.length <= 64 && (typeof v[0] === 'number' || Array.isArray(v[0]))) r[k] = v.map(x => Array.isArray(x) ? x.map(y => typeof y === 'number' ? r2(y) : y) : typeof x === 'number' ? r2(x) : x); } return r; }
const GK = ['time', 'phase', 'phaseT', 'wave', 'waves', 'waveT', 'floor', 'lvl', 'xp', 'kills', 'combo', 'comboT', 'ts', 'ambDark', 'ambFlash', 'inten', 'cdn', 'fightT', 'best', 'falls', 'bossFloor', 'burst'];
function privOf(h) {
  if (!h || !h.sb) return null; const cd = {}; for (const k in h.cd) if (h.cd[k] > 0) cd[k] = r2(h.cd[k]);
  return { known: [...h.sb.known], slots: h.sb.slots, basic: h.sb.basic[h.key], mods: h.sb.mods, cd, cdMax: h.cdMax || {}, dashCd: r2(h.dashCd || 0) };
}
function snapshot(full) {
  const nu = [], u = [];
  for (const x of G.units) { const st = statOf(x); if (full) nu.push(st); else { const sk = JSON.stringify(st); if (NET.statCache.get(x.id) !== sk) { NET.statCache.set(x.id, sk); nu.push(st); } } u.push(dynOf(x)); }
  if (NET.statCache.size > G.units.length * 3 + 50) { const ids = new Set(G.units.map(x => x.id)); for (const k of [...NET.statCache.keys()]) if (!ids.has(k)) NET.statCache.delete(k); }
  const g0 = pickO(G, GK), g = {}; if (full) Object.assign(g, g0); else { const L = NET.lastG || {}; for (const k in g0) if (g0[k] !== L[k]) g[k] = g0[k]; } NET.lastG = g0; g.time = g0.time; g.boss = G.boss ? G.boss.id : 0; g.champ = G.champ ? G.champ.id : 0; g.eq = G.eq ? 1 : 0; g.storm = G.storm ? 1 : 0; g.sq = G.spawnQ.length;
  g.fo = G.focus && G.focus.t > 0 ? [r1(G.focus.x), r1(G.focus.y), r2(G.focus.w), r2(G.focus.t)] : 0;
  if (full) { g.card = G.card ? plain(G.card) : null; g.callout = null; }
  else { if (G.card !== NET.lastCard) { NET.lastCard = G.card; g.card = G.card ? plain(G.card) : null; } if (G.callout !== NET.lastCallout) { NET.lastCallout = G.callout; g.callout = G.callout ? plain(G.callout) : null; } }
  const s = { t: 's', g, u, nu, p: G.proj.map(p => pickO(p, PK)), hz: FX.hz.map(plain), bm: FX.beams.map(plain), li: NET.lightsCur.slice(), rn: ARENA.runes.map(r => r2(r.glow || 0)), pd: ARENA.props.map((p, i) => p.dead ? i : -1).filter(i => i >= 0) };
  if (full) { s.nd = NET.defs.map((d, i) => [i, d]); s.arena = NET.arena; s.ev = []; } else { s.nd = NET.newDefs; s.ev = NET.ev; }
  if (!full) { NET.newDefs = []; NET.ev = []; NET.partN = 0; }
  return s;
}
function hostTick(rdt) {
  for (const h of G.heroes.slice()) if (h.away) { h.awayT = (h.awayT || 0) + rdt; if (h.awayT > 90) { pushBanner({ a: h.pname + ' IS GONE', b: h.def.name + ' LEAVES THE CELLAR', col: h.def.col, keep: true, life: 1.6 }); dropHero(h); } } else h.awayT = 0;
  for (const [id, p] of NET.pend) { p.t += rdt; if (p.t > 30 || !NET.conns.has(p.pid)) { NET.pend.delete(id); choiceEffect(p.h, p.opts[asHero(p.h, () => autoIndex(p))]); } }
  NET.sendT += rdt; if (NET.sendT < 0.05) return; NET.sendT = 0;
  if (!NET.conns.size) { NET.ev = []; NET.newDefs = []; return; }
  const s = snapshot(false);
  if (window.CR_PROF) { const P = window.CR_PROF; for (const k in s) P[k] = (P[k] || 0) + JSON.stringify(s[k]).length; P.n = (P.n || 0) + 1; if (s.ev) for (const e of s.ev) { const nm = e[0] === 'A' ? 'A' : FXO[e[0]].name; P['ev:' + nm] = (P['ev:' + nm] || 0) + JSON.stringify(e).length; } }
  NET.tick = (NET.tick || 0) + 1;
  for (const c of NET.conns.values()) if (c.ok) {
    if (!c.relayed) { s.me = privOf(c.h); try { netSend(c.conn, s); } catch (e) { } continue; }
    // through the relay: 10 updates a second (all effects still arrive), so the monthly allowance lasts; skipped updates are carried over
    const bk = c.back || (c.back = { ev: [], nu: [], nd: [], g: {} });
    bk.ev.push(...s.ev); bk.nu.push(...s.nu); bk.nd.push(...s.nd); Object.assign(bk.g, s.g);
    if (NET.tick % 2) continue;
    c.back = null; try { netSend(c.conn, { ...s, g: bk.g, ev: bk.ev, nu: bk.nu, nd: bk.nd, me: privOf(c.h) }); } catch (e) { }
  }
}
function hostOpen(tries = 0) {
  if (turnWaiting()) { NET.role = 'host'; netSay('OPENING A ROOM…', 30); loadTurn().then(() => { NET.turnTried = true; if (NET.role === 'host' && !NET.peer) hostOpen(tries); }); return; }
  const code = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[randi(0, 23)]).join(''), peer = new Peer(NET_PREFIX + code, peerOpts());
  NET.role = 'host'; netSay('OPENING A ROOM…', 30); if (!NET.lobby) NET.lobby = { started: true, picks: {} };
  peer.on('open', () => { NET.peer = peer; NET.code = code; NET.on = true; netSay('ROOM ' + code + ' IS OPEN', 4); pushBanner({ a: 'ROOM ' + code, b: 'SEND THE INVITE · UP TO 3 FRIENDS CAN JOIN', col: 'gold', keep: true, life: 2.4 }); });
  peer.on('connection', conn => hostConn(conn));
  peer.on('disconnected', () => { if (NET.role === 'host') setTimeout(() => { try { peer.reconnect(); } catch (e) { } }, 1500); });
  peer.on('error', e => { if (e.type === 'unavailable-id' && tries < 4) { peer.destroy(); hostOpen(tries + 1); } else if (!NET.on) { netSay('COULD NOT OPEN A ROOM (' + e.type + ')', 5); NET.role = null; try { peer.destroy(); } catch (x) { } } });
}
function freeSlot() { const used = new Set([...G.heroes.map(h => h.pid), ...NET.conns.keys()]); for (let i = 1; i < 4; i++) if (!used.has(i)) return i; return -1; }
function hostConn(conn) {
  const c = { conn, pid: -1, h: null, ok: false, token: conn.metadata && conn.metadata.token };
  netSay('A FRIEND IS CONNECTING…', 8); setTimeout(() => { if (!c.ok && NET.role === 'host') netSay('A FRIEND CAN’T GET THROUGH YET · KEEP THIS SCREEN OPEN', 8); }, 15000);
  conn.on('open', () => {
    const gv = conn.metadata && conn.metadata.ver; if (gv && gv !== BUILD) { netSend(conn, { t: 'ver', ver: BUILD }); setTimeout(() => conn.close(), 800); netSay('A FRIEND HAS A DIFFERENT VERSION · BOTH SHOULD REOPEN THE GAME', 6); return; }
    let h = c.token && G.heroes.find(x => x.token === c.token && x.away);
    if (!h && freeSlot() < 0) { const away = G.heroes.find(x => x.away); if (away) dropHero(away); }
    const pid = h ? h.pid : freeSlot(); if (pid < 0) { netSend(conn, { t: 'full' }); setTimeout(() => conn.close(), 800); return; }
    c.pid = pid; c.ok = true; NET.conns.set(pid, c);
    const lob = !NET.lobby.started, s = snapshot(true); s.t = 'w'; s.ver = BUILD; s.pid = pid; s.code = NET.code; s.lobby = lob; s.draft = !h && !lob; netSend(conn, s);
    if (lob) { MENU.flash[pid] = 1; if (SFX.ctx) SFX.summon(); lobbySync(); } else if (!h) netSay('P' + (pid + 1) + ' IS JOINING…', 3);
    if (h) { c.h = h; h.away = false; h.inp.auto = 0; pushBanner({ a: h.pname + ' IS BACK', b: h.def.name + ' RETURNS TO THEIR CONTROL', col: h.def.col, keep: true, life: 1.8 }); }
  });
  conn.on('data', d => { try { netRecv(conn, d, m => hostMsg(c, m)); } catch (e) { console.error(e); } });
  conn.on('close', () => hostDrop(c)); conn.on('error', () => hostDrop(c));
}
function hostMsg(c, m) {
  if (!m || !c.ok) return;
  if (m.t === 'in') { const h = c.h; if (!h || !h.inp) return; const I = h.inp; I.mx = clamp(+m.mx || 0, -1, 1); I.my = clamp(+m.my || 0, -1, 1); I.auto = clamp(m.auto | 0, 0, 2); if (m.d) I.dashQ = true; if (Array.isArray(m.c)) for (const s of m.c.slice(0, 6)) if (s === 'ult' || (s >= 0 && s < 4)) I.castQ.push(s); }
  else if (m.t === 'join') hostJoin(c, m);
  else if (m.t === 'lh') { if (NET.lobby && !NET.lobby.started && HERO_DEFS[m.hero]) { NET.lobby.picks[c.pid] = m.hero; MENU.flash[c.pid] = 1; lobbySync(); } }
  else if (m.t === 'pick') { const p = NET.pend.get(m.id); if (p && p.pid === c.pid && p.opts[m.i]) { NET.pend.delete(m.id); choiceEffect(p.h, p.opts[m.i]); } }
}
function hostJoin(c, m) {
  if (c.h || !HERO_DEFS[m.hero]) return; const k = m.hero, h = mkUnit('hero', HERO_DEFS[k], 0, 0);
  Object.assign(h, { key: k, ult: 0, strafe: chance(0.5) ? 1 : -1, pid: c.pid, pname: 'P' + (c.pid + 1), ctrl: 'player', inp: newInp(), sb: newSB(k), dashCd: 0, token: c.token || 0 });
  const b = SPELLBOOK[k].find(s => s.basic && s.name === m.basic); if (b) { h.sb.known.delete(h.sb.basic[k]); h.sb.basic[k] = b.name; h.sb.known.add(b.name); }
  const sk = SPELLBOOK[k].find(s => s.name === m.skill && s.tier === 1 && !s.free); if (sk) asHero(h, () => learnSpell({ sp: sk }));
  const a = (G.me && !G.me.dead && G.me) || G.heroes.find(x => !x.dead);
  h.x = a ? clamp(a.x + rand(-16, 16), ARENA.x0 + 8, ARENA.x1 - 8) : ARENA.pw / 2; h.y = a ? clamp(a.y + rand(-10, 10), ARENA.y0 + 8, ARENA.y1 - 4) : ARENA.y1 - 30; h.z = 160;
  G.heroes.push(h); G.units.push(h); c.h = h; scaleParty(); h.hp = h.maxHp;
  column(h.x, h.y, h.def.col, 1.4, 14); ring(h.x, h.y, 40, h.def.col, 0.5, 4); SFX.summon(); pushBanner({ a: h.pname + ' JOINS AS ' + h.def.name, b: NP() + ' HEROES IN THE CELLAR', col: h.def.col, keep: true, life: 2.2 });
}
function dropHero(h) { removeIf(G.heroes, x => x === h); removeIf(G.units, x => x === h); smoke(h.x, h.y, 6, 'dark', 10, 30, 1.2); scaleParty(); }
function hostDrop(c) {
  if (!c.ok) return; c.ok = false; NET.conns.delete(c.pid); const h = c.h;
  if (NET.lobby && !NET.lobby.started) { delete NET.lobby.picks[c.pid]; lobbySync(); }
  if (h) { h.away = true; h.inp.auto = 2; h.inp.castQ.length = 0; h.inp.mx = h.inp.my = 0; pushBanner({ a: h.pname + ' LOST CONNECTION', b: h.def.name + ' FIGHTS ON BY ITSELF', col: h.def.col, keep: true, life: 2 }); }
}
// per-player cards: the host deals each guest their own three cards; they never pause the fight
function netQueueChoice(kind, title) {
  for (const c of NET.conns.values()) {
    const h = c.h; if (!c.ok || !h) continue; const opts = asHero(h, () => genChoices(kind === 'boss')); if (!opts.length) continue;
    const id = ++NET.chId; NET.pend.set(id, { pid: c.pid, h, opts, t: 0 });
    netSend(c.conn, { t: 'ch', id, kind, title: title || '', opts: opts.map(o => ({ type: o.type, hero: o.hero, sp: o.sp.name, mod: o.mod ? o.mod.name : 0, replace: o.replace || 0 })) });
  }
  for (const h of G.heroes) if (h.away && h.sb) { const opts = asHero(h, () => genChoices(kind === 'boss')); if (opts.length) choiceEffect(h, opts[asHero(h, () => autoIndex({ opts }))]); }
}
function choiceEffect(h, o) {
  if (!h || !o) return;
  asHero(h, () => {
    if (o.type === 'basic') applyPick(o);
    else if (o.type === 'spell') { learnSpell(o); pushBanner({ a: o.sp.name, b: (h.pname ? h.pname + ' · ' : '') + h.def.name + ' LEARNS A ' + TIER_LABEL[o.sp.tier] + ' SPELL' + (o.replace ? ' · FORGETS ' + o.replace : ''), col: h.def.col, keep: true, life: 2.1 }); }
    else if (o.type === 'mod') { (G.modsTaken[o.sp.name] = G.modsTaken[o.sp.name] || []).push(o.mod.name); applyMod(o.sp.name, o.mod.eff); pushBanner({ a: o.mod.name, b: o.sp.name + ' UPGRADED · ' + o.mod.desc.toUpperCase(), col: h.def.col, keep: true, life: 2.1 }); }
  });
  if (!h.dead) { column(h.x, h.y, h.def.col, 1.2, 12); ring(h.x, h.y, 36, h.def.col, 0.5, 4); flashLight(h.x, h.y, 110, h.def.col, 1.5, 0.6); }
}
function netCloseRoom() {
  for (const c of NET.conns.values()) { try { netSend(c.conn, { t: 'bye' }); setTimeout(() => c.conn.close(), 300); } catch (e) { } }
  NET.conns.clear(); NET.pend.clear(); try { NET.peer && NET.peer.destroy(); } catch (e) { }
  for (const h of G.heroes.slice()) if (h.pid > 0) dropHero(h);
  Object.assign(NET, { role: null, on: false, peer: null, code: '', lobby: null, panel: false }); netSay('ROOM CLOSED', 3);
}
// ---------- guest ----------
// PeerJS's own defaults, spelled out so a guest can retry through the relay only
const ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' }];
const BUILD = window.__BUILD || 'dev';
// our own relay (Metered): the app name and the credential's front-end apiKey; the game fetches the current relay list from Metered
// Our own relay (Metered). The key is never in the code or on GitHub: it lives only on the host's phone, set once by
// opening a private link ending in #relay=<app>:<key> (the part after # never reaches a server) or pasting it in the room view.
// Only the host needs it: a friend who can't link directly connects to the host's relay address.
function relayKey() {
  try {
    const h = /relay=([a-z0-9-]+):([0-9a-f]{16,})/i.exec(location.hash); if (h) { localStorage.setItem('cor-relay', h[1].toLowerCase() + ':' + h[2]); history.replaceState(null, '', location.pathname + location.search); }
    return localStorage.getItem('cor-relay') || '';
  } catch (e) { return ''; }
}
function setRelayKey(raw) { // accepts the Metered credentials URL or app:key
  const s = String(raw || ''), u = /([a-z0-9-]+)\.metered\.live.*apiKey=([0-9a-f]{16,})/i.exec(s), p = /^\s*([a-z0-9-]+)\s*:\s*([0-9a-f]{16,})\s*$/i.exec(s), m = u || p;
  if (!m) { netSay('THAT DOESN’T LOOK LIKE A RELAY KEY', 4); return; }
  try { localStorage.setItem('cor-relay', m[1].toLowerCase() + ':' + m[2]); } catch (e) { }
  TURN_ICE = null; turnP = null; NET.turnErr = false; NET.turnTried = false; loadTurn().then(v => netSay(v ? 'RELAY READY · REOPEN THE ROOM TO USE IT' : 'THE RELAY KEY WAS NOT ACCEPTED', 5));
}
// the free plan has 500 MB a month: relay traffic is counted on this phone, relayed friends get a lighter stream,
// new rooms stop offering the relay at 400 MB and relayed friends are let go at 470 MB
const RELAY_SOFT = 400 * 1048576, RELAY_HARD = 470 * 1048576;
const relayMonth = () => { const d = new Date(); return 'cor-relay-used-' + d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1); };
function relayUsed() { try { return +localStorage.getItem(relayMonth()) || 0; } catch (e) { return 0; } }
function relayAdd(n) { try { localStorage.setItem(relayMonth(), String(Math.round(relayUsed() + n))); } catch (e) { } }
async function relayWatch() {
  if (NET.role !== 'host') return;
  for (const c of [...NET.conns.values()]) {
    const pc = c.conn && c.conn.peerConnection; if (!c.ok || !pc || !pc.getStats) continue;
    try {
      const st = await pc.getStats(); let pair = null;
      st.forEach(r => { if (r.type === 'transport' && r.selectedCandidatePairId) pair = st.get(r.selectedCandidatePairId); });
      if (!pair) st.forEach(r => { if (r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded') pair = r; });
      if (!pair) continue;
      const lc = st.get(pair.localCandidateId), was = c.relayed; c.relayed = !!(lc && lc.candidateType === 'relay');
      const bytes = (pair.bytesSent || 0) + (pair.bytesReceived || 0);
      if (c.relayed && c.lastBytes !== undefined && bytes > c.lastBytes) relayAdd((bytes - c.lastBytes) * 1.15);
      c.lastBytes = bytes; if (c.relayed && !was) netSend(c.conn, { t: 'slow' });
    } catch (e) { }
  }
  if (relayUsed() > RELAY_HARD) for (const c of [...NET.conns.values()]) if (c.relayed && c.ok) { netSend(c.conn, { t: 'relayout' }); hostDrop(c); setTimeout(() => { try { c.conn.close(); } catch (e) { } }, 600); }
}
setInterval(relayWatch, 3000);
const turnUrl = () => { if (window.CR_TURN_URL) return window.CR_TURN_URL; const k = relayKey(); if (!k || relayUsed() > RELAY_SOFT) return ''; const [app, key] = k.split(':'); return 'https://' + app + '.metered.live/api/v1/turn/credentials?apiKey=' + key; };
let TURN_ICE = null, turnP = null;
function loadTurn() {
  const u = turnUrl(); if (!u || TURN_ICE) return Promise.resolve(TURN_ICE);
  if (!turnP) turnP = Promise.race([fetch(u, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(a => { if (Array.isArray(a) && a.length) TURN_ICE = a; else NET.turnErr = true; return TURN_ICE; }), new Promise(r => setTimeout(r, 4000))]).catch(() => { NET.turnErr = true; return null; }).then(v => { if (!TURN_ICE) turnP = null; return v; });
  return turnP;
}
const turnWaiting = () => turnUrl() && !TURN_ICE && !NET.turnTried;
function peerOpts(relay) {
  const q = new URLSearchParams(location.search), o = { debug: 0, config: { iceServers: TURN_ICE ? [{ urls: 'stun:stun.l.google.com:19302' }, ...TURN_ICE] : ICE, iceTransportPolicy: relay && TURN_ICE ? 'relay' : 'all' } };
  if (q.get('peerhost')) Object.assign(o, { host: q.get('peerhost'), port: +q.get('peerport') || 9000, path: '/', secure: false, config: { iceServers: [] } });
  return o;
}
function netToken(code) { const k = 'cor-token-' + code; let t = null; try { t = sessionStorage.getItem(k); } catch (e) { } if (!t) { t = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem(k, t); } catch (e) { } } return t; }
// joining: each stage is shown in the lobby; a missing room is retried for 30 s (the host may be in the share sheet),
// a link that never opens is retried through the relay, and anything else ends on a clear message with TRY AGAIN
function netJoin(raw, relay, retry) {
  const code = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); if (code.length !== 4) { netSay('ROOM CODES HAVE 4 LETTERS', 3); return; }
  if (NET.role === 'host') netCloseRoom();
  if (NET.role === 'client' && NET.peer) { try { NET.peer.destroy(); } catch (e) { } }
  if (!retry) { NET.tries = 0; NET.attempt = 1; }
  Object.assign(NET, { role: 'client', code, on: false, host: null, lost: false, fail: null, relay: !!relay, stage: 'MATCHMAKER', stageT: performance.now(), seats: retry ? NET.seats : null, panel: false });
  if (!retry) NET.lobbyPick = null; MENU.seatsKey = ''; G.mode = 'lobby';
  G.sched = []; G.proj = []; G.choice = null; G.choiceQ = []; UI.bookOpen = false; G.me = null; G.draftKey = null; NET.draft = {}; NET.mir.clear(); NET.stat.clear(); for (const k in FX) FX[k].length = 0;
  if (turnWaiting()) { loadTurn().then(() => { NET.turnTried = true; if (NET.role === 'client' && NET.code === code && !NET.on && !NET.fail) netJoin(code, relay, true); }); return; }
  const peer = new Peer(peerOpts(relay)); NET.peer = peer;
  peer.on('open', () => {
    if (NET.peer !== peer) return;
    const conn = peer.connect(NET_PREFIX + code, { reliable: true, serialization: 'raw', metadata: { token: netToken(code), ver: BUILD } }); NET.host = conn; NET.stage = 'HOST'; NET.stageT = performance.now();
    // remember which kinds of route this phone could offer (local network, internet address, relay) for the failure message
    NET.cand = NET.cand || {}; NET.candErr = NET.candErr || ''; const pc = conn.peerConnection;
    if (pc) { pc.addEventListener('icecandidate', e => { const m = e.candidate && / typ (\w+)/.exec(e.candidate.candidate); if (m) NET.cand[m[1]] = (NET.cand[m[1]] || 0) + 1; }); pc.addEventListener('icecandidateerror', e => { NET.candErr = e.errorCode + (e.url ? ' ' + e.url.split(':')[0] : ''); }); }
    conn.on('open', () => { NET.on = true; NET.stage = 'OK'; NET.tries = 0; netSay('CONNECTED TO ROOM ' + code, 2); });
    conn.on('data', d => { NET.rx = performance.now(); try { netRecv(conn, d, guestMsg); } catch (e) { console.error(e); } });
    conn.on('close', () => { if (NET.host === conn) guestLost('CONNECTION LOST', true); }); conn.on('error', () => { if (NET.host === conn) guestLost('CONNECTION LOST', true); });
  });
  peer.on('error', e => {
    if (NET.peer !== peer) return;
    if (e.type === 'peer-unavailable') {
      if (NET.on) return guestLost('THE HOST LEFT', true);
      if (++NET.tries <= 10) { NET.stage = 'NOTFOUND'; setTimeout(() => { if (NET.role === 'client' && NET.peer === peer && !NET.on && !NET.fail) netJoin(code, relay, true); }, 3000); }
      else joinFail('NO ROOM CALLED ' + code, 'Check the code. The host’s game has to stay open on their screen.');
    } else if (!NET.on) joinFail('COULD NOT REACH THE MATCHMAKER', 'Check your internet connection and try again (' + e.type + ').');
  });
}
function joinFail(a, b) { NET.fail = { a, b }; NET.on = false; NET.statusT = 0; try { NET.peer && NET.peer.destroy(); } catch (e) { } if (SFX.ctx) SFX.clang && SFX.clang(); }
function joinWatch() { // a link that never opens: one retry through the relay, then a clear message
  if (NET.role !== 'client' || NET.on || NET.fail) return;
  if (NET.stage === 'MATCHMAKER' && performance.now() - NET.stageT > 15000) return joinFail('COULD NOT REACH THE MATCHMAKER', 'The matchmaking server did not answer. Check your internet connection and try again.');
  if (NET.stage !== 'HOST') return;
  const pc = NET.host && NET.host.peerConnection, ice = pc ? pc.iceConnectionState : ''; NET.ice = ice;
  if (ice === 'failed' || performance.now() - NET.stageT > 15000) {
    // keep trying for about 90 s, alternating a direct link and the relay: the host may only just be back from sending the invite
    if ((NET.attempt || 1) < 6) { NET.attempt = (NET.attempt || 1) + 1; netJoin(NET.code, NET.attempt % 2 === 0, true); }
    else { const c = NET.cand || {}, ok = v => v ? '✓' : '✗'; joinFail('COULD NOT CONNECT TO THE HOST', 'Your phone could offer: local network ' + ok(c.host) + '  ·  internet address ' + ok(c.srflx) + '  ·  relay ' + ok(c.relay) + (NET.candErr ? '  (relay error ' + NET.candErr + ')' : '') + (NET.turnErr ? '  (relay settings did not load)' : '') + '. Try both phones on the same Wi-Fi.'); }
  }
}
function guestLost(why, retry) {
  if (NET.role !== 'client' || NET.lost || NET.fail) return; NET.lost = true;
  // a dropped connection (screen lock, weak signal) rejoins the same room and gets the same hero back; anything else returns to solo
  const again = retry && !/[?&]retry=/.test(location.search); netSay(why + (again ? ' · REJOINING…' : ' · BACK TO SOLO…'), 10);
  setTimeout(() => { location.href = location.pathname + (again ? '?room=' + NET.code + '&retry=1' + peerQuery() : peerQuery().replace('&', '?')); }, 2200);
}
function peerQuery() { const q = new URLSearchParams(location.search); return q.get('peerhost') ? '&peerhost=' + q.get('peerhost') + '&peerport=' + (q.get('peerport') || 9000) : ''; }
function guestMsg(m) {
  if (m.t === 's') applySnap(m);
  else if (m.t === 'ver' || (m.t === 'w' && m.ver !== BUILD)) { joinFail('YOU AND THE HOST HAVE DIFFERENT VERSIONS', 'Both of you: close the game completely (swipe it away), open it again, then rejoin.'); }
  else if (m.t === 'w') { NET.myPid = m.pid; NET.code = m.code; applySnap(m); G.choiceQ = []; G.choice = null; if (m.lobby) G.mode = 'lobby'; else { G.mode = 'play'; UI.titleT = 99; if (m.draft) queueDraft(); } }
  else if (m.t === 'lb') { NET.seats = m.seats; const s = m.seats.find(x => x.pid === NET.myPid); if (s && NET.lobbyPick && !s.hero) s.hero = NET.lobbyPick; }
  else if (m.t === 'go') { G.mode = 'play'; UI.titleT = 99; G.choiceQ = []; G.choice = null; NET.draft = {}; if (NET.lobbyPick) { NET.draft.hero = { type: 'hero', hero: NET.lobbyPick }; G.draftKey = NET.lobbyPick; queueDraft(true); } else queueDraft(); }
  else if (m.t === 'ch') G.choiceQ.push({ kind: m.kind, title: m.title || undefined, netId: m.id, opts: m.opts.map(decOpt).filter(Boolean) });
  else if (m.t === 'slow') NET.slow = true;
  else if (m.t === 'relayout') { G.mode = 'lobby'; joinFail('THE HOST’S RELAY IS USED UP FOR THIS MONTH', 'Only phones that can link directly can play together until next month. Try the same Wi-Fi.'); }
  else if (m.t === 'full') guestLost('ROOM ' + NET.code + ' IS FULL');
  else if (m.t === 'bye') guestLost('THE HOST CLOSED THE ROOM');
}
function decOpt(o) {
  const sp = (SPELLBOOK[o.hero] || []).find(s => s.name === o.sp); if (!sp) return null;
  const r = { type: o.type, hero: o.hero, sp, replace: o.replace || null };
  if (o.type === 'mod') { const m = (MODS[sp.name] || []).find(x => x[0] === o.mod); if (!m) return null; r.mod = { name: m[0], desc: m[1], eff: m[2] }; }
  return r;
}
function guestDraftPick(o) { // a guest's draft is kept locally, then sent to the host in one go
  NET.draft[o.type] = o; if (o.type === 'hero') G.draftKey = o.hero;
  const d = NET.draft; if (d.hero && d.basic && d.spell && !d.sent) { d.sent = true; netSend(NET.host, { t: 'join', hero: d.hero.hero, basic: d.basic.sp.name, skill: d.spell.sp.name }); netSay('ENTERING THE FIGHT…', 2); }
}
function setStat(u, st) { u.def = NET.defs[st[1]] || u.def || { col: 'white', name: '' }; u.spr = st[2]; u.team = st[3]; u.key = st[4] || undefined; u.rank = st[5] || undefined; u.title = st[6] || undefined; u.pid = st[7] >= 0 ? st[7] : undefined; u.pname = st[8] || undefined; u.r = st[9]; u.boss = !!st[10]; }
function applySnap(m) {
  if (m.arena && (!NET.arena || NET.arena.seed !== m.arena.seed)) guestArena(m.arena.floor, m.arena.seed);
  for (const [i, d] of m.nd || []) NET.defs[i] = d;
  for (const st of m.nu || []) { NET.stat.set(st[0], st); const u = NET.mir.get(st[0]); if (u) setStat(u, st); }
  // effects first: a new floor (arena event) must exist before this snapshot's units land on it
  for (const e of m.ev || []) { if (e[0] === 'A') { guestArena(e[1], e[2]); continue; } const f = FXO[e[0]]; if (!f) continue; try { if (f.isPart) f.f(decPart(e[1])); else f.f.apply(f.self || null, e.slice(1).map(decA)); } catch (x) { } }
  const seen = new Set();
  for (const a of m.u) {
    const id = a[0]; let u = NET.mir.get(id);
    if (!u) { const st = NET.stat.get(id); if (!st) continue; u = { id, x: a[1], y: a[2], z: a[3], kx: 0, ky: 0, vz: 0, cd: {}, state: null, mul: 1, anim: a[6] }; setStat(u, st); NET.mir.set(id, u); }
    u.sx = a[1]; u.sy = a[2]; u.sz = a[3]; u.vx = a[4]; u.vy = a[5]; if (!(Math.abs(u.anim - a[6]) < 0.4)) u.anim = a[6];
    u.face = a[7]; u.hp = a[8]; u.maxHp = a[9]; u.flash = a[10]; u.lunge = a[11]; u.la = a[12]; u.squash = a[13]; u.stun = a[14]; u.spawnT = a[15]; u.scale = a[16]; u.ult = a[17];
    const f = a[18]; u.dead = !!(f & 1); u.moving = !!(f & 2); u.iframe = f & 4 ? 1 : 0; u.autoNet = !!(f & 8); u.away = !!(f & 16); u.regenOn = !!(f & 32); u.castT = a[19] || 0; u.castU = a[20] || 0; seen.add(id);
  }
  for (const id of [...NET.mir.keys()]) if (!seen.has(id)) NET.mir.delete(id);
  G.units = [...NET.mir.values()]; G.heroes = G.units.filter(u => u.team === 'hero').sort((a, b) => a.pid - b.pid); G.mons = G.units.filter(u => u.team === 'mon' && !u.dead);
  G.me = G.heroes.find(h => h.pid === NET.myPid) || null;
  const g = m.g; for (const k of GK) if (g[k] !== undefined && k !== 'time') G[k] = g[k];
  if (Math.abs(G.time - g.time) > 0.4) G.time = g.time;
  G.boss = NET.mir.get(g.boss) || null; G.champ = NET.mir.get(g.champ) || null; G.eq = g.eq ? (G.eq || {}) : null; G.storm = g.storm ? (G.storm || {}) : null; G.spawnQ = { length: g.sq || 0 };
  G.focus = g.fo ? { x: g.fo[0], y: g.fo[1], w: g.fo[2], t: g.fo[3] } : null;
  if ('card' in g) G.card = g.card; if ('callout' in g) G.callout = g.callout;
  G.proj = m.p; FX.hz = m.hz; FX.beams = m.bm; NET.lights = m.li || [];
  if (ARENA) { (m.rn || []).forEach((v, i) => { if (ARENA.runes[i]) ARENA.runes[i].glow = v; }); for (const i of m.pd || []) { const p = ARENA.props[i]; if (p) { p.dead = true; p.solid = false; } } }
  const me = G.me, p = m.me;
  if (me && p) { me.sb = { known: new Set(p.known), slots: p.slots, basic: { [me.key]: p.basic }, mods: p.mods || {}, modv: {} }; me.cd = p.cd || {}; me.cdMax = p.cdMax || {}; me.dashCd = p.dashCd; me.dashMax = 2.2; }
}
function guestArena(floor, seed) {
  NET.arena = { floor, seed }; withSeed(seed, () => _buildArena(floor));
  for (const k in FX) if (k !== 'hz' && k !== 'beams') FX[k].length = 0;
  const cx = ARENA.pw / 2; CAM.x = cx; CAM.y = ARENA.ph / 2; CAM.z = camFitZoom(); G.fade = 1;
}
function guestFrame(rdt) {
  for (const u of G.units) {
    u.anim += rdt; if (u.flash > 0) u.flash -= rdt; if (u.lunge > 0) u.lunge -= rdt * 1.8;
    if (u.sx === undefined) continue; u.sx += u.vx * rdt; u.sy += u.vy * rdt;
    if (Math.hypot(u.sx - u.x, u.sy - u.y) > 48) { u.x = u.sx; u.y = u.sy; } else { u.x = damp(u.x, u.sx, 14, rdt); u.y = damp(u.y, u.sy, 14, rdt); }
    u.z = damp(u.z, u.sz, 14, rdt);
  }
  for (const p of G.proj) { p.x += (p.vx || 0) * rdt; p.y += (p.vy || 0) * rdt; if (p.vz) p.z = Math.max(0, p.z + p.vz * rdt); p.t = (p.t || 0) + rdt; }
  for (const z of FX.hz) z.t = (z.t || 0) + rdt;
  G.time += rdt; updateFx(rdt);
  // continuous effects are made here, from what this phone already knows
  for (const p of G.proj) projFx(p, rdt); for (const z of FX.hz) if (z.life) hazFx(z, rdt);
  for (const h of G.heroes) { if (h.dead) continue; if (h.castT) castFx(h, h.castT - 1, h.castU, rdt); if (h.regenOn) regenFx(h, rdt); }
  updateEmitters(rdt);
  const L = NET.lights; for (let i = 0; i < L.length; i += 5) FX.lights.push(L[i], L[i + 1], L[i + 2], L[i + 3], L[i + 4]);
  if (NET.on && NET.rx && performance.now() - NET.rx > 5000) guestLost('CONNECTION LOST', true);
  joinWatch();
  NET.inT += rdt;
  if (NET.on && NET.host && G.me && (NET.inT >= (NET.slow ? 0.066 : 0.033) || INPUT.castQ.length || INPUT.dashQ)) {
    NET.inT = 0; const [x, y] = inputVec();
    try { netSend(NET.host, { t: 'in', mx: r2(x), my: r2(y), auto: autoLevel(), d: INPUT.dashQ ? 1 : 0, c: INPUT.castQ.splice(0) }); } catch (e) { }
    INPUT.dashQ = false;
  } else if (!G.me) { INPUT.castQ.length = 0; INPUT.dashQ = false; }
}
function netWake() { const p = NET.peer; if (NET.role === 'host' && p && !p.destroyed && p.disconnected) { try { p.reconnect(); } catch (e) { } } }
setInterval(netWake, 3000);
// a newer build on the site: reload by itself on the menu, otherwise offer it
function checkVersion() { if (!/^https?:$/.test(location.protocol) || BUILD === 'dev' || /claude/.test(location.hostname)) return; fetch('version.txt?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : '').then(v => { v = (v || '').trim(); if (/^[0-9a-f]{8}$/.test(v) && v !== BUILD) { MENU.update = v; if (G.mode === 'menu' && !NET.role) location.reload(); } }).catch(() => { }); }
setInterval(checkVersion, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) { netWake(); checkVersion(); } });
// ---------- co-op panel and name tags ----------
function netInvite() {
  const url = location.origin + location.pathname + '?room=' + NET.code;
  if (navigator.share) navigator.share({ title: 'Cellar of Ruin', text: 'Join my room ' + NET.code + ' in Cellar of Ruin', url }).catch(() => { });
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => netSay('INVITE LINK COPIED', 3)).catch(() => netSay('ROOM CODE: ' + NET.code, 4));
  else netSay('ROOM CODE: ' + NET.code, 4);
}
function netPanelTap(x, y) {
  for (const b of NET.panelRects) if (x >= b.r[0] && x <= b.r[0] + b.r[2] && y >= b.r[1] && y <= b.r[1] + b.r[3]) { b.fn(); return; }
  NET.panel = false;
}
function drawNetPanel(c) {
  NET.panelRects = []; if (!NET.panel || G.mode !== 'play') return;
  MENU.rects = []; const k = vbox(); shade(c, 0.82); c.save(); c.translate(MENU.ox, MENU.oy); c.scale(k, k);
  if (NET.role) drawRoom(c, true);
  else {
    font(c, 900, 46, F_DISP); c.shadowColor = 'rgba(255,140,50,0.7)'; c.shadowBlur = 20; label(c, 'Play Together', 450, 80, '#f8ecd6', { align: 'center' }); c.shadowBlur = 0;
    font(c, 500, 18, F_HUD); label(c, 'Open a room and friends drop straight into this fight, or join someone else’s.', 450, 116, '#cbbd9f', { align: 'center' });
    label(c, 'Up to four heroes. Levels are shared; every player chooses their own spells.', 450, 140, '#9a8c78', { align: 'center' });
    mbtn(c, 150, 180, 290, 90, 'HOST A ROOM', 'Friends join this fight', () => { NET.lobby = { started: true, picks: {} }; hostOpen(); }, { hot: true });
    mbtn(c, 460, 180, 290, 90, 'JOIN A ROOM', 'Leave this run for theirs', startJoin);
    mbtn(c, 300, 300, 300, 48, 'BACK TO THE FIGHT', '', () => { NET.panel = false; }, { size: 18 });
  }
  c.restore(); NET.panelRects = MENU.rects.slice();
}
function drawNetHud(c, R, T) {
  if (G.heroes.length > 1) for (const h of G.heroes) {
    if (h.pid === undefined || h.dead) continue; const [sx, sy] = toScreen(h.x, h.y - h.z - 24 * h.scale); font(c, 600, 12, F_HUD);
    label(c, (h.pname || '') + (h.away ? ' · AWAY' : ''), sx, sy, PCOL[h.pid % 4], { align: 'center', stroke: 3 });
  }
  if (NET.statusT > 0) { NET.statusT -= 1 / 60; font(c, 600, 15, F_HUD); c.globalAlpha = Math.min(1, NET.statusT * 2); spaced(c, NET.status, VIEW.w / 2, VIEW.h * 0.3, 2, '#ffd860', 'center'); c.globalAlpha = 1; }
  if (NET.on) { font(c, 500, 12, F_HUD); c.globalAlpha = 0.8; spaced(c, (NET.role === 'host' ? 'ROOM ' : 'IN ROOM ') + NET.code + ' · ' + ((n) => n + (n === 1 ? ' HERO' : ' HEROES'))(G.heroes.filter(h => h.pid !== undefined).length), R, T + 32, 1.2, '#bfae90', 'right'); c.globalAlpha = 1; }
}
