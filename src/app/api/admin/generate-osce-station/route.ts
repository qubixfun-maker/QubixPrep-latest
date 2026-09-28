export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { generateOsceStation } from '@/ai/osce-station-generator'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'station'
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, specialty, topic } = await req.json()
    if (!idToken || !specialty?.trim() || !topic?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, specialty, or topic' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const result = await generateOsceStation(specialty.trim(), topic.trim())
    if (result.error || !result.station) {
      return NextResponse.json({ error: result.error || 'Station generation failed' }, { status: 500 })
    }

    const station = result.station
    const stationId = slugify(station.title || topic.trim())

    await db.collection('osceStations').doc(stationId).set({
      ...station,
      specialty: station.specialty || specialty.trim(),
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, stationId, title: station.title })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Station generation failed', stack: e.stack }, { status: 500 })
  }
}
