// ===================== the report: what a floor is and what happened on it, to paste to whoever is fixing it =====================
// The pause menu (the menu button, top right) shows the run's seed and has a LOG button: it lays out, as plain text, the build, the seed and the floor
// (enough to make the very floor again: replayFloor, below), where the hero is, how the floor's works stand (the way
// down, its gates, plates, water and cracked walls), who is still on their feet and the last few dozen things that
// happened, in a box to copy from (a COPY button, or select it by hand).

// the log: the floor's events as they happen, the last eighty kept
function logEv(k, o) { if (!G.log) G.log = []; G.log.push(Object.assign({ t: +(G.time || 0).toFixed(1), f: G.floor, k }, o || {})); if (G.log.length > 80) G.log.shift(); }
const tileOf = u => Math.floor(u.x / TS) + ',' + Math.floor(u.y / TS);

// a reported floor made again (bug reports and test scripts): the run's seed, the floor, the army before it, and whether
// it was a catacombs floor from the test menu (theme crypt)
function replayFloor(o) {
  MAGMA.force = o.theme === 'magma' && !(o.floor >= 7 && o.floor <= 9); CRYPT.force = o.theme === 'crypt' && !(o.floor >= 4 && o.floor <= 6); // (floors 4 to 6 are the crypt anyway, named as in a run)
  G.nextSeed = typeof o.seed === 'string' ? parseInt(o.seed, 16) >>> 0 : o.seed >>> 0; startRun(o.kit || 'sellsword');
  G.floor = o.floor || 1; G.army = o.prevArmy || null; G.seedsUsed = new Set(); startFloor(); G.mode = 'play';
}

function buildReport() {
  const A = ARENA, h = G.me, s = A && A.stairs, L = [], alive = G.foes.filter(f => !f.dead);
  L.push('CELLAR OF RUIN II  REPORT');
  L.push(`build ${BUILD} | seed ${hex8(G.seed)} | floor ${G.floor} | floor seed ${hex8(G.floorSeed || 0)} | kit ${G.kit} | heroes ${G.heroes.length} | army ${A.army} | army before ${G.prevArmy || '-'} | theme ${A.th.name}`);
  L.push(`time ${(G.time || 0).toFixed(1)} | phase ${G.phase}${TEST.on ? ' | test room ' + TEST.mode : ''}${GAL.on ? ' | gallery' : ''} | kills ${G.kills} | gold ${G.gold}`);
  if (h) L.push(`hero at ${Math.round(h.x)},${Math.round(h.y)} (tile ${tileOf(h)}) | hp ${Math.round(h.hp)}/${h.maxHp} | flasks ${h.flasks}${h.dead ? ' | dead' : ''}`);
  L.push(`floor: ${A.name}${archName(A) ? ' | ' + archName(A) : ''} | sets ${(A.sets || []).join(',') || '-'} | puzzles ${(A.puzNames || []).join(',') || '-'}`);
  if (s) { const g = s.seal, left = g && g.guards ? g.guards.filter(f => !f.dead && G.foes.includes(f)) : []; L.push(`way down: tile ${s.sx + 1},${s.sy + 1} | ${g ? (g.k > 0 ? 'SEALED' : 'open') : 'open'}${g ? ' | exit guards left ' + left.length + (left.length ? ': ' + left.map(f => f.spr + '@' + tileOf(f) + (f.aware ? '' : ' asleep')).join(', ') : '') : ''}`); }
  for (const g of A.gates || []) L.push(`gate ${g.how || 'gate'} ${g.d.side} at ${g.d.cells[1].join(',')} | k ${g.k.toFixed(2)}${g.hold ? ' | held' : ''}`);
  for (const p of A.plates || []) L.push(`plate at ${p.tx},${p.ty}${p.down ? ' | down' : ''}${p.hidden ? ' | hidden' : ''}${p.remote ? ' | remote' : ''}${p.gate ? ' | gate' : ''}${p.pool ? ' | drains water' : ''}`);
  for (const p of A.pools || []) L.push(`water at ${p.x0},${p.y0}-${p.x1},${p.y1} | ${['full', 'draining', 'drained', 'refilling'][p.drain || 0]}${p.bridge ? ' | bridge' : ''}`);
  for (const c of A.cracks || []) L.push(`cracked wall at ${c.x},${c.y} | holds ${c.holds}${c.open ? ' | broken' : ' | hp ' + c.hp}`);
  L.push(`creatures alive ${alive.length}` + (alive.length ? ': ' + (h ? alive.slice().sort((a, b) => dist(a.x, a.y, h.x, h.y) - dist(b.x, b.y, h.x, h.y)) : alive).slice(0, 12).map(f => f.spr + '@' + tileOf(f) + (f.exitGuard ? ' exit' : '') + (f.guard ? ' treasure' : '')).join(', ') : ''));
  L.push('events (oldest first):');
  for (const e of (G.log || []).slice(-40)) { const { t, f, k, ...o } = e; L.push(`  ${t}s f${f} ${k}` + Object.entries(o).filter(([, b]) => b !== undefined && b !== null).map(([a, b]) => ' ' + a + '=' + b).join('')); }
  return L.join('\n');
}

// the box: the report in a text field, already selected, with COPY and CLOSE (real page buttons: a copy needs a tap the
// browser counts as the player's own)
function showReport() {
  const old = document.getElementById('report'); if (old) old.remove(); const txt = buildReport();
  const box = document.createElement('div'); box.id = 'report';
  box.style.cssText = 'position:fixed;inset:0;z-index:50;background:rgba(6,5,8,0.92);display:flex;flex-direction:column;gap:10px;padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));box-sizing:border-box';
  const ta = document.createElement('textarea'); ta.value = txt; ta.readOnly = true;
  ta.style.cssText = 'flex:1;width:100%;box-sizing:border-box;background:#14110e;color:#f0e0c0;border:1px solid #6a5a44;border-radius:6px;padding:8px;font:12px/1.35 ui-monospace,Menlo,Consolas,monospace;resize:none';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;justify-content:center';
  const mk = (label, fn, col) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = `font:600 16px system-ui,sans-serif;padding:10px 22px;border-radius:8px;border:1px solid ${col};background:#1e1914;color:${col}`; b.onclick = fn; row.appendChild(b); return b; };
  const copy = mk('COPY', () => { ta.select(); const done = () => { copy.textContent = 'COPIED'; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => { try { document.execCommand('copy'); done(); } catch (e) { copy.textContent = 'SELECT AND COPY'; } }); else { try { document.execCommand('copy'); done(); } catch (e) { copy.textContent = 'SELECT AND COPY'; } } }, '#ffd860');
  mk('CLOSE', () => box.remove(), '#e8d8b8');
  box.appendChild(ta); box.appendChild(row); document.body.appendChild(box); ta.focus(); ta.select();
}
