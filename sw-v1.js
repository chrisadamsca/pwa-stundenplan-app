// Version 1: Nur Offline-Error
// INSTALL Event
self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open('offline-resources-v1')
    .then(cache => cache.addAll([
      '/offline.html',
      '/index.html'
    ]))
  );
});

// FETCH Event
self.addEventListener('fetch', event => {
  var url = new URL(event.request.url);

  if(url.origin == location.origin) {
    event.respondWith(caches.match('/offline.html'));
    return;
  }

  // event.respondWith(
  //   caches.match(event.request)
  //     .then(response => response || fetch(event.request))
  // );

});
