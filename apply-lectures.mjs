// Patches 4 existing files for Video Lectures. Safe to run once; each edit is verified.
import fs from 'fs'
function patch(file, edits) {
  let s = fs.readFileSync(file, 'utf8')
  for (const [name, find, add, mode] of edits) {
    if (s.includes(add)) { console.log(`skip (already applied): ${file} :: ${name}`); continue }
    if (s.split(find).length - 1 !== 1) { console.log(`FAILED anchor not unique/found: ${file} :: ${name}`); process.exitCode = 1; continue }
    s = s.replace(find, add)
    console.log(`ok: ${file} :: ${name}`)
  }
  fs.writeFileSync(file, s)
}

patch('src/hooks/use-plan.ts', [
  ['expose isAdmin', '    plan,\n    expiresAt', '    plan,\n    isAdmin,\n    expiresAt'],
])

patch('src/app/admin/page.tsx', [
  ['admin link', '          <Link href="/admin/spotters">',
`          <Link href="/admin/lectures">
            <Button variant="outline" className="rounded-xl gap-2 glass border-sky-500/30 text-sky-500 hover:bg-sky-500/10">
              <Video className="h-4 w-4" /> Video Lectures
            </Button>
          </Link>
          <Link href="/admin/spotters">`],
])

patch('src/app/videos/page.tsx', [
  ['lecture counts', '  const { data: rawSubjects, loading } = useCollection(subjectsQuery)',
`  const { data: rawSubjects, loading } = useCollection(subjectsQuery)
  const lecturesQuery = useMemo(() => (db ? collection(db, "lectures") : null), [db])
  const { data: rawLectures } = useCollection(lecturesQuery)
  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    ;((rawLectures || []) as any[]).forEach((l) => { if (l.status === "published") m[l.subjectId] = (m[l.subjectId] || 0) + 1 })
    return m
  }, [rawLectures])`],
  ['count label', '                        Structured Lectures',
   '                        {counts[subject.id] ? `${counts[subject.id]} lecture${counts[subject.id] === 1 ? "" : "s"}` : "Coming soon"}'],
])

patch('firestore.rules', [
  ['lectures rules', '    match /videos/{videoId} {',
`    match /lectures/{lectureId} {
      allow read: if request.auth != null;
      allow write, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /videos/{videoId} {`],
])
