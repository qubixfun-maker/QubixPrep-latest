export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { knowledgeToMindmapData } from '@/ai/knowledge-to-mindmap'

/**
 * Generates mindmap data directly from already-extracted chapter knowledge - a pure
 * transform, no AI call, since the knowledge tree already has the topic/subtopic
 * hierarchy a mindmap needs. Fast enough to run as a single request per chapter.
 *
 * Usage: POST { idToken, subjectId, textbookId, chapterId, chapterTitle }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, textbookId, chapterId, chapterTitle } = await req.json()

    if (!idToken || !subjectId || !textbookId || !chapterId) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, textbookId, or chapterId.' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const docKey = `${textbookId}__${chapterId}`
    const knowledgeDoc = await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(docKey).get()
    if (!knowledgeDoc.exists) {
      return NextResponse.json({ error: `No chapterKnowledge found for this chapter. Run knowledge extraction first.` }, { status: 404 })
    }
    const knowledge = knowledgeDoc.data() as any

    const mindmapData = knowledgeToMindmapData(knowledge)

    const mmId = `${docKey}-mindmap`
    await db.collection('subjects').doc(subjectId).collection('mindmaps').doc(mmId).set({
      id: mmId,
      subjectId,
      unitName: null,
      order: Date.now(),
      title: chapterTitle || knowledge.chapterTitle,
      type: 'radial',
      data: mindmapData,
      tier: 'free',
      textbookId,
      chapterId,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, branchCount: mindmapData.branches.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Mindmap generation failed', stack: e.stack }, { status: 500 })
  }
}
