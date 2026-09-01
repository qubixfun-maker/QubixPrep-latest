"use client"

import { useState, useRef, useMemo, useCallback } from "react"
import styles from "./MindMapCanvas.module.css"

export type MindmapNode = {
  name: string
  definition?: string
  mechanism?: string
  examples?: string
  branches?: MindmapNode[]
}

const COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#D4537E", "#378ADD", "#BA7517"]

const ROOT_W = 200
const ROOT_H = 64
const BASE_NODE_H = 46

type LaidOutNode = {
  path: string
  label: string
  detail: string | null
  x: number; y: number; w: number; h: number
  side: "left" | "right"
  depth: number
  color: string
  isRoot: boolean
  hasChildren: boolean
  isExpanded: boolean
}

type Line = { x1: number; y1: number; x2: number; y2: number; color: string; opacity: number }

const MAX_DETAIL_CHARS = 220

function nodeDetailText(node: MindmapNode): string | null {
  const parts = [node.definition, node.mechanism, node.examples].filter(Boolean)
  if (parts.length === 0) return null
  const full = parts.join(" ")
  return full.length > MAX_DETAIL_CHARS ? full.slice(0, MAX_DETAIL_CHARS).trim() + "..." : full
}

// Rough estimate of how tall a detail block will render at a given card width,
// so card height scales with actual text length instead of a fixed guess.
function estimateDetailHeight(text: string, width: number): number {
  const usableWidth = Math.max(60, width - 24)
  const avgCharWidth = 5.8
  const charsPerLine = Math.max(8, Math.floor(usableWidth / avgCharWidth))
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine))
  return lines * 15 + 12
}

function layoutChildren(
  parentNode: MindmapNode,
  parentPath: string,
  parentX: number, parentY: number, parentW: number, parentH: number,
  side: "left" | "right",
  depth: number,
  color: string,
  expandedPaths: Record<string, boolean>,
  nodes: LaidOutNode[],
  lines: Line[]
) {
  const branches = parentNode.branches || []
  if (branches.length === 0) return

  const childW = Math.max(110, 170 - depth * 12)
  const vGap = Math.max(14, 22 - depth * 2)
  const gap = Math.max(28, 40 - depth * 4)
  const childX = side === "left" ? parentX - childW - gap : parentX + parentW + gap

  const infos = branches.map((child, i) => {
    const childPath = parentPath + "|" + i
    const childExpanded = !!expandedPaths[childPath]
    const childHasChildren = !!(child.branches && child.branches.length > 0)
    const detail = nodeDetailText(child)
    const showInlineDetail = childExpanded && !!detail && !childHasChildren
    const height = showInlineDetail ? BASE_NODE_H + estimateDetailHeight(detail!, childW) : BASE_NODE_H
    return { child, childPath, childExpanded, childHasChildren, detail, height }
  })

  const totalHeight = infos.reduce((sum, info) => sum + info.height, 0) + vGap * (infos.length - 1)
  let currentY = parentY + parentH / 2 - totalHeight / 2

  infos.forEach((info) => {
    const childY = currentY

    nodes.push({
      path: info.childPath,
      label: info.child.name,
      detail: info.childExpanded ? info.detail : null,
      x: childX, y: childY, w: childW, h: info.height,
      side, depth, color,
      isRoot: false,
      hasChildren: info.childHasChildren || !!info.detail,
      isExpanded: info.childExpanded,
    })

    const startEdgeX = side === "left" ? parentX : parentX + parentW
    const startEdgeY = parentY + parentH / 2
    const endEdgeX = side === "left" ? childX + childW : childX
    const endEdgeY = childY + info.height / 2
    lines.push({ x1: startEdgeX, y1: startEdgeY, x2: endEdgeX, y2: endEdgeY, color, opacity: Math.max(0.25, 0.55 - depth * 0.08) })

    if (info.childExpanded && info.childHasChildren) {
      layoutChildren(info.child, info.childPath, childX, childY, childW, info.height, side, depth + 1, color, expandedPaths, nodes, lines)
    }

    currentY += info.height + vGap
  })
}

