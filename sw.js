var CACHE = "milk-tracker-v2";
var ASSETS = ["./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  var isHTML = req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") !== -1;
  if(isHTML){
    // network-first for the app shell so updates show immediately when online
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ try{ c.put("./index.html", copy); }catch(_){} });
        return res;
      }).catch(function(){ return caches.match("./index.html"); })
    );
    return;
  }
  // cache-first for static assets
  e.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ try{ c.put(req, copy); }catch(_){} });
        return res;
      }).catch(function(){ return cached; });
    })
  );
});
