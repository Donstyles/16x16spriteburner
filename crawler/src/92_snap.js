// ===================== a picture of part of the floor, fully lit (tests and the room gallery) =====================
// The floor, its torches, works, pits and doors, everything standing in it (and whoever is there, units too), and the
// ceiling over it, as drawn in play but without the dark. Returns a PNG data URL.
function snapArea(px0, py0, w, h, units = true) {
  const A = ARENA, cv = mkCanvas(w, h), c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.fillStyle = '#0b0c0f'; c.fillRect(0, 0, w, h); c.translate(-px0, -py0);
  drawGround(c, px0, py0, w, h);
  const tb = A.th.tone === 'brown' ? 5 : 0; if (A.wallCandles) drawCandles(c, A.wallCandles); for (const t of A.torches) { if (t.candles) continue; if (A.th.sheet === 'crypt' && !t.exit) { cryptTorch(c, t); continue; } if (t.out) c.drawImage(IMG.cellar, (t.ember ? 31 : 30) * TS, (tb ? 5 : 2) * TS, TS, TS, t.x - 8, t.y - 9, TS, TS); else c.drawImage(IMG.cellar, (tb + (t.f || 0) % 4) * TS, 26 * TS, TS, TS, t.x - 8, t.y - 9, TS, TS); }
  drawWorks(c); drawPits(c); drawMagma(c, [px0, py0, w, h]); drawFloods(c, [px0, py0, w, h]); drawDoors(c);
  for (const p of A.props) if (!p.dead && !p.flat && propSplit(p)) drawPropPart(c, p, true);
  const list = []; if (units) for (const u of G.units) if (!u.dead) list.push([u.y, 0, u]); for (const p of A.props) if (!p.dead && !p.flat) { const S = propSplit(p); list.push([S ? S.mid : p.y, 1, p]); } for (const d of G.drops) list.push([d.y, 2, d]);
  for (const d of A.doors || []) { const s = STRUTS(d); if (s) list.push(s); if (d.side === 'S' && d.k > 0) list.push([(d.cells[0][1] + 2) * TS + S_DROP - 3, 7, d]); } list.sort((a, b) => a[0] - b[0]); for (const [, k, o] of list) if (k === 0) drawUnit(c, o); else if (k === 1) { if (propSplit(o)) drawPropPart(c, o, false); else drawProp(c, o); } else if (k === 6) drawStrut(c, o); else if (k === 7) drawSouthDoor(c, o); else drawDrop(c, o);
  drawCeil(c, px0, py0, w, h); drawSouthStruts(c);
  return cv.toDataURL('image/png');
}
