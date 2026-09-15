"use client"

import { useState, useMemo } from "react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Result = { success: true; topicCount: number; subjectId: string; textbookId: string; chapterId: string } | { success: false; error: string }

export default function AiNotesGeneratorPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const [subjectId, setSubjectId] = useState("")
  const [chapterTitle, setChapterTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  async function handleGenerate() {
    if (!user || !subjectId || !chapterTitle.trim()) return
    setIsGenerating(true)
    setResult(null)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/admin/generate-chapter-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, subjectId, chapterTitle: chapterTitle.trim() }),
      })
      let data: any
      try {
        data = await res.json()
      } catch {
        data = { error: res.ok ? "Server returned a non-JSON response" : `Server error (status ${res.status}), likely a timeout - try again` }
      }
      if (data.success) {
        setResult({ success: true, topicCount: data.topicCount, subjectId, textbookId: data.textbookId, chapterId: data.chapterId })
      } else {
        setResult({ success: false, error: data.error || "Generation failed" })
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message || "Generation failed" })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Notes Generator</h1>
        <p className="text-muted-foreground mt-2">
          No textbook or PDF needed - give it a subject and a chapter name, and Gemini writes colorful, topic-wise revision notes from its own medical knowledge, at the depth of standard Indian MBBS textbooks and the NMC curriculum. Each topic includes flowcharts for any process/pathway, tables for comparisons, and a short self-test at the end.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl glass border p-6">
        <div>
          <Label className="text-sm font-medium block mb-1">Subject</Label>
          <select className="w-full rounded-lg border bg-background p-2" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select a subject...</option>
            {subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <Label className="text-sm font-medium block mb-1">Chapter Name</Label>
          <Input placeholder="e.g. Cardiovascular Physiology" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} className="glass border-white/10" />
        </div>

        <Button onClick={handleGenerate} disabled={!subjectId || !chapterTitle.trim() || isGenerating} className="w-full">
          {isGenerating ? "Generating... (this can take a couple of minutes for a full chapter)" : "Generate Notes"}
        </Button>
      </div>

      {result && (
        <div className={`rounded-2xl glass border p-6 ${result.success ? "border-green-500/30" : "border-destructive/30"}`}>
          {result.success ? (
            <>
              <p className="text-green-500 font-medium">Generated {result.topicCount} topic(s).</p>
              <Link
                href={`/notes/${result.subjectId}/${result.textbookId}/${result.chapterId}`}
                className="text-sm underline text-primary mt-2 inline-block"
              >
                View the generated notes &rarr;
              </Link>
            </>
          ) : (
            <p className="text-destructive text-sm">Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
