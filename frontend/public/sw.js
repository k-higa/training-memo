// Service Worker - キャッシュ無効化版
// 既存のキャッシュを削除し、何もキャッシュしない

const CACHE_NAME = 'training-memo-v2';

// Install event - 既存キャッシュを削除
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Fetch event - 常にネットワークから取得
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Activate event - 全てのキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});
