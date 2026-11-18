// ===================== the hero's deaths =====================
// How he dies is chosen when he falls (heroFalls, 45_blood: deathKind) by what killed him and what stood round him:
// blown apart by a heavy slam (gore FULL), dissolved in acid, eaten by the vermin round him, beheaded by a heavy blade
// (gore FULL), down a pit (38_pits), or the bleeding out, the plain one. Each kind of death plays for its own length
// before the screen fades (deathLen: 60_run) and has its own camera (deathCam: 70_render's updateCam), and its own
// pose (deathPose) and its own beats (deathTick), both in 45_blood.
const DEATH_LEN = { bleed: 10, burst: 6.5, fall: 5, acid: 8, vermin: 9.5, behead: 10, drag: 12.5, raised: 9.5, bats: 9.5, carried: 9, looted: 9, ragdoll: 8, ticks: 10 };
const DEATH_NAMES = { bleed: 'BLED OUT', burst: 'BLOWN APART', fall: 'THE LONG FALL', acid: 'DISSOLVED IN ACID', vermin: 'EATEN BY VERMIN', behead: 'BEHEADED', drag: 'DRAGGED INTO THE DARK', raised: 'RAISED', bats: 'DRAINED BY BATS', carried: 'CARRIED OFF', looted: 'LOOTED', ragdoll: 'SHAKEN TO PIECES', ticks: 'FED ON' };
function deathLen() { let L = 0; for (const h of G.heroes) if (h.dead) L = Math.max(L, DEATH_LEN[(h.death && h.death.kind) || 'bleed'] || 8); return L || 7; }
function deathKind(h, o) {
  if (TEST.on && TEST.forceDeath) return TEST.forceDeath; // (the armour and death room's DIE: 64_testroom)
  if (GORE.level === 2 && o.big) return 'burst';
  if (o.acid) return 'acid';
  if (o.spell === 'soul') return 'raised'; // (a necromancer's soul-fire: 49_deaths2)
  { const s = h.lastSrc, n = ticksAround(h).length; if (n >= 2 && s && TICK_RE.test(s.spr || '')) return 'ticks'; if (verminBury(h)) return 'vermin'; if (n >= 2) return 'ticks'; } // (ticks: 49_deaths3)
  if (batDeath(h)) return chance(0.5) ? 'bats' : 'carried';
  { const s = h.lastSrc; if (s && s.spr === 'GoblinWolfRider' && !o.ranged) return 'ragdoll'; }
  if (goblinsAround(h).length >= 2) return 'looted';
  if (draggersAround(h).length) return 'drag';
  const s = h.lastSrc; if (GORE.level === 2 && s && s.team === 'foe' && !o.ranged && headless(h.spr) && chance(1 / 3)) return 'behead'; // (any melee kill that is no other death: a third of them; the rest, and every arrow, bolt and sling stone, bleed out)
  return 'bleed';
}
const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
// The death's camera: what it looks at, how close (a factor on the usual zoom) and how quickly it gets there (r)
function deathCam(h) {
  const D = h.death || { kind: 'bleed' }, t = h.deadT || 0;
  if (D.kind === 'fall') return { x: D.x, y: D.y - 2, z: 1 + 0.5 * ease(t / 3.5), r: 1.6 }; // held at the rim, leaning in over the dark
  if (D.kind === 'burst') return { x: h.x, y: h.y - 4, z: 1.2, r: 3 };
  if (D.kind === 'behead') { const H = D.head; if (H && t < 1) return { x: H.x, y: H.y - H.z * 0.5 - 4, z: 1.9, r: 4 }; return { x: h.x, y: h.y - (t > BEHEAD.fall ? 3 : 9), z: 1.6 + 0.25 * ease((t - 1) / 6), r: 2 }; } // after the head as it flies, then back to the body
  if (D.kind === 'acid') return { x: h.x, y: h.y - 7, z: 1.2 + 0.55 * ease(t / 5), r: 1.6 }; // in close on him as he goes down
  if (D.kind === 'vermin' || D.kind === 'bats') return { x: h.x, y: h.y - 3, z: 1.35 + 0.4 * ease(t / 3), r: 1.8 }; // on the pile
  if (D.kind === 'drag' || D.kind === 'raised' || D.kind === 'carried') return moreCam(h, D, t); // (49_deaths2)
  if (D.kind === 'looted' || D.kind === 'ragdoll' || D.kind === 'ticks') return moreCam3(h, D, t); // (49_deaths3)
  const lying = t > BLEED.fall; return { x: h.x, y: h.y - (lying ? 3 : 9), z: 1.05 + 0.6 * ease(t / 7), r: 1.4 }; // a slow push in on him: standing, kneeling, then on the floor
}

