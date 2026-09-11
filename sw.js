const C='douro-v19';
const ASSETS=['./','./index.html','./style.css','./game.js','./manifest.json','./icon-192.png','./icon-512.png','./media.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});