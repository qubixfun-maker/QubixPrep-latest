export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { getOrMake, readyIds, seedMissing } from '@/ai/osce-library'
import { LIB_SEEDS } from '@/lib/osce/library'

export async function POST(req: NextRequest) {
  try {
    const { idToken, action, id, limit } = await req.json()
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    const decoded = await verifyIdToken(idToken)
    const isAdmin = async () => (await getAdminFirestore().collection('users').doc(decoded.uid).get()).data()?.role === 'admin'

    if (action === 'list') {
      return NextResponse.json({ ready: await readyIds(), admin: await isAdmin() })
    }
    if (action === 'get') {
      if (!LIB_SEEDS.some((s) => s.id === id)) return NextResponse.json({ error: 'Unknown case' }, { status: 404 })
      return NextResponse.json({ brief: await getOrMake(id) })
    }
    if (action === 'seed') {
      if (!(await isAdmin())) return NextResponse.json({ error: 'Admins only' }, { status: 403 })
      return NextResponse.json(await seedMissing(Math.min(Math.max(Number(limit) || 4, 1), 6)))
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Library request failed' }, { status: 500 })
  }
}