// ---- the bleeding out. After the killing blow he goes still, on his feet, the blood spurting from his chest with his
// heart; his legs go and he drops to his knees, letting his weapon go; he reels there, swaying further and further; then
// he falls back, away from whoever killed him, and bleeds out on the floor, a spurt with every beat, each weaker, the
// beat slowing, the pool spreading under him.
const BLEED = { knees: 1.1, fall: 3.5, spurts: [0.25, 0.75, 1.6, 2.3, 3.0, 4.2, 5.0, 6.0, 7.2, 8.5] };
function bleedPose(t) { return { lie: t > BLEED.fall, dip: t < BLEED.knees ? 0 : t < BLEED.knees + 0.15 ? 1 : t < BLEED.fall ? 2 : 0, jit: 0 }; }
function bleedTick(h, dt) {
  const t = h.deadT, p = t - dt, at = s => p < s && t >= s, B = BLEED;
  if (at(B.knees)) { dropWeapon(h, 1); SFX.boom(0.12, panOf(h.x)); smoke(h.x, h.y, 2, 'dust', 6, 12, 0.6); }
  h.sway = t > B.knees + 0.25 && t < B.fall ? Math.round(Math.sin((t - B.knees) * 5.2) * Math.min(2.4, (t - B.knees) * 1.3)) : 0; // reeling on his knees
  if (at(B.fall)) { SFX.boom(0.3, panOf(h.x)); shake(0.14); smoke(h.x, h.y, 3, 'dust', 8, 18, 0.8); }
  B.spurts.forEach(s => {
    if (!at(s)) return; const down = s > B.fall, k = down ? Math.max(0.25, 1 - (s - B.fall) / 6.5) : 1;
    SFX.heart(0.55 * k); if (bleeds(h)) spurt(h, k, down, s > B.knees);
  });
}
// one beat's spurt: from his chest, toward his killer while he stands or kneels; up out of him as he lies
function spurt(h, k, lying, kneel) {
  const fs = h.face < 0 ? -1 : 1, x = lying ? h.x - fs * 3 : h.x + fs * 2, z = lying ? 3 : kneel ? 6 : 9;
  for (let j = 0, n = Math.round((lying ? 12 : 16) * k); j < n; j++) part({ k: 'gore', x: x + rand(-1, 1), y: h.y + rand(-1, 1), z, vx: lying ? rand(-22, 22) * k : fs * rand(25, 80) * k, vy: rand(-12, 12) * k, vz: rand(lying ? 55 : 35, lying ? 115 : 90) * k, g: 420, life: 5, s0: chance(0.2) ? 2 : 1, col: pick(BLOOD.red), kind: 'red' });
  pool(lying ? x : h.x + fs * 4, h.y + 1, 'red', lying ? 2.4 + (1 - k) * 4 : 1.6); SFX.squelch(panOf(h.x), false);
}

// ---- the long fall (38_pits: startFall, endFall). Going over the edge he screams, and the scream falls away with him;
// then nothing for a long moment; then, far below, the impact, and its echo coming back up the shaft. The camera stays
// at the rim and leans in over the dark.
function fallTick(h, dt) {
  const t = h.deadT, p = t - dt, D = h.death;
  if (p < 1.7 && t >= 1.7) { SFX.farImpact(panOf(D.x)); shake(0.05); smoke(D.x, D.y, 2, 'dark', 6, 10, 1.4); pebbles(D.x, D.y - 2, 5); }
}

