"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useFirestore, useUser } from "@/firebase"
import { addActiveSeconds, bumpPending, takePending } from "@/lib/usage"

const IDLE_AFTER_MS = 60_000 // no tap, key or scroll for a minute = not studying
const FLUSH_EVERY_MS = 30_000

/** Counts the seconds a signed-in student is really using the app (tab visible and recently active) and saves them to their account. */
export function UsageTracker() {
  const { user } = useUser()
  const db = useFirestore()
  const pathname = usePathname()
  const skip = !pathname || pathname.startsWith("/admin")

  useEffect(() => {
    if (!user || !db || skip) return
    let last = Date.now()
    const touch = () => { last = Date.now() }
    const events = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }))

    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - last < IDLE_AFTER_MS) bumpPending(1)
    }, 1000)

    const flush = () => {
      const s = takePending()
      if (s > 0) addActiveSeconds(db, user.uid, s).catch(() => bumpPending(s))
    }
    const save = setInterval(flush, FLUSH_EVERY_MS)
    const onHide = () => { if (document.visibilityState === "hidden") flush() }
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", flush)

    return () => {
      clearInterval(tick); clearInterval(save)
      events.forEach((e) => window.removeEventListener(e, touch))
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", flush)
      flush()
    }
  }, [user, db, skip])

  return null
}
