"use client"

import { useState, useRef } from "react"

export type MindmapNode = {
  name: string
  definition?: string
  mechanism?: string
  examples?: string
  branches?: MindmapNode[]
}

type ColumnState = {
  items: MindmapNode[]
  selectedIndex: number | null
  // Accent color inherited down from whichever top-level branch this column
  // descends from, so the whole drill-down path stays visually tied to its origin.
  color?: string
}

const COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#D4537E", "#378ADD", "#BA7517"]

export default function MindMapCanvas({ root }: { root: MindmapNode }) {
  const [columns, setColumns] = useState<ColumnState[]>([
    { items: root.branches || [], selectedIndex: null },
  ])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function selectItem(colIndex: number, itemIndex: number, item: MindmapNode) {
    setColumns((prev) => {
      const next = prev.slice(0, colIndex + 1)
      next[colIndex] = { ...next[colIndex], selectedIndex: itemIndex }
      const hasChildren = !!(item.branches && item.branches.length > 0)
      if (hasChildren) {
        const inheritedColor = colIndex === 0 ? COLORS[itemIndex % COLORS.length] : next[colIndex].color
        next.push({ items: item.branches!, selectedIndex: null, color: inheritedColor })
      }
      return next
    })
    // Scroll the newly-opened column into view.
    setTimeout(() => {
      containerRef.current?.scrollTo({ left: containerRef.current.scrollWidth, behavior: "smooth" })
    }, 50)
  }

  async function toggleFullscreen() {
    if (!wrapRef.current) return
    if (!document.fullscreenElement) {
      await wrapRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  if (!root.branches || root.branches.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground rounded-2xl border bg-card/40">
        This mind map has no branches yet.
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className={`h-full w-full flex flex-col gap-2 ${isFullscreen ? "bg-background p-4" : ""}`}
    >
      <div className="flex justify-end shrink-0">
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="w-8 h-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
        >
          {isFullscreen ? "⤡" : "⤢"}
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex gap-3 overflow-x-auto overflow-y-hidden rounded-2xl border bg-card/40 p-3"
      >
        {columns.map((col, colIndex) => (
          <div
            key={colIndex}
            className="w-[300px] min-w-[280px] max-w-[320px] shrink-0 h-full overflow-y-auto flex flex-col gap-2 bg-card border rounded-xl p-3"
          >
            {col.items.map((item, itemIndex) => {
              const isSelected = col.selectedIndex === itemIndex
              const hasChildren = !!(item.branches && item.branches.length > 0)
              const hasDetail = !!(item.definition || item.mechanism || item.examples)
              const accentColor = colIndex === 0 ? COLORS[itemIndex % COLORS.length] : col.color

              return (
                <div
                  key={itemIndex}
                  onClick={() => selectItem(colIndex, itemIndex, item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-accent/10 border-primary ring-1 ring-primary/40"
                      : "border-border hover:border-primary/40 hover:bg-accent/5"
                  }`}
                  style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3, borderLeftStyle: "solid" } : undefined}
                >
                  <h3 className="font-semibold text-sm text-foreground">{item.name}</h3>

                  {item.definition && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      <span className="font-semibold text-foreground/80">Definition: </span>{item.definition}
                    </p>
                  )}
                  {item.mechanism && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      <span className="font-semibold text-foreground/80">Mechanism: </span>{item.mechanism}
                    </p>
                  )}
                  {item.examples && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      <span className="font-semibold text-foreground/80">Examples: </span>{item.examples}
                    </p>
                  )}

                  {hasChildren && (
                    <div className="mt-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                      <span>{item.branches!.length} subtopic{item.branches!.length === 1 ? "" : "s"}</span>
                      <span>→</span>
                    </div>
                  )}
                  {!hasChildren && !hasDetail && (
                    <p className="text-xs text-muted-foreground/70 mt-2 italic">No further detail yet.</p>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center shrink-0">
        Click a topic to open its sub-topics in a new column - scroll right to go deeper
      </p>
    </div>
  )
}
