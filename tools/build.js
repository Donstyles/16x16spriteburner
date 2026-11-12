// Build Cellar of Ruin: one self-contained page (assets inlined) as index.html for GitHub Pages / Home Screen,
// and dist/artifact.html (no document skeleton) for the Claude artifact.
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const rd = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
const files = fs.readdirSync(path.join(root, 'src')).filter(f => f.endsWith('.js')).sort();
const js = '(function(){\n' + files.map(f => `// ---- ${f} ----\n` + rd('src', f)).join('\n') + '\n})();';
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', f)).toString('base64');
const peerjs = rd('vendor', 'peerjs.min.js').replace(/<\/script/gi, '<\\/script'); // PeerJS (MIT): matchmaking and WebRTC data channels for co-op
const assets = 'window.__ASSETS=' + JSON.stringify({ cellar: b64('cellar.png'), mobs: b64('mobs.png'), mobsJson: JSON.parse(rd('assets', 'mobs.json')) }) + ';';
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@700;900&family=Teko:wght@500;600&display=swap">';
const head = `<title>Cellar of Ruin</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>\n${rd('src', 'style.css')}</style>`;
const body = '<canvas id="c" aria-label="Cellar of Ruin, a dungeon battle that plays itself"></canvas>\n<div id="safe"></div>\n<div id="loading">Cellar of Ruin</div>';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), `${head}\n${body}\n<script>\n${peerjs}\n</script>\n<script>\n${assets}\n${js}\n</script>\n`);
const pwa = '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Cellar of Ruin">\n<meta name="theme-color" content="#0b0c0f">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/icon-180.png">\n<link rel="icon" href="icons/icon-96.png">';
const sw = "if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});";
fs.writeFileSync(path.join(root, 'index.html'), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n${pwa}\n${head}\n</head>\n<body>\n${body}\n<script>\n${peerjs}\n</script>\n<script>\n${assets}\n${js}\n${sw}\n</script>\n</body>\n</html>\n`);
console.log('built', files.length, 'modules; js', (js.length / 1024).toFixed(0) + 'KB; page', (fs.statSync(path.join(root, 'index.html')).size / 1024).toFixed(0) + 'KB');
