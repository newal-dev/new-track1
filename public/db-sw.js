/* Inclusive Access offline support (service worker).
   A service worker only works for the site that serves it, so the partner adds ONE file to their own site, for example /db-sw.js:
       self.DB_FORM_HOST = 'https://YOUR-HOST';
       importScripts('https://YOUR-HOST/db-sw.js');
   and sets sw='/db-sw.js' on the tag. Then the partner page, the widget, the fonts, the job list and every audio clip
   already heard keep working without a connection. Answers typed offline are kept by the widget itself (localStorage)
   and sent when the connection returns; this file never sees or stores answers (POST requests are not touched). */
const DB_HOST = (self.DB_FORM_HOST || new URL('.', self.location).origin).replace(/\/$/, '');
const DB_CACHE = 'db-form-v2';
const DB_PRECACHE = [DB_HOST + '/widget.js', DB_HOST + '/fonts/atkinson-hyperlegible-latin-400-normal.woff2', DB_HOST + '/fonts/atkinson-hyperlegible-latin-700-normal.woff2',
  DB_HOST + '/fonts/noto-sans-ethiopic-ethiopic-400-normal.woff2', DB_HOST + '/fonts/noto-sans-ethiopic-ethiopic-700-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(DB_CACHE).then(c => Promise.all(DB_PRECACHE.map(u => fetch(u, { mode: 'cors' }).then(r => r.ok && c.put(u, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('db-form-') && k !== DB_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Audio elements ask for byte ranges. Answer them from the cached full file.
async function dbRange(req, res) {
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.get('range') || '');
  if (!m) return res;
  const buf = await res.arrayBuffer(), start = +m[1], end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}
async function dbCacheFirst(req, key) {
  const c = await caches.open(DB_CACHE), hit = await c.match(key);
  if (hit) return hit;
  const r = await fetch(key, { mode: 'cors' });
  if (r.ok) c.put(key, r.clone());
  return r;
}
async function dbNetworkFirst(req) {
  const c = await caches.open(DB_CACHE);
  try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
  catch (x) { const hit = await c.match(req, { ignoreVary: true }); if (hit) return hit; throw x; }
}

self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return; // answers (POST) always go straight to the network
  if (u.origin === DB_HOST && u.pathname.startsWith('/audio/')) {
    const key = u.origin + u.pathname;
    e.respondWith(dbCacheFirst(req, key).then(r => (req.headers.has('range') ? dbRange(req, r.clone()) : r)).catch(() => fetch(req)));
  } else if (u.origin === DB_HOST && (u.pathname === '/widget.js' || u.pathname === '/db-form.js' || u.pathname.startsWith('/fonts/'))) {
    e.respondWith(caches.open(DB_CACHE).then(async c => {
      const hit = await c.match(u.origin + u.pathname);
      const net = fetch(req).then(r => { if (r.ok) c.put(u.origin + u.pathname, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  } else if (u.origin === DB_HOST && u.pathname.startsWith('/v1/jobs')) {
    e.respondWith(dbNetworkFirst(req));
  } else if (req.mode === 'navigate' && u.origin === self.location.origin) {
    e.respondWith(dbNetworkFirst(req));
  }
});
