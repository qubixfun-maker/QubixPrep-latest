export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
// Force Next.js bundler to include the pdf.js worker file in the deployed output -
// pdfjs-dist looks this up dynamically at runtime, invisible to static bundling otherwise.
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'

// Fallback path for books where automatic chapter detection (bookmarks or
// content-pattern scanning, see /api/textbooks/ingest) genuinely can't find
// a usable structure - e.g. unnumbered, non-standard-format, or heavily OCR-
// garbled books. The admin manually lists each chapter's title and starting
// page number instead; everything else (text extraction, Firestore layout)
// matches the automatic path exactly so both are interchangeable to the rest
// of the app.
export async function POST(req: NextRequest) {
  try {
    const { idToken, storagePath, title, author, chapters: manualChapters } = await req.json()

    if (!idToken || !storagePath || !title) {
      return NextResponse.json({ error: 'Missing idToken, storagePath, or title' }, { status: 400 })
    }
    if (!Array.isArray(manualChapters) || manualChapters.length === 0) {
      return NextResponse.json({ error: 'At least one chapter is required' }, { status: 400 })
    }
    for (const ch of manualChapters) {
      if (!ch.title || typeof ch.title !== 'string' || !ch.title.trim()) {
        return NextResponse.json({ error: 'Every chapter needs a title' }, { status: 400 })
      }
      if (!Number.isInteger(ch.startPage) || ch.startPage < 1) {
        return NextResponse.json({ error: `Invalid start page for chapter "${ch.title}"` }, { status: 400 })
      }
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const bucket = getAdminStorageBucket()
    const file = bucket.file(storagePath)
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: 'Uploaded file not found in Storage' }, { status: 404 })
    }

    const [buffer] = await file.download()

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as any)
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
    const pdfDoc = await loadingTask.promise
    const totalPages = pdfDoc.numPages

    const sortedChapters = [...manualChapters].sort((a, b) => a.startPage - b.startPage)
    const chapters = sortedChapters.map((e, i) => ({
      title: e.title.trim(),
      startPage: Math.min(e.startPage, totalPages),
      endPage: i < sortedChapters.length - 1 ? Math.min(sortedChapters[i + 1].startPage - 1, totalPages) : totalPages,
    }))

    const textbookId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()
    const textbookRef = db.collection('textbooks').doc(textbookId)

    await textbookRef.set({
      title,
      author: author || '',
      totalPages,
      storagePath,
      chapterCount: chapters.length,
      status: 'processing',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: decoded.uid,
    })

    const chapterSummaries: { chapterId: string; title: string; startPage: number; endPage: number; textLength: number }[] = []

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i]
      const chapterId = 'ch-' + (i + 1).toString().padStart(2, '0')

      let text = ''
      for (let p = ch.startPage; p <= ch.endPage; p++) {
        const page = await pdfDoc.getPage(p)
        const content = await page.getTextContent()
        const pageText = content.items.map((it: any) => it.str).join(' ')
        text += pageText + '\n\n'
      }

      await textbookRef.collection('chapters').doc(chapterId).set({
        title: ch.title,
        startPage: ch.startPage,
        endPage: ch.endPage,
        text,
        images: [],
        imageCount: 0,
        imagesExtracted: false,
      })

      chapterSummaries.push({ chapterId, title: ch.title, startPage: ch.startPage, endPage: ch.endPage, textLength: text.length })
    }

    await textbookRef.update({ status: 'ready' })

    return NextResponse.json({ textbookId, totalPages, chapters: chapterSummaries })
  } catch (e: any) {
    console.error('[TEXTBOOK-INGEST-MANUAL] FAILED:', e)
    return NextResponse.json({ error: e.message || 'Ingestion failed' }, { status: 500 })
  }
}
