// LUCAS BUGS | Hair Stylist PRO — Service Worker
const CACHE = 'pro-lucas-bugs-hair-stylist-v38';   // mude este número a cada deploy: é o que força o navegador a soltar o cache
const SHELL = ['/', '/index.html', '/manifest.json', '/logo.png', '/icons/icon-192.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url = new URL(req.url);
  // só mexe em GET do próprio site; não intercepta a API nem domínios externos
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (m) { return m || caches.match('/'); });
    })
  );
});

// ============================================================
// PUSH NOTIFICATIONS (app PRO) — recebe e exibe as notificações.
// Payload esperado do backend: { titulo, corpo, url, tag }
// ============================================================
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { corpo: event.data ? event.data.text() : '' }; }
  var titulo = data.titulo || 'LUCAS BUGS | Hair Stylist';
  var opcoes = {
    body:  data.corpo || '',
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data:  { url: data.url || '/' },
    vibrate: [80, 40, 80],
    tag:   data.tag || undefined,
    renotify: !!data.tag
  };
  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var alvo = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
      for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        if (c.url.indexOf(location.origin) === 0 && 'focus' in c) { c.focus(); if (c.navigate) { try { c.navigate(alvo); } catch (e) {} } return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(alvo);
    })
  );
});
