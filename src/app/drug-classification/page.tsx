"use client"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { DRUG_CHAPTERS } from "@/data/drug-classification"

export default function DrugClassificationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Drug <span className="text-[#e31e24]">Classification</span></h1>
      <p className="mt-1 text-sm text-muted-foreground">Every drug class as a colour chart, with doses and brand names. Open a chapter, then switch between the chart and a simple list.</p>
      <div className="mt-6 space-y-3">
        {DRUG_CHAPTERS.map((c) => (
          <Link key={c.id} href={`/drug-classification/${c.id}`} className="flex items-center gap-4 rounded-3xl border border-[#f3c9c0] bg-white px-4 py-4 shadow-sm transition active:scale-[0.99] hover:border-[#e31e24]/50">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-[#e31e24] bg-[#fde4de] text-xl font-extrabold text-[#e31e24]">{c.number}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-extrabold leading-snug text-[#7a1212]">{c.title}</span>
              <span className="mt-0.5 block text-xs italic leading-relaxed text-muted-foreground">{c.charts.map((x) => x.title).join(", ")}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
