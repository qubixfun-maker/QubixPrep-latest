import fs from 'fs'

function replaceOnce(file, oldStr, newStr, label) {
  let content = fs.readFileSync(file, 'utf8')
  const count = content.split(oldStr).length - 1
  if (count !== 1) {
    console.error(`FAIL [${label}] in ${file} — found ${count} matches (expected 1)`)
    process.exitCode = 1
    return
  }
  content = content.replace(oldStr, newStr)
  fs.writeFileSync(file, content, 'utf8')
  console.log(`OK   [${label}] in ${file}`)
}

const f = 'src/app/admin/page.tsx'

// 1. Import the Switch component
replaceOnce(f,
`import { Checkbox } from "@/components/ui/checkbox"`,
`import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"`,
  'admin: import Switch component')

// 2. Add state for the toggle (default ON, near the other bulk-import state)
replaceOnce(f,
`  const [isAssigningUnit, setIsAssigningUnit] = useState(false)`,
`  const [isAssigningUnit, setIsAssigningUnit] = useState(false)
  const [useAiFixer, setUseAiFixer] = useState(true)`,
  'admin: add useAiFixer state')

// 3. Skip the AI-fix pass entirely when the toggle is off
replaceOnce(f,
`        setAiFixing(true)
        setIsUploadingQBank(false)
        setIsUploadingQBank(false)
        toast({ title: 'AI Fixing CSV...', description: 'Checking ' + allQuestions.length + ' questions for errors.' })
        setAiFixProgress({ done: 0, total: allQuestions.length, message: 'Starting...' })
        const { fixed, log } = await aiFixBatch(allQuestions, (done, message) => {
          setAiFixProgress({ done, total: allQuestions.length, message: message || '' })
        })
        setAiFixLog(log)
        setAiFixing(false)`,
`        let fixed = allQuestions
        let log: any[] = []
        if (useAiFixer) {
          setAiFixing(true)
          setIsUploadingQBank(false)
          setIsUploadingQBank(false)
          toast({ title: 'AI Fixing CSV...', description: 'Checking ' + allQuestions.length + ' questions for errors.' })
          setAiFixProgress({ done: 0, total: allQuestions.length, message: 'Starting...' })
          const result = await aiFixBatch(allQuestions, (done, message) => {
            setAiFixProgress({ done, total: allQuestions.length, message: message || '' })
          })
          fixed = result.fixed
          log = result.log
          setAiFixLog(log)
          setAiFixing(false)
        } else {
          setIsUploadingQBank(false)
          setAiFixLog([])
        }`,
  'admin: branch on useAiFixer toggle')

// 4. Adjust the final toast so it doesn't claim "AI fixed" when the fixer was skipped
replaceOnce(f,
`        if (log.length > 0) {
          toast({ title: 'AI fixed ' + log.length + ' issues', description: 'Review the fix log in the organizer.' })
        } else {
          toast({ title: 'CSV looks clean!', description: fixed.length + ' questions ready to import.' })
        }`,
`        if (!useAiFixer) {
          toast({ title: 'Imported without AI check', description: fixed.length + ' questions ready to import as-is.' })
        } else if (log.length > 0) {
          toast({ title: 'AI fixed ' + log.length + ' issues', description: 'Review the fix log in the organizer.' })
        } else {
          toast({ title: 'CSV looks clean!', description: fixed.length + ' questions ready to import.' })
        }`,
  'admin: adjust completion toast')

// 5. Add the Switch UI to the Bulk Import dialog
replaceOnce(f,
`             <div className="space-y-2">
                <Label>Clinical Data File (.csv)</Label>
                <div className="relative group">
                   <Input 
                    type="file" 
                    accept=".csv" 
                    className="glass border-white/10 cursor-pointer h-14 pt-4 pr-10" 
                    onChange={handleImportCSV}
                    disabled={uploading}/>
                   <FileDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
             </div>`,
`             <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">AI Auto-Fix</Label>
                  <p className="text-[10px] text-muted-foreground">Checks for column shifts, wrong answers &amp; missing explanations before import.</p>
                </div>
                <Switch checked={useAiFixer} onCheckedChange={setUseAiFixer} />
             </div>
             <div className="space-y-2">
                <Label>Clinical Data File (.csv)</Label>
                <div className="relative group">
                   <Input 
                    type="file" 
                    accept=".csv" 
                    className="glass border-white/10 cursor-pointer h-14 pt-4 pr-10" 
                    onChange={handleImportCSV}
                    disabled={uploading}/>
                   <FileDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
             </div>`,
  'admin: add AI Auto-Fix switch to dialog')

console.log('\nDone.')
