import { useMemo } from 'react'
import { useUser, useDoc, useFirestore } from '@/firebase'
import { doc } from 'firebase/firestore'

export type Plan = 'free' | 'basic' | 'pro'

export function usePlan() {
  const { user } = useUser()
  const db = useFirestore()
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading } = useDoc(profileRef)

  const isAdmin = (profile as any)?.role === 'admin'
  const rawPlan: Plan = (profile as any)?.plan || 'free'
  const planExpiresAt = (profile as any)?.planExpiresAt
  const expired = typeof planExpiresAt === 'number' && planExpiresAt < Date.now()
  const plan: Plan = isAdmin ? 'pro' : (expired ? 'free' : rawPlan)

  return {
    plan,
    expiresAt: typeof planExpiresAt === 'number' ? planExpiresAt : null,
    loading,
    isFree: plan === 'free',
    isBasic: plan === 'basic' || plan === 'pro',
    isPro: plan === 'pro',
    canAccessContent: plan === 'basic' || plan === 'pro',
    canAccessAI: plan === 'pro',
  }
}
