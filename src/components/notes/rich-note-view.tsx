"use client"
// Draws a structured RichNote in the QubixPrep exam-notes style (white page, blue header tab,
// green / yellow / pink boxes, blue table headers, vertical trees and flowcharts).
// Always light-themed like the printed reference. Member copies are protected the same way as NoteBody:
// faint email watermark, no copy / right-click, and no printing. Admins get a "Download PDF" button.
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import type { Block, RichNote, Tone } from "@/lib/richnotes/schema"
import { Printer } from "lucide-react"

const NAVY = "#14295c"
const BLUE = "#3b78d4"
const TH_BG = "#8fb3e8"
const TONES: Record<Tone, { head: string; body: string; border: string }> = {
  green: { head: "#2e8b57", body: "#e8f5ec", border: "#2e8b57" },
  yellow: { head: "#e5b020", body: "#fdf3d6", border: "#e5b020" },
  pink: { head: "#b2325a", body: "#fbe4ec", border: "#b2325a" },
}
const BRANCH_COLORS = ["#3b78d4", "#1f9d8f", "#7a4fb0", "#b2325a", "#d9822b", "#4a7a2e"]
const hand = { fontFamily: "'Gochi Hand', cursive" } as const

/** **bold phrase** -> bold + yellow underline;  [[key term]] -> maroon bold. */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g)
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ color: NAVY, textDecoration: "underline", textDecorationColor: "#f0b429", textDecorationThickness: "2px", textUnderlineOffset: "3px" }}>{p.slice(2, -2)}</strong>
    if (p.startsWith("[[") && p.endsWith("]]")) return <span key={i} style={{ color: "#8b1d3f", fontWeight: 700 }}>{p.slice(2, -2)}</span>
    return <Fragment key={i}>{p}</Fragment>
  })
}

function Heading({ children, n }: { children: ReactNode; n?: number }) {
  return (
    <h2 style={{ ...hand, color: NAVY, borderBottom: `2px solid ${NAVY}`, breakAfter: "avoid" }} className="mt-8 mb-3 pb-1 text-xl uppercase tracking-wide">
      {n ? `${n}. ` : ""}{children}
    </h2>
  )
}

function Box({ tone, title, children }: { tone: Tone; title: string; children: ReactNode }) {
  const t = TONES[tone]
  return (
    <div className="my-3 overflow-hidden rounded-lg" style={{ border: `1.5px solid ${t.border}`, breakInside: "avoid" }}>
      <div className="px-3 py-1.5 text-white" style={{ ...hand, background: t.head }}>{title}</div>
      <div className="px-3.5 py-2.5 leading-relaxed" style={{ background: t.body }}>{children}</div>
    </div>
  )
}

