import * as admin from 'firebase-admin'

export function getAdminDb() {
  if (!admin.apps.length) {
    let rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ''

    // Strip wrapping quotes if accidentally included when pasting into Vercel
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.slice(1, -1)
    }

    // Handle both escaped (\n as text) and literal newline formats
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
