// node tools/determinism.js [n]: build the same seed and floor in two separate page loads (and twice in one) and compare
// everything a floor is made of: tiles, walls, props, creatures, doors, plates, water, cracks, the army
const { chromium } = require('playwright'); const crypto = require('crypto'); const N = +(process.argv[2] || 12);
const snap = () => { const A = CR.ARENA(), r = v => Math.round(v * 10) / 10; return JSON.stringify({ fl: Array.from(A.fl), wt: Array.from(A.wt), army: A.army, name: A.name, sets: A.sets, props: A.props.map(p => [p.kind, r(p.x), r(p.y), p.tile && p.tile.join()]), foes: CR.G.foes.map(f => [f.spr, r(f.x), r(f.y), !!f.exitGuard]), doors: A.doors.map(d => [d.side, d.cells.join(), d.strut, d.motif]), plates: (A.plates || []).map(p => [p.tx, p.ty, !!p.hidden]), pools: (A.pools || []).map(p => [p.x0, p.y0, p.x1, p.y1]), cracks: (A.cracks || []).map(c => [c.x, c.y, c.holds]), stairs: [A.stairs.sx, A.stairs.sy] }); };
(async () => { const b = await chromium.launch(); const hashes = [];
  const cases = Array.from({ length: N }, (_, i) => ({ seed: ((i * 2654435761) >>> 0).toString(16).toUpperCase(), floor: 1 + (i % 8), prevArmy: null }));
  for (let load = 0; load < 2; load++) { const p = await (await b.newContext({ viewport: { width: 932, height: 430 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///home/user/16x16spriteburner/crawler/index.html'); await p.waitForFunction(() => window.CR && CR.G.mode === 'menu');
    const hs = []; for (const c of cases) { const s1 = await p.evaluate(([c, snap]) => { CR.replayFloor(c); return eval('(' + snap + ')')(); }, [c, snap.toString()]); hs.push(crypto.createHash('sha1').update(s1).digest('hex').slice(0, 10)); if (load === 0) { const s2 = await p.evaluate(([c, snap]) => { CR.replayFloor(c); return eval('(' + snap + ')')(); }, [c, snap.toString()]); if (s2 !== s1) console.log('same load differs for', JSON.stringify(c)); } }
    hashes.push(hs); if (errs.length) console.log('errors', errs.slice(0, 3)); await p.close(); }
  const diff = hashes[0].filter((h, i) => h !== hashes[1][i]).length; console.log('cases', N, 'differ across loads', diff, '| distinct floors', new Set(hashes[0]).size);
  await b.close(); })();
