export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { getMember, DocError } from '@/lib/top100-docs-server'

/** The Top 100 list (titles only). Any signed-in user can see it; the sheets themselves need a paid plan. */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    const m = await getMember(idToken)
    const snap = await getAdminFirestore().collection('top100Docs').get()
    const docs: any[] = []
    snap.forEach((d) => {
      const x: any = d.data()
      if (x.status === 'published' || m.isAdmin) docs.push({ id: d.id, title: x.title, subject: x.subject, subjectKey: x.subjectKey, order: x.order || 0, chapter: x.chapter || 0, status: x.status, sizeBytes: x.sizeBytes || 0 })
    })
    docs.sort((a, b) => a.subject.localeCompare(b.subject) || a.chapter - b.chapter || a.title.localeCompare(b.title))
    return NextResponse.json({ docs })
  } catch (e: any) {
    const status = e instanceof DocError ? e.status : 500
    if (status === 500) console.error('[TOP100-LIST]', e?.message)
    return NextResponse.json({ error: e?.message || 'Request failed' }, { status })
  }
}
