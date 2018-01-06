self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open('offline-resources-v3')0
    .then(cache => cache.addAll([
      '/news/index.html',
      '/news/styles.css',
      '/news/scripts/app.js'
    ]))
  );
});

self.addEventListener('fetch', event => {
  var url = new URL(event.request.url);

  if(url.origin == 'https://chrisadamsca.github.io' && url.pathname == '/api/stundenplan.json') {
    event.respondWith(handleNewsRequest(event));
    return;
  }

  if(url.origin == location.origin && url.pathname == '/news/') {
    event.respondWith(caches.match('/news/index.html'));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );

});

function handleNewsRequest(event) {
  var networkFetch = fetch(event.request);

  event.waitUntil(
    networkFetch.then(response => {
      var responseClone = response.clone();
      caches.open('news')
        .then(cache => cache.put(event.request, responseClone));
    })
  );

  return caches.match(event.request)
    .then(response => response || networkFetch);
}
