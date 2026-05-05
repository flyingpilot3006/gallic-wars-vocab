const CACHE_NAME = 'legio-v1';

// We use relative paths so it works correctly on GitHub Pages subpaths
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo192.png',
  './logo512.png'
];

// Install the Service Worker and cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Legio Cache: Initializing armor and shields...');
      return cache.addAll(urlsToCache);
    })
  );
});

// Intercept network requests and serve from cache if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Clean up old caches when a new version is deployed
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Legio Cache: Purging old supplies...');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
