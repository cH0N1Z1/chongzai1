const C='twinkle-v24';
const ASSETS=['./','./index.html','./style.css','./rogue.css','./sound.js','./shared.js','./rpg-core.js','./rpg-ui.js','./rpg-save.js','./rpg-story.js','./rpg-scene.js','./rpg-battle.js','./rpg-awaken.js','./rogue.js','./manifest.json','./character.json','./story.json','./battle.json','./icon-192.png','./icon-512.png','./media.json'];

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
  if(e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)){
    return;
  }
  e.respondWith(
    fetch(e.request).then(r => {
      if(r && r.status === 200){
        const clone = r.clone();
        caches.open(C).then(c => c.put(e.request, clone)).catch(()=>{});
      }
      return r;
    }).catch(() => {
      return caches.match(e.request).then(r => r || caches.match('./index.html'));
    })
  );
});