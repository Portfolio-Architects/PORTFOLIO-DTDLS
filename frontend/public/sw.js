const CACHE_NAME = 'dview-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for now. We will implement Advanced Caching (Stale-While-Revalidate) in the next phase.
  // The primary goal of this initial SW is to satisfy the PWA installability criteria
  // so that the `beforeinstallprompt` event fires on Chrome/Android.
  event.respondWith(fetch(event.request));
});
