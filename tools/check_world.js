// Node-side sanity check: builds the grid and verifies reachability from the start.
const fs = require('fs'), vm = require('vm');
const ctx = { console, Math, Uint8Array, Array, Object, Map, Set, Number, String, performance: { now: () => 0 } };
vm.createContext(ctx);
for (const f of ['src/00_core.js', 'src/50_world.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
vm.runInContext('buildWorldGrid();', ctx);
const W = vm.runInContext('WORLD', ctx), MW = W.w, MH = W.h, g = W.grid;
const pass = c => c !== ' ' && c !== '#' && c !== '~';
let sx, sy; for (let i = 0; i < g.length; i++) if (g[i] === 'P') { sx = i % MW; sy = (i / MW) | 0; }
const seen = new Uint8Array(MW * MH); const q = [[sx, sy]]; seen[sy * MW + sx] = 1;
while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const i = ny * MW + nx; if (seen[i] || !pass(g[i])) continue; seen[i] = 1; q.push([nx, ny]); } }
let bad = 0;
const check = (x, y, what) => { const i = (y | 0) * MW + (x | 0); if (!seen[i]) { console.log('UNREACHABLE', what, x, y, JSON.stringify(g[i])); bad++; } };
for (const o of W.objects) if (o.type !== 'torch') check(o.x, o.y, o.type + (o.spr ? ':' + o.spr : '') + (o.item ? ':' + o.item : ''));
for (const s of W.spawns) check(s.x, s.y, 'spawn:' + s.kind);
for (let i = 0; i < g.length; i++) if ('bDKGF?'.includes(g[i])) check(i % MW, (i / MW) | 0, 'cell:' + g[i]);
// objects must sit on floor
for (const o of W.objects.filter(o => o.type !== 'torch').concat(W.spawns)) { const c = g[(o.y | 0) * MW + (o.x | 0)]; if (!pass(c) || c === 'b') { console.log('ON NON-FLOOR', o.type || o.kind, o.x, o.y, JSON.stringify(c)); bad++; } }
// doors need exactly two opposite wall neighbours
for (let i = 0; i < g.length; i++) if ('DKGF'.includes(g[i])) { const x = i % MW, y = (i / MW) | 0; const w = (xx, yy) => !pass(g[yy * MW + xx]); const ns = w(x, y - 1) && w(x, y + 1), ew = w(x - 1, y) && w(x + 1, y); if (ns === ew) { console.log('BAD DOOR', g[i], x, y, 'ns', ns, 'ew', ew); bad++; } }
// solid props must not sit in a one-tile corridor (they would block the player)
const solidTypes = { deco: 1, breakable: 1, chest: 1, npc: 1, brazier: 1 };
const isWall = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH || !pass(g[y * MW + x]);
const corridorCheck = (x, y, what) => { const cx = x | 0, cy = y | 0; const ns = isWall(cx, cy - 1) && isWall(cx, cy + 1) && !isWall(cx - 1, cy) && !isWall(cx + 1, cy); const ew = isWall(cx - 1, cy) && isWall(cx + 1, cy) && !isWall(cx, cy - 1) && !isWall(cx, cy + 1); if (ns || ew) { console.log('BLOCKS CORRIDOR', what, cx, cy); bad++; } };
for (const o of W.objects) if (solidTypes[o.type] && !(o.type === 'deco' && /bones|skull/.test(o.spr))) corridorCheck(o.x, o.y, o.type + ':' + (o.spr || o.item || ''));
for (let i = 0; i < g.length; i++) if (g[i] === '?' || g[i] === 'b') corridorCheck(i % MW, (i / MW) | 0, 'cell:' + g[i]);
console.log('reachable cells', seen.reduce((a, b) => a + b, 0), 'problems', bad);
// print the map
let out = ''; for (let y = 0; y < MH; y++) { let row = ''; for (let x = 0; x < MW; x++) row += g[y * MW + x] === ' ' ? ' ' : g[y * MW + x]; out += row.replace(/ +$/, '') + '\n'; }
fs.writeFileSync(process.argv[2] || '/dev/null', out);
