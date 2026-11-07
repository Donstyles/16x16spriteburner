// ===== Raycast renderer =====
const WH = 2.0;                 // wall height in world units
const LIGHT_K = 14;             // how many shade levels a fully lit cell removes
const R = {
  VW: 0, VH: 0, buf: null, img: null, cvs: null, ctx: null,
  zbuf: null, wallTop: null, wallBot: null,
  hfov: 1.25, planeLen: 0, projV: 0, horizon: 0, pitch: 0,
  camZ: 1.0, fogScale: 3.1, flick: 1, bob: 0, time: 0,
};
function initRenderer(w, h) {
  R.VW = w; R.VH = h;
  R.cvs = R.cvs || document.createElement('canvas');
  R.cvs.width = w; R.cvs.height = h;
  R.ctx = R.cvs.getContext('2d');
  R.img = R.ctx.createImageData(w, h);
  R.buf = new Uint32Array(R.img.data.buffer);
  R.zbuf = new Float32Array(w);
  R.wallTop = new Int16Array(w); R.wallBot = new Int16Array(w);
  R.planeLen = Math.tan(R.hfov / 2);
  R.projV = (w / 2) / R.planeLen;
}
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function renderWorld(map, cam, sprites) {
  const VW = R.VW, VH = R.VH, buf = R.buf, zbuf = R.zbuf, wallTop = R.wallTop, wallBot = R.wallBot;
  const px = cam.x, py = cam.y, dirX = Math.cos(cam.a), dirY = Math.sin(cam.a);
  const planeX = -dirY * R.planeLen, planeY = dirX * R.planeLen;
  const projV = R.projV, camZ = R.camZ + R.bob * 0.02;
  const horizon = (VH / 2 + R.pitch + R.bob) | 0; R.horizon = horizon;
  const fogScale = R.fogScale * R.flick;
  const mw = map.w, mh = map.h, type = map.type, wall = map.wall, light = map.light, doors = map.doors, doorIdx = map.doorIdx;
  const NL1 = NLV - 1;
  const fogFrame = FOG_WALL_IDS[((R.time * 8) | 0) % FOG_WALL_IDS.length];
  // ---- walls ----
  for (let x = 0; x < VW; x++) {
    const cameraX = 2 * x / VW - 1;
    const rdx = dirX + planeX * cameraX, rdy = dirY + planeY * cameraX;
    let mapX = px | 0, mapY = py | 0;
    const deltaX = rdx === 0 ? 1e30 : Math.abs(1 / rdx), deltaY = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
    let stepX, stepY, sideDistX, sideDistY;
    if (rdx < 0) { stepX = -1; sideDistX = (px - mapX) * deltaX; } else { stepX = 1; sideDistX = (mapX + 1 - px) * deltaX; }
    if (rdy < 0) { stepY = -1; sideDistY = (py - mapY) * deltaY; } else { stepY = 1; sideDistY = (mapY + 1 - py) * deltaY; }
    let side = 0, hit = 0, perpD = 1e9, wallX = 0, texId = 0, prevIdx = mapY * mw + mapX, steps = 0, isDoor = false;
    while (!hit && steps++ < 80) {
      if (sideDistX < sideDistY) { sideDistX += deltaX; mapX += stepX; side = 0; } else { sideDistY += deltaY; mapY += stepY; side = 1; }
      if (mapX < 0 || mapY < 0 || mapX >= mw || mapY >= mh) { hit = 2; break; }
      const idx = mapY * mw + mapX, t = type[idx];
      if (t === 1) {
        hit = 1;
        if (side === 0) { perpD = (mapX - px + (1 - stepX) / 2) / rdx; wallX = py + perpD * rdy; } else { perpD = (mapY - py + (1 - stepY) / 2) / rdy; wallX = px + perpD * rdx; }
        wallX -= Math.floor(wallX);
        texId = wall[idx];
        if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) wallX = 1 - wallX;
      } else if (t === 2) {
        const d = doors[doorIdx[idx]];
        let tt, hx, hy, ok = false;
        if (d.orient === 0) { // plane x = mapX+0.5 (walls N & S)
          if (rdx !== 0) { tt = (mapX + 0.5 - px) / rdx; hy = py + tt * rdy; if (tt > 0 && (hy | 0) === mapY) { wallX = hy - mapY; if (rdx > 0) wallX = 1 - wallX; ok = true; } }
        } else {
          if (rdy !== 0) { tt = (mapY + 0.5 - py) / rdy; hx = px + tt * rdx; if (tt > 0 && (hx | 0) === mapX) { wallX = hx - mapX; if (rdy < 0) wallX = 1 - wallX; ok = true; } }
        }
        if (ok) {
          const op = d.open;
          if (wallX >= op) { hit = 1; perpD = tt; wallX -= op; side = d.orient === 0 ? 0 : 1; texId = d.fog ? fogFrame : d.tex; isDoor = true; }
        }
        if (!hit) prevIdx = idx;
      } else prevIdx = idx;
    }
    if (hit !== 1) { zbuf[x] = 1e9; wallTop[x] = VH; wallBot[x] = -1; continue; }
    if (perpD < 0.02) perpD = 0.02;
    zbuf[x] = perpD;
    const lineH = projV / perpD;
    const top = horizon - (WH - camZ) * lineH, bot = horizon + camZ * lineH;
    const h = bot - top;
    let ys = Math.ceil(top), ye = Math.floor(bot);
    if (ys < 0) ys = 0; if (ye >= VH) ye = VH - 1;
    wallTop[x] = ys; wallBot[x] = ye;
    let lvl = perpD * fogScale - light[prevIdx] * LIGHT_K + (side === 1 ? 1.5 : 0);
    if (lvl < 0) lvl = 0; else if (lvl > NL1) lvl = NL1;
    lvl |= 0;
    let texX = (wallX * TW) | 0; if (texX > 15) texX = 15;
    const sh = WALLTEX[texId].sh;
    const base = lvl * (TW * WALL_TH) + texX * WALL_TH;
    const texStep = WALL_TH / h;
    let texPos = (ys - top) * texStep;
    let o = ys * VW + x;
    for (let y = ys; y <= ye; y++) {
      buf[o] = sh[base + ((texPos | 0) & 31)];
      texPos += texStep; o += VW;
    }
  }
  // ---- floor & ceiling ----
  const FSH = FLOOR_SETS._sh || (FLOOR_SETS._sh = FLOORTEX.map(t => t.sh));
  const ftex = map.floorTex, ctex = map.ceilTex;
  for (let y = 0; y < VH; y++) {
    let rowDist, isFloor;
    if (y > horizon) { rowDist = camZ * projV / (y - horizon); isFloor = true; }
    else if (y < horizon) { rowDist = (WH - camZ) * projV / (horizon - y) * 1.35; isFloor = false; }
    else continue;
    const stepX = rowDist * 2 * planeX / VW, stepY = rowDist * 2 * planeY / VW;
    let fx = px + rowDist * (dirX - planeX), fy = py + rowDist * (dirY - planeY);
    const lvlBase = rowDist * fogScale;
    if (lvlBase - LIGHT_K > NL1 + 2) {
      // fully fogged row: fill with fog colour of nearest texture cheaply
      const o0 = y * VW;
      for (let x = 0; x < VW; x++) {
        if (isFloor ? y <= wallBot[x] : y >= wallTop[x]) { fx += stepX; fy += stepY; continue; }
        let cx = fx | 0, cy = fy | 0; if (cx < 0) cx = 0; else if (cx >= mw) cx = mw - 1; if (cy < 0) cy = 0; else if (cy >= mh) cy = mh - 1;
        const idx = cy * mw + cx;
        buf[o0 + x] = FSH[isFloor ? ftex[idx] : ctex[idx]][NL1 * 256];
        fx += stepX; fy += stepY;
      }
      continue;
    }
    const o0 = y * VW;
    for (let x = 0; x < VW; x++) {
      if (isFloor ? y <= wallBot[x] : y >= wallTop[x]) { fx += stepX; fy += stepY; continue; }
      let cx = fx | 0, cy = fy | 0; if (cx < 0) cx = 0; else if (cx >= mw) cx = mw - 1; if (cy < 0) cy = 0; else if (cy >= mh) cy = mh - 1;
      const idx = cy * mw + cx;
      let lvl = lvlBase - light[idx] * LIGHT_K; if (lvl < 0) lvl = 0; else if (lvl > NL1) lvl = NL1;
      const tx = ((fx - cx) * 16) | 0, ty = ((fy - cy) * 16) | 0;
      buf[o0 + x] = FSH[isFloor ? ftex[idx] : ctex[idx]][(lvl | 0) * 256 + ty * 16 + tx];
      fx += stepX; fy += stepY;
    }
  }
  // ---- sprites ----
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const vis = [];
  for (let i = 0; i < sprites.length; i++) {
    const s = sprites[i];
    const sx = s.x - px, sy = s.y - py;
    const tx = invDet * (dirY * sx - dirX * sy), ty = invDet * (-planeY * sx + planeX * sy);
    if (ty <= 0.08) continue;
    s._tx = tx; s._ty = ty;
    vis.push(s);
  }
  vis.sort((a, b) => b._ty - a._ty);
  for (let i = 0; i < vis.length; i++) {
    const s = vis[i], ty = s._ty;
    const fr = s.spr.frames[s.frame % s.spr.frames.length];
    const fw = fr.w, fh = fr.h;
    const screenX = (VW / 2) * (1 + s._tx / ty) + (s.shake || 0) * projV / ty;
    const spH = s.h * projV / ty, spW = s.w * projV / ty;
    const bottom = horizon + (camZ - (s.z || 0) + s.h * (s.spr.padB || 0)) * projV / ty;
    const top = bottom - spH, left = screenX - spW / 2;
    let xs = Math.ceil(left), xe = Math.floor(left + spW); if (xs < 0) xs = 0; if (xe >= VW) xe = VW - 1;
    let ys = Math.ceil(top), ye = Math.floor(bottom); if (ys < 0) ys = 0; if (ye >= VH) ye = VH - 1;
    if (xs > xe || ys > ye) continue;
    const cx = clamp(s.x | 0, 0, mw - 1), cy = clamp(s.y | 0, 0, mh - 1);
    let lvl = ty * fogScale * (s.emissive ? 0.35 : 1) - (s.emissive ? 0 : light[cy * mw + cx] * LIGHT_K);
    if (lvl < 0) lvl = 0; else if (lvl > NL1) lvl = NL1; lvl |= 0;
    const sh = shadedFrame(fr), base = lvl * fw * fh;
    const txStep = fw / spW, tyStep = fh / spH;
    const alpha = s.alpha == null ? 1 : s.alpha, aThr = (alpha * 16) | 0;
    const tint = s.tint; // [r,g,b,t]
    for (let x = xs; x <= xe; x++) {
      if (ty >= zbuf[x]) continue;
      const texX = ((x - left) * txStep) | 0;
      if (texX < 0 || texX >= fw) continue;
      let tpos = (ys - top) * tyStep, o = ys * VW + x;
      for (let y = ys; y <= ye; y++, o += VW, tpos += tyStep) {
        const p = sh[base + ((tpos | 0) * fw) + texX];
        if (!(p >>> 24)) continue;
        if (aThr < 16 && BAYER4[((y & 3) << 2) | (x & 3)] >= aThr) continue;
        if (tint) buf[o] = lerpPx(p, tint[0], tint[1], tint[2], tint[3]); else buf[o] = p;
      }
    }
  }
}
function presentFrame() { R.ctx.putImageData(R.img, 0, 0); }
