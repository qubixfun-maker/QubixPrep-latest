export const dynamic = "force-dynamic"
export const maxDuration = 300
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'

export async function POST(req: NextRequest) {
  try {
    const { idToken, storagePath } = await req.json()
    if (!idToken || !storagePath) {
      return NextResponse.json({ error: 'Missing idToken or storagePath' }, { status: 400 })
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

    let fullText = ''
    for (let p = 1; p <= totalPages; p++) {
      const page = await pdfDoc.getPage(p)
      const content = await page.getTextContent()
      const pageText = content.items.map((it: any) => it.str).join(' ')
      fullText += pageText + '\n\n'
    }

    return NextResponse.json({ text: fullText, pageCount: totalPages })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'PDF extraction failed' }, { status: 500 })
  }
}
