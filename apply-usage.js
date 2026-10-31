// Idempotent: adds a "Usage" button next to Analytics on the admin page.
const fs = require('fs')
const f = 'src/app/admin/page.tsx'
const s = fs.readFileSync(f, 'utf8')
if (s.includes('href="/admin/usage"')) { console.log('skip  ', f) } else {
  const anchor = '          <Link href="/admin/analytics">'
  if (!s.includes(anchor)) { console.log('MISSING anchor', f); process.exitCode = 1 } else {
    const btn = '          <Link href="/admin/usage">\n            <Button variant="outline" className="rounded-xl gap-2 glass border-violet-500/30 text-violet-400 hover:bg-violet-500/10">\n              <BarChart3 className="h-4 w-4" /> Usage &amp; Growth\n            </Button>\n          </Link>\n'
    fs.writeFileSync(f, s.replace(anchor, btn + anchor)); console.log('edited', f)
  }
}
