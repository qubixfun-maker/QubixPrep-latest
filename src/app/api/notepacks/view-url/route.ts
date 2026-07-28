export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { idToken, packId } = await req.json()

    if (!idToken || !packId) {
      return NextResponse.json({ error: 'Missing idToken or packId' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const uid = decoded.uid

    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(uid).get()
    const userData = userDoc.data()

    const isAdmin = userData?.role === 'admin'
    const hasPurchased = Array.isArray(userData?.purchasedNotePacks) && userData!.purchasedNotePacks.includes(packId)

    if (!isAdmin && !hasPurchased) {
      return NextResponse.json({ error: 'You have not purchased this Notes Pack' }, { status: 403 })
    }

    const packDoc = await db.collection('notePacks').doc(packId).get()
    if (!packDoc.exists) {
      return NextResponse.json({ error: 'Notes Pack not found' }, { status: 404 })
    }
    const pack = packDoc.data()!
    if (!pack.storagePath) {
      return NextResponse.json({ error: 'No file uploaded for this pack yet' }, { status: 404 })
    }

    const bucket = getAdminStorageBucket()
    const file = bucket.file(pack.storagePath)
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      version: 'v4',
    })

    return NextResponse.json({ url: signedUrl, title: pack.title })
  } catch (e: any) {
    console.error('[NOTEPACK-VIEW-URL] FAILED:', e.message)
    return NextResponse.json({ error: e.message || 'Failed to authorize access' }, { status: 500 })
  }
}
