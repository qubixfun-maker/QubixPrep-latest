// Top 100 topic sheets: one image per topic.
//   top100Pages/{id}   -> { subject, subjectKey, order, title, updatedAt, notesLink? }   (small list entries; notesLink opens the topic in Rapid Revision Notes)
//   top100Images/{id}  -> { data (base64 webp), mime, w, h }                 (paid members and admins only)
import { collection, doc, getDoc, getDocs, type Firestore } from "firebase/firestore"
import { readNotesLink, type NotesLink } from "@/lib/top100-link"

export type Top100Page = { id: string; subject: string; subjectKey: string; order: number; title: string; updatedAt?: number; notesLink?: NotesLink }

let listCache: Top100Page[] | null = null

export async function loadTop100List(db: Firestore, force = false): Promise<Top100Page[]> {
  if (listCache && !force) return listCache
  const snap = await getDocs(collection(db, "top100Pages"))
  const out: Top100Page[] = []
  snap.forEach((d) => { const x: any = d.data(); out.push({ id: d.id, subject: x.subject || "", subjectKey: x.subjectKey || "", order: Number(x.order) || 0, title: x.title || d.id, updatedAt: x.updatedAt, notesLink: readNotesLink(x) }) })
  out.sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order)
  listCache = out
  return out
}

/* ---- on-device cache, so a topic that was opened once opens instantly next time ---- */
const DB = "qp-top100-img"
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => { r.result.createObjectStore("img") }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function cacheGet(id: string): Promise<{ v: number; src: string } | null> {
  try { const d = await idb(); return await new Promise((res) => { const q = d.transaction("img").objectStore("img").get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null) }) } catch { return null }
}
async function cachePut(id: string, v: number, src: string) {
  try { const d = await idb(); d.transaction("img", "readwrite").objectStore("img").put({ v, src }, id) } catch {}
}

/** Returns a data: URL for the topic image (from this device if cached, else from Firestore). */
export async function loadTop100Image(db: Firestore, id: string, version = 0): Promise<string> {
  const hit = await cacheGet(id)
  if (hit && hit.v === version) return hit.src
  const snap = await getDoc(doc(db, "top100Images", id))
  if (!snap.exists()) throw new Error("not-found")
  const x: any = snap.data()
  const src = `data:${x.mime || "image/webp"};base64,${x.data}`
  cachePut(id, version, src)
  return src
}
