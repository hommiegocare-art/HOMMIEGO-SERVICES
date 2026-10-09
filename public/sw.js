// public/sw.js
// HommieCare service worker — handles Web Push and notification clicks.

self.addEventListener("install", (event) => {
    // Take over as soon as possible
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// ---------- Push received ----------
self.addEventListener("push", (event) => {
    let payload = {
        title: "HommieCare",
        body: "You have a new notification",
        link: "/notifications",
        type: "generic",
    };

    try {
        if (event.data) {
            const parsed = event.data.json();
            payload = { ...payload, ...parsed };
        }
    } catch {
        if (event.data) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: payload.type || "hommiecare",
        data: { link: payload.link },
        // Collapse same-type notifications until user reads them
        renotify: false,
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options),
    );
});

// ---------- User taps a notification ----------
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const target =
        (event.notification.data && event.notification.data.link) ||
        "/notifications";

    // Focus an existing tab if open; else open a new one
    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    try {
                        const url = new URL(client.url);
                        if (url.origin === self.location.origin) {
                            client.navigate(target);
                            return client.focus();
                        }
                    } catch {
                        /* ignore */
                    }
                }
                return self.clients.openWindow(target);
            }),
    );
});