importScripts(
  "https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDEPbvc51bD5TZ7qmdhL4N2LBAc-ntCqYg",
  authDomain: "fea-wetherdashboard.firebaseapp.com",
  projectId: "fea-wetherdashboard",
  messagingSenderId: "381458651008",
  appId: "1:381458651008:web:1da6cf0bcad081a4915365",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title || payload.data?.title || "📢 Notification";
  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "You have a new update.";
  self.registration.showNotification(title, {
    body,
    icon: "/logo.svg",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", function (event) {
  const targetUrl = event.notification?.data?.url || "/alerts";
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client)
            return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
