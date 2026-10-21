// QubixPrep service worker v2: lets pages you have already opened work without internet.
// Study content (notes, cards, questions) comes back from Firestore's own offline cache; this file keeps the app shell and assets.
const VERSION = 'v2'
const STATIC = 'qp-static-' + VERSION
const PAGES = 'qp-pages-' + VERSION
const RSC = 'qp-rsc-' + VERSION
const KEEP = [STATIC, PAGES, RSC]

const OFFLINE_HTML = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0f172a;color:#fff;text-align:center;padding:24px"><div><h1 style="font-size:28px;margin:0 0 8px">You are offline</h1><p style="opacity:.8;max-width:320px;margin:0 auto 20px">This page was not saved on this device yet. Open it once while online and it will work offline next time.</p><button onclick="location.reload()" style="background:#7c3aed;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-weight:700;font-size:15px">Try again</button></div></body>'

self.addEventListener('install', () => { self.skipWaiting() })

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

async function trim(name, max) {
  const c = await caches.open(name)
  const keys = await c.keys()
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i])
}

async function networkFirst(req, cacheName, max) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(req)
    if (res && res.ok && res.type === 'basic') { cache.put(req, res.clone()).then(() => trim(cacheName, max)).catch(() => {}) }
    return res
  } catch (e) {
    const hit = await cache.match(req, { ignoreVary: true })
    if (hit) return hit
    throw e
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res && res.ok) { cache.put(req, res.clone()).then(() => trim(STATIC, 300)).catch(() => {}) }
  return res
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // Firebase, Razorpay, fonts etc. are left alone
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/')) return

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/jelly/') || /\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req).catch(() => new Response('', { status: 504 })))
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, PAGES, 40).catch(() => new Response(OFFLINE_HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    return
  }

  if (req.headers.get('RSC') || url.searchParams.has('_rsc')) {
    event.respondWith(networkFirst(req, RSC, 80))
  }
})
