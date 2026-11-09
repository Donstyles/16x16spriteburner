// ===================== player choice: pick 1 of 3 powers on level-up and after bosses =====================
const DEFMOD = { dmg: 1, size: 1, dur: 1, count: 0, cd: 1, f: {} };
function md(name) { return (G.modv && G.modv[name]) || DEFMOD; }
function applyMod(name, eff) { const m = G.modv[name] || (G.modv[name] = { dmg: 1, size: 1, dur: 1, count: 0, cd: 1, f: {} }); if (eff.dmg) m.dmg *= eff.dmg; if (eff.size) m.size *= eff.size; if (eff.dur) m.dur *= eff.dur; if (eff.count) m.count += eff.count; if (eff.cd) m.cd *= eff.cd; if (eff.f) m.f[eff.f] = true; }
const TIER_MIN = [1, 2, 5, 9, 12], TIER_LABEL = ['BASIC', 'LOW', 'MEDIUM', 'HIGH', 'ULTIMATE'], TIER_HEX = ['#c8b48c', '#d8a060', '#8fb8ff', '#ffd860', '#ff6a4a'];
const STARTING = ['SLASH', 'EMBER BOLT', 'SPARK', 'PEBBLE', 'MEND'];
const SPELL_INFO = {
  'SLASH': 'Sword strike in an arc', 'SHIELD BASH': 'Dash in and stun with the shield', 'LUNGE': 'Dashing thrust through a distant foe', 'RISING SLASH': 'Launch a foe and cut it in the air', 'BLADE FLURRY': 'A storm of cuts on one target', 'SWORD WAVE': 'Fling a crescent of steel that cuts through lines', 'GROUND POUND': 'Hop and slam the floor around him', 'CHARGE': 'Bull-rush that scatters a crowd', 'WHIRLWIND': 'Spin through everything nearby', 'THOUSAND CUTS': 'Blink between a dozen foes; they all burst at once', 'CATACLYSM': 'Leap into the horde and split the floor',
  'EMBER BOLT': 'A small fire dart', 'CINDER SPRAY': 'Cone of flame', 'IMMOLATE': 'Set a foe ablaze; it bursts when it dies', 'BLAZING DARTS': 'A volley of fire darts', 'FLAME WALL': 'Raise a wall of burning pillars', 'HEAT RAY': 'A continuous beam of fire', 'FIRE SERPENTS': 'Weaving homing fire that explodes', 'MAGMA POOLS': 'Lob globs that leave burning lava', 'FIREBALL': 'The classic. A big explosion', 'FLAME NOVA': 'A ring of fire around Ignis', 'METEOR STORM': 'Call flaming rocks from the sky',
  'SPARK': 'A single bolt', 'STATIC CHARGE': 'Shock everything close by', 'SHOCK ORB': 'A crackling orb that stuns', 'GUST': 'Blast foes back with wind', 'LIGHTNING LANCE': 'A piercing line of lightning', 'TESLA COIL': 'Plant a coil that zaps nearby foes', 'ARC FIELD': 'Electrify the ground under a crowd', 'CHAIN LIGHTNING': 'Lightning that leaps foe to foe', 'BALL LIGHTNING': 'A drifting orb that zaps all around it', 'ARC CANNON': 'A massive sweeping lightning laser', 'THUNDERSTORM': 'Bolts from the ceiling, one after another',
  'PEBBLE': 'A thrown stone', 'MEND': 'Heal the most hurt hero', 'THORN LASH': 'Whip of thorns that roots a foe', 'REJUVENATE': 'Healing over time', 'ENTANGLE': 'Roots hold a crowd in place', 'STONE FIST': 'A giant fist bursts from the floor', 'INSECT SWARM': 'A biting cloud that follows its prey', 'BOULDER ROLL': 'Roll a boulder through the horde', 'STONE SPIKES': 'A line of erupting spikes', 'MASS HEAL': 'Heal the whole party', 'RESURRECTION': 'Bring a fallen hero back', 'EARTHQUAKE': 'Shake the cellar apart',
};
// three modifiers per spell: [name, what it does, effect, requires]
const MODS = {
  'SLASH': [['CRUSHING BLOW', 'Every 4th swing is a launching finisher', { f: 'crush' }], ['SHOCKWAVE BLOWS', 'Finishers crack the floor', { f: 'shock' }, 'CRUSHING BLOW'], ['SWIFT BLADE', 'Swing 40% faster', { cd: 0.6 }]],
  'SHIELD BASH': [['HEAVY SHIELD', '+60% damage', { dmg: 1.6 }], ['SHOCKWAVE BASH', 'Stuns everyone around the impact', { f: 'wide' }], ['QUICK RECOVERY', 'Cooldown -40%', { cd: 0.6 }]],
  'LUNGE': [['PIERCING LUNGE', 'Longer reach, wider hits', { size: 1.5 }], ['DOUBLE LUNGE', 'Lunge again at another foe', { count: 1 }], ['BLEEDING EDGE', '+60% damage', { dmg: 1.6 }]],
  'RISING SLASH': [['SKY LAUNCHER', 'Launch foes higher', { size: 1.4 }], ['AIR COMBO', 'Two more hits in the air', { count: 2 }], ['WIDE ARC', 'Launch everyone nearby', { f: 'wide' }]],
  'BLADE FLURRY': [['MORE CUTS', '+4 cuts', { count: 4 }], ['FINISHING CUT', 'Final cut +50% damage', { dmg: 1.5 }], ['FLURRY HASTE', 'Cooldown -40%', { cd: 0.6 }]],
  'SWORD WAVE': [['TWIN WAVES', 'Fire two crescents', { count: 1 }], ['GREAT CRESCENT', 'Bigger wave', { size: 1.6 }], ['LONG REACH', 'Waves fly farther', { dur: 1.6 }]],
  'GROUND POUND': [['AFTERSHOCK', 'A second slam follows', { count: 1 }], ['WIDE POUND', 'Bigger shockwave', { size: 1.5 }], ['CRATER', '+60% damage', { dmg: 1.6 }]],
  'CHARGE': [['LONG CHARGE', 'Charge farther', { dur: 1.5 }], ['TRAMPLE', '+60% damage', { dmg: 1.6 }], ['STAMPEDE', 'Charge back through them', { count: 1 }]],
  'WHIRLWIND': [['LONG SPIN', 'Spin 60% longer', { dur: 1.6 }], ['WIDE SPIN', 'Bigger spin', { size: 1.5 }], ['VORTEX', 'Pull foes into the blades', { f: 'pull' }]],
  'THOUSAND CUTS': [['TEN THOUSAND', '+8 targets', { count: 8 }], ['DEEP CUTS', '+60% damage', { dmg: 1.6 }], ['SWIFT STEPS', 'Cooldown -35%', { cd: 0.65 }]],
  'CATACLYSM': [['GREATER CATACLYSM', 'Bigger slam', { size: 1.4 }], ['DOUBLE LEAP', 'Leap and slam again', { count: 1 }], ['MOLTEN FISSURES', 'Leaves pools of lava', { f: 'lava' }]],
  'EMBER BOLT': [['TWIN EMBERS', 'Throw two embers', { count: 1 }], ['HOT EMBERS', '+50% damage', { dmg: 1.5 }], ['KINDLING', 'Embers set foes on fire', { f: 'burn' }]],
  'CINDER SPRAY': [['WIDE CONE', 'Wider, longer cone', { size: 1.5 }], ['LONG SPRAY', 'Spray 60% longer', { dur: 1.6 }], ['SEARING', '+60% damage', { dmg: 1.6 }]],
  'IMMOLATE': [['SPREADING FLAMES', 'Bigger spread on death', { size: 1.6 }], ['INFERNO', '+70% damage', { dmg: 1.7 }], ['TWIN BRANDS', 'Ignite a second foe', { count: 1 }]],
  'BLAZING DARTS': [['MORE DARTS', '+3 darts', { count: 3 }], ['BIGGER DARTS', 'Bigger blasts', { size: 1.4 }], ['RAPID VOLLEY', 'Cooldown -40%', { cd: 0.6 }]],
  'FLAME WALL': [['LONG WALL', 'Longer wall', { size: 1.6 }], ['LASTING FLAMES', 'Burns 70% longer', { dur: 1.7 }], ['CROSSFIRE', 'A second wall crosses the first', { count: 1 }]],
  'HEAT RAY': [['WIDER BEAM', 'A fatter beam', { size: 1.6 }], ['LONG BURN', 'Beam lasts 60% longer', { dur: 1.6 }], ['SEARING RAY', '+60% damage', { dmg: 1.6 }]],
  'FIRE SERPENTS': [['MORE SERPENTS', '+3 serpents', { count: 3 }], ['GREAT SERPENTS', 'Bigger explosions', { size: 1.5 }], ['HUNGRY SERPENTS', '+50% damage', { dmg: 1.5 }]],
  'MAGMA POOLS': [['MORE POOLS', '+3 pools', { count: 3 }], ['WIDE POOLS', 'Bigger pools', { size: 1.5 }], ['LASTING MAGMA', 'Pools last 70% longer', { dur: 1.7 }]],
  'FIREBALL': [['TWIN FIREBALLS', 'A second fireball follows', { count: 1 }], ['GREATER BLAST', 'Bigger explosion', { size: 1.4 }], ['CLUSTER BOMBS', 'Scatters four smaller blasts', { f: 'cluster' }]],
  'FLAME NOVA': [['WIDE NOVA', 'Bigger ring', { size: 1.5 }], ['DOUBLE NOVA', 'A second pulse follows', { count: 1 }], ['SEARING NOVA', '+60% damage', { dmg: 1.6 }]],
  'METEOR STORM': [['MORE METEORS', '+5 meteors', { count: 5 }], ['GIANT METEORS', 'Bigger meteors', { size: 1.4 }], ['MOLTEN CRATERS', 'Impacts leave lava', { f: 'lava' }]],
  'SPARK': [['FORKED SPARK', 'Jumps to a second foe', { count: 1 }], ['HOT SPARK', '+50% damage', { dmg: 1.5 }], ['RAPID SPARK', 'Fires 30% faster', { cd: 0.7 }]],
  'STATIC CHARGE': [['MORE ARCS', '+3 targets', { count: 3 }], ['LONG REACH', 'Bigger radius', { size: 1.5 }], ['OVERCHARGE', '+60% damage', { dmg: 1.6 }]],
  'SHOCK ORB': [['TWIN ORBS', 'Fire a second orb', { count: 1 }], ['BIG BURST', 'Bigger burst', { size: 1.6 }], ['PARALYZE', 'Stuns 80% longer', { dur: 1.8 }]],
  'GUST': [['HURRICANE', 'Bigger blast', { size: 1.5 }], ['TWIN GUST', 'Blasts both ways', { count: 1 }], ['RAZOR WIND', 'Double damage', { dmg: 2 }]],
  'LIGHTNING LANCE': [['TRIPLE LANCE', 'Three lances in a fan', { count: 2 }], ['THICK LANCE', 'Wider lance', { size: 1.6 }], ['OVERLOAD', '+60% damage', { dmg: 1.6 }]],
  'TESLA COIL': [['TWIN COILS', 'Plant two coils', { count: 1 }], ['LONG CHARGE', 'Coils last 60% longer', { dur: 1.6 }], ['WIDE ARC', 'Bigger zap range', { size: 1.4 }]],
  'ARC FIELD': [['WIDE FIELD', 'Bigger field', { size: 1.5 }], ['LONG FIELD', 'Lasts 60% longer', { dur: 1.6 }], ['HIGH VOLTAGE', '+60% damage', { dmg: 1.6 }]],
  'CHAIN LIGHTNING': [['MORE JUMPS', '+4 jumps', { count: 4 }], ['THICK BOLTS', '+50% damage', { dmg: 1.5 }], ['FAST RECHARGE', 'Cooldown -40%', { cd: 0.6 }]],
  'BALL LIGHTNING': [['TWIN BALLS', 'Release two balls', { count: 1 }], ['LONG LIFE', 'Balls last 60% longer', { dur: 1.6 }], ['BIG DISCHARGE', 'Bigger final blast', { size: 1.5 }]],
  'ARC CANNON': [['WIDER BEAM', 'A fatter beam', { size: 1.6 }], ['LONG BLAST', 'Fires 50% longer', { dur: 1.5 }], ['WIDE SWEEP', 'Sweeps twice as wide', { f: 'sweep' }]],
  'THUNDERSTORM': [['LONGER STORM', 'Storm lasts 50% longer', { dur: 1.5 }], ['HEAVY STRIKES', 'Bigger strikes', { size: 1.4 }], ['FORK STORM', 'Strikes come faster', { count: 1 }]],
  'PEBBLE': [['TRIPLE PEBBLES', 'Throw three stones', { count: 2 }], ['HEAVY STONE', '+60% damage', { dmg: 1.6 }], ['QUICK SLING', 'Throws 35% faster', { cd: 0.65 }]],
  'MEND': [['DEEP MEND', '+60% healing', { dmg: 1.6 }], ['QUICK MEND', 'Cooldown -40%', { cd: 0.6 }], ['SHARED MEND', 'Also heals the next hurt hero', { count: 1 }]],
  'THORN LASH': [['TWIN LASH', 'Lash a second foe', { count: 1 }], ['LONG THORNS', 'Roots 50% longer', { size: 1.5 }], ['BARBED', '+70% damage', { dmg: 1.7 }]],
  'REJUVENATE': [['LONG BLOOM', 'Lasts 60% longer', { dur: 1.6 }], ['STRONG BLOOM', '+60% healing', { dmg: 1.6 }], ['GROUP BLOOM', 'Two more heroes bloom', { count: 2 }]],
  'ENTANGLE': [['WIDE ROOTS', 'Bigger area', { size: 1.5 }], ['LONG ROOTS', 'Holds 60% longer', { dur: 1.6 }], ['THORNY ROOTS', 'Roots deal heavy damage', { dmg: 2.5 }]],
  'STONE FIST': [['TWIN FISTS', 'A second fist erupts', { count: 1 }], ['GIANT FIST', 'Bigger fist', { size: 1.5 }], ['CRUSHING', '+60% damage', { dmg: 1.6 }]],
  'INSECT SWARM': [['TWO SWARMS', 'Release a second swarm', { count: 1 }], ['LONG SWARM', 'Lasts 60% longer', { dur: 1.6 }], ['WASP SWARM', '+70% damage', { dmg: 1.7 }]],
  'BOULDER ROLL': [['AVALANCHE', 'Three boulders in a fan', { count: 2 }], ['GIANT BOULDER', 'Bigger boulder', { size: 1.5 }], ['LONG ROLL', 'Rolls 50% longer', { dur: 1.5 }]],
  'STONE SPIKES': [['MORE SPIKES', '+6 spikes per line', { count: 6 }], ['SPIKE FAN', 'Three lines of spikes', { f: 'fan' }], ['SHARPENED', '+60% damage', { dmg: 1.6 }]],
  'MASS HEAL': [['GREATER HEAL', '+60% healing', { dmg: 1.6 }], ['QUICK HEAL', 'Cooldown -40%', { cd: 0.6 }], ['REGROWTH', 'Also heals over time', { f: 'regen' }]],
  'RESURRECTION': [['SWIFT RETURN', 'Cooldown -45%', { cd: 0.55 }], ['FULL LIFE', 'Return with full health', { dmg: 2 }], ['WRATH OF LIFE', 'The return blasts foes away', { f: 'blast' }]],
  'EARTHQUAKE': [['LONG QUAKE', 'Lasts 50% longer', { dur: 1.5 }], ['HEAVY QUAKE', '+50% damage', { dmg: 1.5 }], ['ROCK RAIN', 'Far more falling rocks', { count: 2 }]],
};
function resetSpells() { G.known = new Set(STARTING); G.modsTaken = {}; G.modv = {}; G.choice = null; G.choiceQ = []; }
const knownCount = k => SPELLBOOK[k].filter(sp => G.known.has(sp.name)).length + Object.keys(G.modsTaken).filter(n => SPELLBOOK[k].some(sp => sp.name === n)).length * 0.3;
function candidates() {
  const news = [], mods = [];
  for (const k in SPELLBOOK) for (const sp of SPELLBOOK[k]) {
    if (!G.known.has(sp.name)) { if (sp.tier > 0 && G.lvl >= TIER_MIN[sp.tier]) news.push({ type: 'spell', hero: k, sp }); continue; }
    const taken = G.modsTaken[sp.name] || [];
    for (const [name, desc, eff, req] of MODS[sp.name] || []) if (!taken.includes(name) && (!req || taken.includes(req))) mods.push({ type: 'mod', hero: k, sp, mod: { name, desc, eff }, n: taken.length });
  }
  return { news, mods };
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = randi(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function genChoices(boss) {
  const { news, mods } = candidates(), out = [], used = new Set();
  shuffle(news).sort((a, b) => b.sp.tier - a.sp.tier); shuffle(mods); if (boss) mods.sort((a, b) => b.sp.tier - a.sp.tier);
  const wantNew = Math.min(news.length, mods.length ? 2 : 3);
  for (const o of news) { if (out.length >= wantNew) break; if (out.some(x => x.hero === o.hero) && news.some(x => !out.includes(x) && !out.some(y => y.hero === x.hero))) continue; out.push(o); used.add(o.sp.name); }
  for (const o of news) { if (out.length >= wantNew) break; if (!out.includes(o)) { out.push(o); used.add(o.sp.name); } }
  for (const o of mods) { if (out.length >= 3) break; if (used.has(o.sp.name)) continue; out.push(o); used.add(o.sp.name); }
  for (const o of [...news, ...mods]) { if (out.length >= 3) break; if (!out.includes(o) && !used.has(o.sp.name)) { out.push(o); used.add(o.sp.name); } }
  return out;
}
function queueChoice(kind, title) { G.choiceQ.push({ kind, title }); }
function openChoice(q) {
  const opts = genChoices(q.kind === 'boss'); if (!opts.length) return;
  G.choice = { kind: q.kind, title: q.title || ('LEVEL ' + G.lvl), opts, t: 0, auto: window.CR_AUTO || 12, hover: -1, picked: -1, pickT: 0, rects: [] }; SFX.choice();
}
function autoIndex(c) { let best = 0, bs = -1e9; c.opts.forEach((o, i) => { const s = (o.type === 'spell' ? 12 + o.sp.tier * 4 : 4 + o.sp.tier * 2) - knownCount(o.hero) * 0.8 + Math.random() * 2; if (s > bs) { bs = s; best = i; } }); return best; }
function pickChoice(i) {
  const c = G.choice; if (!c || c.picked >= 0 || !c.opts[i]) return; c.picked = i; c.pickT = 0; const o = c.opts[i], h = G.heroes.find(x => x.key === o.hero);
  if (o.type === 'spell') { G.known.add(o.sp.name); pushBanner({ a: o.sp.name, b: h.def.name + ' LEARNS A ' + TIER_LABEL[o.sp.tier] + ' SPELL', col: h.def.col, keep: true, life: 2.1 }); }
  else { (G.modsTaken[o.sp.name] = G.modsTaken[o.sp.name] || []).push(o.mod.name); applyMod(o.sp.name, o.mod.eff); pushBanner({ a: o.mod.name, b: o.sp.name + ' UPGRADED · ' + o.mod.desc.toUpperCase(), col: h.def.col, keep: true, life: 2.1 }); }
  if (h && !h.dead) { column(h.x, h.y, h.def.col, 1.2, 12); ring(h.x, h.y, 36, h.def.col, 0.5, 4); flashLight(h.x, h.y, 110, h.def.col, 1.5, 0.6); }
  SFX.levelup();
}
function updateChoice(rdt) {
  const c = G.choice;
  if (!c) { if (G.choiceQ.length && (G.phase === 'fight' || G.phase === 'clear') && !G.card && G.fade < 0.2) openChoice(G.choiceQ.shift()); return; }
  c.t += rdt; if (c.picked < 0) { if (c.t >= c.auto) pickChoice(autoIndex(c)); } else if ((c.pickT += rdt) > 0.6) G.choice = null;
}
// ---------- drawing ----------
function wrapText(c, s, w) { const out = []; let line = ''; for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (c.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; } if (line) out.push(line); return out; }
function drawChoice(c) {
  const ch = G.choice; if (!ch) return; const W = VIEW.w, H = VIEW.h, S = VIEW.safe, fade = Math.min(1, ch.t * 4) * (ch.picked >= 0 ? 1 - Math.min(1, ch.pickT / 0.6) : 1);
  c.globalAlpha = fade; c.fillStyle = 'rgba(6,4,10,0.78)'; c.fillRect(0, 0, W, H);
  const wide = W >= 620, top = Math.max(14, S.t + 8);
  font(c, 900, wide ? 34 : 26, F_DISP); c.shadowColor = 'rgba(255,200,90,0.8)'; c.shadowBlur = 18; label(c, ch.kind === 'level' ? 'LEVEL ' + G.lvl : ch.title, W / 2, top + (wide ? 30 : 24), '#fff1d0', { align: 'center' }); c.shadowBlur = 0;
  font(c, 500, 15, F_HUD); spaced(c, ch.kind === 'level' ? 'CHOOSE A POWER' : 'CLAIM ONE REWARD', W / 2, top + (wide ? 50 : 42), 3, '#c8a878', 'center');
  const n = ch.opts.length, gap = 12, areaTop = top + (wide ? 62 : 52), areaH = H - areaTop - Math.max(40, S.b + 34);
  const cw = wide ? Math.min(230, (W - 2 * Math.max(16, S.l + 8) - gap * (n - 1)) / n) : Math.min(W - 32, 460), chh = wide ? Math.min(areaH, 250) : (areaH - gap * (n - 1)) / n;
  const x0 = wide ? W / 2 - (cw * n + gap * (n - 1)) / 2 : W / 2 - cw / 2;
  ch.rects = [];
  ch.opts.forEach((o, i) => {
    const x = wide ? x0 + i * (cw + gap) : x0, y = wide ? areaTop : areaTop + i * (chh + gap), hov = ch.hover === i, pk = ch.picked === i, tier = o.sp.tier, hex = TIER_HEX[tier], hd = HERO_DEFS[o.hero], m = MOBS[G.heroes.find(h => h.key === o.hero).spr];
    ch.rects.push([x, y, cw, chh]);
    c.save(); c.globalAlpha = fade * (ch.picked >= 0 && !pk ? 0.35 : 1); const lift = (hov || pk ? -4 : 0) + (ch.t < 0.35 ? (1 - ch.t / 0.35) * 30 * (i + 1) : 0); c.translate(0, lift);
    c.fillStyle = 'rgba(22,16,24,0.96)'; c.fillRect(x, y, cw, chh); c.strokeStyle = hex; c.lineWidth = pk ? 3 : hov ? 2.5 : 1.5; c.strokeRect(x + 0.5, y + 0.5, cw - 1, chh - 1);
    if (pk || hov) { c.shadowColor = hex; c.shadowBlur = 24; c.strokeRect(x + 0.5, y + 0.5, cw - 1, chh - 1); c.shadowBlur = 0; }
    c.fillStyle = hex; c.fillRect(x, y, cw, 18); font(c, 600, 13, F_HUD); c.fillStyle = '#16101a'; c.textAlign = 'left'; c.fillText((o.type === 'mod' ? 'UPGRADE · ' : 'NEW SPELL · ') + TIER_LABEL[tier], x + 8, y + 14);
    c.textAlign = 'right'; c.fillText(String(i + 1), x + cw - 8, y + 14);
    const sz = wide ? 52 : Math.min(48, chh - 34), sx = x + 10, sy = y + 24; c.imageSmoothingEnabled = false; c.fillStyle = `rgba(${COL[hd.col]},0.18)`; c.fillRect(sx - 2, sy - 2, sz + 4, sz + 4); c.drawImage(IMG.mobs, 0, m[0], m[1], m[2], sx, sy, sz, sz * m[2] / m[1]);
    const tx = wide ? x + 12 : sx + sz + 12, tw = wide ? cw - 24 : cw - (sz + 34);
    let ty = wide ? sy + sz + 22 : y + 40;
    font(c, 600, 13, F_HUD); label(c, hd.name, wide ? sx + sz + 10 : tx, wide ? sy + 16 : y + 34, `rgb(${COL[hd.col]})`);
    font(c, 500, 11, F_HUD); label(c, heroTitle(G.heroes.find(h => h.key === o.hero)), wide ? sx + sz + 10 : tx + c.measureText(hd.name).width * 1.25 + 8, wide ? sy + 30 : y + 34, '#8f8472');
    if (!wide) ty = y + 56;
    const title = o.type === 'mod' ? o.mod.name : o.sp.name; font(c, 900, wide ? 21 : 18, F_DISP); for (const ln of wrapText(c, title, tw).slice(0, 2)) { label(c, ln, tx, ty, '#fff4e0'); ty += wide ? 21 : 18; }
    font(c, 500, wide ? 15 : 14, F_HUD); const desc = o.type === 'mod' ? o.sp.name + ': ' + o.mod.desc : SPELL_INFO[o.sp.name] || '';
    for (const ln of wrapText(c, desc, tw).slice(0, wide ? 4 : 2)) { label(c, ln, tx, ty + 2, '#cbbd9f'); ty += wide ? 16 : 15; }
    const ups = MODS[o.sp.name] || [], taken = G.modsTaken[o.sp.name] || [], room = (y + chh - 8) - (ty + 10);
    if (ups.length && room > 30) { ty += 10; font(c, 600, 11, F_HUD); spaced(c, o.type === 'mod' ? 'ALL UPGRADES' : 'POSSIBLE UPGRADES', tx, ty, 1.5, '#7f7466'); ty += 4; for (const [mn] of ups) { if (ty + 14 > y + chh - 6) break; ty += 14; const got = taken.includes(mn), now = o.type === 'mod' && o.mod.name === mn; font(c, 500, 13, F_HUD); label(c, (got ? '✓ ' : now ? '▸ ' : '· ') + mn, tx, ty, now ? hex : got ? '#9fd8a0' : '#a89a84'); } }
    if (o.type === 'mod') { const taken = (G.modsTaken[o.sp.name] || []).length; for (let k = 0; k < 3; k++) { c.fillStyle = k < taken ? hex : k === taken ? '#ffffff' : 'rgba(255,255,255,0.15)'; c.fillRect(x + cw - 14 - (2 - k) * 10, y + chh - 12, 7, 5); } }
    c.restore();
  });
  c.globalAlpha = fade;
  if (ch.picked < 0) { const left = Math.max(0, ch.auto - ch.t), bw = Math.min(W * 0.5, 320), by = H - Math.max(22, S.b + 18); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(W / 2 - bw / 2, by, bw, 3); c.fillStyle = '#ffd860'; c.fillRect(W / 2 - bw / 2, by, bw * left / ch.auto, 3); font(c, 500, 14, F_HUD); spaced(c, 'TAP A CARD  ·  THE PARTY CHOOSES IN ' + Math.ceil(left), W / 2, by - 6, 2, '#bfae90', 'center'); }
  c.globalAlpha = 1;
}
function choiceAt(x, y) { const ch = G.choice; if (!ch) return -1; for (let i = 0; i < ch.rects.length; i++) { const [rx, ry, rw, rh] = ch.rects[i]; if (x >= rx && x <= rx + rw && y >= ry - 6 && y <= ry + rh + 6) return i; } return -1; }
