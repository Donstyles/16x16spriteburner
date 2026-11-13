// ===================== main menu, room-code keypad and the co-op lobby =====================
// All three screens are laid out on a 900×420 board scaled into the safe area, so they look the same on every phone.
const MENU = { rects: [], k: 1, ox: 0, oy: 0, code: '', back: 'menu', flash: {}, best: 0, seatsKey: '' };
try { MENU.best = +localStorage.getItem('cor-best') || 0; } catch (e) { }
function saveBest() { if (G.best > MENU.best) { MENU.best = G.best; try { localStorage.setItem('cor-best', String(G.best)); } catch (e) { } } }
const HERO_QUOTE = { warrior: '“Steel first. Questions never.”', pyro: '“Everything burns, if you are patient.”', storm: '“The sky owes me a favour.”', druid: '“The roots remember every grave.”' };
const FLOOR_LINES = ['The roots down here drink more than water.', 'Salt keeps meat fresh. It keeps other things too.', 'The water rose once. Something swam in with it.', 'Every bone is labelled. Someone keeps the ledger.',
  'The kiln sat cold for a hundred years. It is warm now.', 'The wine went bad. So did the ones who drank it.', 'Listen. The walls are breathing.', 'No lantern ever reached this far before.',
  'The farmhouse is only a lid. You are under it.', 'Old tallies scratched in the stone. All of them stop.', 'Even the rats have stopped running.', 'Deeper still. The dark has a heartbeat.'];
