const CACHE_NAME = 'stockup-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch to make browser recognize this as a PWA
  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback behavior could go here
      return new Response('You are offline.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/plain' })
      });
    })
  );
});
