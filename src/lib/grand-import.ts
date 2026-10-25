// Reads one Grand Test zip (an .xlsx of questions + an images folder), checks it strictly and returns a clean paper.
// Runs in the browser (admin import page). Nothing here talks to the database.
import JSZip from "jszip"

export type PaperQ = { n: number; ch: number; subj: string; q: string; o: string[]; c: number; e: string; qi: string[]; ei: string[] }
export type Credit = { n: number; img: string; title: string; authors: string; journal: string; year: string; pmcid: string; licence: string; url: string }
export type ParsedPaper = {
  fileName: string
  n: number
  id: string
  title: string
  qs: PaperQ[]
  credits: Credit[]
  images: Record<string, Uint8Array>
  subjects: { name: string; n: number }[]
  errors: string[]
  warnings: string[]
}

export const paperIdOf = (n: number) => "gt" + String(n).padStart(2, "0")
export const MAX_IMAGE_BYTES = 700 * 1024

/* ---------------- xlsx reading (no extra library besides jszip) ---------------- */

function xml(text: string): Document {
  const P = (globalThis as any).DOMParser
  return new P().parseFromString(text, "application/xml")
}
const kids = (el: Element, tag: string): Element[] => Array.from(el.getElementsByTagName(tag))
const textOf = (el: Element): string => kids(el, "t").filter((t) => (t.parentNode as Element)?.nodeName !== "rPh").map((t) => t.textContent || "").join("")
const colIndex = (ref: string): number => {
  const m = /^([A-Z]+)/i.exec(ref) as RegExpExecArray
  let n = 0
  for (const ch of m[1].toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

export async function readXlsx(buf: Uint8Array | ArrayBuffer): Promise<Record<string, string[][]>> {
  const zip = await JSZip.loadAsync(buf)
  const read = async (p: string) => { const f = zip.file(p); return f ? await f.async("string") : null }
  const wbXml = await read("xl/workbook.xml")
  const relXml = await read("xl/_rels/workbook.xml.rels")
  if (!wbXml || !relXml) throw new Error("This is not a valid .xlsx file.")
  const rels: Record<string, string> = {}
  kids(xml(relXml).documentElement, "Relationship").forEach((r) => {
    const t = r.getAttribute("Target") || ""
    rels[r.getAttribute("Id") || ""] = t.startsWith("/") ? t.slice(1) : "xl/" + t.replace(/^\.\//, "")
  })
  const sharedXml = await read("xl/sharedStrings.xml")
  const shared: string[] = sharedXml ? kids(xml(sharedXml).documentElement, "si").map(textOf) : []

  const out: Record<string, string[][]> = {}
  for (const s of kids(xml(wbXml).documentElement, "sheet")) {
    const name = s.getAttribute("name") || ""
    const rid = s.getAttribute("r:id") || s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || ""
    const sx = rels[rid] ? await read(rels[rid]) : null
    if (!sx) continue
    const rows: string[][] = []
    for (const row of kids(xml(sx).documentElement, "row")) {
      const r: string[] = []
      for (const c of Array.from(row.childNodes).filter((n) => n.nodeName === "c") as Element[]) {
        const i = colIndex(c.getAttribute("r") || "A1")
        const t = c.getAttribute("t")
        let v = ""
        if (t === "inlineStr") v = textOf(c)
        else {
          const ve = kids(c, "v")[0]
          const raw = ve ? ve.textContent || "" : ""
          v = t === "s" ? shared[Number(raw)] ?? "" : raw
        }
        r[i] = v
      }
      rows.push(Array.from(r, (x) => (x === undefined ? "" : x)))
    }
    out[name] = rows
  }
  return out
}

/* ---------------- one paper ---------------- */

const clean = (s: any) => String(s ?? "").replace(/\s+\n/g, "\n").trim()
const baseName = (p: string) => p.split(/[\\/]/).pop() as string
const safeName = (id: string, file: string) => `${id}_${baseName(file).toLowerCase().replace(/[^a-z0-9._-]+/g, "_")}`
const splitList = (s: string) => clean(s).split(/[,;|\n]+/).map((x) => x.trim()).filter(Boolean)

export async function parsePaperZip(fileName: string, data: Uint8Array | ArrayBuffer): Promise<ParsedPaper> {
  const errors: string[] = [], warnings: string[] = []
  const m = /grand\s*test[\s_-]*(\d+)/i.exec(fileName) || /(\d+)/.exec(fileName)
  const n = m ? Number(m[1]) : 0
  if (!n) errors.push("The file name must contain the test number, for example grandtest7_qbank.zip.")
  const id = paperIdOf(n || 0)
  const paper: ParsedPaper = { fileName, n, id, title: `Grand Test ${n}`, qs: [], credits: [], images: {}, subjects: [], errors, warnings }

  let zip: JSZip
  try { zip = await JSZip.loadAsync(data) } catch { errors.push("This is not a valid zip file."); return paper }
  const names = Object.keys(zip.files).filter((p) => !zip.files[p].dir && !/(^|\/)(__MACOSX|\.DS_Store|~\$)/.test(p))
  const xlsxName = names.find((p) => /\.xlsx$/i.test(p) && !baseName(p).startsWith("~$"))
  if (!xlsxName) { errors.push("No .xlsx file found inside the zip."); return paper }

  let sheets: Record<string, string[][]>
  try { sheets = await readXlsx(await (zip.file(xlsxName) as JSZip.JSZipObject).async("uint8array")) } catch (e: any) { errors.push(e?.message || "Could not read the spreadsheet."); return paper }
  const qsheet = sheets["Questions"] || sheets[Object.keys(sheets)[0]]
  if (!qsheet || qsheet.length < 2) { errors.push("The Questions sheet is empty."); return paper }

  const head = (qsheet[0] || []).map((h) => clean(h).toLowerCase())
  const col = (k: string) => head.indexOf(k)
  const need = ["chapter_no", "chapter", "question_no", "question", "option_a", "option_b", "option_c", "option_d", "correct_option"]
  const lack = need.filter((k) => col(k) < 0)
  if (lack.length) { errors.push("The Questions sheet is missing these columns: " + lack.join(", ")); return paper }
  const ix = { chNo: col("chapter_no"), ch: col("chapter"), no: col("question_no"), q: col("question"), a: col("option_a"), b: col("option_b"), c: col("option_c"), d: col("option_d"), ok: col("correct_option"), okText: col("correct_answer_text"), ex: col("explanation"), qi: col("question_images"), ei: col("explanation_images") }

  // image lookup: exact path first, then by file name anywhere in the zip
  const imageFiles = names.filter((p) => /\.(jpe?g|png|webp|gif)$/i.test(p))
  const find = (ref: string) => imageFiles.find((p) => p.toLowerCase() === ref.toLowerCase()) || imageFiles.find((p) => baseName(p).toLowerCase() === baseName(ref).toLowerCase())
  const used = new Map<string, string>() // stored name -> path in zip
  const resolveImgs = (cell: string, no: number, kind: string): string[] => {
    const out: string[] = []
    for (const ref of splitList(cell)) {
      const p = find(ref)
      if (!p) { errors.push(`Q${no}: ${kind} image "${ref}" is not in the zip.`); continue }
      const stored = safeName(id, p)
      used.set(stored, p)
      out.push(stored)
    }
    return out
  }

  const seen = new Set<number>()
  const get = (r: string[], i: number) => (i >= 0 ? clean(r[i]) : "")
  for (let ri = 1; ri < qsheet.length; ri++) {
    const r = qsheet[ri] || []
    if (r.every((x) => !clean(x))) continue
    const no = Number(get(r, ix.no))
    const label = Number.isFinite(no) && no > 0 ? `Q${no}` : `Row ${ri + 1}`
    if (!Number.isInteger(no) || no < 1) { errors.push(`${label}: question_no is not a number.`); continue }
    if (seen.has(no)) { errors.push(`${label}: question_no appears twice.`); continue }
    seen.add(no)
    const o = [get(r, ix.a), get(r, ix.b), get(r, ix.c), get(r, ix.d)]
    const q = get(r, ix.q)
    if (!q) { errors.push(`${label}: the question is empty.`); continue }
    if (o.some((x) => !x)) { errors.push(`${label}: one of the four options is empty.`); continue }
    const k = get(r, ix.ok).toLowerCase()
    const c = "abcd".indexOf(k)
    if (k.length !== 1 || c < 0) { errors.push(`${label}: correct_option must be a, b, c or d (found "${k}").`); continue }
    const okText = get(r, ix.okText)
    if (okText && okText !== o[c]) warnings.push(`${label}: correct_answer_text does not match option ${k.toUpperCase()}.`)
    const e = get(r, ix.ex)
    if (!e) warnings.push(`${label}: no explanation.`)
    const subj = get(r, ix.ch)
    if (!subj) { errors.push(`${label}: chapter (subject) is empty.`); continue }
    paper.qs.push({ n: no, ch: Number(get(r, ix.chNo)) || 0, subj, q, o, c, e, qi: resolveImgs(get(r, ix.qi), no, "question"), ei: resolveImgs(get(r, ix.ei), no, "explanation") })
  }
  paper.qs.sort((x, y) => x.n - y.n)
  if (paper.qs.length === 0) errors.push("No questions were found.")
  else if (paper.qs.length !== 200) warnings.push(`This paper has ${paper.qs.length} questions, not 200.`)

  const tally = new Map<string, number>()
  paper.qs.forEach((x) => tally.set(x.subj, (tally.get(x.subj) || 0) + 1))
  paper.subjects = Array.from(tally, ([name, k]) => ({ name, n: k }))

  // image credits (needed for the CC BY licence)
  const cs = sheets["Image_Credits"]
  if (cs && cs.length > 1) {
    const h = cs[0].map((x) => clean(x).toLowerCase())
    const g = (r: string[], k: string) => clean(r[h.indexOf(k)])
    for (const r of cs.slice(1)) {
      if (!g(r, "image_file")) continue
      paper.credits.push({ n: Number(g(r, "question_no")) || 0, img: safeName(id, g(r, "image_file")), title: g(r, "article_title"), authors: g(r, "authors"), journal: g(r, "journal"), year: g(r, "year"), pmcid: g(r, "pmcid"), licence: g(r, "licence"), url: g(r, "source_url") })
    }
  }
  if (used.size > 0 && paper.credits.length === 0) warnings.push("This paper has images but no Image_Credits sheet.")
  for (const stored of used.keys()) if (paper.credits.length && !paper.credits.some((c) => c.img === stored)) warnings.push(`Image ${stored} has no credit line.`)

  for (const [stored, p] of used) {
    const bytes = await (zip.file(p) as JSZip.JSZipObject).async("uint8array")
    if (bytes.length > MAX_IMAGE_BYTES) errors.push(`Image ${baseName(p)} is ${Math.round(bytes.length / 1024)} KB; the limit is ${Math.round(MAX_IMAGE_BYTES / 1024)} KB. Shrink it and zip again.`)
    paper.images[stored] = bytes
  }
  const approx = JSON.stringify(paper.qs).length + JSON.stringify(paper.credits).length
  if (approx > 900_000) errors.push("The questions are too large for one record (" + Math.round(approx / 1000) + " KB).")
  return paper
}
