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

    async function getPageNumber(dest: any): Promise<number | null> {
      if (!dest) return null
      try {
        let explicitDest = dest
        if (typeof dest === 'string') {
          explicitDest = await pdfDoc.getDestination(dest)
        }
        if (!explicitDest) return null
        const pageIndex = await pdfDoc.getPageIndex(explicitDest[0])
        return pageIndex + 1
      } catch (e) {
        // A malformed/corrupted bookmark reference (e.g. "Kid reference not
        // found in parent's kids") shouldn't crash the whole upload - skip
        // just this one bookmark entry and keep processing the rest.
        return null
      }
    }

    const flatEntries: { title: string; page: number; depth: number }[] = []
    async function walk(items: any[], depth: number = 0) {
      for (const item of items) {
        const pageNum = await getPageNumber(item.dest)
        if (pageNum) flatEntries.push({ title: item.title.trim(), page: pageNum, depth })
        if (item.items && item.items.length) await walk(item.items, depth + 1)
      }
    }
    if (outline) await walk(outline)

    let chapterEntries: { title: string; page: number }[] = flatEntries.filter(e => /^\d+\.\s/.test(e.title) || /^Chapter\s+\d+\b/i.test(e.title))

    // Bookmark fallback: some books' real chapters live at a nested outline
    // depth mixed in with unrelated numbering at other depths (e.g. depth 0
    // = "1 PART NAME" section headers, depth 1 = "1 Actual Chapter Title"
    // chapters with no period after the number, depth 2 = sub-headings
    // within a chapter). Rather than assume chapters sit at any particular
    // depth, every depth is scored by how many sequentially-numbered
    // (1, 2, 3...) entries it contains, and the best-scoring depth wins.
    function parseNumberedTitle(raw: string): { num: number; title: string } | null {
      let m = raw.match(/^Chapter\s+(\d+)[.:]?\s*(.*)$/i)
      if (m) return { num: parseInt(m[1], 10), title: m[2].trim() }
      m = raw.match(/^(\d+)[.:]?\s+(.+)$/)
      if (m) return { num: parseInt(m[1], 10), title: m[2].trim() }
      return null
    }

    if (chapterEntries.length === 0 && flatEntries.length > 0) {
      const byDepth = new Map<number, { title: string; page: number }[]>()
      flatEntries.forEach((e) => {
        if (!byDepth.has(e.depth)) byDepth.set(e.depth, [])
        byDepth.get(e.depth)!.push({ title: e.title, page: e.page })
      })

      let bestSeq: { title: string; page: number }[] = []
      for (const entries of byDepth.values()) {
        let lastNum = 0
        const seq: { title: string; page: number }[] = []
        for (const e of entries) {
          const parsed = parseNumberedTitle(e.title)
          if (parsed && parsed.num === lastNum + 1) {
            // If the bookmark had no title text after the number (e.g. plain
            // "Chapter 5"), keep the raw string so the later generic-title
            // page-content resolution step still recognizes and fills it in.
            const displayTitle = parsed.title.length > 0 ? parsed.title : e.title
            seq.push({ title: displayTitle, page: e.page })
            lastNum = parsed.num
          }
        }
        if (seq.length > bestSeq.length) bestSeq = seq
      }

      if (bestSeq.length >= 2) {
        chapterEntries = bestSeq
      }
    }

    // Fallback: bookmarks are missing or unusable (e.g. junk "Page N" reading
    // bookmarks). Scan every page's text for a "CHAPTER <N> <TITLE>" running
    // header - common in printed/scanned textbooks - and derive chapters
    // from where the chapter number increments. Different books format the
    // title differently, so multiple strategies are tried per page in order:
    //   1. ALL-CAPS title right after "CHAPTER N" (e.g. "CHAPTER 1 HOMEOSTASIS")
    //   2. Title-Case text bounded by a following "Learning objectives"
    //      marker (common in books with a learning-objectives box on the
    //      chapter opener page)
    function matchChapterHeader(pageText: string): { num: number; title: string } | null {
      const allCapsPattern = /CHAPTER\s+(\d+)\s+([A-Z][A-Z ,\-]{4,80})/
      const m1 = allCapsPattern.exec(pageText)
      if (m1) {
        const rawTitle = m1[2].trim().replace(/\s{2,}/g, ' ')
        const titleCased = rawTitle
          .toLowerCase()
          .split(' ')
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
          .join(' ')
        return { num: parseInt(m1[1], 10), title: titleCased }
      }

      const learningObjPattern = /CHAPTER\s+(\d+)\s+(.+?)\s*Learning [Oo]bjectives/
      const m2 = learningObjPattern.exec(pageText)
      if (m2) {
        const title = m2[2].trim().replace(/\s{2,}/g, ' ')
        if (title.length >= 2 && title.length <= 100) {
          return { num: parseInt(m2[1], 10), title }
        }
      }

      return null
    }

    // Strategy 3: some books print "Chapter N: Title" as a running header on
    // EVERY page of the chapter, not just the opener (e.g. "Chapter 1:
    // Anatomy of the Female Pelvic Organs"). Body-content noise trailing the
    // title differs page to page, but the title itself is identical every
    // time it appears - so instead of trying to bound the title from one
    // occurrence, this collects every occurrence per chapter number and
    // keeps only their longest common word-prefix, which cleanly strips
    // whatever varies.
    function longestCommonPrefixWords(strs: string[]): string {
      if (strs.length === 1) return strs[0].split(' ').slice(0, 8).join(' ')
      const wordLists = strs.map((s) => s.split(' '))
      const minLen = Math.min(...wordLists.map((w) => w.length))
      const result: string[] = []
      for (let i = 0; i < minLen; i++) {
        const w0 = wordLists[0][i]
        if (wordLists.every((wl) => wl[i] === w0)) {
          result.push(w0)
        } else {
          break
        }
      }
      return result.length ? result.join(' ') : wordLists[0].slice(0, 8).join(' ')
    }

    let contentPageTextCache: string[] | null = null
    if (chapterEntries.length === 0) {
      contentPageTextCache = new Array(totalPages + 1).fill('')
      const detected: { title: string; page: number }[] = []
      let lastNum = 0

      const colonPattern = /Chapter\s+(\d+):\s*([A-Za-z][a-zA-Z ,:\-]{2,100})/
      const colonCandidates = new Map<number, string[]>()
      const colonFirstPage = new Map<number, number>()

      for (let p = 1; p <= totalPages; p++) {
        const page = await pdfDoc.getPage(p)
        const content = await page.getTextContent()
        const pageText = content.items.map((it: any) => it.str).join(' ')
        contentPageTextCache[p] = pageText

        const match = matchChapterHeader(pageText)
        if (match && match.num === lastNum + 1) {
          detected.push({ title: match.title, page: p })
          lastNum = match.num
        }

        const cm = colonPattern.exec(pageText)
        if (cm) {
          const num = parseInt(cm[1], 10)
          const candidate = cm[2].trim().replace(/\s{2,}/g, ' ')
          if (!colonCandidates.has(num)) colonCandidates.set(num, [])
          colonCandidates.get(num)!.push(candidate)
          if (!colonFirstPage.has(num)) colonFirstPage.set(num, p)
        }
      }

      if (detected.length < 2 && colonCandidates.size >= 2) {
        const nums = [...colonFirstPage.keys()].sort((a, b) => colonFirstPage.get(a)! - colonFirstPage.get(b)!)
        let lastColonNum = 0
        for (const num of nums) {
          if (num === lastColonNum + 1) {
            const title = longestCommonPrefixWords(colonCandidates.get(num)!)
            detected.push({ title, page: colonFirstPage.get(num)! })
            lastColonNum = num
          }
        }
      }

      if (detected.length < 2) {
        return NextResponse.json({ error: 'No chapters could be detected from bookmarks or page content. This textbook\'s structure isn\'t supported yet.' }, { status: 400 })
      }

      chapterEntries = detected
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

    function extractRealTitle(pageText: string, chapterNum: string): string | null {
      const re = new RegExp('CHAPTER\\s+' + chapterNum + '\\b')
      const idx = pageText.search(re)
      if (idx === -1) return null
      const before = pageText.slice(Math.max(0, idx - 150), idx).trim()
      const words = before.split(/\s+/).filter(Boolean)
      let tail = words.slice(-15).join(' ')
      tail = tail.replace(/^.*?(SECTION|PART)\s*[-–—]?\s*\d+\s*[:.]?\s*/i, '')
      tail = tail.replace(/^\d+\s*/, '')

      // Stage 1: strip a running-header glued to a page number (e.g.
      // "Physiology28") that gets stuck onto the front of the real title
      // when text extraction collapses the page's top margin into one line.
      // Keep only whatever follows the last such glued token.
      const gluedMatches = [...tail.matchAll(/[A-Za-z]{3,}\d{1,4}\s*/g)]
      if (gluedMatches.length) {
        const last = gluedMatches[gluedMatches.length - 1]
        tail = tail.slice((last.index || 0) + last[0].length)
      }

      // Stage 2: some chapter-opener pages have an unrelated sidebar/pull-quote
      // sentence bleeding in before the real title. The real title is always
      // Title-Case text sitting right before "CHAPTER N" - so if there's a
      // genuine sentence boundary (a period) anywhere in the tail, only the
      // text after the LAST one is trustworthy as the title. A plain lowercase
      // word followed by a capitalized word is NOT enough on its own to split
      // on, since normal titles contain connector words like "of"/"in"/"and"
      // followed by capitalized words too.
      const sentenceEnds = [...tail.matchAll(/\.\s+([A-Z][a-zA-Z]*)/g)]
      if (sentenceEnds.length) {
        const last = sentenceEnds[sentenceEnds.length - 1]
        if (typeof last.index === 'number' && last[1]) {
          const captureStart = last.index + last[0].indexOf(last[1])
          tail = tail.slice(captureStart)
        }
      }

      return tail.trim() || null
    }

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i]
      const chapterId = 'ch-' + (i + 1).toString().padStart(2, '0')
      const genericMatch = ch.title.match(/^Chapter\s+(\d+)\s*$/i)

      let text = ''
      let resolvedTitle = ch.title
      let titleFound = !genericMatch

      for (let p = ch.startPage; p <= ch.endPage; p++) {
        const pageText = (contentPageTextCache && contentPageTextCache[p])
          ? contentPageTextCache[p]
          : await (async () => {
              const page = await pdfDoc.getPage(p)
              const content = await page.getTextContent()
              return content.items.map((it: any) => it.str).join(' ')
            })()

        if (!titleFound && genericMatch && p <= ch.startPage + 3) {
          const realTitle = extractRealTitle(pageText, genericMatch[1])
          if (realTitle) {
            resolvedTitle = realTitle
            titleFound = true
          }
        }

        text += pageText + '\n\n'
      }

      await textbookRef.collection('chapters').doc(chapterId).set({
        title: resolvedTitle,
        startPage: ch.startPage,
        endPage: ch.endPage,
        text,
        images: [],
        imageCount: 0,
        imagesExtracted: false,
      })

      chapterSummaries.push({ chapterId, title: resolvedTitle, startPage: ch.startPage, endPage: ch.endPage, textLength: text.length })
    }

    await textbookRef.update({ status: 'ready' })

    return NextResponse.json({ textbookId, totalPages, chapters: chapterSummaries })
  } catch (e: any) {
    console.error('[TEXTBOOK-INGEST] FAILED:', e)
    return NextResponse.json({ error: e.message || 'Ingestion failed' }, { status: 500 })
  }
}
