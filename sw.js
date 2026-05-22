/* 休息提醒器 Service Worker — HTML 網路優先、靜態資源快取優先，可離線可安裝 */
const CACHE = 'rest-reminder-v5';
const ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
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

// 判斷是否為 HTML / 導覽請求（這類要「網路優先」，確保永遠拿到最新頁面）
function isHTMLRequest(req){
  if(req.mode === 'navigate') return true;
  var url = req.url;
  if(/\.html(\?|$)/.test(url)) return true;
  // 網站根目錄（'/' 或 '/rise-roam/'）也視為 HTML
  if(/\/$/.test(url.split('?')[0])) return true;
  var accept = req.headers.get('accept') || '';
  return accept.indexOf('text/html') !== -1;
}

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var sameOrigin = e.request.url.indexOf(self.location.origin) === 0;

  // HTML：網路優先（先抓最新，抓不到才用快取 → 永遠不會卡舊版，離線仍可用）
  if(isHTMLRequest(e.request)){
    e.respondWith(
      fetch(e.request).then(function(resp){
        try{
          if(resp && resp.status === 200 && sameOrigin){
            var copy = resp.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          }
        }catch(_){}
        return resp;
      }).catch(function(){
        // 離線：回退到快取的頁面（先試該請求，再試 index.html）
        return caches.match(e.request).then(function(c){ return c || caches.match('./index.html'); });
      })
    );
    return;
  }

  // 其他靜態資源（圖片、icon、manifest…）：快取優先（快、省流量、可離線）
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(resp){
        try{
          if(resp && resp.status === 200 && sameOrigin){
            var copy = resp.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          }
        }catch(_){}
        return resp;
      }).catch(function(){ return cached; });
    })
  );
});
