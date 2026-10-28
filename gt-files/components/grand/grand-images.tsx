"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { X } from "lucide-react"
import { useFirestore } from "@/firebase"

const cache = new Map<string, string>()

function One({ name }: { name: string }) {
  const db = useFirestore()
  const [src, setSrc] = useState<string | null>(cache.get(name) ?? null)
  const [failed, setFailed] = useState(false)
  const [big, setBig] = useState(false)

  useEffect(() => {
    const hit = cache.get(name)
    if (hit) { setSrc(hit); return }
    if (!db) return
    let alive = true
    getDoc(doc(db, "grandImages", name))
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
  return (
    <>
      <img src={src} alt="Question figure" loading="lazy" onClick={() => setBig(true)} className="max-h-80 w-auto max-w-full cursor-zoom-in rounded-xl border border-white/10 bg-white object-contain" />
      {big && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-3" onClick={() => setBig(false)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white" aria-label="Close"><X className="h-5 w-5" /></button>
          <img src={src} alt="Question figure" className="max-h-[92vh] max-w-full rounded-lg bg-white object-contain" />
        </div>
      )}
    </>
  )
}

export function GrandImages({ names }: { names?: string[] }) {
  if (!names || names.length === 0) return null
  return <div className="space-y-2 pt-1">{names.map((n) => <One key={n} name={n} />)}</div>
}
