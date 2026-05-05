const CACHE_NAME = 'legio-v3';

// Use a function to dynamically determine the correct base path
const getBasePath = () => {
  return self.registration.scope;
};

// Install the Service Worker and cache essential files safely
self.addEventListener('install', (event) => {
  const basePath = getBasePath();
  
  const urlsToCache = [
    basePath,
    `${basePath}index.html`,
    `${basePath}manifest.json`,
    `${basePath}logo192.png`,
    `${basePath}logo512.png`
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Legio Cache: Initializing armor and shields...', urlsToCache);
      // Safely cache each item so a single missing file doesn't break the entire PWA install
      for (const url of urlsToCache) {
        try {
          const request = new Request(url, { cache: 'reload' }); // Force network fetch for initial cache
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response);
          } else {
             console.warn(`Legio Cache: Failed to fetch ${url} (Status: ${response.status})`);
          }
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
  // Only handle GET requests for our origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
     return;
  }

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

        // Clone the response to put in the cache
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        console.log('Legio Cache: Network request failed and not in cache.', event.request.url);
        // You could return a custom offline page here if you wanted
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
            console.log(`Legio Cache: Purging old supplies... ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim()); // Take control of all pages immediately
});
