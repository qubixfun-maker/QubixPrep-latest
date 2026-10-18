"use client"

import { useEffect, useMemo, useState, useCallback } from 'react'
import { collection, query, where, doc, onSnapshot, getCountFromServer } from 'firebase/firestore'
import { useFirestore, useUser } from '@/firebase'
import { CARD_FEATURES, getFeature } from '@/lib/quickcards/cardFeatures'
import type { FeatureSettings, QuickCard, CardImageUrls, CardState } from '@/types/quickcards'

/** Visible/gate settings for all features, falling back to the config defaults. */
export function useFeatureSettings() {
  const db = useFirestore()
  const [settings, setSettings] = useState<Record<string, FeatureSettings>>(() =>
    Object.fromEntries(CARD_FEATURES.map((f) => [f.slug, { visible: true, gate: f.defaultGate }]))
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) return
    const unsubs = CARD_FEATURES.map((f) =>
      onSnapshot(
        doc(db, 'quickCardSettings', f.slug),
        (snap) => {
          setSettings((prev) => {
            const d = snap.data() as any
            const next: FeatureSettings = snap.exists()
              ? { visible: d?.visible !== false, gate: ['free', 'basic', 'pro', 'addon'].includes(d?.gate) ? d.gate : f.defaultGate }
              : { visible: true, gate: f.defaultGate }
            return { ...prev, [f.slug]: next }
          })
          setLoading(false)
        },
        () => setLoading(false)
      )
    )
    return () => unsubs.forEach((u) => u())
  }, [db])

  return { settings, loading }
}

/**
 * Cards of one feature. Students only ever ask for published cards (the Firestore rules
 * require it); admins pass includeDrafts to see everything. Sorted by `order` in the browser,
 * so no composite index is needed.
 */
export function useFeatureCards(slug: string, opts?: { includeDrafts?: boolean }) {
  const db = useFirestore()
  const [cards, setCards] = useState<QuickCard[]>([])
  const [loading, setLoading] = useState(true)
  const includeDrafts = !!opts?.includeDrafts

  useEffect(() => {
    if (!db || !getFeature(slug)) return
    setLoading(true)
    const base = collection(db, 'quickCards')
    const q = includeDrafts
      ? query(base, where('feature', '==', slug))
      : query(base, where('feature', '==', slug), where('status', '==', 'published'))
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })) as QuickCard[]
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.cardId.localeCompare(b.cardId, undefined, { numeric: true }))
        setCards(list)
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [db, slug, includeDrafts])

  return { cards, loading }
}

/** Published card count per feature slug, for the hub tiles. */
export function useCardCounts() {
  const db = useFirestore()
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!db) return
    let cancelled = false
    Promise.all(
      CARD_FEATURES.map(async (f) => {
        try {
          const snap = await getCountFromServer(
            query(collection(db, 'quickCards'), where('feature', '==', f.slug), where('status', '==', 'published'))
          )
          return [f.slug, snap.data().count] as const
        } catch {
          return [f.slug, 0] as const
        }
      })
    ).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries))
    })
    return () => { cancelled = true }
  }, [db])

  return counts
}

/** The signed-in student's bookmark / revised flags, keyed by cardId. */
export function useCardStates() {
  const db = useFirestore()
  const { user } = useUser()
  const [states, setStates] = useState<Record<string, CardState>>({})

  useEffect(() => {
    if (!db || !user) { setStates({}); return }
    return onSnapshot(
      collection(db, 'users', user.uid, 'quickCardState'),
      (snap) => {
        setStates(Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as CardState])))
      },
      () => setStates({})
    )
  }, [db, user])

  return states
}

/** Signed image URLs for a feature, fetched from the server (which does the plan check). */
export function useCardImages(slug: string, refreshKey?: number) {
  const { user, loading: userLoading } = useUser()
  const [urls, setUrls] = useState<Record<string, CardImageUrls>>({})
  const [featureAccess, setFeatureAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const idToken = user ? await user.getIdToken() : undefined
      const res = await fetch('/api/quickcards/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, feature: slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load images.')
      setUrls(data.urls || {})
      setFeatureAccess(!!data.featureAccess)
    } catch (e: any) {
      setError(e.message || 'Could not load images.')
    } finally {
      setLoading(false)
    }
  }, [user, slug])

  useEffect(() => {
    if (userLoading) return
    setLoading(true)
    load()
  }, [userLoading, load, refreshKey])

  return useMemo(() => ({ urls, featureAccess, loading, error, reload: load }), [urls, featureAccess, loading, error, load])
}
