export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import { transcribeNotesPage } from '@/ai/notes-pdf-page-transcriber'

// Kept small since each page needs its own extraction + vision call, both of which take
// real time - a handful per request keeps well under maxDuration while still making
// meaningful progress per call. The client loops this endpoint across the full page range.
const MAX_PAGES_PER_BATCH = 5

export async function POST(req: NextRequest) {
  try {
    const { idToken, storagePath, pageNumbers } = await req.json()
    if (!idToken || !storagePath || !Array.isArray(pageNumbers) || pageNumbers.length === 0) {
      return NextResponse.json({ error: 'Missing idToken, storagePath, or pageNumbers' }, { status: 400 })
    }
    if (pageNumbers.length > MAX_PAGES_PER_BATCH) {
      return NextResponse.json({ error: `Too many pages in one batch (max ${MAX_PAGES_PER_BATCH})` }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const bucket = getAdminStorageBucket()
    const [pdfBuffer] = await bucket.file(storagePath).download()
    const sourcePdf = await PDFDocument.load(pdfBuffer)
    const pageCount = sourcePdf.getPageCount()

    const results: { pageNum: number; topicName?: string; pageOfTopic?: number; totalPagesOfTopic?: number; markdown?: string; error?: string }[] = []

    for (const pageNum of pageNumbers) {
      try {
        const pageIndex = pageNum - 1 // pdf-lib is 0-indexed, our page numbers are 1-indexed
        if (pageIndex < 0 || pageIndex >= pageCount) {
          results.push({ pageNum, error: `Page ${pageNum} is out of range (document has ${pageCount} pages)` })
          continue
        }

        // Extract just this one page into its own tiny PDF - no rasterization, no native
        // libraries involved. Gemini reads PDF pages natively, so we can hand it the page
        // exactly as it appears in the source document.
        const singlePagePdf = await PDFDocument.create()
        const [copiedPage] = await singlePagePdf.copyPages(sourcePdf, [pageIndex])
        singlePagePdf.addPage(copiedPage)
        const singlePageBytes = await singlePagePdf.save()
        const pdfBase64 = Buffer.from(singlePageBytes).toString('base64')

        const { page: transcribed, error } = await transcribeNotesPage(pdfBase64, 'application/pdf')
        if (transcribed) {
          results.push({ pageNum, ...transcribed })
        } else {
          results.push({ pageNum, error: error || 'Transcription failed' })
        }
      } catch (e: any) {
        results.push({ pageNum, error: e.message || 'Page extraction failed' })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Batch ingestion failed', stack: e.stack }, { status: 500 })
  }
}
