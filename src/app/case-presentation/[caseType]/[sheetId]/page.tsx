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
import { SAMPLE_ANSWERS } from "@/lib/casepres/samples"
import type { Answers } from "@/lib/casepres/types"

export default function CaseSheetPage() {
  const params = useParams<{ caseType: string; sheetId: string }>()
  const router = useRouter()
  const db = useFirestore()
  const caseDef = getCase(params.caseType)
  const { user, loading: accessLoading, allowed } = useCaseAccess()
  // fixed for the life of this page: the address changes to the saved id after the first save, which must not reload the form
  const [initialId] = useState<string | null>(() => (params.sheetId === "new" ? null : params.sheetId))
  const { sheet, loading: sheetLoading, error: sheetError } = useCaseSheet(initialId)

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
      else if (!sheetError) { loadedRef.current = true } // confirmed: this case no longer exists
    } else {
      try {
        const raw = localStorage.getItem(draftKey)
        if (raw) setAnswers(JSON.parse(raw))
        else if (caseDef?.kind === "sample" && SAMPLE_ANSWERS[caseDef.id]) {
          // a sample case opens finished and ready to present; nothing is saved unless the student edits it
          setAnswers(SAMPLE_ANSWERS[caseDef.id])
          setMode("present")
        }
      } catch {}
      loadedRef.current = true
    }
  }, [initialId, sheet, sheetLoading, draftKey, caseDef])

  const setField = useCallback((id: string, v: any) => {
    dirtyRef.current = true
    setAnswers((a) => ({ ...a, [id]: v }))
  }, [])

  // Autosave: shortly after typing stops, when the page is left or hidden, and when the case is presented.
  const answersRef = useRef<Answers>({})
  answersRef.current = answers
  const chain = useRef<Promise<void>>(Promise.resolve())
  const [saveErr, setSaveErr] = useState("")
  const persist = useCallback(() => {
    chain.current = chain.current.then(async () => {
      if (!dirtyRef.current || !caseDef || !db || !user || !allowed) return
      if (!loadedRef.current) return // never save before the stored answers have loaded: it would overwrite them with a blank form
      const snapshot = answersRef.current
      dirtyRef.current = false
      setSaveState("saving")
      try {
        const id = await saveCaseSheet(db, user.uid, idRef.current, {
          caseType: caseDef.id, subject: caseDef.subject, title: sheetTitle(caseDef, snapshot), answers: snapshot,
        })
        if (!idRef.current) {
          idRef.current = id
          try { localStorage.removeItem(draftKey) } catch {}
          window.history.replaceState(null, "", `/case-presentation/${caseDef.id}/${id}`)
        }
        setSaveErr("")
        setSaveState(dirtyRef.current ? "saving" : "saved")
      } catch (e: any) {
        dirtyRef.current = true
        setSaveErr(String(e?.code || e?.message || "unknown error"))
        setSaveState("error")
      }
    })
  }, [caseDef, db, user, allowed, draftKey])

  useEffect(() => {
    if (!dirtyRef.current) return
    try { localStorage.setItem(draftKey, JSON.stringify(answers)) } catch {}
    setSaveState("saving")
    const t = setTimeout(persist, 600)
    return () => clearTimeout(t)
  }, [answers, draftKey, persist])

  // leaving the page: save what is pending right away
  useEffect(() => {
    const flush = () => persist()
    const vis = () => { if (document.visibilityState === "hidden") persist() }
    window.addEventListener("pagehide", flush)
    document.addEventListener("visibilitychange", vis)
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", vis); persist() }
  }, [persist])

  const content = useMemo(() => {
    if (!caseDef) return <div className="max-w-xl mx-auto p-10 text-center space-y-4"><p>That case type does not exist.</p><Link href="/case-presentation"><Button>Back to cases</Button></Link></div>
    if (accessLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    if (!user) return <div className="max-w-xl mx-auto p-10 text-center space-y-4"><p>Please sign in to use Case Presentation.</p><Button onClick={() => router.push("/login")}>Sign in</Button></div>
    if (!allowed) return <div className="max-w-xl mx-auto p-6 pt-12"><UpgradeGate type="content" title="Case Presentation is for subscribers" description="Subscribe to Scholar (₹999/year) to fill in case proformas and generate professional case presentations." /></div>
    if (initialId && (sheetLoading || (!loadedRef.current && !sheetError))) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    if (initialId && sheetError && !loadedRef.current) return <div className="max-w-xl mx-auto p-10 text-center space-y-4"><p>Could not load this case. Check your connection and try again. Your saved answers are untouched.</p><Button onClick={() => window.location.reload()}>Retry</Button></div>
    if (mode === "present") return <CasePresentation caseDef={caseDef} answers={answers} onBack={() => setMode("edit")} />
    return <CaseForm caseDef={caseDef} answers={answers} setField={setField} onPresent={() => { persist(); setMode("present") }} saveState={saveState} saveErr={saveErr} onRetry={persist} />
  }, [caseDef, accessLoading, user, allowed, initialId, sheetLoading, mode, answers, saveState, saveErr, persist, setField, router])

  return content
}
