
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { console.log('Service Worker attivato'); });
self.addEventListener('fetch', e => {});
