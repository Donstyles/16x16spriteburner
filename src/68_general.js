// ===================== Aldric, the general: he points, the army answers =====================
// Nothing fights on the ground beside him. Archers appear on the back wall, cannons roll out at the side walls and
// wolf riders thunder across a lane: each is an effect that strikes and is gone. He marks a target (marked foes take
// 25% more from him), and he plants standards that make every hero under them hit harder and take less.
COL.scarlet = [240, 80, 60];
SPARK_PAL.scarlet = ['#ffffff', '#ffd0c0', '#ff6a4a', '#b02a1a'];
HERO_DEFS.general = { name: 'ALDRIC', title: 'GENERAL', spr: 'General', hp: 330, spd: 46, r: 5, role: 'caster', col: 'scarlet', dmg: 27 };
HERO_PROG.general = { titles: [[1, 'CAPTAIN'], [5, 'COMMANDER'], [10, 'FIELD MARSHAL'], [15, 'LORD MARSHAL']], ult: 'TOTAL WAR', evolve: { lvl: 10, spr: 'FieldMarshal' } };
DEFAULT_BASIC.general = 'MARK TARGET'; HERO_CLASS.general = 'THE GENERAL';
HERO_BLURB.general = ['WAR · COMMAND · RANGED', 'He points, the army answers: volleys, cannons, cavalry and banners.', ['ARROW VOLLEY', 'CANNON SHOT', 'TOTAL WAR']];
HERO_QUOTE.general = '“Hold the line. Then break theirs.”';
SFX.gun = function (pan = 0) { if (!this.ok('gun', 0.05)) return; this.noise(this.white, 0.12, 'lowpass', 3200, 500, 0.7, 0.4, pan); this.tone('sine', 140, 50, 0.16, 0.4, pan); };
SFX.twang = function (pan = 0) { if (!this.ok('twang', 0.05)) return; this.tone('triangle', 540, 300, 0.12, 0.07, pan); this.noise(this.white, 0.05, 'highpass', 3000, 5000, 0.7, 0.05, pan); };
SFX.cannon = function (pan = 0) { if (!this.ok('cannon', 0.12)) return; this.noise(this.brown, 0.7, 'lowpass', 700, 80, 0.8, 0.75, pan); this.tone('sine', 75, 30, 0.55, 0.6, pan); };
SFX.horn = function () { if (!this.ok('horn', 1.5)) return; this.tone('sawtooth', 196, 196, 0.8, 0.07, 0, 0, 0.08); this.tone('sawtooth', 294, 294, 0.9, 0.06, 0, 0.32, 0.08); this.tone('sawtooth', 392, 392, 1.1, 0.05, 0, 0.62, 0.1); };
SFX.hoof = function (pan = 0) { if (!this.ok('hoof', 0.07)) return; this.noise(this.brown, 0.07, 'lowpass', 420, 120, 1, 0.32, pan); };

const IRON = { dark: '#1e1e24', mid: '#3a3a44', hi: '#8a8a96' }, WOOD = { dark: '#3a2414', mid: '#6a4428', hi: '#9a6a3a' };
const marked = f => f.filter(u => u.markT > 0);
// a point for called-in fire: a marked crowd first, then the densest crowd
function aimPoint(h, f, r, maxD) { const mk = marked(f); if (mk.length) { const d = densest(mk, r, h, maxD); if (d) return d; } return densest(f, r, h, maxD); }
// arrows or shells in flight: each is [x0, y0, x1, y1, launch time, flight time]; sorted by landing so the host can count them off
function flights(list) { return list.sort((a, b) => (a[4] + a[5]) - (b[4] + b[5])).map(a => a.map(v => Math.round(v * 100) / 100)); }
function volley(h, pts, o = {}) {
  const A = ARENA, fr = o.from, ar = pts.map((p, i) => lob(fr && fr.length ? fr[(i * 5) % fr.length] + rand(-3, 3) : clamp(p.x + (chance(0.5) ? -1 : 1) * rand(90, 140), A.x0 + 6, A.x1 - 6), A.y0 - 4, p.x, p.y, (o.spread || 0) * i / Math.max(1, pts.length - 1) + rand(0, 0.08)));
  return hazard({ k: 'volley', ar: flights(ar), z0: fr ? 9 : 20, arc: 50, r: o.r || 9, dmg: o.dmg, fire: o.fire ? 1 : 0, mark: o.mark ? 1 : 0, tid: o.tid || 0, life: Math.max(...ar.map(a => a[4] + a[5])) + 0.3, src: h });
}
function archers(n, x, spread, life) { const A = ARENA, xs = []; for (let i = 0; i < n; i++) xs.push(Math.round(clamp(x + (i - (n - 1) / 2) * spread, A.x0 + 8, A.x1 - 8))); return hazard({ k: 'archers', xs, wy: Math.round(A.y0 - 2), life }); }
function cannonAt(side, y, fireAt, life) { const A = ARENA, dir = side < 0 ? 1 : -1; return hazard({ k: 'cannon', x: side < 0 ? A.x0 + 3 : A.x1 - 3, y: clamp(y, A.y0 + 6, A.y1 - 4), dir, fireAt, life }); }

