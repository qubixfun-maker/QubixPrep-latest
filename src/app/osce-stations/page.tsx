"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useUser } from "@/firebase"
import {
  Loader2, Stethoscope, Mic, Square, Clock, Globe, Trophy, Sparkles
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import type { CaseBrief } from "@/ai/osce-live-case"

type LogEntry = { speaker: "you" | "patient" | "system"; text: string }
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

const TOTAL_VIVA_QUESTIONS = 4

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

function speak(text: string, lang: string, onEnd?: () => void) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) { onEnd?.(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 1
    const voices = window.speechSynthesis.getVoices()
    const match = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith(lang.split("-")[0]))
    if (match) u.voice = match
    u.onend = () => onEnd?.()
    u.onerror = () => onEnd?.()
    window.speechSynthesis.speak(u)
  } catch { onEnd?.() }
}

function useSpeechRecognition(onResult: (transcript: string) => void, lang: string) {
  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const Ctor = (typeof window !== "undefined") && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!Ctor) { setSupported(false); return }
    const recog = new Ctor()
    recog.lang = lang
    recog.continuous = false
    recog.interimResults = false
    recog.maxAlternatives = 1
    recog.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript || ""
      if (transcript.trim()) onResult(transcript.trim())
    }
    recog.onend = () => setListening(false)
    recog.onerror = () => setListening(false)
    recognitionRef.current = recog
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    try { recognitionRef.current.start(); setListening(true) } catch {}
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    try { recognitionRef.current.stop() } catch {}
  }, [])

  return { start, stop, listening, supported }
}

function VoiceOrTextInput({ onSubmit, disabled, lang, placeholder }: {
  onSubmit: (text: string) => void; disabled?: boolean; lang: string; placeholder?: string
}) {
  const [typed, setTyped] = useState("")
  const { start, stop, listening, supported } = useSpeechRecognition((t) => onSubmit(t), lang)

  return (
    <div className="space-y-2">
      {supported && (
        <Button
          disabled={disabled}
          onClick={() => (listening ? stop() : start())}
          className={`w-full gap-2 ${listening ? "bg-red-500 hover:bg-red-600" : ""}`}
        >
          {listening ? <><Square className="h-4 w-4" /> Listening... tap to stop</> : <><Mic className="h-4 w-4" /> Tap to speak</>}
        </Button>
      )}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder || "Or type here..."}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) { onSubmit(typed.trim()); setTyped("") } }}
        />
        <Button disabled={disabled || !typed.trim()} onClick={() => { onSubmit(typed.trim()); setTyped("") }}>Send</Button>
      </div>
    </div>
  )
}

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

  const [phase, setPhase] = useState<Phase>("setup")
  const [specialty, setSpecialty] = useState("")
  const [topic, setTopic] = useState("")
  const [language, setLanguage] = useState("English")
  const speechLang = LANGUAGES.find((l) => l.value === language)?.speechLang || "en-IN"
  const [speaking, setSpeaking] = useState(false)

  const [brief, setBrief] = useState<CaseBrief | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)

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
    try { window.speechSynthesis?.cancel() } catch {}
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

  async function handleUtterance(utterance: string) {
    if (!brief || !user || !utterance.trim() || busy) return
    const transcript = buildTranscript(log)
    appendLog({ speaker: "you", text: utterance })
    setBusy(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/osce-stations/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, transcript, utterance, language }),
      })
      const data = await res.json()
      if (!res.ok || !data.reply) throw new Error(data.error || "No response")
      appendLog({ speaker: "patient", text: data.reply })
      speak(data.reply, speechLang)
    } catch {
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
      setSpeaking(true)
      speak(data.assessment.feedback, "en-IN", () => setSpeaking(false))
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
      setSpeaking(true)
      speak(data.reply, "en-IN", () => setSpeaking(false))
    } catch {
      setExaminerChat((c) => [...c, { speaker: "examiner", text: "Sorry, I couldn't respond just now - try again." }])
    } finally {
      setExaminerBusy(false)
    }
  }

  async function startViva() {
    if (!brief || !user) return
    setVivaLog([])
    setVivaQuestionNumber(1)
    setVivaResult(null)
    setPhase("viva")
    setVivaBusy(true)
    try {
      const idToken = await user.getIdToken()
      const caseTranscript = buildTranscript(log)
      const res = await fetch("/api/osce-stations/viva-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, caseTranscript, studentPresentation, vivaTranscript: "", studentAnswer: "", questionNumber: 1, language: "English" }),
      })
      const data = await res.json()
      if (!res.ok || !data.message) throw new Error(data.error || "Could not start viva")
      setVivaLog([{ speaker: "examiner", text: data.message }])
      setSpeaking(true)
      speak(data.message, "en-IN", () => setSpeaking(false))
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
    const vivaTranscript = buildChatTranscript(vivaLog)
    const thisQuestionNumber = vivaQuestionNumber
    const logWithAnswer = [...vivaLog, { speaker: "you" as const, text: answer }]
    setVivaLog(logWithAnswer)
    setVivaBusy(true)
    try {
      const idToken = await user.getIdToken()
      const caseTranscript = buildTranscript(log)
      const res = await fetch("/api/osce-stations/viva-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, brief, caseTranscript, studentPresentation, vivaTranscript, studentAnswer: answer, questionNumber: thisQuestionNumber, language: "English" }),
      })
      const data = await res.json()
      if (!res.ok || !data.message) throw new Error(data.error || "No response")
      const logWithReply = [...logWithAnswer, { speaker: "examiner" as const, text: data.message }]
      setVivaLog(logWithReply)
      setSpeaking(true)
      speak(data.message, "en-IN", () => setSpeaking(false))
      if (thisQuestionNumber >= TOTAL_VIVA_QUESTIONS) {
        setVivaBusy(false)
        finishViva(logWithReply)
        return
      }
      setVivaQuestionNumber((n) => n + 1)
    } catch {
      setVivaLog((l) => [...l, { speaker: "examiner", text: "Sorry, something went wrong - let's end here." }])
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
                    <span className="font-bold">{entry.speaker === "you" ? "You: " : entry.speaker === "patient" ? "Patient: " : ""}</span>
                    {entry.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <VoiceOrTextInput onSubmit={handleUtterance} disabled={busy} lang={speechLang} placeholder="Ask the patient, or type your question..." />

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
                Viva - Question {Math.min(vivaQuestionNumber, TOTAL_VIVA_QUESTIONS)} of {TOTAL_VIVA_QUESTIONS}
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
          <VoiceOrTextInput onSubmit={handleVivaAnswer} disabled={vivaBusy} lang="en-IN" placeholder="Answer the examiner..." />
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
