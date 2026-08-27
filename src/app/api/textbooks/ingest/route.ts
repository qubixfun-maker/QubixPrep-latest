export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
// Force Next.js bundler to include the pdf.js worker file in the deployed output -
// pdfjs-dist looks this up dynamically at runtime, invisible to static bundling otherwise.
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'

export async function POST(req: NextRequest) {
  try {
    const { idToken, storagePath, title, author } = await req.json()

    if (!idToken || !storagePath || !title) {
      return NextResponse.json({ error: 'Missing idToken, storagePath, or title' }, { status: 400 })
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

    const outline = await pdfDoc.getOutline()
    if (!outline) {
      return NextResponse.json({ error: 'This PDF has no bookmarks/outline - cannot auto-detect chapters. Try a different file.' }, { status: 400 })
    }

    async function getPageNumber(dest: any): Promise<number | null> {
      if (!dest) return null
      let explicitDest = dest
      if (typeof dest === 'string') {
        explicitDest = await pdfDoc.getDestination(dest)
      }
      if (!explicitDest) return null
      const pageIndex = await pdfDoc.getPageIndex(explicitDest[0])
      return pageIndex + 1
    }

    const flatEntries: { title: string; page: number }[] = []
    async function walk(items: any[]) {
      for (const item of items) {
        const pageNum = await getPageNumber(item.dest)
        if (pageNum) flatEntries.push({ title: item.title.trim(), page: pageNum })
        if (item.items && item.items.length) await walk(item.items)
      }
    }
    await walk(outline)

    const chapterEntries = flatEntries.filter(e => /^\d+\.\s/.test(e.title) || /^Chapter\s+\d+\b/i.test(e.title))
    if (chapterEntries.length === 0) {
      return NextResponse.json({ error: 'No numbered chapters detected in the bookmarks (expected pattern like "3. Chapter Title"). This textbook\'s structure isn\'t supported yet.' }, { status: 400 })
    }

    const chapters = chapterEntries.map((e, i) => ({
      title: e.title,
      startPage: e.page,
      endPage: i < chapterEntries.length - 1 ? chapterEntries[i + 1].page - 1 : totalPages,
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
    console.error('[TEXTBOOK-INGEST] FAILED:', e)
    return NextResponse.json({ error: e.message || 'Ingestion failed' }, { status: 500 })
  }
}
