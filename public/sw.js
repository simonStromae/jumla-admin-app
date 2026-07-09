self.addEventListener('push', function (event) {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'Jumla Shipping';
  const options = {
    body:    data.body  ?? '',
    icon:    '/jumla-icon.png',
    badge:   '/jumla-badge.png',
    tag:     data.tag   ?? 'jumla',
    data:    { url: data.url ?? '/client' },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url ?? '/client';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
