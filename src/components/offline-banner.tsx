"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine)
    sync()
    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync) }
  }, [])
  if (!offline) return null
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center gap-2 bg-slate-900 px-4 py-2.5 text-center text-xs font-bold text-white shadow-2xl" style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
      <WifiOff className="h-4 w-4 shrink-0" /> You are offline. Pages and content you opened before still work. Answers and progress sync when you are back online.
    </div>
  )
}
