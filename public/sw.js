// Atlas Sprint service worker — minimal offline shell.
// Network-first for navigation (always fresh when online, cached fallback offline);
// cache-first for static assets and flag images.
//
// Base-path aware: derives its scope from its own URL, so it works both at the
// site root (local) and under GitHub Pages' /<repo>/ prefix with no config.

const BASE = self.location.pathname.replace(/sw\.js$/, ""); // e.g. "/" or "/atlas-sprint/"
const CACHE = "atlas-sprint-v1";
const CORE = ["", "learn/", "sandbox/", "rankings/", "stats/", "review/"].map((p) => BASE + p);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache Next.js dev/HMR traffic.
  if (url.pathname.includes("/_next/webpack-hmr")) return;

  // Cache-first for flag images (external CDN) and Next static chunks.
  if (url.hostname.endsWith("flagcdn.com") || url.pathname.includes("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  // Network-first for everything same-origin (pages, fonts, etc.).
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match(BASE)))
    );
  }
});
