const V = "pocket-ai-v2";
const CDN = "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.png", "./avatar.png"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    for (const u of [...SHELL, CDN]) { try { await c.add(u); } catch (_) {} }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V && k.startsWith("pocket-ai-")) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // Your own files: use the network when online so updates arrive, fall back to the saved copy offline.
    e.respondWith((async () => {
      const c = await caches.open(V);
      try {
        const r = await fetch(req);
        if (r.ok) c.put(req, r.clone());
        return r;
      } catch (_) {
        return (await c.match(req, { ignoreSearch: true })) || (await c.match("./index.html"));
      }
    })());
    return;
  }

  if (url.hostname === "cdn.jsdelivr.net") {
    // The AI engine code is pinned to one version, so a saved copy never goes stale.
    e.respondWith((async () => {
      const c = await caches.open(V);
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    })());
  }
  // Model files are saved by the AI engine itself, so they are left alone here.
});
