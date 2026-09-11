const C='douro-v32';
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
  // 关键点1：非 GET、跨域请求（API、OPTIONS 预检）一律不拦，直接走浏览器原生网络
  if(e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)){
    return;
  }

  // 关键点2：network-first —— 先尝试从网络拉最新的，失败（断网）才用缓存
  e.respondWith(
    fetch(e.request).then(r => {
      // 拉到新版本后顺便更新缓存，供断网时使用
      if(r && r.status === 200){
        const clone = r.clone();
        caches.open(C).then(c => c.put(e.request, clone)).catch(()=>{});
      }
      return r;
    }).catch(() => {
      // 网络失败 → 回退到缓存；再不行就回退到 index.html（做离线模式用）
      return caches.match(e.request).then(r => r || caches.match('./index.html'));
    })
  );
});