const floorLine = f => f % 4 === 0 ? 'Its breathing shakes the dust from the ceiling.' : FLOOR_LINES[(f - 1) % FLOOR_LINES.length];
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
function vbox() { const S = VIEW.safe, W = VIEW.w - S.l - S.r, H = VIEW.h - S.t - S.b, k = Math.min(W / 900, H / 420); MENU.k = k; MENU.ox = S.l + (W - 900 * k) / 2; MENU.oy = S.t + (H - 420 * k) / 2; return k; }
function vbtn(x, y, w, h, fn) { MENU.rects.push({ r: [MENU.ox + x * MENU.k, MENU.oy + y * MENU.k, w * MENU.k, h * MENU.k], fn }); }
function menuTap(x, y) { for (const b of MENU.rects) if (x >= b.r[0] && x <= b.r[0] + b.r[2] && y >= b.r[1] && y <= b.r[1] + b.r[3]) { if (SFX.ctx) SFX.choice(); b.fn(); return true; } return false; }
function mbtn(c, x, y, w, h, title, sub, fn, o = {}) {
  const hot = o.hot && !o.off, off = o.off;
  c.fillStyle = hot ? 'rgba(58,38,16,0.94)' : 'rgba(18,13,20,0.92)'; c.fillRect(x, y, w, h);
  c.strokeStyle = off ? 'rgba(200,160,80,0.22)' : hot ? '#ffd860' : 'rgba(200,160,80,0.65)'; c.lineWidth = hot ? 2 : 1.2; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (hot) { c.shadowColor = 'rgba(255,190,80,0.7)'; c.shadowBlur = 18; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.shadowBlur = 0; }
  font(c, 600, o.size || 22, F_HUD); spaced(c, title, x + w / 2, y + (sub ? h * 0.48 : h / 2 + (o.size || 22) * 0.34), 2, off ? '#6a6054' : hot ? '#ffe08a' : '#f2e4c6', 'center');
  if (sub) { font(c, 500, 15, F_HUD); label(c, sub, x + w / 2, y + h * 0.8, off ? '#575048' : '#a8987e', { align: 'center' }); }
  if (!off) vbtn(x, y, w, h, fn);
}
function shade(c, a = 0.72) { const W = VIEW.w, H = VIEW.h, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(4,3,6,${a})`); g.addColorStop(0.5, `rgba(4,3,6,${a * 0.6})`); g.addColorStop(1, `rgba(4,3,6,${Math.min(0.95, a + 0.15)})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
function sprite(c, spr, x, y, s, a = 1) { const m = MOBS[spr]; if (!m) return; c.imageSmoothingEnabled = false; c.globalAlpha = a; c.drawImage(IMG.mobs, ((performance.now() / 180) | 0) % 4 * m[1], m[0], m[1], m[2], x, y, s, s * m[2] / m[1]); c.globalAlpha = 1; }
// ---------- start buttons ----------
function beginPlay() { G.mode = 'play'; UI.titleT = 99; G.fade = 1; G.card = { t: 0, life: 2.8, a: 'FLOOR ' + G.floor, b: ARENA.name, c: floorLine(G.floor) }; }
function startSolo(tut) { beginPlay(); queueDraft(); TUT.pending = tut === true || !tutSeen; }
function startWatch() { beginPlay(); G.autoMode = 2; queueDraft(); G.acted = true; autoDraft(); }
function startHost() { G.mode = 'lobby'; NET.lobby = { started: false, picks: {} }; MENU.flash = {}; hostOpen(); }
function startJoin() { MENU.back = G.mode === 'play' ? 'play' : 'menu'; MENU.code = ''; G.mode = 'join'; NET.panel = false; }
function codeKey(ch) { if (ch === 'DEL') MENU.code = MENU.code.slice(0, -1); else if (CODE_ABC.includes(ch) && MENU.code.length < 4) MENU.code += ch; if (MENU.code.length === 4 && ch !== 'DEL') setTimeout(() => { if (G.mode === 'join' && MENU.code.length === 4) netJoin(MENU.code); }, 250); }
function leaveLobby() { if (NET.role === 'host') { netCloseRoom(); G.mode = 'menu'; } else location.href = location.pathname + peerQuery().replace('&', '?'); }
// ---------- seats: who is in the room ----------
function seatsNow() {
  if (NET.role === 'client' && G.mode === 'lobby') return NET.seats || [];
  const out = [];
  for (let pid = 0; pid < 4; pid++) {
    const h = G.heroes.find(x => x.pid === pid), here = pid === 0 || (NET.role === 'host' ? NET.conns.has(pid) : false) || !!h;
    out.push({ pid, here, hero: h ? h.key : (NET.lobby && NET.lobby.picks[pid]) || null, away: !!(h && h.away), dead: !!(h && h.dead), lvl: G.lvl });
  }
  return out;
}
function lobbySync() { if (NET.role !== 'host' || !NET.lobby || NET.lobby.started) return; const seats = seatsNow(); for (const c of NET.conns.values()) if (c.ok) netSend(c.conn, { t: 'lb', seats }); }
function lobbyPick(k) {
  if (NET.role === 'host') { NET.lobby.picks[0] = k; lobbySync(); }
  else if (NET.role === 'client') { NET.lobbyPick = k; netSend(NET.host, { t: 'lh', hero: k }); const s = (NET.seats || []).find(x => x.pid === NET.myPid); if (s) s.hero = k; }
  const d = HERO_DEFS[k]; if (SFX.ctx) SFX.summon(); MENU.flash[NET.role === 'host' ? 0 : NET.myPid] = 1; void d;
}
function lobbyStart() {
  const k = NET.lobby.picks[0]; if (!k) return;
  NET.lobby.started = true; beginPlay(); selectHero(k); G.choiceQ = []; G.choice = null; queueDraft(true);
  for (const c of NET.conns.values()) if (c.ok) netSend(c.conn, { t: 'go' });
}
function drawSeat(c, s, x, y, w, h, mine) {
  const col = PCOL[s.pid % 4], fl = MENU.flash[s.pid] || 0, t = performance.now() / 1000;
  if (!s.here) {
    c.setLineDash([6, 6]); c.strokeStyle = 'rgba(200,170,120,0.35)'; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.setLineDash([]);
    font(c, 600, 20, F_HUD); spaced(c, 'OPEN SEAT', x + w / 2, y + h / 2 - 2, 3, 'rgba(240,228,204,0.45)', 'center');
    font(c, 500, 15, F_HUD); label(c, 'waiting for a friend' + '.'.repeat(1 + ((t * 2) | 0) % 3), x + w / 2, y + h / 2 + 22, 'rgba(200,180,150,0.45)', { align: 'center' }); return;
  }
  c.fillStyle = 'rgba(20,14,22,0.94)'; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x, y, w, 22);
  c.strokeStyle = mine ? '#ffffff' : col; c.lineWidth = mine ? 2 : 1.4; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (fl > 0) { c.shadowColor = col; c.shadowBlur = 30 * fl; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.shadowBlur = 0; MENU.flash[s.pid] = Math.max(0, fl - 1 / 60 / 1.2); }
  font(c, 600, 15, F_HUD); c.fillStyle = '#16101a'; c.textAlign = 'left'; c.fillText('P' + (s.pid + 1) + (s.pid === 0 ? ' · HOST' : '') + (mine ? ' · YOU' : ''), x + 8, y + 16);
  if (s.away) { c.textAlign = 'right'; c.fillText('AWAY', x + w - 8, y + 16); }
  if (s.hero) {
    const d = HERO_DEFS[s.hero]; sprite(c, d.spr, x + 10, y + 30, 58, s.dead ? 0.4 : 1);
    font(c, 900, 22, F_DISP); label(c, d.name, x + 76, y + 52, `rgb(${COL[d.col]})`); font(c, 500, 14, F_HUD); label(c, HERO_CLASS[s.hero], x + 76, y + 70, '#bfae90');
    font(c, 500, 14, F_HUD); label(c, G.mode === 'lobby' ? 'READY' : s.dead ? 'DOWN · RETURNS SOON' : 'IN THE FIGHT', x + 76, y + 88, G.mode === 'lobby' ? '#9fe0a0' : '#a8987e');
    font(c, 500, 13, F_HUD); label(c, HERO_QUOTE[s.hero], x + w / 2, y + h - 10, '#8f7f66', { align: 'center' });
  } else { font(c, 900, 48, F_DISP); label(c, '?', x + 38, y + 84, 'rgba(240,228,204,0.35)', { align: 'center' }); font(c, 500, 17, F_HUD); label(c, 'choosing a hero' + '.'.repeat(1 + ((t * 2) | 0) % 3), x + 76, y + 66, '#bfae90'); }
}
// ---------- screens ----------
function drawMenus(c) {
  MENU.rects = []; const k = vbox(), t = performance.now() / 1000;
  shade(c, G.mode === 'menu' ? 0.62 : 0.8); c.save(); c.translate(MENU.ox, MENU.oy); c.scale(k, k);
  if (G.mode === 'menu') {
    if (MENU.update) mbtn(c, 300, 8, 300, 34, 'NEW VERSION · TAP TO UPDATE', '', () => location.reload(), { size: 15, hot: true });
    font(c, 900, 96, F_DISP); c.shadowColor = 'rgba(255,140,50,0.9)'; c.shadowBlur = 30 + 10 * Math.sin(t * 1.7); label(c, 'Cellar of Ruin', 450, 122, '#f8ecd6', { align: 'center' }); c.shadowBlur = 0;
    font(c, 500, 20, F_HUD); spaced(c, 'SOMETHING OLD IS WAKING UNDER THE FARMHOUSE', 450, 158, 3, '#d8b888', 'center');
    font(c, 500, 17, F_HUD); label(c, 'Go down. Put it back to sleep. Try not to count the floors.', 450, 182, '#9a8c78', { align: 'center' });
    const bw = 202, gap = 12, x0 = 450 - (bw * 4 + gap * 3) / 2, y = 212, bh = 86;
    mbtn(c, x0, y, bw, bh, 'PLAY SOLO', 'One hero. Your hands.', startSolo, { hot: true });
    mbtn(c, x0 + (bw + gap), y, bw, bh, 'WATCH', 'The cellar plays itself', startWatch);
    mbtn(c, x0 + 2 * (bw + gap), y, bw, bh, 'HOST CO-OP', 'Open a room for 3 friends', startHost);
    mbtn(c, x0 + 3 * (bw + gap), y, bw, bh, 'JOIN CO-OP', 'Type a friend’s room code', startJoin);
    mbtn(c, 450 - 214, 310, 200, 34, 'HOW TO PLAY', '', () => startSolo(true), { size: 16 });
    mbtn(c, 450 + 14, 310, 220, 34, 'MOVE: ' + SCHEME_LABEL[INPUT.scheme], '', cycleScheme, { size: 16 });
    font(c, 500, 15, F_HUD); c.globalAlpha = 0.8;
    spaced(c, [MENU.best > 1 ? 'DEEPEST FLOOR REACHED · ' + MENU.best : '', SFX.ctx ? '' : 'TAP FOR SOUND'].filter(Boolean).join('   ·   '), 450, 370, 2, '#cdb890', 'center');
    font(c, 500, 14, F_HUD); spaced(c, INPUT.touch ? moveHint() + '  ·  SPELLS ON THE RIGHT  ·  BEST ON THE HOME SCREEN' : 'WASD MOVE  ·  SPACE DASH  ·  1-4 SPELLS  ·  R ULTIMATE', 450, 394, 2, '#8a7c66', 'center'); c.globalAlpha = 1;
  } else if (G.mode === 'join') {
    font(c, 900, 46, F_DISP); label(c, 'Join a Room', 450, 58, '#f8ecd6', { align: 'center' });
    font(c, 500, 16, F_HUD); spaced(c, 'TYPE THE 4 LETTERS ON YOUR FRIEND’S SCREEN', 450, 84, 2, '#bfae90', 'center');
    for (let i = 0; i < 4; i++) { const x = 450 - 2 * 74 + i * 74 + 5, ch = MENU.code[i]; c.fillStyle = 'rgba(20,14,22,0.94)'; c.fillRect(x, 98, 64, 64); c.strokeStyle = i === MENU.code.length ? '#ffd860' : 'rgba(200,160,80,0.6)'; c.lineWidth = i === MENU.code.length ? 2 : 1.2; c.strokeRect(x + 0.5, 98.5, 63, 63); if (ch) { font(c, 900, 44, F_DISP); label(c, ch, x + 32, 145, '#ffe08a', { align: 'center' }); } }
    for (let i = 0; i < CODE_ABC.length; i++) { const r = (i / 8) | 0, col = i % 8, x = 450 - (8 * 66 + 7 * 8) / 2 + col * 74, y = 178 + r * 58, ch = CODE_ABC[i]; mbtn(c, x, y, 66, 50, ch, '', () => codeKey(ch), { size: 26 }); }
    mbtn(c, 450 - 296, 360, 150, 46, 'BACK', '', () => { G.mode = MENU.back; }, { size: 18 });
    mbtn(c, 450 - 75, 360, 150, 46, 'DELETE', '', () => codeKey('DEL'), { size: 18 });
    mbtn(c, 450 + 146, 360, 150, 46, 'JOIN', '', () => netJoin(MENU.code), { size: 20, hot: MENU.code.length === 4, off: MENU.code.length < 4 });
  } else drawRoom(c, false);
  font(c, 500, 12, F_HUD); c.globalAlpha = 0.55; spaced(c, 'VERSION ' + BUILD.toUpperCase(), 890, 418, 2, '#a8987e', 'right'); c.globalAlpha = 1;
  c.restore();
  if (G.mode === 'lobby' && NET.role) { const S = VIEW.safe; drawNetIndicator(c, VIEW.w - Math.max(12, S.r + 10), Math.max(10, S.t + 8) + 14); if (NET.indRect) MENU.rects.push({ r: NET.indRect, fn: () => { NET.detail = !NET.detail; } }); }
  if (NET.statusT > 0) { NET.statusT -= 1 / 60; font(c, 600, 16, F_HUD); c.globalAlpha = Math.min(1, NET.statusT * 2); spaced(c, NET.status, VIEW.w / 2, MENU.oy + (G.mode === 'lobby' ? 291 : G.mode === 'join' ? 173 : 412) * MENU.k, 2, '#ffd860', 'center'); c.globalAlpha = 1; }
}
function drawJoinState(c) { // the guest's view until the host answers
  const f = NET.fail, t = performance.now() / 1000, dots = '.'.repeat(1 + ((t * 2) | 0) % 3);
  const msg = f ? [f.a, f.b] : NET.stage === 'NOTFOUND' ? ['ROOM ' + NET.code + ' NOT FOUND YET · TRYING AGAIN (' + NET.tries + '/10)', 'Is the host’s game open on their screen? It must not be in the background.'] : NET.stage === 'RELAY' ? ['DIRECT LINK BLOCKED · TRYING A RELAY' + dots, 'This can take a few seconds on mobile data.'] : NET.stage === 'HOST' ? ['CONNECTING TO THE HOST' + dots + '  TRY ' + (NET.attempt || 1) + ' OF 6' + (NET.relay ? ' · RELAY' : '') + (NET.ice ? ' · ' + NET.ice.toUpperCase() : ''), 'The room exists. The host’s game must be open on their screen while you join.'] : ['CONTACTING THE MATCHMAKER' + dots, 'One moment.'];
  c.fillStyle = 'rgba(16,11,18,0.92)'; c.fillRect(110, 160, 680, 120); c.strokeStyle = f ? '#ff8a6a' : 'rgba(200,160,80,0.6)'; c.lineWidth = 1.5; c.strokeRect(110.5, 160.5, 679, 119);
  font(c, 600, 22, F_HUD); spaced(c, msg[0], 450, 206, 2, f ? '#ff9a7a' : '#ffd860', 'center'); font(c, 500, 17, F_HUD); label(c, msg[1], 450, 240, '#cbbd9f', { align: 'center' });
  if (f) mbtn(c, 450 + 10, 300, 220, 48, 'TRY AGAIN', '', () => netJoin(NET.code), { size: 18, hot: true });
  mbtn(c, f ? 450 - 230 : 450 - 110, 300, 220, 48, 'BACK TO MENU', '', () => { location.href = location.pathname + peerQuery().replace('&', '?'); }, { size: 18 });
  mbtn(c, 450 - 110, 358, 220, 40, 'SHARE LOG', '', shareLog, { size: 16, hot: !!f });
  const tail = NLOG.slice(-2); font(c, 500, 12, F_HUD); tail.forEach((ln, i) => label(c, ln.length > 105 ? ln.slice(0, 105) + '…' : ln, 450, 262 + i * 13, 'rgba(200,184,150,0.6)', { align: 'center' }));
}
function drawRoom(c, inGame) {
  if (!(NET.role === 'client' && !NET.on)) { mbtn(c, 742, 380, 148, 30, 'SHARE LOG', '', shareLog, { size: 13 }); if (G.mode === 'lobby') mbtn(c, 742, 344, 148, 30, 'MOVE: ' + SCHEME_LABEL[INPUT.scheme].split(' ')[0], '', cycleScheme, { size: 13 }); } // the lobby before the descent, and the same room view over a running fight
  const seats = seatsNow(), host = NET.role === 'host', me = host ? 0 : NET.myPid, lobby = G.mode === 'lobby', n = seats.filter(s => s.here).length;
  const sk = seats.map(s => +s.here).join(''); if (sk !== MENU.seatsKey) { if (MENU.seatsKey && sk.split('1').length > MENU.seatsKey.split('1').length) { if (SFX.ctx) SFX.summon(); seats.forEach((s, i) => { if (s.here && MENU.seatsKey[i] === '0') MENU.flash[s.pid] = 1; }); } MENU.seatsKey = sk; }
  font(c, 900, 42, F_DISP); c.shadowColor = 'rgba(255,140,50,0.7)'; c.shadowBlur = 20; label(c, lobby ? 'The Cellar Door' : 'Your Room', 450, 46, '#f8ecd6', { align: 'center' }); c.shadowBlur = 0;
  font(c, 500, 15, F_HUD); spaced(c, lobby ? (host ? 'KEEP THIS SCREEN OPEN WHILE FRIENDS JOIN  ·  UP TO FOUR HEROES' : 'GATHER YOUR PARTY BEFORE THE DESCENT  ·  UP TO FOUR HEROES') : 'FRIENDS CAN DROP IN AT ANY TIME', 450, 70, 2, '#bfae90', 'center');
  if (NET.code) {
    font(c, 500, 14, F_HUD); spaced(c, 'ROOM CODE', 300, 104, 3, '#a8987e', 'center'); font(c, 900, 40, F_DISP); c.shadowColor = 'rgba(255,200,90,0.6)'; c.shadowBlur = 14; spaced(c, NET.code, 300, 134, 10, '#ffd860', 'center'); c.shadowBlur = 0;
    mbtn(c, 470, 92, 220, 48, 'SEND INVITE LINK', '', netInvite, { size: 18, hot: n < 2 });
    if (host) { const k = relayKey(), used = relayUsed() / 1048576, on = k && TURN_ICE && used < 400; font(c, 500, 13, F_HUD); spaced(c, 'RELAY', 795, 106, 3, '#a8987e', 'center');
      if (!k) mbtn(c, 712, 112, 166, 30, 'ADD RELAY KEY', '', () => { const v = prompt('Paste the Metered credentials link (or app:key)'); if (v) setRelayKey(v); }, { size: 13 });
      else { font(c, 600, 14, F_HUD); spaced(c, on ? 'ON · ' + Math.round(used) + ' / 400 MB' : used >= 400 ? 'USED UP THIS MONTH' : NET.turnErr ? 'KEY NOT ACCEPTED' : 'OFF', 795, 128, 1.5, on ? '#9fe0a0' : '#ff9a7a', 'center'); } }
  } else { font(c, 600, 20, F_HUD); spaced(c, NET.role === 'client' ? 'CONNECTING TO THE ROOM…' : 'OPENING A ROOM…', 450, 124, 3, '#ffd860', 'center'); }
  if (NET.role === 'client' && !NET.on) return drawJoinState(c);
  const sw = 205, gap = 10, x0 = 450 - (sw * 4 + gap * 3) / 2, sy = 152, sh = 124;
  seats.forEach((s, i) => drawSeat(c, s, x0 + i * (sw + gap), sy, sw, sh, s.pid === me));
  if (MENU.update && lobby) mbtn(c, 700, 10, 190, 30, 'NEW VERSION · RELOAD', '', () => location.reload(), { size: 13, hot: true });
  if (lobby) {
    const mine = (seats.find(s => s.pid === me) || {}).hero; font(c, 500, 13, F_HUD); spaced(c, 'YOUR HERO', x0, 296, 2, '#a8987e');
    ['warrior', 'pyro', 'storm', 'druid'].forEach((k, i) => { const x = x0 + i * (sw + gap), y = 302, d = HERO_DEFS[k], on = mine === k;
      c.fillStyle = on ? 'rgba(58,38,16,0.94)' : 'rgba(18,13,20,0.9)'; c.fillRect(x, y, sw, 48); c.strokeStyle = on ? '#ffd860' : `rgba(${COL[d.col]},0.6)`; c.lineWidth = on ? 2 : 1.2; c.strokeRect(x + 0.5, y + 0.5, sw - 1, 47);
      sprite(c, d.spr, x + 6, y + 4, 40); font(c, 900, 18, F_DISP); label(c, d.name, x + 52, y + 22, `rgb(${COL[d.col]})`); font(c, 500, 13, F_HUD); label(c, HERO_BLURB[k][0], x + 52, y + 40, '#a8987e'); vbtn(x, y, sw, 48, () => lobbyPick(k)); });
    mbtn(c, x0, 362, 130, 46, 'LEAVE', '', leaveLobby, { size: 18 });
    if (host) { const ready = !!NET.lobby.picks[0]; mbtn(c, 450 - 170, 360, 340, 50, ready ? 'DESCEND WITH ' + n + (n > 1 ? ' HEROES' : ' HERO') : 'CHOOSE YOUR HERO FIRST', ready ? 'late friends can still drop in' : '', lobbyStart, { size: 22, hot: ready, off: !ready }); }
    else { font(c, 600, 18, F_HUD); spaced(c, mine ? 'READY  ·  WAITING FOR THE HOST TO DESCEND' : 'PICK YOUR HERO WHILE YOU WAIT', 450 + 40, 390, 2, mine ? '#9fe0a0' : '#ffd860', 'center'); }
  } else {
    mbtn(c, 130, 300, 300, 48, host ? 'CLOSE ROOM' : 'LEAVE ROOM', '', host ? netCloseRoom : leaveLobby, { size: 18 });
    mbtn(c, 470, 300, 300, 48, 'BACK TO THE FIGHT', '', () => { NET.panel = false; }, { size: 18, hot: true });
  }
}
