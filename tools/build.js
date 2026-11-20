// Build one self-contained page (assets inlined) as index.html for GitHub Pages / Home Screen,
// and dist/artifact.html (no document skeleton) for the Claude artifact.
//   node tools/build.js           Cellar of Ruin            (src/ -> index.html, dist/, version.txt)
//   node tools/build.js crawler   Cellar of Ruin II         (crawler/src/ -> crawler/index.html, crawler/dist/, crawler/version.txt)
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const T = process.argv[2] === 'crawler'
  ? { dir: path.join(root, 'crawler'), title: 'Cellar of Ruin II', short: 'Cellar II', aria: 'Cellar of Ruin II, a dungeon crawl for one to four heroes', extra: { doors: 'crawler/assets/cellar_doors.png', items: 'crawler/assets/items.png', ores: 'crawler/assets/ores.png', scrolls: 'crawler/assets/scrolls.png', ends: 'crawler/assets/beam_ends.png' }, pwa: 'crawler' }
  : { dir: root, title: 'Cellar of Ruin', short: 'Cellar of Ruin', aria: 'Cellar of Ruin, a dungeon battle for one to four heroes', extra: {}, pwa: 'root' };
const rd = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
const srcDir = path.join(T.dir, 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();
const js = '(function(){\n' + files.map(f => `// ---- ${f} ----\n` + fs.readFileSync(path.join(srcDir, f), 'utf8')).join('\n') + '\n})();';
const b64f = p => 'data:image/png;base64,' + fs.readFileSync(path.join(root, p)).toString('base64');
const b64 = f => b64f(path.join('assets', f));
const peerjs = rd('vendor', 'peerjs.min.js').replace(/<\/script/gi, '<\\/script'); // PeerJS (MIT): matchmaking and WebRTC data channels for co-op
const ver = require('crypto').createHash('sha1').update(js).digest('hex').slice(0, 8); fs.writeFileSync(path.join(T.dir, 'version.txt'), ver + '\n'); // lets running games notice a newer build
const extra = {}; for (const k in T.extra) extra[k] = b64f(T.extra[k]);
if (T.pwa === 'crawler') extra.numerals = 'data:font/ttf;base64,' + fs.readFileSync(path.join(root, 'crawler', 'assets', 'fonts', 'cellar-numerals.ttf')).toString('base64'); // the lettering trial's numbers (Grenze Black, level digits: crawler/assets/fonts)
const assets = `window.__BUILD='${ver}';` + 'window.__ASSETS=' + JSON.stringify({ cellar: b64('cellar.png'), mobs: b64('mobs.png'), mobsJson: JSON.parse(rd('assets', 'mobs.json')), ...extra }) + ';';
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@700;900&family=Teko:wght@500;600' + (T.pwa === 'crawler' ? '&family=Pirata+One&family=Cinzel:wght@700;800' : '') + '&display=swap">'; // (the crawler also loads the faces of its lettering trial: only fetched once used)
const head = `<title>${T.title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>\n${fs.readFileSync(path.join(srcDir, 'style.css'), 'utf8')}</style>`;
const body = `<canvas id="c" aria-label="${T.aria}"></canvas>\n<div id="safe"></div>\n<div id="loading">${T.title}</div>`;
fs.mkdirSync(path.join(T.dir, 'dist'), { recursive: true });
fs.writeFileSync(path.join(T.dir, 'dist', 'artifact.html'), `${head}\n${body}\n<script>\n${peerjs}\n</script>\n<script>\n${assets}\n${js}\n</script>\n`);
// the sequel lives one folder down and shares the first game's icons and offline worker
const up = T.pwa === 'crawler' ? '../' : '';
const pwa = `<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="${T.short}">\n<meta name="theme-color" content="#0b0c0f">\n` + '<link rel="manifest" href="manifest.webmanifest">\n' + `<link rel="apple-touch-icon" href="${up}icons/icon-180.png">\n<link rel="icon" href="${up}icons/icon-96.png">`;
const sw = `if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('${up}sw.js').catch(() => {});`;
fs.writeFileSync(path.join(T.dir, 'index.html'), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n${pwa}\n${head}\n</head>\n<body>\n${body}\n<script>\n${peerjs}\n</script>\n<script>\n${assets}\n${js}\n${sw}\n</script>\n</body>\n</html>\n`);
console.log('built', T.title + ':', files.length, 'modules; version', ver + ';', 'js', (js.length / 1024).toFixed(0) + 'KB; page', (fs.statSync(path.join(T.dir, 'index.html')).size / 1024).toFixed(0) + 'KB');
