"use client"

import { useEffect, useRef, useState, use } from "react"
import { useUser } from "@/firebase"
import { ChevronLeft, ChevronRight, Loader2, ShieldAlert, ZoomIn, ZoomOut, Maximize } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

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
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const fitToScreen = () => {
    transformRef.current?.resetTransform()
  }

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

      // Step 1: render a small, cheap probe copy just to detect the content boundary.
      // Scanning pixels on a tiny image is fast; scanning a full-res render is what was slow.
      const PROBE_SCALE = 0.3
      const probeViewport = page.getViewport({ scale: PROBE_SCALE })
      const probeCanvas = document.createElement("canvas")
      probeCanvas.width = probeViewport.width
      probeCanvas.height = probeViewport.height
      const probeCtx = probeCanvas.getContext("2d")!
      await page.render({ canvasContext: probeCtx, viewport: probeViewport }).promise
      if (cancelled) return

      const { data, width: pw, height: ph } = probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height)
      const THRESHOLD = 250
      const hasContentAt = (i: number) => data[i] < THRESHOLD || data[i + 1] < THRESHOLD || data[i + 2] < THRESHOLD

      let top = 0, bottom = ph - 1, left = 0, right = pw - 1

      const rowHasContent = (y: number) => {
        const rowStart = y * pw * 4
        for (let x = 0; x < pw; x++) {
          if (hasContentAt(rowStart + x * 4)) return true
        }
        return false
      }
      const colHasContent = (x: number) => {
        for (let y = 0; y < ph; y++) {
          if (hasContentAt((y * pw + x) * 4)) return true
        }
        return false
      }

      while (top < bottom && !rowHasContent(top)) top++
      while (bottom > top && !rowHasContent(bottom)) bottom--
      while (left < right && !colHasContent(left)) left++
      while (right > left && !colHasContent(right)) right--

      // Convert the probe's bounding box into fractions of the page, then apply to the full-res render
      const fracTop = top / ph
      const fracBottom = bottom / ph
      const fracLeft = left / pw
      const fracRight = right / pw
      const isFullyBlankOrUncropped = fracLeft >= 0.01 * 0 && (right - left) >= pw * 0.98 && (bottom - top) >= ph * 0.98

      // Step 2: render the real, full-quality page
      const viewport = page.getViewport({ scale: 2 })
      const rawCanvas = document.createElement("canvas")
      rawCanvas.width = viewport.width
      rawCanvas.height = viewport.height
      const rawCtx = rawCanvas.getContext("2d")!
      await page.render({ canvasContext: rawCtx, viewport }).promise
      if (cancelled) return

      const width = viewport.width
      const height = viewport.height
      const PAD = 24
      const cropX = Math.max(0, fracLeft * width - PAD)
      const cropY = Math.max(0, fracTop * height - PAD)
      const cropRight = Math.min(width, fracRight * width + PAD)
      const cropBottom = Math.min(height, fracBottom * height + PAD)
      const cropW = cropRight - cropX
      const cropH = cropBottom - cropY

      const canvas = canvasRef.current!
      const context = canvas.getContext("2d")!

      if (cropW <= 0 || cropH <= 0 || isFullyBlankOrUncropped) {
        canvas.width = width
        canvas.height = height
        context.drawImage(rawCanvas, 0, 0)
      } else {
        canvas.width = cropW
        canvas.height = cropH
        context.drawImage(rawCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
      }

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
      className="max-w-4xl mx-auto flex flex-col h-[calc(100dvh-3.5rem)] md:h-screen select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between shrink-0 px-4 py-3">
        <Link href="/products" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 hover:underline">
          <ChevronLeft className="h-3 w-3" /> Back to Store
        </Link>
        <h1 className="text-sm font-bold truncate">{title}</h1>
        <span className="text-xs text-muted-foreground">Page {pageNum} / {numPages}</span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={1}
          maxScale={6}
          centerOnInit
          limitToBounds={true}
          wheel={{ step: 0.15 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "zoomIn", step: 0.7 }}
        >
          {({ zoomIn, zoomOut }) => (
            <>
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <canvas ref={canvasRef} className="max-w-full max-h-full w-auto h-auto rounded-lg pointer-events-none" />
                </div>
              </TransformComponent>

              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl glass-darker border border-white/10" onClick={() => zoomIn()}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl glass-darker border border-white/10" onClick={() => zoomOut()}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl glass-darker border border-white/10" onClick={fitToScreen}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>

      <div className="flex items-center justify-center gap-4 shrink-0 py-3">
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
