// ===================== how some creatures move =====================
// The mutilated stumbler shuffles: slow lurching steps with a stop between them, swaying as it drags itself on, rot
// dripping off it and groaning (more once it has seen you); it never sleeps, and idle it shuffles about aimlessly. The dismembered crawler scuttles: no faster than any other flanker, but its
// limbs scrabble at a quicker cadence. The tunneling mole travels under the floor: all
// you see is a mound of earth moving, throwing up dirt and leaving a furrow; it bursts up out of the floor to strike, and
// a blow on the mound knocks it up into the open for a moment.
const GAIT = { MutilatedStumbler: 'shuffle', DismemberedCrawler: 'scuttle', TunnelingMole: 'burrow' };
function gaitTick(f, dt) {
  const g = GAIT[f.spr]; if (!g || f.dead) return; const F = f.gait || (f.gait = { ph: rand(2), t: 0, mode: 0, dug: 0 }); F.t += dt;
  const busy = f.act || f.stun > 0 || f.dying || f.state === 'sleep';
  if (g === 'shuffle') {
    F.ph += dt * 1.9; const s = Math.max(0, Math.sin(F.ph * Math.PI)); // one step a beat: lurch forward, stop
    f.gaitK = busy ? 1 : 0.12 + 0.6 * s * s; f.animK = 0.55; f.sway = f.moving && !busy ? Math.round(Math.sin(F.ph * Math.PI * 0.5)) : 0;
    if (f.moving && (F.drip = (F.drip || 0) - dt) <= 0) { F.drip = rand(0.25, 0.6); drip(f.x + rand(-2, 2), f.y + rand(-1, 1), rand(3, 8), 'sludge'); }
    if (chance(dt * (f.aware ? 0.24 : 0.09)) && G.me && dist(f.x, f.y, G.me.x, G.me.y) < 220) SFX.groan(panOf(f.x)); // groaning as it goes, more once it has you
  } else if (g === 'scuttle') { // a flanker's pace, but its limbs go quicker than anyone's
    f.animK = 1.35; f.gaitK = 1; f.sway = 0;
  } else if (g === 'burrow') {
    const t = f.tgt, far = t && !t.dead && dist(f.x, f.y, t.x, t.y) > 18; // (after a strike it dives again as soon as it is up long enough to be hit)
    if (f.under && (busy || !f.moving || !far || (f.upT || 0) > G.time)) emerge(f, !!f.act);
    else if (!f.under && f.aware && f.moving && far && !busy && (f.upT || 0) < G.time) { f.under = true; F.wx = undefined; debris(f.x, f.y, 6, DIRT, 50, 70, 1.4); SFX.dig(panOf(f.x)); }
    if (f.under) { // the furrow, the dirt thrown up, and a wake of heaped earth sinking back behind the mound
      if (F.wx === undefined) { F.wx = f.x; F.wy = f.y; } // its trail: a hump every 2 px of the way, filled in however far it went this frame
      const wd = Math.hypot(f.x - F.wx, f.y - F.wy);
      if (wd >= 2) { const n = Math.min(40, Math.floor(wd / 2)); for (let i = 1; i <= n; i++) { const k = i * 2 / wd; FX.wake.push({ x: F.wx + (f.x - F.wx) * k, y: F.wy + (f.y - F.wy) * k, t: 0, life: 1.8, s: rand(0.9, 1.1) }); } const k = n * 2 / wd; F.wx += (f.x - F.wx) * k; F.wy += (f.y - F.wy) * k; if (FX.wake.length > 600) FX.wake.splice(0, FX.wake.length - 600); }
      if ((F.dug -= dt) <= 0) { F.dug = 0.07; const x = Math.round(f.x + rand(-2, 2)), y = Math.round(f.y + rand(-1, 1)); groundPaint(x - 2, y - 2, x + 3, y + 2, gc => { gc.fillStyle = 'rgba(48,34,22,0.45)'; gc.fillRect(x, y, 2, 1); }); if (chance(0.5)) debris(f.x, f.y, 1, DIRT, 30, 50, 1.2); }
      if (chance(dt * 2)) SFX.dig(panOf(f.x));
    }
  }
}
const DIRT = ['#5a4636', '#7a604a', '#3e3026', '#8a7058'];
function emerge(f, strike) {
  f.under = false; f.upT = G.time + (strike ? 1.4 : 1.2); // after its strike it stays up a moment: the time to hit it
  debris(f.x, f.y, strike ? 16 : 10, DIRT, 90, 130, 1.6); smoke(f.x, f.y, 3, 'dust', 8, 18, 0.8); SFX.crack(panOf(f.x));
}
// its wake: humps of turned earth, close enough to run together into one ridge whichever way it went, sinking back into
// the floor from the tail end
function updateWake(dt) { for (const w of FX.wake) w.t += dt; removeIf(FX.wake, w => w.t >= w.life); }
function drawWake(c) { // lit from the top left: the dark body of every hump, its lit top and left edges, then the dark
  // inside of every hump again, so where humps overlap the lit edges inside the ridge are covered and only its outline shows
  const hump = w => { const k = 1 - w.t / w.life; return { k, x: Math.round(w.x), y: Math.round(w.y), hw: Math.max(1, Math.round(3.5 * k * w.s)), hh: k > 0.5 ? 3 : k > 0.2 ? 2 : 1 }; };
  const H = FX.wake.map(hump);
  for (const h of H) { c.globalAlpha = Math.min(1, h.k * 2); c.fillStyle = '#3e3026'; c.fillRect(h.x - h.hw, h.y - h.hh + 1, h.hw * 2 + 1, h.hh); }
  for (const h of H) { if (h.k < 0.2) continue; c.globalAlpha = Math.min(1, h.k * 2); c.fillStyle = '#6a5440'; c.fillRect(h.x - h.hw, h.y - h.hh + 1, h.hw * 2 + 1, 1); c.fillRect(h.x - h.hw, h.y - h.hh + 1, 1, h.hh); }
  for (const h of H) { if (h.hh < 2) continue; c.globalAlpha = Math.min(1, h.k * 2); c.fillStyle = '#3e3026'; c.fillRect(h.x - h.hw + 1, h.y - h.hh + 2, h.hw * 2, h.hh - 1); }
  c.globalAlpha = 1;
}
// the mound: a hump of turned earth that heaves as it goes
function drawMound(c, u) {
  const x = Math.round(u.x), y = Math.round(u.y), b = ((G.time * 10 + u.id) | 0) % 2;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 5, y, 11, 1);
  c.fillStyle = '#3e3026'; c.fillRect(x - 5, y - 2, 11, 2); c.fillRect(x - 3, y - 4 - b, 7, 2 + b);
  c.fillStyle = '#5a4636'; c.fillRect(x - 4, y - 3, 9, 1); c.fillRect(x - 2, y - 5 - b, 5, 2);
  c.fillStyle = '#8a7058'; c.fillRect(x - 1, y - 5 - b, 2, 1); c.fillRect(x + 2, y - 3, 1, 1); c.fillRect(x - 4, y - 2, 1, 1);
}