// ---------- one-off effects ----------
Object.assign(HFX, {
  shot(x0, y0, x1, y1) { FX.beams.push({ x0, y0, x1, y1, w: 0.5, col: 'gold', t: 0, life: 0.07 }); for (let i = 0; i < 6; i++) part({ k: 'pix', x: x0 + rand(-2, 2), y: y0, z: 8, vx: rand(-15, 15), vy: rand(-8, 8), vz: rand(10, 30), life: rand(0.5, 0.9), s0: chance(0.4) ? 2 : 1, col: chance(0.5) ? '#c8c0b0' : '#8a8478' }); sparks(x1, y1, 6, 4, 'gold', 70, 50); SFX.gun(panOf(x0)); },
  cannonFire(x, y, dir) { for (let i = 0; i < 16; i++) part({ k: 'pix', x: x + dir * rand(6, 14), y: y + rand(-3, 3), z: rand(4, 10), vx: dir * rand(20, 70), vy: rand(-12, 12), vz: rand(5, 30), drag: 1.2, life: rand(0.6, 1.2), s0: chance(0.4) ? 2 : 1, col: chance(0.5) ? '#d8d0c0' : '#9a9488' }); sparks(x + dir * 10, y, 6, 8, 'fire', 120, 60); flashLight(x + dir * 10, y, 70, 'fire', 1.4, 0.15); shake(0.25); SFX.cannon(panOf(x)); },
  blast(x, y, R) { ring(x, y, R, 'fire', 0.3, 4); sparks(x, y, 6, 12, 'fire', 160, 120); smoke(x, y, 8, 'dark', R * 0.5, 40, 1.3, 10); debris(x, y, 8, ['#5a5048', '#7d7064', '#3a3430'], 120, 160, 1.4); scorch(x, y, R * 0.6, 0.55); flashLight(x, y, R * 3, 'fire', 1.6, 0.25); shake(0.3); SFX.boom(0.6, panOf(x)); },
  grapeBurst(x, y, R) { ring(x, y, R, 'gold', 0.3, 3); for (let i = 0; i < 40; i++) part({ k: 'pix', x: x + rand(-R, R) * 0.8, y: y + rand(-R, R) * 0.5, z: rand(14, 30), vx: rand(-20, 20), vy: rand(-10, 10), vz: -rand(60, 140), g: 400, life: 0.5, s0: chance(0.3) ? 2 : 1, col: chance(0.6) ? '#c8c0b0' : '#ffd860' }); sparks(x, y, 22, 10, 'gold', 140, 90); smoke(x, y - 10, 4, 'grey', 10, 20, 0.9, 20); flashLight(x, y, R * 2, 'gold', 1.2, 0.2); SFX.gun(panOf(x)); SFX.boom(0.4, panOf(x)); },
  grape(x, y, a, cone) { for (let i = 0; i < 30; i++) { const aa = a + rand(-cone, cone), sp = rand(260, 420); part({ k: 'spark', x: x + Math.cos(a) * 12, y: y + Math.sin(a) * 9, z: 8, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.75, drag: 2, life: rand(0.25, 0.4), col: chance(0.5) ? 'gold' : 'white' }); } },
  rally(x, y) { ring(x, y, 50, 'gold', 0.5, 5); column(x, y, 'gold', 1, 12); for (let i = 0; i < 18; i++) part({ k: 'pix', x: x + rand(-10, 10), y: y + rand(-5, 5), z: rand(4, 20), vz: rand(40, 110), g: 150, life: rand(0.6, 1.1), s0: chance(0.3) ? 2 : 1, col: chance(0.5) ? '#ffd860' : '#fff4c0' }); SFX.horn(); },
  plant(x, y, big) { ring(x, y, big ? 40 : 24, 'gold', 0.4, 4); debris(x, y, 6, ['#5a5048', '#7d7064'], 60, 80, 1.1); smoke(x, y, 4, 'dust', 8, 20, 0.8); SFX.hit(panOf(x)); if (big) SFX.horn(); },
  caltropHit(x, y) { sparks(x, y, 3, 6, 'white', 90, 60); for (let i = 0; i < 4; i++) part({ k: 'pix', x, y, z: 2, vx: rand(-30, 30), vy: rand(-15, 15), vz: rand(30, 70), g: 400, life: 0.4, s0: 1, col: '#b8c0cc' }); SFX.clang(panOf(x)); },
  scatter(x, y, R) { for (let i = 0; i < 14; i++) part({ k: 'pix', x, y, z: 10, vx: rand(-R, R) * 3, vy: rand(-R, R) * 2, vz: rand(30, 80), g: 400, life: 0.35, s0: 1, col: IRON.hi }); SFX.pop(panOf(x)); },
});
// ---------- continuous effects ----------
Object.assign(HAZFX, {
  volley(z, dt) {
    const A = z.ar; z._l = z._l || 0; z._p = z._p || 0;
    while (z._l < A.length && z.t >= A[z._l][4]) { z._l++; SFX.twang(panOf(A[z._l - 1][0])); }
    while (z._p < A.length && z.t >= A[z._p][4] + A[z._p][5]) { const a = A[z._p++], g = ARENA && ARENA.g, x = Math.round(a[2] + rand(-2, 2)), y = Math.round(a[3] + rand(-1, 1)); if (g) { g.fillStyle = WOOD.mid; g.fillRect(x, y - 3, 1, 3); g.fillStyle = '#e8e4dc'; g.fillRect(x, y - 4, 1, 1); } for (let i = 0; i < 4; i++) part({ k: 'pix', x, y, z: 1, vx: rand(-25, 25), vy: rand(-10, 10), vz: rand(20, 50), g: 300, life: 0.4, s0: 1, col: i ? '#9a8a76' : '#ffffff' }); sparks(x, y, 3, 2, z.fire ? 'fire' : 'white', 40, 30); if (z.fire) light(x, y, 30, 'fire', 0.8); }
    for (const a of A) { const p = arcAt(a, z.t, z.z0, z.arc); if (!p) continue; if (chance(0.6)) part({ k: 'pix', x: p.x - p.nx * 7, y: p.y, z: p.h + p.ny * 7 * -1, life: 0.14, s0: 1, col: z.fire ? '#ffb040' : '#f8f0e0' }); if (z.fire) light(p.x, p.y, 18, 'fire', 0.6); }
  },
  cball(z, dt) { if (chance(0.7)) part({ k: 'pix', x: z.x - z.dir * 3, y: z.y, z: (z.h || 0) + 2, vx: -z.dir * rand(5, 20), vz: rand(5, 15), drag: 1, life: rand(0.4, 0.8), s0: chance(0.3) ? 2 : 1, col: chance(0.5) ? '#c8c0b0' : '#8a8478' }); },
  shells(z, dt) { for (const a of z.ar) { const p = arcAt(a, z.t, 6, 70); if (p && chance(0.5)) part({ k: 'pix', x: p.x, y: p.y, z: p.h, life: 0.4, s0: 1, col: '#9a9488' }); } },
  cavalry(z, dt) { if ((z._h = (z._h || 0) - dt) <= 0) { z._h = 0.11; SFX.hoof(panOf(z.x)); } if (chance(dt * 30)) smoke(z.x - z.dir * rand(4, 50), z.y + rand(-z.w, z.w) * 0.8, 1, 'dust', 4, 16, 0.8, 4); },
  standard(z, dt) { light(z.x, z.y - 14, z.big ? 90 : 60, 'gold', 0.5); if (chance(dt * 6)) { const a = rand(TAU); part({ k: 'pix', x: z.x + Math.cos(a) * z.r * rand(0.3, 1), y: z.y + Math.sin(a) * z.r * 0.55, z: 1, vz: rand(15, 40), g: 0, drag: 0.5, life: rand(0.6, 1.1), s0: 1, col: '#ffd860' }); } },
});
// ---------- pixel art: archers on the wall, arrows, cannons, shot, riders, standards, caltrops ----------
function pxLine(c, x, y, nx, ny, cols, thick = 1) { const w = thick > 1 && Math.abs(ny) > Math.abs(nx) ? thick : 1, hh = thick > 1 && Math.abs(ny) <= Math.abs(nx) ? thick : 1; for (let k = 0; k < cols.length; k++) { c.fillStyle = cols[k]; c.fillRect(Math.round(x - nx * k), Math.round(y - ny * k), w, hh); } }
function drawSprite(c, name, x, y, fr, flip, a = 1) { const m = MOBS[name]; if (!m) return; c.save(); c.globalAlpha = a; c.translate(Math.round(x), Math.round(y)); if (flip) c.scale(-1, 1); c.drawImage(IMG.mobs, fr * m[1], m[0], m[1], m[2], -m[1] / 2, -m[2], m[1], m[2]); c.restore(); }
function lob(x0, y0, x1, y1, t0) { const d = dist(x0, y0, x1, y1); return [x0, y0, x1, y1, t0, clamp(0.45 + d / 300, 0.55, 1.15), clamp(d * 0.32, 25, 85)]; }
function flankX(x) { const A = ARENA, l = x - A.x0, r = A.x1 - x; return x + (l > r ? -1 : 1) * Math.min(130, Math.max(l, r) - 14); }
function arcAt(a, t, z0, arc) { const u = (t - a[4]) / a[5]; if (u < 0 || u > 1) return null; const H = a[6] !== undefined ? a[6] : arc, x = lerp(a[0], a[2], u), y = lerp(a[1], a[3], u), h = z0 * (1 - u) + 4 * H * u * (1 - u), dh = -z0 + 4 * H * (1 - 2 * u); let nx = a[2] - a[0], ny = (a[3] - a[1]) - dh; const l = Math.hypot(nx, ny) || 1; return { x, y, h, nx: nx / l, ny: ny / l }; }
Object.assign(HAZDRAW.fx, {
  // a glint on every arrowhead so a volley sparkles as it comes in
  volley(c, z) { for (const a of z.ar) { const p = arcAt(a, z.t, z.z0, z.arc); if (!p) continue; c.globalAlpha = 0.7; c.drawImage(GLOW[z.fire ? 'fire' : 'white'], p.x - 4, p.y - p.h - 4, 8, 8); } c.globalAlpha = 1; },
});
Object.assign(HAZDRAW.world, {
  archers(c, z) { c.imageSmoothingEnabled = false; const a = clamp(Math.min(z.t * 5, (z.life - z.t) * 5), 0, 1), fr = ((z.t * 8) | 0) % 4; for (const x of z.xs) drawSprite(c, 'Bowman', x, z.wy, fr, false, a); },
  volley(c, z) {
    const head = z.fire ? ['#fff0c0', '#ffb040'] : ['#ffffff', '#c8c8d0'], cols = [...head, '#f0d8a8', '#e8c890', '#d8b07a', '#e8c890', '#e0503a', '#ff7a5a'];
    for (const a of z.ar) { const p = arcAt(a, z.t, z.z0, z.arc); if (!p) continue; c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(Math.round(p.x) - 1, Math.round(p.y), 2, 1); pxLine(c, p.x + 1, p.y - p.h + 1, p.nx, p.ny, cols.map(() => '#24140c'), 2); pxLine(c, p.x, p.y - p.h, p.nx, p.ny, cols, 2); }
  },
  cannon(c, z) {
    const life = clamp(Math.min(z.t * 6, (z.life - z.t) * 5), 0, 1), d = z.dir, x0 = Math.round(z.x - d * (1 - life) * 14), y = Math.round(z.y); let rec = 0; for (const f of z.fireAt || []) if (z.t >= f && z.t < f + 0.25) rec = Math.round((1 - (z.t - f) / 0.25) * 3);
    const x = x0 - d * rec, bx = d > 0 ? x : x - 12; c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 6, y, 14, 2);
    c.fillStyle = IRON.dark; c.fillRect(bx, y - 8, 12, 4); c.fillStyle = IRON.mid; c.fillRect(bx, y - 7, 12, 2); c.fillStyle = IRON.hi; c.fillRect(bx + 1, y - 8, 10, 1); c.fillStyle = IRON.dark; c.fillRect(d > 0 ? bx + 11 : bx, y - 9, 1, 6); // barrel and muzzle ring
    c.fillStyle = WOOD.dark; c.fillRect(x - 4, y - 4, 7, 2); c.fillStyle = WOOD.mid; c.fillRect(x - 3, y - 5, 2, 5); c.fillRect(x - 3, y - 3, 5, 1); c.fillStyle = WOOD.hi; c.fillRect(x - 3, y - 5, 1, 1); // carriage and wheel
  },
  cball(c, z) { const x = Math.round(z.x), y = Math.round(z.y), h = Math.round(z.h || 0); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 1, y, 3, 1); c.fillStyle = IRON.dark; c.fillRect(x - 1, y - h - 3, 3, 3); c.fillStyle = IRON.hi; c.fillRect(x - 1, y - h - 3, 1, 1); },
  shells(c, z) { for (const a of z.ar) { const p = arcAt(a, z.t, 6, 70); if (!p) continue; const x = Math.round(p.x), y = Math.round(p.y - p.h); c.fillStyle = IRON.dark; c.fillRect(x - 1, y - 1, 3, 3); c.fillStyle = IRON.hi; c.fillRect(x - 1, y - 1, 1, 1); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); } },
  cavalry(c, z) { c.imageSmoothingEnabled = false; const fr = ((z.t * 14) | 0) % 4, n = z.n || 4; for (let i = 0; i < n; i++) { const ox = -z.dir * (6 + i * 13), oy = (i % 2 ? 1 : -1) * Math.min(z.w - 4, 4 + (i >> 1) * 6); const rx = Math.round(z.x + ox), ry = Math.round(z.y + oy + 4); drawSprite(c, 'Cavalry', rx, ry, (fr + i) % 4, z.dir < 0); const px = rx - z.dir * 4, py = ry - 22 + ((fr + i) % 2); c.fillStyle = WOOD.dark; c.fillRect(px, py, 1, 8); c.fillStyle = '#e0503a'; c.fillRect(z.dir > 0 ? px - 4 : px + 1, py, 4, 2); c.fillStyle = '#ffd860'; c.fillRect(px, py - 1, 1, 1); } }, // his colours on every rider
  standard(c, z) {
    const x = Math.round(z.x), y = Math.round(z.y), big = !!z.big, H = big ? 34 : 24, fw = big ? 13 : 9, fh = big ? 9 : 6, T = G.time, rise = clamp(z.t * 4, 0, 1), top = y - Math.round(H * rise);
    // the ground it holds: a turning ring of gold dashes
    for (let i = 0; i < 40; i++) { if ((i + Math.floor(T * 6)) % 3 === 0) continue; const a = i / 40 * TAU + T * 0.6; c.fillStyle = i % 4 ? 'rgba(255,216,96,0.55)' : 'rgba(255,244,192,0.8)'; c.fillRect(Math.round(x + Math.cos(a) * z.r), Math.round(y + Math.sin(a) * z.r * 0.55), 1, 1); }
    c.fillStyle = WOOD.dark; c.fillRect(x, top, 1, y - top); c.fillStyle = WOOD.hi; c.fillRect(x, top, 1, Math.max(1, (y - top) >> 2));
    c.fillStyle = '#ffd860'; c.fillRect(x - 1, top - 2, 3, 2); // gilded finial
    for (let i = 0; i < fw; i++) { const dy = Math.round(Math.sin(T * 6 - i * 0.7) * 1.2 * (i / fw)), fx = x + 1 + i, fy = top + 1 + dy; c.fillStyle = '#a82a22'; c.fillRect(fx, fy, 1, fh); c.fillStyle = '#e0503a'; c.fillRect(fx, fy, 1, fh - 1); if (i === fw - 1 || i === 0) { c.fillStyle = '#ffd860'; c.fillRect(fx, fy, 1, fh); } }
    const cx = x + 1 + (fw >> 1), cy = top + 1 + (fh >> 1) + Math.round(Math.sin(T * 6 - (fw >> 1) * 0.7) * 0.6); c.fillStyle = '#ffd860'; c.fillRect(cx, cy - 1, 1, 3); c.fillRect(cx - 1, cy, 3, 1); // the emblem
  },
  caltrops(c, z) { const a = clamp(Math.min(z.t * 4, (z.life - z.t) * 2), 0, 1); if (a <= 0) return; c.globalAlpha = a; for (const p of z.pts) { if (!p[2]) continue; const x = Math.round(z.x + p[0]), y = Math.round(z.y + p[1]); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x - 2, y + 1, 5, 1); c.fillStyle = '#1e1e24'; c.fillRect(x - 2, y - 1, 5, 3); c.fillRect(x - 1, y - 3, 3, 6); c.fillStyle = '#b8c0cc'; c.fillRect(x - 2, y, 5, 1); c.fillRect(x, y - 3, 1, 5); c.fillStyle = '#e8eef4'; c.fillRect(x, y - 3, 1, 1); c.fillStyle = '#6a7080'; c.fillRect(x, y, 1, 1); } c.globalAlpha = 1; },
});
// ---------- the host: who gets hit ----------
Object.assign(HAZSIM, {
  volley(z, dt) {
    const A = z.ar; z._n = z._n || 0;
    if (z.tid) { const u = G.units.find(v => v.id === z.tid); if (u && !u.dead) for (const a of A) if (z.t < a[4] + a[5]) { a[2] = Math.round(u.x); a[3] = Math.round(u.y); } }
    while (z._n < A.length && z.t >= A[z._n][4] + A[z._n][5]) { const a = A[z._n++], aimed = z.tid ? G.units.find(v => v.id === z.tid && !v.dead && dist(v.x, v.y, a[2], a[3]) < 12) : null; for (const u of (z.tid ? (aimed ? [aimed] : []) : within(a[2], a[3], z.r, G.mons))) { hurt(u, z.dmg, z.src, { elem: z.fire ? 'fire' : undefined, quiet: A.length > 6 }); if (z.mark) u.markT = Math.max(u.markT || 0, 4); } if (z.fire && chance(0.45)) hazard({ k: 'flame', x: a[2], y: a[3], r: 10, life: 2.5, rate: 0.4, dmg: z.dmg * 0.25, src: z.src }); }
  },
  cball(z, dt) {
    const A = ARENA;
    if (!z.ph) { const u = Math.min(1, z.t / z.fdur); z.x = lerp(z.fx, z.lx, u); z.y = lerp(z.fy, z.ly, u); z.h = 6 * (1 - u) + 4 * z.H * u * (1 - u); if (u >= 1) { z.ph = 1; z.h = 0; HFX.thud(z.x, z.y); shake(0.2); } return; }
    z.x += z.dir * z.spd * dt; z.trav += z.spd * dt; z.h = Math.abs(Math.sin(z.trav * 0.05)) * 7;
    if (z.h < 3) for (const u of G.mons) if (!u.dead && u.spawnT <= 0 && u.carried !== 2 && !z.hit.has(u) && Math.abs(u.x - z.x) < u.r + 3 && Math.abs(u.y - z.y) < u.r + 3) { z.hit.add(u); hurt(u, z.dmg, z.src, { kx: z.dir * 220, ky: rand(-60, 60), up: 80 }); }
    if ((z.dir > 0 && z.x >= A.x1 - 4) || (z.dir < 0 && z.x <= A.x0 + 4) || z.trav > 170 || z.t > z.life - 0.05) { HFX.blast(z.x, z.y, z.R); for (const u of within(z.x, z.y, z.R, G.mons)) hurt(u, z.dmg * 0.8, z.src, { elem: 'fire' }); z.dead = true; }
  },
  shells(z, dt) { const A = z.ar; z._n = z._n || 0; while (z._n < A.length && z.t >= A[z._n][4] + A[z._n][5]) { const a = A[z._n++]; if (z.grape) { HFX.grapeBurst(a[2], a[3], z.R); for (const u of within(a[2], a[3], z.R, G.mons)) { const g = angTo(a[2], a[3], u.x, u.y); hurt(u, z.dmg, z.src, { kx: Math.cos(g) * 120, ky: Math.sin(g) * 80 }); } } else { HFX.blast(a[2], a[3], z.R); for (const u of within(a[2], a[3], z.R, G.mons)) hurt(u, z.dmg, z.src, { elem: 'fire', up: 90 }); } } },
  cavalry(z, dt) {
    const A = ARENA; z.x += z.dir * z.spd * dt;
    for (const u of G.mons) { if (u.dead || u.spawnT > 0 || u.carried || z.hit.has(u) || Math.abs(u.y - z.y) > z.w + u.r) continue; const rel = (z.x - u.x) * z.dir; if (rel < -u.r || rel > 50) continue; z.hit.add(u); hurt(u, z.dmg, z.src, { kx: z.dir * 230, ky: Math.sign(u.y - z.y || 1) * 90, up: u.boss ? 0 : 150 }); }
    if ((z.dir > 0 && z.x > A.x1 + 50) || (z.dir < 0 && z.x < A.x0 - 50)) z.dead = true;
  },
  standard(z, dt, tick) {
    for (const h of G.heroes) if (!h.dead && dist(z.x, z.y, h.x, h.y) < z.r) { h.rallyT = Math.max(h.rallyT || 0, 0.4); if (z.big) h.rallyBig = 1; if (tick && z.regen) heal(h, h.maxHp * z.regen); }
    if (z.big) for (const u of within(z.x, z.y, z.r, G.mons)) u.slow = Math.max(u.slow, 0.4);
    if (z.guard && (z.shotT = (z.shotT || 0) - dt) <= 0) { z.shotT = z.guard; const f = within(z.x, z.y, z.r + 30, G.mons); if (f.length) { const u = pick(f); const a = lob(clamp(u.x + (chance(0.5) ? -1 : 1) * rand(90, 140), ARENA.x0 + 6, ARENA.x1 - 6), ARENA.y0 - 4, u.x, u.y, 0); hazard({ k: 'volley', ar: flights([a]), z0: 20, arc: 50, r: 7, dmg: z.dmg, tid: u.id, life: a[5] + 0.3, src: z.src }); } }
  },
  caltrops(z, dt) { for (const p of z.pts) { if (!p[2]) continue; const x = z.x + p[0], y = z.y + p[1]; for (const u of G.mons) { if (u.dead || u.spawnT > 0 || u.carried || u.z > 4 || Math.abs(u.x - x) > u.r + 2 || Math.abs(u.y - y) > u.r * 0.6 + 2) continue; p[2] = 0; hurt(u, z.dmg, z.src, {}); u.slow = Math.max(u.slow, 2); HFX.caltropHit(x, y); break; } } },
});
// ---------- Aldric's orders ----------
function markTarget(h, t) { const m = md('MARK TARGET'), A = ARENA; h.lunge = 0.1; h.la = angTo(h.x, h.y, t.x, t.y); for (let k = 0; k <= m.count; k++) { const u = k ? pick(live(G.mons)) : t; if (!u) continue; const a = lob(clamp(u.x + (u.x < h.x ? -1 : 1) * rand(90, 140), A.x0 + 6, A.x1 - 6), A.y0 - 4, u.x, u.y, k * 0.12); hazard({ k: 'volley', ar: flights([a]), z0: 20, arc: 50, r: 7, dmg: D(h) * 1.3 * m.dmg, mark: 1, tid: u.id, life: a[4] + a[5] + 0.3, src: h }); } }
function sabre(h, t) { const m = md('SABRE'), a = angTo(h.x, h.y, t.x, t.y), R = 32 * m.size; h.lunge = 0.2; h.la = a; arcFx(h.x, h.y - 6, a, 0.9, 20 * m.size, 'white', 0.15, 2); SFX.slash(panOf(h.x)); for (const u of within(h.x, h.y, R, G.mons)) if (Math.abs(angDiff(angTo(h.x, h.y, u.x, u.y), a)) < 0.95) { hurt(u, D(h) * 1.1 * m.dmg, h, { kx: Math.cos(a) * 80, ky: Math.sin(a) * 60 }); if (m.f.mark) u.markT = Math.max(u.markT || 0, 3); } }
function pistol(h, t) { const m = md('PISTOL'), a = angTo(h.x, h.y, t.x, t.y); h.lunge = 0.15; h.la = a; HFX.shot(h.x + Math.cos(a) * 6, h.y - 7, t.x, t.y - 6); hurt(t, D(h) * 2.0 * m.dmg, h, { kx: Math.cos(a) * 160, ky: Math.sin(a) * 110, stun: m.f.stun ? 0.5 : 0 }); if (m.count) for (const u of within(t.x, t.y, 22, G.mons)) if (u !== t) { hurt(u, D(h) * 0.7 * m.dmg, h); break; } }
function arrowVolley(h, p) { const m = md('ARROW VOLLEY'), n = 12 + m.count, R = 34 * m.size, pts = []; for (let i = 0; i < n; i++) pts.push({ x: p.x + rand(-R, R), y: p.y + rand(-R, R) * 0.6 }); const ar = archers(3, flankX(p.x), 12, 2.1); after(0.35, () => volley(h, pts, { from: ar.xs, dmg: D(h) * 0.85 * m.dmg, spread: 0.4, mark: m.f.mark ? 1 : 0 })); }
function warStandard(h) { const m = md('WAR STANDARD'); hazard({ k: 'standard', x: h.x, y: h.y + 2, r: 60 * m.size, life: 8 * m.dur, rate: 1, regen: m.f.regen ? 0.02 : 0, guard: 0.8, dmg: D(h) * 0.7, src: h }); HFX.plant(h.x, h.y, 0); }
function rallyingCry(h) { const m = md('RALLYING CRY'); HFX.rally(h.x, h.y); for (const x of G.heroes) if (!x.dead) { heal(x, x.maxHp * 0.12 * m.dmg); x.stun = 0; x.rallyT = Math.max(x.rallyT || 0, 4 * m.dur); if (m.f.dodge) { x.dashN = DASH_N; x.dashT = 0; } } banner('RALLY!', h); }
function caltrops(h, p) { const m = md('CALTROPS'), R = 30 * m.size, c = { x: lerp(p.x, h.x, 0.35), y: lerp(p.y, h.y, 0.35) }, n = Math.round(18 * m.size), pts = []; for (let i = 0; i < n; i++) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R; pts.push([Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r * 0.6), 1]); } HFX.scatter(c.x, c.y, R); hazard({ k: 'caltrops', x: c.x, y: c.y, r: R, pts, life: 10 * m.dur, dmg: D(h) * 0.7 * m.dmg, src: h }); }
function cannonShot(h, t) { const m = md('CANNON SHOT'), side = t.x >= h.x ? -1 : 1; for (let k = 0; k <= m.count; k++) { const y = t.y + (k ? (k % 2 ? 14 : -14) : 0), c = cannonAt(side, y, [0.35 + k * 0.25], 1.4 + k * 0.25); after(0.35 + k * 0.25, () => { HFX.cannonFire(c.x, c.y, c.dir); const lx = clamp(t.x - c.dir * 30, ARENA.x0 + 8, ARENA.x1 - 8), a = lob(c.x + c.dir * 12, c.y, lx, c.y, 0); hazard({ k: 'cball', x: a[0], y: c.y, fx: a[0], fy: c.y, lx, ly: c.y, fdur: a[5], H: a[6], ph: 0, dir: c.dir, spd: 330, trav: 0, h: 6, R: 28 * m.size, dmg: D(h) * 1.6 * m.dmg, life: a[5] + 1.6, src: h }); }); } }
function grapeshot(h, p) { const m = md('GRAPESHOT'), side = p.x >= h.x ? -1 : 1, c = cannonAt(side, p.y, [0.35], 1.3); after(0.35, () => { HFX.cannonFire(c.x, c.y, c.dir); const a = lob(c.x + c.dir * 10, c.y, p.x, p.y, 0); hazard({ k: 'shells', ar: flights([a]), grape: 1, R: 46 * m.size, dmg: D(h) * 1.4 * m.dmg, life: a[5] + 0.4, src: h }); }); }
function fireArrows(h, p) { const m = md('FIRE ARROWS'), n = 12 + m.count, R = 36 * m.size, pts = []; for (let i = 0; i < n; i++) pts.push({ x: p.x + rand(-R, R), y: p.y + rand(-R, R) * 0.6 }); const ar = archers(3, flankX(p.x), 12, 2.1); after(0.35, () => volley(h, pts, { from: ar.xs, dmg: D(h) * 0.8 * m.dmg, spread: 0.4, fire: 1 })); }
function cavalryCharge(h, p) { const m = md('CAVALRY CHARGE'), A = ARENA, dir = h.x <= p.x ? 1 : -1; for (let k = 0; k <= m.count; k++) after(k * 0.5, () => { const y = clamp(p.y + (k ? (k % 2 ? 22 : -22) : 0), A.y0 + 10, A.y1 - 6); hazard({ k: 'cavalry', x: dir > 0 ? A.x0 - 40 : A.x1 + 40, y, dir, spd: 250, w: 16 * m.size, n: 4 + (m.f.big ? 2 : 0), dmg: D(h) * 1.7 * m.dmg, life: 4, src: h }); }); SFX.horn(); }
function bombardment(h) { const m = md('BOMBARDMENT'), A = ARENA, f = live(G.mons), d = aimPoint(h, f, 50, 400) || { x: A.pw / 2, y: (A.y0 + A.y1) / 2 }, salvos = 3 + m.count; banner('BOMBARDMENT', h);
  for (let s = 0; s < salvos; s++) { const side = s % 2 ? 1 : -1, cy = clamp(d.y + rand(-20, 20), A.y0 + 10, A.y1 - 6), c = cannonAt(side, cy, [0.3], 1.3); after(0.3 + s * 0.6, () => { HFX.cannonFire(c.x, c.y, c.dir); const ar = []; for (let i = 0; i < 4; i++) { const tx = d.x + (i - 1.5) * 26 * m.size + rand(-8, 8), ty = d.y + rand(-24, 24) * m.size; ar.push(lob(c.x + c.dir * 10, c.y, clamp(tx, A.x0 + 6, A.x1 - 6), clamp(ty, A.y0 + 4, A.y1 - 2), i * 0.08)); } hazard({ k: 'shells', ar: flights(ar), R: 26 * m.size, dmg: D(h) * 2 * m.dmg, life: Math.max(...ar.map(a => a[4] + a[5])) + 0.3, src: h }); }); } }
