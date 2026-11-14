// Co-op in the sequel: the doors shut only once every hero is inside the room.
// usage: GAME_URL=http://127.0.0.1:8787/crawler/index.html node tools/cooprooms.js <outdir> [peerhost:port]
const { chromium } = require('playwright'); const path = require('path');
const BASE = process.env.GAME_URL || 'http://127.0.0.1:8787/crawler/index.html';
(async () => {
  const out = process.argv[2] || '/tmp', ps = process.argv[3] || '127.0.0.1:9000', q = `?peerhost=${ps.split(':')[0]}&peerport=${ps.split(':')[1]}`;
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-features=WebRtcHideLocalIpsWithMdns', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const mk = async tag => { const p = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(tag + ' ' + e.message)); return p; };
  const host = await mk('host'), guest = await mk('guest'), tap = async (p, r) => p.mouse.click(r[0] + r[2] / 2, r[1] + r[3] / 2);
  const tapCard = async (p, k) => { await p.waitForFunction(k => CR.G.choice && CR.G.choice.kind === 'draft' && CR.G.choice.step === k && CR.G.choice.t > 0.4, k, { timeout: 20000 }); await tap(p, await p.evaluate(() => CR.G.choice.rects[0])); };
  await host.goto(BASE + q); await host.waitForFunction(() => window.CR && CR.G.mode === 'menu', null, { timeout: 30000 });
  await host.evaluate(() => CR.startHost()); await host.waitForFunction(() => CR.G.mode === 'lobby' && CR.NET.on && CR.NET.code, null, { timeout: 30000 });
  const code = await host.evaluate(() => CR.NET.code); await host.evaluate(() => CR.lobbyPick('warrior'));
  await guest.goto(BASE + q + '&room=' + code); await guest.waitForFunction(() => window.CR && CR.NET.on && CR.G.mode === 'lobby' && CR.NET.seats, null, { timeout: 30000 }); await guest.waitForTimeout(400);
  const hr = await guest.evaluate(() => CR.MENU.rects.map(b => b.r)); await tap(guest, hr[hr.length - 4]);
  await host.waitForFunction(() => Object.keys(CR.NET.lobby.picks).length === 2, null, { timeout: 10000 });
  const desc = await host.evaluate(() => CR.MENU.rects.map(b => b.r).filter(r => r[1] > CR.VIEW.h * 0.7).sort((a, b) => b[2] - a[2])[0]); await tap(host, desc);
  await guest.waitForFunction(() => CR.G.mode === 'play', null, { timeout: 8000 }); await host.evaluate(() => { CR.G.acted = true; });
  await tapCard(host, 2); await tapCard(host, 3); await tapCard(guest, 2); await tapCard(guest, 3);
  await guest.waitForFunction(() => CR.G.me, null, { timeout: 15000 }); await host.waitForTimeout(2500);
  // both steer by hand and stand still; the host's hero walks (is placed) into the nearest fight room alone
  const room = await host.evaluate(() => { const A = CR.ARENA(), r = A.rooms.filter(r => r.waves && r.kind !== 'end').sort((a, b) => Math.hypot(a.cx - A.start.cx, a.cy - A.start.cy) - Math.hypot(b.cx - A.start.cx, b.cy - A.start.cy))[0]; const h = CR.G.me; h.x = (r.ix0 + r.ix1 + 1) / 2 * 16; h.y = (r.iy0 + r.iy1 + 1) / 2 * 16; return r.i; });
  await host.waitForTimeout(1500);
  const w1 = { host: await host.evaluate(() => ({ phase: CR.G.phase, room: CR.G.roomI, wait: CR.G.waitMsg })), guest: await guest.evaluate(() => ({ phase: CR.G.phase, room: CR.G.roomI, wait: CR.G.waitMsg })) };
  console.log('one hero inside:', JSON.stringify(w1)); await host.screenshot({ path: path.join(out, 'rooms_waiting_host.png') });
  // now the guest's hero goes in too (the host moves it, as if the guest had walked)
  await host.evaluate(r => { const A = CR.ARENA(), R = A.rooms[r], h = CR.G.heroes.find(x => x !== CR.G.me); h.x = (R.ix0 + R.ix1 + 1) / 2 * 16 + 20; h.y = (R.iy0 + R.iy1 + 1) / 2 * 16; }, room);
  await guest.waitForFunction(r => CR.G.roomI === r, room, { timeout: 8000 }); await guest.waitForTimeout(2500);
  const w2 = await guest.evaluate(() => { const A = CR.ARENA(); return { phase: CR.G.phase, room: CR.G.roomI, cur: A.cur && A.cur.i, shut: A.doors.filter(d => d.room === CR.G.roomI).map(d => d.k.toFixed(2)), solid: A.doors.filter(d => d.room === CR.G.roomI).every(d => d.cells.every(([x, y]) => A.fl[y * A.w + x] === 2)), mons: CR.G.units.filter(u => u.team === 'mon').length }; });
  console.log('both inside, guest sees:', JSON.stringify(w2)); await guest.screenshot({ path: path.join(out, 'rooms_shut_guest.png') });
  await host.evaluate(() => { CR.G.autoMode = 2; for (const h of CR.G.heroes) if (h.inp) { h.inp.mv = 2; h.inp.sp = 1; } }); await guest.evaluate(() => { CR.G.autoMode = 2; });
  await host.waitForFunction(r => CR.G.clearMask & (1 << r), room, { timeout: 90000 }).catch(() => {});
  await guest.waitForTimeout(1500);
  const w3 = await guest.evaluate(r => { const A = CR.ARENA(); return { phase: CR.G.phase, room: CR.G.roomI, cleared: !!(CR.G.clearMask & (1 << r)), open: A.doors.filter(d => d.room === r).every(d => d.k < 0.05 && d.cells.every(([x, y]) => A.fl[y * A.w + x] === 1)), seen: A.rooms.filter(x => x.seen).length }; }, room);
  console.log('after the fight, guest sees:', JSON.stringify(w3)); await guest.screenshot({ path: path.join(out, 'rooms_open_guest.png') });
  console.log('errors', host.errs.length + guest.errs.length, host.errs.concat(guest.errs).slice(0, 4)); await browser.close();
})();
