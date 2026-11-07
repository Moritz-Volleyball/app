// Service Worker: Offline-Start + Push-Nachrichten im Hintergrund
importScripts('./config.js');
const CFG = self.APP_CONFIG || {};
const CACHE = 'vb-cache-v2';
const ASSETS = ['./', './index.html', './app.js', './i18n.js', './data.js', './config.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

if (CFG.firebase) {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  firebase.initializeApp(CFG.firebase);
  // Nachrichten mit "notification"-Teil zeigt Firebase im Hintergrund automatisch an.
  firebase.messaging();
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Netzwerk zuerst (damit Updates sofort ankommen), sonst Cache (offline)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
// Tipp auf Benachrichtigung: App öffnen bzw. nach vorne holen
self.addEventListener('notificationclick', (e) => {
  const link = (e.notification.data && (e.notification.data.link || (e.notification.data.FCM_MSG && e.notification.data.FCM_MSG.fcmOptions && e.notification.data.FCM_MSG.fcmOptions.link))) || './';
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate && link !== './' && c.navigate(link); return c.focus(); } }
    return self.clients.openWindow(link);
  }));
});
