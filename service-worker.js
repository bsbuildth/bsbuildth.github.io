// Service Worker for offline-first API caching
// Serves local API data without requiring backend server

const API_DATA_URL = '/website/api-data.json';
const API_CACHE = 'api-data-v1';

// API endpoint patterns this service worker handles
const API_PATTERNS = [
  '/api/projects',
  '/api/reviews',
  '/api/services',
  '/api/calculator/types',
  '/api/business-info'
];

// Install event - cache the API data
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(API_CACHE).then((cache) => {
      return cache.add(API_DATA_URL).catch(() => {
        console.log('Could not cache API data - will fetch on first request');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve API calls from local data
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Check if this is an API request we should handle
  const isApiRequest = API_PATTERNS.some(pattern => url.pathname.includes(pattern));

  if (isApiRequest && request.method === 'GET') {
    event.respondWith(
      (async () => {
        try {
          // Fetch the API data from cache or network
          const response = await fetch(API_DATA_URL);
          if (!response.ok) throw new Error('Failed to fetch API data');

          const data = await response.json();

          // Route the request to the appropriate data
          const responseData = routeApiRequest(url.pathname, data);

          // Return as JSON response
          return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (error) {
          console.error('Service Worker API error:', error);

          // Fallback to cache if available
          try {
            const cache = await caches.open(API_CACHE);
            const cached = await cache.match(API_DATA_URL);
            if (cached) {
              const data = await cached.json();
              const responseData = routeApiRequest(url.pathname, data);
              return new Response(JSON.stringify(responseData), {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                }
              });
            }
          } catch (cacheError) {
            console.error('Cache fallback failed:', cacheError);
          }

          // Return error response
          return new Response(JSON.stringify({ error: 'API data unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
  } else {
    // Pass through all other requests to network
    event.respondWith(fetch(request));
  }
});

// Route API requests to appropriate data
function routeApiRequest(pathname, data) {
  if (pathname.includes('/api/projects')) {
    const projectId = pathname.match(/\/api\/projects\/(\d+)/);
    if (projectId) {
      const project = data.projects.find(p => p.id === parseInt(projectId[1]));
      return project || { error: 'Project not found' };
    }
    return data.projects;
  }

  if (pathname.includes('/api/calculator/types')) {
    return data.calculatorTypes;
  }

  if (pathname.includes('/api/reviews')) {
    return data.reviews;
  }

  if (pathname.includes('/api/services')) {
    return data.services;
  }

  if (pathname.includes('/api/business-info')) {
    return data.businessInfo || {
      name: 'BS Build',
      company_name: 'BS Build',
      description: 'บริการรับเหมาก่อสร้าง ต่อเติม และรีโนเวทบ้านแบบครบวงจร',
      email: 'info@bsbuildth.com',
      phone: '02-322-0000',
      line_id: '@bsbuild',
      address: 'กรุงเทพมหานคร'
    };
  }

  return { error: 'Unknown API endpoint' };
}
