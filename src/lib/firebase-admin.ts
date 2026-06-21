import * as admin from 'firebase-admin'

export function getAdminDb() {
  if (!admin.apps.length) {
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ''

    // Handles both formats: literal \n escape sequences (common in .env files)
    // and actual newlines (common when pasted directly into Vercel's UI)
    const privateKey = rawKey.includes('\\n')
      ? rawKey.replace(/\\n/g, '\n')
      : rawKey

    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
      throw new Error(
        `Firebase Admin credentials missing. projectId=${!!process.env.FIREBASE_ADMIN_PROJECT_ID}, clientEmail=${!!process.env.FIREBASE_ADMIN_CLIENT_EMAIL}, privateKey=${!!privateKey}`
      )
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    })
  }
  return admin.firestore()
}
