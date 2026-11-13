"use client"
// Clean full-width reader for a RichNote (shell: ZoomReader). Admin tools sit behind a small gear button.
import { useState, type ReactNode } from "react"
import { Printer, Settings2 } from "lucide-react"
import { RichNoteView } from "@/components/notes/rich-note-view"
import { ZoomReader } from "@/components/notes/zoom-reader"
import type { RichNote } from "@/lib/richnotes/schema"

export function RichReader({ note, title, backHref, subjectName, topicNo, protectWith, isAdmin = false, adminExtras }: {
  note: RichNote; title: string; backHref: string; subjectName?: string; topicNo?: number; protectWith?: string; isAdmin?: boolean; adminExtras?: ReactNode
}) {
  const [adminOpen, setAdminOpen] = useState(false)
  return (
    <ZoomReader
      title={title}
      backHref={backHref}
      barExtra={isAdmin ? <button onClick={() => setAdminOpen((v) => !v)} aria-label="Admin tools" className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><Settings2 className="h-4 w-4" /></button> : null}
      belowBar={isAdmin && adminOpen ? (
        <div className="qp-no-print flex flex-wrap items-center gap-2 border-b bg-slate-50 px-3 py-2 text-xs">
          {adminExtras}
          <button onClick={() => window.print()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 font-bold text-slate-700"><Printer className="h-3.5 w-3.5" /> Download PDF</button>
        </div>
      ) : null}
    >
      <RichNoteView clean note={note} subjectName={subjectName} topicNo={topicNo} protectWith={protectWith} allowPrint={isAdmin} />
    </ZoomReader>
  )
}