function TreeBlock({ b }: { b: Extract<Block, { type: "tree" }> }) {
  const n = b.branches.length
  const lines = n <= 4
  const cols = Math.min(n, lines ? 4 : 3)
  return (
    <div className="my-4" style={{ breakInside: "avoid" }}>
      {b.title && <h3 style={{ ...hand, color: BLUE }} className="mb-2 text-lg">{b.title}</h3>}
      <div className="mx-auto w-fit max-w-full rounded-lg px-5 py-2 text-center text-white" style={{ ...hand, background: NAVY }}>{b.root}</div>
      {lines && <div className="mx-auto h-3 w-px hidden sm:block" style={{ background: NAVY }} />}
      <div className="mt-2 grid gap-2 sm:mt-0 sm:[grid-template-columns:var(--cols)]" style={{ ["--cols" as any]: `repeat(${cols}, minmax(0, 1fr))` }}>
        {b.branches.map((br, i) => {
          const c = BRANCH_COLORS[i % BRANCH_COLORS.length]
          return (
            <div key={i} className="relative sm:pt-3">
              {lines && <>
                <div className="absolute left-1/2 top-0 hidden h-3 w-px sm:block" style={{ background: NAVY }} />
                {i > 0 && <div className="absolute left-0 top-0 hidden h-px w-1/2 sm:block" style={{ background: NAVY }} />}
                {i < n - 1 && <div className="absolute right-0 top-0 hidden h-px w-1/2 sm:block" style={{ background: NAVY }} />}
              </>}
              <div className="rounded-md px-2 py-1.5 text-center text-sm text-white" style={{ ...hand, background: c }}>{inline(br.label)}</div>
              <div className="mt-1.5 space-y-1.5">
                {br.items.map((it, j) => <div key={j} className="rounded-md bg-white px-2 py-1 text-center text-[13px] leading-snug" style={{ border: `1.2px solid ${c}` }}>{inline(it)}</div>)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FlowBlock({ b }: { b: Extract<Block, { type: "flow" }> }) {
  return (
    <div className="my-4 flex flex-col items-center" style={{ breakInside: "avoid" }}>
      {b.title && <h3 style={{ ...hand, color: BLUE }} className="mb-2 self-start text-lg">{b.title}</h3>}
      {b.steps.map((s, i) => (
        <Fragment key={i}>
          <div className="w-full max-w-md rounded-lg px-3 py-1.5 text-center text-[14px]" style={s.key ? { background: "#fdf3d6", border: "2px solid #e5b020", fontWeight: 700 } : { background: "#eaf1fc", border: `1.5px solid ${BLUE}` }}>{inline(s.text)}</div>
          {i < b.steps.length - 1 && <div className="leading-none" style={{ color: BLUE, fontSize: 18 }}>↓</div>}
        </Fragment>
      ))}
    </div>
  )
}

function TableBlock({ b }: { b: Extract<Block, { type: "table" }> }) {
  return (
    <div className="my-3" style={{ breakInside: "avoid" }}>
      {b.title && <h3 style={{ ...hand, color: BLUE }} className="mb-1.5 text-lg">{b.title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px] leading-snug">
          <thead><tr>{b.headers.map((h, i) => <th key={i} className="border border-slate-400 px-2 py-1.5 text-center font-normal" style={{ ...hand, background: TH_BG, color: NAVY }}>{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border border-slate-400 px-2 py-1.5 align-top" style={j === 0 ? { fontWeight: 600 } : undefined}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "para": return <p className="my-2 leading-relaxed">{inline(b.text)}</p>
    case "bullets": return (
      <div className="my-2" style={{ breakInside: "avoid" }}>
        {b.title && <h3 style={{ ...hand, color: BLUE }} className="mb-1 text-lg">{b.title}</h3>}
        <ul className="space-y-1 pl-5" style={{ listStyle: "disc" }}>{b.items.map((it, i) => <li key={i} className="leading-relaxed marker:text-[#3b78d4]">{inline(it)}</li>)}</ul>
      </div>)
    case "table": return <TableBlock b={b} />
    case "tree": return <TreeBlock b={b} />
    case "flow": return <FlowBlock b={b} />
    case "callout": return (
      <Box tone={b.tone} title={b.title}>
        {b.text && <p>{inline(b.text)}</p>}
        {b.items && <ul className="space-y-1 pl-5" style={{ listStyle: "disc" }}>{b.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</ul>}
      </Box>)
    case "mnemonic": return (
      <Box tone="yellow" title={b.title || "Mnemonic"}>
        <p className="text-lg font-bold" style={{ color: "#8b1d3f" }}>{b.text}</p>
        {b.expansion && b.expansion.length > 0 && <ul className="mt-1 space-y-0.5 pl-5" style={{ listStyle: "disc" }}>{b.expansion.map((e, i) => <li key={i}>{inline(e)}</li>)}</ul>}
      </Box>)
  }
}

function watermarkUrl(text: string) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='200'><text x='20' y='110' transform='rotate(-22 180 100)' font-family='sans-serif' font-size='15' font-weight='700' fill='rgba(60,40,120,0.10)'>${esc}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function RichNoteView({ note, subjectName, topicNo, protectWith, allowPrint = false }: {
  note: RichNote; subjectName?: string; topicNo?: number; protectWith?: string; allowPrint?: boolean
}) {
  const mark = useMemo(() => (protectWith ? watermarkUrl(protectWith) : ""), [protectWith])
  const block = protectWith ? (e: { preventDefault: () => void }) => e.preventDefault() : undefined
  const footerLeft = `${subjectName || "Notes"} · QubixPrep${topicNo ? ` · Topic ${topicNo}` : ""}`
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  const printable = allowPrint || !protectWith
  const ep = note.examPointers
  const hasEp = !!(ep.m10 || ep.m5 || ep.m3 || ep.viva)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const articleEl = (
    <article className="qp-rich-root relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-[15.5px] text-[#26283d] shadow-sm md:p-9" style={{ fontFamily: "'Itim', system-ui, sans-serif" }}>
      <div className="qp-no-print mb-4 flex justify-end">
        <div className="rounded-sm px-3 py-1 text-xs text-white" style={{ background: BLUE }}>{note.title}</div>
      </div>
      <div className="flex items-center justify-between gap-3 pb-3" style={{ borderBottom: `2.5px solid ${NAVY}` }}>
        <img src="/brand/logo-horizontal-dark.png" alt="QubixPrep" className="h-14 w-auto rounded" />
        <span className="text-sm" style={{ ...hand, color: BLUE }}>{subjectName ? `${subjectName} notes` : "Notes"}</span>
      </div>
      <h1 style={{ ...hand, color: NAVY }} className="mt-4 text-center text-2xl uppercase leading-tight md:text-3xl">{note.title}</h1>
      {note.citation && <p className="mt-1 text-center text-sm text-slate-500">{note.citation}</p>}

      <Box tone="green" title="Definition (write this first)">
        <p>{inline(note.definition.text)}</p>
        {note.definition.simple && <p className="mt-1.5 text-[14px]"><span style={{ color: "#8b1d3f", fontWeight: 700 }}>In simple words: </span>{inline(note.definition.simple)}</p>}
      </Box>

      {note.answerGuide.length > 0 && (
        <Box tone="yellow" title="How to answer a 10-mark question">
          <p>{note.answerGuide.map((g, i) => <Fragment key={i}>{i > 0 && " → "}<strong style={{ color: NAVY }}>{g}</strong></Fragment>)}</p>
        </Box>
      )}

      {note.sections.map((s, i) => (
        <section key={i}>
          <Heading n={i + 1}>{s.heading}</Heading>
          {s.blocks.map((b, j) => <BlockView key={j} b={b} />)}
        </section>
      ))}

      {hasEp && (
        <Box tone="yellow" title="Exam pointers">
          <div className="space-y-1.5">
            {ep.m10 && <p><span style={{ color: "#8b1d3f", fontWeight: 700 }}>10 marks: </span>{inline(ep.m10)}</p>}
            {ep.m5 && <p><span style={{ color: "#8b1d3f", fontWeight: 700 }}>5 marks: </span>{inline(ep.m5)}</p>}
            {ep.m3 && <p><span style={{ color: "#8b1d3f", fontWeight: 700 }}>3 marks: </span>{inline(ep.m3)}</p>}
            {ep.viva && <p><span style={{ color: "#8b1d3f", fontWeight: 700 }}>Viva: </span>{inline(ep.viva)}</p>}
          </div>
        </Box>
      )}

      {note.recap.length > 0 && (
        <Box tone="pink" title="Quick recap">
          <ul className="space-y-1 pl-5" style={{ listStyle: "disc" }}>{note.recap.map((r, i) => <li key={i}>{inline(r)}</li>)}</ul>
        </Box>
      )}

      <div className="qp-no-print mt-5 flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-500"><span>{footerLeft}</span></div>
      {mark && <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: mark, backgroundRepeat: "repeat" }} />}
    </article>
  )

  return (
    <div className={protectWith ? "relative select-none [-webkit-touch-callout:none]" : "relative"} onContextMenu={block} onCopy={block} onCut={block} onDragStart={block}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Itim&display=swap');
        .qp-print-only { display: none; }
        @media print {
          @page { size: A4; margin: 20mm 14mm 18mm 14mm;
            @top-right { content: "${esc(note.title)}"; font: bold 11px sans-serif; color: ${BLUE}; text-align: right; }
            @bottom-left { content: "${esc(footerLeft)}"; font: 11px sans-serif; color: #666; }
            @bottom-right { content: "Page " counter(page) "/" counter(pages); font: 11px sans-serif; color: #666; } }
          html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
          body > :not(.qp-print-only) { display: none !important; }
          .qp-print-only { display: block !important; }
          .qp-print-only .qp-rich-root { border: 0 !important; box-shadow: none !important; padding: 0 !important; }
          .qp-no-print { display: none !important; }
          .qp-print-only, .qp-print-only * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {allowPrint && (
        <div className="qp-no-print mb-3 flex justify-end">
          <button onClick={() => window.print()} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><Printer className="h-4 w-4" /> Download PDF</button>
        </div>
      )}

      {articleEl}
      {mounted && printable && createPortal(<div className="qp-print-only">{articleEl}</div>, document.body)}
    </div>
  )
}
