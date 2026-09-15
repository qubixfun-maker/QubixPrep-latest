export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'

type JobPage = {
  pageNum: number
  status: 'pending' | 'running' | 'done' | 'failed'
  topicName?: string
  pageOfTopic?: number
  totalPagesOfTopic?: number
  markdown?: string
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, textbookId, chapterId, chapterTitle } = await req.json()
    if (!idToken || !subjectId || !textbookId || !chapterId) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, textbookId, or chapterId' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const jobKey = `${textbookId}__${chapterId}`
    const jobRef = db.collection('subjects').doc(subjectId).collection('notesPdfIngestJob').doc(jobKey)
    const jobSnap = await jobRef.get()
    if (!jobSnap.exists) {
      return NextResponse.json({ error: 'No ingestion job found for this chapter' }, { status: 404 })
    }
    const job = jobSnap.data()!
    const pages: JobPage[] = job.pages || []

    const donePages = pages.filter((p) => p.status === 'done' && p.markdown)
    if (donePages.length === 0) {
      return NextResponse.json({ error: 'No successfully transcribed pages to finalize' }, { status: 400 })
    }
    // Pages should already be in ascending order from how the job was created, but sort
    // defensively since page order determines topic grouping and concatenation order.
    donePages.sort((a, b) => a.pageNum - b.pageNum)

    // Group consecutive pages into topics: a new topic starts whenever pageOfTopic is 1
    // (or missing/invalid), matching the "Page 1/N" convention these notes use at the
    // start of every topic. Pages within a topic are concatenated in page order.
    const topics: { name: string; markdown: string; depth: number }[] = []
    for (const page of donePages) {
      const startsNewTopic = !page.pageOfTopic || page.pageOfTopic <= 1 || topics.length === 0
      if (startsNewTopic) {
        topics.push({ name: page.topicName || `Untitled Topic (page ${page.pageNum})`, markdown: page.markdown!, depth: 0 })
      } else {
        topics[topics.length - 1].markdown += `\n\n${page.markdown}`
      }
    }

    const notesRef = db.collection('subjects').doc(subjectId).collection('textNotes').doc(jobKey)
    await notesRef.set({
      chapterId,
      textbookId,
      chapterTitle: chapterTitle || job.chapterTitle || chapterId,
      subjectId,
      topics,
      topicCount: topics.length,
      updatedAt: new Date().toISOString(),
    })

    const failedCount = pages.filter((p) => p.status === 'failed').length
    return NextResponse.json({ success: true, topicCount: topics.length, pagesUsed: donePages.length, pagesFailed: failedCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Finalize failed', stack: e.stack }, { status: 500 })
  }
}
