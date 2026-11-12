// Two-player co-op test: one page hosts a room, a second page joins it, both fight for a while.
// usage: node tools/cooptest.js <outdir> [seconds] [peerhost:port | cloud]
// Needs the game served on 127.0.0.1:8787 and (unless "cloud") a PeerServer on the given host:port.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp', secs = +(process.argv[3] || 40), ps = process.argv[4] || '127.0.0.1:9000';
  const q = ps === 'cloud' ? '' : `?peerhost=${ps.split(':')[0]}&peerport=${ps.split(':')[1]}`;
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-features=WebRtcHideLocalIpsWithMdns,CalculateNativeWinOcclusion', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
  const mk = async (tag) => { const p = await (await browser.newContext({ viewport: { width: 932, height: 430 } })).newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(tag + ' PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') p.errs.push(tag + ' CONSOLE ' + m.text().slice(0, 200)); }); return p; };
  const host = await mk('host'), guest = await mk('guest');
  await host.goto('http://127.0.0.1:8787/index.html' + q);
  await host.waitForFunction(() => window.CR && CR.G.mode === 'play' && CR.G.choice && CR.G.choice.kind === 'draft', null, { timeout: 30000 });
  await host.evaluate(() => { CR.G.acted = true; CR.autoDraft(); CR.hostOpen(); });
  await host.waitForFunction(() => CR.NET.on && CR.NET.code, null, { timeout: 30000 });
  const code = await host.evaluate(() => CR.NET.code); console.log('room', code, 'host hero', await host.evaluate(() => CR.G.me.key));
  await guest.goto('http://127.0.0.1:8787/index.html' + (q ? q + '&' : '?') + 'room=' + code);
  await guest.waitForFunction(() => window.CR && CR.NET.on && CR.G.choice && CR.G.choice.kind === 'draft', null, { timeout: 30000 });
  await guest.waitForTimeout(500); await guest.screenshot({ path: path.join(out, 'guest_draft.png') });
  // guest picks by tapping cards like a player would
  for (let k = 0; k < 3; k++) { await guest.waitForFunction(k => CR.G.choice && CR.G.choice.kind === 'draft' && CR.G.choice.step === k + 1 && CR.G.choice.t > 0.4, k, { timeout: 15000 }); const r = await guest.evaluate(() => CR.G.choice.rects[2] || CR.G.choice.rects[0]); await guest.mouse.click(r[0] + r[2] / 2, r[1] + r[3] / 2); }
  await guest.waitForFunction(() => CR.G.me, null, { timeout: 15000 }); await guest.waitForTimeout(3500); await host.evaluate(() => { window.CR_PROF = {}; });
  console.log('guest hero', await guest.evaluate(() => CR.G.me.key + ' pid ' + CR.G.me.pid + ' slots ' + JSON.stringify(CR.G.slots)));
  await guest.evaluate(() => { window.__rx = 0; window.__n = 0; CR.NET.host.on('data', m => { window.__rx += JSON.stringify(m).length; window.__n++; }); });
  // guest steers and casts by keyboard; check the host saw it
  const hp0 = await host.evaluate(() => { const h = CR.G.heroes.find(x => x.pid === 1); return [h.x, h.y]; });
  await guest.keyboard.down('KeyD'); await guest.waitForTimeout(800); await guest.keyboard.up('KeyD');
  const hp1 = await host.evaluate(() => { const h = CR.G.heroes.find(x => x.pid === 1); return [h.x, h.y]; });
  console.log('guest hero moved on host by', (hp1[0] - hp0[0]).toFixed(1), (hp1[1] - hp0[1]).toFixed(1));
  await guest.keyboard.press('Digit1'); await guest.waitForTimeout(300);
  console.log('guest skill 1 on host:', await host.evaluate(() => { const h = CR.G.heroes.find(x => x.pid === 1), n = h.sb.slots[0]; return n + ' cd ' + (h.cd[n] || 0).toFixed(2); }));
  await guest.screenshot({ path: path.join(out, 'guest_fight.png') }); await host.screenshot({ path: path.join(out, 'host_fight.png') });
  // let both play on autopilot, answer card picks on the guest when they appear
  await guest.evaluate(() => { CR.G.autoMode = 2; }); await host.evaluate(() => { CR.G.autoMode = 2; });
  const t0 = Date.now(); let picks = 0, shot = false;
  while (Date.now() - t0 < secs * 1000) {
    await guest.waitForTimeout(1000);
    const st = await guest.evaluate(() => ({ ch: CR.G.choice && CR.G.choice.netId && CR.G.choice.picked < 0 && CR.G.choice.t > 0.5 ? CR.G.choice.rects.length : 0 }));
    if (st.ch) { const r = await guest.evaluate(() => CR.G.choice.rects[0]); await guest.mouse.click(r[0] + r[2] / 2, r[1] + r[3] / 2); picks++; if (!shot) { shot = true; } }
    if (!shot && (Date.now() - t0) > secs * 500) { await guest.screenshot({ path: path.join(out, 'guest_mid.png') }); await host.screenshot({ path: path.join(out, 'host_mid.png') }); shot = true; }
  }
  const gs = await guest.evaluate(() => ({ floor: CR.G.floor, wave: CR.G.wave, lvl: CR.G.lvl, units: CR.G.units.length, heroes: CR.G.heroes.map(h => h.pname + ':' + h.key + (h.dead ? ':dead' : '')), known: [...CR.G.known], mods: CR.G.modsTaken, kbps: (window.__rx / 1024 / ((performance.now() - 0) / 1000)).toFixed(1), msgs: window.__n, rx: window.__rx, err: window.CR_ERR }));
  const hs = await host.evaluate(() => ({ floor: CR.G.floor, wave: CR.G.wave, lvl: CR.G.lvl, units: CR.G.units.length, heroes: CR.G.heroes.map(h => h.pname + ':' + h.key + (h.dead ? ':dead' : '')), guestKnown: [...CR.G.heroes.find(x => x.pid === 1).sb.known], pend: CR.NET.pend.size, err: window.CR_ERR }));
  console.log('guest', JSON.stringify(gs)); console.log('host', JSON.stringify(hs)); console.log('guest picks', picks, 'avg KB/s', (gs.rx / 1024 / (secs + 2)).toFixed(1), 'avg msg bytes', Math.round(gs.rx / Math.max(1, gs.msgs)));
  await guest.screenshot({ path: path.join(out, 'guest_end.png') }); await host.screenshot({ path: path.join(out, 'host_end.png') });
  const prof = await host.evaluate(() => window.CR_PROF); const n = prof.n; console.log('per-snapshot bytes:', Object.entries(prof).filter(([k]) => k !== 'n').sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, v]) => k + ' ' + Math.round(v / n)).join(', '));
  // drop the guest's connection (like a screen lock) and check it rejoins as the same hero
  const before = await host.evaluate(() => CR.G.heroes.find(x => x.pid === 1).id);
  await guest.evaluate(() => CR.NET.host.close());
  await host.waitForFunction(() => CR.G.heroes.some(x => x.pid === 1 && x.away), null, { timeout: 15000 }).then(() => console.log('host: guest hero is away, on autopilot')).catch(() => console.log('host never saw the drop'));
  await guest.waitForURL(/retry=1/, { timeout: 20000 }).catch(() => console.log('guest did not reload'));
  await guest.waitForFunction(() => window.CR && CR.NET && CR.NET.on && CR.G.me, null, { timeout: 40000 }).catch(() => console.log('guest did not come back'));
  const after = await host.evaluate(() => { const h = CR.G.heroes.find(x => x.pid === 1); return h && { id: h.id, away: !!h.away }; });
  console.log('rejoin:', JSON.stringify(after), 'same hero', after && after.id === before, 'guest url', guest.url().replace(/^.*index.html/, ''));
  console.log('errors', host.errs.length + guest.errs.length); [...host.errs, ...guest.errs].slice(0, 8).forEach(e => console.log(e));
  await browser.close();
})();
