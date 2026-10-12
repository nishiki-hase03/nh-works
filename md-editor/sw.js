const CACHE_NAME = 'md-editor-cache-v2';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './icon.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // 成功したレスポンスのみキャッシュを更新
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // オフライン時は何もしない（cachedResponseが返る）
                });

                // キャッシュがあれば先に返し、バックグラウンドで更新 (Stale-While-Revalidate)
                // index.html などは常に最新を意識したいため、キャッシュがあっても fetch を優先する Network-First も検討されるが、
                // ここでは Stale-While-Revalidate で「次回起動時に最新になる」挙動にするか、
                // あるいは重要なファイルのみ Network-First にする。
                return cachedResponse || fetchPromise;
            });
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
