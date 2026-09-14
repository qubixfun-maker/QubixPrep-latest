export const dynamic = "force-dynamic"
export const maxDuration = 280

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { generateMindmapFromNotes } from '@/ai/notes-to-mindmap'

/**
 * Generates mindmap data by having the model read each topic's already-generated NOTES
 * (polished Markdown, not raw knowledge JSON) and summarize what belongs in each
 * branch. Requires textNotes to already exist for this chapter - run Notes Bulk
 * Generator first if it doesn't.
 *
 * Usage: POST { idToken, subjectId, textbookId, chapterId, chapterTitle, useGeminiNative? }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, textbookId, chapterId, chapterTitle, useGeminiNative, useClaude } = await req.json()

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
    const notesDoc = await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).get()
    if (!notesDoc.exists) {
      return NextResponse.json({ error: `No notes found for this chapter. Run Notes Bulk Generator first.` }, { status: 404 })
    }
    const notes = notesDoc.data() as any

    const knowledgeDoc = await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(docKey).get()
    const centralTopic = knowledgeDoc.exists ? (knowledgeDoc.data() as any).centralTopic : notes.chapterTitle
    const subjectDoc = await db.collection('subjects').doc(subjectId).get()
    const subjectName = subjectDoc.data()?.name || subjectId

    const mindmapData = await generateMindmapFromNotes(notes.topics, centralTopic, subjectName, { useGeminiNative: !!useGeminiNative, useClaude: !!useClaude })

    const mmId = `${docKey}-mindmap`
    await db.collection('subjects').doc(subjectId).collection('mindmaps').doc(mmId).set({
      id: mmId,
      subjectId,
      unitName: null,
      order: Date.now(),
      title: chapterTitle || notes.chapterTitle,
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
