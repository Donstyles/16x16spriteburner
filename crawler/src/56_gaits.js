// ===================== how some creatures move =====================
// The mutilated stumbler shuffles: slow lurching steps with a stop between them, swaying as it drags itself on, rot
// dripping off it and a groan now and then. The dismembered crawler scuttles: quick bursts at a frantic cadence, freezing
// between them, twitching, jerking aside, never quite where you expect. The tunneling mole travels under the floor: all
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
    if (f.aware && chance(dt * 0.12)) SFX.groan(panOf(f.x));
  } else if (g === 'scuttle') {
    f.animK = 2.6;
    if (busy) { f.gaitK = 1; f.sway = 0; return; }
    if ((F.mode -= dt) <= 0) {
      F.dash = !F.dash; F.mode = F.dash ? rand(0.16, 0.34) : rand(0.07, 0.22);
      if (F.dash && f.moving) { const a = Math.atan2(f.vy, f.vx) + (chance(0.5) ? 1 : -1) * Math.PI / 2, k = rand(20, 45); f.kx += Math.cos(a) * k; f.ky += Math.sin(a) * k * 0.8; } // jerking aside
      if (!F.dash && chance(0.3)) f.face = -f.face; // a twitch round
    }
    f.gaitK = F.dash ? 1.75 : 0; f.sway = !F.dash && f.moving ? (((G.time * 50) | 0) % 2 ? 1 : 0) : 0;
  } else if (g === 'burrow') {
    const t = f.tgt, far = t && !t.dead && dist(f.x, f.y, t.x, t.y) > 30;
    if (f.under && (busy || !f.moving || !far || (f.upT || 0) > G.time)) emerge(f, !!f.act);
    else if (!f.under && f.aware && f.moving && far && !busy && (f.upT || 0) < G.time) { f.under = true; debris(f.x, f.y, 6, DIRT, 50, 70, 1.4); SFX.dig(panOf(f.x)); }
    if (f.under) { // the furrow and the dirt thrown up behind the mound
      if ((F.dug -= dt) <= 0) { F.dug = 0.07; const x = Math.round(f.x + rand(-2, 2)), y = Math.round(f.y + rand(-1, 1)); groundPaint(x - 2, y - 2, x + 3, y + 2, gc => { gc.fillStyle = 'rgba(48,34,22,0.45)'; gc.fillRect(x, y, 2, 1); }); if (chance(0.5)) debris(f.x, f.y, 1, DIRT, 30, 50, 1.2); }
      if (chance(dt * 2)) SFX.dig(panOf(f.x));
    }
  }
}
const DIRT = ['#5a4636', '#7a604a', '#3e3026', '#8a7058'];
function emerge(f, strike) {
  f.under = false; f.upT = G.time + (strike ? 0.6 : 1.4); debris(f.x, f.y, strike ? 16 : 10, DIRT, 90, 130, 1.6); smoke(f.x, f.y, 3, 'dust', 8, 18, 0.8); SFX.crack(panOf(f.x));
}
// the mound: a hump of turned earth that heaves as it goes
function drawMound(c, u) {
  const x = Math.round(u.x), y = Math.round(u.y), b = ((G.time * 10 + u.id) | 0) % 2;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 5, y, 11, 1);
  c.fillStyle = '#3e3026'; c.fillRect(x - 5, y - 2, 11, 2); c.fillRect(x - 3, y - 4 - b, 7, 2 + b);
  c.fillStyle = '#5a4636'; c.fillRect(x - 4, y - 3, 9, 1); c.fillRect(x - 2, y - 5 - b, 5, 2);
  c.fillStyle = '#8a7058'; c.fillRect(x - 1, y - 5 - b, 2, 1); c.fillRect(x + 2, y - 3, 1, 1); c.fillRect(x - 4, y - 2, 1, 1);
}
