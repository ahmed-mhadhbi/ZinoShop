// Service Worker for PWA functionality
const CACHE_NAME = 'zinoshop-v2'
const urlsToCache = [
  '/',
  '/products',
  '/cart',
  '/manifest.json',
]

// Install event - force activate the new SW immediately
self.addEventListener('install', (event) => {
  // Activate worker immediately after install
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Completely ignore API calls and external requests - let them pass through
  if (
    url.pathname.startsWith('/api/') || 
    url.hostname !== self.location.hostname ||
    url.hostname === 'localhost' && url.port === '3001'
  ) {
    // Don't intercept - let browser handle it normally
    return
  }
  
  // Only handle same-origin page requests
  if (event.request.destination === 'document') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => {
          // Return offline page if available
          return caches.match('/')
        })
      })
    )
  }
})

// Activate event
self.addEventListener('activate', (event) => {
  // Take control of uncontrolled clients as soon as the worker activates
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      }),
    ])
  )
})

