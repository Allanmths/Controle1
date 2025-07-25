const CACHE_NAME = 'estoque-hcm-v1.0.0';
const STATIC_CACHE_NAME = 'estoque-hcm-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'estoque-hcm-dynamic-v1.0.0';
const OFFLINE_CACHE_NAME = 'estoque-hcm-offline-v1.0.0';

// Recursos essenciais para cache inicial
const STATIC_ASSETS = [
  '/Controle1/',
  '/Controle1/index.html',
  '/Controle1/manifest.json',
  '/Controle1/offline.html'
];

// URLs da API Firebase que devem ser cached para modo offline
const API_CACHE_PATTERNS = [
  /firestore\.googleapis\.com/,
  /firebase\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/
];

// Páginas importantes para cache
const IMPORTANT_PAGES = [
  '/Controle1/',
  '/Controle1/stock',
  '/Controle1/counting',
  '/Controle1/counting/new',
  '/Controle1/dashboard',
  '/Controle1/movements',
  '/Controle1/replenishment',
  '/Controle1/reports',
  '/Controle1/settings',
  '/Controle1/audit'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Cache dos assets estáticos
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache offline inicial
      caches.open(OFFLINE_CACHE_NAME).then((cache) => {
        console.log('[SW] Setting up offline cache');
        return cache.addAll([
          '/Controle1/offline.html'
        ]);
      })
    ])
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME && 
              cacheName !== OFFLINE_CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests que não são GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar Chrome extensions e outros protocolos
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    handleFetch(request)
  );
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Estratégia Cache First para assets estáticos
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }
    
    // 2. Estratégia Network First para dados do Firebase
    if (isFirebaseAPI(url)) {
      return await networkFirstWithOfflineSupport(request);
    }
    
    // 3. Estratégia Network First para páginas da aplicação
    if (isAppPage(url)) {
      return await networkFirstForPages(request);
    }
    
    // 4. Estratégia Network First para outros recursos
    return await networkFirst(request, DYNAMIC_CACHE_NAME);
    
  } catch (error) {
    console.warn('[SW] Fetch failed:', error);
    
    // Fallback para página offline se for uma navegação
    if (request.destination === 'document') {
      const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
      return await offlineCache.match('/Controle1/offline.html');
    }
    
    throw error;
  }
}

// Estratégias de Cache

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function networkFirstWithOfflineSupport(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses from Firebase
    if (response.ok && response.status < 400) {
      cache.put(request, response.clone());
      
      // Sincronizar dados offline se houver
      await syncOfflineData();
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    
    const cached = await cache.match(request);
    if (cached) {
      // Notificar que estamos no modo offline
      notifyOfflineMode();
      return cached;
    }
    
    throw error;
  }
}

async function networkFirstForPages(request) {
  try {
    const response = await fetch(request);
    
    // Cache páginas importantes
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Tentar cache primeiro
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Fallback para página offline
    const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
    return await offlineCache.match('/Controle1/offline.html');
  }
}

// Utilitários

function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

function isFirebaseAPI(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.hostname));
}

function isAppPage(url) {
  return url.origin === location.origin && 
         url.pathname.startsWith('/Controle1/');
}

// Sincronização de dados offline
async function syncOfflineData() {
  try {
    // Buscar dados pendentes no IndexedDB
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      console.log('[SW] Syncing offline data:', offlineData.length, 'items');
      
      // Notificar o cliente para sincronizar
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_OFFLINE_DATA',
          data: offlineData
        });
      });
    }
  } catch (error) {
    console.warn('[SW] Failed to sync offline data:', error);
  }
}

function notifyOfflineMode() {
  // Notificar clientes que estamos offline
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_MODE',
        message: 'Você está no modo offline. Alguns dados podem não estar atualizados.'
      });
    });
  });
}

// IndexedDB helpers (simulado - será implementado no cliente)
async function getOfflineData() {
  // Esta função será implementada no lado do cliente
  // O Service Worker apenas coordena a sincronização
  return [];
}

// Background Sync para quando a conexão for restaurada
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Push Notifications (preparação para futuro)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Estoque HCM',
    icon: '/Controle1/icons/icon-192x192.png',
    badge: '/Controle1/icons/icon-72x72.png',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/Controle1/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Estoque HCM', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/Controle1/')
    );
  }
});
