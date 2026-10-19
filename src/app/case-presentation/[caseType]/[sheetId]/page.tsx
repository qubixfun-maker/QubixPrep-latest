"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useFirestore } from "@/firebase"
import { getCase } from "@/lib/casepres"
import { sheetTitle } from "@/lib/casepres/format"
import { useCaseAccess, useCaseSheet, saveCaseSheet } from "@/hooks/use-case-sheets"
import { CaseForm } from "@/components/casepres/case-form"
import { CasePresentation } from "@/components/casepres/presentation"
import type { Answers } from "@/lib/casepres/types"

export default function CaseSheetPage() {
  const params = useParams<{ caseType: string; sheetId: string }>()
  const router = useRouter()
  const db = useFirestore()
  const caseDef = getCase(params.caseType)
  const { user, loading: accessLoading, allowed } = useCaseAccess()
  const initialId = params.sheetId === "new" ? null : params.sheetId
  const { sheet, loading: sheetLoading } = useCaseSheet(initialId)

  const [answers, setAnswers] = useState<Answers>({})
  const [mode, setMode] = useState<"edit" | "present">("edit")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const idRef = useRef<string | null>(initialId)
  const loadedRef = useRef(false)
  const dirtyRef = useRef(false)

  const draftKey = `casepres-draft-${params.caseType}-${initialId ?? "new"}`

  // Load: saved sheet if opening one, otherwise a local draft for a new case.
  useEffect(() => {
    if (loadedRef.current) return
    if (initialId) {
      if (sheetLoading) return
      if (sheet) { setAnswers(sheet.answers || {}); loadedRef.current = true }
      else if (!sheetLoading) { loadedRef.current = true }
    } else {
      try {
        const raw = localStorage.getItem(draftKey)
        if (raw) setAnswers(JSON.parse(raw))
      } catch {}
      loadedRef.current = true
    }
  }, [initialId, sheet, sheetLoading, draftKey])

  const setField = useCallback((id: string, v: any) => {
    dirtyRef.current = true
    setAnswers((a) => ({ ...a, [id]: v }))
  }, [])

  // Autosave (debounced) to the student's account, with a local draft as a safety net.
  useEffect(() => {
    if (!dirtyRef.current || !caseDef || !db || !user || !allowed) return
    try { localStorage.setItem(draftKey, JSON.stringify(answers)) } catch {}
    setSaveState("saving")
    const t = setTimeout(async () => {
      try {
        const id = await saveCaseSheet(db, user.uid, idRef.current, {
          caseType: caseDef.id, subject: caseDef.subject, title: sheetTitle(caseDef, answers), answers,
        })
        if (!idRef.current) {
          idRef.current = id
          try { localStorage.removeItem(draftKey) } catch {}
          window.history.replaceState(null, "", `/case-presentation/${caseDef.id}/${id}`)
        }
        dirtyRef.current = false
        setSaveState("saved")
      } catch {
        setSaveState("error")
      }
    }, 1200)
    return () => clearTimeout(t)
  }, [answers, caseDef, db, user, allowed, draftKey])

  const content = useMemo(() => {
    if (!caseDef) return <div className="max-w-xl mx-auto p-10 text-center space-y-4"><p>That case type does not exist.</p><Link href="/case-presentation"><Button>Back to cases</Button></Link></div>
    if (accessLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    if (!user) return <div className="max-w-xl mx-auto p-10 text-center space-y-4"><p>Please sign in to use Case Presentation.</p><Button onClick={() => router.push("/login")}>Sign in</Button></div>
    if (!allowed) return <div className="max-w-xl mx-auto p-6 pt-12"><UpgradeGate type="content" title="Case Presentation is for subscribers" description="Subscribe to Scholar (₹999/year) to fill in case proformas and generate professional case presentations." /></div>
    if (initialId && sheetLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    if (mode === "present") return <CasePresentation caseDef={caseDef} answers={answers} onBack={() => setMode("edit")} />
    return <CaseForm caseDef={caseDef} answers={answers} setField={setField} onPresent={() => setMode("present")} saveState={saveState} />
  }, [caseDef, accessLoading, user, allowed, initialId, sheetLoading, mode, answers, saveState, setField, router])

  return content
}
