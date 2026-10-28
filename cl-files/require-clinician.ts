// Server-side check: is this signed-in user an admin or on an active Clinician plan?
import { getAdminFirestore } from '@/lib/firebase-admin'

export async function isClinician(uid: string): Promise<boolean> {
  const db: any = await getAdminFirestore()
  const snap = await db.collection('users').doc(uid).get()
  const u = snap.data() as any
  if (!u) return false
  if (u.role === 'admin') return true
  if (u.plan !== 'pro') return false
  const exp = Number(u.planExpiresAt || 0)
  return !exp || exp > Date.now()
}
