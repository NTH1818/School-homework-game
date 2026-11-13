// Offline support: network first (so new months/fixes arrive), cache as fallback.
const CACHE = 'kipina-v4';
const CORE = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icon.svg',
  'js/main.js', 'js/glyphs.js', 'js/bank.js', 'js/ui.js', 'js/store.js', 'js/speech.js', 'js/sound.js', 'js/words.js', 'js/engine.js', 'js/music.js', 'js/songs.js',
  'js/activities/index.js', 'js/activities/pick.js', 'js/activities/tapall.js', 'js/activities/shapes.js',
  'js/activities/rhymebuild.js', 'js/activities/math.js', 'js/activities/count.js', 'js/activities/sentence.js',
  'js/activities/trace.js', 'js/activities/say.js', 'js/activities/sequence.js', 'js/activities/hundred.js',
  'js/activities/song.js', 'js/activities/today.js', 'js/activities/tooth.js', 'js/activities/letters.js',
  'js/activities/coins.js', 'js/activities/pattern.js',
  'content/index.json', 'content/2026-11.json', 'content/curriculum-bc.json',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
