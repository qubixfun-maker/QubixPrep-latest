// Reads a big zip without loading it all into memory, and reads the question spreadsheet inside it.

export type ZipItem = { name: string; method: number; compSize: number; offset: number }

export type PyqQ = {
  id: string; subject: string; exam: string; year: number; session: string | null; paper: string
  qno: number; question: string; options: string[]; correct: number; explanation: string
  qimgs: string[]; eimgs: string[]
}

export async function listZip(file: Blob): Promise<ZipItem[]> {
  const size = file.size
  const tailLen = Math.min(size, 65557)
  const tail = new DataView(await file.slice(size - tailLen).arrayBuffer())
  let p = -1
  for (let i = tailLen - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === 0x06054b50) { p = i; break }
  }
  if (p < 0) throw new Error("This is not a valid zip file.")
  const total = tail.getUint16(p + 10, true)
  const cdSize = tail.getUint32(p + 12, true)
  const cdOff = tail.getUint32(p + 16, true)
  if (cdOff === 0xffffffff || total === 0xffff) throw new Error("Zip64 files are not supported.")
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer())
  const td = new TextDecoder()
  const out: ZipItem[] = []
  let o = 0
  for (let n = 0; n < total && o + 46 <= cd.byteLength; n++) {
    if (cd.getUint32(o, true) !== 0x02014b50) break
    const method = cd.getUint16(o + 10, true)
    const compSize = cd.getUint32(o + 20, true)
    const nameLen = cd.getUint16(o + 28, true)
    const extraLen = cd.getUint16(o + 30, true)
    const commentLen = cd.getUint16(o + 32, true)
    const offset = cd.getUint32(o + 42, true)
    const name = td.decode(new Uint8Array(cd.buffer, cd.byteOffset + o + 46, nameLen))
    if (!name.endsWith("/")) out.push({ name, method, compSize, offset })
    o += 46 + nameLen + extraLen + commentLen
  }
  return out
}

export async function readZipItem(file: Blob, it: ZipItem): Promise<Uint8Array> {
  const head = new DataView(await file.slice(it.offset, it.offset + 30).arrayBuffer())
  if (head.getUint32(0, true) !== 0x04034b50) throw new Error("Bad zip entry: " + it.name)
  const start = it.offset + 30 + head.getUint16(26, true) + head.getUint16(28, true)
  const raw = file.slice(start, start + it.compSize)
  if (it.method === 0) return new Uint8Array(await raw.arrayBuffer())
  if (it.method !== 8) throw new Error("Unsupported zip compression in " + it.name)
  const stream = raw.stream().pipeThrough(new DecompressionStream("deflate-raw") as any)
  return new Uint8Array(await new Response(stream as any).arrayBuffer())
}

const unesc = (s: string) =>
  s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_m, e: string) => {
    if (e === "amp") return "&"
    if (e === "lt") return "<"
    if (e === "gt") return ">"
    if (e === "quot") return '"'
    if (e === "apos") return "'"
    return String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  })

const colIndex = (letters: string) => {
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

const textOf = (body: string) => {
  let s = ""
  for (const m of body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) s += m[1]
  return unesc(s)
}

function parseSheet(xml: string, shared: string[]): (string | null)[][] {
  const rows: (string | null)[][] = []
  for (const rm of xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const row: (string | null)[] = []
    for (const cm of (rm[1] || "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1]
      const body = cm[2] || ""
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs)
      const type = /\bt="(\w+)"/.exec(attrs)?.[1]
      let val: string | null = null
      if (type === "inlineStr") {
        const t = textOf(body)
        val = t === "" ? null : t
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)
        if (v) val = type === "s" ? (shared[parseInt(v[1], 10)] ?? null) : unesc(v[1])
      }
      if (ref) row[colIndex(ref[1])] = val
    }
    rows.push(row)
  }
  return rows
}

export async function readQuestionsXlsx(bytes: Uint8Array): Promise<PyqQ[]> {
  const blob = new Blob([bytes as any])
  const items = await listZip(blob)
  const get = async (name: string) => {
    const it = items.find((x) => x.name === name)
    return it ? new TextDecoder().decode(await readZipItem(blob, it)) : null
  }
  const wb = await get("xl/workbook.xml")
  const rels = await get("xl/_rels/workbook.xml.rels")
  if (!wb || !rels) throw new Error("The spreadsheet inside the zip could not be read.")
  let rid = ""
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = /\bname="([^"]*)"/.exec(m[0])?.[1]
    const id = /\br:id="([^"]*)"/.exec(m[0])?.[1] || ""
    if (!rid) rid = id
    if (name === "Questions") { rid = id; break }
  }
  let target = ""
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    if (new RegExp('\\bId="' + rid + '"').test(m[0])) target = /\bTarget="([^"]*)"/.exec(m[0])?.[1] || ""
  }
  if (!target) throw new Error("Could not find the Questions sheet.")
  target = target.startsWith("/") ? target.slice(1) : "xl/" + target
  const shXml = await get("xl/sharedStrings.xml")
  const shared: string[] = []
  if (shXml) for (const m of shXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) shared.push(textOf(m[1]))
  const sheet = await get(target)
  if (!sheet) throw new Error("The Questions sheet is empty.")

  const rows = parseSheet(sheet, shared)
  const head = (rows[0] || []).map((h) => (h || "").trim())
  const col = (n: string) => head.indexOf(n)
  const need = ["id", "subject", "exam_type", "year", "paper", "question_no", "question", "option_a", "option_b", "option_c", "option_d", "correct_option", "explanation", "question_images", "explanation_images"]
  const lost = need.filter((n) => col(n) < 0)
  if (lost.length) throw new Error("The spreadsheet is missing columns: " + lost.join(", "))
  const img = (v: string | null | undefined) =>
    v ? v.split("|").map((p) => p.trim().split("/").pop() || "").filter(Boolean) : []

  const out: PyqQ[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const g = (n: string) => r[col(n)] ?? null
    const id = g("id")
    if (!id) continue
    const options = ["option_a", "option_b", "option_c", "option_d"].map(g).filter((o): o is string => typeof o === "string" && o.trim() !== "")
    out.push({
      id,
      subject: g("subject") || "",
      exam: g("exam_type") || "",
      year: parseInt(g("year") || "0", 10),
      session: g("session") || null,
      paper: g("paper") || "",
      qno: parseInt(g("question_no") || "0", 10),
      question: g("question") || "",
      options,
      correct: "abcd".indexOf((g("correct_option") || "").trim().toLowerCase()),
      explanation: g("explanation") || "",
      qimgs: img(g("question_images")),
      eimgs: img(g("explanation_images")),
    })
  }
  return out
}
