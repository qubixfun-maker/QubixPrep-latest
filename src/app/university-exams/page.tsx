"use client"

import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { usePlan } from "@/hooks/use-plan"

const ITEMS = [
  { name: "Long Answers", href: "/long-answers", emoji: "✍️", bg: "#e4f5e0", fg: "#2f6b2a", body: "Model essays and structured answers for theory papers, subject by subject.", foot: "Open Long Answers", needsBasic: false },
  { name: "Spot & Identify", href: "/spotters", emoji: "🔬", bg: "#ffe6ed", fg: "#8d3c61", body: "Instruments, specimens, slides and histology, with detailed descriptions.", foot: "Open Spotters", needsBasic: true },
]

export default function UniversityExams() {
  const { isBasic } = usePlan()
  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-[#f1ecff] via-white to-white">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Notes</div>
          <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">University exams</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Everything for your theory and practical papers.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ITEMS.map((it) => (
            <Link key={it.name} href={it.href} className="group overflow-hidden rounded-[22px] border border-[#e6defc] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
              <div className="flex h-[120px] items-center justify-between p-5" style={{ background: it.bg, color: it.fg }}>
                <h2 className="text-[22px] font-black leading-tight tracking-tight">{it.name}</h2>
                <span className="qp-float text-[56px] leading-none">{it.emoji}</span>
              </div>
              <div className="p-4">
                <p className="min-h-[40px] text-[13px] text-muted-foreground">{it.body}</p>
                <div className="mt-3 flex items-center justify-between text-[12px] font-bold">
                  <span className="text-primary">{it.foot} →</span>
                  {it.needsBasic && !isBasic && <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0c7] px-2 py-1 text-[10px] font-black text-[#96600b]"><Lock className="h-3 w-3" /> SCHOLAR</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
