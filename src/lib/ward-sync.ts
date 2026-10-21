// Keeps Ward Round progress in the student's account as well as in this browser.
import { Firestore, doc, getDoc, setDoc } from "firebase/firestore"
import { loadProgress, type WardProgress } from "@/lib/ward-progress"

const KEY = "qp-ward-progress-v1" // same key ward-progress.ts uses

export async function syncWardProgress(db: Firestore, uid: string): Promise<WardProgress> {
  const local = loadProgress()
  const ref = doc(db, "users", uid, "progress", "ward")
  let remote: WardProgress = { xp: 0, done: {} }
  try { const s = await getDoc(ref); if (s.exists()) { const d = s.data() as any; remote = { xp: Number(d.xp) || 0, done: d.done || {} } } } catch {}
  const done: WardProgress["done"] = { ...remote.done }
  for (const [id, r] of Object.entries(local.done)) {
    const o = done[id]
    if (!o || r.percent > o.percent || (r.percent === o.percent && r.at > o.at)) done[id] = r
  }
  const merged: WardProgress = { xp: Math.max(local.xp, remote.xp), done }
  try { localStorage.setItem(KEY, JSON.stringify(merged)) } catch {}
  try { await setDoc(ref, merged) } catch {}
  return merged
}
