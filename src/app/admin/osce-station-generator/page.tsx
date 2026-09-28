"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const JOB_ID = "current"

type StationProgress = {
  title: string
  status: "pending" | "running" | "done" | "failed"
  stationId?: string
  generatedTitle?: string
  error?: string
}

export default function OsceStationGeneratorPage() {
  const { user } = useUser()
  const db = useFirestore()

  const [specialty, setSpecialty] = useState("")
  const [topicNamesInput, setTopicNamesInput] = useState("")

  const jobRef = useMemo(() => (!db ? null : doc(db, "osceStationGenJob", JOB_ID)), [db])
  const { data: job } = useDoc(jobRef)

  const pausedRef = useRef(false)

  useEffect(() => {
    if (!job || job.status !== "running") return
    const stations: StationProgress[] = job.stations || []
    const startIndex = stations.findIndex((s) => s.status !== "done")
    if (startIndex !== -1 && startIndex < stations.length) {
      pausedRef.current = false
      runLoop(stations, startIndex)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status])

  async function updateJob(fields: any) {
    if (!jobRef) return
    await updateDoc(jobRef, fields)
  }

  async function startNewJob() {
    if (!db || !specialty.trim() || !jobRef) return
    const titles = topicNamesInput
      .split("\n")
      .map((t) => t.trim().replace(/^\d+[.)]\s*/, ""))
      .filter(Boolean)
    if (titles.length === 0) {
      alert("Enter at least one topic, one per line.")
      return
    }
    const stations: StationProgress[] = titles.map((title) => ({ title, status: "pending" }))

    try {
      await setDoc(jobRef, { specialty: specialty.trim(), stations, status: "running", updatedAt: serverTimestamp() })
      pausedRef.current = false
      runLoop(stations, 0)
    } catch (err: any) {
      alert(`Could not start: ${err?.message || "unknown error"}. If this says "permission denied", the Firestore rule for osceStationGenJob may not be published yet.`)
    }
  }

  async function runLoop(stations: StationProgress[], startIndex: number) {
    if (!user) return
    const idToken = await user.getIdToken()
    const working = [...stations]

    for (let i = startIndex; i < working.length; i++) {
      if (pausedRef.current) {
        await updateJob({ status: "paused", stations: working, updatedAt: serverTimestamp() })
        return
      }
      working[i] = { ...working[i], status: "running" }
      await updateJob({ stations: working, updatedAt: serverTimestamp() })

      try {
        const res = await fetch("/api/admin/generate-osce-station", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, specialty, topic: working[i].title }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Generation failed")
        working[i] = { ...working[i], status: "done", stationId: data.stationId, generatedTitle: data.title }
      } catch (e: any) {
        working[i] = { ...working[i], status: "failed", error: e.message || "Unknown error" }
      }
      await updateJob({ stations: working, updatedAt: serverTimestamp() })
    }

    await updateJob({ status: "done", stations: working, updatedAt: serverTimestamp() })
  }

  function pause() {
    pausedRef.current = true
  }

  function resume() {
    if (!job) return
    const stations: StationProgress[] = job.stations
    const startIndex = stations.findIndex((s: StationProgress) => s.status !== "done")
    pausedRef.current = false
    runLoop(stations, startIndex === -1 ? stations.length : startIndex)
  }

  async function retryFailed() {
    if (!job) return
    const stations: StationProgress[] = job.stations.map((s: StationProgress) =>
      s.status === "failed" ? { ...s, status: "pending", error: undefined } : s
    )
    await updateJob({ status: "running", stations, updatedAt: serverTimestamp() })
    pausedRef.current = false
    const startIndex = stations.findIndex((s) => s.status !== "done")
    runLoop(stations, startIndex === -1 ? 0 : startIndex)
  }

  function reset() {
    if (!confirm("Clear this job? Stations already generated are NOT deleted, only the progress list.")) return
    pausedRef.current = true
    if (jobRef) setDoc(jobRef, { stations: [], status: "idle", updatedAt: serverTimestamp() })
    setTopicNamesInput("")
  }

  const stations: StationProgress[] = job?.stations || []
  const doneCount = stations.filter((s) => s.status === "done").length
  const failedCount = stations.filter((s) => s.status === "failed").length
  const hasActiveJob = stations.length > 0

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">OSCE Station Generator</h1>
      <p className="text-sm text-muted-foreground">
        Give it a specialty and one or more topics (one per line), and Gemini writes a full OSCE/AMC-style station for each -
        patient history bank, examination findings, investigations, examiner questions with marking points, and diagnosis.
        Each station is generated once and saved, then reused by every student who attempts it. Stations are generated one at
        a time - keep this tab open while it runs; closing it pauses the batch until you come back and hit Resume.
      </p>

      <div className="space-y-4 border rounded-xl p-4">
        <div>
          <Label className="text-sm font-medium block mb-1">Specialty</Label>
          <Input placeholder="e.g. Cardiology" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        </div>
        <div>
          <Label className="text-sm font-medium block mb-1">Topics (one per line)</Label>
          <Textarea
            rows={8}
            placeholder={"Acute coronary syndrome\nHeart failure\nAtrial fibrillation"}
            value={topicNamesInput}
            onChange={(e) => setTopicNamesInput(e.target.value)}
          />
        </div>
        <Button onClick={startNewJob} disabled={!specialty.trim() || !topicNamesInput.trim() || job?.status === "running"} className="w-full">
          Generate Stations
        </Button>
      </div>

      {hasActiveJob && (
        <div className="space-y-3 border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Progress ({stations.length} station{stations.length === 1 ? "" : "s"})</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {doneCount}/{stations.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""} &middot; job status: {job?.status}
            {job?.status === "running" && " (keep this tab open)"}
          </p>

          <div className="flex gap-2">
            {job?.status === "running" && <Button variant="outline" onClick={pause}>Pause</Button>}
            {job?.status === "paused" && <Button variant="outline" onClick={resume}>Resume</Button>}
            {failedCount > 0 && job?.status !== "running" && <Button variant="outline" onClick={retryFailed}>Retry Failed</Button>}
            <Button variant="ghost" onClick={reset}>Reset</Button>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {stations.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <span className="truncate flex-1">{s.title}</span>
                {s.status === "done" && s.stationId ? (
                  <span className="text-green-600 shrink-0">done ({s.stationId})</span>
                ) : s.status === "failed" ? (
                  <span className="text-red-600 shrink-0" title={s.error}>failed</span>
                ) : (
                  <span className="text-muted-foreground shrink-0">{s.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/admin" className="text-sm underline text-muted-foreground">Back to Admin</Link>
    </div>
  )
}
