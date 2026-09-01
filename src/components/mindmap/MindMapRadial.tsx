"use client"

import { useState, useLayoutEffect, useRef } from "react"
import styles from "./MindMapRadial.module.css"

export type MindmapNode = {
  name: string
  definition?: string
  mechanism?: string
  examples?: string
  branches?: MindmapNode[]
}

const METAL_CLASSES = [styles.metalPurple, styles.metalTeal, styles.metalCoral, styles.metalPink]
const GLOW_COLORS = ["#7c5ce0", "#1d9e75", "#d85a30", "#d4537e"]
const LINE_COLORS = ["#a78bfa", "#4fd8ac", "#f0997b", "#ed93b1"]
const PULSE_COLORS = ["#e4d9ff", "#d3fbec", "#ffe4d8", "#ffe1ec"]

const STAGE_SIZE = 900
const RADIUS = 260

type LineCoord = { x1: number; y1: number; x2: number; y2: number; len: number; idx: number }

export default function MindMapRadial({ root }: { root: MindmapNode }) {
  const [stack, setStack] = useState<MindmapNode[]>([root])
  const current = stack[stack.length - 1]
  const branches = current.branches || []

  const stageRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const branchRefs = useRef<(HTMLDivElement | null)[]>([])
  const [lines, setLines] = useState<LineCoord[]>([])

  function positionFor(i: number, total: number) {
    const angle = (i * (360 / total) - 90) * (Math.PI / 180)
    return { x: Math.cos(angle) * RADIUS, y: Math.sin(angle) * RADIUS }
  }

  useLayoutEffect(() => {
    function measure() {
      const stageEl = stageRef.current
      const centerEl = centerRef.current
      if (!stageEl || !centerEl || branches.length === 0) {
        setLines([])
        return
      }
      const stageBox = stageEl.getBoundingClientRect()
      const centerBox = centerEl.getBoundingClientRect()
      const cx = centerBox.left + centerBox.width / 2 - stageBox.left
      const cy = centerBox.top + centerBox.height / 2 - stageBox.top

      const newLines: LineCoord[] = []
      branches.forEach((_, i) => {
        const el = branchRefs.current[i]
        if (!el) return
        const box = el.getBoundingClientRect()
        const bx = box.left + box.width / 2 - stageBox.left
        const by = box.top + box.height / 2 - stageBox.top

        const dx = bx - cx
        const dy = by - cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const ux = dx / dist
        const uy = dy / dist

        const halfW = box.width / 2
        const halfH = box.height / 2
        const bScaleX = Math.abs(ux) > 0.0001 ? halfW / Math.abs(ux) : Infinity
        const bScaleY = Math.abs(uy) > 0.0001 ? halfH / Math.abs(uy) : Infinity
        const edgeDist = Math.min(bScaleX, bScaleY)
        const x2 = bx - ux * edgeDist
        const y2 = by - uy * edgeDist

        const cHalfW = centerBox.width / 2
        const cHalfH = centerBox.height / 2
        const cScaleX = Math.abs(ux) > 0.0001 ? cHalfW / Math.abs(ux) : Infinity
        const cScaleY = Math.abs(uy) > 0.0001 ? cHalfH / Math.abs(uy) : Infinity
        const centerEdgeDist = Math.min(cScaleX, cScaleY)
        const x1 = cx + ux * centerEdgeDist
        const y1 = cy + uy * centerEdgeDist

        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        newLines.push({ x1, y1, x2, y2, len, idx: i })
      })
      setLines(newLines)
    }

    const raf = requestAnimationFrame(measure)
    window.addEventListener("resize", measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measure)
    }
  }, [branches, stack])

  return (
    <div className={styles.wrap}>
      {stack.length > 1 && (
        <div className={styles.crumbs}>
          {stack.map((n, i) => (
            <span key={i}>
              {i > 0 && <span className={styles.sep}>/</span>}
              <span
                className={i < stack.length - 1 ? styles.crumbLink : styles.crumbCurrent}
                onClick={() => i < stack.length - 1 && setStack(stack.slice(0, i + 1))}
              >
                {n.name}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className={styles.stage} ref={stageRef}>
        <svg className={styles.svg} viewBox={`0 0 ${STAGE_SIZE} ${STAGE_SIZE}`}>
          {lines.map((l) => (
            <g key={l.idx}>
              <line
                className={styles.branchLine}
                style={{ ["--glow" as any]: GLOW_COLORS[l.idx % GLOW_COLORS.length] }}
                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={LINE_COLORS[l.idx % LINE_COLORS.length]}
              />
              <line
                className={styles.pulse}
                style={{
                  ["--glow" as any]: GLOW_COLORS[l.idx % GLOW_COLORS.length],
                  ["--len" as any]: l.len,
                  strokeDasharray: `14 ${Math.max(l.len - 14, 1)}`,
                }}
                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={PULSE_COLORS[l.idx % PULSE_COLORS.length]}
              />
            </g>
          ))}
        </svg>

        <div className={styles.centerNode} ref={centerRef}>
          <div className={styles.centerTitle}>{current.name}</div>
          {current.definition && <div className={styles.centerSub}>{current.definition}</div>}
          {current.mechanism && <div className={styles.centerSub}>{current.mechanism}</div>}
          {current.examples && <div className={styles.centerSub}>{current.examples}</div>}
          {branches.length > 0 && !current.definition && (
            <div className={styles.centerSub}>Click a branch to explore</div>
          )}
        </div>

        {branches.map((b, i) => {
          const pos = positionFor(i, branches.length)
          return (
            <div
              key={i}
              ref={(el) => { branchRefs.current[i] = el }}
              className={`${styles.branchNode} ${METAL_CLASSES[i % METAL_CLASSES.length]}`}
              style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
              onClick={() => setStack([...stack, b])}
            >
              <div className={styles.branchName}>{b.name}</div>
              <div className={styles.branchHint}>{b.definition}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
