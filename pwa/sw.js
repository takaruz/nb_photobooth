// Service worker template. The build fills in the version and precache list below
// (see vite.config.ts) so every deploy gets a fresh cache with its exact files.
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const CACHE = `nb-photobooth-${VERSION}`
// Servers often send `Vary: Origin`, and module scripts are requested with an Origin
// header the precache request didn't have, so a strict match would miss offline.
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith('nb-photobooth-') && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    // Network first so a new deploy shows up right away; cached app when offline.
    event.respondWith(fetch(req).catch(() => caches.match('index.html', MATCH)))
    return
  }

  // Hashed build assets never change, so cache first is safe.
  event.respondWith(caches.match(req, MATCH).then((hit) => hit || fetch(req)))
})
