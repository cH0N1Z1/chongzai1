const C='douro-v87';
const ASSETS=['./','./index.html','./style.css','./rogue.css','./sound.js','./shared.js','./rpg.js','./rogue.js','./manifest.json','./icon-192.png','./icon-512.png','./media.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e