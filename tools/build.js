// Build: concatenates src/*.js into game.js, writes index.html (multi-file, PWA) and dist/index.html (single file, everything inlined).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const files = fs.readdirSync(srcDir).filter(f => /^\d+_.*\.js$/.test(f)).sort();
const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
let js = "'use strict';\n" + files.map(f => '// ---- ' + f + ' ----\n' + fs.readFileSync(path.join(srcDir, f), 'utf8')).join('\n');
js = '(function(){\n' + js + '\n})();\n';
fs.writeFileSync(path.join(root, 'game.js'), js);
const tpl = fs.readFileSync(path.join(srcDir, 'index.template.html'), 'utf8');
// multi-file version
const head = '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/icon-180.png">\n<link rel="icon" type="image/png" sizes="96x96" href="icons/icon-96.png">';
const scripts = `<script>window.ASSET_SRC = { tiles: 'assets/tiles.png', creatures: 'assets/creatures.png', cindex: 'assets/creatures.json' };
if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('sw.js?v=${version}').catch(() => {})); }</script>
<script src="game.js?v=${version}"></script>`;
fs.writeFileSync(path.join(root, 'index.html'), tpl.replace('<!--HEAD-->', head).replace('<!--SCRIPTS-->', scripts));
fs.writeFileSync(path.join(root, 'sw.js'), fs.readFileSync(path.join(root, 'sw.js'), 'utf8').replace(/ashen-mandate-[0-9_]+/, 'ashen-mandate-' + version).replace('__VERSION__', version));
// single-file version
const b64 = p => 'data:image/png;base64,' + fs.readFileSync(path.join(root, p)).toString('base64');
const cindex = fs.readFileSync(path.join(root, 'assets/creatures.json'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
manifest.icons = [{ src: b64('icons/icon-192.png'), sizes: '192x192', type: 'image/png' }, { src: b64('icons/icon-512.png'), sizes: '512x512', type: 'image/png' }];
manifest.start_url = '.'; delete manifest.scope;
const head1 = `<link rel="manifest" href="data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}">\n<link rel="apple-touch-icon" href="${b64('icons/icon-180.png')}">\n<link rel="icon" type="image/png" href="${b64('icons/icon-96.png')}">`;
const scripts1 = `<script>window.ASSET_SRC = { tiles: '${b64('assets/tiles.png')}', creatures: '${b64('assets/creatures.png')}', cindexData: ${cindex} };</script>\n<script>${js.replace(/<\/script/g, '<\\/script')}</script>`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), tpl.replace('<!--HEAD-->', head1).replace('<!--SCRIPTS-->', scripts1));
console.log('built', files.length, 'modules, game.js', (js.length / 1024).toFixed(0) + 'KB, dist/index.html', (fs.statSync(path.join(root, 'dist/index.html')).size / 1024).toFixed(0) + 'KB');
