// Idempotent patch: moves the PYQ session page from the old API to Firestore and adds images.
const fs = require('fs')
const f = 'src/app/pyq/start/page.tsx'
let s = fs.readFileSync(f, 'utf8')
if (s.includes('pyqMeta')) { console.log('start page already patched'); process.exit(0) }

const once = (a) => {
  const i = s.indexOf(a)
  if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error('Could not find exactly one match for: ' + a.slice(0, 70))
  return i
}
const rep = (a, b) => { once(a); s = s.replace(a, () => b) }

rep(String.raw`import { useJelly } from "@/components/jelly/jelly-store"`,
String.raw`import { useJelly } from "@/components/jelly/jelly-store"
import { doc, getDoc } from "firebase/firestore"
import { PyqImages } from "@/components/pyq/pyq-image"`)

rep(String.raw`  const desiredCount = parseInt(searchParams.get('count') || '0')`,
String.raw`  const desiredCount = parseInt(searchParams.get('count') || '0')
  const imgParam = searchParams.get('img') || 'all'`)

rep(String.raw`<CardTitle className="text-lg md:text-xl leading-relaxed">{q.question_text}</CardTitle>`,
String.raw`<CardTitle className="text-lg md:text-xl leading-relaxed">{q.question_text}</CardTitle>
          <PyqImages names={q.qimgs} />`)

rep(String.raw`<p className="text-sm text-muted-foreground leading-relaxed">{q.explanation || "No explanation provided."}</p>`,
String.raw`<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{q.explanation || "No explanation provided."}</p>
                <PyqImages names={q.eimgs} />`)

rep(String.raw`<p className="text-xs text-muted-foreground italic pl-6 pt-2 border-t border-white/5 leading-relaxed">{q.explanation}</p>`,
String.raw`<div className="pl-6 pt-2 border-t border-white/5"><p className="text-xs text-muted-foreground italic leading-relaxed whitespace-pre-wrap">{q.explanation}</p><PyqImages names={q.eimgs} /></div>`)

rep(String.raw`<div className="grid gap-1.5 pl-6">`,
String.raw`<div className="pl-6"><PyqImages names={q.qimgs} /></div>
                    <div className="grid gap-1.5 pl-6">`)

const LOAD = String.raw`  useEffect(() => {
    if (!db) return
    const fdb = db
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(fdb, 'pyqMeta', 'facets'))
        const list = ((snap.data()?.rows || []) as string[]).map(s => s.split('|'))
        let ids = list
          .filter(p => p[1] === exam && years.includes(parseInt(p[2])) && (!subjects || subjects.includes(p[3])) && (imgParam === 'img' ? p[4] === '1' : imgParam === 'text' ? p[4] !== '1' : true))
          .map(p => p[0])
        for (let i = ids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]]
        }
        if (desiredCount > 0 && ids.length > desiredCount) ids = ids.slice(0, desiredCount)
        const docs = await Promise.all(ids.map(id => getDoc(doc(fdb, 'pyqQuestions', id))))
        const pool = docs.filter(d => d.exists()).map(d => {
          const x: any = d.data()
          const o: string[] = x.options || []
          return {
            id: d.id, exam_type: x.exam, year: x.year, subject: x.subject, paper: x.paper,
            question_text: x.question, option1: o[0], option2: o[1], option3: o[2] ?? null, option4: o[3] ?? null,
            correct_answer_index: x.correct, explanation: x.explanation,
            qimgs: x.qimgs || [], eimgs: x.eimgs || [],
          }
        })
        if (cancelled) return
        setQuestions(pool)
        if (mode === 'exam') setTimeLeft(pool.length * 90)
      } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e?.message || "Could not load questions" })
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [db, exam, yearsParam, subjectsParam, desiredCount, imgParam])`

const START = '  useEffect(() => {\n    async function load() {'
const END = '  }, [exam, yearsParam, subjectsParam, desiredCount])'
const i = once(START)
const j = s.indexOf(END, i)
if (j < 0) throw new Error('Could not find the end of the load effect')
s = s.slice(0, i) + LOAD + s.slice(j + END.length)

fs.writeFileSync(f, s)
console.log('start page patched')
