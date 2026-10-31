// Run once from the project folder:  node apply-top100.js
// 1) adds the lock rule for top100Notes  2) lets the star copy note text  3) locks the year-wise PDFs to paid plans  4) fixes the "free" wording on the home page.
// It checks every change first and writes nothing if a file looks different from what is expected.
const fs = require('fs')
const read = (p) => fs.readFileSync(p, 'utf8')
const problems = []
const writes = []

// 1) Firestore rules
{
  const p = 'firestore.rules'
  let s = read(p)
  if (s.includes('match /top100Notes/')) {
    console.log('rules already contain top100Notes, skipping')
  } else {
    const anchor = '    match /top100/{topicId} {'
    const n = s.split(anchor).length - 1
    if (n !== 1) problems.push(`firestore.rules: expected 1 "${anchor.trim()}", found ${n}`)
    else {
      const block = `    // The 100 Most Important Topics (note text). Only Scholar / Clinician members (plan not expired) and admins can read.
    match /top100Notes/{noteId} {
      function me() {
        return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      }
      function isAdminUser() {
        return 'role' in me() && me().role == 'admin';
      }
      function paidAndActive() {
        return 'plan' in me() && me().plan in ['basic', 'pro'] && (!('planExpiresAt' in me()) || me().planExpiresAt > request.time.toMillis());
      }
      allow read: if request.auth != null && (isAdminUser() || paidAndActive());
      allow write, delete: if request.auth != null && isAdminUser();
    }
`
      s = s.replace(anchor, block + anchor)
      writes.push([p, s])
    }
  }
}

// 2) Topic page: hand the note text to the star button
{
  const p = 'src/app/notes/[subjectId]/[textbookId]/[chapterId]/[topicIndex]/page.tsx'
  let s = read(p)
  if (s.includes('markdown={topic.markdown}')) {
    console.log('topic page already patched, skipping')
  } else {
    const from = "chapterTitle={(notes as any)?.chapterTitle || ''} />}"
    const n = s.split(from).length - 1
    if (n !== 1) problems.push(`topic page: expected 1 Top100Toggle call, found ${n}`)
    else writes.push([p, s.replace(from, "chapterTitle={(notes as any)?.chapterTitle || ''} markdown={topic.markdown} />}")])
  }
}

// 3) Year-wise PDF packs: paid members only
{
  const p = 'src/app/api/notepacks/view-url/route.ts'
  let s = read(p)
  if (s.includes('Scholar and Clinician members')) {
    console.log('view-url already locked, skipping')
  } else {
    const re = /[ \t]*\/\/ Free for every signed-in user[^\n]*\n[ \t]*void isAdmin; void hasPurchased[^\n]*\n/
    if (!re.test(s)) problems.push('view-url: could not find the "free for every signed-in user" lines')
    else {
      s = s.replace(re,
        "    // Paid members only (Scholar / Clinician with an active plan), admins, and anyone who bought this pack earlier\n" +
        "    const paid = (userData?.plan === 'basic' || userData?.plan === 'pro') && (!userData?.planExpiresAt || Number(userData.planExpiresAt) > Date.now())\n" +
        "    if (!isAdmin && !hasPurchased && !paid) {\n" +
        "      return NextResponse.json({ error: 'The 100 Most Important Topics are for Scholar and Clinician members. Upgrade to read them.' }, { status: 403 })\n" +
        "    }\n")
      writes.push([p, s])
    }
  }
}

// 4) Home page wording (cosmetic, skipped quietly if the text differs)
{
  const p = 'src/app/page.tsx'
  let s = read(p)
  let changed = false
  if (s.includes('micro: "HIGH YIELD · FREE"')) { s = s.replace('micro: "HIGH YIELD · FREE"', 'micro: "HIGH YIELD · SCHOLAR"'); changed = true }
  if (s.includes('chip: "FREE FOR ALL", chipKind: "free", body: "Hand-picked must-know topics')) {
    s = s.replace('chip: "FREE FOR ALL", chipKind: "free", body: "Hand-picked must-know topics', 'chip: "SCHOLAR", chipKind: "free", body: "Hand-picked must-know topics'); changed = true
  }
  if (changed) writes.push([p, s]); else console.log('home page wording not found or already changed, skipping')
}

if (problems.length) {
  console.error('\nNOTHING WAS CHANGED. These did not match what I expected:')
  problems.forEach((x) => console.error(' -', x))
  console.error('\nPaste this output to Claude.')
  process.exit(1)
}
for (const [p, s] of writes) { fs.writeFileSync(p, s); console.log('updated', p) }

// Show the rule that guards the ORIGINAL notes so we can decide whether to tighten it
const rules = read('firestore.rules').split('\n')
const i = rules.findIndex((l) => l.includes('match /textNotes/'))
if (i >= 0) { console.log('\nRule for the original notes (textNotes):'); console.log(rules.slice(i, i + 5).join('\n')) }
console.log('\nDONE.')
