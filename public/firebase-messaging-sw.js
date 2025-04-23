importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBUUioDQa-KzKodVIlSb3q-s5VvT80Pbik",
  authDomain: "rainbox-87352.firebaseapp.com",
  projectId: "rainbox-87352",
  storageBucket: "rainbox-87352.firebasestorage.app",
  messagingSenderId: "574320183763",
  appId: "1:574320183763:web:b8b48bb59ce2d103708726",
  measurementId: "G-69CV9C2REJ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    data: { click_action: payload.notification.click_action },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🔥 This should be OUTSIDE the onBackgroundMessage
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.click_action || "http://localhost:3000/dashboard";
  event.waitUntil(clients.openWindow(url));
});