function bannerOfKings(h) { const m = md('BANNER OF KINGS'); banner('BANNER OF KINGS', h); hazard({ k: 'standard', x: h.x, y: h.y + 2, r: 90 * m.size, big: 1, life: 10 * m.dur, rate: 1, regen: m.f.regen ? 0.03 : 0.015, guard: 0.5, dmg: D(h) * 1.0, src: h }); HFX.plant(h.x, h.y, 1); }
function arrowstorm(h) { const m = md('ARROWSTORM'), A = ARENA, n = 6 + (m.count ? 2 : 0), dur = 4 * m.dur; banner('ARROWSTORM', h); const wall = archers(n, A.pw / 2, (A.x1 - A.x0 - 30) / (n - 1), dur + 0.9);
  for (let w = 0; w < Math.round(dur / 0.5); w++) after(0.4 + w * 0.5, () => { const f = live(G.mons); if (!f.length) return; const mk = marked(f), pts = []; for (let i = 0; i < 6; i++) { const u = mk.length && chance(0.6) ? pick(mk) : pick(f); pts.push({ x: u.x + rand(-6, 6), y: u.y + rand(-4, 4) }); } volley(h, pts, { from: wall.xs, dmg: D(h) * 0.7 * m.dmg, spread: 0.3, fire: m.f.fire ? 1 : 0 }); }); }
