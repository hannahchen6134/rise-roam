/* 休息提醒器 Service Worker — 離線快取，讓它能像 App 一樣安裝與開啟 */
const CACHE = 'rest-reminder-v3';
const ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './manifest.json',
  './og.png',
  './pexels-julieaagaard-1368522.jpg',
  './pexels-afhamhmsyri-36903387.jpg',
  './pexels-skylake-16668318.jpg',
  './bg-dasilva.jpg'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
      .catch(function(){})
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(resp){
        try{
          if(resp && resp.status === 200 && e.request.url.indexOf(self.location.origin) === 0){
            var copy = resp.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          }
        }catch(_){}
        return resp;
      }).catch(function(){ return cached; });
    })
  );
});
