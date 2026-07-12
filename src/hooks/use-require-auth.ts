"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"

export function useRequireAuth() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signup")
    }
  }, [user, loading, router])

  return { checkingAuth: loading || !user }
}
