import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

function getAdminApp(): App {
  const existing = getApps()
  if (existing.length > 0) return existing[0]!

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set')
  }
  const serviceAccount = JSON.parse(serviceAccountJson)

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp())
}

export function getAdminStorageBucket() {
  return getStorage(getAdminApp()).bucket()
}

/**
 * Verifies a Firebase ID token sent from the client.
 * Returns the decoded token (with .uid) or throws if invalid.
 */
export async function verifyIdToken(idToken: string) {
  return getAdminAuth().verifyIdToken(idToken)
}
