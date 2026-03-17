// formularios.ia — Service Worker
// Scope: /f/ (public form renderer only)

const CACHE_NAME = "formularios-v1"
const DB_NAME = "formularios-offline-queue"
const STORE_NAME = "responses"
const SUBMIT_URL = "/api/responses/submit"

// ── IndexedDB helpers ──────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: "_id", autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function enqueue(payload) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const req = store.add({ ...payload, _queuedAt: Date.now() })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function dequeue(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAllQueued() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Flush offline queue ────────────────────────────────────────────────────────

async function flushQueue() {
  const items = await getAllQueued()
  for (const item of items) {
    const { _id, _queuedAt, ...body } = item
    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        await dequeue(_id)
      }
    } catch {
      // Still offline — keep in queue, will retry on next sync
    }
  }
}

// ── Install & Activate ─────────────────────────────────────────────────────────

self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// ── Fetch interception ─────────────────────────────────────────────────────────

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url)

  // Intercept POST /api/responses/submit
  if (e.request.method === "POST" && url.pathname === SUBMIT_URL) {
    e.respondWith(
      e.request.clone().json().then(async (body) => {
        try {
          // Try network first
          const res = await fetch(e.request)
          return res
        } catch {
          // Offline — enqueue and return 202
          await enqueue(body)
          // Register a background sync if supported
          if ("sync" in self.registration) {
            await self.registration.sync.register("submit-response").catch(() => {})
          }
          return new Response(JSON.stringify({ queued: true }), {
            status: 202,
            headers: { "Content-Type": "application/json" },
          })
        }
      })
    )
    return
  }

  // Cache GET requests for /f/* pages (stale-while-revalidate)
  if (e.request.method === "GET" && url.pathname.startsWith("/f/")) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(e.request)
        const networkPromise = fetch(e.request)
          .then((res) => {
            if (res.ok) cache.put(e.request, res.clone())
            return res
          })
          .catch(() => null)
        return cached ?? (await networkPromise) ?? new Response("Offline", { status: 503 })
      })
    )
    return
  }
})

// ── Background Sync ────────────────────────────────────────────────────────────

self.addEventListener("sync", (e) => {
  if (e.tag === "submit-response") {
    e.waitUntil(flushQueue())
  }
})

// ── Manual flush (Safari / Firefox fallback) ───────────────────────────────────

self.addEventListener("message", (e) => {
  if (e.data === "flush-queue") {
    flushQueue().catch(() => {})
  }
})
