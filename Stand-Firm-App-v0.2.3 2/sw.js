const CACHE = "stand-firm-shell-v2.0.3";
const FILES = [
  "./",
  "index.html",
  "styles.css",
  "release.css",
  "manifest.webmanifest",
  "src/legacy-content.js",
  "src/legacy-app.js",
  "src/app.js",
  "src/core.js",
  "content/missions.json",
  "content/programs.json",
  "content/scripture.json",
  "assets/jimjitsu-brand.jpg",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/apple-touch-icon.png",
  "assets/icon-512.svg",
  "assets/original-1.png",
  "assets/original-2.png",
  "assets/original-3.wav",
  "assets/original-4.wav",
  "assets/focus-demo.wav",
  "assets/dusk-hush.mp3",
];
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("stand-firm-shell-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (
    e.request.method !== "GET" ||
    u.origin !== self.location.origin ||
    u.pathname.includes("/api/")
  )
    return;
  const relative = u.pathname.slice(
    new URL(self.registration.scope).pathname.length,
  );
  if (!FILES.includes(relative) && relative !== "") return;
  e.respondWith(
    fetch(e.request).catch(() =>
      caches
        .match(e.request)
        .then(
          (r) =>
            r ||
            (e.request.mode === "navigate"
              ? caches.match("index.html")
              : Response.error()),
        ),
    ),
  );
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow("./#mission"));
});
