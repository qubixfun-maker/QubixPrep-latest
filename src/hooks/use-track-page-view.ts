"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore"

const LAST_ACTIVE_THROTTLE_MS = 60 * 60 * 1000 // update lastActiveAt at most once per hour per user

export function useTrackPageView() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()

  useEffect(() => {
    if (!user || !db || !pathname) return
    if (pathname.startsWith("/admin")) return

    addDoc(collection(db, "pageViews"), {
      userId: user.uid,
      userName: user.displayName || user.email || "Unknown",
      path: pathname,
      timestamp: serverTimestamp(),
    }).catch(() => {})

    try {
      const key = "lastActiveUpdate_" + user.uid
      const lastUpdate = localStorage.getItem(key)
      const now = Date.now()
      if (!lastUpdate || now - parseInt(lastUpdate) > LAST_ACTIVE_THROTTLE_MS) {
        updateDoc(doc(db, "users", user.uid), { lastActiveAt: serverTimestamp() }).catch(() => {})
        localStorage.setItem(key, String(now))
      }
    } catch {
      // localStorage may be unavailable in some contexts - fail silently
    }
  }, [pathname, user, db])
}