// ---- dissolved in acid. Killed by acid (a witch's flask, an ant's spit, a pool he stood in), he does not fall: he
// stands where it took him and sinks into it, slowly, then faster, shuddering now and then, the acid seething, bubbling
// and steaming round him as it eats him, a sizzle as it goes; the pool stays (harmless now) until the screen has faded.
const ACIDD = { sink0: 0.5, sink1: 5.2 };
function acidPose(t) { return { lie: false, dip: 0, jit: t > 0.3 && t < ACIDD.sink1 && ((G.time * 22) | 0) % 6 === 0 ? (((G.time * 7) | 0) % 2 ? 1 : -1) : 0 }; }
function acidStart(h) { G.hz.push({ x: h.x, y: h.y + 1, r: 17, t: 0.3, life: 1e9, dps: 0, tick: 1e9, src: null, dir: rand(TAU), deathPool: true }); acidBurn(h); }
function acidTick(h, dt) {
  const t = h.deadT, A = ACIDD, m = MOBS[h.spr], depth = (m ? m[2] : 16) + 3, u = clamp((t - A.sink0) / (A.sink1 - A.sink0), 0, 1);
  h.z = -Math.round(depth * ease(u));
  if (t < A.sink1 + 1.4 && chance(dt * 30)) { const a = rand(TAU), d = rand(1, 7); part({ k: 'glow', x: h.x + Math.cos(a) * d, y: h.y + Math.sin(a) * d * 0.6, z: rand(0, 2), vz: rand(8, 26), life: rand(0.3, 0.6), s0: rand(1, 2.2), s1: 2.8, col: 'poison', a0: 0.9, a1: 0 }); }
  if (t < A.sink1 + 0.4 && chance(dt * 7)) smoke(h.x + rand(-4, 4), h.y, 1, 'green', 6, 8, 1.2, 22);
  if (t < A.sink1 + 0.6 && ((t * 3) | 0) !== (((t - dt) * 3) | 0)) SFX.sizzle(panOf(h.x));
}
// Where he goes into the acid it eats him: the row of him at the surface fizzes yellow-green, every pixel of it flickering
// through the acid's pale shades; the row above catches here and there; a froth seethes on the surface round him, a
// little wider than he is, and goes on a moment after he is under. Drawn over him at his own pixels (70_render drawUnit).
const FIZZ = ['#f4f8a8', '#e0ef62', '#c6e23e', '#a8d42e'], FIZZ_UP = ['#9cbc2c', '#b8d03a', '#7e9e26'], FROTH = ['#eef8b0', '#d4ee70', '#a2d03c'];
const fizzH = (x, k) => (Math.imul(x + 11, 2654435761) ^ Math.imul(k + 5, 40503)) >>> 9;
function acidFizz(c, u, m, fr, bare, Wc, foot, dx) {
  const t = u.deadT, A = ACIDD; if (t < 0.25 || t > A.sink1 + 1.6) return;
  const fw = m[1], fh = m[2], d = Math.max(0, -Math.round(u.z)), row = Math.min(foot, foot + 1 - d), y0 = -foot - 1;
  const P = bare ? (Wc.pxd || (Wc.pxd = pixelData(Wc.cut))) : PIX.mobs, oy = bare ? 0 : m[0], ox = fr * fw, k = (G.time * 16) | 0;
  const op = (x, y) => y >= 0 && y < fh && P.d[((oy + y) * P.w + ox + x) * 4 + 3] > 128;
  c.save(); c.translate(Math.round(u.x + dx), Math.round(u.y - u.z)); c.scale(u.face < 0 ? -1 : 1, 1);
  let xl = 99, xr = -99;
  for (let x = 0; x < fw; x++) {
    if (op(x, row)) { xl = Math.min(xl, x); xr = Math.max(xr, x); c.fillStyle = FIZZ[fizzH(x, k) & 3]; c.fillRect(x - fw / 2, y0 + row, 1, 1); }
    if (op(x, row - 1) && fizzH(x + 40, k) % 3 === 0) { c.fillStyle = FIZZ_UP[fizzH(x, k + 9) % 3]; c.fillRect(x - fw / 2, y0 + row - 1, 1, 1); }
  }
  if (xl > xr) [xl, xr] = u.death.fizzW || [(fw >> 1) - 2, (fw >> 1) + 1]; else u.death.fizzW = [xl, xr];
  const fade = t > A.sink1 ? 1 - (t - A.sink1) / 1.6 : 1;
  for (let x = xl - 2; x <= xr + 2; x++) {
    const inner = x >= xl && x <= xr, h = fizzH(x + 90, k);
    if (h % 6 < (inner ? 2 : 3) * fade) { c.fillStyle = FROTH[(h >> 3) % 3]; c.fillRect(x - fw / 2, y0 + row + 1, 1, 1); }
  }
  c.restore();
}

