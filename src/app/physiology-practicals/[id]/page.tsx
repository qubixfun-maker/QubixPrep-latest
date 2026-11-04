"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { byId, saveScore } from "@/lib/physiology/practicals"

export default function PracticalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { checkingAuth } = useRequireAuth()
  const p = byId(id)
  const frame = useRef<HTMLIFrameElement>(null)
  const [h, setH] = useState(720)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || !e.data || typeof e.data !== "object") return
      if (e.data.qp === "height" && typeof e.data.h === "number") setH(Math.max(480, Math.ceil(e.data.h)))
      if (e.data.qp === "score" && p) saveScore(p.id, Number(e.data.tot), Number(e.data.max))
    }
    window.addEventListener("message", on)
    return () => window.removeEventListener("message", on)
  }, [p])

  if (!p) notFound()
  if (checkingAuth) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 md:px-6 md:py-6">
      <div>
        <Link href="/physiology-practicals" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Physiology Practicals</Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl"><span>{p.emoji}</span> {p.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{p.desc}</p>
      </div>
      {!loaded && <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      <iframe
        ref={frame}
        src={`/physiology/${p.id}.html`}
        title={p.title}
        onLoad={() => setLoaded(true)}
        style={{ height: h }}
        className={`w-full border-0 bg-transparent ${loaded ? "" : "invisible h-0"}`}
      />
    </div>
  )
}
