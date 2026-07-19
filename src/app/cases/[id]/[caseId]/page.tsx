"use client"

import { useMemo, use, useState } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronLeft, Loader2, Trophy, AlertTriangle, Lightbulb, RotateCcw, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type CaseOption = { id: string; label: string; outcome: string; points: number; feedback: string }
type CaseStage = { id: string; type: string; prompt: string; options: CaseOption[] }

const OUTCOME_STYLE: Record<string, { icon: any; color: string }> = {
  optimal: { icon: CheckCircle2, color: "text-green-400" },
  acceptable: { icon: AlertCircle, color: "text-yellow-400" },
  unsafe: { icon: AlertTriangle, color: "text-red-400" },
  wrong: { icon: XCircle, color: "text-muted-foreground" },
}

export default function CasePlayerPage({ params }: { params: Promise<{ id: string; caseId: string }> }) {
  const { id: subjectId, caseId } = use(params)
  const db = useFirestore()

  const caseRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'cases', caseId)), [db, subjectId, caseId])
  const { data: caseData, loading } = useDoc(caseRef)

  const [stageIndex, setStageIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<CaseOption | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!caseData) return <div className="h-screen flex items-center justify-center text-muted-foreground">Case not found.</div>

  const c = caseData as any
  const stages: CaseStage[] = c.stages || []
  const currentStage = stages[stageIndex]

  function pickOption(opt: CaseOption) {
    if (selectedOption) return
    setSelectedOption(opt)
    setTotalScore((s) => s + opt.points)
    const stageMax = Math.max(...currentStage.options.map((o) => o.points))
    setMaxScore((m) => m + stageMax)
  }

  function nextStage() {
    setSelectedOption(null)
    if (stageIndex + 1 < stages.length) {
      setStageIndex(stageIndex + 1)
    } else {
      setFinished(true)
    }
  }

  function restart() {
    setStageIndex(0)
    setSelectedOption(null)
    setTotalScore(0)
    setMaxScore(0)
    setFinished(false)
    setFlipped({})
  }

  const percent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const stars = percent >= 85 ? 3 : percent >= 60 ? 2 : percent >= 35 ? 1 : 0

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6 animate-in slide-in-from-right-4 duration-700">
      <Link href={`/cases/${subjectId}`} className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 w-fit hover:underline">
        <ChevronLeft className="h-3 w-3" /> Back to Cases
      </Link>

      {!finished ? (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">{c.title}</h1>
            <span className="text-xs font-bold text-muted-foreground">Stage {stageIndex + 1} / {stages.length}</span>
          </div>

          {stageIndex === 0 && (
            <Card className="glass border-none">
              <CardContent className="p-6">
                <p className="text-sm leading-relaxed">{c.stem}</p>
              </CardContent>
            </Card>
          )}

          <Card className="glass border-none">
            <CardContent className="p-6 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{currentStage.type}</p>
              <p className="font-medium">{currentStage.prompt}</p>

              <div className="space-y-2">
                {currentStage.options.map((opt) => {
                  const isSelected = selectedOption?.id === opt.id
                  const style = OUTCOME_STYLE[opt.outcome] || OUTCOME_STYLE.wrong
                  const Icon = style.icon
                  return (
                    <button
                      key={opt.id}
                      onClick={() => pickOption(opt)}
                      disabled={!!selectedOption}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : selectedOption
                          ? "border-white/5 opacity-40"
                          : "border-white/10 hover:border-primary/50 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isSelected && <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.color}`} />}
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      {isSelected && (
                        <p className={`text-xs mt-2 pl-7 ${style.color}`}>{opt.feedback} ({opt.points > 0 ? "+" : ""}{opt.points} pts)</p>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedOption && (
                <Button onClick={nextStage} className="w-full rounded-xl">
                  {stageIndex + 1 < stages.length ? "Continue" : "See Results"}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-6">
          <Card className="glass border-none">
            <CardContent className="p-8 text-center space-y-3">
              <Trophy className="h-10 w-10 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">{percent}% Score</h2>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <Trophy key={i} className={`h-5 w-5 ${i < stars ? "text-yellow-400" : "text-white/10"}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Final Diagnosis: <span className="text-foreground font-medium">{c.finalDiagnosis}</span></p>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Key Learnings</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                {(c.keyLearnings || []).map((k: string, i: number) => <li key={i}>{k}</li>)}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" /> Common Pitfalls</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                {(c.pitfalls || []).map((p: string, i: number) => <li key={i}>{p}</li>)}
              </ul>
            </CardContent>
          </Card>

          {(c.flashcards || []).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm px-1">Review Flashcards</h3>
              <div className="grid gap-3">
                {c.flashcards.map((fc: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                    className="text-left p-5 rounded-xl glass border border-white/10 hover:border-primary/40 transition-all min-h-[80px] flex items-center"
                  >
                    <p className="text-sm">{flipped[i] ? fc.back : fc.front}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl gap-2" onClick={restart}>
              <RotateCcw className="h-4 w-4" /> Retry Case
            </Button>
            <Link href={`/cases/${subjectId}`} className="flex-1">
              <Button className="w-full rounded-xl">More Cases</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
