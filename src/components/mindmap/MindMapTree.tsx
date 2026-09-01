"use client"

import { useState } from "react"
import styles from "./MindMapTree.module.css"

export type MindmapNode = {
  name: string
  definition?: string
  mechanism?: string
  examples?: string
  branches?: MindmapNode[]
}

const DOT_CLASSES = [styles.dotPurple, styles.dotTeal, styles.dotCoral, styles.dotPink]

function TreeNode({ node, dotClass }: { node: MindmapNode; dotClass: string }) {
  const [open, setOpen] = useState(false)
  const hasChildren = !!(node.branches && node.branches.length > 0)
  const hasDetail = !!(node.definition || node.mechanism || node.examples)
  const isExpandable = hasChildren || hasDetail

  return (
    <div className={styles.node}>
      <div
        className={`${styles.row} ${!isExpandable ? styles.rowInert : ""}`}
        onClick={() => isExpandable && setOpen(!open)}
      >
        {isExpandable ? (
          <i className={`ti ti-chevron-right ${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true" />
        ) : (
          <span className={styles.chevronSpacer} />
        )}
        <span className={`${styles.dot} ${dotClass}`} />
        <span className={styles.label}>{node.name}</span>
      </div>

      {open && (
        <div className={styles.children}>
          {hasDetail && (
            <div className={styles.detail}>
              {node.definition && <p>{node.definition}</p>}
              {node.mechanism && <p>{node.mechanism}</p>}
              {node.examples && <p>{node.examples}</p>}
            </div>
          )}
          {hasChildren && node.branches!.map((child, i) => (
            <TreeNode key={i} node={child} dotClass={styles.dotNeutral} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MindMapTree({ root }: { root: MindmapNode }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.rootTitle}>{root.name}</p>
      <div className={styles.tree}>
        {(root.branches || []).map((child, i) => (
          <TreeNode key={i} node={child} dotClass={DOT_CLASSES[i % DOT_CLASSES.length]} />
        ))}
      </div>
    </div>
  )
}
