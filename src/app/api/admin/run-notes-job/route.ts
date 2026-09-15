export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { generateChapterNotesFromKnowledge } from '@/ai/chapter-notes-from-knowledge'

const AI_GENERATED_TEXTBOOK_ID = 'ai-generated'
const JOB_ID = 'current'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'chapter'
}

type ChapterProgress = {
  title: string
  status: 'pending' | 'running' | 'done' | 'failed'
  topicCount?: number
  textbookId?: string
  chapterId?: string
  error?: string
}

// This route processes exactly ONE chapter per invocation, then - after already
// responding to whoever called it - triggers itself again for the next pending
// chapter via Next's after(). That keeps the whole batch running server-side,
// chapter by chapter, independent of the browser tab staying open/focused: the
// first call comes from the admin page (authenticated with their idToken), every
// following call is the route calling itself (authenticated with a per-job secret
// instead, since a long batch can easily outlive a Firebase idToken's ~1hr validity).
export async function POST(req: NextRequest) {
  try {
    const { idToken, chainSecret, subjectId } = await req.json()
    if (!subjectId) {
      return NextResponse.json({ error: 'Missing subjectId' }, { status: 400 })
    }

    const db = getAdminFirestore()
    const jobRef = db.collection('subjects').doc(subjectId).collection('aiNotesGenJob').doc(JOB_ID)
    const jobSnap = await jobRef.get()
    if (!jobSnap.exists) {
      return NextResponse.json({ error: 'No job found for this subject' }, { status: 404 })
    }
    const job = jobSnap.data()!

    let authorized = false
    if (idToken) {
      try {
        const decoded = await verifyIdToken(idToken)
        const userDoc = await db.collection('users').doc(decoded.uid).get()
        if (userDoc.data()?.role === 'admin') authorized = true
      } catch {
        // falls through to the chainSecret check below
      }
    }
    if (!authorized && chainSecret && job.chainSecret && chainSecret === job.chainSecret) {
      authorized = true
    }
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // A fresh Resume call flips a paused job back to running before we look at it;
    // any other call that finds the job already stopped just stops the chain here.
    if (idToken && job.status === 'paused') {
      await jobRef.update({ status: 'running' })
    } else if (job.status === 'paused' || job.status === 'done') {
      return NextResponse.json({ success: true, stopped: true })
    }

    // Older jobs (created before self-chaining existed) won't have a chainSecret yet -
    // mint one now so this job can keep chaining going forward, instead of stalling
    // after this one step.
    const chainSecretForThisJob: string = job.chainSecret || crypto.randomUUID()
    if (!job.chainSecret) {
      await jobRef.update({ chainSecret: chainSecretForThisJob })
    }

    const chapters: ChapterProgress[] = job.chapters || []
    const nextIndex = chapters.findIndex((c) => c.status === 'pending')
    if (nextIndex === -1) {
      await jobRef.update({ status: 'done', updatedAt: new Date().toISOString() })
      return NextResponse.json({ success: true, done: true })
    }

    chapters[nextIndex] = { ...chapters[nextIndex], status: 'running' }
    await jobRef.update({ chapters, updatedAt: new Date().toISOString() })

    const subjectDoc = await db.collection('subjects').doc(subjectId).get()
    const subjectName = subjectDoc.exists ? (subjectDoc.data() as any)?.name || subjectId : subjectId

    const result = await generateChapterNotesFromKnowledge(subjectName, chapters[nextIndex].title)

    if (result.error || !result.topics) {
      chapters[nextIndex] = { ...chapters[nextIndex], status: 'failed', error: result.error || 'Generation failed' }
    } else {
      const chapterId = slugify(chapters[nextIndex].title)
      const jobKey = `${AI_GENERATED_TEXTBOOK_ID}__${chapterId}`
      await db.collection('subjects').doc(subjectId).collection('textNotes').doc(jobKey).set({
        chapterId,
        textbookId: AI_GENERATED_TEXTBOOK_ID,
        chapterTitle: chapters[nextIndex].title,
        subjectId,
        topics: result.topics,
        topicCount: result.topics.length,
        updatedAt: new Date().toISOString(),
      })
      chapters[nextIndex] = {
        ...chapters[nextIndex], status: 'done',
        topicCount: result.topics.length, textbookId: AI_GENERATED_TEXTBOOK_ID, chapterId,
      }
    }

    await jobRef.update({ chapters, updatedAt: new Date().toISOString() })

    const hasMorePending = chapters.some((c) => c.status === 'pending')
    if (hasMorePending) {
      const origin = new URL(req.url).origin
      after(async () => {
        try {
          await fetch(`${origin}/api/admin/run-notes-job`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjectId, chainSecret: chainSecretForThisJob }),
          })
        } catch {
          // If this dispatch itself fails (transient network blip), the batch
          // just stops advancing - Resume on the admin page kicks it again.
        }
      })
    } else {
      await jobRef.update({ status: 'done', updatedAt: new Date().toISOString() })
    }

    return NextResponse.json({ success: true, chapterTitle: chapters[nextIndex].title, status: chapters[nextIndex].status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Job step failed', stack: e.stack }, { status: 500 })
  }
}
