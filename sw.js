// Offline support: network first so updates arrive, cache only as the fallback when offline.
// Our own files are always revalidated with the server, so a new deploy is never hidden behind GitHub's 10-minute HTTP cache.
const CACHE = 'cellar-of-ruin-v2';
const FILES = ['./', './index.html', './version.txt', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const same = new URL(req.url).origin === location.origin;
  const net = same ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(r => r.redirected ? fetch(req) : r) : fetch(req);
  e.respondWith(net.then(r => { if (r.ok && same) { const cl = r.clone(); caches.open(CACHE).then(c => c.put(req, cl)); } return r; }).catch(() => caches.match(req).then(m => m || caches.match('./index.html'))));
});
