export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { repairPdfText } from '@/lib/pdf-text-repair'
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
    console.log(`[INGEST] "${title}" - ${totalPages} pages`)

    const outline = await pdfDoc.getOutline()
    console.log(`[INGEST] Bookmarks/outline present: ${!!outline}${outline ? `, ${outline.length} top-level entries` : ''}`)

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
    console.log(`[INGEST] Flat bookmark entries with resolvable page numbers: ${flatEntries.length}`)

    let chapterEntries: { title: string; page: number }[] = flatEntries.filter(e => /^\d+\.\s/.test(e.title) || /^Chapter\s+\d+\b/i.test(e.title))
    console.log(`[INGEST] Bookmarks matching "N. Title" or "Chapter N" pattern directly: ${chapterEntries.length}`)

    // Bookmark fallback: some books' real chapters live at a nested outline
    // depth mixed in with unrelated numbering at other depths (e.g. depth 0
    // = "1 PART NAME" section headers, depth 1 = "1 Actual Chapter Title"
    // chapters with no period after the number, depth 2 = sub-headings
    // within a chapter). Rather than assume chapters sit at any particular
    // depth, every depth is scored by how many sequentially-numbered
    // (1, 2, 3...) entries it contains, and the best-scoring depth wins.
    function parseNumberedTitle(raw: string): { num: number; title: string } | null {
      // [\s\-]+ after "Chapter" and [.:_\s\-]* before the title covers
      // "Chapter 1: Title", "Chapter-01_Title", "Chapter 5" (no title), etc.
      let m = raw.match(/^Chapter[\s\-]+(\d+)[.:_\s\-]*(.*)$/i)
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
      console.log(`[INGEST] Best-depth bookmark sequence found: ${bestSeq.length} entries (need >=2 to use)`)
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

    // Last resort: books with a plain, unnumbered Contents page (just a list
    // of topic names, no numbers, no page references - common in condensed
    // exam-notes style PDFs like scanned handwritten study guides). Each TOC
    // line is fuzzy-matched against the first line of every subsequent page
    // (a running header), tolerating OCR noise via per-word similarity.
    function extractPageLines(items: any[]): string[] {
      const lineMap = new Map<number, { y: number; parts: { x: number; str: string }[] }>()
      for (const it of items) {
        if (!it.str || !it.str.trim()) continue
        const y = Math.round(it.transform[5])
        let key: number | null = null
        for (const k of lineMap.keys()) {
          if (Math.abs(k - y) <= 2) { key = k; break }
        }
        if (key === null) key = y
        if (!lineMap.has(key)) lineMap.set(key, { y, parts: [] })
        lineMap.get(key)!.parts.push({ x: it.transform[4], str: it.str })
      }
      return [...lineMap.values()]
        .sort((a, b) => b.y - a.y)
        .map((line) => line.parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(' ').trim())
        .filter((l) => l.length > 0)
    }

    function levenshtein(a: string, b: string): number {
      const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
      for (let i = 0; i <= a.length; i++) dp[i][0] = i
      for (let j = 0; j <= b.length; j++) dp[0][j] = j
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
        }
      }
      return dp[a.length][b.length]
    }

    function wordSimilarity(a: string, b: string): number {
      if (a === b) return 1
      const longer = a.length > b.length ? a : b
      const shorter = a.length > b.length ? b : a
      if (longer.length === 0) return 1
      return (longer.length - levenshtein(longer, shorter)) / longer.length
    }

    function normalizeWords(s: string): string[] {
      return s.toUpperCase().replace(/[^A-Z ]/g, '').split(/\s+/).filter(Boolean)
    }

    function titleSimilarity(tocWords: string[], headerWords: string[]): number {
      if (tocWords.length === 0 || headerWords.length === 0) return 0
      let matches = 0
      for (const tw of tocWords) {
        const best = Math.max(0, ...headerWords.map((hw) => wordSimilarity(tw, hw)))
        if (best > 0.75) matches++
      }
      return matches / tocWords.length
    }

    // Shared by every TOC-title-list strategy below: given an ordered list of
    // candidate chapter titles (source varies - see callers), fuzzy-match
    // each one in order against the first line of every subsequent page
    // (a running header), tolerating OCR/extraction noise. Only ever
    // advances forward through the list, never backward, to avoid false
    // positives between lexically-similar titles.
    async function locateTitlesInBody(pdfDoc: any, titles: string[], searchFromPage: number, totalPages: number): Promise<Map<number, number>> {
      const titleNorm = titles.map((t) => normalizeWords(t))
      const found = new Map<number, number>()
      let idx = 0
      for (let p = searchFromPage; p <= totalPages && idx < titles.length; p++) {
        const page = await pdfDoc.getPage(p)
        const content = await page.getTextContent()
        const lines = extractPageLines(content.items)
        if (lines.length === 0) continue
        const headerWords = normalizeWords(lines[0])
        const sim = titleSimilarity(titleNorm[idx], headerWords)
        if (sim >= 0.6) {
          found.set(idx, p)
          idx++
        }
      }
      console.log(`[INGEST] locateTitlesInBody: matched ${found.size} of ${titles.length} titles (searched from page ${searchFromPage})`)
      return found
    }

    async function findTocSuggestions(pdfDoc: any, totalPages: number): Promise<{ title: string; page: number | null }[] | null> {
      let tocPageNum: number | null = null
      let tocLines: string[] = []
      for (let p = 1; p <= Math.min(15, totalPages); p++) {
        const page = await pdfDoc.getPage(p)
        const content = await page.getTextContent()
        const lines = extractPageLines(content.items)
        if (lines.length >= 2 && /^contents$/i.test(lines[0].trim())) {
          tocPageNum = p
          tocLines = lines.slice(1)
          break
        }
      }
      console.log(`[INGEST] findTocSuggestions: "Contents" page found at page ${tocPageNum ?? 'NONE'}${tocPageNum ? `, ${tocLines.length} lines after it` : ''}`)
      if (!tocPageNum || tocLines.length < 2) return null

      const tocTitles = tocLines.filter((l) => l.length >= 2 && l.length <= 120)
      console.log(`[INGEST] findTocSuggestions: ${tocTitles.length} candidate title lines (length 2-120 chars) out of ${tocLines.length} total lines`)
      // Even if very few (or zero) pages get auto-located, the titles themselves were
      // correctly extracted - discarding them here (as the old "found.size < 2" gate did)
      // threw away good data the admin could have reviewed and filled in manually. Return
      // the full title list whenever there are at least 2 titles, regardless of how many
      // got a located page.
      const found = await locateTitlesInBody(pdfDoc, tocTitles, tocPageNum + 1, totalPages)
      if (tocTitles.length < 2) return null

      return tocTitles.map((title, i) => ({ title, page: found.has(i) ? found.get(i)! : null }))
    }

    // For books with no bookmarks and no "Contents" page (or one page.js
    // can't cleanly isolate), scan the WHOLE document for a numbered listing
    // like "1. Wound, Keloid..." / "2. Acute Infections..." - common as a
    // per-section chapter list scattered near each section's start, rather
    // than one single front-matter TOC. Only lines that look like short
    // title phrases are kept (long sentences ending in ":" or "?" are almost
    // always multiple-choice questions using the same "N. text" numbering,
    // not chapters), and only a page with at least 2 CONSECUTIVE expected
    // chapter numbers together is trusted - an isolated single match is far
    // more likely to be an unrelated coincidence (e.g. one MCQ option that
    // happens to share a number with the next real chapter).
    function looksLikeChapterTitle(title: string): boolean {
      if (title.length > 90) return false
      const words = title.split(/\s+/)
      if (words.length > 10) return false
      if (/[:?]$/.test(title.trim())) return false
      return true
    }

    // Titles that visually wrap to a second line in the source TOC (e.g.
    // "4. Adolescent Health and" / "Development" on the next line) end up
    // truncated by a single-line regex. A title ending in a connector word
    // is unambiguously incomplete, so the next line gets pulled in as its
    // continuation - but only then, to avoid ever appending an unrelated
    // line (like an author-name credit) onto an already-complete title.
    const TITLE_CONTINUATION_WORDS = new Set(['and', 'of', 'the', 'in', 'to', 'for', 'with', 'or', 'a', 'an', '&', 'vs', 'on', 'from', 'as'])

    function stripTrailingPageNumber(s: string): string {
      return s.replace(/\s+\d{1,4}\s*$/, '').trim()
    }

    async function findNumberedListingTitles(pdfDoc: any, totalPages: number): Promise<Map<number, string> | null> {
      // \s* (not \s+) - some TOCs have no space after the period at all,
      // e.g. "19.Disaster Management." Requiring a space silently skipped
      // those entries, sending the scan hunting through the rest of the
      // document and picking up unrelated numbered lists instead.
      const linePattern = /^(\d+)\.\s*(.+)$/
      const found = new Map<number, string>()
      let lastNum = 0
      let pagesWithAnyNumberedLine = 0

      for (let p = 1; p <= totalPages; p++) {
        const page = await pdfDoc.getPage(p)
        const content = await page.getTextContent()
        const lines = extractPageLines(content.items)
        const pageMatches: { num: number; title: string }[] = []
        for (let li = 0; li < lines.length; li++) {
          const m = lines[li].match(linePattern)
          if (!m) continue
          let title = stripTrailingPageNumber(m[2].trim())
          const lastWord = title.split(/\s+/).pop()?.toLowerCase().replace(/,$/, '') || ''
          if (TITLE_CONTINUATION_WORDS.has(lastWord) && li + 1 < lines.length) {
            const nextLine = lines[li + 1]
            if (!linePattern.test(nextLine) && nextLine.length < 60) {
              title = stripTrailingPageNumber(title + ' ' + nextLine)
            }
          }
          if (looksLikeChapterTitle(title)) {
            pageMatches.push({ num: parseInt(m[1], 10), title })
          }
        }
        if (pageMatches.length === 0) continue
        pagesWithAnyNumberedLine++

        const accepted: { num: number; title: string }[] = []
        let expect = lastNum + 1
        for (const { num, title } of pageMatches) {
          if (num === expect) {
            accepted.push({ num, title })
            expect++
          }
        }
        if (accepted.length >= 2) {
          for (const { num, title } of accepted) found.set(num, title)
          lastNum = accepted[accepted.length - 1].num
        }
      }

      console.log(`[INGEST] findNumberedListingTitles: ${pagesWithAnyNumberedLine} pages had at least one "N. Title"-shaped line; ${found.size} titles accepted into a sequential run`)
      if (found.size < 2) return null
      return found
    }

    async function findNumberedListingSuggestions(pdfDoc: any, totalPages: number): Promise<{ title: string; page: number | null }[] | null> {
      const titleMap = await findNumberedListingTitles(pdfDoc, totalPages)
      if (!titleMap) return null

      const maxNum = Math.max(...titleMap.keys())
      const orderedTitles: string[] = []
      for (let n = 1; n <= maxNum; n++) {
        orderedTitles.push(titleMap.get(n) || `Chapter ${n}`)
      }
      console.log(`[INGEST] findNumberedListingSuggestions: built ordered title list of ${orderedTitles.length} entries (max chapter number seen: ${maxNum}), now locating them in body...`)

      // Same reasoning as findTocSuggestions above - titles were correctly extracted
      // even when page-location fails, so return them regardless rather than discarding.
      const found = await locateTitlesInBody(pdfDoc, orderedTitles, 1, totalPages)
      if (orderedTitles.length < 2) return null

      return orderedTitles.map((title, i) => ({ title, page: found.has(i) ? found.get(i)! : null }))
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
      console.log(`[INGEST] Per-page "CHAPTER N TITLE" running-header scan: ${detected.length} matches. Colon-style "Chapter N:" candidates: ${colonCandidates.size} distinct numbers`)

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
        console.log(`[INGEST] Colon-style sequential chapters accepted: ${detected.length}`)
      }

      if (detected.length < 2) {
        console.log(`[INGEST] Falling through to findNumberedListingSuggestions...`)
        const numberedSuggestions = await findNumberedListingSuggestions(pdfDoc, totalPages)
        if (numberedSuggestions && numberedSuggestions.length >= 2) {
          console.log(`[INGEST] SUCCESS via numbered listing: ${numberedSuggestions.length} suggestions, ${numberedSuggestions.filter(s => s.page !== null).length} with a located page`)
          return NextResponse.json({
            error: 'No chapters could be detected from bookmarks or page content. This textbook\'s structure isn\'t supported yet.',
            suggestedChapters: numberedSuggestions,
          }, { status: 400 })
        }
        console.log(`[INGEST] findNumberedListingSuggestions did not yield >=2 suggestions. Falling through to findTocSuggestions...`)

        const tocSuggestions = await findTocSuggestions(pdfDoc, totalPages)
        if (tocSuggestions && tocSuggestions.length >= 2) {
          console.log(`[INGEST] SUCCESS via TOC page: ${tocSuggestions.length} suggestions, ${tocSuggestions.filter(s => s.page !== null).length} with a located page`)
          return NextResponse.json({
            error: 'No chapters could be detected from bookmarks or page content. This textbook\'s structure isn\'t supported yet.',
            suggestedChapters: tocSuggestions,
          }, { status: 400 })
        }
        console.log(`[INGEST] findTocSuggestions did not yield >=2 suggestions either. Giving up with no suggestions.`)

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

      // Repair ligature corruption ("in fl ammation" -> "inflammation") before storing.
      // Fixing it here means every downstream feature reads clean source text; fixing it
      // later would leave already-generated content damaged.
      const repairedText = repairPdfText(text)
      const repairedTitle = repairPdfText(resolvedTitle)

      await textbookRef.collection('chapters').doc(chapterId).set({
        title: repairedTitle,
        startPage: ch.startPage,
        endPage: ch.endPage,
        text: repairedText,
        images: [],
        imageCount: 0,
        imagesExtracted: false,
      })

      chapterSummaries.push({ chapterId, title: repairedTitle, startPage: ch.startPage, endPage: ch.endPage, textLength: repairedText.length })
    }

    await textbookRef.update({ status: 'ready' })

    return NextResponse.json({ textbookId, totalPages, chapters: chapterSummaries })
  } catch (e: any) {
    console.error('[TEXTBOOK-INGEST] FAILED:', e)
    return NextResponse.json({ error: e.message || 'Ingestion failed' }, { status: 500 })
  }
}