function totalWar(h) {
  const m = md('TOTAL WAR'), A = ARENA, n = 8; banner('TOTAL WAR', h); SFX.horn(); G.ambDark = 0.7; flash('scarlet', 0.3); const wall = archers(n, A.pw / 2, (A.x1 - A.x0 - 30) / (n - 1), 6.5);
  for (let w = 0; w < Math.round(10 * m.dur); w++) after(0.4 + w * 0.5, () => { const f = live(G.mons); if (!f.length) return; const pts = []; for (let i = 0; i < 7; i++) { const u = pick(f); pts.push({ x: u.x + rand(-6, 6), y: u.y + rand(-4, 4) }); } volley(h, pts, { from: wall.xs, dmg: D(h) * 0.8 * m.dmg, spread: 0.3, fire: w % 2 }); });
  for (let s = 0; s < 4; s++) { const side = s % 2 ? 1 : -1, c = cannonAt(side, A.y0 + (A.y1 - A.y0) * (0.25 + 0.5 * (s >> 1)), [0.6 + s * 0.7], 1.8 + s * 0.7); after(0.6 + s * 0.7, () => { HFX.cannonFire(c.x, c.y, c.dir); const f = live(G.mons), ar = []; for (let i = 0; i < 4; i++) { const u = f.length ? pick(f) : { x: A.pw / 2, y: c.y }; ar.push(lob(c.x + c.dir * 10, c.y, u.x, u.y, i * 0.08)); } hazard({ k: 'shells', ar: flights(ar), R: 28, dmg: D(h) * 2.4 * m.dmg, life: Math.max(...ar.map(a => a[4] + a[5])) + 0.3, src: h }); }); }
  for (let k = 0; k < 2 + m.count; k++) after(1 + k * 1.4, () => { const dir = k % 2 ? -1 : 1, y = A.y0 + (A.y1 - A.y0) * (k % 2 ? 0.7 : 0.35); hazard({ k: 'cavalry', x: dir > 0 ? A.x0 - 40 : A.x1 + 40, y, dir, spd: 260, w: 22, n: 6, dmg: D(h) * 2.4 * m.dmg, life: 4, src: h }); });
}
SPELLBOOK.general = [
  { name: 'MARK TARGET', lvl: 1, tier: 0, basic: true, cd: 1.1, pick: (h, f) => { const um = f.filter(u => !(u.markT > 0)); return toughest(h, um.length ? um : f, 180) || nearestFoe(h, f, 180); }, cast: markTarget },
  { name: 'SABRE', lvl: 1, tier: 0, basic: true, cd: 0.6, range: 30, pick: (h, f) => nearestFoe(h, f, 40 * md('SABRE').size), cast: sabre },
  { name: 'PISTOL', lvl: 1, tier: 0, basic: true, cd: 1.6, pick: (h, f) => nearestFoe(h, f, 150), cast: pistol },
  { name: 'ARROW VOLLEY', lvl: 2, tier: 1, cd: 6, wind: 0.25, pick: (h, f) => aimPoint(h, f, 34, 220), cast: arrowVolley },
  { name: 'WAR STANDARD', lvl: 2, tier: 1, cd: 12, wind: 0.3, pick: (h, f) => within(h.x, h.y, 90, f).length >= 3 ? true : null, cast: warStandard },
  { name: 'RALLYING CRY', lvl: 3, tier: 1, free: true, cd: 10, wind: 0.2, pick: () => G.heroes.some(x => !x.dead && (x.hp < x.maxHp * 0.6 || x.stun > 0)) ? true : null, cast: rallyingCry },
  { name: 'CALTROPS', lvl: 4, tier: 1, cd: 8, wind: 0.2, pick: (h, f) => cluster(h, f, 30, 3, 120), cast: caltrops },
  { name: 'CANNON SHOT', lvl: 5, tier: 2, cd: 7, wind: 0.3, pick: (h, f) => aimPoint(h, f, 30, 230) || toughest(h, f, 230), cast: cannonShot },
  { name: 'GRAPESHOT', lvl: 6, tier: 2, cd: 8, wind: 0.3, pick: (h, f) => cluster(h, f, 34, 4, 220), cast: grapeshot },
  { name: 'FIRE ARROWS', lvl: 7, tier: 2, cd: 8, wind: 0.3, pick: (h, f) => aimPoint(h, f, 34, 220), cast: fireArrows },
  { name: 'CAVALRY CHARGE', lvl: 8, tier: 2, cd: 10, wind: 0.35, pick: (h, f) => cluster(h, f, 30, 4, 240), cast: cavalryCharge },
  { name: 'BOMBARDMENT', lvl: 10, tier: 3, cd: 14, wind: 0.5, pick: (h, f) => f.length >= 6 ? true : null, cast: bombardment },
  { name: 'BANNER OF KINGS', lvl: 11, tier: 3, cd: 18, wind: 0.5, pick: (h, f) => f.length >= 6 || G.heroes.some(x => !x.dead && x.hp < x.maxHp * 0.5) ? true : null, cast: bannerOfKings },
  { name: 'ARROWSTORM', lvl: 12, tier: 3, cd: 14, wind: 0.5, pick: (h, f) => f.length >= 6 ? true : null, cast: arrowstorm },
  { name: 'TOTAL WAR', lvl: 15, tier: 4, wind: 1, pick: (h, f) => f.length >= 6 || G.boss ? true : null, cast: totalWar },
];
Object.assign(SPELL_INFO, {
  'MARK TARGET': 'He points; an arrow from the wall finds the foe and marks it: marked foes take 25% more from him', 'SABRE': 'Quick cuts at whatever comes close', 'PISTOL': 'One loud shot that knocks a foe back',
  'ARROW VOLLEY': 'Archers appear on the back wall and rain arrows on a crowd', 'WAR STANDARD': 'Plant a banner: heroes under it hit 30% harder and take 20% less, and archers guard it', 'RALLYING CRY': 'Every hero heals, shakes off stuns and fights harder for a while', 'CALTROPS': 'Throw iron spikes in front of the crowd; each one a foe steps on cuts and slows it, then is used up',
  'CANNON SHOT': 'A cannon lobs a ball that lands, bowls through the row and explodes', 'GRAPESHOT': 'A cannon lobs a canister that bursts over the crowd and rains shot', 'FIRE ARROWS': 'A volley of burning arrows that set the floor alight', 'CAVALRY CHARGE': 'Wolf riders thunder across a lane and trample everything in it',
  'BOMBARDMENT': 'Cannons on both walls walk a barrage of shells across the crowd', 'BANNER OF KINGS': 'A great standard: heroes under it hit 50% harder, take 35% less and heal; foes are slowed and shot', 'ARROWSTORM': 'Archers line the whole back wall and loose arrow after arrow',
  'TOTAL WAR': 'The whole army at once: arrows from the wall, cannons from both sides and two cavalry charges',
});
Object.assign(MODS, {
  'MARK TARGET': [['TWO MARKS', 'A second arrow marks another foe', { count: 1 }], ['BROADHEAD', '+50% damage', { dmg: 1.5 }], ['QUICK ORDERS', 'Orders 30% faster', { cd: 0.7 }]],
  'SABRE': [['LONG BLADE', 'Reach +35%', { size: 1.35 }], ['DUELLIST', '+45% damage', { dmg: 1.45 }], ['MARKING CUT', 'Cuts mark the foe', { f: 'mark' }]],
  'PISTOL': [['DOUBLE BARREL', 'The shot hits a second foe', { count: 1 }], ['HEAVY BALL', '+50% damage', { dmg: 1.5 }], ['STUNNING SHOT', 'Stuns the foe', { f: 'stun' }]],
  'ARROW VOLLEY': [['MORE ARCHERS', '+8 arrows', { count: 8 }], ['WIDE VOLLEY', 'Covers 40% more ground', { size: 1.4 }], ['MARKING VOLLEY', 'Every foe hit is marked', { f: 'mark' }]],
  'WAR STANDARD': [['TALL BANNER', 'Radius +40%', { size: 1.4 }], ['LONG WATCH', 'Stands 50% longer', { dur: 1.5 }], ['FIELD SURGEON', 'Heroes under it heal', { f: 'regen' }]],
  'RALLYING CRY': [['SECOND WIND', 'Heals 60% more', { dmg: 1.6 }], ['FRESH LEGS', 'Refills every dodge', { f: 'dodge' }], ['WAR DRUMS', 'The boost lasts 50% longer', { dur: 1.5 }]],
  'CALTROPS': [['SPIKE FIELD', 'More spikes over 40% more ground', { size: 1.4 }], ['RUSTED IRON', '+60% damage', { dmg: 1.6 }], ['LONG FIELD', 'Spikes stay 60% longer', { dur: 1.6 }]],
  'CANNON SHOT': [['SECOND GUN', 'A second cannon fires on the next row', { count: 1 }], ['HEAVY SHOT', '+50% damage', { dmg: 1.5 }], ['POWDER CHARGE', 'Bigger explosion', { size: 1.5 }]],
  'GRAPESHOT': [['WIDE SPREAD', 'Bursts 40% wider', { size: 1.4 }], ['CHAIN SHOT', '+50% damage', { dmg: 1.5 }], ['QUICK RELOAD', 'Cooldown -35%', { cd: 0.65 }]],
  'FIRE ARROWS': [['MORE ARCHERS', '+8 arrows', { count: 8 }], ['PITCH', '+50% damage', { dmg: 1.5 }], ['WIDE FIRE', 'Covers 40% more ground', { size: 1.4 }]],
  'CAVALRY CHARGE': [['SECOND WAVE', 'Another troop charges a lane beside it', { count: 1 }], ['HEAVY HORSE', 'Bigger troop, wider lane', { size: 1.4, f: 'big' }], ['LANCES', '+50% damage', { dmg: 1.5 }]],
  'BOMBARDMENT': [['MORE GUNS', 'Two more salvos', { count: 2 }], ['WIDE BARRAGE', 'Shells spread 40% wider', { size: 1.4 }], ['HEAVY SHELLS', '+50% damage', { dmg: 1.5 }]],
  'BANNER OF KINGS': [['ROYAL GUARD', 'Radius +35%', { size: 1.35 }], ['LONG REIGN', 'Stands 50% longer', { dur: 1.5 }], ['ROYAL SURGEONS', 'Heals twice as much', { f: 'regen' }]],
  'ARROWSTORM': [['FULL WALL', 'Two more archers', { count: 1 }], ['LONG STORM', 'Lasts 50% longer', { dur: 1.5 }], ['BURNING STORM', 'The arrows burn', { f: 'fire' }]],
  'TOTAL WAR': [['NO QUARTER', '+50% damage', { dmg: 1.5 }], ['RESERVES', 'Another cavalry charge', { count: 1 }], ['LONG CAMPAIGN', 'The barrage lasts longer', { dur: 1.3 }]],
});
