// nawee.net used to be the Nawee Learning app (offline copies via a service worker). The company site needs none:
// this replacement removes all old offline copies, unregisters itself and reloads open tabs with fresh pages.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) await caches.delete(key);
        await self.registration.unregister();
        const tabs = await self.clients.matchAll({ type: "window" });
        tabs.forEach((tab) => tab.navigate(tab.url));
    })());
});