// ---- eaten by vermin. Dying with three or more vermin round him (rats, beetles, ticks, ants, cockroaches, maggots, the
// skitterers), enough of them to bury him, he goes down and up to eight of them rush onto him and pile up on him, the
// later ones climbing over the first, each where it hides most of what still shows of him; they writhe there,
// skittering in place, chewing and crunching, blood squirting out of the heap; then they draw back, sated, and what
// lies there is his skeleton. He is never taken out of the picture: he lies under them, and turns to bones only in a
// frame where the heap in front of him hides every pixel of him and every pixel of the bones (verminCover).
const VERM = { lie: 0.35, hide: 1.5, back: 6.4, bulk: 2.4 }, VERMIN_RE = /Rat$|Beetle|Bedbug|Tick$|Maggot|Ant$|Cockroach|Scarab/;
const NOT_VERMIN = /^Ratkin|Wyvern|Demonling|Scamp/; // (the ratkin are folk; the pygmy wyverns and the demons' little ones do not heap him, for now)
const isVermin = f => !f.dead && !f.dying && !f.fall && !FLYERS.has(f.spr) && !NOT_VERMIN.test(f.spr) && (f.type === 'skitter' || VERMIN_RE.test(f.spr)); // (nothing that flies: the bone legion's bats are its skitters, and are the bats' death)
function verminAround(h) { return G.foes.filter(f => isVermin(f) && dist(f.x, f.y, h.x, h.y) < 110).sort((a, b) => dist(a.x, a.y, h.x, h.y) - dist(b.x, b.y, h.x, h.y)).slice(0, 8); }
// enough of them to bury him: three or more, and between them a good deal more body than he has (three rats will do,
// three ticks will not)
function verminBury(h) { const V = verminAround(h); if (V.length < 3) return false; let n = 0; for (const f of V) n += solidOf(f.spr).length; return n >= VERM.bulk * spritePixels(h.spr).length; }
// a vermin's pixels that are there in all four of its frames, from where it is drawn (its feet's middle), so a spot
// it covers stays covered while its legs work; cached
const SOLID = {};
function solidOf(spr) {
  if (SOLID[spr]) return SOLID[spr]; const m = MOBS[spr], P = PIX.mobs, fw = m[1], fh = m[2], foot = footOf(spr), out = [];
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { let all = true; for (let f = 0; f < 4 && all; f++) all = P.d[((m[0] + y) * P.w + f * fw + x) * 4 + 3] > 128; if (all) out.push([x - fw / 2, y - foot - 1]); }
  return (SOLID[spr] = out);
}
// what of him shows: drawn as the game draws it (70_render drawUnit) into a little canvas round him, as 0/1 per pixel
const COVER = { w: 72, h: 48, oy: 36 }; let coverCv = null;
function coverGrid(h, draw) {
  if (!coverCv) coverCv = mkCanvas(COVER.w, COVER.h); const c = coverCv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, COVER.w, COVER.h); c.imageSmoothingEnabled = false; c.globalAlpha = 1;
  c.translate(COVER.w / 2 - Math.round(h.x), COVER.oy - Math.round(h.y)); draw(c);
  const d = c.getImageData(0, 0, COVER.w, COVER.h).data, g = new Uint8Array(COVER.w * COVER.h); for (let i = 0; i < g.length; i++) g[i] = d[i * 4 + 3] > 0 ? 1 : 0; return g;
}
function lyingGrid(h, spr) { const was = [h.spr, h.deadT, h.hidden]; h.spr = spr; h.deadT = Math.max(h.deadT || 0, VERM.lie + 0.01); h.hidden = false; const g = coverGrid(h, c => drawUnit(c, h)); [h.spr, h.deadT, h.hidden] = was; return g; }
// what the heap turns him into out of sight: his bones (vermin), or a dried husk, the bound cadaver (the bats: 49_deaths2)
const HEAP_AFTER = { vermin: 'DecrepitBones', bats: 'BoundCadaver' }, heapAfter = h => lyingGrid(h, HEAP_AFTER[h.death.kind]);
// where each goes on him, the biggest first, each where it hides most of what still shows of him lying there (and of
// his bones), a pixel's margin round him counting a little so one skittering a pixel aside still covers him. Lying, half
// of him is in front of where he fell, so they stand as far as ten pixels forward of it (oy), and some climb (lz: how
// high), the climbing and the far forward a little less liked when it hides no more
function pileOn(h, V, lzs = [0, 2, 4, 6, 8]) { // (lzs: the heights it may climb to; bats hover higher)
  const W = COVER.w, H = COVER.h, A = lyingGrid(h, h.spr), B = heapAfter(h), wt = new Float32Array(W * H);
  for (let i = 0; i < wt.length; i++) if (A[i] || B[i]) wt[i] = 4;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!wt[i] && (wt[i - 1] === 4 || wt[i + 1] === 4 || wt[i - W] === 4 || wt[i + W] === 4)) wt[i] = 1; }
  const at = (X, Y, fs, P, fn) => { for (const [px, py] of P) { const x = X + (fs > 0 ? px : -px - 1), y = Y + py; if (x >= 0 && y >= 0 && x < W && y < H) fn(y * W + x); } };
  return V.slice().sort((a, b) => solidOf(b.spr).length - solidOf(a.spr).length).map(f => {
    const P = solidOf(f.spr); let best = null;
    for (let dx = -14; dx <= 14; dx++) for (let oy = 2; oy <= 10; oy++) for (const lz of lzs) for (const fs of [1, -1]) {
      let sc = -lz * 0.5 - oy * 0.2; at(W / 2 + dx, COVER.oy + oy - lz, fs, P, i => { sc += wt[i]; });
      if (!best || sc > best.sc) best = { sc, dx, oy, lz, fs };
    }
    at(W / 2 + best.dx, COVER.oy + best.oy - best.lz, best.fs, P, i => { wt[i] = 0; });
    return { f, ox: best.dx, oy: best.oy, lz: best.lz, fs: best.fs };
  });
}
function verminPose(t) { return { lie: t > VERM.lie, dip: t > 0.12 && t <= VERM.lie ? 2 : 0, jit: 0 }; }
function verminStart(h) { const V = verminAround(h); dropWeapon(h, 1.2); heapOn(h, V, VERM.back); }
// the heap's plan: who goes where on him, and the pixels it must hide (his and what he becomes under it); back: when
// they leave him; lzs: the heights they may climb or hover at
function heapOn(h, V, back, lzs) {
  const D = h.death; D.feeders = V;
  const A = lyingGrid(h, h.spr), B = heapAfter(h); D.T = []; for (let i = 0; i < A.length; i++) if (A[i] || B[i]) D.T.push(i);
  for (const p of pileOn(h, V, lzs)) { const f = p.f, fz = Math.max(0, f.z || 0); p.f.feed = { h, ox: p.ox, oy: p.oy, lz: p.lz, fs: p.fs, lift: fz, j: 0, jx: 0, jy: 0, back, bat: !!f.fly }; f.z = 0; f.lift = Math.round(fz); f.act = null; }
}
// how many of his pixels (and his bones') the heap leaves showing, reckoned from the vermin's solid pixels where they
// are, or with one of them (f0) a skitter's step aside (jx, jy): a step that would open a gap in the heap is not taken
function heapGaps(h, f0, jx0, jy0) {
  const D = h.death, W = COVER.w, H = COVER.h, K = D.K || (D.K = new Uint8Array(W * H)); K.fill(0);
  for (const f of D.feeders) {
    const F = f.feed; if (!F || f.dead || !F.at || F.h !== h) continue; const X = W / 2 + F.ox + (f === f0 ? jx0 : F.jx), Y = COVER.oy + F.oy + (f === f0 ? jy0 : F.jy) - Math.round(F.lift);
    for (const [px, py] of solidOf(f.spr)) { const x = X + (F.fs > 0 ? px : -px - 1), y = Y + py; if (x >= 0 && y >= 0 && x < W && y < H) K[y * W + x] = 1; }
  }
  let n = 0; for (const i of D.T) if (!K[i]) n++; return n;
}
const STEPS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 0]];
function feedTick(f, dt) { // (53_foes foeTick: a vermin at its meal)
  const F = f.feed, h = F.h, t = h.deadT || 0;
  if (!h.dead) { f.feed = null; f.lift = 0; return; }
  if (t >= F.back && F.bat) { // the bats: up off him and away into the dark, gone
    F.lift += dt * 45; f.lift = Math.round(F.lift); if (!F.away) { const a = angTo(h.x, h.y, f.x, f.y) + rand(-0.5, 0.5); F.away = { x: h.x + Math.cos(a) * 220, y: h.y + Math.sin(a) * 160 }; }
    steer(f, F.away.x, F.away.y, f.def.spd * 2.2, dt, 2); f.face = F.away.x < f.x ? -1 : 1; f.moving = true; if (F.lift > 70 || dist(f.x, f.y, h.x, h.y) > 150) f.dead = true; return;
  }
  if (t >= F.back) { // drawn back, sated: down off him and away
    F.lift = Math.max(0, F.lift - dt * 40); f.lift = Math.round(F.lift);
    if (!F.away) { const a = angTo(h.x, h.y, f.x, f.y); F.away = { x: h.x + Math.cos(a) * rand(30, 48), y: h.y + Math.sin(a) * rand(18, 30) }; } steer(f, F.away.x, F.away.y, f.def.spd, dt, 2); f.face = F.away.x < f.x ? -1 : 1; return;
  }
  const tx = h.x + F.ox, ty = h.y + F.oy;
  if (!F.at) { const d = steer(f, tx, ty, f.def.spd * (F.bat ? 2.4 : 1.7), dt, 1.5); f.face = tx < f.x ? -1 : 1; f.moving = true; if (d <= 2) F.at = true; return; }
  F.lift = F.lift > F.lz ? Math.max(F.lz, F.lift - dt * 30) : Math.min(F.lz, F.lift + dt * 30); f.lift = Math.round(F.lift); f.face = F.fs; // climbing on (or a bat settling down onto him), then held facing the way it fits
  if ((F.j -= dt) <= 0) { // skittering in place, never so as to open a gap in the heap over him
    F.j = rand(0.05, 0.12); const now = heapGaps(h, f, F.jx, F.jy);
    for (const [jx, jy] of STEPS.slice().sort(() => Math.random() - 0.5)) if (heapGaps(h, f, jx, jy) <= now) { F.jx = jx; F.jy = jy; break; }
  }
  f.x = tx + F.jx; f.y = ty + F.jy; f.vx = f.vy = 0; f.moving = true;
}
// (70_render, just before the frame is drawn) he turns to bones in a frame where the heap in front of him hides every
// pixel of him and every pixel of the bones, tested as drawn; never otherwise, so never in view
function verminCover(h) {
  const t = h.deadT, bats = h.death.kind === 'bats'; if (h.sprWas || t < VERM.hide || t >= (bats ? BATD.back : VERM.back) || !h.death.heap) return;
  const F = G.foes.filter(f => f.feed && f.feed.h === h && !f.dead && f.y > h.y).sort((a, b) => a.y - b.y); if (!F.length) return;
  const A = coverGrid(h, c => drawUnit(c, h)), B = heapAfter(h), C = coverGrid(h, c => { for (const f of F) drawUnit(c, f); });
  for (let i = 0; i < A.length; i++) if ((A[i] || B[i]) && !C[i]) return;
  h.sprWas = h.spr; h.spr = HEAP_AFTER[h.death.kind]; h.death.boned = t;
}
function verminTick(h, dt) {
  const t = h.deadT, p = t - dt, at = s => p < s && t >= s, V = h.death.feeders || [], n = V.filter(f => f.feed && f.feed.at && !f.dead).length;
  if (!h.death.heap && t > VERM.hide && t < VERM.back && n >= Math.min(3, V.length)) h.death.heap = true; // the heap has him
  if (h.death.heap && t < VERM.back) { // feeding: chewing, crunching, blood squirting out of the heap
    if (chance(dt * 9)) SFX.squelch(panOf(h.x), false); if (chance(dt * 3.5)) SFX.bone(panOf(h.x), false); if (chance(dt * 7)) SFX.tick(panOf(h.x));
    if (bleeds(h) && chance(dt * 7)) { const a = rand(TAU); for (let j = 0; j < 6; j++) part({ k: 'gore', x: h.x + rand(-6, 6), y: h.y + rand(-2, 2), z: rand(2, 6), vx: Math.cos(a) * rand(20, 60), vy: Math.sin(a) * rand(10, 40), vz: rand(30, 80), g: 420, life: 5, s0: 1, col: pick(BLOOD.red), kind: 'red' }); pool(h.x + rand(-5, 5), h.y + 1, 'red', 1.5 + t * 0.35); }
    if (chance(dt * 3)) shake(0.03);
  }
  if (at(VERM.back)) { debris(h.x, h.y - 2, 6, [BONE.L, BONE.M, BONE.D], 30, 40, 1.5); SFX.bone(panOf(h.x), true); pool(h.x, h.y + 1, 'red', 6); } // what they leave
}

