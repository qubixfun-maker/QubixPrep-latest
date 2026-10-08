"use client"

import { useMemo, use, useState, useRef, useEffect, useCallback } from "react"
import { useDoc, useFirestore, useUser } from "@/firebase"
import { doc } from "firebase/firestore"
import {
  ChevronLeft, Loader2, Mic, Square, Clock, Stethoscope, FlaskConical,
  Activity, MessageSquare, CheckCircle2, XCircle, Trophy
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"

type HistoryQA = { triggerQuestion: string; answer: string }
type ExamFinding = { system: string; findings: string }
type Investigation = { name: string; result: string }
type ExaminerQuestion = { question: string; markingPoints: string[]; modelAnswer: string; timeSeconds: number }

type OsceStation = {
  title: string
  specialty: string
  difficulty: string
  candidateStem: string
  patient: { name: string; age: number; gender: string; chiefComplaint: string }
  readingTimeSeconds: number
  consultationTimeSeconds: number
  vitals: { temp: string; hr: string; bp: string; rr: string; spo2: string }
  historyQABank: HistoryQA[]
  examinationFindings: ExamFinding[]
  investigations: Investigation[]
  examinerQuestions: ExaminerQuestion[]
  provisionalDiagnosis: string
  differentials: string[]
}

type LogEntry = { speaker: "you" | "patient" | "examiner" | "system"; text: string }
type QuestionResult = { score: number; pointsHit: string[]; feedback: string }

type Phase = "stem" | "consultation" | "examiner" | "results"

function useCountdown(active: boolean, seconds: number, onZero: () => void) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => { setLeft(seconds) }, [seconds])
  useEffect(() => {
    if (!active) return
    if (left <= 0) { onZero(); return }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, left])
  return left
}

function formatTime(s: number): string {
  const m = Math.floor(Math.max(0, s) / 60)
  const sec = Math.max(0, s) % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

function speak(text: string) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1
    window.speechSynthesis.speak(u)
  } catch {}
}

function useSpeechRecognition(onResult: (transcript: string) => void) {
  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const Ctor = (typeof window !== "undefined") && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!Ctor) { setSupported(false); return }
    const recog = new Ctor()
    recog.lang = "en-IN"
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
  }, [])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {}
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    try { recognitionRef.current.stop() } catch {}
  }, [])

  return { start, stop, listening, supported }
}

function MicInput({ onTranscript, disabled }: { onTranscript: (text: string) => void; disabled?: boolean }) {
  const [typed, setTyped] = useState("")
  const { start, stop, listening, supported } = useSpeechRecognition((t) => onTranscript(t))

  if (!supported) {
    return (
      <div className="flex gap-2">
        <Input
          placeholder="Type your question or answer..."
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) { onTranscript(typed.trim()); setTyped("") } }}
        />
        <Button disabled={disabled || !typed.trim()} onClick={() => { onTranscript(typed.trim()); setTyped("") }}>Send</Button>
      </div>
    )
  }

  return (
    <Button
      disabled={disabled}
      onClick={() => (listening ? stop() : start())}
      className={`w-full gap-2 ${listening ? "bg-red-500 hover:bg-red-600" : ""}`}
    >
      {listening ? <><Square className="h-4 w-4" /> Listening... tap to stop</> : <><Mic className="h-4 w-4" /> Tap to speak</>}
    </Button>
  )
}

