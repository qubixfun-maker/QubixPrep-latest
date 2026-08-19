import fs from 'fs'

const f = 'src/app/notes-packs/[packId]/page.tsx'
let content = fs.readFileSync(f, 'utf8')

const before = content
content = content.replace(
  'onTransformed={(_ref, state) => { currentScale.current = state.scale }}',
  'onTransform={(_ref, state) => { currentScale.current = state.scale }}'
)

if (content !== before) {
  fs.writeFileSync(f, content, 'utf8')
  console.log('Fixed: onTransformed → onTransform')
} else {
  console.log('Pattern not found — paste line 230 of the file to Claude.')
}
