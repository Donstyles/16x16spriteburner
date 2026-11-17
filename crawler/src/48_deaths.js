// ===================== the hero's deaths =====================
// How he dies is chosen when he falls (heroFalls, 45_blood: deathKind) by what killed him: blown apart by a heavy slam
// (gore FULL), down a pit (38_pits), or the bleeding out, the plain one. Each kind of death plays for its own length
// before the screen fades (deathLen: 60_run) and has its own camera (deathCam: 70_render's updateCam), and its own
// pose (deathPose) and its own beats (deathTick), both in 45_blood.
const DEATH_LEN = { bleed: 10, burst: 6.5, fall: 5 };
const DEATH_NAMES = { bleed: 'BLED OUT', burst: 'BLOWN APART', fall: 'THE LONG FALL' };
function deathLen() { let L = 0; for (const h of G.heroes) if (h.dead) L = Math.max(L, DEATH_LEN[(h.death && h.death.kind) || 'bleed'] || 8); return L || 7; }
function deathKind(h, o) {
  if (TEST.on && TEST.forceDeath) return TEST.forceDeath; // (the armour and death room's DIE: 64_testroom)
  if (GORE.level === 2 && o.big) return 'burst';
  return 'bleed';
}
const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
// The death's camera: what it looks at, how close (a factor on the usual zoom) and how quickly it gets there (r)
function deathCam(h) {
  const D = h.death || { kind: 'bleed' }, t = h.deadT || 0;
  if (D.kind === 'fall') return { x: D.x, y: D.y - 2, z: 1 + 0.5 * ease(t / 3.5), r: 1.6 }; // held at the rim, leaning in over the dark
  if (D.kind === 'burst') return { x: h.x, y: h.y - 4, z: 1.2, r: 3 };
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
