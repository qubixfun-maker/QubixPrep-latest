// Idempotent: adds the admin "Spotters upload" button and the Firestore rule for /spotters.
const fs = require('fs')
let f = 'src/app/admin/page.tsx'
let s = fs.readFileSync(f, 'utf8')
if (s.includes('href="/admin/spotters"')) console.log('skip  ', f)
else {
  const anchor = '          <Link href="/admin/analytics">'
  if (!s.includes(anchor)) { console.log('MISSING anchor', f); process.exitCode = 1 }
  else {
    const btn = '          <Link href="/admin/spotters">\n            <Button variant="outline" className="rounded-xl gap-2 glass border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">\n              <BarChart3 className="h-4 w-4" /> Spotters upload\n            </Button>\n          </Link>\n'
    fs.writeFileSync(f, s.replace(anchor, btn + anchor)); console.log('edited', f)
  }
}
f = 'firestore.rules'
s = fs.readFileSync(f, 'utf8')
if (s.includes('match /spotters/{id}')) console.log('skip  ', f)
else {
  const anchor = '    // Support inbox:'
  if (!s.includes(anchor)) { console.log('MISSING anchor', f); process.exitCode = 1 }
  else {
    const rule = '    // Spot & Identify items uploaded from Admin > Spotters upload.\n    match /spotters/{id} {\n      allow read: if request.auth != null;\n      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";\n    }\n'
    fs.writeFileSync(f, s.replace(anchor, rule + anchor)); console.log('edited', f)
  }
}
