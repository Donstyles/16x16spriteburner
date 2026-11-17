// Turns the Head Cut Painter's saved frames into the game's hand-cut heads for the beheading death.
// usage: node tools/heads.js <dir>   (dir: the painter's `heads` collection saved as <SpriteName>-<frame>.json files)
// Writes crawler/src/12_heads.js. A frame with no file keeps the game's automatic cut (48_deaths autoHead).
const fs = require('fs'), path = require('path');
const dir = process.argv[2]; if (!dir) { console.error('usage: node tools/heads.js <dir>'); process.exit(1); }
const out = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const d0 = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), d = d0.data || d0;
  if (!d.spr || !(d.frame >= 0 && d.frame <= 3) || typeof d.mask !== 'string' || typeof d.paint !== 'string') { console.warn('skipped', f); continue; }
  if (Buffer.from(d.mask, 'base64').length !== 256 || Buffer.from(d.paint, 'base64').length !== 1024) { console.warn('skipped (bad size)', f); continue; }
  const hp = typeof d.hpaint === 'string' && Buffer.from(d.hpaint, 'base64').length === 1024 ? d.hpaint : null; // (the head's own stump, painted since the head stump layer came in)
  (out[d.spr] = out[d.spr] || [null, null, null, null])[d.frame] = hp ? { m: d.mask, p: d.paint, h: hp } : { m: d.mask, p: d.paint };
}
const head = `// ===================== the heroes' heads, cut off by hand (the Head Cut Painter) =====================
// Per hero, per frame (0-3): m, which pixels of the frame (weapon already cut away) are the head (256 bytes, base64, row
// by row from the top left, 1 = head); p, the body redrawn where the neck is cut (1024 bytes RGBA, base64: alpha 0 the
// pixel as it was, 1 the pixel cleared, above that the pixel painted that colour: the stump); h, the head's own stump
// painted on the head (the same way; without it the game draws its own, 48_deaths rawNeck). A frame left null is cut
// by the game itself (48_deaths autoHead). Written by tools/heads.js from the painter's saved frames; not edited by hand.
`;
const body = 'const HEAD_CUTS_RAW = ' + JSON.stringify(out, null, 0).replace(/\],"/g, '],\n  "') + ';\n' +
  'const HEAD_CUTS = {}; for (const k in HEAD_CUTS_RAW) HEAD_CUTS[k] = HEAD_CUTS_RAW[k].map(d => d && { mask: b64u8(d.m), paint: b64u8(d.p), hpaint: d.h ? b64u8(d.h) : null });\n';
fs.writeFileSync(path.join(__dirname, '..', 'crawler', 'src', '12_heads.js'), head + body);
console.log('hand-cut heads:', Object.entries(out).map(([k, v]) => k + ' ' + v.map((x, i) => x ? (x.h ? i + '+' : i) : '-').join('')).join(', ') || 'none', '(+: its head stump painted too)');
