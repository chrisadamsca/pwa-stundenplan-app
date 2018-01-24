// Version 1: Offline-Error & App-Shell

var CACHE_NAME  = 'offline-resources-v1',
    CACHED_URLS = [
      'offline.html',
      'offline.css',
      'icon.png'
    ];

// INSTALL Event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(function(cache){
      return cache.addAll(CACHED_URLS)
    })
    .catch(function(error) {
      console.log("Error: ", error);
    })
  );
});

// FETCH Event
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request).then(function(response) {
        if(response) {
          return response;
        } else {
          return caches.match('offline.html');
        }
      });
    })
  )
});
