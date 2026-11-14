// ===================== the folk of the farmhouse, and a cherub =====================
// On the cellar floors a frightened villager hides in the corner furthest from the runes. Nothing in the fight can touch them.
// When the floor is cleared they shout their thanks and run for the stairs. Pure in time once freed, so every phone agrees.
const FOLK = ['OverworkedVillager', 'GentleShepard', 'JovialFriar', 'JoyfulKid', 'PlayfulChild', 'BoisterousYouth', 'AdventurousAdolescent'];
const FOLK_THANKS = ['THANK YOU!', 'YOU CAME!', 'BLESS YOU!', 'I KNEW IT!', 'HOME, HOME!', 'THANK YOU, HEROES!'];
function spawnVillager() {
  // against the left or right wall, a little above the middle: the corners sit under the HUD and the spell buttons
  const A = ARENA, spots = []; for (const x of [A.x0 + 12, A.x1 - 12]) for (const f of [0.3, 0.42, 0.55]) spots.push([x, A.y0 + (A.y1 - A.y0) * f]);
  let best = spots[0], bd = -1; for (const [x, y] of spots) { if (A.props.some(p => dist(x, y, p.x, p.y) < 16)) continue; const d = Math.min(...A.runes.map(r => dist(x, y, r.x, r.y))); if (d > bd) { bd = d; best = [x, y]; } }
  hazard({ k: 'villager', spr: pick(FOLK), x: Math.round(best[0]), y: Math.round(best[1]), tx: Math.round(A.pw / 2), ty: Math.round(A.y0 - 6), face: best[0] < A.pw / 2 ? 1 : -1, life: 999 });
}
// where a freed villager is s seconds after being freed: a short cheer on the spot, then a hopping run for the stairs
function folkAt(z, s) { const run = Math.max(0, s - 0.7), L = dist(z.x, z.y, z.tx, z.ty), u = Math.min(1, run * 78 / Math.max(1, L)); return { x: lerp(z.x, z.tx, u), y: lerp(z.y, z.ty, u), h: s < 0.7 ? Math.abs(Math.sin(s * 9)) * 5 : Math.abs(Math.sin(run * 13)) * 2.5, gone: u >= 1 }; }
Object.assign(HAZSIM, {
  villager(z, dt) { if (G.phase === 'clear' && z.go === undefined) { z.go = Math.round(z.t * 100) / 100; textPop(z.x, z.y, 22, pick(FOLK_THANKS), 'heal'); SFX.levelup(); } if (z.go !== undefined && (folkAt(z, z.t - z.go).gone || z.t - z.go > 4)) z.dead = true; },
  cherub(z, dt) { const u = G.units.find(v => v.id === z.u); if (u) { z.x = u.x; z.y = u.y; } },
});
Object.assign(HAZFX, {
  villager(z, dt) { if (z.go !== undefined && z.t - z.go < 0.7 && chance(dt * 20)) part({ k: 'glow', x: z.x + rand(-6, 6), y: z.y, z: rand(8, 20), vz: rand(20, 40), life: 0.6, s0: 2, s1: 0, col: 'heal' }); },
  cherub(z, dt) { if (chance(dt * 14)) part({ k: 'glow', x: z.x + rand(-6, 6), y: z.y, z: rand(16, 34), vz: rand(-10, 10), life: 0.5, s0: 2, s1: 0, col: 'holy' }); },
});
Object.assign(HAZDRAW.world, {
  villager(c, z) {
    if (!MOBS[z.spr]) return; let x = z.x, y = z.y, h = 0, face = z.face, fr = 0, a = 1;
    if (z.go === undefined) { x += ((G.time * 14 + z.id) | 0) % 2 ? 0.5 : -0.5; fr = 0; } // cowering: trembling, frozen in place
    else { const s = z.t - z.go, p = folkAt(z, s); x = p.x; y = p.y; h = p.h; fr = ((G.time * 10) | 0) % 4; if (s > 0.7) face = z.tx < z.x ? -1 : 1; a = clamp((4 - s) * 2, 0, 1); }
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(Math.round(x) - 3, Math.round(y), 7, 1); drawSprite(c, z.spr, x, y - h, fr, face < 0, a);
    if (z.go === undefined && ((G.time * 2 + z.id) | 0) % 3 === 0) { c.fillStyle = '#9fd8ff'; c.fillRect(Math.round(x) + 5, Math.round(y) - 15, 1, 2); } // a bead of sweat
  },
  cherub(c, z) { const life = Math.min(1, z.t * 3, (z.life - z.t) * 3), y = z.y - 30 - (1 - Math.min(1, z.t * 2)) * 30 + Math.sin(G.time * 4) * 1.5; drawSprite(c, 'FloatingCherub', z.x, y, ((G.time * 8) | 0) % 4, false, life); },
});
