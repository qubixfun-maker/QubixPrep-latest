export const dynamic = "force-dynamic"
export const maxDuration = 280

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'
import { processPageBatch, pageNeedsVision, stitchChapters, type PageInput, type PageResult } from '@/ai/ai-driven-textbook-ingest'
import { repairPdfText } from '@/lib/pdf-text-repair'

const BATCH_SIZE = 8 // pages per Gemini call - kept small since rendering+vision pages are slower than plain text

/**
 * AI-driven textbook (re-)ingestion - processes ONE batch of consecutive pages per call
 * (job-tracked in Firestore, resumable), then on the final batch stitches all pages into
 * chapters and saves them exactly like the existing ingestion route does (same chapter
 * ID convention, same document fields), so every downstream feature works unchanged.
 *
 * Each batch's page results are stored in their OWN small document under a subcollection
 * (aiIngestJob/current/batches/{batchIndex}), not accumulated into one growing array field -
 * a single document holding every page's full text for a 500+ page book would risk
 * exceeding Firestore's 1MB document size limit.
 *
 * This is a NEW, separate path from the existing bookmark/regex-based ingestion route -
 * meant for books where that approach struggles (scanned pages, unusual layouts, titles
 * picked up incorrectly). Existing textbooks/ingestion keep working untouched.
 *
 * Usage: POST { idToken, textbookId } - repeatedly, until response.done is true.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, textbookId } = await req.json()
    if (!idToken || !textbookId) {
      return NextResponse.json({ error: 'Missing idToken or textbookId' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const textbookRef = db.collection('textbooks').doc(textbookId)
    const textbookSnap = await textbookRef.get()
    if (!textbookSnap.exists) {
      return NextResponse.json({ error: 'Textbook not found' }, { status: 404 })
    }
    const textbook = textbookSnap.data()!

    const bucket = getAdminStorageBucket()
    const [pdfBuffer] = await bucket.file(textbook.storagePath).download()

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as any)
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    })
    const pdf = await loadingTask.promise
    const totalPages = pdf.numPages

    const jobRef = textbookRef.collection('aiIngestJob').doc('current')
    const batchesRef = jobRef.collection('batches')
    const jobSnap = await jobRef.get()

    let nextBatchStart: number
    let batchIndex: number

    if (!jobSnap.exists) {
      nextBatchStart = 1
      batchIndex = 0
      await jobRef.set({ totalPages, nextBatchStart, batchIndex, status: 'running', updatedAt: new Date().toISOString() })
    } else {
      const job = jobSnap.data()!
      if (job.status === 'done') {
        return NextResponse.json({ done: true, message: 'Job already complete.' })
      }
      nextBatchStart = job.nextBatchStart
      batchIndex = job.batchIndex
    }

    const batchEnd = Math.min(nextBatchStart + BATCH_SIZE - 1, totalPages)
    const batchPages: PageInput[] = []

    for (let pageNum = nextBatchStart; pageNum <= batchEnd; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      const text = content.items.map((it: any) => it.str).join(' ')

      const input: PageInput = { pageNum, text }
      if (pageNeedsVision(input)) {
        const { createCanvas } = await import('@napi-rs/canvas')
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')
        await page.render({ canvasContext: context, viewport, intent: 'display' }).promise
        const buffer = canvas.toBuffer('image/jpeg', 0.85)
        input.imageBase64 = buffer.toString('base64')
      }
      batchPages.push(input)
    }

    const batchResult = await processPageBatch(batchPages)
    if (batchResult.error || !batchResult.results) {
      return NextResponse.json({ error: batchResult.error || 'Batch processing failed' }, { status: 500 })
    }

    const repairedResults = batchResult.results.map((r) => ({ ...r, text: repairPdfText(r.text) }))
    await batchesRef.doc(String(batchIndex)).set({ pageResults: repairedResults, startPage: nextBatchStart, endPage: batchEnd })

    const isLastBatch = batchEnd >= totalPages

    if (!isLastBatch) {
      await jobRef.set({
        totalPages,
        nextBatchStart: batchEnd + 1,
        batchIndex: batchIndex + 1,
        status: 'running',
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      return NextResponse.json({ done: false, pagesProcessed: batchEnd, totalPages })
    }

    // Final batch - read every batch document back, stitch all pages into chapters, and
    // save them matching the existing ingestion route's exact chapter document shape.
    const allBatchesSnap = await batchesRef.orderBy('startPage', 'asc').get()
    const allResults: PageResult[] = []
    allBatchesSnap.docs.forEach((d) => allResults.push(...(d.data().pageResults || [])))

    const chapters = stitchChapters(allResults)
    for (let i = 0; i < chapters.length; i++) {
      const chapterId = 'ch-' + (i + 1).toString().padStart(2, '0')
      await textbookRef.collection('chapters').doc(chapterId).set({
        title: chapters[i].title,
        startPage: chapters[i].startPage,
        endPage: chapters[i].endPage,
        text: chapters[i].text,
        images: [],
        imageCount: 0,
        imagesExtracted: false,
      })
    }

    await textbookRef.update({ status: 'ready' })
    await jobRef.set({ totalPages, nextBatchStart: totalPages + 1, status: 'done', chapterCount: chapters.length, updatedAt: new Date().toISOString() }, { merge: true })

    return NextResponse.json({ done: true, chapterCount: chapters.length, totalPages })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'AI ingestion failed', stack: e.stack }, { status: 500 })
  }
}
