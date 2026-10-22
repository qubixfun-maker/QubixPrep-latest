"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { SPOTS, KNOWN_GROUPS } from "./index"
import type { Spot, SpotMcq } from "./types"

const str = (v: any) => (typeof v === "string" ? v.trim() : "")
const strs = (v: any) => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])

/** Checks one item from spotters.json. Returns a clean Spot or a plain-English problem. */
export function validateSpot(raw: any): { spot: Spot | null; error: string } {
  if (!raw || typeof raw !== "object") return { spot: null, error: "Not an object" }
  const id = str(raw.id)
  if (!/^[a-z0-9][a-z0-9_-]{1,60}$/.test(id)) return { spot: null, error: `Bad id "${raw.id}" (use small letters, numbers and dashes, e.g. sur-allis)` }
  for (const k of ["name", "subject", "group", "topic", "about"]) if (!str(raw[k])) return { spot: null, error: `"${id}": missing ${k}` }
  const imgs = Array.isArray(raw.imgs) ? raw.imgs.map((m: any) => ({ f: str(m?.f), cap: str(m?.cap) || undefined })).filter((m: any) => m.f) : []
  if (!imgs.length) return { spot: null, error: `"${id}": needs at least one image in imgs` }
  const identify = strs(raw.identify)
  if (!identify.length) return { spot: null, error: `"${id}": needs identify points` }
  const mcq: SpotMcq[] = []
  for (const m of Array.isArray(raw.mcq) ? raw.mcq : []) {
    if (!Array.isArray(m) || m.length < 6 || m.slice(0, 6).some((x: any) => !str(x))) return { spot: null, error: `"${id}": each mcq needs 6 texts [question, correct, wrong1, wrong2, wrong3, explanation]` }
    if (new Set(m.slice(1, 5).map(str)).size !== 4) return { spot: null, error: `"${id}": an mcq has repeated options` }
    mcq.push(m.slice(0, 6).map(str) as SpotMcq)
  }
  return {
    error: "",
    spot: {
      id, name: str(raw.name), aka: str(raw.aka) || undefined, subject: str(raw.subject), group: str(raw.group), topic: str(raw.topic),
      imgs, labelled: !!raw.labelled, identify, about: str(raw.about), points: strs(raw.points), viva: strs(raw.viva), mcq,
    },
  }
}

/* Firestore cannot store arrays inside arrays, so each MCQ is saved as a small object. */
export function toDoc(s: Spot) {
  return { ...s, aka: s.aka || "", labelled: !!s.labelled, mcq: s.mcq.map((m) => ({ q: m[0], a: m[1], w1: m[2], w2: m[3], w3: m[4], why: m[5] })) }
}
export function fromDoc(d: any): Spot | null {
  if (!d || !str(d.id) || !Array.isArray(d.imgs) || !d.imgs.length) return null
  return {
    id: d.id, name: str(d.name), aka: str(d.aka) || undefined, subject: str(d.subject), group: str(d.group), topic: str(d.topic),
    imgs: d.imgs.map((m: any) => ({ f: str(m?.f), cap: str(m?.cap) || undefined })).filter((m: any) => m.f),
    labelled: !!d.labelled, identify: strs(d.identify), about: str(d.about), points: strs(d.points), viva: strs(d.viva),
    mcq: (Array.isArray(d.mcq) ? d.mcq : []).map((m: any) => [str(m.q), str(m.a), str(m.w1), str(m.w2), str(m.w3), str(m.why)] as SpotMcq).filter((m: SpotMcq) => m[0] && m[1]),
  }
}

/* ---- the items that were uploaded through Admin > Spotters, read once per visit ---- */
let cache: Spot[] | null = null
let inflight: Promise<Spot[]> | null = null
const listeners = new Set<() => void>()
export function clearSpotsCache() { cache = null; inflight = null; listeners.forEach((f) => f()) }

/** Built-in items plus anything uploaded from the admin page. An uploaded item replaces a built-in one with the same id. */
export function useSpots() {
  const db = useFirestore()
  const [remote, setRemote] = useState<Spot[]>(cache || [])
  const [ready, setReady] = useState(!!cache)
  const [tick, setTick] = useState(0)

  useEffect(() => { const f = () => setTick((n) => n + 1); listeners.add(f); return () => { listeners.delete(f) } }, [])

  useEffect(() => {
    if (!db) return
    if (cache) { setRemote(cache); setReady(true); return }
    let dead = false
    inflight ||= getDocs(collection(db, "spotters"))
      .then((snap) => snap.docs.map((d) => fromDoc(d.data())).filter((x): x is Spot => !!x))
      .catch(() => [] as Spot[]) // rules not deployed yet, or offline: just show the built-in items
    inflight.then((list) => { cache = list; if (!dead) { setRemote(list); setReady(true) } })
    return () => { dead = true }
  }, [db, tick])

  const spots = useMemo(() => {
    const ids = new Set(remote.map((r) => r.id))
    return [...SPOTS.filter((s) => !ids.has(s.id)), ...remote]
  }, [remote])
  const byId = useMemo(() => Object.fromEntries(spots.map((s) => [s.id, s])) as Record<string, Spot>, [spots])
  const groups = useMemo(() => {
    const present = new Set(spots.map((s) => s.group))
    return [...KNOWN_GROUPS.filter((g) => present.has(g)), ...Array.from(present).filter((g) => !KNOWN_GROUPS.includes(g)).sort()]
  }, [spots])
  return { spots, byId, groups, ready, uploaded: remote }
}
