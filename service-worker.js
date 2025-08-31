const CACHE='kakebo-v1';
self.addEventListener('install', e=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{ clients.claim(); });
self.addEventListener('fetch', e=>{
  // Pass-through; pronto per cache futura
});
