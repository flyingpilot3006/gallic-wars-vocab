const CACHE_NAME = 'legio-v2';

// We use relative paths so it works correctly on GitHub Pages subpaths
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo192.png',
  './logo512.png'
];

// Install the Service Worker and cache essential files safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Legio Cache: Initializing armor and shields...');
      // Safely cache each item so a single missing file doesn't break the entire PWA install
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn(`Legio Cache: Failed to cache ${url}`, error);
        }
      }
    })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Intercept network requests and dynamically cache new assets
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network and dynamically cache it
      return fetch(event.request).then((networkResponse) => {
        // Ensure the response is valid before caching
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Only cache http/https requests (prevents chrome-extension:// errors)
        if (event.request.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Fallback for when network is completely offline and asset isn't cached
        console.log('Legio Cache: Network request failed and not in cache.');
      });
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
  event.waitUntil(self.clients.claim()); // Take control of all pages immediately
});
