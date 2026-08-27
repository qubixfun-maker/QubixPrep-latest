export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'

export async function DELETE(req: NextRequest) {
  try {
    const { idToken, textbookId } = await req.json()

    if (!idToken || !textbookId) {
      return NextResponse.json({ error: 'Missing idToken or textbookId' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const textbookRef = db.collection('textbooks').doc(textbookId)
    const textbookSnap = await textbookRef.get()
    if (!textbookSnap.exists) {
      return NextResponse.json({ error: 'Textbook not found' }, { status: 404 })
    }

    // recursiveDelete removes the textbook doc AND its chapters subcollection together,
    // so no chapter docs get orphaned behind.
    await db.recursiveDelete(textbookRef)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[TEXTBOOK-DELETE] FAILED:', e)
    return NextResponse.json({ error: e.message || 'Delete failed' }, { status: 500 })
  }
}
