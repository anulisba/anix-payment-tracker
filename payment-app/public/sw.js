const CACHE_NAME = "gigledger-v1";

// Files to cache for offline use
const STATIC_ASSETS = [
  "/",
  "/index.html",
];

// ─── Install: cache static assets ─────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: clear old caches ───────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch: network first, fallback to cache ──────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache API calls — always go to network
  if (url.pathname.startsWith("/api")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ success: false, message: "You are offline" }), { headers: { "Content-Type": "application/json" } })));
    return;
  }

  // For everything else: network first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache a copy of the fresh response
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
