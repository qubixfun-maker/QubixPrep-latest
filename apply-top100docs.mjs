// Adds the "Top 100 sheets" button to the admin page. Safe to run twice.
import fs from 'fs'
const file = 'src/app/admin/page.tsx'
let s = fs.readFileSync(file, 'utf8')
const marker = 'href="/admin/top100-docs"'
const find = '          <Link href="/admin/rich-notes">'
const add = `          <Link href="/admin/top100-docs">
            <Button variant="outline" className="rounded-xl gap-2 glass border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
              <BookOpenText className="h-4 w-4" /> Top 100 sheets
            </Button>
          </Link>
`
if (s.includes(marker)) console.log('skip (already applied)')
else if (s.split(find).length - 1 !== 1) { console.log('FAILED: anchor not found or not unique'); process.exitCode = 1 }
else { s = s.replace(find, add + find); fs.writeFileSync(file, s); console.log('ok: admin link added') }