// ---- beheaded. A heavy blow takes his head off at the neck: the head flies, tumbling and bleeding, bounces and rolls to
// a stop; the camera follows it, then swings back to the body, which stands on, headless, and stumbles a few tiny steps
// as the neck pumps blood high into the air with every beat of the heart, a brutal amount of it, all over the floor
// round him, the beats slowing; then the legs give, he drops to his knees and falls, and the neck pumps on, weaker,
// across the floor. The head is the hand-cut one (the Head Cut Painter: 12_heads), or the game's own cut (autoHead).
const BEHEAD = { knees: 2.8, fall: 3.3, beats: [0.32, 0.66, 1.02, 1.42, 1.86, 2.34, 2.86, 3.5, 4.3, 5.2, 6.3, 7.5] };
const HEADLESS = {};
function rot90(cv) { const o = mkCanvas(cv.height, cv.width), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(cv.height, 0); g.rotate(Math.PI / 2); g.drawImage(cv, 0, 0); return o; }
// the game's own cut, for a frame not cut by hand: the head is the top six rows of him over his face's width; under it,
// where the neck was, a small raw stump (dark at its edges)
function autoHead(d, W, ox, fw, fh, spr) {
  const fc = faceOf(spr) || { x: (fw >> 1) - 4 }, a = (x, y) => d[(y * W + ox + x) * 4 + 3] > 0, mask = new Uint8Array(fw * fh), paint = new Uint8Array(fw * fh * 4);
  let y0 = 0; while (y0 < fh - 1 && ![...Array(fw).keys()].some(x => a(x, y0))) y0++;
  const x0 = Math.max(0, fc.x), x1 = Math.min(fw, fc.x + 9), cut = y0 + 6;
  for (let y = y0; y < cut && y < fh; y++) for (let x = x0; x < x1; x++) if (a(x, y)) mask[y * fw + x] = 1;
  const xs = []; for (let x = x0; x < x1; x++) if (cut < fh && a(x, cut) && mask[(cut - 1) * fw + x]) xs.push(x);
  if (xs.length) { const cx = xs[xs.length >> 1]; for (const x of [cx - 1, cx, cx + 1]) { if (!xs.includes(x)) continue; const i = (cut * fw + x) * 4, raw = x === cx; paint[i] = raw ? 0xb8 : 0x6e; paint[i + 1] = raw ? 0x24 : 0x14; paint[i + 2] = raw ? 0x24 : 0x16; paint[i + 3] = 255; } }
  return { mask, paint };
}
// the head's own cut: painted by hand in the Head Cut Painter (its head stump layer, 12_heads hpaint: alpha 1 clears a
// pixel, above that paints it), or else drawn by the game: the middle three pixels of the cut (head pixels with the
// body right under them, where the blade went through), raw red, darker at the two ends
function rawNeck(o, mask, d0, W, fw, fh, hp) {
  if (hp) { for (let j = 0; j < fw * fh; j++) { const a = hp[j * 4 + 3], i = j * 4; if (a === 1) o[i + 3] = 0; else if (a > 1) { o[i] = hp[i]; o[i + 1] = hp[i + 1]; o[i + 2] = hp[i + 2]; o[i + 3] = 255; } } return; }
  const cut = []; for (let y = 0; y < fh - 1; y++) for (let x = 0; x < fw; x++) { const j = y * fw + x; if (mask[j] && !mask[j + fw] && d0[((y + 1) * W + x) * 4 + 3] > 0) cut.push([x, y]); }
  if (!cut.length) return; const xs = cut.map(c => c[0]).sort((a, b) => a - b), cx = xs[xs.length >> 1];
  for (const [x, y] of cut) { if (Math.abs(x - cx) > 1) continue; const i = (y * fw + x) * 4, raw = x === cx; o[i] = raw ? 0xb8 : 0x6e; o[i + 1] = raw ? 0x24 : 0x14; o[i + 2] = raw ? 0x24 : 0x16; o[i + 3] = 255; }
}
// his body without its head (his weapon already cut away) and his head on its own in its four quarter turns
function headless(spr) {
  if (HEADLESS[spr] !== undefined) return HEADLESS[spr];
  const Wc = WEAPON[spr], m = MOBS[spr]; if (!Wc || !Wc.cut || !m) return (HEADLESS[spr] = null);
  const fw = m[1], fh = m[2], W = Wc.cut.width, body = mkCanvas(W, Wc.cut.height), g = body.getContext('2d'); g.drawImage(Wc.cut, 0, 0);
  const D = g.getImageData(0, 0, W, body.height), d = D.data, d0 = d.slice(), H = HEAD_CUTS[spr] || [], head = mkCanvas(fw, fh), hg = head.getContext('2d'), HD = hg.createImageData(fw, fh); let neck = 0;
  for (let f = 0; f < 4; f++) {
    const C = H[f] || autoHead(d, W, f * fw, fw, fh, spr);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const i = (y * W + f * fw + x) * 4, j = y * fw + x;
      if (C.mask[j]) { if (f === 0) { for (let k = 0; k < 4; k++) HD.data[j * 4 + k] = d[i + k]; neck = Math.max(neck, y + 1); } d[i + 3] = 0; }
      const pa = C.paint ? C.paint[j * 4 + 3] : 0; if (pa === 1) d[i + 3] = 0; else if (pa > 1) { d[i] = C.paint[j * 4]; d[i + 1] = C.paint[j * 4 + 1]; d[i + 2] = C.paint[j * 4 + 2]; d[i + 3] = 255; }
    }
  }
  rawNeck(HD.data, (H[0] || autoHead(d0, W, 0, fw, fh, spr)).mask, d0, W, fw, fh, H[0] && H[0].hpaint);
  g.putImageData(D, 0, 0); hg.putImageData(HD, 0, 0);
  const t = tight(head), r1 = rot90(t), r2 = rot90(r1);
  return (HEADLESS[spr] = { body, rot: [t, r1, r2, rot90(r2)], neckZ: Math.max(4, footOf(spr) - neck + 1) });
}
function beheadPose(t) { return { lie: t > BEHEAD.fall, dip: t < BEHEAD.knees ? 0 : t < BEHEAD.knees + 0.15 ? 1 : t < BEHEAD.fall ? 2 : 0, jit: 0, walk: t < BEHEAD.knees }; }
function beheadStart(h, o) {
  const B = headless(h.spr); if (!B) { h.death.kind = 'bleed'; return; }
  h.headless = true; h.flash = 0; dropWeapon(h, 1.3); slowmo(0.35, 1.3);
  const a = (o.ang === undefined ? rand(TAU) : o.ang) + rand(-0.4, 0.4), v = rand(55, 85);
  const r = { rot: B.rot, r: 0, x: h.x, y: h.y + 1, z: B.neckZ + 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: rand(95, 135), spin: 0.06, t: 0, wait: 0, fade: 0, lie: 99, bleed: 'red' };
  FX.rocks.push(r); h.death.head = r; SFX.gib(panOf(h.x)); SFX.squelch(panOf(h.x), true); neckJet(h, 1.4, false);
}
// one beat out of the neck: up, high, a lot of it, spattering the floor round him; out along the floor as he lies
function neckJet(h, k, lying) {
  if (!bleeds(h)) return; const B = HEADLESS[h.spr], fs = h.face < 0 ? -1 : 1, L = lying ? lieOf(h.spr, h.scale || 1) : null;
  const x = lying ? h.x - fs * (L.half - 3) : h.x, z = lying ? 2 : B.neckZ;
  for (let j = 0, n = Math.round((lying ? 18 : 28) * k); j < n; j++) part({ k: 'gore', x: x + rand(-1, 1), y: h.y + rand(-1, 1), z, vx: lying ? -fs * rand(20, 75) * k : rand(-28, 28) * k, vy: rand(-16, 16) * k, vz: lying ? rand(30, 80) * k : rand(90, 170) * k, g: 420, life: 5, s0: chance(0.25) ? 2 : 1, col: pick(BLOOD.red), kind: 'red' });
  for (let j = 0; j < (lying ? 1 : 3); j++) pool(h.x + rand(-14, 14), h.y + rand(-6, 8), 'red', rand(1.2, 2.6) * k);
  pool(lying ? x : h.x, h.y + 1, 'red', 1.8 + (1 - k) * 4); SFX.squelch(panOf(h.x), k > 0.8);
}
// The head bleeds too, from its cut: in the air it pours out of the neck as it spins; rolling, it smears a trail; at
// rest it goes on pouring out of the neck into a pool that spreads under it, less and less, for a good while
const NECK_DIR = [[0, 1], [-1, 0], [0, -1], [1, 0]]; // (which way the cut faces in each quarter turn, 48_deaths rot90)
function headBleed(r, t, dt) {
  if (r.done || r.sink || r.wait > 0) return; const cv = r.rot[r.r], [nx, ny] = NECK_DIR[r.r], flow = Math.max(0, 1 - t / 9), moving = Math.hypot(r.vx, r.vy) > 3 || r.z > 0.5;
  const x = r.x + nx * cv.width / 2, z = Math.max(0, r.z + cv.height / 2 - ny * cv.height / 2), y = r.y + (nx ? 0 : ny > 0 ? 1 : 0);
  if ((r.pourT = (r.pourT || 0) - dt) <= 0 && flow > 0) { // pouring from the neck
    r.pourT = moving ? 0.02 : rand(0.08, 0.2) / (0.4 + flow);
    const n = moving ? 2 : chance(flow) ? 2 : 1, sp = moving ? 18 : 10 + 30 * flow;
    for (let j = 0; j < n; j++) part({ k: 'gore', x: x + rand(-1, 1), y: y + rand(-1, 1), z, vx: nx * rand(0.3, 1) * sp + r.vx * 0.3 + rand(-5, 5), vy: ny * rand(0.2, 0.6) * sp + r.vy * 0.3 + rand(-4, 4), vz: rand(-5, 25) * (0.4 + flow), g: 420, life: 5, s0: 1, col: pick(BLOOD.red), kind: 'red' });
  }
  if (r.z <= 0.5 && moving && (r.smearT = (r.smearT || 0) - dt) <= 0) { r.smearT = 0.03; bloodMark(r.x, r.y, 3, 'red'); } // a smear where it rolls
  if (!moving && (r.poolT = (r.poolT || 0) - dt) <= 0 && t < 14) { r.poolT = rand(0.3, 0.5); pool(x + nx * 2 + rand(-1, 1), r.y + ny + rand(-1, 1), 'red', 0.5 + 1.6 * flow); } // the pool under it, spreading
}
function beheadTick(h, dt) {
  const t = h.deadT, p = t - dt, at = s => p < s && t >= s, B = BEHEAD, D = h.death;
  if (t < B.knees) { // the stumble: a few tiny steps, the legs not knowing yet
    if ((D.stepT = (D.stepT || 0) - dt) <= 0) { D.stepT = rand(0.38, 0.62); D.step = { a: rand(TAU), left: rand(0.14, 0.22) }; }
    if (D.step && D.step.left > 0) { D.step.left -= dt; slideMove(h, Math.cos(D.step.a) * 16 * dt, Math.sin(D.step.a) * 11 * dt); h.moving = true; if (Math.cos(D.step.a) !== 0) h.face = Math.cos(D.step.a) < 0 ? -1 : 1; } else h.moving = false;
  } else h.moving = false;
  B.beats.forEach(s => { if (!at(s)) return; const k = s < B.fall ? 1 - s / 7 : Math.max(0.22, 0.7 - (s - B.fall) / 6); SFX.heart(0.6 * k); neckJet(h, k, t > B.fall); });
  if (D.head && bleeds(h)) headBleed(D.head, t, dt);
  if (at(B.knees)) { SFX.boom(0.12, panOf(h.x)); smoke(h.x, h.y, 2, 'dust', 6, 12, 0.6); }
  if (at(B.fall)) { SFX.boom(0.3, panOf(h.x)); shake(0.14); smoke(h.x, h.y, 3, 'dust', 8, 18, 0.8); }
}
