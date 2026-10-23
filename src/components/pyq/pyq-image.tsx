"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"

const cache = new Map<string, string>()

export function PyqImage({ name }: { name: string }) {
  const db = useFirestore()
  const [src, setSrc] = useState<string | null>(cache.get(name) ?? null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const hit = cache.get(name)
    if (hit) { setSrc(hit); return }
    if (!db) return
    let alive = true
    getDoc(doc(db, "pyqImages", name))
      .then((s) => {
        if (!alive) return
        const d = s.data()?.d
        if (typeof d === "string") { cache.set(name, d); setSrc(d) } else setFailed(true)
      })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [db, name])

  if (failed) return <p className="text-xs text-muted-foreground">Image could not be loaded.</p>
  if (!src) return <div className="h-32 w-full rounded-xl bg-white/5 animate-pulse" />
  return <img src={src} alt="" loading="lazy" className="max-h-96 w-auto max-w-full rounded-xl border border-white/10 bg-white object-contain" />
}

export function PyqImages({ names }: { names?: string[] }) {
  if (!names || names.length === 0) return null
  return (
    <div className="space-y-2 pt-2">
      {names.map((n) => <PyqImage key={n} name={n} />)}
    </div>
  )
}
