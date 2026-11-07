// Node-side: build maps and print ASCII previews + sanity stats.
const fs = require('fs'), vm = require('vm');
const ctx = { console, Math, Uint8Array, Float32Array, Array, Object, Map, Set, Number, String, document: { createElement: () => ({ getContext: () => ({}) }) } };
vm.createContext(ctx);
for (const f of ['src/00_core.js', 'src/20_data.js', 'src/30_world.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
const ch = { 0: ' ', 1: '.', 2: '#', 3: ',', 4: ':', 5: '=', 6: '~', 7: 's', 8: 'T', 9: 'r', 10: 'L', 11: 'D', 12: 'R', 13: 'W' };
const show = (m, x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) { let s = ''; for (let x = x0; x < x1; x++) s += ch[m.t[y * m.w + x]]; console.log(s); } };
const over = vm.runInContext("getMap('over')", ctx);
console.log('OVERWORLD', over.w, over.h, 'monsters', over.monsters.length, 'objects', over.objects.length, 'npcs', over.npcs.length, 'start', over.start);
show(over, 0, 0, over.w, over.h);
const w = vm.runInContext("getMap('warrens')", ctx);
console.log('WARRENS', w.w, w.h, 'monsters', w.monsters.length, 'chests', w.objects.filter(o => o.kind === 'chest').length, 'boss', w.monsters.filter(m => m.boss).length, 'items', w.objects.filter(o => o.item).map(o => o.item));
show(w, 0, 0, w.w, w.h);
// reachability in warrens from start to boss
const bfs = (m, sx, sy) => { const seen = new Uint8Array(m.w * m.h); const q = [[sx, sy]]; seen[sy * m.w + sx] = 1; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue; const i = ny * m.w + nx; if (seen[i] || !vm.runInContext('PASSABLE', ctx).has(m.t[i])) continue; seen[i] = 1; q.push([nx, ny]); } } return seen; };
for (const id of ['warrens', 'barrow', 'reliquary', 'molten', 'sanctum']) { const m = vm.runInContext(`getMap('${id}')`, ctx); const seen = bfs(m, m.start.x | 0, m.start.y | 0); const bad = m.monsters.filter(mo => !seen[(mo.y | 0) * m.w + (mo.x | 0)]).length + m.objects.filter(o => (o.kind === 'chest' || o.kind === 'stairs') && !seen[o.y * m.w + o.x]).length; console.log(id, 'unreachable', bad, 'monsters', m.monsters.length, 'boss', m.monsters.find(x => x.boss).kind); }
const seenO = bfs(over, over.start.x | 0, over.start.y | 0); let badO = 0; for (const e of over.exits) if (!seenO[e.y * over.w + e.x]) { console.log('entrance unreachable', e.to); badO++; } for (const o of over.objects) if ((o.kind === 'chest' || o.kind === 'pickup' || o.kind === 'door') && !seenO[o.y * over.w + o.x]) { console.log('object unreachable', o.kind, o.x, o.y); badO++; } console.log('overworld problems', badO);
