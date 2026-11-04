/* HarmonyPlug service worker — offline lesson content.
   © 2026 W. Carolino. Todos os direitos reservados. */
const CACHE = 'harmonyplug-1.4.0-mw1gt003';
const PRECACHE = ["./","./index.html","./manifest.json","./doctor-w-avatar.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png","./icons/logo.svg","./assets/index-DeZVx6Yn.css","./assets/react-CrowJ5J7.js","./assets/supabase-CB7MGzWB.js","./assets/index-DMF8qOqZ.js"];
// Grand-piano samples (~5 MB): a separate cache that survives app updates.
const SAMPLE_CACHE = 'harmonyplug-samples-v1';
const SAMPLES = ["./samples/piano/A0v13.mp3","./samples/piano/A0v5.mp3","./samples/piano/A1v13.mp3","./samples/piano/A1v5.mp3","./samples/piano/A2v13.mp3","./samples/piano/A2v5.mp3","./samples/piano/A3v13.mp3","./samples/piano/A3v5.mp3","./samples/piano/A4v13.mp3","./samples/piano/A4v5.mp3","./samples/piano/A5v13.mp3","./samples/piano/A5v5.mp3","./samples/piano/A6v13.mp3","./samples/piano/A6v5.mp3","./samples/piano/A7v13.mp3","./samples/piano/A7v5.mp3","./samples/piano/C1v13.mp3","./samples/piano/C1v5.mp3","./samples/piano/C2v13.mp3","./samples/piano/C2v5.mp3","./samples/piano/C3v13.mp3","./samples/piano/C3v5.mp3","./samples/piano/C4v13.mp3","./samples/piano/C4v5.mp3","./samples/piano/C5v13.mp3","./samples/piano/C5v5.mp3","./samples/piano/C6v13.mp3","./samples/piano/C6v5.mp3","./samples/piano/C7v13.mp3","./samples/piano/C7v5.mp3","./samples/piano/C8v13.mp3","./samples/piano/C8v5.mp3","./samples/piano/Ds1v13.mp3","./samples/piano/Ds1v5.mp3","./samples/piano/Ds2v13.mp3","./samples/piano/Ds2v5.mp3","./samples/piano/Ds3v13.mp3","./samples/piano/Ds3v5.mp3","./samples/piano/Ds4v13.mp3","./samples/piano/Ds4v5.mp3","./samples/piano/Ds5v13.mp3","./samples/piano/Ds5v5.mp3","./samples/piano/Ds6v13.mp3","./samples/piano/Ds6v5.mp3","./samples/piano/Ds7v13.mp3","./samples/piano/Ds7v5.mp3","./samples/piano/Fs1v13.mp3","./samples/piano/Fs1v5.mp3","./samples/piano/Fs2v13.mp3","./samples/piano/Fs2v5.mp3","./samples/piano/Fs3v13.mp3","./samples/piano/Fs3v5.mp3","./samples/piano/Fs4v13.mp3","./samples/piano/Fs4v5.mp3","./samples/piano/Fs5v13.mp3","./samples/piano/Fs5v5.mp3","./samples/piano/Fs6v13.mp3","./samples/piano/Fs6v5.mp3","./samples/piano/Fs7v13.mp3","./samples/piano/Fs7v5.mp3"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() =>
        caches.open(SAMPLE_CACHE).then((sc) =>
          Promise.allSettled(
            SAMPLES.map((u) =>
              sc.match(u).then((hit) => hit || fetch(u).then((res) => (res.ok ? sc.put(u, res) : undefined))),
            ),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('harmonyplug-') && k !== CACHE && k !== SAMPLE_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never cache Supabase / APIs
  if (req.mode === 'navigate') {
    // network-first for the app shell, fallback to cache offline
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }
  // cache-first for hashed assets, lesson content, icons, avatar
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(url.pathname.includes('/samples/') ? SAMPLE_CACHE : CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
