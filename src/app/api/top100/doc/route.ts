export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { signStoragePath } from '@/lib/quickcards/server'
import { getMember, DocError } from '@/lib/top100-docs-server'

/** Link to one Top 100 sheet. The plan check happens here, on the server. */
export async function POST(req: NextRequest) {
  try {
    const { idToken, id } = await req.json()
    if (!id || typeof id !== 'string') throw new DocError(400, 'Missing topic.')
    const m = await getMember(idToken)
    if (!m.paid) throw new DocError(403, 'Subscribe to open the Top 100 Topics.')
    const snap = await getAdminFirestore().collection('top100Docs').doc(id).get()
    const x: any = snap.data()
    if (!snap.exists || !x?.storagePath || (x.status !== 'published' && !m.isAdmin)) throw new DocError(404, 'Topic not found.')
    return NextResponse.json({ url: await signStoragePath(x.storagePath), title: x.title, subject: x.subject, subjectKey: x.subjectKey, updatedAt: x.updatedAt || 0, email: m.isAdmin ? null : (m.email || m.uid) })
  } catch (e: any) {
    const status = e instanceof DocError ? e.status : 500
    if (status === 500) console.error('[TOP100-DOC]', e?.message)
    return NextResponse.json({ error: e?.message || 'Request failed' }, { status })
  }
}
