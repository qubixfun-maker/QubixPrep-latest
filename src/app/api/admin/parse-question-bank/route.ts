export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'

type ParsedChapter = {
  chapterNum: number
  title: string
  longEssays: string[]
  shortEssays: string[]
  shortAnswers: string[]
}

function parseQuestionBank(text: string): ParsedChapter[] {
  const clean = text.replace(/\f/g, '')
  const sectionMarkerRe = /\n(?:Long Essays?|Short Essays?|Short Answers?)\n/

  const headerRe = /Chapter (\d+):/g
  const headers: { num: number; index: number }[] = []
  let m: RegExpExecArray | null
  while ((m = headerRe.exec(clean)) !== null) {
    headers.push({ num: parseInt(m[1], 10), index: m.index })
  }

  const chapters: ParsedChapter[] = []

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index
    const end = i + 1 < headers.length ? headers[i + 1].index : clean.length
    const block = clean.slice(start, end)

    const titleMatch = block.match(/Chapter \d+:\s*([\s\S]+?)(?=\nLong Essays?\n|\nShort Essays?\n|\nShort Answers?\n|\n\(No questions listed\))/)
    let title = titleMatch ? titleMatch[1].replace(/\n/g, ' ').trim() : '(unknown)'
    title = title.replace(/\s+/g, ' ')

    function extractSection(names: string[]): string[] {
      for (const name of names) {
        const re = new RegExp(`\\n${name}\\n([\\s\\S]*?)(?=${sectionMarkerRe.source}|$)`)
        const match = block.match(re)
        if (match) {
          const sectionText = match[1].trim()
          const items = ('\n' + sectionText).split(/\n(?=\d+\.\s)/).filter((s) => s.trim())
          return items.map((it) => it.replace(/^\d+\.\s*/, '').replace(/\n/g, ' ').trim()).filter(Boolean).map((s) => s.replace(/\s+/g, ' '))
        }
      }
      return []
    }

    chapters.push({
      chapterNum: headers[i].num,
      title,
      longEssays: extractSection(['Long Essays', 'Long Essay']),
      shortEssays: extractSection(['Short Essays', 'Short Essay']),
      shortAnswers: extractSection(['Short Answers', 'Short Answer']),
    })
  }

  return chapters
}

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
      let pageText = ''
      for (const item of content.items as any[]) {
        pageText += item.str
        if (item.hasEOL) pageText += '\n'
        else if (!item.str.endsWith(' ')) pageText += ' '
      }
      fullText += pageText + '\n\n'
    }

    const chapters = parseQuestionBank(fullText)
    const totalQuestions = chapters.reduce((sum, c) => sum + c.longEssays.length + c.shortEssays.length + c.shortAnswers.length, 0)

    return NextResponse.json({ chapters, totalQuestions, pageCount: totalPages })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Question bank parsing failed' }, { status: 500 })
  }
}
