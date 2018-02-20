// INSTALL Event
var CACHE_NAME  = 'offline-resources-v3',
    CACHED_URLS = [
      'index.html',
      'styles.css',
      'scripts/app.js',
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