export default function OsceStationPlayerPage({ params }: { params: Promise<{ stationId: string }> }) {
  const { stationId } = use(params)
  const db = useFirestore()
  const { user } = useUser()
  const { canAccessContent, loading: planLoading } = usePlan()

  const stationRef = useMemo(() => (!db ? null : doc(db, "osceStations", stationId)), [db, stationId])
  const { data: stationData, loading } = useDoc(stationRef)
  const station = stationData as OsceStation | undefined

  const [phase, setPhase] = useState<Phase>("stem")
  const [log, setLog] = useState<LogEntry[]>([])
  const [matching, setMatching] = useState(false)

  const [questionIndex, setQuestionIndex] = useState(0)
  const [grading, setGrading] = useState(false)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [currentFeedback, setCurrentFeedback] = useState<QuestionResult | null>(null)

  function appendLog(entry: LogEntry) {
    setLog((l) => [...l, entry])
  }

  // --- Phase: stem / reading time ---
  const readingLeft = useCountdown(phase === "stem", station?.readingTimeSeconds || 90, () => setPhase("consultation"))

  // --- Phase: consultation ---
  const consultLeft = useCountdown(phase === "consultation", station?.consultationTimeSeconds || 360, () => setPhase("examiner"))

  async function handleHistoryQuestion(transcript: string) {
    if (!station || !user) return
    appendLog({ speaker: "you", text: transcript })
    setMatching(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/osce-stations/match-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, stationId, transcript }),
      })
      const data = await res.json()
      if (data.matched) {
        appendLog({ speaker: "patient", text: data.answer })
        speak(data.answer)
      } else {
        const msg = "The patient doesn't understand that, or that's not something they can answer - try examining or ordering an investigation instead."
        appendLog({ speaker: "system", text: msg })
      }
    } catch {
      appendLog({ speaker: "system", text: "Something went wrong matching that question - try again." })
    } finally {
      setMatching(false)
    }
  }

  function requestVitals() {
    if (!station) return
    const v = station.vitals
    const text = `Temp ${v.temp}, HR ${v.hr}, BP ${v.bp}, RR ${v.rr}, SpO2 ${v.spo2}`
    appendLog({ speaker: "you", text: "Requesting vitals" })
    appendLog({ speaker: "patient", text })
    speak(text)
  }

  function requestExam(finding: ExamFinding) {
    appendLog({ speaker: "you", text: `Examining: ${finding.system}` })
    appendLog({ speaker: "patient", text: finding.findings })
    speak(finding.findings)
  }

  function requestInvestigation(inv: Investigation) {
    appendLog({ speaker: "you", text: `Requesting: ${inv.name}` })
    appendLog({ speaker: "patient", text: inv.result })
    speak(inv.result)
  }

  // --- Phase: examiner ---
  const currentQuestion = station?.examinerQuestions?.[questionIndex]
  const questionLeft = useCountdown(phase === "examiner" && !currentFeedback, currentQuestion?.timeSeconds || 60, () => {})

  useEffect(() => {
    if (phase === "examiner" && currentQuestion && !currentFeedback) {
      speak(currentQuestion.question)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, questionIndex])

  async function handleExaminerAnswer(transcript: string) {
    if (!currentQuestion || !user) return
    setGrading(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/osce-stations/grade-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, question: currentQuestion.question, markingPoints: currentQuestion.markingPoints, transcript }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Grading failed")
      const result: QuestionResult = { score: data.score, pointsHit: data.pointsHit, feedback: data.feedback }
      setCurrentFeedback(result)
      setResults((r) => [...r, result])
    } catch {
      const fallback: QuestionResult = { score: 0, pointsHit: [], feedback: "Could not grade this answer - counted as 0." }
      setCurrentFeedback(fallback)
      setResults((r) => [...r, fallback])
    } finally {
      setGrading(false)
    }
  }

  function nextQuestion() {
    setCurrentFeedback(null)
    if (!station) return
    if (questionIndex + 1 >= station.examinerQuestions.length) {
      setPhase("results")
    } else {
      setQuestionIndex((i) => i + 1)
    }
  }

  if (loading || planLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  }
  if (!station) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Station not found.</div>
  }
  if (!canAccessContent) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12">
        <UpgradeGate type="content" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6">
      <Link href="/osce-stations" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 w-fit hover:underline">
        <ChevronLeft className="h-3 w-3" /> Back to Stations
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{station.title}</h1>
        {phase !== "results" && (
          <span className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
            <Clock className="h-4 w-4" />
            {phase === "stem" && formatTime(readingLeft)}
            {phase === "consultation" && formatTime(consultLeft)}
            {phase === "examiner" && !currentFeedback && formatTime(questionLeft)}
          </span>
        )}
      </div>

      {phase === "stem" && (
        <Card className="glass border-none">
          <CardContent className="p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Reading Time</p>
            <p className="leading-relaxed">{station.candidateStem}</p>
            <Button onClick={() => setPhase("consultation")} className="w-full">Start Consultation</Button>
          </CardContent>
        </Card>
      )}

      {phase === "consultation" && (
        <div className="space-y-4">
          <Card className="glass border-none">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                {station.patient.name}, {station.patient.age} {station.patient.gender} - {station.patient.chiefComplaint}
              </p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {log.length === 0 && <p className="text-sm text-muted-foreground">Ask the patient a history question, or request vitals/examination/investigations below.</p>}
                {log.map((entry, i) => (
                  <div key={i} className={`text-sm ${entry.speaker === "you" ? "text-accent" : entry.speaker === "system" ? "text-muted-foreground italic" : ""}`}>
                    <span className="font-bold">{entry.speaker === "you" ? "You: " : entry.speaker === "patient" ? "Patient: " : ""}</span>
                    {entry.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <MicInput onTranscript={handleHistoryQuestion} disabled={matching} />

          <div className="space-y-2">
            <Button variant="outline" onClick={requestVitals} className="w-full gap-2 justify-start">
              <Activity className="h-4 w-4" /> Request Vitals
            </Button>
            {station.examinationFindings.map((f, i) => (
              <Button key={i} variant="outline" onClick={() => requestExam(f)} className="w-full gap-2 justify-start">
                <Stethoscope className="h-4 w-4" /> Examine: {f.system}
              </Button>
            ))}
            {station.investigations.map((inv, i) => (
              <Button key={i} variant="outline" onClick={() => requestInvestigation(inv)} className="w-full gap-2 justify-start">
                <FlaskConical className="h-4 w-4" /> Request: {inv.name}
              </Button>
            ))}
          </div>

          <Button onClick={() => setPhase("examiner")} className="w-full">Finish Consultation</Button>
        </div>
      )}

      {phase === "examiner" && currentQuestion && (
        <Card className="glass border-none">
          <CardContent className="p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Examiner Question {questionIndex + 1} / {station.examinerQuestions.length}
            </p>
            <p className="font-medium flex items-start gap-2"><MessageSquare className="h-4 w-4 mt-1 shrink-0" />{currentQuestion.question}</p>

            {!currentFeedback ? (
              <MicInput onTranscript={handleExaminerAnswer} disabled={grading} />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-bold">{currentFeedback.score}/100</span>
                </div>
                <p className="text-sm text-muted-foreground">{currentFeedback.feedback}</p>
                {currentFeedback.pointsHit.length > 0 && (
                  <div className="space-y-1">
                    {currentFeedback.pointsHit.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-green-400">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> {p}
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={nextQuestion} className="w-full">
                  {questionIndex + 1 >= station.examinerQuestions.length ? "See Results" : "Next Question"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {phase === "results" && (
        <div className="space-y-6">
          <Card className="glass border-none">
            <CardContent className="p-6 space-y-4 text-center">
              <Trophy className="h-10 w-10 text-primary mx-auto" />
              <p className="text-3xl font-bold">
                {results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0}
                <span className="text-lg text-muted-foreground">/100</span>
              </p>
              <p className="text-sm text-muted-foreground">Average score across {results.length} examiner question{results.length === 1 ? "" : "s"}</p>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardContent className="p-6 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Provisional Diagnosis</p>
              <p className="font-medium">{station.provisionalDiagnosis}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">Differentials</p>
              <ul className="list-disc list-inside text-sm">
                {station.differentials.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {station.examinerQuestions.map((q, i) => (
              <Card key={i} className="glass border-none">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium">{q.question}</p>
                  {results[i] ? (
                    <>
                      <p className="text-sm text-muted-foreground">Score: {results[i].score}/100 - {results[i].feedback}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><XCircle className="h-3 w-3" /> Not answered</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Link href="/osce-stations"><Button className="w-full">Back to Stations</Button></Link>
        </div>
      )}
    </div>
  )
}
