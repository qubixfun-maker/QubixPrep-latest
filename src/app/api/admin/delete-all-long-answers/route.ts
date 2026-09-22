export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'

/**
 * One-off destructive wipe of ALL generated long-answer content across every subject.
 * Deletes every doc in the `sections` subcollection (subjects/{id}/essayChapters/{id}/
 * sections/{sectionType} - the long-essays/short-essays/short-answers HTML blobs) and
 * every `essayChapters` parent doc, across ALL subjects. This does not touch textNotes,
 * mindmaps, flashcards, qbank, or the profpyq (past-paper) collection - only the
 * generated long-answer sections and their chapter containers.
 *
 * Protected by the same ADMIN_BULK_SECRET shared secret used by the other admin bulk
 * routes, not a Firebase ID token, so this can be called with curl.
 *
 * Usage: POST { secret }
 */
export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json()

    const expectedSecret = process.env.ADMIN_BULK_SECRET
    if (!expectedSecret) {
      return NextResponse.json({ error: 'ADMIN_BULK_SECRET is not configured on the server.' }, { status: 500 })
    }
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid secret.' }, { status: 403 })
    }

    const db = getAdminFirestore()

    // Firestore batch writes cap at 500 ops - delete in chunks rather than one giant batch.
    async function deleteAllInCollectionGroup(name: string): Promise<number> {
      let totalDeleted = 0
      while (true) {
        const snap = await db.collectionGroup(name).limit(400).get()
        if (snap.empty) break
        const batch = db.batch()
        snap.docs.forEach((d) => batch.delete(d.ref))
        await batch.commit()
        totalDeleted += snap.size
        // Safety valve - if something is wrong and docs aren't actually being removed,
        // don't loop forever.
        if (snap.size < 400) break
      }
      return totalDeleted
    }

    // Delete section content first, then the chapter containers that held it.
    const sectionsDeleted = await deleteAllInCollectionGroup('sections')
    const chaptersDeleted = await deleteAllInCollectionGroup('essayChapters')

    return NextResponse.json({
      success: true,
      sectionsDeleted,
      chaptersDeleted,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete long answers' }, { status: 500 })
  }
}
