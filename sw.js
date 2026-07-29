const C = "workbench-v8-force-refresh";
const ASSETS = ["./", "./index.html", "./manifest.json"];
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => caches.open(C).then(c => c.addAll(ASSETS))).catch(() => {})
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() => self.clients.matchAll().then(cs => cs.forEach(c => c.navigate(c.url))))
  );
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // 对导航请求强制网络优先，避免缓存旧页面
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then(res => {
          const copy = res.clone();
          caches.open(C).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(C).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
