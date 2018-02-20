// NOTE: has to be incremented manually. Not possible to be handed down while initialization. Would be cool to be able to purge cache manually
var CACHE_VERSION = 1;
var CURRENT_CACHES = {
    // These files will fe fetched on first service worker initialization and will be present on navigation from AMP to PWA
    prefetch: 'prefetch-cache-v',
    // All other request will be placed in dynamic cache and will stay there until ttl has passed
    dynamic: 'dynamic-cache-v'
};

self.addEventListener('install', function(event) {
    var now = Date.now();

    // NOTE: pages can not be pre-fetched from AEM author, because authentication headers are missing and AEM won't respond with document
    // Will only work with AEM publish or dispatcher
    var urlsToPrefetch = [
        '/de/index.html',
        '/en/index.html'
    ];

    event.waitUntil(
        caches.open(CURRENT_CACHES.prefetch + CACHE_VERSION).then(function(cache) {
            var cachePromises = urlsToPrefetch.map(function(urlToPrefetch) {
                // URL based on service worker location, since sw can only handle request in scope or file system below scope
                var url = new URL(urlToPrefetch, location.href);

                // Append a cache-bust=TIMESTAMP URL parameter to each URL's query string.
                // This is particularly important when precaching resources that are later used in the
                // fetch handler as responses directly, without consulting the network (i.e. cache-first).
                // If we were to get back a response from the HTTP browser cache for this precaching request
                // then that stale response would be used indefinitely, or at least until the next time
                // the service worker script changes triggering the install flow.
                url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;

                // It's very important to use {mode: 'no-cors'} if there is any chance that
                // the resources being fetched are served off of a server that doesn't support
                // CORS (http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).
                // In this example, www.chromium.org doesn't support CORS, and the fetch()
                // would fail if the default mode of 'cors' was used for the fetch() request.
                // The drawback of hardcoding {mode: 'no-cors'} is that the response from all
                // cross-origin hosts will always be opaque
                // (https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cross-origin-resources)
                // and it is not possible to determine whether an opaque response represents a success or failure
                // (https://github.com/whatwg/fetch/issues/14).
                var request = new Request(url, {mode: 'no-cors'});
                return fetch(request).then(function(response) {
                    if (response.status >= 400) {
                        throw new Error('request for ' + urlToPrefetch +
                            ' failed with status ' + response.statusText);
                    }

                    // Use the original URL without the cache-busting parameter as the key for cache.put().
                    return cache.put(urlToPrefetch, response);
                }).catch(function(error) {
                    console.error('Not caching ' + urlToPrefetch + ' due to ' + error);
                });
            });

            return Promise.all(cachePromises).then(function() {
                console.log('Pre-fetching complete.');
            });
        }).then(function() {
            // `skipWaiting()` forces the waiting ServiceWorker to become the
            // active ServiceWorker, triggering the `onactivate` event.
            // Together with `Clients.claim()` this allows a worker to take effect
            // immediately in the client(s).
            return self.skipWaiting();
        }).catch(function(error) {
            console.error('Pre-fetching failed:', error);
        })
    );
});

/**
 * Clean up on activation
 */
self.addEventListener('activate', function(event) {
    event.waitUntil(
        clearUnusedCache()
    );
});

/**
 * Delete all caches that aren't named in CURRENT_CACHES.
 * While there is only one cache in this example, the same logic will handle the case where
 * there are multiple versioned caches.
 * @returns {Promise.<*>}
 */
function clearUnusedCache() {
    var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
        return CURRENT_CACHES[key] + CACHE_VERSION;
    });
    return caches.keys().then(function(cacheNames) {
        return Promise.all(
            cacheNames.map(function(cacheName) {
                if (expectedCacheNames.indexOf(cacheName) === -1) {
                    // If this cache name isn't present in the array of "expected" cache names, then delete it.
                    console.log('Deleting out of date cache:', cacheName);
                    return caches.delete(cacheName);
                }
            })
        );
    })
}


// Remove service worker file name to get scope to filter requests by
var scopeParts = location.href.split('/');
scopeParts.pop();
var scope = scopeParts.join('/');
var scopeRegExp = new RegExp(scope, 'i');
var notAmpRegExp = /\/.*\..*\.html/gi;
var isDebugRegExp = new RegExp('development=1', 'i');
var cacheBustRegExp = new RegExp('cache=bust', 'i');
var cacheForceRegExp = new RegExp('cache=force', 'i');
var editModeRegExp = new RegExp('editor.html\/', 'i');
var localhostRegExp = new RegExp('localhost', 'i');
var extensionRegExp = new RegExp('chrome-extension://', 'i');
var allowedTypesRegExp = new RegExp('.html|.jpg|.png|.xml', 'i');
var allowedPagesRegExp = new RegExp('automotive-life/|design/|innovation/|performance/|all-models/|bmw-models/|bmw-modelle/', 'i');

