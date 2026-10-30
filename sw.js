/* dsh-pet 手机版 Service Worker
 * 策略：首页/index.html 用 network-first（保证更新及时），webm 动画 network-first（交给 HTTP 缓存），
 *       其余静态壳（manifest/图标）cache-first。
 */
const CACHE = 'dsh-pet-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const path = url.pathname;

  // 首页 / index.html：优先网络，失败回缓存（保证更新后能拿到新版）
  if (path.endsWith('/') || path.endsWith('/index.html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // 动画视频：优先网络，失败回缓存
  if (path.endsWith('.webm')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // 其余（manifest/图标等）：cache-first
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
