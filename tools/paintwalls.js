// Writes the wall pieces painted in the Wall & Trim Painter into the crawler (crawler/src/31_walls.js, its PAINT table).
// Usage: node tools/paintwalls.js painted.json, where painted.json is the painter's text (its "As text" box), or the
// saved document ({ pieces: { '6,3': { wall, trim }, ... } }).
const fs = require('fs'), path = require('path');
const src = process.argv[2]; if (!src) { console.error('usage: node tools/paintwalls.js painted.json'); process.exit(1); }
let d = JSON.parse(fs.readFileSync(src, 'utf8')); if (d.data) d = d.data; if (d.pieces) d = d.pieces;
const hex = s => typeof s === 'string' && /^[0-9a-f]{64}$/i.test(s);
const keys = Object.keys(d).filter(k => /^\d+,\d+$/.test(k) && hex(d[k].wall) && hex(d[k].trim)).sort();
if (!keys.length) { console.error('no painted pieces in ' + src); process.exit(1); }
const body = keys.map(k => `  '${k}': ['${d[k].wall.toLowerCase()}', '${d[k].trim.toLowerCase()}'],`).join('\n');
const file = path.join(__dirname, '..', 'crawler', 'src', '31_walls.js'), t = fs.readFileSync(file, 'utf8');
const a = t.indexOf('const PAINT = {'), b = t.indexOf('\n};', a); if (a < 0 || b < 0) { console.error('no PAINT table in ' + file); process.exit(1); }
fs.writeFileSync(file, t.slice(0, a) + 'const PAINT = {\n' + body + t.slice(b));
console.log(`${keys.length} pieces written to ${path.relative(process.cwd(), file)}`);
