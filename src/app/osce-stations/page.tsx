"use client"
import { useTopSearch } from "@/components/layout/top-search"

import { useState, useRef, useEffect } from "react"
import { useUser } from "@/firebase"
import {
  Loader2, Stethoscope, Clock, Globe, Trophy, Sparkles, VolumeX, SkipForward, BookOpen, CheckCircle2, Shuffle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VoiceOrTextInput, createSpeaker, stopSpeaking, type Speaker } from "@/components/osce/voice"
import { type OsceBrief, type VivaItem, type Gender, LANG_CODES, TOTAL_VIVA, roleOf, kindOf, localAnswer, looksLikeSkip } from "@/lib/osce/shared"
import { LIB_SEEDS, LIB_SUBJECTS } from "@/lib/osce/library"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"

type LogEntry = { speaker: "you" | "patient" | "examiner" | "system"; text: string }
type ChatMsg = { speaker: "you" | "examiner"; text: string }

type Assessment = {
  historyScore: number
  examinationScore: number
  diagnosisScore: number
  managementScore: number
  totalScore: number
  feedback: string
  actualDiagnosis: string
  actualDifferentials: string[]
  actualManagement: string
}

type VivaResult = { score: number; feedback: string }

type Phase =
  | "setup" | "generating" | "encounter" | "presentation" | "assessing"
  | "feedback" | "viva" | "viva-grading" | "done"


const LANGUAGES = [
  { label: "English", value: "English", speechLang: "en-IN" },
  { label: "Hindi", value: "Hindi", speechLang: "hi-IN" },
  { label: "Kannada", value: "Kannada", speechLang: "kn-IN" },
  { label: "Tamil", value: "Tamil", speechLang: "ta-IN" },
  { label: "Telugu", value: "Telugu", speechLang: "te-IN" },
  { label: "Malayalam", value: "Malayalam", speechLang: "ml-IN" },
  { label: "Marathi", value: "Marathi", speechLang: "mr-IN" },
  { label: "Bengali", value: "Bengali", speechLang: "bn-IN" },
]

const SPECIALTIES = [
  "Medicine", "Surgery", "Obstetrics & Gynecology", "Pediatrics",
  "Orthopedics", "ENT", "Ophthalmology", "Psychiatry",
]

const QUICK_ACTIONS = [
  "General physical examination",
  "Inspection",
  "Palpation",
  "Percussion",
  "Auscultation",
  "Relevant investigations",
]

function DoctorAvatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="flex items-center justify-center py-2">
      <div className={`relative h-20 w-20 rounded-full flex items-center justify-center bg-accent/10 border-2 transition-colors ${speaking ? "border-accent animate-pulse" : "border-white/10"}`}>
        <Stethoscope className={`h-9 w-9 transition-colors ${speaking ? "text-accent" : "text-muted-foreground"}`} />
        {speaking && <span className="absolute -bottom-0.5 h-1.5 w-7 rounded-full bg-accent/70 animate-pulse" />}
      </div>
    </div>
  )
}

