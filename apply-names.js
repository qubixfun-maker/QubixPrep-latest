#!/usr/bin/env node
// Chapter / topic / title names are no longer cut off with "..." - they wrap onto a second line instead.
// Checks everything first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const root = process.cwd()
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const E = (file, old, neu) => ({ file, old, neu })
const EDITS = [
  E('src/app/notes/[subjectId]/page.tsx', '<span className="font-medium truncate">{note.chapterTitle}</span>', '<span className="min-w-0 break-words font-medium">{note.chapterTitle}</span>'),
  E('src/app/top-100/page.tsx', '<p className="truncate text-sm font-bold">{t.name}</p>', '<p className="min-w-0 break-words text-sm font-bold">{t.name}</p>'),
  E('src/app/top-100/page.tsx', '<p className="truncate text-xs text-muted-foreground">{t.chapterTitle}</p>', '<p className="min-w-0 break-words text-xs text-muted-foreground">{t.chapterTitle}</p>'),
  E('src/app/long-answers/[subjectId]/page.tsx', '<p className="font-bold truncate">{ch.title}</p>', '<p className="min-w-0 break-words font-bold">{ch.title}</p>'),
  E('src/app/mindmaps/[id]/[mindmapId]/page.tsx', '<h1 className="truncate text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{mm.title}</h1>', '<h1 className="line-clamp-2 break-words text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{mm.title}</h1>'),
  E('src/app/mindmaps/[id]/[mindmapId]/page.tsx', '<p className="truncate text-sm font-medium text-slate-500 sm:text-base">{subjectName}</p>', '<p className="line-clamp-2 break-words text-sm font-medium text-slate-500 sm:text-base">{subjectName}</p>'),
  E('src/app/qbank/my-pdf-qbanks.tsx', '<h4 className="font-bold text-base line-clamp-1 mb-1">{q.file_name}</h4>', '<h4 className="font-bold text-base line-clamp-2 break-words mb-1">{q.file_name}</h4>'),
]
const cache = {}, todo = []
for (const e of EDITS) {
  const p = path.join(root, e.file)
  if (!fs.existsSync(p)) fail('Run this from the QubixPrep-latest folder (missing ' + e.file + ').')
  const raw = cache[p] ?? fs.readFileSync(p, 'utf8')
  if (raw.includes(e.neu)) { cache[p] = raw; continue }
  const n = raw.split(e.old).length - 1
  if (n !== 1) fail('Expected exactly one match in ' + e.file + ' for:\n  ' + e.old.slice(0, 80) + '\nfound ' + n + '.')
  cache[p] = raw.replace(e.old, () => e.neu)
  todo.push(p)
}
if (todo.length === 0) { console.log('Already applied. Nothing to do.'); process.exit(0) }
for (const p of new Set(todo)) { fs.writeFileSync(p, cache[p]); console.log('updated ' + path.relative(root, p)) }
console.log('\nDONE. NEXT: npx tsc --noEmit')
