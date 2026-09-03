export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { repairPdfText, detectLigatureCorruption } from '@/lib/pdf-text-repair'

/**
 * One-time repair for textbooks ingested BEFORE ligature repair was added at ingestion.
 *
 * Reads each chapter's stored text, applies the same dictionary-guarded repair, and writes
 * it back. No PDF re-parsing and no AI calls, so this costs nothing beyond Firestore reads
 * and writes - far cheaper than deleting and re-ingesting the book.
 *
 * Supports a dry run so you can see exactly what would change before committing.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, textbookId, dryRun = true } = await req.json()

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Repair one textbook, or every textbook when no id is given.
    const textbookIds: string[] = []
    if (textbookId) {
      textbookIds.push(textbookId)
    } else {
      const snap = await db.collection('textbooks').get()
      snap.docs.forEach((d) => textbookIds.push(d.id))
    }

    const report: any[] = []
    let totalChaptersChanged = 0

    for (const tbId of textbookIds) {
      const tbDoc = await db.collection('textbooks').doc(tbId).get()
      const tbTitle = tbDoc.data()?.title || tbId

      const chaptersSnap = await db.collection('textbooks').doc(tbId).collection('chapters').get()
      const chapterReports: any[] = []

      for (const chDoc of chaptersSnap.docs) {
        const data = chDoc.data()
        const originalText = data.text || ''
        const originalTitle = data.title || ''

        const before = detectLigatureCorruption(originalText)
        const repairedText = repairPdfText(originalText)
        const repairedTitle = repairPdfText(originalTitle)

        const textChanged = repairedText !== originalText
        const titleChanged = repairedTitle !== originalTitle

        if (!textChanged && !titleChanged) continue

        // Show a few concrete before/after samples so the admin can sanity-check the
        // repair rather than trusting it blindly.
        const samples: { before: string; after: string }[] = []
        const pattern = /[A-Za-z]+\s(?:ffi|ffl|ff|fi|fl|st)\s[a-z]+/g
        const matches = originalText.match(pattern) || []
        for (const m of matches.slice(0, 5)) {
          const fixed = repairPdfText(m)
          if (fixed !== m) samples.push({ before: m, after: fixed })
        }

        chapterReports.push({
          chapterId: chDoc.id,
          title: originalTitle,
          corruptionMarkersBefore: before.sampleCount,
          corruptionMarkersAfter: detectLigatureCorruption(repairedText).sampleCount,
          titleChanged,
          titleBefore: titleChanged ? originalTitle : undefined,
          titleAfter: titleChanged ? repairedTitle : undefined,
          samples,
        })

        if (!dryRun) {
          await chDoc.ref.update({
            text: repairedText,
            title: repairedTitle,
            ligatureRepairedAt: new Date().toISOString(),
          })
        }
        totalChaptersChanged++
      }

      if (chapterReports.length > 0) {
        report.push({
          textbookId: tbId,
          textbookTitle: tbTitle,
          chaptersNeedingRepair: chapterReports.length,
          totalChapters: chaptersSnap.size,
          chapters: chapterReports,
        })
      }
    }

    return NextResponse.json({
      dryRun,
      textbooksScanned: textbookIds.length,
      totalChaptersChanged,
      message: dryRun
        ? 'Dry run only - nothing was written. Re-run with dryRun:false to apply these changes.'
        : 'Repairs applied. Regenerate any content (long answers, mindmaps, flashcards, notes) that was created from the old corrupted text.',
      report,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Repair failed' }, { status: 500 })
  }
}
