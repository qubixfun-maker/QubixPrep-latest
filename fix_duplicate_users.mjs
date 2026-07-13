import fs from 'fs'

const f = 'src/app/page.tsx'
let content = fs.readFileSync(f, 'utf8')

const before = content
content = content.replace(/Users,\s*Users,/, 'Users,')

if (content !== before) {
  fs.writeFileSync(f, content, 'utf8')
  console.log('Fixed: removed duplicate Users import.')
} else {
  console.log('No duplicate pattern found — paste line 12 of src/app/page.tsx to Claude.')
}
