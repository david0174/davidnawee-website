// learn.nawee.net used to be the installed Nawee app (offline copies via a service worker). It only forwards now:
// this replacement removes all old offline copies, unregisters itself and reloads open tabs (→ forwarded to nawee.net).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) await caches.delete(key);
        await self.registration.unregister();
        const tabs = await self.clients.matchAll({ type: "window" });
        tabs.forEach((tab) => tab.navigate(tab.url));
    })());
});
