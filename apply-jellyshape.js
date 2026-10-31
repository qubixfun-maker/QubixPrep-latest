// Idempotent: Jelly gets the wide, squashy bell body with a wavy jelly skirt showing under a shorter coat.
const fs = require('fs')
const f = 'src/components/jelly/JellyAvatar.tsx'
let s = fs.readFileSync(f, 'utf8')
if (s.includes('M30 112 C25 56')) { console.log('skip  ', f); process.exit(0) }
const P = [
  ['M38 108 C38 52 66 14 100 14 C134 14 162 52 162 108 C162 134 167 156 160 176 C153 190 146 176 138 188 C130 199 122 182 112 194 C102 204 94 184 84 194 C74 201 68 183 60 189 C50 194 44 178 41 162 C38 146 38 128 38 108 Z',
   'M30 112 C25 56 58 22 100 22 C142 22 175 56 170 112 C169 128 176 146 173 160 C171 176 168 188 156 192 C146 194 142 182 136 180 C132 192 124 198 114 195 C106 192 104 184 100 182 C96 184 94 192 86 195 C76 198 68 192 64 180 C58 182 54 194 44 192 C32 188 29 176 27 160 C24 146 31 128 30 112 Z'],
  ['<ellipse cx="72" cy="40" rx="24" ry="13" fill="#fff" opacity=".6" transform="rotate(-24 72 40)" />', '<ellipse cx="68" cy="48" rx="26" ry="13" fill="#fff" opacity=".6" transform="rotate(-24 68 48)" />'],
  ['<circle cx="52" cy="66" r="3.4"', '<circle cx="46" cy="72" r="3.4"'],
  ['<ellipse cx="128" cy="170" rx="22" ry="8" fill="#fff" opacity=".22" />', '<ellipse cx="130" cy="172" rx="26" ry="7" fill="#fff" opacity=".3" />'],
  ['<ellipse cx="100" cy="110" rx="86" ry="90"', '<ellipse cx="100" cy="112" rx="96" ry="86"'],
  ['<path d="M46 136 C58 142 80 146 100 146 C120 146 142 142 154 136 L160 176 C152 190 128 188 100 188 C72 188 48 190 40 176 Z"', '<path d="M42 138 C56 146 80 150 100 150 C120 150 144 146 158 138 L163 160 C150 171 128 173 100 173 C72 173 50 171 37 160 Z"'],
  ['<path d="M84 143 L100 170 L116 143"', '<path d="M84 147 L100 165 L116 147"'],
  ['<path d="M82 142 C76 160 90 174 100 170 C110 174 124 160 118 142"', '<path d="M82 146 C78 158 90 168 100 165 C110 168 122 158 118 146"'],
  ['<circle cx="100" cy="171" r="5.2"', '<circle cx="100" cy="166" r="5.2"'],
  ['cx={100 + k * 36} cy="102"', 'cx={100 + k * 40} cy="104"'],
  ['const sx = side === "l" ? 54 : 146', 'const sx = side === "l" ? 44 : 156'],
  ['<path d="M42 86 C40 30 160 30 158 86"', '<path d="M32 88 C30 26 170 26 168 88"'],
  ['<rect x="31" y="74" width="16" height="38" rx="8" fill="#1e1e30" /><rect x="153" y="74" width="16" height="38" rx="8" fill="#1e1e30" />', '<rect x="21" y="76" width="16" height="38" rx="8" fill="#1e1e30" /><rect x="163" y="76" width="16" height="38" rx="8" fill="#1e1e30" />'],
  ['<rect x="35" y="80" width="5" height="26" rx="2.5" fill="#3a3a58" /><rect x="160" y="80" width="5" height="26" rx="2.5" fill="#3a3a58" />', '<rect x="25" y="82" width="5" height="26" rx="2.5" fill="#3a3a58" /><rect x="170" y="82" width="5" height="26" rx="2.5" fill="#3a3a58" />'],
]
for (const [a] of P) if (!s.includes(a)) { console.log('MISSING', a.slice(0, 50)); process.exit(1) }
for (const [a, b] of P) s = s.replace(a, b)
fs.writeFileSync(f, s); console.log('edited', f)
