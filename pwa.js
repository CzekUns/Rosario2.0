"use strict";

if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // L'assenza del service worker non impedisce l'uso della recita.
    });
  });
}
