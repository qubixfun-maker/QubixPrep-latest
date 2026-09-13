"use client"

import { useState, useMemo } from "react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"

export default function AiTextbookIngestPage() {
  const { user } = useUser()
  const db = useFirestore()

  const textbooksQuery = useMemo(() => (!db ? null : query(collection(db, "textbooks"), orderBy("title", "asc"))), [db])
  const { data: textbooks } = useCollection(textbooksQuery)

  const [textbookId, setTextbookId] = useState("")
  const [running, setRunning] = useState(false)
  const [progressText, setProgressText] = useState("")
  const [error, setError] = useState("")
  const [chapterCount, setChapterCount] = useState<number | null>(null)

  async function runIngestion() {
    if (!user || !textbookId) return
    setRunning(true)
    setError("")
    setChapterCount(null)
    setProgressText("Starting...")

    try {
      while (true) {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/admin/ai-ingest-textbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, textbookId }),
        })
        const data = await res.json()

        if (data.error) {
          setError(data.error)
          break
        }
        if (data.done) {
          setProgressText(`Done - ${data.chapterCount ?? "?"} chapters saved from ${data.totalPages ?? "?"} pages.`)
          setChapterCount(data.chapterCount ?? null)
          break
        }
        setProgressText(`Processed ${data.pagesProcessed} / ${data.totalPages} pages...`)
      }
    } catch (err: any) {
      setError(err.message)
    }
    setRunning(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Textbook Ingestion</h1>
        <p className="text-muted-foreground mt-2">
          Has Gemini read the book directly (page by page, using vision for scanned pages) to determine chapter boundaries and titles - for books where the existing ingestion struggles.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl glass border p-6">
        <div>
          <label className="text-sm font-medium block mb-1">Textbook to re-process</label>
          <select className="w-full rounded-lg border bg-background p-2" value={textbookId} onChange={(e) => setTextbookId(e.target.value)}>
            <option value="">Select a textbook...</option>
            {textbooks?.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            This overwrites the textbook's existing chapters (ch-01, ch-02, ...) once processing completes - existing chapterKnowledge/notes/etc. tied to the old chapter IDs may need to be re-extracted afterward.
          </p>
        </div>

        <Button onClick={runIngestion} disabled={!textbookId || running} className="w-full">
          {running ? "Running..." : "Run AI Ingestion"}
        </Button>

        {progressText && <p className="text-sm text-muted-foreground">{progressText}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {chapterCount !== null && (
          <p className="text-sm text-green-500">Successfully saved {chapterCount} chapters.</p>
        )}
      </div>
    </div>
  )
}
