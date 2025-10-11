const CACHE_NAME = 'hayday-support-v1.3.0';
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/admin.html',
  '/css/main.css',
  '/css/welcome.css',
  '/css/mobile.css',
  '/css/accessibility.css',
  '/js/client.js',
  '/js/webrtc.js',
  '/js/perfect-negotiation.js',
  '/js/connection-monitor.js',
  '/js/helpers.js',
  '/js/accessibility.js',
  '/manifest.json',
  '/404.html'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip socket.io and external requests
  if (event.request.url.includes('socket.io') || 
      event.request.url.includes('stun:') ||
      event.request.url.includes('turn:')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response and cache it
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/404.html');
          }
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-calls') {
    event.waitUntil(syncCalls());
  }
});

async function syncCalls() {
  // Implement offline call queue sync if needed
  console.log('Syncing offline calls...');
}
