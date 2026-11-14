// ===================== the training ground: any spell, any upgrade, a dummy that never falls =====================
// Solo only. No waves, no XP, the hero cannot fall. LOADOUT equips any spell of each tier and toggles every upgrade;
// the meter at the top measures damage per second on the dummies. Cooldowns are real (so the meter means something),
// but closing the loadout makes everything ready again, the ultimate too; COOLDOWNS: OFF lets every spell fire nonstop.
const TRAIN = { ready: false, open: false, wasOpen: false, dummies: 1, noCd: false, noBasic: false, mute: {}, lvl: 12, hits: [], total: 0, best: 0, rects: [], meterRect: null, respawnT: null };
const DUMMY_DEF = { name: 'TRAINING DUMMY', spr: 'ScarecrowGolem', hp: 1, spd: 0, dmg: 0, ai: 'dummy', tier: 1, blood: 'straw' };
function startTraining() {
  loadModes(); TUT.pending = false; startRun(true); G.training = true; G.cdn = 0; TRAIN.ready = false; TRAIN.open = false; trainReset(); beginPlay(); G.wave = 0;
  G.card = { t: 0, life: 2.6, a: 'Training Ground', b: 'ANY SPELL  ·  ANY UPGRADE  ·  A DUMMY THAT NEVER FALLS', c: '' };
  G.choiceQ.push({ kind: 'draft', step: 1, title: 'CHOOSE YOUR HERO', opts: Object.keys(HERO_DEFS).map(k => ({ type: 'hero', hero: k, sp: { name: HERO_CLASS[k], tier: 3 } })) });
}
function trainReset() { TRAIN.hits = []; TRAIN.total = 0; TRAIN.best = 0; }
function trainHit(d) { TRAIN.hits.push([G.time, d]); TRAIN.total += d; if (d > TRAIN.best) TRAIN.best = d; if (TRAIN.hits.length > 600) TRAIN.hits.splice(0, 200); }
function trainLevel(L) {
  const h = G.me; if (!h) return; TRAIN.lvl = clamp(L, 1, 20); G.lvl = TRAIN.lvl; G.xp = xpFor(G.lvl); scaleParty(); h.hp = h.maxHp;
  const ev = HERO_PROG[h.key].evolve; h.spr = ev && G.lvl >= ev.lvl ? ev.spr : HERO_DEFS[h.key].spr;
}
// the hero arrives with the default basic attack, the first spell of every tier and the ultimate
function trainingSetup() {
  const h = G.me, k = h.key, book = SPELLBOOK[k];
  for (let t = 1; t <= 3; t++) { const sp = book.find(s => s.tier === t && !s.basic); if (sp) { G.known.add(sp.name); G.slots[t - 1] = sp.name; } }
  G.known.add(HERO_PROG[k].ult); trainLevel(TRAIN.lvl); placeDummies(); G.phase = 'fight'; G.wave = 0; TRAIN.ready = true;
  textBanner('TRAINING GROUND', 'LOADOUT (TOP RIGHT) CHANGES SPELLS AND UPGRADES · CLOSING IT READIES EVERY SPELL', 'gold', true);
}
function placeDummies() {
  removeIf(G.units, u => u.dummy); const A = ARENA, cx = A.pw / 2, cy = A.y0 + (A.y1 - A.y0) * 0.42, n = TRAIN.dummies;
  for (let i = 0; i < n; i++) {
    const ring = i === 0 ? 0 : i <= 6 ? 1 : 2, k = ring === 1 ? (i - 1) / 6 : (i - 7) / Math.max(1, n - 7), a = k * TAU + ring * 0.5, r = ring * 30;
    const x = clamp(cx + Math.cos(a) * r, A.x0 + 10, A.x1 - 10), y = clamp(cy + Math.sin(a) * r * 0.6, A.y0 + 8, A.y1 - 6), d = mkUnit('mon', DUMMY_DEF, x, y);
    Object.assign(d, { dummy: 1, px: x, py: y, maxHp: 1e7, hp: 1e7, mul: 0, ult: 0 }); G.units.push(d); column(x, y, 'gold', 0.6, 8); smoke(x, y, 2, 'dust', 6, 12, 0.6);
  }
}
// instead of the wave director: keep the hero standing, honour the cooldown switch, bring dummies back
function trainingTick(dt) {
  if (!TRAIN.ready) { if (G.me && !G.choice && !G.choiceQ.length) trainingSetup(); return; }
  G.phase = 'fight'; G.wave = 0; const fresh = TRAIN.noCd || TRAIN.wasOpen; TRAIN.wasOpen = false;
  for (const h of G.heroes) { if (h.dead) { h.dead = false; h.deadT = 0; } h.hp = h.maxHp; if (fresh) { for (const k in h.cd) if (h.cd[k] > 0) h.cd[k] = 0; h.ultCd = 0; h.dashN = DASH_N; h.dashT = 0; } }
  if (fresh) G.ultLock = 0;
  const have = G.units.filter(u => u.dummy && !u.dead).length;
  if (have < TRAIN.dummies) { TRAIN.respawnT = (TRAIN.respawnT === null ? 1.5 : TRAIN.respawnT) - dt; if (TRAIN.respawnT <= 0) { placeDummies(); TRAIN.respawnT = null; } } else TRAIN.respawnT = null;
}
// a dummy springs back to its post and never runs out of health
function dummyAI(m, dt) { m.vx = m.vy = 0; m.moving = false; if (m.stun > 0) m.stun -= dt; m.x = damp(m.x, m.px, 2.5, dt); m.y = damp(m.y, m.py, 2.5, dt); m.hp = m.maxHp; }
function trainDps() { const now = G.time, w = TRAIN.hits.filter(q => now - q[0] < 5); if (!w.length) return 0; const span = Math.max(1, Math.min(5, now - w[0][0])); return Math.round(w.reduce((a, q) => a + q[1], 0) / span); }
function drawTrainMeter(c, W, y) {
  if (!G.training || !TRAIN.ready) { TRAIN.meterRect = null; return; }
  const txt = 'DAMAGE PER SECOND  ' + trainDps().toLocaleString() + '   ·   TOTAL  ' + Math.round(TRAIN.total).toLocaleString() + '   ·   BIGGEST HIT  ' + Math.round(TRAIN.best).toLocaleString() + '   ·   TAP TO RESET';
  font(c, 600, 13, F_HUD); let w = 0; for (const ch of txt) w += c.measureText(ch).width + 1; const x = W / 2 - w / 2 - 10;
  c.fillStyle = 'rgba(10,8,12,0.66)'; c.fillRect(x, y - 13, w + 20, 21); spaced(c, txt, W / 2, y + 2, 1, '#ffd860', 'center'); TRAIN.meterRect = [x, y - 16, w + 20, 27];
}
// ---------- LOADOUT: every spell of the hero by tier, tap to equip; the equipped spell's upgrades toggle on and off ----------
function trainEquip(t, name) { const k = G.me.key, sp = SPELLBOOK[k].find(s => s.name === name); if (!sp) return; t = sp.basic ? 0 : sp.tier; if (t === 0) { G.known.delete(G.basic[k]); G.basic[k] = name; G.known.add(name); } else if (t < 4) { const old = G.slots[t - 1]; if (old && old !== name) G.known.delete(old); G.slots[t - 1] = name; G.known.add(name); } }
function trainToggleMod(name, mn) { const taken = G.modsTaken[name] || (G.modsTaken[name] = []), i = taken.indexOf(mn); if (i >= 0) taken.splice(i, 1); else taken.push(mn); delete G.modv[name]; for (const x of taken) { const mm = (MODS[name] || []).find(q => q[0] === x); if (mm) applyMod(name, mm[2]); } }
function trainTap(x, y) { for (const r of TRAIN.rects) if (x >= r.r[0] && x <= r.r[0] + r.r[2] && y >= r.r[1] && y <= r.r[1] + r.r[3]) { if (SFX.ctx) SFX.choice(); r.fn(); return; } TRAIN.open = false; }
function drawLoadout(c) {
  TRAIN.rects = []; if (!TRAIN.open || !G.training || !G.me) return; TRAIN.wasOpen = true;
  const W = VIEW.w, H = VIEW.h, S = VIEW.safe, top = Math.max(10, S.t + 6), L = Math.max(14, S.l + 8), R = W - Math.max(14, S.r + 8), B = H - Math.max(8, S.b + 6);
  c.fillStyle = 'rgba(6,4,10,0.95)'; c.fillRect(0, 0, W, H);
  const h = G.me, k = h.key, hd = HERO_DEFS[k], book = SPELLBOOK[k], btn = (x, y, w, t, fn, hot) => { c.fillStyle = hot ? 'rgba(58,38,16,0.95)' : 'rgba(26,19,28,0.96)'; c.fillRect(x, y, w, 24); c.strokeStyle = hot ? '#ffd860' : 'rgba(200,160,80,0.55)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, 23); font(c, 600, 13, F_HUD); spaced(c, t, x + w / 2, y + 17, 1, hot ? '#ffd860' : '#e8d8b8', 'center'); TRAIN.rects.push({ r: [x, y - 3, w, 30], fn }); };
  // the switches along the top, right to left: done, dummies, cooldowns, basic attack, level; each as wide as its words
  font(c, 600, 13, F_HUD); const wOf = t => { let w = 0; for (const ch of t) w += c.measureText(ch).width + 1; return Math.ceil(w) + 18; };
  let bx = R; const next = (t, fn, hot) => { const w = Math.max(26, wOf(t)); bx -= w; btn(bx, top + 3, w, t, fn, hot); bx -= 6; };
  next('DONE', () => { TRAIN.open = false; }, true);
  next('DUMMIES: ' + TRAIN.dummies, () => { TRAIN.dummies = TRAIN.dummies === 1 ? 6 : TRAIN.dummies === 6 ? 12 : 1; placeDummies(); trainReset(); });
  next('COOLDOWNS: ' + (TRAIN.noCd ? 'OFF' : 'ON'), () => { TRAIN.noCd = !TRAIN.noCd; });
  next('BASIC ATTACK: ' + (TRAIN.noBasic ? 'OFF' : 'ON'), () => { TRAIN.noBasic = !TRAIN.noBasic; trainReset(); }, TRAIN.noBasic);
  next('+', () => trainLevel(TRAIN.lvl + 1)); bx -= 50; font(c, 600, 14, F_HUD); spaced(c, 'LEVEL ' + TRAIN.lvl, bx + 25, top + 20, 1, '#e8d8b8', 'center'); font(c, 600, 13, F_HUD); next('–', () => trainLevel(TRAIN.lvl - 1));
  fitFont(c, 900, 22, F_DISP, hd.name + '’s Loadout', bx - L - 6, 11); label(c, hd.name + '’s Loadout', L, top + 20, `rgb(${COL[hd.col]})`);
  const y0 = top + 36, gap = 5, rh = (B - y0 - gap * 4) / 5, lw = clamp(W * 0.12, 84, 118);
  for (let t = 0; t < 5; t++) {
    const y = y0 + t * (rh + gap), hex = TIER_HEX[t], list = book.filter(s => (t === 0 ? s.basic : s.tier === t && !s.basic)), eq = t === 0 ? G.basic[k] : t < 4 ? G.slots[t - 1] : HERO_PROG[k].ult;
    c.fillStyle = hex; c.fillRect(L, y, 3, rh); font(c, 600, 15, F_HUD); label(c, BOOK_ROW[t], L + 9, y + 17, hex); font(c, 500, 11, F_HUD); label(c, t === 4 ? 'ONE PER HERO' : 'TAP TO EQUIP', L + 9, y + 31, '#8f8472');
    const n = list.length, cg = 6, cw = Math.min(250, (R - L - lw - cg * (n - 1)) / n);
    list.forEach((sp, i) => {
      const x = L + lw + i * (cw + cg), on = sp.name === eq, mods = MODS[sp.name] || [], taken = G.modsTaken[sp.name] || [];
      c.fillStyle = on ? `rgba(${hexRgb(hex)},0.16)` : 'rgba(26,19,28,0.96)'; c.fillRect(x, y, cw, rh); c.strokeStyle = on ? hex : 'rgba(255,255,255,0.12)'; c.lineWidth = on ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, cw - 1, rh - 1);
      fitFont(c, 600, 15, F_HUD, sp.name, cw - 14, 10); label(c, sp.name, x + 7, y + 16, on ? '#fff4e0' : '#b8a888');
      if (on) {
        const mw = (cw - 14 - 8) / 3, my = y + rh - 22;
        mods.forEach(([mn, desc], j) => { const mx = x + 7 + j * (mw + 4), got = taken.includes(mn); c.fillStyle = got ? `rgba(${hexRgb(hex)},0.4)` : 'rgba(0,0,0,0.35)'; c.fillRect(mx, my, mw, 18); c.strokeStyle = got ? hex : 'rgba(255,255,255,0.18)'; c.lineWidth = 1; c.strokeRect(mx + 0.5, my + 0.5, mw - 1, 17); const s = (got ? '✓ ' : '') + mn; fitFont(c, 600, 11, F_HUD, s, mw - 8, 7); label(c, s, mx + mw / 2, my + 13, got ? '#ffffff' : '#a89a84', { align: 'center' }); TRAIN.rects.push({ r: [mx, my - 2, mw, 22], fn: () => trainToggleMod(sp.name, mn) }); });
        font(c, 500, 11, F_HUD); const lines = wrapText(c, SPELL_INFO[sp.name] || '', cw - 14); lines.slice(0, Math.max(0, Math.floor((rh - 22 - 30 + 2) / 12) + 1)).forEach((ln, j) => label(c, ln, x + 7, y + 30 + j * 12, '#a89a84'));
      } else { font(c, 500, 11, F_HUD); const lines = wrapText(c, SPELL_INFO[sp.name] || '', cw - 14); lines.slice(0, Math.max(1, Math.floor((rh - 26) / 12))).forEach((ln, j) => label(c, ln, x + 7, y + 30 + j * 12, '#7f7466')); TRAIN.rects.push({ r: [x, y, cw, rh], fn: () => trainEquip(t, sp.name) }); }
    });
  }
}
