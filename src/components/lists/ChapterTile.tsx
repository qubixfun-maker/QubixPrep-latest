"use client"

import Link from "next/link"
import { ChevronRight, Lock } from "lucide-react"
import type { ReactNode } from "react"

/** Bright chapter tile shared by the Flashcards and Mind maps lists. Colours come from the subject hue. */
export default function ChapterTile({ href, locked, index, title, badge, hue, icon, extra }: { href: string; locked?: boolean; index: number; title: string; badge: string; hue: number; icon: ReactNode; extra?: ReactNode }) {
  const h2 = (hue + 35) % 360
  const body = (
    <div className={`group relative flex min-w-0 items-center gap-3.5 overflow-hidden rounded-2xl border p-4 pl-5 shadow-sm transition duration-300 md:p-5 md:pl-6 ${locked ? "opacity-60" : "hover:-translate-y-1 hover:shadow-lg"}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 95% 96%) 0%, #ffffff 62%)`, borderColor: `hsl(${hue} 55% 84%)` }}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: `linear-gradient(180deg, hsl(${hue} 85% 55%), hsl(${h2} 85% 55%))` }} />
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-md md:h-14 md:w-14" style={{ background: `linear-gradient(145deg, hsl(${hue} 85% 58%), hsl(${h2} 80% 50%))` }}>
        {locked ? <Lock className="h-5 w-5" /> : icon}
        <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border bg-white px-1 text-[10px] font-black shadow" style={{ color: `hsl(${hue} 70% 32%)`, borderColor: `hsl(${hue} 55% 84%)` }}>{index}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words text-[15px] font-extrabold leading-snug text-slate-900">{title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: `hsl(${hue} 85% 92%)`, color: `hsl(${hue} 65% 28%)` }}>{locked ? "Upgrade to unlock" : badge}</span>
          {extra}
        </div>
      </div>
      {!locked && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition group-hover:translate-x-1" style={{ background: `hsl(${hue} 85% 92%)`, color: `hsl(${hue} 65% 30%)` }}><ChevronRight className="h-4 w-4" /></span>}
    </div>
  )
  return locked ? <div className="min-w-0 cursor-not-allowed">{body}</div> : <Link href={href} className="block min-w-0">{body}</Link>
}