export default function OsceStationsPage() {
  const { user } = useUser()
  const { canAccessContent, loading: planLoading } = usePlan()
  const { checkingAuth } = useRequireAuth()
  const [search] = useTopSearch("Search OSCE cases…")

  const [phase, setPhase] = useState<Phase>("setup")
  const [specialty, setSpecialty] = useState("")
  const [topic, setTopic] = useState("")
  const [language, setLanguage] = useState("English")
  const speechLang = LANGUAGES.find((l) => l.value === language)?.speechLang || "en-IN"
  const [speaking, setSpeaking] = useState(false)

  const [brief, setBrief] = useState<OsceBrief | null>(null)
  const speakerRef = useRef<Speaker | null>(null)
  const examinerGender = useRef<Gender>(Math.random() < 0.5 ? "male" : "female")
  const [handsFree, setHandsFree] = useState(false)
  const handsFreeRef = useRef(false)
  const [autoKey, setAutoKey] = useState(0)
  const [vivaPlan, setVivaPlan] = useState<VivaItem[] | undefined>(undefined)
  const [log, setLog] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)

  const [mode, setMode] = useState<"library" | "new">("library")
  const [libSubject, setLibSubject] = useState(LIB_SUBJECTS[0].key)
  const [ready, setReady] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [libBusy, setLibBusy] = useState<string | null>(null)
  const [libMsg, setLibMsg] = useState<string | null>(null)

  async function libCall(body: any) {
    const idToken = await user!.getIdToken()
    const res = await fetch("/api/osce-stations/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, ...body }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Library request failed")
    return data
  }
  useEffect(() => {
    if (!user) return
    libCall({ action: "list" }).then((d) => { setReady(d.ready || []); setIsAdmin(!!d.admin) }).catch(() => {})
  }, [user])

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageCredit, setImageCredit] = useState<string | null>(null)

  const [studentPresentation, setStudentPresentation] = useState("")
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)

  const [examinerChat, setExaminerChat] = useState<ChatMsg[]>([])
  const [examinerBusy, setExaminerBusy] = useState(false)

  const [vivaLog, setVivaLog] = useState<ChatMsg[]>([])
  const [vivaQuestionNumber, setVivaQuestionNumber] = useState(1)
  const [vivaBusy, setVivaBusy] = useState(false)
  const [vivaResult, setVivaResult] = useState<VivaResult | null>(null)

  const role = brief ? roleOf(brief) : null

  /** Starts a speaker with the right voice: the patient/informant in the chosen local language, the examiner in English. */
  function startSpeaker(who: "patient" | "examiner", then?: () => void): Speaker {
    const isPatient = who === "patient" && role
    const sp = createSpeaker({
      lang: isPatient ? speechLang : "en-IN",
      gender: isPatient ? role!.gender : examinerGender.current,
      variant: isPatient ? (brief?.patient?.name?.length || 0) : 0,
      getToken: () => user!.getIdToken(),
      onStart: () => setSpeaking(true),
      onEnd: () => { setSpeaking(false); then?.(); if (handsFreeRef.current) setAutoKey((k) => k + 1) },
    })
    speakerRef.current = sp
    return sp
  }
  function sayExaminer(text: string) { const sp = startSpeaker("examiner"); sp.push(text); sp.end() }
  function silence() { stopSpeaking(); setSpeaking(false) }

  function appendLog(entry: LogEntry) {
    setLog((l) => [...l, entry])
  }

  function buildTranscript(entries: LogEntry[]): string {
    return entries
      .filter((e) => e.speaker !== "system")
      .map((e) => `${e.speaker === "you" ? "Student" : "Patient"}: ${e.text}`)
      .join("\n")
  }

  function buildChatTranscript(entries: ChatMsg[]): string {
    return entries.map((e) => `${e.speaker === "you" ? "Student" : "Examiner"}: ${e.text}`).join("\n")
  }

  async function fetchImage(query: string) {
    try {
      const res = await fetch(`/api/topic-image?topic=${encodeURIComponent(query)}&subject=${encodeURIComponent(specialty)}`)
      const data = await res.json()
      if (data.url) { setImageUrl(data.url); setImageCredit(data.photographer || null) }
    } catch {}
  }

  function resetToSetup() {
    silence()
    setVivaPlan(undefined)
    setPhase("setup")
    setBrief(null)
    setLog([])
    setAssessment(null)
    setExaminerChat([])
    setVivaLog([])
    setVivaResult(null)
    setStudentPresentation("")
    setImageUrl(null)
    setImageCredit(null)
    setSpeaking(false)
  }

  async function startCase() {
    if (!user || !specialty.trim() || !topic.trim()) return
    setSetupError(null)
    setPhase("generating")
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/osce-stations/start-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, specialty: specialty.trim(), topic: topic.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.brief) throw new Error(data.error || "Could not generate a case")
      setBrief(data.brief)
      setLog([{ speaker: "system", text: "You are in the examination room. Begin by introducing yourself, then take a full history and examination." }])
      setImageUrl(null)
      setImageCredit(null)
      setStudentPresentation("")
      setAssessment(null)
      setExaminerChat([])
      setVivaLog([])
      setVivaResult(null)
      setPhase("encounter")
      fetchImage(data.brief.imageSearchQuery || topic.trim())
    } catch (e: any) {
      setSetupError(e.message || "Could not generate a case - please try again.")
      setPhase("setup")
    }
  }

  function enterCase(b: OsceBrief, spec: string, top: string) {
    setSpecialty(spec)
    setTopic(top)
    setBrief(b)
    setLog([{ speaker: "system", text: "You are in the examination room. Begin by introducing yourself, then take a full history and examination." }])
    setImageUrl(null)
    setImageCredit(null)
    setStudentPresentation("")
    setAssessment(null)
    setExaminerChat([])
    setVivaLog([])
    setVivaResult(null)
    setVivaPlan(b.viva)
    setPhase("encounter")
    fetch(`/api/topic-image?topic=${encodeURIComponent(b.imageSearchQuery || b.topic)}&subject=${encodeURIComponent(spec)}`)
      .then((r) => r.json()).then((d) => { if (d.url) { setImageUrl(d.url); setImageCredit(d.photographer || null) } }).catch(() => {})
  }

  async function startLibrary(id: string, hideTopic = false) {
    if (!user || libBusy) return
    const seed = LIB_SEEDS.find((s) => s.id === id)
    if (!seed) return
    setSetupError(null)
    setLibBusy(id)
    try {
      const d = await libCall({ action: "get", id })
      setReady((r) => (r.includes(id) ? r : [...r, id]))
      enterCase(d.brief, seed.label, hideTopic ? "Diagnosis not shown" : seed.topic)
    } catch (e: any) {
      setSetupError(e.message || "Could not open this case - please try again.")
    } finally {
      setLibBusy(null)
    }
  }

  function surprise() {
    const pool = LIB_SEEDS.filter((s) => s.subject === libSubject)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (pick) startLibrary(pick.id, true)
  }

  async function seedAll() {
    setLibMsg("Preparing cases...")
    try {
      for (let i = 0; i < 40; i++) {
        const d = await libCall({ action: "seed", limit: 4 })
        setReady(d.ready || [])
        setLibMsg(`${(d.ready || []).length} of ${LIB_SEEDS.length} ready${d.failed ? `, ${d.failed} failed in the last round` : ""}`)
        if (!d.remaining || !d.made) break
      }
    } catch (e: any) {
      setLibMsg(e.message || "Stopped")
    }
  }

  function historyFor(entries: LogEntry[]): string {
    return entries.filter((e) => e.speaker !== "system").slice(-6)
      .map((e) => `${e.speaker === "you" ? "Student" : e.speaker === "examiner" ? "Examiner" : "Patient"}: ${e.text}`).join("\n")
  }

  async function handleUtterance(utterance: string) {
    if (!brief || !user || !utterance.trim() || busy) return
    silence()
    const history = historyFor(log)
    appendLog({ speaker: "you", text: utterance })

    // standard examination requests are answered instantly, with no waiting
    if (kindOf(utterance) !== "history") {
      const local = localAnswer(brief, utterance)
      if (local) { appendLog({ speaker: "examiner", text: local }); const sp = startSpeaker("examiner"); sp.push(local); sp.end(); return }
    }

    setBusy(true)
    let sp: Speaker | null = null
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/osce-stations/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, history, utterance, language }),
      })
      if (!res.ok || !res.body) throw new Error("No response")
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; let got = false
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        let i: number
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
          if (!line) continue
          const ev = JSON.parse(line)
          if (ev.t === "meta") { appendLog({ speaker: ev.role, text: "" }); sp = startSpeaker(ev.role) }
          else if (ev.t === "d") {
            got = true
            setLog((l) => { const c = [...l]; const k = c.length - 1; c[k] = { ...c[k], text: c[k].text + ev.x }; return c })
            sp?.push(ev.x)
          } else if (ev.t === "err") throw new Error(ev.x)
          else if (ev.t === "end") sp?.end()
        }
      }
      if (!got) throw new Error("Empty")
    } catch {
      sp?.stop()
      appendLog({ speaker: "system", text: "Could not get a response - please try again." })
    } finally {
      setBusy(false)
    }
  }

  async function handleFinish() {
    if (!brief || !user) return
    setPhase("assessing")
    try {
      const idToken = await user.getIdToken()
      const transcript = buildTranscript(log)
      const res = await fetch("/api/osce-stations/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, transcript, studentPresentation, language: "English" }),
      })
      const data = await res.json()
      if (!res.ok || !data.assessment) throw new Error(data.error || "Assessment failed")
      setAssessment(data.assessment)
      setExaminerChat([{ speaker: "examiner", text: data.assessment.feedback }])
      setPhase("feedback")
      sayExaminer(data.assessment.feedback)
    } catch (e: any) {
      alert(e.message || "Could not generate the assessment - please try again.")
      setPhase("presentation")
    }
  }

  async function handleExaminerMessage(message: string) {
    if (!brief || !user || !assessment || examinerBusy) return
    const chatTranscript = buildChatTranscript(examinerChat)
    setExaminerChat((c) => [...c, { speaker: "you", text: message }])
    setExaminerBusy(true)
    try {
      const idToken = await user.getIdToken()
      const caseTranscript = buildTranscript(log)
      const res = await fetch("/api/osce-stations/examiner-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, caseTranscript, studentPresentation, assessmentFeedback: assessment.feedback, chatTranscript, studentMessage: message, language: "English" }),
      })
      const data = await res.json()
      if (!res.ok || !data.reply) throw new Error(data.error || "No response")
      setExaminerChat((c) => [...c, { speaker: "examiner", text: data.reply }])
      sayExaminer(data.reply)
    } catch {
      setExaminerChat((c) => [...c, { speaker: "examiner", text: "Sorry, I couldn't respond just now - try again." }])
    } finally {
      setExaminerBusy(false)
    }
  }

  async function startViva() {
    if (!brief || !user) return
    silence()
    setVivaLog([])
    setVivaQuestionNumber(1)
    setVivaResult(null)
    setVivaPlan(undefined)
    setPhase("viva")
    setVivaBusy(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/osce-stations/viva-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, questionNumber: 1, studentAnswer: "" }),
      })
      const data = await res.json()
      if (!res.ok || !data.message) throw new Error(data.error || "Could not start viva")
      setVivaPlan(data.plan)
      setVivaLog([{ speaker: "examiner", text: data.message }])
      sayExaminer(data.message)
    } catch (e: any) {
      alert(e.message || "Could not start the viva - please try again.")
      setPhase("feedback")
    } finally {
      setVivaBusy(false)
    }
  }

  async function finishViva(finalLog: ChatMsg[]) {
    if (!brief || !user) return
    setPhase("viva-grading")
    try {
      const idToken = await user.getIdToken()
      const vivaTranscript = buildChatTranscript(finalLog)
      const res = await fetch("/api/osce-stations/viva-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, vivaTranscript, language }),
      })
      const data = await res.json()
      if (!res.ok || !data.assessment) throw new Error(data.error || "Could not grade viva")
      setVivaResult(data.assessment)
      setPhase("done")
    } catch (e: any) {
      alert(e.message || "Could not grade the viva.")
      setPhase("feedback")
    }
  }

  async function handleVivaAnswer(answer: string) {
    if (!brief || !user || vivaBusy) return
    silence()
    const thisQuestionNumber = vivaQuestionNumber
    const logWithAnswer = [...vivaLog, { speaker: "you" as const, text: answer }]
    setVivaLog(logWithAnswer)
    setVivaBusy(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/osce-stations/viva-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, plan: vivaPlan, studentAnswer: answer, questionNumber: thisQuestionNumber }),
      })
      const data = await res.json()
      if (!res.ok || !data.message) throw new Error(data.error || "No response")
      if (data.plan) setVivaPlan(data.plan)
      const logWithReply = [...logWithAnswer, { speaker: "examiner" as const, text: data.message }]
      setVivaLog(logWithReply)
      sayExaminer(data.message)
      if (thisQuestionNumber >= TOTAL_VIVA) {
        setVivaBusy(false)
        finishViva(logWithReply)
        return
      }
      setVivaQuestionNumber((n) => n + 1)
    } catch {
      setVivaLog((l) => [...l, { speaker: "examiner", text: "Sorry, I lost the connection for a moment. Please say your answer again, or tap Skip." }])
    } finally {
      setVivaBusy(false)
    }
  }

  if (checkingAuth || planLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  }

  if (!canAccessContent) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12">
        <UpgradeGate type="content" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Stethoscope className="h-7 w-7 text-accent" /> OSCE Stations
        </h1>
        <p className="text-muted-foreground text-sm">A fresh AI-generated patient every time - take the history, examine, present your diagnosis, and get examiner feedback out loud.</p>
      </div>

      {phase === "setup" && (
        <div className="flex gap-2">
          <Button size="sm" variant={mode === "library" ? "default" : "outline"} onClick={() => setMode("library")} className="rounded-full flex-1 gap-1">
            <BookOpen className="h-4 w-4" /> Library cases ({LIB_SEEDS.length})
          </Button>
          <Button size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")} className="rounded-full flex-1 gap-1">
            <Sparkles className="h-4 w-4" /> Generate new
          </Button>
        </div>
      )}

      {phase === "setup" && mode === "library" && (
        <Card className="glass border-none">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Subject</p>
              <div className="flex flex-wrap gap-2">
                {LIB_SUBJECTS.map((s) => (
                  <Button key={s.key} size="sm" variant={libSubject === s.key ? "default" : "outline"} onClick={() => setLibSubject(s.key)} className="rounded-full">
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1"><Globe className="h-3 w-3" /> Language</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Button key={l.value} size="sm" variant={language === l.value ? "default" : "outline"} onClick={() => setLanguage(l.value)} className="rounded-full">
                    {l.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={surprise} disabled={!!libBusy} className="w-full gap-2">
              <Shuffle className="h-4 w-4" /> Surprise me (diagnosis hidden)
            </Button>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Or pick a case</p>
              {LIB_SEEDS.filter((s) => (search.trim() ? s.topic.toLowerCase().includes(search.trim().toLowerCase()) : s.subject === libSubject)).map((s) => (
                <button key={s.id} disabled={!!libBusy} onClick={() => startLibrary(s.id)}
                  className="w-full flex items-center justify-between gap-2 text-left text-sm rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5 disabled:opacity-60">
                  <span>{s.topic}</span>
                  {libBusy === s.id ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : ready.includes(s.id) ? <CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> : <span className="text-[10px] text-muted-foreground shrink-0">prepared on first use</span>}
                </button>
              ))}
            </div>

            {libBusy && <p className="text-xs text-muted-foreground">Preparing this case - the first time can take up to a minute, afterwards it opens instantly.</p>}
            {setupError && <p className="text-sm text-red-400">{setupError}</p>}

            {isAdmin && (
              <div className="space-y-1 pt-2 border-t border-white/10">
                <Button size="sm" variant="outline" onClick={seedAll} disabled={!!libMsg && libMsg.startsWith("Preparing")}>Admin: prepare all library cases</Button>
                {libMsg && <p className="text-xs text-muted-foreground">{libMsg}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {phase === "setup" && mode === "new" && (
        <Card className="glass border-none">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Specialty</p>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <Button key={s} size="sm" variant={specialty === s ? "default" : "outline"} onClick={() => setSpecialty(s)} className="rounded-full">
                    {s}
                  </Button>
                ))}
              </div>
              <Input placeholder="Or type a specialty..." value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Topic / Condition</p>
              <Input placeholder="e.g. Acute appendicitis, Rheumatic heart disease, Placenta previa" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1"><Globe className="h-3 w-3" /> Language</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Button key={l.value} size="sm" variant={language === l.value ? "default" : "outline"} onClick={() => setLanguage(l.value)} className="rounded-full">
                    {l.label}
                  </Button>
                ))}
              </div>
            </div>

            {setupError && <p className="text-sm text-red-400">{setupError}</p>}

            <Button onClick={startCase} disabled={!specialty.trim() || !topic.trim()} className="w-full gap-2">
              <Sparkles className="h-4 w-4" /> Generate Case
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "generating" && (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm">Generating your patient...</p>
        </div>
      )}

      {phase === "encounter" && brief && (
        <div className="space-y-4">
          {imageUrl && (
            <Card className="glass border-none overflow-hidden">
              <img src={imageUrl} alt="Clinical reference" className="w-full h-44 object-cover" />
              {imageCredit && <p className="text-[10px] text-muted-foreground px-3 py-1">Photo by {imageCredit} on Pexels</p>}
            </Card>
          )}

          <Card className="glass border-none">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                <Clock className="h-3 w-3" /> {specialty} - {topic}
              </p>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {log.map((entry, i) => (
                  <div key={i} className={`text-sm ${entry.speaker === "you" ? "text-accent" : entry.speaker === "system" ? "text-muted-foreground italic" : ""}`}>
                    <span className="font-bold">{entry.speaker === "you" ? "You: " : entry.speaker === "patient" ? `${role?.relation || "Patient"}: ` : entry.speaker === "examiner" ? "Examiner: " : ""}</span>
                    {entry.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {role && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{speaking ? "Speaking..." : `Answering: ${role.label}`} - {language}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={handsFree} onChange={(e) => { setHandsFree(e.target.checked); handsFreeRef.current = e.target.checked }} /> Hands-free
                </label>
                {speaking && <button className="flex items-center gap-1 text-accent" onClick={silence}><VolumeX className="h-3 w-3" /> Stop voice</button>}
              </div>
            </div>
          )}
          <VoiceOrTextInput onSubmit={handleUtterance} disabled={busy} lang={speechLang} autoStartKey={autoKey} placeholder="Ask the patient, or type your question..." />

          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Button key={a} size="sm" variant="outline" disabled={busy} onClick={() => handleUtterance(a)} className="rounded-full">
                {a}
              </Button>
            ))}
          </div>

          <Button onClick={() => setPhase("presentation")} className="w-full" disabled={busy}>
            Finish History & Examination
          </Button>
        </div>
      )}

      {phase === "presentation" && (
        <Card className="glass border-none">
          <CardContent className="p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Present Your Case</p>
            <p className="text-sm text-muted-foreground">State your provisional diagnosis, differential diagnoses, and management plan - speak or type it below.</p>
            <textarea
              className="w-full min-h-[160px] rounded-xl glass border border-white/10 p-3 text-sm bg-transparent"
              placeholder="e.g. My provisional diagnosis is... The differentials are... I would manage this by..."
              value={studentPresentation}
              onChange={(e) => setStudentPresentation(e.target.value)}
            />
            <VoiceOrTextInput
              onSubmit={(t) => setStudentPresentation((p) => (p ? p + " " + t : t))}
              lang="en-IN"
              placeholder="Add more by voice or text..."
            />
            <Button onClick={handleFinish} disabled={!studentPresentation.trim()} className="w-full">
              Submit for Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "assessing" && (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm">The examiner is reviewing your case...</p>
        </div>
      )}

      {phase === "feedback" && assessment && (
        <div className="space-y-4">
          <DoctorAvatar speaking={speaking} />

          <Card className="glass border-none">
            <CardContent className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {examinerChat.map((m, i) => (
                <div key={i} className={`text-sm ${m.speaker === "you" ? "text-accent" : ""}`}>
                  <span className="font-bold">{m.speaker === "you" ? "You: " : "Examiner: "}</span>{m.text}
                </div>
              ))}
            </CardContent>
          </Card>

          <VoiceOrTextInput onSubmit={handleExaminerMessage} disabled={examinerBusy} lang="en-IN" placeholder="Ask the examiner a question..." />

          <Card className="glass border-none">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Scores</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>History: <span className="font-bold">{assessment.historyScore}/25</span></p>
                <p>Examination: <span className="font-bold">{assessment.examinationScore}/25</span></p>
                <p>Diagnosis: <span className="font-bold">{assessment.diagnosisScore}/25</span></p>
                <p>Management: <span className="font-bold">{assessment.managementScore}/25</span></p>
              </div>
              <p className="font-bold pt-1">Total: {assessment.totalScore}/100</p>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Actual Diagnosis</p>
              <p className="font-medium">{assessment.actualDiagnosis}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">Differentials</p>
              <ul className="list-disc list-inside text-sm">
                {assessment.actualDifferentials.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">Management</p>
              <p className="text-sm">{assessment.actualManagement}</p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={startViva} className="flex-1 gap-2"><Trophy className="h-4 w-4" /> Take Viva</Button>
            <Button variant="outline" onClick={resetToSetup} className="flex-1">Start Another Case</Button>
          </div>
        </div>
      )}

      {phase === "viva" && (
        <div className="space-y-4">
          <DoctorAvatar speaking={speaking} />
          <Card className="glass border-none">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Viva - Question {Math.min(vivaQuestionNumber, TOTAL_VIVA)} of {TOTAL_VIVA}
              </p>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {vivaLog.map((m, i) => (
                  <div key={i} className={`text-sm ${m.speaker === "you" ? "text-accent" : ""}`}>
                    <span className="font-bold">{m.speaker === "you" ? "You: " : "Examiner: "}</span>{m.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <VoiceOrTextInput
            onSubmit={handleVivaAnswer}
            disabled={vivaBusy}
            lang="en-IN"
            placeholder="Answer the examiner..."
            extra={
              <Button variant="outline" disabled={vivaBusy} onClick={() => handleVivaAnswer("I don't know")} className="w-full gap-2">
                <SkipForward className="h-4 w-4" /> I don't know - next question
              </Button>
            }
          />
        </div>
      )}

      {phase === "viva-grading" && (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm">Grading your viva...</p>
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-4">
          {vivaResult && (
            <Card className="glass border-none">
              <CardContent className="p-6 space-y-2 text-center">
                <Trophy className="h-8 w-8 text-primary mx-auto" />
                <p className="text-2xl font-bold">{vivaResult.score}<span className="text-base text-muted-foreground">/20 viva</span></p>
                <p className="text-sm text-muted-foreground text-left">{vivaResult.feedback}</p>
              </CardContent>
            </Card>
          )}
          <Button onClick={resetToSetup} className="w-full">Start Another Case</Button>
        </div>
      )}
    </div>
  )
}
