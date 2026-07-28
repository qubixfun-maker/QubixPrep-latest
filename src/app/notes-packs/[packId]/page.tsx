"use client"

import { useEffect, useRef, useState, use } from "react"
import { useUser } from "@/firebase"
import { ChevronLeft, ChevronRight, Loader2, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotePackViewerPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params)
  const { user, loading: userLoading } = useUser()

  const [status, setStatus] = useState<"loading" | "denied" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [title, setTitle] = useState("")
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [rendering, setRendering] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setStatus("denied")
      setErrorMsg("Please log in to view this.")
      return
    }

    let cancelled = false
    async function load() {
      try {
        const idToken = await user!.getIdToken()
        const res = await fetch("/api/notepacks/view-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, packId }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (cancelled) return
          setStatus("denied")
          setErrorMsg(data.error || "You don't have access to this Notes Pack.")
          return
        }
        if (cancelled) return
        setTitle(data.title || "")

        const pdfjsLib: any = await import("pdfjs-dist/build/pdf.mjs")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

        const loadingTask = pdfjsLib.getDocument({ url: data.url })
        const doc = await loadingTask.promise
        if (cancelled) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setStatus("ready")
      } catch (e: any) {
        if (cancelled) return
        setStatus("error")
        setErrorMsg(e.message || "Failed to load the PDF.")
      }
    }
    load()
    return () => { cancelled = true }
  }, [user, userLoading, packId])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let cancelled = false
    async function renderPage() {
      setRendering(true)
      const page = await pdfDoc.getPage(pageNum)
      if (cancelled) return
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current!
      const context = canvas.getContext("2d")!
      canvas.height = viewport.height
      canvas.width = viewport.width
      await page.render({ canvasContext: context, viewport }).promise
      if (!cancelled) setRendering(false)
    }
    renderPage()
    return () => { cancelled = true }
  }, [pdfDoc, pageNum])

  useEffect(() => {
    function blockKeys(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && (key === "s" || key === "p" || key === "u")) {
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", blockKeys)
    return () => window.removeEventListener("keydown", blockKeys)
  }, [])

  if (status === "loading" || userLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  }

  if (status === "denied" || status === "error") {
    return (
      <div className="max-w-md mx-auto p-4 md:p-12 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">{errorMsg}</p>
        <Link href="/products"><Button className="rounded-xl">Back to Store</Button></Link>
      </div>
    )
  }

  return (
    <div
      className="max-w-4xl mx-auto p-4 md:p-8 space-y-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between">
        <Link href="/products" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 hover:underline">
          <ChevronLeft className="h-3 w-3" /> Back to Store
        </Link>
        <h1 className="text-sm font-bold truncate">{title}</h1>
        <span className="text-xs text-muted-foreground">Page {pageNum} / {numPages}</span>
      </div>

      <div className="flex justify-center overflow-auto rounded-2xl glass border-none p-4 relative">
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
        <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg pointer-events-none" />
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" className="rounded-xl gap-2" disabled={pageNum <= 1} onClick={() => setPageNum((p) => p - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button variant="outline" className="rounded-xl gap-2" disabled={pageNum >= numPages} onClick={() => setPageNum((p) => p + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
