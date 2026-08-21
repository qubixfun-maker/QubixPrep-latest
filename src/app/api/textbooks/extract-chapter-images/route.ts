export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
// Force Next.js bundler to include the pdf.js worker file in the deployed output
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'

const MAX_PAGES = 25 // safety cap so a huge chapter doesn't time out or produce excessive candidates

export async function POST(req: NextRequest) {
  try {
    const { idToken, textbookId, chapterId } = await req.json()
    if (!idToken || !textbookId || !chapterId) {
      return NextResponse.json({ error: 'Missing idToken, textbookId, or chapterId' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const chapterRef = db.collection('textbooks').doc(textbookId).collection('chapters').doc(chapterId)
    const chapterSnap = await chapterRef.get()
    if (!chapterSnap.exists) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
    const chapter = chapterSnap.data()!

    // Return cached result if already extracted
    if (chapter.imagesExtracted && Array.isArray(chapter.images) && chapter.images.length > 0) {
      return NextResponse.json({ images: chapter.images, cached: true })
    }

    const textbookSnap = await db.collection('textbooks').doc(textbookId).get()
    const textbook = textbookSnap.data()!

    const bucket = getAdminStorageBucket()
    const [pdfBuffer] = await bucket.file(textbook.storagePath).download()

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

    const startPage = chapter.startPage
    const endPage = Math.min(chapter.endPage, startPage + MAX_PAGES - 1)

    const images: { page: number; url: string; storagePath: string }[] = []

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')
        await page.render({ canvasContext: context, viewport, intent: 'display' }).promise
        const buffer = canvas.toBuffer('image/jpeg', 0.85)

        const destPath = `textbooks/${textbookId}/images/${chapterId}/page-${pageNum}.jpg`
        const file = bucket.file(destPath)
        await file.save(buffer, { metadata: { contentType: 'image/jpeg' } })
        await file.makePublic()
        const url = `https://storage.googleapis.com/${bucket.name}/${destPath}`
        images.push({ page: pageNum, url, storagePath: destPath })
      } catch (e: any) {
        console.warn(`[extract-chapter-images] page ${pageNum} failed:`, e.message)
      }
    }

    await chapterRef.update({
      images,
      imageCount: images.length,
      imagesExtracted: true,
    })

    return NextResponse.json({ images, cached: false, truncated: chapter.endPage > endPage })
  } catch (e: any) {
    console.error('[EXTRACT-CHAPTER-IMAGES] FAILED:', e)
    return NextResponse.json({ error: e.message || 'Image extraction failed' }, { status: 500 })
  }
}
