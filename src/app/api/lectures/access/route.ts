export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { getQuickCardsUser, signStoragePath, HttpError } from '@/lib/quickcards/server'

/**
 * Returns signed URLs for one lecture's video and notes PDF.
 * The plan check happens here, on the server: free preview lectures need only a
 * signed-in user, everything else needs Scholar/Clinician (or admin).
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, lectureId } = await req.json()
    if (!idToken) throw new HttpError(401, 'Please sign in to watch.')
    if (!lectureId || typeof lectureId !== 'string') throw new HttpError(400, 'Missing lecture.')

    let user
    try { user = await getQuickCardsUser(idToken) } catch { throw new HttpError(401, 'Invalid or expired session. Please sign in again.') }

    const snap = await getAdminFirestore().collection('lectures').doc(lectureId).get()
    if (!snap.exists) throw new HttpError(404, 'Lecture not found.')
    const l = snap.data() as any
    if (l.status !== 'published' && !user.isAdmin) throw new HttpError(404, 'Lecture not found.')

    const paid = user.plan === 'basic' || user.plan === 'pro'
    if (!user.isAdmin && !l.free && !paid) throw new HttpError(403, 'Subscribe to watch this lecture.')

    const [videoUrl, notesUrl] = await Promise.all([
      l.videoPath ? signStoragePath(l.videoPath) : Promise.resolve(null),
      l.notesPath ? signStoragePath(l.notesPath) : Promise.resolve(null),
    ])
    return NextResponse.json({ videoUrl, notesUrl })
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500
    if (status === 500) console.error('[LECTURES-ACCESS] FAILED:', e.message)
    return NextResponse.json({ error: e.message || 'Request failed' }, { status })
  }
}
