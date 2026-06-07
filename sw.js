const CACHE_NAME = 'ecotime-v1';
const ASSETS = [
  '/',
  '/index.html',
  // Adicione aqui seus arquivos de CSS ou JS externos quando separá-los
];

// Instalação do Service Worker e Cache dos arquivos estruturais
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Estratégia de Cache-First com queda para Rede
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});