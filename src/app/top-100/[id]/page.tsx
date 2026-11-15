"use client"
// One Top 100 sheet: a self-contained A4 HTML file shown as a page you can pinch-zoom (no buttons).
// The file is shown inside an isolated frame, so its own styles never touch the app and it cannot run scripts.
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { useUser } from "@/firebase"
import { ZoomReader } from "@/components/notes/zoom-reader"

const A4 = 794 // 210 mm in CSS pixels

export default function Top100Viewer() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const [html, setHtml] = useState("")
  const [mark, setMark] = useState<string | null>(null)
  const [err, setErr] = useState("")
  const [h, setH] = useState(1200)
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!user || !id) return
    let on = true
    ;(async () => {
      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/top100/doc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, id }) })
        const out = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(out.error || "Could not open this topic.")
        const file = await fetch(out.url)
        if (!file.ok) throw new Error("Could not load this topic. Please try again.")
        const text = await file.text()
        if (on) { setMark(out.email || null); setHtml(text) }
      } catch (e: any) { if (on) setErr(e?.message || "Could not open this topic.") }
    })()
    return () => { on = false }
  }, [user, id])

  const measure = useCallback(() => {
    const d = frame.current?.contentDocument
    if (d?.documentElement) setH(Math.max(400, d.documentElement.scrollHeight))
  }, [])

  if (err) return (
    <div className="mx-auto max-w-md p-10 text-center">
      <p className="text-sm text-muted-foreground">{err}</p>
      <Link href="/top-100" className="mt-4 inline-block text-sm font-bold text-primary">Back to Top 100 Topics</Link>
    </div>
  )
  if (!html) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  // the member's email, faintly repeated over the page (not for admins)
  const wm = mark ? `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='420' height='240'><text x='20' y='140' transform='rotate(-24 210 120)' font-family='sans-serif' font-size='17' fill='rgba(12,27,50,0.07)'>${mark.replace(/[<>&'"]/g, "")}</text></svg>`)}")` : undefined

  return (
    <ZoomReader pageWidth={A4}>
      <div style={{ position: "relative" }}>
        <iframe
          ref={frame}
          title="Topic"
          srcDoc={html}
          sandbox="allow-same-origin"
          scrolling="no"
          onLoad={() => { measure(); setTimeout(measure, 400); setTimeout(measure, 1500); frame.current?.contentDocument?.fonts?.ready.then(measure).catch(() => {}) }}
          style={{ width: A4, height: h, border: 0, display: "block", pointerEvents: "none" }}
        />
        {wm && <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: wm, pointerEvents: "none" }} />}
      </div>
    </ZoomReader>
  )
}
