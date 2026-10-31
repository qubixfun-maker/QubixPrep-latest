// Idempotent patch: adds a "PYQ Import" button to the admin dashboard, right after "Spotters upload".
const fs = require('fs')
const f = 'src/app/admin/page.tsx'
let s = fs.readFileSync(f, 'utf8')
if (s.includes('/admin/pyq-import')) { console.log('PYQ Import button already there'); process.exit(0) }
const anchor = String.raw`              <BarChart3 className="h-4 w-4" /> Spotters upload
            </Button>
          </Link>
`
const i = s.indexOf(anchor)
if (i < 0 || s.indexOf(anchor, i + 1) >= 0) throw new Error('Could not find the Spotters upload button exactly once')
const card = String.raw`          <Link href="/admin/pyq-import">
            <Button variant="outline" className="rounded-xl gap-2 glass border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
              <BarChart3 className="h-4 w-4" /> PYQ Import
            </Button>
          </Link>
`
const at = i + anchor.length
s = s.slice(0, at) + card + s.slice(at)
fs.writeFileSync(f, s)
console.log('PYQ Import button added')
