// Keeps the Top 100 notes a member has already opened on their own device, so they open instantly (and work with a weak signal).
// Nothing here ever throws: if the browser blocks storage, notes simply load from the server as before.
const DB_NAME = "qp-top100"
const STORE = "notes"
const MAX_AGE = 30 * 24 * 3600 * 1000 // a saved copy older than 30 days is dropped

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null)
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE) }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch { resolve(null) }
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then((db) => new Promise<T | undefined>((resolve) => {
    if (!db) return resolve(undefined)
    try {
      const t = db.transaction(STORE, mode)
      const r = fn(t.objectStore(STORE))
      t.oncomplete = () => { db.close(); resolve(r ? (r as IDBRequest<T>).result : undefined) }
      t.onerror = t.onabort = () => { db.close(); resolve(undefined) }
    } catch { try { db.close() } catch {} resolve(undefined) }
  }))
}

const key = (uid: string, id: string) => `${uid}:${id}`

/** The saved note for this member, or null. Saved copies are private to the account that opened them. */
export async function getCached(uid: string, id: string): Promise<any | null> {
  const v: any = await tx("readonly", (s) => s.get(key(uid, id)))
  if (!v || !v.data) return null
  if (Date.now() - (v.savedAt || 0) > MAX_AGE) { removeCached(uid, id); return null }
  return v.data
}

export async function putCached(uid: string, id: string, data: any): Promise<void> {
  await tx("readwrite", (s) => { s.put({ data, savedAt: Date.now() }, key(uid, id)) })
}

export async function removeCached(uid: string, id: string): Promise<void> {
  await tx("readwrite", (s) => { s.delete(key(uid, id)) })
}

/** Deletes every saved note on this device (used when the plan is no longer active). */
export async function clearTop100Cache(): Promise<void> {
  await tx("readwrite", (s) => { s.clear() })
}