function computeLayout(root: MindmapNode, expandedPaths: Record<string, boolean>) {
  const nodes: LaidOutNode[] = []
  const lines: Line[] = []

  const branches = root.branches || []
  const rootX = 700
  const rootY = 500

  nodes.push({
    path: "root", label: root.name, detail: null,
    x: rootX, y: rootY, w: ROOT_W, h: ROOT_H,
    side: "left", depth: -1, color: "var(--text-primary)",
    isRoot: true, hasChildren: branches.length > 0, isExpanded: true,
  })

  const vGapTop = 22

  // Precompute each top-level branch's own height first (same fix as
  // layoutChildren below), so an expanded branch never overlaps its neighbor.
  const branchInfos = branches.map((branch, i) => {
    const side: "left" | "right" = i % 2 === 0 ? "left" : "right"
    const path = "0|" + i
    const color = COLORS[i % COLORS.length]
    const isExpanded = !!expandedPaths[path]
    const hasChildren = !!(branch.branches && branch.branches.length > 0)
    const detail = nodeDetailText(branch)
    const showInlineDetail = isExpanded && !!detail && !hasChildren
    const h = showInlineDetail ? BASE_NODE_H + estimateDetailHeight(detail!, 170) : BASE_NODE_H + 8
    return { branch, side, path, color, isExpanded, hasChildren, detail, h }
  })

  const leftInfos = branchInfos.filter((b) => b.side === "left")
  const rightInfos = branchInfos.filter((b) => b.side === "right")

  function positionSide(infos: typeof branchInfos) {
    const totalHeight = infos.reduce((sum, b) => sum + b.h, 0) + vGapTop * (infos.length - 1)
    let currentY = rootY + ROOT_H / 2 - totalHeight / 2
    infos.forEach((info) => {
      const x = info.side === "left" ? rootX - 210 : rootX + ROOT_W + 40
      const y = currentY

      nodes.push({
        path: info.path, label: info.branch.name, detail: info.isExpanded ? info.detail : null,
        x, y, w: 170, h: info.h,
        side: info.side, depth: 0, color: info.color,
        isRoot: false, hasChildren: info.hasChildren || !!info.detail, isExpanded: info.isExpanded,
      })

      const startEdgeX = info.side === "left" ? rootX : rootX + ROOT_W
      const startEdgeY = rootY + ROOT_H / 2
      const endEdgeX = info.side === "left" ? x + 170 : x
      const endEdgeY = y + info.h / 2
      lines.push({ x1: startEdgeX, y1: startEdgeY, x2: endEdgeX, y2: endEdgeY, color: info.color, opacity: 0.6 })

      if (info.isExpanded && info.hasChildren) {
        layoutChildren(info.branch, info.path, x, y, 170, info.h, info.side, 1, info.color, expandedPaths, nodes, lines)
      }

      currentY += info.h + vGapTop
    })
  }

  positionSide(leftInfos)
  positionSide(rightInfos)

  // Bounds for the pannable canvas size
  const allX = nodes.flatMap(n => [n.x, n.x + n.w])
  const allY = nodes.flatMap(n => [n.y, n.y + n.h])
  const minX = Math.min(...allX, 0) - 100
  const maxX = Math.max(...allX, 1400) + 100
  const minY = Math.min(...allY, 0) - 100
  const maxY = Math.max(...allY, 1000) + 100

  return { nodes, lines, bounds: { minX, maxX, minY, maxY } }
}

export default function MindMapCanvas({ root }: { root: MindmapNode }) {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({})
  const [pan, setPan] = useState({ x: -500, y: -350 })
  const [zoom, setZoom] = useState(1)

  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { nodes, lines, bounds } = useMemo(() => computeLayout(root, expandedPaths), [root, expandedPaths])

  const toggleNode = useCallback((path: string, hasChildren: boolean) => {
    if (!hasChildren) return
    setExpandedPaths((prev) => {
      const next = { ...prev }
      if (next[path]) delete next[path]
      else next[path] = true
      return next
    })
  }, [])

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y }
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPan({ x: dragRef.current.startPanX + dx / zoom, y: dragRef.current.startPanY + dy / zoom })
  }
  function handlePointerUp() {
    dragRef.current = null
    setIsDragging(false)
  }

  function zoomIn() { setZoom((z) => Math.min(1.6, z + 0.15)) }
  function zoomOut() { setZoom((z) => Math.max(0.4, z - 0.15)) }

  const canvasW = bounds.maxX - bounds.minX
  const canvasH = bounds.maxY - bounds.minY

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button className={styles.zoomBtn} onClick={zoomOut} aria-label="Zoom out">-</button>
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button className={styles.zoomBtn} onClick={zoomIn} aria-label="Zoom in">+</button>
      </div>

      <div
        ref={viewportRef}
        className={`${styles.viewport} ${isDragging ? styles.dragging : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className={styles.canvas}
          style={{
            width: canvasW, height: canvasH,
            transform: `translate(${pan.x - bounds.minX}px, ${pan.y - bounds.minY}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <svg className={styles.svg} width={canvasW} height={canvasH}>
            {lines.map((l, i) => (
              <path
                key={i}
                d={`M${l.x1 - bounds.minX} ${l.y1 - bounds.minY} C${(l.x1 + l.x2) / 2 - bounds.minX} ${l.y1 - bounds.minY} ${(l.x1 + l.x2) / 2 - bounds.minX} ${l.y2 - bounds.minY} ${l.x2 - bounds.minX} ${l.y2 - bounds.minY}`}
                fill="none"
                stroke={l.color}
                strokeWidth={1.5}
                opacity={l.opacity}
              />
            ))}
          </svg>

          {nodes.map((n) => (
            <div
              key={n.path}
              className={`${styles.node} ${n.isRoot ? styles.rootNode : ""}`}
              style={{
                left: n.x - bounds.minX, top: n.y - bounds.minY, width: n.w, height: n.h,
                borderLeftWidth: n.isRoot ? undefined : 3,
                borderLeftColor: n.isRoot ? undefined : n.color,
                borderLeftStyle: n.isRoot ? undefined : "solid",
              }}
              onClick={(e) => { e.stopPropagation(); toggleNode(n.path, n.hasChildren) }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {n.isRoot ? (
                <span className={styles.rootLabel}>{n.label}</span>
              ) : (
                <>
                  <span className={styles.nodeLabel}>
                    {n.label}
                    {n.hasChildren && !n.isExpanded && <span className={styles.nodeArrow} />}
                  </span>
                  {n.detail && <div className={styles.nodeDetail}>{n.detail}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className={styles.hint}>Drag to move around - click a card to expand its branches</p>
    </div>
  )
}
