// INSTALL Event
self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open('offline-resources-v1.0.0')
    .then(cache => cache.addAll([
      '/index.html',
      '/styles.css',
      '/scripts/app.js'
    ]))
  );
});

// FETCH Event
self.addEventListener('fetch', event => {
  var url = new URL(event.request.url);

  if(url.origin == 'https://chrisadamsca.github.io' && url.pathname == '/demo-api/stundenplan.json') {
    event.respondWith(handleStundenplanRequest(event));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );

});

function handleStundenplanRequest(event) {
  var networkFetch = fetch(event.request);

  event.waitUntil(
    networkFetch.then(response => {
      var responseClone = response.clone();
      caches.open('stundenplan')
        .then(cache => cache.put(event.request, responseClone));
    })
  );

  return caches.match(event.request)
    .then(response => response || networkFetch);
}
