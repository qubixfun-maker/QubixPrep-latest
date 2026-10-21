export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'

type Item = { subject: string; title: string; sub: string; href: string; hay: string }
const TTL = 10 * 60 * 1000
const cache = new Map<string, { at: number; items: Item[] }>()

async function build(kind: string): Promise<Item[]> {
  const db = getAdminFirestore()
  const subs = (await db.collection('subjects').get()).docs.map((d) => ({ id: d.id, name: String((d.data() as any).name || d.id) }))
  const out: Item[] = []
  await Promise.all(subs.map(async (s) => {
    const col = db.collection('subjects').doc(s.id)
    if (kind === 'notes') {
      const snap = await col.collection('textNotes').get()
      snap.forEach((d) => {
        const x = d.data() as any
        const i = d.id.indexOf('__')
        if (i < 0) return
        const tb = d.id.slice(0, i); const ch = d.id.slice(i + 2)
        const chapter = String(x.chapterTitle || '')
        ;(x.topics || []).forEach((t: any, ti: number) => {
          const title = String(t?.name || '')
          if (title) out.push({ subject: s.name, title, sub: chapter, href: `/notes/${s.id}/${tb}/${ch}/${ti}`, hay: `${title} ${chapter} ${s.name}`.toLowerCase() })
        })
      })
    } else if (kind === 'essays') {
      const snap = await col.collection('essayChapters').get()
      snap.forEach((d) => {
        const title = String((d.data() as any).title || '')
        if (title) out.push({ subject: s.name, title, sub: 'Long, short essays and short answers', href: `/long-answers/${s.id}/${d.id}`, hay: `${title} ${s.name}`.toLowerCase() })
      })
    } else if (kind === 'qbank') {
      const snap = await col.collection('qbankQuestions').get()
      snap.forEach((d) => {
        const x = d.data() as any
        const q = String(x.question_text || '')
        if (!q) return
        const topic = String(x.topic_title || ''); const unit = String(x.unit_title || '')
        out.push({ subject: s.name, title: q.length > 150 ? q.slice(0, 147) + '...' : q, sub: [topic, unit].filter(Boolean).join(' · '), href: `/qbank/${s.id}`, hay: `${q} ${topic} ${unit} ${s.name}`.toLowerCase() })
      })
    }
  }))
  return out
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, kind, q } = await req.json()
    if (!idToken || !['notes', 'essays', 'qbank'].includes(kind)) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    await verifyIdToken(idToken)
    const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)
    if (!words.length || words.join('').length < 2) return NextResponse.json({ results: [], total: 0 })

    let c = cache.get(kind)
    if (!c || Date.now() - c.at > TTL) { c = { at: Date.now(), items: await build(kind) }; cache.set(kind, c) }

    const hits = c.items.filter((it) => words.every((w) => it.hay.includes(w)))
    const first = words[0]
    hits.sort((a, b) => Number(b.title.toLowerCase().includes(first)) - Number(a.title.toLowerCase().includes(first)) || a.title.length - b.title.length)
    return NextResponse.json({ results: hits.slice(0, 40).map(({ hay, ...r }) => r), total: hits.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Search failed' }, { status: 500 })
  }
}
