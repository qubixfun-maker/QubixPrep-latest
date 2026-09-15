export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import { transcribeNotesPage } from '@/ai/notes-pdf-page-transcriber'
// Force Next.js bundler to include the pdf.js worker file in the deployed output
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'

// Kept small since each page needs its own render + vision call, both of which take
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

    const { createCanvas } = await import('@napi-rs/canvas')
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as any)

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    })
    const pdf = await loadingTask.promise

    const results: { pageNum: number; topicName?: string; pageOfTopic?: number; totalPagesOfTopic?: number; markdown?: string; error?: string }[] = []

    for (const pageNum of pageNumbers) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')
        await page.render({ canvasContext: context, viewport, intent: 'display' }).promise
        const buffer = canvas.toBuffer('image/jpeg', 0.85)
        const imageBase64 = buffer.toString('base64')

        const { page: transcribed, error } = await transcribeNotesPage(imageBase64, 'image/jpeg')
        if (transcribed) {
          results.push({ pageNum, ...transcribed })
        } else {
          results.push({ pageNum, error: error || 'Transcription failed' })
        }
      } catch (e: any) {
        results.push({ pageNum, error: e.message || 'Page render failed' })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Batch ingestion failed', stack: e.stack }, { status: 500 })
  }
}
