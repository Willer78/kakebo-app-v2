const CACHE='kakebo-v3.8.4';
self.addEventListener('install', e=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{ clients.claim(); });
self.addEventListener('fetch', e=>{ /* no caching during dev to avoid stale assets */ });
