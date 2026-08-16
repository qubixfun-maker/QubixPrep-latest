"use client"

import { useEffect, useState, use } from "react"
import { useUser } from "@/firebase"
import { Loader2, ShieldAlert, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const AUTO_CLOSE_MS = 10 * 60 * 1000 // 10 minutes

export default function NotePackViewerPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params)
  const { user, loading: userLoading } = useUser()

  const [status, setStatus] = useState<"loading" | "denied" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [title, setTitle] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_MS / 1000)

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

        const isMobileOrTablet = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent) || window.innerWidth < 1024
        if (isMobileOrTablet) {
          window.location.replace(data.url)
          return
        }

        setPdfUrl(data.url)
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
    if (status !== "ready") return

    const closeTimer = setTimeout(() => {
      window.close()
    }, AUTO_CLOSE_MS)

    const tickInterval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)

    return () => {
      clearTimeout(closeTimer)
      clearInterval(tickInterval)
    }
  }, [status])

  if (status === "loading" || userLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-black">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your notes...</p>
      </div>
    )
  }

  if (status === "denied" || status === "error") {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-black">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <div>
          <h1 className="text-xl font-bold">Can't open this</h1>
          <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
        </div>
        <Link href="/products"><Button>Back to Products</Button></Link>
      </div>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return (
    <div className="h-screen w-screen flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10 shrink-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
            Open Directly
          </a>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Closes in {minutes}:{seconds.toString().padStart(2, "0")}</span>
          </div>
        </div>
      </div>
      <iframe
        src={pdfUrl}
        title={title || "Notes"}
        className="flex-1 w-full border-none"
      />
    </div>
  )
}
