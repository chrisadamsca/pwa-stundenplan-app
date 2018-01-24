// Version 1: Nur Offline-Error
// INSTALL Event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('offline-resources-v1')
    .then(function(cache){
      return cache.add('/offline-index.html')
    })
    .catch(function() {

    })
  );
});

// FETCH Event
self.addEventListener('fetch', event => {
  var url = new URL(event.request.url);

  if(url.origin == location.origin) {
    event.respondWith(caches.match('/offline.html'));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );

});
