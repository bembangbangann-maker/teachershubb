const CACHE_NAME = 'teachers-hub-cache-v1.4.0'; // Increment this version to force update
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/vite.svg',
  '/manifest.json'
];

// On install, cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      // We are not caching external resources during install
      // as they might fail and break the installation.
      // They will be cached on first fetch.
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// On fetch, use a cache-first, falling back to network strategy
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Check the cache for a matching request
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 2. If not in cache, fetch from the network
      try {
        const networkResponse = await fetch(event.request);
        
        // 3. If the fetch is successful, cache the response for future use
        if (networkResponse && networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          await cache.put(event.request, responseToCache);
        }
        
        return networkResponse;
      } catch (error) {
        console.error('[Service Worker] Fetch failed.', error);
      }
    })
  );
});
