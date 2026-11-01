"use client"
import { SubjectArtCard } from "@/components/subjects/SubjectArtCard"
import { getSubjectYear } from "@/lib/subject-year"

/** Subject cards grouped under their MBBS year (1st, 2nd, 3rd, 4th), in the order the list already has. */
export function SubjectYearGrid({ items, hrefBase, subtitle }: { items: any[]; hrefBase: string; subtitle: string }) {
  const groups: { label: string; items: { id: string; name: string }[] }[] = []
  items.forEach((s) => {
    const label = getSubjectYear(s.name).label
    const g = groups[groups.length - 1]
    if (g && g.label === label) g.items.push(s)
    else groups.push({ label, items: [s] })
  })
  return (
    <div className="space-y-9">
      {groups.map((g) => (
        <section key={g.label} className="space-y-4">
          <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-primary">
            {g.label}
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold normal-case tracking-normal text-muted-foreground">{g.items.length} {g.items.length === 1 ? "subject" : "subjects"}</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {g.items.map((s) => <SubjectArtCard key={s.id} href={`${hrefBase}/${s.id}`} name={s.name} subtitle={subtitle} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
