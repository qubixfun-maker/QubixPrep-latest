const fs = require("fs")
const f = "src/app/admin/page.tsx"
let s = fs.readFileSync(f, "utf8")
if (s.includes("handleGenerate100")) { console.log("admin: already done"); process.exit(0) }
const need = (a) => { if (!s.includes(a)) { console.error("anchor missing:", a.slice(0, 60)); process.exit(1) } }

const imp = 'import { generateClinicalCase, ClinicalCase } from "@/ai/flows/ai-case-generator"'
need(imp)
s = s.replace(imp, imp + '\nimport { CASE_TOPICS } from "@/ai/case-topics"')

const h = "  async function handleSaveCase() {"
need(h)
s = s.replace(h, `  async function handleGenerate100() {
    if (!db || !user) return
    if (!confirm("Generate the 100 Ward Round cases? It takes about 10-15 minutes. Keep this tab open. Cases that already exist are skipped.")) return
    batchStopRef.current = false
    const have = new Set(allCases.map((c: any) => c.id))
    const todo = CASE_TOPICS.filter((t) => !have.has(t.id))
    let idx = 0, done = 0, failed = 0
    setBatchRun({ done, total: todo.length, failed, running: true })
    const worker = async () => {
      while (!batchStopRef.current) {
        const t = todo[idx++]
        if (!t) return
        try {
          const idToken = await user.getIdToken()
          const res = await fetch("/api/admin/ward-case", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, topicId: t.id }) })
          if (res.ok) done++; else failed++
        } catch { failed++ }
        setBatchRun({ done, total: todo.length, failed, running: true })
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()])
    setBatchRun({ done, total: todo.length, failed, running: false })
    fetchAllCases()
  }

` + h)

const st = "  const [allCases, setAllCases] = useState<any[]>([])"
need(st)
s = s.replace(st, st + "\n  const [batchRun, setBatchRun] = useState<{ done: number; total: number; failed: number; running: boolean } | null>(null)\n  const batchStopRef = useRef(false)")
const rimp = 'import { useMemo, useState, useEffect } from "react"'
need(rimp)
s = s.replace(rimp, 'import { useMemo, useState, useEffect, useRef } from "react"')

const ui = "          {draftCase && ("
need(ui)
s = s.replace(ui, `          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
            <h4 className="font-bold flex items-center gap-2 text-accent text-sm"><Wand2 className="h-4 w-4" /> Ward Round: the 100 ready cases</h4>
            <p className="text-xs text-muted-foreground">Creates all 100 curated cases (Medicine, Surgery, OBG, Paediatrics and more) in one go. Already existing ones are skipped, so you can run it again to fill any gaps.</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={handleGenerate100} disabled={!!batchRun?.running} className="rounded-lg gap-2">
                {batchRun?.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate 100 cases
              </Button>
              {batchRun?.running && <Button variant="outline" className="rounded-lg" onClick={() => { batchStopRef.current = true }}>Stop</Button>}
              {batchRun && <span className="text-xs font-bold">{batchRun.done} / {batchRun.total} done{batchRun.failed ? " · " + batchRun.failed + " failed" : ""}{!batchRun.running ? " · finished" : ""}</span>}
            </div>
          </div>

` + ui)
fs.writeFileSync(f, s)
console.log("admin: done")
