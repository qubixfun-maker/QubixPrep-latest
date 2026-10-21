// Top 100 page: big illustrated subject cards for the free note packs, no heading, no "topics so far". Safe to run twice.
const fs = require("fs")
const rd = (f) => fs.readFileSync(f, "utf8")
const wr = (f, s) => fs.writeFileSync(f, s)
function edit(f, label, fn) { const s = rd(f); const r = fn(s); if (r === null) console.log(label + ": already done / anchor missing"); else { wr(f, r); console.log(label + ": done") } }
function once(s, a, b) { return s.split(a).length - 1 === 1 ? s.replace(a, () => b) : null }

// 1. Art card can open in a new tab (the PDF viewer closes itself)
edit("src/components/subjects/SubjectArtCard.tsx", "art card", (s) => {
  if (s.includes("newTab")) return null
  let r = once(s, 'export function SubjectArtCard({ href, name, subtitle, cta = "Open" }: { href: string; name: string; subtitle: string; cta?: string }) {', 'export function SubjectArtCard({ href, name, subtitle, cta = "Open", newTab = false }: { href: string; name: string; subtitle: string; cta?: string; newTab?: boolean }) {')
  if (!r) return null
  return once(r, '<Link href={href} className="group block h-full focus-visible:outline-none">', '<Link href={href} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group block h-full focus-visible:outline-none">')
})

// 2. Top 100 page
edit("src/app/top-100/page.tsx", "top100 page", (s) => {
  if (s.includes("SubjectArtCard")) return null
  let r = s
  const sec = /      \{\(packsLoading \|\| packs\.length > 0\) && \([\s\S]*?\n        <\/section>\n      \)\}\n\n(?=      \{loading \? \()/
  if (!sec.test(r)) return null
  r = r.replace(sec, `      {(packsLoading || packs.length > 0) && (
        packsLoading ? (
          <div className="h-24 flex items-center justify-center"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((p: any) => (
              <SubjectArtCard key={p.id} href={\`/notes-packs/\${p.id}\`} newTab cta="Read free"
                name={String(p.title).replace(/\\s*\\d+\\s+(most\\s+)?important.*$/i, "").trim() || p.title}
                subtitle={\`100 most important topics\${p.year ? " · " + p.year + " year" : ""}\`} />
            ))}
          </div>
        )
      )}

`)
  r = r.replace(/\n        <span className="mt-4 inline-block rounded-full bg-white\/80[^\n]*so far<\/span>/, "")
  r = once(r, ") : groups.length === 0 ? (\n        <div className=\"rounded-2xl glass p-10 text-center text-muted-foreground\">{total === 0 ? \"Topics are being picked. Check back soon!\" : \"No topics match your search.\"}</div>\n      ) : (", ") : groups.length === 0 ? (\n        packs.length > 0 ? null : <div className=\"rounded-2xl glass p-10 text-center text-muted-foreground\">{total === 0 ? \"Topics are being picked. Check back soon!\" : \"No topics match your search.\"}</div>\n      ) : (")
  if (!r) return null
  return r.replace(/^("use client"[^\n]*\n)/, `$1import { SubjectArtCard } from "@/components/subjects/SubjectArtCard"\n`)
})
