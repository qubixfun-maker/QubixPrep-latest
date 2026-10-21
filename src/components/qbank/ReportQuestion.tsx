"use client"

import { useState } from "react"
import { Flag, Check } from "lucide-react"
import { addDoc, collection } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"

const REASONS = ["Wrong answer key", "Unclear question", "Explanation is wrong", "Duplicate question", "Typo or formatting", "I have a doubt", "Other"]

export default function ReportQuestion({ subjectId, subjectName, topic, question }: { subjectId: string; subjectName?: string; topic?: string; question: string }) {
  const db = useFirestore()
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function send() {
    if (!db || !user) return
    setState("sending")
    try {
      await addDoc(collection(db, "questionReports"), {
        uid: user.uid, name: user.displayName || "", email: user.email || "",
        subjectId, subjectName: subjectName || "", topic: topic || "", question: question.slice(0, 1500),
        reason, note: note.slice(0, 800), status: "open", createdAt: Date.now(),
      })
      setState("sent")
    } catch { setState("error") }
  }

  if (state === "sent") return <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600"><Check className="h-3.5 w-3.5" /> Thanks, our team will review this and reply on your email if needed.</p>

  return (
    <div className="text-sm">
      {!open ? (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-rose-600"><Flag className="h-3.5 w-3.5" /> Report or ask a doubt</button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="font-extrabold">What is wrong, or what is your doubt?</p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => <button key={r} onClick={() => setReason(r)} className={`rounded-full border px-3 py-1 text-xs font-bold ${reason === r ? "border-primary bg-primary text-white" : "border-border"}`}>{r}</button>)}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={800} rows={2} placeholder="Write your doubt, or what the correct answer should be and which book says so" className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
          {state === "error" && <p className="text-xs font-bold text-rose-600">Could not send. Please try again.</p>}
          <div className="flex gap-2">
            <button onClick={send} disabled={state === "sending"} className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-white disabled:opacity-60">{state === "sending" ? "Sending…" : "Send report"}</button>
            <button onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-xs font-bold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
