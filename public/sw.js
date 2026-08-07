/* eslint-disable no-restricted-globals */

/**
 * Offline shell for the webinar deck.
 *
 * The presenter's connection is the one thing about 9 August that nobody in
 * this repository controls. Once the deck has been opened, every byte it needs
 * lives in Cache Storage, and losing the network mid-broadcast changes nothing
 * visible on stage — including an accidental F5.
 *
 * Deliberately runtime-populated rather than precached on install: the deck
 * warms itself (see usePreload) within the first two minutes, so a 120 MB
 * install-time download would only move the same traffic earlier and block
 * activation while the presenter is trying to open the page.
 */

const VERSION = "imarat-deck-v1";
const SHELL = `shell-${VERSION}`;
const ASSETS = `assets-${VERSION}`;

/** Immutable once built: hashed chunks and everything under /media. */
const isImmutable = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/media/");

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(["/", "/preflight"]))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * A cached video is stored whole, but `<video>` asks for byte ranges. Chrome
 * tolerates a 200 in place of a 206 by re-buffering from zero, which on a
 * looping stage video reads as a stutter every time it wraps — so slice the
 * cached body and answer in the shape that was actually requested.
 */
async function rangeFrom(cached, header) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return cached;

  const body = await cached.arrayBuffer();
  const total = body.byteLength;
  const hasStart = match[1] !== "";
  const start = hasStart ? Number(match[1]) : Math.max(0, total - Number(match[2] || 0));
  const end = hasStart && match[2] !== "" ? Math.min(Number(match[2]), total - 1) : total - 1;

  if (!Number.isFinite(start) || start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }

  const headers = new Headers(cached.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");

  return new Response(body.slice(start, end + 1), {
    status: 206,
    statusText: "Partial Content",
    headers,
  });
}

async function cacheFirst(request) {
  const cacheName = isImmutable(new URL(request.url)) ? ASSETS : SHELL;
  const cache = await caches.open(cacheName);
  const range = request.headers.get("range");

  // Range requests never match a stored 200, so look the bare URL up instead.
  const cached = await cache.match(range ? new Request(request.url) : request, {
    ignoreVary: true,
  });
  if (cached) return range ? rangeFrom(cached.clone(), range) : cached;

  const response = await fetch(request);
  // A 206 from the network is a fragment; storing it would poison the entry.
  if (response.ok && response.status === 200 && !range) {
    cache.put(request, response.clone()).catch(() => {});
  } else if (range && response.ok) {
    // Warm the full body in the background so the next seek survives offline.
    fetch(request.url)
      .then((full) => (full.ok ? cache.put(new Request(request.url), full) : null))
      .catch(() => {});
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL);
  const cached = await cache.match(request, { ignoreVary: true });
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => null);
  return cached ?? (await network) ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations must resolve even with the radio off: the deck is one document
  // and its position lives in the hash, so the cached shell restores exactly
  // where the presenter was.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL);
        return (
          (await cache.match(request, { ignoreSearch: true, ignoreVary: true })) ??
          (await cache.match("/", { ignoreVary: true })) ??
          Response.error()
        );
      }),
    );
    return;
  }

  event.respondWith(isImmutable(url) ? cacheFirst(request) : staleWhileRevalidate(request));
});
