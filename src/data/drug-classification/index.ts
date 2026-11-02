import c1 from "./chapter-1.json"
import c2 from "./chapter-2.json"
import c3 from "./chapter-3.json"
import c4 from "./chapter-4.json"
import c5 from "./chapter-5.json"
import c6 from "./chapter-6.json"
import c7 from "./chapter-7.json"
import c8 from "./chapter-8.json"
import c9 from "./chapter-9.json"
import c10 from "./chapter-10.json"
import c11 from "./chapter-11.json"
import c12 from "./chapter-12.json"
import c13 from "./chapter-13.json"
import c14 from "./chapter-14.json"

export type Drug = string | { n: string; d?: string; b?: string }
export type DrugNode = { name: string; drugs?: Drug[]; children?: DrugNode[] }
export type DrugChart = { id: string; title: string; root: DrugNode; footnote?: string }
export type DrugChapter = { id: string; number: number; title: string; charts: DrugChart[] }

// One file per chapter (chapter-N.json, made from the master text outline).
export const DRUG_CHAPTERS: DrugChapter[] = ([c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14] as DrugChapter[]).sort((a, b) => a.number - b.number)

export const drugName = (d: Drug) => (typeof d === "string" ? d : d.n)
export const drugDose = (d: Drug) => (typeof d === "string" ? "" : d.d || "")
export const drugBrand = (d: Drug) => (typeof d === "string" ? "" : d.b || "")
