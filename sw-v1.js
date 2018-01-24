// Version 1: Nur Offline-Error
// INSTALL Event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('offline-resources-v1')
    .then(function(cache){
      return cache.add('/offline.html')
    })
    .catch(function() {

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
          return caches.match('/offline.html');
        }
      });
    })
  )
});
