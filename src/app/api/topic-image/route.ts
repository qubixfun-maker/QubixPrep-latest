export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'

// Caches one Pexels photo per topic name so the Study Feed's Web-Stories-style photo
// backdrops don't call the Pexels API on every single card view (that would burn the
// free-tier rate limit almost immediately with more than a handful of students
// scrolling at once). First student to see a given topic triggers the real API call;
// every student after that reads the cached URL straight from Firestore.
//
// Cache key is a slug of the topic name alone (not subject-scoped) - the same topic
// name ("Hypertension", "Tuberculosis") should get the same backdrop photo everywhere
// it appears, and this keeps the cache small and hit rate high.

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'topic'
}

export async function GET(req: NextRequest) {
  try {
    const topic = req.nextUrl.searchParams.get('topic')?.trim()
    const subject = req.nextUrl.searchParams.get('subject')?.trim() || ''
    if (!topic) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 })
    }

    const db = getAdminFirestore()
    const cacheId = slugify(topic)
    const cacheRef = db.collection('topicImages').doc(cacheId)

    const cached = await cacheRef.get()
    if (cached.exists) {
      const data = cached.data() as any
      return NextResponse.json({ url: data.url, photographer: data.photographer, photographerUrl: data.photographerUrl, cached: true })
    }

    const apiKey = process.env.PEXELS_API_KEY
    if (!apiKey) {
      // No key configured yet - fail soft so the feed still works with its gradient
      // fallback background instead of erroring the whole card out.
      return NextResponse.json({ error: 'PEXELS_API_KEY not configured' }, { status: 200 })
    }

    // A medical-education topic name alone ("Tuberculosis") searched literally tends to
    // return clinical/gross photos that are a poor fit for an immersive story backdrop -
    // biasing the query toward a related but softer visual (the subject name helps too,
    // e.g. "Tuberculosis Physiology" leans toward science-photography results) reads
    // better as a backdrop while still being topically relevant.
    const searchQuery = subject ? `${topic} ${subject} medical science` : `${topic} medical science`

    const pexelsRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=portrait`,
      { headers: { Authorization: apiKey } }
    )

    if (!pexelsRes.ok) {
      return NextResponse.json({ error: `Pexels API error (${pexelsRes.status})` }, { status: 200 })
    }

    const pexelsData = await pexelsRes.json()
    const photo = pexelsData?.photos?.[0]
    if (!photo) {
      // No result for this query - cache a "miss" marker so we don't keep re-querying
      // Pexels for a topic name that just doesn't return photos, but still fail soft.
      await cacheRef.set({ url: null, miss: true, cachedAt: new Date().toISOString() })
      return NextResponse.json({ url: null })
    }

    const url = photo.src?.portrait || photo.src?.large2x || photo.src?.large
    const photographer = photo.photographer || 'Pexels'
    const photographerUrl = photo.photographer_url || 'https://www.pexels.com'

    // Pexels' API terms require crediting the photographer - cached alongside the URL
    // so the feed can render "Photo by {photographer} on Pexels" on each card.
    await cacheRef.set({ url, photographer, photographerUrl, cachedAt: new Date().toISOString() })

    return NextResponse.json({ url, photographer, photographerUrl, cached: false })
  } catch (e: any) {
    // Fail soft, never - the feed's gradient fallback covers this, a missing photo
    // should never block someone from studying.
    return NextResponse.json({ error: e.message || 'Failed to fetch topic image' }, { status: 200 })
  }
}
