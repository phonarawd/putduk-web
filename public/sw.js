/* 퍼뜩 고객 웹 서비스 워커. 금융·인증·개인정보는 캐시하지 않는다. */
const SW_VERSION = "putduk-web-sw-v2";
const STATIC_CACHE = `putduk-static-${SW_VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/manifest.webmanifest", "/putduk-mark.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

function isUnsafeMethod(method) {
  return method !== "GET" && method !== "HEAD";
}

function isPrivatePath(pathname) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/me") ||
    pathname.startsWith("/auth") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/work" ||
    pathname === "/invite" ||
    pathname === "/ai"
  );
}

async function navigateOffline(pathname) {
  if (pathname === OFFLINE_URL || pathname === `${OFFLINE_URL}/`) {
    return (await caches.match(OFFLINE_URL)) || new Response("", { status: 503, statusText: "offline" });
  }
  return Response.redirect(new URL(OFFLINE_URL, self.location.origin).href, 303);
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/cards/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/putduk-mark.svg" ||
    pathname === "/manifest.webmanifest"
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("putduk-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (isUnsafeMethod(request.method)) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isPrivatePath(url.pathname)) {
    event.respondWith(
      fetch(request).catch(async () => {
        if (request.mode === "navigate") return navigateOffline(url.pathname);
        return new Response("", { status: 503, statusText: "offline" });
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => navigateOffline(url.pathname)));
    return;
  }

  if (!isStaticAsset(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok) return response;
        const copy = response.clone();
        void caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});
