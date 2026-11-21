/* sw.js: the app works with no signal in the field.
   - On the first visit it saves the app and its data (PRECACHE, about 0.8 MB compressed).
   - App files and data are served from that saved copy at once and refreshed in the background, so a new version
     shows the next time the app is opened, with no prompt.
   - Map tiles (the saved Sóc Trăng tiles and the online imagery) are kept as the farmer views them, up to TILE_MAX.
   - Anything else (place search, live weather) goes to the network as before.
   pipeline/test_build.py checks that PRECACHE lists every local file index.html loads, and that each one exists. */
const CACHE = "mre-app-3", TILES = "mre-tiles-1", TILE_MAX = 1500;
const LEAFLET = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const PRECACHE = [
  "./",
  "app/app.js",
  "app/builder.js",
  "app/content.css",
  "app/cost.css",
  "app/cost.js",
  "app/costs.json",
  "app/dash.css",
  "app/dash.js",
  "app/districts.js",
  "app/draft5.css",
  "app/extra.js",
  "app/icons/icon-180.png",
  "app/icons/icon-192.png",
  "app/icons/icon-512.png",
  "app/lab.css",
  "app/lab.js",
  "app/leaflet.css",
  "app/learn.js",
  "app/load.js",
  "app/map.css",
  "app/map.js",
  "app/mentor.css",
  "app/mentor.js",
  "app/nitrogen.js",
  "app/onboard.css",
  "app/onboard.js",
  "app/research.json",
  "app/rx.js",
  "app/season.js",
  "app/side.css",
  "app/side.js",
  "app/srcextra.js",
  "app/strings.js",
  "app/style.css",
  "app/tiles.js",
  "app/today.css",
  "app/vn.css",
  "app/vn.js",
  "app/vn_geo.js",
  "app/vnbtn.js",
  "data/provinces.json",
  "data/sites.json",
  "index.html",
  "manifest.webmanifest",
  LEAFLET
];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== TILES).map((k) => caches.delete(k)))).then(() => self.clients.claim())));

const isTile = (u) => u.pathname.includes("/app/tiles/") || /arcgisonline\.com$/.test(u.hostname);
const isApp = (u) => u.origin === self.location.origin || u.hostname === "cdnjs.cloudflare.com" || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);

self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (isTile(u)) {  // tiles never change: the saved one if there is one, else fetch and keep it
    e.respondWith(caches.open(TILES).then((c) => c.match(r).then((hit) => hit || fetch(r).then((res) => {
      if (res.ok || res.type === "opaque") c.put(r, res.clone()).then(() => c.keys()).then((ks) => { if (ks.length > TILE_MAX) c.delete(ks[0]); });
      return res;
    }))));
    return;
  }
  if (!isApp(u)) return;
  // the saved copy at once (a page address opens the saved app), refreshed in the background for the next open
  const root = new URL("./", self.location).pathname;  // only the app page shares the "./" key; other pages keep their own
  const key = r.mode === "navigate" && (u.pathname === root || u.pathname === root + "index.html") ? "./" : r;
  e.respondWith(caches.open(CACHE).then((c) => c.match(key, { ignoreSearch: key === "./" }).then((hit) => {
    const net = fetch(r).then((res) => { if (res.ok) c.put(key, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  })));
});
