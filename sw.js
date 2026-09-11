const C='douro-v27';
const ASSETS=['./','./index.html','./style.css','./game.js','./manifest.json','./icon-192.png','./icon-512.png','./media.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== C).map(k => caches.delete(k))
    )).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // 关键修复：只处理同源的 GET 请求；API 请求、跨域请求、OPTIONS 预检全部放行
  if(e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});