/* HarmonyPlug service worker — offline lesson content.
   © 2026 W. Carolino. Todos os direitos reservados. */
const CACHE = 'harmonyplug-1.0.0-mw015lnj';
const PRECACHE = ["./","./index.html","./manifest.json","./doctor-w-avatar.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png","./icons/logo.svg","./assets/index-B_M0-kBY.css","./assets/react-CrowJ5J7.js","./assets/supabase-CB7MGzWB.js","./assets/index-9pAILF9r.js"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('harmonyplug-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
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
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
