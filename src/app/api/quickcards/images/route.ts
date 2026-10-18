export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import {
  getQuickCardsUser,
  getFeatureSettingsServer,
  userMeetsGate,
  signStoragePath,
  HttpError,
} from '@/lib/quickcards/server'
import { getFeature } from '@/lib/quickcards/cardFeatures'
import type { CardImageUrls } from '@/types/quickcards'

/**
 * Returns signed image URLs for every card in a feature that the caller may see.
 * The plan check happens here, on the server. Locked cards get no URLs at all.
 * idToken is optional so free cards work for signed-out visitors too.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, feature } = await req.json()
    if (!getFeature(feature)) throw new HttpError(400, 'Unknown feature.')

    let user
    try {
      user = await getQuickCardsUser(idToken)
    } catch {
      throw new HttpError(401, 'Invalid or expired session. Please sign in again.')
    }

    const settings = await getFeatureSettingsServer(feature)
    if (!settings.visible && !user.isAdmin) throw new HttpError(404, 'This section is not available.')

    const featureAccess = userMeetsGate(user, settings.gate, feature)

    let q = getAdminFirestore().collection('quickCards').where('feature', '==', feature)
    if (!user.isAdmin) q = q.where('status', '==', 'published')
    const snap = await q.get()

    const entries = await Promise.all(
      snap.docs.map(async (doc): Promise<[string, CardImageUrls]> => {
        const c = doc.data() as any
        const allowed = user.isAdmin || featureAccess
        if (!allowed) return [doc.id, { locked: true }]
        const p = c.imagePaths || {}
        const [front, back, thumb] = await Promise.all([
          p.front ? signStoragePath(p.front) : Promise.resolve(undefined),
          p.back ? signStoragePath(p.back) : Promise.resolve(undefined),
          p.thumb ? signStoragePath(p.thumb) : Promise.resolve(undefined),
        ])
        return [doc.id, { front, back, thumb: thumb || front, locked: false }]
      })
    )

    return NextResponse.json({
      urls: Object.fromEntries(entries),
      gate: settings.gate,
      featureAccess,
      signedIn: !!user.uid,
    })
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500
    if (status === 500) console.error('[QUICKCARDS-IMAGES] FAILED:', e.message)
    return NextResponse.json({ error: e.message || 'Request failed' }, { status })
  }
}
