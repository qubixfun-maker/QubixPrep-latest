export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { regenerateTopicNotes } from '@/ai/chapter-notes-from-knowledge'

const MARK = 'Notes generation failed for this topic'
const isFailed = (t: any) => String(t?.markdown || '').includes(MARK)

// mode "scan": list every chapter that has failed topics.
// mode "fix" : regenerate the failed topics of ONE chapter doc ({ subjectId, docId }).
export async function POST(req: NextRequest) {
  try {
    const { idToken, mode, subjectId, docId } = await req.json()
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const me = await db.collection('users').doc(decoded.uid).get()
    if (me.data()?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    if (mode === 'scan') {
      const snap = await db.collectionGroup('textNotes').get()
      const items: any[] = []
      let totalFailed = 0
      snap.forEach((d) => {
        const data: any = d.data()
        const failed = (data.topics || []).filter(isFailed).length
        if (failed > 0) {
          totalFailed += failed
          items.push({ subjectId: d.ref.parent.parent?.id, docId: d.id, chapterTitle: data.chapterTitle || d.id, failed, total: (data.topics || []).length })
        }
      })
      return NextResponse.json({ scanned: snap.size, totalFailed, items })
    }

    if (mode === 'fix') {
      if (!subjectId || !docId) return NextResponse.json({ error: 'Missing subjectId or docId' }, { status: 400 })
      const ref = db.collection('subjects').doc(subjectId).collection('textNotes').doc(docId)
      const doc = await ref.get()
      if (!doc.exists) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
      const data: any = doc.data()
      const subj = await db.collection('subjects').doc(subjectId).get()
      const subjectName = subj.exists ? (subj.data() as any)?.name || subjectId : subjectId
      const topics: any[] = data.topics || []
      const todo = topics.map((t, i) => (isFailed(t) ? i : -1)).filter((i) => i >= 0)
      let next = 0
      async function worker() {
        while (true) {
          const k = next++
          if (k >= todo.length) return
          const i = todo[k]
          const md = await regenerateTopicNotes(subjectName, data.chapterTitle || docId, topics[i].name)
          if (!md.includes(MARK)) topics[i] = { ...topics[i], markdown: md }
        }
      }
      await Promise.all(Array.from({ length: Math.min(3, todo.length) }, () => worker()))
      await ref.update({ topics, updatedAt: new Date().toISOString() })
      return NextResponse.json({ fixed: todo.length - topics.filter(isFailed).length, remaining: topics.filter(isFailed).length })
    }

    return NextResponse.json({ error: 'Unknown mode' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Repair failed' }, { status: 500 })
  }
}
