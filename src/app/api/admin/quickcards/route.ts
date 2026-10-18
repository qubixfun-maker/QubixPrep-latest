export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import { requireQuickCardsAdmin, HttpError } from '@/lib/quickcards/server'
import { getFeature } from '@/lib/quickcards/cardFeatures'

const GATES = ['free', 'basic', 'pro', 'addon']
const AUDIENCES = ['MBBS', 'NEET-PG', 'both']
const STATUSES = ['draft', 'published']

async function deleteFileQuietly(path?: string) {
  if (!path) return
  try {
    await getAdminStorageBucket().file(path).delete({ ignoreNotFound: true })
  } catch (e: any) {
    console.error('[QUICKCARDS] could not delete', path, e.message)
  }
}

function pathBelongsTo(path: unknown, feature: string, cardId: string): path is string {
  return typeof path === 'string' && path.startsWith(`quickcards/${feature}/${cardId}-`) && !path.includes('..')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await requireQuickCardsAdmin(body.idToken)
    const db = getAdminFirestore()
    const cards = db.collection('quickCards')

    switch (body.action) {
      // Called after the browser has uploaded the image(s) to Storage
      case 'upsert-image': {
        const { cardId, feature, side, path, thumbPath, blurData } = body
        const cfg = getFeature(feature)
        if (!cfg || typeof cardId !== 'string' || !cardId) throw new HttpError(400, 'Invalid feature or card ID.')
        if (side !== 'front' && side !== 'back') throw new HttpError(400, 'Invalid side.')
        if (!pathBelongsTo(path, feature, cardId)) throw new HttpError(400, 'Invalid storage path.')
        if (thumbPath !== undefined && !pathBelongsTo(thumbPath, feature, cardId)) throw new HttpError(400, 'Invalid thumbnail path.')

        const ref = cards.doc(cardId)
        const snap = await ref.get()
        const existing = snap.data() as any

        if (existing && existing.feature !== feature) {
          throw new HttpError(400, `${cardId} already belongs to another feature.`)
        }

        const oldPaths = existing?.imagePaths || {}
        const imagePaths: Record<string, string> = { ...oldPaths }
        const toDelete: string[] = []

        if (side === 'front') {
          if (oldPaths.front && oldPaths.front !== path) toDelete.push(oldPaths.front)
          imagePaths.front = path
          if (thumbPath) {
            if (oldPaths.thumb && oldPaths.thumb !== thumbPath) toDelete.push(oldPaths.thumb)
            imagePaths.thumb = thumbPath
          }
        } else {
          if (oldPaths.back && oldPaths.back !== path) toDelete.push(oldPaths.back)
          imagePaths.back = path
        }

        if (snap.exists) {
          const update: Record<string, any> = { imagePaths }
          if (side === 'front' && typeof blurData === 'string' && blurData.length < 4000) update.blurData = blurData
          await ref.update(update)
        } else {
          const numMatch = cardId.match(/(\d+)$/)
          await ref.set({
            feature,
            cardId,
            title: cardId,
            tags: [],
            audience: cfg.audience,
            imagePaths: { front: '', ...imagePaths },
            storageProvider: 'firebase',
            order: numMatch ? parseInt(numMatch[1], 10) : 9999,
            status: 'draft',
            isFree: false,
            ...(side === 'front' && typeof blurData === 'string' && blurData.length < 4000 ? { blurData } : {}),
            createdAt: FieldValue.serverTimestamp(),
          })
        }

        await Promise.all(toDelete.map(deleteFileQuietly))
        return NextResponse.json({ ok: true, created: !snap.exists })
      }

      case 'update-card': {
        const { cardId, fields } = body
        if (typeof cardId !== 'string' || !fields || typeof fields !== 'object') throw new HttpError(400, 'Missing card or fields.')
        const update: Record<string, any> = {}
        if (typeof fields.title === 'string') update.title = fields.title.trim().slice(0, 200)
        if (Array.isArray(fields.tags)) update.tags = fields.tags.filter((t: any) => typeof t === 'string').slice(0, 30)
        if (AUDIENCES.includes(fields.audience)) update.audience = fields.audience
        if (typeof fields.order === 'number' && Number.isFinite(fields.order)) update.order = fields.order
        if (typeof fields.isFree === 'boolean') update.isFree = fields.isFree
        if (STATUSES.includes(fields.status)) update.status = fields.status
        if (Object.keys(update).length === 0) throw new HttpError(400, 'Nothing to update.')

        if (update.status === 'published') {
          const snap = await cards.doc(cardId).get()
          if (!snap.exists) throw new HttpError(404, 'Card not found.')
          if (!(snap.data() as any)?.imagePaths?.front) throw new HttpError(400, 'Upload the front image before publishing.')
        }
        await cards.doc(cardId).update(update)
        return NextResponse.json({ ok: true })
      }

      case 'bulk-update': {
        const { cardIds, fields } = body
        if (!Array.isArray(cardIds) || cardIds.length === 0 || cardIds.length > 400) throw new HttpError(400, 'Invalid card list.')
        const update: Record<string, any> = {}
        if (typeof fields?.isFree === 'boolean') update.isFree = fields.isFree
        if (STATUSES.includes(fields?.status)) update.status = fields.status
        if (Object.keys(update).length === 0) throw new HttpError(400, 'Nothing to update.')

        let changed = 0
        let skipped = 0
        for (let i = 0; i < cardIds.length; i += 400) {
          const batch = db.batch()
          const chunk: string[] = cardIds.slice(i, i + 400)
          const snaps = await Promise.all(chunk.map((id) => cards.doc(id).get()))
          snaps.forEach((s) => {
            if (!s.exists) { skipped++; return }
            if (update.status === 'published' && !(s.data() as any)?.imagePaths?.front) { skipped++; return }
            batch.update(s.ref, update)
            changed++
          })
          await batch.commit()
        }
        return NextResponse.json({ ok: true, changed, skipped })
      }

      case 'delete-card': {
        const { cardId } = body
        if (typeof cardId !== 'string' || !cardId) throw new HttpError(400, 'Missing card ID.')
        const ref = cards.doc(cardId)
        const snap = await ref.get()
        if (!snap.exists) return NextResponse.json({ ok: true })
        const paths = (snap.data() as any)?.imagePaths || {}
        await ref.delete()
        await Promise.all([paths.front, paths.back, paths.thumb].map(deleteFileQuietly))
        return NextResponse.json({ ok: true })
      }

      case 'save-settings': {
        const { slug, visible, gate } = body
        if (!getFeature(slug)) throw new HttpError(400, 'Unknown feature.')
        if (typeof visible !== 'boolean' || !GATES.includes(gate)) throw new HttpError(400, 'Invalid settings.')
        await db.collection('quickCardSettings').doc(slug).set({ visible, gate, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
        return NextResponse.json({ ok: true })
      }

      default:
        throw new HttpError(400, 'Unknown action.')
    }
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500
    if (status === 500) console.error('[QUICKCARDS-ADMIN] FAILED:', e.message)
    return NextResponse.json({ error: e.message || 'Request failed' }, { status })
  }
}
