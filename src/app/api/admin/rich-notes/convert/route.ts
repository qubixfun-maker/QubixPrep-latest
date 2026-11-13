export const dynamic = "force-dynamic"
export const maxDuration = 280

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { requireAdmin, errorResponse, ApiError } from '@/lib/api-auth'
import { convertTopicToRich } from '@/ai/notes-to-rich'
import { sanitizeRichNote } from '@/lib/richnotes/schema'

/**
 * Admin only. Works on ONE topic of a textNotes chapter doc; the original markdown is never changed.
 *  action "convert"  -> AI restructures the topic's note, saved as topics[i].rich with status "draft"
 *  action "status"   -> { status: "draft" | "published" }
 *  action "save"     -> { rich } edited note JSON (sanitised), keeps current status
 *  action "remove"   -> deletes topics[i].rich (students see the original note again)
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req)
    const { action, subjectId, textbookId, chapterId, topicIndex, status, rich } = await req.json()
    if (!subjectId || !textbookId || !chapterId || typeof topicIndex !== 'number') throw new ApiError('Missing subjectId, textbookId, chapterId or topicIndex.', 400)

    const db = getAdminFirestore()
    const ref = db.collection('subjects').doc(subjectId).collection('textNotes').doc(`${textbookId}__${chapterId}`)
    const snap = await ref.get()
    if (!snap.exists) throw new ApiError('Notes doc not found.', 404)
    const data = snap.data() as any
    const topics: any[] = [...(data.topics || [])]
    const topic = topics[topicIndex]
    if (!topic) throw new ApiError('Topic not found. The chapter may have changed; reload the page.', 404)

    const write = async () => {
      if (JSON.stringify(topics).length > 900_000) throw new ApiError('This chapter document is nearly at the database size limit. Remove a draft first.', 413)
      // Firestore rejects undefined values; a JSON round-trip drops them
      await ref.update({ topics: JSON.parse(JSON.stringify(topics)) })
    }

    if (action === 'convert') {
      const subjectName = (await db.collection('subjects').doc(subjectId).get()).data()?.name || subjectId
      const { note, error } = await convertTopicToRich(subjectName, data.chapterTitle || chapterId, topic.name, topic.markdown || '')
      if (!note) throw new ApiError(error || 'Conversion failed.', 500)
      topics[topicIndex] = { ...topic, rich: { ...note, status: 'draft', convertedAt: Date.now() } }
      await write()
      return NextResponse.json({ ok: true, rich: topics[topicIndex].rich })
    }
    if (!topic.rich) throw new ApiError('This topic has no converted note yet.', 400)
    if (action === 'status') {
      if (status !== 'draft' && status !== 'published') throw new ApiError('Bad status.', 400)
      topics[topicIndex] = { ...topic, rich: { ...topic.rich, status } }
      await write()
      return NextResponse.json({ ok: true })
    }
    if (action === 'save') {
      const clean = sanitizeRichNote(rich)
      if (!clean) throw new ApiError('That note is not valid: it needs a title, a definition and at least one section with content.', 400)
      topics[topicIndex] = { ...topic, rich: { ...clean, status: topic.rich.status, convertedAt: topic.rich.convertedAt } }
      await write()
      return NextResponse.json({ ok: true })
    }
    if (action === 'remove') {
      const { rich: _drop, ...rest } = topic
      topics[topicIndex] = rest
      await write()
      return NextResponse.json({ ok: true })
    }
    throw new ApiError('Unknown action.', 400)
  } catch (e: any) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('[RICH-NOTES]', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Request failed.' }, { status: 500 })
  }
}
