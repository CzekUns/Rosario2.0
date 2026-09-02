"use strict";

const CACHE_NAME = "rosario-2-v18-20260902";
const APP_SHELL = [
  "./",
  "./index.html",
  "./rosario.html",
  "./styles.css",
  "./grip-window.css",
  "./rosary-atmosphere.css",
  "./rosary-data.js",
  "./home.js",
  "./app.js",
  "./grip-window.js",
  "./rosary-atmosphere.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./assets/app-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const withoutQuery = `${url.origin}${url.pathname}`;
          return (await caches.match(withoutQuery)) || caches.match("./index.html");
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