/**
 * Will see all network request and can answer them with cache or demand request via network
 */
self.addEventListener('fetch', function(event) {

    var request = event.request;
    var isForeignDomain = !request.url.includes(location.origin);
    if (isForeignDomain) {
        return false;
    }

    // Only check allowed request types
    var isAllowedType = allowedTypesRegExp.test(request.url);
    var isAllowedPage = allowedPagesRegExp.test(request.url);
    if (!isAllowedType || !isAllowedPage) {
        return false;
    }

    // Remove all files currently held in cache
    var isEditMode = editModeRegExp.test(request.url) || editModeRegExp.test(request.referrer);
    var isLocalhost = localhostRegExp.test(request.url);
    var isCacheBust = cacheBustRegExp.test(request.url);
    var isCacheForce = cacheForceRegExp.test(request.url);
    var isDebugExit = ((isEditMode || isLocalhost) && !isCacheForce);
    if (isCacheBust || isDebugExit) {
        CACHE_VERSION++;
        clearUnusedCache();
    }

    // Return assets without caching them and don't even think about entering pwa mode
    if (isCacheBust || isDebugExit) {
        return false;
    }

    // Ignore chrome extensions
    if (extensionRegExp.test(request.url)) {
        return false;
    }

    var isDebug = isDebugRegExp.test(request.url);

    // Replace amp with pwa page
    var resourceInfo = request.url.split('/').pop().split('.');
    var resourceTye = resourceInfo.pop();
    var hasSelector = resourceInfo.length >= 2;
    var isAAmpPage = (resourceTye.indexOf('html') !== -1) && !hasSelector;
    var url = removeRedirectParam(event.request.url);
    if (isAAmpPage) {
        url = url.replace('.html','.pwa.html');
        request = new Request(url,{
            credentials: request.credentials,
            headers: request.headers,
            integrity: request.integrity,
            method: request.method,
            redirect: request.redirect,
            referrer: request.referrer,
            referrerPolicy: request.referrerPolicy
        });
        if (isDebug) console.log('Handling AMP to PWA fetch event for', request.url, 'now:', url);
    } else if (hasSelector) {
        request = new Request(url,{
            credentials: request.credentials,
            headers: request.headers,
            integrity: request.integrity,
            method: request.method,
            redirect: request.redirect,
            referrer: request.referrer,
            referrerPolicy: request.referrerPolicy
        });
        if (isDebug) console.log('Clean up PWA parameter for', request.url, 'now:', url);
    } else {
        if (isDebug) console.log('Handling fetch event for', event.request.url);
    }


    event.respondWith(
        cacheThenNetwork(request)
    );
});

/**
 * Make sure pwa attribute is removed to avoid akamai redirect
 * @param url
 * @returns {string|XML|*}
 */
function removeRedirectParam(url) {
    url = url.replace('?pwpwa=1&', '?');
    url = url.replace('?pwpwa=1', '');
    url = url.replace('&pwpwa=1', '');
    return url;
}

/**
 * Will fetch resources, files and articles from cache if available and fall back to network request if cache
 * is missing or cache=bust is set as GET parameter
 * @param request {Request}
 * @returns {Promise.<*>}
 */
function cacheThenNetwork(request) {

    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    // It's an alternative to first opening a specific named cache and then matching on that.
    return caches.match(request).then(function(cachedResponse) {

        // Always do actual request to update cache afterwards and return current cache directly if found
        var promise = fetch(request).then(function(response) {

            // Add response to dynamic cache, to serve from cache next time request is handled
            if (response.status == 200) {
                caches.open(CURRENT_CACHES.dynamic+CACHE_VERSION).then(function(cache) {
                    cache.put(request, response);
                });
            }

            // No longer authorized remove cached state
            if (response.status == 403) {
                caches.delete(CURRENT_CACHES.dynamic+CACHE_VERSION);
            }

            // Make sure response is not in use if cache becomes available above. Otherwise body will be in use
            var clonedResponse = response.clone();
            return clonedResponse;
        }).catch(function(error) {
            // This catch() will handle exceptions thrown from the fetch() operation.
            // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
            // It will return a normal response object that has the appropriate error code set.
            console.error('Fetching failed:', error);
            throw error;
        });

        // Found response in cache. No need to wait
        if (cachedResponse && cachedResponse.status == 200) {
            return cachedResponse;
        }

        // Wait for actual request
        return promise;
    })
}
