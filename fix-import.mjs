import fs from 'fs';

const path = 'src/app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

const oldBlock = `  async function handleConfirmImport() {
    if (!activeSubject) return
    setUploading(true)
    const subjectId = activeSubject.toLowerCase().replace(/\\s+/g, "-")
    try {
      const allQuestions = csvParsedTopics
        .sort((a, b) => a.order - b.order)
        .flatMap(t => t.questions.map((q: any) => ({ ...q, subject_id: subjectId, topic_title: t.topicName, unit_title: t.unitName || csvUnitName || null })))
      if (allQuestions.length === 0) throw new Error("No questions to import.")
      const CHUNK_SIZE = 200
      let inserted = 0
      for (let i = 0; i < allQuestions.length; i += CHUNK_SIZE) {
        const chunk = allQuestions.slice(i, i + CHUNK_SIZE)
        const { error } = await supabase.from("questions").insert(chunk)
        if (error) throw new Error("Failed at row " + (i + 1) + ": " + error.message)
        inserted += chunk.length
        toast({ title: "Importing...", description: inserted + " of " + allQuestions.length + " questions saved." })
      }
      toast({ title: "Import Successful", description: "Added " + allQuestions.length + " questions across " + csvParsedTopics.length + " topics." })
      setShowCsvOrganizer(false)
      setCsvParsedTopics([])
      setAiFixLog([])
      fetchSubjectDetails()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }`;

const newBlock = `  async function handleConfirmImport() {
    if (!activeSubject) return
    setUploading(true)
    const subjectId = activeSubject.toLowerCase().replace(/\\s+/g, "-")
    try {
      const allQuestions = csvParsedTopics
        .sort((a, b) => a.order - b.order)
        .flatMap(t => t.questions.map((q: any) => ({ ...q, subject_id: subjectId, topic_title: t.topicName, unit_title: t.unitName || csvUnitName || null })))
      if (allQuestions.length === 0) throw new Error("No questions to import.")

      const CHUNK_SIZE = 50
      const MAX_RETRIES = 3
      let inserted = 0

      for (let i = 0; i < allQuestions.length; i += CHUNK_SIZE) {
        const chunk = allQuestions.slice(i, i + CHUNK_SIZE)
        let attempt = 0
        let lastError: any = null

        while (attempt < MAX_RETRIES) {
          try {
            const res = await fetch('/api/questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questions: chunk }),
            })
            const json = await res.json()
            if (!res.ok || json.error) throw new Error(json.error || ("HTTP " + res.status))
            lastError = null
            break
          } catch (err: any) {
            lastError = err
            attempt++
            if (attempt < MAX_RETRIES) {
              toast({ title: "Retrying...", description: "Row " + (i + 1) + ": " + err.message + ", retry " + attempt + "/" + (MAX_RETRIES - 1) })
              await new Promise(r => setTimeout(r, 1000 * attempt))
              continue
            }
            break
          }
        }

        if (lastError) {
          throw new Error("Failed at row " + (i + 1) + ": " + (lastError.message || lastError))
        }

        inserted += chunk.length
        toast({ title: "Importing...", description: inserted + " of " + allQuestions.length + " questions saved." })
      }

      toast({ title: "Import Successful", description: "Added " + allQuestions.length + " questions across " + csvParsedTopics.length + " topics." })
      setShowCsvOrganizer(false)
      setCsvParsedTopics([])
      setAiFixLog([])
      fetchSubjectDetails()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }`;

if (!content.includes(oldBlock)) {
  console.log("ERROR: Could not find the exact block to replace. No changes made.");
  process.exit(1);
} else {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(path, content, 'utf-8');
  console.log("SUCCESS: handleConfirmImport updated to use Neon (/api/questions) instead of Supabase.");
}
