"use client"
import { useEffect } from "react"
import { Square } from "lucide-react"

/** A clear red Stop button that shows only while Jelly is speaking. Pressing Esc does the same. */
export function JellyStopButton({ show, onStop, variant }: { show: boolean; onStop: () => void; variant: "header" | "pill" | "page" }) {
  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onStop() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [show, onStop])

  if (!show) return null

  if (variant === "pill") {
    return (
      <button onClick={onStop} aria-label="Stop Jelly speaking"
        className="fixed z-[60] right-3 sm:right-6 bottom-40 flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-500/30 active:scale-95 animate-in fade-in slide-in-from-bottom-2">
        <Square className="h-3 w-3 fill-current" /> Stop
      </button>
    )
  }

  return (
    <button onClick={onStop} aria-label="Stop Jelly speaking" title="Stop speaking (Esc)"
      className={`flex items-center gap-1 bg-red-500 text-white font-bold hover:bg-red-600 active:scale-95 ${variant === "page" ? "rounded-xl px-2.5 py-2 text-xs" : "rounded-lg px-2 py-1.5 text-[11px]"}`}>
      <Square className="h-3 w-3 fill-current" /> Stop
    </button>
  )
}
