// Idempotent: FAQ/Support wiring (rules, sidebar, admin button).
const fs = require('fs')
function edit(file, test, pairs) {
  if (!fs.existsSync(file)) { console.log('MISSING FILE', file); process.exitCode = 1; return }
  let s = fs.readFileSync(file, 'utf8')
  if (s.includes(test)) { console.log('skip  ', file, '(' + test.slice(0, 28) + ')'); return }
  let out = s
  for (const [a, b] of pairs) {
    if (!out.includes(a)) { console.log('MISSING in', file, '->', a.slice(0, 70)); process.exitCode = 1; return }
    out = out.replace(a, b)
  }
  fs.writeFileSync(file, out); console.log('edited', file)
}

edit('firestore.rules', 'supportRequests', [
  ['    match /arenaMeta/{id} { allow read, write: if false; }\n',
   `    match /arenaMeta/{id} { allow read, write: if false; }
    // Support inbox: signed-in users can send a message; only admins read, resolve or delete.
    match /supportRequests/{id} {
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow read, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
    // Question reports from students (used by the Report button in QBank).
    match /questionReports/{id} {
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow read, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
`],
])

edit('src/components/layout/app-sidebar.tsx', 'Help & FAQ', [
  ['Sparkles, Wand2, ShoppingBag, Gift, User, Zap, CloudUpload, Lock, Plus, Star, Newspaper, Swords,', 'Sparkles, Wand2, ShoppingBag, Gift, User, Zap, CloudUpload, Lock, Plus, Star, Newspaper, Swords, HelpCircle, LifeBuoy,'],
  ['    { title: "Pricing", url: "/pricing", icon: Zap },\n', '    { title: "Pricing", url: "/pricing", icon: Zap },\n    { title: "Help & FAQ", url: "/faq", icon: HelpCircle },\n    { title: "Support", url: "/support", icon: LifeBuoy },\n'],
])

edit('src/app/admin/page.tsx', '/admin/inbox', [
  ['          <Link href="/admin/analytics">\n', '          <Link href="/admin/inbox">\n            <Button variant="outline" className="rounded-xl gap-2 glass border-teal-500/30 text-teal-400 hover:bg-teal-500/10">\n              <BookOpenText className="h-4 w-4" /> Support Inbox\n            </Button>\n          </Link>\n          <Link href="/admin/analytics">\n'],
])
