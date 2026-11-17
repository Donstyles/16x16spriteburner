// Turns the Hero Cut Painter's saved frames into the game's hand-made weapon cuts.
// usage: node tools/herocuts.js <dir>   (dir: the painter's `heroes` collection saved as <SpriteName>-<frame>.json files)
// Writes crawler/src/11_herocuts.js. A frame with no file keeps the game's automatic cut (10_assets cutWeapon).
const fs = require('fs'), path = require('path');
const dir = process.argv[2]; if (!dir) { console.error('usage: node tools/herocuts.js <dir>'); process.exit(1); }
const out = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const d0 = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), d = d0.data || d0;
  if (!d.spr || !(d.frame >= 0 && d.frame <= 3) || typeof d.mask !== 'string' || typeof d.paint !== 'string') { console.warn('skipped', f); continue; }
  if (Buffer.from(d.mask, 'base64').length !== 256 || Buffer.from(d.paint, 'base64').length !== 1024) { console.warn('skipped (bad size)', f); continue; }
  (out[d.spr] = out[d.spr] || [null, null, null, null])[d.frame] = { m: d.mask, p: d.paint, g: Array.isArray(d.grip) ? d.grip : null };
}
const head = `// ===================== the heroes' weapons, cut out by hand (the Hero Cut Painter) =====================
// Per hero, per frame (0-3): m, which pixels of the frame are the weapon (256 bytes, base64, row by row from the top left,
// 1 = weapon); p, the hero redrawn where it was (1024 bytes RGBA, base64: alpha 0 the original pixel, 1 the pixel cleared,
// above that the pixel painted that colour); g, the grip pixel. A frame left null keeps the automatic cut (10_assets).
// Written by tools/herocuts.js from the painter's saved frames; not edited by hand.
`;
const body = 'const HERO_CUTS_RAW = ' + JSON.stringify(out, null, 0).replace(/\],"/g, '],\n  "') + ';\n' +
  'const b64u8 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));\n' +
  'const HERO_CUTS = {}; for (const k in HERO_CUTS_RAW) HERO_CUTS[k] = HERO_CUTS_RAW[k].map(d => d && { mask: b64u8(d.m), paint: b64u8(d.p), grip: d.g });\n';
fs.writeFileSync(path.join(__dirname, '..', 'crawler', 'src', '11_herocuts.js'), head + body);
console.log('hand cuts:', Object.entries(out).map(([k, v]) => k + ' ' + v.map((x, i) => x ? i : '-').join('')).join(', '));
