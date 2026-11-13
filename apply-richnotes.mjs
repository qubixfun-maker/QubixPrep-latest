// Patches 2 existing files for Rich Notes. Each edit is verified; safe to run twice.
import fs from 'fs'
function patch(file, edits) {
  let s = fs.readFileSync(file, 'utf8')
  for (const [name, find, add, marker] of edits) {
    if (marker ? s.includes(marker) : s.includes(add)) { console.log(`skip (already applied): ${file} :: ${name}`); continue }
    if (s.split(find).length - 1 !== 1) { console.log(`FAILED anchor not unique/found: ${file} :: ${name}`); process.exitCode = 1; continue }
    s = s.replace(find, add)
    console.log(`ok: ${file} :: ${name}`)
  }
  fs.writeFileSync(file, s)
}

patch('src/app/notes/[subjectId]/[textbookId]/[chapterId]/[topicIndex]/page.tsx', [
  ['import', 'import { NoteBody } from "@/components/notes/note-body"',
   'import { NoteBody } from "@/components/notes/note-body"\nimport { TopicBody } from "@/components/notes/topic-body"'],
  ['render', '<NoteBody markdown={topic.markdown} borderClass={color.border} protectWith={isAdmin ? undefined : (user?.email || user?.uid)} />',
   '<TopicBody topic={topic} topicNo={parseInt(topicIndex, 10) + 1} subjectName={subject ? (subject as any).name : undefined} borderClass={color.border} isAdmin={isAdmin} protectWith={isAdmin ? undefined : (user?.email || user?.uid)} />'],
])

patch('src/app/admin/page.tsx', [
  ['admin link', '          <Link href="/admin/spotters">',
`          <Link href="/admin/rich-notes">
            <Button variant="outline" className="rounded-xl gap-2 glass border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10">
              <BookOpenText className="h-4 w-4" /> Rich Notes converter
            </Button>
          </Link>
          <Link href="/admin/spotters">`, 'href="/admin/rich-notes"'],
])
